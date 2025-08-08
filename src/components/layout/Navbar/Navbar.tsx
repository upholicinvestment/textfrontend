import { useState, useRef, useEffect } from "react";
import {
  FiChevronDown,
  FiMenu,
  FiX,
  FiLogIn,
  FiUserPlus,
  FiSearch,
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import upholictech from "../../../assets/Upholictech.png";
import { Link } from "react-router-dom";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isServicesOpen, setIsServicesOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [hoveredNavItem, setHoveredNavItem] = useState<number | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const servicesRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        servicesRef.current &&
        !servicesRef.current.contains(event.target as Node)
      ) {
        setIsServicesOpen(false);
      }
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setSearchOpen(false);
      }
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target as Node)
      ) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const services = [
    {
      name: "Technical Scanner",
      icon: "📊",
      color: "bg-gradient-to-br from-purple-500 to-blue-500",
      path: "/comming-soon",
    },
    {
      name: "Fundamental Scanner",
      icon: "📚",
      color: "bg-gradient-to-br from-blue-500 to-cyan-500",
      path: "/comming-soon",
    },
    {
      name: "ALGO Simulator",
      icon: "🤖",
      color: "bg-gradient-to-br from-pink-500 to-purple-500",
      path: "/comming-soon",
    },
    {
      name: "FNO Khazana",
      icon: "💰",
      color: "bg-gradient-to-br from-green-500 to-teal-500",
      path: "/fno-khazana",
    },
    {
      name: "Journaling",
      icon: "📓",
      color: "bg-gradient-to-br from-indigo-500 to-violet-500",
      path: "/comming-soon",
    },
    {
      name: "FIIs/DIIs Data",
      icon: "📈",
      color: "bg-gradient-to-br from-cyan-500 to-blue-500",
      path: "/main-fii-dii",
    },
  ];

  const navLinks = [
    {
      name: "Home",
      path: "/",
    },
    {
      name: "About",
      path: "/about",
    },
    {
      name: "Pricing",
      path: "/pricing",
    },
  ];

  // Close services when mobile menu closes
  useEffect(() => {
    if (!isMenuOpen) {
      setIsServicesOpen(false);
    }
  }, [isMenuOpen]);

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className={`fixed w-full z-50 ${
        isScrolled
          ? "bg-[#0a0b2a]/95 backdrop-blur-md"
          : "bg-[#0a0b2a]/80"
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
          {/* Logo with glow effect */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex-shrink-0 flex items-center"
          >
            <motion.a 
              href="/"
              className="relative"
            >
              <motion.img
                src={upholictech}
                alt="UpHolic Logo"
                className="h-10 w-auto"
              />
              <motion.span 
                // className="absolute inset-0 bg-purple-500 rounded-full blur-md opacity-0 hover:opacity-30 transition-opacity duration-300"
                initial={{ opacity: 0 }}
                whileHover={{ opacity: 0.3 }}
              />
            </motion.a>
          </motion.div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex flex-1 justify-center items-center mx-4 lg:mx-8">
            <div className="flex space-x-1">
              {navLinks.map((link, index) => (
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
              ))}

              {/* Services Dropdown with cosmic style */}
              <div className="relative" ref={servicesRef}>
                <motion.button
                  onHoverStart={() => setHoveredNavItem(navLinks.length)}
                  onHoverEnd={() => setHoveredNavItem(null)}
                  onClick={() => setIsServicesOpen(!isServicesOpen)}
                  className="flex items-center px-4 lg:px-6 py-2.5 text-gray-300 hover:text-white text-sm font-medium transition-colors duration-300"
                >
                  <span className="relative">
                    Services
                    <span className="absolute -right-2 -top-1 w-2 h-2 bg-purple-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                  </span>
                  <motion.span
                    animate={{ rotate: isServicesOpen ? 180 : 0 }}
                    transition={{ type: "spring", stiffness: 300 }}
                    className="ml-1.5"
                  >
                    <FiChevronDown />
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
                      transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 20,
                      }}
                      className="absolute left-1/2 transform -translate-x-1/2 mt-3 w-72 rounded-xl shadow-2xl bg-[#0e102b] border border-purple-500/20 overflow-hidden z-50 backdrop-blur-lg"
                      style={{
                        boxShadow: "0 10px 30px -10px rgba(98, 70, 234, 0.3)",
                      }}
                    >
                      <div className="py-2">
                        {services.map((service, index) => (
                          <motion.a
                            key={index}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            whileHover={{
                              x: 5,
                              backgroundColor: "rgba(98, 70, 234, 0.1)",
                            }}
                            href={service.path}
                            className={`flex items-center px-4 py-3 text-sm text-gray-300 hover:text-white transition-all duration-200 border-b border-purple-500/10 last:border-0 group`}
                          >
                            <span
                              className={`mr-3 text-lg ${service.color} rounded-full w-8 h-8 flex items-center justify-center text-white`}
                            >
                              {service.icon}
                            </span>
                            <span>{service.name}</span>
                            <span className="ml-auto text-xs bg-purple-500/10 text-purple-300 px-2 py-1 rounded-full group-hover:bg-purple-500/20 group-hover:text-purple-100 transition-colors">
                              New
                            </span>
                          </motion.a>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Right Side Elements */}
          <div className="flex items-center space-x-2 sm:space-x-3 lg:space-x-4">
            {/* Enhanced Search Bar with cosmic glow */}
            <motion.div
              ref={searchRef}
              className="hidden sm:flex items-center"
              animate={searchOpen ? { width: 180 } : { width: 40 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              {searchOpen && (
                <motion.input
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search features..."
                  className="bg-[#0e102b] rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 w-full text-gray-200 placeholder-gray-500"
                  autoFocus={searchOpen}
                  style={{
                    boxShadow: "0 0 10px rgba(98, 70, 234, 0.2)",
                    border: "1px solid rgba(98, 70, 234, 0.2)",
                  }}
                />
              )}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setSearchOpen(!searchOpen)}
                className={`p-2 rounded-full ${
                  searchOpen
                    ? "ml-2 bg-purple-500/10 text-purple-300"
                    : "bg-transparent text-gray-300 hover:text-white"
                }`}
                style={{
                  backdropFilter: "blur(4px)",
                }}
              >
                <FiSearch className="text-lg" />
              </motion.button>
            </motion.div>

            {/* Auth Buttons with cosmic gradient */}
            <div className="hidden sm:flex items-center space-x-2 lg:space-x-3">
              <motion.a
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                href="/login"
                className="px-3 py-2 lg:px-4 lg:py-2.5 rounded-lg text-white text-sm font-medium transition-all duration-300 border border-purple-500/30 hover:bg-purple-500/10 flex items-center backdrop-blur-sm"
                style={{
                  boxShadow: "0 0 15px rgba(98, 70, 234, 0.1)",
                }}
              >
                <FiLogIn className="mr-1 lg:mr-2" />
                <span className="hidden lg:inline">Login</span>
              </motion.a>
              <motion.a
                whileHover={{
                  scale: 1.05,
                  boxShadow: "0 4px 20px rgba(98, 70, 234, 0.4)",
                }}
                whileTap={{ scale: 0.98 }}
                href="/signup"
                className="px-3 py-2 lg:px-4 lg:py-2.5 rounded-lg bg-gradient-to-r from-purple-500 to-blue-500 text-white text-sm font-medium transition-all duration-300 shadow-lg flex items-center"
                style={{
                  boxShadow: "0 4px 15px rgba(98, 70, 234, 0.3)",
                }}
              >
                <FiUserPlus className="mr-1 lg:mr-2" />
                <span className="hidden lg:inline">Sign Up</span>
              </motion.a>
            </div>

            {/* Mobile menu button with cosmic glow */}
            <div className="sm:hidden flex-shrink-0 flex items-center">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className={`inline-flex items-center justify-center p-2 rounded-full ${
                  isMenuOpen
                    ? "bg-purple-500 text-white"
                    : "text-gray-300 hover:text-white"
                } transition-all duration-300`}
                aria-label="Toggle menu"
                style={{
                  backdropFilter: "blur(4px)",
                  boxShadow: isMenuOpen 
                    ? "0 0 15px rgba(98, 70, 234, 0.5)"
                    : "0 0 10px rgba(98, 70, 234, 0.2)",
                }}
              >
                {isMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
              </motion.button>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Mobile Menu with cosmic theme */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            ref={mobileMenuRef}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="lg:hidden bg-[#0e102b] border-t border-purple-500/20 overflow-hidden backdrop-blur-lg"
            style={{
              boxShadow: "0 10px 30px -10px rgba(98, 70, 234, 0.3)",
            }}
          >
            <div className="px-4 pt-4 pb-6 space-y-2">
              {/* Mobile search with cosmic glow */}
              <motion.div
                className="flex items-center bg-[#1a1c3a] rounded-lg px-4 py-3 mb-4 border border-purple-500/20"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                style={{
                boxShadow: "0 0 10px rgba(98, 70, 234, 0.1)",
                backdropFilter: "blur(4px)",
                background: "rgba(14, 16, 43, 0.7)",
                border: "1px solid rgba(98, 70, 234, 0.1)",
                // boxShadow: "0 0 15px rgba(98, 70, 234, 0.2)",
              }}
              >
                <FiSearch className="text-purple-400 mr-3 text-lg" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search features..."
                  className="bg-transparent w-full focus:outline-none text-gray-200 placeholder-purple-400/70 text-sm"
                  autoFocus
                />
              </motion.div>

              {navLinks.map((link, index) => (
                <motion.a
                  key={link.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 + 0.2 }}
                  whileHover={{
                    x: 5,
                    color: "#ffffff",
                    backgroundColor: "rgba(98, 70, 234, 0.1)",
                  }}
                  href={link.path}
                  className="block px-4 py-3 rounded-lg text-base font-medium text-gray-300 hover:text-white transition-all duration-300 backdrop-blur-sm"
                  onClick={() => setIsMenuOpen(false)}
                  style={{
                    border: "1px solid rgba(98, 70, 234, 0.1)",
                  }}
                >
                  {link.name}
                </motion.a>
              ))}

              {/* Services Dropdown - Mobile */}
              <div className="relative" ref={servicesRef}>
                <motion.button
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: (navLinks.length + 1) * 0.05 + 0.2 }}
                  whileHover={{
                    x: 5,
                    color: "#ffffff",
                    backgroundColor: "rgba(98, 70, 234, 0.1)",
                  }}
                  onClick={() => setIsServicesOpen(!isServicesOpen)}
                  className="w-full flex justify-between items-center px-4 py-3 rounded-lg text-base font-medium text-gray-300 hover:text-white transition-all duration-300 backdrop-blur-sm"
                  style={{
                    border: "1px solid rgba(98, 70, 234, 0.1)",
                  }}
                >
                  <span>Services</span>
                  <motion.span
                    animate={{ rotate: isServicesOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <FiChevronDown />
                  </motion.span>
                </motion.button>

                <AnimatePresence>
                  {isServicesOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="pl-6 mt-1 space-y-2 overflow-hidden"
                    >
                      {services.map((service, index) => (
                        <motion.a
                          key={index}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.03 }}
                          whileHover={{
                            x: 5,
                            color: "#ffffff",
                            backgroundColor: "rgba(98, 70, 234, 0.1)",
                          }}
                          href={service.path}
                          className="flex items-center px-4 py-2.5 rounded-lg text-gray-300 hover:text-white transition-all duration-300 text-sm backdrop-blur-sm"
                          onClick={() => {
                            setIsServicesOpen(false);
                            setIsMenuOpen(false);
                          }}
                          style={{
                            border: "1px solid rgba(98, 70, 234, 0.1)",
                          }}
                        >
                          <span
                            className={`mr-3 text-lg ${service.color} rounded-full w-7 h-7 flex items-center justify-center text-white`}
                          >
                            {service.icon}
                          </span>
                          {service.name}
                          <span className="ml-auto text-xs bg-purple-500/10 text-purple-300 px-2 py-1 rounded-full">
                            New
                          </span>
                        </motion.a>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Auth Buttons - Mobile with cosmic gradients */}
              <div className="pt-4 border-t border-purple-500/20 mt-4">
                <div className="space-y-3">
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: (navLinks.length + 2) * 0.05 + 0.2 }}
                    whileHover={{
                      x: 5,
                      borderColor: "rgba(98, 70, 234, 0.5)",
                      backgroundColor: "rgba(98, 70, 234, 0.1)",
                    }}
                  >
                    <Link
                      to="/login"
                      className="flex items-center justify-center w-full px-4 py-3 rounded-lg text-base font-medium text-gray-300 border border-purple-500/30 hover:text-white transition-all duration-300 backdrop-blur-sm"
                      onClick={() => setIsMenuOpen(false)}
                      style={{
                        boxShadow: "0 0 15px rgba(98, 70, 234, 0.1)",
                      }}
                    >
                      <FiLogIn className="mr-2" /> Login
                    </Link>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: (navLinks.length + 2.5) * 0.05 + 0.2 }}
                    whileHover={{
                      x: 5,
                      scale: 1.02,
                      boxShadow: "0 4px 20px rgba(98, 70, 234, 0.4)",
                    }}
                    whileTap={{ scale: 0.99 }}
                  >
                    <Link
                      to="/signup"
                      className="flex items-center justify-center w-full px-4 py-3 rounded-lg bg-gradient-to-r from-purple-500 to-blue-500 text-white text-base font-medium shadow-lg transition-all duration-300"
                      onClick={() => setIsMenuOpen(false)}
                      style={{
                        boxShadow: "0 4px 15px rgba(98, 70, 234, 0.4)",
                      }}
                    >
                      <FiUserPlus className="mr-2" /> Sign Up
                    </Link>
                  </motion.div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

export default Navbar;