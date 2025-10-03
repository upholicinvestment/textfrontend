// src/components/dashboard/components/HeaderBar.tsx
import React from "react";
import { Menu, Search, Calendar, Home, Bell } from "lucide-react";

interface Props {
  searchQuery: string;
  onSearchChange: (v: string) => void;
  onToggleSidebar: () => void;

  /** Optional extras (all safe defaults) */
  dateLabel?: string;                 // e.g., "Sat, Sep 20"
  onHomeClick?: () => void;
  onBellClick?: () => void;
  notifications?: number;             // shows a badge if > 0
}

const HeaderBar: React.FC<Props> = ({
  searchQuery,
  onSearchChange,
  onToggleSidebar,
  dateLabel,
  onHomeClick,
  onBellClick,
  notifications = 0,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-b border-slate-100">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="h-16 flex items-center gap-3">
          {/* Mobile toggle */}
          <button
            onClick={onToggleSidebar}
            className="md:hidden inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
            aria-label="Toggle sidebar"
            title="Toggle sidebar"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search tools, stocks..."
                className="w-full rounded-2xl border border-slate-200 bg-white px-10 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
              />
            </div>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2 ml-2">
            {/* Date chip */}
            <div className="hidden sm:flex items-center gap-2 rounded-2xl bg-slate-50 px-3 py-2 text-sm text-slate-700 border border-slate-200">
              <Calendar className="h-4 w-4 text-slate-500" />
              <span>{dateLabel ?? new Date().toLocaleDateString(undefined, { weekday: "short", month: "short", day: "2-digit" })}</span>
            </div>

            {/* Home */}
            <button
              onClick={onHomeClick}
              className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              aria-label="Go to Home"
              title="Home"
            >
              <Home className="h-5 w-5" />
            </button>

            {/* Bell / Notifications */}
            <button
              onClick={onBellClick}
              className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              aria-label="Notifications"
              title="Notifications"
            >
              <Bell className="h-5 w-5" />
              {notifications > 0 && (
                <span className="absolute -top-1 -right-1 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold text-white shadow ring-2 ring-white">
                  {notifications > 99 ? "99+" : notifications}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default HeaderBar;
