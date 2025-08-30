import React, { useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Code,
  TrendingUp,
  Database,
  Palette,
  Shield,
  Users,
  MapPin,
  Clock,
  ArrowRight,
  Briefcase,
  Bookmark,
  BookmarkCheck,
  Sparkles,
  Search,
  Filter,
  X,
  Share2,
  Phone,
} from "lucide-react";
import { Link } from "react-router-dom";

// ——————————————————————————————————————————————————————————
// CareersSection — Modal version (no layout shift)
// TailwindCSS + Framer Motion + lucide-react
// Primary theme: gradient #1a237e → #4a56d2
// ——————————————————————————————————————————————————————————

const ALL = "All";

// handy class snippets
const GRAD = "bg-gradient-to-r from-[#1a237e] to-[#4a56d2]";
const GRAD_HOVER = "hover:from-[#18206b] hover:to-[#4450cf]";
const GRAD_TEXT = "bg-gradient-to-r from-[#1a237e] to-[#4a56d2] bg-clip-text text-transparent";

/**
 * Departments collapsed to <= 5:
 * - Engineering (FE, BE, DevOps)
 * - Research (Quant)
 * - Design (UI/UX)
 * - Product (PM)
 * - Growth (Digital Marketing, Sales, Telecaller)
 */
const JOBS = [
  // ---------------- Engineering (Mumbai-only IT) ----------------
  {
    id: "fe",
    icon: Code,
    title: "Frontend Developer (React)",
    department: "Engineering",
    locations: ["Mumbai"],
    experience: { min: 2, max: 5 },
    type: "Full-time",
    posted: "7 days ago",
    description:
      "Build high-performance, real-time trading interfaces in React + Tailwind that feel instant and trustworthy. You will design and maintain a reusable component library, craft micro-interactions with smooth motion, and integrate live feeds (WebSockets) without frame drops. Accessibility, testing, DX, and observability matter to you as much as pixels do. Expect deep collaboration with quants and backend to evolve data contracts and state models.",
    mustHave: ["React", "JavaScript/TypeScript", "Tailwind", "REST/WebSockets"],
    niceToHave: ["Framer Motion", "Zustand/Redux", "Charting libs", "Vite"],
    responsibilities: [
      "Develop reusable UI kits and streaming charts for market data",
      "Co-design data contracts with backend & research teams",
      "Profile performance; target 60+ FPS interactions on mid-tier devices",
      "Own DX: storybook, tests, documentation, and CI checks",
    ],
    apply: "#apply-fe",
  },
  {
    id: "be",
    icon: Database,
    title: "Backend Developer (Node/Python)",
    department: "Engineering",
    locations: ["Mumbai"],
    experience: { min: 3, max: 6 },
    type: "Full-time",
    posted: "3 days ago",
    description:
      "Design and harden low-latency services that ingest market data, serve APIs, and run background jobs reliably. You’ll work with queues, caches, and idempotent processors, instrument everything with metrics/logs/traces, and own incident playbooks. The stack emphasizes correctness under load, clean boundaries, and simple rollbacks. Security, config hygiene, and predictable deployments are core to the job.",
    mustHave: ["Node.js", "TypeScript/Python", "MongoDB/Redis", "Queues/WebSockets"],
    niceToHave: ["gRPC", "Docker/K8s", "Timeseries DB", "CI/CD"],
    responsibilities: [
      "Own resilient marketfeed & order-routing services",
      "Implement batch & stream processors with strong idempotency",
      "Add observability (metrics/logs/traces) and actionable alerts",
      "Enforce auth, rate-limits, and safe defaults across endpoints",
    ],
    apply: "#apply-be",
  },
  {
    id: "devops",
    icon: Shield,
    title: "DevOps Engineer",
    department: "Engineering",
    locations: ["Mumbai"],
    experience: { min: 3, max: 7 },
    type: "Full-time",
    posted: "5 days ago",
    description:
      "Keep the platform blazing with IaC, robust CI/CD, and great observability. You’ll define Kubernetes standards, automate blue/green and canary rollouts, bake in cost guardrails, and ensure SLOs are real (and met). You’ll also partner with engineering on performance budgets, capacity planning, and incident response to reduce MTTR and protect customer trust.",
    mustHave: ["AWS/GCP", "Docker/K8s", "Terraform", "Observability"],
    niceToHave: ["Service mesh", "Cost guardrails", "Incident playbooks"],
    responsibilities: [
      "Scale ingestion & execution clusters safely and predictably",
      "Ship zero-downtime releases with progressive delivery",
      "Own SLOs/SLIs, on-call, and incident runbooks",
      "Harden security baselines and secrets management",
    ],
    apply: "#apply-devops",
  },

  // ---------------- Research ----------------
  {
    id: "quant",
    icon: TrendingUp,
    title: "Quantitative Analyst",
    department: "Research",
    locations: ["Mumbai"],
    experience: { min: 3, max: 5 },
    type: "Full-time",
    posted: "Today",
    description:
      "Research and evaluate systematic strategies with clean data, robust statistics, and risk controls. You’ll build reproducible backtests, track risk-adjusted performance (not just PnL), and stress strategies across regimes. Expect to write crisp research notes, run controlled experiments, and convert insights into production-ready specifications in partnership with engineering.",
    mustHave: ["Python", "Pandas/NumPy", "Stats/Prob", "Backtesting"],
    niceToHave: ["Options Greeks", "ML", "Microstructure", "Risk models"],
    responsibilities: [
      "Form hypotheses and run disciplined A/B experiments",
      "Clean/label large datasets; keep code & results reproducible",
      "Evaluate drawdowns, exposures, and regime sensitivity",
      "Hand off findings with clear specs and acceptance tests",
    ],
    apply: "#apply-quant",
  },

  // ---------------- Design ----------------
  {
    id: "design",
    icon: Palette,
    title: "UI/UX Designer",
    department: "Design",
    locations: ["Mumbai"],
    experience: { min: 2, max: 4 },
    type: "Full-time / Contract",
    posted: "12 days ago",
    description:
      "Translate complex financial data into intuitive, confident UI. You’ll define flows for dashboards, orders, and risk views; evolve tokens and components; prototype quickly; and validate with lightweight tests. Your work balances density and clarity—showing power users everything they need without overwhelming them.",
    mustHave: ["Product thinking", "Figma", "Design systems", "Prototyping"],
    niceToHave: ["Motion", "Data viz", "Accessibility", "Handoff docs"],
    responsibilities: [
      "Partner with engineering & research to shape end-to-end journeys",
      "Evolve our design system with tokens, states, and guidelines",
      "Prototype ideas and iterate from quick usability feedback",
      "Deliver thorough specs covering edge states and errors",
    ],
    apply: "#apply-design",
  },

  // ---------------- Product ----------------
  {
    id: "pm",
    icon: Users,
    title: "Product Manager",
    department: "Product",
    locations: ["Mumbai"],
    experience: { min: 4, max: 8 },
    type: "Full-time",
    posted: "9 days ago",
    description:
      "Own outcomes and clarity. You’ll talk to traders, map problems, define KPIs/OKRs, and write crisp PRDs. You’ll align research, design, and engineering, ship experiments safely, and iterate from data and feedback. The north star: make complex trading workflows simple, fast, and reliable.",
    mustHave: ["PRDs", "Prioritization", "Stakeholder mgmt", "Metrics"],
    niceToHave: ["Fintech", "APIs", "Backtesting", "Risk/Compliance"],
    responsibilities: [
      "Own strategy, OKRs, and success metrics for your area",
      "Write specs with acceptance criteria and test plans",
      "Facilitate fast decisions; keep feedback loops tight",
      "Launch, measure impact, and iterate deliberately",
    ],
    apply: "#apply-pm",
  },

  // ---------------- Growth ----------------
  {
    id: "dm",
    icon: Sparkles,
    title: "Digital Marketing Specialist",
    department: "Growth",
    locations: ["Bhopal"],
    experience: { min: 1, max: 4 },
    type: "Full-time",
    posted: "2 days ago",
    description:
      "Grow acquisition and activation for our trading product via performance and organic channels. You’ll own the campaign calendar, manage SEO/SEM, build landing pages with design/dev, and run experiments across the funnel. You’ll track CAC/LTV, improve conversion rates, and report insights that shape product and content strategy.",
    mustHave: ["SEO/SEM", "Google Ads", "GA/Search Console", "Social Media", "A/B Testing"],
    niceToHave: ["Fintech familiarity", "Basic HTML/CSS", "Figma/Canva", "Email automation"],
    responsibilities: [
      "Plan & execute paid + organic campaigns across search/social/email",
      "Run keyword research, technical SEO audits, and content briefs",
      "Launch, monitor, and optimize ads to strict CAC/CPL targets",
      "Collaborate on landing pages; instrument for analytics",
      "Publish weekly reports; make clear recommendations",
    ],
    apply: "#apply-dm",
  },
  {
    id: "sales",
    icon: Briefcase,
    title: "Sales Executive (Trading Product)",
    department: "Growth",
    locations: ["Bhopal"],
    experience: { min: 1, max: 3 },
    type: "Full-time",
    posted: "1 day ago",
    description:
      "Drive sign-ups and paid conversions through crisp demos, objection handling, and structured follow-ups. You’ll manage a pipeline in CRM, coordinate with marketing and support, and develop partnerships that expand reach. Success looks like predictable targets met and customers who stay.",
    mustHave: ["B2B/B2C Sales", "CRM hygiene", "Demo & Closing", "Communication"],
    niceToHave: ["Broking/Trading product sales", "Regional languages", "Channel partners"],
    responsibilities: [
      "Prospect & qualify leads from inbound and outbound sources",
      "Run tailored product demos; convert trials into paid plans",
      "Maintain pipeline, forecasts, and activity logs in CRM",
      "Share market feedback to influence roadmap & messaging",
      "Coordinate with support to ensure smooth onboarding",
    ],
    apply: "#apply-sales",
  },
  {
    id: "tele",
    icon: Phone,
    title: "Telecaller (Lead Qualification)",
    department: "Growth",
    locations: ["Bhopal"],
    experience: { min: 0, max: 2 },
    type: "Full-time / Contract",
    posted: "Today",
    description:
      "Qualify leads via outbound calls, understand needs, and schedule demos for the sales team. You’ll follow scripts, log outcomes diligently in CRM, and ensure timely follow-ups while respecting DNC and compliance guidelines.",
    mustHave: ["Hindi & English fluency", "Outbound Calling", "Listening Skills", "CRM updates"],
    niceToHave: ["Fintech awareness", "Script adaptation", "Target orientation"],
    responsibilities: [
      "Make daily outbound calls to warm/cold leads",
      "Qualify needs and schedule demos with sales",
      "Log call outcomes and next steps accurately in CRM",
      "Comply with DNC and privacy standards",
      "Report daily volumes, connects, and conversions",
    ],
    apply: "#apply-tele",
  },
];

