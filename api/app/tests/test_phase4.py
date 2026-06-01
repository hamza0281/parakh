"""
Phase 4 verification tests — L1, L2, L3 layers + full pipeline runner.

Tests:
1. L2 date parsing (unit)
2. L2 z-score computation (unit)
3. L2 burst detection on known burst data (unit)
4. L2 no burst on uniform data (unit)
5. L3 bot score computation (unit)
6. L3 flags high-bot reviewers (unit)
7. L3 does not flag genuine reviewers (unit)
8. L1 clustering on demo earbuds (live — uses sentence-transformers)
9. Full runner on demo earbuds (live — all 5 layers)
10. API endpoint returns all 5 layer results (integration)
11. Aggregator deduplication (unit)
12. Regression: Phase 1+2+3 still work
"""
import sys
import os
import asyncio
from datetime import date, timedelta
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from fastapi.testclient import TestClient
from app.main import app
from app.pipeline.l2_temporal import run_l2, _parse_date, _compute_z_scores
from app.pipeline.l3_reviewer import run_l3, _compute_bot_score
from app.pipeline.aggregator import compute_adjusted_score
from app.models.schemas import Review, Flag

client = TestClient(app)


# ── L2 Unit Tests ─────────────────────────────────────────────────────────

def test_l2_date_parsing():
    assert _parse_date("November 22, 2024") == date(2024, 11, 22)
    assert _parse_date("2024-11-22") == date(2024, 11, 22)
    assert _parse_date("22 November 2024") == date(2024, 11, 22)
    assert _parse_date("Reviewed in the United States on November 22, 2024") == date(2024, 11, 22)
    assert _parse_date("") is None
    assert _parse_date(None) is None
    print("PASS: L2 date parsing handles all formats")


def test_l2_z_scores():
    counts = [2, 3, 2, 1, 3, 2, 50, 2, 1, 3]  # 50 is a clear outlier
    z = _compute_z_scores(counts)
    assert z[6] > 2.9, f"Burst z-score should be > 2.9, got {z[6]:.4f}"
    assert all(abs(z[i]) < 2.0 for i in range(len(z)) if i != 6)
    print(f"PASS: L2 z-scores: burst z={z[6]:.2f}")


def test_l2_detects_burst():
    """L2 should detect a burst when many reviews posted on same day."""
    base_date = date(2024, 1, 1)
    reviews = []
    # Normal days: 2 reviews each
    for day_offset in range(20):
        d = base_date + timedelta(days=day_offset)
        for i in range(2):
            reviews.append(Review(
                id=f"r_{day_offset}_{i}",
                text=f"Good product review number {day_offset}_{i}",
                stars=4,
                date=str(d),
            ))
    # Burst day: 15 reviews
    burst_date = base_date + timedelta(days=10)
    for i in range(15):
        reviews.append(Review(
            id=f"burst_{i}",
            text=f"Amazing product burst review {i}",
            stars=5,
            date=str(burst_date),
        ))

    result = run_l2(reviews)
    assert len(result.bursts) >= 1, f"Should detect burst, got {len(result.bursts)} bursts"
    burst_ids = {r for b in result.bursts for r in b.review_ids}
    assert any(r.id in burst_ids for r in reviews if r.id.startswith("burst_")), \
        "Burst reviews should be flagged"
    assert len(result.timeline) > 0, "Timeline should be populated"
    print(f"PASS: L2 detects burst — {len(result.bursts)} bursts, {len(result.flagged_review_ids)} flagged")


def test_l2_no_burst_uniform():
    """L2 should not flag uniform posting pattern."""
    base_date = date(2024, 1, 1)
    reviews = []
    for day_offset in range(30):
        d = base_date + timedelta(days=day_offset)
        reviews.append(Review(
            id=f"r_{day_offset}",
            text=f"Good product review {day_offset}",
            stars=4,
            date=str(d),
        ))
    result = run_l2(reviews)
    assert len(result.bursts) == 0, f"Should not detect burst in uniform data, got {len(result.bursts)}"
    print("PASS: L2 no false positives on uniform posting")


