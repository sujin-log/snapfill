from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel
from datetime import datetime
import uuid
import logging
from .config import settings
from .storage import supabase_storage
from .ai_service import ai_service
from PIL import Image
import io

# OCR Engine - Try EasyOCR first, fallback to Tesseract
try:
    import easyocr
    ocr_engine = easyocr.Reader(['ko', 'en'], gpu=False)
    OCR_ENGINE = 'easyocr'
    logger_init = logging.getLogger(__name__)
    logger_init.info("[INFO] Using EasyOCR for OCR")
except ImportError:
    try:
        import pytesseract
        OCR_ENGINE = 'tesseract'
        logger_init = logging.getLogger(__name__)
        logger_init.warning("[WARNING] EasyOCR not installed. Falling back to Tesseract")
    except ImportError:
        OCR_ENGINE = None
        logger_init = logging.getLogger(__name__)
        logger_init.error("[ERROR] No OCR engine available")

logger = logging.getLogger(__name__)
router = APIRouter()


class ClassifyRequest(BaseModel):
    ocr_text: str


class ExtractionResult(BaseModel):
    success: bool
    document_type: str | None = None
    data: dict | None = None
    error: str | None = None


@router.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    """
    문서 이미지 업로드 엔드포인트
    Supabase Storage에 저장하고 DB에 기록

    Args:
        file: 업로드된 이미지 파일 (JPG, PNG)

    Returns:
        {
            "success": bool,
            "document_id": int,
            "file_url": str (성공 시),
            "error": str (실패 시)
        }
    """
    from supabase import create_client

    # 1. 파일 타입 검증
    if file.content_type not in settings.ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"JPG, PNG 형식만 지원합니다. 받은 형식: {file.content_type}",
        )

    # 2. 파일 크기 검증
    file_content = await file.read()
    if len(file_content) > settings.MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"파일 크기는 5MB 이하여야 합니다. 현재: {len(file_content) / 1024 / 1024:.2f}MB",
        )

    # 3. 파일 경로 생성 (날짜/UUID 조합)
    timestamp = datetime.now().strftime("%Y%m%d")
    file_id = str(uuid.uuid4())[:8]
    file_extension = file.filename.split(".")[-1].lower()
    file_path = f"documents/{timestamp}/{file_id}.{file_extension}"

    # 4. Supabase Storage에 업로드
    file_url = supabase_storage.upload_file(
        settings.UPLOAD_BUCKET, file_path, file_content
    )

    if not file_url:
        raise HTTPException(
            status_code=500,
            detail="파일 업로드 중 오류가 발생했습니다",
        )

    # 5. DB에 문서 기록 (Supabase 또는 SQLite)
    try:
        if settings.USE_SQLITE:
            # SQLite 저장
            from sqlalchemy import create_engine
            from sqlalchemy.orm import sessionmaker

            engine = create_engine(settings.DATABASE_URL)
            Session = sessionmaker(bind=engine)
            session = Session()

            from sqlalchemy import Column, Integer, String, DateTime, func
            from sqlalchemy.orm import declarative_base

            Base = declarative_base()

            class Document(Base):
                __tablename__ = "documents"
                id = Column(Integer, primary_key=True)
                filename = Column(String)
                file_path = Column(String)
                file_url = Column(String)
                doc_type = Column(String, nullable=True)
                extracted_fields = Column(String, nullable=True)
                status = Column(String)
                created_at = Column(DateTime, default=func.now())

            Base.metadata.create_all(engine)

            doc = Document(
                filename=file.filename,
                file_path=file_path,
                file_url=file_url,
                doc_type=None,
                extracted_fields=None,
                status="uploaded"
            )
            session.add(doc)
            session.commit()
            document_id = doc.id
            session.close()
            logger.info(f"[OK] Document saved to SQLite: ID={document_id}")
        else:
            # Supabase 저장
            supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_API_KEY)
            db_response = supabase.table("documents").insert({
                "filename": file.filename,
                "file_path": file_path,
                "file_url": file_url,
                "doc_type": None,
                "extracted_fields": None,
                "status": "uploaded"
            }).execute()

            document_id = db_response.data[0]["id"] if db_response.data else None
            logger.info(f"[OK] Document saved to Supabase: ID={document_id}")
    except Exception as e:
        logger.error(f"[ERROR] DB save failed: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"데이터베이스에 문서 정보를 저장할 수 없습니다: {str(e)}",
        )

    # 6. 성공 응답
    return {
        "success": True,
        "document_id": document_id,
        "file_url": file_url,
        "file_path": file_path,
        "original_filename": file.filename,
    }


