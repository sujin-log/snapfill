# 📤 파일 업로드 검증 요약

형식에 맞지 않은 이미지를 업로드할 때의 동작을 한눈에 정리합니다.

---

## 🎯 핵심 답변

### Q: 형식에 맞지 않은 이미지를 올리면 어떻게 되는가?

**A: 400 Bad Request 에러로 즉시 거부됩니다.**

```
❌ PDF 파일 업로드
   └─ 상태 코드: 400
   └─ 오류: "JPG, PNG 형식만 지원합니다. 받은 형식: application/pdf"

❌ GIF 파일 업로드
   └─ 상태 코드: 400
   └─ 오류: "JPG, PNG 형식만 지원합니다. 받은 형식: image/gif"

❌ TXT 파일 업로드
   └─ 상태 코드: 400
   └─ 오류: "JPG, PNG 형식만 지원합니다. 받은 형식: text/plain"
```

---

## 📊 검증 흐름도

```
파일 업로드
    ↓
┌─────────────────────────────────────┐
│ 1️⃣  MIME 타입 검증                  │
│ ────────────────────────────────    │
│ ✅ image/jpeg (JPG) → 진행           │
│ ✅ image/png (PNG)  → 진행           │
│ ❌ 다른 타입         → 400 에러      │
└─────────────────────────────────────┘
    ↓ (타입 OK일 때만)
┌─────────────────────────────────────┐
│ 2️⃣  파일 크기 검증                   │
│ ────────────────────────────────    │
│ ✅ ≤ 5MB → 진행                     │
│ ❌ > 5MB → 400 에러                 │
└─────────────────────────────────────┘
    ↓ (크기 OK일 때)
┌─────────────────────────────────────┐
│ 3️⃣  Supabase 저장                   │
│ ────────────────────────────────    │
│ ✅ 성공 → 200 OK + URL 반환         │
│ ❌ 실패 → 500 에러                  │
└─────────────────────────────────────┘
```

---

## 📋 테스트 케이스

### ❌ 형식 오류 (400 Bad Request)

| 파일 | MIME 타입 | 결과 | 메시지 |
|------|----------|------|---------|
| insurance.pdf | application/pdf | ❌ 400 | JPG, PNG 형식만 지원합니다. 받은 형식: application/pdf |
| animation.gif | image/gif | ❌ 400 | JPG, PNG 형식만 지원합니다. 받은 형식: image/gif |
| document.txt | text/plain | ❌ 400 | JPG, PNG 형식만 지원합니다. 받은 형식: text/plain |
| archive.zip | application/zip | ❌ 400 | JPG, PNG 형식만 지원합니다. 받은 형식: application/zip |
| file.doc | application/msword | ❌ 400 | JPG, PNG 형식만 지원합니다. 받은 형식: application/msword |

---

### ❌ 크기 오류 (400 Bad Request)

| 파일 | 크기 | MIME | 결과 | 메시지 |
|------|------|------|------|---------|
| large.jpg | 10MB | image/jpeg | ❌ 400 | 파일 크기는 5MB 이하여야 합니다. 현재: 10.00MB |
| huge.png | 8MB | image/png | ❌ 400 | 파일 크기는 5MB 이하여야 합니다. 현재: 8.00MB |

---

### ✅ 성공 (200 OK)

| 파일 | 크기 | MIME | 결과 | 응답 |
|------|------|------|------|------|
| photo.jpg | 2MB | image/jpeg | ✅ 200 | {"success": true, "file_url": "..."} |
| document.png | 1.5MB | image/png | ✅ 200 | {"success": true, "file_url": "..."} |
| scan.jpg | 500KB | image/jpeg | ✅ 200 | {"success": true, "file_url": "..."} |

---

## 🔍 상세 검증 로직

### 코드 위치
`backend/app/routes.py` (Line 41-54)

### 검증 코드

```python
# 1️⃣ 파일 타입 검증 (즉시)
if file.content_type not in settings.ALLOWED_MIME_TYPES:
    raise HTTPException(
        status_code=400,
        detail=f"JPG, PNG 형식만 지원합니다. 받은 형식: {file.content_type}",
    )

# 2️⃣ 파일 크기 검증 (파일 읽기 후)
file_content = await file.read()
if len(file_content) > settings.MAX_FILE_SIZE:
    raise HTTPException(
        status_code=400,
        detail=f"파일 크기는 5MB 이하여야 합니다. 현재: {len(file_content) / 1024 / 1024:.2f}MB",
    )
```

### 설정값
`backend/app/config.py`

```python
ALLOWED_MIME_TYPES: list = ["image/jpeg", "image/png"]
MAX_FILE_SIZE: int = 5 * 1024 * 1024  # 5MB
```

---

## ⏱️ 처리 시간

