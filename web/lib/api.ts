/**
 * Parakh API Client — Full typed interface matching backend schemas.py
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export class ApiError extends Error {
  constructor(public status: number, message: string, public details?: unknown) {
    super(message);
    this.name = "ApiError";
  }
}

// ── Types matching backend schemas.py ──────────────────────────────────────

export interface Review {
  id: string;
  text: string;
  stars: number;
  date?: string;
  reviewer_id?: string;
  reviewer_name?: string;
  verified_purchase: boolean;
  helpful_votes: number;
}

export interface SpecSheet {
  product_type: string;
  features_present: string[];
  features_absent: string[];
  ambiguous: string[];
  numerical_specs: Record<string, number>;
  raw_text: string;
}

export interface ProductListing {
  asin: string;
  title: string;
  price?: string;
  rating?: number;
  review_count?: number;
  listing_text: string;
  specs_text: string;
  reviews: Review[];
}

export interface Flag {
  review_id: string;
  layer: "L1" | "L2" | "L3" | "L4" | "L6";
  reason: string;
  confidence: number;
  evidence: Record<string, unknown>;
}

export interface ReviewCluster {
  cluster_id: number;
  review_ids: string[];
  similarity_score: number;
  pattern_description: string;
}

export interface L1Result {
  clusters: ReviewCluster[];
  flagged_review_ids: string[];
  flags: Flag[];
}

export interface BurstEvent {
  start_date: string;
  end_date: string;
  review_count: number;
  z_score: number;
  review_ids: string[];
}

export interface L2Result {
  bursts: BurstEvent[];
  flagged_review_ids: string[];
  flags: Flag[];
  timeline: Array<{ date: string; count: number }>;
}

export interface ReviewerProfile {
  reviewer_id: string;
  reviewer_name: string;
  bot_score: number;
  total_reviews: number;
  reviews_per_day: number;
  five_star_pct: number;
  category_diversity: number;
  length_variance: number;
}

export interface L3Result {
  suspicious_reviewers: ReviewerProfile[];
  flagged_review_ids: string[];
  flags: Flag[];
}

export interface SpecMismatch {
  review_id: string;
  claimed_feature: string;
  spec_reality: string;
  contradiction_type: "hard_absent" | "numerical" | "nli_contradiction";
  confidence: number;
  nli_score?: number;
}

export interface L4Result {
  spec_sheet: SpecSheet;
  mismatches: SpecMismatch[];
  flagged_review_ids: string[];
  flags: Flag[];
}

export interface PhantomFeature {
  feature_name: string;
  review_ids: string[];
  category_frequency: number;
  confidence: number;
}

export interface PhantomCluster {
  cluster_id: number;
  review_ids: string[];
  phantom_features: string[];
  reconstructed_prompt: string;
  avg_review_length: number;
  avg_stars: number;
}

export interface L6Result {
  phantom_features: PhantomFeature[];
  phantom_clusters: PhantomCluster[];
  flagged_review_ids: string[];
  flags: Flag[];
}

export interface LayerResults {
  l1?: L1Result;
  l2?: L2Result;
  l3?: L3Result;
  l4?: L4Result;
  l6?: L6Result;
}

export interface AnalyzeResponse {
  cache_key: string;
  product: ProductListing;
  original_score: number;
  adjusted_score: number;
  total_reviews: number;
  flagged_count: number;
  verified_count: number;
  all_flags: Flag[];
  layer_results: LayerResults;
  reconstructed_prompts: string[];
  analysis_time_seconds: number;
  cached: boolean;
}

export interface HealthResponse {
  status: "healthy" | "degraded";
  version: string;
  services: {
    api: string;
    groq_key_configured: boolean;
    gemini_key_configured: boolean;
    hf_key_configured: boolean;
    redis: string;
  };
}

export interface AnalyzeRequest {
  url: string;
  max_reviews?: number;
}

// ── HTTP helper ────────────────────────────────────────────────────────────

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_URL}${path}`;
  let res: Response;
  try {
    res = await fetch(url, {
      ...options,
      headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    });
  } catch (err) {
    throw new ApiError(0, "Network error: backend unreachable", err);
  }
  if (!res.ok) {
    let detail: unknown = null;
    try { detail = await res.json(); } catch {}
    throw new ApiError(res.status, `HTTP ${res.status}`, detail);
  }
  return res.json() as Promise<T>;
}

// ── API functions ──────────────────────────────────────────────────────────

export async function checkHealth(): Promise<HealthResponse> {
  return request<HealthResponse>("/api/v1/health");
}

export async function analyzeProduct(
  req: AnalyzeRequest,
  demo?: string
): Promise<AnalyzeResponse> {
  const qs = demo ? `?demo=${encodeURIComponent(demo)}` : "";
  return request<AnalyzeResponse>(`/api/v1/analyze${qs}`, {
    method: "POST",
    body: JSON.stringify(req),
  });
}

export const apiUrl = API_URL;
