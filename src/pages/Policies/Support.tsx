import React, { useRef, useState, useEffect } from "react";
import { ToastContainer, toast, Slide } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

type FormState = {
  firstName: string;
  lastName: string;
  phone: string;     // 10 digits, required
  message: string;   // optional
};

const MailIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path d="M4 6h16v12H4z" stroke="currentColor" strokeWidth="1.6" />
    <path d="M4 7l8 6 8-6" stroke="currentColor" strokeWidth="1.6" fill="none" />
  </svg>
);
const PhoneIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path d="M22 16.92v2a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.06 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 5.18 2 2 0 0 1 4.11 3h2a2 2 0 0 1 2 1.72c.12.89.32 1.76.59 2.6a2 2 0 0 1-.45 2.11L7.09 10a16 16 0 0 0 6 6l.57-1.17a2 2 0 0 1 2.11-.45c.84.27 1.71.47 2.6.59A2 2 0 0 1 22 16.92z" stroke="currentColor" strokeWidth="1.6"/>
  </svg>
);
const MapIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path d="M12 22s7-4.5 7-11a7 7 0 0 0-14 0c0 6.5 7 11 7 11z" stroke="currentColor" strokeWidth="1.6"/>
    <circle cx="12" cy="11" r="2.5" stroke="currentColor" strokeWidth="1.6"/>
  </svg>
);

const API_BASE =
  (import.meta as any).env?.VITE_API_BASE_URL || "http://localhost:8000";

