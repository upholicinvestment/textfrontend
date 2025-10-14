// components/Gex2DHorizontalChart.tsx
import { useEffect, useMemo, useState } from "react";
import Chart from "react-apexcharts";
import type { ApexOptions } from "apexcharts";

/* ========= Config ========= */
const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";
const REFRESH_MS = 180_000; // 3 minutes

/* ========= Sizing ========= */
const CHART_H = 320;

/* ========= Types ========= */
type GexRow = {
  strike: number;
  gex_oi_raw: number;
  gex_vol_raw: number;
  ce_oi: number;
  pe_oi: number;
  ce_vol: number;
  pe_vol: number;
};
type ApiRow = Partial<GexRow>;

type GexResponse = {
  symbol: string;
  expiry: string;
  spot: number;
  rows: GexRow[];
  updated_at?: string;
};

type TickPoint = { x: number; y: number };
type TicksApiResp = {
  symbol: string;
  expiry: string;
  trading_day_ist: string;
  from?: string;
  to?: string;
  points: TickPoint[];
  count?: number;
};

/* ========= Helpers ========= */


/* ========= Weighting (OI > VOL) ========= */
const OI_WEIGHT = 2;
const VOL_WEIGHT = 1;

/* ---------- Theme detection + palettes ---------- */
function useIsDark(): boolean {
  const get = () =>
    document.documentElement.classList.contains("dark") ||
    window.matchMedia?.("(prefers-color-scheme: dark)")?.matches ||
    false;
  const [isDark, setIsDark] = useState<boolean>(get);

  useEffect(() => {
    const mm = window.matchMedia?.("(prefers-color-scheme: dark)");
    const onMedia = (e: MediaQueryListEvent) =>
      setIsDark(e.matches || document.documentElement.classList.contains("dark"));
    mm?.addEventListener?.("change", onMedia);

    const obs = new MutationObserver(() =>
      setIsDark(
        document.documentElement.classList.contains("dark") ||
          window.matchMedia?.("(prefers-color-scheme: dark)")?.matches ||
          false
      )
    );
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "data-theme"],
    });

    return () => {
      mm?.removeEventListener?.("change", onMedia);
      obs.disconnect();
    };
  }, []);

  return isDark;
}

type ThemeSet = {
  bg: string; fg: string; axis: string; axisTitle: string; axisBorder: string; grid: string;
  crosshair: string; line: string; tooltipBg: string; tooltipFg: string;
  panelBg: string; panelFg: string; panelBorder: string; volGrad: string;
  annRedLine: string; annRedBg: string; annRedText: string; annRed2Line: string; annRed2Bg: string;
  annGreenLine: string; annGreenBg: string; annGreenText: string; annGreen2Line: string; annGreen2Bg: string;
  flipLine: string; flipBg: string; flipText: string; headerFg: string; subFg: string;
};

function getThemeColors(isDark: boolean): ThemeSet {
  if (isDark) {
    return {
      bg: "transparent",
      fg: "#E5E7EB",
      axis: "#bfdbfe",
      axisTitle: "#93c5fd",
      axisBorder: "rgba(59,130,246,.45)",
      grid: "rgba(55,65,81,.35)",
      crosshair: "rgba(148,163,184,.45)",
      line: "#3b82f6",
      tooltipBg: "#0b1220",
      tooltipFg: "#ffffff",
      panelBg: "#0b1220",
      panelFg: "#E5E7EB",
      panelBorder: "rgba(148,163,184,.18)",
      volGrad: "linear-gradient(to right, rgba(148,163,184,0.9), rgba(71,85,105,0.95))",
      annRedLine: "rgba(239,68,68,.85)",
      annRedBg: "#7f1d1d33",
      annRedText: "#fecaca",
      annRed2Line: "rgba(252,165,165,.95)",
      annRed2Bg: "#fecaca26",
      annGreenLine: "rgba(16,185,129,.9)",
      annGreenBg: "#065f4626",
      annGreenText: "#bbf7d0",
      annGreen2Line: "rgba(134,239,172,.95)",
      annGreen2Bg: "#bbf7d026",
      flipLine: "#f59e0b",
      flipBg: "rgba(245,158,11,.16)",
      flipText: "#fde68a",
      headerFg: "#F9FAFB", // Changed to brighter color for better visibility
      subFg: "#E5E7EB", // Changed to brighter color for better visibility
    };
  }
  return {
    bg: "transparent",
    fg: "#111827",
    axis: "#374151",
    axisTitle: "#111827",
    axisBorder: "#1d4ed8",
    grid: "rgba(17,24,39,.12)",
    crosshair: "rgba(17,24,39,.45)",
    line: "#1d4ed8",
    tooltipBg: "#ffffff",
    tooltipFg: "#111827",
    panelBg: "#ffffff",
    panelFg: "#111827",
    panelBorder: "rgba(0,0,0,.10)",
    volGrad: "linear-gradient(to right, rgba(55,65,81,.55), rgba(17,24,39,.75))",
    annRedLine: "#dc2626",
    annRedBg: "#fee2e2",
    annRedText: "#991b1b",
    annRed2Line: "#f87171",
    annRed2Bg: "#ffe4e6",
    annGreenLine: "#059669",
    annGreenBg: "#dcfce7",
    annGreenText: "#065f46",
    annGreen2Line: "#34d399",
    annGreen2Bg: "#d1fae5",
    flipLine: "#f59e0b",
    flipBg: "#FEF3C7",
    flipText: "#92400e",
    headerFg: "#111827",
    subFg: "#374151",
  };
}

