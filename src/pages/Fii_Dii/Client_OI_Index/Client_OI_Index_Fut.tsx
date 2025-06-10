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
      .get<FIIData[]>("http://localhost:8000/api/OIClient_Index_Fut/data")
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
        
        const uniqueMonths = Array.from(new Set(formattedData.map((d) => d.month)));
        setData(formattedData);
        setMonths(uniqueMonths);
        setSelectedMonth(uniqueMonths[0] || "");
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
    <div style={{ width: "100%", height: "500px", justifyContent: "center", paddingBottom: '100px' }}>
      <br />
      <div style={{ marginBottom: "10px", textAlign: "center" }}>
        <h4>Client OI in Index Futures</h4>
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
              margin: '3px',
              transition: 'all 0.3s ease'
            }}
          >
            {month}
          </button>
        ))}
      </div>
      
      <div style={{ height: "100%", width: '1200px', margin: '0 auto' }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={filteredData} margin={{ top: 20, right: 20, left: 20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12 }}
              tickMargin={10}
            />
            <YAxis 
              yAxisId="left" 
              domain={['dataMin - 100', 'dataMax + 100']} 
              label={{ 
                value: "NIFTY Value", 
                angle: -90, 
                position: "insideLeft",
                style: { fill: '#7b1fa2' }
              }} 
              tick={{ fill: '#7b1fa2' }}
            />
            <YAxis 
              yAxisId="right"  
              orientation="right" 
              label={{ 
                value: "Client OI (₹ Cr)", 
                angle: -90, 
                position: "insideRight",
                style: { fill: '#388e3c' }
              }}
              tick={{ fill: '#388e3c' }}
            />
            <Tooltip 
              formatter={(value, name) => {
                if (name === "NIFTY") return [value, "NIFTY Value"];
                if (name === "Client Futures OI") return [` ${value.toLocaleString()}`, name];
                return [value, name];
              }}
              labelFormatter={(label) => `Date: ${label}`}
              contentStyle={{
                backgroundColor: '#ffffff',
                border: '1px solid #e0e0e0',
                borderRadius: '4px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}
            />
            <Legend 
              wrapperStyle={{ paddingTop: '20px' }}
              formatter={(value) => {
                if (value === "NIFTY") return <span style={{ color: '#7b1fa2' }}>{value}</span>;
                if (value === "Client Futures OI") return <span style={{ color: '#388e3c' }}>{value}</span>;
                return value;
              }}
            />
            <ReferenceLine 
              yAxisId="left" 
              y={avgNifty} 
              stroke="#7b1fa2" 
              strokeDasharray="3 3" 
              label={{
                value: `Avg: ${avgNifty.toFixed(2)}`,
                position: 'right',
                fill: '#7b1fa2',
                fontSize: 12
              }}
            />
            <Bar 
              yAxisId="right" 
              dataKey="callChange" 
              name="Client Futures OI"
              radius={[4, 4, 0, 0]}
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
              name="NIFTY" 
              stroke="#7b1fa2"
              strokeWidth={2}
              fill="#e1bee7"
              fillOpacity={0.4}
              activeDot={{ 
                r: 6, 
                stroke: '#5e35b1',
                strokeWidth: 2,
                fill: '#ffffff'
              }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default Client_OI_Index_Fut;