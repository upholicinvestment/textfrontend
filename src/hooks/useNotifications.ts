import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import api from "../api";

export type NotificationItem = {
  id: string;
  title: string;
  body?: string;
  type?: "system" | "payment" | "trade" | "info" | "warning";
  link?: string;                // navigate to this when clicked (optional)
  createdAt: string;            // ISO date
  read?: boolean;
  meta?: Record<string, any>;
};

type ListResponse = {
  items: NotificationItem[];
};

const ENDPOINTS = {
  list: "/notifications",                        // GET
  markRead: "/notifications/mark-read",         // POST { ids: string[] }
  markAllRead: "/notifications/mark-all-read",  // POST {}
  // optional SSE endpoint (query token is appended)
  sse: "/notifications/stream",
};

function sortDesc(a: NotificationItem, b: NotificationItem) {
  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
}

export function useNotifications() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sseRef = useRef<EventSource | null>(null);

  const unseenCount = useMemo(
    () => items.reduce((n, x) => (x.read ? n : n + 1), 0),
    [items]
  );

  const fetchList = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get<ListResponse>(ENDPOINTS.list, {
        params: { limit: 50 },
      });
      const list = (res.data?.items ?? []).slice().sort(sortDesc);
      setItems(list);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  const markRead = useCallback(async (id: string) => {
    try {
      setItems((prev) => prev.map((x) => (x.id === id ? { ...x, read: true } : x)));
      await api.post(ENDPOINTS.markRead, { ids: [id] });
    } catch {
      // best-effort; no rollback
    }
  }, []);

  const markAllRead = useCallback(async () => {
    try {
      setItems((prev) => prev.map((x) => ({ ...x, read: true })));
      await api.post(ENDPOINTS.markAllRead, {});
    } catch {
      // ignore
    }
  }, []);

  // Boot: initial fetch
  useEffect(() => {
    fetchList();
  }, [fetchList]);

  // Live updates via SSE (if available) with polling fallback
  useEffect(() => {
    const base =
      (api as any)?.defaults?.baseURL?.replace(/\/$/, "") || "";
    const token = localStorage.getItem("token");

    // try SSE first
    if (base && "EventSource" in window) {
      try {
        const url = `${base}${ENDPOINTS.sse}?token=${encodeURIComponent(
          token || ""
        )}`;
        const es = new EventSource(url);
        sseRef.current = es;

        es.onmessage = (ev) => {
          try {
            const data = JSON.parse(ev.data);
            // Expect either a single item or batched items
            const next: NotificationItem[] = Array.isArray(data) ? data : [data];
            if (!next.length) return;
            setItems((prev) => {
              const m = new Map(prev.map((x) => [x.id, x]));
              for (const it of next) m.set(it.id, { ...m.get(it.id), ...it });
              return Array.from(m.values()).sort(sortDesc);
            });
          } catch {
            // ignore malformed
          }
        };

        es.onerror = () => {
          // close SSE and fall back to polling
          es.close();
          sseRef.current = null;
          if (!pollRef.current) {
            pollRef.current = setInterval(fetchList, 30_000);
          }
        };

        // also poll every 5 minutes as a sanity refresh
        pollRef.current = setInterval(fetchList, 300_000);
      } catch {
        // fallback to polling
        pollRef.current = setInterval(fetchList, 30_000);
      }
    } else {
      // no base or no EventSource -> polling
      pollRef.current = setInterval(fetchList, 30_000);
    }

    // refresh when tab regains focus
    const onFocus = () => fetchList();
    window.addEventListener("focus", onFocus);

    return () => {
      window.removeEventListener("focus", onFocus);
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = null;
      if (sseRef.current) sseRef.current.close();
      sseRef.current = null;
    };
  }, [fetchList]);

  return {
    items,
    unseenCount,
    loading,
    refetch: fetchList,
    markRead,
    markAllRead,
  };
}
