"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { Layers, Clock, Users, Crosshair, Ghost, Star } from "lucide-react";

type LayerExample =
  | { kind: "reviews"; label: string; reviews: string[] }
  | { kind: "chart"; label: string }
  | { kind: "reviewer"; label: string; reviewer: { reviews: number; days: number; categories: string[]; five_star_pct: number } }
  | { kind: "mismatch"; label: string; mismatch: { spec: string; claim: string; flags: string[] } }
  | { kind: "prompt"; label: string; prompt: string; matches: number };

type LayerDef = {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  strength: string;
  color: string;
  killer?: boolean;
  desc: string;
  example: LayerExample;
};

const LAYERS: LayerDef[] = [
  {
    id: "L1",
    name: "Stylometric Clustering",
    icon: Layers,
    strength: "Supporting",
    color: "var(--muted)",
    desc: "Sentence-transformers + hierarchical clustering find reviews from the same prompt template.",
    example: {
      kind: "reviews",
      label: "Cluster of 47 reviews · 91% structural similarity",
      reviews: [
        '"I love these earbuds! Battery lasts very long and sound quality is amazing."',
        '"Love this item! Battery is fantastic and sound quality is incredible."',
        '"Great earbuds! Battery is excellent and sound quality is superb."',
      ],
    },
  },
  {
    id: "L2",
    name: "Temporal Anomaly",
    icon: Clock,
    strength: "Supporting",
    color: "var(--muted)",
    desc: "CUSUM burst detection on review velocity catches coordinated campaign drops.",
    example: {
      kind: "chart",
      label: "47 reviews in 3 hours (normal: 2-4/day)",
    },
  },
  {
    id: "L3",
    name: "Reviewer History",
    icon: Users,
    strength: "Supporting",
    color: "var(--muted)",
    desc: "Cross-product behavior analysis exposes bot accounts.",
    example: {
      kind: "reviewer",
      label: "JohnSmith2847 · Bot score 0.91",
      reviewer: {
        reviews: 30,
        days: 14,
        categories: ["earbuds", "knives", "baby formula", "drone"],
        five_star_pct: 93,
      },
    },
  },
  {
    id: "L4",
    name: "Spec-Claim Mismatch",
    icon: Crosshair,
    strength: "Killer Signal",
    color: "var(--danger)",
    killer: true,
    desc: "Groq Llama 3.3 extracts spec sheet. DeBERTa NLI checks if review claims contradict reality.",
    example: {
      kind: "mismatch",
      label: "Review claims feature that doesn't exist",
      mismatch: {
        spec: "Bluetooth 5.3 · Passive isolation · 6h battery · USB-C",
        claim: "These have the BEST Active Noise Cancellation. Wireless charging is so convenient. 30-hour battery is unbelievable.",
        flags: [
          "ANC claimed → spec says passive only",
          "Wireless charging claimed → USB-C only",
          "30h battery claimed → spec says 6h",
        ],
      },
    },
  },
  {
    id: "L6",
    name: "Phantom Feature Trace",
    icon: Ghost,
    strength: "Genuinely Novel",
    color: "var(--gold)",
    killer: true,
    desc: "We don't just detect AI reviews. We reverse-engineer the prompt that generated them.",
    example: {
      kind: "prompt",
      label: "Reconstructed AI prompt",
      prompt: "Write a 5-star review of premium earbuds mentioning ANC, wireless charging case, and premium build. Casual tone, 70-80 words, end with recommendation.",
      matches: 89,
    },
  },
];

