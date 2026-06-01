"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

export default function CTASection() {
  return (
    <section className="relative py-32 px-6 overflow-hidden">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative rounded-[2.5rem] bg-[var(--surface-warm)] border border-[var(--gold-light)]/30 overflow-hidden"
        >
          {/* Decorative gradient */}
          <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full blur-3xl"
               style={{ background: "rgba(252, 211, 77, 0.4)" }} />
          <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full blur-3xl"
               style={{ background: "rgba(220, 38, 38, 0.15)" }} />

          <div className="relative p-12 md:p-20 text-center">
            <div className="text-xs tracking-[0.3em] uppercase text-[var(--gold)] mb-6">
              The internet has a quality problem
            </div>
            <h2 className="font-display text-5xl md:text-7xl leading-[0.95] tracking-tight max-w-3xl mx-auto text-balance">
              Stop guessing. <br />
              <em className="text-[var(--ink)]">Start parakh-ing.</em>
            </h2>
            <p className="mt-8 text-[var(--muted)] max-w-xl mx-auto leading-relaxed">
              Paste any Amazon URL. See the reviews behind the reviews.
              See if you&apos;re about to spend money on something real or something AI dreamed up.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
              <a
                href="#scan"
                className="group inline-flex items-center gap-2 px-7 h-13 rounded-full bg-[var(--ink)] text-white font-medium hover:bg-[var(--ink-soft)] transition-all"
              >
                <span>Try Parakh now</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              </a>
              <a
                href="https://github.com"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-7 h-13 rounded-full bg-white border border-[var(--border)] text-[var(--ink)] font-medium hover:border-[var(--ink)] transition-all"
              >
                <span>View source code</span>
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
