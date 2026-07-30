"""
Development test script with mock and cache demonstrations
"""

import asyncio
import os
import sys

# Add backend to path
sys.path.insert(0, os.path.dirname(__file__))

from app.ai_service import AIService

# Test text samples
INSURANCE_TEXT = """
INSURANCE APPLICATION FORM
Applicant Name: John Smith
Age: 35
Medical History: High blood pressure (diagnosed 2020), currently on medication.
Coverage Type: Life Insurance
"""

RECEIPT_TEXT = """
STARBUCKS COFFEE SHOP
123 Main Street
New York, NY 10001

Order Receipt
Date: 2026-07-31
Time: 14:30

Items:
- Grande Cappuccino    $5.50

Total: $5.50
Payment: Card
"""


async def test_with_mock():
    """Test with mock responses (no API calls)"""
    print("\n" + "=" * 60)
    print("TEST 1: Mock Mode (No API Calls)")
    print("=" * 60)

    service = AIService(use_mock=True, use_cache=False)

    print("\n📄 Classifying insurance document...")
    result = await service.classify_document(INSURANCE_TEXT)
    print(f"Result: {result}")

    print("\n📄 Extracting insurance fields...")
    result = await service.extract_insurance_fields(INSURANCE_TEXT)
    print(f"Result: {result}")

    print("\n📄 Extracting receipt fields...")
    result = await service.extract_receipt_fields(RECEIPT_TEXT)
    print(f"Result: {result}")


async def test_with_cache():
    """Test with cache enabled (first call hits API, subsequent calls use cache)"""
    print("\n" + "=" * 60)
    print("TEST 2: Cache Mode (API + Cache)")
    print("=" * 60)

    service = AIService(use_mock=False, use_cache=True)

    print("\n📄 First call - will use API (or fail if quota exceeded)...")
    try:
        result = await service.classify_document(INSURANCE_TEXT)
        print(f"✅ Result: {result}")
    except Exception as e:
        print(f"❌ Failed (expected if quota exceeded): {str(e)[:100]}")

    print("\n📄 Second call with same text - will use cache...")
    try:
        result = await service.classify_document(INSURANCE_TEXT)
        print(f"✅ Result: {result}")
    except Exception as e:
        print(f"❌ Failed: {str(e)[:100]}")


async def test_cache_behavior():
    """Demonstrate cache behavior"""
    print("\n" + "=" * 60)
    print("TEST 3: Cache Behavior Demo")
    print("=" * 60)

    service = AIService(use_mock=True, use_cache=True)

    print("\n📄 First call...")
    result1 = await service.classify_document(INSURANCE_TEXT)
    print(f"Result: {result1}")

    print("\n📄 Second call (should load from cache)...")
    result2 = await service.classify_document(INSURANCE_TEXT)
    print(f"Result: {result2}")

    print("\n💾 Cache files created:")
    import json
    from pathlib import Path

    cache_dir = Path(__file__).parent / "app" / ".cache"
    if cache_dir.exists():
        for f in cache_dir.glob("*.json"):
            print(f"  - {f.name}")
            with open(f) as file:
                data = json.load(file)
                print(f"    {json.dumps(data, ensure_ascii=False)[:80]}...")


async def main():
    print("\n🚀 SnapFill AI Service Development Tests")
    print("=" * 60)

    await test_with_mock()
    await test_with_cache()
    await test_cache_behavior()

    print("\n" + "=" * 60)
    print("✅ All tests completed!")
    print("=" * 60)


if __name__ == "__main__":
    asyncio.run(main())
