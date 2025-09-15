import { useState, useMemo } from "react";
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";

interface Trade {
  symbol: string;
  entry: { Date: string; Time?: string };
  exit: { Date: string; Time?: string };
  PnL: number;
  isBadTrade: boolean;
  isGoodTrade: boolean;
  DemonArr?: string[];
  GoodPracticeArr?: string[];
}

interface Props {
  trades?: Trade[];
  /** Broker-exact net P&L from backend; when provided, this is used for "Actual Net P&L" */
  netPnl?: number;
}

const round2 = (n: number) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

export default function DemonFinder({ trades = [], netPnl }: Props) {
  const [modal, setModal] = useState<{ title: string; list: Trade[] } | null>(null);

  const filtered = trades;

  // ---- Time-series for chart (Good/Bad counts per date) ----
  const dateStats = useMemo(() => {
    const map: Record<string, { date: string; Bad: number; Good: number }> = {};
    filtered.forEach(t => {
      const d = t.exit.Date;
      if (!map[d]) map[d] = { date: d, Bad: 0, Good: 0 };
      if (t.PnL < 0) map[d].Bad++;
      if (t.PnL > 0) map[d].Good++;
    });
    return Object.values(map).sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }, [filtered]);

  // Helper to dedupe trades when summing
  function uniqueTradePnLSum(tradesArr: Trade[], filter: (t: Trade) => boolean, sign: "neg" | "pos") {
    const seen = new Set();
    let sum = 0;
    tradesArr.forEach((t) => {
      if (!filter(t)) return;
      const key = `${t.symbol}-${t.entry.Date}-${t.entry.Time || ""}-${t.exit.Date}-${t.exit.Time || ""}`;
      if (seen.has(key)) return;
      if (sign === "neg" && t.PnL < 0) sum += Math.abs(t.PnL);
      if (sign === "pos" && t.PnL > 0) sum += t.PnL;
      seen.add(key);
    });
    return sum;
  }

  // ---- Tag-based metrics ----
  const badMetrics = useMemo(() => {
    const tagMap: Record<string, { count: number; trades: Trade[] }> = {};
    filtered.forEach(t => {
      t.DemonArr?.forEach(d => {
        if (!tagMap[d]) tagMap[d] = { count: 0, trades: [] };
        tagMap[d].count++;
        tagMap[d].trades.push(t);
      });
    });
    return Object.entries(tagMap).map(([name, v]) => {
      const unique = Array.from(new Set(v.trades));
      const seen = new Set();
      let cost = 0;
      unique.forEach(t => {
        const key = `${t.symbol}-${t.entry.Date}-${t.entry.Time || ""}-${t.exit.Date}-${t.exit.Time || ""}`;
        if (seen.has(key)) return;
        if (t.PnL < 0) cost += Math.abs(t.PnL);
        seen.add(key);
      });
      return { name, count: v.count, trades: unique, cost };
    });
  }, [filtered]);

  const goodMetrics = useMemo(() => {
    const tagMap: Record<string, { count: number; trades: Trade[] }> = {};
    filtered.forEach(t => {
      t.GoodPracticeArr?.forEach(g => {
        if (!tagMap[g]) tagMap[g] = { count: 0, trades: [] };
        tagMap[g].count++;
        tagMap[g].trades.push(t);
      });
    });
    return Object.entries(tagMap).map(([name, v]) => {
      const unique = Array.from(new Set(v.trades));
      const seen = new Set();
      let profit = 0;
      unique.forEach(t => {
        const key = `${t.symbol}-${t.entry.Date}-${t.entry.Time || ""}-${t.exit.Date}-${t.exit.Time || ""}`;
        if (seen.has(key)) return;
        if (t.PnL > 0) profit += t.PnL;
        seen.add(key);
      });
      return { name, count: v.count, trades: unique, profit };
    });
  }, [filtered]);

  // ---- Totals ----
  // Use broker-exact net if provided; otherwise fall back to sum of paired trades.
  const sumOfPairs = useMemo(() => filtered.reduce((sum, t) => sum + t.PnL, 0), [filtered]);
  const actualNetPnL = useMemo(
    () => (typeof netPnl === "number" && !Number.isNaN(netPnl) ? round2(netPnl) : round2(sumOfPairs)),
    [netPnl, sumOfPairs]
  );
  const badCost = useMemo(() => round2(uniqueTradePnLSum(filtered, t => t.isBadTrade, "neg")), [filtered]);
  const potentialPnL = useMemo(() => round2(actualNetPnL + badCost), [actualNetPnL, badCost]);

  // ---- Best/Worst trades ----
  const bestTrade = useMemo(() => {
    let best: Trade | null = null;
    for (const t of filtered) if (best === null || t.PnL > best.PnL) best = t;
    return best;
  }, [filtered]);

  const topDemon = useMemo(() => {
    const sorted = [...badMetrics].sort((a, b) => b.cost - a.cost || b.count - a.count);
    return sorted[0];
  }, [badMetrics]);

  const topGood = useMemo(() => {
    const sorted = [...goodMetrics].sort((a, b) => b.profit - a.profit || b.count - a.count);
    return sorted[0];
  }, [goodMetrics]);

  // ---- Single-session quality metrics (realistic for a single day) ----
  const wins = useMemo(() => filtered.filter(t => t.PnL > 0), [filtered]);
  const losses = useMemo(() => filtered.filter(t => t.PnL < 0), [filtered]);
  const hitRate = useMemo(
    () => (filtered.length ? (wins.length / filtered.length) * 100 : 0),
    [filtered.length, wins.length]
  );
  const grossProfit = useMemo(() => wins.reduce((s, t) => s + t.PnL, 0), [wins]);
  const grossLoss = useMemo(() => losses.reduce((s, t) => s + Math.abs(t.PnL), 0), [losses]);
  const profitFactor = useMemo(
    () => (grossLoss > 0 ? grossProfit / grossLoss : (grossProfit > 0 ? Infinity : 0)),
    [grossProfit, grossLoss]
  );

  // Max drawdown over the session (sort by exit time)
  const maxDD = useMemo(() => {
    const chron = [...filtered].sort((a, b) => {
      const toTs = (t: Trade) => new Date(`${t.exit.Date}T${t.exit.Time || "00:00"}`).getTime();
      return toTs(a) - toTs(b);
    });
    let run = 0, peak = 0, dd = 0;
    chron.forEach(t => {
      run += t.PnL;
      peak = Math.max(peak, run);
      dd = Math.max(dd, peak - run);
    });
    return dd;
  }, [filtered]);

  // Layout
  const panelHeight = 320; // ⬅️ increased height

  // Small presentational pieces
  const StatRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div className="flex items-center justify-between">
      <span className="text-[10px] text-gray-400">{label}</span>
      <span className="text-[11px] font-semibold text-gray-200">{value}</span>
    </div>
  );

  return (
    <>
      <style>
        {`
          body { background: #0a0d13; }
          .classic-shadow { box-shadow: 0 4px 16px rgba(0,0,0,0.4); }
          .classic-shadow-lg { box-shadow: 0 8px 22px rgba(0,0,0,0.43); }
          .classic-border { border: 1px solid #21263b; }
          .classic-hover:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.45); transform: translateY(-1px);}
          .classic-transition { transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);}
          .thin-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
          .thin-scrollbar::-webkit-scrollbar-track { background: #1c2130; border-radius: 2px; }
          .thin-scrollbar::-webkit-scrollbar-thumb { background: #333a56; border-radius: 2px; }
          .thin-scrollbar::-webkit-scrollbar-thumb:hover { background: #5e6686; }
          .thin-scrollbar { scrollbar-width: thin; scrollbar-color: #333a56 #1c2130; }
          .elegant-card {
            background: bg-[#0a0d13];
            border: 1px solid #21263b;
            box-shadow: 0 2px 9px rgba(0,0,0,0.18);
          }
          .metric-card {
            background: bg-[#0a0d13];
            border: 1px solid #21263b;
            box-shadow: 0 2px 8px rgba(0,0,0,0.15);
          }
          .gradient-red { background: linear-gradient(135deg, #ef4444 0%, #991b1b 100%);}
          .gradient-green { background: linear-gradient(135deg, #22c55e 0%, #14532d 100%);}
          .gradient-blue { background: linear-gradient(135deg, #6366f1 0%, #312e81 100%);}
          .gradient-purple { background: linear-gradient(135deg, #a78bfa 0%, #6d28d9 100%);}
          
          /* Responsive additions */
          @media (max-width: 768px) {
            .daily-trend-section {
              flex-direction: column;
            }
            
            .daily-trend-left, .daily-trend-right {
              width: 100% !important;
            }
            
            .daily-trend-grid {
              grid-template-columns: 1fr;
              gap: 1rem;
            }
            
            .impact-summary {
              flex-direction: column;
            }
            
            .impact-item {
              margin-bottom: 0.5rem;
            }
            
            .metrics-panels {
              grid-template-columns: 1fr;
            }
          }
          
          @media (max-width: 640px) {
            .modal-grid-header, .modal-grid-row {
              grid-template-columns: 1fr 1fr;
            }
            
            .modal-grid-header div:nth-child(2),
            .modal-grid-header div:nth-child(3),
            .modal-grid-row div:nth-child(2),
            .modal-grid-row div:nth-child(3) {
              display: none;
            }
            
            .daily-trend-grid {
              grid-template-columns: 1fr 1fr;
              gap: 0.75rem;
            }
            
            .daily-trend-grid > div {
              min-height: 140px;
            }
          }
          
          @media (max-width: 480px) {
            .chart-container {
              height: 250px !important;
            }
            
            .daily-trend-grid {
              grid-template-columns: 1fr;
              gap: 0.75rem;
            }
          }
        `}
      </style>

      <div className="max-w-full bg-[#0a0d13] min-h-screen text-gray-100 text-[0.85rem]">
        {/* Metrics Panels */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 mb-5 metrics-panels">
          {/* Bad Trades Panel */}
          <div className="metric-card rounded-md p-4 classic-transition classic-hover">
            <div className="flex items-center space-x-1 mb-3">
              <div className="w-6 h-6 gradient-red rounded-sm flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.4" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"></path>
                </svg>
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-100">Risk Analysis</h2>
                <p className="text-gray-400 font-medium text-[10px]">Problematic Trade Patterns</p>
              </div>
            </div>
            <div className="thin-scrollbar overflow-y-auto max-h-56 space-y-3">
              {badMetrics.map((m) => (
                <div
                  key={m.name}
                  className="group p-4 bg-[#191e27] border border-[#23283d] hover:border-red-400 hover:bg-[#2c2027] rounded-sm cursor-pointer classic-transition"
                  onClick={() => setModal({ title: m.name, list: m.trades })}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex flex-col">
                      <span className="font-bold text-gray-200 text-xs group-hover:text-red-400 classic-transition">
                        {m.name}
                      </span>
                      <span className="text-[10px] text-gray-400 font-medium">
                        {m.count} trade{m.count !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-red-400 text-xs">
                        ₹{m.cost.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Good Trades Panel */}
          <div className="metric-card rounded-md p-4 classic-transition classic-hover">
            <div className="flex items-center space-x-1 mb-3">
              <div className="w-6 h-6 gradient-green rounded-sm flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.4" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
                </svg>
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-100">Success Analysis</h2>
                <p className="text-gray-400 font-medium text-[10px]">Profitable Trade Patterns</p>
              </div>
            </div>
            <div className="thin-scrollbar overflow-y-auto max-h-56 space-y-3">
              {goodMetrics.map((m) => (
                <div
                  key={m.name}
                  className="group p-4 bg-[#191e27] border border-[#23283d] hover:border-green-400 hover:bg-[#1a2c20] rounded-sm cursor-pointer classic-transition"
                  onClick={() => setModal({ title: m.name, list: m.trades })}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex flex-col">
                      <span className="font-bold text-gray-200 text-xs group-hover:text-green-400 classic-transition">
                        {m.name}
                      </span>
                      <span className="text-[10px] text-gray-400 font-medium">
                        {m.count} trade{m.count !== 1 ? "s" : ""} executed
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-green-400 text-xs">
                        ₹{m.profit.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* HORIZONTAL IMPACT SUMMARY */}
        <div className="w-full my-4">
          <div className="elegant-card p-4 rounded-md classic-shadow-lg">
            <h2 className="text-base font-bold text-gray-100 text-center mb-2">Performance Impact Summary</h2>
            <div className="flex flex-col md:flex-row justify-between items-stretch gap-3 impact-summary">
              {/* Actual Net P&L */}
              <div className="flex-1 flex flex-col items-center p-4 bg-[#161a22] rounded-sm border border-[#23283d] impact-item">
                <div className="uppercase text-[10px] font-bold text-gray-400 mb-1 tracking-wider">Actual Net P&L</div>
                <div className={`text-base font-bold ${actualNetPnL >= 0 ? "text-green-400" : "text-red-400"}`}>
                  ₹{actualNetPnL.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </div>
              </div>
              {/* Cost from Poor Decisions */}
              <div className="flex-1 flex flex-col items-center p-4 bg-[#161a22] rounded-sm border border-[#23283d] impact-item">
                <div className="uppercase text-[10px] font-bold text-gray-400 mb-1 tracking-wider">Cost from Poor Decisions</div>
                <div className="text-base font-bold text-red-400">
                  ₹{badCost.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </div>
              </div>
              {/* Potential P&L */}
              <div className="flex-1 flex flex-col items-center p-4 bg-[#161a22] rounded-sm border border-[#23283d] impact-item">
                <div className="uppercase text-[10px] font-bold text-gray-400 mb-1 tracking-wider">Potential P&L (Optimized)</div>
                <div className={`text-base font-bold ${potentialPnL >= 0 ? "text-green-400" : "text-red-400"}`}>
                  ₹{potentialPnL.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>
            <div className="mt-2 text-center bg-[#23283d] p-3 rounded-sm border border-indigo-800">
              <p className="text-indigo-300 text-xs font-semibold">
                By eliminating poor trading decisions, your P&L could have been <span className="font-bold text-indigo-200">₹{potentialPnL.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
              </p>
            </div>
          </div>
        </div>

        {/* INSIGHTS LEFT (updated single-day) + NARROW LINE CHART RIGHT */}
        <div className="elegant-card rounded-md p-4 mb-3 classic-shadow-lg daily-trend-section">
          <div className="flex items-center space-x-1 mb-2">
            <div className="w-6 h-6 gradient-purple rounded-sm flex items-center justify-center">
              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.4" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2z"></path>
              </svg>
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-100">Daily Performance Trends</h2>
              <p className="text-gray-400 font-medium text-[10px]">Trade Distribution Over Time</p>
            </div>
          </div>

          <div className="flex gap-3 flex-col md:flex-row">
            {/* LEFT: Updated, realistic single-day insights */}
            <div className="daily-trend-left min-w-[260px] w-full md:w-6/12">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 daily-trend-grid" style={{ minHeight: panelHeight }}>
                {/* Top Drag */}
                <div className="h-full bg-[#191e27] rounded-sm border border-[#23283d] p-4 flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1">
                      <div className="w-5 h-5 rounded-sm flex items-center justify-center bg-[#10141d] border border-[#23283d]">
                        <svg className="w-3 h-3 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" d="M19 9l-7 7-4-4" />
                        </svg>
                      </div>
                      <h4 className="text-[11px] font-bold tracking-wide text-gray-200 uppercase">Top Drag</h4>
                    </div>
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded border text-[10px] font-semibold bg-red-500/10 text-red-300 border-red-500/30">
                      {topDemon?.name ?? "—"}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <StatRow label="Cost" value={<span className="text-red-400 font-bold">₹{(topDemon?.cost ?? 0).toFixed(2)}</span>} />
                    <StatRow label="Hits" value={topDemon?.count ?? 0} />
                    {topDemon?.trades?.length ? (
                      <button
                        className="mt-1 text-[10px] px-2 py-1 rounded border border-red-400/40 text-red-200 hover:bg-red-500/10 transition"
                        onClick={() => setModal({ title: topDemon.name, list: topDemon.trades })}
                      >
                        Review trades
                      </button>
                    ) : null}
                  </div>
                </div>

                {/* Top Edge */}
                <div className="h-full bg-[#191e27] rounded-sm border border-[#23283d] p-4 flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1">
                      <div className="w-5 h-5 rounded-sm flex items-center justify-center bg-[#10141d] border border-[#23283d]">
                        <svg className="w-3 h-3 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <h4 className="text-[11px] font-bold tracking-wide text-gray-200 uppercase">Top Edge</h4>
                    </div>
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded border text-[10px] font-semibold bg-green-500/10 text-green-300 border-green-500/30">
                      {topGood?.name ?? "—"}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <StatRow label="Profit" value={<span className="text-green-400 font-bold">₹{(topGood?.profit ?? 0).toFixed(2)}</span>} />
                    <StatRow label="Hits" value={topGood?.count ?? 0} />
                    {topGood?.trades?.length ? (
                      <button
                        className="mt-1 text-[10px] px-2 py-1 rounded border border-green-400/40 text-green-200 hover:bg-green-500/10 transition"
                        onClick={() => setModal({ title: topGood.name, list: topGood.trades })}
                      >
                        Review trades
                      </button>
                    ) : null}
                  </div>
                </div>

                {/* Best Trade */}
                <div className="h-full bg-[#191e27] rounded-sm border border-[#23283d] p-4 flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1">
                      <div className="w-5 h-5 rounded-sm flex items-center justify-center bg-[#10141d] border border-[#23283d]">
                        <svg className="w-3 h-3 text-indigo-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" d="M12 8v8m-4-4h8" />
                        </svg>
                      </div>
                      <h4 className="text-[11px] font-bold tracking-wide text-gray-200 uppercase">Best Trade</h4>
                    </div>
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded border text-[10px] font-semibold bg-indigo-500/10 text-indigo-300 border-indigo-500/30 truncate max-w-[150px]">
                      {bestTrade?.symbol ?? "—"}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <StatRow label="Exit" value={bestTrade?.exit.Date ?? "—"} />
                    <StatRow
                      label="P&L"
                      value={<span className="text-green-400 font-bold">{bestTrade ? `+₹${bestTrade.PnL.toFixed(2)}` : "—"}</span>}
                    />
                  </div>
                </div>

                {/* Session Quality */}
                <div className="h-full bg-[#191e27] rounded-sm border border-[#23283d] p-4 flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1">
                      <div className="w-5 h-5 rounded-sm flex items-center justify-center bg-[#10141d] border border-[#23283d]">
                        <svg className="w-3 h-3 text-amber-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" d="M13 16h-1V8h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <h4 className="text-[11px] font-bold tracking-wide text-gray-200 uppercase">Session Quality</h4>
                    </div>
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded border text-[10px] font-semibold bg-amber-500/10 text-amber-300 border-amber-500/30">
                      Overview
                    </span>
                  </div>
                  <div className="space-y-1">
                    <StatRow label="Hit rate" value={`${hitRate.toFixed(1)}%`} />
                    <StatRow
                      label="Profit factor"
                      value={
                        <span className={`font-semibold ${profitFactor >= 1 ? "text-green-300" : "text-red-300"}`}>
                          {Number.isFinite(profitFactor) ? profitFactor.toFixed(2) : "∞"}
                        </span>
                      }
                    />
                    <StatRow label="Max drawdown" value={<span className="text-red-300">₹{maxDD.toFixed(2)}</span>} />
                    <div className="mt-1 flex gap-1 flex-wrap">
                      <button
                        className="text-[10px] px-2 py-1 rounded border border-green-400/40 text-green-200 hover:bg-green-500/10 transition"
                        onClick={() => setModal({ title: "Winning trades", list: wins })}
                      >
                        View wins ({wins.length})
                      </button>
                      <button
                        className="text-[10px] px-2 py-1 rounded border border-red-400/40 text-red-200 hover:bg-red-500/10 transition"
                        onClick={() => setModal({ title: "Losing trades", list: losses })}
                      >
                        View losses ({losses.length})
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT: Narrow Line Chart */}
            <div className="daily-trend-right w-full md:w-6/12 flex-1 bg-[#191e27] rounded-sm border border-[#23283d] chart-container">
              <ResponsiveContainer width="100%" height={panelHeight}>
                <LineChart data={dateStats} margin={{ top: 10, right: 12, left: -12, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#23283d" strokeWidth={1} />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 9, fill: "#a1a4b3", fontWeight: "500" }}
                    axisLine={{ stroke: "#21263b", strokeWidth: 1 }}
                    tickLine={{ stroke: "#21263b", strokeWidth: 1 }}
                    interval={0}
                    height={40}
                    angle={-40}
                    textAnchor="end"
                    tickFormatter={date => {
                      const d = new Date(date as string);
                      return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                    }}
                  />
                  <YAxis
                    tick={{ fontSize: 9, fill: "#a1a4b3", fontWeight: "500" }}
                    axisLine={{ stroke: "#21263b", strokeWidth: 1 }}
                    tickLine={{ stroke: "#21263b", strokeWidth: 1 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#23283d",
                      border: "1px solid #6366f1",
                      borderRadius: "6px",
                      color: "#e5e7eb",
                      fontSize: "11px",
                      fontWeight: "500",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.15)"
                    }}
                    labelFormatter={(label) => {
                      const d = new Date(label as string);
                      return d.toLocaleDateString("en-IN", { weekday: "short", day: "2-digit", month: "short" });
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 10, color: "#c7d2fe", fontWeight: 500 }} />
                  <Line
                    type="monotone"
                    dataKey="Bad"
                    name="Risk Trades"
                    stroke="#ef4444"
                    strokeWidth={1.5}
                    dot={{ r: 2, fill: "#ef4444", strokeWidth: 1, stroke: "#23283d" }}
                    activeDot={{ r: 4, fill: "#ef4444", strokeWidth: 1, stroke: "#991b1b" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="Good"
                    name="Success Trades"
                    stroke="#22c55e"
                    strokeWidth={1.5}
                    dot={{ r: 2, fill: "#22c55e", strokeWidth: 1, stroke: "#23283d" }}
                    activeDot={{ r: 4, fill: "#22c55e", strokeWidth: 1, stroke: "#14532d" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Modal for details */}
        {modal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-1 sm:p-4">
            <div className="bg-[#161a22] w-full max-w-xl rounded-sm classic-shadow-lg border border-[#23283d] max-h-[80vh] flex flex-col overflow-hidden mx-2 sm:mx-0">
              {/* Header */}
              <div className="flex justify-between items-center p-4 border-b border-[#23283d] flex-shrink-0 bg-[#1a1e29]">
                <div className="flex items-center space-x-1">
                  <div className="w-5 h-5 gradient-blue rounded-sm flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.4" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                  </div>
                  <h3 className="text-base font-bold text-gray-100 truncate max-w-[200px] sm:max-w-none">{modal.title} Details</h3>
                </div>
                <button
                  className="text-gray-400 hover:text-gray-100 text-lg p-1 hover:bg-[#23283d] rounded-sm classic-transition font-bold flex-shrink-0"
                  onClick={() => setModal(null)}
                >
                  ×
                </button>
              </div>
              {/* Scrollable content */}
              <div className="flex-1 overflow-y-auto thin-scrollbar">
                <div className="p-4">
                  <div className="grid grid-cols-4 gap-2 mb-3 pb-3 border-b border-[#23283d] text-[10px] font-bold text-gray-400 uppercase tracking-wider modal-grid-header">
                    <div className="truncate">Symbol</div>
                    <div className="truncate">Entry Date</div>
                    <div className="truncate">Exit Date</div>
                    <div className="text-right truncate">P&L Amount</div>
                  </div>
                  <div className="space-y-2">
                    {modal.list.map((t, i) => (
                      <div key={i} className="grid grid-cols-4 gap-2 py-3 px-3 bg-[#191e27] hover:bg-[#23283d] rounded-sm classic-transition border border-[#23283d] modal-grid-row">
                        <div className="font-bold text-indigo-300 text-xs truncate">{t.symbol}</div>
                        <div className="text-gray-200 font-medium text-[10px] truncate">
                          {t.entry.Date}
                          {t.entry.Time && <div className="text-[9px] text-gray-400 font-normal truncate">{t.entry.Time}</div>}
                        </div>
                        <div className="text-gray-200 font-medium text-[10px] truncate">
                          {t.exit.Date}
                          {t.exit.Time && <div className="text-[9px] text-gray-400 font-normal truncate">{t.exit.Time}</div>}
                        </div>
                        <div className={`text-right font-bold text-xs ${t.PnL >= 0 ? "text-green-400" : "text-red-400"} truncate`}>
                          {t.PnL >= 0 ? "+" : ""}₹{t.PnL.toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
