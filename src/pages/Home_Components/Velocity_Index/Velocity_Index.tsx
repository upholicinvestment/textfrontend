import React, { useEffect, useMemo, useState } from "react";
import { RotateCw, Loader2 } from "lucide-react";

/* ============ Types ============ */
type Row = {
  volatility: number;
  time: string; // HH:MM:SS IST (we'll render HH:MM)
  signal: "Bullish" | "Bearish";
  spot: number;
};

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
    if (v !== undefined && v !== null) u.searchParams.set(k, String(v));
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

/* ============ Component ============ */
const VelocityIndex: React.FC = () => {
  const [underlying] = useState<number>(13);
  const [expiry] = useState<string>("2025-10-14");
  // const [unit, setUnit] = useState<"bps" | "pct" | "points">("bps");
  const [intervalMin, setIntervalMin] = useState<number>(3); // auto-refresh minutes

  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Build request URL (NO 'limit' → no cap on rows)
  const url = useMemo(
    () =>
      buildUrl("oc/rows", {
        underlying,
        expiry,
        // limit, // intentionally omitted to remove server-side cap
        intervalMin,
        mode: "level",
        windowSteps: 5,
        classify: 1,
      }),
    [underlying, expiry, /*limit,*/ intervalMin]
  );

  // Fetcher
  const fetchRows = async () => {
    try {
      setLoading(true);
      setErr(null);
      const token = getAuthToken();
      const res = await fetch(url, {
        headers: {
          Accept: "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as Row[];
      setRows(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setErr(e?.message || "Failed to fetch");
    } finally {
      setLoading(false);
    }
  };

  // Initial + on URL change
  useEffect(() => {
    fetchRows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);

  // Auto-refresh (interval-driven)
  useEffect(() => {
    const refreshMs = Math.max(1, intervalMin) * 60_000;
    const id = setInterval(fetchRows, refreshMs);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intervalMin, url]);

  return (
    <div className="w-full h-full flex flex-col gap-3">
      {/* Styles */}
      <style>{`
  /* CSS Variables for light/dark mode */
  :root {
    --vi-bg-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    --vi-input-bg: #f8f9ff;
    --vi-input-border: #a5b4fc;
    --vi-input-text: #1e1b4b;
    --vi-input-focus: #6366f1;
    --vi-label-text: #4338ca;
    --vi-table-bg: #fefeff;
    --vi-table-header-bg: linear-gradient(180deg, #e0e7ff 0%, #c7d2fe 100%);
    --vi-table-header-text: #312e81;
    --vi-table-border: #c7d2fe;
    --vi-table-row-hover: #f5f3ff;
    --vi-table-row-alt: #faf5ff;
    --vi-button-bg: linear-gradient(135deg, #818cf8 0%, #6366f1 100%);
    --vi-button-border: #6366f1;
    --vi-button-hover: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
    --vi-button-text: #ffffff;
    --vi-select-arrow: #4338ca;
    --vi-shadow: 0 4px 6px -1px rgba(99, 102, 241, 0.1), 0 2px 4px -1px rgba(99, 102, 241, 0.06);
    --vi-icon-color: #4338ca;
  }

  @media (prefers-color-scheme: dark) {
    :root {
      --vi-input-bg: #1f2937;
      --vi-input-border: #4b5563;
      --vi-input-text: #f9fafb;
      --vi-input-focus: #60a5fa;
      --vi-label-text: #d1d5db;
      --vi-table-bg: #111827;
      --vi-table-header-bg: #1f2937;
      --vi-table-header-text: #f3f4f6;
      --vi-table-border: #374151;
      --vi-table-row-hover: #1f2937;
      --vi-button-bg: #1f2937;
      --vi-button-border: #4b5563;
      --vi-button-hover: #374151;
      --vi-select-arrow: #d1d5db;
      --vi-icon-color: #d1d5db;
      --vi-header-title: white;
    }
  }

  .vi-chip { 
    background: var(--vi-table-bg); 
    border: 1px solid var(--vi-table-border); 
    border-radius: 8px; 
  }

  .vi-input, .vi-select {
    border: 2px solid var(--vi-input-border);
    background: var(--vi-input-bg);
    color: var(--vi-input-text);
    border-radius: 8px;
    padding: 10px 14px;
    height: 42px;
    width: 100%;
    font-size: 14px;
    font-weight: 500;
    transition: all 0.2s ease;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  }

  .vi-input:focus, .vi-select:focus {
    outline: none;
    border-color: var(--vi-input-focus);
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  .vi-input:hover, .vi-select:hover {
    border-color: var(--vi-input-focus);
  }

  .vi-select {
    appearance: none;
    cursor: pointer;
    background-image: url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='%236b7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 12px center;
    padding-right: 36px;
  }

  @media (prefers-color-scheme: dark) {
    .vi-select {
      background-image: url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='%23d1d5db' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
    }
  }

  .vi-select option {
    background: var(--vi-input-bg);
    color: var(--vi-input-text);
    padding: 8px;
  }

  .vi-label { 
    font-size: 12px; 
    font-weight: 600;
    color: gray; 
    margin-bottom: 6px; 
    letter-spacing: 0.025em;
    text-transform: uppercase;
  }

  .no-scrollbar::-webkit-scrollbar{ display:none; }
  .no-scrollbar{ -ms-overflow-style:none; scrollbar-width:none; }

  /* Sticky header */
  .vi-thead { 
    position: sticky; 
    top: 0; 
    z-index: 10; 
    background: var(--vi-table-header-bg);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }
  .vi-thead th { 
    background: var(--vi-table-header-bg); 
    color: var(--vi-table-header-text); 
    font-weight: 700; 
    letter-spacing: 0.05em;
    text-transform: uppercase;
    font-size: 11px;
  }

  /* Vertical column lines */
  .vi-vlines th + th, .vi-vlines td + td {
    border-left: 1px solid var(--vi-table-border);
  }

  /* EXTRA: Horizontal lines across the row cells (clean separators) */
  .vi-vlines tbody td {
    border-bottom: 1px solid var(--vi-table-border);
  }
  .vi-vlines tbody tr:last-child td {
    border-bottom: none; /* tidy end */
  }

  /* Table rows */
  .vi-table-row {
    border-top: 1px solid var(--vi-table-border);
    transition: background-color 0.15s ease;
  }

  .vi-table-row:hover {
    background-color: var(--vi-table-row-hover);
  }

  /* Icon button + spinner */
  .vi-iconbtn {
    width: 42px; 
    height: 42px; 
    border-radius: 8px;
    display: grid; 
    place-items: center;
    border: 2px solid var(--vi-button-border); 
    background: #E0E0E0; 
    color: var(--vi-icon-color);
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .vi-iconbtn:hover:not(:disabled) {
    background: var(--vi-button-hover);
    border-color: var(--vi-input-focus);
    transform: translateY(-1px);
    color: var(--vi-input-text);
  }

  .vi-iconbtn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .vi-iconbtn svg { 
    width: 18px; 
    height: 18px; 
    display: block; 
    color: currentColor;
  }
  
  @keyframes vi-spin { 
    from { transform: rotate(0deg); } 
    to { transform: rotate(360deg); } 
  }
  
  .vi-spin { 
    animation: vi-spin 0.9s linear infinite; 
    color: var(--vi-icon-color);
  }

  /* Header title styles */
  .vi-header-title {
    font-size: 20px;
    font-weight: 700;
    letter-spacing: -0.025em;
  }
`}</style>

      {/* Controls - Header with title on left, controls on right */}
      <div className="relative z-10 flex items-center justify-between mb-1">
        {/* Title on left */}
        <h1 className="vi-header-title">Volatility Index</h1>
        
        {/* Controls on right */}
        <div className="flex items-end gap-2">
          <div className="flex flex-col w-32">
            <select
              value={intervalMin}
              onChange={(e) => setIntervalMin(Number(e.target.value))}
              className="vi-select"
            >
              <option value={3}>3 min</option>
              <option value={5}>5 min</option>
              <option value={15}>15 min</option>
              <option value={30}>30 min</option>
            </select>
          </div>

          <button
            onClick={fetchRows}
            className="vi-iconbtn"
            aria-label="Refresh"
            title="Refresh"
            disabled={loading}
          >
            {!loading ? (
              <RotateCw strokeWidth={2} />
            ) : (
              <Loader2 className="vi-spin" strokeWidth={2} />
            )}
          </button>
        </div>
      </div>

      {/* Table */}
      <div
        className="relative rounded-xl border no-scrollbar overflow-y-auto"
        style={{
          borderColor: "var(--border)",
          maxHeight: 350,
          background: "transparent",
        }}
      >
        <table
          className="w-full table-fixed text-[13px] vi-vlines"
          style={{ borderCollapse: "separate", borderSpacing: 0 }}
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
                  ? "color: #34d399"
                  : r.volatility < 0
                  ? "color: #fb7185"
                  : "color: var(--fg)";
              const chipStyle =
                r.signal === "Bullish"
                  ? "background: rgba(16,185,129,0.12); color:#34d399; border:1px solid rgba(16,185,129,0.28);"
                  : "background: rgba(244,63,94,0.12); color:#fb7185; border:1px solid rgba(244,63,94,0.28);";
              return (
                <tr key={i} className="border-t" style={{ borderColor: "var(--border)" }}>
                  <td className="px-3 py-2 font-mono text-center" style={{ ...toStyle(volTone) }}>
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

            {!rows.length && !loading && (
              <tr>
                <td colSpan={4} className="px-3 py-6 text-center" style={{ color: "var(--muted)" }}>
                  No data
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {err && (
        <div className="text-xs mt-1" style={{ color: "var(--muted)" }}>
          {err}
        </div>
      )}
    </div>
  );
};

// helper to convert small CSS fragments to React style objects
function toStyle(css: string): React.CSSProperties {
  const s: any = {};
  css
    .split(";")
    .map((x) => x.trim())
    .filter(Boolean)
    .forEach((decl) => {
      const [k, v] = decl.split(":").map((y) => y.trim());
      if (!k || !v) return;
      const camel = k.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
      s[camel] = v;
    });
  return s;
}

export default VelocityIndex;
