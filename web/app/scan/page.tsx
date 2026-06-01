"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { analyzeProduct, type AnalyzeResponse, ApiError } from "@/lib/api";
import { DEMO_MAP } from "@/lib/demoData";
import Navbar from "@/components/Navbar";
import AmbientBackground from "@/components/AmbientBackground";
import ScoreFlipCard from "@/components/results/ScoreFlipCard";
import ResultsTabs from "@/components/results/ResultsTabs";
import { ArrowLeft, AlertCircle, Loader2 } from "lucide-react";

function ScanPageInner() {
  const params = useSearchParams();
  const router = useRouter();
  const urlParam = params.get("url");
  const demoParam = params.get("demo");

  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState("Initializing...");

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setLoading(true);
      setError(null);

      // Demo mode — use pre-cached data, zero API calls
      if (demoParam) {
        const demo = DEMO_MAP[demoParam];
        if (!demo) {
          setError(`Demo product "${demoParam}" not found. Available: zen-sound-pro, power-max`);
          setLoading(false);
          return;
        }
        setStep("Loading demo data...");
        await new Promise((r) => setTimeout(r, 600)); // brief pause for UX
        if (!cancelled) {
          setResult(demo);
          setLoading(false);
        }
        return;
      }

      // Live mode
      if (!urlParam) {
        setError("No URL provided. Go back and paste an Amazon product URL.");
        setLoading(false);
        return;
      }

      try {
        setStep("Fetching product page...");
        await new Promise((r) => setTimeout(r, 400));
        setStep("Extracting product specs...");
        await new Promise((r) => setTimeout(r, 300));
        setStep("Checking spec-claim mismatches...");

        const data = await analyzeProduct({ url: urlParam });

        if (!cancelled) {
          setResult(data);
          setLoading(false);
        }
      } catch (err) {
        if (cancelled) return;
        if (err instanceof ApiError) {
          const detail =
            err.details &&
            typeof err.details === "object" &&
            "detail" in err.details
              ? String((err.details as { detail: unknown }).detail)
              : err.message;
          setError(detail);
        } else {
          setError("Something went wrong. Make sure the backend is running.");
        }
        setLoading(false);
      }
    }

    run();
    return () => { cancelled = true; };
  }, [urlParam, demoParam]);

  return (
    <main className="relative min-h-screen">
      <AmbientBackground />
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 pb-24">
        {/* Back button */}
        <button
          onClick={() => router.push("/")}
          className="inline-flex items-center gap-2 text-sm text-[var(--muted)] hover:text-[var(--ink)] transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </button>

        <AnimatePresence mode="wait">
          {loading && (
            <motion.div
              key="loading"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center justify-center py-32 gap-6"
            >
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-4 border-[var(--border)] border-t-[var(--danger)] animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-6 h-6 rounded-full bg-[var(--danger)] opacity-20 animate-ping" />
                </div>
              </div>
              <div className="text-center">
                <p className="text-[var(--ink)] font-medium">{step}</p>
                <p className="text-sm text-[var(--muted)] mt-1">
                  {demoParam ? "Loading demo data..." : "Analyzing reviews for fake signals..."}
                </p>
              </div>
              <div className="flex gap-2">
                {["Spec extraction", "Claim checking", "Phantom trace"].map((s, i) => (
                  <span
                    key={s}
                    className="px-2.5 py-1 rounded-full text-[10px] bg-white border border-[var(--border)] text-[var(--muted)]"
                    style={{ animationDelay: `${i * 0.3}s` }}
                  >
                    {s}
                  </span>
                ))}
              </div>
            </motion.div>
          )}

          {error && !loading && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-24 gap-4"
            >
              <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center">
                <AlertCircle className="w-7 h-7 text-[var(--danger)]" />
              </div>
              <div className="text-center max-w-md">
                <h2 className="text-xl font-semibold text-[var(--ink)] mb-2">Analysis failed</h2>
                <p className="text-[var(--muted)] text-sm leading-relaxed">{error}</p>
              </div>
              <div className="flex gap-3 mt-2">
                <button
                  onClick={() => router.push("/")}
                  className="px-5 py-2.5 rounded-full bg-[var(--ink)] text-white text-sm font-medium hover:bg-[var(--ink-soft)] transition-all"
                >
                  Try another URL
                </button>
                <button
                  onClick={() => router.push("/scan?demo=zen-sound-pro")}
                  className="px-5 py-2.5 rounded-full bg-white border border-[var(--border)] text-[var(--ink)] text-sm font-medium hover:border-[var(--ink)] transition-all"
                >
                  Try demo instead
                </button>
              </div>
            </motion.div>
          )}

          {result && !loading && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              {/* Product header */}
              <div className="mb-6">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <h1 className="text-xl font-semibold text-[var(--ink)] leading-snug max-w-2xl">
                      {result.product.title}
                    </h1>
                    <div className="flex items-center gap-3 mt-1.5 text-sm text-[var(--muted)]">
                      {result.product.price && <span>{result.product.price}</span>}
                      <span>·</span>
                      <span>{result.total_reviews} reviews analyzed</span>
                      <span>·</span>
                      <span>{result.analysis_time_seconds.toFixed(1)}s</span>
                      {result.cached && (
                        <>
                          <span>·</span>
                          <span className="text-[var(--success)]">cached</span>
                        </>
                      )}
                      {demoParam && (
                        <>
                          <span>·</span>
                          <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-medium uppercase tracking-wide">
                            Demo
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Score flip cards */}
              <ScoreFlipCard result={result} />

              {/* Tabs */}
              <div className="mt-8">
                <ResultsTabs result={result} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}

export default function ScanPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--muted)]" />
      </div>
    }>
      <ScanPageInner />
    </Suspense>
  );
}
