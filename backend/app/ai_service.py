"""
AI service wrapper with caching and mock support for development
"""

import hashlib
import json
import logging
import os
from pathlib import Path
from typing import Optional

from .config import settings
from . import gemini_client
from . import mock_responses

logger = logging.getLogger(__name__)

# Cache directory
CACHE_DIR = Path(__file__).parent / ".cache"
CACHE_DIR.mkdir(exist_ok=True)


class AIService:
    def __init__(self, use_mock: bool = False, use_cache: bool = True):
        """
        Args:
            use_mock: Use mock responses instead of calling Gemini API
            use_cache: Cache Gemini API responses to avoid repeated calls
        """
        self.use_mock = use_mock or settings.ENVIRONMENT == "mock"
        self.use_cache = use_cache
        self.cache_dir = CACHE_DIR

    def _get_cache_key(self, text: str, operation: str) -> str:
        """Generate cache key from text hash"""
        text_hash = hashlib.md5(text.encode()).hexdigest()
        return f"{operation}_{text_hash}.json"

    def _load_from_cache(self, cache_key: str) -> Optional[dict]:
        """Load response from cache"""
        if not self.use_cache:
            return None

        cache_file = self.cache_dir / cache_key
        if cache_file.exists():
            try:
                with open(cache_file, "r", encoding="utf-8") as f:
                    data = json.load(f)
                logger.info(f"[CACHE] Loaded from cache: {cache_key}")
                return data
            except Exception as e:
                logger.warning(f"Failed to load cache {cache_key}: {e}")
        return None

    def _save_to_cache(self, cache_key: str, data: dict) -> None:
        """Save response to cache"""
        if not self.use_cache:
            return

        cache_file = self.cache_dir / cache_key
        try:
            with open(cache_file, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            logger.info(f"[CACHE] Saved to cache: {cache_key}")
        except Exception as e:
            logger.warning(f"Failed to save cache {cache_key}: {e}")

    async def classify_document(self, ocr_text: str) -> dict:
        """
        Classify document type with caching and mock support

        Args:
            ocr_text: OCR extracted text

        Returns:
            {
                "document_type": "insurance" | "receipt",
                "confidence": float (0-1),
                "reason": str
            }
        """
        cache_key = self._get_cache_key(ocr_text, "classify")

        # Try to load from cache
        cached = self._load_from_cache(cache_key)
        if cached:
            return cached

        # Use mock response
        if self.use_mock:
            logger.info("[MOCK] Using mock response for classification")
            result = mock_responses.MOCK_CLASSIFICATION.copy()
            self._save_to_cache(cache_key, result)
            return result

        # Call real API
        try:
            result = await gemini_client.classify_document(ocr_text)
            self._save_to_cache(cache_key, result)
            return result
        except Exception as e:
            logger.error(f"Classification failed: {e}")
            raise

    async def extract_insurance_fields(self, ocr_text: str) -> dict:
        """
        Extract insurance fields with caching and mock support

        Args:
            ocr_text: OCR extracted text

        Returns:
            {
                "applicant_name": str,
                "age": int | null,
                "medical_history": str | null
            }
        """
        cache_key = self._get_cache_key(ocr_text, "extract_insurance")

        # Try to load from cache
        cached = self._load_from_cache(cache_key)
        if cached:
            return cached

        # Use mock response
        if self.use_mock:
            logger.info("[MOCK] Using mock response for insurance extraction")
            result = mock_responses.MOCK_INSURANCE_EXTRACTION.copy()
            self._save_to_cache(cache_key, result)
            return result

        # Call real API
        try:
            result = await gemini_client.extract_insurance_fields(ocr_text)
            self._save_to_cache(cache_key, result)
            return result
        except Exception as e:
            logger.error(f"Insurance extraction failed: {e}")
            raise

    async def extract_receipt_fields(self, ocr_text: str) -> dict:
        """
        Extract receipt fields with caching and mock support

        Args:
            ocr_text: OCR extracted text

        Returns:
            {
                "merchant_name": str,
                "total_amount": float | null,
                "transaction_date": str | null
            }
        """
        cache_key = self._get_cache_key(ocr_text, "extract_receipt")

        # Try to load from cache
        cached = self._load_from_cache(cache_key)
        if cached:
            return cached

        # Use mock response
        if self.use_mock:
            logger.info("[MOCK] Using mock response for receipt extraction")
            result = mock_responses.MOCK_RECEIPT_EXTRACTION.copy()
            self._save_to_cache(cache_key, result)
            return result

        # Call real API
        try:
            result = await gemini_client.extract_receipt_fields(ocr_text)
            self._save_to_cache(cache_key, result)
            return result
        except Exception as e:
            logger.error(f"Receipt extraction failed: {e}")
            raise


# Default instance using settings
ai_service = AIService(use_mock=settings.USE_MOCK, use_cache=settings.USE_CACHE)
