// src/pages/Home_Components/Call_Put/Call_Put.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  LineController,
  Title,
  Tooltip as CJTooltip,
  Legend as CJLegend,
} from "chart.js";
import { Chart } from "react-chartjs-2";
import type { ChartData, ChartOptions, ScaleOptionsByType } from "chart.js";
import { motion } from "framer-motion";

ChartJS.register(
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  CJTooltip,
  CJLegend,
  LineController
);

/* ---------- Types ---------- */
type ATMPoint = { timestamp: string; callOI: number; putOI: number; atmStrike?: number };
type OverallPoint = { timestamp: string; callOI: number; putOI: number };
type AtmResp = { expiry?: string | null; step?: number; atmStrike?: number | null; series: ATMPoint[] };
type OverallResp = { expiry?: string | null; step?: number; series: OverallPoint[] };

type Tab = "ATM" | "OVERALL";
type IntervalOpt = "3m" | "15m" | "30m" | "1h";
type Props = { panel?: "card" | "fullscreen" };

/* ---------- Config ---------- */
const RAW_BASE =
  (import.meta as any).env?.VITE_API_BASE ||
  (import.meta as any).env?.VITE_API_URL ||
  "http://localhost:8000";
const API_BASE = String(RAW_BASE).replace(/\/$/, "") + "/api";
const AUTO_REFRESH_MS = 180_000;

/* ---------- Helpers ---------- */
function toMinutes(i: IntervalOpt): number {
  switch (i) {
    case "3m":
      return 3;
    case "15m":
      return 15;
    case "30m":
      return 30;
    case "1h":
      return 60;
  }
}
const toLabelIST = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Kolkata",
  });

