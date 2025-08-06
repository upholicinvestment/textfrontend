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
  const [loading, setLoading] = useState(true); // Start with loading true
  const [error, setError] = useState<string | null>(null);
  const controllerRef = useRef<AbortController | null>(null);

  // console.log("Component render - loading:", loading, "data:", data, "error:", error);

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

  useEffect(() => {
    // console.log("Effect running - initial fetch");
    
    const fetchData = async () => {
      controllerRef.current = new AbortController();
      const signal = controllerRef.current.signal;

      try {
        // console.log("Starting fetch request");
        const response = await fetch("https://api.upholictech.com/api/advdec", {
          signal,
          cache: 'no-cache'
        });
        

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        // console.log("Received data:", result);

        if (!result || !result.current || !result.chartData) {
          throw new Error("Invalid data structure received");
        }

        setData(result);
        setLoading(false);
        setError(null);
      } catch (err) {
        // if (err.name !== 'AbortError') {
          // console.error("Fetch error:", err);
          // setError(err.message || "Failed to load data");
          // setLoading(false);
        // }
        
      }
    };

    fetchData();

    const intervalId = setInterval(fetchData, 70000);
    // console.log("Set up refresh interval");

    return () => {
      // console.log("Cleanup - aborting request and clearing interval");
      if (controllerRef.current) {
        controllerRef.current.abort();
      }
      clearInterval(intervalId);
    };
  }, []);

  if (loading) {
    // console.log("Rendering loading state");
    return (
      <Wrapper>
        <h2 className="text-2xl font-bold text-center text-white mb-4">
          📈 Market Breadth (Adv/Dec)
        </h2>
        <div className="flex justify-center gap-10 mb-6 text-white text-base sm:text-lg">
          {['Advances', 'Declines', 'Total'].map((item) => (
            <div key={item}>
              <span className="text-gray-400">{item}: </span>
              <span className="animate-pulse bg-gray-700 rounded h-6 w-10 inline-block"></span>
            </div>
          ))}
        </div>
        <div className="min-h-[220px] flex items-center justify-center">
          <div className="text-white">Loading market data...</div>
        </div>
      </Wrapper>
    );
  }

  if (error) {
    console.log("Rendering error state:", error);
    return (
      <Wrapper>
        <h2 className="text-2xl font-bold text-center text-white mb-4">
          📈 Market Breadth (Adv/Dec)
        </h2>
        <div className="min-h-[220px] flex flex-col items-center justify-center">
          <div className="text-red-400 mb-4">Error: {error}</div>
          <button
            onClick={() => {
              setLoading(true);
              setError(null);
            }}
            className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 transition"
          >
            Retry
          </button>
        </div>
      </Wrapper>
    );
  }

  // console.log("Rendering with data:", data);
  return (
    <Wrapper>
      <h2 className="text-2xl font-bold text-center text-white mb-4">
        📈 Market Breadth (Adv/Dec)
      </h2>
      <div className="flex justify-center gap-10 mb-6 text-white text-base sm:text-lg">
        <div>
          <span className="text-gray-400">Advances: </span>
          <span className="text-green-400 font-semibold">
            {data?.current?.advances ?? "--"}
          </span>
        </div>
        <div>
          <span className="text-gray-400">Declines: </span>
          <span className="text-red-400 font-semibold">
            {data?.current?.declines ?? "--"}
          </span>
        </div>
        <div>
          <span className="text-gray-400">Total: </span>
          <span className="text-blue-300 font-semibold">
            {data?.current?.total ?? "--"}
          </span>
        </div>
      </div>
      <div style={{ minHeight: 220, width: "100%", position: "relative" }}>
        <ResponsiveContainer width="100%" height={200}>
          {data?.chartData?.length ? (
            <AreaChart 
              data={data.chartData} 
              margin={{ right: 20, left: -20 }}
            >
              <XAxis
                dataKey="time"
                stroke="#9CA3AF"
                tick={{ fill: "#9CA3AF", fontSize: 10 }}
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
              />
              <Area
                type="monotone"
                dataKey="advances"
                stroke="#10B981"
                fill="url(#advFill)"
                strokeWidth={2}
                activeDot={{ r: 5 }}
              />
              <Area
                type="monotone"
                dataKey="declines"
                stroke="#EF4444"
                fill="url(#decFill)"
                strokeWidth={2}
                activeDot={{ r: 5 }}
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
          ) : (
            <div className="flex items-center justify-center h-full text-white">
              No chart data available
            </div>
          )}
        </ResponsiveContainer>
      </div>
    </Wrapper>
  );
};

