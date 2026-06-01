"""
Amazon Scraper — httpx + selectolax.
Extracts product listing + reviews from Amazon product pages.
"""
import hashlib
import re
import httpx
from selectolax.parser import HTMLParser
from fake_useragent import UserAgent
from typing import Optional
from app.models.schemas import ProductListing, Review
from app.services.cache import get_cached, set_cached

ua = UserAgent()

HEADERS_BASE = {
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Accept-Encoding": "gzip, deflate, br",
    "Connection": "keep-alive",
    "DNT": "1",
}


def _get_headers() -> dict:
    return {**HEADERS_BASE, "User-Agent": ua.random}


def _extract_asin(url: str) -> str:
    match = re.search(r"/dp/([A-Z0-9]{10})", url)
    if match:
        return match.group(1)
    match = re.search(r"/product/([A-Z0-9]{10})", url)
    if match:
        return match.group(1)
    return hashlib.md5(url.encode()).hexdigest()[:10].upper()


def _parse_listing(html: str, asin: str) -> ProductListing:
    tree = HTMLParser(html)

    # Title
    title_node = tree.css_first("#productTitle")
    title = title_node.text(strip=True) if title_node else "Unknown Product"

    # Price
    price_node = tree.css_first(".a-price .a-offscreen")
    price = price_node.text(strip=True) if price_node else None

    # Rating
    rating_node = tree.css_first("#acrPopover")
    rating_text = rating_node.attributes.get("title", "") if rating_node else ""
    rating_match = re.search(r"([\d.]+) out of", rating_text)
    rating = float(rating_match.group(1)) if rating_match else None

    # Review count
    count_node = tree.css_first("#acrCustomerReviewText")
    count_text = count_node.text(strip=True) if count_node else ""
    count_match = re.search(r"([\d,]+)", count_text)
    review_count = int(count_match.group(1).replace(",", "")) if count_match else None

    # Feature bullets
    bullets = []
    for li in tree.css("#feature-bullets li"):
        text = li.text(strip=True)
        if text and len(text) > 5:
            bullets.append(text)

    # Description
    desc_node = tree.css_first("#productDescription")
    description = desc_node.text(strip=True) if desc_node else ""

    # Tech specs table
    specs_parts = []
    for row in tree.css("#productDetails_techSpec_section_1 tr, #productDetails_db_sections tr"):
        cells = row.css("td, th")
        if len(cells) >= 2:
            key = cells[0].text(strip=True)
            val = cells[1].text(strip=True)
            if key and val:
                specs_parts.append(f"{key}: {val}")

    listing_text = f"{title}\n\n" + "\n".join(bullets) + f"\n\n{description}"
    specs_text = "\n".join(specs_parts)

    return ProductListing(
        asin=asin,
        title=title,
        price=price,
        rating=rating,
        review_count=review_count,
        listing_text=listing_text,
        specs_text=specs_text,
        reviews=[],
    )


def _parse_reviews(html: str) -> list[Review]:
    tree = HTMLParser(html)
    reviews = []

    for div in tree.css("[data-hook='review']"):
        # ID
        rev_id = div.attributes.get("id", f"rev_{len(reviews)}")

        # Stars
        star_node = div.css_first("[data-hook='review-star-rating'], [data-hook='cmps-review-star-rating']")
        stars_text = star_node.attributes.get("class", "") if star_node else ""
        stars_match = re.search(r"a-star-(\d)", stars_text)
        stars = int(stars_match.group(1)) if stars_match else 3

        # Text
        body_node = div.css_first("[data-hook='review-body'] span")
        text = body_node.text(strip=True) if body_node else ""
        if not text or len(text) < 10:
            continue

        # Date
        date_node = div.css_first("[data-hook='review-date']")
        date = date_node.text(strip=True) if date_node else None

        # Reviewer
        reviewer_node = div.css_first(".a-profile-name")
        reviewer_name = reviewer_node.text(strip=True) if reviewer_node else None

        reviewer_link = div.css_first(".a-profile")
        reviewer_id = None
        if reviewer_link:
            href = reviewer_link.attributes.get("href", "")
            id_match = re.search(r"profile/([A-Z0-9]+)", href)
            reviewer_id = id_match.group(1) if id_match else None

        # Verified
        verified_node = div.css_first("[data-hook='avp-badge']")
        verified = verified_node is not None

        reviews.append(Review(
            id=rev_id,
            text=text,
            stars=stars,
            date=date,
            reviewer_id=reviewer_id,
            reviewer_name=reviewer_name,
            verified_purchase=verified,
        ))

    return reviews


async def scrape_product(url: str, max_reviews: int = 100) -> ProductListing:
    """
    Scrape Amazon product page + reviews.
    Caches result for 6 hours.
    """
    cache_key = f"parakh:scrape:{hashlib.sha256(url.encode()).hexdigest()[:16]}"
    cached = await get_cached(cache_key)
    if cached:
        return ProductListing(**cached)

    asin = _extract_asin(url)

    async with httpx.AsyncClient(
        headers=_get_headers(),
        follow_redirects=True,
        timeout=20.0,
    ) as client:
        # Fetch product page
        resp = await client.get(url)
        resp.raise_for_status()
        listing = _parse_listing(resp.text, asin)

        # Fetch reviews page
        reviews_url = f"https://www.amazon.com/product-reviews/{asin}?pageSize=100&sortBy=recent"
        try:
            rev_resp = await client.get(reviews_url)
            reviews = _parse_reviews(rev_resp.text)
            listing.reviews = reviews[:max_reviews]
        except Exception:
            listing.reviews = []

    # Cache for 6 hours
    await set_cached(cache_key, listing.model_dump(), ttl=21600)
    return listing
