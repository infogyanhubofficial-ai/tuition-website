"use client";

/**
 * app/admin/crm-leads/page.tsx
 *
 * Customer Handler Dashboard — public.crm_leads
 * Fully self-contained route file: types, Supabase client, helpers,
 * and all sub-components are inlined. No /lib imports, per convention.
 */

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";
import { AnimatePresence, motion } from "framer-motion";
import {
  Phone,
  ChevronDown,
  ChevronUp,
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
  Tag,
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
  Star,
  Sparkles,
} from "lucide-react";

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
  interested_course_ids: number[] | null;
  // joined
  syllabi_v2: SyllabusRef | null;
}

type SortDir = "asc" | "desc";

type QuickFilter = "contactedToday" | "followupsToday" | "overdue" | "enrolledToday" | null;

interface DashboardStats {
  totalLeads: number;
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

const LEAD_STATUS_OPTIONS: { value: LeadStatus; label: string }[] = [
  { value: "new", label: "New" },
  { value: "old", label: "Old" },
  { value: "contacted", label: "Contacted" },
  { value: "follow_up", label: "Follow-up" },
  { value: "interested", label: "Interested" },
  { value: "not_interested", label: "Not interested" },
  { value: "enrolled", label: "Enrolled" },
];

const PAYMENT_OPTIONS: { value: PaymentStatus; label: string }[] = [
  { value: "unpaid", label: "Unpaid" },
  { value: "advance", label: "Advance" },
  { value: "paid", label: "Paid" },
];

const MODE_OPTIONS: { value: LearningMode; label: string }[] = [
  { value: "online", label: "Online" },
  { value: "physical", label: "Physical" },
];

const PRIORITY_OPTIONS: { value: Priority; label: string }[] = [
  { value: "high", label: "High" },
  { value: "normal", label: "Normal" },
  { value: "low", label: "Low" },
];

const PRIORITY_RAIL: Record<Priority, string> = {
  high: "#DC2626",
  normal: "#1E3A6E",
  low: "#9AA5B5",
};

const OVERDUE_RAIL = "#E11D48";

const PRIORITY_SELECT_TONE: Record<Priority, string> = {
  high: "border-rose-300 text-rose-700",
  normal: "border-slate-300 text-slate-700",
  low: "border-slate-300 text-slate-400",
};

const PAYMENT_BADGE: Record<PaymentStatus, string> = {
  paid: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200",
  advance: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200",
  unpaid: "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200",
};

const PAYMENT_DOT: Record<PaymentStatus, string> = {
  paid: "bg-emerald-500",
  advance: "bg-amber-500",
  unpaid: "bg-rose-500",
};

const STATUS_CHIP: Record<LeadStatus, { dot: string; tone: string; label: string }> = {
  new: { dot: "bg-slate-400", tone: "bg-slate-50 text-slate-600 ring-1 ring-inset ring-slate-200", label: "New" },
  old: { dot: "bg-slate-300", tone: "bg-slate-50 text-slate-400 ring-1 ring-inset ring-slate-200", label: "Old" },
  contacted: { dot: "bg-sky-500", tone: "bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-200", label: "Contacted" },
  follow_up: { dot: "bg-amber-500", tone: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200", label: "Follow-up" },
  interested: { dot: "bg-indigo-500", tone: "bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-200", label: "Interested" },
  not_interested: { dot: "bg-rose-400", tone: "bg-rose-50 text-rose-500 ring-1 ring-inset ring-rose-200", label: "Not interested" },
  enrolled: { dot: "bg-emerald-500", tone: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200", label: "Enrolled" },
};

const AVATAR_PALETTE: { bg: string; text: string }[] = [
  { bg: "bg-[#1E3A6E]/[0.08]", text: "text-[#1E3A6E]" },
  { bg: "bg-emerald-50", text: "text-emerald-700" },
  { bg: "bg-amber-50", text: "text-amber-700" },
  { bg: "bg-rose-50", text: "text-rose-600" },
  { bg: "bg-violet-50", text: "text-violet-700" },
  { bg: "bg-sky-50", text: "text-sky-700" },
  { bg: "bg-[#F2711C]/[0.10]", text: "text-[#F2711C]" },
  { bg: "bg-teal-50", text: "text-teal-700" },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function cn(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}

function formatRelative(iso: string | null | undefined): string {
  if (!iso) return "Never Contacted";
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
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
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

  const diffTime = target.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  let label = "";
  if (diffDays === 0) {
    label = "Today";
  } else if (diffDays === 1) {
    label = "After 1 day";
  } else if (diffDays === -1) {
    label = "1 day ago";
  } else if (diffDays > 0) {
    label = `After ${diffDays} days`;
  } else {
    label = `${Math.abs(diffDays)} days ago`;
  }

  const overdue = diffDays < 0;
  return { label, overdue };
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
// KPI card
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
        "group flex items-center gap-3 rounded-xl border px-3.5 py-2.5 text-left transition-all duration-200 ease-out",
        onClick && "cursor-pointer hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.07] hover:shadow-[0_8px_20px_-8px_rgba(0,0,0,0.5)]",
        active ? "border-white/30 bg-white/[0.09] shadow-[0_8px_20px_-8px_rgba(0,0,0,0.5)]" : "border-white/10 bg-white/[0.04]"
      )}
    >
      <span
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md transition-transform duration-200 ease-out group-hover:scale-110"
        style={{
          background: `linear-gradient(135deg, ${accent}33, ${accent}14)`,
          color: accent,
          boxShadow: active ? `0 0 0 1px ${accent}55 inset` : undefined,
        }}
      >
        {icon}
      </span>
      <div className="min-w-0">
        <p className="font-mono text-[17px] font-semibold leading-none text-white">
          <AnimatedNumber value={value} />
        </p>
        <p className="mt-1 truncate text-[10.5px] uppercase tracking-wide text-slate-300">{label}</p>
      </div>
    </Tag>
  );
}

// ---------------------------------------------------------------------------
// Multi-select popover (courses)
// ---------------------------------------------------------------------------

function CourseMultiSelect({
  courses,
  selected,
  onChange,
  triggerLabel = "Select courses...",
}: {
  courses: SyllabusRef[];
  selected: number[];
  onChange: (ids: number[]) => void;
  triggerLabel?: string;
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
    onChange(selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id]);
  };

