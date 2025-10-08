import React from "react";
import { Menu, Search, Calendar, Home, Filter } from "lucide-react";
import NotificationBell from "../../notifications/NotificationBell";

type SearchScope = "all" | "strategies" | "products" | "activity";

interface Props {
  searchQuery: string;
  onSearchChange: (v: string) => void;
  onToggleSidebar: () => void;

  /** scope filter */
  searchScope: SearchScope;
  onSearchScopeChange: (v: SearchScope) => void;

  /** Optional extras (all safe defaults) */
  dateLabel?: string; // e.g., "Sat, Sep 20"
  onHomeClick?: () => void;
}

const HeaderBar: React.FC<Props> = ({
  searchQuery,
  onSearchChange,
  onToggleSidebar,
  searchScope,
  onSearchScopeChange,
  dateLabel,
  onHomeClick,
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

          {/* Search + Scope */}
          <div className="flex-1 flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search strategies, products, activity…"
                className="w-full rounded-2xl border border-slate-200 bg-white px-10 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
                aria-label="Search"
              />
            </div>

            {/* Scope filter */}
            <label className="inline-flex items-center gap-2 text-sm text-slate-600">
              <span className="sr-only">Filter search by</span>
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-2 rounded-xl border border-slate-200 bg-white">
                <Filter className="h-4 w-4 text-slate-500" />
                <select
                  value={searchScope}
                  onChange={(e) => onSearchScopeChange(e.target.value as SearchScope)}
                  className="bg-transparent outline-none text-slate-700"
                  aria-label="Search filter scope"
                >
                  <option value="all">All</option>
                  <option value="strategies">Strategies</option>
                  <option value="products">Products</option>
                  <option value="activity">Live Activity</option>
                </select>
              </span>
            </label>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2 ml-2">
            {/* Date chip */}
            <div className="hidden sm:flex items-center gap-2 rounded-2xl bg-slate-50 px-3 py-2 text-sm text-slate-700 border border-slate-200">
              <Calendar className="h-4 w-4 text-slate-500" />
              <span>
                {dateLabel ??
                  new Date().toLocaleDateString(undefined, {
                    weekday: "short",
                    month: "short",
                    day: "2-digit",
                  })}
              </span>
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

            {/* Notifications (dropdown) */}
            <NotificationBell />
          </div>
        </div>
      </div>
    </header>
  );
};

export default HeaderBar;
