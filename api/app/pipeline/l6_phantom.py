"""
L6: Phantom Feature Trace — The Novel Signal

This is the genuinely novel detection layer in Parakh.

Core insight: When AI generates reviews, it doesn't pick random features.
It picks features that are COMMON IN THE CATEGORY — because that's what the
training data looks like. So wireless earbuds reviews always mention ANC,
power banks always mention wireless charging, smartwatches always mention ECG.

Even when the specific product doesn't have those features.

This creates a statistical fingerprint: multiple reviews all hallucinating
the SAME category-typical features that the product doesn't have.

We can then cluster those reviews by their phantom feature signature and
REVERSE-ENGINEER the AI prompt template that generated them.

Pipeline:
  1. Detect product category from spec sheet
  2. For each review: find phantom features (in review + not in spec + in category map)
  3. Cluster reviews by Jaccard similarity of phantom feature sets
  4. Reconstruct AI prompt template for each cluster
  5. Generate flags + PhantomFeature + PhantomCluster objects
"""
import asyncio
import re
from collections import defaultdict
from typing import Optional
from app.models.schemas import (
    Review, SpecSheet, PhantomFeature, PhantomCluster, L6Result, Flag
)
from app.pipeline.category_detector import (
    detect_category, get_category_features, get_all_synonyms
)
from app.services.llm_client import groq_json, gemini_json
from app.prompts.phantom_reasoning import (
    build_phantom_prompt, build_reconstruction_prompt,
    PHANTOM_FEATURE_SYSTEM, PROMPT_RECONSTRUCTION_SYSTEM
)
from app.logger import get_logger

logger = get_logger("l6_phantom")

# Minimum cluster size to be considered a phantom cluster
MIN_CLUSTER_SIZE = 2

# Minimum phantom features per review to flag it
MIN_PHANTOM_FEATURES = 1

# Jaccard similarity threshold for clustering
CLUSTER_THRESHOLD = 0.3


# ── Feature mention detection ─────────────────────────────────────────────

def _mentions_feature(text: str, synonyms: list[str]) -> bool:
    """Check if text mentions a feature via any of its synonyms."""
    text_lower = text.lower()
    for syn in synonyms:
        syn_lower = syn.lower()
        # Word boundary check for short synonyms to avoid false positives
        if len(syn_lower) <= 4:
            # Use word boundary for short terms like "ANC", "GPS", "ECG"
            pattern = r'\b' + re.escape(syn_lower) + r'\b'
            if re.search(pattern, text_lower):
                return True
        else:
            if syn_lower in text_lower:
                return True
    return False


def _detect_phantom_features_fast(
    review_text: str,
    spec: SpecSheet,
    category_key: str,
) -> list[str]:
    """
    Fast regex-based phantom feature detection using synonym maps.
    No LLM call — pure string matching.

    Returns list of phantom feature names found in review.
    """
    if not category_key:
        return []

    # If spec is empty/unknown, we can't reliably detect phantoms
    # (would cause too many false positives)
    if not spec.features_present and not spec.raw_text:
        return []

    synonym_map = get_all_synonyms(category_key)
    category_features = get_category_features(category_key)

    # Build set of features that ARE in the spec (to exclude)
    spec_features_lower = {f.lower() for f in spec.features_present}
    spec_text_lower = (spec.raw_text + " " + " ".join(spec.features_present)).lower()

    phantoms = []
    for feature_name, synonyms in synonym_map.items():
        # Skip if feature name is in spec features
        if feature_name.lower() in spec_features_lower:
            continue
        # Skip if feature name (normalized) appears in spec text
        feature_readable = feature_name.replace("_", " ").lower()
        if feature_readable in spec_text_lower:
            continue
        # Skip if any long synonym appears in spec text
        if any(syn.lower() in spec_text_lower for syn in synonyms if len(syn) > 5):
            continue

        # Check if review mentions this feature
        if _mentions_feature(review_text, synonyms):
            # Only flag if it's category-typical (not just any feature)
            feature_data = category_features.get(feature_name, {})
            if feature_data.get("category_typical", False):
                # Additional check: don't flag numerical features that match spec values
                # e.g. "6 hours" should not be flagged if spec says 6h battery
                if feature_data.get("numerical", False):
                    # For numerical features, only flag if spec doesn't mention it at all
                    if any(syn.lower() in spec_text_lower for syn in synonyms if len(syn) > 3):
                        continue
                phantoms.append(feature_name)

    return phantoms


