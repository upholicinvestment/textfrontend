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
import ClientIndexFutChart from "../../Fii_Dii/Client_Index/Client_Index_Fut";
import ClientOIIndexFutChart from "../../Fii_Dii/Client_OI_Index/Client_OI_Index_Fut";
import ClientOIIndexOptChart from "../../Fii_Dii/Client_OI_Index/Client_OI_Index_Opt";

interface FIIData {
  Date: string;
  Client_Call_Change: number;
  Client_Put_Change: number;
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

const TABS = [
  { key: "options", label: "Index Options" },
  { key: "futures", label: "Index Futures" },
  { key: "oi", label: "Open Interest" },
];

const Client_Index_Opt: React.FC = () => {
  const [data, setData] = useState<ChartData[]>([]);
  const [filteredData, setFilteredData] = useState<ChartData[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [months, setMonths] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<"options" | "futures" | "oi">("options");

  useEffect(() => {
    axios
      .get<FIIData[]>("https://api.upholictech.com/api/Client_Index_Opt/data")
      .then((response) => {
        const formattedData = response.data.map((item) => {
          const dateObj = new Date(item.Date);
          const month = monthNames[dateObj.getMonth()];
          return {
            date: item.Date,
            callChange: item.Client_Call_Change,
            putChange: item.Client_Put_Change,
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
    <div className="w-full max-w-7xl mx-auto p-4 space-y-6">
      {/* Dashboard Header */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-700 to-blue-600 p-6 text-white">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Client Derivatives Activity Dashboard</h1>
          <p className="text-blue-100">
            Track daily client buy/sell activity in Derivatives (Options, Futures, OI)
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="flex border-b border-gray-200">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-6 py-3 font-medium text-sm md:text-base transition-colors ${
                activeTab === tab.key
                  ? "text-indigo-600 border-b-2 border-indigo-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      {activeTab === "options" && (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex flex-wrap justify-between items-center gap-4">
            <h2 className="text-xl font-semibold text-gray-800">Client Index Options Activity</h2>
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
                  <CartesianGrid strokeDasharray="3 3" stroke="#e3e6f0" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12, fill: "#5a5c69" }}
                    tickFormatter={(value) => {
                      const date = new Date(value);
                      return `${date.getDate()} ${monthNames[date.getMonth()].substring(0, 3)}`;
                    }}
                  />
                  <YAxis
                    yAxisId="left"
                    domain={['auto', 'auto']}
                    tick={{ fontSize: 12, fill: "#5a5c69" }}
                    label={{
                      value: "NIFTY Value",
                      angle: -90,
                      position: "insideLeft",
                      style: { fill: "#5a5c69", fontWeight: 700 },
                      fontSize: 13,
                      offset: -4
                    }}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tick={{ fontSize: 12, fill: "#5a5c69" }}
                    label={{
                      value: "Client Activity (₹ Lakhs)",
                      angle: -90,
                      position: "insideRight",
                      style: { fill: "#5a5c69", fontWeight: 700 },
                      fontSize: 13,
                      offset: 0
                    }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#fff",
                      border: "1px solid #e3e6f0",
                      borderRadius: "8px",
                      boxShadow: "0 2px 8px rgba(99,102,241,0.07)",
                      fontSize: "13px"
                    }}
                    formatter={(value, name) => {
                      if (name === "NIFTY") return [value, name];
                      return [(Number(value) / 100000).toFixed(2) + "L", name];
                    }}
                    labelFormatter={(label) => {
                      const date = new Date(label);
                      return `${date.getDate()} ${monthNames[date.getMonth()]}`;
                    }}
                  />
                  <Legend
                    wrapperStyle={{
                      paddingTop: "20px",
                      fontSize: "14px"
                    }}
                  />
                  <Bar
                    yAxisId="right"
                    dataKey="callChange"
                    name="Client Call Change"
                    fill="#10b981"
                    radius={[5, 5, 0, 0]}
                  />
                  <Bar
                    yAxisId="right"
                    dataKey="putChange"
                    name="Client Put Change"
                    fill="#ef4444"
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

          <div className="bg-gray-50 px-6 py-3 text-center text-sm text-gray-500 border-t border-gray-200">
            <p>
              Data source: Local API | 
              <span className="text-green-600 mx-2">Green: Call Buying</span> | 
              <span className="text-red-500 mx-2">Red: Put Buying</span>
            </p>
          </div>
        </div>
      )}

      {activeTab === "futures" && <ClientIndexFutChart />}
      {activeTab === "oi" && (
        <div>
          <ClientOIIndexFutChart />
          <br />
          <ClientOIIndexOptChart />
        </div>
      )}
    </div>
  );
};

export default Client_Index_Opt;
