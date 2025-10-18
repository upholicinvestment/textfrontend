// src/hooks/useOcRowsBulk.ts
import { useEffect, useRef, useState } from "react";

export type Row = { volatility: number; time: string; signal: "Bullish" | "Bearish"; spot: number };
export type RowsByInterval = Record<3 | 5 | 15 | 30, Row[]>;

const KEY = (u: number) => `vi.bulk.v1.${u}`;

function apiBase() {
  const raw = (import.meta as any).env?.VITE_API_BASE || (import.meta as any).env?.VITE_API_URL || "https://api.upholictech.com/api";
  const b = String(raw).replace(/\/$/, "");
  return /\/api$/i.test(b) ? b : b + "/api";
}
function buildUrl(underlying: number) {
  const u = new URL("oc/rows/bulk", apiBase() + "/");
  u.searchParams.set("underlying", String(underlying));
  u.searchParams.set("segment", "IDX_I");
  u.searchParams.set("intervals", "3,5,15,30");
  u.searchParams.set("sinceMin", "390");   // full trading day
  u.searchParams.set("mode", "level");
  u.searchParams.set("unit", "bps");
  u.searchParams.set("expiry", "auto");
  return u.toString();
}

export function useOcRowsBulk(underlying = 13) {
  const [rowsByInterval, setRowsByInterval] = useState<RowsByInterval>({ 3: [], 5: [], 15: [], 30: [] });
  const [expiry, setExpiry] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const etagRef = useRef<string | null>(null);

  // hydrate quickly from sessionStorage
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(KEY(underlying));
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.rows) {
          setRowsByInterval(parsed.rows);
          setExpiry(parsed.expiry || null);
          setLoading(false);
        }
      }
    } catch {}
  }, [underlying]);

  const refresh = async () => {
    try {
      const res = await fetch(buildUrl(underlying), {
        headers: {
          Accept: "application/json",
          ...(etagRef.current ? { "If-None-Match": etagRef.current } : {}),
        },
        cache: "no-store",
        keepalive: true,
      });

      if (res.status === 304) return; // data unchanged

      const etag = res.headers.get("ETag");
      if (etag) etagRef.current = etag;

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      const rows: RowsByInterval = {
        3: data?.rows?.["3"] || [],
        5: data?.rows?.["5"] || [],
        15: data?.rows?.["15"] || [],
        30: data?.rows?.["30"] || [],
      };
      setRowsByInterval(rows);
      setExpiry(String(data?.expiry || "") || null);

      sessionStorage.setItem(KEY(underlying), JSON.stringify({ rows, expiry: data?.expiry || null, t: Date.now() }));
    } catch (e: any) {
      setErr(e?.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  // first network load
  useEffect(() => {
    setLoading(true);
    setErr(null);
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [underlying]);

  // background refresh every 60s
  useEffect(() => {
    const id = setInterval(refresh, 60_000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [underlying]);

  return { rowsByInterval, expiry, loading, err, refresh };
}