  return (
    <div className="relative w-full" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex h-8 w-full items-center gap-2 rounded-md border px-2.5 text-[12px] font-medium transition-colors bg-white",
          selected.length > 0
            ? "border-[#1E3A6E] text-[#1E3A6E] bg-[#1E3A6E]/[0.02]"
            : "border-slate-300 text-slate-500 hover:border-slate-400"
        )}
      >
        <span className="truncate">{triggerLabel}</span>
        <ChevronDown size={14} className={cn("ml-auto shrink-0 transition-transform", open && "rotate-180")} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.12 }}
            className="absolute left-0 z-30 mt-1.5 max-h-72 w-64 overflow-y-auto rounded-md border border-slate-200 bg-white p-1.5 shadow-lg"
          >
            {courses.length === 0 && (
              <p className="px-2 py-3 text-center text-[13px] text-slate-400">No courses found</p>
            )}
            {courses.map((c) => {
              const active = selected.includes(c.id);
              return (
                <button
                  key={c.id}
                  onClick={() => toggle(c.id)}
                  className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-[13px] text-slate-700 hover:bg-slate-50"
                >
                  <span
                    className={cn(
                      "flex h-4 w-4 shrink-0 items-center justify-center rounded border",
                      active ? "border-[#1E3A6E] bg-[#1E3A6E]" : "border-slate-300"
                    )}
                  >
                    {active && <Check size={11} className="text-white" strokeWidth={3} />}
                  </span>
                  <span className="truncate">{c.name}</span>
                </button>
              );
            })}
            {selected.length > 0 && (
              <button
                onClick={() => onChange([])}
                className="mt-1 w-full rounded px-2 py-1.5 text-left text-[12px] font-medium text-slate-400 hover:bg-slate-50 hover:text-slate-600"
              >
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
// Simple single-select pill filter
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
          "h-9 cursor-pointer appearance-none rounded-md border bg-white pl-3 pr-8 text-[13px] font-medium outline-none transition-colors",
          value !== "all"
            ? "border-[#1E3A6E] bg-[#1E3A6E]/[0.04] text-[#1E3A6E]"
            : "border-slate-300 text-slate-600 hover:border-slate-400"
        )}
      >
        <option value="all">{label}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown size={14} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Status chip dropdown
// ---------------------------------------------------------------------------

