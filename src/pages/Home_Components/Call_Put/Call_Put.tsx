// src/pages/Home_Components/Call_Put/Call_Put.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip as CJTooltip,
  Legend as CJLegend,
} from "chart.js";
import { Chart } from "react-chartjs-2";
import type { ChartData, ChartOptions, ScaleOptionsByType } from "chart.js";
import { motion } from "framer-motion";

ChartJS.register(CategoryScale, LinearScale, LineElement, PointElement, Title, CJTooltip, CJLegend);

type ATMPoint = { timestamp: string; atmStrike: number; callOI: number; putOI: number };
type ATMResponse = { expiry: string; step: number; series: ATMPoint[]; atmStrike?: number };

type OverallPoint = { timestamp: string; callOI: number; putOI: number };
type OverallResponse = { expiry: string; step: number; series: OverallPoint[] };

type Tab = "ATM" | "OVERALL";
type IntervalOpt = "3m" | "15m" | "30m" | "1h";

const API_BASE = import.meta.env.VITE_API_URL || "https://api.upholictech.com";
const AUTO_REFRESH_MS = 60_000;

export default function Call_Put() {
  const [tab, setTab] = useState<Tab>("ATM");
  const [interval, setIntervalOpt] = useState<IntervalOpt>("3m");

  const [atm, setAtm] = useState<ATMResponse | null>(null);
  const [overall, setOverall] = useState<OverallResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [err, setErr] = useState<string | null>(null);

  const rafRef = useRef<number | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const minutes = useMemo(() => toMinutes(interval), [interval]);

  // --- Theme reactivity ---
  const [themeTick, setThemeTick] = useState(0);
  useEffect(() => {
    const el = document.querySelector(".theme-scope");
    if (!el) return;
    const obs = new MutationObserver(() => setThemeTick((t) => t + 1));
    obs.observe(el, { attributes: true, attributeFilter: ["style", "class", "data-theme"] });
    return () => obs.disconnect();
  }, []);
  const vars = readThemeVars();
  const themeKey = `${vars.card}|${vars.fg}|${vars.axis}|${vars.grid}|${vars.tip}|${vars.brd}|${themeTick}`;

  // ===== Fetch =====
  useEffect(() => {
    const fetchData = async () => {
      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      setLoading(true);
      setErr(null);

      try {
        if (tab === "ATM") {
          const res = await fetch(`${API_BASE}/api/nifty/atm?interval=${minutes}`, {
            signal: ctrl.signal,
            cache: "no-cache",
          });
          if (!res.ok) throw new Error(`ATM fetch failed (${res.status})`);
          const json: ATMResponse = await res.json();
          rafRef.current = requestAnimationFrame(() => setAtm(json));
        } else {
          const res = await fetch(`${API_BASE}/api/nifty/overall?interval=${minutes}`, {
            signal: ctrl.signal,
            cache: "no-cache",
          });
          if (!res.ok) throw new Error(`OVERALL fetch failed (${res.status})`);
          const json: OverallResponse = await res.json();
          rafRef.current = requestAnimationFrame(() => setOverall(json));
        }
      } catch (e: any) {
        if (e?.name !== "AbortError") setErr(e?.message || "Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    if (tickRef.current) clearInterval(tickRef.current);
    tickRef.current = setInterval(fetchData, AUTO_REFRESH_MS);

    return () => {
      abortRef.current?.abort();
      if (tickRef.current) clearInterval(tickRef.current);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [tab, minutes]);

  // ===== Transform =====
  const { labels, ce, pe, latestAtmStrike } = useMemo(() => {
    const fmt = (iso: string) =>
      new Date(iso).toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone: "Asia/Kolkata",
      });

    if (tab === "ATM" && atm?.series?.length) {
      const labels = atm.series.map((d) => fmt(d.timestamp));
      const ce = atm.series.map((d) => d.callOI ?? 0);
      const pe = atm.series.map((d) => d.putOI ?? 0);
      const last = (atm.atmStrike ?? atm.series[atm.series.length - 1]?.atmStrike) ?? null;
      return { labels, ce, pe, latestAtmStrike: last };
    }
    if (tab === "OVERALL" && overall?.series?.length) {
      const labels = overall.series.map((d) => fmt(d.timestamp));
      const ce = overall.series.map((d) => d.callOI ?? 0);
      const pe = overall.series.map((d) => d.putOI ?? 0);
      return { labels, ce, pe, latestAtmStrike: null as number | null };
    }
    return { labels: [] as string[], ce: [] as number[], pe: [] as number[], latestAtmStrike: null as number | null };
  }, [tab, atm, overall]);

  const data: ChartData<"line"> = useMemo(
    () => ({
      labels,
      datasets: [
        {
          label: tab === "ATM" ? "ATM CE OI" : "Total CE OI",
          data: ce,
          borderColor: "#10B981",
          backgroundColor: "#10B981",
          borderWidth: 2,
          tension: 0.3,
          pointRadius: 2,
          fill: false,
        },
        {
          label: tab === "ATM" ? "ATM PE OI" : "Total PE OI",
          data: pe,
          borderColor: "#EF4444",
          backgroundColor: "#EF4444",
          borderWidth: 2,
          tension: 0.3,
          pointRadius: 2,
          fill: false,
        },
      ],
    }),
    [labels, ce, pe, tab]
  );

  // Auto-range for OVERALL; y ticks always K/M/B for ATM, but **M only** for OVERALL.
  const yScaleExtras = useMemo<Partial<ScaleOptionsByType<"linear">>>(() => {
    if (tab !== "OVERALL" || !labels.length) return {};
    const vals = [...ce, ...pe].filter((n) => Number.isFinite(n));
    if (!vals.length) return {};
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const range = Math.max(1, max - min);
    const step = niceStep(range / 6);
    const center = (min + max) / 2;
    const minAxis = Math.max(0, Math.floor((center - 3 * step) / step) * step);
    const maxAxis = Math.ceil((center + 3 * step) / step) * step;
    // NOTE: we intentionally DO NOT include a `ticks` object here, so we won't
    // overwrite the main ticks.callback below. We'll merge stepSize later.
    return { min: minAxis, max: maxAxis, /* ticks: { stepSize: step } */ } as any & { _step?: number, min?: number, max?: number, _ticks?: { stepSize: number } };
  }, [tab, labels, ce, pe]);

  // extract a stepSize without stomping callback
  const overallStepSize = useMemo(() => {
    if (tab !== "OVERALL" || !labels.length) return undefined;
    const vals = [...ce, ...pe].filter((n) => Number.isFinite(n));
    if (!vals.length) return undefined;
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const range = Math.max(1, max - min);
    return niceStep(range / 6);
  }, [tab, labels, ce, pe]);

  const options: ChartOptions<"line"> = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      layout: { padding: { top: 18, right: 8, bottom: 44, left: 8 } },
      plugins: {
        legend: {
          labels: { color: vars.fg, usePointStyle: true, padding: 14 },
          position: "top",
        },
        title: {
          display: true,
          text: tab === "ATM" ? "ATM Strike OI (CE/PE)" : "Overall OI (CE/PE)",
          color: vars.fg,
          font: { size: 14, weight: 600 },
          padding: { top: 4, bottom: 8 },
        },
        tooltip: {
          backgroundColor: vars.tip,
          titleColor: vars.fg,
          bodyColor: vars.fg,
          borderColor: vars.tipbr,
          borderWidth: 1,
          callbacks:
            tab === "ATM" && atm?.series?.length
              ? {
                  afterLabel: (ctx) => {
                    const idx = ctx.dataIndex;
                    const strike = atm.atmStrike ?? atm.series[idx]?.atmStrike ?? undefined;
                    return strike ? `ATM: ${strike}` : "";
                  },
                }
              : {},
        },
      },
      scales: {
        x: {
          grid: { color: vars.grid },
          ticks: { color: vars.axis, maxRotation: 45, minRotation: 45 },
          title: { display: true, text: "Time (IST)", color: vars.axis },
        },
        y: {
          beginAtZero: tab !== "OVERALL",
          grid: { color: vars.grid },
          min: (yScaleExtras as any).min,
          max: (yScaleExtras as any).max,
          ticks: {
            color: vars.axis,
            // >>> keep callback ALWAYS; format M-only for OVERALL
            callback: (val) =>
              typeof val === "number"
                ? tab === "OVERALL"
                  ? formatMillionsOnly(val)
                  : formatMillions(val)
                : String(val),
            // merge stepSize without clobbering callback
            ...(overallStepSize ? { stepSize: overallStepSize } : {}),
          },
          title: { display: true, text: "Open Interest", color: vars.axis },
        },
      },
    }),
    [tab, atm, yScaleExtras, overallStepSize, vars, themeKey]
  );

  return (
    <div
      className="mx-auto w-full rounded-xl shadow-xl"
      style={{
        maxWidth: "80rem",
        background: vars.card,
        color: vars.fg,
        border: `1px solid ${vars.brd}`,
      }}
    >
      <div className="relative w-full h-[410px] md:h-[430px] lg:h-[440px] rounded-xl overflow-hidden">
        {/* Tabs LEFT */}
        <div className="absolute top-2 left-2 z-10 flex flex-wrap gap-2">
          <div
            className="flex items-center gap-1 rounded-lg px-1.5 py-1"
            style={{ background: vars.card, border: `1px solid ${vars.brd}` }}
          >
            {(["ATM", "OVERALL"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className="px-2.5 py-1 text-xs rounded"
                style={{
                  background: tab === t ? "rgba(99,102,241,0.25)" : "transparent",
                  border: tab === t ? `1px solid ${vars.brd}` : "1px solid transparent",
                  color: vars.fg,
                }}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Intervals RIGHT */}
        <div className="absolute top-2 right-2 z-10 flex flex-wrap gap-2">
          <div
            className="flex items-center gap-1 rounded-lg px-1.5 py-1"
            style={{ background: vars.card, border: `1px solid ${vars.brd}` }}
          >
            {(["3m", "15m", "30m", "1h"] as const).map((opt) => (
              <motion.button
                key={opt}
                whileTap={{ scale: 0.96 }}
                onClick={() => setIntervalOpt(opt)}
                className="px-2.5 py-1 text-xs rounded"
                style={{
                  background: interval === opt ? "rgba(99,102,241,0.25)" : "transparent",
                  border: interval === opt ? `1px solid ${vars.brd}` : "1px solid transparent",
                  color: vars.fg,
                }}
              >
                {opt}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Bottom meta badge */}
        {tab === "ATM" && latestAtmStrike != null && (
          <div
            className="absolute bottom-2 left-2 z-10 text-[11px] md:text-xs px-2 py-1 rounded"
            style={{ background: vars.card, border: `1px solid ${vars.brd}`, color: vars.muted }}
          >
            Latest ATM:&nbsp;
            <span style={{ color: vars.fg, fontWeight: 600 }}>{latestAtmStrike}</span>
            {atm?.expiry ? (
              <>
                &nbsp;| Expiry:&nbsp;<span style={{ color: vars.fg }}>{atm.expiry}</span>
              </>
            ) : null}
          </div>
        )}

        {/* Chart */}
        <div className="absolute inset-0">
          {loading ? (
            <div className="w-full h-full grid place-items-center" style={{ color: vars.muted }}>
              Loading…
            </div>
          ) : err ? (
            <div className="w-full h-full grid place-items-center" style={{ color: "#f87171" }}>
              {err}
            </div>
          ) : labels.length ? (
            <Chart key={themeKey} type="line" data={data} options={options} />
          ) : (
            <div className="w-full h-full grid place-items-center" style={{ color: vars.muted }}>
              No data
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------- utils ---------- */
function toMinutes(i: IntervalOpt): number {
  switch (i) {
    case "3m": return 3;
    case "15m": return 15;
    case "30m": return 30;
    case "1h": return 60;
  }
}

// K/M/B (kept for ATM)
function formatMillions(n: number): string {
  if (!Number.isFinite(n)) return "-";
  if (Math.abs(n) >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1) + "B";
  if (Math.abs(n) >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (Math.abs(n) >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toFixed(0);
}

// M-only (for OVERALL axis)
function formatMillionsOnly(n: number): string {
  if (!Number.isFinite(n)) return "-";
  return (n / 1_000_000).toFixed(0) + "M";
}

/** Round a step to a nice multiple in millions. */
function niceStep(raw: number): number {
  const m = raw / 1_000_000;
  const candidates = [1, 2.5, 5, 10, 25, 50, 100, 250, 500];
  const picked = candidates.find((c) => c >= m) ?? candidates[candidates.length - 1];
  return picked * 1_000_000;
}

/** Read CSS vars from .theme-scope (or root) each render */
function readThemeVars() {
  const scope = (document.querySelector(".theme-scope") as HTMLElement) || document.documentElement;
  const cs = getComputedStyle(scope);
  const pick = (k: string, fb: string) => (cs.getPropertyValue(k).trim() || fb);
  return {
    fg:    pick("--fg", "#e5e7eb"),
    muted: pick("--muted", "#9ca3af"),
    axis:  pick("--axis", "#9ca3af"),
    grid:  pick("--grid", "#374151"),
    tip:   pick("--tip", "#111827"),
    tipbr: pick("--tipbr", "#374151"),
    card:  pick("--card-bg", "#0f172a"),
    brd:   pick("--border", "rgba(148,163,184,0.25)"),
  };
}

