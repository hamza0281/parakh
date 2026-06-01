"""
L4: Spec-Claim Mismatch Detection — The Killer Signal

This is the core innovation of Parakh. We extract the product's actual spec sheet,
then check every review claim against it using NLI contradiction detection.

Real users don't claim features that don't exist.
AI-generated reviews do — because they hallucinate category-typical features.

Pipeline:
  1. Extract spec sheet from listing (Groq JSON)
  2. For each review: extract feature claims (Groq JSON)
  3. For each claim: check against spec (hard rules + NLI)
  4. Generate flags with confidence scores
"""
import asyncio
from typing import Optional
from app.models.schemas import (
    Review, SpecSheet, SpecMismatch, L4Result, Flag
)
from app.services.llm_client import groq_json
from app.services.nli_client import check_nli, NLIResult
from app.prompts.spec_extraction import build_spec_prompt, SPEC_EXTRACTION_SYSTEM
from app.prompts.claim_extraction import build_claim_prompt, CLAIM_EXTRACTION_SYSTEM
from app.logger import get_logger

logger = get_logger("l4_spec_claim")

# Features that are commonly hallucinated by AI for each product type
# Used as a quick pre-filter before expensive NLI calls
HALLUCINATION_PRONE_FEATURES = {
    "wireless_earbuds": [
        "active_noise_cancellation", "anc", "wireless_charging",
        "enc", "transparency_mode", "ldac", "aptx", "ipx7",
    ],
    "power_bank": [
        "wireless_charging", "magsafe", "pass_through", "solar_charging",
    ],
    "smartwatch": [
        "ecg", "gps", "lte", "cellular", "blood_pressure",
    ],
    "laptop": [
        "thunderbolt", "oled", "mini_led", "4k_display",
    ],
    "phone_case": [
        "magsafe", "wireless_charging_compatible", "built_in_battery",
    ],
}


async def extract_spec_sheet(listing_text: str, specs_text: str) -> SpecSheet:
    """Extract structured spec sheet from product listing using Groq."""
    prompt = build_spec_prompt(listing_text, specs_text)
    try:
        data = await groq_json(prompt, system=SPEC_EXTRACTION_SYSTEM)
        return SpecSheet(
            product_type=data.get("product_type", "unknown"),
            features_present=[f.lower().strip() for f in data.get("features_present", [])],
            features_absent=[f.lower().strip() for f in data.get("features_absent", [])],
            ambiguous=[f.lower().strip() for f in data.get("ambiguous", [])],
            numerical_specs={
                k: float(v) for k, v in data.get("numerical_specs", {}).items()
                if v and float(v) > 0
            },
            raw_text=data.get("raw_summary", listing_text[:200]),
        )
    except Exception as e:
        logger.warning(f"Spec extraction failed: {e}. Using empty spec sheet.")
        return SpecSheet(raw_text=listing_text[:200])


async def extract_claims_from_review(review: Review, product_type: str) -> list[dict]:
    """Extract feature claims from a single review using Groq."""
    if len(review.text.strip()) < 20:
        return []
    prompt = build_claim_prompt(review.text, product_type)
    try:
        data = await groq_json(prompt, system=CLAIM_EXTRACTION_SYSTEM)
        return data.get("claims", [])
    except Exception as e:
        logger.debug(f"Claim extraction failed for review {review.id}: {e}")
        return []


def _normalize_feature(feature: str) -> str:
    """Normalize feature name for comparison."""
    return feature.strip().lower().replace(" ", "_").replace("-", "_")


