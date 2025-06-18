import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  ComposedChart,
  Bar,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  ReferenceLine
} from "recharts";
import FIIIndexFutChart from "../../Fii_Dii/Fii_Index/Fii_Index_Fut";
import FIIOIIndexFutChart from "../../Fii_Dii/Fii_OI_Index/Fii_OI_Index_Fut";
import FIIOIIndexOptChart from "../../Fii_Dii/Fii_OI_Index/Fii_OI_Index_Opt";

interface FIIData {
  Date: string;
  FII_Call_Change: number;
  FII_Put_Change: number;
  NIFTY_Value: number;
}

interface ChartData {
  date: string;
  callChange: number;
  putChange: number;
  niftyValue: number;
  month: string;
  day: string;
  weekday: string;
}

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const weekdayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const Fii_Dii_Fno: React.FC = () => {
  const [data, setData] = useState<ChartData[]>([]);
  const [filteredData, setFilteredData] = useState<ChartData[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [months, setMonths] = useState<string[]>([]);
  const [niftyRange, setNiftyRange] = useState<{ min: number; max: number }>({ min: 0, max: 0 });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"options" | "futures" | "oi">("options");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get<FIIData[]>("http://localhost:8000/api/data");
        
        const formattedData = response.data.map((item) => {
          const dateObj = new Date(item.Date);
          return {
            date: item.Date,
            callChange: item.FII_Call_Change,
            putChange: item.FII_Put_Change,
            niftyValue: item.NIFTY_Value,
            month: monthNames[dateObj.getMonth()],
            day: dateObj.getDate().toString(),
            weekday: weekdayNames[dateObj.getDay()]
          };
        });

        const uniqueMonths = Array.from(new Set(formattedData.map(d => d.month)));
        const niftyValues = formattedData.map(d => d.niftyValue);
        
        setData(formattedData);
        setMonths(uniqueMonths);
        setSelectedMonth(uniqueMonths[0] || "");
        setNiftyRange({
          min: Math.min(...niftyValues) * 0.995,
          max: Math.max(...niftyValues) * 1.005
        });
        setIsLoading(false);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load data. Please try again later.");
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const filtered = selectedMonth ? data.filter(item => item.month === selectedMonth) : [];
    setFilteredData(filtered);
  }, [selectedMonth, data]);

  const formatTooltipValue = (value: number, name: string) => {
    if (name.includes("FII")) {
      return [`₹${value.toLocaleString("en-IN")}`, name];
    }
    return [value.toLocaleString("en-IN"), name];
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric"
    });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
        <p className="text-gray-600">Loading FII/DII F&O data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] p-6 bg-red-50 rounded-lg">
        <div className="text-red-600 font-medium text-lg mb-2">Error Loading Data</div>
        <p className="text-gray-700 text-center mb-4">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto p-4 space-y-6">
      {/* Dashboard Header */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-700 to-blue-600 p-6 text-white">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">FII/DII F&O Activity Dashboard</h1>
          <p className="text-blue-100">
            Comprehensive view of Foreign Institutional Investors' derivatives activity
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab("options")}
            className={`px-6 py-3 font-medium text-sm md:text-base transition-colors ${
              activeTab === "options" 
                ? "text-indigo-600 border-b-2 border-indigo-600" 
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Index Options
          </button>
          <button
            onClick={() => setActiveTab("futures")}
            className={`px-6 py-3 font-medium text-sm md:text-base transition-colors ${
              activeTab === "futures" 
                ? "text-indigo-600 border-b-2 border-indigo-600" 
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Index Futures
          </button>
          <button
            onClick={() => setActiveTab("oi")}
            className={`px-6 py-3 font-medium text-sm md:text-base transition-colors ${
              activeTab === "oi" 
                ? "text-indigo-600 border-b-2 border-indigo-600" 
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Open Interest
          </button>
        </div>
      </div>

      {/* Main Content */}
      {activeTab === "options" && (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex flex-wrap justify-between items-center gap-4">
            <h2 className="text-xl font-semibold text-gray-800">FII Index Options Activity</h2>
            <div className="flex flex-wrap gap-2">
              {months.map(month => (
                <button
                  key={month}
                  onClick={() => setSelectedMonth(month)}
                  className={`px-3 py-1.5 text-xs sm:text-sm font-medium transition-all rounded-full ${
                    selectedMonth === month
                      ? "bg-indigo-600 text-white shadow-md"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {month}
                </button>
              ))}
            </div>
          </div>

          <div className="p-4 md:p-6">
            <div className="h-[500px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart 
                  data={filteredData} 
                  margin={{ top: 20, right: 20, left: 20, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12, fill: "#6b7280" }}
                    tickMargin={10}
                    // tickFormatter={(day, index) => `${day} ${filteredData[index]?.weekday}`}
                  />
                  <YAxis 
                    yAxisId="left" 
                    domain={[niftyRange.min, niftyRange.max]}
                    tick={{ fontSize: 12, fill: "#6b7280" }}
                    tickFormatter={(value) => value.toLocaleString("en-IN")}
                    label={{ 
                      value: "NIFTY Value", 
                      angle: -90, 
                      position: "insideLeft",
                      fontSize: 12,
                      fill: "#374151",
                      offset: -10
                    }} 
                  />
                  <YAxis 
                    yAxisId="right" 
                    orientation="right" 
                    tick={{ fontSize: 12, fill: "#6b7280" }}
                    tickFormatter={(value) => `₹${Math.abs(value).toLocaleString("en-IN")}`}
                    label={{ 
                      value: "FII Activity", 
                      angle: -90, 
                      position: "insideRight",
                      fontSize: 12,
                      fill: "#374151",
                      offset: -10
                    }} 
                  />
                  <ReferenceLine yAxisId="right" y={0} stroke="#374151" strokeDasharray="3 3" />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: "rgba(255,255,255,0.98)",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                      fontSize: "12px"
                    }}
                    labelFormatter={(value) => (
                      <div className="font-semibold text-gray-700">
                        {formatDate(value)}
                      </div>
                    )}
                    formatter={formatTooltipValue}
                  />
                  <Legend 
                    wrapperStyle={{
                      paddingTop: "20px",
                      fontSize: "12px"
                    }}
                  />
                  <Bar 
                    yAxisId="right" 
                    dataKey="callChange" 
                    name="FII Call Change"
                    barSize={20}
                    radius={[4, 4, 0, 0]}
                  >
                    {filteredData.map((entry, index) => (
                      <Cell 
                        key={`call-${index}`} 
                        fill={entry.callChange < 0 ? "#ef4444" : "#10b981"} 
                      />
                    ))}
                  </Bar>
                  <Bar 
                    yAxisId="right" 
                    dataKey="putChange" 
                    name="FII Put Change"
                    barSize={20}
                    radius={[4, 4, 0, 0]}
                  >
                    {filteredData.map((entry, index) => (
                      <Cell 
                        key={`put-${index}`} 
                        fill={entry.putChange < 0 ? "#ef4444" : "#3b82f6"} 
                      />
                    ))}
                  </Bar>
                  <Area 
                    yAxisId="left" 
                    type="monotone" 
                    dataKey="niftyValue" 
                    fill="#6366f1" 
                    stroke="#4f46e5" 
                    name="NIFTY 50" 
                    fillOpacity={0.1}
                    strokeWidth={2}
                    activeDot={{ r: 6, fill: "#4f46e5", strokeWidth: 0 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-gray-50 px-6 py-3 text-center text-sm text-gray-500 border-t border-gray-200">
            <p>
              Data source: Local API | 
              <span className="text-green-600 mx-2">Green: Call Buying</span> | 
              <span className="text-blue-500 mx-2">Blue: Put Buying</span> | 
              <span className="text-red-500">Red: Selling Activity</span>
            </p>
          </div>
        </div>
      )}

      {activeTab === "futures" && <FIIIndexFutChart />}
      {activeTab === "oi" && (
        <>
          <FIIOIIndexFutChart />
          <FIIOIIndexOptChart />
        </>
      )}
    </div>
  );
};

