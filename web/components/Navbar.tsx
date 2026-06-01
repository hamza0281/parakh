"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

function GhIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56v-1.97c-3.2.7-3.87-1.54-3.87-1.54-.52-1.32-1.27-1.67-1.27-1.67-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.02 1.76 2.69 1.25 3.34.96.1-.74.4-1.25.72-1.54-2.55-.29-5.24-1.27-5.24-5.66 0-1.25.45-2.27 1.18-3.07-.12-.29-.51-1.46.11-3.05 0 0 .96-.31 3.15 1.17.91-.25 1.89-.38 2.86-.38.97 0 1.95.13 2.86.38 2.19-1.48 3.15-1.17 3.15-1.17.62 1.59.23 2.76.11 3.05.74.8 1.18 1.82 1.18 3.07 0 4.4-2.69 5.36-5.25 5.65.41.36.78 1.06.78 2.13v3.16c0 .31.21.68.8.56C20.21 21.39 23.5 17.08 23.5 12 23.5 5.65 18.35.5 12 .5z" />
    </svg>
  );
}

export default function Navbar() {
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);

  const padding = useTransform(scrollY, [0, 80], [16, 8]);
  const radius = useTransform(scrollY, [0, 80], [0, 24]);
  const width = useTransform(scrollY, [0, 80], ["100%", "92%"]);

  useEffect(() => {
    return scrollY.on("change", (v) => setScrolled(v > 20));
  }, [scrollY]);

  return (
    <motion.header
      style={{
        paddingTop: padding,
        paddingBottom: padding,
      }}
      className="sticky top-0 z-50 w-full"
    >
      <motion.div
        style={{
          borderRadius: radius,
          width,
        }}
        className={`mx-auto px-6 transition-all duration-300 ${
          scrolled
            ? "bg-white/70 backdrop-blur-xl border border-[var(--border)] shadow-[0_8px_30px_rgba(0,0,0,0.04)]"
            : "bg-transparent"
        }`}
      >
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <ParakhMark />
            <span className="font-display text-2xl tracking-tight text-[var(--ink)]">
              Parakh
            </span>
            <span className="hidden md:inline-block text-[10px] tracking-[0.2em] text-[var(--muted-soft)] uppercase ml-2 mt-1">
              पारख
            </span>
          </Link>

          {/* Center nav */}
          <nav className="hidden md:flex items-center gap-9 text-sm text-[var(--ink-soft)]">
            <a href="#how" className="underline-draw">How it works</a>
            <a href="#engine" className="underline-draw">5-Layer Engine</a>
            <a href="#methodology" className="underline-draw">Methodology</a>
            <Link href="/compare" className="underline-draw">Compare</Link>
            <Link href="/cross-track" className="underline-draw">Cross-Track</Link>
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-3">
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 text-sm text-[var(--ink-soft)] hover:text-[var(--ink)] transition-colors"
            >
              <GhIcon className="w-4 h-4" />
              <span>Source</span>
            </a>
            <Link
              href="/scan?demo=zen-sound-pro"
              className="group inline-flex items-center gap-1.5 px-4 h-9 rounded-full bg-[var(--ink)] text-white text-sm font-medium hover:bg-[var(--ink-soft)] transition-all"
            >
              <span>Try Parakh</span>
              <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          </div>
        </div>
      </motion.div>
    </motion.header>
  );
}

function ParakhMark() {
  return (
    <span className="relative inline-flex items-center justify-center w-7 h-7 rounded-full bg-[var(--ink)] text-white">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
        <circle cx="10" cy="10" r="6" />
        <path d="M14.5 14.5L20 20" strokeLinecap="round" />
      </svg>
      <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[var(--gold-light)] ring-2 ring-[var(--bg)]" />
    </span>
  );
}
