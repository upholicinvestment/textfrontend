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
  DII_Call_OI: number;
  DII_Put_OI: number;
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


const Dii_OI_Index_Opt: React.FC = () => {
  const [data, setData] = useState<ChartData[]>([]);
  const [filteredData, setFilteredData] = useState<ChartData[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [months, setMonths] = useState<string[]>([]);

  useEffect(() => {
    axios
      .get<FIIData[]>("https://www.upholictech.com/api/OIDII_Index_Opt/data")
      .then((response) => {
        const formattedData = response.data.map((item) => {
          const dateObj = new Date(item.Date);
          const month = monthNames[dateObj.getMonth()];
          return {
            date: item.Date,
            callChange: item.DII_Call_OI,
            putChange: item.DII_Put_OI,
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
    if (selectedMonth) {
      const filtered = data.filter((item) => item.month === selectedMonth);
      setFilteredData(filtered);
    }
  }, [selectedMonth, data]);

  return (
    <div style={{ width: "100%", height: "500px", justifyContent: "center", paddingBottom: '100px' }}>
      <br />
      <div style={{ marginBottom: "10px", textAlign: "center" }}>
        <h4>DII OI in Index Options</h4>
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
              label={{ value: "DII Buy/Sell", angle: -90, position: "insideRight" }} 
            />
            <Tooltip />
            <Legend />
            <Bar 
              yAxisId="right" 
              dataKey="callChange" 
              fill="#4CAF50" 
              name="DII Call OI" 
            />
            <Bar 
              yAxisId="right" 
              dataKey="putChange" 
              fill="#F44336" 
              name="DII Put OI" 
            />
            <Area 
              yAxisId="left" 
              type="monotone" 
              dataKey="niftyValue" 
              fill="#9C27B0" 
              stroke="#7B1FA2" 
              strokeWidth={2} 
              fillOpacity={0.3} 
              name="NIFTY" 
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default Dii_OI_Index_Opt;