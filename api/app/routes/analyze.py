"""
Analyze route — main analysis endpoint.

Phase 4: All 5 layers active (L1 + L2 + L3 + L4 + L6).
"""
import time
from fastapi import APIRouter, HTTPException, Query
from app.models.schemas import AnalyzeRequest, AnalyzeResponse
from app.services.amazon_scraper import scrape_product
from app.services.cache import get_cached, set_cached, make_cache_key
from app.pipeline.runner import run_all_layers
from app.pipeline.aggregator import build_response
from app.data.demo_data import get_demo_product
from app.logger import get_logger

router = APIRouter()
logger = get_logger("analyze")


def _validate_amazon_url(url: str) -> None:
    """Validate URL is an Amazon product page."""
    url_lower = url.lower().strip()
    if not url_lower:
        raise HTTPException(status_code=400, detail="URL cannot be empty.")
    if "amazon." not in url_lower:
        raise HTTPException(
            status_code=400,
            detail="URL must be from amazon.com, amazon.in, amazon.co.uk, etc.",
        )
    if "/dp/" not in url and "/product/" not in url:
        raise HTTPException(
            status_code=400,
            detail="URL must be a product page (contain /dp/ or /product/).",
        )


@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze(
    request: AnalyzeRequest,
    demo: str = Query(default=None, description="Demo product ID (zen-sound-pro, power-max)"),
):
    """
    POST /api/v1/analyze

    Analyzes an Amazon product URL for fake AI-generated reviews.
    Runs all 5 detection layers: L1 + L2 + L3 + L4 + L6.

    Query params:
    - demo: Use pre-cached demo data (zen-sound-pro | power-max)
    """
    start_time = time.time()

    # ── Demo mode ─────────────────────────────────────────────────────────
    if demo:
        product = get_demo_product(demo)
        if not product:
            raise HTTPException(
                status_code=404,
                detail=f"Demo product '{demo}' not found. Available: zen-sound-pro, power-max",
            )
        logger.info(f"Demo mode: {demo} ({len(product.reviews)} reviews)")
        cache_key = f"demo:{demo}"

        l1, l2, l3, l4, l6 = await run_all_layers(
            listing_text=product.listing_text,
            specs_text=product.specs_text,
            reviews=product.reviews,
            title=product.title,
        )

        elapsed = time.time() - start_time
        return build_response(
            cache_key=cache_key,
            product=product,
            l1_result=l1,
            l2_result=l2,
            l3_result=l3,
            l4_result=l4,
            l6_result=l6,
            analysis_time=elapsed,
            cached=False,
        )

    # ── Live mode ─────────────────────────────────────────────────────────
    _validate_amazon_url(request.url)
    logger.info(f"Analyze request: {request.url[:80]}")

    cache_key = make_cache_key(request.url)

    # Check cache
    cached_data = await get_cached(cache_key)
    if cached_data:
        logger.info(f"Cache hit: {cache_key}")
        try:
            response = AnalyzeResponse(**cached_data)
            response.cached = True
            return response
        except Exception:
            logger.warning("Cache deserialization failed, re-running pipeline")

    # Scrape product
    try:
        product = await scrape_product(request.url, max_reviews=request.max_reviews)
    except Exception as e:
        logger.error(f"Scraping failed for {request.url}: {e}")
        raise HTTPException(
            status_code=422,
            detail="Could not fetch product page. Amazon may be blocking the request. Try again or use a demo URL.",
        )

    if not product.reviews:
        raise HTTPException(
            status_code=422,
            detail="No reviews found on this product page.",
        )

    if len(product.reviews) < 5:
        raise HTTPException(
            status_code=422,
            detail=f"Only {len(product.reviews)} reviews found. Parakh needs at least 5 reviews to analyze.",
        )

    logger.info(f"Scraped: {product.title[:60]} — {len(product.reviews)} reviews")

    # Run all 5 layers
    l1, l2, l3, l4, l6 = await run_all_layers(
        listing_text=product.listing_text,
        specs_text=product.specs_text,
        reviews=product.reviews,
        title=product.title,
    )

    elapsed = time.time() - start_time

    # Build response
    response = build_response(
        cache_key=cache_key,
        product=product,
        l1_result=l1,
        l2_result=l2,
        l3_result=l3,
        l4_result=l4,
        l6_result=l6,
        analysis_time=elapsed,
        cached=False,
    )

    # Cache result for 24 hours
    try:
        await set_cached(cache_key, response.model_dump(), ttl=86400)
    except Exception as e:
        logger.warning(f"Cache write failed: {e}")

    logger.info(
        f"Analysis complete: {product.title[:40]} | "
        f"original={response.original_score} adjusted={response.adjusted_score} | "
        f"flagged={response.flagged_count}/{response.total_reviews} | "
        f"time={elapsed:.1f}s"
    )

    return response
