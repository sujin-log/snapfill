# 📋 형식 검증 가이드

형식에 맞지 않은 이미지를 업로드할 때의 동작을 상세히 설명합니다.

---

## 🔍 검증 규칙

### routes.py의 검증 로직

```python
# 1️⃣ 파일 타입 검증 (먼저 실행)
if file.content_type not in settings.ALLOWED_MIME_TYPES:
    raise HTTPException(
        status_code=400,
        detail=f"JPG, PNG 형식만 지원합니다. 받은 형식: {file.content_type}",
    )

# 2️⃣ 파일 크기 검증 (타입 확인 후 실행)
file_content = await file.read()
if len(file_content) > settings.MAX_FILE_SIZE:
    raise HTTPException(
        status_code=400,
        detail=f"파일 크기는 5MB 이하여야 합니다. 현재: {len(file_content) / 1024 / 1024:.2f}MB",
    )
```

### config.py의 설정

```python
# 허용 형식
ALLOWED_MIME_TYPES: list = ["image/jpeg", "image/png"]

# 최대 파일 크기
MAX_FILE_SIZE: int = 5 * 1024 * 1024  # 5MB
```

---

## ❌ 형식 오류 케이스

### 케이스 1: PDF 파일

**입력:**
```
파일명: insurance_form.pdf
MIME 타입: application/pdf
크기: 2MB
```

**검증 과정:**
```
1️⃣  파일 타입 확인
    ↓
    "application/pdf" in ["image/jpeg", "image/png"] ?
    ↓
    ❌ NO
    ↓
2️⃣  HTTP 400 에러 발생
```

**응답:**
```json
{
  "detail": "JPG, PNG 형식만 지원합니다. 받은 형식: application/pdf"
}
```

**상태 코드:** 400 Bad Request  
**시간:** 즉시 (파일 읽기 전)  
**진행 단계:** 파일 타입 검증에서 중단

---

### 케이스 2: GIF 파일

**입력:**
```
파일명: animation.gif
MIME 타입: image/gif
크기: 500KB
```

**검증 과정:**
```
1️⃣  파일 타입 확인
    ↓
    "image/gif" in ["image/jpeg", "image/png"] ?
    ↓
    ❌ NO (gif는 지원 안 함)
    ↓
2️⃣  HTTP 400 에러 발생
```

**응답:**
```json
{
  "detail": "JPG, PNG 형식만 지원합니다. 받은 형식: image/gif"
}
```

**상태 코드:** 400 Bad Request  
**시간:** 즉시  
**진행 단계:** 파일 타입 검증에서 중단

---

### 케이스 3: TXT 파일

**입력:**
```
파일명: document.txt
MIME 타입: text/plain
크기: 10KB
```

**검증 과정:**
```
1️⃣  파일 타입 확인
    ↓
    "text/plain" in ["image/jpeg", "image/png"] ?
    ↓
    ❌ NO
    ↓
2️⃣  HTTP 400 에러 발생
```

**응답:**
```json
{
  "detail": "JPG, PNG 형식만 지원합니다. 받은 형식: text/plain"
}
```

**상태 코드:** 400 Bad Request

---

### 케이스 4: 파일 형식은 맞지만 크기 초과

**입력:**
```
파일명: large_image.jpg
MIME 타입: image/jpeg
크기: 10MB (5MB 초과)
```

**검증 과정:**
```
1️⃣  파일 타입 확인
    ↓
    "image/jpeg" in ["image/jpeg", "image/png"] ?
    ↓
    ✅ YES
    ↓
2️⃣  파일 크기 읽기 및 확인
    ↓
    file_content 길이: 10,485,760 bytes
    MAX_FILE_SIZE: 5,242,880 bytes
    ↓
    10,485,760 > 5,242,880 ?
    ↓
    ❌ YES
    ↓
3️⃣  HTTP 400 에러 발생
```

**응답:**
```json
{
  "detail": "파일 크기는 5MB 이하여야 합니다. 현재: 10.00MB"
}
```

**상태 코드:** 400 Bad Request  
**시간:** ~100ms (파일 읽기 필요)  
**진행 단계:** 파일 크기 검증에서 중단

---

## ✅ 성공 케이스

### 케이스 5: PNG 파일 (정상)

**입력:**
```
파일명: document.png
MIME 타입: image/png
크기: 2MB
```

**검증 과정:**
```
1️⃣  파일 타입 확인
    ↓
    "image/png" in ["image/jpeg", "image/png"] ?
    ↓
    ✅ YES
    ↓
2️⃣  파일 크기 읽기 및 확인
    ↓
    file_content 길이: 2,097,152 bytes
    MAX_FILE_SIZE: 5,242,880 bytes
    ↓
    2,097,152 > 5,242,880 ?
    ↓
    ❌ NO (크기 정상)
    ↓
3️⃣  Supabase 저장소에 업로드
    ↓
    ✅ 성공
```

**응답:**
```json
{
  "success": true,
  "file_url": "https://...",
  "file_path": "documents/20260731/a1b2c3d4.png",
  "original_filename": "document.png"
}
```

**상태 코드:** 200 OK

---

### 케이스 6: JPG 파일 (정상)

**입력:**
```
파일명: photo.jpg
MIME 타입: image/jpeg
크기: 1.5MB
```

