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
import { Link, useNavigate } from "react-router-dom";

import { PRODUCTS } from "./data";
import type { Product as StaticProduct } from "./types";
import api from "../../../api";
import { useEntitlements } from "../../../hooks/useEntitlements";

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
const CHECKOUT_BASE = "/signup";

function rupee(n?: number) {
  return typeof n === "number" ? `₹${n.toLocaleString("en-IN")}` : "₹—";
}

function normalizeVariantKey(k: string) {
  const s = (k || "").toLowerCase().trim();
  if (["starter", "starter_scalping"].includes(s)) return "starter";
  if (["pro", "option_scalper_pro", "option-scalper-pro"].includes(s)) return "pro";
  if (["swing", "sniper_algo", "swing_trader_master", "swing-trader-master"].includes(s)) return "swing";
  return s as any;
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

/** Load Razorpay SDK once */
const loadRazorpay = (): Promise<boolean> =>
  new Promise((resolve) => {
    if (typeof window !== "undefined" && (window as any).Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

/* ------------ snapshot key extractor (optional) ------------- */
function extractKeys(payload: any): string[] {
  const out: string[] = [];
  const push = (x: any) => {
    if (!x) return;
    if (typeof x === "string") out.push(x);
    else if (typeof x === "object") {
      const cand =
        x?.variant?.key ??
        x.key ??
        x.productKey ??
        x.slug ??
        x.route ??
        x.code ??
        x.id ??
        (typeof x.name === "string" ? x.name : undefined);
      if (typeof cand === "string") out.push(cand);
    }
  };
  if (!payload) return out;

  const pools = [
    payload.products,
    payload.activeProducts,
    payload.entitlements,
    payload.purchases,
    payload.subscriptions,
    payload.bundles,
    payload.items,
    payload.modules,
    payload.features,
  ].filter(Boolean);
  for (const p of pools) {
    if (Array.isArray(p)) p.forEach(push);
    else push(p);
  }
  return out.filter(Boolean).map((s) => String(s).toLowerCase());
}

/* ------------ UI Plan ------------- */
type Plan = {
  key: "starter" | "pro" | "swing";
  name: string;
  price: string;
  description: string;
  features: string[];
  btn: string;
  popular: boolean;
  icon: ReactElement;
  href: string; // default href when not logged in
};

const PricingSection = () => {
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const [fetchedProducts, setFetchedProducts] = useState<FetchedProduct[] | null>(null);
  const [userSnapshot, setUserSnapshot] = useState<any>(null);
  const [userLoading, setUserLoading] = useState<boolean>(false);
  const navigate = useNavigate();

  const { items: entitlements, loading: entLoading } = useEntitlements();

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

  // load user snapshot (localStorage → /users/me)
  useEffect(() => {
    const run = async () => {
      setUserLoading(true);
      try {
        const local = (() => {
          try {
            return JSON.parse(localStorage.getItem("user") || "null");
          } catch {
            return null;
          }
        })();
        if (local) {
          setUserSnapshot(local);
        } else {
          const token = localStorage.getItem("token");
          if (token) {
            const r = await api.get("/users/me");
            setUserSnapshot(r?.data ?? null);
          } else {
            setUserSnapshot(null);
          }
        }
      } finally {
        setUserLoading(false);
      }
    };
    run();
  }, []);

  const OWN_KEYS_BY_VARIANT: Record<Plan["key"], string[]> = {
    starter: ["starter", "starter_scalping"],
    pro: ["pro", "option_scalper_pro", "option-scalper-pro"],
    swing: ["swing", "sniper_algo", "swing_trader_master", "swing-trader-master"],
  };

  /** Collect owned variant keys from entitlements (safe for your narrow type). */
  const collectEntitlementVariantKeys = () => {
    const keys = new Set<string>();

    for (const it of entitlements || []) {
      const single = it?.variant?.key && normalizeVariantKey(it.variant.key);
      if (single) keys.add(single);

      // Some backends return a grouped "variants" array; read it with a permissive cast.
      // This keeps TS happy with your current EntitlementItem type.
      const maybeArray = (it as any)?.variants as Array<{ key?: string }> | undefined;
      if (Array.isArray(maybeArray)) {
        for (const v of maybeArray) {
          const kk = v?.key && normalizeVariantKey(v.key);
          if (kk) keys.add(kk);
        }
      }
    }

    return keys;
  };

  /** Detect ownership: check desired keys vs. collected entitlement keys and snapshot keys. */
  const ownedExactVariant = (normVariant: Plan["key"]) => {
    const desired = new Set(
      OWN_KEYS_BY_VARIANT[normVariant].map((k) => normalizeVariantKey(k))
    );

    const entKeys = collectEntitlementVariantKeys();

    const snapKeys = new Set(
      extractKeys(userSnapshot).map((k) => normalizeVariantKey(k))
    );

    for (const k of desired) {
      if (entKeys.has(k) || snapKeys.has(k)) return true;
    }
    return false;
  };

  const algoProduct = useMemo(
    () => fetchedProducts?.find((p) => p.key === "algo_simulator") || null,
    [fetchedProducts]
  );

  const variantIdFor = (norm: Plan["key"]) => {
    const wanted = OWN_KEYS_BY_VARIANT[norm].map((k) => normalizeVariantKey(k));
    const found = algoProduct?.variants?.find(
      (v) => wanted.includes(normalizeVariantKey(v.key))
    );
    return found?._id || null;
  };

  const livePlans: Plan[] | null = useMemo(() => {
    if (!algoProduct || !algoProduct.variants?.length) return null;
    const ordered: Plan["key"][] = ["starter", "pro", "swing"];
    return algoProduct.variants
      .map((v) => {
        const norm = normalizeVariantKey(v.key) as Plan["key"];
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
  }, [algoProduct]);

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

  // --- Direct checkout / already-owned short-circuit ---
  const openCheckout = async (normVariant: Plan["key"]) => {
    try {
      if (!algoProduct) {
        navigate(toRegister("algo_simulator", normVariant));
        return;
      }
      const vId = variantIdFor(normVariant);
      if (!vId) {
        navigate(toRegister("algo_simulator", normVariant));
        return;
      }

      const orderRes = await api.post("/payments/create-order", {
        productId: algoProduct._id,
        variantId: vId,
      });

      if (orderRes.status === 204) {
        navigate("/dashboard", { replace: true });
        return;
      }

      const ord = orderRes.data;
      const ok = await loadRazorpay();
      if (!ok || !(window as any).Razorpay) {
        navigate(toRegister("algo_simulator", normVariant));
        return;
      }

      const rz = new (window as any).Razorpay({
        key: ord.key,
        amount: ord.amount,
        currency: ord.currency,
        name: ord.name,
        description: ord.description,
        order_id: ord.orderId,
        prefill: {
          name: ord.user?.name,
          email: ord.user?.email,
          contact: ord.user?.contact,
        },
        theme: { color: "#4f46e5" },
        handler: async (rsp: any) => {
          try {
            await api.post("/payments/verify", {
              intentId: ord.intentId,
              razorpay_order_id: rsp.razorpay_order_id,
              razorpay_payment_id: rsp.razorpay_payment_id,
              razorpay_signature: rsp.razorpay_signature,
            });
            navigate("/dashboard", { replace: true });
          } catch {
            navigate(toRegister("algo_simulator", normVariant));
          }
        },
        modal: { ondismiss: () => {} },
      });

      rz.open();
    } catch {
      navigate(toRegister("algo_simulator", normVariant));
    }
  };

  // Click handler decides final action (prevents <Link> default routing)
  const onPayClick = (variantKey: Plan["key"]) => async (e: React.MouseEvent) => {
    e.preventDefault();

    const token = localStorage.getItem("token");
    const isOwned = ownedExactVariant(variantKey);

    if (isOwned) {
      navigate("/dashboard");
      return;
    }

    if (!token) {
      navigate(toRegister("algo_simulator", variantKey));
      return;
    }

    await openCheckout(variantKey);
  };

  return (
    <section
      id="pricing"
      className="scroll-mt-24 md:scroll-mt-28 bg-gradient-to-br from-[#0e0f26] via-[#15173c] to-[#1a1c48] py-24 px-4 text-white relative overflow-hidden"
    >
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
          {plans.map((plan, index) => {
            const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
            const isOwned = ownedExactVariant(plan.key);

            const label =
              userLoading || entLoading
                ? "Checking..."
                : isOwned
                ? "Open Dashboard"
                : token
                ? "Pay Now"
                : "Get Started";

            const linkTo = isOwned
              ? "/dashboard"
              : token
              ? "#" // handled in onClick
              : plan.href;

            return (
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
                {plan.popular && (
                  <div className="pointer-events-none absolute top-0 right-0 bg-yellow-400 text-black text-xs font-bold px-4 py-1 rounded-bl-lg rounded-tr-lg">
                    MOST POPULAR
                  </div>
                )}

                <div
                  className={`pointer-events-none absolute -inset-0.5 bg-gradient-to-r ${
                    plan.popular ? "from-yellow-400 to-amber-500" : "from-purple-600 to-indigo-500"
                  } rounded-xl blur opacity-0 group-hover:opacity-30 transition duration-300`}
                />

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
                    <div className="text-gray-400 text-sm">per month</div>
                  </div>

                  <ul className="space-y-3 text-sm text-gray-300 text-left mb-8">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2">
                        <CheckCircle2
                          className={`flex-shrink-0 ${
                            plan.popular ? "text-yellow-400" : "text-purple-400"
                          } w-4 h-4 mt-0.5`}
                        />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Link
                  to={linkTo}
                  onClick={onPayClick(plan.key)}
                  className={`relative z-10 w-full mt-auto py-3 rounded-xl font-semibold transition-all duration-300 text-center ${
                    plan.popular
                      ? "bg-gradient-to-r from-yellow-400 to-amber-500 text-black hover:shadow-lg hover:shadow-yellow-500/30"
                      : "bg-gradient-to-r from-purple-500 to-indigo-500 text-white hover:shadow-lg hover:shadow-purple-500/30"
                  } flex items-center justify-center gap-2 ${userLoading || entLoading ? "opacity-70 cursor-not-allowed" : ""}`}
                  aria-disabled={userLoading || entLoading}
                >
                  {label}
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            );
          })}
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
