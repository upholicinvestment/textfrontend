import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AboutSection from "./components/sections/AboutSection";
import TeamSection from "./components/sections/TeamSection";
import CareersSection from "./components/sections/CareersSection";
import Navbar from '../../../src/components/layout/Navbar/Navbar';

type TabKey = "about" | "team" | "careers";

const heroData = {
  about: {
    title: "Precision Trading Technology",
    highlight: "Since 2024",
    description: "Engineered platforms that redefine market efficiency",
    image: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=1600&auto=format&fit=crop"
  },
  team: {
    title: "Elite Financial Minds",
    highlight: "Building The Future",
    description: "Where quantitative brilliance meets technological innovation",
    image: "https://images.unsplash.com/photo-1551434678-e076c223a692?q=80&w=1600&auto=format&fit=crop"
  },
  careers: {
    title: "Join the team behind ",
    highlight: "pro-grade fintech",
    description: "Shape the next generation of trading infrastructure",
    image: "https://images.unsplash.com/photo-1542744173-05336fcc7ad4?q=80&w=1600&auto=format&fit=crop"
  }
};

export default function About() {
  const [tab, setTab] = useState<TabKey>("about");
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <>
    <Navbar />
    <div 
      ref={containerRef}
      className="min-h-screen w-full bg-neutral-950 overflow-hidden relative"
    >
      
      {/* Hero Section */}
      <section className="relative h-screen overflow-hidden">
        {/* Animated background */}
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            className="absolute inset-0 bg-neutral-900"
          />
          
          <motion.img
            key={tab}
            src={heroData[tab].image}
            alt=""
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5 }}
            className="absolute inset-0 h-full w-full object-cover"
          />
        </AnimatePresence>

        {/* Grid overlay */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMzMzMzMzMiIG9wYWNpdHk9IjAuMiI+PHBhdGggZD0iTTM2IDM0aDEydjEySDM2em0tMjQgMGgxMnYxMkgyMnptMjQtMjRoMTJ2MTJIMzZ6bS0yNCAwaDEydjEySDIyem0yNCAyNGgxMnYxMkgzNnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-20" />

        {/* Content */}
        <div className="relative h-full flex flex-col justify-center items-center text-center px-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.8 }}
              className="max-w-4xl"
            >
              <h1 className="text-5xl md:text-7xl font-light text-white mb-6 tracking-tight">
                {heroData[tab].title}{" "}
                <span className="font-medium text-white">
                  {heroData[tab].highlight}
                </span>
              </h1>
              <div className="h-px w-24 bg-white mx-auto my-8" />
              <p className="text-lg md:text-xl text-neutral-300 max-w-2xl mx-auto mb-12">
                {heroData[tab].description}
              </p>
            </motion.div>
          </AnimatePresence>

          {/* Minimal tabs */}
          <div className="flex space-x-0 bg-neutral-900 rounded-full p-1 border border-neutral-800">
            {Object.keys(heroData).map((key) => (
              <button
                key={key}
                onClick={() => setTab(key as TabKey)}
                className={`px-6 py-3 rounded-full text-sm font-medium transition-all duration-300 ${
                  tab === key
                    ? "bg-white text-black"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                {key.charAt(0).toUpperCase() + key.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Scrolling indicator */}
        <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2">
          <div className="text-neutral-500 text-xs">SCROLL</div>
          <div className="mx-auto mt-2 w-px h-8 bg-neutral-600" />
        </div>
      </section>

      {/* Content Sections */}
      <section className="relative z-10 bg-neutral-950">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            {tab === "about" && <AboutSection />}
            {tab === "team" && <TeamSection />}
            {tab === "careers" && <CareersSection />}
          </motion.div>
        </AnimatePresence>
      </section>

      {/* Subtle animated line */}
      <motion.div 
        className="fixed top-0 left-0 h-full w-px bg-gradient-to-b from-transparent via-white/10 to-transparent z-20"
        initial={{ y: "-100%" }}
        animate={{ y: "100%" }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
      />
    </div>
    </>
  );
}