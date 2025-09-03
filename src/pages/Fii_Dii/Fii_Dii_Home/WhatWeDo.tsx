// src/pages/About/WhatWeDo.tsx
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  FiTrendingUp,
  FiBarChart2,
  FiDatabase,
  FiPieChart,
  FiCheckCircle,
  FiList,
  FiBookOpen,
  FiTarget,
} from "react-icons/fi";
import stockImage from "../../../assets/analysis.jpg";   // analysis
import stock1Image from "../../../assets/Summary.jpg";     // summary
import stock2Image from "../../../assets/cashflow.jpg";    // cash

type Feature = {
  icon: React.ReactNode;
  title: string;
  description: string;
  color?: string;
  bgColor?: string;
};

type TabKey = "analysis" | "summary" | "cash";

type TabDef = {
  key: TabKey;
  label: string;
  badge: string;
  heading: string;
  subheading: string;
  imageAlt: string;
  imageSrc: string;
  features: Feature[]; // exactly 3 items per tab
};

const TABS: TabDef[] = [
  {
    key: "analysis",
    label: "Analysis",
    badge: "FII · DII Flow Engine",
    heading: "Institutional Flows",
    subheading:
      "Deep read of FII/DII behavior across cash, index futures, stock futures, and options — normalized with rolling stats to separate noise from signal.",
    imageAlt: "FII/DII Analysis Dashboard",
    imageSrc: stockImage,
    features: [
      {
        icon: <FiBarChart2 className="w-5 h-5" />,
        title: "Segment Contribution",
        description:
          "Cash vs index/stock futures with basis & OI context to see whether risk is being added or hedged.",
        color: "text-blue-500",
        bgColor: "bg-blue-500/10",
      },
      {
        icon: <FiDatabase className="w-5 h-5" />,
        title: "Rolling Trend & Regime",
        description:
          "5D/20D z-scores & percentile ranks to label regimes: accumulation, neutral, distribution — plus trajectory.",
        color: "text-emerald-500",
        bgColor: "bg-emerald-500/10",
      },
      {
        icon: <FiTrendingUp className="w-5 h-5" />,
        title: "Price–Flow Cohesion",
        description:
          "NIFTY/BANKNIFTY vs net flows with divergence flags so strong prices on weak flows don’t get over-trusted.",
        color: "text-amber-500",
        bgColor: "bg-amber-500/10",
      },
    ],
  },
  {
    key: "summary",
    label: "Summary",
    badge: "FII · DII Snapshot",
    heading: "Market Summary",
    subheading:
      "Quick, realistic view of institutional participation: what’s being bought/sold, where breadth sits, and how the last few sessions stack up.",
    imageAlt: "FII/DII Summary View",
    imageSrc: stock1Image,
    features: [
      {
        icon: <FiPieChart className="w-5 h-5" />,
        title: "Today at a Glance",
        description:
          "FII cash mild buy/sell, DII counter-flows, and combined net impact — with delivery-based quality tags.",
        color: "text-blue-500",
        bgColor: "bg-blue-500/10",
      },
      {
        icon: <FiList className="w-5 h-5" />,
        title: "Leaders & Laggards",
        description:
          "Banks/Auto/IT/Metals/FMCG — persistent inflow vs steady supply across 1D/5D/20D windows.",
        color: "text-emerald-500",
        bgColor: "bg-emerald-500/10",
      },
      {
        icon: <FiBookOpen className="w-5 h-5" />,
        title: "Contextual Notes",
        description:
          "ETF creations/redemptions, block deals, and event-day anomalies so mechanical prints don’t skew the read.",
        color: "text-amber-500",
        bgColor: "bg-amber-500/10",
      },
    ],
  },
  {
    key: "cash",
    label: "Cash",
    badge: "Cash Market Lens",
    heading: "Cash Market Detail",
    subheading:
      "Granular cash data with intraday build-up, delivery %, and breadth. Designed to judge quality of buying/selling — not just the headline print.",
    imageAlt: "FII/DII Cash Market",
    imageSrc: stock2Image,
    features: [
      {
        icon: <FiBarChart2 className="w-5 h-5" />,
        title: "Intraday Build-up",
        description:
          "Cumulative profile across the session with opening vs closing pressure markers to spot conviction.",
        color: "text-blue-500",
        bgColor: "bg-blue-500/10",
      },
      {
        icon: <FiCheckCircle className="w-5 h-5" />,
        title: "Delivery Overlay",
        description:
          "Delivery spikes & rolling means to separate durable accumulation from intraday churn.",
        color: "text-emerald-500",
        bgColor: "bg-emerald-500/10",
      },
      {
        icon: <FiTarget className="w-5 h-5" />,
        title: "Breadth Linkages",
        description:
          "Advance/decline and sector breadth aligned with cash prints across the market-cap curve.",
        color: "text-amber-500",
        bgColor: "bg-amber-500/10",
      },
    ],
  },
];

const AUTO_ROTATE_MS = 4000;

export default function WhatWeDo() {
  const [active, setActive] = useState<TabKey>("analysis");
  const [paused, setPaused] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  // Respect user's OS "reduce motion" setting
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mql = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    const update = () => setReduceMotion(!!mql?.matches);
    update();
    mql?.addEventListener?.("change", update);
    // @ts-ignore (Safari legacy)
    mql?.addListener && mql.addListener(update);
    return () => {
      mql?.removeEventListener?.("change", update);
      // @ts-ignore (Safari legacy)
      mql?.removeListener && mql.removeListener(update);
    };
  }, []);

  // Auto-rotate tabs (no hover pause; only pause on keyboard focus)
  useEffect(() => {
    if (paused || reduceMotion || document.hidden) return;
    const id = setInterval(() => {
      setActive((prev) => {
        const i = TABS.findIndex((t) => t.key === prev);
        const next = (i + 1) % TABS.length;
        return TABS[next].key;
      });
    }, AUTO_ROTATE_MS);
    return () => clearInterval(id);
  }, [paused, reduceMotion, active]);

  const tab = TABS.find((t) => t.key === active)!;

  const highlight =
    active === "analysis" ? "Flows Intelligence" :
    active === "summary"  ? "Snapshot" :
                             "Cash Activity";

  return (
    <section
      className="bg-gradient-to-br from-gray-900 to-gray-800 py-24 px-6 text-white relative overflow-hidden"
      /* removed onMouseEnter/Leave so hover won't pause */
    >
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden -z-10 pointer-events-none">
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
            {tab.heading}{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
              {highlight}
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
                  className={`px-3 md:px-5 py-2 rounded-lg text-sm font-medium transition-all ${
                    selected
                      ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow"
                      : "text-gray-300 hover:text-white"
                  }`}
                  aria-selected={selected}
                  onFocus={() => setPaused(true)}
                  onBlur={() => setPaused(false)}
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
            {/* Image — clean */}
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
                  className="absolute inset-0 bg-gradient-to-t from-gray-900/60 via-gray-900/20 to-transparent"
                />
              </div>
            </motion.div>

            {/* Features (3 points) */}
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
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
