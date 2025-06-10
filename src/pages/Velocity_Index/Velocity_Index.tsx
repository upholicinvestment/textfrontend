// import { useState } from 'react';
// import { motion } from 'framer-motion';
// import {
//   LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
//   ResponsiveContainer, ReferenceLine, BarChart, Bar
// } from 'recharts';

// interface DataPoint {
//   price: number;
//   value: number;
//   volumeUp: number;
//   volumeDown: number;
//   deltaUp: number;
//   deltaDown: number;
// }

// const Velocity_Index = () => {
//   const [showReferenceLine, setShowReferenceLine] = useState(true);
//   const [showCurve, setShowCurve] = useState(true);
//   const [referencePrice, setReferencePrice] = useState(24000);

//   const generateData = (): DataPoint[] => {
//     const data: DataPoint[] = [];
//     let price = 20000;
//     const increment = 150;
//     let value = 22;
//     for (let i = 0; i < 54; i++) {
//       price += increment;
//       if (i < 32) value -= (Math.random() * 0.15) + 0.05;
//       else value += (Math.random() * 0.25) + 0.05;
//       let volumeUp = 0, volumeDown = 0, deltaUp = 0, deltaDown = 0;
//       if (price < referencePrice) {
//         volumeDown = Math.random() * 30 + (i % 7 === 2 ? 50 : 5);
//         volumeUp = Math.random() * 5;
//         deltaDown = Math.random() * 30 + (i % 6 === 0 ? 40 : 5);
//         deltaUp = Math.random() * 5;
//         if (i % 13 === 5) deltaDown = -Math.random() * 20;
//       } else {
//         volumeUp = Math.random() * 35 + (i % 6 === 3 ? 60 : 15);
//         volumeDown = Math.random() * 7;
//         deltaUp = Math.random() * 35 + (i % 5 === 1 ? 50 : 12);
//         deltaDown = Math.random() * 8;
//       }
//       data.push({
//         price,
//         value: Math.max(16, parseFloat(value.toFixed(2))),
//         volumeUp,
//         volumeDown,
//         deltaUp,
//         deltaDown
//       });
//     }
//     return data;
//   };

//   const [data] = useState<DataPoint[]>(generateData());

//   const CustomTooltip = ({ active, payload }: any) => {
//     if (active && payload && payload.length) {
//       const d = payload[0].payload;
//       return (
//         <div className="bg-gray-800 p-2 border border-gray-600 rounded text-xs shadow-lg">
//           <p className="text-gray-200">Price: {d.price.toLocaleString()}</p>
//           <p className="text-purple-400 font-medium">Volatility: {d.value}</p>
//           <div className="flex justify-between mt-1">
//             <span className="text-blue-400">↑ Vol: {d.volumeUp.toFixed(1)}</span>
//             <span className="text-orange-400 ml-2">↓ Vol: {d.volumeDown.toFixed(1)}</span>
//           </div>
//         </div>
//       );
//     }
//     return null;
//   };

//   const handleIncreaseRefPrice = () => {
//     setReferencePrice(prev => prev + 500);
//   };

//   const handleDecreaseRefPrice = () => {
//     setReferencePrice(prev => Math.max(20000, prev - 500));
//   };

//   return (
//     <motion.div 
//       className="bg-gray-900 text-gray-200 p-4 rounded-xl shadow-md w-full max-w-6xl mx-auto"
//       initial={{ opacity: 0 }}
//       animate={{ opacity: 1 }}
//       transition={{ duration: 0.3 }}
//     >
//       {/* Header */}
//       <div className="flex justify-between items-center mb-2 px-1">
//         <h2 className="text-lg font-semibold text-gray-300">Volatility Chart</h2>
//         <div className="flex space-x-2">
//           <motion.button
//             whileTap={{ scale: 0.95 }}
//             whileHover={{ scale: 1.05 }}
//             className={`px-3 py-1 rounded-md text-xs ${
//               showCurve ? 'bg-purple-900 text-purple-200' : 'bg-gray-800 text-gray-400'
//             }`}
//             onClick={() => setShowCurve(!showCurve)}
//           >
//             Curve
//           </motion.button>
//           <motion.button
//             whileTap={{ scale: 0.95 }}
//             whileHover={{ scale: 1.05 }}
//             className={`px-3 py-1 rounded-md text-xs ${
//               showReferenceLine ? 'bg-yellow-900 text-yellow-200' : 'bg-gray-800 text-gray-400'
//             }`}
//             onClick={() => setShowReferenceLine(!showReferenceLine)}
//           >
//             Ref Line
//           </motion.button>
//           <motion.button
//             whileTap={{ scale: 0.95 }}
//             whileHover={{ scale: 1.05 }}
//             className="px-3 py-1 rounded-md text-xs bg-gray-800 text-gray-400"
//             onClick={handleIncreaseRefPrice}
//           >
//             ↑ Ref
//           </motion.button>
//           <motion.button
//             whileTap={{ scale: 0.95 }}
//             whileHover={{ scale: 1.05 }}
//             className="px-3 py-1 rounded-md text-xs bg-gray-800 text-gray-400"
//             onClick={handleDecreaseRefPrice}
//           >
//             ↓ Ref
//           </motion.button>
//         </div>
//       </div>

