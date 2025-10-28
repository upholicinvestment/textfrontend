// src/pages/Home_Components/Call_Put/Call_Put.tsx
import { useEffect, useMemo, useRef, useState } from "react";

/* ========= Config ========= */
const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "https://api.upholictech.com/api";
const REFRESH_MS = 180_000; // 3 minutes

/* ========= Sizing ========= */
const CHART_H = 370;

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

type CandlestickData = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
};

type TicksApiResp = {
  symbol: string;
  expiry: string;
  trading_day_ist: string;
  from?: string;
  to?: string;
  points: { x: number; y: number }[];
  count?: number;
};

type LineMark = {
  strike: number;
  label: "R1" | "R2" | "S1" | "S2" | "Flip";
  color: string;
  side?: "ce" | "pe";
};

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
  bg: string;
  grid: string;
  text: string;
  line: string;
  bear: string;
  bull: string;
  crosshair: string;
  tooltipBg: string;
  tooltipFg: string;
  annRedLine: string;
  annRedBg: string;
  annRedText: string;
  annRed2Line: string;
  annRed2Bg: string;
  annGreenLine: string;
  annGreenBg: string;
  annGreenText: string;
  annGreen2Line: string;
  annGreen2Bg: string;
  flipLine: string;
  flipBg: string;
  flipText: string;
};

function getThemeColors(isDark: boolean): ThemeSet {
  if (isDark) {
    return {
      bg: "rgba(0, 0, 0, 0)",
      grid: "rgba(55, 65, 81, 0.35)",
      text: "#D1D5DB",
      line: "#3b82f6",
      bear: "#ef4444",
      bull: "#10b981",
      crosshair: "rgba(148, 163, 184, 0.45)",
      tooltipBg: "#0b1220",
      tooltipFg: "#ffffff",
      annRedLine: "rgba(239, 68, 68, 0.85)",
      annRedBg: "#7f1d1d33",
      annRedText: "#fecaca",
      annRed2Line: "rgba(252, 165, 165, 0.95)",
      annRed2Bg: "#fecaca26",
      annGreenLine: "rgba(16, 185, 129, 0.9)",
      annGreenBg: "#065f4626",
      annGreenText: "#bbf7d0",
      annGreen2Line: "rgba(134, 239, 172, 0.95)",
      annGreen2Bg: "#bbf7d026",
      flipLine: "#f59e0b",
      flipBg: "rgba(245, 158, 11, 0.16)",
      flipText: "#fde68a",
    };
  }
  return {
    bg: "rgba(255, 255, 255, 0)",
    grid: "rgba(17, 24, 39, 0.12)",
    text: "#374151",
    line: "#1d4ed8",
    bear: "#dc2626",
    bull: "#059669",
    crosshair: "rgba(17, 24, 39, 0.45)",
    tooltipBg: "#ffffff",
    tooltipFg: "#111827",
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
  };
}

const finite = (n: unknown): n is number =>
  typeof n === "number" && Number.isFinite(n);

function rankMap(
  rows: GexRow[],
  key: "gex_oi_raw" | "gex_vol_raw",
  desc: boolean
): Map<number, number> {
  const sorted = [...rows].sort((a, b) =>
    desc ? b[key] - a[key] : a[key] - b[key]
  );
  const map = new Map<number, number>();
  for (let i = 0; i < sorted.length; i++) map.set(sorted[i].strike, i + 1);
  return map;
}

function rankMapAbs(rows: GexRow[], key: "gex_oi_raw"): Map<number, number> {
  const sorted = [...rows].sort(
    (a, b) => Math.abs(a[key]) - Math.abs(b[key])
  );
  const map = new Map<number, number>();
  for (let i = 0; i < sorted.length; i++) map.set(sorted[i].strike, i + 1);
  return map;
}

