"use client";

/**
 * app/admin/crm-leads/page.tsx
 *
 * Customer Handler Dashboard — public.crm_leads
 * Fully self-contained route file: types, Supabase client, helpers,
 * and all sub-components are inlined. No /lib imports, per convention.
 *
 * Schema assumptions (adjust if your columns differ):
 * crm_leads(id, name, phone_number, course_id, lead_status, payment_status,
 * call_notes jsonb, last_contacted_at timestamptz, follow_up_date date,
 * learning_mode, priority, updated_at timestamptz)
 * NOTE: `follow_up_date` is a plain nullable `date` column. Add it via
 * `alter table crm_leads add column follow_up_date date;` if it doesn't
 * exist yet.
 * syllabi_v2(id, name)
 * FK: crm_leads.course_id -> syllabi_v2.id
 * trigger_update_crm_updated_at keeps updated_at fresh on every row UPDATE.
 */

import { Fragment, useEffect, useMemo, useRef, useState, useCallback } from "react";
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
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  MessageSquarePlus,
  X,
  Check,
  Loader2,
  RefreshCcw,
  AlertTriangle,
  Inbox,
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
  // joined
  syllabi_v2: SyllabusRef | null;
}

type SortDir = "asc" | "desc";

// ---------------------------------------------------------------------------
// Constants / display maps
// ---------------------------------------------------------------------------

const PAGE_SIZE = 50;

