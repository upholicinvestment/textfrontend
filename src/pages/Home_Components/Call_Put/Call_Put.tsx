import { useState, useEffect, useMemo } from "react";
import { Line } from "react-chartjs-2";
import { motion } from "framer-motion";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import type { ChartData, ChartOptions } from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

type ATMStrikeEntry = {
  atmStrike: number;
  niftyLTP: number;
  timestamp: string;
  callOI: number;
  putOI: number;
  callTimestamp: string;
  putTimestamp: string;
};

type TimeOIData = {
  strike_price: number;
  callOI: number;
  callTimestamp: string;
  putOI: number;
  putTimestamp: string;
};

type NiftyData = {
  value: number;
  timestamp: string;
};

export default function OIChartTabs() {
  const [tab, setTab] = useState<"OVERALL" | "ATM" | "NEAR5">("ATM");
  const [timeInterval, setTimeInterval] = useState<"3m" | "15m" | "30m" | "1h">(
    "3m"
  );
  const [atmData, setATMData] = useState<ATMStrikeEntry[]>([]);
  const [timeData, setTimeData] = useState<TimeOIData[]>([]);
  const [niftyData, setNiftyData] = useState<NiftyData[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (tab === "ATM") {
          const intervalMinutes = intervalToMinutes(timeInterval);
          const res = await fetch(
            `https://api.upholictech.com/api/nifty/atm-strikes-timeline?interval=${intervalMinutes}`
          );
          const json = await res.json();
          setATMData(json.atmStrikes || []);
          console.log(res);
        } else {
          let endpoint =
            tab === "NEAR5"
              ? "https://api.upholictech.com/api/nifty/near5"
              : "https://api.upholictech.com/api/nifty/overall";
          const res = await fetch(endpoint);
          const json = await res.json();
          setTimeData(json.near5 || json.overall || []);
          setNiftyData(json.nifty || []);
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
      }
    };

    fetchData();
  }, [tab, timeInterval]);

  const roundToInterval = (dateStr: string, interval: number) => {
    const parsed = Date.parse(dateStr);
    if (isNaN(parsed)) return "";
    const date = new Date(parsed);
    const ms = 1000 * 60 * interval;
    const rounded = new Date(Math.floor(date.getTime() / ms) * ms);
    return rounded.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "Asia/Kolkata",
    });
  };

  const lineChartData = useMemo(() => {
    const intervalMinutes = intervalToMinutes(timeInterval);
    const labels: string[] = [];
    const callOI: number[] = [];
    const putOI: number[] = [];
    const nifty: number[] = [];

    const labelSet = new Set<string>();
    timeData.forEach((entry) => {
      const time = roundToInterval(
        entry.callTimestamp || entry.putTimestamp,
        intervalMinutes
      );
      labelSet.add(time);
    });
    const sortedLabels = Array.from(labelSet).sort();
    labels.push(...sortedLabels);

    const niftyMap = new Map<string, number>();
    niftyData.forEach(({ value, timestamp }) => {
      const rounded = roundToInterval(timestamp, intervalMinutes);
      if (!niftyMap.has(rounded)) {
        niftyMap.set(rounded, value);
      }
    });

    sortedLabels.forEach((labelTime) => {
      const entriesAtTime = timeData.filter((entry) => {
        const callTimeStr = roundToInterval(
          entry.callTimestamp,
          intervalMinutes
        );
        const putTimeStr = roundToInterval(entry.putTimestamp, intervalMinutes);
        return callTimeStr === labelTime || putTimeStr === labelTime;
      });

      const strikeMap = new Map<number, TimeOIData>();

      for (const entry of entriesAtTime) {
        const existing = strikeMap.get(entry.strike_price);
        const callTimeNew = entry.callTimestamp
          ? new Date(entry.callTimestamp)
          : null;
        const callTimeOld = existing?.callTimestamp
          ? new Date(existing.callTimestamp)
          : null;
        const putTimeNew = entry.putTimestamp
          ? new Date(entry.putTimestamp)
          : null;
        const putTimeOld = existing?.putTimestamp
          ? new Date(existing.putTimestamp)
          : null;

        if (!existing) {
          strikeMap.set(entry.strike_price, entry);
        } else {
          strikeMap.set(entry.strike_price, {
            ...existing,
            callOI:
              callTimeNew && (!callTimeOld || callTimeNew > callTimeOld)
                ? entry.callOI
                : existing.callOI,
            callTimestamp:
              callTimeNew && (!callTimeOld || callTimeNew > callTimeOld)
                ? entry.callTimestamp
                : existing.callTimestamp,
            putOI:
              putTimeNew && (!putTimeOld || putTimeNew > putTimeOld)
                ? entry.putOI
                : existing.putOI,
            putTimestamp:
              putTimeNew && (!putTimeOld || putTimeNew > putTimeOld)
                ? entry.putTimestamp
                : existing.putTimestamp,
          });
        }
      }

      const top5 = Array.from(strikeMap.entries())
        .sort((a, b) => a[0] - b[0])
        .slice(0, 11)
        .map(([_, entry]) => entry);

      callOI.push(top5.reduce((acc, e) => acc + (e.callOI || 0), 0));
      putOI.push(top5.reduce((acc, e) => acc + (e.putOI || 0), 0));
      nifty.push(niftyMap.get(labelTime) ?? 0);
    });

    return {
      labels,
      callOI,
      putOI,
      nifty,
    };
  }, [timeData, niftyData, timeInterval]);

  const lineChartConfig: ChartData<"line"> = useMemo(
    () => ({
      labels: lineChartData.labels,
      datasets: [
        {
          label: "Total Call OI",
          data: lineChartData.callOI,
          borderColor: "#10B981",
          backgroundColor: "#10B981",
          borderWidth: 2,
          tension: 0.3,
          pointRadius: 3,
          fill: false,
        },
        {
          label: "Total Put OI",
          data: lineChartData.putOI,
          borderColor: "#EF4444",
          backgroundColor: "#EF4444",
          borderWidth: 2,
          tension: 0.3,
          pointRadius: 3,
          fill: false,
        },
        {
          label: "Nifty LTP",
          data: lineChartData.nifty,
          borderColor: "#3B82F6",
          backgroundColor: "#3B82F6",
          borderWidth: 2,
          tension: 0.3,
          pointRadius: 3,
          fill: false,
          yAxisID: "y1",
        },
      ],
    }),
    [lineChartData]
  );

  const atmChartData: ChartData<"line"> = useMemo(() => {
    if (!atmData || atmData.length === 0) return { labels: [], datasets: [] };

    const labels = atmData.map((d) =>
      roundToInterval(d.timestamp, intervalToMinutes(timeInterval))
    );
    const callOIs = atmData.map((d) => d.callOI || 0);
    const putOIs = atmData.map((d) => d.putOI || 0);
    const niftyLTPs = atmData.map((d) => d.niftyLTP || 0);

    return {
      labels,
      datasets: [
        {
          label: "ATM Call OI",
          data: callOIs,
          borderColor: "#10B981",
          backgroundColor: "#10B981",
          tension: 0.3,
          pointRadius: 3,
          fill: false,
        },
        {
          label: "ATM Put OI",
          data: putOIs,
          borderColor: "#EF4444",
          backgroundColor: "#EF4444",
          tension: 0.3,
          pointRadius: 3,
          fill: false,
        },
        {
          label: "Nifty LTP",
          data: niftyLTPs,
          borderColor: "#3B82F6",
          backgroundColor: "#3B82F6",
          tension: 0.3,
          pointRadius: 3,
          fill: false,
          yAxisID: "y1",
        },
      ],
    };
  }, [atmData, timeInterval]);

  const lineOptions: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: "index",
      intersect: false,
    },
    plugins: {
      legend: { labels: { color: "#E5E7EB" } },
      tooltip: {
        backgroundColor: "#1F2937",
        titleColor: "#F3F4F6",
        bodyColor: "#E5E7EB",
        borderColor: "#4B5563",
        borderWidth: 1,
      },
      title: {
        display: true,
        text: `Call OI, Put OI, and Nifty (${tab})`,
        color: "#F9FAFB",
        font: { size: 16 },
      },
    },
    scales: {
      x: {
        grid: { color: "#374151" },
        ticks: { color: "#9CA3AF", maxRotation: 45, minRotation: 45 },
        title: { display: true, text: "Time", color: "#D1D5DB" },
      },
      y: {
        beginAtZero: true,
        grid: { color: "#374151" },
        ticks: {
          color: "#9CA3AF",
          callback: (val) =>
            typeof val === "number" ? (val / 1_000_000).toFixed(1) + "M" : val,
        },
        title: { display: true, text: "Open Interest", color: "#D1D5DB" },
      },
      y1: {
        position: "right",
        grid: { drawOnChartArea: false },
        ticks: { color: "#93C5FD" },
        title: {
          display: true,
          text: "Nifty Value",
          color: "#93C5FD",
        },
      },
    },
  };

  function intervalToMinutes(interval: string) {
    switch (interval) {
      case "3m":
        return 3;
      case "15m":
        return 15;
      case "30m":
        return 30;
      case "1h":
        return 60;
      default:
        return 3;
    }
  }

  return (
    <div className="max-w-5xl mx-auto p-2 text-white">
      <div className="flex space-x-2 mb-2">
        {["ATM"].map((t) => (
          <button
            key={t}
            className={`px-2 py-1 text-sm rounded ${
              tab === t ? "bg-indigo-600" : "bg-gray-700 hover:bg-gray-600"
            }`}
            onClick={() => setTab(t as any)}
          >
            {t}
          </button>
        ))}
      </div>
      <div style={{ height: "400px" }} className="w-full bg-gray-900 rounded-lg p-3 shadow-lg">
        <Line
          data={tab === "ATM" ? atmChartData : lineChartConfig}
          options={lineOptions}
        />
      </div>
      <div className="flex justify-center space-x-2 mt-4">
        {["3m", "15m", "30m", "1h"].map((interval) => (
          <motion.button
            key={interval}
            whileTap={{ scale: 0.95 }}
            className={`px-2 py-1 text-sm rounded ${
              timeInterval === interval
                ? "bg-indigo-500 text-white"
                : "bg-gray-600 text-gray-300"
            }`}
            onClick={() => setTimeInterval(interval as any)}
          >
            {interval}
          </motion.button>
        ))}
      </div>
    </div>
  );
}