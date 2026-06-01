"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import AmbientBackground from "@/components/AmbientBackground";
import { ArrowRight, ArrowLeft } from "lucide-react";

export default function ComparePage() {
  const [url1, setUrl1] = useState("");
  const [url2, setUrl2] = useState("");
  const router = useRouter();

  function handleCompare(e: React.FormEvent) {
    e.preventDefault();
    if (url1.trim()) router.push(`/scan?url=${encodeURIComponent(url1.trim())}`);
  }

  return (
    <main className="relative min-h-screen">
      <AmbientBackground />
      <Navbar />
      <div className="max-w-3xl mx-auto px-6 pt-16 pb-24">
        <button
          onClick={() => router.push("/")}
          className="inline-flex items-center gap-2 text-sm text-[var(--muted)] hover:text-[var(--ink)] transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-4xl text-[var(--ink)] mb-2">Compare Products</h1>
          <p className="text-[var(--muted)] mb-8">Analyze two Amazon products side by side.</p>

          <form onSubmit={handleCompare} className="space-y-4">
            {[
              { label: "Product 1", value: url1, set: setUrl1 },
              { label: "Product 2", value: url2, set: setUrl2 },
            ].map((field) => (
              <div key={field.label}>
                <label className="text-xs tracking-[0.15em] uppercase text-[var(--muted)] mb-1.5 block">
                  {field.label}
                </label>
                <input
                  type="text"
                  value={field.value}
                  onChange={(e) => field.set(e.target.value)}
                  placeholder="https://www.amazon.com/dp/..."
                  className="w-full px-4 py-3 rounded-xl bg-white border border-[var(--border)] text-[var(--ink)] placeholder:text-[var(--muted-soft)] focus:outline-none focus:border-[var(--ink)] transition-colors"
                />
              </div>
            ))}

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={!url1.trim()}
                className="group inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[var(--ink)] text-white font-medium hover:bg-[var(--ink-soft)] transition-all disabled:opacity-50"
              >
                Analyze Product 1
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </button>
              {url2.trim() && (
                <button
                  type="button"
                  onClick={() => router.push(`/scan?url=${encodeURIComponent(url2.trim())}`)}
                  className="px-6 py-3 rounded-xl bg-white border border-[var(--border)] text-[var(--ink)] font-medium hover:border-[var(--ink)] transition-all"
                >
                  Analyze Product 2
                </button>
              )}
            </div>
          </form>

          <div className="mt-8 p-4 rounded-xl bg-[var(--surface)] border border-[var(--border-soft)]">
            <p className="text-xs text-[var(--muted)]">
              <strong className="text-[var(--ink)]">Tip:</strong> Open each product in a separate tab to compare results side by side.
              Full side-by-side comparison view coming soon.
            </p>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