export default Avd_Dec;







// import {
//   AreaChart,
//   Area,
//   XAxis,
//   YAxis,
//   Tooltip,
//   Legend,
//   ResponsiveContainer,
// } from "recharts";
// import { motion } from "framer-motion";
// import { useEffect, useState, useRef } from "react";

// interface ChartData {
//   time: string;
//   advances: number;
//   declines: number;
// }

// interface MarketBreadthCurrent {
//   advances: number;
//   declines: number;
//   total: number;
// }

// interface MarketBreadthData {
//   current: MarketBreadthCurrent;
//   chartData: ChartData[];
// }

// const Avd_Dec: React.FC = () => {
//   const [data, setData] = useState<MarketBreadthData | null>(null);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const lastSlotRef = useRef<string | null>(null);
//   const initialLoadRef = useRef(true);
//   const cachedData = useRef<MarketBreadthData | null>(null);
//   const retryCount = useRef(0);
//   const MAX_RETRIES = 3;

//   const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
//     <motion.div
//       className="w-full max-w-5xl min-h-[300px] bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-xl p-6"
//       initial={{ opacity: 0, y: 50 }}
//       animate={{ opacity: 1, y: 0 }}
//       transition={{ duration: 0.6, ease: "easeOut" }}
//     >
//       {children}
//     </motion.div>
//   );

//   useEffect(() => {
//     const controller = new AbortController();
//     let timeoutId: number;

//     const fetchMarketBreadth = async () => {
//       try {
//         if (initialLoadRef.current) {
//           setLoading(true);
//           initialLoadRef.current = false;
//         }

//         timeoutId = window.setTimeout(() => controller.abort(), 8000);

//         const response = await fetch("https://api.upholictech.com/api/advdec", {
//           signal: controller.signal,
//           cache: 'no-cache'
//         });

//         clearTimeout(timeoutId);

//         if (!response.ok) {
//           throw new Error(`Failed to fetch: ${response.status}`);
//         }

//         const result = await response.json() as MarketBreadthData;
//         const latestSlot = result.chartData?.[result.chartData.length - 1]?.time;

//         // Update cache and state
//         cachedData.current = result;
//         setData(result);
//         lastSlotRef.current = latestSlot ?? null;
//         setLoading(false);
//         retryCount.current = 0; // Reset retry counter on success

//       } catch (err) {
//         clearTimeout(timeoutId);
//         setLoading(false);

//         if (err instanceof Error) {
//           if (err.name !== 'AbortError') {
//             if (retryCount.current < MAX_RETRIES) {
//               retryCount.current++;
//               setTimeout(fetchMarketBreadth, 1000 * retryCount.current);
//               return;
//             }
//             setError(err.message || "Failed to load market data");
//             console.error("Fetch error:", err);
//           }
//         }
//       }
//     };

//     // First load - try to show cached data immediately
//     if (cachedData.current) {
//       setData(cachedData.current);
//     }
//     fetchMarketBreadth();
    
//     const intervalId = window.setInterval(fetchMarketBreadth, 5000);

//     return () => {
//       clearInterval(intervalId);
//       controller.abort();
//       clearTimeout(timeoutId);
//     };
//   }, []);

//   // Loading skeleton
//   if (loading && !data) {
//     return (
//       <Wrapper>
//         <h2 className="text-2xl font-bold text-center text-white mb-4">
//           📈 Market Breadth (Adv/Dec)
//         </h2>
//         <div className="flex justify-center gap-10 mb-6 text-white text-base sm:text-lg">
//           {['Advances', 'Declines', 'Total'].map((item) => (
//             <div key={item}>
//               <span className="text-gray-400">{item}: </span>
//               <span className="animate-pulse bg-gray-700 rounded h-6 w-10 inline-block"></span>
//             </div>
//           ))}
//         </div>
//         <div className="min-h-[220px] flex items-center justify-center">
//           <div className="text-white">Loading market data...</div>
//         </div>
//       </Wrapper>
//     );
//   }

