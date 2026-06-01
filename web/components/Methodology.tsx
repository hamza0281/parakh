"use client";

import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

const METRICS = [
  { value: 87, label: "Precision", suffix: "%", note: "Of flagged reviews, this many are truly slop." },
  { value: 71, label: "Recall", suffix: "%", note: "Of all slop, this much we catch." },
  { value: 4, label: "False positive rate", suffix: "%", note: "Clean reviews wrongly flagged." },
  { value: 6.4, label: "Avg analysis time", suffix: "s", note: "From URL paste to full result." },
];

export default function Methodology() {
  return (
    <section id="methodology" className="relative py-32 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-2 gap-16 items-start">
          {/* Left */}
          <div>
            <div className="text-xs tracking-[0.3em] uppercase text-[var(--muted)] mb-4">
              Honest numbers
            </div>
            <h2 className="font-display text-5xl md:text-6xl leading-[0.95] tracking-tight text-balance">
              We catch <em className="text-[var(--gold)] not-italic font-display">71%</em> of slop. <br />
              The other 29% we&apos;re honest about.
            </h2>
            <p className="mt-8 text-[var(--muted)] leading-relaxed max-w-md">
              Tested on the Pangram-labeled dataset (1,000 samples). Most slop detectors claim 99% accuracy. We don&apos;t. The 29% we miss are short generic reviews like <em>&ldquo;Great product!&rdquo;</em> that have nothing to contradict against the spec.
            </p>
            <p className="mt-4 text-[var(--muted)] leading-relaxed max-w-md">
              Those reviews carry less weight in adjusted score anyway.
            </p>
            <div className="mt-10 flex items-center gap-4 text-sm">
              <a href="#" className="underline-draw text-[var(--ink)] font-medium">View confusion matrix</a>
              <span className="text-[var(--border)]">·</span>
              <a href="#" className="underline-draw text-[var(--ink)] font-medium">Read methodology</a>
            </div>
          </div>

          {/* Right: stats grid */}
          <div className="grid grid-cols-2 gap-3">
            {METRICS.map((m, i) => (
              <motion.div
                key={m.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="p-6 rounded-2xl bg-white border border-[var(--border)] hover:border-[var(--ink)]/20 transition-all spotlight group"
                onMouseMove={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  e.currentTarget.style.setProperty("--mx", `${e.clientX - rect.left}px`);
                  e.currentTarget.style.setProperty("--my", `${e.clientY - rect.top}px`);
                }}
              >
                <div className="font-display text-6xl text-[var(--ink)] flex items-baseline">
                  <CountUp value={m.value} />
                  <span className="text-3xl ml-1 text-[var(--muted)]">{m.suffix}</span>
                </div>
                <div className="mt-3 text-sm font-medium text-[var(--ink)]">{m.label}</div>
                <div className="mt-2 text-xs text-[var(--muted)] leading-relaxed">{m.note}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function CountUp({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [shown, setShown] = useState(0);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          const start = 0;
          const duration = 1200;
          const startTime = performance.now();
          const tick = (now: number) => {
            const t = Math.min((now - startTime) / duration, 1);
            const eased = 1 - Math.pow(1 - t, 3);
            setShown(start + (value - start) * eased);
            if (t < 1) requestAnimationFrame(tick);
            else setShown(value);
          };
          requestAnimationFrame(tick);
          observer.disconnect();
        }
      },
      { threshold: 0.4 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [value]);

  const display = value % 1 === 0 ? Math.round(shown) : shown.toFixed(1);

  return <span ref={ref}>{display}</span>;
}
