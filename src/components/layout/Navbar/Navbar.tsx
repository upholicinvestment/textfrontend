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

type SearchItem = {
  label: string;
  path: string;
  group: "Pages" | "Services";
};

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
  const storedUser =
    typeof window !== "undefined"
      ? (() => {
          try {
            return JSON.parse(localStorage.getItem("user") || "null");
          } catch {
            return null;
          }
        })()
      : null;

  const currentUser = authUser || storedUser;
  const isLoggedIn = !!currentUser;

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
      path: "/fno-khazana",
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
      if (auth?.logout) {
        auth.logout();
      } else {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
    } finally {
      setIsProfileOpen(false);
      setIsMenuOpen(false);
      navigate("/");
    }
  };

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className={`sticky top-0 z-50 w-full ${
        isScrolled ? "bg-[#0a0b2a]/95 backdrop-blur-md" : "bg-[#0a0b2a]/80"
      }`}
      style={{
        background: isScrolled
          ? "linear-gradient(to bottom, rgba(10, 11, 42, 0.98), rgba(6, 7, 30, 0.95))"
          : "linear-gradient(to bottom, rgba(10, 11, 42, 0.9), rgba(6, 7, 30, 0.85))",
        boxShadow: isScrolled
          ? "0 4px 30px rgba(0, 0, 0, 0.3), 0 0 10px rgba(98, 70, 234, 0.2)"
          : "none",
        borderBottom: isScrolled
          ? "1px solid rgba(98, 70, 234, 0.1)"
          : "1px solid transparent",
      }}
    >
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="flex-shrink-0 flex items-center">
            <motion.a href="/" className="relative">
              <motion.img src={upholictech} alt="UpHolic Logo" className="h-10 w-auto" />
              <motion.span initial={{ opacity: 0 }} whileHover={{ opacity: 0.3 }} />
            </motion.a>
          </motion.div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex flex-1 justify-center items-center mx-4 lg:mx-8">
            <div className="flex space-x-1">
              {navLinks.map((link, index) => {
                // Insert Services after About
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
                        {link.name}
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

                      {/* Services (moved here between About and Pricing) */}
                      <div className="relative" ref={servicesRef}>
                        <motion.button
                          onHoverStart={() => setHoveredNavItem(navLinks.length)}
                          onHoverEnd={() => setHoveredNavItem(null)}
                          onClick={() => setIsServicesOpen(!isServicesOpen)}
                          onMouseEnter={() => setIsServicesOpen(true)}
                          className="flex items-center px-4 lg:px-6 py-2.5 text-gray-300 hover:text-white text-sm font-medium transition-colors duration-300"
                        >
                          <span className="relative">Services</span>
                          <motion.span
                            animate={{ rotate: isServicesOpen ? 180 : 0 }}
                            transition={{ type: "spring", stiffness: 300 }}
                            className="ml-1.5 mt-1.5"
                          >
                            <FiChevronDown/>
                          </motion.span>
                          {hoveredNavItem === navLinks.length && (
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
                              initial={{ opacity: 0, y: -15, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: -15, scale: 0.95 }}
                              transition={{ type: "spring", stiffness: 300, damping: 20 }}
                              className="absolute left-1/2 transform -translate-x-1/2 mt-3 w-[900px] rounded-xl shadow-2xl bg-[#0e102b] border border-purple-500/20 overflow-hidden z-50 backdrop-blur-lg"
                              style={{ boxShadow: "0 25px 50px -12px rgba(98, 70, 234, 0.4)" }}
                              onMouseLeave={() => setIsServicesOpen(false)}
                            >
                              <div className="p-6">
                                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                  <span className="bg-gradient-to-r from-purple-500 to-blue-500 bg-clip-text text-transparent">
                                    Our Premium Services
                                  </span>
                                </h3>

                                <div className="grid grid-cols-2 gap-2">
                                  {services.map((service) => (
                                    <Link
                                      key={service.name}
                                      to={service.path}
                                      className="group flex items-start p-3 rounded-lg transition-all duration-300 hover:bg-purple-500/10 border border-transparent hover:border-purple-500/30"
                                      onClick={() => setIsServicesOpen(false)}
                                    >
                                      <span className={`mr-4 ${service.color} rounded-lg w-12 h-12 flex items-center justify-center text-white text-xl shadow-lg`}>
                                        {service.icon}
                                      </span>
                                      <div className="flex-1">
                                        <div className="flex items-center">
                                          <h4 className="font-semibold text-white group-hover:text-purple-300 transition-colors">
                                            {service.name}
                                          </h4>
                                          {service.badge && (
                                            <span className="ml-2 text-xs bg-purple-500/10 text-purple-300 px-2 py-0.5 rounded-full">
                                              {service.badge}
                                            </span>
                                          )}
                                        </div>
                                        <p className="text-sm text-left text-gray-400 mt-1 group-hover:text-gray-300">
                                          {service.description}
                                        </p>
                                      </div>
                                    </Link>
                                  ))}
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  );
                }

                // Render other links normally (Home, Pricing, Contact)
                return (
                  <motion.a
                    key={link.name}
                    href={link.path}
                    onHoverStart={() => setHoveredNavItem(index)}
                    onHoverEnd={() => setHoveredNavItem(null)}
                    className="relative px-4 lg:px-6 py-2.5 text-gray-300 hover:text-white text-sm font-medium transition-colors duration-300"
                  >
                    {link.name}
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
              animate={searchOpen ? { width: 260 } : { width: 40 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              {searchOpen && (
                <motion.input
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search features..."
                  className="bg-[#0e102b] rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 w-full text-gray-200 placeholder-gray-500"
                  autoFocus={searchOpen}
                  style={{ boxShadow: "0 0 10px rgba(98, 70, 234, 0.2)", border: "1px solid rgba(98, 70, 234, 0.2)" }}
                />
              )}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => {
                  setSearchOpen((v) => !v);
                  setTimeout(() => {
                    if (searchOpen) setSearchQuery("");
                  }, 0);
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
                    className="absolute top-full mt-2 left-0 right-0 rounded-xl bg-[#0e102b] border border-purple-500/20 shadow-2xl overflow-hidden z-50"
                    style={{ boxShadow: "0 10px 30px -10px rgba(98, 70, 234, 0.3)" }}
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
                          <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300">
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
                  className="px-3 py-2 lg:px-4 lg:py-2.5 rounded-lg text-white text-sm font-medium transition-all duration-300 border border-purple-500/30 hover:bg-purple-500/10 flex items-center backdrop-blur-sm"
                  style={{ boxShadow: "0 0 15px rgba(98, 70, 234, 0.1)" }}
                >
                  <FiLogIn className="mr-1 lg:mr-2" />
                  <span className="hidden lg:inline">Login</span>
                </Link>
                <Link
                  to="/signup"
                  className="px-3 py-2 lg:px-4 lg:py-2.5 rounded-lg bg-gradient-to-r from-purple-500 to-blue-500 text-white text-sm font-medium transition-all duration-300 shadow-lg flex items-center"
                  style={{ boxShadow: "0 4px 15px rgba(98, 70, 234, 0.3)" }}
                >
                  <FiUserPlus className="mr-1 lg:mr-2" />
                  <span className="hidden lg:inline">Sign Up</span>
                </Link>
              </div>
            ) : (
              <div className="hidden sm:flex items-center" ref={profileRef}>
                <button
                  onClick={() => setIsProfileOpen((v) => !v)}
                  className="w-9 h-9 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold shadow-md flex items-center justify-center focus:outline-none"
                  aria-label="Open profile menu"
                >
                  {displayLetter}
                </button>

                <AnimatePresence>
                  {isProfileOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 6 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-1 top-16 w-48 rounded-xl bg-[#0e102b] border border-purple-500/20 shadow-2xl overflow-hidden z-50"
                      style={{ boxShadow: "0 10px 30px -10px rgba(98, 70, 234, 0.3)" }}
                    >
                      <Link
                        to="/profile"
                        className="flex items-center gap-2 px-4 py-3 text-sm text-gray-300 hover:text-white hover:bg-purple-500/10"
                        onClick={() => setIsProfileOpen(false)}
                      >
                        <FiUser /> Profile
                      </Link>
                      <Link
                        to="/dashboard"
                        className="flex items-center gap-2 px-4 py-3 text-sm text-gray-300 hover:text-white hover:bg-purple-500/10"
                        onClick={() => setIsProfileOpen(false)}
                      >
                        <FiHome /> Dashboard
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full text-left flex items-center gap-2 px-4 py-3 text-sm text-red-300 hover:text-red-200 hover:bg-red-500/10"
                      >
                        <FiLogOut /> Logout
                      </button>
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
            className="lg:hidden bg-[#0e102b] border-t border-purple-500/20 overflow-hidden backdrop-blur-lg"
            style={{ boxShadow: "0 10px 30px -10px rgba(98, 70, 234, 0.3)" }}
          >
            <div className="px-4 pt-4 pb-6 space-y-2">
              {/* Mobile search */}
              <motion.div
                className="flex flex-col gap-2 rounded-lg px-4 py-3 mb-2 border border-purple-500/20 bg-[#1a1c3a]"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                style={{
                  boxShadow: "0 0 10px rgba(98, 70, 234, 0.1)",
                  backdropFilter: "blur(4px)",
                  background: "rgba(14, 16, 43, 0.7)",
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
                  <div className="rounded-lg border border-purple-500/20 overflow-hidden">
                    {results.map((r) => (
                      <button
                        key={r.group + r.path}
                        onClick={() => goTo(r.path)}
                        className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-purple-500/10 flex items-center gap-2"
                      >
                        <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300">
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
                  className="block px-4 py-3 rounded-lg text-base font-medium text-gray-300 hover:text-white transition-all duration-300 backdrop-blur-sm border border-transparent hover:border-purple-500/30 hover:bg-purple-500/10"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.name}
                </Link>
              ))}

              {/* Services - Mobile (unchanged) */}
              <div className="relative" ref={servicesRef}>
                <button
                  onClick={() => setIsServicesOpen(!isServicesOpen)}
                  className="w-full flex justify-between items-center px-4 py-3 rounded-lg text-base font-medium text-gray-300 hover:text-white transition-all duration-300 backdrop-blur-sm border border-transparent hover:border-purple-500/30 hover:bg-purple-500/10"
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
                          className="flex items-center px-4 py-2.5 rounded-lg text-gray-300 hover:text-white transition-all duration-300 text-sm backdrop-blur-sm border border-transparent hover:border-purple-500/30 hover:bg-purple-500/10"
                          onClick={() => {
                            setIsServicesOpen(false);
                            setIsMenuOpen(false);
                          }}
                        >
                          <span className={`mr-3 text-lg ${service.color} rounded-full w-7 h-7 flex items-center justify-center text-white`}>
                            {service.icon}
                          </span>
                          {service.name}
                          <span className="ml-auto text-xs bg-purple-500/10 text-purple-300 px-2 py-1 rounded-full">
                            New
                          </span>
                        </Link>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Auth / User actions - Mobile */}
              <div className="pt-4 border-t border-purple-500/20 mt-4">
                {!isLoggedIn ? (
                  <div className="space-y-3">
                    <Link
                      to="/login"
                      className="flex items-center justify-center w-full px-4 py-3 rounded-lg text-base font-medium text-gray-300 border border-purple-500/30 hover:text-white transition-all duration-300 backdrop-blur-sm"
                      onClick={() => setIsMenuOpen(false)}
                      style={{ boxShadow: "0 0 15px rgba(98, 70, 234, 0.1)" }}
                    >
                      <FiLogIn className="mr-2" /> Login
                    </Link>

                    <Link
                      to="/signup"
                      className="flex items-center justify-center w-full px-4 py-3 rounded-lg bg-gradient-to-r from-purple-500 to-blue-500 text-white text-base font-medium shadow-lg transition-all duration-300"
                      onClick={() => setIsMenuOpen(false)}
                      style={{ boxShadow: "0 4px 15px rgba(98, 70, 234, 0.4)" }}
                    >
                      <FiUserPlus className="mr-2" /> Sign Up
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 px-4 py-2 text-gray-200">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold flex items-center justify-center">
                        {displayLetter}
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
                      className="flex items-center gap-2 px-4 py-3 rounded-lg text-gray-300 hover:text-white hover:bg-purple-500/10 transition"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <FiUser /> Profile
                    </Link>
                    <Link
                      to="/dashboard"
                      className="flex items-center gap-2 px-4 py-3 rounded-lg text-gray-300 hover:text-white hover:bg-purple-500/10 transition"
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
