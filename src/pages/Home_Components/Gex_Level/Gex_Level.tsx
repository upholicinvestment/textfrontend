// src/pages/Home_Components/Call_Put/NiftyGexLevelsPage.tsx
import { useEffect, useMemo, useRef, useState } from "react";

/* ========= Config ========= */
const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "https://api.upholictech.com/api";
const REFRESH_MS = 60_000; // 1 minute
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
type CandlestickData = { time: number; open: number; high: number; low: number; close: number; };
type TicksApiResp = { symbol: string; expiry: string; trading_day_ist: string; from?: string; to?: string; points: { x: number; y: number }[]; count?: number; };
type LineMark = { strike: number; label: "R1" | "R2" | "S1" | "S2" | "Flip"; color: string; side?: "ce" | "pe" };

/* ========= Utilities ========= */
const OI_WEIGHT = 2;
const VOL_WEIGHT = 1;
const finite = (n: unknown): n is number => typeof n === "number" && Number.isFinite(n);

function rankMap(rows: GexRow[], key: "gex_oi_raw" | "gex_vol_raw", desc: boolean) {
  const sorted = [...rows].sort((a, b) => (desc ? b[key] - a[key] : a[key] - b[key]));
  const map = new Map<number, number>();
  for (let i = 0; i < sorted.length; i++) map.set(sorted[i].strike, i + 1);
  return map;
}
function rankMapAbs(rows: GexRow[], key: "gex_oi_raw") {
  const sorted = [...rows].sort((a, b) => Math.abs(a[key]) - Math.abs(b[key]));
  const map = new Map<number, number>();
  for (let i = 0; i < sorted.length; i++) map.set(sorted[i].strike, i + 1);
  return map;
}
function pickLinesByRaw(rows: GexRow[]) {
  const valid = rows.filter(r => finite(r.strike) && finite(r.gex_oi_raw) && finite(r.gex_vol_raw) && !(r.gex_oi_raw === 0 && r.gex_vol_raw === 0));
  const pos = valid.filter(r => r.gex_oi_raw > 0 && r.gex_vol_raw > 0);
  const neg = valid.filter(r => r.gex_oi_raw < 0 && r.gex_vol_raw < 0);

  const red: LineMark[] = [];
  if (pos.length) {
    const oiRank = rankMap(pos, "gex_oi_raw", true);
    const volRank = rankMap(pos, "gex_vol_raw", true);
    const scored = pos.map(r => {
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
    const scored = neg.map(r => {
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

function pickZeroGammaStrike(rows: GexRow[], r1?: number, s1?: number) {
  if (!finite(r1) || !finite(s1)) return null;
  const lo = Math.min(r1!, s1!);
  const hi = Math.max(r1!, s1!);
  const between = rows.filter(r => finite(r.strike) && r.strike >= lo && r.strike <= hi && finite(r.gex_oi_raw) && finite(r.gex_vol_raw));
  if (!between.length) return null;
  const absOiRank = rankMapAbs(between, "gex_oi_raw");
  const volRank = rankMap(between, "gex_vol_raw", true);
  const scored = between.map(r => ({ strike: r.strike, score: (absOiRank.get(r.strike) || 9999) + (volRank.get(r.strike) || 9999) }));
  scored.sort((a, b) => a.score - b.score);
  return scored[0]?.strike ?? null;
}

function convertToCandlestick(linePoints: { x: number; y: number }[], intervalMin: number) {
  if (!Array.isArray(linePoints) || linePoints.length === 0) return [] as CandlestickData[];
  const intervalMs = Math.max(1, intervalMin) * 60 * 1000;
  const candles: CandlestickData[] = [];
  let curBucket = 0, open = 0, high = -Infinity, low = Infinity, close = 0, hasBucket = false;
  for (let i = 0; i < linePoints.length; i++) {
    const { x, y } = linePoints[i];
    const bucket = Math.floor(x / intervalMs) * intervalMs;
    if (!hasBucket) {
      curBucket = bucket; open = y; high = y; low = y; close = y; hasBucket = true; continue;
    }
    if (bucket === curBucket) {
      if (y > high) high = y;
      if (y < low) low = y;
      close = y;
    } else {
      candles.push({ time: curBucket / 1000, open, high: Number.isFinite(high) ? high : open, low: Number.isFinite(low) ? low : open, close });
      curBucket = bucket; open = close; high = y; low = y; close = y;
    }
  }
  if (hasBucket) candles.push({ time: curBucket / 1000, open, high: Number.isFinite(high) ? high : open, low: Number.isFinite(low) ? low : open, close });
  return candles;
}

const fmtIST = (sec: number) => new Date(sec * 1000).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", day: "2-digit", month: "short", year: "2-digit", hour: "2-digit", minute: "2-digit" });

/* ========== Theme reader (same technique as Call_Put) ========== */
function readThemeVars() {
  const scope = (document.querySelector(".theme-scope") as HTMLElement) || document.documentElement;
  const cs = getComputedStyle(scope);
  const pick = (k: string, fb: string) => (cs.getPropertyValue(k).trim() || fb);
  return {
    fg: pick("--fg", "#D1D5DB"),
    muted: pick("--muted", "#9CA3AF"),
    axis: pick("--axis", "#9CA3AF"),
    grid: pick("--grid", "rgba(55,65,81,0.35)"),
    tip: pick("--tip", "#0b1220"),
    tipbr: pick("--tipbr", "rgba(148,163,184,0.25)"),
    card: pick("--card-bg", "rgba(0,0,0,0)"),
    brd: pick("--border", "rgba(148,163,184,0.25)"),
    bull: pick("--bull", "#10b981"),
    bear: pick("--bear", "#ef4444"),
    flipLine: pick("--flip", "#f59e0b"),
  };
}

/* ========== Small helpers ========== */
function debounce<T extends (...args: any[]) => void>(fn: T, wait = 120) {
  let t: any = null;
  return (...args: Parameters<T>) => {
    if (t) clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
}

/* compute barSpacing to show roughly desiredBars in container width */
function computeBarSpacing(containerWidth: number, desiredBars = 40) {
  const min = 2;
  const max = 12;
  if (!Number.isFinite(containerWidth) || containerWidth <= 0) return 4;
  const raw = Math.max(2, Math.floor(containerWidth / Math.max(4, desiredBars)));
  return Math.max(min, Math.min(max, raw));
}

/* ================= Component ================= */
export default function NiftyGexLevelsPage({ panel = "card" }: { panel?: "card" | "fullscreen" }) {
  const chartContainerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<any>(null);
  const seriesRef = useRef<any>(null);
  // priceLinesRef: Map<key, priceLine> where key is `${strike}-${label}` to allow duplicates
  const priceLinesRef = useRef<Map<string, any>>(new Map());

  const [gex, setGex] = useState<GexResponse | null>(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const urlExpiry = useMemo(() => {
    const q = new URLSearchParams(window.location.search).get("expiry");
    return q && /^\d{4}-\d{2}-\d{2}$/.test(q) ? q : null;
  }, []);
  const [activeExpiry, setActiveExpiry] = useState<string | null>(urlExpiry);

  const [refreshTick, setRefreshTick] = useState(0);
  useEffect(() => { const id = setInterval(() => setRefreshTick(t => t + 1), REFRESH_MS); return () => clearInterval(id); }, []);

  const [niftyPoints, setNiftyPoints] = useState<{ x: number; y: number }[]>([]);
  const [intervalMin, setIntervalMin] = useState<1 | 3 | 5 | 15 | 30>(3);
  const [candlestickData, setCandlestickData] = useState<CandlestickData[]>([]);

  // theme vars + observer
  const [themeTick, setThemeTick] = useState(0);
  useEffect(() => {
    const el = document.querySelector(".theme-scope") || document.documentElement;
    if (!el) return;
    const obs = new MutationObserver(() => setThemeTick(t => t + 1));
    obs.observe(el, { attributes: true, attributeFilter: ["style", "class", "data-theme"] });
    return () => obs.disconnect();
  }, []);
  const vars = useMemo(() => readThemeVars(), [themeTick]);
  const themeKey = `${vars.card}|${vars.fg}|${vars.axis}|${vars.grid}|${vars.tip}|${vars.brd}|${themeTick}`;

  /* -------- Fetch rows & initial spot -------- */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true); setErr("");
        const qs = activeExpiry ? `?expiry=${activeExpiry}` : urlExpiry ? `?expiry=${urlExpiry}` : "";
        // <-- removed "/cache" from endpoint as requested
        const res = await fetch(`${API_BASE}/gex/nifty${qs}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const j: any = await res.json();
        if (cancelled) return;
        const normalizedExpiry: string = (j.expiry as string) || activeExpiry || urlExpiry || new Date().toISOString().slice(0, 10);
        setActiveExpiry(normalizedExpiry);
        const rows: GexRow[] = Array.isArray(j.rows)
          ? (j.rows as ApiRow[]).map(r => ({
              strike: Number(r?.strike ?? 0),
              gex_oi_raw: Number(r?.gex_oi_raw ?? 0),
              gex_vol_raw: Number(r?.gex_vol_raw ?? 0),
              ce_oi: Number(r?.ce_oi ?? 0),
              pe_oi: Number(r?.pe_oi ?? 0),
              ce_vol: Number(r?.ce_vol ?? 0),
              pe_vol: Number(r?.pe_vol ?? 0),
            })).filter(r => Number.isFinite(r.strike))
          : [];
        setGex({ symbol: (j.symbol as string) ?? "NIFTY", expiry: normalizedExpiry, spot: Number(j.spot ?? 0), rows, updated_at: j.updated_at as string | undefined });
      } catch (e: any) { setErr(e.message || String(e)); } finally { setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [urlExpiry, activeExpiry, refreshTick]);

  /* -------- Fetch ticks -------- */
  useEffect(() => {
    if (!activeExpiry) return;
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch(`${API_BASE}/gex/nifty/ticks?expiry=${activeExpiry}`);
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const j: TicksApiResp = await r.json();
        if (cancelled) return;
        const pts = (j.points || []).map(p => ({ x: Number(p.x), y: Number(p.y) })).filter(p => Number.isFinite(p.x) && Number.isFinite(p.y)).sort((a, b) => a.x - b.x);
        setNiftyPoints(pts);
        if (pts.length) {
          const last = pts[pts.length - 1];
          setGex(prev => (prev ? { ...prev, spot: last.y } : prev));
        }
      } catch { /* ignore */ }
    })();
    return () => { cancelled = true; };
  }, [activeExpiry, refreshTick]);

  /* -------- Candles from points (memo) -------- */
  useEffect(() => setCandlestickData(convertToCandlestick(niftyPoints, intervalMin)), [niftyPoints, intervalMin]);

  /* -------- Compute lines (memo) -------- */
  const allLines = useMemo(() => {
    const { red: redLines, green: greenLines } = pickLinesByRaw(gex?.rows || []);
    const zgStrike = pickZeroGammaStrike(gex?.rows || [], redLines.find(l => l.label === "R1")?.strike, greenLines.find(l => l.label === "S1")?.strike);
    return [
      ...redLines,
      ...greenLines,
      ...(zgStrike ? [{ strike: zgStrike, label: "Flip", color: vars.flipLine } as LineMark] : []),
    ];
  }, [gex?.rows, vars.flipLine]);

  /* -------- Create chart once on mount; remove on unmount -------- */
  useEffect(() => {
    let mounted = true;
    let cleanup: (() => void) | null = null;

    const init = async () => {
      const { createChart } = await import("lightweight-charts");
      if (!mounted || !chartContainerRef.current) return;

      // create chart only if not created already
      if (!chartRef.current) {
        const width = chartContainerRef.current!.clientWidth;
        chartRef.current = createChart(chartContainerRef.current!, {
          width,
          height: CHART_H,
          layout: { background: { color: vars.card }, textColor: vars.fg, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' },
          grid: { vertLines: { color: vars.grid, visible: true }, horzLines: { color: vars.grid, visible: true } },
          crosshair: { mode: 1, vertLine: { color: vars.axis, width: 1, style: 2 }, horzLine: { color: vars.axis, width: 1, style: 2 } },
          localization: { locale: "en-IN", timeFormatter: (t: number) => fmtIST(Number(t)) },
          rightPriceScale: { borderColor: vars.brd, scaleMargins: { top: 0.1, bottom: 0.1 }, entireTextOnly: false },
          timeScale: {
            borderColor: vars.brd,
            timeVisible: true,
            secondsVisible: false,
            barSpacing: computeBarSpacing(width, 40),
            minBarSpacing: 2,
            rightOffset: 6,
            tickMarkFormatter: (sec: number) =>
              new Date(sec * 1000).toLocaleTimeString("en-IN", {
                timeZone: "Asia/Kolkata",
                hour: "2-digit",
                minute: "2-digit",
              }),
          },
          watermark: { visible: false },
          overlayPriceScales: { borderColor: vars.brd },
        });

        // add series
        seriesRef.current = chartRef.current.addCandlestickSeries({
          upColor: vars.bull,
          downColor: vars.bear,
          borderDownColor: vars.bear,
          borderUpColor: vars.bull,
          wickDownColor: vars.bear,
          wickUpColor: vars.bull,
          priceScaleId: "right",
        });

        // remove attribution after render
        setTimeout(() => {
          const attributionElements = chartContainerRef.current?.querySelectorAll('[data-role="attribution"]');
          attributionElements?.forEach((el: Element) => el.remove());
        }, 100);

        // ResizeObserver (debounced)
        const ro = new ResizeObserver(debounce(() => {
          if (!chartContainerRef.current || !chartRef.current) return;
          const w = chartContainerRef.current.clientWidth;
          const h = panel === "fullscreen" ? chartContainerRef.current.clientHeight : CHART_H;
          chartRef.current.applyOptions({
            width: w,
            height: h,
            timeScale: { barSpacing: computeBarSpacing(w, 40), minBarSpacing: 2, rightOffset: 6, borderColor: vars.brd },
          });
          chartRef.current.timeScale().fitContent();
        }, 120));
        ro.observe(chartContainerRef.current);

        cleanup = () => {
          try { ro.disconnect(); } catch {}
          try { chartRef.current?.remove(); } catch {}
          chartRef.current = null;
          seriesRef.current = null;
          priceLinesRef.current.clear();
        };
      }
    };

    init().catch((e) => console.error("chart init failed", e));
    return () => { mounted = false; if (cleanup) cleanup(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // only on mount/unmount

  /* -------- Update palette/options on theme or panel change (cheap) -------- */
  useEffect(() => {
    if (!chartRef.current || !seriesRef.current) return;
    try {
      const w = chartContainerRef.current?.clientWidth ?? 800;
      chartRef.current.applyOptions({
        layout: { background: { color: vars.card }, textColor: vars.fg },
        grid: { vertLines: { color: vars.grid }, horzLines: { color: vars.grid } },
        crosshair: { vertLine: { color: vars.axis }, horzLine: { color: vars.axis } },
        rightPriceScale: { borderColor: vars.brd },
        timeScale: {
          borderColor: vars.brd,
          barSpacing: computeBarSpacing(w, 40),
          minBarSpacing: 2,
          rightOffset: 6,
        },
      });

      seriesRef.current.applyOptions({
        upColor: vars.bull,
        downColor: vars.bear,
        borderDownColor: vars.bear,
        borderUpColor: vars.bull,
        wickDownColor: vars.bear,
        wickUpColor: vars.bull,
      });

      // on panel change, adjust height immediately
      if (chartContainerRef.current) {
        chartRef.current.applyOptions({
          height: panel === "fullscreen" ? chartContainerRef.current.clientHeight : CHART_H,
          width: chartContainerRef.current.clientWidth,
        });
        chartRef.current.timeScale().fitContent();
      }
    } catch (e) {
      console.warn("applyOptions failed", e);
    }
  }, [themeKey, panel, vars.card, vars.fg, vars.grid, vars.axis, vars.brd, vars.bull, vars.bear]);

  /* -------- Efficiently update candles: update last bar if length same, else setData -------- */
  const lastDataLenRef = useRef<number>(0);
  useEffect(() => {
    if (!seriesRef.current) return;
    if (!candlestickData || !candlestickData.length) {
      lastDataLenRef.current = 0;
      return;
    }
    const newLen = candlestickData.length;
    if (lastDataLenRef.current === newLen) {
      // update only last
      const last = candlestickData[newLen - 1];
      try {
        seriesRef.current.update(last);
      } catch (e) {
        // fallback to full set
        try { seriesRef.current.setData(candlestickData); chartRef.current?.timeScale().fitContent(); } catch {}
      }
    } else {
      // structural change -> full set
      try {
        seriesRef.current.setData(candlestickData);
        chartRef.current?.timeScale().fitContent();
      } catch (e) {
        console.warn("setData failed", e);
      }
    }
    lastDataLenRef.current = newLen;
  }, [candlestickData]);

  /* -------- Autoscale: include price lines but avoid extreme flattening -------- */
  useEffect(() => {
    if (!seriesRef.current) return;

    const strikes = (allLines || []).map((l) => Number(l.strike)).filter((n) => Number.isFinite(n)) as number[];

    seriesRef.current.applyOptions({
      autoscaleInfoProvider: (original: any) => {
        const base = original?.();

        // Base (candles) range from lightweight-charts
        let candleMin = base?.priceRange?.minValue ?? Infinity;
        let candleMax = base?.priceRange?.maxValue ?? -Infinity;

        // Ensure candles have some minimum visible span
        if (Number.isFinite(candleMin) && Number.isFinite(candleMax)) {
          const MIN_CANDLE_SPAN = 150;
          if (candleMax - candleMin < MIN_CANDLE_SPAN) {
            const mid = (candleMin + candleMax) / 2;
            candleMin = mid - MIN_CANDLE_SPAN / 2;
            candleMax = mid + MIN_CANDLE_SPAN / 2;
          }
        }

        // If we have no candle info, return base or null
        if (!Number.isFinite(candleMin) || !Number.isFinite(candleMax)) return base ?? null;

        // If there are no strikes, keep candle range (with padding)
        if (!strikes.length) {
          const PAD_PCT = 0.1;
          const PAD_MIN = 60;
          const pad = Math.max(PAD_MIN, (candleMax - candleMin) * PAD_PCT);
          return { priceRange: { minValue: candleMin - pad, maxValue: candleMax + pad } };
        }

        // Compute combined extremes if we include all strikes
        const allMin = Math.min(candleMin, ...strikes);
        const allMax = Math.max(candleMax, ...strikes);
        const candleRange = Math.max(1, candleMax - candleMin);
        const combinedRange = Math.max(1, allMax - allMin);

        // If including all strikes expands the range by too much, fall back to selective inclusion
        const extremeFactor = 6; // tune: smaller = stricter, larger = include more lines
        if (combinedRange / candleRange > extremeFactor) {
          // include only strikes within tolerance around current candles, or nearest strike if none
          const tolerance = candleRange * 1.5; // include strikes within ±1.5x candle range
          const mid = (candleMin + candleMax) / 2;
          const inRange = strikes.filter((s) => Math.abs(s - mid) <= tolerance);

          if (inRange.length) {
            const min = Math.min(candleMin, ...inRange);
            const max = Math.max(candleMax, ...inRange);
            const pad = Math.max(60, (max - min) * 0.1);
            return { priceRange: { minValue: min - pad, maxValue: max + pad } };
          } else {
            // pick the nearest strike to the candle mid (so at least one annotation is visible)
            let nearest = strikes[0];
            let bestDist = Math.abs(nearest - mid);
            for (let i = 1; i < strikes.length; i++) {
              const d = Math.abs(strikes[i] - mid);
              if (d < bestDist) { nearest = strikes[i]; bestDist = d; }
            }
            const min = Math.min(candleMin, nearest);
            const max = Math.max(candleMax, nearest);
            const pad = Math.max(60, (max - min) * 0.1);
            return { priceRange: { minValue: min - pad, maxValue: max + pad } };
          }
        }

        // Otherwise it's safe to include all strikes
        const PAD_PCT = 0.1;
        const PAD_MIN = 60;
        const pad = Math.max(PAD_MIN, (allMax - allMin) * PAD_PCT);
        return { priceRange: { minValue: allMin - pad, maxValue: allMax + pad } };
      },
    });

    chartRef.current?.timeScale().fitContent();
  }, [allLines, candlestickData]);

  /* -------- Diff price lines: allow duplicate strikes (key by strike+label) -------- */
  /* -------- Diff price lines: allow duplicate strikes (unique internal keys) but keep label text unchanged -------- */
useEffect(() => {
  if (!seriesRef.current) return;

  // Build desired entries grouped by strike, but create unique internal keys using index.
  const desired: { key: string; strike: number; info: LineMark }[] = [];
  const byStrike = new Map<number, LineMark[]>();
  (allLines || []).forEach((l) => {
    const arr = byStrike.get(l.strike) ?? [];
    arr.push(l);
    byStrike.set(l.strike, arr);
  });

  for (const [strike, arr] of byStrike.entries()) {
    for (let i = 0; i < arr.length; i++) {
      // unique internal key so multiple annotations at same strike don't collide
      const key = `${strike}-${arr[i].label}-${i}`;
      desired.push({ key, strike, info: arr[i] });
    }
  }

  const wantKeys = new Set(desired.map((d) => d.key));

  // Remove lines not wanted
  for (const [existingKey, pl] of priceLinesRef.current.entries()) {
    if (!wantKeys.has(existingKey)) {
      try { seriesRef.current.removePriceLine(pl); } catch {}
      priceLinesRef.current.delete(existingKey);
    }
  }

  // Add any missing desired lines. Title is EXACTLY the label (no index appended).
  for (const d of desired) {
    if (!priceLinesRef.current.has(d.key)) {
      try {
        const priceLine = seriesRef.current.createPriceLine({
          price: d.strike,
          color: d.info.color,
          lineWidth: 2,
          lineStyle: d.info.label === "Flip" ? 2 : 0,
          axisLabelVisible: true,
          title: d.info.label, // <-- keep label raw: "Flip", "R1", "S1", etc.
        });
        priceLinesRef.current.set(d.key, priceLine);
      } catch (e) {
        console.warn("createPriceLine failed", e);
      }
    }
  }
}, [allLines]);

  const legendItems = [
    { color: "#ef4444", text: "strong sell" },
    { color: "#fca5a5", text: "sell" },
    { color: "#10b981", text: "strong buy" },
    { color: "#86efac", text: "buy" },
    { color: vars.flipLine, text: "zone change" },
  ];

  return (
    <div className="p-2 md:p-3" style={panel === "fullscreen" ? { height: "100%" } : undefined}>
      <div className="mb-2 flex items-center gap-2 flex-wrap">
        <h1 className="text-lg font-semibold" style={{ color: vars.fg }}>NIFTY — CE/PE Γ levels</h1>
        <span className="text-xs" style={{ color: vars.muted }}>Expiry: {gex?.expiry ?? "-"}</span>

        <div className="ml-auto flex items-center gap-2">
          <select
            className="rounded-md border px-2 py-1 text-xs"
            value={intervalMin}
            onChange={(e) => setIntervalMin(Number(e.target.value) as 1 | 3 | 5 | 15 | 30)}
            style={{
              background: vars.card,
              color: vars.fg,
              borderColor: vars.brd,
            }}
          >
            <option value={1}>1m</option>
            <option value={3}>3m</option>
            <option value={5}>5m</option>
            <option value={15}>15m</option>
            <option value={30}>30m</option>
          </select>
        </div>

        {loading && <span className="text-xs" style={{ color: vars.muted }}>Loading…</span>}
        {!!err && <span className="text-xs" style={{ color: "#ef4444" }}>Error: {err}</span>}
      </div>

      <div ref={chartContainerRef}
           style={panel === "fullscreen" ? { height: "calc(100vh - 120px)", width: "100%" } : { height: CHART_H, minHeight: CHART_H, width: "100%" }} />

      <style>{`
        .tv-lightweight-charts__logo,
        [data-role="attribution"],
        .tv-lightweight-charts a[href*="tradingview"] { display:none !important; pointer-events:none !important; }
        
        /* Force select and option styles to use theme variables for immediate correct rendering */
        select, option {
          background: var(--card-bg, rgba(0,0,0,0)) !important;
          color: var(--fg, #D1D5DB) !important;
          border-color: var(--border, rgba(148,163,184,0.25)) !important;
        }
        
        select:focus, option:focus {
          outline: none;
          border-color: var(--border, rgba(148,163,184,0.25)) !important;
        }
      `}</style>

      <div className="mt-2 flex items-center justify-center gap-4 flex-wrap text-[11px]" style={{ color: vars.muted }}>
        {legendItems.map(it => (
          <div key={it.text} className="flex items-center gap-2 whitespace-nowrap">
            <span className="inline-block h-2 w-2 rounded-full" style={{ background: it.color }} />
            <span style={{ color: vars.muted }}>{it.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
