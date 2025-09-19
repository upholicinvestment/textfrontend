import React, { useEffect, useMemo, useState, JSX } from "react";
import { api, API_BASE, getUserId } from "../../../api";

/* ================= UserId Sync Hook ================= */
function useSyncedUserId() {
  const [userId, setUserId] = useState<string | null>(getUserId() || null);

  useEffect(() => {
    const sync = () => setUserId(getUserId() || null);
    window.addEventListener("storage", sync);
    const id = setInterval(sync, 1000);
    return () => {
      window.removeEventListener("storage", sync);
      clearInterval(id);
    };
  }, []);

  return userId;
}

/* ================= Types ================= */
type DayCell = {
  tradingDate: string;
  tradeCount: number;
  netPnl: number;
  winRate: number;
  profitFactor: number;
  bestTradePnl: number;
};
type MonthSummary = {
  totalTrades: number;
  netPnl: number;
  winRate: number; // 0..1 (trade-level win-rate from backend)
  profitFactor: number; // trade-level PF from backend (Infinity if GL=0 & GP>0)
  bestDay: { date: string | null; netPnl: number };
};
type MonthResponse = { days: DayCell[]; monthSummary: MonthSummary };

type Snapshot = {
  tradingDate: string;
  tradeCount: number;
  netPnl: number;
  grossProfit: number;
  grossLoss: number;
  wins: number;
  losses: number;
  winRate: number;
  profitFactor: number;
  bestTradePnl: number;
  worstTradePnl: number;
  fees?: number;
};
type DayResponse = { snapshot: Snapshot | null; executedLegs: unknown[] };

/* ================= Helpers ================= */
const INR = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});
const pad2 = (n: number) => String(n).padStart(2, "0");
const todayISO = () => new Date().toISOString().slice(0, 10);

