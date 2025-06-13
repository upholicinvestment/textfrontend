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
import { useEffect, useState, useRef } from "react";

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

const Avd_Dec: React.FC = () => {
  const [data, setData] = useState<MarketBreadthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const lastSlotRef = useRef<string | null>(null);

  const fetchMarketBreadth = async () => {
    try {
      setError(null);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch("https://api.upholictech.com/api/advdec", {
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Status ${response.status}: ${text}`);
      }
      const result: MarketBreadthData = await response.json();
      const latestSlot = result.chartData?.at(-1)?.time;
      if (latestSlot && latestSlot !== lastSlotRef.current) {
        setData(result);
        setLoading(false);
        lastSlotRef.current = latestSlot ?? null;
      } else if (!data) {
        setData(result);
        setLoading(false);
        lastSlotRef.current = latestSlot ?? null;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setError(msg);
      console.error("Fetch error:", err);
    }
  };

  useEffect(() => {
    fetchMarketBreadth();
    const interval = setInterval(fetchMarketBreadth, 5000);
    return () => clearInterval(interval);
    // eslint-disable-next-line
  }, []);

  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <motion.div
      className="w-full max-w-5xl min-h-[300px] bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-xl p-6"
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );

  // Always render the wrapper, numbers, and chart
  return (
    <Wrapper>
      <h2 className="text-2xl font-bold text-center text-white mb-4">
        📈 Market Breadth (Adv/Dec)
      </h2>
      <div className="flex justify-center gap-10 mb-6 text-white text-base sm:text-lg">
        <div>
          <span className="text-gray-400">Advances: </span>
          <span className="text-green-400 font-semibold">
            {data ? data.current.advances : "--"}
          </span>
        </div>
        <div>
          <span className="text-gray-400">Declines: </span>
          <span className="text-red-400 font-semibold">
            {data ? data.current.declines : "--"}
          </span>
        </div>
        <div>
          <span className="text-gray-400">Total: </span>
          <span className="text-blue-300 font-semibold">
            {data ? data.current.total : "--"}
          </span>
        </div>
      </div>
      <div style={{ minHeight: 220, width: "100%", position: "relative" }}>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={data ? data.chartData : []} margin={{ right: 20, left: -20 }}>
            <XAxis
              dataKey="time"
              stroke="#9CA3AF"
              tick={{ fill: "#9CA3AF", fontSize: 7 }}
            />
            <YAxis stroke="#9CA3AF" tick={{ fill: "#9CA3AF", fontSize: 10 }} />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1F2937",
                borderColor: "#374151",
                borderRadius: "0.5rem",
                fontSize: 13,
              }}
              itemStyle={{ color: "#F3F4F6" }}
              formatter={(value: number, name: string) => [
                value,
                name === "advances" ? "Advances" : "Declines",
              ]}
              labelFormatter={(label) => `Time: ${label}`}
            />
            <Legend
              formatter={(value) => {
                if (value === "advances") return "📈 Advances";
                if (value === "declines") return "📉 Declines";
                return value;
              }}
              wrapperStyle={{ color: "#D1D5DB", fontSize: 14 }}
            />
            <Area
              type="monotone"
              dataKey="advances"
              stroke="#10B981"
              fill="url(#advFill)"
              strokeWidth={2}
              activeDot={{ r: 5 }}
              dot={false}
            />
            <Area
              type="monotone"
              dataKey="declines"
              stroke="#EF4444"
              fill="url(#decFill)"
              strokeWidth={2}
              activeDot={{ r: 5 }}
              dot={false}
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
          </AreaChart>
        </ResponsiveContainer>
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-60 text-white text-lg z-10">
            Loading market breadth data...
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-60 text-red-400 text-lg z-10">
            Error: {error}
          </div>
        )}
      </div>
    </Wrapper>
  );
};

export default Avd_Dec;