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
  Client_Futures_OI: number;
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
  "July", "August", "September", "October", "November", "December"
];

const Client_OI_Index_Fut: React.FC = () => {
  const [data, setData] = useState<ChartData[]>([]);
  const [filteredData, setFilteredData] = useState<ChartData[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [months, setMonths] = useState<string[]>([]);
  const [avgNifty, setAvgNifty] = useState<number>(0);

  useEffect(() => {
    axios
      .get<FIIData[]>("https://api.upholictech.com/api/OIClient_Index_Fut/data")
      .then((response) => {
        const formattedData = response.data.map((item) => {
          const dateObj = new Date(item.Date);
          const month = monthNames[dateObj.getMonth()];
          return {
            date: item.Date,
            callChange: item.Client_Futures_OI,
            niftyValue: item.NIFTY_Value,
            month: month,
          };
        });

        // Find the most recent date in the dataset
        const latest = formattedData.reduce((a, b) =>
          new Date(b.date) > new Date(a.date) ? b : a
        );
        const uniqueMonths = Array.from(new Set(formattedData.map((d) => d.month)));
        setData(formattedData);
        setMonths(uniqueMonths);
        // setSelectedMonth(uniqueMonths[0] || "");
        setSelectedMonth(latest?.month || uniqueMonths[uniqueMonths.length - 1] || "");
      })
      .catch((error) => console.error("Error fetching data:", error));
  }, []);

  useEffect(() => {
    if (selectedMonth && data.length > 0) {
      const filtered = data.filter((item) => item.month === selectedMonth);
      setFilteredData(filtered);

      // Calculate average NIFTY value for the selected month
      const average = filtered.reduce((sum, item) => sum + item.niftyValue, 0) / filtered.length;
      setAvgNifty(average);
    }
  }, [selectedMonth, data]);

  return (
    <div className="w-full max-w-5xl mx-auto p-4">
      {/* Header Card */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8">
        <div className="bg-gradient-to-r from-indigo-700 to-blue-600 p-6 text-white">
          <h1 className="text-2xl font-bold mb-1">Client OI in Index Futures</h1>
          <p className="text-blue-100">
            Daily Client Open Interest activity in Index Futures vs NIFTY performance
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
              <ComposedChart data={filteredData} margin={{ top: 20, right: 20, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12, fill: "#6b7280" }}
                  tickMargin={10}
                  // tickFormatter={(value) => {
                  //   const date = new Date(value);
                  //   return `${date.getDate()} ${monthNames[date.getMonth()].substring(0, 3)}`;
                  // }}
                />
                <YAxis
                  yAxisId="left"
                  domain={['dataMin - 100', 'dataMax + 100']}
                  tick={{ fontSize: 12, fill: "#6366f1" }}
                  label={{
                    value: "NIFTY Value",
                    angle: -90,
                    position: "insideLeft",
                    style: { fill: "#6366f1", fontWeight: 700 },
                    fontSize: 13,
                    offset: -4
                  }}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fontSize: 12, fill: "#10b981" }}
                  label={{
                    value: "Client OI",
                    angle: -90,
                    position: "insideRight",
                    style: { fill: "#10b981", fontWeight: 700 },
                    fontSize: 13,
                    offset: 0
                  }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    boxShadow: "0 2px 8px rgba(99,102,241,0.07)",
                    fontSize: "13px"
                  }}
                  formatter={(value, name) => {
                    if (name === "NIFTY") return [value, "NIFTY Value"];
                    if (name === "Client Futures OI") return [`${value.toLocaleString()}`, name];
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
                    fontSize: "14px"
                  }}
                  formatter={(value) => {
                    if (value === "NIFTY") return <span style={{ color: '#6366f1' }}>{value}</span>;
                    if (value === "Client Futures OI") return <span style={{ color: '#10b981' }}>{value}</span>;
                    return value;
                  }}
                />
                <ReferenceLine
                  yAxisId="left"
                  y={avgNifty}
                  stroke="#6366f1"
                  strokeDasharray="3 3"
                  label={{
                    value: `Avg: ${avgNifty.toFixed(2)}`,
                    position: 'right',
                    fill: '#6366f1',
                    fontSize: 12
                  }}
                />
                <Bar
                  yAxisId="right"
                  dataKey="callChange"
                  name="Client Futures OI"
                  radius={[5, 5, 0, 0]}
                >
                  {filteredData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.callChange < 0 ? "#ef4444" : "#10b981"}
                      stroke={entry.callChange < 0 ? "#b91c1c" : "#047857"}
                      strokeWidth={1}
                    />
                  ))}
                </Bar>
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="niftyValue"
                  name="NIFTY"
                  stroke="#6366f1"
                  strokeWidth={2}
                  fill="rgba(99,102,241,0.11)"
                  fillOpacity={0.4}
                  activeDot={{
                    r: 6,
                    stroke: '#6366f1',
                    strokeWidth: 2,
                    fill: '#fff'
                  }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
        {/* Footer */}
        <div className="bg-gray-50 px-6 py-3 text-center text-sm text-gray-500 border-t border-gray-200">
          <p>
            Data source: Local API | 
            <span className="text-green-600 mx-2">Green: Net Long</span> | 
            <span className="text-red-500 mx-2">Red: Net Short</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Client_OI_Index_Fut;
