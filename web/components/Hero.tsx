"use client";

import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Star } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Hero() {
  const [url, setUrl] = useState("");
  const [focused, setFocused] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ kind: "ok" | "err"; msg: string } | null>(null);
  const router = useRouter();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = url.trim();
    if (!trimmed) {
      setFeedback({ kind: "err", msg: "Please paste an Amazon product URL." });
      return;
    }
    if (!trimmed.toLowerCase().includes("amazon.")) {
      setFeedback({ kind: "err", msg: "URL must be from amazon.com, amazon.in, etc." });
      return;
    }
    setSubmitting(true);
    setFeedback(null);
    // Navigate to results page — analysis happens there
    const encoded = encodeURIComponent(trimmed);
    router.push(`/scan?url=${encoded}`);
  }

  return (
    <section
      id="scan"
      className="relative pt-16 pb-32 px-6 overflow-hidden"
    >
      <div className="max-w-6xl mx-auto">
        {/* Eyebrow */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex justify-center mb-8"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-[var(--border)] text-xs">
            <span className="relative flex w-1.5 h-1.5">
              <span className="absolute inline-flex w-full h-full rounded-full bg-[var(--danger)] opacity-50 animate-ping" />
              <span className="relative inline-flex w-1.5 h-1.5 rounded-full bg-[var(--danger)]" />
            </span>
            <span className="text-[var(--ink-soft)] tracking-wide">
              <span className="text-[var(--danger)] font-semibold">3%</span> of Amazon front-page reviews are AI-generated
            </span>
          </div>
        </motion.div>

        {/* Main heading */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="font-display text-center text-[clamp(3rem,9vw,7.5rem)] leading-[0.95] tracking-tight text-balance"
        >
          <span className="block text-[var(--ink)]">Reviews ki</span>
          <span className="relative inline-block">
            <span className="relative z-10 italic font-display text-[var(--gold)]">
              Parakh
            </span>
            <UnderlineSwoosh />
          </span>
          <span className="block text-[var(--ink-soft)] mt-2">
            Khara <span className="text-[var(--muted)]">ya</span>{" "}
            <span className="text-[var(--danger)] italic">Khota?</span>
          </span>
        </motion.h1>

        {/* Subhead */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-10 text-center text-lg md:text-xl text-[var(--muted)] max-w-2xl mx-auto leading-relaxed text-balance"
        >
          We don&apos;t ask <em className="text-[var(--ink-soft)]">&ldquo;was this written by AI?&rdquo;</em> &mdash; that&apos;s a coin flip. <br className="hidden md:block" />
          We ask <strong className="text-[var(--ink)] font-semibold">&ldquo;does this review claim things that don&apos;t exist?&rdquo;</strong>
        </motion.p>

        {/* URL input */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-14 max-w-2xl mx-auto"
        >
          <form
            onSubmit={onSubmit}
            className={`relative flex items-center gap-2 p-2 pl-5 rounded-2xl bg-white border-2 transition-all duration-300 ${
              focused
                ? "border-[var(--ink)] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)]"
                : "border-[var(--border)] shadow-[0_8px_30px_rgba(0,0,0,0.04)]"
            }`}
          >
            <Sparkles className="w-4 h-4 text-[var(--muted)] flex-shrink-0" />
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder="Paste any Amazon product URL..."
              className="flex-1 py-3 bg-transparent text-[var(--ink)] placeholder:text-[var(--muted-soft)] focus:outline-none text-base"
              disabled={submitting}
            />
            <button
              type="submit"
              disabled={submitting}
              className="group inline-flex items-center gap-1.5 px-5 h-11 rounded-xl bg-[var(--ink)] text-white text-sm font-medium hover:bg-[var(--ink-soft)] transition-all shrink-0 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <span>{submitting ? "Checking…" : "Parakh karo"}</span>
              {!submitting && (
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              )}
            </button>
          </form>

          {feedback && (
            <div
              className={`mt-3 px-4 py-2 rounded-lg text-xs ${
                feedback.kind === "ok"
                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                  : "bg-red-50 text-red-800 border border-red-200"
              }`}
            >
              {feedback.msg}
            </div>
          )}

          {/* Demo buttons */}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-sm">
            <span className="text-[var(--muted)] mr-1">Or try a demo:</span>
            {[
              { label: "Earbuds", id: "zen-sound-pro" },
              { label: "Power Bank", id: "power-max" },
            ].map((d) => (
              <button
                key={d.id}
                onClick={() => router.push(`/scan?demo=${d.id}`)}
                className="group px-3.5 py-1.5 rounded-full bg-white border border-[var(--border)] text-[var(--ink-soft)] hover:border-[var(--ink)] hover:text-[var(--ink)] transition-all text-xs"
              >
                {d.label}
                <span className="ml-1 text-[var(--muted-soft)] group-hover:text-[var(--ink)] transition-colors">→</span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* The big visual: Score Flip Card */}
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.7 }}
          className="mt-24 relative"
        >
          <ScorePreview />
        </motion.div>

        {/* Trust strip */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1 }}
          className="mt-16 flex flex-col md:flex-row items-center justify-center gap-3 md:gap-8 text-xs text-[var(--muted)]"
        >
          <span className="inline-flex items-center gap-2">
            <span className="w-1 h-1 rounded-full bg-[var(--success)]" />
            No signup required
          </span>
          <span className="hidden md:inline w-px h-3 bg-[var(--border)]" />
          <span className="inline-flex items-center gap-2">
            <span className="w-1 h-1 rounded-full bg-[var(--success)]" />
            No tracking, no cookies
          </span>
          <span className="hidden md:inline w-px h-3 bg-[var(--border)]" />
          <span className="inline-flex items-center gap-2">
            <span className="w-1 h-1 rounded-full bg-[var(--success)]" />
            MIT licensed, source on GitHub
          </span>
        </motion.div>
      </div>
    </section>
  );
}

function UnderlineSwoosh() {
  return (
    <svg
      className="absolute -bottom-2 left-0 w-full"
      height="20"
      viewBox="0 0 300 20"
      fill="none"
      preserveAspectRatio="none"
    >
      <motion.path
        d="M2 14 Q75 2, 150 10 T298 6"
        stroke="rgba(220, 38, 38, 0.6)"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.4, delay: 0.6, ease: "easeOut" }}
      />
    </svg>
  );
}