//   return (
//     <Wrapper>
//       <h2 className="text-2xl font-bold text-center text-white mb-4">
//         📈 Market Breadth (Adv/Dec)
//       </h2>
//       <div className="flex justify-center gap-10 mb-6 text-white text-base sm:text-lg">
//         <div>
//           <span className="text-gray-400">Advances: </span>
//           <span className="text-green-400 font-semibold">
//             {data ? data.current.advances : "--"}
//           </span>
//         </div>
//         <div>
//           <span className="text-gray-400">Declines: </span>
//           <span className="text-red-400 font-semibold">
//             {data ? data.current.declines : "--"}
//           </span>
//         </div>
//         <div>
//           <span className="text-gray-400">Total: </span>
//           <span className="text-blue-300 font-semibold">
//             {data ? data.current.total : "--"}
//           </span>
//         </div>
//       </div>
//       <div style={{ minHeight: 220, width: "100%", position: "relative" }}>
//         {loading && (
//           <div className="absolute inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-10">
//             <div className="text-white">Updating data...</div>
//           </div>
//         )}
//         {error && (
//           <div className="absolute inset-0 bg-gray-900 bg-opacity-70 flex flex-col items-center justify-center z-10 p-4">
//             <div className="text-red-400 mb-2">Error: {error}</div>
//             <button 
//               onClick={() => {
//                 setError(null);
//                 retryCount.current = 0;
//                 initialLoadRef.current = true;
//               }}
//               className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 transition"
//             >
//               Retry
//             </button>
//           </div>
//         )}
//         <ResponsiveContainer width="100%" height={200}>
//           <AreaChart 
//             data={data?.chartData || []} 
//             margin={{ right: 20, left: -20 }}
//             key={data ? data.chartData.length : 0} // Force re-render on new data
//           >
//             <XAxis
//               dataKey="time"
//               stroke="#9CA3AF"
//               tick={{ fill: "#9CA3AF", fontSize: 7 }}
//             />
//             <YAxis 
//               stroke="#9CA3AF" 
//               tick={{ fill: "#9CA3AF", fontSize: 10 }} 
//               domain={['auto', 'auto']}
//             />
//             <Tooltip
//               contentStyle={{
//                 backgroundColor: "#1F2937",
//                 borderColor: "#374151",
//                 borderRadius: "0.5rem",
//                 fontSize: 13,
//               }}
//               itemStyle={{ color: "#F3F4F6" }}
//               formatter={(value: number, name: string) => [
//                 value,
//                 name === "advances" ? "Advances" : "Declines",
//               ]}
//               labelFormatter={(label) => `Time: ${label}`}
//             />
//             <Legend
//               formatter={(value) => {
//                 if (value === "advances") return "📈 Advances";
//                 if (value === "declines") return "📉 Declines";
//                 return value;
//               }}
//               wrapperStyle={{ color: "#D1D5DB", fontSize: 14 }}
//             />
//             <Area
//               type="monotone"
//               dataKey="advances"
//               stroke="#10B981"
//               fill="url(#advFill)"
//               strokeWidth={2}
//               activeDot={{ r: 5 }}
//               dot={false}
//             />
//             <Area
//               type="monotone"
//               dataKey="declines"
//               stroke="#EF4444"
//               fill="url(#decFill)"
//               strokeWidth={2}
//               activeDot={{ r: 5 }}
//               dot={false}
//             />
//             <defs>
//               <linearGradient id="advFill" x1="0" y1="0" x2="0" y2="1">
//                 <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
//                 <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
//               </linearGradient>
//               <linearGradient id="decFill" x1="0" y1="0" x2="0" y2="1">
//                 <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3} />
//                 <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
//               </linearGradient>
//             </defs>
//           </AreaChart>
//         </ResponsiveContainer>
//       </div>
//     </Wrapper>
//   );
// };

// export default Avd_Dec;
