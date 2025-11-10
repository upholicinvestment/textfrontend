// src/pages/Home_Components/Call_Put/NiftyGexLevelsPage.tsx
import { useEffect, useMemo, useRef, useState } from "react";

/* ========= Config ========= */
const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";
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

/* ========= Utilities ========= */
const OI_WEIGHT = 2;
const VOL_WEIGHT = 1;
const finite = (n: unknown): n is number =>
  typeof n === "number" && Number.isFinite(n);

function hexToRgba(hex: string, alpha = 0.45) {
  try {
    let h = (hex || "#000000").replace("#", "");
    if (h.length === 3) h = h.split("").map((c) => c + c).join("");
    const bigint = parseInt(h, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `rgba(${r},${g},${b},${alpha})`;
  } catch {
    return `rgba(0,0,0,${alpha})`;
  }
}

function rankMap(
  rows: GexRow[],
  key: "gex_oi_raw" | "gex_vol_raw",
  desc: boolean
) {
  const sorted = [...rows].sort((a, b) =>
    desc ? b[key] - a[key] : a[key] - b[key]
  );
  const map = new Map<number, number>();
  for (let i = 0; i < sorted.length; i++) map.set(sorted[i].strike, i + 1);
  return map;
}
function rankMapAbs(rows: GexRow[], key: "gex_oi_raw") {
  const sorted = [...rows].sort(
    (a, b) => Math.abs(a[key]) - Math.abs(b[key])
  );
  const map = new Map<number, number>();
  for (let i = 0; i < sorted.length; i++) map.set(sorted[i].strike, i + 1);
  return map;
}

function pickLinesByRaw(rows: GexRow[]) {
  const valid = rows.filter(
    (r) =>
      finite(r.strike) &&
      finite(r.gex_oi_raw) &&
      finite(r.gex_vol_raw) &&
      !(r.gex_oi_raw === 0 && r.gex_vol_raw === 0)
  );
  const pos = valid.filter(
    (r) => r.gex_oi_raw > 0 && r.gex_vol_raw > 0
  );
  const neg = valid.filter(
    (r) => r.gex_oi_raw < 0 && r.gex_vol_raw < 0
  );

  const red: LineMark[] = [];
  if (pos.length) {
    const oiRank = rankMap(pos, "gex_oi_raw", true);
    const volRank = rankMap(pos, "gex_vol_raw", true);
    const scored = pos.map((r) => {
      const oiR = oiRank.get(r.strike) ?? 9999;
      const volR = volRank.get(r.strike) ?? 9999;
      return {
        strike: r.strike,
        oiR,
        volR,
        score: OI_WEIGHT * oiR + VOL_WEIGHT * volR,
      };
    });
    scored.sort(
      (a, b) => a.score - b.score || a.oiR - b.oiR || a.volR - b.volR
    );
    if (scored[0])
      red.push({
        strike: scored[0].strike,
        label: "R1",
        color: "#ef4444",
        side: "ce",
      });
    if (scored[1])
      red.push({
        strike: scored[1].strike,
        label: "R2",
        color: "#fca5a5",
        side: "ce",
      });
  }

  const green: LineMark[] = [];
  if (neg.length) {
    const oiRank = rankMap(neg, "gex_oi_raw", false);
    const volRank = rankMap(neg, "gex_vol_raw", false);
    const scored = neg.map((r) => {
      const oiR = oiRank.get(r.strike) ?? 9999;
      const volR = volRank.get(r.strike) ?? 9999;
      return {
        strike: r.strike,
        oiR,
        volR,
        score: OI_WEIGHT * oiR + VOL_WEIGHT * volR,
      };
    });
    scored.sort(
      (a, b) => a.score - b.score || a.oiR - b.oiR || a.volR - b.volR
    );
    if (scored[0])
      green.push({
        strike: scored[0].strike,
        label: "S1",
        color: "#10b981",
        side: "pe",
      });
    if (scored[1])
      green.push({
        strike: scored[1].strike,
        label: "S2",
        color: "#86efac",
        side: "pe",
      });
  }
  return { red, green };
}

function pickZeroGammaStrike(
  rows: GexRow[],
  r1?: number,
  s1?: number
) {
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
    score:
      (absOiRank.get(r.strike) || 9999) +
      (volRank.get(r.strike) || 9999),
  }));
  scored.sort((a, b) => a.score - b.score);
  return scored[0]?.strike ?? null;
}

