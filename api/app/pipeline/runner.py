"""
Pipeline Runner — orchestrates all 5 detection layers.

Execution strategy:
  - Spec extraction first (shared by L4 + L6)
  - L1 (CPU-bound, async) + L2 (sync, fast) + L3 (sync, fast) run concurrently
  - L4 + L6 run concurrently (both need spec)
  - All results merged by aggregator

Phase 4: All 5 layers active.
"""
import asyncio
import time
from app.models.schemas import (
    Review, SpecSheet, L1Result, L2Result, L3Result, L4Result, L6Result
)
from app.pipeline.l1_stylometric import run_l1
from app.pipeline.l2_temporal import run_l2
from app.pipeline.l3_reviewer import run_l3
from app.pipeline.l4_spec_claim import run_l4, extract_spec_sheet
from app.pipeline.l6_phantom import run_l6
from app.logger import get_logger

logger = get_logger("runner")


async def run_all_layers(
    listing_text: str,
    specs_text: str,
    reviews: list[Review],
    title: str = "",
) -> tuple[L1Result, L2Result, L3Result, L4Result, L6Result]:
    """
    Run all 5 detection layers and return their results.

    Strategy:
    1. Extract spec sheet (needed by L4 + L6)
    2. Run L1 (async, model-based) concurrently with spec extraction
    3. Run L2 + L3 synchronously (fast, no I/O)
    4. Run L4 + L6 concurrently (both use spec)

    Returns:
        Tuple of (L1Result, L2Result, L3Result, L4Result, L6Result)
    """
    t_start = time.time()

    # ── Phase A: Spec extraction + L1 in parallel ─────────────────────────
    # L1 doesn't need spec, so it can run while spec is being extracted
    spec_task = asyncio.create_task(extract_spec_sheet(listing_text, specs_text))
    l1_task = asyncio.create_task(run_l1(reviews))

    spec, l1_result = await asyncio.gather(spec_task, l1_task, return_exceptions=True)

    # Handle spec extraction failure
    if isinstance(spec, Exception):
        logger.error(f"Spec extraction failed: {spec}")
        spec = SpecSheet(raw_text=listing_text[:200])

    # Handle L1 failure
    if isinstance(l1_result, Exception):
        logger.error(f"L1 failed: {l1_result}")
        l1_result = L1Result()

    t_spec = time.time()
    logger.info(f"Runner: Spec + L1 done in {t_spec - t_start:.1f}s")

    # ── Phase B: L2 + L3 synchronously (fast, no I/O) ─────────────────────
    loop = asyncio.get_event_loop()

    l2_result = await loop.run_in_executor(None, run_l2, reviews)
    l3_result = await loop.run_in_executor(None, run_l3, reviews)

    t_l23 = time.time()
    logger.info(f"Runner: L2 + L3 done in {t_l23 - t_spec:.1f}s")

    # ── Phase C: L4 + L6 in parallel (both use spec) ──────────────────────
    l4_task = asyncio.create_task(
        run_l4(listing_text=listing_text, specs_text=specs_text, reviews=reviews, _spec=spec)
    )
    l6_task = asyncio.create_task(
        run_l6(spec=spec, reviews=reviews, title=title)
    )

    l4_result, l6_result = await asyncio.gather(l4_task, l6_task, return_exceptions=True)

    if isinstance(l4_result, Exception):
        logger.error(f"L4 failed: {l4_result}")
        l4_result = L4Result(spec_sheet=spec)

    if isinstance(l6_result, Exception):
        logger.error(f"L6 failed: {l6_result}")
        l6_result = L6Result()

    t_end = time.time()
    logger.info(
        f"Runner: All layers done in {t_end - t_start:.1f}s | "
        f"L1={len(l1_result.flagged_review_ids)} "
        f"L2={len(l2_result.flagged_review_ids)} "
        f"L3={len(l3_result.flagged_review_ids)} "
        f"L4={len(l4_result.flagged_review_ids)} "
        f"L6={len(l6_result.flagged_review_ids)}"
    )

    return l1_result, l2_result, l3_result, l4_result, l6_result
