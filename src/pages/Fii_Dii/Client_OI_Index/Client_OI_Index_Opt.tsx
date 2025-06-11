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


const Client_OI_Index_Opt: React.FC = () => {
  const [data, setData] = useState<ChartData[]>([]);
  const [filteredData, setFilteredData] = useState<ChartData[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [months, setMonths] = useState<string[]>([]);

  useEffect(() => {
    axios
      .get<FIIData[]>("https://www.upholictech.com/api/OIClient_Index_Opt/data")
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
    <div style={{ 
      width: "100%", 
      height: "500px", 
      paddingBottom: "100px",
      maxWidth: "1200px",
      margin: "0 auto"
    }}>
      <br />
      <div style={{ 
        marginBottom: "20px", 
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        alignItems: "center"
      }}>
        <h4>Client OI in Index Options</h4>
        <div style={{ 
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: "8px",
          marginTop: "10px"
        }}>
          {months.map((month) => (
            <button
              key={month}
              onClick={() => setSelectedMonth(month)}
              style={{
                padding: "8px 16px",
                borderRadius: "8px",
                backgroundColor: selectedMonth === month ? "#007bff" : "#f0f0f0",
                color: selectedMonth === month ? "white" : "#333",
                border: "none",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: selectedMonth === month ? "600" : "400",
                transition: "all 0.2s ease",
                boxShadow: selectedMonth === month 
                  ? "0 2px 5px rgba(0,0,0,0.2)" 
                  : "0 1px 3px rgba(0,0,0,0.1)"
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
        backgroundColor: "#fff",
        borderRadius: "8px",
        boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
        padding: "20px"
      }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart 
            data={filteredData} 
            margin={{ top: 20, right: 20, left: 20, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => {
                const date = new Date(value);
                return `${date.getDate()} ${monthNames[date.getMonth()].substring(0, 3)}`;
              }}
            />
            <YAxis 
              yAxisId="left" 
              domain={[22000, 23600]} 
              ticks={[22000, 22500, 23000, 23500]} 
              label={{ 
                value: "NIFTY Value", 
                angle: -90, 
                position: "insideLeft",
                style: { fill: "#888" }
              }} 
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              yAxisId="right" 
              orientation="right" 
              label={{ 
                value: "Client OI (Lakhs)", 
                angle: -90, 
                position: "insideRight",
                style: { fill: "#888" }
              }}
              tick={{ fontSize: 12 }}
            />
            <Tooltip 
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
              wrapperStyle={{ paddingTop: "20px" }}
            />
            <Bar 
              yAxisId="right" 
              dataKey="callChange" 
              fill="#4CAF50" 
              name="Client Call OI" 
              radius={[4, 4, 0, 0]}
            />
            <Bar 
              yAxisId="right" 
              dataKey="putChange" 
              fill="#F44336" 
              name="Client Put OI" 
              radius={[4, 4, 0, 0]}
            />
            <Area 
              yAxisId="left" 
              type="monotone" 
              dataKey="niftyValue" 
              fill="rgba(128, 0, 128, 0.1)" 
              stroke="#800080" 
              strokeWidth={2} 
              name="NIFTY" 
              dot={{ r: 3 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default Client_OI_Index_Opt;