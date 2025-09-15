// DailyJournal.tsx
import { useEffect, useState, useRef, ChangeEvent } from "react";

import { api, API_BASE, getUserId } from "../../../api";
import {
  Calendar,
  Edit3,
  Save,
  Plus,
  X,
  TrendingUp,
  Target,
  Shield,
  BarChart3,
  Award,
  Info,
  Brain,
  Star,
  AlertCircle,
  CheckCircle,
  XCircle,
  Trash2,
} from "lucide-react";

// API endpoints
const DJ_BASE = `${API_BASE}/daily-journal`;
const INSTRUMENT_API = `${API_BASE}/instruments/search`;
const UNDERLYINGS_API = `${API_BASE}/instruments/underlyings`;
const EXPIRIES_API = `${API_BASE}/instruments/expiries`;

// Types
type PlannedTrade = {
  strategy: string;
  symbol: string;
  lots: number;
  entry: number;
  tradeType: "BUY" | "SELL";
  stopLoss: number;
  target: number;
  reason: string;
  exchangeId?: string;
  instrumentType?: string;
  instrumentName?: string;
  optionType?: string;
  strikePrice?: string;
  segment?: string;
  lotSize?: string | number;
  expiry?: string;
  quantity?: number; // Added quantity field
  underlyingSymbol?: string; // NEW: Index/Underlying
};
type PsychFields = {
  confidenceLevel: number;
  stressLevel: number;
  distractions: string;
  sleepHours: number;
  mood?: string;
  focus?: number;
  energy?: number;
};
type ExecutedTrade = {
  symbol: string;
  tradeType: "BUY" | "SELL";
  entry: number;
  lots: number;
  PnL?: number;
  exit?: number;
  exchangeId?: string;
  instrumentType?: string;
  instrumentName?: string;
  segment?: string;
  lotSize?: string | number;
  expiry?: string;
  optionType?: string;
  strikePrice?: string;
  quantity?: number; // Added quantity field
  underlyingSymbol?: string; // NEW
};
type Comparison = {
  status?: string;
  matched: number;
  totalPlanned: number;
  executionPercent: number;
  badge: string;
  matchedTrades: ExecutedTrade[];
  missedTrades: PlannedTrade[];
  extraTrades: ExecutedTrade[];
  groupedExtras?: Record<string, ExecutedTrade[]>;
  insights?: string[];
  whatWentWrong?: string[];
  confidenceLevel?: number;
  stressLevel?: number;
  distractions?: string;
  sleepHours?: number;
  mood?: string;
  focus?: number;
  energy?: number;
};

const strategies = [
  "Breakout",
  "Pullback",
  "Momentum",
  "Reversal",
  "Trend Following",
  "Gap Up/Down",
  "Mean Reversion",
  "Option Selling",
  "Scalping",
  "VWAP",
  "EMA Crossover",
];
const exchanges = ["NSE", "BSE"];
const instrumentTypes = [
  "EQUITY",
  "FUTIDX",
  "FUTSTK",
  "OPTIDX",
  "OPTSTK",
  "OPTFUT",
  "INDEX",
  "FUTCUR",
  "FUTCOM",
];
const optionTypes = ["CE", "PE"];

const defaultTrade: PlannedTrade = {
  strategy: "Breakout",
  symbol: "",
  lots: 1,
  entry: 0,
  tradeType: "BUY",
  stopLoss: 0,
  target: 0,
  reason: "",
  exchangeId: "NSE",
  instrumentType: "",
  instrumentName: "",
  optionType: "",
  strikePrice: "",
  segment: "",
  lotSize: "",
  expiry: "",
  quantity: 0,
  underlyingSymbol: "",
};

const defaultPsych: PsychFields = {
  confidenceLevel: 5,
  stressLevel: 5,
  distractions: "",
  sleepHours: 7,
  mood: "",
  focus: 5,
  energy: 5,
};

function getBadgeObj(executionPercent: number) {
  if (executionPercent >= 90)
    return {
      badge: "MASTER",
      color: "from-emerald-500 to-emerald-600",
      textColor: "text-emerald-50",
      bgColor: "bg-emerald-900/20",
    };
  if (executionPercent >= 75)
    return {
      badge: "EXPERT",
      color: "from-blue-500 to-blue-600",
      textColor: "text-blue-50",
      bgColor: "bg-blue-900/20",
    };
  if (executionPercent >= 60)
    return {
      badge: "SKILLED",
      color: "from-amber-500 to-amber-600",
      textColor: "text-amber-50",
      bgColor: "bg-amber-900/20",
    };
  return {
    badge: "LEARNING",
    color: "from-slate-500 to-slate-600",
    textColor: "text-slate-50",
    bgColor: "bg-slate-800/20",
  };
}
function formatDateKey(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toISOString().slice(0, 10);
}
const debounce = <T extends (...args: any[]) => void>(fn: T, ms: number) => {
  let timeout: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), ms);
  };
};

/* ===================== Risk Logic (softer & realistic) ===================== */
type RiskGrade = "Low" | "Moderate" | "High" | "Extreme" | "N/A";

function distancesFor(trade: PlannedTrade) {
  const e = Number(trade.entry || 0);
  const sl = Number(trade.stopLoss || 0);
  const tg = Number(trade.target || 0);
  if (!e || !sl || !tg) return { stopDist: 0, targDist: 0 };

  // Direction-aware distances (negative distances become 0)
  const stopDist =
    trade.tradeType === "BUY" ? Math.max(0, e - sl) : Math.max(0, sl - e);
  const targDist =
    trade.tradeType === "BUY" ? Math.max(0, tg - e) : Math.max(0, e - tg);
  return { stopDist, targDist };
}

/**
 * Practical grading:
 * - Extreme: very large % risk (>=3.5%) OR (% risk >=2% AND RR < 0.8)
 * - High:    % risk >=1.5% OR RR < 1.0
 * - Moderate:% risk >=0.6% OR RR < 1.5
 * - Low:     otherwise
 * Notes:
 * - If stop/target not in the right direction, returns N/A (not Extreme).
 * - A tiny +₹1 target no longer makes it Extreme; it’s Moderate/High at worst unless % risk is huge.
 */
function riskForTrade(trade: PlannedTrade): {
  grade: RiskGrade;
  rr: number;
  riskPct: number;
  riskAmt: number;
} {
  const { stopDist, targDist } = distancesFor(trade);
  const entry = Number(trade.entry || 0);
  const qty = Number(trade.quantity || 0);

  if (!entry || stopDist <= 0 || targDist <= 0 || !qty) {
    return { grade: "N/A", rr: 0, riskPct: 0, riskAmt: 0 };
  }

  const rr = targDist / stopDist; // Risk-Reward
  const riskPct = (stopDist / entry) * 100; // % distance to SL
  const riskAmt = stopDist * qty; // absolute ₹ risk (relative comparator)

  let grade: RiskGrade;

  // riskPct = Risk per Trade as a % of total capital (e.g., 2.5 for 2.5%)
  // rr = Reward-to-Risk Ratio (e.g., 2.5 meaning a 2.5:1 ratio)

  if (riskPct >= 3.0 || (riskPct >= 2.0 && rr < 1.0)) {
    grade = "Extreme"; // Very dangerous trade
  } else if (riskPct >= 2.0 || (riskPct >= 1.0 && rr < 1.2)) {
    grade = "High"; // Dangerous trade
  } else if (riskPct >= 1.0 || (riskPct >= 0.5 && rr < 1.5)) {
    grade = "Moderate"; // Standard, acceptable trade
  } else {
    grade = "Low"; // High-probability, well-structured trade
  }

  return { grade, rr, riskPct, riskAmt };
}

function overallRisk(trades: PlannedTrade[]): RiskGrade {
  const order = ["Low", "Moderate", "High", "Extreme"] as const;
  let worstIdx = -1;
  for (const t of trades) {
    const g = riskForTrade(t).grade;
    if (g === "N/A") continue; // ignore incomplete trades
    const idx = order.indexOf(g as any);
    if (idx > worstIdx) worstIdx = idx;
  }
  return worstIdx === -1 ? "N/A" : order[worstIdx];
}

