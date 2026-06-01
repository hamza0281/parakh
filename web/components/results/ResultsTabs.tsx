"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { AnalyzeResponse } from "@/lib/api";
import OverviewTab from "./tabs/OverviewTab";
import PhantomTab from "./tabs/PhantomTab";
import FlaggedTab from "./tabs/FlaggedTab";
import MethodologyTab from "./tabs/MethodologyTab";

interface Props {
  result: AnalyzeResponse;
}

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "phantom", label: "Phantom Features ★" },
  { id: "flagged", label: "Flagged Reviews" },
  { id: "methodology", label: "Methodology" },
];

export default function ResultsTabs({ result }: Props) {
  const [active, setActive] = useState("overview");

  return (
    <div>
      {/* Tab bar */}
      <div className="flex gap-1 overflow-x-auto pb-1 border-b border-[var(--border)] mb-6">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActive(tab.id)}
            className={`relative px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors rounded-t-lg ${
              active === tab.id
                ? "text-[var(--ink)]"
                : "text-[var(--muted)] hover:text-[var(--ink-soft)]"
            }`}
          >
            {tab.label}
            {active === tab.id && (
              <motion.div
                layoutId="tab-indicator"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--ink)] rounded-full"
              />
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={active}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          {active === "overview" && <OverviewTab result={result} />}
          {active === "phantom" && <PhantomTab result={result} />}
          {active === "flagged" && <FlaggedTab result={result} />}
          {active === "methodology" && <MethodologyTab result={result} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
