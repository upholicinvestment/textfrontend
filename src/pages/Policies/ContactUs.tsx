import React, { useState, FormEvent } from "react";
import {
  FiCheckCircle,
  FiPhone,
  FiMail,
  FiMapPin,
  FiChevronDown,
  FiX,
  FiBriefcase,
} from "react-icons/fi";
import { Link, useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

type FormState = {
  firstName: string;
  lastName: string;
  email: string;
  company: string; // mobile number
  persona: string; // selected product (UI label)
  message: string;
  agree: boolean;
  website?: string; // honeypot (anti-spam)
};

const personas = [
  { label: "Select a product", value: "" },
  {
    label: "2-in-1 Trader's Essential Bundle",
    value: "2-in-1 Trader's Essential Bundle",
  },
  { label: "ALGO Simulator", value: "ALGO Simulator" },
  { label: "Both / Not sure", value: "Both / Not sure" },
];

// --- API base (strip trailing slash to avoid //api) ---
const RAW_API_BASE =
  (import.meta as any).env?.VITE_API_BASE || "https://api.upholictech.com";
const API_BASE = String(RAW_API_BASE).replace(/\/+$/, "");

/** Canonicalize persona to EXACT backend enum */
const canonicalizePersona = (p: string) => {
  if (!p) return p;
  let v = p
    .replace(/[\u2018\u2019\u2032]/g, "'") // smart -> straight apostrophe
    .replace(/[\u2010-\u2015]/g, "-") // any dash -> hyphen-minus
    .replace(/\s+/g, " ")
    .trim();

  // Force canonical 2-in-1 spelling with hyphens + possessive
  if (/^2\s*-?\s*in\s*-?\s*1\s+trader'?s?\s+essential\s+bundle$/i.test(v)) {
    return "2-in-1 Trader's Essential Bundle";
  }
  return v;
};

const ContactUs: React.FC = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState<FormState>({
    firstName: "",
    lastName: "",
    email: "",
    company: "",
    persona: "",
    message: "",
    agree: false,
    website: "", // honeypot must stay empty
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const isEmail = (x: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(x);
  const isPhoneLike = (x: string) => x.replace(/\D/g, "").length === 10; // exactly 10 digits

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!form.firstName.trim()) e.firstName = "First name is required";
    if (!form.lastName.trim()) e.lastName = "Last name is required";
    if (!form.email.trim() || !isEmail(form.email))
      e.email = "Valid email is required";
    if (form.company && !isPhoneLike(form.company))
      e.company = "Please enter a valid 10-digit mobile number";
    if (!form.persona) e.persona = "Please select a product";
    if (!form.agree) e.agree = "You must agree to Terms & Privacy";
    if (form.website && form.website.trim().length > 0)
      e.website = "Spam detected";
    setErrors(e);

    if (Object.keys(e).length > 0) {
      const first = Object.values(e)[0];
      toast.error(first || "Please fix the highlighted fields.", {
        autoClose: 3000,
      });
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setLoading(true);

      // Always send canonical persona that matches backend enum
      const personaCanonical = canonicalizePersona(form.persona);

      const res = await fetch(`${API_BASE}/api/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          company: form.company, // mobile
          persona: personaCanonical, // canonical value for server validation
          personaLabel: form.persona, // optional: keep original label for CRM/email
          message: form.message,
          agree: form.agree,
          website: form.website, // honeypot
        }),
      });

      let data: any = {};
      try {
        data = await res.json();
      } catch {
        /* non-JSON reply */
      }

      if (!res.ok) {
        toast.error(data?.error || "Submission failed. Please try again.", {
          autoClose: 3500,
        });
        return;
      }

      toast.success("Thanks! We received your message.", { autoClose: 2500 });

      setForm({
        firstName: "",
        lastName: "",
        email: "",
        company: "",
        persona: "",
        message: "",
        agree: false,
        website: "",
      });
      setErrors({});
    } catch (err) {
      console.error(err);
      toast.error(
        "Network error. Please check your connection and try again.",
        { autoClose: 3500 }
      );
    } finally {
      setLoading(false);
    }
  };

  // Mobile number: allow only numbers and limit to 10 digits
  const handleMobileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    const numbersOnly = input.replace(/\D/g, "");
    if (numbersOnly.length <= 10) {
      setForm((s) => ({ ...s, company: numbersOnly }));
    }
  };

  return (
    <section className="relative min-h-screen w-full overflow-hidden bg-[#0b0d10] text-white text-left">
      {/* Toasts */}
      <ToastContainer
        position="bottom-right"
        theme="dark"
        newestOnTop
        pauseOnHover
      />

      {/* Background Image */}
      <div
        className="absolute inset-0 z-0 opacity-20"
        style={{
          backgroundImage:
            "url('https://static.vecteezy.com/system/resources/previews/001/857/362/large_2x/stock-market-design-of-bull-and-bear-vector.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      />

      {/* Close button */}
      <button
        aria-label="Close"
        onClick={() => navigate("/")}
        className="absolute right-6 top-6 z-20 inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 backdrop-blur hover:bg-white/10 active:translate-y-px"
      >
        <FiX className="h-5 w-5 text-gray-200" />
      </button>

      {/* Background accents */}
      <div
        className="pointer-events-none absolute inset-0 z-10"
        style={{
          backgroundImage:
            "radial-gradient(1200px 600px at 70% -10%, rgba(255,255,255,0.08), transparent 60%), radial-gradient(900px 500px at -10% 20%, rgba(99,102,241,0.12), transparent 60%)",
        }}
      />
      {/* Darker dotted grid */}
      <div className="pointer-events-none absolute inset-0 z-10 opacity-[0.22] [background:radial-gradient(circle,rgba(255,255,255,0.7)_1px,transparent_1px)] [background-size:18px_18px]" />

      <div className="relative z-10 mx-auto max-w-7xl px-6 py-14 md:py-20">
        <div className="grid gap-12 md:grid-cols-2 md:gap-16">
          {/* LEFT: copy + features + contact info */}
          <div className="max-w-xl text-left">
            <div className="mb-3 text-left text-md font-semibold uppercase tracking-[0.2em] text-gray-300">
              Contact Us
            </div>
            <h1 className="text-left text-4xl font-bold leading-tight md:text-5xl">
              Get in Touch with Us
            </h1>

            <p className="mt-4 text-left text-sm leading-relaxed text-gray-400">
              We're here to help. Whether you're interested in learning more
              about our services or need support, we're happy to assist you.
            </p>

            <ul className="mt-4 space-y-2 text-left">
              {[
                "Product Demo & Use-Case Guidance",
                "Broker/API Integration Help (Zerodha, Angel One, Dhan, Upstox)",
                "Auto-Trading Setup & Risk Controls",
                "Pricing, Plans & Enterprise Trials",
                "Support, Bug Reports & Feature Requests",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-left">
                  <span className="mt-[2px] text-emerald-400">
                    <FiCheckCircle className="h-5 w-5" />
                  </span>
                  <span className="text-sm text-gray-200">{item}</span>
                </li>
              ))}
            </ul>

            <div className="mt-10 text-left">
              <div className="text-2xl font-semibold text-white">
                General Contact Info
              </div>
              <p className="mt-2 text-xs leading-relaxed text-gray-400">
                We're here to help. Whether you're interested in learning more
                about our services or need support, we're happy to assist you.
              </p>

              <div className="mt-6 space-y-3 text-sm">
                <div className="flex items-center gap-3 text-gray-200">
                  <FiBriefcase className="h-4 w-4 text-gray-400" />
                  <span>
                    <span className="text-gray-400">Legal Entity Name:</span>{" "}
                    Upholic Tech Private Limited
                  </span>
                </div>

                <div className="flex items-center gap-3 text-gray-200">
                  <FiPhone className="h-4 w-4 text-gray-400" />
                  <span>
                    <span className="text-gray-400">Phone:</span> 2244511316
                  </span>
                </div>
                <div className="flex items-center gap-3 text-gray-200">
                  <FiMail className="h-4 w-4 text-gray-400" />
                  <span>
                    <span className="text-gray-400">Email:</span>{" "}
                    ithelpdesk@upholic.in
                  </span>
                </div>
                <div className="flex items-start gap-3 text-gray-200">
                  <FiMapPin className="mt-0.5 h-4 w-4 text-gray-400" />
                  <span>
                    <span className="text-gray-400">Location:</span> FA-05/9,
                    Vikas Business Centre, Thane(W), 400601
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: form */}
          <div className="md:pl-2 text-left">
            <form
              onSubmit={handleSubmit}
              className="rounded-2xl border border-white/10 bg-white/5 p-5 text-left backdrop-blur-sm md:p-6"
              noValidate
            >
              {/* Honeypot (hide visually, keep in DOM) */}
              <div className="sr-only" aria-hidden="true">
                <label>
                  Website
                  <input
                    tabIndex={-1}
                    autoComplete="off"
                    value={form.website}
                    onChange={(e) =>
                      setForm((s) => ({ ...s, website: e.target.value }))
                    }
                  />
                </label>
              </div>

              {/* First/Last name */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="text-left">
                  <label className="mb-1 block text-left text-xs text-gray-400">
                    First Name
                  </label>
                  <input
                    className={`h-11 w-full rounded-full border ${
                      errors.firstName ? "border-red-500/70" : "border-white/10"
                    } bg-white/5 px-4 text-left text-sm text-white placeholder-gray-400 outline-none transition focus:border-white/20 focus:ring-2 focus:ring-white/10`}
                    placeholder="Enter First Name"
                    value={form.firstName}
                    onChange={(e) =>
                      setForm((s) => ({ ...s, firstName: e.target.value }))
                    }
                    required
                  />
                  {errors.firstName && (
                    <p className="mt-1 text-xs text-red-400">
                      {errors.firstName}
                    </p>
                  )}
                </div>
                <div className="text-left">
                  <label className="mb-1 block text-left text-xs text-gray-400">
                    Last Name
                  </label>
                  <input
                    className={`h-11 w-full rounded-full border ${
                      errors.lastName ? "border-red-500/70" : "border-white/10"
                    } bg-white/5 px-4 text-left text-sm text-white placeholder-gray-400 outline-none transition focus:border-white/20 focus:ring-2 focus:ring-white/10`}
                    placeholder="Enter Last Name"
                    value={form.lastName}
                    onChange={(e) =>
                      setForm((s) => ({ ...s, lastName: e.target.value }))
                    }
                    required
                  />
                  {errors.lastName && (
                    <p className="mt-1 text-xs text-red-400">
                      {errors.lastName}
                    </p>
                  )}
                </div>
              </div>

              {/* Email */}
              <div className="mt-3 text-left">
                <label className="mb-1 block text-left text-xs text-gray-400">
                  Email Address
                </label>
                <input
                  type="email"
                  className={`h-11 w-full rounded-full border ${
                    errors.email ? "border-red-500/70" : "border-white/10"
                  } bg-white/5 px-4 text-left text-sm text-white placeholder-gray-400 outline-none transition focus:border-white/20 focus:ring-2 focus:ring-white/10`}
                  placeholder="albert@susanto.com"
                  value={form.email}
                  onChange={(e) =>
                    setForm((s) => ({ ...s, email: e.target.value }))
                  }
                  required
                />
                {errors.email && (
                  <p className="mt-1 text-xs text-red-400">{errors.email}</p>
                )}
              </div>

              {/* Mobile Number */}
              <div className="mt-3 text-left">
                <label className="mb-1 block text-left text-xs text-gray-400">
                  Mobile Number
                </label>
                <input
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel"
                  className={`h-11 w-full rounded-full border ${
                    errors.company ? "border-red-500/70" : "border-white/10"
                  } bg-white/5 px-4 text-left text-sm text-white placeholder-gray-400 outline-none transition focus:border-white/20 focus:ring-2 focus:ring-white/10`}
                  placeholder="9876543210"
                  value={form.company}
                  onChange={handleMobileChange}
                  maxLength={10}
                />
                {errors.company && (
                  <p className="mt-1 text-xs text-red-400">{errors.company}</p>
                )}
              </div>

              {/* Products Interested In */}
              <div className="mt-3 text-left">
                <label className="mb-1 block text-left text-xs text-gray-400">
                  Products Interested In
                </label>
                <div className="relative text-left">
                  <select
                    className={`h-11 w-full appearance-none rounded-full border ${
                      errors.persona ? "border-red-500/70" : "border-white/10"
                    } bg-white/5 px-4 pr-10 text-left text-sm text-white outline-none transition focus:border-white/20 focus:ring-2 focus:ring-white/10`}
                    value={form.persona}
                    onChange={(e) =>
                      setForm((s) => ({ ...s, persona: e.target.value }))
                    }
                    required
                  >
                    {personas.map((p) => (
                      <option
                        key={p.value + p.label}
                        value={p.value}
                        className="bg-[#0b0d10]"
                      >
                        {p.label}
                      </option>
                    ))}
                  </select>
                  <FiChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                </div>
                {errors.persona && (
                  <p className="mt-1 text-xs text-red-400">{errors.persona}</p>
                )}
              </div>

              {/* Message */}
              <div className="mt-3 text-left">
                <label className="mb-1 block text-left text-xs text-gray-400">
                  Message
                </label>
                <textarea
                  className="min-h[160px] w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left text-sm text-white placeholder-gray-400 outline-none transition focus:border-white/20 focus:ring-2 focus:ring-white/10"
                  placeholder="Write your message..."
                  value={form.message}
                  onChange={(e) =>
                    setForm((s) => ({ ...s, message: e.target.value }))
                  }
                />
              </div>

              {/* Terms + Submit */}
              <div className="mt-4 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
                <label className="flex cursor-pointer select-none items-center gap-2 text-left text-xs text-gray-400">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-white/10 bg-white/5 accent-emerald-500"
                    checked={form.agree}
                    onChange={(e) =>
                      setForm((s) => ({ ...s, agree: e.target.checked }))
                    }
                    required
                  />
                  <span className="text-left">
                    I agree to Fireside{" "}
                    <Link className="underline underline-offset-2" to="/terms">
                      Terms of Use
                    </Link>{" "}
                    and{" "}
                    <Link
                      className="underline underline-offset-2"
                      to="/privacy"
                    >
                      Privacy Policy
                    </Link>{" "}
                    <span className="text-emerald-400">*</span>
                  </span>
                </label>

                {errors.agree && (
                  <p className="text-xs text-red-400">{errors.agree}</p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className={`ml-auto inline-flex items-center justify-center rounded-md px-5 py-2 text-sm font-semibold shadow-md shadow-purple-500/20 transition active:translate-y-[1px] bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white ${
                    loading ? "opacity-70 cursor-not-allowed" : ""
                  }`}
                >
                  {loading ? "Submitting..." : "Submit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactUs;
