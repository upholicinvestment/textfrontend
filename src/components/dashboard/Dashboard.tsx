import { useEffect, useMemo, useState, useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import upholictech from "../../assets/Upholictech.png";
import {
  BarChart3,
  TrendingUp,
  Bot,
  BookOpen,
  Coins,
  Building2,
  Home as HomeIcon,
  Calendar,
  LogOut,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Bell,
  Search,
  Menu,
  X,
  ChevronRight,
  ChevronDown,
  Activity,
  DollarSign,
  Users,
  PackageOpen,
} from "lucide-react";
import api from "../../api";

// ---------- Types returned by /users/me/products ----------
interface MyVariant {
  variantId: string;
  key: string;      // starter | pro | swing
  name: string;
  priceMonthly?: number | null;
  interval?: string | null;
}
interface MyProduct {
  productId: string;
  key: string;      // component keys, algo_simulator, journaling_solo, etc.
  name: string;
  route: string;    // e.g. "/fii-dii"
  hasVariants: boolean;
  forSale: boolean;
  status: string;   // "active"
  startedAt: string | null;
  endsAt: string | null;
  variant: MyVariant | null;
}

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

const componentLabelMap: Record<string, { label: string; icon: React.ReactNode }> = {
  technical_scanner: { label: "Technical Scanner", icon: <BarChart3 className="h-4 w-4" /> },
  fundamental_scanner: { label: "Fundamental Scanner", icon: <TrendingUp className="h-4 w-4" /> },
  fno_khazana: { label: "F&O Khazana", icon: <Coins className="h-4 w-4" /> },
  journaling: { label: "Smart Journaling", icon: <BookOpen className="h-4 w-4" /> },
  fii_dii_data: { label: "FII/DII Data", icon: <Building2 className="h-4 w-4" /> },
};

const componentRouteMap: Record<string, string> = {
  technical_scanner: "/technical",
  fundamental_scanner: "/fundamental",
  fno_khazana: "/fno",
  journaling: "/journal",
  fii_dii_data: "/fii-dii",
};

const bundleComponentKeys = [
  "technical_scanner",
  "fundamental_scanner",
  "fno_khazana",
  "journaling",
  "fii_dii_data",
];

const prettyINR = (n?: number | null) =>
  typeof n === "number" ? `₹${n.toLocaleString("en-IN")}` : undefined;

const Dashboard = () => {
  const { user, logout } = useContext(AuthContext);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [bundleOpen, setBundleOpen] = useState(false);
  const [algoOpen, setAlgoOpen] = useState(false); // NEW: collapsible ALGO like bundle
  const [activeFilter, setActiveFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [myProducts, setMyProducts] = useState<MyProduct[]>([]);
  const [loadingEntitlements, setLoadingEntitlements] = useState<boolean>(true);

  useEffect(() => {
    (async () => {
      try {
        setLoadingEntitlements(true);
        const res = await api.get("/users/me/products");
        const items: MyProduct[] = Array.isArray(res.data?.items) ? res.data.items : [];
        setMyProducts(items);
      } catch (e) {
        console.error("Failed to load my products:", e);
        setMyProducts([]);
      } finally {
        setLoadingEntitlements(false);
      }
    })();
  }, []);

  const ownedKeys = useMemo(() => new Set(myProducts.map(p => p.key)), [myProducts]);
  const hasAllBundle = useMemo(
    () => bundleComponentKeys.every(k => ownedKeys.has(k)),
    [ownedKeys]
  );
  const ownsAlgo = ownedKeys.has("algo_simulator");
  const ownsJournalingSolo = ownedKeys.has("journaling_solo");
  const ownsAnyJournaling = hasAllBundle || ownsJournalingSolo || ownedKeys.has("journaling");

  const algoEntitlements = useMemo(
    () => myProducts.filter(p => p.key === "algo_simulator"),
    [myProducts]
  );
  const algoVariantBadges = useMemo(() => {
    const variants = algoEntitlements
      .map((p) => p.variant)
      .filter((v): v is MyVariant => !!v);
    const dedup = new Map(variants.map((v) => [v.key, v]));
    return Array.from(dedup.values());
  }, [algoEntitlements]);

  const variantBadgeClass = (key: string) => {
    switch (key) {
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
        icon: componentLabelMap[key]?.icon || <PackageOpen className="h-4 w-4" />,
      }));

      ui.push({
        id: "bundle-owned",
        name: "Trader's Essential Bundle (5-in-1)",
        description: "All 5 premium tools for the price of one",
        icon: <PackageOpen className="h-6 w-6" />,
        stats: "5 tools included",
        change: "+12.4%",
        link: "/bundle",
        gradient: "from-blue-500 to-cyan-400",
        trend: "up",
        newFeature: false,
        bundleComponents: components,
      });
    } else {
      const ownedComponents = myProducts.filter(p =>
        bundleComponentKeys.includes(p.key)
      );
      ownedComponents.forEach((p) => {
        const label = componentLabelMap[p.key]?.label ?? p.name;
        const icon = componentLabelMap[p.key]?.icon ?? <PackageOpen className="h-6 w-6" />;
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
      const chip = algo?.variant
        ? [{ key: algo.variant.key, label: algo.variant.name, price: prettyINR(algo.variant.priceMonthly ?? undefined) }]
        : [];

      ui.push({
        id: algo?.productId || "algo-owned",
        name: "ALGO Simulator",
        description: "Advanced backtesting and execution-ready strategies",
        icon: <Bot className="h-6 w-6" />,
        stats: chip.length ? `${chip[0].label} plan` : "Active",
        change: "+15.7%",
        link: algo?.route || "/comming-soon",
        gradient: "from-purple-500 to-violet-400",
        trend: "up",
        newFeature: true,
        algoVariants: chip,
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
  }, [myProducts, hasAllBundle, ownsJournalingSolo, ownedKeys]);

  const recentActivity: ActivityItem[] = [
    { id: 1, product: "Technical Scanner", action: "Nifty 50 breakout pattern detected", time: "2 mins ago", icon: <BarChart3 className="h-4 w-4" />, type: "scan", priority: "high" },
    { id: 2, product: "Smart Journaling", action: "New trade recorded: RELIANCE (+2.4%)", time: "15 mins ago", icon: <BookOpen className="h-4 w-4" />, type: "trade", priority: "medium" },
    { id: 3, product: "ALGO Simulator", action: "PRO strategy execution: 94.2% accuracy", time: "32 mins ago", icon: <Bot className="h-4 w-4" />, type: "backtest", priority: "high" },
    { id: 4, product: "FII/DII", action: "Major FII buying in Banking sector", time: "1 hour ago", icon: <Building2 className="h-4 w-4" />, type: "alert", priority: "high" },
  ];

  const stats: Stat[] = [
    { title: "Trade Triggered", value: "2,101", icon: <Activity className="h-5 w-5" />, trend: "up", change: "12%", gradient: "from-blue-500 to-cyan-400", period: "Today", progress: 85 },
    { title: "Portfolio Value", value: "₹8.4L", icon: <DollarSign className="h-5 w-5" />, trend: "up", change: "5.2%", gradient: "from-emerald-500 to-green-400", period: "Total", progress: 72 },
    { title: "Live Positions", value: "24", icon: <TrendingUp className="h-5 w-5" />, trend: "up", change: "8", gradient: "from-purple-500 to-violet-400", period: "Open", progress: 91 },
    { title: "Success Rate", value: "78%", icon: <Users className="h-5 w-5" />, trend: "up", change: "4.1%", gradient: "from-amber-500 to-orange-400", period: "This Month", progress: 78 },
  ];

  const filteredActivities =
    activeFilter === "All"
      ? recentActivity
      : recentActivity.filter((a) => a.type === activeFilter.toLowerCase());

  const toggleSidebar = () => setIsSidebarOpen((v) => !v);
  const handleFilterChange = (filter: string) => setActiveFilter(filter);

  const renderProgressBar = (progress: number, gradient: string, title: string) => {
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

  const sidebarBundleComponents = (hasAllBundle
    ? bundleComponentKeys
    : myProducts.filter(p => bundleComponentKeys.includes(p.key)).map(p => p.key)
  ).map((key) => ({
    key,
    label: componentLabelMap[key]?.label || key,
    icon: componentLabelMap[key]?.icon || <PackageOpen className="h-4 w-4" />,
    href: myProducts.find(p => p.key === key)?.route || componentRouteMap[key] || "#",
  }));

  const algoLink = myProducts.find(p => p.key === "algo_simulator")?.route || "/comming-soon";
  const journalingLink = (myProducts.find(p => p.key === "journaling")?.route)
    || (myProducts.find(p => p.key === "journaling_solo")?.route)
    || "/journal";

  const algoVariantHref = (key: string) => `${algoLink}?plan=${encodeURIComponent(key)}`;

  return (
    <div className="flex h-screen bg-gray-50/50">
      {/* Sidebar */}
      <div
        className={`${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 fixed md:static inset-y-0 left-0 z-50 w-72 
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
                        {hasAllBundle ? "Trader's Essential Bundle" : "Your Tools"}
                      </span>
                    </div>
                    <ChevronDown
                      className={`h-4 w-4 text-white transition-transform ${bundleOpen ? "rotate-180" : ""}`}
                    />
                  </button>

                  {bundleOpen && (
                    <div id="bundle-submenu" className="ml-4 mt-1 space-y-1 border-l border-white/20 pl-3">
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

              {/* ALGO Simulator — NOW LIKE BUNDLE (collapsible with submenu) */}
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
                      className={`h-4 w-4 text-white transition-transform ${algoOpen ? "rotate-180" : ""}`}
                    />
                  </button>

                  {algoOpen && (
                    <div id="algo-submenu" className="ml-4 mt-1 space-y-1 border-l border-white/20 pl-3">
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
                            <span className={`px-2 py-0.5 text-[10px] rounded-full ${variantBadgeClass(v.key)}`}>
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

              {/* Journaling (only if owned in any form) */}
              {ownsAnyJournaling && (
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
                {/* NEW: Home button */}
                <a
                  href="/"
                  className="px-4 py-2 border border-gray-300 text-gray-700 bg-white rounded-xl hover:bg-gray-50 transition-all duration-200 font-medium inline-flex items-center gap-2"
                  aria-label="Go home"
                >
                  <HomeIcon className="h-4 w-4" />
                  Home
                </a>

                <button className="p-2 rounded-xl bg-gray-100 relative" aria-label="Notifications">
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
                    {/* You can keep or remove this export button */}
                    <button
                      className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-medium"
                      aria-label="Export data"
                    >
                      Export Data
                    </button>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {stats.map((stat, i) => (
                  <div
                    key={i}
                    className="bg-white p-6 rounded-2xl border border-gray-100 hover:shadow-lg shadow-xl transition-all duration-200 group"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className={`p-3 rounded-xl bg-gradient-to-r ${stat.gradient} text-white`}>
                        {stat.icon}
                      </div>
                      <div className="text-right">
                        <div className={`flex items-center text-sm font-medium ${stat.trend === "up" ? "text-green-600" : "text-red-600"}`}>
                          {stat.trend === "up" ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                          {stat.change}
                        </div>
                        <span className="text-xs text-gray-500">{stat.period}</span>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-gray-600 mb-1">{stat.title}</h3>
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
                        <div className="text-sm text-slate-500">Loading your products…</div>
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
                                    style={{ background: "linear-gradient(90deg, #6366F1 0%, #8B5CF6 100%)" }}
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

                                {/* Bundle-style chips remain on the card */}
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

                                {product.algoVariants && (
                                  <div className="flex flex-wrap gap-2 mb-3">
                                    {product.algoVariants.map((v) => (
                                      <span
                                        key={v.key}
                                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] ${
                                          v.key === "pro"
                                            ? "bg-yellow-100 text-yellow-800"
                                            : "bg-indigo-100 text-indigo-700"
                                        }`}
                                      >
                                        {v.label}
                                        {v.price && <span className="opacity-80">· {v.price}</span>}
                                      </span>
                                    ))}
                                  </div>
                                )}

                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-slate-400">{product.stats}</span>
                                  <div className={`flex items-center text-sm font-medium ${product.trend === "up" ? "text-emerald-600" : "text-rose-600"}`}>
                                    {product.trend === "up" ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
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
                        <h2 className="text-xl font-bold text-slate-800 mb-1">Live Activity</h2>
                        <p className="text-sm text-slate-500">Real-time trading updates</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                        <span className="text-xs text-emerald-600 font-medium">Live</span>
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
                  © {new Date().getFullYear()} Upholic. Empowering traders worldwide.
                </p>
                <div className="hidden sm:flex items-center space-x-1 text-xs text-gray-500">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span>Algo systems operational</span>
                </div>
              </div>

              <div className="flex items-center space-x-6 text-sm">
                <a href="/lauching-soon" className="text-gray-500 hover:text-gray-700 transition-colors">Terms</a>
                <a href="/lauching-soon" className="text-gray-500 hover:text-gray-700 transition-colors">Privacy</a>
                <a href="/lauching-soon" className="text-gray-500 hover:text-gray-700 transition-colors">Support</a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Dashboard;
