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
  TooltipProps,
} from "recharts";

// ----- Custom Tooltip Component -----
const CustomTooltip: React.FC<TooltipProps<number, string>> = ({
  active,
  payload,
  label,
}) => {
  if (active && payload && payload.length) {
    const seen: { [key: string]: boolean } = {};
    const uniquePayload = payload.filter((item) => {
      if (!item.name || seen[item.name]) return false;
      seen[item.name] = true;
      return true;
    });
    return (
      <div
        style={{
          background: "white",
          border: "1px solid #e5e7eb",
          borderRadius: 8,
          padding: 12,
          fontSize: 13,
          boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
          minWidth: 120
        }}
      >
        <p style={{ marginBottom: 8, fontWeight: 600, color: "#312e81" }}>{label}</p>
        {uniquePayload.map((item) => (
          <div key={item.name} style={{ color: item.color, fontWeight: 500, marginBottom: 2 }}>
            {item.name}: <span style={{ fontWeight: 600 }}>{Math.round(item.value as number).toLocaleString("en-IN")}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

interface InvestmentData {
  date: string;
  month: string;
  year: number;
  FII: number;
  DII: number;
}

const monthOrder = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

const Fii_Dii_Graph: React.FC = () => {
  const [data, setData] = useState<InvestmentData[]>([]);
  const [filteredData, setFilteredData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | "All">("All");
  const [selectedMonth, setSelectedMonth] = useState<string | "All">("All");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get<InvestmentData[]>(
          "https://api.upholictech.com/api/fii-dii-data"
        );
        setData(response.data);
        setFilteredData(response.data);
      } catch (err) {
        setError("Failed to load data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getAggregatedData = () => {
    if (selectedYear === "All" && selectedMonth === "All") {
      const yearlyData = data.reduce((acc, item) => {
        const existing = acc.find((d) => d.year === item.year);
        if (existing) {
          existing.FII += item.FII;
          existing.DII += item.DII;
        } else {
          acc.push({ year: item.year, FII: item.FII, DII: item.DII });
        }
        return acc;
      }, [] as { year: number; FII: number; DII: number }[]);
      return yearlyData.sort((a, b) => a.year - b.year).map((d) => ({
        ...d,
        FII: parseFloat(d.FII.toFixed(2)),
        DII: parseFloat(d.DII.toFixed(2)),
      }));
    }
    if (selectedYear !== "All" && selectedMonth === "All") {
      const monthlyData = data
        .filter((item) => item.year === selectedYear)
        .reduce((acc, item) => {
          const existing = acc.find((d) => d.month === item.month);
          if (existing) {
            existing.FII += item.FII;
            existing.DII += item.DII;
          } else {
            acc.push({ month: item.month, FII: item.FII, DII: item.DII });
          }
          return acc;
        }, [] as { month: string; FII: number; DII: number }[]);
      return monthlyData
        .sort((a, b) => monthOrder.indexOf(a.month) - monthOrder.indexOf(b.month))
        .map((d) => ({
          ...d,
          FII: parseFloat(d.FII.toFixed(2)),
          DII: parseFloat(d.DII.toFixed(2)),
        }));
    }
    return data
      .filter(
        (item) =>
          (selectedYear === "All" || item.year === selectedYear) &&
          (selectedMonth === "All" || item.month === selectedMonth)
      )
      .map((d) => ({
        ...d,
        FII: parseFloat(d.FII.toFixed(2)),
        DII: parseFloat(d.DII.toFixed(2)),
      }));
  };

  useEffect(() => {
    setFilteredData(getAggregatedData());
  }, [selectedYear, selectedMonth, data]);

  const uniqueYears = [...new Set(data.map((item) => item.year))].sort((a, b) => b - a);
  const filteredMonths =
    selectedYear !== "All"
      ? Array.from(
          new Set(data.filter((item) => item.year === selectedYear).map((item) => item.month)))
      : [];
  const sortedMonths = filteredMonths.sort(
    (a, b) => monthOrder.indexOf(a) - monthOrder.indexOf(b)
  );
  const uniqueMonths = ["All", ...sortedMonths];

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
        <p className="text-gray-600">Loading FII/DII data...</p>
      </div>
    );

  if (error)
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

  return (
    <div className="w-full max-w-6xl mx-auto p-4">
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-indigo-700 to-blue-600 p-6 text-white">
          <h1 className="text-2xl font-bold mb-1">FII/DII Investment Trends</h1>
          <p className="text-blue-100">Yearly, monthly and daily investments of FII and DII</p>
        </div>

        {/* Year/Month Selector */}
        <div className="p-4 border-b border-gray-100">
          <div className="flex flex-wrap gap-4 items-center justify-center">
            {/* Year Selector */}
            <div className="flex items-center gap-2">
              <label htmlFor="year-select" className="text-sm font-medium text-gray-700">
                Year:
              </label>
              <select
                id="year-select"
                value={selectedYear}
                onChange={(e) => {
                  setSelectedYear(e.target.value === "All" ? "All" : Number(e.target.value));
                  setSelectedMonth("All");
                }}
                className="px-3 py-2 rounded-md border border-gray-200 shadow-sm text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                style={{ minWidth: 110 }}
              >
                <option value="All">All Years</option>
                {uniqueYears.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>

            {/* Month Selector */}
            {selectedYear !== "All" && (
              <div className="flex items-center gap-2">
                <label htmlFor="month-select" className="text-sm font-medium text-gray-700">
                  Month:
                </label>
                <select
                  id="month-select"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="px-3 py-2 rounded-md border border-gray-200 shadow-sm text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                  style={{ minWidth: 110 }}
                >
                  {uniqueMonths.map((month) => (
                    <option key={month} value={month}>
                      {month}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Chart Container */}
        <div className="p-4 md:p-6">
          <div className="h-[500px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={filteredData}
                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
                <XAxis
                  dataKey={
                    selectedYear === "All"
                      ? "year"
                      : selectedMonth === "All"
                      ? "month"
                      : "date"
                  }
                  tick={{ fontSize: 12, fill: "#6b7280" }}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: "#6b7280" }}
                  tickFormatter={(value) => Math.round(value).toLocaleString("en-IN")}
                  label={{
                    value: "Investment (₹ Cr)",
                    angle: -90,
                    position: "insideLeft",
                    fontSize: 12,
                    fill: "#374151"
                  }}
                />
                <ReferenceLine y={0} stroke="#374151" strokeDasharray="3 3" />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{
                    paddingTop: "20px",
                    fontSize: "13px"
                  }}
                />
                <Bar
                  dataKey="FII"
                  fill="#6366f1"
                  name="FII Investment"
                  barSize={24}
                  radius={[6, 6, 0, 0]}
                />
                <Bar
                  dataKey="DII"
                  fill="#f59e42"
                  name="DII Investment"
                  barSize={24}
                  radius={[6, 6, 0, 0]}
                />
                <Area
                  type="monotone"
                  dataKey="FII"
                  fill="#6366f1"
                  stroke="#4f46e5"
                  fillOpacity={0.1}
                  strokeWidth={2}
                  activeDot={{ r: 6, fill: "#6366f1", strokeWidth: 0 }}
                  name="FII Investment"
                  legendType="none"
                />
                <Area
                  type="monotone"
                  dataKey="DII"
                  fill="#f59e42"
                  stroke="#c07a27"
                  fillOpacity={0.08}
                  strokeWidth={2}
                  activeDot={{ r: 6, fill: "#f59e42", strokeWidth: 0 }}
                  name="DII Investment"
                  legendType="none"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Fii_Dii_Graph;