import React, { useState } from "react";
import { Rocket, Globe2, HandHeart,} from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import CountUp from "react-countup";
import { useInView } from "react-intersection-observer";
import { Link } from "react-router-dom";

/** Brand gradient */
const GRAD = "from-[#1a237e] to-[#4a56d2]";
const GRAD_TEXT = `bg-gradient-to-r ${GRAD} bg-clip-text text-transparent`;

/** Tabs content */
const tabs = [
  {
    id: "mission",
    title: "Our Mission",
    icon: Rocket,
    description: "Providing complete trading solutions in one powerful platform.",
    bullets: [
      "All trading tools integrated in single platform",
      "Stock market knowledge powerhouse for traders",
      "Top-class algorithmic trading platform",
      "Solving the biggest problems in trading fraternity"
    ],
    content: "One platform for all trading needs - from beginners to professionals.",
  },
  {
    id: "vision",
    title: "Our Vision",
    icon: Globe2,
    description: "Creating the future of trading technology.",
    bullets: [
      "1M+ active traders across multiple countries",
      "Handling thousands of crores in daily trading volume",
      "Best operating system for modern trading",
      "Global standard for trading platforms"
    ],
    content: "Redefining how traders interact with financial markets worldwide.",
  },
  {
    id: "values",
    title: "Our Values",
    icon: HandHeart,
    description: "Principles that guide every product decision.",
   bullets: [
    "Integrity, speed, and reliability first",
    "Empathy and craft in every detail",
    "Openness, fairness, and accountability",
    "Continuous innovation driving trader success",
  ],
    content: "We ship fast, measure honestly, and protect capital before all else.",
  },
] as const;

/** Stats tiles */
const stats = [
  { 
    value: 3, 
    label: "Models Created", 
    color: "text-blue-400", 
    circleColor: "border-blue-500" 
  },
  { 
    value: 1.5, 
    label: "Trigger to Slippages", 
    color: "text-emerald-400", 
    circleColor: "border-emerald-500",
    suffix: "t" 
  },
  { 
    value: 10, 
    label: "Click to Trade", 
    color: "text-amber-400", 
    circleColor: "border-amber-500",
    suffix: "ms" 
  },
  { 
    value: 1, 
    label: "Daily Volume Handled", 
    color: "text-purple-400", 
    circleColor: "border-purple-500",
    suffix: "Cr+" 
  },
];

/* ---------- Inline SVG icons for the Values infographic ---------- */
const HourglassIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
    <path d="M6 2h12M6 22h12" />
    <path d="M8 2c0 4 4 6 4 6s4-2 4-6" />
    <path d="M8 22c0-4 4-6 4-6s4 2 4 6" />
    <path d="M9.5 9.5h5M9.5 14.5h5" opacity=".4" />
  </svg>
);
const TargetIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
    <circle cx="12" cy="12" r="8" />
    <circle cx="12" cy="12" r="4" />
    <path d="M18 6l3-3M18 6V3m0 3h3" />
  </svg>
);
const BulbIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
    <path d="M9 18h6" />
    <path d="M10 22h4" />
    <path d="M8 14a6 6 0 1 1 8 0c-1.2 1.1-2 2.5-2 4H10c0-1.5-.8-2.9-2-4Z" />
    <path d="M12 2v2M4 12H2m20 0h-2M5.6 5.6 4.2 4.2m14.2 1.4 1.4-1.4" opacity=".6" />
  </svg>
);
const TrophyIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
    <path d="M8 21h8M9 17h6v4H9z" />
    <path d="M7 5h10v3a5 5 0 0 1-10 0V5Z" />
    <path d="M17 6h3a4 4 0 0 1-4 4M7 6H4a4 4 0 0 0 4 4" />
  </svg>
);
const FlagIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
    <path d="M4 3v18" />
    <path d="M4 4h10l-1.5 3L16 10H4" />
  </svg>
);

/** Enhanced Values items with more detailed descriptions */
const valueItems = [
  { 
    title: "INTEGRITY",   
    desc: "Security-first architecture with transparent operations and strict compliance. We prioritize your capital protection above all else.",
    Icon: HourglassIcon, 
    colors: ["300 85% 60%","200 90% 60%","60 95% 55%"] 
  },
  { 
    title: "GOALS",       
    desc: "Clear objectives and key results aligned to trader profitability. Every feature is measured by its impact on your P&L.",
    Icon: TargetIcon,    
    colors: ["30 95% 58%","200 90% 60%","320 85% 60%"] 
  },
  { 
    title: "INNOVATION",  
    desc: "AI-driven market insights with continuous experimentation. We push boundaries to give you the trading edge you deserve.",
    Icon: BulbIcon, 
    colors: ["60 95% 55%","190 90% 60%","300 85% 60%"] 
  },
  { 
    title: "QUALITY",     
    desc: "Measured releases with deep observability and 99.99% uptime. Your trades execute flawlessly when it matters most.",
    Icon: TrophyIcon, 
    colors: ["200 90% 60%","90 90% 55%","320 85% 60%"] 
  },
  { 
    title: "EXCELLENCE",  
    desc: "Meticulous craftsmanship with institutional-grade performance. Every pixel and microsecond is optimized for your success.",
    Icon: FlagIcon,    
    colors: ["320 85% 60%","200 90% 60%","60 95% 55%"] 
  },
] as const;

