// src/hooks/useOcRowsBulk.ts
import { useEffect, useRef, useState } from "react";

export type Interval = 3 | 5 | 15 | 30;
export type Row = { volatility: number; time: string; signal: "Bullish" | "Bearish"; spot: number };
export type RowsByInterval = Record<Interval, Row[]>;

function apiBase(): string {
  const raw = (import.meta as any).env?.VITE_API_BASE || (import.meta as any).env?.VITE_API_URL || "https://api.upholictech.com/api";
  const b = String(raw).replace(/\/$/, "");
  return /\/api$/i.test(b) ? b : b + "/api";
}

function buildUrl(underlying: number, intervalMin: number) {
  const u = new URL("oc/rows", apiBase() + "/");
  u.searchParams.set("underlying", String(underlying));
  u.searchParams.set("segment", "IDX_I");
  u.searchParams.set("intervalMin", String(intervalMin));
  u.searchParams.set("limit", "500");
  u.searchParams.set("mode", "level");
  u.searchParams.set("unit", "bps");
  u.searchParams.set("expiry", "auto");
  return u.toString();
}

/**
 * useOcRowsBulk
 * - lightweight hook that fetches rows for all supported intervals (3,5,15,30)
 * - NO sessionStorage, NO ETag
 */
export function useOcRowsBulk(underlying = 13) {
  const [rowsByInterval, setRowsByInterval] = useState<RowsByInterval>({ 3: [], 5: [], 15: [], 30: [] });
  const [expiry, setExpiry] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [err, setErr] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const intervals: Interval[] = [3, 5, 15, 30];

  const refresh = async () => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setLoading(true);
    setErr(null);

    try {
      // fetch each interval in parallel
      const promises = intervals.map(async (iv) => {
        const res = await fetch(buildUrl(underlying, iv), {
          headers: { Accept: "application/json" },
          cache: "no-store",
          signal: ctrl.signal,
        });
        if (!res.ok) {
          // try to extract error details
          let reason = `HTTP ${res.status}`;
          try {
            const j = await res.json();
            if (j?.error) reason = j.error + (j?.detail ? `: ${j.detail}` : "");
          } catch {}
          throw new Error(`interval ${iv} -> ${reason}`);
        }
        const data = await res.json();
        // Expect either an array (rows) or object with rows key
        const rows: Row[] = Array.isArray(data) ? data : Array.isArray(data?.rows) ? data.rows : [];
        const resolvedExpiry = (data && data.expiry) ? String(data.expiry) : null;
        return { iv, rows, resolvedExpiry };
      });

      const results = await Promise.all(promises);

      const next: RowsByInterval = { 3: [], 5: [], 15: [], 30: [] };
      let foundExpiry: string | null = null;
      for (const r of results) {
        (next as any)[String(r.iv)] = r.rows;
        if (!foundExpiry && r.resolvedExpiry) foundExpiry = r.resolvedExpiry;
      }

      setRowsByInterval(next);
      setExpiry(foundExpiry);
      setErr(null);
    } catch (e: any) {
      if (e?.name === "AbortError") {
        // aborted by caller, ignore
        return;
      }
      console.error("useOcRowsBulk refresh error:", e);
      setErr(e?.message || "Failed to load oc rows");
      // keep previous rowsByInterval (do not clear)
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    setErr(null);
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [underlying]);

  useEffect(() => {
    const id = setInterval(refresh, 60_000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [underlying]);

  return { rowsByInterval, expiry, loading, err, refresh };
}
