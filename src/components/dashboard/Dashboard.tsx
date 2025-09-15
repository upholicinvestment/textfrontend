import { useEffect, useMemo, useState, useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import upholictech from "../../assets/Upholictech.png";
import { BarChart3, TrendingUp, Bot, BookOpen, Building2, Home as HomeIcon, Calendar, LogOut, ArrowUpRight, ArrowDownRight, Clock, Bell, Search, Menu, X, ChevronRight, ChevronDown, Activity, DollarSign, Users, PackageOpen, } from "lucide-react";
import api from "../../api";

// ---------- Types returned by /users/me/products ----------
interface MyVariant {
  variantId: string;
  key: string; // starter | pro | swing
  name: string;
  priceMonthly?: number | null;
  interval?: string | null;
}
interface MyProduct {
  productId: string;
  key: string; // component keys, algo_simulator, journaling_solo, etc.
  name: string;
  route: string; // e.g. "/fii-dii"
  hasVariants: boolean;
  forSale: boolean;
  status: string; // "active"
  startedAt: string | null;
  endsAt: string | null;
  variant: MyVariant | null;
  /** if backend groups multiple entitlements into one product, all variants arrive here */
  variants?: MyVariant[];
}

// ---------- Summary & Strategies ----------
type Summary = {
  totalPnl: number;
  totalTrades: number;
  openPositions: number;
  successRatePct: number;
  riskReward: number;
};
type StrategyPnL = {
  strategyName: string;
  pnl: number;
  orders: number;
  roundTrips: number;
  wins: number;
  losses: number;
  winRatePct: number;
  rnr: number | null;
  openPositions: number;
};
type SummaryDoc = Summary & {
  dateKey: string; // "DD-MMM-YYYY"
  ts?: string | Date;
};

// ---------- UI Types ----------
interface ProductUI {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  stats: string;
  change: string;
  link: string;
  gradient: string;
  trend: "up" | "down";
  newFeature: boolean;
  bundleComponents?: { key: string; label: string; icon: React.ReactNode }[];
  algoVariants?: { key: string; label: string; price?: string }[];
}

interface ActivityItem {
  id: number;
  product: string;
  action: string;
  time: string;
  icon: React.ReactNode;
  type: string;
  priority: "high" | "medium" | "low";
}

interface Stat {
  title: string;
  value: string;
  icon: React.ReactNode;
  trend: "up" | "down";
  change: string;
  gradient: string;
  period: string;
  progress: number;
}

// ---------- Date helpers (IST) ----------
const MONTHS_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const istTodayParts = () => {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const dd = parts.find((p) => p.type === "day")?.value ?? "01";
  const mm = parts.find((p) => p.type === "month")?.value ?? "01";
  const yyyy = parts.find((p) => p.type === "year")?.value ?? "1970";
  return { dd, mm, yyyy };
};
const todayDateKeyIST = (): string => {
  const { dd, mm, yyyy } = istTodayParts();
  const monShort = MONTHS_SHORT[Number(mm) - 1] ?? "Jan";
  return `${dd}-${monShort}-${yyyy}`;
};
const todayISO = (): string => {
  const { dd, mm, yyyy } = istTodayParts();
  return `${yyyy}-${mm}-${dd}`;
};
// "DD-MMM-YYYY" -> "YYYY-MM-DD"
const dateKeyToISO = (dk: string): string => {
  if (!/^\d{2}-[A-Za-z]{3}-\d{4}$/.test(dk)) return todayISO();
  const [dd, mon, yyyy] = dk.split("-");
  const mIdx = MONTHS_SHORT.indexOf(mon);
  const mm = String(mIdx + 1).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};
// "YYYY-MM-DD" -> "DD-MMM-YYYY"
const isoToDateKey = (iso: string): string => {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return todayDateKeyIST();
  const [, yyyy, mm, dd] = m;
  const monShort = MONTHS_SHORT[Number(mm) - 1] ?? "Jan";
  return `${dd}-${monShort}-${yyyy}`;
};
// Sort key for "DD-MMM-YYYY"
const dateKeyStamp = (dk: string): number => {
  if (!/^\d{2}-[A-Za-z]{3}-\d{4}$/.test(dk)) return 0;
  const [dd, mon, yyyy] = dk.split("-");
  const mIdx = MONTHS_SHORT.indexOf(mon);
  const d = new Date(Date.UTC(Number(yyyy), Math.max(0, mIdx), Number(dd)));
  return d.getTime();
};

const componentLabelMap: Record<
  string,
  { label: string; icon: React.ReactNode }
> = {
  journaling: { label: "Journaling", icon: <BookOpen className="h-4 w-4" /> },
  fii_dii_data: {
    label: "FII/DII Data",
    icon: <Building2 className="h-4 w-4" />,
  },
};

const componentRouteMap: Record<string, string> = {
  journaling: "/journal",
  fii_dii_data: "/fii-dii",
};

const bundleComponentKeys = ["journaling", "fii_dii_data"];

const prettyINR = (n?: number | null) =>
  typeof n === "number" ? `₹${n.toLocaleString("en-IN")}` : undefined;

const Dashboard = () => {
  const { user, logout } = useContext(AuthContext);

  // ---------- Sidebar / UI ----------
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [bundleOpen, setBundleOpen] = useState(false);
  const [algoOpen, setAlgoOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

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
  // Suppress unused warnings until you render a strategies UI
  void strategies;
  void strategiesLoading;
  void strategiesError;

  // ---------- Helpers ----------
  const withUser = <T extends Record<string, any>>(params?: T) => {
    const uid = user?.id?.trim();
    return uid ? { ...(params || {}), userId: uid } : params || {};
  };

  // Attach X-User-Id header for Express
  useEffect(() => {
    const uid = user?.id?.trim();
    if (uid) {
      api.defaults.headers.common["X-User-Id"] = uid;
    } else {
      delete api.defaults.headers.common["X-User-Id"];
    }
  }, [user?.id]);

  // Load entitlements
  useEffect(() => {
    (async () => {
      try {
        setLoadingEntitlements(true);
        const res = await api.get("/users/me/products", { params: withUser() });
        const items: MyProduct[] = Array.isArray(res.data?.items)
          ? res.data.items
          : [];
        setMyProducts(items);
      } catch (e) {
        console.error("Failed to load my products:", e);
        setMyProducts([]);
      } finally {
        setLoadingEntitlements(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load summary history (latest N days)
  useEffect(() => {
    (async () => {
      try {
        const r = await api.get("/summary/history?limit=30", {
          params: withUser(),
        });
        const arr = Array.isArray(r.data?.data) ? r.data.data : [];
        const sorted = [...arr].sort(
          (a: SummaryDoc, b: SummaryDoc) =>
            dateKeyStamp(a.dateKey) - dateKeyStamp(b.dateKey)
        );
        setHistory(sorted);
      } catch (e) {
        console.error("Failed to load /summary/history:", e);
        setHistory([]);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Available keys & helpers
  const availableKeys = useMemo(
    () => new Set(history.map((h) => h.dateKey)),
    [history]
  );
  const availableListAsc = useMemo(
    () => history.map((h) => h.dateKey),
    [history]
  );
  const newestKey = availableListAsc[availableListAsc.length - 1];

  const getPrevKey = (current: string): string | null => {
    if (isToday || current === "today") {
      return newestKey ?? null;
    }
    const idx = availableListAsc.indexOf(current);
    if (idx <= 0) return null;
    return availableListAsc[idx - 1];
  };
  const getNextKey = (current: string): string | null => {
    if (current === "today") return null;
    const idx = availableListAsc.indexOf(current);
    if (idx === -1) return null;
    if (idx === availableListAsc.length - 1) {
      return "today";
    }
    return availableListAsc[idx + 1];
  };

  // Single declaration of navigation booleans
  const canGoPrev = !!getPrevKey(selectedKey);
  const canGoNext = !!getNextKey(selectedKey);

  // Keep date input in sync
  useEffect(() => {
    if (isToday) setDateInputISO(todayISO());
    else setDateInputISO(dateKeyToISO(selectedKey));
  }, [selectedKey, isToday]);

  // Load summary (today live or by-date) with polling for today
  useEffect(() => {
    let isMounted = true;
    let timer: any = null;

    const loadToday = async () => {
      try {
        setSummaryError(null);
        const r = await api.get("/summary", { params: withUser() });
        if (isMounted) setSummary(r.data as Summary);
      } catch (e) {
        if (isMounted) {
          console.error("Failed to load /summary:", e);
          setSummary(null);
          setSummaryError("Couldn’t load summary.");
        }
      }
    };

    const loadByDate = async (dateKey: string) => {
      try {
        setSummaryError(null);
        const r = await api.get("/summary/by-date", {
          params: withUser({ dateKey }),
        });
        if (isMounted) setSummary(r.data?.data as Summary);
      } catch (e) {
        if (isMounted) {
          console.error("Failed to load /summary/by-date:", e);
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
  }, [selectedKey, isToday]);

  // Compute day range (UTC) for strategies
  const dayFromTo = useMemo(() => {
    const iso = dateInputISO;
    const from = `${iso}T00:00:00.000Z`;
    const to = `${iso}T23:59:59.999Z`;
    return { from, to };
  }, [dateInputISO]);

  // Load strategy-wise P&L when day changes
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setStrategiesLoading(true);
        setStrategiesError(null);
        const r = await api.get("/strategies/pnl", {
          params: withUser({ from: dayFromTo.from, to: dayFromTo.to }),
        });
        const rows: StrategyPnL[] = Array.isArray(r.data?.data)
          ? r.data.data
          : [];
        if (!cancelled) setStrategies(rows);
      } catch (e: any) {
        if (!cancelled) {
          console.error("Failed to load /strategies/pnl:", e);
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
  }, [dayFromTo.from, dayFromTo.to]);

  // ---- Products derived state ----
  const ownedKeys = useMemo(
    () => new Set(myProducts.map((p) => p.key)),
    [myProducts]
  );
  const hasAllBundle = useMemo(
    () => bundleComponentKeys.every((k) => ownedKeys.has(k)),
    [ownedKeys]
  );
  const ownsAlgo = ownedKeys.has("algo_simulator");
  const hasBundleJournaling = ownedKeys.has("journaling");
  const ownsJournalingSolo = ownedKeys.has("journaling_solo");
  const showSmartJournalingStandalone =
    ownsJournalingSolo && !hasBundleJournaling;

  const algoEntitlements = useMemo(
    () => myProducts.filter((p) => p.key === "algo_simulator"),
    [myProducts]
  );

  const algoVariantBadges = useMemo(() => {
    const list: MyVariant[] = [];
    for (const p of algoEntitlements) {
      if (Array.isArray(p.variants) && p.variants.length)
        list.push(...p.variants);
      else if (p.variant) list.push(p.variant);
    }
    const map = new Map<string, MyVariant>();
    for (const v of list) {
      const k = (v.key || "").toLowerCase();
      if (!map.has(k)) map.set(k, v);
    }
    return Array.from(map.values());
  }, [algoEntitlements]);

  const variantBadgeClass = (key: string) => {
    const k = (key || "").toLowerCase();
    switch (k) {
      case "pro":
        return "bg-yellow-100 text-yellow-800";
      case "starter":
        return "bg-indigo-100 text-indigo-700";
      case "swing":
        return "bg-emerald-100 text-emerald-700";
      default:
        return "bg-white text-[#1a237e]";
    }
  };

  const productsUI: ProductUI[] = useMemo(() => {
    const ui: ProductUI[] = [];

    if (hasAllBundle) {
      const components = bundleComponentKeys.map((key) => ({
        key,
        label: componentLabelMap[key]?.label || key,
        icon:
          componentLabelMap[key]?.icon || <PackageOpen className="h-4 w-4" />,
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
      const ownedComponents = myProducts.filter((p) =>
        bundleComponentKeys.includes(p.key)
      );
      ownedComponents.forEach((p) => {
        const label = componentLabelMap[p.key]?.label ?? p.name;
        const icon = componentLabelMap[p.key]?.icon ?? (
          <PackageOpen className="h-6 w-6" />
        );
        ui.push({
          id: p.productId,
          name: label,
          description: "Included in your plan",
          icon,
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
        icon: <Bot className="h-6 w-6" />,
        stats: chips.length
          ? `${chips.length} plan${chips.length > 1 ? "s" : ""} active`
          : "Active",
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
        icon: <BookOpen className="h-6 w-6" />,
        stats: "Active",
        change: "+3.1%",
        link: j?.route || "/journal",
        gradient: "from-emerald-500 to-green-400",
        trend: "up",
        newFeature: false,
      });
    }

    return ui;
  }, [
    myProducts,
    hasAllBundle,
    ownsJournalingSolo,
    ownedKeys,
    algoVariantBadges,
  ]);

  const recentActivity: ActivityItem[] = [
    {
      id: 1,
      product: "Technical Scanner",
      action: "Nifty 50 breakout pattern detected",
      time: "2 mins ago",
      icon: <BarChart3 className="h-4 w-4" />,
      type: "scan",
      priority: "high",
    },
    {
      id: 2,
      product: "Smart Journaling",
      action: "New trade recorded: RELIANCE (+2.4%)",
      time: "15 mins ago",
      icon: <BookOpen className="h-4 w-4" />,
      type: "trade",
      priority: "medium",
    },
    {
      id: 3,
      product: "ALGO Simulator",
      action: "PRO strategy execution: 94.2% accuracy",
      time: "32 mins ago",
      icon: <Bot className="h-4 w-4" />,
      type: "backtest",
      priority: "high",
    },
    {
      id: 4,
      product: "FII/DII",
      action: "Major FII buying in Banking sector",
      time: "1 hour ago",
      icon: <Building2 className="h-4 w-4" />,
      type: "alert",
      priority: "high",
    },
  ];

  const filteredActivities =
    activeFilter === "All"
      ? recentActivity
      : recentActivity.filter((a) => a.type === activeFilter.toLowerCase());

  const toggleSidebar = () => setIsSidebarOpen((v) => !v);
  const handleFilterChange = (filter: string) => setActiveFilter(filter);

  const renderProgressBar = (
    progress: number,
    gradient: string,
    title: string
  ) => {
    const clamped = Math.max(0, Math.min(100, Math.round(progress)));
    return (
      <div className="mt-4 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full bg-gradient-to-r ${gradient}`}
          style={{ width: `${clamped}%` }}
          role="progressbar"
          aria-valuenow={clamped}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${title} progress: ${clamped}%`}
        />
      </div>
    );
  };

  const sidebarBundleComponents = (
    hasAllBundle
      ? bundleComponentKeys
      : myProducts
          .filter((p) => bundleComponentKeys.includes(p.key))
          .map((p) => p.key)
  ).map((key) => ({
    key,
    label: componentLabelMap[key]?.label || key,
    icon: componentLabelMap[key]?.icon || <PackageOpen className="h-4 w-4" />,
    href:
      myProducts.find((p) => p.key === key)?.route ||
      componentRouteMap[key] ||
      "#",
  }));

  const algoLink =
    myProducts.find((p) => p.key === "algo_simulator")?.route ||
    "/comming-soon";
  const journalingLink =
    myProducts.find((p) => p.key === "journaling")?.route ||
    myProducts.find((p) => p.key === "journaling_solo")?.route ||
    "/journal";

  const algoVariantHref = (key: string) =>
    `${algoLink}?plan=${encodeURIComponent(key)}`;

  // ---- Stat cards derived from live/by-date summary ----
  const statCards: Stat[] = [
    {
      title: "Trade Triggered",
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
      value: summary
        ? prettyINR(summary.totalPnl) ?? String(summary.totalPnl)
        : "—",
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
      <div
        className={`${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 fixed md:static inset-y-0 left-0 z-50 w-72 
        bg-gradient-to-b from-[#1a237e] to-[#4a56d2] shadow-xl md:shadow-none transition-transform duration-300 ease-in-out`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-[#7986cb]/30">
            <div className="flex-1 flex justify-center">
              <img src={upholictech} alt="Upholic" className="h-12 w-auto" />
            </div>
            <button
              onClick={toggleSidebar}
              className="md:hidden p-2 rounded-lg hover:bg-[#1a237e]/30"
              aria-label="Close sidebar"
            >
              <X className="h-5 w-5 text-white" />
            </button>
          </div>

          {/* Nav */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            <div className="mb-4">
              <a
                href="#"
                className="flex items-center px-3 py-3 text-sm font-semibold text-white bg-white/20 rounded-xl border border-white/30"
                aria-current="page"
              >
                <HomeIcon className="mr-3 h-5 w-5 text-white" />
                Dashboard
              </a>
            </div>

            <div className="space-y-1">
              <h3 className="px-3 text-xs font-semibold text-white/70 uppercase tracking-wider mb-3">
                Trading Products
              </h3>

              {/* Bundle / Owned Components */}
              {(hasAllBundle || sidebarBundleComponents.length > 0) && (
                <>
                  <button
                    type="button"
                    onClick={() => setBundleOpen((v) => !v)}
                    aria-expanded={bundleOpen}
                    aria-controls="bundle-submenu"
                    className="w-full group flex items-center justify-between px-3 py-3 text-left text-sm font-medium text-white rounded-xl hover:bg-white/10 transition-all duration-200"
                  >
                    <div className="flex items-center">
                      <div className="p-2 rounded-lg bg-white/10 text-white mr-3">
                        <PackageOpen className="h-6 w-6" />
                      </div>
                      <span className="truncate">
                        {hasAllBundle
                          ? "Trader's Essential Bundle"
                          : "Your Tools"}
                      </span>
                    </div>
                    <ChevronDown
                      className={`h-4 w-4 text-white transition-transform ${
                        bundleOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {bundleOpen && (
                    <div
                      id="bundle-submenu"
                      className="ml-4 mt-1 space-y-1 border-l border-white/20 pl-3"
                    >
                      {sidebarBundleComponents.map((c) => (
                        <a
                          key={c.key}
                          href={c.href}
                          className="flex items-center justify-between px-2 py-2 text-sm text-white/90 rounded-lg hover:bg-white/10"
                        >
                          <span className="flex items-center gap-2">
                            {c.icon}
                            {c.label}
                          </span>
                          <ChevronRight className="h-4 w-4 opacity-50" />
                        </a>
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* ALGO Simulator */}
              {ownsAlgo && (
                <>
                  <button
                    type="button"
                    onClick={() => setAlgoOpen((v) => !v)}
                    aria-expanded={algoOpen}
                    aria-controls="algo-submenu"
                    className="w-full group flex items-center justify-between px-3 py-3 text-left text-sm font-medium text-white rounded-xl hover:bg-white/10 transition-all duration-200"
                  >
                    <div className="flex items-center">
                      <div className="p-2 rounded-lg bg-white/10 text-white mr-3">
                        <Bot className="h-6 w-6" />
                      </div>
                      <span className="truncate">ALGO Simulator</span>
                    </div>
                    <ChevronDown
                      className={`h-4 w-4 text-white transition-transform ${
                        algoOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {algoOpen && (
                    <div
                      id="algo-submenu"
                      className="ml-4 mt-1 space-y-1 border-l border-white/20 pl-3"
                    >
                      {algoVariantBadges.length > 0 ? (
                        algoVariantBadges.map((v) => (
                          <a
                            key={v.key}
                            href={algoVariantHref(v.key)}
                            className="flex items-center justify-between px-2 py-2 text-sm text-white/90 rounded-lg hover:bg-white/10"
                            title={v.name}
                          >
                            <span className="flex items-center gap-2">
                              <Bot className="h-4 w-4" />
                              {v.name}
                            </span>
                            <span
                              className={`px-2 py-0.5 text-[10px] rounded-full ${variantBadgeClass(
                                v.key
                              )}`}
                            >
                              {v.key.toUpperCase()}
                            </span>
                          </a>
                        ))
                      ) : (
                        <a
                          href={algoLink}
                          className="flex items-center justify-between px-2 py-2 text-sm text-white/90 rounded-lg hover:bg-white/10"
                        >
                          <span className="flex items-center gap-2">
                            <Bot className="h-4 w-4" />
                            Open ALGO
                          </span>
                          <ChevronRight className="h-4 w-4 opacity-50" />
                        </a>
                      )}
                    </div>
                  )}
                </>
              )}

              {/* Smart Journaling (standalone) */}
              {showSmartJournalingStandalone && (
                <a
                  href={journalingLink}
                  className="group flex items-center justify-between px-3 py-3 text-sm font-medium text-white rounded-xl hover:bg-white/10 transition-all duration-200"
                  aria-label="Go to Smart Journaling"
                >
                  <div className="flex items-center">
                    <div className="p-2 rounded-lg bg-white/10 text-white mr-3">
                      <BookOpen className="h-6 w-6" />
                    </div>
                  </div>
                  <div className="flex-1 flex items-center justify-between">
                    <span className="truncate">Smart Journaling</span>
                    <ChevronRight className="h-4 w-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </a>
              )}
            </div>
          </nav>

          {/* Buy Products */}
          <div className="px-4 pb-4">
            <a
              href="/pricing"
              className="w-full inline-flex items-center justify-center gap-2 px-3 py-3 text-sm font-semibold text-[#1a237e] bg-white rounded-xl border border-white/30 hover:bg-white/90 transition-all duration-200 shadow-sm"
              aria-label="Buy products"
            >
              <PackageOpen className="h-5 w-5" />
              Buy Products
            </a>
          </div>

          {/* Profile */}
          <div className="p-4 border-t border-[#7986cb]/30">
            <div className="flex items-center space-x-3 p-3 bg-white/10 rounded-xl">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-[#1a237e] font-semibold text-sm">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">
                  {user?.name}
                </p>
                <p className="text-xs text-white/70">Member</p>
              </div>
              <button
                className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
                aria-label="Logout"
                onClick={logout}
              >
                <LogOut className="h-4 w-4 text-white" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile overlay */}
      {isSidebarOpen && (
        <div
          className="md:hidden fixed inset-0 bg-gray-600 bg-opacity-50 z-40"
          onClick={toggleSidebar}
          aria-hidden="true"
        />
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-30">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-4">
                <button
                  onClick={toggleSidebar}
                  className="md:hidden p-2 rounded-lg hover:bg-gray-100"
                  aria-label="Open sidebar"
                >
                  <Menu className="h-5 w-5" />
                </button>

                {/* Search */}
                <div className="hidden sm:block">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search tools, stocks..."
                      className="pl-10 pr-4 py-2 w-64 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      aria-label="Search"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <a
                  href="/"
                  className="px-4 py-2 border border-gray-300 text-gray-700 bg-white rounded-xl hover:bg-gray-50 transition-all duration-200 font-medium inline-flex items-center gap-2"
                  aria-label="Go home"
                >
                  <HomeIcon className="h-4 w-4" />
                  Home
                </a>

                <button
                  className="p-2 rounded-xl bg-gray-100 relative"
                  aria-label="Notifications"
                >
                  <Bell className="h-5 w-5 text-gray-600" />
                  <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full"></span>
                </button>

                <div className="flex items-center space-x-2 text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-xl">
                  <Calendar className="h-4 w-4" />
                  <span className="hidden sm:inline">
                    {new Date().toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto">
          <div className="px-4 sm:px-6 lg:px-8 py-8">
            <div className="max-w-7xl mx-auto">
              {/* Welcome */}
              <div className="mb-8">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                  <div>
                    <h1 className="text-left text-3xl font-bold text-gray-900 mb-2">
                      Welcome back,{" "}
                      <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        {user?.name}
                      </span>
                    </h1>
                    <p className="text-gray-600 text-lg">
                      We help you trade smarter —{" "}
                      <span className="text-green-600 font-semibold">
                        one green candle
                      </span>{" "}
                      at a time.
                    </p>
                  </div>

                  <div className="flex items-center space-x-3">
                    <button
                      className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-medium"
                      aria-label="Export data"
                    >
                      Export Data
                    </button>
                  </div>
                </div>
              </div>

              {/* Date controls + viewing hint */}
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <button
                  onClick={goPrev}
                  disabled={!canGoPrev}
                  className={`px-3 py-1.5 text-sm rounded-lg border ${
                    canGoPrev
                      ? "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                      : "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
                  }`}
                  title={canGoPrev ? "Previous snapshot day" : "No previous day"}
                >
                  〈
                </button>

                <input
                  type="date"
                  value={dateInputISO}
                  onChange={(e) => {
                    const iso = e.target.value;
                    setDateInputISO(iso);
                    const dk = isoToDateKey(iso);
                    if (availableKeys.has(dk)) {
                      setSelectedKey(dk);
                      setDateInputNoData(null);
                    } else {
                      setDateInputNoData("No snapshot stored for this date");
                      setTimeout(() => setDateInputNoData(null), 2500);
                    }
                  }}
                  className={`px-3 py-1.5 text-sm rounded-lg border ${
                    dateInputNoData ? "border-rose-300 bg-rose-50" : "border-slate-300"
                  }`}
                  min={availableListAsc.length ? dateKeyToISO(availableListAsc[0]) : undefined}
                  max={todayISO()}
                  aria-label="Choose a date"
                />

                <button
                  onClick={goNext}
                  disabled={!canGoNext}
                  className={`px-3 py-1.5 text-sm rounded-lg border ${
                    canGoNext
                      ? "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                      : "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
                  }`}
                  title={canGoNext ? "Next day (or Today)" : "No next day"}
                >
                  〉
                </button>

                <button
                  onClick={() => setSelectedKey("today")}
                  disabled={isToday}
                  className={`ml-2 px-3 py-1.5 text-sm rounded-lg border ${
                    isToday
                      ? "bg-indigo-600/20 text-indigo-800/70 border-indigo-200 cursor-not-allowed"
                      : "bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700"
                  }`}
                  title={isToday ? "Already on Today" : "Jump to Today"}
                >
                  Today
                </button>

                {dateInputNoData && (
                  <span className="text-sm text-rose-600 ml-2">{dateInputNoData}</span>
                )}
              </div>

              <div className="col-span-full -mt-2 text-sm text-slate-500 mb-2">
                Viewing: {isToday ? "Today (Live)" : selectedKey}
              </div>

              {summaryError && (
                <div className="mb-4 text-sm text-rose-600">{summaryError}</div>
              )}

              {/* Stats (now dynamic, 5 cards) */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
                {statCards.map((stat, i) => (
                  <div
                    key={i}
                    className="bg-white p-6 rounded-2xl border border-gray-100 hover:shadow-lg shadow-xl transition-all duration-200 group"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div
                        className={`p-3 rounded-xl bg-gradient-to-r ${stat.gradient} text-white`}
                      >
                        {stat.icon}
                      </div>
                      <div className="text-right">
                        <div
                          className={`flex items-center text-sm font-medium ${
                            stat.trend === "up" ? "text-green-600" : "text-red-600"
                          }`}
                        >
                          {stat.trend === "up" ? (
                            <ArrowUpRight className="h-4 w-4" />
                          ) : (
                            <ArrowDownRight className="h-4 w-4" />
                          )}
                          {stat.change}
                        </div>
                        <span className="text-xs text-gray-500">{stat.period}</span>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-gray-600 mb-1">
                        {stat.title}
                      </h3>
                      <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    </div>

                    {renderProgressBar(stat.progress, stat.gradient, stat.title)}
                  </div>
                ))}
              </div>

              {/* Main Grid */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Trading Products */}
                <div className="xl:col-span-2">
                  <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-md">
                    <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
                      <div className="flex items-center justify-between">
                        <div>
                          <h2 className="text-xl font-bold text-slate-800 mb-1">
                            Your Trading Arsenal
                          </h2>
                          <p className="text-slate-500">
                            Only the tools you own are shown here
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="p-6">
                      {loadingEntitlements ? (
                        <div className="text-sm text-slate-500">
                          Loading your products…
                        </div>
                      ) : productsUI.length === 0 ? (
                        <div className="text-slate-600 text-sm">
                          You don’t have any products yet.
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {productsUI.map((product) => (
                            <a
                              key={product.id}
                              href={product.link}
                              className="group relative p-5 rounded-xl border border-indigo-100 shadow-sm transition-all duration-200 overflow-hidden bg-gradient-to-br from-indigo-50 to-white"
                              aria-label={`Access ${product.name}`}
                            >
                              <div className="absolute inset-0 opacity-100 transition-opacity duration-300" />

                              <div className="relative">
                                <div className="flex items-start justify-between mb-3">
                                  <div
                                    className="p-2 rounded-lg text-white"
                                    style={{
                                      background:
                                        "linear-gradient(90deg, #6366F1 0%, #8B5CF6 100%)",
                                    }}
                                  >
                                    {product.icon}
                                  </div>
                                  {product.newFeature && (
                                    <span className="px-2 py-1 text-xs font-medium bg-gradient-to-r from-teal-500 to-emerald-500 text-white rounded-full shadow-sm">
                                      NEW
                                    </span>
                                  )}
                                </div>

                                <h3 className="font-semibold text-indigo-700 mb-1 transition-colors">
                                  {product.name}
                                </h3>
                                <p className="text-sm text-slate-500 mb-3">
                                  {product.description}
                                </p>

                                {/* Bundle-style chips */}
                                {product.bundleComponents && (
                                  <div className="flex flex-wrap gap-2 mb-3">
                                    {product.bundleComponents.map((c) => (
                                      <span
                                        key={c.key}
                                        className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] bg-indigo-100 text-indigo-700"
                                      >
                                        {c.icon}
                                        {c.label}
                                      </span>
                                    ))}
                                  </div>
                                )}

                                {/* Algo variants chips */}
                                {product.algoVariants && (
                                  <div className="flex flex-wrap gap-2 mb-3">
                                    {product.algoVariants.map((v) => (
                                      <span
                                        key={v.key}
                                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] ${
                                          v.key.toLowerCase() === "pro"
                                            ? "bg-yellow-100 text-yellow-800"
                                            : v.key.toLowerCase() === "starter"
                                            ? "bg-indigo-100 text-indigo-700"
                                            : "bg-emerald-100 text-emerald-700"
                                        }`}
                                      >
                                        {v.label}
                                        {v.price && (
                                          <span className="opacity-80">· {v.price}</span>
                                        )}
                                      </span>
                                    ))}
                                  </div>
                                )}

                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-slate-400">
                                    {product.stats}
                                  </span>
                                  <div
                                    className={`flex items-center text-sm font-medium ${
                                      product.trend === "up"
                                        ? "text-emerald-600"
                                        : "text-rose-600"
                                    }`}
                                  >
                                    {product.trend === "up" ? (
                                      <ArrowUpRight className="h-3 w-3" />
                                    ) : (
                                      <ArrowDownRight className="h-3 w-3" />
                                    )}
                                    {product.change}
                                  </div>
                                </div>
                              </div>
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Activity Feed */}
                <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-md">
                  <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h2 className="text-xl font-bold text-slate-800 mb-1">
                          Live Activity
                        </h2>
                        <p className="text-sm text-slate-500">
                          Real-time trading updates
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                        <span className="text-xs text-emerald-600 font-medium">
                          Live
                        </span>
                      </div>
                    </div>

                    {/* Filters */}
                    <div className="flex space-x-2">
                      {["All", "Scans", "Trades", "Alerts"].map((filter) => (
                        <button
                          key={filter}
                          onClick={() => handleFilterChange(filter)}
                          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                            activeFilter === filter
                              ? "bg-indigo-100 text-indigo-700 shadow-sm"
                              : "bg-slate-200 text-slate-600"
                          }`}
                          aria-label={`Filter by ${filter}`}
                        >
                          {filter}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="space-y-4">
                      {filteredActivities.map((activity) => (
                        <div
                          key={activity.id}
                          className="flex items-start space-x-3 p-3 rounded-xl transition-colors cursor-pointer group"
                          style={{ backgroundColor: "#f2f2f4" }}
                          aria-label={`Activity: ${activity.action}`}
                        >
                          <div
                            className={`p-2 rounded-lg ${
                              activity.priority === "high"
                                ? "bg-rose-100 text-rose-600"
                                : activity.priority === "medium"
                                ? "bg-amber-100 text-amber-600"
                                : "bg-indigo-100 text-indigo-600"
                            }`}
                          >
                            {activity.icon}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <h3 className="text-sm font-medium text-indigo-700 transition-colors">
                                {activity.product}
                              </h3>
                              <span className="flex items-center text-xs text-slate-400">
                                <Clock className="h-3 w-3 mr-1" />
                                {activity.time}
                              </span>
                            </div>
                            <p className="text-sm text-slate-600 leading-relaxed">
                              {activity.action}
                            </p>

                            {activity.priority === "high" && (
                              <div className="mt-2">
                                <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-rose-100 text-rose-700 rounded-full shadow-sm">
                                  High Priority
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    <button
                      className="w-full mt-4 py-3 text-sm font-medium text-indigo-800 bg-indigo-50 rounded-xl transition-colors flex items-center justify-center border border-indigo-100"
                      aria-label="View all activities"
                    >
                      View All Activities
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 mt-auto">
          <div className="px-4 sm:px-6 lg:px-8 py-6">
            <div className="max-w-7xl mx-auto flex flex-col lg:flex-row justify-between items-center space-y-4 lg:space-y-0">
              <div className="flex items-center space-x-6">
                <p className="text-sm text-gray-600">
                  © {new Date().getFullYear()} Upholic. Empowering traders
                  worldwide.
                </p>
                <div className="hidden sm:flex items-center space-x-1 text-xs text-gray-500">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span>Algo systems operational</span>
                </div>
              </div>

              <div className="flex items-center space-x-6 text-sm">
                <a
                  href="/lauching-soon"
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  Terms
                </a>
                <a
                  href="/lauching-soon"
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  Privacy
                </a>
                <a
                  href="/lauching-soon"
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  Support
                </a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Dashboard;
