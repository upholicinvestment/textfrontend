import React, { useEffect, useState } from "react";
import Avd_Dec from "../Home_Components/Avd_Dec/Avd_Dec";
import Call_Put from "../Home_Components/Call_Put/Call_Put";
import Gex_Level from "../Home_Components/Gex_Level/Gex_Level";
import Heat_Map from "../Home_Components/Heat_Map/Heat_Map";
import Velocity_Index from "../Home_Components/Velocity_Index/Velocity_Index";
import { Moon, Sun } from "lucide-react";

type Theme = "dark" | "light";

const ChartMapping: React.FC = () => {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem("upholic_theme") as Theme | null;
    return saved === "dark" || saved === "light" ? saved : "dark";
  });

  useEffect(() => {
    localStorage.setItem("upholic_theme", theme);
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  return (
    <div
      className="theme-scope min-h-[100dvh] antialiased"
      style={{
        ["--bg" as any]: theme === "dark" ? "#0b1220" : "#f6f7fb",
        ["--card-bg" as any]: theme === "dark" ? "#0f172a" : "#ffffff",
        ["--fg" as any]: theme === "dark" ? "rgba(255,255,255,0.92)" : "#0b1220",
        ["--muted" as any]:
          theme === "dark" ? "rgba(226,232,240,0.65)" : "rgba(71,85,105,0.9)",
        ["--border" as any]:
          theme === "dark" ? "rgba(148,163,184,0.25)" : "rgba(15,23,42,0.12)",
        ["--axis" as any]: theme === "dark" ? "rgba(226,232,240,0.75)" : "rgba(30,41,59,0.85)",
        ["--grid" as any]: theme === "dark" ? "rgba(148,163,184,0.18)" : "rgba(15,23,42,0.08)",
        ["--tip" as any]: theme === "dark" ? "#0f172a" : "#ffffff",
        ["--tipbr" as any]: theme === "dark" ? "rgba(148,163,184,0.25)" : "rgba(15,23,42,0.12)",
      }}
    >
      <style>{`
        .no-scrollbar::-webkit-scrollbar{ display:none; }
        .no-scrollbar{ -ms-overflow-style:none; scrollbar-width:none; }
        .card {
          background: var(--card-bg);
          color: var(--fg);
          border: 1px solid var(--border);
          border-radius: 14px;
          box-shadow: 0 1px 0 rgba(255,255,255,0.04) inset, 0 10px 30px rgba(0,0,0,0.25);
        }
        .themetoggle {
          width: 40px; height: 40px; border-radius: 9999px;
          display: grid; place-items: center;
          border: 1px solid var(--border);
          background: var(--card-bg);
          color: var(--fg);
          box-shadow: 0 8px 22px rgba(0,0,0,.25);
          transition: transform .15s ease, box-shadow .2s ease;
        }
        .themetoggle:hover { transform: translateY(-1px); box-shadow: 0 12px 28px rgba(0,0,0,.32); }

        .theme-scope .apexcharts-tooltip {
          background: var(--tip) !important;
          color: var(--fg) !important;
          border: 1px solid var(--tipbr) !important;
        }
        .theme-scope .apexcharts-tooltip-title {
          background: var(--tip) !important;
          border-bottom: 1px solid var(--tipbr) !important;
          color: var(--fg) !important;
        }
        .theme-scope .apexcharts-legend-text,
        .theme-scope .apexcharts-title-text,
        .theme-scope .apexcharts-subtitle-text {
          fill: var(--fg) !important; color: var(--fg) !important;
        }
        .theme-scope .apexcharts-xaxis text,
        .theme-scope .apexcharts-yaxis text {
          fill: var(--axis) !important;
        }
        .theme-scope .apexcharts-gridline {
          stroke: var(--grid) !important;
        }
        .theme-scope .apexcharts-canvas,
        .theme-scope .apexcharts-svg {
          background: transparent !important;
        }
      `}</style>

      <div className="w-full" style={{ background: "var(--bg)", color: "var(--fg)" }}>
        <div className="mx-auto max-w-[1400px] px-2 sm:px-3 md:px-4 lg:px-6 py-2 md:py-3">
          <div className="flex items-center justify-end gap-2 mb-2">
            <button
              onClick={toggleTheme}
              className="themetoggle"
              aria-label="Toggle light/dark"
              title="Toggle light/dark"
            >
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>

          {/* Row 1: GEX + Velocity */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3">
            {/* 👇 overflow visible so native selects/dropdowns aren’t clipped */}
            <div className="card p-3 md:p-4 min-h-[400px]" style={{ overflow: "visible" }}>
              <div className="no-scrollbar overflow-y-auto h-full">
                <Gex_Level />
              </div>
            </div>
            <div className="card p-3 md:p-4 min-h-[400px]" style={{ overflow: "visible" }}>
              <div className="no-scrollbar overflow-y-auto h-full">
                <Velocity_Index />
              </div>
            </div>
          </div>

          {/* Row 2: Adv/Dec + Call/Put */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3 mt-2 md:mt-3">
            <div className="card p-3 md:p-4 overflow-hidden min-h-[360px]">
              <div className="no-scrollbar overflow-y-auto h-full">
                <Avd_Dec />
              </div>
            </div>
            <div className="card p-3 md:p-4 overflow-hidden min-h-[360px]">
              <div className="no-scrollbar overflow-y-auto h-full">
                <Call_Put />
              </div>
            </div>
          </div>

          {/* Row 3: Heat Map */}
          <div className="mt-2 md:mt-3">
            <div className="card p-3 md:p-4 overflow-hidden w-full min-h-[360px]">
              <div className="no-scrollbar overflow-y-auto h-full">
                <Heat_Map />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChartMapping;
