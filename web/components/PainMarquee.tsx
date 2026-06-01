"use client";

const PAINS = [
  '"Best earbuds with 30-hour ANC!"',
  "Wireless charging case! ★★★★★",
  '"Crystal clear ECG!"',
  "Fast charging works perfectly!",
  '"GPS is so accurate!"',
  "Premium build, 4K display!",
  "AI-generated · 5★ · Verified",
  '"Just like the description"',
  "Active Noise Cancellation forever!",
];

export default function PainMarquee() {
  return (
    <section className="relative py-10 border-y border-[var(--border)] bg-white overflow-hidden">
      <div className="flex">
        <Track />
        <Track />
      </div>
      {/* Edge fade */}
      <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-white to-transparent pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-white to-transparent pointer-events-none" />
    </section>
  );
}

function Track() {
  return (
    <div
      className="flex shrink-0 items-center gap-12 whitespace-nowrap pr-12"
      style={{ animation: "marquee 50s linear infinite" }}
    >
      {[...PAINS, ...PAINS].map((p, i) => (
        <span key={i} className="font-display text-2xl md:text-3xl italic text-[var(--muted)]">
          <span className="text-[var(--danger)] mr-3">✕</span>
          {p}
        </span>
      ))}
    </div>
  );
}