def _feature_in_list(feature: str, feature_list: list[str]) -> bool:
    """Check if a feature (or its synonyms) appears in a list."""
    norm = _normalize_feature(feature)
    for f in feature_list:
        f_norm = _normalize_feature(f)
        # Exact match
        if norm == f_norm:
            return True
        # Substring match — only if the shorter string is at least 5 chars
        # to avoid false positives from short common words
        shorter = norm if len(norm) <= len(f_norm) else f_norm
        longer = f_norm if len(norm) <= len(f_norm) else norm
        if len(shorter) >= 5 and shorter in longer:
            return True
        # Key term match — explicit synonym mapping
        key_terms = {
            "anc": ["active_noise_cancellation", "active_noise", "noise_cancell"],
            "active_noise_cancellation": ["anc"],
            "wireless_charging": ["qi_charg", "inductive_charg", "wireless_charg"],
            "enc": ["environmental_noise", "call_noise_cancell"],
            "gps": ["global_positioning", "navigation"],
            "ecg": ["ekg", "electrocardiogram"],
            "lte": ["cellular", "esim"],
        }
        for key, synonyms in key_terms.items():
            if norm == key or f_norm == key:
                other = f_norm if norm == key else norm
                for syn in synonyms:
                    if syn in other or other in syn:
                        return True
    return False


async def _check_claim_against_spec(
    claim: dict,
    spec: SpecSheet,
    review: Review,
) -> Optional[SpecMismatch]:
    """
    Check a single claim against the spec sheet.
    Returns SpecMismatch if contradiction found, None otherwise.
    """
    feature = _normalize_feature(claim.get("feature", ""))
    claim_text = claim.get("claim_text", "")
    claim_type = claim.get("claim_type", "presence")
    numerical_value = claim.get("numerical_value")

    if not feature or not claim_text:
        return None

    # ── Stage 1: Hard absent check (highest confidence) ──────────────────
    # If spec explicitly says feature is absent, any positive claim = fake
    if claim_type in ("presence", "quality", "numerical"):
        if _feature_in_list(feature, spec.features_absent):
            return SpecMismatch(
                review_id=review.id,
                claimed_feature=feature,
                spec_reality=f"Spec explicitly states this feature is absent",
                contradiction_type="hard_absent",
                confidence=0.97,
                nli_score=None,
            )

    # ── Stage 2: Numerical mismatch check ────────────────────────────────
    if claim_type == "numerical" and numerical_value is not None:
        try:
            claimed_num = float(numerical_value)
            # Check battery hours
            if "battery" in feature and "battery_hours" in spec.numerical_specs:
                spec_hours = spec.numerical_specs["battery_hours"]
                if spec_hours > 0 and claimed_num > spec_hours * 2.5:
                    return SpecMismatch(
                        review_id=review.id,
                        claimed_feature=feature,
                        spec_reality=f"Spec says {spec_hours}h battery; review claims {claimed_num}h",
                        contradiction_type="numerical",
                        confidence=min(0.95, 0.6 + (claimed_num / spec_hours - 1) * 0.1),
                        nli_score=None,
                    )
            # Check capacity mAh
            if "mah" in feature or "capacity" in feature:
                if "battery_mah" in spec.numerical_specs:
                    spec_mah = spec.numerical_specs["battery_mah"]
                    if spec_mah > 0 and claimed_num > spec_mah * 1.5:
                        return SpecMismatch(
                            review_id=review.id,
                            claimed_feature=feature,
                            spec_reality=f"Spec says {spec_mah}mAh; review claims {claimed_num}mAh",
                            contradiction_type="numerical",
                            confidence=0.90,
                            nli_score=None,
                        )
        except (ValueError, TypeError):
            pass

    # ── Stage 3: NLI contradiction check ─────────────────────────────────
    # Only run NLI if:
    # - Feature is NOT in features_present (no point checking confirmed features)
    # - Feature is NOT in ambiguous (too uncertain)
    # - Claim is a positive claim (presence/quality/numerical)
    if claim_type in ("presence", "quality", "numerical"):
        if not _feature_in_list(feature, spec.features_present):
            if not _feature_in_list(feature, spec.ambiguous):
                # Build NLI premise from spec
                premise = f"Product specifications: {spec.raw_text}. Features present: {', '.join(spec.features_present[:10])}."
                hypothesis = f"This product has {feature.replace('_', ' ')}. {claim_text}"

                nli_result: NLIResult = await check_nli(premise, hypothesis)

                if nli_result.is_contradiction(threshold=0.65):
                    return SpecMismatch(
                        review_id=review.id,
                        claimed_feature=feature,
                        spec_reality=f"NLI contradiction detected (score: {nli_result.score:.2f})",
                        contradiction_type="nli_contradiction",
                        confidence=nli_result.score,
                        nli_score=nli_result.score,
                    )

    return None


