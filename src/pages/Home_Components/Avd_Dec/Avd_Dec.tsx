// src/pages/Home_Components/Adv_Dec/Avd_Dec.tsx
import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { motion } from "framer-motion";

/* ----------------------------- Types ----------------------------- */
interface SeriesPoint {
  timestamp: string;
  time: string;
  advances: number;
  declines: number;
  total: number;
}
interface BulkResp {
  current: { advances: number; declines: number; total: number };
  rows: Record<string, SeriesPoint[]>;
  lastISO?: string | null;
}

type Props = { panel?: "card" | "fullscreen" };

/* ---------------------------- Settings --------------------------- */
const REFRESH_MS = 180_000;
const API_BASE =
  (import.meta as any).env?.VITE_API_BASE ||
  (import.meta as any).env?.VITE_API_URL ||
  "http://localhost:8000/api";

// Fetch 24h & multiple bins at once
const INTERVALS = [3, 5, 15, 30];
const ACTIVE_BIN = 5; // which bin the chart shows

const BULK_URL = `${String(API_BASE).replace(/\/$/, "")}/advdec/bulk?intervals=${INTERVALS.join(
  ","
)}&sinceMin=1440`;
const STORAGE_KEY = "advdec.bulk.v1";
const STORAGE_ETAG_KEY = "advdec.bulk.v1.etag";

