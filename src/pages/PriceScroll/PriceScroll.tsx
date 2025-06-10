import { useEffect, useState, useRef, useCallback } from 'react';
import { FiArrowUpRight, FiArrowDownRight } from 'react-icons/fi';

interface RawStockData {
  security_id: number;
  LTP: string;
  volume: number;
  open: string;
  close: string;
}

interface StockData {
  symbol: string;
  name: string;
  price: number;
  changePercent: number;
  volume: number;
  intradayChangePercent?: number;
}

const symbolMap: { [key: number]: { symbol: string; name: string } } = {
   3499: { symbol: 'TATASTEEL', name: 'Tata Steel' },
   4306: { symbol: 'SHRIRAMFIN', name: 'Shriram Finance' },
   10604: { symbol: 'BHARTIARTL', name: 'Bharti Airtel' },
   1363: { symbol: 'HINDALCO', name: 'Hindalco Industries' },
   13538: { symbol: 'TECHM', name: 'Tech Mahindra' },
   11723: { symbol: 'JSWSTEEL', name: 'JSW Steel' },
   5097: { symbol: 'ETERNAL', name: 'Eternal' },
   25: { symbol: 'ADANIENT', name: 'Adani Enterprises' },
   2475: { symbol: 'ONGC', name: 'Oil & Natural Gas Corporation' },
   1594: { symbol: 'INFY', name: 'Infosys' },
   2031: { symbol: 'M&M', name: 'Mahindra & Mahindra' },
   16669: { symbol: 'BAJAJ-AUTO', name: 'Bajaj Auto' },
   1964: { symbol: 'TRENT', name: 'Trent' },
   11483: { symbol: 'LT', name: 'Larsen & Toubro' },
   1232: { symbol: 'GRASIM', name: 'Grasim Industries' },
   7229: { symbol: 'HCLTECH', name: 'HCL Technologies' },
   2885: { symbol: 'RELIANCE', name: 'Reliance Industries' },
   16675: { symbol: 'BAJAJFINSV', name: 'Bajaj Finserv' },
   11536: { symbol: 'TCS', name: 'Tata Consultancy Services' },
   10999: { symbol: 'MARUTI', name: 'Maruti Suzuki' },
   18143: { symbol: 'JIOFIN', name: 'Jio Financial Services' },
   3432: { symbol: 'TATACONSUM', name: 'Tata Consumer Products' },
   3506: { symbol: 'TITAN', name: 'Titan' },
   467: { symbol: 'HDFCLIFE', name: 'HDFC Life Insurance' },
   910: { symbol: 'EICHERMOT', name: 'Eicher Motors' },
   3787: { symbol: 'WIPRO', name: 'Wipro' },
   15083: { symbol: 'ADANIPORTS', name: 'Adani Ports & SEZ' },
   21808: { symbol: 'SBILIFE', name: 'SBI Life Insurance' },
   1660: { symbol: 'ITC', name: 'ITC' },
   3045: { symbol: 'SBIN', name: 'State Bank of India' },
   157: { symbol: 'APOLLOHOSP', name: 'Apollo Hospitals' },
   881: { symbol: 'DRREDDY', name: 'Dr Reddys Laboratories' },
   4963: { symbol: 'ICICIBANK', name: 'ICICI Bank' },
   383: { symbol: 'BEL', name: 'Bharat Electronics' },
   317: { symbol: 'BAJFINANCE', name: 'Bajaj Finance' },
   11532: { symbol: 'ULTRACEMCO', name: 'UltraTech Cement' },
   11630: { symbol: 'NTPC', name: 'NTPC' },
   3351: { symbol: 'SUNPHARMA', name: 'Sun Pharmaceutical' },
   14977: { symbol: 'POWERGRID', name: 'Power Grid Corporation of India' },
   1922: { symbol: 'KOTAKBANK', name: 'Kotak Mahindra Bank' },
   5258: { symbol: 'INDUSINDBK', name: 'Indusind Bank' },
   5900: { symbol: 'AXISBANK', name: 'Axis Bank' },
   17963: { symbol: 'NESTLEIND', name: 'Nestle' },
   1394: { symbol: 'HINDUNILVR', name: 'Hindustan Unilever' },
   1333: { symbol: 'HDFCBANK', name: 'HDFC Bank' },
   1348: { symbol: 'HEROMOTOCO', name: 'Hero Motocorp' },
   694: { symbol: 'CIPLA', name: 'Cipla' },
   236: { symbol: 'ASIANPAINT', name: 'Asian Paints' },
   3456: { symbol: 'TATAMOTORS', name: 'Tata Motors' }, };

