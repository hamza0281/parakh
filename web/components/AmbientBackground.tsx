"use client";

import { motion, useScroll, useTransform, useMotionValue, useSpring } from "framer-motion";
import { useEffect } from "react";

/**
 * AmbientBackground — Premium animated background, clearly visible.
 *
 * Layers (back to front):
 *  1. Vibrant gradient mesh base
 *  2. 5 animated breathing color blobs (gold, red, blue, emerald, peach)
 *  3. Aurora-like flowing wave (SVG)
 *  4. Animated diagonal stripe pattern
 *  5. Visible dot grid with depth
 *  6. Floating review cards (peripheral, animated)
 *  7. Drifting star ratings (★) and X marks (✕)
 *  8. Scanning beam pulse (every 6s)
 *  9. Cursor-following spotlight
 */
export default function AmbientBackground() {
  const { scrollY } = useScroll();
  const yOrb1 = useTransform(scrollY, [0, 1500], [0, -300]);
  const yOrb2 = useTransform(scrollY, [0, 1500], [0, 250]);
  const yOrb3 = useTransform(scrollY, [0, 1500], [0, -150]);

  const mx = useMotionValue(50);
  const my = useMotionValue(20);
  const smoothMx = useSpring(mx, { stiffness: 50, damping: 20 });
  const smoothMy = useSpring(my, { stiffness: 50, damping: 20 });

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      mx.set((e.clientX / window.innerWidth) * 100);
      my.set((e.clientY / window.innerHeight) * 100);
    };
    window.addEventListener("mousemove", handle);
    return () => window.removeEventListener("mousemove", handle);
  }, [mx, my]);

  const spotlightBg = useTransform(
    [smoothMx, smoothMy],
    ([x, y]) =>
      `radial-gradient(700px circle at ${x}% ${y}%, rgba(220, 38, 38, 0.15), transparent 50%)`
  );

  return (
    <div aria-hidden className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* ── 1. Vibrant gradient mesh base ─────────────────────────── */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 1200px 800px at 15% 10%, rgba(252, 211, 77, 0.45), transparent 55%),
            radial-gradient(ellipse 1000px 700px at 90% 20%, rgba(252, 165, 165, 0.40), transparent 55%),
            radial-gradient(ellipse 1100px 800px at 85% 80%, rgba(196, 181, 253, 0.40), transparent 55%),
            radial-gradient(ellipse 900px 700px at 10% 90%, rgba(167, 243, 208, 0.40), transparent 55%),
            radial-gradient(ellipse 800px 600px at 50% 50%, rgba(254, 240, 138, 0.30), transparent 60%),
            linear-gradient(180deg, #FFFCF4 0%, #FFF4E6 100%)
          `,
        }}
      />

      {/* ── 2. Breathing animated blobs ───────────────────────────── */}
      <motion.div
        style={{ y: yOrb1 }}
        className="absolute -top-40 -left-32 w-[700px] h-[700px] rounded-full blur-[100px]"
        animate={{
          scale: [1, 1.25, 1],
          opacity: [0.7, 1, 0.7],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      >
        <div
          className="w-full h-full rounded-full"
          style={{ background: "radial-gradient(circle, rgba(252, 211, 77, 0.55), transparent 70%)" }}
        />
      </motion.div>

      <motion.div
        style={{ y: yOrb2 }}
        className="absolute top-[20%] -right-32 w-[600px] h-[600px] rounded-full blur-[100px]"
        animate={{
          scale: [1.1, 1, 1.1],
          opacity: [0.5, 0.8, 0.5],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      >
        <div
          className="w-full h-full rounded-full"
          style={{ background: "radial-gradient(circle, rgba(248, 113, 113, 0.40), transparent 70%)" }}
        />
      </motion.div>

      <motion.div
        style={{ y: yOrb3 }}
        className="absolute top-[55%] left-[10%] w-[700px] h-[700px] rounded-full blur-[120px]"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.4, 0.7, 0.4],
        }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 3 }}
      >
        <div
          className="w-full h-full rounded-full"
          style={{ background: "radial-gradient(circle, rgba(147, 197, 253, 0.45), transparent 70%)" }}
        />
      </motion.div>

      <motion.div
        className="absolute top-[60%] right-[15%] w-[500px] h-[500px] rounded-full blur-[100px]"
        animate={{
          scale: [1.15, 1, 1.15],
          opacity: [0.4, 0.6, 0.4],
        }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      >
        <div
          className="w-full h-full rounded-full"
          style={{ background: "radial-gradient(circle, rgba(134, 239, 172, 0.45), transparent 70%)" }}
        />
      </motion.div>

      <motion.div
        className="absolute top-[10%] right-[30%] w-[400px] h-[400px] rounded-full blur-[80px]"
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.5, 0.8, 0.5],
        }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 4 }}
      >
        <div
          className="w-full h-full rounded-full"
          style={{ background: "radial-gradient(circle, rgba(253, 186, 116, 0.50), transparent 70%)" }}
        />
      </motion.div>

      {/* ── 3. Aurora flowing wave (SVG) ──────────────────────────── */}
      <AuroraWave />

      {/* ── 4. Animated diagonal stripe pattern ───────────────────── */}
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(45deg, rgba(10,10,11,0) 0px, rgba(10,10,11,0) 14px, rgba(10,10,11,0.8) 14px, rgba(10,10,11,0.8) 15px)",
          animation: "stripe-shift 30s linear infinite",
        }}
      />

      {/* ── 5. Visible dot grid ──────────────────────────────────── */}
      <div className="absolute inset-0 opacity-50">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="dots" width="32" height="32" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1.3" fill="rgba(10, 10, 11, 0.18)" />
            </pattern>
            <radialGradient id="dotsFade" cx="50%" cy="40%" r="70%">
              <stop offset="0%" stopColor="white" stopOpacity="0.9" />
              <stop offset="100%" stopColor="white" stopOpacity="0" />
            </radialGradient>
            <mask id="dotsMask">
              <rect width="100%" height="100%" fill="url(#dotsFade)" />
            </mask>
          </defs>
          <rect width="100%" height="100%" fill="url(#dots)" mask="url(#dotsMask)" />
        </svg>
      </div>

      {/* ── 6. Floating review cards (peripheral) ─────────────────── */}
      <FloatingReviews />

      {/* ── 7. Drifting stars and X marks ─────────────────────────── */}
      <FloatingMarks />

      {/* ── 8. Scanning beam ─────────────────────────────────────── */}
      <ScanBeam />

      {/* ── 9. Cursor spotlight ──────────────────────────────────── */}
      <motion.div className="absolute inset-0" style={{ background: spotlightBg }} />

      <style jsx global>{`
        @keyframes stripe-shift {
          0% { background-position: 0 0; }
          100% { background-position: 200px 0; }
        }
        @keyframes aurora-flow {
          0%, 100% { transform: translateX(0) skewY(-2deg); }
          50% { transform: translateX(-50px) skewY(2deg); }
        }
        @keyframes mark-float-a {
          0% { transform: translateY(0) translateX(0) rotate(0deg); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(-110vh) translateX(40px) rotate(360deg); opacity: 0; }
        }
        @keyframes mark-float-b {
          0% { transform: translateY(0) translateX(0) rotate(0deg); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(-110vh) translateX(-50px) rotate(-300deg); opacity: 0; }
        }
        @keyframes mark-float-c {
          0% { transform: translateY(0) translateX(0) rotate(0deg); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(-110vh) translateX(20px) rotate(540deg); opacity: 0; }
        }
        @keyframes review-drift {
          0% { transform: translateY(20px) translateX(-10px); opacity: 0; }
          15% { opacity: 1; }
          85% { opacity: 1; }
          100% { transform: translateY(-100px) translateX(20px); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────
// Aurora wave — flowing SVG gradient that moves
// ────────────────────────────────────────────────────────────────────
function AuroraWave() {
  return (
    <div className="absolute inset-0 opacity-60">
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 1440 900"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="aurora-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(252, 211, 77, 0.5)" />
            <stop offset="33%" stopColor="rgba(248, 113, 113, 0.4)" />
            <stop offset="66%" stopColor="rgba(196, 181, 253, 0.4)" />
            <stop offset="100%" stopColor="rgba(134, 239, 172, 0.4)" />
          </linearGradient>
          <filter id="aurora-blur">
            <feGaussianBlur stdDeviation="40" />
          </filter>
        </defs>
        <motion.path
          d="M 0 450 Q 360 350 720 450 T 1440 450 L 1440 900 L 0 900 Z"
          fill="url(#aurora-grad)"
          filter="url(#aurora-blur)"
          animate={{
            d: [
              "M 0 450 Q 360 350 720 450 T 1440 450 L 1440 900 L 0 900 Z",
              "M 0 480 Q 360 380 720 420 T 1440 480 L 1440 900 L 0 900 Z",
              "M 0 430 Q 360 530 720 480 T 1440 430 L 1440 900 L 0 900 Z",
              "M 0 450 Q 360 350 720 450 T 1440 450 L 1440 900 L 0 900 Z",
            ],
          }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
        />
      </svg>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────
// Floating review cards — small peripheral cards drifting up
// ────────────────────────────────────────────────────────────────────
const REVIEW_CARDS = [
  { stars: 5, text: "Best ANC ever!", isFake: true, x: 4, top: 60, delay: 0 },
  { stars: 5, text: "Wireless charging works great", isFake: true, x: 92, top: 70, delay: 4 },
  { stars: 4, text: "Battery as advertised", isFake: false, x: 6, top: 30, delay: 2 },
  { stars: 5, text: "30-hour battery!", isFake: true, x: 90, top: 25, delay: 6 },
  { stars: 4, text: "Solid for the price", isFake: false, x: 3, top: 80, delay: 8 },
];

function FloatingReviews() {
  return (
    <div className="absolute inset-0">
      {REVIEW_CARDS.map((c, i) => (
        <div
          key={i}
          className="absolute"
          style={{
            left: `${c.x}%`,
            top: `${c.top}%`,
            animation: `review-drift ${18 + i * 2}s ease-in-out ${c.delay}s infinite`,
          }}
        >
          <div
            className="px-3 py-2 rounded-lg shadow-sm border backdrop-blur-sm"
            style={{
              background: c.isFake ? "rgba(254, 226, 226, 0.7)" : "rgba(220, 252, 231, 0.7)",
              borderColor: c.isFake ? "rgba(220, 38, 38, 0.25)" : "rgba(34, 197, 94, 0.25)",
              minWidth: 130,
            }}
          >
            <div className="flex items-center gap-1 text-xs">
              <span style={{ color: c.isFake ? "#DC2626" : "#15803D" }}>
                {"★".repeat(c.stars)}
              </span>
              <span
                className="text-[9px] tracking-wider uppercase ml-1"
                style={{ color: c.isFake ? "#DC2626" : "#15803D" }}
              >
                {c.isFake ? "fake" : "real"}
              </span>
            </div>
            <div className="text-[10px] text-slate-600 mt-0.5 italic">{c.text}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────
// Floating star ratings and X marks
// ────────────────────────────────────────────────────────────────────
const MARKS = (() => {
  let seed = 73;
  const rand = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
  return Array.from({ length: 28 }, (_, i) => ({
    x: rand() * 100,
    delay: rand() * 30,
    duration: 22 + rand() * 22,
    size: 14 + rand() * 14,
    isFake: i % 3 === 0,
    isStar: i % 3 === 1,
    rotation: rand() * 360,
    keyframe: ["mark-float-a", "mark-float-b", "mark-float-c"][i % 3],
  }));
})();

function FloatingMarks() {
  return (
    <div className="absolute inset-0">
      {MARKS.map((p, i) => {
        let symbol = "★";
        let color = "rgba(252, 211, 77, 0.55)";
        if (p.isFake) {
          symbol = "✕";
          color = "rgba(220, 38, 38, 0.45)";
        } else if (p.isStar) {
          symbol = "★";
          color = "rgba(252, 211, 77, 0.55)";
        } else {
          symbol = "✓";
          color = "rgba(34, 197, 94, 0.45)";
        }
        return (
          <span
            key={i}
            className="absolute font-bold select-none"
            style={{
              left: `${p.x}%`,
              bottom: -30,
              fontSize: `${p.size}px`,
              color,
              transform: `rotate(${p.rotation}deg)`,
              animation: `${p.keyframe} ${p.duration}s linear ${p.delay}s infinite`,
              textShadow: "0 0 8px rgba(255,255,255,0.5)",
            }}
          >
            {symbol}
          </span>
        );
      })}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────
// Scanning beam — radar-like horizontal sweep every few seconds
// ────────────────────────────────────────────────────────────────────
function ScanBeam() {
  return (
    <div className="absolute inset-0">
      <motion.div
        className="absolute left-0 right-0 h-[4px]"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(220, 38, 38, 0.7), rgba(252, 211, 77, 0.85), rgba(220, 38, 38, 0.7), transparent)",
          boxShadow: "0 0 30px rgba(220, 38, 38, 0.6), 0 0 60px rgba(252, 211, 77, 0.4)",
        }}
        animate={{
          top: ["-2%", "102%"],
          opacity: [0, 1, 1, 0],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          repeatDelay: 3,
          ease: "linear",
          times: [0, 0.05, 0.95, 1],
        }}
      />
    </div>
  );
}
