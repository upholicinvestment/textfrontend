import { useRef, useState } from "react";


import JournalDashboard from "../JournalDashboard/Journal_Dashboard";
import { SidebarLayout } from "../JournalDashboard/SidebarLayout";
import DailyJournal from "../JournalDashboard/DailyJournal";
import TradesTable from "../JournalDashboard/TradesTable";
import UploadButton from "../JournalDashboard/UploadButton";
import { FiChevronLeft, FiChevronRight, } from "react-icons/fi";

const SIDEBAR_WIDTH = 265;
const COLLAPSED_WIDTH = 80;
const TOP_OFFSET = 20;

const DRAWER_W = 280;

const Journal_Layout = () => {
  const [active, setActive] = useState("dashboard");
  const [showUpload, setShowUpload] = useState(false);
  
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarMobileOpen, setSidebarMobileOpen] = useState(false);
  const dashboardRef = useRef<any>(null);

  const handleUploadSuccess = () => {
    setShowUpload(false);
    setActive("dashboard");
    
    if (dashboardRef.current) dashboardRef.current.refreshStats();
  };

  const toggleSidebar = () => setSidebarCollapsed((c) => !c);

  return (
    <div className="min-h-screen bg-[#f7f8fa] relative">
      <style>{`
        /* Mobile edge handle */
        .edge-toggle {
          position: fixed; top: 56%; left: 0; transform: translateY(-50%);
          z-index: 60; height: 34px; width: 28px; border-radius: 0 8px 8px 0;
          background: #1b2033; border: 1px solid rgba(255,255,255,0.12); border-left: 0;
          display:flex; align-items:center; justify-content:center;
          box-shadow: 0 4px 16px rgba(0,0,0,0.35); transition: left .28s ease;
        }
        .mobile-drawer-panel {
          position: fixed; top: 0; left: 0; height: 100vh; width: ${DRAWER_W}px;
          background: #161a2b; border-right: 1px solid rgba(255,255,255,0.08);
          z-index: 59; transform: translateX(-100%); transition: transform .28s ease; will-change: transform;
          padding: 16px 12px;
        }
        .mobile-drawer-panel.open { transform: translateX(0); }

        /* Keep labels visible inside the drawer */
        @media (max-width: 640px) {
          .mobile-drawer-panel aside.glass-morphism.sidebar-glow { width: 100% !important; }
          .mobile-drawer-panel .sidebar-glow nav button { justify-content: flex-start !important; }
          .mobile-drawer-panel .sidebar-glow nav button > span:nth-of-type(2) { display: inline !important; }
          .mobile-upload-fab { position: fixed; left: 16px; bottom: 18px; z-index: 58; }
        }

        /* Never show mobile handle/drawer on tablet/desktop */
        @media (min-width: 641px) {
          .edge-toggle, .mobile-drawer-panel { display: none !important; }
        }

        /* Keep desktop/tablet collapse toggle above content */
        .sidebar-toggle-btn { z-index: 55; }
      `}</style>

      {/* Fixed Navbar + PriceScroll */}
     

      {/* Desktop/Tablet Sidebar */}
      <div
        className={`fixed top-0 left-0 h-screen bg-[#161a2b] border-r transition-all duration-300 hidden sm:block`}
        style={{ width: sidebarCollapsed ? COLLAPSED_WIDTH : SIDEBAR_WIDTH, height: "100vh" }}
      >
        <div className="h-full flex flex-col" >
          <SidebarLayout
            active={active}
            setActive={setActive}
            onUpload={() => setShowUpload(true)}
            collapsed={sidebarCollapsed}
            mode="sidebar"
          />
        </div>

        {/* Collapse/Expand Toggle (desktop/tablet) */}
        <button
          onClick={toggleSidebar}
          className="sidebar-toggle-btn absolute -right-3 top-1/2 bg-[#161a2b] text-white rounded-full p-1 border border-gray-600 shadow-md hover:bg-[#262c43] transition-all"
          style={{ marginTop: "-22px" }}
          tabIndex={0}
          aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {sidebarCollapsed ? <FiChevronRight size={20} /> : <FiChevronLeft size={20} />}
        </button>
      </div>

      {/* ===== Mobile ONLY: Edge Handle + Drawer ===== */}
      <button
        className="sm:hidden edge-toggle"
        style={{ left: sidebarMobileOpen ? DRAWER_W : 0 }}
        onClick={() => setSidebarMobileOpen((v) => !v)}
        aria-label={sidebarMobileOpen ? "Close menu" : "Open menu"}
      >
        {sidebarMobileOpen ? <FiChevronLeft /> : <FiChevronRight />}
      </button>

      <div className={`sm:hidden mobile-drawer-panel ${sidebarMobileOpen ? "open" : ""}`} style={{ paddingTop: 32 }}>
        <SidebarLayout
          active={active}
          setActive={(s) => {
            setActive(s);
            setSidebarMobileOpen(false);
          }}
          onUpload={() => {
            setShowUpload(true);
            setSidebarMobileOpen(false);
          }}
          collapsed={false}
          mode="drawer"
        />
      </div>

      {/* Overlay when drawer is open */}
      {sidebarMobileOpen && (
        <div className="sm:hidden fixed inset-0 bg-black/40 z-50" onClick={() => setSidebarMobileOpen(false)} />
      )}

      {/* Main content */}
      <div
        className={`transition-all duration-300 min-h-screen bg-[#0d0d14] ${sidebarCollapsed ? "sm:ml-[80px]" : "sm:ml-[265px]"} ml-0`}
        style={{ paddingTop: TOP_OFFSET }}
      >
        <div className="max-w-[1400px] mx-auto px-2 sm:px-4 md:px-8 pb-10">
          {/* Upload Modal */}
          {showUpload && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
              <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md relative">
                <UploadButton onUpload={handleUploadSuccess} />
                <button
                  className="absolute top-3 right-4 text-gray-400 hover:text-gray-800"
                  onClick={() => setShowUpload(false)}
                  aria-label="Close upload modal"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          {/* Sections */}
          {active === "dashboard" && <JournalDashboard ref={dashboardRef} />}
          {active === "journal" && <DailyJournal />}
          {active === "trades" && <TradesTable />}
        </div>
      </div>

   
    </div>
  );
};

export default Journal_Layout;
