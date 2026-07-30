"""
형식에 맞지 않은 이미지 업로드 테스트
"""

import asyncio
import sys
import os
from pathlib import Path

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "backend"))

from app.config import settings
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def create_test_files():
    """다양한 형식의 테스트 파일 생성"""
    test_dir = Path(__file__).parent / "test_files"
    test_dir.mkdir(exist_ok=True)

    # 1. PDF 파일 (형식 오류)
    pdf_path = test_dir / "test.pdf"
    with open(pdf_path, "wb") as f:
        f.write(b"%PDF-1.4\n%fake pdf content")
    print(f"✅ PDF 테스트 파일 생성: {pdf_path}")

    # 2. TXT 파일 (형식 오류)
    txt_path = test_dir / "test.txt"
    with open(txt_path, "w") as f:
        f.write("This is a text file, not an image")
    print(f"✅ TXT 테스트 파일 생성: {txt_path}")

    # 3. GIF 파일 (형식 오류)
    gif_path = test_dir / "test.gif"
    with open(gif_path, "wb") as f:
        f.write(b"GIF89a\x01\x00\x01\x00\x00\x00\x00\x00\x00\x00\x00")
    print(f"✅ GIF 테스트 파일 생성: {gif_path}")

    # 4. 유효한 PNG (형식 정상)
    png_path = test_dir / "valid.png"
    from PIL import Image
    img = Image.new('RGB', (100, 100), color='white')
    img.save(png_path)
    print(f"✅ PNG 테스트 파일 생성: {png_path}")

    # 5. 유효한 JPG (형식 정상)
    jpg_path = test_dir / "valid.jpg"
    img.save(jpg_path, "JPEG")
    print(f"✅ JPG 테스트 파일 생성: {jpg_path}")

    return {
        "pdf": pdf_path,
        "txt": txt_path,
        "gif": gif_path,
        "png": png_path,
        "jpg": jpg_path
    }


def test_upload(file_path: Path, expected_status: int, description: str):
    """
    파일 업로드 테스트
    """
    print(f"\n{'='*70}")
    print(f"테스트: {description}")
    print(f"{'='*70}")
    print(f"파일: {file_path.name}")
    print(f"예상 상태: {expected_status}")

    if not file_path.exists():
        print(f"❌ 파일 없음: {file_path}")
        return False

    with open(file_path, "rb") as f:
        files = {"file": (file_path.name, f)}
        try:
            response = client.post("/upload", files=files)

            print(f"\n📊 응답:")
            print(f"   상태 코드: {response.status_code}")

            if response.status_code == expected_status:
                print(f"   ✅ 예상 상태 코드 일치")
                result = response.json()
                if "error" in result:
                    print(f"   오류 메시지: {result.get('error')}")
                elif "success" in result:
                    print(f"   성공: {result.get('success')}")
                    print(f"   URL: {result.get('file_url', 'N/A')[:50]}...")
                return True
            else:
                print(f"   ❌ 예상과 다름 (예상: {expected_status}, 실제: {response.status_code})")
                print(f"   응답: {response.text[:200]}")
                return False

        except Exception as e:
            print(f"❌ 오류: {e}")
            return False


async def run_tests():
    """모든 테스트 실행"""
    print("=" * 70)
    print("🚀 형식 검증 테스트")
    print("=" * 70)
    print(f"허용 형식: {settings.ALLOWED_MIME_TYPES}")
    print(f"최대 파일 크기: {settings.MAX_FILE_SIZE / 1024 / 1024:.1f}MB")

    # 테스트 파일 생성
    test_files = create_test_files()

    print("\n" + "=" * 70)
    print("📋 테스트 케이스")
    print("=" * 70)

    results = {}

    # 테스트 1: PDF (형식 오류)
    results["pdf"] = test_upload(
        test_files["pdf"],
        400,
        "❌ PDF 파일 업로드 (형식 오류 예상)"
    )

    # 테스트 2: TXT (형식 오류)
    results["txt"] = test_upload(
        test_files["txt"],
        400,
        "❌ TXT 파일 업로드 (형식 오류 예상)"
    )

    # 테스트 3: GIF (형식 오류)
    results["gif"] = test_upload(
        test_files["gif"],
        400,
        "❌ GIF 파일 업로드 (형식 오류 예상)"
    )

    # 테스트 4: PNG (형식 정상)
    results["png"] = test_upload(
        test_files["png"],
        200,
        "✅ PNG 파일 업로드 (성공 예상)"
    )

    # 테스트 5: JPG (형식 정상)
    results["jpg"] = test_upload(
        test_files["jpg"],
        200,
        "✅ JPG 파일 업로드 (성공 예상)"
    )

    # 최종 결과
    print("\n" + "=" * 70)
    print("📊 최종 결과")
    print("=" * 70)

    passed = sum(1 for v in results.values() if v)
    total = len(results)

    for test_name, passed_test in results.items():
        status = "✅ Pass" if passed_test else "❌ Fail"
        print(f"{test_name.upper():6} {status}")

    print(f"\n총점: {passed}/{total}")

    if passed == total:
        print("🎉 모든 테스트 통과!")
        return True
    else:
        print(f"⚠️  {total - passed}개 테스트 실패")
        return False


if __name__ == "__main__":
    success = asyncio.run(run_tests())
    sys.exit(0 if success else 1)