**검증 과정:**
```
1️⃣  파일 타입 확인: ✅ YES
2️⃣  파일 크기 확인: ✅ YES (1.5MB < 5MB)
3️⃣  Supabase 저장소 업로드: ✅ 성공
```

**응답:**
```json
{
  "success": true,
  "file_url": "https://...",
  "file_path": "documents/20260731/x9y8z7w6.jpg",
  "original_filename": "photo.jpg"
}
```

**상태 코드:** 200 OK

---

## 📊 검증 순서도

```
파일 업로드 요청
      ↓
1️⃣  MIME 타입 확인
      ├─ image/jpeg ? ✅ 진행
      ├─ image/png  ? ✅ 진행
      └─ 다른 타입  ? ❌ 400 에러
      ↓
2️⃣  파일 내용 읽기
      ↓
3️⃣  파일 크기 확인
      ├─ ≤ 5MB  ? ✅ 진행
      └─ > 5MB  ? ❌ 400 에러
      ↓
4️⃣  Supabase에 저장
      ├─ 성공  ? ✅ 200 OK
      └─ 실패  ? ❌ 500 에러
      ↓
5️⃣  응답 반환
```

---

## 🛡️ 검증 특징

### 장점

✅ **빠른 실패:** 형식 오류는 즉시 반환 (파일 읽기 전)  
✅ **명확한 오류 메시지:** 어떤 형식이 안 되는지 명확히 알려줌  
✅ **크기 제한:** 메모리 오버플로우 방지  
✅ **파일 자동 삭제:** 임시 파일 정리  

### 개선 가능 사항

🔧 **파일 시그니처 검증:** 실제 파일 내용 확인 (현재는 MIME 타입만 확인)  
🔧 **이미지 유효성 검사:** 손상된 이미지 파일 감지  
🔧 **바이러스 스캔:** 악성 파일 감지 (선택사항)  

---

## 🔧 MIME 타입이란?

클라이언트가 파일을 업로드할 때 자동으로 감지되는 파일 타입입니다.

| 파일 확장자 | MIME 타입 |
|------------|----------|
| .jpg, .jpeg | image/jpeg |
| .png | image/png |
| .gif | image/gif |
| .pdf | application/pdf |
| .txt | text/plain |
| .doc | application/msword |

---

## 📱 클라이언트 측 예시

### React에서 파일 업로드

```javascript
// ❌ 잘못된 예 (아무 검증 없음)
<input type="file" onChange={handleUpload} />

// ✅ 좋은 예 (클라이언트 검증 추가)
<input 
  type="file" 
  accept=".jpg,.jpeg,.png" 
  onChange={handleUpload}
/>
```

### 클라이언트 검증 로직

```javascript
function handleUpload(e) {
  const file = e.target.files[0];
  
  // 형식 확인
  if (!['image/jpeg', 'image/png'].includes(file.type)) {
    alert('JPG, PNG 형식만 지원합니다.');
    return;
  }
  
  // 크기 확인
  if (file.size > 5 * 1024 * 1024) {
    alert('파일 크기는 5MB 이하여야 합니다.');
    return;
  }
  
  // 서버로 업로드
  uploadToServer(file);
}
```

---

## 📊 에러 코드 정리

| 상태 | 이유 | 원인 |
|------|------|------|
| 400 | 형식 오류 | PDF, GIF, TXT 등 |
| 400 | 크기 오류 | > 5MB |
| 500 | 서버 오류 | Supabase 연결 실패 |

---

## 🎯 권장사항

### 사용자 경험 개선

1️⃣ **클라이언트 검증 추가**
   - 파일 선택 시 즉시 피드백
   - 서버 왕복 불필요

2️⃣ **명확한 오류 메시지**
   - 현재: "JPG, PNG 형식만 지원합니다"
   - 개선: "JPG, PNG 형식만 지원합니다. 현재 파일: {실제 형식}"

3️⃣ **파일 크기 표시**
   - 제한 크기를 UI에 표시 (5MB)
   - 선택된 파일 크기 실시간 표시

### 보안 개선

1️⃣ **파일 시그니처 검증**
```python
# 파일 헤더로 실제 타입 확인
def is_valid_image(file_content):
    # PNG: 89 50 4E 47
    # JPG: FF D8 FF
    if file_content.startswith(b'\x89PNG'):
        return 'png'
    elif file_content.startswith(b'\xff\xd8\xff'):
        return 'jpeg'
    return None
```

2️⃣ **이미지 라이브러리 검증**
```python
from PIL import Image
try:
    img = Image.open(file_content)
    img.verify()  # 손상된 이미지 감지
except:
    raise ValueError("손상된 이미지 파일")
```

---

## 📋 체크리스트

### 현재 상태
- [x] MIME 타입 검증
- [x] 파일 크기 검증
- [x] 명확한 오류 메시지
- [x] 400 상태 코드 반환

### 추가 가능
- [ ] 클라이언트 측 검증
- [ ] 파일 시그니처 검증
- [ ] 이미지 라이브러리 검증
- [ ] 바이러스 스캔
- [ ] 파일 타입별 메시지 개선

---

**결론:** 형식에 맞지 않은 파일은 **400 Bad Request** 에러로 즉시 거부됩니다. 사용자에게 명확한 오류 메시지가 반환됩니다.

최종 업데이트: 2026-07-31
