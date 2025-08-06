// // OrderFlowChart.tsx

// import { motion } from 'framer-motion';
// import { Chart } from 'react-chartjs-2';
// import {
//   Chart as ChartJS,
//   CategoryScale,
//   LinearScale,
//   BarElement,
//   LineElement,
//   PointElement,
//   LineController,
//   BarController,
//   Title,
//   Tooltip,
//   Legend,
//   ChartOptions,
//   ChartData,
// } from 'chart.js';
// import {
//   TrendingUp,
//   TrendingDown,
//   BarChart2,
//   ArrowUp,
//   ArrowDown,
// } from 'react-feather';

// // ✅ Register all components
// ChartJS.register(
//   CategoryScale,
//   LinearScale,
//   BarElement,
//   LineElement,
//   PointElement,
//   LineController,
//   BarController,
//   Title,
//   Tooltip,
//   Legend
// );

// const OrderFlowChart = () => {
//   const orderFlowData = {
//     currentImbalance: 0.42,
//     previousImbalance: 0.35,
//     trend: 'up' as 'up' | 'down' | 'neutral',
//     levels: {
//       extremeBuy: 0.6,
//       extremeSell: -0.6,
//       neutral: 0,
//     },
//   };

//   const timePeriods = ['9:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30'];
//   const bidVolumes = [120, 95, 110, 85, 70, 90, 80];
//   const askVolumes = [80, 105, 90, 115, 130, 100, 120];
//   const imbalances = [0.2, -0.05, 0.1, -0.15, -0.3, -0.05, -0.2];
//   const prices = [180.5, 180.3, 180.7, 180.2, 179.8, 180.0, 179.5];

//   const chartData: ChartData<'bar' | 'line', number[], string> = {
//     labels: timePeriods,
//     datasets: [
//       {
//         label: 'Price',
//         type: 'line',
//         data: prices,
//         borderColor: '#3b82f6',
//         borderWidth: 2,
//         pointRadius: 3,
//         pointBackgroundColor: '#3b82f6',
//         order: 0,
//         yAxisID: 'y2',
//       },
//       {
//         label: 'Order Flow Imbalance',
//         type: 'bar',
//         data: imbalances,
//         backgroundColor: imbalances.map(val =>
//           val > 0 ? 'rgba(22, 163, 74, 0.8)' : 'rgba(220, 38, 38, 0.8)'
//         ),
//         borderColor: imbalances.map(val => (val > 0 ? '#16a34a' : '#dc2626')),
//         borderWidth: 1,
//         order: 1,
//         yAxisID: 'y1',
//       },
//       {
//         label: 'Bid Volume',
//         type: 'bar',
//         data: bidVolumes,
//         backgroundColor: 'rgba(16, 185, 129, 0.7)',
//         borderColor: '#10b981',
//         borderWidth: 1,
//         order: 2,
//         yAxisID: 'y',
//       },
//       {
//         label: 'Ask Volume',
//         type: 'bar',
//         data: askVolumes,
//         backgroundColor: 'rgba(239, 68, 68, 0.7)',
//         borderColor: '#ef4444',
//         borderWidth: 1,
//         order: 3,
//         yAxisID: 'y',
//       },
//     ],
//   };

//   const chartOptions: ChartOptions<'bar' | 'line'> = {
//     responsive: true,
//     maintainAspectRatio: false,
//     plugins: {
//       legend: {
//         position: 'top',
//         labels: {
//           color: '#e2e8f0',
//           font: { size: 10 },
//           usePointStyle: true,
//           pointStyle: 'circle',
//         },
//       },
//       tooltip: {
//         mode: 'index',
//         intersect: false,
//         backgroundColor: '#1e293b',
//         titleColor: '#f8fafc',
//         bodyColor: '#e2e8f0',
//         borderColor: '#334155',
//         borderWidth: 1,
//         bodyFont: { size: 10 },
//         callbacks: {
//           label: context => {
//             const label = context.dataset.label || '';
//             const raw = context.raw as number;
//             return label === 'Price'
//               ? `${label}: $${raw}`
//               : label === 'Order Flow Imbalance'
//               ? `${label}: ${(raw > 0 ? '+' : '') + raw.toFixed(2)}`
//               : `${label}: ${raw}`;
//           },
//         },
//       },
//     },
//     scales: {
//       x: {
//         grid: { display: false },
//         ticks: { color: '#94a3b8', font: { size: 9 } },
//       },
//       y: {
//         position: 'left',
//         title: { display: true, text: 'Volume', color: '#94a3b8', font: { size: 10 } },
//         grid: { color: '#334155' },
//         ticks: { color: '#94a3b8', font: { size: 9 } },
//       },
//       y1: {
//         position: 'right',
//         title: { display: true, text: 'Imbalance', color: '#94a3b8', font: { size: 10 } },
//         min: -1,
//         max: 1,
//         grid: { drawOnChartArea: false },
//         ticks: {
//           color: '#94a3b8',
//           font: { size: 9 },
//           callback: val => (val as number).toFixed(1),
//         },
//       },
//       y2: {
//         position: 'right',
//         title: { display: true, text: 'Price ($)', color: '#94a3b8', font: { size: 10 } },
//         grid: { drawOnChartArea: false },
//         ticks: { color: '#94a3b8', font: { size: 9 } },
//         afterFit: scale => {
//           scale.width = 50;
//         },
//       },
//     },
//   };

