# SnapFill

**AI-Powered Document Classification & Field Extraction**

**Live Demo**: https://snapfill-nine.vercel.app/

---

## 🚀 개요

SnapFill은 보험 신청서나 영수증 사진을 업로드하면, AI가 자동으로 문서를 분류하고 핵심 정보를 추출해주는 서비스입니다.

### 주요 기능

- 📸 **문서 업로드** - JPG/PNG 이미지 드래그 앤 드롭
- 🤖 **자동 분류** - AI가 보험/영수증 구분
- 📊 **필드 추출** - 신청자명, 나이, 보험종류, 의료이력 / 상호명, 금액, 거래일 등 자동 추출
- 💾 **결과 저장** - Supabase에 구조화된 데이터 저장

---

## 🏗️ 기술 스택

| 계층 | 기술 |
|------|------|
| **프론트엔드** | Next.js 14, TypeScript, Tailwind CSS |
| **백엔드** | FastAPI, Python 3.9+ |
| **OCR** | Tesseract (한글/영문 지원, 메모리 효율적) |
| **AI** | Google Gemini API |
| **DB/Storage** | Supabase (PostgreSQL) |

---

## 📋 시스템 아키텍처

```
User Upload (Image)
        ↓
   Frontend (Next.js)
   ├─ File Validation
   ├─ Image Preview
        ↓
   Backend (FastAPI)
   ├─ OCR (Tesseract)
   ├─ Classification (Gemini AI)
   ├─ Field Extraction (Gemini AI)
   ├─ Save to DB (Supabase)
        ↓
   Frontend Display Results
```

---

## 🔧 설치 & 실행

### 사전 요구사항
- Node.js 18+
- Python 3.9+

### 환경 변수 설정

**`.env.local` (프론트엔드)**
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**`backend/.env` (백엔드)**
```env
# Supabase 설정 (필수)
SUPABASE_URL=your_supabase_url
SUPABASE_API_KEY=your_supabase_secret_key

# AI API 설정 (필수)
GEMINI_API_KEY=your_gemini_api_key

# 선택사항
USE_MOCK=False
USE_CACHE=True
USE_SQLITE=False
DATABASE_URL=sqlite:///./snapfill.db
ENVIRONMENT=development
HOST=0.0.0.0
PORT=8000
DEBUG=False
LOG_LEVEL=INFO
```

### 로컬 개발

```bash
# 프론트엔드 (터미널 1)
npm install
npm run dev
# http://localhost:3000

# 백엔드 (터미널 2)
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python -m uvicorn app.main:app --reload
# http://localhost:8000
```

---

## 🚀 배포

### Vercel (프론트엔드)
- GitHub 연결 후 자동 배포
- 환경변수: `NEXT_PUBLIC_API_BASE_URL`을 배포된 백엔드 URL로 설정

### Render (백엔드)
- GitHub 연결 후 자동 배포
- Dockerfile로 자동 컨테이너 빌드

---

## 🧪 테스트

### 테스트 이미지

프로젝트의 `test_samples/` 디렉토리에 미리 준비된 테스트 이미지들이 있습니다:

**보험 신청서**:
- `insurance_mock.png` - 기본 보험 신청서
- `insurance_mock2.png` - 보험 신청서 (변형 1)
- `insurance_mock3.png` - 보험 신청서 (변형 2)
- `insurance_v2_4_fire.png` - 화재보험 신청서

**영수증**:
- `receipt_1_basic.png` - 기본 영수증
- `receipt_2_merchant.png` - 상인용 영수증
- `receipt_3_itemized.png` - 상세 항목 영수증
- `receipt_4_bookstore.png` - 서점 영수증

### 로컬 테스트

#### 방법 1: 웹 UI 테스트
1. 프론트엔드/백엔드 모두 실행 중인 상태 확인
2. `http://localhost:3000` 열기
3. "지금 시작하세요" 섹션에서 `test_samples/` 폴더의 이미지 선택
4. 업로드하고 결과 확인

#### 방법 2: cURL로 API 테스트
```bash
# OCR 테스트
curl -X POST http://localhost:8000/ocr \
  -F "file=@test_samples/insurance_mock.png"

# 전체 파이프라인 테스트 (OCR → 분류 → 추출 → 저장)
# 1. 먼저 OCR 실행하여 텍스트 추출
curl -X POST http://localhost:8000/ocr \
  -F "file=@test_samples/receipt_1_basic.png" > ocr_output.json

# 2. 추출한 텍스트로 전체 처리 파이프라인 실행
curl -X POST http://localhost:8000/process \
  -H "Content-Type: application/json" \
  -d '{"ocr_text": "Merchant: Cafe\\nAmount: 5000\\nDate: 2026-08-02"}'

# 또는 문서 분류만 테스트
curl -X POST http://localhost:8000/classify \
  -H "Content-Type: application/json" \
  -d '{"ocr_text": "Applicant Name: John\\nAge: 35"}'
```

#### 방법 3: Python 스크립트로 테스트
```python
import requests
from pathlib import Path

BASE_URL = "http://localhost:8000"
TEST_IMAGE = Path("test_samples/insurance_mock.png")

# 이미지 업로드 및 OCR
with open(TEST_IMAGE, "rb") as f:
    response = requests.post(
        f"{BASE_URL}/ocr",
        files={"file": f}
    )
    print("OCR Result:", response.json())

# 문서 분류
classify_response = requests.post(
    f"{BASE_URL}/classify",
    json={"ocr_text": response.json()["ocr_text"]}
)
print("Classification:", classify_response.json())
```

### 예상 결과

**보험 신청서 처리**:
```json
{
  "success": true,
  "document_type": "insurance",
  "data": {
    "applicant_name": "...",
    "age": ...,
    "coverage_type": "...",
    "medical_history": "..."
  }
}
```

**영수증 처리**:
```json
{
  "success": true,
  "document_type": "receipt",
  "data": {
    "merchant_name": "...",
    "total_amount": ...,
    "transaction_date": "..."
  }
}
```

---

## 📄 API 엔드포인트

| 메서드 | 엔드포인트 | 설명 |
|--------|-----------|------|
| GET | `/health` | 헬스 체크 |
| POST | `/upload` | 이미지 업로드 및 저장 |
| POST | `/ocr` | 이미지에서 OCR 텍스트 추출 |
| POST | `/classify` | 문서 분류 (insurance/receipt) |
| POST | `/extract/insurance` | 보험 서류 필드 추출 |
| POST | `/extract/receipt` | 영수증 필드 추출 |
| POST | `/process` | 전체 파이프라인 (OCR → 분류 → 추출 → 저장) |
| DELETE | `/documents/{document_id}` | 문서 삭제 |

---

## 📝 라이선스

MIT License

---

**Made with ❤️**
