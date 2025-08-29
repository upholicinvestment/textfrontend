// HowItWorks.tsx
// Responsive timeline with colored connectors on every step + improved accordions.
// Tip: If any gradient color (from-*) is missing in production, add a safelist
// in tailwind.config.js (see note at the bottom).

import { useCallback, useRef, useState, type ReactElement } from "react";
import {
  Workflow, ActivitySquare, KeySquare, Settings2, Cpu, Shield, BarChart3,
  Link2, ExternalLink, Clipboard, ClipboardCheck, ChevronDown
} from "lucide-react";
import { motion, useScroll, useSpring } from "framer-motion";
import { Link } from "react-router-dom";

/* -------------------- Copy helper -------------------- */
function useCopy() {
  const [copied, setCopied] = useState<string | null>(null);
  const copy = useCallback(async (text: string, key?: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key ?? text);
      setTimeout(() => setCopied(null), 1200);
    } catch { /* no-op */ }
  }, []);
  return { copied, copy };
}

/* -------------------- Types & Data -------------------- */
type Step = {
  title: string;
  bullets: string[]; // kept as data, but rendered without bullet markers
  icon: ReactElement; // ✅ JSX.Element -> ReactElement
  dot: string; // Tailwind bg-* for the node (e.g., "bg-cyan-400")
};

const STEPS: Step[] = [
  {
    title: "Choose Plan",
    bullets: ["Option Scalper PRO — ₹14,999/mo", "Intraday options scalping (buy entries only)"],
    icon: <ActivitySquare className="h-5 w-5" />,
    dot: "bg-cyan-400",
  },
  {
    title: "Unlock Broker Section",
    bullets: ["After selecting plan, broker settings become available", "Prepare your API keys / tokens (see broker guide below)"],
    icon: <KeySquare className="h-5 w-5" />,
    dot: "bg-violet-400",
  },
  {
    title: "Obtain Credentials",
    bullets: ["Create an app in your broker's developer portal", "Copy API Key/Secret and session tokens"],
    icon: <Settings2 className="h-5 w-5" />,
    dot: "bg-emerald-400",
  },
  {
    title: "Register & Connect",
    bullets: ["Click Register → creates user + broker_configs in MongoDB", "Tokens stored securely; Zerodha tokens refreshed per session"],
    icon: <Cpu className="h-5 w-5" />,
    dot: "bg-amber-400",
  },
  {
    title: "Go Live (Safely)",
    bullets: ["Dry-run first; then enable Auto", "Use daily loss caps, RR guards, circuit breakers"],
    icon: <Shield className="h-5 w-5" />,
    dot: "bg-orange-400",
  },
  {
    title: "Dashboard",
    bullets: [
      "Execution feed: executed / rejected / pending (via alerts)",
      "PnL analytics (daily/weekly/monthly) + equity curve",
      "Order Book with qty, price, time, status",
    ],
    icon: <BarChart3 className="h-5 w-5" />,
    dot: "bg-rose-400",
  },
];

/* Map node bg color -> gradient "from-*" color for connector lines.
   If your build still purges these, add a Tailwind safelist (note below). */
const FROM_MAP: Record<string, string> = {
  "bg-cyan-400": "from-cyan-400",
  "bg-violet-400": "from-violet-400",
  "bg-emerald-400": "from-emerald-400",
  "bg-amber-400": "from-amber-400",
  "bg-orange-400": "from-orange-400",
  "bg-rose-400": "from-rose-400",
};