function pickLinesByRaw(rows: GexRow[]): { red: LineMark[]; green: LineMark[] } {
  const valid = rows.filter(
    (r) =>
      finite(r.strike) &&
      finite(r.gex_oi_raw) &&
      finite(r.gex_vol_raw) &&
      !(r.gex_oi_raw === 0 && r.gex_vol_raw === 0)
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
    (r) =>
      finite(r.strike) &&
      r.strike >= lo &&
      r.strike <= hi &&
      finite(r.gex_oi_raw) &&
      finite(r.gex_vol_raw)
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

/* Convert line data to candlestick data for any interval (minutes) */
function convertToCandlestick(
  linePoints: { x: number; y: number }[],
  intervalMin: number
): CandlestickData[] {
  if (!Array.isArray(linePoints) || linePoints.length === 0) return [];

  const intervalMs = Math.max(1, intervalMin) * 60 * 1000;
  const candles: CandlestickData[] = [];

  let curBucket = 0;
  let open = 0;
  let high = -Infinity;
  let low = Infinity;
  let close = 0;
  let hasBucket = false;

  for (let i = 0; i < linePoints.length; i++) {
    const { x, y } = linePoints[i];
    const bucket = Math.floor(x / intervalMs) * intervalMs;

    if (!hasBucket) {
      curBucket = bucket;
      open = y;
      high = y;
      low = y;
      close = y;
      hasBucket = true;
      continue;
    }

    if (bucket === curBucket) {
      if (y > high) high = y;
      if (y < low) low = y;
      close = y;
    } else {
      candles.push({
        time: curBucket / 1000,
        open,
        high: Number.isFinite(high) ? high : open,
        low: Number.isFinite(low) ? low : open,
        close,
      });
      // start next
      curBucket = bucket;
      open = close; // previous close as new open
      high = y;
      low = y;
      close = y;
    }
  }

  if (hasBucket) {
    candles.push({
      time: curBucket / 1000,
      open,
      high: Number.isFinite(high) ? high : open,
      low: Number.isFinite(low) ? low : open,
      close,
    });
  }

  return candles;
}

/* ---- IST formatter (used for crosshair + axis) ---- */
const fmtIST = (sec: number) =>
  new Date(sec * 1000).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

export default function NiftyGexLevelsPage({
  panel = "card",
}: {
  panel?: "card" | "fullscreen";
}) {
  const isDark = useIsDark();
  const C = useMemo(() => getThemeColors(isDark), [isDark]);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  const seriesRef = useRef<any>(null);
  const priceLinesRef = useRef<any[]>([]);

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

  const [niftyPoints, setNiftyPoints] = useState<{ x: number; y: number }[]>(
    []
  );

  // 🔽 New: interval selector state
  const [intervalMin, setIntervalMin] = useState<1 | 3 | 5 | 15 | 30>(3);
  const [candlestickData, setCandlestickData] = useState<CandlestickData[]>([]);

  /* -------- Fetch rows & initial spot -------- */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setErr("");
        const qs = activeExpiry
          ? `?expiry=${activeExpiry}`
          : urlExpiry
          ? `?expiry=${urlExpiry}`
          : "";
        const res = await fetch(`${API_BASE}/gex/nifty/cache${qs}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const j: any = await res.json();
        if (cancelled) return;

        const normalizedExpiry: string =
          (j.expiry as string) ||
          activeExpiry ||
          urlExpiry ||
          new Date().toISOString().slice(0, 10);
        setActiveExpiry(normalizedExpiry);

        const rows: GexRow[] = Array.isArray(j.rows)
          ? (j.rows as ApiRow[])
              .map(
                (r): GexRow => ({
                  strike: Number(r?.strike ?? 0),
                  gex_oi_raw: Number(r?.gex_oi_raw ?? 0),
                  gex_vol_raw: Number(r?.gex_vol_raw ?? 0),
                  ce_oi: Number(r?.ce_oi ?? 0),
                  pe_oi: Number(r?.pe_oi ?? 0),
                  ce_vol: Number(r?.ce_vol ?? 0),
                  pe_vol: Number(r?.pe_vol ?? 0),
                })
              )
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
    return () => {
      cancelled = true;
    };
  }, [urlExpiry, activeExpiry, refreshTick]);

  /* -------- Fetch NIFTY ticks -------- */
  useEffect(() => {
    if (!activeExpiry) return;
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch(
          `${API_BASE}/gex/nifty/ticks?expiry=${activeExpiry}`
        );
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const j: TicksApiResp = await r.json();
        if (cancelled) return;

        const pts = (j.points || [])
          .map((p) => ({ x: Number(p.x), y: Number(p.y) }))
          .filter((p) => Number.isFinite(p.x) && Number.isFinite(p.y))
          .sort((a, b) => a.x - b.x);

        setNiftyPoints(pts);

        if (pts.length) {
          const last = pts[pts.length - 1];
          setGex((prev) => (prev ? { ...prev, spot: last.y } : prev));
        }
      } catch {
        /* ignore transient */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activeExpiry, refreshTick]);

  /* -------- Rebuild candles whenever points or interval change -------- */
  useEffect(() => {
    setCandlestickData(convertToCandlestick(niftyPoints, intervalMin));
  }, [niftyPoints, intervalMin]);

  /* -------- Compute lines only (no hard y-bounds) -------- */
  const allLines = useMemo(() => {
    const { red: redLines, green: greenLines } = pickLinesByRaw(gex?.rows || []);
    const zgStrike = pickZeroGammaStrike(
      gex?.rows || [],
      redLines.find((l) => l.label === "R1")?.strike,
      greenLines.find((l) => l.label === "S1")?.strike
    );
    return [
      ...redLines,
      ...greenLines,
      ...(zgStrike
        ? [{ strike: zgStrike, label: "Flip", color: C.flipLine } as LineMark]
        : []),
    ];
  }, [gex?.rows, C.flipLine]);

  /* -------- Initialize Lightweight Charts -------- */
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const loadChart = async () => {
      const { createChart } = await import("lightweight-charts");

      // Clean up previous chart
      if (chartRef.current) {
        chartRef.current.remove();
        priceLinesRef.current = [];
      }

      const chart = createChart(chartContainerRef.current!, {
        height:
          panel === "fullscreen"
            ? chartContainerRef.current!.clientHeight
            : CHART_H,
        layout: {
          background: { color: C.bg },
          textColor: C.text,
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        },
        grid: {
          vertLines: { color: C.grid, visible: true },
          horzLines: { color: C.grid, visible: true },
        },
        crosshair: {
          mode: 1,
          vertLine: { color: C.crosshair, width: 1, style: 2 },
          horzLine: { color: C.crosshair, width: 1, style: 2 },
        },
        localization: {
          locale: "en-IN",
          timeFormatter: (t: number) => fmtIST(Number(t)),
        },
        rightPriceScale: {
          borderColor: C.grid,
          scaleMargins: { top: 0.1, bottom: 0.1 },
          entireTextOnly: false,
        },
        timeScale: {
          borderColor: C.grid,
          timeVisible: true,
          secondsVisible: false,
          tickMarkFormatter: (sec: number) =>
            new Date(sec * 1000).toLocaleTimeString("en-IN", {
              timeZone: "Asia/Kolkata",
              hour: "2-digit",
              minute: "2-digit",
            }),
        },
      
        watermark: { visible: false },
        overlayPriceScales: { borderColor: C.grid },
      });

      setTimeout(() => {
        const attributionElements =
          chartContainerRef.current?.querySelectorAll(
            '[data-role="attribution"]'
          );
        attributionElements?.forEach((el) => el.remove());
      }, 100);

      const candlestickSeries = chart.addCandlestickSeries({
        upColor: C.bull,
        downColor: C.bear,
        borderDownColor: C.bear,
        borderUpColor: C.bull,
        wickDownColor: C.bear,
        wickUpColor: C.bull,
        priceScaleId: "right",
      });

      seriesRef.current = candlestickSeries;
      chartRef.current = chart;

      const handleResize = () => {
        if (chartContainerRef.current && chartRef.current) {
          chartRef.current.applyOptions({
            height:
              panel === "fullscreen"
                ? chartContainerRef.current.clientHeight
                : CHART_H,
          });
        }
      };

      window.addEventListener("resize", handleResize);

      return () => {
        window.removeEventListener("resize", handleResize);
        if (chartRef.current) chartRef.current.remove();
        priceLinesRef.current = [];
      };
    };

    loadChart();
  }, [isDark, panel, C]);

  /* -------- Update chart data -------- */
  useEffect(() => {
    if (seriesRef.current && candlestickData.length > 0) {
      seriesRef.current.setData(candlestickData);
      chartRef.current?.timeScale().fitContent();
    }
  }, [candlestickData]);

  /* -------- Autoscale: candles first, lines if near; ensure min span -------- */
  useEffect(() => {
    if (!seriesRef.current) return;

    const strikes = allLines
      .map((l) => Number(l.strike))
      .filter((n) => Number.isFinite(n)) as number[];

    seriesRef.current.applyOptions({
      autoscaleInfoProvider: (original: any) => {
        const base = original?.();

        // Base (candles) range
        let candleMin = base?.priceRange.minValue ?? Infinity;
        let candleMax = base?.priceRange.maxValue ?? -Infinity;

        // Ensure candles have some height
        if (Number.isFinite(candleMin) && Number.isFinite(candleMax)) {
          const MIN_CANDLE_SPAN = 150;
          if (candleMax - candleMin < MIN_CANDLE_SPAN) {
            const mid = (candleMin + candleMax) / 2;
            candleMin = mid - MIN_CANDLE_SPAN / 2;
            candleMax = mid + MIN_CANDLE_SPAN / 2;
          }
        }

        let min = candleMin;
        let max = candleMax;

        // Only include lines that are not too far away (to avoid flattening)
        if (strikes.length && Number.isFinite(candleMin)) {
          const priceRange = candleMax - candleMin;
          const tolerance = priceRange * 1.5;
          const mid = (candleMin + candleMax) / 2;

          strikes.forEach((strike) => {
            if (Math.abs(strike - mid) <= tolerance) {
              min = Math.min(min, strike);
              max = Math.max(max, strike);
            }
          });
        }

        if (!Number.isFinite(min) || !Number.isFinite(max)) return base ?? null;

        // Padding
        const PAD_PCT = 0.1;
        const PAD_MIN = 60;
        const pad = Math.max(PAD_MIN, (max - min) * PAD_PCT);

        return { priceRange: { minValue: min - pad, maxValue: max + pad } };
      },
    });

    chartRef.current?.timeScale().fitContent();
  }, [allLines, candlestickData]);

  /* -------- Add horizontal lines for annotations -------- */
  useEffect(() => {
    if (!seriesRef.current) return;

    priceLinesRef.current.forEach((line) => {
      try {
        seriesRef.current.removePriceLine(line);
      } catch {}
    });
    priceLinesRef.current = [];

    if (allLines.length === 0) return;

    allLines.forEach((line) => {
      try {
        const priceLine = seriesRef.current.createPriceLine({
          price: line.strike,
          color: line.color,
          lineWidth: 2,
          lineStyle: line.label === "Flip" ? 2 : 0,
          axisLabelVisible: true,
          title: `${line.label} `,
        });
        priceLinesRef.current.push(priceLine);
      } catch (e) {
        console.warn("Failed to create price line:", e);
      }
    });
  }, [allLines]);

  const legendItems = [
    { color: "#ef4444", text: "strong sell" },
    { color: "#fca5a5", text: "sell" },
    { color: "#10b981", text: "strong buy" },
    { color: "#86efac", text: "buy" },
    { color: C.flipLine, text: "zone change" },
  ];

  return (
    <div
      className="p-2 md:p-3"
      style={panel === "fullscreen" ? { height: "100%" } : undefined}
    >
      {/* Header */}
      <div className="mb-2 flex items-center gap-2 flex-wrap">
        <h1 className="text-lg font-semibold" style={{ color: "#777777" }}>
          NIFTY — CE/PE Γ levels
        </h1>
        <span className="text-xs" style={{ color: "#777777" }}>
          Expiry: {gex?.expiry ?? "-"}
        </span>

        {/* 🔽 Interval selector */}
        <div className="ml-auto flex items-center gap-2">
          <label className="text-xs" style={{ color: "#777777" }}>
            
          </label>
          <select
            className="rounded-md border px-2 py-1 text-xs"
            value={intervalMin}
            onChange={(e) =>
              setIntervalMin(Number(e.target.value) as 1 | 3 | 5 | 15 | 30)
            }
          >
            <option value={1}>1m</option>
            <option value={3}>3m</option>
            <option value={5}>5m</option>
            <option value={15}>15m</option>
            <option value={30}>30m</option>
          </select>
        </div>

        {loading && (
          <span className="text-xs" style={{ color: C.text }}>
            Loading…
          </span>
        )}
        {!!err && (
          <span className="text-xs" style={{ color: "#ef4444" }}>
            Error: {err}
          </span>
        )}
      </div>

      {/* Chart Container */}
      <div
        ref={chartContainerRef}
        style={
          panel === "fullscreen"
            ? { height: "calc(100vh - 120px)", width: "100%" }
            : { height: CHART_H, minHeight: CHART_H }
        }
        className="relative"
      />
<style>{`
  .tv-lightweight-charts__logo,
  [data-role="attribution"],
  .tv-lightweight-charts a[href*="tradingview"] {
    display: none !important;
    pointer-events: none !important;
  }
`}</style>

      {/* Legend */}
      <div
        className="mt-2 flex items-center justify-center gap-4 flex-wrap text-[11px]"
        style={{ color: C.text }}
      >
        {legendItems.map((it) => (
          <div key={it.text} className="flex items-center gap-2 whitespace-nowrap">
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ background: it.color }}
            />
            <span style={{ color: "#808080" }}>{it.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}






















// client/src/pages/NiftyGexLevelsPage.tsx
// import { useEffect, useMemo, useState } from "react";
// import Chart from "react-apexcharts";
// import type { ApexOptions } from "apexcharts";

// /* ========= Config ========= */
// const API_BASE =
//   import.meta.env.VITE_API_BASE_URL || "https://api.upholictech.com/api";
// const REFRESH_MS = 180_000; // 3 minutes

// /* ========= Sizing ========= */
// const CHART_H = 320;

// /* ========= Types ========= */
// type GexRow = {
//   strike: number;
//   gex_oi_raw: number;
//   gex_vol_raw: number;
//   ce_oi: number;
//   pe_oi: number;
//   ce_vol: number;
//   pe_vol: number;
// };
// type ApiRow = Partial<GexRow>;

// type GexResponse = {
//   symbol: string;
//   expiry: string;
//   spot: number;
//   rows: GexRow[];
//   updated_at?: string;
// };

// type TickPoint = { x: number; y: number };

// /* ========= Weighting (OI > VOL) ========= */
// const OI_WEIGHT = 2;
// const VOL_WEIGHT = 1;

// /* ---------- sessionStorage + ETag (bulk) ---------- */
// const BULK_URL = `${API_BASE.replace(/\/$/, "")}/gex/nifty/bulk`;
// const SS_DAY = (exp: string) => `nifty.gex.bulk.v1.day.${exp || "default"}`;
// const SS_PAYLOAD = (exp: string, day: string) =>
//   `nifty.gex.bulk.v1.${exp || "default"}.${day || "today"}`;
// const SS_ETAG = (exp: string, day: string) =>
//   `nifty.gex.bulk.v1.${exp || "default"}.${day || "today"}.etag`;

// /* ---------- Theme detection + palettes ---------- */
// function useIsDark(): boolean {
//   const get = () =>
//     document.documentElement.classList.contains("dark") ||
//     window.matchMedia?.("(prefers-color-scheme: dark)")?.matches ||
//     false;
//   const [isDark, setIsDark] = useState<boolean>(get);

//   useEffect(() => {
//     const mm = window.matchMedia?.("(prefers-color-scheme: dark)");
//     const onMedia = (e: MediaQueryListEvent) =>
//       setIsDark(
//         e.matches || document.documentElement.classList.contains("dark")
//       );
//     mm?.addEventListener?.("change", onMedia);

//     const obs = new MutationObserver(() =>
//       setIsDark(
//         document.documentElement.classList.contains("dark") ||
//           window.matchMedia?.("(prefers-color-scheme: dark)")?.matches ||
//           false
//       )
//     );
//     obs.observe(document.documentElement, {
//       attributes: true,
//       attributeFilter: ["class", "data-theme"],
//     });

//     return () => {
//       mm?.removeEventListener?.("change", onMedia);
//       obs.disconnect();
//     };
//   }, []);

//   return isDark;
// }

// type ThemeSet = {
//   bg: string; fg: string; axis: string; axisTitle: string; axisBorder: string; grid: string;
//   crosshair: string; line: string; tooltipBg: string; tooltipFg: string;
//   panelBg: string; panelFg: string; panelBorder: string; volGrad: string;
//   annRedLine: string; annRedBg: string; annRedText: string; annRed2Line: string; annRed2Bg: string;
//   annGreenLine: string; annGreenBg: string; annGreenText: string; annGreen2Line: string; annGreen2Bg: string;
//   flipLine: string; flipBg: string; flipText: string; headerFg: string; subFg: string;
// };

// function getThemeColors(isDark: boolean): ThemeSet {
//   if (isDark) {
//     return {
//       bg: "transparent",
//       fg: "#E5E7EB",
//       axis: "#bfdbfe",
//       axisTitle: "#93c5fd",
//       axisBorder: "rgba(59,130,246,.45)",
//       grid: "rgba(55,65,81,.35)",
//       crosshair: "rgba(148,163,184,.45)",
//       line: "#3b82f6",
//       tooltipBg: "#0b1220",
//       tooltipFg: "#ffffff",
//       panelBg: "#0b1220",
//       panelFg: "#E5E7EB",
//       panelBorder: "rgba(148,163,184,.18)",
//       volGrad: "linear-gradient(to right, rgba(148,163,184,0.9), rgba(71,85,105,0.95))",
//       annRedLine: "rgba(239,68,68,.85)",
//       annRedBg: "#7f1d1d33",
//       annRedText: "#fecaca",
//       annRed2Line: "rgba(252,165,165,.95)",
//       annRed2Bg: "#fecaca26",
//       annGreenLine: "rgba(16,185,129,.9)",
//       annGreenBg: "#065f4626",
//       annGreenText: "#bbf7d0",
//       annGreen2Line: "rgba(134,239,172,.95)",
//       annGreen2Bg: "#bbf7d026",
//       flipLine: "#f59e0b",
//       flipBg: "rgba(245,158,11,.16)",
//       flipText: "#fde68a",
//       headerFg: "#F9FAFB",
//       subFg: "#E5E7EB",
//     };
//   }
//   return {
//     bg: "transparent",
//     fg: "#111827",
//     axis: "#374151",
//     axisTitle: "#111827",
//     axisBorder: "#1d4ed8",
//     grid: "rgba(17,24,39,.12)",
//     crosshair: "rgba(17,24,39,.45)",
//     line: "#1d4ed8",
//     tooltipBg: "#ffffff",
//     tooltipFg: "#111827",
//     panelBg: "#ffffff",
//     panelFg: "#111827",
//     panelBorder: "rgba(0,0,0,.10)",
//     volGrad: "linear-gradient(to right, rgba(55,65,81,.55), rgba(17,24,39,.75))",
//     annRedLine: "#dc2626",
//     annRedBg: "#fee2e2",
//     annRedText: "#991b1b",
//     annRed2Line: "#f87171",
//     annRed2Bg: "#ffe4e6",
//     annGreenLine: "#059669",
//     annGreenBg: "#dcfce7",
//     annGreenText: "#065f46",
//     annGreen2Line: "#34d399",
//     annGreen2Bg: "#d1fae5",
//     flipLine: "#f59e0b",
//     flipBg: "#FEF3C7",
//     flipText: "#92400e",
//     headerFg: "#111827",
//     subFg: "#374151",
//   };
// }

// /* ---------- Lines selection ---------- */
// type LineMark = { strike: number; label: "R1" | "R2" | "S1" | "S2"; color: string; side: "ce" | "pe"; };
// const finite = (n: unknown): n is number => typeof n === "number" && Number.isFinite(n);

// function rankMap(rows: GexRow[], key: "gex_oi_raw" | "gex_vol_raw", desc: boolean): Map<number, number> {
//   const sorted = [...rows].sort((a, b) => (desc ? b[key] - a[key] : a[key] - b[key]));
//   const map = new Map<number, number>();
//   for (let i = 0; i < sorted.length; i++) map.set(sorted[i].strike, i + 1);
//   return map;
// }
// function rankMapAbs(rows: GexRow[], key: "gex_oi_raw"): Map<number, number> {
//   const sorted = [...rows].sort((a, b) => Math.abs(a[key]) - Math.abs(b[key]));
//   const map = new Map<number, number>();
//   for (let i = 0; i < sorted.length; i++) map.set(sorted[i].strike, i + 1);
//   return map;
// }
// function pickLinesByRaw(rows: GexRow[]): { red: LineMark[]; green: LineMark[] } {
//   const valid = rows.filter(
//     (r) =>
//       finite(r.strike) &&
//       finite(r.gex_oi_raw) &&
//       finite(r.gex_vol_raw) &&
//       !(r.gex_oi_raw === 0 && r.gex_vol_raw === 0)
//   );
//   const pos = valid.filter((r) => r.gex_oi_raw > 0 && r.gex_vol_raw > 0);
//   const neg = valid.filter((r) => r.gex_oi_raw < 0 && r.gex_vol_raw < 0);

//   const red: LineMark[] = [];
//   if (pos.length) {
//     const oiRank = rankMap(pos, "gex_oi_raw", true);
//     const volRank = rankMap(pos, "gex_vol_raw", true);
//     const scored = pos.map((r) => {
//       const oiR = oiRank.get(r.strike) ?? 9999;
//       const volR = volRank.get(r.strike) ?? 9999;
//       return { strike: r.strike, oiR, volR, score: OI_WEIGHT * oiR + VOL_WEIGHT * volR };
//     });
//     scored.sort((a, b) => a.score - b.score || a.oiR - b.oiR || a.volR - b.volR);
//     if (scored[0]) red.push({ strike: scored[0].strike, label: "R1", color: "#ef4444", side: "ce" });
//     if (scored[1]) red.push({ strike: scored[1].strike, label: "R2", color: "#fca5a5", side: "ce" });
//   }

//   const green: LineMark[] = [];
//   if (neg.length) {
//     const oiRank = rankMap(neg, "gex_oi_raw", false);
//     const volRank = rankMap(neg, "gex_vol_raw", false);
//     const scored = neg.map((r) => {
//       const oiR = oiRank.get(r.strike) ?? 9999;
//       const volR = volRank.get(r.strike) ?? 9999;
//       return { strike: r.strike, oiR, volR, score: OI_WEIGHT * oiR + VOL_WEIGHT * volR };
//     });
//     scored.sort((a, b) => a.score - b.score || a.oiR - b.oiR || a.volR - b.volR);
//     if (scored[0]) green.push({ strike: scored[0].strike, label: "S1", color: "#10b981", side: "pe" });
//     if (scored[1]) green.push({ strike: scored[1].strike, label: "S2", color: "#86efac", side: "pe" });
//   }
//   return { red, green };
// }
// function pickZeroGammaStrike(rows: GexRow[], r1?: number, s1?: number): number | null {
//   if (!finite(r1) || !finite(s1)) return null;
//   const lo = Math.min(r1!, s1!);
//   const hi = Math.max(r1!, s1!);
//   const between = rows.filter(
//     (r) => finite(r.strike) && r.strike >= lo && r.strike <= hi && finite(r.gex_oi_raw) && finite(r.gex_vol_raw)
//   );
//   if (!between.length) return null;

//   const absOiRank = rankMapAbs(between, "gex_oi_raw");
//   const volRank = rankMap(between, "gex_vol_raw", true);
//   const scored = between.map((r) => ({
//     strike: r.strike,
//     score: (absOiRank.get(r.strike) || 9999) + (volRank.get(r.strike) || 9999),
//   }));
//   scored.sort((a, b) => a.score - b.score);
//   return scored[0]?.strike ?? null;
// }

// /* ========= Component ========= */
// /** Added optional `panel` to support fullscreen from ChartMapping */
// export default function NiftyGexLevelsPage({ panel = "card" }: { panel?: "card" | "fullscreen" }) {
//   const isDark = useIsDark();
//   const C = useMemo(() => getThemeColors(isDark), [isDark]);

//   const [gex, setGex] = useState<GexResponse | null>(null);
//   const [err, setErr] = useState("");
//   const [loading, setLoading] = useState(false);

//   const urlExpiry = useMemo(() => {
//     const q = new URLSearchParams(window.location.search).get("expiry");
//     return q && /^\d{4}-\d{2}-\d{2}$/.test(q) ? q : null;
//   }, []);
//   const [activeExpiry, setActiveExpiry] = useState<string | null>(urlExpiry);

//   const [refreshTick, setRefreshTick] = useState(0);
//   useEffect(() => {
//     const id = setInterval(() => setRefreshTick((t) => t + 1), REFRESH_MS);
//     return () => clearInterval(id);
//   }, []);

//   const [niftyPoints, setNiftyPoints] = useState<TickPoint[]>([]);
//   const [fromMs, setFromMs] = useState<number | null>(null);
//   const [, setToMs] = useState<number | null>(null);

//   // Apex dropdown styles (theme aware)
//   useEffect(() => {
//     const style = document.createElement("style");
//     style.textContent = `
//       .apexcharts-menu {
//         background:${C.panelBg} !important;
//         color:${C.panelFg} !important;
//         border:1px solid ${C.panelBorder} !important;
//         box-shadow:0 6px 18px rgba(0,0,0,.15) !important;
//       }
//       .apexcharts-menu-item { color:${C.panelFg} !important; }
//       .apexcharts-menu-item:hover { background:rgba(148,163,184,.12) !important; }
//     `;
//     document.head.appendChild(style);
//     return () => {
//       if (style.parentNode) style.parentNode.removeChild(style);
//     };
//   }, [C.panelBg, C.panelFg, C.panelBorder]);

//   /* -------- Bulk fetch: rows + ticks + ETag + sessionStorage -------- */
//   useEffect(() => {
//     let cancelled = false;
//     (async () => {
//       try {
//         setLoading(true);
//         setErr("");

//         const exp = activeExpiry || urlExpiry || "";
//         const params = new URLSearchParams();
//         if (exp) params.set("expiry", exp);
//         params.set("scope", "today"); // default; switch to 'since' & sinceMin=1440 for 24h backfill if you want
//         const bulkUrl = `${BULK_URL}?${params.toString()}`;

//         // 1) Fast path: sessionStorage by (expiry, day)
//         const storedDay = sessionStorage.getItem(SS_DAY(exp)) || "";
//         if (storedDay) {
//           const cached = sessionStorage.getItem(SS_PAYLOAD(exp, storedDay));
//           if (cached) {
//             try {
//               const j = JSON.parse(cached);
//               if (!cancelled && j?.gex && j?.ticks) {
//                 const rows: GexRow[] = (j.gex.rows || []).map((r: ApiRow) => ({
//                   strike: Number(r?.strike ?? 0),
//                   gex_oi_raw: Number(r?.gex_oi_raw ?? 0),
//                   gex_vol_raw: Number(r?.gex_vol_raw ?? 0),
//                   ce_oi: Number(r?.ce_oi ?? 0),
//                   pe_oi: Number(r?.pe_oi ?? 0),
//                   ce_vol: Number(r?.ce_vol ?? 0),
//                   pe_vol: Number(r?.pe_vol ?? 0),
//                 }));
//                 setGex({
//                   symbol: j.gex.symbol || "NIFTY",
//                   expiry: j.gex.expiry,
//                   spot: Number(j.gex.spot ?? 0),
//                   rows,
//                   updated_at: j.gex.updated_at,
//                 });

//                 const pts: TickPoint[] = (j.ticks.points || [])
//                   .map((p: any) => ({ x: Number(p.x), y: Number(p.y) }))
//                   .filter((p: TickPoint) => Number.isFinite(p.x) && Number.isFinite(p.y))
//                   .sort((a: TickPoint, b: TickPoint) => a.x - b.x);

//                 setNiftyPoints(pts);
//                 const f = j.ticks.from ? Date.parse(j.ticks.from) : NaN;
//                 const t = j.ticks.to ? Date.parse(j.ticks.to) : NaN;
//                 setFromMs(Number.isFinite(f) ? f : null);
//                 setToMs(Number.isFinite(t) ? t : null);
//                 if (pts.length) setGex((prev) => (prev ? { ...prev, spot: pts[pts.length - 1].y } : prev));
//                 setLoading(false);
//               }
//             } catch {}
//           }
//         }

//         // 2) Conditional GET with ETag
//         const etag = storedDay ? sessionStorage.getItem(SS_ETAG(exp, storedDay)) || "" : "";
//         const resp = await fetch(`${bulkUrl}&_=${Date.now()}`, {
//           cache: "no-store",
//           headers: etag ? { "If-None-Match": etag } : {},
//         });

//         if (resp.status === 304) {
//           if (!cancelled) setLoading(false);
//           return;
//         }
//         if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

//         const j = await resp.json();
//         const day: string = j?.day || resp.headers.get("X-GEX-Day") || "";

//         if (day && day !== storedDay) {
//           if (storedDay) {
//             sessionStorage.removeItem(SS_PAYLOAD(exp, storedDay));
//             sessionStorage.removeItem(SS_ETAG(exp, storedDay));
//           }
//           sessionStorage.setItem(SS_DAY(exp), day);
//         }

//         const newTag = resp.headers.get("ETag") || "";
//         try {
//           sessionStorage.setItem(SS_PAYLOAD(exp, day), JSON.stringify(j));
//           if (newTag) sessionStorage.setItem(SS_ETAG(exp, day), newTag);
//         } catch {}

//         if (cancelled) return;

//         // paint from network
//         const rows: GexRow[] = (j?.gex?.rows || []).map((r: ApiRow) => ({
//           strike: Number(r?.strike ?? 0),
//           gex_oi_raw: Number(r?.gex_oi_raw ?? 0),
//           gex_vol_raw: Number(r?.gex_vol_raw ?? 0),
//           ce_oi: Number(r?.ce_oi ?? 0),
//           pe_oi: Number(r?.pe_oi ?? 0),
//           ce_vol: Number(r?.ce_vol ?? 0),
//           pe_vol: Number(r?.pe_vol ?? 0),
//         }));
//         const normalizedExpiry: string =
//           j?.gex?.expiry || activeExpiry || urlExpiry || new Date().toISOString().slice(0, 10);
//         setActiveExpiry(normalizedExpiry);

//         setGex({
//           symbol: j?.gex?.symbol || "NIFTY",
//           expiry: normalizedExpiry,
//           spot: Number(j?.gex?.spot ?? 0),
//           rows,
//           updated_at: j?.gex?.updated_at,
//         });

//         const pts: TickPoint[] = (j?.ticks?.points || [])
//           .map((p: any) => ({ x: Number(p.x), y: Number(p.y) }))
//           .filter((p: TickPoint) => Number.isFinite(p.x) && Number.isFinite(p.y))
//           .sort((a: TickPoint, b: TickPoint) => a.x - b.x);

//         setNiftyPoints(pts);
//         const f = j?.ticks?.from ? Date.parse(j.ticks.from) : NaN;
//         const t = j?.ticks?.to ? Date.parse(j.ticks.to) : NaN;
//         setFromMs(Number.isFinite(f) ? f : null);
//         setToMs(Number.isFinite(t) ? t : null);
//         if (pts.length) setGex((prev) => (prev ? { ...prev, spot: pts[pts.length - 1].y } : prev));
//         setLoading(false);
//       } catch (e: any) {
//         if (!cancelled) {
//           setErr(e?.message || "Failed to load");
//           setLoading(false);
//         }
//       }
//     })();
//     return () => {
//       cancelled = true;
//     };
//   }, [activeExpiry, urlExpiry, refreshTick]);

//   /* ---------- Lines ---------- */
//   const { red: redLines, green: greenLines } = useMemo(
//     () => pickLinesByRaw(gex?.rows || []),
//     [gex?.rows]
//   );

//   const zgStrike = useMemo(() => {
//     const r1 = redLines.find((l) => l.label === "R1")?.strike;
//     const s1 = greenLines.find((l) => l.label === "S1")?.strike;
//     return gex?.rows ? pickZeroGammaStrike(gex.rows, r1, s1) : null;
//   }, [gex?.rows, redLines, greenLines]);

//   /* ---------- Axis ranges ---------- */
//   const niftyPointsArr = niftyPoints;
//   const haveTicks = niftyPointsArr.length > 0;
//   const yFromTicks = haveTicks ? niftyPointsArr.map((p) => p.y) : [];
//   const lineLevels = [
//     ...redLines.map((l) => l.strike),
//     ...greenLines.map((l) => l.strike),
//     ...(zgStrike ? [zgStrike] : []),
//   ];
//   const spotFallback = Number.isFinite(gex?.spot) ? (gex!.spot as number) : 25000;
//   const rawMin = Math.min(
//     ...(yFromTicks.length ? [Math.min(...yFromTicks)] : [spotFallback]),
//     ...(lineLevels.length ? [Math.min(...lineLevels)] : [spotFallback])
//   );
//   const rawMax = Math.max(
//     ...(yFromTicks.length ? [Math.max(...yFromTicks)] : [spotFallback]),
//     ...(lineLevels.length ? [Math.max(...lineLevels)] : [spotFallback])
//   );
//   const nPad = Math.max(10, Math.round(((rawMax - rawMin) || 1) * 0.08));
//   const yMin = Math.floor(rawMin - nPad);
//   const yMax = Math.ceil(rawMax + nPad);

//   /* 👉 Force full market session on the X axis (09:15–15:30 of the trading day) */
//   const baseForSession =
//     (fromMs ?? (niftyPointsArr.length ? niftyPointsArr[0].x : Date.now()));
//   const sessionStart = (() => { const d = new Date(baseForSession); d.setHours(9, 15, 0, 0);  return d.getTime(); })();
//   const sessionEnd   = (() => { const d = new Date(baseForSession); d.setHours(15, 30, 0, 0); return d.getTime(); })();

//   const xMin = sessionStart;
//   const xMax = sessionEnd;

//   const series = [{ name: "NIFTY Spot", data: niftyPointsArr }] as any;

//   /* ---------- Annotations ---------- */
//   const yAxisAnnotations = [
//     ...redLines.filter(l => l.label === "R1").map(l => ({
//       y: l.strike,
//       yAxisIndex: 0,
//       borderColor: getThemeColors(isDark).annRedLine,
//       borderWidth: 2.5,
//       strokeDashArray: 0,
//       label: {
//         text: `R1 @ ${l.strike}`,
//         style: { background: getThemeColors(isDark).annRedBg, color: getThemeColors(isDark).annRedText, fontSize: "10px" },
//         position: "right",
//         offsetX: 10,
//       },
//     })),
//     ...redLines.filter(l => l.label === "R2").map(l => ({
//       y: l.strike,
//       yAxisIndex: 0,
//       borderColor: getThemeColors(isDark).annRed2Line,
//       borderWidth: 2.5,
//       strokeDashArray: 0,
//       label: {
//         text: `R2 @ ${l.strike}`,
//         style: { background: getThemeColors(isDark).annRed2Bg, color: getThemeColors(isDark).annRedText, fontSize: "10px" },
//         position: "right",
//         offsetX: 10,
//       },
//     })),
//     ...greenLines.filter(l => l.label === "S1").map(l => ({
//       y: l.strike,
//       yAxisIndex: 0,
//       borderColor: getThemeColors(isDark).annGreenLine,
//       borderWidth: 2.5,
//       strokeDashArray: 0,
//       label: {
//         text: `S1 @ ${l.strike}`,
//         style: { background: getThemeColors(isDark).annGreenBg, color: getThemeColors(isDark).annGreenText, fontSize: "10px" },
//         position: "right",
//         offsetX: 10,
//       },
//     })),
//     ...greenLines.filter(l => l.label === "S2").map(l => ({
//       y: l.strike,
//       yAxisIndex: 0,
//       borderColor: getThemeColors(isDark).annGreen2Line,
//       borderWidth: 2.5,
//       strokeDashArray: 0,
//       label: {
//         text: `S2 @ ${l.strike}`,
//         style: { background: getThemeColors(isDark).annGreen2Bg, color: getThemeColors(isDark).annGreenText, fontSize: "10px" },
//         position: "right",
//         offsetX: 10,
//       },
//     })),
//     ...(zgStrike ? [{
//       y: zgStrike,
//       yAxisIndex: 0,
//       borderColor: getThemeColors(isDark).flipLine,
//       borderWidth: 2.5,
//       strokeDashArray: 6,
//       label: {
//         text: `Flip @ ${zgStrike}`,
//         style: { background: getThemeColors(isDark).flipBg, color: getThemeColors(isDark).flipText, fontSize: "10px" },
//         position: "right",
//         offsetX: 10,
//       },
//     }] : []),
//   ] as any;

//   const options: ApexOptions = {
//     chart: {
//       type: "line",
//       height: panel === "fullscreen" ? "100%" : CHART_H,
//       toolbar: { show: true },
//       animations: { enabled: false },
//       background: C.bg,
//       redrawOnParentResize: true,
//       zoom: { enabled: false },
//       foreColor: C.axis,
//     },
//     theme: { mode: isDark ? "dark" : "light" },
//     dataLabels: { enabled: false },
//     legend: { show: false },
//     xaxis: {
//       type: "datetime",
//       labels: { datetimeUTC: false, style: { colors: '#777' } },
//       min: xMin,
//       max: xMax,
//       tickAmount: 6,
//       axisBorder: { show: false },
//       axisTicks: { show: false },
//       tooltip: {
//         enabled: true,
//         formatter: (value: string) =>
//           new Date(Number(value)).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" }),
//       },
//       crosshairs: {
//         show: true,
//         position: "back",
//         stroke: { color: '#777', width: 1.5, dashArray: 0 },
//       },
//     },
//     yaxis: {
//       opposite: false,
//       decimalsInFloat: 0,
//       min: yMin,
//       max: yMax,
//       tickAmount: 5,
//       axisBorder: { show: true, color: C.axisBorder },
//       labels: { style: { colors: '#777' } },
//       title: { text: "NIFTY", style: { color: '#777' } },
//       tooltip: { enabled: true },
//     },
//     grid: {
//       borderColor: C.grid,
//       padding: { right: 36, bottom: 8 },
//       strokeDashArray: 3,
//     },
//     colors: [C.line],
//     stroke: { width: 2.6, curve: "straight" },
//     markers: { size: 0, hover: { size: 4 } },
//     tooltip: {
//       enabled: true,
//       shared: false,
//       intersect: false,
//       followCursor: true,
//       x: { show: false },
//       custom: ({ series, seriesIndex, dataPointIndex, w }: any) => {
//         const price = series?.[seriesIndex]?.[dataPointIndex];
//         const x = w?.globals?.seriesX?.[seriesIndex]?.[dataPointIndex];
//         if (price == null || x == null) return "";
//         const priceTxt = Number(price).toLocaleString("en-IN", { maximumFractionDigits: 2 });
//         const timeTxt = new Date(x).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
//         return `<div style="padding:6px 8px;border-radius:8px;background:${C.tooltipBg};color:${C.tooltipFg};font-size:12px;box-shadow:0 2px 8px rgba(0,0,0,.2)">${priceTxt} | ${timeTxt}</div>`;
//       },
//     },
//     annotations: { yaxis: yAxisAnnotations },
//     noData: { text: "Loading NIFTY line…" },
//   };

//   const chartKey = `${xMin}-${xMax}-${niftyPointsArr.length}-${C.line}-${panel}`;

//   /* ---------- Legend ---------- */
//   const legendItems = [
//     { color: "#ef4444", text: "strong sell" },
//     { color: "#fca5a5", text: "sell" },
//     { color: "#10b981", text: "strong buy" },
//     { color: "#86efac", text: "buy" },
//     { color: C.flipLine, text: "zone change" },
//   ];

//   return (
//     <div className="p-2 md:p-3" style={panel === "fullscreen" ? { height: "100%" } : undefined}>
//       {/* Header */}
//       <div
//         className="mb-2 flex items-center gap-2 flex-wrap"
//         style={{ position: "relative" }}
//       >
//         <h1
//           className="text-lg font-semibold"
//           style={{
//             color: "#777777",
//             textShadow: isDark ? "0 1px 1px rgba(0,0,0,.6)" : "none",
//             mixBlendMode: "normal",
//           }}
//         >
//           NIFTY — CE/PE Γ levels
//         </h1>
//         <span className="text-xs" style={{ color: "#777777" }}>
//           Expiry: {gex?.expiry ?? "-"}
//         </span>
//         {loading && <span className="text-xs" style={{ color: C.subFg }}>Loading…</span>}
//         {!!err && <span className="text-xs" style={{ color: "#ef4444" }}>Error: {err}</span>}
//       </div>

//       {/* Chart */}
//       <div style={panel === "fullscreen" ? { height: "100%", width: "100%" } : undefined}>
//         <Chart
//           key={chartKey}
//           options={options}
//           series={series}
//           type="line"
//           height={panel === "fullscreen" ? "100%" : CHART_H}
//           width="100%"
//         />
//       </div>

//       {/* Legend */}
//       <div
//         className="mt-2 flex items-center justify-center gap-4 flex-wrap text-[11px]"
//         style={{ color: C.fg }}
//       >
//         {legendItems.map((it) => (
//           <div key={it.text} className="flex items-center gap-2 whitespace-nowrap">
//             <span className="inline-block h-2 w-2 rounded-full" style={{ background: it.color }} />
//             <span style={{ color: "#808080" }}>{it.text}</span>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// }
