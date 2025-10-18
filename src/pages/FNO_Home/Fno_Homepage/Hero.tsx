// src/components/hero.tsx
import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const Hero: React.FC = () => {
  const handleHowItWorksClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const el = document.getElementById("how-it-works");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      // keep the hash in the URL so users can share/refresh
      window.history.pushState({}, "", "#how-it-works");
    }
  };

  return (
    <section className="relative isolate overflow-hidden min-h-[calc(100vh-4rem)]">
      {/* Background video */}
      <video
        className="absolute inset-0 -z-10 h-full w-full object-cover"
        src="https://www.pexels.com/download/video/34129037/"
        poster="/media/fno-khazana-poster.jpg"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        onError={(e) => {
          const v = e.currentTarget as HTMLVideoElement;
          if (!v.currentSrc.includes("/media/fno-khazana.mp4")) {
            v.src = "/media/fno-khazana.mp4";
            v.load();
            v.play().catch(() => {});
          }
        }}
      />

      {/* Overlay */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-black/40 via-black/30 to-black/50" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 -z-10 -translate-x-1/2 -translate-y-1/2 w-[95vw] max-w-5xl h-[55vh] md:h-[50vh] bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0.65)_0%,rgba(0,0,0,0.4)_50%,rgba(0,0,0,0.1)_75%)]" />

      {/* Content */}
      <div className="relative mx-auto max-w-7xl px-6 min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="max-w-3xl text-center">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white [text-shadow:0_2px_16px_rgba(0,0,0,0.9),0_8px_32px_rgba(0,0,0,0.7),0_1px_4px_rgba(0,0,0,1)]">
            FNO Khazana
          </h1>

          <p className="mt-4 text-lg md:text-xl text-white leading-relaxed [text-shadow:0_2px_12px_rgba(0,0,0,0.8),0_4px_24px_rgba(0,0,0,0.6),0_1px_3px_rgba(0,0,0,0.9)] font-medium">
            Live options intelligence — GEX levels, Velocity Index, Advance/Decline,
            Call–Put dynamics, and a real-time Heat Map.
          </p>

          <div className="mt-8 flex items-center justify-center gap-3">
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
              <Link
                to="/fno-khazana-charts"
                className="group inline-flex items-center gap-2 rounded-full px-6 py-3 font-semibold text-white
                           bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500
                           shadow-[0_8px_30px_rgba(99,102,241,0.35)]
                           hover:shadow-[0_12px_46px_rgba(99,102,241,0.55)]
                           focus:outline-none focus:ring-4 focus:ring-violet-300/40 transition-all"
                aria-label="Open FNO Khazana dashboard"
              >
                Launch FNO Khazana
                <svg className="h-5 w-5 transition-transform duration-200 group-hover:translate-x-1" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </motion.div>

            {/* Smooth-scroll anchor to the section below */}
            <a
              href="#how-it-works"
              onClick={handleHowItWorksClick}
              className="inline-flex items-center rounded-full px-6 py-3 font-medium
                         bg-black/35 hover:bg-black/45 border border-white/20 text-white
                         backdrop-blur-[2px] transition focus:outline-none focus:ring-4 focus:ring-white/30"
              aria-label="Scroll to how it works"
            >
              How it works
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
