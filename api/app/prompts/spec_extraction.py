"""
Prompts for extracting structured product specifications from Amazon listing text.
"""

SPEC_EXTRACTION_SYSTEM = """You are a product specification extractor. 
Given Amazon product listing text, extract structured specifications as JSON.
Be precise. Only include features explicitly mentioned in the listing.
Never infer or assume features not stated."""

SPEC_EXTRACTION_PROMPT = """Extract product specifications from this Amazon listing.

LISTING TEXT:
{listing_text}

SPECS TABLE (if available):
{specs_text}

Return a JSON object with exactly these fields:
{{
  "product_type": "short category name e.g. wireless earbuds, power bank, smartwatch, laptop",
  "features_present": ["list of features explicitly present/confirmed in listing"],
  "features_absent": ["list of features explicitly stated as NOT present, e.g. 'no ANC', 'wired only'"],
  "ambiguous": ["features mentioned but unclear if present e.g. 'compatible with wireless charging'"],
  "numerical_specs": {{
    "battery_hours": 6.0,
    "battery_mah": 0,
    "weight_grams": 0,
    "bluetooth_version": 5.3,
    "driver_size_mm": 0,
    "charging_watts": 0,
    "screen_size_inches": 0
  }},
  "raw_summary": "one sentence summary of what this product is and its key specs"
}}

Rules:
- features_present: only what is EXPLICITLY stated (e.g. "Bluetooth 5.3", "USB-C charging", "passive noise isolation")
- features_absent: only what is EXPLICITLY denied (e.g. "no active noise cancellation", "wired charging only")
- numerical_specs: use 0 for unknown values, use actual numbers when stated
- Be conservative — if unsure, put in ambiguous, not features_present
- Return valid JSON only"""


def build_spec_prompt(listing_text: str, specs_text: str) -> str:
    return SPEC_EXTRACTION_PROMPT.format(
        listing_text=listing_text[:3000],  # cap to avoid token overflow
        specs_text=specs_text[:1000],
    )
