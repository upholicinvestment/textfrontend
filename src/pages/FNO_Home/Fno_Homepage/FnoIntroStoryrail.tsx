// src/components/FnoIntroStoryrail.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Target, Gauge, Activity, Zap, Grid3X3 as Grid3x3,
  ChevronRight, CheckCircle2, Eye, Lightbulb, ArrowRight
} from "lucide-react";

type Feature = {
  key: "gex" | "velocity" | "advdec" | "callput" | "heatmap";
  title: string;
  blurb: string;
  from: string; // Tailwind gradient start
  to: string;   // Tailwind gradient end
  icon: React.ReactNode;
  line: string;
  inputs: string[];
  shows: string[];
  signals: string[];
  uses: string[];
};

const FEATURES: Feature[] = [
  {
    key: "gex",
    title: "GEX Levels",
    blurb:
      "Map positive/negative gamma by strike & expiry to see where dealers are likely to absorb or amplify price moves. Identify walls, flip zones, and migrating clusters that shape intraday behavior.",
    from: "from-indigo-500",
    to: "to-fuchsia-500",
    icon: <Target className="h-5 w-5" />,
    line: "Gamma map of the battlefield",
    inputs: ["Option Chain OI", "Per-strike Γ", "Spot"],
    shows: [
      "Max Γ call/put walls + zero-gamma flip zone",
      "Spot distance to nearest wall (pin/break risk)",
      "Strike clusters & wall migration across time",
      "Net Γ regime (pos/neg) and expected volatility",
    ],
    signals: [
      "Spot presses a thick wall → pin/range odds ↑",
      "Wall collapses or shifts → breakout odds ↑",
      "Flip to net negative Γ → volatility expansion",
      "Spot between weak walls → mean-revert risk",
    ],
    uses: [
      "Frame targets/invalidations around walls",
      "Avoid chop when pinned; size up on clean breaks",
      "Time entries with wall migration & expiry flow",
      "Pick strikes to sell near strong walls",
    ],
  },
  {
    key: "velocity",
    title: "Velocity Index",
    blurb:
      "A smoothed volatility curve with a movable reference line. Feel regime shifts as volume/delta stacks rotate around your reference.",
    from: "from-violet-500",
    to: "to-sky-500",
    icon: <Gauge className="h-5 w-5" />,
    line: "Vol regimes at a glance",
    inputs: ["Intraday Vol Proxy", "Volume/Δ splits", "Reference price"],
    shows: [
      "Smoothed vol curve & slope",
      "Reference reclaims/rejects",
      "Volume/Δ stacks above vs. below ref",
      "Regime tags: Calm / Elevated / Wild",
    ],
    signals: [
      "Curve bases & turns up → risk-on impulse",
      "Ref reclaim + rising slope → trend start",
      "Price up but velocity down → fade risk",
      "Slope flattens after spike → cool-off window",
    ],
    uses: [
      "Choose regime (trend vs mean-revert)",
      "Enter on ref reclaims; exit on slope loss",
      "Switch exits: ATR/EMA in trends, VWAP in chop",
      "Throttle size by regime tag",
    ],
  },
  {
    key: "advdec",
    title: "Advance / Decline",
    blurb:
      "Breadth confirms or contradicts price. Track participation to avoid chasing tops and selling bottoms; monitor thrusts and fades that precede turns.",
    from: "from-emerald-500",
    to: "to-teal-400",
    icon: <Activity className="h-5 w-5" />,
    line: "Market pulse & participation",
    inputs: ["Universe ticks", "Adv/Dec counts", "Opening basis"],
    shows: [
      "Advancing vs. declining share %",
      "AD ratio, momentum bursts & persistence",
      "Session bias vs. open (above/below)",
      "Extremes & reversal thresholds",
    ],
    signals: [
      "Breadth expands with price → healthy trend",
      "Price up but breadth fades → exhaustion",
      "Breadth flips at extremes → reversal setup",
      "Persistent negative breadth → stay defensive",
    ],
    uses: [
      "Filter breakouts by participation quality",
      "Trim into rallies with weak breadth",
      "Scale when breadth thrusts confirm",
      "Gauge when to hedge or de-risk",
    ],
  },
  {
    key: "callput",
    title: "Call–Put Dynamics",
    blurb:
      "See where PUTs defend and CALLs cap. Follow pressure shifts across expiries and strikes to anticipate intraday flows and rollover behavior.",
    from: "from-sky-500",
    to: "to-amber-500",
    icon: <Zap className="h-5 w-5" />,
    line: "Pressure clusters by strike",
    inputs: ["OI by strike/expiry", "Volume", "CPR"],
    shows: [
      "CPR ladders across expiries",
      "Fresh OI additions/covering",
      "Defense at key round strikes",
      "Rollover/expiry rotation cues",
    ],
    signals: [
      "PUT defense + CPR < 1 → bounce odds ↑",
      "CALL caps + CPR > 1.2 → overhead supply",
      "OI jumps to next expiry → flow rotation",
      "Symmetry breaks in ladder → directional push",
    ],
    uses: [
      "Bias intraday direction via ladder tilt",
      "Pick strikes to sell into pressure",
      "Front-run flows at rollover",
      "Locate traps near crowded strikes",
    ],
  },
  {
    key: "heatmap",
    title: "Market Heat Map",
    blurb:
      "A living mosaic of sector strength/weakness. Spot rotations, persistent leadership, and mean-revert pockets instantly.",
    from: "from-lime-400",
    to: "to-rose-500",
    icon: <Grid3x3 className="h-5 w-5" />,
    line: "Rotation & persistence",
    inputs: ["Live % change", "Sector grouping", "Breadth by group"],
    shows: [
      "Sector/stock tiles with % change & breadth",
      "Intraday persistence vs. snapbacks",
      "Leader/laggard boards & clusters",
      "Cross-sector wave detection",
    ],
    signals: [
      "Sustained sector dominance → trend baskets",
      "Cross-sector reversal wave → broad turn",
      "Isolated outliers → event-driven trades",
      "Breadth shifts inside sectors → rotation start",
    ],
    uses: [
      "Thematic entries (sector baskets)",
      "Hedge selection (short laggards)",
      "Quick scan for opportunities",
      "Confirm strength behind index moves",
    ],
  },
];

