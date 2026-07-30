# SnapFill - Product Requirements Document

## 1. 개요

**프로젝트명:** SnapFill

**한 줄 요약:** 이미지 업로드 시 OCR과 AI를 활용해 문서를 자동 분류하고 핵심 정보를 추출하는 문서 지능화 서비스

**목적:** 포트폴리오를 통해 "단순 OCR 텍스트 추출을 넘어 AI가 문서의 의미를 이해하고 분류·구조화할 수 있다"는 역량을 시연

**개발 기간:** 1일 (MVP 완성)

---

## 2. 문제 정의

- **현재 상황:** 종이 문서(신청서, 영수증 등)는 여전히 수작업으로 정보를 입력해야 함
- **문제점:** 
  - 수작업 입력은 시간이 오래 걸리고 오류 가능성이 높음
  - 다양한 문서 형식을 일일이 처리하기 어려움
  - 문서의 의미적 내용(어떤 종류의 문서인지, 어떤 필드가 중요한지)을 자동 파악하지 못함

- **해결책:** AI 기반 문서 분류 및 필드 자동 추출 시스템으로 이 과정을 자동화

---

## 3. 타겟 사용자 / 유스케이스

**타겟 사용자:**
- 포트폴리오 검토자 (HR, 기술 면접관)
- 문서 처리 자동화에 관심 있는 사용자

**주요 유스케이스:**

1. **보험 신청서 처리**
   - 사용자가 보험 신청서 사진을 업로드
   - 시스템이 신청자 이름, 나이, 질병 이력을 자동 추출
   - 추출된 정보를 정구조화된 형태로 표시

2. **영수증 처리**
   - 사용자가 영수증 사진을 업로드
   - 시스템이 상호명, 금액, 날짜를 자동 추출
   - 추출된 정보를 정구조화된 형태로 표시

---

## 4. 범위 (MVP)

### 4.1 포함되는 기능 (In Scope)

#### 문서 타입
- **보험 신청서**
  - 추출 필드: 이름, 나이, 질병 이력
  
- **영수증**
  - 추출 필드: 상호명, 금액, 날짜

#### 핵심 기능
1. **이미지 업로드**
   - 사용자가 이미지 파일(JPG, PNG)을 업로드할 수 있음
   - 파일 크기 제한: 5MB 이하

2. **OCR 텍스트 추출**
   - Tesseract 또는 유사 OCR 엔진을 활용해 이미지에서 텍스트 추출

3. **AI 문서 분류**
   - Claude API를 활용해 추출된 텍스트가 "보험 신청서" 또는 "영수증" 중 어느 것인지 분류

4. **필드 추출**
   - 분류된 문서 타입에 맞춰 필수 필드를 AI로 추출
   - 추출 실패 시 "추출 불가" 메시지 표시

5. **결과 저장 및 표시**
   - 추출된 정보를 DB에 저장
   - 웹 UI에서 구조화된 형태로 표시

#### 데이터 원칙
- **목업 데이터만 사용:** 모든 테스트 및 데모 데이터는 직접 생성한 가짜 데이터만 사용
- **실제 개인정보 금지:** 실제 사용자 개인정보(주민등록번호, 실제 이름 등) 입력 금지

### 4.2 Out of Scope

- 신뢰도 점수 계산 및 신뢰도 기반 필터링
- 사람의 검토/수정 기능 및 검토자 큐
- 보험 신청서 세부 유형 분류 (생명보험/실손보험/질병보험 등)
- 사용자 로그인 / 회원 관리
- 결과 정보 수정 및 재추출
- CSV/PDF 내보내기
- 다국어 지원
- 고급 문서 분석 (문서 내 시그니처 감지, 이미지 품질 검증 등)
- 배치 처리 / 일괄 업로드
- 결과 삭제 및 히스토리 관리

---

## 5. 데이터 흐름

```
┌─────────────────────────────────────────────────────────────┐
│                   User Interface                             │
│              (Upload Image, View Results)                    │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
        ┌──────────────────────────┐
        │   Image Upload API       │
        │  (POST /upload)          │
        └──────────────┬───────────┘
                       │
                       ▼
        ┌──────────────────────────┐
        │  OCR Processing          │
        │  (Extract Text)          │
        │  (Tesseract)             │
        └──────────────┬───────────┘
                       │
                       ▼
        ┌──────────────────────────┐
        │  AI Classification       │
        │  (Claude API)            │
        │  → Insurance/Receipt?    │
        └──────────────┬───────────┘
                       │
            ┌──────────┴──────────┐
            │                     │
            ▼                     ▼
    ┌────────────────┐   ┌────────────────┐
    │  Insurance     │   │    Receipt     │
    │  Field Extract │   │  Field Extract │
    │  (Claude API)  │   │  (Claude API)  │
    └────────┬───────┘   └────────┬───────┘
             │                     │
             └──────────┬──────────┘
                        │
                        ▼
             ┌──────────────────────┐
             │   Database Save      │
             │  (Store Extracted    │
             │   Document Record)   │
             └──────────┬───────────┘
                        │
                        ▼
             ┌──────────────────────┐
             │  Results Display     │
             │  (Web UI)            │
             │  (Structured Format) │
             └──────────────────────┘
```

---

## 6. 데이터 모델

### 6.1 Database Schema

