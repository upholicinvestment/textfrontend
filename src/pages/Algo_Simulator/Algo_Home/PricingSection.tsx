// src/pages/About/PricingSection.tsx
import { useEffect, useMemo, useState, type ReactElement } from "react";
import {
  CheckCircle2,
  Zap,
  ChevronRight,
  BadgeCheck,
  Shield,
  Clock,
  TrendingUp,
  Gem,
} from "lucide-react";
import { Link } from "react-router-dom";

import { PRODUCTS } from "./data";
import type { Product as StaticProduct } from "./types";
import api from "../../../api";

/* ------------ Types ------------- */
type Variant = {
  _id: string;
  name: string;
  key: string;
  priceMonthly?: number;
};

type FetchedProduct = {
  _id: string;
  key: string;
  name: string;
  hasVariants: boolean;
  variants?: Variant[];
};

/* ------------ Helpers ------------- */
const CHECKOUT_BASE = "/signup"; // ✅ goes to /signup

function rupee(n?: number) {
  return typeof n === "number" ? `₹${n.toLocaleString("en-IN")}` : "₹—";
}

function normalizeVariantKey(k: string) {
  const s = k.toLowerCase();
  if (["starter", "starter_scalping"].includes(s)) return "starter";
  if (["pro", "option_scalper_pro"].includes(s)) return "pro";
  if (["swing", "sniper_algo", "swing_trader_master"].includes(s)) return "swing";
  return s;
}

function variantDescription(k: string) {
  if (k === "starter") return "Perfect for beginners starting with algorithmic trading";
  if (k === "pro") return "Advanced scalping with real-time execution";
  if (k === "swing") return "Comprehensive swing trading with advanced analytics";
  return "Premium trading solution";
}

function variantFeatures(k: string) {
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
}


function variantIcon(k: string): ReactElement {
  if (k === "starter") return <Shield className="w-6 h-6 text-amber-600" />;
  if (k === "pro") return <Gem className="w-6 h-6 text-yellow-400" />;
  if (k === "swing") return <TrendingUp className="w-6 h-6 text-gray-500" />;
  return <Shield className="w-6 h-6 text-amber-600" />;
}

function toRegister(productKey: string, variantKey: string) {
  const params = new URLSearchParams();
  params.set("productKey", productKey);
  params.set("variantKey", variantKey);
  return `${CHECKOUT_BASE}?${params.toString()}`;
}

/* ------------ UI Plan ------------- */
type Plan = {
  key: string;
  name: string;
  price: string;
  description: string;
  features: string[];
  btn: string;
  popular: boolean;
  icon: ReactElement;
  href: string;
};

