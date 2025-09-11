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

/* --------- product keys/tokens that should unlock FII/DII analysis ---------- */
const BUNDLE_KEYS = new Set([
  "essentials_bundle",
  "essentials",
  "trader_essentials",
  "bundle",
  "trader's essential bundle",
]);

// If your API exposes the tool itself as an entitlement, accept it too.
const FIIDIID_KEYS = new Set(["fii_dii_data", "fiidii", "fii-dii", "fii_dii"]);

// Fuzzy strings as a fallback if payload only has names/titles
const BUNDLE_TOKENS = [
  "essential bundle",
  "essentials bundle",
  "trader essentials",
  "trader's essential bundle",
  "bundle",
];
const FIIDIID_TOKENS = ["fii/dii", "fii dii", "fiidii", "fii & dii", "fii_dii_data"];

/* ---------------- helpers ---------------- */
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

// A conservative "active" check when available; if fields are missing, we assume active.
function isActiveLike(x: any): boolean {
  const status = String(x?.status ?? "active").toLowerCase();
  const endsAt = x?.endsAt ? new Date(x.endsAt).getTime() : null;
  if (endsAt && Number.isFinite(endsAt) && endsAt < Date.now()) return false;
  return status === "active" || status === "trialing" || status === "paid";
}

/** Extracts possible keys from many shapes (object, arrays, variant.key, variants[], etc) */
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

      // scan variants list
      if (Array.isArray(x?.variants)) {
        for (const v of x.variants) {
          if (v?.key) out.push(v.key);
        }
      }

      // some APIs nest "items" with product info inside
      if (Array.isArray(x?.items)) {
        for (const it of x.items) push(it);
      }

      // some APIs use "components" or similar
      if (Array.isArray(x?.components)) {
        for (const c of x.components) push(c);
      }
    }
  };

  const pools = [
    payload?.products,
    payload?.activeProducts,
    payload?.entitlements,
    payload?.purchases,
    payload?.subscriptions,
    payload?.bundles,
    payload?.items,
    payload?.modules,
    payload?.features,
    payload?.data,
  ].filter(Boolean);

  for (const p of pools) {
    if (Array.isArray(p)) p.forEach(push);
    else push(p);
  }

  // Also push the root object itself to catch top-level keys/variants
  push(payload);

  return out
    .filter(Boolean)
    .map((s) => String(s).toLowerCase());
}

/** Does this payload grant access to FII/DII? (Bundle OR direct FII/DII) */
function payloadGrantsFiiDii(payload: any): boolean {
  if (!payload) return false;

  // 1) Explicit keys (with active check where present)
  const keys = extractKeys(payload);
  const explicit =
    keys.some((k) => BUNDLE_KEYS.has(k)) || keys.some((k) => FIIDIID_KEYS.has(k));
  if (explicit) {
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
        return BUNDLE_KEYS.has(lowered) || FIIDIID_KEYS.has(lowered);
      }
      return false;
    });
    return hasActiveRecord || true;
  }

  // 2) Fuzzy string mentions as a last resort
  const mentions =
    deepSome(payload, (v) => includesAnyToken(v, BUNDLE_TOKENS)) ||
    deepSome(payload, (v) => includesAnyToken(v, FIIDIID_TOKENS));

  return mentions;
}

/* ---------------- component ---------------- */
type Props = {
  /** Fallback label for non-owners (e.g., "Get Analysis") */
  ctaLabel?: string;
};

export default function Hero({ ctaLabel = "Get Analysis" }: Props) {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const checkingRef = useRef(false);

  // fast local check (sticky + AuthContext + localStorage user)
  useEffect(() => {
    let decided = false;

    if (sessionStorage.getItem("hasFiiDiiAccess") === "true") {
      setHasAccess(true);
      decided = true;
    }

    const tryLocal = (payload: any) => {
      if (decided || !payload) return;
      if (payloadGrantsFiiDii(payload)) {
        setHasAccess(true);
        sessionStorage.setItem("hasFiiDiiAccess", "true"); // cache only positive
        decided = true;
      }
    };

    tryLocal(user);
    try {
      const cached = JSON.parse(localStorage.getItem("user") || "null");
      tryLocal(cached);
    } catch { /* ignore */ }

    if (!decided) setHasAccess(null);
  }, [user]);

  // optional: kick off a background verify when logged in so label flips proactively
  useEffect(() => {
    const hasToken = !!localStorage.getItem("token");
    if (hasToken && hasAccess === null && !checkingRef.current) {
      void doLiveCheck(); // fire-and-forget to improve UX
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasAccess]);

  // live probe (prefer entitlements, then billing, then profile)
  const doLiveCheck = async (): Promise<boolean> => {
    if (checkingRef.current) return hasAccess === true;
    checkingRef.current = true;

    if (sessionStorage.getItem("hasFiiDiiAccess") === "true") {
      setHasAccess(true);
      checkingRef.current = false;
      return true;
    }

    const grant = () => {
      setHasAccess(true);
      sessionStorage.setItem("hasFiiDiiAccess", "true");
      checkingRef.current = false;
      return true;
    };
    const deny = () => {
      setHasAccess(false);
      checkingRef.current = false;
      return false;
    };

    const endpoints = [
      "/users/me/products",
      "/billing/active-products",
      "/users/me",
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

  const onCTA = async () => {
    const isLoggedIn = !!localStorage.getItem("token");

    if (!isLoggedIn) {
      navigate("/signup?productKey=essentials_bundle");
      return;
    }

    if (hasAccess === true || sessionStorage.getItem("hasFiiDiiAccess") === "true") {
      navigate("/main-fii-dii"); // ⬅️ changed
      return;
    }

    const ok = await doLiveCheck();
    if (ok) navigate("/main-fii-dii"); // ⬅️ changed
    else navigate("/signup?productKey=essentials_bundle");
  };

  // dynamic label: "Dashboard" if owned; otherwise fallback ctaLabel
  const buttonLabel = useMemo(() => {
    return hasAccess === true || sessionStorage.getItem("hasFiiDiiAccess") === "true"
      ? "Dashboard"
      : ctaLabel;
  }, [hasAccess, ctaLabel]);

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
            aria-label={buttonLabel}
          >
            {buttonLabel}
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