//   const trendMap = {
//     up: { color: 'text-green-400', icon: TrendingUp, label: 'Buying Pressure' },
//     down: { color: 'text-red-400', icon: TrendingDown, label: 'Selling Pressure' },
//     neutral: { color: 'text-yellow-400', icon: BarChart2, label: 'Balanced' },
//   };

//   const { color: trendColor, icon: TrendIcon, label: trendLabel } = trendMap[orderFlowData.trend];

//   return (
//     <div className="bg-gray-900 rounded-xl p-1 h-full flex flex-col">
//       {/* Header */}
//       <div className="flex items-center justify-between mb-2">
//         <h2 className="text-lg font-bold text-white flex items-center">
//           <BarChart2 className="text-blue-400 mr-2" size={18} />
//           Order Flow Analysis
//         </h2>
//         <div className={`px-2 py-1 rounded-full text-xs font-medium ${trendColor} bg-gray-800 flex items-center`}>
//           <TrendIcon size={14} className="mr-1" />
//           {trendLabel}
//         </div>
//       </div>

//       {/* Imbalance Summary */}
//       <div className="grid grid-cols-3 gap-2 mb-4">
//         {[
//           {
//             label: 'Current Imbalance',
//             value: orderFlowData.currentImbalance,
//             color: orderFlowData.currentImbalance > 0 ? 'text-green-400' : 'text-red-400',
//             bold: true,
//           },
//           {
//             label: 'Previous',
//             value: orderFlowData.previousImbalance,
//             color: orderFlowData.previousImbalance > 0 ? 'text-green-300' : 'text-red-300',
//             bold: false,
//           },
//           {
//             label: 'Change',
//             value: orderFlowData.currentImbalance - orderFlowData.previousImbalance,
//             color: trendColor,
//             bold: true,
//           },
//         ].map(({ label, value, color, bold }, idx) => (
//           <motion.div key={idx} className="bg-gray-800 rounded-lg p-1 text-center" whileHover={{ scale: 1.02 }}>
//             <div className="text-gray-300 text-xs">{label}</div>
//             <div className={`text-sm ${bold ? 'font-bold' : ''} ${color}`}>
//               {(value > 0 ? '+' : '') + value.toFixed(2)}
//             </div>
//           </motion.div>
//         ))}
//       </div>

//       {/* Key Levels */}
//       <div className="grid grid-cols-3 gap-2 mb-4">
//         <motion.div className="bg-green-900/30 rounded-lg p-1 text-center" whileHover={{ scale: 1.02 }}>
//           <div className="text-green-300 text-xs flex items-center justify-center">
//             <ArrowUp className="mr-1" size={12} />
//             Extreme Buy
//           </div>
//           <div className="text-sm text-white">+{orderFlowData.levels.extremeBuy.toFixed(1)}</div>
//         </motion.div>
//         <motion.div className="bg-gray-800 rounded-lg p-1 text-center" whileHover={{ scale: 1.02 }}>
//           <div className="text-gray-300 text-xs">Neutral Zone</div>
//           <div className="text-sm text-white">±{Math.abs(orderFlowData.levels.neutral).toFixed(1)}</div>
//         </motion.div>
//         <motion.div className="bg-red-900/30 rounded-lg p-1 text-center" whileHover={{ scale: 1.02 }}>
//           <div className="text-red-300 text-xs flex items-center justify-center">
//             <ArrowDown className="mr-1" size={12} />
//             Extreme Sell
//           </div>
//           <div className="text-sm text-white">{orderFlowData.levels.extremeSell.toFixed(1)}</div>
//         </motion.div>
//       </div>

