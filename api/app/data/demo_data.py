"""
Pre-built demo data for judge demo mode.
These are realistic synthetic examples that showcase all detection layers.
Used when ?demo=true is passed to /analyze, or when Amazon scraping fails.
"""
from app.models.schemas import ProductListing, Review

DEMO_EARBUDS = ProductListing(
    asin="B0DEMO0001",
    title="ZenSound Pro Wireless Earbuds — Bluetooth 5.3, Passive Isolation, 6h Battery, USB-C",
    price="$89.99",
    rating=4.6,
    review_count=2341,
    listing_text="""ZenSound Pro Wireless Earbuds — Bluetooth 5.3, Passive Isolation, 6h Battery, USB-C

• Bluetooth 5.3 for stable connection up to 30ft
• Passive sound isolation — blocks ambient noise naturally
• 6 hours playback per charge, 18 hours total with charging case
• USB-C fast charging — 15 min charge = 2 hours playback
• Ergonomic fit with 3 ear tip sizes included
• Built-in microphone for calls
• IPX4 splash resistant

These earbuds deliver clear, balanced sound for everyday listening. 
The passive isolation design keeps outside noise at bay without active processing.
USB-C charging case included.""",
    specs_text="""Connectivity: Bluetooth 5.3
Battery Life: 6 hours (earbuds), 18 hours total
Charging: USB-C (case), 15 min quick charge
Noise Isolation: Passive
Water Resistance: IPX4
Driver Size: 10mm dynamic
Weight: 5g per earbud
Microphone: Yes, built-in
Codec: SBC, AAC""",
    reviews=[
        # AI-generated fake reviews (will be flagged by L4)
        Review(
            id="R_FAKE_001",
            text="These earbuds have the BEST Active Noise Cancellation I've ever used! The wireless charging case is so convenient, and the 30-hour battery is absolutely unbelievable. The ENC for calls is crystal clear. Worth every penny!",
            stars=5,
            date="November 22, 2024",
            reviewer_id="BOT_001",
            reviewer_name="AudioLover2024",
            verified_purchase=True,
        ),
        Review(
            id="R_FAKE_002",
            text="Amazing earbuds! The ANC technology blocks out all background noise perfectly. Wireless charging works great, just place them on any Qi pad. Battery lasts 28 hours easily. The LDAC codec gives audiophile quality sound.",
            stars=5,
            date="November 22, 2024",
            reviewer_id="BOT_002",
            reviewer_name="TechReviewer99",
            verified_purchase=True,
        ),
        Review(
            id="R_FAKE_003",
            text="Love these! Active noise cancellation is top notch, wireless charging case is premium, and the 25 hour battery life is incredible. ENC makes calls sound professional. Highly recommend for anyone wanting premium earbuds.",
            stars=5,
            date="November 23, 2024",
            reviewer_id="BOT_003",
            reviewer_name="SoundEnthusiast",
            verified_purchase=False,
        ),
        Review(
            id="R_FAKE_004",
            text="The ANC on these is phenomenal - blocks out everything. Wireless charging is super convenient. Battery lasts 30+ hours with the case. LDAC support means lossless audio quality. Best purchase this year!",
            stars=5,
            date="November 23, 2024",
            reviewer_id="BOT_004",
            reviewer_name="MusicFan2024",
            verified_purchase=True,
        ),
        # Genuine human reviews (should NOT be flagged)
        Review(
            id="R_REAL_001",
            text="Decent earbuds for the price. Battery lasts about 5-6 hours which matches what they advertise. The passive isolation is okay but don't expect miracles. USB-C charging is convenient. Sound quality is good for casual listening.",
            stars=4,
            date="October 15, 2024",
            reviewer_id="HUMAN_001",
            reviewer_name="David L.",
            verified_purchase=True,
        ),
        Review(
            id="R_REAL_002",
            text="Bought these for my commute. They fit well and the sound is clear. Battery life is as advertised - about 6 hours. The case charges via USB-C which is great. No noise cancellation but the passive isolation helps on the subway.",
            stars=4,
            date="September 28, 2024",
            reviewer_id="HUMAN_002",
            reviewer_name="Sarah M.",
            verified_purchase=True,
        ),
        Review(
            id="R_REAL_003",
            text="Good value earbuds. Sound is balanced, not too bassy. The 6 hour battery is accurate. Charging case is compact. My only complaint is the ear tips could be softer. Overall happy with the purchase.",
            stars=3,
            date="August 10, 2024",
            reviewer_id="HUMAN_003",
            reviewer_name="James K.",
            verified_purchase=True,
        ),
        Review(
            id="R_REAL_004",
            text="These are solid earbuds for everyday use. The Bluetooth 5.3 connection is stable. Battery lasts exactly as advertised. The passive isolation is decent. USB-C charging is a plus. Would recommend for the price.",
            stars=5,
            date="July 5, 2024",
            reviewer_id="HUMAN_004",
            reviewer_name="Priya S.",
            verified_purchase=True,
        ),
    ],
)

DEMO_POWERBANK = ProductListing(
    asin="B0DEMO0002",
    title="PowerMax 10000mAh Portable Charger — USB-C 18W, Dual USB-A, LED Indicator",
    price="$29.99",
    rating=4.4,
    review_count=1876,
    listing_text="""PowerMax 10000mAh Portable Charger

• 10000mAh capacity — charges iPhone 14 about 2.5 times
• USB-C 18W Power Delivery output
• Dual USB-A 12W output ports
• LED battery indicator (4 lights)
• Compact design — fits in pocket
• Input: USB-C 18W for fast recharging
• No wireless charging output
• Weight: 220g""",
    specs_text="""Capacity: 10000mAh
USB-C Output: 18W PD
USB-A Output: 12W x2
Input: USB-C 18W
Wireless Charging: No
Weight: 220g
LED Indicator: 4-level""",
    reviews=[
        Review(
            id="R_PB_FAKE_001",
            text="This power bank is amazing! The wireless charging feature works perfectly with my phone. The 30000mAh capacity is incredible - charges my laptop multiple times. MagSafe compatible too! Fast charging at 65W is super quick.",
            stars=5,
            date="December 1, 2024",
            reviewer_id="BOT_PB_001",
            reviewer_name="GadgetGuru",
            verified_purchase=True,
        ),
        Review(
            id="R_PB_REAL_001",
            text="Good power bank for the price. 10000mAh is enough for 2 phone charges. The USB-C 18W charging is fast. LED indicator is helpful. Compact size fits in my bag easily. No wireless charging but that's fine for the price.",
            stars=4,
            date="November 10, 2024",
            reviewer_id="HUMAN_PB_001",
            reviewer_name="TravellerMike",
            verified_purchase=True,
        ),
    ],
)

# Map of demo product IDs to their data
DEMO_PRODUCTS = {
    "zen-sound-pro": DEMO_EARBUDS,
    "power-max": DEMO_POWERBANK,
}


def get_demo_product(demo_id: str) -> ProductListing | None:
    return DEMO_PRODUCTS.get(demo_id)
