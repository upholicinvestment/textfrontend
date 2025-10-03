// ---------- Types returned by /users/me/products ----------
export interface MyVariant {
  variantId: string;
  key: string; // starter | pro | swing
  name: string;
  priceMonthly?: number | null;
  interval?: string | null;
}
export interface MyProduct {
  productId: string;
  key: string; // component keys, algo_simulator, journaling_solo, essentials_bundle, fii_dii_data, journaling
  name: string;
  route: string; // e.g. "/fii-dii"
  hasVariants: boolean;
  forSale: boolean;
  status: string; // "active"
  startedAt: string | null;
  endsAt: string | null;
  variant: MyVariant | null;
  /** if backend groups multiple entitlements into one product, all variants arrive here */
  variants?: MyVariant[];
}

// ---------- Summary & Strategies ----------
export type Summary = {
  totalPnl: number;
  totalTrades: number;
  openPositions: number;
  successRatePct: number;
  riskReward: number;
};

export type StrategyPnL = {
  strategyName: string;
  pnl: number;
  orders: number;
  roundTrips: number;
  wins: number;
  losses: number;
  winRatePct: number;
  rnr: number | null;
  openPositions: number;
};

export type SummaryDoc = Summary & {
  dateKey: string; // "DD-MMM-YYYY"
  ts?: string | Date;
};

// ---------- Extra Types for Modals ----------
export type TriggeredTrade = {
  id: string;
  symbol: string;
  side: "BUY" | "SELL";
  qty: number;
  price: number;
  strategy?: string | null;
  ts?: string | number | Date;
};

export type LivePosition = {
  id: string;
  symbol: string;
  qty: number;
  avgPrice: number;
  ts?: number | null; // time (ms) from backend lastFillMs
};

// ---------- UI Types ----------
export interface ProductUI {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  stats: string;
  change: string;
  link: string;
  gradient: string;
  trend: "up" | "down";
  newFeature: boolean;
  bundleComponents?: { key: string; label: string; icon: React.ReactNode }[];
  algoVariants?: { key: string; label: string; price?: string }[];
}

export interface Stat {
  title: string;
  value: string;
  icon: React.ReactNode;
  trend: "up" | "down";
  change: string;
  gradient: string;
  period: string;
  progress: number;
}
