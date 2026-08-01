# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Project Overview

**SnapFill** is a portfolio project that demonstrates AI-powered document classification and field extraction. Users upload images of documents (insurance applications or receipts), and the system automatically:
1. Extracts text via OCR (Tesseract)
2. Classifies document type using Gemini AI
3. Extracts key fields based on document type
4. Stores results in Supabase database
5. Displays structured results in a responsive web UI

**Note:** Refer to ROADMAP.md for development workflow and best practices.

---

## Architecture Overview

### System Components

```
Frontend (Next.js)
  ↓
FastAPI Backend
  ├── OCR Pipeline (Tesseract)
  ├── AI Classification (Gemini API)
  ├── Field Extraction (Gemini API)
  └── Database Layer (Supabase PostgreSQL)
  ↓
Supabase Database (documents, insurance_records, receipt_records)
```

### Key Design Decisions

1. **OCR Pipeline:** Tesseract OCR with preprocessing (grayscale, thresholding, morphological operations) for robust text extraction
2. **AI-Powered Classification:** Gemini API classifies documents (insurance/receipt) and extracts structured fields via prompts
3. **Stateless API:** Each upload is independent; no session/auth complexity
4. **Cloud-First Storage:** Supabase PostgreSQL for scalability; image files uploaded to Supabase Storage and deleted after processing
5. **Separation of Concerns:** Backend (Python/FastAPI) and Frontend (Next.js) are decoupled and communicate via JSON REST API
6. **Document Deletion:** Users can delete processed documents via DELETE /documents/{document_id} endpoint

### Data Flow

- User uploads image → Backend validates file (MIME type jpg/png, size < 5MB)
- Image uploaded to Supabase Storage
- Tesseract extracts text from image via OCR pipeline
- Gemini API classifies: "insurance" or "receipt"
- Gemini API extracts fields based on type:
  - **Insurance:** applicant_name, age, coverage_type, medical_history
  - **Receipt:** merchant_name, total_amount, transaction_date
- Results saved to Supabase (documents + type-specific record tables)
- Frontend displays structured results or error message
- Image deletion handled via DELETE /documents/{document_id}

---

## Tech Stack & Setup

### Backend
- **Language:** Python 3.9+
- **Framework:** FastAPI (uvicorn)
- **Database:** Supabase (PostgreSQL)
- **OCR:** Tesseract + OpenCV preprocessing
- **AI:** Google Gemini API
- **Storage:** Supabase Storage
- **ORM:** SQLAlchemy (optional, for SQLite fallback)

### Frontend
- **Framework:** Next.js 14 (React)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **HTTP Client:** axios

### Common Commands

#### Backend Setup & Run
```bash
# Create virtual environment
python -m venv venv
source venv/Scripts/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install fastapi uvicorn python-multipart pillow pytesseract opencv-python python-dotenv sqlalchemy requests

# Install Tesseract (system-level, Windows: download .exe installer)
# On Windows: https://github.com/UB-Mannheim/tesseract/wiki

# Set Claude API key
# Create .env file:
# CLAUDE_API_KEY=sk-ant-...

# Run development server (http://localhost:8000)
python -m uvicorn backend.app:app --reload

# Check health endpoint
curl http://localhost:8000/health
```

#### Frontend Setup & Run
```bash
# Create React app (if not already done)
npx create-react-app frontend

# Install dependencies
npm install axios

# Install Tailwind CSS
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# Run development server (http://localhost:3000)
npm start
```

#### Testing & Validation
```bash
# Test OCR accuracy with a sample image
python -c "
import pytesseract
from PIL import Image
img = Image.open('test_image.jpg')
text = pytesseract.image_to_string(img)
print(text)
"

# Test Claude API classification
curl -X POST http://localhost:8000/debug/classify \
  -H "Content-Type: application/json" \
  -d '{"text": "your ocr text here"}'

# Test full pipeline with image upload
curl -X POST http://localhost:8000/upload \
  -F "file=@test_insurance.jpg"
```

---

## Project Structure

