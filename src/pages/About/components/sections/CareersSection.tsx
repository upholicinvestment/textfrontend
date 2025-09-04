// src/pages/Careers/CareersSection.tsx
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

const API_BASE = "https://api.upholictech.com/api/careers";

const ALL = "All";
const GRAD = "bg-gradient-to-r from-[#1a237e] to-[#4a56d2]";
const GRAD_HOVER = "hover:from-[#18206b] hover:to-[#4450cf]";
const GRAD_TEXT = "bg-gradient-to-r from-[#1a237e] to-[#4a56d2] bg-clip-text text-transparent";
const EMAIL_RX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;
const MAX_FILE_MB = 10;
function fileError(file: File | null) {
  if (!file) return "This file is required";
  const okExt = /\.(pdf|doc|docx)$/i.test(file.name);
  if (!okExt) return "Upload PDF/DOC/DOCX only";
  const tooBig = file.size > MAX_FILE_MB * 1024 * 1024;
  if (tooBig) return `Max size ${MAX_FILE_MB}MB`;
  return "";
}

type CareerJob = {
  id: string;
  iconKey?: keyof typeof ICON_MAP;
  title: string;
  department: string;
  locations: string[];
  experience: { min: number; max: number };
  type: string;
  posted: string;
  description: string;
  mustHave?: string[];
  niceToHave?: string[];
  responsibilities?: string[];
};

const ICON_MAP = {
  code: Code,
  backend: Database,
  devops: Shield,
  quant: TrendingUp,
  design: Palette,
  product: Users,
  marketing: Sparkles,
  sales: Briefcase,
  tele: Phone,
} as const;

