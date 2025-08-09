// client/src/pages/Register.tsx
import { useState, useContext, useEffect, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../../../api";
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
  name: string;
  priceMonthly?: number;
};

type Product = {
  _id: string;
  key: string;
  name: string;
  hasVariants: boolean;
  variants?: Variant[];
};

// Broker-specific fields map
const brokerFieldMap: Record<string, string[]> = {
  angelone: [
    "ANGEL_API_KEY",
    "ANGEL_CLIENT_CODE",
    "ANGEL_PASSWORD",
    "ANGEL_TOTP_SECRET",
  ],
  zerodha: ["ZERODHA_API_KEY", "ZERODHA_API_SECRET", "ZERODHA_ACCESS_TOKEN"],
  upstox: [
    "UPSTOX_API_KEY",
    "UPSTOX_API_SECRET",
    "UPSTOX_REDIRECT_URI",
    "UPSTOX_ACCESS_TOKEN",
  ],
  dhan: ["DHAN_BASE_URL", "DHAN_ACCESS_TOKEN"],
  hdfc: ["HDFC_BASE_URL", "HDFC_API_KEY"],
  paytm: ["PAYTM_BASE_URL", "PAYTM_CLIENT_ID", "PAYTM_SECRET_KEY"],
  kotak: ["KOTAK_API_KEY", "KOTAK_API_SECRET"],
  icici: ["ICICI_API_KEY", "ICICI_API_SECRET"],
};

const OTP_COOLDOWN_DURATION = 60; // seconds