async def _detect_phantom_features_llm(
    review: Review,
    spec: SpecSheet,
    category_key: str,
    fast_phantoms: list[str],
) -> list[dict]:
    """
    LLM-based phantom feature detection for edge cases.
    Only called when fast detection finds potential phantoms.
    Returns list of {feature, mentioned_as, confidence, reasoning}.
    """
    category_features = get_category_features(category_key)
    category_feature_names = list(category_features.keys())

    prompt = build_phantom_prompt(
        review_text=review.text,
        category=category_key.replace("_", " "),
        spec_summary=spec.raw_text,
        features_absent=spec.features_absent,
        category_features=category_feature_names,
    )

    try:
        data = await groq_json(prompt, system=PHANTOM_FEATURE_SYSTEM)
        return data.get("phantom_features", [])
    except Exception as e:
        logger.debug(f"LLM phantom detection failed for {review.id}: {e}")
        # Fall back to fast detection results
        return [
            {"feature": f, "mentioned_as": f.replace("_", " "), "confidence": 0.75, "reasoning": "regex match"}
            for f in fast_phantoms
        ]


def _jaccard_similarity(set_a: set, set_b: set) -> float:
    """Compute Jaccard similarity between two sets."""
    if not set_a and not set_b:
        return 1.0
    if not set_a or not set_b:
        return 0.0
    intersection = len(set_a & set_b)
    union = len(set_a | set_b)
    return intersection / union if union > 0 else 0.0


def _cluster_by_phantom_overlap(
    review_phantoms: dict[str, list[str]],
) -> list[list[str]]:
    """
    Cluster reviews by Jaccard similarity of their phantom feature sets.

    Args:
        review_phantoms: {review_id: [phantom_feature1, phantom_feature2, ...]}

    Returns:
        List of clusters, each cluster is a list of review_ids
    """
    if not review_phantoms:
        return []

    review_ids = list(review_phantoms.keys())
    phantom_sets = {rid: set(phantoms) for rid, phantoms in review_phantoms.items()}

    # Simple greedy clustering
    clusters: list[list[str]] = []
    assigned = set()

    for i, rid_a in enumerate(review_ids):
        if rid_a in assigned:
            continue
        cluster = [rid_a]
        assigned.add(rid_a)

        for rid_b in review_ids[i + 1:]:
            if rid_b in assigned:
                continue
            sim = _jaccard_similarity(phantom_sets[rid_a], phantom_sets[rid_b])
            if sim >= CLUSTER_THRESHOLD:
                cluster.append(rid_b)
                assigned.add(rid_b)

        if len(cluster) >= MIN_CLUSTER_SIZE:
            clusters.append(cluster)

    return clusters


def _detect_tone(reviews: list[Review]) -> str:
    """Detect dominant tone of a set of reviews."""
    texts = " ".join(r.text.lower() for r in reviews)
    enthusiastic_words = ["amazing", "incredible", "unbelievable", "best", "love", "fantastic", "phenomenal"]
    generic_words = ["good", "nice", "okay", "fine", "decent", "works", "recommend"]
    professional_words = ["performance", "specifications", "quality", "functionality", "efficiency"]

    enthusiastic = sum(texts.count(w) for w in enthusiastic_words)
    generic = sum(texts.count(w) for w in generic_words)
    professional = sum(texts.count(w) for w in professional_words)

    if enthusiastic > generic and enthusiastic > professional:
        return "enthusiastic"
    elif professional > generic:
        return "professional"
    else:
        return "casual"


async def _reconstruct_prompt(
    cluster_reviews: list[Review],
    phantom_features: list[str],
    product_type: str,
) -> str:
    """
    Reconstruct the AI prompt template that likely generated a cluster of reviews.
    Uses Gemini for better creative reasoning.
    """
    avg_length = int(sum(len(r.text.split()) for r in cluster_reviews) / len(cluster_reviews))
    avg_stars = sum(r.stars for r in cluster_reviews) / len(cluster_reviews)
    tone = _detect_tone(cluster_reviews)

    prompt = build_reconstruction_prompt(
        count=len(cluster_reviews),
        product_type=product_type.replace("_", " "),
        phantom_features=phantom_features,
        sample_reviews=[r.text for r in cluster_reviews],
        avg_length=avg_length,
        avg_stars=avg_stars,
        tone=tone,
    )

    try:
        # Use Gemini for better creative reasoning on prompt reconstruction
        data = await gemini_json(prompt, model="flash")
        reconstructed = data.get("reconstructed_prompt", "")
        if reconstructed:
            return reconstructed
    except Exception as e:
        logger.debug(f"Gemini prompt reconstruction failed: {e}")

    # Fallback: build template manually
    features_str = ", ".join(f.replace("_", " ") for f in phantom_features[:3])
    return (
        f"Write a {round(avg_stars)}-star review of {{product}} mentioning "
        f"{features_str}. {tone.capitalize()} tone, {avg_length-10}-{avg_length+10} words, "
        f"end with a recommendation."
    )


