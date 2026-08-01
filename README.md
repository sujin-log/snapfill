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
| **OCR** | EasyOCR (한글 지원) |
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
   ├─ OCR (EasyOCR)
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
```

**`backend/.env` (백엔드)**
```env
GOOGLE_API_KEY=your_gemini_api_key
SUPABASE_URL=your_supabase_url
SUPABASE_API_KEY=your_supabase_key
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

## 📄 API 엔드포인트

| 메서드 | 엔드포인트 | 설명 |
|--------|-----------|------|
| POST | `/upload` | 이미지 업로드 |
| POST | `/ocr` | OCR 추출 |
| POST | `/classify` | 문서 분류 |
| POST | `/extract/insurance` | 보험 필드 추출 |
| POST | `/extract/receipt` | 영수증 필드 추출 |
| GET | `/health` | 헬스 체크 |

---

## 📝 라이선스

MIT License

---

**Made with ❤️**
