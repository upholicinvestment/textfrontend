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
} from "react-icons/fi";
import { AuthContext } from "../../../context/AuthContext";

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

const OTP_COOLDOWN_DURATION = 60; // 60 seconds cooldown

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

  // Countdown effect
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
    return () => clearTimeout(timer);
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
        setError(
          `Please wait ${retryAfter} seconds before requesting a new OTP`
        );
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
    } catch (err) {
      setError("Failed to verify OTP. Please try again.");
    }
  };

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    console.log("🚀 Register Payload:", {
      name: formData.name.trim(),
      email: formData.email.trim(),
      password: formData.password,
      phone,
      ...(initialProductId && { initialProductId }),
      ...(initialVariantId && { initialVariantId }),
      ...(selectedProduct?.key === "algo_simulator" &&
        initialVariantId && {
          brokerConfig: {
            brokerName,
            ...brokerConfig,
          },
        }),
    });

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

      const res = await api.post("/auth/register", body);
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      login(res.data.token, res.data.user);

      setSuccessMessage("Registration successful! Redirecting...");
      setTimeout(() => navigate("/dashboard"), 1200);
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
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden p-8 transition-all duration-300 hover:shadow-lg">
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

          {/* Phone Number and OTP Verification */}
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

          {/* Product Selection */}
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

          {/* Variant Selection */}
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

          {/* Broker Config (conditionally visible) */}
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

          {/* Submit Button */}
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
  );
};

export default Register;