export default Fii_Dii_Fno;




















// import React, { useEffect, useState } from "react";
// import axios from "axios";
// import {
//   ComposedChart,
//   Bar,
//   Area,
//   XAxis,
//   YAxis,
//   CartesianGrid,
//   Tooltip,
//   Legend,
//   ResponsiveContainer,
//   Cell,
//   ReferenceLine
// } from "recharts";
// import FIIIndexFutChart from "../../Fii_Dii/Fii_Index/Fii_Index_Fut";
// import FIIOIIndexFutChart from "../../Fii_Dii/Fii_OI_Index/Fii_OI_Index_Fut";
// import FIIOIIndexOptChart from "../../Fii_Dii/Fii_OI_Index/Fii_OI_Index_Opt";

// interface FIIData {
//   Date: string;
//   FII_Call_Change: number;
//   FII_Put_Change: number;
//   NIFTY_Value: number;
// }

// interface ChartData {
//   date: string;
//   callChange: number;
//   putChange: number;
//   niftyValue: number;
//   month: string;
// }

// const monthNames = [
//   "January", "February", "March", "April", "May", "June",
//   "July", "August", "September", "October", "November", "December"
// ];



// const Fii_Dii_Fno: React.FC = () => {
//   const [data, setData] = useState<ChartData[]>([]);
//   const [filteredData, setFilteredData] = useState<ChartData[]>([]);
//   const [selectedMonth, setSelectedMonth] = useState<string>("");
//   const [months, setMonths] = useState<string[]>([]);
//   const [niftyRange, setNiftyRange] = useState<{ min: number; max: number }>({ min: 22000, max: 23600 });

