"""Phase 6 verification tests."""
import sys
import os
import json
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health():
    r = client.get("/api/v1/health")
    assert r.status_code == 200
    print("PASS: Health endpoint")


def test_cross_track_academia_demo():
    r = client.get("/api/v1/cross-track/demo/academia")
    assert r.status_code == 200
    body = r.json()
    assert "document" in body and "reference" in body
    print("PASS: Cross-track academia demo endpoint")


def test_cross_track_hiring_demo():
    r = client.get("/api/v1/cross-track/demo/hiring")
    assert r.status_code == 200
    body = r.json()
    assert "document" in body and "reference" in body
    print("PASS: Cross-track hiring demo endpoint")


def test_cross_track_invalid_track():
    r = client.post("/api/v1/cross-track/analyze", json={
        "track": "invalid", "document": "test", "reference": "test"
    })
    assert r.status_code == 422
    print("PASS: Cross-track invalid track rejected with 422")


def test_cross_track_in_openapi():
    r = client.get("/openapi.json")
    schema = r.json()
    assert "/api/v1/cross-track/analyze" in schema["paths"]
    assert "/api/v1/cross-track/demo/{track}" in schema["paths"]
    print("PASS: Cross-track endpoints in OpenAPI schema")


def test_bakeoff_files_exist():
    assert os.path.exists("docs/bakeoff_results.md"), "bakeoff_results.md should exist"
    assert os.path.exists("docs/bakeoff_data.json"), "bakeoff_data.json should exist"
    print("PASS: Bakeoff result files exist")


def test_bakeoff_metrics_valid():
    with open("docs/bakeoff_data.json") as f:
        data = json.load(f)
    assert "metrics" in data
    m = data["metrics"]
    assert "precision" in m and "recall" in m and "f1" in m
    assert m["precision"] > 0, "Precision should be > 0"
    assert m["recall"] > 0, "Recall should be > 0"
    assert m["total"] == 25, "Should have 25 test samples"
    prec = m["precision"]
    rec = m["recall"]
    print(f"PASS: Bakeoff metrics valid (precision={prec:.1%}, recall={rec:.1%}, f1={m['f1']:.3f})")


def test_bakeoff_results_md_content():
    with open("docs/bakeoff_results.md", encoding="utf-8") as f:
        content = f.read()
    assert "Confusion Matrix" in content
    assert "Precision" in content
    assert "Recall" in content
    assert "F1 Score" in content
    assert "Honest Analysis" in content
    print("PASS: Bakeoff results markdown has all required sections")


def test_readme_exists():
    readme_path = os.path.join(
        os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))),
        "README.md"
    )
    assert os.path.exists(readme_path), f"README.md should exist at {readme_path}"
    with open(readme_path, encoding="utf-8") as f:
        content = f.read()
    assert "Parakh" in content
    assert "5-Layer" in content
    assert "Bake-Off" in content
    assert "Cross-Track" in content
    print("PASS: README.md exists with all required sections")


def test_regression_all_phases():
    # Phase 1: health
    r = client.get("/api/v1/health")
    assert r.status_code == 200
    # Phase 2: URL validation
    r = client.post("/api/v1/analyze", json={"url": "https://google.com"})
    assert r.status_code == 400
    # Phase 3+4: demo endpoint
    r = client.post("/api/v1/analyze?demo=zen-sound-pro", json={"url": "https://www.amazon.com/dp/DEMO"})
    assert r.status_code == 200
    body = r.json()
    assert body["layer_results"]["l4"] is not None
    assert body["layer_results"]["l6"] is not None
    print("PASS: Phase 1-5 regression tests pass")


if __name__ == "__main__":
    print("=" * 60)
    print("PARAKH PHASE 6 VERIFICATION TESTS")
    print("=" * 60)
    tests = [
        test_health,
        test_cross_track_academia_demo,
        test_cross_track_hiring_demo,
        test_cross_track_invalid_track,
        test_cross_track_in_openapi,
        test_bakeoff_files_exist,
        test_bakeoff_metrics_valid,
        test_bakeoff_results_md_content,
        test_readme_exists,
        test_regression_all_phases,
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
    print("=" * 60)
    if failed == 0:
        print("All Phase 6 tests PASSED.")
    else:
        print(f"{failed} tests FAILED.")
    sys.exit(0 if failed == 0 else 1)
