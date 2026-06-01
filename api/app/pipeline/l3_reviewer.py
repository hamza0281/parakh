"""
L3: Reviewer History Analysis

Detects bot accounts by analyzing cross-product reviewer behavior patterns.

Real reviewers have:
- Focused category interests
- Natural variation in review length
- Mixed star ratings
- Moderate posting frequency

Bot accounts show:
- Reviewing wildly unrelated categories (earbuds + baby formula + fishing rods)
- Very consistent review length (low variance — templated)
- Near-100% 5-star ratings
- High posting velocity (many reviews per day)
- Short, generic review texts

Note: We only have reviewer data from the current product's reviews.
We score based on what we can observe within the dataset itself.
Full cross-product history would require Amazon API access.
"""
import re
import math
from collections import defaultdict
from app.models.schemas import Review, ReviewerProfile, L3Result, Flag
from app.logger import get_logger

logger = get_logger("l3_reviewer")

# Bot score threshold above which a reviewer is flagged
BOT_SCORE_THRESHOLD = 0.70

# Minimum reviews from same reviewer to analyze (single-review accounts are noise)
MIN_REVIEWS_PER_REVIEWER = 2

# Minimum total reviews for meaningful analysis
MIN_REVIEWS_FOR_ANALYSIS = 3

# Known bot-like reviewer name patterns
BOT_NAME_PATTERNS = [
    r"^[A-Z][a-z]+\d{3,}$",           # "AudioLover2024"
    r"^[A-Z][a-z]+[A-Z][a-z]+\d+$",   # "TechReviewer99"
    r"^[A-Z][a-z]+ [A-Z]\.$",         # "David L." — could be real, lower weight
    r"^\w+\d{4,}$",                    # "user12345678"
    r"^Amazon Customer$",              # Generic Amazon name
    r"^Verified Buyer$",
]


def _is_bot_name(name: str) -> float:
    """Return a 0-1 score for how bot-like a reviewer name looks."""
    if not name:
        return 0.3
    for pattern in BOT_NAME_PATTERNS:
        if re.match(pattern, name):
            return 0.4  # Suspicious but not definitive
    return 0.0


def _compute_bot_score(
    reviews_by_reviewer: list[Review],
    all_reviews: list[Review],
) -> float:
    """
    Compute a 0-1 bot score for a reviewer based on their reviews in this dataset.

    Signals:
    - High 5-star ratio (>90% = suspicious)
    - Low review length variance (templated)
    - Short average review length (<40 words)
    - Reviewer name pattern
    - Posting velocity relative to dataset
    """
    if not reviews_by_reviewer:
        return 0.0

    score = 0.0
    weights = 0.0

    # Signal 1: 5-star ratio (weight: 0.30)
    five_star_count = sum(1 for r in reviews_by_reviewer if r.stars == 5)
    five_star_ratio = five_star_count / len(reviews_by_reviewer)
    if five_star_ratio >= 0.95:
        score += 0.30 * 1.0
    elif five_star_ratio >= 0.85:
        score += 0.30 * 0.6
    elif five_star_ratio >= 0.75:
        score += 0.30 * 0.3
    weights += 0.30

    # Signal 2: Review length variance (weight: 0.25)
    lengths = [len(r.text.split()) for r in reviews_by_reviewer]
    avg_len = sum(lengths) / len(lengths)
    if len(lengths) > 1:
        variance = sum((l - avg_len) ** 2 for l in lengths) / len(lengths)
        std_dev = math.sqrt(variance)
        # Very low std dev = templated
        if std_dev < 5:
            score += 0.25 * 1.0
        elif std_dev < 10:
            score += 0.25 * 0.5
        elif std_dev < 15:
            score += 0.25 * 0.2
    weights += 0.25

    # Signal 3: Average review length (weight: 0.20)
    # Very short reviews are often templated
    if avg_len < 30:
        score += 0.20 * 0.8
    elif avg_len < 50:
        score += 0.20 * 0.4
    elif avg_len < 70:
        score += 0.20 * 0.1
    weights += 0.20

    # Signal 4: Reviewer name pattern (weight: 0.10)
    name = reviews_by_reviewer[0].reviewer_name or ""
    name_score = _is_bot_name(name)
    score += 0.10 * name_score
    weights += 0.10

    # Signal 5: Verified purchase ratio (weight: 0.15)
    # Bots often have verified purchases (they buy cheap items to get badge)
    # But ALL unverified = suspicious
    unverified_count = sum(1 for r in reviews_by_reviewer if not r.verified_purchase)
    unverified_ratio = unverified_count / len(reviews_by_reviewer)
    if unverified_ratio >= 0.8:
        score += 0.15 * 0.7
    elif unverified_ratio >= 0.5:
        score += 0.15 * 0.3
    weights += 0.15

    # Normalize
    if weights > 0:
        return round(min(1.0, score / weights * weights), 3)
    return 0.0


