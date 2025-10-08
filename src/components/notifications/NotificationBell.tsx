import { useEffect, useRef, useState } from "react";
import { Bell, Check, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNotifications } from "../../hooks/useNotifications";
import { useNavigate } from "react-router-dom";

type Props = {
  className?: string; // optional to match your header button sizing
};

export default function NotificationBell({ className }: Props) {
  const {
    items,
    unseenCount,
    loading,
    markRead,
    markAllRead,
    refetch,
  } = useNotifications();

  const [open, setOpen] = useState(false);
  const nav = useNavigate();
  const ref = useRef<HTMLDivElement>(null);

  // close on outside click
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!ref.current) return;
      if (ref.current.contains(e.target as Node)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const onOpen = () => {
    setOpen((v) => !v);
    if (!open) refetch();
  };

  const onItemClick = async (id: string, link?: string) => {
    await markRead(id);
    if (link) nav(link);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={onOpen}
        className={
          className ??
          "relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
        }
        aria-label="Notifications"
        title="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unseenCount > 0 && (
          <span className="absolute -top-1 -right-1 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold text-white shadow ring-2 ring-white">
            {unseenCount > 99 ? "99+" : unseenCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 6, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.16 }}
            className="absolute right-0 mt-2 w-[360px] max-h-[70vh] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
              <div className="text-sm font-semibold text-slate-800">
                Notifications
              </div>
              <button
                onClick={() => markAllRead()}
                className="inline-flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700"
              >
                <Check className="h-4 w-4" />
                Mark all as read
              </button>
            </div>

            {/* List */}
            <div className="max-h-[60vh] overflow-auto">
              {loading && (
                <div className="px-4 py-6 text-sm text-slate-500">Loading…</div>
              )}

              {!loading && items.length === 0 && (
                <div className="px-4 py-6 text-sm text-slate-500">
                  You’re all caught up.
                </div>
              )}

              {!loading &&
                items.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => onItemClick(n.id, n.link)}
                    className={`w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-slate-50 border-b border-slate-100 ${
                      !n.read ? "bg-indigo-50/40" : ""
                    }`}
                  >
                    {/* dot */}
                    <span
                      className={`mt-1 h-2 w-2 rounded-full ${
                        n.read ? "bg-slate-300" : "bg-indigo-500"
                      }`}
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-slate-800 flex items-center gap-2">
                        {n.title}
                        {n.link && (
                          <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
                        )}
                      </div>
                      {n.body && (
                        <div className="text-[12px] text-slate-600 mt-0.5">
                          {n.body}
                        </div>
                      )}
                      <div className="text-[11px] text-slate-400 mt-1">
                        {new Date(n.createdAt).toLocaleString()}
                      </div>
                    </div>
                  </button>
                ))}
            </div>

            {/* Footer */}
            <div className="px-4 py-3 bg-slate-50/70 flex justify-end">
              <button
                onClick={() => {
                  setOpen(false);
                  nav("/notifications");
                }}
                className="text-xs font-medium text-slate-600 hover:text-slate-800"
              >
                View all
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