const StatItem = ({ stat }: { stat: typeof stats[0] }) => {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.3 });

  return (
    <div className="flex flex-col items-center" ref={ref}>
      <div className="relative w-32 h-32 mb-6">
        {/* Outer animated circle */}
        <motion.div
          animate={inView ? { rotate: 360 } : { rotate: 0 }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          className={`absolute inset-0 rounded-full border-t-2 ${stat.circleColor} border-opacity-30`}
        />
        {/* Inner animated circle */}
        <motion.div
          animate={inView ? { rotate: -360 } : { rotate: 0 }}
          transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
          className={`absolute inset-4 rounded-full border-b-2 ${stat.circleColor} border-opacity-30`}
        />
        {/* Value display */}
        <div className="absolute inset-0 flex items-center justify-center">
          <h3 className={`text-3xl font-bold ${stat.color}`}>
            {inView ? (
              <CountUp 
                end={stat.value as number} 
                duration={2.5} 
                decimals={Number.isInteger(stat.value) ? 0 : 1} 
                suffix={stat.suffix ?? ""} 
              />
            ) : (
              "0"
            )}
          </h3>
        </div>
      </div>
      <p className="text-gray-300 text-sm uppercase tracking-wider font-medium text-center">
        {stat.label}
      </p>
    </div>
  );
};