/* ---------- Lines selection ---------- */
type LineMark = { strike: number; label: "R1" | "R2" | "S1" | "S2"; color: string; side: "ce" | "pe"; };
const finite = (n: any): n is number => typeof n === "number" && Number.isFinite(n);

function rankMap(rows: GexRow[], key: "gex_oi_raw" | "gex_vol_raw", desc: boolean): Map<number, number> {
  const sorted = [...rows].sort((a, b) => (desc ? b[key] - a[key] : a[key] - b[key]));
  const map = new Map<number, number>();
  for (let i = 0; i < sorted.length; i++) map.set(sorted[i].strike, i + 1);
  return map;
}
function rankMapAbs(rows: GexRow[], key: "gex_oi_raw"): Map<number, number> {
  const sorted = [...rows].sort((a, b) => Math.abs(a[key]) - Math.abs(b[key]));
  const map = new Map<number, number>();
  for (let i = 0; i < sorted.length; i++) map.set(sorted[i].strike, i + 1);
  return map;
}
function pickLinesByRaw(rows: GexRow[]): { red: LineMark[]; green: LineMark[] } {
  const valid = rows.filter(
    (r) => finite(r.strike) && finite(r.gex_oi_raw) && finite(r.gex_vol_raw) && !(r.gex_oi_raw === 0 && r.gex_vol_raw === 0)
  );
  const pos = valid.filter((r) => r.gex_oi_raw > 0 && r.gex_vol_raw > 0);
  const neg = valid.filter((r) => r.gex_oi_raw < 0 && r.gex_vol_raw < 0);

  const red: LineMark[] = [];
  if (pos.length) {
    const oiRank = rankMap(pos, "gex_oi_raw", true);
    const volRank = rankMap(pos, "gex_vol_raw", true);
    const scored = pos.map((r) => {
      const oiR = oiRank.get(r.strike) ?? 9999;
      const volR = volRank.get(r.strike) ?? 9999;
      return { strike: r.strike, oiR, volR, score: OI_WEIGHT * oiR + VOL_WEIGHT * volR };
    });
    scored.sort((a, b) => a.score - b.score || a.oiR - b.oiR || a.volR - b.volR);
    if (scored[0]) red.push({ strike: scored[0].strike, label: "R1", color: "#ef4444", side: "ce" });
    if (scored[1]) red.push({ strike: scored[1].strike, label: "R2", color: "#fca5a5", side: "ce" });
  }

  const green: LineMark[] = [];
  if (neg.length) {
    const oiRank = rankMap(neg, "gex_oi_raw", false);
    const volRank = rankMap(neg, "gex_vol_raw", false);
    const scored = neg.map((r) => {
      const oiR = oiRank.get(r.strike) ?? 9999;
      const volR = volRank.get(r.strike) ?? 9999;
      return { strike: r.strike, oiR, volR, score: OI_WEIGHT * oiR + VOL_WEIGHT * volR };
    });
    scored.sort((a, b) => a.score - b.score || a.oiR - b.oiR || a.volR - b.volR);
    if (scored[0]) green.push({ strike: scored[0].strike, label: "S1", color: "#10b981", side: "pe" });
    if (scored[1]) green.push({ strike: scored[1].strike, label: "S2", color: "#86efac", side: "pe" });
  }
  return { red, green };
}
function pickZeroGammaStrike(rows: GexRow[], r1?: number, s1?: number): number | null {
  if (!finite(r1) || !finite(s1)) return null;
  const lo = Math.min(r1!, s1!);
  const hi = Math.max(r1!, s1!);
  const between = rows.filter(
    (r) => finite(r.strike) && r.strike >= lo && r.strike <= hi && finite(r.gex_oi_raw) && finite(r.gex_vol_raw)
  );
  if (!between.length) return null;

  const absOiRank = rankMapAbs(between, "gex_oi_raw");
  const volRank = rankMap(between, "gex_vol_raw", true);
  const scored = between.map((r) => ({
    strike: r.strike,
    score: (absOiRank.get(r.strike) || 9999) + (volRank.get(r.strike) || 9999),
  }));
  scored.sort((a, b) => a.score - b.score);
  return scored[0]?.strike ?? null;
}

