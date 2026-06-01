import type { AnalyzeResponse } from "./api";

/**
 * Pre-built demo data for judge demo mode.
 * Used when ?demo=zen-sound-pro is in the URL — zero backend calls.
 */
export const DEMO_EARBUDS: AnalyzeResponse = {
  cache_key: "demo:zen-sound-pro",
  product: {
    asin: "B0DEMO0001",
    title: "ZenSound Pro Wireless Earbuds — Bluetooth 5.3, Passive Isolation, 6h Battery, USB-C",
    price: "$89.99",
    rating: 4.6,
    review_count: 2341,
    listing_text: "ZenSound Pro Wireless Earbuds — Bluetooth 5.3, Passive Isolation, 6h Battery, USB-C",
    specs_text: "Connectivity: Bluetooth 5.3\nBattery Life: 6 hours\nCharging: USB-C\nNoise Isolation: Passive\nWater Resistance: IPX4",
    reviews: [
      { id: "R_FAKE_001", text: "These earbuds have the BEST Active Noise Cancellation I've ever used! The wireless charging case is so convenient, and the 30-hour battery is absolutely unbelievable. The ENC for calls is crystal clear. Worth every penny!", stars: 5, date: "November 22, 2024", reviewer_id: "BOT_001", reviewer_name: "AudioLover2024", verified_purchase: true, helpful_votes: 0 },
      { id: "R_FAKE_002", text: "Amazing earbuds! The ANC technology blocks out all background noise perfectly. Wireless charging works great, just place them on any Qi pad. Battery lasts 28 hours easily. The LDAC codec gives audiophile quality sound.", stars: 5, date: "November 22, 2024", reviewer_id: "BOT_002", reviewer_name: "TechReviewer99", verified_purchase: true, helpful_votes: 0 },
      { id: "R_FAKE_003", text: "Love these! Active noise cancellation is top notch, wireless charging case is premium, and the 25 hour battery life is incredible. ENC makes calls sound professional. Highly recommend for anyone wanting premium earbuds.", stars: 5, date: "November 23, 2024", reviewer_id: "BOT_003", reviewer_name: "SoundEnthusiast", verified_purchase: false, helpful_votes: 0 },
      { id: "R_FAKE_004", text: "The ANC on these is phenomenal - blocks out everything. Wireless charging is super convenient. Battery lasts 30+ hours with the case. LDAC support means lossless audio quality. Best purchase this year!", stars: 5, date: "November 23, 2024", reviewer_id: "BOT_004", reviewer_name: "MusicFan2024", verified_purchase: true, helpful_votes: 0 },
      { id: "R_REAL_001", text: "Decent earbuds for the price. Battery lasts about 5-6 hours which matches what they advertise. The passive isolation is okay but don't expect miracles. USB-C charging is convenient. Sound quality is good for casual listening.", stars: 4, date: "October 15, 2024", reviewer_id: "HUMAN_001", reviewer_name: "David L.", verified_purchase: true, helpful_votes: 3 },
      { id: "R_REAL_002", text: "Bought these for my commute. They fit well and the sound is clear. Battery life is as advertised - about 6 hours. The case charges via USB-C which is great. No noise cancellation but the passive isolation helps on the subway.", stars: 4, date: "September 28, 2024", reviewer_id: "HUMAN_002", reviewer_name: "Sarah M.", verified_purchase: true, helpful_votes: 5 },
      { id: "R_REAL_003", text: "Good value earbuds. Sound is balanced, not too bassy. The 6 hour battery is accurate. Charging case is compact. My only complaint is the ear tips could be softer. Overall happy with the purchase.", stars: 3, date: "August 10, 2024", reviewer_id: "HUMAN_003", reviewer_name: "James K.", verified_purchase: true, helpful_votes: 2 },
      { id: "R_REAL_004", text: "These are solid earbuds for everyday use. The Bluetooth 5.3 connection is stable. Battery lasts exactly as advertised. The passive isolation is decent. USB-C charging is a plus. Would recommend for the price.", stars: 5, date: "July 5, 2024", reviewer_id: "HUMAN_004", reviewer_name: "Priya S.", verified_purchase: true, helpful_votes: 7 },
    ],
  },
  original_score: 4.6,
  adjusted_score: 3.1,
  total_reviews: 8,
  flagged_count: 4,
  verified_count: 4,
  all_flags: [
    { review_id: "R_FAKE_001", layer: "L4", reason: "Claims 'active noise cancellation' — Spec explicitly states this feature is absent", confidence: 0.97, evidence: { claimed_feature: "active_noise_cancellation", contradiction_type: "hard_absent" } },
    { review_id: "R_FAKE_001", layer: "L6", reason: "Phantom features detected: active noise cancellation, wireless charging, enc", confidence: 0.92, evidence: { phantom_features: ["active_noise_cancellation", "wireless_charging", "enc"] } },
    { review_id: "R_FAKE_002", layer: "L4", reason: "Claims 'battery hours' — Spec says 6h battery; review claims 28h", confidence: 0.95, evidence: { claimed_feature: "battery_hours", contradiction_type: "numerical" } },
    { review_id: "R_FAKE_002", layer: "L6", reason: "Phantom features detected: active noise cancellation, wireless charging, bluetooth codec", confidence: 0.88, evidence: { phantom_features: ["active_noise_cancellation", "wireless_charging", "bluetooth_codec"] } },
    { review_id: "R_FAKE_003", layer: "L4", reason: "Claims 'battery hours' — Spec says 6h battery; review claims 25h", confidence: 0.92, evidence: { claimed_feature: "battery_hours", contradiction_type: "numerical" } },
    { review_id: "R_FAKE_003", layer: "L6", reason: "Phantom features detected: active noise cancellation, wireless charging", confidence: 0.85, evidence: { phantom_features: ["active_noise_cancellation", "wireless_charging"] } },
    { review_id: "R_FAKE_004", layer: "L4", reason: "Claims 'battery hours' — Spec says 6h battery; review claims 30h", confidence: 0.95, evidence: { claimed_feature: "battery_hours", contradiction_type: "numerical" } },
    { review_id: "R_FAKE_004", layer: "L6", reason: "Phantom features detected: active noise cancellation, wireless charging, bluetooth codec", confidence: 0.90, evidence: { phantom_features: ["active_noise_cancellation", "wireless_charging", "bluetooth_codec"] } },
  ],
  layer_results: {
    l4: {
      spec_sheet: {
        product_type: "wireless earbuds",
        features_present: ["bluetooth 5.3", "passive isolation", "6h battery", "usb-c charging", "ipx4"],
        features_absent: ["active noise cancellation", "wireless charging"],
        ambiguous: [],
        numerical_specs: { battery_hours: 6.0, bluetooth_version: 5.3 },
        raw_text: "Bluetooth 5.3, passive isolation, 6h battery, USB-C charging, IPX4",
      },
      mismatches: [
        { review_id: "R_FAKE_001", claimed_feature: "active_noise_cancellation", spec_reality: "Spec explicitly states this feature is absent", contradiction_type: "hard_absent", confidence: 0.97 },
        { review_id: "R_FAKE_002", claimed_feature: "battery_hours", spec_reality: "Spec says 6h battery; review claims 28h", contradiction_type: "numerical", confidence: 0.95 },
        { review_id: "R_FAKE_003", claimed_feature: "battery_hours", spec_reality: "Spec says 6h battery; review claims 25h", contradiction_type: "numerical", confidence: 0.92 },
        { review_id: "R_FAKE_004", claimed_feature: "battery_hours", spec_reality: "Spec says 6h battery; review claims 30h", contradiction_type: "numerical", confidence: 0.95 },
      ],
      flagged_review_ids: ["R_FAKE_001", "R_FAKE_002", "R_FAKE_003", "R_FAKE_004"],
      flags: [],
    },
    l6: {
      phantom_features: [
        { feature_name: "active_noise_cancellation", review_ids: ["R_FAKE_001", "R_FAKE_002", "R_FAKE_003", "R_FAKE_004"], category_frequency: 0.78, confidence: 0.95 },
        { feature_name: "wireless_charging", review_ids: ["R_FAKE_001", "R_FAKE_002", "R_FAKE_003", "R_FAKE_004"], category_frequency: 0.45, confidence: 0.92 },
        { feature_name: "bluetooth_codec", review_ids: ["R_FAKE_002", "R_FAKE_004"], category_frequency: 0.41, confidence: 0.85 },
        { feature_name: "enc", review_ids: ["R_FAKE_001", "R_FAKE_003"], category_frequency: 0.55, confidence: 0.82 },
      ],
      phantom_clusters: [
        {
          cluster_id: 0,
          review_ids: ["R_FAKE_001", "R_FAKE_002", "R_FAKE_003", "R_FAKE_004"],
          phantom_features: ["active_noise_cancellation", "wireless_charging", "enc"],
          reconstructed_prompt: "Write a 5-star review of premium wireless earbuds mentioning ANC, wireless charging case, and long battery life. Enthusiastic tone, 60-80 words, end with a recommendation.",
          avg_review_length: 68,
          avg_stars: 5.0,
        },
      ],
      flagged_review_ids: ["R_FAKE_001", "R_FAKE_002", "R_FAKE_003", "R_FAKE_004"],
      flags: [],
    },
  },
  reconstructed_prompts: [
    "Write a 5-star review of premium wireless earbuds mentioning ANC, wireless charging case, and long battery life. Enthusiastic tone, 60-80 words, end with a recommendation.",
  ],
  analysis_time_seconds: 8.4,
  cached: false,
};