//       {/* Volatility Curve */}
//       <div className="h-32">
//         <ResponsiveContainer width="100%" height="100%">
//           <LineChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
//             {showReferenceLine && (
//               <ReferenceLine
//                 x={data.findIndex(item => item.price >= referencePrice)}
//                 stroke="#D1A617"
//                 strokeDasharray="3 3"
//                 strokeWidth={1}
//                 label={{
//                   value: `Ref: ${referencePrice.toLocaleString()}`, 
//                   position: 'top', 
//                   fill: '#D1A617', 
//                   fontSize: 10
//                 }}
//               />
//             )}
//             <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
//             <XAxis dataKey="price" tick={false} axisLine={{ stroke: '#4B5563' }} />
//             <YAxis 
//               domain={['dataMin - 1', 'dataMax + 1']} 
//               tick={{ fontSize: 10, fill: '#9CA3AF' }} 
//               axisLine={{ stroke: '#4B5563' }} 
//             />
//             <Tooltip content={<CustomTooltip />} />
//             {showCurve && (
//               <Line 
//                 type="monotone" 
//                 dataKey="value" 
//                 stroke="#A855F7" 
//                 strokeWidth={2} 
//                 dot={false} 
//                 connectNulls 
//               />
//             )}
//           </LineChart>
//         </ResponsiveContainer>
//       </div>

//       {/* Volume Bars */}
//       <div className="h-40 mt-2">
//         <ResponsiveContainer width="100%" height="100%">
//           <BarChart data={data} margin={{ top: 0, right: 10, left: 10, bottom: 0 }} barGap={0} barCategoryGap={0}>
//             {showReferenceLine && (
//               <ReferenceLine
//                 x={data.findIndex(item => item.price >= referencePrice)}
//                 stroke="#D1A617"
//                 strokeDasharray="3 3"
//                 strokeWidth={1}
//               />
//             )}
//             <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
//             <XAxis dataKey="price" tick={false} axisLine={{ stroke: '#4B5563' }} />
//             <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={{ stroke: '#4B5563' }} />
//             <Tooltip content={<CustomTooltip />} />
//             <Bar dataKey="volumeDown" fill="#F97316" stackId="stack" radius={[2, 2, 0, 0]} />
//             <Bar dataKey="volumeUp" fill="#3B82F6" stackId="stack" radius={[2, 2, 0, 0]} />
//           </BarChart>
//         </ResponsiveContainer>
//       </div>

//       {/* Price labels */}
//       <div className="flex justify-between px-2 mt-1 text-gray-400 text-xs">
//         <span>20,000</span>
//         <span>22,000</span>
//         <span className="text-yellow-400">{referencePrice.toLocaleString()}</span>
//         <span>26,000</span>
//         <span>28,000</span>
//       </div>
//     </motion.div>
//   );
// };

// export default Velocity_Index;



import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, BarChart, Bar
} from 'recharts';

interface DataPoint {
  price: number;
  value: number;
  volumeUp: number;
  volumeDown: number;
  deltaUp: number;
  deltaDown: number;
}