/* ----------------------------- Component ----------------------------- */
const Avd_Dec: React.FC<Props> = ({ panel = "card" }) => {
  const [data, setData] = useState<BulkResp | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const controllerRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);

  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <motion.div
      className="w-full min-h-[300px] rounded-2xl shadow-xl p-6"
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      style={{
        background: "var(--card-bg)",
        color: "var(--fg)",
        border: "1px solid var(--border)",
        ...(panel === "fullscreen"
          ? { display: "flex", flexDirection: "column", height: "100%", maxWidth: "none" }
          : null),
      }}
    >
      {children}
    </motion.div>
  );

  const fetchData = useCallback(async () => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    try {
      // 1) Fast path from sessionStorage (non-blocking UI)
      const cached = sessionStorage.getItem(STORAGE_KEY);
      if (cached) {
        try {
          const json = JSON.parse(cached) as BulkResp;
          if (mountedRef.current) {
            setData(json);
            setLoading(false);
          }
        } catch {}
      }

      // 2) Conditional GET with ETag
      const etag = sessionStorage.getItem(STORAGE_ETAG_KEY) || "";
      const resp = await fetch(BULK_URL, {
        signal: controller.signal,
        cache: "no-store",
        headers: etag ? { "If-None-Match": etag } : {},
      });

      if (resp.status === 304) {
        if (mountedRef.current) {
          setLastUpdated(new Date());
          setError(null);
          setLoading(false);
        }
        return;
      }
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

      const json: BulkResp = await resp.json();

      // Save to storage
      const newTag = resp.headers.get("ETag") || "";
      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(json));
        if (newTag) sessionStorage.setItem(STORAGE_ETAG_KEY, newTag);
      } catch {}

      if (!mountedRef.current) return;
      setData(json);
      setLastUpdated(new Date());
      setError(null);
      setLoading(false);
    } catch (e: any) {
      if (e?.name === "AbortError") return;
      if (!mountedRef.current) return;
      setError(e?.message || "Failed to load data");
      setLoading(false);
    }
  }, []);

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

  const handleRetry = () => {
    setLoading(true);
    setError(null);
    fetchData();
  };

  // Pick the active series (bin) for the chart
  const series = useMemo<SeriesPoint[]>(
    () => (data?.rows?.[String(ACTIVE_BIN)] || []),
    [data]
  );

  if (loading) {
    return (
      <Wrapper>
        <h2 className="text-2xl font-bold text-center mb-4" style={{ color: "var(--fg)" }}>
          📈 Market Breadth (Adv/Dec)
        </h2>
        <div className="flex justify-center gap-10 mb-6 text-base sm:text-lg" style={{ color: "var(--fg)" }}>
          {["Advances", "Declines", "Total"].map((item) => (
            <div key={item}>
              <span style={{ color: "var(--muted)" }}>{item}: </span>
              <span
                className="animate-pulse rounded h-6 w-10 inline-block align-middle"
                style={{ background: "var(--grid)" }}
              />
            </div>
          ))}
        </div>
        <div className="min-h-[220px] flex items-center justify-center" style={{ color: "var(--muted)" }}>
          Loading market data...
        </div>
      </Wrapper>
    );
  }

  if (error && !data) {
    return (
      <Wrapper>
        <h2 className="text-2xl font-bold text-center mb-4" style={{ color: "var(--fg)" }}>
          📈 Market Breadth (Adv/Dec)
        </h2>
        <div className="min-h-[220px] flex flex-col items-center justify-center">
          <div className="text-red-400 mb-4">Error: {error}</div>
          <button
            onClick={handleRetry}
            className="px-4 py-2 rounded hover:opacity-90 transition"
            style={{
              background: "var(--card-bg)",
              color: "var(--fg)",
              border: "1px solid var(--border)",
            }}
          >
            Retry
          </button>
        </div>
      </Wrapper>
    );
  }

  const current = data?.current || { advances: 0, declines: 0, total: 0 };

  return (
    <Wrapper>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold" style={{ color: "var(--fg)" }}>
          📈 Market Breadth (Adv/Dec)
        </h2>
        <div className="text-xs" style={{ color: "var(--muted)" }}>
          {lastUpdated ? `Last updated: ${lastUpdated.toLocaleTimeString("en-IN", { hour12: false })}` : ""}
        </div>
      </div>

      <div className="flex justify-center gap-10 mb-6 text-base sm:text-lg" style={{ color: "var(--fg)" }}>
        <div>
          <span style={{ color: "var(--muted)" }}>Advances: </span>
          <span className="font-semibold" style={{ color: "#10B981" }}>
            {current.advances ?? "--"}
          </span>
        </div>
        <div>
          <span style={{ color: "var(--muted)" }}>Declines: </span>
          <span className="font-semibold" style={{ color: "#EF4444" }}>
            {current.declines ?? "--"}
          </span>
        </div>
        <div>
          <span style={{ color: "var(--muted)" }}>Total: </span>
          <span className="font-semibold" style={{ color: "#60A5FA" }}>
            {current.total ?? "--"}
          </span>
        </div>
      </div>

      <div
        style={{
          minHeight: 220,
          width: "100%",
          position: "relative",
          ...(panel === "fullscreen" ? { flex: "1 1 0%" } : null),
        }}
      >
        <ResponsiveContainer width="100%" height={panel === "fullscreen" ? "100%" : 300}>
          {series.length ? (
            <AreaChart data={series} margin={{ right: 20, left: -20 }}>
              <XAxis dataKey="time" stroke="var(--axis)" tick={{ fill: "var(--axis)", fontSize: 10 }} />
              <YAxis
                allowDecimals={false}
                stroke="var(--axis)"
                tick={{ fill: "var(--axis)", fontSize: 10 }}
                domain={[0, "dataMax + 5"]}
              />
              <Tooltip
                contentStyle={{
                  background: "var(--tip)",
                  borderColor: "var(--tipbr)",
                  borderRadius: "0.5rem",
                } as React.CSSProperties}
                itemStyle={{ color: "var(--fg)" } as React.CSSProperties}
                labelStyle={{ color: "var(--fg)" }}
                formatter={(value: number, name: string) => [
                  value,
                  name === "advances" ? "Advances" : name === "declines" ? "Declines" : name,
                ]}
                labelFormatter={(label) => `Time: ${label}`}
              />
              <Legend
                wrapperStyle={{ color: "var(--fg)" }}
                formatter={(value) => {
                  if (value === "advances") return "📈 Advances";
                  if (value === "declines") return "📉 Declines";
                  return value;
                }}
              />
              <defs>
                <linearGradient id="advFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="decFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="advances"
                stroke="#10B981"
                fill="url(#advFill)"
                strokeWidth={2}
                activeDot={{ r: 5 }}
                connectNulls
              />
              <Area
                type="monotone"
                dataKey="declines"
                stroke="#EF4444"
                fill="url(#decFill)"
                strokeWidth={2}
                activeDot={{ r: 5 }}
                connectNulls
              />
            </AreaChart>
          ) : (
            <div className="flex items-center justify-center h-full" style={{ color: "var(--fg)" }}>
              No chart data available
            </div>
          )}
        </ResponsiveContainer>
      </div>

      {error ? (
        <div className="mt-3 text-xs" style={{ color: "#f59e0b" }}>
          Warning: {error}. Showing last available data.
        </div>
      ) : null}
    </Wrapper>
  );
};

export default Avd_Dec;
