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



const Client_Index_Opt: React.FC = () => {
  const [data, setData] = useState<ChartData[]>([]);
  const [filteredData, setFilteredData] = useState<ChartData[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [months, setMonths] = useState<string[]>([]);

  useEffect(() => {
    axios
      .get<FIIData[]>("https://www.upholictech.com/api/Client_Index_Opt/data")
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
    <div style={{ 
      width: "100%", 
      maxWidth: "1200px",
      margin: "0 auto",
      padding: "20px 0"
    }}>
      <div style={{ 
        marginBottom: "20px", 
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        alignItems: "center"
      }}>
        <h4 style={{ marginBottom: "15px" }}>Daily Client Buy/Sell in Index Options</h4>
        <div style={{ 
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: "8px"
        }}>
          {months.map((month) => (
            <button
              key={month}
              onClick={() => setSelectedMonth(month)}
              style={{
                padding: "8px 16px",
                borderRadius: "8px",
                backgroundColor: selectedMonth === month ? "#4e73df" : "#f8f9fc",
                color: selectedMonth === month ? "white" : "#5a5c69",
                border: "none",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: selectedMonth === month ? "600" : "400",
                transition: "all 0.2s ease",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
              }}
            >
              {month}
            </button>
          ))}
        </div>
      </div>
      
      <div style={{ 
        height: "500px",
        width: "100%",
        backgroundColor: "#fff",
        borderRadius: "8px",
        boxShadow: "0 0.15rem 1.75rem 0 rgba(58, 59, 69, 0.15)",
        marginBottom: "30px",
        padding: "20px"
      }}>
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
                style: { fill: "#5a5c69" }
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
                style: { fill: "#5a5c69" }
              }}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: "#fff",
                border: "1px solid #e3e6f0",
                borderRadius: "0.35rem",
                boxShadow: "0 0.15rem 1.75rem 0 rgba(58, 59, 69, 0.15)"
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
              fill="#1cc88a"
              radius={[4, 4, 0, 0]}
            />
            <Bar 
              yAxisId="right" 
              dataKey="putChange" 
              name="Client Put Change" 
              fill="#e74a3b"
              radius={[4, 4, 0, 0]}
            />
            <Area 
              yAxisId="left" 
              type="monotone" 
              dataKey="niftyValue" 
              fill="rgba(78, 115, 223, 0.1)" 
              stroke="#4e73df" 
              strokeWidth={2} 
              name="NIFTY" 
              dot={{ r: 3 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div style={{ marginTop: "30px" }}>
        <ClientIndexFutChart/>
        <br/>
        <ClientOIIndexFutChart/>
        <br/>
        <ClientOIIndexOptChart/>
      </div>
    </div>
  );
};

export default Client_Index_Opt;