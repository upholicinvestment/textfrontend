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
type ATMPoint = { timestamp: string; callOI: number; putOI: number };
type OverallPoint = { timestamp: string; callOI: number; putOI: number };
type OIBulkPayload = {
  expiry: string | null;
  atm: { step: number; atmStrike: number | null; rows: Record<string, ATMPoint[]> };
  overall: { rows: Record<string, OverallPoint[]> };
};
type Tab = "ATM" | "OVERALL";
type IntervalOpt = "3m" | "15m" | "30m" | "1h";
type Props = { panel?: "card" | "fullscreen" };

/* ---------- Config ---------- */
const RAW_BASE =
  (import.meta as any).env?.VITE_API_BASE ||
  (import.meta as any).env?.VITE_API_URL ||
  "https://api.upholictech.com";
const API_BASE = String(RAW_BASE).replace(/\/$/, "") + "/api";
const BULK_URL = `${API_BASE}/oi/bulk?intervals=3,15,30,60&sinceMin=1440`;
const STORAGE_KEY = "oi.bulk.v1";
const STORAGE_ETAG_KEY = "oi.bulk.v1.etag";
const AUTO_REFRESH_MS = 180_000;

/* ---------- Helpers ---------- */
function toMinutes(i: IntervalOpt): number {
  switch (i) {
    case "3m": return 3;
    case "15m": return 15;
    case "30m": return 30;
    case "1h": return 60;
  }
}
const toLabelIST = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-IN", {
    hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Kolkata",
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
  const scope = (document.querySelector(".theme-scope") as HTMLElement) || document.documentElement;
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

/* ---------- Normalizer (reject error payloads) ---------- */
function normalizeBulk(json: any): OIBulkPayload | null {
  if (!json || typeof json !== "object") return null;
  if ("error" in json) return null;

  const safeRows = (obj: any) => (obj && typeof obj === "object" ? obj : {});
  return {
    expiry: typeof json?.expiry === "string" ? json.expiry : null,
    atm: {
      step: Number(json?.atm?.step ?? 50),
      atmStrike:
        Number.isFinite(Number(json?.atm?.atmStrike)) ? Number(json.atm.atmStrike) : null,
      rows: safeRows(json?.atm?.rows),
    },
    overall: { rows: safeRows(json?.overall?.rows) },
  };
}

