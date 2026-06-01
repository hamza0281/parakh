"use client";

"use client";

export default function Footer() {
  return (
    <footer className="relative border-t border-[var(--border)] bg-[var(--bg-elevated)] px-6 py-16">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-12 gap-10">
          {/* Brand */}
          <div className="md:col-span-5">
            <div className="flex items-center gap-2.5">
              <span className="relative inline-flex items-center justify-center w-7 h-7 rounded-full bg-[var(--ink)] text-white">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                  <circle cx="10" cy="10" r="6" />
                  <path d="M14.5 14.5L20 20" strokeLinecap="round" />
                </svg>
              </span>
              <span className="font-display text-2xl text-[var(--ink)]">Parakh</span>
            </div>
            <p className="mt-4 text-sm text-[var(--muted)] max-w-sm leading-relaxed">
              Reviews ki Parakh. Khara ya Khota?
              <br />
              We catch fake AI reviews by what they claim, not how they&apos;re written.
            </p>
            <div className="mt-6 flex items-center gap-3">
              <SocialLink href="https://github.com" icon={GhIcon} label="GitHub" />
              <SocialLink href="https://twitter.com" icon={XIcon} label="Twitter" />
              <SocialLink href="https://linkedin.com" icon={InIcon} label="LinkedIn" />
            </div>
          </div>

          {/* Links */}
          <div className="md:col-span-2">
            <div className="text-xs tracking-[0.2em] uppercase text-[var(--muted-soft)] mb-4">Product</div>
            <ul className="space-y-2.5 text-sm">
              <li><a href="#scan" className="text-[var(--ink-soft)] hover:text-[var(--ink)]">Scan a URL</a></li>
              <li><a href="#engine" className="text-[var(--ink-soft)] hover:text-[var(--ink)]">5-Layer Engine</a></li>
              <li><a href="#methodology" className="text-[var(--ink-soft)] hover:text-[var(--ink)]">Methodology</a></li>
              <li><a href="/compare" className="text-[var(--ink-soft)] hover:text-[var(--ink)]">Compare</a></li>
            </ul>
          </div>

          <div className="md:col-span-2">
            <div className="text-xs tracking-[0.2em] uppercase text-[var(--muted-soft)] mb-4">Developers</div>
            <ul className="space-y-2.5 text-sm">
              <li><a href="#" className="text-[var(--ink-soft)] hover:text-[var(--ink)]">API docs</a></li>
              <li><a href="https://github.com" className="text-[var(--ink-soft)] hover:text-[var(--ink)]">GitHub</a></li>
              <li><a href="#" className="text-[var(--ink-soft)] hover:text-[var(--ink)]">Bake-off results</a></li>
              <li><a href="#" className="text-[var(--ink-soft)] hover:text-[var(--ink)]">Self-host</a></li>
            </ul>
          </div>

          <div className="md:col-span-3">
            <div className="text-xs tracking-[0.2em] uppercase text-[var(--muted-soft)] mb-4">About</div>
            <ul className="space-y-2.5 text-sm">
              <li><a href="#" className="text-[var(--ink-soft)] hover:text-[var(--ink)]">Built for Slop Scan</a></li>
              <li><a href="https://slopscan.dev" target="_blank" rel="noreferrer" className="text-[var(--ink-soft)] hover:text-[var(--ink)]">Hackathon Raptors</a></li>
              <li><a href="#" className="text-[var(--ink-soft)] hover:text-[var(--ink)]">License (MIT)</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-[var(--border-soft)] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <p className="text-xs text-[var(--muted-soft)]">
            © 2026 Parakh · Built in 72 hours for Slop Scan · Track G — Marketplaces
          </p>
          <p className="text-xs text-[var(--muted-soft)]">
            <span className="font-devanagari text-base mr-1">पारख</span> /pa-rakh/ — to examine, to verify quality
          </p>
        </div>
      </div>
    </footer>
  );
}

function SocialLink({ href, icon: Icon, label }: { href: string; icon: React.ComponentType<{ className?: string }>; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={label}
      className="w-9 h-9 rounded-full bg-[var(--surface)] hover:bg-[var(--ink)] hover:text-white flex items-center justify-center text-[var(--ink-soft)] transition-all"
    >
      <Icon className="w-4 h-4" />
    </a>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M18.244 2H21l-6.51 7.44L22.5 22h-6.802l-5.328-6.97L4.244 22H1.488l6.962-7.96L1.5 2h6.93l4.815 6.37L18.244 2zm-1.193 18h1.86L7.05 4H5.07l11.98 16z" />
    </svg>
  );
}

function InIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2zM8.339 18.337H5.667v-8.59h2.672v8.59zM7 8.574a1.55 1.55 0 1 1 0-3.1 1.55 1.55 0 0 1 0 3.1zm11.336 9.763h-2.669V14.16c0-.996-.018-2.277-1.388-2.277-1.39 0-1.601 1.086-1.601 2.207v4.247h-2.667v-8.59h2.56v1.174h.037c.355-.675 1.227-1.387 2.524-1.387 2.7 0 3.2 1.778 3.2 4.092v4.711z"/>
    </svg>
  );
}

function GhIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56v-1.97c-3.2.7-3.87-1.54-3.87-1.54-.52-1.32-1.27-1.67-1.27-1.67-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.02 1.76 2.69 1.25 3.34.96.1-.74.4-1.25.72-1.54-2.55-.29-5.24-1.27-5.24-5.66 0-1.25.45-2.27 1.18-3.07-.12-.29-.51-1.46.11-3.05 0 0 .96-.31 3.15 1.17.91-.25 1.89-.38 2.86-.38.97 0 1.95.13 2.86.38 2.19-1.48 3.15-1.17 3.15-1.17.62 1.59.23 2.76.11 3.05.74.8 1.18 1.82 1.18 3.07 0 4.4-2.69 5.36-5.25 5.65.41.36.78 1.06.78 2.13v3.16c0 .31.21.68.8.56C20.21 21.39 23.5 17.08 23.5 12 23.5 5.65 18.35.5 12 .5z" />
    </svg>
  );
}
