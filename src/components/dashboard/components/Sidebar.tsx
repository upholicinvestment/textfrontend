import React from "react";
import { Bot, BookOpen, Home as HomeIcon, LogOut, PackageOpen, ChevronDown, ChevronRight } from "lucide-react";
import upholictech from "../../../assets/Upholictech.png";
import { MyProduct, MyVariant } from "../types";
import { bundleComponentKeys, componentLabelMap, componentRouteMap } from "../utils/misc";

type Props = {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;

  myProducts: MyProduct[];
  ownedKeys: Set<string>;
  hasAllBundle: boolean;

  journalingLink: string;
  algoLink: string;

  userName?: string | null;
  onLogout: () => void;
};

const Sidebar: React.FC<Props> = ({
  isSidebarOpen,
  toggleSidebar,
  myProducts,
  ownedKeys,
  hasAllBundle,
  journalingLink,
  algoLink,
  userName,
  onLogout,
}) => {
  // compute sidebar bundles/components locally (same logic)
  const sidebarBundleComponents = (
    hasAllBundle
      ? bundleComponentKeys
      : myProducts
          .filter((p) => bundleComponentKeys.includes(p.key))
          .map((p) => p.key)
  ).map((key) => ({
    key,
    label: componentLabelMap[key]?.label || key,
    icon: componentLabelMap[key]?.icon || <PackageOpen className="h-4 w-4" />,
    href:
      myProducts.find((p) => p.key === key)?.route ||
      componentRouteMap[key] ||
      "#",
  }));

  // compute algo variant list for menu
  const algoEntitlements = myProducts.filter((p) => p.key === "algo_simulator");
  const algoVariantBadges: MyVariant[] = (() => {
    const list: MyVariant[] = [];
    for (const p of algoEntitlements) {
      if (Array.isArray(p.variants) && p.variants.length) list.push(...p.variants);
      else if (p.variant) list.push(p.variant);
    }
    const map = new Map<string, MyVariant>();
    for (const v of list) {
      const k = (v.key || "").toLowerCase();
      if (!map.has(k)) map.set(k, v);
    }
    return Array.from(map.values());
  })();

  const [bundleOpen, setBundleOpen] = React.useState(false);
  const [algoOpen, setAlgoOpen] = React.useState(false);

  const algoVariantHref = (key: string) => `${algoLink}?plan=${encodeURIComponent(key)}`;

  const variantBadgeClass = (key: string) => {
    const k = (key || "").toLowerCase();
    switch (k) {
      case "pro":
        return "bg-yellow-100 text-yellow-800";
      case "starter":
        return "bg-indigo-100 text-indigo-700";
      case "swing":
        return "bg-emerald-100 text-emerald-700";
      default:
        return "bg-white text-[#1a237e]";
    }
  };

  return (
    <div
      className={`${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 fixed md:static inset-y-0 left-0 z-50 w-72 
      bg-gradient-to-b from-[#1a237e] to-[#4a56d2] shadow-xl md:shadow-none transition-transform duration-300 ease-in-out`}
    >
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-[#7986cb]/30">
          <div className="flex-1 flex justify-center">
            <img src={upholictech} alt="Upholic" className="h-12 w-auto" />
          </div>
          <button onClick={toggleSidebar} className="md:hidden p-2 rounded-lg hover:bg-[#1a237e]/30" aria-label="Close sidebar">
            ✕
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          <div className="mb-4">
            <a
              href="#"
              className="flex items-center px-3 py-3 text-sm font-semibold text-white bg:white/20 rounded-xl border border-white/30"
              aria-current="page"
              style={{ backgroundColor: "rgba(255,255,255,0.2)" }}
            >
              <HomeIcon className="mr-3 h-5 w-5 text-white" />
              Dashboard
            </a>
          </div>

          <div className="space-y-1">
            <h3
              className="px-3 text-xs font-semibold text:white/70 uppercase tracking-wider mb-3"
              style={{ color: "rgba(255,255,255,0.7)" }}
            >
              Trading Products
            </h3>

            {(hasAllBundle || sidebarBundleComponents.length > 0) && (
              <>
                <button
                  type="button"
                  onClick={() => setBundleOpen((v) => !v)}
                  aria-expanded={bundleOpen}
                  aria-controls="bundle-submenu"
                  className="w-full group flex items-center justify-between px-3 py-3 text-left text-sm font-medium text-white rounded-xl hover:bg-white/10 transition-all duration-200"
                >
                  <div className="flex items-center">
                    <div className="p-2 rounded-lg bg-white/10 text-white mr-3">
                      <PackageOpen className="h-6 w-6" />
                    </div>
                    <span className="truncate">
                      {hasAllBundle ? "Trader's Essential Bundle" : "Your Tools"}
                    </span>
                  </div>
                  <ChevronDown
                    className={`h-4 w-4 text-white transition-transform ${bundleOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {bundleOpen && (
                  <div id="bundle-submenu" className="ml-4 mt-1 space-y-1 border-l border-white/20 pl-3">
                    {sidebarBundleComponents.map((c) => (
                      <a
                        key={c.key}
                        href={c.href}
                        className="flex items-center justify-between px-2 py-2 text-sm text-white/90 rounded-lg hover:bg-white/10"
                      >
                        <span className="flex items-center gap-2">
                          {c.icon}
                          {c.label}
                        </span>
                        <ChevronRight className="h-4 w-4 opacity-50" />
                      </a>
                    ))}
                  </div>
                )}
              </>
            )}

            {ownedKeys.has("algo_simulator") && (
              <>
                <button
                  type="button"
                  onClick={() => setAlgoOpen((v) => !v)}
                  aria-expanded={algoOpen}
                  aria-controls="algo-submenu"
                  className="w-full group flex items-center justify-between px-3 py-3 text-left text-sm font-medium text-white rounded-xl hover:bg-white/10 transition-all duration-200"
                >
                  <div className="flex items-center">
                    <div className="p-2 rounded-lg bg-white/10 text-white mr-3">
                      <Bot className="h-6 w-6" />
                    </div>
                    <span className="truncate">ALGO Simulator</span>
                  </div>
                  <ChevronDown
                    className={`h-4 w-4 text-white transition-transform ${algoOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {algoOpen && (
                  <div id="algo-submenu" className="ml-4 mt-1 space-y-1 border-l border-white/20 pl-3">
                    {algoVariantBadges.length > 0 ? (
                      algoVariantBadges.map((v) => (
                        <a
                          key={v.key}
                          href={algoVariantHref(v.key)}
                          className="flex items-center justify-between px-2 py-2 text-sm text-white/90 rounded-lg hover:bg-white/10"
                          title={v.name}
                        >
                          <span className="flex items-center gap-2">
                            <Bot className="h-4 w-4" />
                            {v.name}
                          </span>
                          <span className={`px-2 py-0.5 text-[10px] rounded-full ${variantBadgeClass(v.key)}`}>
                            {v.key.toUpperCase()}
                          </span>
                        </a>
                      ))
                    ) : (
                      <a
                        href={algoLink}
                        className="flex items-center justify-between px-2 py-2 text-sm text-white/90 rounded-lg hover:bg-white/10"
                      >
                        <span className="flex items-center gap-2">
                          <Bot className="h-4 w-4" />
                          Open ALGO
                        </span>
                        <ChevronRight className="h-4 w-4 opacity-50" />
                      </a>
                    )}
                  </div>
                )}
              </>
            )}

            { (ownedKeys.has("journaling") || ownedKeys.has("journaling_solo")) && !hasAllBundle && (
              <a
                href={journalingLink}
                className="group flex items-center justify-between px-3 py-3 text-sm font-medium text-white rounded-xl hover:bg-white/10 transition-all duration-200"
                aria-label="Go to Smart Journaling"
              >
                <div className="flex items-center">
                  <div className="p-2 rounded-lg bg-white/10 text-white mr-3">
                    <BookOpen className="h-6 w-6" />
                  </div>
                </div>
                <div className="flex-1 flex items-center justify-between">
                  <span className="truncate">Smart Journaling</span>
                  <ChevronRight className="h-4 w-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </a>
            )}
          </div>
        </nav>

        {/* Buy Products */}
        <div className="px-4 pb-4">
          <a
            href="/pricing"
            className="w-full inline-flex items-center justify-center gap-2 px-3 py-3 text-sm font-semibold text-[#1a237e] bg-white rounded-xl border border-white/30 hover:bg-white/90 transition-all duration-200 shadow-sm"
            aria-label="Buy products"
          >
            <PackageOpen className="h-5 w-5" />
            Buy Products
          </a>
        </div>

        {/* Profile */}
        <div className="p-4 border-t border-[#7986cb]/30">
          <div className="flex items-center space-x-3 p-3 bg-white/10 rounded-xl">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-[#1a237e] font-semibold text-sm">
              {(userName || "?").charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{userName || "Member"}</p>
              <p className="text-xs text-white/70">Member</p>
            </div>
            <button className="p-1.5 rounded-lg hover:bg-white/20 transition-colors" aria-label="Logout" onClick={onLogout}>
              <LogOut className="h-4 w-4 text-white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
