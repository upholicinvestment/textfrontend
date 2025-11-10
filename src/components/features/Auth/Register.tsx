import { useState, useContext, useEffect, useMemo, useRef } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import api, { extractServerError, markSessionStart } from "../../../api";
import {
  FiUser,
  FiMail,
  FiLock,
  FiPhone,
  FiArrowRight,
  FiEye,
  FiEyeOff,
  FiX,
} from "react-icons/fi";
import { AuthContext } from "../../../context/AuthContext";

/* ✅ Toastify */
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

declare global {
  interface Window {
    Razorpay: any;
  }
}

/** Load Razorpay SDK once */
const loadRazorpay = (): Promise<boolean> =>
  new Promise((resolve) => {
    if (typeof window !== "undefined" && window.Razorpay) {
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

type Variant = {
  _id: string;
  key?: string;
  name: string;
  priceMonthly?: number;
};

type Product = {
  _id: string;
  key: string;
  name: string;
  hasVariants: boolean;
  route: string;
  variants?: Variant[];
  priceMonthly?: number;
  priceYearly?: number;
};

/* ---------- Ownership keys (keys-only) ---------- */
const BUNDLE_KEYS = new Set([
  "essentials_bundle",
  "essentials",
  "trader_essentials",
  "bundle",
  "trader's essential bundle",
]);

const JOURNAL_KEYS = new Set([
  "journaling_solo",
  "smart_journaling",
  "journaling",
  "trade_journal",
]);

const ALGO_KEYS = new Set([
  "algo_simulator",
  "option_scalper_pro",
  "starter_scalping",
  "swing_trader_master",
]);

/* Billing */
const YEARLY_ELIGIBLE = new Set(["essentials_bundle", "journaling_solo"]);
const OTP_COOLDOWN_DURATION = 60; // seconds

/* ---------- helpers: keys-only extraction ---------- */
function extractKeys(payload: any): string[] {
  const out: string[] = [];
  const push = (x: any) => {
    if (!x) return;
    if (typeof x === "string") out.push(x);
    else if (typeof x === "object") {
      const cand =
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
function ownsAny(payload: any, keys: Set<string>): boolean {
  try {
    const k = extractKeys(payload);
    return k.some((x) => keys.has(x));
  } catch {
    return false;
  }
}

/** Resolve where to go based on existing ownership */
function resolveOwnedRoute(snapshot: any): "/dashboard" | "/journal" {
  if (ownsAny(snapshot, JOURNAL_KEYS)) return "/journal";
  if (ownsAny(snapshot, BUNDLE_KEYS)) return "/dashboard";
  if (ownsAny(snapshot, ALGO_KEYS)) return "/dashboard";
  return "/dashboard";
}

/** Get a current user snapshot (context → localStorage → live fetch) */
async function getUserSnapshot(authUser: any): Promise<any> {
  if (authUser) return authUser;
  try {
    const cached = JSON.parse(localStorage.getItem("user") || "null");
    if (cached) return cached;
  } catch {
    /* ignore */
  }
  try {
    const r = await api.get("/users/me");
    if (r?.data) return r.data;
  } catch {
    /* ignore */
  }
  return null;
}

const Register = () => {
  const { login, user } = useContext(AuthContext);
  const isLoggedIn = !!user;
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const redirectedRef = useRef(false);

  /** Normalize any route coming from the catalog. */
  const safeRoute = (route?: string) => {
    if (!route) return "/dashboard";
    const r = route.trim();
    if (r === "/") return "/dashboard";
    if (r === "/signup" || r.startsWith("/signup?")) return "/dashboard";
    return r;
  };

  /** Strong redirect that survives overlays / SDK quirks */
  const hardNavigate = (path: string) => {
    try {
      navigate(path, { replace: true });
    } finally {
      setTimeout(() => {
        if (window.location.pathname + window.location.search !== path) {
          window.location.href = path;
        }
      }, 0);
    }
  };

  // Form state (guest-only)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  // OTP state (guest-only)
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // Catalog state
  const [products, setProducts] = useState<Product[]>([]);
  const [initialProductId, setInitialProductId] = useState("");
  const [initialVariantId, setInitialVariantId] = useState("");

  // Billing interval (initialized from query param)
  const qpInterval = (searchParams.get("interval") || "").toLowerCase();
  const initialInterval = qpInterval === "yearly" ? "yearly" : "monthly";
  const [billingInterval, setBillingInterval] = useState<"monthly" | "yearly">(
    initialInterval
  );

  // Broker state (optional)
  const [brokerName] = useState("");
  const [brokerConfig] = useState<Record<string, string>>({});

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Banner
  const [bannerText, setBannerText] = useState<string | null>(null);

  const selectedProduct = useMemo(
    () => products.find((p) => p._id === initialProductId),
    [products, initialProductId]
  );

  // ✅ Toastify listeners
  useEffect(() => {
    if (error) {
      toast.error(error);
      setError("");
    }
  }, [error]);

  useEffect(() => {
    if (successMessage) {
      toast.success(successMessage);
      setSuccessMessage("");
    }
  }, [successMessage]);

  // OTP cooldown ticker (guest-only)
  useEffect(() => {
    if (!isLoggedIn && cooldown > 0) {
      const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [cooldown, isLoggedIn]);

  // Load products
  useEffect(() => {
    const loadProducts = async () => {
      try {
        setCatalogLoading(true);
        const res = await api.get<Product[]>("/products");
        setProducts(Array.isArray(res.data) ? res.data : []);
      } catch (e) {
        console.error("Products fetch error:", e);
        setProducts([]);
      } finally {
        setCatalogLoading(false);
      }
    };
    loadProducts();
  }, []);

  // Preselect product/variant from URL query
  useEffect(() => {
    if (!products.length) return;

    const qpProductKey = (searchParams.get("productKey") || "").toLowerCase();
    const qpVariantKey = (searchParams.get("variantKey") || "").toLowerCase();

    if (qpProductKey) {
      const p = products.find((x) => x.key.toLowerCase() === qpProductKey);
      if (p) {
        setInitialProductId(p._id);
        if (p.hasVariants && qpVariantKey && p.variants?.length) {
          const v =
            p.variants.find(
              (vv) => (vv.key || "").toLowerCase() === qpVariantKey
            ) ||
            p.variants.find((vv) =>
              vv.name?.toLowerCase().includes(qpVariantKey)
            );
          if (v) setInitialVariantId(v._id);
        } else {
          setInitialVariantId("");
        }
      }
    }
  }, [products, searchParams]);

  // Keep interval in sync with URL if it changes via back/forward
  useEffect(() => {
    const q = (searchParams.get("interval") || "").toLowerCase();
    if (q === "monthly" || q === "yearly") {
      setBillingInterval(q as "monthly" | "yearly");
    }
  }, [searchParams]);

  // When product changes, normalize interval
  useEffect(() => {
    if (!selectedProduct) return;
    if (
      !YEARLY_ELIGIBLE.has(selectedProduct.key) ||
      selectedProduct.hasVariants
    ) {
      setBillingInterval("monthly");
      return;
    }
  }, [selectedProduct?.key, selectedProduct?.hasVariants]);

  /* ---------- Ownership redirects for LOGGED-IN users ---------- */
  useEffect(() => {
    if (!isLoggedIn || redirectedRef.current) return;
    const go = async () => {
      const snapshot = await getUserSnapshot(user);
      if (!snapshot) return;

      if (ownsAny(snapshot, BUNDLE_KEYS)) {
        redirectedRef.current = true;
        hardNavigate("/dashboard");
        return;
      }
      if (ownsAny(snapshot, JOURNAL_KEYS)) {
        redirectedRef.current = true;
        hardNavigate("/journal");
        return;
      }
      if (ownsAny(snapshot, ALGO_KEYS)) {
        redirectedRef.current = true;
        hardNavigate("/dashboard");
        return;
      }
    };
    void go();
  }, [isLoggedIn, user]);

  /* ---------- Banner logic when Journaling (Solo) is selected ---------- */
  useEffect(() => {
    if (!selectedProduct) {
      setBannerText(null);
      return;
    }
    const payload = (() => {
      if (user) return user;
      try {
        return JSON.parse(localStorage.getItem("user") || "null");
      } catch {
        return null;
      }
    })();

    const hasBundle = ownsAny(payload, BUNDLE_KEYS);
    const hasJournal = ownsAny(payload, JOURNAL_KEYS);

    if (selectedProduct.key.toLowerCase() === "journaling_solo") {
      if (hasBundle) {
        setBannerText(
          "Your Bundle already includes Journaling. No need to buy Journaling (Solo)."
        );
      } else if (hasJournal) {
        setBannerText("You already have Journaling (Solo).");
      } else {
        setBannerText(null);
      }
    } else {
      setBannerText(null);
    }
  }, [selectedProduct, user]);

  /* ---------- Handlers ---------- */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.currentTarget;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(e.target.value.replace(/\D/g, ""));
  };

  const handleProductChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setInitialProductId(e.currentTarget.value);
    setInitialVariantId("");
  };

  const handleVariantChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setInitialVariantId(e.currentTarget.value);
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoggedIn) return;

    if (phone.length !== 10) {
      setError("Please enter a valid 10-digit phone number");
      return;
    }
    if (cooldown > 0) {
      setError(`Please wait ${cooldown} seconds before requesting a new OTP`);
      return;
    }

    try {
      setError("");
      const response = await api.post("/otp/send-otp", { phone });
      if (response.data.success) {
        setOtpSent(true);
        setSuccessMessage("OTP sent to your phone number");
        setCooldown(response.data.retryAfter || OTP_COOLDOWN_DURATION);
      } else {
        setError(response.data.message || "Failed to send OTP");
      }
    } catch (err: any) {
      const { message } = extractServerError(err);
      setError(message);
    }
  };

  const handleResendOtp = async () => {
    if (isLoggedIn) return;
    if (phone.length !== 10) {
      setError("Please enter a valid 10-digit phone number");
      return;
    }
    if (cooldown > 0) {
      setError(`Please wait ${cooldown} seconds before requesting a new OTP`);
      return;
    }

    try {
      setError("");
      const response = await api.post("/otp/send-otp", { phone });
      if (response.data.success) {
        setOtpSent(true);
        setOtp("");
        setSuccessMessage("OTP resent to your phone number");
        setCooldown(response.data.retryAfter || OTP_COOLDOWN_DURATION);
      } else {
        setError(response.data.message || "Failed to resend OTP");
      }
    } catch (err: any) {
      const { message } = extractServerError(err);
      setError(message);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoggedIn) return;
    if (!otp || otp.length !== 6) {
      setError("Please enter a valid 6-digit OTP");
      return;
    }

    try {
      setError("");
      const response = await api.post("/otp/verify-otp", { phone, otp });
      if (response.data.success) {
        setOtpVerified(true);
        setSuccessMessage("Phone number verified successfully");
      } else {
        setError(response.data.message || "Invalid OTP. Please try again.");
      }
    } catch (err: any) {
      const { message } = extractServerError(err);
      setError(message);
    }
  };

  // Compute a safe destination after signup/payment
  const getPostSignupPath = () => safeRoute(selectedProduct?.route);

  // === Payment (Razorpay) flow for GUEST (register-intent)
  const launchRazorpayForIntent = async (signupIntentId: string) => {
    try {
      const orderRes = await api.post("/payments/create-order", {
        signupIntentId,
      });

      // Free plan → no Razorpay
      if (orderRes.status === 204) {
        const fin = await api.post("/auth/finalize-signup", {
          signupIntentId,
        });
        localStorage.setItem("token", fin.data.token);
        localStorage.setItem("user", JSON.stringify(fin.data.user));
        // ✅ start session for 7-day auto-logout
        markSessionStart();

        const to = getPostSignupPath();
        sessionStorage.setItem("postSignupPath", to);

        login(fin.data.token, fin.data.user);
        hardNavigate(to);
        setSuccessMessage("Registration successful!");
        return;
      }

      const ord = orderRes.data;

      const ok = await loadRazorpay();
      if (!ok || !window.Razorpay) {
        setError("Payment SDK failed to load. Refresh and try again.");
        return;
      }

      const rz = new window.Razorpay({
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
            const verify = await api.post("/payments/verify", {
              intentId: ord.intentId,
              razorpay_order_id: rsp.razorpay_order_id,
              razorpay_payment_id: rsp.razorpay_payment_id,
              razorpay_signature: rsp.razorpay_signature,
            });

            localStorage.setItem("token", verify.data.token);
            localStorage.setItem("user", JSON.stringify(verify.data.user));
            // ✅ start session for 7-day auto-logout
            markSessionStart();

            const to = getPostSignupPath();
            sessionStorage.setItem("postSignupPath", to);

            login(verify.data.token, verify.data.user);
            hardNavigate(to);
            setSuccessMessage("Payment successful!");
          } catch (e: any) {
            const { message, details } = extractServerError(e);
            setError(
              `${message}${details ? ` — ${JSON.stringify(details)}` : ""}`
            );
          }
        },
        modal: { ondismiss: () => setError("Payment cancelled") },
      });

      rz.open();
    } catch (err: any) {
      if (err?.response?.status === 409) {
        const snapshot =
          user ??
          (() => {
            try {
              return JSON.parse(localStorage.getItem("user") || "null");
            } catch {
              return null;
            }
          })() ??
          (await (async () => {
            try {
              const r = await api.get("/users/me");
              return r.data;
            } catch {
              return null;
            }
          })());

        const to = resolveOwnedRoute(snapshot);
        setSuccessMessage(err?.response?.data?.message || "Already active.");
        hardNavigate(to);
        return;
      }
      const { message, details } = extractServerError(err);
      setError(`${message}${details ? ` — ${JSON.stringify(details)}` : ""}`);
    }
  };

  // === Payment (Razorpay) flow for LOGGED-IN purchase
  const launchRazorpayForPurchase = async (payload: any) => {
    try {
      const orderRes = await api.post("/payments/create-order", payload);

      const productRoute = safeRoute(
        products.find((p) => p._id === payload.productId)?.route
      );
      const postPurchasePath = productRoute || "/dashboard";

      if (orderRes.status === 204) {
        setSuccessMessage("Purchase successful!");
        hardNavigate(postPurchasePath);
        return;
      }

      const ord = orderRes.data;

      const ok = await loadRazorpay();
      if (!ok || !window.Razorpay) {
        setError("Payment SDK failed to load. Refresh and try again.");
        return;
      }

      const rz = new window.Razorpay({
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
            setSuccessMessage("Payment successful!");
            hardNavigate(postPurchasePath);
          } catch (e: any) {
            const { message, details } = extractServerError(e);
            setError(
              `${message}${details ? ` — ${JSON.stringify(details)}` : ""}`
            );
          }
        },
        modal: { ondismiss: () => setError("Payment cancelled") },
      });

      rz.open();
    } catch (err: any) {
      if (err?.response?.status === 409) {
        const snapshot =
          user ??
          (() => {
            try {
              return JSON.parse(localStorage.getItem("user") || "null");
            } catch {
              return null;
            }
          })() ??
          (await (async () => {
            try {
              const r = await api.get("/users/me");
              return r.data;
            } catch {
              return null;
            }
          })());

        const to = resolveOwnedRoute(snapshot);
        setSuccessMessage(err?.response?.data?.message || "Already active.");
        hardNavigate(to);
        return;
      }
      const { message, details } = extractServerError(err);
      setError(`${message}${details ? ` — ${JSON.stringify(details)}` : ""}`);
    }
  };

  // === Submit ===
  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    // Logged-in checkout
    if (isLoggedIn) {
      if (!initialProductId)
        return setError("Please choose a product");
      if (selectedProduct?.hasVariants && !initialVariantId)
        return setError("Please select a plan for the chosen product");

      const payload: any = {
        productId: initialProductId,
        ...(initialVariantId && { variantId: initialVariantId }),
        ...(selectedProduct &&
          YEARLY_ELIGIBLE.has(selectedProduct.key) &&
          !selectedProduct.hasVariants && {
            billingInterval: billingInterval,
          }),
      };

      if (selectedProduct?.key === "algo_simulator" && initialVariantId) {
        const hasAnyBrokerValue =
          (brokerName && brokerName.trim() !== "") ||
          Object.values(brokerConfig).some(
            (v) => typeof v === "string" && v.trim() !== ""
          );
        if (hasAnyBrokerValue) {
          payload.brokerConfig = { brokerName, ...brokerConfig };
        }
      }

      setIsLoading(true);
      try {
        await launchRazorpayForPurchase(payload);
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // Guest signup
    if (!formData.name || !formData.email || !formData.password || !phone) {
      setError("Please fill in all fields");
      return;
    }
    if (!otpVerified) {
      setError("Please verify your phone number first");
      return;
    }
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (
      initialProductId &&
      selectedProduct?.hasVariants &&
      !initialVariantId
    ) {
      setError("Please select a plan for the chosen product");
      return;
    }

    setIsLoading(true);
    try {
      const body: any = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        phone,
        ...(initialProductId && { initialProductId }),
        ...(initialVariantId && { initialVariantId }),
      };

      if (
        selectedProduct &&
        YEARLY_ELIGIBLE.has(selectedProduct.key) &&
        !selectedProduct.hasVariants
      ) {
        body.billingInterval = billingInterval;
      }

      if (selectedProduct?.key === "algo_simulator" && initialVariantId) {
        const hasAnyBrokerValue =
          (brokerName && brokerName.trim() !== "") ||
          Object.values(brokerConfig).some(
            (v) => typeof v === "string" && v.trim() !== ""
          );

        if (hasAnyBrokerValue) {
          body.brokerConfig = { brokerName, ...brokerConfig };
        }
      }

      const { data } = await api.post("/auth/register-intent", body);
      const signupIntentId: string = data.signupIntentId;

      if (!initialProductId) {
        const fin = await api.post("/auth/finalize-signup", {
          signupIntentId,
        });
        localStorage.setItem("token", fin.data.token);
        localStorage.setItem("user", JSON.stringify(fin.data.user));
        // ✅ start session for 7-day auto-logout
        markSessionStart();

        const to = "/dashboard";
        sessionStorage.setItem("postSignupPath", to);
        login(fin.data.token, fin.data.user);
        hardNavigate(to);
        setSuccessMessage("Registration successful!");
        return;
      }

      await launchRazorpayForIntent(signupIntentId);
    } catch (err: any) {
      const { message, details } = extractServerError(err);
      setError(`${message}${details ? ` — ${JSON.stringify(details)}` : ""}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-100 p-4">
      {/* Toasts */}
      <ToastContainer position="top-right" autoClose={3500} newestOnTop />

      <div className="w-full max-w-6xl bg-white rounded-2xl shadow-xl overflow-hidden flex relative">
        {/* Close */}
        <Link
          to="/"
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 transition-colors z-10"
          aria-label="Close"
        >
          <FiX className="w-6 h-6" />
        </Link>

        {/* Left - SVG Illustration */}
        <div className="hidden md:flex flex-1 bg-indigo-600 items-center justify-center p-8">
          <div className="max-w-md w-full">
            {/* Pick different SVG depending on login state */}
            {isLoggedIn ? (
              /* --- PAYMENT / PURCHASE Illustration --- */
              <svg
                viewBox="0 0 500 500"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                width="100%"
                height="100%"
                preserveAspectRatio="xMidYMid meet"
                style={{ maxWidth: "100%", height: "auto", display: "block" }}
                className="w-full"
                aria-hidden="true"
              >
                <defs>
                  <linearGradient id="p-accent" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#A78BFA" />
                    <stop offset="100%" stopColor="#4F46E5" />
                  </linearGradient>
                  <linearGradient id="p-card" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
                    <stop offset="100%" stopColor="#F5F7FF" stopOpacity="1" />
                  </linearGradient>
                </defs>

                <circle
                  cx="250"
                  cy="250"
                  r="210"
                  fill="#FFFFFF"
                  fillOpacity="0.08"
                />
                <circle
                  cx="250"
                  cy="250"
                  r="165"
                  fill="#FFFFFF"
                  fillOpacity="0.12"
                />
                <circle
                  cx="250"
                  cy="250"
                  r="120"
                  fill="#FFFFFF"
                  fillOpacity="0.16"
                />
                <ellipse
                  cx="110"
                  cy="120"
                  rx="50"
                  ry="22"
                  fill="#FFFFFF"
                  fillOpacity="0.08"
                />
                <ellipse
                  cx="395"
                  cy="370"
                  rx="60"
                  ry="26"
                  fill="#FFFFFF"
                  fillOpacity="0.08"
                />

                <g transform="translate(110 150)">
                  <rect
                    x="0"
                    y="0"
                    width="280"
                    height="170"
                    rx="18"
                    fill="url(#p-card)"
                  />
                  <rect
                    x="0.5"
                    y="0.5"
                    width="279"
                    height="169"
                    rx="17.5"
                    stroke="#E7EAFF"
                  />
                  <rect x="0" y="36" width="280" height="22" fill="#E9ECFF" />
                  <rect
                    x="22"
                    y="72"
                    width="34"
                    height="26"
                    rx="4"
                    fill="#D7DBFF"
                  />
                  <rect
                    x="26"
                    y="76"
                    width="26"
                    height="18"
                    rx="3"
                    fill="#EEF0FF"
                  />
                  <rect
                    x="85"
                    y="76"
                    width="130"
                    height="8"
                    rx="4"
                    fill="#DADEFF"
                  />
                  <rect
                    x="85"
                    y="92"
                    width="95"
                    height="8"
                    rx="4"
                    fill="#E3E6FF"
                  />
                  <rect
                    x="22"
                    y="120"
                    width="110"
                    height="10"
                    rx="5"
                    fill="#E6E9FF"
                  />
                  <rect
                    x="210"
                    y="120"
                    width="48"
                    height="10"
                    rx="5"
                    fill="#E6E9FF"
                  />
                  <rect
                    x="150"
                    y="130"
                    width="110"
                    height="28"
                    rx="10"
                    fill="url(#p-accent)"
                  />
                  <text
                    x="205"
                    y="149"
                    textAnchor="middle"
                    fontFamily="Inter, ui-sans-serif, system-ui"
                    fontSize="12"
                    fontWeight="600"
                    fill="#FFFFFF"
                  >
                    Pay Now
                  </text>
                </g>

                <g transform="translate(325 145)">
                  <rect
                    x="0"
                    y="28"
                    width="44"
                    height="34"
                    rx="6"
                    fill="#C9CEFF"
                  />
                  <path
                    d="M10 28v-8a12 12 0 1124 0v8"
                    stroke="#C9CEFF"
                    strokeWidth="6"
                    strokeLinecap="round"
                  />
                  <circle cx="22" cy="43" r="3" fill="#FFFFFF" />
                </g>

                <g transform="translate(115 320)">
                  <path
                    d="M30 0 L60 12 V34 C60 50 45 62 30 68 C15 62 0 50 0 34 V12 L30 0 Z"
                    fill="url(#p-accent)"
                  />
                  <path
                    d="M17 32 L27 42 L46 23"
                    stroke="#FFFFFF"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </g>

                <path
                  d="M360 245 L375 283 L380 272 L394 284 L399 278 L385 266 L396 261 Z"
                  fill="#FFFFFF"
                  fillOpacity="0.95"
                  stroke="#1F1B64"
                  strokeOpacity="0.15"
                />

                <g opacity="0.9">
                  <path
                    d="M95 200 l4 10 10 4 -10 4 -4 10 -4 -10 -10 -4 10 -4 4 -10 Z"
                    fill="#FFFFFF"
                    fillOpacity="0.8"
                  />
                  <path
                    d="M410 170 l3 8 8 3 -8 3 -3 8 -3 -8 -8 -3 8 -3 3 -8 Z"
                    fill="#FFFFFF"
                    fillOpacity="0.8"
                  />
                  <path
                    d="M135 120 l2 6 6 2 -6 2 -2 6 -2 -6 -6 -2 6 -2 2 -6 Z"
                    fill="#FFFFFF"
                    fillOpacity="0.7"
                  />
                </g>

                <path
                  d="M120 400 C180 380 320 380 380 400 C440 420 380 440 320 430 C260 420 240 420 180 430 C140 435 100 420 120 400 Z"
                  fill="#FFFFFF"
                  fillOpacity="0.4"
                />
              </svg>
            ) : (
              /* --- SIGNUP Illustration --- */
              <svg
                viewBox="0 0 500 500"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                width="100%"
                height="100%"
                preserveAspectRatio="xMidYMid meet"
                style={{ maxWidth: "100%", height: "auto", display: "block" }}
                className="w-full"
                aria-hidden="true"
              >
                <defs>
                  <linearGradient id="g-accent" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#818CF8" />
                    <stop offset="100%" stopColor="#4F46E5" />
                  </linearGradient>
                  <linearGradient id="g-soft" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
                    <stop
                      offset="100%"
                      stopColor="#FFFFFF"
                      stopOpacity="0.95"
                    />
                  </linearGradient>
                </defs>

                <circle
                  cx="250"
                  cy="250"
                  r="210"
                  fill="#FFFFFF"
                  fillOpacity="0.08"
                />
                <circle
                  cx="250"
                  cy="250"
                  r="165"
                  fill="#FFFFFF"
                  fillOpacity="0.12"
                />
                <circle
                  cx="250"
                  cy="250"
                  r="120"
                  fill="#FFFFFF"
                  fillOpacity="0.16"
                />
                <ellipse
                  cx="115"
                  cy="110"
                  rx="55"
                  ry="25"
                  fill="#FFFFFF"
                  fillOpacity="0.08"
                />
                <ellipse
                  cx="390"
                  cy="380"
                  rx="65"
                  ry="28"
                  fill="#FFFFFF"
                  fillOpacity="0.08"
                />

                <g>
                  <rect
                    x="120"
                    y="110"
                    width="260"
                    height="280"
                    rx="20"
                    fill="url(#g-soft)"
                  />
                  <rect
                    x="120.5"
                    y="110.5"
                    width="259"
                    height="279"
                    rx="19.5"
                    stroke="#FFFFFF"
                    strokeOpacity="0.35"
                  />
                  <circle cx="170" cy="150" r="20" fill="url(#g-accent)" />
                  <circle cx="170" cy="147" r="7" fill="#FFFFFF" />
                  <path
                    d="M158 164c4-6 20-6 24 0"
                    stroke="#FFFFFF"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <rect
                    x="200"
                    y="138"
                    width="120"
                    height="10"
                    rx="5"
                    fill="#E9ECFF"
                  />
                  <rect
                    x="200"
                    y="153"
                    width="96"
                    height="8"
                    rx="4"
                    fill="#EEF0FF"
                  />
                  <rect
                    x="150"
                    y="190"
                    width="200"
                    height="28"
                    rx="8"
                    fill="#F3F4FF"
                  />
                  <rect
                    x="162"
                    y="198"
                    width="110"
                    height="12"
                    rx="6"
                    fill="#DDE2FF"
                  />
                  <rect
                    x="150"
                    y="230"
                    width="200"
                    height="28"
                    rx="8"
                    fill="#F3F4FF"
                  />
                  <rect
                    x="162"
                    y="238"
                    width="140"
                    height="12"
                    rx="6"
                    fill="#DDE2FF"
                  />
                  <rect
                    x="150"
                    y="270"
                    width="200"
                    height="28"
                    rx="8"
                    fill="#F3F4FF"
                  />
                  <g transform="translate(158 276)">
                    <rect
                      x="0"
                      y="6"
                      width="14"
                      height="10"
                      rx="2"
                      fill="#C7CCFF"
                    />
                    <path
                      d="M3 6v-3a4 4 0 118 0v3"
                      stroke="#C7CCFF"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </g>
                  <rect
                    x="178"
                    y="278"
                    width="100"
                    height="12"
                    rx="6"
                    fill="#DDE2FF"
                  />
                  <rect
                    x="165"
                    y="315"
                    width="170"
                    height="38"
                    rx="12"
                    fill="url(#g-accent)"
                  />
                  <text
                    x="250"
                    y="339"
                    textAnchor="middle"
                    fontFamily="Inter, ui-sans-serif, system-ui"
                    fontSize="14"
                    fontWeight="600"
                    fill="#FFFFFF"
                  >
                    Sign Up
                  </text>
                  <path
                    d="M318 300 L333 338 L338 327 L352 339 L357 333 L343 321 L354 316 Z"
                    fill="#FFFFFF"
                    fillOpacity="0.9"
                    stroke="#1F1B64"
                    strokeOpacity="0.15"
                  />
                </g>

                <g transform="translate(330 105)">
                  <path
                    d="M30 0 L60 12 V34 C60 50 45 62 30 68 C15 62 0 50 0 34 V12 L30 0 Z"
                    fill="url(#g-accent)"
                  />
                  <path
                    d="M17 32 L27 42 L46 23"
                    stroke="#FFFFFF"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </g>

                <g opacity="0.9">
                  <path
                    d="M95 200 l4 10 10 4 -10 4 -4 10 -4 -10 -10 -4 10 -4 4 -10 Z"
                    fill="#FFFFFF"
                    fillOpacity="0.8"
                  />
                  <path
                    d="M410 170 l3 8 8 3 -8 3 -3 8 -3 -8 -8 -3 8 -3 3 -8 Z"
                    fill="#FFFFFF"
                    fillOpacity="0.8"
                  />
                  <path
                    d="M110 340 l2 6 6 2 -6 2 -2 6 -2 -6 -6 -2 6 -2 2 -6 Z"
                    fill="#FFFFFF"
                    fillOpacity="0.7"
                  />
                </g>

                <path
                  d="M120 385 C180 365 320 365 380 385 C440 405 380 425 320 415 C260 405 240 405 180 415 C140 420 100 405 120 385 Z"
                  fill="#FFFFFF"
                  fillOpacity="0.4"
                />
              </svg>
            )}

            <div className="text-center mt-8">
              <h3 className="text-2xl font-bold text-white mb-4">
                {isLoggedIn ? "Complete Your Purchase" : "Create Your Account"}
              </h3>
              <p className="text-indigo-100">
                {isLoggedIn
                  ? "Access premium features with a secure payment"
                  : "Join our community and unlock exclusive benefits"}
              </p>
            </div>
          </div>
        </div>

        {/* Right - Form */}
        <div className="flex-1 p-8 md:p-12">
          <div className="max-w-md mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-800 mb-2">
                {isLoggedIn ? "Complete Your Purchase" : "Create Account"}
              </h2>
              <p className="text-gray-500">
                {isLoggedIn
                  ? "Choose your product and pay securely"
                  : "Get started with your free account"}
              </p>
            </div>

            {/* Banner */}
            {bannerText && (
              <div className="mb-6 rounded-lg border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-sm text-center">
                {bannerText}
              </div>
            )}

            {/* Inline message boxes removed to avoid duplication with Toastify */}

            <form onSubmit={handleRegister} className="space-y-4">
              {/* Guest account fields */}
              {!isLoggedIn && (
                <>
                  <div className="relative">
                    <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      id="name"
                      name="name"
                      type="text"
                      placeholder="Full Name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                      autoComplete="name"
                    />
                  </div>

                  <div className="relative">
                    <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="Email Address"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                      autoComplete="email"
                    />
                  </div>

                  <div className="relative">
                    <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Password (min 6 characters)"
                      value={formData.password}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-indigo-600 transition-colors"
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                    >
                      {showPassword ? <FiEyeOff /> : <FiEye />}
                    </button>
                  </div>

                  {!otpVerified ? (
                    <>
                      <div className="relative">
                        <FiPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="tel"
                          placeholder="Phone Number (10 digits)"
                          value={phone}
                          onChange={handlePhoneChange}
                          maxLength={10}
                          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all disabled:bg-gray-50"
                        />
                      </div>

                      {otpSent && (
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="Enter OTP (6 digits)"
                            value={otp}
                            onChange={(e) =>
                              setOtp(e.target.value.replace(/\D/g, ""))
                            }
                            maxLength={6}
                            className="w-full pl-4 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                          />
                        </div>
                      )}

                      {!otpSent ? (
                        <button
                          type="button"
                          onClick={handleSendOtp}
                          disabled={phone.length !== 10 || cooldown > 0}
                          className={`w-full py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition-all ${
                            phone.length !== 10 || cooldown > 0
                              ? "bg-gray-400 cursor-not-allowed"
                              : "bg-indigo-600 hover:bg-indigo-700 shadow-sm hover:shadow-md"
                          }`}
                        >
                          <span className="text-white font-medium">
                            {cooldown > 0
                              ? `Resend in ${cooldown}s`
                              : "Send OTP"}
                          </span>
                        </button>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={handleVerifyOtp}
                            disabled={otp.length !== 6}
                            className={`w-full py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition-all ${
                              otp.length !== 6
                                ? "bg-gray-400 cursor-not-allowed"
                                : "bg-indigo-600 hover:bg-indigo-700 shadow-sm hover:shadow-md"
                            }`}
                          >
                            <span className="text-white font-medium">
                              Verify OTP
                            </span>
                          </button>

                          {/* Resend OTP helper row */}
                          <div className="text-center text-sm text-gray-500 mt-2">
                            Didn’t get it?{" "}
                            {cooldown > 0 ? (
                              <span className="text-gray-400">
                                Resend in {cooldown}s
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={handleResendOtp}
                                className="text-indigo-600 hover:text-indigo-800 font-medium"
                              >
                                Resend OTP
                              </button>
                            )}
                          </div>
                        </>
                      )}
                    </>
                  ) : (
                    <div className="p-3 bg-green-50 text-green-600 rounded-lg text-sm text-center">
                      Phone number verified
                    </div>
                  )}
                </>
              )}

              {/* Product */}
              <div>
                <label
                  htmlFor="initialProductId"
                  className="block text-sm text-gray-600 mb-1"
                >
                  {isLoggedIn
                    ? "Choose a product to purchase"
                    : "Choose a product (optional)"}
                </label>
                <select
                  id="initialProductId"
                  name="initialProductId"
                  value={initialProductId}
                  onChange={handleProductChange}
                  disabled={catalogLoading}
                  className="w-full py-2.5 px-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-50"
                  required={isLoggedIn}
                >
                  <option value="">
                    {catalogLoading
                      ? "Loading…"
                      : !products.length
                      ? "No products found"
                      : isLoggedIn
                      ? "Select a product"
                      : "Select"}
                  </option>
                  {products.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Billing Interval */}
              {!!selectedProduct &&
                YEARLY_ELIGIBLE.has(selectedProduct.key) &&
                !selectedProduct.hasVariants && (
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">
                      Billing interval
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setBillingInterval("monthly")}
                        className={`py-2.5 rounded-lg border ${
                          billingInterval === "monthly"
                            ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        Monthly
                        {typeof selectedProduct.priceMonthly === "number"
                          ? ` — ₹${selectedProduct.priceMonthly}`
                          : ""}
                      </button>
                      <button
                        type="button"
                        onClick={() => setBillingInterval("yearly")}
                        className={`py-2.5 rounded-lg border ${
                          billingInterval === "yearly"
                            ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        Yearly
                        {typeof selectedProduct.priceYearly === "number"
                          ? ` — ₹${selectedProduct.priceYearly}`
                          : ""}
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {billingInterval === "yearly"
                        ? "Billed once per year."
                        : "Billed every month."}
                    </p>
                  </div>
                )}

              {/* Variant */}
              {selectedProduct?.hasVariants && (
                <div>
                  <label
                    htmlFor="initialVariantId"
                    className="block text-sm text-gray-600 mb-1"
                  >
                    Choose a plan
                  </label>
                  <select
                    id="initialVariantId"
                    name="initialVariantId"
                    value={initialVariantId}
                    onChange={handleVariantChange}
                    className="w-full py-2.5 px-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    required
                  >
                    <option value="" disabled>
                      Select a plan
                    </option>
                    {selectedProduct.variants?.map((v) => (
                      <option key={v._id} value={v._id}>
                        {v.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Broker Config (conditional for ALGO) */}
              {/* {selectedProduct?.key === "algo_simulator" &&
                initialVariantId && (
                  <>
                    <div>
                      <label
                        htmlFor="brokerName"
                        className="block text-sm text-gray-600 mb-1"
                      >
                        Select Broker (optional)
                      </label>
                      <select
                        id="brokerName"
                        value={brokerName}
                        onChange={(e) => {
                          setBrokerName(e.target.value);
                          setBrokerConfig({});
                        }}
                        className="w-full py-2.5 px-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      >
                        <option value="">Select Broker</option>
                        {Object.keys(brokerFieldMap).map((key) => (
                          <option key={key} value={key}>
                            {key.toUpperCase()}
                          </option>
                        ))}
                      </select>
                    </div>

                    {brokerFields.map((field) => (
                      <input
                        key={field}
                        name={field}
                        type={
                          field.includes("PASSWORD") || field.includes("SECRET")
                            ? "password"
                            : "text"
                        }
                        placeholder={field.replace(/_/g, " ")}
                        value={brokerConfig[field] || ""}
                        onChange={handleBrokerInput}
                        className="w-full py-2.5 px-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    ))}
                  </>
                )} */}

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading || (!isLoggedIn && !otpVerified)}
                className={`w-full py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition-all ${
                  isLoading || (!isLoggedIn && !otpVerified)
                    ? "bg-indigo-400 cursor-not-allowed"
                    : "bg-indigo-600 hover:bg-indigo-700 shadow-sm hover:shadow-md"
                }`}
              >
                <span className="text-white font-medium">
                  {isLoading
                    ? isLoggedIn
                      ? "Processing..."
                      : "Creating account..."
                    : isLoggedIn
                    ? "Pay & Activate"
                    : "Register"}
                </span>
                {!isLoading && <FiArrowRight className="text-white" />}
              </button>

              {/* Legal */}
              <div className="text-xs text-gray-500 text-center mt-4">
                By clicking {isLoggedIn ? "Pay & Activate" : "Register"}, you
                agree to our{" "}
                <Link
                  to="/terms"
                  target="_blank"
                  className="text-indigo-600 hover:underline"
                >
                  Terms & Conditions
                </Link>
                ,{" "}
                <Link
                  to="/privacy"
                  target="_blank"
                  className="text-indigo-600 hover:underline"
                >
                  Privacy Policy
                </Link>
                ,{" "}
                <Link
                  to="/refund"
                  target="_blank"
                  className="text-indigo-600 hover:underline"
                >
                  Refund & Cancellation Policy
                </Link>{" "}
                and{" "}
                <Link
                  to="/cookies"
                  target="_blank"
                  className="text-indigo-600 hover:underline"
                >
                  Cookies Policy
                </Link>
                .
              </div>
            </form>

            {!isLoggedIn && (
              <div className="mt-6 text-center text-sm text-gray-500">
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
                >
                  Sign in
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
