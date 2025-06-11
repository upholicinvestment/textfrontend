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
      setLoading(true);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch("https://www.upholictech.com/api/advdec", {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
        },
        mode: 'cors'
      });

      clearTimeout(timeoutId);

      // Check if response is HTML instead of JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        if (text.startsWith('<!DOCTYPE html>')) {
          throw new Error('Server returned HTML page instead of JSON. Check API endpoint.');
        }
        throw new Error(`Unexpected content type: ${contentType}`);
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! Status: ${response.status}`);
      }

      const result: MarketBreadthData = await response.json();
      
      // Validate response structure
      if (!result || !result.current || !result.chartData) {
        throw new Error('Invalid API response structure');
      }

      const latestSlot = result.chartData.length > 0 
        ? result.chartData[result.chartData.length - 1].time 
        : null;

      if (latestSlot && latestSlot !== lastSlotRef.current) {
        setData(result);
        lastSlotRef.current = latestSlot;
      } else if (!data) {
        setData(result);
        lastSlotRef.current = latestSlot;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error occurred";
      setError(msg);
      console.error("API fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMarketBreadth();
    const interval = setInterval(fetchMarketBreadth, 5000);
    return () => clearInterval(interval);
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

  // Format numbers with commas
  const formatNumber = (num: number | undefined) => {
    return num !== undefined ? num.toLocaleString() : "--";
  };

  return (
    <Wrapper>
      <h2 className="text-2xl font-bold text-center text-white mb-4">
        📈 Market Breadth (Adv/Dec)
      </h2>
      <div className="flex justify-center gap-10 mb-6 text-white text-base sm:text-lg">
        <div>
          <span className="text-gray-400">Advances: </span>
          <span className="text-green-400 font-semibold">
            {formatNumber(data?.current.advances)}
          </span>
        </div>
        <div>
          <span className="text-gray-400">Declines: </span>
          <span className="text-red-400 font-semibold">
            {formatNumber(data?.current.declines)}
          </span>
        </div>
        <div>
          <span className="text-gray-400">Total: </span>
          <span className="text-blue-300 font-semibold">
            {formatNumber(data?.current.total)}
          </span>
        </div>
      </div>
      <div style={{ minHeight: 220, width: "100%", position: "relative" }}>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart 
            data={data?.chartData || []} 
            margin={{ right: 20, left: -20 }}
          >
            <XAxis
              dataKey="time"
              stroke="#9CA3AF"
              tick={{ fill: "#9CA3AF", fontSize: 7 }}
            />
            <YAxis 
              stroke="#9CA3AF" 
              tick={{ fill: "#9CA3AF", fontSize: 10 }} 
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1F2937",
                borderColor: "#374151",
                borderRadius: "0.5rem",
                fontSize: 13,
              }}
              itemStyle={{ color: "#F3F4F6" }}
              formatter={(value: number, name: string) => [
                value.toLocaleString(),
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
            <div className="animate-pulse">Loading market data...</div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 bg-opacity-60 text-red-400 text-lg z-10 p-4">
            <div className="text-center mb-2">⚠️ Error loading data</div>
            <div className="text-sm mb-4 text-center max-w-md">{error}</div>
            <button
              onClick={fetchMarketBreadth}
              className="mt-2 px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 text-white text-sm"
            >
              Retry
            </button>
          </div>
        )}
      </div>
    </Wrapper>
  );
};

export default Avd_Dec;





// import React from 'react';
// import {
//   Chart as ChartJS,
//   LineElement,
//   LineController,
//   PointElement,
//   CategoryScale,
//   LinearScale,
//   Tooltip,
//   Legend,
//   Title,
// } from 'chart.js';
// import { Line } from 'react-chartjs-2';
// import { motion } from 'framer-motion';

// // ✅ Register required Chart.js components
// ChartJS.register(
//   LineElement,
//   LineController,
//   PointElement,
//   CategoryScale,
//   LinearScale,
//   Tooltip,
//   Legend,
//   Title
// );

// // ✅ Data & Config
// const chartData = {
//   labels: [
//     '09:30', '10:00', '10:30', '11:00', '11:30',
//     '12:00', '12:30', '13:00', '13:30', '14:00',
//     '14:30', '15:00',
//   ],
//   datasets: [
//     {
//       label: '📈 Advances',
//       data: [200, 350, 500, 650, 800, 900, 950, 1050, 1150, 1200, 1230, 1250],
//       borderColor: '#10B981',
//       backgroundColor: '#10B981',
//       tension: 0.4,
//       fill: false,
//     },
//     {
//       label: '📉 Declines',
//       data: [150, 250, 300, 400, 500, 600, 650, 700, 750, 800, 820, 850],
//       borderColor: '#EF4444',
//       backgroundColor: '#EF4444',
//       tension: 0.4,
//       fill: false,
//     },
//   ],
// };

// const chartOptions = {
//   responsive: true,
//   plugins: {
//     legend: {
//       labels: {
//         color: '#D1D5DB',
//         font: {
//           size: 13,
//         },
//       },
//     },
//     tooltip: {
//       backgroundColor: '#1F2937',
//       titleColor: '#F3F4F6',
//       bodyColor: '#F3F4F6',
//       borderColor: '#374151',
//       borderWidth: 1,
//     },
//   },
//   scales: {
//     x: {
//       ticks: {
//         color: '#9CA3AF',
//         font: {
//           size: 10,
//         },
//       },
//       grid: {
//         color: '#374151',
//       },
//     },
//     y: {
//       ticks: {
//         color: '#9CA3AF',
//         font: {
//           size: 10,
//         },
//       },
//       grid: {
//         color: '#374151',
//       },
//     },
//   },
// };

// const MarketBreadthChart: React.FC = () => {
//   const advances = 1250;
//   const declines = 850;
//   const total = 2100;

//   return (
//     <motion.div
//       className="w-full max-w-5xl min-h-[300px] bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-xl p-6 mx-auto"
//       initial={{ opacity: 0, y: 50 }}
//       animate={{ opacity: 1, y: 0 }}
//       transition={{ duration: 0.6, ease: 'easeOut' }}
//     >
//       <h2 className="text-2xl font-bold text-center text-white mb-4">
//         📈 Market Breadth (Adv/Dec)
//       </h2>

//       <div className="flex justify-center gap-10 mb-6 text-white text-base sm:text-lg">
//         <div>
//           <span className="text-gray-400">Advances: </span>
//           <span className="text-green-400 font-semibold">{advances}</span>
//         </div>
//         <div>
//           <span className="text-gray-400">Declines: </span>
//           <span className="text-red-400 font-semibold">{declines}</span>
//         </div>
//         <div>
//           <span className="text-gray-400">Total: </span>
//           <span className="text-blue-300 font-semibold">{total}</span>
//         </div>
//       </div>

//       <Line data={chartData} options={chartOptions} />
//     </motion.div>
//   );
// };

// export default MarketBreadthChart;






// import React from 'react';
// import {
//   Chart as ChartJS,
//   LineElement,
//   LineController,
//   PointElement,
//   CategoryScale,
//   LinearScale,
//   Tooltip,
//   Legend,
//   Title,
// } from 'chart.js';
// import { Line } from 'react-chartjs-2';
// import { motion } from 'framer-motion';

// ChartJS.register(
//   LineElement,
//   LineController,
//   PointElement,
//   CategoryScale,
//   LinearScale,
//   Tooltip,
//   Legend,
//   Title
// );

// const chartData = {
//   labels: [
//     '09:30', '10:00', '10:30', '11:00', '11:30',
//     '12:00', '12:30', '13:00', '13:30', '14:00',
//     '14:30', '15:00',
//   ],
//   datasets: [
//     {
//       label: '📈 Advances',
//       data: [200, 350, 500, 650, 800, 900, 950, 1050, 1150, 1200, 1230, 1250],
//       borderColor: '#10B981',
//       backgroundColor: '#10B981',
//       tension: 0.4,
//       fill: false,
//     },
//     {
//       label: '📉 Declines',
//       data: [150, 250, 300, 400, 500, 600, 650, 700, 750, 800, 820, 850],
//       borderColor: '#EF4444',
//       backgroundColor: '#EF4444',
//       tension: 0.4,
//       fill: false,
//     },
//   ],
// };

// const chartOptions = {
//   responsive: true,
//   plugins: {
//     legend: {
//       labels: {
//         color: '#D1D5DB',
//         font: {
//           size: 13,
//         },
//       },
//     },
//     tooltip: {
//       backgroundColor: '#1F2937',
//       titleColor: '#F3F4F6',
//       bodyColor: '#F3F4F6',
//       borderColor: '#374151',
//       borderWidth: 1,
//     },
//   },
//   scales: {
//     x: {
//       ticks: {
//         color: '#9CA3AF',
//         font: {
//           size: 10,
//         },
//       },
//       grid: {
//         color: '#374151',
//       },
//     },
//     y: {
//       ticks: {
//         color: '#9CA3AF',
//         font: {
//           size: 10,
//         },
//       },
//       grid: {
//         color: '#374151',
//       },
//     },
//   },
// };

// const MarketBreadthChart: React.FC = () => {
//   const advances = 1250;
//   const declines = 850;
//   const total = 2100;

//   return (
//     <div className="relative w-full max-w-5xl min-h-[300px]">
//       <motion.div
//         className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-xl p-6 mx-auto blur-sm"
//         initial={{ opacity: 0, y: 50 }}
//         animate={{ opacity: 1, y: 0 }}
//         transition={{ duration: 0.6, ease: 'easeOut' }}
//       >
//         <h2 className="text-2xl font-bold text-center text-white mb-4">
//           📈 Market Breadth (Adv/Dec)
//         </h2>

//         <div className="flex justify-center gap-10 mb-6 text-white text-base sm:text-lg">
//           <div>
//             <span className="text-gray-400">Advances: </span>
//             <span className="text-green-400 font-semibold">{advances}</span>
//           </div>
//           <div>
//             <span className="text-gray-400">Declines: </span>
//             <span className="text-red-400 font-semibold">{declines}</span>
//           </div>
//           <div>
//             <span className="text-gray-400">Total: </span>
//             <span className="text-blue-300 font-semibold">{total}</span>
//           </div>
//         </div>

//         <Line data={chartData} options={chartOptions} />
//       </motion.div>

//       {/* Coming Soon Overlay */}
//       <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
//         <motion.div 
//           className="bg-none bg-opacity-50 backdrop-blur-sm rounded-xl p-6 text-center max-w-md"
//           initial={{ opacity: 0 }}
//           animate={{ opacity: 1 }}
//           transition={{ duration: 0.5 }}
//         >
//           <motion.h2 
//             className="text-3xl font-bold text-white mb-3"
//             initial={{ y: -20 }}
//             animate={{ y: 0 }}
//             transition={{ delay: 0.2 }}
//           >
//             Coming Soon
//           </motion.h2>
//           <motion.p 
//             className="text-gray-200 text-lg"
//             initial={{ y: 20 }}
//             animate={{ y: 0 }}
//             transition={{ delay: 0.3 }}
//           >
//             Market Breadth Analysis in Development
//           </motion.p>
//         </motion.div>
//       </div>
//     </div>
//   );
// };

// export default MarketBreadthChart;
