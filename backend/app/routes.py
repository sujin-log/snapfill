from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel
from datetime import datetime
import uuid
import logging
from .config import settings
from .storage import supabase_storage
from .ai_service import ai_service

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
    Supabase Storage에 저장하고 URL 반환

    Args:
        file: 업로드된 이미지 파일 (JPG, PNG)

    Returns:
        {
            "success": bool,
            "file_url": str (성공 시),
            "error": str (실패 시)
        }
    """
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

    # 5. 성공 응답
    return {
        "success": True,
        "file_url": file_url,
        "file_path": file_path,
        "original_filename": file.filename,
    }


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
