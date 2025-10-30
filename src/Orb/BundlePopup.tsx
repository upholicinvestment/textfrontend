// src/components/marketing/BundlePromoModal.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";

// ---------- ASSETS ----------
import imgKhazana from "../../src/assets/khazana2.jpeg";
import imgKhata from "../../src/assets/tradejournal.jpg";
import imgFlow from "../../src/assets/summary1.jpeg";
import imgSimulator from "../../src/assets/algo.jpeg";

// Backtesting snapshots (three distinct files)
import btRes1 from "../../src/assets/snapshot1.jpeg";
import btRes2 from "../../src/assets/snapshots2.jpeg";
import btRes3 from "../../src/assets/snapshots3.jpeg";

// ---------- TYPES ----------
type Props = {
  hasBundle?: boolean;
  startDelayMs?: number;
  autoMs?: number;
};

type TrackPayload = Record<string, string | number | boolean | undefined>;

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
  }
}

// ---------- STORAGE / ANALYTICS ----------
const LS_KEY = "upholic_promo_state_v3";
const SS_SHOWN = "upholic_promo_session_shown";

const now = () => Date.now();
const readState = (): { snoozeUntil?: number } => {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? (JSON.parse(raw) as { snoozeUntil?: number }) : {};
  } catch {
    return {};
  }
};
const writeState = (patch: Partial<{ snoozeUntil?: number }>) => {
  try {
    const cur = readState();
    localStorage.setItem(LS_KEY, JSON.stringify({ ...cur, ...patch }));
  } catch {}
};
const setSnoozeDays = (days: number) =>
  writeState({ snoozeUntil: now() + days * 24 * 3600 * 1000 });
const sessionWasShown = () => {
  try {
    return sessionStorage.getItem(SS_SHOWN) === "1";
  } catch {
    return false;
  }
};
const markSessionShown = () => {
  try {
    sessionStorage.setItem(SS_SHOWN, "1");
  } catch {}
};
const track = (event: string, props?: TrackPayload) => {
  try {
    window.dataLayer?.push({ event, ...(props || {}) });
  } catch {}
};

// ---------- HELPERS ----------
function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    const m = window.matchMedia(query);
    const onChange = () => setMatches(m.matches);
    onChange();
    m.addEventListener("change", onChange);
    return () => m.removeEventListener("change", onChange);
  }, [query]);
  return matches;
}
function useIsMobile(): boolean {
  return useMediaQuery("(max-width: 640px)");
}
const isBelow1100 = () => window.matchMedia("(max-width: 1100px)").matches;

// Full-height image variants (Slide 2)
const bgVariants = {
  show: {
    x: "0%",
    opacity: 1,
    transition: { type: "spring", stiffness: 300, damping: 35, delay: 0.18 },
  },
  hide: {
    x: "-100%",
    opacity: 0,
    transition: { type: "spring", stiffness: 300, damping: 35, delay: 0 },
  },
};

// ---------- BACKTESTS GALLERY DATA ----------
type Tag = "Pro" | "Sniper" | "Starter";
type Shot = {
  src: string;
  title: string;
  tag: Tag;
  pf?: string;
  winRate?: string;
  tt?: string;
};

const SHOTS: Shot[] = [
  { src: btRes1, title: "Option Scalper PRO 1 lot Nifty Options", tag: "Pro", pf: "28.71", winRate: "66.67%", tt: "12" },
  { src: btRes2, title: "Sniper Algo 1 lot Nifty Options",        tag: "Sniper", pf: "1.47", winRate: "38.66%", tt: "432" },
  { src: btRes3, title: "Starter Scalping 1 lot Nifty Options",   tag: "Starter", pf: "1.28", winRate: "48.92%", tt: "830" },
];

