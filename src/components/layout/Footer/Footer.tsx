import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  FiArrowRight,
  FiMail,
  FiTwitter,
  FiYoutube,
  FiGithub,
  FiLinkedin,
  FiArrowUpRight,
} from 'react-icons/fi';
import upholictech from '../../../assets/Upholictech.png'; // adjust if needed

const Footer: React.FC = () => {
  // Navbar links for consistency
  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'About', path: '/about' },
    { name: 'Pricing', path: '/pricing' },
  ];

  // Services: Journaling → TradeKhata (same route unless you change it)
  const services = [
    { name: 'Technical Scanner', path: '/technical-scanner' },
    { name: 'Fundamental Scanner', path: '/fundamental-scanner' },
    { name: 'ALGO Simulator', path: '/algo-simulator' },
    { name: 'FNO Khazana', path: '/fno-khazana' },
    { name: 'TradeKhata', path: '/journaling' }, // ← renamed only
    { name: 'FIIs/DIIs Data', path: '/fiis-diis-data' },
  ];

  const resources = [
    { name: 'Docs', path: '/docs' },
    { name: 'Tutorials', path: '/tutorials' },
    { name: 'Changelog', path: '/changelog' },
    { name: 'Roadmap', path: '/roadmap' },
    { name: 'Community', path: '/community' },
    { name: 'Status', path: '/status' },
  ];

  const company = [
    { name: 'Careers', path: '/careers' },
    { name: 'Partners', path: '/partners' },
    { name: 'Contact', path: '/contact' },
    { name: 'Press Kit', path: '/press' },
  ];

  const legal = [
    { name: 'Terms', path: '/terms' },
    { name: 'Privacy', path: '/privacy' },
    { name: 'Compliance', path: '/compliance' },
  ];

  const [email, setEmail] = useState('');
  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    // TODO: connect to your backend/newsletter provider
    console.log('Subscribe:', email);
    setEmail('');
  };

  const year = new Date().getFullYear();

  return (
    <footer className="relative bg-[#0d1342] text-gray-300">
      <div className="pointer-events-none absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(80%_60%_at_50%_-10%,rgba(121,134,203,0.16),transparent_60%)]" />

      <div className="max-w-8xl mx-auto px-6 sm:px-8 lg:px-12 pt-16 pb-8">
        {/* Brand + CTA */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
          {/* Brand */}
          <div className="col-span-1">
            <div className="flex items-center gap-3">
              <img
                src={upholictech}
                alt="Upholic Technologies"
                className="h-10 w-auto drop-shadow-[0_6px_20px_rgba(79,209,197,0.35)]"
              />
             
            </div>

            <p className="mt-4 text-gray-300/90 text-left leading-relaxed max-w-md">
  Your end-to-end trading stack—pro scanners, ALGO Simulator, F&O analytics, FIIs/DIIs dashboards, TradeKhata journal, and Algo Trading automation—to research, execute, and review with discipline.
</p>


            {/* Socials */}
            <div className="mt-6 flex items-center gap-3">
              {[
                { icon: <FiTwitter />, label: 'Twitter', href: '#' },
                { icon: <FiYoutube />, label: 'YouTube', href: '#' },
                { icon: <FiGithub />, label: 'GitHub', href: '#' },
                { icon: <FiLinkedin />, label: 'LinkedIn', href: '#' },
              ].map((s, i) => (
                <motion.a
                  key={i}
                  href={s.href}
                  aria-label={s.label}
                  whileHover={{ y: -2 }}
                  className="p-2 rounded-lg border border-white/10 hover:border-cyan-400/50 hover:bg-white/5 transition"
                >
                  <span className="text-gray-300 text-lg">{s.icon}</span>
                </motion.a>
              ))}
            </div>
          </div>

          {/* CTA card */}
          <motion.div
            whileHover={{ y: -2 }}
            className="relative col-span-1 lg:col-span-2 overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#141a58] via-[#0f164b] to-[#0b113d] p-6 md:p-8"
          >
            <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-cyan-500/20 blur-3xl" />
            <div className="absolute -left-24 -bottom-24 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl" />

            <div className="relative z-10 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
  <div>
    <h3 className="text-white text-2xl md:text-3xl font-bold tracking-tight">
      Build your trading stack with Upholic
    </h3>
    <p className="mt-2 text-gray-300/90 max-w-2xl">
      Technical & Fundamental Scanners, ALGO Simulator, FNO Khazana, FIIs/DIIs dashboards, and the TradeKhata journal—
      an integrated toolkit to research, test, execute, and review in one place.
    </p>
  </div>
  <motion.a
    whileHover={{ x: 3 }}
    href="/about"  // or "/pricing" if you prefer
    className="inline-flex items-center gap-2 rounded-xl bg-cyan-500/90 hover:bg-cyan-400 text-gray-900 font-semibold px-5 py-3 shadow-lg shadow-cyan-500/20 transition"
  >
    Explore now
    <FiArrowUpRight />
  </motion.a>
</div>

          </motion.div>
        </div>

        {/* Mega links grid */}
        <div className="mt-12 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-8">
          {/* Explore */}
          <div>
            <h4 className="text-white font-semibold tracking-wide mb-4">Explore</h4>
            <ul className="space-y-3">
              {navLinks.map((l) => (
                <li key={l.name}>
                  <a href={l.path} className="text-gray-300/90 hover:text-white transition">
                    {l.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Products/Services */}
          <div className="lg:col-span-2">
            <h4 className="text-white font-semibold tracking-wide mb-4">Products &amp; Scanners</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
              <ul className="space-y-3">
                {services.slice(0, Math.ceil(services.length / 2)).map((s) => (
                  <li key={s.name}>
                    <a href={s.path} className="text-gray-300/90 hover:text-white transition">
                      {s.name}
                    </a>
                  </li>
                ))}
              </ul>
              <ul className="space-y-3 mt-3 sm:mt-0">
                {services.slice(Math.ceil(services.length / 2)).map((s) => (
                  <li key={s.name}>
                    <a href={s.path} className="text-gray-300/90 hover:text-white transition">
                      {s.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-white font-semibold tracking-wide mb-4">Resources</h4>
            <ul className="space-y-3">
              {resources.map((r) => (
                <li key={r.name}>
                  <a href={r.path} className="text-gray-300/90 hover:text-white transition">
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
                  <a href={c.path} className="text-gray-300/90 hover:text-white transition">
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
                  <a href={l.path} className="text-gray-300/90 hover:text-white transition">
                    {l.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Newsletter */}
        <div className="mt-12 rounded-2xl border border-white/10 p-6 md:p-8 bg-white/5">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <h5 className="text-white text-xl font-semibold">Get weekly trading insights</h5>
              <p className="text-gray-300/90 mt-1">
                Short, actionable emails on journaling, risk, and consistency.
              </p>
            </div>

            <form onSubmit={handleSubscribe} className="w-full md:w-auto flex items-center gap-3">
              <div className="relative flex-1 md:flex-none">
                <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@trader.com"
                  className="w-full md:w-80 pl-10 pr-4 py-3 rounded-xl bg-[#0a1036] border border-white/10 text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400/50 transition"
                />
              </div>
              <motion.button
                whileHover={{ x: 2 }}
                type="submit"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-cyan-500/90 hover:bg-cyan-400 text-gray-900 font-semibold shadow-md shadow-cyan-500/20 transition"
              >
                Subscribe
                <FiArrowRight />
              </motion.button>
            </form>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 pt-6 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 text-sm">
          <p className="text-gray-400">© {year} Upholic Technologies. All rights reserved.</p>
          
          <a
            href="#top"
            className="inline-flex items-center gap-2 text-gray-300 hover:text-white transition"
            aria-label="Back to top"
          >
            Back to top <FiArrowUpRight />
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