function formatMillions(n: number) {
  if (!Number.isFinite(n)) return "-";
  if (Math.abs(n) >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1) + "B";
  if (Math.abs(n) >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (Math.abs(n) >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toFixed(0);
}
function formatMillionsOnly(n: number) {
  if (!Number.isFinite(n)) return "-";
  return (n / 1_000_000).toFixed(0) + "M";
}
function niceStep(raw: number) {
  const m = raw / 1_000_000;
  const cs = [1, 2.5, 5, 10, 25, 50, 100, 250, 500];
  const p = cs.find((c) => c >= m) ?? cs[cs.length - 1];
  return p * 1_000_000;
}
function readThemeVars() {
  const scope =
    (document.querySelector(".theme-scope") as HTMLElement) ||
    document.documentElement;
  const cs = getComputedStyle(scope);
  const pick = (k: string, fb: string) => cs.getPropertyValue(k).trim() || fb;
  return {
    fg: pick("--fg", "#e5e7eb"),
    muted: pick("--muted", "#9ca3af"),
    axis: pick("--axis", "#9ca3af"),
    grid: pick("--grid", "#374151"),
    tip: pick("--tip", "#111827"),
    tipbr: pick("--tipbr", "#374151"),
    card: pick("--card-bg", "#0f172a"),
    brd: pick("--border", "rgba(148,163,184,0.25)"),
  };
}

/* ============================== Component =============================== */
export default function Call_Put({ panel = "card" }: Props) {
  const [tab, setTab] = useState<Tab>("ATM");
  const [interval, setIntervalOpt] = useState<IntervalOpt>("3m");

  const [atmSeries, setAtmSeries] = useState<ATMPoint[]>([]);
  const [overallSeries, setOverallSeries] = useState<OverallPoint[]>([]);
  const [meta, setMeta] = useState<{
    expiry?: string | null;
    step?: number;
    atmStrike?: number | null;
  }>({});

  const [err, setErr] = useState<string | null>(null);
  const [hasFetched, setHasFetched] = useState(false);
  const [loading, setLoading] = useState<boolean>(true);

  const rafRef = useRef<number | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Keep last good data so we can show it on soft errors
  const dataRef = useRef<{
    atmSeries: ATMPoint[];
    overallSeries: OverallPoint[];
  }>({ atmSeries: [], overallSeries: [] });

  // THEME
  const [themeTick, setThemeTick] = useState(0);
  useEffect(() => {
    const el = document.querySelector(".theme-scope");
    if (!el) return;
    const obs = new MutationObserver(() =>
      setThemeTick((t) => t + 1)
    );
    obs.observe(el, {
      attributes: true,
      attributeFilter: ["style", "class", "data-theme"],
    });
    return () => obs.disconnect();
  }, []);
  const vars = readThemeVars();
  const themeKey = `${vars.card}|${vars.fg}|${vars.axis}|${vars.grid}|${vars.tip}|${vars.brd}|${themeTick}`;

  // Mobile detect
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth <= 600 : false
  );
  useEffect(() => {
    const onR = () => setIsMobile(window.innerWidth <= 600);
    window.addEventListener("resize", onR);
    return () => window.removeEventListener("resize", onR);
  }, []);

  useEffect(() => {
    setHasFetched(false);
  }, [tab, interval, panel]);

  /* -------------------------- Fetch per-tab, per-interval ------------------------- */
  const fetchCurrent = async () => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    const hadDataBefore =
      tab === "ATM"
        ? (dataRef.current.atmSeries?.length ?? 0) > 0
        : (dataRef.current.overallSeries?.length ?? 0) > 0;

    if (!hadDataBefore) {
      // First / cold load: show blocking loader, no error
      setLoading(true);
      setErr(null);
      setHasFetched(false);
    } else {
      // Subsequent refresh: keep showing existing data
      setErr(null);
    }

    try {
      const minutes = toMinutes(interval);
      const url =
        tab === "ATM"
          ? `${API_BASE}/nifty/atm?interval=${minutes}&sinceMin=1440`
          : `${API_BASE}/nifty/overall?interval=${minutes}&sinceMin=1440}`;

      const res = await fetch(url, {
        method: "GET",
        signal: ctrl.signal,
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const raw = await res.json();

      if (tab === "ATM") {
        const body = raw as AtmResp;
        const series = Array.isArray(body.series) ? body.series : [];
        setAtmSeries(series);
        dataRef.current = {
          ...dataRef.current,
          atmSeries: series,
        };
        setMeta({
          expiry: body.expiry ?? null,
          step: body.step ?? 50,
          atmStrike: body.atmStrike ?? null,
        });
      } else {
        const body = raw as OverallResp;
        const series = Array.isArray(body.series) ? body.series : [];
        setOverallSeries(series);
        dataRef.current = {
          ...dataRef.current,
          overallSeries: series,
        };
        setMeta({
          expiry: body.expiry ?? null,
          step: body.step ?? 50,
          atmStrike: null,
        });
      }

      setHasFetched(true);
      setLoading(false);
      setErr(null);
    } catch (e: any) {
      if (e?.name === "AbortError") return;
      const msg = e?.message || "Failed to load data";

      // If first load & it's a generic "Failed to fetch", treat as slow/heavy load → keep loading
      const isFailedToFetch = /Failed to fetch/i.test(msg);
      if (!hadDataBefore && isFailedToFetch) {
        setLoading(true);
        setErr(null);
        return;
      }

      // If we already have data: soft error, keep chart & show warning
      if (hadDataBefore) {
        setErr(msg);
        setLoading(false);
        setHasFetched(true);
        return;
      }

      // Hard error with no data at all
      setErr(msg || "Failed to fetch");
      setLoading(false);
      setHasFetched(true);
    }
  };

  useEffect(() => {
    fetchCurrent();
    if (tickRef.current) clearInterval(tickRef.current);
    tickRef.current = setInterval(fetchCurrent, AUTO_REFRESH_MS);

    return () => {
      abortRef.current?.abort();
      if (tickRef.current) clearInterval(tickRef.current);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, interval]);

  /* ----------------------------- Transform ------------------------------- */

  const { labels, ce, pe, latestAtmStrike } = useMemo(() => {
    const series = tab === "ATM" ? atmSeries : overallSeries;
    if (!series || !series.length) {
      return {
        labels: [] as string[],
        ce: [] as number[],
        pe: [] as number[],
        latestAtmStrike: meta.atmStrike ?? null,
      };
    }

    const labels = series.map((p) => toLabelIST(p.timestamp));
    const ce = series.map((p: any) => Number(p.callOI ?? 0));
    const pe = series.map((p: any) => Number(p.putOI ?? 0));
    const latestAtmStrike = tab === "ATM" ? meta.atmStrike ?? null : null;

    return { labels, ce, pe, latestAtmStrike };
  }, [atmSeries, overallSeries, tab, meta]);

  const chartData: ChartData<"line"> = useMemo(
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

  const yScaleExtras = useMemo<Partial<ScaleOptionsByType<"linear">>>(() => {
    if (tab !== "OVERALL" || !labels.length) return {};
    const vals = [...ce, ...pe].filter((n) => Number.isFinite(n));
    if (!vals.length) return {};
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const range = Math.max(1, max - min);
    const step = niceStep(range / 6);
    const center = (min + max) / 2;
    const minAxis = Math.max(
      0,
      Math.floor((center - 3 * step) / step) * step
    );
    const maxAxis = Math.ceil((center + 3 * step) / step) * step;
    return { min: minAxis, max: maxAxis } as any;
  }, [tab, labels, ce, pe]);

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
      layout: {
        padding: isMobile
          ? { top: 8, right: 8, bottom: 56, left: 8 }
          : { top: 18, right: 8, bottom: 44, left: 8 },
      },
      plugins: {
        legend: {
          labels: {
            color: vars.fg,
            usePointStyle: true,
            padding: 14,
            font: { size: isMobile ? 10 : 12 } as any,
          },
          position: (isMobile ? "bottom" : "top") as any,
        },
        title: {
          display: true,
          text:
            tab === "ATM"
              ? "ATM Strike OI (CE/PE)"
              : "Overall OI (CE/PE)",
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
            tab === "ATM" && latestAtmStrike != null
              ? {
                  afterLabel: () =>
                    `ATM: ${latestAtmStrike}`,
                }
              : {},
        },
      },
      scales: {
        x: {
          grid: { color: vars.grid },
          ticks: {
            color: vars.axis,
            maxRotation: 45,
            minRotation: 45,
            font: { size: isMobile ? 9 : 12 } as any,
          },
          title: {
            display: true,
            text: "Time (IST)",
            color: vars.axis,
          },
        },
        y: {
          beginAtZero: tab !== "OVERALL",
          grid: { color: vars.grid },
          min: (yScaleExtras as any).min,
          max: (yScaleExtras as any).max,
          ticks: {
            color: vars.axis,
            callback: (val) =>
              typeof val === "number"
                ? tab === "OVERALL"
                  ? formatMillionsOnly(val)
                  : formatMillions(val)
                : String(val),
            ...(overallStepSize
              ? { stepSize: overallStepSize }
              : {}),
            font: { size: isMobile ? 9 : 12 } as any,
          },
          title: {
            display: true,
            text: "Open Interest",
            color: vars.axis,
          },
        },
      },
    }),
    [
      tab,
      latestAtmStrike,
      yScaleExtras,
      overallStepSize,
      vars,
      themeKey,
      isMobile,
    ]
  );

  /* ----------------------------- UI ---------------------------- */

  const containerStyle: React.CSSProperties = {
    maxWidth: panel === "fullscreen" ? "none" : "80rem",
    height: panel === "fullscreen" ? "100%" : undefined,
    minHeight: panel === "fullscreen" ? 320 : undefined,
    background: vars.card,
    color: vars.fg,
    border: `1px solid ${vars.brd}`,
  };

  const chartBoxClass =
    panel === "fullscreen"
      ? "relative w-full h-full rounded-xl overflow-hidden"
      : "relative w-full h-[410px] md:h-[430px] lg:h-[440px] rounded-xl overflow-hidden";

  const hasDataCurrent =
    tab === "ATM"
      ? atmSeries.length > 0
      : overallSeries.length > 0;

  const showInitialLoader = loading && !hasDataCurrent;
  const chartAreaTopOffset = isMobile ? 64 : 0;

  // Initial loading state: no data yet, keep it as "Loading..." (no fail-to-fetch)
  if (showInitialLoader) {
    return (
      <div
        className="mx-auto w-full rounded-xl shadow-xl"
        style={containerStyle}
      >
        <div className={chartBoxClass}>
          <div className="w-full h-full grid place-items-center">
            <div
              className="text-sm"
              style={{ color: vars.muted }}
            >
              Loading OI data...
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="mx-auto w-full rounded-xl shadow-xl"
      style={containerStyle}
    >
      <div className={chartBoxClass}>
        {/* Tabs LEFT */}
        <div className="absolute top-2 left-2 z-10 flex flex-wrap gap-2">
          <div
            className="flex items-center gap-1 rounded-lg px-1.5 py-1"
            style={{
              background: vars.card,
              border: `1px solid ${vars.brd}`,
            }}
          >
            {(["ATM", "OVERALL"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className="px-2.5 py-1 text-xs rounded"
                style={{
                  background:
                    tab === t
                      ? "rgba(99,102,241,0.25)"
                      : "transparent",
                  border:
                    tab === t
                      ? `1px solid ${vars.brd}`
                      : "1px solid transparent",
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
            style={{
              background: vars.card,
              border: `1px solid ${vars.brd}`,
            }}
          >
            {(["3m", "15m", "30m", "1h"] as const).map(
              (opt) => (
                <motion.button
                  key={opt}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => setIntervalOpt(opt)}
                  className="px-2.5 py-1 text-xs rounded"
                  style={{
                    background:
                      interval === opt
                        ? "rgba(99,102,241,0.25)"
                        : "transparent",
                    border:
                      interval === opt
                        ? `1px solid ${vars.brd}`
                        : "1px solid transparent",
                    color: vars.fg,
                  }}
                >
                  {opt}
                </motion.button>
              )
            )}
          </div>
        </div>

        {/* Bottom meta badge */}
        {tab === "ATM" && meta.atmStrike != null && (
          <div
            className="absolute bottom-2 left-2 z-10 text-[11px] md:text-xs px-2 py-1 rounded"
            style={{
              background: vars.card,
              border: `1px solid ${vars.brd}`,
              color: vars.muted,
            }}
          >
            Latest ATM:&nbsp;
            <span
              style={{
                color: vars.fg,
                fontWeight: 600,
              }}
            >
              {meta.atmStrike}
            </span>
            {meta.expiry ? (
              <>
                &nbsp;| Expiry:&nbsp;
                <span style={{ color: vars.fg }}>
                  {meta.expiry}
                </span>
              </>
            ) : null}
          </div>
        )}

        {/* Chart area */}
        <div
          className="absolute left-0 right-0 bottom-0"
          style={{ top: chartAreaTopOffset }}
        >
          {err && !hasDataCurrent ? (
            // Real error with no usable data
            <div
              className="w-full h-full grid place-items-center"
              style={{ color: "#f87171" }}
            >
              {err || "Failed to fetch data"}
            </div>
          ) : labels.length ? (
            <Chart
              key={`${themeKey}-${panel}-${
                isMobile ? "m" : "d"
              }-${tab}-${interval}`}
              type="line"
              data={chartData}
              options={options}
            />
          ) : hasFetched ? (
            <div
              className="w-full h-full grid place-items-center"
              style={{ color: vars.muted }}
            >
              No data
            </div>
          ) : null}
        </div>
      </div>

      {err && hasDataCurrent && (
        <div
          className="mt-2 text-xs px-3 pb-2"
          style={{ color: "#f59e0b" }}
        >
          Warning: {err}. Showing last available data.
        </div>
      )}
    </div>
  );
}
