import AmbientBackground from "@/components/AmbientBackground";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import PainMarquee from "@/components/PainMarquee";
import HowItWorks from "@/components/HowItWorks";
import EngineShowcase from "@/components/EngineShowcase";
import Methodology from "@/components/Methodology";
import Comparison from "@/components/Comparison";
import FAQ from "@/components/FAQ";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";
import BackendStatus from "@/components/BackendStatus";

export default function Home() {
  return (
    <main className="relative">
      <AmbientBackground />
      <Navbar />
      <Hero />
      <PainMarquee />
      <HowItWorks />
      <EngineShowcase />
      <Methodology />
      <Comparison />
      <FAQ />
      <CTASection />
      <Footer />
      <BackendStatus />
    </main>
  );
}