// ---------- COMPONENT ----------
export default function BundlePromoModal({
  hasBundle = false,
  startDelayMs = 2000,
  autoMs = 4000,
}: Props) {
  const { pathname, search } = useLocation();
  const isMobile = useIsMobile();
  // initial narrow considers either <1100px OR explicit mobile breakpoint
  const [narrow, setNarrow] = useState<boolean>(() => isBelow1100() || isMobile);

  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<0 | 1>(0);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const autoRef = useRef<number | null>(null);

  // keep <1100px state live — also react to isMobile changes
  useEffect(() => {
    const onResize = () => setNarrow(isBelow1100() || isMobile);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [isMobile]);

  const forcePromo = useMemo(
    () => new URLSearchParams(search).get("forcePromo") === "1",
    [search]
  );

  const shouldBlock = useMemo(() => {
    if (forcePromo) return false;
    if (hasBundle) return true;
    if (/pricing|checkout|signup/i.test(pathname)) return true;
    if (sessionWasShown()) return true;
    const st = readState();
    if (st.snoozeUntil && now() < st.snoozeUntil) return true;
    return false;
  }, [pathname, hasBundle, forcePromo]);

  useEffect(() => {
    if (shouldBlock) return;
    const t = window.setTimeout(() => {
      setOpen(true);
      markSessionShown();
      track("promo_shown", { variant: "3in1_bundle", path: pathname });
    }, startDelayMs);
    return () => window.clearTimeout(t);
  }, [shouldBlock, pathname, startDelayMs]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (galleryOpen) return;
        setSnoozeDays(7);
        track("promo_dismiss", { via: "esc" });
        setOpen(false);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, galleryOpen]);

  useEffect(() => {
    if (!open) return;
    const tick = () => setStep((s) => (s === 0 ? 1 : 0));
    autoRef.current = window.setInterval(tick, autoMs) as unknown as number;
    return () => {
      if (autoRef.current) window.clearInterval(autoRef.current);
      autoRef.current = null;
    };
  }, [open, autoMs]);

  const closeAndSnooze = (via: string) => {
    setSnoozeDays(7);
    track("promo_dismiss", { via });
    setOpen(false);
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999]">
        {/* BACKDROP */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => closeAndSnooze("backdrop")}
          className="absolute inset-0 bg-[radial-gradient(1200px_800px_at_10%_10%,rgba(139,92,246,0.18),transparent),radial-gradient(900px_600px_at_90%_90%,rgba(99,102,241,0.18),transparent)] bg-black/60 backdrop-blur-sm"
        />

        {/* MODAL WRAPPER */}
        <div className="absolute inset-0 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 280, damping: 28 }}
            className="relative w-full max-w-[1100px]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="rounded-[24px] p-[2px] bg-gradient-to-br from-fuchsia-500 via-violet-600 to-indigo-600 shadow-[0_20px_70px_-20px_rgba(99,102,241,0.6)]">
              <div
                ref={rootRef}
                role="dialog"
                aria-modal="true"
                aria-label="Upholic promotions"
                // BELOW 1100px: make the WHOLE modal content scrollable with an invisible bar
                className={`relative bg-white rounded-[22px] overflow-hidden ${narrow ? "max-h-[88vh] overflow-y-auto" : ""}`}
                style={narrow ? { scrollbarWidth: "none" as any } : undefined}
              >
                {/* top glint */}
                <div className="absolute inset-x-0 -top-1 h-1 bg-gradient-to-r from-fuchsia-400 via-violet-500 to-indigo-500" />

                {/* Slide-2 FULL-HEIGHT LEFT IMAGE (desktop). Respect very small mobile via isMobile */}
                <motion.div
                  aria-hidden
                  initial={false}
                  animate={step === 1 ? "show" : "hide"}
                  variants={bgVariants}
                  className={`absolute inset-y-0 left-0 ${isMobile ? "hidden" : "lg:block"} w-1/2 z-0 pointer-events-none`}
                  style={{ willChange: "transform, opacity" }}
                >
                  <img src={imgSimulator} alt="Algo Strategies" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/20" />
                </motion.div>

                {/* HEADER */}
                <div
                  className={`relative px-5 sm:px-6 py-4 ${step === 1 ? "border-b-0" : "border-b border-slate-200"} bg-transparent z-10`}
                >
                  <div className="flex items-center justify-between gap-3">
                    {/* LEFT SLOT — stays reserved so the right side always hugs the right */}
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {step === 0 ? (
                        <span className="px-3 py-1.5 rounded-full text-[10px] sm:text-xs font-extrabold text-white bg-gradient-to-r from-fuchsia-600 via-violet-600 to-indigo-600 shadow-inner whitespace-nowrap">
                          3-in-1 Traders Essential Bundle
                        </span>
                      ) : null}
                    </div>

                    {/* RIGHT: slide-2 pill + dots + close — always on the right */}
                    <div className="flex items-center gap-2 sm:gap-3 flex-nowrap">
                      {step === 1 && (
                        <span className="px-3 py-1.5 rounded-full text-[10px] sm:text-xs font-extrabold text-white bg-gradient-to-r from-emerald-600 to-teal-600 shadow-inner whitespace-nowrap shrink-0">
                          Automated Algorithmic Trading Strategy Suite
                        </span>
                      )}
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => setStep(0)}
                          className={`h-2 rounded-full transition-all ${step === 0 ? "w-8 bg-violet-600" : "w-2 bg-slate-300"}`}
                          aria-label="Slide 1"
                        />
                        <button
                          onClick={() => setStep(1)}
                          className={`h-2 rounded-full transition-all ${step === 1 ? "w-8 bg-indigo-600" : "w-2 bg-slate-300"}`}
                          aria-label="Slide 2"
                        />
                      </div>
                      <button
                        onClick={() => closeAndSnooze("close")}
                        className="p-2 rounded-xl hover:bg-slate-100 transition-colors shrink-0"
                        aria-label="Close"
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-slate-600">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>

                {/* CONTENT AREA */}
                <div
                  className={`relative ${narrow ? "max-h-[calc(88vh-60px)] overflow-y-auto" : "h-[600px]"} bg-[radial-gradient(1200px_800px_at_-20%_-40%,rgba(244,114,182,0.08),transparent),radial-gradient(900px_600px_at_120%_120%,rgba(99,102,241,0.08),transparent)] z-10`}
                  style={narrow ? { scrollbarWidth: "none" as any } : undefined}
                >
                  <motion.div
                    className="flex h-full"
                    animate={{ x: step === 0 ? 0 : "-100%" }}
                    transition={{ type: "spring", stiffness: 300, damping: 35 }}
                  >
                    {/* SLIDE 1 */}
                    <div className="min-w-full h-full flex flex-col">
                      <div className="flex-1 px-4 sm:px-6 py-4 sm:py-6">
                        <div className="text-center mb-4 sm:mb-8 px-2">
                          <h2 className="text-[22px] sm:text-4xl font-black text-slate-900 mb-2 sm:mb-3 tracking-tight">
                            Trade Smarter. React Faster. Win Consistently.
                          </h2>
                          <p className="text-[13px] sm:text-lg text-slate-600 max-w-3xl mx-auto">
                            Three battle-tested tools bundled to build your edge — analytics, discipline, and execution.
                          </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-6 max-w-5xl mx-auto">
                          {/* FNO Khazana */}
                          <Link
                            to="/fno-khazana"
                            onClick={() => track("promo_click", { slot: "khazana" })}
                            className="group bg-white rounded-2xl border-2 border-slate-200 overflow-hidden hover:border-fuchsia-400 hover:shadow-xl transition-all duration-300"
                          >
                            <div className="h-36 sm:h-44 lg:h-52 overflow-hidden bg-slate-100">
                              <img src={imgKhazana} alt="FNO Khazana" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                            </div>
                            <div className="p-4 sm:p-5">
                              <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                                <h3 className="text-lg sm:text-xl font-black text-slate-900">FNO Khazana</h3>
                                <span className="px-2 py-1 rounded-lg bg-fuchsia-100 text-fuchsia-700 text-[10px] sm:text-xs font-bold">PRO</span>
                              </div>
                              <p className="text-[12px] sm:text-sm text-slate-600 mb-3 sm:mb-4">
                                Advanced options analytics — gamma walls, OI maps, and volatility cues.
                              </p>
                              <div className="flex items-center text-fuchsia-600 text-[12px] sm:text-sm font-semibold group-hover:translate-x-1 transition-transform">
                                Explore Tool →
                              </div>
                            </div>
                          </Link>

                          {/* Fiis/Diis */}
                          <Link
                            to="/fii-dii-fno-home"
                            onClick={() => track("promo_click", { slot: "flow" })}
                            className="group bg-white rounded-2xl border-2 border-slate-200 overflow-hidden hover:border-indigo-400 hover:shadow-xl transition-all duration-300"
                          >
                            <div className="h-36 sm:h-44 lg:h-52 overflow-hidden bg-slate-100">
                              <img src={imgFlow} alt="Flow Labs" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                            </div>
                            <div className="p-4 sm:p-5">
                              <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                                <h3 className="text-lg sm:text-xl font-black text-slate-900">FIIs/DIIs Data</h3>
                                <span className="px-2 py-1 rounded-lg bg-indigo-100 text-indigo-700 text-[10px] sm:text-xs font-bold">EDGE</span>
                              </div>
                              <p className="text-[12px] sm:text-sm text-slate-600 mb-3 sm:mb-4">
                                Track institutional flow — see where smart money leans, in real-time.
                              </p>
                              <div className="flex items-center text-indigo-600 text-[12px] sm:text-sm font-semibold group-hover:translate-x-1 transition-transform">
                                Explore Tool →
                              </div>
                            </div>
                          </Link>

                          {/* Trade Khata */}
                          <Link
                            to="/journaling"
                            onClick={() => track("promo_click", { slot: "khata" })}
                            className="group bg-white rounded-2xl border-2 border-slate-200 overflow-hidden hover:border-violet-400 hover:shadow-xl transition-all duration-300"
                          >
                            <div className="h-36 sm:h-44 lg:h-52 overflow-hidden bg-slate-100">
                              <img src={imgKhata} alt="TradeKhata" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                            </div>
                            <div className="p-4 sm:p-5">
                              <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                                <h3 className="text-lg sm:text-xl font-black text-slate-900">TradeKhata</h3>
                                <span className="px-2 py-1 rounded-lg bg-violet-100 text-violet-700 text-[10px] sm:text-xs font-bold">IQ</span>
                              </div>
                              <p className="text-[12px] sm:text-sm text-slate-600 mb-3 sm:mb-4">
                                Professional journal — P&L tracking, win-rate insights, discipline dashboards.
                              </p>
                              <div className="flex items-center text-violet-600 text-[12px] sm:text-sm font-semibold group-hover:translate-x-1 transition-transform">
                                Explore Tool →
                              </div>
                            </div>
                          </Link>
                        </div>
                      </div>

                      {/* CTA STRIP */}
                      <div className="px-4 sm:px-8 py-4 bg-gradient-to-r from-fuchsia-600 via-violet-600 to-indigo-600 text-white">
                        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center gap-3 sm:gap-6">
                          <div className="flex items-center gap-2 text-[12px] sm:text-sm font-semibold">
                            <span className="inline-flex items-center px-2 py-1 rounded-md bg-white/15">₹4,999/yr</span>
                            <span className="opacity-90">≈ ₹13/days</span>
                            <span className="hidden sm:inline opacity-90">• Decisions backed by live intelligence</span>
                          </div>
                          <div className="flex-1" />

                          <Link
                            to="/signup"
                            onClick={() => track("promo_cta", { cta: "trial_7d", product: "simulator" })}
                            className="px-6 py-3 rounded-xl text-[13px] sm:text-base font-black bg-white text-slate-900 hover:scale-[1.02] active:scale-[0.99] transition-transform shadow-[0_8px_30px_rgba(255,255,255,0.3)]"
                          >
                            Start 7-Days Free Trial
                          </Link>
                        </div>
                      </div>
                    </div>

                    {/* SLIDE 2 — AUTOMATED STRATEGIES */}
                    <div className="min-w-full h-full flex flex-col lg:flex-row relative">
                      {/* Mobile image — render only when isMobile true for a tiny perf win */}
                      {isMobile && (
                        <div className="w-full h-1/3 bg-slate-100 relative lg:hidden">
                          <img src={imgSimulator} alt="Algo Strategies" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/20" />
                        </div>
                      )}

                      {/* Right: Content (TOP-ALIGNED to remove bottom empty space) */}
                      <div className="w-full lg:w-1/2 lg:ml-auto p-4 sm:p-6 lg:p-4 flex flex-col justify-start bg-gradient-to-br from-slate-50 to-white">
                        <div className="mb-2 sm:mb-6">
                          <h2 className="text-[16px] sm:text-3xl font-black text-slate-900 mb-2 sm:mb-4 leading-tight">
                            Plug-and-Play Algos{" "}
                            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-600 via-violet-600 to-indigo-600">
                              Trade While You Focus
                            </span>
                          </h2>
                          <p className="text-[6px] sm:text-lg text-slate-600 leading-relaxed">
                            Three curated strategies—fully backtested—auto-execute entries, manage stops, book profits, and exit
                            cleanly. Built for precision, safety, and speed.
                          </p>
                        </div>

                        {/* Value bullets */}
                        <div className="space-y-3 sm:space-y-4 mb-2 sm:mb-8 text-left">
                          {[
                            {
                              c: "bg-violet-100 text-violet-600",
                              t1: "3 Strategy Pack",
                              t2: "Starter, Pro & Sniper variants—pick what fits your style",
                            },
                            {
                              c: "bg-indigo-100 text-indigo-600",
                              t1: "Risk Control Automation",
                              t2: "Daily loss caps, max trades, pause-on-drawdown safeguards",
                            },
                            {
                              c: "bg-cyan-100 text-cyan-600",
                              t1: "Low-Latency Alerts",
                              t2: "Fast signal dispatch with broker routing tuned for speed",
                            },
                            {
                              c: "bg-emerald-100 text-emerald-600",
                              t1: "Transparent Metrics",
                              t2: "Win-rate, PF, drawdown & live P&L dashboards you can trust",
                            },
                          ].map((b, i) => (
                            <div className="flex items-start gap-3" key={i}>
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${b.c}`}>
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                  <path
                                    fillRule="evenodd"
                                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              </div>
                              <div>
                                <div className="font-bold text-slate-900 text-[13px] sm:text-base">{b.t1}</div>
                                <div className="text-[12px] sm:text-sm text-slate-600">{b.t2}</div>
                              </div>
                            </div>
                          ))}
                          <Link
                            to="/algo-simulator"
                            onClick={() => track("promo_cta", { cta: "explore_tool", product: "simulator" })}
                            className="flex items-center text-violet-600 text-[12px] sm:text-sm font-semibold group hover:translate-x-1 transition-transform"
                          >
                            Explore Tool →
                          </Link>
                        </div>

                        {/* CTAs — Trial + Backtests */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <Link
                            to="/signup"
                            onClick={() => track("promo_cta", { cta: "trial_7d", product: "simulator" })}
                            className="w-full px-6 py-3.5 rounded-xl text-center font-black bg-gradient-to-r from-fuchsia-600 via-violet-600 to-indigo-600 text-white hover:shadow-xl hover:shadow-violet-500/30 transition-all"
                          >
                            Start 7-Days Free Trial
                          </Link>

                          <button
                            onClick={() => {
                              setGalleryOpen(true);
                              track("promo_cta", { cta: "backtest_results_modal", product: "simulator" });
                            }}
                            className="w-full px-6 py-3.5 rounded-xl text-center font-semibold border-2 border-slate-300 text-slate-700 hover:border-slate-400 hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                          >
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z" />
                              <circle cx="12" cy="12" r="3" />
                            </svg>
                            Backtesting Results
                          </button>
                        </div>

                        {/* Punchline */}
                        <div className="mt-3 text-[11px] sm:text-xs text-slate-500">
                          One platform, three strategies: <span className="font-semibold text-slate-700">automate risk</span>,{" "}
                          <span className="font-semibold text-slate-700">lock profits</span>,{" "}
                          <span className="font-semibold text-slate-700">exit clean</span>.
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* 🔍 Backtesting Gallery Modal — higher z so it never overlaps with slides */}
        <BacktestsModal open={galleryOpen} onClose={() => setGalleryOpen(false)} shots={SHOTS} />
      </div>
    </AnimatePresence>
  );
}

/* =========================
   Backtests Gallery Modal
   ========================= */
function BacktestsModal({
  open,
  onClose,
  shots,
}: {
  open: boolean;
  onClose: () => void;
  shots: Shot[];
}) {
  const TABS = [
    { key: "option_scalper_pro", label: "Option Scalper PRO" },
    { key: "sniper_algo", label: "Sniper Algo" },
    { key: "starter_scalping", label: "Starter Scalping" },
  ] as const;

  const [tab, setTab] = useState(0);
  const [hovering, setHovering] = useState(false);
  const autoRef = useRef<number | null>(null);

  // Lock scroll while modal open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Auto-rotate tabs (every 4s), pause on hover
  useEffect(() => {
    if (!open) return;
    if (hovering) {
      if (autoRef.current) window.clearInterval(autoRef.current);
      autoRef.current = null;
      return;
    }
    const tick = () => setTab((t) => (t + 1) % TABS.length);
    autoRef.current = window.setInterval(tick, 4000) as unknown as number;
    return () => {
      if (autoRef.current) window.clearInterval(autoRef.current);
      autoRef.current = null;
    };
  }, [open, hovering]);

  // Keyboard support: ESC only
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const cur = shots[tab];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[10050] bg-black/70 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <div className="absolute inset-0 flex items-center justify-center p-4" onClick={(e) => e.stopPropagation()}>
            <motion.div
              initial={{ opacity: 0, scale: 0.98, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 8 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="relative w-full max-w-6xl max-h-[86vh] rounded-2xl overflow-hidden bg-white shadow-2xl ring-1 ring-slate-200"
              onMouseEnter={() => setHovering(true)}
              onMouseLeave={() => setHovering(false)}
            >
              {/* Modal header */}
              <div className="flex items-center justify-between gap-3 px-5 py-3 border-b border-slate-200 bg-white">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1.5 rounded-full text-xs font-bold text-white bg-gradient-to-r from-fuchsia-600 to-indigo-600">
                    Backtesting Results
                  </span>
                </div>

                {/* Tabs + Pricing + Close */}
                <div className="flex items-center gap-2 flex-wrap justify-end">
                  {TABS.map((t, i) => (
                    <button
                      key={t.key}
                      onClick={() => setTab(i)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${
                        tab === i
                          ? "bg-gradient-to-r from-fuchsia-600 to-indigo-600 text-white"
                          : "bg-white border border-slate-200 text-slate-700 hover:border-slate-300"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                  <Link
                    to="/pricing"
                    className="px-4 py-2 rounded-full text-xs sm:text-sm font-semibold bg-gradient-to-r from-fuchsia-600 to-indigo-600 text-white hover:shadow-lg hover:shadow-violet-500/30 transition"
                  >
                    View Pricing →
                  </Link>
                  <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100" aria-label="Close">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-slate-700">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Viewer (fixed height; image fits via contain) */}
              <div className="relative p-4 sm:p-6 bg-[#fffefe]
bg-[radial-gradient(1150px_720px_at_10%_-12%,rgba(20,184,166,0.26),transparent),
radial-gradient(1000px_650px_at_92%_112%,rgba(139,92,246,0.24),transparent),
radial-gradient(900px_600px_at_8%_118%,rgba(59,130,246,0.20),transparent)]">

                <motion.div
                  key={cur.src + tab}
                  initial={{ opacity: 0, scale: 0.99 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.99 }}
                  transition={{ type: "spring", stiffness: 260, damping: 26 }}
                  className="relative mx-auto max-w-5xl"
                >
                  <div className="rounded-2xl overflow-hidden ring-1 ring-slate-200 bg-[#0f0f0f]">

                    <div className="relative w-full h-[56vh] bg-slate-900/5">
                      <img src={cur.src} alt={cur.title} className="absolute inset-0 w-full h-full object-contain" loading="lazy" />
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 p-4 min-h-[52px] bg-gradient-to-r from-fuchsia-600 via-violet-600 to-indigo-600 text-white">
                      <div className="text-white font-semibold">{cur.title}</div>
                      <div className="flex items-center gap-2 text-[11px] sm:text-xs">
                        <Pill>{cur.tag}</Pill>
                        {cur.pf && <Pill>PF {cur.pf}</Pill>}
                        {cur.winRate && <Pill>Win {cur.winRate}</Pill>}
                        {cur.tt && <Pill>TT {cur.tt}</Pill>}
                      </div>
                    </div>
                  </div>
                </motion.div>

                <div className="mt-4 flex items-center justify-center gap-2">
                  {TABS.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setTab(i)}
                      className={`w-2 h-2 rounded-full transition-all ${tab === i ? "w-6 bg-violet-600" : "bg-slate-300 hover:bg-slate-400"}`}
                      aria-label={`Go to ${TABS[i].label}`}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Pill({ children, dark = false }: React.PropsWithChildren<{ dark?: boolean }>) {
  return (
    <span className={`px-2 py-0.5 rounded-md ${dark ? "bg-white text-black" : "bg-white text-black"}`}>
      {children}
    </span>
  );
}