function ScorePreview() {
  return (
    <div className="relative max-w-4xl mx-auto">
      {/* Floating browser chrome */}
      <div className="rounded-2xl bg-white border border-[var(--border)] overflow-hidden shadow-[0_30px_60px_-20px_rgba(0,0,0,0.15)]">
        {/* Browser bar */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border-soft)] bg-[var(--surface)]">
          <div className="flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--border)]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--border)]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--border)]" />
          </div>
          <div className="flex-1 px-3 py-1.5 rounded-md bg-[var(--bg-elevated)] text-xs text-[var(--muted)] font-mono">
            parakh.app/scan/zen-sound-pro
          </div>
        </div>

        {/* Card content */}
        <div className="p-8 md:p-12">
          <div className="flex items-start justify-between mb-8">
            <div>
              <div className="text-sm text-[var(--muted)] mb-1">ZenSound Pro Wireless Earbuds</div>
              <div className="text-xs text-[var(--muted-soft)]">$89 · 2,341 reviews · Analyzed in 6.4s</div>
            </div>
            <div className="px-2.5 py-1 rounded-full bg-[var(--danger-soft)] text-[var(--danger)] text-[10px] font-semibold tracking-wider uppercase">
              612 Flagged
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 md:gap-8">
            {/* Original */}
            <div className="relative p-6 md:p-8 rounded-xl bg-[var(--surface)] border border-[var(--border-soft)]">
              <div className="text-[10px] tracking-[0.2em] uppercase text-[var(--muted)] mb-2">Original</div>
              <div className="flex items-baseline gap-2">
                <span className="font-display text-6xl md:text-7xl line-through decoration-[var(--muted-soft)] decoration-[3px] text-[var(--muted)]">
                  4.6
                </span>
                <Star className="w-5 h-5 fill-[var(--muted-soft)] text-[var(--muted-soft)]" />
              </div>
              <div className="mt-2 text-xs text-[var(--muted)]">Per Amazon</div>
            </div>

            {/* Adjusted */}
            <div className="relative p-6 md:p-8 rounded-xl bg-[var(--ink)] text-white overflow-hidden">
              <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-[var(--danger)] opacity-20 blur-2xl" />
              <div className="relative">
                <div className="text-[10px] tracking-[0.2em] uppercase text-white/60 mb-2">Adjusted by Parakh</div>
                <div className="flex items-baseline gap-2">
                  <motion.span
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 1.2, duration: 0.6, type: "spring" }}
                    className="font-display text-6xl md:text-7xl"
                  >
                    3.1
                  </motion.span>
                  <Star className="w-5 h-5 fill-[var(--gold-light)] text-[var(--gold-light)]" />
                </div>
                <div className="mt-2 text-xs text-white/60">From 1,729 verified reviews</div>
              </div>
            </div>
          </div>

          {/* Mini layer breakdown */}
          <div className="mt-6 grid grid-cols-2 md:grid-cols-5 gap-2">
            {[
              { l: "L1", v: 89, name: "Stylometric" },
              { l: "L2", v: 124, name: "Temporal" },
              { l: "L3", v: 203, name: "Reviewers" },
              { l: "L4", v: 187, name: "Spec-Claim", killer: true },
              { l: "L6", v: 89, name: "Phantom", killer: true },
            ].map((layer, i) => (
              <motion.div
                key={layer.l}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.3 + i * 0.08 }}
                className={`p-3 rounded-lg border ${
                  layer.killer
                    ? "bg-[var(--surface-warm)] border-[var(--gold-light)]"
                    : "bg-[var(--bg)] border-[var(--border-soft)]"
                }`}
              >
                <div className="flex items-center justify-between text-[10px] text-[var(--muted)] mb-1">
                  <span className="font-mono">{layer.l}</span>
                  {layer.killer && <span className="text-[var(--gold)]">★</span>}
                </div>
                <div className="text-xl font-display text-[var(--ink)]">{layer.v}</div>
                <div className="text-[10px] text-[var(--muted)]">{layer.name}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Floating annotation */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1.5, duration: 0.5 }}
        className="hidden lg:block absolute -left-32 top-32"
      >
        <div className="text-xs text-[var(--gold)] italic font-display text-2xl rotate-[-8deg]">
          live demo →
        </div>
      </motion.div>
    </div>
  );
}