/* ===== Candles aligned as 9:15 + n * interval (IST) ===== */
function convertToCandlestick(
  linePoints: { x: number; y: number }[],
  intervalMin: number
): CandlestickData[] {
  if (!Array.isArray(linePoints) || linePoints.length === 0) return [];

  const intervalMs = intervalMin * 60 * 1000;
  const sorted = [...linePoints].sort((a, b) => a.x - b.x);

  // First point at/after 9:15
  const firstValidPoint = sorted.find((p) => {
    const d = new Date(p.x);
    const h = d.getHours();
    const m = d.getMinutes();
    return h > 9 || (h === 9 && m >= 15);
  });
  if (!firstValidPoint) return [];

  // Anchor buckets at 9:15
  const marketStart = new Date(firstValidPoint.x);
  marketStart.setHours(9, 15, 0, 0);
  const base = marketStart.getTime();

  const alignToBucket = (ts: number) => {
    if (ts <= base) return base;
    const offset = ts - base;
    const bucketIndex = Math.floor(offset / intervalMs);
    return base + bucketIndex * intervalMs;
  };

  const candlesMap = new Map<number, CandlestickData>();
  const startIndex = sorted.findIndex(
    (p) => p.x >= firstValidPoint.x
  );

  for (let i = startIndex; i < sorted.length; i++) {
    const { x, y } = sorted[i];
    if (!Number.isFinite(x) || !Number.isFinite(y)) continue;

    const bucketTimeMs = alignToBucket(x);
    const timeSec = Math.floor(bucketTimeMs / 1000);

    const existing = candlesMap.get(timeSec);
    if (!existing) {
      candlesMap.set(timeSec, {
        time: timeSec,
        open: y,
        high: y,
        low: y,
        close: y,
      });
    } else {
      if (y > existing.high) existing.high = y;
      if (y < existing.low) existing.low = y;
      existing.close = y;
    }
  }

  return Array.from(candlesMap.values()).sort(
    (a, b) => a.time - b.time
  );
}

const fmtIST = (sec: number) =>
  new Date(sec * 1000).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