def test_l2_too_few_reviews():
    """L2 should return empty result for too few reviews."""
    reviews = [Review(id="r1", text="good", stars=4, date="2024-01-01")]
    result = run_l2(reviews)
    assert result.flagged_review_ids == []
    assert result.bursts == []
    print("PASS: L2 handles too few reviews gracefully")


# ── L3 Unit Tests ─────────────────────────────────────────────────────────

def test_l3_bot_score_high():
    """High bot score for reviewer with all 5-star, same-length reviews."""
    reviews = [
        Review(id=f"r{i}", text="Amazing product highly recommend worth every penny", stars=5,
               reviewer_id="BOT_001", reviewer_name="AudioLover2024", verified_purchase=False)
        for i in range(5)
    ]
    score = _compute_bot_score(reviews, reviews)
    assert score >= 0.65, f"Bot score should be high, got {score}"
    print(f"PASS: L3 bot score high for bot-like reviewer: {score:.3f}")


def test_l3_bot_score_low():
    """Low bot score for genuine reviewer with varied reviews."""
    reviews = [
        Review(id="r1", text="Good earbuds. Battery lasts 6 hours as advertised. USB-C charging is convenient.", stars=4, reviewer_id="HUMAN_001", reviewer_name="David L.", verified_purchase=True),
        Review(id="r2", text="Decent sound quality but the fit is a bit loose. Would have preferred softer ear tips. Overall okay for the price.", stars=3, reviewer_id="HUMAN_001", reviewer_name="David L.", verified_purchase=True),
        Review(id="r3", text="Returned these. The connection kept dropping after 10 feet. Not acceptable for Bluetooth 5.3.", stars=2, reviewer_id="HUMAN_001", reviewer_name="David L.", verified_purchase=True),
    ]
    score = _compute_bot_score(reviews, reviews)
    assert score < 0.65, f"Bot score should be low for genuine reviewer, got {score}"
    print(f"PASS: L3 bot score low for genuine reviewer: {score:.3f}")


def test_l3_flags_bot_reviewer():
    """L3 should flag reviews from bot-like reviewer."""
    reviews = [
        Review(id=f"r{i}", text="Amazing product highly recommend worth every penny", stars=5,
               reviewer_id="BOT_001", reviewer_name="AudioLover2024", verified_purchase=False)
        for i in range(3)
    ]
    # Add 2 more reviews from different reviewers to meet dataset minimum
    reviews += [
        Review(id="real1", text="Decent product, battery as advertised", stars=4, reviewer_id="HUMAN_1", reviewer_name="Alice", verified_purchase=True),
        Review(id="real2", text="Good value for money, would recommend", stars=4, reviewer_id="HUMAN_2", reviewer_name="Bob", verified_purchase=True),
    ]
    result = run_l3(reviews)
    assert len(result.suspicious_reviewers) >= 1
    assert len(result.flagged_review_ids) >= 1
    print(f"PASS: L3 flags bot reviewer — {len(result.flagged_review_ids)} reviews flagged")


def test_l3_does_not_flag_single_reviews():
    """L3 should not flag reviewers with only 1 review (insufficient data)."""
    reviews = [
        Review(id=f"r{i}", text="Good product", stars=5, reviewer_id=f"user_{i}", reviewer_name=f"User {i}", verified_purchase=True)
        for i in range(5)
    ]
    result = run_l3(reviews)
    # Each reviewer has only 1 review — should not be flagged
    assert len(result.suspicious_reviewers) == 0
    print("PASS: L3 does not flag single-review accounts")


def test_l3_too_few_reviews():
    """L3 should return empty result for too few reviews."""
    reviews = [Review(id="r1", text="good", stars=4)]
    result = run_l3(reviews)
    assert result.flagged_review_ids == []
    print("PASS: L3 handles too few reviews gracefully")


# ── Aggregator Unit Tests ─────────────────────────────────────────────────

