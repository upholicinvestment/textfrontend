import { ReactNode } from "react";
import { FiHome, FiBarChart2, FiBookOpen, FiUpload } from "react-icons/fi";
import UpholicLogo from "./Upholictech.png";

const sidebar = [
  { label: "Dashboard", icon: <FiHome />, key: "dashboard" },
  { label: "Daily Journal", icon: <FiBookOpen />, key: "journal" },
  { label: "Trades", icon: <FiBarChart2 />, key: "trades" },
];

type Props = {
  active: string;
  setActive: (key: string) => void;
  onUpload: () => void;
  children?: ReactNode;
  collapsed?: boolean;
  /** Scopes responsive rules so the mobile drawer keeps labels */
  mode?: "sidebar" | "drawer";
};

export const SidebarLayout = ({
  active,
  setActive,
  onUpload,
  collapsed = false,
  mode = "sidebar",
}: Props) => {
  return (
    <>
      {/* Custom Styles */}
      <style>{`
        @keyframes slideIn { 0% { transform: translateX(-100%); opacity: 0; } 100% { transform: translateX(0); opacity: 1; } }
        @keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-3px); } }
        @keyframes pulse { 0%, 100% { opacity: 0.6; } 50% { opacity: 1; } }
        @keyframes glow { 0%, 100% { box-shadow: 0 0 5px rgba(99, 102, 241, 0.3); } 50% { box-shadow: 0 0 20px rgba(99, 102, 241, 0.6), 0 0 30px rgba(99, 102, 241, 0.3); } }
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        @keyframes breathe { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }

        .slide-in { animation: slideIn 0.6s ease-out; }
        .float { animation: float 4s ease-in-out infinite; }
        .pulse-soft { animation: pulse 3s ease-in-out infinite; }
        .glow-effect { animation: glow 2s ease-in-out infinite; }
        .shimmer { animation: shimmer 3s linear infinite; }
        .breathe { animation: breathe 3s ease-in-out infinite; }

        .glass-morphism {
          background: rgba(23, 27, 41, 0.95);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(99, 102, 241, 0.1);
        }

        .nav-item-glow { position: relative; overflow: hidden; }
        .nav-item-glow::before {
          content: '';
          position: absolute; top: 0; left: -100%; width: 100%; height: 100%;
          background: linear-gradient(90deg, transparent, rgba(99, 102, 241, 0.1), transparent);
          transition: left 0.5s ease;
        }
        .nav-item-glow:hover::before { left: 100%; }

        .gradient-border { position: relative; background: linear-gradient(145deg, #1e293b, #0f172a); border: 1px solid transparent; }
        .gradient-border::before {
          content: ''; position: absolute; inset: 0; border-radius: inherit; padding: 1px;
          background: linear-gradient(145deg, rgba(99,102,241,.3), rgba(139,92,246,.3), rgba(59,130,246,.3));
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: exclude; mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0); mask-composite: exclude;
        }

        .upload-button-effect {
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #3b82f6 100%);
          background-size: 200% 200%;
          animation: shimmer 3s ease infinite;
          position: relative; overflow: hidden;
        }
        .upload-button-effect::before {
          content: ''; position: absolute; top: 0; left: -100%; width: 100%; height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
          transition: left 0.6s ease;
        }
        .upload-button-effect:hover::before { left: 100%; }

        .text-gradient {
          background: linear-gradient(135deg, #6366f1, #8b5cf6, #3b82f6);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
          background-size: 200% 200%; animation: shimmer 3s ease infinite;
        }

        .sidebar-glow {
          box-shadow: inset 1px 0 0 rgba(99, 102, 241, 0.1), 0 0 50px rgba(23, 27, 41, 0.9), 0 0 100px rgba(99, 102, 241, 0.05);
        }

        .logo-glow { filter: drop-shadow(0 0 10px rgba(99, 102, 241, 0.3)); transition: all 0.3s ease; }
        .logo-glow:hover { filter: drop-shadow(0 0 20px rgba(99, 102, 241, 0.6)); transform: scale(1.02); }

        .active-indicator { position: relative; }
        .active-indicator::after {
          content: ''; position: absolute; right: -16px; top: 50%; transform: translateY(-50%);
          width: 4px; height: 24px; background: linear-gradient(180deg, #6366f1, #8b5cf6);
          border-radius: 2px; box-shadow: 0 0 10px rgba(99, 102, 241, 0.6);
        }

        /* Custom scrollbar */
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(23, 27, 41, 0.5); }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, #6366f1, #8b5cf6); border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(180deg, #8b5cf6, #6366f1);
        }

        /* ===== Responsive tweaks ===== */
        
      `}</style>

      {/* Root wrapper scopes rules via .sidebar-mode or .drawer-mode */}
      <div className={`sidebar-root ${mode}-mode`}>
        <aside
          className={`
            flex flex-col h-full glass-morphism sidebar-glow
            transition-all duration-500 ease-out
            ${collapsed ? "w-[80px]" : "w-[265px]"}
            custom-scrollbar slide-in
          `}
          style={{ minHeight: "100vh" }}
        >
          {/* Animated Background Pattern */}
          <div className="absolute inset-0 opacity-5 pointer-events-none">
            <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full blur-3xl float"></div>
            <div className="absolute bottom-20 right-10 w-24 h-24 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full blur-2xl float" style={{ animationDelay: "2s" }}></div>
          </div>

          {/* Logo */}
          {!collapsed ? (
            <div className="flex items-center mb-8 pl-4 pt-4 relative z-10">
              <img src={UpholicLogo} alt="Upholic" className="w-28 h-10 mr-8 logo-glow breathe" />
            </div>
          ) : (
            <div className="flex justify-center mb-12 pt-4 relative z-10">
              <img src={UpholicLogo} alt="Upholic" className="w-12 h-8 logo-glow breathe" />
            </div>
          )}

          {/* Nav */}
          <nav className="flex flex-col gap-2 px-2 relative z-10">
            {sidebar.map((item, index) => (
              <button
                key={item.key}
                className={`
                  flex items-center gap-3 px-4 py-3.5 rounded-xl text-base font-medium
                  nav-item-glow gradient-border
                  ${active === item.key
                    ? "bg-gradient-to-r from-indigo-600/20 to-purple-600/20 text-white border-indigo-500/30 active-indicator glow-effect"
                    : "text-[#b3baff] hover:bg-gradient-to-r hover:from-indigo-600/10 hover:to-purple-600/10 hover:text-white border-gray-700/30"}
                  ${collapsed ? "justify-center" : ""}
                  transition-all duration-300 ease-out
                `}
                onClick={() => setActive(item.key)}
                title={collapsed ? item.label : undefined}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <span className={`text-lg ${active === item.key ? "text-gradient" : ""}`}>{item.icon}</span>
                {!collapsed && (
                  <span className={`transition-all duration-300 ${active === item.key ? "text-gradient font-semibold" : ""}`}>
                    {item.label}
                  </span>
                )}
              </button>
            ))}
          </nav>

          <div className="flex-1" />

          {/* Divider */}
          <div className="mx-4 my-6 h-px bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent"></div>

          {/* Upload Orderbook */}
          <button
            className={`
              flex items-center justify-center gap-3
              px-4 py-3.5 mx-4 mb-6 mt-35
              rounded-xl upload-button-effect text-white font-bold
              hover:scale-105 hover:shadow-2xl hover:shadow-indigo-500/25
              transition-all duration-300 ease-out
              ${collapsed ? "justify-center" : ""}
              glow-effect float
            `}
            onClick={onUpload}
            title={collapsed ? "Upload Orderbook" : undefined}
          >
            <FiUpload className="text-lg" />
            {!collapsed && (
              <span className="bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent font-bold">
                Upload Orderbook
              </span>
            )}
          </button>

          {/* Version */}
          {!collapsed ? (
            <div className="text-xs text-center mb-4 relative z-10">
              <div className="text-gradient font-medium pulse-soft">v1.0 Upholic Journal</div>
              <div className="w-16 h-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 mx-auto mt-1 rounded-full"></div>
            </div>
          ) : (
            <div className="flex justify-center mb-15">
              <div className="w-2 h-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full pulse-soft"></div>
            </div>
          )}
        </aside>
      </div>
    </>
  );
};
