import type { Metadata } from "next";
import { Inter, Instrument_Serif, JetBrains_Mono, Tiro_Devanagari_Hindi } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const display = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-display",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

const devanagari = Tiro_Devanagari_Hindi({
  subsets: ["devanagari"],
  weight: "400",
  variable: "--font-devanagari",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Parakh — Reviews ki Parakh. Khara ya Khota?",
  description:
    "Parakh catches fake AI reviews by checking what they claim against what the product actually has. The first review tool that reads the spec sheet.",
  keywords: ["fake reviews", "AI detection", "Amazon reviews", "review verification", "slop scan"],
  openGraph: {
    title: "Parakh — Reviews ki Parakh",
    description: "We catch fake reviews by what they claim, not how they're written.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${display.variable} ${mono.variable} ${devanagari.variable} grain antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