function buildMonthMatrix(year: number, month1to12: number): (string | null)[][] {
  const first = new Date(Date.UTC(year, month1to12 - 1, 1));
  const startDay = (first.getUTCDay() + 6) % 7; // Mon=0
  const daysInMonth = new Date(Date.UTC(year, month1to12, 0)).getUTCDate();
  const cells: Array<string | null> = [];
  for (let i = 0; i < startDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++)
    cells.push(`${year}-${pad2(month1to12)}-${pad2(d)}`);
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks: (string | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}
// Replace your pct helper with this:
const pct = (x: number | null | undefined, dp = 2) =>
  x == null || !Number.isFinite(Number(x))
    ? "—"
    : `${(Number(x) * 100).toFixed(dp)}%`;

const pf = (x: number | null | undefined) =>
  x === Infinity ? "∞" : x == null ? "—" : Number.isFinite(x) ? x.toFixed(2) : "—";
const money = (x: number | null | undefined) =>
  x == null ? "—" : INR.format(Number(x));

function pnlShadeClass(net: number | null): string {
  if (net == null) return "bg-slate-700/50";
  if (net > 0) {
    if (net > 10000) return "bg-[#16a34a]";
    if (net > 5000) return "bg-[#22c55e]";
    if (net > 2000) return "bg-[#34d399]";
    if (net > 500) return "bg-[#4ade80]";
    return "bg-[#86efac]";
  }
  if (net < 0) {
    if (net < -10000) return "bg-[#dc2626]";
    if (net < -5000) return "bg-[#ef4444]";
    if (net < -2000) return "bg-[#f43f5e]";
    if (net < -500) return "bg-[#fb7185]";
    return "bg-[#fecaca]";
  }
  return "bg-[#94a3b8]";
}

const inRange = (dateISO: string, fromISO?: string, toISO?: string) => {
  if (!fromISO && !toISO) return true;
  if (fromISO && dateISO < fromISO) return false;
  if (toISO && dateISO > toISO) return false;
  return true;
};

function monthsBetweenInclusive(fromISO: string, toISO: string): Array<{year:number;month:number}> {
  const [fy, fm] = fromISO.split("-").map(Number);
  const [ty, tm] = toISO.split("-").map(Number);
  const out: Array<{year:number;month:number}> = [];
  if (!Number.isFinite(fy) || !Number.isFinite(fm) || !Number.isFinite(ty) || !Number.isFinite(tm)) return out;
  let y = fy, m = fm;
  while (y < ty || (y === ty && m <= tm)) {
    out.push({year:y, month:m});
    m++;
    if (m > 12) { m = 1; y++; }
  }
  return out;
}

/* ================= Data hooks ================= */
function useMonthData(year: number, month1to12: number, userId: string | null) {
  const [state, setState] = useState<{
    loading: boolean;
    days: DayCell[];
    summary: MonthSummary | null;
    error: string | null;
  }>({ loading: true, days: [], summary: null, error: null });

  useEffect(() => {
    let aborted = false;
    (async () => {
      setState((s) => ({ ...s, loading: true, error: null }));
      try {
        const { data } = await api.get<MonthResponse>(`${API_BASE}/trade-calendar/month`, {
          params: { year, month: month1to12, userId: userId || undefined },
        });
        if (!aborted) {
          setState({
            loading: false,
            days: data?.days ?? [],
            summary: data?.monthSummary ?? null,
            error: null,
          });
        }
      } catch (e) {
        if (!aborted)
          setState({
            loading: false,
            days: [],
            summary: null,
            error: (e as Error).message,
          });
      }
    })();
    return () => {
      aborted = true;
    };
  }, [year, month1to12, userId]);

  return state;
}

function useManyMonthsData(
  months: Array<{ year: number; month: number; active: boolean }>,
  userId: string | null
) {
  const [loading, setLoading] = useState<boolean>(true);
  const [byMonth, setByMonth] = useState<Map<string, DayCell[]>>(new Map());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let aborted = false;
    (async () => {
      setLoading(true);
      setError(null);

      const actives = months.filter((m) => m.active);
      if (actives.length === 0) {
        setByMonth(new Map());
        setLoading(false);
        return;
      }

      try {
        const results = await Promise.all(
          actives.map(async (m) => {
            const { data } = await api.get<MonthResponse>(`${API_BASE}/trade-calendar/month`, {
              params: { year: m.year, month: m.month, userId: userId || undefined },
            });
            return { key: `${m.year}-${pad2(m.month)}`, days: data.days };
          })
        );

        const map = new Map<string, DayCell[]>();
        results.forEach((r) => map.set(r.key, r.days));
        setByMonth(map);
      } catch (e) {
        setError((e as Error).message);
      } finally {
        if (!aborted) setLoading(false);
      }
    })();
    return () => {
      aborted = true;
    };
  }, [JSON.stringify(months), userId]);

  return { loading, byMonth, error };
}

/* ================= UI ================= */
type FilterMode = "months" | "range";

