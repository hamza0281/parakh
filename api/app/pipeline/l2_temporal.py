"""
L2: Temporal Anomaly Detection

Detects coordinated review burst campaigns by analyzing review posting velocity.

Real reviews trickle in organically over time. Fake review campaigns drop
dozens of reviews in a short window — often before a product launch, sale,
or competitor attack.

Pipeline:
  1. Parse review dates into timestamps
  2. Build daily/hourly velocity timeline
  3. Compute z-score for each time bucket
  4. Flag buckets where z-score > threshold as bursts
  5. Flag all reviews in burst windows
"""
import re
from collections import defaultdict
from datetime import datetime, date
from typing import Optional
import math
from app.models.schemas import Review, BurstEvent, L2Result, Flag
from app.logger import get_logger

logger = get_logger("l2_temporal")

# Z-score threshold above which a time bucket is a burst
BURST_Z_THRESHOLD = 2.5

# Minimum reviews in a burst window to flag it
MIN_BURST_SIZE = 3

# Minimum total reviews needed for meaningful temporal analysis
MIN_REVIEWS_FOR_ANALYSIS = 5

# Date patterns to try parsing
DATE_PATTERNS = [
    r"(\w+ \d{1,2}, \d{4})",           # "November 22, 2024"
    r"(\d{1,2} \w+ \d{4})",            # "22 November 2024"
    r"(\d{4}-\d{2}-\d{2})",            # "2024-11-22"
    r"(\d{1,2}/\d{1,2}/\d{4})",        # "11/22/2024"
    r"Reviewed in .+ on (.+)",          # "Reviewed in the United States on November 22, 2024"
]

MONTH_MAP = {
    "january": 1, "february": 2, "march": 3, "april": 4,
    "may": 5, "june": 6, "july": 7, "august": 8,
    "september": 9, "october": 10, "november": 11, "december": 12,
    "jan": 1, "feb": 2, "mar": 3, "apr": 4,
    "jun": 6, "jul": 7, "aug": 8, "sep": 9, "oct": 10, "nov": 11, "dec": 12,
}


def _parse_date(date_str: str) -> Optional[date]:
    """Parse a date string into a date object. Returns None if unparseable."""
    if not date_str:
        return None

    date_str = date_str.strip()

    # Try "Reviewed in ... on DATE" pattern first
    reviewed_match = re.search(r"on (.+)$", date_str)
    if reviewed_match:
        date_str = reviewed_match.group(1).strip()

    # Try ISO format
    try:
        return datetime.strptime(date_str, "%Y-%m-%d").date()
    except ValueError:
        pass

    # Try "Month DD, YYYY"
    try:
        return datetime.strptime(date_str, "%B %d, %Y").date()
    except ValueError:
        pass

    # Try "DD Month YYYY"
    try:
        return datetime.strptime(date_str, "%d %B %Y").date()
    except ValueError:
        pass

    # Try "Month YYYY" (no day — use day 1)
    try:
        return datetime.strptime(date_str, "%B %Y").date()
    except ValueError:
        pass

    # Manual parse for edge cases
    parts = re.split(r"[\s,]+", date_str.lower())
    year = None
    month = None
    day = None

    for part in parts:
        if part.isdigit():
            num = int(part)
            if num > 1900:
                year = num
            elif num <= 31 and day is None:
                day = num
        elif part in MONTH_MAP:
            month = MONTH_MAP[part]

    if year and month:
        try:
            return date(year, month, day or 1)
        except ValueError:
            pass

    return None


def _compute_z_scores(counts: list[int]) -> list[float]:
    """Compute z-scores using pure Python (no numpy)."""
    if len(counts) < 2:
        return [0.0] * len(counts)
    n = len(counts)
    mean = sum(counts) / n
    variance = sum((x - mean) ** 2 for x in counts) / n
    std = math.sqrt(variance)
    if std == 0:
        return [0.0] * n
    return [(x - mean) / std for x in counts]


