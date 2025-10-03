// src/components/dashboard/components/ExpiryModal.tsx
import React, { useEffect, useMemo, useRef } from "react";
import { AlertTriangle, CalendarDays, X, Clock, Zap } from "lucide-react";
import type { ExpiryCandidate } from "../../../hooks/useExpiryQueue";

type Props = {
  open: boolean;
  item: ExpiryCandidate;
  onDismiss: () => void;
  onRenew: () => void;
  /** Used only to render the progress bar (default 7 if not passed) */
  maxDays?: number;
};

const clamp = (n: number, min = 0, max = 100) => Math.max(min, Math.min(max, n));

const ExpiryModal: React.FC<Props> = ({ open, item, onDismiss, onRenew, maxDays = 7 }) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  const primaryBtnRef = useRef<HTMLButtonElement>(null);

  const progressPct = useMemo(() => {
    const pct = ((maxDays - item.daysLeft) / maxDays) * 100;
    return clamp(Math.round(pct));
  }, [item.daysLeft, maxDays]);

  const urgencyLevel = useMemo(() => {
    if (item.daysLeft === 0) return "critical";
    if (item.daysLeft <= 2) return "high";
    if (item.daysLeft <= 4) return "medium";
    return "low";
  }, [item.daysLeft]);

  const urgencyColors = {
    critical: "from-rose-500 to-rose-600",
    high: "from-[#4a56d2] to-[#1a237e]",
    medium: "from-[#4a56d2] to-[#1a237e]",
    low: "from-[#4a56d2] to-[#1a237e]",
  } as const;

  const urgencyOpacities = {
    critical: "opacity-100",
    high: "opacity-90",
    medium: "opacity-80",
    low: "opacity-70",
  } as const;

  const title =
    item.daysLeft === 0
      ? "Subscription Expires Today"
      : item.daysLeft === 1
      ? "Subscription Expires Tomorrow"
      : `Subscription Expires in ${item.daysLeft} Days`;

  const subtitle =
    item.daysLeft === 0
      ? "Your subscription ends today"
      : item.daysLeft === 1
      ? "Your subscription ends tomorrow"
      : `Your subscription ends in ${item.daysLeft} days`;

  useEffect(() => {
    if (!open) return;
    primaryBtnRef.current?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onDismiss();
      }
      if (e.key === "Tab" && dialogRef.current) {
        const focusables = dialogRef.current.querySelectorAll<HTMLElement>(
          'button, a[href], [tabindex]:not([tabindex="-1"])'
        );
        if (!focusables.length) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onDismiss]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200]">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={onDismiss} />

      {/* Panel */}
      <div className="absolute inset-0 flex items-center justify-center p-4 sm:p-6">
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="expiry-title"
          className="w-full max-w-md rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200/50 transition-all duration-300 animate-[fadeIn_.3s_ease-out,slideUp_.3s_ease-out]"
        >
          {/* Header */}
          <div className={`relative overflow-hidden rounded-t-2xl bg-gradient-to-r ${urgencyColors[urgencyLevel]} ${urgencyOpacities[urgencyLevel]} p-6`}>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-white/20 p-2 backdrop-blur-sm">
                  <AlertTriangle className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 id="expiry-title" className="text-xl font-bold text-white">
                    {title}
                  </h1>
                  <p className="mt-1 text-sm text-white/90">{subtitle}</p>
                </div>
              </div>
              <button
                aria-label="Close"
                onClick={onDismiss}
                className="rounded-lg p-2 text-white/80 hover:bg-white/20 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="rounded-xl bg-slate-50/60 p-4 ring-1 ring-slate-200/60">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-slate-900">{item.name}</h3>
                  <p className="mt-1 text-sm text-slate-600">Subscription product</p>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
                    <Clock className="h-4 w-4" />
                    <span>{item.daysLeft === 0 ? "Today" : `${item.daysLeft} day${item.daysLeft === 1 ? "" : "s"}`}</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">remaining</p>
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-slate-500" />
                <span className="text-sm font-medium text-slate-700">Expiry date</span>
              </div>
              <span className="text-sm font-semibold text-slate-900">{item.dateLabel}</span>
            </div>

            {/* Progress */}
            <div className="mt-6">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-medium text-slate-700">Renewal progress</span>
                <span className="text-sm font-semibold text-slate-900">{progressPct}%</span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100 ring-1 ring-slate-200/50">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${urgencyColors[urgencyLevel]} ${urgencyOpacities[urgencyLevel]} transition-all duration-700 ease-out`}
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <div className="mt-2 flex justify-between text-xs text-slate-500">
                <span>Start</span>
                <span>Due</span>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                onClick={onDismiss}
                className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-50 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 active:scale-95"
              >
                Remind me later
              </button>

              <button
                ref={primaryBtnRef}
                onClick={onRenew}
                disabled={!item.renewUrl}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#4a56d2] to-[#1a237e] px-5 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:shadow-xl hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-[#4a56d2] focus:ring-offset-2 active:scale-95 disabled:from-slate-400 disabled:to-slate-400 disabled:shadow-none"
              >
                {item.renewUrl ? (
                  <>
                    <Zap className="h-4 w-4" />
                    Renew now
                  </>
                ) : (
                  "OK"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpiryModal;
