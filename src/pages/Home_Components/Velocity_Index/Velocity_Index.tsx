// src/pages/Home_Components/Velocity_Index/VelocityIndex.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { RotateCw } from "lucide-react";

/* ============ Types ============ */
type Row = {
  volatility: number;
  time: string; // e.g. "HH:MM:SS IST"
  signal: "Bullish" | "Bearish";
  spot: number;
};
type IntervalKey = 3 | 5 | 15 | 30;
type RowsByInterval = Record<IntervalKey, Row[]>;

/* ============ Panel prop (for fullscreen support) ============ */
type Props = { panel?: "card" | "fullscreen" };

/* ============ API base ============ */
const RAW_BASE =
  (import.meta as any).env?.VITE_API_BASE ||
  (import.meta as any).env?.VITE_API_URL ||
  "https://api.upholictech.com/api";

const API_BASE = String(RAW_BASE).replace(/\/$/, "");
const API_WITH_API = /\/api$/i.test(API_BASE) ? API_BASE : API_BASE + "/api";

function buildUrl(path: string, params: Record<string, any>) {
  const cleaned = String(path).replace(/^\/+/, "");
  const u = new URL(cleaned, API_WITH_API + "/");
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") u.searchParams.set(k, String(v));
  });
  return u.toString();
}

/* ============ Optional JWT ============ */
const TOKEN_KEYS = ["token", "accessToken", "jwt", "authToken"];
function getAuthToken(): string | null {
  for (const k of TOKEN_KEYS) {
    const v = localStorage.getItem(k);
    if (!v) continue;
    try {
      const obj = JSON.parse(v);
      if (obj && typeof obj === "object" && "token" in obj) {
        return String((obj as any).token).replace(/^Bearer\s+/i, "");
      }
    } catch {}
    return v.replace(/^Bearer\s+/i, "");
  }
  return null;
}

/* ============ Helpers ============ */
const fmt = (x?: number, d = 2) =>
  typeof x === "number" && isFinite(x) ? x.toFixed(d) : "—";

/** Show only HH:MM from strings like "HH:MM:SS IST" */
function toHHMM(t?: string): string {
  if (!t) return "—";
  const m = t.match(/(\d{1,2}):(\d{2})/); // first HH:MM
  if (!m) return t;
  const h = m[1].padStart(2, "0");
  return `${h}:${m[2]}`;
}

// helper to convert small CSS fragments to React style objects
function toStyle(css: string): React.CSSProperties {
  const s: Record<string, string> = {};
  css
    .split(";")
    .map((x) => x.trim())
    .filter(Boolean)
    .forEach((decl) => {
      const [k, v] = decl.split(":").map((y) => y.trim());
      if (!k || !v) return;
      const camel = k.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
      (s as any)[camel] = v;
    });
  return s;
}

const INTERVALS: IntervalKey[] = [3, 5, 15, 30];
const SS_KEY = (u: number) => `vi.bulk.v1.${u}`;