const Register = () => {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  // OTP state
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // Catalog state
  const [products, setProducts] = useState<Product[]>([]);
  const [initialProductId, setInitialProductId] = useState("");
  const [initialVariantId, setInitialVariantId] = useState("");

  // Broker state
  const [brokerName, setBrokerName] = useState("");
  const [brokerConfig, setBrokerConfig] = useState<Record<string, string>>({});

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const selectedProduct = useMemo(
    () => products.find((p) => p._id === initialProductId),
    [products, initialProductId]
  );

  const brokerFields = brokerFieldMap[brokerName] || [];

  // OTP cooldown ticker
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.currentTarget;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleBrokerInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.currentTarget;
    setBrokerConfig((prev) => ({ ...prev, [name]: value }));
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
      if (err.response?.status === 429) {
        const retryAfter =
          err.response.data.retryAfter || OTP_COOLDOWN_DURATION;
        setCooldown(retryAfter);
        setError(`Please wait ${retryAfter} seconds before requesting a new OTP`);
      } else {
        setError("Failed to send OTP. Please try again.");
      }
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
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
    } catch {
      setError("Failed to verify OTP. Please try again.");
    }
  };

  // === Payment (Razorpay) flow helpers ===
  const launchRazorpayForIntent = async (signupIntentId: string) => {
    try {
      // Create an order for this signup intent
      const orderRes = await api.post("/payments/create-order", {
        signupIntentId,
      });

      // If free plan (204), finalize signup without payment
      if (orderRes.status === 204) {
        const fin = await api.post("/auth/finalize-signup", { signupIntentId });
        localStorage.setItem("token", fin.data.token);
        localStorage.setItem("user", JSON.stringify(fin.data.user));
        login(fin.data.token, fin.data.user);
        setSuccessMessage("Registration successful! Redirecting…");
        setTimeout(() => navigate("/dashboard"), 1000);
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
        handler: async function (rsp: any) {
          try {
            const verify = await api.post("/payments/verify", {
              intentId: ord.intentId,
              razorpay_order_id: rsp.razorpay_order_id,
              razorpay_payment_id: rsp.razorpay_payment_id,
              razorpay_signature: rsp.razorpay_signature,
            });

            localStorage.setItem("token", verify.data.token);
            localStorage.setItem("user", JSON.stringify(verify.data.user));
            login(verify.data.token, verify.data.user);

            setSuccessMessage("Payment successful! Redirecting…");
            setTimeout(() => navigate("/dashboard"), 1200);
          } catch (e: any) {
            setError(e?.response?.data?.message || "Payment verification failed");
          }
        },
        modal: {
          ondismiss: () => {
            setError("Payment cancelled");
          },
        },
      });

      rz.open();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to start payment");
    }
  };

  // === Submit ===
  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

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
    if (initialProductId && selectedProduct?.hasVariants && !initialVariantId) {
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

      if (selectedProduct?.key === "algo_simulator" && initialVariantId) {
        body.brokerConfig = {
          brokerName,
          ...brokerConfig,
        };
      }

      // 1) Create signup intent (no user yet)
      const { data } = await api.post("/auth/register-intent", body);
      const signupIntentId: string = data.signupIntentId;

      // 2) If no product selected -> finalize signup immediately
      if (!initialProductId) {
        const fin = await api.post("/auth/finalize-signup", { signupIntentId });
        localStorage.setItem("token", fin.data.token);
        localStorage.setItem("user", JSON.stringify(fin.data.user));
        login(fin.data.token, fin.data.user);
        setSuccessMessage("Registration successful! Redirecting…");
        setTimeout(() => navigate("/dashboard"), 1000);
        return;
      }

      // 3) Start payment for paid product
      await launchRazorpayForIntent(signupIntentId);
    } catch (err: any) {
      setError(
        err?.response?.data?.message || "Registration failed. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const noProducts = !catalogLoading && products.length === 0;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-100 p-4">
      <div className="w-full max-w-6xl bg-white rounded-2xl shadow-xl overflow-hidden flex relative">
        {/* Close button */}
        <Link
          to="/"
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 transition-colors z-10"
          aria-label="Close"
        >
          <FiX className="w-6 h-6" />
        </Link>

        {/* Left Side - Illustration */}
        <div className="hidden md:flex flex-1 bg-indigo-600 p-12 items-center justify-center">
          <div className="text-white text-center">
            <img
              src="https://illustrations.popsy.co/amber/digital-nomad.svg"
              alt="Trading Illustration"
              className="w-full h-auto max-w-md mx-auto mb-8"
            />
            <h2 className="text-3xl font-bold mb-4">Start Your Trading Journey</h2>
            <p className="text-indigo-100">
              Join thousands of traders using our platform to maximize their profits
            </p>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="flex-1 p-8 md:p-12">
          <div className="max-w-md mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-800 mb-2">
                Create Account
              </h2>
              <p className="text-gray-500">Get started with your free account</p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm text-center">
                {error}
              </div>
            )}

            {successMessage && (
              <div className="mb-4 p-3 bg-green-50 text-green-600 rounded-lg text-sm text-center">
                {successMessage}
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-4">
              {/* Name */}
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

              {/* Email */}
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

              {/* Password */}
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
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>

              {/* Phone + OTP */}
              {!otpVerified ? (
                <>
                  <div className="relative">
                    <FiPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="tel"
                      placeholder="Phone Number (10 digits)"
                      value={phone}
                      onChange={handlePhoneChange}
                      disabled={otpSent}
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
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
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
                        {cooldown > 0 ? `Resend in ${cooldown}s` : "Send OTP"}
                      </span>
                    </button>
                  ) : (
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
                      <span className="text-white font-medium">Verify OTP</span>
                    </button>
                  )}
                </>
              ) : (
                <div className="p-3 bg-green-50 text-green-600 rounded-lg text-sm text-center">
                  Phone number verified
                </div>
              )}

              {/* Product */}
              <div>
                <label
                  htmlFor="initialProductId"
                  className="block text-sm text-gray-600 mb-1"
                >
                  Choose a product (optional)
                </label>
                <select
                  id="initialProductId"
                  name="initialProductId"
                  value={initialProductId}
                  onChange={handleProductChange}
                  disabled={catalogLoading}
                  className="w-full py-2.5 px-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-50"
                >
                  <option value="">
                    {catalogLoading
                      ? "Loading…"
                      : noProducts
                      ? "No products found"
                      : "Select"}
                  </option>
                  {products.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

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

              {/* Broker Config (conditional) */}
              {selectedProduct?.key === "algo_simulator" && initialVariantId && (
                <>
                  <div>
                    <label
                      htmlFor="brokerName"
                      className="block text-sm text-gray-600 mb-1"
                    >
                      Select Broker
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
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading || !otpVerified}
                className={`w-full py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition-all ${
                  isLoading || !otpVerified
                    ? "bg-indigo-400 cursor-not-allowed"
                    : "bg-indigo-600 hover:bg-indigo-700 shadow-sm hover:shadow-md"
                }`}
              >
                <span className="text-white font-medium">
                  {isLoading ? "Creating account..." : "Register"}
                </span>
                {!isLoading && <FiArrowRight className="text-white" />}
              </button>
            </form>

            <div className="mt-6 text-center text-sm text-gray-500">
              Already have an account?{" "}
              <Link
                to="/login"
                className="text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
              >
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