# ── Main L6 pipeline ──────────────────────────────────────────────────────

async def run_l6(
    spec: SpecSheet,
    reviews: list[Review],
    title: str = "",
) -> L6Result:
    """
    Run the full L6 Phantom Feature Trace pipeline.

    Args:
        spec: Product spec sheet (from L4 extraction)
        reviews: List of reviews to analyze
        title: Product title for category detection fallback

    Returns:
        L6Result with phantom features, clusters, flags, and reconstructed prompts
    """
    logger.info(f"L6: Starting phantom trace for {len(reviews)} reviews")

    if not reviews:
        return L6Result()

    # Step 1: Detect product category
    category_key = detect_category(spec.product_type, title)
    if not category_key:
        logger.info(f"L6: No category detected for '{spec.product_type}' — skipping")
        return L6Result()

    # Guard: if spec has no features at all, we can't reliably detect phantoms
    if not spec.features_present and not spec.raw_text.strip():
        logger.info("L6: Spec is empty — cannot reliably detect phantoms, skipping")
        return L6Result()

    logger.info(f"L6: Category detected: {category_key}")

    # Step 2: Fast phantom detection for all reviews (no LLM, pure regex)
    review_fast_phantoms: dict[str, list[str]] = {}
    for review in reviews:
        fast = _detect_phantom_features_fast(review.text, spec, category_key)
        if fast:
            review_fast_phantoms[review.id] = fast

    logger.info(f"L6: Fast detection found phantoms in {len(review_fast_phantoms)} reviews")

    if not review_fast_phantoms:
        logger.info("L6: No phantom features detected — clean product")
        return L6Result()

    # Step 3: LLM verification for reviews with fast-detected phantoms
    # Run concurrently with rate limiting
    semaphore = asyncio.Semaphore(3)
    review_map = {r.id: r for r in reviews}

    async def verify_review(review_id: str, fast_phantoms: list[str]) -> tuple[str, list[dict]]:
        async with semaphore:
            await asyncio.sleep(0.3)  # rate limit
            review = review_map[review_id]
            llm_phantoms = await _detect_phantom_features_llm(
                review, spec, category_key, fast_phantoms
            )
            return review_id, llm_phantoms

    tasks = [
        verify_review(rid, phantoms)
        for rid, phantoms in review_fast_phantoms.items()
    ]
    llm_results = await asyncio.gather(*tasks, return_exceptions=True)

    # Step 4: Build verified phantom map
    review_verified_phantoms: dict[str, list[str]] = {}
    review_phantom_details: dict[str, list[dict]] = {}

    for result in llm_results:
        if isinstance(result, Exception):
            logger.warning(f"L6 LLM verification error: {result}")
            continue
        review_id, llm_phantoms = result
        if llm_phantoms:
            # Filter to high-confidence phantoms
            # Use higher threshold for numerical features (more prone to false positives)
            high_conf = []
            for p in llm_phantoms:
                conf = p.get("confidence", 0)
                feature = p.get("feature", "")
                # Numerical features need higher confidence
                category_feat_data = get_category_features(category_key).get(feature, {})
                threshold = 0.75 if category_feat_data.get("numerical", False) else 0.65
                if conf >= threshold:
                    high_conf.append(p)

            if high_conf:
                feature_names = [p["feature"] for p in high_conf]
                review_verified_phantoms[review_id] = feature_names
                review_phantom_details[review_id] = high_conf

    logger.info(f"L6: LLM verified phantoms in {len(review_verified_phantoms)} reviews")

    if not review_verified_phantoms:
        logger.info("L6: No phantoms survived LLM verification")
        return L6Result()

    # Step 5: Build PhantomFeature objects (aggregate across all reviews)
    feature_to_reviews: dict[str, list[str]] = defaultdict(list)
    for review_id, features in review_verified_phantoms.items():
        for feature in features:
            feature_to_reviews[feature].append(review_id)

    category_features_data = get_category_features(category_key)
    phantom_features_list: list[PhantomFeature] = []

    for feature_name, review_ids in feature_to_reviews.items():
        feature_data = category_features_data.get(feature_name, {})
        category_freq = feature_data.get("frequency", 0.5)
        # Confidence: higher if more reviews mention it + higher category frequency
        confidence = min(0.97, 0.6 + (len(review_ids) / len(reviews)) * 0.3 + category_freq * 0.1)

        phantom_features_list.append(PhantomFeature(
            feature_name=feature_name,
            review_ids=review_ids,
            category_frequency=category_freq,
            confidence=round(confidence, 3),
        ))

    # Sort by number of reviews mentioning (most common first)
    phantom_features_list.sort(key=lambda x: len(x.review_ids), reverse=True)

    # Step 6: Cluster reviews by phantom feature overlap
    clusters_raw = _cluster_by_phantom_overlap(review_verified_phantoms)
    logger.info(f"L6: Found {len(clusters_raw)} phantom clusters")

    # Step 7: Build PhantomCluster objects with reconstructed prompts
    phantom_clusters: list[PhantomCluster] = []

    for cluster_idx, cluster_review_ids in enumerate(clusters_raw):
        cluster_reviews = [review_map[rid] for rid in cluster_review_ids if rid in review_map]
        if not cluster_reviews:
            continue

        # Common phantom features across this cluster
        cluster_phantom_sets = [
            set(review_verified_phantoms.get(rid, []))
            for rid in cluster_review_ids
        ]
        # Intersection: features ALL reviews in cluster mention
        if cluster_phantom_sets:
            common_phantoms = list(cluster_phantom_sets[0].intersection(*cluster_phantom_sets[1:]))
            # Union: features ANY review in cluster mentions
            all_phantoms = list(cluster_phantom_sets[0].union(*cluster_phantom_sets[1:]))
        else:
            common_phantoms = []
            all_phantoms = []

        # Use common phantoms for reconstruction, fall back to all
        reconstruction_features = common_phantoms if common_phantoms else all_phantoms[:3]

        avg_length = int(sum(len(r.text.split()) for r in cluster_reviews) / len(cluster_reviews))
        avg_stars = sum(r.stars for r in cluster_reviews) / len(cluster_reviews)

        # Reconstruct prompt
        reconstructed = await _reconstruct_prompt(
            cluster_reviews=cluster_reviews,
            phantom_features=reconstruction_features,
            product_type=spec.product_type or category_key,
        )

        phantom_clusters.append(PhantomCluster(
            cluster_id=cluster_idx,
            review_ids=cluster_review_ids,
            phantom_features=all_phantoms,
            reconstructed_prompt=reconstructed,
            avg_review_length=avg_length,
            avg_stars=round(avg_stars, 1),
        ))

    # Step 8: Build flags
    flagged_ids = list(review_verified_phantoms.keys())
    flags: list[Flag] = []

    for review_id in flagged_ids:
        phantoms = review_verified_phantoms[review_id]
        details = review_phantom_details.get(review_id, [])

        # Find which cluster this review belongs to
        cluster_id = None
        for cluster in phantom_clusters:
            if review_id in cluster.review_ids:
                cluster_id = cluster.cluster_id
                break

        # Confidence: based on number of phantom features + their category frequency
        feature_confidences = [d.get("confidence", 0.75) for d in details]
        avg_confidence = sum(feature_confidences) / len(feature_confidences) if feature_confidences else 0.75

        flags.append(Flag(
            review_id=review_id,
            layer="L6",
            reason=f"Phantom features detected: {', '.join(f.replace('_', ' ') for f in phantoms[:3])}",
            confidence=round(avg_confidence, 3),
            evidence={
                "phantom_features": phantoms,
                "category": category_key,
                "cluster_id": cluster_id,
                "phantom_details": details[:3],  # top 3 for evidence
            },
        ))

    logger.info(
        f"L6: Complete — {len(phantom_features_list)} phantom features, "
        f"{len(phantom_clusters)} clusters, {len(flagged_ids)} reviews flagged"
    )

    return L6Result(
        phantom_features=phantom_features_list,
        phantom_clusters=phantom_clusters,
        flagged_review_ids=flagged_ids,
        flags=flags,
    )
