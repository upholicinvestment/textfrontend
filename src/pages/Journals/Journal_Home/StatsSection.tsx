// src/pages/About/StatsSection.tsx
import { useContext, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import CountUp from "react-countup";
import { useInView } from "react-intersection-observer";
import { motion } from "framer-motion";
import { AuthContext } from "../../../context/AuthContext";
import api from "../../../api";

const stats = [
  { value: 2350, label: "Active Journalers", color: "text-blue-400", circleColor: "border-blue-500" },
  { value: 140, label: "Strategies & Tags", color: "text-emerald-400", circleColor: "border-emerald-500" },
  { value: 8900, label: "Daily Entries & Notes", color: "text-amber-400", circleColor: "border-amber-500" },
  { value: 91.4, label: "Plan–Execution Match", color: "text-purple-400", circleColor: "border-purple-500", suffix: "%" },
];

/* ---------- Entitlement keys that grant JOURNAL access ---------- */
const JOURNAL_KEYS = new Set([
  "journaling_solo",
  "smart_journaling",
  "journaling",
  "trade_journal",
  "trading_journal_pro",
]);

const BUNDLE_KEYS = new Set([
  "essentials_bundle",
  "essentials",
  "trader_essentials",
  "bundle",
]);

/* ---------- Robust key extraction (handles variant.key & variants[]) ---------- */
function extractKeys(anyObj: any): string[] {
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

      if (Array.isArray(x?.variants)) {
        for (const v of x.variants) {
          if (v?.key) out.push(v.key);
        }
      }
    }
  };

  if (!anyObj) return out;

  const pools = [
    anyObj.products,
    anyObj.activeProducts,
    anyObj.entitlements,
    anyObj.purchases,
    anyObj.subscriptions,
    anyObj.bundles,
    anyObj.modules,
    anyObj.features,
    anyObj.items,
  ].filter(Boolean);

  for (const p of pools) {
    if (Array.isArray(p)) p.forEach(push);
    else push(p);
  }

  return out.filter(Boolean).map((s) => String(s).toLowerCase());
}

function payloadGrantsJournal(payload: any): boolean {
  if (!payload) return false;
  const keys = extractKeys(payload);
  return keys.some((k) => JOURNAL_KEYS.has(k)) || keys.some((k) => BUNDLE_KEYS.has(k));
}

/* -------------------------------- component -------------------------------- */
const StatsSection = () => {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.3 });
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [hasJournalAccess, setHasJournalAccess] = useState<boolean | null>(null);
  const checkingRef = useRef(false);

  // Quick local check (sticky + AuthContext + localStorage snapshot)
  useEffect(() => {
    let decided = false;

    if (sessionStorage.getItem("hasJournalAccess") === "true") {
      setHasJournalAccess(true);
      decided = true;
    }

    const tryLocal = (payload: any) => {
      if (decided || !payload) return;
      if (payloadGrantsJournal(payload)) {
        setHasJournalAccess(true);
        sessionStorage.setItem("hasJournalAccess", "true"); // cache only positive
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

    if (!decided) setHasJournalAccess(null);
  }, [user]);

  // Server check (prefer /users/me/products, then fallbacks)
  const checkEntitlementLive = async (): Promise<boolean> => {
    if (checkingRef.current) return hasJournalAccess === true;
    checkingRef.current = true;

    // short-circuit if sticky already true
    if (sessionStorage.getItem("hasJournalAccess") === "true") {
      setHasJournalAccess(true);
      checkingRef.current = false;
      return true;
    }

    const grant = () => {
      setHasJournalAccess(true);
      sessionStorage.setItem("hasJournalAccess", "true");
      checkingRef.current = false;
      return true;
    };
    const deny = () => {
      setHasJournalAccess(false);
      checkingRef.current = false;
      return false;
    };

    const endpoints = [
      "/users/me/products",        // preferred (entitlements list)
      "/users/me",                 // fallback (profile snapshot)
      "/billing/active-products",  // extra safety net if you expose it
    ];

    for (const url of endpoints) {
      try {
        const r = await api.get(url);
        if (payloadGrantsJournal(r.data)) return grant();
      } catch {
        // ignore and continue
      }
    }

    return deny();
  };

  const handleCTA = async () => {
    // Not logged in → go to Journaling Solo signup
    const hasToken = !!localStorage.getItem("token");
    if (!user && !hasToken) {
      navigate("/signup?productKey=journaling_solo");
      return;
    }

    // Already known to have access (bundle or journaling)
    if (hasJournalAccess === true || sessionStorage.getItem("hasJournalAccess") === "true") {
      navigate("/journal");
      return;
    }

    // Live verify now
    const ok = await checkEntitlementLive();
    if (ok) navigate("/journal");
    else navigate("/signup?productKey=journaling_solo");
  };

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
            Structured logging, reviews, and insights powering disciplined, data-driven trading
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
                <motion.div
                  animate={inView ? { rotate: 360 } : { rotate: 0 }}
                  transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                  className={`absolute inset-0 rounded-full border-t-2 ${stat.circleColor} border-opacity-30`}
                />
                <motion.div
                  animate={inView ? { rotate: -360 } : { rotate: 0 }}
                  transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                  className={`absolute inset-4 rounded-full border-b-2 ${stat.circleColor} border-opacity-30`}
                />
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
          <button
            onClick={handleCTA}
            className="px-8 py-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium hover:opacity-90 transition-opacity shadow-lg"
            aria-label="Open TradeKhata"
          >
            Open TradeKhata
          </button>
        </motion.div>
      </div>
    </section>
  );
};

export default StatsSection;
