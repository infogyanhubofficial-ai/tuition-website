"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  LayoutDashboard, TrendingUp, TrendingDown, DollarSign,
  ShoppingCart, Users, Briefcase, Award, BookOpen, GraduationCap,
  MessageSquare, Bell, Clock, ChevronRight, ExternalLink, Send,
  Plus, X, Check, Pencil, Trash2, Filter, RefreshCw, Loader2,
  Flame, AlertCircle, CheckCircle, Lock, BarChart2, Activity,
  ArrowUpRight, Circle, Layers, BrainCircuit, Target,
  FileText, MessageCircle, Upload, Eye, Copy, CheckSquare,
  ChevronDown, Zap, Search, Command, Globe, Sparkles,
  TrendingUp as TUp, Map, ArrowRight, Inbox, PieChart as PieIcon,
  Calendar, Hash, Star, ChevronLeft, MoreHorizontal, Edit3
} from "lucide-react";
import {
  LineChart, Line, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";

// ─── TYPES ────────────────────────────────────────────────────────────────────
type TransactionType = "revenue" | "tutor_payment" | "marketing_expense";

interface Transaction {
  id: number;
  course_date: string;
  updated_at?: string;
  transaction_type: TransactionType;
  syllabus_id: number | null;
  batch_name: string | null;
  amount: number;
  notes: string | null;
  syllabi_v2?: { name: string } | null;
}

interface Syllabus { id: number; name: string; }

interface ActiveBatch {
  id: string;
  syllabus_id: number;
  course_name: string;
  batch_no: number;
  start_datetime: string | null;
  timing: string | null;
  online_class_link: string | null;
  whatsapp_group_link: string | null;
  google_classroom_link: string | null;
}

interface OrderData {
  id: string;
  full_name: string;
  order_name: string;
  pending_amount: number;
  paid_amount: number;
  status: string;
  created_at: string;
  updated_at?: string;
}

interface RecentActivity {
  id: number | string;
  type: "application" | "request";
  name: string;
  sub: string;
  created_at: string;
}

interface Message {
  id: string;
  user_id: string;
  sender_role: string;
  content: string;
  created_at: string;
  updated_at?: string;
  is_read?: boolean;
  profiles?: { full_name: string; avatar_url: string; };
}

// ─── UTILS ────────────────────────────────────────────────────────────────────
const fc = (n: number) => `Nrs ${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
const fcs = (n: number) => n.toLocaleString("en-IN", { maximumFractionDigits: 0 });
const safeDiv = (a: number, b: number) => b === 0 ? 0 : a / b;
const localDate = (d: Date) => {
  const offset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - offset).toISOString().split("T")[0];
};
const timeAgo = (s: string) => {
  const m = Math.floor((Date.now() - new Date(s).getTime()) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
};
const sortDate = (a: string | undefined, b: string | undefined) =>
  new Date(b || 0).getTime() - new Date(a || 0).getTime();

// ─── ANIMATED COUNTER ─────────────────────────────────────────────────────────
function AnimatedNumber({ value, prefix = "", suffix = "", decimals = 0 }: { value: number; prefix?: string; suffix?: string; decimals?: number }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const start = display;
    const end = value;
    const duration = 800;
    const startTime = Date.now();
    const frame = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(start + (end - start) * eased);
      if (progress < 1) requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }, [value]);
  return <>{prefix}{display.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}{suffix}</>;
}

// ─── SKELETON LOADER ──────────────────────────────────────────────────────────
function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`relative overflow-hidden rounded-lg bg-slate-100 ${className}`}>
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent" />
    </div>
  );
}

// ─── LOCK SCREEN ──────────────────────────────────────────────────────────────
function LockScreen({ onUnlock }: { onUnlock: () => void }) {
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");
  const [shaking, setShaking] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (user === "Nischal" && pass === "Xolox900") {
      localStorage.setItem("gh_admin_auth", "true");
      onUnlock();
    } else {
      setShaking(true);
      setTimeout(() => setShaking(false), 500);
      setErr("Invalid credentials");
      setPass("");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-indigo-200/50 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-64 h-64 bg-blue-200/50 rounded-full blur-3xl pointer-events-none" />
      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }} className="w-full max-w-sm">
        <div className="text-center mb-10">
          <motion.div initial={{ y: -8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="inline-flex flex-col items-center">
            <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-3xl flex items-center justify-center mb-5 shadow-xl shadow-indigo-200 relative">
              <div className="absolute inset-0 rounded-3xl bg-white/20 backdrop-blur-sm" />
              <Zap size={32} className="text-white relative z-10" />
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none">GyanHub</h1>
            <p className="text-slate-500 text-sm mt-2 font-bold tracking-widest uppercase text-[10px]">Command Center</p>
          </motion.div>
        </div>
        <motion.div animate={shaking ? { x: [0, -8, 8, -8, 8, 0] } : {}} transition={{ duration: 0.4 }} className="bg-white border border-slate-200 rounded-3xl p-8 shadow-xl shadow-slate-200/50">
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.15em] mb-2">Username</label>
              <input type="text" value={user} onChange={e => setUser(e.target.value)} autoFocus className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-slate-900 font-semibold text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all placeholder:text-slate-400" placeholder="Enter username" />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.15em] mb-2">Password</label>
              <input type="password" value={pass} onChange={e => setPass(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-slate-900 font-semibold text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all placeholder:text-slate-400" placeholder="Enter password" />
            </div>
            <AnimatePresence>
              {err && (
                <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="text-red-500 text-xs font-bold text-center flex items-center justify-center gap-1.5">
                  <AlertCircle size={12} />{err}
                </motion.p>
              )}
            </AnimatePresence>
            <button type="submit" className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-black py-4 rounded-2xl transition-all shadow-lg shadow-indigo-200 mt-2 text-sm tracking-wide">
              Access Dashboard
            </button>
          </form>
        </motion.div>
      </motion.div>
    </div>
  );
}

// ─── KPI CARD ─────────────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, color, icon: Icon, trend, sparkline }: { label: string; value: number | string; sub?: string; color: "indigo" | "emerald" | "red" | "amber"; icon: any; trend?: number; sparkline?: number[]; }) {
  const colorMap = {
    indigo: { bg: "bg-indigo-50", text: "text-indigo-600", glow: "shadow-indigo-100", border: "hover:border-indigo-300" },
    emerald: { bg: "bg-emerald-50", text: "text-emerald-600", glow: "shadow-emerald-100", border: "hover:border-emerald-300" },
    red: { bg: "bg-red-50", text: "text-red-600", glow: "shadow-red-100", border: "hover:border-red-300" },
    amber: { bg: "bg-amber-50", text: "text-amber-600", glow: "shadow-amber-100", border: "hover:border-amber-300" },
  };
  const c = colorMap[color];

  return (
    <motion.div whileHover={{ y: -2 }} className={`relative bg-white border border-slate-200 rounded-2xl p-5 overflow-hidden group transition-all duration-300 ${c.border} shadow-sm hover:shadow-md`}>
      <div className="flex items-start justify-between mb-4">
        <div className={`p-2.5 rounded-xl ${c.bg}`}><Icon size={16} className={c.text} /></div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 text-[11px] font-black px-2 py-1 rounded-lg ${trend >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"}`}>
            <ArrowUpRight size={11} className={trend < 0 ? "rotate-90" : ""} />{Math.abs(trend).toFixed(0)}%
          </div>
        )}
      </div>
      <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.12em] mb-1">{label}</p>
      <p className={`text-2xl font-black text-slate-900`}>
        {typeof value === "number" ? <AnimatedNumber value={value} prefix="Nrs " /> : value}
      </p>
      {sub && <p className="text-[11px] text-slate-500 mt-1.5 font-medium">{sub}</p>}
      {sparkline && sparkline.length > 0 && (
        <div className="mt-3 h-8">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sparkline.map((v, i) => ({ v, i }))}>
              <defs>
                <linearGradient id={`sp-${label}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color === "emerald" ? "#10b981" : color === "indigo" ? "#4f46e5" : color === "red" ? "#e11d48" : "#d97706"} stopOpacity={0.2} />
                  <stop offset="95%" stopColor="transparent" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="v" stroke={color === "emerald" ? "#10b981" : color === "indigo" ? "#4f46e5" : color === "red" ? "#e11d48" : "#d97706"} strokeWidth={1.5} fill={`url(#sp-${label})`} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </motion.div>
  );
}

// ─── CUSTOM TOOLTIP ───────────────────────────────────────────────────────────
const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-lg">
      <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-2">{label}</p>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2 text-sm font-bold">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-slate-600">{p.name}:</span>
          <span className="text-slate-900">{fc(p.value)}</span>
        </div>
      ))}
    </div>
  );
};

