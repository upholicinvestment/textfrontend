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
import { useEffect, useRef, useState, useCallback } from "react";

interface ChartData {
  time: string;
  advances: number;
  declines: number;
}

interface MarketBreadthCurrent {
  advances: number;
  declines: number;
  total: number;
}

interface MarketBreadthData {
  current: MarketBreadthCurrent;
  chartData: ChartData[];
}

const REFRESH_MS = 10_000; // ⏱️ poll every 10s
const API_URL = "https://api.upholictech.com/api/advdec?bin=5"; // you can tweak bin

const Avd_Dec: React.FC = () => {
  const [data, setData] = useState<MarketBreadthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const controllerRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);

  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <motion.div
      className="w-full max-w-5xl min-h-[300px] rounded-2xl shadow-xl p-6"
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      style={{
        background: "var(--card-bg)",
        color: "var(--fg)",
        border: "1px solid var(--border)",
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
      const url = `${API_URL}&_=${Date.now()}`; // cache-buster
      const resp = await fetch(url, {
        signal: controller.signal,
        cache: "no-store",
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

      const json: MarketBreadthData = await resp.json();
      if (!json || typeof json !== "object" || !json.current || !json.chartData) {
        throw new Error("Invalid payload");
      }

      if (!mountedRef.current) return;
      setData(json);
      setLastUpdated(new Date());
      setError(null);
      setLoading(false);
    } catch (e: any) {
      if (e?.name === "AbortError") return; // expected on refresh/unmount
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
            {data?.current?.advances ?? "--"}
          </span>
        </div>
        <div>
          <span style={{ color: "var(--muted)" }}>Declines: </span>
          <span className="font-semibold" style={{ color: "#EF4444" }}>
            {data?.current?.declines ?? "--"}
          </span>
        </div>
        <div>
          <span style={{ color: "var(--muted)" }}>Total: </span>
          <span className="font-semibold" style={{ color: "#60A5FA" }}>
            {data?.current?.total ?? "--"}
          </span>
        </div>
      </div>

      <div style={{ minHeight: 220, width: "100%", position: "relative" }}>
        <ResponsiveContainer width="100%" height={300}>
          {data?.chartData?.length ? (
            <AreaChart data={data.chartData} margin={{ right: 20, left: -20 }}>
              <XAxis
                dataKey="time"
                stroke="var(--axis)"
                tick={{ fill: "var(--axis)", fontSize: 10 }}
              />
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
                  name === "advances" ? "Advances" : "Declines",
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
