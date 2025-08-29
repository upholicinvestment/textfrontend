export type ProductMetrics = {
  winRate: number;          // %
  rr: number;               // risk:reward
  maxDD: number;            // %
  trades: number;           // count
  monthsTested: number;     // months
  returnOfInvestment: number; // % (ROI)
};

export type Product = {
  key: "option_scalper_pro" | "starter_scalping" | "sniper_algo";
  name: string;
  priceMonthly: number;
  tagline: string;
  description: string;
  metrics: ProductMetrics;
};
