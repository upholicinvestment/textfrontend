import Hero from "./Hero";
import WhatWeDo from "./WhatWeDo";
import AnalysisSection from "./AnalysisSection";
import Navbar from "../../../components/layout/Navbar/Navbar";
import Footer from "../../../components/layout/Footer/Footer";

export default function FiiDiiHome() {
  return (
    <main className="w-full bg-slate-950 text-white">
      <Navbar />
      {/* CTA route is decided inside Hero via entitlement logic */}
      <Hero ctaLabel="Get Analysis" />
      <WhatWeDo />
      <AnalysisSection />
      <Footer />
    </main>
  );
}
