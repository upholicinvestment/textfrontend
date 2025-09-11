// src/pages/About/WhatWeDo.tsx
import { useContext, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  FiTrendingUp,
  FiBarChart2,
  FiDatabase,
  FiShield,
  FiPieChart,
  FiCheckCircle,
  FiList,
  FiBookOpen,
  FiTarget,
  FiTag,
} from "react-icons/fi";
import stockImage from "../../../assets/tradejournal.jpg";   // dashboard
import stock1Image from "../../../assets/tradedetails.jpg";  // details
import stock2Image from "../../../assets/dailyjournal.jpg";  // daily
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../../context/AuthContext";
import api from "../../../api";

/* -------------------- Entitlement keys (ONLY keys; no fuzzy tokens) -------------------- */
const JOURNAL_KEYS = new Set([
  "journaling_solo",
  "smart_journaling",
  "journaling",
  "trade_journal",
  "trading_journal_pro",
]);

// Any of these bundle keys should also unlock /journal
const BUNDLE_KEYS = new Set([
  "essentials_bundle",
  "essentials",
  "trader_essentials",
  "bundle",
]);

/* -------------------- Robust key extraction (handles variant.key & variants[]) -------------------- */
function extractKeys(anyObj: any): string[] {
  const out: string[] = [];

  const push = (x: any) => {
    if (!x) return;

    if (typeof x === "string") {
      out.push(x);
      return;
    }

    if (typeof x === "object") {
      const single =
        x?.variant?.key ??
        x?.key ??
        x?.productKey ??
        x?.slug ??
        x?.route ??
        x?.code ??
        x?.id ??
        (typeof x?.name === "string" ? x.name : undefined);
      if (single) out.push(single);

      if (Array.isArray(x?.variants)) {
        for (const v of x.variants) {
          if (v?.key) out.push(v.key);
        }
      }
    }
  };

  if (!anyObj) return out;

  const pools = [
    anyObj.products,
    anyObj.activeProducts,
    anyObj.entitlements,
    anyObj.purchases,
    anyObj.subscriptions,
    anyObj.bundles,
    anyObj.modules,
    anyObj.features,
    anyObj.items,
  ].filter(Boolean);

  for (const p of pools) {
    if (Array.isArray(p)) p.forEach(push);
    else push(p);
  }

  return out
    .filter(Boolean)
    .map((s) => String(s).toLowerCase());
}

function keysGrantJournal(keys: string[]): boolean {
  return keys.some((k) => JOURNAL_KEYS.has(k)) || keys.some((k) => BUNDLE_KEYS.has(k));
}

/* -------------------- Types -------------------- */
type Feature = {
  icon: React.ReactNode;
  title: string;
  description: string;
  color?: string;
  bgColor?: string;
};

type TabDef = {
  key: "dashboard" | "daily" | "details";
  label: string;
  badge: string;
  heading: string;
  subheading: string;
  imageAlt: string;
  imageSrc: string;
  statBL: { title: string; value: string; delta?: string; tint: "blue" | "purple" | "emerald" };
  statTR: { title: string; value: string; delta?: string; tint: "blue" | "purple" | "emerald" };
  features: Feature[];
  cta: string;
};

