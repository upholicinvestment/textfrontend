// import { Chart } from 'react-chartjs-2';
// import { motion } from 'framer-motion';
// import {
//   Chart as ChartJS,
//   CategoryScale,
//   LinearScale,
//   BarElement,
//   LineElement,
//   LineController,
//   PointElement,
//   Title,
//   Tooltip,
//   Legend,
// } from 'chart.js';
// import type { ChartData, ChartOptions } from 'chart.js';

// // ✅ Register all required elements and controllers
// ChartJS.register(
//   CategoryScale,
//   LinearScale,
//   BarElement,
//   LineElement,
//   LineController,
//   PointElement,
//   Title,
//   Tooltip,
//   Legend
// );

// export default function Call_Put() {
//   const labels = ['23000', '23500', '24000', '24500', '25000', '25500', '26000'];

//   const data: ChartData<'bar' | 'line', number[], string> = {
//     labels,
//     datasets: [
//       {
//         type: 'bar',
//         label: 'Call OI',
//         data: [2, 4, 8, 12, 16, 10, 18],
//         backgroundColor: 'rgba(16, 185, 129, 0.7)', // Emerald green
//         borderColor: 'rgba(16, 185, 129, 1)',
//         borderWidth: 1,
//       },
//       {
//         type: 'bar',
//         label: 'Put OI',
//         data: [1, 3, 6, 10, 14, 18, 22],
//         backgroundColor: 'rgba(239, 68, 68, 0.7)', // Red-500
//         borderColor: 'rgba(239, 68, 68, 1)',
//         borderWidth: 1,
//       },
//       {
//         type: 'line',
//         label: 'NIFTY Spot',
//         data: [23000, 23400, 24100, 24400, 24800, 25300, 25900],
//         borderColor: '#A78BFA', // Purple-400
//         backgroundColor: '#A78BFA',
//         borderWidth: 2,
//         tension: 0.4,
//         pointRadius: 0,
//         yAxisID: 'y1',
//       },
//     ],
//   };

//   const options: ChartOptions<'bar' | 'line'> = {
//     responsive: true,
//     maintainAspectRatio: false,
//     interaction: {
//       mode: 'index',
//       intersect: false,
//     },
//     plugins: {
//       legend: {
//         labels: {
//           color: '#E5E7EB', // Light gray text
//         },
//       },
//       tooltip: {
//         backgroundColor: '#1F2937', // gray-800
//         titleColor: '#F3F4F6', // gray-100
//         bodyColor: '#E5E7EB', // gray-200
//         borderColor: '#4B5563', // gray-600
//         borderWidth: 1,
//       },
//     },
//     scales: {
//       x: {
//         grid: {
//           color: '#374151', // gray-700
//         },
//         ticks: {
//           color: '#9CA3AF', // gray-400
//         },
//       },
//       y: {
//         type: 'linear',
//         position: 'left',
//         grid: {
//           color: '#374151',
//         },
//         ticks: {
//           color: '#9CA3AF',
//         },
//         title: {
//           display: true,
//           text: 'OI Volume (in M)',
//           color: '#D1D5DB',
//         },
//       },
//       y1: {
//         type: 'linear',
//         position: 'right',
//         grid: {
//           drawOnChartArea: false,
//         },
//         ticks: {
//           color: '#9CA3AF',
//         },
//         title: {
//           display: true,
//           text: 'Spot Price',
//           color: '#D1D5DB',
//         },
//       },
//     },
//   };

//   return (
//     <motion.div
//       className="w-full p-6 bg-gray-900 rounded-xl shadow-lg"
//       initial={{ opacity: 0, y: 40 }}
//       animate={{ opacity: 1, y: 0 }}
//       transition={{ duration: 0.8 }}
//     >
//       <h2 className="text-lg font-bold text-center mb-4 text-white">Call/Put (NIFTY)</h2>
//       <div className="h-[250px]">
//         <Chart type="bar" data={data} options={options} />
//       </div>
//     </motion.div>
//   );
// }













// import { Chart } from 'react-chartjs-2';
// import { motion } from 'framer-motion';
// import {
//   Chart as ChartJS,
//   CategoryScale,
//   LinearScale,
//   BarElement,
//   LineElement,
//   LineController,
//   PointElement,
//   Title,
//   Tooltip,
//   Legend,
// } from 'chart.js';
// import type { ChartData, ChartOptions } from 'chart.js';

