// src/components/dashboard/views/BundleDashboardBody.tsx
import React from "react";
import { BookOpen, Building2, ChevronRight, Lock } from "lucide-react";
import { ProductUI } from "../types";

type Props = {
  journalingLink: string;
  fiiDiiLink: string;
  ownsFiiDii: boolean;
  showFiiDiiInQuickAccess: boolean;
  loadingEntitlements: boolean;
  productsUI: ProductUI[];
};

const BundleDashboardBody: React.FC<Props> = ({
  journalingLink,
  fiiDiiLink,
  ownsFiiDii,
  showFiiDiiInQuickAccess,
  productsUI,
}) => {
  // Detect whether FNO is included in the bundle (or present in productsUI)
  const hasFnoInBundle =
    productsUI.some((p) =>
      Array.isArray((p as any).bundleComponents)
        ? (p as any).bundleComponents.some((c: any) => (c?.key || "").toLowerCase() === "fno_khazana")
        : false
    ) ||
    // or present as a standalone product card
    productsUI.some((p) => (p.id || "").toString().toLowerCase().includes("fno") || (p.name || "").toLowerCase().includes("fno"));

  const showFnoQuickAccess = !!hasFnoInBundle;

  // If FNO is present in bundle we can safely point to /fno (bundle owners will have access).
  // If not present, route to pricing for call-to-action.
  const fnoLink = showFnoQuickAccess ? "/fno" : "/pricing";

  return (
    <>
      {/* Welcome */}
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <h1 className="text-left text-3xl font-bold text-gray-900 mb-2">
              Trader’s Essentials{" "}
              <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                Dashboard
              </span>
            </h1>
            <p className="text-gray-600 text-lg">
              Jump into <span className="text-indigo-600 font-semibold">Smart Journaling</span>
              {showFiiDiiInQuickAccess && " and "}
              {showFiiDiiInQuickAccess && <span className="text-emerald-600 font-semibold">FII/DII Data</span>}
              {showFiiDiiInQuickAccess && showFnoQuickAccess && " and "}
              {showFnoQuickAccess && <span className="text-emerald-600 font-semibold">FNO Khazana</span>}{" "}
              tools.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <a
              href="/pricing"
              className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 font-medium"
              aria-label="Explore plans"
            >
              Explore Plans
            </a>
          </div>
        </div>
      </div>

      {/* Quick Access */}
      <div
        className={`grid grid-cols-1 md:grid-cols-${showFiiDiiInQuickAccess && showFnoQuickAccess ? "3" : showFiiDiiInQuickAccess || showFnoQuickAccess ? "2" : "1"
          } gap-6 mb-8`}
      >
        {/* Journaling Card */}
        <a href={journalingLink} className="group bg-white rounded-2xl border border-slate-100 p-6 hover:shadow-lg transition">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-indigo-600 text-white">
                <BookOpen className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Smart Journaling</h3>
                <p className="text-slate-600">Upload orderbooks, analyze trades, and track performance.</p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-slate-600" />
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
            <span className="px-2 py-1 rounded-full bg-indigo-50 text-indigo-700">Journal</span>
            <span className="px-2 py-1 rounded-full bg-slate-100 text-slate-700">Analytics</span>
          </div>
        </a>

        {/* FII/DII Card */}
        {showFiiDiiInQuickAccess && (
          <a
            href={ownsFiiDii ? fiiDiiLink : "/pricing"}
            className="group bg-white rounded-2xl border border-slate-100 p-6 hover:shadow-lg transition relative"
          >
            {!ownsFiiDii && (
              <span className="absolute top-4 right-4 inline-flex items-center gap-1 px-2 py-1 text-[11px] rounded-full bg-amber-100 text-amber-700">
                <Lock className="h-3 w-3" />
                Locked
              </span>
            )}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-emerald-600 text-white">
                  <Building2 className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">FII/DII Data</h3>
                  <p className="text-slate-600">Participant-wise OI, sector flows, and daily insights.</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-slate-600" />
            </div>
            <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
              <span className="px-2 py-1 rounded-full bg-emerald-50 text-emerald-700">Flows</span>
              <span className="px-2 py-1 rounded-full bg-slate-100 text-slate-700">Heatmaps</span>
            </div>
            <p className="mt-3 text-xs text-slate-500">
              {ownsFiiDii ? "Open your FII/DII dashboards." : "Unlock FII/DII analytics in the Essentials Bundle."}
            </p>
          </a>
        )}

        {/* FNO Card */}
        {showFnoQuickAccess && (
          <a
            href={fnoLink}
            className="group bg-white rounded-2xl border border-slate-100 p-6 hover:shadow-lg transition relative"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-sky-600 text-white">
                  <Building2 className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">FNO Khazana</h3>
                  <p className="text-slate-600">Options & F&O analytics — option chain, liquidity and flows.</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-slate-600" />
            </div>
            <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
              <span className="px-2 py-1 rounded-full bg-sky-50 text-sky-700">Options</span>
              <span className="px-2 py-1 rounded-full bg-slate-100 text-slate-700">Chains</span>
            </div>
            <p className="mt-3 text-xs text-slate-500">
              {showFnoQuickAccess ? "Open your FNO Khazana." : "Unlock FNO analytics in the Essentials Bundle."}
            </p>
          </a>
        )}
      </div>
    </>
  );
};

export default BundleDashboardBody;
