import { useEffect, useState, forwardRef, useImperativeHandle, Fragment } from "react";
import axios from "axios";
import { API_BASE, getUserId } from "../../../api";
import UpholicScoreCard from "../JournalDashboard/UpholicScoreCard";
import DemonFinder from "../JournalDashboard/DemonFinder";
import PlanOfAction from "../JournalDashboard/PlanOfAction";
import { Dialog, Transition } from "@headlessui/react";

/* ===== auth helpers + per-user ===== */
const AUTH_TOKEN_KEYS = ["accessToken", "token", "jwt", "authToken"];
const getAuthToken = () => {
  for (const k of AUTH_TOKEN_KEYS) {
    const v = localStorage.getItem(k);
    if (v) return v;
  }
  return null;
};
const authHeaders = () => {
  const t = getAuthToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
};

/* ===== formatting ===== */
const formatCurrency = (value: number | undefined) => {
  if (value === undefined || value === null || Number.isNaN(value)) return "—";
  const absValue = Math.abs(value);
  const str = absValue.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return value < 0 ? `-₹${str}` : `₹${str}`;
};

/* ===== Gauge ===== */
const Gauge = ({ value = 0, color = "#34d399" }: { value: number; color?: string }) => {
  const percent = Math.max(0, Math.min(100, value));
  const dash = 62.8;
  return (
    <svg width="38" height="26" viewBox="0 0 38 18" className="inline-block">
      <path d="M 5 14 A 13 13 0 0 1 33 14" fill="none" stroke="#23272e" strokeWidth="4" />
      <path
        d="M 5 14 A 13 13 0 0 1 33 14"
        fill="none"
        stroke={color}
        strokeWidth="4"
        strokeDasharray={dash}
        strokeDashoffset={dash - (dash * percent) / 100}
        style={{ transition: "stroke-dashoffset 0.5s" }}
      />
    </svg>
  );
};

/* ===== Disclaimer modal (clearer) ===== */
const DisclaimerModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => (
  <Transition appear show={isOpen} as={Fragment}>
    <Dialog as="div" className="relative z-50" onClose={onClose}>
      <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0">
        <div className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm" />
      </Transition.Child>
      <div className="fixed inset-0 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-2 text-center">
          <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-150" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
            <Dialog.Panel className="w-full max-w-sm transform overflow-hidden rounded-xl bg-[#181820] p-5 text-left align-middle shadow-xl transition-all">
              <Dialog.Title as="h3" className="text-base font-semibold leading-6 text-white flex items-center">
                <svg className="w-4 h-4 mr-2 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                How we compute these numbers
              </Dialog.Title>

              <ul className="mt-3 text-[11px] text-gray-300 space-y-2 list-disc pl-5">
                <li><span className="text-gray-400">P&L Basis:</span> We use <b>FIFO pairing</b> of completed round-trips (symbols that have both Buy and Sell) on a <b>paired-only</b> basis.</li>
                <li><span className="text-gray-400">Prices:</span> Raw execution prices are used (broker raw fields when present), and we subtract the <b>full per-row charges</b> from net P&L.</li>
                <li><span className="text-gray-400">Averages:</span> “Avg Buy/Sell” reflect completed paired legs only, not open legs.</li>
                <li><span className="text-gray-400">Open Positions:</span> Shows <b>unpaired legs</b> with side, quantity, and the average raw price of the remaining legs.</li>
                <li><span className="text-gray-400">KPIs:</span> Hit-rate, PF, avg win/loss, etc. are based on <b>round-trips</b> (behavior analytics), while headline P&L is from <b>paired-raw</b>.</li>
              </ul>

              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  className="inline-flex justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 transition"
                  onClick={onClose}
                >
                  Got it
                </button>
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </div>
    </Dialog>
  </Transition>
);

type Metric = {
  label: string;
  value: string;
  valueClass?: string;
  info: string;
  gaugeValue?: number;
  gaugeColor?: string;
  avgWin?: number;
  avgLoss?: number;
  winWidth?: number;
  lossWidth?: number;
};

