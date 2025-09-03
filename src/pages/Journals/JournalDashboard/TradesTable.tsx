import React, { useEffect, useState } from "react";
import { 
  ArrowUp, ArrowDown, BarChart2, Clock, 
  TrendingUp, TrendingDown, DollarSign, 
  AlertTriangle,  Activity,
  Target, Trophy,  Filter,
  ArrowUpRight, ArrowDownRight, Calendar,
  RefreshCw, Download, Search, 
  Sun, Moon
} from "lucide-react";

// --- Theme Context ---
const ThemeContext = React.createContext({
  darkMode: true,
  toggleDarkMode: () => {}
});

// --- Helpers ---
const formatCurrency = (val: number | undefined) => {
  if (typeof val !== "number") return "--";
  return `${val < 0 ? "-" : ""}₹${Math.abs(val).toLocaleString("en-IN", { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  })}`;
};

const formatPercentage = (val: number) => {
  return `${val >= 0 ? "+" : ""}${val.toFixed(1)}%`;
};

// --- Stat Card ---
const StatCard = ({ icon, label, value, subtext, trend }: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  subtext?: string;
  trend?: number;
}) => {
  const { darkMode } = React.useContext(ThemeContext);
  
  return (
    <div className={`
      rounded-lg p-4 border transition-colors
      ${darkMode ? 
        "bg-gray-800 border-gray-700 hover:border-gray-600" : 
        "bg-white border-gray-200 hover:border-gray-300"}
    `}>
      <div className="flex items-start justify-between">
        <div className={`
          p-2 rounded-lg
          ${darkMode ? "bg-gray-700" : "bg-gray-100"}
        `}>
          {icon}
        </div>
        {trend !== undefined && (
          <div className={`flex items-center space-x-1 text-sm font-medium ${
            trend >= 0 ? "text-green-500" : "text-red-500"
          }`}>
            {trend >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
            <span>{formatPercentage(trend)}</span>
          </div>
        )}
      </div>
      
      <div className="mt-4 space-y-1">
        <span className={`text-sm font-medium ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
          {label}
        </span>
        <div className={`text-xl font-semibold ${darkMode ? "text-white" : "text-gray-900"}`}>
          {value}
        </div>
        {subtext && (
          <div className={`text-xs mt-1 ${darkMode ? "text-gray-500" : "text-gray-500"}`}>
            {subtext}
          </div>
        )}
      </div>
    </div>
  );
};

// --- Performance Indicator ---
const PerformanceIndicator = ({ value, label }: { value: number; label: string }) => {
  // Determine color based on value
  let colorClass = '';
  if (value >= 40) {
    colorClass = 'bg-green-600'; // Dark Green for excellent
  } else if (value >= 20) {
    colorClass = 'bg-green-400'; // Light Green for good
  } else if (value >= -20) {
    colorClass = 'bg-red-400'; // Light Red for poor
  } else {
    colorClass = 'bg-red-600'; // Dark Red for very poor
  }
  
  return (
    <div className="flex items-center space-x-2">
      <div className={`w-2 h-2 rounded-full ${colorClass}`}></div>
      <span className={`text-sm font-medium ${
        value >= 20 ? 'text-green-500' : 'text-red-500'
      }`}>
        {label}
      </span>
    </div>
  );
};

// --- Main Component ---
type Trade = {
  PnL?: number;
  symbol?: string;
  entry?: {
    Date?: string;
    Direction?: "Buy" | "Sell";
    Quantity?: number;
    Price?: number;
  };
  exit?: {
    Date?: string;
    Direction?: "Buy" | "Sell";
    Price?: number;
  };
  Demon?: string;
  GoodPractice?: string;
};

type StatsData = {
  empty?: boolean;
  trades: Trade[];
  netPnl?: number;
  avgWinLoss?: {
    avgWin?: number;
    avgLoss?: number;
  };
};

const TradesTable = () => {
  const [darkMode, setDarkMode] = useState(true);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | "wins" | "losses">("all");

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("https://api.upholictech.com/api/stats");
        if (!response.ok) throw new Error('Failed to fetch');
        const data: StatsData = await response.json();
        setStats(data.empty ? null : data);
        setError(null);
      } catch (err) {
        setError("Failed to load trade data");
        setStats(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center p-6 ${
        darkMode ? "bg-gray-900" : "bg-gray-50"
      }`}>
        <div className={`animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 ${
          darkMode ? "border-blue-500" : "border-blue-600"
        } mb-4`}></div>
        <div className={darkMode ? "text-gray-300" : "text-gray-700"}>Loading trade data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center p-6 ${
        darkMode ? "bg-gray-900" : "bg-gray-50"
      }`}>
        <div className={`
          p-6 rounded-lg border max-w-md text-center
          ${darkMode ? 
            "bg-gray-800 border-gray-700" : 
            "bg-white border-gray-200"}
        `}>
          <div className={`
            p-3 rounded-full mb-4 inline-block
            ${darkMode ? "bg-red-900/20" : "bg-red-100"}
          `}>
            <AlertTriangle className={`w-6 h-6 ${
              darkMode ? "text-red-400" : "text-red-500"
            }`} />
          </div>
          <h3 className={`text-lg font-semibold mb-2 ${
            darkMode ? "text-white" : "text-gray-900"
          }`}>Connection Error</h3>
          <p className={`mb-4 ${
            darkMode ? "text-gray-400" : "text-gray-600"
          }`}>{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className={`
              px-4 py-2 rounded-md text-white font-medium transition-colors
              bg-blue-600 hover:bg-blue-700
            `}
          >
            <RefreshCw className="w-4 h-4 inline mr-2" />
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  if (!stats || !stats.trades || stats.trades.length === 0) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center p-6 ${
        darkMode ? "bg-gray-900" : "bg-gray-50"
      }`}>
        <div className={`
          p-8 rounded-lg border max-w-lg text-center
          ${darkMode ? 
            "bg-gray-800 border-gray-700" : 
            "bg-white border-gray-200"}
        `}>
          <div className={`
            p-4 rounded-full mb-4 inline-block
            ${darkMode ? "bg-gray-700" : "bg-gray-100"}
          `}>
            <BarChart2 className={`w-8 h-8 ${
              darkMode ? "text-gray-400" : "text-gray-600"
            }`} />
          </div>
          <h3 className={`text-xl font-semibold mb-2 ${
            darkMode ? "text-white" : "text-gray-900"
          }`}>No Trade Data Available</h3>
          <p className={darkMode ? "text-gray-400" : "text-gray-600"}>
            Upload your trade history to begin analyzing your performance.
          </p>
        </div>
      </div>
    );
  }

  // --- Stats Calculations ---
  const { netPnl, avgWinLoss, trades } = stats;
  
  const profitableTrades = trades.filter(t => (t.PnL || 0) > 0);
  const lossTrades = trades.filter(t => (t.PnL || 0) < 0);
  
  const totalProfit = profitableTrades.reduce((sum, t) => sum + (t.PnL || 0), 0);
  const totalLoss = lossTrades.reduce((sum, t) => sum + (t.PnL || 0), 0);
    
  const avgWin = avgWinLoss?.avgWin || 0;
  const avgLoss = avgWinLoss?.avgLoss || 0;
  
  const winRate = trades.length > 0 
    ? Math.round((profitableTrades.length / trades.length) * 100)
    : 0;

  const riskRewardRatio = avgLoss !== 0 ? Math.abs(avgWin / avgLoss) : 0;
  const profitFactor = Math.abs(totalLoss) !== 0 ? totalProfit / Math.abs(totalLoss) : 0;

  // Filter trades
  const filteredTrades = trades.filter(trade => {
    const matchesSearch = !searchTerm || 
      trade.symbol?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trade.entry?.Date?.includes(searchTerm) ||
      trade.exit?.Date?.includes(searchTerm);
    
    const matchesFilter = 
      filterType === "all" || 
      (filterType === "wins" && (trade.PnL || 0) > 0) ||
      (filterType === "losses" && (trade.PnL || 0) < 0);
    
    return matchesSearch && matchesFilter;
  });

  // =========================
  // Export helpers (CSV / Print-to-PDF)
  // =========================
  const escapeCSV = (val: any) => {
    const s = val === null || val === undefined ? "" : String(val);
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
    // Note: numbers/empty handled naturally
  };

  const timestamp = () => {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}_${pad(d.getHours())}-${pad(d.getMinutes())}`;
  };

  const exportCSV = (rows: Trade[]) => {
    const headers = [
      "Entry Date",
      "Exit Date",
      "Symbol",
      "Entry Direction",
      "Exit Direction",
      "Quantity",
      "Entry Price",
      "Exit Price",
      "PnL",
      "Issues",
      "Insights"
    ];

    const data = rows.map(t => ([
      t.entry?.Date || "",
      t.exit?.Date || "",
      t.symbol || "",
      t.entry?.Direction || "",
      t.exit?.Direction || "",
      t.entry?.Quantity ?? "",
      t.entry?.Price ?? "",
      t.exit?.Price ?? "",
      t.PnL ?? "",
      t.Demon || "",
      t.GoodPractice || ""
    ]));

    const csv = [
      headers.map(escapeCSV).join(","),
      ...data.map(row => row.map(escapeCSV).join(","))
    ].join("\n");

    // Add BOM for Excel compatibility
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `trades_export_${timestamp()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Lightweight print-to-PDF (opens printable window; user can choose "Save as PDF")
  const exportPrintPDF = (rows: Trade[]) => {
    const printHtml = `
      <html>
        <head>
          <title>Trades Export</title>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <style>
            body { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; margin: 24px; }
            h1 { font-size: 20px; margin: 0 0 12px 0; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ddd; padding: 8px; font-size: 12px; text-align: left; }
            th { background: #f1f5f9; }
            .meta { color: #64748b; margin-bottom: 12px; font-size: 12px; }
          </style>
        </head>
        <body>
          <h1>Trades Export</h1>
          <div class="meta">Exported: ${new Date().toLocaleString()}</div>
          <table>
            <thead>
              <tr>
                <th>Entry Date</th>
                <th>Exit Date</th>
                <th>Symbol</th>
                <th>Entry Direction</th>
                <th>Exit Direction</th>
                <th>Quantity</th>
                <th>Entry Price</th>
                <th>Exit Price</th>
                <th>PnL</th>
                <th>Issues</th>
                <th>Insights</th>
              </tr>
            </thead>
            <tbody>
              ${rows.map(t => `
                <tr>
                  <td>${t.entry?.Date ?? ""}</td>
                  <td>${t.exit?.Date ?? ""}</td>
                  <td>${t.symbol ?? ""}</td>
                  <td>${t.entry?.Direction ?? ""}</td>
                  <td>${t.exit?.Direction ?? ""}</td>
                  <td>${t.entry?.Quantity ?? ""}</td>
                  <td>${t.entry?.Price ?? ""}</td>
                  <td>${t.exit?.Price ?? ""}</td>
                  <td>${t.PnL ?? ""}</td>
                  <td>${t.Demon ?? ""}</td>
                  <td>${t.GoodPractice ?? ""}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
          <script>
            window.onload = function() {
              setTimeout(function(){ window.print(); }, 100);
            };
          </script>
        </body>
      </html>
    `;

    const win = window.open("", "_blank", "noopener,noreferrer");
    if (!win) return; // popup blocked
    win.document.open();
    win.document.write(printHtml);
    win.document.close();
  };

  return (
    <ThemeContext.Provider value={{ darkMode, toggleDarkMode }}>
      <div className={`min-h-screen p-4 sm:p-6 transition-colors ${
        darkMode ? "bg-gray-900" : "bg-gray-50"
      }`}>
        <div className="max-w-8xl mx-auto space-y-6">
          
          {/* Header Section */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div>
              <h1 className={`text-2xl font-bold ${
                darkMode ? "text-white" : "text-gray-900"
              }`}>Trading Dashboard</h1>
              <p className={darkMode ? "text-gray-400" : "text-gray-600"}>
                Analysis of {trades.length} completed trades
              </p>
            </div>
            
            <div className="flex items-center space-x-3">
              <button 
                onClick={toggleDarkMode}
                className={`
                  p-2 rounded-md transition-colors
                  ${darkMode ? 
                    "bg-gray-800 hover:bg-gray-700 text-gray-300" : 
                    "bg-gray-200 hover:bg-gray-300 text-gray-700"}
                `}
              >
                {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              
              {/* Export button (click = CSV, Shift+Click = print-to-PDF) */}
              <button
                onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                  if (filteredTrades.length === 0) return;
                  if (e.shiftKey) {
                    // Hold SHIFT to open a print dialog (user can "Save as PDF")
                    exportPrintPDF(filteredTrades);
                  } else {
                    // Default: export CSV
                    exportCSV(filteredTrades);
                  }
                }}
                className={`
                  flex items-center space-x-2 px-3 py-1.5 rounded-md text-sm
                  ${darkMode ? 
                    "bg-gray-800 border-gray-700 hover:bg-gray-700 text-gray-300" : 
                    "bg-white border-gray-300 hover:bg-gray-100 text-gray-700"}
                  border
                `}
                title="Click to export CSV • Shift+Click to print to PDF"
              >
                <Download className="w-4 h-4" />
                <span>Export</span>
              </button>
            </div>
          </div>

          {/* Performance Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={<DollarSign className={`w-5 h-5 ${
                darkMode ? "text-blue-400" : "text-blue-600"
              }`} />}
              label="Net P&L"
              value={
                <span className={netPnl && netPnl >= 0 ? "text-green-500" : "text-red-500"}>
                  {formatCurrency(netPnl)}
                </span>
              }
              subtext={`${formatCurrency(totalProfit)} profit • ${formatCurrency(totalLoss)} loss`}
              trend={netPnl ? (netPnl / Math.abs(totalProfit + totalLoss)) * 100 : 0}
            />
            
            <StatCard
              icon={<Target className={`w-5 h-5 ${
                darkMode ? "text-green-400" : "text-green-600"
              }`} />}
              label="Win Rate"
              value={
                <span className={
                  winRate >= 60 ? "text-green-600" : 
                  winRate >= 50 ? "text-green-400" : 
                  "text-red-500"
                }>
                  {winRate}%
                </span>
              }
              subtext={`${profitableTrades.length} wins • ${lossTrades.length} losses`}
              trend={winRate - 50}
            />
            
            <StatCard
              icon={<Trophy className={`w-5 h-5 ${
                darkMode ? "text-purple-400" : "text-purple-600"
              }`} />}
              label="Profit Factor"
              value={<span className={profitFactor >= 1.5 ? "text-green-500" : "text-red-500"}>{profitFactor.toFixed(2)}</span>}
              subtext={`${profitFactor >= 1.5 ? 'Good' : 'Needs improvement'}`}
            />
            
            <StatCard
              icon={<Activity className={`w-5 h-5 ${
                darkMode ? "text-orange-400" : "text-orange-600"
              }`} />}
              label="Risk/Reward"
              value={<span className={riskRewardRatio >= 1.5 ? "text-green-500" : "text-red-500"}>{riskRewardRatio.toFixed(2)}</span>}
              subtext={`${formatCurrency(avgWin)} avg win • ${formatCurrency(avgLoss)} avg loss`}
            />
          </div>

          {/* Performance Indicators */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <PerformanceIndicator 
              value={
                winRate >= 60 ? 45 : 
                winRate >= 50 ? 25 : 
                -25
              } 
              label={
                winRate >= 60 ? 'Excellent Win Rate' : 
                winRate >= 50 ? 'Average Win Rate' : 
                'Poor Win Rate'
              } 
            />
            <PerformanceIndicator 
              value={
                profitFactor >= 2 ? 50 : 
                profitFactor >= 1.5 ? 30 : 
                -30
              } 
              label={
                profitFactor >= 2 ? 'Excellent Profit Factor' : 
                profitFactor >= 1.5 ? 'Good Profit Factor' : 
                'Poor Profit Factor'
              } 
            />
            <PerformanceIndicator 
              value={
                riskRewardRatio >= 2 ? 40 : 
                riskRewardRatio >= 1.5 ? 20 : 
                -20
              } 
              label={
                riskRewardRatio >= 2 ? 'Great Risk/Reward' : 
                riskRewardRatio >= 1.5 ? 'Decent Risk/Reward' : 
                'Poor Risk/Reward'
              } 
            />
            <PerformanceIndicator 
              value={netPnl && netPnl > 0 ? 
                (netPnl > totalProfit * 0.3 ? 50 : 30) : 
                -40
              } 
              label={
                netPnl && netPnl > 0 ? 
                  (netPnl > totalProfit * 0.3 ? 'Highly Profitable' : 'Moderately Profitable') : 
                  'Overall Loss'
              } 
            />
          </div>

          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Search className={`w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 ${
                  darkMode ? "text-gray-500" : "text-gray-400"
                }`} />
                <input
                  type="text"
                  placeholder="Search trades..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`
                    pl-9 pr-3 py-1.5 rounded-md text-sm focus:outline-none focus:ring-1
                    ${darkMode ? 
                      "bg-gray-800 border-gray-700 focus:ring-blue-500 focus:border-blue-500 text-gray-200 placeholder-gray-500" : 
                      "bg-white border-gray-300 focus:ring-blue-500 focus:border-blue-500 text-gray-700 placeholder-gray-400"}
                    border
                  `}
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Filter className={`w-4 h-4 ${
                  darkMode ? "text-gray-500" : "text-gray-400"
                }`} />
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as "all" | "wins" | "losses")}
                  className={`
                    rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-1
                    ${darkMode ? 
                      "bg-gray-800 border-gray-700 focus:ring-blue-500 focus:border-blue-500 text-gray-200" : 
                      "bg-white border-gray-300 focus:ring-blue-500 focus:border-blue-500 text-gray-700"}
                    border
                  `}
                >
                  <option value="all">All Trades</option>
                  <option value="wins">Wins Only</option>
                  <option value="losses">Losses Only</option>
                </select>
              </div>
            </div>
            
            <div className={`text-sm ${
              darkMode ? "text-gray-500" : "text-gray-500"
            }`}>
              Showing {filteredTrades.length} of {trades.length} trades
            </div>
          </div>

          {/* Table */}
          <div className={`
            rounded-lg border overflow-hidden
            ${darkMode ? 
              "bg-gray-800 border-gray-700" : 
              "bg-white border-gray-200"}
          `}>
            <div className={`
              p-4 border-b
              ${darkMode ? 
                "bg-gray-700/50 border-gray-600" : 
                "bg-gray-50 border-gray-200"}
            `}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`
                    p-2 rounded-lg
                    ${darkMode ? "bg-blue-900/20" : "bg-blue-100"}
                  `}>
                    <BarChart2 className={`w-5 h-5 ${
                      darkMode ? "text-blue-400" : "text-blue-600"
                    }`} />
                  </div>
                  <div>
                    <h2 className={`text-lg font-semibold ${
                      darkMode ? "text-white" : "text-gray-900"
                    }`}>Trade History</h2>
                    <p className={`text-sm ${
                      darkMode ? "text-gray-400" : "text-gray-500"
                    }`}>
                      Detailed breakdown of trading activity
                    </p>
                  </div>
                </div>
                <div className={`flex items-center space-x-1 text-sm ${
                  darkMode ? "text-gray-500" : "text-gray-500"
                }`}>
                  <Calendar className="w-4 h-4" />
                  <span>Last updated: Just now</span>
                </div>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className={darkMode ? "bg-gray-700/50" : "bg-gray-50"}>
                  <tr className={darkMode ? "border-b border-gray-600" : "border-b border-gray-200"}>
                    <th className={`
                      py-3 px-4 text-center text-xs font-medium uppercase tracking-wider
                      ${darkMode ? "text-gray-400" : "text-gray-500"}
                    `}>
                      <div className="flex items-center space-x-1">
                        <Clock className={`w-4 h-4 ${
                          darkMode ? "text-gray-500" : "text-gray-400"
                        }`} />
                        <span>Timeline</span>
                      </div>
                    </th>
                    <th className={`
                      py-3 px-4 text-center text-xs font-medium uppercase tracking-wider
                      ${darkMode ? "text-gray-400" : "text-gray-500"}
                    `}>
                      Symbol
                    </th>
                    <th className={`
                      py-3 px-4 text-center text-xs font-medium uppercase tracking-wider
                      ${darkMode ? "text-gray-400" : "text-gray-500"}
                    `}>
                      Direction
                    </th>
                    <th className={`
                      py-3 px-4 text-center text-xs font-medium uppercase tracking-wider
                      ${darkMode ? "text-gray-400" : "text-gray-500"}
                    `}>
                      Size
                    </th>
                    <th className={`
                      py-3 px-4 text-center text-xs font-medium uppercase tracking-wider
                      ${darkMode ? "text-gray-400" : "text-gray-500"}
                    `}>
                      Entry
                    </th>
                    <th className={`
                      py-3 px-4 text-center text-xs font-medium uppercase tracking-wider
                      ${darkMode ? "text-gray-400" : "text-gray-500"}
                    `}>
                      Exit
                    </th>
                    <th className={`
                      py-3 px-4 text-center text-xs font-medium uppercase tracking-wider
                      ${darkMode ? "text-gray-400" : "text-gray-500"}
                    `}>
                      P&L
                    </th>
                    <th className={`
                      py-3 px-4 text-center text-xs font-medium uppercase tracking-wider
                      ${darkMode ? "text-gray-400" : "text-gray-500"}
                    `}>
                      Issues
                    </th>
                    <th className={`
                      py-3 px-4 text-center text-xs font-medium uppercase tracking-wider
                      ${darkMode ? "text-gray-400" : "text-gray-500"}
                    `}>
                      Insights
                    </th>
                  </tr>
                </thead>
                
                <tbody className={darkMode ? "divide-y divide-gray-700" : "divide-y divide-gray-200"}>
                  {filteredTrades.map((trade, idx) => {
                    const pnl = trade.PnL || 0;
                    const isProfit = pnl >= 0;
                    
                    return (
                      <tr key={idx} className={darkMode ? "hover:bg-gray-700/30" : "hover:bg-gray-50"}>
                        <td className={`py-3 px-4 text-sm ${
                          darkMode ? "text-gray-300" : "text-gray-700"
                        }`}>
                          <div className="space-y-1">
                            <div className={`font-medium ${
                              darkMode ? "text-white" : "text-gray-900"
                            }`}>
                              {trade.entry?.Date || "--"}
                            </div>
                            <div className={`text-xs ${
                              darkMode ? "text-gray-500" : "text-gray-500"
                            }`}>
                              {trade.exit?.Date || "--"}
                            </div>
                          </div>
                        </td>
                        
                        <td className="py-3 px-4">
                          <div className={`
                            px-2 py-1 rounded text-sm font-medium
                            ${darkMode ? 
                              "bg-gray-700 text-white" : 
                              "bg-gray-100 text-gray-900"}
                          `}>
                            {trade.symbol || "--"}
                          </div>
                        </td>
                        
                        <td className="py-3 px-4">
                          <div className="space-y-1">
                            <div className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                              trade.entry?.Direction === "Buy"
                                ? darkMode 
                                  ? "bg-green-900/30 text-green-400" 
                                  : "bg-green-100 text-green-800"
                                : darkMode 
                                  ? "bg-red-900/30 text-red-400" 
                                  : "bg-red-100 text-red-800"
                            }`}>
                              {trade.entry?.Direction === "Buy" ? (
                                <ArrowUp className="w-3 h-3 mr-1" />
                              ) : (
                                <ArrowDown className="w-3 h-3 mr-1" />
                              )}
                              {trade.entry?.Direction || "--"}
                            </div>
                            {trade.exit?.Direction && (
                              <div className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                trade.exit?.Direction === "Buy"
                                  ? darkMode 
                                    ? "bg-green-900/30 text-green-400" 
                                    : "bg-green-100 text-green-800"
                                  : darkMode 
                                    ? "bg-red-900/30 text-red-400" 
                                    : "bg-red-100 text-red-800"
                              }`}>
                                {trade.exit?.Direction === "Buy" ? (
                                  <ArrowUp className="w-3 h-3 mr-1" />
                                ) : (
                                  <ArrowDown className="w-3 h-3 mr-1" />
                                )}
                                Exit
                              </div>
                            )}
                          </div>
                        </td>
                        
                        <td className={`py-3 px-4 text-sm text-right font-medium ${
                          darkMode ? "text-gray-300" : "text-gray-700"
                        }`}>
                          {trade.entry?.Quantity?.toLocaleString() || "--"}
                        </td>
                        
                        <td className={`py-3 px-4 text-sm text-right ${
                          darkMode ? "text-gray-300" : "text-gray-700"
                        }`}>
                          {formatCurrency(trade.entry?.Price)}
                        </td>
                        
                        <td className={`py-3 px-4 text-sm text-right ${
                          darkMode ? "text-gray-300" : "text-gray-700"
                        }`}>
                          {formatCurrency(trade.exit?.Price)}
                        </td>
                        
                        <td className="py-3 px-4 text-right">
                          <div className={`inline-flex items-center px-2 py-1 rounded text-sm font-medium ${
                            isProfit 
                              ? darkMode 
                                ? "bg-green-900/30 text-green-400" 
                                : "bg-green-100 text-green-800"
                              : darkMode 
                                ? "bg-red-900/30 text-red-400" 
                                : "bg-red-100 text-red-800"
                          }`}>
                            {isProfit ? (
                              <TrendingUp className="w-4 h-4 mr-1" />
                            ) : (
                              <TrendingDown className="w-4 h-4 mr-1" />
                            )}
                            <span>{formatCurrency(pnl)}</span>
                          </div>
                        </td>
                        
                        <td className="py-3 px-4">
                          {trade.Demon && trade.Demon !== "--" ? (
                            <div className={`
                              rounded px-2 py-1 text-xs max-w-[140px] truncate
                              ${darkMode ? 
                                "bg-orange-900/30 text-orange-400" : 
                                "bg-orange-100 text-orange-800"}
                            `}>
                              {trade.Demon}
                            </div>
                          ) : (
                            <span className={`text-xs ${
                              darkMode ? "text-gray-600" : "text-gray-400"
                            }`}>None</span>
                          )}
                        </td>
                        
                        <td className="py-3 px-4">
                          {trade.GoodPractice && trade.GoodPractice !== "--" ? (
                            <div className={`
                              rounded px-2 py-1 text-xs max-w-[140px] truncate
                              ${darkMode ? 
                                "bg-blue-900/30 text-blue-400" : 
                                "bg-blue-100 text-blue-800"}
                            `}>
                              {trade.GoodPractice}
                            </div>
                          ) : (
                            <span className={`text-xs ${
                              darkMode ? "text-gray-600" : "text-gray-400"
                            }`}>None</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </ThemeContext.Provider>
  );
};

export default TradesTable;
