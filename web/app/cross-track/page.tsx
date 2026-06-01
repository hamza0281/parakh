"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import AmbientBackground from "@/components/AmbientBackground";
import { ArrowLeft, ArrowRight, BookOpen, Briefcase, Loader2 } from "lucide-react";
import { apiUrl } from "@/lib/api";

interface ClaimResult {
  claim: string;
  verdict: "supported" | "contradicted" | "unverifiable";
  confidence: number;
  explanation: string;
}

interface CrossTrackResponse {
  track: string;
  total_claims: number;
  contradicted: number;
  supported: number;
  unverifiable: number;
  claims: ClaimResult[];
  slop_score: number;
  summary: string;
}

const DEMOS = {
  academia: {
    document: "This study demonstrates that AI-generated content now comprises 45% of all online text (Smith et al., 2024). Our analysis of 10,000 papers shows a 300% increase in AI-assisted writing since 2022. The landmark Chen (2023) study found that 89% of reviewers cannot distinguish AI from human writing.",
    reference: "Smith et al. (2024) found that AI-generated content comprises approximately 12-15% of online text, with significant variation by domain. The study analyzed 50,000 web pages.",
  },
  hiring: {
    document: "Led a team of 50 engineers at Google for 8 years. Architected systems serving 10 billion daily requests. PhD in Computer Science from MIT. Published 15 peer-reviewed papers in top venues.",
    reference: "Job Requirements: 3+ years experience, team lead experience preferred, Bachelor's degree required, experience with distributed systems.",
  },
};