```
snapfill/
├── backend/
│   ├── app.py                 # FastAPI main app, route handlers
│   ├── models.py              # SQLAlchemy ORM models (Document, InsuranceRecord, ReceiptRecord)
│   ├── database.py            # DB initialization and session management
│   ├── ocr_processor.py       # Tesseract OCR wrapper
│   ├── ai_classifier.py       # Claude API calls for classification and extraction
│   ├── uploads/               # Temporary image storage (deleted after processing)
│   └── __pycache__/           # (auto-generated)
├── frontend/
│   ├── src/
│   │   ├── App.jsx            # Main React component
│   │   ├── components/
│   │   │   ├── UploadForm.jsx   # File upload input
│   │   │   ├── ResultsView.jsx  # Results display (insurance/receipt)
│   │   │   └── ErrorAlert.jsx   # Error message display
│   │   ├── index.css          # Tailwind CSS imports
│   │   └── index.js           # React entry point
│   ├── package.json
│   ├── tailwind.config.js
│   └── postcss.config.js
├── .env                       # API keys and config (git-ignored)
├── .gitignore
├── PRD.md                     # Product requirements
├── ROADMAP.md                 # 1-day development timeline
├── CLAUDE.md                  # This file
└── README.md                  # Setup and usage instructions
```

---

## Critical Paths & Risk Mitigation

### HIGH PRIORITY: Early Validation (BLOCK 1 & 2)

**BLOCK 1 (09:00-11:00):** OCR Accuracy Test
- **Why:** If Tesseract fails, entire system is broken. Discovering this at Block 5+ means failure.
- **Action:** Install Tesseract, test on 2 sample images (insurance + receipt), verify 80%+ text extraction
- **Fallback:** If Tesseract accuracy < 80%, switch to EasyOCR or OpenCV preprocessing

**BLOCK 2 (11:00-13:00):** AI Prompt Validation
- **Why:** Poor prompts = poor classification/extraction, making all downstream work useless
- **Action:** Test both classification and extraction prompts on test OCR text from Block 1
- **Success Criteria:** 
  - Classification: correctly identify "insurance" vs "receipt" with 85%+ confidence
  - Extraction: extract all 3 fields per document type or return explicit null
- **Fallback:** Simplify prompts, add explicit JSON formatting instructions, test with more examples

### STRICT TIME BOXING (Enforce per ROADMAP.md)
- Each block has a fixed end time. Move to next block even if current is incomplete.
- Out-of-Scope items (login, edit results, export, confidence scores) are NEVER added.
- If running late, priorities: Backend API > Frontend UI > Polish

### Database Considerations
- Use SQLite for MVP (file-based, zero setup)
- Never hardcode database paths; use `.env` or configuration
- Always create tables on app startup (not manually)
- Test database save/retrieve flow in Block 4

---

## Development Guidelines

### Backend (FastAPI)

1. **API Response Format:** Always return JSON with consistent structure
   ```json
   {
     "success": true,
     "document_id": 1,
     "document_type": "insurance",
     "data": { "applicant_name": "...", "age": 35, "medical_history": "..." }
   }
   ```

2. **Error Responses:** Return HTTP status codes + user-friendly messages
   ```json
   { "success": false, "error": "File must be JPG or PNG (max 5MB)" }
   ```

3. **File Handling:** Always validate before processing
   - Check MIME type (jpg, png only)
   - Check file size (< 5MB)
   - Save to temporary directory
   - Delete after processing

4. **Claude API Calls:** Optimize prompts for JSON output
   - Include explicit JSON format in prompt
   - Parse JSON response with error handling
   - Return sensible defaults (null fields) on extraction failure

### Frontend (React)

1. **State Management:** Use `useState` for simple state (file, loading, result, error)
2. **API Integration:** Wrap Backend calls in try-catch, handle CORS issues
3. **User Feedback:** 
   - Show loading spinner during upload/processing
   - Display errors in a dedicated error alert component
   - Clear results when starting new upload
4. **Responsive Design:** Tailwind classes for mobile-friendly layout

