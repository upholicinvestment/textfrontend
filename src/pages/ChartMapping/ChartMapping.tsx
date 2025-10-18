import React, { useEffect, useState } from "react";
import Avd_Dec from "../Home_Components/Avd_Dec/Avd_Dec";
import Call_Put from "../Home_Components/Call_Put/Call_Put";
import Gex_Level from "../Home_Components/Gex_Level/Gex_Level";
import Heat_Map from "../Home_Components/Heat_Map/Heat_Map";
import Velocity_Index from "../Home_Components/Velocity_Index/Velocity_Index";
import { Moon, Sun, Grid3X3, Shuffle, Expand, X } from "lucide-react";

type Theme = "dark" | "light";

interface ChartItem {
  id: string;
  component: React.ReactNode;
  title: string;
}

type PanelMode = "card" | "fullscreen";
function renderChartWithPanel(node: React.ReactNode, panel: PanelMode) {
  if (!React.isValidElement(node)) return node;
  return React.cloneElement(node as any, { panel });
}

const ChartMapping: React.FC = () => {
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem("upholic_theme") as Theme) || "dark");
  const [isEditMode, setIsEditMode] = useState(false);
  const [expandedChart, setExpandedChart] = useState<string | null>(null);

  // enforce single column under 1200px; fixed 2-per-row otherwise
  const [isWide, setIsWide] = useState(() => (typeof window !== "undefined" ? window.innerWidth >= 1200 : true));
  useEffect(() => {
    const onResize = () => setIsWide(window.innerWidth >= 1200);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const [charts] = useState<ChartItem[]>([
    { id: "gex", component: <Gex_Level />, title: "Gamma Level" },
    { id: "velocity", component: <Velocity_Index />, title: "Volatility Index" },
    { id: "adv_dec", component: <Avd_Dec />, title: "Advance/Decline" },
    { id: "call_put", component: <Call_Put />, title: "Call/Put" },
  ]);

  const heatmapChart: ChartItem = { id: "heat_map", component: <Heat_Map />, title: "Heat Map" };

  const [layout, setLayout] = useState<string[][]>(() => {
    const saved = localStorage.getItem("upholic_layout");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    // default: 2 | 2 (Heat Map is rendered separately, full width)
    return [
      ["gex", "velocity"],
      ["adv_dec", "call_put"],
    ];
  });

  useEffect(() => {
    localStorage.setItem("upholic_theme", theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem("upholic_layout", JSON.stringify(layout));
  }, [layout]);

  const toggleTheme = () => setTheme((t) => (t === "dark" ? "light" : "dark"));
  const toggleEditMode = () => setIsEditMode(!isEditMode);

  const shuffleCharts = () => {
    const allChartIds = charts.map((chart) => chart.id);
    const shuffled = [...allChartIds].sort(() => Math.random() - 0.5);
    const newLayout: string[][] = [];
    const perRow = isWide ? 2 : 1;
    for (let i = 0; i < shuffled.length; i += perRow) {
      newLayout.push(shuffled.slice(i, i + perRow));
    }
    setLayout(newLayout);
  };

  const handleDragStart = (e: React.DragEvent, chartId: string) => {
    if (!isEditMode) return;
    e.dataTransfer.setData("text/plain", chartId);
    setTimeout(() => {
      e.currentTarget.classList.add("dragging");
    }, 0);
  };

  const handleDragEnd = (e: React.DragEvent) => {
    e.currentTarget.classList.remove("dragging");
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (!isEditMode) return;
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetRow: number, targetCol: number) => {
    if (!isEditMode) return;
    e.preventDefault();

    const sourceChartId = e.dataTransfer.getData("text/plain");
    const targetChartId = layout[targetRow][targetCol];
    if (sourceChartId === targetChartId) return;

    const newLayout = layout.map((row) => [...row]);

    // Find source position
    let sourceRow = -1,
      sourceCol = -1;
    for (let r = 0; r < newLayout.length; r++) {
      for (let c = 0; c < newLayout[r].length; c++) {
        if (newLayout[r][c] === sourceChartId) {
          sourceRow = r;
          sourceCol = c;
          break;
        }
      }
      if (sourceRow !== -1) break;
    }
    if (sourceRow === -1) return;

    // Swap the charts
    newLayout[sourceRow][sourceCol] = targetChartId;
    newLayout[targetRow][targetCol] = sourceChartId;
    setLayout(newLayout);
  };

  const getChartById = (id: string) => {
    if (id === "heat_map") return heatmapChart;
    return charts.find((chart) => chart.id === id);
  };

  const expandChart = (chartId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setExpandedChart(chartId);
    document.body.style.overflow = "hidden";
  };

  const collapseChart = () => {
    setExpandedChart(null);
    document.body.style.overflow = "unset";
  };

  const getCardClass = () => {
    const baseClass = "card p-3 md:p-4 min-h-[400px] relative transition-all duration-300";
    const editClass = isEditMode
      ? "cursor-move border-2 border-dashed border-blue-400 hover:border-blue-300 hover:shadow-lg"
      : "";
    return `${baseClass} ${editClass}`;
  };

  // fixed 2 columns ≥1200px
  const gridClass1200 = isWide ? "gt1200-2" : "";

  return (
    <div
      className="theme-scope min-h-[100dvh] antialiased"
      style={{
        ["--bg" as any]: theme === "dark" ? "#0b1220" : "#f6f7fb",
        ["--card-bg" as any]: theme === "dark" ? "#0f172a" : "#ffffff",
        ["--fg" as any]: theme === "dark" ? "rgba(255,255,255,0.92)" : "#0b1220",
        ["--muted" as any]: theme === "dark" ? "rgba(226,232,240,0.65)" : "rgba(71,85,105,0.9)",
        ["--border" as any]: theme === "dark" ? "rgba(148,163,184,0.25)" : "rgba(15,23,42,0.12)",
        ["--axis" as any]: theme === "dark" ? "rgba(226,232,240,0.75)" : "rgba(30,41,59,0.85)",
        ["--grid" as any]: theme === "dark" ? "rgba(148,163,184,0.18)" : "rgba(15,23,42,0.08)",
        ["--tip" as any]: theme === "dark" ? "#0f172a" : "#ffffff",
        ["--tipbr" as any]: theme === "dark" ? "rgba(148,163,184,0.25)" : "rgba(15,23,42,0.12)",
      }}
    >
      <style>{`
        /* Fixed 2-column grid at >=1200px */
        @media (min-width:1200px){
          .gt1200-2{ display:grid; grid-template-columns:repeat(2, minmax(0,1fr)); }
        }

        .no-scrollbar::-webkit-scrollbar{ display:none; }
        .no-scrollbar{ -ms-overflow-style:none; scrollbar-width:none; }

        .card {
          position: relative; z-index: 0;
          background: var(--card-bg);
          color: var(--fg);
          border: 1px solid var(--border);
          border-radius: 14px;
          box-shadow: 0 1px 0 rgba(255,255,255,0.04) inset, 0 10px 30px rgba(0,0,0,0.25);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .themetoggle, .modetoggle {
          width: 40px; height: 40px; border-radius: 9999px;
          display: grid; place-items: center;
          border: 1px solid var(--border);
          background: var(--card-bg);
          color: var(--fg);
          box-shadow: 0 8px 22px rgba(0,0,0,.25);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .themetoggle:hover, .modetoggle:hover { 
          transform: translateY(-2px); 
          box-shadow: 0 12px 28px rgba(0,0,0,.32); 
        }
        .modetoggle.active {
          background: #3b82f6;
          color: white;
          border-color: #2563eb;
        }

        .theme-scope .apexcharts-toolbar { z-index: 2 !important; }

        .chart-actions {
          position: absolute;
          top: 6px;
          right: 6px;
          display: flex;
          gap: 8px;
          opacity: 0;
          transition: all 0.25s ease;
          z-index: 3;
          pointer-events: none;
        }
        .card:hover .chart-actions { opacity: 1; }
        .action-btn {
          width: 14px;
          height: 14px;
          border-radius: 8px;
          display: grid; place-items: center;
          background: var(--card-bg);
          border: 1px solid var(--border);
          color: var(--fg);
          backdrop-filter: blur(8px);
          transition: all 0.2s ease;
          cursor: pointer;
          pointer-events: auto;
        }
        .action-btn:hover {
          background: #3b82f6; color: white; border-color: #2563eb;
          transform: scale(1.05);
        }

        .card.dragging { opacity: 0.5; transform: scale(0.96); }

        /* ===== Expanded full-screen ===== */
        .expanded-overlay {
          position: fixed; inset: 0;
          background: var(--bg);
          z-index: 1000;
          display: grid; grid-template-rows: 1fr;
          padding: 0;
        }
        .expanded-chart {
          width: 100vw; height: 100vh;
          background: var(--card-bg);
          position: relative; display: flex; flex-direction: column;
          border: none; border-radius: 0; box-shadow: none;
        }
        .expanded-header {
          height: 56px;
          display: flex; align-items: center; justify-content: space-between;
          padding: 0 clamp(12px, 1.6vw, 24px);
          border-bottom: 1px solid var(--border);
          padding-top: calc(env(safe-area-inset-top, 0px));
        }
        .expanded-title { font-size: 1.35rem; font-weight: 600; color: var(--fg); }
        .close-btn {
          width: 40px; height: 40px; border-radius: 12px;
          display: grid; place-items: center;
          background: var(--card-bg); border: 1px solid var(--border);
          color: var(--fg); cursor: pointer; transition: .2s;
        }
        .close-btn:hover { background: #ef4444; color: #fff; border-color: #dc2626; transform: scale(1.06); }
        .expanded-content {
          flex: 1; min-height: 0; overflow: hidden;
          padding: clamp(8px, 1.2vw, 16px);
        }
        .expanded-content > * { width: 100%; height: 100%; }
        .expanded-chart .apexcharts-canvas,
        .expanded-chart .apexcharts-svg { width: 100% !important; height: 100% !important; }
        .expanded-chart canvas { width: 100% !important; height: 100% !important; }
      `}</style>

      {/* Expanded Chart Modal */}
      {expandedChart && (
        <div className="expanded-overlay" onClick={collapseChart}>
          <div className="expanded-chart" onClick={(e) => e.stopPropagation()}>
            <div className="expanded-header">
              <h2 className="expanded-title">{getChartById(expandedChart)?.title}</h2>
              <button onClick={collapseChart} className="close-btn" aria-label="Close expanded view">
                <X size={20} />
              </button>
            </div>
            <div className="expanded-content">
              <div className="w-full h-full">
                {renderChartWithPanel(getChartById(expandedChart)?.component, "fullscreen")}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="w-full" style={{ background: "var(--bg)", color: "var(--fg)" }}>
        <div className="px-2 sm:px-3 md:px-4 lg:px-6 py-2 md:py-3">
          <div className="flex items-center justify-end gap-2 mb-2">
            <button onClick={shuffleCharts} className="modetoggle" aria-label="Shuffle charts" title="Shuffle charts randomly">
              <Shuffle size={18} />
            </button>
            <button
              onClick={toggleEditMode}
              className={`modetoggle ${isEditMode ? "active" : ""}`}
              aria-label="Toggle rearrange mode"
              title="Toggle rearrange mode"
            >
              <Grid3X3 size={18} />
            </button>
            <button onClick={toggleTheme} className="themetoggle" aria-label="Toggle light/dark" title="Toggle light/dark">
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>

          {/* Charts grid (fixed 2-per-row ≥1200px, single column below) */}
          {layout.map((row, rowIndex) => (
            <div
              key={rowIndex}
              className={`grid grid-cols-1 ${gridClass1200} gap-2 md:gap-3 ${rowIndex > 0 ? "mt-2 md:mt-3" : ""}`}
            >
              {row.map((chartId, colIndex) => {
                const chart = getChartById(chartId);
                if (!chart) return null;

                return (
                  <div
                    key={`${rowIndex}-${colIndex}`}
                    className={getCardClass()}
                    draggable={isEditMode}
                    onDragStart={(e) => handleDragStart(e, chartId)}
                    onDragEnd={handleDragEnd}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, rowIndex, colIndex)}
                    style={{ overflow: "visible" }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="chart-actions">
                      {isEditMode && (
                        <div className="action-btn cursor-move" title="Drag to move">
                          <Grid3X3 size={14} />
                        </div>
                      )}
                      <button
                        className="action-btn"
                        onClick={(e) => expandChart(chartId, e)}
                        aria-label={`Expand ${chart.title}`}
                        title="Expand"
                      >
                        <Expand size={14} />
                      </button>
                    </div>
                    <div className="no-scrollbar overflow-y-auto h-full">
                      {renderChartWithPanel(chart.component, "card")}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}

          {/* Heat Map block (full width) */}
          <div className="mt-2 md:mt-3">
            <div
              className="card p-3 md:p-4 overflow-hidden w-full min-h-[360px] relative transition-all duration-300"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="chart-actions">
                <button
                  className="action-btn"
                  onClick={(e) => expandChart("heat_map", e)}
                  aria-label="Expand heat map"
                  title="Expand heat map"
                >
                  <Expand size={14} />
                </button>
              </div>
              <div className="no-scrollbar overflow-y-auto h-full">
                {renderChartWithPanel(<Heat_Map />, "card")}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChartMapping;
