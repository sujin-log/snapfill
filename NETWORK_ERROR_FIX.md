# 🔧 네트워크 에러 해결 가이드

"Upload Failed - Network Error" 에러가 발생할 때의 해결 방법입니다.

---

## 🎯 문제 원인

```
Network Error dlrp → 백엔드 서버에 연결할 수 없음
```

### 주요 원인

1. **백엔드 서버가 실행 중이 아님** ❌
2. **포트 8000이 다른 애플리케이션에서 사용 중** ❌
3. **환경 변수 설정이 잘못됨** ❌
4. **방화벽이 연결을 차단** ❌
5. **API 베이스 URL이 잘못됨** ❌

---

## ✅ 해결 방법

### 1️⃣ **백엔드 서버 실행 확인**

#### 터미널 1: 백엔드 시작
```bash
cd snapfill/backend
python -m uvicorn app.main:app --reload
```

**정상 출력:**
```
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Application startup complete
```

#### 터미널 2: 헬스 체크
```bash
curl http://localhost:8000/health
```

**정상 응답:**
```json
{
  "status": "healthy",
  "service": "SnapFill API",
  "version": "0.1.0"
}
```

---

### 2️⃣ **환경 변수 확인**

#### `.env.local` 파일 확인

```bash
cat .env.local
```

**필수 환경 변수:**
```env
## 프론트엔드
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000

## 백엔드
SUPABASE_URL=https://...
SUPABASE_SECRET_KEY=sb_...
GEMINI_API_KEY=AIzaSy...
USE_MOCK=True
USE_CACHE=True
```

**없으면 추가:**
```bash
echo "NEXT_PUBLIC_API_BASE_URL=http://localhost:8000" >> .env.local
```

---

### 3️⃣ **포트 충돌 확인**

#### 포트 8000 확인

**Windows PowerShell:**
```powershell
netstat -ano | Select-String "8000"
```

**Linux/Mac:**
```bash
lsof -i :8000
```

**출력이 있으면:** 다른 애플리케이션이 포트 8000을 사용 중

**해결:**
```bash
# 다른 포트로 백엔드 실행
python -m uvicorn app.main:app --reload --port 8001

# 그리고 환경 변수 업데이트
# NEXT_PUBLIC_API_BASE_URL=http://localhost:8001
```

---

### 4️⃣ **프론트엔드 재시작**

백엔드를 시작한 후 프론트엔드를 재시작하세요.

#### 터미널 3: 프론트엔드 시작
```bash
npm run dev
```

**정상 출력:**
```
> next dev

  ▲ Next.js 15.1.0
  - Local:        http://localhost:3000
  - Environments: .env.local
```

---

## 🔍 문제 진단 체크리스트

- [ ] 백엔드 서버가 실행 중인가?
- [ ] 포트 8000이 사용 가능한가?
- [ ] `.env.local`에 `NEXT_PUBLIC_API_BASE_URL` 설정이 있는가?
- [ ] 프론트엔드를 재시작했는가?
- [ ] 브라우저 캐시를 삭제했는가? (Ctrl+Shift+Del)
- [ ] 네트워크 탭에서 요청을 확인했는가? (F12)

---

## 🛠️ 상세 해결 단계

### 시나리오 1: 백엔드 미실행

```
현상: "Network Error dlrp"
원인: 백엔드 서버 미실행
해결:
  1. cd backend
  2. python -m uvicorn app.main:app --reload
  3. 프론트엔드 새로고침 (F5)
```

### 시나리오 2: 포트 충돌

```
현상: "Network Error" 또는 "Address already in use"
원인: 포트 8000 사용 중
해결:
  1. netstat -ano | Select-String "8000"
  2. 프로세스 ID 확인
  3. taskkill /PID [process_id] /F (Windows)
  4. kill -9 [process_id] (Mac/Linux)
  5. 백엔드 재시작
```

### 시나리오 3: 환경 변수 미설정

```
현상: "Cannot GET http://undefined/upload"
원인: NEXT_PUBLIC_API_BASE_URL 미설정
해결:
  1. .env.local 확인
  2. NEXT_PUBLIC_API_BASE_URL=http://localhost:8000 추가
  3. npm run dev 재시작
```

### 시나리오 4: 캐시 문제

```
현상: 에러 메시지 변경 안 됨
원인: 브라우저/Next.js 캐시
해결:
  1. F12 → Network → "Disable cache" 체크
  2. Ctrl+Shift+Del → 캐시 삭제
  3. npm run dev 재시작
  4. Ctrl+F5 (강제 새로고침)
```

---

## 📊 네트워크 디버깅

### 1. 브라우저 개발자 도구 (F12)

