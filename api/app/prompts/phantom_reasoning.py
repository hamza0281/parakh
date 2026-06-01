"""
Prompts for L6 Phantom Feature Trace.
"""

PHANTOM_FEATURE_SYSTEM = """You are a product review analyst specializing in detecting AI-generated fake reviews.
Your task is to identify which features mentioned in a review are NOT actually present in the product.
Be precise and conservative — only flag features that are clearly phantom (not in the product)."""

PHANTOM_FEATURE_PROMPT = """Analyze this product review and identify phantom features.

PRODUCT CATEGORY: {category}
PRODUCT SPEC (what the product actually has): {spec_summary}
FEATURES THIS PRODUCT DOES NOT HAVE: {features_absent}
REVIEW TEXT: {review_text}

CATEGORY-TYPICAL FEATURES (features common in this category that AI often hallucinates):
{category_features}

Identify which features mentioned in the review are PHANTOM — i.e., mentioned in the review but NOT present in the product spec.

Return JSON:
{{
  "phantom_features": [
    {{
      "feature": "feature_name_normalized",
      "mentioned_as": "exact phrase from review",
      "confidence": 0.0-1.0,
      "reasoning": "brief explanation"
    }}
  ],
  "review_tone": "casual|professional|enthusiastic|generic",
  "estimated_word_count": 0
}}

Rules:
- Only include features that are CLEARLY phantom (not in spec, not ambiguous)
- Do NOT flag features that ARE in the spec
- Do NOT flag general quality claims ("great sound", "comfortable fit")
- Focus on specific technical features (ANC, wireless charging, GPS, ECG, etc.)
- Return {{"phantom_features": []}} if no phantom features found
- Return valid JSON only"""


def build_phantom_prompt(
    review_text: str,
    category: str,
    spec_summary: str,
    features_absent: list[str],
    category_features: list[str],
) -> str:
    return PHANTOM_FEATURE_PROMPT.format(
        category=category,
        spec_summary=spec_summary[:300],
        features_absent=", ".join(features_absent[:10]) if features_absent else "none explicitly stated",
        review_text=review_text[:600],
        category_features=", ".join(category_features[:15]),
    )


PROMPT_RECONSTRUCTION_SYSTEM = """You are an AI prompt analyst. Given a cluster of similar AI-generated reviews,
reconstruct the prompt template that was likely used to generate them.
Be specific and realistic — the prompt should look like something a review farm would actually use."""

PROMPT_RECONSTRUCTION_TEMPLATE = """These {count} reviews appear to have been generated from the same AI prompt template.

PRODUCT TYPE: {product_type}
COMMON PHANTOM FEATURES (features all reviews mention that the product doesn't have):
{phantom_features}

SAMPLE REVIEWS:
{sample_reviews}

STATISTICS:
- Average length: {avg_length} words
- Average star rating: {avg_stars}
- Common tone: {tone}

Reconstruct the AI prompt template that likely generated these reviews.
The prompt should be realistic and specific.

Return JSON:
{{
  "reconstructed_prompt": "Write a [X]-star review of {{product}} mentioning [features]. [tone] tone, [length] words. [ending instruction].",
  "confidence": 0.0-1.0,
  "template_signals": ["signal1", "signal2"]
}}

Return valid JSON only."""


def build_reconstruction_prompt(
    count: int,
    product_type: str,
    phantom_features: list[str],
    sample_reviews: list[str],
    avg_length: int,
    avg_stars: float,
    tone: str,
) -> str:
    samples = "\n".join([f"- \"{r[:150]}\"" for r in sample_reviews[:3]])
    return PROMPT_RECONSTRUCTION_TEMPLATE.format(
        count=count,
        product_type=product_type,
        phantom_features=", ".join(phantom_features),
        sample_reviews=samples,
        avg_length=avg_length,
        avg_stars=round(avg_stars, 1),
        tone=tone,
    )
