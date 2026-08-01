# SnapFill

**AI-Powered Document Classification & Field Extraction**

![SnapFill Demo](./docs/images/hero.png)

## 프로젝트 소개

**SnapFill**은 보험 신청서나 영수증 사진을 업로드하면, AI가 자동으로 문서를 분류하고 핵심 정보를 추출해주는 서비스입니다.

### 만들어진 이유

기업과 개인들은 매일 수많은 종이 문서를 처리합니다:
- 📋 보험 신청서의 신청자 정보, 보험 종류, 의료 이력 수기 입력
- 🧾 영수증의 상호명, 금액, 거래일 수동 타이핑
- ⏰ 반복적이고 오류가 많은 데이터 입력 작업

단순 OCR은 텍스트만 추출하지만, **SnapFill**은 다릅니다:
- 🧠 Google Gemini AI가 문서의 **맥락을 이해**하고 분류
- 🎯 필드별로 **구조화된 정보**를 자동 추출
- ✅ 추출 결과를 바로 확인하고 저장

### 핵심 차별점

| 기능 | 단순 OCR | SnapFill |
|------|---------|---------|
| 텍스트 추출 | ✅ | ✅ |
| 문서 분류 | ❌ | ✅ (AI) |
| 필드 추출 | ❌ | ✅ (구조화) |
| 맥락 이해 | ❌ | ✅ (Gemini) |
| 저장 & 조회 | ❌ | ✅ |

---

## 데모

### 주요 기능

1. 📸 **문서 업로드** - JPG/PNG 이미지 드래그 앤 드롭
2. 🤖 **자동 분류** - AI가 보험/영수증 구분 (밀리초 단위)
3. 📊 **필드 추출** - 신청자명, 나이, 보험종류, 의료이력 / 상호명, 금액, 거래일 등 자동 추출
4. 💾 **결과 저장** - Supabase에 구조화된 데이터 저장
5. 📋 **처리 이력 조회** - 업로드한 모든 문서 목록 확인 & 상세 정보 모달로 조회

### 스크린샷

![SnapFill Hero](./docs/images/screenshot-hero.png)
*데시보드 - 서비스 소개 및 업로드 영역*

![SnapFill Upload Success](./docs/images/screenshot-upload.png)
*성공 토스트 알림 및 처리 이력 목록*

![SnapFill Detail Modal](./docs/images/screenshot-detail.png)
*상세 정보 모달 - 추출된 필드 및 OCR 원본 텍스트*

---

## 아키텍처

### 데이터 흐름

```
┌─────────────┐
│   사용자    │
└──────┬──────┘
       │ 이미지 업로드
       ↓
┌─────────────────────────────────────┐
│         프론트엔드 (React)           │
│  - 파일 검증 (크기, 포맷)           │
│  - 이미지 미리보기                  │
└──────┬──────────────────────────────┘
       │ POST /upload (이미지)
       │ POST /extract-ocr (이미지)
       │ POST /process (OCR 텍스트)
       ↓
┌─────────────────────────────────────┐
│      백엔드 (FastAPI)               │
│  ┌──────────────────────────────┐   │
│  │ 1. 파일 검증 & 저장          │   │
│  └──────────┬───────────────────┘   │
│             ↓                        │
│  ┌──────────────────────────────┐   │
│  │ 2. OCR (EasyOCR)             │   │
│  │    한영 텍스트 추출           │   │
│  └──────────┬───────────────────┘   │
│             ↓                        │
│  ┌──────────────────────────────┐   │
│  │ 3. AI 분류 (Gemini API)      │   │
│  │    insurance / receipt 판정   │   │
│  └──────────┬───────────────────┘   │
│             ↓                        │
│  ┌──────────────────────────────┐   │
│  │ 4. 필드 추출 (Gemini API)    │   │
│  │    구조화된 정보 추출         │   │
│  └──────────┬───────────────────┘   │
│             ↓                        │
│  ┌──────────────────────────────┐   │
│  │ 5. DB 저장 (Supabase)        │   │
│  │    documents, insurance_records, │
│  │    receipt_records 테이블    │   │
│  └──────────┬───────────────────┘   │
└─────────────┼──────────────────────┘
              │ JSON 응답
              ↓
┌─────────────────────────────────────┐
│      프론트엔드 (React)              │
│  - 성공 토스트 알림                 │
│  - 처리 이력 목록에 새 행 추가      │
│  - 클릭 시 상세 정보 모달 표시     │
└─────────────────────────────────────┘
```

