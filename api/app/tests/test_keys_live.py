"""
Live API key verification — actually hits Groq, Gemini, and HuggingFace.
This is critical: keys configured != keys valid.
"""
import sys
import os
import asyncio
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from app.services.llm_client import groq_text, gemini_text
from app.services.nli_client import check_nli


async def test_groq_live():
    print("Testing Groq API (Llama 3.3)...")
    try:
        resp = await groq_text("Say only the word: PARAKH")
        assert "PARAKH" in resp.upper(), f"Unexpected response: {resp[:100]}"
        print(f"  PASS: Groq responded -> {resp[:60]}")
        return True
    except Exception as e:
        print(f"  FAIL: Groq error -> {type(e).__name__}: {e}")
        return False


async def test_gemini_live():
    print("Testing Gemini API (gemini-2.5-flash)...")
    try:
        resp = await gemini_text("Say only the word: PARAKH")
        assert "PARAKH" in resp.upper(), f"Unexpected response: {resp[:100]}"
        print(f"  PASS: Gemini responded -> {resp[:60]}")
        return True
    except Exception as e:
        print(f"  FAIL: Gemini error -> {type(e).__name__}: {e}")
        return False


async def test_hf_nli_live():
    print("Testing HuggingFace NLI API...")
    try:
        result = await check_nli(
            premise="The product has only USB-C charging.",
            hypothesis="The product supports wireless charging.",
        )
        # NEUTRAL acceptable if model is loading; ideally CONTRADICTION
        print(f"  PASS: HF NLI responded -> label={result.label}, score={result.score:.3f}")
        return True
    except Exception as e:
        print(f"  FAIL: HF error -> {type(e).__name__}: {e}")
        return False


async def main():
    print("=" * 60)
    print("LIVE API KEY VERIFICATION")
    print("=" * 60)
    results = await asyncio.gather(
        test_groq_live(),
        test_gemini_live(),
        test_hf_nli_live(),
    )
    passed = sum(results)
    total = len(results)
    print("=" * 60)
    print(f"{passed}/{total} live API tests passed.")
    return passed == total


if __name__ == "__main__":
    success = asyncio.run(main())
    sys.exit(0 if success else 1)
