// src/pages/Home/HeroSection.tsx
import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../../context/AuthContext";
import api from "../../../api";

const VIDEO_SRC =
  "https://cdn.pixabay.com/video/2019/03/19/22098-325253535_large.mp4";

/* ---------- keys that actually grant journaling ---------- */
const JOURNAL_KEYS = new Set([
  "journaling_solo",
  "smart_journaling",
  "journaling",
  "trade_journal",
]);
const BUNDLE_KEYS = new Set([
  "essentials_bundle",
  "essentials",
  "trader_essentials",
  "bundle",
]);

/* ---------- helpers (keys only; no token scanning) ---------- */
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
  ].filter(Boolean);

  for (const p of pools) {
    if (Array.isArray(p)) p.forEach(push);
    else push(p);
  }
  return out.filter(Boolean).map((s) => String(s).toLowerCase());
}

function hasJournalByKeys(payload: any): boolean {
  const keys = extractKeys(payload);
  return keys.some((k) => JOURNAL_KEYS.has(k)) || keys.some((k) => BUNDLE_KEYS.has(k));
}

/* ---------------- component ---------------- */
const HeroSection = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  // typing animation
  const [animatedText, setAnimatedText] = useState("");
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [typingSpeed, setTypingSpeed] = useState(150);

  const phrases = useMemo(
    () => [
      "track your trades",
      "analyze performance",
      "identify patterns",
      "improve strategies",
      "reduce emotional trading",
      "boost consistency",
    ],
    []
  );

  useEffect(() => {
    const current = phrases[phraseIdx];
    const tick = () => {
      if (isDeleting) {
        setAnimatedText(current.substring(0, animatedText.length - 1));
        setTypingSpeed(75);
      } else {
        setAnimatedText(current.substring(0, animatedText.length + 1));
        setTypingSpeed(150);
      }
      if (!isDeleting && animatedText === current) {
        setTimeout(() => setIsDeleting(true), 1200);
      } else if (isDeleting && animatedText === "") {
        setIsDeleting(false);
        setPhraseIdx((phraseIdx + 1) % phrases.length);
        setTypingSpeed(450);
      }
    };
    const t = setTimeout(tick, typingSpeed);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animatedText, isDeleting, typingSpeed, phraseIdx]);

  /* ---- entitlement state (keys-only) ---- */
  const [hasJournalAccess, setHasJournalAccess] = useState<boolean | null>(null);
  const checkingRef = useRef(false);

  // Fast local checks (AuthContext + localStorage.user)
  useEffect(() => {
    let decided = false;
    const tryLocal = (payload: any) => {
      if (decided || !payload) return;
      if (hasJournalByKeys(payload)) {
        setHasJournalAccess(true);
        sessionStorage.setItem("hasJournalAccess", "true"); // only cache true
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

  // Live check — use only /users/me (your logs show others 404)
  const doLiveCheck = async (): Promise<boolean> => {
    if (checkingRef.current) return hasJournalAccess === true;
    checkingRef.current = true;
    try {
      const r = await api.get("/users/me");
      if (hasJournalByKeys(r.data)) {
        setHasJournalAccess(true);
        sessionStorage.setItem("hasJournalAccess", "true");
        checkingRef.current = false;
        return true;
      }
    } catch {
      /* ignore */
    }
    setHasJournalAccess(false);
    checkingRef.current = false;
    return false;
  };

  // FINAL navigation logic (no “optimistic” /journal)
  const navigateToJournal = async () => {
    const isLoggedIn = !!localStorage.getItem("token");
    if (!isLoggedIn) {
      return navigate("/signup?productKey=journaling_solo");
    }
    if (hasJournalAccess === true) {
      return navigate("/journal");
    }
    const ok = await doLiveCheck();
    return ok ? navigate("/journal") : navigate("/signup?productKey=journaling_solo");
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background video */}
      <video
        className="pointer-events-none absolute inset-0 h-full w-full object-cover"
        src={VIDEO_SRC}
        autoPlay
        loop
        muted
        playsInline
        aria-hidden="true"
      />
      <div className="absolute inset-0 bg-black/60" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/70" />

      {/* Content */}
      <div className="relative z-10 container mx-auto px-6 py-20 text-center">
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white mb-3">
          TradeKhata
        </h1>
        <p className="text-cyan-300/90 text-lg md:text-2xl font-medium mb-8">
          Smart Trading Journal — built for real traders
        </p>

        <div className="h-16 md:h-20 mb-8">
          <p className="text-xl md:text-3xl text-blue-100/90 font-mono">
            A trade journal helps you{" "}
            <span className="text-cyan-300 border-r-2 border-cyan-300 pr-1">
              {animatedText}
            </span>
          </p>
        </div>

        <div className="max-w-3xl mx-auto text-blue-100/95 text-base md:text-lg mb-12 leading-relaxed">
          <p className="mb-4">
            Track. Analyze. Improve. TradeKhata turns raw order data into
            crystal-clear insights—win-rate, R:R, equity curve, good vs bad
            trades, and habits that actually move your PnL.
          </p>
          <p>Trade with discipline, not guesswork. Let your data tell the story.</p>
        </div>

        <button
          onClick={navigateToJournal}
          className="relative inline-flex items-center justify-center px-8 py-4 overflow-hidden font-semibold text-white transition duration-300 ease-out border-2 border-cyan-400 rounded-full shadow-md group"
          aria-label="Start Journaling"
        >
          <span className="absolute inset-0 flex items-center justify-center w-full h-full text-white duration-300 -translate-x-full bg-cyan-500 group-hover:translate-x-0 ease">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </span>
          <span className="absolute flex items-center justify-center w-full h-full text-white transition-all duration-300 transform group-hover:translate-x-full ease">
            Start Journaling Now
          </span>
          <span className="relative invisible">Start Journaling Now</span>
        </button>
      </div>
    </div>
  );
};

export default HeroSection;