const Velocity_Index = () => {
  const [showReferenceLine, setShowReferenceLine] = useState(true);
  const [showCurve, setShowCurve] = useState(true);
  const [referencePrice, setReferencePrice] = useState(24000);

  const generateData = (): DataPoint[] => {
    const data: DataPoint[] = [];
    let price = 20000;
    const increment = 150;
    let value = 22;
    for (let i = 0; i < 54; i++) {
      price += increment;
      if (i < 32) value -= (Math.random() * 0.15) + 0.05;
      else value += (Math.random() * 0.25) + 0.05;
      let volumeUp = 0, volumeDown = 0, deltaUp = 0, deltaDown = 0;
      if (price < referencePrice) {
        volumeDown = Math.random() * 30 + (i % 7 === 2 ? 50 : 5);
        volumeUp = Math.random() * 5;
        deltaDown = Math.random() * 30 + (i % 6 === 0 ? 40 : 5);
        deltaUp = Math.random() * 5;
        if (i % 13 === 5) deltaDown = -Math.random() * 20;
      } else {
        volumeUp = Math.random() * 35 + (i % 6 === 3 ? 60 : 15);
        volumeDown = Math.random() * 7;
        deltaUp = Math.random() * 35 + (i % 5 === 1 ? 50 : 12);
        deltaDown = Math.random() * 8;
      }
      data.push({
        price,
        value: Math.max(16, parseFloat(value.toFixed(2))),
        volumeUp,
        volumeDown,
        deltaUp,
        deltaDown
      });
    }
    return data;
  };

  const [data] = useState<DataPoint[]>(generateData());

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      return (
        <div className="bg-gray-800 p-2 border border-gray-600 rounded text-xs shadow-lg">
          <p className="text-gray-200">Price: {d.price.toLocaleString()}</p>
          <p className="text-purple-400 font-medium">Volatility: {d.value}</p>
          <div className="flex justify-between mt-1">
            <span className="text-blue-400">↑ Vol: {d.volumeUp.toFixed(1)}</span>
            <span className="text-orange-400 ml-2">↓ Vol: {d.volumeDown.toFixed(1)}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  const handleIncreaseRefPrice = () => setReferencePrice(prev => prev + 500);
  const handleDecreaseRefPrice = () => setReferencePrice(prev => Math.max(20000, prev - 500));

  return (
    <div className="relative">
      <motion.div 
        className="bg-gray-900 text-gray-200 p-4 rounded-xl shadow-md w-full max-w-6xl mx-auto blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }} >
        <div className="flex justify-between items-center mb-2 px-1">
          <h2 className="text-lg font-semibold text-gray-300">Volatility Chart</h2>
          <div className="flex space-x-2">
            <motion.button
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.05 }}
              className={`px-3 py-1 rounded-md text-xs ${
                showCurve ? 'bg-purple-900 text-purple-200' : 'bg-gray-800 text-gray-400'
              }`}
              onClick={() => setShowCurve(!showCurve)}
            >
              Curve
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.05 }}
              className={`px-3 py-1 rounded-md text-xs ${
                showReferenceLine ? 'bg-yellow-900 text-yellow-200' : 'bg-gray-800 text-gray-400'
              }`}
              onClick={() => setShowReferenceLine(!showReferenceLine)}
            >
              Ref Line
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.05 }}
              className="px-3 py-1 rounded-md text-xs bg-gray-800 text-gray-400"
              onClick={handleIncreaseRefPrice}
            >
              ↑ Ref
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.05 }}
              className="px-3 py-1 rounded-md text-xs bg-gray-800 text-gray-400"
              onClick={handleDecreaseRefPrice}
            >
              ↓ Ref
            </motion.button>
          </div>
        </div>

        {/* Area Chart Instead of LineChart */}
        <div className="h-32">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
              {showReferenceLine && (
                <ReferenceLine
                  x={data.findIndex(item => item.price >= referencePrice)}
                  stroke="#D1A617"
                  strokeDasharray="3 3"
                  strokeWidth={1}
                  label={{
                    value: `Ref: ${referencePrice.toLocaleString()}`, 
                    position: 'top', 
                    fill: '#D1A617', 
                    fontSize: 10
                  }}
                />
              )}
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
              <XAxis dataKey="price" tick={false} axisLine={{ stroke: '#4B5563' }} />
              <YAxis 
                domain={['dataMin - 1', 'dataMax + 1']} 
                tick={{ fontSize: 10, fill: '#9CA3AF' }} 
                axisLine={{ stroke: '#4B5563' }} 
              />
              <Tooltip content={<CustomTooltip />} />
              {showCurve && (
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#A855F7"
                  fill="#A855F730" // Transparent purple fill
                  strokeWidth={2}
                  dot={false}
                  connectNulls
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Volume Bars */}
        <div className="h-40 mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 0, right: 10, left: 10, bottom: 0 }} barGap={0} barCategoryGap={0}>
              {showReferenceLine && (
                <ReferenceLine
                  x={data.findIndex(item => item.price >= referencePrice)}
                  stroke="#D1A617"
                  strokeDasharray="3 3"
                  strokeWidth={1}
                />
              )}
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
              <XAxis dataKey="price" tick={false} axisLine={{ stroke: '#4B5563' }} />
              <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={{ stroke: '#4B5563' }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="volumeDown" fill="#F97316" stackId="stack" radius={[2, 2, 0, 0]} />
              <Bar dataKey="volumeUp" fill="#3B82F6" stackId="stack" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Price Labels */}
        <div className="flex justify-between px-2 mt-1 text-gray-400 text-xs">
          <span>20,000</span>
          <span>22,000</span>
          <span className="text-yellow-400">{referencePrice.toLocaleString()}</span>
          <span>26,000</span>
          <span>28,000</span>
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
};

export default Velocity_Index;
