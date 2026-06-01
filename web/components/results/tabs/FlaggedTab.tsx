"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { AnalyzeResponse, Review, Flag } from "@/lib/api";
import { ChevronDown, ChevronUp } from "lucide-react";

interface Props { result: AnalyzeResponse; }

function ReviewCard({ review, flags, isVerified }: { review: Review; flags: Flag[]; isVerified: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const topFlag = flags.sort((a, b) => b.confidence - a.confidence)[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl border overflow-hidden ${
        isVerified
          ? "bg-white border-[var(--border-soft)]"
          : "bg-red-50 border-l-4 border-l-[var(--danger)] border-[var(--border-soft)]"
      }`}
    >
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-amber-500 text-sm">{"★".repeat(review.stars)}{"☆".repeat(5 - review.stars)}</span>
              {review.reviewer_name && (
                <span className="text-xs text-[var(--muted)]">by {review.reviewer_name}</span>
              )}
              {review.date && (
                <span className="text-xs text-[var(--muted-soft)]">{review.date}</span>
              )}
              {review.verified_purchase && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Verified
                </span>
              )}
            </div>
            <p className="text-sm text-[var(--ink-soft)] leading-relaxed line-clamp-2">
              {review.text}
            </p>
          </div>
          <div className="shrink-0 flex flex-col items-end gap-1">
            {!isVerified && (
              <span className="px-2 py-0.5 rounded-full bg-[var(--danger)] text-white text-[10px] font-semibold uppercase tracking-wide">
                Flagged
              </span>
            )}
            {isVerified && (
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-semibold uppercase tracking-wide">
                Verified
              </span>
            )}
          </div>
        </div>

        {/* Flag reasons */}
        {!isVerified && flags.length > 0 && (
          <div className="mt-3">
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1 text-[11px] text-[var(--danger)] hover:text-red-700 transition-colors"
            >
              {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              {expanded ? "Hide" : "Show"} {flags.length} flag reason{flags.length > 1 ? "s" : ""}
              {topFlag && <span className="ml-1 text-[var(--muted)]">· {Math.round(topFlag.confidence * 100)}% confidence</span>}
            </button>
            {expanded && (
              <div className="mt-2 space-y-1.5">
                {flags.map((f, i) => (
                  <div key={i} className="flex items-start gap-2 text-[11px]">
                    <span className="text-[var(--danger)] mt-0.5 shrink-0">
                      {f.layer === "L4" ? "⚡" : f.layer === "L6" ? "👻" : "⚠"}
                    </span>
                    <div>
                      <span className="font-mono text-[10px] text-[var(--muted)] mr-1">{f.layer}</span>
                      <span className="text-[var(--ink-soft)]">{f.reason}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default function FlaggedTab({ result }: Props) {
  const [filter, setFilter] = useState<"all" | "flagged" | "verified">("all");

  const flagsByReview: Record<string, Flag[]> = {};
  for (const flag of result.all_flags) {
    if (!flagsByReview[flag.review_id]) flagsByReview[flag.review_id] = [];
    flagsByReview[flag.review_id].push(flag);
  }

  const flaggedIds = new Set(
    result.all_flags
      .filter((f) => f.confidence >= 0.7)
      .map((f) => f.review_id)
  );

  const reviews = result.product.reviews;
  const filtered = reviews.filter((r) => {
    if (filter === "flagged") return flaggedIds.has(r.id);
    if (filter === "verified") return !flaggedIds.has(r.id);
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-[var(--muted)]">Show:</span>
        {(["all", "flagged", "verified"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              filter === f
                ? "bg-[var(--ink)] text-white"
                : "bg-white border border-[var(--border)] text-[var(--muted)] hover:border-[var(--ink)]"
            }`}
          >
            {f === "all" ? `All (${reviews.length})` : f === "flagged" ? `Flagged (${flaggedIds.size})` : `Verified (${reviews.length - flaggedIds.size})`}
          </button>
        ))}
      </div>

      {/* Reviews */}
      {filtered.length === 0 ? (
        <div className="py-12 text-center text-[var(--muted)]">No reviews in this category.</div>
      ) : (
        <div className="space-y-3">
          {filtered.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              flags={flagsByReview[review.id] || []}
              isVerified={!flaggedIds.has(review.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