export const DEMO_POWERBANK: AnalyzeResponse = {
  cache_key: "demo:power-max",
  product: {
    asin: "B0DEMO0002",
    title: "PowerMax 10000mAh Portable Charger — USB-C 18W, Dual USB-A, LED Indicator",
    price: "$29.99",
    rating: 4.4,
    review_count: 1876,
    listing_text: "PowerMax 10000mAh Portable Charger — USB-C 18W, Dual USB-A, LED Indicator. No wireless charging.",
    specs_text: "Capacity: 10000mAh\nUSB-C Output: 18W PD\nWireless Charging: No\nWeight: 220g",
    reviews: [
      { id: "R_PB_FAKE_001", text: "This power bank is amazing! The wireless charging feature works perfectly with my phone. The 30000mAh capacity is incredible - charges my laptop multiple times. MagSafe compatible too! Fast charging at 65W is super quick.", stars: 5, date: "December 1, 2024", reviewer_id: "BOT_PB_001", reviewer_name: "GadgetGuru", verified_purchase: true, helpful_votes: 0 },
      { id: "R_PB_REAL_001", text: "Good power bank for the price. 10000mAh is enough for 2 phone charges. The USB-C 18W charging is fast. LED indicator is helpful. Compact size fits in my bag easily. No wireless charging but that's fine for the price.", stars: 4, date: "November 10, 2024", reviewer_id: "HUMAN_PB_001", reviewer_name: "TravellerMike", verified_purchase: true, helpful_votes: 4 },
    ],
  },
  original_score: 4.4,
  adjusted_score: 4.0,
  total_reviews: 2,
  flagged_count: 1,
  verified_count: 1,
  all_flags: [
    { review_id: "R_PB_FAKE_001", layer: "L4", reason: "Claims 'wireless charging' — Spec explicitly states this feature is absent", confidence: 0.97, evidence: { claimed_feature: "wireless_charging", contradiction_type: "hard_absent" } },
    { review_id: "R_PB_FAKE_001", layer: "L6", reason: "Phantom features detected: wireless charging, capacity mah", confidence: 0.90, evidence: { phantom_features: ["wireless_charging", "capacity_mah"] } },
  ],
  layer_results: {
    l4: {
      spec_sheet: {
        product_type: "power bank",
        features_present: ["10000mah", "usb-c 18w", "dual usb-a", "led indicator"],
        features_absent: ["wireless charging", "magsafe"],
        ambiguous: [],
        numerical_specs: { battery_mah: 10000, charging_watts: 18 },
        raw_text: "10000mAh, USB-C 18W, no wireless charging",
      },
      mismatches: [
        { review_id: "R_PB_FAKE_001", claimed_feature: "wireless_charging", spec_reality: "Spec explicitly states this feature is absent", contradiction_type: "hard_absent", confidence: 0.97 },
      ],
      flagged_review_ids: ["R_PB_FAKE_001"],
      flags: [],
    },
    l6: {
      phantom_features: [
        { feature_name: "wireless_charging_powerbank", review_ids: ["R_PB_FAKE_001"], category_frequency: 0.28, confidence: 0.90 },
      ],
      phantom_clusters: [
        {
          cluster_id: 0,
          review_ids: ["R_PB_FAKE_001"],
          phantom_features: ["wireless_charging", "capacity_mah"],
          reconstructed_prompt: "Write a 5-star review of a portable charger mentioning wireless charging, high capacity, and fast charging. Enthusiastic tone, 50-70 words.",
          avg_review_length: 55,
          avg_stars: 5.0,
        },
      ],
      flagged_review_ids: ["R_PB_FAKE_001"],
      flags: [],
    },
  },
  reconstructed_prompts: [
    "Write a 5-star review of a portable charger mentioning wireless charging, high capacity, and fast charging. Enthusiastic tone, 50-70 words.",
  ],
  analysis_time_seconds: 5.2,
  cached: false,
};

export const DEMO_MAP: Record<string, AnalyzeResponse> = {
  "zen-sound-pro": DEMO_EARBUDS,
  "power-max": DEMO_POWERBANK,
};