/* ============================== Component =============================== */
export default function Call_Put({ panel = "card" }: Props) {
  const [tab, setTab] = useState<Tab>("ATM");
  const [interval, setIntervalOpt] = useState<IntervalOpt>("3m");

  const [bulk, setBulk] = useState<OIBulkPayload | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [err, setErr] = useState<string | null>(null);
  const [hasFetched, setHasFetched] = useState(false);

  const rafRef = useRef<number | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // THEME
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

  /* -------------------------- Bulk fetch + cache ------------------------- */
  const fetchBulk = async () => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    try {
      setLoading(true);
      setErr(null);

      // Serve cached (if valid) ASAP
      const cached = sessionStorage.getItem(STORAGE_KEY);
      if (cached) {
        try {
          const maybe = JSON.parse(cached);
          const normalized = normalizeBulk(maybe);
          if (normalized) {
            rafRef.current = requestAnimationFrame(() => {
              setBulk(normalized);
              setHasFetched(true);
            });
            setLoading(false);
          }
        } catch {}
      }

      const etag = sessionStorage.getItem(STORAGE_ETAG_KEY) || "";
      const res = await fetch(BULK_URL, {
        method: "GET",
        headers: etag ? { "If-None-Match": etag } : {},
        cache: "no-store",
        signal: ctrl.signal,
      });

      if (res.status === 304) {
        setLoading(false);
        setHasFetched(true);
        return;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const raw = await res.json();
      const normalized = normalizeBulk(raw);

      if (!normalized) {
        setErr(raw?.error || "No data available");
        setHasFetched(true);
        setLoading(false);
        return;
      }

      const newTag = res.headers.get("ETag") || "";
      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
        if (newTag) sessionStorage.setItem(STORAGE_ETAG_KEY, newTag);
      } catch {}

      rafRef.current = requestAnimationFrame(() => {
        setBulk(normalized);
        setHasFetched(true);
      });
    } catch (e: any) {
      if (e?.name !== "AbortError") setErr(e?.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBulk();
    if (tickRef.current) clearInterval(tickRef.current);
    tickRef.current = setInterval(fetchBulk, AUTO_REFRESH_MS);
    return () => {
      abortRef.current?.abort();
      if (tickRef.current) clearInterval(tickRef.current);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  /* ----------------------------- Transform ------------------------------- */
  const minutes = useMemo(() => toMinutes(interval), [interval]);

  const { labels, ce, pe, latestAtmStrike } = useMemo(() => {
    if (!bulk) {
      return {
        labels: [] as string[],
        ce: [] as number[],
        pe: [] as number[],
        latestAtmStrike: null as number | null,
      };
    }
    const key = String(minutes);
    const rowsObj =
      tab === "ATM"
        ? (bulk?.atm?.rows ?? ({} as Record<string, ATMPoint[]>))
        : (bulk?.overall?.rows ?? ({} as Record<string, OverallPoint[]>));

    const series = rowsObj[key] ?? [];

    const labels = series.map((p) => toLabelIST(p.timestamp));
    const ce = series.map((p) => p.callOI ?? 0);
    const pe = series.map((p) => p.putOI ?? 0);
    const latestAtmStrike = tab === "ATM" ? bulk?.atm?.atmStrike ?? null : null;

    return { labels, ce, pe, latestAtmStrike };
  }, [bulk, tab, minutes]);

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
    const minAxis = Math.max(0, Math.floor((center - 3 * step) / step) * step);
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
          labels: { color: vars.fg, usePointStyle: true, padding: 14, font: { size: isMobile ? 10 : 12 } as any },
          position: (isMobile ? "bottom" : "top") as any,
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
            tab === "ATM" && bulk?.atm?.atmStrike
              ? { afterLabel: () => `ATM: ${bulk!.atm!.atmStrike}` }
              : {},
        },
      },
      scales: {
        x: {
          grid: { color: vars.grid },
          ticks: { color: vars.axis, maxRotation: 45, minRotation: 45, font: { size: isMobile ? 9 : 12 } as any },
          title: { display: true, text: "Time (IST)", color: vars.axis },
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
            ...(overallStepSize ? { stepSize: overallStepSize } : {}),
            font: { size: isMobile ? 9 : 12 } as any,
          },
          title: { display: true, text: "Open Interest", color: vars.axis },
        },
      },
    }),
    [tab, bulk, yScaleExtras, overallStepSize, vars, themeKey, isMobile]
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

  const showOverlay = panel === "fullscreen" && (loading || (!hasFetched && !err));
  const showEmpty = !labels.length && !loading && (panel === "fullscreen" ? hasFetched : true);

  const chartAreaTopOffset = isMobile ? 64 : 0;

  return (
    <div className="mx-auto w-full rounded-xl shadow-xl" style={containerStyle}>
      <div className={chartBoxClass}>
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
            {bulk?.expiry ? (
              <>
                &nbsp;| Expiry:&nbsp;<span style={{ color: vars.fg }}>{bulk.expiry}</span>
              </>
            ) : null}
          </div>
        )}

        {/* Chart area */}
        <div className="absolute left-0 right-0 bottom-0" style={{ top: chartAreaTopOffset }}>
          {showOverlay && (
            <div
              className="absolute inset-0 grid place-items-center z-20"
              style={{ background: "rgba(0,0,0,.03)", backdropFilter: "blur(1px)", color: vars.muted }}
            >
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full border-2 border-current border-t-transparent animate-spin" />
                <span>Loading…</span>
              </div>
            </div>
          )}

          {loading && panel !== "fullscreen" ? (
            <div className="w-full h-full grid place-items-center" style={{ color: vars.muted }}>
              Loading…
            </div>
          ) : err ? (
            <div className="w-full h-full grid place-items-center" style={{ color: "#f87171" }}>
              {err}
            </div>
          ) : labels.length ? (
            <Chart
              key={`${themeKey}-${panel}-${isMobile ? "m" : "d"}`}
              type="line"
              data={chartData}
              options={options}
            />
          ) : showEmpty ? (
            <div className="w-full h-full grid place-items-center" style={{ color: vars.muted }}>
              No data
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