#### documents 테이블
```sql
CREATE TABLE documents (
  id INT PRIMARY KEY AUTO_INCREMENT,
  original_filename VARCHAR(255) NOT NULL,
  image_storage_path VARCHAR(500) NOT NULL,
  extracted_text LONGTEXT,
  document_type ENUM('insurance', 'receipt', 'unknown') NOT NULL,
  classification_confidence DECIMAL(3,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

#### insurance_records 테이블
```sql
CREATE TABLE insurance_records (
  id INT PRIMARY KEY AUTO_INCREMENT,
  document_id INT NOT NULL,
  applicant_name VARCHAR(100),
  age INT,
  medical_history TEXT,
  extraction_status ENUM('success', 'partial', 'failed') DEFAULT 'failed',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
);
```

#### receipt_records 테이블
```sql
CREATE TABLE receipt_records (
  id INT PRIMARY KEY AUTO_INCREMENT,
  document_id INT NOT NULL,
  merchant_name VARCHAR(200),
  total_amount DECIMAL(10,2),
  transaction_date DATE,
  extraction_status ENUM('success', 'partial', 'failed') DEFAULT 'failed',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
);
```

### 6.2 API Response 예시

**성공 응답 (Insurance)**
```json
{
  "success": true,
  "document_id": 1,
  "document_type": "insurance",
  "data": {
    "applicant_name": "김철수",
    "age": 35,
    "medical_history": "고혈압"
  }
}
```

**성공 응답 (Receipt)**
```json
{
  "success": true,
  "document_id": 2,
  "document_type": "receipt",
  "data": {
    "merchant_name": "스타벅스 강남점",
    "total_amount": 5500,
    "transaction_date": "2026-07-30"
  }
}
```

---

## 7. 비기능 요구사항

### 7.1 개인정보 처리 원칙
- **목업 데이터만 사용:** 모든 테스트/데모 데이터는 실제가 아닌 가상의 정보만 사용
- **데이터 검증:** 입력된 개인정보 형식이 실제 개인정보처럼 보이면 경고 또는 거부
- **저장 원칙:** DB에 저장되는 모든 데이터는 포트폴리오 데모 목적의 가짜 정보임

### 7.2 성능
- 이미지 업로드 ~ 결과 반환 시간: 10초 이내 (OCR + AI 포함)
- 동시 처리 수: 초기 MVP에서는 단일 사용자 기준

### 7.3 에러 처리
- **OCR 실패:** "이미지에서 텍스트를 추출할 수 없습니다" 메시지 표시
- **분류 실패:** "문서 유형을 판단할 수 없습니다" 메시지 표시
- **필드 추출 실패:** "필드 추출에 실패했습니다. 다른 이미지를 시도해주세요" 메시지 표시
- **파일 크기 초과:** "파일 크기는 5MB 이하여야 합니다" 메시지 표시
- **지원하지 않는 파일 형식:** "JPG, PNG 형식만 지원합니다" 메시지 표시

### 7.4 보안
- CORS 설정: 로컬호스트 기본값
- 파일 검증: MIME 타입 확인 (jpg, png만 허용)
- 업로드된 이미지는 서버에 임시 저장 후 처리 완료 후 삭제

---

## 8. 성공 지표 (MVP 데모 기준)

| 지표 | 목표 | 측정 방법 |
|------|------|---------|
| **분류 정확도** | 보험/영수증 98% 이상 분류 정확도 | 5개의 샘플 이미지로 테스트 |
| **필드 추출 성공률** | 정상 이미지에서 필드 추출 90% 이상 성공 | 5개의 보험/영수증 이미지로 테스트 |
| **응답 시간** | 업로드부터 결과 반환까지 10초 이내 | 3회 반복 측정 |
| **UI/UX** | 사용자 인터페이스 직관적이고 명확 | 포트폴리오 검토자 피드백 |
| **에러 처리** | 잘못된 입력 시 명확한 에러 메시지 표시 | 부정적 테스트 케이스 5개 실행 |
| **데이터 무결성** | 추출된 모든 데이터가 DB에 정확히 저장됨 | DB 검증 쿼리 실행 |

---

## 9. 기술 스택

### Backend
- **Language:** Python 3.9+
- **Framework:** FastAPI (빠른 개발, 자동 문서화)
- **Database:** SQLite (MVP, 단순성) 또는 MySQL (선택사항)
- **OCR:** Tesseract (pytesseract)
- **AI Model:** Claude API (문서 분류 및 필드 추출)

### Frontend
- **Framework:** React 18+ 또는 Vue 3+
- **UI Library:** Tailwind CSS
- **HTTP Client:** axios 또는 fetch API

### DevOps / Deployment
- **Local Development:** Python venv, npm/yarn
- **Storage:** Local filesystem (초기), 필요시 S3
- **API Key Management:** Environment variables (.env)

---

## 10. 리스크 및 대응

| 리스크 | 확률 | 영향 | 대응 방안 |
|--------|------|------|---------|
| **OCR 정확도 저하** | 중 | 높음 | 고품질의 테스트 이미지 준비, OCR 전 이미지 전처리 |
| **Claude API 비용 초과** | 낮음 | 중 | 사전에 가격 계산, 테스트 토큰 제한 설정 |
| **AI 필드 추출 오류** | 중 | 중 | 프롬프트 최적화, 추출 실패 시 명확한 메시지 |
| **개발 일정 초과** | 중 | 높음 | 초기부터 핵심 기능(upload→classify→extract→save)에 집중, 부가 기능은 out-of-scope 유지 |
| **이미지 파일 처리 오류** | 낮음 | 중 | 파일 타입/크기 사전 검증, 예외 처리 강화 |
| **DB 연결 문제** | 낮음 | 중 | SQLite로 시작해 로컬 파일 기반으로 간소화 |

---

## 부록: 테스트 이미지 스펙

### 보험 신청서 목업
- 이름: 김철수
- 나이: 35
- 질병 이력: 고혈압, 당뇨

### 영수증 목업
- 상호명: 스타벅스 강남점
- 금액: 5,500원
- 날짜: 2026-07-30

---

**Document Version:** 1.0  
**Last Updated:** 2026-07-30  
**Author:** SnapFill Team  
**Status:** Active (MVP Phase)
