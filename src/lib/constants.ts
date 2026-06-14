import type { LeadStatus, LeadSource, CommissionStatus, Role } from "@prisma/client";

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  NEW_LEAD: "New Lead",
  CONTACTED: "Contacted",
  SHOWING_SCHEDULED: "Showing Scheduled",
  OFFER_MADE: "Offer Made",
  CLOSED_WON: "Closed Won",
  CLOSED_LOST: "Closed Lost",
};

export const LEAD_STATUS_ORDER: LeadStatus[] = [
  "NEW_LEAD",
  "CONTACTED",
  "SHOWING_SCHEDULED",
  "OFFER_MADE",
  "CLOSED_WON",
  "CLOSED_LOST",
];

// Tailwind utility classes per badge tone.
export const LEAD_STATUS_TONES: Record<LeadStatus, string> = {
  NEW_LEAD: "bg-sky-100 text-sky-700 ring-sky-600/20 dark:bg-sky-500/15 dark:text-sky-300",
  CONTACTED: "bg-indigo-100 text-indigo-700 ring-indigo-600/20 dark:bg-indigo-500/15 dark:text-indigo-300",
  SHOWING_SCHEDULED: "bg-violet-100 text-violet-700 ring-violet-600/20 dark:bg-violet-500/15 dark:text-violet-300",
  OFFER_MADE: "bg-amber-100 text-amber-800 ring-amber-600/20 dark:bg-amber-500/15 dark:text-amber-300",
  CLOSED_WON: "bg-emerald-100 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/15 dark:text-emerald-300",
  CLOSED_LOST: "bg-rose-100 text-rose-700 ring-rose-600/20 dark:bg-rose-500/15 dark:text-rose-300",
};

export const LEAD_SOURCE_LABELS: Record<LeadSource, string> = {
  WEBSITE: "Website",
  REFERRAL: "Referral",
  ZILLOW: "Zillow",
  WALK_IN: "Walk-in",
  SOCIAL_MEDIA: "Social Media",
  COLD_CALL: "Cold Call",
};

export const COMMISSION_STATUS_LABELS: Record<CommissionStatus, string> = {
  PENDING: "Pending",
  APPROVED: "Approved",
  PAID: "Paid",
  CANCELLED: "Cancelled",
};

export const COMMISSION_STATUS_TONES: Record<CommissionStatus, string> = {
  PENDING: "bg-amber-100 text-amber-800 ring-amber-600/20 dark:bg-amber-500/15 dark:text-amber-300",
  APPROVED: "bg-sky-100 text-sky-700 ring-sky-600/20 dark:bg-sky-500/15 dark:text-sky-300",
  PAID: "bg-emerald-100 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/15 dark:text-emerald-300",
  CANCELLED: "bg-zinc-100 text-zinc-600 ring-zinc-500/20 dark:bg-zinc-500/15 dark:text-zinc-300",
};

export const ROLE_TONES: Record<Role, string> = {
  ADMIN: "bg-indigo-100 text-indigo-700 ring-indigo-600/20 dark:bg-indigo-500/15 dark:text-indigo-300",
  SALES_MANAGER: "bg-sky-100 text-sky-700 ring-sky-600/20 dark:bg-sky-500/15 dark:text-sky-300",
  SALES_REP: "bg-amber-100 text-amber-800 ring-amber-600/20 dark:bg-amber-500/15 dark:text-amber-300",
  FINANCE: "bg-emerald-100 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/15 dark:text-emerald-300",
};

export const LEAD_SOURCES: LeadSource[] = [
  "WEBSITE",
  "REFERRAL",
  "ZILLOW",
  "WALK_IN",
  "SOCIAL_MEDIA",
  "COLD_CALL",
];
