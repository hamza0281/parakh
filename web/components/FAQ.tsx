"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Plus } from "lucide-react";
import { useState } from "react";

const FAQS = [
  {
    q: "How is this different from Fakespot or ReviewMeta?",
    a: "Those tools analyze how a review is written — vocabulary, length, sentence structure. Parakh checks what the review claims. If a review says a wired earbud has wireless charging, that's an objective contradiction. It doesn't matter how naturally it's written.",
  },
  {
    q: "Doesn't an AI just hallucinate? Why is that a strong signal?",
    a: "Real users don't invent features that don't exist. AI does, because it generates from category-typical patterns ('wireless earbuds usually have ANC') rather than the specific product's actual specs. That gap is rare in human reviews and common in AI ones.",
  },
  {
    q: "What's the false positive rate?",
    a: "On the Pangram-labeled dataset, 4%. Meaning if Parakh flags 100 reviews, 4 are wrongly flagged. We tune for high precision because flagging real customers as fake is worse than missing some fakes.",
  },
  {
    q: "Can sellers game it once they know how it works?",
    a: "L4 (spec-claim) is hard to game without writing reviews that don't talk about features at all — which makes them low-value reviews. L6 (phantom trace) requires unique prompts per product, which defeats the automation that makes review fraud cheap.",
  },
  {
    q: "Is the tool free? Does it sell my data?",
    a: "Free. No signup. No tracking. We hash the URLs we cache and don't log who submitted them. Source code is public on GitHub under MIT.",
  },
  {
    q: "Does it work on sites other than Amazon?",
    a: "v1 supports Amazon. The detection engine is marketplace-agnostic — extending to Flipkart, Etsy, Walmart is mostly scraping work. We'll add as we go.",
  },
];

export default function FAQ() {
  const [open, setOpen] = useState(0);

  return (
    <section id="faq" className="relative py-32 px-6">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-16">
          <div className="text-xs tracking-[0.3em] uppercase text-[var(--muted)] mb-4">
            Questions
          </div>
          <h2 className="font-display text-5xl md:text-6xl leading-[0.95] tracking-tight">
            Frequently <em className="text-[var(--gold)]">asked</em>.
          </h2>
        </div>

        <div className="space-y-2">
          {FAQS.map((f, i) => (
            <div
              key={i}
              className={`rounded-2xl border transition-all ${
                open === i
                  ? "bg-white border-[var(--ink)]/20 shadow-[0_8px_30px_rgba(0,0,0,0.04)]"
                  : "bg-white/40 border-[var(--border)] hover:bg-white"
              }`}
            >
              <button
                onClick={() => setOpen(open === i ? -1 : i)}
                className="w-full flex items-start justify-between gap-6 text-left p-6"
              >
                <span className="font-medium text-[var(--ink)] text-lg leading-snug">
                  {f.q}
                </span>
                <span
                  className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                    open === i
                      ? "bg-[var(--ink)] text-white rotate-45"
                      : "bg-[var(--surface)] text-[var(--ink)]"
                  }`}
                >
                  <Plus className="w-4 h-4" />
                </span>
              </button>

              <AnimatePresence initial={false}>
                {open === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 pb-6 text-[var(--muted)] leading-relaxed">{f.a}</div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
