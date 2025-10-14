import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Pause, Play, TrendingUp } from "lucide-react";

// ✅ New: import the image asset
import heroImg from "../../../../src/assets/heatmap.jpg";
import heroImg1 from "../../../../src/assets/advdec.jpg";
import heroImg2 from "../../../../src/assets/volatility.jpg";
import heroImg3 from "../../../../src/assets/callput.jpg";
import heroImg4 from "../../../../src/assets/gamma.jpg";

type Slide = {
  key: string;
  title: string;
  subtitle: string;
  description: string;
  bullets: string[];
  img: string;
  accentFrom: string;
  accentTo: string;
};

const SLIDES: Slide[] = [
  {
    key: "gex",
    title: "GEX Levels",
    subtitle: "Gamma Exposure Map",
    description:
      "Identify dealer positioning zones that can pin prices or trigger volatility. Visualize walls and inflection points instantly.",
    bullets: ["Gamma extremes", "Reversal zones", "Support/resistance"],
    img: heroImg4, // ← using imported image
    accentFrom: "from-indigo-500",
    accentTo: "to-purple-600",
  },
  {
    key: "velocity",
    title: "Velocity Index",
    subtitle: "Volatility Dynamics",
    description:
      "Track volatility regime shifts with a smooth curve and reference line. Monitor volume and delta patterns in real-time.",
    bullets: ["Regime detection", "Reference tracking", "Volume analysis"],
    img: heroImg2,
    accentFrom: "from-violet-500",
    accentTo: "to-blue-500",
  },
  {
    key: "advdec",
    title: "Advance/Decline",
    subtitle: "Market Breadth",
    description:
      "Measure market participation strength. Confirm trend validity or spot early divergence signals.",
    bullets: ["Breadth momentum", "Trend confirmation", "Divergence alerts"],
    img: heroImg1,
    accentFrom: "from-emerald-500",
    accentTo: "to-teal-500",
  },
  {
    key: "callput",
    title: "Call-Put Dynamics",
    subtitle: "Options Flow",
    description:
      "Analyze call and put pressure across strikes and expirations. Track institutional positioning and sentiment shifts.",
    bullets: ["Strike analysis", "Expiry flow", "Sentiment shifts"],
    img: heroImg3,
    accentFrom: "from-sky-500",
    accentTo: "to-cyan-500",
  },
  {
    key: "heatmap",
    title: "Market Heat Map",
    subtitle: "Sector Rotation",
    description:
      "Visualize real-time market movements across sectors and stocks. Spot rotation patterns and identify leaders instantly.",
    bullets: ["Sector strength", "Stock momentum", "Rotation signals"],
    img: heroImg,
    accentFrom: "from-orange-400",
    accentTo: "to-rose-500",
  },
];

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 60 : -60,
    opacity: 0,
  }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({
    x: direction > 0 ? -60 : 60,
    opacity: 0,
  }),
};

const TiltCard: React.FC<{ src: string; alt: string }> = ({ src, alt }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState("");

  const onMove = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    const rx = (py - 0.5) * -8;
    const ry = (px - 0.5) * 10;
    setTransform(`perspective(1000px) rotateX(${rx}deg) rotateY(${ry}deg)`);
  };
  const onLeave = () => setTransform("");

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className="relative rounded-2xl overflow-hidden shadow-2xl"
      style={{ transform, transition: "transform 150ms ease-out" }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent rounded-2xl" />
      <img
        src={src}
        alt={alt}
        className="w-full h-[320px] md:h-[400px] object-cover"
        onError={(e) => {
          const el = e.currentTarget;
          el.style.display = "none";
          const fallback = document.createElement("div");
          fallback.className =
            "w-full h-[320px] md:h-[400px] bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center text-white/40 text-sm";
          fallback.textContent = "Preview unavailable";
          el.parentElement?.appendChild(fallback);
        }}
      />
    </div>
  );
};

const Dot: React.FC<{ active: boolean; onClick: () => void }> = ({ active, onClick }) => (
  <button
    onClick={onClick}
    className={`h-2 rounded-full transition-all duration-300 ${
      active ? "w-8 bg-white" : "w-2 bg-white/30 hover:bg-white/50"
    }`}
    aria-label="Navigate to slide"
  />
);

export default function FnoKhazanaIntro() {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [auto, setAuto] = useState(true);
  const total = SLIDES.length;

  const go = (i: number) => {
    setDirection(i > index ? 1 : -1);
    setIndex((i + total) % total);
  };

  const next = () => go((index + 1) % total);
  const prev = () => go((index - 1 + total) % total);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "ArrowRight") next();
      if (e.code === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index]);

  useEffect(() => {
    if (!auto) return;
    const timer = setInterval(next, 6000);
    return () => clearInterval(timer);
  }, [index, auto]);

  const slide = SLIDES[index];
  const gradientClass = `bg-gradient-to-r ${slide.accentFrom} ${slide.accentTo}`;

  return (
    <section className="relative bg-gradient-to-b from-[#0a0e1a] to-[#0d1117] py-16 md:py-24 overflow-hidden">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-[0.03]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(120,119,198,0.3),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(147,51,234,0.2),transparent_50%)]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${gradientClass}`}>
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-white/60">Explore Charts</h3>
              <p className="text-xl font-bold text-white">Five Core F&O Tools</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={prev}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 hover:text-white transition border border-white/5"
              aria-label="Previous slide"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={() => setAuto(!auto)}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 hover:text-white transition border border-white/5"
              aria-label="Toggle autoplay"
            >
              {auto ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
            </button>
            <button
              onClick={next}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 hover:text-white transition border border-white/5"
              aria-label="Next slide"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="grid md:grid-cols-2 gap-12 items-center min-h-[480px]">
          {/* Left: Details */}
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={slide.key}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="space-y-6"
            >
              <div>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white/5 text-white/70 border border-white/10">
                  {slide.subtitle}
                </span>
                <h2 className="mt-4 text-4xl md:text-5xl font-bold text-white leading-tight">
                  {slide.title}
                </h2>
              </div>

              <p className="text-lg text-white/70 leading-relaxed">
                {slide.description}
              </p>

              <div className="flex flex-wrap gap-2">
                {slide.bullets.map((bullet, i) => (
                  <span
                    key={i}
                    className="px-4 py-2 rounded-full text-sm font-medium text-white bg-white/5 border border-white/10"
                  >
                    {bullet}
                  </span>
                ))}
              </div>

              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  className={`px-6 py-3 rounded-lg font-semibold text-white ${gradientClass} hover:opacity-90 transition shadow-lg`}
                >
                  Open Dashboard
                </button>
                <button className="px-6 py-3 rounded-lg font-medium text-white bg-white/5 hover:bg-white/10 border border-white/10 transition">
                  Learn More
                </button>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Right: Image */}
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={slide.key + "-img"}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              <TiltCard src={slide.img} alt={slide.title} />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation dots */}
        <div className="flex items-center justify-center gap-2 mt-10">
          {SLIDES.map((s, i) => (
            <Dot key={s.key} active={i === index} onClick={() => go(i)} />
          ))}
        </div>

        {/* Progress bar */}
        <div className="mt-6 h-1 w-full bg-white/5 rounded-full overflow-hidden">
          <motion.div
            key={index + (auto ? "-auto" : "-pause")}
            initial={{ width: 0 }}
            animate={{ width: auto ? "100%" : "0%" }}
            transition={{ duration: 6, ease: "linear" }}
            className={`h-full ${gradientClass}`}
          />
        </div>
      </div>
    </section>
  );
}
