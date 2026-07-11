"use client";

/**
 * app/admin/accounting/page.tsx
 * ─────────────────────────────────────────────────────────────
 * GyanHub — Business Intelligence & Finance Dashboard
 *
 * STACK: Next.js App Router · Tailwind · Framer Motion · Recharts ·
 * date-fns · Supabase
 * ───────────────────────────────────────────────────────────── */

import React, { useEffect, useMemo, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import {
  format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek,
  endOfWeek, startOfYear, isWithinInterval, subDays,
} from "date-fns";
import {
  Search, Plus, Download, FileSpreadsheet, RefreshCw, X, Trash2,
  Pencil, Copy, TrendingUp, TrendingDown, DollarSign, Users, Landmark,
  Megaphone, Wallet, AlertTriangle, ChevronDown, Moon, Sun, ArrowUpRight,
  ArrowDownRight, Sparkles, Loader2, CheckCircle2, ScrollText, Filter, Lock
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

/* ────────────────────────────────────────────────────────────
   1. TYPES
   ──────────────────────────────────────────────────────────── */

type TxType = "income" | "expense";

type Transaction = {
  id: string;
  date: string; // ISO
  type: TxType;
  category: string;
  course: string | null;      // display name, derived from syllabus_id
  syllabusId: number | null;  // FK back to syllabi_v2
  batch: string | null;       // plain text label, e.g. "Jan"
  amount: number;
  description: string;
};

type DueStatus = "pending" | "paid";

type OutstandingExpense = {
  id: string;
  label: string;
  category: string;
  amount: number;
  dueDate: string;
  status: DueStatus;
};

type Option = { id: string | number; name: string };

const INCOME_CATEGORIES = [
  "Online Course",
  "Physical Class",
  "Other Income",
  "Owner Investment"
];

const EXPENSE_CATEGORIES = [
  "Tutor Fee",
  "Salary",
  "Rent",
  "Legal Services and Tax",
  "Office Expenses",
  "marketing", // Changed to lowercase to exactly match database ENUM
  "Owner Withdrawal",
  "Miscellaneous"
];

const BATCH_OPTIONS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun", 
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

/* ────────────────────────────────────────────────────────────
   1b. DISPLAY HELPERS
   ──────────────────────────────────────────────────────────── */
// Helper to display "marketing" with a capital M in the UI while keeping it lowercase for the DB
const displayCategory = (cat: string) => cat === "marketing" ? "Marketing" : cat;

/* ────────────────────────────────────────────────────────────
   2. SUPABASE DATA LAYER
   ──────────────────────────────────────────────────────────── */

const supabase = createClient();

function mapAccountRow(row: any): Transaction {
  let tType = row.transaction_type;
  let cat = row.category;

  if (tType === "owner_investment") {
    tType = "income";
    cat = "Owner Investment";
  } else if (tType === "owner_withdrawal") {
    tType = "expense";
    cat = "Owner Withdrawal";
  }

  return {
    id: row.id,
    date: row.transaction_date,
    type: tType,
    category: cat,
    course: row.syllabi_v2?.name ?? null,
    syllabusId: row.syllabus_id,
    batch: row.batch_label ?? null,
    amount: Number(row.amount),
    description: row.description ?? "",
  };
}

async function fetchAccountRows(): Promise<Transaction[]> {
  const { data, error } = await supabase
    .from("account")
    .select(
      `id, transaction_date, transaction_type, category, amount, description,
       syllabus_id, batch_label,
       syllabi_v2 ( name )`
    )
    .order("transaction_date", { ascending: false });

  if (error) throw error;
  return (data ?? []).map(mapAccountRow);
}

async function fetchOutstanding(): Promise<OutstandingExpense[]> {
  const { data, error } = await supabase
    .from("account_dues")
    .select("id, label, category, amount, due_date, status")
    .eq("status", "pending")
    .order("due_date", { ascending: true });

  if (error) throw error;
  return (data ?? []).map((d: any) => ({
    id: d.id,
    label: d.label,
    category: d.category,
    amount: Number(d.amount),
    dueDate: d.due_date,
    status: d.status,
  }));
}

async function fetchSyllabi(): Promise<Option[]> {
  const { data, error } = await supabase.from("syllabi_v2").select("id, name");
  if (error) throw error;
  return (data ?? []).map((s: any) => ({ id: s.id, name: s.name }));
}

async function upsertAccountRow(tx: Transaction, isNew: boolean) {
  const payload = {
    transaction_date: tx.date.slice(0, 10),
    transaction_type: tx.type,
    category: tx.category,
    syllabus_id: tx.syllabusId,
    batch_label: tx.batch,
    amount: tx.amount,
    description: tx.description || null,
  };

  if (isNew) {
    const { data, error } = await supabase.from("account").insert(payload).select("id").single();
    if (error) throw error;
    return data.id as string;
  } else {
    const { error } = await supabase.from("account").update(payload).eq("id", tx.id);
    if (error) throw error;
    return tx.id;
  }
}

async function deleteAccountRow(id: string) {
  const { error } = await supabase.from("account").delete().eq("id", id);
  if (error) throw error;
}

async function insertDue(due: Omit<OutstandingExpense, "id" | "status">) {
  const { error } = await supabase.from("account_dues").insert({
    label: due.label,
    category: due.category,
    amount: due.amount,
    due_date: due.dueDate,
    status: "pending",
  });
  if (error) throw error;
}

async function deleteDue(id: string) {
  const { error } = await supabase.from("account_dues").delete().eq("id", id);
  if (error) throw error;
}

async function payDue(due: OutstandingExpense) {
  const { data: inserted, error: insertError } = await supabase
    .from("account")
    .insert({
      transaction_date: format(new Date(), "yyyy-MM-dd"),
      transaction_type: "expense",
      category: due.category,
      syllabus_id: null,
      batch_label: null,
      amount: due.amount,
      description: `Paid due: ${due.label}`,
    })
    .select("id")
    .single();
  if (insertError) throw insertError;

  const { error: updateError } = await supabase
    .from("account_dues")
    .update({ status: "paid", paid_account_id: inserted.id })
    .eq("id", due.id);
  if (updateError) throw updateError;
}

function useAccountData() {
  const [txs, setTxs] = useState<Transaction[]>([]);
  const [outstanding, setOutstanding] = useState<OutstandingExpense[]>([]);
  const [syllabi, setSyllabi] = useState<Option[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [txRows, dues, syl] = await Promise.all([
        fetchAccountRows(),
        fetchOutstanding(),
        fetchSyllabi(),
      ]);
      setTxs(txRows);
      setOutstanding(dues);
      setSyllabi(syl);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load accounting data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const save = useCallback(async (tx: Transaction, isNew: boolean) => {
    const id = await upsertAccountRow(tx, isNew);
    await refresh();
    return id;
  }, [refresh]);

  const remove = useCallback(async (id: string) => {
    await deleteAccountRow(id);
    await refresh();
  }, [refresh]);

  const duplicate = useCallback(async (tx: Transaction) => {
    await upsertAccountRow({ ...tx, date: format(new Date(), "yyyy-MM-dd") }, true);
    await refresh();
  }, [refresh]);

  const addDue = useCallback(async (due: Omit<OutstandingExpense, "id" | "status">) => {
    await insertDue(due);
    await refresh();
  }, [refresh]);

  const removeDue = useCallback(async (id: string) => {
    await deleteDue(id);
    await refresh();
  }, [refresh]);

  const markDuePaid = useCallback(async (due: OutstandingExpense) => {
    await payDue(due);
    await refresh();
  }, [refresh]);

  return {
    txs, outstanding, syllabi, loading, error, refresh,
    save, remove, duplicate, addDue, removeDue, markDuePaid,
  };
}

/* ────────────────────────────────────────────────────────────
   3. FILTER STATE
   ──────────────────────────────────────────────────────────── */

type QuickRange =
  | "today" | "yesterday" | "this_week" | "last_week"
  | "this_month" | "last_month" | "last_3_months" | "this_year" | "custom" | "all";

type Filters = {
  range: QuickRange;
  customFrom?: string;
  customTo?: string;
  course: string;
  batch: string;
  category: string;
  txType: string;
  search: string;
};

const DEFAULT_FILTERS: Filters = {
  range: "all",
  course: "all",
  batch: "all",
  category: "all",
  txType: "all",
  search: "",
};

function rangeToInterval(range: QuickRange, from?: string, to?: string) {
  const now = new Date();
  switch (range) {
    case "today": return { start: new Date(now.setHours(0, 0, 0, 0)), end: new Date() };
    case "yesterday": {
      const y = subDays(new Date(), 1);
      return { start: new Date(y.setHours(0, 0, 0, 0)), end: new Date(y.setHours(23, 59, 59, 999)) };
    }
    case "this_week": return { start: startOfWeek(now), end: endOfWeek(now) };
    case "last_week": {
      const lw = subDays(now, 7);
      return { start: startOfWeek(lw), end: endOfWeek(lw) };
    }
    case "this_month": return { start: startOfMonth(now), end: endOfMonth(now) };
    case "last_month": {
      const lm = subMonths(now, 1);
      return { start: startOfMonth(lm), end: endOfMonth(lm) };
    }
    case "last_3_months": return { start: startOfMonth(subMonths(now, 2)), end: endOfMonth(now) };
    case "this_year": return { start: startOfYear(now), end: now };
    case "custom": return { start: from ? new Date(from) : subMonths(now, 1), end: to ? new Date(to) : now };
    case "all":
    default: return { start: new Date(2000, 0, 1), end: new Date(2100, 0, 1) };
  }
}

function applyFilters(txs: Transaction[], f: Filters) {
  const { start, end } = rangeToInterval(f.range, f.customFrom, f.customTo);
  return txs.filter((t) => {
    const d = new Date(t.date);
    if (!isWithinInterval(d, { start, end })) return false;
    if (f.course !== "all" && t.course !== f.course) return false;
    if (f.batch !== "all" && t.batch !== f.batch) return false;
    if (f.category !== "all" && t.category !== f.category) return false;
    if (f.txType !== "all" && t.type !== f.txType) return false;
    if (f.search) {
      const q = f.search.toLowerCase();
      const hay = `${t.category} ${t.course ?? ""} ${t.batch ?? ""} ${t.description}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

function previousPeriodTxs(txs: Transaction[], f: Filters) {
  const { start, end } = rangeToInterval(f.range, f.customFrom, f.customTo);
  const spanMs = +end - +start;
  const prevStart = new Date(+start - spanMs);
  const prevEnd = new Date(+start - 1);
  return txs.filter((t) => {
    const d = new Date(t.date);
    if (!isWithinInterval(d, { start: prevStart, end: prevEnd })) return false;
    if (f.course !== "all" && t.course !== f.course) return false;
    if (f.batch !== "all" && t.batch !== f.batch) return false;
    if (f.category !== "all" && t.category !== f.category) return false;
    if (f.txType !== "all" && t.type !== f.txType) return false;
    return true;
  });
}

/* ────────────────────────────────────────────────────────────
   4. FORMAT HELPERS
   ──────────────────────────────────────────────────────────── */

const fmtNPR = (n: number) =>
  `NPR ${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

const pctDelta = (curr: number, prev: number) => {
  if (prev === 0) return curr === 0 ? 0 : 100;
  return ((curr - prev) / Math.abs(prev)) * 100;
}

function bizSum(txs: Transaction[], type: TxType, excludeCategories: string[] = []) {
  return txs
    .filter((t) => t.type === type && !excludeCategories.includes(t.category))
    .reduce((s, t) => s + t.amount, 0);
}

function sum(txs: Transaction[], types: TxType[]) {
  return txs.filter((t) => types.includes(t.type)).reduce((s, t) => s + t.amount, 0);
}

/* ────────────────────────────────────────────────────────────
   4b. EXPORT HELPERS
   ──────────────────────────────────────────────────────────── */

function exportTransactionsToExcel(rows: Transaction[], filenameHint: string) {
  if (rows.length === 0) {
    alert("No transactions match the current filters — nothing to export.");
    return;
  }
  const headers = ["Date", "Type", "Category", "Course", "Batch", "Amount", "Description"];
  const csvEscape = (v: string | number) => {
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = rows.map((t) => {
    const amount = t.type === "income" ? t.amount : -t.amount;
    return [
      format(new Date(t.date), "yyyy-MM-dd"),
      t.type,
      displayCategory(t.category),
      t.course ?? "",
      t.batch ?? "",
      amount,
      t.description,
    ].map(csvEscape).join(",");
  });
  const csv = [headers.join(","), ...lines].join("\r\n");
  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `gyanhub-${filenameHint}-${format(new Date(), "yyyy-MM-dd")}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function exportTransactionsToPDF(rows: Transaction[], filenameHint: string) {
  if (rows.length === 0) {
    alert("No transactions match the current filters — nothing to export.");
    return;
  }
  const win = window.open("", "_blank");
  if (!win) {
    alert("Please allow pop-ups to export as PDF.");
    return;
  }
  const revenue = sum(rows, ["income"]);
  const expense = sum(rows, ["expense"]);
  const rowsHtml = rows
    .map((t) => {
      const sign = t.type === "income" ? "+" : "-";
      const color = t.type === "income" ? "#059669" : "#e11d48";
      return `<tr>
        <td>${format(new Date(t.date), "MMM d, yyyy")}</td>
        <td>${t.type}</td>
        <td>${displayCategory(t.category)}</td>
        <td>${t.course ?? "—"}${t.batch ? " · " + t.batch : ""}</td>
        <td style="color:${color};font-weight:600;text-align:right">${sign}${fmtNPR(t.amount)}</td>
        <td>${t.description}</td>
      </tr>`;
    })
    .join("");

  win.document.write(`
    <html><head><title>GyanHub — ${filenameHint}</title>
    <style>
      * { box-sizing: border-box; }
      body { font-family: -apple-system, Segoe UI, Roboto, sans-serif; padding: 32px; color: #0f172a; }
      h1 { font-size: 20px; margin-bottom: 2px; }
      .meta { color: #64748b; font-size: 12px; margin-bottom: 20px; }
      .summary { display: flex; gap: 24px; margin-bottom: 20px; }
      .summary div { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 10px 16px; }
      .summary .label { font-size: 11px; color: #64748b; }
      .summary .value { font-size: 16px; font-weight: 700; }
      table { width: 100%; border-collapse: collapse; font-size: 12px; }
      th { text-align: left; background: #f1f5f9; padding: 8px 10px; font-size: 11px; text-transform: uppercase; color: #64748b; }
      td { padding: 8px 10px; border-bottom: 1px solid #f1f5f9; }
      @media print { body { padding: 0; } }
    </style></head>
    <body>
      <h1>GyanHub — ${filenameHint}</h1>
      <div class="meta">Generated ${format(new Date(), "MMMM d, yyyy 'at' h:mm a")} · ${rows.length} transactions</div>
      <div class="summary">
        <div><div class="label">Total Inflow</div><div class="value" style="color:#059669">${fmtNPR(revenue)}</div></div>
        <div><div class="label">Total Outflow</div><div class="value" style="color:#e11d48">${fmtNPR(expense)}</div></div>
        <div><div class="label">Net</div><div class="value">${fmtNPR(revenue - expense)}</div></div>
      </div>
      <table>
        <thead><tr><th>Date</th><th>Type</th><th>Category</th><th>Course / Batch</th><th style="text-align:right">Amount</th><th>Description</th></tr></thead>
        <tbody>${rowsHtml}</tbody>
      </table>
      <script>window.onload = () => window.print();</script>
    </body></html>
  `);
  win.document.close();
}

/* ────────────────────────────────────────────────────────────
   5. MAIN PAGE
   ──────────────────────────────────────────────────────────── */

export default function AccountingPage() {
  const {
    txs, outstanding, syllabi, loading, error, refresh,
    save, remove, duplicate, addDue, removeDue, markDuePaid,
  } = useAccountData();

  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [dark, setDark] = useState(true);
  const [modal, setModal] = useState<{ open: boolean; editing?: Transaction | null }>({ open: false });
  const [dueModalOpen, setDueModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
 
  // UI Lock States
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState(false);

  const courseNames = useMemo(() => syllabi.map((s) => s.name), [syllabi]);

  const filtered = useMemo(() => applyFilters(txs, filters), [txs, filters]);
  const prevPeriod = useMemo(() => previousPeriodTxs(txs, filters), [txs, filters]);

  const resetFilters = useCallback(() => setFilters(DEFAULT_FILTERS), []);

  const handleSave = useCallback(async (tx: Transaction, isNew: boolean) => {
    setSaving(true);
    try {
      await save(tx, isNew);
      setModal({ open: false });
    } catch (e: any) {
      alert(e?.message ?? "Failed to save transaction.");
    } finally {
      setSaving(false);
    }
  }, [save]);

  const handleDelete = useCallback(async (id: string) => {
    try {
      await remove(id);
      setModal({ open: false });
    } catch (e: any) {
      alert(e?.message ?? "Failed to delete transaction.");
    }
  }, [remove]);

  const handleDuplicate = useCallback(async (tx: Transaction) => {
    try {
      await duplicate(tx);
    } catch (e: any) {
      alert(e?.message ?? "Failed to duplicate transaction.");
    }
  }, [duplicate]);

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === "2025") {
      setIsUnlocked(true);
      setPinError(false);
    } else {
      setPinError(true);
      setPin("");
    }
  };

  if (!isUnlocked) {
    return (
      <div className={dark ? "dark" : ""}>
        <style dangerouslySetInnerHTML={{ __html: `
          nav, header, footer, aside, .sidebar, #sidebar, .navbar, #navbar {
            display: none !important;
          }
          body { margin: 0 !important; padding: 0 !important; }
        `}} />
        <div className="fixed inset-0 z-[200] min-h-screen flex flex-col items-center justify-center bg-[#f6f7fb] dark:bg-[#0a0c12] text-slate-900 dark:text-slate-100 transition-colors">
           <motion.div 
             initial={{ opacity: 0, y: 20 }} 
             animate={{ opacity: 1, y: 0 }} 
             className="max-w-sm w-full bg-white dark:bg-[#12151c] p-8 rounded-3xl shadow-2xl border border-slate-200 dark:border-white/10 text-center relative overflow-hidden"
           >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-emerald-500" />
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mx-auto mb-6">
                 <Lock size={30} />
              </div>
              <h2 className="text-2xl font-bold tracking-tight mb-2">Restricted Access</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">
                Please enter the administrative PIN to access the accounting dashboard.
              </p>
              
              <form onSubmit={handleUnlock}>
                 <input
                   type="password"
                   value={pin}
                   onChange={(e) => { setPin(e.target.value); setPinError(false); }}
                   placeholder="Enter PIN"
                   className={`w-full h-12 px-4 text-center text-xl tracking-[0.5em] rounded-xl bg-slate-50 dark:bg-white/5 border ${pinError ? "border-rose-500 focus:border-rose-500" : "border-slate-200 dark:border-white/10 focus:border-blue-600"} outline-none transition-colors mb-2`}
                   autoFocus
                 />
                 <div className="h-6 mb-4 flex items-center justify-center">
                   {pinError && <p className="text-xs text-rose-500 font-medium">Incorrect PIN. Try again.</p>}
                 </div>
                 <button 
                   type="submit" 
                   className="w-full h-12 rounded-xl bg-gradient-to-r from-blue-900 to-blue-800 text-white font-medium shadow-lg hover:shadow-xl hover:-translate-y-px transition"
                 >
                   Unlock Dashboard
                 </button>
              </form>
           </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className={dark ? "dark" : ""}>
      <style dangerouslySetInnerHTML={{ __html: `
        nav, header, footer, aside, .sidebar, #sidebar, .navbar, #navbar {
          display: none !important;
        }
        body { margin: 0 !important; padding: 0 !important; }
      `}} />

      <div className="fixed inset-0 z-[100] min-h-screen overflow-y-auto bg-[#f6f7fb] dark:bg-[#0a0c12] text-slate-900 dark:text-slate-100 transition-colors">
        <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-40 -left-40 w-[520px] h-[520px] rounded-full bg-blue-600/20 dark:bg-blue-800/10 blur-[120px]" />
          <div className="absolute top-1/3 -right-40 w-[480px] h-[480px] rounded-full bg-slate-800/20 dark:bg-slate-700/10 blur-[120px]" />
          <div className="absolute bottom-0 left-1/4 w-[420px] h-[420px] rounded-full bg-emerald-300/10 dark:bg-emerald-500/5 blur-[120px]" />
        </div>

        <div className="max-w-[1600px] mx-auto px-4 md:px-8 py-6 space-y-8 pb-28">
          <AccountingHeader
            dark={dark}
            onToggleDark={() => setDark((d) => !d)}
            onAdd={() => setModal({ open: true, editing: null })}
            onRefresh={refresh}
            onExportExcel={() => exportTransactionsToExcel(filtered, "transactions")}
            onExportPDF={() => exportTransactionsToPDF(filtered, "transactions")}
          />

          {error && (
            <div className="rounded-xl border border-rose-300 bg-rose-50 dark:bg-rose-500/10 dark:border-rose-500/30 text-rose-600 dark:text-rose-300 text-sm px-4 py-3 flex items-center gap-2">
              <AlertTriangle size={15} /> {error}
              <button onClick={refresh} className="ml-auto underline text-xs">Retry</button>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center gap-2 py-24 text-slate-400">
              <Loader2 size={18} className="animate-spin" /> Loading accounting data…
            </div>
          ) : (
            <>
              <BankBalanceAndRecent
                txs={txs}
                outstanding={outstanding}
                onManageDues={() => setDueModalOpen(true)}
              />

              <GlobalFilters
                filters={filters}
                setFilters={setFilters}
                onReset={resetFilters}
                courseNames={courseNames}
              />

              <BusinessInsightCards current={filtered} previous={prevPeriod} courseNames={courseNames} />

              <KPICards current={filtered} previous={prevPeriod} />

              <FinancialCharts txs={txs} filters={filters} courseNames={courseNames} />

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <CourseAnalytics txs={filtered} courseNames={courseNames} />
                <ExpenseAnalytics txs={filtered} />
              </div>

              <MarketingAnalytics txs={filtered} courseNames={courseNames} />

              <RecentTransactions
                txs={filtered}
                onEdit={(tx) => setModal({ open: true, editing: tx })}
                onDelete={handleDelete}
                onDuplicate={handleDuplicate}
                onExportExcel={() => exportTransactionsToExcel(filtered, "transactions")}
                onExportPDF={() => exportTransactionsToPDF(filtered, "transactions")}
              />
            </>
          )}
        </div>

        <FloatingQuickActions onAdd={() => setModal({ open: true, editing: null })} />

        <AnimatePresence>
          {modal.open && (
            <TransactionModal
              editing={modal.editing ?? null}
              syllabi={syllabi}
              saving={saving}
              onClose={() => setModal({ open: false })}
              onSave={handleSave}
              onDelete={handleDelete}
            />
          )}
          {dueModalOpen && (
            <OutstandingExpensesModal
              dues={outstanding}
              onClose={() => setDueModalOpen(false)}
              onAdd={addDue}
              onRemove={removeDue}
              onMarkPaid={markDuePaid}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   6. HEADER
   ──────────────────────────────────────────────────────────── */

function AccountingHeader({
  dark, onToggleDark, onAdd, onRefresh, onExportExcel, onExportPDF,
}: {
  dark: boolean; onToggleDark: () => void; onAdd: () => void; onRefresh: () => void;
  onExportExcel: () => void; onExportPDF: () => void;
}) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
          Finance Command Center
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          {format(new Date(), "EEEE, MMMM d, yyyy")} · GyanHub Business Intelligence
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={onRefresh}
          className="h-10 w-10 grid place-items-center rounded-xl bg-white/80 dark:bg-white/5 border border-slate-200 dark:border-white/10 shadow-sm hover:shadow-md hover:-translate-y-px transition"
          title="Refresh data"
        >
          <RefreshCw size={16} />
        </button>
        <button
          onClick={onToggleDark}
          className="h-10 w-10 grid place-items-center rounded-xl bg-white/80 dark:bg-white/5 border border-slate-200 dark:border-white/10 shadow-sm hover:shadow-md hover:-translate-y-px transition"
          title="Toggle theme"
        >
          {dark ? <Sun size={16} /> : <Moon size={16} />}
        </button>
        <button
          onClick={onExportPDF}
          className="h-10 px-4 rounded-xl bg-white/80 dark:bg-white/5 border border-slate-200 dark:border-white/10 shadow-sm hover:shadow-md hover:-translate-y-px transition text-sm font-medium flex items-center gap-2"
        >
          <Download size={15} /> PDF
        </button>
        <button
          onClick={onExportExcel}
          className="h-10 px-4 rounded-xl bg-white/80 dark:bg-white/5 border border-slate-200 dark:border-white/10 shadow-sm hover:shadow-md hover:-translate-y-px transition text-sm font-medium flex items-center gap-2"
        >
          <FileSpreadsheet size={15} /> Excel
        </button>
        <button
          onClick={onAdd}
          className="h-10 px-4 rounded-xl bg-gradient-to-r from-blue-900 to-blue-800 text-white text-sm font-medium flex items-center gap-2 shadow-lg shadow-blue-900/30 hover:shadow-blue-900/50 hover:-translate-y-px transition"
        >
          <Plus size={16} /> Add Transaction
        </button>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   7. GLOBAL FILTERS
   ──────────────────────────────────────────────────────────── */

const QUICK_RANGES: { key: QuickRange; label: string }[] = [
  { key: "this_week", label: "This Week" },
  { key: "last_week", label: "Last Week" },
  { key: "last_month", label: "Last Month" },
  { key: "all", label: "All Time" },
  { key: "custom", label: "Custom Date" },
];

function GlobalFilters({
  filters, setFilters, onReset, courseNames,
}: {
  filters: Filters; setFilters: (f: Filters) => void; onReset: () => void;
  courseNames: string[];
}) {
  return (
    <div className="rounded-2xl bg-white dark:bg-white/[0.04] backdrop-blur border border-slate-200/80 dark:border-white/10 shadow-sm hover:shadow-md transition-shadow p-4 space-y-3">
      <div className="flex flex-wrap gap-2">
        {QUICK_RANGES.map((r) => (
          <button
            key={r.key}
            onClick={() => setFilters({ ...filters, range: r.key })}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition border ${
              filters.range === r.key
                ? "bg-blue-800 text-white border-blue-800"
                : "bg-transparent border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:border-blue-600"
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      {filters.range === "custom" && (
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={filters.customFrom ?? ""}
            onChange={(e) => setFilters({ ...filters, customFrom: e.target.value })}
            className="h-9 px-3 rounded-lg bg-slate-100 dark:bg-white/5 outline-none text-sm"
          />
          <span className="text-slate-400 text-xs">to</span>
          <input
            type="date"
            value={filters.customTo ?? ""}
            onChange={(e) => setFilters({ ...filters, customTo: e.target.value })}
            className="h-9 px-3 rounded-lg bg-slate-100 dark:bg-white/5 outline-none text-sm"
          />
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={filters.course}
          onChange={(v) => setFilters({ ...filters, course: v })}
          options={["all", ...courseNames]}
          label="Course"
        />
        <Select
          value={filters.batch}
          onChange={(v) => setFilters({ ...filters, batch: v })}
          options={["all", ...BATCH_OPTIONS]}
          label="Batch"
        />
        <Select
          value={filters.category}
          onChange={(v) => setFilters({ ...filters, category: v })}
          options={["all", ...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES]}
          label="Category"
          displayFormat={displayCategory}
        />
        <Select
          value={filters.txType}
          onChange={(v) => setFilters({ ...filters, txType: v })}
          options={["all", "income", "expense"]}
          label="Type"
        />

        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            placeholder="Search everywhere…"
            className="w-full h-9 pl-9 pr-3 rounded-lg bg-slate-100 dark:bg-white/5 border border-transparent focus:border-blue-600 outline-none text-sm"
          />
        </div>

        <button
          onClick={onReset}
          className="h-9 px-3 rounded-lg text-xs font-medium text-slate-500 hover:text-slate-800 dark:hover:text-white transition"
        >
          Reset
        </button>
      </div>
    </div>
  );
}

function Select({
  value, onChange, options, label, displayFormat
}: { 
  value: string; 
  onChange: (v: string) => void; 
  options: string[]; 
  label: string;
  displayFormat?: (val: string) => string;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none h-9 pl-3 pr-8 rounded-lg bg-slate-100 dark:bg-white/5 border border-transparent focus:border-blue-600 outline-none text-sm cursor-pointer"
      >
        <option value="all">{label}: All</option>
        {options.filter((o) => o !== "all").map((o) => (
          <option key={o} value={o}>{displayFormat ? displayFormat(o) : o}</option>
        ))}
      </select>
      <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   7b. MONEY IN BANK + LAST 5 TRANSACTIONS
   ──────────────────────────────────────────────────────────── */

function BankBalanceAndRecent({
  txs, outstanding, onManageDues,
}: { txs: Transaction[]; outstanding: OutstandingExpense[]; onManageDues: () => void }) {
  const balance = txs.reduce((s, t) => t.type === "income" ? s + t.amount : s - t.amount, 0);
  const outstandingTotal = outstanding.reduce((s, o) => s + o.amount, 0);
  const availableAfterDues = balance - outstandingTotal;

  const recent = [...txs]
    .sort((a, b) => +new Date(b.date) - +new Date(a.date))
    .slice(0, 5);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <motion.div
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        className="lg:col-span-1 rounded-2xl bg-gradient-to-br from-blue-950 via-blue-900 to-blue-800 text-white p-6 relative overflow-hidden shadow-xl shadow-blue-900/20 ring-1 ring-white/10"
      >
        <div className="absolute -right-10 -bottom-10 w-48 h-48 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -left-10 -top-10 w-32 h-32 rounded-full bg-white/10 blur-2xl" />

        <div className="flex items-center gap-2 text-white/80 text-sm font-medium mb-2">
          <Landmark size={16} /> Money in Bank
        </div>
        <div className="text-3xl md:text-[2.25rem] font-semibold tracking-tight">{fmtNPR(balance)}</div>
        <p className="text-xs text-white/70 mt-1.5">Cumulative balance across all recorded transactions</p>

        <div className="mt-5 pt-4 border-t border-white/15">
          <div className="flex items-center justify-between mb-2">
            <span className="flex items-center gap-1.5 text-xs font-medium text-white/85">
              <AlertTriangle size={13} /> Outstanding Expenses
            </span>
            <span className="text-sm font-semibold text-amber-200">{fmtNPR(outstandingTotal)}</span>
          </div>

          <div className="space-y-1.5 mb-3">
            {outstanding.slice(0, 4).map((o) => (
              <div key={o.id} className="flex items-center justify-between text-xs text-white/75">
                <span className="truncate pr-2">{o.label}</span>
                <span className="shrink-0 font-medium text-white/90">{fmtNPR(o.amount)}</span>
              </div>
            ))}
            {outstanding.length === 0 && <p className="text-xs text-white/60">No dues pending — nice.</p>}
            {outstanding.length > 4 && (
              <p className="text-xs text-white/60">+{outstanding.length - 4} more…</p>
            )}
          </div>

          <div className="flex items-center justify-between rounded-lg bg-white/10 px-3 py-2 mb-3">
            <span className="text-xs text-white/80">Available after dues</span>
            <span className={`text-sm font-semibold ${availableAfterDues >= 0 ? "text-emerald-200" : "text-rose-200"}`}>
              {fmtNPR(availableAfterDues)}
            </span>
          </div>

          <button
            onClick={onManageDues}
            className="w-full h-9 rounded-lg bg-white/15 hover:bg-white/25 transition text-xs font-medium flex items-center justify-center gap-1.5"
          >
            <ScrollText size={13} /> Manage Outstanding Expenses
          </button>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        className="lg:col-span-2 rounded-2xl bg-white dark:bg-white/[0.04] backdrop-blur border border-slate-200/80 dark:border-white/10 p-4 shadow-sm"
      >
        <h3 className="text-sm font-semibold mb-3">Last 5 Transactions</h3>
        <div className="space-y-1.5">
          {recent.map((t) => (
            <div key={t.id} className="flex items-start justify-between rounded-xl px-3 py-2 hover:bg-slate-50 dark:hover:bg-white/[0.03] transition">
              <div className="flex items-start gap-3 min-w-0 pt-0.5">
                <span className={`h-8 w-8 shrink-0 rounded-full grid place-items-center ${
                  t.type === "income" ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
                    : "bg-rose-100 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400"
                }`}>
                  {t.type === "income" ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                </span>
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{displayCategory(t.category)}{t.course ? ` · ${t.course}` : ""}</div>
                  <div className="text-xs text-slate-400">{format(new Date(t.date), "MMM d, yyyy")}</div>
                  {t.description && (
                    <div className="text-xs text-slate-500 truncate mt-0.5">
                      {t.description}
                    </div>
                  )}
                </div>
              </div>
              <div className={`text-sm font-semibold shrink-0 ${t.type === "income" ? "text-emerald-500" : "text-rose-500"}`}>
                {t.type === "income" ? "+" : "-"}{fmtNPR(t.amount)}
              </div>
            </div>
          ))}
          {recent.length === 0 && <p className="text-sm text-slate-400 py-6 text-center">No transactions yet.</p>}
        </div>
      </motion.div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   7c. OUTSTANDING EXPENSES MANAGER MODAL
   ──────────────────────────────────────────────────────────── */

function OutstandingExpensesModal({
  dues, onClose, onAdd, onRemove, onMarkPaid,
}: {
  dues: OutstandingExpense[];
  onClose: () => void;
  onAdd: (due: Omit<OutstandingExpense, "id" | "status">) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
  onMarkPaid: (due: OutstandingExpense) => Promise<void>;
}) {
  const [form, setForm] = useState({ label: "", category: EXPENSE_CATEGORIES[0], amount: 0, dueDate: format(new Date(), "yyyy-MM-dd") });
  const [busyId, setBusyId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const total = dues.reduce((s, d) => s + d.amount, 0);

  const submitAdd = async () => {
    if (!form.label.trim()) return setError("Label is required.");
    if (!form.amount || form.amount <= 0) return setError("Amount must be greater than 0.");
    setError(null);
    setAdding(true);
    try {
      await onAdd(form);
      setForm({ label: "", category: EXPENSE_CATEGORIES[0], amount: 0, dueDate: format(new Date(), "yyyy-MM-dd") });
    } catch (e: any) {
      setError(e?.message ?? "Failed to add due.");
    } finally {
      setAdding(false);
    }
  };

  const handlePay = async (d: OutstandingExpense) => {
    if (!confirm(`Mark "${d.label}" (${fmtNPR(d.amount)}) as paid? This will record it as an expense.`)) return;
    setBusyId(d.id);
    try {
      await onMarkPaid(d);
    } catch (e: any) {
      alert(e?.message ?? "Failed to mark as paid.");
    } finally {
      setBusyId(null);
    }
  };

  const handleRemove = async (d: OutstandingExpense) => {
    if (!confirm(`Remove "${d.label}" from outstanding dues? This does not create an expense.`)) return;
    setBusyId(d.id);
    try {
      await onRemove(d.id);
    } catch (e: any) {
      alert(e?.message ?? "Failed to remove due.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl bg-white dark:bg-[#12151c] border border-slate-200 dark:border-white/10 shadow-2xl p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-lg">Outstanding Expenses</h3>
            <p className="text-xs text-slate-400 mt-0.5">{dues.length} pending · total {fmtNPR(total)}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10"><X size={18} /></button>
        </div>

        {/* Add new due */}
        <div className="rounded-xl bg-slate-50 dark:bg-white/[0.03] p-4 mb-5">
          <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-3 uppercase tracking-wide">Add New Due</h4>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Label" full>
              <input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })}
                placeholder="e.g. Office Rent — August"
                className="w-full h-10 px-3 rounded-lg bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 outline-none text-sm" />
            </Field>
            <Field label="Category">
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full h-10 px-3 rounded-lg bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 outline-none text-sm">
                {EXPENSE_CATEGORIES.map((c) => <option key={c} value={c}>{displayCategory(c)}</option>)}
              </select>
            </Field>
            <Field label="Amount (NPR)">
              <input type="number" min={0} value={form.amount || ""} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
                className="w-full h-10 px-3 rounded-lg bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 outline-none text-sm" placeholder="0" />
            </Field>
            <Field label="Due Date" full>
              <input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                className="w-full h-10 px-3 rounded-lg bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 outline-none text-sm" />
            </Field>
          </div>
          {error && <p className="text-xs text-rose-500 mt-2 flex items-center gap-1"><AlertTriangle size={13} /> {error}</p>}
          <button
            onClick={submitAdd}
            disabled={adding}
            className="mt-3 h-9 px-4 rounded-lg text-sm font-medium bg-gradient-to-r from-blue-900 to-blue-800 text-white shadow-md disabled:opacity-60 flex items-center gap-2"
          >
            {adding && <Loader2 size={14} className="animate-spin" />}
            <Plus size={14} /> Add Due
          </button>
        </div>

        {/* Existing dues list */}
        <div className="space-y-2">
          {dues.map((d) => (
            <div key={d.id} className="flex items-center justify-between rounded-xl px-4 py-3 bg-slate-50 dark:bg-white/[0.03]">
              <div className="min-w-0">
                <div className="text-sm font-medium truncate">{d.label}</div>
                <div className="text-xs text-slate-400">{displayCategory(d.category)} · due {format(new Date(d.dueDate), "MMM d, yyyy")}</div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-sm font-semibold text-amber-600 dark:text-amber-400">{fmtNPR(d.amount)}</span>
                <button
                  onClick={() => handlePay(d)}
                  disabled={busyId === d.id}
                  title="Mark as paid (creates an expense record)"
                  className="p-1.5 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 transition disabled:opacity-50"
                >
                  <CheckCircle2 size={16} />
                </button>
                <button
                  onClick={() => handleRemove(d)}
                  disabled={busyId === d.id}
                  title="Remove due"
                  className="p-1.5 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-500/10 text-rose-500 transition disabled:opacity-50"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
          {dues.length === 0 && <p className="text-sm text-slate-400 py-8 text-center">No outstanding expenses. Add one above.</p>}
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ────────────────────────────────────────────────────────────
   8. KPI CARDS
   ──────────────────────────────────────────────────────────── */

function KPICard({
  icon, label, value, delta, tone = "default",
}: { icon: React.ReactNode; label: string; value: string; delta?: number; tone?: "default" | "danger" }) {
  const positive = (delta ?? 0) >= 0;
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl bg-white dark:bg-white/[0.04] backdrop-blur border border-slate-200/80 dark:border-white/10 shadow-sm hover:shadow-md transition-shadow p-4 relative overflow-hidden group"
    >
      <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-gradient-to-br from-blue-700/10 to-blue-900/10 blur-xl group-hover:scale-125 transition-transform" />
      <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs font-medium mb-2">
        {icon}
        <span>{label}</span>
      </div>
      <div className="text-xl md:text-2xl font-semibold tracking-tight">{value}</div>
      {delta !== undefined && (
        <div className={`mt-1.5 inline-flex items-center gap-1 text-xs font-medium ${
          tone === "danger" ? (positive ? "text-rose-500" : "text-emerald-500")
                             : (positive ? "text-emerald-500" : "text-rose-500")
        }`}>
          {positive ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
          {Math.abs(delta).toFixed(1)}%
          <span className="text-slate-400 dark:text-slate-500 font-normal ml-1">vs last period</span>
        </div>
      )}
    </motion.div>
  );
}

function KPICards({ current, previous }: { current: Transaction[]; previous: Transaction[] }) {
  const revenue = bizSum(current, "income", ["Owner Investment"]);
  const prevRevenue = bizSum(previous, "income", ["Owner Investment"]);
  
  const expenses = bizSum(current, "expense", ["Owner Withdrawal"]);
  const prevExpenses = bizSum(previous, "expense", ["Owner Withdrawal"]);
  
  const netProfit = revenue - expenses;
  const prevNetProfit = prevRevenue - prevExpenses;
  const margin = revenue ? (netProfit / revenue) * 100 : 0;
  const prevMargin = prevRevenue ? (prevNetProfit / prevRevenue) * 100 : 0;

  const marketing = sum(current.filter((t) => t.category === "marketing"), ["expense"]);
  const prevMarketing = sum(previous.filter((t) => t.category === "marketing"), ["expense"]);
  const tutorFee = sum(current.filter((t) => t.category === "Tutor Fee"), ["expense"]);
  const prevTutorFee = sum(previous.filter((t) => t.category === "Tutor Fee"), ["expense"]);
  
  const withdrawals = sum(current.filter((t) => t.category === "Owner Withdrawal"), ["expense"]);
  const prevWithdrawals = sum(previous.filter((t) => t.category === "Owner Withdrawal"), ["expense"]);

  const cards = [
    { icon: <DollarSign size={14} />, label: "Operating Revenue", value: fmtNPR(revenue), delta: pctDelta(revenue, prevRevenue) },
    { icon: <TrendingDown size={14} />, label: "Operating Expenses", value: fmtNPR(expenses), delta: pctDelta(expenses, prevExpenses), tone: "danger" as const },
    { icon: <TrendingUp size={14} />, label: "Net Profit", value: fmtNPR(netProfit), delta: pctDelta(netProfit, prevNetProfit) },
    { icon: <Sparkles size={14} />, label: "Profit Margin %", value: `${margin.toFixed(1)}%`, delta: margin - prevMargin },
    { icon: <Megaphone size={14} />, label: "Marketing Spend", value: fmtNPR(marketing), delta: pctDelta(marketing, prevMarketing), tone: "danger" as const },
    { icon: <Wallet size={14} />, label: "Tutor Payments", value: fmtNPR(tutorFee), delta: pctDelta(tutorFee, prevTutorFee), tone: "danger" as const },
    { icon: <Users size={14} />, label: "Owner Withdrawals", value: fmtNPR(withdrawals), delta: pctDelta(withdrawals, prevWithdrawals), tone: "danger" as const },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
      {cards.map((c) => <KPICard key={c.label} {...c} />)}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   9. SMART INSIGHTS
   ──────────────────────────────────────────────────────────── */

function BusinessInsightCards({
  current, previous, courseNames,
}: { current: Transaction[]; previous: Transaction[]; courseNames: string[] }) {
  const byCourse = courseNames.map((course) => {
    const rev = sum(current.filter((t) => t.course === course && t.category !== "Owner Investment"), ["income"]);
    const exp = sum(current.filter((t) => t.course === course && t.category !== "Owner Withdrawal"), ["expense"]);
    return { course, rev, profit: rev - exp };
  }).filter(c => c.rev > 0 || Math.abs(c.profit) > 0);

  const best = [...byCourse].sort((a, b) => b.profit - a.profit)[0];
  const worst = [...byCourse].sort((a, b) => a.profit - b.profit)[0];

  const byCategory = EXPENSE_CATEGORIES.map((cat) => ({
    cat, total: sum(current.filter((t) => t.category === cat), ["expense"]),
  })).sort((a, b) => b.total - a.total).filter(c => c.total > 0);

  const revenue = bizSum(current, "income", ["Owner Investment"]);
  const totalRevenue = revenue || 1;
  const bestSharePct = best ? ((best.rev / totalRevenue) * 100).toFixed(0) : "0";

  const marketingSpend = byCategory.find((c) => c.cat === "marketing")?.total ?? 0;
  const marketingRevenue = sum(current.filter((t) => t.category === "marketing"), []) === 0
    ? sum(current.filter((t) => t.course && t.category !== "Owner Investment"), ["income"]) : 0;
  const roi = marketingSpend ? (((marketingRevenue - marketingSpend) / marketingSpend) * 100) : 0;

  const insights = [
    { icon: "🔥", title: "Highest Profit Course", value: best?.course ?? "—", sub: fmtNPR(best?.profit ?? 0) },
    { icon: "📉", title: "Lowest Profit Course", value: worst?.course ?? "—", sub: fmtNPR(worst?.profit ?? 0) },
    { icon: "💰", title: "Biggest Expense Category", value: byCategory[0] ? displayCategory(byCategory[0].cat) : "—", sub: fmtNPR(byCategory[0]?.total ?? 0) },
    { icon: "📢", title: "Marketing ROI", value: `${roi.toFixed(0)}%`, sub: "Estimated return" },
    { icon: "🎯", title: "Avg Revenue / Course", value: fmtNPR(Math.round(revenue / (byCourse.length || 1))), sub: "This period" },
  ];

  return (
    <div>
      <div className="flex items-center gap-2 mb-3 text-sm font-medium text-slate-500 dark:text-slate-400">
        <Sparkles size={15} className="text-blue-700" /> Smart Insights
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        {insights.map((i) => (
          <div key={i.title} className="rounded-2xl bg-gradient-to-br from-blue-700/10 via-transparent to-transparent border border-blue-200/50 dark:border-blue-700/20 p-4">
            <div className="text-lg mb-1">{i.icon}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">{i.title}</div>
            <div className="font-semibold">{i.value}</div>
            <div className="text-xs text-slate-400 mt-0.5">{i.sub}</div>
          </div>
        ))}
      </div>
      {best && (
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-3">
          <strong className="text-slate-700 dark:text-slate-200">{best.course}</strong> generated{" "}
          <strong className="text-slate-700 dark:text-slate-200">{bestSharePct}%</strong> of total revenue this period.
        </p>
      )}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   10. CHARTS
   ──────────────────────────────────────────────────────────── */

const CHART_COLORS = ["#1e3a8a", "#1e40af", "#1d4ed8", "#2563eb", "#10b981", "#06b6d4", "#ef4444"];

function monthlySeries(txs: Transaction[]) {
  const map = new Map<string, { month: string; revenue: number; expense: number }>();
  txs.forEach((t) => {
    const key = format(new Date(t.date), "MMM yyyy");
    if (!map.has(key)) map.set(key, { month: key, revenue: 0, expense: 0 });
    const row = map.get(key)!;
    if (t.type === "income" && t.category !== "Owner Investment") row.revenue += t.amount;
    if (t.type === "expense" && t.category !== "Owner Withdrawal") row.expense += t.amount;
  });
  return Array.from(map.values()).sort((a, b) => +new Date(a.month) - +new Date(b.month));
}

function FinancialCharts({
  txs, filters, courseNames,
}: { txs: Transaction[]; filters: Filters; courseNames: string[] }) {
  const series = useMemo(() => monthlySeries(txs), [txs]);
  const profitSeries = series.map((s) => ({ month: s.month, profit: s.revenue - s.expense }));

  const filtered = useMemo(() => applyFilters(txs, filters), [txs, filters]);

  const expenseBreakdown = useMemo(() => {
    return EXPENSE_CATEGORIES.map((cat) => ({
      name: displayCategory(cat), value: sum(filtered.filter((t) => t.category === cat), ["expense"]),
    })).filter((d) => d.value > 0);
  }, [filtered]);

  const revenueByCourse = useMemo(() => courseNames.map((c) => ({
    course: c, revenue: sum(filtered.filter((t) => t.course === c && t.category !== "Owner Investment"), ["income"]),
  })).filter(d => d.revenue > 0), [filtered, courseNames]);

  const profitByCourse = useMemo(() => courseNames.map((c) => {
    const rev = sum(filtered.filter((t) => t.course === c && t.category !== "Owner Investment"), ["income"]);
    const exp = sum(filtered.filter((t) => t.course === c && t.category !== "Owner Withdrawal"), ["expense"]);
    return { course: c, profit: rev - exp };
  }).filter(d => d.profit !== 0), [filtered, courseNames]);

  const revenueSource = [
    { name: "Online Course", value: sum(filtered.filter(t => t.category === "Online Course"), ["income"]) },
    { name: "Physical Class", value: sum(filtered.filter(t => t.category === "Physical Class"), ["income"]) },
    { name: "Other Income", value: sum(filtered.filter(t => t.category === "Other Income"), ["income"]) },
  ].filter(d => d.value > 0);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      <ChartCard title="Revenue vs Expense">
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={series}>
            <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} />
            <XAxis dataKey="month" fontSize={12} />
            <YAxis fontSize={12} tickFormatter={(v) => `${v / 1000}k`} />
            <Tooltip formatter={(value: any) => (typeof value === 'number' ? fmtNPR(value) : value)} />
            <Legend />
            <Line type="monotone" dataKey="revenue" stroke="#1e3a8a" strokeWidth={2.5} dot={false} name="Revenue" />
            <Line type="monotone" dataKey="expense" stroke="#f43f5e" strokeWidth={2.5} dot={false} name="Expense" />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Net Profit Trend">
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={profitSeries}>
            <defs>
              <linearGradient id="profitFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} />
            <XAxis dataKey="month" fontSize={12} />
            <YAxis fontSize={12} tickFormatter={(v) => `${v / 1000}k`} />
            <Tooltip formatter={(value: any) => (typeof value === 'number' ? fmtNPR(value) : value)} />
            <Area type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={2.5} fill="url(#profitFill)" name="Profit" />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Expense Breakdown">
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie data={expenseBreakdown} dataKey="value" nameKey="name" innerRadius={60} outerRadius={95} paddingAngle={3}>
              {expenseBreakdown.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
            </Pie>
            <Tooltip formatter={(value: any) => (typeof value === 'number' ? fmtNPR(value) : value)} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Revenue Source">
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie data={revenueSource} dataKey="value" nameKey="name" outerRadius={95} label>
              {revenueSource.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
            </Pie>
            <Tooltip formatter={(value: any) => (typeof value === 'number' ? fmtNPR(value) : value)} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Revenue by Course">
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={revenueByCourse} layout="vertical" margin={{ left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} horizontal={false} />
            <XAxis type="number" fontSize={12} tickFormatter={(v) => `${v / 1000}k`} />
            <YAxis type="category" dataKey="course" fontSize={12} width={80} />
            <Tooltip formatter={(value: any) => (typeof value === 'number' ? fmtNPR(value) : value)} />
            <Bar dataKey="revenue" fill="#1e3a8a" radius={[0, 6, 6, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Profit by Course">
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={profitByCourse}>
            <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} />
            <XAxis dataKey="course" fontSize={12} />
            <YAxis fontSize={12} tickFormatter={(v) => `${v / 1000}k`} />
            <Tooltip formatter={(value: any) => (typeof value === 'number' ? fmtNPR(value) : value)} />
            <Bar dataKey="profit" radius={[6, 6, 0, 0]}>
              {profitByCourse.map((d, i) => (
                <Cell key={i} fill={d.profit >= 0 ? "#10b981" : "#f43f5e"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl bg-white dark:bg-white/[0.04] backdrop-blur border border-slate-200/80 dark:border-white/10 shadow-sm hover:shadow-md transition-shadow p-4"
    >
      <h3 className="text-sm font-semibold mb-3">{title}</h3>
      {children}
    </motion.div>
  );
}

/* ────────────────────────────────────────────────────────────
   11. COURSE ANALYTICS
   ──────────────────────────────────────────────────────────── */

function CourseAnalytics({ txs, courseNames }: { txs: Transaction[]; courseNames: string[] }) {
  const rows = courseNames.map((course) => {
    const courseTxs = txs.filter((t) => t.course === course);
    const revenue = sum(courseTxs.filter(t => t.category !== "Owner Investment"), ["income"]);
    const expense = sum(courseTxs.filter(t => t.category !== "Owner Withdrawal"), ["expense"]);
    const marketing = sum(courseTxs.filter((t) => t.category === "marketing"), ["expense"]);
    const tutorFee = sum(courseTxs.filter((t) => t.category === "Tutor Fee"), ["expense"]);
    const profit = revenue - expense;
    
    const students = courseTxs.filter((t) => t.category === "Online Course" || t.category === "Physical Class").length;
    
    return { course, revenue, expense, marketing, tutorFee, profit, students, margin: revenue ? (profit / revenue) * 100 : 0 };
  })
  .filter((r) => r.revenue > 0 || r.expense > 0 || r.students > 0)
  .sort((a, b) => b.profit - a.profit);

  return (
    <div className="rounded-2xl bg-white dark:bg-white/[0.04] backdrop-blur border border-slate-200/80 dark:border-white/10 shadow-sm hover:shadow-md transition-shadow p-4">
      <h3 className="text-sm font-semibold mb-3">Profit by Course</h3>
      <div className="space-y-2">
        {rows.map((r, i) => (
          <div key={r.course} className="flex items-center justify-between rounded-xl px-3 py-2.5 bg-slate-50 dark:bg-white/[0.03]">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-slate-400 w-6">#{i + 1}</span>
              <div>
                <div className="font-medium text-sm">{r.course}</div>
                <div className="text-xs text-slate-400">{r.students} entries · {r.margin.toFixed(0)}% margin</div>
              </div>
            </div>
            <div className="text-right">
              <div className={`text-sm font-semibold ${r.profit >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
                {fmtNPR(r.profit)}
              </div>
              <div className="text-xs text-slate-400">rev {fmtNPR(r.revenue)}</div>
            </div>
          </div>
        ))}
        {rows.length === 0 && <p className="text-sm text-slate-400 py-6 text-center">No courses with active financial data found.</p>}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   12. EXPENSE ANALYTICS
   ──────────────────────────────────────────────────────────── */

function ExpenseAnalytics({ txs }: { txs: Transaction[] }) {
  const expenseTxs = txs.filter((t) => t.type === "expense");
  const largest = [...expenseTxs].sort((a, b) => b.amount - a.amount)[0];
  const avg = expenseTxs.length ? expenseTxs.reduce((s, t) => s + t.amount, 0) / expenseTxs.length : 0;
  const byCategory = EXPENSE_CATEGORIES.map((cat) => ({
    cat, total: sum(expenseTxs.filter((t) => t.category === cat), ["expense"]),
  }))
  .filter(c => c.total > 0)
  .sort((a, b) => b.total - a.total);

  return (
    <div className="rounded-2xl bg-white dark:bg-white/[0.04] backdrop-blur border border-slate-200/80 dark:border-white/10 shadow-sm hover:shadow-md transition-shadow p-4">
      <h3 className="text-sm font-semibold mb-3">Expense Analytics</h3>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <MiniStat label="Largest Expense" value={largest ? fmtNPR(largest.amount) : "—"} sub={largest ? displayCategory(largest.category) : undefined} />
        <MiniStat label="Average Expense" value={fmtNPR(Math.round(avg))} />
      </div>
      <div className="space-y-2">
        {byCategory.map((c) => {
          const max = byCategory[0]?.total || 1;
          return (
            <div key={c.cat}>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-500 dark:text-slate-400">{displayCategory(c.cat)}</span>
                <span className="font-medium">{fmtNPR(c.total)}</span>
              </div>
              <div className="h-1.5 rounded-full bg-slate-100 dark:bg-white/5 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-blue-700 to-blue-900 rounded-full" style={{ width: `${(c.total / max) * 100}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MiniStat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl bg-slate-50 dark:bg-white/[0.03] p-3">
      <div className="text-xs text-slate-400">{label}</div>
      <div className="font-semibold text-sm mt-0.5">{value}</div>
      {sub && <div className="text-xs text-slate-400">{sub}</div>}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   13. MARKETING ANALYTICS
   ──────────────────────────────────────────────────────────── */

function MarketingAnalytics({ txs, courseNames }: { txs: Transaction[]; courseNames: string[] }) {
  const rows = courseNames.map((course) => {
    const spend = sum(txs.filter((t) => t.course === course && t.category === "marketing"), ["expense"]);
    const revenue = sum(txs.filter((t) => t.course === course && t.category !== "Owner Investment"), ["income"]);
    const roi = spend ? ((revenue - spend) / spend) * 100 : 0;
    return { course, spend, revenue, roi };
  })
  .filter((r) => r.spend > 0 || r.revenue > 0);

  return (
    <div className="rounded-2xl bg-white dark:bg-white/[0.04] backdrop-blur border border-slate-200/80 dark:border-white/10 shadow-sm hover:shadow-md transition-shadow p-4">
      <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><Megaphone size={15} /> Marketing ROI by Course</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {rows.map((r) => (
          <div key={r.course} className="rounded-xl bg-slate-50 dark:bg-white/[0.03] p-3">
            <div className="text-sm font-medium mb-2">{r.course}</div>
            <div className="text-xs text-slate-400">Marketing</div>
            <div className="text-sm font-semibold mb-1">{fmtNPR(r.spend)}</div>
            <div className="text-xs text-slate-400">Revenue</div>
            <div className="text-sm font-semibold mb-1">{fmtNPR(r.revenue)}</div>
            <div className={`text-xs font-semibold ${r.roi >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
              ROI {r.roi.toFixed(0)}%
            </div>
          </div>
        ))}
        {rows.length === 0 && <p className="text-sm text-slate-400 py-6 text-center col-span-full">No courses with marketing spend found.</p>}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   14. TRANSACTIONS TABLE
   ──────────────────────────────────────────────────────────── */

function RecentTransactions({
  txs, onEdit, onDelete, onDuplicate, onExportExcel, onExportPDF,
}: {
  txs: Transaction[];
  onEdit: (t: Transaction) => void;
  onDelete: (id: string) => void;
  onDuplicate: (t: Transaction) => void;
  onExportExcel: () => void;
  onExportPDF: () => void;
}) {
  const [localType, setLocalType] = useState("all");
  const [localSearch, setLocalSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 8;

  const filteredTxs = useMemo(() => {
    return txs.filter((t) => {
      if (localType !== "all" && t.type !== localType) return false;
      if (localSearch) {
        const q = localSearch.toLowerCase();
        const hay = `${displayCategory(t.category)} ${t.course ?? ""} ${t.description}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [txs, localType, localSearch]);

  // Reset page when local filters change
  useEffect(() => {
    setPage(1);
  }, [localType, localSearch]);

  const totalPages = Math.max(1, Math.ceil(filteredTxs.length / pageSize));
  const pageRows = filteredTxs.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="rounded-2xl bg-white dark:bg-white/[0.04] backdrop-blur border border-slate-200/80 dark:border-white/10 overflow-hidden shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border-b border-slate-200 dark:border-white/10">
        <h3 className="text-sm font-semibold">Transactions ({filteredTxs.length})</h3>
        
        {/* Table Local Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              placeholder="Search descriptions..."
              className="w-40 h-8 pl-8 pr-3 rounded-lg bg-slate-100 dark:bg-white/5 border border-transparent focus:border-blue-600 outline-none text-xs"
            />
          </div>
          <select
            value={localType}
            onChange={(e) => setLocalType(e.target.value)}
            className="h-8 px-3 rounded-lg bg-slate-100 dark:bg-white/5 outline-none text-xs border border-transparent focus:border-blue-600 appearance-none pr-8 cursor-pointer relative"
          >
            <option value="all">All Types</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
          <div className="w-px h-5 bg-slate-200 dark:bg-white/10 mx-1 hidden sm:block" />
          <div className="flex gap-2 text-xs text-slate-500 dark:text-slate-400">
            <button onClick={onExportExcel} className="flex items-center gap-1 hover:text-blue-800 dark:hover:text-blue-600 transition font-medium">
              <FileSpreadsheet size={13} /> Export Excel
            </button>
            <span className="text-slate-300 dark:text-slate-600">·</span>
            <button onClick={onExportPDF} className="flex items-center gap-1 hover:text-blue-800 dark:hover:text-blue-600 transition font-medium">
              <Download size={13} /> Export PDF
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-slate-400 border-b border-slate-200 dark:border-white/10">
              <th className="px-4 py-2.5 font-medium">Date</th>
              <th className="px-4 py-2.5 font-medium">Type</th>
              <th className="px-4 py-2.5 font-medium">Category</th>
              <th className="px-4 py-2.5 font-medium">Course / Batch</th>
              <th className="px-4 py-2.5 font-medium text-right">Amount</th>
              <th className="px-4 py-2.5 font-medium">Description</th>
              <th className="px-4 py-2.5 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.map((t) => (
              <tr key={t.id} className="border-b border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/[0.03] transition">
                <td className="px-4 py-2.5 whitespace-nowrap text-slate-500 dark:text-slate-400">{format(new Date(t.date), "MMM d, yyyy")}</td>
                <td className="px-4 py-2.5">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    t.type === "income" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                    : "bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400"
                  }`}>
                    {t.type}
                  </span>
                </td>
                <td className="px-4 py-2.5">{displayCategory(t.category)}</td>
                <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400">
                  {t.course ? `${t.course}${t.batch ? " · " + t.batch : ""}` : (t.batch ?? "—")}
                </td>
                <td className={`px-4 py-2.5 text-right font-medium ${t.type === "income" ? "text-emerald-500" : "text-rose-500"}`}>
                  {t.type === "income" ? "+" : "-"}{fmtNPR(t.amount)}
                </td>
                <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400 max-w-[200px] truncate" title={t.description}>{t.description || "—"}</td>
                <td className="px-4 py-2.5">
                  <div className="flex justify-end gap-1">
                    <button onClick={() => onEdit(t)} className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-white/10 transition"><Pencil size={13} /></button>
                    <button onClick={() => onDuplicate(t)} className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-white/10 transition"><Copy size={13} /></button>
                    <button onClick={() => onDelete(t.id)} className="p-1.5 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-500/10 text-rose-500 transition"><Trash2 size={13} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {pageRows.length === 0 && (
              <tr><td colSpan={7} className="text-center py-10 text-slate-400 text-sm">No transactions match these filters.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between p-4 text-xs text-slate-400">
        <span>Page {page} of {totalPages}</span>
        <div className="flex gap-2">
          <button disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-white/5 disabled:opacity-40">Prev</button>
          <button disabled={page === totalPages} onClick={() => setPage((p) => p + 1)} className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-white/5 disabled:opacity-40">Next</button>
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   15. ADD / EDIT TRANSACTION MODAL
   ──────────────────────────────────────────────────────────── */

function categoriesFor(type: TxType) {
  if (type === "income") return INCOME_CATEGORIES;
  return EXPENSE_CATEGORIES;
}

function emptyTransaction(): Transaction {
  return {
    id: "",
    date: format(new Date(), "yyyy-MM-dd"),
    type: "income",
    category: INCOME_CATEGORIES[0],
    course: null,
    syllabusId: null,
    batch: format(new Date(), "MMM"),
    amount: 0,
    description: "",
  };
}

function TransactionModal({
  editing, syllabi, saving, onClose, onSave, onDelete,
}: {
  editing: Transaction | null;
  syllabi: Option[];
  saving: boolean;
  onClose: () => void;
  onSave: (t: Transaction, isNew: boolean) => void;
  onDelete: (id: string) => void;
}) {
  const [form, setForm] = useState<Transaction>(editing ?? emptyTransaction());
  const [error, setError] = useState<string | null>(null);

  const cats = categoriesFor(form.type);
  const isNew = !editing;
  
  const showCourseBatch = 
    form.category !== "Owner Investment" && 
    form.category !== "Owner Withdrawal";

  const submit = () => {
    if (!form.amount || form.amount <= 0) return setError("Amount must be greater than 0.");
    if (!form.category) return setError("Category is required.");
    setError(null);
    onSave(form, isNew);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-2xl bg-white dark:bg-[#12151c] border border-slate-200 dark:border-white/10 shadow-2xl p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg">{editing ? "Edit Transaction" : "Add Transaction"}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10"><X size={18} /></button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Date">
            <input type="date" value={form.date.slice(0, 10)} onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="w-full h-10 px-3 rounded-lg bg-slate-100 dark:bg-white/5 outline-none text-sm" />
          </Field>

          <Field label="Type">
            <select
              value={form.type}
              onChange={(e) => {
                const type = e.target.value as TxType;
                setForm({
                  ...form,
                  type,
                  category: categoriesFor(type)[0],
                });
              }}
              className="w-full h-10 px-3 rounded-lg bg-slate-100 dark:bg-white/5 outline-none text-sm"
            >
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
          </Field>

          <Field label="Category" full>
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full h-10 px-3 rounded-lg bg-slate-100 dark:bg-white/5 outline-none text-sm">
              {cats.map((c) => <option key={c} value={c}>{displayCategory(c)}</option>)}
            </select>
          </Field>

          {showCourseBatch && (
            <>
              <Field label="Course">
                <select
                  value={form.syllabusId ?? ""}
                  onChange={(e) => {
                    const id = e.target.value ? Number(e.target.value) : null;
                    const name = syllabi.find((s) => s.id === id)?.name ?? null;
                    setForm({ ...form, syllabusId: id, course: name });
                  }}
                  className="w-full h-10 px-3 rounded-lg bg-slate-100 dark:bg-white/5 outline-none text-sm"
                >
                  <option value="">None</option>
                  <option disabled>──────────</option>
                  {syllabi.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </Field>

              <Field label="Batch">
                <select
                  value={form.batch ?? ""}
                  onChange={(e) => setForm({ ...form, batch: e.target.value || null })}
                  className="w-full h-10 px-3 rounded-lg bg-slate-100 dark:bg-white/5 outline-none text-sm"
                >
                  <option value="">None</option>
                  <option disabled>──────────</option>
                  {BATCH_OPTIONS.map((b) => <option key={b} value={b}>{b}</option>)}
                </select>
              </Field>
            </>
          )}

          <Field label="Amount (NPR)" full>
            <input type="number" min={0} value={form.amount || ""} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
              className="w-full h-10 px-3 rounded-lg bg-slate-100 dark:bg-white/5 outline-none text-sm" placeholder="0" />
          </Field>

          <Field label="Description" full>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2} className="w-full px-3 py-2 rounded-lg bg-slate-100 dark:bg-white/5 outline-none text-sm resize-none" />
          </Field>
        </div>

        {error && <p className="text-xs text-rose-500 mt-3 flex items-center gap-1"><AlertTriangle size={13} /> {error}</p>}

        <div className="flex items-center justify-between mt-6">
          <div>
            {editing && (
              <button onClick={() => onDelete(editing.id)} className="text-xs text-rose-500 font-medium flex items-center gap-1 hover:underline">
                <Trash2 size={13} /> Delete
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button onClick={onClose} className="h-9 px-4 rounded-lg text-sm font-medium text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5">Cancel</button>
            <button
              onClick={submit}
              disabled={saving}
              className="h-9 px-5 rounded-lg text-sm font-medium bg-gradient-to-r from-blue-900 to-blue-800 text-white shadow-lg shadow-blue-900/25 disabled:opacity-60 flex items-center gap-2"
            >
              {saving && <Loader2 size={14} className="animate-spin" />}
              Save
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div className={full ? "col-span-2" : ""}>
      <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">{label}</label>
      {children}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   16. FLOATING QUICK ACTIONS
   ──────────────────────────────────────────────────────────── */

function FloatingQuickActions({ onAdd }: { onAdd: () => void }) {
  return (
    <motion.button
      onClick={onAdd}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-gradient-to-r from-blue-900 to-blue-800 text-white shadow-xl shadow-blue-900/30 grid place-items-center z-[110]"
      title="Add transaction"
    >
      <Plus size={24} />
    </motion.button>
  );
}