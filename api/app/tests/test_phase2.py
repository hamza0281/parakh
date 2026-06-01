"""
Phase 2 verification tests — L4 Spec-Claim Mismatch pipeline.

Tests:
1. Spec extraction from listing text
2. Claim extraction from review text
3. L4 pipeline on demo data (known fake reviews)
4. Full /analyze endpoint with demo mode
5. Adjusted score computation
6. Edge cases: empty reviews, no mismatches, all mismatches
"""
import sys
import os
import asyncio
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from fastapi.testclient import TestClient
from app.main import app
from app.pipeline.l4_spec_claim import (
    extract_spec_sheet, extract_claims_from_review, run_l4,
    _feature_in_list, _normalize_feature
)
from app.pipeline.aggregator import compute_adjusted_score
from app.models.schemas import Review, Flag, SpecSheet
from app.data.demo_data import DEMO_EARBUDS, DEMO_POWERBANK

client = TestClient(app)


# ── Unit tests ────────────────────────────────────────────────────────────

def test_normalize_feature():
    assert _normalize_feature("Active Noise Cancellation") == "active_noise_cancellation"
    assert _normalize_feature("wireless-charging") == "wireless_charging"
    assert _normalize_feature("  ANC  ") == "anc"
    print("PASS: _normalize_feature works correctly")


def test_feature_in_list():
    features = ["active_noise_cancellation", "usb_c_charging", "bluetooth_5_3"]
    assert _feature_in_list("anc", features) is True
    assert _feature_in_list("active noise cancellation", features) is True
    assert _feature_in_list("wireless_charging", features) is False
    assert _feature_in_list("usb_c", features) is True
    print("PASS: _feature_in_list handles synonyms and substrings")


def test_adjusted_score_no_flags():
    reviews = [
        Review(id="r1", text="good", stars=5),
        Review(id="r2", text="ok", stars=4),
        Review(id="r3", text="fine", stars=3),
    ]
    score, flagged, verified = compute_adjusted_score(reviews, [])
    assert score == 4.0
    assert flagged == 0
    assert verified == 3
    print("PASS: Adjusted score with no flags = original score")


def test_adjusted_score_with_flags():
    reviews = [
        Review(id="r1", text="good", stars=5),
        Review(id="r2", text="fake", stars=5),
        Review(id="r3", text="real", stars=3),
    ]
    flags = [Flag(review_id="r2", layer="L4", reason="test", confidence=0.95)]
    score, flagged, verified = compute_adjusted_score(reviews, flags)
    assert flagged == 1
    assert verified == 2
    assert score == 4.0  # (5+3)/2
    print("PASS: Adjusted score correctly excludes flagged reviews")


def test_adjusted_score_low_confidence_not_flagged():
    reviews = [
        Review(id="r1", text="good", stars=5),
        Review(id="r2", text="maybe", stars=5),
    ]
    # Low confidence flag should NOT exclude review
    flags = [Flag(review_id="r2", layer="L4", reason="test", confidence=0.50)]
    score, flagged, verified = compute_adjusted_score(reviews, flags)
    assert flagged == 0  # below threshold
    assert verified == 2
    print("PASS: Low confidence flags don't exclude reviews")


# ── Integration tests (async) ─────────────────────────────────────────────

async def test_spec_extraction_live():
    """Test spec extraction with real LLM call."""
    print("Testing spec extraction (live Groq call)...")
    listing = DEMO_EARBUDS.listing_text
    specs = DEMO_EARBUDS.specs_text
    spec = await extract_spec_sheet(listing, specs)

    assert spec.product_type != "unknown", f"Product type should be detected, got: {spec.product_type}"
    assert len(spec.features_present) > 0, "Should have features_present"
    # Key features that MUST be detected as present
    listing_lower = listing.lower()
    if "bluetooth" in listing_lower:
        assert any("bluetooth" in f.lower() for f in spec.features_present), \
            f"Bluetooth should be in features_present. Got: {spec.features_present}"
    print(f"  Product type: {spec.product_type}")
    print(f"  Features present: {spec.features_present[:5]}")
    print(f"  Features absent: {spec.features_absent[:3]}")
    print(f"  Numerical specs: {spec.numerical_specs}")
    print("PASS: Spec extraction returns structured data")
    return spec