const SEED_JOBS: CareerJob[] = [
  {
    id: "fe",
    iconKey: "code",
    title: "Frontend Developer (React)",
    department: "Engineering",
    locations: ["Mumbai"],
    experience: { min: 2, max: 5 },
    type: "Full-time",
    posted: "7 days ago",
    description:
      "Build high-performance, real-time trading interfaces in React + Tailwind that feel instant and trustworthy. You will design and maintain a reusable component library, craft micro-interactions with smooth motion, and integrate live feeds (WebSockets) without frame drops. Accessibility, testing, DX, and observability matter to you as much as pixels do.",
    mustHave: ["React", "JavaScript/TypeScript", "Tailwind", "REST/WebSockets"],
    niceToHave: ["Framer Motion", "Zustand/Redux", "Charting libs", "Vite"],
    responsibilities: [
      "Develop reusable UI kits and streaming charts for market data",
      "Co-design data contracts with backend & research teams",
      "Profile performance; target 60+ FPS interactions on mid-tier devices",
      "Own DX: storybook, tests, documentation, and CI checks",
    ],
  },
  {
    id: "be",
    iconKey: "backend",
    title: "Backend Developer (Node/Python)",
    department: "Engineering",
    locations: ["Mumbai"],
    experience: { min: 3, max: 6 },
    type: "Full-time",
    posted: "3 days ago",
    description:
      "Design and harden low-latency services that ingest market data, serve APIs, and run background jobs reliably. You'll work with queues, caches, and idempotent processors, instrument everything with metrics/logs/traces, and own incident playbooks. The stack emphasizes correctness under load, clean boundaries, and simple rollbacks.",
    mustHave: ["Node.js", "TypeScript/Python", "MongoDB/Redis", "Queues/WebSockets"],
    niceToHave: ["gRPC", "Docker/K8s", "Timeseries DB", "CI/CD"],
    responsibilities: [
      "Own resilient marketfeed & order-routing services",
      "Implement batch & stream processors with strong idempotency",
      "Add observability (metrics/logs/traces) and actionable alerts",
      "Enforce auth, rate-limits, and safe defaults across endpoints",
    ],
  },
  {
    id: "devops",
    iconKey: "devops",
    title: "DevOps Engineer",
    department: "Engineering",
    locations: ["Mumbai"],
    experience: { min: 3, max: 7 },
    type: "Full-time",
    posted: "5 days ago",
    description:
      "Keep the platform blazing with IaC, robust CI/CD, and great observability. You'll define Kubernetes standards, automate blue/green rollouts, bake in cost guardrails, and ensure SLOs are real (and met).",
    mustHave: ["AWS/GCP", "Docker/K8s", "Terraform", "Observability"],
    niceToHave: ["Service mesh", "Cost guardrails", "Incident playbooks"],
    responsibilities: [
      "Scale ingestion & execution clusters safely and predictably",
      "Ship zero-downtime releases with progressive delivery",
      "Own SLOs/SLIs, on-call, and incident runbooks",
      "Harden security baselines and secrets management",
    ],
  },
  {
    id: "quant",
    iconKey: "quant",
    title: "Quantitative Analyst",
    department: "Research",
    locations: ["Mumbai"],
    experience: { min: 3, max: 5 },
    type: "Full-time",
    posted: "Today",
    description:
      "Research and evaluate systematic strategies with clean data, robust statistics, and risk controls. Build reproducible backtests, stress strategies across regimes, and convert insights into production-ready specifications.",
    mustHave: ["Python", "Pandas/NumPy", "Stats/Prob", "Backtesting"],
    niceToHave: ["Options Greeks", "ML", "Microstructure", "Risk models"],
    responsibilities: [
      "Form hypotheses and run disciplined A/B experiments",
      "Clean/label large datasets; keep code & results reproducible",
      "Evaluate drawdowns, exposures, and regime sensitivity",
      "Hand off findings with clear specs and acceptance tests",
    ],
  },
  {
    id: "design",
    iconKey: "design",
    title: "UI/UX Designer",
    department: "Design",
    locations: ["Mumbai"],
    experience: { min: 2, max: 4 },
    type: "Full-time / Contract",
    posted: "12 days ago",
    description:
      "Translate complex financial data into intuitive UI. Define flows for dashboards, orders, and risk views; evolve tokens and components; prototype quickly; and validate with lightweight tests.",
    mustHave: ["Product thinking", "Figma", "Design systems", "Prototyping"],
    niceToHave: ["Motion", "Data viz", "Accessibility", "Handoff docs"],
    responsibilities: [
      "Partner with engineering & research to shape end-to-end journeys",
      "Evolve our design system with tokens, states, and guidelines",
      "Prototype ideas and iterate from quick usability feedback",
      "Deliver thorough specs covering edge states and errors",
    ],
  },
  {
    id: "pm",
    iconKey: "product",
    title: "Product Manager",
    department: "Product",
    locations: ["Mumbai"],
    experience: { min: 4, max: 8 },
    type: "Full-time",
    posted: "9 days ago",
    description:
      "Own outcomes and clarity. Talk to traders, define KPIs/OKRs, and write crisp PRDs. Align research, design, and engineering; ship experiments safely, and iterate from data and feedback.",
    mustHave: ["PRDs", "Prioritization", "Stakeholder mgmt", "Metrics"],
    niceToHave: ["Fintech", "APIs", "Backtesting", "Risk/Compliance"],
    responsibilities: [
      "Own strategy, OKRs, and success metrics for your area",
      "Write specs with acceptance criteria and test plans",
      "Facilitate fast decisions; keep feedback loops tight",
      "Launch, measure impact, and iterate deliberately",
    ],
  },
  {
    id: "dm",
    iconKey: "marketing",
    title: "Digital Marketing Specialist",
    department: "Growth",
    locations: ["Bhopal"],
    experience: { min: 1, max: 4 },
    type: "Full-time",
    posted: "2 days ago",
    description:
      "Grow acquisition and activation via performance and organic channels. Own campaign calendar, manage SEO/SEM, build landing pages, and run experiments across the funnel.",
    mustHave: ["SEO/SEM", "Google Ads", "GA/Search Console", "Social Media", "A/B Testing"],
    niceToHave: ["Fintech familiarity", "Basic HTML/CSS", "Figma/Canva", "Email automation"],
    responsibilities: [
      "Plan & execute paid + organic campaigns across search/social/email",
      "Run keyword research, technical SEO audits, and content briefs",
      "Launch, monitor, and optimize ads to strict CAC/CPL targets",
      "Collaborate on landing pages; instrument for analytics",
      "Publish weekly reports; make clear recommendations",
    ],
  },
  {
    id: "sales",
    iconKey: "sales",
    title: "Sales Executive (Trading Product)",
    department: "Growth",
    locations: ["Bhopal"],
    experience: { min: 1, max: 3 },
    type: "Full-time",
    posted: "1 day ago",
    description:
      "Drive sign-ups and paid conversions through crisp demos, objection handling, and structured follow-ups. Manage a pipeline in CRM and develop partnerships that expand reach.",
    mustHave: ["B2B/B2C Sales", "CRM hygiene", "Demo & Closing", "Communication"],
    niceToHave: ["Broking/Trading product sales", "Regional languages", "Channel partners"],
    responsibilities: [
      "Prospect & qualify leads from inbound and outbound sources",
      "Run tailored product demos; convert trials into paid plans",
      "Maintain pipeline, forecasts, and activity logs in CRM",
      "Share market feedback to influence roadmap & messaging",
      "Coordinate with support to ensure smooth onboarding",
    ],
  },
  {
    id: "tele",
    iconKey: "tele",
    title: "Telecaller (Lead Qualification)",
    department: "Growth",
    locations: ["Bhopal"],
    experience: { min: 0, max: 2 },
    type: "Full-time / Contract",
    posted: "Today",
    description:
      "Qualify leads via outbound calls, understand needs, and schedule demos for the sales team. Follow scripts, log outcomes diligently in CRM, and ensure timely follow-ups.",
    mustHave: ["Hindi & English fluency", "Outbound Calling", "Listening Skills", "CRM updates"],
    niceToHave: ["Fintech awareness", "Script adaptation", "Target orientation"],
    responsibilities: [
      "Make daily outbound calls to warm/cold leads",
      "Qualify needs and schedule demos with sales",
      "Log call outcomes and next steps accurately in CRM",
      "Comply with DNC and privacy standards",
      "Report daily volumes, connects, and conversions",
    ],
  },
];

function getOwnerId(): string {
  try {
    const key = "careersOwnerId";
    let id = localStorage.getItem(key);
    if (!id) {
      id = `anon-${Math.random().toString(36).slice(2, 10)}`;
      localStorage.setItem(key, id);
    }
    return id;
  } catch {
    return "anonymous";
  }
}

const statPulse =
  "after:absolute after:inset-0 after:rounded-2xl after:bg-[#4a56d2]/10 after:blur-2xl after:opacity-0 hover:after:opacity-100 after:transition";

