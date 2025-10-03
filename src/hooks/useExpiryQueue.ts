// src/hooks/useExpiryQueue.ts
import { useCallback, useEffect, useMemo, useState } from "react";

export type ExpiryItem = {
  id: string;          // stable id per product/subscription
  name: string;        // product name
  endsAt: string;      // ISO expiry date
  status?: string;     // "active" to show; others ignored
  renewUrl?: string;   // optional CTA link
};

export type ExpiryCandidate = ExpiryItem & {
  daysLeft: number;
  dateLabel: string;
};

type Options = {
  items: ExpiryItem[];
  maxDays?: number;                 // default 7
  debug?: boolean;
  displayTimeZone?: string;         // default "Asia/Kolkata"
};

const formatDate = (iso: string, timeZone = "Asia/Kolkata") =>
  new Date(iso).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone,
  });

const daysUntil = (iso?: string) => {
  if (!iso) return Infinity;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const exp = new Date(iso);
  exp.setHours(0, 0, 0, 0);
  return Math.ceil((exp.getTime() - today.getTime()) / 86400000);
};

const seenKey = (id: string) => `${new Date().toISOString().slice(0, 10)}::expiry::${id}`;

export function useExpiryQueue({
  items,
  maxDays = 7,
  debug,
  displayTimeZone = "Asia/Kolkata",
}: Options) {
  const queue = useMemo(() => {
    const candidates = (items || [])
      .filter((x) => x && x.id && x.endsAt)
      .filter((x) => !x.status || x.status === "active")
      .map((x) => {
        const daysLeft = daysUntil(x.endsAt);
        return {
          ...x,
          daysLeft,
          dateLabel: formatDate(x.endsAt, displayTimeZone),
        } as ExpiryCandidate;
      })
      .filter(
        (x) =>
          Number.isFinite(x.daysLeft) &&
          x.daysLeft >= 0 &&
          x.daysLeft <= maxDays &&
          !localStorage.getItem(seenKey(x.id))
      )
      .sort((a, b) => a.daysLeft - b.daysLeft); // soonest first

    return candidates;
  }, [items, maxDays, displayTimeZone]);

  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (debug) console.log("[useExpiryQueue] queue:", queue);
    setIndex(0);
  }, [queue, debug]);

  const current = queue[index] || null;
  const visible = !!current;

  const markSeen = useCallback((id: string) => {
    try {
      localStorage.setItem(seenKey(id), "1");
    } catch {}
  }, []);

  const dismiss = useCallback(() => {
    if (!current) return;
    markSeen(current.id);
    setIndex((i) => i + 1);
  }, [current, markSeen]);

  // ✅ Same-tab navigation (no new window)
  const renew = useCallback(() => {
    if (!current) return;
    markSeen(current.id);
    if (current.renewUrl) {
      try {
        window.location.assign(current.renewUrl); // stays in the same tab
      } catch {
        window.location.href = current.renewUrl;   // fallback, same tab
      }
    }
    setIndex((i) => i + 1);
  }, [current, markSeen]);

  return {
    current,
    visible,
    dismiss,
    renew,
    countRemaining: Math.max(0, queue.length - index),
  };
}
