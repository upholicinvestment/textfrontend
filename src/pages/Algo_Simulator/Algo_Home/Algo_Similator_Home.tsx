
import Hero from "./Hero";

import HowItWorks from "./HowItWorks";
import Benefits from "./Benefits";
import PricingSection from "./PricingSection";


import Navbar from "../../../components/layout/Navbar/Navbar";
import Footer from "../../../components/layout/Footer/Footer";

export default function Algo_Similator_Home() {
  

  const onScrollToProducts = () => {
    document.getElementById("products")?.scrollIntoView({ behavior: "smooth" });
  };

  

  return (
    <main className="min-h-screen w-full bg-slate-950 text-white">
      <Navbar/>
      <Hero onScrollToProducts={onScrollToProducts} />
      <Benefits />
      <HowItWorks />
      <PricingSection/>
      <Footer />
    </main>
  );
}
