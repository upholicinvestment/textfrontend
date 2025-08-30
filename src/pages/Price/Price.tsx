import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiX } from "react-icons/fi";
import { useNavigate, Link } from "react-router-dom";
import api from "../../api";

type Variant = {
  _id: string;
  name: string;
  key: string;
  priceMonthly?: number;
};
type Product = {
  _id: string;
  key: string;
  name: string;
  hasVariants: boolean;
  forSale?: boolean;
  route: string;
  priceMonthly?: number;
  variants?: Variant[];
};

const Price = () => {
  const [selectedBundle, setSelectedBundle] = useState(1);
  const [selectedAlgo, setSelectedAlgo] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"bundle" | "algo" | "journaling">(
    "bundle"
  );
  const [products, setProducts] = useState<Product[]>([]);
  const navigate = useNavigate();

  // 🔗 helper to build /signup?productKey=...&variantKey=...
  const toRegister = (
    productKey?: string | null,
    variantKey?: string | null
  ) => {
    const params = new URLSearchParams();
    if (productKey) params.set("productKey", productKey);
    if (variantKey) params.set("variantKey", variantKey);
    const qs = params.toString();
    return `/signup${qs ? `?${qs}` : ""}`;
  };

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get<Product[]>("/products");
        setProducts(res.data || []);
      } catch (e) {
        setProducts([]);
      }
    })();
  }, []);

  const bundle = useMemo(
    () => products.find((p) => p.key === "essentials_bundle"),
    [products]
  );
  const algo = useMemo(
    () => products.find((p) => p.key === "algo_simulator"),
    [products]
  );
  const journaling = useMemo(
    () => products.find((p) => p.key === "journaling_solo"),
    [products]
  );

  const bundlePrice = bundle?.priceMonthly
    ? `₹${bundle.priceMonthly.toLocaleString("en-IN")}`
    : "₹4999";
  const bundlePeriod = "month";

  const algoPlans = useMemo(() => {
    const vs = (algo?.variants || []).map((v) => ({
      id: v.key === "starter" ? 1 : v.key === "pro" ? 2 : 3,
      key: v.key, // <-- used in URL and for ordering
      name: v.name,
      price: v.priceMonthly
        ? `₹${v.priceMonthly.toLocaleString("en-IN")}`
        : "₹",
      period: "month",
      description:
        v.key === "starter"
          ? "Perfect for beginners starting with algorithmic trading"
          : v.key === "pro"
          ? "Advanced scalping with real-time execution"
          : "Comprehensive swing trading with advanced analytics",
      features:
        v.key === "starter"
          ? [
              "Basic backtesting",
              "1 strategy slot",
              "Limited indicators",
              "Email support",
              "Market hours only",
            ]
          : v.key === "pro"
          ? [
              "Real-time execution",
              "5 strategy slots",
              "All indicators",
              "Priority support",
              "Broker integration",
              "Multi-asset",
            ]
          : [
              "Multi-timeframe analysis",
              "Unlimited strategies",
              "All indicators",
              "24/7 dedicated support",
              "Custom indicators",
              "Portfolio optimization",
            ],
      popular: v.key === "pro",
      variantId: v._id,
    }));

    // ✅ Force the desired visual order: STARTER (left), PRO (middle), SWING (right)
    const rank = (k: string) => ({ starter: 1, pro: 2, swing: 3 } as const)[k] ?? 99;
    vs.sort((a, b) => rank(a.key) - rank(b.key));

    if (vs.length && selectedAlgo === null)
      setSelectedAlgo(vs.find((x) => x.popular)?.id ?? vs[0].id);

    return vs;
  }, [algo, selectedAlgo]);

  const journalingPrice =
    typeof journaling?.priceMonthly === "number"
      ? `₹${journaling.priceMonthly.toLocaleString("en-IN")}`
      : "₹299";
  const journalingPeriod = "month";

  const journalingFeatures = [
    "Trade tracking & performance analytics",
    "Psychology markers & emotional tracking",
    "Exportable reports in multiple formats",
    "Custom tagging & categorization",
    "Advanced filtering & search",
    "Portfolio correlation analysis",
    "Trade replay functionality",
    "Risk management statistics",
  ];

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

          {/* Toggle */}
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
              <button
                onClick={() => setActiveTab("journaling")}
                className={`px-8 py-3 rounded-xl transition-all ${
                  activeTab === "journaling"
                    ? "bg-blue-700 text-white shadow-md"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                Journaling
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
                            <ul className="text-xs text-gray-400 space-y-1">
                              {tool.features.map((f, i) => (
                                <li key={i} className="flex items-start">
                                  <span className="mr-1">•</span> {f}
                                </li>
                              ))}
                            </ul>
                          </motion.div>
                        ))}
                      </div>

                      <div className="flex flex-col sm:flex-row justify-between items-center pt-6 border-t border-gray-700">
                        <div className="mb-4 sm:mb-0 text-gray-400 text-sm">
                          Selected:{" "}
                          <strong className="text-white">
                            {selectedBundleTool.name}
                          </strong>
                        </div>

                        {/* 🔗 Pass productKey=essentials_bundle */}
                        <Link
                          to={toRegister(bundle?.key || "essentials_bundle")}
                          aria-label="Get Complete Bundle"
                        >
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
                  {algoPlans.map((plan) => {
                    // ✅ Ensure PRO is visually centered on desktop
                    const orderClass =
                      plan.key === "starter"
                        ? "lg:order-1"
                        : plan.key === "pro"
                        ? "lg:order-2"
                        : "lg:order-3";

                    return (
                      <motion.div
                        key={plan.id}
                        whileHover={{ y: -5 }}
                        className={`flex-1 rounded-2xl overflow-hidden shadow-xl max-w-md mx-auto lg:max-w-none ${
                          plan.popular
                            ? "border-2 border-yellow-400 transform scale-105"
                            : "border border-gray-700"
                        } bg-gray-800 relative transition-all duration-300 ${orderClass}`}
                        onClick={() => setSelectedAlgo(plan.id)}
                      >
                        <div
                          className={`${
                            plan.popular
                              ? "bg-gradient-to-b from-blue-700 to-indigo-800 pt-10"
                              : "bg-gray-700 pt-8"
                          } p-8 text-white relative`}
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
                              <li key={index} className="flex items-start text-sm">
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

                          {/* 🔗 Pass productKey=algo_simulator & variantKey=<plan.key> */}
                          <Link
                            to={toRegister(algo?.key || "algo_simulator", plan.key)}
                            aria-label={`Get started with ${plan.name}`}
                          >
                            <motion.button
                              whileHover={{ scale: 1.03 }}
                              whileTap={{ scale: 0.97 }}
                              className={`w-full py-4 rounded-lg font-semibold transition-all duration-300 ${
                                plan.popular
                                  ? "bg-gradient-to-r from-yellow-400 to-orange-500 text-gray-900 hover:from-yellow-300 hover:to-orange-400"
                                  : "bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-500 hover:to-purple-500"
                              } ${selectedAlgo === plan.id ? "ring-2 ring-blue-400" : ""}`}
                            >
                              {selectedAlgo === plan.id ? "Selected" : "Get Started"}
                            </motion.button>
                          </Link>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                <div className="text-center mt-10 text-sm text-gray-500">
                  Broker integration supported: AngelOne, Zerodha, Upstox, Dhan
                  (more coming soon)
                </div>
              </motion.div>
            )}

            {activeTab === "journaling" && (
              <motion.div
                key="journaling"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="mb-20"
              >
                <div className="text-center mb-12">
                  <h2 className="text-3xl font-bold mb-2">
                    Advanced Trading Journal
                  </h2>
                  <p className="text-gray-400 max-w-2xl mx-auto">
                    Transform your trading performance with detailed analytics,
                    psychological insights, and actionable feedback
                  </p>
                </div>

                <div className="rounded-2xl overflow-hidden shadow-xl bg-gray-800 border border-gray-700 max-w-5xl mx-auto">
                  <div className="relative">
                    <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-10 md:px-12 text-white">
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                        <div className="mb-6 md:mb-0">
                          <h2 className="text-2xl font-bold mb-2">
                            Trading Journal Pro
                          </h2>
                          <p className="text-blue-100">
                            Comprehensive trade analysis with psychological
                            insights and performance tracking
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-3xl font-bold">
                            {journalingPrice}
                            <span className="text-lg font-normal">
                              /{journalingPeriod}
                            </span>
                          </div>
                          <div className="text-sm text-blue-200 mt-1">
                            No hidden fees • Cancel anytime
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                        <div className="bg-gray-700/30 p-6 rounded-xl border border-gray-600">
                          <div className="flex items-center mb-4">
                            <div className="bg-blue-700 p-3 rounded-lg mr-4">
                              <svg
                                className="h-6 w-6 text-white"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                                />
                              </svg>
                            </div>
                            <h3 className="text-xl font-semibold text-blue-400">
                              Performance Analytics
                            </h3>
                          </div>
                          <p className="text-gray-300 mb-4">
                            Deep dive into your trading metrics with advanced
                            analytics that highlight your strengths and pinpoint
                            areas for improvement.
                          </p>
                          <ul className="text-sm text-gray-400 space-y-2">
                            <li className="flex items-center">
                              <svg
                                className="h-4 w-4 text-green-400 mr-2"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                              Win rate analysis by strategy & market condition
                            </li>
                            <li className="flex items-center">
                              <svg
                                className="h-4 w-4 text-green-400 mr-2"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                              Risk-reward ratio tracking
                            </li>
                            <li className="flex items-center">
                              <svg
                                className="h-4 w-4 text-green-400 mr-2"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                              Performance benchmarking
                            </li>
                          </ul>
                        </div>

                        <div className="bg-gray-700/30 p-6 rounded-xl border border-gray-600">
                          <div className="flex items-center mb-4">
                            <div className="bg-purple-700 p-3 rounded-lg mr-4">
                              <svg
                                className="h-6 w-6 text-white"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                            </div>
                            <h3 className="text-xl font-semibold text-purple-400">
                              Psychological Insights
                            </h3>
                          </div>
                          <p className="text-gray-300 mb-4">
                            Understand your emotional patterns and psychological
                            triggers that impact your trading decisions and
                            outcomes.
                          </p>
                          <ul className="text-sm text-gray-400 space-y-2">
                            <li className="flex items-center">
                              <svg
                                className="h-4 w-4 text-green-400 mr-2"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                              Emotional state tracking
                            </li>
                            <li className="flex items-center">
                              <svg
                                className="h-4 w-4 text-green-400 mr-2"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                              Bias identification tools
                            </li>
                            <li className="flex items-center">
                              <svg
                                className="h-4 w-4 text-green-400 mr-2"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                              Mindset improvement exercises
                            </li>
                          </ul>
                        </div>
                      </div>

                      <div className="bg-black/20 rounded-lg p-6 mb-8 border border-gray-700">
                        <div className="text-center text-lg font-semibold mb-4 text-blue-300">
                          COMPREHENSIVE FEATURES
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-center">
                          {journalingFeatures.map((feature, index) => (
                            <div
                              key={index}
                              className="bg-gray-800/50 p-3 rounded-lg border border-gray-700"
                            >
                              <div className="text-sm text-gray-300">
                                {feature}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row justify-between items-center pt-6 border-t border-gray-700">
                        <div className="mb-4 sm:mb-0">
                          <div className="text-gray-400 text-sm mb-1">
                            Included in Essential Bundle
                          </div>
                          <div className="flex items-center text-white">
                            <svg
                              className="h-5 w-5 text-green-400 mr-2"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                            Save 60% when purchased as part of the bundle
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4">
                          <Link
                            to={toRegister("essentials_bundle")}
                            aria-label="Get Complete Bundle"
                          >
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              className="bg-gradient-to-r from-blue-700 to-purple-700 hover:from-blue-600 hover:to-purple-600 text-white font-semibold py-3 px-6 rounded-lg transition-all shadow-md mb-2 sm:mb-0"
                            >
                              Get Complete Bundle
                            </motion.button>
                          </Link>

                          <Link
                            to={toRegister(journaling?.key || "journaling_solo")}
                            aria-label="Get Journaling Only"
                          >
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              className="border border-blue-500 text-blue-400 hover:bg-blue-900/30 font-semibold py-3 px-6 rounded-lg transition-all"
                            >
                              Get Journaling Only - {journalingPrice}/
                              {journalingPeriod}
                            </motion.button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
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
