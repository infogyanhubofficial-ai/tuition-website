import type { ClassCategory } from "@/types/physical-class";

/* ------------------------------------------------------------------ */
/*  Currency (NPR)                                                     */
/* ------------------------------------------------------------------ */

// Indian/Nepali digit grouping (##,##,###) reads correctly for NPR amounts.
const NPR_GROUPING = new Intl.NumberFormat("en-IN", {
  maximumFractionDigits: 0,
});

export const CURRENCY_FORMATTER = {
  format: (amount: number) => `Rs. ${NPR_GROUPING.format(Math.round(amount))}`,
};

export const formatNPR = (amount: number) => CURRENCY_FORMATTER.format(amount);

/* ------------------------------------------------------------------ */
/*  Bikram Sambat (BS) date — approximate solar conversion             */
/* ------------------------------------------------------------------ */
/**
 * NOTE: Exact AD→BS conversion requires a year-by-year reference table
 * (BS months don't have fixed lengths). This is a solar approximation
 * anchored to the Nepali new year (~April 14) that is accurate to within
 * a day or two — fine for display copy like "~ Shrawan 19, 2083 BS".
 * For legally/financially exact conversions, swap this for a maintained
 * package such as `nepali-date-converter` or `nepali-datetime`.
 */

const BS_MONTH_NAMES = [
  "Baishakh",
  "Jestha",
  "Ashadh",
  "Shrawan",
  "Bhadra",
  "Ashwin",
  "Kartik",
  "Mangsir",
  "Poush",
  "Magh",
  "Falgun",
  "Chaitra",
];

const AVG_BS_MONTH_LENGTHS = [31, 31, 32, 32, 31, 31, 30, 30, 29, 29, 30, 30];

const MS_PER_DAY = 1000 * 60 * 60 * 24;

function daysBetween(a: Date, b: Date) {
  const utcA = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const utcB = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.floor((utcA - utcB) / MS_PER_DAY);
}

export function toBikramSambatApprox(input: Date | string) {
  const date = typeof input === "string" ? new Date(input) : input;
  if (Number.isNaN(date.getTime())) return null;

  const y = date.getFullYear();
  const newYearThisYear = new Date(y, 3, 14); // ~April 14

  let bsYear: number;
  let anchor: Date;
  if (date >= newYearThisYear) {
    bsYear = y + 57;
    anchor = newYearThisYear;
  } else {
    bsYear = y + 56;
    anchor = new Date(y - 1, 3, 14);
  }

  let remaining = daysBetween(date, anchor);
  let monthIdx = 0;
  while (remaining >= AVG_BS_MONTH_LENGTHS[monthIdx] && monthIdx < 11) {
    remaining -= AVG_BS_MONTH_LENGTHS[monthIdx];
    monthIdx++;
  }

  return {
    year: bsYear,
    month: monthIdx + 1,
    monthName: BS_MONTH_NAMES[monthIdx],
    day: remaining + 1,
  };
}

export function formatBsDate(input: Date | string): string {
  const bs = toBikramSambatApprox(input);
  if (!bs) return "";
  return `${bs.monthName} ${bs.day}, ${bs.year} BS`;
}

export function formatAdDate(input: Date | string): string {
  const date = typeof input === "string" ? new Date(input) : input;
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/* ------------------------------------------------------------------ */
/*  Countdown helpers                                                  */
/* ------------------------------------------------------------------ */

export function getDaysUntil(dateStr: string): number {
  const target = new Date(dateStr);
  const now = new Date();
  target.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - now.getTime()) / MS_PER_DAY);
}

/* ------------------------------------------------------------------ */
/*  learning_outcomes (jsonb) → top bullets                            */
/* ------------------------------------------------------------------ */

export const extractOutcomeBullets = (learningOutcomes: any): string[] => {
  if (!learningOutcomes) return [];

  if (Array.isArray(learningOutcomes)) {
    return learningOutcomes.filter((x) => typeof x === "string").slice(0, 2);
  }

  if (typeof learningOutcomes === "object") {
    if (Array.isArray(learningOutcomes.outcomes)) {
      return learningOutcomes.outcomes.slice(0, 2);
    }
    if (Array.isArray(learningOutcomes.benefits)) {
      return learningOutcomes.benefits.slice(0, 2);
    }
    return Object.values(learningOutcomes)
      .filter((v) => typeof v === "string")
      .slice(0, 2) as string[];
  }

  return [];
};

/* ------------------------------------------------------------------ */
/*  Category theming                                                   */
/* ------------------------------------------------------------------ */

export const CATEGORY_COLORS: Record<ClassCategory, string> = {
  "Professional Training": "bg-orange-100 text-orange-700 border-orange-200",
  "University Subjects": "bg-blue-100 text-blue-700 border-blue-200",
};

export const CATEGORY_THEME: Record<
  ClassCategory,
  {
    accent: string; // hex
    accentSoft: string; // tailwind bg-soft class
    ring: string;
    label: string;
    tagline: string;
  }
> = {
  "Professional Training": {
    accent: "#E2932E",
    accentSoft: "bg-[#FCEEDA]",
    ring: "ring-[#E2932E]",
    label: "Professional Training",
    tagline: "Hands-on, job-ready skill batches",
  },
  "University Subjects": {
    accent: "#34428A",
    accentSoft: "bg-[#E7EAF6]",
    ring: "ring-[#34428A]",
    label: "University Subjects",
    tagline: "Semester-aligned classroom coaching",
  },
};