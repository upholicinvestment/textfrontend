import { useEffect, useMemo, useState } from "react";
import {
  FiShield, FiUsers, FiBox, FiRefreshCw, FiSearch, FiClock,
  FiX, FiSun, FiMoon, FiDownload, FiExternalLink, FiBriefcase, FiFileText,
  FiUser, FiMail, FiPhone, FiMapPin, FiCalendar, FiAlertTriangle
} from "react-icons/fi";
import { Link, useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "https://api.upholictech.com/api";
const ROWS = 5;

// Expired/scan tunables
const EXPIRED_SCAN_PAGE_SIZE = 100;
const EXPIRED_SCAN_MAX_USERS = 1000;
const CLOCK_SKEW_MS = 30 * 1000;

/* ------------ Types ------------ */
type Overview = { users: number; activeSubs: number; products: number };
type UserRow = {
  _id: string;
  name?: string;
  email?: string;
  phone?: string;
  role?: string;
  purchases?: Array<{
    _id: string;
    productId: string;
    productKey?: string;
    productName?: string;
    status: string;
    startedAt?: string;
    endsAt?: string;
  }>;
};
type UsersResp = { items: UserRow[]; page: number; pageSize: number; total: number };

type RenewalRow = {
  _id: string;
  endsAt: string;
  status: string;
  user: { _id: string; email?: string; name?: string; phone?: string };
  product: { _id: string; key: string; name: string };
};

type ExpiredRow = {
  _id: string; // userId:slug
  endsAt?: string;
  status?: string;
  user: { _id: string; email?: string; name?: string; phone?: string };
  product: { _id: string; key?: string; name: string };
};

type CareerApp = {
  _id: string;
  jobId?: string;
  name?: string;
  email?: string;
  phone?: string;
  expYears?: number | string | null;
  currentLocation?: string | null;
  createdAt?: string;
  resumeFileId?: string;
  resumeFilename?: string;
};

type CareerResume = {
  _id: string;
  name?: string;
  email?: string;
  phone?: string;
  createdAt?: string;
  resumeFileId?: string;
  resumeFilename?: string;
};

type Paged<T> = { items: T[]; page: number; pageSize: number; total: number };

/* ------------ Helpers ------------ */
function useToken() {
  return (typeof window !== "undefined" && localStorage.getItem("token")) || "";
}

function useRole(): string | null {
  const [role, setRole] = useState<string | null>(null);
  useEffect(() => {
    (async () => {
      let localRole = "";
      try {
        const userRaw = localStorage.getItem("user");
        const user = userRaw ? JSON.parse(userRaw) : null;
        localRole = String(user?.role || "").toLowerCase();
      } catch {}
      if (localRole === "admin" || localRole === "superuser") {
        setRole(localRole);
        return;
      }
      const token = localStorage.getItem("token");
      if (!token) {
        setRole(localRole || "customer");
        return;
      }
      try {
        const res = await fetch(`${API_BASE}/users/me`, { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) {
          const me = await res.json();
          const r = String(me?.role || localRole || "customer").toLowerCase();
          setRole(r);
        } else setRole(localRole || "customer");
      } catch {
        setRole(localRole || "customer");
      }
    })();
  }, []);
  return role;
}

function cls(theme: "dark" | "light", a: string, b: string) { return theme === "dark" ? a : b; }
function fmtDate(d?: string) { return d ? new Date(d).toLocaleString() : "-"; }
function endMs(endsAt?: string) { const ms = endsAt ? Date.parse(endsAt) : NaN; return Number.isFinite(ms) ? ms : NaN; }

// Display-first canonical label + slug (merges by what users see)
function productLabel(p: { productName?: string; productKey?: string; productId?: string }) {
  return (p.productName || p.productKey || p.productId || "Product").trim();
}
function productSlug(s: string) {
  return String(s).toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}
function purchaseSlug(p: { productName?: string; productKey?: string; productId?: string }) {
  const label = productLabel(p);
  return productSlug(label);
}

/** Collapse multiple cycles of the same product to the latest one; derive status from time. */
function foldPurchases<T extends { endsAt?: string; status?: string; productName?: string; productKey?: string; productId?: string }>(purchases: T[]) {
  const by: Record<string, T[]> = {};
  (purchases || []).forEach((p) => {
    const k = purchaseSlug(p);
    (by[k] ||= []).push(p);
  });
  const now = Date.now();
  return Object.values(by).map((arr) => {
    arr.sort((a, b) => (endMs(b.endsAt) || 0) - (endMs(a.endsAt) || 0));
    const latest = arr[0];
    const ms = endMs(latest.endsAt);
    const isActiveByTime = Number.isFinite(ms) && ms > now - CLOCK_SKEW_MS;
    return { ...latest, status: isActiveByTime ? "active" : "expired" };
  });
}

/* ============= Component ============= */
export default function AdminDashboard() {
  const token = useToken();
  const role = useRole();
  const isAdmin = role === "admin" || role === "superuser";
  const navigate = useNavigate();

  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => { if (role !== null && !isAdmin) navigate("/"); }, [role, isAdmin, navigate]);

  const hdrs = useMemo(() => ({ Authorization: `Bearer ${token}`, "Content-Type": "application/json" }), [token]);

  /* ---- Overview ---- */
  const [overview, setOverview] = useState<Overview | null>(null);
  const [loadingOverview, setLoadingOverview] = useState(true);
  useEffect(() => {
    if (!isAdmin) return;
    setLoadingOverview(true);
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/admin/overview`, { headers: hdrs });
        const data = await res.json();
        setOverview(data);
      } catch {}
      setLoadingOverview(false);
    })();
  }, [isAdmin, hdrs]);

  /* ---- Users ---- */
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [usersResp, setUsersResp] = useState<UsersResp | null>(null);
  const [loadingUsers, setLoadingUsers] = useState(true);

  useEffect(() => {
    if (!isAdmin) return;
    setLoadingUsers(true);
    const params = new URLSearchParams({ page: String(page), pageSize: String(ROWS), ...(q ? { q } : {}) });
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/admin/users?${params.toString()}`, { headers: hdrs });
        const data = (await res.json()) as UsersResp;
        setUsersResp(data);
      } catch {}
      setLoadingUsers(false);
    })();
  }, [isAdmin, hdrs, page, q]);

  /* ---- Renewals ---- */
  const [days, setDays] = useState(14);
  const [renewals, setRenewals] = useState<RenewalRow[]>([]);
  const [loadingRenewals, setLoadingRenewals] = useState(true);
  const [renewalsPage, setRenewalsPage] = useState(1);

  useEffect(() => {
    if (!isAdmin) return;
    setLoadingRenewals(true);
    setRenewalsPage(1);
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/admin/renewals?days=${days}`, { headers: hdrs });
        const data = await res.json();
        setRenewals(data?.items || []);
      } catch {}
      setLoadingRenewals(false);
    })();
  }, [isAdmin, hdrs, days]);

  const visibleRenewals = renewals.slice((renewalsPage - 1) * ROWS, renewalsPage * ROWS);
  const moreRenewals = renewalsPage * ROWS < renewals.length;
  const hasPrevRenewals = renewalsPage > 1;

  /* ---- Expired (Unrenewed) ---- */
  const [expiredDays, setExpiredDays] = useState(10);
  const [expired, setExpired] = useState<ExpiredRow[]>([]);
  const [loadingExpired, setLoadingExpired] = useState(true);
  const [expiredPage, setExpiredPage] = useState(1);
  const [expiredReloadKey, setExpiredReloadKey] = useState(0);
  const [expiredSource, setExpiredSource] = useState<"api" | "scan">("api");

  // Build a lookup of userId:slug that have any future cycle
  async function buildActiveLookup(): Promise<Set<string>> {
    const now = Date.now();
    const active = new Set<string>();
    let page = 1, pageSize = EXPIRED_SCAN_PAGE_SIZE, total = Infinity, scanned = 0;
    while (scanned < EXPIRED_SCAN_MAX_USERS && (page - 1) * pageSize < total) {
      const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
      const res = await fetch(`${API_BASE}/admin/users?${params.toString()}`, { headers: hdrs });
      if (!res.ok) break;
      const data = (await res.json()) as UsersResp;
      const items = data?.items || [];
      total = data?.total ?? items.length;
      pageSize = data?.pageSize || pageSize;

      for (const u of items) {
        (u.purchases || []).forEach((p) => {
          if (endMs(p.endsAt) > now - CLOCK_SKEW_MS) {
            active.add(`${u._id}:${purchaseSlug(p)}`);
          }
        });
      }
      scanned += items.length;
      page += 1;
      if (!items.length) break;
    }
    return active;
  }

  async function computeExpiredFromUsers(daysWindow: number): Promise<ExpiredRow[]> {
    const now = Date.now();
    const minMs = now - daysWindow * 24 * 60 * 60 * 1000;
    const out: Record<string, ExpiredRow> = {};

    let page = 1, pageSize = EXPIRED_SCAN_PAGE_SIZE, total = Infinity, processed = 0;

    while (processed < EXPIRED_SCAN_MAX_USERS && (page - 1) * pageSize < total) {
      const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
      const res = await fetch(`${API_BASE}/admin/users?${params.toString()}`, { headers: hdrs });
      if (!res.ok) break;
      const data = (await res.json()) as UsersResp;
      const items = data?.items || [];
      total = data?.total ?? items.length;
      pageSize = data?.pageSize || pageSize;

      for (const u of items) {
        const by: Record<string, NonNullable<UserRow["purchases"]>> = {};
        (u.purchases || []).forEach((p) => {
          const k = purchaseSlug(p);
          (by[k] ||= []).push(p);
        });

        for (const [slug, arr] of Object.entries(by)) {
          const hasFuture = arr.some((p) => endMs(p.endsAt) > now - CLOCK_SKEW_MS);
          if (hasFuture) continue; // renewed or still active → skip

          arr.sort((a, b) => (endMs(b.endsAt) || 0) - (endMs(a.endsAt) || 0));
          const latest = arr[0];
          const eMs = endMs(latest?.endsAt);
          if (!Number.isFinite(eMs)) continue;
          if (eMs < now && eMs >= minMs) {
            const rowId = `${u._id}:${slug}`;
            out[rowId] = {
              _id: rowId,
              endsAt: latest.endsAt,
              status: "expired",
              user: { _id: u._id, name: u.name, email: u.email, phone: u.phone },
              product: { _id: latest.productId || slug, key: slug, name: productLabel(latest) },
            };
          }
        }
      }

      processed += items.length;
      page += 1;
      if (!items.length) break;
    }

    return Object.values(out).sort((a, b) => endMs(b.endsAt) - endMs(a.endsAt));
  }

  useEffect(() => {
    if (!isAdmin) return;
    setLoadingExpired(true);
    setExpiredPage(1);
    (async () => {
      try {
        // prefer API if it exists, but validate against active purchases so renewals vanish
        let res = await fetch(`${API_BASE}/admin/expired?days=${expiredDays}&unrenewed=1`, { headers: hdrs });
        if (!res.ok) {
          res = await fetch(`${API_BASE}/admin/renewals?expired=1&unrenewed=1&days=${expiredDays}`, { headers: hdrs });
        }
        let data: any = {};
        try { data = await res.json(); } catch {}
        const raw: ExpiredRow[] = (data?.items || data || []) as ExpiredRow[];

        const activeLookup = await buildActiveLookup();
        const filtered = (raw || []).filter((r) => {
          const slug = productSlug(r?.product?.name || r?.product?.key || "");
          return !activeLookup.has(`${r?.user?._id}:${slug}`);
        });

        if (filtered.length > 0) {
          setExpired(filtered);
          setExpiredSource("api");
        } else {
          const computed = await computeExpiredFromUsers(expiredDays);
          setExpired(computed);
          setExpiredSource("scan");
        }
      } catch {
        const computed = await computeExpiredFromUsers(expiredDays);
        setExpired(computed);
        setExpiredSource("scan");
      }
      setLoadingExpired(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, hdrs, expiredDays, expiredReloadKey]);

  const visibleExpired = expired.slice((expiredPage - 1) * ROWS, expiredPage * ROWS);
  const moreExpired = expiredPage * ROWS < expired.length;
  const hasPrevExpired = expiredPage > 1;

  /* ---- Careers (Applications + Resumes) ---- */
  const [careerTab, setCareerTab] = useState<"applications" | "resumes">("applications");

  // Applications
  const [apps, setApps] = useState<Paged<CareerApp> | null>(null);
  const [appsPage, setAppsPage] = useState(1);
  const [appsQ, setAppsQ] = useState("");
  const [loadingApps, setLoadingApps] = useState(false);

  // Resumes
  const [resumes, setResumes] = useState<Paged<CareerResume> | null>(null);
  const [resumesPage, setResumesPage] = useState(1);
  const [resumesQ, setResumesQ] = useState("");
  const [loadingResumes, setLoadingResumes] = useState(false);

  useEffect(() => {
    if (!isAdmin) return;
    setLoadingApps(true);
    const params = new URLSearchParams({ page: String(appsPage), pageSize: String(ROWS), ...(appsQ ? { q: appsQ } : {}) });
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/careers/admin/applications?${params.toString()}`, { headers: hdrs });
        const data = await res.json();
        setApps(data);
      } catch {}
      setLoadingApps(false);
    })();
  }, [isAdmin, hdrs, appsPage, appsQ]);

  useEffect(() => {
    if (!isAdmin) return;
    setLoadingResumes(true);
    const params = new URLSearchParams({ page: String(resumesPage), pageSize: String(ROWS), ...(resumesQ ? { q: resumesQ } : {}) });
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/careers/admin/resumes?${params.toString()}`, { headers: hdrs });
        const data = await res.json();
        setResumes(data);
      } catch {}
      setLoadingResumes(false);
    })();
  }, [isAdmin, hdrs, resumesPage, resumesQ]);

  // resume blob helpers
  async function fetchResumeBlob(collection: "career_applications" | "career_resume", fileId: string) {
    const res = await fetch(`${API_BASE}/careers/admin/resume/${collection}/${fileId}`, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) throw new Error("Resume not found");
    return await res.blob();
  }
  async function handleViewResume(collection: "career_applications" | "career_resume", fileId?: string) {
    if (!fileId) return;
    try {
      const blob = await fetchResumeBlob(collection, fileId);
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener,noreferrer");
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch { alert("Unable to open resume."); }
  }
  async function handleDownloadResume(collection: "career_applications" | "career_resume", fileId?: string, filename?: string) {
    if (!fileId) return;
    try {
      const blob = await fetchResumeBlob(collection, fileId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = filename || "resume.pdf";
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
    } catch { alert("Unable to download resume."); }
  }

  if (role === null) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="rounded-xl border border-white/10 p-6 bg-[#0e102b]/80 text-white/70">Checking permissions…</div>
      </div>
    );
  }
  if (!isAdmin) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="rounded-xl border border-white/10 p-6 bg-[#0e102b]/80">
          <p className="text-white/80">You are not authorized to view this page.</p>
          <Link to="/" className="text-indigo-300 underline mt-2 inline-block">Go Home</Link>
        </div>
      </div>
    );
  }

  /* ---- Theme ---- */
  const bg = cls(theme, "bg-[#0a0b2a]", "bg-[#f7f8fb]");
  const text = cls(theme, "text-white", "text-[#0b0d19]");
  const subtext = cls(theme, "text-white/60", "text-[#0b0d19]/70");
  const panel = cls(theme, "bg-[#0f1233]/90", "bg-white");
  const border = cls(theme, "border-white/10", "border-black/10");
  const faint = cls(theme, "text-white/40", "text-black/40");
  const hoverPanel = cls(theme, "hover:bg-white/5", "hover:bg-black/[0.03]"); // keep same result in both themes
  const inputBg = cls(theme, "bg-white/5", "bg-black/[0.04]");
  const divider = cls(theme, "border-white/10", "border-black/10");
  const rowBorder = cls(theme, "border-white/5", "border-black/10");
  const subtleBadgeBg = cls(theme, "bg-purple-500/15", "bg-purple-500/10");
  const subtleBadgeText = cls(theme, "text-purple-300", "text-purple-600");
  const experienceBadge = cls(theme, "bg-blue-500/20 text-blue-300", "bg-blue-500/15 text-blue-600");

  // Button class helpers (make enabled buttons full-opacity)
  const btnSm = (enabled: boolean) =>
    `px-3 py-1.5 rounded border text-sm ${border} ${
      enabled ? `${hoverPanel} ${text}` : `${text} opacity-40 cursor-not-allowed`
    }`;

  const btnMd = (enabled: boolean) =>
    `px-4 py-2 rounded-lg border text-sm font-medium ${border} ${
      enabled ? `${hoverPanel} ${text} hover:scale-105` : `${text} opacity-40 cursor-not-allowed`
    }`;

  const usersHasMore = (usersResp?.page || 1) * (usersResp?.pageSize || ROWS) < (usersResp?.total || 0);
  const usersHasPrev = (usersResp?.page || 1) > 1;

  const appsHasMore = (apps?.page || 1) * (apps?.pageSize || ROWS) < (apps?.total || 0);
  const appsHasPrev = (apps?.page || 1) > 1;

  const resumesHasMore = (resumes?.page || 1) * (resumes?.pageSize || ROWS) < (resumes?.total || 0);
  const resumesHasPrev = (resumes?.page || 1) > 1;

  return (
    <div className={`${bg} min-h-[100vh]`}>
      {/* Top bar */}
      <div className="max-w-7xl mx-auto px-4 pt-6 pb-2 relative">
        <div className="absolute right-4 top-6 flex items-center gap-2">
          <button onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))} className={`rounded-full p-2 border ${border} ${hoverPanel} transition`} aria-label="Toggle theme" title="Toggle theme">
            {theme === "dark" ? <FiSun className={subtext} /> : <FiMoon className={subtext} />}
          </button>
          <button onClick={() => navigate("/")} className={`rounded-full p-2 border ${border} ${hoverPanel} transition`} aria-label="Close" title="Close">
            <FiX className={subtext} />
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pr-24">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${subtleBadgeBg} ${border} border ${subtleBadgeText}`}><FiShield size={18} /></div>
            <h1 className={`text-2xl md:text-3xl font-semibold ${text}`}>Admin Dashboard</h1>
          </div>
          <div className="text-right">
            <div className={`text-xs ${subtext}`}>Role</div>
            <div className={`text-sm ${text} capitalize`}>{role}</div>
          </div>
        </div>
        <p className={`mt-2 ${subtext}`}>Overview, users, renewals, expired, careers.</p>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* KPI */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {[
            { label: "Users", icon: <FiUsers className={subtext} />, value: loadingOverview ? "…" : overview?.users ?? "-" },
            { label: "Active Subs", icon: <FiRefreshCw className={subtext} />, value: loadingOverview ? "…" : overview?.activeSubs ?? "-" },
            { label: "Products", icon: <FiBox className={subtext} />, value: loadingOverview ? "…" : overview?.products ?? "-" },
          ].map((k) => (
            <div key={k.label} className={`rounded-xl border ${border} ${panel} p-5`}>
              <div className="flex items-center justify-between"><div className={`${text}/80`}>{k.label}</div>{k.icon}</div>
              <div className={`text-3xl mt-2 ${text}`}>{k.value}</div>
            </div>
          ))}
        </div>

        {/* Users */}
        <div className={`rounded-xl border ${border} ${panel}`}>
          <div className={`px-5 py-4 border-b ${divider} flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between`}>
            <div className={`flex items-center gap-2 ${text}/80`}><FiUsers /><span>Users</span></div>
            <div className="w-full sm:w-auto">
              <div className={`flex items-center gap-2 ${inputBg} rounded-lg px-3 py-2 border ${border} w-full sm:w-[22rem] md:w-[28rem] lg:w-[34rem] max-w-full`}>
                <FiSearch className={faint} />
                <input value={q} onChange={(e) => { setPage(1); setQ(e.target.value); }} placeholder="Search by name, email, phone" className={`w-full min-w-0 bg-transparent text-sm outline-none ${text} placeholder:${faint}`} />
              </div>
            </div>
          </div>

          <div className="p-4 overflow-x-auto">
            <table className="min-w-full text-sm border-collapse">
              <thead>
                <tr className={`${subtext} border-b ${divider}`}>
                  <th className={`py-2 px-3 border-r ${divider} text-center`}>User</th>
                  <th className={`py-2 px-3 border-r ${divider} text-center`}>Role</th>
                  <th className="py-2 px-3 text-center">Purchases</th>
                </tr>
              </thead>
              <tbody>
                {loadingUsers ? (
                  <tr><td className="py-6 px-3 text-center" colSpan={3}><span className={subtext}>Loading…</span></td></tr>
                ) : (usersResp?.items || []).length === 0 ? (
                  <tr><td className="py-6 px-3 text-center" colSpan={3}><span className={subtext}>No users found.</span></td></tr>
                ) : (
                  usersResp!.items.map((u) => (
                    <tr key={u._id} className={`border-b ${rowBorder}`}>
                      <td className={`py-3 px-3 align-top border-r ${divider}`}>
                        <div className={text}>{u.name || u.email || u.phone || u._id}</div>
                        <div className={subtext}>{u.email || "-"}</div>
                        {u.phone ? <div className={`${faint} text-xs`}>{u.phone}</div> : null}
                      </td>
                      <td className={`py-3 px-3 align-top border-r ${divider} text-center`}>
                        <span className={`capitalize ${text}/80`}>{u.role || "customer"}</span>
                      </td>
                      <td className="py-3 px-3">
                        {(u.purchases || []).length === 0 ? (
                          <div className="text-center"><span className={subtext}>—</span></div>
                        ) : (
                          <ul className="space-y-1">
                            {foldPurchases(u.purchases || []).map((p: any) => (
                              <li key={`${purchaseSlug(p)}:${p.endsAt || "na"}`} className={`${text}/80`}>
                                <span className="font-medium">{productLabel(p)}</span>{" "}
                                <span className={subtext}>({p.status})</span>{" "}
                                <span className={`${faint} text-xs`}>ends: {fmtDate(p.endsAt)}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            <div className="flex items-center justify-end gap-2 mt-4">
              <button disabled={!usersHasPrev} onClick={() => setPage((p) => Math.max(1, p - 1))} className={btnSm(usersHasPrev)}>← Prev</button>
              <button disabled={!usersHasMore} onClick={() => setPage((p) => p + 1)} className={btnSm(usersHasMore)}>Next →</button>
            </div>
          </div>
        </div>

        {/* Renewals */}
        <div className={`rounded-xl border ${border} ${panel} mt-8`}>
          <div className={`px-5 py-4 border-b ${divider} flex items-center justify-between`}>
            <div className={`flex items-center gap-2 ${text}/80`}><FiClock /><span>Upcoming Renewals</span></div>
            <div className="flex items-center gap-2 text-sm">
              <span className={subtext}>Days:</span>
              <input type="number" min={1} value={days} onChange={(e) => setDays(parseInt(e.target.value || "1", 10))} className={`w-20 ${inputBg} border ${border} rounded-lg px-3 py-1.5 text-sm ${text} outline-none`} />
            </div>
          </div>
          <div className="p-5 overflow-x-auto">
            {loadingRenewals ? (
              <div className={subtext}>Loading…</div>
            ) : renewals.length === 0 ? (
              <div className={subtext}>No renewals within {days} day(s).</div>
            ) : (
              <>
                <table className="min-w-full text-sm border-collapse">
                  <thead>
                    <tr className={`${subtext} border-b ${divider}`}>
                      <th className={`py-2 px-3 border-r ${divider} text-center`}>User</th>
                      <th className={`py-2 px-3 border-r ${divider} text-center`}>Product</th>
                      <th className="py-2 px-3 text-center">Ends At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleRenewals.map((r) => (
                      <tr key={r._id} className={`border-b ${rowBorder}`}>
                        <td className={`py-3 px-3 border-r ${divider}`}>
                          <div className={text}>{r.user.name || r.user.email || r.user.phone || r.user._id}</div>
                          <div className={subtext}>{r.user.email}</div>
                        </td>
                        <td className={`py-3 px-3 border-r ${divider}`}>
                          <div className={text}>{r.product.name}</div>
                          <div className={`${faint} text-xs`}>{r.product.key}</div>
                        </td>
                        <td className="py-3 px-3 text-center"><div className={text}>{fmtDate(r.endsAt)}</div></td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="flex items-center justify-end gap-2 mt-4">
                  <button disabled={!hasPrevRenewals} onClick={() => setRenewalsPage((p) => Math.max(1, p - 1))} className={btnSm(hasPrevRenewals)}>← Prev</button>
                  <button disabled={!moreRenewals} onClick={() => setRenewalsPage((p) => p + 1)} className={btnSm(moreRenewals)}>Next →</button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Expired (Unrenewed) */}
        <div className={`rounded-xl border ${border} ${panel} mt-8`}>
          <div className={`px-5 py-4 border-b ${divider} flex items-center justify-between`}>
            <div className={`flex items-center gap-2 ${text}/80`}>
              <FiAlertTriangle /><span>Expired (Unrenewed)</span>
              <span className={`ml-2 text-xs ${subtext}`}>source: {expiredSource}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className={subtext}>Days:</span>
              <input type="number" min={1} value={expiredDays} onChange={(e) => setExpiredDays(parseInt(e.target.value || "1", 10))} className={`w-20 ${inputBg} border ${border} rounded-lg px-3 py-1.5 text-sm ${text} outline-none`} />
              <button onClick={() => setExpiredReloadKey((k) => k + 1)} className={`ml-2 ${btnSm(true)}`} title="Reload">Refresh</button>
            </div>
          </div>
          <div className="p-5 overflow-x-auto">
            {loadingExpired ? (
              <div className={subtext}>Loading…</div>
            ) : expired.length === 0 ? (
              <div className={subtext}>No expired, unrenewed subscriptions in the last {expiredDays} day(s).</div>
            ) : (
              <>
                <table className="min-w-full text-sm border-collapse">
                  <thead>
                    <tr className={`${subtext} border-b ${divider}`}>
                      <th className={`py-2 px-3 border-r ${divider} text-center`}>User</th>
                      <th className={`py-2 px-3 border-r ${divider} text-center`}>Product</th>
                      <th className={`py-2 px-3 border-r ${divider} text-center`}>Status</th>
                      <th className="py-2 px-3 text-center">Expired On</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleExpired.map((r) => (
                      <tr key={r._id} className={`border-b ${rowBorder}`}>
                        <td className={`py-3 px-3 border-r ${divider}`}>
                          <div className={text}>{r.user.name || r.user.email || r.user.phone || r.user._id}</div>
                          <div className={subtext}>{r.user.email || "-"}</div>
                        </td>
                        <td className={`py-3 px-3 border-r ${divider}`}>
                          <div className={text}>{r.product.name}</div>
                          <div className={`${faint} text-xs`}>{r.product.key || "-"}</div>
                        </td>
                        <td className={`py-3 px-3 border-r ${divider} text-center`}>
                          <span className={`${text}/80 capitalize`}>{r.status || "expired"}</span>
                        </td>
                        <td className="py-3 px-3 text-center"><div className={text}>{fmtDate(r.endsAt)}</div></td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="flex items-center justify-end gap-2 mt-4">
                  <button disabled={!hasPrevExpired} onClick={() => setExpiredPage((p) => Math.max(1, p - 1))} className={btnSm(hasPrevExpired)}>← Prev</button>
                  <button disabled={!moreExpired} onClick={() => setExpiredPage((p) => p + 1)} className={btnSm(moreExpired)}>Next →</button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* --- Careers (Applications & Resumes) --- */}
        <div className={`rounded-xl border ${border} ${panel} mt-8 overflow-hidden`}>
          {/* Header */}
          <div className={`px-5 py-4 border-b ${divider} flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4`}>
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${subtleBadgeBg} ${subtleBadgeText} border ${border}`}>
                <FiBriefcase size={18} />
              </div>
              <div>
                <div className={`${text} font-semibold text-lg`}>Career Center</div>
                <div className={`${subtext} text-sm`}>Review applications and resumes</div>
              </div>
            </div>

            {/* Tabs */}
            <div className={`flex items-center gap-2 ${theme === "dark" ? "bg-white/5" : "bg-black/[0.04]"} rounded-xl p-1 border ${border} self-start`}>
              <button
                onClick={() => setCareerTab("applications")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  careerTab === "applications" ? "bg-purple-500 text-white shadow-sm" : `${subtext} ${hoverPanel}`
                }`}
              >
                Applications
              </button>
              <button
                onClick={() => setCareerTab("resumes")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  careerTab === "resumes" ? "bg-purple-500 text-white shadow-sm" : `${subtext} ${hoverPanel}`
                }`}
              >
                Resumes
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className={`px-5 py-4 border-b ${divider}`}>
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="w-full sm:flex-1 max-w-2xl">
                <div className={`flex items-center gap-3 ${inputBg} rounded-xl px-4 py-3 border ${border} transition-all duration-200 focus-within:ring-2 focus-within:ring-purple-500/30`}>
                  <FiSearch className={`${faint} flex-shrink-0`} />
                  {careerTab === "applications" ? (
                    <input
                      value={appsQ}
                      onChange={(e) => { setAppsPage(1); setAppsQ(e.target.value); }}
                      placeholder="Search by name, email, phone, or job ID..."
                      className={`flex-1 bg-transparent text-sm outline-none ${text} placeholder:${faint} w-full`}
                    />
                  ) : (
                    <input
                      value={resumesQ}
                      onChange={(e) => { setResumesPage(1); setResumesQ(e.target.value); }}
                      placeholder="Search by name, email, or phone..."
                      className={`flex-1 bg-transparent text-sm outline-none ${text} placeholder:${faint} w-full`}
                    />
                  )}
                </div>
              </div>
              
              <div className={`flex items-center gap-3 ${subtext} text-sm ${theme === "dark" ? "bg-black/10" : "bg-black/[0.04]"} rounded-lg px-3 py-2 border ${border} self-stretch sm:self-auto`}>
                <FiFileText className="flex-shrink-0" />
                <span className="hidden sm:inline">
                  {careerTab === "applications" ? "career_applications" : "career_resume"}
                </span>
                <span className="sm:hidden">
                  {careerTab === "applications" ? "applications" : "resumes"}
                </span>
              </div>
            </div>
          </div>

          {/* Applications Table */}
          {careerTab === "applications" ? (
            <div className="p-5 overflow-x-auto">
              <table className="min-w-full text-sm border-collapse">
                <thead>
                  <tr className={`${subtext} border-b ${divider}`}>
                    <th className={`py-3 px-4 border-r ${divider} text-center`}>Applicant</th>
                    <th className={`py-3 px-4 border-r ${divider} text-center`}>Job ID</th>
                    <th className={`py-3 px-4 border-r ${divider} text-center`}>Experience</th>
                    <th className={`py-3 px-4 border-r ${divider} text-center`}>Created</th>
                    <th className="py-3 px-4 text-center">Resume</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingApps ? (
                    <tr>
                      <td className="py-8 px-4 text-center" colSpan={5}>
                        <div className={`${subtext} flex items-center justify-center gap-2`}>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-500"></div>
                          Loading applications...
                        </div>
                      </td>
                    </tr>
                  ) : !apps?.items?.length ? (
                    <tr>
                      <td className="py-8 px-4 text-center" colSpan={5}>
                        <div className={`${subtext} flex flex-col items-center gap-2`}>
                          <FiBriefcase className="text-2xl opacity-50" />
                          <span>No applications found</span>
                        </div>
                      </td>
                    </tr>
                  ) : apps.items.map((a) => (
                    <tr key={a._id} className={`border-b ${rowBorder} group hover:bg-white/5 transition-colors`}>
                      <td className={`py-4 px-4 border-r ${divider}`}>
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg ${subtleBadgeBg} ${subtleBadgeText}`}>
                            <FiUser size={14} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className={`${text} text-left font-medium truncate`}>
                              {a.name || "Unnamed Applicant"}
                            </div>
                            <div className="flex flex-col gap-1 mt-1">
                              {a.email && (
                                <div className="flex items-center gap-2 text-xs">
                                  <FiMail className={faint} size={12} />
                                  <span className={subtext}>{a.email}</span>
                                </div>
                              )}
                              {a.phone && (
                                <div className="flex items-center gap-2 text-xs">
                                  <FiPhone className={faint} size={12} />
                                  <span className={subtext}>{a.phone}</span>
                                </div>
                              )}
                              {a.currentLocation && (
                                <div className="flex items-center gap-2 text-xs">
                                  <FiMapPin className={faint} size={12} />
                                  <span className={subtext}>{a.currentLocation}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className={`py-4 px-4 border-r ${divider} text-center`}>
                        <span className={`${text}/80 font-mono text-xs ${theme === "dark" ? "bg-black/20" : "bg-black/[0.04]"} rounded px-2 py-1`}>
                          {a.jobId || "-"}
                        </span>
                      </td>
                      <td className={`py-4 px-4 border-r ${divider} text-center`}>
                        {a.expYears ? (
                          <div className="flex flex-col items-center gap-1">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${experienceBadge}`}>
                              {a.expYears} {a.expYears === 1 ? "year" : "years"}
                            </span>
                            <span className={`${faint} text-xs`}>experience</span>
                          </div>
                        ) : (
                          <span className={`${subtext} text-xs`}>Not specified</span>
                        )}
                      </td>
                      <td className={`py-4 px-4 border-r ${divider} text-center`}>
                        <div className="flex flex-col items-center gap-1">
                          <FiCalendar className={faint} size={12} />
                          <span className={`${text}/80 text-xs`}>{fmtDate(a.createdAt)}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2 justify-center">
                          <button className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border ${border} text-xs font-medium transition-all duration-200 ${hoverPanel} hover:scale-105 active:scale-95 ${text}/80`} onClick={() => handleViewResume("career_applications", a.resumeFileId)} title="View Resume">
                            <FiExternalLink size={14} /> View
                          </button>
                          <button className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border ${border} text-xs font-medium transition-all duration-200 ${hoverPanel} hover:scale-105 active:scale-95 ${text}/80`} onClick={() => handleDownloadResume("career_applications", a.resumeFileId, a.resumeFilename)} title="Download Resume">
                            <FiDownload size={14} /> Download
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {(apps?.items?.length || 0) > 0 && (
                <div className={`flex items-center justify-between gap-4 mt-6 pt-4 border-t ${divider}`}>
                  <div className={subtext}>
                    Showing {((apps?.page || 1) - 1) * (apps?.pageSize || ROWS) + 1} to{" "}
                    {Math.min((apps?.page || 1) * (apps?.pageSize || ROWS), apps?.total || 0)} of{" "}
                    {apps?.total || 0} applications
                  </div>
                  <div className="flex items-center gap-2">
                    <button disabled={!appsHasPrev} onClick={() => setAppsPage((p) => Math.max(1, p - 1))} className={btnMd(appsHasPrev)}>← Previous</button>
                    <button disabled={!appsHasMore} onClick={() => setAppsPage((p) => p + 1)} className={btnMd(appsHasMore)}>Next →</button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Resumes */
            <div className="p-5 overflow-x-auto">
              <table className="min-w-full text-sm border-collapse">
                <thead>
                  <tr className={`${subtext} border-b ${divider}`}>
                    <th className={`py-3 px-4 border-r ${divider} text-left`}>Candidate</th>
                    <th className={`py-3 px-4 border-r ${divider} text-center`}>Contact</th>
                    <th className={`py-3 px-4 border-r ${divider} text-center`}>Created</th>
                    <th className="py-3 px-4 text-center">Resume</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingResumes ? (
                    <tr>
                      <td className="py-8 px-4 text-center" colSpan={4}>
                        <div className={`${subtext} flex items-center justify-center gap-2`}>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-500"></div>
                          Loading resumes...
                        </div>
                      </td>
                    </tr>
                  ) : !resumes?.items?.length ? (
                    <tr>
                      <td className="py-8 px-4 text-center" colSpan={4}>
                        <div className={`${subtext} flex flex-col items-center gap-2`}>
                          <FiFileText className="text-2xl opacity-50" />
                          <span>No resumes found</span>
                        </div>
                      </td>
                    </tr>
                  ) : resumes.items.map((r) => (
                    <tr key={r._id} className={`border-b ${rowBorder} group hover:bg-white/5 transition-colors`}>
                      <td className={`py-4 px-4 border-r ${divider}`}>
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg ${subtleBadgeBg} ${subtleBadgeText}`}>
                            <FiUser size={14} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className={`${text} font-medium truncate`}>{r.name || "Unnamed Candidate"}</div>
                            <div className={`${faint} text-xs mt-1`}>ID: {r._id}</div>
                          </div>
                        </div>
                      </td>
                      <td className={`py-4 px-4 border-r ${divider}`}>
                        <div className="flex flex-col gap-2 items-center">
                          {r.email && (<div className="flex items-center gap-2"><FiMail className={faint} size={12} /><span className={`${text}/80 text-xs`}>{r.email}</span></div>)}
                          {r.phone && (<div className="flex items-center gap-2"><FiPhone className={faint} size={12} /><span className={`${text}/80 text-xs`}>{r.phone}</span></div>)}
                          {!r.email && !r.phone && (<span className={`${subtext} text-xs`}>No contact info</span>)}
                        </div>
                      </td>
                      <td className={`py-4 px-4 border-r ${divider} text-center`}>
                        <div className="flex flex-col items-center gap-1">
                          <FiCalendar className={faint} size={12} />
                          <span className={`${text}/80 text-xs`}>{fmtDate(r.createdAt)}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2 justify-center">
                          <button className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border ${border} text-xs font-medium transition-all duration-200 ${hoverPanel} hover:scale-105 active:scale-95 ${text}/80`} onClick={() => handleViewResume("career_resume", r.resumeFileId)} title="View Resume">
                            <FiExternalLink size={14} /> View
                          </button>
                          <button className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border ${border} text-xs font-medium transition-all duration-200 ${hoverPanel} hover:scale-105 active:scale-95 ${text}/80`} onClick={() => handleDownloadResume("career_resume", r.resumeFileId, r.resumeFilename)} title="Download Resume">
                            <FiDownload size={14} /> Download
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {(resumes?.items?.length || 0) > 0 && (
                <div className={`flex items-center justify-between gap-4 mt-6 pt-4 border-t ${divider}`}>
                  <div className={subtext}>
                    Showing {((resumes?.page || 1) - 1) * (resumes?.pageSize || ROWS) + 1} to{" "}
                    {Math.min((resumes?.page || 1) * (resumes?.pageSize || ROWS), resumes?.total || 0)} of{" "}
                    {resumes?.total || 0} resumes
                  </div>
                  <div className="flex items-center gap-2">
                    <button disabled={!resumesHasPrev} onClick={() => setResumesPage((p) => Math.max(1, p - 1))} className={btnMd(resumesHasPrev)}>← Previous</button>
                    <button disabled={!resumesHasMore} onClick={() => setResumesPage((p) => p + 1)} className={btnMd(resumesHasMore)}>Next →</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="h-12" />
      </div>
    </div>
  );
}
