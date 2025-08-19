import { useEffect, useState, forwardRef, useImperativeHandle, Fragment } from "react";
import axios from "axios";
import UpholicScoreCard from "../JournalDashboard/UpholicScoreCard";
import DemonFinder from "../JournalDashboard/DemonFinder";
import PlanOfAction from "../JournalDashboard/PlanOfAction";
import { Dialog, Transition } from "@headlessui/react";

// Formatting function unchanged
const formatCurrency = (value: number | undefined) => {
  if (value === undefined) return "--";
  const absValue = Math.abs(value);
  if (value < 0) {
    return `-₹${absValue.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  return `₹${absValue.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

// Gauge component unchanged (but smaller)
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
        style={{ transition: 'stroke-dashoffset 0.5s' }}
      />
    </svg>
  );
};

const DisclaimerModal = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => (
  <Transition appear show={isOpen} as={Fragment}>
    <Dialog as="div" className="relative z-50" onClose={onClose}>
      <Transition.Child
        as={Fragment}
        enter="ease-out duration-200"
        enterFrom="opacity-0"
        enterTo="opacity-100"
        leave="ease-in duration-150"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
      >
        <div className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm" />
      </Transition.Child>
      <div className="fixed inset-0 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-2 text-center">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <Dialog.Panel className="w-full max-w-xs transform overflow-hidden rounded-xl bg-[#181820] p-5 text-left align-middle shadow-xl transition-all">
              <Dialog.Title
                as="h3"
                className="text-base font-semibold leading-6 text-white flex items-center"
              >
                <svg className="w-4 h-4 mr-2 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Important Notice
              </Dialog.Title>
              <div className="mt-3">
                <p className="text-xs text-gray-400 mb-2">
                  The analytics and insights provided by this trading journal are for educational purposes only. Results may differ from your broker's official statements due to:
                </p>
                <ul className="list-disc pl-4 space-y-0.5 text-xs text-gray-500 mb-2">
                  <li>Missing or unmatched trades in provided data</li>
                  <li>Estimated brokerage and tax calculations</li>
                  <li>Different treatment of short positions</li>
                </ul>
                <p className="text-[10px] text-gray-500 italic">
                  Always verify critical numbers with your broker before making trading decisions.
                </p>
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 transition"
                  onClick={onClose}
                >
                  I Understand
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
  <div className="bg-[#17181c] rounded-lg shadow-md p-4 flex flex-col justify-between min-h-[80px]">
    <div className="flex items-center justify-between mb-1">
      <span className="text-[11px] text-gray-400 font-semibold tracking-wide">{metric.label}</span>
      <svg
        className="w-3.5 h-3.5 text-gray-400 cursor-pointer"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        viewBox="0 0 24 24"
        role="img"
        aria-label={metric.info}  // optional for a11y
      >
        <title>{metric.info}</title>
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={2} />
        <path d="M12 16v-4m0-4h.01" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>

    {metric.gaugeValue !== undefined ? (
      <div className="flex items-center gap-2">
        <span className="text-xl font-extrabold text-white">{metric.value}</span>
        <Gauge value={metric.gaugeValue} color={metric.gaugeColor} />
      </div>
    ) : metric.avgWin !== undefined && metric.avgLoss !== undefined ? (
      <div className="flex flex-col gap-0.5">
        <span className="text-xl font-extrabold text-white">{metric.value}</span>
        <div className="flex items-end gap-1">
          <span className="text-[11px] font-semibold text-green-400">{formatCurrency(metric.avgWin)}</span>
          <span className="text-[11px] font-semibold text-white">/</span>
          <span className="text-[11px] font-semibold text-red-400">{formatCurrency(metric.avgLoss)}</span>
        </div>
        <div className="w-full h-2 mt-0.5 bg-gray-800 rounded flex overflow-hidden">
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

  // --- Disclaimer: Only after upload, not on refresh/tab switch
  const [showDisclaimer, setShowDisclaimer] = useState(false);

  useEffect(() => {
    const uploadedAt = localStorage.getItem("orderbook_uploaded_at");
    const disclaimerSeen = localStorage.getItem("orderbook_disclaimer_seen");
    setShowDisclaimer(!!uploadedAt && disclaimerSeen !== uploadedAt);
  }, []);

  const handleDisclaimerClose = () => {
    const uploadedAt = localStorage.getItem("orderbook_uploaded_at");
    if (uploadedAt) localStorage.setItem("orderbook_disclaimer_seen", uploadedAt);
    setShowDisclaimer(false);
  };

  // Metric bar calculations
  let avgWin = 0,
    avgLoss = 0,
    winLossRatio: string | null = null,
    winWidth = 50,
    lossWidth = 50;
  if (stats) {
    avgWin = stats.avgWinLoss?.avgWin ?? 0;
    avgLoss = stats.avgWinLoss?.avgLoss ?? 0;
    winWidth = avgWin || avgLoss ? Math.min(100, (Math.abs(avgWin) / (Math.abs(avgWin) + Math.abs(avgLoss))) * 100) : 50;
    lossWidth = 100 - winWidth;
    if (avgWin && avgLoss) {
      const ratio = Math.abs(avgLoss) > 0 ? avgWin / Math.abs(avgLoss) : 0;
      winLossRatio = ratio ? ratio.toFixed(2) : "--";
    }
  }

  // Fetch stats API
  const fetchStats = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get("http://localhost:8000/api/stats");
      setStats(data.empty ? null : data);
    } catch (error) {
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);
  useImperativeHandle(ref, () => ({ refreshStats: fetchStats }));

  if (loading)
    return (
      <div className="py-16 text-center text-base text-gray-400">
        Loading...
      </div>
    );

  if (!stats)
    return (
      <div className="flex flex-col items-center justify-center min-h-[200px] text-gray-400">
        <svg
          className="w-8 h-8 text-indigo-400 mb-1"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <path d="M12 4v16m8-8H4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <div className="text-lg mb-1 font-semibold">No stats yet</div>
        <div className="text-sm mb-4">Upload your orderbook CSV to see dashboard stats.</div>
      </div>
    );

  const metrics: Metric[] = [
    {
      label: "Net P&L",
      value: formatCurrency(stats.netPnl),
      valueClass: (stats.netPnl ?? 0) >= 0 ? "text-green-400" : "text-red-400",
      info: "Net Profit or Loss",
    },
    {
      label: "Trade win %",
      value: `${(stats.tradeWinPercent ?? 0).toFixed(2)}%`,
      gaugeValue: stats.tradeWinPercent ?? 0,
      gaugeColor: "#60d394",
      info: "Percent of Winning Trades",
    },
    {
      label: "Profit factor",
      value: (stats.profitFactor ?? 0).toFixed(2),
      gaugeValue: Math.min(100, (stats.profitFactor ?? 0) * 25),
      gaugeColor: "#6366f1",
      info: "Ratio of Gross Profit to Gross Loss",
    },
    {
      label: "Day win %",
      value: `${(stats.dayWinPercent ?? 0).toFixed(2)}%`,
      gaugeValue: stats.dayWinPercent ?? 0,
      gaugeColor: "#38bdf8",
      info: "Percentage of Winning Days",
    },
    {
      label: "Avg win/loss trade",
      value: winLossRatio ?? "--",
      avgWin,
      avgLoss,
      winWidth,
      lossWidth,
      info: "Average win to loss ratio per trade",
    },
  ];

  return (
    <div className="min-h-screen bg-[#0d0d14] p-5">
      <DisclaimerModal isOpen={showDisclaimer} onClose={handleDisclaimerClose} />

      {/* Top row: 3 cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-3 max-w-full">
        {[0, 1, 2].map((idx) => (
          <MetricCard key={idx} metric={metrics[idx]} />
        ))}
      </div>

      {/* Bottom row: 2 cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-3 mb-3 max-w-full">
        {[3, 4].map((idx) => (
          <MetricCard key={idx} metric={metrics[idx]} />
        ))}
      </div>

      {/* Bottom section with UpholicScoreCard and PlanOfAction side by side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3 max-w-full">
        <UpholicScoreCard stats={stats} />
        <PlanOfAction planOfAction={stats.upholicPointers?.planOfAction} />
      </div>

      {/* DemonFinder full width below */}
      <DemonFinder trades={stats.trades ?? []} />
    </div>
  );
});

export default Journal_Dashboard;
