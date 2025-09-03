import { JSX, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiX } from "react-icons/fi";
import { useNavigate, Link } from "react-router-dom";
import api from "../../api";
import {
  CheckCircle2,
  ChevronRight,
  BadgeCheck,
  Shield,
  TrendingUp,
  Gem,
} from "lucide-react";

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

const normalizeVariantKey = (k: string) => {
  const s = (k || "").toLowerCase();
  if (["starter", "starter_scalping"].includes(s)) return "starter";
  if (["pro", "option_scalper_pro"].includes(s)) return "pro";
  if (["swing", "sniper_algo", "swing_trader_master"].includes(s)) return "swing";
  return s;
};

const variantDescription = (k: string) => {
  if (k === "starter") return "Perfect for beginners starting with algorithmic trading";
  if (k === "pro") return "Advanced scalping with real-time execution";
  if (k === "swing") return "Comprehensive swing trading with advanced analytics";
  return "Premium trading solution";
};

const variantFeatures = (k: string) => {
  if (k === "starter") {
    return [
      "Instrument: NIFTY (NSE)",
      "Win Rate: 38%",
      "R:R ≈ 1.30 : 1",
      "Return of Investment: 18%",
      "Max DD: 27%",
      "Trades Tested: 1300",
      "Backtest: 18 months",
    ];
  }
  if (k === "pro") {
    return [
      "Instrument: NIFTY (NSE)",
      "Win Rate: 48%",
      "R:R ≈ 1.50 : 1",
      "Return of Investment: 36%",
      "Max DD: 23%",
      "Trades Tested: 1100",
      "Backtest: 72 months",
    ];
  }
  if (k === "swing") {
    return [
      "Instrument: NIFTY (NSE)",
      "Win Rate: 60%",
      "R:R ≈ 2.40 : 1",
      "Return of Investment: 44%",
      "Max DD: 11%",
      "Trades Tested: 100",
      "Backtest: 18 months",
    ];
  }
  return ["Core features", "Email support"];
};