// ChartJS.register(
//   CategoryScale,
//   LinearScale,
//   BarElement,
//   LineElement,
//   LineController,
//   PointElement,
//   Title,
//   Tooltip,
//   Legend
// );

// export default function Call_Put() {
//   const labels = ['23000', '23500', '24000', '24500', '25000', '25500', '26000'];

//   const data: ChartData<'bar' | 'line', number[], string> = {
//     labels,
//     datasets: [
//       {
//         type: 'bar',
//         label: 'Call OI',
//         data: [2, 4, 8, 12, 16, 10, 18],
//         backgroundColor: 'rgba(16, 185, 129, 0.7)',
//         borderColor: 'rgba(16, 185, 129, 1)',
//         borderWidth: 1,
//       },
//       {
//         type: 'bar',
//         label: 'Put OI',
//         data: [1, 3, 6, 10, 14, 18, 22],
//         backgroundColor: 'rgba(239, 68, 68, 0.7)',
//         borderColor: 'rgba(239, 68, 68, 1)',
//         borderWidth: 1,
//       },
//       {
//         type: 'line',
//         label: 'NIFTY Spot',
//         data: [23000, 23400, 24100, 24400, 24800, 25300, 25900],
//         borderColor: '#A78BFA',
//         backgroundColor: '#A78BFA',
//         borderWidth: 2,
//         tension: 0.4,
//         pointRadius: 0,
//         yAxisID: 'y1',
//       },
//     ],
//   };

//   const options: ChartOptions<'bar' | 'line'> = {
//     responsive: true,
//     maintainAspectRatio: false,
//     interaction: {
//       mode: 'index',
//       intersect: false,
//     },
//     plugins: {
//       legend: {
//         labels: {
//           color: '#E5E7EB',
//         },
//       },
//       tooltip: {
//         backgroundColor: '#1F2937',
//         titleColor: '#F3F4F6',
//         bodyColor: '#E5E7EB',
//         borderColor: '#4B5563',
//         borderWidth: 1,
//       },
//     },
//     scales: {
//       x: {
//         grid: {
//           color: '#374151',
//         },
//         ticks: {
//           color: '#9CA3AF',
//         },
//       },
//       y: {
//         type: 'linear',
//         position: 'left',
//         grid: {
//           color: '#374151',
//         },
//         ticks: {
//           color: '#9CA3AF',
//         },
//         title: {
//           display: true,
//           text: 'OI Volume (in M)',
//           color: '#D1D5DB',
//         },
//       },
//       y1: {
//         type: 'linear',
//         position: 'right',
//         grid: {
//           drawOnChartArea: false,
//         },
//         ticks: {
//           color: '#9CA3AF',
//         },
//         title: {
//           display: true,
//           text: 'Spot Price',
//           color: '#D1D5DB',
//         },
//       },
//     },
//   };

//   return (
//     <div className="relative">
//       <motion.div
//         className="w-full p-6 bg-gray-900 rounded-xl shadow-lg blur-sm"
//         initial={{ opacity: 0, y: 40 }}
//         animate={{ opacity: 1, y: 0 }}
//         transition={{ duration: 0.8 }}
//       >
//         <h2 className="text-lg font-bold text-center mb-4 text-white">Call/Put (NIFTY)</h2>
//         <div className="h-[250px]">
//           <Chart type="bar" data={data} options={options} />
//         </div>
//       </motion.div>

//       {/* Coming Soon Overlay */}
//       <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
//         <motion.div 
//           className="bg-none bg-opacity-50 backdrop-blur-sm rounded-xl p-6 text-center max-w-md"
//           initial={{ opacity: 0 }}
//           animate={{ opacity: 1 }}
//           transition={{ duration: 0.5 }}
//         >
//           <motion.h2 
//             className="text-3xl font-bold text-white mb-3"
//             initial={{ y: -20 }}
//             animate={{ y: 0 }}
//             transition={{ delay: 0.2 }}
//           >
//             Coming Soon
//           </motion.h2>
//           <motion.p 
//             className="text-gray-200 text-lg"
//             initial={{ y: 20 }}
//             animate={{ y: 0 }}
//             transition={{ delay: 0.3 }}
//           >
//             Call/Put Analysis in Development
//           </motion.p>
//         </motion.div>
//       </div>
//     </div>
//   );
// }



