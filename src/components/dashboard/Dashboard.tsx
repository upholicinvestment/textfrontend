import { useState, useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import upholictech from "../../assets/Upholictech.png";
import {
  BarChart3,
  TrendingUp,
  Bot,
  BookOpen,
  Coins,
  Building2,
  Home,
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
  Activity,
  DollarSign,
  Users,
} from "lucide-react";

// Type Definitions
interface Product {
  id: number;
  name: string;
  description: string;
  icon: React.ReactNode;
  stats: string;
  change: string;
  link: string;
  gradient: string;
  bgColor: string;
  trend: "up" | "down";
  newFeature: boolean;
}

interface Activity {
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

const Dashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  // Product Data
  const products: Product[] = [
    {
      id: 1,
      name: "Technical Scanner",
      description: "AI-powered technical analysis with real-time alerts",
      icon: <BarChart3 className="h-6 w-6" />,
      stats: "1,245 scans today",
      change: "+12.4%",
      link: "/comming-soon",
      gradient: "from-blue-500 to-cyan-400",
      bgColor: "bg-gradient-to-br from-blue-50 to-cyan-50",
      trend: "up",
      newFeature: false,
    },
    {
      id: 2,
      name: "Fundamental Scanner",
      description: "Deep financial metrics analysis with sector insights",
      icon: <TrendingUp className="h-6 w-6" />,
      stats: "856 scans today",
      change: "+8.2%",
      link: "/comming-soon",
      gradient: "from-emerald-500 to-green-400",
      bgColor: "bg-gradient-to-br from-emerald-50 to-green-50",
      trend: "up",
      newFeature: false,
    },
    {
      id: 3,
      name: "ALGO Simulator",
      description: "Advanced backtesting with ML optimization",
      icon: <Bot className="h-6 w-6" />,
      stats: "312 simulations running",
      change: "+15.7%",
      link: "/comming-soon",
      gradient: "from-purple-500 to-violet-400",
      bgColor: "bg-gradient-to-br from-purple-50 to-violet-50",
      trend: "up",
      newFeature: true,
    },
    {
      id: 4,
      name: "Smart Journaling",
      description: "AI-enhanced trading journal with pattern recognition",
      icon: <BookOpen className="h-6 w-6" />,
      stats: "78 new entries today",
      change: "+24.1%",
      link: "/comming-soon",
      gradient: "from-amber-500 to-orange-400",
      bgColor: "bg-gradient-to-br from-amber-50 to-orange-50",
      trend: "up",
      newFeature: false,
    },
    {
      id: 5,
      name: "FNO Khazana",
      description: "Options flow analysis with sentiment tracking",
      icon: <Coins className="h-6 w-6" />,
      stats: "4,532 contracts analyzed",
      change: "+6.8%",
      link: "/comming-soon",
      gradient: "from-indigo-500 to-blue-400",
      bgColor: "bg-gradient-to-br from-indigo-50 to-blue-50",
      trend: "up",
      newFeature: false,
    },
    {
      id: 6,
      name: "FII/DII",
      description: "Real-time FII/DII tracking with smart money alerts",
      icon: <Building2 className="h-6 w-6" />,
      stats: "₹2,456 Cr net inflow",
      change: "-3.2%",
      link: "/comming-soon",
      gradient: "from-rose-500 to-pink-400",
      bgColor: "bg-gradient-to-br from-rose-50 to-pink-50",
      trend: "down",
      newFeature: false,
    },
  ];

  // Recent Activity Data
  const recentActivity: Activity[] = [
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
      action: "Mean Reversion strategy: 94.2% accuracy",
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

  // Stats Data
  const stats: Stat[] = [
    {
      title: "Trade Triggered",
      value: "2,101",
      icon: <Activity className="h-5 w-5" />,
      trend: "up",
      change: "12%",
      gradient: "from-blue-500 to-cyan-400",
      period: "Today",
      progress: 85,
    },
    {
      title: "Portfolio Value",
      value: "₹8.4L",
      icon: <DollarSign className="h-5 w-5" />,
      trend: "up",
      change: "5.2%",
      gradient: "from-emerald-500 to-green-400",
      period: "Total",
      progress: 72,
    },
    {
      title: "Live Positions",
      value: "24",
      icon: <TrendingUp className="h-5 w-5" />,
      trend: "up",
      change: "8",
      gradient: "from-purple-500 to-violet-400",
      period: "Open",
      progress: 91,
    },
    {
      title: "Success Rate",
      value: "78%",
      icon: <Users className="h-5 w-5" />,
      trend: "up",
      change: "4.1%",
      gradient: "from-amber-500 to-orange-400",
      period: "This Month",
      progress: 78,
    },
  ];

  // Filter activities based on active filter
  const filteredActivities =
    activeFilter === "All"
      ? recentActivity
      : recentActivity.filter(
          (activity) => activity.type === activeFilter.toLowerCase()
        );

  // Toggle sidebar visibility
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Filter activities by type
  const handleFilterChange = (filter: string) => {
    setActiveFilter(filter);
  };

  // Render progress bar with proper accessibility attributes
  const renderProgressBar = (
    progress: number,
    gradient: string,
    title: string
  ) => {
    const clampedProgress = Math.max(0, Math.min(100, Math.round(progress)));

    return (
      <div className="mt-4 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full bg-gradient-to-r ${gradient}`}
          style={{ width: `${clampedProgress}%` }}
          role="progressbar"
          {...{
            "aria-valuenow": clampedProgress,
            "aria-valuemin": 0,
            "aria-valuemax": 100,
            "aria-label": `${title} progress: ${clampedProgress}%`,
          }}
        />
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-gray-50/50">
      {/* Sidebar */}
      <div
        className={`${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} 
  md:translate-x-0 fixed md:static inset-y-0 left-0 z-50 w-72 
  bg-gradient-to-b from-[#1a237e] to-[#4a56d2]
  shadow-xl md:shadow-none transition-transform duration-300 ease-in-out`}
      >
        <div className="flex flex-col h-full">
          {/* Logo Section */}
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

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            <div className="mb-4">
              <a
                href="#"
                className="flex items-center px-3 py-3 text-sm font-semibold text-white bg-white/20 rounded-xl border border-white/30"
                aria-current="page"
              >
                <Home className="mr-3 h-5 w-5 text-white" />
                Dashboard
              </a>
            </div>

            <div className="space-y-1">
              <h3 className="px-3 text-xs font-semibold text-white/70 uppercase tracking-wider mb-3">
                Trading Tools
              </h3>
              {products.map((product) => (
                <a
                  key={product.id}
                  href={product.link}
                  className="group flex items-center justify-between px-3 py-3 text-sm font-medium text-white rounded-xl hover:bg-white/10 transition-all duration-200"
                  aria-label={`Go to ${product.name}`}
                >
                  <div className="flex items-center">
                    <div className="p-2 rounded-lg bg-white/10 text-white mr-3">
                      {product.icon}
                    </div>
                    <span className="truncate">{product.name}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {product.newFeature && (
                      <span className="px-2 py-1 text-xs font-medium bg-white text-[#1a237e] rounded-full">
                        NEW
                      </span>
                    )}
                    <ChevronRight className="h-4 w-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </a>
              ))}
            </div>
          </nav>

          {/* User Profile */}
          <div className="p-4 border-t border-[#7986cb]/30">
            <div className="flex items-center space-x-3 p-3 bg-white/10 rounded-xl">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-[#1a237e] font-semibold text-sm">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">
                  {user?.name}
                </p>
                <p className="text-xs text-white/70">Premium Member</p>
              </div>
              <button
                className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
                aria-label="User menu"
                onClick={logout}
              >
                <LogOut className="h-4 w-4 text-white" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div
          className="md:hidden fixed inset-0 bg-gray-600 bg-opacity-50 z-40"
          onClick={toggleSidebar}
          aria-hidden="true"
        />
      )}

      {/* Main Content */}
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

              <div className="flex items-center space-x-4">
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
              {/* Welcome Section */}
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
                    {/* <button
                      className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-medium"
                      aria-label="Quick scan"
                    >
                      Quick Scan
                    </button> */}
                    <button
                      className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-medium"
                      aria-label="Export data"
                    >
                      Export Data
                    </button>
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {stats.map((stat, index) => (
                  <div
                    key={index}
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
                            stat.trend === "up"
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {stat.trend === "up" ? (
                            <ArrowUpRight className="h-4 w-4" />
                          ) : (
                            <ArrowDownRight className="h-4 w-4" />
                          )}
                          {stat.change}
                        </div>
                        <span className="text-xs text-gray-500">
                          {stat.period}
                        </span>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-gray-600 mb-1">
                        {stat.title}
                      </h3>
                      <p className="text-2xl font-bold text-gray-900">
                        {stat.value}
                      </p>
                    </div>

                    {renderProgressBar(
                      stat.progress,
                      stat.gradient,
                      stat.title
                    )}
                  </div>
                ))}
              </div>

              {/* Main Grid */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Trading Tools */}
                <div className="xl:col-span-2">
                  <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-md">
                    <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
                      <div className="flex items-center justify-between">
                        <div>
                          <h2 className="text-xl font-bold text-slate-800 mb-1">
                            Trading Arsenal
                          </h2>
                          <p className="text-slate-500">
                            Your powerful trading tools at a glance
                          </p>
                        </div>
                        <button
                          className="text-indigo-800 font-medium flex items-center transition-colors"
                          aria-label="View all tools"
                        >
                          View All
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </button>
                      </div>
                    </div>

                    <div className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {products.map((product) => (
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
                                  className="p-2 rounded-lg text-indigo-600"
                                  style={{
                                    backgroundColor: "oklch(0.89 0.01 272.41)",
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

                    {/* Activity Filters */}
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
                  href="/comming-soon"
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  Terms
                </a>
                <a
                  href="/comming-soon"
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  Privacy
                </a>
                <a
                  href="/comming-soon"
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
