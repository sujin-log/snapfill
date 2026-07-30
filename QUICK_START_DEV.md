# 🚀 Quick Start: Mock & Cache Development

할당량 낭비 없이 바로 개발 시작하기

## 현재 설정 ✅

`.env.local` 파일에 이미 다음이 설정되어 있습니다:

```env
USE_MOCK=True      # Mock 응답 사용 (API 호출 없음)
USE_CACHE=True     # 응답 캐싱 활성화
```

## 즉시 실행 가능

### 1. 백엔드 시작
```bash
cd backend
python -m uvicorn app.main:app --reload
```

**결과:**
```
INFO:     Application startup complete
```

### 2. 테스트 요청 (다른 터미널)
```bash
curl -X POST http://localhost:8000/classify \
  -H "Content-Type: application/json" \
  -d '{"ocr_text": "INSURANCE APPLICATION FORM\nApplicant Name: John Smith"}'
```

**응답:**
```json
{
  "success": true,
  "document_type": "insurance",
  "data": {
    "document_type": "insurance",
    "confidence": 0.95,
    "reason": "Contains typical insurance form elements..."
  }
}
```

### 3. 프론트엔드 시작
```bash
npm install
npm start  # http://localhost:3000
```

---

## 개발 흐름

```
┌─────────────────────────────────────┐
│  Mock Mode로 UI 빠르게 개발          │
│  (할당량 소비 0, 속도 ⚡⚡⚡)        │
└──────────┬──────────────────────────┘
           │
           ↓
┌─────────────────────────────────────┐
│  실제 API 한 번 테스트              │
│  (.env.local USE_MOCK=False)        │
│  (할당량 소비 1회만)                 │
└──────────┬──────────────────────────┘
           │
           ↓
┌─────────────────────────────────────┐
│  캐시로 반복 테스트                  │
│  (할당량 소비 0, 속도 ⚡⚡)         │
└──────────┬──────────────────────────┘
           │
           ↓
┌─────────────────────────────────────┐
│  프로덕션 배포                       │
│  (USE_MOCK=False, USE_CACHE=True)  │
└─────────────────────────────────────┘
```

---

## 현재 기능

✅ **Mock 모드**: 실제 API 호출 없이 개발  
✅ **캐싱**: 같은 입력은 캐시에서 로드  
✅ **로깅**: 캐시/Mock 사용 여부 자동 로깅  
✅ **에러 처리**: API 실패 시 자동 폴백  

---

## Mock 응답 수정

`backend/app/mock_responses.py` 편집:

```python
# 보험 서류 응답
MOCK_INSURANCE_EXTRACTION = {
    "applicant_name": "Your Name",
    "age": 30,
    "medical_history": "Your condition"
}

# 영수증 응답
MOCK_RECEIPT_EXTRACTION = {
    "merchant_name": "Your Store",
    "total_amount": 10.00,
    "transaction_date": "2026-07-31"
}
```

서버 재시작 후 자동으로 적용됨

---

## 실제 API로 전환

준비 완료되면:

```bash
# .env.local 편집
USE_MOCK=False      # API 사용
USE_CACHE=True      # 캐시 유지
```

그러면:
1. 첫 요청 → Gemini API 호출 (할당량 -1)
2. 같은 입력 → 캐시에서 로드 (할당량 0)

---

## 캐시 상태 확인

```bash
# 캐시 파일 보기
ls backend/app/.cache/

# 캐시 삭제
rm -r backend/app/.cache/*
```

---

## 주요 파일

| 파일 | 용도 |
|------|------|
| `backend/app/ai_service.py` | Mock/Cache 통합 로직 |
| `backend/app/mock_responses.py` | Mock 응답 데이터 |
| `backend/app/routes.py` | API 엔드포인트 |
| `backend/dev_test.py` | 개발 테스트 스크립트 |
| `.env.local` | 설정 (Mock/Cache 모드) |

---

## 문제 해결

**"Mock 응답이 안 바뀌어요"**
→ 서버 재시작: `Ctrl+C` → 다시 실행

**"캐시를 초기화하고 싶어요"**
→ `rm -r backend/app/.cache/*`

**"로그가 안 보여요"**
→ Flask 로그 활성화: `DEBUG=true` 추가

---

**다음 단계:** 자세한 내용은 [DEVELOPMENT_GUIDE.md](./DEVELOPMENT_GUIDE.md) 참고
