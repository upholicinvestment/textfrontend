// src/pages/About/FAQSection.tsx
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaChevronDown, FaPhoneAlt, FaHeadset, FaChartLine, FaDatabase } from "react-icons/fa";

const faqs = [
  {
    question: "What does the Journal Dashboard show?",
    answer:
      "After you upload your orderbook, the dashboard compiles win-rate, PnL, average R:R, best/worst days, streaks, and an equity curve. It also flags good vs bad trades based on plan adherence and R-multiple.",
    icon: <FaChartLine className="text-blue-400" />,
  },
  {
    question: "How do I upload my orderbook?",
    answer:
      "Upload a CSV/Excel file or connect a supported broker export. A quick mapper helps align columns like symbol, side, qty, price, time, and fees. A sample template is provided for non-standard formats.",
    icon: <FaDatabase className="text-emerald-400" />,
  },
  {
    question: "What is the Daily Journal & plan–execution matching?",
    answer:
      "You pre-plan trades (bias, setup, entry/SL/TP, risk). Post-session, fills are auto-matched to the plan to compute a compliance score and produce specific actions—e.g., reduce late entries or tighten SL discipline.",
    icon: <FaChartLine className="text-amber-400" />,
  },
  {
    question: "Can I drill into Trade Details and export?",
    answer:
      "Yes. The Trade Details view shows round-trips with entries/exits, size, fees, realized R, MFE/MAE, timestamps, and your notes/screenshots. Filter by tag/strategy/instrument and export CSV/Excel for audits or analysis.",
    icon: <FaChartLine className="text-purple-400" />,
  },
];

const FAQSection = () => {
  // open the first item by default
  const [activeIndex, setActiveIndex] = useState<number | null>(0);

  const toggleAccordion = (index: number) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  return (
    <section className="bg-gradient-to-br from-[#0e0f1f] to-[#15172b] py-24 px-4 text-white relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-blue-900/20 to-transparent -z-10" />
      <div className="absolute bottom-0 left-0 w-1/2 h-full bg-gradient-to-r from-purple-900/20 to-transparent -z-10" />
      
      <div className="max-w-6xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="bg-[#16182a] rounded-3xl p-8 md:p-12 shadow-2xl border border-gray-800/50"
        >
          <div className="grid md:grid-cols-2 gap-12 items-start">
            {/* Left Side - Content */}
            <div className="space-y-8">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2, duration: 0.6 }}
                viewport={{ once: true }}
                className="space-y-4"
              >
                <span className="inline-block text-xs uppercase tracking-wider text-blue-400 font-medium bg-blue-900/30 px-3 py-1 rounded-full">
                  Journal FAQs
                </span>
                <h2 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-300 to-purple-300">
                  Trade Journal — Quick Answers
                </h2>
                <p className="text-gray-400 text-lg">
                  Short answers about uploads, the dashboard, daily journaling, and detailed reviews.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.6 }}
                viewport={{ once: true }}
                className="bg-gradient-to-br from-[#1a1c30] to-[#1f2136] p-6 rounded-xl border border-gray-700/50"
              >
                <div className="flex items-start gap-4">
                  <div className="bg-blue-900/30 p-3 rounded-full">
                    <FaHeadset className="text-blue-400 text-xl" />
                  </div>
                  <div>
                    <h3 className="font-medium mb-2">Need help with your journal?</h3>
                    <p className="text-gray-400 text-sm mb-4">
                      Our specialists can assist with data import, mapping, and reviews—24/5.
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-500/10 p-2 rounded-full">
                        <FaPhoneAlt className="text-blue-400 text-sm" />
                      </div>
                      <span className="font-medium">+91 98765 43210</span>
                      <button className="ml-auto bg-gradient-to-r from-blue-500 to-purple-600 px-4 py-2 rounded-full text-white text-sm hover:opacity-90 transition-opacity">
                        Call Now
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Right Side - Accordions */}
            <div className="space-y-4">
              {faqs.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index, duration: 0.5 }}
                  viewport={{ once: true }}
                  className="overflow-hidden"
                >
                  <div
                    onClick={() => toggleAccordion(index)}
                    className={`cursor-pointer bg-[#1f2136] px-6 py-5 rounded-xl border transition-all ${activeIndex === index ? 'border-blue-500/50' : 'border-transparent hover:border-gray-600'}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-lg ${activeIndex === index ? 'bg-blue-500/20' : 'bg-gray-700/50'}`}>
                        {item.icon}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-base font-medium text-left">
                          {item.question}
                        </h3>
                      </div>
                      <FaChevronDown
                        className={`text-blue-400 transition-transform duration-300 ${activeIndex === index ? "rotate-180" : ""}`}
                      />
                    </div>
                  </div>

                  <AnimatePresence>
                    {activeIndex === index && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        className="overflow-hidden"
                      >
                        <div className="bg-[#1a1c30] px-6 py-4 rounded-b-xl border-t border-gray-800/50">
                          <p className="text-gray-400 text-sm md:text-base">
                            {item.answer}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default FAQSection;