| 단계 | 소요 시간 | 설명 |
|------|----------|------|
| MIME 타입 검증 | < 1ms | 즉시 (파일 읽기 전) |
| 파일 크기 검증 | ~100ms | 파일 읽기 필요 |
| Supabase 업로드 | ~500ms | 네트워크 대기 |

---

## 🛡️ 현재 보안 수준

### 구현됨 ✅

- [x] MIME 타입 검증
- [x] 파일 크기 제한 (5MB)
- [x] HTTP 상태 코드 올바름 (400)
- [x] 명확한 오류 메시지
- [x] 즉시 실패 (타입 오류)

### 추가 가능 (선택사항)

- [ ] 파일 시그니처 검증 (실제 파일 내용 확인)
- [ ] PIL/Pillow로 이미지 유효성 검사
- [ ] 바이러스 스캔
- [ ] 중복 파일 감지
- [ ] 악성 메타데이터 제거

---

## 💬 사용자 피드백

### 형식 오류 메시지

**현재:**
```
JPG, PNG 형식만 지원합니다. 받은 형식: application/pdf
```

**권장사항:**
```
❌ PDF 형식은 지원되지 않습니다.
✅ JPG, PNG 형식만 지원됩니다.
```

### 크기 오류 메시지

**현재:**
```
파일 크기는 5MB 이하여야 합니다. 현재: 10.00MB
```

**권장사항:**
```
❌ 파일이 너무 큽니다 (10.00MB).
✅ 최대 5MB까지 업로드 가능합니다.
💡 파일을 압축하거나 해상도를 낮춰보세요.
```

---

## 🎯 클라이언트 측 개선

### HTML (클라이언트 검증)

```html
<!-- accept 속성으로 선택 가능한 파일 제한 -->
<input 
  type="file" 
  accept=".jpg,.jpeg,.png"
  max-size="5242880"
/>
```

### JavaScript (사전 검증)

```javascript
function validateFile(file) {
  const maxSize = 5 * 1024 * 1024; // 5MB
  const allowedTypes = ['image/jpeg', 'image/png'];
  
  // 형식 확인
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `${file.type} 형식은 지원되지 않습니다. JPG, PNG만 가능합니다.`
    };
  }
  
  // 크기 확인
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `파일이 너무 큽니다 (${(file.size / 1024 / 1024).toFixed(2)}MB). 최대 5MB까지 가능합니다.`
    };
  }
  
  return { valid: true };
}
```

### React Component

```jsx
function FileUpload() {
  const [error, setError] = useState(null);
  
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const validation = validateFile(file);
    if (!validation.valid) {
      setError(validation.error);
      return;
    }
    
    setError(null);
    uploadFile(file);
  };
  
  return (
    <>
      <input 
        type="file" 
        accept=".jpg,.jpeg,.png"
        onChange={handleFileSelect}
      />
      {error && <div className="error">{error}</div>}
    </>
  );
}
```

---

## 📊 응답 예시

### ❌ 형식 오류

```bash
curl -X POST http://localhost:8000/upload \
  -F "file=@document.pdf"
```

**응답:**
```json
{
  "detail": "JPG, PNG 형식만 지원합니다. 받은 형식: application/pdf"
}
```

**상태:** 400 Bad Request

---

### ❌ 크기 오류

```bash
curl -X POST http://localhost:8000/upload \
  -F "file=@large_image.jpg"  # 10MB
```

**응답:**
```json
{
  "detail": "파일 크기는 5MB 이하여야 합니다. 현재: 10.00MB"
}
```

**상태:** 400 Bad Request

---

### ✅ 성공

```bash
curl -X POST http://localhost:8000/upload \
  -F "file=@document.png"  # 2MB
```

**응답:**
```json
{
  "success": true,
  "file_url": "https://sprtqsehbroeiaemzkbk.supabase.co/storage/v1/object/public/documents/20260731/a1b2c3d4.png",
  "file_path": "documents/20260731/a1b2c3d4.png",
  "original_filename": "document.png"
}
```

**상태:** 200 OK

---

## 🎓 결론

### 형식 검증 요약

1. **MIME 타입 확인** → 형식 오류 시 즉시 400 반환
2. **파일 크기 확인** → 크기 초과 시 400 반환
3. **Supabase 저장** → 성공 시 200 OK + URL 반환

### 사용자 경험

- ✅ 명확한 오류 메시지
- ✅ 빠른 응답 (타입 오류는 <1ms)
- ✅ 형식 재시도 가능

### 보안

- ✅ 악의적 파일 타입 차단
- ✅ 메모리 오버플로우 방지 (5MB 제한)
- ✅ 올바른 HTTP 상태 코드

---

**더 자세한 내용:** FORMAT_VALIDATION_GUIDE.md 참고

최종 업데이트: 2026-07-31
