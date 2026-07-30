import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    CLAUDE_API_KEY: str = os.getenv("CLAUDE_API_KEY", "")
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./snapfill.db")
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", 8000))
    DEBUG: bool = os.getenv("DEBUG", "False").lower() == "true"
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")
    USE_MOCK: bool = os.getenv("USE_MOCK", "False").lower() == "true"
    USE_CACHE: bool = os.getenv("USE_CACHE", "True").lower() == "true"

    # Supabase Settings
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
    SUPABASE_API_KEY: str = os.getenv("SUPABASE_API_KEY", "")

    # File Upload Settings
    MAX_FILE_SIZE: int = 5 * 1024 * 1024  # 5MB
    ALLOWED_MIME_TYPES: list = ["image/jpeg", "image/png"]
    UPLOAD_BUCKET: str = "documents"


settings = Settings()
