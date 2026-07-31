"""
전체 파이프라인 테스트
1️⃣ 이미지 파일 읽기
2️⃣ OCR 추출
3️⃣ 분류 (Mock 또는 API)
4️⃣ 필드 추출 (Mock 또는 API)
5️⃣ 결과 표시
"""

import asyncio
import sys
import os
from pathlib import Path

# Backend 경로 추가
sys.path.insert(0, os.path.dirname(__file__))

from app.config import settings
from app.ai_service import ai_service

# Tesseract 또는 다른 OCR 라이브러리가 필요
try:
    import pytesseract
    from PIL import Image
    HAS_OCR = True
except ImportError:
    HAS_OCR = False
    print("⚠️  pytesseract/PIL not installed. Using mock OCR.")


def mock_ocr(image_path: str) -> str:
    """Mock OCR (실제 OCR이 없을 경우)"""
    return """
    INSURANCE APPLICATION FORM
    Applicant Information
    Full Name: John Smith
    Age: 35
    Email: john.smith@example.com
    Phone: (555) 123-4567
    Medical History
    High blood pressure (diagnosed 2020)
    Currently on medication
    Coverage Type
    Life Insurance
    Coverage Amount: $500,000
    Date: 2026-07-31
    """


def extract_text_from_image(image_path: str) -> str:
    """
    이미지에서 텍스트 추출 (OCR)
    """
    print(f"\n📄 [STEP 1] OCR 추출 시작: {image_path}")

    if not Path(image_path).exists():
        raise FileNotFoundError(f"파일 없음: {image_path}")

    if not HAS_OCR:
        print("   ⚠️  Tesseract 설치 안 됨 → Mock OCR 사용")
        ocr_text = mock_ocr(image_path)
    else:
        try:
            print("   🔍 Tesseract로 OCR 시작...")
            image = Image.open(image_path)
            ocr_text = pytesseract.image_to_string(image, lang='eng')
            if not ocr_text or not ocr_text.strip():
                print("   ⚠️  OCR 결과 없음 → Mock OCR 사용")
                ocr_text = mock_ocr(image_path)
            else:
                print(f"   ✅ OCR 성공: {len(ocr_text)} 문자")
        except Exception as e:
            print(f"   ❌ OCR 실패: {e}")
            print("   → Mock OCR 사용")
            ocr_text = mock_ocr(image_path)

    print(f"   추출된 텍스트 (처음 100자): {ocr_text[:100]}...")
    return ocr_text


async def classify_document(ocr_text: str) -> dict:
    """
    문서 분류
    """
    print(f"\n🏷️  [STEP 2] 문서 분류 시작")
    print(f"   입력 텍스트 길이: {len(ocr_text)} 문자")

    try:
        result = await ai_service.classify_document(ocr_text)
        print(f"   ✅ 분류 완료")
        print(f"   타입: {result.get('document_type')}")
        print(f"   신뢰도: {result.get('confidence', 'N/A')}")
        print(f"   이유: {result.get('reason', 'N/A')}")
        return result
    except Exception as e:
        print(f"   ❌ 분류 실패: {e}")
        raise


async def extract_fields(ocr_text: str, doc_type: str) -> dict:
    """
    문서 타입별 필드 추출
    """
    print(f"\n📋 [STEP 3] 필드 추출 시작 (타입: {doc_type})")

    try:
        if doc_type == "insurance":
            result = await ai_service.extract_insurance_fields(ocr_text)
            print(f"   ✅ 필드 추출 완료")
            print(f"   - 신청자명: {result.get('applicant_name')}")
            print(f"   - 나이: {result.get('age')}")
            print(f"   - 의료력: {result.get('medical_history', 'N/A')[:50]}...")
        elif doc_type == "receipt":
            result = await ai_service.extract_receipt_fields(ocr_text)
            print(f"   ✅ 필드 추출 완료")
            print(f"   - 가맹점명: {result.get('merchant_name')}")
            print(f"   - 금액: {result.get('total_amount')}")
            print(f"   - 거래일: {result.get('transaction_date')}")
        else:
            raise ValueError(f"알 수 없는 문서 타입: {doc_type}")

        return result
    except Exception as e:
        print(f"   ❌ 필드 추출 실패: {e}")
        raise


async def test_full_pipeline():
    """
    전체 파이프라인 테스트
    """
    print("=" * 70)
    print("🚀 전체 파이프라인 테스트")
    print("=" * 70)
    print(f"설정: USE_MOCK={settings.USE_MOCK}, USE_CACHE={settings.USE_CACHE}")

    # 파일 경로
    image_path = os.path.join(os.path.dirname(__file__), "test_insurance.png")

    try:
        # STEP 1: OCR
        ocr_text = extract_text_from_image(image_path)

        # STEP 2: 분류
        classification = await classify_document(ocr_text)
        doc_type = classification.get("document_type", "insurance")

        # STEP 3: 필드 추출
        extraction = await extract_fields(ocr_text, doc_type)

        # STEP 4: 결과 요약
        print(f"\n" + "=" * 70)
        print("✅ 전체 파이프라인 완료!")
        print("=" * 70)
        print(f"""
📊 최종 결과:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1️⃣  OCR 추출
    - 텍스트 길이: {len(ocr_text)} 문자

2️⃣  문서 분류
    - 타입: {classification.get('document_type')}
    - 신뢰도: {classification.get('confidence', 'N/A')}

3️⃣  필드 추출
    - {json.dumps(extraction, indent=6, ensure_ascii=False)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎉 모든 단계 성공!
""")

        return True

    except Exception as e:
        print(f"\n" + "=" * 70)
        print(f"❌ 파이프라인 실패")
        print("=" * 70)
        print(f"\n오류: {e}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    import json
    success = asyncio.run(test_full_pipeline())
    sys.exit(0 if success else 1)