/* -------------------- Section -------------------- */
export default function HowItWorks() {
  const { copied, copy } = useCopy();

  return (
    <section id="how-it-works" className="relative bg-slate-950 py-20 text-white overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_60%_at_50%_0%,rgba(99,102,241,0.10),transparent_60%)]" />

      <div className="relative mx-auto max-w-7xl px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-2 text-sm text-white/80 backdrop-blur-sm">
            <Workflow className="h-4 w-4" />
            How it works
          </div>
          <h2 className="mt-6 text-3xl md:text-5xl font-bold tracking-tight bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
            From selection to live trading
          </h2>
          <p className="mt-4 max-w-3xl mx-auto text-lg text-white/60">
            Product: <span className="font-semibold text-cyan-400">ALGO Simulator</span> ·
            <span className="font-semibold text-violet-400"> Option Scalper PRO (intraday, buy-side)</span>.
            Broker configuration unlocks after plan selection.
          </p>
        </div>

        <AnimatedTimeline />

        {/* Broker Guide */}
        <div className="mt-24">
          <div className="text-center mb-12">
            <h3 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
              Broker Setup Guide
            </h3>
            <p className="mt-3 text-white/60 max-w-2xl mx-auto">
              Open your broker portal, create an app, copy keys/tokens, and paste them in UpholicTech.
            </p>
          </div>

          <BrokerAccordions onCopy={copy} copied={copied} />
        </div>

        {/* Requirements Table */}
        <div className="mt-16">
          <h3 className="text-xl md:text-2xl font-bold text-center mb-8">Required Fields Summary</h3>
          <div className="overflow-x-auto">
            <div className="min-w-full border border-white/10 rounded-lg overflow-hidden">
              <div className="bg-white/5 px-6 py-3 border-b border-white/10">
                <div className="grid grid-cols-3 gap-4 text-sm font-medium text-white/80">
                  <div>Broker</div>
                  <div>Required Fields</div>
                  <div>Notes</div>
                </div>
              </div>
              <div className="divide-y divide-white/10">
                {[
                  { name: "Zerodha", fields: "API KEY, API SECRET, ACCESS TOKEN", note: "Access Token refresh is per-session/daily" },
                  { name: "Angel One", fields: "CLIENT ID, SMARTAPI KEY, PIN, TOTP SECRET", note: "TOTP enables auto-login flow" },
                  { name: "Dhan", fields: "CLIENT ID, ACCESS TOKEN", note: "Generate from API Access section" },
                  { name: "Upstox", fields: "API KEY, API SECRET, ACCESS TOKEN", note: "Token required per session" },
                ].map((row, i) => (
                  <div key={i} className="px-6 py-4 hover:bg-white/5 transition-colors">
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div className="font-medium text-white">{row.name}</div>
                      <div className="text-white/80">{row.fields}</div>
                      <div className="text-white/60">{row.note}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-12 text-center">
          <Link
            to="/signup"
            className="inline-flex items-center gap-3 rounded-lg bg-gradient-to-r from-cyan-500 to-violet-500 px-8 py-3 text-sm font-semibold text-white transition-all hover:from-cyan-400 hover:to-violet-400 hover:scale-105 hover:shadow-lg hover:shadow-violet-500/25"
          >
            Start Registration
            <ExternalLink className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

/* -------------------- Animated Timeline -------------------- */

function AnimatedTimeline() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 0.7", "end 0.3"],
  });
  const lineProgress = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });

  return (
    <div ref={containerRef} className="relative py-8">
      {/* Rail: left on mobile, center on lg+ */}
      <div className="absolute top-0 bottom-0 w-px bg-white/20 left-6 lg:left-1/2 lg:-translate-x-1/2" />

      {/* Animated progress along the rail */}
      <motion.div
        className="absolute top-0 w-[3px] rounded-full overflow-hidden left-[1.5rem] lg:left-1/2 lg:-translate-x-1/2 origin-top"
        style={{
          scaleY: lineProgress,
          background: "linear-gradient(180deg, #06b6d4, #8b5cf6, #ec4899)",
          boxShadow: "0 0 20px rgba(139, 92, 246, 0.5)"
        }}
      />

      {/* Steps */}
      <div className="space-y-12">
        {STEPS.map((step, index) => (
          <TimelineStep
            key={index}
            step={step}
            index={index}
            isLeft={index % 2 === 0}
          />
        ))}
      </div>
    </div>
  );
}

/* -------------------- Timeline Step -------------------- */

