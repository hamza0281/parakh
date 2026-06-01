"""Quick Phase 3 API integration test — no long async pipeline calls."""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def run():
    print("Testing combined L4+L6 endpoint...")
    r = client.post("/api/v1/analyze?demo=zen-sound-pro", json={"url": "https://www.amazon.com/dp/DEMO"})
    assert r.status_code == 200, f"Expected 200, got {r.status_code}: {r.text[:200]}"
    body = r.json()

    print(f"  original={body['original_score']}, adjusted={body['adjusted_score']}")
    print(f"  flagged={body['flagged_count']}/{body['total_reviews']}")
    print(f"  L4 present: {body['layer_results']['l4'] is not None}")
    print(f"  L6 present: {body['layer_results']['l6'] is not None}")

    l6 = body["layer_results"]["l6"]
    print(f"  L6 phantom features: {len(l6['phantom_features'])}")
    print(f"  L6 clusters: {len(l6['phantom_clusters'])}")
    print(f"  L6 flagged: {len(l6['flagged_review_ids'])}")
    print(f"  Reconstructed prompts: {len(body['reconstructed_prompts'])}")

    if body["reconstructed_prompts"]:
        print(f"  First prompt: {body['reconstructed_prompts'][0][:100]}...")

    # Schema checks
    for pf in l6["phantom_features"]:
        assert "feature_name" in pf
        assert "review_ids" in pf
        assert "confidence" in pf
        assert 0 <= pf["confidence"] <= 1

    for pc in l6["phantom_clusters"]:
        assert "cluster_id" in pc
        assert "reconstructed_prompt" in pc
        assert "phantom_features" in pc
        assert "avg_review_length" in pc
        assert "avg_stars" in pc

    print("PASS: L4+L6 combined endpoint schema correct")

    # Adjusted score should be <= original when fakes detected
    if body["flagged_count"] > 0:
        assert body["adjusted_score"] <= body["original_score"]
        print(f"PASS: Adjusted {body['adjusted_score']} <= original {body['original_score']}")

    # Regression tests
    r2 = client.post("/api/v1/analyze", json={"url": "https://google.com"})
    assert r2.status_code == 400
    r3 = client.get("/api/v1/health")
    assert r3.status_code == 200
    print("PASS: Phase 1+2 regression tests pass")

    # Power bank demo
    r4 = client.post("/api/v1/analyze?demo=power-max", json={"url": "https://www.amazon.com/dp/DEMO"})
    assert r4.status_code == 200
    body4 = r4.json()
    assert body4["layer_results"]["l6"] is not None
    print(f"PASS: Power bank demo works — L6 flagged: {len(body4['layer_results']['l6']['flagged_review_ids'])}")

    print("\nAll Phase 3 API tests PASSED")


if __name__ == "__main__":
    run()
