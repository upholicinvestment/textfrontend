import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

/** ---------- Inline Theme & Controls ---------- **/
const THEME_CSS = `
.theme-light {
  --bg: #f8fafc;
  --fg: #0f172a;
  --muted: #64748b;
  --card: #ffffff;
  --card-2: #f8fafc;
  --border: #e2e8f0;
  --hover: #f1f5f9;
  --accent: #6d6ffb;
  --accent-2: #9b59ff;
  --ring: rgba(109,111,251,.35);
  --chip: #eff6ff;
  --success-bg: #ecfdf5;
  --success-fg: #059669;
  --danger-bg: #fef2f2;
  --danger-fg: #dc2626;
  --progress-bg: #e5e7eb;

  /* Toggle sizing (tweak these to change width/height) */
  --toggle-w: 64px;
  --toggle-h: 34px;
}
.theme-dark {
  --bg: #0b0d12;
  --fg: #e6e7ea;
  --muted: #a0a5b0;
  --card: #11141b;
  --card-2: #0f1218;
  --border: #20242e;
  --hover: #171b23;
  --accent: #6d6ffb;
  --accent-2: #9b59ff;
  --ring: rgba(109,111,251,.35);
  --chip: #1b2030;
  --success-bg: rgba(16,185,129,.16);
  --success-fg: #34d399;
  --danger-bg: rgba(239,68,68,.16);
  --danger-fg: #f87171;
  --progress-bg: #1f2432;

  /* Toggle sizing (tweak these to change width/height) */
  --toggle-w: 54px;
  --toggle-h: 24px;
}

/* Animations */
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
@keyframes slideIn { from { opacity: 0; transform: translateX(-10px); } to { opacity: 1; transform: translateX(0); } }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
.animate-fade-in { animation: fadeIn 0.5s ease-out; }
.animate-slide-in { animation: slideIn 0.3s ease-out; }
.animate-spin { animation: spin 1s linear infinite; }

/* Preferences: iOS-like rows */
.pref-row{
  display:flex; align-items:center; justify-content:space-between;
  padding:14px 18px; border-radius:16px; border:1px solid var(--border);
  background:var(--card-2);
  gap:12px;
  overflow:visible;
}
.pref-row + .pref-row { margin-top: 12px; }
.pref-label{ font-weight:600; line-height:1.25; flex:1; min-width:0; }

/* Switch */
.switch{
  position:relative; overflow:visible;
  width:var(--toggle-w); height:var(--toggle-h);
  border-radius:var(--toggle-h);
  background:var(--progress-bg);
  transition:background .2s ease, box-shadow .2s ease;
  box-shadow: inset 0 0 0 1px var(--border);
}
.switch.on{
  background: linear-gradient(90deg, var(--accent), var(--accent-2));
  box-shadow: 0 0 0 1px rgba(255,255,255,.08);
}
.knob{
  position:absolute; top:2px; left:2px;
  width:calc(var(--toggle-h) - 4px);
  height:calc(var(--toggle-h) - 4px);
  border-radius:9999px; background:#fff;
  transition: transform .22s cubic-bezier(.4,0,.2,1), box-shadow .2s ease;
  box-shadow: 0 1px 2px rgba(0,0,0,.25);
}
.switch.on .knob{
  transform: translateX(calc(var(--toggle-w) - var(--toggle-h)));
}

/* Theme icon button (square, subtle) */
.icon-btn {
  width: 44px; height: 44px; border-radius: 12px;
  background: var(--card); border: 1px solid var(--border);
  display:flex; align-items:center; justify-content:center;
  transition: transform .15s ease, background .2s ease, box-shadow .2s ease;
}
.icon-btn:hover { background: var(--hover); transform: scale(1.03); }
.icon { width:22px; height:22px; opacity:.9; }

/* Floating close button (always visible) */
.close-float {
  position: absolute; top: 16px; right: 16px; z-index: 60;
  width: 44px; height: 44px; border-radius: 12px;
  background: var(--card); border: 1px solid var(--border);
  display:flex; align-items:center; justify-content:center;
  box-shadow: 0 6px 16px rgba(0,0,0,.2);
  transition: transform .15s ease, background .2s ease;
}
.close-float:hover { background: var(--hover); transform: scale(1.04); }

/* --- Mobile adjustments --- */
@media (max-width: 640px) {
  .close-float {
    top: 10px;
    right: 10px;
    width: 36px;
    height: 36px;
  }
  /* Ensures avatar/name don't sit under the floating close button */
  .profile-header-pad {
    padding-top: 56px;
  }
}
`;

