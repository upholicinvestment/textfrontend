import { useState, useRef, useEffect, useMemo, useContext } from "react";
import {
  FiChevronDown,
  FiMenu,
  FiX,
  FiLogIn,
  FiUserPlus,
  FiSearch,
  FiUser,
  FiHome,
  FiLogOut,
  FiBarChart2,
  FiBook,
  FiCpu,
  FiDollarSign,
  FiBookOpen,
  FiDatabase
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import upholictech from "../../../assets/Upholictech.png";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../../../context/AuthContext";

/** ---- Avatar assets + map (new keys) ---- */
import pinkImg from "../../../assets/pinkgirl.jpg";
import ponyImg from "../../../assets/ponygirl.jpg";
import brownImg from "../../../assets/brownboy.jpg";
import nerdImg from "../../../assets/nerdboy.jpg";
import redImg from "../../../assets/redhair.jpg";
import chadImg from "../../../assets/chadboy.jpg";

/** New keys you use in Profile */
const AVATAR_MAP = {
  sienna:  brownImg,  // legacy "brown"
  analyst: nerdImg,   // legacy "nerd"
  rose:    pinkImg,   // legacy "pink"
  comet:   ponyImg,   // legacy "pony"
  crimson: redImg,    // legacy "red"
  prime:   chadImg,   // legacy "chad"
} as const;

/** Legacy → New key mapping */
const LEGACY_KEY_MAP: Record<string, keyof typeof AVATAR_MAP> = {
  brown:  "sienna",
  nerd:   "analyst",
  pink:   "rose",
  pony:   "comet",
  red:    "crimson",
  chad:   "prime",
};

type SearchItem = {
  label: string;
  path: string;
  group: "Pages" | "Services";
};

type MeResponse = {
  name?: string;
  email?: string;
  avatarKey?: string;
  avatarUrl?: string;
};

const API_BASE = import.meta.env.VITE_API_BASE_URL || "https://api.upholictech.com/api";

const Navbar = () => {
  const navigate = useNavigate();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isServicesOpen, setIsServicesOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [hoveredNavItem, setHoveredNavItem] = useState<number | null>(null);

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeIdx, setActiveIdx] = useState(0);

  const servicesRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // ▼ Auth (context + localStorage fallback)
  const auth = useContext(AuthContext) as any;
  const authUser = auth?.user || null;

  const getStoredUser = () => {
    try { return JSON.parse(localStorage.getItem("user") || "null"); }
    catch { return null; }
  };

  // ensure we react to other tabs/login events
  const [userVersion, setUserVersion] = useState(0);
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === "user" || e.key === "token") setUserVersion(v => v + 1);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const storedUser = typeof window !== "undefined" ? getStoredUser() : null;
  const currentUser = authUser || storedUser;
  const isLoggedIn = !!currentUser;

  // ---- Hydrate avatar from /users/me if missing on the user object
  const [me, setMe] = useState<MeResponse | null>(null);
  useEffect(() => {
    let cancelled = false;
    const fetchMe = async () => {
      if (!isLoggedIn) { setMe(null); return; }

      const hasAvatarFields =
        (currentUser && (currentUser.avatarKey || currentUser.avatarUrl)) ||
        (me && (me.avatarKey || me.avatarUrl));

      if (hasAvatarFields) return;

      try {
        const token = localStorage.getItem("token") || "";
        if (!token) return;
        const res = await fetch(`${API_BASE}/users/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) {
          console.warn("[Navbar] /users/me failed:", res.status, res.statusText);
          return;
        }
        const data: MeResponse = await res.json();
        if (!cancelled) setMe(data || null);
      } catch (err) {
        console.warn("[Navbar] /users/me network error:", err);
      }
    };
    fetchMe();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn, userVersion, authUser]);

  // ---- Resolve avatar fields in order: me -> currentUser
  const rawKey = (
    (me?.avatarKey ?? currentUser?.avatarKey) as string | undefined
  )?.toLowerCase();

  const normalizedKey =
    rawKey && (AVATAR_MAP as any)[rawKey]
      ? (rawKey as keyof typeof AVATAR_MAP)
      : rawKey && LEGACY_KEY_MAP[rawKey]
      ? LEGACY_KEY_MAP[rawKey]
      : undefined;

  const avatarSrc: string | undefined =
    (me?.avatarUrl as string | undefined) ||
    (currentUser?.avatarUrl as string | undefined) ||
    (normalizedKey ? AVATAR_MAP[normalizedKey] : undefined);

  const displayLetter = (
    (currentUser?.name && currentUser.name[0]) ||
    (currentUser?.email && currentUser.email[0]) ||
    "U"
  ).toUpperCase();

  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Scroll shadow / bg state
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Click outside to close popovers
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (servicesRef.current && !servicesRef.current.contains(event.target as Node)) {
        setIsServicesOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setSearchOpen(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ---- Services + Nav ----
  const services = [
    { 
      name: "Technical Scanner", 
      icon: <FiBarChart2 className="text-lg" />, 
      color: "bg-gradient-to-br from-purple-500 to-blue-500", 
      path: "/comming-soon",
      description: "Advanced technical analysis tools for market insights"
    },
    { 
      name: "Fundamental Scanner", 
      icon: <FiBook className="text-lg" />, 
      color: "bg-gradient-to-br from-blue-500 to-cyan-500", 
      path: "/comming-soon",
      description: "Deep dive into company fundamentals and valuations"
    },
    { 
      name: "ALGO Simulator", 
      icon: <FiCpu className="text-lg" />, 
      color: "bg-gradient-to-br from-pink-500 to-purple-500", 
      path: "/algo-simulator",
      description: "Test and optimize your trading strategies",
      badge: "Popular"
    },
    { 
      name: "FNO Khazana", 
      icon: <FiDollarSign className="text-lg" />, 
      color: "bg-gradient-to-br from-green-500 to-teal-500", 
      path: "/comming-soon",
      description: "Futures & Options market analysis and insights"
    },
    { 
      name: "TradeKhata", 
      icon: <FiBookOpen className="text-lg" />, 
      color: "bg-gradient-to-br from-indigo-500 to-violet-500", 
      path: "/Journaling",
      description: "Track and analyze your trading performance"
    },
    { 
      name: "FIIs/DIIs Data", 
      icon: <FiDatabase className="text-lg" />, 
      color: "bg-gradient-to-br from-cyan-500 to-blue-500", 
      path: "/fii-dii-fno-home",
      description: "Institutional investment data and trends"
    },
  ];

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "About", path: "/about" },
    { name: "Pricing", path: "/pricing" },
    { name: "Contact", path: "/contact-us" },
  ];

  useEffect(() => {
    if (!isMenuOpen) setIsServicesOpen(false);
  }, [isMenuOpen]);

  // ---- Search logic ----
  const searchable: SearchItem[] = useMemo(() => {
    const pages: SearchItem[] = navLinks.map((l) => ({ label: l.name, path: l.path, group: "Pages" }));
    const svc: SearchItem[] = services.map((s) => ({ label: s.name, path: s.path, group: "Services" }));
    return [...pages, ...svc];
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const results = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    const scored = searchable
      .map((item) => {
        const label = item.label.toLowerCase();
        const idx = label.indexOf(q);
        const score =
          idx === 0 ? 3 :
          idx > 0 ? 2 :
          label.split(" ").some((w) => w.startsWith(q)) ? 1 : 0;
        return { item, score };
      })
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score || a.item.label.localeCompare(b.item.label))
      .slice(0, 8)
      .map((x) => x.item);
    setActiveIdx(0);
    return scored;
  }, [searchQuery, searchable]);

  useEffect(() => {
    if (!searchOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (!results.length) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIdx((prev) => (prev + 1) % results.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIdx((prev) => (prev - 1 + results.length) % results.length);
      } else if (e.key === "Enter") {
        e.preventDefault();
        const target = results[activeIdx];
        if (target) {
          setSearchOpen(false);
          setIsMenuOpen(false);
          navigate(target.path);
        }
      } else if (e.key === "Escape") {
        setSearchOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [searchOpen, results, activeIdx, navigate]);

  const goTo = (path: string) => {
    setSearchOpen(false);
    setIsMenuOpen(false);
    navigate(path);
  };

  const highlight = (label: string) => {
    const q = searchQuery.trim();
    if (!q) return label;
    const idx = label.toLowerCase().indexOf(q.toLowerCase());
    if (idx === -1) return label;
    const before = label.slice(0, idx);
    const match = label.slice(idx, idx + q.length);
    const after = label.slice(idx + q.length);
    return (
      <>
        {before}
        <span className="text-white">{match}</span>
        {after}
      </>
    );
  };

  const handleLogout = () => {
    try {
      if (auth?.logout) auth.logout();
      else {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
    } finally {
      setIsProfileOpen(false);
      setIsMenuOpen(false);
      navigate("/");
    }
  };

  /* ---------- DIAGNOSTICS ---------- */
  useEffect(() => {
    console.groupCollapsed("%c[Navbar AvatarDebug]", "color:#8ab4f8;font-weight:600");
    console.log("currentUser:", currentUser);
    console.log("currentUser.avatarKey:", currentUser?.avatarKey);
    console.log("currentUser.avatarUrl:", currentUser?.avatarUrl);
    console.log("me (hydrated):", me);
    console.log("rawKey (lowercased):", rawKey);
    console.log("normalizedKey (after legacy map):", normalizedKey);
    console.log("avatarSrc (final):", avatarSrc);

    if (avatarSrc) {
      const img = new Image();
      img.onload = () => {
        console.log("✅ Avatar image loaded:", avatarSrc, `${img.naturalWidth}x${img.naturalHeight}`);
        console.groupEnd();
      };
      img.onerror = (e) => {
        console.warn("❌ Avatar image failed to load:", avatarSrc, e);
        console.groupEnd();
      };
      img.src = avatarSrc;
    } else {
      console.warn("ℹ️ No avatarSrc — will show initial letter");
      console.groupEnd();
    }

    (window as any).avatarDiag = () => {
      const report = {
        user: currentUser,
        me,
        rawKey,
        normalizedKey,
        avatarSrc,
        hasAssetForNormalizedKey: !!(normalizedKey && (AVATAR_MAP as any)[normalizedKey]),
      };
      console.info("[avatarDiag]", report);
      return report;
    };
  }, [currentUser, me, rawKey, normalizedKey, avatarSrc]);

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className={`sticky top-0 z-50 w-full ${
        isScrolled ? "bg-[#0a0b2a]/95 backdrop-blur-md" : "bg-[#0a0b2a]/80"
      } border-b`}
      style={{
        background: isScrolled
          ? "linear-gradient(to bottom, rgba(10, 11, 42, 0.98), rgba(6, 7, 30, 0.95))"
          : "linear-gradient(to bottom, rgba(10, 11, 42, 0.9), rgba(6, 7, 30, 0.85))",
        boxShadow: isScrolled
          ? "0 6px 28px rgba(0,0,0,0.35), 0 0 0 1px rgba(98,70,234,0.06) inset"
          : "0 6px 24px rgba(0,0,0,0.15)",
        borderColor: isScrolled ? "rgba(255,255,255,0.06)" : "transparent",
      }}
    >
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="flex-shrink-0 flex items-center">
            <motion.a href="/" className="relative inline-flex items-center gap-2">
              <motion.img src={upholictech} alt="UpHolic Logo" className="h-10 w-auto" />
              <span className="sr-only">Upholic Tech</span>
            </motion.a>
          </motion.div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex flex-1 justify-center items-center mx-4 lg:mx-8">
            <div className="flex space-x-1">
              {[
                { name: "Home", path: "/" },
                { name: "About", path: "/about" },
                { name: "Pricing", path: "/pricing" },
                { name: "Contact", path: "/contact-us" },
              ].map((link, index, arr) => {
                if (link.name === "About") {
                  return (
                    <div key={link.name} className="flex items-center">
                      {/* About Link */}
                      <motion.a
                        href={link.path}
                        onHoverStart={() => setHoveredNavItem(index)}
                        onHoverEnd={() => setHoveredNavItem(null)}
                        className="relative px-4 lg:px-6 py-2.5 text-gray-300 hover:text-white text-sm font-medium transition-colors duration-300"
                      >
                        <span className="relative">
                          {link.name}
                          <span className="absolute inset-x-0 -bottom-1 h-px bg-gradient-to-r from-transparent via-purple-500/0 to-transparent" />
                        </span>
                        {hoveredNavItem === index && (
                          <motion.span
                            layoutId="navHover"
                            className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-purple-500 to-blue-500"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ type: "spring", stiffness: 300 }}
                          />
                        )}
                      </motion.a>

                      {/* Services (between About and Pricing) */}
                      <div className="relative" ref={servicesRef}>
                        <motion.button
                          onHoverStart={() => setHoveredNavItem(arr.length)}
                          onHoverEnd={() => setHoveredNavItem(null)}
                          onClick={() => setIsServicesOpen(!isServicesOpen)}
                          onMouseEnter={() => setIsServicesOpen(true)}
                          className="group flex items-center px-4 lg:px-6 py-2.5 text-gray-300 hover:text-white text-sm font-medium transition-colors duration-300"
                        >
                          <span className="relative">
                            Services
                            <span className="absolute inset-x-0 -bottom-1 h-px bg-gradient-to-r from-transparent via-blue-500/0 to-transparent" />
                          </span>
                          <motion.span
                            animate={{ rotate: isServicesOpen ? 180 : 0 }}
                            transition={{ type: "spring", stiffness: 300 }}
                            className="ml-1.5 mt-1.5 text-gray-400 group-hover:text-white"
                          >
                            <FiChevronDown/>
                          </motion.span>
                          {hoveredNavItem === arr.length && (
                            <motion.span
                              layoutId="navHover"
                              className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-purple-500 to-blue-500"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ type: "spring", stiffness: 300 }}
                            />
                          )}
                        </motion.button>

                        <AnimatePresence>
                          {isServicesOpen && (
                            <motion.div
                              initial={{ opacity: 0, y: -15, scale: 0.98 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: -15, scale: 0.98 }}
                              transition={{ type: "spring", stiffness: 260, damping: 22 }}
                              className="absolute left-1/2 transform -translate-x-1/2 mt-3 w-[900px] z-50"
                              onMouseLeave={() => setIsServicesOpen(false)}
                            >
                              {/* gradient frame */}
                              <div className="rounded-2xl p-[1px] bg-gradient-to-br from-purple-500/40 via-fuchsia-500/30 to-blue-500/40 shadow-[0_25px_60px_-20px_rgba(98,70,234,0.45)]">
                                <div className="rounded-2xl bg-[#0e102b]/90 backdrop-blur-md border border-white/10 overflow-hidden">
                                  <div className="px-6 pt-5 pb-3 border-b border-white/10">
                                    <h3 className="text-sm tracking-wider text-white/70 uppercase">Our Premium Services</h3>
                                  </div>
                                  <div className="p-4">
                                    <div className="grid grid-cols-2 gap-2">
                                      {services.map((service) => (
                                        <Link
                                          key={service.name}
                                          to={service.path}
                                          className="group flex items-start p-3 rounded-xl transition-all duration-300 hover:bg-white/5 border border-transparent hover:border-white/10"
                                          onClick={() => setIsServicesOpen(false)}
                                        >
                                          <span className={`mr-4 ${service.color} rounded-xl w-12 h-12 flex items-center justify-center text-white text-xl shadow-lg shadow-black/30`}>
                                            {service.icon}
                                          </span>
                                          <div className="flex-1">
                                            <div className="flex items-center">
                                              <h4 className="font-semibold text-white group-hover:text-purple-300 transition-colors">
                                                {service.name}
                                              </h4>
                                              {service.badge && (
                                                <span className="ml-2 text-[10px] bg-purple-500/15 text-purple-300 px-2 py-0.5 rounded-full border border-purple-500/20">
                                                  {service.badge}
                                                </span>
                                              )}
                                            </div>
                                            <p className="text-xs text-left text-gray-400 mt-1 group-hover:text-gray-300">
                                              {service.description}
                                            </p>
                                          </div>
                                        </Link>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  );
                }

                // Render others normally
                return (
                  <motion.a
                    key={link.name}
                    href={link.path}
                    onHoverStart={() => setHoveredNavItem(index)}
                    onHoverEnd={() => setHoveredNavItem(null)}
                    className="relative px-4 lg:px-6 py-2.5 text-gray-300 hover:text-white text-sm font-medium transition-colors duration-300"
                  >
                    <span className="relative">
                      {link.name}
                      <span className="absolute inset-x-0 -bottom-1 h-px bg-gradient-to-r from-transparent via-purple-500/0 to-transparent" />
                    </span>
                    {hoveredNavItem === index && (
                      <motion.span
                        layoutId="navHover"
                        className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-purple-500 to-blue-500"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      />
                    )}
                  </motion.a>
                );
              })}
            </div>
          </div>

          {/* Right Side */}
          <div className="flex items-center space-x-2 sm:space-x-3 lg:space-x-4">
            {/* Desktop Search */}
            <motion.div
              ref={searchRef}
              className="hidden sm:flex items-center relative"
              animate={searchOpen ? { width: 280 } : { width: 44 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              {searchOpen && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="relative w-full"
                >
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search features..."
                    className="bg-[#0f1233] rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 w-full text-gray-200 placeholder-gray-500 border border-white/10 shadow-inner"
                    autoFocus={searchOpen}
                  />
                  {/* <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">
                    K
                  </span> */}
                </motion.div>
              )}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => {
                  setSearchOpen((v) => !v);
                  setTimeout(() => { if (searchOpen) setSearchQuery(""); }, 0);
                }}
                className={`p-2 rounded-full ${searchOpen ? "ml-2 bg-purple-500/10 text-purple-300" : "bg-transparent text-gray-300 hover:text-white"}`}
                style={{ backdropFilter: "blur(4px)"}}
                aria-label="Search"
              >
                <FiSearch className="text-lg" />
              </motion.button>

              {/* Results dropdown (desktop) */}
              <AnimatePresence>
                {searchOpen && results.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-full mt-2 left-0 right-0 rounded-xl bg-[#0e102b]/95 backdrop-blur-md border border-white/10 shadow-2xl overflow-hidden z-50"
                  >
                    <div className="max-h-72 overflow-auto py-2">
                      {results.map((r, i) => (
                        <button
                          key={r.group + r.path}
                          onMouseEnter={() => setActiveIdx(i)}
                          onClick={() => goTo(r.path)}
                          className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-2 ${
                            i === activeIdx ? "bg-purple-500/15 text-white" : "text-gray-300 hover:bg-purple-500/10 hover:text-white"
                          }`}
                        >
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20">
                            {r.group}
                          </span>
                          <span>{highlight(r.label)}</span>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Auth / Avatar (Desktop) */}
            {!isLoggedIn ? (
              <div className="hidden sm:flex items-center space-x-2 lg:space-x-3">
                <Link
                  to="/login"
                  className="px-3 py-2 lg:px-4 lg:py-2.5 rounded-lg text-white text-sm font-medium transition-all duration-300 border border-white/10 hover:border-white/20 hover:bg-white/5 flex items-center backdrop-blur-sm"
                >
                  <FiLogIn className="mr-1 lg:mr-2" />
                  <span className="hidden lg:inline">Login</span>
                </Link>
                <Link
                  to="/signup"
                  className="px-3 py-2 lg:px-4 lg:py-2.5 rounded-lg bg-gradient-to-r from-purple-500 to-blue-500 text-white text-sm font-medium transition-all duration-300 shadow-lg flex items-center hover:from-purple-600 hover:to-blue-600"
                >
                  <FiUserPlus className="mr-1 lg:mr-2" />
                  <span className="hidden lg:inline">Sign Up</span>
                </Link>
              </div>
            ) : (
              <div className="hidden sm:flex items-center relative" ref={profileRef}>
                <button
                  onClick={() => setIsProfileOpen((v) => !v)}
                  className="w-9 h-9 rounded-full overflow-hidden shadow-md focus:outline-none focus:ring-2 focus:ring-purple-500/50 border border-white/10 bg-gradient-to-r from-purple-500 to-blue-500"
                  aria-label="Open profile menu"
                >
                  {avatarSrc ? (
                    <img
                      src={avatarSrc}
                      alt="Profile avatar"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        console.warn("❌ <img> onError — failed to display avatar:", (e.target as HTMLImageElement).src);
                      }}
                    />
                  ) : (
                    <span className="w-full h-full grid place-items-center text-white font-semibold">
                      {displayLetter}
                    </span>
                  )}
                </button>

                <AnimatePresence>
                  {isProfileOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.98 }}
                      transition={{ duration: 0.18, ease: "easeOut" }}
                      className="absolute right-1 top-14 z-50"
                    >
                      {/* caret */}
                      <div className="absolute right-5 -top-2 h-4 w-4 rotate-45 rounded-sm bg-[#0e102b]/90 border border-white/10 backdrop-blur-md" />

                      {/* gradient frame */}
                      <div className="rounded-2xl p-[1px] bg-gradient-to-br from-purple-500/40 via-fuchsia-500/30 to-blue-500/40 shadow-[0_10px_30px_-10px_rgba(98,70,234,0.35)]">
                        {/* panel */}
                        <div
                          role="menu"
                          aria-label="Profile menu"
                          tabIndex={-1}
                          onKeyDown={(e) => {
                            if (e.key === "Escape") setIsProfileOpen(false);
                          }}
                          className="w-56 rounded-2xl bg-[#0e102b]/90 backdrop-blur-md border border-white/10 shadow-2xl overflow-hidden"
                        >
                          {/* header */}
                          <div className="px-4 py-3 bg-white/[0.02] border-b border-white/10">
                            <p className="text-[11px] tracking-wider text-white/60 uppercase">Quick Access</p>
                          </div>

                          {/* items */}
                          <div className="p-2">
                            <Link
                              to="/profile"
                              role="menuitem"
                              className="group flex items-center gap-3 w-full rounded-lg px-3 py-2.5 text-sm text-gray-200 hover:text-white hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/60 transition"
                              onClick={() => setIsProfileOpen(false)}
                            >
                              <span className="grid place-items-center h-8 w-8 rounded-md bg-purple-500/15 text-purple-300 group-hover:bg-purple-500/20 group-hover:text-purple-200 transition">
                                <FiUser className="h-4.5 w-4.5" />
                              </span>
                              <span className="flex-1">Profile</span>
                              <span className="opacity-0 group-hover:opacity-100 text-white/50 transition">⌘P</span>
                            </Link>

                            <div className="my-1 h-px bg-white/10" />

                            <Link
                              to="/dashboard"
                              role="menuitem"
                              className="group flex items-center gap-3 w-full rounded-lg px-3 py-2.5 text-sm text-gray-200 hover:text-white hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/60 transition"
                              onClick={() => setIsProfileOpen(false)}
                            >
                              <span className="grid place-items-center h-8 w-8 rounded-md bg-indigo-500/15 text-indigo-300 group-hover:bg-indigo-500/20 group-hover:text-indigo-200 transition">
                                <FiHome className="h-4.5 w-4.5" />
                              </span>
                              <span className="flex-1">Dashboard</span>
                              <span className="opacity-0 group-hover:opacity-100 text-white/50 transition">⌘D</span>
                            </Link>

                            <div className="my-1 h-px bg-white/10" />

                            <button
                              role="menuitem"
                              onClick={handleLogout}
                              className="group flex items-center gap-3 w-full rounded-lg px-3 py-2.5 text-sm text-red-300 hover:text-red-200 hover:bg-red-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/50 transition"
                            >
                              <span className="grid place-items-center h-8 w-8 rounded-md bg-red-500/10 text-red-300 group-hover:bg-red-500/15 group-hover:text-red-200 transition">
                                <FiLogOut className="h-4.5 w-4.5" />
                              </span>
                              <span className="flex-1">Logout</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Mobile menu button */}
            <div className="sm:hidden flex-shrink-0 flex items-center">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className={`inline-flex items-center justify-center p-2 rounded-full ${
                  isMenuOpen ? "bg-purple-500 text-white" : "text-gray-300 hover:text-white"
                } transition-all duration-300`}
                aria-label="Toggle menu"
                style={{
                  backdropFilter: "blur(4px)",
                  boxShadow: isMenuOpen ? "0 0 15px rgba(98, 70, 234, 0.5)" : "0 0 10px rgba(98, 70, 234, 0.2)",
                }}
              >
                {isMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
              </motion.button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            ref={mobileMenuRef}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="lg:hidden bg-[#0e102b]/95 backdrop-blur-md border-t border-white/10 overflow-hidden"
          >
            <div className="px-4 pt-4 pb-6 space-y-2">
              {/* Mobile search */}
              <motion.div
                className="flex flex-col gap-2 rounded-xl px-4 py-3 mb-2 border border-white/10 bg-[#10133a]/80"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                style={{
                  boxShadow: "0 0 10px rgba(98, 70, 234, 0.1)",
                  backdropFilter: "blur(4px)",
                }}
              >
                <div className="flex items-center gap-3">
                  <FiSearch className="text-purple-400 text-lg" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      if (!searchOpen) setSearchOpen(true);
                      setSearchQuery(e.target.value);
                    }}
                    placeholder="Search features..."
                    className="bg-transparent w-full focus:outline-none text-gray-200 placeholder-purple-400/70 text-sm"
                    autoFocus
                  />
                </div>

                {/* Results (mobile) */}
                {searchQuery && results.length > 0 && (
                  <div className="rounded-lg border border-white/10 overflow-hidden">
                    {results.map((r) => (
                      <button
                        key={r.group + r.path}
                        onClick={() => goTo(r.path)}
                        className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/5 flex items-center gap-2"
                      >
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20">
                          {r.group}
                        </span>
                        <span>{highlight(r.label)}</span>
                      </button>
                    ))}
                  </div>
                )}
                {searchQuery && results.length === 0 && (
                  <div className="text-xs text-gray-400 px-1">No results</div>
                )}
              </motion.div>

              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  className="block px-4 py-3 rounded-lg text-base font-medium text-gray-300 hover:text-white transition-all duration-300 backdrop-blur-sm border border-transparent hover:border-white/10 hover:bg-white/5"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.name}
                </Link>
              ))}

              {/* Services - Mobile */}
              <div className="relative" ref={servicesRef}>
                <button
                  onClick={() => setIsServicesOpen(!isServicesOpen)}
                  className="w-full flex justify-between items-center px-4 py-3 rounded-lg text-base font-medium text-gray-300 hover:text-white transition-all duration-300 backdrop-blur-sm border border-transparent hover:border-white/10 hover:bg-white/5"
                >
                  <span>Services</span>
                  <motion.span animate={{ rotate: isServicesOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                    <FiChevronDown />
                  </motion.span>
                </button>

                <AnimatePresence>
                  {isServicesOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="pl-2 mt-1 space-y-2 overflow-hidden"
                    >
                      {services.map((service) => (
                        <Link
                          key={service.name}
                          to={service.path}
                          className="flex items-center px-4 py-2.5 rounded-lg text-gray-300 hover:text-white transition-all duration-300 text-sm backdrop-blur-sm border border-transparent hover:border-white/10 hover:bg-white/5"
                          onClick={() => {
                            setIsServicesOpen(false);
                            setIsMenuOpen(false);
                          }}
                        >
                          <span className={`mr-3 text-lg ${service.color} rounded-full w-7 h-7 flex items-center justify-center text-white`}>
                            {service.icon}
                          </span>
                          {service.name}
                          <span className="ml-auto text[10px] bg-white/5 text-purple-200 px-2 py-0.5 rounded-full border border-white/10">
                            New
                          </span>
                        </Link>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Auth / User actions - Mobile */}
              <div className="pt-4 border-t border-white/10 mt-4">
                {!isLoggedIn ? (
                  <div className="space-y-3">
                    <Link
                      to="/login"
                      className="flex items-center justify-center w-full px-4 py-3 rounded-lg text-base font-medium text-gray-300 border border-white/10 hover:text-white transition-all duration-300 backdrop-blur-sm hover:bg-white/5"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <FiLogIn className="mr-2" /> Login
                    </Link>

                    <Link
                      to="/signup"
                      className="flex items-center justify-center w-full px-4 py-3 rounded-lg bg-gradient-to-r from-purple-500 to-blue-500 text-white text-base font-medium shadow-lg transition-all duration-300 hover:from-purple-600 hover:to-blue-600"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <FiUserPlus className="mr-2" /> Sign Up
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 px-4 py-2 text-gray-200">
                      <div className="w-9 h-9 rounded-full overflow-hidden border border-white/10 bg-gradient-to-r from-purple-500 to-blue-500">
                        {avatarSrc ? (
                          <img
                            src={avatarSrc}
                            alt="Profile avatar"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              console.warn("❌ <img> onError — failed to display avatar (mobile):", (e.target as HTMLImageElement).src);
                            }}
                          />
                        ) : (
                          <div className="w-full h-full grid place-items-center text-white font-semibold">
                            {displayLetter}
                          </div>
                        )}
                      </div>
                      <div className="text-sm">
                        <div className="font-medium">
                          {currentUser?.name || currentUser?.email || "User"}
                        </div>
                        <div className="text-xs text-gray-400">
                          {currentUser?.email || ""}
                        </div>
                      </div>
                    </div>

                    <Link
                      to="/profile"
                      className="flex items-center gap-2 px-4 py-3 rounded-lg text-gray-300 hover:text-white hover:bg-white/5 transition"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <FiUser /> Profile
                    </Link>
                    <Link
                      to="/dashboard"
                      className="flex items-center gap-2 px-4 py-3 rounded-lg text-gray-300 hover:text-white hover:bg-white/5 transition"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <FiHome /> Dashboard
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left flex items-center gap-2 px-4 py-3 rounded-lg text-red-300 hover:text-red-200 hover:bg-red-500/10 transition"
                    >
                      <FiLogOut /> Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

export default Navbar;
