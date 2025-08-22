import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  FiArrowRight,
  FiMail,
  // FiTwitter,
  // FiYoutube,
  // FiGithub,
  FiLinkedin,
  FiArrowUpRight,
} from 'react-icons/fi';
import upholictech from '../../../assets/Upholictech.png'; // adjust if needed

const Footer: React.FC = () => {
  // Navbar links for consistency
  const navLinks = [
    { name: 'Home', path: '/Home' },
    { name: 'About', path: '/about' },
    { name: 'Pricing', path: '/pricing' },
  ];

  // Services: Journaling → TradeKhata (same route unless you change it)
  const services = [
    { name: 'Technical Scanner', path: '/comming-soon' },
    { name: 'Fundamental Scanner', path: '/comming-soon' },
    { name: 'ALGO Simulator', path: '/comming-soon' },
    { name: 'FNO Khazana', path: '/fno-khazana' },
    { name: 'TradeKhata', path: '/journaling' }, // ← renamed only
    { name: 'FIIs/DIIs Data', path: '/main-fii-dii' },
  ];

  const resources = [
    { name: 'Docs', path: '/comming-soon' },
    { name: 'Tutorials', path: '/comming-soon' },
    { name: 'Changelog', path: '/comming-soon' },
    { name: 'Roadmap', path: '/comming-soon' },
    { name: 'Community', path: '/comming-soon' },
    { name: 'Status', path: '/comming-soon' },
  ];

  const company = [
    // { name: 'Careers', path: '/careers' },
    // { name: 'Partners', path: '/partners' },
    { name: 'Contact', path: '/contact-us' },
    // { name: 'Press Kit', path: '/press' },
  ];

  const legal = [
    { name: 'Terms&Condition', path: '/terms' },
    { name: 'Privacy Policy', path: '/privacy' },
    { name: 'Refund Policy', path: '/refund' },
  ];

  const [email, setEmail] = useState('');
  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    // TODO: connect to your backend/newsletter provider
    console.log('Subscribe:', email);
    setEmail('');
  };

  // Function to smoothly scroll to top
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const year = new Date().getFullYear();

  return (
    <footer className="relative bg-black text-gray-300">
      <div className="pointer-events-none absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-purple-500/60 to-transparent" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(80%60%_at_50%-10%,rgba(120,119,198,0.16),transparent_60%)]" />

      <div className="max-w-8xl mx-auto px-6 sm:px-8 lg:px-12 pt-16 pb-8">
        {/* Brand + CTA */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
          {/* Brand */}
          <div className="col-span-1">
            <div className="flex items-center gap-3">
              <img
                src={upholictech}
                alt="Upholic Technologies"
                className="h-12 w-auto drop-shadow-[0_6px_20px_rgba(159,122,234,0.35)]"
              />
            </div>

            <p className="mt-4 text-gray-400 text-left leading-relaxed max-w-md">
              Your end-to-end trading stack—pro scanners, ALGO Simulator, F&O analytics, FIIs/DIIs dashboards, TradeKhata journal, and Algo Trading automation—to research, execute, and review with discipline.
            </p>

            {/* Socials */}
            <div className="mt-6 flex items-center gap-3">
              {[
                // { icon: <FiTwitter />, label: 'Twitter', href: '#' },
                // { icon: <FiYoutube />, label: 'YouTube', href: '#' },
                // { icon: <FiGithub />, label: 'GitHub', href: '#' },
                { icon: <FiLinkedin />, label: 'LinkedIn', href: 'https://www.linkedin.com/company/upholic/posts/?feedView=all' },
              ].map((s, i) => (
                <motion.a
                  key={i}
                  href={s.href}
                  aria-label={s.label}
                  whileHover={{ y: -2 }}
                  className="p-2 rounded-lg border border-gray-700 hover:border-purple-500/50 hover:bg-gray-800 transition"
                >
                  <span className="text-gray-400 hover:text-white text-lg transition">{s.icon}</span>
                </motion.a>
              ))}
            </div>
          </div>

          {/* CTA card */}
          <motion.div
            whileHover={{ y: -2 }}
            className="relative col-span-1 lg:col-span-2 overflow-hidden rounded-2xl border border-gray-800 bg-gradient-to-br from-gray-900 via-gray-900 to-black p-6 md:p-8"
          >
            <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-purple-500/10 blur-3xl" />
            <div className="absolute -left-24 -bottom-24 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" />

            <div className="relative z-10 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
              <div>
                <h3 className="text-white text-2xl md:text-3xl font-bold tracking-tight">
                  Build your trading stack with Upholic
                </h3>
                <p className="mt-2 text-gray-400 max-w-2xl">
                  Technical & Fundamental Scanners, ALGO Simulator, FNO Khazana, FIIs/DIIs dashboards, and the TradeKhata journal—
                  an integrated toolkit to research, test, execute, and review in one place.
                </p>
              </div>
              <motion.a
                whileHover={{ x: 3 }}
                href="/about"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold px-5 py-3 shadow-lg shadow-purple-500/20 transition"
              >
                Explore now
                <FiArrowUpRight />
              </motion.a>
            </div>
          </motion.div>
        </div>

        {/* Mega links grid */}
        <div className="mt-12 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-8">
          {/* Explore */}
          <div>
            <h4 className="text-white font-semibold tracking-wide mb-4">Explore</h4>
            <ul className="space-y-3">
              {navLinks.map((l) => (
                <li key={l.name}>
                  <a href={l.path} className="text-gray-400 hover:text-white transition">
                    {l.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Products/Services - All 6 in one column */}
          <div>
            <h4 className="text-white font-semibold tracking-wide mb-4">Products &amp; Scanners</h4>
            <ul className="space-y-3">
              {services.map((s) => (
                <li key={s.name}>
                  <a href={s.path} className="text-gray-400 hover:text-white transition">
                    {s.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-white font-semibold tracking-wide mb-4">Resources</h4>
            <ul className="space-y-3">
              {resources.map((r) => (
                <li key={r.name}>
                  <a href={r.path} className="text-gray-400 hover:text-white transition">
                    {r.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-white font-semibold tracking-wide mb-4">Company</h4>
            <ul className="space-y-3">
              {company.map((c) => (
                <li key={c.name}>
                  <a href={c.path} className="text-gray-400 hover:text-white transition">
                    {c.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-white font-semibold tracking-wide mb-4">Legal</h4>
            <ul className="space-y-3">
              {legal.map((l) => (
                <li key={l.name}>
                  <a href={l.path} className="text-gray-400 hover:text-white transition">
                    {l.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Newsletter */}
        <div className="mt-12 rounded-2xl border border-gray-800 p-6 md:p-8 bg-gray-900">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <h5 className="text-white text-xl font-semibold">Get weekly trading insights</h5>
              <p className="text-gray-400 mt-1">
                Short, actionable emails on journaling, risk, and consistency.
              </p>
            </div>

            <form onSubmit={handleSubscribe} className="w-full md:w-auto flex items-center gap-3">
              <div className="relative flex-1 md:flex-none">
                <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@trader.com"
                  className="w-full md:w-80 pl-10 pr-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition"
                />
              </div>
              <motion.button
                whileHover={{ x: 2 }}
                type="submit"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold shadow-md shadow-purple-500/20 transition"
              >
                Subscribe
                <FiArrowRight />
              </motion.button>
            </form>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 pt-6 border-t border-gray-800 flex flex-col md:flex-row items-center justify-between gap-4 text-sm">
          <p className="text-gray-500">© {year} Upholic Technologies. All rights reserved.</p>
          
          <button
            onClick={scrollToTop}
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition"
            aria-label="Back to top"
          >
            Back to top <FiArrowUpRight />
          </button>
        </div>
      </div>
    </footer>
  );
};

export default Footer;