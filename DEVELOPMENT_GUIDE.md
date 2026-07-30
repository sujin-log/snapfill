# Development Guide: Mock & Cache System

할당량 낭비 없이 UI를 개발하고 테스트하기 위한 가이드입니다.

## 📋 목차
1. [개발 모드 실행](#개발-모드-실행)
2. [캐시 시스템](#캐시-시스템)
3. [Mock 응답](#mock-응답)
4. [실제 API로 전환](#실제-api로-전환)

---

## 개발 모드 실행

### 옵션 1: Mock 모드 (권장 - UI 개발 초기 단계)

**특징:**
- API 호출 없음
- 할당량 소비 없음
- 즉시 응답
- 일관된 테스트 데이터

**방법:**
```bash
# .env.local에 추가
USE_MOCK=True
USE_CACHE=True
```

**확인:**
```bash
python backend/dev_test.py
```

**결과:**
```
✅ All tests completed!

TEST 1: Mock Mode (No API Calls)
📄 Classifying insurance document...
Result: {'document_type': 'insurance', 'confidence': 0.95, ...}
```

---

### 옵션 2: 캐시 모드 (API 한 번만 호출)

**특징:**
- 첫 번째 API 호출: 실제 Gemini API 사용
- 그 이후: 캐시에서 로드
- 같은 이미지 반복 테스트 시 할당량 절약

**방법:**
```bash
# .env.local에 설정
USE_MOCK=False
USE_CACHE=True
```

**동작:**
```
API 호출 1: 텍스트 "INSURANCE APPLICATION..." → Gemini API (할당량 -1)
           ↓ 결과를 cache/classify_xxxxx.json 저장

API 호출 2: 동일 텍스트 → cache/classify_xxxxx.json 로드 (할당량 0)
```

---

### 옵션 3: 캐시 비활성화 (테스트용)

```bash
USE_CACHE=False
USE_MOCK=False
```

**주의:** 할당량이 빠르게 소비됩니다!

---

## 캐시 시스템

### 캐시 파일 위치
```
backend/app/.cache/
├── classify_29a931926e78d33fc181d34334aad88b.json
├── extract_insurance_xxxxx.json
└── extract_receipt_xxxxx.json
```

### 캐시 키 생성
```python
# 텍스트의 MD5 해시 기반
text_hash = md5("INSURANCE APPLICATION...".encode()).hexdigest()
cache_key = f"classify_{text_hash}.json"  # 예: classify_29a9319...json
```

**이점:**
- 같은 콘텐츠 → 항상 같은 캐시 파일
- 다른 콘텐츠 → 다른 캐시 파일
- 자동 캐시 비중복

### 캐시 보기
```bash
# Windows PowerShell
dir backend/app/.cache/

# Linux/Mac
ls -la backend/app/.cache/
```

### 캐시 삭제
```bash
# 모든 캐시 삭제
rm -r backend/app/.cache/*

# 또는 수동으로 삭제
rm backend/app/.cache/classify_*.json
```

---

## Mock 응답

### Mock 응답 파일
`backend/app/mock_responses.py`

```python
MOCK_CLASSIFICATION = {
    "document_type": "insurance",
    "confidence": 0.95,
    "reason": "Contains typical insurance form elements..."
}

MOCK_INSURANCE_EXTRACTION = {
    "applicant_name": "John Smith",
    "age": 35,
    "medical_history": "High blood pressure (diagnosed 2020)..."
}

MOCK_RECEIPT_EXTRACTION = {
    "merchant_name": "Starbucks Coffee Shop",
    "total_amount": 5.50,
    "transaction_date": "2026-07-31"
}
```

### Mock 응답 수정
UI 테스트를 위해 mock_responses.py 편집:

```python
# 보험 서류 Mock 응답 수정
MOCK_INSURANCE_EXTRACTION = {
    "applicant_name": "Jane Doe",
    "age": 28,
    "medical_history": "Diabetes type 2, well-controlled with medication"
}
```

**주의:** Mock 모드에서 항상 같은 응답을 반환합니다.

---

## 실제 API로 전환

### 단계 1: 환경 변수 설정
```bash
# .env.local
USE_MOCK=False
USE_CACHE=True
GEMINI_API_KEY=AIzaSy...  # 기존 키 확인
```

### 단계 2: 할당량 확인
[Google AI Studio - Rate Limits](https://aistudio.google.com/app/apikey)에서 확인

### 단계 3: 첫 실행 테스트
```bash
python backend/test_gemini.py
```

**성공:**
```
✓ GEMINI_API_KEY loaded: True
  Key prefix: AIzaSyAFD8I1vaJdbEQm...

✅ SUCCESS! Gemini API responded:
  Document Type: insurance
  Confidence: 0.95
  Reason: ...
```

**할당량 초과:**
```
❌ ERROR: ResourceExhausted
  429 You exceeded your current quota...
```
→ Mock 모드로 돌아가기

---

## 개발 워크플로우

### 1️⃣ **UI 개발 (Mock 모드)**
```bash
# .env.local
USE_MOCK=True
USE_CACHE=True
```
- 할당량 소비 없음
- 빠른 반복 개발
- 다양한 UI 시나리오 테스트

### 2️⃣ **캐시로 API 검증 (Cache 모드)**
```bash
# .env.local
USE_MOCK=False
USE_CACHE=True
```
- 실제 API 응답 한 번 받기
- 캐시에서 반복 테스트
- 할당량 절약

### 3️⃣ **프로덕션 (Cache 모드)**
```bash
# .env.local
USE_MOCK=False
USE_CACHE=True
```
- 실제 사용자 문서 처리
- 캐시로 동일 문서 빠른 처리

---

## 프로그래매틱 사용

### Python에서 직접 사용
```python
from app.ai_service import AIService

# Mock 모드
service = AIService(use_mock=True, use_cache=False)
result = await service.classify_document(ocr_text)

# Cache 모드
service = AIService(use_mock=False, use_cache=True)
result = await service.classify_document(ocr_text)
```

### FastAPI 엔드포인트 (자동 적용)
```bash
# Mock 모드로 실행
USE_MOCK=True python -m uvicorn app.main:app --reload

# 테스트 요청
curl -X POST http://localhost:8000/classify \
  -H "Content-Type: application/json" \
  -d '{"ocr_text": "INSURANCE APPLICATION..."}'
```

**응답:**
```json
{
  "success": true,
  "document_type": "insurance",
  "data": {
    "document_type": "insurance",
    "confidence": 0.95,
    "reason": "..."
  }
}
```

---

## 팁 & 트러블슈팅

### ❓ "캐시가 생성되지 않음"
→ 캐시 디렉토리 확인
```bash
# 디렉토리 생성 자동화됨
# backend/app/.cache/ 존재 확인
ls -la backend/app/.cache/
```

### ❓ "Mock 응답을 다르게 하고 싶어요"
→ `backend/app/mock_responses.py` 편집 후 서버 재시작

### ❓ "이전 캐시를 사용하고 싶지 않음"
→ 캐시 디렉토리 삭제
```bash
rm -r backend/app/.cache/*
```

### ❓ "실제 API 호출이 되는지 확인하고 싶어요"
→ 로그 확인
```python
# app/ai_service.py에서 로그 출력
logger.info("Loaded from cache: ...")  # 캐시에서 로드
logger.info("Using mock response...")  # Mock 사용
logger.error("Classification failed...")  # API 실패
```

---

## 요약 테이블

| 모드 | Mock | Cache | 할당량 | 속도 | 사용 시기 |
|------|------|-------|--------|------|----------|
| 개발 초기 | ✅ | ✅ | 0 | ⚡⚡⚡ | UI 개발 |
| API 검증 | ❌ | ✅ | 1회 | ⚡⚡ | 첫 테스트 |
| 반복 테스트 | ❌ | ✅ | 0 (캐시 후) | ⚡⚡ | 캐시 재사용 |
| 프로덕션 | ❌ | ✅ | 필요시 | ⚡ | 실제 사용 |

---

**마지막 업데이트:** 2026-07-31
