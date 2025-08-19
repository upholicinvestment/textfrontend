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
  ReferenceLine,
  Cell
} from "recharts";
import DIIIndexFutChart from "../../Fii_Dii/Dii_Index/Dii_Index_Fut";
import DIIOIIndexFutChart from "../../Fii_Dii/Dii_OI_Index/Dii_OI_Index_Fut";
import DIIOIIndexOptChart from "../../Fii_Dii/Dii_OI_Index/Dii_OI_Index_Opt";

interface FIIData {
  Date: string;
  DII_Call_Change: number;
  DII_Put_Change: number;
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

const Dii_Index_Opt: React.FC = () => {
  const [data, setData] = useState<ChartData[]>([]);
  const [filteredData, setFilteredData] = useState<ChartData[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [months, setMonths] = useState<string[]>([]);
  const [avgNifty, setAvgNifty] = useState<number>(0);
  // const [niftyRange, setNiftyRange] = useState<{ min: number; max: number }>({ min: 0, max: 0 });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"options" | "futures" | "oi">("options");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get<FIIData[]>("https://api.upholictech.com/api/DII_Index_Opt/data");
        
        const formattedData = response.data.map((item) => {
          const dateObj = new Date(item.Date);
          return {
            date: item.Date,
            callChange: item.DII_Call_Change,
            putChange: item.DII_Put_Change,
            niftyValue: item.NIFTY_Value,
            month: monthNames[dateObj.getMonth()],
            day: dateObj.getDate().toString(),
            weekday: weekdayNames[dateObj.getDay()]
          };
        });

        const uniqueMonths = Array.from(new Set(formattedData.map(d => d.month)));

        // Find the most recent date in the dataset
        const latest = formattedData.reduce((a, b) =>
          new Date(b.date) > new Date(a.date) ? b : a
        );
        setData(formattedData);
        setMonths(uniqueMonths);
        // setSelectedMonth(uniqueMonths[0] || "");
        setSelectedMonth(latest?.month || uniqueMonths[uniqueMonths.length - 1] || "");
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
    if (selectedMonth && data.length > 0) {
      const filtered = data.filter(item => item.month === selectedMonth);
      setFilteredData(filtered);
      
      const average = filtered.reduce((sum, item) => sum + item.niftyValue, 0) / filtered.length;
      setAvgNifty(average);

      // Calculate NIFTY range with 1% buffer
      // const niftyValues = filtered.map(item => item.niftyValue);
      // setNiftyRange({
      //   min: Math.min(...niftyValues) * 0.99,
      //   max: Math.max(...niftyValues) * 1.01
      // });
    }
  }, [selectedMonth, data]);

  const formatTooltipValue = (value: number, name: string) => {
    if (name.includes("DII")) {
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
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
        <p className="text-gray-600">Loading DII Options data...</p>
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
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
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
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">DII F&O Activity Dashboard</h1>
          <p className="text-blue-100">
            Comprehensive view of Domestic Institutional Investors' derivatives activity
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
                ? "text-blue-600 border-b-2 border-blue-600" 
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Index Options
          </button>
          <button
            onClick={() => setActiveTab("futures")}
            className={`px-6 py-3 font-medium text-sm md:text-base transition-colors ${
              activeTab === "futures" 
                ? "text-blue-600 border-b-2 border-blue-600" 
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Index Futures
          </button>
          <button
            onClick={() => setActiveTab("oi")}
            className={`px-6 py-3 font-medium text-sm md:text-base transition-colors ${
              activeTab === "oi" 
                ? "text-blue-600 border-b-2 border-blue-600" 
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
            <h2 className="text-xl font-semibold text-gray-800">DII Index Options Activity</h2>
            <div className="flex flex-wrap gap-2">
              {months.map(month => (
                <button
                  key={month}
                  onClick={() => setSelectedMonth(month)}
                  className={`px-3 py-1.5 text-xs sm:text-sm font-medium transition-all rounded-full ${
                    selectedMonth === month
                      ? "bg-blue-600 text-white shadow-md"
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
                    domain={['auto', 'auto']}
                    tick={{ fontSize: 12, fill: "#6b7280" }}
                    tickFormatter={(value) => value.toLocaleString("en-IN")}
                    label={{ 
                      value: "NIFTY Value", 
                      angle: -90, 
                      position: "insideLeft",
                      fontSize: 12,
                      fill: "#7b1fa2",
                      offset: -10
                    }} 
                  />
                  <YAxis 
                    yAxisId="right" 
                    orientation="right" 
                    tick={{ fontSize: 12, fill: "#6b7280" }}
                    tickFormatter={(value) => `₹${Math.abs(value).toLocaleString("en-IN")}`}
                    label={{ 
                      value: "DII Activity", 
                      angle: -90, 
                      position: "insideRight",
                      fontSize: 12,
                      fill: "#374151",
                      offset: -10
                    }} 
                  />
                  <ReferenceLine 
                    yAxisId="left" 
                    y={avgNifty} 
                    stroke="#7b1fa2" 
                    strokeDasharray="3 3" 
                    label={{
                      value: `Avg: ${avgNifty.toFixed(2)}`,
                      position: 'right',
                      fill: '#7b1fa2',
                      fontSize: 12
                    }}
                  />
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
                    name="DII Call Change"
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
                    name="DII Put Change"
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
                    fill="#e1bee7" 
                    stroke="#7b1fa2" 
                    name="NIFTY 50" 
                    fillOpacity={0.4}
                    strokeWidth={2}
                    activeDot={{ r: 6, fill: "#7b1fa2", strokeWidth: 0 }}
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

      {activeTab === "futures" && <DIIIndexFutChart />}
      {activeTab === "oi" && (
        <>
          <DIIOIIndexFutChart />
          <DIIOIIndexOptChart />
        </>
      )}
    </div>
  );
};

export default Dii_Index_Opt;