const deptOptions = [ALL, ...Array.from(new Set(JOBS.map((j) => j.department)))];
const locationOptions = [ALL, ...Array.from(new Set(JOBS.flatMap((j) => j.locations)))];

const statPulse =
  "after:absolute after:inset-0 after:rounded-2xl after:bg-[#4a56d2]/10 after:blur-2xl after:opacity-0 hover:after:opacity-100 after:transition";

export default function CareersSection() {
  const [query, setQuery] = useState("");
  const [dept, setDept] = useState(ALL);
  const [loc, setLoc] = useState(ALL);
  const [expMax, setExpMax] = useState(10);
  const [saved, setSaved] = useState(() => new Set<string>());
  const [activeJob, setActiveJob] = useState<typeof JOBS[number] | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    if (copiedId) t = setTimeout(() => setCopiedId(null), 1200);
    return () => clearTimeout(t);
  }, [copiedId]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return JOBS.filter((j) => {
      const inDept = dept === ALL || j.department === dept;
      const inLoc = loc === ALL || j.locations.includes(loc);
      const inExp = j.experience.min <= expMax;
      const inQuery =
        !q ||
        [j.title, j.department, j.description, ...j.mustHave, ...j.niceToHave, ...j.locations]
          .join(" ")
          .toLowerCase()
          .includes(q);
      return inDept && inLoc && inExp && inQuery;
    });
  }, [dept, loc, expMax, query]);

  const stats = useMemo(() => {
    const roles = filtered.length;
    const teams = new Set(filtered.map((j) => j.department)).size;
    const cities = new Set(filtered.flatMap((j) => j.locations)).size;
    return { roles, teams, cities };
  }, [filtered]);

  const toggleSave = (id: string) => {
    setSaved((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const copyLink = async (job: typeof JOBS[number]) => {
    try {
      await navigator.clipboard.writeText(window.location.origin + job.apply);
      setCopiedId(job.id);
    } catch {
      setCopiedId(job.id);
    }
  };

  return (
    <section className="min-h-screen bg-slate-950 text-white py-16">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-[#1a237e]/10 border border-[#4a56d2]/30 rounded-full px-4 py-2 mb-5">
            <Sparkles className="w-4 h-4 text-[#4a56d2]" />
            <span className="text-sm font-medium" style={{ color: "#4a56d2" }}>
              We’re hiring across India
            </span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight">
            Build the future of <span className={GRAD_TEXT}>fintech</span>
          </h1>
          <p className="text-slate-300 max-w-3xl mx-auto mt-4 text-lg">
            Join a team crafting real-time trading systems, beautiful UIs, and robust research pipelines used by professional traders.
          </p>

          {/* Quick stats */}
          <div className="mt-8 grid grid-cols-3 max-w-lg mx-auto gap-3">
            {[{ k: "Open roles", v: stats.roles }, { k: "Teams", v: stats.teams }, { k: "Cities", v: stats.cities }].map(
              (s, i) => (
                <div
                  key={i}
                  className={`relative rounded-2xl border border-slate-800 bg-slate-900/40 p-4 ${statPulse}`}
                >
                  <div className="text-2xl font-bold">{s.v}</div>
                  <div className="text-xs text-slate-400">{s.k}</div>
                </div>
              )
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="sticky top-2 z-10 mb-8 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur p-3">
          <div className="flex flex-col lg:flex-row gap-3 items-stretch">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search role, skill, city…"
                className="w-full bg-slate-950/70 border border-slate-800 rounded-xl pl-10 pr-3 py-2.5 outline-none focus:border-[#4a56d2]/60 focus:ring-1 focus:ring-[#4a56d2]/40"
              />
            </div>

            {/* Department pills */}
            <div className="flex flex-wrap gap-2">
              {deptOptions.map((d) => (
                <button
                  key={d}
                  onClick={() => setDept(d)}
                  className={`px-3 py-2 rounded-xl border text-sm transition ${
                    dept === d
                      ? "border-[#4a56d2]/50 bg-[#1a237e]/15 text-[#cdd0ff]"
                      : "border-slate-800 bg-slate-900 text-slate-300 hover:border-slate-700"
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>

            {/* Location & Exp */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <Filter className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <select
                  value={loc}
                  onChange={(e) => setLoc(e.target.value)}
                  className="appearance-none pl-9 pr-8 py-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-sm focus:border-[#4a56d2]/60"
                >
                  {locationOptions.map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </select>
                <span className="pointer-events-none absolute right-3 top-3 text-slate-400">▾</span>
              </div>

              <div className="flex items-center gap-2 bg-slate-950/70 border border-slate-800 rounded-xl px-3 py-2.5 text-sm">
                <Clock className="w-4 h-4 text-slate-400" />
                <span className="text-slate-300">≤ {expMax}y</span>
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={expMax}
                  onChange={(e) => setExpMax(parseInt(e.target.value))}
                  className="accent-[#4a56d2] w-28"
                />
              </div>

              {(dept !== ALL || loc !== ALL || query || expMax !== 10) && (
                <button
                  onClick={() => {
                    setDept(ALL);
                    setLoc(ALL);
                    setQuery("");
                    setExpMax(10);
                  }}
                  className="px-3 py-2 rounded-xl border border-slate-800 hover:border-[#4a56d2]/40 text-sm text-slate-300"
                >
                  <X className="w-4 h-4 inline mr-1" /> Clear
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Job list */}
        <AnimatePresence mode="wait">
          {filtered.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-center py-20 border border-slate-800 rounded-2xl bg-slate-900/40"
            >
              <p className="text-slate-300">No roles match your filters. Try broadening your search.</p>
            </motion.div>
          ) : (
            <motion.div
              key="list"
              initial="hidden"
              animate="show"
              variants={{
                hidden: { opacity: 0 },
                show: { opacity: 1, transition: { staggerChildren: 0.05 } },
              }}
              className="grid md:grid-cols-2 xl:grid-cols-3 gap-6"
            >
              {filtered.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  saved={saved.has(job.id)}
                  onSave={() => toggleSave(job.id)}
                  onOpenModal={() => setActiveJob(job)}
                  onCopy={() => copyLink(job)}
                  copied={copiedId === job.id}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom CTA */}
        <div className="mt-14 relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-8">
          <div className="absolute -top-24 -right-24 h-64 w-64 bg-[#4a56d2]/10 blur-3xl rounded-full" />
          <div className="absolute -bottom-24 -left-24 h-64 w-64 bg-[#1a237e]/10 blur-3xl rounded-full" />
          <div className="relative grid lg:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-extrabold">Don’t see the exact role?</h2>
              <p className="text-slate-300 mt-2">Tell us how you’d like to contribute. We love proactive builders.</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-end">
              <Link
                to="/comming-soon"
                className={`inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 font-semibold text-white transition ${GRAD} ${GRAD_HOVER}`}
              >
                Send Resume <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/comming-soon"
                className="inline-flex items-center justify-center gap-2 rounded-xl border px-6 py-3 font-semibold border-slate-700 hover:border-[#4a56d2]/50 hover:text-[#cdd0ff] transition"
              >
                Learn More
              </Link>
            </div>
          </div>
        </div>

        {/* Job Alerts */}
        <div className="mt-6 flex flex-col sm:flex-row gap-3 items-center justify-center">
          <div className="text-sm text-slate-400">Get new roles by email</div>
          <div className="flex items-stretch gap-2">
            <input
              placeholder="you@domain.com"
              className="bg-slate-950/70 border border-slate-800 rounded-xl px-3 py-2.5 outline-none focus:border-[#4a56d2]/60"
            />
            <button
              className={`rounded-xl px-4 font-medium transition text-white ${GRAD} ${GRAD_HOVER}`}
            >
              Create Alert
            </button>
          </div>
        </div>
      </div>

      {/* Modal */}
      <JobModal
        job={activeJob}
        saved={activeJob ? saved.has(activeJob.id) : false}
        onSave={() => activeJob && toggleSave(activeJob.id)}
        onClose={() => setActiveJob(null)}
      />
    </section>
  );
}

type Job = typeof JOBS[number];

interface JobCardProps {
  job: Job;
  saved: boolean;
  onSave: () => void;
  onOpenModal: () => void;
  onCopy: () => void;
  copied: boolean;
}

function JobCard({ job, saved, onSave, onOpenModal, onCopy, copied }: JobCardProps) {
  const Icon = job.icon;

  return (
    <motion.div
      variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}
      whileHover={{ y: -4 }}
      className="group relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900/70 to-slate-950 p-[1px] h-full"
    >
      {/* Animated gradient ring */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition pointer-events-none">
        <div className="absolute -inset-40 bg-[conic-gradient(var(--tw-gradient-stops))] from-[#1a237e] via-[#3b44c8] to-[#4a56d2] animate-[spin_6s_linear_infinite] blur-3xl" />
      </div>

      <div className="relative rounded-2xl bg-slate-950/90 p-5 flex flex-col min-h-[320px]">
        {/* Top row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl border border-slate-800 bg-slate-900/60 flex items-center justify-center group-hover:border-[#4a56d2]/50">
              <Icon className="w-6 h-6" style={{ color: "#4a56d2" }} />
            </div>
            <div>
              <h3 className="text-lg font-semibold leading-tight group-hover:text-[#cdd0ff] transition">
                {job.title}
              </h3>
              <div className="text-xs text-slate-400 flex items-center gap-2 mt-1">
                <span className="inline-flex items-center gap-1">
                  <Briefcase className="w-3 h-3" /> {job.department}
                </span>
                <span>•</span>
                <span className="inline-flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {job.posted}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={onSave}
            className={`rounded-lg border px-2.5 py-2 transition ${
              saved
                ? "border-[#4a56d2]/50 text-[#cdd0ff] bg-[#1a237e]/20"
                : "border-slate-800 text-slate-300 hover:border-[#4a56d2]/50 hover:text-[#cdd0ff]"
            }`}
            aria-label={saved ? "Saved" : "Save job"}
          >
            {saved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
          </button>
        </div>

        {/* Meta chips */}
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          {job.locations.map((l) => (
            <span
              key={l}
              className="inline-flex items-center gap-1 rounded-full border border-slate-800 bg-slate-900/60 px-2.5 py-1"
            >
              <MapPin className="w-3 h-3 text-slate-400" />
              {l}
            </span>
          ))}
          <span className="inline-flex items-center gap-1 rounded-full border border-slate-800 bg-slate-900/60 px-2.5 py-1">
            <Clock className="w-3 h-3 text-slate-400" /> {job.experience.min}–{job.experience.max} yrs
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border border-slate-800 bg-slate-900/60 px-2.5 py-1">
            <Shield className="w-3 h-3 text-slate-400" /> {job.type}
          </span>
        </div>

        {/* Teaser */}
        <p className="mt-3 text-sm text-slate-300/90 line-clamp-3">{job.description}</p>

        {/* Actions */}
        <div className="mt-auto flex items-center gap-2 pt-4">
          <Link to="/comming-soon"
            // href={job.apply}
            className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white transition ${GRAD} ${GRAD_HOVER}`}
          >
            Apply Now <ArrowRight className="w-4 h-4" />
          </Link>
          <button
            onClick={onOpenModal}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-800 px-4 py-2 text-sm font-semibold hover:border-[#4a56d2]/50 hover:text-[#cdd0ff] transition"
          >
            View details
          </button>
          <button
            onClick={onCopy}
            className="ml-auto inline-flex items-center justify-center gap-2 rounded-xl border border-slate-800 px-3 py-2 text-sm hover:border-[#4a56d2]/50 hover:text-[#cdd0ff] transition"
          >
            <Share2 className="w-4 h-4" /> Share
          </button>
        </div>

        {/* Copied toast */}
        <AnimatePresence>
          {copied && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="absolute right-3 top-3 text-[11px] rounded-full bg-[#1a237e]/20 border border-[#4a56d2]/40 text-[#cdd0ff] px-2 py-1"
            >
              Link copied
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function JobModal({
  job,
  onClose,
  saved,
  onSave,
}: {
  job: Job | null;
  onClose: () => void;
  saved: boolean;
  onSave: () => void;
}) {
  useEffect(() => {
    if (!job) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [job, onClose]);

  return (
    <AnimatePresence>
      {job && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Dialog */}
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
          >
            <div className="relative w-full max-w-4xl rounded-2xl border border-slate-800 bg-slate-900 text-slate-100 shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="flex items-start gap-3 p-6 border-b border-slate-800">
                <div className="h-11 w-11 rounded-xl border border-slate-700 bg-slate-800/60 flex items-center justify-center">
                  {job.icon && React.createElement(job.icon, { className: "w-6 h-6", style: { color: "#4a56d2" } })}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold leading-tight">{job.title}</h3>
                  <div className="mt-1 text-xs text-slate-400 flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1">
                      <Briefcase className="w-3 h-3" /> {job.department}
                    </span>
                    <span>•</span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {job.posted}
                    </span>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="rounded-lg border border-slate-700 px-2 py-1 text-slate-300 hover:text-white"
                >
                  ✕
                </button>
              </div>

              {/* Content */}
              <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <div className="text-xs uppercase tracking-wider text-slate-400 mb-2">Must-have</div>
                  <div className="flex flex-wrap gap-2">
                    {job.mustHave.map((s) => (
                      <span key={s} className="rounded-lg bg-slate-800/70 border border-slate-700 px-2 py-1 text-xs">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wider text-slate-400 mb-2">Nice to have</div>
                  <div className="flex flex-wrap gap-2">
                    {job.niceToHave.map((s) => (
                      <span key={s} className="rounded-lg bg-slate-800/70 border border-slate-700 px-2 py-1 text-xs">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wider text-slate-400 mb-2">Responsibilities</div>
                  <ul className="space-y-1 text-sm text-slate-200/90">
                    {job.responsibilities.map((r, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="mt-1 h-1.5 w-1.5 rounded-full" style={{ backgroundColor: "#4a56d2" }} />
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="md:col-span-3">
                  <div className="text-xs uppercase tracking-wider text-slate-400 mb-2">Role Overview</div>
                  <p className="text-slate-300 leading-relaxed">{job.description}</p>
                </div>

                <div className="md:col-span-3 flex flex-wrap gap-2">
                  {job.locations.map((l) => (
                    <span
                      key={l}
                      className="inline-flex items-center gap-1 rounded-full border border-slate-700 bg-slate-800/60 px-2.5 py-1 text-xs"
                    >
                      <MapPin className="w-3 h-3 text-slate-400" /> {l}
                    </span>
                  ))}
                  <span className="inline-flex items-center gap-1 rounded-full border border-slate-700 bg-slate-800/60 px-2.5 py-1 text-xs">
                    <Clock className="w-3 h-3 text-slate-400" /> {job.experience.min}–{job.experience.max} yrs
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full border border-slate-700 bg-slate-800/60 px-2.5 py-1 text-xs">
                    <Shield className="w-3 h-3 text-slate-400" /> {job.type}
                  </span>
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-slate-800 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={onSave}
                    className={`rounded-lg border px-3 py-2 text-sm transition ${
                      saved
                        ? "border-[#4a56d2]/50 text-[#cdd0ff] bg-[#1a237e]/20"
                        : "border-slate-700 text-slate-300 hover:border-[#4a56d2]/50 hover:text-[#cdd0ff]"
                    }`}
                  >
                    {saved ? "Saved" : "Save role"}
                  </button>
                </div>
                <div className="flex items-center gap-2 ml-auto">
                  <a
                    href={job.apply}
                    className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 font-semibold text-white transition ${GRAD} ${GRAD_HOVER}`}
                  >
                    Apply Now <ArrowRight className="w-4 h-4" />
                  </a>
                  <button className="rounded-xl border border-slate-700 px-5 py-2.5 font-semibold hover:border-slate-500" onClick={onClose}>
                    Close
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
