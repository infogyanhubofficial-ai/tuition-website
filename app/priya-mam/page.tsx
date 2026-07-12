"use client";

/**
 * app/admin/crm-leads/page.tsx
 *
 * Customer Handler Dashboard — public.crm_leads
 * Fully self-contained route file: types, Supabase client, helpers,
 * and all sub-components are inlined. No /lib imports, per convention.
 *
 * Design system notes (v2):
 * - Color, type, icon-size, and motion are tokenized once below and reused
 *   everywhere instead of being redeclared per-component.
 * - Rows render in a compact single line by default; click the chevron to
 *   expand call-log / course / mode editing inline, so row height stays
 *   predictable instead of stretching per-lead.
 * - Status / priority / mode all use one ChipSelect component so every
 *   "pick one" control in the table looks and behaves identically.
 *
 * Assumes `crm_leads.created_at` exists (standard Supabase default column,
 * used for the "New leads today" KPI). If your table doesn't have it yet:
 *   alter table crm_leads add column created_at timestamptz default now();
 */

import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";
import { AnimatePresence, motion } from "framer-motion";
import {
  Phone,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Search,
  SlidersHorizontal,
  ArrowUp,
  ArrowDown,
  MessageSquarePlus,
  MessageCircle,
  BookOpen,
  GraduationCap,
  X,
  Check,
  Loader2,
  RefreshCcw,
  AlertTriangle,
  Inbox,
  Flame,
  Clock,
  CalendarClock,
  PhoneCall,
  Users,
  CheckCircle2,
  Command,
  Globe,
  MapPin,
  History,
  Sparkles,
  UserPlus,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Design tokens — single source of truth for color / type / icon / motion.
// Colors match GyanHub's platform palette (navy / blue / orange accent),
// not a one-off set invented for this page.
// ---------------------------------------------------------------------------

const TOKENS_STYLE = `
  .crm-scroll-shell {
    --c-navy: #0B1B3A;
    --c-blue: #1E3A8A;
    --c-blue-soft: rgba(30, 58, 138, 0.06);
    --c-blue-ring: rgba(30, 58, 138, 0.16);
    --c-accent: #F97316;
    --c-success: #10B981;
    --c-warning: #F59E0B;
    --c-danger: #E11D48;
    --radius-card: 12px;
    --radius-control: 8px;
    --ease: cubic-bezier(0.16, 1, 0.3, 1);
    --dur: 150ms;
  }
`;

// Type scale — 5 sizes total, each with one job. Nothing outside this list.
const TX = {
  micro: "text-[11px]", // captions, timestamps, meta
  dense: "text-[12px]", // table cell content, buttons, controls
  body: "text-[13px]", // inputs, primary row text
  emph: "text-[15px]", // phone numbers, section headers
  title: "text-[20px]", // page title
};

// Icon sizes — three sizes, tied to context, nothing in between.
const ICON = { sm: 12, md: 16, lg: 20 };

const MOTION = { duration: 0.15, ease: [0.16, 1, 0.3, 1] as const };

// ---------------------------------------------------------------------------
// Supabase client (browser)
// ---------------------------------------------------------------------------

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type LeadStatus =
  | "new"
  | "old"
  | "contacted"
  | "follow_up"
  | "interested"
  | "not_interested"
  | "enrolled";

type PaymentStatus = "unpaid" | "advance" | "paid";
type LearningMode = "online" | "physical";
type Priority = "high" | "normal" | "low";

interface CallNote {
  id: string;
  note: string;
  created_at: string;
  created_by?: string;
}

interface SyllabusRef {
  id: number;
  name: string;
  description?: string | null;
  online_tutors?: { name: string } | null;
}

interface CrmLead {
  id: number;
  name: string | null;
  phone_number: string | null;
  course_id: number | null;
  lead_status: LeadStatus | null;
  payment_status: PaymentStatus | null;
  learning_mode: LearningMode | null;
  priority: Priority | null;
  call_notes: CallNote[] | null;
  last_contacted_at: string | null;
  follow_up_date: string | null;
  updated_at: string | null;
  created_at: string | null;
  interested_course_ids: number[] | null;
  // joined
  syllabi_v2: SyllabusRef | null;
}

type SortDir = "asc" | "desc";

type QuickFilter = "newToday" | "contactedToday" | "followupsToday" | "overdue" | "enrolledToday" | null;

interface DashboardStats {
  totalLeads: number;
  newToday: number;
  contactedToday: number;
  followupsToday: number;
  overdue: number;
  enrolledToday: number;
  highPriority: number;
}

// ---------------------------------------------------------------------------
// Constants / display maps
// ---------------------------------------------------------------------------

const PAGE_SIZE = 50;

interface ChipOption<T extends string> {
  value: T;
  label: string;
  dot: string; // dot background class
  tone: string; // chip background + text + ring classes
}

const STATUS_META: ChipOption<LeadStatus>[] = [
  { value: "new", label: "New", dot: "bg-slate-400", tone: "bg-slate-50 text-slate-600 ring-1 ring-inset ring-slate-200" },
  { value: "old", label: "Old", dot: "bg-slate-300", tone: "bg-slate-50 text-slate-400 ring-1 ring-inset ring-slate-200" },
  { value: "contacted", label: "Contacted", dot: "bg-sky-500", tone: "bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-200" },
  { value: "follow_up", label: "Follow-up", dot: "bg-amber-500", tone: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200" },
  { value: "interested", label: "Interested", dot: "bg-indigo-500", tone: "bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-200" },
  { value: "not_interested", label: "Not interested", dot: "bg-rose-400", tone: "bg-rose-50 text-rose-500 ring-1 ring-inset ring-rose-200" },
  { value: "enrolled", label: "Enrolled", dot: "bg-emerald-500", tone: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200" },
];

const PRIORITY_META: ChipOption<Priority>[] = [
  { value: "high", label: "High", dot: "bg-[var(--c-danger)]", tone: "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200" },
  { value: "normal", label: "Normal", dot: "bg-slate-400", tone: "bg-slate-50 text-slate-600 ring-1 ring-inset ring-slate-200" },
  { value: "low", label: "Low", dot: "bg-slate-300", tone: "bg-slate-50 text-slate-400 ring-1 ring-inset ring-slate-200" },
];

const MODE_META: ChipOption<LearningMode>[] = [
  { value: "online", label: "Online", dot: "bg-sky-500", tone: "bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-200" },
  { value: "physical", label: "Physical", dot: "bg-violet-500", tone: "bg-violet-50 text-violet-700 ring-1 ring-inset ring-violet-200" },
];

const PAYMENT_OPTIONS: { value: PaymentStatus; label: string }[] = [
  { value: "unpaid", label: "Unpaid" },
  { value: "advance", label: "Advance" },
  { value: "paid", label: "Paid" },
];

const PAYMENT_BADGE: Record<PaymentStatus, string> = {
  paid: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200",
  advance: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200",
  unpaid: "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200",
};

const AVATAR_PALETTE: { bg: string; text: string }[] = [
  { bg: "bg-[var(--c-blue)]/[0.08]", text: "text-[var(--c-blue)]" },
  { bg: "bg-emerald-50", text: "text-emerald-700" },
  { bg: "bg-amber-50", text: "text-amber-700" },
  { bg: "bg-rose-50", text: "text-rose-600" },
  { bg: "bg-violet-50", text: "text-violet-700" },
  { bg: "bg-sky-50", text: "text-sky-700" },
  { bg: "bg-[var(--c-accent)]/[0.10]", text: "text-[var(--c-accent)]" },
  { bg: "bg-teal-50", text: "text-teal-700" },
];

// Shared control classes — one interaction language for every input/button.
const INPUT_CLS = cnBase(
  "h-8 rounded-[var(--radius-control)] border border-slate-300 bg-white px-2.5 outline-none",
  "transition-colors duration-150 placeholder:text-slate-400",
  "focus:border-[var(--c-blue)] focus:ring-2 focus:ring-[var(--c-blue-ring)]",
  "disabled:opacity-50 disabled:cursor-not-allowed"
);

const BTN_PRIMARY_CLS = cnBase(
  "inline-flex items-center justify-center gap-1.5 rounded-[var(--radius-control)] font-medium",
  "bg-[var(--c-blue)] text-white transition-colors duration-150 hover:bg-[var(--c-navy)]",
  "disabled:opacity-40 disabled:cursor-not-allowed"
);

const BTN_GHOST_CLS = cnBase(
  "inline-flex items-center justify-center gap-1.5 rounded-[var(--radius-control)] font-medium border border-slate-300 text-slate-600",
  "transition-colors duration-150 hover:border-slate-400 hover:bg-slate-50",
  "disabled:opacity-40 disabled:cursor-not-allowed"
);

function cnBase(...parts: string[]) {
  return parts.join(" ");
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function cn(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}

function formatRelative(iso: string | null | undefined): string {
  if (!iso) return "Never contacted";
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diffMs = now - then;
  const min = Math.round(diffMs / 60000);
  if (min < 1) return "Just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.round(hr / 24);
  if (day < 30) return `${day}d ago`;
  const mo = Math.round(day / 30);
  if (mo < 12) return `${mo}mo ago`;
  return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short" });
}

function formatTimestamp(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

function formatPhone(raw: string | null | undefined): string {
  if (!raw) return "—";
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10) return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  return raw;
}

function toWhatsAppNumber(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const digits = raw.replace(/[^\d]/g, "");
  return digits.length > 0 ? digits : null;
}

function buildWhatsAppUrl(raw: string | null | undefined): string | null {
  const digits = toWhatsAppNumber(raw);
  if (!digits) return null;
  return "https://wa.me/" + digits;
}

function toDateInputValue(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function todayInputValue(): string {
  return toDateInputValue(new Date().toISOString());
}

function startOfTodayIso(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function formatFollowUp(iso: string | null | undefined): { label: string; overdue: boolean } {
  if (!iso) return { label: "Not set", overdue: false };
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return { label: "Not set", overdue: false };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(d);
  target.setHours(0, 0, 0, 0);

  const diffDays = Math.round((target.getTime() - today.getTime()) / 86400000);

  let label = "";
  if (diffDays === 0) label = "Today";
  else if (diffDays === 1) label = "Tomorrow";
  else if (diffDays === -1) label = "1 day ago";
  else if (diffDays > 0) label = `In ${diffDays} days`;
  else label = `${Math.abs(diffDays)} days ago`;

  return { label, overdue: diffDays < 0 };
}

function initials(name: string | null | undefined): string {
  if (!name || name.trim() === "") return "?";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

function avatarTone(seed: string): { bg: string; text: string } {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return AVATAR_PALETTE[hash % AVATAR_PALETTE.length];
}

function dayLabel(iso: string): string {
  const d = new Date(iso);
  d.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.round((today.getTime() - d.getTime()) / 86400000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function groupNotesByDay(notes: CallNote[]): { label: string; notes: CallNote[] }[] {
  const sorted = [...notes].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  const groups: { label: string; notes: CallNote[] }[] = [];
  for (const n of sorted) {
    const label = dayLabel(n.created_at);
    const last = groups[groups.length - 1];
    if (last && last.label === label) last.notes.push(n);
    else groups.push({ label, notes: [n] });
  }
  return groups;
}

function getPageNumbers(current: number, total: number): (number | "ellipsis")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = new Set<number>([1, 2, total - 1, total, current - 1, current, current + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const result: (number | "ellipsis")[] = [];
  let prev = 0;
  for (const p of sorted) {
    if (prev && p - prev > 1) result.push("ellipsis");
    result.push(p);
    prev = p;
  }
  return result;
}

// Multi-select trigger label: shows what's actually selected instead of a
// static placeholder, so the control communicates state at a glance.
function multiSelectLabel(selectedIds: number[], courses: SyllabusRef[], placeholder: string): string {
  if (selectedIds.length === 0) return placeholder;
  const names = selectedIds.map((id) => courses.find((c) => c.id === id)?.name).filter((n): n is string => Boolean(n));
  if (names.length === 0) return placeholder;
  if (names.length === 1) return names[0];
  return `${names[0]} +${names.length - 1} more`;
}

// ---------------------------------------------------------------------------
// Animated KPI number
// ---------------------------------------------------------------------------

function AnimatedNumber({ value }: { value: number }) {
  const [display, setDisplay] = useState(value);
  const prevRef = useRef(value);

  useEffect(() => {
    const start = prevRef.current;
    const end = value;
    if (start === end) return;
    const startTime = performance.now();
    const duration = 500;
    let raf = 0;

    function tick(now: number) {
      const t = Math.min(1, (now - startTime) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(start + (end - start) * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    prevRef.current = end;
    return () => cancelAnimationFrame(raf);
  }, [value]);

  return <>{display.toLocaleString()}</>;
}

// ---------------------------------------------------------------------------
// KPI card — same radius / shadow language as the table below it, so the
// dark header and the light table read as one system rather than two.
// ---------------------------------------------------------------------------

function KpiCard({
  label,
  value,
  icon,
  accent,
  onClick,
  active,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  accent: string;
  onClick?: () => void;
  active?: boolean;
}) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      onClick={onClick}
      title={onClick ? `View ${label.toLowerCase()}` : undefined}
      className={cn(
        "group flex items-center gap-3 rounded-[var(--radius-card)] border px-3.5 py-2.5 text-left transition-all duration-150",
        onClick && "cursor-pointer hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.07]",
        active ? "border-white/30 bg-white/[0.09] shadow-[0_8px_20px_-8px_rgba(0,0,0,0.5)]" : "border-white/10 bg-white/[0.04]"
      )}
    >
      <span
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius-control)] transition-transform duration-150 group-hover:scale-110"
        style={{ background: `linear-gradient(135deg, ${accent}33, ${accent}14)`, color: accent }}
      >
        {icon}
      </span>
      <div className="min-w-0">
        <p className={cn(TX.emph, "font-mono font-semibold leading-none text-white")}>
          <AnimatedNumber value={value} />
        </p>
        <p className={cn(TX.micro, "mt-1 truncate uppercase tracking-wide text-slate-300")}>{label}</p>
      </div>
    </Tag>
  );
}

// ---------------------------------------------------------------------------
// Multi-select popover (courses) — label reflects current selection.
// ---------------------------------------------------------------------------

function CourseMultiSelect({
  courses,
  selected,
  onChange,
  placeholder,
  addNewToFront = false,
}: {
  courses: SyllabusRef[];
  selected: number[];
  onChange: (ids: number[]) => void;
  placeholder: string;
  /** When true, newly-checked courses are placed at the front of the array
   *  (most-recently-added shows first wherever these ids are rendered). */
  addNewToFront?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const toggle = (id: number) => {
    if (selected.includes(id)) {
      onChange(selected.filter((s) => s !== id));
    } else {
      onChange(addNewToFront ? [id, ...selected] : [...selected, id]);
    }
  };

  const label = multiSelectLabel(selected, courses, placeholder);

  return (
    <div className="relative w-full" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex h-8 w-full items-center gap-2 rounded-[var(--radius-control)] border px-2.5 bg-white transition-colors duration-150",
          TX.dense,
          "font-medium",
          selected.length > 0 ? "border-[var(--c-blue)] text-[var(--c-blue)] bg-[var(--c-blue-soft)]" : "border-slate-300 text-slate-500 hover:border-slate-400"
        )}
      >
        <span className="truncate">{label}</span>
        <ChevronDown size={ICON.sm} className={cn("ml-auto shrink-0 transition-transform duration-150", open && "rotate-180")} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={MOTION}
            className="absolute left-0 z-30 mt-1.5 max-h-72 w-64 overflow-y-auto rounded-[var(--radius-control)] border border-slate-200 bg-white p-1.5 shadow-lg"
          >
            {courses.length === 0 && <p className={cn(TX.body, "px-2 py-3 text-center text-slate-400")}>No courses found</p>}
            {courses.map((c) => {
              const active = selected.includes(c.id);
              return (
                <button
                  key={c.id}
                  onClick={() => toggle(c.id)}
                  className={cn("flex w-full items-center gap-2 rounded px-2 py-1.5 text-left hover:bg-slate-50", TX.body, "text-slate-700")}
                >
                  <span className={cn("flex h-4 w-4 shrink-0 items-center justify-center rounded border", active ? "border-[var(--c-blue)] bg-[var(--c-blue)]" : "border-slate-300")}>
                    {active && <Check size={11} className="text-white" strokeWidth={3} />}
                  </span>
                  <span className="truncate">{c.name}</span>
                </button>
              );
            })}
            {selected.length > 0 && (
              <button onClick={() => onChange([])} className={cn(TX.dense, "mt-1 w-full rounded px-2 py-1.5 text-left font-medium text-slate-400 hover:bg-slate-50 hover:text-slate-600")}>
                Clear selection
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ---------------------------------------------------------------------------
// PillSelect — plain single-value filter dropdown (used for Status/Payment)
// ---------------------------------------------------------------------------

function PillSelect<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T | "all";
  options: { value: T; label: string }[];
  onChange: (v: T | "all") => void;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T | "all")}
        className={cn(
          "h-9 cursor-pointer appearance-none rounded-[var(--radius-control)] border bg-white pl-3 pr-8 outline-none transition-colors duration-150",
          TX.body,
          "font-medium",
          value !== "all" ? "border-[var(--c-blue)] bg-[var(--c-blue-soft)] text-[var(--c-blue)]" : "border-slate-300 text-slate-600 hover:border-slate-400"
        )}
      >
        <option value="all">{label}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown size={ICON.sm} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// ChipSelect — one component, one visual identity, for every "pick one
// status-like value" control: lead status, priority, and mode all use this.
// ---------------------------------------------------------------------------

function ChipSelect<T extends string>({
  value,
  options,
  onChange,
  disabled,
}: {
  value: T;
  options: ChipOption<T>[];
  onChange: (v: T) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = options.find((o) => o.value === value) ?? options[0];

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => !disabled && setOpen((o) => !o)}
        disabled={disabled}
        className={cn("flex h-8 w-full items-center gap-1.5 rounded-[var(--radius-control)] px-2 font-medium transition-opacity duration-150 disabled:opacity-50", TX.dense, current.tone)}
      >
        <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", current.dot)} />
        <span className="truncate">{current.label}</span>
        <ChevronDown size={ICON.sm} className="ml-auto shrink-0 opacity-60" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={MOTION}
            className="absolute left-0 z-30 mt-1.5 w-44 overflow-hidden rounded-[var(--radius-control)] border border-slate-200 bg-white p-1 shadow-lg"
          >
            {options.map((o) => (
              <button
                key={o.value}
                onClick={() => {
                  onChange(o.value);
                  setOpen(false);
                }}
                className={cn("flex w-full items-center gap-2 rounded px-2 py-1.5 text-left font-medium hover:bg-slate-50", TX.dense, o.value === value ? "text-slate-900" : "text-slate-600")}
              >
                <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", o.dot)} />
                {o.label}
                {o.value === value && <Check size={ICON.sm} className="ml-auto text-slate-400" />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Courses Modal
// ---------------------------------------------------------------------------

function CoursesModal({ courses, onClose }: { courses: SyllabusRef[]; onClose: () => void }) {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={MOTION}
        className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-[var(--radius-card)] bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-4">
          <div className="flex items-center gap-2">
            <BookOpen size={ICON.lg} className="text-violet-500" />
            <h2 className={cn(TX.emph, "font-semibold text-slate-800")}>Available Courses</h2>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-control)] text-slate-400 transition-colors duration-150 hover:bg-slate-200 hover:text-slate-600">
            <X size={ICON.md} />
          </button>
        </div>
        <div className="flex-1 space-y-2 overflow-y-auto bg-slate-50/50 p-4">
          {courses.map((c) => (
            <div key={c.id} className="overflow-hidden rounded-[var(--radius-control)] border border-slate-200 bg-white">
              <button onClick={() => setExpandedId(expandedId === c.id ? null : c.id)} className="flex w-full items-center justify-between px-4 py-3.5 text-left transition-colors duration-150 hover:bg-slate-50/80">
                <span className={cn(TX.body, "font-medium text-slate-800")}>{c.name}</span>
                <ChevronDown size={ICON.md} className={cn("text-slate-400 transition-transform duration-150", expandedId === c.id && "rotate-180")} />
              </button>
              <AnimatePresence>
                {expandedId === c.id && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={MOTION}>
                    <div className={cn("border-t border-slate-100 bg-slate-50 px-4 py-4 leading-relaxed text-slate-600", TX.body)}>
                      <p className="whitespace-pre-wrap">{c.description || "No description available for this course."}</p>
                      {c.online_tutors?.name && (
                        <div className={cn("mt-3 flex w-fit items-center gap-1.5 rounded bg-white px-2.5 py-1.5 font-medium text-slate-700", TX.dense)}>
                          <GraduationCap size={ICON.sm} className="text-slate-400" />
                          Tutor: {c.online_tutors.name}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
          {courses.length === 0 && <p className={cn(TX.body, "py-10 text-center text-slate-400")}>No courses available.</p>}
        </div>
      </motion.div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Right-side lead drawer
// ---------------------------------------------------------------------------

function LeadDrawer({ lead, onClose, onAddNote }: { lead: CrmLead; onClose: () => void; onAddNote: (leadId: number, note: string) => Promise<void> }) {
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const groups = groupNotesByDay(lead.call_notes ?? []);
  const tone = avatarTone(String(lead.id));

  const submit = async () => {
    if (!draft.trim()) return;
    setSaving(true);
    await onAddNote(lead.id, draft.trim());
    setDraft("");
    setSaving(false);
  };

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={MOTION} onClick={onClose} className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-[1px]" />
      <motion.aside
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", stiffness: 320, damping: 32 }}
        className="fixed right-0 top-0 z-50 flex h-screen w-full max-w-[440px] flex-col border-l border-slate-200 bg-white shadow-2xl"
      >
        <div className="flex items-center gap-3 border-b border-slate-200 bg-[var(--c-navy)] px-5 py-4">
          <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-mono font-semibold", TX.body, tone.bg, tone.text)}>{initials(lead.name)}</span>
          <div className="min-w-0 flex-1">
            <p className={cn(TX.emph, "truncate font-mono font-semibold text-white")}>{formatPhone(lead.phone_number)}</p>
            <p className={cn(TX.dense, "truncate text-slate-300")}>{lead.name ?? "Unnamed lead"}</p>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius-control)] text-white/70 transition-colors duration-150 hover:bg-white/10 hover:text-white">
            <X size={ICON.md} />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
          <div>
            <p className={cn(TX.micro, "mb-3 flex items-center gap-1.5 font-mono uppercase tracking-wider text-slate-400")}>
              <History size={ICON.sm} />
              Timeline · {(lead.call_notes ?? []).length} {(lead.call_notes ?? []).length === 1 ? "entry" : "entries"}
            </p>
            {groups.length === 0 ? (
              <p className={cn(TX.body, "text-slate-400")}>No notes yet.</p>
            ) : (
              <div className="space-y-4">
                {groups.map((g) => (
                  <div key={g.label}>
                    <p className={cn(TX.micro, "mb-1.5 font-semibold uppercase tracking-wide text-slate-400")}>{g.label}</p>
                    <div className="space-y-1.5">
                      {g.notes.map((n) => (
                        <div key={n.id} className="relative rounded-[var(--radius-control)] bg-slate-50 px-3 py-2 pl-4">
                          <span className="absolute left-0 top-0 h-full w-[3px] rounded-l-[var(--radius-control)] bg-[var(--c-blue)]/20" />
                          <p className={cn(TX.body, "leading-snug text-slate-700")}>{n.note}</p>
                          <p className={cn(TX.micro, "mt-1 font-mono text-slate-400")}>
                            {formatTimestamp(n.created_at)}
                            {n.created_by ? ` · ${n.created_by}` : ""}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-slate-200 bg-slate-50/70 px-5 py-4">
          <p className={cn(TX.micro, "mb-2 font-mono uppercase tracking-wider text-slate-400")}>Add entry</p>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="What happened on the call…"
            rows={2}
            className={cn(INPUT_CLS, TX.body, "w-full h-auto resize-none py-2 text-slate-700")}
          />
          <button onClick={submit} disabled={!draft.trim() || saving} className={cn(BTN_PRIMARY_CLS, TX.body, "mt-2 h-8 w-full")}>
            {saving ? <Loader2 size={ICON.sm} className="animate-spin" /> : <MessageSquarePlus size={ICON.sm} />}
            Log note
          </button>
        </div>
      </motion.aside>
    </>
  );
}

// ---------------------------------------------------------------------------
// Row loading skeleton — mirrors real row shape (avatar circle + varied
// bar widths) instead of identical gray bars, so loading previews content.
// ---------------------------------------------------------------------------

function SkeletonRow({ i }: { i: number }) {
  const widths = [140, 60, 90, 50, 80]; // Notes, Status, Priority, Follow-up, Activity — varied per column
  return (
    <tr className="border-b border-slate-100">
      <td className="overflow-hidden px-4 py-3">
        <div className="h-3 w-5 animate-pulse rounded bg-slate-100" />
      </td>
      <td className="overflow-hidden px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 shrink-0 animate-pulse rounded-full bg-slate-100" />
          <div className="space-y-1.5">
            <div className="h-3 w-28 animate-pulse rounded bg-slate-100" />
            <div className="h-2.5 w-16 animate-pulse rounded bg-slate-100" />
          </div>
        </div>
      </td>
      {widths.map((w, j) => (
        <td key={j} className="overflow-hidden px-4 py-3">
          <div className="h-3 animate-pulse rounded bg-slate-100" style={{ width: `${w}%`, maxWidth: 120 }} />
        </td>
      ))}
    </tr>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function CrmLeadsDashboard() {
  const [leads, setLeads] = useState<CrmLead[]>([]);
  const [courses, setCourses] = useState<SyllabusRef[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [stats, setStats] = useState<DashboardStats>({
    totalLeads: 0,
    newToday: 0,
    contactedToday: 0,
    followupsToday: 0,
    overdue: 0,
    enrolledToday: 0,
    highPriority: 0,
  });

  const [search, setSearch] = useState("");
  const [courseFilter, setCourseFilter] = useState<number[]>([]);
  const [paymentFilter, setPaymentFilter] = useState<PaymentStatus | "all">("all");
  const [modeFilter, setModeFilter] = useState<LearningMode | "all">("all");
  const [statusFilter, setStatusFilter] = useState<LeadStatus | "all">("all");
  const [hideContacted, setHideContacted] = useState(false);
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [quickFilter, setQuickFilter] = useState<QuickFilter>(null);

  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [drawerLeadId, setDrawerLeadId] = useState<number | null>(null);
  const [showCoursesModal, setShowCoursesModal] = useState(false);
  const [pendingIds, setPendingIds] = useState<Set<number>>(new Set());
  const [flashIds, setFlashIds] = useState<Set<number>>(new Set());
  const [callDrafts, setCallDrafts] = useState<Record<number, string>>({});
  const [expandedRowId, setExpandedRowId] = useState<number | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);

  const markPending = (id: number, on: boolean) =>
    setPendingIds((prev) => {
      const next = new Set(prev);
      on ? next.add(id) : next.delete(id);
      return next;
    });

  const flash = (id: number) => {
    setFlashIds((prev) => new Set(prev).add(id));
    setTimeout(() => {
      setFlashIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, 900);
  };

  // ---- Data fetching ----

  const fetchCourses = useCallback(async () => {
    const { data, error } = await supabase.from("syllabi_v2").select("id, name, description, online_tutors(name)").order("name", { ascending: true });
    if (!error && data) setCourses(data as unknown as SyllabusRef[]);
  }, []);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    setError(null);

    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    let query = supabase
      .from("crm_leads")
      .select("*, syllabi_v2(id, name, description, online_tutors(name))", { count: "exact" })
      .order("last_contacted_at", { ascending: sortDir === "asc", nullsFirst: sortDir === "asc" })
      .range(from, to);

    if (courseFilter.length > 0) {
      const idList = courseFilter.join(",");
      query = query.or(`course_id.in.(${idList}),interested_course_ids.ov.{${idList}}`);
    }
    if (paymentFilter !== "all") query = query.eq("payment_status", paymentFilter);
    if (modeFilter !== "all") query = query.eq("learning_mode", modeFilter);
    if (statusFilter !== "all") query = query.eq("lead_status", statusFilter);
    if (hideContacted) query = query.is("last_contacted_at", null);

    const startToday = startOfTodayIso();
    const todayStr = todayInputValue();
    if (quickFilter === "newToday") query = query.gte("created_at", startToday);
    if (quickFilter === "contactedToday") query = query.gte("last_contacted_at", startToday);
    if (quickFilter === "followupsToday") query = query.eq("follow_up_date", todayStr);
    if (quickFilter === "overdue") query = query.lt("follow_up_date", todayStr);
    if (quickFilter === "enrolledToday") query = query.eq("lead_status", "enrolled").gte("updated_at", startToday);

    const { data, error, count } = await query;

    if (error) {
      setError(error.message);
      setLeads([]);
      setTotalCount(0);
    } else {
      setLeads((data ?? []) as unknown as CrmLead[]);
      setTotalCount(count ?? 0);
    }
    setLoading(false);
  }, [sortDir, courseFilter, paymentFilter, modeFilter, statusFilter, hideContacted, quickFilter, page]);

  const buildFilteredCountQuery = useCallback(
    (ignoreHideContacted = false) => {
      let query = supabase.from("crm_leads").select("id", { count: "exact", head: true });
      if (courseFilter.length > 0) {
        const idList = courseFilter.join(",");
        query = query.or(`course_id.in.(${idList}),interested_course_ids.ov.{${idList}}`);
      }
      if (paymentFilter !== "all") query = query.eq("payment_status", paymentFilter);
      if (modeFilter !== "all") query = query.eq("learning_mode", modeFilter);
      if (statusFilter !== "all") query = query.eq("lead_status", statusFilter);
      if (!ignoreHideContacted && hideContacted) query = query.is("last_contacted_at", null);
      return query;
    },
    [courseFilter, paymentFilter, modeFilter, statusFilter, hideContacted]
  );

  const fetchStats = useCallback(async () => {
    const startToday = startOfTodayIso();
    const todayStr = todayInputValue();

    // Pass `true` for ignoreHideContacted for activity-based KPIs so they
    // don't drop to 0 when "Hide contacted" is on.
    const [totalRes, newTodayRes, contactedRes, followupsRes, overdueRes, enrolledRes, highPriorityRes] = await Promise.all([
      buildFilteredCountQuery(false),
      buildFilteredCountQuery(true).gte("created_at", startToday),
      buildFilteredCountQuery(true).gte("last_contacted_at", startToday),
      buildFilteredCountQuery(true).eq("follow_up_date", todayStr),
      buildFilteredCountQuery(true).lt("follow_up_date", todayStr),
      buildFilteredCountQuery(true).eq("lead_status", "enrolled").gte("updated_at", startToday),
      buildFilteredCountQuery(true).eq("priority", "high"),
    ]);

    setStats({
      totalLeads: totalRes.count ?? 0,
      newToday: newTodayRes.count ?? 0,
      contactedToday: contactedRes.count ?? 0,
      followupsToday: followupsRes.count ?? 0,
      overdue: overdueRes.count ?? 0,
      enrolledToday: enrolledRes.count ?? 0,
      highPriority: highPriorityRes.count ?? 0,
    });
  }, [buildFilteredCountQuery]);

  const refreshAll = useCallback(() => {
    fetchLeads();
    fetchStats();
  }, [fetchLeads, fetchStats]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const filterSignature = JSON.stringify([sortDir, courseFilter, paymentFilter, modeFilter, statusFilter, hideContacted, quickFilter]);
  const prevFilterSignature = useRef(filterSignature);
  useEffect(() => {
    if (prevFilterSignature.current !== filterSignature) {
      prevFilterSignature.current = filterSignature;
      setPage(1);
    }
  }, [filterSignature]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [totalPages, page]);

  const goToPage = (p: number) => {
    if (p < 1 || p > totalPages || p === page) return;
    setPage(p);
  };

  const courseMap = useMemo(() => {
    const m = new Map<number, SyllabusRef>();
    courses.forEach((c) => m.set(c.id, c));
    return m;
  }, [courses]);

  // ---- Mutations (optimistic) ----

  const updateLeadStatus = async (id: number, lead_status: LeadStatus) => {
    const prev = leads;
    setLeads((cur) => cur.map((l) => (l.id === id ? { ...l, lead_status } : l)));
    markPending(id, true);
    const { error } = await supabase.from("crm_leads").update({ lead_status }).eq("id", id);
    markPending(id, false);
    if (error) {
      setLeads(prev);
      return;
    }
    flash(id);
    fetchStats();
  };

  const updateLeadPriority = async (id: number, priority: Priority) => {
    const prev = leads;
    setLeads((cur) => cur.map((l) => (l.id === id ? { ...l, priority } : l)));
    markPending(id, true);
    const { error } = await supabase.from("crm_leads").update({ priority }).eq("id", id);
    markPending(id, false);
    if (error) {
      setLeads(prev);
      return;
    }
    flash(id);
  };

  const updateLearningMode = async (id: number, learning_mode: LearningMode) => {
    const prev = leads;
    setLeads((cur) => cur.map((l) => (l.id === id ? { ...l, learning_mode } : l)));
    markPending(id, true);
    const { error } = await supabase.from("crm_leads").update({ learning_mode }).eq("id", id);
    markPending(id, false);
    if (error) {
      setLeads(prev);
      return;
    }
    flash(id);
  };

  const updateFollowUpDate = async (id: number, dateValue: string) => {
    const follow_up_date = dateValue === "" ? null : dateValue;
    const prev = leads;
    setLeads((cur) => cur.map((l) => (l.id === id ? { ...l, follow_up_date } : l)));
    markPending(id, true);
    const { error } = await supabase.from("crm_leads").update({ follow_up_date }).eq("id", id);
    markPending(id, false);
    if (error) {
      setLeads(prev);
      return;
    }
    flash(id);
    fetchStats();
  };

  // Newly-added course ids go to the FRONT of the array, so "last added"
  // always renders first wherever interested_course_ids is displayed.
  const updateInterestedCourses = async (id: number, ids: number[]) => {
    const prev = leads;
    setLeads((cur) => cur.map((l) => (l.id === id ? { ...l, interested_course_ids: ids } : l)));
    markPending(id, true);
    const { error } = await supabase.from("crm_leads").update({ interested_course_ids: ids }).eq("id", id);
    markPending(id, false);
    if (error) {
      setLeads(prev);
      return;
    }
    flash(id);
  };

  const addCallNote = async (id: number, note: string) => {
    const lead = leads.find((l) => l.id === id);
    if (!lead) return;
    const newNote: CallNote = { id: crypto.randomUUID(), note, created_at: new Date().toISOString() };
    const nextNotes = [...(lead.call_notes ?? []), newNote];
    const prev = leads;
    setLeads((cur) => cur.map((l) => (l.id === id ? { ...l, call_notes: nextNotes } : l)));
    const { error } = await supabase.from("crm_leads").update({ call_notes: nextNotes }).eq("id", id);
    if (error) setLeads(prev);
  };

  const updateCallDraft = (id: number, value: string) => setCallDrafts((prev) => ({ ...prev, [id]: value }));

  const submitCallLog = async (id: number) => {
    const note = (callDrafts[id] ?? "").trim();
    if (!note) return;
    const lead = leads.find((l) => l.id === id);
    if (!lead) return;

    const newNote: CallNote = { id: crypto.randomUUID(), note, created_at: new Date().toISOString() };
    const nextNotes = [...(lead.call_notes ?? []), newNote];
    const now = new Date().toISOString();

    const shouldMarkContacted = (lead.lead_status ?? "new") === "new";
    const nextStatus: LeadStatus = shouldMarkContacted ? "contacted" : lead.lead_status ?? "new";

    const prev = leads;
    setLeads((cur) => cur.map((l) => (l.id === id ? { ...l, call_notes: nextNotes, last_contacted_at: now, lead_status: nextStatus } : l)));
    setCallDrafts((d) => ({ ...d, [id]: "" }));
    markPending(id, true);

    const updatePayload: Partial<Pick<CrmLead, "call_notes" | "last_contacted_at" | "lead_status">> = { call_notes: nextNotes, last_contacted_at: now };
    if (shouldMarkContacted) updatePayload.lead_status = "contacted";

    const { error } = await supabase.from("crm_leads").update(updatePayload).eq("id", id);
    markPending(id, false);
    if (error) {
      setLeads(prev);
      return;
    }
    flash(id);
    fetchStats();
  };

  const visibleLeads = useMemo(() => {
    const indexed = leads.map((lead, index) => ({ lead, index }));
    if (!search.trim()) return indexed;
    const q = search.trim().toLowerCase();

    return indexed.filter(({ lead: l }) => {
      const safeName = (l.name ?? "").toLowerCase();
      const safePhone = (l.phone_number ?? "").replace(/\D/g, "");
      const safeCourse = (l.syllabi_v2?.name ?? "").toLowerCase();
      return safeName.includes(q) || safePhone.includes(q.replace(/\D/g, "")) || safeCourse.includes(q);
    });
  }, [leads, search]);

  const activeFilterCount = (courseFilter.length > 0 ? 1 : 0) + (paymentFilter !== "all" ? 1 : 0) + (modeFilter !== "all" ? 1 : 0) + (statusFilter !== "all" ? 1 : 0) + (hideContacted ? 1 : 0);

  const clearFilters = () => {
    setCourseFilter([]);
    setPaymentFilter("all");
    setModeFilter("all");
    setStatusFilter("all");
    setHideContacted(false);
    setQuickFilter(null);
  };

  const QUICK_FILTER_LABELS: Record<Exclude<QuickFilter, null>, string> = {
    newToday: "New today",
    contactedToday: "Contacted today",
    followupsToday: "Follow-ups today",
    overdue: "Overdue",
    enrolledToday: "Enrolled today",
  };

  const toggleQuickFilter = (qf: Exclude<QuickFilter, null>) => setQuickFilter((cur) => (cur === qf ? null : qf));

  const getFilterSummary = () => {
    const hasFilters = activeFilterCount > 0 || quickFilter || search.trim();
    if (!hasFilters) return "You are viewing all leads.";

    let text = "You are viewing ";

    if (quickFilter) {
      text += QUICK_FILTER_LABELS[quickFilter].toLowerCase() + " ";
    } else {
      if (statusFilter !== "all") text += STATUS_META.find((o) => o.value === statusFilter)?.label.toLowerCase() + " status ";
      if (hideContacted) text += "uncontacted ";
      text += "leads ";
    }

    const conditions: string[] = [];
    if (courseFilter.length > 0) {
      const names = courseFilter.map((id) => courseMap.get(id)?.name).filter(Boolean);
      if (names.length > 0) conditions.push(`for ${names.join(", ")}`);
    }
    if (modeFilter !== "all") conditions.push(`in ${MODE_META.find((o) => o.value === modeFilter)?.label.toLowerCase()} mode`);
    if (paymentFilter !== "all") conditions.push(`with ${paymentFilter} payment`);

    if (conditions.length > 0) text += conditions.join(", ");
    if (search.trim()) text += ` matching "${search.trim()}"`;

    return text + ".";
  };

  const rangeStart = totalCount === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(page * PAGE_SIZE, totalCount);
  const pageNumbers = getPageNumbers(page, totalPages);

  const drawerLead = drawerLeadId != null ? leads.find((l) => l.id === drawerLeadId) ?? null : null;

  return (
    <div className="crm-scroll-shell fixed inset-0 z-[999] flex h-screen w-screen flex-col overflow-hidden bg-[#F7F8FA] font-[Inter,ui-sans-serif,system-ui]">
      <style jsx global>{`
        ${TOKENS_STYLE}
        body {
          overflow: hidden;
        }
        body > header:not(.crm-shell-header),
        body > nav,
        body > footer:not(.crm-shell-header),
        [data-site-chrome],
        #site-navbar,
        #site-footer,
        .site-header,
        .site-footer {
          display: none !important;
        }
        .crm-scroll-shell {
          -webkit-font-smoothing: antialiased;
          text-rendering: optimizeLegibility;
        }
        .crm-scroll-shell ::-webkit-scrollbar {
          width: 9px;
          height: 9px;
        }
        .crm-scroll-shell ::-webkit-scrollbar-track {
          background: transparent;
        }
        .crm-scroll-shell ::-webkit-scrollbar-thumb {
          background-color: rgba(30, 58, 138, 0.22);
          border-radius: 9999px;
          border: 2px solid transparent;
          background-clip: content-box;
        }
        .crm-scroll-shell ::-webkit-scrollbar-thumb:hover {
          background-color: rgba(30, 58, 138, 0.4);
          background-clip: content-box;
        }
      `}</style>

      {/* Header / KPI command center */}
      <header className="crm-shell-header relative shrink-0 overflow-hidden border-b border-slate-200 bg-[var(--c-navy)]">
        <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.06]" aria-hidden>
          <defs>
            <pattern id="bp-grid" width="28" height="28" patternUnits="userSpaceOnUse">
              <path d="M28 0H0V28" fill="none" stroke="white" strokeWidth="0.75" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#bp-grid)" />
        </svg>
        <div className="pointer-events-none absolute -left-10 -top-24 h-56 w-56 rounded-full opacity-20 blur-3xl" style={{ background: "radial-gradient(circle, var(--c-accent), transparent 70%)" }} />
        <div className="pointer-events-none absolute -right-16 -bottom-24 h-64 w-64 rounded-full opacity-20 blur-3xl" style={{ background: "radial-gradient(circle, #38BDF8, transparent 70%)" }} />
        <div className="relative mx-auto flex max-w-[1500px] flex-wrap items-center justify-between gap-4 px-6 py-5">
          <div>
            <p className={cn(TX.micro, "flex items-center gap-1.5 font-mono uppercase tracking-[0.14em] text-[var(--c-accent)]")}>
              <Sparkles size={ICON.sm} />
              GyanHub · Lead Handler
            </p>
            <h1 className={cn(TX.title, "mt-1 bg-gradient-to-r from-white to-slate-300 bg-clip-text font-[Space_Grotesk,ui-sans-serif] font-semibold text-transparent")}>Priya Mam Dashboard</h1>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <KpiCard label={activeFilterCount > 0 ? "Matching filters" : "Total leads"} value={stats.totalLeads} icon={<Users size={ICON.md} />} accent="#93C5FD" onClick={quickFilter ? () => setQuickFilter(null) : undefined} active={!quickFilter} />
            <KpiCard label="New today" value={stats.newToday} icon={<UserPlus size={ICON.md} />} accent="#34D399" onClick={() => toggleQuickFilter("newToday")} active={quickFilter === "newToday"} />
            <KpiCard label="Courses" value={courses.length} icon={<BookOpen size={ICON.md} />} accent="#A78BFA" onClick={() => setShowCoursesModal(true)} />
            <KpiCard label="Contacted today" value={stats.contactedToday} icon={<PhoneCall size={ICON.md} />} accent="#38BDF8" onClick={() => toggleQuickFilter("contactedToday")} active={quickFilter === "contactedToday"} />
            <KpiCard label="Follow-ups today" value={stats.followupsToday} icon={<CalendarClock size={ICON.md} />} accent="#FBBF24" onClick={() => toggleQuickFilter("followupsToday")} active={quickFilter === "followupsToday"} />
            <KpiCard label="Overdue" value={stats.overdue} icon={<AlertTriangle size={ICON.md} />} accent="#FB7185" onClick={() => toggleQuickFilter("overdue")} active={quickFilter === "overdue"} />
            <KpiCard label="Enrolled today" value={stats.enrolledToday} icon={<CheckCircle2 size={ICON.md} />} accent="#34D399" onClick={() => toggleQuickFilter("enrolledToday")} active={quickFilter === "enrolledToday"} />

            <button onClick={refreshAll} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-control)] border border-white/15 text-white/80 transition-colors duration-150 hover:border-white/30 hover:bg-white/10 hover:text-white" title="Refresh">
              <RefreshCcw size={ICON.md} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>
      </header>

      {/* Scrollable middle region */}
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        {/* Filter bar */}
        <div className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
          <div className="mx-auto flex max-w-[1500px] flex-col gap-2 px-6 py-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="flex items-center gap-1.5 pr-1 text-slate-400">
                <SlidersHorizontal size={ICON.md} />
              </div>

              <div className="w-52">
                <CourseMultiSelect courses={courses} selected={courseFilter} onChange={setCourseFilter} placeholder="All courses" />
              </div>
              <PillSelect label="Status" value={statusFilter} options={STATUS_META} onChange={setStatusFilter} />
              <PillSelect label="Payment" value={paymentFilter} options={PAYMENT_OPTIONS} onChange={setPaymentFilter} />
              <PillSelect label="Mode" value={modeFilter} options={MODE_META} onChange={setModeFilter} />

              <button
                onClick={() => setHideContacted((h) => !h)}
                className={cn(BTN_GHOST_CLS, TX.body, "h-9 px-3", hideContacted && "border-[var(--c-blue)] bg-[var(--c-blue-soft)] text-[var(--c-blue)] hover:border-[var(--c-blue)]")}
              >
                <span className={cn("flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded border transition-colors duration-150", hideContacted ? "border-[var(--c-blue)] bg-[var(--c-blue)]" : "border-slate-300")}>
                  {hideContacted && <Check size={10} className="text-white" strokeWidth={3} />}
                </span>
                Hide contacted
              </button>

              <button onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))} className={cn(BTN_GHOST_CLS, TX.body, "h-9 px-3")}>
                {sortDir === "desc" ? <ArrowDown size={ICON.sm} /> : <ArrowUp size={ICON.sm} />}
                Last contacted
              </button>

              {quickFilter && (
                <span className={cn(TX.body, "flex h-9 items-center gap-1.5 rounded-[var(--radius-control)] bg-[var(--c-blue-soft)] px-3 font-medium text-[var(--c-blue)] ring-1 ring-inset ring-[var(--c-blue-ring)]")}>
                  <Sparkles size={ICON.sm} />
                  {QUICK_FILTER_LABELS[quickFilter]}
                  <button onClick={() => setQuickFilter(null)} className="ml-0.5 rounded-full p-0.5 transition-colors duration-150 hover:bg-[var(--c-blue)]/10" title="Clear quick filter">
                    <X size={ICON.sm} />
                  </button>
                </span>
              )}

              {activeFilterCount > 0 && (
                <button onClick={clearFilters} className={cn(TX.body, "flex h-9 items-center gap-1 rounded-[var(--radius-control)] px-2.5 font-medium text-slate-400 transition-colors duration-150 hover:text-slate-600")}>
                  <X size={ICON.sm} />
                  Clear ({activeFilterCount})
                </button>
              )}

              <div className="relative ml-auto w-72">
                <Search size={ICON.sm} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  ref={searchInputRef}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search name, phone, course…"
                  className={cn(INPUT_CLS, TX.body, "w-full pl-8 pr-16")}
                />
                <span className={cn(TX.micro, "pointer-events-none absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-0.5 rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-medium text-slate-400")}>
                  <Command size={10} />K
                </span>
              </div>
            </div>

            {(activeFilterCount > 0 || quickFilter || search.trim()) && (
              <div className={cn(TX.dense, "flex items-center gap-2 rounded-[var(--radius-control)] bg-[var(--c-blue-soft)] px-3 py-2 text-[var(--c-blue)]")}>
                <Sparkles size={ICON.sm} className="text-[var(--c-accent)]" />
                <span>{getFilterSummary()}</span>
              </div>
            )}
          </div>
        </div>

        {/* Table */}
        <main className="mx-auto w-full max-w-[1500px] px-6 py-6">
          <div className="overflow-hidden rounded-[var(--radius-card)] border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_28px_-16px_rgba(15,23,42,0.15)]">
            {error && (
              <div className={cn(TX.body, "flex items-center gap-2 border-b border-rose-200 bg-rose-50 px-4 py-3 text-rose-700")}>
                <AlertTriangle size={ICON.md} />
                Failed to load leads: {error}
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full min-w-[1180px] border-collapse text-left">
                <thead>
                  <tr className={cn(TX.micro, "border-b border-slate-200 bg-slate-50 font-semibold uppercase tracking-wider text-slate-500")}>
                    <th className="w-[44px] px-4 py-2.5">#</th>
                    <th className="w-[230px] px-4 py-2.5">Lead</th>
                    <th className="w-[240px] px-4 py-2.5">Notes</th>
                    <th className="w-[150px] px-4 py-2.5">Status</th>
                    <th className="w-[120px] px-4 py-2.5">Priority</th>
                    <th className="w-[150px] px-4 py-2.5">Follow-up</th>
                    <th className="w-[150px] px-4 py-2.5">Activity</th>
                    <th className="w-[44px] px-4 py-2.5" />
                  </tr>
                </thead>
                <tbody>
                  {loading && Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} i={i} />)}

                  {!loading && visibleLeads.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-4 py-16 text-center">
                        <Inbox size={26} className="mx-auto mb-2 text-slate-300" />
                        <p className={cn(TX.body, "font-medium text-slate-500")}>No leads match these filters</p>
                        <p className={cn(TX.dense, "mt-0.5 text-slate-400")}>Try clearing a filter or adjusting your search.</p>
                      </td>
                    </tr>
                  )}

                  {!loading &&
                    visibleLeads.map(({ lead, index }) => {
                      const isPending = pendingIds.has(lead.id);
                      const isFlashed = flashIds.has(lead.id);
                      const isExpanded = expandedRowId === lead.id;

                      const safePriority = lead.priority ?? "normal";
                      const safeStatus = lead.lead_status ?? "new";
                      const draft = callDrafts[lead.id] ?? "";
                      const followUp = formatFollowUp(lead.follow_up_date);
                      const serialNumber = (page - 1) * PAGE_SIZE + index + 1;
                      const whatsappUrl = buildWhatsAppUrl(lead.phone_number);
                      const tone = avatarTone(String(lead.id));

                      const sortedNotes = [...(lead.call_notes ?? [])].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
                      const latestNote = sortedNotes[0];
                      const noteCount = sortedNotes.length;

                      const interestedIds = lead.interested_course_ids ?? [];
                      const interestedNames = interestedIds.map((id) => courseMap.get(id)?.name).filter((n): n is string => Boolean(n));

                      const railColor = followUp.overdue ? "var(--c-danger)" : safePriority === "high" ? "var(--c-danger)" : safePriority === "low" ? "#CBD5E1" : "var(--c-blue)";

                      return (
                        <React.Fragment key={lead.id}>
                          <tr
                            className={cn("border-b border-slate-100 transition-colors duration-150", isFlashed ? "bg-emerald-50/60" : followUp.overdue ? "bg-rose-50/30 hover:bg-rose-50/60" : "hover:bg-slate-50/70")}
                            style={{ boxShadow: `inset 3px 0 0 ${railColor}` }}
                          >
                            <td className="overflow-hidden px-4 py-2.5 align-middle">
                              <p className={cn(TX.dense, "text-slate-400")}>{serialNumber}</p>
                            </td>

                            {/* Lead */}
                            <td className="overflow-hidden px-4 py-2.5 align-middle">
                              <div className="flex items-center gap-2.5">
                                <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-mono font-semibold", TX.dense, tone.bg, tone.text)}>{initials(lead.name)}</span>
                                <button onClick={() => setDrawerLeadId(lead.id)} className="min-w-0 flex-1 text-left" title="Open lead timeline">
                                  <div className="flex items-center gap-1.5">
                                    <p className={cn(TX.emph, "flex items-center gap-1 truncate font-mono font-semibold text-slate-800")}>
                                      <Phone size={ICON.sm} className="shrink-0 text-slate-400" />
                                      {formatPhone(lead.phone_number)}
                                    </p>
                                    {whatsappUrl && (
                                      <a
                                        href={whatsappUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        title="Message on WhatsApp"
                                        onClick={(e) => e.stopPropagation()}
                                        className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 transition-colors duration-150 hover:bg-emerald-100"
                                      >
                                        <MessageCircle size={ICON.sm} />
                                      </a>
                                    )}
                                  </div>
                                  <div className="flex min-w-0 items-center gap-1.5">
                                    {lead.name && <p className={cn(TX.micro, "truncate italic text-slate-400")}>{lead.name}</p>}
                                    {interestedNames.length > 0 && (
                                      <span className={cn(TX.micro, "min-w-0 truncate rounded bg-[var(--c-blue-soft)] px-1.5 py-0.5 font-medium text-[var(--c-blue)]")}>
                                        {interestedNames[0]}
                                        {interestedNames.length > 1 ? ` +${interestedNames.length - 1}` : ""}
                                      </span>
                                    )}
                                  </div>
                                </button>
                              </div>
                            </td>

                            {/* Notes — always visible, no expand needed */}
                            <td className="overflow-hidden px-4 py-2.5 align-middle">
                              <div className="flex items-center gap-1.5">
                                <input
                                  value={draft}
                                  onChange={(e) => updateCallDraft(lead.id, e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      e.preventDefault();
                                      submitCallLog(lead.id);
                                    }
                                  }}
                                  placeholder="फोनमा के कुरा भयो?"
                                  disabled={isPending}
                                  className={cn(INPUT_CLS, TX.dense, "w-full")}
                                />
                                <button onClick={() => submitCallLog(lead.id)} disabled={isPending || !draft.trim()} title="Save call log" className={cn(BTN_PRIMARY_CLS, "h-8 w-8 shrink-0 bg-[var(--c-accent)] hover:bg-[var(--c-accent)]/90")}>
                                  {isPending ? <Loader2 size={ICON.sm} className="animate-spin" /> : <MessageSquarePlus size={ICON.sm} />}
                                </button>
                              </div>
                              <button onClick={() => setDrawerLeadId(lead.id)} className="mt-1 flex w-full items-start gap-1 text-left transition-colors duration-150 hover:opacity-80" title="View all notes">
                                {latestNote ? (
                                  <p className={cn(TX.micro, "truncate text-slate-500")}>
                                    <span className="font-medium text-slate-600">{noteCount === 1 ? "1 note" : `${noteCount} notes`}:</span> {latestNote.note}
                                  </p>
                                ) : (
                                  <p className={cn(TX.micro, "text-slate-400")}>No notes yet — click to add</p>
                                )}
                              </button>
                            </td>

                            {/* Status */}
                            <td className="overflow-hidden px-4 py-2.5 align-middle">
                              <ChipSelect value={safeStatus} options={STATUS_META} onChange={(v) => updateLeadStatus(lead.id, v)} disabled={isPending} />
                            </td>

                            {/* Priority */}
                            <td className="overflow-hidden px-4 py-2.5 align-middle">
                              <ChipSelect value={safePriority} options={PRIORITY_META} onChange={(v) => updateLeadPriority(lead.id, v)} disabled={isPending} />
                            </td>

                            {/* Follow-up */}
                            <td className="overflow-hidden px-4 py-2.5 align-middle">
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="date"
                                  value={toDateInputValue(lead.follow_up_date)}
                                  onChange={(e) => updateFollowUpDate(lead.id, e.target.value)}
                                  disabled={isPending}
                                  className={cn(INPUT_CLS, TX.dense, "min-w-0 flex-1", followUp.overdue && "border-rose-300 text-rose-700")}
                                />
                                {lead.follow_up_date && (
                                  <button onClick={() => updateFollowUpDate(lead.id, "")} disabled={isPending} title="Clear follow-up date" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius-control)] text-slate-300 transition-colors duration-150 hover:bg-rose-50 hover:text-rose-500 disabled:opacity-50">
                                    <X size={ICON.sm} />
                                  </button>
                                )}
                              </div>
                              {lead.follow_up_date && <p className={cn(TX.micro, "mt-1", followUp.overdue ? "font-medium text-rose-500" : "text-slate-400")}>{followUp.overdue ? "Overdue · " : ""}{followUp.label}</p>}
                            </td>

                            {/* Activity */}
                            <td className="overflow-hidden px-4 py-2.5 align-middle">
                              <p className={cn(TX.body, "flex items-center gap-1 text-slate-600")}>
                                <Clock size={ICON.sm} className="shrink-0 text-slate-400" />
                                {formatRelative(lead.last_contacted_at)}
                              </p>
                            </td>

                            {/* Expand toggle */}
                            <td className="overflow-hidden px-4 py-2.5 align-middle">
                              <button
                                onClick={() => setExpandedRowId(isExpanded ? null : lead.id)}
                                title={isExpanded ? "Collapse" : "Edit courses / mode"}
                                className={cn("flex h-8 w-8 items-center justify-center rounded-[var(--radius-control)] text-slate-400 transition-colors duration-150 hover:bg-slate-100 hover:text-slate-600", isExpanded && "bg-[var(--c-blue-soft)] text-[var(--c-blue)]")}
                              >
                                <ChevronDown size={ICON.md} className={cn("transition-transform duration-150", isExpanded && "rotate-180")} />
                              </button>
                            </td>
                          </tr>

                          {isExpanded && (
                            <tr key={`${lead.id}-expanded`} className="border-b border-slate-100 bg-slate-50/60">
                              <td colSpan={8} className="px-4 py-4">
                                <div>
                                  <p className={cn(TX.micro, "mb-1.5 font-semibold uppercase tracking-wide text-slate-400")}>Interested courses</p>
                                  <div className="max-w-md">
                                    <CourseMultiSelect courses={courses} selected={interestedIds} onChange={(ids) => updateInterestedCourses(lead.id, ids)} placeholder="Select courses…" addNewToFront />
                                  </div>
                                  {interestedNames.length > 0 && (
                                    <div className="mt-1.5 flex flex-wrap gap-1">
                                      {interestedNames.map((name, i) => (
                                        <span key={i} className={cn(TX.micro, "rounded bg-white px-1.5 py-0.5 font-medium text-[var(--c-blue)] ring-1 ring-inset ring-[var(--c-blue-ring)]")}>
                                          {name}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                  <div className="mt-3 flex items-center gap-2">
                                    <p className={cn(TX.micro, "font-semibold uppercase tracking-wide text-slate-400")}>Mode</p>
                                    {lead.learning_mode === "physical" ? <MapPin size={ICON.sm} className="text-slate-400" /> : <Globe size={ICON.sm} className="text-slate-400" />}
                                    <div className="w-32">
                                      <ChipSelect value={lead.learning_mode ?? "online"} options={MODE_META} onChange={(v) => updateLearningMode(lead.id, v)} disabled={isPending} />
                                    </div>
                                    {lead.payment_status && <span className={cn(TX.micro, "rounded px-1.5 py-0.5 font-medium", PAYMENT_BADGE[lead.payment_status])}>{lead.payment_status}</span>}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className={cn(TX.dense, "font-mono text-slate-500")}>
              Showing {rangeStart.toLocaleString()}–{rangeEnd.toLocaleString()} of {totalCount.toLocaleString()} leads
            </p>
            <div className="flex items-center gap-1.5">
              <button onClick={() => goToPage(page - 1)} disabled={page <= 1 || loading} className={cn(BTN_GHOST_CLS, TX.dense, "h-8 px-2.5")}>
                <ChevronLeft size={ICON.sm} />
                Previous
              </button>

              {pageNumbers.map((p, i) =>
                p === "ellipsis" ? (
                  <span key={`e-${i}`} className={cn(TX.dense, "px-1 text-slate-400")}>
                    …
                  </span>
                ) : (
                  <button
                    key={p}
                    onClick={() => goToPage(p)}
                    disabled={loading}
                    className={cn(
                      "flex h-8 min-w-[32px] items-center justify-center rounded-[var(--radius-control)] border font-medium transition-colors duration-150 disabled:cursor-not-allowed",
                      TX.dense,
                      p === page ? "border-[var(--c-blue)] bg-[var(--c-blue)] text-white" : "border-slate-300 text-slate-600 hover:border-[var(--c-blue)]/40 hover:text-[var(--c-blue)]"
                    )}
                  >
                    {p}
                  </button>
                )
              )}

              <button onClick={() => goToPage(page + 1)} disabled={page >= totalPages || loading} className={cn(BTN_GHOST_CLS, TX.dense, "h-8 px-2.5")}>
                Next
                <ChevronRight size={ICON.sm} />
              </button>
            </div>
          </div>

          <p className={cn(TX.micro, "mt-3 text-center font-mono text-slate-400")}>
            Every edit re-syncs <span className="text-slate-500">updated_at</span> automatically via <span className="text-slate-500">trigger_update_crm_updated_at</span>.
          </p>
        </main>
      </div>

      {/* Productivity footer */}
      <footer className="crm-shell-header shrink-0 border-t border-slate-200 bg-[var(--c-navy)]">
        <div className={cn(TX.dense, "mx-auto flex max-w-[1500px] flex-wrap items-center justify-center gap-x-8 gap-y-2 px-6 py-2.5 text-slate-200")}>
          <span className="flex items-center gap-1.5">
            <BookOpen size={ICON.sm} className="text-violet-300" />
            {courses.length} courses
          </span>
          <span className="hidden h-3.5 w-px bg-white/15 sm:block" />
          <span className="flex items-center gap-1.5">
            <UserPlus size={ICON.sm} className="text-emerald-300" />
            {stats.newToday} new today
          </span>
          <span className="hidden h-3.5 w-px bg-white/15 sm:block" />
          <span className="flex items-center gap-1.5">
            <PhoneCall size={ICON.sm} className="text-sky-300" />
            {stats.contactedToday} contacted today
          </span>
          <span className="hidden h-3.5 w-px bg-white/15 sm:block" />
          <span className="flex items-center gap-1.5">
            <CalendarClock size={ICON.sm} className="text-amber-300" />
            {stats.followupsToday} follow-ups today
          </span>
          <span className="hidden h-3.5 w-px bg-white/15 sm:block" />
          <span className="flex items-center gap-1.5">
            <AlertTriangle size={ICON.sm} className="text-rose-300" />
            {stats.overdue} overdue
          </span>
          <span className="hidden h-3.5 w-px bg-white/15 sm:block" />
          <span className="flex items-center gap-1.5">
            <Flame size={ICON.sm} className="text-rose-300" />
            {stats.highPriority} high priority
          </span>
          <span className="hidden h-3.5 w-px bg-white/15 sm:block" />
          <span className="flex items-center gap-1.5">
            <CheckCircle2 size={ICON.sm} className="text-emerald-300" />
            {stats.enrolledToday} enrolled today
          </span>
          {activeFilterCount > 0 && (
            <>
              <span className="hidden h-3.5 w-px bg-white/15 sm:block" />
              <span className="text-slate-400">· matching current filters, across all pages</span>
            </>
          )}
        </div>
      </footer>

      {/* Right-side lead drawer */}
      <AnimatePresence>{drawerLead && <LeadDrawer lead={drawerLead} onClose={() => setDrawerLeadId(null)} onAddNote={addCallNote} />}</AnimatePresence>

      {/* Courses Modal Overlay */}
      <AnimatePresence>{showCoursesModal && <CoursesModal courses={courses} onClose={() => setShowCoursesModal(false)} />}</AnimatePresence>
    </div>
  );
}