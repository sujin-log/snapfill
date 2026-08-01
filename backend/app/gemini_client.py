from google import genai
from google.genai.errors import ClientError
from .config import settings
import json
import logging
import asyncio

logger = logging.getLogger(__name__)

if settings.GEMINI_API_KEY:
    client = genai.Client(api_key=settings.GEMINI_API_KEY)
    model_id = "gemini-flash-lite-latest"
else:
    logger.warning("GEMINI_API_KEY not configured")
    client = None
    model_id = None


async def _api_call_with_retry(api_func, *args, max_retries=2, retry_delay=2.5, **kwargs):
    """
    API 호출 재시도 로직

    - 503 에러: 2~3초 대기 후 1~2회 자동 재시도
    - 429 에러: 재시도 없이 바로 에러 반환
    - 기타 에러: 재시도 없이 바로 에러 반환

    Args:
        api_func: 호출할 API 함수
        max_retries: 최대 재시도 횟수 (기본 2회)
        retry_delay: 재시도 전 대기 시간 초 (기본 2.5초)
    """
    for attempt in range(max_retries + 1):
        try:
            return api_func(*args, **kwargs)
        except ClientError as e:
            error_code = e.status

            # 429 에러(할당량 초과): 즉시 에러 반환
            if error_code == 429:
                logger.error(f"429 Quota exceeded - not retrying. Error: {e}")
                raise

            # 503 에러(서비스 이용 불가): 재시도
            elif error_code == 503:
                if attempt < max_retries:
                    wait_time = retry_delay + (attempt * 0.5)  # 2.5초, 3초, 3.5초...
                    logger.warning(f"503 Service unavailable on attempt {attempt + 1}. Retrying in {wait_time}s...")
                    await asyncio.sleep(wait_time)
                    continue
                else:
                    logger.error(f"503 Service unavailable - max retries ({max_retries}) exceeded")
                    raise

            # 기타 에러: 즉시 에러 반환
            else:
                logger.error(f"API error (status {error_code}): {e}")
                raise
        except Exception as e:
            logger.error(f"Unexpected error: {e}")
            raise


async def classify_document(ocr_text: str) -> dict:
    """
    Gemini API를 사용하여 문서 타입 분류 (재시도 로직 포함)

    Args:
        ocr_text: OCR으로 추출한 텍스트

    Returns:
        {
            "document_type": "insurance" | "receipt",
            "confidence": float (0-1),
            "reason": str
        }
    """
    if not client:
        raise ValueError("Gemini API key not configured")

    prompt = f"""You are a document classification expert. Analyze the following OCR extracted text and classify it as either an insurance document or a receipt.

Document Text:
{ocr_text}

Classification Guidelines:
- Insurance: Application forms, policy documents, coverage details, policyholder information, medical questions
- Receipt: Purchase transactions, merchant names, amounts, dates, itemized purchases, payment methods

Respond ONLY with valid JSON (no markdown, no code blocks):
{{
    "document_type": "insurance" or "receipt",
    "confidence": a number between 0.0 and 1.0,
    "reason": "brief explanation for classification"
}}"""

    try:
        response = await _api_call_with_retry(
            client.models.generate_content,
            model=model_id,
            contents=prompt
        )
        response_text = response.text.strip()

        # JSON 파싱 (마크다운 코드블록 제거)
        if "```json" in response_text:
            response_text = response_text.split("```json")[1].split("```")[0].strip()
        elif "```" in response_text:
            response_text = response_text.split("```")[1].split("```")[0].strip()

        result = json.loads(response_text)
        return result
    except json.JSONDecodeError as e:
        logger.error(f"JSON parsing error: {e}, Response: {response_text}")
        raise ValueError(f"Failed to parse Gemini response as JSON")
    except Exception as e:
        logger.error(f"Classification failed: {e}")
        raise


async def extract_insurance_fields(ocr_text: str) -> dict:
    """
    보험 서류에서 필드 추출 (재시도 로직 포함)

    Args:
        ocr_text: OCR으로 추출한 텍스트

    Returns:
        {
            "applicant_name": str,
            "age": int | null,
            "medical_history": str | null
        }
    """
    if not client:
        raise ValueError("Gemini API key not configured")

    prompt = f"""Extract insurance application information from the following OCR text.

Document Text:
{ocr_text}

Extract the following fields and return ONLY valid JSON (no markdown, no code blocks):
- applicant_name: Full name of the applicant (required, string)
- age: Age of the applicant (optional, integer, use null if not found)
- coverage_type: Type of insurance coverage (e.g., Life Insurance, Health Insurance, Auto Insurance) (optional, string, use null if not found)
- medical_history: Medical history or health conditions mentioned (optional, string, use null if not found)

Example response:
{{
    "applicant_name": "John Smith",
    "age": 35,
    "coverage_type": "Life Insurance",
    "medical_history": "History of hypertension"
}}

Return only the JSON object:"""

    try:
        response = await _api_call_with_retry(
            client.models.generate_content,
            model=model_id,
            contents=prompt
        )
        response_text = response.text.strip()

        # JSON 파싱 (마크다운 코드블록 제거)
        if "```json" in response_text:
            response_text = response_text.split("```json")[1].split("```")[0].strip()
        elif "```" in response_text:
            response_text = response_text.split("```")[1].split("```")[0].strip()

        result = json.loads(response_text)
        return result
    except json.JSONDecodeError as e:
        logger.error(f"JSON parsing error: {e}, Response: {response_text}")
        raise ValueError(f"Failed to parse insurance extraction response as JSON")
    except Exception as e:
        logger.error(f"Insurance extraction failed: {e}")
        raise


async def extract_receipt_fields(ocr_text: str) -> dict:
    """
    영수증에서 필드 추출 (재시도 로직 포함)

    Args:
        ocr_text: OCR으로 추출한 텍스트

    Returns:
        {
            "merchant_name": str,
            "total_amount": float | null,
            "transaction_date": str | null
        }
    """
    if not client:
        raise ValueError("Gemini API key not configured")

    prompt = f"""Extract receipt/transaction information from the following OCR text.

Document Text:
{ocr_text}

Extract the following fields and return ONLY valid JSON (no markdown, no code blocks):
- merchant_name: Name of the merchant/store (required, string)
- total_amount: Total transaction amount as a number (optional, float, use null if not found)
- transaction_date: Date of transaction in YYYY-MM-DD format (optional, string, use null if not found or cannot parse)

Example response:
{{
    "merchant_name": "Starbucks Coffee Shop",
    "total_amount": 5.50,
    "transaction_date": "2026-07-31"
}}

Return only the JSON object:"""

    try:
        response = await _api_call_with_retry(
            client.models.generate_content,
            model=model_id,
            contents=prompt
        )
        response_text = response.text.strip()

        # JSON 파싱 (마크다운 코드블록 제거)
        if "```json" in response_text:
            response_text = response_text.split("```json")[1].split("```")[0].strip()
        elif "```" in response_text:
            response_text = response_text.split("```")[1].split("```")[0].strip()

        result = json.loads(response_text)
        return result
    except json.JSONDecodeError as e:
        logger.error(f"JSON parsing error: {e}, Response: {response_text}")
        raise ValueError(f"Failed to parse receipt extraction response as JSON")
    except Exception as e:
        logger.error(f"Receipt extraction failed: {e}")
        raise
