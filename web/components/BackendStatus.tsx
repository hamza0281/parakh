"use client";

import { useEffect, useState } from "react";
import { checkHealth, type HealthResponse } from "@/lib/api";

/**
 * Tiny pulsing dot in bottom-right that shows backend connection state.
 * Helpful during dev. In production you can hide it.
 */
export default function BackendStatus() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      try {
        const h = await checkHealth();
        if (!cancelled) {
          setHealth(h);
          setError(null);
        }
      } catch (e: unknown) {
        if (!cancelled) {
          const msg = e instanceof Error ? e.message : "Unknown error";
          setError(msg);
          setHealth(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    check();
    const interval = setInterval(check, 30000); // re-check every 30s
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const status: "checking" | "online" | "offline" = loading
    ? "checking"
    : health
    ? "online"
    : "offline";

  const colors = {
    checking: "bg-amber-500",
    online: "bg-emerald-500",
    offline: "bg-red-500",
  };

  const labels = {
    checking: "Checking backend…",
    online: `API online · v${health?.version ?? "?"}`,
    offline: error || "Backend offline",
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 group">
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/90 backdrop-blur border border-[var(--border)] shadow-[0_4px_20px_rgba(0,0,0,0.06)] text-xs">
        <span className="relative flex h-2 w-2">
          <span
            className={`absolute inline-flex h-full w-full rounded-full opacity-50 ${colors[status]} ${
              status === "online" ? "animate-ping" : ""
            }`}
          />
          <span className={`relative inline-flex h-2 w-2 rounded-full ${colors[status]}`} />
        </span>
        <span className="text-[var(--ink-soft)]">{labels[status]}</span>
      </div>
      {/* Hover panel for details */}
      {health && (
        <div className="absolute bottom-full right-0 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          <div className="bg-white rounded-lg border border-[var(--border)] shadow-lg p-3 min-w-[220px] text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-[var(--muted)]">Groq</span>
              <span className={health.services.groq_key_configured ? "text-emerald-600" : "text-red-600"}>
                {health.services.groq_key_configured ? "✓" : "✗"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--muted)]">Gemini</span>
              <span className={health.services.gemini_key_configured ? "text-emerald-600" : "text-red-600"}>
                {health.services.gemini_key_configured ? "✓" : "✗"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--muted)]">HuggingFace</span>
              <span className={health.services.hf_key_configured ? "text-emerald-600" : "text-red-600"}>
                {health.services.hf_key_configured ? "✓" : "✗"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--muted)]">Redis</span>
              <span className={health.services.redis === "healthy" ? "text-emerald-600" : "text-amber-600"}>
                {health.services.redis === "healthy" ? "✓" : "△"}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