// api 
import { useState, useEffect, useMemo } from 'react';
import { Chart } from 'react-chartjs-2';
import { motion } from 'framer-motion';
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
} from 'chart.js';
import type { ChartData, ChartOptions } from 'chart.js';

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
  const [tab, setTab] = useState<'OVERALL' | 'ATM' | 'NEAR5'>('ATM');
  const [timeInterval, setTimeInterval] = useState<'3m' | '15m' | '30m' | '1h'>('3m');

  const [atmData, setATMData] = useState<ATMStrikeEntry[]>([]);
  const [timeData, setTimeData] = useState<TimeOIData[]>([]);
  const [niftyData, setNiftyData] = useState<NiftyData[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (tab === 'ATM') {
          // Pass interval as query param to backend for ATM data
          const intervalMinutes = intervalToMinutes(timeInterval);
          const res = await fetch(
            `http://localhost:8000/api/nifty/atm-strikes-timeline?interval=${intervalMinutes}`
          );
          const json = await res.json();
          setATMData(json.atmStrikes || []);
        } else {
          let endpoint =
            tab === 'NEAR5'
              ? 'http://localhost:8000/api/nifty/near5'
              : 'http://localhost:8000/api/nifty/overall';
          const res = await fetch(endpoint);
          const json = await res.json();
          setTimeData(json.near5 || json.overall || []);
          setNiftyData(json.nifty || []);
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      }
    };

    fetchData();
  }, [tab, timeInterval]); // added timeInterval to refetch when interval changes

  // Round a timestamp string to nearest interval in minutes
  const roundToInterval = (dateStr: string, interval: number) => {
    const parsed = Date.parse(dateStr);
    if (isNaN(parsed)) return '';
    const date = new Date(parsed);
    const ms = 1000 * 60 * interval;
    const rounded = new Date(Math.floor(date.getTime() / ms) * ms);
    return rounded.toISOString().slice(11, 16); // HH:mm
  };

  const lineChartData = useMemo(() => {
    const callMap = new Map<string, number>();
    const putMap = new Map<string, number>();
    const niftyMap = new Map<string, number>();

    timeData.forEach(({ callOI, callTimestamp, putOI, putTimestamp }) => {
      const callTime = roundToInterval(callTimestamp, intervalToMinutes(timeInterval));
      if (callTime) callMap.set(callTime, (callMap.get(callTime) || 0) + callOI);

      const putTime = roundToInterval(putTimestamp, intervalToMinutes(timeInterval));
      if (putTime) putMap.set(putTime, (putMap.get(putTime) || 0) + putOI);
    });

    niftyData.forEach(({ value, timestamp }) => {
      const time = roundToInterval(timestamp, intervalToMinutes(timeInterval));
      if (time) niftyMap.set(time, value);
    });

    const allTimes = Array.from(
      new Set([...callMap.keys(), ...putMap.keys(), ...niftyMap.keys()])
    )
      .filter(Boolean)
      .sort();

    return {
      labels: allTimes,
      callOI: allTimes.map((t) => callMap.get(t) || 0),
      putOI: allTimes.map((t) => putMap.get(t) || 0),
      nifty: allTimes.map((t) => niftyMap.get(t) || null),
    };
  }, [timeData, niftyData, timeInterval]);

  const atmChartData: ChartData<'line'> = useMemo(() => {
    if (!atmData || atmData.length === 0) return { labels: [], datasets: [] };

    const labels = atmData.map((d) => roundToInterval(d.timestamp, intervalToMinutes(timeInterval)));
    const callOIs = atmData.map((d) => d.callOI);
    const putOIs = atmData.map((d) => d.putOI);
    const niftyLTPs = atmData.map((d) => d.niftyLTP);

    return {
      labels,
      datasets: [
        {
          label: 'ATM Call OI',
          data: callOIs,
          borderColor: '#10B981',
          backgroundColor: '#10B981',
          tension: 0.3,
          pointRadius: 3,
          fill: false,
        },
        {
          label: 'ATM Put OI',
          data: putOIs,
          borderColor: '#EF4444',
          backgroundColor: '#EF4444',
          tension: 0.3,
          pointRadius: 3,
          fill: false,
        },
        {
          label: 'Nifty LTP',
          data: niftyLTPs,
          borderColor: '#3B82F6',
          backgroundColor: '#3B82F6',
          tension: 0.3,
          pointRadius: 3,
          fill: false,
          yAxisID: 'y1',
        },
      ],
    };
  }, [atmData, timeInterval]);

  const lineChartConfig: ChartData<'line'> = useMemo(
    () => ({
      labels: lineChartData.labels,
      datasets: [
        {
          label: 'Total Call OI',
          data: lineChartData.callOI,
          borderColor: '#10B981',
          backgroundColor: '#10B981',
          borderWidth: 2,
          tension: 0.3,
          pointRadius: 3,
          fill: false,
        },
        {
          label: 'Total Put OI',
          data: lineChartData.putOI,
          borderColor: '#EF4444',
          backgroundColor: '#EF4444',
          borderWidth: 2,
          tension: 0.3,
          pointRadius: 3,
          fill: false,
        },
        {
          label: 'Nifty',
          data: lineChartData.nifty,
          borderColor: '#3B82F6',
          backgroundColor: '#3B82F6',
          borderWidth: 2,
          tension: 0.3,
          pointRadius: 3,
          yAxisID: 'y1',
          fill: false,
        },
      ],
    }),
    [lineChartData]
  );

  const lineOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: { labels: { color: '#E5E7EB' } },
      tooltip: {
        backgroundColor: '#1F2937',
        titleColor: '#F3F4F6',
        bodyColor: '#E5E7EB',
        borderColor: '#4B5563',
        borderWidth: 1,
      },
      title: {
        display: true,
        text: `Call OI, Put OI, and Nifty (${tab})`,
        color: '#F9FAFB',
        font: { size: 16 },
      },
    },
    scales: {
      x: {
        grid: { color: '#374151' },
        ticks: { color: '#9CA3AF', maxRotation: 45, minRotation: 45 },
        title: { display: true, text: 'Time', color: '#D1D5DB' },
      },
      y: {
        beginAtZero: true,
        grid: { color: '#374151' },
        ticks: {
          color: '#9CA3AF',
          callback: (val) => (typeof val === 'number' ? (val / 1_000_000).toFixed(1) + 'M' : val),
        },
        title: { display: true, text: 'Open Interest', color: '#D1D5DB' },
      },
      y1: {
        position: 'right',
        grid: { drawOnChartArea: false },
        ticks: { color: '#93C5FD' },
        title: {
          display: true,
          text: 'Nifty Value',
          color: '#93C5FD',
        },
      },
    },
  };

  function intervalToMinutes(interval: string) {
    switch (interval) {
      case '3m':
        return 3;
      case '15m':
        return 15;
      case '30m':
        return 30;
      case '1h':
        return 60;
      default:
        return 3;
    }
  }

  return (
  <div className="max-w-5xl mx-auto p-2 text-white">
    {/* Tab Selector */}
    <div className="flex space-x-2 mb-2">
      {['OVERALL', 'ATM', 'NEAR5'].map((t) => (
        <button
          key={t}
          className={`px-2 py-1 text-sm rounded ${
            tab === t ? 'bg-indigo-600' : 'bg-gray-700 hover:bg-gray-600'
          }`}
          onClick={() => setTab(t as any)}
        >
          {t}
        </button>
      ))}
    </div>

    {/* Chart Area */}
    <div className="w-full h-[400px] bg-gray-900 rounded-lg p-3 shadow-lg">
      <Chart
        type="line"
        data={tab === 'ATM' ? atmChartData : lineChartConfig}
        options={lineOptions}
      />
    </div>

    {/* Time Interval Buttons - now below the graph */}
    <div className="flex justify-center space-x-2 mt-4">
      {['3m', '15m', '30m', '1h'].map((interval) => (
        <motion.button
          key={interval}
          whileTap={{ scale: 0.95 }}
          className={`px-2 py-1 text-sm rounded ${
            timeInterval === interval ? 'bg-indigo-500 text-white' : 'bg-gray-600 text-gray-300'
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