export default function CrossTrackPage() {
  const router = useRouter();
  const [track, setTrack] = useState<"academia" | "hiring">("academia");
  const [document, setDocument] = useState(DEMOS.academia.document);
  const [reference, setReference] = useState(DEMOS.academia.reference);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CrossTrackResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  function switchTrack(t: "academia" | "hiring") {
    setTrack(t);
    setDocument(DEMOS[t].document);
    setReference(DEMOS[t].reference);
    setResult(null);
    setError(null);
  }

  async function analyze() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch(`${apiUrl}/api/v1/cross-track/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ track, document, reference }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || `HTTP ${res.status}`);
      }
      const data = await res.json();
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Analysis failed. Make sure backend is running.");
    } finally {
      setLoading(false);
    }
  }

  const verdictColor = {
    supported: "text-emerald-700 bg-emerald-50 border-emerald-200",
    contradicted: "text-red-700 bg-red-50 border-red-200",
    unverifiable: "text-amber-700 bg-amber-50 border-amber-200",
  };

  const verdictIcon = {
    supported: "✓",
    contradicted: "✕",
    unverifiable: "?",
  };

  return (
    <main className="relative min-h-screen">
      <AmbientBackground />
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-8 pb-24">
        <button
          onClick={() => router.push("/")}
          className="inline-flex items-center gap-2 text-sm text-[var(--muted)] hover:text-[var(--ink)] transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </button>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="mb-2">
            <span className="text-[10px] tracking-[0.3em] uppercase text-[var(--muted)]">
              Cross-Track Demo — Bonus +3
            </span>
          </div>
          <h1 className="font-display text-4xl md:text-5xl text-[var(--ink)] mb-3">
            Beyond Marketplaces
          </h1>
          <p className="text-[var(--muted)] max-w-2xl leading-relaxed mb-8">
            Parakh&apos;s Spec-Claim Mismatch engine isn&apos;t just for Amazon reviews.
            The same NLI-based contradiction detection works on academic citations and resume claims.
          </p>

          {/* Track selector */}
          <div className="flex gap-3 mb-8">
            {(["academia", "hiring"] as const).map((t) => (
              <button
                key={t}
                onClick={() => switchTrack(t)}
                className={`flex items-center gap-2 px-5 py-3 rounded-xl border font-medium text-sm transition-all ${
                  track === t
                    ? "bg-[var(--ink)] text-white border-[var(--ink)]"
                    : "bg-white border-[var(--border)] text-[var(--muted)] hover:border-[var(--ink)]"
                }`}
              >
                {t === "academia" ? <BookOpen className="w-4 h-4" /> : <Briefcase className="w-4 h-4" />}
                {t === "academia" ? "Track F — Academia" : "Track C — Hiring"}
              </button>
            ))}
          </div>

          {/* Input form */}
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="text-xs tracking-[0.15em] uppercase text-[var(--muted)] mb-1.5 block">
                {track === "academia" ? "Paper / Document" : "Resume / Application"}
              </label>
              <textarea
                value={document}
                onChange={(e) => setDocument(e.target.value)}
                rows={6}
                className="w-full px-4 py-3 rounded-xl bg-white border border-[var(--border)] text-sm text-[var(--ink)] focus:outline-none focus:border-[var(--ink)] transition-colors resize-none"
                placeholder={track === "academia" ? "Paste paper abstract or excerpt..." : "Paste resume text..."}
              />
            </div>
            <div>
              <label className="text-xs tracking-[0.15em] uppercase text-[var(--muted)] mb-1.5 block">
                {track === "academia" ? "Cited Source / Reference" : "Job Posting / Requirements"}
              </label>
              <textarea
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                rows={6}
                className="w-full px-4 py-3 rounded-xl bg-white border border-[var(--border)] text-sm text-[var(--ink)] focus:outline-none focus:border-[var(--ink)] transition-colors resize-none"
                placeholder={track === "academia" ? "Paste the actual source text..." : "Paste job requirements..."}
              />
            </div>
          </div>

          <button
            onClick={analyze}
            disabled={loading || !document.trim() || !reference.trim()}
            className="group inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[var(--ink)] text-white font-medium hover:bg-[var(--ink-soft)] transition-all disabled:opacity-50 mb-8"
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing...</>
            ) : (
              <><span>Analyze Claims</span><ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" /></>
            )}
          </button>

          {/* Error */}
          {error && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm mb-6">
              {error}
            </div>
          )}

          {/* Results */}
          <AnimatePresence>
            {result && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                {/* Summary card */}
                <div className={`p-5 rounded-2xl border ${
                  result.contradicted > 0
                    ? "bg-red-50 border-red-200"
                    : "bg-emerald-50 border-emerald-200"
                }`}>
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{result.contradicted > 0 ? "⚠" : "✓"}</span>
                    <div>
                      <p className={`font-semibold ${result.contradicted > 0 ? "text-red-800" : "text-emerald-800"}`}>
                        {result.summary}
                      </p>
                      <div className="flex gap-4 mt-2 text-xs">
                        <span className="text-red-700">{result.contradicted} contradicted</span>
                        <span className="text-emerald-700">{result.supported} supported</span>
                        <span className="text-amber-700">{result.unverifiable} unverifiable</span>
                        <span className="text-[var(--muted)]">Slop score: {Math.round(result.slop_score * 100)}%</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Claims list */}
                <div className="space-y-2">
                  {result.claims.map((claim, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.08 }}
                      className={`p-4 rounded-xl border ${verdictColor[claim.verdict]}`}
                    >
                      <div className="flex items-start gap-3">
                        <span className="font-bold text-lg mt-0.5 shrink-0">{verdictIcon[claim.verdict]}</span>
                        <div className="flex-1">
                          <p className="text-sm font-medium mb-1">&ldquo;{claim.claim}&rdquo;</p>
                          <p className="text-xs opacity-80">{claim.explanation}</p>
                        </div>
                        <span className="text-xs font-mono shrink-0">{Math.round(claim.confidence * 100)}%</span>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Cross-track explanation */}
                <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border-soft)]">
                  <p className="text-xs text-[var(--muted)] leading-relaxed">
                    <strong className="text-[var(--ink)]">Same engine, different domain.</strong>{" "}
                    Parakh uses Natural Language Inference (DeBERTa-v3-MNLI) to check if claims
                    contradict their reference sources. In marketplaces, the reference is the product spec.
                    In academia, it&apos;s the cited paper. In hiring, it&apos;s the job requirements.
                    The signal is universal: <em>does this text claim things that aren&apos;t true?</em>
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </main>
  );
}