def run_l2(reviews: list[Review]) -> L2Result:
    """
    Run L2 Temporal Anomaly Detection pipeline.
    Synchronous — no I/O, pure computation.

    Args:
        reviews: List of reviews to analyze

    Returns:
        L2Result with bursts, timeline, flagged review IDs, and flags
    """
    if len(reviews) < MIN_REVIEWS_FOR_ANALYSIS:
        logger.info(f"L2: Too few reviews ({len(reviews)}) — skipping")
        return L2Result()

    # Parse dates
    dated_reviews: list[tuple[date, Review]] = []
    undated_count = 0

    for review in reviews:
        parsed = _parse_date(review.date or "")
        if parsed:
            dated_reviews.append((parsed, review))
        else:
            undated_count += 1

    if len(dated_reviews) < MIN_REVIEWS_FOR_ANALYSIS:
        logger.info(f"L2: Too few dated reviews ({len(dated_reviews)}) — skipping")
        return L2Result()

    logger.info(f"L2: Analyzing {len(dated_reviews)} dated reviews ({undated_count} undated)")

    # Build daily counts
    daily_map: dict[date, list[Review]] = defaultdict(list)
    for d, review in dated_reviews:
        daily_map[d].append(review)

    # Sort dates
    sorted_dates = sorted(daily_map.keys())
    min_date = sorted_dates[0]
    max_date = sorted_dates[-1]

    # Build continuous daily timeline (fill gaps with 0)
    from datetime import timedelta
    all_dates = []
    current = min_date
    while current <= max_date:
        all_dates.append(current)
        current += timedelta(days=1)

    daily_counts = [len(daily_map.get(d, [])) for d in all_dates]

    # Build timeline for frontend chart
    timeline = [
        {"date": str(d), "count": c}
        for d, c in zip(all_dates, daily_counts)
    ]

    # Compute z-scores
    z_scores = _compute_z_scores(daily_counts)

    # Detect bursts
    bursts: list[BurstEvent] = []
    flagged_ids: list[str] = []
    flags: list[Flag] = []

    for i, (d, count, z) in enumerate(zip(all_dates, daily_counts, z_scores)):
        if z >= BURST_Z_THRESHOLD and count >= MIN_BURST_SIZE:
            burst_reviews = daily_map.get(d, [])
            burst_review_ids = [r.id for r in burst_reviews]

            bursts.append(BurstEvent(
                start_date=str(d),
                end_date=str(d),
                review_count=count,
                z_score=round(z, 2),
                review_ids=burst_review_ids,
            ))

            for review in burst_reviews:
                if review.id not in flagged_ids:
                    flagged_ids.append(review.id)
                    # Confidence scales with z-score
                    confidence = min(0.90, 0.55 + (z - BURST_Z_THRESHOLD) * 0.08)
                    flags.append(Flag(
                        review_id=review.id,
                        layer="L2",
                        reason=f"Posted during burst: {count} reviews on {d} (z-score: {z:.1f})",
                        confidence=round(confidence, 3),
                        evidence={
                            "burst_date": str(d),
                            "burst_count": count,
                            "z_score": round(z, 2),
                            "normal_daily_avg": round(float(np.mean(daily_counts)), 1),
                        },
                    ))

    # Merge adjacent burst days into single events
    if len(bursts) > 1:
        merged: list[BurstEvent] = [bursts[0]]
        for burst in bursts[1:]:
            prev = merged[-1]
            # If consecutive days, merge
            prev_end = datetime.strptime(prev.end_date, "%Y-%m-%d").date()
            curr_start = datetime.strptime(burst.start_date, "%Y-%m-%d").date()
            if (curr_start - prev_end).days <= 1:
                merged[-1] = BurstEvent(
                    start_date=prev.start_date,
                    end_date=burst.end_date,
                    review_count=prev.review_count + burst.review_count,
                    z_score=max(prev.z_score, burst.z_score),
                    review_ids=prev.review_ids + burst.review_ids,
                )
            else:
                merged.append(burst)
        bursts = merged

    logger.info(
        f"L2: Complete — {len(bursts)} bursts, "
        f"{len(flagged_ids)} reviews flagged"
    )

    return L2Result(
        bursts=bursts,
        flagged_review_ids=flagged_ids,
        flags=flags,
        timeline=timeline,
    )
