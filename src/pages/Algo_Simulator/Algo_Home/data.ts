import type { Product } from "./types"

export const PRODUCTS: Product[] = [
  {
    key: "option_scalper_pro",
    name: "Option Scalper PRO",
    priceMonthly: 14999, //14999
    tagline: "Latency-tuned scalps on liquid weekly options.",
    description:
      "Intraday precision with volatility filters, micro-pullback entries, and strict risk control. Built for high-liquidity NIFTY weeklies.",
    metrics: {
      winRate: 48,
      rr: 1.5,
      maxDD: 23,
      trades: 1100,
      monthsTested: 72,
      returnOfInvestment: 36, // %
    },
  },
  {
    key: "starter_scalping",
    name: "Starter Scalping",
    priceMonthly: 5999, //5999
    tagline: "Simple rules. Swift execution. Perfect for beginners.",
    description:
      "Core scalping logic with fewer toggles, strong guardrails, and battle-tested defaults. Great starter system for NIFTY intraday.",
    metrics: {
      winRate: 38,
      rr: 1.3,
      maxDD: 27,
      trades: 1300,
      monthsTested: 18,
      returnOfInvestment: 18, // %
    },
  },
  {
    key: "sniper_algo",
    name: "Sniper Algo",
    priceMonthly: 9999,    //9999
    tagline: "Precision entries. High R:R. Lower frequency.",
    description:
      "Targets precision entries around HTF structure and volatility compression on NIFTY. Fewer trades, higher average R:R, staged exits.",
    metrics: {
      winRate: 60,
      rr: 2.4,
      maxDD: 11,
      trades: 100,
      monthsTested: 18,
      returnOfInvestment: 44, // %
    },
  },
];