export default function CareersSection() {
  const [jobs, setJobs] = useState<CareerJob[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  const [query, setQuery] = useState("");
  const [dept, setDept] = useState(ALL);
  const [loc, setLoc] = useState(ALL);
  const [expMax, setExpMax] = useState(10);
  const [saved, setSaved] = useState<Set<string>>(() => new Set());

  const [activeJob, setActiveJob] = useState<CareerJob | null>(null);
  const [applyJob, setApplyJob] = useState<CareerJob | null>(null);
  const [resumeOpen, setResumeOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Load jobs; if backend empty, seed and refetch
  useEffect(() => {
    let ignore = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        let r = await fetch(`${API_BASE}/jobs`);
        if (!r.ok) throw new Error("Failed to fetch jobs");
        let data: CareerJob[] = await r.json();

        if (!data || data.length === 0) {
          await Promise.all(
            SEED_JOBS.map((j) =>
              fetch(`${API_BASE}/jobs`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(j),
              }).catch(() => null)
            )
          );
          r = await fetch(`${API_BASE}/jobs`);
          data = (await r.json()) || [];
        }
        if (!ignore) setJobs(data);
      } catch (e: any) {
        if (!ignore) {
          setError(e?.message || "Error loading jobs");
          setJobs(SEED_JOBS); // fallback for UI only
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    if (copiedId) t = setTimeout(() => setCopiedId(null), 1200);
    return () => clearTimeout(t);
  }, [copiedId]);

  const deptOptions = useMemo(
    () => [ALL, ...Array.from(new Set(jobs.map((j) => j.department)))],
    [jobs]
  );
  const locationOptions = useMemo(
    () => [ALL, ...Array.from(new Set(jobs.flatMap((j) => j.locations || [])))],
    [jobs]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return jobs.filter((j) => {
      const inDept = dept === ALL || j.department === dept;
      const inLoc = loc === ALL || (j.locations || []).includes(loc);
      const inExp = (j.experience?.min ?? 0) <= expMax;
      const inQuery =
        !q ||
        [j.title, j.department, j.description, ...(j.mustHave || []), ...(j.niceToHave || []), ...(j.locations || [])]
          .join(" ")
          .toLowerCase()
          .includes(q);
      return inDept && inLoc && inExp && inQuery;
    });
  }, [dept, loc, expMax, query, jobs]);

  const stats = useMemo(() => {
    const roles = filtered.length;
    const teams = new Set(filtered.map((j) => j.department)).size;
    const cities = new Set(filtered.flatMap((j) => j.locations || [])).size;
    return { roles, teams, cities };
  }, [filtered]);

  const toggleSave = async (id: string) => {
    setSaved((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
    try {
      await fetch(`${API_BASE}/jobs/${id}/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ saved: !saved.has(id), userId: getOwnerId() }),
      });
    } catch {
      // best-effort
    }
  };

  const copyLink = async (job: CareerJob) => {
    try {
      const origin =
        (typeof window !== "undefined" && window.location && window.location.origin) || "";
      await navigator.clipboard.writeText(origin + `#/careers/${job.id}`);
      setCopiedId(job.id);
    } catch {
      setCopiedId(job.id);
    }
  };

  const handleOpenApply = async (job: CareerJob) => {
    try {
      const r = await fetch(`${API_BASE}/jobs`);
      const list: CareerJob[] = (await r.json()) || [];
      const exists = list.some((j) => j.id === job.id);
      if (!exists) {
        await fetch(`${API_BASE}/jobs`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(job),
        }).catch(() => null);
      }
    } catch {
      // ignore
    }
    setApplyJob(job);
  };

  return (
    <section className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-7xl py-10 mx-auto px-6 ">
        {/* Header */}
        <div className="text-center  mb-12">
          <div className="inline-flex items-center gap-2 bg-[#1a237e]/10 border border-[#4a56d2]/30 rounded-full px-4 py-2 mb-5">
            <Sparkles className="w-4 h-4 text-[#4a56d2]" />
            <span className="text-sm font-medium" style={{ color: "#4a56d2" }}>
              We're hiring across India
            </span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight">
            Build the future of <span className={GRAD_TEXT}>fintech</span>
          </h1>
          <p className="text-slate-300 max-w-3xl mx-auto mt-4 text-lg">
            Join a team crafting real-time trading systems, beautiful UIs, and robust research pipelines used by
            professional traders.
          </p>

          {/* Quick stats */}
          <div className="mt-8 grid grid-cols-3 max-w-lg mx-auto gap-3">
            {[
              { k: "Open roles", v: loading ? "…" : stats.roles },
              { k: "Teams", v: loading ? "…" : stats.teams },
              { k: "Cities", v: loading ? "…" : stats.cities },
            ].map((s, i) => (
              <div
                key={`stat-${i}`}
                className={`relative rounded-2xl border border-slate-800 bg-slate-900/40 p-4 ${statPulse}`}
              >
                <div className="text-2xl font-bold">{s.v}</div>
                <div className="text-xs text-slate-400">{s.k}</div>
              </div>
            ))}
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
                className="w-full bg-slate-900/80 border border-slate-700 rounded-xl pl-10 pr-3 py-2.5 text-slate-200 outline-none focus:border-[#4a56d2] focus:ring-2 focus:ring-[#4a56d2]/40 transition-colors"
              />
            </div>

            {/* Department pills */}
            <div className="flex flex-wrap gap-2">
              {deptOptions.map((d) => (
                <button
                  key={`dept-${d}`}
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
                  className="appearance-none pl-9 pr-8 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700 text-slate-200 text-sm focus:border-[#4a56d2] focus:ring-2 focus:ring-[#4a56d2]/40 transition-colors"
                >
                  {locationOptions.map((o) => (
                    <option key={`loc-${o}`} className="bg-slate-900 text-slate-200">
                      {o}
                    </option>
                  ))}
                </select>
                <span className="pointer-events-none absolute right-3 top-3 text-slate-400">▾</span>
              </div>

              <div className="flex items-center gap-2 bg-slate-900/80 border border-slate-700 rounded-xl px-3 py-2.5 text-sm">
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

        {error && (
          <div className="mb-4 text-sm text-red-300/80 bg-red-950/30 border border-red-900/40 p-3 rounded-xl">
            {error}
          </div>
        )}

        {/* Job list */}
        <AnimatePresence>
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
              variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } }}
              className="grid md:grid-cols-2 xl:grid-cols-3 gap-6"
            >
              {filtered.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  saved={saved.has(job.id)}
                  onSave={() => toggleSave(job.id)}
                  onOpenModal={() => setActiveJob(job)}
                  onOpenApply={() => handleOpenApply(job)}
                  onCopy={() => copyLink(job)}
                  copied={copiedId === job.id}
                  loading={loading}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom CTA — only Send Resume */}
        <div className="mt-14 relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-8">
          <div className="absolute -top-24 -right-24 h-64 w-64 bg-[#4a56d2]/10 blur-3xl rounded-full" />
          <div className="absolute -bottom-24 -left-24 h-64 w-64 bg-[#1a237e]/10 blur-3xl rounded-full" />
          <div className="relative grid lg:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-extrabold">Don't see the exact role?</h2>
              <p className="text-slate-300 mt-2">
                Send us your profile and preferred team. We'll reach out when there's a fit.
              </p>
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setResumeOpen(true)}
                className={`inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 font-semibold text-white transition ${GRAD} ${GRAD_HOVER}`}
              >
                Send Resume <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      <JobModal job={activeJob} onClose={() => setActiveJob(null)} onOpenApply={() => setApplyJob(activeJob)} />

      {/* Apply Modal */}
      <ApplyModal job={applyJob} onClose={() => setApplyJob(null)} onSuccess={() => setApplyJob(null)} />

      {/* Send Resume Modal */}
      <SendResumeModal open={resumeOpen} onClose={() => setResumeOpen(false)} />
    </section>
  );
}

/* —————————————————— Job Card —————————————————— */

function JobCard({
  job,
  saved,
  onSave,
  onOpenModal,
  onOpenApply,
  onCopy,
  copied,
  loading,
}: {
  job: CareerJob;
  saved: boolean;
  onSave: () => void;
  onOpenModal: () => void;
  onOpenApply: () => void;
  onCopy: () => void;
  copied: boolean;
  loading: boolean;
}) {
  const Icon = (job.iconKey && ICON_MAP[job.iconKey]) || Code;

  return (
    <motion.div
      variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}
      whileHover={{ y: -4 }}
      className="group relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900/70 to-slate-950 p-[1px] h-full"
    >
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
          {(job.locations || []).map((l) => (
            <span
              key={`loc-chip-${job.id}-${l}`}
              className="inline-flex items-center gap-1 rounded-full border border-slate-800 bg-slate-900/60 px-2.5 py-1"
            >
              <MapPin className="w-3 h-3 text-slate-400" />
              {l}
            </span>
          ))}
          <span className="inline-flex items-center gap-1 rounded-full border border-slate-800 bg-slate-900/60 px-2.5 py-1">
            <Clock className="w-3 h-3 text-slate-400" /> {job.experience?.min ?? 0}–{job.experience?.max ?? 0} yrs
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border border-slate-800 bg-slate-900/60 px-2.5 py-1">
            <Shield className="w-3 h-3 text-slate-400" /> {job.type}
          </span>
        </div>

        {/* Teaser */}
        <p className="mt-3 text-sm text-slate-300/90 line-clamp-3">{job.description}</p>

        {/* Actions */}
        <div className="mt-auto flex items-center gap-2 pt-4">
          <button
            onClick={onOpenApply}
            disabled={loading}
            className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white transition disabled:opacity-50 disabled:cursor-not-allowed ${GRAD} ${GRAD_HOVER}`}
            title={loading ? "Loading jobs from server…" : "Apply"}
          >
            Apply Now <ArrowRight className="w-4 h-4" />
          </button>
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

        <AnimatePresence>
          {copied && (
            <motion.div
              key="copied"
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

/* —————————————————— Job Modal —————————————————— */

function JobModal({
  job,
  onClose,
  onOpenApply,
}: {
  job: CareerJob | null;
  onClose: () => void;
  onOpenApply: () => void;
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

  if (!job) return null;
  const Icon = (job.iconKey && ICON_MAP[job.iconKey]) || Code;

  return (
    <AnimatePresence>
      {job && (
        <motion.div
          key={`job-${job.id}`}
          className="fixed inset-0 z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          {/* Wrapper: sheet on mobile, centered on >=sm */}
          <motion.div
            className="absolute inset-0 flex items-start sm:items-center justify-center p-0 sm:p-4 overscroll-contain"
            initial={{ y: 20, scale: 0.98 }}
            animate={{ y: 0, scale: 1 }}
            exit={{ y: 10, scale: 0.98 }}
          >
            <div
              role="dialog"
              aria-modal="true"
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-4xl sm:rounded-2xl border border-slate-800 bg-slate-900 text-slate-100 shadow-2xl overflow-hidden flex flex-col max-h-[100svh] sm:max-h-[90vh]"
            >
              {/* Header (sticky) */}
              <div className="flex items-start gap-3 p-4 sm:p-6 border-b border-slate-800 sticky top-0 bg-slate-900 z-10">
                <div className="h-11 w-11 rounded-xl border border-slate-700 bg-slate-800/60 flex items-center justify-center">
                  <Icon className="w-6 h-6" style={{ color: "#4a56d2" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base sm:text-xl font-semibold leading-tight truncate">{job.title}</h3>
                  <div className="mt-1 text-[11px] sm:text-xs text-slate-400 flex flex-wrap gap-2">
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

              {/* Body (scrollable) */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <div className="text-xs uppercase tracking-wider text-slate-400 mb-2">Must-have</div>
                    <div className="flex flex-wrap gap-2">
                      {(job.mustHave || []).map((s) => (
                        <span
                          key={`must-${job.id}-${s}`}
                          className="rounded-lg bg-slate-800/70 border border-slate-700 px-2 py-1 text-xs"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-wider text-slate-400 mb-2">Nice to have</div>
                    <div className="flex flex-wrap gap-2">
                      {(job.niceToHave || []).map((s) => (
                        <span
                          key={`nice-${job.id}-${s}`}
                          className="rounded-lg bg-slate-800/70 border border-slate-700 px-2 py-1 text-xs"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-wider text-slate-400 mb-2">Responsibilities</div>
                    <ul className="space-y-1 text-sm text-slate-200/90">
                      {(job.responsibilities || []).map((r, i) => (
                        <li key={`resp-${job.id}-${i}`} className="flex gap-2">
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
                    {(job.locations || []).map((l) => (
                      <span
                        key={`loc-${job.id}-${l}`}
                        className="inline-flex items-center gap-1 rounded-full border border-slate-700 bg-slate-800/60 px-2.5 py-1 text-xs"
                      >
                        <MapPin className="w-3 h-3 text-slate-400" /> {l}
                      </span>
                    ))}
                    <span className="inline-flex items-center gap-1 rounded-full border border-slate-700 bg-slate-800/60 px-2.5 py-1 text-xs">
                      <Clock className="w-3 h-3 text-slate-400" /> {job.experience?.min ?? 0}–{job.experience?.max ?? 0} yrs
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full border border-slate-700 bg-slate-800/60 px-2.5 py-1 text-xs">
                      <Shield className="w-3 h-3 text-slate-400" /> {job.type}
                    </span>
                  </div>
                </div>
              </div>

              {/* Footer (sticky) */}
              <div className="p-4 sm:p-6 border-t border-slate-800 bg-slate-900 sticky bottom-0">
                <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-end">
                  <button
                    onClick={onOpenApply}
                    className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 font-semibold text-white bg-gradient-to-r from-[#1a237e] to-[#4a56d2] hover:from-[#18206b] hover:to-[#4450cf] transition"
                  >
                    Apply Now <ArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    className="rounded-xl border border-slate-700 px-5 py-2.5 font-semibold hover:border-slate-500"
                    onClick={onClose}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* —————————————————— Apply Modal —————————————————— */
function ApplyModal({
  job,
  onClose,
  onSuccess,
}: {
  job: CareerJob | null;
  onClose: () => void;
  onSuccess?: () => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState("");

  const empty = {
    name: "",
    email: "",
    phone: "",
    linkedin: "",
    expYears: "",
    currentLocation: "",
    coverLetter: "",
    resume: null as File | null,
  };
  const [form, setForm] = useState({ ...empty });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (job) {
      setMsg("");
      setSubmitting(false);
      setForm({ ...empty });
      setErrors({});
    }
  }, [job?.id]);

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

  if (!job) return null;

  function validate() {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Full name is required";
    if (!form.email.trim()) e.email = "Email is required";
    else if (!EMAIL_RX.test(form.email)) e.email = "Enter a valid email";
    if (!form.phone.trim()) e.phone = "Phone is required";
    if (!form.linkedin.trim()) e.linkedin = "LinkedIn is required";
    if (form.expYears === "") e.expYears = "Experience is required";
    else if (isNaN(Number(form.expYears)) || Number(form.expYears) < 0)
      e.expYears = "Enter a valid number (0+)";
    if (!form.currentLocation.trim()) e.currentLocation = "Current location is required";
    const fileErr = fileError(form.resume);
    if (fileErr) e.resume = fileErr;
    if (!form.coverLetter.trim()) e.coverLetter = "Cover letter is required";
    return e;
  }

  function scrollFirstError(errs: Record<string, string>) {
    const first = Object.keys(errs)[0];
    if (first) {
      const el = document.getElementById(`apply-${first}`);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault?.(); // guard against Enter key
    setSubmitting(true);
    setMsg("");

    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      scrollFirstError(errs);
      setMsg("Please fix the highlighted fields.");
      setSubmitting(false);
      return;
    }

    try {
      const fd = new FormData();
      fd.append("name", form.name.trim());
      fd.append("email", form.email.trim());
      fd.append("phone", form.phone.trim());
      fd.append("linkedin", form.linkedin.trim());
      fd.append("expYears", String(form.expYears));
      fd.append("currentLocation", form.currentLocation.trim());
      fd.append("coverLetter", form.coverLetter.trim());
      if (form.resume) fd.append("resume", form.resume);

      const res = await fetch(`${API_BASE}/jobs/${job.id}/apply`, { method: "POST", body: fd });
      let payload: any = null;
      try { payload = await res.json(); } catch {}
      if (!res.ok) throw new Error(payload?.error || "Failed to submit application");

      setMsg("Application submitted. We'll get back to you soon!");
      setTimeout(() => {
        setForm({ ...empty });
        setErrors({});
        setMsg("");
        onSuccess?.();
      }, 1200);
    } catch (e: any) {
      setMsg(e?.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {job && (
        <>
          {/* Scoped scrollbar styles (self-contained) */}
          <style>{`
            .ultra-thin-scroll { scrollbar-width: thin; scrollbar-color: rgba(74,86,210,.6) transparent; }
            .ultra-thin-scroll::-webkit-scrollbar { width: 6px; height: 6px; }
            .ultra-thin-scroll::-webkit-scrollbar-track { background: transparent; }
            .ultra-thin-scroll::-webkit-scrollbar-thumb { background: rgba(74,86,210,.6); border-radius: 9999px; }
            .ultra-thin-scroll::-webkit-scrollbar-thumb:hover { background: rgba(74,86,210,.8); }
          `}</style>

          <motion.div
            key={`apply-${job.id}`}
            className="fixed inset-0 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={onClose}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
            {/* Modified for mobile: items-end and pb-safe */}
            <motion.div
              className="absolute inset-0 flex items-end sm:items-center justify-center p-0 sm:p-4 overscroll-contain pb-safe"
              initial={{ y: 20, scale: 0.98 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: 10, scale: 0.98 }}
            >
              <div
                role="dialog"
                aria-modal="true"
                onClick={(e) => e.stopPropagation()}
                className="relative w-full max-w-2xl sm:rounded-2xl border border-slate-800 bg-slate-900 text-slate-100 shadow-2xl overflow-hidden flex flex-col max-h-[90svh] sm:max-h-[90vh]"
              >
                {/* Header */}
                <div className="flex items-start justify-between p-4 sm:p-5 border-b border-slate-800 sticky top-0 bg-slate-900 z-10">
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold">Apply — {job.title}</h3>
                    <p className="text-[11px] text-slate-400 mt-1">
                      {job.department} • {(job.locations || []).join(", ")}
                    </p>
                  </div>
                  <button
                    onClick={onClose}
                    className="rounded-lg border border-slate-700 px-2 py-1 text-slate-300 hover:text-white"
                  >
                    ✕
                  </button>
                </div>

                {/* Body (thin scrollbar) */}
                <div className="flex-1 overflow-y-auto p-3 sm:p-4 ultra-thin-scroll">
                  <form onSubmit={submit} noValidate className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Input id="apply-name" label="Full Name" value={form.name}
                      onChange={(v) => { setForm({ ...form, name: v }); if (errors.name) setErrors({ ...errors, name: "" }); }}
                      error={errors.name}
                    />
                    <Input id="apply-email" label="Email" type="email" value={form.email}
                      onChange={(v) => { setForm({ ...form, email: v }); if (errors.email) setErrors({ ...errors, email: "" }); }}
                      error={errors.email}
                    />
                    <Input id="apply-phone" label="Phone" value={form.phone}
                      onChange={(v) => { setForm({ ...form, phone: v }); if (errors.phone) setErrors({ ...errors, phone: "" }); }}
                      error={errors.phone}
                    />
                    <Input id="apply-linkedin" label="LinkedIn" placeholder="https://"
                      value={form.linkedin}
                      onChange={(v) => { setForm({ ...form, linkedin: v }); if (errors.linkedin) setErrors({ ...errors, linkedin: "" }); }}
                      error={errors.linkedin}
                    />
                    <Input id="apply-expYears" label="Experience (yrs)" type="number"
                      value={form.expYears}
                      onChange={(v) => { setForm({ ...form, expYears: v }); if (errors.expYears) setErrors({ ...errors, expYears: "" }); }}
                      error={errors.expYears}
                    />
                    <Input id="apply-currentLocation" label="Current Location" value={form.currentLocation}
                      onChange={(v) => { setForm({ ...form, currentLocation: v }); if (errors.currentLocation) setErrors({ ...errors, currentLocation: "" }); }}
                      error={errors.currentLocation}
                    />

                    <div className="md:col-span-2">
                      <Label htmlFor="apply-resume">Resume (PDF/DOC)</Label>
                      <input
                        id="apply-resume"
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={(e) => {
                          const f = e.target.files?.[0] || null;
                          setForm({ ...form, resume: f });
                          if (errors.resume) setErrors({ ...errors, resume: "" });
                        }}
                        className={`block w-full text-sm text-slate-300 file:mr-3 file:rounded-md file:border-0 file:bg-[#1a237e] file:text-white file:px-3 file:py-1.5 file:hover:bg-[#18206b] bg-slate-900/80 border rounded-xl p-1.5
                          ${errors.resume ? "border-red-500 focus:border-red-500" : "border-slate-700"}
                        `}
                      />
                      {errors.resume && <span className="mt-1 block text-xs text-red-400">{errors.resume}</span>}
                    </div>

                    <div className="md:col-span-2">
                      <Label htmlFor="apply-cover">Cover Letter</Label>
                      <textarea
                        id="apply-cover"
                        rows={3}
                        value={form.coverLetter}
                        onChange={(e) => {
                          setForm({ ...form, coverLetter: e.target.value });
                          if (errors.coverLetter) setErrors({ ...errors, coverLetter: "" });
                        }}
                        className={`w-full bg-slate-900/80 border rounded-xl px-3 py-2 text-slate-200 outline-none transition-colors
                          ${errors.coverLetter ? "border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/30" : "border-slate-700 focus:border-[#4a56d2] focus:ring-2 focus:ring-[#4a56d2]/40"}
                        `}
                      />
                      {errors.coverLetter && <span className="mt-1 block text-xs text-red-400">{errors.coverLetter}</span>}
                    </div>

                    <div className="md:col-span-2 h-1" />
                  </form>
                </div>

                {/* Footer - Modified for mobile */}
                <div className="p-3 sm:p-4 border-t border-slate-800 bg-slate-900">
                  <div className="flex flex-col sm:flex-row items-center gap-2">
                    <button
                      type="button"
                      disabled={submitting}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 font-semibold text-white bg-gradient-to-r from-[#1a237e] to-[#4a56d2] hover:from-[#18206b] hover:to-[#4450cf] transition disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={() => submit()}
                    >
                      {submitting ? "Submitting…" : "Submit"}
                    </button>
                    <button
                      type="button"
                      onClick={onClose}
                      className="w-full sm:w-auto rounded-xl border border-slate-700 px-4 py-2.5 font-semibold hover:border-slate-500"
                    >
                      Cancel
                    </button>
                    {msg && <span className="text-[11px] sm:text-xs text-slate-300 mt-2 sm:mt-0 sm:ml-auto">{msg}</span>}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}


/* —————————————————— Send Resume Modal —————————————————— */

function SendResumeModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState("");

  const empty = {
    name: "",
    email: "",
    phone: "",
    targetDepartment: "",
    roleTitle: "",
    linkedin: "",
    coverLetter: "",
    resume: null as File | null,
  };
  const [form, setForm] = useState({ ...empty });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      setMsg("");
      setSubmitting(false);
      setForm({ ...empty });
      setErrors({});
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  function validate() {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Full name is required";
    if (!form.email.trim()) e.email = "Email is required";
    else if (!EMAIL_RX.test(form.email)) e.email = "Enter a valid email";
    if (!form.phone.trim()) e.phone = "Phone is required";
    if (!form.targetDepartment.trim()) e.targetDepartment = "Preferred department is required";
    if (!form.roleTitle.trim()) e.roleTitle = "Desired role title is required";
    if (!form.linkedin.trim()) e.linkedin = "LinkedIn is required";
    const fileErr = fileError(form.resume);
    if (fileErr) e.resume = fileErr;
    if (!form.coverLetter.trim()) e.coverLetter = "Cover letter is required";
    return e;
  }

  function scrollFirstError(errs: Record<string, string>) {
    const first = Object.keys(errs)[0];
    if (first) {
      const el = document.getElementById(`resume-${first}`);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault?.();
    setSubmitting(true);
    setMsg("");

    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      scrollFirstError(errs);
      setMsg("Please fix the highlighted fields.");
      setSubmitting(false);
      return;
    }

    try {
      const fd = new FormData();
      fd.append("name", form.name.trim());
      fd.append("email", form.email.trim());
      fd.append("phone", form.phone.trim());
      fd.append("targetDepartment", form.targetDepartment.trim());
      fd.append("roleTitle", form.roleTitle.trim());
      fd.append("linkedin", form.linkedin.trim());
      fd.append("coverLetter", form.coverLetter.trim());
      if (form.resume) fd.append("resume", form.resume);

      const res = await fetch(`${API_BASE}/resume`, { method: "POST", body: fd });
      let payload: any = null;
      try { payload = await res.json(); } catch {}
      if (!res.ok) throw new Error(payload?.error || "Failed to send resume");

      setMsg("Thanks! Your resume has been received.");
      setTimeout(() => {
        setForm({ ...empty });
        setErrors({});
        setMsg("");
        onClose();
      }, 1200);
    } catch (e: any) {
      setMsg(e?.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <style>{`
            .ultra-thin-scroll { scrollbar-width: thin; scrollbar-color: rgba(74,86,210,.6) transparent; }
            .ultra-thin-scroll::-webkit-scrollbar { width: 6px; height: 6px; }
            .ultra-thin-scroll::-webkit-scrollbar-track { background: transparent; }
            .ultra-thin-scroll::-webkit-scrollbar-thumb { background: rgba(74,86,210,.6); border-radius: 9999px; }
            .ultra-thin-scroll::-webkit-scrollbar-thumb:hover { background: rgba(74,86,210,.8); }
          `}</style>

          <motion.div
            key="send-resume"
            className="fixed inset-0 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={onClose}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
            {/* Modified for mobile: items-end and pb-safe */}
            <motion.div
              className="absolute inset-0 flex items-end sm:items-center justify-center p-0 sm:p-4 overscroll-contain pb-safe"
              initial={{ y: 20, scale: 0.98 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: 10, scale: 0.98 }}
            >
              <div
                role="dialog"
                aria-modal="true"
                onClick={(e) => e.stopPropagation()}
                className="relative w-full max-w-2xl sm:rounded-2xl border border-slate-800 bg-slate-900 text-slate-100 shadow-2xl overflow-hidden flex flex-col max-h-[90svh] sm:max-h-[90vh]"
              >
                {/* Header */}
                <div className="flex items-start justify-between p-4 sm:p-5 border-b border-slate-800 sticky top-0 bg-slate-900 z-10">
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold">Send Resume</h3>
                    <p className="text-[11px] text-slate-400 mt-1">
                      No matching role? Share your profile for future openings.
                    </p>
                  </div>
                  <button
                    onClick={onClose}
                    className="rounded-lg border border-slate-700 px-2 py-1 text-slate-300 hover:text-white"
                  >
                    ✕
                  </button>
                </div>

                {/* Body (thin scrollbar) */}
                <div className="flex-1 overflow-y-auto p-3 sm:p-4 ultra-thin-scroll">
                  <form onSubmit={submit} noValidate className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Input id="resume-name" label="Full Name" value={form.name}
                      onChange={(v) => { setForm({ ...form, name: v }); if (errors.name) setErrors({ ...errors, name: "" }); }}
                      error={errors.name}
                    />
                    <Input id="resume-email" label="Email" type="email" value={form.email}
                      onChange={(v) => { setForm({ ...form, email: v }); if (errors.email) setErrors({ ...errors, email: "" }); }}
                      error={errors.email}
                    />
                    <Input id="resume-phone" label="Phone" value={form.phone}
                      onChange={(v) => { setForm({ ...form, phone: v }); if (errors.phone) setErrors({ ...errors, phone: "" }); }}
                      error={errors.phone}
                    />
                    <Input id="resume-targetDepartment" label="Preferred Department"
                      value={form.targetDepartment}
                      onChange={(v) => { setForm({ ...form, targetDepartment: v }); if (errors.targetDepartment) setErrors({ ...errors, targetDepartment: "" }); }}
                      error={errors.targetDepartment}
                    />
                    <Input id="resume-roleTitle" label="Desired Role Title"
                      value={form.roleTitle}
                      onChange={(v) => { setForm({ ...form, roleTitle: v }); if (errors.roleTitle) setErrors({ ...errors, roleTitle: "" }); }}
                      error={errors.roleTitle}
                    />
                    <Input id="resume-linkedin" label="LinkedIn" placeholder="https://"
                      value={form.linkedin}
                      onChange={(v) => { setForm({ ...form, linkedin: v }); if (errors.linkedin) setErrors({ ...errors, linkedin: "" }); }}
                      error={errors.linkedin}
                    />

                    <div className="md:col-span-2">
                      <Label htmlFor="general-resume">Resume (PDF/DOC)</Label>
                      <input
                        id="general-resume"
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={(e) => {
                          const f = e.target.files?.[0] || null;
                          setForm({ ...form, resume: f });
                          if (errors.resume) setErrors({ ...errors, resume: "" });
                        }}
                        className={`block w-full text-sm text-slate-300 file:mr-3 file:rounded-md file:border-0 file:bg-[#1a237e] file:text-white file:px-3 file:py-1.5 file:hover:bg-[#18206b] bg-slate-900/80 border rounded-xl p-1.5
                          ${errors.resume ? "border-red-500 focus:border-red-500" : "border-slate-700"}
                        `}
                      />
                      {errors.resume && <span className="mt-1 block text-xs text-red-400">{errors.resume}</span>}
                    </div>

                    <div className="md:col-span-2">
                      <Label htmlFor="resume-cover">Cover Letter</Label>
                      <textarea
                        id="resume-cover"
                        rows={3}
                        value={form.coverLetter}
                        onChange={(e) => {
                          setForm({ ...form, coverLetter: e.target.value });
                          if (errors.coverLetter) setErrors({ ...errors, coverLetter: "" });
                        }}
                        className={`w-full bg-slate-900/80 border rounded-xl px-3 py-2 text-slate-200 outline-none transition-colors
                          ${errors.coverLetter ? "border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/30" : "border-slate-700 focus:border-[#4a56d2] focus:ring-2 focus:ring-[#4a56d2]/40"}
                        `}
                      />
                      {errors.coverLetter && <span className="mt-1 block text-xs text-red-400">{errors.coverLetter}</span>}
                    </div>

                    <div className="md:col-span-2 h-1" />
                  </form>
                </div>

                {/* Footer - Modified for mobile */}
                <div className="p-3 sm:p-4 border-t border-slate-800 bg-slate-900">
                  <div className="flex flex-col sm:flex-row items-center gap-2">
                    <button
                      type="button"
                      disabled={submitting}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 font-semibold text-white bg-gradient-to-r from-[#1a237e] to-[#4a56d2] hover:from-[#18206b] hover:to-[#4450cf] transition disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={() => submit()}
                    >
                      {submitting ? "Submitting…" : "Send"}
                    </button>
                    <button
                      type="button"
                      onClick={onClose}
                      className="w-full sm:w-auto rounded-xl border border-slate-700 px-4 py-2.5 font-semibold hover:border-slate-500"
                    >
                      Cancel
                    </button>
                    {msg && <span className="text-[11px] sm:text-xs text-slate-300 mt-2 sm:mt-0 sm:ml-auto">{msg}</span>}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/* —————————————————— Small UI helpers —————————————————— */

function Label({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className="text-xs uppercase tracking-wider text-slate-400 mb-1.5">
      {children} <span className="text-red-400">*</span>
    </label>
  );
}

function Input({
  id,
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  error,
}: {
  id?: string;
  label: string;
  value: string | number;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  error?: string;
}) {
  const hasError = !!error;
  return (
    <div className="flex flex-col">
      <Label htmlFor={id}>{label}</Label>
      <input
        id={id}
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={hasError}
        className={`w-full bg-slate-900/80 border rounded-xl px-3 py-2 text-slate-200 outline-none transition-colors
        ${hasError
          ? "border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/30"
          : "border-slate-700 focus:border-[#4a56d2] focus:ring-2 focus:ring-[#4a56d2]/40"
        }`}
      />
      {hasError && <span className="mt-1 text-xs text-red-400">{error}</span>}
    </div>
  );
}
