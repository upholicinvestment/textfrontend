import { useEffect, useState, useRef, useCallback } from 'react';
import { FiArrowUpRight, FiArrowDownRight } from 'react-icons/fi';

interface RawStockData {
  security_id: number;
  LTP: string;
  volume: number;
  open: string;
  close: string;
  received_at: string;
}

interface StockData {
  symbol: string;
  name: string;
  price: number;
  changePercent: number;
  volume: number;
  intradayChangePercent?: number;
  lastUpdated?: number;
  receivedAt?: string;
}

const symbolMap: Record<number, { symbol: string; name: string }> = {
  65226: { symbol: 'TITAN', name: '	Titan Company' },
  64452: { symbol: 'INDUSINDBK', name: 'IndusInd Bank' },
  65035: { symbol: 'SBILIFE', name: 'SBI Life Insurance' },
  65231: { symbol: 'TRENT', name: 'Trent Ltd' },
  64904: { symbol: 'MARUTI', name: 'Maruti Suzuki India' },
  65124: { symbol: 'SHRIRAMFIN', name: 'Shriram Finance' },
  64390: { symbol: 'COALINDIA', name: 'Coal India Ltd' },
  64405: { symbol: 'EICHERMOT', name: 'Eicher Motors Ltd' },
  64220: { symbol: 'BAJFINANCE', name: 'Bajaj Finance Ltd' },
  64229: { symbol: 'BHARTIARTL', name: 'Bharti Airtel Ltd' },
};

const API_URL = 'https://api.upholictech.com/api/stocks';
const CARD_WIDTH = 320;
const BASE_SCROLL_SPEED = 40;
const SCROLL_ACCELERATION = 2;
const MAX_SPEED = 50;
const REFRESH_INTERVAL = 5000;
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

