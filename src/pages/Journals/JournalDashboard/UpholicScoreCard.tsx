import React from "react";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip as RTTooltip,
} from "recharts";

interface AvgWinLoss { avgWin?: number; avgLoss?: number; }
interface Stats {
  tradeWinPercent?: number;
  dayWinPercent?: number;
  profitFactor?: number;
  avgWinLoss?: AvgWinLoss;
  upholicScore?: number;
}
interface SpiderDataItem { metric: string; value: number; }
interface UpholicScoreCardProps { stats: Stats; }

/* --- mobile detector (only affects <640px) --- */
function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = React.useState(false);
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const mql = window.matchMedia("(max-width: 639px)");
    const handler = (e: MediaQueryListEvent | MediaQueryList) =>
      setIsMobile("matches" in e ? e.matches : (e as MediaQueryList).matches);
    handler(mql);
    // add/remove with cross-browser safety
    // @ts-ignore
    mql.addEventListener ? mql.addEventListener("change", handler) : mql.addListener(handler);
    return () => {
      // @ts-ignore
      mql.removeEventListener ? mql.removeEventListener("change", handler) : mql.removeListener(handler);
    };
  }, []);
  return isMobile;
}

const UpholicScoreCard: React.FC<UpholicScoreCardProps> = ({ stats }) => {
  const spiderData: SpiderDataItem[] = [
    { metric: "Win %", value: stats.tradeWinPercent ?? 0 },
    { metric: "Profit factor", value: Math.min(100, (stats.profitFactor ?? 0) * 20) },
    {
      metric: "Avg win/loss",
      value: Math.max(
        0,
        Math.min(
          100,
          ((stats.avgWinLoss?.avgWin ?? 0) / Math.abs(stats.avgWinLoss?.avgLoss ?? 1)) * 50 + 50
        )
      ),
    },
    { metric: "Recovery factor", value: 80 },
    { metric: "Max drawdown", value: 50 },
    { metric: "Consistency", value: 64 },
  ];

  const upholicScore = stats.upholicScore ?? 0;

  // make radar “move” with score
  const scoreFactor = Math.max(0.4, Math.min(1, upholicScore / 100));
  const spiderDataAdjusted = spiderData.map(d => ({
    ...d,
    value: Math.max(0, Math.min(100, d.value * scoreFactor)),
  }));

  // breakdown pieces
  const base = 80 * 0.4; // 32
  const winC = (stats.tradeWinPercent ?? 0) * 0.3;
  const dayC = (stats.dayWinPercent ?? 0) * 0.3;
  const raw = base + winC + dayC;
  const capped = Math.min(100, Math.max(0, raw));

  const donutData = [
    { name: "Base (80×0.4)", value: base },
    { name: "Win% × 0.3", value: winC },
    { name: "Day Win% × 0.3", value: dayC },
  ];
  const donutTotal = donutData.reduce((s, d) => s + d.value, 0) || 1;
  const COLORS = ["#4b5563", "#22c55e", "#60a5fa"];

  /* ---------- MOBILE-ONLY size tweaks ---------- */
  const isMobile = useIsMobile();
  const RADAR_HEIGHT = isMobile ? 150 : 170;
  const RADAR_OUTER_RADIUS = isMobile ? 52 : 60;
  const DONUT_INNER = isMobile ? 16 : 20;
  const DONUT_OUTER = isMobile ? 26 : 30;
  const DONUT_HW_CLASS = isMobile ? "h-14 w-16" : "h-16 w-20";
  /* -------------------------------------------- */

  return (
    <div className="bg-[#0a0d13] rounded-md border border-[#202336] shadow-[0_8px_24px_rgba(0,0,0,0.25)] p-3 w-full text-white">
      {/* Header */}
      <div className="flex items-center mb-2">
        <span className="text-gray-300 font-medium text-xs tracking-wide uppercase">
          Upholic Score
        </span>
        <div
          className="ml-1 w-4 h-4 rounded-full border border-gray-400 flex items-center justify-center text-[10px] text-gray-400 cursor-help select-none"
          title="Combines your win %, day win %, and a base component"
        >
          i
        </div>
      </div>

      {/* Radar (unchanged on desktop; smaller only on mobile) */}
      <div className="mb-4" style={{ height: RADAR_HEIGHT }}>
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius={RADAR_OUTER_RADIUS} data={spiderDataAdjusted}>
            <PolarGrid gridType="polygon" stroke="#374151" />
            <PolarAngleAxis
              dataKey="metric"
              tick={{ fill: "#9CA3AF", fontSize: 10, fontWeight: 600 }}
              className="text-[10px]"
            />
            <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
            <Radar
              name="Score"
              dataKey="value"
              stroke="#8B5CF6"
              fill="#8B5CF6"
              fillOpacity={0.35}
              strokeWidth={1.4}
              isAnimationActive
              animationDuration={600}
              animationEasing="ease-out"
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Score + Breakdown: stacks on mobile, unchanged on desktop */}
      <div className="flex flex-col sm:flex-row items-start gap-3 mb-1">
        <div className="text-center sm:min-w-[120px]">
          <div className="text-gray-300">
            <span className="text-base font-bold">Your Upholic Score</span>
          </div>

          <div className="relative inline-block group">
            <div className="text-2xl font-extrabold text-white mt-1">
              {upholicScore.toFixed(2)}
            </div>
            {/* Hover card (kept desktop-only) */}
            <div className="absolute left-1/2 -translate-x-1/2 mt-2 hidden sm:block sm:opacity-0 sm:translate-y-1 sm:group-hover:opacity-100 sm:group-hover:translate-y-0 transition z-20">
              <div className="bg-[#11131b] border border-[#2a2f4a] rounded-md p-3 shadow-lg text-left w-64">
                <div className="text-[11px] text-gray-300 font-semibold mb-1">Breakdown</div>
                <div className="text-[11px] text-gray-400 space-y-1">
                  <div className="flex justify-between">
                    <span>Base (80 × 0.4)</span>
                    <span className="text-gray-200 font-semibold">{base.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Win% × 0.3</span>
                    <span className="text-gray-200 font-semibold">{winC.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Day Win% × 0.3</span>
                    <span className="text-gray-200 font-semibold">{dayC.toFixed(2)}</span>
                  </div>
                  <div className="border-t border-[#2a2f4a] my-1" />
                  <div className="flex justify-between">
                    <span>Raw total</span>
                    <span className="text-gray-200 font-semibold">{raw.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Capped [0–100]</span>
                    <span className="text-gray-200 font-semibold">{capped.toFixed(2)}</span>
                  </div>
                  <div className="text-[10px] text-gray-500 mt-1">Displayed score is rounded.</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Donut stays the same on desktop; shrinks only on mobile */}
        <div className="flex-1 w-full">
          <div className="flex items-center gap-2">
            <div className={DONUT_HW_CLASS}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={donutData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={DONUT_INNER}
                    outerRadius={DONUT_OUTER}
                    paddingAngle={2}
                    stroke="#0a0d13"
                    strokeWidth={1}
                  >
                    {donutData.map((_, idx) => (
                      <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </Pie>
                  <RTTooltip
                    contentStyle={{ backgroundColor: "#11131b", border: "1px solid #2a2f4a" }}
                    labelStyle={{ color: "#ffffff" }}
                    itemStyle={{ color: "#ffffff" }}
                    formatter={(value: any, name: any) => {
                      const v = Number(value);
                      const pct = ((v / donutTotal) * 100).toFixed(1) + "%";
                      return [`${v.toFixed(2)} (${pct})`, name as string];
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Legend unchanged on desktop; stays single column on mobile */}
            <div className="flex-1 grid grid-cols-1 gap-1 text-[11px]">
              {donutData.map((d, i) => {
                const pct = (d.value / donutTotal) * 100;
                const swatchStyle: React.CSSProperties = { backgroundColor: COLORS[i % COLORS.length] };
                return (
                  <div key={d.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="inline-block w-2 h-2 rounded-sm" style={swatchStyle} />
                      <span className="text-gray-300">{d.name}</span>
                    </div>
                    <div className="text-gray-200 font-semibold">
                      {d.value.toFixed(2)} <span className="text-gray-400">({pct.toFixed(1)}%)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar (unchanged) */}
      <div className="space-y-1">
        <div className="relative h-2 bg-[#2f3354] rounded-full overflow-hidden shadow-inner">
          <div
            className="absolute left-0 top-0 h-full rounded-full transition-all duration-500"
            style={{
              width: `${Math.min(100, Math.max(0, upholicScore))}%`,
              background: "linear-gradient(90deg, #ff6b6b 0%, #ffd93d 50%, #6bcf7f 100%)",
            }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-gray-400 px-0.5 select-none">
          <span>0</span><span>20</span><span>40</span><span>60</span><span>80</span><span>100</span>
        </div>
      </div>
    </div>
  );
};

export default UpholicScoreCard;
