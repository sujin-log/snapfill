import os
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routes import router
from .config import settings

logger = logging.getLogger(__name__)

print("\n" + "=" * 80)
print("SERVER STARTUP - CONFIGURATION CHECK")
print("=" * 80)
print(f"SUPABASE_URL loaded: {settings.SUPABASE_URL}")
print(f"SUPABASE_API_KEY loaded: {settings.SUPABASE_API_KEY[:30]}...")
print(f"USE_MOCK: {settings.USE_MOCK}")
print(f"USE_CACHE: {settings.USE_CACHE}")
print("=" * 80 + "\n")

app = FastAPI(
    title="SnapFill API",
    description="AI-powered document classification and field extraction",
    version="0.1.0",
)

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "https://snapfill-nine.vercel.app",
    ],
    allow_origin_regex=r"https://.*\.vercel\.app",  # Vercel 프리뷰 URL 자동 허용
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 라우트 등록
app.include_router(router)


@app.get("/health")
async def health_check():
    """
    헬스 체크 엔드포인트
    서버가 정상적으로 실행 중인지 확인
    """
    return {
        "status": "healthy",
        "service": "SnapFill API",
        "version": "0.1.0",
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
    )