const TABS: TabDef[] = [
  {
    key: "dashboard",
    label: "Journal Dashboard",
    badge: "TradeKhata Suite",
    heading: "Institutional-Grade",
    subheading:
      "Upload your orderbook to get instant stats: win-rate, PnL, R:R, best/worst days, streaks, and an equity/PNL line graph with good vs bad trades.",
    imageAlt: "Journal Dashboard",
    imageSrc: stockImage,
    statBL: { title: "WIN RATE", value: "62%", delta: "+2%", tint: "blue" },
    statTR: { title: "AVG R:R", value: "1.8", delta: "+0.2", tint: "purple" },
    features: [
      {
        icon: <FiBarChart2 className="w-5 h-5" />,
        title: "Stats & Graphs",
        description:
          "Equity curve, PnL heatmap, streaks, session splits, day-of-week performance, and volatility context.",
        color: "text-blue-500",
        bgColor: "bg-blue-500/10",
      },
      {
        icon: <FiPieChart className="w-5 h-5" />,
        title: "Good vs Bad Trades",
        description:
          "Auto-tags based on plan adherence, R multiple, and drawdown profile—see what to repeat vs avoid.",
        color: "text-emerald-500",
        bgColor: "bg-emerald-500/10",
      },
      {
        icon: <FiTrendingUp className="w-5 h-5" />,
        title: "Macro View",
        description:
          "Roll-up metrics by strategy, tag, instrument, and timeframe to spot which edges truly pay.",
        color: "text-amber-500",
        bgColor: "bg-amber-500/10",
      },
      {
        icon: <FiShield className="w-5 h-5" />,
        title: "Risk Discipline",
        description:
          "Position sizing and SL/TP discipline checks to keep drawdowns controlled.",
        color: "text-purple-500",
        bgColor: "bg-purple-500/10",
      },
    ],
    cta: "Open TradeKhata",
  },
  {
    key: "daily",
    label: "Daily Journal",
    badge: "Trade Journal Suite",
    heading: "Plan → Execute → Improve",
    subheading:
      "Plan trades with bias, setup, entry/SL/TP, and risk. After upload, we auto-match fills to plans and surface insights and improvements.",
    imageAlt: "Daily Journal",
    imageSrc: stock2Image,
    statBL: { title: "MATCHED TRADES", value: "100%", delta: "+5%", tint: "emerald" },
    statTR: { title: "COMPLIANCE", value: "88%", delta: "+7%", tint: "purple" },
    features: [
      {
        icon: <FiBookOpen className="w-5 h-5" />,
        title: "Structured Planning",
        description:
          "Pre-trade context: bias, checklist, confluence, levels, invalidation, and risk allocation.",
        color: "text-blue-500",
        bgColor: "bg-blue-500/10",
      },
      {
        icon: <FiCheckCircle className="w-5 h-5" />,
        title: "Plan vs Execution",
        description:
          "We link fills to the planned idea and score execution quality—timing, slippage, deviation.",
        color: "text-emerald-500",
        bgColor: "bg-emerald-500/10",
      },
      {
        icon: <FiTarget className="w-5 h-5" />,
        title: "Insights & Actions",
        description:
          "Daily summary with focus items: tighten SL discipline, avoid chase entries, size within limits.",
        color: "text-amber-500",
        bgColor: "bg-amber-500/10",
      },
      {
        icon: <FiShield className="w-5 h-5" />,
        title: "Process Guardrails",
        description:
          "Session filters, cooldowns, and max-loss checks to enforce routine.",
        color: "text-purple-500",
        bgColor: "bg-purple-500/10",
      },
    ],
    cta: "Open TradeKhata",
  },
  {
    key: "details",
    label: "Trade Details",
    badge: "Trade Journal Suite",
    heading: "Round-Trip Trade Details",
    subheading:
      "Tabular deep-dive—entries, exits, size, fees, MFE/MAE, tags, screenshots—plus per-trade stats and performance for fast review.",
    imageAlt: "Trade Details",
    imageSrc: stock1Image,
    statBL: { title: "AVG HOLD", value: "12m", tint: "blue" },
    statTR: { title: "MFE / MAE", value: "+0.9R / -0.5R", tint: "purple" },
    features: [
      {
        icon: <FiList className="w-5 h-5" />,
        title: "Round-Trip Table",
        description:
          "Lifecycle per trade: timestamps, fills, quantity, fees, realized R, notes/screenshots.",
        color: "text-blue-500",
        bgColor: "bg-blue-500/10",
      },
      {
        icon: <FiDatabase className="w-5 h-5" />,
        title: "Per-Trade Metrics",
        description:
          "R multiple, MFE/MAE, excursion charts, and adverse flags to judge management quality.",
        color: "text-emerald-500",
        bgColor: "bg-emerald-500/10",
      },
      {
        icon: <FiTag className="w-5 h-5" />,
        title: "Filters & Export",
        description:
          "Filter by tag/strategy/instrument, save views, export CSV for audits and analysis.",
        color: "text-amber-500",
        bgColor: "bg-amber-500/10",
      },
      {
        icon: <FiShield className="w-5 h-5" />,
        title: "Quality Gates",
        description:
          "Flag outliers, revenge trades, and over-sizing to tighten feedback loops.",
        color: "text-purple-500",
        bgColor: "bg-purple-500/10",
      },
    ],
    cta: "Open TradeKhata",
  },
];