const Chip: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="inline-flex items-center rounded-full bg-white/5 px-2.5 py-1 text-xs text-slate-200 border border-white/10">
    {children}
  </span>
);

const SectionList: React.FC<{ items: string[]; icon: React.ReactNode; title: string }> = ({
  items,
  icon,
  title,
}) => (
  <div>
    <div className="mb-2 flex items-center gap-2 text-xs tracking-wide text-slate-400 uppercase">
      {icon}
      <span>{title}</span>
    </div>
    <ul className="space-y-1.5">
      {items.map((t, i) => (
        <li key={i} className="flex gap-2 text-slate-200">
          <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-slate-400/60" />
          <span className="text-[15px] leading-relaxed">{t}</span>
        </li>
      ))}
    </ul>
  </div>
);

const FnoIntroStoryrail: React.FC = () => {
  const [active, setActive] = useState(0);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Track which panel is most visible
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        const vis = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (vis[0]) {
          const idx = Number((vis[0].target as HTMLElement).dataset.index);
          setActive(idx);
        }
      },
      { threshold: [0.25, 0.5, 0.75] }
    );
    itemRefs.current.forEach((el) => el && obs.observe(el));
    return () => obs.disconnect();
  }, []);

  const accent = useMemo(
    () => `bg-gradient-to-r ${FEATURES[active].from} ${FEATURES[active].to}`,
    [active]
  );

  const scrollTo = (i: number) =>
    itemRefs.current[i]?.scrollIntoView({ behavior: "smooth", block: "center" });

  return (
    <section className="relative isolate bg-[#0b1220] text-white">
      <div className="mx-auto max-w-7xl px-6 grid grid-cols-1 md:grid-cols-12 gap-10 py-14 md:py-20">
        {/* Left rail (sticky) */}
        <div className="md:col-span-4 md:sticky md:top-24 self-start">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/[0.04] px-3 py-1 border border-white/10 text-sm text-slate-200">
            <span className={`inline-block h-2 w-2 rounded-full ${accent}`} />
            5 Signals • 1 Dashboard
          </div>

          <h2 className="mt-4 text-3xl md:text-5xl font-extrabold leading-tight">
            Clean insights for{" "}
            <span className={`bg-clip-text text-transparent ${accent}`}>confident</span> decisions.
          </h2>

          <p className="mt-3 text-slate-300">
            FNO Khazana distills options flow, breadth, and volatility into five focused visuals.
            Scroll the highlights →
          </p>

          {/* Simple nav pills */}
          <div className="mt-6 flex flex-wrap gap-2">
            {FEATURES.map((f, i) => {
              const on = i === active;
              return (
                <button
                  key={f.key}
                  onClick={() => scrollTo(i)}
                  className={`rounded-full px-3 py-1.5 text-sm transition border
                    ${on ? "border-white/25 bg-white/[0.06] text-white" : "border-white/10 text-slate-300 hover:bg-white/[0.04]"}`}
                >
                  {f.title}
                </button>
              );
            })}
          </div>

          {/* CTA */}
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/fno-khazana-charts"
              className={`inline-flex items-center gap-2 rounded-full px-5 py-3 font-semibold ${accent} text-white hover:brightness-110 transition`}
            >
              Launch Live Dashboard <ChevronRight className="h-5 w-5" />
            </Link>
            <Link
              to="/docs/fno-khazana"
              className="inline-flex items-center rounded-full px-5 py-3 font-medium bg-white/[0.06] text-slate-200 border border-white/10 hover:bg-white/[0.08]"
            >
              How it works
            </Link>
          </div>
        </div>

        {/* Right rail: clean panels (no images) */}
        <div className="md:col-span-8 space-y-8">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.key}
              ref={(el) => { itemRefs.current[i] = el; }}
              data-index={i}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, amount: 0.45 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]"
            >
              {/* Hairline accent */}
              <div className={`absolute top-0 left-0 right-0 h-px opacity-70 bg-gradient-to-r ${f.from} ${f.to}`} />

              <div className="p-6 md:p-7">
                <div className="flex items-center gap-2 text-slate-300">
                  <span className={`inline-flex items-center justify-center rounded-md p-1.5 text-white bg-gradient-to-r ${f.from} ${f.to}`}>
                    {f.icon}
                  </span>
                  <span className="text-xs">{f.line}</span>
                </div>

                <h3 className="mt-2 text-2xl md:text-3xl font-semibold tracking-tight">{f.title}</h3>
                <p className="mt-2 text-slate-300 max-w-4xl leading-relaxed">{f.blurb}</p>

                {/* Inputs */}
                <div className="mt-4 flex flex-wrap gap-2">
                  {f.inputs.map((x, idx) => (
                    <Chip key={idx}>{x}</Chip>
                  ))}
                </div>

                {/* Three columns */}
                <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <SectionList
                    title="What it shows"
                    icon={<CheckCircle2 className="h-4 w-4 text-slate-400" />}
                    items={f.shows}
                  />
                  <SectionList
                    title="Signals to watch"
                    icon={<Eye className="h-4 w-4 text-slate-400" />}
                    items={f.signals}
                  />
                  <SectionList
                    title="Use it for"
                    icon={<Lightbulb className="h-4 w-4 text-slate-400" />}
                    items={f.uses}
                  />
                </div>

                {/* Panel CTA */}
                <div className="mt-6">
                  <Link
                    to="/fno-khazana-charts"
                    className={`inline-flex items-center gap-2 rounded-full px-5 py-3 font-medium text-white bg-gradient-to-r ${f.from} ${f.to} hover:brightness-110 transition`}
                  >
                    Try it in the live dashboard
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FnoIntroStoryrail;
