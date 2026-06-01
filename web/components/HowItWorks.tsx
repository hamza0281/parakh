"use client";

import { motion } from "framer-motion";
import { Link2, ScanLine, CheckCircle2 } from "lucide-react";

const STEPS = [
  {
    icon: Link2,
    n: "01",
    title: "Paste",
    desc: "Drop any Amazon product URL. No signup, no setup. Works on any product with reviews.",
  },
  {
    icon: ScanLine,
    n: "02",
    title: "Scan",
    desc: "Five detection layers run in parallel. Spec extraction, NLI contradiction, phantom features, prompt-template recovery.",
  },
  {
    icon: CheckCircle2,
    n: "03",
    title: "See truth",
    desc: "An adjusted score. Per-review reasoning. Reconstructed AI prompts. The reviews you can actually trust.",
  },
];

export default function HowItWorks() {
  return (
    <section id="how" className="relative py-32 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Section header */}
        <div className="flex items-end justify-between mb-16 flex-col md:flex-row gap-6">
          <div>
            <div className="text-xs tracking-[0.3em] uppercase text-[var(--muted)] mb-4">
              The Process
            </div>
            <h2 className="font-display text-5xl md:text-6xl leading-[0.95] tracking-tight max-w-2xl text-balance">
              Three steps. <br/>
              <span className="italic text-[var(--gold)]">Zero</span> friction.
            </h2>
          </div>
          <p className="text-[var(--muted)] max-w-sm leading-relaxed">
            Most slop detectors ask the wrong question. We ask the one that has an objective answer.
          </p>
        </div>

        {/* Steps */}
        <div className="grid md:grid-cols-3 gap-px rounded-2xl overflow-hidden bg-[var(--border)]">
          {STEPS.map((step, i) => (
            <motion.div
              key={step.n}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, delay: i * 0.15 }}
              className="group relative bg-white p-10 md:p-12 hover:bg-[var(--surface-warm)] transition-colors duration-500 spotlight"
              onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                e.currentTarget.style.setProperty("--mx", `${e.clientX - rect.left}px`);
                e.currentTarget.style.setProperty("--my", `${e.clientY - rect.top}px`);
              }}
            >
              {/* Number */}
              <div className="font-display text-7xl text-[var(--border)] group-hover:text-[var(--gold-light)] transition-colors mb-6">
                {step.n}
              </div>

              {/* Icon */}
              <div className="w-12 h-12 rounded-xl bg-[var(--ink)] text-white inline-flex items-center justify-center mb-5">
                <step.icon className="w-5 h-5" />
              </div>

              {/* Title */}
              <h3 className="font-display text-3xl text-[var(--ink)] mb-3">
                {step.title}
              </h3>

              {/* Desc */}
              <p className="text-[var(--muted)] leading-relaxed text-sm">
                {step.desc}
              </p>

              {/* Connector line on desktop */}
              {i < STEPS.length - 1 && (
                <div className="hidden md:block absolute top-1/2 -right-px w-px h-16 bg-[var(--border)] -translate-y-1/2" />
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
