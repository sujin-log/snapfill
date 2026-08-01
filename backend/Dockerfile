# SnapFill 백엔드 Dockerfile
# FastAPI + Tesseract OCR (한국어 언어팩 포함)
# Railway / Render 배포용

FROM python:3.11-slim

# 시스템 패키지 설치
# - tesseract-ocr: OCR 엔진 본체
# - tesseract-ocr-kor: 한국어 언어팩 (이게 없으면 한글 인식 불가)
# - libgl1: 이미지 처리 라이브러리(Pillow/OpenCV 등)가 필요로 하는 의존성
# - curl: health check 용도 (선택)
RUN apt-get update && apt-get install -y --no-install-recommends \
    tesseract-ocr \
    tesseract-ocr-kor \
    libgl1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

ENV PORT=8000
EXPOSE 8000

# app.main:app (app/ 폴더 안의 main.py에서 app 인스턴스 사용)
CMD uvicorn app.main:app --host 0.0.0.0 --port ${PORT}
