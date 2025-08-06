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
} from "recharts";

interface FIIData {
  Date: string;
  Client_Call_OI: number;
  Client_Put_OI: number;
  NIFTY_Value: number;
}

interface ChartData {
  date: string;
  callChange: number;
  putChange: number;
  niftyValue: number;
  month: string;
}

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const Client_OI_Index_Opt: React.FC = () => {
  const [data, setData] = useState<ChartData[]>([]);
  const [filteredData, setFilteredData] = useState<ChartData[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [months, setMonths] = useState<string[]>([]);

  useEffect(() => {
    axios
      .get<FIIData[]>("https://api.upholictech.com/api/OIClient_Index_Opt/data")
      .then((response) => {
        const formattedData = response.data.map((item) => {
          const dateObj = new Date(item.Date);
          const month = monthNames[dateObj.getMonth()];
          return {
            date: item.Date,
            callChange: item.Client_Call_OI,
            putChange: item.Client_Put_OI,
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
    <div className="w-full max-w-5xl mx-auto p-4">
      {/* Header Card */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8">
        <div className="bg-gradient-to-r from-indigo-700 to-blue-600 p-6 text-white">
          <h1 className="text-2xl font-bold mb-1">Client Open Interest in Index Options</h1>
          <p className="text-blue-100">
            Daily Client OI activity in Index Options vs NIFTY performance
          </p>
        </div>
      </div>
      {/* Month Selector */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-6">
        <div className="p-4 flex flex-wrap gap-2 justify-center border-b border-gray-100">
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
      {/* Chart Card */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
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
                  tickMargin={10}
                />
                <YAxis
                  yAxisId="left"
                  domain={[22000, 23600]}
                  ticks={[22000, 22500, 23000, 23500]}
                  tick={{ fontSize: 12, fill: "#6b7280" }}
                  label={{
                    value: "NIFTY Value",
                    angle: -90,
                    position: "insideLeft",
                    fontSize: 12,
                    fill: "#374151",
                    offset: -10,
                  }}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fontSize: 12, fill: "#6b7280" }}
                  label={{
                    value: "Client OI (Lakhs)",
                    angle: -90,
                    position: "insideRight",
                    fontSize: 12,
                    fill: "#374151",
                    offset: -10,
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
                  formatter={(value, name) => {
                    if (name === "NIFTY") return [value, name];
                    return [(Number(value) / 100000).toFixed(2) + "L", name];
                  }}
                  // labelFormatter={(label) => {
                  //   const date = new Date(label);
                  //   return `${date.getDate()} ${monthNames[date.getMonth()]}`;
                  // }}
                />
                <Legend
                  wrapperStyle={{ paddingTop: "20px", fontSize: "14px" }}
                />
                <Bar
                  yAxisId="right"
                  dataKey="callChange"
                  fill="#10b981"
                  name="Client Call OI"
                  radius={[5, 5, 0, 0]}
                />
                <Bar
                  yAxisId="right"
                  dataKey="putChange"
                  fill="#ef4444"
                  name="Client Put OI"
                  radius={[5, 5, 0, 0]}
                />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="niftyValue"
                  fill="rgba(99, 102, 241, 0.11)"
                  stroke="#6366f1"
                  strokeWidth={2}
                  name="NIFTY"
                  dot={{ r: 4 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
        {/* Footer */}
        <div className="bg-gray-50 px-6 py-3 text-center text-sm text-gray-500 border-t border-gray-200">
          <p>
            Data source: Local API | 
            <span className="text-green-600 mx-2">Green: Call OI</span> | 
            <span className="text-red-500 mx-2">Red: Put OI</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Client_OI_Index_Opt;
