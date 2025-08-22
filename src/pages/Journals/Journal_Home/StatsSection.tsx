// src/pages/About/StatsSection.tsx
import CountUp from "react-countup";
import { useInView } from "react-intersection-observer";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

const stats = [
  {
    value: 2350,
    label: "Active Journalers",
    color: "text-blue-400",
    circleColor: "border-blue-500",
  },
  {
    value: 140,
    label: "Strategies & Tags",
    color: "text-emerald-400",
    circleColor: "border-emerald-500",
  },
  {
    value: 8900,
    label: "Daily Entries & Notes",
    color: "text-amber-400",
    circleColor: "border-amber-500",
  },
  {
    value: 91.4,
    label: "Plan–Execution Match",
    color: "text-purple-400",
    circleColor: "border-purple-500",
    suffix: "%",
  },
];

const StatsSection = () => {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.3 });

  return (
    <section
      className="bg-gradient-to-br from-[#0e0f26] via-[#15173c] to-[#1a1c48] py-24 px-4 text-white relative overflow-hidden"
      ref={ref}
    >
      {/* Animated background elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: -100 }}
            animate={{ opacity: 0.05, y: 0 }}
            transition={{ duration: 1, delay: i * 0.2 }}
            className="absolute rounded-full bg-white"
            style={{
              width: `${Math.random() * 300 + 100}px`,
              height: `${Math.random() * 300 + 100}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
          />
        ))}
      </div>

      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-300 to-purple-300">
            TradeKhata Excellence
          </h2>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto">
            Structured logging, reviews, and insights powering disciplined,
            data-driven trading
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: i * 0.15 }}
              viewport={{ once: true }}
              className="flex flex-col items-center"
            >
              <div className="relative w-32 h-32 mb-6">
                {/* Outer animated circle */}
                <motion.div
                  animate={inView ? { rotate: 360 } : { rotate: 0 }}
                  transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                  className={`absolute inset-0 rounded-full border-t-2 ${stat.circleColor} border-opacity-30`}
                />
                {/* Inner animated circle */}
                <motion.div
                  animate={inView ? { rotate: -360 } : { rotate: 0 }}
                  transition={{
                    duration: 12,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                  className={`absolute inset-4 rounded-full border-b-2 ${stat.circleColor} border-opacity-30`}
                />
                {/* Value display */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <h3 className={`text-3xl font-bold ${stat.color}`}>
                    {inView ? (
                      <CountUp
                        end={stat.value as number}
                        duration={2.5}
                        decimals={Number.isInteger(stat.value) ? 0 : 1}
                        suffix={(stat as any).suffix ?? ""}
                      />
                    ) : (
                      "0"
                    )}
                  </h3>
                </div>
              </div>
              <p className="text-gray-300 text-sm uppercase tracking-wider font-medium text-center">
                {stat.label}
              </p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          viewport={{ once: true }}
          className="mt-16 text-center"
        >
          
            <Link to="/signup" className="px-8 py-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium hover:opacity-90 transition-opacity shadow-lg">
              Open Journal
            </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default StatsSection;
