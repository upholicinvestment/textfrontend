import React from "react";
import { BookOpen, Building2, ChevronRight, Lock, ArrowUpRight } from "lucide-react";
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
  loadingEntitlements,
  productsUI,
}) => {
  return (
    <>
      {/* Welcome */}
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <h1 className="text-left text-3xl font-bold text-gray-900 mb-2">
              Trader’s Essentials{" "}
              <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">Dashboard</span>
            </h1>
            <p className="text-gray-600 text-lg">
              Jump into <span className="text-indigo-600 font-semibold">Smart Journaling</span>
              {showFiiDiiInQuickAccess && (
                <>
                  {" "}and <span className="text-emerald-600 font-semibold">FII/DII Data</span> tools.
                </>
              )}
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
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
      </div>

      {/* Your Tools (reused cards) */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-md">
        <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-800 mb-1">Your Tools</h2>
              <p className="text-slate-500">Access the modules included in your plan</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          {loadingEntitlements ? (
            <div className="text-sm text-slate-500">Loading your tools…</div>
          ) : productsUI.length === 0 ? (
            <div className="text-slate-600 text-sm">You don’t have any products yet.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {productsUI.map((product) => (
                <a
                  key={product.id}
                  href={product.link}
                  className="group relative p-5 rounded-xl border border-indigo-100 shadow-sm transition-all duration-200 overflow-hidden bg-gradient-to-br from-indigo-50 to-white"
                  aria-label={`Access ${product.name}`}
                >
                  <div className="relative">
                    <div className="flex items-start justify-between mb-3">
                      <div
                        className="p-2 rounded-lg text-white"
                        style={{ background: "linear-gradient(90deg, #6366F1 0%, #8B5CF6 100%)" }}
                      >
                        {product.icon}
                      </div>
                      {product.newFeature && (
                        <span className="px-2 py-1 text-xs font-medium bg-gradient-to-r from-teal-500 to-emerald-500 text-white rounded-full shadow-sm">
                          NEW
                        </span>
                      )}
                    </div>

                    <h3 className="font-semibold text-indigo-700 mb-1 transition-colors">{product.name}</h3>
                    <p className="text-sm text-slate-500 mb-3">{product.description}</p>

                    {product.bundleComponents && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {product.bundleComponents.map((c) => (
                          <span key={c.key} className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] bg-indigo-100 text-indigo-700">
                            {c.icon}
                            {c.label}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-400">{product.stats}</span>
                      <div className={`flex items-center text-sm font-medium ${product.trend === "up" ? "text-emerald-600" : "text-rose-600"}`}>
                        <ArrowUpRight className="h-3 w-3" />
                        {product.change}
                      </div>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default BundleDashboardBody;
