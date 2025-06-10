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
  Pro_Futures_OI: number;
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



const Pro_OI_Index_Fut: React.FC = () => {
  const [data, setData] = useState<ChartData[]>([]);
  const [filteredData, setFilteredData] = useState<ChartData[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [months, setMonths] = useState<string[]>([]);

  useEffect(() => {
    axios
      .get<FIIData[]>("http://localhost:8000/api/OIPro_Index_Fut/data")
      .then((response) => {
        const formattedData = response.data.map((item) => {
          const dateObj = new Date(item.Date);
          const month = monthNames[dateObj.getMonth()];
          return {
            date: item.Date,
            callChange: item.Pro_Futures_OI,
            niftyValue: item.NIFTY_Value,
            month: month,
          };
        });
        const uniqueMonths = Array.from(
          new Set(formattedData.map((d) => d.month))
        );

        setData(formattedData);
        setMonths(uniqueMonths);
        setSelectedMonth(uniqueMonths[0] || "");
      })
      .catch((error) => console.error("Error fetching data:", error));
  }, []);

  useEffect(() => {
    const filtered = data.filter((item) => item.month === selectedMonth);
    setFilteredData(filtered);
  }, [selectedMonth, data]);

  return (
    <div style={{ 
      width: "100%", 
      height: "500px", 
      justifyContent: "center",
      paddingBottom: "100px",
      backgroundColor: "#f5f5f5",
      borderRadius: "10px",
      boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
      padding: "20px"
    }}>
      <div style={{ 
        marginBottom: "20px", 
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        alignItems: "center"
      }}>
        <h2 style={{ color: "#333", marginBottom: "15px" }}>Professional Open Interest in Index Futures</h2>
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center" }}>
          {months.map((month) => (
            <button
              key={month}
              onClick={() => setSelectedMonth(month)}
              style={{
                padding: "8px 16px",
                borderRadius: "20px",
                backgroundColor: selectedMonth === month ? "#4CAF50" : "#e0e0e0",
                color: selectedMonth === month ? "white" : "#333",
                border: "none",
                cursor: "pointer",
                margin: "5px",
                fontWeight: "bold",
                transition: "all 0.3s ease",
                boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
              }}
            >
              {month}
            </button>
          ))}
        </div>
      </div>
      
      <div style={{ 
        height: "100%",
        width: "100%",
        maxWidth: "1200px",
        margin: "0 auto",
        marginBottom: "20px",
        backgroundColor: "white",
        borderRadius: "8px",
        padding: "15px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.05)"
      }}>
        <ResponsiveContainer width="100%" height={400}>
          <ComposedChart 
            data={filteredData} 
            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
            <XAxis 
              dataKey="date" 
              tick={{ fill: "#666" }}
              tickMargin={10}
            />
            <YAxis 
              yAxisId="left" 
              domain={['dataMin - 100', 'dataMax + 100']} 
              tick={{ fill: "#666" }}
              label={{ 
                value: "NIFTY Value", 
                angle: -90, 
                position: "insideLeft",
                fill: "#666"
              }} 
            />
            <YAxis 
              yAxisId="right" 
              orientation="right" 
              tick={{ fill: "#666" }}
              label={{ 
                value: "Pro OI (₹ Cr)", 
                angle: -90, 
                position: "insideRight",
                fill: "#666"
              }} 
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: "rgba(255,255,255,0.95)",
                border: "1px solid #ddd",
                borderRadius: "4px",
                boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
              }}
            />
            <Legend 
              wrapperStyle={{
                paddingTop: "20px"
              }}
            />
            <Bar 
              yAxisId="right" 
              dataKey="callChange" 
              name="Pro Futures OI"
              barSize={20}
            >
              {filteredData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.callChange < 0 ? "#FF6B6B" : "#4ECDC4"} 
                />
              ))}
            </Bar>
            <Area 
              yAxisId="left" 
              type="monotone" 
              dataKey="niftyValue" 
              fill="#8884d8" 
              stroke="#8884d8" 
              name="NIFTY" 
              fillOpacity={0.2}
              strokeWidth={2}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default Pro_OI_Index_Fut;