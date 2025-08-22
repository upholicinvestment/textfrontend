import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {FiX} from "react-icons/fi";
import { useNavigate } from "react-router-dom"; // Changed from next/router to react-router-dom
import { Link } from "react-router-dom";

const Price = () => {
  const [selectedBundle, setSelectedBundle] = useState(1);
  const [selectedAlgo, setSelectedAlgo] = useState(2);
  const [activeTab, setActiveTab] = useState("bundle");
  const navigate = useNavigate(); // Changed from useRouter to useNavigate

  const bundleTools = [
    {
      id: 1,
      name: "Technical Scanner",
      description:
        "Advanced chart pattern recognition and technical indicator scanning",
      icon: "📊",
      features: [
        "Real-time alerts",
        "100+ indicators",
        "Custom patterns",
        "Multi-timeframe",
      ],
    },
    {
      id: 2,
      name: "Fundamental Scanner",
      description:
        "Comprehensive fundamental analysis and financial ratio screening",
      icon: "📈",
      features: [
        "Financial statements",
        "Valuation metrics",
        "Sector comparison",
        "Earnings analysis",
      ],
    },
    {
      id: 3,
      name: "F&O Khazana",
      description: "Derivatives analytics with options chain and futures data",
      icon: "💰",
      features: [
        "Options OI analysis",
        "Futures rollover",
        "Strategy builder",
        "Risk management",
      ],
    },
    {
      id: 4,
      name: "Journaling",
      description: "Trade journal with performance analytics and insights",
      icon: "📝",
      features: [
        "Trade tracking",
        "Performance metrics",
        "Psychology markers",
        "Export reports",
      ],
    },
    {
      id: 5,
      name: "FII/DII Data",
      description: "Institutional flow tracking with advanced analytics",
      icon: "🏛️",
      features: [
        "Real-time flows",
        "Historical data",
        "Sector-wise analysis",
        "Correlation tools",
      ],
    },
  ];

  const algoPlans = [
    {
      id: 1,
      name: "Starter Scalping",
      price: "₹5,999",
      period: "month",
      description: "Perfect for beginners starting with algorithmic trading",
      features: [
        "Basic backtesting",
        "1 strategy slot",
        "Limited indicators",
        "Email support",
        "Market hours only",
      ],
      popular: false,
    },
    {
      id: 2,
      name: "Scalper PRO",
      price: "₹14,999",
      period: "month",
      description: "Advanced scalping with real-time execution",
      features: [
        "Real-time execution",
        "5 strategy slots",
        "All indicators",
        "Priority support",
        "Broker integration",
        "Multi-asset",
      ],
      popular: true,
    },
    {
      id: 3,
      name: "Swing Trader",
      price: "₹9,999",
      period: "year",
      description: "Comprehensive swing trading with advanced analytics",
      features: [
        "Multi-timeframe analysis",
        "Unlimited strategies",
        "All indicators",
        "24/7 dedicated support",
        "Custom indicators",
        "Portfolio optimization",
        "API access",
      ],
      popular: false,
    },
  ];

  const bundlePrice = "₹4,999";
  const bundlePeriod = "month";

  const selectedBundleTool =
    bundleTools.find((t) => t.id === selectedBundle) || bundleTools[0];

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white">
        <button
          aria-label="Close"
          onClick={() => navigate("/")}
          className="absolute right-6 top-6 z-20 inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 backdrop-blur hover:bg-white/10 active:translate-y-px"
        >
          <FiX className="h-5 w-5 text-gray-200" />
        </button>
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <div className="text-lg font-semibold text-blue-400 mb-4 tracking-wider">
              TRADER'S TOOLKIT
            </div>

            <h1 className="text-4xl font-bold sm:text-5xl lg:text-6xl mb-6">
              Professional{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
                Trading Tools
              </span>
            </h1>
            <p className="max-w-xl mx-auto text-lg text-gray-400">
              Advanced analytics and automation for serious traders
            </p>
          </motion.div>

          {/* Toggle Switch */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex justify-center mb-12"
          >
            <div className="flex items-center p-1 rounded-xl bg-gray-800 border border-gray-700">
              <button
                onClick={() => setActiveTab("bundle")}
                className={`px-8 py-3 rounded-xl transition-all ${
                  activeTab === "bundle"
                    ? "bg-blue-700 text-white shadow-md"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                Essential Bundle
              </button>
              <button
                onClick={() => setActiveTab("algo")}
                className={`px-8 py-3 rounded-xl transition-all ${
                  activeTab === "algo"
                    ? "bg-blue-700 text-white shadow-md"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                ALGO Simulator
              </button>
            </div>
          </motion.div>

          <AnimatePresence mode="wait">
            {activeTab === "bundle" && (
              <motion.div
                key="bundle"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="mb-20"
              >
                {/* Bundle Section */}
                <div className="rounded-2xl overflow-hidden shadow-xl bg-gray-800 border border-gray-700">
                  <div className="relative">
                    <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-10 md:px-12 text-white">
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                        <div className="mb-6 md:mb-0">
                          <h2 className="text-2xl font-bold mb-2">
                            Trader's Essential Bundle
                          </h2>
                          <p className="text-blue-100">
                            All 5 premium tools for the price of one
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-3xl font-bold">
                            {bundlePrice}
                            <span className="text-lg font-normal">
                              /{bundlePeriod}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
                        {bundleTools.map((tool) => (
                          <motion.div
                            key={tool.id}
                            whileHover={{ y: -5 }}
                            className={`rounded-lg p-4 border transition-all cursor-pointer ${
                              selectedBundle === tool.id
                                ? "border-blue-500 bg-blue-900/20"
                                : "border-gray-700 bg-gray-700/30 hover:border-gray-600"
                            }`}
                            onClick={() => setSelectedBundle(tool.id)}
                          >
                            <div className="text-2xl mb-2">{tool.icon}</div>
                            <h3 className="font-semibold mb-2 text-sm">
                              {tool.name}
                            </h3>
                            <p className="text-xs text-gray-400 mb-3">
                              {tool.description}
                            </p>

                            <div className="mt-2">
                              <ul className="text-xs text-gray-400 space-y-1">
                                {tool.features.map((feature, index) => (
                                  <li key={index} className="flex items-start">
                                    <span className="mr-1">•</span> {feature}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </motion.div>
                        ))}
                      </div>

                      <div className="flex flex-col sm:flex-row justify-between items-center pt-6 border-t border-gray-700">
                        <div className="mb-4 sm:mb-0 text-gray-400 text-sm">
                          <span>
                            Selected:{" "}
                            <strong className="text-white">
                              {selectedBundleTool.name}
                            </strong>
                          </span>
                        </div>
                        <Link to="/signup">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold py-3 px-6 rounded-lg transition-all shadow-md"
                        >
                          Get Complete Bundle - {bundlePrice}/{bundlePeriod}
                        </motion.button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "algo" && (
              <motion.div
                key="algo"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="mb-20"
              >
                {/* ALGO Simulator Section - Redesigned */}
                <div className="text-center mb-12">
                  <h2 className="text-3xl font-bold mb-2">
                    Algorithmic Trading Solutions
                  </h2>
                  <p className="text-gray-400 max-w-2xl mx-auto">
                    Advanced automation for scalping & swing strategies. Connect
                    your broker & run tested systems.
                  </p>
                </div>

                <div className="flex flex-col lg:flex-row gap-8 items-stretch justify-center">
                  {algoPlans.map((plan) => (
                    <motion.div
                      key={plan.id}
                      whileHover={{ y: -5 }}
                      className={`flex-1 rounded-2xl overflow-hidden shadow-xl max-w-md mx-auto lg:max-w-none ${
                        selectedAlgo === plan.id ? "ring-2 ring-blue-500" : ""
                      } ${
                        plan.popular
                          ? "border-2 border-yellow-400 transform scale-105"
                          : "border border-gray-700"
                      } bg-gray-800 relative transition-all duration-300`}
                      onClick={() => setSelectedAlgo(plan.id)}
                    >
                      <div
                        className={`p-8 text-white ${
                          plan.popular
                            ? "bg-gradient-to-b from-blue-700 to-indigo-800 pt-10"
                            : "bg-gray-700 pt-8"
                        } relative`}
                      >
                        <div className="flex justify-between items-start mb-6">
                          <h3 className="text-xl font-bold">{plan.name}</h3>
                          <div className="text-right">
                            <div className="text-3xl font-bold">
                              {plan.price}
                            </div>
                            <div className="text-sm text-gray-300">
                              per {plan.period}
                            </div>
                          </div>
                        </div>

                        <p className="text-blue-100 mb-6 text-sm">
                          {plan.description}
                        </p>

                        <div className="bg-black/20 rounded-lg p-4 mb-6">
                          <div className="text-center text-sm font-semibold mb-2">
                            BROKER INTEGRATION
                          </div>
                          <div className="flex justify-center gap-3 text-xs text-gray-300">
                            <span>Zerodha</span>
                            <span>•</span>
                            <span>Upstox</span>
                            <span>•</span>
                            <span>Angel One</span>
                          </div>
                        </div>
                      </div>

                      <div className="p-6 bg-gray-800">
                        <div className="mb-6 text-sm font-semibold text-gray-300 border-b border-gray-700 pb-2">
                          FEATURES
                        </div>
                        <ul className="space-y-3 mb-8">
                          {plan.features.map((feature, index) => (
                            <li
                              key={index}
                              className="flex items-start text-sm"
                            >
                              <svg
                                className="h-5 w-5 mr-3 flex-shrink-0 text-green-400"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                              <span className="text-gray-300">{feature}</span>
                            </li>
                          ))}
                        </ul>

                      <Link to="/signup">
                        <motion.button
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          className={`w-full py-4 rounded-lg font-semibold transition-all duration-300 ${
                            plan.popular
                              ? "bg-gradient-to-r from-yellow-400 to-orange-500 text-gray-900 hover:from-yellow-300 hover:to-orange-400"
                              : "bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-500 hover:to-purple-500"
                          } ${
                            selectedAlgo === plan.id
                              ? "ring-2 ring-blue-400"
                              : ""
                          }`}
                        >
                          {selectedAlgo === plan.id
                            ? "Selected"
                            : "Get Started"}
                        </motion.button>
                      </Link>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Broker Support Note */}
                <div className="text-center mt-10 text-sm text-gray-500">
                  Broker integration supported: AngelOne, Zerodha, Upstox, Dhan
                  (more coming soon)
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </>
  );
};

export default Price;