const variantIcon = (k: string): JSX.Element => {
  if (k === "starter") return <Shield className="w-6 h-6 text-amber-600" />;
  if (k === "pro") return <Gem className="w-6 h-6 text-yellow-400" />;
  if (k === "swing") return <TrendingUp className="w-6 h-6 text-gray-400" />;
  return <Shield className="w-6 h-6 text-amber-600" />;
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
    : "₹499";
  const bundlePeriod = "month";

  const algoPlans = useMemo(() => {
    const vs = (algo?.variants || []).map((v) => {
      const normKey = normalizeVariantKey(v.key);
      return {
        id: v.key === "starter" ? 5999 : v.key === "pro" ? 2 : 3,
        key: normKey,
        name: v.name,
        price: v.priceMonthly
          ? `₹${v.priceMonthly.toLocaleString("en-IN")}`
          : "₹5999",
        period: "month",
        description: variantDescription(normKey),
        features: variantFeatures(normKey),
        popular: normKey === "pro",
        variantId: v._id,
      };
    });

    // Desired visual order
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

  // ── ★ Added static plan info (display only; no logic changes) ──
  const BUNDLE_MONTHLY = 499;
  const BUNDLE_ANNUAL = 4999;
  const bundleSavePct = Math.round(
    (1 - BUNDLE_ANNUAL / (BUNDLE_MONTHLY * 12)) * 100
  );

  const JOURNAL_MONTHLY = 299;
  const JOURNAL_ANNUAL = 2499;
  const journalingSavePct = Math.round(
    (1 - JOURNAL_ANNUAL / (JOURNAL_MONTHLY * 12)) * 100
  );
  // ── ★ /Added ──

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
      id: 2,
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
                {/* ======= COMPACT BUNDLE SECTION ======= */}
                <div className="max-w-4xl mx-auto relative rounded-3xl overflow-hidden border border-gray-700 bg-[#0b0f1a] shadow-2xl">
                  {/* soft gradient border glow */}
                  <div className="pointer-events-none absolute -inset-px rounded-3xl bg-gradient-to-r from-blue-600/20 via-indigo-500/20 to-purple-600/20 blur opacity-60" />

                  {/* Hero (slightly tighter paddings) */}
                  <div className="relative bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-700">
                    <div className="px-6 py-8 md:px-10">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
                        <div>
                          <div className="inline-flex items-center gap-2 bg-white/15 border border-white/25 text-white text-xs font-semibold px-3 py-1 rounded-full mb-2">
                            <BadgeCheck className="w-4 h-4 text-yellow-300" />
                            BEST VALUE
                          </div>
                          <h2 className="text-2xl md:text-3xl font-bold">
                            Trader's Essential Bundle
                          </h2>
                          <p className="text-blue-100 mt-1">
                            All 2 premium tools for the price of one
                          </p>
                        </div>

                        <div className="text-right">
                          <div className="text-sm text-blue-200">Starts at</div>
                          <div className="text-3xl md:text-4xl font-bold leading-none">
                            {bundlePrice}
                            <span className="text-lg font-normal">/{bundlePeriod}</span>
                          </div>
                          <div className="text-xs md:text-sm text-blue-100 mt-1">
                            No hidden fees • Cancel anytime
                          </div>

                          {/* ★ Added display-only pricing info */}
                          <div className="text-xs md:text-sm text-emerald-200 mt-2">
                            Special: <strong>₹{BUNDLE_MONTHLY.toLocaleString("en-IN")}</strong>/month •{" "}
                            <strong>₹{BUNDLE_ANNUAL.toLocaleString("en-IN")}</strong>/year{" "}
                            <span className="text-emerald-300 font-semibold">(Save {bundleSavePct}%)</span>
                          </div>
                          {/* ★ /Added */}
                        </div>
                      </div>

                      {/* Quick highlights */}
                      <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {["2 tools included", "Save up to 60%", "Priority support"].map(
                          (h) => (
                            <div
                              key={h}
                              className="flex items-center gap-2 bg-black/15 border border-white/15 rounded-xl px-3 py-2"
                            >
                              <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                              <span className="text-sm text-blue-50">{h}</span>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="relative p-6 md:p-8">
                    {/* What's inside */}
                    <div className="mb-5">
                      <div className="text-xs tracking-wider text-blue-300/80 mb-2">
                        WHAT'S INSIDE
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {bundleTools.map((t) => (
                          <div
                            key={t.id}
                            className="inline-flex items-center gap-2 rounded-full border border-gray-700 bg-gray-800/50 px-3 py-1.5"
                          >
                            <span className="text-lg">{t.icon}</span>
                            <span className="text-sm text-gray-200">{t.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Tool cards — 2-up grid on large screens */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                      {bundleTools.map((tool) => {
                        const selected = selectedBundle === tool.id;
                        return (
                          <motion.button
                            key={tool.id}
                            whileHover={{ y: -4 }}
                            onClick={() => setSelectedBundle(tool.id)}
                            className={`relative text-left rounded-2xl p-4 transition-all border ${
                              selected
                                ? "border-blue-500/70 bg-gradient-to-b from-blue-500/10 to-transparent ring-1 ring-blue-500/40"
                                : "border-gray-700 bg-gray-800/30 hover:border-gray-600"
                            }`}
                          >
                            {/* glow */}
                            {selected && (
                              <div className="pointer-events-none absolute inset-0 rounded-2xl bg-blue-600/10 blur" />
                            )}
                            <div className="relative">
                              <div className="text-3xl mb-2">{tool.icon}</div>
                              <h3 className="font-semibold mb-1 text-sm text-white">
                                {tool.name}
                              </h3>
                              <p className="text-xs text-gray-400 mb-3">
                                {tool.description}
                              </p>
                              <ul className="space-y-1.5">
                                {tool.features.map((f, i) => (
                                  <li key={i} className="flex items-start gap-2">
                                    <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 text-blue-400" />
                                    <span className="text-[12px] text-gray-300">{f}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </motion.button>
                        );
                      })}
                    </div>

                    {/* Value row */}
                    <div className="mb-6 rounded-xl border border-blue-500/30 bg-blue-500/10 p-4">
                      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                        <div className="text-sm text-blue-200">
                          Selected tool:{" "}
                          <strong className="text-white">
                            {selectedBundleTool.name}
                          </strong>
                          <span className="hidden md:inline"> • </span>
                          <span className="block md:inline text-blue-200/90">
                            Included with the bundle along with{" "}
                            <span className="text-white">
                              {bundleTools
                                .filter((t) => t.id !== selectedBundleTool.id)
                                .map((t) => t.name)
                                .join(", ")}
                            </span>
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-blue-100">
                          <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                          Save big compared to buying individually
                        </div>
                      </div>
                    </div>

                    {/* CTA row */}
                    <div className="flex flex-col sm:flex-row justify-between items-center pt-5 border-t border-gray-700">
                      <div className="mb-4 sm:mb-0 text-gray-300 text-sm">
                        Unlock all tools + future updates
                      </div>

                      {/* 🔗 Pass productKey=essentials_bundle */}
                      <Link
                        to={toRegister(bundle?.key || "essentials_bundle")}
                        aria-label="Get Complete Bundle"
                      >
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="group inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold py-3 px-6 rounded-xl transition-all shadow-lg"
                        >
                          Get Complete Bundle - {bundlePrice}/{bundlePeriod}
                          <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                        </motion.button>
                      </Link>
                    </div>
                  </div>
                </div>
                {/* ======= /COMPACT BUNDLE SECTION ======= */}
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

                {/* New ALGO UI (cards from About/PricingSection) */}
                <div className="grid md:grid-cols-3 gap-8 items-start">
                  {algoPlans.map((plan) => {
                    const isSelected = selectedAlgo === plan.id;
                    const popular = plan.popular;
                    return (
                      <div
                        key={plan.key}
                        className={`relative w-full max-w-[360px] rounded-2xl border ${
                          popular ? "border-yellow-400" : "border-purple-600/50"
                        } bg-[#101223] px-6 py-10 ${
                          popular ? "shadow-yellow-500/20" : "shadow-purple-500/20"
                        } shadow-2xl group h-full mx-auto flex flex-col justify-between transition-all duration-300 ${
                          isSelected ? "transform scale-105" : ""
                        } ${popular ? "md:-translate-y-5" : ""}`}
                        onClick={() => setSelectedAlgo(plan.id)}
                      >
                        {/* Ribbon */}
                        {popular && (
                          <div className="pointer-events-none absolute top-0 right-0 bg-yellow-400 text-black text-xs font-bold px-4 py-1 rounded-bl-lg rounded-tr-lg">
                            MOST POPULAR
                          </div>
                        )}

                        {/* Glow layer */}
                        <div
                          className={`pointer-events-none absolute -inset-0.5 bg-gradient-to-r ${
                            popular
                              ? "from-yellow-400 to-amber-500"
                              : "from-purple-600 to-indigo-500"
                          } rounded-xl blur opacity-0 group-hover:opacity-30 transition duration-300`}
                        />

                        {/* Content */}
                        <div className="relative z-10">
                          <div className="flex items-center gap-3 mb-4">
                            {variantIcon(plan.key)}
                            <h3 className="text-xl font-bold">
                              {plan.name}
                              {popular && (
                                <span className="ml-2 text-yellow-400">
                                  <BadgeCheck className="inline w-5 h-5" />
                                </span>
                              )}
                            </h3>
                          </div>

                          <p className="text-gray-400 text-sm mb-4">
                            {plan.description}
                          </p>

                          <div className="mb-6">
                            <div className="text-4xl font-bold mb-1">
                              {plan.price}
                            </div>
                            <div className="text-gray-400 text-sm">
                              per month
                            </div>
                          </div>

                          <ul className="space-y-3 text-sm text-gray-300 text-left mb-8">
                            {plan.features.map((f) => (
                              <li key={f} className="flex items-start gap-2">
                                <CheckCircle2
                                  className={`flex-shrink-0 ${
                                    popular
                                      ? "text-yellow-400"
                                      : "text-purple-400"
                                  } w-4 h-4 mt-0.5`}
                                />
                                <span>{f}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Button */}
                        <Link
                          to={toRegister(algo?.key || "algo_simulator", plan.key)}
                          onClick={(e) => e.stopPropagation()}
                          className={`relative z-10 w-full mt-auto py-3 rounded-xl font-semibold transition-all duration-300 text-center ${
                            popular
                              ? "bg-gradient-to-r from-yellow-400 to-amber-500 text-black hover:shadow-lg hover:shadow-yellow-500/30"
                              : "bg-gradient-to-r from-purple-500 to-indigo-500 text-white hover:shadow-lg hover:shadow-purple-500/30"
                          } flex items-center justify-center gap-2`}
                          aria-label={`Pay now for ${plan.name}`}
                        >
                          Pay Now
                          <ChevronRight className="w-4 h-4" />
                        </Link>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-10 text-gray-400 text-sm flex flex-col md:flex-row items-center justify-center gap-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                    <span>Secure payment processing</span>
                  </div>
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

                          {/* ★ Added display-only pricing info */}
                          <div className="text-xs md:text-sm text-emerald-200 mt-2">
                            Special: <strong>₹{JOURNAL_MONTHLY.toLocaleString("en-IN")}</strong>/month •{" "}
                            <strong>₹{JOURNAL_ANNUAL.toLocaleString("en-IN")}</strong>/year{" "}
                            <span className="text-emerald-300 font-semibold">(Save {journalingSavePct}%)</span>
                          </div>
                          {/* ★ /Added */}
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
                                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2z"
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
                {/* ======= /COMPACT BUNDLE SECTION ======= */}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </>
  );
};

export default Price;
