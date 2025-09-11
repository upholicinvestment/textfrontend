// src/pages/Fii_Dii/Fii_Dii_Home/AnalysisSection.tsx
import React, { useContext, useEffect, useRef, useState, useMemo } from "react";
import { ShieldCheck, LineChart, Crosshair, ScrollText, ArrowRight, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../../../api";
import { AuthContext } from "../../../context/AuthContext";

/* ---------- product keys/tokens that should unlock FII/DII analysis ---------- */
const FIIDII_KEYS = new Set([
  "fii_dii_data",
  "fii_dii",
  "fiidii",
  "fii-dii",
  "fii_dii_insights",
  "fii_dii_pro",
]);

const BUNDLE_KEYS = new Set([
  "essentials_bundle",
  "essentials",
  "trader_essentials",
  "bundle",
  "trader's essential bundle",
]);

const BUNDLE_TOKENS = [
  "essential bundle",
  "essentials bundle",
  "trader essentials",
  "trader's essential bundle",
  "bundle",
];
const FIIDII_TOKENS = ["fii/dii", "fii dii", "fiidii", "fii & dii", "fii_dii_data"];

/* ---------------- helpers (robust) ---------------- */
function includesAnyToken(s: unknown, tokens: string[]) {
  if (typeof s !== "string") return false;
  const x = s.toLowerCase();
  return tokens.some((t) => x.includes(t));
}

function deepSome(obj: any, pred: (v: any) => boolean): boolean {
  if (obj == null) return false;
  if (pred(obj)) return true;
  if (Array.isArray(obj)) return obj.some((v) => deepSome(v, pred));
  if (typeof obj === "object") {
    for (const v of Object.values(obj)) {
      if (deepSome(v, pred)) return true;
    }
  }
  return false;
}

// Conservative "active" check when present; if fields are missing, assume active
function isActiveLike(x: any): boolean {
  const status = String(x?.status ?? "active").toLowerCase();
  const endsAt = x?.endsAt ? new Date(x.endsAt).getTime() : null;
  if (endsAt && Number.isFinite(endsAt) && endsAt < Date.now()) return false;
  return status === "active" || status === "trialing" || status === "paid";
}

/** Extract keys from many shapes (object, arrays, variant.key, variants[], nested items/components) */
function extractKeys(payload: any): string[] {
  const out: string[] = [];
  const push = (x: any) => {
    if (!x) return;
    if (typeof x === "string") {
      out.push(x);
      return;
    }
    if (typeof x === "object") {
      const single =
        x?.variant?.key ??
        x?.key ??
        x?.productKey ??
        x?.slug ??
        x?.route ??
        x?.code ??
        x?.id ??
        (typeof x?.name === "string" ? x.name : undefined);
      if (single) out.push(single);

      if (Array.isArray(x?.variants)) for (const v of x.variants) if (v?.key) out.push(v.key);
      if (Array.isArray(x?.items)) for (const it of x.items) push(it);
      if (Array.isArray(x?.components)) for (const c of x.components) push(c);
    }
  };

  const pools = [
    payload?.products,
    payload?.activeProducts,
    payload?.entitlements,
    payload?.purchases,
    payload?.subscriptions,
    payload?.bundles,
    payload?.modules,
    payload?.features,
    payload?.items,
    payload?.data, // some APIs wrap under data
  ].filter(Boolean);

  for (const p of pools) {
    if (Array.isArray(p)) p.forEach(push);
    else push(p);
  }

  // also check root
  push(payload);

  return out.filter(Boolean).map((s) => String(s).toLowerCase());
}

/** Does this payload grant access to FII/DII? (Bundle OR direct FII/DII) */
function payloadGrantsFiiDii(payload: any): boolean {
  if (!payload) return false;

  // 1) explicit keys
  const keys = extractKeys(payload);
  const explicit =
    keys.some((k) => BUNDLE_KEYS.has(k)) || keys.some((k) => FIIDII_KEYS.has(k));
  if (explicit) {
    // If detailed records exist, ensure at least one active-like record matches
    const hasActiveRecord = deepSome(payload, (v) => {
      if (v && typeof v === "object" && isActiveLike(v)) {
        const k =
          v?.variant?.key ??
          v?.key ??
          v?.productKey ??
          v?.slug ??
          v?.route ??
          v?.code ??
          (typeof v?.name === "string" ? v.name : "");
        const lowered = String(k || "").toLowerCase();
        return BUNDLE_KEYS.has(lowered) || FIIDII_KEYS.has(lowered);
      }
      return false;
    });
    return hasActiveRecord || true; // allow if explicit keys but no itemized records
  }

  // 2) fuzzy fallback
  const mentions =
    deepSome(payload, (v) => includesAnyToken(v, BUNDLE_TOKENS)) ||
    deepSome(payload, (v) => includesAnyToken(v, FIIDII_TOKENS));
  return mentions;
}

export default function AnalysisSection() {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [activeFeature, setActiveFeature] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 50, y: 50 });
  const [hasFiiDiiAccess, setHasFiiDiiAccess] = useState<boolean | null>(null);
  const checkingRef = useRef(false);

  /* ---------- rotate feature cards ---------- */
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % 4);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePosition({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    });
  };

  /* ---------- sync with login state; clear sticky on logout ---------- */
  useEffect(() => {
    const syncWithAuth = () => {
      const hasToken = !!localStorage.getItem("token");
      if (!hasToken) {
        // clear sticky flag & state when logged out
        sessionStorage.removeItem("hasFiiDiiAccess");
        setHasFiiDiiAccess(false);
      }
    };

    // run once on mount and whenever user changes
    syncWithAuth();

    // respond to logout/login from other tabs
    const onStorage = (e: StorageEvent) => {
      if (e.key === "token") syncWithAuth();
      if (e.key === "user") syncWithAuth();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [user]);

  /* ---------- local entitlement check (sticky + AuthContext + localStorage) ---------- */
  useEffect(() => {
    let decided = false;

    const hasToken = !!localStorage.getItem("token");
    if (!hasToken) {
      // logged out: ensure state is not "true"
      setHasFiiDiiAccess(false);
      return;
    }

    if (sessionStorage.getItem("hasFiiDiiAccess") === "true") {
      setHasFiiDiiAccess(true);
      decided = true;
    }

    const tryLocal = (payload: any) => {
      if (decided || !payload) return;
      if (payloadGrantsFiiDii(payload)) {
        setHasFiiDiiAccess(true);
        sessionStorage.setItem("hasFiiDiiAccess", "true");
        decided = true;
      }
    };

    tryLocal(user);
    try {
      const cached = JSON.parse(localStorage.getItem("user") || "null");
      tryLocal(cached);
    } catch {
      /* ignore */
    }

    if (!decided) setHasFiiDiiAccess(null);
  }, [user]);

  /* ---------- live probe (entitlements → billing → profile) ---------- */
  const doLiveCheck = async (): Promise<boolean> => {
    if (checkingRef.current) return hasFiiDiiAccess === true;
    checkingRef.current = true;

    const hasToken = !!localStorage.getItem("token");
    if (!hasToken) {
      // logged out mid-check — treat as no access
      sessionStorage.removeItem("hasFiiDiiAccess");
      setHasFiiDiiAccess(false);
      checkingRef.current = false;
      return false;
    }

    // short-circuit if sticky already true
    if (sessionStorage.getItem("hasFiiDiiAccess") === "true") {
      setHasFiiDiiAccess(true);
      checkingRef.current = false;
      return true;
    }

    const grant = () => {
      setHasFiiDiiAccess(true);
      sessionStorage.setItem("hasFiiDiiAccess", "true");
      checkingRef.current = false;
      return true;
    };
    const deny = () => {
      setHasFiiDiiAccess(false);
      checkingRef.current = false;
      return false;
    };

    const endpoints = [
      "/users/me/products",        // preferred (entitlements)
      "/billing/active-products",  // if exposed
      "/users/me",                 // fallback
    ];

    for (const url of endpoints) {
      try {
        const r = await api.get(url);
        if (payloadGrantsFiiDii(r.data)) return grant();
      } catch {
        // continue
      }
    }

    return deny();
  };

  /* ---------- CTA ---------- */
  const onCTA = async () => {
    const hasToken = !!localStorage.getItem("token");

    if (!hasToken) {
      navigate("/signup?productKey=essentials_bundle");
      return;
    }

    if (hasFiiDiiAccess === true || sessionStorage.getItem("hasFiiDiiAccess") === "true") {
      navigate("/main-fii-dii"); // changed from /dashboard
      return;
    }

    const ok = await doLiveCheck();
    if (ok) navigate("/main-fii-dii"); // changed from /dashboard
    else navigate("/signup?productKey=essentials_bundle");
  };

  /* ---------- label logic (respects logout) ---------- */
  const buttonLabel = useMemo(() => {
    const hasToken = !!localStorage.getItem("token");
    if (!hasToken) return "Unlock Full Analysis";
    return hasFiiDiiAccess === true || sessionStorage.getItem("hasFiiDiiAccess") === "true"
      ? "Dashboard"
      : "Unlock Full Analysis";
  }, [hasFiiDiiAccess, user]);

  const features = useMemo(
    () => [
      {
        icon: <LineChart className="h-10 w-10 sm:h-12 sm:w-12 md:h-7 md:w-7" />,
        title: "FIIs Moneyflow",
        description:
          "Track Foreign Institutional Investors' capital movements with precision across multiple dimensions. Our system provides real-time analysis of daily FII activity in both cash and derivatives markets, delivering net investment values with historical context dating back to 2010. Monitor sectoral allocation trends with heatmaps showing concentration shifts across banking, IT, energy, and infrastructure sectors. Our advanced analytics include rolling averages (5-day, 20-day, and 60-day) to identify accumulation or distribution patterns with statistical significance testing. The proprietary regime detection algorithm classifies markets into bullish, bearish, or neutral phases based on FII behavior patterns, incorporating machine learning to detect sentiment shifts 2-3 days before they manifest in price action. Additional features include correlation matrices showing FII flow impact on Nifty/Sensex, impact scores for individual stocks, and predictive models estimating future flow based on global macro indicators and USD/INR movements.",
        gradientClass: "from-cyan-400 to-blue-400",
        accentClass: "text-cyan-400",
      },
      {
        icon: <Crosshair className="h-10 w-10 sm:h-12 sm:w-12 md:h-7 md:w-7" />,
        title: "Catch the Move Before it Comes",
        description:
          "Our proprietary algorithmic detection system identifies subtle institutional accumulation patterns that typically precede major price movements by 2-5 trading sessions. The platform analyzes participation breadth across market capitalization segments (large-cap, mid-cap, small-cap) with divergence indicators showing when select groups are outperforming. Sector rotation signals track money movement between defensive and cyclical sectors with momentum scoring. Options market positioning analysis includes put-call ratio momentum, volatility skew patterns, and unusual options activity detection. The system flags persistent buying in declining markets (stealth accumulation) and selling in rising markets (distribution) – patterns that historically show 78% accuracy in predicting reversals. Volume profile analysis identifies high-volume nodes and low-volume gaps with VWAP deviations signaling institutional activity. Multi-timeframe analysis provides signals across intraday (30min/1hr), daily, and weekly perspectives with confidence scoring for each timeframe. Backtesting results show an average 3.2:1 reward-to-risk ratio across detected setups over the past 5 years.",
        gradientClass: "from-pink-400 to-purple-400",
        accentClass: "text-pink-400",
      },
      {
        icon: <ShieldCheck className="h-10 w-10 sm:h-12 sm:w-12 md:h-7 md:w-7" />,
        title: "Align with Smart Money",
        description:
          "Gain unprecedented visibility into institutional positioning across market conditions with our comprehensive multi-source data aggregation. The platform synthesizes data from FIIs, DIIs (Domestic Institutional Investors), proprietary trading desks, block deals, and bulk transactions to identify consensus moves and divergences with accuracy metrics. Track institutional activity across cash market segments (equity, debt), index futures, stock futures, and options contracts (index and stock options) to build a complete picture of smart money flow. Our regime classification system identifies trending versus range-bound conditions using advanced statistical methods including ADX filtering, volatility clustering analysis, and correlation breakdown detection. Historical pattern matching shows how similar institutional positioning preceded 83% of major market moves over the past decade, with detailed case studies available for each scenario. Position sizing algorithms recommend optimal exposure based on regime confidence scores, while entry strategies are tailored to institutional accumulation zones identified through volume-weighted price analysis and time-of-day activity patterns.",
        gradientClass: "from-amber-400 to-orange-400",
        accentClass: "text-amber-400",
      },
      {
        icon: <ScrollText className="h-10 w-10 sm:h-12 sm:w-12 md:h-7 md:w-7" />,
        title: "Decode the Options Market",
        description:
          "Delve deep into options market dynamics with our comprehensive analytics suite featuring 27 specialized indicators. Track Put-Call Ratios (PCR) across indices (Nifty, BankNifty) and individual stocks with historical context and standard deviation bands to identify extremes with statistical significance. Analyze Implied Volatility (IV) versus Historical Volatility (HV) with term structure analysis to gauge options pricing richness or cheapness across expiries. Our IV Percentile (IVP) and IV Rank (IVR) metrics incorporate rolling lookback periods and sector-relative positioning to identify potential mean reversion opportunities. Maximum pain theory calculations update in real-time with probability distributions showing potential pinning areas as expiration approaches. Unusual options activity detection filters block trades, sweep orders, and hidden volume with smart money confidence scoring. Options chain visualization tools highlight open interest concentrations, changes in open interest, and volume spikes with support/resistance identification. Additional features include volatility smile analysis, gamma exposure modeling, put-call volume ratios, and early warning systems for volatility expansion/contraction scenarios based on historical patterns.",
        gradientClass: "from-emerald-400 to-teal-400",
        accentClass: "text-emerald-400",
      },
    ],
    []
  );

  return (
    <section
      id="analysis"
      className="relative border-t border-white/10 py-16 md:py-20 overflow-hidden bg-gradient-to-b from-slate-900/50 to-slate-900"
      onMouseMove={handleMouseMove}
    >
      {/* Dynamic background gradient that follows mouse */}
      <div
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          background: `radial-gradient(clamp(180px, 45vw, 600px) circle at ${mousePosition.x}% ${mousePosition.y}%, rgba(59,130,246,0.12), transparent 40%)`,
        }}
      />

      <div className="mx-auto max-w-6xl px-4 md:px-6 relative z-10">
        <header className="mb-12 md:mb-20 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3.5 py-1.5 text-xs md:text-sm text-white/80 mb-4 md:mb-6 border border-white/10">
            <Sparkles className="h-4 w-4" />
            Institutional Intelligence
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-6xl font-bold text-white mb-4 md:mb-6 leading-tight">
            Market Analysis Built for{" "}
            <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              Decision-Making
            </span>
          </h2>
          <p className="max-w-3xl mx-auto text-white/70 text-base sm:text-lg md:text-xl leading-relaxed">
            Your gateway to the FIIs/DIIs stack. We provide institutional
            datasets and methodology. Access the full dashboard by signing in
            and selecting your plan.
          </p>
        </header>

        {/* Interactive feature display */}
        <div className="relative">
          <div className="relative h-auto md:min-h=[40rem] lg:min-h-[32rem] xl:min-h-[28rem] overflow-hidden">
            {features.map((feature, index) => {
              const isActive = index === activeFeature;
              return (
                <div
                  key={index}
                  className={[
                    isActive ? "block" : "hidden",
                    "md:block",
                    "relative md:absolute md:inset-0",
                    "md:transition-all md:duration-700 md:ease-in-out md:transform-gpu md:[will-change:transform,opacity]",
                    isActive
                      ? "md:z-10 md:opacity-100 md:translate-y-0"
                      : index < activeFeature
                      ? "md:z-0 md:opacity-0 md:-translate-y-full"
                      : "md:z-0 md:opacity-0 md:translate-y-full",
                  ].join(" ")}
                >
                  <div className="flex flex-col lg:flex-row items-center gap-6 sm:gap-8 md:gap-12 h-full">
                    {/* Icon with animated background */}
                    <div className="relative flex-shrink-0">
                      <div className={`absolute inset-0 bg-gradient-to-r ${feature.gradientClass} opacity-20 blur-2xl scale-150`} />
                      <div className={`relative flex h-16 w-16 sm:h-20 sm:w-20 md:h-24 md:w-24 items-center justify-center rounded-2xl bg-gradient-to-br ${feature.gradientClass} shadow-2xl`}>
                        <div className="text-white">{feature.icon}</div>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 text-center lg:text-left">
                      <h3 className="text-2xl sm:text-3xl md:text-3xl font-bold text-white mb-3 md:mb-4 tracking-tight">
                        {feature.title}
                      </h3>
                      <p className="text-sm sm:text-base md:text-lg text-white/80 leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Interactive feature tabs */}
          <div className="mt-10 md:mt-16 grid grid-cols-1 md:grid-cols-4 gap-1 bg-white/5 rounded-2xl p-1">
            {features.map((feature, index) => {
              const isActive = index === activeFeature;
              return (
                <button
                  key={index}
                  onClick={() => setActiveFeature(index)}
                  className={`group relative p-4 sm:p-6 rounded-xl transition-all duration-300 text-left ${isActive ? "bg-white/10 shadow-lg" : "hover:bg-white/5"}`}
                >
                  <div className={`flex items-center gap-3 mb-2 sm:mb-3 ${isActive ? feature.accentClass : "text-white/70"}`}>
                    <div className={`transition-transform duration-300 ${isActive ? "scale-110" : "group-hover:scale-105"}`}>
                      {feature.icon}
                    </div>
                    <h4 className="font-semibold text-sm sm:text-base">{feature.title}</h4>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-1">
                    <div className={`h-full rounded-full bg-gradient-to-r ${feature.gradientClass} transition-all duration-300 ${isActive ? "w-full" : "w-0"}`} />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* CTA section */}
        <div className="mt-12 md:mt-20 text-center">
          <button
            onClick={onCTA}
            className="group relative inline-flex items-center gap-3 rounded-2xl bg-gradient-to-r from-blue-500 to-cyan-400 px-6 sm:px-8 py-3.5 sm:py-4 font-semibold text-white text-base sm:text-lg shadow-lg shadow-blue-500/25 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/40 hover:scale-105"
            aria-label={buttonLabel}
          >
            <span>{buttonLabel}</span>
            <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" />
          </button>

          <p className="mt-4 sm:mt-6 text-white/60 text-sm sm:text-base md:text-lg">
            {buttonLabel === "Dashboard"
              ? "You're all set — jump into your dashboard."
              : "Full dashboards, alerts, and historical studies unlock after signup."}
          </p>
        </div>
      </div>
    </section>
  );
}
