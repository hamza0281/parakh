"use client";

import { motion, useScroll, useTransform, useMotionValue, useSpring } from "framer-motion";
import { useEffect } from "react";

/**
 * AmbientBackground — 3D Animated Background
 *
 * Genuine 3D objects built with CSS 3D transforms (perspective + rotateX/Y/Z):
 *  1. Vibrant gradient mesh base
 *  2. Floating 3D cubes (6 faces, rotating in 3D space)
 *  3. Tilted 3D review cards (fake/real, floating with depth)
 *  4. 3D gradient spheres with shading
 *  5. Perspective grid floor
 *  6. Scanning beam
 *  7. Cursor-reactive parallax tilt
 */
export default function AmbientBackground() {
  const { scrollY } = useScroll();
  const yFloat1 = useTransform(scrollY, [0, 1500], [0, -200]);
  const yFloat2 = useTransform(scrollY, [0, 1500], [0, 160]);

  // Cursor-reactive scene tilt
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const tiltX = useSpring(useTransform(my, [-0.5, 0.5], [8, -8]), { stiffness: 50, damping: 20 });
  const tiltY = useSpring(useTransform(mx, [-0.5, 0.5], [-8, 8]), { stiffness: 50, damping: 20 });

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      mx.set(e.clientX / window.innerWidth - 0.5);
      my.set(e.clientY / window.innerHeight - 0.5);
    };
    window.addEventListener("mousemove", handle);
    return () => window.removeEventListener("mousemove", handle);
  }, [mx, my]);

  return (
    <div aria-hidden className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* ── 1. Vibrant gradient mesh base ─────────────────────────── */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 1100px 700px at 12% 8%, rgba(252, 211, 77, 0.40), transparent 55%),
            radial-gradient(ellipse 900px 650px at 88% 15%, rgba(248, 113, 113, 0.32), transparent 55%),
            radial-gradient(ellipse 1000px 750px at 85% 85%, rgba(167, 139, 250, 0.32), transparent 55%),
            radial-gradient(ellipse 850px 650px at 8% 92%, rgba(110, 231, 183, 0.32), transparent 55%),
            linear-gradient(180deg, #FFFDF7 0%, #FBF4E9 100%)
          `,
        }}
      />

      {/* ── 3D Scene (perspective container, cursor-reactive) ──────── */}
      <motion.div
        className="absolute inset-0"
        style={{
          perspective: 1200,
          transformStyle: "preserve-3d",
          rotateX: tiltX,
          rotateY: tiltY,
        }}
      >
        {/* Floating 3D cubes */}
        <motion.div style={{ y: yFloat1 }} className="absolute" >
          <Cube left="8%" top="22%" size={70} colorA="#FCD34D" colorB="#F59E0B" duration={16} delay={0} />
          <Cube left="82%" top="30%" size={90} colorA="#FCA5A5" colorB="#DC2626" duration={20} delay={2} />
          <Cube left="70%" top="68%" size={55} colorA="#A78BFA" colorB="#7C3AED" duration={18} delay={1} />
        </motion.div>
        <motion.div style={{ y: yFloat2 }} className="absolute">
          <Cube left="16%" top="70%" size={64} colorA="#6EE7B7" colorB="#059669" duration={22} delay={3} />
          <Cube left="46%" top="14%" size={44} colorA="#93C5FD" colorB="#2563EB" duration={15} delay={1.5} />
        </motion.div>

        {/* 3D gradient spheres */}
        <Sphere left="28%" top="40%" size={120} color="rgba(252, 211, 77, 0.5)" duration={9} delay={0} />
        <Sphere left="62%" top="48%" size={150} color="rgba(248, 113, 113, 0.35)" duration={11} delay={2} />
        <Sphere left="40%" top="78%" size={100} color="rgba(167, 139, 250, 0.4)" duration={13} delay={4} />

        {/* Tilted 3D review cards */}
        <motion.div style={{ y: yFloat1 }}>
          <Card3D left="4%" top="48%" stars={5} text="Best ANC ever!" fake rotateY={22} rotateX={-8} duration={14} delay={0} />
          <Card3D left="80%" top="55%" stars={4} text="Battery as advertised" rotateY={-20} rotateX={6} duration={17} delay={3} />
        </motion.div>
        <motion.div style={{ y: yFloat2 }}>
          <Card3D left="74%" top="12%" stars={5} text="30-hour battery!" fake rotateY={-15} rotateX={-10} duration={16} delay={5} />
          <Card3D left="10%" top="84%" stars={4} text="Solid for the price" rotateY={18} rotateX={8} duration={19} delay={2} />
        </motion.div>
      </motion.div>

      {/* ── Perspective grid floor ─────────────────────────────────── */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[40vh] opacity-[0.10]"
        style={{
          background: `
            linear-gradient(rgba(10,10,11,0.5) 1px, transparent 1px),
            linear-gradient(90deg, rgba(10,10,11,0.5) 1px, transparent 1px)
          `,
          backgroundSize: "50px 50px",
          transform: "perspective(400px) rotateX(60deg)",
          transformOrigin: "bottom",
          maskImage: "linear-gradient(to top, black, transparent)",
          WebkitMaskImage: "linear-gradient(to top, black, transparent)",
        }}
      />

      {/* ── Scanning beam ──────────────────────────────────────────── */}
      <ScanBeam />

      <style jsx global>{`
        @keyframes cube-spin {
          0% { transform: rotateX(0deg) rotateY(0deg) rotateZ(0deg); }
          100% { transform: rotateX(360deg) rotateY(360deg) rotateZ(120deg); }
        }
        @keyframes float-y {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-30px); }
        }
        @keyframes card-float {
          0%, 100% { transform: translateY(0px) rotateY(var(--ry)) rotateX(var(--rx)); }
          50% { transform: translateY(-25px) rotateY(calc(var(--ry) + 6deg)) rotateX(var(--rx)); }
        }
      `}</style>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────
// 3D Cube — 6 faces with gradient, spinning in 3D
// ────────────────────────────────────────────────────────────────────
function Cube({
  left, top, size, colorA, colorB, duration, delay,
}: {
  left: string; top: string; size: number; colorA: string; colorB: string; duration: number; delay: number;
}) {
  const half = size / 2;
  const faceStyle = (bg: string): React.CSSProperties => ({
    position: "absolute",
    width: size,
    height: size,
    background: `linear-gradient(135deg, ${colorA}, ${colorB})`,
    border: `1px solid ${colorA}`,
    opacity: 0.55,
    boxShadow: `inset 0 0 30px ${colorB}`,
  });

  return (
    <div
      className="absolute"
      style={{ left, top, width: size, height: size, animation: `float-y ${duration * 0.6}s ease-in-out ${delay}s infinite` }}
    >
      <div
        style={{
          width: size,
          height: size,
          position: "relative",
          transformStyle: "preserve-3d",
          animation: `cube-spin ${duration}s linear ${delay}s infinite`,
          filter: "blur(0.5px)",
        }}
      >
        <div style={{ ...faceStyle(colorA), transform: `translateZ(${half}px)` }} />
        <div style={{ ...faceStyle(colorA), transform: `rotateY(180deg) translateZ(${half}px)` }} />
        <div style={{ ...faceStyle(colorA), transform: `rotateY(90deg) translateZ(${half}px)` }} />
        <div style={{ ...faceStyle(colorA), transform: `rotateY(-90deg) translateZ(${half}px)` }} />
        <div style={{ ...faceStyle(colorA), transform: `rotateX(90deg) translateZ(${half}px)` }} />
        <div style={{ ...faceStyle(colorA), transform: `rotateX(-90deg) translateZ(${half}px)` }} />
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────
// 3D Sphere — radial gradient with shading + float
// ────────────────────────────────────────────────────────────────────
function Sphere({
  left, top, size, color, duration, delay,
}: {
  left: string; top: string; size: number; color: string; duration: number; delay: number;
}) {
  return (
    <div
      className="absolute rounded-full"
      style={{
        left, top, width: size, height: size,
        background: `radial-gradient(circle at 35% 30%, white, ${color} 45%, transparent 75%)`,
        filter: "blur(8px)",
        animation: `float-y ${duration}s ease-in-out ${delay}s infinite`,
      }}
    />
  );
}

// ────────────────────────────────────────────────────────────────────
// 3D Review Card — tilted with perspective, floating
// ────────────────────────────────────────────────────────────────────
function Card3D({
  left, top, stars, text, fake, rotateY, rotateX, duration, delay,
}: {
  left: string; top: string; stars: number; text: string; fake?: boolean; rotateY: number; rotateX: number; duration: number; delay: number;
}) {
  return (
    <div
      className="absolute"
      style={{
        left, top,
        transformStyle: "preserve-3d",
        ["--ry" as string]: `${rotateY}deg`,
        ["--rx" as string]: `${rotateX}deg`,
        animation: `card-float ${duration}s ease-in-out ${delay}s infinite`,
      }}
    >
      <div
        className="px-4 py-3 rounded-xl backdrop-blur-sm border shadow-2xl"
        style={{
          minWidth: 150,
          background: fake ? "rgba(254, 226, 226, 0.85)" : "rgba(220, 252, 231, 0.85)",
          borderColor: fake ? "rgba(220, 38, 38, 0.35)" : "rgba(34, 197, 94, 0.35)",
          boxShadow: fake
            ? "0 20px 40px -10px rgba(220, 38, 38, 0.3)"
            : "0 20px 40px -10px rgba(34, 197, 94, 0.3)",
        }}
      >
        <div className="flex items-center gap-1.5 mb-1">
          <span style={{ color: fake ? "#DC2626" : "#15803D" }} className="text-sm">
            {"★".repeat(stars)}
          </span>
          <span
            className="text-[9px] tracking-wider uppercase px-1.5 py-0.5 rounded-full"
            style={{
              color: "white",
              background: fake ? "#DC2626" : "#15803D",
            }}
          >
            {fake ? "fake" : "real"}
          </span>
        </div>
        <div className="text-[11px] text-slate-700 italic">&ldquo;{text}&rdquo;</div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────
// Scanning beam
// ────────────────────────────────────────────────────────────────────
function ScanBeam() {
  return (
    <div className="absolute inset-0">
      <motion.div
        className="absolute left-0 right-0 h-[3px]"
        style={{
          background: "linear-gradient(90deg, transparent, rgba(220, 38, 38, 0.6), rgba(252, 211, 77, 0.8), rgba(220, 38, 38, 0.6), transparent)",
          boxShadow: "0 0 25px rgba(220, 38, 38, 0.5), 0 0 50px rgba(252, 211, 77, 0.35)",
        }}
        animate={{ top: ["-2%", "102%"], opacity: [0, 1, 1, 0] }}
        transition={{ duration: 5, repeat: Infinity, repeatDelay: 4, ease: "linear", times: [0, 0.06, 0.94, 1] }}
      />
    </div>
  );
}
