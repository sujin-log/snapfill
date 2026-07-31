import os
from datetime import datetime
from typing import Optional
from supabase import create_client, Client
from .config import settings


class SupabaseStorage:
    def __init__(self):
        self.supabase: Optional[Client] = None
        self.use_mock = settings.USE_MOCK

        if self.use_mock:
            print("[OK] Using Mock Storage (development mode)")
            return

        if settings.SUPABASE_URL and settings.SUPABASE_API_KEY:
            try:
                self.supabase = create_client(
                    settings.SUPABASE_URL, settings.SUPABASE_API_KEY
                )
                print("[OK] Supabase connection initialized")
            except Exception as e:
                print(f"[WARN] Supabase connection failed: {e}")

    def upload_file(self, bucket_name: str, file_path: str, file_data: bytes) -> Optional[str]:
        """
        Supabase Storage에 파일 업로드 (Mock 모드 지원)

        Args:
            bucket_name: 스토리지 버킷 이름
            file_path: 저장될 파일 경로 (예: "documents/2026-07-30/abc123.jpg")
            file_data: 파일 데이터 (바이너리)

        Returns:
            파일 URL 또는 None (실패 시)
        """
        if self.use_mock:
            # Mock 모드: 로컬 파일로 저장하고 Mock URL 반환
            mock_url = f"https://mock-storage.local/{bucket_name}/{file_path}"
            print(f"[OK] Mock upload: {file_path} ({len(file_data)} bytes)")
            return mock_url

        if not self.supabase:
            return None

        try:
            response = self.supabase.storage.from_(bucket_name).upload(
                file_path, file_data
            )

            # 공개 URL 생성
            public_url = self.supabase.storage.from_(bucket_name).get_public_url(file_path)
            return public_url

        except Exception as e:
            import traceback
            print(f"[ERROR] Upload failed: {e}")
            print(f"[ERROR] Bucket name: {bucket_name}")
            print(f"[ERROR] File path: {file_path}")
            print(f"[ERROR] Traceback:")
            traceback.print_exc()
            return None

    def delete_file(self, bucket_name: str, file_path: str) -> bool:
        """
        Supabase Storage에서 파일 삭제

        Args:
            bucket_name: 스토리지 버킷 이름
            file_path: 삭제할 파일 경로

        Returns:
            성공 여부
        """
        if self.use_mock:
            print(f"[OK] Mock delete: {file_path}")
            return True

        if not self.supabase:
            return False

        try:
            self.supabase.storage.from_(bucket_name).remove([file_path])
            return True
        except Exception as e:
            print(f"[ERROR] Delete failed: {e}")
            return False


# 글로벌 Supabase 스토리지 인스턴스
supabase_storage = SupabaseStorage()