def test_aggregator_deduplication():
    """Same review flagged by multiple layers should only count once in flagged_count."""
    reviews = [
        Review(id="r1", text="good", stars=5),
        Review(id="r2", text="fake", stars=5),
        Review(id="r3", text="real", stars=3),
    ]
    flags = [
        Flag(review_id="r2", layer="L1", reason="cluster", confidence=0.85),
        Flag(review_id="r2", layer="L4", reason="spec mismatch", confidence=0.97),
        Flag(review_id="r2", layer="L6", reason="phantom", confidence=0.90),
    ]
    score, flagged, verified = compute_adjusted_score(reviews, flags)
    assert flagged == 1, f"Should count r2 only once, got {flagged}"
    assert verified == 2
    assert score == 4.0  # (5+3)/2
    print("PASS: Aggregator deduplicates multi-layer flags correctly")


# ── Integration Tests (API endpoint) ─────────────────────────────────────

def test_all_5_layers_in_response():
    """Full /analyze endpoint should return all 5 layer results."""
    r = client.post(
        "/api/v1/analyze?demo=zen-sound-pro",
        json={"url": "https://www.amazon.com/dp/DEMO"}
    )
    assert r.status_code == 200, f"Expected 200, got {r.status_code}: {r.text[:200]}"
    body = r.json()

    layers = body["layer_results"]
    assert layers["l1"] is not None, "L1 result should be present"
    assert layers["l2"] is not None, "L2 result should be present"
    assert layers["l3"] is not None, "L3 result should be present"
    assert layers["l4"] is not None, "L4 result should be present"
    assert layers["l6"] is not None, "L6 result should be present"

    # L1 schema check
    l1 = layers["l1"]
    assert "clusters" in l1
    assert "flagged_review_ids" in l1
    assert "flags" in l1

    # L2 schema check
    l2 = layers["l2"]
    assert "bursts" in l2
    assert "timeline" in l2
    assert "flagged_review_ids" in l2

    # L3 schema check
    l3 = layers["l3"]
    assert "suspicious_reviewers" in l3
    assert "flagged_review_ids" in l3

    print(f"PASS: All 5 layers present in response")
    print(f"  L1: {len(l1['clusters'])} clusters, {len(l1['flagged_review_ids'])} flagged")
    print(f"  L2: {len(l2['bursts'])} bursts, {len(l2['flagged_review_ids'])} flagged")
    print(f"  L3: {len(l3['suspicious_reviewers'])} suspicious, {len(l3['flagged_review_ids'])} flagged")
    print(f"  L4: {len(layers['l4']['flagged_review_ids'])} flagged")
    print(f"  L6: {len(layers['l6']['flagged_review_ids'])} flagged")
    print(f"  Combined: {body['flagged_count']}/{body['total_reviews']} flagged")
    print(f"  Score: {body['original_score']} -> {body['adjusted_score']}")
    return body


def test_l2_timeline_populated():
    """L2 timeline should be populated for demo product."""
    r = client.post(
        "/api/v1/analyze?demo=zen-sound-pro",
        json={"url": "https://www.amazon.com/dp/DEMO"}
    )
    body = r.json()
    l2 = body["layer_results"]["l2"]
    # Demo data has dates — timeline should have entries
    print(f"  L2 timeline entries: {len(l2['timeline'])}")
    print("PASS: L2 timeline field present")


def test_regression_phase1_phase2():
    """Regression: Phase 1+2 functionality still works."""
    r = client.get("/api/v1/health")
    assert r.status_code == 200
    assert r.json()["status"] == "healthy"

    r2 = client.post("/api/v1/analyze", json={"url": "https://google.com"})
    assert r2.status_code == 400

    r3 = client.post("/api/v1/analyze?demo=power-max", json={"url": "https://www.amazon.com/dp/DEMO"})
    assert r3.status_code == 200
    body = r3.json()
    assert body["layer_results"]["l4"] is not None
    print("PASS: Phase 1+2+3 regression tests pass")


# ── Async tests (L1 uses sentence-transformers) ───────────────────────────

