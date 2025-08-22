import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";

interface CardData {
  id: number;
  place: string;
  title: string;
  title2: string;
  description: string;
  image: string;
}

type OrbProps = {
  /** Set height in px (e.g., 600) or in vh (e.g., "80vh"). Default: 700px */
  height?: number | string;
};

export default function Orb({ height = 680 }: OrbProps) {
  // ---- height handling ----
  const heightIsVh = typeof height === "string";
  const CONTAINER_HEIGHT_PX = heightIsVh
    ? Math.max(0, Math.round((Number.parseFloat(height) / 100) * window.innerHeight || 700))
    : (height as number);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [offsetTop, setOffsetTop] = useState(200);
  const [offsetLeft, setOffsetLeft] = useState(700);
  const [, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  const containerRef = useRef<HTMLDivElement | null>(null);
  const animationRef = useRef<number | null>(null);
  const autoScrollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const data: CardData[] = [
    {
      id: 0,
      place: "Market Analysis",
      title: "TECHNICAL",
      title2: "SCANNER",
      description:
        "Our advanced technical scanner identifies patterns, trends, and key support/resistance levels across multiple timeframes to help you make informed trading decisions.",
      image:
        "https://www.carsongroup.com/wp-content/uploads/2024/05/GettyImages-1645923179-1980x1304.jpg",
    },
    {
      id: 1,
      place: "Company Analysis",
      title: "FUNDAMENTAL",
      title2: "SCANNER",
      description:
        "Comprehensive fundamental analysis tool that screens stocks based on financial metrics, valuation ratios, and growth indicators to identify quality investments.",
      image:
        "https://img.freepik.com/premium-photo/close-view-monitor-displaying-live-stock-market-chart_975188-94465.jpg",
    },
    {
      id: 2,
      place: "Strategy Testing",
      title: "ALGO",
      title2: "SIMULATOR",
      description:
        "Backtest and optimize your trading strategies with our powerful algorithm simulator. Test various parameters and market conditions to refine your approach.",
      image:
        "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
    },
    {
      id: 3,
      place: "Derivatives Market",
      title: "FNO",
      title2: "KHAZANA",
      description:
        "Your treasure trove for Futures and Options data. Analyze open interest, PCR, premium decay, and max pain theory for better derivatives trading.",
      image: "https://wallpaperaccess.com/full/1393720.jpg",
    },
    {
      id: 4,
      place: "Trade Analysis",
      title: "JOURNALING",
      title2: "PLATFORM",
      description:
        "Systematically record, analyze, and improve your trading performance. Track your trades, identify patterns in your wins and losses, and refine your strategy.",
      image:
        "https://assets.technologyadvice.com/uploads/2023/05/AdobeStock-558328967-scaled-e1683576636349.jpeg",
    },
    {
      id: 5,
      place: "Market Liquidity",
      title: "FIIs/DIIs",
      title2: "DATA",
      description:
        "Monitor Foreign Institutional Investors and Domestic Institutional Investors activity with our comprehensive data dashboard to gauge market sentiment.",
      image: "https://morganfranklinfoundation.org/wp-content/uploads/stockbrokers.jpg",
    },
  ];

  // card row sizes
  const cardWidth = 220;
  const cardHeight = 320;
  const gap = 30;

  // Auto-scroll
  const startAutoScroll = () => {
    if (autoScrollRef.current) clearInterval(autoScrollRef.current);
    autoScrollRef.current = setInterval(() => {
      handleNext();
    }, 4000);
  };

  const stopAutoScroll = () => {
    if (autoScrollRef.current) {
      clearInterval(autoScrollRef.current);
      autoScrollRef.current = null;
    }
  };

  useEffect(() => {
    const resolveContainerHeight = () => {
      if (heightIsVh) {
        const vhVal = Number.parseFloat(height as string);
        return Math.max(0, Math.round((vhVal / 100) * window.innerHeight));
      }
      return CONTAINER_HEIGHT_PX;
    };

    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });

      const h =
        containerRef.current?.clientHeight !== undefined
          ? containerRef.current.clientHeight
          : resolveContainerHeight();

      // mini-cards rail sits near the bottom of the container (like original)
      setOffsetTop(Math.max(0, h - 430));
      // stick the rail toward right edge
      setOffsetLeft(Math.max(0, window.innerWidth - 830));
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    // Initial cover animation
    const timer = setTimeout(() => {
      const cover = document.querySelector(".cover");
      if (cover) cover.classList.add("translate-x-full");
    }, 500);

    // Start auto-scroll
    startAutoScroll();

    return () => {
      window.removeEventListener("resize", handleResize);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (autoScrollRef.current) clearInterval(autoScrollRef.current);
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [height, heightIsVh, CONTAINER_HEIGHT_PX]);

  const handleNext = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentIndex((prev) => (prev + 1) % data.length);
    setTimeout(() => setIsAnimating(false), 1000);
    stopAutoScroll();
    startAutoScroll();
  };

  const handlePrev = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentIndex((prev) => (prev - 1 + data.length) % data.length);
    setTimeout(() => setIsAnimating(false), 1000);
    stopAutoScroll();
    startAutoScroll();
  };


  // container height style
  const containerStyle =
    typeof height === "string"
      ? { height }
      : { height: `${CONTAINER_HEIGHT_PX}px` };

  return (
    <div
      ref={containerRef}
      className="relative w-full bg-gradient-to-br from-gray-900 to-gray-950 text-white overflow-hidden font-inter"
      style={containerStyle}
      onMouseEnter={stopAutoScroll}
      onMouseLeave={startAutoScroll}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,_rgba(255,255,255,0.15)_1px,_transparent_0)] bg-[size:20px_20px]"></div>
      </div>

      {/* Cards */}
      {data.map((item, index) => {
        const position = (index - currentIndex + data.length) % data.length;
        const isActive = position === 0;

        const cardStyle: React.CSSProperties = isActive
          ? {
              width: "100%",
              height: "100%",
              top: 0,
              left: 0,
              zIndex: 20,
              borderRadius: 0,
            }
          : {
              width: `${cardWidth}px`,
              height: `${cardHeight}px`,
              top: `${offsetTop}px`,
              left: `${offsetLeft + (position - 1) * (cardWidth + gap)}px`,
              zIndex: 30 - position,
              borderRadius: "12px",
            };

        return (
          <div
            key={item.id}
            className="absolute bg-cover bg-center shadow-xl transition-all duration-700 overflow-hidden group"
            style={cardStyle}
          >
            {/* Image */}
            <div
              className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
              style={{ backgroundImage: `url(${item.image})` }}
            />
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

            {!isActive && (
              <div
                className="absolute text-white p-5 transition-all duration-700 z-10"
                style={{
                  bottom: 0,
                  left: 0,
                  right: 0,
                  zIndex: 40,
                }}
              >
                <div className="w-7 h-1 text-amber-400 bg-amber-400 rounded-full mb-3"></div>
                <div className="text-xs font-medium uppercase tracking-wider text-gray-300 mb-1">
                  {item.place}
                </div>
                <div className="font-oswald font-semibold text-lg leading-tight">
                  {item.title}
                </div>
                <div className="font-oswald font-semibold text-lg leading-tight">
                  {item.title2}
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Details Panel */}
      <div className="absolute left-8 md:left-16 z-30 transition-all duration-700 top-1/2 transform -translate-y-1/2 max-w-[90vw] md:max-w-xl">
        <div className="h-12 overflow-hidden mb-2">
          <div className="pt-4 text-lg md:text-xl relative text-amber-400 font-medium uppercase tracking-wider">
            <div className="absolute top-0 left-0 w-7 h-1 bg-amber-400 rounded-full"></div>
            {data[currentIndex].place}
          </div>
        </div>

        <div className="h-20 md:h-24 overflow-hidden">
          <div className="font-oswald font-bold text-4xl md:text-6xl bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            {data[currentIndex].title}
          </div>
        </div>

        <div className="h-20 md:h-24 overflow-hidden -mt-3">
          <div className="font-oswald font-bold text-4xl md:text-6xl bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            {data[currentIndex].title2}
          </div>
        </div>

        <div className="w-[90vw] max-w-[500px] mt-4 text-sm md:text-base text-gray-200 leading-relaxed">
          {data[currentIndex].description}
        </div>

        <div className="w-[90vw] max-w-[500px] mt-8 flex items-center space-x-4">
          <button className="w-10 h-10 bg-amber-500 hover:bg-amber-600 rounded-full flex items-center justify-center text-white transition-all duration-300 shadow-lg hover:shadow-amber-500/20">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-5 h-5"
            >
              <path
                fillRule="evenodd"
                d="M6.32 2.577a49.255 49.255 0 0111.36 0c1.497.174 2.57 1.46 2.57 2.93V21a.75.75 0 01-1.085.67L12 18.089l-7.165 3.583A.75.75 0 013.75 21V5.507c0-1.47 1.073-2.756 2.57-2.93z"
                clipRule="evenodd"
              />
            </svg>
          </button>

          <Link to="/signup">
            <button className="border border-amber-500 bg-amber-500/10 hover:bg-amber-500/20 h-10 rounded-full text-white px-6 text-sm uppercase font-medium transition-all duration-300 flex items-center group">
              Explore Feature
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 20 20" 
                fill="currentColor" 
                className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform"
              >
                <path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clipRule="evenodd" />
              </svg>
            </button>
          </Link>
        </div>
      </div>

      {/* Pagination */}
      <div
        className="absolute inline-flex z-[60] transition-all duration-700 items-center"
        style={{
          bottom: "60px",
          left: "50%",
          transform: "translateX(-50%)",
        }}
      >
        <div
          className="w-12 h-12 rounded-full border border-white/20 bg-gray-900/80 backdrop-blur-sm flex items-center justify-center cursor-pointer hover:border-amber-500/60 hover:bg-amber-500/10 transition-all duration-300"
          onClick={handlePrev}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            className="w-6 h-6 stroke-2 text-white/80 hover:text-amber-400 transition-colors"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 19.5L8.25 12l7.5-7.5"
            />
          </svg>
        </div>

        <div className="mx-6 z-[60] w-[300px] md:w-[400px] flex items-center">
          <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-amber-600 transition-all duration-700 rounded-full"
              style={{ width: `${(100 / data.length) * (currentIndex + 1)}%` }}
            ></div>
          </div>
        </div>

        <div
          className="w-12 h-12 rounded-full border border-white/20 bg-gray-900/80 backdrop-blur-sm flex items-center justify-center cursor-pointer hover:border-amber-500/60 hover:bg-amber-500/10 transition-all duration-300"
          onClick={handleNext}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            className="w-6 h-6 stroke-2 text-white/80 hover:text-amber-400 transition-colors"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8.25 4.5l7.5 7.5-7.5 7.5"
            />
          </svg>
        </div>

        <div className="ml-6 flex items-center text-sm text-gray-300 font-medium">
          <span className="text-amber-400 text-lg font-bold">{currentIndex + 1}</span>
          <span className="mx-1">/</span>
          <span>{data.length}</span>
        </div>
      </div>

      {/* Indicator Dots */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-40 flex space-x-2">
        {data.map((_, index) => (
          <button
            key={index}
            onClick={() => {
              if (!isAnimating && index !== currentIndex) {
                setIsAnimating(true);
                setCurrentIndex(index);
                setTimeout(() => setIsAnimating(false), 1000);
                stopAutoScroll();
                startAutoScroll();
              }
            }}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              index === currentIndex 
                ? "w-6 bg-amber-500" 
                : "bg-white/30 hover:bg-white/50"
            }`}
          />
        ))}
      </div>

      {/* Cover animation */}
      <div className="cover absolute top-0 left-0 w-full h-full bg-white z-[100] transition-transform duration-700 ease-in-out"></div>
    </div>
  );
}