function StatusChipSelect({
  value,
  onChange,
  disabled,
}: {
  value: LeadStatus;
  onChange: (v: LeadStatus) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const chip = STATUS_CHIP[value];

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
        className={cn(
          "flex h-8 w-full items-center gap-1.5 rounded-md px-2 text-[12.5px] font-medium transition-opacity disabled:opacity-50",
          chip.tone
        )}
      >
        <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", chip.dot)} />
        <span className="truncate">{chip.label}</span>
        <ChevronDown size={12} className="ml-auto shrink-0 opacity-60" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.12 }}
            className="absolute left-0 z-30 mt-1.5 w-44 overflow-hidden rounded-md border border-slate-200 bg-white p-1 shadow-lg"
          >
            {LEAD_STATUS_OPTIONS.map((o) => {
              const c = STATUS_CHIP[o.value];
              return (
                <button
                  key={o.value}
                  onClick={() => {
                    onChange(o.value);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-[12.5px] font-medium hover:bg-slate-50",
                    o.value === value ? "text-slate-900" : "text-slate-600"
                  )}
                >
                  <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", c.dot)} />
                  {o.label}
                  {o.value === value && <Check size={12} className="ml-auto text-slate-400" />}
                </button>
              );
            })}
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
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.15 }}
        className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-4">
          <div className="flex items-center gap-2">
            <BookOpen size={18} className="text-violet-500" />
            <h2 className="text-[16px] font-semibold text-slate-800">Available Courses</h2>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-md text-slate-400 hover:bg-slate-200 hover:text-slate-600"
          >
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto bg-slate-50/50 p-4 space-y-2">
          {courses.map((c) => (
            <div key={c.id} className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
              <button
                onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}
                className="flex w-full items-center justify-between px-4 py-3.5 text-left transition-colors hover:bg-slate-50/80"
              >
                <span className="font-medium text-slate-800">{c.name}</span>
                <ChevronDown
                  size={16}
                  className={cn("text-slate-400 transition-transform", expandedId === c.id && "rotate-180")}
                />
              </button>
              <AnimatePresence>
                {expandedId === c.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                  >
                    <div className="border-t border-slate-100 bg-slate-50 px-4 py-4 text-[13.5px] leading-relaxed text-slate-600">
                      <p className="whitespace-pre-wrap">{c.description || "No description available for this course."}</p>
                      {c.online_tutors?.name && (
                        <div className="mt-3 flex items-center gap-1.5 rounded bg-white px-2.5 py-1.5 text-[12px] font-medium text-slate-700 shadow-sm w-fit border border-slate-200">
                          <GraduationCap size={14} className="text-slate-400" />
                          Tutor: {c.online_tutors.name}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
          {courses.length === 0 && (
            <p className="py-10 text-center text-[14px] text-slate-400">No courses available.</p>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Right-side lead drawer
// ---------------------------------------------------------------------------

function LeadDrawer({
  lead,
  onClose,
  onAddNote,
}: {
  lead: CrmLead;
  onClose: () => void;
  onAddNote: (leadId: number, note: string) => Promise<void>;
}) {
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
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-[1px]"
      />
      <motion.aside
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", stiffness: 340, damping: 34 }}
        className="fixed right-0 top-0 z-50 flex h-screen w-full max-w-[440px] flex-col border-l border-slate-200 bg-white shadow-2xl"
      >
        <div className="flex items-center gap-3 border-b border-slate-200 bg-[#12203D] px-5 py-4">
          <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-mono text-[13px] font-semibold", tone.bg, tone.text)}>
            {initials(lead.name)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate font-mono text-[15px] font-semibold text-white">{formatPhone(lead.phone_number)}</p>
            <p className="truncate text-[12.5px] text-slate-300">{lead.name ?? "Unnamed lead"}</p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-white/70 hover:bg-white/10 hover:text-white"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
          <div className="rounded-md border border-slate-200 bg-white px-4 py-3.5">
            <p className="mb-3 flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-slate-400">
              <History size={12} />
              Timeline · {(lead.call_notes ?? []).length} {(lead.call_notes ?? []).length === 1 ? "entry" : "entries"}
            </p>
            {groups.length === 0 ? (
              <p className="text-[13px] text-slate-400">No notes yet.</p>
            ) : (
              <div className="space-y-4">
                {groups.map((g) => (
                  <div key={g.label}>
                    <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">{g.label}</p>
                    <div className="space-y-1.5">
                      {g.notes.map((n) => (
                        <div key={n.id} className="relative rounded-md border border-slate-200 bg-white px-3 py-2 pl-4">
                          <span className="absolute left-0 top-0 h-full w-[3px] rounded-l-md bg-[#1E3A6E]/20" />
                          <p className="text-[13px] leading-snug text-slate-700">{n.note}</p>
                          <p className="mt-1 font-mono text-[11px] text-slate-400">
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
          <p className="mb-2 font-mono text-[11px] uppercase tracking-wider text-slate-400">Add entry</p>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="What happened on the call…"
            rows={2}
            className="w-full resize-none rounded-md border border-slate-300 bg-white px-3 py-2 text-[13px] text-slate-700 outline-none placeholder:text-slate-400 focus:border-[#1E3A6E]"
          />
          <button
            onClick={submit}
            disabled={!draft.trim() || saving}
            className="mt-2 flex h-8 w-full items-center justify-center gap-1.5 rounded-md bg-[#12203D] text-[13px] font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {saving ? <Loader2 size={13} className="animate-spin" /> : <MessageSquarePlus size={13} />}
            Log note
          </button>
        </div>
      </motion.aside>
    </>
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
  const [priorityFilter, setPriorityFilter] = useState<Priority | "all">("all");
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
    const { data, error } = await supabase
      .from("syllabi_v2")
      .select("id, name, description, online_tutors(name)")
      .order("name", { ascending: true });
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
    if (priorityFilter !== "all") query = query.eq("priority", priorityFilter);
    if (statusFilter !== "all") query = query.eq("lead_status", statusFilter);
    if (hideContacted) query = query.neq("lead_status", "contacted");

    const startToday = startOfTodayIso();
    const todayStr = todayInputValue();
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
  }, [sortDir, courseFilter, paymentFilter, modeFilter, priorityFilter, statusFilter, hideContacted, quickFilter, page]);

  const buildFilteredCountQuery = useCallback((ignoreHideContacted = false) => {
    let query = supabase.from("crm_leads").select("id", { count: "exact", head: true });
    if (courseFilter.length > 0) {
      const idList = courseFilter.join(",");
      query = query.or(`course_id.in.(${idList}),interested_course_ids.ov.{${idList}}`);
    }
    if (paymentFilter !== "all") query = query.eq("payment_status", paymentFilter);
    if (modeFilter !== "all") query = query.eq("learning_mode", modeFilter);
    if (priorityFilter !== "all") query = query.eq("priority", priorityFilter);
    if (statusFilter !== "all") query = query.eq("lead_status", statusFilter);
    if (!ignoreHideContacted && hideContacted) query = query.neq("lead_status", "contacted");
    return query;
  }, [courseFilter, paymentFilter, modeFilter, priorityFilter, statusFilter, hideContacted]);

  const fetchStats = useCallback(async () => {
    const startToday = startOfTodayIso();
    const todayStr = todayInputValue();

    // Pass `true` for ignoreHideContacted for activity-based KPIs so they don't drop to 0 when hiding contacted leads
    const [totalRes, contactedRes, followupsRes, overdueRes, enrolledRes, highPriorityRes] =
      await Promise.all([
        buildFilteredCountQuery(false), // Respects hideContacted for Total matching filters
        buildFilteredCountQuery(true).gte("last_contacted_at", startToday),
        buildFilteredCountQuery(true).eq("follow_up_date", todayStr),
        buildFilteredCountQuery(true).lt("follow_up_date", todayStr),
        buildFilteredCountQuery(true).eq("lead_status", "enrolled").gte("updated_at", startToday),
        buildFilteredCountQuery(true).eq("priority", "high"),
      ]);

    setStats({
      totalLeads: totalRes.count ?? 0,
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

  const filterSignature = JSON.stringify([
    sortDir,
    courseFilter,
    paymentFilter,
    modeFilter,
    priorityFilter,
    statusFilter,
    hideContacted,
    quickFilter,
  ]);
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

  const updateInterestedCourses = async (id: number, ids: number[]) => {
    const prev = leads;
    setLeads((cur) => cur.map((l) => (l.id === id ? { ...l, interested_course_ids: ids } : l)));
    markPending(id, true);
    const { error } = await supabase
      .from("crm_leads")
      .update({ interested_course_ids: ids })
      .eq("id", id);
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
    const newNote: CallNote = {
      id: crypto.randomUUID(),
      note,
      created_at: new Date().toISOString(),
    };
    const nextNotes = [...(lead.call_notes ?? []), newNote];
    const prev = leads;
    setLeads((cur) => cur.map((l) => (l.id === id ? { ...l, call_notes: nextNotes } : l)));
    const { error } = await supabase
      .from("crm_leads")
      .update({ call_notes: nextNotes })
      .eq("id", id);
    if (error) setLeads(prev);
  };

  const updateCallDraft = (id: number, value: string) =>
    setCallDrafts((prev) => ({ ...prev, [id]: value }));

  const submitCallLog = async (id: number) => {
    const note = (callDrafts[id] ?? "").trim();
    if (!note) return;
    const lead = leads.find((l) => l.id === id);
    if (!lead) return;

    const newNote: CallNote = {
      id: crypto.randomUUID(),
      note,
      created_at: new Date().toISOString(),
    };
    const nextNotes = [...(lead.call_notes ?? []), newNote];
    const now = new Date().toISOString();

    const shouldMarkContacted = (lead.lead_status ?? "new") === "new";
    const nextStatus: LeadStatus = shouldMarkContacted ? "contacted" : lead.lead_status ?? "new";

    const prev = leads;
    setLeads((cur) =>
      cur.map((l) =>
        l.id === id
          ? { ...l, call_notes: nextNotes, last_contacted_at: now, lead_status: nextStatus }
          : l
      )
    );
    setCallDrafts((d) => ({ ...d, [id]: "" }));
    markPending(id, true);

    const updatePayload: Partial<Pick<CrmLead, "call_notes" | "last_contacted_at" | "lead_status">> = {
      call_notes: nextNotes,
      last_contacted_at: now,
    };
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
      return (
        safeName.includes(q) ||
        safePhone.includes(q.replace(/\D/g, "")) ||
        safeCourse.includes(q)
      );
    });
  }, [leads, search]);

  const activeFilterCount =
    (courseFilter.length > 0 ? 1 : 0) +
    (paymentFilter !== "all" ? 1 : 0) +
    (modeFilter !== "all" ? 1 : 0) +
    (priorityFilter !== "all" ? 1 : 0) +
    (statusFilter !== "all" ? 1 : 0) +
    (hideContacted ? 1 : 0);

  const clearFilters = () => {
    setCourseFilter([]);
    setPaymentFilter("all");
    setModeFilter("all");
    setPriorityFilter("all");
    setStatusFilter("all");
    setHideContacted(false);
    setQuickFilter(null);
  };

  const QUICK_FILTER_LABELS: Record<Exclude<QuickFilter, null>, string> = {
    contactedToday: "Contacted today",
    followupsToday: "Follow-ups today",
    overdue: "Overdue",
    enrolledToday: "Enrolled today",
  };

  const toggleQuickFilter = (qf: Exclude<QuickFilter, null>) =>
    setQuickFilter((cur) => (cur === qf ? null : qf));

  const getFilterSummary = () => {
    const hasFilters = activeFilterCount > 0 || quickFilter || search.trim();
    if (!hasFilters) return "You are viewing all leads.";

    let text = "You are viewing ";

    if (quickFilter) {
      text += QUICK_FILTER_LABELS[quickFilter].toLowerCase() + " ";
    } else {
      if (statusFilter !== "all") {
        text += LEAD_STATUS_OPTIONS.find((o) => o.value === statusFilter)?.label.toLowerCase() + " status ";
      }
      if (hideContacted && statusFilter !== "contacted") {
        text += "uncontacted ";
      }
      text += "leads ";
    }

    const conditions = [];
    if (courseFilter.length > 0) {
      const names = courseFilter.map((id) => courseMap.get(id)?.name).filter(Boolean);
      if (names.length > 0) {
        conditions.push(`for ${names.join(", ")}`);
      }
    }
    if (modeFilter !== "all") conditions.push(`in ${MODE_OPTIONS.find((o) => o.value === modeFilter)?.label.toLowerCase()} mode`);
    if (priorityFilter !== "all") conditions.push(`with ${priorityFilter} priority`);
    if (paymentFilter !== "all") conditions.push(`with ${paymentFilter} payment`);

    if (conditions.length > 0) {
      text += conditions.join(", ");
    }

    if (search.trim()) {
      text += ` matching "${search.trim()}"`;
    }

    return text + ".";
  };

  const rangeStart = totalCount === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(page * PAGE_SIZE, totalCount);
  const pageNumbers = getPageNumbers(page, totalPages);

  const drawerLead = drawerLeadId != null ? leads.find((l) => l.id === drawerLeadId) ?? null : null;

  return (
    <div className="crm-scroll-shell fixed inset-0 z-[999] flex h-screen w-screen flex-col overflow-hidden bg-[#F7F8FA] font-[Inter,ui-sans-serif,system-ui]">
      <style jsx global>{`
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
          background-color: rgba(30, 58, 110, 0.22);
          border-radius: 9999px;
          border: 2px solid transparent;
          background-clip: content-box;
        }
        .crm-scroll-shell ::-webkit-scrollbar-thumb:hover {
          background-color: rgba(30, 58, 110, 0.4);
          background-clip: content-box;
        }
      `}</style>

      {/* Header / KPI command center */}
      <header className="crm-shell-header relative shrink-0 overflow-hidden border-b border-slate-200 bg-[#12203D]">
        <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.06]" aria-hidden>
          <defs>
            <pattern id="bp-grid" width="28" height="28" patternUnits="userSpaceOnUse">
              <path d="M28 0H0V28" fill="none" stroke="white" strokeWidth="0.75" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#bp-grid)" />
        </svg>
        <div
          className="pointer-events-none absolute -left-10 -top-24 h-56 w-56 rounded-full opacity-20 blur-3xl"
          style={{ background: "radial-gradient(circle, #F2711C, transparent 70%)" }}
        />
        <div
          className="pointer-events-none absolute -right-16 -bottom-24 h-64 w-64 rounded-full opacity-20 blur-3xl"
          style={{ background: "radial-gradient(circle, #38BDF8, transparent 70%)" }}
        />
        <div className="relative mx-auto flex max-w-[1500px] flex-wrap items-center justify-between gap-4 px-6 py-5">
          <div>
            <p className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-[#F2711C]">
              <Sparkles size={11} />
              GyanHub · Lead Handler
            </p>
            <h1 className="mt-1 bg-gradient-to-r from-white to-slate-300 bg-clip-text font-[Space_Grotesk,ui-sans-serif] text-[22px] font-semibold text-transparent">
              Priya Mam Dashboard
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <KpiCard
              label={activeFilterCount > 0 ? "Matching filters" : "Total leads"}
              value={stats.totalLeads}
              icon={<Users size={15} />}
              accent="#93C5FD"
              onClick={quickFilter ? () => setQuickFilter(null) : undefined}
              active={!quickFilter}
            />
            <KpiCard
              label="Courses"
              value={courses.length}
              icon={<BookOpen size={15} />}
              accent="#A78BFA"
              onClick={() => setShowCoursesModal(true)}
            />
            <KpiCard
              label="Contacted today"
              value={stats.contactedToday}
              icon={<PhoneCall size={15} />}
              accent="#38BDF8"
              onClick={() => toggleQuickFilter("contactedToday")}
              active={quickFilter === "contactedToday"}
            />
            <KpiCard
              label="Follow-ups today"
              value={stats.followupsToday}
              icon={<CalendarClock size={15} />}
              accent="#FBBF24"
              onClick={() => toggleQuickFilter("followupsToday")}
              active={quickFilter === "followupsToday"}
            />
            <KpiCard
              label="Overdue"
              value={stats.overdue}
              icon={<AlertTriangle size={15} />}
              accent="#FB7185"
              onClick={() => toggleQuickFilter("overdue")}
              active={quickFilter === "overdue"}
            />
            <KpiCard
              label="Enrolled today"
              value={stats.enrolledToday}
              icon={<CheckCircle2 size={15} />}
              accent="#34D399"
              onClick={() => toggleQuickFilter("enrolledToday")}
              active={quickFilter === "enrolledToday"}
            />

            <button
              onClick={refreshAll}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-white/15 text-white/80 transition-all duration-200 hover:-translate-y-0.5 hover:border-white/30 hover:bg-white/10 hover:text-white active:translate-y-0"
              title="Refresh"
            >
              <RefreshCcw size={15} className={loading ? "animate-spin" : ""} />
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
                <SlidersHorizontal size={14} />
              </div>

              <CourseMultiSelect courses={courses} selected={courseFilter} onChange={setCourseFilter} triggerLabel="Filter courses" />
              <PillSelect label="Status" value={statusFilter} options={LEAD_STATUS_OPTIONS} onChange={setStatusFilter} />
              <PillSelect label="Payment" value={paymentFilter} options={PAYMENT_OPTIONS} onChange={setPaymentFilter} />
              <PillSelect label="Mode" value={modeFilter} options={MODE_OPTIONS} onChange={setModeFilter} />
              <PillSelect label="Priority" value={priorityFilter} options={PRIORITY_OPTIONS} onChange={setPriorityFilter} />
              
              <button
                onClick={() => setHideContacted((h) => !h)}
                className={cn(
                  "flex h-9 items-center gap-2 rounded-md border px-3 text-[13px] font-medium transition-colors",
                  hideContacted ? "border-[#1E3A6E] bg-[#1E3A6E]/[0.04] text-[#1E3A6E]" : "border-slate-300 text-slate-600 hover:border-slate-400"
                )}
              >
                <span className={cn("flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded border transition-colors", hideContacted ? "border-[#1E3A6E] bg-[#1E3A6E]" : "border-slate-300")}>
                  {hideContacted && <Check size={10} className="text-white" strokeWidth={3} />}
                </span>
                Hide Contacted
              </button>

              <button
                onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
                className="flex h-9 items-center gap-1.5 rounded-md border border-slate-300 px-3 text-[13px] font-medium text-slate-600 transition-all duration-150 hover:border-[#1E3A6E]/40 hover:bg-[#1E3A6E]/[0.03] hover:text-[#1E3A6E]"
              >
                {sortDir === "desc" ? <ArrowDown size={14} /> : <ArrowUp size={14} />}
                Last contacted
              </button>

              {quickFilter && (
                <span className="flex h-9 items-center gap-1.5 rounded-md bg-[#1E3A6E]/[0.06] px-3 text-[13px] font-medium text-[#1E3A6E] ring-1 ring-inset ring-[#1E3A6E]/20">
                  <Sparkles size={13} />
                  {QUICK_FILTER_LABELS[quickFilter]}
                  <button
                    onClick={() => setQuickFilter(null)}
                    className="ml-0.5 rounded-full p-0.5 transition-colors hover:bg-[#1E3A6E]/10"
                    title="Clear quick filter"
                  >
                    <X size={12} />
                  </button>
                </span>
              )}

              {activeFilterCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="flex h-9 items-center gap-1 rounded-md px-2.5 text-[13px] font-medium text-slate-400 transition-colors hover:text-slate-600"
                >
                  <X size={13} />
                  Clear ({activeFilterCount})
                </button>
              )}

              <div className="relative ml-auto w-72">
                <Search size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  ref={searchInputRef}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search name, phone, course…"
                  className="h-9 w-full rounded-md border border-slate-300 bg-white pl-8 pr-16 text-[13px] outline-none transition-colors placeholder:text-slate-400 focus:border-[#1E3A6E] focus:ring-2 focus:ring-[#1E3A6E]/10"
                />
                <span className="pointer-events-none absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-0.5 rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10.5px] font-medium text-slate-400">
                  <Command size={10} />K
                </span>
              </div>
            </div>

            {/* Filter Summary */}
            {(activeFilterCount > 0 || quickFilter || search.trim()) && (
              <div className="flex items-center gap-2 rounded-md border border-[#1E3A6E]/10 bg-[#1E3A6E]/[0.03] px-3 py-2 text-[12.5px] text-[#1E3A6E]">
                <Sparkles size={13} className="text-[#F2711C]" />
                <span>{getFilterSummary()}</span>
              </div>
            )}
          </div>
        </div>

        {/* Table */}
        <main className="mx-auto w-full max-w-[1500px] px-6 py-6">
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_28px_-16px_rgba(15,23,42,0.15)]">
            {error && (
              <div className="flex items-center gap-2 border-b border-rose-200 bg-rose-50 px-4 py-3 text-[13px] text-rose-700">
                <AlertTriangle size={15} />
                Failed to load leads: {error}
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full min-w-[1500px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="w-[50px] px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      S.N.
                    </th>
                    <th className="w-[210px] px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Lead
                    </th>
                    <th className="w-[300px] px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Call outcome
                    </th>
                    <th className="w-[210px] px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Interested Courses
                    </th>
                    <th className="w-[110px] px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Priority
                    </th>
                    <th className="w-[150px] px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Status
                    </th>
                    <th className="w-[170px] px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Follow-up
                    </th>
                    <th className="w-[140px] px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Activity
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {loading &&
                    Array.from({ length: 6 }).map((_, i) => (
                      <tr key={i} className="border-b border-slate-100">
                        {Array.from({ length: 8 }).map((__, j) => (
                          <td key={j} className="px-4 py-3.5">
                            <div className="h-3.5 w-full max-w-[140px] animate-pulse rounded bg-slate-100" />
                          </td>
                        ))}
                      </tr>
                    ))}

                  {!loading && visibleLeads.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-4 py-16 text-center">
                        <Inbox size={26} className="mx-auto mb-2 text-slate-300" />
                        <p className="text-[14px] font-medium text-slate-500">No leads match these filters</p>
                        <p className="mt-0.5 text-[13px] text-slate-400">Try clearing a filter or adjusting your search.</p>
                      </td>
                    </tr>
                  )}

                  {!loading &&
                    visibleLeads.map(({ lead, index }) => {
                      const isPending = pendingIds.has(lead.id);
                      const isFlashed = flashIds.has(lead.id);

                      const safePriority = lead.priority ?? "normal";
                      const safeStatus = lead.lead_status ?? "new";
                      const draft = callDrafts[lead.id] ?? "";
                      const followUp = formatFollowUp(lead.follow_up_date);
                      const serialNumber = (page - 1) * PAGE_SIZE + index + 1;
                      const whatsappUrl = buildWhatsAppUrl(lead.phone_number);
                      const tone = avatarTone(String(lead.id));

                      const sortedNotes = [...(lead.call_notes ?? [])].sort(
                        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                      );
                      const latestNote = sortedNotes[0];
                      const noteCount = sortedNotes.length;

                      const interestedNames = (lead.interested_course_ids ?? [])
                        .map((id) => courseMap.get(id)?.name)
                        .filter((n): n is string => Boolean(n));

                      const railColor = followUp.overdue ? OVERDUE_RAIL : PRIORITY_RAIL[safePriority];

                      return (
                        <tr
                          key={lead.id}
                          className={cn(
                            "border-b border-slate-100 transition-all duration-200 ease-out",
                            isFlashed
                              ? "bg-emerald-50/60"
                              : followUp.overdue
                              ? "bg-rose-50/40 hover:bg-rose-50/70"
                              : "hover:bg-slate-50/70"
                          )}
                          style={{ boxShadow: `inset 3px 0 0 ${railColor}` }}
                        >
                          <td className="px-4 py-3 align-top">
                            <p className="font-mono text-[12.5px] text-slate-400">{serialNumber}</p>
                          </td>

                          {/* Lead */}
                          <td className="px-4 py-3 align-top">
                            <button
                              onClick={() => setDrawerLeadId(lead.id)}
                              className="flex w-full items-center gap-2.5 text-left"
                              title="Open lead details"
                            >
                              <span
                                className={cn(
                                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-mono text-[11px] font-semibold",
                                  tone.bg,
                                  tone.text
                                )}
                              >
                                {initials(lead.name)}
                              </span>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <p className="flex items-center gap-1 truncate font-mono text-[14.5px] font-semibold text-slate-800">
                                    <Phone size={11} className="shrink-0 text-slate-400" />
                                    {formatPhone(lead.phone_number)}
                                  </p>
                                  {whatsappUrl ? (
                                    <a
                                      href={whatsappUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      title="Message on WhatsApp"
                                      onClick={(e) => e.stopPropagation()}
                                      className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 transition-colors hover:bg-emerald-100"
                                    >
                                      <MessageCircle size={11} />
                                    </a>
                                  ) : null}
                                </div>
                                {lead.name && (
                                  <p className="truncate text-[12px] italic text-slate-400">{lead.name}</p>
                                )}
                              </div>
                            </button>
                          </td>

                          {/* Call outcome */}
                          <td className="px-4 py-3 align-top">
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
                                placeholder="Call outcome…"
                                disabled={isPending}
                                className="h-8 w-full rounded-md border border-slate-300 bg-white px-2 text-[12.5px] text-slate-700 outline-none placeholder:text-slate-400 focus:border-[#1E3A6E] disabled:opacity-50"
                              />
                              <button
                                onClick={() => submitCallLog(lead.id)}
                                disabled={isPending || !draft.trim()}
                                title="Save call log"
                                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#F2711C] text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                              >
                                {isPending ? <Loader2 size={12} className="animate-spin" /> : <MessageSquarePlus size={12} />}
                              </button>
                              <button
                                onClick={() => setDrawerLeadId(lead.id)}
                                title="View timeline"
                                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-slate-300 text-slate-500 hover:border-slate-400"
                              >
                                <History size={13} />
                              </button>
                            </div>
                            {latestNote && (
                              <div className="mt-1.5 rounded-md bg-slate-50 px-2 py-1.5">
                                <p className="whitespace-pre-wrap break-words text-[11.5px] leading-snug text-slate-500">
                                  <span className="font-medium text-slate-600">Latest: </span>
                                  {latestNote.note}
                                </p>
                                <p className="mt-0.5 text-[10.5px] text-slate-400">
                                  ({noteCount} {noteCount === 1 ? "note" : "notes"})
                                </p>
                              </div>
                            )}
                          </td>

                          {/* Interested Courses (Editable inline) */}
                          <td className="px-4 py-3 align-top">
                            <div className="flex flex-col gap-1.5">
                              <CourseMultiSelect
                                courses={courses}
                                selected={lead.interested_course_ids ?? []}
                                onChange={(ids) => updateInterestedCourses(lead.id, ids)}
                                triggerLabel="Select courses..."
                              />
                              
                              {interestedNames.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-0.5">
                                  {interestedNames.map((name, i) => (
                                    <span key={i} className="inline-block rounded-[4px] bg-[#1E3A6E]/[0.06] px-1.5 py-0.5 text-[10.5px] font-medium text-[#1E3A6E] border border-[#1E3A6E]/10">
                                      {name}
                                    </span>
                                  ))}
                                </div>
                              )}

                              <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-slate-500">
                                {lead.learning_mode === "physical" ? <MapPin size={11} className="shrink-0" /> : <Globe size={11} className="shrink-0" />}
                                <select
                                  value={lead.learning_mode ?? "online"}
                                  onChange={(e) => updateLearningMode(lead.id, e.target.value as LearningMode)}
                                  disabled={isPending}
                                  className="h-6 flex-1 cursor-pointer rounded border border-transparent bg-transparent pl-1 pr-4 capitalize outline-none transition-colors hover:border-slate-300 hover:bg-slate-50 focus:border-[#1E3A6E] disabled:opacity-50 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2210%22%20height%3D%226%22%3E%3Cpath%20fill%3D%22%239CA3AF%22%20d%3D%22M5%206L0%200h10z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:8px_5px] bg-[right_4px_center] bg-no-repeat"
                                >
                                  {MODE_OPTIONS.map((o) => (
                                    <option key={o.value} value={o.value}>
                                      {o.label} mode
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          </td>

                          {/* Priority */}
                          <td className="px-4 py-3 align-top">
                            <select
                              value={safePriority}
                              onChange={(e) => updateLeadPriority(lead.id, e.target.value as Priority)}
                              disabled={isPending}
                              className={cn(
                                "h-8 w-full rounded-md border bg-white px-2 text-[12.5px] font-medium capitalize outline-none disabled:opacity-50",
                                PRIORITY_SELECT_TONE[safePriority]
                              )}
                            >
                              {PRIORITY_OPTIONS.map((o) => (
                                <option key={o.value} value={o.value}>
                                  {o.label}
                                </option>
                              ))}
                            </select>
                            {safePriority === "high" && (
                              <p className="mt-1 flex items-center gap-1 text-[10.5px] font-medium text-rose-500">
                                <Flame size={10} />
                                Needs attention
                              </p>
                            )}
                          </td>

                          {/* Status */}
                          <td className="px-4 py-3 align-top">
                            <StatusChipSelect
                              value={safeStatus}
                              onChange={(v) => updateLeadStatus(lead.id, v)}
                              disabled={isPending}
                            />
                          </td>

                          {/* Follow-up */}
                          <td className="px-4 py-3 align-top">
                            <div className="flex items-center gap-1.5">
                              <input
                                type="date"
                                value={toDateInputValue(lead.follow_up_date)}
                                onChange={(e) => updateFollowUpDate(lead.id, e.target.value)}
                                disabled={isPending}
                                className={cn(
                                  "h-8 flex-1 rounded-md border bg-white px-2 text-[12px] outline-none disabled:opacity-50 w-full min-w-0",
                                  followUp.overdue ? "border-rose-300 text-rose-700" : "border-slate-300 text-slate-600"
                                )}
                              />
                              {lead.follow_up_date && (
                                <button
                                  onClick={() => updateFollowUpDate(lead.id, "")}
                                  disabled={isPending}
                                  title="Clear follow-up date"
                                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-slate-200 text-slate-400 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-500 transition-colors disabled:opacity-50"
                                >
                                  <X size={14} />
                                </button>
                              )}
                            </div>
                            {lead.follow_up_date && (
                              <p className={cn("mt-1 text-[11px]", followUp.overdue ? "font-medium text-rose-500" : "text-slate-400")}>
                                {followUp.overdue ? "Overdue · " : ""}
                                {followUp.label}
                              </p>
                            )}
                          </td>

                          {/* Activity */}
                          <td className="px-4 py-3 align-top">
                            <p className="flex items-center gap-1 text-[13px] text-slate-600">
                              <Clock size={11} className="shrink-0 text-slate-400" />
                              {formatRelative(lead.last_contacted_at)}
                            </p>
                            <p className="font-mono text-[11px] text-slate-400">{formatTimestamp(lead.last_contacted_at)}</p>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="font-mono text-[12px] text-slate-500">
              Showing {rangeStart.toLocaleString()}–{rangeEnd.toLocaleString()} of {totalCount.toLocaleString()} leads
            </p>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => goToPage(page - 1)}
                disabled={page <= 1 || loading}
                className="flex h-8 items-center gap-1 rounded-md border border-slate-300 px-2.5 text-[12.5px] font-medium text-slate-600 transition-all duration-150 hover:border-[#1E3A6E]/40 hover:text-[#1E3A6E] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-slate-300 disabled:hover:text-slate-600"
              >
                <ChevronLeft size={13} />
                Previous
              </button>

              {pageNumbers.map((p, i) =>
                p === "ellipsis" ? (
                  <span key={`e-${i}`} className="px-1 text-[12.5px] text-slate-400">
                    …
                  </span>
                ) : (
                  <button
                    key={p}
                    onClick={() => goToPage(p)}
                    disabled={loading}
                    className={cn(
                      "flex h-8 min-w-[32px] items-center justify-center rounded-md border px-2 text-[12.5px] font-medium transition-all duration-150 disabled:cursor-not-allowed",
                      p === page
                        ? "border-[#1E3A6E] bg-[#1E3A6E] text-white shadow-[0_4px_10px_-4px_rgba(30,58,110,0.5)]"
                        : "border-slate-300 text-slate-600 hover:border-[#1E3A6E]/40 hover:text-[#1E3A6E]"
                    )}
                  >
                    {p}
                  </button>
                )
              )}

              <button
                onClick={() => goToPage(page + 1)}
                disabled={page >= totalPages || loading}
                className="flex h-8 items-center gap-1 rounded-md border border-slate-300 px-2.5 text-[12.5px] font-medium text-slate-600 transition-all duration-150 hover:border-[#1E3A6E]/40 hover:text-[#1E3A6E] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-slate-300 disabled:hover:text-slate-600"
              >
                Next
                <ChevronRight size={13} />
              </button>
            </div>
          </div>

          <p className="mt-3 text-center font-mono text-[11px] text-slate-400">
            Every edit re-syncs <span className="text-slate-500">updated_at</span> automatically via{" "}
            <span className="text-slate-500">trigger_update_crm_updated_at</span>.
          </p>
        </main>
      </div>

      {/* Productivity footer */}
      <footer className="crm-shell-header shrink-0 border-t border-slate-200 bg-[#12203D]">
        <div className="mx-auto flex max-w-[1500px] flex-wrap items-center justify-center gap-x-8 gap-y-2 px-6 py-2.5 text-[12.5px] text-slate-200">
          <span className="flex items-center gap-1.5">
            <BookOpen size={13} className="text-violet-300" />
            {courses.length} courses
          </span>
          <span className="hidden h-3.5 w-px bg-white/15 sm:block" />
          <span className="flex items-center gap-1.5">
            <PhoneCall size={13} className="text-sky-300" />
            {stats.contactedToday} contacted today
          </span>
          <span className="hidden h-3.5 w-px bg-white/15 sm:block" />
          <span className="flex items-center gap-1.5">
            <CalendarClock size={13} className="text-amber-300" />
            {stats.followupsToday} follow-ups today
          </span>
          <span className="hidden h-3.5 w-px bg-white/15 sm:block" />
          <span className="flex items-center gap-1.5">
            <AlertTriangle size={13} className="text-rose-300" />
            {stats.overdue} overdue
          </span>
          <span className="hidden h-3.5 w-px bg-white/15 sm:block" />
          <span className="flex items-center gap-1.5">
            <Flame size={13} className="text-rose-300" />
            {stats.highPriority} high priority
          </span>
          <span className="hidden h-3.5 w-px bg-white/15 sm:block" />
          <span className="flex items-center gap-1.5">
            <CheckCircle2 size={13} className="text-emerald-300" />
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
      <AnimatePresence>
        {drawerLead && (
          <LeadDrawer
            lead={drawerLead}
            onClose={() => setDrawerLeadId(null)}
            onAddNote={addCallNote}
          />
        )}
      </AnimatePresence>

      {/* Courses Modal Overlay */}
      <AnimatePresence>
        {showCoursesModal && (
          <CoursesModal courses={courses} onClose={() => setShowCoursesModal(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}