/* ===================== Trade Detail Modal ===================== */
const TradeDetailModal = ({
  open,
  onClose,
  trade,
  isExtra,
}: {
  open: boolean;
  onClose: () => void;
  trade: any;
  isExtra?: boolean;
}) => {
  if (!open || !trade) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-900 rounded-2xl p-6 max-w-lg w-full mx-4 border border-slate-700 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            {isExtra ? (
              <>
                <AlertCircle className="w-5 h-5 text-orange-400" />
                Unplanned Trade
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5 text-green-400" />
                Trade Details
              </>
            )}
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-400 hover:text-white" />
          </button>
        </div>
        <div className="mb-3">
          <div className="text-xl font-bold text-white mb-1">
            {trade.symbol}
          </div>
          <div
            className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
              trade.tradeType === "BUY"
                ? "bg-green-900/30 text-green-300 border border-green-800"
                : "bg-red-900/30 text-red-300 border border-red-800"
            }`}
          >
            {trade.tradeType}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          {trade &&
            typeof trade === "object" &&
            Object.entries(trade).map(
              ([k, v], i) =>
                v !== undefined &&
                v !== null &&
                k !== "symbol" &&
                k !== "tradeType" && (
                  <div key={i} className="bg-slate-800/50 rounded-lg p-3">
                    <div className="text-slate-400 capitalize text-[11px] font-medium mb-1">
                      {k.replace(/([A-Z])/g, " $1").trim()}
                    </div>
                    <div className="text-white font-medium">{String(v)}</div>
                  </div>
                )
            )}
        </div>
      </div>
    </div>
  );
};

export default function DailyJournal() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [plannedTrades, setPlannedTrades] = useState<PlannedTrade[]>([
    { ...defaultTrade },
  ]);
  const [planNotes, setPlanNotes] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [comparison, setComparison] = useState<Comparison | null>(null);
  const [executedStatus, setExecutedStatus] = useState<"ok" | "no-executions">(
    "ok"
  );
  const [psych, setPsych] = useState<PsychFields>({ ...defaultPsych });
  const [symbolSuggestions, setSymbolSuggestions] = useState<any[]>([]);
  const [suggestForIdx, setSuggestForIdx] = useState<number | null>(null);
  const symbolInputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const [tradeModal, setTradeModal] = useState<{
    trade: any;
    isExtra?: boolean;
  } | null>(null);
  const [modalType, setModalType] = useState<
    "matched" | "missed" | "extra" | null
  >(null);

  // NEW: available underlyings for OPTIDX depending on exchange
  const [underlyings, setUnderlyings] = useState<string[]>([]);
  // NEW: expiry options (only for OPTIDX)
  const [expiryOptions, setExpiryOptions] = useState<string[]>([]);

  // NEW: only show one editable trade at a time in Edit mode
  const [activeEditIndex, setActiveEditIndex] = useState<number>(0);

  // ✅ NEW: lock flag to hide all Remove buttons after plan exists/saves
  const [planLocked, setPlanLocked] = useState(false);

  const todayKey = formatDateKey(new Date());
  const planDateKey = formatDateKey(selectedDate);
  const isFuture = planDateKey > todayKey;

  const calculateQuantity = (trade: PlannedTrade) => {
    const lotSize = Number(trade.lotSize) || 1;
    const lots = Number(trade.lots) || 1;
    return lotSize * lots;
  };

  const calculatePnL = (trade: PlannedTrade) => {
    if (!trade.entry || !trade.target || !trade.quantity) return 0;
    const priceDiff =
      trade.tradeType === "BUY"
        ? trade.target - trade.entry
        : trade.entry - trade.target;
    return priceDiff * trade.quantity;
  };

  const approxPL = plannedTrades.reduce((sum, t) => sum + calculatePnL(t), 0);

  const updateTradeWithQuantity = (trade: PlannedTrade) => ({
    ...trade,
    quantity: calculateQuantity(trade),
  });

  // Fetch plan & comparison for selected date
  useEffect(() => {
    const key = formatDateKey(selectedDate);

    api
      .get(`${DJ_BASE}/plan`, { params: { date: key } })
      .then((res) => {
        if (res.data && res.data.date) {
          setPlanNotes(res.data.planNotes ?? "");
          const loaded =
            Array.isArray(res.data.plannedTrades) &&
            res.data.plannedTrades.length
              ? res.data.plannedTrades.map(updateTradeWithQuantity)
              : [{ ...defaultTrade }];
          setPlannedTrades(loaded);

          const firstEmpty = loaded.findIndex((t: PlannedTrade) => !t.symbol);
          setActiveEditIndex(
            firstEmpty !== -1 ? firstEmpty : Math.max(loaded.length - 1, 0)
          );

          setPsych({
            confidenceLevel:
              res.data.confidenceLevel ?? defaultPsych.confidenceLevel,
            stressLevel: res.data.stressLevel ?? defaultPsych.stressLevel,
            distractions: res.data.distractions ?? defaultPsych.distractions,
            sleepHours: res.data.sleepHours ?? defaultPsych.sleepHours,
            mood: res.data.mood ?? defaultPsych.mood,
            focus: res.data.focus ?? defaultPsych.focus,
            energy: res.data.energy ?? defaultPsych.energy,
          });

          const t =
            loaded[
              firstEmpty !== -1 ? firstEmpty : Math.max(loaded.length - 1, 0)
            ];
          if (
            t?.instrumentType === "OPTIDX" &&
            (t.underlyingSymbol || "").trim()
          ) {
            loadUnderlyings(t.exchangeId, t.instrumentType);
            loadExpiries(
              t.exchangeId,
              t.instrumentType,
              t.optionType,
              t.underlyingSymbol
            );
          } else {
            setExpiryOptions([]);
          }

          setPlanLocked(true);
        } else {
          setPlanNotes("");
          setPlannedTrades([{ ...defaultTrade }]);
          setPsych({ ...defaultPsych });
          setActiveEditIndex(0);
          setExpiryOptions([]);
          setPlanLocked(false);
        }
      })
      .catch(() => {
        setPlanNotes("");
        setPlannedTrades([{ ...defaultTrade }]);
        setPsych({ ...defaultPsych });
        setActiveEditIndex(0);
        setExpiryOptions([]);
        setPlanLocked(false);
      });

    api
      .get(`${DJ_BASE}/comparison`, { params: { date: key } })
      .then((res) => {
        setComparison(res.data);
        setExecutedStatus(res.data.status || "ok");
      })
      .catch(() => {
        setComparison(null);
        setExecutedStatus("ok");
      });
  }, [selectedDate]);

  // Load underlyings list whenever active trade changes exchange or instrument to OPTIDX
  const loadUnderlyings = (exch?: string, instr?: string) => {
    const ex = (
      exch ||
      plannedTrades[activeEditIndex]?.exchangeId ||
      ""
    ).trim();
    const it = (
      instr ||
      plannedTrades[activeEditIndex]?.instrumentType ||
      ""
    ).trim();
    if (ex && it === "OPTIDX") {
      api
        .get(UNDERLYINGS_API, {
          params: {
            exchange: ex,
            instrument: it,
            userId: getUserId() || undefined,
          },
        })
        .then((r) => setUnderlyings(r.data?.underlyings || []))
        .catch(() => setUnderlyings([]));
    } else {
      setUnderlyings([]);
    }
  };

  // Load expiries ONLY for OPTIDX
  const loadExpiries = (
    exchangeId?: string,
    instrumentType?: string,
    optionType?: string,
    underlyingSymbol?: string
  ) => {
    const ex = (
      exchangeId ||
      plannedTrades[activeEditIndex]?.exchangeId ||
      ""
    ).trim();
    const it = (
      instrumentType ||
      plannedTrades[activeEditIndex]?.instrumentType ||
      ""
    ).trim();
    const ot = (
      optionType ||
      plannedTrades[activeEditIndex]?.optionType ||
      ""
    ).trim();
    const und = (
      underlyingSymbol ||
      plannedTrades[activeEditIndex]?.underlyingSymbol ||
      ""
    ).trim();

    if (it === "OPTIDX" && ex && und) {
      api
        .get(EXPIRIES_API, {
          params: {
            exchange: ex,
            instrumentType: it,
            underlying: und,
            optionType: ot || undefined,
            userId: getUserId() || undefined,
          },
        })
        .then((r) => setExpiryOptions(r.data?.expiryDates || []))
        .catch(() => setExpiryOptions([]));
    } else {
      setExpiryOptions([]);
    }
  };

  const debouncedSuggest = useRef(
    debounce(
      (
        query: string,
        idx: number,
        exchangeId?: string,
        instrumentType?: string,
        optionType?: string,
        underlyingSymbol?: string,
        expiry?: string
      ) => {
        if (!query) return setSymbolSuggestions([]);
        api
          .get(INSTRUMENT_API, {
            params: {
              query,
              exchange: exchangeId || undefined,
              instrumentType: instrumentType || undefined,
              optionType: optionType || undefined,
              underlying: underlyingSymbol || undefined,
              expiry: expiry || undefined,
              userId: getUserId() || undefined,
            },
          })
          .then((res) => {
            setSymbolSuggestions(res.data || []);
            setSuggestForIdx(idx);
          });
      },
      200
    )
  ).current;

  // ----------- Handlers -----------
  const handleExchangeChange = (
    e: ChangeEvent<HTMLSelectElement>,
    idx: number
  ) => {
    const arr = [...plannedTrades];
    arr[idx].exchangeId = e.target.value;
    arr[idx].symbol = "";
    arr[idx].expiry = ""; // reset expiry
    setPlannedTrades(arr);
    setSymbolSuggestions([]);
    setSuggestForIdx(null);
    loadUnderlyings(e.target.value, arr[idx].instrumentType);
    if (arr[idx].instrumentType === "OPTIDX")
      loadExpiries(
        e.target.value,
        arr[idx].instrumentType,
        arr[idx].optionType,
        arr[idx].underlyingSymbol
      );
    else setExpiryOptions([]);
  };

  const handleInstrumentTypeChange = (
    e: ChangeEvent<HTMLSelectElement>,
    idx: number
  ) => {
    const arr = [...plannedTrades];
    arr[idx].instrumentType = e.target.value;
    arr[idx].symbol = "";
    arr[idx].optionType = "";
    arr[idx].expiry = "";
    if (e.target.value !== "OPTIDX") {
      arr[idx].underlyingSymbol = "";
    }
    setPlannedTrades(arr);
    setSymbolSuggestions([]);
    setSuggestForIdx(null);
    loadUnderlyings(arr[idx].exchangeId, e.target.value);
    if (e.target.value === "OPTIDX")
      loadExpiries(
        arr[idx].exchangeId,
        e.target.value,
        arr[idx].optionType,
        arr[idx].underlyingSymbol
      );
    else setExpiryOptions([]);
  };

  const handleOptionTypeChange = (
    e: ChangeEvent<HTMLSelectElement>,
    idx: number
  ) => {
    const arr = [...plannedTrades];
    arr[idx].optionType = e.target.value;
    arr[idx].symbol = "";
    arr[idx].expiry = "";
    setPlannedTrades(arr);
    setSymbolSuggestions([]);
    setSuggestForIdx(null);
    if (arr[idx].instrumentType === "OPTIDX")
      loadExpiries(
        arr[idx].exchangeId,
        arr[idx].instrumentType,
        e.target.value,
        arr[idx].underlyingSymbol
      );
  };

  const handleUnderlyingChange = (
    e: ChangeEvent<HTMLSelectElement>,
    idx: number
  ) => {
    const arr = [...plannedTrades];
    arr[idx].underlyingSymbol = e.target.value;
    arr[idx].symbol = "";
    arr[idx].expiry = "";
    setPlannedTrades(arr);
    setSymbolSuggestions([]);
    setSuggestForIdx(null);
    if (arr[idx].instrumentType === "OPTIDX")
      loadExpiries(
        arr[idx].exchangeId,
        arr[idx].instrumentType,
        arr[idx].optionType,
        e.target.value
      );
  };

  const handleExpiryChange = (
    e: ChangeEvent<HTMLSelectElement>,
    idx: number
  ) => {
    const arr = [...plannedTrades];
    arr[idx].expiry = e.target.value;
    setPlannedTrades(arr);
    if (arr[idx].symbol) {
      debouncedSuggest(
        arr[idx].symbol,
        idx,
        arr[idx].exchangeId,
        arr[idx].instrumentType,
        arr[idx].optionType,
        arr[idx].underlyingSymbol,
        arr[idx].expiry
      );
    }
  };

  const handleSymbolChange = (
    e: ChangeEvent<HTMLInputElement>,
    idx: number
  ) => {
    const arr = [...plannedTrades];
    arr[idx].symbol = e.target.value.toUpperCase();
    setPlannedTrades(arr);
    setSuggestForIdx(idx);
    debouncedSuggest(
      e.target.value,
      idx,
      arr[idx].exchangeId,
      arr[idx].instrumentType,
      arr[idx].optionType,
      arr[idx].underlyingSymbol,
      arr[idx].expiry
    );
  };

  const handleSelectSuggestion = (s: any, idx: number) => {
    const arr = [...plannedTrades];
    arr[idx] = updateTradeWithQuantity({
      ...arr[idx],
      symbol: s.symbol,
      exchangeId: s.exchangeId,
      instrumentType: s.instrumentType,
      instrumentName: s.instrumentName,
      segment: s.segment,
      lotSize: s.lotSize,
      expiry: s.expiry,
      optionType: s.optionType,
      strikePrice: s.strikePrice,
      underlyingSymbol: s.underlyingSymbol || arr[idx].underlyingSymbol || "",
    });
    setPlannedTrades(arr);
    setSymbolSuggestions([]);
    setSuggestForIdx(null);
    const nextInput = symbolInputRefs.current[idx + 1];
    if (nextInput) nextInput.focus();
  };

  const getNextActiveAfterDelete = (
    deletedIdx: number,
    prevActive: number,
    newLen: number
  ) => {
    if (newLen <= 0) return 0;
    if (prevActive === deletedIdx) return Math.min(deletedIdx, newLen - 1);
    if (prevActive > deletedIdx) return prevActive - 1;
    return prevActive;
  };

  const addTradeRow = () => {
    setPlannedTrades((trades) => {
      const next = [...trades, { ...defaultTrade }];
      setActiveEditIndex(next.length - 1);
      setExpiryOptions([]);
      return next;
    });
  };

  const removeTradeRow = (idx: number) =>
    setPlannedTrades((trades) => {
      const next = trades.filter((_, i) => i !== idx);
      if (next.length === 0) {
        setActiveEditIndex(0);
        setExpiryOptions([]);
        return [{ ...defaultTrade }];
      }
      setActiveEditIndex((prev) =>
        getNextActiveAfterDelete(idx, prev, next.length)
      );
      return next;
    });

  const savePlan = async () => {
    setSaving(true);
    const key = formatDateKey(selectedDate);
    try {
      await api.post(`${DJ_BASE}/plan`, {
        date: key,
        planNotes,
        plannedTrades: plannedTrades.filter((t) => t.symbol),
        ...psych,
      });
      setPlanLocked(true);
      setEditMode(false);
    } catch (err: any) {
      const msg = err?.response?.data?.error || "Failed to save plan.";
      alert(msg);
    }
    setSaving(false);
  };

  // const badgeObj = comparison ? getBadgeObj(comparison.executionPercent) : null;

  const SuggestionDropdown = ({
    suggestions,
    idx,
  }: {
    suggestions: any[];
    idx: number;
  }) => (
    <div className="absolute z-50 mt-2 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-h-80 overflow-auto w-full min-w-[300px] [scrollbar-width:thin] [scrollbar-color:#475569_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-600 [&::-webkit-scrollbar-thumb]:rounded-lg [&::-webkit-scrollbar-thumb:hover]:bg-slate-500">
      <div className="p-1.5">
        {suggestions.map((s, k) => (
          <div
            key={k}
            className="p-2 flex flex-col gap-0.5 cursor-pointer hover:bg-slate-800 rounded-lg border-b border-slate-800 last:border-b-0 transition"
            onMouseDown={() => handleSelectSuggestion(s, idx)}
          >
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-white text-sm">{s.symbol}</span>
              {s.instrumentType && (
                <span className="bg-blue-900/40 text-blue-300 px-1.5 py-0.5 rounded text-xs">
                  {s.instrumentType}
                </span>
              )}
              {s.optionType && (
                <span className="bg-purple-900/40 text-purple-300 px-1.5 py-0.5 rounded text-xs">
                  {s.optionType}
                </span>
              )}
              <span
                className={`bg-green-900/40 text-green-300 px-1.5 py-0.5 rounded text-xs`}
              >
                {s.exchangeId}
              </span>
              {s.underlyingSymbol && (
                <span className="bg-slate-700/60 text-slate-200 px-1.5 py-0.5 rounded text-xs">
                  {s.underlyingSymbol}
                </span>
              )}
            </div>
            <div className="flex gap-2 mt-0.5 text-xs text-slate-400">
              {s.expiry && <span>Expiry: {s.expiry}</span>}
              {s.strikePrice && <span>Strike: {s.strikePrice}</span>}
              {s.lotSize && <span>Lot Size: {s.lotSize}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const activeTrade: PlannedTrade =
    plannedTrades[activeEditIndex] ?? plannedTrades[0];

  // ===== Helper: get color for risk grade =====
  const riskColor = (g: RiskGrade) =>
    g === "Low"
      ? "text-emerald-400"
      : g === "Moderate"
      ? "text-amber-400"
      : g === "High"
      ? "text-orange-400"
      : g === "Extreme"
      ? "text-red-400"
      : "text-slate-400";

  const overallPlanRisk: RiskGrade = overallRisk(
    plannedTrades.filter((t) => t.symbol)
  );

  return (
    <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {tradeModal && (
        <TradeDetailModal
          open={!!tradeModal}
          onClose={() => setTradeModal(null)}
          trade={tradeModal.trade}
          isExtra={tradeModal.isExtra}
        />
      )}
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* HEADER */}
        <header className="mb-8">
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl shadow-lg">
                <BarChart3 className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white mb-1">
                  Trading Journal
                </h1>
                <p className="text-slate-400">
                  Professional trade planning and execution tracking
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-slate-800/50 backdrop-blur-sm rounded-xl px-4 py-2.5 border border-slate-700">
                <Calendar className="w-5 h-5 text-slate-400" />
                <input
                  type="date"
                  value={selectedDate.toISOString().slice(0, 10)}
                  onChange={(e) => setSelectedDate(new Date(e.target.value))}
                  className="border-none bg-transparent outline-none text-white font-medium"
                />
              </div>
              <button
                onClick={() => {
                  setEditMode(!editMode);
                  if (!editMode) {
                    const firstEmpty = plannedTrades.findIndex(
                      (t) => !t.symbol
                    );
                    setActiveEditIndex(
                      firstEmpty !== -1
                        ? firstEmpty
                        : Math.max(plannedTrades.length - 1, 0)
                    );
                  }
                }}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold transition-all duration-200 ${
                  editMode
                    ? "bg-slate-700 text-slate-200 hover:bg-slate-600"
                    : "bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-500 hover:to-purple-500 shadow-lg"
                }`}
              >
                {editMode ? (
                  <>
                    <X className="w-5 h-5" />
                    Cancel
                  </>
                ) : (
                  <>
                    <Edit3 className="w-5 h-5" />
                    Edit Plan
                  </>
                )}
              </button>
            </div>
          </div>
        </header>

        {/* EXECUTION & INSIGHTS */}
        {!isFuture && (
          <>
            {executedStatus === "no-executions" ? (
              <div className="mb-8">
                <div className="bg-slate-800/50 rounded-2xl border border-slate-700 shadow-xl px-6 py-8 flex flex-col items-center">
                  <Award className="w-8 h-8 mb-2 text-slate-400" />
                  <div className="text-2xl font-bold text-white mb-1">
                    No Execution Data
                  </div>
                  <div className="text-slate-400 mb-1 text-center">
                    You haven't uploaded an orderbook for this date.
                    <br />
                    <span className="text-indigo-400">
                      Upload your trade orderbook to analyze execution!
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              comparison && (
                <>
                  <div className="mb-8">
                    <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700 overflow-hidden shadow-2xl">
                      <div className="p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex items-center gap-3 px-6 py-2.5 rounded-xl bg-gradient-to-r ${
                              getBadgeObj(comparison.executionPercent).color
                            } shadow-xl`}
                          >
                            <Award className="w-5 h-5 text-white" />
                            <span className="font-bold text-white">
                              {getBadgeObj(comparison.executionPercent).badge}
                            </span>
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-white mb-0.5">
                              Execution Performance
                            </h3>
                            <p className="text-slate-400 text-sm">
                              {comparison.matched} of {comparison.totalPlanned}{" "}
                              planned trades executed
                            </p>
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-4xl font-bold text-white mb-0.5">
                            {comparison.executionPercent}%
                          </div>
                          <div className="text-slate-400">Accuracy Score</div>
                        </div>
                      </div>
                      <div className="bg-slate-700/30 px-6 py-3">
                        <div className="w-full bg-slate-700 rounded-full h-2.5">
                          <div
                            className={`h-2.5 rounded-full bg-gradient-to-r ${
                              getBadgeObj(comparison.executionPercent).color
                            } transition-all duration-1000`}
                            style={{ width: `${comparison.executionPercent}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid lg:grid-cols-2 gap-6 mb-8">
                    <div className="bg-slate-800/50 border border-green-800/30 rounded-xl p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <CheckCircle className="w-5 h-5 text-green-400" />
                        <h3 className="text-lg font-semibold text-green-300">
                          Key Insights
                        </h3>
                      </div>
                      <ul className="space-y-2">
                        {(comparison.insights?.length
                          ? comparison.insights.filter(
                              (x) =>
                                !!x.trim() &&
                                !x.includes("P&L: ₹0.00") &&
                                !x.includes("Avg P&L (matched): ₹0.00")
                            )
                          : ["No insights yet"]
                        ).map((line, idx) => (
                          <li
                            key={idx}
                            className="flex items-start gap-2 text-green-200"
                          >
                            <div className="w-1.5 h-1.5 bg-green-400 rounded-full mt-2 flex-shrink-0" />
                            <span>{line}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="bg-slate-800/50 border border-red-800/30 rounded-xl p-6">
                      <div className="flex items-left gap-2 mb-4">
                        <XCircle className="w-5 h-5 text-red-400" />
                        <h3 className="text-lg font-semibold text-red-300">
                          Areas for Improvement
                        </h3>
                      </div>
                      <ul className="space-y-2">
                        {(comparison.whatWentWrong?.length
                          ? comparison.whatWentWrong.filter((x) => !!x.trim())
                          : ["No issues noted"]
                        ).map((line, idx) => (
                          <li
                            key={idx}
                            className="flex items-start gap-2 text-red-200 text-left"
                            style={{ lineHeight: 1.6 }}
                          >
                            <span className="inline-block w-1.5 h-1.5 mt-2.5 bg-red-400 rounded-full flex-shrink-0" />
                            <span className="break-all text-left">
                              {line.replace(/\s+/g, " ").trim()}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-5 mb-8">
                    <div className="bg-green-950/40 border border-green-700 rounded-xl p-5 text-center flex flex-col justify-between min-h-[140px]">
                      <div>
                        <div className="flex items-center gap-2 mb-2 justify-center">
                          <CheckCircle className="w-5 h-5 text-green-400" />
                          <span className="font-semibold text-green-300">
                            Executed as Planned
                          </span>
                        </div>
                        <div className="text-3xl font-bold text-green-200 mb-1">
                          {comparison.matchedTrades.length}
                        </div>
                      </div>
                      <button
                        disabled={comparison.matchedTrades.length === 0}
                        className={`mt-3 px-3 py-1.5 rounded-lg text-green-200 font-medium transition
                          ${
                            comparison.matchedTrades.length
                              ? "bg-green-800/40 hover:bg-green-700/30"
                              : "bg-green-900/30 opacity-50 cursor-not-allowed"
                          }`}
                        onClick={() => setModalType("matched")}
                      >
                        View Details
                      </button>
                    </div>

                    <div className="bg-yellow-950/40 border border-yellow-700 rounded-xl p-5 text-center flex flex-col justify-between minHeight-[140px]">
                      <div>
                        <div className="flex items-center gap-2 mb-2 justify-center">
                          <AlertCircle className="w-5 h-5 text-yellow-400" />
                          <span className="font-semibold text-yellow-300">
                            Missed Opportunities
                          </span>
                        </div>
                        <div className="text-3xl font-bold text-yellow-200 mb-1">
                          {comparison.missedTrades.length}
                        </div>
                      </div>
                      <button
                        disabled={comparison.missedTrades.length === 0}
                        className={`mt-3 px-3 py-1.5 rounded-lg text-yellow-200 font-medium transition
                          ${
                            comparison.missedTrades.length
                              ? "bg-yellow-800/40 hover:bg-yellow-700/30"
                              : "bg-yellow-900/30 opacity-50 cursor-not-allowed"
                          }`}
                        onClick={() => setModalType("missed")}
                      >
                        View Details
                      </button>
                    </div>

                    <div className="bg-purple-950/40 border border-purple-700 rounded-xl p-5 text-center flex flex-col justify-between min-h-[140px]">
                      <div>
                        <div className="flex items-center gap-2 mb-2 justify-center">
                          <Info className="w-5 h-5 text-purple-400" />
                          <span className="font-semibold text-purple-300">
                            Unplanned Trades
                          </span>
                        </div>
                        <div className="text-3xl font-bold text-purple-200 mb-1">
                          {comparison.extraTrades.length}
                        </div>
                      </div>
                      <button
                        disabled={comparison.extraTrades.length === 0}
                        className={`mt-3 px-3 py-1.5 rounded-lg text-purple-200 font-medium transition
                          ${
                            comparison.extraTrades.length
                              ? "bg-purple-800/40 hover:bg-purple-700/30"
                              : "bg-purple-900/30 opacity-50 cursor-not-allowed"
                          }`}
                        onClick={() => setModalType("extra")}
                      >
                        View Details
                      </button>
                    </div>
                  </div>

                  {modalType && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
                      <div className="bg-slate-900 rounded-2xl p-6 max-w-xl w-full mx-4 border border-slate-700 shadow-2xl relative">
                        <button
                          className="absolute top-4 right-5 p-1.5 rounded-full bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-white transition"
                          onClick={() => setModalType(null)}
                        >
                          <X className="w-6 h-6" />
                        </button>
                        <h2 className="text-xl font-bold mb-4 text-white flex items-center gap-2">
                          {modalType === "matched" && (
                            <CheckCircle className="w-5 h-5 text-green-400" />
                          )}
                          {modalType === "missed" && (
                            <AlertCircle className="w-5 h-5 text-yellow-400" />
                          )}
                          {modalType === "extra" && (
                            <Info className="w-5 h-5 text-purple-400" />
                          )}
                          {modalType === "matched" && "Executed as Planned"}
                          {modalType === "missed" && "Missed Opportunities"}
                          {modalType === "extra" && "Unplanned Trades"}
                        </h2>
                        <div
                          className="
          max-h-[360px] overflow-y-auto space-y-3 pr-2
          [scrollbar-width:thin] [scrollbar-color:#475569_transparent]
          [&::-webkit-scrollbar]:w-[1px] [&::-webkit-scrollbar]:h-[1px]
          [&::-webkit-scrollbar-track]:bg-transparent
          [&::-webkit-scrollbar-thumb]:bg-slate-600
          [&::-webkit-scrollbar-thumb]:rounded-full
          [&::-webkit-scrollbar-thumb:hover]:bg-slate-500
        "
                        >
                          {modalType === "matched" &&
                            comparison.matchedTrades.map((t, i) => (
                              <div
                                key={i}
                                className="bg-green-800/30 text-green-100 rounded-xl p-4"
                              >
                                <div className="flex flex-wrap gap-3 items-center mb-1">
                                  <span className="font-semibold">
                                    {t.symbol}
                                  </span>
                                  {t.expiry && (
                                    <span className="text-xs text-green-200">
                                      {t.expiry}
                                    </span>
                                  )}
                                  <span className="text-xs">{t.tradeType}</span>
                                  <span className="ml-auto font-medium">
                                    @ ₹{t.entry}
                                  </span>
                                  {typeof t.PnL !== "undefined" && (
                                    <span
                                      className={`ml-3 px-2 py-0.5 rounded text-xs font-semibold ${
                                        t.PnL >= 0
                                          ? "bg-green-900/60"
                                          : "bg-red-900/60"
                                      }`}
                                    >
                                      P&L: ₹{t.PnL}
                                    </span>
                                  )}
                                  {t.quantity && (
                                    <span className="text-xs text-green-300">
                                      Qty: {t.quantity}
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          {modalType === "missed" &&
                            comparison.missedTrades.map((t, i) => (
                              <div
                                key={i}
                                className="bg-yellow-800/30 text-yellow-100 rounded-xl p-4"
                              >
                                <div className="flex flex-wrap gap-3 items-center mb-1">
                                  <span className="font-semibold">
                                    {t.symbol}
                                  </span>
                                  {t.expiry && (
                                    <span className="text-xs text-yellow-200">
                                      {t.expiry}
                                    </span>
                                  )}
                                  <span className="text-xs">{t.tradeType}</span>
                                  <span className="ml-auto font-medium">
                                    Planned @ ₹{t.entry}
                                  </span>
                                  {t.quantity && (
                                    <span className="text-xs text-yellow-300">
                                      Qty: {t.quantity}
                                    </span>
                                  )}
                                </div>
                                {t.reason && (
                                  <div className="text-xs text-yellow-300 mt-1">
                                    {t.reason}
                                  </div>
                                )}
                              </div>
                            ))}
                          {modalType === "extra" &&
                            comparison.groupedExtras &&
                            Object.values(comparison.groupedExtras).map(
                              (trades, idx) => {
                                const t = trades[0];
                                return (
                                  <div
                                    key={idx}
                                    className="bg-purple-800/30 text-purple-100 rounded-xl p-4"
                                  >
                                    <div className="flex flex-wrap gap-3 items-center mb-1">
                                      <span className="font-semibold">
                                        {t.symbol}
                                      </span>
                                      {t.expiry && (
                                        <span className="text-xs text-purple-200">
                                          {t.expiry}
                                        </span>
                                      )}
                                      <span className="text-xs">
                                        {t.tradeType}
                                      </span>
                                      <span className="ml-auto font-medium">
                                        {trades.length > 1
                                          ? `x${trades.length}`
                                          : null}
                                      </span>
                                    </div>
                                    <div className="flex flex-wrap gap-3 mt-1 text-xs text-purple-300">
                                      {trades.map((x, k) => (
                                        <span key={k}>
                                          @ ₹{x.entry} (Qty: {x.quantity || 1})
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                );
                              }
                            )}
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )
            )}
          </>
        )}

        {/* ===================== PLAN/EDIT/FORM ===================== */}
        <div className="space-y-6">
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700 overflow-hidden shadow-2xl">
            <div className="p-6">
              {editMode ? (
                <div className="space-y-6">
                  <div>
                    <label className="flex items-center gap-2 text-base font-semibold text-white mb-3">
                      <Star className="w-5 h-5 text-yellow-400" />
                      Trading Focus & Market Outlook
                    </label>
                    <textarea
                      className="w-full bg-slate-700/50 border border-slate-600 rounded-xl p-3 text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 resize-none"
                      rows={3}
                      placeholder="Describe your market outlook, key levels to watch, and overall trading strategy for today..."
                      value={planNotes}
                      onChange={(e) => setPlanNotes(e.target.value)}
                    />
                  </div>

                  <div className="bg-slate-700/30 rounded-xl p-4 border border-slate-600">
                    <div className="flex items-center gap-2 mb-4">
                      <Brain className="w-5 h-5 text-purple-400" />
                      <h3 className="text-base font-semibold text-white">
                        Mental State Assessment
                      </h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-2">
                          Confidence Level
                        </label>
                        <input
                          type="range"
                          min={0}
                          max={10}
                          step={1}
                          value={psych.confidenceLevel}
                          onChange={(e) =>
                            setPsych((ps) => ({
                              ...ps,
                              confidenceLevel: Number(e.target.value),
                            }))
                          }
                          className="w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer slider"
                        />
                        <div className="text-center text-slate-300 mt-1 font-semibold">
                          {psych.confidenceLevel}/10
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-2">
                          Stress Level
                        </label>
                        <input
                          type="range"
                          min={0}
                          max={10}
                          step={1}
                          value={psych.stressLevel}
                          onChange={(e) =>
                            setPsych((ps) => ({
                              ...ps,
                              stressLevel: Number(e.target.value),
                            }))
                          }
                          className="w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer"
                        />
                        <div className="text-center text-slate-300 mt-1 font-semibold">
                          {psych.stressLevel}/10
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-2">
                          Distractions
                        </label>
                        <input
                          type="text"
                          className="w-full bg-slate-600 border border-slate-500 rounded-lg px-3 py-2 text-white placeholder-slate-400 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                          value={psych.distractions}
                          onChange={(e) =>
                            setPsych((ps) => ({
                              ...ps,
                              distractions: e.target.value,
                            }))
                          }
                          placeholder="e.g., phone, TV"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-2">
                          Sleep Hours
                        </label>
                        <input
                          type="number"
                          min={0}
                          max={24}
                          className="w-full bg-slate-600 border border-slate-500 rounded-lg px-3 py-2 text-white placeholder-slate-400 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                          value={psych.sleepHours}
                          onChange={(e) =>
                            setPsych((ps) => ({
                              ...ps,
                              sleepHours: Number(e.target.value),
                            }))
                          }
                          placeholder="Hours"
                        />
                      </div>
                    </div>
                  </div>

                  {plannedTrades.some(
                    (t, i) => i !== activeEditIndex && t.symbol
                  ) && (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-base font-semibold text-white flex items-center gap-2">
                          <Target className="w-5 h-5 text-indigo-400" />
                          Planned Trades (Compact)
                        </h3>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="bg-slate-700/50 text-slate-300 text-xs">
                              <th className="p-2 text-center">Symbol</th>
                              <th className="p-2 text-center">Type</th>
                              <th className="p-2 text-center">Strategy</th>
                              <th className="p-2 text-center">Entry</th>
                              <th className="p-2 text-center">Target</th>
                              <th className="p-2 text-center">SL</th>
                              <th className="p-2 text-center">Lots</th>
                              <th className="p-2 text-center">Qty</th>
                              <th className="p-2 text-center">P&L</th>
                              <th className="p-2 text-center">Risk</th>
                              <th className="p-2 text-center">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {plannedTrades.map((t, i) => {
                              if (i === activeEditIndex || !t.symbol)
                                return null;
                              const potentialPL = calculatePnL(t);
                              const { grade } = riskForTrade(t);
                              return (
                                <tr
                                  key={i}
                                  className="border-b border-slate-700 hover:bg-slate-700/20"
                                >
                                  <td className="p-2">
                                    <div className="font-medium text-white">
                                      {t.symbol}
                                    </div>
                                    {t.expiry && (
                                      <div className="text-[11px] text-slate-400">
                                        {t.expiry}
                                      </div>
                                    )}
                                  </td>
                                  <td className="p-2 text-center">
                                    <span
                                      className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${
                                        t.tradeType === "BUY"
                                          ? "bg-green-900/40 text-green-300"
                                          : "bg-red-900/40 text-red-300"
                                      }`}
                                    >
                                      {t.tradeType}
                                    </span>
                                  </td>
                                  <td className="p-2 text-center text-slate-300 text-xs">
                                    {t.strategy}
                                  </td>
                                  <td className="p-2 text-center text-white font-medium">
                                    ₹{t.entry || "0.00"}
                                  </td>
                                  <td className="p-2 text-center text-green-400 font-medium">
                                    ₹{t.target || "0.00"}
                                  </td>
                                  <td className="p-2 text-center text-red-400 font-medium">
                                    ₹{t.stopLoss || "0.00"}
                                  </td>
                                  <td className="p-2 text-center text-white">
                                    {t.lots}
                                  </td>
                                  <td className="p-2 text-center text-white">
                                    {t.quantity || "-"}
                                  </td>
                                  <td
                                    className={`p-2 text-center font-medium ${
                                      potentialPL >= 0
                                        ? "text-green-400"
                                        : "text-red-400"
                                    }`}
                                  >
                                    ₹{potentialPL.toFixed(2)}
                                  </td>
                                  <td
                                    className={`p-2 text-center font-semibold ${riskColor(
                                      grade
                                    )}`}
                                  >
                                    {grade}
                                  </td>
                                  <td className="p-2">
                                    <div className="flex items-center justify-center gap-2">
                                      <button
                                        onClick={() => setActiveEditIndex(i)}
                                        className="p-1.5 text-slate-300 hover:text-indigo-400 hover:bg-indigo-900/20 rounded-lg transition-colors"
                                        title="Edit"
                                      >
                                        <Edit3 className="w-4 h-4" />
                                      </button>
                                      {!planLocked && (
                                        <button
                                          onClick={() => removeTradeRow(i)}
                                          className="p-1.5 text-slate-300 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-colors"
                                          title="Remove"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </button>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-base font-semibold text-white flex items-center gap-2">
                        <Target className="w-5 h-5 text-indigo-400" />
                        {`Plan Trade ${activeEditIndex + 1}`}
                      </h3>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={addTradeRow}
                          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium transition-all duration-200 shadow-lg"
                        >
                          <Plus className="w-4 h-4" />
                          Add Trade
                        </button>
                      </div>
                    </div>

                    <div className="bg-slate-700/40 rounded-xl p-5 border border-slate-600 space-y-5">
                      {/* Basic Info Row */}
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-slate-300 mb-1.5">
                            Strategy
                          </label>
                          <select
                            className="w-full bg-slate-600 border border-slate-500 rounded-lg px-3 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            value={activeTrade.strategy}
                            onChange={(e) => {
                              const arr = [...plannedTrades];
                              arr[activeEditIndex].strategy = e.target.value;
                              setPlannedTrades(arr);
                            }}
                          >
                            {strategies.map((s, idx) => (
                              <option key={idx} value={s}>
                                {s}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Trade Type selector (BUY/SELL) */}
                        <div>
                          <label className="block text-xs font-medium text-slate-300 mb-1.5">
                            Trade Type
                          </label>
                          <select
                            className="w-full bg-slate-600 border border-slate-500 rounded-lg px-3 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            value={activeTrade.tradeType}
                            onChange={(e) => {
                              const arr = [...plannedTrades];
                              arr[activeEditIndex].tradeType = e.target
                                .value as "BUY" | "SELL";
                              setPlannedTrades(arr);
                            }}
                          >
                            <option value="BUY">BUY</option>
                            <option value="SELL">SELL</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-slate-300 mb-1.5">
                            Exchange
                          </label>
                          <select
                            className="w-full bg-slate-600 border border-slate-500 rounded-lg px-3 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            value={activeTrade.exchangeId}
                            onChange={(e) =>
                              handleExchangeChange(e as any, activeEditIndex)
                            }
                          >
                            <option value="">Select Exchange</option>
                            {exchanges.map((ex) => (
                              <option key={ex} value={ex}>
                                {ex}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-300 mb-1.5">
                            Instrument Type
                          </label>
                          <select
                            className="w-full bg-slate-600 border border-slate-500 rounded-lg px-3 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            value={activeTrade.instrumentType}
                            onChange={(e) =>
                              handleInstrumentTypeChange(
                                e as any,
                                activeEditIndex
                              )
                            }
                          >
                            <option value="">Select Type</option>
                            {instrumentTypes.map((type) => (
                              <option key={type} value={type}>
                                {type}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Symbol / Option / Index / Expiry Row */}
                      <div
                        className={`grid grid-cols-1 ${
                          activeTrade.instrumentType === "OPTIDX"
                            ? "md:grid-cols-4"
                            : "md:grid-cols-3"
                        } gap-3`}
                      >
                        {["OPTIDX", "OPTSTK", "OPTFUT"].includes(
                          activeTrade.instrumentType || ""
                        ) && (
                          <div>
                            <label className="block text-xs font-medium text-slate-300 mb-1.5">
                              Option Type
                            </label>
                            <select
                              className="w-full bg-slate-600 border border-slate-500 rounded-lg px-3 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                              value={activeTrade.optionType}
                              onChange={(e) =>
                                handleOptionTypeChange(
                                  e as any,
                                  activeEditIndex
                                )
                              }
                            >
                              <option value="">Select Option</option>
                              {optionTypes.map((type) => (
                                <option key={type} value={type}>
                                  {type}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}

                        {activeTrade.instrumentType === "OPTIDX" && (
                          <div>
                            <label className="block text-xs font-medium text-slate-300 mb-1.5">
                              Index
                            </label>
                            <select
                              className="w-full bg-slate-600 border border-slate-500 rounded-lg px-3 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                              value={activeTrade.underlyingSymbol || ""}
                              onChange={(e) =>
                                handleUnderlyingChange(
                                  e as any,
                                  activeEditIndex
                                )
                              }
                              onFocus={() => loadUnderlyings()}
                            >
                              <option value="">Select Index</option>
                              {underlyings.map((u) => (
                                <option key={u} value={u}>
                                  {u}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}

                        {/* Expiry ONLY for OPTIDX */}
                        {activeTrade.instrumentType === "OPTIDX" && (
                          <div>
                            <label className="block text-xs font-medium text-slate-300 mb-1.5">
                              Expiry
                            </label>
                            <div className="relative">
                              <select
                                className="
        w-full appearance-none pr-10
        bg-slate-900 hover:bg-slate-800
        border border-slate-700 rounded-xl
        px-3 py-2.5 text-white placeholder-slate-400
        focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
        shadow-2xl shadow-slate-900/20
        max-h-80 overflow-auto
        
        [scrollbar-width:thin] [scrollbar-color:#475569_transparent]
        [&::-webkit-scrollbar]:w-1.5
        [&::-webkit-scrollbar]:bg-transparent
        [&::-webkit-scrollbar-thumb]:bg-slate-600
        [&::-webkit-scrollbar-thumb]:rounded-lg
        [&::-webkit-scrollbar-thumb:hover]:bg-slate-500
      "
                                value={activeTrade.expiry || ""}
                                onChange={(e) =>
                                  handleExpiryChange(e as any, activeEditIndex)
                                }
                                onFocus={() => loadExpiries()}
                              >
                                <option value="">Select Expiry</option>
                                {expiryOptions.map((d) => (
                                  <option
                                    key={d}
                                    value={d}
                                    className="bg-slate-900 hover:bg-slate-800 p-2"
                                  >
                                    {d}
                                  </option>
                                ))}
                              </select>

                              {/* chevron (purely visual; no logic change) */}
                              <svg
                                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 opacity-80"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                                aria-hidden="true"
                              >
                                <path d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.94l3.71-3.71a.75.75 0 1 1 1.06 1.06l-4.24 4.24a.75.75 0 0 1-1.06 0L5.21 8.29a.75.75 0 0 1 .02-1.08z" />
                              </svg>
                            </div>
                          </div>
                        )}

                        <div className="relative">
                          <label className="block text-xs font-medium text-slate-300 mb-1.5">
                            Symbol
                          </label>
                          <input
                            ref={(el) => {
                              symbolInputRefs.current[activeEditIndex] = el;
                            }}
                            className="w-full bg-slate-600 border border-slate-500 rounded-lg px-3 py-2.5 text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="Search symbol..."
                            value={activeTrade.symbol}
                            autoComplete="off"
                            onChange={(e) =>
                              handleSymbolChange(e as any, activeEditIndex)
                            }
                            onFocus={() =>
                              activeTrade.symbol &&
                              debouncedSuggest(
                                activeTrade.symbol,
                                activeEditIndex,
                                activeTrade.exchangeId,
                                activeTrade.instrumentType,
                                activeTrade.optionType,
                                activeTrade.underlyingSymbol,
                                activeTrade.expiry
                              )
                            }
                          />
                          {symbolSuggestions.length > 0 &&
                            suggestForIdx === activeEditIndex && (
                              <SuggestionDropdown
                                suggestions={symbolSuggestions}
                                idx={activeEditIndex}
                              />
                            )}
                        </div>
                      </div>

                      {/* Price and Quantity Row */}
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-slate-300 mb-1.5">
                            Lots
                          </label>
                          <input
                            type="number"
                            className="w-full bg-slate-600 border border-slate-500 rounded-lg px-3 py-2.5 text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            value={activeTrade.lots}
                            min={1}
                            onChange={(e) => {
                              const arr = [...plannedTrades];
                              arr[activeEditIndex].lots =
                                parseInt(e.target.value) || 1;
                              arr[activeEditIndex].quantity = calculateQuantity(
                                arr[activeEditIndex]
                              );
                              setPlannedTrades(arr);
                            }}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-300 mb-1.5">
                            Quantity
                          </label>
                          <input
                            type="number"
                            className="w-full bg-slate-600 border border-slate-500 rounded-lg px-3 py-2.5 text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            value={activeTrade.quantity || ""}
                            readOnly
                            placeholder="Auto-calculated"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-300 mb-1.5">
                            Entry Price
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            className="w-full bg-slate-600 border border-slate-500 rounded-lg px-3 py-2.5 text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            value={activeTrade.entry || ""}
                            placeholder="0.00"
                            onChange={(e) => {
                              const arr = [...plannedTrades];
                              arr[activeEditIndex].entry =
                                parseFloat(e.target.value) || 0;
                              setPlannedTrades(arr);
                            }}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-300 mb-1.5">
                            Stop Loss
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            className="w-full bg-slate-600 border border-slate-500 rounded-lg px-3 py-2.5 text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            value={activeTrade.stopLoss || ""}
                            placeholder="0.00"
                            onChange={(e) => {
                              const arr = [...plannedTrades];
                              arr[activeEditIndex].stopLoss =
                                parseFloat(e.target.value) || 0;
                              setPlannedTrades(arr);
                            }}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-300 mb-1.5">
                            Target
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            className="w-full bg-slate-600 border border-slate-500 rounded-lg px-3 py-2.5 text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            value={activeTrade.target || ""}
                            placeholder="0.00"
                            onChange={(e) => {
                              const arr = [...plannedTrades];
                              arr[activeEditIndex].target =
                                parseFloat(e.target.value) || 0;
                              setPlannedTrades(arr);
                            }}
                          />
                        </div>
                      </div>

                      {/* Live risk + PL row */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-slate-300 mb-1.5">
                            Projected P&L
                          </label>
                          <input
                            type="text"
                            className="w-full bg-slate-600 border border-slate-500 rounded-lg px-3 py-2.5 text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            value={`₹${calculatePnL(activeTrade).toFixed(2)}`}
                            readOnly
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-300 mb-1.5">
                            Risk-Reward (R:R)
                          </label>
                          {(() => {
                            const r = riskForTrade(activeTrade);
                            const rrTxt = r.rr ? r.rr.toFixed(2) : "—";
                            return (
                              <input
                                type="text"
                                className="w-full bg-slate-600 border border-slate-500 rounded-lg px-3 py-2.5 text-white"
                                value={rrTxt}
                                readOnly
                              />
                            );
                          })()}
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-300 mb-1.5">
                            Risk Grade
                          </label>
                          {(() => {
                            const r = riskForTrade(activeTrade);
                            return (
                              <input
                                type="text"
                                className={`w-full bg-slate-600 border border-slate-500 rounded-lg px-3 py-2.5 font-semibold ${riskColor(
                                  r.grade
                                )} `}
                                value={r.grade}
                                readOnly
                              />
                            );
                          })()}
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1.5">
                          Trade Rationale
                        </label>
                        <textarea
                          className="w-full bg-slate-600 border border-slate-500 rounded-lg px-3 py-2.5 text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                          rows={2}
                          value={activeTrade.reason}
                          placeholder="Why are you taking this trade? What's your analysis?"
                          onChange={(e) => {
                            const arr = [...plannedTrades];
                            arr[activeEditIndex].reason = e.target.value;
                            setPlannedTrades(arr);
                          }}
                        />
                      </div>

                      {(activeTrade.instrumentName ||
                        activeTrade.segment ||
                        activeTrade.lotSize ||
                        activeTrade.expiry) && (
                        <div className="bg-slate-600/30 rounded-lg p-3 border border-slate-600">
                          <div className="text-[11px] font-medium text-slate-300 mb-1.5">
                            Instrument Details
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                            {activeTrade.instrumentName && (
                              <div>
                                <span className="text-slate-400">Name:</span>
                                <div className="text-white font-medium">
                                  {activeTrade.instrumentName}
                                </div>
                              </div>
                            )}
                            {activeTrade.segment && (
                              <div>
                                <span className="text-slate-400">Segment:</span>
                                <div className="text-white font-medium">
                                  {activeTrade.segment}
                                </div>
                              </div>
                            )}
                            {activeTrade.lotSize && (
                              <div>
                                <span className="text-slate-400">
                                  Lot Size:
                                </span>
                                <div className="text-white font-medium">
                                  {activeTrade.lotSize}
                                </div>
                              </div>
                            )}
                            {activeTrade.expiry && (
                              <div>
                                <span className="text-slate-400">Expiry:</span>
                                <div className="text-white font-medium">
                                  {activeTrade.expiry}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-3 border-t border-slate-600">
                        <div className="text-slate-400 text-sm">
                          <span className="font-medium">
                            Total Projected P&L:{" "}
                          </span>
                          <span
                            className={`text-lg font-bold ${
                              approxPL >= 0 ? "text-green-400" : "text-red-400"
                            }`}
                          >
                            {approxPL >= 0 ? "+" : ""}₹{approxPL.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {!planLocked && (
                            <button
                              onClick={() => removeTradeRow(activeEditIndex)}
                              disabled={plannedTrades.length === 1}
                              className="flex items-center gap-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 px-3 py-2 rounded-lg transition-all duration-200 disabled:opacity-50"
                              title="Remove Trade"
                            >
                              <X className="w-4 h-4" />
                              Remove
                            </button>
                          )}
                          <button
                            onClick={savePlan}
                            disabled={saving}
                            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg transition-all duration-200"
                          >
                            <Save className="w-5 h-5" />
                            {saving ? "Saving..." : "Save Plan"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-8">
                  {plannedTrades?.length > 0 && plannedTrades[0].symbol ? (
                    <>
                      {planNotes && (
                        <div>
                          <h4 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
                            <Star className="w-5 h-5 text-yellow-400" />
                            Market Focus
                          </h4>
                          <div className="bg-slate-700/30 rounded-xl p-5 border border-slate-600">
                            <p className="text-slate-200 leading-relaxed">
                              {planNotes}
                            </p>
                          </div>
                        </div>
                      )}

                      <div className="bg-slate-700/30 rounded-xl p-5 border border-slate-600">
                        <h4 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
                          <Brain className="w-5 h-5 text-purple-400" />
                          Mental State
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                          <div className="text-center">
                            <div className="text-xs text-slate-400 mb-1">
                              Confidence
                            </div>
                            <div className="text-2xl font-bold text-white">
                              {psych.confidenceLevel}/10
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-xs text-slate-400 mb-1">
                              Stress
                            </div>
                            <div className="text-2xl font-bold text-white">
                              {psych.stressLevel}/10
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-xs text-slate-400 mb-1">
                              Sleep
                            </div>
                            <div className="text-2xl font-bold text-white">
                              {psych.sleepHours}h
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-xs text-slate-400 mb-1">
                              Distractions
                            </div>
                            <div className="text-lg font-medium text-white">
                              {psych.distractions || "None"}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
                          <Target className="w-5 h-5 text-indigo-400" />
                          Planned Trades (
                          {plannedTrades.filter((t) => t.symbol).length})
                        </h4>
                        <div className="overflow-x-auto">
                          <table className="w-full border-collapse">
                            <thead>
                              <tr className="bg-slate-700/50 text-slate-300 text-xs">
                                <th className="p-2 text-center">Symbol</th>
                                <th className="p-2 text-center">Type</th>
                                <th className="p-2 text-center">Strategy</th>
                                <th className="p-2 text-center">Entry</th>
                                <th className="p-2 text-center">SL</th>
                                <th className="p-2 text-center">Target</th>
                                <th className="p-2 text-center">Lots</th>
                                <th className="p-2 text-center">Quantity</th>
                                <th className="p-2 text-center">P&L</th>
                                <th className="p-2 text-center">Exchange</th>
                                <th className="p-2 text-center">Edit</th>
                              </tr>
                            </thead>
                            <tbody>
                              {plannedTrades.map((t, i) => {
                                const potentialPL = calculatePnL(t);

                                return (
                                  <tr
                                    key={i}
                                    className="border-b border-slate-700 hover:bg-slate-700/20 transition-colors"
                                  >
                                    <td className="p-2">
                                      <div className="font-medium text-white">
                                        {t.symbol}
                                      </div>
                                      {t.expiry && (
                                        <div className="text-[11px] text-slate-400">
                                          {t.expiry}
                                        </div>
                                      )}
                                    </td>
                                    <td className="p-2">
                                      <span
                                        className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${
                                          t.tradeType === "BUY"
                                            ? "bg-green-900/40 text-green-300"
                                            : "bg-red-900/40 text-red-300"
                                        }`}
                                      >
                                        {t.tradeType}
                                      </span>
                                    </td>
                                    <td className="p-2 text-slate-300 text-xs text-center">
                                      {t.strategy}
                                    </td>
                                    <td className="p-2 text-center text-white font-medium">
                                      ₹{t.entry || "0.00"}
                                    </td>
                                    <td className="p-2 text-center text-red-400 font-medium">
                                      ₹{t.stopLoss || "0.00"}
                                    </td>
                                    <td className="p-2 text-center text-green-400 font-medium">
                                      ₹{t.target || "0.00"}
                                    </td>
                                    <td className="p-2 text-center text-white">
                                      {t.lots}
                                    </td>
                                    <td className="p-2 text-center text-white">
                                      {t.quantity || "-"}
                                    </td>
                                    <td
                                      className={`p-2 text-center font-medium ${
                                        potentialPL >= 0
                                          ? "text-green-400"
                                          : "text-red-400"
                                      }`}
                                    >
                                      ₹{potentialPL.toFixed(2)}
                                    </td>
                                    <td className="p-2 text-slate-400 text-xs text-center">
                                      {t.exchangeId}
                                    </td>
                                    <td className="p-2">
                                      <div className="flex gap-2 justify-center">
                                        {/* View mode: allow edit, but no deletion */}
                                        <button
                                          onClick={() => {
                                            setActiveEditIndex(i);
                                            setEditMode(true);
                                          }}
                                          className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-indigo-900/20 rounded-lg transition-colors"
                                          title="Edit"
                                        >
                                          <Edit3 className="w-4 h-4" />
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                        {plannedTrades.some((t) => t.reason) && (
                          <div className="mt-5">
                            <h5 className="text-xs font-semibold text-slate-400 mb-2">
                              Trade Rationales
                            </h5>
                            <div className="space-y-2.5">
                              {plannedTrades.map(
                                (t, i) =>
                                  t.reason && (
                                    <div
                                      key={i}
                                      className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-3 shadow transition"
                                    >
                                      <div className="flex items-center gap-3 min-w-0">
                                        <div className="font-bold text-white truncate text-base tracking-tight">
                                          {t.symbol}
                                        </div>
                                        <div
                                          className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold shadow ${
                                            t.tradeType === "BUY"
                                              ? "bg-green-700/20 text-green-400 border border-green-800"
                                              : "bg-red-700/20 text-red-400 border border-red-800"
                                          }`}
                                        >
                                          {t.tradeType}
                                        </div>
                                        {t.expiry && (
                                          <span className="text-[11px] text-slate-400 ml-2">
                                            {t.expiry}
                                          </span>
                                        )}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-slate-200 text-sm font-medium text-left leading-snug break-words">
                                          {t.reason}
                                        </p>
                                      </div>
                                    </div>
                                  )
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-5 shadow-xl">
                        <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
                          <BarChart3 className="w-5 h-5 text-indigo-400" />
                          Summary
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="bg-slate-700/30 rounded-lg p-4 border border-slate-600">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="p-1.5 bg-indigo-900/30 rounded-lg">
                                <Target className="w-4 h-4 text-indigo-400" />
                              </div>
                              <span className="text-slate-300 text-sm">
                                Planned Trades
                              </span>
                            </div>
                            <div className="text-xl font-bold text-white">
                              {plannedTrades.filter((t) => t.symbol).length}
                            </div>
                          </div>
                          <div className="bg-slate-700/30 rounded-lg p-4 border border-slate-600">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="p-1.5 bg-green-900/30 rounded-lg">
                                <TrendingUp className="w-4 h-4 text-green-400" />
                              </div>
                              <span className="text-slate-300 text-sm">
                                Projected P&L
                              </span>
                            </div>
                            <div
                              className={`text-xl font-bold ${
                                approxPL >= 0
                                  ? "text-green-400"
                                  : "text-red-400"
                              }`}
                            >
                              {approxPL >= 0 ? "+" : ""}₹{approxPL.toFixed(2)}
                            </div>
                          </div>
                          <div className="bg-slate-700/30 rounded-lg p-4 border border-slate-600">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="p-1.5 bg-amber-900/30 rounded-lg">
                                <Shield className="w-4 h-4 text-amber-400" />
                              </div>
                              <span className="text-slate-300 text-sm">
                                Risk Level
                              </span>
                            </div>
                            <div
                              className={`text-lg font-semibold ${riskColor(
                                overallPlanRisk
                              )}`}
                            >
                              {overallPlanRisk}
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-6">
                      <div className="mb-5">
                        <TrendingUp className="w-16 h-16 text-slate-600 mx-auto mb-3" />
                        <h3 className="text-lg font-semibold text-slate-400 mb-1">
                          No Trading Plan
                        </h3>
                        <p className="text-slate-500">
                          Create your strategic trading plan for this date
                        </p>
                      </div>
                      <button
                        onClick={() => setEditMode(true)}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:from-indigo-500 hover:to-purple-500 transition-all duration-200 shadow-lg"
                      >
                        <Plus className="w-5 h-5" />
                        Create Trading Plan
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