const API_URL = 'http://localhost:8000/api/stocks';
const CARD_WIDTH = 320;
const BASE_SCROLL_SPEED = 50; // px/sec
const SCROLL_ACCELERATION = 2;
const MAX_SPEED = 150;

const PriceScroll = () => {
   const [stocks, setStocks] = useState<StockData[]>([]);
   const [isLoading, setIsLoading] = useState(true);
   const [isPaused, setIsPaused] = useState(false);
   const scrollAreaRef = useRef<HTMLDivElement>(null);
   const animationRef = useRef<number | null>(null);
   const scrollPositionRef = useRef(0);
   const currentSpeedRef = useRef(BASE_SCROLL_SPEED);
   const lastTimestampRef = useRef(0);
   const rafActiveRef = useRef(false);

   // Get only latest tick per security_id
   const fetchStocks = useCallback(async () => {
     try {
       const response = await fetch(API_URL);
       const rawData: RawStockData[] = await response.json();
       const latestById: { [key: number]: RawStockData } = {};
       rawData.forEach(stock => {
         latestById[stock.security_id] = stock;
       });

       const newStocks: StockData[] = Object.values(latestById)
         .filter(stock => symbolMap[stock.security_id])
         .map(stock => {
           const { symbol, name } = symbolMap[stock.security_id];
           const currentPrice = parseFloat(stock.LTP);
           const previousClose = parseFloat(stock.close);
           const openPrice = parseFloat(stock.open);
           const changePercent = ((currentPrice - previousClose) /
previousClose) * 100;
           const intradayChangePercent = ((currentPrice - openPrice) /
openPrice) * 100;
           return {
             symbol,
             name,
             price: currentPrice,
             changePercent,
             intradayChangePercent,
             volume: stock.volume,
           };
         });
       setStocks(newStocks);
       setIsLoading(false);
     } catch (error) {
       console.error('Error fetching stocks:', error);
       setIsLoading(false);
     }
   }, []);

   useEffect(() => {
     fetchStocks();
     const intervalId = setInterval(fetchStocks, 5000);
     return () => clearInterval(intervalId);
   }, [fetchStocks]);

   const animate = useCallback((timestamp: number) => {
     if (!lastTimestampRef.current) lastTimestampRef.current = timestamp;
     const deltaTime = (timestamp - lastTimestampRef.current) / 1000; // seconds
     lastTimestampRef.current = timestamp;

     if (!rafActiveRef.current) return;

     // Easing
     if (isPaused) {
       currentSpeedRef.current = Math.max(0, currentSpeedRef.current - SCROLL_ACCELERATION * deltaTime * 60);
     } else {
       currentSpeedRef.current = Math.min(MAX_SPEED, currentSpeedRef.current + SCROLL_ACCELERATION * deltaTime * 60);
     }

     if (currentSpeedRef.current <= 0) {
       animationRef.current = requestAnimationFrame(animate);
       return;
     }

     const scrollDistance = currentSpeedRef.current * deltaTime;
     scrollPositionRef.current += scrollDistance;

     // Calculate the total width of all unique stock cards
     const scrollLimit = stocks.length * CARD_WIDTH;

     // When we've scrolled the full width, reset position to 0 seamlessly
     if (scrollPositionRef.current >= scrollLimit) {
       scrollPositionRef.current = scrollPositionRef.current % scrollLimit;
     }

     if (scrollAreaRef.current) {
       scrollAreaRef.current.style.transform = `translateX(-${scrollPositionRef.current}px)`;
     }

     animationRef.current = requestAnimationFrame(animate);
   }, [stocks.length, isPaused]);

   useEffect(() => {
     if (!stocks.length) return;
     rafActiveRef.current = true;
     animationRef.current = requestAnimationFrame(animate);
     return () => {
       rafActiveRef.current = false;
       if (animationRef.current) cancelAnimationFrame(animationRef.current);
     };
   }, [animate, stocks.length]);

   const handleMouseEnter = () => setIsPaused(true);
   const handleMouseLeave = () => setIsPaused(false);

   // Repeat only as much as needed to cover at least two screenfuls (even with 1 or 2 stocks)
   const visibleCards = Math.ceil(window.innerWidth / CARD_WIDTH) + 1;
   const loopTimes = Math.max(2, Math.ceil(visibleCards / Math.max(1, stocks.length)));
   const repeatedStocks = Array(loopTimes).fill(stocks).flat();

   if (isLoading) {
     return (
       <div className="w-full bg-gradient-to-r from-gray-900 to-gray-800 overflow-hidden py-3 border-y border-gray-700 shadow-lg">
         <div className="flex justify-center items-center h-16">
           <div className="flex items-center space-x-2">
             <div className="w-4 h-4 bg-blue-500 rounded-full animate-pulse"></div>
             <span className="text-white">Loading market data...</span>
           </div>
         </div>
       </div>
     );
   }

   if (!stocks.length) {
     return (
       <div className="w-full bg-gradient-to-r from-gray-900 to-gray-800 overflow-hidden py-3 border-y border-gray-700 shadow-lg">
         <div className="flex justify-center items-center h-16">
           <span className="text-white">No stocks to display.</span>
         </div>
       </div>
     );
   }

   return (
     <div
       className="w-full bg-gradient-to-r from-gray-900 to-gray-800 overflow-hidden py-3 border-y border-gray-700 shadow-lg relative select-none"
       onMouseEnter={handleMouseEnter}
       onMouseLeave={handleMouseLeave}
       style={{ minHeight: 84 }}
     >
       {/* Live indicator */}
       <div className="absolute left-4 top-1/2 transform
-translate-y-1/2 z-20 bg-gray-900/80 px-4 py-2 rounded-lg shadow">
         <div className="flex items-center">
           <div className="relative">
             <div className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full animate-pulse"></div>
             <span className="font-bold text-white text-sm tracking-wider">LIVE</span>
           </div>
         </div>
       </div>

       {/* The animated scroll area (only one transform!) */}
       <div
         className="flex items-center whitespace-nowrap will-change-transform"
         ref={scrollAreaRef}
         style={{ transform: 'translateX(0)' }}
       >
         {repeatedStocks.map((stock, idx) => (
           <div
             key={`${stock.symbol}-${idx}`}
             className="inline-flex items-center mx-2 px-6 py-3
bg-gray-800 rounded-2xl shadow-md border border-gray-700
hover:border-gray-400 transition-all cursor-pointer"
             style={{
               width: CARD_WIDTH,
               minWidth: CARD_WIDTH,
               maxWidth: CARD_WIDTH,
               flexShrink: 0,
               backfaceVisibility: 'hidden',
             }}
           >
             <div className="flex flex-col min-w-[140px]">
               <div className="flex items-center space-x-2">
                 <span className="font-bold text-white truncate" 
style={{ maxWidth: '120px' }}>{stock.symbol}</span>
                 {stock.changePercent >= 0 ? (
                   <FiArrowUpRight className="text-green-400 text-lg flex-shrink-0" />
                 ) : (
                   <FiArrowDownRight className="text-red-400 text-lg flex-shrink-0" />
                 )}
               </div>
               <span className="text-xs text-gray-400 truncate" style={{
maxWidth: '160px' }}>{stock.name}</span>
             </div>
             <div className="flex flex-col items-end ml-4">
               <span className={`font-medium text-lg ${stock.changePercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                 ₹{stock.price.toLocaleString('en-IN', {
minimumFractionDigits: 2 })}
               </span>
               <div className="flex items-center">
                 <span className={`text-xs font-medium ${stock.changePercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                   {stock.changePercent >= 0 ? '+' : ''}
                   {stock.changePercent.toFixed(2)}%
                 </span>
                 <span className="text-xs text-gray-400 ml-2">• Vol: 
{(stock.volume / 1000).toFixed(1)}K</span>
               </div>
             </div>
           </div>
         ))}
       </div>

       {/* Gradient overlays */}
       <div className="absolute top-0 left-0 w-32 h-full bg-gradient-to-r from-gray-900 via-gray-900/90 to-transparent z-10 pointer-events-none"></div>
       <div className="absolute top-0 right-0 w-32 h-full bg-gradient-to-l from-gray-900 via-gray-900/90 to-transparent z-10 pointer-events-none"></div>
     </div>
   );
};

export default PriceScroll;







// import { motion } from 'framer-motion';
// import { FiArrowUpRight, FiArrowDownRight } from 'react-icons/fi';

// interface StockData {
//   symbol: string;
//   name: string;
//   price: number;
//   changePercent: number;
//   volume: number;
//   intradayChangePercent?: number;
// }

// const PriceScroll = () => {
//   // Static mock data
//   const stocks: StockData[] = [
//     { symbol: 'TATASTEEL', name: 'Tata Steel', price: 145.50, changePercent: 1.25, volume: 1250000, intradayChangePercent: 0.75 },
//     { symbol: 'SHRIRAMFIN', name: 'Shriram Finance', price: 2350.75, changePercent: -0.85, volume: 850000, intradayChangePercent: -0.45 },
//     { symbol: 'BHARTIARTL', name: 'Bharti Airtel', price: 1125.25, changePercent: 2.15, volume: 3200000, intradayChangePercent: 1.25 },
//     { symbol: 'HINDALCO', name: 'Hindalco Industries', price: 525.80, changePercent: 0.45, volume: 1800000, intradayChangePercent: 0.30 },
//     { symbol: 'TECHM', name: 'Tech Mahindra', price: 1345.60, changePercent: -1.75, volume: 950000, intradayChangePercent: -0.90 },
//     { symbol: 'JSWSTEEL', name: 'JSW Steel', price: 875.40, changePercent: 0.95, volume: 2100000, intradayChangePercent: 0.50 },
//     { symbol: 'ADANIENT', name: 'Adani Enterprises', price: 3250.25, changePercent: 3.25, volume: 750000, intradayChangePercent: 1.75 },
//     { symbol: 'ONGC', name: 'Oil & Natural Gas Corporation', price: 245.75, changePercent: -0.65, volume: 3800000, intradayChangePercent: -0.35 },
//     { symbol: 'INFY', name: 'Infosys', price: 1650.90, changePercent: 0.85, volume: 2800000, intradayChangePercent: 0.45 },
//     { symbol: 'M&M', name: 'Mahindra & Mahindra', price: 1875.50, changePercent: 1.45, volume: 1200000, intradayChangePercent: 0.80 },
//     { symbol: 'BAJAJ-AUTO', name: 'Bajaj Auto', price: 7850.25, changePercent: -0.95, volume: 450000, intradayChangePercent: -0.50 },
//     { symbol: 'RELIANCE', name: 'Reliance Industries', price: 2850.75, changePercent: 1.15, volume: 3500000, intradayChangePercent: 0.65 },
//     { symbol: 'TCS', name: 'Tata Consultancy Services', price: 3950.25, changePercent: 0.75, volume: 1800000, intradayChangePercent: 0.40 },
//     { symbol: 'HDFCBANK', name: 'HDFC Bank', price: 1650.50, changePercent: -0.45, volume: 4200000, intradayChangePercent: -0.25 },
//     { symbol: 'ICICIBANK', name: 'ICICI Bank', price: 1025.75, changePercent: 1.05, volume: 3800000, intradayChangePercent: 0.60 },
//   ];

//   const scrollPosition = -200; // Static scroll position for demonstration

//   return (
//     <div className="w-full sticky z-20 bg-gradient-to-r from-gray-900 to-gray-800 overflow-hidden py-3 border-y border-gray-700 shadow-lg">
//       <div
//         className="flex whitespace-nowrap items-center"
//         style={{ transform: `translateX(${scrollPosition}px)` }}
//       >
//         <div className="flex items-center mx-6">
//           <div className="relative">
//             <div className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full"></div>
//             <span className="font-bold text-white text-sm tracking-wider">DEMO</span>
//           </div>
//         </div>

//         {stocks.map((stock, index) => (
//           <motion.div
//             key={`${stock.symbol}-${index}`}
//             initial={{ opacity: 0, y: 10 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ duration: 0.3 }}
//             whileHover={{ scale: 1.02 }}
//             className="inline-flex items-center px-5 mx-3 py-2 bg-gray-800 rounded-xl shadow-md border border-gray-700 hover:border-gray-600 transition-all"
//           >
//             <div className="flex flex-col min-w-[140px]">
//               <div className="flex items-center space-x-2">
//                 <span className="font-bold text-white">{stock.symbol}</span>
//                 {stock.changePercent >= 0 ? (
//                   <FiArrowUpRight className="text-green-400 text-sm" />
//                 ) : (
//                   <FiArrowDownRight className="text-red-400 text-sm" />
//                 )}
//               </div>
//               <span className="text-xs text-gray-400 truncate">{stock.name}</span>
//             </div>

//             <div className="flex flex-col items-end ml-4">
//               <span className={`font-medium ${stock.changePercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
//                 ₹{stock.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
//               </span>
//               <div className="flex items-center">
//                 <span className={`text-xs font-medium ${stock.changePercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
//                   {stock.changePercent >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
//                 </span>
//                 <span className="text-xs text-gray-400 ml-2">• Vol: {stock.volume.toLocaleString('en-IN')}</span>
//               </div>
//             </div>
//           </motion.div>
//         ))}
//       </div>

//       <div className="absolute top-0 left-0 w-20 h-full bg-gradient-to-r from-gray-900 to-transparent z-10"></div>
//       <div className="absolute top-0 right-0 w-20 h-full bg-gradient-to-l from-gray-900 to-transparent z-10"></div>
//     </div>
//   );
// };

// export default PriceScroll;