//   useEffect(() => {
//     axios
//       .get<FIIData[]>("https://api.upholictech.com/api/data")
//       .then((response) => {
//         const formattedData = response.data.map((item) => {
//           const dateObj = new Date(item.Date);
//           const month = monthNames[dateObj.getMonth()];
//           return {
//             date: item.Date,
//             callChange: item.FII_Call_Change,
//             putChange: item.FII_Put_Change,
//             niftyValue: item.NIFTY_Value,
//             month: month,
//           };
//         });

//         const uniqueMonths = Array.from(new Set(formattedData.map(d => d.month)));
//         const niftyValues = formattedData.map(d => d.niftyValue);
        
//         setData(formattedData);
//         setMonths(uniqueMonths);
//         setSelectedMonth(uniqueMonths[0] || "");
//         setNiftyRange({
//           min: Math.min(...niftyValues) * 0.995,
//           max: Math.max(...niftyValues) * 1.005
//         });
//       })
//       .catch(error => console.error("Error fetching data:", error));
//   }, []);

//   useEffect(() => {
//     const filtered = data.filter(item => item.month === selectedMonth);
//     setFilteredData(filtered);
//   }, [selectedMonth, data]);

//   return (
//     <div style={{ 
//       width: "100%", 
//       paddingBottom: "20px",
//       backgroundColor: "#f8f9fa",
//       borderRadius: "10px",
//       boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
//       padding: "20px"
//     }}>
//       <div style={{ 
//         marginBottom: "20px", 
//         textAlign: "center",
//         display: "flex",
//         flexDirection: "column",
//         alignItems: "center"
//       }}>
//         <h2 style={{ 
//           color: "#343a40", 
//           marginBottom: "15px",
//           fontSize: "1.5rem",
//           fontWeight: "600"
//         }}>
//           FII Activity in Index Options
//         </h2>
//         <div style={{ 
//           display: "flex", 
//           flexWrap: "wrap", 
//           justifyContent: "center",
//           gap: "8px"
//         }}>
//           {months.map(month => (
//             <button
//               key={month}
//               onClick={() => setSelectedMonth(month)}
//               style={{
//                 padding: "8px 16px",
//                 borderRadius: "20px",
//                 backgroundColor: selectedMonth === month ? "#495057" : "#e9ecef",
//                 color: selectedMonth === month ? "white" : "#495057",
//                 border: "none",
//                 cursor: "pointer",
//                 fontWeight: "500",
//                 transition: "all 0.2s ease",
//                 boxShadow: selectedMonth === month ? "0 2px 4px rgba(0,0,0,0.1)" : "none"
//               }}
//             >
//               {month}
//             </button>
//           ))}
//         </div>
//       </div>
      