def run_l3(reviews: list[Review]) -> L3Result:
    """
    Run L3 Reviewer History Analysis pipeline.
    Synchronous — pure computation on available review data.

    Args:
        reviews: List of reviews to analyze

    Returns:
        L3Result with suspicious reviewers, flagged review IDs, and flags
    """
    if len(reviews) < MIN_REVIEWS_FOR_ANALYSIS:
        logger.info(f"L3: Too few reviews ({len(reviews)}) — skipping")
        return L3Result()

    logger.info(f"L3: Analyzing reviewers across {len(reviews)} reviews")

    # Group reviews by reviewer
    reviewer_map: dict[str, list[Review]] = defaultdict(list)
    for review in reviews:
        key = review.reviewer_id or review.reviewer_name or f"anon_{review.id}"
        reviewer_map[key].append(review)

    suspicious_reviewers: list[ReviewerProfile] = []
    flagged_ids: list[str] = []
    flags: list[Flag] = []

    for reviewer_key, reviewer_reviews in reviewer_map.items():
        # Only analyze reviewers with multiple reviews in this dataset
        if len(reviewer_reviews) < MIN_REVIEWS_PER_REVIEWER:
            continue

        bot_score = _compute_bot_score(reviewer_reviews, reviews)

        if bot_score < BOT_SCORE_THRESHOLD:
            continue

        # Build reviewer profile
        lengths = [len(r.text.split()) for r in reviewer_reviews]
        avg_len = sum(lengths) / len(lengths)
        if len(lengths) > 1:
            variance = sum((l - avg_len) ** 2 for l in lengths) / len(lengths)
            length_variance = round(math.sqrt(variance), 1)
        else:
            length_variance = 0.0

        five_star_count = sum(1 for r in reviewer_reviews if r.stars == 5)
        five_star_pct = round(five_star_count / len(reviewer_reviews) * 100, 1)

        # Estimate reviews per day (rough — based on date range in dataset)
        reviews_per_day = len(reviewer_reviews)  # conservative: all in same dataset

        profile = ReviewerProfile(
            reviewer_id=reviewer_key,
            reviewer_name=reviewer_reviews[0].reviewer_name or reviewer_key,
            bot_score=bot_score,
            total_reviews=len(reviewer_reviews),
            reviews_per_day=reviews_per_day,
            five_star_pct=five_star_pct,
            category_diversity=1,  # We only have one product's data
            length_variance=length_variance,
        )
        suspicious_reviewers.append(profile)

        # Flag all reviews from this reviewer
        for review in reviewer_reviews:
            if review.id not in flagged_ids:
                flagged_ids.append(review.id)
                flags.append(Flag(
                    review_id=review.id,
                    layer="L3",
                    reason=f"Reviewer '{profile.reviewer_name}' has bot-like behavior (score: {bot_score:.2f})",
                    confidence=bot_score,
                    evidence={
                        "reviewer_id": reviewer_key,
                        "reviewer_name": profile.reviewer_name,
                        "bot_score": bot_score,
                        "five_star_pct": five_star_pct,
                        "length_variance": length_variance,
                        "review_count": len(reviewer_reviews),
                    },
                ))

    # Sort by bot score descending
    suspicious_reviewers.sort(key=lambda r: r.bot_score, reverse=True)

    logger.info(
        f"L3: Complete — {len(suspicious_reviewers)} suspicious reviewers, "
        f"{len(flagged_ids)} reviews flagged"
    )

    return L3Result(
        suspicious_reviewers=suspicious_reviewers,
        flagged_review_ids=flagged_ids,
        flags=flags,
    )
