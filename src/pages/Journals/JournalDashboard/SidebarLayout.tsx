import { ReactNode } from "react";
import { FiHome, FiBarChart2, FiBookOpen, FiUpload, FiGrid, FiCalendar, FiMessageSquare } from "react-icons/fi"; // ← added FiGrid for Dashboard
import UpholicLogo from "./Upholictech.png";

type SidebarItem = {
  label: string;
  icon: ReactNode;
  key: string;
  href?: string; // optional: when present, navigate to this path
};

const sidebar: SidebarItem[] = [
  { label: "Home", icon: <FiHome />, key: "home", href: "/dashboard" }, // Home links to "/"
  { label: "Dashboard", icon: <FiGrid />, key: "dashboard" },   // ← different icon for Dashboard
  { label: "Daily Journal", icon: <FiBookOpen />, key: "journal" },
  { label: "Trades", icon: <FiBarChart2 />, key: "trades" },
  { label: "Trade Calendar", icon: <FiCalendar />, key: "calendar" },
  { label: "Feedback", icon: <FiMessageSquare />, key: "feedback" },
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
        /* --- Subtle, classic motion --- */
        @keyframes slideIn { 0% { transform: translateX(-8px); opacity: 0; } 100% { transform: translateX(0); opacity: 1; } }
        @keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-2px); } }

        .slide-in { animation: slideIn 320ms ease-out; }

        /* --- Glass + surfaces --- */
        .glass-morphism {
          background: rgba(15, 18, 27, 0.85);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(148, 163, 184, 0.08); /* slate-300 @ 8% */
        }
        .sidebar-glow {
          box-shadow:
            inset 1px 0 0 rgba(148, 163, 184, 0.06),
            0 8px 24px rgba(0, 0, 0, 0.35);
        }

        /* --- Nav items --- */
        .nav-item {
          background: linear-gradient(180deg, rgba(30, 41, 59, 0.22), rgba(15, 23, 42, 0.22));
          border: 1px solid rgba(148, 163, 184, 0.10);
        }
        .nav-item:hover {
          background: linear-gradient(180deg, rgba(30, 41, 59, 0.32), rgba(15, 23, 42, 0.32));
          border-color: rgba(148, 163, 184, 0.18);
        }
        .nav-item-active {
          background: linear-gradient(180deg, rgba(79, 70, 229, 0.18), rgba(99, 102, 241, 0.12));
          border: 1px solid rgba(99, 102, 241, 0.35);
        }
        .active-indicator { position: relative; }
        .active-indicator::after {
          content: '';
          position: absolute; right: -12px; top: 50%; transform: translateY(-50%);
          width: 3px; height: 22px; background: linear-gradient(180deg, #6366f1, #8b5cf6);
          border-radius: 2px; box-shadow: 0 0 6px rgba(99, 102, 241, 0.45);
        }

        /* --- Logo glow (subtle) --- */
        .logo-glow { filter: drop-shadow(0 0 8px rgba(99, 102, 241, 0.25)); transition: filter 200ms ease, transform 200ms ease; }
        .logo-glow:hover { filter: drop-shadow(0 0 12px rgba(99, 102, 241, 0.4)); transform: translateY(-1px); }

        /* --- Upload button --- */
        .upload-button {
          background: linear-gradient(135deg, #4f46e5 0%, #6366f1 50%, #3b82f6 100%);
          box-shadow: 0 8px 20px rgba(79, 70, 229, 0.25);
        }
        .upload-button:hover {
          filter: brightness(1.03);
          box-shadow: 0 10px 24px rgba(79, 70, 229, 0.35);
        }

        /* --- Text gradient (very gentle) --- */
        .text-gradient {
          background: linear-gradient(135deg, #e5e7eb, #c7d2fe);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
        }

        /* --- Custom scrollbar --- */
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(23, 27, 41, 0.35); }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, #475569, #334155); border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(180deg, #6366f1, #4f46e5);
        }
      `}</style>

      {/* Root wrapper scopes rules via .sidebar-mode or .drawer-mode */}
      <div className={`sidebar-root ${mode}-mode`}>
        <aside
          className={`
            relative flex flex-col h-full glass-morphism sidebar-glow
            transition-all duration-300 ease-out
            ${collapsed ? "w-[80px]" : "w-[265px]"}
            custom-scrollbar slide-in
          `}
          style={{ minHeight: "100vh" }}
        >
          {/* Subtle Background Accents */}
          <div className="pointer-events-none absolute inset-0 opacity-[0.03]">
            <div className="absolute top-24 left-8 h-28 w-28 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 blur-3xl" />
            <div className="absolute bottom-24 right-8 h-20 w-20 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 blur-2xl" />
          </div>

          {/* Logo → link to "/" */}
          {!collapsed ? (
            <div className="relative z-10 flex items-center pt-5 pb-4 pl-4">
              <a href="/" title="Go to Home">
                <img src={UpholicLogo} alt="Upholic" className="logo-glow h-10 w-28" />
              </a>
            </div>
          ) : (
            <div className="relative z-10 flex justify-center pt-5 pb-6">
              <a href="/" title="Go to Home">
                <img src={UpholicLogo} alt="Upholic" className="logo-glow h-8 w-12" />
              </a>
            </div>
          )}

          {/* Nav */}
          <nav className="relative z-10 flex flex-col gap-3 px-5">
            {sidebar.map((item) => {
              const commonClasses = `
                group flex items-center gap-3 rounded-lg px-3.5 py-3 text-sm font-medium
                focus:outline-none focus:ring-2 focus:ring-indigo-500/40
                transition-all duration-200
                ${collapsed ? "justify-center" : ""}
                ${active === item.key && !item.href ? "nav-item-active text-white active-indicator" : "nav-item text-slate-300 hover:text-white"}
              `;

              // If item has an href, render as link (e.g., Home -> "/")
              if (item.href) {
                return (
                  <a
                    key={item.key}
                    href={item.href}
                    className={commonClasses}
                    title={collapsed ? item.label : undefined}
                  >
                    <span className={`text-[18px] ${active === item.key ? "text-indigo-300" : "text-slate-300 group-hover:text-indigo-200"}`}>
                      {item.icon}
                    </span>
                    {!collapsed && (
                      <span className={`${active === item.key ? "text-gradient font-semibold" : ""}`}>
                        {item.label}
                      </span>
                    )}
                  </a>
                );
              }

              // Regular sidebar item (uses setActive)
              return (
                <button
                  key={item.key}
                  className={commonClasses}
                  onClick={() => setActive(item.key)}
                  title={collapsed ? item.label : undefined}
                >
                  <span className={`text-[18px] ${active === item.key ? "text-indigo-300" : "text-slate-300 group-hover:text-indigo-200"}`}>
                    {item.icon}
                  </span>
                  {!collapsed && (
                    <span className={`${active === item.key ? "text-gradient font-semibold" : ""}`}>
                      {item.label}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          <div className="flex-1" />

          {/* Divider */}
          <div className="mx-4 my-6 h-px bg-gradient-to-r from-transparent via-slate-600/30 to-transparent" />

          {/* Upload Orderbook */}
          <button
            className={`
              upload-button relative z-10 mx-4 mb-12 flex items-center justify-center gap-2.5
              rounded-lg px-4 py-3 text-sm font-semibold text-white transition-all duration-200
              ${collapsed ? "justify-center" : ""}
            `}
            onClick={onUpload}
            title={collapsed ? "Upload Orderbook" : undefined}
          >
            <FiUpload className="text-[18px]" />
            {!collapsed && <span>Upload Orderbook</span>}
          </button>
        </aside>
      </div>
    </>
  );
};