/** ---------- Avatars ---------- **/
import pinkImg from "../../assets/pinkgirl.jpg";
import ponyImg from "../../assets/ponygirl.jpg";
import brownImg from "../../assets/brownboy.jpg";
import nerdImg from "../../assets/nerdboy.jpg";
import redImg from "../../assets/redhair.jpg";
import chadImg from "../../assets/chadboy.jpg"
const AVATAR_MAP = {
  
  sienna:  brownImg,  // was "brown"
  analyst: nerdImg,   // was "nerd"
  rose:   pinkImg,   // was "pink"
  comet:   ponyImg,   // was "pony"
  crimson: redImg,    // was "red"
  prime:   chadImg,   // was "chad"
} as const;
const AVATAR_KEYS = Object.keys(AVATAR_MAP) as (keyof typeof AVATAR_MAP)[];

/** ---------- Types ---------- **/
type ProductItem = {
  productId: string;
  key: string;
  name: string;
  route?: string;
  status: string;
  endsAt: string | null;
  variant?: { name: string } | null;
};
type ProfileDto = {
  _id: string;
  name?: string; email?: string; phone?: string; broker?: string; location?: string; bio?: string;
  avatarKey?: keyof typeof AVATAR_MAP; role?: string; createdAt?: string; updatedAt?: string;
  tradingStyle?: string; experienceYears?: string; riskProfile?: string; instruments?: string[]; timezone?: string;
  notifyAnnouncements?: boolean; notifyRenewals?: boolean;
};

/** ---------- Options ---------- **/
const BROKER_OPTIONS = ["Angel One","Zerodha","Dhan","Upstox","HDFC Securities","ICICI Direct","Kotak Securities","Fyers","Alice Blue","Groww"];
const TRADING_STYLE_OPTIONS = ["Intraday","Swing","Positional","Options Scalper","Options Seller","Investor"];
const EXPERIENCE_OPTIONS = ["0-1 years","1-3 years","3-5 years","5-10 years","10+ years"];
const RISK_PROFILE_OPTIONS = ["Conservative","Moderate","Aggressive"];
const INSTRUMENT_OPTIONS = ["Index Options","Stock Options","Futures","Equity (Cash)","Commodities","Currency"];

/** ---------- Config ---------- **/
const API_BASE = import.meta.env.VITE_API_BASE_URL || "https://api.upholictech.com/api";
const THEME_KEY = "theme";
const REMINDERS_KEY = "reminders:v1";

/** ---------- Utils ---------- **/
const fmtDate = (iso?: string | null) => (iso ? new Date(iso).toLocaleDateString() : "—");
const shallowEqual = (a: any, b: any) => JSON.stringify(a) === JSON.stringify(b);
const getInitialTheme = (): "dark" | "light" => (localStorage.getItem(THEME_KEY) === "light" ? "light" : "dark");
const daysUntil = (iso?: string | null) => {
  if (!iso) return Infinity;
  const ms = new Date(iso).getTime() - Date.now();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
};

/** ---------- In-site Reminders ---------- **/
type Reminder = {
  id: string;
  kind: "renewal" | "profile";
  title: string;
  message: string;
  severity?: "info" | "warn" | "alert";
  cta?: { label: string; onClick: () => void };
};
type SnoozeMap = Record<string, { snoozeUntil?: number; dismissed?: boolean }>;
const loadSnoozes = (): SnoozeMap => {
  try { return JSON.parse(localStorage.getItem(REMINDERS_KEY) || "{}"); } catch { return {}; }
};
const saveSnoozes = (m: SnoozeMap) => localStorage.setItem(REMINDERS_KEY, JSON.stringify(m));

