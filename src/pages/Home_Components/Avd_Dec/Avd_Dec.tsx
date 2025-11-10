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
  timestamp?: string;
  time: string;
  advances: number;
  declines: number;
  total?: number;
}
interface Resp {
  current: { advances: number; declines: number; total: number };
  chartData: SeriesPoint[];
}

type Props = { panel?: "card" | "fullscreen" };

/* ---------------------------- Settings --------------------------- */
const REFRESH_MS = 180_000;
const API_BASE =
  (import.meta as any).env?.VITE_API_BASE ||
  (import.meta as any).env?.VITE_API_URL ||
  "http://localhost:8000/api";

// Which bin to request from server
const ACTIVE_BIN = 5;
const DEFAULT_SINCE_MIN = 1440; // 24h

const BUILD_URL = (
  bin = ACTIVE_BIN,
  sinceMin = DEFAULT_SINCE_MIN,
  expiry?: string
) =>
  `${String(API_BASE).replace(
    /\/$/,
    ""
  )}/advdec?bin=${bin}&sinceMin=${sinceMin}${
    expiry ? `&expiry=${encodeURIComponent(expiry)}` : ""
  }`;

/* ----------------------------- Component ----------------------------- */
const Avd_Dec: React.FC<Props> = ({ panel = "card" }) => {
  const [data, setData] = useState<Resp | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const controllerRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);
  const dataRef = useRef<Resp | null>(null); // keep track of last good data

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
          ? {
              display: "flex",
              flexDirection: "column",
              height: "100%",
              maxWidth: "none",
            }
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

    // Only show blocking loader if we DON'T have any previous data
    if (!dataRef.current) {
      setLoading(true);
      setError(null);
    }

    try {
      const url = BUILD_URL(ACTIVE_BIN, DEFAULT_SINCE_MIN);
      const resp = await fetch(url, {
        signal: controller.signal,
        cache: "no-store",
      });

      if (!resp.ok) {
        throw new Error(`HTTP ${resp.status}`);
      }

      const json: Resp = await resp.json();
      if (!mountedRef.current) return;

      setData(json);
      dataRef.current = json;
      setLastUpdated(new Date());
      setError(null);
      setLoading(false);
    } catch (e: any) {
      if (e?.name === "AbortError") return;
      if (!mountedRef.current) return;

      const msg = e?.message || "Failed to load data";

      // If first load & this looks like a heavy/slow/network case,
      // keep showing the loader instead of "fail to fetch".
      if (!dataRef.current && /Failed to fetch/i.test(msg)) {
        setLoading(true);
        setError(null);
        return;
      }

      // If we already have data, treat as soft warning:
      // keep showing last available data.
      if (dataRef.current) {
        setError(msg);
        setLoading(false);
        return;
      }

      // True hard error on initial load (no data at all)
      setError(msg);
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

  const series = useMemo<SeriesPoint[]>(
    () => data?.chartData || [],
    [data]
  );

  /* -------------------------- Render States -------------------------- */

  // Initial blocking loading (no data yet)
  if (loading && !dataRef.current) {
    return (
      <Wrapper>
        <h2
          className="text-2xl font-bold text-center mb-4"
          style={{ color: "var(--fg)" }}
        >
          📈 Market Breadth (Adv/Dec)
        </h2>
        <div
          className="flex justify-center gap-10 mb-6 text-base sm:text-lg"
          style={{ color: "var(--fg)" }}
        >
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
        <div
          className="min-h-[220px] flex items-center justify-center"
          style={{ color: "var(--muted)" }}
        >
          Loading market data...
        </div>
      </Wrapper>
    );
  }

  // Hard error and no data at all
  if (error && !dataRef.current) {
    return (
      <Wrapper>
        <h2
          className="text-2xl font-bold text-center mb-4"
          style={{ color: "var(--fg)" }}
        >
          📈 Market Breadth (Adv/Dec)
        </h2>
        <div className="min-h-[220px] flex flex-col items-center justify-center">
          <div className="text-red-400 mb-4">
            Error: {error || "Failed to fetch"}
          </div>
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

  // Normal view (or soft warning with last data)
  const current = dataRef.current?.current || {
    advances: 0,
    declines: 0,
    total: 0,
  };

  return (
    <Wrapper>
      <div className="flex items-center justify-between mb-4">
        <h2
          className="text-2xl font-bold"
          style={{ color: "var(--fg)" }}
        >
          📈 Market Breadth (Adv/Dec)
        </h2>
        <div
          className="text-xs"
          style={{ color: "var(--muted)" }}
        >
          {lastUpdated
            ? `Last updated: ${lastUpdated.toLocaleTimeString("en-IN", {
                hour12: false,
              })}`
            : ""}
        </div>
      </div>

      <div
        className="flex justify-center gap-10 mb-6 text-base sm:text-lg"
        style={{ color: "var(--fg)" }}
      >
        <div>
          <span style={{ color: "var(--muted)" }}>Advances: </span>
          <span
            className="font-semibold"
            style={{ color: "#10B981" }}
          >
            {current.advances ?? "--"}
          </span>
        </div>
        <div>
          <span style={{ color: "var(--muted)" }}>Declines: </span>
          <span
            className="font-semibold"
            style={{ color: "#EF4444" }}
          >
            {current.declines ?? "--"}
          </span>
        </div>
        <div>
          <span style={{ color: "var(--muted)" }}>Total: </span>
          <span
            className="font-semibold"
            style={{ color: "#60A5FA" }}
          >
            {current.total ?? "--"}
          </span>
        </div>
      </div>

      <div
        style={{
          minHeight: 220,
          width: "100%",
          position: "relative",
          ...(panel === "fullscreen"
            ? { flex: "1 1 0%" }
            : null),
        }}
      >
        <ResponsiveContainer
          width="100%"
          height={panel === "fullscreen" ? "100%" : 300}
        >
          {series.length ? (
            <AreaChart
              data={series}
              margin={{ right: 20, left: -20 }}
            >
              <XAxis
                dataKey="time"
                stroke="var(--axis)"
                tick={{
                  fill: "var(--axis)",
                  fontSize: 10,
                }}
              />
              <YAxis
                allowDecimals={false}
                stroke="var(--axis)"
                tick={{
                  fill: "var(--axis)",
                  fontSize: 10,
                }}
                domain={[0, "dataMax + 5"]}
              />
              <Tooltip
                contentStyle={
                  {
                    background: "var(--tip)",
                    borderColor: "var(--tipbr)",
                    borderRadius: "0.5rem",
                  } as React.CSSProperties
                }
                itemStyle={
                  { color: "var(--fg)" } as React.CSSProperties
                }
                labelStyle={{ color: "var(--fg)" }}
                formatter={(value: number, name: string) => [
                  value,
                  name === "advances"
                    ? "Advances"
                    : name === "declines"
                    ? "Declines"
                    : name,
                ]}
                labelFormatter={(label) =>
                  `Time: ${label}`
                }
              />
              <Legend
                wrapperStyle={{ color: "var(--fg)" }}
                formatter={(value) => {
                  if (value === "advances")
                    return "📈 Advances";
                  if (value === "declines")
                    return "📉 Declines";
                  return value;
                }}
              />
              <defs>
                <linearGradient
                  id="advFill"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="5%"
                    stopColor="#10B981"
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="95%"
                    stopColor="#10B981"
                    stopOpacity={0}
                  />
                </linearGradient>
                <linearGradient
                  id="decFill"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="5%"
                    stopColor="#EF4444"
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="95%"
                    stopColor="#EF4444"
                    stopOpacity={0}
                  />
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
            <div
              className="flex items-center justify-center h-full"
              style={{ color: "var(--fg)" }}
            >
              No chart data available
            </div>
          )}
        </ResponsiveContainer>
      </div>

      {error ? (
        <div
          className="mt-3 text-xs"
          style={{ color: "#f59e0b" }}
        >
          Warning: {error}. Showing last available data.
        </div>
      ) : null}
    </Wrapper>
  );
};

export default Avd_Dec;
