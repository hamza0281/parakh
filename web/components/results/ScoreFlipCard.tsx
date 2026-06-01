"use client";

import { motion } from "framer-motion";
import type { AnalyzeResponse } from "@/lib/api";

interface Props {
  result: AnalyzeResponse;
}

function StarRow({ score, color }: { score: number; color: string }) {
  const full = Math.floor(score);
  const half = score - full >= 0.5;
  return (
    <div className="flex gap-0.5 mt-1">
      {Array.from({ length: 5 }, (_, i) => (
        <span
          key={i}
          className="text-lg"
          style={{
            color: i < full ? color : i === full && half ? color : "#E2E8F0",
            opacity: i < full ? 1 : i === full && half ? 0.6 : 1,
          }}
        >
          ★
        </span>
      ))}
    </div>
  );
}

export default function ScoreFlipCard({ result }: Props) {
  const diff = result.original_score - result.adjusted_score;
  const pctFlagged = result.total_reviews > 0
    ? Math.round((result.flagged_count / result.total_reviews) * 100)
    : 0;

  return (
    <div className="space-y-4">
      {/* Score cards */}
      <div className="grid grid-cols-2 gap-4">
        {/* Original */}
        <div className="relative p-6 md:p-8 rounded-2xl bg-white border border-[var(--border)] overflow-hidden">
          <div className="text-[10px] tracking-[0.2em] uppercase text-[var(--muted)] mb-2">
            Original (Amazon)
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-display text-6xl md:text-7xl line-through decoration-[var(--muted-soft)] decoration-[3px] text-[var(--muted)]">
              {result.original_score.toFixed(1)}
            </span>
          </div>
          <StarRow score={result.original_score} color="#94A3B8" />
          <div className="mt-2 text-xs text-[var(--muted)]">
            {result.total_reviews.toLocaleString()} reviews
          </div>
        </div>

        {/* Adjusted */}
        <div className="relative p-6 md:p-8 rounded-2xl bg-[var(--ink)] text-white overflow-hidden">
          <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-[var(--danger)] opacity-20 blur-2xl" />
          <div className="relative">
            <div className="text-[10px] tracking-[0.2em] uppercase text-white/60 mb-2">
              Adjusted by Parakh
            </div>
            <div className="flex items-baseline gap-2">
              <motion.span
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.6, type: "spring" }}
                className="font-display text-6xl md:text-7xl"
                style={{ color: diff > 0.5 ? "#FCA5A5" : "#FFFFFF" }}
              >
                {result.adjusted_score.toFixed(1)}
              </motion.span>
            </div>
            <StarRow
              score={result.adjusted_score}
              color={diff > 0.5 ? "#FCA5A5" : "#FCD34D"}
            />
            <div className="mt-2 text-xs text-white/60">
              {result.verified_count.toLocaleString()} verified reviews
            </div>
          </div>
        </div>
      </div>

      {/* Alert banner */}
      {result.flagged_count > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-200"
        >
          <span className="text-[var(--danger)] text-xl mt-0.5">⚠</span>
          <div>
            <p className="text-sm font-semibold text-[var(--danger)]">
              {result.flagged_count} reviews flagged as likely AI-generated ({pctFlagged}%)
            </p>
            <p className="text-xs text-red-600 mt-0.5">
              {diff > 0
                ? `Score adjusted down by ${diff.toFixed(1)} stars after removing fake reviews.`
                : "Score unchanged — flagged reviews had similar ratings to genuine ones."}
            </p>
          </div>
        </motion.div>
      )}

      {result.flagged_count === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex items-start gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-200"
        >
          <span className="text-[var(--success)] text-xl mt-0.5">✓</span>
          <div>
            <p className="text-sm font-semibold text-[var(--success)]">
              No fake reviews detected
            </p>
            <p className="text-xs text-emerald-700 mt-0.5">
              All {result.total_reviews} reviews appear genuine. Score is accurate.
            </p>
          </div>
        </motion.div>
      )}

      {/* Layer breakdown mini */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {[
          { id: "L1", name: "Stylometric", count: result.layer_results.l1?.flagged_review_ids.length ?? 0 },
          { id: "L2", name: "Temporal", count: result.layer_results.l2?.flagged_review_ids.length ?? 0 },
          { id: "L3", name: "Reviewers", count: result.layer_results.l3?.flagged_review_ids.length ?? 0 },
          { id: "L4", name: "Spec-Claim", count: result.layer_results.l4?.flagged_review_ids.length ?? 0, killer: true },
          { id: "L6", name: "Phantom", count: result.layer_results.l6?.flagged_review_ids.length ?? 0, killer: true },
        ].map((layer, i) => (
          <motion.div
            key={layer.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 + i * 0.07 }}
            className={`p-3 rounded-xl border ${
              layer.killer
                ? "bg-amber-50 border-amber-200"
                : "bg-white border-[var(--border-soft)]"
            }`}
          >
            <div className="flex items-center justify-between text-[10px] text-[var(--muted)] mb-1">
              <span className="font-mono">{layer.id}</span>
              {layer.killer && <span className="text-amber-500">★</span>}
            </div>
            <div className={`text-2xl font-display ${layer.count > 0 ? "text-[var(--danger)]" : "text-[var(--muted)]"}`}>
              {layer.count}
            </div>
            <div className="text-[10px] text-[var(--muted)]">{layer.name}</div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