### 데이터베이스 스키마

```
📦 Supabase (PostgreSQL)

📋 documents
├── id (UUID, PK)
├── filename (string)
├── file_path (string)
├── document_type (string: 'insurance' | 'receipt')
├── ocr_text (text)
├── confidence (float 0-1)
├── created_at (timestamp)
└── updated_at (timestamp)

🏥 insurance_records
├── id (UUID, PK)
├── document_id (FK → documents.id)
├── applicant_name (string)
├── age (integer)
├── coverage_type (string: 'Life', 'Health', 'Auto', ...)
├── medical_history (text)
├── created_at (timestamp)
└── updated_at (timestamp)

🧾 receipt_records
├── id (UUID, PK)
├── document_id (FK → documents.id)
├── merchant_name (string)
├── total_amount (numeric)
├── transaction_date (date)
├── created_at (timestamp)
└── updated_at (timestamp)
```

---

## 기술 스택

| 계층 | 기술 | 선택 이유 |
|------|------|---------|
| **프론트엔드** | Next.js 14 (App Router) | 풀스택 React, SSR, 빠른 개발 |
| | TypeScript | 타입 안정성, 개발 생산성 |
| | Tailwind CSS | 유틸리티 기반 스타일링, 빠른 프로토타이핑 |
| | React Hooks | 상태 관리 단순화 |
| **백엔드** | FastAPI | 빠른 성능, 비동기 지원, 자동 API 문서 |
| | Python 3.9+ | AI/데이터 처리 라이브러리 풍부 |
| **OCR** | EasyOCR | 한글 정확도 우수, Tesseract 대비 유연함 |
| | Fallback: Tesseract | 경량 대안 |
| **AI** | Google Gemini API | 저비용 무료 티어, 고성능 |
| **DB/Storage** | Supabase (PostgreSQL) | DB + 파일 저장소 + 인증 통합 |
| | SQLAlchemy ORM | 쿼리 타입 안전성 |

---

## 기술 선택 이유

### 왜 Gemini API인가? (Claude 대신)

- 💰 **무료 티어 할당량**: Gemini 1,000 RPD (일 1,000회) vs Claude 100 RPD
- ⚡ **빠른 응답**: flash 모델 < 1초, 문서 분류에 최적
- 🎯 **JSON 출력 안정성**: 구조화된 필드 추출에 우수
- 📈 **비용 효율**: 프로토타입/MVP 단계에서 완전 무료 가능

### 왜 Supabase인가?

- 🆓 **통합 무료 제공**: 
  - PostgreSQL 데이터베이스
  - 1GB 파일 스토리지
  - 50,000명 무료 사용자
- 🔐 **내장 인증**: Row-level security로 보안 관리
- 📡 **실시간 기능**: WebSocket 지원
- 🚀 **간편 배포**: Vercel, Heroku 등과 통합

### 왜 EasyOCR인가?

- 🇰🇷 **한글 정확도**: Tesseract 대비 20~30% 더 정확
- 🌍 **다국어 지원**: 한영 함께 처리 가능
- 🔄 **유연함**: GPU/CPU 자동 선택
- ⚠️ **대체제**: Tesseract로 폴백 가능하게 구현

---

## 트러블슈팅 하이라이트

### 1. Gemini 무료 티어 할당량 차이 발견

**문제**: 모델별 일일 API 호출 한도가 다름
- gemini-3.6-flash: 20 RPD (너무 낮음) ❌
- gemini-2.0-flash: 1,000 RPD (좋음) ✅

**해결**: 
```python
# test_models_real.py로 각 모델 실제 테스트
# gemini-flash-lite-latest 발견 & 적용 ✅
model_id = "gemini-flash-lite-latest"  # 1,000 RPD
```

### 2. Korean OCR 정확도 문제

