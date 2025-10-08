// frontend/utils/date.ts
export const MONTHS_SHORT = [
  "Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec",
];

const istTodayParts = () => {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const dd = parts.find((p) => p.type === "day")?.value ?? "01";
  const mm = parts.find((p) => p.type === "month")?.value ?? "01";
  const yyyy = parts.find((p) => p.type === "year")?.value ?? "1970";
  return { dd, mm, yyyy };
};

export const todayDateKeyIST = (): string => {
  const { dd, mm, yyyy } = istTodayParts();
  const monShort = MONTHS_SHORT[Number(mm) - 1] ?? "Jan";
  return `${dd}-${monShort}-${yyyy}`;
};

export const todayISO = (): string => {
  const { dd, mm, yyyy } = istTodayParts();
  return `${yyyy}-${mm}-${dd}`;
};

// "DD-MMM-YYYY" -> "YYYY-MM-DD"
export const dateKeyToISO = (dk: string): string => {
  if (!/^\d{2}-[A-Za-z]{3}-\d{4}$/.test(dk)) return todayISO();
  const [dd, mon, yyyy] = dk.split("-");
  const mIdx = MONTHS_SHORT.indexOf(mon);
  const mm = String(mIdx + 1).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

// "YYYY-MM-DD" -> "DD-MMM-YYYY"
export const isoToDateKey = (iso: string): string => {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return todayDateKeyIST();
  const [, yyyy, mm, dd] = m;
  const monShort = MONTHS_SHORT[Number(mm) - 1] ?? "Jan";
  return `${dd}-${monShort}-${yyyy}`;
};

// Sort key for "DD-MMM-YYYY"
export const dateKeyStamp = (dk: string): number => {
  if (!/^\d{2}-[A-Za-z]{3}-\d{4}$/.test(dk)) return 0;
  const [dd, mon, yyyy] = dk.split("-");
  const mIdx = MONTHS_SHORT.indexOf(mon);
  const d = new Date(Date.UTC(Number(yyyy), Math.max(0, mIdx), Number(dd)));
  return d.getTime();
};
