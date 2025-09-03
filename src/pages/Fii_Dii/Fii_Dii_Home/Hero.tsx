// src/pages/FiiDii/Hero.tsx
import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import api from "../../../api";
import { AuthContext } from "../../../context/AuthContext";

/* -------- video -------- */
const VIDEO_URL =
  "https://cdn.pixabay.com/video/2024/03/15/204306-923909642_large.mp4";

/* --------- ONLY bundle keys grant access ---------- */
const BUNDLE_KEYS = new Set([
  "essentials_bundle",
  "essentials",
  "trader_essentials",
  "bundle",
  "trader's essential bundle",
]);

/* ---------- helpers: keys-only (no fuzzy token scans) ---------- */
function extractKeys(anyObj: any): string[] {
  const out: string[] = [];
  const push = (x: any) => {
    if (!x) return;
    if (typeof x === "string") out.push(x);
    else if (typeof x === "object")
      out.push(
        x.key || x.productKey || x.slug || x.route || x.code || x.id || x.name?.toLowerCase?.()
      );
  };

  if (!anyObj) return out;

  const pools = [
    anyObj.products,
    anyObj.activeProducts,
    anyObj.entitlements,
    anyObj.purchases,
    anyObj.subscriptions,
    anyObj.bundles,
    anyObj.items,
    anyObj.modules,
    anyObj.features,
  ].filter(Boolean);

  for (const p of pools) {
    if (Array.isArray(p)) p.forEach(push);
    else push(p);
  }

  return out.filter(Boolean).map((s) => String(s).toLowerCase());
}

function hasBundleAccess(payload: any): boolean {
  const keys = extractKeys(payload);
  return keys.some((k) => BUNDLE_KEYS.has(k));
}

/* ---------------- component ---------------- */
type Props = {
  ctaLabel?: string;
};

export default function Hero({ ctaLabel = "Get Analysis" }: Props) {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const checkingRef = useRef(false);

  // fast local check (AuthContext + localStorage user) — keys only
  useEffect(() => {
    let decided = false;

    const tryLocal = (payload: any) => {
      if (decided || !payload) return;
      if (hasBundleAccess(payload)) {
        setHasAccess(true);
        sessionStorage.setItem("hasFiiDiiAccess", "true"); // cache only positive
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

    if (!decided) setHasAccess(null);
  }, [user]);

  // live probe (use /users/me since others 404 in your env)
  const doLiveCheck = async (): Promise<boolean> => {
    if (checkingRef.current) return hasAccess === true;
    checkingRef.current = true;

    try {
      const r = await api.get("/users/me");
      if (hasBundleAccess(r.data)) {
        setHasAccess(true);
        sessionStorage.setItem("hasFiiDiiAccess", "true");
        checkingRef.current = false;
        return true;
      }
    } catch {
      /* ignore */
    }
    setHasAccess(false);
    checkingRef.current = false;
    return false;
  };

  const onCTA = async () => {
    const isLoggedIn = !!localStorage.getItem("token");

    // not logged in ⇒ send to bundle signup
    if (!isLoggedIn) {
      navigate("/signup?productKey=essentials_bundle");
      return;
    }

    // already confirmed
    if (hasAccess === true) {
      navigate("/main-fii-dii");
      return;
    }

    // verify once from server; only bundle unlocks
    const ok = await doLiveCheck();
    if (ok) navigate("/main-fii-dii");
    else navigate("/signup?productKey=essentials_bundle");
  };

  /* copy deck text once to avoid re-renders */
  const sub = useMemo(
    () =>
      "Track institutional money flows to anticipate market movements. Position yourself ahead of trends by aligning with FII/DII activity and master options trading with institutional insights.",
    []
  );

  return (
    <section className="relative h-[100vh] min-h-[560px] w-full overflow-hidden">
      {/* Background video */}
      <video
        className="absolute inset-0 h-full w-full object-cover"
        src={VIDEO_URL}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        crossOrigin="anonymous"
      >
        <source src={VIDEO_URL} type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      <div className="absolute inset-0 bg-black/55" />

      <div className="relative z-10 mx-auto flex h-full max-w-7xl flex-col items-center justify-end px-6 text-center pb-32">
        <motion.h1
          className="text-4xl md:text-6xl font-extrabold tracking-tight text-white"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          Decode Smart Money — FIIs & DIIs
        </motion.h1>

        <motion.p
          className="mt-4 max-w-2xl text-base md:text-lg text-white/90"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
        >
          {sub}
        </motion.p>

        <motion.div
          className="mt-8"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.45 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.98 }}
        >
          <button
            onClick={onCTA}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-3 font-semibold text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:from-blue-600 hover:to-purple-700"
            aria-label={ctaLabel}
          >
            {ctaLabel}
            <motion.span
              animate={{ x: [0, 4, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <ArrowRight size={18} />
            </motion.span>
          </button>
        </motion.div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/65 to-transparent" />

      <motion.div
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-white/70"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="flex flex-col items-center"
        >
          <span className="text-sm mb-2">Scroll to explore</span>
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12 5V19M12 19L19 12M12 19L5 12"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </motion.div>
      </motion.div>
    </section>
  );
}
