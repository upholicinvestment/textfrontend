import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { ResponsiveContainer, Treemap, Tooltip as ReTooltip } from "recharts";
import {
  Cpu, Building2, FlaskConical, Banknote, Stethoscope, Car, PlugZap, Radio,
  ShoppingBag, Hammer, Plane, Smartphone, Box, Paintbrush, Factory, Pill,
  Home, Shield, Layers, ShoppingCart, Package, Flame, Boxes
} from "lucide-react";

/* ---------- Types ---------- */
interface StockData {
  _id: string;
  trading_symbol: string;
  LTP: string;
  close: string;
  sector: string;
  security_id: number | string;
  change?: number;
  [key: string]: any;
}
interface SectorData {
  name: string;
  size: number; // avg % change
  topGainers: StockData[];
  topLosers: StockData[];
}
type BulkResp = { stocks: StockData[]; lastISO?: string | null };

type Props = { panel?: "card" | "fullscreen" };

/* ---------- Config (re-use your app vars) ---------- */
const API_BASE =
  (import.meta as any).env?.VITE_API_BASE ||
  (import.meta as any).env?.VITE_API_URL ||
  "https://api.upholictech.com/api";

const REFRESH_MS = 180_000; // 3 minutes
const BULK_URL = `${API_BASE.replace(/\/$/, "")}/heatmap/bulk?sinceMin=1440`;
const STORAGE_KEY = "heatmap.bulk.v1";
const STORAGE_ETAG_KEY = "heatmap.bulk.v1.etag";

/* ---------- Helpers ---------- */
function uniqueBy<T, K extends keyof T>(arr: T[], key: K): T[] {
  const seen = new Set();
  return arr.filter((item) => {
    const v = item[key];
    if (seen.has(v)) return false;
    seen.add(v);
    return true;
  });
}
const cleanSymbol = (s: string) => s.replace(/-[A-Z]{3}-\d{4}-FUT$/i, "");

/** Dark-first defaults (your app defaults to dark) */
function readThemeVars() {
  const scope = (document.querySelector(".theme-scope") as HTMLElement) || document.documentElement;
  const cs = getComputedStyle(scope);
  const pick = (k: string, fb: string) => (cs.getPropertyValue(k).trim() || fb);
  return {
    fg:    pick("--fg", "#e5e7eb"),
    muted: pick("--muted", "#94a3b8"),
    tip:   pick("--tip", "#0f172a"),
    tipbr: pick("--tipbr", "rgba(148,163,184,0.25)"),
    card:  pick("--card-bg", "#0f172a"),
    brd:   pick("--border", "rgba(148,163,184,0.25)"),
  };
}

