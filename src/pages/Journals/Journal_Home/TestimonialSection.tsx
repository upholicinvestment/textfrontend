import { useState, useEffect } from "react";
import { FaStar } from "react-icons/fa";
import { FiTrendingUp, FiBarChart2, FiDollarSign, FiTarget, FiAward } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";

const testimonials = [
  {
    title: "Institutional Trading Tools",
    text: "The order flow analytics have transformed our execution strategies. We're seeing 22% improvement in fill rates since implementation. The depth of market visualization is unparalleled in retail platforms.",
    author: "Rohan Mehta",
    role: "Head of Trading, QuantFund",
    rating: 5,
    
    icon: <FiTrendingUp className="text-blue-500" size={24} />,
    color: "bg-[#1e1b38]",
  },
  {
    title: "Retail Trading Suite",
    text: "As a full-time day trader, the volume profile tools have become essential to my strategy. Execution speed is critical, and this platform delivers sub-10ms latency consistently during market openings.",
    author: "Priya Sharma",
    role: "Professional Day Trader",
    rating: 5,

    icon: <FiBarChart2 className="text-emerald-500" size={24} />,
    color: "bg-[#1e1b38]",
  },
  {
    title: "Algorithmic Trading",
    text: "Our quantitative models required precise historical tick data. The platform's API provided clean, normalized data with millisecond precision, reducing our backtesting variance by 18%.",
    author: "Arjun Iyer",
    role: "Quantitative Researcher",
    rating: 5,
  
    icon: <FiDollarSign className="text-amber-500" size={24} />,
    color: "bg-[#1e1b38]",
  },
  {
    title: "Brokerage Integration",
    text: "Integrating with our brokerage infrastructure was seamless. The FIX protocol implementation saved us months of development time for institutional client onboarding.",
    author: "Neha Kapoor",
    role: "CTO, Trading Firm",
    rating: 4,
    
    icon: <FiTarget className="text-purple-500" size={24} />,
    color: "bg-[#1e1b38]",
  },
  {
    title: "Educational Value",
    text: "The platform's educational resources helped our analysts understand complex order flow concepts. The webinar series on market microstructure is the best I've seen for professional development.",
    author: "Vikram Singh",
    role: "Training Director",
    rating: 5,
   
    icon: <FiAward className="text-rose-500" size={24} />,
    color: "bg-[#1e1b38]",
  },
];

const TestimonialSection = () => {
  const [currentSet, setCurrentSet] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [windowWidth, setWindowWidth] = useState(0);

  useEffect(() => {
    setWindowWidth(window.innerWidth);
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getVisibleCount = () => {
    if (windowWidth < 768) return 1;
    if (windowWidth < 1024) return 2;
    return 3;
  };

  const visibleTestimonials = [];
  const visibleCount = getVisibleCount();
  for (let i = 0; i < visibleCount; i++) {
    const index = (currentSet + i) % testimonials.length;
    visibleTestimonials.push(testimonials[index]);
  }

  useEffect(() => {
    if (isHovered) return;
    const interval = setInterval(() => {
      setCurrentSet(prev => (prev + 1) % testimonials.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [isHovered]);

  const handlePrev = () => {
    setCurrentSet(prev => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const handleNext = () => {
    setCurrentSet(prev => (prev + 1) % testimonials.length);
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
    exit: { opacity: 0, y: -20 },
  };

  return (
    <section className="bg-gradient-to-br from-[#0e0f26] via-[#15173c] to-[#1a1c48] py-16 md:py-24 px-4 text-white relative overflow-hidden">
      <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-blue-900/20 to-transparent -z-10" />
      <div className="absolute bottom-0 left-0 w-1/2 h-full bg-gradient-to-r from-purple-900/20 to-transparent -z-10" />

      <div className="max-w-7xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 md:mb-16 px-4"
        >
          <span className="inline-block text-sm uppercase tracking-wider text-blue-400 font-medium mb-4">
            Client Success Stories
          </span>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Trusted by <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">Market Leaders</span>
          </h2>
          <p className="text-gray-300 max-w-2xl mx-auto text-sm md:text-base">
            Hear how our platform is transforming trading operations across institutions and individuals
          </p>
        </motion.div>

        <div 
          className="relative"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 px-4 md:px-0">
            <AnimatePresence mode="wait">
              {visibleTestimonials.map((testimonial, index) => (
                <motion.div
                  key={`${currentSet}-${index}`}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  variants={cardVariants}
                  transition={{ delay: index * 0.1 }}
                  className={`${testimonial.color} rounded-xl p-6 border border-gray-700 hover:border-blue-500 transition-all h-full flex flex-col shadow-lg`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-3 rounded-lg bg-gray-800/50 backdrop-blur-sm">
                      {testimonial.icon}
                    </div>
                    <div className="flex gap-1">
                      {Array.from({ length: testimonial.rating }).map((_, i) => (
                        <FaStar key={i} className="text-yellow-400 text-sm" />
                      ))}
                    </div>
                  </div>

                  <h3 className="text-lg md:text-xl font-semibold mb-3">{testimonial.title}</h3>
                  <p className="text-gray-300 text-sm md:text-base mb-6 flex-grow">
                    {testimonial.text}
                  </p>

                  <div className="flex items-center gap-4 mt-auto">
                    
                    <div>
                      <p className="font-medium">{testimonial.author}</p>
                      <p className="text-xs text-gray-400">{testimonial.role}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Navigation Buttons */}
          <button 
            onClick={handlePrev}
            className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-12 bg-gray-700 hover:bg-gray-600 w-10 h-10 rounded-full items-center justify-center shadow-lg transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button 
            onClick={handleNext}
            className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-12 bg-gray-700 hover:bg-gray-600 w-10 h-10 rounded-full items-center justify-center shadow-lg transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Mobile Navigation */}
        <div className="flex md:hidden justify-center gap-4 mt-8">
          <button 
            onClick={handlePrev}
            className="bg-gray-700 hover:bg-gray-600 w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button 
            onClick={handleNext}
            className="bg-gray-700 hover:bg-gray-600 w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Indicator Dots */}
        <div className="flex justify-center gap-2 mt-8 md:mt-12">
          {testimonials.slice(0, Math.max(5, testimonials.length - getVisibleCount() + 1)).map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSet(idx)}
              className={`w-2 h-2 md:w-3 md:h-3 rounded-full transition-all ${currentSet === idx ? 'bg-blue-500 md:w-6' : 'bg-gray-600'}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialSection;
