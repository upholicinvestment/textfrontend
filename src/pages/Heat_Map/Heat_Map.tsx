// import React from "react";
// import { Treemap, ResponsiveContainer } from "recharts";

// interface TreeMapData {
//   name: string;
//   size: number;
// }

// interface CustomizedContentProps {
//   x: number;
//   y: number;
//   width: number;
//   height: number;
//   index: number;
//   name: string;
//   depth?: number;
//   root?: TreeMapData;
// }

// const data: TreeMapData[] = [
//   { name: "HDFCBANK", size: 1200 },
//   { name: "ICICIBANK", size: 1000 },
//   { name: "AXISBANK", size: 900 },
//   { name: "SBIN", size: 850 },
//   { name: "KOTAKBANK", size: 800 },
//   { name: "IDFCFIRSTB", size: 650 },
//   { name: "PNB", size: 500 },
//   { name: "BANKBARODA", size: 600 },
//   { name: "AUROPHARMA", size: 350 },
// ];

// const CustomizedContent: React.FC<CustomizedContentProps> = ({ 
//   x, 
//   y, 
//   width, 
//   height, 
//   index, 
//   name 
// }) => {
//   const colors = ["#2ecc71", "#27ae60", "#229954", "#1e8449"];
//   const color = colors[index % colors.length];

//   const isVisible = width > 60 && height > 25;
//   const fontSize = width < 70 ? 9 : 12;

//   return (
//     <g>
//       <rect
//         x={x}
//         y={y}
//         width={width}
//         height={height}
//         style={{
//           fill: color,
//           stroke: "#111827",
//           strokeWidth: 1,
//         }}
//       />
//       {isVisible ? (
//         <foreignObject x={x} y={y} width={width} height={height}>
//           <div
//             style={{
//               display: "flex",
//               justifyContent: "center",
//               alignItems: "center",
//               height: "100%",
//               width: "100%",
//               fontSize: fontSize,
//               color: "white",
//               textAlign: "center",
//               whiteSpace: "nowrap",
//               overflow: "hidden",
//               textOverflow: "ellipsis",
//               fontWeight: 500,
//             }}
//           >
//             {name}
//           </div>
//         </foreignObject>
//       ) : null}
//     </g>
//   );
// };

// const Heat_Map: React.FC = () => {
//   return (
//     <div className="w-full max-w-5xl h-[320px] bg-gray-900 text-white p-2 rounded-xl shadow-md">
//       <h2 className="text-xl font-semibold mb-3">Heatmap</h2>
//       <ResponsiveContainer width="100%" height="100%">
//         <Treemap
//           data={data}
//           dataKey="size"
//           stroke="#fff"
//           fill="#8884d8"
//           // TypeScript will infer the props correctly here
//           content={<CustomizedContent x={0} y={0} width={0} height={0} index={0} name="" />}
//         />
//       </ResponsiveContainer>
//     </div>
//   );
// };

// export default Heat_Map;



// import React from "react";
// import { Treemap, ResponsiveContainer } from "recharts";
// import { motion } from "framer-motion";

// interface TreeMapData {
//   name: string;
//   size: number;    
// }

// interface CustomizedContentProps {
//   x: number;
//   y: number;
//   width: number;
//   height: number;
//   index: number;
//   name: string;
//   depth?: number;
//   root?: TreeMapData;
// }

// const data: TreeMapData[] = [
//   { name: "HDFCBANK", size: 1200 },
//   { name: "ICICIBANK", size: 1000 },
//   { name: "AXISBANK", size: 900 },
//   { name: "SBIN", size: 850 },
//   { name: "KOTAKBANK", size: 800 },
//   { name: "IDFCFIRSTB", size: 650 },
//   { name: "PNB", size: 500 },
//   { name: "BANKBARODA", size: 600 },
//   { name: "AUROPHARMA", size: 350 },
// ];

// const CustomizedContent: React.FC<CustomizedContentProps> = ({ 
//   x, 
//   y, 
//   width, 
//   height, 
//   index, 
//   name 
// }) => {
//   const colors = ["#2ecc71", "#27ae60", "#229954", "#1e8449"];
//   const color = colors[index % colors.length];