/* ========== Theme reader ========== */
function readThemeVars() {
  const scope =
    (document.querySelector(".theme-scope") as HTMLElement) ||
    document.documentElement;
  const cs = getComputedStyle(scope);
  const pick = (k: string, fb: string) =>
    cs.getPropertyValue(k).trim() || fb;
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

/* ========== Helpers ========== */
function debounce<T extends (...args: any[]) => void>(
  fn: T,
  wait = 120
) {
  let t: any = null;
  return (...args: Parameters<T>) => {
    if (t) clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
}

function computeBarSpacing(
  containerWidth: number,
  desiredBars = 40
) {
  const min = 2;
  const max = 12;
  if (!Number.isFinite(containerWidth) || containerWidth <= 0)
    return 4;
  const raw = Math.max(
    2,
    Math.floor(containerWidth / Math.max(4, desiredBars))
  );
  return Math.max(min, Math.min(max, raw));
}

/* ================= Component ================= */
export default function NiftyGexLevelsPage({
  panel = "card",
}: {
  panel?: "card" | "fullscreen";
}) {
  const chartContainerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<any>(null);
  const seriesRef = useRef<any>(null);
  const volumeSeriesRef = useRef<any>(null);
  const histDataRef = useRef<
    { time: number; value: number; color: string; raw: number; label: string }[]
  >([]);

  const priceLinesRef = useRef<Map<string, any>>(new Map());
  const rawVolCacheRef = useRef<Record<string, any[]>>({});
  const lastVolPricesRef = useRef<{ pos: number | null; neg: number | null }>({
    pos: null,
    neg: null,
  });

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
    const id = setInterval(
      () => setRefreshTick((t) => t + 1),
      REFRESH_MS
    );
    return () => clearInterval(id);
  }, []);

  const [niftyPoints, setNiftyPoints] = useState<{ x: number; y: number }[]>(
    []
  );
  const [intervalMin, setIntervalMin] = useState<1 | 3 | 5 | 15 | 30>(3);
  const [candlestickData, setCandlestickData] = useState<CandlestickData[]>([]);

  const [hoverVolume, setHoverVolume] = useState<{
    value: string;
    color: string;
    label: string;
  } | null>(null);

  const [themeTick, setThemeTick] = useState(0);
  useEffect(() => {
    const el =
      document.querySelector(".theme-scope") || document.documentElement;
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
  const vars = useMemo(() => readThemeVars(), [themeTick]);
  const themeKey = `${vars.card}|${vars.fg}|${vars.axis}|${vars.grid}|${vars.tip}|${vars.brd}|${themeTick}`;

  const fitDebounceRef = useRef<((...a: any[]) => void) | null>(null);
  useEffect(() => {
    fitDebounceRef.current = debounce(() => {
      try {
        chartRef.current?.timeScale().fitContent();
      } catch {}
    }, 100);
  }, []);
  const scheduleFitContent = () => {
    if (fitDebounceRef.current) fitDebounceRef.current();
  };

  /* -------- Helper: upsert VOL_* price lines (strike based) -------- */
  const upsertVolLine = (
    key: string,
    priceVal: number | null,
    colorHex: string,
    title: string
  ) => {
    if (!seriesRef.current) return;

    // remove if null
    if (priceVal == null) {
      const existing = priceLinesRef.current.get(key);
      if (existing) {
        try {
          seriesRef.current.removePriceLine(existing);
        } catch {}
        priceLinesRef.current.delete(key);
      }
      return;
    }

    // replace existing
    const existing = priceLinesRef.current.get(key);
    if (existing) {
      try {
        seriesRef.current.removePriceLine(existing);
      } catch {}
      priceLinesRef.current.delete(key);
    }

    try {
      const faintColor = hexToRgba(colorHex, 0.06);
      const pl = seriesRef.current.createPriceLine({
        price: priceVal,
        color: faintColor,
        lineWidth: 1,
        lineStyle: 0,
        axisLabelVisible: true,
        title,
      });
      priceLinesRef.current.set(key, pl);
    } catch (e) {
      console.warn("create VOL price line failed", e);
    }
  };

  /* -------- Fetch rows & initial spot -------- */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setErr("");
        const qs =
          activeExpiry != null
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
              .map((r) => ({
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
    return () => {
      cancelled = true;
    };
  }, [urlExpiry, activeExpiry, refreshTick]);

  /* -------- Fetch ticks -------- */
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
          .map((p) => ({
            x: Number(p.x),
            y: Number(p.y),
          }))
          .filter(
            (p) => Number.isFinite(p.x) && Number.isFinite(p.y)
          )
          .sort((a, b) => a.x - b.x);
        setNiftyPoints(pts);
        if (pts.length) {
          const last = pts[pts.length - 1];
          setGex((prev) =>
            prev ? { ...prev, spot: last.y } : prev
          );
        }
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activeExpiry, refreshTick]);

  /* -------- Candles from points (interval dependent) -------- */
  useEffect(() => {
    setCandlestickData(
      convertToCandlestick(niftyPoints, intervalMin)
    );
  }, [niftyPoints, intervalMin]);

  /* -------- Compute static R/S/Flip lines -------- */
  const allLines = useMemo(() => {
    const { red, green } = pickLinesByRaw(gex?.rows || []);
    const zgStrike = pickZeroGammaStrike(
      gex?.rows || [],
      red.find((l) => l.label === "R1")?.strike,
      green.find((l) => l.label === "S1")?.strike
    );
    return [
      ...red,
      ...green,
      ...(zgStrike
        ? [
            {
              strike: zgStrike,
              label: "Flip",
              color: vars.flipLine,
            } as LineMark,
          ]
        : []),
    ];
  }, [gex?.rows, vars.flipLine]);

  /* -------- Compute Highest Vol+ / Vol- from strikes (interval independent) -------- */
  useEffect(() => {
    if (!gex?.rows || !gex.rows.length) {
      lastVolPricesRef.current = { pos: null, neg: null };
      upsertVolLine("VOL_POS", null, vars.bull, "Highest Vol+");
      upsertVolLine("VOL_NEG", null, vars.bear, "Highest Vol-");
      return;
    }

    let bestPos: GexRow | null = null;
    let bestNeg: GexRow | null = null;

    for (const r of gex.rows) {
      const v = Number(r.gex_vol_raw ?? 0);
      if (!Number.isFinite(v) || v === 0) continue;
      if (v > 0) {
        if (!bestPos || v > bestPos.gex_vol_raw) bestPos = r;
      } else if (v < 0) {
        if (!bestNeg || v < bestNeg.gex_vol_raw) bestNeg = r; // more negative
      }
    }

    const posStrike = bestPos?.strike ?? null;
    const negStrike = bestNeg?.strike ?? null;

    lastVolPricesRef.current = {
      pos: posStrike,
      neg: negStrike,
    };

    upsertVolLine("VOL_POS", posStrike, vars.bull, "Highest Vol+");
    upsertVolLine("VOL_NEG", negStrike, vars.bear, "Highest Vol-");
  }, [gex?.rows, vars.bull, vars.bear]);

  /* -------- Init chart once -------- */
  useEffect(() => {
    let mounted = true;
    let cleanup: (() => void) | null = null;

    const init = async () => {
      const { createChart } = await import("lightweight-charts");
      if (!mounted || !chartContainerRef.current) return;

      if (!chartRef.current) {
        const width = chartContainerRef.current.clientWidth;
        chartRef.current = createChart(chartContainerRef.current, {
          width,
          height: CHART_H,
          layout: {
            background: { color: vars.card },
            textColor: vars.fg,
            fontFamily:
              '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          },
          grid: {
            vertLines: { visible: false },
            horzLines: { visible: false },
          },
          crosshair: {
            mode: 1,
            vertLine: {
              color: vars.axis,
              width: 1,
              style: 2,
            },
            horzLine: {
              color: vars.axis,
              width: 1,
              style: 2,
            },
          },
          localization: {
            locale: "en-IN",
            timeFormatter: (t: number) => fmtIST(Number(t)),
          },
          rightPriceScale: {
            borderColor: vars.brd,
            scaleMargins: { top: 0.1, bottom: 0 },
            entireTextOnly: false,
          },
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

        volumeSeriesRef.current =
          chartRef.current.addHistogramSeries({
            priceFormat: { type: "volume" },
            priceScaleId: "volume",
            scaleMargins: { top: 0.75, bottom: 0 },
            lastValueVisible: false,
            priceLineVisible: false,
            overlay: false,
          });
        try {
          chartRef.current
            .priceScale("volume")
            ?.applyOptions?.({
              scaleMargins: { top: 0.75, bottom: 0 },
            });
        } catch {}

        seriesRef.current =
          chartRef.current.addCandlestickSeries({
            upColor: vars.bull,
            downColor: vars.bear,
            borderDownColor: vars.bear,
            borderUpColor: vars.bull,
            wickDownColor: vars.bear,
            wickUpColor: vars.bull,
            priceScaleId: "right",
          });

        // Kill attribution
        setTimeout(() => {
          const attrs =
            chartContainerRef.current?.querySelectorAll(
              '[data-role="attribution"]'
            );
          attrs?.forEach((el) => el.remove());
        }, 100);

        // Crosshair hover volume
        chartRef.current.subscribeCrosshairMove((param: any) => {
          if (!param || !param.time) {
            setHoverVolume(null);
            return;
          }
          let timeSec: number | null = null;
          if (typeof param.time === "number") {
            timeSec = Number(param.time);
          } else if (
            typeof param.time === "object" &&
            (param.time as any).timestamp
          ) {
            timeSec = Number((param.time as any).timestamp);
          } else if (
            typeof param.time === "object" &&
            (param.time as any).day
          ) {
            try {
              const tm = param.time as any;
              const d = new Date(
                tm.year,
                tm.month - 1,
                tm.day,
                tm.hour || 0,
                tm.minute || 0
              );
              timeSec = Math.floor(d.getTime() / 1000);
            } catch {
              timeSec = null;
            }
          }

          if (timeSec == null) {
            setHoverVolume(null);
            return;
          }

          const arr = histDataRef.current;
          if (!arr || !arr.length) {
            setHoverVolume(null);
            return;
          }

          let best =
            arr.find((b) => b.time === timeSec) || null;
          if (!best) {
            let bestDist = Infinity;
            for (const b of arr) {
              const d = Math.abs(b.time - timeSec);
              if (d < bestDist) {
                bestDist = d;
                best = b;
              }
            }
          }
          if (!best) {
            setHoverVolume(null);
            return;
          }

          setHoverVolume({
            value: best.label,
            color: best.raw >= 0 ? vars.bull : vars.bear,
            label: best.label,
          });
        });

        const ro = new ResizeObserver(
          debounce(() => {
            if (!chartContainerRef.current || !chartRef.current) return;
            const w = chartContainerRef.current.clientWidth;
            const h =
              panel === "fullscreen"
                ? chartContainerRef.current.clientHeight
                : CHART_H;
            chartRef.current.applyOptions({
              width: w,
              height: h,
              timeScale: {
                barSpacing: computeBarSpacing(w, 40),
                minBarSpacing: 2,
                rightOffset: 6,
                borderColor: vars.brd,
              },
            });
            scheduleFitContent();
          }, 120)
        );
        ro.observe(chartContainerRef.current);

        cleanup = () => {
          try {
            ro.disconnect();
          } catch {}
          try {
            chartRef.current?.remove();
          } catch {}
          chartRef.current = null;
          seriesRef.current = null;
          volumeSeriesRef.current = null;
          priceLinesRef.current.clear();
          histDataRef.current = [];
        };
      }
    };

    init().catch((e) =>
      console.error("chart init failed", e)
    );
    return () => {
      mounted = false;
      if (cleanup) cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* -------- Theme/panel option updates -------- */
  useEffect(() => {
    if (!chartRef.current || !seriesRef.current) return;
    try {
      const w = chartContainerRef.current?.clientWidth ?? 800;
      chartRef.current.applyOptions({
        layout: {
          background: { color: vars.card },
          textColor: vars.fg,
        },
        grid: {
          vertLines: { visible: false },
          horzLines: { visible: false },
        },
        crosshair: {
          vertLine: { color: vars.axis },
          horzLine: { color: vars.axis },
        },
        rightPriceScale: {
          borderColor: vars.brd,
          scaleMargins: { top: 0.1, bottom: 0 },
        },
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

      try {
        chartRef.current
          .priceScale("volume")
          ?.applyOptions?.({
            scaleMargins: { top: 0.75, bottom: 0 },
          });
        volumeSeriesRef.current?.applyOptions?.({
          priceFormat: { type: "volume" },
          scaleMargins: { top: 0.75, bottom: 0 },
        });
      } catch {}

      if (chartContainerRef.current) {
        chartRef.current.applyOptions({
          height:
            panel === "fullscreen"
              ? chartContainerRef.current.clientHeight
              : CHART_H,
          width: chartContainerRef.current.clientWidth,
        });
        scheduleFitContent();
      }
    } catch (e) {
      console.warn("applyOptions failed", e);
    }
  }, [
    themeKey,
    panel,
    vars.card,
    vars.fg,
    vars.grid,
    vars.axis,
    vars.brd,
    vars.bull,
    vars.bear,
  ]);

  /* -------- Efficient candle updates -------- */
  const lastDataLenRef = useRef<number>(0);
  useEffect(() => {
    if (!seriesRef.current) return;
    if (!candlestickData || !candlestickData.length) {
      lastDataLenRef.current = 0;
      return;
    }
    const newLen = candlestickData.length;
    if (lastDataLenRef.current === newLen) {
      const last = candlestickData[newLen - 1];
      try {
        seriesRef.current.update(last);
      } catch {
        try {
          seriesRef.current.setData(candlestickData);
          scheduleFitContent();
        } catch {}
      }
    } else {
      try {
        seriesRef.current.setData(candlestickData);
        scheduleFitContent();
      } catch (e) {
        console.warn("setData failed", e);
      }
    }
    lastDataLenRef.current = newLen;
  }, [candlestickData]);

  /* -------- Autoscale with R/S/Flip + Highest Vol± (strike) -------- */
  useEffect(() => {
    if (!seriesRef.current) return;

    const strikes = (allLines || [])
      .map((l) => Number(l.strike))
      .filter((n) => Number.isFinite(n)) as number[];

    seriesRef.current.applyOptions({
      autoscaleInfoProvider: (original: any) => {
        const base = original?.();
        let candleMin =
          base?.priceRange?.minValue ?? Infinity;
        let candleMax =
          base?.priceRange?.maxValue ?? -Infinity;

        if (Number.isFinite(candleMin) && Number.isFinite(candleMax)) {
          const MIN_SPAN = 150;
          if (candleMax - candleMin < MIN_SPAN) {
            const mid = (candleMin + candleMax) / 2;
            candleMin = mid - MIN_SPAN / 2;
            candleMax = mid + MIN_SPAN / 2;
          }
        }

        if (!Number.isFinite(candleMin) || !Number.isFinite(candleMax)) {
          return base ?? null;
        }

        const volPrices: number[] = [];
        if (
          lastVolPricesRef.current.pos != null &&
          Number.isFinite(lastVolPricesRef.current.pos)
        )
          volPrices.push(lastVolPricesRef.current.pos!);
        if (
          lastVolPricesRef.current.neg != null &&
          Number.isFinite(lastVolPricesRef.current.neg)
        )
          volPrices.push(lastVolPricesRef.current.neg!);

        const combined = [...strikes, ...volPrices];
        if (!combined.length) {
          const PAD_PCT = 0.1;
          const PAD_MIN = 60;
          const pad = Math.max(
            PAD_MIN,
            (candleMax - candleMin) * PAD_PCT
          );
          return {
            priceRange: {
              minValue: candleMin - pad,
              maxValue: candleMax + pad,
            },
          };
        }

        const allMin = Math.min(candleMin, ...combined);
        const allMax = Math.max(candleMax, ...combined);
        const candleRange = Math.max(1, candleMax - candleMin);
        const combinedRange = Math.max(1, allMax - allMin);

        const extremeFactor = 6;
        if (combinedRange / candleRange > extremeFactor) {
          const tolerance = candleRange * 1.5;
          const mid = (candleMin + candleMax) / 2;
          const inRange = combined.filter(
            (s) => Math.abs(s - mid) <= tolerance
          );
          if (inRange.length) {
            const min = Math.min(candleMin, ...inRange);
            const max = Math.max(candleMax, ...inRange);
            const pad = Math.max(
              60,
              (max - min) * 0.1
            );
            return {
              priceRange: {
                minValue: min - pad,
                maxValue: max + pad,
              },
            };
          } else {
            let nearest = combined[0];
            let bestDist = Math.abs(
              nearest - mid
            );
            for (let i = 1; i < combined.length; i++) {
              const d = Math.abs(combined[i] - mid);
              if (d < bestDist) {
                nearest = combined[i];
                bestDist = d;
              }
            }
            const min = Math.min(candleMin, nearest);
            const max = Math.max(candleMax, nearest);
            const pad = Math.max(
              60,
              (max - min) * 0.1
            );
            return {
              priceRange: {
                minValue: min - pad,
                maxValue: max + pad,
              },
            };
          }
        }

        const PAD_PCT = 0.1;
        const PAD_MIN = 60;
        const pad = Math.max(
          PAD_MIN,
          (allMax - allMin) * PAD_PCT
        );
        return {
          priceRange: {
            minValue: allMin - pad,
            maxValue: allMax + pad,
          },
        };
      },
    });

    scheduleFitContent();
  }, [allLines, candlestickData]);

  /* -------- Diff price lines for R/S/Flip (keep VOL_* intact) -------- */
  useEffect(() => {
    if (!seriesRef.current) return;

    const desired: {
      key: string;
      strike: number;
      info: LineMark;
    }[] = [];
    const byStrike = new Map<number, LineMark[]>();

    (allLines || []).forEach((l) => {
      const arr = byStrike.get(l.strike) ?? [];
      arr.push(l);
      byStrike.set(l.strike, arr);
    });

    for (const [strike, arr] of byStrike.entries()) {
      for (let i = 0; i < arr.length; i++) {
        const key = `${strike}-${arr[i].label}-${i}`;
        desired.push({ key, strike, info: arr[i] });
      }
    }

    const wantKeys = new Set(desired.map((d) => d.key));

    for (const [existingKey, pl] of priceLinesRef.current.entries()) {
      if (
        !wantKeys.has(existingKey) &&
        !existingKey.startsWith("VOL_")
      ) {
        try {
          seriesRef.current.removePriceLine(pl);
        } catch {}
        priceLinesRef.current.delete(existingKey);
      }
    }

    for (const d of desired) {
      if (!priceLinesRef.current.has(d.key)) {
        try {
          const priceLine =
            seriesRef.current.createPriceLine({
              price: d.strike,
              color: d.info.color,
              lineWidth: 2,
              lineStyle: d.info.label === "Flip" ? 2 : 0,
              axisLabelVisible: true,
              title: d.info.label,
            });
          priceLinesRef.current.set(d.key, priceLine);
        } catch (e) {
          console.warn("createPriceLine failed", e);
        }
      }
    }
  }, [allLines]);

  /* -------- Volume histogram (interval dependent ONLY) -------- */
  const rebucketAndApply = (rawRows: any[], useInterval: number) => {
    try {
      if (!rawRows || !rawRows.length) {
        histDataRef.current = [];
        if (volumeSeriesRef.current) {
          try {
            volumeSeriesRef.current.setData([]);
          } catch {}
        }
        return;
      }

      const bucketMs = useInterval * 60 * 1000;

      const firstValidRow = rawRows.find((row: any) => {
        const tsms = Number(row.ts_ms ?? row.ts ?? 0);
        if (!Number.isFinite(tsms) || tsms <= 0) return false;
        const d = new Date(tsms);
        const h = d.getHours();
        const m = d.getMinutes();
        return h > 9 || (h === 9 && m >= 15);
      });
      if (!firstValidRow) {
        histDataRef.current = [];
        if (volumeSeriesRef.current) {
          try {
            volumeSeriesRef.current.setData([]);
          } catch {}
        }
        return;
      }

      const firstValidTime = Number(
        firstValidRow.ts_ms ?? firstValidRow.ts ?? 0
      );
      const marketStartTime = new Date(firstValidTime);
      marketStartTime.setHours(9, 15, 0, 0);
      const base = marketStartTime.getTime();

      const alignToBucket = (ts: number) => {
        if (ts <= base) return base;
        const offset = ts - base;
        const idx = Math.floor(offset / bucketMs);
        return base + idx * bucketMs;
      };

      const bucketsAbs = new Map<number, number>();
      const bucketsSigned = new Map<number, number>();

      for (const row of rawRows) {
        const tsms = Number(row.ts_ms ?? row.ts ?? 0);
        if (!Number.isFinite(tsms) || tsms <= 0) continue;

        const vRaw = Number(
          row.total_gex_vol_raw ??
            row.total_gex_vol ??
            row.gex_vol_raw ??
            0
        );
        if (!Number.isFinite(vRaw) || vRaw === 0) continue;

        const key = alignToBucket(tsms);
        const abs = Math.abs(vRaw);

        bucketsAbs.set(key, (bucketsAbs.get(key) || 0) + abs);
        bucketsSigned.set(key, (bucketsSigned.get(key) || 0) + vRaw);
      }

      if (!bucketsAbs.size) {
        histDataRef.current = [];
        if (volumeSeriesRef.current) {
          try {
            volumeSeriesRef.current.setData([]);
          } catch {}
        }
        return;
      }

      const entries = Array.from(bucketsAbs.entries()).sort(
        (a, b) => a[0] - b[0]
      );

      const hist: {
        time: number;
        value: number;
        color: string;
        raw: number;
        label: string;
      }[] = [];

      // Use candle closes (if available) only for color fallback when net=0
      const candleClose = new Map<number, number>();
      for (const c of candlestickData) {
        candleClose.set(Math.floor(c.time), c.close);
      }
      let prevClose: number | null =
        candlestickData.length ? candlestickData[0].close : null;

      for (const [ms, vAbsSum] of entries) {
        const timeSec = Math.floor(ms / 1000);
        const vAbs = Number(vAbsSum || 0);
        if (!Number.isFinite(vAbs) || vAbs <= 0) continue;

        const rawSigned = bucketsSigned.get(ms) ?? 0;
        const close = candleClose.get(timeSec) ?? null;

        let signColorHex: string;
        if (rawSigned > 0) signColorHex = vars.bull;
        else if (rawSigned < 0) signColorHex = vars.bear;
        else {
          if (close != null && typeof prevClose === "number") {
            signColorHex = close >= prevClose ? vars.bull : vars.bear;
            prevClose = close;
          } else if (close != null) {
            prevClose = close;
            signColorHex = vars.bull;
          } else {
            signColorHex = vars.muted;
          }
        }

        const barColorDim = hexToRgba(signColorHex, 0.36);
        const sign = rawSigned < 0 ? "-" : "";
        const label = `${sign}${(vAbs / 1_000_000).toFixed(2)}M`;

        hist.push({
          time: timeSec,
          value: vAbs,
          color: barColorDim,
          raw: rawSigned,
          label,
        });
      }

      histDataRef.current = hist;

      if (volumeSeriesRef.current) {
        try {
          volumeSeriesRef.current.setData(
            hist.map((h) => ({
              time: h.time,
              value: h.value,
              color: h.color,
            }))
          );
          scheduleFitContent();
        } catch (e) {
          console.warn("volume setData failed", e);
        }
      }
    } catch (err) {
      console.warn("rebucketAndApply failed", err);
    }
  };

  /* -------- Fetch + render volume histogram -------- */
  useEffect(() => {
    if (!activeExpiry) return;
    let cancelled = false;

    (async () => {
      try {
        const cached = rawVolCacheRef.current[activeExpiry];
        if (cached && cached.length) {
          rebucketAndApply(cached, intervalMin);
        }

        const limit = 5000;
        const r = await fetch(
          `${API_BASE}/gex/nifty/vol_series?expiry=${activeExpiry}&limit=${limit}`
        );
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const j = await r.json();
        if (cancelled) return;

        const raw = Array.isArray(j.series)
          ? j.series
          : j.data || [];

        rawVolCacheRef.current[activeExpiry] = raw;
        rebucketAndApply(raw, intervalMin);
      } catch (e: any) {
        console.warn("fetch vol series failed", e);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [activeExpiry, intervalMin, refreshTick]);

  /* -------- Legend -------- */
  const legendItems = [
    { color: "#ef4444", text: "strong sell" },
    { color: "#fca5a5", text: "sell" },
    { color: "#10b981", text: "strong buy" },
    { color: "#86efac", text: "buy" },
    { color: vars.flipLine, text: "zone change" },
  ];

  return (
    <div
      className="p-2 md:p-3"
      style={panel === "fullscreen" ? { height: "100%" } : undefined}
    >
      <div className="mb-2 flex items-center gap-2 flex-wrap">
        <h1
          className="text-lg font-semibold"
          style={{ color: vars.fg }}
        >
          NIFTY — CE/PE Γ levels
        </h1>
        <span
          className="text-xs"
          style={{ color: vars.muted }}
        >
          Expiry: {gex?.expiry ?? "-"}
        </span>

        <div className="ml-auto flex items-center gap-2">
          <select
            className="rounded-md border px-2 py-1 text-xs"
            value={intervalMin}
            onChange={(e) =>
              setIntervalMin(
                Number(e.target.value) as 1 | 3 | 5 | 15 | 30
              )
            }
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

        {loading && (
          <span
            className="text-xs"
            style={{ color: vars.muted }}
          >
            Loading…
          </span>
        )}
        {!!err && (
          <span
            className="text-xs"
            style={{ color: "#ef4444" }}
          >
            Error: {err}
          </span>
        )}
      </div>

      <div style={{ position: "relative" }}>
        {/* hover volume badge */}
        <div
          style={{
            position: "absolute",
            left: 12,
            top: 8,
            zIndex: 30,
            pointerEvents: "none",
            background: vars.card,
            padding: "4px 8px",
            borderRadius: 6,
            border: `1px solid ${vars.tipbr}`,
            color: vars.fg,
            fontSize: 12,
            display: hoverVolume ? "inline-flex" : "none",
            alignItems: "center",
            gap: 8,
          }}
        >
          vol{" "}
          <span
            style={{
              color: hoverVolume?.color || vars.fg,
              fontWeight: 600,
            }}
          >
            {hoverVolume?.label ?? "-"}
          </span>
        </div>

        <div
          ref={chartContainerRef}
          style={
            panel === "fullscreen"
              ? {
                  height: "calc(100vh - 120px)",
                  width: "100%",
                }
              : {
                  height: CHART_H,
                  minHeight: CHART_H,
                  width: "100%",
                }
          }
        />
      </div>

      <style>{`
        .tv-lightweight-charts__logo,
        [data-role="attribution"],
        .tv-lightweight-charts a[href*="tradingview"] {
          display:none !important;
          pointer-events:none !important;
        }

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

      <div
        className="mt-2 flex items-center justify-center gap-4 flex-wrap text-[11px]"
        style={{ color: vars.muted }}
      >
        {legendItems.map((it) => (
          <div
            key={it.text}
            className="flex items-center gap-2 whitespace-nowrap"
          >
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ background: it.color }}
            />
            <span style={{ color: vars.muted }}>
              {it.text}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