@router.post("/process")
async def process_document(request: ClassifyRequest):
    """
    완전한 문서 처리 파이프라인
    분류 → 추출 → DB 저장 (한 번에)

    Args:
        request.ocr_text: OCR으로 추출한 텍스트

    Returns:
        {
            "success": bool,
            "document_type": "insurance" | "receipt",
            "data": {...},
            "record_id": int,
            "error": str (실패 시)
        }
    """
    from supabase import create_client

    try:
        if not request.ocr_text or not request.ocr_text.strip():
            raise HTTPException(
                status_code=400,
                detail="OCR 텍스트가 비어있습니다",
            )

        # 1. 문서 분류
        logger.info("[INFO] Classifying document...")
        classification = await ai_service.classify_document(request.ocr_text)
        document_type = classification.get("document_type", "unknown")

        if not document_type or document_type not in ["insurance", "receipt"]:
            raise Exception(f"Unknown document type: {document_type}")

        # 2. 필드 추출
        logger.info(f"[INFO] Extracting {document_type} fields...")
        if document_type == "insurance":
            extracted_data = await ai_service.extract_insurance_fields(request.ocr_text)
        else:
            extracted_data = await ai_service.extract_receipt_fields(request.ocr_text)

        # 3. DB에 저장 (Supabase 또는 SQLite)
        logger.info(f"[INFO] Saving to DB ({document_type})...")

        record_id = None
        if settings.USE_SQLITE:
            # SQLite 저장
            from sqlalchemy import create_engine
            from sqlalchemy.orm import sessionmaker
            from sqlalchemy import Column, Integer, String, Float, DateTime, func
            from sqlalchemy.orm import declarative_base

            engine = create_engine(settings.DATABASE_URL)
            Session = sessionmaker(bind=engine)
            session = Session()

            Base = declarative_base()

            if document_type == "insurance":
                class InsuranceRecord(Base):
                    __tablename__ = "insurance_records"
                    id = Column(Integer, primary_key=True)
                    applicant_name = Column(String)
                    age = Column(Integer, nullable=True)
                    coverage_type = Column(String, nullable=True)
                    medical_history = Column(String, nullable=True)
                    created_at = Column(DateTime, default=func.now())

                Base.metadata.create_all(engine)
                record = InsuranceRecord(
                    applicant_name=extracted_data.get("applicant_name"),
                    age=extracted_data.get("age"),
                    coverage_type=extracted_data.get("coverage_type"),
                    medical_history=extracted_data.get("medical_history"),
                )
                session.add(record)
                session.commit()
                record_id = record.id
                logger.info(f"[OK] Insurance record saved to SQLite: ID={record_id}")

            elif document_type == "receipt":
                class ReceiptRecord(Base):
                    __tablename__ = "receipt_records"
                    id = Column(Integer, primary_key=True)
                    merchant_name = Column(String)
                    total_amount = Column(Float, nullable=True)
                    transaction_date = Column(String, nullable=True)
                    created_at = Column(DateTime, default=func.now())

                Base.metadata.create_all(engine)
                record = ReceiptRecord(
                    merchant_name=extracted_data.get("merchant_name"),
                    total_amount=extracted_data.get("total_amount"),
                    transaction_date=extracted_data.get("transaction_date"),
                )
                session.add(record)
                session.commit()
                record_id = record.id
                logger.info(f"[OK] Receipt record saved to SQLite: ID={record_id}")

            session.close()
        else:
            # Supabase 저장
            supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_API_KEY)

            if document_type == "insurance":
                insurance_record = {
                    "applicant_name": extracted_data.get("applicant_name"),
                    "age": extracted_data.get("age"),
                    "medical_history": extracted_data.get("medical_history"),
                }
                response = supabase.table("insurance_records").insert(insurance_record).execute()
                record_id = response.data[0]["id"] if response.data else None
                logger.info(f"[OK] Insurance record saved to Supabase: ID={record_id}")

            elif document_type == "receipt":
                receipt_record = {
                    "merchant_name": extracted_data.get("merchant_name"),
                    "total_amount": extracted_data.get("total_amount"),
                    "transaction_date": extracted_data.get("transaction_date"),
                }
                response = supabase.table("receipt_records").insert(receipt_record).execute()
                record_id = response.data[0]["id"] if response.data else None
                logger.info(f"[OK] Receipt record saved to Supabase: ID={record_id}")

        return {
            "success": True,
            "document_type": document_type,
            "data": extracted_data,
            "record_id": record_id,
        }

    except Exception as e:
        logger.error(f"❌ 처리 실패: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"문서 처리 중 오류가 발생했습니다: {str(e)}",
        )


@router.post("/classify", response_model=ExtractionResult)
async def classify_document_endpoint(request: ClassifyRequest):
    """
    Gemini API를 사용하여 문서 분류

    Args:
        request.ocr_text: OCR으로 추출한 텍스트

    Returns:
        분류 결과 (insurance/receipt)
    """
    try:
        if not request.ocr_text or not request.ocr_text.strip():
            raise HTTPException(
                status_code=400,
                detail="OCR 텍스트가 비어있습니다",
            )

        result = await ai_service.classify_document(request.ocr_text)
        return {
            "success": True,
            "document_type": result.get("document_type"),
            "data": result,
        }
    except Exception as e:
        logger.error(f"Classification error: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"문서 분류 중 오류가 발생했습니다: {str(e)}",
        )


