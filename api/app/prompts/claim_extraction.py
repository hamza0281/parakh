"""
Prompts for extracting product feature claims from review text.
"""

CLAIM_EXTRACTION_SYSTEM = """You are a product claim extractor.
Given a product review, extract specific product feature claims made by the reviewer.
Focus on claims about product capabilities, specs, and features — not opinions."""

CLAIM_EXTRACTION_PROMPT = """Extract product feature claims from this review.

PRODUCT TYPE: {product_type}
REVIEW TEXT: {review_text}

Return a JSON object:
{{
  "claims": [
    {{
      "feature": "short feature name e.g. active_noise_cancellation, wireless_charging, battery_hours",
      "claim_text": "exact phrase from review making this claim",
      "numerical_value": null,
      "claim_type": "presence | absence | numerical | quality"
    }}
  ]
}}

Rules:
- Only extract FACTUAL claims about product features/specs, not opinions
- claim_type "presence": reviewer says feature exists (e.g. "has ANC", "wireless charging works")
- claim_type "absence": reviewer says feature missing (e.g. "no ANC", "doesn't have GPS")
- claim_type "numerical": reviewer states a number (e.g. "30 hour battery", "10000mAh")
- claim_type "quality": reviewer rates quality of a feature (e.g. "ANC is excellent") — still extract the feature
- numerical_value: extract the number if claim_type is numerical, else null
- If no feature claims found, return {{"claims": []}}
- Return valid JSON only"""


def build_claim_prompt(review_text: str, product_type: str) -> str:
    return CLAIM_EXTRACTION_PROMPT.format(
        review_text=review_text[:800],  # reviews are short
        product_type=product_type or "consumer electronics",
    )
