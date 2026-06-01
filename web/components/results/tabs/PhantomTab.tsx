"use client";

import { motion } from "framer-motion";
import type { AnalyzeResponse } from "@/lib/api";

interface Props { result: AnalyzeResponse; }

export default function PhantomTab({ result }: Props) {
  const l6 = result.layer_results.l6;

  if (!l6 || l6.phantom_features.length === 0) {
    return (
      <div className="py-16 text-center">
        <div className="text-4xl mb-3">👻</div>
        <p className="text-[var(--muted)]">No phantom features detected.</p>
        <p className="text-sm text-[var(--muted-soft)] mt-1">
          Reviews don&apos;t appear to hallucinate category-typical features.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Explanation */}
      <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
        <p className="text-sm text-amber-800 leading-relaxed">
          <strong>What are phantom features?</strong> AI-generated reviews hallucinate features common in the product category
          (e.g. &ldquo;ANC&rdquo; for earbuds) even when the specific product doesn&apos;t have them.
          Real users don&apos;t invent features that don&apos;t exist.
        </p>
      </div>

      {/* Phantom features list */}
      <div>
        <h3 className="text-sm font-semibold text-[var(--ink)] mb-3">
          Features mentioned in reviews that are NOT in the product spec
        </h3>
        <div className="space-y-3">
          {l6.phantom_features.map((pf, i) => (
            <motion.div
              key={pf.feature_name}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              className="p-4 rounded-xl bg-white border border-[var(--border)] hover:border-[var(--danger)]/30 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[var(--danger)] font-bold">✕</span>
                    <span className="font-medium text-[var(--ink)] capitalize">
                      {pf.feature_name.replace(/_/g, " ")}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-50 text-red-700 border border-red-200">
                      NOT in spec
                    </span>
                  </div>
                  <p className="text-xs text-[var(--muted)]">
                    Mentioned in <strong className="text-[var(--danger)]">{pf.review_ids.length}</strong> reviews ·{" "}
                    Common in {Math.round(pf.category_frequency * 100)}% of similar products
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-2xl font-display text-[var(--danger)]">{pf.review_ids.length}</div>
                  <div className="text-[10px] text-[var(--muted)]">reviews</div>
                </div>
              </div>
              {/* Confidence bar */}
              <div className="mt-3">
                <div className="flex items-center justify-between text-[10px] text-[var(--muted)] mb-1">
                  <span>Confidence</span>
                  <span>{Math.round(pf.confidence * 100)}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-[var(--border)]">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pf.confidence * 100}%` }}
                    transition={{ delay: 0.3 + i * 0.1, duration: 0.6 }}
                    className="h-full rounded-full bg-[var(--danger)]"
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Reconstructed prompts — THE MONEY SHOT */}
      {l6.phantom_clusters.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-[var(--ink)] mb-3">
            Reconstructed AI Prompt Templates
          </h3>
          <p className="text-xs text-[var(--muted)] mb-3">
            These are the likely prompts used to mass-generate the fake reviews.
            This isn&apos;t just detection — it&apos;s forensics.
          </p>
          {l6.phantom_clusters.map((cluster, i) => (
            <motion.div
              key={cluster.cluster_id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.1 }}
              className="rounded-xl overflow-hidden border border-[var(--ink)]/20 mb-3"
            >
              <div className="bg-[var(--ink)] px-4 py-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  <span className="text-[10px] tracking-[0.2em] uppercase text-amber-300">
                    Reconstructed Prompt — Cluster {cluster.cluster_id + 1}
                  </span>
                </div>
                <span className="text-[10px] text-white/50">
                  {cluster.review_ids.length} reviews matched
                </span>
              </div>
              <div className="bg-[#0F172A] p-4 font-mono text-sm text-[#E2E8F0] leading-relaxed">
                &gt; {cluster.reconstructed_prompt}
              </div>
              <div className="bg-[var(--surface)] px-4 py-2 flex gap-4 text-[11px] text-[var(--muted)]">
                <span>Avg length: {cluster.avg_review_length} words</span>
                <span>·</span>
                <span>Avg stars: {cluster.avg_stars.toFixed(1)} ★</span>
                <span>·</span>
                <span>Phantom features: {cluster.phantom_features.slice(0, 3).map(f => f.replace(/_/g, " ")).join(", ")}</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Spec mismatches from L4 */}
      {result.layer_results.l4 && result.layer_results.l4.mismatches.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-[var(--ink)] mb-3">
            Spec-Claim Contradictions (L4)
          </h3>
          <div className="space-y-2">
            {result.layer_results.l4.mismatches.map((m, i) => (
              <motion.div
                key={`${m.review_id}-${m.claimed_feature}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                className="flex items-start gap-3 p-3 rounded-lg bg-red-50 border border-red-200"
              >
                <span className="text-[var(--danger)] font-bold mt-0.5">✕</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-[var(--ink)]">
                    Review <code className="font-mono text-[10px] bg-white px-1 rounded">{m.review_id}</code>
                    {" "}claims <strong>{m.claimed_feature.replace(/_/g, " ")}</strong>
                  </p>
                  <p className="text-[11px] text-red-700 mt-0.5">{m.spec_reality}</p>
                </div>
                <span className="text-[10px] text-[var(--danger)] shrink-0">
                  {Math.round(m.confidence * 100)}%
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
