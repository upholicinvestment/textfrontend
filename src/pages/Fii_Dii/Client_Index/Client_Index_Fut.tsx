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
  Cell
} from "recharts";

interface FIIData {
  Date: string;
  Client_Index_Futures: number;
  NIFTY_Value: number;
}

interface ChartData {
  date: string;
  callChange: number;
  niftyValue: number;
  month: string;
}

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const Client_Index_Fut: React.FC = () => {
  const [data, setData] = useState<ChartData[]>([]);
  const [filteredData, setFilteredData] = useState<ChartData[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [months, setMonths] = useState<string[]>([]);

  useEffect(() => {
    axios
      .get<FIIData[]>("https://api.upholictech.com/api/Client_Index_Fut/data")
      .then((response) => {
        const formattedData = response.data.map((item) => {
          const dateObj = new Date(item.Date);
          const month = monthNames[dateObj.getMonth()];
          return {
            date: item.Date,
            callChange: item.Client_Index_Futures,
            niftyValue: item.NIFTY_Value,
            month: month,
          };
        });

        const uniqueMonths = Array.from(
          new Set(formattedData.map((d) => d.month))
        ).sort((a, b) => monthNames.indexOf(a) - monthNames.indexOf(b));

        setData(formattedData);
        setMonths(uniqueMonths);
        setSelectedMonth(uniqueMonths[0] || "");
      })
      .catch((error) => console.error("Error fetching data:", error));
  }, []);

  useEffect(() => {
    if (selectedMonth) {
      const filtered = data.filter((item) => item.month === selectedMonth);
      setFilteredData(filtered);
    }
  }, [selectedMonth, data]);

  return (
    <div className="w-full max-w-6xl mx-auto p-4">
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-indigo-700 to-blue-600 p-6 text-white">
          <h1 className="text-2xl font-bold mb-1">Daily Client Buy/Sell in Index Futures</h1>
          <p className="text-blue-100">
            Track daily client position changes in Index Futures vs NIFTY
          </p>
        </div>

        {/* Month Selector */}
        <div className="p-4 border-b border-gray-100">
          <div className="flex flex-wrap gap-2 justify-center">
            {months.map((month) => (
              <button
                key={month}
                onClick={() => setSelectedMonth(month)}
                className={`px-3 py-1.5 text-xs sm:px-4 sm:py-2 sm:text-sm font-medium transition-all rounded-full ${
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

        {/* Chart Section */}
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
                  // tickFormatter={(value) => {
                  //   const date = new Date(value);
                  //   return `${date.getDate()} ${monthNames[date.getMonth()].substring(0, 3)}`;
                  // }}
                />
                <YAxis
                  yAxisId="left"
                  domain={['auto', 'auto']}
                  tick={{ fontSize: 12, fill: "#6b7280" }}
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
                  label={{
                    value: "Client Activity",
                    angle: -90,
                    position: "insideRight",
                    fontSize: 12,
                    fill: "#6366f1",
                    offset: -10
                  }}
                />
                <Tooltip
                  contentStyle={{
                    background: "#fff",
                    border: "1px solid #e5e7eb",
                    borderRadius: "0.5rem",
                    boxShadow: "0 0.15rem 1.75rem 0 rgba(58,59,69,0.10)",
                    fontSize: 13,
                  }}
                  formatter={(value, name) => {
                    if (name === "NIFTY") return [value, name];
                    return [value, name];
                  }}
                  // labelFormatter={(label) => {
                  //   const date = new Date(label);
                  //   return `${date.getDate()} ${monthNames[date.getMonth()]}`;
                  // }}
                />
                <Legend
                  wrapperStyle={{
                    paddingTop: "20px",
                    fontSize: "14px",
                  }}
                />
                <Bar
                  yAxisId="right"
                  dataKey="callChange"
                  name="Client Index Futures"
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
                  strokeWidth={2}
                  name="NIFTY"
                  dot={{ r: 3 }}
                  fillOpacity={0.1}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-3 text-center text-sm text-gray-500 border-t border-gray-200">
          <p>
            Data source: Local API |
            <span className="text-green-600 mx-2">Green: Net Buying</span> |
            <span className="text-red-500">Red: Net Selling</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Client_Index_Fut;