@router.post("/extract/insurance", response_model=ExtractionResult)
async def extract_insurance_endpoint(request: ClassifyRequest):
    """
    Gemini API를 사용하여 보험 서류에서 필드 추출

    Args:
        request.ocr_text: OCR으로 추출한 텍스트

    Returns:
        추출된 필드 (applicant_name, age, medical_history)
    """
    try:
        if not request.ocr_text or not request.ocr_text.strip():
            raise HTTPException(
                status_code=400,
                detail="OCR 텍스트가 비어있습니다",
            )

        data = await ai_service.extract_insurance_fields(request.ocr_text)
        return {
            "success": True,
            "document_type": "insurance",
            "data": data,
        }
    except Exception as e:
        logger.error(f"Insurance extraction error: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"보험 정보 추출 중 오류가 발생했습니다: {str(e)}",
        )


@router.post("/extract/receipt", response_model=ExtractionResult)
async def extract_receipt_endpoint(request: ClassifyRequest):
    """
    Gemini API를 사용하여 영수증에서 필드 추출

    Args:
        request.ocr_text: OCR으로 추출한 텍스트

    Returns:
        추출된 필드 (merchant_name, total_amount, transaction_date)
    """
    try:
        if not request.ocr_text or not request.ocr_text.strip():
            raise HTTPException(
                status_code=400,
                detail="OCR 텍스트가 비어있습니다",
            )

        data = await ai_service.extract_receipt_fields(request.ocr_text)
        return {
            "success": True,
            "document_type": "receipt",
            "data": data,
        }
    except Exception as e:
        logger.error(f"Receipt extraction error: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"영수증 정보 추출 중 오류가 발생했습니다: {str(e)}",
        )


@router.post("/ocr")
async def extract_ocr(file: UploadFile = File(...)):
    """
    이미지에서 Tesseract OCR로 텍스트 추출

    Args:
        file: 업로드된 이미지 파일 (JPG, PNG)

    Returns:
        {
            "success": bool,
            "ocr_text": str (성공 시),
            "error": str (실패 시)
        }
    """
    try:
        if file.content_type not in settings.ALLOWED_MIME_TYPES:
            raise HTTPException(
                status_code=400,
                detail=f"JPG, PNG 형식만 지원합니다. 받은 형식: {file.content_type}",
            )

        file_content = await file.read()
        if len(file_content) > settings.MAX_FILE_SIZE:
            raise HTTPException(
                status_code=400,
                detail=f"파일 크기는 5MB 이하여야 합니다",
            )

        # OCR 처리 (EasyOCR 또는 Tesseract)
        image = Image.open(io.BytesIO(file_content))

        if OCR_ENGINE == 'easyocr':
            # EasyOCR 사용 (한글 지원 우수)
            try:
                import tempfile
                import os
                # 임시 이미지 파일 저장
                with tempfile.NamedTemporaryFile(suffix='.png', delete=False) as tmp:
                    image.save(tmp.name)
                    temp_image_path = tmp.name

                # EasyOCR 실행
                results = ocr_engine.readtext(temp_image_path)
                ocr_text = '\n'.join([line[1] for line in results if line[1].strip()])

                # 임시 파일 삭제
                os.unlink(temp_image_path)

                logger.info(f"[OK] EasyOCR success: {len(ocr_text)} characters extracted")
            except Exception as e:
                logger.error(f"[ERROR] EasyOCR failed: {e}")
                raise HTTPException(
                    status_code=500,
                    detail=f"OCR 처리 중 오류가 발생했습니다: {str(e)}",
                )
        else:
            # Tesseract 사용 (폴백)
            # 이미지 전처리: 해상도 낮은 이미지 크기 확대
            if image.width < 1000:
                scale_factor = 3 if image.width < 500 else 2
                new_size = (image.width * scale_factor, image.height * scale_factor)
                image = image.resize(new_size, Image.Resampling.LANCZOS)
                logger.info(f"[INFO] Image scaled up by {scale_factor}x for better OCR recognition")

            ocr_text = pytesseract.image_to_string(image, lang='kor+eng')

        if not ocr_text.strip():
            return {
                "success": False,
                "error": "이미지에서 텍스트를 추출하지 못했습니다. 이미지 품질을 확인하세요.",
            }

        logger.info(f"[OK] OCR success: {len(ocr_text)} characters extracted")
        return {
            "success": True,
            "ocr_text": ocr_text,
        }

    except Exception as e:
        logger.error(f"OCR error: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"OCR 처리 중 오류가 발생했습니다: {str(e)}",
        )