//   const isVisible = width > 60 && height > 25;
//   const fontSize = width < 70 ? 9 : 12;

//   return (
//     <g>
//       <rect
//         x={x}
//         y={y}
//         width={width}
//         height={height}
//         style={{
//           fill: color,
//           stroke: "#111827",
//           strokeWidth: 1,
//         }}
//       />
//       {isVisible ? (
//         <foreignObject x={x} y={y} width={width} height={height}>
//           <div
//             style={{
//               display: "flex",
//               justifyContent: "center",
//               alignItems: "center",
//               height: "100%",
//               width: "100%",
//               fontSize: fontSize,
//               color: "white",
//               textAlign: "center",
//               whiteSpace: "nowrap",
//               overflow: "hidden",
//               textOverflow: "ellipsis",
//               fontWeight: 500,
//             }}
//           >
//             {name}
//           </div>
//         </foreignObject>
//       ) : null}
//     </g>
//   );
// };

// const Heat_Map: React.FC = () => {
//   return (
//     <div className="relative w-full max-w-5xl h-[320px]">
//       <motion.div 
//         className="w-full h-full bg-gray-900 text-white p-2 rounded-xl shadow-md blur-sm"
//         initial={{ opacity: 0 }}
//         animate={{ opacity: 1 }}
//         transition={{ duration: 0.3 }}
//       >
//         <h2 className="text-xl font-semibold mb-3">Heatmap</h2>
//         <ResponsiveContainer width="100%" height="100%">
//           <Treemap
//             data={data}
//             dataKey="size"
//             stroke="#fff"
//             fill="#8884d8"
//             content={<CustomizedContent x={0} y={0} width={0} height={0} index={0} name="" />}
//           />
//         </ResponsiveContainer>
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
//             Heatmap Visualization in Development
//           </motion.p>
//         </motion.div>
//       </div>
//     </div>
//   );
// };

// export default Heat_Map;




import React, { useEffect, useState } from "react";

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
  size: number;
  topGainers: StockData[];
  topLosers: StockData[];
  showBelow?: boolean;
}

// Helper to deduplicate array by a key (trading_symbol)
function uniqueBy<T, K extends keyof T>(arr: T[], key: K): T[] {
  const seen = new Set();
  return arr.filter(item => {
    const val = item[key];
    if (seen.has(val)) return false;
    seen.add(val);
    return true;
  });
}

