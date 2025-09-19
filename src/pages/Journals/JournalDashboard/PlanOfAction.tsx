import React, { useMemo } from "react";

interface PlanOfActionProps {
  /** pass full stats so we can build realistic, orderbook-specific pointers */
  stats: any;
}

const fmt2 = (n: number) =>
  (Math.abs(n || 0)).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const inr = (n: number) => (n < 0 ? `-₹${fmt2(n)}` : `₹${fmt2(n)}`);
const pct = (n: number) => `${(n || 0).toFixed(0)}%`;

function toMins(hhmm?: string) {
  if (!hhmm || !/^\d{2}:\d{2}/.test(hhmm)) return null;
  const [h, m] = hhmm.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
}

const PlanOfAction: React.FC<PlanOfActionProps> = ({ stats }) => {
  const pointersTop5 = useMemo(() => {
    const out: { text: string; score: number; kind: "issue" | "better" | "good" }[] = [];

    const net = Number(stats?.netPnl ?? 0);
    const pf = Number(stats?.profitFactor ?? 0);
    const tw = Number(stats?.tradeWinPercent ?? 0); // %
    const avgWin = Number(stats?.avgWinLoss?.avgWin ?? 0);
    const avgLoss = Number(stats?.avgWinLoss?.avgLoss ?? 0);
    const rr = avgLoss ? avgWin / Math.abs(avgLoss) : 0;
    const fees = Number(stats?.totalsCheck?.chargesFromScrips ?? stats?.pairedTotals?.charges ?? 0);
    const trades: any[] = Array.isArray(stats?.trades) ? stats.trades : [];
    const tradeCount = trades.length;

    // per-trade aggregates
    let profitSum = 0, lossSum = 0, largestWin = 0, largestLoss = 0;
    let longPnL = 0, shortPnL = 0, longCount = 0, shortCount = 0;
    let holdWins = 0, holdLosses = 0, holdMinsWin = 0, holdMinsLoss = 0;
    let morningPnL = 0, afternoonPnL = 0;
    let maxLossStreak = 0, curLossStreak = 0;

    trades.forEach((t) => {
      const p = Number(t?.PnL ?? 0);
      const entryDir = t?.entry?.Direction;
      const entryTime = t?.entry?.Time as string | undefined;
      const hold = Number(t?.holdingMinutes ?? 0);

      if (p > 0) { profitSum += p; largestWin = Math.max(largestWin, p); holdWins++; holdMinsWin += hold; curLossStreak = 0; }
      else if (p < 0) { lossSum += Math.abs(p); largestLoss = Math.min(largestLoss, p); holdLosses++; holdMinsLoss += hold; curLossStreak++; maxLossStreak = Math.max(maxLossStreak, curLossStreak); }

      if (entryDir === "Buy") { longPnL += p; longCount++; }
      else if (entryDir === "Sell") { shortPnL += p; shortCount++; }

      const mins = toMins(entryTime);
      if (mins != null) {
        if (mins < 12 * 60) morningPnL += p;
        else afternoonPnL += p;
      }
    });

    const gross = profitSum + lossSum; // absolute
    const feesPctOfGross = gross ? (fees / gross) * 100 : 0;
    const avgHoldWin = holdWins ? holdMinsWin / holdWins : 0;
    const avgHoldLoss = holdLosses ? holdMinsLoss / holdLosses : 0;

    // scrip summary extremes
    const srows = (Array.isArray(stats?.scripSummary) ? stats.scripSummary.slice() : []) as Array<{
      symbol: string; netRealized: number; charges?: number; quantity?: number; avgBuy?: number; avgSell?: number;
    }>;
    let worst: any = null, best: any = null;
    if (srows.length) {
      srows.sort((a, b) => a.netRealized - b.netRealized);
      worst = srows[0];
      best = srows[srows.length - 1];
    }
    // concentration: share of top absolute contributor
    const absSum = srows.reduce((s, r) => s + Math.abs(r.netRealized || 0), 0);
    const topAbs = srows.length ? Math.max(...srows.map(r => Math.abs(r.netRealized || 0))) : 0;
    const concentration = absSum ? (topAbs / absSum) * 100 : 0;

    // === GOOD Pointers (what worked) ===
    if (net > 0) out.push({ text: `Positive session (+${inr(net)}).`, score: 8, kind: "good" });
    if (best && best.netRealized > 0) out.push({ text: `Led by ${best.symbol} with ${inr(best.netRealized)} realized P&L.`, score: 7, kind: "good" });
    if (rr >= 1.3 && tw >= 45) out.push({ text: `Healthy risk/reward (R ${rr.toFixed(2)}) with ${pct(tw)} hit-rate supported the edge.`, score: 6, kind: "good" });
    if (pf >= 1.3 && Number.isFinite(pf)) out.push({ text: `Profits outpaced losses (Profit Factor ${pf.toFixed(2)}).`, score: 5, kind: "good" });
    if (avgHoldLoss > 0 && avgHoldWin > 0 && avgHoldLoss < avgHoldWin * 0.9) {
      out.push({ text: `Winners held longer than losers (avg ${avgHoldWin.toFixed(0)}m vs ${avgHoldLoss.toFixed(0)}m) — strong discipline.`, score: 4, kind: "good" });
    }

    // === ISSUES (what went wrong) ===
    if (Number.isFinite(pf) && pf > 0 && pf < 1) {
      out.push({ text: `Losses exceeded profits (Profit Factor ${pf.toFixed(2)}).`, score: 10, kind: "issue" });
    } else if (Number.isFinite(pf) && pf >= 1 && pf < 1.15) {
      out.push({ text: `Thin edge (PF ${pf.toFixed(2)}): profits only slightly outpaced losses.`, score: 6, kind: "issue" });
    }
    if (largestLoss < 0 && Math.abs(largestLoss) > (largestWin || 0) * 1.5) {
      out.push({ text: `Asymmetry: largest loss ${inr(largestLoss)} > 1.5× largest win ${inr(largestWin)}.`, score: 8, kind: "issue" });
    }
    if (avgLoss && rr < 1) {
      out.push({ text: `Average winner ${inr(avgWin)} smaller than average loser ${inr(avgLoss)} (R ${rr.toFixed(2)}).`, score: 8, kind: "issue" });
    }
    if (tw > 0 && tw < 40) {
      out.push({ text: `Low hit-rate (${pct(tw)}).`, score: 7, kind: "issue" });
    }
    if (maxLossStreak >= 3) {
      out.push({ text: `Drawdown patch: ${maxLossStreak} losses in a row — risk bunched in a streak.`, score: 7, kind: "issue" });
    }
    if (fees > 0 && feesPctOfGross >= 18) {
      out.push({ text: `High fee drag: ${pct(feesPctOfGross)} of gross P&L (~${inr(fees)}) consumed by costs.`, score: 9, kind: "issue" });
    } else if (fees > 0 && feesPctOfGross >= 10) {
      out.push({ text: `Fees meaningful at ${pct(feesPctOfGross)} of gross (~${inr(fees)}).`, score: 6, kind: "issue" });
    }
    if (worst && worst.netRealized < 0) {
      out.push({ text: `Biggest drag: ${worst.symbol} with ${inr(worst.netRealized)} realized P&L.`, score: 7, kind: "issue" });
    }
    if (concentration >= 65) {
      out.push({ text: `PnL concentration: top symbol drove ${pct(concentration)} of absolute results — concentration risk.`, score: 6, kind: "issue" });
    }
    if (tradeCount >= 12) {
      out.push({ text: `High activity (${tradeCount} round-trips) — slippage/fees likely amplified.`, score: 5, kind: "issue" });
    }
    if (avgHoldLoss > avgHoldWin * 1.2) {
      out.push({ text: `Losses were held longer (avg ${avgHoldLoss.toFixed(0)}m) than winners (avg ${avgHoldWin.toFixed(0)}m).`, score: 7, kind: "issue" });
    }
    if (stats?.enteredTooSoonCount > 0) {
      out.push({ text: `Early entries flagged (${stats.enteredTooSoonCount}); first minutes impacted results.`, score: 5, kind: "issue" });
    }
    if (morningPnL < 0 && afternoonPnL > 0) {
      out.push({ text: `Morning drawdown (${inr(morningPnL)}), afternoon recovery (${inr(afternoonPnL)}).`, score: 4, kind: "issue" });
    } else if (morningPnL > 0 && afternoonPnL < 0) {
      out.push({ text: `Gave back gains in afternoon: +${inr(morningPnL)} → ${inr(afternoonPnL)}.`, score: 4, kind: "issue" });
    }
    if (longCount + shortCount > 0) {
      const longEdge = longCount ? longPnL / longCount : 0;
      const shortEdge = shortCount ? shortPnL / shortCount : 0;
      if (longEdge > 0 && shortEdge < 0) {
        out.push({ text: `Longs worked (+${inr(longPnL)}), shorts dragged (${inr(shortPnL)}).`, score: 5, kind: "issue" });
      } else if (shortEdge > 0 && longEdge < 0) {
        out.push({ text: `Shorts worked (+${inr(shortPnL)}), longs dragged (${inr(longPnL)}).`, score: 5, kind: "issue" });
      }
    }
    const openPositions = Array.isArray(stats?.openPositions) ? stats.openPositions : [];
    if (openPositions.length > 0) {
      const legText = openPositions.map((p: any) => `${p.symbol} ${p.side} ${p.quantity}`).slice(0, 3).join(", ");
      out.push({ text: `Open exposure remains (${openPositions.length}): ${legText}${openPositions.length > 3 ? "…" : ""}.`, score: 6, kind: "issue" });
    }

    // === BETTER (optimization pointers even on green days) ===
    if (pf >= 1 && pf < 1.3) {
      out.push({ text: `Edge present but slim (PF ${pf.toFixed(2)}): tighten losers or let winners extend.`, score: 5, kind: "better" });
    }
    if (rr >= 0.8 && rr < 1.3) {
      out.push({ text: `Improve R: winners ${inr(avgWin)} vs losers ${inr(avgLoss)} (R ${rr.toFixed(2)}).`, score: 5, kind: "better" });
    }
    if (tradeCount > 0 && srows.length >= 4 && concentration < 35) {
      out.push({ text: `Wide symbol spread (${srows.length}) — consider focusing on best 2–3 performers.`, score: 4, kind: "better" });
    }
    if (best && best.netRealized > 0 && worst && worst.netRealized < 0) {
      out.push({ text: `Hold winners like ${best.symbol} longer; cut laggards like ${worst.symbol} earlier.`, score: 4, kind: "better" });
    }
    if (avgHoldWin > 0 && avgHoldWin < 8) {
      out.push({ text: `Very quick profit taking (avg win hold ${avgHoldWin.toFixed(0)}m) — consider scaling out instead of full exits.`, score: 3, kind: "better" });
    }

    // Rank: prefer issues with highest severity, then better, then good
    const ranked = out
      .sort((a, b) =>
        // kind priority: issue > better > good
        (b.kind === "issue" ? 1000 : b.kind === "better" ? 500 : 0) + b.score -
        ((a.kind === "issue" ? 1000 : a.kind === "better" ? 500 : 0) + a.score)
      )
      // dedupe identical texts (just in case)
      .filter((p, i, arr) => arr.findIndex(q => q.text === p.text) === i);

    // Always ensure we have a mix: try to include at least 1 "good", 2 "issue", 2 "better" if available
    const issues = ranked.filter(r => r.kind === "issue").slice(0, 3);
    const better = ranked.filter(r => r.kind === "better").slice(0, 3);
    const good   = ranked.filter(r => r.kind === "good").slice(0, 3);

    const bucketed: string[] = [];
    // pick 2 issues, 2 better, 1 good by default
    issues.slice(0, 2).forEach(p => bucketed.push(p.text));
    better.slice(0, 2).forEach(p => bucketed.push(p.text));
    if (good.length) bucketed.push(good[0].text);

    // if we still have <5, fill from remaining ranked any-kind
    for (const r of ranked) {
      if (bucketed.length >= 5) break;
      if (!bucketed.includes(r.text)) bucketed.push(r.text);
    }

    return bucketed.slice(0, 5);
  }, [stats]);

  return (
    <>
      <style>
        {`
          .glass-card { background:#0a0d13; border:1px solid rgba(75,85,99,.2); }
          .trading-glow { box-shadow:0 0 12px rgba(59,130,246,.10),0 2px 10px rgba(0,0,0,.2); }
          .action-card { background:#121212; border:1px solid rgba(75,85,99,.19); }
        `}
      </style>

      <div className="glass-card rounded-lg trading-glow p-3 h-full w-full">
        {/* Header */}
        <div className="flex items-center gap-2 mb-3">
          <div className="w-1 h-6 bg-gradient-to-b from-rose-400 via-amber-400 to-yellow-400 rounded-full" />
          <div className="flex flex-col">
            <h3 className="text-base font-bold text-transparent bg-clip-text bg-gradient-to-r from-rose-300 via-amber-300 to-yellow-300">
              What went wrong & what could be better
            </h3>
            <div className="text-[10px] text-gray-400 text-left font-mono tracking-wider uppercase">
              Orderbook Summary
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="space-y-2 text-left">
          {pointersTop5.map((p, i) => (
            <div key={i} className="action-card rounded p-3 text-xs text-gray-200">
              <span className="text-gray-400 mr-1">#{i + 1}</span>
              {p}
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default PlanOfAction;