/* ========= Component ========= */
export default function NiftyGexLevelsPage() {
  const isDark = useIsDark();
  const C = useMemo(() => getThemeColors(isDark), [isDark]);

  const [gex, setGex] = useState<GexResponse | null>(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const urlExpiry = useMemo(() => {
    const q = new URLSearchParams(window.location.search).get("expiry");
    return q && /^\d{4}-\d{2}-\d{2}$/.test(q) ? q : null;
  }, []);
  const [activeExpiry, setActiveExpiry] = useState<string | null>(urlExpiry);

  const [refreshTick, setRefreshTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setRefreshTick((t) => t + 1), REFRESH_MS);
    return () => clearInterval(id);
  }, []);

  const [niftyPoints, setNiftyPoints] = useState<TickPoint[]>([]);
  const [fromMs, setFromMs] = useState<number | null>(null);
  const [toMs, setToMs] = useState<number | null>(null);

  // Apex dropdown styles (theme aware)
  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      .apexcharts-menu {
        background:${C.panelBg} !important;
        color:${C.panelFg} !important;
        border:1px solid ${C.panelBorder} !important;
        box-shadow:0 6px 18px rgba(0,0,0,.15) !important;
      }
      .apexcharts-menu-item { color:${C.panelFg} !important; }
      .apexcharts-menu-item:hover { background:rgba(148,163,184,.12) !important; }
    `;
    document.head.appendChild(style);
    return () => {
      if (style.parentNode) style.parentNode.removeChild(style);
    };
  }, [C.panelBg, C.panelFg, C.panelBorder]);

  /* -------- Fetch rows & initial spot -------- */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setErr("");
        const qs = activeExpiry ? `?expiry=${activeExpiry}` : urlExpiry ? `?expiry=${urlExpiry}` : "";
        const res = await fetch(`${API_BASE}/gex/nifty/cache${qs}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const j: any = await res.json();
        if (cancelled) return;

        const normalizedExpiry: string =
          (j.expiry as string) || activeExpiry || urlExpiry || new Date().toISOString().slice(0, 10);
        setActiveExpiry(normalizedExpiry);

        const rows: GexRow[] = Array.isArray(j.rows)
          ? (j.rows as ApiRow[])
              .map((r): GexRow => ({
                strike: Number(r?.strike ?? 0),
                gex_oi_raw: Number(r?.gex_oi_raw ?? 0),
                gex_vol_raw: Number(r?.gex_vol_raw ?? 0),
                ce_oi: Number(r?.ce_oi ?? 0),
                pe_oi: Number(r?.pe_oi ?? 0),
                ce_vol: Number(r?.ce_vol ?? 0),
                pe_vol: Number(r?.pe_vol ?? 0),
              }))
              .filter((r) => Number.isFinite(r.strike))
          : [];

        setGex({
          symbol: (j.symbol as string) ?? "NIFTY",
          expiry: normalizedExpiry,
          spot: Number(j.spot ?? 0),
          rows,
          updated_at: j.updated_at as string | undefined,
        });
      } catch (e: any) {
        setErr(e.message || String(e));
      } finally {
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [urlExpiry, activeExpiry, refreshTick]);

  /* -------- Fetch NIFTY ticks -------- */
  useEffect(() => {
    if (!activeExpiry) return;
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch(`${API_BASE}/gex/nifty/ticks?expiry=${activeExpiry}`);
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const j: TicksApiResp = await r.json();
        if (cancelled) return;

        const pts = (j.points || [])
          .map((p) => ({ x: Number(p.x), y: Number(p.y) }))
          .filter((p) => Number.isFinite(p.x) && Number.isFinite(p.y))
          .sort((a, b) => a.x - b.x);

        setNiftyPoints(pts);

        const f = j.from ? Date.parse(j.from) : NaN;
        const t = j.to ? Date.parse(j.to) : NaN;
        setFromMs(Number.isFinite(f) ? f : null);
        setToMs(Number.isFinite(t) ? t : null);

        if (pts.length) {
          const last = pts[pts.length - 1];
          setGex((prev) => (prev ? { ...prev, spot: last.y } : prev));
        }
      } catch { /* ignore transient */ }
    })();
    return () => { cancelled = true; };
  }, [activeExpiry, refreshTick]);

  /* ---------- Lines ---------- */
  const { red: redLines, green: greenLines } = useMemo(
    () => pickLinesByRaw(gex?.rows || []),
    [gex?.rows]
  );

  const zgStrike = useMemo(() => {
    const r1 = redLines.find((l) => l.label === "R1")?.strike;
    const s1 = greenLines.find((l) => l.label === "S1")?.strike;
    return gex?.rows ? pickZeroGammaStrike(gex.rows, r1, s1) : null;
  }, [gex?.rows, redLines, greenLines]);

  /* ---------- Axis ranges ---------- */
  const haveTicks = niftyPoints.length > 0;
  const yFromTicks = haveTicks ? niftyPoints.map((p) => p.y) : [];
  const lineLevels = [
    ...redLines.map((l) => l.strike),
    ...greenLines.map((l) => l.strike),
    ...(zgStrike ? [zgStrike] : []),
  ];
  const spotFallback = Number.isFinite(gex?.spot) ? (gex!.spot as number) : 25000;
  const rawMin = Math.min(
    ...(yFromTicks.length ? [Math.min(...yFromTicks)] : [spotFallback]),
    ...(lineLevels.length ? [Math.min(...lineLevels)] : [spotFallback])
  );
  const rawMax = Math.max(
    ...(yFromTicks.length ? [Math.max(...yFromTicks)] : [spotFallback]),
    ...(lineLevels.length ? [Math.max(...lineLevels)] : [spotFallback])
  );
  const nPad = Math.max(10, Math.round(((rawMax - rawMin) || 1) * 0.08));
  const yMin = Math.floor(rawMin - nPad);
  const yMax = Math.ceil(rawMax + nPad);

  const fallbackStart = (() => { const d = new Date(); d.setHours(9, 0, 0, 0); return d.getTime(); })();
  const xMin = fromMs ?? fallbackStart;
  const xMax = toMs ?? Math.max(Date.now(), xMin + 60_000);

  const series = [{ name: "NIFTY Spot", data: niftyPoints }] as any;

  /* ---------- Annotations (labels only: R1/R2/S1/S2; legend carries the meaning) ---------- */
  const yAxisAnnotations = [
    ...redLines.filter(l => l.label === "R1").map(l => ({
      y: l.strike,
      yAxisIndex: 0,
      borderColor: C.annRedLine,
      borderWidth: 2.5,
      strokeDashArray: 0,
      label: {
        text: `R1 @ ${l.strike}`,
        style: { background: C.annRedBg, color: C.annRedText, fontSize: "10px" },
        position: "right",
        offsetX: 10,
      },
    })),
    ...redLines.filter(l => l.label === "R2").map(l => ({
      y: l.strike,
      yAxisIndex: 0,
      borderColor: C.annRed2Line,
      borderWidth: 2.5,
      strokeDashArray: 0,
      label: {
        text: `R2 @ ${l.strike}`,
        style: { background: C.annRed2Bg, color: C.annRedText, fontSize: "10px" },
        position: "right",
        offsetX: 10,
      },
    })),
    ...greenLines.filter(l => l.label === "S1").map(l => ({
      y: l.strike,
      yAxisIndex: 0,
      borderColor: C.annGreenLine,
      borderWidth: 2.5,
      strokeDashArray: 0,
      label: {
        text: `S1 @ ${l.strike}`,
        style: { background: C.annGreenBg, color: C.annGreenText, fontSize: "10px" },
        position: "right",
        offsetX: 10,
      },
    })),
    ...greenLines.filter(l => l.label === "S2").map(l => ({
      y: l.strike,
      yAxisIndex: 0,
      borderColor: C.annGreen2Line,
      borderWidth: 2.5,
      strokeDashArray: 0,
      label: {
        text: `S2 @ ${l.strike}`,
        style: { background: C.annGreen2Bg, color: C.annGreenText, fontSize: "10px" },
        position: "right",
        offsetX: 10,
      },
    })),
    ...(zgStrike ? [{
      y: zgStrike,
      yAxisIndex: 0,
      borderColor: C.flipLine,
      borderWidth: 2.5,
      strokeDashArray: 6,
      label: {
        text: `Flip @ ${zgStrike}`,
        style: { background: C.flipBg, color: C.flipText, fontSize: "10px" },
        position: "right",
        offsetX: 10,
      },
    }] : []),
  ] as any;

  const options: ApexOptions = {
    chart: {
      type: "line",
      height: CHART_H,
      toolbar: { show: true },
      animations: { enabled: false },
      background: C.bg,
      redrawOnParentResize: true,
      zoom: { enabled: false },
      foreColor: C.axis,
    },
    theme: { mode: isDark ? "dark" : "light" },
    dataLabels: { enabled: false },
    legend: { show: false },
    xaxis: {
      type: "datetime",
      labels: { datetimeUTC: false },
      min: xMin,
      max: xMax,
      tickAmount: 6,
      axisBorder: { show: false },
      axisTicks: { show: false },
      tooltip: {
        enabled: true,
        formatter: (value: string) =>
          new Date(Number(value)).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" }),
      },
      crosshairs: {
        show: true,
        position: "back",
        stroke: { color: C.crosshair, width: 1.5, dashArray: 0 },
      },
    },
    yaxis: {
      opposite: false,
      decimalsInFloat: 0,
      min: yMin,
      max: yMax,
      tickAmount: 5,
      axisBorder: { show: true, color: C.axisBorder },
      labels: { style: { colors: C.axis } },
      title: { text: "NIFTY", style: { color: C.axisTitle } },
      tooltip: { enabled: true },
    },
    grid: {
      borderColor: C.grid,
      padding: { right: 36, bottom: 8 },
      strokeDashArray: 3,
    },
    colors: [C.line],
    stroke: { width: 2.6, curve: "straight" },
    markers: { size: 0, hover: { size: 4 } },
    tooltip: {
      enabled: true,
      shared: false,
      intersect: false,
      followCursor: true,
      x: { show: false },
      custom: ({ series, seriesIndex, dataPointIndex, w }: any) => {
        const price = series?.[seriesIndex]?.[dataPointIndex];
        const x = w?.globals?.seriesX?.[seriesIndex]?.[dataPointIndex];
        if (price == null || x == null) return "";
        const priceTxt = Number(price).toLocaleString("en-IN", { maximumFractionDigits: 2 });
        const timeTxt = new Date(x).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
        return `<div style="padding:6px 8px;border-radius:8px;background:${C.tooltipBg};color:${C.tooltipFg};font-size:12px;box-shadow:0 2px 8px rgba(0,0,0,.2)">${priceTxt} | ${timeTxt}</div>`;
      },
    },
    annotations: { yaxis: yAxisAnnotations },
    noData: { text: "Loading NIFTY line…" },
  };

  const chartKey = `${xMin}-${xMax}-${niftyPoints.length}-${C.line}`;

  /* ---------- Legend (under x-axis, no background) ---------- */
  const legendItems = [
    { color: "#ef4444", text: "strong sell" },
    { color: "#fca5a5", text: "sell" },
    { color: "#10b981", text: "strong buy" },
    { color: "#86efac", text: "buy" },
    { color: C.flipLine, text: "zone change" },
  ];

  return (
    <div className="p-2 md:p-3">
      {/* Header */}
      <div
        className="mb-2 flex items-center gap-2 flex-wrap"
        style={{ position: "relative", zIndex: 50 }}
      >
        <h1
          className="text-lg font-semibold"
          style={{
            color: '#777777',
            textShadow: isDark ? "0 1px 1px rgba(0,0,0,.6)" : "none",
            mixBlendMode: "normal",
          }}
        >
          NIFTY — CE/PE Γ levels
        </h1>
        <span className="text-xs" style={{ color: '#777777' }}>
          Expiry: {gex?.expiry ?? "-"}
        </span>
        {loading && <span className="text-xs" style={{ color: C.subFg }}>Loading…</span>}
        {!!err && <span className="text-xs" style={{ color: "#ef4444" }}>Error: {err}</span>}
      </div>

      {/* Chart */}
      <Chart key={chartKey} options={options} series={series} type="line" height={CHART_H} />

      {/* Legend BELOW x-axis (no background) */}
      <div
        className="mt-2 flex items-center justify-center gap-4 flex-wrap text-[11px]"
        style={{ color: C.fg }} // Use the theme's foreground color
      >
        {legendItems.map((it) => (
          <div key={it.text} className="flex items-center gap-2 whitespace-nowrap">
            <span className="inline-block h-2 w-2 rounded-full" style={{ background: it.color }} />
            <span style={{color: '#777777'}}>{it.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
} 