const PriceScroll = () => {
  const [stocks, setStocks] = useState<StockData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'reconnecting'>('connected');
  
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);
  const scrollPositionRef = useRef(0);
  const currentSpeedRef = useRef(BASE_SCROLL_SPEED);
  const lastTimestampRef = useRef(0);
  const rafActiveRef = useRef(false);
  const refreshIntervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryCountRef = useRef(0);

  const processStockData = useCallback((rawData: RawStockData[]): StockData[] => {
    const processed: StockData[] = [];
    const now = new Date();

    rawData.forEach(stock => {
      try {
        const details = symbolMap[stock.security_id];
        if (!details) {
          console.warn(`No symbol mapping for security_id: ${stock.security_id}`);
          return;
        }
        
        const currentPrice = parseFloat(stock.LTP);
        const previousClose = parseFloat(stock.close);
        const openPrice = parseFloat(stock.open);
        
        if (isNaN(currentPrice) || isNaN(previousClose) || isNaN(openPrice)) {
          console.warn(`Invalid number values for ${details.symbol}`, {
            LTP: stock.LTP,
            close: stock.close,
            open: stock.open
          });
          return;
        }

        const changePercent = ((currentPrice - previousClose) / previousClose) * 100;
        const intradayChangePercent = ((currentPrice - openPrice) / openPrice) * 100;
        
        processed.push({
          symbol: details.symbol,
          name: details.name,
          price: currentPrice,
          changePercent,
          intradayChangePercent,
          volume: stock.volume || 0,
          lastUpdated: now.getTime(),
          receivedAt: stock.received_at
        });
      } catch (err) {
        console.error(`Error processing stock ${stock.security_id}:`, err);
      }
    });

    return processed.sort((a, b) => a.symbol.localeCompare(b.symbol));
  }, []);

  const fetchStocks = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // console.log(`[FETCH] Calling: ${API_URL}?t=${Date.now()}`);

      const response = await fetch(`${API_URL}?t=${Date.now()}`, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });

      // console.log(`[FETCH] Response status: ${response.status}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const rawData: RawStockData[] = await response.json();
      // console.log(`[FETCH] Raw Data:`, rawData);

      const now = new Date();
      setLastUpdateTime(now.toLocaleTimeString());
      
      const processedData = processStockData(rawData);
      // console.log(`[PROCESS] Processed Data:`, processedData);
      setStocks(processedData);
      setConnectionStatus('connected');
      retryCountRef.current = 0;
    } catch (err) {
      console.error('Error fetching stocks:', err);
      setError(`Error fetching data: ${err instanceof Error ? err.message : String(err)}`);
      
      if (retryCountRef.current < MAX_RETRIES) {
        retryCountRef.current += 1;
        setConnectionStatus('reconnecting');
        setTimeout(fetchStocks, RETRY_DELAY * retryCountRef.current);
      } else {
        setConnectionStatus('disconnected');
      }
    } finally {
      setIsLoading(false);
    }
  }, [processStockData]);

  useEffect(() => {
    fetchStocks();
    refreshIntervalRef.current = setInterval(fetchStocks, REFRESH_INTERVAL);
    
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [fetchStocks]);

  const animate = useCallback((timestamp: number) => {
    if (!lastTimestampRef.current) lastTimestampRef.current = timestamp;
    const deltaTime = (timestamp - lastTimestampRef.current) / 1000;
    lastTimestampRef.current = timestamp;

    if (!rafActiveRef.current) return;

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
    const scrollLimit = stocks.length * CARD_WIDTH;

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

  const visibleCards = Math.ceil(window.innerWidth / CARD_WIDTH) + 1;
  const loopTimes = Math.max(2, Math.ceil(visibleCards / Math.max(1, stocks.length)));
  const repeatedStocks = Array(loopTimes).fill(stocks).flat();

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'bg-gradient-to-r from-green-400 to-emerald-500';
      case 'disconnected': return 'bg-gradient-to-r from-red-400 to-pink-500';
      case 'reconnecting': return 'bg-gradient-to-r from-yellow-400 to-amber-500';
      default: return 'bg-gradient-to-r from-gray-400 to-gray-500';
    }
  };

  if (isLoading && !stocks.length) {
    return (
      <div className="w-full bg-gradient-to-r from-[#0a0b2a] to-[#1a1c3a] overflow-hidden py-3 border-y border-purple-500/20 shadow-lg backdrop-blur-sm">
        <div className="flex justify-center items-center h-16">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full animate-pulse"></div>
            <span className="text-purple-300 font-medium">Loading Live market data...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error && !stocks.length) {
    return (
      <div className="w-full bg-gradient-to-r from-[#0a0b2a] to-[#1a1c3a] overflow-hidden py-3 border-y border-purple-500/20 shadow-lg backdrop-blur-sm">
        <div className="flex justify-center items-center h-16">
          <span className="text-pink-400 bg-pink-900/30 px-4 py-2 rounded-lg">{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className="w-full bg-gradient-to-r from-[#0a0b2a] to-[#1a1c3a] overflow-hidden py-3 border-y border-purple-500/20 shadow-lg relative select-none backdrop-blur-sm"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{ 
        minHeight: 84,
        boxShadow: '0 0 20px rgba(98, 70, 234, 0.15)'
      }}
    >
      {/* Connection status indicator with glow effect */}
      <div className="absolute left-4 top-1/2 transform -translate-y-1/2 z-20 bg-[#0e102b]/90 px-4 py-2 rounded-lg shadow-lg border border-purple-500/30">
        <div className="flex items-center">
          <div className="relative">
            <div className={`absolute -top-1 -right-1 h-3 w-3 ${getConnectionStatusColor()} rounded-full animate-pulse ${connectionStatus === 'connected' ? 'ring-2 ring-purple-400' : ''}`}></div>
            <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400 text-sm tracking-wider">
              LIVE
            </span>
          </div>
          <span className="text-xs text-purple-300/80 ml-2">
            {lastUpdateTime || '--:--:--'}
            {connectionStatus === 'reconnecting' && ' (Reconnecting...)'}
          </span>
        </div>
      </div>

      {/* Scrolling stocks container */}
      <div
        className="flex items-center whitespace-nowrap will-change-transform"
        ref={scrollAreaRef}
        style={{ transform: 'translateX(0)' }}
      >
        {repeatedStocks.map((stock, idx) => (
          <div
            key={`${stock.symbol}-${idx}-${stock.lastUpdated}`}
            className="inline-flex items-center mx-2 px-6 py-3 bg-[#0e102b] rounded-2xl shadow-lg border border-purple-500/20 hover:border-purple-400/50 transition-all cursor-pointer hover:shadow-purple-500/20"
            style={{
              width: CARD_WIDTH,
              minWidth: CARD_WIDTH,
              maxWidth: CARD_WIDTH,
              flexShrink: 0,
              backfaceVisibility: 'hidden',
              backdropFilter: 'blur(4px)',
              boxShadow: '0 4px 15px rgba(98, 70, 234, 0.1)'
            }}
          >
            <div className="flex flex-col min-w-[140px]">
              <div className="flex items-center space-x-2">
                <span className="font-bold text-white truncate" style={{ maxWidth: '120px' }}>
                  {stock.symbol}
                </span>
                {stock.changePercent >= 0 ? (
                  <FiArrowUpRight className="text-green-400 text-lg flex-shrink-0 drop-shadow-[0_0_4px_rgba(74,222,128,0.5)]" />
                ) : (
                  <FiArrowDownRight className="text-red-400 text-lg flex-shrink-0 drop-shadow-[0_0_4px_rgba(248,113,113,0.5)]" />
                )}
              </div>
              <span className="text-xs text-purple-300/70 truncate" style={{ maxWidth: '160px' }}>
                {stock.name}
              </span>
            </div>
            <div className="flex flex-col items-end ml-4">
              <span className={`font-medium text-lg ${stock.changePercent >= 0 ? 'text-green-400' : 'text-red-400'} drop-shadow-[0_0_4px_${stock.changePercent >= 0 ? 'rgba(74,222,128,0.3)' : 'rgba(248,113,113,0.3)'}]`}>
                ₹{stock.price.toLocaleString('en-IN', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}
              </span>
              <div className="flex items-center">
                <span className={`text-xs font-medium ${stock.changePercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {stock.changePercent >= 0 ? '+' : ''}
                  {stock.changePercent.toFixed(2)}%
                </span>
                <span className="text-xs text-purple-300/60 ml-2">
                  • Vol: {(stock.volume / 1000).toFixed(1)}K
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Gradient fade effects on sides */}
      <div className="absolute top-0 left-0 w-32 h-full bg-gradient-to-r from-[#0a0b2a] via-[#0a0b2a]/90 to-transparent z-10 pointer-events-none"></div>
      <div className="absolute top-0 right-0 w-32 h-full bg-gradient-to-l from-[#0a0b2a] via-[#0a0b2a]/90 to-transparent z-10 pointer-events-none"></div>
      
      {/* Pulsing cosmic energy effect when paused */}
      {isPaused && (
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-blue-500/5 pointer-events-none animate-pulse"></div>
      )}
    </div>
  );
};

export default PriceScroll;