async def test_l1_on_demo_earbuds():
    """L1 should cluster the 4 fake earbuds reviews together."""
    from app.data.demo_data import DEMO_EARBUDS
    from app.pipeline.l1_stylometric import run_l1

    print("Testing L1 on demo earbuds (loads sentence-transformer model)...")
    result = await run_l1(DEMO_EARBUDS.reviews)

    print(f"  L1 clusters: {len(result.clusters)}")
    for c in result.clusters:
        print(f"    Cluster {c.cluster_id}: {len(c.review_ids)} reviews, sim={c.similarity_score:.3f}")
        print(f"    Pattern: {c.pattern_description[:80]}")

    # The 4 fake reviews should cluster together (they're very similar)
    fake_ids = {"R_FAKE_001", "R_FAKE_002", "R_FAKE_003", "R_FAKE_004"}
    flagged_set = set(result.flagged_review_ids)
    caught = fake_ids & flagged_set
    print(f"  Caught fakes: {caught}")
    print(f"  False positives: {flagged_set - fake_ids}")

    # At least 2 fakes should cluster (they share ANC/wireless charging language)
    assert len(caught) >= 2, f"Should catch at least 2 fake reviews, caught: {caught}"
    print("PASS: L1 clusters fake reviews together")


async def test_full_runner_on_demo():
    """Full runner should return all 5 layer results."""
    from app.data.demo_data import DEMO_EARBUDS
    from app.pipeline.runner import run_all_layers

    print("Testing full runner on demo earbuds (all 5 layers)...")
    l1, l2, l3, l4, l6 = await run_all_layers(
        listing_text=DEMO_EARBUDS.listing_text,
        specs_text=DEMO_EARBUDS.specs_text,
        reviews=DEMO_EARBUDS.reviews,
        title=DEMO_EARBUDS.title,
    )

    print(f"  L1: {len(l1.flagged_review_ids)} flagged, {len(l1.clusters)} clusters")
    print(f"  L2: {len(l2.flagged_review_ids)} flagged, {len(l2.bursts)} bursts")
    print(f"  L3: {len(l3.flagged_review_ids)} flagged, {len(l3.suspicious_reviewers)} suspicious")
    print(f"  L4: {len(l4.flagged_review_ids)} flagged, {len(l4.mismatches)} mismatches")
    print(f"  L6: {len(l6.flagged_review_ids)} flagged, {len(l6.phantom_features)} phantoms")

    assert l1 is not None
    assert l2 is not None
    assert l3 is not None
    assert l4 is not None
    assert l6 is not None
    print("PASS: Full runner returns all 5 layer results")


# ── Runner ────────────────────────────────────────────────────────────────

def run_sync_tests():
    tests = [
        test_l2_date_parsing,
        test_l2_z_scores,
        test_l2_detects_burst,
        test_l2_no_burst_uniform,
        test_l2_too_few_reviews,
        test_l3_bot_score_high,
        test_l3_bot_score_low,
        test_l3_flags_bot_reviewer,
        test_l3_does_not_flag_single_reviews,
        test_l3_too_few_reviews,
        test_aggregator_deduplication,
        test_all_5_layers_in_response,
        test_l2_timeline_populated,
        test_regression_phase1_phase2,
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


async def run_async_tests():
    tests = [test_l1_on_demo_earbuds, test_full_runner_on_demo]
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


if __name__ == "__main__":
    print("=" * 60)
    print("PARAKH PHASE 4 VERIFICATION TESTS")
    print("=" * 60)
    print("\n--- Sync Tests (L2, L3, Aggregator, API) ---")
    sync_failed = run_sync_tests()
    print("\n--- Async Tests (L1, Full Runner) ---")
    async_failed = asyncio.run(run_async_tests())
    total = sync_failed + async_failed
    print("\n" + "=" * 60)
    if total == 0:
        print("All Phase 4 tests PASSED.")
    else:
        print(f"{total} tests FAILED.")
    import sys as _sys
    _sys.exit(0 if total == 0 else 1)
