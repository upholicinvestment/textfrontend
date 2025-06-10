import React, { useEffect, useState } from "react";
import {
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  Area,
  CartesianGrid,
  ReferenceLine
} from "recharts";
import axios from "axios";

interface InvestmentData {
  date: string;
  month: string;
  year: number;
  FII: number;
  DII: number;
}

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
          "http://localhost:8000/api/fii-dii-data"
        );
        setData(response.data);
        setFilteredData(response.data);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const monthOrder = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];

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

  if (loading) return <p>Loading chart...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  return (
    <div
      style={{
        width: "100%",
        height: 500,
        textAlign: "center",
        maxWidth: "1200px",
        margin: "0 auto",
        backgroundColor: "#f8f9fa",
        padding: "20px",
        borderRadius: "10px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
      }}
    >
      <h2 style={{ 
        color: "#343a40", 
        marginBottom: "20px",
        fontSize: "1.5rem",
        fontWeight: "600"
      }}>
        FII/DII Investment Trends
      </h2>

      <div style={{ 
        marginBottom: "20px",
        display: "flex",
        justifyContent: "center",
        gap: "20px"
      }}>
        <div>
          <label style={{ marginRight: "10px", fontWeight: "500" }}>Year: </label>
          <select
            value={selectedYear}
            onChange={(e) => {
              setSelectedYear(e.target.value === "All" ? "All" : Number(e.target.value));
              setSelectedMonth("All");
            }}
            style={{
              padding: "8px 12px",
              borderRadius: "6px",
              border: "1px solid #ced4da",
              backgroundColor: "white",
              cursor: "pointer"
            }}
          >
            <option value="All">All Years</option>
            {uniqueYears.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>

        {selectedYear !== "All" && (
          <div>
            <label style={{ marginRight: "10px", fontWeight: "500" }}>Month: </label>
            <select 
              value={selectedMonth} 
              onChange={(e) => setSelectedMonth(e.target.value)}
              style={{
                padding: "8px 12px",
                borderRadius: "6px",
                border: "1px solid #ced4da",
                backgroundColor: "white",
                cursor: "pointer"
              }}
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

      <ResponsiveContainer width="100%" height={400}>
        <ComposedChart
          data={filteredData}
          margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
          <XAxis
            dataKey={
              selectedYear === "All"
                ? "year"
                : selectedMonth === "All"
                ? "month"
                : "date"
            }
            tick={{ fontSize: 12, fill: "#6c757d" }}
          />
          <YAxis 
            tick={{ fontSize: 12, fill: "#6c757d" }}
            tickFormatter={(value) => Math.round(value).toString()}
            label={{ 
              value: "Investment (₹ Cr)", 
              angle: -90, 
              position: "insideLeft",
              fontSize: 12,
              fill: "#495057"
            }} 
          />
          <ReferenceLine y={0} stroke="#495057" strokeDasharray="3 3" />
          <Tooltip 
            formatter={(value: any) => Math.round(value)}
            contentStyle={{
              backgroundColor: "rgba(255,255,255,0.98)",
              border: "1px solid #dee2e6",
              borderRadius: "6px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              fontSize: "12px"
            }}
          />
          <Legend 
            wrapperStyle={{
              paddingTop: "20px",
              fontSize: "12px"
            }}
          />
          <Bar dataKey="FII" fill="#4ecdc4" name="FII Investment" />
          <Bar dataKey="DII" fill="#ff6b6b" name="DII Investment" />
          <Area
            type="monotone"
            dataKey="FII"
            fill="#4ecdc4"
            stroke="#2b8a8a"
            fillOpacity={0.1}
            strokeWidth={2}
            activeDot={{ r: 6, strokeWidth: 0 }}
          />
          <Area
            type="monotone"
            dataKey="DII"
            fill="#ff6b6b"
            stroke="#c92a2a"
            fillOpacity={0.1}
            strokeWidth={2}
            activeDot={{ r: 6, strokeWidth: 0 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

export default Fii_Dii_Graph;