**문제**: Tesseract가 한글 테이블 셀 단위 줄바꿈 오류 발생
- "보험 종류\n생명보험" → 한 줄로 이어져야 함

**해결**:
```python
# EasyOCR로 전환
ocr_engine = easyocr.Reader(['ko', 'en'], gpu=False)
# 한글 정확도 크게 개선 ✅
```

### 3. Gemini API 503/429 에러 처리

**문제**: 일시적 서비스 오류 (503) vs 할당량 초과 (429)를 구분 필요

**해결**:
```python
# 재시도 로직 구현
if error_code == 429:  # 할당량 초과
    raise  # 즉시 에러 반환
elif error_code == 503:  # 서비스 이용불가
    await asyncio.sleep(retry_delay)  # 재시도
```

### 4. Supabase 필드 스키마 확장

**문제**: insurance_records에 coverage_type 컬럼 누락 (보험 종류 구분 불가)

**해결**: 
```sql
ALTER TABLE insurance_records
ADD COLUMN coverage_type TEXT;
```

---

## 실행 방법

### 사전 요구사항

- Node.js 18+ (프론트엔드)
- Python 3.9+ (백엔드)
- Git

### 환경 변수 설정

프로젝트 루트에 `.env.local` 파일 생성:

```env
# Google Gemini API
NEXT_PUBLIC_GEMINI_API_KEY=YOUR_GEMINI_API_KEY_HERE

# Supabase
NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_URL_HERE
NEXT_PUBLIC_SUPABASE_KEY=YOUR_SUPABASE_ANON_KEY_HERE
```

백엔드용 `backend/.env` 파일:

```env
# Google Gemini API
GEMINI_API_KEY=YOUR_GEMINI_API_KEY_HERE

# Supabase
SUPABASE_URL=YOUR_SUPABASE_URL_HERE
SUPABASE_API_KEY=YOUR_SUPABASE_API_KEY_HERE

# FastAPI
BACKEND_URL=http://localhost:8000
FRONTEND_URL=http://localhost:3000
```

### API 키 발급

1. **Google Gemini API**
   - https://aistudio.google.com/apikey
   - "Create API Key" → 무료 키 생성

2. **Supabase**
   - https://app.supabase.com
   - "New Project" → 무료 프로젝트 생성
   - Settings → API에서 URL, Anon Key 복사

### 설치 & 실행

```bash
# 1. 프로젝트 클론
git clone https://github.com/YOUR_USERNAME/snapfill.git
cd snapfill

# 2. 프론트엔드 설치
npm install
# 또는 yarn install

# 3. 백엔드 설치
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# 4. 프론트엔드 실행 (터미널 1)
npm run dev
# http://localhost:3000

# 5. 백엔드 실행 (터미널 2)
python -m uvicorn app.main:app --reload
# http://localhost:8000
```

### 테스트

```bash
# 파이프라인 전체 테스트
cd backend
python test_pipeline.py
```

---

## 향후 개선 계획

### 단기 (1~2주)
- ✅ MVP 완성 (현재 상태)
- 🔄 사용자 피드백 수집
- 📊 추출 정확도 모니터링

### 중기 (1~2개월)
- 🌐 **배포** (Vercel + Fly.io)
- 👥 **사용자 인증** (Supabase Auth)
- 📈 **신뢰도 기반 검토 큐** - AI 신뢰도 낮은 경우만 사람 검토
- 📋 **문서 타입 확장** - 신분증, 계약서, 명세서 등
- ✏️ **결과 편집 기능** - 추출 오류 사용자 수정 & 재학습

### 장기 (3개월+)
- 🔐 **Batch 처리** - 여러 파일 한 번에 처리
- 📱 **모바일 앱** - 카메라 직접 촬영
- 🌍 **다국어 지원** - 중국어, 일본어, 영어 등
- 🤖 **Fine-tuning** - 고객별 문서 형식 학습
- 📊 **대시보드** - 처리 통계, 추출 정확도 시각화

---

## 라이선스

MIT License - 자유롭게 사용, 수정, 배포 가능

## 기여

버그 리포트 및 기능 제안은 Issues로 부탁드립니다.

---

**Made with ❤️ by [Your Name]**