const MetricCard = ({ metric }: { metric: Metric }) => (
  <div className="bg-[#0f1120] rounded-md border border-[#202336] shadow-[0_8px_24px_rgba(0,0,0,0.25)] hover:shadow-[0_12px_28px_rgba(0,0,0,0.32)] transition-shadow duration-200 p-4 md:p-5 lg:p-6 flex flex-col justify-between min-h-[96px]">
    <div className="flex items-center justify-between mb-2.5">
      <span className="text-[11px] text-gray-300 font-semibold tracking-wide">{metric.label}</span>
      <svg className="w-4 h-4 text-gray-400/90" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" role="img" aria-label={metric.info}>
        <title>{metric.info}</title>
        <circle cx="12" cy="12" r="10" />
        <path d="M12 16v-4m0-4h.01" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>

    {metric.gaugeValue !== undefined ? (
      <div className="flex items-center gap-3">
        <span className="text-xl font-extrabold text-white">{metric.value}</span>
        <Gauge value={metric.gaugeValue} color={metric.gaugeColor} />
      </div>
    ) : metric.avgWin !== undefined && metric.avgLoss !== undefined ? (
      <div className="flex flex-col gap-1.5">
        <span className="text-xl font-extrabold text-white">{metric.value}</span>
        <div className="flex items-end gap-1.5">
          <span className="text-[11px] font-semibold text-green-400">{formatCurrency(metric.avgWin)}</span>
          <span className="text-[11px] font-semibold text-white">/</span>
          <span className="text-[11px] font-semibold text-red-400">{formatCurrency(metric.avgLoss)}</span>
        </div>
        <div className="w-full h-2 mt-1.5 bg-[#202336] rounded flex overflow-hidden">
          <div className="bg-green-500" style={{ width: `${metric.winWidth}%` }} />
          <div className="bg-red-500" style={{ width: `${metric.lossWidth}%` }} />
        </div>
      </div>
    ) : (
      <span className={`text-xl font-extrabold ${metric.valueClass ?? "text-white"}`}>{metric.value}</span>
    )}
  </div>
);

