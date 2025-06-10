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
  DII_Index_Futures: number;
  NIFTY_Value: number;
}

interface ChartData {
  date: string;
  callChange: number;
  niftyValue: number;
  month: string;
}

const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const Dii_Index_Fut: React.FC = () => {
  const [data, setData] = useState<ChartData[]>([]);
  const [filteredData, setFilteredData] = useState<ChartData[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>("February");
  const [months, setMonths] = useState<string[]>([]);

  useEffect(() => {
    axios
      .get<FIIData[]>("https://api.upholictech.com/api/DII_Index_Fut/data")
      .then((response) => {
        const formattedData = response.data.map((item) => {
          const dateObj = new Date(item.Date);
          const month = monthNames[dateObj.getMonth()];
          return {
            date: item.Date,
            callChange: item.DII_Index_Futures,
            niftyValue: item.NIFTY_Value,
            month: month,
          };
        });

        const uniqueMonths = Array.from(
          new Set(formattedData.map((d) => d.month))
        );

        setData(formattedData);
        setMonths(uniqueMonths);
        setSelectedMonth(uniqueMonths[0]);
      })
      .catch((error) => console.error("Error fetching data:", error));
  }, []);

  useEffect(() => {
    const filtered = data.filter((item) => item.month === selectedMonth);
    setFilteredData(filtered);
  }, [selectedMonth, data]);

  return (
    <div style={{ width: "100%", height: "500px", justifyContent: "center", paddingBottom: '100px' }}>
      <br />
      <div style={{ marginBottom: "10px", textAlign: "center" }}>
        <h4>Daily DII Buy/Sell in Index Futures</h4>
        {months.map((month) => (
          <button
            key={month}
            onClick={() => setSelectedMonth(month)}
            style={{
              padding: "8px 16px",
              borderRadius: "8px",
              backgroundColor: selectedMonth === month ? "#007bff" : "#e0e0e0",
              color: selectedMonth === month ? "white" : "black",
              border: "none",
              cursor: "pointer",
              margin: '3px'
            }}
          >
            {month}
          </button>
        ))}
      </div>

      <div style={{ height: "100%", width: '1200px', margin: '0 auto' }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={filteredData}
            margin={{ top: 20, right: 20, left: 20, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis
              yAxisId="left"
              domain={['dataMin - 100', 'dataMax + 100']}
              label={{ value: "NIFTY Value", angle: -90, position: "insideLeft" }}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              label={{ value: "DII Buy/Sell (₹ Cr)", angle: -90, position: "insideRight" }}
            />
            <Tooltip 
              formatter={(value, name) => {
                if (name === "NIFTY") {
                  return [value, "NIFTY Value"];
                }
                return [value, "DII Index Futures (₹ Cr)"];
              }}
            />
            <Legend />
            <Bar
              yAxisId="right"
              dataKey="callChange"
              name="DII Index Futures (₹ Cr)"
            >
              {filteredData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.callChange < 0 ? "#ef5350" : "#26a69a"} 
                  stroke={entry.callChange < 0 ? "#c62828" : "#00897b"}
                  strokeWidth={1}
                />
              ))}
            </Bar>
            <Area
              yAxisId="left"
              type="monotone"
              dataKey="niftyValue"
              fill="#7e57c2"
              stroke="#5e35b1"
              strokeWidth={2}
              fillOpacity={0.2}
              name="NIFTY"
              activeDot={{ r: 6 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default Dii_Index_Fut;