export default function AboutSection() {
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]["id"]>("mission");
  const prefersReduced = useReducedMotion();

  const variants = {
    hidden: { opacity: 0, y: prefersReduced ? 0 : 24 },
    show:   { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
  } as const;

  const container = {
    hidden: { opacity: 0 },
    show:   { opacity: 1, transition: { staggerChildren: prefersReduced ? 0 : 0.08 } },
  } as const;

  return (
    <>
    <section id="about" className="relative bg-slate-950 text-slate-100 py-24 overflow-hidden">
      <div className="relative z-10 max-w-7xl mx-auto px-6">
        {/* Header */}
        <motion.div
          variants={variants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.5 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-6 border border-slate-800 bg-slate-900/60">
            <span className={`w-2 h-2 rounded-full bg-gradient-to-r ${GRAD}`} />
            <span className={GRAD_TEXT}>INNOVATING TRADING TECHNOLOGY</span>
          </div>
          <h2 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-4 text-white">
            Build the future of <span className={GRAD_TEXT}>trading</span>
          </h2>
          <p className="text-lg text-slate-300 max-w-3xl mx-auto">
            We combine institutional-grade infrastructure with intuitive design to create
            the most powerful yet accessible trading platform in the world.
          </p>
        </motion.div>

        {/* Tabs */}
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16"
        >
          {tabs.map((tab) => (
            <motion.button
              key={tab.id}
              variants={variants}
              whileHover={{ y: -4 }}
              onClick={() => setActiveTab(tab.id)}
              className={`relative text-left rounded-2xl overflow-hidden border transition-all bg-slate-900/60 ${
                activeTab === tab.id
                  ? "border-[#4a56d2]/60 ring-2 ring-[#4a56d2]/60"
                  : "border-slate-800 hover:border-[#4a56d2]/40"
              }`}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${GRAD} opacity-10`} />
              <div className="relative z-10 p-7">
                <div className="flex items-center gap-4 mb-3">
                  <div className={`p-3 rounded-lg text-white bg-gradient-to-br ${GRAD}`}>
                    <tab.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-white">{tab.title}</h3>
                </div>
                <p className="text-slate-300">{tab.description}</p>
                <ul className="mt-4 space-y-2 text-sm text-slate-300/90 list-disc pl-5">
                  {tab.bullets.map((b, i) => (
                    <li key={i}>{b}</li>
                  ))}
                </ul>
                {activeTab === tab.id && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4 text-sm text-[#cdd0ff]"
                  >
                    {tab.content}
                  </motion.p>
                )}
              </div>
            </motion.button>
          ))}
        </motion.div>

        {/* Stats */}
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-20"
        >
          {stats.map((stat, i) => (
            <StatItem key={i} stat={stat} />
          ))}
        </motion.div>

        {/* Enhanced Core Values — infographic */}
        <motion.div
          variants={variants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.4 }}
          className="relative mb-24"
        >
          <h3 className="text-center text-4xl font-extrabold tracking-wide text-slate-100 mb-2">
            Our Core Values
          </h3>
          <p className="text-center text-slate-400 max-w-2xl mx-auto mb-8">
            The principles that drive every decision we make and every feature we build
          </p>

          {/* dashed connector baseline below heading */}
          <div className="relative mt-6 mb-10 h-10">
            <motion.div
              initial={{ scaleX: 0, opacity: 0.4 }}
              whileInView={{ scaleX: 1, opacity: 1 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              viewport={{ once: true, amount: 0.6 }}
              className="absolute inset-x-0 top-1/2 origin-left border-t border-dashed border-slate-700"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8">
            {valueItems.map(({ title, desc, Icon, colors }) => (
              <motion.article
                key={title}
                className="group flex flex-col items-center text-center focus:outline-none focus-visible:outline-none"
                initial={{ opacity: 0, y: 16, scale: 0.98 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, amount: 0.6 }}
                whileHover={{ y: -6 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                tabIndex={0}
                aria-label={title}
              >
                {/* circular neon gradient ring */}
                <div
                  className="relative p-[3px] rounded-full shadow-[0_0_0_1px_rgba(148,163,184,0.15)]"
                  style={{ ["--c1" as any]: colors[0], ["--c2" as any]: colors[1], ["--c3" as any]: colors[2] }}
                >
                  <div className="rounded-full p-[3px] bg-[conic-gradient(from_0deg,hsl(var(--c1)),hsl(var(--c2)),hsl(var(--c3)),hsl(var(--c1)))] animate-[spin_18s_linear_infinite] group-hover:animate-[spin_6s_linear_infinite]">
                    <div className="rounded-full bg-slate-950 p-3">
                      <div className="h-20 w-20 rounded-full flex items-center justify-center text-slate-100/90 shadow-[0_0_30px_hsl(var(--c2)/0.45)] group-hover:shadow-[0_0_38px_hsl(var(--c2)/0.7)] transition-shadow">
                        <Icon className="h-10 w-10" />
                      </div>
                    </div>
                  </div>
                  {/* focus ring */}
                  <span className="pointer-events-none absolute -inset-2 rounded-full opacity-0 group-focus-visible:opacity-100 ring-2 ring-[#4a56d2]/70 transition" />
                </div>

                {/* pointer + colored dot */}
                <div className="mt-4">
                  <div className="w-0 h-0 mx-auto border-l-[6px] border-r-[6px] border-l-transparent border-r-transparent border-t-[8px] border-t-slate-600 group-hover:border-t-slate-300 transition-colors" />
                  <div
                    className="mx-auto mt-3 h-3.5 w-3.5 rounded-full shadow-[0_0_18px_hsl(var(--c2)/0.7)] bg-[radial-gradient(circle_at_30%_30%,hsl(var(--c1))_0%,hsl(var(--c2))_50%,hsl(var(--c3))_100%)] group-hover:scale-110 transition-transform"
                    style={{ ["--c1" as any]: colors[0], ["--c2" as any]: colors[1], ["--c3" as any]: colors[2] }}
                  />
                </div>

                {/* label & description */}
                <h4 className="mt-5 text-sm font-bold tracking-[0.2em] text-slate-200 group-hover:text-white transition-colors">
                  {title}
                </h4>
                <p className="mt-2 text-sm text-slate-400 max-w-[22ch]">{desc}</p>
              </motion.article>
            ))}
          </div>
        </motion.div>

        {/* Enhanced CTA */}
        <motion.div
          variants={variants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.5 }}
          className="relative overflow-hidden rounded-3xl border border-slate-800"
        >
          <div className={`absolute inset-0 opacity-90 bg-gradient-to-r ${GRAD}`} />
          <div className="relative z-10 p-12 text-center">
            <h3 className="text-3xl font-bold text-white mb-3">
              Ready to Transform Your Trading?
            </h3>
            <p className="text-white/90 mb-8 max-w-2xl mx-auto">
              Join thousands of algorithmic traders who trust our platform for speed, reliability and performance.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="group relative px-8 py-4 text-white font-bold rounded-xl overflow-hidden transition-all duration-300 bg-gradient-to-r from-[#2a36a8] to-[#5a66e0] hover:from-[#25309a] hover:to-[#505cdc]">
                <div className="flex items-center gap-2">
                  <Link to='/signup'> Start Algo Trading Now</Link>
                  <span className="inline-block transition-transform duration-300 group-hover:translate-x-1">→</span>
                </div>
              </button>
              <Link to='/comming-soon' className="px-8 py-4 bg-transparent text-white font-bold rounded-xl border-2 border-white/30 hover:border-white/50 transition-all duration-300">
                See Platform Demo
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
    </>
  );
}