export default function Myprofile() {
  const navigate = useNavigate();

  /** Theme */
  const [theme, setTheme] = useState<"dark" | "light">(getInitialTheme());
  useEffect(() => { localStorage.setItem(THEME_KEY, theme); }, [theme]);

  /** Data */
  const [profile, setProfile] = useState<ProfileDto | null>(null);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [avatarKeys, setAvatarKeys] = useState<string[]>(AVATAR_KEYS);

  /** UI */
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [mode, setMode] = useState<"view" | "edit">("view");
  const [avatarModalOpen, setAvatarModalOpen] = useState(false);

  /** Form */
  const [form, setForm] = useState<Required<Omit<ProfileDto, "_id" | "role" | "createdAt" | "updatedAt">>>({
    name: "", email: "", phone: "", broker: "", location: "", bio: "", avatarKey: "sienna",
    tradingStyle: "", experienceYears: "", riskProfile: "", instruments: [], timezone: "Asia/Kolkata",
    notifyAnnouncements: true, notifyRenewals: true,
  });

  /** Refs */
  const basicsRef = useRef<HTMLDivElement>(null);
  const tradingRef = useRef<HTMLDivElement>(null);

  // Auto-dismiss "Profile updated." toast after 3.5s; keep errors until dismissed
  const msgTimerRef = useRef<number | null>(null);
  useEffect(() => {
    if (!msg) return;
    if (msgTimerRef.current) window.clearTimeout(msgTimerRef.current);
    msgTimerRef.current = window.setTimeout(() => setMsg(""), 3500);
    return () => {
      if (msgTimerRef.current) window.clearTimeout(msgTimerRef.current);
    };
  }, [msg]);

  /** Auth headers */
  const token = useMemo(() => localStorage.getItem("token") || "", []);
  const authHeaders: HeadersInit = useMemo(
    () => ({ Authorization: token ? `Bearer ${token}` : "", "Content-Type": "application/json" }),
    [token]
  );

  /** Load data */
  useEffect(() => {
    (async () => {
      try {
        setLoading(true); setError(""); setMsg("");
        const [meRes, prodRes, avRes] = await Promise.all([
          fetch(`${API_BASE}/users/me`, { headers: authHeaders }),
          fetch(`${API_BASE}/users/me/products`, { headers: authHeaders }),
          fetch(`${API_BASE}/users/me/avatar-options`, { headers: authHeaders }),
        ]);
        const me = await meRes.json(); const prod = await prodRes.json(); const av = await avRes.json();

        setProfile(me);
        setProducts(prod?.items || []);
        setAvatarKeys(Array.isArray(av?.avatars) && av.avatars.length ? av.avatars : AVATAR_KEYS);

        setForm({
          name: me?.name || "", email: me?.email || "", phone: me?.phone || "",
          broker: me?.broker || "", location: me?.location || "", bio: me?.bio || "",
          avatarKey: me?.avatarKey && AVATAR_MAP[me.avatarKey as keyof typeof AVATAR_MAP] ? me.avatarKey as keyof typeof AVATAR_MAP : "sienna",
          tradingStyle: me?.tradingStyle || "", experienceYears: me?.experienceYears || "", riskProfile: me?.riskProfile || "",
          instruments: Array.isArray(me?.instruments) ? me.instruments : [],
          timezone: me?.timezone || "Asia/Kolkata",
          notifyAnnouncements: typeof me?.notifyAnnouncements === "boolean" ? me.notifyAnnouncements : true,
          notifyRenewals: typeof me?.notifyRenewals === "boolean" ? me.notifyRenewals : true,
        });
      } catch (e) {
        console.error(e);
        setError("Failed to load profile.");
      } finally {
        setLoading(false);
      }
    })();
  }, []); // eslint-disable-line

  /** Role mapping: 'customer' -> Member (display only) */
  const displayRole = useMemo(() => {
    const r = (profile?.role || "").toLowerCase();
    if (r === "customer") return "Member";
    if (!profile?.role) return "Member";
    return profile.role!;
  }, [profile?.role]);

  /** Derived */
  const currentAvatarSrc = useMemo(() => {
    const key = mode === "edit" ? form.avatarKey : (profile?.avatarKey || form.avatarKey);
    return AVATAR_MAP[key as keyof typeof AVATAR_MAP] || AVATAR_MAP.sienna;
  }, [mode, form.avatarKey, profile?.avatarKey]);

  /** Baseline & dirty check */
  const baseline = useMemo(() => {
    if (!profile) return null;
    return {
      name: profile.name || "", email: profile.email || "", phone: profile.phone || "",
      broker: profile.broker || "", location: profile.location || "", bio: profile.bio || "",
      avatarKey: (profile.avatarKey && AVATAR_MAP[profile.avatarKey] ? profile.avatarKey : "astro") as keyof typeof AVATAR_MAP,
      tradingStyle: profile.tradingStyle || "", experienceYears: profile.experienceYears || "", riskProfile: profile.riskProfile || "",
      instruments: Array.isArray(profile.instruments) ? profile.instruments : [],
      timezone: profile.timezone || "Asia/Kolkata",
      notifyAnnouncements: typeof profile.notifyAnnouncements === "boolean" ? profile.notifyAnnouncements : true,
      notifyRenewals: typeof profile.notifyRenewals === "boolean" ? profile.notifyRenewals : true,
    };
  }, [profile]);
  const dirty = useMemo(() => (baseline ? !shallowEqual(baseline, form) : false), [baseline, form]);

  /** Completion (header only) */
  const completionInfo = useMemo(() => {
    const checks: { key: keyof typeof form; filled: boolean; label: string; section: "basics" | "trading" }[] = [
      { key: "name", filled: !!form.name?.trim(), label: "Name", section: "basics" },
      { key: "email", filled: !!form.email?.trim(), label: "Email", section: "basics" },
      { key: "phone", filled: !!form.phone?.trim(), label: "Phone", section: "basics" },
      { key: "location", filled: !!form.location?.trim(), label: "Location", section: "basics" },
      { key: "broker", filled: !!form.broker?.trim(), label: "Broker", section: "trading" },
      { key: "tradingStyle", filled: !!form.tradingStyle?.trim(), label: "Trading Style", section: "trading" },
      { key: "experienceYears", filled: !!form.experienceYears?.trim(), label: "Experience", section: "trading" },
      { key: "riskProfile", filled: !!form.riskProfile?.trim(), label: "Risk Profile", section: "trading" },
      { key: "instruments", filled: (form.instruments?.length ?? 0) > 0, label: "Instruments", section: "trading" },
      { key: "bio", filled: !!form.bio?.trim(), label: "Bio", section: "basics" },
      { key: "timezone", filled: !!form.timezone?.trim(), label: "Timezone", section: "basics" },
    ];
    const done = checks.filter(c => c.filled).length;
    const percent = Math.round((done / checks.length) * 100);
    const missing = checks.filter(c => !c.filled);
    return { percent, missing };
  }, [form]);

  /** Snapshot for quick stats */
  const nextRenewalISO = useMemo(() => {
    const ends = (products || [])
      .filter(p => p.status === "active" && p.endsAt)
      .map(p => p.endsAt as string);
    if (!ends.length) return null;
    return ends.reduce((min, d) => (new Date(d) < new Date(min!) ? d : min!), ends[0]);
  }, [products]);
  const nextRenewalDays = daysUntil(nextRenewalISO);
  const tz = useMemo(() => (mode === "edit" ? form.timezone : (profile?.timezone || "Asia/Kolkata")), [mode, form.timezone, profile?.timezone]);

  // AM/PM time, no suffix like (Kolkata)
  const localTime = useMemo(() => {
    try {
      return new Date().toLocaleTimeString([], {
        timeZone: tz,
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return "—";
    }
  }, [tz]);

  /** Reminders (renewal + profile) */
  const reminders = useMemo<Reminder[]>(() => {
    const out: Reminder[] = [];
    if (form.notifyRenewals) {
      const soon = (products || [])
        .filter(p => p.status === "active" && daysUntil(p.endsAt) <= 7)
        .sort((a, b) => daysUntil(a.endsAt) - daysUntil(b.endsAt))[0];
      if (soon) {
        const d = daysUntil(soon.endsAt);
        out.push({
          id: `renewal:${soon.productId}:${soon.endsAt}`,
          kind: "renewal",
          severity: d <= 2 ? "alert" : "warn",
          title: d > 0 ? `Renewal in ${d} day${d === 1 ? "" : "s"}` : "Renewal today",
          message: `${soon.name} ${d > 0 ? `ends on ${fmtDate(soon.endsAt)}` : "ends today"}.`,
          cta: soon.route ? { label: "Renew now", onClick: () => window.location.assign(soon.route!) } : undefined,
        });
      }
    }
    if (completionInfo.percent < 100) {
      const needed = completionInfo.missing.slice(0, 3).map(x => x.label).join(" • ");
      out.push({
        id: `profile:${completionInfo.percent}`,
        kind: "profile",
        severity: "info",
        title: `Profile ${completionInfo.percent}% complete`,
        message: completionInfo.missing.length ? `Add: ${needed}${completionInfo.missing.length > 3 ? " + more" : ""}` : "Complete your profile",
        cta: {
          label: "Complete now",
          onClick: () => {
            setMode("edit");
            const first = completionInfo.missing[0];
            if (first?.section === "trading") tradingRef.current?.scrollIntoView({ behavior: "smooth" });
            else basicsRef.current?.scrollIntoView({ behavior: "smooth" });
          }
        }
      });
    }
    return out;
  }, [products, form.notifyRenewals, completionInfo]);

  /** Snooze / Dismiss */
  const [snoozes, setSnoozes] = useState<SnoozeMap>(() => loadSnoozes());
  useEffect(() => saveSnoozes(snoozes), [snoozes]);
  const visibleReminders = useMemo(() => {
    const now = Date.now();
    return reminders.filter(r => {
      const s = snoozes[r.id];
      if (!s) return true;
      if (s.dismissed) return false;
      if (s.snoozeUntil && s.snoozeUntil > now) return false;
      return true;
    });
  }, [reminders, snoozes]);
  const snooze = (id: string, days = 3) =>
    setSnoozes(m => ({ ...m, [id]: { ...(m[id] || {}), snoozeUntil: Date.now() + days * 864e5 } }));
  const dismiss = (id: string) =>
    setSnoozes(m => ({ ...m, [id]: { ...(m[id] || {}), dismissed: true } }));

  /** Handlers */
  const onChange = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm(p => ({ ...p, [k]: v }));
  const toggleInstrument = (name: string) => setForm(p => {
    const set = new Set(p.instruments);
    set.has(name) ? set.delete(name) : set.add(name);
    return { ...p, instruments: Array.from(set) };
  });
  const enterEdit = () => { if (baseline) setForm(baseline); setMode("edit"); setMsg(""); setError(""); };
  const cancelEdit = () => { if (baseline) setForm(baseline); setMode("view"); setMsg(""); setError(""); };
  const save = async () => {
    setSaving(true); setError(""); setMsg("");
    try {
      const res = await fetch(`${API_BASE}/users/me`, { method: "PUT", headers: authHeaders, body: JSON.stringify(form) });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed to save");
      setProfile(data); setMsg("Profile updated."); setMode("view");
    } catch (e: any) { console.error(e); setError(e?.message || "Failed to save profile."); }
    finally { setSaving(false); }
  };
  const chooseAvatar = (k: string) => { onChange("avatarKey", k as any); setAvatarModalOpen(false); };

  /** Loading */
  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center bg-[var(--bg)]">
        <style>{THEME_CSS}</style>
        <div className="text-center animate-fade-in">
          <div className="w-12 h-12 border-3 border-[var(--accent)] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-[var(--muted)] text-lg">Loading your profile...</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${theme === "dark" ? "theme-dark" : "theme-light"} bg-[var(--bg)] text-[var(--fg)] transition-all duration-300`}>
      <style>{THEME_CSS}</style>

      {/* Floating close */}
      <button className="close-float" onClick={() => navigate("/")} title="Close">✕</button>

      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[var(--accent)] via-[var(--accent-2)] to-[var(--accent)] py-1">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative bg-[var(--bg)]">
          <div className="max-w-7xl mx-auto px-6 pt-8 pb-6 profile-header-pad">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 animate-fade-in">
              {/* Profile section */}
              <div className="flex items-start gap-6">
                <div className="relative">
                  <div className="w-24 h-24 rounded-2xl overflow-hidden ring-4 ring-white/20">
                    <img src={currentAvatarSrc} alt="avatar" className="w-full h-full object-contain bg-gradient-to-br from-white to-gray-50" />
                  </div>
                  {mode === "edit" && (
                    <button
                      onClick={() => setAvatarModalOpen(true)}
                      className="absolute -bottom-2 -right-2 w-8 h-8 bg-[var(--card)] text-[var(--fg)] border border-[var(--border)] rounded-full shadow hover:bg-[var(--hover)]"
                      title="Change avatar"
                    >✎</button>
                  )}
                </div>
                <div>
                  <h1 className="text-3xl font-bold mb-2">{profile?.name || "Welcome"}</h1>
                  <div className="flex items-center gap-3 text-[var(--muted)] mb-4">
                    <span className="bg-[var(--chip)] px-3 py-1 rounded-full text-sm font-medium">{displayRole}</span>
                    <span>•</span>
                    <span>Since {fmtDate(profile?.createdAt)}</span>
                  </div>
                  {/* Completion bar */}
                  <div className="flex items-center gap-4">
                    <div className="flex-1 max-w-xs">
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-[var(--muted)]">Profile completion</span>
                        <span className="font-semibold text-[var(--accent)]">{completionInfo.percent}%</span>
                      </div>
                      <div className="h-3 rounded-full bg-[var(--progress-bg)] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[var(--accent)] to-[var(--accent-2)] transition-all duration-700 ease-out"
                          style={{ width: `${completionInfo.percent}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div
                className={`flex items-center gap-3 animate-slide-in w-full lg:w-auto ${
                  mode === "edit" ? "justify-start" : "justify-end"
                }`}
              >
                {/* Theme icon button */}
                <button
                  className="icon-btn"
                  onClick={() => setTheme(t => (t === "dark" ? "light" : "dark"))}
                  title={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
                  aria-label="Theme toggle"
                >
                  {theme === "dark" ? (
                    /* Sun */
                    <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <circle cx="12" cy="12" r="4" />
                      <path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12" />
                    </svg>
                  ) : (
                    /* Moon */
                    <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M21 12.79A9 9 0 1 1 11.21 3c.2 0 .4.01.6.03A7 7 0 0 0 21 12.79z" />
                    </svg>
                  )}
                </button>

                {mode === "edit" ? (
                  <>
                    <ActionBtn primary disabled={saving || !dirty} onClick={save}>
                      {saving ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          Saving...
                        </div>
                      ) : ("Save changes")}
                    </ActionBtn>
                    <ActionBtn disabled={saving} onClick={cancelEdit}>Cancel</ActionBtn>
                  </>
                ) : (
                  <ActionBtn primary onClick={enterEdit}>Edit Profile</ActionBtn>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 -mt-4">
        {(msg || error) && (
          <div
            role="status"
            className={`mb-6 mt-6 p-4 rounded-2xl shadow-lg animate-fade-in flex items-start gap-3 ${
              error
                ? 'bg-[var(--danger-bg)] text-[var(--danger-fg)] border border-red-200'
                : 'bg-[var(--success-bg)] text-[var(--success-fg)] border border-green-200'
            }`}
          >
            <span className="text-xl leading-none mt-0.5">{error ? "❌" : "✅"}</span>
            <span className="font-medium flex-1">{error || msg}</span>
            <button
              aria-label="Dismiss"
              onClick={() => { setMsg(""); setError(""); }}
              className="shrink-0 rounded-lg px-2 py-1 bg-transparent hover:bg-white/10 transition"
              title="Dismiss"
            >
              ✕
            </button>
          </div>
        )}

        {/* Reminders */}
        {visibleReminders.length > 0 && (
          <div className="mb-8 animate-fade-in">
            <div className="grid md:grid-cols-1 mt-20 gap-4">
              {visibleReminders.map(r => (
                <div
                  key={r.id}
                  className="rounded-2xl border border-[var(--border)] bg-gradient-to-r from-[var(--card)] to-[var(--card-2)] p-6 shadow-md hover:shadow-lg transition-all"
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white text-xl shadow-sm ${
                      r.kind === "renewal" ? "bg-gradient-to-br from-orange-400 to-red-500" : "bg-gradient-to-br from-blue-400 to-purple-500"
                    }`}>{r.kind === "renewal" ? "⏰" : "✅"}</div>
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <h3 className="font-semibold text-lg">{r.title}</h3>
                        {r.severity === "alert" && <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-700 font-medium">Urgent</span>}
                        {r.severity === "warn" && <span className="text-xs px-2 py-1 rounded-full bg-orange-100 text-orange-700 font-medium">Soon</span>}
                      </div>
                      <p className="text-[var(--muted)] text-left mb-4">{r.message}</p>
                      <div className="flex items-center gap-3">
                        {r.cta && (
                          <button
                            onClick={r.cta.onClick}
                            className="px-4 py-2 bg-gradient-to-r from-[var(--accent)] to-[var(--accent-2)] text-white rounded-lg font-medium shadow-md hover:shadow-lg transition-all transform hover:scale-105"
                          >
                            {r.cta.label}
                          </button>
                        )}
                        <button onClick={() => snooze(r.id, 3)} className="px-4 py-2 rounded-lg border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--hover)] transition-all">Snooze 3d</button>
                        <button onClick={() => dismiss(r.id)} className="px-4 py-2 rounded-lg border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--hover)] transition-all">Dismiss</button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-12 mt-10">
          {/* LEFT COLUMN */}
          <aside className="lg:col-span-3 space-y-6 animate-slide-in">
            <Card>
              <div className="text-center mb-4">
                <h3 className="text-xl font-semibold">About Me</h3>
                <div className="w-16 h-1 bg-gradient-to-r from-[var(--accent)] to-[var(--accent-2)] rounded-full mx-auto mt-2"></div>
              </div>
              {mode === "view" ? (
                <div className="text-center text-[var(--muted)] leading-relaxed">
                  {profile?.bio || "No bio added yet."}
                </div>
              ) : (
                <textarea
                  rows={5}
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--card-2)] px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30 focus:border-[var(--accent)] transition-all resize-none"
                  value={form.bio}
                  onChange={(e) => onChange("bio", e.target.value)}
                  placeholder="Tell us about yourself..."
                />
              )}
            </Card>

            {/* At a glance (non-repeating) */}
            <Card>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <span className="text-xl">📊</span>At a glance
              </h3>
              <div className="space-y-4 text-left">
                <Stat icon="📦" label="Active products" value={String(products.filter(p => p.status === "active").length)} />
                <Stat icon="⏳" label="Next renewal" value={nextRenewalISO ? fmtDate(nextRenewalISO) : "—"} />
                <Stat icon="🗓️" label="Days left" value={isFinite(nextRenewalDays) ? `${nextRenewalDays} day${nextRenewalDays===1?"":"s"}` : "—"} />
                <Stat icon="🕒" label="Local time" value={localTime} />
                <Stat icon="🎉" label="Member since" value={fmtDate(profile?.createdAt)} />
              </div>
            </Card>
          </aside>

          {/* MIDDLE COLUMN */}
          <main className="lg:col-span-6 space-y-8 animate-fade-in">
            <div ref={basicsRef}>
              <Card title="Basic Information" desc="Your primary contact details." icon="👤">
                <div className="grid sm:grid-cols-2 gap-6">
                  <Field label="Name" mode={mode} value={mode==="view" ? (profile?.name || "—") : form.name} onChange={(v)=>onChange("name", v)} />
                  <Field label="Email" type="email" mode={mode} value={mode==="view" ? (profile?.email || "—") : form.email} onChange={(v)=>onChange("email", v)} />
                  <Field label="Phone" mode={mode} value={mode==="view" ? (profile?.phone || "—") : form.phone} onChange={(v)=>onChange("phone", v)} />
                  <Field label="Location" mode={mode} value={mode==="view" ? (profile?.location || "—") : form.location} onChange={(v)=>onChange("location", v)} />
                </div>
              </Card>
            </div>

            <div ref={tradingRef}>
              <Card title="Trading Profile" desc="Tell us about your trading setup." icon="📈">
                <div className="grid sm:grid-cols-2 gap-6 mb-6">
                  <SelectField label="Primary Broker" mode={mode} value={mode==="view" ? (profile?.broker || "—") : (form.broker || "")} options={BROKER_OPTIONS} onChange={(v)=>onChange("broker", v)} />
                  <SelectField label="Trading Style" mode={mode} value={mode==="view" ? (profile?.tradingStyle || "—") : (form.tradingStyle || "")} options={TRADING_STYLE_OPTIONS} onChange={(v)=>onChange("tradingStyle", v)} />
                  <SelectField label="Experience" mode={mode} value={mode==="view" ? (profile?.experienceYears || "—") : (form.experienceYears || "")} options={EXPERIENCE_OPTIONS} onChange={(v)=>onChange("experienceYears", v)} />
                  <SelectField label="Risk Profile" mode={mode} value={mode==="view" ? (profile?.riskProfile || "—") : (form.riskProfile || "")} options={RISK_PROFILE_OPTIONS} onChange={(v)=>onChange("riskProfile", v)} />
                </div>
                <ChipField label="Preferred Instruments" mode={mode} options={INSTRUMENT_OPTIONS} value={mode==="view" ? (profile?.instruments || []) : form.instruments} onToggle={toggleInstrument} />
              </Card>
            </div>
          </main>

          {/* RIGHT COLUMN */}
          <aside className="lg:col-span-3 space-y-6 animate-slide-in" style={{ animationDelay: '0.2s' }}>
            <Card title="Active Subscriptions" icon="📦">
              {products.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-[var(--card-2)] rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl opacity-50">📦</span>
                  </div>
                  <p className="text-[var(--muted)]">No active products.</p>
                </div>
              ) : (
                <div className="space-y-4 mb-6">
                  {products.map((p) => (
                    <div key={String(p.productId)} className="rounded-xl border border-[var(--border)] p-4 bg-[var(--card-2)] hover:bg-[var(--hover)] hover:shadow-md transition-all group">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium group-hover:text-[var(--accent)] transition-colors">{p.name}</h4>
                        <span className="px-2 py-1 bg-[var(--success-bg)] text-[var(--success-fg)] rounded-full text-xs font-medium">
                          {p.status}
                        </span>
                      </div>
                      {p.variant?.name && <div className="text-sm text-[var(--muted)] mb-2">Variant: {p.variant.name}</div>}
                      <div className="text-sm text-[var(--muted)] mb-3">Ends: {fmtDate(p.endsAt)}</div>
                      {p.route && (
                        <a href={p.route} className="inline-flex items-center gap-1 text-sm text-[var(--accent)] hover:text-[var(--accent-2)] font-medium">
                          Open <span className="text-xs">→</span>
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="pt-4 border-t border-[var(--border)]">
                <Field
                  label="Timezone"
                  mode={mode}
                  value={mode === "view" ? (profile?.timezone || "Asia/Kolkata") : form.timezone}
                  onChange={(v) => onChange("timezone", v)}
                  placeholder="e.g., Asia/Kolkata"
                />
              </div>
            </Card>

            {/* Preferences (new rows + wider toggle) */}
            <Card title="Preferences" desc="Choose on-site reminders you want to see." icon="⚙️">
              <PrefToggleRow
                label="Announcements & product updates"
                checked={mode==="view" ? !!profile?.notifyAnnouncements : form.notifyAnnouncements}
                mode={mode}
                onChange={(v)=>onChange("notifyAnnouncements", v)}
              />
              <PrefToggleRow
                label="Subscription renewal reminders"
                checked={mode==="view" ? !!profile?.notifyRenewals : form.notifyRenewals}
                mode={mode}
                onChange={(v)=>onChange("notifyRenewals", v)}
              />
            </Card>
          </aside>
        </div>
      </div>

      {/* Avatar Modal */}
      {avatarModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setAvatarModalOpen(false)}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>
          <div
            className="relative bg-[var(--card)] rounded-3xl shadow-2xl border border-[var(--border)] p-8 max-w-2xl w-full animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-2xl font-bold">Choose your avatar</h3>
                <p className="text-[var(--muted)] mt-1">Pick an avatar that represents you best</p>
              </div>
              <button
                onClick={() => setAvatarModalOpen(false)}
                className="w-10 h-10 rounded-xl bg-[var(--card-2)] hover:bg-[var(--hover)] flex items-center justify-center transition-all hover:scale-110"
              >
                ✕
              </button>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
              {avatarKeys.map((k) => {
                const src = AVATAR_MAP[k as keyof typeof AVATAR_MAP] || AVATAR_MAP.sienna;
                const selected = (mode === "edit" ? form.avatarKey : profile?.avatarKey) === k;
                return (
                  <button
                    key={k}
                    type="button"
                    onClick={() => chooseAvatar(k)}
                    className={`relative rounded-2xl p-3 border-2 transition-all hover:scale-105 ${
                      selected
                        ? 'border-[var(--accent)] bg-[var(--accent)]/10 ring-2 ring-[var(--accent)]/30'
                        : 'border-[var(--border)] hover:border-[var(--accent)]/50'
                    }`}
                    title={k}
                  >
                    <img src={src} alt={k} className="w-full aspect-square object-contain rounded-xl bg-white/90" />
                    <div className="text-center text-sm mt-2 font-medium capitalize">{k}</div>
                    {selected && (
                      <div className="absolute -top-1 -right-1 w-6 h-6 bg-[var(--accent)] text-white rounded-full flex items-center justify-center text-xs font-bold">
                        ✓
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/** ---------- Reusable UI ---------- **/
function Card({ title, desc, children, icon }: { title?: string; desc?: string; children: React.ReactNode; icon?: string }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm hover:shadow-md transition-all">
      {(title || desc || icon) && (
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            {icon && <span className="text-2xl">{icon}</span>}
            {title && <h3 className="text-xl font-semibold">{title}</h3>}
          </div>
          {desc && <p className="text-sm text-[var(--muted)] leading-relaxed">{desc}</p>}
        </div>
      )}
      {children}
    </div>
  );
}

function Field({
  label, value, onChange, placeholder, mode, type = "text",
}: {
  label: string; value: string; onChange?: (v: string) => void; placeholder?: string; mode: "view" | "edit"; type?: string;
}) {
  if (mode === "view") {
    return (
      <div className="group">
        <div className="text-sm font-medium text-[var(--muted)] mb-2">{label}</div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card-2)] px-4 py-3 group-hover:bg-[var(--hover)] transition-all">
          {value || <span className="text-[var(--muted)] italic">Not specified</span>}
        </div>
      </div>
    );
  }
  return (
    <div>
      <label className="text-sm font-medium text-[var(--muted)] block mb-2">{label}</label>
      <input
        type={type}
        className="w-full rounded-xl border border-[var(--border)] bg-[var(--card-2)] px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30 focus:border-[var(--accent)] transition-all"
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}

function SelectField({
  label, value, onChange, mode, options,
}: { label: string; value: string; onChange?: (v: string) => void; mode: "view" | "edit"; options: string[]; }) {
  if (mode === "view") return <Field label={label} value={value} mode="view" />;
  return (
    <div>
      <label className="text-sm font-medium text-[var(--muted)] block mb-2">{label}</label>
      <select
        className="w-full rounded-xl border border-[var(--border)] bg-[var(--card-2)] px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30 focus:border-[var(--accent)] transition-all"
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
      >
        <option value="">Select…</option>
        {options.map((opt) => (<option key={opt} value={opt}>{opt}</option>))}
      </select>
    </div>
  );
}

function ChipField({
  label, mode, options, value, onToggle,
}: { label: string; mode: "view" | "edit"; options: string[]; value: string[]; onToggle: (name: string) => void; }) {
  return (
    <div>
      <div className="text-sm font-medium text-[var(--muted)] mb-3">{label}</div>
      {mode === "view" ? (
        <div className="flex flex-wrap gap-2">
          {value?.length ? (
            value.map((v) => (
              <span key={v} className="px-3 py-1.5 bg-[var(--chip)] text-[var(--accent)] rounded-full text-sm font-medium border border-[var(--accent)]/20">
                {v}
              </span>
            ))
          ) : (
            <span className="text-[var(--muted)] italic">None selected</span>
          )}
        </div>
      ) : (
        <div className="flex flex-wrap gap-3">
          {options.map((opt) => {
            const selected = value.includes(opt);
            return (
              <button
                key={opt}
                type="button"
                onClick={() => onToggle(opt)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all transform hover:scale-105 ${
                  selected
                    ? 'bg-gradient-to-r from-[var(--accent)] to-[var(--accent-2)] text-white shadow-md'
                    : 'bg-[var(--card-2)] text-[var(--fg)] border border-[var(--border)] hover:bg-[var(--hover)] hover:border-[var(--accent)]/50'
                }`}
              >
                {opt}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* Preferences row component */
function PrefToggleRow({
  label, checked, onChange, mode,
}: { label: string; checked: boolean; onChange?: (v: boolean) => void; mode: "view" | "edit"; }) {
  return (
    <div className="pref-row">
      <div className="pref-label">{label}</div>
      {mode === "view" ? (
        <div className={`switch ${checked ? "on" : ""}`}><div className="knob" /></div>
      ) : (
        <button
          type="button"
          onClick={() => onChange?.(!checked)}
          className={`switch ${checked ? "on" : ""}`}
          role="switch"
          aria-checked={checked}
          aria-label={label}
          title={label}
        >
          <div className="knob" />
        </button>
      )}
    </div>
  );
}

function Stat({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 group">
      <div className="w-10 h-10 bg-[var(--card-2)] rounded-xl flex items-center justify-center group-hover:bg-[var(--hover)] transition-all">
        <span className="text-lg">{icon}</span>
      </div>
      <div>
        <div className="text-sm text-[var(--muted)]">{label}</div>
        <div className="font-semibold">{value}</div>
      </div>
    </div>
  );
}

function ActionBtn({
  children, onClick, primary, disabled,
}: { children: React.ReactNode; onClick?: () => void; primary?: boolean; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`h-12 rounded-xl px-6 border text-center font-medium transition-all transform hover:scale-105 disabled:transform-none ${
        primary
          ? "bg-gradient-to-r from-[var(--accent)] to-[var(--accent-2)] text-white shadow-lg hover:shadow-xl"
          : "bg-[var(--card)] border-[var(--border)] hover:bg-[var(--hover)]"
      }`}
      style={{ minWidth: 140, opacity: disabled ? 0.6 : 1 }}
    >
      {children}
    </button>
  );
}