const tintMap: Record<"blue" | "purple" | "emerald", string> = {
  blue: "text-blue-400",
  purple: "text-purple-400",
  emerald: "text-emerald-400",
};

export default function WhatWeDo() {
  const [active, setActive] = useState<TabDef["key"]>("dashboard");
  const tab = TABS.find((t) => t.key === active)!;

  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [hasJournalAccess, setHasJournalAccess] = useState<boolean | null>(null);
  const checkingRef = useRef(false);

  // Fast local check: sticky success + user + cached user
  useEffect(() => {
    let decided = false;

    // Sticky from earlier in the session: short-circuit to true
    if (sessionStorage.getItem("hasJournalAccess") === "true") {
      setHasJournalAccess(true);
      decided = true;
    }

    const tryLocal = (payload: any) => {
      if (decided || !payload) return;
      const keys = extractKeys(payload);
      if (keysGrantJournal(keys)) {
        setHasJournalAccess(true);
        sessionStorage.setItem("hasJournalAccess", "true"); // cache positive only
        decided = true;
      }
    };

    tryLocal(user);
    try {
      const cached = JSON.parse(localStorage.getItem("user") || "null");
      tryLocal(cached);
    } catch {
      /* ignore */
    }

    if (!decided) setHasJournalAccess(null);
  }, [user]);

  // Live check — prefer entitlement endpoints; fallback to /users/me
  const doLiveCheck = async (): Promise<boolean> => {
    if (checkingRef.current) return hasJournalAccess === true;
    checkingRef.current = true;

    // if sticky already true, don't call backend again
    if (sessionStorage.getItem("hasJournalAccess") === "true") {
      setHasJournalAccess(true);
      checkingRef.current = false;
      return true;
    }

    const grant = () => {
      setHasJournalAccess(true);
      sessionStorage.setItem("hasJournalAccess", "true");
      checkingRef.current = false;
      return true;
    };
    const deny = () => {
      setHasJournalAccess(false);
      checkingRef.current = false;
      return false;
    };

    const endpoints = [
      "/users/me/products",     // preferred
      "/users/me/subscriptions",
      "/billing/active-products",
      "/users/me",              // fallback
      "/account",               // last resort
    ];

    for (const url of endpoints) {
      try {
        const r = await api.get(url);
        const keys = extractKeys(r.data);
        if (keysGrantJournal(keys)) return grant();
      } catch {
        // continue to next endpoint
      }
    }
    return deny();
  };

  const handleCTA = async () => {
    // If not logged in, straight to signup
    const hasToken = !!localStorage.getItem("token");
    if (!user && !hasToken) {
      navigate("/signup?productKey=journaling_solo");
      return;
    }

    // Known access (bundle or journaling) → /journal
    if (hasJournalAccess === true) {
      navigate("/journal");
      return;
    }

    // Live verify if unknown or false (now checks bundle too)
    const ok = await doLiveCheck();
    if (ok) navigate("/journal");
    else navigate("/signup?productKey=journaling_solo");
  };

  return (
    <section className="bg-gradient-to-br from-gray-900 to-gray-800 py-24 px-6 text-white relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden -z-10">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 0.1 }}
          transition={{ duration: 1 }}
          className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-blue-500 filter blur-3xl"
        />
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 0.1 }}
          transition={{ duration: 1, delay: 0.3 }}
          className="absolute bottom-1/3 right-1/4 w-72 h-72 rounded-full bg-purple-500 filter blur-3xl"
        />
      </div>

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="mb-10 text-center"
        >
          <span className="inline-block text-sm uppercase tracking-wider text-blue-400 font-medium bg-blue-900/30 px-4 py-1 rounded-full mb-4">
            {tab.badge}
          </span>
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-center">
            {tab.heading.replace("Institutional-Grade", "Institutional-Grade")}{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
              {tab.key === "dashboard"
                ? "Market Intelligence"
                : tab.key === "daily"
                ? "Daily Planning"
                : "Performance Review"}
            </span>
          </h2>
          <p className="text-gray-400 text-lg max-w-3xl mx-auto text-center">
            {tab.subheading}
          </p>
        </motion.div>

        {/* Tab Switcher */}
        <div className="flex justify-center mb-12">
          <div className="inline-flex bg-gray-900/60 border border-gray-700 rounded-xl p-1">
            {TABS.map((t) => {
              const selected = t.key === active;
              return (
                <button
                  key={t.key}
                  onClick={() => setActive(t.key)}
                  className={`px-4 md:px-6 py-2 rounded-lg text-sm font-medium transition-all ${
                    selected
                      ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow"
                      : "text-gray-300 hover:text-white"
                  }`}
                  aria-selected={selected}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Slide (one at a time) */}
        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.35 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center"
          >
            {/* Image */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="relative rounded-xl overflow-hidden shadow-2xl border border-gray-700/50">
                <img
                  src={tab.imageSrc}
                  alt={tab.imageAlt}
                  className="w-full h-auto object-cover"
                />
                <motion.div
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ delay: 0.5, duration: 1 }}
                  className="absolute inset-0 bg-gradient-to-t from-gray-900/70 via-gray-900/30 to-transparent"
                />
              </div>

              {/* Floating stats */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.8 }}
                className="absolute bottom-0 left-0 md:-bottom-6 md:-left-6 bg-gray-800 border border-gray-700 rounded-lg p-3 md:p-4 shadow-lg w-32 md:w-40 transform translate-y-4 md:translate-y-0"
              >
                <div className={`${tintMap[tab.statBL.tint]} text-xs font-medium mb-1`}>
                  {tab.statBL.title}
                </div>
                <div className="text-white font-bold text-sm md:text-base">
                  {tab.statBL.value}{" "}
                  {tab.statBL.delta ? (
                    <span className="text-emerald-400 text-xs md:text-sm">
                      {tab.statBL.delta}
                    </span>
                  ) : null}
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.8 }}
                className="absolute top-0 right-0 md:-top-6 md:-right-6 bg-gray-800 border border-gray-700 rounded-lg p-3 md:p-4 shadow-lg w-32 md:w-40 transform -translate-y-4 md:translate-y-0"
              >
                <div className={`${tintMap[tab.statTR.tint]} text-xs font-medium mb-1`}>
                  {tab.statTR.title}
                </div>
                <div className="text-white font-bold text-sm md:text-base">
                  {tab.statTR.value}{" "}
                  {tab.statTR.delta ? (
                    <span className="text-emerald-400 text-xs md:text-sm">
                      {tab.statTR.delta}
                    </span>
                  ) : null}
                </div>
              </motion.div>
            </motion.div>

            {/* Features + CTA */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="space-y-8"
            >
              {tab.features.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.15, duration: 0.6 }}
                  viewport={{ once: true }}
                  className="flex items-start gap-5 p-4 rounded-xl hover:bg-gray-800/50 transition-colors"
                >
                  <div
                    className={`p-3 rounded-lg ${
                      item.bgColor ?? "bg-gray-700/30"
                    } ${item.color ?? "text-blue-300"}`}
                  >
                    {item.icon}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2 text-left">
                      {item.title}
                    </h3>
                    <p className="text-gray-400 text-sm leading-relaxed text-left">
                      {item.description}
                    </p>
                  </div>
                </motion.div>
              ))}

              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ delay: 0.8, duration: 0.6 }}
                viewport={{ once: true }}
                className="pt-6 text-left"
              >
                <button
                  onClick={handleCTA}
                  className="px-8 py-3 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium hover:opacity-90 transition-opacity shadow-lg"
                  aria-label="Open TradeKhata"
                >
                  {tab.cta}
                </button>
              </motion.div>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