export default function EngineShowcase() {
  const [active, setActive] = useState("L4");
  const layer = LAYERS.find((l) => l.id === active)!;

  return (
    <section id="engine" className="relative py-32 px-6 bg-[var(--surface)] border-y border-[var(--border)]">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="text-xs tracking-[0.3em] uppercase text-[var(--muted)] mb-4">
            The Engine
          </div>
          <h2 className="font-display text-5xl md:text-6xl leading-[0.95] tracking-tight max-w-3xl mx-auto text-balance">
            Five layers. <span className="italic text-[var(--gold)]">Two killers.</span>
          </h2>
          <p className="mt-6 text-[var(--muted)] max-w-2xl mx-auto leading-relaxed">
            Three layers we share with the industry. Two that nobody else is doing.
            Together they form an undeniable signal.
          </p>
        </div>

        {/* Layer tabs */}
        <div className="grid grid-cols-5 gap-2 mb-8 max-w-3xl mx-auto">
          {LAYERS.map((l) => (
            <button
              key={l.id}
              onClick={() => setActive(l.id)}
              className={`group relative p-4 rounded-xl border-2 transition-all text-left ${
                active === l.id
                  ? l.killer
                    ? "border-[var(--gold)] bg-white"
                    : "border-[var(--ink)] bg-white"
                  : "border-transparent bg-white/40 hover:bg-white/70"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <l.icon className={`w-4 h-4 ${active === l.id ? "" : "text-[var(--muted)]"}`} />
                {l.killer && (
                  <Star
                    className={`w-3 h-3 ${active === l.id ? "fill-[var(--gold)] text-[var(--gold)]" : "text-[var(--muted-soft)]"}`}
                  />
                )}
              </div>
              <div className="font-mono text-[10px] text-[var(--muted)]">{l.id}</div>
              <div className="text-xs font-medium text-[var(--ink)] truncate mt-0.5">
                {l.name.split(" ")[0]}
              </div>
            </button>
          ))}
        </div>

        {/* Active layer detail */}
        <motion.div
          key={active}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className={`rounded-3xl bg-white border border-[var(--border)] overflow-hidden shadow-[0_30px_60px_-20px_rgba(0,0,0,0.08)]`}
        >
          <div className="grid md:grid-cols-5">
            {/* Left: layer info */}
            <div className="md:col-span-2 p-10 md:p-12 border-b md:border-b-0 md:border-r border-[var(--border-soft)]">
              <div className="flex items-center gap-3 mb-6">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    layer.killer ? "bg-[var(--surface-warm)]" : "bg-[var(--surface)]"
                  }`}
                  style={{ color: layer.color }}
                >
                  <layer.icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-mono text-xs text-[var(--muted)]">{layer.id}</div>
                  <div className="text-[10px] tracking-[0.2em] uppercase" style={{ color: layer.color }}>
                    {layer.strength}
                  </div>
                </div>
              </div>

              <h3 className="font-display text-4xl text-[var(--ink)] mb-4 leading-tight">
                {layer.name}
              </h3>
              <p className="text-[var(--muted)] leading-relaxed">{layer.desc}</p>
            </div>

            {/* Right: example viz */}
            <div className="md:col-span-3 p-10 md:p-12 bg-[var(--surface)]">
              <div className="text-[10px] tracking-[0.2em] uppercase text-[var(--muted)] mb-4">
                Example detection
              </div>
              <div className="text-sm font-medium text-[var(--ink)] mb-6">{layer.example.label}</div>

              {/* L1 — clustered reviews */}
              {layer.example.kind === "reviews" && (
                <div className="space-y-2.5">
                  {layer.example.reviews.map((r, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="p-3 rounded-lg bg-white border-l-2 border-[var(--muted)] text-xs text-[var(--ink-soft)] italic"
                    >
                      {r}
                    </motion.div>
                  ))}
                </div>
              )}

              {/* L2 — burst chart */}
              {layer.example.kind === "chart" && <BurstChart />}

              {/* L3 — reviewer */}
              {layer.example.kind === "reviewer" && (
                <div className="grid grid-cols-2 gap-3">
                  <Stat label="Reviews / days" value={`${layer.example.reviewer.reviews} / ${layer.example.reviewer.days}`} />
                  <Stat label="5-star ratio" value={`${layer.example.reviewer.five_star_pct}%`} accent />
                  <div className="col-span-2 p-3 rounded-lg bg-white border border-[var(--border-soft)]">
                    <div className="text-[10px] tracking-[0.15em] uppercase text-[var(--muted)] mb-2">Categories</div>
                    <div className="flex flex-wrap gap-1.5">
                      {layer.example.reviewer.categories.map((c) => (
                        <span key={c} className="px-2 py-0.5 rounded-md bg-[var(--surface)] text-xs text-[var(--ink-soft)]">
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* L4 — mismatch */}
              {layer.example.kind === "mismatch" && (
                <div className="space-y-3">
                  <div className="p-4 rounded-lg bg-white border border-[var(--border-soft)]">
                    <div className="text-[10px] tracking-[0.15em] uppercase text-[var(--success)] mb-2">Spec sheet says</div>
                    <div className="text-xs font-mono text-[var(--ink-soft)]">{layer.example.mismatch.spec}</div>
                  </div>
                  <div className="p-4 rounded-lg bg-[var(--danger-soft)] border border-[var(--danger)]/20">
                    <div className="text-[10px] tracking-[0.15em] uppercase text-[var(--danger)] mb-2">Review claims</div>
                    <div className="text-xs italic text-[var(--ink-soft)]">&ldquo;{layer.example.mismatch.claim}&rdquo;</div>
                  </div>
                  <div className="space-y-1.5">
                    {layer.example.mismatch.flags.map((f, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 + i * 0.1 }}
                        className="flex items-start gap-2 text-xs text-[var(--danger)]"
                      >
                        <span className="mt-0.5">✕</span>
                        <span>{f}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* L6 — reconstructed prompt */}
              {layer.example.kind === "prompt" && (
                <div>
                  <div className="p-5 rounded-xl bg-[var(--ink)] text-white font-mono text-xs leading-relaxed border border-[var(--gold)]/30">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--gold-light)]" />
                      <span className="text-[10px] tracking-[0.2em] uppercase text-[var(--gold-light)]">Reconstructed prompt</span>
                    </div>
                    &gt; {layer.example.prompt}
                  </div>
                  <div className="mt-3 text-xs text-[var(--muted)]">
                    <span className="font-mono text-[var(--gold)]">{layer.example.matches}</span> reviews match this signature. This isn&apos;t fake — it&apos;s mass-produced.
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="p-4 rounded-lg bg-white border border-[var(--border-soft)]">
      <div className="text-[10px] tracking-[0.15em] uppercase text-[var(--muted)] mb-1">{label}</div>
      <div className={`font-display text-2xl ${accent ? "text-[var(--danger)]" : "text-[var(--ink)]"}`}>{value}</div>
    </div>
  );
}

function BurstChart() {
  const bars = [3, 4, 2, 3, 5, 4, 3, 47, 6, 4, 3, 5, 2, 4];
  const max = Math.max(...bars);
  return (
    <div className="p-5 rounded-xl bg-white border border-[var(--border-soft)]">
      <div className="flex items-end gap-1.5 h-32">
        {bars.map((b, i) => {
          const h = (b / max) * 100;
          const burst = b > 20;
          return (
            <motion.div
              key={i}
              initial={{ height: 0 }}
              animate={{ height: `${h}%` }}
              transition={{ delay: i * 0.04, duration: 0.6 }}
              className={`flex-1 rounded-t-sm ${burst ? "bg-[var(--danger)]" : "bg-[var(--border)]"}`}
              style={{ minHeight: 4 }}
            />
          );
        })}
      </div>
      <div className="mt-3 flex items-center justify-between text-[10px] text-[var(--muted)]">
        <span>Nov 15</span>
        <span className="text-[var(--danger)] font-medium">↑ 47 reviews / 3hr burst</span>
        <span>Nov 28</span>
      </div>
    </div>
  );
}
