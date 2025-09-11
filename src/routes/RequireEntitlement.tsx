// src/routes/RequireEntitlement.tsx
import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useEntitlements } from "../hooks/useEntitlements";

type Props = {
  /** Any of these product keys is acceptable */
  anyOf: string[];
  /** Where to send users who lack access */
  redirectTo?: string;
  /** Optional: render while loading */
  loadingFallback?: React.ReactNode;
};

const RequireEntitlement: React.FC<Props> = ({
  anyOf,
  redirectTo = "/pricing",
  loadingFallback = <div className="text-center mt-10">Verifying access…</div>,
}) => {
  const location = useLocation();
  const { items, loading } = useEntitlements();

  if (loading) return <>{loadingFallback}</>;

  const ownedKeys = new Set(items.map((i) => i.key));
  const allowed = anyOf.some((k) => ownedKeys.has(k));

  return allowed ? (
    <Outlet />
  ) : (
    <Navigate
      to={redirectTo}
      replace
      state={{
        from: location,
        reason: "entitlement_required",
        needAnyOf: anyOf,
      }}
    />
  );
};

export default RequireEntitlement;