export default function ContactUsPage(): React.ReactElement {
  const [form, setForm] = useState<FormState>({
    firstName: "",
    lastName: "",
    phone: "",
    message: "",
  });

  // OTP state
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [cooldown, setCooldown] = useState<number>(0);
  const timerRef = useRef<number | null>(null);

  // Form submit
  const [submitting, setSubmitting] = useState(false);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, []);

  const startCooldown = (seconds = 45) => {
    setCooldown(seconds);
    if (timerRef.current) window.clearInterval(timerRef.current);
    timerRef.current = window.setInterval(() => {
      setCooldown((s) => {
        if (s <= 1) {
          if (timerRef.current) window.clearInterval(timerRef.current);
          return 0;
        }
        return s - 1;
      });
    }, 1000) as unknown as number;
  };

  const onPhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
    setForm((f) => ({ ...f, phone: digits }));
    // If user edits phone, reset OTP state
    setOtp("");
    setOtpSent(false);
    setOtpVerified(false);
    setCooldown(0);
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const onChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target as HTMLInputElement;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const sendOtp = async () => {
    if (!/^\d{10}$/.test(form.phone)) {
      toast.warn("Enter a valid 10-digit phone number first.");
      return;
    }
    try {
      setOtpSending(true);
      const r = await fetch(`${API_BASE}/api/otp/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: form.phone, purpose: "signup" }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) {
        // backend uses { message }, not { error }
        const msg = (data && data.message) || "Failed to send OTP";
        if (r.status === 429) startCooldown(45);
        throw new Error(msg);
      }
      setOtpSent(true);
      toast.success(data?.message || "OTP sent to your phone.");
      startCooldown(45);
    } catch (e: any) {
      toast.error(e?.message || "OTP send failed");
    } finally {
      setOtpSending(false);
    }
  };

  const verifyOtp = async () => {
    if (!/^\d{10}$/.test(form.phone)) {
      toast.warn("Enter a valid 10-digit phone number first.");
      return;
    }
    if (!/^\d{6}$/.test(otp)) {
      toast.warn("Enter the 6-digit OTP.");
      return;
    }
    try {
      setOtpVerifying(true);
      const r = await fetch(`${API_BASE}/api/otp/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: form.phone, otp }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data?.message || "OTP verification failed");
      setOtpVerified(true);
      setCooldown(0);
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
      toast.success(data?.message || "Phone verified ✅");
    } catch (e: any) {
      setOtpVerified(false);
      toast.error(e?.message || "Incorrect OTP");
    } finally {
      setOtpVerifying(false);
    }
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!form.firstName.trim()) {
      toast.warn("First name is required.");
      return;
    }
    if (!form.lastName.trim()) {
      toast.warn("Last name is required.");
      return;
    }
    if (!/^\d{10}$/.test(form.phone)) {
      toast.warn("Phone number must be exactly 10 digits.");
      return;
    }
    if (!otpVerified) {
      toast.warn("Please verify the OTP before submitting.");
      return;
    }

    setSubmitting(true);

    const payload: Record<string, string> = {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      phone: form.phone.trim(),
      otp: otp.trim(),
    };
    if (form.message.trim()) payload.message = form.message.trim();

    const submitPromise = fetch(`${API_BASE}/api/ads`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).then(async (res) => {
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || res.statusText);
      }
      return res.json();
    });

    try {
      await toast.promise(
        submitPromise,
        {
          pending: "Submitting your request…",
          success: "Your request has been submitted",
          error: {
            render({ data }) {
              const err = data as Error;
              return `Failed: ${err.message || "Server error"}`;
            },
          },
        },
        {
          position: "top-right",
          autoClose: 2500,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          transition: Slide,
          theme: "light",
        }
      );

      // Reset form & OTP state
      setForm({ firstName: "", lastName: "", phone: "", message: "" });
      setOtp("");
      setOtpSent(false);
      setOtpVerified(false);
      setCooldown(0);
    } catch {
      // handled by toast
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="contact-page">
      <ToastContainer />

      <style>{`
        :root{
          --primary:#2f7dff; --primary-2:#5aa3ff; --ink:#0b1b36; --text:#0f2347;
          --muted:#5c6e8a; --bg:#f7f9ff; --card:#ffffff; --ring: rgba(47,125,255,.25);
          --radius:18px;
        }
        *{ box-sizing:border-box; }
        .contact-page{ font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial; color:var(--text); background:#f7f9ff; }
        .hero{ position:relative; background:linear-gradient(180deg, var(--primary), #1b5fff);
          border-bottom-left-radius:32px; border-bottom-right-radius:32px; padding:56px 16px 84px; color:#fff; overflow:hidden;}
        .hero::after, .hero::before{ content:""; position:absolute; width:320px; height:320px; border-radius:50%; border:14px solid rgba(255,255,255,.18); top:-120px;}
        .hero::after{ right:-120px;} .hero::before{ left:-140px; top:-140px;}
        .hero-inner{ max-width:1100px; margin:0 auto; text-align:center;}
        .chip{ display:inline-block; padding:8px 16px; background:rgba(255,255,255,.2); border-radius:999px; font-weight:700; letter-spacing:.3px; backdrop-filter: blur(4px);}
        .hero h1{ margin:14px 0 0; font-size:40px; letter-spacing:.4px;}

        .main{ max-width:1100px; margin:-60px auto 56px; padding:0 16px;
          display:grid; grid-template-columns:minmax(0,1fr) 380px; gap:24px; align-items:start;}
        .card{ background:#ffffff; border:1px solid #e8eefc; border-radius:18px; padding:22px; box-shadow:0 10px 30px rgba(17,40,88,.06);}
        .left-title{ font-size:28px; font-weight:800; margin:4px 0 6px; color:#0b1b36;}
        .left-sub{ color:#5c6e8a; margin-bottom:18px;}

        .grid{ display:grid; gap:14px;}
        .row2{ display:grid; grid-template-columns:repeat(2, minmax(0,1fr)); gap:14px;}

        .label{ font-size:12px; font-weight:700; color:#35507b; margin-bottom:6px;}
        .ctl{ height:46px; border-radius:12px; width:100%; border:1px solid #dbe6ff; padding:0 12px; outline:none; background:#fbfdff;
              transition:border-color .15s, box-shadow .15s, background .15s;}
        .ctl::placeholder{ color:#99a8c3;}
        .ctl:focus{ border-color:#2f7dff; box-shadow:0 0 0 4px rgba(47,125,255,.25); background:#fff;}
        textarea.ctl{ height:auto; min-height:110px; padding:10px 12px; resize:vertical; line-height:1.45;}

        .muted{ color:#5f7396; font-size:14px;}

        .submit-row{ margin-top:6px; display:flex; align-items:center; gap:12px;}
        .btn{ display:inline-flex; align-items:center; gap:10px; height:46px; padding:0 20px; border-radius:12px; border:none; cursor:pointer;
          background:linear-gradient(180deg, #5aa3ff, #2f7dff); color:#fff; font-weight:800; letter-spacing:.3px; box-shadow:0 10px 20px rgba(47,125,255,.25);}
        .btn[disabled]{ opacity:.7; cursor:not-allowed; }
        .btn-ghost{ display:inline-flex; align-items:center; gap:8px; height:46px; padding:0 16px; border-radius:12px; border:1px solid #dbe6ff; background:#fff; color:#2b456f; font-weight:700; }
        .btn-ghost[disabled]{ opacity:.6; cursor:not-allowed; }

        .otp-row{ display:grid; grid-template-columns:1fr auto; gap:10px; align-items:end; }
        .otp-actions{ display:flex; gap:10px; flex-wrap:wrap; align-items:center; }
        .badge{ display:inline-block; padding:6px 10px; border-radius:999px; font-weight:800; font-size:12px; }
        .badge.ok{ background:#e6f8ec; color:#177a3f; border:1px solid #c8efd6; }
        .badge.warn{ background:#fff3e0; color:#a05a00; border:1px solid #ffe0b2; }

        aside{ min-width:0; }
        .image-card{ border-radius:18px; overflow:hidden; position:relative; min-height:280px; background:#eaf1ff; border:1px solid #e3ebff; box-shadow:0 10px 30px rgba(17,40,88,.06);}
        .image-card::after, .image-card::before{ content:""; position:absolute; inset:0; pointer-events:none; background:
            radial-gradient(600px 600px at 110% -10%, rgba(47,125,255,.12) 0%, transparent 50%),
            radial-gradient(600px 600px at -10% 110%, rgba(47,125,255,.12) 0%, transparent 50%); mix-blend-mode:multiply;}
        .hero-img{ width:100%; height:100%; object-fit:cover; display:block; aspect-ratio:4/3; filter:saturate(1.03) contrast(1.02);}

        .info-card{ margin-top:18px; padding:18px; background:#ffffff; border:1px solid #e8eefc; border-radius:18px; box-shadow:0 10px 30px rgba(17,40,88,.05);}
        .info-title{ font-weight:800; color:#0b1b36; margin-bottom:10px;}
        .info-list{ display:grid; gap:12px;}
        .info-item{ display:flex; gap:12px; align-items:flex-start; color:#2b456f;}
        .icon{ display:inline-grid; place-items:center; width:32px; height:32px; border-radius:10px; background:#eef4ff; color:#2f7dff; border:1px solid #e2ecff;}

        @media (max-width:980px){
          .main{ grid-template-columns:1fr; }
        }
      `}</style>

      {/* Hero */}
      <header className="hero">
        <div className="hero-inner">
          <span className="chip">WRITE TO US</span>
          <h1>Get In Touch</h1>
        </div>
      </header>

      {/* Content */}
      <div className="main">
        {/* Left: form */}
        <section className="card" aria-label="Contact form">
          <h2 className="left-title">Let’s Talk!</h2>
          <p className="left-sub">Get in touch with us using the enquiry form or contact details below.</p>

          <form className="grid" onSubmit={onSubmit} noValidate>
            <div className="row2">
              <div>
                <label className="label" htmlFor="firstName">First Name</label>
                <input
                  className="ctl"
                  id="firstName"
                  name="firstName"
                  placeholder="First name"
                  value={form.firstName}
                  onChange={onChange}
                  autoComplete="given-name"
                  required
                />
              </div>
              <div>
                <label className="label" htmlFor="lastName">Last Name</label>
                <input
                  className="ctl"
                  id="lastName"
                  name="lastName"
                  placeholder="Last name"
                  value={form.lastName}
                  onChange={onChange}
                  autoComplete="family-name"
                  required
                />
              </div>
            </div>

            {/* Phone + OTP actions */}
            <div>
              <label className="label" htmlFor="phone">Phone (10 digits)</label>
              {/* lock input when verified */}
              <div className="otp-row">
                <input
                  className="ctl"
                  id="phone"
                  name="phone"
                  type="tel"
                  inputMode="numeric"
                  pattern="^[0-9]{10}$"
                  maxLength={10}
                  placeholder="e.g., 9876543210"
                  value={form.phone}
                  onChange={onPhoneChange}
                  autoComplete="tel-national"
                  required
                  disabled={otpVerified}
                  title={otpVerified ? "Phone verified" : undefined}
                />
                {/* Single send/resend button; hidden/locked after verification */}
                {!otpVerified && (
                  <button
                    type="button"
                    className="btn-ghost"
                    onClick={sendOtp}
                    disabled={otpSending || !/^\d{10}$/.test(form.phone) || cooldown > 0}
                    aria-label="Send OTP"
                    title={
                      cooldown > 0
                        ? `Resend in ${cooldown}s`
                        : (otpSent ? "Resend OTP" : "Send OTP")
                    }
                  >
                    {otpSending
                      ? "Sending…"
                      : cooldown > 0
                        ? `Resend in ${cooldown}s`
                        : (otpSent ? "Resend OTP" : "Send OTP")}
                  </button>
                )}
                {otpVerified && <span className="badge ok">Verified</span>}
              </div>

              {/* OTP area is completely hidden after verification */}
              {otpSent && !otpVerified && (
                <div style={{ marginTop: 10 }} className="otp-actions">
                  <input
                    className="ctl"
                    name="otp"
                    inputMode="numeric"
                    pattern="^[0-9]{6}$"
                    maxLength={6}
                    placeholder="Enter OTP"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    style={{ flex: "1 1 180px", height: 46 }}
                  />
                  <button
                    type="button"
                    className="btn"
                    onClick={verifyOtp}
                    disabled={otpVerifying || !/^\d{6}$/.test(otp)}
                  >
                    {otpVerifying ? "Verifying…" : "Verify OTP"}
                  </button>

                  <span className="badge warn">Pending verification</span>
                </div>
              )}
            </div>

            {/* Message (optional) */}
            <div>
              <label className="label" htmlFor="message">Message (optional)</label>
              <textarea
                className="ctl"
                id="message"
                name="message"
                placeholder="Type something…"
                value={form.message}
                onChange={onChange}
              />
            </div>

            <div className="muted">
              By submitting, you acknowledge our commitment to protecting your privacy.
            </div>

            <div className="submit-row">
              <button className="btn" type="submit" disabled={submitting || !otpVerified}>
                {submitting ? "Submitting..." : "Submit"}
              </button>
            </div>
          </form>
        </section>

        {/* Right: image + quick contact */}
        <aside>
          <div className="image-card" aria-hidden="true">
            <img className="hero-img" src="stock.jpeg" alt="Contact illustration" />
          </div>

          <div className="info-card" aria-label="Quick contact">
            <div className="info-title">Quick Contact</div>
            <div className="info-list">
              <div className="info-item">
                <span className="icon"><MailIcon/></span>
                <div>
                  <div><strong>Email:</strong> help@upholic.tech</div>
                  <div className="muted">We reply within 1 business day</div>
                </div>
              </div>
              <div className="info-item">
                <span className="icon"><PhoneIcon/></span>
                <div>
                  <div><strong>Phone:</strong> 2244511316</div>
                  <div className="muted">Mon–Fri, 10:00–18:00 IST</div>
                </div>
              </div>
              <div className="info-item">
                <span className="icon"><MapIcon/></span>
                <div>
                  <div><strong>Headquarter:</strong> Thane</div>
                  <div className="muted">India</div>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
