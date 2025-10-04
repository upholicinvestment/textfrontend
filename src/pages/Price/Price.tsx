// src/pages/Price/Price.tsx
import { JSX, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiX } from "react-icons/fi";
import { useNavigate, Link, useLocation } from "react-router-dom";
import api from "../../api";
import {
  CheckCircle2,
  ChevronRight,
  BadgeCheck,
  Shield,
  TrendingUp,
  Gem,
} from "lucide-react";
import { useEntitlements } from "../../hooks/useEntitlements";

/* ================= Types ================= */
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

/* =============== Helpers =============== */
const normalizeVariantKey = (k: string) => {
  const s = (k || "").toLowerCase().trim();
  if (["starter", "starter_scalping"].includes(s)) return "starter";
  if (["pro", "option_scalper_pro", "option-scalper-pro"].includes(s)) return "pro";
  if (["swing", "sniper_algo", "swing_trader_master", "swing-trader-master"].includes(s))
    return "swing";
  return s;
};

const variantDescription = (k: string) => {
  if (k === "starter")
    return "Perfect for beginners starting with algorithmic trading";
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

/* ------------ robust key extractor (for /users/me snapshot) ------------- */
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

/* ================= Component ================= */
const Price = () => {
  const [selectedBundle, setSelectedBundle] = useState(1);
  const [selectedAlgo, setSelectedAlgo] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"bundle" | "algo" | "journaling">(
    "bundle"
  );

  // Billing toggles
  const [bundleBilling, setBundleBilling] = useState<"monthly" | "yearly">("monthly");
  const [journalBilling, setJournalBilling] = useState<"monthly" | "yearly">("monthly");

  const [products, setProducts] = useState<Product[]>([]);
  const navigate = useNavigate();

  // read renew intent from query params
  const { search } = useLocation();
  const qs = useMemo(() => new URLSearchParams(search), [search]);
  const wantsRenew = qs.get("renew") === "1";
  const renewProductKey = (qs.get("productKey") || "").toLowerCase();

  // 🔗 helper to build /signup?productKey=...&variantKey=...&interval=...
  const toRegister = (
    productKey?: string | null,
    variantKey?: string | null,
    interval?: "monthly" | "yearly"
  ) => {
    const params = new URLSearchParams();
    if (productKey) params.set("productKey", productKey);
    if (variantKey) params.set("variantKey", variantKey);
    if (interval) params.set("interval", interval);
    const qs = params.toString();
    return `/signup${qs ? `?${qs}` : ""}`;
  };

  // ========= ownership sources (entitlements + snapshot) =========
  const { items: entitlements, loading: entLoading } = useEntitlements();
  const [userSnapshot, setUserSnapshot] = useState<any>(null);
  const [userLoading, setUserLoading] = useState<boolean>(false);

  useEffect(() => {
    (async () => {
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
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get<Product[]>("/products");
        setProducts(res.data || []);
      } catch {
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

  // open relevant tab when arriving from renew URL
  useEffect(() => {
    if (!wantsRenew) return;
    if (renewProductKey === "algo_simulator") setActiveTab("algo");
    else if (
      renewProductKey === "journaling" ||
      renewProductKey === "journaling_solo"
    )
      setActiveTab("journaling");
    else if (renewProductKey === "essentials_bundle") setActiveTab("bundle");
  }, [wantsRenew, renewProductKey]);

  // ---------- Pricing helpers ----------
  const fmtINR = (n: number) => `₹${n.toLocaleString("en-IN")}`;

  // Fallback sample numbers (replace with real ones or keep env-backed)
  const BUNDLE_MONTHLY = 499; // 499
  const BUNDLE_ANNUAL = 4999; // 4999
  const JOURNAL_MONTHLY = 299; // 299
  const JOURNAL_ANNUAL = 2499; // 2499

  const bundleMonthlyNum =
    typeof bundle?.priceMonthly === "number" ? bundle.priceMonthly : BUNDLE_MONTHLY;
  const bundleAnnualNum = BUNDLE_ANNUAL;

  const journalingMonthlyNum =
    typeof journaling?.priceMonthly === "number"
      ? journaling.priceMonthly
      : JOURNAL_MONTHLY;
  const journalingAnnualNum = JOURNAL_ANNUAL;

  const bundleSavePct = Math.round(
    (1 - bundleAnnualNum / (bundleMonthlyNum * 12)) * 100
  );
  const journalingSavePct = Math.round(
    (1 - journalingAnnualNum / (journalingMonthlyNum * 12)) * 100
  );

  const displayBundlePrice =
    bundleBilling === "monthly" ? fmtINR(bundleMonthlyNum) : fmtINR(bundleAnnualNum);
  const bundlePeriod = bundleBilling === "monthly" ? "month" : "year";

  const displayJournalPrice =
    journalBilling === "monthly"
      ? fmtINR(journalingMonthlyNum)
      : fmtINR(journalingAnnualNum);
  const journalingPeriod = journalBilling === "monthly" ? "month" : "year";

  const bundleTools = [
    {
      id: 1,
      name: "Journaling",
      description: "Trade journal with performance analytics and insights",
      icon: "📝",
      features: ["Trade tracking", "Performance metrics", "Psychology markers", "Export reports"],
    },
    {
      id: 2,
      name: "FII/DII Data",
      description: "Institutional flow tracking with advanced analytics",
      icon: "🏛️",
      features: ["Real-time flows", "Historical data", "Sector-wise analysis", "Correlation tools"],
    },
  ];

  const selectedBundleTool =
    bundleTools.find((t) => t.id === selectedBundle) || bundleTools[0];

  // ========= ALGO OWNERSHIP + CHECKOUT =========
  const OWN_KEYS_BY_VARIANT: Record<"starter" | "pro" | "swing", string[]> = {
    starter: ["starter", "starter_scalping"],
    pro: ["pro", "option_scalper_pro", "option-scalper-pro"],
    swing: ["swing", "sniper_algo", "swing_trader_master", "swing-trader-master"],
  };

  const collectEntitlementVariantKeys = () => {
    const keys = new Set<string>();
    for (const it of entitlements || []) {
      const single =
        (it as any)?.variant?.key && normalizeVariantKey((it as any).variant.key);
      if (single) keys.add(single);
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

  const ownedExactVariant = (normVariant: "starter" | "pro" | "swing") => {
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

  const variantIdFor = (norm: "starter" | "pro" | "swing") => {
    const wanted = OWN_KEYS_BY_VARIANT[norm].map((k) => normalizeVariantKey(k));
    const found = algo?.variants?.find((v) =>
      wanted.includes(normalizeVariantKey(v.key))
    );
    return found?._id || null;
  };

  // --- expiry helpers ---
  const startOfDay = (d: Date) => {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
  };
  const daysUntil = (iso?: string) => {
    if (!iso) return Infinity;
    const t = startOfDay(new Date());
    const e = startOfDay(new Date(iso));
    return Math.ceil((e.getTime() - t.getTime()) / 86400000);
  };
  const ACTIVE = (x: any) =>
    String(x?.status || "inactive").toLowerCase() === "active" &&
    (!x?.endsAt || new Date(x.endsAt).getTime() > Date.now());

  const endDateFor = (it: any): string | undefined =>
    it?.endsAt ||
    it?.subscription?.endsAt ||
    it?.license?.endsAt ||
    it?.meta?.endsAt ||
    it?.variant?.endsAt;

  const isExpiringSoon = (key: string, win = 7, variantKey?: string) => {
    for (const it of entitlements || []) {
      const k = String((it as any)?.key || "").toLowerCase();
      if (k !== key) continue;
      if (!ACTIVE(it)) continue;
      if (variantKey) {
        const vkey = normalizeVariantKey((it as any)?.variant?.key || "");
        if (vkey && vkey !== normalizeVariantKey(variantKey)) continue;
      }
      const d = daysUntil(endDateFor(it));
      if (Number.isFinite(d) && d >= 0 && d <= win) return true;
    }
    return false;
  };

  // Bundle expiry via bundled components
  const expiringBundle = useMemo(() => {
    const comps = (entitlements || []).filter((it: any) => {
      const k = String(it?.key || "").toLowerCase();
      const fromBundle = String(it?.meta?.source || "")
        .toLowerCase()
        .includes("bundle");
      return ACTIVE(it) && fromBundle && (k === "journaling" || k === "fii_dii_data");
    });
    if (!comps.length) return false;
    const soonest = Math.min(
      ...comps
        .map((it: any) => daysUntil(endDateFor(it)))
        .filter((n: number) => Number.isFinite(n))
    );
    return Number.isFinite(soonest) && soonest >= 0 && soonest <= 7;
  }, [entitlements]);

  // Journaling expiring (solo only; if bundle covers it, don't show renew)
  const expiringJournalingSolo = useMemo(() => {
    const ownsBundleViaComponents = (entitlements || []).some((it: any) => {
      const k = String(it?.key || "").toLowerCase();
      const fromBundle = String(it?.meta?.source || "")
        .toLowerCase()
        .includes("bundle");
      return ACTIVE(it) && fromBundle && (k === "journaling" || k === "fii_dii_data");
    });
    if (ownsBundleViaComponents) return false;
    return (
      isExpiringSoon("journaling", 7) || isExpiringSoon("journaling_solo", 7)
    );
  }, [entitlements]);

  const expiringStarter = isExpiringSoon("algo_simulator", 7, "starter");
  const expiringPro = isExpiringSoon("algo_simulator", 7, "pro");
  const expiringSwing = isExpiringSoon("algo_simulator", 7, "swing");

  /* ---------- Checkout helpers (purchase/upgrade/renew) ---------- */
  const openProductCheckout = async (
    product: Product,
    interval: "monthly" | "yearly",
    renew = false
  ) => {
    try {
      const orderRes = await api.post("/payments/create-order", {
        productId: product._id,
        billingInterval: interval,
        ...(renew ? { renew: true } : {}),
      });

      if (orderRes.status === 204) {
        navigate("/dashboard", { replace: true });
        return;
      }

      const ord = orderRes.data;
      const ok = await loadRazorpay();
      if (!ok || !(window as any).Razorpay) {
        navigate("/dashboard");
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
          await api.post("/payments/verify", {
            intentId: ord.intentId,
            razorpay_order_id: rsp.razorpay_order_id,
            razorpay_payment_id: rsp.razorpay_payment_id,
            razorpay_signature: rsp.razorpay_signature,
          });
          navigate("/dashboard", { replace: true });
        },
      });

      rz.open();
    } catch {
      // keep user on page
    }
  };

  const openAlgoCheckout = async (
    normVariant: "starter" | "pro" | "swing",
    renew = false
  ) => {
    try {
      if (!algo) {
        navigate(toRegister("algo_simulator", normVariant));
        return;
      }
      const vId = variantIdFor(normVariant);
      if (!vId) {
        navigate(toRegister("algo_simulator", normVariant));
        return;
      }

      const orderRes = await api.post("/payments/create-order", {
        productId: algo._id,
        variantId: vId,
        ...(renew ? { renew: true } : {}),
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

  const onAlgoCtaClick =
    (variantKey: "starter" | "pro" | "swing") =>
    async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const token = localStorage.getItem("token");
      const isOwned = ownedExactVariant(variantKey);
      const isExpiring =
        (variantKey === "starter" && expiringStarter) ||
        (variantKey === "pro" && expiringPro) ||
        (variantKey === "swing" && expiringSwing);

      if (isOwned && isExpiring && token) {
        await openAlgoCheckout(variantKey, true); // direct renewal
        return;
      } else if (isOwned) {
        navigate("/dashboard");
        return;
      }
      if (!token) {
        navigate(toRegister("algo_simulator", variantKey));
        return;
      }
      await openAlgoCheckout(variantKey);
    };

  // ---------- ALGO plans ----------
  const algoPlans = useMemo(() => {
    const vs = (algo?.variants || []).map((v) => {
      const normKey = normalizeVariantKey(v.key) as "starter" | "pro" | "swing";
      return {
        id: v.key === "starter" ? 1 : v.key === "pro" ? 2 : 3,
        key: normKey,
        name: v.name,
        price: v.priceMonthly ? `₹${v.priceMonthly.toLocaleString("en-IN")}` : "₹1",
        period: "month",
        description: variantDescription(normKey),
        features: variantFeatures(normKey),
        popular: normKey === "pro",
        variantId: v._id,
      };
    });

    const rank = (k: "starter" | "pro" | "swing") => ({ starter: 1, pro: 2, swing: 3 }[k]);
    vs.sort((a, b) => rank(a.key) - rank(b.key));

    if (vs.length && selectedAlgo === null)
      setSelectedAlgo(vs.find((x) => x.popular)?.id ?? vs[0].id);
    return vs;
  }, [algo, selectedAlgo]);

  // ======== BUNDLE OWNERSHIP DECISION ========
  type BundleStatus = { owned: boolean; interval: "monthly" | "yearly" | null };

  const getBundleStatus = (items: any[]): BundleStatus => {
    const byKey = (k: string) =>
      (items || []).find(
        (it) =>
          String(it?.key || "").toLowerCase() === k &&
          ACTIVE(it)
      );

    // Direct bundle entitlement (if you store one)
    const bundleEnt = byKey("essentials_bundle");
    if (bundleEnt) {
      const rawInterval =
        (bundleEnt?.meta && (bundleEnt.meta as any).interval) ||
        (bundleEnt?.variant && (bundleEnt.variant as any).interval) ||
        (Array.isArray(bundleEnt?.variants) && bundleEnt.variants.length
          ? (bundleEnt.variants[0] as any)?.interval
          : null) ||
        null;

      const iv =
        rawInterval === "yearly"
          ? "yearly"
          : rawInterval === "monthly"
          ? "monthly"
          : null;

      return { owned: true, interval: iv };
    }

    // Infer bundle from components granted via bundle
    const comps = (items || []).filter((it: any) => {
      const k = String(it?.key || "").toLowerCase();
      const fromBundle = String(it?.meta?.source || "")
        .toLowerCase()
        .includes("bundle");
      return ACTIVE(it) && fromBundle && (k === "journaling" || k === "fii_dii_data");
    });

    if (comps.length) {
      const durDays = (it: any) => {
        const s = it?.startedAt ? new Date(it.startedAt).getTime() : NaN;
        const e = it?.endsAt ? new Date(it.endsAt).getTime() : NaN;
        if (!isFinite(s) || !isFinite(e) || e <= s) return NaN;
        return (e - s) / 86400000;
      };
      const days = comps
        .map((c) => durDays(c))
        .filter((n) => Number.isFinite(n)) as number[];
      const avg = days.length ? days.reduce((a, b) => a + b, 0) / days.length : NaN;
      const interval: "monthly" | "yearly" =
        Number.isFinite(avg) && avg >= 300 ? "yearly" : "monthly";
      return { owned: true, interval };
    }

    return { owned: false, interval: null };
  };

  const bundleStatus = getBundleStatus(entitlements as any);

  /** Bundle CTA label */
  const bundleCtaLabel = (() => {
    if (userLoading || entLoading) return "Checking...";
    if (!bundleStatus.owned) {
      return `Get Complete Bundle - ${displayBundlePrice}/${bundlePeriod}`;
    }
    if (bundleStatus.interval === "yearly") {
      return "Go to Dashboard";
    }
    if (bundleBilling === "monthly") {
      return "Go to Dashboard";
    }
    return `Get Complete Bundle - ${fmtINR(bundleAnnualNum)}/year`;
  })();

  /** Bundle CTA click behavior (now opens Razorpay when logged-in) */
  const handleBundleCta = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (userLoading || entLoading || !bundle) return;

    const token = localStorage.getItem("token");

    // Not logged-in → go to signup
    if (!token) {
      navigate(toRegister("essentials_bundle", null, bundleBilling));
      return;
    }

    // Logged-in
    if (bundleStatus.owned) {
      if (bundleStatus.interval === "yearly") {
        navigate("/dashboard");
        return;
      }
      if (bundleBilling === "monthly") {
        navigate("/dashboard");
        return;
      }
      // Own monthly, toggled yearly → upgrade via Razorpay
      await openProductCheckout(bundle, "yearly");
      return;
    }

    // Fresh purchase → Razorpay
    await openProductCheckout(bundle, bundleBilling);
  };

  // ======== JOURNALING OWNERSHIP (SOLO) ========
  type SingleStatus = { owned: boolean; interval: "monthly" | "yearly" | null };

  const getSingleStatus = (items: any[], keys: string[]): SingleStatus => {
    const ent = (items || []).find(
      (it: any) =>
        keys.includes(String(it?.key || "").toLowerCase()) && ACTIVE(it)
    );

    if (!ent) return { owned: false, interval: null };

    const rawInterval =
      (ent?.meta && (ent.meta as any).interval) ||
      (ent?.variant && (ent.variant as any).interval) ||
      (Array.isArray(ent?.variants) && ent.variants.length
        ? (ent.variants[0] as any)?.interval
        : null) ||
      null;

    if (rawInterval === "yearly" || "monthly") {
      const iv =
        rawInterval === "yearly"
          ? "yearly"
          : rawInterval === "monthly"
          ? "monthly"
          : null;
      if (iv) return { owned: true, interval: iv };
    }

    const s = ent?.startedAt ? new Date(ent.startedAt).getTime() : NaN;
    const e = ent?.endsAt ? new Date(ent.endsAt).getTime() : NaN;
    const days = isFinite(s) && isFinite(e) && e > s ? (e - s) / 86400000 : NaN;
    const interval = isFinite(days) && days >= 300 ? "yearly" : "monthly";

    return { owned: true, interval };
  };

  const journalingStatus = getSingleStatus(
    entitlements as any,
    ["journaling", "journaling_solo", "trading_journal_pro"]
  );

  /** Journaling CTA label */
  const journalingCtaLabel = (() => {
    if (userLoading || entLoading) return "Checking...";
    if (!journalingStatus.owned) {
      return `Get Journaling Only - ${displayJournalPrice}/${journalingPeriod}`;
    }
    if (journalingStatus.interval === "yearly") {
      return "Go to Dashboard";
    }
    if (journalBilling === "monthly") {
      return "Go to Dashboard";
    }
    return `Get Journaling Only - ${fmtINR(journalingAnnualNum)}/year`;
  })();

  /** Journaling CTA click behavior (opens Razorpay if logged-in) */
  const handleJournalingCta = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (userLoading || entLoading || !journaling) return;

    const token = localStorage.getItem("token");

    if (journalingStatus.owned) {
      if (journalingStatus.interval === "yearly") {
        navigate("/dashboard");
        return;
      }
      if (journalBilling === "monthly") {
        navigate("/dashboard");
        return;
      }
      // Own monthly, toggled yearly → upgrade
      if (!token) {
        navigate(toRegister(journaling.key || "journaling_solo", null, "yearly"));
        return;
      }
      await openProductCheckout(journaling, "yearly");
      return;
    }

    // Not owned
    if (!token) {
      navigate(toRegister(journaling.key || "journaling_solo", null, journalBilling));
      return;
    }
    await openProductCheckout(journaling, journalBilling);
  };

  /* ================= RENDER ================= */
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
          {/* ===== Hero Heading ===== */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="text-center mb-10 md:mb-14"
          >
            <div className="text-xs md:text-sm font-semibold tracking-[0.25em] text-sky-400/90 uppercase mb-3">
              Trader&apos;s Toolkit
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold leading-tight">
              <span className="text-white">Professional </span>
              <span className="bg-gradient-to-r from-sky-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
                Trading Tools
              </span>
            </h1>
            <p className="mt-3 md:mt-4 text-gray-300 md:text-lg">
              Advanced analytics and automation for serious traders
            </p>
          </motion.div>

          {/* Header Tabs */}
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
                {/* ======= BUNDLE SECTION ======= */}
                <div className="max-w-4xl mx-auto relative rounded-3xl overflow-hidden border border-gray-700 bg-[#0b0f1a] shadow-2xl">
                  {/* glow */}
                  <div className="pointer-events-none absolute -inset-px rounded-3xl bg-gradient-to-r from-blue-600/20 via-indigo-500/20 to-purple-600/20 blur opacity-60" />

                  {/* Hero */}
                  <div className="relative bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-700">
                    <div className="px-6 py-8 md:px-10">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
                        <div>
                          <div className="inline-flex items-center gap-2 bg-white/15 border border-white/25 text-white text-xs font-semibold px-3 py-1 rounded-full mb-2">
                            <BadgeCheck className="w-4 h-4 text-yellow-300" />
                            BEST VALUE
                          </div>
                          <h2 className="text-2xl md:text-3xl font-bold">
                            Trader&apos;s Essential Bundle
                          </h2>
                          <p className="text-blue-100 mt-1">
                            All 2 premium tools for the price of one
                          </p>
                        </div>

                        <div className="text-right">
                          {/* Billing toggle */}
                          <div className="flex items-center justify-end mb-3">
                            <div className="inline-flex rounded-xl bg-white/10 border border-white/20 p-1">
                              <button
                                onClick={() => setBundleBilling("monthly")}
                                className={`px-3 py-1.5 text-sm rounded-lg ${
                                  bundleBilling === "monthly"
                                    ? "bg-white/30 text-white"
                                    : "text-blue-100"
                                }`}
                              >
                                Monthly
                              </button>
                              <button
                                onClick={() => setBundleBilling("yearly")}
                                className={`px-3 py-1.5 text-sm rounded-lg relative ${
                                  bundleBilling === "yearly"
                                    ? "bg-white/30 text-white"
                                    : "text-blue-100"
                                }`}
                              >
                                Yearly
                                {bundleBilling === "yearly" && (
                                  <span className="ml-2 inline-flex items-center gap-1 text-green-400 text-xl font-semibold">
                                    Save {bundleSavePct}%
                                  </span>
                                )}
                              </button>
                            </div>
                          </div>

                          <div className="text-sm text-blue-200">Starts at</div>
                          <div className="text-3xl md:text-4xl font-bold leading-none">
                            {displayBundlePrice}
                            <span className="text-lg font-normal">/{bundlePeriod}</span>
                          </div>
                          <div className="text-xs md:text-sm text-blue-100 mt-1">
                            No hidden fees • Cancel anytime
                          </div>
                        </div>
                      </div>

                      {/* Highlights */}
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

                    {/* Tool cards */}
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

                      <div className="flex items-center">
                        {/* Use a button so we can intercept and open Razorpay when logged-in */}
                        <button
                          aria-label="Get Complete Bundle"
                          onClick={handleBundleCta}
                          className="group inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold py-3 px-6 rounded-xl transition-all shadow-lg disabled:opacity-60"
                          disabled={userLoading || entLoading || !bundle}
                        >
                          {bundleCtaLabel}
                          <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                        </button>

                        {/* Renew now for Bundle — based on component entitlements */}
                        {bundle && bundleStatus.owned && expiringBundle && (
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              if (!localStorage.getItem("token")) {
                                navigate(
                                  toRegister(bundle.key, null, bundleBilling) + "&renew=1"
                                );
                                return;
                              }
                              openProductCheckout(bundle, bundleBilling, true);
                            }}
                            className="ml-3 inline-flex items-center gap-2 border border-emerald-500 text-emerald-400 hover:bg-emerald-900/30 font-semibold py-3 px-6 rounded-xl transition-all"
                          >
                            Renew now
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                {/* ======= /BUNDLE SECTION ======= */}
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
                    Advanced automation for scalping & swing strategies. Connect your
                    broker & run tested systems.
                  </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8 items-start">
                  {algoPlans.map((plan) => {
                    const isSelected = selectedAlgo === plan.id;
                    const popular = plan.popular;

                    const token =
                      typeof window !== "undefined"
                        ? localStorage.getItem("token")
                        : null;

                    const isOwned =
                      plan.key === "starter"
                        ? ownedExactVariant("starter")
                        : plan.key === "pro"
                        ? ownedExactVariant("pro")
                        : ownedExactVariant("swing");

                    const label =
                      userLoading || entLoading
                        ? "Checking..."
                        : isOwned &&
                          ((plan.key === "starter" && expiringStarter) ||
                            (plan.key === "pro" && expiringPro) ||
                            (plan.key === "swing" && expiringSwing))
                        ? "Renew Now"
                        : isOwned
                        ? "Open Dashboard"
                        : token
                        ? "Pay Now"
                        : "Get Started";

                    const linkTo = isOwned
                      ? "/dashboard"
                      : token
                      ? "#"
                      : toRegister(algo?.key || "algo_simulator", plan.key);

                    return (
                      <motion.div
                        key={plan.key}
                        whileHover={{ scale: 1.05 }}
                        transition={{ duration: 0.25 }}
                        style={{ transformOrigin: "center" }}
                        className="w-full"
                      >
                        <div
                          className={`relative w-full max-w-[360px] rounded-2xl border ${
                            popular ? "border-yellow-400" : "border-purple-600/50"
                          } bg-[#101223] px-6 py-10 ${
                            popular ? "shadow-yellow-500/20" : "shadow-purple-500/20"
                          } shadow-2xl group h-full mx-auto flex flex-col justify-between transition-all duration-300 ${
                            isSelected ? "transform scale-105" : ""
                          } ${popular ? "md:-translate-y-5" : ""}`}
                          onClick={() => setSelectedAlgo(plan.id)}
                        >
                          {popular && (
                            <div className="pointer-events-none absolute top-0 right-0 bg-yellow-400 text-black text-xs font-bold px-4 py-1 rounded-bl-lg rounded-tr-lg">
                              MOST POPULAR
                            </div>
                          )}

                          <div
                            className={`pointer-events-none absolute -inset-0.5 bg-gradient-to-r ${
                              popular
                                ? "from-yellow-400 to-amber-500"
                                : "from-purple-600 to-indigo-500"
                            } rounded-xl blur opacity-0 group-hover:opacity-30 transition duration-300`}
                          />

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
                              <div className="text-gray-400 text-sm">per month</div>
                            </div>

                            <ul className="space-y-3 text-sm text-gray-300 text-left mb-8">
                              {plan.features.map((f) => (
                                <li key={f} className="flex items-start gap-2">
                                  <CheckCircle2
                                    className={`flex-shrink-0 ${
                                      popular ? "text-yellow-400" : "text-purple-400"
                                    } w-4 h-4 mt-0.5`}
                                  />
                                  <span>{f}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          <Link
                            to={linkTo}
                            onClick={(e) =>
                              onAlgoCtaClick(plan.key as "starter" | "pro" | "swing")(e)
                            }
                            className={`relative z-10 w-full mt-auto py-3 rounded-xl font-semibold transition-all duration-300 text-center ${
                              popular
                                ? "bg-gradient-to-r from-yellow-400 to-amber-500 text-black hover:shadow-lg hover:shadow-yellow-500/30"
                                : "bg-gradient-to-r from-purple-500 to-indigo-500 text-white hover:shadow-lg hover:shadow-purple-500/30"
                            } flex items-center justify-center gap-2 ${
                              userLoading || entLoading
                                ? "opacity-70 cursor-not-allowed"
                                : ""
                            }`}
                            aria-disabled={userLoading || entLoading}
                            aria-label={`${label} for ${plan.name}`}
                          >
                            {label}
                            <ChevronRight className="w-4 h-4" />
                          </Link>
                        </div>
                      </motion.div>
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
                  <h2 className="text-3xl font-bold mb-2">Advanced Trading Journal</h2>
                  <p className="text-gray-400 max-w-2xl mx-auto">
                    Transform your trading performance with detailed analytics, psychological
                    insights, and actionable feedback
                  </p>
                </div>

                <div className="rounded-2xl overflow-hidden shadow-xl bg-gray-800 border border-gray-700 max-w-5xl mx-auto">
                  {/* Header band with toggle & price */}
                  <div className="relative">
                    <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-10 md:px-12 text-white">
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                        <div className="mb-6 md:mb-0">
                          <h2 className="text-2xl font-bold mb-2">Trading Journal Pro</h2>
                          <p className="text-blue-100">
                            Comprehensive trade analysis with psychological insights and
                            performance tracking
                          </p>
                        </div>

                        <div className="text-right">
                          {/* Billing toggle */}
                          <div className="flex items-center justify-end mb-3">
                            <div className="inline-flex rounded-xl bg-white/10 border border-white/20 p-1">
                              <button
                                onClick={() => setJournalBilling("monthly")}
                                className={`px-3 py-1.5 text-sm rounded-lg ${
                                  journalBilling === "monthly"
                                    ? "bg-white/30 text-white"
                                    : "text-blue-100"
                                }`}
                              >
                                Monthly
                              </button>
                              <button
                                onClick={() => setJournalBilling("yearly")}
                                className={`px-3 py-1.5 text-sm rounded-lg relative ${
                                  journalBilling === "yearly"
                                    ? "bg-white/30 text-white"
                                    : "text-blue-100"
                                }`}
                              >
                                Yearly
                                {journalBilling === "yearly" && (
                                  <span className="ml-2 inline-flex items-center gap-1 text-green-300 text-xl font-semibold">
                                    Save {journalingSavePct}%
                                  </span>
                                )}
                              </button>
                            </div>
                          </div>

                          <div className="text-3xl font-bold">
                            {displayJournalPrice}
                            <span className="text-lg font-normal">/{journalingPeriod}</span>
                          </div>
                          <div className="text-sm text-blue-200 mt-1">
                            No hidden fees • Cancel anytime
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Content: two feature cards */}
                    <div className="p-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                        {/* Performance Analytics card */}
                        <div className="bg-gray-700/30 p-6 rounded-xl border border-gray-600">
                          <div className="flex items-center mb-4">
                            <div className="bg-blue-700 p-3 rounded-lg mr-4">
                              <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2z" />
                              </svg>
                            </div>
                            <h3 className="text-xl font-semibold text-blue-400">Performance Analytics</h3>
                          </div>
                          <p className="text-gray-300 mb-4">
                            Deep dive into your trading metrics with advanced analytics that highlight your strengths and pinpoint areas for improvement.
                          </p>
                          <ul className="text-sm text-gray-400 space-y-2">
                            <li className="flex items-center">
                              <svg className="h-4 w-4 text-green-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              Win rate analysis by strategy & market condition
                            </li>
                            <li className="flex items-center">
                              <svg className="h-4 w-4 text-green-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              Risk-reward ratio tracking
                            </li>
                            <li className="flex items-center">
                              <svg className="h-4 w-4 text-green-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              Performance benchmarking
                            </li>
                          </ul>
                        </div>

                        {/* Psychological Insights card */}
                        <div className="bg-gray-700/30 p-6 rounded-xl border border-gray-600">
                          <div className="flex items-center mb-4">
                            <div className="bg-purple-700 p-3 rounded-lg mr-4">
                              <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </div>
                            <h3 className="text-xl font-semibold text-purple-400">Psychological Insights</h3>
                          </div>
                          <p className="text-gray-300 mb-4">
                            Understand your emotional patterns and psychological triggers that impact your trading decisions and outcomes.
                          </p>
                          <ul className="text-sm text-gray-400 space-y-2">
                            <li className="flex items-center">
                              <svg className="h-4 w-4 text-green-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              Emotional state tracking
                            </li>
                            <li className="flex items-center">
                              <svg className="h-4 w-4 text-green-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              Bias identification tools
                            </li>
                            <li className="flex items-center">
                              <svg className="h-4 w-4 text-green-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              Mindset improvement exercises
                            </li>
                          </ul>
                        </div>
                      </div>

                      {/* Features grid */}
                      <div className="bg-black/20 rounded-lg p-6 mb-8 border border-gray-700">
                        <div className="text-center text-lg font-semibold mb-4 text-blue-300">COMPREHENSIVE FEATURES</div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-center">
                          {[
                            "Trade tracking & performance analytics",
                            "Psychology markers & emotional tracking",
                            "Exportable reports in multiple formats",
                            "Custom tagging & categorization",
                            "Advanced filtering & search",
                            "Portfolio correlation analysis",
                            "Trade replay functionality",
                            "Risk management statistics",
                          ].map((feature, index) => (
                            <div key={index} className="bg-gray-800/50 p-3 rounded-lg border border-gray-700">
                              <div className="text-sm text-gray-300">{feature}</div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* CTA row */}
                      <div className="flex flex-col sm:flex-row justify-between items-center pt-6 border-t border-gray-700">
                        <div className="mb-4 sm:mb-0">
                          <div className="text-gray-400 text-sm mb-1">
                            {bundleStatus.owned ? "Included in your Essential Bundle" : "Included in Essential Bundle"}
                          </div>
                          <div className="flex items-center text-white">
                            <svg className="h-5 w-5 text-green-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Save 60% when purchased as part of the bundle
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4">
                          {/* Bundle CTA */}
                          <button
                            aria-label="Get Complete Bundle"
                            onClick={handleBundleCta}
                            className="bg-gradient-to-r from-blue-700 to-purple-700 hover:from-blue-600 hover:to-purple-600 text-white font-semibold py-3 px-6 rounded-lg transition-all shadow-md mb-2 sm:mb-0 disabled:opacity-60"
                            disabled={userLoading || entLoading || !bundle}
                          >
                            {bundleStatus.owned
                              ? bundleStatus.interval === "yearly" || bundleBilling === "monthly"
                                ? "Go to Dashboard"
                                : `Get Complete Bundle - ${fmtINR(BUNDLE_ANNUAL)}/year`
                              : `Get Complete Bundle - ${displayBundlePrice}/${bundlePeriod}`}
                          </button>

                          {/* Journaling-only CTA (hidden if bundle owned) */}
                          {!bundleStatus.owned && (
                            <button
                              onClick={handleJournalingCta}
                              aria-label={journalingCtaLabel}
                              className={`border font-semibold py-3 px-6 rounded-lg transition-all ${
                                journalingStatus.owned
                                  ? "border-emerald-500 text-emerald-400 hover:bg-emerald-900/30"
                                  : "border-blue-500 text-blue-400 hover:bg-blue-900/30"
                              } disabled:opacity-60`}
                              disabled={userLoading || entLoading || !journaling}
                            >
                              {journalingCtaLabel}
                            </button>
                          )}

                          {/* Renew now (journaling SOLO) */}
                          {journaling &&
                            expiringJournalingSolo && (
                              <button
                                onClick={async (e) => {
                                  e.preventDefault();
                                  const token = localStorage.getItem("token");
                                  if (!token) {
                                    navigate(
                                      toRegister(
                                        journaling.key || "journaling_solo",
                                        null,
                                        journalBilling
                                      ) + "&renew=1"
                                    );
                                    return;
                                  }
                                  await openProductCheckout(journaling, journalBilling, true);
                                }}
                                className="border border-emerald-500 text-emerald-400 hover:bg-emerald-900/30 font-semibold py-3 px-6 rounded-lg transition-all"
                              >
                                Renew now
                              </button>
                            )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                {/* ======= /JOURNALING SECTION ======= */}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </>
  );
};

export default Price;
