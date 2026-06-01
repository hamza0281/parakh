from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.config import get_settings
from app.logger import get_logger
from app.routes import health, analyze
from app.routes import cross_track

logger = get_logger("main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    logger.info("Parakh API starting up...")
    logger.info(f"Groq key: {'configured' if settings.groq_api_key else 'MISSING'}")
    logger.info(f"Gemini key: {'configured' if settings.gemini_api_key else 'MISSING'}")
    logger.info(f"HF key: {'configured' if settings.hf_api_key else 'MISSING'}")
    logger.info(f"Redis URL: {settings.redis_url}")

    yield

    logger.info("Parakh API shutting down...")


app = FastAPI(
    title="Parakh API",
    description="Reviews ki Parakh — fake review detection backend",
    version="0.1.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS configuration
settings = get_settings()
origins = [o.strip() for o in settings.cors_origins.split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Catch-all handler — logs error, returns clean JSON to client."""
    logger.exception(f"Unhandled error on {request.url.path}: {exc}")
    return JSONResponse(
        status_code=500,
        content={
            "error": "internal_server_error",
            "message": "An unexpected error occurred. The team has been notified.",
            "type": type(exc).__name__,
        },
    )


# ── Routes ──────────────────────────────────────────────────────────────────

app.include_router(health.router, prefix="/api/v1", tags=["health"])
app.include_router(analyze.router, prefix="/api/v1", tags=["analyze"])
app.include_router(cross_track.router, prefix="/api/v1", tags=["cross-track"])


@app.get("/", tags=["root"])
async def root():
    """Root endpoint — basic info."""
    return {
        "name": "Parakh API",
        "tagline": "Reviews ki Parakh. Khara ya Khota?",
        "version": "0.1.0",
        "docs": "/docs",
        "health": "/api/v1/health",
    }
