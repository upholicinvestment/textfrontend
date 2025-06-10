import { useEffect, useState, useRef } from 'react';
import { FiArrowUpRight, FiArrowDownRight } from 'react-icons/fi';
import { motion } from 'framer-motion';

interface RawStockData {
  security_id: number;
  LTP: string;
  volume: number;
  open: string;
  close: string;
  high?: string;
  low?: string;
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
  3456: { symbol: 'TATAMOTORS', name: 'Tata Motors' },
};

const PriceScroll = () => {
  const [stocks, setStocks] = useState<StockData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);
  const scrollPositionRef = useRef(0);
  const [isPaused, setIsPaused] = useState(false);

  // Much faster scroll speed
  const SCROLL_SPEED = 1.5; // pixels per frame (60fps = ~90px/second)
  
  const fetchStocks = async () => {
    try {
      // Mock data for demonstration since localhost might not be available
      const mockData: RawStockData[] = [
        { security_id: 3499, LTP: '145.50', volume: 125000, open: '142.00', close: '143.20' },
        { security_id: 4306, LTP: '2850.75', volume: 85000, open: '2820.00', close: '2835.50' },
        { security_id: 10604, LTP: '1245.30', volume: 195000, open: '1235.00', close: '1240.80' },
        { security_id: 1363, LTP: '485.20', volume: 165000, open: '480.50', close: '482.30' },
        { security_id: 13538, LTP: '1685.90', volume: 125000, open: '1675.00', close: '1680.25' },
        { security_id: 11723, LTP: '920.45', volume: 245000, open: '915.00', close: '918.70' },
        { security_id: 2885, LTP: '2950.80', volume: 385000, open: '2935.00', close: '2945.60' },
        { security_id: 1594, LTP: '1825.40', volume: 285000, open: '1815.00', close: '1820.90' }
      ];

      const newStocks: StockData[] = mockData
        .filter(stock => symbolMap[stock.security_id])
        .map(stock => {
          const { symbol, name } = symbolMap[stock.security_id];
          const currentPrice = parseFloat(stock.LTP);
          const previousClose = parseFloat(stock.close);
          const openPrice = parseFloat(stock.open);

          const changePercent = ((currentPrice - previousClose) / previousClose) * 100;
          const intradayChangePercent = ((currentPrice - openPrice) / openPrice) * 100;

          return {
            symbol,
            name,
            price: currentPrice,
            changePercent,
            intradayChangePercent,
            volume: stock.volume
          };
        });

      setStocks(newStocks);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching stocks:', error);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStocks();
    const intervalId = setInterval(fetchStocks, 5000);
    return () => clearInterval(intervalId);
  }, []);

  // Optimized smooth scrolling animation
  const animate = () => {
    if (!scrollContainerRef.current || isPaused) return;
    
    const container = scrollContainerRef.current;
    
    const scrollWidth = container.scrollWidth;
    
    // Calculate the width of one complete set of stocks
    const singleSetWidth = scrollWidth / 4; // We have 4 copies
    
    scrollPositionRef.current += SCROLL_SPEED;
    
    // Reset smoothly when we've scrolled through one complete set
    if (scrollPositionRef.current >= singleSetWidth) {
      scrollPositionRef.current = 0;
    }
    
    container.scrollLeft = scrollPositionRef.current;
    animationRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    if (stocks.length > 0 && !isPaused) {
      animationRef.current = requestAnimationFrame(animate);
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [stocks, isPaused]);

  const handleMouseEnter = () => {
    setIsPaused(true);
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
  };

  const handleMouseLeave = () => {
    setIsPaused(false);
    if (!animationRef.current) {
      animationRef.current = requestAnimationFrame(animate);
    }
  };

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

  // Create 4 copies for seamless infinite scroll
  const repeatedStocks = [...stocks, ...stocks, ...stocks, ...stocks];

  return (
    <div 
      className="w-full bg-gradient-to-r from-gray-900 to-gray-800 overflow-hidden py-3 border-y border-gray-700 shadow-lg relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Live indicator */}
      <div className="absolute left-4 top-1/2 transform -translate-y-1/2 z-20 bg-gray-900/80 px-4 py-2">
        <div className="flex items-center">
          <div className="relative">
            <div className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full animate-pulse"></div>
            <span className="font-bold text-white text-sm tracking-wider">LIVE</span>
          </div>
        </div>
      </div>

      <div
        ref={scrollContainerRef}
        className="flex overflow-x-hidden whitespace-nowrap items-center pl-20"
        style={{ 
          scrollBehavior: 'auto',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}
      >
        {repeatedStocks.map((stock, index) => (
          <motion.div
            key={`${stock.symbol}-${index}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: (index % stocks.length) * 0.02 }}
            whileHover={{ 
              scale: 1.05, 
              transition: { duration: 0.2 },
              backgroundColor: 'rgba(55, 65, 81, 0.8)'
            }}
            className="inline-flex items-center px-4 mx-2 py-2 bg-gray-800 rounded-xl shadow-md border border-gray-700 hover:border-gray-500 transition-all cursor-pointer"
          >
            <div className="flex flex-col min-w-[120px]">
              <div className="flex items-center space-x-2">
                <span className="font-bold text-white">{stock.symbol}</span>
                {stock.changePercent >= 0 ? (
                  <FiArrowUpRight className="text-green-400 text-sm" />
                ) : (
                  <FiArrowDownRight className="text-red-400 text-sm" />
                )}
              </div>
              <span className="text-xs text-gray-400 truncate">{stock.name}</span>
            </div>

            <div className="flex flex-col items-end ml-3">
              <span className={`font-medium ${stock.changePercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                ₹{stock.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
              <div className="flex items-center">
                <span className={`text-xs font-medium ${stock.changePercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {stock.changePercent >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
                </span>
                <span className="text-xs text-gray-400 ml-2">• Vol: {stock.volume.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Gradient overlays for smooth edges */}
      <div className="absolute top-0 left-0 w-20 h-full bg-gradient-to-r from-gray-900 to-transparent z-10 pointer-events-none"></div>
      <div className="absolute top-0 right-0 w-20 h-full bg-gradient-to-l from-gray-900 to-transparent z-10 pointer-events-none"></div>
      
      {/* Hide scrollbar */}
      <style >{`
        div::-webkit-scrollbar {
          display: none;
        }
      `}</style>
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