export default function TradeCalendar(): JSX.Element {
  const now = new Date();
  const userId = useSyncedUserId();

  const [year, setYear] = useState<number>(now.getFullYear());
  const [month, setMonth] = useState<number>(now.getMonth() + 1); // 1..12

  // ---- Month mode state ----
  const [customYear, setCustomYear] = useState<number>(now.getFullYear());
  const [customMonths, setCustomMonths] = useState<Set<number>>(
    new Set<number>([now.getMonth() + 1])
  );

  // ---- Date range mode state ----
  const [fromISO, setFromISO] = useState<string>("");
  const [toISO, setToISO] = useState<string>("");

  // tabs
  const [mode, setMode] = useState<FilterMode>("months");

  const [openDay, setOpenDay] = useState<string | null>(null);

  // which months should we LOAD based on the active mode?
  const selectedMonths = useMemo(() => {
    if (mode === "range" && fromISO && toISO) {
      const spans = monthsBetweenInclusive(fromISO, toISO);
      return spans.map(({year, month}) => ({ year, month, active: true }));
    }
    // month mode
    return Array.from({ length: 12 }, (_, i) => {
      const m = i + 1;
      return { year: customYear, month: m, active: customMonths.has(m) };
    });
  }, [mode, fromISO, toISO, customYear, customMonths]);

  const monthsForHeat = useMemo(() => {
    return selectedMonths.map(({year, month}) => ({
      year,
      month,
      active: true,
      label: new Date(Date.UTC(year, month - 1, 1)).toLocaleString("en-IN", {
        month: "short",
        timeZone: "UTC",
      }),
    }));
  }, [selectedMonths]);

  // single-month grid or multi heatmap?
  const singleMonthYear = useMemo(() => {
    const actives = selectedMonths.filter(m => m.active);
    if (actives.length === 1) return { y: actives[0].year, m: actives[0].month };
    return null;
  }, [selectedMonths]);

  const single = useMonthData(
    singleMonthYear ? singleMonthYear.y : year,
    singleMonthYear ? singleMonthYear.m : month,
    userId
  );
  const multi = useManyMonthsData(selectedMonths, userId);

  const usingSingleView = !!singleMonthYear;
  const loading = usingSingleView ? single.loading : multi.loading;
  const error = usingSingleView ? single.error : multi.error;

  /* ---- Header Title ---- */
  function usingSingleMonthYearTitle(
    single: { y: number; m: number } | null,
    fallbackY: number,
    fallbackM: number
  ) {
    const y = single ? single.y : fallbackY;
    const m = single ? single.m : fallbackM;
    return `${new Date(Date.UTC(y, m - 1, 1)).toLocaleString("en-IN", {
      month: "long",
      timeZone: "UTC",
    })} ${y}`;
  }
  function rangeTitle(from: string, to: string) {
    const fmt = (iso: string) =>
      new Date(iso).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });
    return `${fmt(from)} → ${fmt(to)}`;
  }
  const headerTitle =
    mode === "range" && fromISO && toISO
      ? rangeTitle(fromISO, toISO)
      : usingSingleMonthYearTitle(singleMonthYear, year, month);

  // source days (then apply the active mode’s filter)
  const filteredDays: DayCell[] = useMemo(() => {
    const allDays = usingSingleView ? (single.days || []) : Array.from(multi.byMonth.values()).flat();
    if (mode === "range" && fromISO && toISO) {
      return allDays.filter(d => inRange(d.tradingDate, fromISO, toISO));
    }
    return allDays; // months mode already constrained by selectedMonths
  }, [usingSingleView, single.days, multi.byMonth, mode, fromISO, toISO]);

  // group for heatmap
  const filteredByMonthMap = useMemo(() => {
    const map = new Map<string, DayCell[]>();
    for (const d of filteredDays) {
      const [y, m] = d.tradingDate.split("-").map(Number);
      const key = `${y}-${pad2(m)}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(d);
    }
    return map;
  }, [filteredDays]);

  // ---- Summary (uses backend monthSummary when single month is selected) ----
  const summaryLocal = useMemo(() => {
    // Prefer backend summary for single-month view to match dashboard PF/win-rate
    if (mode === "months" && usingSingleView && single.summary) {
      let best = { date: null as string | null, netPnl: 0 };
      let worst = { date: null as string | null, netPnl: 0 };
      if (filteredDays.length) {
        best = { date: filteredDays[0].tradingDate, netPnl: filteredDays[0].netPnl };
        worst = { date: filteredDays[0].tradingDate, netPnl: filteredDays[0].netPnl };
        for (const d of filteredDays) {
          if (d.netPnl > best.netPnl) best = { date: d.tradingDate, netPnl: d.netPnl };
          if (d.netPnl < worst.netPnl) worst = { date: d.tradingDate, netPnl: d.netPnl };
        }
      }
      return {
        totalTrades: single.summary.totalTrades,
        netPnl: single.summary.netPnl,
        winRate: single.summary.winRate,
        profitFactor: single.summary.profitFactor,
        bestDay: best,
        worstDay: worst,
      };
    }

    // Fallback for multi-month/range (approx via day nets)
    if (!filteredDays.length) {
      return {
        totalTrades: 0,
        netPnl: 0,
        winRate: 0,
        profitFactor: 0,
        bestDay: { date: null, netPnl: 0 },
        worstDay: { date: null, netPnl: 0 },
      };
    }
    let totalTrades = 0, netPnl = 0, gp = 0, gl = 0;
    let tradedDays = 0, positiveDays = 0;
    let best = { date: filteredDays[0].tradingDate, netPnl: filteredDays[0].netPnl };
    let worst = { date: filteredDays[0].tradingDate, netPnl: filteredDays[0].netPnl };

    for (const d of filteredDays) {
      totalTrades += d.tradeCount || 0;
      netPnl += d.netPnl || 0;
      if (d.tradeCount > 0) {
        tradedDays += 1;
        if (d.netPnl > 0) positiveDays += 1;
      }
      if ((d.netPnl || 0) > 0) gp += d.netPnl;
      if ((d.netPnl || 0) < 0) gl += Math.abs(d.netPnl);
      if (d.netPnl > best.netPnl) best = { date: d.tradingDate, netPnl: d.netPnl };
      if (d.netPnl < worst.netPnl) worst = { date: d.tradingDate, netPnl: d.netPnl };
    }
    const winRate = tradedDays ? positiveDays / tradedDays : 0;
    const profitFactor = gl ? gp / gl : gp > 0 ? Infinity : 0;

    return {
      totalTrades,
      netPnl: Math.round(netPnl * 100) / 100,
      winRate,
      profitFactor,
      bestDay: best,
      worstDay: worst,
    };
  }, [mode, usingSingleView, single.summary, filteredDays]);

  const gotoPrev = () => {
    const nm = month - 1;
    if (nm < 1) {
      setMonth(12);
      setYear((y) => y - 1);
      setCustomYear((y) => y - 1);
    } else setMonth(nm);
  };
  const gotoNext = () => {
    const nm = month + 1;
    if (nm > 12) {
      setMonth(1);
      setYear((y) => y + 1);
      setCustomYear((y) => y + 1);
    } else setMonth(nm);
  };

  const fmtHoverDate = (iso: string | null) =>
    iso
      ? new Date(iso).toLocaleDateString("en-IN", {
          weekday: "short",
          year: "numeric",
          month: "short",
          day: "numeric",
        })
      : "";

  const clearRange = () => {
    setFromISO("");
    setToISO("");
    setMode("months");
  };

  return (
    <div className="min-h-screen bg-[#0b1020] text-slate-200">
      <div className="px-4 py-6 sm:px-8 md:px-12">
        {/* Header + (months-only) controls */}
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold">{headerTitle}</h1>
            <p className="text-sm text-slate-400">
              Trade Calendar — {usingSingleView ? "frozen daily snapshots" : "heat-map view"} from your uploaded orderbooks
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {mode === "months" && (
              <>
                {/* Prev / Today / Next */}
                <div className="inline-flex items-center gap-2 whitespace-nowrap">
                  <Btn onClick={gotoPrev} variant="ghost">Prev</Btn>
                  <Btn
                    onClick={() => {
                      const n = new Date();
                      setYear(n.getFullYear());
                      setMonth(n.getMonth() + 1);
                      setCustomYear(n.getFullYear());
                      setCustomMonths(new Set([n.getMonth() + 1]));
                    }}
                    variant="primary"
                  >
                    Today
                  </Btn>
                  <Btn onClick={gotoNext} variant="ghost">Next</Btn>
                </div>

                {/* Year switch */}
                <div className="flex items-center gap-2 flex-wrap">
                  <Btn variant="ghost" onClick={() => setCustomYear((y) => y - 1)}>
                    ⟵ {customYear - 1}
                  </Btn>
                  <div className="px-3 py-2 rounded-md bg-white/10 border border-white/10">
                    {customYear}
                  </div>
                  <Btn variant="ghost" onClick={() => setCustomYear((y) => y + 1)}>
                    {customYear + 1} ⟶
                  </Btn>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Tabs: Months | Date Range */}
        <div className="inline-flex rounded-lg border border-white/10 overflow-hidden mb-4">
          <button
            className={`px-3 py-2 text-sm ${mode === "months" ? "bg-white/15" : "bg-white/5 hover:bg-white/10"}`}
            onClick={() => setMode("months")}
          >
            Months
          </button>
          <button
            className={`px-3 py-2 text-sm ${mode === "range" ? "bg-white/15" : "bg-white/5 hover:bg-white/10"}`}
            onClick={() => setMode("range")}
          >
            Date Range
          </button>
        </div>

        {/* MONTHS TAB */}
        {mode === "months" && (
          <>
            {/* If a range exists, show a banner explaining it's ignored here until cleared */}
            {(fromISO && toISO) && (
              <div className="mb-3 flex items-center justify-between rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm">
                <span className="text-slate-300">
                  Date range set ({new Date(fromISO).toLocaleDateString("en-IN")} → {new Date(toISO).toLocaleDateString("en-IN")}).  
                  Months tab ignores this until you clear it.
                </span>
                <Btn variant="ghost" onClick={clearRange}>Clear Range</Btn>
              </div>
            )}

            {/* Month chips */}
            <div className="mb-4 rounded-xl border border-white/10 p-3 bg-white/5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                <div className="text-sm text-slate-300">
                  Pick months (active: <span className="font-semibold">{customMonths.size}</span>)
                </div>
                <div className="flex items-center gap-2 overflow-x-auto whitespace-nowrap no-scrollbar">
                  <MiniBtn
                    onClick={() => {
                      const n = new Date();
                      setCustomMonths(new Set([n.getMonth() + 1]));
                      setCustomYear(n.getFullYear());
                    }}
                  >
                    This M
                  </MiniBtn>
                  <MiniBtn onClick={() => setCustomMonths(new Set())}>Clear</MiniBtn>
                  <MiniBtn
                    onClick={() =>
                      setCustomMonths(new Set([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]))
                    }
                  >
                    All
                  </MiniBtn>
                  <MiniBtn onClick={() => setCustomMonths(new Set([1, 2, 3]))}>Q1</MiniBtn>
                  <MiniBtn onClick={() => setCustomMonths(new Set([4, 5, 6]))}>Q2</MiniBtn>
                  <MiniBtn onClick={() => setCustomMonths(new Set([7, 8, 9]))}>Q3</MiniBtn>
                  <MiniBtn onClick={() => setCustomMonths(new Set([10, 11, 12]))}>Q4</MiniBtn>
                </div>
              </div>
              <MonthChipGrid
                year={customYear}
                selected={customMonths}
                onToggle={(m) => {
                  const next = new Set(customMonths);
                  if (next.has(m)) next.delete(m);
                  else next.add(m);
                  setCustomMonths(next);
                }}
              />
            </div>
          </>
        )}

        {/* DATE RANGE TAB */}
        {mode === "range" && (
          <div className="mb-4 rounded-xl border border-white/10 p-3 bg-white/5">
            <div className="flex items-center gap-2 flex-wrap">
              <input
                type="date"
                value={fromISO}
                onChange={(e) => setFromISO(e.target.value)}
                className="rounded-md px-2 py-1.5 text-sm bg-white/10 border border-white/10 focus:outline-none focus:ring-1 focus:ring-white/30"
                placeholder="dd-mm-yyyy"
              />
              <span className="text-slate-400">to</span>
              <input
                type="date"
                value={toISO}
                onChange={(e) => setToISO(e.target.value)}
                className="rounded-md px-2 py-1.5 text-sm bg-white/10 border border-white/10 focus:outline-none focus:ring-1 focus:ring-white/30"
                placeholder="dd-mm-yyyy"
              />
              <Btn
                variant="primary"
                onClick={() => {
                  // no-op: Apply keeps us in range mode; data already reacts to fromISO/toISO
                }}
              >
                Apply
              </Btn>
            </div>
            <div className="mt-2 text-xs text-slate-400">
              Tip: go to the <b>Months</b> tab to clear the range or use month chips.
            </div>
          </div>
        )}

        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-6">
          <StatCard label="Total Trades" value={String(summaryLocal.totalTrades)} />
          <StatCard
            label="Net P&L"
            value={money(summaryLocal.netPnl)}
            highlight={summaryLocal.netPnl > 0}
          />
          <StatCard label="Win Rate" value={pct(summaryLocal.winRate)} />
          <StatCard label="Profit Factor" value={pf(summaryLocal.profitFactor)} />
          <StatCard
            label="Best Day"
            value={money(summaryLocal.bestDay.netPnl)}
            title={summaryLocal.bestDay.date ? `Date: ${fmtHoverDate(summaryLocal.bestDay.date)}` : undefined}
          />
          <StatCard
            label="Worst Day"
            value={money(summaryLocal.worstDay.netPnl)}
            title={summaryLocal.worstDay.date ? `Date: ${fmtHoverDate(summaryLocal.worstDay.date)}` : undefined}
          />
        </div>

        {/* Calendar area */}
        {loading ? (
          <div className="p-10 text-center text-slate-400">Loading…</div>
        ) : error ? (
          <div className="p-10 text-center text-rose-400">Failed to load: {error}</div>
        ) : singleMonthYear ? (
          <SingleMonthGrid
            year={singleMonthYear.y}
            month1to12={singleMonthYear.m}
            days={filteredDays}
            onPickDay={setOpenDay}
          />
        ) : (
          <YearHeatMap months={monthsForHeat} byMonth={filteredByMonthMap} onPickDay={setOpenDay} />
        )}
      </div>

      {/* Day Drawer — Performance Overview ONLY */}
      <DayDrawer open={!!openDay} onClose={() => setOpenDay(null)} dateISO={openDay} userId={userId} />
    </div>
  );
}

/* -------- Single month view -------- */
function SingleMonthGrid({
  year,
  month1to12,
  days,
  onPickDay,
}: {
  year: number;
  month1to12: number;
  days: DayCell[];
  onPickDay: (d: string | null) => void;
}) {
  const dayMap = useMemo(() => {
    const m = new Map<string, DayCell>();
    days.forEach((d) => m.set(d.tradingDate, d));
    return m;
  }, [days]);
  const weeks = useMemo(() => buildMonthMatrix(year, month1to12), [year, month1to12]);

  return (
    <div className="rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
      <div className="hidden sm:grid grid-cols-7 bg-white/5 text-xs uppercase tracking-wide text-slate-300">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
          <div key={d} className="px-2 py-2 text-center">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-rows-6">
        {weeks.map((row, i) => (
          <div key={i} className="grid grid-cols-7 border-t border-white/5">
            {row.map((date, j) => {
              const dObj = date ? dayMap.get(date) : undefined;
              const net = dObj?.netPnl ?? null;
              const trades = dObj?.tradeCount ?? 0;
              const isToday = date === todayISO();
              const shade = pnlShadeClass(net);
              const clickable = !!dObj;
              return (
                <button
                  key={`${i}-${j}`}
                  disabled={!clickable}
                  onClick={() => clickable && onPickDay(date!)}
                  title={
                    dObj && date ? `${date} • Trades: ${trades} • P&L: ${money(net)}` : ""
                  }
                  className={
                    "relative h-16 sm:h-24 md:h-28 p-2 text-left border-l border-white/5 " +
                    (clickable
                      ? "hover:ring-1 hover:ring-white/20 focus:outline-none"
                      : "bg-black/10 cursor-not-allowed")
                  }
                >
                  {date && (
                    <>
                      <div className={`absolute inset-1 rounded-md ${shade} opacity-95`} />
                      <div className="relative z-10 hidden sm:block">
                        <div
                          className={
                            "text-xs mb-1 " +
                            (isToday ? "font-bold text-white" : "text-white/90")
                          }
                        >
                          {Number(date.slice(-2))}
                        </div>
                        {dObj && (
                          <>
                            <div className="absolute top-2 right-2">
                              <span className="px-2 py-0.5 rounded-full text-[10px] text-white/95 bg-black/20 backdrop-blur">
                                {money(net)}
                              </span>
                            </div>
                            <div className="mt-8">
                              <div className="text-[11px] text-white/80">Trades</div>
                              <div className="text-base font-semibold text-white">
                                {trades || 0}
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

/* -------- Year heat-map -------- */
function YearHeatMap({
  months,
  byMonth,
  onPickDay,
}: {
  months: Array<{ year: number; month: number; active: boolean; label: string }>;
  byMonth: Map<string, DayCell[]>;
  onPickDay: (date: string | null) => void;
}) {
  const perDate = useMemo(() => {
    const m = new Map<string, DayCell>();
    for (const [, arr] of byMonth.entries()) {
      arr.forEach((d) => m.set(d.tradingDate, d));
    }
    return m;
  }, [byMonth]);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {months.map(({ year, month, active, label }) => {
        const weeks = buildMonthMatrix(year, month);
        return (
          <div
            key={`${year}-${month}`}
            className={
              "rounded-xl border p-3 " +
              (active ? "border-white/10 bg-white/5" : "border-white/5 bg-black/20 opacity-50")
            }
          >
            <div className="text-xs font-semibold text-slate-300 mb-2">{label}</div>
            <div className="grid grid-rows-6 gap-1">
              {weeks.map((row, i) => (
                <div key={i} className="grid grid-cols-7 gap-1">
                  {row.map((date, j) => {
                    const d = date ? perDate.get(date) : undefined;
                    const net = d?.netPnl ?? null;
                    const has = !!d && active;
                    const shade = pnlShadeClass(net);
                    return (
                      <div
                        key={`${i}-${j}`}
                        className={`h-3.5 sm:h-4 w-full rounded ${
                          has ? shade : "bg-slate-700/40"
                        } ${has ? "cursor-pointer" : "cursor-default"}`}
                        title={
                          has ? `${date} • Trades: ${d?.tradeCount ?? 0} • P&L: ${money(net)}` : ""
                        }
                        onClick={() => has && onPickDay(date!)}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* -------- Day Drawer -------- */
function DayDrawer({
  open,
  onClose,
  dateISO,
  userId,
}: {
  open: boolean;
  onClose: () => void;
  dateISO: string | null;
  userId: string | null;
}) {
  const [state, setState] = useState<{
    loading: boolean;
    snapshot: Snapshot | null;
    error: string | null;
  }>({ loading: false, snapshot: null, error: null });

  useEffect(() => {
    if (!open || !dateISO) return;
    let aborted = false;
    (async () => {
      setState({ loading: true, snapshot: null, error: null });
      try {
        const { data } = await api.get<DayResponse>(`${API_BASE}/trade-calendar/day/${dateISO}`, {
          params: { userId: userId || undefined },
        });
        if (!aborted)
          setState({ loading: false, snapshot: data.snapshot ?? null, error: null });
      } catch (e) {
        if (!aborted)
          setState({
            loading: false,
            snapshot: null,
            error: (e as Error).message,
          });
      }
    })();
    return () => {
      aborted = true;
    };
  }, [open, dateISO, userId]);

  return (
    <div
      className={
        "fixed inset-0 z-50 transition " +
        (open ? "pointer-events-auto" : "pointer-events-none")
      }
      aria-hidden={!open}
    >
      <div
        className={
          "absolute inset-0 bg-black/60 transition-opacity " +
          (open ? "opacity-100" : "opacity-0")
        }
        onClick={onClose}
      />
      <div
        className={
          "absolute right-0 top-0 h-full w-full sm:w-[560px] bg-[#0b1020] border-l border-white/10 shadow-2xl transition-transform duration-300 " +
          (open ? "translate-x-0" : "translate-x-full")
        }
      >
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400">Day details</div>
            <div className="text-lg font-semibold">
              {dateISO
                ? new Date(dateISO).toLocaleDateString("en-IN", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })
                : "—"}
            </div>
          </div>
          <Btn onClick={onClose} variant="ghost">
            Close
          </Btn>
        </div>

        {state.loading ? (
          <div className="p-6 text-slate-400">Loading…</div>
        ) : !state.snapshot ? (
          <div className="p-6 text-slate-400">No snapshot for this day.</div>
        ) : (
          <div className="p-4 space-y-6 overflow-auto h-[calc(100%-56px)]">
            <div className="grid grid-cols-2 gap-3">
              <StatCard label="Net P&L" value={money(state.snapshot.netPnl)} />
              <StatCard label="Trades" value={String(state.snapshot.tradeCount)} />
              <StatCard label="Trade Win Rate" value={pct(state.snapshot.winRate)} />
              <StatCard label="Profit Factor" value={pf(state.snapshot.profitFactor)} />
              <StatCard label="Gross Profit" value={money(state.snapshot.grossProfit)} />
              <StatCard label="Gross Loss" value={money(state.snapshot.grossLoss)} />
              <StatCard label="Best Trade" value={money(state.snapshot.bestTradePnl)} />
              <StatCard label="Worst Trade" value={money(state.snapshot.worstTradePnl)} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* -------- atoms -------- */
function StatCard({
  label,
  value,
  highlight,
  title,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  title?: string;
}) {
  return (
    <div
      title={title}
      className={
        "rounded-xl border px-4 py-3 backdrop-blur " +
        (highlight ? "border-emerald-400/30 bg-emerald-500/10" : "border-white/10 bg-white/5")
      }
    >
      <div className="text-xs text-slate-400 mb-1">{label}</div>
      <div className="text-lg font-semibold">{value}</div>
    </div>
  );
}
function Btn({
  onClick,
  children,
  variant = "primary",
}: {
  onClick: () => void;
  children: React.ReactNode;
  variant?: "primary" | "ghost";
}) {
  const base = "px-3 py-2 rounded-md font-semibold transition";
  const cls =
    variant === "primary"
      ? "bg-white/10 hover:bg-white/15 border border-white/10"
      : "bg-transparent hover:bg-white/5 border border-white/10";
  return (
    <button onClick={onClick} className={`${base} ${cls}`}>
      {children}
    </button>
  );
}
function MiniBtn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="px-2 py-1 text-xs rounded-md bg-white/10 hover:bg-white/15 border border-white/10"
    >
      {children}
    </button>
  );
}
function MonthChipGrid({
  year,
  selected,
  onToggle,
}: {
  year: number;
  selected: Set<number>;
  onToggle: (month1to12: number) => void;
}) {
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const labels = months.map((m) =>
    new Date(Date.UTC(year, m - 1, 1)).toLocaleString("en-IN", {
      month: "short",
      timeZone: "UTC",
    })
  );
  return (
    <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
      {months.map((m, idx) => {
        const active = selected.has(m);
        return (
          <button
            key={m}
            onClick={() => onToggle(m)}
            className={`px-2 py-1.5 rounded-md text-sm border transition min-w-[68px] ${
              active
                ? "bg-white/20 border-white/30"
                : "bg-white/5 hover:bg-white/10 border-white/10 text-slate-300"
            }`}
          >
            {labels[idx]}
          </button>
        );
      })}
    </div>
  );
}
