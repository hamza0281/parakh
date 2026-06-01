"""
Category Detector — maps product type string to category_features.json key.

Used by L6 to look up which features are category-typical for a product.
"""
import json
import os
from functools import lru_cache
from app.logger import get_logger

logger = get_logger("category_detector")

_DATA_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "category_features.json")

# Keyword → category key mapping for fuzzy matching
_KEYWORD_MAP: dict[str, str] = {
    # Earbuds / headphones
    "earbud": "wireless_earbuds",
    "earphone": "wireless_earbuds",
    "headphone": "wireless_earbuds",
    "headset": "wireless_earbuds",
    "tws": "wireless_earbuds",
    "in-ear": "wireless_earbuds",
    "airpod": "wireless_earbuds",
    "buds": "wireless_earbuds",
    # Power banks
    "power bank": "power_bank",
    "powerbank": "power_bank",
    "portable charger": "power_bank",
    "battery pack": "power_bank",
    "mah": "power_bank",
    "portable battery": "power_bank",
    # Smartwatch
    "smartwatch": "smartwatch",
    "smart watch": "smartwatch",
    "fitness tracker": "smartwatch",
    "fitness band": "smartwatch",
    "activity tracker": "smartwatch",
    "wearable": "smartwatch",
    "band": "smartwatch",
    # Laptop
    "laptop": "laptop",
    "notebook": "laptop",
    "chromebook": "laptop",
    "macbook": "laptop",
    "ultrabook": "laptop",
    # Phone case
    "phone case": "phone_case",
    "phone cover": "phone_case",
    "iphone case": "phone_case",
    "samsung case": "phone_case",
    "protective case": "phone_case",
    "back cover": "phone_case",
}


@lru_cache(maxsize=1)
def load_category_features() -> dict:
    """Load and cache category features from JSON file."""
    try:
        with open(_DATA_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)
        # Remove _meta key
        return {k: v for k, v in data.items() if not k.startswith("_")}
    except Exception as e:
        logger.error(f"Failed to load category_features.json: {e}")
        return {}


def detect_category(product_type: str, title: str = "") -> str | None:
    """
    Detect the category key for a product.

    Args:
        product_type: Product type string from spec extraction (e.g. "wireless earbuds")
        title: Product title for fallback keyword matching

    Returns:
        Category key (e.g. "wireless_earbuds") or None if not recognized
    """
    categories = load_category_features()
    if not categories:
        return None

    combined = (product_type + " " + title).lower()

    # 1. Direct key match (e.g. "wireless_earbuds" → "wireless_earbuds")
    normalized = product_type.lower().strip().replace(" ", "_").replace("-", "_")
    if normalized in categories:
        return normalized

    # 2. Keyword map match
    for keyword, category_key in _KEYWORD_MAP.items():
        if keyword in combined:
            if category_key in categories:
                logger.debug(f"Category detected via keyword '{keyword}': {category_key}")
                return category_key

    # 3. Partial match against category keys
    for key in categories:
        key_words = key.replace("_", " ")
        if key_words in combined or combined in key_words:
            return key

    logger.debug(f"No category detected for product_type='{product_type}', title='{title[:50]}'")
    return None


def get_category_features(category_key: str) -> dict:
    """
    Get feature map for a category.

    Returns dict of {feature_name: {frequency, synonyms, category_typical, ...}}
    """
    categories = load_category_features()
    return categories.get(category_key, {})


def get_all_synonyms(category_key: str) -> dict[str, list[str]]:
    """
    Get a flat map of {feature_name: [synonym1, synonym2, ...]} for a category.
    Includes the feature name itself as a synonym.
    """
    features = get_category_features(category_key)
    result = {}
    for feature_name, feature_data in features.items():
        synonyms = feature_data.get("synonyms", [])
        # Add the feature name itself and normalized version
        all_syns = [feature_name, feature_name.replace("_", " ")] + synonyms
        result[feature_name] = [s.lower() for s in all_syns]
    return result
