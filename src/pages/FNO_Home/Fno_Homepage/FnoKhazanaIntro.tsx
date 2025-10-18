import React, { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Pause, Play, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";

import heroImg from "../../../assets/heatmap.jpg";
import heroImg1 from "../../../assets/advdec.jpg";
import heroImg2 from "../../../assets/volatility.jpg";
import heroImg3 from "../../../assets/callput.jpg";
import heroImg4 from "../../../assets/gamma.jpg";

type Slide = {
  key: "gex" | "velocity" | "advdec" | "callput" | "heatmap";
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
    title: "Gamma Levels",
    subtitle: "Gamma Exposure Map",
    description:
      "Identify dealer positioning zones that can pin prices or trigger volatility. Visualize walls and inflection points instantly. Use zero-gamma to frame directional bias and highlight likely pin levels by expiry.",
    bullets: ["Gamma extremes", "Reversal zones", "Support/resistance"],
    img: heroImg4,
    accentFrom: "from-indigo-500",
    accentTo: "to-purple-600",
  },
  {
    key: "velocity",
    title: "Volatility Index",
    subtitle: "Volatility Dynamics",
    description:
      "Track volatility regime shifts with a smooth curve and reference line. Monitor volume and delta patterns in real-time. It blends price velocity with realized variance to catch regime transitions early.",
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
      "Measure market participation strength. Confirm trend validity or spot early divergence signals. Breadth diffusion validates breakouts and often flags exhaustion before price does.",
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
      "Analyze call and put pressure across strikes and expirations. Track institutional positioning and sentiment shifts. Watch net pressure flip around key strikes and pair with OI change for confirmation.",
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
      "Visualize real-time market movements across sectors and stocks. Spot rotation patterns and identify leaders instantly. Drill into sectors to surface outliers and confirm momentum with breadth.",
    bullets: ["Sector strength", "Stock momentum", "Rotation signals"],
    img: heroImg,
    accentFrom: "from-orange-400",
    accentTo: "to-rose-500",
  },
];

const slideVariants = {
  enter: (direction: number) => ({ x: direction > 0 ? 60 : -60, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({ x: direction > 0 ? -60 : 60, opacity: 0 }),
};

const TiltCard: React.FC<{ src: string; alt: string }> = ({ src, alt }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState("");

  const onMove = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
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
        loading="lazy"
        className="w-full h-[220px] sm:h-[300px] md:h-[400px] object-cover"
        onError={(e) => {
          const el = e.currentTarget;
          el.style.display = "none";
          const fallback = document.createElement("div");
          fallback.className =
            "w-full h-[220px] sm:h-[300px] md:h-[400px] bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center text-white/40 text-sm";
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

const chartHash: Record<Slide["key"], string> = {
  gex: "#gex",
  velocity: "#velocity",
  advdec: "#advance-decline",
  callput: "#call-put",
  heatmap: "#heatmap",
};

export default function FnoKhazanaIntro() {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [auto, setAuto] = useState(true);
  const total = SLIDES.length;

  const go = useCallback(
    (i: number) => {
      setIndex((prev) => {
        const target = ((i % total) + total) % total;
        setDirection(target > prev || (prev === total - 1 && target === 0) ? 1 : -1);
        return target;
      });
    },
    [total]
  );

  const next = useCallback(() => go((index + 1) % total), [index, total, go]);
  const prev = useCallback(() => go((index - 1 + total) % total), [index, total, go]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "ArrowRight") next();
      if (e.code === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev]);

  useEffect(() => {
    if (!auto) return;
    const timer = setInterval(() => {
      if (!document.hidden) next();
    }, 6000);
    return () => clearInterval(timer);
  }, [auto, next, index]);

  const slide = SLIDES[index];
  const gradientClass = `bg-gradient-to-r ${slide.accentFrom} ${slide.accentTo}`;

  return (
    <section
      id="how-it-works"
      className="scroll-mt-32 md:scroll-mt-40 relative bg-gradient-to-b from-[#0a0e1a] to-[#0d1117] py-12 sm:py-16 md:py-24 overflow-hidden"
    >
      {/* BG accents */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(120,119,198,0.3),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(147,51,234,0.2),transparent_50%)]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 sm:mb-10">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${gradientClass}`}>
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <div className="leading-tight">
              <h3 className="text-[12px] sm:text-sm font-medium text-white/60">Explore Charts</h3>
              <p className="text-lg sm:text-xl font-bold text-white">Five Core F&amp;O Tools</p>
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
        <div className="grid md:grid-cols-12 gap-8 lg:gap-12 items-center min-h-[420px] sm:min-h-[480px]">
          {/* Left */}
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={slide.key}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="md:col-span-6 col-span-12 flex flex-col items-start"
            >
              <span className="self-start inline-flex items-center px-3 py-1 rounded-full text-[11px] sm:text-xs font-medium bg-white/6 text-white/70 border border-white/10">
                {slide.subtitle}
              </span>

              <h2 className="mt-3 text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white leading-tight md:leading-[1.1] break-words">
                {slide.title.toUpperCase()}
              </h2>

              <p className="mt-3 text-[15px] sm:text-base md:text-lg text-white/70 leading-relaxed md:leading-relaxed max-w-none md:max-w-[58ch] text-left">
                {slide.description}
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                {slide.bullets.map((bullet, i) => (
                  <span
                    key={i}
                    className="px-3 py-1.5 rounded-full text-[13px] sm:text-sm font-medium text-white bg-white/5 border border-white/10"
                  >
                    {bullet}
                  </span>
                ))}
              </div>

              <div className="mt-6 w-full sm:w-auto">
                <Link
                    to={`/fno-khazana-charts${chartHash[slide.key] ?? ""}`}
                    className={`inline-flex w-full sm:w-auto items-center justify-center px-6 py-3 rounded-lg font-semibold text-white ${gradientClass} hover:opacity-90 transition shadow-lg`}
                    aria-label={`Open dashboard at ${slide.title}`}
                  >
                  Open Dashboard
                </Link>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Right */}
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={slide.key + "-img"}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="md:col-span-6 col-span-12"
            >
              <TiltCard src={slide.img} alt={slide.title} />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Dots */}
        <div className="flex items-center justify-center gap-2 mt-8 sm:mt-10">
          {SLIDES.map((s, i) => (
            <Dot key={s.key} active={i === index} onClick={() => go(i)} />
          ))}
        </div>

        {/* Progress */}
        <div className="mt-6 h-1 w-full bg-white/5 rounded-full overflow-hidden" aria-hidden>
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
