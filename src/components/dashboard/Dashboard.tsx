// src/components/dashboard/Dashboard.tsx
import React, { useEffect, useMemo, useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../api";
import { AuthContext } from "../../context/AuthContext";

import Sidebar from "./components/Sidebar";
import HeaderBar from "./components/HeaderBar";
import AlgoDashboardBody from "./views/AlgoDashboardBody";
import BundleDashboardBody from "./views/BundleDashboardBody";

import {
  PackageOpen,
  Activity,
  TrendingUp,
  DollarSign,
  Users,
  BarChart3,
} from "lucide-react";

import {
  MyProduct,
  MyVariant,
  Summary,
  StrategyPnL,
  SummaryDoc,
  TriggeredTrade,
  LivePosition,
  ProductUI,
  Stat,
} from "./types";

import { todayISO, dateKeyToISO, isoToDateKey, dateKeyStamp } from "./utils/date";
import {
  componentLabelMap,
  componentRouteMap,
  bundleComponentKeys,
  prettyINR,
} from "./utils/misc";

/* === expiry modal hook + component (UI popup) === */
import { useExpiryQueue, ExpiryItem } from "../../hooks/useExpiryQueue";
import ExpiryModal from "./components/ExpiryModal";

const Dashboard: React.FC = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  // ---------- Sidebar / UI ----------
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // (optional) for the bell icon
  const [openInbox, setOpenInbox] = useState(false);
  const notifications = 3;

  // ---------- Entitlements ----------
  const [myProducts, setMyProducts] = useState<MyProduct[]>([]);
  const [loadingEntitlements, setLoadingEntitlements] = useState<boolean>(true);

  // ---------- Summary (live or by-date) ----------
  const [summary, setSummary] = useState<Summary | null>(null);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  // ---------- History + selection ----------
  const [history, setHistory] = useState<SummaryDoc[]>([]);
  const [selectedKey, setSelectedKey] = useState<string>("today");
  const [dateInputISO, setDateInputISO] = useState<string>(todayISO());
  const [dateInputNoData, setDateInputNoData] = useState<string | null>(null);
  const isToday = selectedKey === "today";

  // ---------- Strategies (for the selected day) ----------
  const [strategies, setStrategies] = useState<StrategyPnL[]>([]);
  const [strategiesLoading, setStrategiesLoading] = useState<boolean>(false);
  const [strategiesError, setStrategiesError] = useState<string | null>(null);

  const [sortBy, setSortBy] = useState<"pnl" | "winRate" | "trades">("pnl");
  const [sortDir, setSortDir] = useState<"desc" | "asc">("desc");

  const [trades, setTrades] = useState<TriggeredTrade[]>([]);
  const [tradesLoading, setTradesLoading] = useState(false);
  const [tradesError, setTradesError] = useState<string | null>(null);

  const [positions, setPositions] = useState<LivePosition[]>([]);
  const [positionsLoading, setPositionsLoading] = useState(false);
  const [positionsError, setPositionsError] = useState<string | null>(null);

  // ---------- Helpers ----------
  const withUser = <T extends Record<string, any>>(params?: T) => {
    const uid = user?.id?.trim();
    return uid ? { ...(params || {}), userId: uid } : params || {};
  };

  // Attach X-User-Id header for Express
  useEffect(() => {
    const uid = user?.id?.trim();
    if (uid) {
      (api as any).defaults.headers.common["X-User-Id"] = uid;
    } else {
      delete (api as any).defaults.headers.common["X-User-Id"];
    }
  }, [user?.id]);

  // Load entitlements
  useEffect(() => {
    (async () => {
      try {
        setLoadingEntitlements(true);
        const res = await api.get("/users/me/products", { params: withUser() });
        const items: MyProduct[] = Array.isArray(res.data?.items) ? res.data.items : [];
        setMyProducts(items);
      } catch {
        setMyProducts([]);
      } finally {
        setLoadingEntitlements(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- Products derived state ----
  const ownedKeys = useMemo(
    () => new Set(myProducts.map((p) => (p.key || "").toLowerCase())),
    [myProducts]
  );

  const hasBundleViaComponents = useMemo(
    () => bundleComponentKeys.every((k) => ownedKeys.has(k)),
    [ownedKeys]
  );

  const hasBundleProduct = useMemo(() => ownedKeys.has("essentials_bundle"), [ownedKeys]);
  const ownsAlgo = useMemo(() => ownedKeys.has("algo_simulator"), [ownedKeys]);
  const ownsJournalingSolo = useMemo(() => ownedKeys.has("journaling_solo"), [ownedKeys]);
  const ownsJournaling = useMemo(
    () => ownedKeys.has("journaling") || ownedKeys.has("journaling_solo"),
    [ownedKeys]
  );

  // === DECISION: Which dashboard to show? ===
  const shouldUseAlgoDashboard = ownsAlgo;
  const shouldUseBundleDashboard =
    !ownsAlgo && (hasBundleProduct || hasBundleViaComponents || ownsJournaling);

  // ---------- History & date helpers (ALGO view only) ----------
  const availableKeys = useMemo(() => new Set(history.map((h) => h.dateKey)), [history]);
  const availableListAsc = useMemo(() => history.map((h) => h.dateKey), [history]);
  const newestKey = availableListAsc[availableListAsc.length - 1];

  const getPrevKey = (current: string): string | null => {
    if (isToday || current === "today") return newestKey ?? null;
    const idx = availableListAsc.indexOf(current);
    if (idx <= 0) return null;
    return availableListAsc[idx - 1];
  };
  const getNextKey = (current: string): string | null => {
    if (current === "today") return null;
    const idx = availableListAsc.indexOf(current);
    if (idx === -1) return null;
    if (idx === availableListAsc.length - 1) return "today";
    return availableListAsc[idx + 1];
  };

  const canGoPrev = !!getPrevKey(selectedKey);
  const canGoNext = !!getNextKey(selectedKey);

  // Keep date input in sync
  useEffect(() => {
    if (!shouldUseAlgoDashboard) return;
    if (isToday) setDateInputISO(todayISO());
    else setDateInputISO(dateKeyToISO(selectedKey));
  }, [selectedKey, isToday, shouldUseAlgoDashboard]);

  // Load summary history (latest N days) — ALGO only
  useEffect(() => {
    if (!shouldUseAlgoDashboard) return;
    (async () => {
      try {
        const r = await api.get("/summary/history?limit=30", { params: withUser() });
        const arr = Array.isArray(r.data?.data) ? r.data.data : [];
        const sorted = [...arr].sort(
          (a: SummaryDoc, b: SummaryDoc) => dateKeyStamp(a.dateKey) - dateKeyStamp(b.dateKey)
        );
        setHistory(sorted);
      } catch {
        setHistory([]);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldUseAlgoDashboard]);

  // Load summary (today live or by-date) with polling for today — ALGO only
  useEffect(() => {
    if (!shouldUseAlgoDashboard) return;

    let isMounted = true;
    let timer: any = null;

    // const loadToday = async () => {
    //   try {
    //     setSummaryError(null);
    //     const r = await api.get("/summary", { params: withUser() });
    //     if (isMounted) setSummary(r.data as Summary);
    //     Promise.allSettled([
    //       api.get("/orderbook/save-raw", { params: withUser() }),
    //       api.get("/pnl/trades/save", { params: withUser() }),
    //     ]).catch(() => {});
    //   } catch {
    //     if (isMounted) {
    //       setSummary(null);
    //       setSummaryError("Couldn’t load summary.");
    //     }
    //   }
    // };

    // optional: keep this helper somewhere central
const checkBrokerConfigs = async (): Promise<boolean> => {
  try {
    const r = await api.get("/broker-configs/exists", {
      params: withUser(),
      validateStatus: () => true,
    });
    return r.status === 200 && !!r.data?.hasBrokerConfig;
  } catch {
    return false;
  }
};

const loadToday = async () => {
  try {
    setSummaryError(null);

    // 1) Gate everything behind broker-config presence
    const hasBroker = await checkBrokerConfigs();
    if (!hasBroker) {
      // choose one of these behaviours:
      if (isMounted) {
        // A) show nothing
        setSummary(null);
        // (optional) setSummaryError("Connect a broker to see today's summary.");
        // B) or show zeros instead of an error:
        // setSummary({ totalPnl: 0, totalTrades: 0, openPositions: 0, successRatePct: 0, riskReward: 0 });
      }
      return;
    }

    // 2) Now safe to call /summary
    const r = await api.get<Summary>("/summary", { params: withUser() });
    if (isMounted) setSummary(r.data);

    // 3) Fire the side-effect saves (no throw/no console noise on 4xx)
    void Promise.allSettled([
      api.get("/orderbook/save-raw", { params: withUser(), validateStatus: () => true }),
      api.get("/pnl/trades/save",   { params: withUser(), validateStatus: () => true }),
    ]);
  } catch {
    if (isMounted) {
      setSummary(null);
      setSummaryError("Couldn’t load summary.");
    }
  }
};

    
    const loadByDate = async (dateKey: string) => {
      try {
        setSummaryError(null);
        const r = await api.get("/summary/by-date", { params: withUser({ dateKey }) });
        if (isMounted) setSummary(r.data?.data as Summary);
      } catch {
        if (isMounted) {
          setSummary(null);
          setSummaryError("No snapshot found for that date.");
        }
      }
    };

    if (isToday) loadToday();
    else loadByDate(selectedKey);

    const onFocus = () => isToday && loadToday();
    window.addEventListener("focus", onFocus);

    if (isToday) {
      timer = setInterval(() => {
        if (document.visibilityState === "visible") loadToday();
      }, 20_000);
    }

    return () => {
      isMounted = false;
      window.removeEventListener("focus", onFocus);
      if (timer) clearInterval(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedKey, isToday, shouldUseAlgoDashboard]);

  // Compute day range (UTC) for strategies (ALGO only)
  const dayFromTo = useMemo(() => {
    const iso = dateInputISO;
    const from = `${iso}T00:00:00.000Z`;
    const to = `${iso}T23:59:59.999Z`;
    return { from, to };
  }, [dateInputISO]);

  // Load strategy-wise P&L when day changes — ALGO only
  useEffect(() => {
    if (!shouldUseAlgoDashboard) return;
    let cancelled = false;
    (async () => {
      try {
        setStrategiesLoading(true);
        setStrategiesError(null);
        const r = await api.get("/strategies/pnl", {
          params: withUser({ from: dayFromTo.from, to: dayFromTo.to }),
        });
        const rows: StrategyPnL[] = Array.isArray(r.data?.data) ? r.data.data : [];
        if (!cancelled) setStrategies(rows);
      } catch (e: any) {
        if (!cancelled) {
          setStrategies([]);
          setStrategiesError(e?.message || "Couldn’t load strategies.");
        }
      } finally {
        if (!cancelled) setStrategiesLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dayFromTo.from, dayFromTo.to, shouldUseAlgoDashboard]);

  // sorting + filtered list for strategies (uses top search)
  const strategiesView = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const arr = strategies.filter((s) => !q || s.strategyName.toLowerCase().includes(q));
    const sorters: Record<typeof sortBy, (a: StrategyPnL, b: StrategyPnL) => number> = {
      pnl: (a, b) => a.pnl - b.pnl,
      winRate: (a, b) => a.winRatePct - b.winRatePct,
      trades: (a, b) => a.orders - b.orders,
    };
    const cmp = sorters[sortBy];
    arr.sort((a, b) => {
      const v = cmp(a, b);
      return sortDir === "desc" ? -v : v;
    });
    return arr;
  }, [strategies, searchQuery, sortBy, sortDir]);

  const hasAllBundle = useMemo(
    () => hasBundleProduct || hasBundleViaComponents,
    [hasBundleProduct, hasBundleViaComponents]
  );
  const ownsFiiDii = ownedKeys.has("fii_dii_data");
  const showFiiDiiInQuickAccess = hasAllBundle || ownsFiiDii;

  const algoEntitlements = useMemo(
    () => myProducts.filter((p) => p.key === "algo_simulator"),
    [myProducts]
  );

  const algoVariantBadges = useMemo(() => {
    const list: MyVariant[] = [];
    for (const p of algoEntitlements) {
      if (Array.isArray(p.variants) && p.variants.length) list.push(...p.variants);
      else if (p.variant) list.push(p.variant);
    }
    const map = new Map<string, MyVariant>();
    for (const v of list) {
      const k = (v.key || "").toLowerCase();
      if (!map.has(k)) map.set(k, v);
    }
    return Array.from(map.values());
  }, [algoEntitlements]);

  const productsUI: ProductUI[] = useMemo(() => {
    const ui: ProductUI[] = [];

    if (hasAllBundle) {
      const components = bundleComponentKeys.map((key) => ({
        key,
        label: componentLabelMap[key]?.label || key,
        icon: componentLabelMap[key]?.icon || <span className="h-4 w-4" />,
      }));

      ui.push({
        id: "bundle-owned",
        name: "Trader's Essential Bundle (2-in-1)",
        description: "All 2 premium tools for the price of one",
        icon: <PackageOpen className="h-6 w-6" />,
        stats: "2 tools included",
        change: "+12.4%",
        link: "/bundle",
        gradient: "from-blue-500 to-cyan-400",
        trend: "up",
        newFeature: false,
        bundleComponents: components,
      });
    } else {
      const ownedComponents = myProducts.filter((p) => bundleComponentKeys.includes(p.key));
      ownedComponents.forEach((p) => {
        const label = componentLabelMap[p.key]?.label ?? p.name;
        ui.push({
          id: p.productId,
          name: label,
          description: "Included in your plan",
          icon: componentLabelMap[p.key]?.icon ?? <span className="h-6 w-6" />,
          stats: "Active",
          change: "+2.3%",
          link: p.route || componentRouteMap[p.key] || "#",
          gradient: "from-indigo-500 to-sky-400",
          trend: "up",
          newFeature: false,
        });
      });
    }

    if (ownedKeys.has("algo_simulator")) {
      const algo = myProducts.find((p) => p.key === "algo_simulator");
      const chips = algoVariantBadges.map((v) => ({
        key: v.key,
        label: v.name,
        price: prettyINR(v.priceMonthly ?? undefined),
      }));

      ui.push({
        id: algo?.productId || "algo-owned",
        name: "ALGO Simulator",
        description: "Advanced backtesting and execution-ready strategies",
        icon: <Activity className="h-6 w-6" />,
        stats: chips.length ? `${chips.length} plan${chips.length > 1 ? "s" : ""} active` : "Active",
        change: "+15.7%",
        link: algo?.route || "/comming-soon",
        gradient: "from-purple-500 to-violet-400",
        trend: "up",
        newFeature: true,
        algoVariants: chips,
      });
    }

    if (!hasAllBundle && ownsJournalingSolo) {
      const j = myProducts.find((p) => p.key === "journaling_solo");
      ui.push({
        id: j?.productId || "journal-solo",
        name: "Journaling (Solo)",
        description: "Personal trade journaling & analytics",
        icon: <Users className="h-6 w-6" />,
        stats: "Active",
        change: "+3.1%",
        link: j?.route || "/journal",
        gradient: "from-emerald-500 to-green-400",
        trend: "up",
        newFeature: false,
      });
    }

    return ui;
  }, [myProducts, hasAllBundle, ownsJournalingSolo, ownedKeys, algoVariantBadges]);

  // ✅ Use these three computed links in children
  const journalingLink =
    myProducts.find((p) => p.key === "journaling")?.route ||
    myProducts.find((p) => p.key === "journaling_solo")?.route ||
    "/journal";

  const fiiDiiLink =
    myProducts.find((p) => p.key === "fii_dii_data")?.route ||
    componentRouteMap["fii_dii_data"] ||
    "/fii-dii";

  const algoLink =
    myProducts.find((p) => p.key === "algo_simulator")?.route || "/comming-soon";

  // ---- Stat cards derived from summary ----
  const statCards: Stat[] = [
    {
      title: "Triggered Trades",
      value: summary ? String(summary.totalTrades) : "—",
      icon: <Activity className="h-5 w-5" />,
      trend: "up",
      change: "",
      gradient: "from-blue-500 to-cyan-400",
      period: isToday ? "Today" : "Archived Day",
      progress: 85,
    },
    {
      title: "Portfolio Value",
      value:
        summary ? prettyINR(summary.totalPnl) ?? String(summary.totalPnl) : "—",
      icon: <DollarSign className="h-5 w-5" />,
      trend: summary && summary.totalPnl >= 0 ? "up" : "down",
      change: "",
      gradient: "from-emerald-500 to-green-400",
      period: "Total P&L (ALGO)",
      progress: 72,
    },
    {
      title: "Live Positions",
      value: summary ? String(summary.openPositions) : "—",
      icon: <TrendingUp className="h-5 w-5" />,
      trend: "up",
      change: "",
      gradient: "from-purple-500 to-violet-400",
      period: isToday ? "Open" : "Closed for Day",
      progress: 91,
    },
    {
      title: "Success Rate",
      value: summary ? `${summary.successRatePct.toFixed(1)}%` : "—",
      icon: <Users className="h-5 w-5" />,
      trend: "up",
      change: "",
      gradient: "from-amber-500 to-orange-400",
      period: "Closed ALGO Trades",
      progress: Math.min(100, Math.round(summary ? summary.successRatePct : 0)),
    },
    {
      title: "R:R Ratio",
      value: summary ? `${summary.riskReward.toFixed(2)}` : "—",
      icon: <BarChart3 className="h-5 w-5" />,
      trend: "up",
      change: "",
      gradient: "from-pink-500 to-rose-400",
      period: "Closed ALGO Trades",
      progress: 60,
    },
  ];

  const loadTriggeredTrades = async (opts?: { strategy?: string }) => {
    try {
      setTradesError(null);
      setTradesLoading(true);

      if (opts?.strategy) {
        const r = await api.get("/strategies/trades", {
          params: withUser({
            from: dayFromTo.from,
            to: dayFromTo.to,
            strategy: opts.strategy,
            flat: true,
          }),
        });

        const rows: TriggeredTrade[] = (Array.isArray(r.data?.data) ? r.data.data : []).map((x: any) => ({
          id: x.id ?? x.uid,
          symbol: x.symbol,
          side: x.side,
          qty: x.qty,
          price: x.price,
          strategy: x.strategyName ?? null,
          ts: x.t,
        }));

        setTrades(rows);
        return;
      }

      const r = await api.get("/orders/triggered", {
        params: withUser({ from: dayFromTo.from, to: dayFromTo.to }),
      });

      const rows: TriggeredTrade[] = (Array.isArray(r.data?.data) ? r.data.data : []).map((x: any) => ({
        id: x.id ?? x.uid,
        symbol: x.symbol,
        side: x.side,
        qty: x.qty,
        price: x.price,
        strategy: x.strategy ?? x.tag ?? null,
        ts: x.ts ?? x.t,
      }));

      setTrades(rows);
    } catch (e: any) {
      setTrades([]);
      setTradesError(e?.message || "Couldn’t load triggered trades.");
    } finally {
      setTradesLoading(false);
    }
  };

  const loadLivePositions = async () => {
    try {
      setPositionsError(null);
      setPositionsLoading(true);
      const r = await api.get("/positions/open", {
        params: withUser({ from: dayFromTo.from, to: dayFromTo.to }),
      });
      const rows: LivePosition[] = (Array.isArray(r.data?.data) ? r.data.data : []).map(
        (x: any) => ({
          id: x.id ?? `${x.symbol}|${x.side ?? "NA"}`,
          symbol: x.symbol,
          qty: x.qty,
          avgPrice: x.avgEntry ?? 0,
          ts: x.lastFillMs ?? null,
        })
      );
      setPositions(rows);
    } catch (e: any) {
      setPositions([]);
      setPositionsError(e?.message || "Couldn’t load live positions.");
    } finally {
      setPositionsLoading(false);
    }
  };

  /* ===== Build expiry items & show UI modal (0..7 days left) ===== */
  const expiryItems: ExpiryItem[] = useMemo(() => {
    const items: ExpiryItem[] = [];

    for (const p of myProducts as any[]) {
      const endsAt: string | undefined =
        p.endsAt ||
        p.expiresAt ||
        p.subscription?.endsAt ||
        p.license?.endsAt ||
        p.meta?.endsAt ||
        p.variant?.endsAt;

      if (!endsAt) continue;

      const name: string =
        p.name ||
        componentLabelMap[p.key as keyof typeof componentLabelMap]?.label ||
        "Your subscription";

      const id: string = p.productId || p.id || p.key || name;

      const status: string | undefined =
        p.status || p.subscriptionStatus || p.entitlementStatus || "active";

      // ✅ Prefer explicit renewal/manage URLs; default to /pricing?renew=1&productKey=...&variantKey=...
      const qs = new URLSearchParams({
        renew: "1",
        productKey: String((p.key || "").toLowerCase()),
      });
      if (p?.variant?.key) qs.set("variantKey", String(p.variant.key));
      const renewUrl: string | undefined =
        (p as any).renewUrl ||
        (p as any).manageUrl ||
        (p as any).billingUrl ||
        `/pricing?${qs.toString()}`;

      items.push({ id: String(id), name: String(name), endsAt: String(endsAt), status, renewUrl });
    }

    // de-dup by id
    const unique: Record<string, ExpiryItem> = {};
    for (const it of items) unique[it.id] = it;
    return Object.values(unique);
  }, [myProducts]);

  // ✅ nudge flag to recompute queue once right after successful login
  const [kickExpiry, setKickExpiry] = useState(0);

  // ✅ one-time clear of today's seen flags if we *just logged in*
  useEffect(() => {
    if (loadingEntitlements) return;

    const justLoggedIn = sessionStorage.getItem('__justLoggedIn') === '1';
    if (!justLoggedIn) return;

    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    for (const it of expiryItems) {
      try {
        localStorage.removeItem(`${today}::expiry::${it.id}`);
      } catch {}
    }
    sessionStorage.removeItem('__justLoggedIn');
    setKickExpiry((n) => n + 1); // force items identity change below
  }, [loadingEntitlements, expiryItems]);

  const {
    current: expiryCurrent,
    visible: showExpiryModal,
    dismiss: closeExpiryModal,
    renew: renewExpiry,
  } = useExpiryQueue({
    // change identity when kickExpiry flips so the hook recomputes immediately after login
    items: kickExpiry ? expiryItems.slice() : expiryItems,
    maxDays: 7,
    // debug: true,
  });

  // Navigation actions
  const goPrev = () => {
    const prev = getPrevKey(selectedKey);
    if (prev) setSelectedKey(prev);
  };
  const goNext = () => {
    const next = getNextKey(selectedKey);
    if (next) setSelectedKey(next);
  };

  return (
    <div className="flex h-screen bg-gray-50/50">
      {/* Sidebar */}
      <Sidebar
        isSidebarOpen={isSidebarOpen}
        toggleSidebar={() => setIsSidebarOpen((v) => !v)}
        myProducts={myProducts}
        ownedKeys={ownedKeys}
        hasAllBundle={hasAllBundle}
        journalingLink={journalingLink}
        algoLink={algoLink}
        onLogout={logout}
        userName={user?.name}
      />

      {/* Mobile overlay */}
      {isSidebarOpen && (
        <div
          className="md:hidden fixed inset-0 bg-gray-600 bg-opacity-50 z-40"
          onClick={() => setIsSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <HeaderBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onToggleSidebar={() => setIsSidebarOpen((v) => !v)}
          dateLabel={undefined}
          onHomeClick={() => navigate("/")}
          onBellClick={() => setOpenInbox(true)}
          notifications={notifications}
        />

        <main className="flex-1 overflow-auto">
          <div className="px-4 sm:px-6 lg:px-8 py-8">
            <div className="max-w-7xl mx-auto">
              {loadingEntitlements ? (
                <div className="text-sm text-slate-600">Loading dashboard…</div>
              ) : shouldUseAlgoDashboard ? (
                <AlgoDashboardBody
                  userName={user?.name}
                  isToday={isToday}
                  selectedKey={selectedKey}
                  dateInputISO={dateInputISO}
                  setDateInputISO={setDateInputISO}
                  availableKeys={availableKeys}
                  availableListAsc={availableListAsc}
                  dateInputNoData={dateInputNoData}
                  setDateInputNoData={setDateInputNoData}
                  dateKeyToISO={dateKeyToISO}
                  isoToDateKey={isoToDateKey}
                  todayISO={todayISO}
                  canGoPrev={canGoPrev}
                  canGoNext={canGoNext}
                  goPrev={goPrev}
                  goNext={goNext}
                  setSelectedKey={setSelectedKey}
                  summaryError={summaryError}
                  statCards={statCards}
                  strategiesLoading={strategiesLoading}
                  strategiesError={strategiesError}
                  strategiesView={strategiesView}
                  sortBy={sortBy}
                  sortDir={sortDir}
                  setSortBy={setSortBy}
                  setSortDir={setSortDir}
                  productsUI={productsUI}
                  loadingEntitlements={loadingEntitlements}
                  tradesLoading={tradesLoading}
                  tradesError={tradesError}
                  trades={trades}
                  positionsLoading={positionsLoading}
                  positionsError={positionsError}
                  positions={positions}
                  loadTriggeredTrades={loadTriggeredTrades}
                  loadLivePositions={loadLivePositions}
                />
              ) : shouldUseBundleDashboard ? (
                <BundleDashboardBody
                  journalingLink={journalingLink}
                  fiiDiiLink={fiiDiiLink}
                  ownsFiiDii={ownsFiiDii}
                  showFiiDiiInQuickAccess={showFiiDiiInQuickAccess}
                  loadingEntitlements={loadingEntitlements}
                  productsUI={productsUI}
                />
              ) : (
                <div className="bg-white rounded-2xl border border-slate-100 p-8 text-slate-700">
                  <h2 className="text-xl font-bold text-slate-900 mb-2">
                    No products yet
                  </h2>
                  <p className="mb-4">
                    Buy the <span className="font-semibold">Trader’s Essential Bundle</span> or the{" "}
                    <span className="font-semibold">ALGO Simulator</span> to unlock this
                    dashboard.
                  </p>
                  <a
                    href="/pricing"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
                  >
                    <PackageOpen className="h-4 w-4" />
                    Go to Pricing
                  </a>
                </div>
              )}
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 mt-auto">
          <div className="px-4 sm:px-6 lg:px-8 py-6">
            <div className="max-w-7xl mx-auto flex flex-col lg:flex-row justify-between items-center space-y-4 lg:space-y-0">
              <div className="flex items-center space-x-6">
                <p className="text-sm text-gray-600">
                  © {new Date().getFullYear()} Upholic. Empowering traders worldwide.
                </p>
                <div className="hidden sm:flex items-center space-x-1 text-xs text-gray-500">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span>Algo systems operational</span>
                </div>
              </div>

              <div className="flex items-center space-x-6 text-sm">
                <Link
                  to="/terms"
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  Terms
                </Link>
                <Link
                  to="/privacy"
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  Privacy
                </Link>
                <Link
                  to="/contact-us"
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  Contact Us
                </Link>
              </div>
            </div>
          </div>
        </footer>
      </div>

      {/* Optional inbox drawer/modal for the bell */}
      {openInbox && (
        <div
          className="fixed inset-0 z-[100] bg-black/40"
          onClick={() => setOpenInbox(false)}
        />
      )}

      {/* 🔔 Expiry UI popup (shown when there’s something expiring soon) */}
      {showExpiryModal && expiryCurrent && (
        <ExpiryModal
          open
          item={expiryCurrent}
          onDismiss={closeExpiryModal}
          onRenew={renewExpiry}
        />
      )}
    </div>
  );
};

export default Dashboard;