//       <div style={{ 
//         height: "500px",
//         width: "100%",
//         maxWidth: "1200px",
//         margin: "0 auto 30px",
//         backgroundColor: "white",
//         borderRadius: "8px",
//         padding: "15px",
//         boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
//       }}>
//         <ResponsiveContainer width="100%" height="100%">
//           <ComposedChart 
//             data={filteredData} 
//             margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
//           >
//             <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
//             <XAxis 
//               dataKey="date" 
//               tick={{ fontSize: 12, fill: "#6c757d" }}
//               tickMargin={10}
//             />
//             <YAxis 
//               yAxisId="left" 
//               domain={[niftyRange.min, niftyRange.max]}
//               tick={{ fontSize: 12, fill: "#6c757d" }}
//               label={{ 
//                 value: "NIFTY Value", 
//                 angle: -90, 
//                 position: "insideLeft",
//                 fontSize: 12,
//                 fill: "#495057"
//               }} 
//             />
//             <YAxis 
//               yAxisId="right" 
//               orientation="right" 
//               tick={{ fontSize: 12, fill: "#6c757d" }}
//               label={{ 
//                 value: "FII Activity", 
//                 angle: -90, 
//                 position: "insideRight",
//                 fontSize: 12,
//                 fill: "#495057"
//               }} 
//             />
//             <ReferenceLine yAxisId="right" y={0} stroke="#495057" strokeDasharray="3 3" />
//             <Tooltip 
//               contentStyle={{
//                 backgroundColor: "rgba(255,255,255,0.98)",
//                 border: "1px solid #dee2e6",
//                 borderRadius: "6px",
//                 boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
//                 fontSize: "12px"
//               }}
//               formatter={(value, name) => {
//                 if (name === "FII Call Change" || name === "FII Put Change") {
//                   return [value.toLocaleString(), name];
//                 }
//                 return [value, name];
//               }}
//             />
//             <Legend 
//               wrapperStyle={{
//                 paddingTop: "20px",
//                 fontSize: "12px"
//               }}
//             />
//             <Bar 
//               yAxisId="right" 
//               dataKey="callChange" 
//               name="FII Call Change"
//               barSize={20}
//             >
//               {filteredData.map((entry, index) => (
//                 <Cell 
//                   key={`call-${index}`} 
//                   fill={entry.callChange < 0 ? "#ff8787" : "#51cf66"} 
//                 />
//               ))}
//             </Bar>
//             <Bar 
//               yAxisId="right" 
//               dataKey="putChange" 
//               name="FII Put Change"
//               barSize={20}
//             >
//               {filteredData.map((entry, index) => (
//                 <Cell 
//                   key={`put-${index}`} 
//                   fill={entry.putChange < 0 ? "#ff8787" : "#51cf66"} 
//                 />
//               ))}
//             </Bar>
//             <Area 
//               yAxisId="left" 
//               type="monotone" 
//               dataKey="niftyValue" 
//               fill="#748ffc" 
//               stroke="#4263eb" 
//               name="NIFTY" 
//               fillOpacity={0.15}
//               strokeWidth={2}
//               activeDot={{ r: 6, strokeWidth: 0 }}
//             />
//           </ComposedChart>
//         </ResponsiveContainer>
//       </div>

//       <FIIIndexFutChart/>
//       <FIIOIIndexFutChart/>
//       <FIIOIIndexOptChart/>
//     </div>
//   );
// };



// export default Fii_Dii_Fno;