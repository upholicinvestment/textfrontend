import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";

interface CardData {
  id: number;
  place: string;
  title: string;
  title2: string;
  description: string;
  image: string;
  href: string;
}

type OrbProps = {
  railBreakpointPx?: number;
};

export default function Orb({ railBreakpointPx = 1024 }: OrbProps) {
  const WIN = typeof window !== "undefined" ? window : ({} as any);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [offsetTop, setOffsetTop] = useState(200);
  const [offsetLeft, setOffsetLeft] = useState(700);
  const [isLarge, setIsLarge] = useState((WIN.innerWidth || 1280) >= railBreakpointPx);
  const [isClient, setIsClient] = useState(false);
  const isMobile = !isLarge;

  const containerRef = useRef<HTMLDivElement | null>(null);
  const animationRef = useRef<number | null>(null);
  const autoScrollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const data: CardData[] = [
    {
      id: 0,
      place: "Market Analysis",
      title: "TECHNICAL",
      title2: "SCANNER",
      description: "Our advanced technical scanner identifies patterns, trends, and key support/resistance levels across multiple timeframes to help you make informed trading decisions.",
      image: "https://www.carsongroup.com/wp-content/uploads/2024/05/GettyImages-1645923179-1980x1304.jpg",
      href: "/comming-soon",
    },
    {
      id: 1,
      place: "Company Analysis",
      title: "FUNDAMENTAL",
      title2: "SCANNER",
      description: "Comprehensive fundamental analysis tool that screens stocks based on financial metrics, valuation ratios, and growth indicators to identify quality investments.",
      image: "https://img.freepik.com/premium-photo/close-view-monitor-displaying-live-stock-market-chart_975188-94465.jpg",
      href: "/comming-soon",
    },
    {
      id: 2,
      place: "Strategy Testing",
      title: "ALGO",
      title2: "SIMULATOR",
      description: "Backtest and optimize your trading strategies with our powerful algorithm simulator. Test various parameters and market conditions to refine your approach.",
      image: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
      href: "/algo-simulator",
    },
    {
      id: 3,
      place: "Derivatives Market",
      title: "FNO",
      title2: "KHAZANA",
      description: "Your treasure trove for Futures and Options data. Analyze open interest, PCR, premium decay, and max pain theory for better derivatives trading.",
      image: "https://wallpaperaccess.com/full/1393720.jpg",
      href: "fno-khazana",
    },
    {
      id: 4,
      place: "Trade Analysis",
      title: "Trade",
      title2: "Khata",
      description: "Systematically record, analyze, and improve your trading performance. Track your trades, identify patterns in your wins and losses, and refine your strategy.",
      image: "https://assets.technologyadvice.com/uploads/2023/05/AdobeStock-558328967-scaled-e1683576636349.jpeg",
      href: "/Journaling",
    },
    {
      id: 5,
      place: "Market Liquidity",
      title: "FIIs/DIIs",
      title2: "DATA",
      description: "Monitor Foreign Institutional Investors and Domestic Institutional Investors activity with our comprehensive data dashboard to gauge market sentiment.",
      image: "https://morganfranklinfoundation.org/wp-content/uploads/stockbrokers.jpg",
      href: "/fii-dii-fno-home",
    },
  ];

  // Set client-side flag and preload images
  useEffect(() => {
    setIsClient(true);
    try {
      data.forEach((d) => {
        const img = new Image();
        img.src = d.image;
      });
    } catch (_) {}
  }, []);

  // card row sizes (only used on large screens)
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
    if (!isClient) return;

    const handleResize = () => {
      const w = WIN.innerWidth || railBreakpointPx;
      setIsLarge(w >= railBreakpointPx);

      const containerHeight = containerRef.current?.clientHeight || WIN.innerHeight;
      setOffsetTop(Math.max(0, containerHeight - 430));

      const desiredVisible = w >= 1480 ? 3.5 : w >= 1250 ? 2.5 : w >= railBreakpointPx ? 1.5 : 0;
      const rightPad = 40;
      const railWidth = desiredVisible * (cardWidth + gap);
      setOffsetLeft(Math.max(0, (WIN.innerWidth || 1280) - railWidth - rightPad));
    };

    handleResize();
    WIN.addEventListener?.("resize", handleResize);

    // Remove cover animation after component mounts
    const timer = setTimeout(() => {
      const cover = document.querySelector(".cover");
      if (cover) {
        cover.classList.add("translate-x-full");
        // Remove cover from DOM after animation completes
        setTimeout(() => {
          if (cover.parentNode) {
            cover.parentNode.removeChild(cover);
          }
        }, 700);
      }
    }, 100);

    startAutoScroll();

    return () => {
      WIN.removeEventListener?.("resize", handleResize);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (autoScrollRef.current) clearInterval(autoScrollRef.current);
      clearTimeout(timer);
    };
  }, [isClient, railBreakpointPx]);

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

  // Don't render anything until client-side to avoid hydration issues
  if (!isClient) {
    return (
      <div 
        className="relative w-full bg-gradient-to-br from-gray-900 to-gray-950 text-white overflow-hidden font-inter min-h-[calc(100vh-4rem)]"
        ref={containerRef}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-white">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full bg-gradient-to-br from-gray-900 to-gray-950 text-white overflow-hidden font-inter min-h-[calc(100vh-4rem)]"
      onMouseEnter={stopAutoScroll}
      onMouseLeave={startAutoScroll}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-80">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,_rgba(255,255,255,0.6)_1px,_transparent_0)] bg-[size:20px_20px]"></div>
      </div>

      {/* Legibility scrims */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-[25] w-[72vw] md:w-[60vw] lg:w-[48vw] bg-gradient-to-r from-black/90 via-black/60 to-transparent hidden lg:block"></div>
      <div className="pointer-events-none absolute inset-0 z-[25] lg:hidden bg-gradient-to-b from-black/60 via-transparent to-black/40"></div>
      <div className="pointer-events-none absolute inset-x-0 top-0 z-[20] h-24 bg-gradient-to-b from-black/40 to-transparent"></div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[20] h-28 bg-gradient-to-t from-black/50 to-transparent"></div>

      {/* Slides */}
      {data.map((item, index) => {
        const position = (index - currentIndex + data.length) % data.length;
        const isActive = position === 0;

        const cardStyle: React.CSSProperties = isMobile
          ? {
              width: "100%",
              height: "100%",
              top: 0,
              left: 0,
              borderRadius: 0,
              zIndex: isActive ? 20 : 10,
              opacity: isActive ? 1 : 0,
              display: "block",
              transition: "opacity 350ms ease",
            }
          : isActive
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
          <Link
            key={item.id}
            to={item.href}
            className={`absolute bg-cover bg-center shadow-xl transition-all duration-700 overflow-hidden group ${
              isActive ? "" : "hidden lg:block"
            }`}
            style={cardStyle}
            aria-hidden={!isActive && !isLarge}
          >
            {/* Image */}
            <div
              className={`absolute inset-0 bg-cover bg-center transition-transform duration-700 ${
                isActive ? "group-hover:scale-[1.02]" : "group-hover:scale-105"
              }`}
              style={{ backgroundImage: `url(${item.image})` }}
            />
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

            {/* Desktop-only mini-card caption */}
            {!isActive && isLarge && (
              <div
                className="absolute text-white p-5 transition-all duration-700 z-10"
                style={{ bottom: 0, left: 0, right: 0, zIndex: 40 }}
              >
                <div className="w-7 h-1 bg-amber-400 rounded-full mb-3"></div>
                <div className="text-xs font-medium uppercase tracking-wider text-gray-300 mb-1">
                  {item.place}
                </div>
                <div className="font-oswald font-semibold text-lg leading-tight">{item.title}</div>
                <div className="font-oswald font-semibold text-lg leading-tight">{item.title2}</div>
              </div>
            )}
          </Link>
        );
      })}

      {/* Details Panel */}
      <div className="absolute z-30 transition-all duration-700 top-1/2 transform -translate-y-1/2 left-1/2 -translate-x-1/2 text-center max-w-[92vw] md:max-w-xl lg:text-left lg:left-12 lg:translate-x-0">
        <div className="h-12 overflow-hidden mb-2">
          <div className="pt-4 text-lg md:text-xl relative text-amber-400 font-medium uppercase tracking-wider" style={{ textShadow: isMobile ? "0 6px 20px rgba(0,0,0,0.85)" : "0 2px 10px rgba(0,0,0,0.6)" }}>
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-7 h-1 bg-amber-400 rounded-full lg:left-0 lg:translate-x-0"></div>
            {data[currentIndex].place}
          </div>
        </div>

        <div className="h-16 md:h-24 overflow-hidden">
          <div className="font-oswald font-bold text-4xl md:text-6xl bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent" style={{ textShadow: isMobile ? "0 8px 28px rgba(0,0,0,0.9)" : "0 3px 16px rgba(0,0,0,0.6)" }}>
            {data[currentIndex].title}
          </div>
        </div>

        <div className="h-16 md:h-24 overflow-hidden -mt-2 md:-mt-3">
          <div className="font-oswald font-bold text-4xl md:text-6xl bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent" style={{ textShadow: isMobile ? "0 8px 28px rgba(0,0,0,0.9)" : "0 3px 16px rgba(0,0,0,0.6)" }}>
            {data[currentIndex].title2}
          </div>
        </div>

        <div className="w-[92vw] max-w-[520px] mt-3 md:mt-4 text-sm md:text-base text-gray-200 leading-relaxed bg-black/35 backdrop-blur-sm rounded-xl ring-1 ring-white/10 px-4 py-3 md:px-5 md:py-4 mx-auto lg:mx-0">
          {data[currentIndex].description}
        </div>

        <div className="w-[92vw] max-w-[520px] mt-6 md:mt-8 flex items-center space-x-4 mx-auto lg:mx-0 justify-center lg:justify-start">
          <Link to={data[currentIndex].href}>
            <button className="border border-amber-500 bg-amber-500/10 hover:bg-amber-500/20 h-10 rounded-full text-white px-6 text-sm uppercase font-medium transition-all duration-300 flex items-center group">
              Explore Feature
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform">
                <path
                  fillRule="evenodd"
                  d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </Link>
        </div>
      </div>

      {/* Pagination */}
      <div
        className="absolute inline-flex z-[60] transition-all duration-700 items-center"
        style={{ bottom: "60px", left: "50%", transform: "translateX(-50%)" }}
      >
        <button
          className="w-10 h-10 md:w-12 md:h-12 rounded-full border border-white/20 bg-gray-900/80 backdrop-blur-sm flex items-center justify-center cursor-pointer hover:border-amber-500/60 hover:bg-amber-500/10 transition-all duration-300"
          onClick={handlePrev}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5 md:w-6 md:h-6 stroke-2 text-white/80 hover:text-amber-400 transition-colors">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>

        <div className="mx-4 md:mx-6 z-[60] w-[220px] md:w-[400px] flex items-center">
          <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-amber-600 transition-all duration-700 rounded-full"
              style={{ width: `${(100 / data.length) * (currentIndex + 1)}%` }}
            ></div>
          </div>
        </div>

        <button
          className="w-10 h-10 md:w-12 md:h-12 rounded-full border border-white/20 bg-gray-900/80 backdrop-blur-sm flex items-center justify-center cursor-pointer hover:border-amber-500/60 hover:bg-amber-500/10 transition-all duration-300"
          onClick={handleNext}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5 md:w-6 md:h-6 stroke-2 text-white/80 hover:text-amber-400 transition-colors">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </button>

        <div className="ml-4 md:ml-6 flex items-center text-sm text-gray-300 font-medium">
          <span className="text-amber-400 text-base md:text-lg font-bold">{currentIndex + 1}</span>
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
              index === currentIndex ? "w-6 bg-amber-500" : "bg-white/30 hover:bg-white/50"
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Cover animation - only rendered on initial load */}
      <div className="cover absolute top-0 left-0 w-full h-full bg-white z-[100] transition-transform duration-700 ease-in-out"></div>
    </div>
  );
}