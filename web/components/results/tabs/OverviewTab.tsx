"use client";

import { motion } from "framer-motion";
import type { AnalyzeResponse } from "@/lib/api";

interface Props { result: AnalyzeResponse; }

const LAYER_INFO = [
  { id: "l1", label: "L1 — Stylometric Clustering", desc: "Reviews from the same AI prompt template (structural similarity)", color: "var(--muted)" },
  { id: "l2", label: "L2 — Temporal Anomaly", desc: "Coordinated review burst campaigns (abnormal posting velocity)", color: "var(--muted)" },
  { id: "l3", label: "L3 — Reviewer History", desc: "Bot accounts detected via cross-product behavior analysis", color: "var(--muted)" },
  { id: "l4", label: "L4 — Spec-Claim Mismatch", desc: "Reviews claiming features the product doesn't have (killer signal)", color: "var(--danger)", killer: true },
  { id: "l6", label: "L6 — Phantom Feature Trace", desc: "AI prompt templates reverse-engineered from hallucinated features (novel signal)", color: "#B45309", killer: true },
];

export default function OverviewTab({ result }: Props) {
  const layers = result.layer_results;

  const layerData = [
    { ...LAYER_INFO[0], count: layers.l1?.flagged_review_ids.length ?? 0, detail: layers.l1 ? `${layers.l1.clusters.length} clusters detected` : "Not run" },
    { ...LAYER_INFO[1], count: layers.l2?.flagged_review_ids.length ?? 0, detail: layers.l2 ? `${layers.l2.bursts.length} burst events` : "Not run" },
    { ...LAYER_INFO[2], count: layers.l3?.flagged_review_ids.length ?? 0, detail: layers.l3 ? `${layers.l3.suspicious_reviewers.length} suspicious accounts` : "Not run" },
    { ...LAYER_INFO[3], count: layers.l4?.flagged_review_ids.length ?? 0, detail: layers.l4 ? `${layers.l4.mismatches.length} spec contradictions` : "Not run" },
    { ...LAYER_INFO[4], count: layers.l6?.flagged_review_ids.length ?? 0, detail: layers.l6 ? `${layers.l6.phantom_features.length} phantom features, ${layers.l6.phantom_clusters.length} clusters` : "Not run" },
  ];

  const totalFlagged = result.flagged_count;
  const pct = result.total_reviews > 0 ? Math.round((totalFlagged / result.total_reviews) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="p-5 rounded-2xl bg-white border border-[var(--border)]">
        <p className="text-sm text-[var(--muted)] leading-relaxed">
          Parakh analyzed <strong className="text-[var(--ink)]">{result.total_reviews}</strong> reviews across 5 detection layers.{" "}
          <strong className="text-[var(--danger)]">{totalFlagged} reviews ({pct}%)</strong> were flagged as likely AI-generated.
          The adjusted score is based on the remaining{" "}
          <strong className="text-[var(--ink)]">{result.verified_count}</strong> verified reviews.
        </p>
        {result.layer_results.l4?.spec_sheet && (
          <div className="mt-3 pt-3 border-t border-[var(--border-soft)]">
            <p className="text-[10px] tracking-[0.2em] uppercase text-[var(--muted)] mb-1.5">Product spec detected</p>
            <div className="flex flex-wrap gap-1.5">
              {result.layer_results.l4.spec_sheet.features_present.slice(0, 6).map((f) => (
                <span key={f} className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[11px] border border-emerald-200">
                  ✓ {f}
                </span>
              ))}
              {result.layer_results.l4.spec_sheet.features_absent.slice(0, 4).map((f) => (
                <span key={f} className="px-2 py-0.5 rounded-md bg-red-50 text-red-700 text-[11px] border border-red-200">
                  ✕ {f}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Layer breakdown */}
      <div className="space-y-2">
        {layerData.map((layer, i) => (
          <motion.div
            key={layer.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08 }}
            className={`flex items-center gap-4 p-4 rounded-xl border ${
              layer.killer
                ? "bg-amber-50 border-amber-200"
                : "bg-white border-[var(--border-soft)]"
            }`}
          >
            <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: layer.killer ? "rgba(180, 83, 9, 0.1)" : "var(--surface)" }}>
              <span className="font-mono text-xs font-bold" style={{ color: layer.color }}>
                {layer.id.toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-[var(--ink)]">{layer.label}</p>
                {layer.killer && <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 font-medium">KILLER</span>}
              </div>
              <p className="text-xs text-[var(--muted)] mt-0.5">{layer.desc}</p>
              <p className="text-[11px] text-[var(--muted-soft)] mt-0.5">{layer.detail}</p>
            </div>
            <div className="text-right shrink-0">
              <div className={`text-2xl font-display ${layer.count > 0 ? "text-[var(--danger)]" : "text-[var(--muted)]"}`}>
                {layer.count}
              </div>
              <div className="text-[10px] text-[var(--muted)]">flagged</div>
            </div>
          </motion.div>
        ))}
      </div>

      <p className="text-xs text-[var(--muted)] text-center">
        Layers may overlap — total unique flagged: {result.flagged_count}
      </p>
    </div>
  );
}