/* ============ Component ============ */
const VelocityIndex: React.FC<Props> = ({ panel = "card" }) => {
  const [underlying] = useState<number>(13);
  const [intervalMin, setIntervalMin] = useState<IntervalKey>(3);

  const [rowsByInterval, setRowsByInterval] = useState<RowsByInterval>({
    3: [],
    5: [],
    15: [],
    30: [],
  });
  const [, setLoading] = useState(false); // kept, but not shown in UI
  const [hasFetched, setHasFetched] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [resolvedExpiry, setResolvedExpiry] = useState<string | null>(null);

  const etagRef = useRef<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Bulk endpoint — server resolves expiry automatically
  const bulkUrl = useMemo(
    () =>
      buildUrl("oc/rows/bulk", {
        underlying,
        segment: "IDX_I",
        intervals: INTERVALS.join(","), // "3,5,15,30"
        sinceMin: 390, // ~full trading day
        mode: "level",
        unit: "bps",
        expiry: "auto",
      }),
    [underlying]
  );

  // Hydrate from sessionStorage for instant paint
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(SS_KEY(underlying));
      if (raw) {
        const cached = JSON.parse(raw);
        if (cached?.rows) {
          setRowsByInterval({
            3: cached.rows["3"] || [],
            5: cached.rows["5"] || [],
            15: cached.rows["15"] || [],
            30: cached.rows["30"] || [],
          });
          setResolvedExpiry(cached.expiry || null);
          etagRef.current = cached.etag || null;
          setHasFetched(true);
        }
      }
    } catch {}
  }, [underlying]);

  // Fetcher (bulk + ETag)
  const fetchBulk = async () => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    try {
      setLoading(true);
      setErr(null);
      const token = getAuthToken();
      const res = await fetch(bulkUrl, {
        headers: {
          Accept: "application/json",
          ...(etagRef.current ? { "If-None-Match": etagRef.current } : {}),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
        signal: ctrl.signal,
        cache: "no-store",
      });

      // If nothing changed, keep current UI
      if (res.status === 304) {
        setHasFetched(true);
        return;
      }

      const etag = res.headers.get("ETag");
      if (etag) etagRef.current = etag;

      const hdrExpiry = res.headers.get("X-Resolved-Expiry");
      if (hdrExpiry) setResolvedExpiry(hdrExpiry);

      if (!res.ok) {
        let reason = `HTTP ${res.status}`;
        try {
          const j = await res.json();
          if (j?.error === "no_active_expiry") reason = "No active expiry found.";
        } catch {}
        throw new Error(reason);
      }

      const data = await res.json();
      const rows: RowsByInterval = {
        3: data?.rows?.["3"] || [],
        5: data?.rows?.["5"] || [],
        15: data?.rows?.["15"] || [],
        30: data?.rows?.["30"] || [],
      };

      setRowsByInterval(rows);
      setResolvedExpiry(String(data?.expiry || "") || null);

      // persist to sessionStorage for instant future loads
      sessionStorage.setItem(
        SS_KEY(underlying),
        JSON.stringify({
          rows,
          expiry: data?.expiry || null,
          etag: etagRef.current,
          t: Date.now(),
        })
      );
      setHasFetched(true);
    } catch (e: any) {
      if (e?.name === "AbortError") return;
      setErr(e?.message || "Failed to fetch");
      setHasFetched(true);
    } finally {
      setLoading(false);
    }
  };

  // Initial + when URL changes (underlying)
  useEffect(() => {
    fetchBulk();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bulkUrl]);

  // Background refresh every 60s
  useEffect(() => {
    const id = setInterval(fetchBulk, 60_000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bulkUrl]);

  const rows = rowsByInterval[intervalMin] || [];

  return (
    <div
      className="w-full h-full flex flex-col gap-3"
      style={panel === "fullscreen" ? { height: "100%" } : undefined}
    >
      {/* Theme-leaning styles (hooked to your .theme-scope vars) */}
      <style>{`
:root, .theme-scope {
  --vi-surface: var(--card-bg);
  --vi-fg: var(--fg);
  --vi-muted: var(--muted);
  --vi-brd: var(--border);
  --vi-accent: #6366f1;

  --vi-head-grad-1: rgba(99,102,241,0.10);
  --vi-head-grad-2: rgba(99,102,241,0.06);
  --vi-row-hover: rgba(148,163,184,0.08);
}

.vi-chip {
  background: var(--vi-surface);
  border: 1px solid var(--vi-brd);
  color: var(--vi-fg);
  border-radius: 8px;
}

.vi-select, .vi-input {
  border: 1.5px solid var(--vi-brd);
  background: var(--vi-surface);
  color: var(--vi-fg);
  border-radius: 10px;
  padding: 10px 14px;
  height: 42px;
  font-size: 14px; font-weight: 500;
  transition: border-color .2s ease, box-shadow .2s ease;
}
.vi-select:focus, .vi-input:focus {
  outline: none;
  border-color: var(--vi-accent);
  box-shadow: 0 0 0 3px rgba(99,102,241,.15);
}
.vi-select {
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  padding-right: 36px;
}

.vi-label {
  font-size: 12px; font-weight: 600;
  color: var(--vi-muted);
  margin-bottom: 6px; letter-spacing: .025em;
  text-transform: uppercase;
}

.no-scrollbar::-webkit-scrollbar{ display:none; }
.no-scrollbar{ -ms-overflow-style:none; scrollbar-width:none; }

.vi-thead {
  position: sticky; top: 0; z-index: 1;
  background: var(--vi-surface); /* solid base so it never looks transparent */
}
.vi-thead th {
  background: linear-gradient(180deg, var(--vi-head-grad-1), var(--vi-head-grad-2)), var(--vi-surface);
  color: var(--vi-fg);
  font-weight: 700; letter-spacing: .05em;
  text-transform: uppercase; font-size: 11px;
  border-bottom: 1px solid var(--vi-brd);
}

.vi-vlines th + th, .vi-vlines td + td { border-left: 1px solid var(--vi-brd); }
.vi-vlines tbody td { border-bottom: 1px solid var(--vi-brd); }
.vi-vlines tbody tr:last-child td { border-bottom: none; }
.vi-table-row { transition: background-color .12s ease; }
.vi-table-row:hover { background-color: var(--vi-row-hover); }

.vi-iconbtn {
  width: 42px; height: 42px; border-radius: 10px;
  display: grid; place-items: center;
  border: 1.5px solid var(--vi-brd);
  background: var(--vi-surface); color: var(--vi-fg);
  cursor: pointer; transition: transform .15s ease, box-shadow .15s ease, border-color .15s;
}
.vi-iconbtn:hover:not(:disabled) {
  border-color: var(--vi-accent);
  box-shadow: 0 0 0 3px rgba(99,102,241,.12);
  transform: translateY(-1px);
}
.vi-iconbtn:disabled { opacity: .65; cursor: not-allowed; }

@keyframes vi-spin { from{transform:rotate(0)} to{transform:rotate(360deg)} }
.vi-spin { animation: vi-spin .9s linear infinite; color: var(--vi-muted); }

.vi-header-title { font-size: 24px; font-weight: 700; letter-spacing: -0.025em; color: var(--vi-fg); }
      `}</style>

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between mb-1">
        <div className="flex items-center gap-3">
          <h1 className="vi-header-title">Volatility Index</h1>
          {resolvedExpiry && (
            <span className="px-2 py-1 text-xs vi-chip" title="Resolved automatically from server">
              Expiry: <strong>{resolvedExpiry}</strong>
            </span>
          )}
        </div>

        {/* Controls on right */}
        <div className="flex items-end gap-2">
          <div className="flex flex-col w-32">
            <label className="vi-label">Interval</label>
            <select
              value={intervalMin}
              onChange={(e) => setIntervalMin(Number(e.target.value) as IntervalKey)}
              className="vi-select"
            >
              <option value={3}>3 min</option>
              <option value={5}>5 min</option>
              <option value={15}>15 min</option>
              <option value={30}>30 min</option>
            </select>
          </div>

          <div className="flex flex-col">
            <label className="vi-label">&nbsp;</label>
            <button
              onClick={fetchBulk}
              className="vi-iconbtn"
              aria-label="Refresh"
              title="Refresh"
            >
              <RotateCw strokeWidth={2} />
            </button>
          </div>
        </div>
      </div>

      {/* Table wrapper */}
      <div
        className="relative rounded-xl border no-scrollbar overflow-y-auto"
        style={{
          borderColor: "var(--vi-brd)",
          maxHeight: panel === "fullscreen" ? "100%" : 350,
          background: "transparent",
          ...(panel === "fullscreen" ? { flex: "1 1 0%" } : null),
        }}
        aria-busy={false}
      >
        {/* (Loading overlay removed) */}

        <table
          className="w-full table-fixed text-[13px] vi-vlines"
          style={{ borderCollapse: "separate", borderSpacing: 0, color: "var(--vi-fg)" }}
        >
          <colgroup>
            <col style={{ width: "22%" }} />
            <col style={{ width: "28%" }} />
            <col style={{ width: "25%" }} />
            <col style={{ width: "25%" }} />
          </colgroup>

          <thead className="vi-thead">
            <tr>
              <th className="px-3 py-2 text-center">Volatility</th>
              <th className="px-3 py-2 text-center">Time</th>
              <th className="px-3 py-2 text-center">Signal</th>
              <th className="px-3 py-2 text-center">Spot</th>
            </tr>
          </thead>

          <tbody>
            {rows.map((r, i) => {
              const volTone =
                r.volatility > 0
                  ? "color: #22c55e"
                  : r.volatility < 0
                  ? "color: #ef4444"
                  : "color: var(--vi-fg)";
              const chipStyle =
                r.signal === "Bullish"
                  ? "background: rgba(16,185,129,0.12); color:#22c55e; border:1px solid rgba(16,185,129,0.28);"
                  : "background: rgba(244,63,94,0.12); color:#ef4444; border:1px solid rgba(244,63,94,0.28);";
              return (
                <tr key={i} className="vi-table-row">
                  <td className="px-3 py-2 font-mono text-center" style={toStyle(volTone)}>
                    {fmt(r.volatility)}
                  </td>
                  <td className="px-3 py-2 font-mono text-center">{toHHMM(r.time)}</td>
                  <td className="px-3 py-2 text-center">
                    <span
                      className="px-2 py-0.5 text-[12px] rounded-md inline-block"
                      style={{ ...toStyle(chipStyle), borderWidth: 1 }}
                    >
                      {r.signal}
                    </span>
                  </td>
                  <td className="px-3 py-2 font-mono text-center">{Math.round(r.spot)}</td>
                </tr>
              );
            })}

            {/* Only show 'No data' after at least one fetch */}
            {rows.length === 0 && hasFetched && (
              <tr>
                <td colSpan={4} className="px-3 py-6 text-center" style={{ color: "var(--vi-muted)" }}>
                  {err ? "No data (API error)" : "No data"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {err && (
        <div className="text-xs mt-1" style={{ color: "var(--vi-muted)" }}>
          {err}
        </div>
      )}
    </div>
  );
};

export default VelocityIndex;
