import React from "react";
import { BookOpen, Building2 } from "lucide-react";

export const componentLabelMap: Record<
  string,
  { label: string; icon: React.ReactNode }
> = {
  journaling: { label: "Journaling", icon: <BookOpen className="h-4 w-4" /> },
  fii_dii_data: { label: "FII/DII Data", icon: <Building2 className="h-4 w-4" /> },
};

export const componentRouteMap: Record<string, string> = {
  journaling: "/journal",
  fii_dii_data: "/fii-dii",
};

export const bundleComponentKeys = ["journaling", "fii_dii_data"];

export const prettyINR = (n?: number | null) =>
  typeof n === "number" ? `₹${n.toLocaleString("en-IN")}` : undefined;

export const variantBadgeClass = (key: string) => {
  const k = (key || "").toLowerCase();
  switch (k) {
    case "pro":
      return "bg-yellow-100 text-yellow-800";
    case "starter":
      return "bg-indigo-100 text-indigo-700";
    case "swing":
      return "bg-emerald-100 text-emerald-700";
    default:
      return "bg-white text-[#1a237e]";
  }
};