async def test_claim_extraction_live():
    """Test claim extraction from a known fake review."""
    print("Testing claim extraction (live Groq call)...")
    fake_review = Review(
        id="test_r1",
        text="These earbuds have the BEST Active Noise Cancellation! The wireless charging case is so convenient, and the 30-hour battery is unbelievable.",
        stars=5,
    )
    claims = await extract_claims_from_review(fake_review, "wireless earbuds")
    assert len(claims) > 0, "Should extract claims from fake review"
    features = [c.get("feature", "").lower() for c in claims]
    print(f"  Extracted claims: {claims}")
    # Should detect ANC, wireless charging, battery claims
    has_anc = any("anc" in f or "noise" in f for f in features)
    has_wireless = any("wireless" in f or "charging" in f for f in features)
    has_battery = any("battery" in f for f in features)
    assert has_anc or has_wireless or has_battery, \
        f"Should detect at least one of ANC/wireless/battery. Got features: {features}"
    print("PASS: Claim extraction detects feature claims from fake review")
    return claims


async def test_l4_pipeline_demo_earbuds():
    """Test full L4 pipeline on demo earbuds — should flag fake reviews."""
    print("Testing L4 pipeline on demo earbuds (live API calls)...")
    product = DEMO_EARBUDS

    result = await run_l4(
        listing_text=product.listing_text,
        specs_text=product.specs_text,
        reviews=product.reviews,
    )

    print(f"  Spec type: {result.spec_sheet.product_type}")
    print(f"  Total reviews: {len(product.reviews)}")
    print(f"  Flagged reviews: {len(result.flagged_review_ids)}")
    print(f"  Mismatches: {len(result.mismatches)}")
    for m in result.mismatches[:3]:
        print(f"    - {m.review_id}: {m.claimed_feature} ({m.contradiction_type}, conf={m.confidence:.2f})")

    # Known fake reviews should be flagged
    fake_ids = {"R_FAKE_001", "R_FAKE_002", "R_FAKE_003", "R_FAKE_004"}
    real_ids = {"R_REAL_001", "R_REAL_002", "R_REAL_003", "R_REAL_004"}

    flagged_set = set(result.flagged_review_ids)

    # At least 2 of 4 fake reviews should be caught
    caught_fakes = fake_ids & flagged_set
    assert len(caught_fakes) >= 2, \
        f"Should catch at least 2 fake reviews. Caught: {caught_fakes}"

    # Real reviews should mostly NOT be flagged
    flagged_real = real_ids & flagged_set
    assert len(flagged_real) <= 1, \
        f"Should not flag more than 1 real review. Flagged real: {flagged_real}"

    print(f"  Caught fakes: {caught_fakes}")
    print(f"  Flagged real (false positives): {flagged_real}")
    print("PASS: L4 pipeline catches fake reviews and preserves real ones")
    return result


async def test_l4_empty_reviews():
    """L4 should handle empty review list gracefully."""
    result = await run_l4(
        listing_text="Some product",
        specs_text="",
        reviews=[],
    )
    assert result.flagged_review_ids == []
    assert result.mismatches == []
    print("PASS: L4 handles empty reviews gracefully")


async def test_l4_genuine_reviews_not_flagged():
    """Reviews that match spec should not be flagged."""
    listing = "USB-C wired earphones with 3.5mm adapter. No Bluetooth. Wired connection only."
    specs = "Connection: Wired 3.5mm. No Bluetooth. No wireless features."
    reviews = [
        Review(
            id="genuine_1",
            text="Good wired earphones. Sound quality is clear. The 3.5mm connection is solid. No wireless but that's fine.",
            stars=4,
        ),
        Review(
            id="genuine_2",
            text="Decent sound for the price. Wired connection means no battery worries. Comfortable fit.",
            stars=4,
        ),
    ]
    result = await run_l4(listing_text=listing, specs_text=specs, reviews=reviews)
    assert len(result.flagged_review_ids) == 0, \
        f"Genuine reviews should not be flagged. Got: {result.flagged_review_ids}"
    print("PASS: Genuine reviews not flagged")


# ── API endpoint tests ────────────────────────────────────────────────────

def test_demo_endpoint_earbuds():
    """Test /analyze?demo=zen-sound-pro endpoint."""
    r = client.post(
        "/api/v1/analyze?demo=zen-sound-pro",
        json={"url": "https://www.amazon.com/dp/DEMO"}
    )
    assert r.status_code == 200, f"Expected 200, got {r.status_code}: {r.text[:200]}"
    body = r.json()
    assert "adjusted_score" in body
    assert "original_score" in body
    assert "flagged_count" in body
    assert "layer_results" in body
    assert body["layer_results"]["l4"] is not None
    assert body["total_reviews"] > 0
    print(f"PASS: Demo endpoint returns full AnalyzeResponse")
    print(f"  original={body['original_score']}, adjusted={body['adjusted_score']}")
    print(f"  flagged={body['flagged_count']}/{body['total_reviews']}")
    return body


