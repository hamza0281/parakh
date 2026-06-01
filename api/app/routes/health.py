from fastapi import APIRouter
from pydantic import BaseModel
from app.config import get_settings
from app.services.cache import get_redis

router = APIRouter()


class HealthResponse(BaseModel):
    status: str
    version: str
    services: dict


@router.get("/health", response_model=HealthResponse)
async def health_check():
    """
    Health endpoint — verifies API is up and dependencies are reachable.
    Used by Railway for liveness probes and by frontend for connection check.
    """
    settings = get_settings()

    services = {
        "api": "healthy",
        "groq_key_configured": bool(settings.groq_api_key and settings.groq_api_key.startswith("gsk_")),
        "gemini_key_configured": bool(settings.gemini_api_key and settings.gemini_api_key.startswith("AIza")),
        "hf_key_configured": bool(settings.hf_api_key and settings.hf_api_key.startswith("hf_")),
    }

    # Check Redis (optional — degrades gracefully if down)
    try:
        r = await get_redis()
        await r.ping()
        services["redis"] = "healthy"
    except Exception as e:
        services["redis"] = f"unavailable ({type(e).__name__})"

    overall = "healthy" if services["api"] == "healthy" else "degraded"

    return HealthResponse(
        status=overall,
        version="0.1.0",
        services=services,
    )
