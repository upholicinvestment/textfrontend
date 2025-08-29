// src/.../Hero.tsx
import { motion } from "framer-motion";

// Use external video URL instead of importing a local file
const VIDEO_SRC = "https://cdn.pixabay.com/video/2023/04/15/159053-818026314_large.mp4";

type Props = {
  onScrollToProducts?: () => void; // keep optional
  onScrollToHow?: () => void;
  headerOffset?: number;          // optional, still supported
};

export default function Hero({ onScrollToProducts, onScrollToHow, headerOffset = 0 }: Props) {
  // smooth scroll helper with optional manual offset
  const smoothScrollTo = (selectorOrId: string) => {
    const sel = selectorOrId.startsWith("#") ? selectorOrId : `#${selectorOrId}`;
    const el = document.querySelector(sel) as HTMLElement | null;
    if (!el) return;
    if (headerOffset > 0) {
      const top = el.getBoundingClientRect().top + window.scrollY - headerOffset;
      window.scrollTo({ top, behavior: "smooth" });
    } else {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const goHow = () => {
    if (onScrollToHow) onScrollToHow();
    else smoothScrollTo("#how-it-works");
  };

  // Always try to scroll to #pricing; still call parent handler if provided
  const goProducts = () => {
    onScrollToProducts?.();

    // try immediately
    if (document.getElementById("pricing")) {
      smoothScrollTo("#pricing");
      return;
    }

    // if the node isn't in the DOM yet (rare), try on next frame
    requestAnimationFrame(() => {
      const target = document.getElementById("pricing");
      if (target) {
        smoothScrollTo("#pricing");
      } else {
        // last-resort: set the hash so native browser behavior kicks in
        window.location.hash = "pricing";
      }
    });
  };

  return (
    <section className="relative h-[100vh] min-h-[560px] w-full overflow-hidden">
      {/* Background video */}
      <video
        className="absolute inset-0 h-full w-full object-cover"
        src={VIDEO_SRC}
        autoPlay
        muted
        loop
        playsInline
        aria-hidden="true"
        preload="auto"
      />

      {/* Overlays */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/45 to-black/80" />
      <div className="absolute inset-0 pointer-events-none [background:radial-gradient(70%_60%_at_50%_35%,rgba(255,255,255,0.14)_0%,rgba(0,0,0,0)_60%)]" />

      {/* Content */}
      <div className="relative z-10 mx-auto flex h-full max-w-6xl flex-col items-center justify-center px-6 text-white text-center">
        <motion.div
          className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs text-white/80 backdrop-blur"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
        >
          <span className="h-2 w-2 rounded-full bg-emerald-400/90" />
          Live-market ready simulator
        </motion.div>

        <motion.h1
          className="text-4xl md:text-6xl font-extrabold tracking-tight"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          Algo Simulator
        </motion.h1>

        <motion.p
          className="mt-4 max-w-2xl text-base md:text-lg text-white/85"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.6 }}
        >
          Test strategies. Visualize edge. Deploy with confidence — all inside a
          lightning-fast simulator built for live markets.
        </motion.p>

        <motion.div
          className="mt-8 flex w-full max-w-md flex-col items-center justify-center gap-3 sm:flex-row"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.6 }}
        >
          <motion.button
            onClick={goProducts}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            className="w-full sm:w-auto rounded-xl bg-white/95 px-6 py-3 font-semibold text-slate-900 shadow backdrop-blur transition hover:bg-white"
            aria-label="Explore products"
          >
            Explore Products
          </motion.button>

          <motion.button
            onClick={goHow}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            className="w-full sm:w-auto rounded-xl border border-white/25 bg-white/10 px-6 py-3 font-semibold text-white/95 shadow-sm backdrop-blur transition hover:bg-white/20"
            aria-label="How it works"
          >
            How it works
          </motion.button>
        </motion.div>

        {/* Scroll cue */}
        <motion.button
          onClick={goProducts}
          className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/70"
          initial={{ opacity: 0, y: 0 }}
          animate={{ opacity: 0.9, y: [0, 6, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
          aria-label="Scroll to products"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </motion.button>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/60 to-transparent" />
    </section>
  );
}