def test_demo_endpoint_powerbank():
    r = client.post(
        "/api/v1/analyze?demo=power-max",
        json={"url": "https://www.amazon.com/dp/DEMO"}
    )
    assert r.status_code == 200
    body = r.json()
    assert body["total_reviews"] > 0
    print(f"PASS: Power bank demo endpoint works")


def test_demo_invalid_id():
    r = client.post(
        "/api/v1/analyze?demo=nonexistent",
        json={"url": "https://www.amazon.com/dp/DEMO"}
    )
    assert r.status_code == 404
    print("PASS: Invalid demo ID returns 404")


def test_analyze_response_schema():
    """Verify response has all required fields."""
    r = client.post(
        "/api/v1/analyze?demo=zen-sound-pro",
        json={"url": "https://www.amazon.com/dp/DEMO"}
    )
    body = r.json()
    required_fields = [
        "cache_key", "product", "original_score", "adjusted_score",
        "total_reviews", "flagged_count", "verified_count",
        "all_flags", "layer_results", "analysis_time_seconds", "cached"
    ]
    for field in required_fields:
        assert field in body, f"Missing field: {field}"
    # Verify nested structure
    assert "l4" in body["layer_results"]
    assert "spec_sheet" in body["layer_results"]["l4"]
    assert "mismatches" in body["layer_results"]["l4"]
    assert "flags" in body["layer_results"]["l4"]
    print("PASS: Response schema has all required fields")


def test_adjusted_score_lower_than_original():
    """When fake reviews are detected, adjusted score should be <= original."""
    r = client.post(
        "/api/v1/analyze?demo=zen-sound-pro",
        json={"url": "https://www.amazon.com/dp/DEMO"}
    )
    body = r.json()
    if body["flagged_count"] > 0:
        assert body["adjusted_score"] <= body["original_score"], \
            f"Adjusted ({body['adjusted_score']}) should be <= original ({body['original_score']})"
        print(f"PASS: Adjusted score {body['adjusted_score']} <= original {body['original_score']}")
    else:
        print("INFO: No reviews flagged in this run (may vary by LLM response)")


def test_url_validation_still_works():
    """Phase 1 URL validation should still work."""
    r = client.post("/api/v1/analyze", json={"url": "https://google.com"})
    assert r.status_code == 400
    r2 = client.post("/api/v1/analyze", json={"url": "https://amazon.com/books"})
    assert r2.status_code == 400
    print("PASS: URL validation still works in Phase 2")


# ── Runner ────────────────────────────────────────────────────────────────

async def run_async_tests():
    tests = [
        test_spec_extraction_live,
        test_claim_extraction_live,
        test_l4_pipeline_demo_earbuds,
        test_l4_empty_reviews,
        test_l4_genuine_reviews_not_flagged,
    ]
    failed = 0
    for t in tests:
        try:
            await t()
        except AssertionError as e:
            print(f"FAIL: {t.__name__}: {e}")
            failed += 1
        except Exception as e:
            print(f"ERROR: {t.__name__}: {type(e).__name__}: {e}")
            failed += 1
    return failed


def run_sync_tests():
    tests = [
        test_normalize_feature,
        test_feature_in_list,
        test_adjusted_score_no_flags,
        test_adjusted_score_with_flags,
        test_adjusted_score_low_confidence_not_flagged,
        test_demo_endpoint_earbuds,
        test_demo_endpoint_powerbank,
        test_demo_invalid_id,
        test_analyze_response_schema,
        test_adjusted_score_lower_than_original,
        test_url_validation_still_works,
    ]
    failed = 0
    for t in tests:
        try:
            t()
        except AssertionError as e:
            print(f"FAIL: {t.__name__}: {e}")
            failed += 1
        except Exception as e:
            print(f"ERROR: {t.__name__}: {type(e).__name__}: {e}")
            failed += 1
    return failed


if __name__ == "__main__":
    print("=" * 60)
    print("PARAKH PHASE 2 VERIFICATION TESTS")
    print("=" * 60)
    print("\n--- Unit + API Tests (sync) ---")
    sync_failed = run_sync_tests()
    print("\n--- Pipeline Tests (async, live API calls) ---")
    async_failed = asyncio.run(run_async_tests())
    total_failed = sync_failed + async_failed
    print("\n" + "=" * 60)
    if total_failed == 0:
        print("All Phase 2 tests PASSED.")
    else:
        print(f"{total_failed} tests FAILED.")
    sys.exit(0 if total_failed == 0 else 1)
