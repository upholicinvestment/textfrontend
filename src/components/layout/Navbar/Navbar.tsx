import { useState, useRef, useEffect } from 'react';
import { FiChevronDown, FiMenu, FiX, FiLogIn, FiUserPlus, FiSearch } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import upholictech from '../../../assets/Upholictech.png';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isServicesOpen, setIsServicesOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [hoveredNavItem, setHoveredNavItem] = useState<number | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const servicesRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle click outside
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
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const services = [
    { 
      name: "Technical Scanner", 
      icon: "📊", 
      color: "bg-blue-500",
      path: "/technical-scanner" 
    },
    { 
      name: "Fundamental Scanner", 
      icon: "📚", 
      color: "bg-purple-500",
      path: "/fundamental-scanner" 
    },
    { 
      name: "ALGO Simulator", 
      icon: "🤖", 
      color: "bg-pink-500",
      path: "/algo-simulator" 
    },
    { 
      name: "FNO Khazana", 
      icon: "💰", 
      color: "bg-green-500",
      path: "/fno-khazana" 
    },
    { 
      name: "Journaling", 
      icon: "📓", 
      color: "bg-indigo-500",
      path: "/journaling" 
    },
    { 
      name: "FIIs/DIIs Data", 
      icon: "📈", 
      color: "bg-cyan-500",
      path: "/main-fii-dii" 
    },
  ];

  const navLinks = [
    { 
      name: "Home",
      path: "/" 
    },
    { 
      name: "About",
      path: "/about" 
    },
    { 
      name: "Pricing",
      path: "/pricing" 
    }
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
      className={`fixed w-full z-50 ${isScrolled ? 'bg-[#1a237e]/95 backdrop-blur-md shadow-lg' : 'bg-[#1a237e]'}`}
      style={{
        background: isScrolled
          ? 'linear-gradient(to bottom, rgba(26, 35, 126, 0.98), rgba(26, 35, 126, 0.92))'
          : '#1a237e',
        boxShadow: isScrolled ? '0 4px 30px rgba(0, 0, 0, 0.2)' : 'none'
      }}
    >
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">

          {/* Logo with improved spacing */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex-shrink-0 flex items-center"
          >
            <motion.a href="/">
              <motion.img
                src={upholictech}
                alt="UpHolic Logo"
                className="h-10 w-auto"
              />
            </motion.a>
          </motion.div>

          {/* Desktop Navigation - Now responsive from md breakpoint */}
          <div className="hidden md:flex flex-1 justify-center items-center mx-4 lg:mx-8">
            <div className="flex space-x-1">
              {navLinks.map((link, index) => (
                <motion.a
                  key={link.name}
                  href={link.path}
                  onHoverStart={() => setHoveredNavItem(index)}
                  onHoverEnd={() => setHoveredNavItem(null)}
                  className="relative px-4 lg:px-6 py-2.5 text-gray-200 hover:text-white text-sm font-medium transition-colors duration-300"
                >
                  {link.name}
                  {hoveredNavItem === index && (
                    <motion.span
                      layoutId="navHover"
                      className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-[#4a56d2] to-[#7986cb]"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ type: 'spring', stiffness: 300 }}
                    />
                  )}
                </motion.a>
              ))}

              {/* Services Dropdown with improved positioning */}
              <div className="relative" ref={servicesRef}>
                <motion.button
                  onHoverStart={() => setHoveredNavItem(navLinks.length)}
                  onHoverEnd={() => setHoveredNavItem(null)}
                  onClick={() => setIsServicesOpen(!isServicesOpen)}
                  className="flex z-100 items-center px-4 lg:px-6 py-2.5 text-gray-200 hover:text-white text-sm font-medium transition-colors duration-300"
                >
                  Services
                  <motion.span
                    animate={{ rotate: isServicesOpen ? 180 : 0 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                    className="ml-1.5"
                  >
                    <FiChevronDown />
                  </motion.span>
                  {hoveredNavItem === navLinks.length && (
                    <motion.span
                      layoutId="navHover"
                      className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-[#4a56d2] to-[#7986cb]"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ type: 'spring', stiffness: 300 }}
                    />
                  )}
                </motion.button>

                <AnimatePresence>
                  {isServicesOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -15, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -15, scale: 0.95 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                      className="absolute left-1/2 transform -translate-x-1/2 mt-3 w-72 rounded-xl shadow-2xl bg-[#1a237e] border border-[#4a56d2]/50 overflow-hidden z-50"
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
                              backgroundColor: 'rgba(74, 86, 210, 0.2)'
                            }}
                            href={service.path}
                            className={`flex items-center px-4 py-3 text-sm text-gray-200 hover:text-white transition-all duration-200 border-b border-[#4a56d2]/20 last:border-0`}
                          >
                            <span className={`mr-3 text-lg ${service.color} rounded-full w-8 h-8 flex items-center justify-center text-white`}>
                              {service.icon}
                            </span>
                            <span>{service.name}</span>
                            <span className="ml-auto text-xs text-gray-400">New</span>
                          </motion.a>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Right Side Elements with better spacing */}
          <div className="flex items-center space-x-2 sm:space-x-3 lg:space-x-4">
            {/* Enhanced Search Bar */}
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
                  className="bg-gray-100 dark:bg-gray-800 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full text-gray-800 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400"
                  autoFocus={searchOpen}
                />
              )}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setSearchOpen(!searchOpen)}
                className={`p-2 rounded-full ${searchOpen ? 'ml-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200' : 'bg-transparent text-gray-200 hover:text-white'}`}
              >
                <FiSearch className="text-lg" />
              </motion.button>
            </motion.div>

            {/* Auth Buttons - Now visible on tablet and up */}
            <div className="hidden sm:flex items-center space-x-2 lg:space-x-3">
              <motion.a
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                href="/login"
                className="px-3 py-2 lg:px-4 lg:py-2.5 rounded-lg text-white text-sm font-medium transition-all duration-300 border border-[#4a56d2] hover:bg-[#4a56d2]/20 flex items-center"
              >
                <FiLogIn className="mr-1 lg:mr-2" />
                <span className="hidden lg:inline">Login</span>
              </motion.a>
              <motion.a
                whileHover={{
                  scale: 1.05,
                  boxShadow: '0 4px 14px rgba(74, 86, 210, 0.4)'
                }}
                whileTap={{ scale: 0.98 }}
                href="/signup"
                className="px-3 py-2 lg:px-4 lg:py-2.5 rounded-lg bg-gradient-to-r from-[#4a56d2] to-[#7986cb] text-white text-sm font-medium transition-all duration-300 shadow-md flex items-center"
              >
                <FiUserPlus className="mr-1 lg:mr-2" />
                <span className="hidden lg:inline">Sign Up</span>
              </motion.a>
            </div>

            {/* Mobile menu button with better touch target */}
            <div className="sm:hidden flex-shrink-0 flex items-center">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className={`inline-flex items-center justify-center p-2 rounded-full ${isMenuOpen ? 'bg-[#4a56d2] text-white' : 'text-gray-200 hover:text-white'} transition-all duration-300`}
                aria-label="Toggle menu"
              >
                {isMenuOpen ? (
                  <FiX size={24} />
                ) : (
                  <FiMenu size={24} />
                )}
              </motion.button>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            ref={mobileMenuRef}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="lg:hidden bg-[#1a237e] border-t border-[#4a56d2]/30 overflow-hidden"
            style={{
              boxShadow: '0 10px 30px -10px rgba(0, 0, 0, 0.3)'
            }}
          >
            <div className="px-4 pt-4 pb-6 space-y-2">
              {/* Improved mobile search */}
              <motion.div
                className="flex items-center bg-[#4a56d2]/20 rounded-lg px-4 py-3 mb-4 border border-[#4a56d2]/30"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <FiSearch className="text-gray-400 mr-3 text-lg" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search features..."
                  className="bg-transparent w-full focus:outline-none text-gray-200 placeholder-gray-400 text-sm"
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
                    color: '#ffffff',
                    backgroundColor: 'rgba(74, 86, 210, 0.2)'
                  }}
                  href={link.path}
                  className="block px-4 py-3 rounded-lg text-base font-medium text-gray-300 hover:text-white transition-all duration-300"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.name}
                </motion.a>
              ))}

              {/* Enhanced Services Dropdown - Mobile */}
              <div className="relative" ref={servicesRef}>
                <motion.button
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: (navLinks.length + 1) * 0.05 + 0.2 }}
                  whileHover={{ 
                    x: 5, 
                    color: '#ffffff',
                    backgroundColor: 'rgba(74, 86, 210, 0.2)'
                  }}
                  onClick={() => setIsServicesOpen(!isServicesOpen)}
                  className="w-full flex justify-between items-center px-4 py-3 rounded-lg text-base font-medium text-gray-300 hover:text-white transition-all duration-300"
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
                      animate={{ opacity: 1, height: 'auto' }}
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
                            color: '#ffffff',
                            backgroundColor: 'rgba(74, 86, 210, 0.2)'
                          }}
                          href={service.path}
                          className="flex items-center px-4 py-2.5 rounded-lg text-gray-300 hover:text-white transition-all duration-300 text-sm"
                          onClick={() => {
                            setIsServicesOpen(false);
                            setIsMenuOpen(false);
                          }}
                        >
                          <span className={`mr-3 text-lg ${service.color} rounded-full w-7 h-7 flex items-center justify-center text-white`}>
                            {service.icon}
                          </span>
                          {service.name}
                          <span className="ml-auto text-xs text-gray-400">New</span>
                        </motion.a>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Auth Buttons - Mobile with better visual hierarchy */}
              <div className="pt-4 border-t border-[#4a56d2]/30 mt-4">
                <div className="space-y-3">
                  <motion.a
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: (navLinks.length + 2) * 0.05 + 0.2 }}
                    whileHover={{
                      x: 5,
                      borderColor: 'rgba(74, 86, 210, 0.5)',
                      backgroundColor: 'rgba(74, 86, 210, 0.1)'
                    }}
                    href="/login"
                    className="flex items-center justify-center w-full px-4 py-3 rounded-lg text-base font-medium text-gray-300 border border-[#4a56d2]/30 hover:text-white transition-all duration-300"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <FiLogIn className="mr-2" /> Login
                  </motion.a>
                  <motion.a
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: (navLinks.length + 2.5) * 0.05 + 0.2 }}
                    whileHover={{
                      x: 5,
                      scale: 1.02,
                      boxShadow: '0 4px 14px rgba(74, 86, 210, 0.4)'
                    }}
                    whileTap={{ scale: 0.99 }}
                    href="/signup"
                    className="flex items-center justify-center w-full px-4 py-3 rounded-lg bg-gradient-to-r from-[#4a56d2] to-[#7986cb] text-white text-base font-medium shadow-md transition-all duration-300"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <FiUserPlus className="mr-2" /> Sign Up
                  </motion.a>
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