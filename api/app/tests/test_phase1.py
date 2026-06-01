"""
Phase 1 verification tests.
Run: venv\\Scripts\\python -m pytest app/tests/test_phase1.py -v
Or run directly: venv\\Scripts\\python app/tests/test_phase1.py
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_root_endpoint():
    r = client.get("/")
    assert r.status_code == 200
    body = r.json()
    assert body["name"] == "Parakh API"
    assert body["version"] == "0.1.0"
    print("PASS: GET /  returns metadata")


def test_health_endpoint():
    r = client.get("/api/v1/health")
    assert r.status_code == 200
    body = r.json()
    assert body["status"] in ("healthy", "degraded")
    assert body["version"] == "0.1.0"
    assert "services" in body
    assert body["services"]["api"] == "healthy"
    # API keys should be configured (we set them in .env)
    assert body["services"]["groq_key_configured"] is True, "Groq key should be loaded from .env"
    assert body["services"]["gemini_key_configured"] is True, "Gemini key should be loaded from .env"
    assert body["services"]["hf_key_configured"] is True, "HF key should be loaded from .env"
    print("PASS: GET /api/v1/health  returns healthy + all keys configured")


def test_analyze_invalid_url_rejected():
    r = client.post("/api/v1/analyze", json={"url": "https://google.com"})
    assert r.status_code == 400
    assert "amazon" in r.json()["detail"].lower()
    print("PASS: Non-Amazon URL rejected with 400")


def test_analyze_non_product_url_rejected():
    r = client.post("/api/v1/analyze", json={"url": "https://amazon.com/books"})
    assert r.status_code == 400
    assert "product" in r.json()["detail"].lower()
    print("PASS: Non-product Amazon URL rejected with 400")


def test_analyze_valid_url_accepted():
    r = client.post(
        "/api/v1/analyze",
        json={"url": "https://www.amazon.com/dp/B0DJYVX3RC"}
    )
    assert r.status_code == 200
    body = r.json()
    assert body["status"] == "phase_1_skeleton"
    assert "B0DJYVX3RC" in body["received_url"]
    print("PASS: Valid Amazon /dp/ URL accepted, returns phase_1_skeleton")


def test_analyze_missing_url_rejected():
    r = client.post("/api/v1/analyze", json={})
    assert r.status_code == 422  # Pydantic validation error
    print("PASS: Missing URL field rejected with 422")


def test_cors_headers_present():
    r = client.options(
        "/api/v1/health",
        headers={
            "Origin": "http://localhost:3000",
            "Access-Control-Request-Method": "GET",
        },
    )
    # CORS preflight should succeed
    assert r.status_code in (200, 204)
    assert "access-control-allow-origin" in {k.lower() for k in r.headers.keys()}
    print("PASS: CORS preflight passes for localhost:3000")


def test_docs_available():
    r = client.get("/docs")
    assert r.status_code == 200
    assert "swagger" in r.text.lower()
    print("PASS: Swagger docs at /docs are reachable")


def test_openapi_schema():
    r = client.get("/openapi.json")
    assert r.status_code == 200
    schema = r.json()
    assert schema["info"]["title"] == "Parakh API"
    assert "/api/v1/analyze" in schema["paths"]
    assert "/api/v1/health" in schema["paths"]
    print("PASS: OpenAPI schema lists all endpoints")


if __name__ == "__main__":
    print("=" * 60)
    print("PARAKH PHASE 1 VERIFICATION TESTS")
    print("=" * 60)
    failed = 0
    tests = [
        test_root_endpoint,
        test_health_endpoint,
        test_analyze_invalid_url_rejected,
        test_analyze_non_product_url_rejected,
        test_analyze_valid_url_accepted,
        test_analyze_missing_url_rejected,
        test_cors_headers_present,
        test_docs_available,
        test_openapi_schema,
    ]
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
        print(f"All {len(tests)} tests PASSED.")
    else:
        print(f"{failed} of {len(tests)} tests FAILED.")
    sys.exit(0 if failed == 0 else 1)