const PricingSection = () => {
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const [fetchedProducts, setFetchedProducts] = useState<FetchedProduct[] | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get<FetchedProduct[]>("/products");
        setFetchedProducts(res.data || []);
      } catch {
        setFetchedProducts(null);
      }
    })();
  }, []);

  // 🔹 Build plans from live /products
  const livePlans: Plan[] | null = useMemo(() => {
    if (!fetchedProducts) return null;
    const algo = fetchedProducts.find((p) => p.key === "algo_simulator");
    if (!algo || !algo.variants?.length) return null;

    const ordered = ["starter", "pro", "swing"];
    return algo.variants
      .map((v) => {
        const norm = normalizeVariantKey(v.key);
        return {
          key: norm,
          name: v.name,
          price: rupee(v.priceMonthly),
          description: variantDescription(norm),
          features: variantFeatures(norm),
          btn: "Pay Now",
          popular: norm === "pro",
          icon: variantIcon(norm),
          href: toRegister("algo_simulator", norm),
        };
      })
      .sort((a, b) => ordered.indexOf(a.key) - ordered.indexOf(b.key));
  }, [fetchedProducts]);

  // 🔹 Fallback if no API
  const fallbackPlans: Plan[] = useMemo(() => {
    const get = (k: StaticProduct["key"]) => PRODUCTS.find((x) => x.key === k)!;
    const starter = get("starter_scalping");
    const pro = get("option_scalper_pro");
    const swing = get("sniper_algo");

    const toFeat = (p: StaticProduct) => [
      "Instrument: NIFTY (NSE)",
      `Win Rate: ${p.metrics?.winRate ?? "—"}%`,
      `R:R ≈ ${typeof p.metrics?.rr === "number" ? `${p.metrics.rr.toFixed(2)} : 1` : "—"}`,
      `Return of Investment: ${p.metrics?.returnOfInvestment ?? "—"}%`,
      `Max DD: ${p.metrics?.maxDD ?? "—"}%`,
      `Trades Tested: ${p.metrics?.trades ?? "—"}`,
      `Backtest: ${p.metrics?.monthsTested ?? "—"} months`,
    ];

    return [
      {
        key: "starter",
        name: starter.name,
        price: rupee(starter.priceMonthly),
        description: starter.tagline,
        features: toFeat(starter),
        btn: "Pay Now",
        popular: false,
        icon: <Shield className="w-6 h-6 text-amber-600" />,
        href: toRegister("algo_simulator", "starter"),
      },
      {
        key: "pro",
        name: pro.name,
        price: rupee(pro.priceMonthly),
        description: pro.tagline,
        features: toFeat(pro),
        btn: "Pay Now",
        popular: true,
        icon: <Gem className="w-6 h-6 text-yellow-400" />,
        href: toRegister("algo_simulator", "pro"),
      },
      {
        key: "swing",
        name: swing.name,
        price: rupee(swing.priceMonthly),
        description: swing.tagline,
        features: toFeat(swing),
        btn: "Pay Now",
        popular: false,
        icon: <TrendingUp className="w-6 h-6 text-gray-500" />,
        href: toRegister("algo_simulator", "swing"),
      },
    ];
  }, []);

  const plans = livePlans ?? fallbackPlans;

  return (
    <section
      id="pricing"
      className="scroll-mt-24 md:scroll-mt-28 bg-gradient-to-br from-[#0e0f26] via-[#15173c] to-[#1a1c48] py-24 px-4 text-white relative overflow-hidden"
    >
      {/* ✨ make section backgrounds non-blocking */}
      <div className="pointer-events-none absolute top-0 right-0 w-full h-1/2 bg-gradient-to-tr from-purple-600 to-indigo-500 blur-3xl opacity-30 rotate-6 -z-10" />
      <div className="pointer-events-none absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-bl from-blue-600 to-indigo-500 blur-3xl opacity-20 -rotate-6 -z-10" />

      <div className="max-w-7xl mx-auto text-center relative z-10">
        <div className="inline-flex items-center gap-2 bg-indigo-900/50 border border-indigo-700 rounded-full px-4 py-1.5 mb-4">
          <Zap className="w-4 h-4 text-yellow-400" />
          <span className="text-sm font-medium">Premium Plans</span>
          <ChevronRight className="w-4 h-4" />
        </div>

        <h2 className="text-4xl md:text-5xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-purple-300 to-indigo-300">
          Invest in Your Trading Success
        </h2>
        <p className="text-gray-300 text-lg max-w-2xl mx-auto mb-16">
          Select the perfect package that matches your trading ambitions and budget.
        </p>

        <div className="grid md:grid-cols-3 gap-8 items-start">
          {plans.map((plan, index) => (
            <div
  key={plan.key}
  className={`relative w-full max-w-[360px] rounded-2xl border ${
    plan.popular ? "border-yellow-400" : "border-purple-600/50"
  } bg-[#101223] px-6 py-10 ${
    plan.popular ? "shadow-yellow-500/20" : "shadow-purple-500/20"
  } shadow-2xl group h-full mx-auto flex flex-col justify-between transition-all duration-300 ${
    hoveredCard === index ? "transform scale-105" : ""
  } ${plan.popular ? "md:-translate-y-5" : ""}`}
  onMouseEnter={() => setHoveredCard(index)}
  onMouseLeave={() => setHoveredCard(null)}
>

              {/* ribbon should not block clicks */}
              {plan.popular && (
                <div className="pointer-events-none absolute top-0 right-0 bg-yellow-400 text-black text-xs font-bold px-4 py-1 rounded-bl-lg rounded-tr-lg">
                  MOST POPULAR
                </div>
              )}

              {/* Glow layer must not block clicks */}
              <div
                className={`pointer-events-none absolute -inset-0.5 bg-gradient-to-r ${
                  plan.popular ? "from-yellow-400 to-amber-500" : "from-purple-600 to-indigo-500"
                } rounded-xl blur opacity-0 group-hover:opacity-30 transition duration-300`}
              />

              {/* content above overlays */}
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  {plan.icon}
                  <h3 className="text-xl font-bold">
                    {plan.name}
                    {plan.popular && (
                      <span className="ml-2 text-yellow-400">
                        <BadgeCheck className="inline w-5 h-5" />
                      </span>
                    )}
                  </h3>
                </div>

                <p className="text-gray-400 text-sm mb-4">{plan.description}</p>

                <div className="mb-6">
                  <div className="text-4xl font-bold mb-1">{plan.price}</div>
                  <div className="text-gray-400 text-sm">per month, billed annually</div>
                </div>

                <ul className="space-y-3 text-sm text-gray-300 text-left mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <CheckCircle2
                        className={`flex-shrink-0 ${plan.popular ? "text-yellow-400" : "text-purple-400"} w-4 h-4 mt-0.5`}
                      />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* button above overlays */}
              <Link
                to={plan.href} // ✅ /signup?productKey=algo_simulator&variantKey=...
                onClick={(e) => e.stopPropagation()}
                className={`relative z-10 w-full mt-auto py-3 rounded-xl font-semibold transition-all duration-300 text-center ${
                  plan.popular
                    ? "bg-gradient-to-r from-yellow-400 to-amber-500 text-black hover:shadow-lg hover:shadow-yellow-500/30"
                    : "bg-gradient-to-r from-purple-500 to-indigo-500 text-white hover:shadow-lg hover:shadow-purple-500/30"
                } flex items-center justify-center gap-2`}
                data-testid={`paynow-${plan.key}`}
              >
                Pay Now
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          ))}
        </div>

        <div className="mt-16 text-gray-400 text-sm flex flex-col md:flex-row items-center justify-center gap-4">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span>7-day money back guarantee</span>
          </div>
          <div className="hidden md:block w-px h-4 bg-gray-600" />
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-400" />
            <span>Secure payment processing</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