function TimelineStep({
  step,
  index,
  isLeft,
}: {
  step: Step;
  index: number;
  isLeft: boolean;
}) {
  const fromColor = FROM_MAP[step.dot] ?? "from-white/60";

  return (
    <motion.div
      initial={{ opacity: 0, x: isLeft ? -100 : 100 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.7, delay: index * 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="relative w-full flex items-start"
    >
      {/* Node: on rail (left on mobile, center on lg+) */}
      <div className="absolute left-6 lg:left-1/2 lg:-translate-x-1/2 top-6 z-10">
        <motion.div
          className={`h-4 w-4 rounded-full ${step.dot} border-[3px] border-slate-950 shadow-md`}
          initial={{ scale: 0 }}
          whileInView={{ scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: index * 0.1 + 0.3, duration: 0.4, type: "spring" }}
        />
        <div className={`absolute inset-0 h-4 w-4 rounded-full ${step.dot} opacity-50 blur-sm`} />
      </div>

      {/* CONNECTOR: mobile stub (rail → content) */}
      <motion.div
        className={`lg:hidden absolute left-8 top-6 h-px w-10 bg-gradient-to-r ${fromColor} to-transparent opacity-70`}
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true }}
        transition={{ delay: index * 0.1 + 0.5, duration: 0.6 }}
        style={{ transformOrigin: "left" }}
      />

      {/* CONNECTOR: desktop (center rail → left/right side) */}
      <motion.div
        className={`hidden lg:block absolute top-6 h-px opacity-70 ${
          isLeft ? "right-1/2 mr-8 bg-gradient-to-l" : "left-1/2 ml-8 bg-gradient-to-r"
        } ${fromColor} to-transparent`}
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true }}
        transition={{ delay: index * 0.1 + 0.5, duration: 0.6 }}
        style={{
          width: "calc(50% - 2.5rem)",
          transformOrigin: isLeft ? "right" : "left",
        }}
      />

      {/* CONTENT */}
      <div
        className={[
          "w-full pl-12",
          "lg:w-[calc(50%-3rem)]",
          isLeft ? "lg:mr-auto lg:pl-0 lg:pr-12" : "lg:ml-auto lg:pl-12 lg:pr-0",
        ].join(" ")}
      >
        <div className={isLeft ? "lg:text-right" : "lg:text-left"}>
          {/* Header */}
          <motion.div
            className={`mb-3 flex items-center gap-3 ${isLeft ? "lg:justify-end" : "lg:justify-start"}`}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 + 0.4, duration: 0.5 }}
          >
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${step.dot} shadow-lg`}>
              {step.icon}
            </div>
            <span className="block text-xs font-semibold uppercase tracking-wider text-white/50">
              Step {index + 1}
            </span>
          </motion.div>

          {/* Title */}
          <motion.h4
            className="text-xl md:text-2xl font-bold mb-4 text-white"
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 + 0.5, duration: 0.5 }}
          >
            {step.title}
          </motion.h4>

          {/* Lines (no bullets) */}
          <div className="space-y-2">
            {step.bullets.map((text, i) => (
              <motion.p
                key={i}
                initial={{ opacity: 0, x: isLeft ? 30 : -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 + 0.6 + i * 0.1, duration: 0.5 }}
                className="text-white/80 leading-relaxed"
              >
                {text}
              </motion.p>
            ))}
          </div>

          {/* Progress row */}
          <motion.div
            className={`mt-4 flex items-center gap-2 ${isLeft ? "lg:justify-end" : "lg:justify-start"}`}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 + 0.8, duration: 0.4 }}
          >
            <span className="text-xs text-white/40">
              {index + 1}/{STEPS.length}
            </span>
            <div className="flex gap-1">
              {Array.from({ length: STEPS.length }, (_, i) => (
                <div key={i} className={`w-1.5 h-1.5 rounded-full ${i <= index ? step.dot : "bg-white/20"}`} />
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

/* -------------------- Broker Accordions -------------------- */

function BrokerAccordions({ onCopy, copied }: { onCopy: (text: string, key?: string) => void; copied: string | null }) {
  const brokers = [
    {
      name: "Zerodha (Kite Connect)",
      url: "https://developers.kite.trade/",
      tag: "Popular",
      steps: [
        "Login → My Apps → Create New App",
        'App: "UpholicTech Algo"; Redirect URL: https://upholictech.com/auth/zerodha/callback',
        "Copy API Key & Secret (secret shown once)",
        "Login flow: https://kite.trade/connect/login?v=3&api_key=YOUR_APP_API_KEY",
        "After login, copy request_token from redirect URL (we exchange for Access Token)",
      ],
      fields: ["ZERODHA API KEY", "ZERODHA API SECRET", "ZERODHA ACCESS TOKEN (refresh daily)"]
    },
    {
      name: "Angel One (SmartAPI)",
      url: "https://smartapi.angelbroking.com/",
      steps: [
        "Login → My Apps → Create App",
        'App: "UpholicTech Algo"; set Redirect URL (Upholic / localhost)',
        "Copy SmartAPI Key; Client ID from Angel",
        "Enable TOTP; save TOTP secret (Google Authenticator)",
        "Use trading PIN for confirmations",
      ],
      fields: ["CLIENT ID", "SMARTAPI KEY", "PIN", "TOTP SECRET"]
    },
    {
      name: "Dhan (DhanHQ)",
      url: "https://dhan.co/",
      steps: [
        "Login → API Access",
        "Generate Client ID + Access Token",
        "Store securely",
      ],
      fields: ["CLIENT ID", "ACCESS TOKEN"]
    },
    {
      name: "Upstox (Developer)",
      url: "https://upstox.com/developer/",
      steps: [
        "Login → My Apps → Create New App",
        'App: "UpholicTech Algo"; Redirect URL: https://upholictech.com/auth/upstox/callback',
        "Copy API Key & Secret",
        "Complete login flow to obtain Access Token / Auth Code",
      ],
      fields: ["API KEY", "API SECRET", "ACCESS TOKEN / AUTH CODE"]
    }
  ];

  return (
    <div className="space-y-1 border border-white/10 rounded-lg overflow-hidden">
      {brokers.map((broker, index) => (
        <BrokerAccordionItem
          key={index}
          broker={broker}
          onCopy={onCopy}
          copied={copied}
          isLast={index === brokers.length - 1}
        />
      ))}
    </div>
  );
}

function BrokerAccordionItem({
  broker,
  onCopy,
  copied,
  isLast,
}: {
  broker: any;
  onCopy: (text: string, key?: string) => void;
  copied: string | null;
  isLast: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const brokerKey = broker.name.split(" ")[0].toLowerCase();

  return (
    <div className={`bg-white/5 hover:bg-white/10 transition-all duration-300 ${!isLast ? "border-b border-white/10" : ""}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 flex items-center justify-between text-left group"
      >
        <div className="flex items-center gap-4">
          <h4 className="text-lg font-semibold text-white group-hover:text-cyan-400 transition-colors">
            {broker.name}
          </h4>
          {broker.tag && (
            <span className="px-2 py-1 text-xs font-medium bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded-full">
              {broker.tag}
            </span>
          )}
        </div>
        <ChevronDown className={`w-5 h-5 text-white/60 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      <motion.div
        initial={false}
        animate={{ height: isOpen ? "auto" : 0 }}
        transition={{ duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] }}
        className="overflow-hidden"
      >
        <div className="px-6 pb-6">
          {/* Portal row */}
          <div className="mb-6 grid grid-cols-1 items-center gap-3 rounded-lg border border-white/10 bg-white/5 p-4 md:grid-cols-[1fr_auto_auto]">
            <div className="flex items-center gap-3">
              <Link2 className="w-4 h-4 text-white/60" />
              <a
                href={broker.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/80 hover:text-cyan-400 transition-colors flex-1 text-left"
              >
                {broker.url}
              </a>
            </div>
            <button
              onClick={() => onCopy(broker.url, brokerKey)}
              className="justify-self-start md:justify-self-end flex items-center gap-2 px-3 py-1.5 text-xs bg-white/10 hover:bg-white/20 border border-white/20 rounded-md transition-colors"
            >
              {copied === brokerKey ? <ClipboardCheck className="w-3 h-3" /> : <Clipboard className="w-3 h-3" />}
              {copied === brokerKey ? "Copied" : "Copy URL"}
            </button>
            <a
              href={broker.url}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:inline-flex items-center justify-center gap-2 rounded-md border border-white/20 bg-white/10 px-3 py-1.5 text-xs text-white/80 transition-colors hover:bg-white/20"
            >
              Open <ExternalLink className="h-3.5 w-3.5 text-white/60" />
            </a>
          </div>

          {/* Steps */}
          <div className="mb-6">
            <h5 className="text-sm font-medium text-white/60 uppercase tracking-wide mb-3">Setup Steps</h5>
            <div className="space-y-2 text-left">
              {broker.steps.map((step: string, i: number) => (
                <p key={i} className="text-white/70 text-sm leading-relaxed">
                  {step}
                </p>
              ))}
            </div>
          </div>

          {/* Required Fields */}
          <div>
            <h5 className="text-sm font-medium text-white/60 uppercase tracking-wide mb-3">Required Fields</h5>
            <div className="flex flex-wrap gap-2">
              {broker.fields.map((field: string, i: number) => (
                <span
                  key={i}
                  className="px-3 py-1.5 bg-white/10 border border-white/20 rounded-md text-xs font-mono text-white/80"
                >
                  {field}
                </span>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
