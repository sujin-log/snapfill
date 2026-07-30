# 아키텍처: Mock & Cache 시스템

## 전체 흐름도

```
┌─────────────────────────────────────────────────────────────────┐
│                         FastAPI Route                            │
│              /classify, /extract/insurance, ...                  │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│                      AIService (ai_service.py)                   │
│                                                                   │
│  classify_document(ocr_text)                                     │
│  extract_insurance_fields(ocr_text)                              │
│  extract_receipt_fields(ocr_text)                                │
└─┬──────────────────────────────────────────────────────────────┘
  │
  ├─→ 1️⃣ 캐시 확인 (CACHE=True 시)
  │   ├─→ ✅ Found → Return from cache
  │   └─→ ❌ Not found → Continue
  │
  ├─→ 2️⃣ Mock 모드 확인 (MOCK=True 시)
  │   ├─→ ✅ USE_MOCK=True → Return mock_responses.py
  │   └─→ ❌ USE_MOCK=False → Call real API
  │
  └─→ 3️⃣ 실제 API 호출
      ├─→ Gemini API 호출 (gemini_client.py)
      ├─→ 응답 받음
      └─→ 캐시 저장 (if CACHE=True)
```

---

## 신호 흐름 (Request → Response)

### Mock 모드 (USE_MOCK=True, USE_CACHE=True)
```
Client Request
    ↓
AIService.classify_document()
    ├─→ Check Cache (cache_key = md5(ocr_text))
    │   └─→ Not found (처음이면)
    ├─→ Check USE_MOCK
    │   └─→ True → Return mock_responses.MOCK_CLASSIFICATION
    └─→ Save to Cache
        └─→ /backend/app/.cache/classify_xxxxx.json

Response: {"success": true, "document_type": "insurance", ...}
```

**성능:** ⚡⚡⚡ (즉시 응답, 할당량 0)

---

### 캐시 모드 (USE_MOCK=False, USE_CACHE=True, 캐시 있음)
```
Client Request (same OCR text as before)
    ↓
AIService.classify_document()
    ├─→ Check Cache (cache_key = md5(ocr_text))
    │   └─→ ✅ Found!
    ├─→ Log: "Loaded from cache: classify_xxxxx.json"
    └─→ Return cached result

Response: {"success": true, "document_type": "insurance", ...}
```

**성능:** ⚡⚡ (캐시에서 로드, 할당량 0)

---

### 첫 API 호출 (USE_MOCK=False, USE_CACHE=True, 캐시 없음)
```
Client Request
    ↓
AIService.classify_document()
    ├─→ Check Cache
    │   └─→ ❌ Not found
    ├─→ Check USE_MOCK
    │   └─→ False → Call real API
    ├─→ gemini_client.classify_document(ocr_text)
    │   └─→ API Request → Gemini API → Response
    ├─→ Save to Cache
    │   └─→ /backend/app/.cache/classify_xxxxx.json
    └─→ Return result

Response: {"success": true, "document_type": "insurance", ...}
```

**성능:** ⚡ (네트워크 대기, 할당량 -1)

---

## 파일 구조

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI 앱
│   ├── routes.py            # API 엔드포인트
│   ├── config.py            # Settings (USE_MOCK, USE_CACHE)
│   ├── ai_service.py        # ⭐ Mock/Cache 통합 로직
│   ├── mock_responses.py    # ⭐ Mock 데이터
│   ├── gemini_client.py     # Gemini API 클라이언트
│   ├── storage.py           # Supabase Storage
│   ├── .cache/              # 캐시 디렉토리 (자동생성)
│   │   ├── classify_xxxxx.json
│   │   ├── extract_insurance_xxxxx.json
│   │   └── extract_receipt_xxxxx.json
│   └── __pycache__/
├── run.py                   # 개발 서버 실행
├── dev_test.py              # 개발 테스트
├── test_gemini.py           # Gemini API 테스트
└── list_models.py           # 사용 가능한 모델 목록
```

---

## 설정 옵션

### 환경 변수 (.env.local)

```env
# 개발 초기 (UI 개발)
USE_MOCK=True
USE_CACHE=True

# API 테스트
USE_MOCK=False
USE_CACHE=True

# 프로덕션
USE_MOCK=False
USE_CACHE=True
GEMINI_API_KEY=AIzaSy...
```

### config.py에서의 로드

```python
class Settings:
    USE_MOCK: bool = os.getenv("USE_MOCK", "False").lower() == "true"
    USE_CACHE: bool = os.getenv("USE_CACHE", "True").lower() == "true"
