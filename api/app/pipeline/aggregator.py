"""
Aggregator — merges all layer results into final adjusted score and verdict.

Phase 4: All 5 layers active (L1 + L2 + L3 + L4 + L6).
"""
from app.models.schemas import (
    Review, L1Result, L2Result, L3Result, L4Result, L6Result,
    LayerResults, Flag, AnalyzeResponse, ProductListing
)
from app.logger import get_logger

logger = get_logger("aggregator")

# Confidence threshold above which a review is considered flagged
FLAG_CONFIDENCE_THRESHOLD = 0.70


def compute_adjusted_score(
    reviews: list[Review],
    all_flags: list[Flag],
) -> tuple[float, int, int]:
    """
    Compute adjusted star rating from verified (non-flagged) reviews.

    Returns:
        (adjusted_score, flagged_count, verified_count)
    """
    if not reviews:
        return 0.0, 0, 0

    # Build set of flagged review IDs (high confidence only)
    flagged_ids = {
        f.review_id
        for f in all_flags
        if f.confidence >= FLAG_CONFIDENCE_THRESHOLD
    }

    verified_reviews = [r for r in reviews if r.id not in flagged_ids]
    flagged_count = len(reviews) - len(verified_reviews)

    if not verified_reviews:
        # All reviews flagged — return original score with warning
        original = sum(r.stars for r in reviews) / len(reviews)
        return round(original, 1), flagged_count, 0

    adjusted = sum(r.stars for r in verified_reviews) / len(verified_reviews)
    return round(adjusted, 1), flagged_count, len(verified_reviews)


def merge_flags(*layer_flags: list[Flag]) -> list[Flag]:
    """
    Merge flags from all layers.
    If same review flagged by multiple layers, keep all flags (different evidence).
    """
    all_flags = []
    for flags in layer_flags:
        all_flags.extend(flags)
    return all_flags


def build_response(
    cache_key: str,
    product: ProductListing,
    l4_result: L4Result,
    l1_result: L1Result | None = None,
    l2_result: L2Result | None = None,
    l3_result: L3Result | None = None,
    l6_result: L6Result | None = None,
    analysis_time: float = 0.0,
    cached: bool = False,
) -> AnalyzeResponse:
    """Build the final AnalyzeResponse from all layer results."""

    # Collect all flags
    all_flags = merge_flags(
        l4_result.flags,
        l1_result.flags if l1_result else [],
        l2_result.flags if l2_result else [],
        l3_result.flags if l3_result else [],
        l6_result.flags if l6_result else [],
    )

    # Original score
    original_score = product.rating or (
        sum(r.stars for r in product.reviews) / len(product.reviews)
        if product.reviews else 0.0
    )

    # Adjusted score
    adjusted_score, flagged_count, verified_count = compute_adjusted_score(
        product.reviews, all_flags
    )

    # Reconstructed prompts from L6
    reconstructed_prompts = []
    if l6_result:
        reconstructed_prompts = [
            c.reconstructed_prompt
            for c in l6_result.phantom_clusters
            if c.reconstructed_prompt
        ]

    logger.info(
        f"Aggregator: original={original_score}, adjusted={adjusted_score}, "
        f"flagged={flagged_count}/{len(product.reviews)}, "
        f"total_flags={len(all_flags)}"
    )

    return AnalyzeResponse(
        cache_key=cache_key,
        product=product,
        original_score=round(float(original_score), 1),
        adjusted_score=adjusted_score,
        total_reviews=len(product.reviews),
        flagged_count=flagged_count,
        verified_count=verified_count,
        all_flags=all_flags,
        layer_results=LayerResults(
            l1=l1_result,
            l2=l2_result,
            l3=l3_result,
            l4=l4_result,
            l6=l6_result,
        ),
        reconstructed_prompts=reconstructed_prompts,
        analysis_time_seconds=round(analysis_time, 2),
        cached=cached,
    )
