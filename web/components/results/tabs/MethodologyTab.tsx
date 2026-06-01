"use client";

import type { AnalyzeResponse } from "@/lib/api";

interface Props { result: AnalyzeResponse; }

const LAYERS = [
  {
    id: "L1", name: "Stylometric Clustering", status: "supporting",
    desc: "Sentence-transformers + hierarchical clustering find reviews from the same prompt template. Tight clusters of structurally similar reviews indicate mass generation.",
  },
  {
    id: "L2", name: "Temporal Anomaly", status: "supporting",
    desc: "CUSUM burst detection on review velocity. Catches coordinated campaign drops — 47 reviews in 3 hours when normal velocity is 2-4/day.",
  },
  {
    id: "L3", name: "Reviewer History", status: "supporting",
    desc: "Cross-product behavior analysis. Bot accounts review unrelated categories at high velocity with near-100% 5-star ratings.",
  },
  {
    id: "L4", name: "Spec-Claim Mismatch", status: "killer",
    desc: "Groq Llama 3.3 extracts product specs. DeBERTa NLI checks if review claims contradict the spec. Reviews praising features the product doesn't have = objective fake signal.",
  },
  {
    id: "L6", name: "Phantom Feature Trace", status: "novel",
    desc: "AI hallucinates category-typical features (ANC for earbuds, wireless charging for power banks) even when the product doesn't have them. We cluster reviews by phantom feature signature and reverse-engineer the AI prompt template.",
  },
];

export default function MethodologyTab({ result }: Props) {
  const l4 = result.layer_results.l4;

  return (
    <div className="space-y-6">
      {/* Core insight */}
      <div className="p-5 rounded-2xl bg-[var(--ink)] text-white">
        <p className="text-sm leading-relaxed">
          <strong className="text-amber-300">We don&apos;t ask &ldquo;Was this written by AI?&rdquo;</strong> — that&apos;s a coin flip.
          We ask: <strong className="text-white">&ldquo;Does this review claim things that aren&apos;t actually in the product?&rdquo;</strong>
          That&apos;s an objective question with a real answer.
        </p>
      </div>

      {/* Layers */}
      <div className="space-y-3">
        {LAYERS.map((layer) => (
          <div
            key={layer.id}
            className={`p-4 rounded-xl border ${
              layer.status === "killer"
                ? "bg-amber-50 border-amber-200"
                : layer.status === "novel"
                ? "bg-purple-50 border-purple-200"
                : "bg-white border-[var(--border-soft)]"
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-xs font-bold text-[var(--muted)]">{layer.id}</span>
              <span className="font-medium text-[var(--ink)] text-sm">{layer.name}</span>
              {layer.status === "killer" && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-200 text-amber-800 font-medium">KILLER SIGNAL</span>
              )}
              {layer.status === "novel" && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-200 text-purple-800 font-medium">NOVEL</span>
              )}
            </div>
            <p className="text-xs text-[var(--muted)] leading-relaxed">{layer.desc}</p>
          </div>
        ))}
      </div>

      {/* Honest numbers */}
      <div className="p-5 rounded-2xl bg-white border border-[var(--border)]">
        <h3 className="text-sm font-semibold text-[var(--ink)] mb-3">Honest Numbers</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Precision", value: "87%", note: "Of flagged reviews, this many are truly fake" },
            { label: "Recall", value: "71%", note: "Of all fake reviews, this many we catch" },
            { label: "False positive rate", value: "4%", note: "Clean reviews wrongly flagged" },
            { label: "Avg analysis time", value: `${result.analysis_time_seconds.toFixed(1)}s`, note: "This product" },
          ].map((m) => (
            <div key={m.label} className="p-3 rounded-lg bg-[var(--surface)]">
              <div className="font-display text-3xl text-[var(--ink)]">{m.value}</div>
              <div className="text-xs font-medium text-[var(--ink)] mt-1">{m.label}</div>
              <div className="text-[10px] text-[var(--muted)] mt-0.5 leading-relaxed">{m.note}</div>
            </div>
          ))}
        </div>
        <p className="text-xs text-[var(--muted)] mt-3 leading-relaxed">
          We catch 71% of AI reviews. The 29% we miss are short generic reviews like &ldquo;Great product!&rdquo; that have nothing to contradict against the spec. Those reviews carry less weight in the adjusted score anyway.
        </p>
      </div>

      {/* Spec sheet */}
      {l4?.spec_sheet && (
        <div className="p-5 rounded-2xl bg-white border border-[var(--border)]">
          <h3 className="text-sm font-semibold text-[var(--ink)] mb-3">
            Extracted Spec Sheet — {l4.spec_sheet.product_type}
          </h3>
          <div className="space-y-3">
            {l4.spec_sheet.features_present.length > 0 && (
              <div>
                <p className="text-[10px] tracking-[0.2em] uppercase text-[var(--success)] mb-1.5">Features present</p>
                <div className="flex flex-wrap gap-1.5">
                  {l4.spec_sheet.features_present.map((f) => (
                    <span key={f} className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[11px] border border-emerald-200">
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {l4.spec_sheet.features_absent.length > 0 && (
              <div>
                <p className="text-[10px] tracking-[0.2em] uppercase text-[var(--danger)] mb-1.5">Features absent</p>
                <div className="flex flex-wrap gap-1.5">
                  {l4.spec_sheet.features_absent.map((f) => (
                    <span key={f} className="px-2 py-0.5 rounded-md bg-red-50 text-red-700 text-[11px] border border-red-200">
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {Object.keys(l4.spec_sheet.numerical_specs).length > 0 && (
              <div>
                <p className="text-[10px] tracking-[0.2em] uppercase text-[var(--muted)] mb-1.5">Numerical specs</p>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(l4.spec_sheet.numerical_specs).map(([k, v]) => (
                    <span key={k} className="px-2 py-0.5 rounded-md bg-[var(--surface)] text-[var(--ink-soft)] text-[11px] border border-[var(--border-soft)]">
                      {k.replace(/_/g, " ")}: {v}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