const Journal_Dashboard = forwardRef((_props, ref) => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [userId, setUserId] = useState<string | null>(getUserId());

  // pagination (scrip summary)
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [page, setPage] = useState<number>(1);

  // tabs (inside table header, default to summary)
  const [tab, setTab] = useState<"summary" | "open">("summary");

  useEffect(() => {
    const sync = () => setUserId(getUserId());
    window.addEventListener("storage", sync);
    const i = setInterval(sync, 1000);
    return () => { window.removeEventListener("storage", sync); clearInterval(i); };
  }, []);

  useEffect(() => {
    const uploadedAt = localStorage.getItem(userId ? `orderbook_uploaded_at:${userId}` : "orderbook_uploaded_at");
    const disclaimerSeen = localStorage.getItem("orderbook_disclaimer_seen");
    setShowDisclaimer(!!uploadedAt && disclaimerSeen !== uploadedAt);
  }, [userId]);

  const handleDisclaimerClose = () => {
    const uploadedAt = localStorage.getItem(userId ? `orderbook_uploaded_at:${userId}` : "orderbook_uploaded_at");
    if (uploadedAt) localStorage.setItem("orderbook_disclaimer_seen", uploadedAt);
    setShowDisclaimer(false);
  };

  const fetchStats = async () => {
    setLoading(true);
    try {
      const url = new URL(`${API_BASE}/stats`);
      if (userId) url.searchParams.set("userId", userId);
      url.searchParams.set("_", Date.now().toString());
      const { data } = await axios.get(url.toString(), { withCredentials: true, headers: authHeaders() });
      setStats(data?.empty ? null : data);
    } catch {
      setStats(null);
    } finally { setLoading(false); }
  };

  useImperativeHandle(ref, () => ({ refreshStats: fetchStats }), [userId]);

  useEffect(() => { setStats(null); fetchStats(); /* eslint-disable-next-line */ }, [userId]);
  useEffect(() => setPage(1), [rowsPerPage, stats]);

  const scripSummary: any[] = Array.isArray(stats?.scripSummary) ? stats.scripSummary : [];
  const totalRows = scripSummary.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / rowsPerPage));
  const startIdx = (page - 1) * rowsPerPage;
  const endIdx = Math.min(totalRows, startIdx + rowsPerPage);
  const visibleRows = scripSummary.slice(startIdx, endIdx);

  const openPositions: Array<{ symbol: string; side: "Buy" | "Sell"; quantity: number; avgPrice?: number }> =
    Array.isArray(stats?.openPositions) ? stats.openPositions : [];

  if (loading) return <div className="py-16 text-center text-base text-gray-400">Loading...</div>;
  if (!stats) {
    return (
      <div className="relative min-h-[320px]">
        <div className="absolute inset-0 grid place-items-center text-gray-400">
          <div className="text-center">
            <svg className="w-8 h-8 text-indigo-400 mx-auto mb-2" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M12 4v16m8-8H4" strokeLinecap="round" strokeLinejoin="round" /></svg>
            <div className="text-lg mb-1 font-semibold">No stats yet</div>
            <div className="text-sm">Upload your orderbook CSV to see dashboard stats.</div>
          </div>
        </div>
      </div>
    );
  }

  // metrics
  const avgWin = stats.avgWinLoss?.avgWin ?? 0;
  const avgLoss = stats.avgWinLoss?.avgLoss ?? 0;
  const winWidth = (Math.abs(avgWin) + Math.abs(avgLoss))
    ? (Math.abs(avgWin) / (Math.abs(avgWin) + Math.abs(avgLoss))) * 100
    : 50;
  const lossWidth = 100 - winWidth;
  const winLossRatio = (avgWin && avgLoss)
    ? (Math.abs(avgLoss) > 0 ? (avgWin / Math.abs(avgLoss)).toFixed(2) : "--")
    : "--";

  const metrics: Metric[] = [
    { label: "Net P&L", value: formatCurrency(stats.netPnl), valueClass: (stats.netPnl ?? 0) >= 0 ? "text-green-400" : "text-red-400", info: "Net Profit or Loss (Completed trades only, raw notionals − full charges)" },
    { label: "Trade win %", value: `${(stats.tradeWinPercent ?? 0).toFixed(2)}%`, gaugeValue: stats.tradeWinPercent ?? 0, gaugeColor: "#60d394", info: "Percent of Winning Trades" },
    { label: "Profit factor", value: Number.isFinite(stats.profitFactor) ? (stats.profitFactor ?? 0).toFixed(2) : "∞", gaugeValue: Math.min(100, (Number.isFinite(stats.profitFactor) ? stats.profitFactor : 4) * 25), gaugeColor: "#6366f1", info: "Ratio of Gross Profit to Gross Loss" },
    { label: "Day win %", value: `${(stats.dayWinPercent ?? 0).toFixed(2)}%`, gaugeValue: stats.dayWinPercent ?? 0, gaugeColor: "#38bdf8", info: "Percentage of Winning Days" },
    { label: "Avg win/loss trade", value: winLossRatio ?? "--", avgWin, avgLoss, winWidth, lossWidth, info: "Average win to loss ratio per trade" },
  ];

  return (
    <div className="min-h-screen bg-[#0d0d14] p-3 sm:p-5">
      <DisclaimerModal isOpen={showDisclaimer} onClose={handleDisclaimerClose} />

      {/* Headline cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-3 max-w-full">
        {metrics.slice(0, 3).map((m, i) => <MetricCard key={i} metric={m} />)}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3 max-w-full">
        {metrics.slice(3).map((m, i) => <MetricCard key={`m2-${i}`} metric={m} />)}
      </div>

      {/* Main card with header-embedded tabs */}
      <div className="bg-[#0a0d13] mb-4">
        <div className="rounded-md border border-[#202336] overflow-hidden">
          {/* Header: tabs become scrollable on small screens and stay visible while scrolling */}
          <div className="px-2 sm:px-4 py-2 sm:py-3 bg-[#121420] border-b border-[#202336] flex items-center justify-between sticky top-0 z-10">
            <div className="inline-flex rounded-md overflow-hidden border border-[#202336] max-w-full">
              <div className="flex overflow-x-auto">
                <button
                  onClick={() => setTab("summary")}
                  className={`px-3 py-1.5 text-xs font-semibold whitespace-nowrap ${tab === "summary" ? "bg-white/10 text-white" : "bg-white/5 text-gray-300 hover:bg-white/10"}`}
                >
                  P&L + Scrip Summary
                </button>
                <button
                  onClick={() => setTab("open")}
                  className={`px-3 py-1.5 text-xs font-semibold whitespace-nowrap border-l border-[#202336] ${tab === "open" ? "bg-white/10 text-white" : "bg-white/5 text-gray-300 hover:bg-white/10"}`}
                >
                  Open Positions
                </button>
              </div>
            </div>

            {/* Title hidden on very small screens to save space */}
            <h3 className="hidden sm:block text-base font-bold text-gray-100 text-center flex-1">
              {tab === "summary" ? "P&L Summary by Scrip" : "Open Positions (Unpaired Legs)"}
            </h3>
            <div className="hidden sm:block w-[210px]" />
          </div>

          {/* CONTENT */}
          {tab === "summary" ? (
            <>
              {/* Completed Trades (Paired Only) */}
              {stats?.pairedTotals && (
                <div className="px-2 sm:px-4 pt-3">
                  <div className="mb-4 rounded-md border border-[#202336] bg-[#0f1120] p-3 sm:p-4">
                    <div className="text-sm sm:text-base font-bold text-gray-100 mb-2 text-center">Completed Trades (Paired Only)</div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-xs sm:text-sm text-gray-200 text-center">
                      <div>Buy Qty: <span className="font-semibold">{stats.pairedTotals.buyQty?.toLocaleString("en-IN")}</span></div>
                      <div>Sell Qty: <span className="font-semibold">{stats.pairedTotals.sellQty?.toLocaleString("en-IN")}</span></div>
                      <div>Avg Buy: <span className="font-semibold">{formatCurrency(stats.pairedTotals.avgBuy)}</span></div>
                      <div>Avg Sell: <span className="font-semibold">{formatCurrency(stats.pairedTotals.avgSell)}</span></div>
                      <div>Charges: <span className="font-semibold">{formatCurrency(stats.pairedTotals.charges)}</span></div>
                      <div>Net P&L: <span className={`font-semibold ${stats.pairedTotals.netPnl >= 0 ? "text-green-400" : "text-red-400"}`}>{formatCurrency(stats.pairedTotals.netPnl)}</span></div>
                    </div>
                  </div>
                </div>
              )}

              {/* P&L Summary table (mobile swipe hint) */}
              <div className="overflow-x-auto relative">
                <div className="sm:hidden absolute right-2 -top-6 text-[10px] text-gray-500">← swipe →</div>
                <table className="min-w-full text-xs">
                  <thead>
                    <tr className="bg-[#11131b] text-gray-300">
                      <th className="px-3 py-2 text-center border-r border-[#202336]">Scrip Name</th>
                      <th className="px-3 py-2 text-center border-r border-[#202336]">Quantity</th>
                      <th className="px-3 py-2 text-center border-r border-[#202336]">Avg. Buy Price</th>
                      <th className="px-3 py-2 text-center border-r border-[#202336]">Avg. Sell Price</th>
                      <th className="px-3 py-2 text-center border-r border-[#202336]">Charges</th>
                      <th className="px-3 py-2 text-center">Net Realised P&L</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#202336]">
                    {visibleRows.map((row: any, i: number) => (
                      <tr key={row.symbol + i} className="bg-[#0f1120] hover:bg-[#14172a]">
                        <td className="px-3 py-2 text-gray-200 border-r border-[#202336]">{row.symbol}</td>
                        <td className="px-3 py-2 text-center text-gray-200 border-r border-[#202336]">{row.quantity?.toLocaleString("en-IN")}</td>
                        <td className="px-3 py-2 text-center text-gray-200 border-r border-[#202336]">{formatCurrency(row.avgBuy)}</td>
                        <td className="px-3 py-2 text-center text-gray-200 border-r border-[#202336]">{formatCurrency(row.avgSell)}</td>
                        <td className="px-3 py-2 text-center text-gray-300 border-r border-[#202336]">{formatCurrency(row.charges)}</td>
                        <td className={`px-3 py-2 text-center font-bold ${row.netRealized >= 0 ? "text-green-400" : "text-red-400"}`}>{formatCurrency(row.netRealized)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* footer */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-2 sm:px-4 py-2 bg-[#0f1120] border-t border-[#202336]">
                <div className="text-[11px] text-gray-400">
                  Scrip totals — Net: <span className="font-semibold text-gray-200">{formatCurrency(stats?.totalsCheck?.netPnlFromScrips ?? 0)}</span>
                  {" · "}
                  Charges: <span className="font-semibold text-gray-200">{formatCurrency(stats?.totalsCheck?.chargesFromScrips ?? 0)}</span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 text-[11px] text-gray-300">
                    <span>Rows per page:</span>
                    <select className="bg-[#0b0d18] border border-[#202336] rounded px-2 py-1 text-[11px] focus:outline-none" value={rowsPerPage} onChange={(e) => setRowsPerPage(parseInt(e.target.value, 10))}>
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-1">
                    <button className="px-2 py-1 rounded border border-[#202336] text-gray-300 hover:bg-[#151836] disabled:opacity-40" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>‹</button>
                    <span className="text-[11px] text-gray-300 px-2">{page} / {totalPages}</span>
                    <button className="px-2 py-1 rounded border border-[#202336] text-gray-300 hover:bg-[#151836] disabled:opacity-40" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>›</button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* Open Positions (Unpaired Legs) */
            <>
              <div className="overflow-x-auto relative">
                <div className="sm:hidden absolute right-2 -top-6 text-[10px] text-gray-500">← swipe →</div>
                <table className="min-w-full text-xs">
                  <thead>
                    <tr className="bg-[#11131b] text-gray-300">
                      <th className="px-3 py-2 text-center border-r border-[#202336]">Scrip</th>
                      <th className="px-3 py-2 text-center border-r border-[#202336]">Side</th>
                      <th className="px-3 py-2 text-center border-r border-[#202336]">Avg Price</th>
                      <th className="px-3 py-2 text-center">Quantity</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#202336]">
                    {openPositions.length === 0 ? (
                      <tr className="bg-[#0f1120]">
                        <td className="px-3 py-3 text-center text-gray-400" colSpan={4}>No open positions.</td>
                      </tr>
                    ) : (
                      openPositions.map((pos, i) => (
                        <tr key={pos.symbol + i} className="bg-[#0f1120]">
                          <td className="px-3 py-2 text-gray-200 border-r border-[#202336]">{pos.symbol}</td>
                          <td className="px-3 py-2 text-center border-r border-[#202336]">
                            <span
                              className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                                pos.side === "Buy"
                                  ? "bg-emerald-900/30 text-emerald-300 border border-emerald-700/30"
                                  : "bg-rose-900/30 text-rose-300 border border-rose-700/30"
                              }`}
                            >
                              {pos.side}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-center text-gray-200 border-r border-[#202336]">
                            {formatCurrency(pos.avgPrice)}
                          </td>
                          <td className="px-3 py-2 text-center text-gray-200">
                            {pos.quantity?.toLocaleString("en-IN")}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* small hint row */}
              <div className="px-2 sm:px-4 py-2 bg-[#0f1120] border-t border-[#202336] text-[11px] text-gray-400">
                Note: Average price is computed from remaining unpaired legs of that side (raw execution prices).
              </div>
            </>
          )}
        </div>
      </div>

      {/* Side widgets */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3 max-w-full">
        <UpholicScoreCard stats={stats} />
        <PlanOfAction stats={stats} />
      </div>

      <DemonFinder trades={stats.trades ?? []} netPnl={stats.netPnl} />
    </div>
  );
});

export default Journal_Dashboard;
