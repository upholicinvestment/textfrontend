// // components/Gex2DHorizontalChart.tsx
// import { Bar } from 'react-chartjs-2';
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
// } from 'chart.js';

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

// export default function Gex2DHorizontalChart() {
//   const strikes = ['26000', '25500', '25000', '24500', '24000'];

//   const data = {
//     labels: strikes,
//     datasets: [
//       {
//         label: 'Expiry 2-May',
//         data: [-50, 400, 100, -150, -200],
//         backgroundColor: 'rgba(255, 99, 132, 0.6)',
//       },
//       {
//         label: 'Expiry 9-May',
//         data: [-200, 100, 300, 200, -100],
//         backgroundColor: 'rgba(54, 162, 235, 0.6)',
//       },
//       {
//         label: 'Expiry 16-May',
//         data: [50, 300, 250, 150, 0],
//         backgroundColor: 'rgba(75, 192, 192, 0.6)',
//       },
//     ],
//   };

//   const options = {
//     indexAxis: 'y' as const,
//     responsive: true,
//     maintainAspectRatio: false,
//     plugins: {
//       legend: {
//         position: 'top' as const,
//         labels: {
//           color: '#fff',
//         },
//       },
//       title: {
//         display: true,
//         text: 'Horizontal GEX Chart (Strike × Expiry)',
//         color: '#fff',
//       },
//     },
//     scales: {
//       x: {
//         title: {
//           display: true,
//           text: 'Gamma Exposure',
//           color: '#fff',
//         },
//         ticks: {
//           color: '#ccc',
//         },
//         grid: {
//           color: '#444',
//         },
//       },
//       y: {
//         title: {
//           display: true,
//           text: 'Strike Prices',
//           color: '#fff',
//         },
//         ticks: {
//           color: '#ccc',
//         },
//         grid: {
//           color: '#444',
//         },
//       },
//     },
//   };

//   return (
//     <div className="bg-gray-900 p-2 rounded-xl shadow-lg text-white">
//       <h2 className="text-lg font-bold text-center mb-2 text-white">Gamma Exposure</h2>
//       <div className="h-[300px]">
//         <Bar data={data} options={options} />
//       </div>
//     </div>
//   );
// }


// components/Gex2DHorizontalChart.tsx
import { Bar } from 'react-chartjs-2';
import { motion } from 'framer-motion';
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
} from 'chart.js';

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

export default function Gex2DHorizontalChart() {
  const strikes = ['26000', '25500', '25000', '24500', '24000'];

  const data = {
    labels: strikes,
    datasets: [
      {
        label: 'Expiry 2-May',
        data: [-50, 400, 100, -150, -200],
        backgroundColor: 'rgba(255, 99, 132, 0.6)',
      },
      {
        label: 'Expiry 9-May',
        data: [-200, 100, 300, 200, -100],
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
      },
      {
        label: 'Expiry 16-May',
        data: [50, 300, 250, 150, 0],
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
      },
    ],
  };

  const options = {
    indexAxis: 'y' as const,
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#fff',
        },
      },
      title: {
        display: true,
        text: 'Horizontal GEX Chart (Strike × Expiry)',
        color: '#fff',
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Gamma Exposure',
          color: '#fff',
        },
        ticks: {
          color: '#ccc',
        },
        grid: {
          color: '#444',
        },
      },
      y: {
        title: {
          display: true,
          text: 'Strike Prices',
          color: '#fff',
        },
        ticks: {
          color: '#ccc',
        },
        grid: {
          color: '#444',
        },
      },
    },
  };

  return (
    <div className="relative">
      <motion.div 
        className="bg-gray-900 p-2 rounded-xl shadow-lg text-white blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <h2 className="text-lg font-bold text-center mb-2 text-white">Gamma Exposure</h2>
        <div className="h-[300px]">
          <Bar data={data} options={options} />
        </div>
      </motion.div>

      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <motion.div 
          className="bg-none bg-opacity-50 backdrop-blur-sm rounded-xl p-8 text-center max-w-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <motion.h2 
            className="text-4xl font-bold text-white mb-4"
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
            This feature is currently in development
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
}