### Code Style
- **Python:** Follow PEP 8 (FastAPI conventions)
- **React:** Use functional components with hooks, JSX best practices
- **Comments:** Only for non-obvious logic (e.g., why a specific regex pattern, workarounds)

---

## Key Milestones & Validation Gates

| Milestone | Block | Success Criteria | Risk Level |
|-----------|-------|-----------------|-----------|
| OCR works | 1 | Extract 80%+ text from 2 sample images | 🔴 CRITICAL |
| Prompts tuned | 2 | Classify + extract fields with 85%+ accuracy | 🔴 CRITICAL |
| Backend API | 4 | POST /upload processes images, saves to DB | 🟡 HIGH |
| Frontend built | 5 | Upload form + results display working | 🟡 HIGH |
| E2E pipeline | 6 | Full flow works: upload → classify → extract → save → display | 🟡 HIGH |
| Demo ready | 6+ | All 6 success metrics met (see PRD section 8) | 🟢 MEDIUM |

---

## Troubleshooting

### OCR Issues
- **No text extracted:** Check image quality (clear, high contrast). Preprocess with OpenCV (grayscale, threshold).
- **Tesseract not found:** Ensure Windows .exe installed and system PATH updated. Or use Python wrapper path: `pytesseract.pytesseract.pytesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'`
- **Slow OCR:** Reduce image resolution or use EasyOCR for faster inference

### Claude API Issues
- **Rate limiting:** API key might be quota-limited. Check API dashboard or add backoff retry logic.
- **Poor extraction:** Prompts need refinement. Add examples to few-shot prompting or use structured JSON format in prompt.
- **Encoding issues:** Always encode text as UTF-8 when sending to API

### Database Issues
- **"table does not exist":** Ensure `create_tables()` is called on app startup
- **Foreign key errors:** Ensure document record is inserted before insurance/receipt record
- **SQLite lock:** Unlikely in single-user mode, but ensure connections are closed after queries

### Frontend Issues
- **CORS errors:** FastAPI CORS middleware not configured. Add: `CORSMiddleware(app, allow_origins=["http://localhost:3000"])`
- **File not uploaded:** Check backend file validation logs. Verify file size < 5MB, MIME type is jpg/png.
- **Results not displaying:** Check browser console for errors. Verify API response format matches component expectations.

---

## Testing Checklist Before Demo

Use these 6 test cases to validate MVP before final hand-off:

### Happy Path Tests
1. **Insurance document:** Upload valid insurance form image → Verify: classified as "insurance", 3 fields extracted, DB saved
2. **Receipt document:** Upload valid receipt image → Verify: classified as "receipt", 3 fields extracted, DB saved

### Error Handling Tests
3. **Invalid file type:** Upload PDF → Verify: error message "JPG, PNG format only"
4. **Oversized file:** Upload > 5MB image → Verify: error message "File size must be < 5MB"
5. **Unrecognizable image:** Upload blank/noise image → Verify: error message "Could not extract text"
6. **DB integrity:** After tests 1-2, run SELECT on DB → Verify: 2 documents + 2 records (1 insurance, 1 receipt) with correct data

### Performance Test
- Measure time from upload click to results display
- Success: < 10 seconds for all test files

---

## Important Notes

- **Mock Data Only:** All test images and demo data are fabricated (no real personal info)
- **No Auth:** This MVP has no login/user management
- **No Editing:** Results cannot be modified after extraction (out of scope)
- **Single User:** Designed for local development, not concurrent requests
- **Temporary Storage:** Uploaded images are deleted after processing; no archive

---

## References

- **PRD.md:** Full product requirements (scope, features, success metrics)
- **ROADMAP.md:** Detailed 1-day development timeline with time-boxed blocks
- **Backend Framework:** [FastAPI Docs](https://fastapi.tiangolo.com/)
- **OCR Library:** [pytesseract Docs](https://pytesseract.readthedocs.io/)
- **Frontend Framework:** [React Docs](https://react.dev/)
- **CSS Framework:** [Tailwind CSS Docs](https://tailwindcss.com/)

---

**Last Updated:** 2026-07-30  
**Status:** Pre-development (ready to start Block 1)
