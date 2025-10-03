// src/components/dashboard/views/AlgoDashboardBody.tsx
import React, { useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";
import {
  ArrowUpRight,
  ArrowDownRight,
  Activity as ActivityIcon,
  Bell,
  BarChart3 as ScanIcon,
  BookOpen,
} from "lucide-react";
import { prettyINR } from "../utils/misc";
import {
  StrategyPnL,
  TriggeredTrade,
  LivePosition,
  Stat,
  ProductUI,
} from "../types";

type SortBy = "pnl" | "winRate" | "trades";
type SortDir = "asc" | "desc";

interface Props {
  userName?: string | null;

  // date selection state
  isToday: boolean;
  selectedKey: string;
  dateInputISO: string;
  setDateInputISO: (v: string) => void;
  availableKeys: Set<string>;
  availableListAsc: string[];
  dateInputNoData: string | null;
  setDateInputNoData: (v: string | null) => void;
  dateKeyToISO: (dk: string) => string;
  isoToDateKey: (iso: string) => string;
  todayISO: () => string;

  // navigation
  canGoPrev: boolean;
  canGoNext: boolean;
  goPrev: () => void;
  goNext: () => void;
  setSelectedKey: (v: string) => void;

  // summary + stats
  summaryError: string | null;
  statCards: Stat[];

  // strategies list
  strategiesLoading: boolean;
  strategiesError: string | null;
  strategiesView: StrategyPnL[];
  sortBy: SortBy;
  sortDir: SortDir;
  setSortBy: (v: SortBy) => void;
  setSortDir: (v: SortDir) => void;

  // products grid
  productsUI: ProductUI[];
  loadingEntitlements: boolean;

  // trades/positions data
  tradesLoading: boolean;
  tradesError: string | null;
  trades: TriggeredTrade[];
  positionsLoading: boolean;
  positionsError: string | null;
  positions: LivePosition[];

  // loaders (must use current date range inside)
  loadTriggeredTrades: (opts?: { strategy?: string }) => Promise<void>;
  loadLivePositions: () => Promise<void>;
}

/** Centered, portaled hover popup */
const HoverPopup: React.FC<{
  width?: number;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  children: React.ReactNode;
}> = ({ width = 900, onMouseEnter, onMouseLeave, children }) =>
  ReactDOM.createPortal(
    <div
      style={{
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width,
        maxWidth: "95vw",
        maxHeight: "70vh",
        zIndex: 1000,
      }}
      className="rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      role="dialog"
      aria-modal="false"
    >
      {children}
    </div>,
    document.body
  );

// matcher for strategy text
const norm = (s?: string | null) => (s ?? "").toLowerCase().replace(/\s+/g, "");

// Live Activity types/helpers
type LiveCategory = "scans" | "trades" | "alerts" | "journal";
type Priority = "high" | "normal" | "low";
type LiveEvent = {
  id: string;
  ts: number;
  category: LiveCategory;
  source: string;
  title: string;
  message: string;
  priority?: Priority;
  href?: string;
};

const timeAgo = (ts: number) => {
  const d = Math.max(0, Date.now() - Number(ts));
  const m = Math.floor(d / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m} min${m === 1 ? "" : "s"} ago`;
  const h = Math.floor(m / 60);
  return `${h} hr${h === 1 ? "" : "s"} ago`;
};

const priorityChip = (p?: Priority) =>
  p === "high" ? "High Priority" : p === "low" ? "Low Priority" : "Normal";

const AlgoDashboardBody: React.FC<Props> = ({
  userName,

  isToday,
  selectedKey,
  dateInputISO,
  setDateInputISO,
  availableKeys,
  availableListAsc,
  dateInputNoData,
  setDateInputNoData,
  dateKeyToISO,
  isoToDateKey,
  todayISO,

  canGoPrev,
  canGoNext,
  goPrev,
  goNext,
  setSelectedKey,

  summaryError,
  statCards,

  strategiesLoading,
  strategiesError,
  strategiesView,
  sortBy,
  sortDir,
  setSortBy,
  setSortDir,

  productsUI,
  loadingEntitlements,

  tradesLoading,
  tradesError,
  trades,

  positionsLoading,
  positionsError,
  positions,

  loadTriggeredTrades,
  loadLivePositions,
}) => {
  // Hover popups
  const [openTrades, setOpenTrades] = useState(false);
  const [openPos, setOpenPos] = useState(false);
  const [overTradesPopup, setOverTradesPopup] = useState(false);
  const [overPosPopup, setOverPosPopup] = useState(false);
  const [filterStrategy, setFilterStrategy] = useState<string | null>(null);

  // Close-delay timers
  const tradesCloseTimer = useRef<number | null>(null);
  const posCloseTimer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (tradesCloseTimer.current) window.clearTimeout(tradesCloseTimer.current);
      if (posCloseTimer.current) window.clearTimeout(posCloseTimer.current);
    };
  }, []);

  const startDelayedCloseTrades = () => {
    if (tradesCloseTimer.current) window.clearTimeout(tradesCloseTimer.current);
    tradesCloseTimer.current = window.setTimeout(() => {
      if (!overTradesPopup) setOpenTrades(false);
      tradesCloseTimer.current = null;
    }, 150);
  };

  const startDelayedClosePos = () => {
    if (posCloseTimer.current) window.clearTimeout(posCloseTimer.current);
    posCloseTimer.current = window.setTimeout(() => {
      if (!overPosPopup) setOpenPos(false);
      posCloseTimer.current = null;
    }, 150);
  };

  // ✅ Always reload trades when the selected date key changes.
  useEffect(() => {
    (async () => {
      try {
        await loadTriggeredTrades();
      } catch {}
    })();
    setFilterStrategy(null);
    setOpenTrades(false);
    setOpenPos(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedKey]);

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

  // Build Live Activity from trades/positions
  const tradePriority = (t: TriggeredTrade): Priority => {
    const notional =
      (Number.isFinite(Number(t.qty)) ? Number(t.qty) : 0) *
      (Number.isFinite(Number(t.price)) ? Number(t.price) : 0);
    if (notional >= 100000) return "high";
    if (notional <= 10000) return "low";
    return "normal";
  };

  const tradeEvents: LiveEvent[] = trades
    .slice()
    .sort((a, b) => (Number(b.ts) || 0) - (Number(a.ts) || 0))
    .slice(0, 20)
    .map((t) => ({
      id: `trade-${t.id}`,
      ts: Number(t.ts) || Date.now(),
      category: "trades",
      source: "ALGO Simulator",
      title: t.strategy || "ALGO Trade",
      message: `${t.side} ${t.qty} ${t.symbol} @ ${prettyINR(t.price) || t.price}`,
      priority: tradePriority(t),
    }));

  const alertEvents: LiveEvent[] =
    positions.length > 0
      ? [
          {
            id: "alert-open-positions",
            ts: positions[0]?.ts ? Number(positions[0].ts) : Date.now(),
            category: "alerts",
            source: "Risk Monitor",
            title: "Open Positions",
            message: `${positions.length} position${positions.length > 1 ? "s" : ""} currently open`,
            priority: "normal",
          },
        ]
      : [];

  const scanEvents: LiveEvent[] = [];
  const journalEvents: LiveEvent[] = [];

  const allEvents: LiveEvent[] = [...tradeEvents, ...alertEvents, ...scanEvents, ...journalEvents].sort(
    (a, b) => b.ts - a.ts
  );

  type Tab = "all" | "scans" | "trades" | "alerts";
  const [tab, setTab] = useState<Tab>("all");
  const filteredEvents = tab === "all" ? allEvents : allEvents.filter((e) => e.category === tab);

  return (
    <>
      {/* Welcome */}
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <h1 className="text-left text-3xl font-bold text-gray-900 mb-2">
              Welcome back,{" "}
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {userName}
              </span>
            </h1>
            <p className="text-gray-600 text-lg">
              We help you trade smarter — <span className="text-green-600 font-semibold">one green candle</span>{" "}
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

      {/* Date controls */}
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

        {dateInputNoData && <span className="text-sm text-rose-600 ml-2">{dateInputNoData}</span>}
      </div>

      <div className="col-span-full -mt-2 text-sm text-slate-500 mb-2">
        Viewing: {isToday ? "Today (Live)" : selectedKey}
      </div>

      {summaryError && <div className="mb-4 text-sm text-rose-600">{summaryError}</div>}

      {/* Stats (hover to open popups) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        {statCards.map((stat, i) => {
          const isTrades = stat.title === "Triggered Trades";
          const isPos = stat.title === "Live Positions";

          const onEnter = async () => {
            if (isTrades) {
              await loadTriggeredTrades(); // always fetch fresh for current date range
              setFilterStrategy(null);
              setOpenTrades(true);
            } else if (isPos) {
              await loadLivePositions();
              setOpenPos(true);
            }
          };

          const onLeave = () => {
            if (isTrades) startDelayedCloseTrades();
            if (isPos) startDelayedClosePos();
          };

          return (
            <div
              key={i}
              className={`bg-white p-6 rounded-2xl border border-gray-100 hover:shadow-lg shadow-xl transition-all duration-200 group ${
                isTrades || isPos ? "cursor-default" : ""
              }`}
              onMouseEnter={isTrades || isPos ? onEnter : undefined}
              onMouseLeave={isTrades || isPos ? onLeave : undefined}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl bg-gradient-to-r ${stat.gradient} text-white`}>{stat.icon}</div>
                <div className="text-right">
                  <div
                    className={`flex items-center text-sm font-medium ${
                      stat.trend === "up" ? "text-green-600" : "text-red-600"
                    }`}
                  >
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
          );
        })}
      </div>

      {/* Strategy-wise Performance */}
      <div className="mb-8">
        <div className="relative overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-md">
          <div className="relative p-6 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-800">Strategy-wise Performance</h2>
                <p className="text-slate-500">
                  Aggregated from ALGO-only orders (<code className="px-1 bg-slate-100 rounded">TV_*</code>)
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div className="inline-flex overflow-hidden rounded-lg border border-slate-200">
                  <button
                    onClick={() => setSortBy("pnl")}
                    className={`px-3 py-1.5 text-sm ${
                      sortBy === "pnl" ? "bg-indigo-600 text-white" : "bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    P&L
                  </button>
                  <button
                    onClick={() => setSortBy("winRate")}
                    className={`px-3 py-1.5 text-sm border-l border-slate-200 ${
                      sortBy === "winRate" ? "bg-indigo-600 text-white" : "bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    Win %
                  </button>
                  <button
                    onClick={() => setSortBy("trades")}
                    className={`px-3 py-1.5 text-sm border-l border-slate-200 ${
                      sortBy === "trades" ? "bg-indigo-600 text-white" : "bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    Trades
                  </button>
                </div>

                <button
                  onClick={() => setSortDir(sortDir === "desc" ? "asc" : "desc")}
                  className="px-3 py-1.5 text-sm rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                >
                  {sortDir === "desc" ? "↓" : "↑"}
                </button>
              </div>
            </div>
          </div>

          <div className="relative p-6 overflow-x-auto">
            {strategiesError && <div className="text-sm text-rose-600 mb-3">{strategiesError}</div>}

            {strategiesLoading ? (
              <div className="space-y-2">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-10 w-full rounded-lg bg-slate-100 animate-pulse" />
                ))}
              </div>
            ) : strategiesView.length === 0 ? (
              <div className="flex items-center gap-3 rounded-xl border border-dashed border-slate-200 p-6 text-slate-600">
                <div className="h-9 w-9 rounded-lg bg-slate-100" />
                <div>
                  <div className="font-medium">No strategy trades for this day</div>
                  <div className="text-sm text-slate-500">Try a different date or clear filters.</div>
                </div>
              </div>
            ) : (
              <table className="min-w-full text-sm">
                <thead className="sticky top-0 bg-white/80 backdrop-blur border-b">
                  <tr className="text-left text-slate-500">
                    <th className="py-2 pr-4 font-medium">Strategy</th>
                    <th className="py-2 pr-4 font-medium">P&L</th>
                    <th className="py-2 pr-4 font-medium">Trades</th>
                    <th className="py-2 pr-4 font-medium">Win %</th>
                    <th className="py-2 pr-4 font-medium">R:R</th>
                    <th className="py-2 pr-0 font-medium">Open Pos.</th>
                  </tr>
                </thead>
                <tbody>
                  {strategiesView.map((row) => {
                    const positive = (row.pnl ?? 0) > 0;
                    const pnlText = prettyINR(row.pnl) || row.pnl.toFixed(2);
                    const rr = row.rnr;
                    const rrClass =
                      rr === null
                        ? "bg-slate-100 text-slate-700"
                        : rr >= 1.5
                        ? "bg-emerald-100 text-emerald-700"
                        : rr >= 1.0
                        ? "bg-amber-100 text-amber-700"
                        : "bg-rose-100 text-rose-700";
                    const winPct = Math.max(0, Math.min(100, Math.round(row.winRatePct)));

                    return (
                      <tr key={row.strategyName} className="group border-b last:border-0 hover:bg-slate-50 transition-colors">
                        <td className="py-2 pr-4 align-middle">
                          <button
                            className="flex items-center gap-3 hover:underline text-left"
                            onMouseEnter={async () => {
                              if (tradesCloseTimer.current) {
                                window.clearTimeout(tradesCloseTimer.current);
                                tradesCloseTimer.current = null;
                              }
                              await loadTriggeredTrades({ strategy: row.strategyName });
                              setFilterStrategy(row.strategyName);
                              setOpenTrades(true);
                            }}
                            onClick={async () => {
                              await loadTriggeredTrades({ strategy: row.strategyName });
                              setFilterStrategy(row.strategyName);
                              setOpenTrades(true);
                            }}
                            onMouseLeave={startDelayedCloseTrades}
                            title="View trades for this strategy"
                          >
                            <span
                              className={`h-3 w-1.5 rounded-full ${
                                positive ? "bg-emerald-500" : row.pnl < 0 ? "bg-rose-500" : "bg-slate-300"
                              }`}
                              aria-hidden
                            />
                            <span className="font-medium text-slate-800">{row.strategyName}</span>
                          </button>
                        </td>

                        <td className="py-2 pr-4 font-semibold">
                          <span
                            className={`inline-flex items-center rounded-md px-2 py-0.5 ${
                              positive
                                ? "text-emerald-700 bg-emerald-50"
                                : row.pnl < 0
                                ? "text-rose-700 bg-rose-50"
                                : "text-slate-700 bg-slate-50"
                            }`}
                          >
                            {pnlText}
                          </span>
                        </td>

                        <td className="py-2 pr-4">
                          <span className="inline-flex items-center gap-2">
                            <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-indigo-700 font-medium">
                              {row.orders}
                            </span>
                            <span className="text-slate-400">orders</span>
                          </span>
                        </td>

                        <td className="py-2 pr-4">
                          <div className="w-36">
                            <div className="flex items-center justify-between text-xs text-slate-500">
                              <span className="font-medium text-slate-700">{winPct}%</span>
                            </div>
                            <div className="mt-1 h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-500"
                                style={{ width: `${winPct}%` }}
                                aria-label={`Win rate ${winPct}%`}
                              />
                            </div>
                          </div>
                        </td>

                        <td className="py-2 pr-4">
                          <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-sm font-medium ${rrClass}`}>
                            {rr === null ? "—" : rr.toFixed(2)}
                          </span>
                        </td>

                        <td className="py-2 pr-0">
                          <span className="inline-flex items-center gap-2">
                            <span className={`h-2.5 w-2.5 rounded-full ${row.openPositions ? "bg-amber-500" : "bg-slate-300"}`} />
                            <span className="text-slate-700 font-medium">{row.openPositions}</span>
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Main Grid (Products + Live Activity) */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Trading Products */}
        <div className="xl:col-span-2">
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-md">
            <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-800 mb-1">Your Trading Arsenal</h2>
                  <p className="text-slate-500">Only the tools you own are shown here</p>
                </div>
              </div>
            </div>

            <div className="p-6">
              {loadingEntitlements ? (
                <div className="text-sm text-slate-500">Loading your products…</div>
              ) : productsUI.length === 0 ? (
                <div className="text-slate-600 text-sm">You don’t have any products yet.</div>
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

                        <h3 className="font-semibold text-indigo-700 mb-1 transition-colors">{product.name}</h3>
                        <p className="text-sm text-slate-500 mb-3">{product.description}</p>

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
                                  v.key.toLowerCase() === "pro"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : v.key.toLowerCase() === "starter"
                                    ? "bg-indigo-100 text-indigo-700"
                                    : "bg-emerald-100 text-emerald-700"
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
                          <div
                            className={`flex items-center text-sm font-medium ${
                              product.trend === "up" ? "text-emerald-600" : "text-rose-600"
                            }`}
                          >
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

        {/* Live Activity (right column) */}
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-md">
          <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-800 mb-1">Live Activity</h2>
              <div className="flex items-center gap-2 text-sm">
                <span className="inline-flex items-center gap-1 text-emerald-600">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  Live
                </span>
              </div>
            </div>
            <p className="text-sm text-slate-500">Real-time trading updates</p>

            <div className="mt-3 flex items-center gap-2">
              {(["all", "scans", "trades", "alerts"] as Tab[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`px-3 py-1.5 rounded-lg text-sm ${
                    tab === t ? "bg-indigo-100 text-indigo-700" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {t === "all" ? "All" : t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6 space-y-4">
            {filteredEvents.length === 0 ? (
              <div className="text-sm text-slate-500">No live activity yet.</div>
            ) : (
              filteredEvents.map((ev) => {
                const Icon =
                  ev.category === "trades"
                    ? ActivityIcon
                    : ev.category === "alerts"
                    ? Bell
                    : ev.category === "scans"
                    ? ScanIcon
                    : BookOpen;

                const chip =
                  ev.priority === "high"
                    ? "bg-rose-100 text-rose-700"
                    : ev.priority === "low"
                    ? "bg-slate-100 text-slate-600"
                    : "bg-amber-100 text-amber-700";

                const iconBg =
                  ev.category === "trades"
                    ? "bg-gradient-to-br from-indigo-100 to-indigo-50 text-indigo-600"
                    : ev.category === "alerts"
                    ? "bg-gradient-to-br from-rose-100 to-rose-50 text-rose-600"
                    : ev.category === "scans"
                    ? "bg-gradient-to-br from-fuchsia-100 to-fuchsia-50 text-fuchsia-600"
                    : "bg-gradient-to-br from-amber-100 to-amber-50 text-amber-600";

                return (
                  <div key={ev.id} className="flex items-start gap-3 p-4 rounded-xl bg-slate-50/70">
                    <div className={`h-10 w-10 shrink-0 grid place-items-center rounded-xl ${iconBg}`}>
                      <Icon className="h-5 w-5" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <a href={ev.href || "#"} className="font-semibold text-indigo-700 hover:underline">
                          {ev.title}
                        </a>
                        <span className="text-xs text-slate-500">{timeAgo(ev.ts)}</span>
                      </div>
                      <div className="text-slate-700 text-sm mt-0.5 truncate">{ev.message}</div>

                      <div className="mt-2">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${chip}`}>
                          {priorityChip(ev.priority)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Hover Popups */}
      {openTrades && (
        <HoverPopup
          onMouseEnter={() => setOverTradesPopup(true)}
          onMouseLeave={() => {
            setOverTradesPopup(false);
            setOpenTrades(false);
          }}
        >
          <div className="flex items-center justify-between p-4 border-b bg-white">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">
                Triggered Trades · {isToday ? "Today" : selectedKey}
              </h3>
              {filterStrategy ? (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-slate-500">Filtered by:</span>
                  <span className="font-medium text-slate-800">{filterStrategy}</span>
                  <button
                    className="ml-2 text-xs px-2 py-1 rounded-md border border-slate-200 hover:bg-slate-50"
                    onClick={async () => {
                      setFilterStrategy(null);
                      await loadTriggeredTrades();
                    }}
                  >
                    Clear filter
                  </button>
                </div>
              ) : (
                <p className="text-slate-500 text-sm">Latest orders</p>
              )}
            </div>
          </div>

          <div className="p-4 overflow-auto" style={{ maxHeight: "calc(70vh - 64px)" }}>
            {tradesLoading ? (
              <div className="space-y-2">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-10 w-full rounded-lg bg-slate-100 animate-pulse" />
                ))}
              </div>
            ) : (
              (() => {
                const visibleTrades = filterStrategy
                  ? trades.filter((t) => norm(t.strategy).includes(norm(filterStrategy)))
                  : trades;

                return visibleTrades.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-200 p-6 text-slate-600">
                    No trades for this strategy in the range.
                  </div>
                ) : (
                  <table className="min-w-full text-sm">
                    <thead className="bg-slate-50 border-b">
                      <tr className="text-left text-slate-500">
                        <th className="py-2 px-3 font-medium">Time</th>
                        <th className="py-2 px-3 font-medium">Symbol</th>
                        <th className="py-2 px-3 font-medium">Side</th>
                        <th className="py-2 px-3 font-medium">Qty</th>
                        <th className="py-2 px-3 font-medium">Price</th>
                        <th className="py-2 px-3 font-medium">Strategy</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibleTrades.map((t) => {
                        const time = t.ts ? new Date(t.ts).toLocaleTimeString() : "—";
                        return (
                          <tr key={t.id} className="border-b last:border-0">
                            <td className="py-2 px-3">{time}</td>
                            <td className="py-2 px-3 font-medium text-slate-800">{t.symbol}</td>
                            <td className="py-2 px-3">
                              <span
                                className={`px-2 py-0.5 rounded text-xs font-semibold ${
                                  t.side === "BUY" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                                }`}
                              >
                                {t.side}
                              </span>
                            </td>
                            <td className="py-2 px-3">{t.qty}</td>
                            <td className="py-2 px-3">{prettyINR(t.price) || t.price}</td>
                            <td className="py-2 px-3">{t.strategy || "—"}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                );
              })()
            )}
            {tradesError && <div className="mt-3 text-sm text-rose-600">{tradesError}</div>}
          </div>
        </HoverPopup>
      )}

      {openPos && (
        <HoverPopup
          onMouseEnter={() => setOverPosPopup(true)}
          onMouseLeave={() => {
            setOverPosPopup(false);
            setOpenPos(false);
          }}
        >
          <div className="flex items-center justify-between p-4 border-b bg-white">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">
                Live Positions · {isToday ? "Today" : selectedKey}
              </h3>
              <p className="text-slate-500 text-sm">Open positions (latest)</p>
            </div>
          </div>

          <div className="p-4 overflow-auto" style={{ maxHeight: "calc(70vh - 64px)" }}>
            {positionsLoading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-10 w-full rounded-lg bg-slate-100 animate-pulse" />
                ))}
              </div>
            ) : positions.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 p-6 text-slate-600">
                No open positions in this range.
              </div>
            ) : (
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 border-b">
                  <tr className="text-left text-slate-500">
                    <th className="py-2 px-3 font-medium">Symbol</th>
                    <th className="py-2 px-3 font-medium">Qty</th>
                    <th className="py-2 px-3 font-medium">Avg Price</th>
                    <th className="py-2 px-3 font-medium">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {positions.map((p) => {
                    const time = p.ts ? new Date(Number(p.ts)).toLocaleTimeString() : "—";
                    return (
                      <tr key={p.id} className="border-b last:border-0">
                        <td className="py-2 px-3 font-medium text-slate-800">{p.symbol}</td>
                        <td className="py-2 px-3">{p.qty}</td>
                        <td className="py-2 px-3">{prettyINR(p.avgPrice) || p.avgPrice}</td>
                        <td className="py-2 px-3">{time}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
            {positionsError && <div className="mt-3 text-sm text-rose-600">{positionsError}</div>}
          </div>
        </HoverPopup>
      )}
    </>
  );
};

export default AlgoDashboardBody;