const Heat_Map: React.FC = () => {
  const [data, setData] = useState<SectorData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hoveredSector, setHoveredSector] = useState<SectorData | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch("https://api.upholictech.com/api/heatmap");
        if (!response.ok) {
          throw new Error(`API error: ${response.status} ${response.statusText}`);
        }

        const stocks: StockData[] = await response.json();
        if (!Array.isArray(stocks)) {
          throw new Error("API response is not an array");
        }

        // Only stocks with valid trading_symbol, LTP, and close
        const validStocks = stocks.filter((stock) => {
          const symbol = stock.trading_symbol;
          const ltpVal = stock.LTP ?? stock.ltp;
          const closeVal = stock.close ?? stock.Close;
          if (typeof symbol !== "string" || symbol.trim() === "") return false;
          if (symbol.endsWith("-OI")) return false;
          const closeNum = parseFloat(closeVal);
          const ltpNum = parseFloat(ltpVal);
          return !isNaN(closeNum) && !isNaN(ltpNum) && closeNum > 0;
        });

        if (validStocks.length === 0) {
          throw new Error("No valid stocks found with proper prices.");
        }

        // Calculate percentage change for each stock
        const stocksWithChanges = validStocks.map((stock) => {
          const closePrice = parseFloat(stock.close);
          const ltp = parseFloat(stock.LTP);
          const change = ((ltp - closePrice) / closePrice) * 100;
          return {
            ...stock,
            change,
            sector: stock.sector,
            trading_symbol: stock.trading_symbol,
          };
        });

        // Group by sector and find top gainers/losers per sector
        const sectorMap: Record<
          string,
          { sum: number; count: number; stocks: StockData[] }
        > = {};

        stocksWithChanges.forEach((stock) => {
          const sector = stock.sector || "Unknown";
          if (!sectorMap[sector]) {
            sectorMap[sector] = { sum: 0, count: 0, stocks: [] };
          }
          sectorMap[sector].sum += stock.change ?? 0;
          sectorMap[sector].count += 1;
          sectorMap[sector].stocks.push(stock);
        });

        const sectorAverages = Object.entries(sectorMap)
          .map(([sector, { sum, count, stocks }]) => {
            const avgChange = sum / count;

            // Deduplicate by trading_symbol (so no repeats)
            const uniqueStocks = uniqueBy(stocks, "trading_symbol");

            // Top gainers: unique, >0 change, sorted desc, up to 3
            const topGainers = uniqueStocks
              .filter(s => (s.change ?? 0) > 0)
              .sort((a, b) => (b.change ?? 0) - (a.change ?? 0))
              .slice(0, 3);

            // Top losers: unique, <0 change, sorted asc, up to 3
            const topLosers = uniqueStocks
              .filter(s => (s.change ?? 0) < 0)
              .sort((a, b) => (a.change ?? 0) - (b.change ?? 0))
              .slice(0, 3);

            return {
              name: sector,
              size: parseFloat(avgChange.toFixed(2)),
              topGainers,
              topLosers
            };
          })
          .sort((a, b) => b.size - a.size);

        setData(sectorAverages);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        setData([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Enhanced color function with better gradients
  const getColor = (value: number) => {
    if (value >= 3) return "#059669"; // Emerald-700
    if (value >= 1.5) return "#10b981"; // Emerald-500
    if (value > 0) return "#6ee7b7"; // Emerald-300
    if (value === 0) return "#6b7280"; // Gray-500
    if (value >= -1.5) return "#fca5a5"; // Red-300
    if (value >= -3) return "#ef4444"; // Red-500
    return "#dc2626"; // Red-600
  };

  const getTextColor = (value: number) => {
    if (Math.abs(value) >= 1.5) return "#ffffff";
    return "#1f2937";
  };

  const cleanSymbol = (symbol: string) => {
    return symbol.replace(/-[A-Z]{3}-\d{4}-FUT$/i, "");
  };

  const handleMouseEnter = (sector: SectorData, event: React.MouseEvent, index: number) => {
    const target = event.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    const containerRect = target.closest('.heatmap-container')?.getBoundingClientRect();
    
    if (containerRect) {
      // Calculate position relative to the container
      const x = rect.left - containerRect.left + rect.width / 2;
      const y = rect.top - containerRect.top;
      
      // Determine if tooltip should appear above or below based on row
      const row = Math.floor(index / columns);
      const showBelow = row < 2; // First 2 rows show tooltip below
      
      setHoveredSector({ ...sector, showBelow });
      setTooltipPosition({ x, y });
    }
  };

  const handleMouseLeave = () => {
    setHoveredSector(null);
  };

  if (loading) {
    return (
      <div className="w-full max-w-6xl h-96 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-6 rounded-xl shadow-2xl flex justify-center items-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-lg font-medium">Loading sector heatmap...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full max-w-6xl h-96 bg-gradient-to-br from-red-900 via-red-800 to-red-900 text-white p-6 rounded-xl shadow-2xl flex flex-col justify-center items-center text-center">
        <div className="bg-red-500 rounded-full p-3 mb-4">
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </div>
        <h2 className="text-xl font-bold mb-2">Error Loading Data</h2>
        <p className="text-red-200 mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors duration-200 shadow-lg"
        >
          Retry
        </button>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="w-full max-w-6xl h-96 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-6 rounded-xl shadow-2xl flex justify-center items-center text-center">
        <p className="text-lg">No sector data available</p>
      </div>
    );
  }

  const columns = Math.min(5, data.length);

  return (
    <div className="w-full max-w-6xl bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-xl p-2 shadow-2xl relative heatmap-container">
      {/* Header */}
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-white mb-2">
          Sector Performance Heatmap
        </h1>
        
      </div>

      {/* Heatmap Grid */}
      <div
        className="grid gap-0.5  overflow-hidden"
        style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
      >
        {data.map((item, index) => (
          <div
            key={index}
            className="flex flex-col items-center justify-center cursor-pointer relative transition-all duration-300  hover:shadow-lg "
            style={{
              backgroundColor: getColor(item.size),
              color: getTextColor(item.size),
              aspectRatio: "1.6",
              padding: "0px",
            }}
            onMouseEnter={(e) => handleMouseEnter(item, e, index)}
            onMouseLeave={handleMouseLeave}
          >
            <div
              className="font-semibold text-xs leading-tight w-full text-center overflow-hidden text-ellipsis "
              title={item.name}
            >
              {item.name}
            </div>
            <div className="font-semibold text-sm">
              {item.size > 0 ? "+" : ""}
              {item.size.toFixed(1)}%
            </div>
          </div>
        ))}
      </div>

      {/* Color Legend */}
      

      {/* Enhanced Tooltip */}
      {hoveredSector && (
        <div
          className="absolute bg-white rounded-xl shadow-2xl border border-gray-200 p-1 w-38 z-50 pointer-events-none"
          style={{
            left: `${tooltipPosition.x}px`,
            top: hoveredSector.showBelow 
              ? `${tooltipPosition.y + 60}px` 
              : `${tooltipPosition.y - 10}px`,
            transform: hoveredSector.showBelow 
              ? "translate(-50%, -15%)" 
              : "translate(-50%, -80%)",
          }}
        >
          {/* Header */}
          <div className="text-center mb-1 pb-1 border-b border-gray-100">
            <div className="font-bold text-gray-800 text-base mb-1">
              {hoveredSector.name}
            </div>
            <div className={`text-sm font-bold ${hoveredSector.size >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {hoveredSector.size > 0 ? "+" : ""}
              {hoveredSector.size.toFixed(2)}%
            </div>
          </div>

          {/* Top Gainers */}
          {hoveredSector.topGainers.length > 0 && (
            <div className="mb-2">
              <div className="flex items-center gap-1 mb-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-xs font-medium text-green-700 uppercase tracking-wide">
                  Top Gainers
                </span>
              </div>
              {hoveredSector.topGainers.map((stock, idx) => {
                const displayName = cleanSymbol(stock.trading_symbol);
                return (
                  <div key={`gain-${idx}`} className="flex justify-between items-center py-1 px-2 bg-green-50 rounded mb-1">
                    <span className="text-xs font-medium text-gray-700 truncate flex-1 mr-2" title={displayName}>
                      {displayName}
                    </span>
                    <span className="text-xs font-medium text-green-600 whitespace-nowrap">
                      +{stock.change?.toFixed(1)}%
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Top Losers */}
          {hoveredSector.topLosers.length > 0 && (
            <div className="mb-2">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span className="text-xs font-medium text-red-700 uppercase tracking-wide">
                  Top Losers
                </span>
              </div>
              {hoveredSector.topLosers.map((stock, idx) => {
                const displayName = cleanSymbol(stock.trading_symbol);
                return (
                  <div key={`loss-${idx}`} className="flex justify-between items-center py-1 px-2 bg-red-50 rounded mb-1">
                    <span className="text-xs font-medium text-gray-700 truncate flex-1 mr-2" title={displayName}>
                      {displayName}
                    </span>
                    <span className="text-xs font-bold text-red-600 ">
                      {stock.change?.toFixed(1)}%
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* No Data Message */}
          {hoveredSector.topGainers.length === 0 && hoveredSector.topLosers.length === 0 && (
            <div className="text-xs text-gray-500 italic text-center py-4">
              No individual stock data available for this sector
            </div>
          )}

          {/* Tooltip Arrow - Dynamic positioning */}
          <div 
            className={`absolute left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 drop-shadow-sm ${
              hoveredSector.showBelow 
                ? 'bottom-full border-b-8 border-l-transparent border-r-transparent border-b-white'
                : 'top-full border-t-8 border-l-transparent border-r-transparent border-t-white'
            }`}
          ></div>
        </div>
      )}
    </div>
  );
};

export default Heat_Map;