async def _process_single_review(
    review: Review,
    spec: SpecSheet,
    semaphore: asyncio.Semaphore,
) -> list[SpecMismatch]:
    """Process one review — extract claims then check each against spec."""
    async with semaphore:
        # Small delay to respect Groq free tier rate limits
        await asyncio.sleep(0.3)
        claims = await extract_claims_from_review(review, spec.product_type)
        if not claims:
            return []

        # Check all claims concurrently
        tasks = [_check_claim_against_spec(claim, spec, review) for claim in claims]
        results = await asyncio.gather(*tasks, return_exceptions=True)

        mismatches = []
        for r in results:
            if isinstance(r, SpecMismatch):
                mismatches.append(r)
            elif isinstance(r, Exception):
                logger.debug(f"Claim check error: {r}")

        return mismatches


async def run_l4(
    listing_text: str,
    specs_text: str,
    reviews: list[Review],
    max_concurrent: int = 3,
    _spec: SpecSheet | None = None,
) -> L4Result:
    """
    Run the full L4 Spec-Claim Mismatch pipeline.

    Args:
        listing_text: Combined product title + bullets + description
        specs_text: Tech specs table text
        reviews: List of reviews to analyze
        max_concurrent: Max concurrent review processing (rate limit protection)
        _spec: Optional pre-extracted spec sheet (avoids double extraction when called from analyze route)

    Returns:
        L4Result with spec sheet, mismatches, flagged reviews, and flags
    """
    logger.info(f"L4: Starting spec extraction for {len(reviews)} reviews")

    # Step 1: Extract spec sheet (or use pre-extracted)
    spec = _spec if _spec is not None else await extract_spec_sheet(listing_text, specs_text)
    logger.info(
        f"L4: Spec {'reused' if _spec else 'extracted'} — type={spec.product_type}, "
        f"present={len(spec.features_present)}, absent={len(spec.features_absent)}"
    )

    if not reviews:
        return L4Result(spec_sheet=spec)

    # Step 2: Process reviews concurrently with rate limiting
    # Use lower concurrency to avoid Groq 429 rate limits
    semaphore = asyncio.Semaphore(max_concurrent)
    tasks = [_process_single_review(review, spec, semaphore) for review in reviews]
    all_results = await asyncio.gather(*tasks, return_exceptions=True)

    # Step 3: Collect mismatches
    all_mismatches: list[SpecMismatch] = []
    for result in all_results:
        if isinstance(result, list):
            all_mismatches.extend(result)
        elif isinstance(result, Exception):
            logger.warning(f"Review processing error: {result}")

    # Step 4: Deduplicate — keep highest confidence mismatch per review
    seen_reviews: dict[str, SpecMismatch] = {}
    for m in all_mismatches:
        if m.review_id not in seen_reviews or m.confidence > seen_reviews[m.review_id].confidence:
            seen_reviews[m.review_id] = m

    final_mismatches = list(seen_reviews.values())
    flagged_ids = [m.review_id for m in final_mismatches]

    # Step 5: Build flags
    flags = [
        Flag(
            review_id=m.review_id,
            layer="L4",
            reason=f"Claims '{m.claimed_feature.replace('_', ' ')}' — {m.spec_reality}",
            confidence=m.confidence,
            evidence={
                "claimed_feature": m.claimed_feature,
                "spec_reality": m.spec_reality,
                "contradiction_type": m.contradiction_type,
                "nli_score": m.nli_score,
            },
        )
        for m in final_mismatches
    ]

    logger.info(
        f"L4: Complete — {len(final_mismatches)} mismatches found "
        f"across {len(reviews)} reviews ({len(flagged_ids)} reviews flagged)"
    )

    return L4Result(
        spec_sheet=spec,
        mismatches=final_mismatches,
        flagged_review_ids=flagged_ids,
        flags=flags,
    )