```

---

## AIService 클래스 상세

### 초기화

```python
from app.ai_service import AIService

# 기본 (설정에서 로드)
from app.ai_service import ai_service

# 또는 직접 생성
service = AIService(use_mock=True, use_cache=True)
```

### 메서드

```python
async def classify_document(ocr_text: str) -> dict:
    """
    캐시 → Mock 확인 → API 호출 순서로 처리
    
    Returns:
        {
            "document_type": "insurance" | "receipt",
            "confidence": float (0-1),
            "reason": str
        }
    """

async def extract_insurance_fields(ocr_text: str) -> dict:
    """
    보험 필드 추출
    
    Returns:
        {
            "applicant_name": str,
            "age": int | null,
            "medical_history": str | null
        }
    """

async def extract_receipt_fields(ocr_text: str) -> dict:
    """
    영수증 필드 추출
    
    Returns:
        {
            "merchant_name": str,
            "total_amount": float | null,
            "transaction_date": str | null
        }
    """
```

---

## 캐시 키 생성 로직

```python
def _get_cache_key(text: str, operation: str) -> str:
    """
    텍스트의 MD5 해시를 기반으로 캐시 키 생성
    
    Example:
        text = "INSURANCE APPLICATION..."
        operation = "classify"
        md5_hash = "29a931926e78d33fc181d34334aad88b"
        cache_key = "classify_29a931926e78d33fc181d34334aad88b.json"
    """
    text_hash = hashlib.md5(text.encode()).hexdigest()
    return f"{operation}_{text_hash}.json"
```

**이점:**
- 같은 콘텐츠 → 항상 같은 파일
- 다른 콘텐츠 → 다른 파일
- 충돌 불가능

---

## 로깅

### AIService 로그 출력

```python
import logging
logger = logging.getLogger(__name__)

# Mock 사용
logger.info("Using mock response for classification")

# 캐시 로드
logger.info("Loaded from cache: classify_xxxxx.json")

# 캐시 저장
logger.info("Saved to cache: classify_xxxxx.json")

# API 에러
logger.error("Classification failed: 429 You exceeded quota")
```

### 로그 확인
```bash
# 개발 서버 로그에서 확인
DEBUG:     Host binding to ['127.0.0.1', '::1']
INFO:root:Using mock response for classification
INFO:root:Loaded from cache: classify_xxxxx.json
ERROR:root:Classification failed: ...
```

---

## 성능 비교

| 시나리오 | 모드 | 할당량 | 응답시간 | 용도 |
|---------|------|--------|---------|------|
| 첫 테스트 | Mock | 0 | 1ms | UI 개발 |
| 반복 테스트 | Cache | 0 | 5ms | 개발 |
| API 검증 | API | 1 | 500ms | 배포 전 |
| 프로덕션 | Cache | 필요시 | 5ms | 실제 사용 |

---

## 예시 워크플로우

### 1. Mock으로 UI 개발
```
1️⃣ npm start (프론트엔드)
2️⃣ python -m uvicorn app.main:app --reload (백엔드)
3️⃣ 문서 업로드 → Mock 응답 사용
4️⃣ UI 수정 반복
```

### 2. 캐시로 테스트
```
1️⃣ .env.local USE_MOCK=False
2️⃣ 첫 테스트 → API 호출 (할당량 -1)
3️⃣ 같은 문서 재테스트 → 캐시 사용 (할당량 0)
4️⃣ 반복 테스트 가능
```

### 3. 프로덕션 배포
```
1️⃣ 캐시는 유지 (USE_CACHE=True)
2️⃣ Mock 비활성화 (USE_MOCK=False)
3️⃣ 실제 API 호출 (필요시만)
4️⃣ 동일 문서 빠른 처리 (캐시)
```

---

## 확장 포인트

### Mock 응답 추가
```python
# mock_responses.py에 추가
MOCK_INVOICE_EXTRACTION = {
    "invoice_number": "INV-2026-001",
    "vendor_name": "ABC Corp",
    "amount": 1000.00
}
```

### 캐시 백업
```python
# 캐시를 JSON으로 내보내기
import shutil
shutil.copytree("backend/app/.cache", "cache_backup")
```

### 캐시 통계
```python
from pathlib import Path
cache_dir = Path("backend/app/.cache")
print(f"Cached items: {len(list(cache_dir.glob('*.json')))}")
print(f"Cache size: {sum(f.stat().st_size for f in cache_dir.glob('*.json'))} bytes")
```

---

**마지막 업데이트:** 2026-07-31