//       {/* Chart */}
//       <div className="flex-1 max-h-[180px] bg-gray-800/50 rounded-lg border border-gray-700 mb-3 p-2">
//         <Chart type="bar" data={chartData} options={chartOptions} className="w-full h-full" />
//       </div>
//     </div>
//   );
// };

// export default OrderFlowChart;


import { motion } from 'framer-motion';
import { Chart } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  LineController,
  BarController,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
  ChartData,
} from 'chart.js';
import {
  TrendingUp,
  TrendingDown,
  BarChart2,
  ArrowUp,
  ArrowDown,
} from 'react-feather';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  LineController,
  BarController,
  Title,
  Tooltip,
  Legend
);

const OrderFlowChart = () => {
  const orderFlowData = {
    currentImbalance: 0.42,
    previousImbalance: 0.35,
    trend: 'up' as 'up' | 'down' | 'neutral',
    levels: {
      extremeBuy: 0.6,
      extremeSell: -0.6,
      neutral: 0,
    },
  };

  const timePeriods = ['9:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30'];
  const bidVolumes = [120, 95, 110, 85, 70, 90, 80];
  const askVolumes = [80, 105, 90, 115, 130, 100, 120];
  const imbalances = [0.2, -0.05, 0.1, -0.15, -0.3, -0.05, -0.2];
  const prices = [180.5, 180.3, 180.7, 180.2, 179.8, 180.0, 179.5];

  const chartData: ChartData<'bar' | 'line', number[], string> = {
    labels: timePeriods,
    datasets: [
      {
        label: 'Price',
        type: 'line',
        data: prices,
        borderColor: '#3b82f6',
        borderWidth: 2,
        pointRadius: 3,
        pointBackgroundColor: '#3b82f6',
        order: 0,
        yAxisID: 'y2',
      },
      {
        label: 'Order Flow Imbalance',
        type: 'bar',
        data: imbalances,
        backgroundColor: imbalances.map(val =>
          val > 0 ? 'rgba(22, 163, 74, 0.8)' : 'rgba(220, 38, 38, 0.8)'
        ),
        borderColor: imbalances.map(val => (val > 0 ? '#16a34a' : '#dc2626')),
        borderWidth: 1,
        order: 1,
        yAxisID: 'y1',
      },
      {
        label: 'Bid Volume',
        type: 'bar',
        data: bidVolumes,
        backgroundColor: 'rgba(16, 185, 129, 0.7)',
        borderColor: '#10b981',
        borderWidth: 1,
        order: 2,
        yAxisID: 'y',
      },
      {
        label: 'Ask Volume',
        type: 'bar',
        data: askVolumes,
        backgroundColor: 'rgba(239, 68, 68, 0.7)',
        borderColor: '#ef4444',
        borderWidth: 1,
        order: 3,
        yAxisID: 'y',
      },
    ],
  };

  const chartOptions: ChartOptions<'bar' | 'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#e2e8f0',
          font: { size: 10 },
          usePointStyle: true,
          pointStyle: 'circle',
        },
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: '#1e293b',
        titleColor: '#f8fafc',
        bodyColor: '#e2e8f0',
        borderColor: '#334155',
        borderWidth: 1,
        bodyFont: { size: 10 },
        callbacks: {
          label: context => {
            const label = context.dataset.label || '';
            const raw = context.raw as number;
            return label === 'Price'
              ? `${label}: $${raw}`
              : label === 'Order Flow Imbalance'
              ? `${label}: ${(raw > 0 ? '+' : '') + raw.toFixed(2)}`
              : `${label}: ${raw}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#94a3b8', font: { size: 9 } },
      },
      y: {
        position: 'left',
        title: { display: true, text: 'Volume', color: '#94a3b8', font: { size: 10 } },
        grid: { color: '#334155' },
        ticks: { color: '#94a3b8', font: { size: 9 } },
      },
      y1: {
        position: 'right',
        title: { display: true, text: 'Imbalance', color: '#94a3b8', font: { size: 10 } },
        min: -1,
        max: 1,
        grid: { drawOnChartArea: false },
        ticks: {
          color: '#94a3b8',
          font: { size: 9 },
          callback: val => (val as number).toFixed(1),
        },
      },
      y2: {
        position: 'right',
        title: { display: true, text: 'Price ($)', color: '#94a3b8', font: { size: 10 } },
        grid: { drawOnChartArea: false },
        ticks: { color: '#94a3b8', font: { size: 9 } },
        afterFit: scale => {
          scale.width = 50;
        },
      },
    },
  };

  const trendMap = {
    up: { color: 'text-green-400', icon: TrendingUp, label: 'Buying Pressure' },
    down: { color: 'text-red-400', icon: TrendingDown, label: 'Selling Pressure' },
    neutral: { color: 'text-yellow-400', icon: BarChart2, label: 'Balanced' },
  };

  const { color: trendColor, icon: TrendIcon, label: trendLabel } = trendMap[orderFlowData.trend];

  return (
    <div className="relative h-full">
      <motion.div 
        className="bg-gray-900 rounded-xl p-1 h-full flex flex-col blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-bold text-white flex items-center">
            <BarChart2 className="text-blue-400 mr-2" size={18} />
            Order Flow Analysis
          </h2>
          <div className={`px-2 py-1 rounded-full text-xs font-medium ${trendColor} bg-gray-800 flex items-center`}>
            <TrendIcon size={14} className="mr-1" />
            {trendLabel}
          </div>
        </div>

        {/* Imbalance Summary */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            {
              label: 'Current Imbalance',
              value: orderFlowData.currentImbalance,
              color: orderFlowData.currentImbalance > 0 ? 'text-green-400' : 'text-red-400',
              bold: true,
            },
            {
              label: 'Previous',
              value: orderFlowData.previousImbalance,
              color: orderFlowData.previousImbalance > 0 ? 'text-green-300' : 'text-red-300',
              bold: false,
            },
            {
              label: 'Change',
              value: orderFlowData.currentImbalance - orderFlowData.previousImbalance,
              color: trendColor,
              bold: true,
            },
          ].map(({ label, value, color, bold }, idx) => (
            <motion.div key={idx} className="bg-gray-800 rounded-lg p-1 text-center" whileHover={{ scale: 1.02 }}>
              <div className="text-gray-300 text-xs">{label}</div>
              <div className={`text-sm ${bold ? 'font-bold' : ''} ${color}`}>
                {(value > 0 ? '+' : '') + value.toFixed(2)}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Key Levels */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <motion.div className="bg-green-900/30 rounded-lg p-1 text-center" whileHover={{ scale: 1.02 }}>
            <div className="text-green-300 text-xs flex items-center justify-center">
              <ArrowUp className="mr-1" size={12} />
              Extreme Buy
            </div>
            <div className="text-sm text-white">+{orderFlowData.levels.extremeBuy.toFixed(1)}</div>
          </motion.div>
          <motion.div className="bg-gray-800 rounded-lg p-1 text-center" whileHover={{ scale: 1.02 }}>
            <div className="text-gray-300 text-xs">Neutral Zone</div>
            <div className="text-sm text-white">±{Math.abs(orderFlowData.levels.neutral).toFixed(1)}</div>
          </motion.div>
          <motion.div className="bg-red-900/30 rounded-lg p-1 text-center" whileHover={{ scale: 1.02 }}>
            <div className="text-red-300 text-xs flex items-center justify-center">
              <ArrowDown className="mr-1" size={12} />
              Extreme Sell
            </div>
            <div className="text-sm text-white">{orderFlowData.levels.extremeSell.toFixed(1)}</div>
          </motion.div>
        </div>

        {/* Chart */}
        <div className="flex-1 max-h-[180px] bg-gray-800/50 rounded-lg border border-gray-700 mb-3 p-2">
          <Chart type="bar" data={chartData} options={chartOptions} className="w-full h-full" />
        </div>
      </motion.div>

      {/* Coming Soon Overlay */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <motion.div 
          className="bg-none bg-opacity-50 backdrop-blur-sm rounded-xl p-6 text-center max-w-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <motion.h2 
            className="text-3xl font-bold text-white mb-3"
            initial={{ y: -20 }}
            animate={{ y: 0 }}
            transition={{ delay: 0.2 }}
          >
            Coming Soon
          </motion.h2>
          <motion.p 
            className="text-gray-200 text-lg"
            initial={{ y: 20 }}
            animate={{ y: 0 }}
            transition={{ delay: 0.3 }}
          >
            Order Flow Analysis in Development
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
};

export default OrderFlowChart;