const LEAD_STATUS_OPTIONS: { value: LeadStatus; label: string }[] = [
  { value: "new", label: "New" },
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

const PRIORITY_BADGE: Record<Priority, string> = {
  high: "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200",
  normal: "bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200",
  low: "bg-slate-50 text-slate-500 ring-1 ring-inset ring-slate-200",
};

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

const STATUS_SELECT_TONE: Record<LeadStatus, string> = {
  new: "border-slate-300 text-slate-700",
  contacted: "border-sky-300 text-sky-700",
  follow_up: "border-amber-300 text-amber-700",
  interested: "border-indigo-300 text-indigo-700",
  not_interested: "border-slate-300 text-slate-400",
  enrolled: "border-emerald-300 text-emerald-700",
};

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

/** Converts an ISO date/timestamp into the yyyy-mm-dd value an <input type="date"> expects. */
function toDateInputValue(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function formatFollowUp(iso: string | null | undefined): { label: string; overdue: boolean } {
  if (!iso) return { label: "Not set", overdue: false };
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return { label: "Not set", overdue: false };
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(d);
  target.setHours(0, 0, 0, 0);
  const overdue = target.getTime() < today.getTime();
  const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
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

/** Builds a compact page-number list with ellipses, e.g. 1 … 4 5 [6] 7 8 … 42 */
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
// Multi-select popover (course filter)
// ---------------------------------------------------------------------------

function CourseMultiSelect({
  courses,
  selected,
  onChange,
}: {
  courses: SyllabusRef[];
  selected: number[];
  onChange: (ids: number[]) => void;
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
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex h-9 items-center gap-2 rounded-md border px-3 text-[13px] font-medium transition-colors",
          selected.length > 0
            ? "border-[#1E3A6E] bg-[#1E3A6E]/[0.04] text-[#1E3A6E]"
            : "border-slate-300 text-slate-600 hover:border-slate-400"
        )}
      >
        Course
        {selected.length > 0 && (
          <span className="rounded bg-[#1E3A6E] px-1.5 py-0.5 text-[11px] font-semibold text-white">
            {selected.length}
          </span>
        )}
        <ChevronDown size={14} className={cn("transition-transform", open && "rotate-180")} />
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
// Call notes drawer (per-row expandable JSONB interface)
// ---------------------------------------------------------------------------

function CallNotesDrawer({
  lead,
  onAddNote,
}: {
  lead: CrmLead;
  onAddNote: (leadId: number, note: string) => Promise<void>;
}) {
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const notes = [...(lead.call_notes ?? [])].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  const submit = async () => {
    if (!draft.trim()) return;
    setSaving(true);
    await onAddNote(lead.id, draft.trim());
    setDraft("");
    setSaving(false);
  };

  return (
    <motion.tr
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.16 }}
    >
      <td colSpan={8} className="border-b border-slate-100 bg-slate-50/70 p-0">
        <div className="grid grid-cols-[1fr_320px] gap-6 px-6 py-5">
          <div>
            <p className="mb-2.5 font-mono text-[11px] uppercase tracking-wider text-slate-400">
              Call log · {notes.length} {notes.length === 1 ? "entry" : "entries"}
            </p>
            {notes.length === 0 ? (
              <p className="text-[13px] text-slate-400">No Notes</p>
            ) : (
              <div className="max-h-44 space-y-2 overflow-y-auto pr-2">
                {notes.map((n) => (
                  <div
                    key={n.id}
                    className="relative rounded-md border border-slate-200 bg-white px-3 py-2 pl-4"
                  >
                    <span className="absolute left-0 top-0 h-full w-[3px] rounded-l-md bg-[#1E3A6E]/20" />
                    <p className="text-[13px] leading-snug text-slate-700">{n.note}</p>
                    <p className="mt-1 font-mono text-[11px] text-slate-400">
                      {formatTimestamp(n.created_at)}
                      {n.created_by ? ` · ${n.created_by}` : ""}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div>
            <p className="mb-2.5 font-mono text-[11px] uppercase tracking-wider text-slate-400">
              Add entry
            </p>
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="What happened on the call…"
              rows={3}
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
        </div>
      </td>
    </motion.tr>
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

  const [search, setSearch] = useState("");
  const [courseFilter, setCourseFilter] = useState<number[]>([]);
  const [paymentFilter, setPaymentFilter] = useState<PaymentStatus | "all">("all");
  const [modeFilter, setModeFilter] = useState<LearningMode | "all">("all");
  const [priorityFilter, setPriorityFilter] = useState<Priority | "all">("all");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const [pendingIds, setPendingIds] = useState<Set<number>>(new Set());
  const [flashIds, setFlashIds] = useState<Set<number>>(new Set());
  const [callDrafts, setCallDrafts] = useState<Record<number, string>>({});

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
      .select("id, name")
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
      .select("*, syllabi_v2(id, name)", { count: "exact" })
      .order("last_contacted_at", { ascending: sortDir === "asc", nullsFirst: sortDir === "asc" })
      .range(from, to);

    if (courseFilter.length > 0) query = query.in("course_id", courseFilter);
    if (paymentFilter !== "all") query = query.eq("payment_status", paymentFilter);
    if (modeFilter !== "all") query = query.eq("learning_mode", modeFilter);
    if (priorityFilter !== "all") query = query.eq("priority", priorityFilter);

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
  }, [sortDir, courseFilter, paymentFilter, modeFilter, priorityFilter, page]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  // Reset to page 1 whenever a filter/sort changes (not on page changes themselves).
  const filterSignature = JSON.stringify([sortDir, courseFilter, paymentFilter, modeFilter, priorityFilter]);
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
    setExpandedRow(null);
    setPage(p);
  };

  // ---- Mutations (optimistic) ----

  const updateLeadStatus = async (id: number, lead_status: LeadStatus) => {
    const prev = leads;
    setLeads((cur) => cur.map((l) => (l.id === id ? { ...l, lead_status } : l)));
    markPending(id, true);
    // updated_at refreshes automatically via trigger_update_crm_updated_at
    const { error } = await supabase.from("crm_leads").update({ lead_status }).eq("id", id);
    markPending(id, false);
    if (error) {
      setLeads(prev);
      return;
    }
    flash(id);
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

  const updateFollowUpDate = async (id: number, dateValue: string) => {
    // dateValue is "" (cleared) or "yyyy-mm-dd" from the date input.
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
    // Only auto-advance status out of "new" — never overwrite follow_up,
    // interested, enrolled, or not_interested.
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
  };

  // ---- Derived: client-side search over name/phone (current page) ----

  const visibleLeads = useMemo(() => {
    if (!search.trim()) return leads;
    const q = search.trim().toLowerCase();

    return leads.filter((l) => {
      const safeName = (l.name ?? "").toLowerCase();
      const safePhone = (l.phone_number ?? "").replace(/\D/g, "");
      return safeName.includes(q) || safePhone.includes(q.replace(/\D/g, ""));
    });
  }, [leads, search]);

  const activeFilterCount =
    (courseFilter.length > 0 ? 1 : 0) +
    (paymentFilter !== "all" ? 1 : 0) +
    (modeFilter !== "all" ? 1 : 0) +
    (priorityFilter !== "all" ? 1 : 0);

  const clearFilters = () => {
    setCourseFilter([]);
    setPaymentFilter("all");
    setModeFilter("all");
    setPriorityFilter("all");
  };

  const rangeStart = totalCount === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(page * PAGE_SIZE, totalCount);
  const pageNumbers = getPageNumbers(page, totalPages);

  return (
    <div className="fixed inset-0 z-[999] flex h-screen w-screen flex-col overflow-y-auto bg-[#F7F8FA] font-[Inter,ui-sans-serif,system-ui]">
      {/*
        This route is a standalone workspace: it hides the GLOBAL site
        navbar/footer (the ones injected by your root layout) so this page
        can occupy the full viewport. It does NOT touch the blue
        `.crm-shell-header` below — that's this page's own header and stays.
        The fixed/inset-0 wrapper covers the app shell visually; the
        selectors below hide it structurally too. If your Navbar/Footer
        components render under different tags/ids/classes than the common
        ones guessed here, add a stable marker to them (e.g.
        `data-site-chrome` or `id="site-navbar"`) and reference that instead.
      */}
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
      `}</style>

      {/* Header (this page's own — never hidden by the rule above) */}
      <header className="crm-shell-header relative overflow-hidden border-b border-slate-200 bg-[#12203D]">
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.06]"
          aria-hidden
        >
          <defs>
            <pattern id="bp-grid" width="28" height="28" patternUnits="userSpaceOnUse">
              <path d="M28 0H0V28" fill="none" stroke="white" strokeWidth="0.75" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#bp-grid)" />
        </svg>
        <div className="relative mx-auto flex max-w-[1400px] items-center justify-between px-6 py-5">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-[#F2711C]">
              GyanHub · Operations
            </p>
            <h1 className="mt-1 font-[Space_Grotesk,ui-sans-serif] text-[22px] font-semibold text-white">
              Lead Handler Dashboard
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="font-mono text-[20px] font-semibold text-white">{totalCount.toLocaleString()}</p>
              <p className="text-[11px] text-slate-300">
                {activeFilterCount > 0 ? "matching filters" : "total leads"}
              </p>
            </div>
            <button
              onClick={fetchLeads}
              className="flex h-9 w-9 items-center justify-center rounded-md border border-white/15 text-white/80 transition-colors hover:bg-white/10 hover:text-white"
              title="Refresh"
            >
              <RefreshCcw size={15} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>
      </header>

      {/* Filter bar */}
      <div className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-2.5 px-6 py-3">
          <div className="flex items-center gap-1.5 pr-1 text-slate-400">
            <SlidersHorizontal size={14} />
          </div>

          <CourseMultiSelect courses={courses} selected={courseFilter} onChange={setCourseFilter} />
          <PillSelect label="Payment" value={paymentFilter} options={PAYMENT_OPTIONS} onChange={setPaymentFilter} />
          <PillSelect label="Mode" value={modeFilter} options={MODE_OPTIONS} onChange={setModeFilter} />
          <PillSelect label="Priority" value={priorityFilter} options={PRIORITY_OPTIONS} onChange={setPriorityFilter} />

          <button
            onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
            className="flex h-9 items-center gap-1.5 rounded-md border border-slate-300 px-3 text-[13px] font-medium text-slate-600 hover:border-slate-400"
          >
            {sortDir === "desc" ? <ArrowDown size={14} /> : <ArrowUp size={14} />}
            Last contacted
          </button>

          {activeFilterCount > 0 && (
            <button
              onClick={clearFilters}
              className="flex h-9 items-center gap-1 rounded-md px-2.5 text-[13px] font-medium text-slate-400 hover:text-slate-600"
            >
              <X size={13} />
              Clear ({activeFilterCount})
            </button>
          )}

          <div className="relative ml-auto w-64">
            <Search size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name or phone…"
              className="h-9 w-full rounded-md border border-slate-300 bg-white pl-8 pr-3 text-[13px] outline-none placeholder:text-slate-400 focus:border-[#1E3A6E]"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <main className="mx-auto w-full max-w-[1400px] px-6 py-6">
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          {error && (
            <div className="flex items-center gap-2 border-b border-rose-200 bg-rose-50 px-4 py-3 text-[13px] text-rose-700">
              <AlertTriangle size={15} />
              Failed to load leads: {error}
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1250px] border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="w-[220px] px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Lead
                  </th>
                  <th className="w-[200px] px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Course
                  </th>
                  <th className="w-[110px] px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Priority
                  </th>
                  <th className="w-[110px] px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Payment
                  </th>
                  <th className="w-[150px] px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Last contacted
                  </th>
                  <th className="w-[150px] px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Follow-up
                  </th>
                  <th className="w-[170px] px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Status
                  </th>
                  <th className="w-[240px] px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Call log
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
                  visibleLeads.map((lead) => {
                    const isPending = pendingIds.has(lead.id);
                    const isFlashed = flashIds.has(lead.id);
                    const isExpanded = expandedRow === lead.id;

                    const safePriority = lead.priority ?? "normal";
                    const safePayment = lead.payment_status ?? "unpaid";
                    const safeStatus = lead.lead_status ?? "new";
                    const draft = callDrafts[lead.id] ?? "";
                    const followUp = formatFollowUp(lead.follow_up_date);

                    return (
                      <Fragment key={lead.id}>
                        <tr
                          className={cn(
                            "border-b border-slate-100 transition-colors",
                            isFlashed ? "bg-emerald-50/60" : "hover:bg-slate-50/70"
                          )}
                          style={{ boxShadow: `inset 3px 0 0 ${PRIORITY_RAIL[safePriority]}` }}
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2.5">
                              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#1E3A6E]/[0.08] font-mono text-[11px] font-semibold text-[#1E3A6E]">
                                {initials(lead.name)}
                              </span>
                              <div className="min-w-0">
                                <p className="flex items-center gap-1 truncate font-mono text-[14.5px] font-semibold text-slate-800">
                                  <Phone size={11} className="shrink-0 text-slate-400" />
                                  {formatPhone(lead.phone_number)}
                                </p>
                                {lead.name && (
                                  <p className="truncate text-[12px] italic text-slate-400">{lead.name}</p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <p className="truncate text-[13px] text-slate-700">
                              {lead.syllabi_v2?.name ?? "No Course Assigned"}
                            </p>
                            <p className="text-[11.5px] capitalize text-slate-400">{lead.learning_mode ?? "—"}</p>
                          </td>
                          <td className="px-4 py-3">
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
                          </td>
                          <td className="px-4 py-3">
                            <span className={cn("inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-[11.5px] font-medium capitalize", PAYMENT_BADGE[safePayment])}>
                              <span className={cn("h-1.5 w-1.5 rounded-full", PAYMENT_DOT[safePayment])} />
                              {lead.payment_status ?? "—"}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-[13px] text-slate-600">{formatRelative(lead.last_contacted_at)}</p>
                            <p className="font-mono text-[11px] text-slate-400">{formatTimestamp(lead.last_contacted_at)}</p>
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="date"
                              value={toDateInputValue(lead.follow_up_date)}
                              onChange={(e) => updateFollowUpDate(lead.id, e.target.value)}
                              disabled={isPending}
                              className={cn(
                                "h-8 w-full rounded-md border bg-white px-2 text-[12px] outline-none disabled:opacity-50",
                                followUp.overdue ? "border-rose-300 text-rose-700" : "border-slate-300 text-slate-600"
                              )}
                            />
                            {lead.follow_up_date && (
                              <p className={cn("mt-1 text-[11px]", followUp.overdue ? "font-medium text-rose-500" : "text-slate-400")}>
                                {followUp.overdue ? "Overdue · " : ""}
                                {followUp.label}
                              </p>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <select
                              value={safeStatus}
                              onChange={(e) => updateLeadStatus(lead.id, e.target.value as LeadStatus)}
                              disabled={isPending}
                              className={cn(
                                "h-8 w-full rounded-md border bg-white px-2 text-[12.5px] font-medium capitalize outline-none disabled:opacity-50",
                                STATUS_SELECT_TONE[safeStatus]
                              )}
                            >
                              {LEAD_STATUS_OPTIONS.map((o) => (
                                <option key={o.value} value={o.value}>
                                  {o.label}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-1.5">
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
                                className="h-8 w-full min-w-0 rounded-md border border-slate-300 bg-white px-2 text-[12.5px] text-slate-700 outline-none placeholder:text-slate-400 focus:border-[#1E3A6E] disabled:opacity-50"
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
                                onClick={() => setExpandedRow(isExpanded ? null : lead.id)}
                                title="View full call log"
                                className={cn(
                                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-md border transition-colors",
                                  isExpanded
                                    ? "border-[#1E3A6E] bg-[#1E3A6E]/[0.06] text-[#1E3A6E]"
                                    : "border-slate-300 text-slate-500 hover:border-slate-400"
                                )}
                              >
                                {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                              </button>
                            </div>
                          </td>
                        </tr>
                        <AnimatePresence>
                          {isExpanded && <CallNotesDrawer key={`${lead.id}-notes`} lead={lead} onAddNote={addCallNote} />}
                        </AnimatePresence>
                      </Fragment>
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
              className="flex h-8 items-center gap-1 rounded-md border border-slate-300 px-2.5 text-[12.5px] font-medium text-slate-600 hover:border-slate-400 disabled:cursor-not-allowed disabled:opacity-40"
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
                    "flex h-8 min-w-[32px] items-center justify-center rounded-md border px-2 text-[12.5px] font-medium transition-colors disabled:cursor-not-allowed",
                    p === page
                      ? "border-[#1E3A6E] bg-[#1E3A6E] text-white"
                      : "border-slate-300 text-slate-600 hover:border-slate-400"
                  )}
                >
                  {p}
                </button>
              )
            )}

            <button
              onClick={() => goToPage(page + 1)}
              disabled={page >= totalPages || loading}
              className="flex h-8 items-center gap-1 rounded-md border border-slate-300 px-2.5 text-[12.5px] font-medium text-slate-600 hover:border-slate-400 disabled:cursor-not-allowed disabled:opacity-40"
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
  );
}