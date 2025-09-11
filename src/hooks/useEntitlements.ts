// src/hooks/useEntitlements.ts
import { useEffect, useState, useCallback } from "react";
import api, { extractServerError } from "../api";

export type EntitlementItem = {
  key: string;                // e.g., "journaling", "journaling_solo", "fii_dii_data"
  name: string;
  endsAt: string | null;
  status: "active" | string;
  variant?: { key?: string | null } | null;
};

export function useEntitlements() {
  const [items, setItems] = useState<EntitlementItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/users/me/products");
      setItems(res.data?.items ?? []);
    } catch (err) {
      const { message } = extractServerError(err);
      setError(message);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { items, loading, error, refresh };
}
