// src/.../Benefits.tsx
import React, { useEffect, useMemo, useRef, useState, useLayoutEffect } from "react";
import { motion, useMotionValue, animate, useSpring } from "framer-motion";
import type { MotionValue } from "framer-motion";
import { ShieldCheck, Zap, LineChart, Cog } from "lucide-react";

/* ----------------------- Types ----------------------- */
type MetricTriple = { impact: number; automation: number; clarity: number };
type Benefit = {
  key: "risk" | "speed" | "clarity" | "automation";
  title: string;
  desc: string;
  bullets: string[];
  icon: React.ReactElement;               // ✅ JSX.Element → React.ReactElement
  angle: number;                          // degrees on the radar (0° = +X axis, CCW)
  ring: 1 | 2 | 3;                        // kept for compatibility
  meters: MetricTriple;                   // 0–100
};

/* Colors for connector glow */
const KEY_HEX: Record<Benefit["key"], string> = {
  risk: "#22d3ee",       // cyan-400
  speed: "#a78bfa",      // violet-400
  clarity: "#34d399",    // emerald-400
  automation: "#f59e0b", // amber-500
};

/* Minimal angular distance (0..180) */
const angDist = (a: number, b: number) => Math.abs(((a - b + 540) % 360) - 180);

export default function Benefits() {
  const items: Benefit[] = useMemo(
    () => [
      {
        key: "automation",
        title: "Automation",
        desc: "Alerts → Orders with broker handshakes, re-auth & audit.",
        bullets: [
          "TradingView alerts → secure webhooks → orders",
          "Broker API handshake & re-auth flows",
          "Signed payloads, idempotency, audit logs",
        ],
        icon: <Cog className="h-5 w-5" />,
        angle: 320,
        ring: 3,
        meters: { impact: 90, automation: 95, clarity: 80 },
      },
      {
        key: "clarity",
        title: "Clarity",
        desc: "Transparent metrics: PF, R:R, Max DD, streaks, equity curve.",
        bullets: [
          "PF / R:R / Max DD + streak analytics",
          "Exposure timeline & session PnL",
          "Equity curve with drawdown overlays",
        ],
        icon: <LineChart className="h-5 w-5" />,
        angle: 220,
        ring: 3,
        meters: { impact: 80, automation: 55, clarity: 95 },
      },
      {
        key: "risk",
        title: "Risk Controls",
        desc: "Daily loss caps, trailing stops, circuit breakers & exposure limits.",
        bullets: [
          "Daily/Session loss caps & pause-after-loss",
          "Trailing SL, time-based exits, hard stops",
          "Per-trade size rules & portfolio exposure caps",
        ],
        icon: <ShieldCheck className="h-5 w-5" />,
        angle: 140,
        ring: 3,
        meters: { impact: 95, automation: 80, clarity: 75 },
      },
      {
        key: "speed",
        title: "Speed",
        desc: "Low-latency dispatch with batching, throttles and retries.",
        bullets: [
          "WS streams → immediate order dispatch",
          "Smart batching & burst-safe throttling",
          "Retry with idempotent keys, queue health",
        ],
        icon: <Zap className="h-5 w-5" />,
        angle: 40,
        ring: 3,
        meters: { impact: 85, automation: 75, clarity: 60 },
      },
    ],
    []
  );

  /* ---------- Layout / responsiveness ---------- */
  const containerRef = useRef<HTMLDivElement | null>(null);
  const radarWrapRef = useRef<HTMLDivElement | null>(null);
  const panelAnchorRef = useRef<HTMLDivElement | null>(null);

  const [radarSize, setRadarSize] = useState(520);
  useLayoutEffect(() => {
    const calc = () => {
      const wrapW = radarWrapRef.current?.getBoundingClientRect().width ?? window.innerWidth;
      const next = Math.min(560, Math.max(220, Math.floor(wrapW)));
      setRadarSize(next);
    };
    calc();
    window.addEventListener("resize", calc);
    return () => {
      window.removeEventListener("resize", calc);
    };
  }, []);

  /* ---------- Active selection driven by sweep angle (desktop) ---------- */
  const [activeIndex, setActiveIndex] = useState(0);
  const active = items[activeIndex];

  const sweep = useMotionValue<number>(0); // ✅ typed
  useEffect(() => {
    const controls = animate(sweep, 360, {
      duration: 12,
      ease: "linear",
      repeat: Infinity,
      repeatType: "loop",
    });
    return () => controls.stop();
  }, [sweep]);

  useEffect(() => {
    const HALF_WEDGE = 16; // degrees; beam width
    let lastKey = active.key;
    const sub = sweep.on("change", (deg: number) => { // ✅ deg typed
      for (const b of items) {
        if (angDist(deg, b.angle) <= HALF_WEDGE) {
          if (b.key !== lastKey) {
            lastKey = b.key;
            setActiveIndex(items.findIndex((x) => x.key === b.key));
          }
          return;
        }
      }
      const nearest = items.reduce(
        (best, b, i) => {
          const d = angDist(deg, b.angle);
          return d < best.d ? { i, d } : best;
        },
        { i: 0, d: Infinity as number }
      );
      if (items[nearest.i].key !== lastKey) {
        lastKey = items[nearest.i].key;
        setActiveIndex(nearest.i);
      }
    });
    return () => sub();
  }, [items, sweep, active.key]);

  /* ---------- Connector (≥1024px) ---------- */
  const [start, setStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [end, setEnd] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const onActiveNodePos = (pt: { x: number; y: number }) => {
    const cont = containerRef.current?.getBoundingClientRect();
    if (!cont) return;
    setStart({ x: pt.x - cont.left, y: pt.y - cont.top });
  };
  const measureEnd = () => {
    const cont = containerRef.current?.getBoundingClientRect();
    const anchor = panelAnchorRef.current?.getBoundingClientRect();
    if (!cont || !anchor) return;
    setEnd({
      x: anchor.left - cont.left + 8,
      y: anchor.top - cont.top + anchor.height / 2,
    });
  };
  useLayoutEffect(() => {
    measureEnd();
    const onResize = () => measureEnd();
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
    };
  }, []);
  useEffect(() => {
    measureEnd();
  }, [activeIndex, radarSize]);

  return (
    <section className="relative bg-slate-950 py-16 text-white overflow-hidden">
      {/* ambient aurora */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div
          className="absolute -inset-40 blur-3xl opacity-30"
          style={{
            background:
              "radial-gradient(60% 60% at 20% 20%, rgba(56,189,248,0.25), transparent 60%), radial-gradient(50% 50% at 80% 70%, rgba(139,92,246,0.20), transparent 60%)",
          }}
        />
      </div>

      <div ref={containerRef} className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <header className="mb-8 text-center">
          <h3 className="text-3xl lg:text-4xl py-2 font-bold bg-gradient-to-r from-sky-400 to-violet-500 bg-clip-text text-transparent">
            Benefits of going Algo
          </h3>
          <p className="mt-4 text-lg text-white/70 max-w-2xl mx-auto">
            Discipline + consistency + measurable edge.
          </p>
        </header>

        {/* <lg: radar hidden; ≥lg: radar + panel with connector */}
        <div className="grid gap-8 lg:gap-10 lg:grid-cols-[minmax(450px,550px)_1fr]">
          {/* RADAR: hidden on small screens */}
          <div ref={radarWrapRef} className="hidden w-full items-center justify-center overflow-visible lg:flex">
            <Radar
              size={radarSize}
              items={items}
              activeKey={active.key}
              sweep={sweep} // ✅ MotionValue<number>
              onFocus={(b) => setActiveIndex(items.findIndex((x) => x.key === b.key))}
              onActiveNodePos={onActiveNodePos}
            />
          </div>

          {/* DETAIL PANEL: always visible */}
          <div className="relative">
            <DetailPanel b={active} anchorRef={panelAnchorRef} />
          </div>

          {/* CONNECTOR: only on ≥lg */}
          <ConnectorOverlay
            showAtLg
            start={start}
            end={end}
            colorHex={KEY_HEX[active.key]}
            keyId={active.key}
          />
        </div>

        {/* MOBILE LIST: only on <lg */}
       
      </div>
    </section>
  );
}

/* ----------------------- Radar (desktop) ----------------------- */
type RadarProps = {
  size: number;
  items: Benefit[];
  activeKey: Benefit["key"];
  sweep: MotionValue<number>; // ✅ explicit
  onFocus: (b: Benefit) => void;
  onActiveNodePos?: (pt: { x: number; y: number }) => void;
};

const Radar = React.forwardRef<HTMLDivElement, RadarProps>(function Radar(
  { size, items, activeKey, sweep, onFocus, onActiveNodePos },
  _ref
) {
  const center = size / 2;

  // Unified ring for nodes + faint guide rings
  const R_NODE = size * 0.38; // nodes live here
  const R_SWEEP = size * 0.46; // sweep radius (slightly larger)
  const R_GUIDES = [size * 0.24, size * 0.31, R_NODE, size * 0.44]; // subtle rings

  const containerRef = useRef<HTMLDivElement | null>(null);

  // report active node position in viewport to parent for connector
  const reportActivePos = () => {
    const el = containerRef.current?.querySelector<HTMLButtonElement>(`[data-node="${activeKey}"]`);
    if (!el) return;
    const r = el.getBoundingClientRect();
    onActiveNodePos?.({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
  };
  useLayoutEffect(() => {
    reportActivePos();
    const onResize = () => reportActivePos();
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
    };
  }, [activeKey, size]);

  // Place every node at the unified radius; angles still determine position.
  const nodes = items.map((b) => {
    const rad = (b.angle * Math.PI) / 180;
    const x = center + R_NODE * Math.cos(rad);
    const y = center + R_NODE * Math.sin(rad);
    return { ...b, x, y, r: R_NODE };
  });

  // const active = nodes.find((n) => n.key === activeKey)!;

  return (
    <div
      ref={containerRef}
      className="relative"
      style={{ width: size, height: size }}
      aria-label="Benefits radar"
      role="list"
    >
      {/* Faint guide rings (with pulse on the active/node ring) */}
      {R_GUIDES.map((r, i) => {
        const isNodeRing = Math.abs(r - R_NODE) < 1;
        return (
          <div
            key={i}
            className={`pointer-events-none absolute rounded-full border ${
              isNodeRing ? "border-white/20" : "border-white/10"
            }`}
            style={{
              width: r * 2,
              height: r * 2,
              left: center - r,
              top: center - r,
              boxShadow: "inset 0 0 80px rgba(255,255,255,0.03), 0 0 40px rgba(15,23,42,0.15)",
              backdropFilter: "blur(0.5px)",
            }}
          >
            {isNodeRing && (
              <motion.div
                className="absolute inset-0 rounded-full"
                animate={{ opacity: [0.25, 0.55, 0.25] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                style={{
                  boxShadow: "0 0 24px rgba(56,189,248,0.35), inset 0 0 24px rgba(139,92,246,0.25)",
                }}
              />
            )}
            {/* subtle radial edge feather */}
            <div
              className="absolute inset-0 rounded-full pointer-events-none"
              style={{
                boxShadow: "inset 0 0 30px rgba(255,255,255,0.05)",
              }}
            />
          </div>
        );
      })}

      {/* Rotating sweep at its own radius */}
      <motion.div
        className="pointer-events-none absolute"
        style={{
          left: center - R_SWEEP,
          top: center - R_SWEEP,
          width: R_SWEEP * 2,
          height: R_SWEEP * 2,
          rotate: sweep,
        }}
      >
        <div
          className="h-full w-full rounded-full"
          style={{
            background: "conic-gradient(from 0deg, rgba(99,102,241,0.18), rgba(56,189,248,0) 35%)",
            maskImage: "radial-gradient(circle, black 58%, transparent 60%)",
          }}
        />
      </motion.div>

      {/* Center dot with glow effect */}
      <div className="absolute" style={{ left: center, top: center }}>
        <div className="h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/80" />
        <motion.div
          className="absolute -inset-4 -translate-x-1/6 -translate-y-1/6 rounded-full bg-white/20"
          animate={{ scale: [1, 1.5, 1] }}
          transition={{ duration: 3, repeat: Infinity }}
        />
      </div>

      {/* Nodes (all on the same ring) */}
      {nodes.map((n) => {
        const isActive = n.key === activeKey;
        const color = KEY_HEX[n.key];

        return (
          <motion.button
            key={n.key}
            data-node={n.key}
            role="listitem"
            onClick={() => onFocus(n)}
            className="group absolute -translate-x-1/2 -translate-y-1/2 select-none rounded-full outline-none"
            style={{ left: n.x, top: n.y }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
          >
            <motion.div
              className={`flex h-12 w-12 items-center justify-center rounded-xl shadow-lg backdrop-blur-sm ${
                isActive ? `bg-white/20 ring-2 ring-white/30` : "bg-white/10 hover:bg-white/15"
              }`}
              animate={{
                scale: isActive ? 1.15 : 1,
                boxShadow: isActive ? `0 0 20px ${color}80` : "0 4px 12px rgba(0,0,0,0.1)",
              }}
              transition={{ type: "spring", stiffness: 300, damping: 15 }}
            >
              {React.cloneElement(n.icon as React.ReactElement<any>, {
                className: `${(n.icon as any).props?.className ?? ""} ${isActive ? "text-white" : "text-white/80"}`,
              })}
            </motion.div>
            <motion.div
              className="mt-2 whitespace-nowrap text-center text-xs font-medium text-white/90 opacity-80 group-hover:opacity-100"
              animate={{
                color: isActive ? color : "#ffffff90",
                scale: isActive ? 1.1 : 1,
              }}
            >
              {n.title}
            </motion.div>
            <motion.span
              className="pointer-events-none absolute -inset-4 -z-10 rounded-xl"
              animate={{
                background: isActive
                  ? `radial-gradient(30px 30px at 50% 50%, ${color}40, transparent 70%)`
                  : "transparent",
              }}
            />
          </motion.button>
        );
      })}
    </div>
  );
});

/* ------------------- Connector (≥lg only) ------------------- */
function ConnectorOverlay({
  start,
  end,
  colorHex,
  keyId,
  showAtLg = false,
}: {
  start: { x: number; y: number };
  end: { x: number; y: number };
  colorHex: string;
  keyId: string;
  showAtLg?: boolean;
}) {
  const cls = showAtLg ? "hidden lg:block" : "";
  const dx = Math.max(60, Math.abs(end.x - start.x) * 0.45);
  const c1x = start.x + dx,
    c1y = start.y;
  const c2x = end.x - dx,
    c2y = end.y;

  // ✅ no generic here
  const pathLength = useSpring(0, {
    stiffness: 100,
    damping: 30,
  });

  useEffect(() => {
    pathLength.set(1);
  }, [pathLength]);

  return (
    <svg className={`pointer-events-none absolute inset-0 ${cls}`} aria-hidden>
      <defs>
        <linearGradient id={`grad-${keyId}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={colorHex} stopOpacity="0.9" />
          <stop offset="100%" stopColor={colorHex} stopOpacity="0.0" />
        </linearGradient>
        <filter id={`glow-${keyId}`}>
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <pattern id={`dots-${keyId}`} width="16" height="6" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="3" r="1.5" fill={colorHex} opacity="0.6" />
        </pattern>
      </defs>

      <motion.path
        d={`M ${start.x} ${start.y} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${end.x} ${end.y}`}
        stroke={`url(#grad-${keyId})`}
        strokeWidth="3"
        fill="none"
        filter={`url(#glow-${keyId})`}
        style={{ pathLength }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        strokeLinecap="round"
      />

      <motion.path
        d={`M ${start.x} ${start.y} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${end.x} ${end.y}`}
        stroke={`url(#dots-${keyId})`}
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        strokeDasharray="6 10"
        animate={{ strokeDashoffset: [0, 16] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
        opacity="0.7"
      />
    </svg>
  );
}

/* ----------------------- Detail Panel ----------------------- */
function DetailPanel({
  b,
  anchorRef,
}: {
  b: Benefit;
  anchorRef: React.RefObject<HTMLDivElement | null>; // ✅ accept null-able
}) {
  const color = KEY_HEX[b.key];

  return (
    <motion.div
      key={b.key}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="relative overflow-hidden mt-20 rounded-2xl border border-white/15 bg-gradient-to-br from-white/[0.06] to-white/[0.03] p-6 sm:p-7 backdrop-blur-lg shadow-xl"
      style={{ boxShadow: `inset 0 1px 0 0 rgba(255,255,255,0.1), 0 20px 40px rgba(0,0,0,0.2)` }}
    >
      {/* anchor for connector */}
      <div ref={anchorRef} className="absolute left-0 top-8 h-6 w-6 -translate-x-3" />

      {/* Subtle accent line */}
      <div
        className="absolute left-0 top-0 h-full w-1"
        style={{ background: `linear-gradient(to bottom, ${color}00, ${color}aa, ${color}00)` }}
      />

      <div className="mb-5 flex items-center gap-4">
        <motion.div
          className="flex h-12 w-12 items-center justify-center rounded-xl backdrop-blur-sm"
          style={{ backgroundColor: `${color}20` }}
          animate={{ rotate: [0, 5, 0] }}
          transition={{ duration: 4, repeat: Infinity }}
        >
          {React.cloneElement(b.icon as React.ReactElement<any>, { className: "h-6 w-6", style: { color } })}
        </motion.div>
        <div>
          <div className="text-sm uppercase tracking-wide text-white/60">Benefit</div>
          <h4
            className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent"
            style={{ textShadow: `0 0 15px ${color}40` }}
          >
            {b.title}
          </h4>
        </div>
      </div>

      <p className="text-white/80 leading-relaxed">{b.desc}</p>
      <ul className="mt-5 space-y-3 text-white/80">
        {b.bullets.map((t, i) => (
          <motion.li
            key={i}
            className="leading-relaxed flex items-start"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <span className="mr-3 mt-1.5 inline-block h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
            <span>{t}</span>
          </motion.li>
        ))}
      </ul>

      <div className="mt-7 grid grid-cols-3 gap-4 sm:gap-5">
        <Meter label="Impact" value={b.meters.impact} color={color} />
        <Meter label="Automation" value={b.meters.automation} color={color} />
        <Meter label="Clarity" value={b.meters.clarity} color={color} />
      </div>

      <div className="mt-5 text-xs text-white/50 italic">
        *Meters are illustrative indicators of typical emphasis for each benefit.
      </div>
    </motion.div>
  );
}

function Meter({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div className="mb-2 text-xs uppercase tracking-wider text-white/60 font-medium">{label}</div>
      <div className="h-2.5 w-full rounded-full bg-white/10 overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${Math.max(0, Math.min(100, value))}%` }}
          transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
          style={{
            background: `linear-gradient(to right, ${color}dd, ${color})`,
            boxShadow: `0 0 10px ${color}60`,
          }}
        />
      </div>
      <div className="mt-2 text-sm font-medium text-white/80">{value}%</div>
    </div>
  );
}
