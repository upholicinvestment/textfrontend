import React, { useEffect, useRef, useState } from "react";
import { Menu, Search, Calendar, Home, Filter, Activity, PackageOpen } from "lucide-react";
import NotificationBell from "../../notifications/NotificationBell";

type SearchScope = "all" | "strategies" | "products" | "activity";

type Suggestion = {
  key: string;
  label: string;
  hint?: string;
  type: "strategy" | "product";
  href?: string;
  icon?: React.ReactNode;
};

interface Props {
  searchQuery: string;
  onSearchChange: (v: string) => void;
  onToggleSidebar: () => void;

  /** scope filter */
  searchScope: SearchScope;
  onSearchScopeChange: (v: SearchScope) => void;

  /** suggestions */
  suggestions?: Suggestion[];
  onPickSuggestion?: (s: Suggestion) => void;

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
  suggestions = [],
  onPickSuggestion,
  dateLabel,
  onHomeClick,
}) => {
  const [focused, setFocused] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // only show when typing + focused + have suggestions
  const showDrop = open && focused && searchQuery.trim().length > 0 && suggestions.length > 0;

  // close on outside click
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
        setActiveIdx(0);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  // reset highlight if suggestions change
  useEffect(() => {
    setActiveIdx(0);
  }, [suggestions, searchQuery, searchScope]);

  const onKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (!showDrop) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const pick = suggestions[activeIdx];
      if (pick && onPickSuggestion) {
        onPickSuggestion(pick);
        setOpen(false);
        inputRef.current?.blur();
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  const renderIcon = (s: Suggestion) => {
    if (s.icon) return s.icon;
    if (s.type === "strategy") return <Activity className="h-4 w-4" />;
    return <PackageOpen className="h-4 w-4" />;
  };

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
          <div className="flex-1 flex items-center gap-2" ref={wrapRef}>
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                ref={inputRef}
                value={searchQuery}
                onFocus={() => {
                  setFocused(true);
                  setOpen(true);
                }}
                onBlur={() => {
                  // small delay so click can register
                  setTimeout(() => setFocused(false), 120);
                }}
                onChange={(e) => {
                  onSearchChange(e.target.value);
                  setOpen(true);
                }}
                onKeyDown={onKeyDown}
                placeholder="Search strategies, products, activity…"
                className="w-full rounded-2xl border border-slate-200 bg-white px-10 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
                aria-label="Search"
                aria-autocomplete="list"
                aria-expanded={showDrop}
                aria-controls="search-suggest"
              />

              {/* Suggestion dropdown */}
              {showDrop && (
                <div
                  id="search-suggest"
                  className="absolute left-0 right-0 mt-2 z-50 rounded-xl border border-slate-200 bg-white shadow-xl overflow-hidden"
                  role="listbox"
                >
                  <ul className="max-h-[55vh] overflow-auto py-1">
                    {suggestions.map((s, idx) => {
                      const active = idx === activeIdx;
                      return (
                        <li key={s.key}>
                          <button
                            type="button"
                            className={`w-full text-left px-3 py-2.5 flex items-center gap-3 ${
                              active ? "bg-indigo-50" : "hover:bg-slate-50"
                            }`}
                            role="option"
                            aria-selected={active}
                            onMouseEnter={() => setActiveIdx(idx)}
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => {
                              onPickSuggestion?.(s);
                              setOpen(false);
                              inputRef.current?.blur();
                            }}
                          >
                            <span className={`h-7 w-7 grid place-items-center rounded-md ${
                              s.type === "strategy"
                                ? "bg-indigo-100 text-indigo-700"
                                : "bg-emerald-100 text-emerald-700"
                            }`}>
                              {renderIcon(s)}
                            </span>
                            <span className="flex-1 min-w-0">
                              <span className="block truncate text-sm text-slate-900 font-medium">{s.label}</span>
                              {s.hint ? (
                                <span className="block text-xs text-slate-500 truncate">{s.hint}</span>
                              ) : null}
                            </span>
                            <span className="text-[10px] px-2 py-1 rounded-full bg-slate-100 text-slate-600">
                              {s.type === "strategy" ? "Strategy" : "Product"}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>

            {/* Scope filter */}
            <label className="inline-flex items-center gap-2 text-sm text-slate-600">
              <span className="sr-only">Filter search by</span>
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-2 rounded-xl border border-slate-200 bg-white">
                <Filter className="h-4 w-4 text-slate-500" />
                <select
                  value={searchScope}
                  onChange={(e) => {
                    onSearchScopeChange(e.target.value as SearchScope);
                    // keep dropdown open as user changes scope
                    if (searchQuery.trim()) setOpen(true);
                  }}
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
