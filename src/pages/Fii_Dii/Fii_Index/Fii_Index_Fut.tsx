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

interface FIIData {
  Date: string;
  FII_Index_Futures: number;
  NIFTY_Value: number;
}

interface ChartData {
  date: string;
  callChange: number;
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

const Fii_Index_Fut: React.FC = () => {
  const [data, setData] = useState<ChartData[]>([]);
  const [filteredData, setFilteredData] = useState<ChartData[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [months, setMonths] = useState<string[]>([]);
  const [niftyRange, setNiftyRange] = useState<{ min: number; max: number }>({ min: 0, max: 0 });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get<FIIData[]>("http://localhost:8000/api/FII_Index_Fut/data");
        
        const formattedData = response.data.map((item) => {
          const dateObj = new Date(item.Date);
          return {
            date: item.Date,
            callChange: item.FII_Index_Futures,
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
    if (name === "FII Index Futures") {
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
        <p className="text-gray-600">Loading FII Futures data...</p>
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
    <div className="w-full max-w-6xl mx-auto p-4 md:p-6">
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-indigo-700 to-blue-600 p-6 text-white">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">FII Index Futures Activity</h1>
          <p className="text-blue-100">
            Foreign Institutional Investors' positions in Index Futures vs NIFTY 50 performance
          </p>
        </div>

        {/* Month Selector */}
        <div className="p-4 border-b border-gray-100">
          <div className="flex flex-wrap gap-2 justify-center">
            {months.map(month => (
              <button
                key={month}
                onClick={() => setSelectedMonth(month)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
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

        {/* Chart Container */}
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
                  name="FII Index Futures"
                  barSize={24}
                  radius={[4, 4, 0, 0]}
                >
                  {filteredData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.callChange < 0 ? "#ef4444" : "#10b981"} 
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

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-3 text-center text-sm text-gray-500 border-t border-gray-200">
          <p>
            Data source: Local API | 
            <span className="text-green-600 mx-2">Green: Long Positions</span> | 
            <span className="text-red-500">Red: Short Positions</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Fii_Index_Fut;