**Network 탭:**
```
1. POST /upload → Status
   ✅ 200: 성공
   ❌ 0/Network Error: 서버 미연결
   ❌ 400: 파일 형식 오류
   ❌ 408: 타임아웃
   ❌ 500: 서버 에러
```

**Console 탭:**
```javascript
// 로그 확인
console.log('Upload error:', error);
```

### 2. 수동 API 테스트

```bash
# 헬스 체크
curl http://localhost:8000/health

# 업로드 테스트 (실패할 수 있음)
curl -X POST http://localhost:8000/upload \
  -F "file=@test_image.jpg"
```

### 3. API 클라이언트 로그

```typescript
// src/lib/api.ts
console.error('Upload error:', error);

// 이 로그가 브라우저 콘솔에 나타남
```

---

## 🔄 재시도 로직

### 자동 재시도

```
첫 시도 실패
  ↓ (1초 대기)
두 번째 시도 실패
  ↓ (2초 대기)
세 번째 시도 실패
  ↓
에러 메시지 표시
```

**설정 위치:** `src/lib/api.ts` - `uploadDocument(file, retries: number = 2)`

---

## 📋 에러 메시지 해석

| 에러 메시지 | 원인 | 해결책 |
|-----------|------|-------|
| Network Error | 서버 미연결 | 백엔드 실행 |
| Bad Request | 파일 형식/크기 | JPG, PNG, <5MB |
| Unauthorized | 인증 실패 | 환경 변수 확인 |
| Not Found (404) | 엔드포인트 없음 | API 베이스 URL 확인 |
| Request Timeout | 응답 초과 | 서버 상태 확인 |
| Server Error (500) | 서버 오류 | 백엔드 로그 확인 |
| Service Unavailable | 일시적 오류 | 잠시 대기 후 재시도 |

---

## 💡 개선된 에러 처리

### UploadForm에서의 처리

```typescript
// 1. 파일 크기 검증 (클라이언트)
if (file.size > 5 * 1024 * 1024) {
  onUploadError('파일 크기는 5MB 이하여야 합니다.');
  return;
}

// 2. 백엔드 헬스 체크
const isBackendHealthy = await apiClient.getHealth();
if (!isBackendHealthy) {
  onUploadError('백엔드 서버에 연결할 수 없습니다...');
  return;
}

// 3. 재시도 로직 포함 업로드
const response = await apiClient.uploadDocument(file, 2);
```

### ErrorAlert에서의 안내

```typescript
{message.includes('백엔드') && (
  <div className="mt-2 text-xs">
    <p>💡 해결 방법:</p>
    <ol>
      <li>터미널에서 백엔드 실행</li>
      <li>서버 확인 (http://localhost:8000)</li>
      <li>다시 시도</li>
    </ol>
  </div>
)}
```

---

## 🚀 완전 재설정

모든 것이 실패하면 처음부터 시작하세요.

```bash
# 1. 모든 터미널 종료 (Ctrl+C)

# 2. 포트 정리
lsof -i :3000   # Next.js
lsof -i :8000   # FastAPI

# 3. 환경 변수 확인
cat .env.local

# 4. 백엔드 시작 (터미널 1)
cd backend
python -m uvicorn app.main:app --reload --port 8000

# 5. 프론트엔드 시작 (터미널 2)
npm run dev

# 6. 브라우저 오픈
# http://localhost:3000
```

---

## ✅ 정상 상태 확인

```
✓ 백엔드 터미널: "Application startup complete"
✓ 프론트엔드 터미널: "Ready in 1234ms"
✓ 브라우저: http://localhost:3000 로드됨
✓ 헤더에 "Connected" (초록색)
✓ 이미지 업로드 성공
```

---

## 📞 추가 도움말

### 백엔드 실행 안 될 때
```bash
# 1. Python 설치 확인
python --version

# 2. 의존성 설치
pip install fastapi uvicorn python-multipart

# 3. 백엔드 폴더에서 실행
cd snapfill/backend
python -m uvicorn app.main:app --reload
```

### 프론트엔드 실행 안 될 때
```bash
# 1. Node.js 설치 확인
node --version
npm --version

# 2. 의존성 재설치
rm -rf node_modules package-lock.json
npm install

# 3. 개발 서버 실행
npm run dev
```

---

**최종 체크:** 모든 서버가 실행되고 있는가?

- ✅ 백엔드: `http://localhost:8000/health` → 200 OK
- ✅ 프론트엔드: `http://localhost:3000` → 페이지 로드
- ✅ 헤더: "Connected" 상태 표시

**이제 업로드하면 성공할 겁니다!** 🚀

---

최종 업데이트: 2026-07-31