// ─── COMMAND PALETTE ──────────────────────────────────────────────────────────
function CommandPalette({ open, onClose, onNavigate }: { open: boolean; onClose: () => void; onNavigate: (s: string) => void }) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { if (open) { setQuery(""); setTimeout(() => inputRef.current?.focus(), 50); } }, [open]);

  const cmds = [
    { label: "Home Overview", icon: LayoutDashboard, action: () => onNavigate("home"), cat: "Navigate" },
    { label: "Finance Dashboard", icon: BarChart2, action: () => onNavigate("finance"), cat: "Navigate" },
    { label: "Inbox", icon: MessageSquare, action: () => onNavigate("inbox"), cat: "Navigate" },
    { label: "Add Transaction", icon: Plus, action: () => { onNavigate("finance"); onClose(); }, cat: "Finance" },
    { label: "Online Courses", icon: BookOpen, action: () => { window.location.href = "/admin/onlinecourse"; }, cat: "Manage" },
    { label: "Tuition Hub", icon: GraduationCap, action: () => { window.location.href = "/admin/tuition"; }, cat: "Manage" },
    { label: "Certificates", icon: Award, action: () => { window.location.href = "/admin/certificate"; }, cat: "Manage" },
    { label: "Website Orders", icon: ShoppingCart, action: () => { window.location.href = "/admin/orders"; }, cat: "Manage" },
  ].filter(c => !query || c.label.toLowerCase().includes(query.toLowerCase()) || c.cat.toLowerCase().includes(query.toLowerCase()));

  if (!open) return null;
  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-start justify-center pt-[20vh] px-4 bg-slate-900/40 backdrop-blur-sm" onClick={onClose}>
        <motion.div initial={{ scale: 0.96, y: -16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, opacity: 0 }} className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
          <div className="flex items-center gap-3 px-4 py-4 border-b border-slate-100">
            <Search size={16} className="text-slate-400" />
            <input ref={inputRef} value={query} onChange={e => setQuery(e.target.value)} placeholder="Search commands, pages, actions…" className="flex-1 bg-transparent text-slate-900 text-sm font-medium outline-none placeholder:text-slate-400" />
            <kbd className="text-[10px] text-slate-400 border border-slate-200 bg-slate-50 rounded px-1.5 py-0.5 font-mono">ESC</kbd>
          </div>
          <div className="max-h-72 overflow-y-auto">
            {cmds.length === 0 ? (
              <p className="text-center py-8 text-slate-500 text-sm">No commands found</p>
            ) : cmds.map((cmd, i) => (
              <button key={i} onClick={() => { cmd.action(); onClose(); }} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-left group">
                <div className="p-1.5 rounded-lg bg-slate-100 group-hover:bg-indigo-50 transition-colors">
                  <cmd.icon size={14} className="text-slate-500 group-hover:text-indigo-600 transition-colors" />
                </div>
                <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900 transition-colors flex-1">{cmd.label}</span>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{cmd.cat}</span>
              </button>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ─── MAIN DASHBOARD ───────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const supabase = createClient();
  const [isLocked, setIsLocked] = useState(true);
  const [activeSection, setActiveSection] = useState<"home" | "finance" | "inbox">("home");
  const [cmdOpen, setCmdOpen] = useState(false);

  // Data
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [syllabi, setSyllabi] = useState<Syllabus[]>([]);
  const [activeBatches, setActiveBatches] = useState<ActiveBatch[]>([]);
  const [ordersData, setOrdersData] = useState<OrderData[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [conversations, setConversations] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  // Finance
  const [earnRange, setEarnRange] = useState<7 | 30>(7);
  const [finTab, setFinTab] = useState<"overview" | "profitability" | "ledger">("overview");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [courseFilter, setCourseFilter] = useState("All");
  const [txTypeFilter, setTxTypeFilter] = useState<"All" | TransactionType>("All");
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Partial<Transaction>>({});
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedCourseModal, setSelectedCourseModal] = useState<string | null>(null);

  // Add form
  const [formDate, setFormDate] = useState(localDate(new Date()));
  const [formType, setFormType] = useState<TransactionType>("revenue");
  const [formSyllabus, setFormSyllabus] = useState("");
  const [formBatch, setFormBatch] = useState("");
  const [isNewBatch, setIsNewBatch] = useState(false);
  const [formAmount, setFormAmount] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Inbox
  const [chatUser, setChatUser] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [editingMsgId, setEditingMsgId] = useState<string | null>(null);
  const [editMsgContent, setEditMsgContent] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Bulk CSV
  const [bulkCsvText, setBulkCsvText] = useState("");
  const [bulkRows, setBulkRows] = useState<any[]>([]);
  const [bulkUploading, setBulkUploading] = useState(false);

  // Command palette keyboard
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); setCmdOpen(v => !v); }
      if (e.key === "Escape") setCmdOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    const auth = localStorage.getItem("gh_admin_auth");
    if (auth === "true") setIsLocked(false);
  }, []);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [txRes, sylRes, batchRes, ordRes, appRes, reqRes, msgRes] = await Promise.all([
      supabase.from("finance_transactions").select("*").order("course_date", { ascending: false }),
      supabase.from("syllabi_v2").select("id,name").order("name"),
      supabase.from("course_batches_v2").select("id,syllabus_id,course_name,batch_no,start_datetime,timing,online_class_link,whatsapp_group_link,google_classroom_link").eq("is_active", true).order("start_datetime", { ascending: false }),
      supabase.from("orders_v2").select("id,full_name,order_name,pending_amount,paid_amount,status,created_at,updated_at").order("updated_at", { ascending: false }),
      supabase.from("vacancy_applications").select("id,applicant_name,created_at,vacancy_id,vacancies(subject)").order("id", { ascending: false }).limit(20),
      supabase.from("student_requests").select("id,student_name,created_at").order("id", { ascending: false }).limit(20),
      supabase.from("messages").select("*").order("created_at", { ascending: false }),
    ]);

    if (txRes.data) setTransactions(txRes.data as any);
    if (sylRes.data) setSyllabi(sylRes.data);
    if (batchRes.data) setActiveBatches(batchRes.data);
    if (ordRes.data) setOrdersData(ordRes.data as any);

    const cutoff = Date.now() - 86400000;
    const acts: RecentActivity[] = [
      ...(appRes.data || []).filter((a: any) => new Date(a.created_at).getTime() > cutoff).map((a: any) => ({
        id: `app-${a.id}`, type: "application" as const, name: a.applicant_name,
        sub: `Applied for ${(a.vacancies as any)?.subject || "vacancy"}`, created_at: a.created_at
      })),
      ...(reqRes.data || []).filter((r: any) => new Date(r.created_at).getTime() > cutoff).map((r: any) => ({
        id: `req-${r.id}`, type: "request" as const, name: r.student_name, sub: "Sent tuition request", created_at: r.created_at
      })),
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    setRecentActivity(acts);

    if (msgRes.data) {
      const userIds = [...new Set(msgRes.data.map((m: any) => m.user_id))].filter(Boolean);
      let profileMap: Record<string, any> = {};
      if (userIds.length > 0) {
        const { data: profiles } = await supabase.from("profiles").select("id,full_name,avatar_url").in("id", userIds);
        if (profiles) profiles.forEach((p: any) => { profileMap[p.id] = p; });
      }
      const unread: Record<string, number> = {};
      for (const m of msgRes.data) {
        if (m.sender_role === "user" && m.is_read === false) unread[m.user_id] = (unread[m.user_id] || 0) + 1;
      }
      const seen = new Set();
      const convos: Message[] = [];
      for (const m of msgRes.data) {
        if (!seen.has(m.user_id)) { seen.add(m.user_id); convos.push({ ...m, is_read: !(unread[m.user_id] > 0), profiles: profileMap[m.user_id] }); }
      }
      setConversations(convos);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    if (!isLocked) {
      fetchAll();
      const ch = supabase.channel("dash-realtime")
        .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, fetchAll)
        .on("postgres_changes", { event: "*", schema: "public", table: "orders_v2" }, fetchAll)
        .on("postgres_changes", { event: "*", schema: "public", table: "vacancy_applications" }, fetchAll)
        .on("postgres_changes", { event: "*", schema: "public", table: "student_requests" }, fetchAll)
        .subscribe();
      return () => { supabase.removeChannel(ch); };
    }
  }, [isLocked, fetchAll]);

  // Orders Computed
  const pendingOrders = useMemo(() => {
    return ordersData
      .filter(o => Number(o.pending_amount) > 0)
      .sort((a, b) => sortDate(a.updated_at, b.updated_at));
  }, [ordersData]);

  // Finance computed
  const filteredTx = useMemo(() => transactions.filter(tx => {
    const d = new Date(tx.course_date);
    return (startDate ? d >= new Date(startDate) : true)
      && (endDate ? d <= new Date(endDate) : true)
      && (courseFilter === "All" ? true : tx.syllabi_v2?.name === courseFilter)
      && (txTypeFilter === "All" ? true : tx.transaction_type === txTypeFilter);
  }), [transactions, startDate, endDate, courseFilter, txTypeFilter]);

  const availableCourses = useMemo(() => {
    const s = new Set<string>();
    transactions.forEach(t => { if (t.syllabi_v2?.name) s.add(t.syllabi_v2.name); });
    return Array.from(s).sort();
  }, [transactions]);

  const kpis = useMemo(() => {
    let rev = 0, tutExp = 0, mktExp = 0;
    const monthMap: Record<string, { rev: number; exp: number }> = {};
    const courseMap: Record<string, { rev: number; tut: number; mkt: number; batches: Record<string, any> }> = {};

    filteredTx.forEach(tx => {
      const val = Number(tx.amount);
      const month = tx.course_date.substring(0, 7);
      const name = tx.syllabi_v2?.name || "Unknown";
      const batch = tx.batch_name || "General";
      if (!monthMap[month]) monthMap[month] = { rev: 0, exp: 0 };
      if (!courseMap[name]) courseMap[name] = { rev: 0, tut: 0, mkt: 0, batches: {} };
      if (!courseMap[name].batches[batch]) courseMap[name].batches[batch] = { rev: 0, tut: 0, mkt: 0 };
      if (tx.transaction_type === "revenue") {
        rev += val; monthMap[month].rev += val; courseMap[name].rev += val; courseMap[name].batches[batch].rev += val;
      } else if (tx.transaction_type === "tutor_payment") {
        tutExp += val; monthMap[month].exp += val; courseMap[name].tut += val; courseMap[name].batches[batch].tut += val;
      } else {
        mktExp += val; monthMap[month].exp += val; courseMap[name].mkt += val; courseMap[name].batches[batch].mkt += val;
      }
    });

    const totalExp = tutExp + mktExp;
    const netProfit = rev - totalExp;
    const margin = safeDiv(netProfit, rev) * 100;
    const roi = safeDiv(rev - mktExp, mktExp) * 100;

    const courses = Object.entries(courseMap).map(([name, d]) => {
      const profit = d.rev - (d.tut + d.mkt);
      const margin = safeDiv(profit, d.rev) * 100;
      const batchList = Object.entries(d.batches).map(([bName, bd]) => {
        const bp = bd.rev - (bd.tut + bd.mkt);
        return { name: bName, rev: bd.rev, tut: bd.tut, mkt: bd.mkt, profit: bp, margin: safeDiv(bp, bd.rev) * 100 };
      }).sort((a, b) => b.profit - a.profit);
      let health = "Good";
      if (margin > 40 && safeDiv(d.rev - d.mkt, d.mkt) * 100 > 200) health = "Excellent";
      if (margin < 10) health = "Poor";
      if (profit < 0) health = "Critical";
      return { name, revenue: d.rev, tutorCost: d.tut, marketingCost: d.mkt, profit, margin, batchCount: batchList.length, batchList, health };
    }).sort((a, b) => b.profit - a.profit);

    const chartData = Object.entries(monthMap).sort(([a], [b]) => a.localeCompare(b)).map(([month, d]) => ({
      name: month.substring(5), Revenue: d.rev, Expenses: d.exp, Profit: d.rev - d.exp
    }));

    const sparkline = Object.entries(monthMap).sort(([a], [b]) => a.localeCompare(b)).slice(-6).map(([, d]) => d.rev);

    return { rev, tutExp, mktExp, totalExp, netProfit, margin, roi, courses, chartData, sparkline };
  }, [filteredTx]);

  // Trace today's earning strictly from verified updated orders
  const earningToday = useMemo(() => {
    const today = localDate(new Date());
    return ordersData
      .filter(o => {
        const dateToUse = o.updated_at ? new Date(o.updated_at) : new Date(o.created_at);
        return localDate(dateToUse) === today && o.status === "verified";
      })
      .reduce((sum, o) => sum + Number(o.paid_amount || 0), 0);
  }, [ordersData]);

  // Trace recent earning range strictly from verified updated orders
  const earningRange = useMemo(() => {
    const cutoff = new Date(); 
    cutoff.setDate(cutoff.getDate() - earnRange);
    const cutoffStr = localDate(cutoff);
    return ordersData
      .filter(o => {
        const dateToUse = o.updated_at ? new Date(o.updated_at) : new Date(o.created_at);
        return localDate(dateToUse) >= cutoffStr && o.status === "verified";
      })
      .reduce((sum, o) => sum + Number(o.paid_amount || 0), 0);
  }, [ordersData, earnRange]);

  // Compute latest batch directly from finance transactions table
  const latestBatchInfo = useMemo(() => {
    const latest = transactions.find(t => t.batch_name && t.syllabus_id);
    if (!latest) return null;
    const batchTx = transactions.filter(t => t.syllabus_id === latest.syllabus_id && t.batch_name === latest.batch_name);
    const collected = batchTx.filter(t => t.transaction_type === "revenue").reduce((s, t) => s + Number(t.amount), 0);
    const expenses = batchTx.filter(t => t.transaction_type !== "revenue").reduce((s, t) => s + Number(t.amount), 0);
    const name = latest.syllabi_v2?.name || "Latest Course";
    return { name: `${name} (${latest.batch_name})`, collected, profit: collected - expenses };
  }, [transactions]);

  const availableBatchesForCourse = useMemo(() => {
    if (!formSyllabus) return [];
    return activeBatches.filter(b => b.syllabus_id === Number(formSyllabus));
  }, [formSyllabus, activeBatches]);

  // Inbox handlers
  const openChat = async (userId: string) => {
    setChatUser(userId);
    const { data } = await supabase.from("messages").select("*").eq("user_id", userId).order("created_at", { ascending: true });
    if (data) setChatMessages(data);
    await supabase.from("messages").update({ is_read: true }).eq("user_id", userId).eq("sender_role", "user");
    fetchAll();
  };

  const sendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !chatUser) return;
    const { data } = await supabase.from("messages").insert([{ user_id: chatUser, sender_role: "admin", content: chatInput.trim() }]).select().single();
    if (data) { setChatMessages(prev => [...prev, data as any]); setChatInput(""); }
  };

  const handleEditMsg = async (msgId: string) => {
    if (!editMsgContent.trim()) return;
    await supabase.from("messages").update({ content: editMsgContent.trim(), updated_at: new Date().toISOString() }).eq("id", msgId);
    setChatMessages(prev => prev.map(m => m.id === msgId ? { ...m, content: editMsgContent.trim() } : m));
    setEditingMsgId(null);
    setEditMsgContent("");
  };

  const handleDeleteMsg = async (msgId: string) => {
    if (!confirm("Delete this message?")) return;
    await supabase.from("messages").delete().eq("id", msgId);
    setChatMessages(prev => prev.filter(m => m.id !== msgId));
  };

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chatMessages]);

  // Finance handlers
  const setQuickDate = (days: number) => {
    const end = new Date(); const start = new Date();
    start.setDate(start.getDate() - days);
    setEndDate(localDate(end)); setStartDate(localDate(start));
  };

  const handleAddTx = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formAmount || Number(formAmount) <= 0) return alert("Amount must be > 0");
    setIsSubmitting(true);
    await supabase.from("finance_transactions").insert({
      course_date: formDate, transaction_type: formType,
      syllabus_id: formSyllabus ? parseInt(formSyllabus) : null,
      batch_name: formBatch || null, amount: Number(formAmount), notes: formNotes || null
    });
    setAddModalOpen(false); setFormAmount(""); setFormNotes(""); setFormBatch(""); setIsNewBatch(false);
    setIsSubmitting(false); fetchAll();
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;
    setIsUpdating(true);
    await supabase.from("finance_transactions").update({
      course_date: editForm.course_date, transaction_type: editForm.transaction_type,
      syllabus_id: editForm.syllabus_id ? Number(editForm.syllabus_id) : null,
      batch_name: editForm.batch_name?.trim() || null, amount: Number(editForm.amount), notes: editForm.notes?.trim() || null
    }).eq("id", editingId);
    setEditingId(null); setIsUpdating(false); fetchAll();
  };

  const handleDeleteTx = async (id: number) => {
    if (!confirm("Delete this transaction?")) return;
    await supabase.from("finance_transactions").delete().eq("id", id);
    fetchAll();
  };

  // Bulk CSV
  const parseBulkCsv = () => {
    const lines = bulkCsvText.trim().split("\n").map(l => l.trim()).filter(Boolean);
    if (lines.length < 2) return alert("Add header + data rows");
    const headers = lines[0].split(",").map(h => h.trim().toLowerCase());
    const rows = lines.slice(1).map(line => {
      const vals = line.split(",").map(v => v.trim().replace(/"/g, ""));
      const row: any = {};
      headers.forEach((h, i) => { row[h] = vals[i] || ""; });
      const errors: string[] = [];
      if (!row.name) errors.push("Name required");
      if (!row.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) errors.push("Valid email required");
      if (!row.syllabus_id || isNaN(Number(row.syllabus_id))) errors.push("syllabus_id must be a number");
      if (!row.issue_date) errors.push("issue_date required");
      return { ...row, errors, isValid: errors.length === 0 };
    });
    setBulkRows(rows);
  };

  const submitBulkCerts = async () => {
    const valid = bulkRows.filter(r => r.isValid);
    if (!valid.length) return alert("No valid rows");
    setBulkUploading(true);
    const res = await fetch("/api/certificate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ students: valid.map(r => ({ name: r.name, email: r.email, syllabus_id: Number(r.syllabus_id), issue_date: r.issue_date })) })
    });
    setBulkUploading(false);
    if (res.ok) { const d = await res.json(); alert(`${d.count || valid.length} certificate(s) created!`); setBulkRows([]); setBulkCsvText(""); }
    else alert("Certificate creation failed");
  };

  const unreadCount = conversations.filter(c => !c.is_read).length;
  const selectedCourseData = kpis.courses.find(c => c.name === selectedCourseModal);

  const navItems = [
    { id: "home", label: "Overview", icon: LayoutDashboard },
    { id: "finance", label: "Finance", icon: BarChart2 },
    { id: "inbox", label: "Messages", icon: MessageSquare, badge: unreadCount },
  ];

  const quickLinks = [
    { label: "Online Courses", icon: BookOpen, href: "/admin/onlinecourse", color: "#4f46e5" },
    { label: "Tuition Hub", icon: GraduationCap, href: "/admin/tuition", color: "#7c3aed" },
    { label: "Certificates", icon: Award, href: "/admin/certificate", color: "#d97706" },
    { label: "Orders", icon: ShoppingCart, href: "/admin/orders", color: "#059669" },
  ];

  // AI Insight Engine
  const aiInsights = useMemo(() => {
    const ins: string[] = [];
    if (kpis.courses[0]) ins.push(`${kpis.courses[0].name} leads with ${fc(kpis.courses[0].profit)} net profit (${kpis.courses[0].margin.toFixed(0)}% margin).`);
    if (kpis.margin < 10 && kpis.rev > 0) ins.push("Margins below 10% — review tutor cost structure urgently.");
    else if (kpis.margin > 40) ins.push("Excellent margins above 40% — healthy fundamentals. Consider scaling marketing.");
    if (kpis.mktExp > 0) ins.push(`Marketing generates ${fc(Math.round(safeDiv(kpis.rev, kpis.mktExp)))} revenue per Nrs spent.`);
    if (pendingOrders.length > 3) ins.push(`${pendingOrders.length} overdue orders — recovery could unlock ${fc(pendingOrders.reduce((s, o) => s + o.pending_amount, 0))}.`);
    if (earningToday === 0) ins.push("No revenue recorded today. Check for pending transactions.");
    return ins.slice(0, 3);
  }, [kpis, pendingOrders, earningToday]);

  if (isLocked) return <LockScreen onUnlock={() => setIsLocked(false)} />;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      <style dangerouslySetInnerHTML={{ __html: `
        footer,.footer,header:not(.adm-hdr),nav:not(.adm-nav){display:none!important}
        @keyframes shimmer{0%{transform:translateX(-100%)}100%{transform:translateX(100%)}}
        ::-webkit-scrollbar{width:5px;height:5px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:#cbd5e1;border-radius:4px}
        ::-webkit-scrollbar-thumb:hover{background:#94a3b8}
        .noscroll::-webkit-scrollbar{display:none}
        select option{background:#ffffff;color:#0f172a}
      `}} />

      {/* Command Palette */}
      <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} onNavigate={(s) => { setActiveSection(s as any); setCmdOpen(false); }} />

      {/* ─── TOP NAVIGATION ─────────────────────────────────────────────────── */}
      <header className="adm-hdr sticky top-0 z-40 border-b border-slate-200" style={{ background: "rgba(255,255,255,0.85)", backdropFilter: "blur(24px)" }}>
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-4">
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl flex items-center justify-center shadow-md shadow-indigo-100">
              <Zap size={14} className="text-white" />
            </div>
            <span className="font-black text-[13px] tracking-tight text-slate-900">
              Gyan<span className="text-indigo-600">Hub</span>
            </span>
          </div>

          <nav className="adm-nav flex items-center gap-0.5 mx-auto">
            {navItems.map(item => (
              <button key={item.id} onClick={() => setActiveSection(item.id as any)}
                className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-[12px] font-bold transition-all ${
                  activeSection === item.id
                    ? "bg-slate-100 text-slate-900"
                    : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                }`}>
                <item.icon size={13} />
                <span className="hidden sm:block">{item.label}</span>
                {(item.badge ?? 0) > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full text-[9px] font-black flex items-center justify-center text-white shadow-md">
                    {(item.badge ?? 0) > 9 ? "9+" : item.badge}
                  </span>
                )}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-1.5 shrink-0">
            <button onClick={() => setCmdOpen(true)}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-all">
              <Search size={12} />
              <span>Search</span>
              <kbd className="border border-slate-200 rounded px-1 text-[9px] font-mono ml-1 bg-white">⌘K</kbd>
            </button>
            {loading && <Loader2 size={13} className="animate-spin text-slate-400" />}
            <button onClick={fetchAll} className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all" title="Refresh">
              <RefreshCw size={13} />
            </button>
            <button onClick={() => { localStorage.removeItem("gh_admin_auth"); setIsLocked(true); }}
              className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all" title="Lock">
              <Lock size={13} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-screen-xl mx-auto w-full px-4 sm:px-6 py-8">
        <AnimatePresence mode="wait">

          {/* ═══════════════════ HOME ═══════════════════════════════════════ */}
          {activeSection === "home" && (
            <motion.div key="home" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }} className="space-y-7">
              {/* HERO ROW: Revenue Intelligence */}
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
                <div className="lg:col-span-3 relative overflow-hidden bg-white border border-slate-200 rounded-2xl p-7 shadow-sm hover:shadow-md transition-shadow">
                  <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)" }} />
                  <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(139,92,246,0.05) 0%, transparent 70%)" }} />

                  <div className="relative">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.15em]">Revenue Intelligence</span>
                      </div>
                      <div className="flex items-center gap-1 bg-slate-50 border border-slate-100 rounded-xl p-1">
                        <button onClick={() => setEarnRange(7)} className={`px-3 py-1.5 rounded-lg text-[11px] font-black transition-all ${earnRange === 7 ? "bg-indigo-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-900"}`}>7d</button>
                        <button onClick={() => setEarnRange(30)} className={`px-3 py-1.5 rounded-lg text-[11px] font-black transition-all ${earnRange === 30 ? "bg-indigo-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-900"}`}>30d</button>
                      </div>
                    </div>

                    <div className="mb-6">
                      <p className="text-sm text-slate-500 font-medium mb-2">Today's Revenue</p>
                      <div className="text-5xl font-black text-slate-900 tracking-tight leading-none">
                        <span className="text-slate-400 text-2xl mr-1">Nrs</span>
                        <AnimatedNumber value={earningToday} />
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-6">
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase tracking-widest font-black mb-1">Last {earnRange} days</p>
                        <p className="text-lg font-black text-indigo-600">{fc(earningRange)}</p>
                      </div>
                      {latestBatchInfo && (
                        <>
                          <div className="w-px bg-slate-200 self-stretch" />
                          <div>
                            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-black mb-1">Latest Active Batch: {latestBatchInfo.name}</p>
                            <p className="text-lg font-black text-emerald-600">{fc(latestBatchInfo.profit)} profit</p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 flex flex-col shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-2 mb-5">
                    <div className="p-1.5 rounded-lg bg-indigo-50">
                      <BrainCircuit size={15} className="text-indigo-600" />
                    </div>
                    <p className="text-[11px] font-black text-slate-900 uppercase tracking-widest">AI Insights</p>
                  </div>
                  <div className="space-y-3 flex-1">
                    {loading ? (
                      <>
                        <Skeleton className="h-16" />
                        <Skeleton className="h-16" />
                      </>
                    ) : aiInsights.length === 0 ? (
                      <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">Add transactions to see insights</div>
                    ) : aiInsights.map((ins, i) => (
                      <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                        className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 text-[12px] text-slate-600 leading-relaxed">
                        <div className="flex gap-2">
                          <div className="w-1 h-1 mt-1.5 bg-indigo-500 rounded-full shrink-0" />
                          {ins}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                  <button onClick={() => setActiveSection("finance")} className="mt-4 flex items-center gap-2 text-[11px] font-black text-indigo-600 hover:text-indigo-700 transition-colors group">
                    Full Financial Report <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>
              </div>

              {/* QUICK ACCESS */}
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-4">Quick Access</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {quickLinks.map(link => (
                    <motion.a key={link.href} href={link.href} whileHover={{ y: -3 }}
                      className="group relative bg-white border border-slate-200 rounded-2xl p-5 hover:border-slate-300 transition-all duration-300 no-underline block overflow-hidden shadow-sm hover:shadow-md">
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" style={{ background: `radial-gradient(circle at 50% 0%, ${link.color}10 0%, transparent 70%)` }} />
                      <div className="relative">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-colors" style={{ backgroundColor: `${link.color}15` }}>
                          <link.icon size={18} style={{ color: link.color }} />
                        </div>
                        <p className="text-sm font-black text-slate-900 mb-1">{link.label}</p>
                        <p className="text-[10px] text-slate-500 font-medium flex items-center gap-1">
                          Open <ExternalLink size={9} className="group-hover:text-indigo-600 transition-colors" />
                        </p>
                      </div>
                    </motion.a>
                  ))}
                </div>
              </div>

              {/* 3-COL INTEL */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Active Batches */}
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                  <div className="px-5 py-4 flex items-center justify-between border-b border-slate-100 bg-slate-50/50">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse" />
                      <p className="text-[11px] font-black text-slate-900 uppercase tracking-wider">Live Batches</p>
                    </div>
                    <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-black">{activeBatches.length}</span>
                  </div>
                  <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto noscroll">
                    {loading ? (
                      <div className="p-4 space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-14" />)}</div>
                    ) : activeBatches.length === 0 ? (
                      <div className="py-12 text-center">
                        <Globe size={24} className="mx-auto mb-2 text-slate-300" />
                        <p className="text-slate-500 text-xs">No active batches</p>
                      </div>
                    ) : activeBatches.map(b => (
                      <div key={b.id} className="px-5 py-4 hover:bg-slate-50 transition-colors">
                        <div className="flex items-start gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-bold text-slate-900 truncate">{b.course_name}</p>
                            <p className="text-[11px] text-indigo-600 font-bold mt-0.5">Batch #{b.batch_no}</p>
                            {b.start_datetime && (
                              <p className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1">
                                <Calendar size={8} />{new Date(b.start_datetime).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                          <div className="flex flex-col gap-1">
                            {b.online_class_link && <a href={b.online_class_link} target="_blank" rel="noreferrer" className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors" title="Class Link"><ExternalLink size={11} /></a>}
                            {b.whatsapp_group_link && <a href={b.whatsapp_group_link} target="_blank" rel="noreferrer" className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-colors" title="WhatsApp"><MessageCircle size={11} /></a>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                  <div className="px-5 py-4 flex items-center justify-between border-b border-slate-100 bg-slate-50/50">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
                      <p className="text-[11px] font-black text-slate-900 uppercase tracking-wider">24h Activity</p>
                    </div>
                    <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-black">{recentActivity.length} new</span>
                  </div>
                  <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto noscroll">
                    {recentActivity.length === 0 ? (
                      <div className="py-12 text-center">
                        <CheckCircle size={24} className="mx-auto mb-2 text-slate-300" />
                        <p className="text-slate-500 text-xs">All quiet</p>
                      </div>
                    ) : recentActivity.map(a => (
                      <div key={a.id} className="px-5 py-3.5 hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-xl ${a.type === "application" ? "bg-blue-50" : "bg-violet-50"}`}>
                            {a.type === "application" ? <FileText size={12} className="text-blue-600" /> : <MessageSquare size={12} className="text-violet-600" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-bold text-slate-900 truncate">{a.name}</p>
                            <p className="text-[11px] text-slate-500 truncate">{a.sub}</p>
                          </div>
                          <span className="text-[10px] text-slate-400 shrink-0">{timeAgo(a.created_at)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Pending Orders */}
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                  <div className="px-5 py-4 flex items-center justify-between border-b border-slate-100 bg-slate-50/50">
                    <div className="flex items-center gap-2">
                      {pendingOrders.length > 0 && <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse" />}
                      <p className="text-[11px] font-black text-slate-900 uppercase tracking-wider">Pending Orders</p>
                    </div>
                    {pendingOrders.length > 0 && (
                      <span className="text-[10px] font-black bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full border border-orange-200">
                        {pendingOrders.length} pending
                      </span>
                    )}
                  </div>
                  <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto noscroll">
                    {pendingOrders.length === 0 ? (
                      <div className="py-12 text-center">
                        <CheckCircle size={24} className="mx-auto mb-2 text-emerald-200" />
                        <p className="text-slate-500 text-xs">All orders clear</p>
                      </div>
                    ) : pendingOrders.map(o => (
                      <div key={o.id} className="px-5 py-4 hover:bg-slate-50 transition-colors">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-bold text-slate-900 truncate">{o.full_name}</p>
                            <p className="text-[11px] text-slate-500 truncate">{o.order_name}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">Updated {timeAgo(o.updated_at || o.created_at)}</p>
                          </div>
                          <div className="shrink-0 text-right">
                            <p className="text-sm font-black text-orange-600">Rs.{fcs(o.pending_amount)}</p>
                            <a href="/admin/orders" className="text-[10px] text-indigo-600 hover:text-indigo-700 transition-colors">Review →</a>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* BULK CERTIFICATE PANEL */}
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 bg-amber-50 rounded-lg">
                      <Award size={14} className="text-amber-600" />
                    </div>
                    <p className="text-[11px] font-black text-slate-900 uppercase tracking-wider">Bulk Certificate Issuance</p>
                  </div>
                  <a href="/admin/certificate" className="flex items-center gap-1 text-[11px] text-indigo-600 hover:text-indigo-700 font-bold transition-colors">
                    Full Registry <ExternalLink size={10} />
                  </a>
                </div>
                <div className="p-6">
                  <p className="text-[11px] text-slate-500 mb-3 font-mono">name, email, syllabus_id, issue_date</p>
                  <textarea value={bulkCsvText} onChange={e => setBulkCsvText(e.target.value)}
                    placeholder={"name,email,syllabus_id,issue_date\nJohn Doe,john@example.com,5,2025-06-01"}
                    rows={4}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 font-mono outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all resize-none placeholder:text-slate-400" />
                  <div className="flex items-center gap-3 mt-3">
                    <button onClick={parseBulkCsv} className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 transition-colors shadow-sm">Parse CSV</button>
                    {bulkRows.length > 0 && (
                      <>
                        <span className="text-xs text-slate-500">{bulkRows.filter(r => r.isValid).length}/{bulkRows.length} valid</span>
                        <button onClick={submitBulkCerts} disabled={bulkUploading || !bulkRows.some(r => r.isValid)}
                          className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-black disabled:opacity-50 transition-colors flex items-center gap-2 shadow-sm">
                          {bulkUploading ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
                          Generate {bulkRows.filter(r => r.isValid).length} Certs
                        </button>
                      </>
                    )}
                  </div>
                  {bulkRows.length > 0 && (
                    <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50">
                          <tr>{["Status", "Name", "Email", "Syllabus ID", "Issue Date", "Errors"].map(h => (
                            <th key={h} className="px-3 py-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">{h}</th>
                          ))}</tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                          {bulkRows.slice(0, 8).map((row, i) => (
                            <tr key={i} className="hover:bg-slate-50">
                              <td className="px-3 py-2">{row.isValid ? <CheckCircle size={13} className="text-emerald-500" /> : <AlertCircle size={13} className="text-red-500" />}</td>
                              <td className="px-3 py-2 text-slate-800">{row.name}</td>
                              <td className="px-3 py-2 text-slate-500">{row.email}</td>
                              <td className="px-3 py-2 text-slate-500">{row.syllabus_id}</td>
                              <td className="px-3 py-2 text-slate-500">{row.issue_date}</td>
                              <td className="px-3 py-2 text-red-500 text-[10px]">{row.errors.join(", ") || "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {bulkRows.length > 8 && <p className="text-center py-2 text-[11px] text-slate-400 bg-white border-t border-slate-100">+{bulkRows.length - 8} more</p>}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* ═══════════════════ FINANCE ════════════════════════════════════ */}
          {activeSection === "finance" && (
            <motion.div key="finance" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }} className="space-y-6">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h2 className="text-2xl font-black text-slate-900">Finance</h2>
                  <p className="text-slate-500 text-sm mt-0.5">Revenue, expenses, profitability</p>
                </div>
                <button onClick={() => setAddModalOpen(true)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold transition-all shadow-md shadow-indigo-200">
                  <Plus size={14} /> Add Transaction
                </button>
              </div>

              {/* Filters */}
              <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-4 flex flex-wrap items-center gap-3">
                <Filter size={12} className="text-slate-400" />
                <div className="flex gap-1.5">
                  {[7, 15, 30].map(d => (
                    <button key={d} onClick={() => setQuickDate(d)}
                      className="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-slate-50 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 transition-colors border border-slate-100">
                      {d}d
                    </button>
                  ))}
                </div>
                <div className="w-px h-5 bg-slate-200" />
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                  className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-600 outline-none focus:border-indigo-500 transition-colors" />
                <span className="text-slate-400 text-xs">→</span>
                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                  className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-600 outline-none focus:border-indigo-500 transition-colors" />
                
                <select value={courseFilter} onChange={e => setCourseFilter(e.target.value)}
                  className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-600 outline-none focus:border-indigo-500 transition-colors cursor-pointer">
                  <option value="All">All Courses</option>
                  {availableCourses.map(c => <option key={c} value={c}>{c}</option>)}
                </select>

                <select value={txTypeFilter} onChange={e => setTxTypeFilter(e.target.value as any)}
                  className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-600 outline-none focus:border-indigo-500 transition-colors cursor-pointer">
                  <option value="All">All Types</option>
                  <option value="revenue">Revenue</option>
                  <option value="tutor_payment">Tutor Payment</option>
                  <option value="marketing_expense">Marketing Expense</option>
                </select>

                {(startDate || endDate || courseFilter !== "All" || txTypeFilter !== "All") && (
                  <button onClick={() => { setStartDate(""); setEndDate(""); setCourseFilter("All"); setTxTypeFilter("All"); }}
                    className="text-[11px] text-red-500 hover:text-red-600 font-bold transition-colors">Clear</button>
                )}
              </div>

              {/* KPI Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard label="Total Revenue" value={kpis.rev} icon={TrendingUp} color="emerald" sparkline={kpis.sparkline} />
                <KpiCard label="Total Expenses" value={kpis.totalExp} sub={`Tutor ${fc(kpis.tutExp)}`} icon={TrendingDown} color="red" />
                <KpiCard label="Net Profit" value={kpis.netProfit} sub={`${kpis.margin.toFixed(1)}% margin`} icon={DollarSign} color="indigo" />
                <KpiCard label="Marketing ROI" value={`${kpis.roi.toFixed(0)}%`} sub="Revenue per Nrs spent" icon={Target} color="amber" />
              </div>

              {/* Alert */}
              <AnimatePresence>
                {kpis.totalExp > kpis.rev && kpis.rev > 0 && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                    className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-600 text-sm">
                    <AlertCircle size={15} className="shrink-0" /> Operating at net loss in this period.
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Tabs */}
              <div className="flex gap-1 bg-slate-100/50 p-1 rounded-xl w-fit border border-slate-200">
                {(["overview", "profitability", "ledger"] as const).map(tab => (
                  <button key={tab} onClick={() => setFinTab(tab)}
                    className={`px-5 py-2 rounded-lg text-[11px] font-black capitalize transition-all ${finTab === tab ? "bg-white text-indigo-600 shadow-sm border border-slate-200/50" : "text-slate-500 hover:text-slate-900"}`}>
                    {tab}
                  </button>
                ))}
              </div>

              {/* OVERVIEW */}
              {finTab === "overview" && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                  <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.12em] mb-6">Revenue vs Expenses</p>
                    {kpis.chartData.length > 0 ? (
                      <div className="h-64">
                        <ResponsiveContainer>
                          <AreaChart data={kpis.chartData}>
                            <defs>
                              <linearGradient id="gRev" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                              </linearGradient>
                              <linearGradient id="gProfit" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.15} />
                                <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 11 }} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 11 }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                            <Tooltip content={<ChartTooltip />} />
                            <Legend wrapperStyle={{ fontSize: 11, color: "#64748b" }} />
                            <Area type="monotone" dataKey="Revenue" stroke="#10b981" strokeWidth={2} fill="url(#gRev)" dot={false} />
                            <Area type="monotone" dataKey="Expenses" stroke="#e11d48" strokeWidth={2} fill="none" dot={false} />
                            <Area type="monotone" dataKey="Profit" stroke="#4f46e5" strokeWidth={2} fill="url(#gProfit)" dot={false} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <div className="h-64 flex items-center justify-center text-slate-500 text-sm">No data for selected filters</div>
                    )}
                  </div>

                  <div className="space-y-4">
                    {/* Expense pie */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.12em] mb-4">Expense Split</p>
                      {kpis.tutExp > 0 || kpis.mktExp > 0 ? (
                        <div className="h-40">
                          <ResponsiveContainer>
                            <PieChart>
                              <Pie data={[{ name: "Tutor", value: kpis.tutExp }, { name: "Marketing", value: kpis.mktExp }]} innerRadius={40} outerRadius={62} paddingAngle={3} dataKey="value">
                                <Cell fill="#e11d48" /><Cell fill="#d97706" />
                              </Pie>
                              <Tooltip content={<ChartTooltip />} />
                              <Legend wrapperStyle={{ fontSize: 10, color: "#64748b" }} />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      ) : <div className="h-40 flex items-center justify-center text-slate-400 text-sm">No expense data</div>}
                    </div>

                    {/* Course ranking */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.12em] mb-4">Top Courses</p>
                      <div className="space-y-3">
                        {kpis.courses.slice(0, 4).map((c, i) => (
                          <div key={i} className="flex items-center gap-3">
                            <span className="text-[10px] font-black text-slate-400 w-4">{i + 1}</span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <p className="text-[11px] font-bold text-slate-800 truncate">{c.name}</p>
                                <p className="text-[10px] font-black text-indigo-600 shrink-0 ml-2">{c.margin.toFixed(0)}%</p>
                              </div>
                              <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                                <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(c.margin, 100)}%` }} transition={{ delay: i * 0.1, duration: 0.6 }}
                                  className="h-full rounded-full"
                                  style={{ background: c.margin >= 30 ? "#10b981" : c.margin > 0 ? "#f59e0b" : "#e11d48" }} />
                              </div>
                            </div>
                          </div>
                        ))}
                        {kpis.courses.length === 0 && <p className="text-slate-400 text-xs text-center py-2">No course data</p>}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* PROFITABILITY */}
              {finTab === "profitability" && (
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                  <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <p className="text-[11px] font-black text-slate-900 uppercase tracking-wider">Course ROI Analysis</p>
                    <p className="text-[10px] text-slate-500">Click row for batch breakdown</p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50">
                          {["Course", "Batches", "Revenue", "Tutor", "Marketing", "Net Profit", "Margin", "Health"].map(h => (
                            <th key={h} className="px-5 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {kpis.courses.map((c, i) => (
                          <motion.tr key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                            onClick={() => setSelectedCourseModal(c.name)}
                            className="hover:bg-slate-50 cursor-pointer transition-colors">
                            <td className="px-5 py-3.5 font-bold text-indigo-600">{c.name}</td>
                            <td className="px-5 py-3.5 text-slate-600">{c.batchCount}</td>
                            <td className="px-5 py-3.5 text-emerald-600 font-bold">{fc(c.revenue)}</td>
                            <td className="px-5 py-3.5 text-red-600">{fc(c.tutorCost)}</td>
                            <td className="px-5 py-3.5 text-amber-600">{fc(c.marketingCost)}</td>
                            <td className={`px-5 py-3.5 font-black ${c.profit >= 0 ? "text-indigo-600" : "text-red-600"}`}>{fc(c.profit)}</td>
                            <td className="px-5 py-3.5">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-black ${c.margin >= 30 ? "bg-emerald-100 text-emerald-700" : c.margin > 0 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}`}>
                                {c.margin.toFixed(1)}%
                              </span>
                            </td>
                            <td className="px-5 py-3.5">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                                c.health === "Excellent" ? "bg-emerald-100 text-emerald-700" :
                                c.health === "Good" ? "bg-indigo-100 text-indigo-700" :
                                c.health === "Poor" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"
                              }`}>{c.health}</span>
                            </td>
                          </motion.tr>
                        ))}
                        {kpis.courses.length === 0 && (
                          <tr><td colSpan={8} className="px-5 py-12 text-center text-slate-500 text-sm">No course data in this range</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* LEDGER */}
              {finTab === "ledger" && (
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                  <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
                    <p className="text-[11px] font-black text-slate-900 uppercase tracking-wider">Transaction Ledger</p>
                  </div>
                  <div className="overflow-x-auto max-h-[540px] overflow-y-auto noscroll">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 sticky top-0 z-10">
                        <tr className="border-b border-slate-200">
                          {["Date", "Type", "Course", "Batch", "Notes", "Amount", ""].map(h => (
                            <th key={h} className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredTx.map(tx => (
                          <tr key={tx.id} className={`hover:bg-slate-50 transition-colors ${editingId === tx.id ? "bg-indigo-50" : ""}`}>
                            <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                              {editingId === tx.id
                                ? <input type="date" value={editForm.course_date} onChange={e => setEditForm({ ...editForm, course_date: e.target.value })} className="bg-white border border-slate-300 rounded px-2 py-1 text-slate-900 text-xs outline-none focus:border-indigo-500 w-32" />
                                : tx.course_date}
                            </td>
                            <td className="px-4 py-3">
                              {editingId === tx.id
                                ? <select value={editForm.transaction_type} onChange={e => setEditForm({ ...editForm, transaction_type: e.target.value as TransactionType })} className="bg-white border border-slate-300 rounded px-2 py-1 text-slate-900 text-xs outline-none focus:border-indigo-500">
                                    <option value="revenue">Revenue</option><option value="tutor_payment">Tutor Payment</option><option value="marketing_expense">Marketing Expense</option>
                                  </select>
                                : <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${tx.transaction_type === "revenue" ? "bg-emerald-100 text-emerald-700" : tx.transaction_type === "tutor_payment" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>
                                    {tx.transaction_type === "revenue" ? "REV" : tx.transaction_type === "tutor_payment" ? "TUT" : "MKT"}
                                  </span>}
                            </td>
                            <td className="px-4 py-3 text-slate-700 font-medium">
                              {editingId === tx.id
                                ? <select value={editForm.syllabus_id || ""} onChange={e => setEditForm({ ...editForm, syllabus_id: e.target.value ? Number(e.target.value) : null })} className="bg-white border border-slate-300 rounded px-2 py-1 text-slate-900 text-xs outline-none focus:border-indigo-500">
                                    <option value="">None</option>{syllabi.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                  </select>
                                : tx.syllabi_v2?.name || <span className="text-slate-400">—</span>}
                            </td>
                            <td className="px-4 py-3 text-slate-600">
                              {editingId === tx.id
                                ? <input type="text" value={editForm.batch_name || ""} onChange={e => setEditForm({ ...editForm, batch_name: e.target.value })} className="bg-white border border-slate-300 rounded px-2 py-1 text-slate-900 text-xs outline-none focus:border-indigo-500 w-24" />
                                : tx.batch_name || <span className="text-slate-400">—</span>}
                            </td>
                            <td className="px-4 py-3 text-slate-600 max-w-xs">
                              {editingId === tx.id
                                ? <input type="text" value={editForm.notes || ""} onChange={e => setEditForm({ ...editForm, notes: e.target.value })} className="bg-white border border-slate-300 rounded px-2 py-1 text-slate-900 text-xs outline-none focus:border-indigo-500 w-32" />
                                : <span className="truncate block">{tx.notes || <span className="text-slate-400">—</span>}</span>}
                            </td>
                            <td className="px-4 py-3 font-black whitespace-nowrap">
                              {editingId === tx.id
                                ? <input type="number" value={editForm.amount} onChange={e => setEditForm({ ...editForm, amount: Number(e.target.value) })} className="bg-white border border-slate-300 rounded px-2 py-1 text-slate-900 text-xs outline-none focus:border-indigo-500 w-24 text-right" />
                                : <span className={tx.transaction_type === "revenue" ? "text-emerald-600" : "text-slate-700"}>
                                    {tx.transaction_type === "revenue" ? "+" : "–"}{fc(Number(tx.amount))}
                                  </span>}
                            </td>
                            <td className="px-4 py-3">
                              {editingId === tx.id ? (
                                <div className="flex gap-1">
                                  <button onClick={handleSaveEdit} disabled={isUpdating} className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition-colors disabled:opacity-50"><Check size={11} /></button>
                                  <button onClick={() => setEditingId(null)} className="p-1.5 bg-slate-200 text-slate-600 rounded-lg hover:bg-slate-300 transition-colors"><X size={11} /></button>
                                </div>
                              ) : (
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 hover:opacity-100 transition-opacity">
                                  <button onClick={() => { setEditingId(tx.id); setEditForm({ course_date: tx.course_date, transaction_type: tx.transaction_type, syllabus_id: tx.syllabus_id, batch_name: tx.batch_name || "", amount: tx.amount, notes: tx.notes || "" }); }}
                                    className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"><Pencil size={11} /></button>
                                  <button onClick={() => handleDeleteTx(tx.id)} className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={11} /></button>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                        {filteredTx.length === 0 && (
                          <tr><td colSpan={7} className="px-5 py-12 text-center text-slate-500 text-sm">No transactions in selected range</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Batch Modal */}
              <AnimatePresence>
                {selectedCourseModal && selectedCourseData && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
                    onClick={() => setSelectedCourseModal(null)}>
                    <motion.div initial={{ scale: 0.96, y: 12 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, opacity: 0 }}
                      className="bg-white border border-slate-200 rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl"
                      onClick={e => e.stopPropagation()}>
                      <div className="px-6 py-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between shrink-0">
                        <div>
                          <h3 className="font-black text-slate-900">{selectedCourseData.name}</h3>
                          <p className="text-xs text-slate-500 mt-0.5">Batch-level profitability</p>
                        </div>
                        <button onClick={() => setSelectedCourseModal(null)} className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-200 rounded-xl transition-colors"><X size={15} /></button>
                      </div>
                      <div className="overflow-y-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-100 sticky top-0">
                            <tr>{["Batch", "Revenue", "Tutor", "Marketing", "Profit", "Margin"].map(h => (
                              <th key={h} className="px-5 py-3 text-[10px] font-black text-slate-500 uppercase">{h}</th>
                            ))}</tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {selectedCourseData.batchList.map((b, i) => (
                              <tr key={i} className="hover:bg-slate-50">
                                <td className="px-5 py-3 font-bold text-slate-800">{b.name}</td>
                                <td className="px-5 py-3 text-emerald-600">{fc(b.rev)}</td>
                                <td className="px-5 py-3 text-red-600">{fc(b.tut)}</td>
                                <td className="px-5 py-3 text-amber-600">{fc(b.mkt)}</td>
                                <td className={`px-5 py-3 font-black ${b.profit >= 0 ? "text-indigo-600" : "text-red-600"}`}>{fc(b.profit)}</td>
                                <td className="px-5 py-3">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-black ${b.margin >= 30 ? "bg-emerald-100 text-emerald-700" : b.margin > 0 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}`}>
                                    {b.margin.toFixed(1)}%
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Add Modal */}
              <AnimatePresence>
                {addModalOpen && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
                    onClick={() => setAddModalOpen(false)}>
                    <motion.div initial={{ scale: 0.96, y: 12 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, opacity: 0 }}
                      className="bg-white border border-slate-200 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl"
                      onClick={e => e.stopPropagation()}>
                      <div className="px-6 py-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                        <h3 className="font-black text-slate-900">Add Transaction</h3>
                        <button onClick={() => setAddModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-200 rounded-xl transition-colors"><X size={15} /></button>
                      </div>
                      <form onSubmit={handleAddTx} className="p-6 space-y-4">
                        <div>
                          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.12em] mb-1.5">Date</label>
                          <input type="date" required value={formDate} onChange={e => setFormDate(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.12em] mb-1.5">Type</label>
                          <select value={formType} onChange={e => setFormType(e.target.value as TransactionType)}
                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all cursor-pointer">
                            <option value="revenue">Revenue</option>
                            <option value="tutor_payment">Tutor Payment</option>
                            <option value="marketing_expense">Marketing Expense</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.12em] mb-1.5">Course (Optional)</label>
                          <select value={formSyllabus} onChange={e => {
                              setFormSyllabus(e.target.value);
                              setFormBatch(""); 
                              setIsNewBatch(false);
                            }}
                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all cursor-pointer">
                            <option value="">No Course</option>
                            {syllabi.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                          </select>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.12em] mb-1.5">Batch</label>
                            {isNewBatch ? (
                              <div className="flex gap-2">
                                <input type="text" placeholder="e.g. Batch-4" value={formBatch} onChange={e => setFormBatch(e.target.value)}
                                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-400" autoFocus />
                                <button type="button" onClick={() => { setIsNewBatch(false); setFormBatch(""); }} className="p-2 text-slate-400 hover:text-red-500 transition-colors"><X size={15} /></button>
                              </div>
                            ) : (
                              <select value={formBatch} onChange={e => {
                                  if (e.target.value === "NEW") { setIsNewBatch(true); setFormBatch(""); }
                                  else setFormBatch(e.target.value);
                                }}
                                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all cursor-pointer">
                                <option value="">Select Batch...</option>
                                {availableBatchesForCourse.map(b => (
                                  <option key={b.id} value={`Batch-${b.batch_no}`}>Batch-{b.batch_no}</option>
                                ))}
                                <option value="NEW">+ Add New Batch</option>
                              </select>
                            )}
                          </div>
                          <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.12em] mb-1.5">Amount (Nrs) *</label>
                            <input type="number" required min="1" placeholder="0" value={formAmount} onChange={e => setFormAmount(e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-400" />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.12em] mb-1.5">Notes</label>
                          <textarea rows={2} placeholder="Optional details…" value={formNotes} onChange={e => setFormNotes(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all resize-none placeholder:text-slate-400" />
                        </div>
                        <div className="flex gap-3 pt-1">
                          <button type="button" onClick={() => setAddModalOpen(false)} className="flex-1 py-3 text-sm font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">Cancel</button>
                          <button type="submit" disabled={isSubmitting} className="flex-1 py-3 text-sm font-black text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm">
                            {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : null} Save
                          </button>
                        </div>
                      </form>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* ═══════════════════ INBOX ══════════════════════════════════════ */}
          {activeSection === "inbox" && (
            <motion.div key="inbox" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }} className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black text-slate-900">Messages</h2>
                  <p className="text-slate-500 text-sm mt-0.5">User conversations</p>
                </div>
                {unreadCount > 0 && (
                  <span className="px-3 py-1.5 bg-red-100 border border-red-200 text-red-600 text-xs font-black rounded-full shadow-sm">{unreadCount} unread</span>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 h-[640px]">
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col shadow-sm">
                  <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.12em]">Conversations</p>
                  </div>
                  <div className="flex-1 overflow-y-auto noscroll divide-y divide-slate-100">
                    {conversations.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2">
                        <Inbox size={28} className="opacity-40" />
                        <p className="text-sm">No messages yet</p>
                      </div>
                    ) : conversations.map(conv => {
                      const name = conv.profiles?.full_name || "Unknown";
                      const isUnread = !conv.is_read;
                      return (
                        <button key={conv.id} onClick={() => openChat(conv.user_id)}
                          className={`w-full text-left px-4 py-4 hover:bg-slate-50 transition-colors relative flex items-start gap-3 ${chatUser === conv.user_id ? "bg-indigo-50 border-l-2 border-indigo-600" : ""}`}>
                          {isUnread && <div className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-red-500 rounded-full" />}
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-100 to-blue-100 border border-indigo-200 flex items-center justify-center text-[12px] font-black text-indigo-700 shrink-0 overflow-hidden">
                            {conv.profiles?.avatar_url ? <img src={conv.profiles.avatar_url} className="w-full h-full object-cover" alt="" /> : name.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1 mb-0.5">
                              <p className={`text-[13px] font-bold truncate ${isUnread ? "text-slate-900" : "text-slate-600"}`}>{name}</p>
                              <span className="text-[10px] text-slate-400 shrink-0">{timeAgo(conv.created_at)}</span>
                            </div>
                            <p className={`text-[11px] truncate ${isUnread ? "text-slate-600" : "text-slate-400"}`}>
                              {conv.sender_role === "admin" && <span className="text-indigo-600 font-medium">You: </span>}{conv.content}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col shadow-sm">
                  {!chatUser ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-3">
                      <MessageSquare size={48} className="opacity-20" />
                      <p className="text-sm">Select a conversation to start</p>
                    </div>
                  ) : (
                    <>
                      <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 shrink-0 flex items-center justify-between">
                        <div>
                          <p className="font-black text-slate-900 text-[13px]">
                            {conversations.find(c => c.user_id === chatUser)?.profiles?.full_name || "User"}
                          </p>
                          <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider mt-0.5">Active</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                        </div>
                      </div>

                      <div className="flex-1 overflow-y-auto p-5 space-y-4 noscroll bg-slate-50/30">
                        {chatMessages.map((msg, i) => {
                          const isAdmin = msg.sender_role === "admin";
                          const isEditing = editingMsgId === msg.id;
                          return (
                            <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                              className={`flex flex-col group ${isAdmin ? "items-end" : "items-start"}`}>
                              <div className={`relative max-w-[75%] ${isAdmin ? "items-end" : "items-start"} flex flex-col gap-1`}>
                                {isEditing ? (
                                  <div className="flex gap-2 items-center">
                                    <input value={editMsgContent} onChange={e => setEditMsgContent(e.target.value)}
                                      onKeyDown={e => { if (e.key === "Enter") handleEditMsg(msg.id); if (e.key === "Escape") setEditingMsgId(null); }}
                                      className="bg-white border border-indigo-300 rounded-xl px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-100 min-w-48 shadow-sm" autoFocus />
                                    <button onClick={() => handleEditMsg(msg.id)} className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition-colors"><Check size={13} /></button>
                                    <button onClick={() => setEditingMsgId(null)} className="p-1.5 bg-slate-200 text-slate-600 rounded-lg hover:bg-slate-300 transition-colors"><X size={13} /></button>
                                  </div>
                                ) : (
                                  <div className={`px-4 py-2.5 rounded-2xl text-sm font-medium leading-relaxed shadow-sm ${isAdmin ? "bg-indigo-600 text-white rounded-tr-sm" : "bg-white border border-slate-200 text-slate-800 rounded-tl-sm"}`}>
                                    {msg.content}
                                    {msg.updated_at && msg.updated_at !== msg.created_at && (
                                      <span className="text-[9px] opacity-60 ml-2">edited</span>
                                    )}
                                  </div>
                                )}
                                {isAdmin && !isEditing && (
                                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => { setEditingMsgId(msg.id); setEditMsgContent(msg.content); }}
                                      className="p-1 text-slate-400 hover:text-indigo-600 transition-colors rounded">
                                      <Edit3 size={11} />
                                    </button>
                                    <button onClick={() => handleDeleteMsg(msg.id)}
                                      className="p-1 text-slate-400 hover:text-red-600 transition-colors rounded">
                                      <Trash2 size={11} />
                                    </button>
                                  </div>
                                )}
                                <span className="text-[10px] text-slate-400 px-1">
                                  {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                </span>
                              </div>
                            </motion.div>
                          );
                        })}
                        <div ref={messagesEndRef} />
                      </div>

                      <div className="p-4 border-t border-slate-200 shrink-0 bg-white">
                        <form onSubmit={sendChat} className="flex gap-2">
                          <input type="text" value={chatInput} onChange={e => setChatInput(e.target.value)}
                            placeholder="Type a message…"
                            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-400" />
                          <button type="submit" disabled={!chatInput.trim()}
                            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl disabled:opacity-50 transition-all shadow-sm">
                            <Send size={14} />
                          </button>
                        </form>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>
    </div>
  );
}