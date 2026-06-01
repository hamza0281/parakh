"use client";

import { motion } from "framer-motion";
import { Check, X } from "lucide-react";

const FEATURES = [
  { feature: "Detects AI text patterns", others: true, parakh: true },
  { feature: "Temporal burst detection", others: false, parakh: true },
  { feature: "Reviewer history analysis", others: "partial", parakh: true },
  { feature: "Spec-claim verification", others: false, parakh: true, killer: true },
  { feature: "Phantom feature trace", others: false, parakh: true, killer: true },
  { feature: "Reverse-engineers AI prompts", others: false, parakh: true, killer: true },
  { feature: "Honest accuracy numbers", others: false, parakh: true },
  { feature: "Open source", others: false, parakh: true },
];

export default function Comparison() {
  return (
    <section className="relative py-32 px-6 bg-[var(--ink)] text-white overflow-hidden">
      {/* Subtle grid */}
      <div className="absolute inset-0 opacity-[0.04]">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="darkgrid" width="56" height="56" patternUnits="userSpaceOnUse">
              <path d="M 56 0 L 0 0 0 56" fill="none" stroke="white" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#darkgrid)" />
        </svg>
      </div>

      {/* Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[120px]"
           style={{ background: "rgba(220, 38, 38, 0.15)" }} />

      <div className="relative max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="text-xs tracking-[0.3em] uppercase text-white/50 mb-4">
            What others miss
          </div>
          <h2 className="font-display text-5xl md:text-7xl leading-[0.95] tracking-tight text-balance">
            Fakespot does <em className="text-[var(--gold-light)]">style</em>. <br />
            Parakh does <em className="text-[var(--danger)]">substance</em>.
          </h2>
          <p className="mt-6 text-white/60 max-w-xl mx-auto leading-relaxed">
            Most fake-review tools check how something is written. We check what it claims.
            That&apos;s a different question with an objective answer.
          </p>
        </div>

        {/* Comparison table */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="rounded-3xl bg-white/[0.04] border border-white/10 backdrop-blur-sm overflow-hidden"
        >
          {/* Header row */}
          <div className="grid grid-cols-[1.5fr_1fr_1fr] border-b border-white/10">
            <div className="p-5 text-xs tracking-[0.2em] uppercase text-white/50">Feature</div>
            <div className="p-5 text-center text-sm text-white/60">
              <span className="font-display text-lg italic">Fakespot, GPTZero, et al.</span>
            </div>
            <div className="p-5 text-center text-sm bg-white/[0.04] relative">
              <span className="font-display text-lg italic text-[var(--gold-light)]">Parakh</span>
            </div>
          </div>

          {/* Feature rows */}
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.feature}
              initial={{ opacity: 0, x: -10 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className={`grid grid-cols-[1.5fr_1fr_1fr] border-b border-white/5 last:border-b-0 ${f.killer ? "bg-[var(--gold)]/5" : ""}`}
            >
              <div className="p-5 text-sm flex items-center gap-2">
                {f.killer && <span className="text-[var(--gold-light)]">★</span>}
                <span className={f.killer ? "text-[var(--gold-light)]" : "text-white/90"}>{f.feature}</span>
              </div>
              <div className="p-5 flex justify-center items-center">
                {f.others === true && <Check className="w-5 h-5 text-white/40" />}
                {f.others === false && <X className="w-5 h-5 text-white/20" />}
                {f.others === "partial" && <span className="text-xs text-white/40">Partial</span>}
              </div>
              <div className="p-5 flex justify-center items-center bg-white/[0.04]">
                {f.parakh ? (
                  <Check className={`w-5 h-5 ${f.killer ? "text-[var(--gold-light)]" : "text-white"}`} />
                ) : (
                  <X className="w-5 h-5 text-white/30" />
                )}
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Footnote */}
        <p className="mt-8 text-center text-xs text-white/40">
          Parakh is the first review-detection tool that reads the spec sheet.
        </p>
      </div>
    </section>
  );
}
