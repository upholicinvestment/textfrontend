import React from "react";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
} from "recharts";

interface AvgWinLoss {
  avgWin?: number;
  avgLoss?: number;
}

interface Stats {
  tradeWinPercent?: number;
  profitFactor?: number;
  avgWinLoss?: AvgWinLoss;
  upholicScore?: number;
}

interface SpiderDataItem {
  metric: string;
  value: number;
}

interface UpholicScoreCardProps {
  stats: Stats;
}

const UpholicScoreCard: React.FC<UpholicScoreCardProps> = ({ stats }) => {
  // Build radar data from stats with your logic
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
    { metric: "Recovery factor", value: 80 }, // Static for now
    { metric: "Max drawdown", value: 50 },   // Static for now
    { metric: "Consistency", value: 64 },    // Static for now
  ];

  const upholicScore = stats.upholicScore ?? 0;

  return (
    <div className="bg-[#0a0d13] rounded-md border border-[#202336] shadow-[0_8px_24px_rgba(0,0,0,0.25)] p-3 w-full text-white">
  {/* Header */}
  <div className="flex items-center mb-2">
    <span className="text-gray-300 font-medium text-xs tracking-wide uppercase">
      Upholic Score
    </span>
    <div
      className="ml-1 w-4 h-4 rounded-full border border-gray-400 flex items-center justify-center text-[10px] text-gray-400 cursor-help select-none"
      title="Combines your win %, consistency, risk/reward, and more"
    >
      i
    </div>
  </div>

  {/* Radar Chart */}
  <div className="h-32 mb-2">
    <ResponsiveContainer width="100%" height="100%">
      <RadarChart cx="50%" cy="50%" outerRadius={45} data={spiderData}>
        <PolarGrid gridType="polygon" stroke="#374151" />
        <PolarAngleAxis
          dataKey="metric"
          tick={{ fill: "#9CA3AF", fontSize: 8, fontWeight: "600" }}
          className="text-[10px]"
        />
        <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
        <Radar
          name="Score"
          dataKey="value"
          stroke="#8B5CF6"
          fill="#8B5CF6"
          fillOpacity={0.35}
          strokeWidth={1.2}
        />
      </RadarChart>
    </ResponsiveContainer>
  </div>

  {/* Score Display */}
  <div className="text-center mb-1">
    <div className="text-gray-300">
      <span className="text-base font-bold">Your Upholic Score</span>
    </div>
    <div className="text-2xl font-extrabold text-white mt-1">
      {upholicScore.toFixed(2)}
    </div>
  </div>

  {/* Progress Bar */}
  <div className="space-y-1">
    <div className="relative h-2 bg-[#2f3354] rounded-full overflow-hidden shadow-inner">
      <div
        className="absolute left-0 top-0 h-full rounded-full transition-all duration-500"
        style={{
          width: `${Math.min(100, Math.max(0, upholicScore))}%`,
          background:
            "linear-gradient(90deg, #ff6b6b 0%, #ffd93d 50%, #6bcf7f 100%)",
        }}
      />
    </div>
    {/* Scale markers */}
    <div className="flex justify-between text-[10px] text-gray-400 px-0.5 select-none">
      <span>0</span>
      <span>20</span>
      <span>40</span>
      <span>60</span>
      <span>80</span>
      <span>100</span>
    </div>
  </div>
</div>

  );
};

export default UpholicScoreCard;