/* === vivid sector colors === */
function colorForPct(pct: number) {
  const v = Math.max(-4, Math.min(4, pct));
  const ease = (x: number) => Math.pow(x, 0.6);
  if (v > 0) return lerpColor("#22c55e", "#065f46", ease(v / 4));
  if (v < 0) return lerpColor("#ef4444", "#7f1d1d", ease(Math.abs(v) / 4));
  return "#6b7280";
}
function lerpColor(a: string, b: string, t: number) {
  const pa = hexToRgb(a), pb = hexToRgb(b);
  const mix = (x: number, y: number) => Math.round(x + (y - x) * t);
  return `rgb(${mix(pa.r, pb.r)}, ${mix(pa.g, pb.g)}, ${mix(pa.b, pb.b)})`;
}
function hexToRgb(hex: string) {
  const m = hex.replace("#", "");
  const full = m.length === 3 ? m.split("").map((c) => c + c).join("") : m;
  const n = parseInt(full, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

/** Sector icons */
const sectorIcon: Record<string, React.FC<{ size?: number; color?: string }>> = {
  technology: Cpu, it: Cpu, software: Smartphone,
  communication: Radio, telecom: Radio, telecommunication: Radio,
  finance: Banknote, financial: Banknote, financialservices: Banknote, banking: Banknote, bank: Banknote, insurance: Shield,
  healthcare: Stethoscope, hospital: Stethoscope, pharma: Pill, pharmaceutical: Pill,
  industrial: Factory, industrials: Factory, capitalgoods: Factory, construction: Hammer, infrastructure: Building2,
  consumer: ShoppingBag, retail: ShoppingBag, fmcg: ShoppingCart, qsr: ShoppingCart, quickservice: ShoppingCart,
  energy: PlugZap, utilities: PlugZap, oilgas: Flame, oil: Flame, gas: Flame,
  materials: Boxes, metals: Boxes, cement: Package, chemicals: FlaskConical, paints: Paintbrush,
  realestate: Home, real: Home,
  automotive: Car, auto: Car, aviation: Plane, transport: Plane, airline: Plane, tourism: Plane,
  conglomerate: Layers, hospitality: Home, textiles: Package,
};
function pickIconFor(name?: string) {
  const key = (name ?? "unknown").toString().toLowerCase().replace(/[^a-z]/g, "");
  if (sectorIcon[key]) return sectorIcon[key];
  for (const [k, Icon] of Object.entries(sectorIcon)) if (key.includes(k)) return Icon;
  return Box;
}
function tinyLabel(name: string) {
  const words = (name.match(/[A-Za-z0-9]+/g) || []).slice(0, 3);
  if (!words.length) return "";
  if (words.length === 1) return words[0].slice(0, 3).toUpperCase();
  return words.map((w) => w[0]).join("").toUpperCase().slice(0, 4);
}

/* ---------- Component ---------- */
const Heat_Map: React.FC<Props> = ({ panel = "card" }) => {
  const [data, setData] = useState<SectorData[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasData, setHasData] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // theme tick to re-render when theme vars change
  const [themeTick, setThemeTick] = useState(0);
  useEffect(() => {
    const el = document.querySelector(".theme-scope");
    if (!el) return;
    const obs = new MutationObserver(() => setThemeTick((t) => t + 1));
    obs.observe(el, { attributes: true, attributeFilter: ["style", "class", "data-theme"] });
    return () => obs.disconnect();
  }, []);
  const vars = readThemeVars();
  const themeKey = `${vars.card}|${vars.fg}|${vars.brd}|${themeTick}`;

  const controllerRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);

  const buildSectors = (stocks: StockData[]) => {
    const valid = stocks.filter((s) => {
      const sym = s.trading_symbol;
      const ltpVal = s.LTP ?? (s as any).ltp;
      const closeVal = s.close ?? (s as any).Close;
      if (typeof sym !== "string" || !sym.trim() || sym.endsWith("-OI")) return false;
      const c = parseFloat(closeVal), l = parseFloat(ltpVal);
      return Number.isFinite(c) && Number.isFinite(l) && c > 0;
    });

    const withChange = valid.map((s) => {
      const c = parseFloat(s.close), l = parseFloat(s.LTP);
      const change = ((l - c) / c) * 100;
      return { ...s, change, sector: s.sector, trading_symbol: s.trading_symbol };
    });

    const sectorMap: Record<string, { sum: number; count: number; stocks: StockData[] }> = {};
    withChange.forEach((s) => {
      const sec = s.sector || "Unknown";
      if (!sectorMap[sec]) sectorMap[sec] = { sum: 0, count: 0, stocks: [] };
      sectorMap[sec].sum += s.change ?? 0;
      sectorMap[sec].count += 1;
      sectorMap[sec].stocks.push(s);
    });

    const sectors: SectorData[] = Object.entries(sectorMap)
      .map(([name, { sum, count, stocks }]) => {
        const avg = sum / count;
        const unique = uniqueBy(stocks, "trading_symbol");
        const topGainers = unique
          .filter((x) => (x.change ?? 0) > 0)
          .sort((a, b) => (b.change ?? 0) - (a.change ?? 0))
          .slice(0, 3);
        const topLosers = unique
          .filter((x) => (x.change ?? 0) < 0)
          .sort((a, b) => (a.change ?? 0) - (b.change ?? 0))
          .slice(0, 3);
        return { name: name || "Unknown", size: parseFloat(avg.toFixed(2)), topGainers, topLosers };
      })
      .sort((a, b) => b.size - a.size);

    return sectors;
  };

  const fetchData = useCallback(async () => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    try {
      // 1) instant fast-path from sessionStorage
      const cached = sessionStorage.getItem(STORAGE_KEY);
      if (cached && !hasData) {
        try {
          const json = JSON.parse(cached) as BulkResp;
          const sectors = buildSectors(Array.isArray(json?.stocks) ? json.stocks : []);
          if (mountedRef.current) {
            setData(sectors);
            setLoading(false);
            setHasData(true);
          }
        } catch {}
      }

      // 2) conditional GET with ETag
      const etag = sessionStorage.getItem(STORAGE_ETAG_KEY) || "";
      const resp = await fetch(BULK_URL, {
        signal: controller.signal,
        cache: "no-store", // we rely on our own sessionStorage + ETag
        headers: etag ? { "If-None-Match": etag } : {},
      });

      if (resp.status === 304) {
        if (mountedRef.current) {
          setError(null);
          setLoading(false);
          setHasData(true);
        }
        return;
      }
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

      const json: BulkResp = await resp.json();
      const newTag = resp.headers.get("ETag") || "";

      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(json));
        if (newTag) sessionStorage.setItem(STORAGE_ETAG_KEY, newTag);
      } catch {}

      const sectors = buildSectors(Array.isArray(json?.stocks) ? json.stocks : []);
      if (!mountedRef.current) return;
      setData(sectors);
      setError(null);
      setLoading(false);
      setHasData(true);
    } catch (e: any) {
      if (e?.name === "AbortError") return;
      if (!mountedRef.current) return;
      setError(e?.message || "Unknown error");
      setLoading(false);
    }
  }, [hasData]);

  useEffect(() => {
    mountedRef.current = true;
    fetchData();
    const id = setInterval(fetchData, REFRESH_MS);
    return () => {
      mountedRef.current = false;
      clearInterval(id);
      controllerRef.current?.abort();
    };
  }, [fetchData]);

  const treemapData = useMemo(() => {
    if (!data.length) return [];
    const vals = data.map((d) => d.size);
    const min = Math.min(...vals), max = Math.max(...vals);
    const span = Math.max(0.0001, max - min);
    const weight = (v: number) => 0.8 + ((v - min) / span) * 7.2; // 0.8..8.0
    return data.map((d) => ({
      name: d.name || "Unknown",
      value: weight(d.size),
      pct: Number.isFinite(d.size) ? d.size : 0,
      topGainers: d.topGainers ?? [],
      topLosers: d.topLosers ?? [],
    }));
  }, [data]);

  /* ---------- skeletons / errors ---------- */
  if (loading && !hasData) {
    return (
      <div
        className="w-full rounded-xl grid place-items-center"
        style={{
          height: panel === "fullscreen" ? "100%" : 540,
          background: vars.card,
          color: vars.fg,
          border: `1px solid ${vars.brd}`,
        }}
      >
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded-full border-2 border-current border-t-transparent animate-spin" />
        </div>
      </div>
    );
  }
  if (error && !hasData) {
    return (
      <div
        className="w-full rounded-xl grid place-items-center text-center p-6"
        style={{
          height: panel === "fullscreen" ? "100%" : 540,
          background: vars.card,
          color: vars.fg,
          border: `1px solid ${vars.brd}`,
        }}
      >
        <div style={{ color: "#ef4444" }} className="font-medium mb-2">Error loading data</div>
        <div style={{ color: vars.muted }}>{error}</div>
      </div>
    );
  }
  if (!treemapData.length) {
    return (
      <div
        className="w-full rounded-xl grid place-items-center"
        style={{
          height: panel === "fullscreen" ? "100%" : 540,
          background: vars.card,
          color: vars.fg,
          border: `1px solid ${vars.brd}`,
        }}
      >
        No sector data available
      </div>
    );
  }

  /* ---------- node + tooltip renderers ---------- */
  const Node: React.FC<any> = (props) => {
    const { x, y, width, height } = props;
    const name: string = props?.name || props?.payload?.name || "Unknown";
    const pct: number = Number.isFinite(props?.pct) ? props.pct : Number(props?.payload?.pct) || 0;
    const Icon = pickIconFor(name);
    const fill = colorForPct(pct);

    const tiny  = width < 70 || height < 44;
    const small = width < 120 || height < 64;
    const iconSize = tiny ? 16 : small ? 20 : 24;
    const textColor = "#ffffff";
    const pad = 4;
    const border = "rgba(0,0,0,0.35)";

    return (
      <g aria-label={`${name} ${pct.toFixed(1)} percent`}>
        <rect
          x={x} y={y} width={width} height={height}
          fill={fill} rx={0} ry={0}
          stroke={border} strokeWidth={1}
          strokeLinejoin="bevel" strokeLinecap="butt"
          vectorEffect="non-scaling-stroke" shapeRendering="crispEdges"
        />
        <foreignObject
          x={x + pad}
          y={y + pad}
          width={Math.max(0, width - pad * 2)}
          height={Math.max(0, height - pad * 2)}
        >
          <div
            style={{
              width: "100%", height: "100%",
              display: "flex", flexDirection: "column",
              justifyContent: tiny ? "center" : "space-between",
              alignItems: tiny ? "center" : "stretch",
              color: textColor,
              fontFamily:
                "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Helvetica Neue, Arial",
            }}
          >
            <div
              style={{
                display: "flex", alignItems: "center", gap: 6,
                justifyContent: tiny ? "center" : "flex-start",
              }}
            >
              <Icon size={iconSize} color={textColor} />
              {tiny ? (
                <span style={{ fontWeight: 700, fontSize: 10, letterSpacing: 0.3 }}>
                  {tinyLabel(name)}
                </span>
              ) : (
                <span
                  title={name}
                  style={{
                    fontWeight: 700,
                    fontSize: small ? 12 : 14,
                    lineHeight: 1.1,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {name}
                </span>
              )}
            </div>

            {!tiny && (
              <div style={{ alignSelf: "flex-end", fontWeight: 700, fontSize: small ? 12 : 14 }}>
                {pct > 0 ? "+" : ""}
                {pct.toFixed(1)}%
              </div>
            )}
          </div>
        </foreignObject>
      </g>
    );
  };

  const Tip: React.FC<any> = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const p = payload[0]?.payload ?? {};
    const name: string = p?.name || "Unknown";
    const pct: number = Number.isFinite(p?.pct) ? p.pct : 0;
    const gainers: StockData[] = Array.isArray(p?.topGainers) ? p.topGainers : [];
    const losers: StockData[] = Array.isArray(p?.topLosers) ? p.topLosers : [];

    return (
      <div
        style={{
          background: vars.tip,
          color: vars.fg,
          border: `1px solid ${vars.tipbr}`,
          borderRadius: 12,
          padding: 10,
          minWidth: 220,
          boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
        }}
      >
        <div style={{ borderBottom: `1px solid ${vars.tipbr}`, paddingBottom: 6, marginBottom: 6 }}>
          <div style={{ fontWeight: 800, fontSize: 14 }}>{name}</div>
          <div style={{ fontWeight: 700, fontSize: 12, color: pct >= 0 ? "#22c55e" : "#ef4444" }}>
            {pct > 0 ? "+" : ""}
            {pct.toFixed(2)}%
          </div>
        </div>

        {gainers.length ? (
          <div style={{ marginBottom: 6 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#22c55e", fontSize: 11, fontWeight: 700 }}>
              <span style={{ width: 8, height: 8, borderRadius: 9999, background: "#22c55e" }} />
              Top Gainers
            </div>
            {gainers.map((s, i) => (
              <div key={`g-${i}`} style={{ display: "flex", justifyContent: "space-between", gap: 8, marginTop: 4 }}>
                <span style={{ fontSize: 12, color: vars.muted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {cleanSymbol(s.trading_symbol)}
                </span>
                <span style={{ fontSize: 12, color: "#22c55e", fontWeight: 700 }}>
                  +{(s.change ?? 0).toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        ) : null}

        {losers.length ? (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#ef4444", fontSize: 11, fontWeight: 700 }}>
              <span style={{ width: 8, height: 8, borderRadius: 9999, background: "#ef4444" }} />
              Top Losers
            </div>
            {losers.map((s, i) => (
              <div key={`l-${i}`} style={{ display: "flex", justifyContent: "space-between", gap: 8, marginTop: 4 }}>
                <span style={{ fontSize: 12, color: vars.muted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {cleanSymbol(s.trading_symbol)}
                </span>
                <span style={{ fontSize: 12, color: "#ef4444", fontWeight: 800 }}>
                  {(s.change ?? 0).toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    );
  };

  /* ---------- layout: card vs fullscreen ---------- */
  return (
    <div
      className="w-full rounded-xl"
      style={{
        height: panel === "fullscreen" ? "100%" : 540,
        background: vars.card,
        color: vars.fg,
        border: `1px solid ${vars.brd}`,
        boxShadow: "0 8px 28px rgba(0,0,0,.25)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* header */}
      <div
        style={{
          padding: "10px 12px 0 12px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flex: "0 0 auto",
        }}
      >
        <h2 style={{ fontWeight: 700, fontSize: 16 }}>Sector Performance Heatmap</h2>
        <div style={{ fontSize: 12, color: vars.muted }}>Bigger tile ⇒ stronger positive sector</div>
      </div>

      {/* chart area */}
      <div style={{ width: "100%", flex: "1 1 0", minHeight: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <Treemap
            key={themeKey}
            data={treemapData}
            dataKey="value"
            aspectRatio={4 / 3}
            content={<Node />}
            stroke="none"
            style={{ shapeRendering: "crispEdges" }}
            animationDuration={400}
            isAnimationActive
          >
            <ReTooltip content={<Tip />} wrapperStyle={{ outline: "none" }} />
          </Treemap>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default Heat_Map;