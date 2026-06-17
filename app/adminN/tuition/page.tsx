"use client";

import React, {
  useState, useEffect, useRef, useCallback, createContext, useContext, useMemo
} from "react";
import {
  Users, Briefcase, FileText, MessageSquare, Crown, CheckCircle, XCircle,
  Clock, Phone, MapPin, DollarSign, Trash2, Edit2, Plus, X, Search,
  ChevronDown, ExternalLink, MessageCircle, AlertCircle, Flame,
  GraduationCap, User, Send, Loader2, Eye, EyeOff, Check, Shield,
  ShieldCheck, Activity, TrendingUp, Zap, Filter, MoreVertical,
  BookOpen, Star, RefreshCw, ChevronRight, ArrowLeft, Lock
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";

// ─── TYPES ────────────────────────────────────────────────────────────────────

interface Tutor {
  id: number; name: string; contact_num: string; cv_url: string;
  id_url: string; avatar_url: string; education: string; bio: string;
  verified: boolean; availability: boolean; created_at: string;
  subject: string[]; location: string; hour_rate: number; user_id?: string;
}

interface Vacancy {
  id: number; subject: string; location: string; class_level: string;
  description: string; salary_range: string; tuition_type: string;
  student_gender_pref: string; class_time: string; days_a_week: string;
  contact_number: string; contact_name: string; status: boolean;
  urgent: boolean; user_id?: string; created_at: string; applicant_count?: number;
}

interface Application {
  id: number; vacancy_id: number; applicant_name: string;
  applicant_phone: string; applicant_email: string; cover_message: string;
  status: string; user_id?: string;
  vacancies?: { subject: string; location: string; salary_range: string;
    contact_name: string; contact_number: string; user_id?: string; };
}

interface StudentRequest {
  id: number; student_name: string; phone: string; grade: string;
  preferred_mode: string; message: string; status: string;
  created_at: string; tutor_id?: number; user_id?: string;
  tutors?: { name: string; contact_num: string; hour_rate: number; user_id?: string; };
}

interface Message {
  id: string; user_id: string; sender_role: string; content: string;
  created_at: string; is_read?: boolean;
  profiles?: { full_name: string; avatar_url: string; role: string; };
}

// ─── CONTEXT ──────────────────────────────────────────────────────────────────

interface TuitionCtx {
  tutors: Tutor[]; vacancies: Vacancy[]; applications: Application[];
  requests: StudentRequest[]; loading: boolean; refresh: () => Promise<void>;
  openChat: (userId: string, name?: string, role?: "tutor" | "student") => void;
}

const TuitionContext = createContext<TuitionCtx>({
  tutors: [], vacancies: [], applications: [], requests: [],
  loading: true, refresh: async () => {}, openChat: () => {}
});

const useTuition = () => useContext(TuitionContext);

// ─── UTILS ────────────────────────────────────────────────────────────────────

const timeAgo = (d: string) => {
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

const fmt = (n: number) =>
  n >= 1000 ? `Nrs ${(n / 1000).toFixed(1)}k` : `Nrs ${n}`;

// ─── ANIMATIONS ───────────────────────────────────────────────────────────────

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.18 } }
};

const stagger = {
  animate: { transition: { staggerChildren: 0.06 } }
};

const slideIn = {
  initial: { x: "100%", opacity: 0 },
  animate: { x: 0, opacity: 1, transition: { type: "spring", damping: 28, stiffness: 220 } },
  exit: { x: "100%", opacity: 0, transition: { duration: 0.22 } }
};

// ─── SHARED PRIMITIVES ────────────────────────────────────────────────────────

function Toggle({
  checked, onChange, size = "md"
}: { checked: boolean; onChange: () => void; size?: "sm" | "md" }) {
  const w = size === "sm" ? "w-8 h-4" : "w-11 h-6";
  const d = size === "sm" ? "w-3 h-3" : "w-4 h-4";
  const t = size === "sm" ? "translate-x-4" : "translate-x-5";
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onChange(); }}
      className={`relative inline-flex items-center ${w} rounded-full transition-colors duration-200 focus:outline-none ${checked ? "bg-violet-600" : "bg-slate-300"}`}
    >
      <span className={`inline-block ${d} bg-white rounded-full shadow transform transition-transform duration-200 ml-1 ${checked ? t : "translate-x-0"}`} />
    </button>
  );
}

function Badge({ children, variant = "default" }: {
  children: React.ReactNode;
  variant?: "default" | "success" | "danger" | "warning" | "info" | "urgent";
}) {
  const styles: Record<string, string> = {
    default: "bg-slate-100 text-slate-600",
    success: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    danger: "bg-red-50 text-red-700 border border-red-200",
    warning: "bg-amber-50 text-amber-700 border border-amber-200",
    info: "bg-violet-50 text-violet-700 border border-violet-200",
    urgent: "bg-red-500 text-white animate-pulse",
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${styles[variant]}`}>
      {children}
    </span>
  );
}

function StatCard({ icon, label, value, sub, accent }: {
  icon: React.ReactNode; label: string; value: string | number;
  sub?: string; accent?: string;
}) {
  return (
    <div className="relative bg-white border border-slate-200/60 rounded-2xl p-5 overflow-hidden group hover:border-violet-300 hover:shadow-lg hover:shadow-violet-100 transition-all duration-300">
      <div className={`absolute top-0 right-0 w-20 h-20 rounded-bl-full opacity-10 ${accent || "bg-violet-500"}`} />
      <div className={`inline-flex p-2 rounded-xl mb-3 ${accent ? "bg-violet-100 text-violet-600" : "bg-slate-100 text-slate-600"}`}>
        {icon}
      </div>
      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{label}</p>
      <p className="text-2xl font-black text-slate-900 mt-1">{value}</p>
      {sub && <p className="text-xs text-slate-400 font-medium mt-0.5">{sub}</p>}
    </div>
  );
}

function SearchInput({ value, onChange, placeholder }: {
  value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  return (
    <div className="relative flex-1 min-w-[220px]">
      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || "Search…"}
        className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 placeholder:text-slate-400 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all"
      />
    </div>
  );
}

function SelectFilter({ value, onChange, options }: {
  value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none pl-3 pr-8 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none cursor-pointer hover:border-violet-300 transition-colors"
      >
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
    </div>
  );
}

function Modal({ open, onClose, children, maxW = "max-w-xl" }: {
  open: boolean; onClose: () => void;
  children: React.ReactNode; maxW?: string;
}) {
  if (!open) return null;
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 12 }}
          animate={{ scale: 1, opacity: 1, y: 0, transition: { type: "spring", damping: 26, stiffness: 280 } }}
          exit={{ scale: 0.95, opacity: 0, y: 8 }}
          className={`relative bg-white rounded-3xl shadow-2xl shadow-slate-900/15 ${maxW} w-full overflow-hidden max-h-[92vh] flex flex-col`}
          onClick={(e) => e.stopPropagation()}
        >
          {children}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function ModalHeader({ title, sub, onClose, titleColor = "text-slate-900" }: {
  title: string; sub?: string; onClose: () => void; titleColor?: string;
}) {
  return (
    <div className="flex items-start justify-between p-6 pb-4 border-b border-slate-100 shrink-0">
      <div>
        <h3 className={`text-xl font-black ${titleColor}`}>{title}</h3>
        {sub && <p className="text-sm text-slate-500 font-medium mt-0.5">{sub}</p>}
      </div>
      <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors ml-4 shrink-0">
        <X size={18} />
      </button>
    </div>
  );
}

function FieldRow({ label, value, mono, valueColor = "text-slate-800" }: { label: string; value?: string | number | null; mono?: boolean; valueColor?: string; }) {
  if (!value) return null;
  return (
    <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100">
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{label}</p>
      <p className={`text-sm font-bold ${valueColor} ${mono ? "font-mono" : ""}`}>{value}</p>
    </div>
  );
}

// Status helpers
const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 border border-amber-200",
  accepted: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  rejected: "bg-red-50 text-red-700 border border-red-200",
};

// ─── TAB NAV ──────────────────────────────────────────────────────────────────

const TABS = [
  { id: "overview", label: "Overview", icon: <Activity size={16} /> },
  { id: "tutors", label: "Tutors", icon: <Users size={16} /> },
  { id: "vacancies", label: "Vacancies", icon: <Briefcase size={16} /> },
  { id: "applications", label: "Applications", icon: <FileText size={16} /> },
  { id: "requests", label: "Requests", icon: <MessageSquare size={16} /> },
];

// ─── OVERVIEW TAB ─────────────────────────────────────────────────────────────

function OverviewTab() {
  const { tutors, vacancies, applications, requests } = useTuition();

  const verified = tutors.filter((t) => t.verified).length;
  const available = tutors.filter((t) => t.availability).length;
  const openVac = vacancies.filter((v) => v.status).length;
  const urgentVac = vacancies.filter((v) => v.urgent).length;
  const pendingApps = applications.filter((a) => a.status === "pending").length;
  const acceptedApps = applications.filter((a) => a.status === "accepted").length;
  const pendingReq = requests.filter((r) => r.status === "pending").length;

  const recentActivity = [
    ...applications.slice(0, 5).map((a) => ({
      key: `app-${a.id}`, type: "application" as const,
      name: a.applicant_name, sub: `Applied to ${a.vacancies?.subject || "vacancy"}`,
      status: a.status, icon: <FileText size={14} />,
      nameColor: "text-green-800"
    })),
    ...requests.slice(0, 5).map((r) => ({
      key: `req-${r.id}`, type: "request" as const,
      name: r.student_name, sub: r.tutors ? `→ ${r.tutors.name}` : "Direct inquiry",
      status: r.status, icon: <MessageSquare size={14} />,
      nameColor: "text-blue-600"
    })),
  ].slice(0, 8);

  return (
    <motion.div variants={stagger} {...fadeUp} className="space-y-8">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<Users size={18} />} label="Total Tutors" value={tutors.length}
          sub={`${verified} verified · ${available} available`} accent="bg-violet-500" />
        <StatCard icon={<Briefcase size={18} />} label="Active Vacancies" value={openVac}
          sub={urgentVac > 0 ? `${urgentVac} urgent` : "All normal priority"} accent="bg-blue-500" />
        <StatCard icon={<FileText size={18} />} label="Applications" value={applications.length}
          sub={`${pendingApps} pending · ${acceptedApps} accepted`} accent="bg-emerald-500" />
        <StatCard icon={<MessageSquare size={18} />} label="Tuition Requests" value={requests.length}
          sub={`${pendingReq} awaiting response`} accent="bg-rose-500" />
      </div>

      {/* Two column */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-white rounded-3xl border border-slate-200/60 p-6">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {recentActivity.map((item) => (
              <motion.div key={item.key} variants={fadeUp}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                <div className={`p-2 rounded-lg ${item.type === "application" ? "bg-blue-50 text-blue-600" : "bg-violet-50 text-violet-600"}`}>
                  {item.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-bold truncate ${item.nameColor}`}>{item.name}</p>
                  <p className="text-xs text-slate-500 truncate">{item.sub}</p>
                </div>
                <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-lg ${STATUS_STYLES[item.status] || "bg-slate-100 text-slate-600"}`}>
                  {item.status}
                </span>
              </motion.div>
            ))}
            {recentActivity.length === 0 && (
              <p className="text-sm text-slate-400 text-center py-8">No recent activity</p>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="bg-white rounded-3xl border border-slate-200/60 p-6 space-y-5">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Marketplace Health</h3>

          <div className="space-y-4">
            {[
              { label: "Tutor Verification Rate", value: tutors.length ? Math.round((verified / tutors.length) * 100) : 0, color: "bg-violet-500", icon: <ShieldCheck size={14} /> },
              { label: "Vacancy Fill Rate", value: vacancies.length ? Math.round((acceptedApps / Math.max(vacancies.length, 1)) * 100) : 0, color: "bg-emerald-500", icon: <TrendingUp size={14} /> },
              { label: "Request Response Rate", value: requests.length ? Math.round(((requests.length - pendingReq) / requests.length) * 100) : 0, color: "bg-blue-500", icon: <Zap size={14} /> },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5">{stat.icon}{stat.label}</span>
                  <span className="text-sm font-black text-slate-900">{stat.value}%</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <motion.div
                    className={`h-full ${stat.color} rounded-full`}
                    initial={{ width: 0 }}
                    animate={{ width: `${stat.value}%` }}
                    transition={{ delay: 0.3, duration: 0.8, ease: "easeOut" }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Urgent Vacancies */}
          {urgentVac > 0 && (
            <div className="mt-4 p-4 bg-red-50 rounded-2xl border border-red-200">
              <div className="flex items-center gap-2 mb-2">
                <Flame size={16} className="text-red-500" />
                <p className="text-sm font-black text-red-700">{urgentVac} Urgent Vacancy{urgentVac > 1 ? "ies" : "y"}</p>
              </div>
              <div className="space-y-1">
                {vacancies.filter((v) => v.urgent).slice(0, 3).map((v) => (
                  <p key={v.id} className="text-xs font-medium text-red-600">{v.subject} · {v.location}</p>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ─── TUTORS TAB ───────────────────────────────────────────────────────────────

function TutorsTab() {
  const { tutors, refresh, openChat } = useTuition();
  const supabase = createClient();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState<Tutor | null>(null);

  const filtered = useMemo(() => tutors.filter((t) => {
    const q = search.toLowerCase();
    const matchesSearch = !q || t.name?.toLowerCase().includes(q) ||
      t.location?.toLowerCase().includes(q) ||
      t.subject?.some((s) => s.toLowerCase().includes(q));
    const matchesFilter = filter === "all" ? true :
      filter === "verified" ? t.verified :
      filter === "available" ? t.availability :
      filter === "unverified" ? !t.verified : true;
    return matchesSearch && matchesFilter;
  }), [tutors, search, filter]);

  const toggle = async (id: number, field: "verified" | "availability", val: boolean) => {
    const { error } = await supabase.from("tutors").update({ [field]: !val }).eq("id", id);
    if (!error) refresh();
  };

  const remove = async (id: number) => {
    if (!confirm("Permanently delete this tutor?")) return;
    const { error } = await supabase.from("tutors").delete().eq("id", id);
    if (!error) { setSelected(null); refresh(); }
  };

  return (
    <motion.div {...fadeUp} className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 items-center">
        <SearchInput value={search} onChange={setSearch} placeholder="Search name, location, subject…" />
        <SelectFilter value={filter} onChange={setFilter} options={[
          { value: "all", label: "All Tutors" },
          { value: "verified", label: "Verified Only" },
          { value: "available", label: "Available" },
          { value: "unverified", label: "Unverified" },
        ]} />
        <div className="ml-auto flex gap-2 items-center">
          <span className="text-xs font-bold text-slate-400">{filtered.length} tutors</span>
          <button onClick={() => refresh()} className="p-2 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"><RefreshCw size={15} /></button>
        </div>
      </div>

      {/* Grid */}
      <motion.div variants={stagger} animate="animate" className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <AnimatePresence mode="popLayout">
          {filtered.map((tutor) => (
            <motion.div
              key={tutor.id}
              variants={fadeUp}
              layout
              className="bg-white rounded-2xl border border-slate-200/60 p-5 hover:border-violet-300 hover:shadow-lg hover:shadow-violet-100/50 transition-all duration-300 cursor-pointer group"
              onClick={() => setSelected(tutor)}
            >
              {/* Top */}
              <div className="flex items-start gap-3">
                <div className="relative shrink-0">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center text-slate-400">
                    {tutor.avatar_url ? <img src={tutor.avatar_url} className="w-full h-full object-cover" alt="" /> : <User size={22} />}
                  </div>
                  {tutor.verified && (
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-violet-600 rounded-full flex items-center justify-center shadow-sm">
                      <Crown size={10} className="text-white" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-black text-green-800 text-sm leading-snug truncate">{tutor.name || "Unknown"}</h4>
                    {tutor.availability ? (
                      <Badge variant="success"><Activity size={9} /> Online</Badge>
                    ) : (
                      <Badge variant="default">Away</Badge>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1"><MapPin size={10} />{tutor.location || "—"}</p>
                </div>
              </div>

              {/* Subjects */}
              {tutor.subject?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {tutor.subject.slice(0, 3).map((s) => (
                    <span key={s} className="text-[10px] font-bold bg-violet-50 text-violet-700 px-2 py-0.5 rounded-md">{s}</span>
                  ))}
                  {tutor.subject.length > 3 && (
                    <span className="text-[10px] font-bold text-slate-400">+{tutor.subject.length - 3}</span>
                  )}
                </div>
              )}

              {/* Rate */}
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
                <span className="text-sm font-black text-slate-900">{fmt(tutor.hour_rate)}<span className="text-xs font-medium text-slate-400">/hr</span></span>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                    <Toggle checked={tutor.verified} onChange={() => toggle(tutor.id, "verified", tutor.verified)} size="sm" />
                    <span className="text-[10px] font-bold text-slate-500">Verify</span>
                  </div>
                  <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                    <Toggle checked={tutor.availability} onChange={() => toggle(tutor.id, "availability", tutor.availability)} size="sm" />
                    <span className="text-[10px] font-bold text-slate-500">Available</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {filtered.length === 0 && (
          <div className="col-span-full text-center py-16 text-slate-400">
            <Users size={40} className="mx-auto mb-3 opacity-20" />
            <p className="font-bold">No tutors found</p>
          </div>
        )}
      </motion.div>

      {/* Detail Modal */}
      <Modal open={!!selected} onClose={() => setSelected(null)} maxW="max-w-lg">
        {selected && (
          <>
            <ModalHeader title={selected.name} sub={selected.education || "Tutor"} onClose={() => setSelected(null)} titleColor="text-green-800" />
            <div className="overflow-y-auto flex-1">
              <div className="p-6 space-y-4">
                {/* Header card */}
                <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-violet-50 to-indigo-50 rounded-2xl border border-violet-100">
                  <div className="w-16 h-16 rounded-2xl bg-white border border-violet-200 overflow-hidden flex items-center justify-center text-slate-400 shadow-sm">
                    {selected.avatar_url ? <img src={selected.avatar_url} className="w-full h-full object-cover" alt="" /> : <User size={28} />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      {selected.verified && <Badge variant="info"><Crown size={9} /> Verified</Badge>}
                      {selected.availability ? <Badge variant="success"><Activity size={9} /> Available</Badge> : <Badge>Away</Badge>}
                    </div>
                    <p className="text-lg font-black text-slate-900">{fmt(selected.hour_rate)}/hr</p>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5"><MapPin size={10} />{selected.location}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <FieldRow label="Phone" value={selected.contact_num} />
                  <FieldRow label="Joined" value={new Date(selected.created_at).toLocaleDateString()} />
                </div>
                <FieldRow label="Education" value={selected.education} />

                {selected.subject?.length > 0 && (
                  <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Subjects</p>
                    <div className="flex flex-wrap gap-1.5">
                      {selected.subject.map((s) => (
                        <span key={s} className="text-xs font-bold bg-white text-violet-700 px-2.5 py-1 rounded-lg border border-violet-200">{s}</span>
                      ))}
                    </div>
                  </div>
                )}

                {selected.bio && (
                  <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Bio</p>
                    <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{selected.bio}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  {selected.cv_url && (
                    <a href={selected.cv_url} target="_blank" rel="noreferrer"
                      className="flex items-center justify-center gap-2 p-3 bg-blue-50 text-blue-700 rounded-xl border border-blue-200 text-xs font-bold hover:bg-blue-100 transition-colors">
                      <BookOpen size={14} /> View CV <ExternalLink size={11} />
                    </a>
                  )}
                  {selected.id_url && (
                    <a href={selected.id_url} target="_blank" rel="noreferrer"
                      className="flex items-center justify-center gap-2 p-3 bg-slate-50 text-slate-700 rounded-xl border border-slate-200 text-xs font-bold hover:bg-slate-100 transition-colors">
                      <Shield size={14} /> View ID <ExternalLink size={11} />
                    </a>
                  )}
                </div>
              </div>
            </div>
            <div className="p-5 border-t border-slate-100 bg-slate-50 flex gap-2 shrink-0 flex-wrap">
              {selected.contact_num && (
                <a href={`https://wa.me/${selected.contact_num.replace(/\D/g, "")}`} target="_blank" rel="noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#25D366] text-white rounded-xl text-xs font-black hover:bg-[#20b858] transition-colors">
                  <MessageCircle size={14} /> WhatsApp
                </a>
              )}
              {selected.user_id && (
                <button onClick={() => { openChat(selected.user_id!, selected.name, "tutor"); setSelected(null); }}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-violet-600 text-white rounded-xl text-xs font-black hover:bg-violet-700 transition-colors">
                  <Send size={14} /> Message
                </button>
              )}
              <button onClick={() => remove(selected.id)}
                className="p-2.5 text-red-500 bg-red-50 rounded-xl hover:bg-red-100 transition-colors">
                <Trash2 size={16} />
              </button>
            </div>
          </>
        )}
      </Modal>
    </motion.div>
  );
}

// ─── VACANCIES TAB ────────────────────────────────────────────────────────────

function VacanciesTab() {
  const { vacancies, applications, refresh, openChat } = useTuition();
  const supabase = createClient();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [view, setView] = useState<Vacancy | null>(null);
  const [editModal, setEditModal] = useState(false);
  const [editing, setEditing] = useState<Partial<Vacancy>>({});

  const filtered = useMemo(() => vacancies.filter((v) => {
    const q = search.toLowerCase();
    const m = !q || v.subject?.toLowerCase().includes(q) ||
      v.location?.toLowerCase().includes(q) || v.contact_name?.toLowerCase().includes(q);
    const f = filter === "all" ? true : filter === "open" ? v.status :
      filter === "closed" ? !v.status : filter === "urgent" ? v.urgent : true;
    return m && f;
  }), [vacancies, search, filter]);

  const toggleField = async (v: Vacancy, field: "status" | "urgent") => {
    await supabase.from("vacancies").update({ [field]: !v[field] }).eq("id", v.id);
    refresh();
  };

  const remove = async (id: number) => {
    if (!confirm("Delete this vacancy?")) return;
    await supabase.from("vacancies").delete().eq("id", id);
    refresh();
  };

  const save = async () => {
    if (editing.id) {
      await supabase.from("vacancies").update(editing).eq("id", editing.id);
    } else {
      await supabase.from("vacancies").insert([editing]);
    }
    setEditModal(false); refresh();
  };

  const openCreate = () => {
    setEditing({ status: true, urgent: false });
    setEditModal(true);
  };

  const openEdit = (v: Vacancy, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditing({ ...v });
    setEditModal(true);
  };

  const vacancyApps = (v: Vacancy) => applications
    .filter((a) => a.vacancy_id === v.id)
    .sort((a, b) => (a.status === "accepted" ? -1 : b.status === "accepted" ? 1 : 0));

  return (
    <motion.div {...fadeUp} className="space-y-5">
      <div className="flex flex-wrap gap-3 items-center">
        <SearchInput value={search} onChange={setSearch} placeholder="Search subject, location, contact…" />
        <SelectFilter value={filter} onChange={setFilter} options={[
          { value: "all", label: "All" },
          { value: "open", label: "Open" },
          { value: "closed", label: "Closed" },
          { value: "urgent", label: "Urgent" },
        ]} />
        <button onClick={openCreate}
          className="ml-auto flex items-center gap-2 px-4 py-2.5 bg-violet-600 text-white rounded-xl text-sm font-black hover:bg-violet-700 transition-colors shadow-lg shadow-violet-200">
          <Plus size={16} /> Post Vacancy
        </button>
      </div>

      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {filtered.map((vac) => {
            const apps = vacancyApps(vac);
            return (
              <motion.div
                key={vac.id}
                variants={fadeUp}
                layout
                className={`bg-white rounded-2xl border transition-all duration-300 cursor-pointer hover:shadow-md group ${vac.urgent ? "border-red-300 hover:border-red-400" : "border-slate-200/60 hover:border-violet-300"}`}
                onClick={() => setView(vac)}
              >
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h4 className="font-black text-slate-900">{vac.subject}</h4>
                        {vac.urgent && <Badge variant="urgent"><Flame size={9} /> Urgent</Badge>}
                        {vac.status ? <Badge variant="success">Open</Badge> : <Badge variant="danger">Closed</Badge>}
                        {apps.length > 0 && (
                          <Badge variant="info"><Users size={9} /> {apps.length} Applied</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        <span className="flex items-center gap-1"><MapPin size={11} />{vac.location}</span>
                        <span className="flex items-center gap-1"><DollarSign size={11} />{vac.salary_range}</span>
                        {vac.class_time && <span className="flex items-center gap-1"><Clock size={11} />{vac.class_time}</span>}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-1.5">
                        <Toggle checked={vac.urgent} onChange={() => toggleField(vac, "urgent")} size="sm" />
                        <span className="text-[10px] font-bold text-slate-400">Urgent</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Toggle checked={vac.status} onChange={() => toggleField(vac, "status")} size="sm" />
                        <span className="text-[10px] font-bold text-slate-400">Open</span>
                      </div>
                      <button onClick={(e) => openEdit(vac, e)} className="p-2 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"><Edit2 size={14} /></button>
                      <button onClick={(e) => { e.stopPropagation(); remove(vac.id); }} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={14} /></button>
                    </div>
                  </div>

                  {/* Applied tutors preview */}
                  {apps.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-2">
                      <div className="flex -space-x-2">
                        {apps.slice(0, 4).map((a) => (
                          <div key={a.id} className="w-6 h-6 rounded-full bg-violet-200 border-2 border-white flex items-center justify-center text-[8px] font-black text-violet-700">
                            {a.applicant_name?.charAt(0) || "?"}
                          </div>
                        ))}
                      </div>
                      <span className="text-xs text-slate-500 font-medium">{apps.filter((a) => a.status === "accepted").length > 0 && `${apps.filter((a) => a.status === "accepted").length} accepted`}</span>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        {filtered.length === 0 && (
          <div className="text-center py-16 text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200">
            <Briefcase size={40} className="mx-auto mb-3 opacity-20" />
            <p className="font-bold">No vacancies found</p>
            <button onClick={openCreate} className="mt-3 text-sm text-violet-600 font-bold hover:underline">Post the first one</button>
          </div>
        )}
      </div>

      {/* View Modal */}
      <Modal open={!!view} onClose={() => setView(null)} maxW="max-w-2xl">
        {view && (
          <>
            <ModalHeader title={view.subject} sub={`${view.location} · Posted ${timeAgo(view.created_at)}`} onClose={() => setView(null)} />
            <div className="overflow-y-auto flex-1 p-6 space-y-5">
              <div className="flex flex-wrap gap-2">
                {view.urgent && <Badge variant="urgent"><Flame size={9} /> Urgent</Badge>}
                {view.status ? <Badge variant="success">Open</Badge> : <Badge variant="danger">Closed</Badge>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <FieldRow label="Contact" value={view.contact_name} valueColor="text-blue-600" />
                <FieldRow label="Phone" value={view.contact_number} />
                <FieldRow label="Salary Range" value={view.salary_range} />
                <FieldRow label="Class Time" value={view.class_time} />
                <FieldRow label="Tuition Type" value={view.tuition_type} />
                <FieldRow label="Days / Week" value={view.days_a_week} />
              </div>

              {view.description && (
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Description</p>
                  <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{view.description}</p>
                </div>
              )}

              {/* Applications */}
              <div>
                <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-3">
                  Applied Tutors ({vacancyApps(view).length})
                </h4>
                <div className="space-y-2">
                  {vacancyApps(view).map((app) => (
                    <div key={app.id} className={`flex items-center justify-between p-4 rounded-xl border ${app.status === "accepted" ? "bg-emerald-50 border-emerald-200" : app.status === "rejected" ? "bg-red-50 border-red-200" : "bg-white border-slate-200"}`}>
                      <div>
                        <button onClick={() => app.user_id && openChat(app.user_id, app.applicant_name, "tutor")}
                          className="font-bold text-sm text-green-800 hover:underline flex items-center gap-1">
                          {app.applicant_name} <MessageSquare size={12} />
                        </button>
                        <p className="text-xs text-slate-500">{app.applicant_phone} · {app.applicant_email}</p>
                      </div>
                      <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-lg ${STATUS_STYLES[app.status] || "bg-slate-100 text-slate-600"}`}>
                        {app.status}
                      </span>
                    </div>
                  ))}
                  {vacancyApps(view).length === 0 && (
                    <p className="text-center py-6 text-slate-400 text-sm">No applications yet</p>
                  )}
                </div>
              </div>
            </div>
            <div className="p-5 border-t border-slate-100 bg-slate-50 flex gap-2 shrink-0">
              {view.user_id && (
                <button onClick={() => { openChat(view.user_id!, view.contact_name, "student"); setView(null); }}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-violet-600 text-white rounded-xl text-xs font-black hover:bg-violet-700 transition-colors">
                  <MessageSquare size={14} /> Message Student
                </button>
              )}
              {view.contact_number && (
                <a href={`https://wa.me/${view.contact_number.replace(/\D/g, "")}`} target="_blank" rel="noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#25D366] text-white rounded-xl text-xs font-black hover:bg-[#20b858] transition-colors">
                  <MessageCircle size={14} /> WhatsApp
                </a>
              )}
            </div>
          </>
        )}
      </Modal>

      {/* Edit / Create Modal */}
      <Modal open={editModal} onClose={() => setEditModal(false)} maxW="max-w-2xl">
        <ModalHeader
          title={editing.id ? "Edit Vacancy" : "Post New Vacancy"}
          sub="All fields are optional except Subject"
          onClose={() => setEditModal(false)}
        />
        <div className="overflow-y-auto flex-1 p-6 space-y-4">
          <div className="flex items-center gap-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
            <div className="flex items-center gap-2">
              <Toggle checked={!!editing.status} onChange={() => setEditing({ ...editing, status: !editing.status })} />
              <span className="text-sm font-bold text-slate-700">Open for Applications</span>
            </div>
            <div className="flex items-center gap-2">
              <Toggle checked={!!editing.urgent} onChange={() => setEditing({ ...editing, urgent: !editing.urgent })} />
              <span className="text-sm font-bold text-slate-700">Mark as Urgent</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { field: "subject", label: "Subject *" },
              { field: "location", label: "Location" },
              { field: "contact_name", label: "Contact Name" },
              { field: "contact_number", label: "Contact Phone" },
              { field: "salary_range", label: "Salary Range (Nrs)" },
              { field: "class_time", label: "Class Time" },
              { field: "tuition_type", label: "Tuition Type" },
              { field: "days_a_week", label: "Days / Week" },
            ].map(({ field, label }) => (
              <div key={field}>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</label>
                <input
                  type="text"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-800 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all"
                  value={(editing as any)[field] || ""}
                  onChange={(e) => setEditing({ ...editing, [field]: e.target.value })}
                />
              </div>
            ))}
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Description</label>
            <textarea
              rows={4}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-800 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all resize-none"
              value={editing.description || ""}
              onChange={(e) => setEditing({ ...editing, description: e.target.value })}
            />
          </div>
        </div>
        <div className="p-5 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 shrink-0">
          <button onClick={() => setEditModal(false)} className="px-5 py-2.5 font-bold text-slate-500 hover:text-slate-800 transition-colors">Cancel</button>
          <button onClick={save} className="px-6 py-2.5 bg-violet-600 text-white rounded-xl font-black text-sm hover:bg-violet-700 transition-colors shadow-lg shadow-violet-200">
            {editing.id ? "Save Changes" : "Post Vacancy"}
          </button>
        </div>
      </Modal>
    </motion.div>
  );
}

// ─── APPLICATIONS TAB ─────────────────────────────────────────────────────────

function ApplicationsTab() {
  const { applications, refresh, openChat } = useTuition();
  const supabase = createClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewApp, setViewApp] = useState<Application | null>(null);

  const filtered = useMemo(() => applications.filter((a) => {
    const q = search.toLowerCase();
    const m = !q || a.applicant_name?.toLowerCase().includes(q) ||
      a.vacancies?.subject?.toLowerCase().includes(q) ||
      a.applicant_email?.toLowerCase().includes(q);
    const sf = statusFilter === "all" ? true : a.status === statusFilter;
    return m && sf;
  }), [applications, search, statusFilter]);

  const setStatus = async (id: number, status: string) => {
    await supabase.from("vacancy_applications").update({ status }).eq("id", id);
    refresh();
  };

  const remove = async (id: number) => {
    if (!confirm("Delete this application?")) return;
    await supabase.from("vacancy_applications").delete().eq("id", id);
    refresh();
  };

  const counts = useMemo(() => ({
    pending: applications.filter((a) => a.status === "pending").length,
    accepted: applications.filter((a) => a.status === "accepted").length,
    rejected: applications.filter((a) => a.status === "rejected").length,
  }), [applications]);

  return (
    <motion.div {...fadeUp} className="space-y-5">
      {/* Summary pills */}
      <div className="flex gap-3 flex-wrap">
        {[
          { val: "all", label: "All", count: applications.length, color: "bg-slate-100 text-slate-700" },
          { val: "pending", label: "Pending", count: counts.pending, color: "bg-amber-100 text-amber-700" },
          { val: "accepted", label: "Accepted", count: counts.accepted, color: "bg-emerald-100 text-emerald-700" },
          { val: "rejected", label: "Rejected", count: counts.rejected, color: "bg-red-100 text-red-700" },
        ].map((pill) => (
          <button key={pill.val} onClick={() => setStatusFilter(pill.val)}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${statusFilter === pill.val ? pill.color + " ring-2 ring-offset-1 ring-violet-400" : "bg-white border border-slate-200 text-slate-600 hover:border-slate-300"}`}>
            {pill.label} <span className="ml-1 font-black">{pill.count}</span>
          </button>
        ))}
        <div className="ml-auto">
          <SearchInput value={search} onChange={setSearch} placeholder="Search applicant or vacancy…" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                {["Applicant (Tutor)", "Applied For Vacancy", "Vacancy Contact (Student)", "Status", "Actions"].map((h) => (
                  <th key={h} className="px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {filtered.map((app) => (
                  <motion.tr key={app.id} variants={fadeUp} layout
                    className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors cursor-pointer"
                    onClick={() => setViewApp(app)}>
                    <td className="px-5 py-4">
                      <button
                        onClick={(e) => { e.stopPropagation(); app.user_id && openChat(app.user_id, app.applicant_name, "tutor"); }}
                        className="font-bold text-sm text-green-800 hover:underline flex items-center gap-1">
                        {app.applicant_name} <MessageSquare size={12} />
                      </button>
                      <p className="text-xs text-slate-500 mt-0.5">{app.applicant_phone}</p>
                      <p className="text-xs text-slate-400 break-all">{app.applicant_email}</p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-bold text-sm text-slate-800">{app.vacancies?.subject || "—"}</p>
                      <p className="text-xs text-slate-500">{app.vacancies?.location}</p>
                      <p className="text-xs font-bold text-emerald-600">{app.vacancies?.salary_range}</p>
                    </td>
                    <td className="px-5 py-4">
                      <button
                        onClick={(e) => { e.stopPropagation(); app.vacancies?.user_id && openChat(app.vacancies.user_id, app.vacancies.contact_name, "student"); }}
                        className="font-bold text-sm text-blue-600 hover:text-blue-800 transition-colors">
                        {app.vacancies?.contact_name || "—"}
                      </button>
                      <p className="text-xs text-slate-500">{app.vacancies?.contact_number}</p>
                    </td>
                    <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
                      <div className="relative w-32">
                        <select
                          value={app.status}
                          onChange={(e) => setStatus(app.id, e.target.value)}
                          className={`appearance-none w-full px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider outline-none cursor-pointer border ${STATUS_STYLES[app.status] || "bg-slate-100 text-slate-700 border-slate-200"}`}>
                          <option value="pending">Pending</option>
                          <option value="accepted">Accepted</option>
                          <option value="rejected">Rejected</option>
                        </select>
                        <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-60" />
                      </div>
                    </td>
                    <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => remove(app.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={14} /></button>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
              {filtered.length === 0 && (
                <tr><td colSpan={5} className="px-5 py-16 text-center text-slate-400">
                  <FileText size={36} className="mx-auto mb-2 opacity-20" />
                  <p className="font-bold text-sm">No applications found</p>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* App Detail Modal */}
      <Modal open={!!viewApp} onClose={() => setViewApp(null)}>
        {viewApp && (
          <>
            <ModalHeader title={viewApp.applicant_name} sub={`Application for ${viewApp.vacancies?.subject || "Vacancy"}`} onClose={() => setViewApp(null)} titleColor="text-green-800" />
            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              <div className="grid grid-cols-2 gap-3">
                <FieldRow label="Phone" value={viewApp.applicant_phone} />
                <FieldRow label="Email" value={viewApp.applicant_email} />
                <FieldRow label="Vacancy" value={viewApp.vacancies?.subject} />
                <FieldRow label="Salary" value={viewApp.vacancies?.salary_range} />
              </div>
              {viewApp.cover_message && (
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Cover Message</p>
                  <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{viewApp.cover_message}</p>
                </div>
              )}
            </div>
            <div className="p-5 border-t border-slate-100 bg-slate-50 flex gap-2 shrink-0">
              <button onClick={() => setStatus(viewApp.id, "accepted")}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-500 text-white rounded-xl text-xs font-black hover:bg-emerald-600 transition-colors">
                <CheckCircle size={14} /> Accept
              </button>
              <button onClick={() => setStatus(viewApp.id, "rejected")}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-50 text-red-600 rounded-xl text-xs font-black hover:bg-red-100 transition-colors border border-red-200">
                <XCircle size={14} /> Reject
              </button>
              {viewApp.user_id && (
                <button onClick={() => { openChat(viewApp.user_id!, viewApp.applicant_name, "tutor"); setViewApp(null); }}
                  className="p-2.5 text-violet-600 bg-violet-50 rounded-xl hover:bg-violet-100 transition-colors border border-violet-200">
                  <Send size={14} />
                </button>
              )}
            </div>
          </>
        )}
      </Modal>
    </motion.div>
  );
}

// ─── REQUESTS TAB ─────────────────────────────────────────────────────────────

function RequestsTab() {
  const { requests, refresh, openChat } = useTuition();
  const supabase = createClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [msgModal, setMsgModal] = useState<StudentRequest | null>(null);

  const filtered = useMemo(() => requests.filter((r) => {
    const q = search.toLowerCase();
    const m = !q || r.student_name?.toLowerCase().includes(q) ||
      r.phone?.toLowerCase().includes(q) || r.tutors?.name?.toLowerCase().includes(q);
    const sf = statusFilter === "all" ? true : r.status === statusFilter;
    return m && sf;
  }), [requests, search, statusFilter]);

  const setStatus = async (id: number, status: string) => {
    await supabase.from("student_requests").update({ status }).eq("id", id);
    refresh();
  };

  const remove = async (id: number) => {
    if (!confirm("Delete this request?")) return;
    await supabase.from("student_requests").delete().eq("id", id);
    refresh();
  };

  return (
    <motion.div {...fadeUp} className="space-y-5">
      <div className="flex flex-wrap gap-3 items-center">
        <SearchInput value={search} onChange={setSearch} placeholder="Search student name, phone, tutor…" />
        <SelectFilter value={statusFilter} onChange={setStatusFilter} options={[
          { value: "all", label: "All Requests" },
          { value: "pending", label: "Pending" },
          { value: "accepted", label: "Accepted" },
          { value: "rejected", label: "Rejected" },
        ]} />
        <span className="text-xs font-bold text-slate-400 ml-auto">{filtered.length} requests</span>
      </div>

      <motion.div variants={stagger} animate="animate" className="space-y-3">
        <AnimatePresence mode="popLayout">
          {filtered.map((req) => (
            <motion.div
              key={req.id}
              variants={fadeUp}
              layout
              className="bg-white rounded-2xl border border-slate-200/60 p-5 hover:border-violet-300 hover:shadow-md transition-all duration-300"
            >
              <div className="flex items-start gap-4">
                {/* Student avatar */}
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-100 to-indigo-100 flex items-center justify-center text-violet-700 font-black text-sm shrink-0 border border-violet-200">
                  {req.student_name?.charAt(0) || "?"}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <button
                        onClick={() => req.user_id && openChat(req.user_id, req.student_name, "student")}
                        className="font-black text-sm text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-1">
                        {req.student_name} <MessageSquare size={12} className="text-violet-400" />
                      </button>
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <Phone size={10} />{req.phone} · Grade: {req.grade || "N/A"}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="relative w-28">
                        <select value={req.status} onChange={(e) => setStatus(req.id, e.target.value)}
                          className={`appearance-none w-full px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider outline-none cursor-pointer border ${STATUS_STYLES[req.status] || "bg-slate-100 text-slate-700 border-slate-200"}`}>
                          <option value="pending">Pending</option>
                          <option value="accepted">Accepted</option>
                          <option value="rejected">Rejected</option>
                        </select>
                        <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-60" />
                      </div>
                      <button onClick={() => remove(req.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={13} /></button>
                    </div>
                  </div>

                  {/* Tutor section */}
                  {req.tutors && (
                    <div className="mt-3 flex items-center justify-between bg-slate-50 rounded-xl p-3 border border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600">
                          <GraduationCap size={14} />
                        </div>
                        <div>
                          <button
                            onClick={() => req.tutors?.user_id && openChat(req.tutors.user_id, req.tutors.name, "tutor")}
                            className="font-bold text-sm text-green-800 hover:underline flex items-center gap-1">
                            {req.tutors.name} <MessageSquare size={11} />
                          </button>
                          <p className="text-xs text-slate-500">{req.tutors.contact_num} · {fmt(req.tutors.hour_rate)}/hr</p>
                        </div>
                      </div>
                      <ChevronRight size={16} className="text-slate-400" />
                    </div>
                  )}

                  {/* Message preview */}
                  {req.message && (
                    <div className="mt-3 flex items-start gap-2">
                      <p className="text-xs text-slate-500 line-clamp-2 flex-1">{req.message}</p>
                      <button onClick={() => setMsgModal(req)}
                        className="text-[10px] font-black text-violet-600 hover:underline shrink-0">Read more</button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {filtered.length === 0 && (
          <div className="text-center py-16 text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200">
            <MessageSquare size={40} className="mx-auto mb-3 opacity-20" />
            <p className="font-bold">No tuition requests found</p>
          </div>
        )}
      </motion.div>

      {/* Message Modal */}
      <Modal open={!!msgModal} onClose={() => setMsgModal(null)}>
        {msgModal && (
          <>
            <ModalHeader title={`${msgModal.student_name}'s Message`} sub={`Mode: ${msgModal.preferred_mode || "Not specified"}`} onClose={() => setMsgModal(null)} titleColor="text-blue-600" />
            <div className="p-6 overflow-y-auto flex-1">
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{msgModal.message}</p>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-4">
                <FieldRow label="Student Phone" value={msgModal.phone} />
                <FieldRow label="Grade" value={msgModal.grade} />
              </div>
            </div>
            <div className="p-5 border-t border-slate-100 bg-slate-50 flex gap-2 shrink-0">
              <button onClick={() => setStatus(msgModal.id, "accepted")}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-500 text-white rounded-xl text-xs font-black hover:bg-emerald-600 transition-colors">
                <Check size={14} /> Accept
              </button>
              {msgModal.user_id && (
                <button onClick={() => { openChat(msgModal.user_id!, msgModal.student_name, "student"); setMsgModal(null); }}
                  className="p-2.5 text-violet-600 bg-violet-50 rounded-xl hover:bg-violet-100 border border-violet-200 transition-colors">
                  <Send size={14} />
                </button>
              )}
            </div>
          </>
        )}
      </Modal>
    </motion.div>
  );
}

// ─── CHAT DRAWER ──────────────────────────────────────────────────────────────

function ChatDrawer({ userId, name, role, onClose }: { userId: string; name?: string; role?: "tutor" | "student"; onClose: () => void }) {
  const supabase = createClient();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("messages").select("*")
        .eq("user_id", userId).order("created_at", { ascending: true });
      if (data) setMessages(data);
      setLoading(false);
    };
    load();

    const ch = supabase.channel(`tuition_chat_${userId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `user_id=eq.${userId}` },
        (p) => setMessages((prev) => prev.some((m) => m.id === p.new.id) ? prev : [...prev, p.new as Message]))
      .subscribe();

    return () => { supabase.removeChannel(ch); };
  }, [userId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    const { data, error } = await supabase.from("messages")
      .insert([{ user_id: userId, sender_role: "admin", content: input.trim() }])
      .select().single();
    if (!error && data) {
      setMessages((prev) => [...prev, data as Message]);
      setInput("");
    }
  };

  const nameColor = role === "tutor" ? "text-green-800" : role === "student" ? "text-blue-600" : "text-slate-900";

  return (
    <motion.div {...slideIn}
      className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-2xl shadow-slate-900/20 z-[60] flex flex-col border-l border-slate-200">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-white shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-violet-100 text-violet-700 flex items-center justify-center font-black text-sm">
            {name?.charAt(0) || "U"}
          </div>
          <div>
            <p className={`font-black ${nameColor} text-sm`}>{name || "User"}</p>
            <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider">Live Chat</p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors">
          <X size={17} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/40">
        {loading ? (
          <div className="flex items-center justify-center h-full"><Loader2 className="animate-spin text-violet-400" size={24} /></div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400">
            <MessageCircle size={32} className="opacity-20 mb-2" />
            <p className="text-sm font-medium">No messages yet</p>
          </div>
        ) : messages.map((msg, i) => {
          const isAdmin = msg.sender_role === "admin";
          return (
            <div key={i} className={`flex flex-col ${isAdmin ? "items-end" : "items-start"}`}>
              <div className={`max-w-[78%] px-3.5 py-2.5 rounded-2xl text-sm ${isAdmin ? "bg-violet-600 text-white rounded-tr-sm" : "bg-white border border-slate-200 text-slate-800 rounded-tl-sm shadow-sm"}`}>
                {msg.content}
              </div>
              <span className="text-[10px] text-slate-400 mt-1 px-1">
                {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <form onSubmit={send} className="p-4 bg-white border-t border-slate-100 shrink-0">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message…"
            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-800 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all"
          />
          <button type="submit" disabled={!input.trim()}
            className="p-2.5 bg-violet-600 text-white rounded-xl hover:bg-violet-700 disabled:opacity-40 transition-colors shadow-sm">
            <Send size={16} />
          </button>
        </div>
      </form>
    </motion.div>
  );
}

// ─── LOCK SCREEN ──────────────────────────────────────────────────────────────

function LockScreen({ onUnlock }: { onUnlock: () => void }) {
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");
  const [showPass, setShowPass] = useState(false);

  const adminUser = process.env.NEXT_PUBLIC_ADMIN_USER;
  const adminPass = process.env.NEXT_PUBLIC_ADMIN_PASS;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (user === adminUser && pass === adminPass) {
      sessionStorage.setItem("tuition_admin_auth", "true");
      onUnlock();
    } else {
      setErr("Invalid credentials");
      setPass("");
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <motion.div initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-sm">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-violet-600 rounded-2xl flex items-center justify-center shadow-xl shadow-violet-300">
            <Lock size={28} className="text-white" />
          </div>
        </div>
        <h2 className="text-2xl font-black text-center text-slate-900 mb-1">Tuition Hub</h2>
        <p className="text-center text-slate-500 text-sm font-medium mb-8">Admin access required</p>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Username</label>
            <input type="text" value={user} onChange={(e) => setUser(e.target.value)} autoComplete="username"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:border-violet-400 transition-all" />
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Password</label>
            <div className="relative">
              <input type={showPass ? "text" : "password"} value={pass} onChange={(e) => setPass(e.target.value)} autoComplete="current-password"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:border-violet-400 transition-all pr-10" />
              <button type="button" onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700">
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          {err && <p className="text-red-500 text-xs font-bold text-center">{err}</p>}
          <button type="submit" className="w-full bg-violet-600 text-white py-3.5 rounded-xl font-black text-sm hover:bg-violet-700 transition-colors shadow-lg shadow-violet-200 mt-2">
            Unlock Dashboard
          </button>
        </form>
      </motion.div>
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

export default function TuitionHubPage() {
  const supabase = createClient();
  const [isLocked, setIsLocked] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);

  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [vacancies, setVacancies] = useState<Vacancy[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [requests, setRequests] = useState<StudentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  const [chat, setChat] = useState<{ userId: string; name?: string; role?: "tutor" | "student" } | null>(null);

  // Auth check
  useEffect(() => {
    const authed = sessionStorage.getItem("tuition_admin_auth");
    if (authed === "true") setIsLocked(false);
    setAuthChecked(true);
  }, []);

  const fetchAllData = useCallback(async () => {
    const [tutRes, vacRes, appRes, reqRes] = await Promise.all([
      supabase.from("tutors").select("*").order("created_at", { ascending: false }),
      supabase.from("vacancies").select("*").order("created_at", { ascending: false }),
      supabase.from("vacancy_applications").select("*, vacancies(subject, location, salary_range, contact_name, contact_number, user_id)").order("id", { ascending: false }),
      supabase.from("student_requests").select("*, tutors(name, contact_num, hour_rate, user_id)").order("id", { ascending: false }),
    ]);

    if (tutRes.data) setTutors(tutRes.data);
    if (vacRes.data) setVacancies(vacRes.data);
    if (appRes.data) setApplications(appRes.data as Application[]);
    if (reqRes.data) setRequests(reqRes.data as StudentRequest[]);
    setLoading(false);
  }, []);

  // Real-time sync
  useEffect(() => {
    if (isLocked) return;
    fetchAllData();

    const channel = supabase.channel("tuition-hub-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "tutors" }, fetchAllData)
      .on("postgres_changes", { event: "*", schema: "public", table: "vacancies" }, fetchAllData)
      .on("postgres_changes", { event: "*", schema: "public", table: "vacancy_applications" }, fetchAllData)
      .on("postgres_changes", { event: "*", schema: "public", table: "student_requests" }, fetchAllData)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [isLocked, fetchAllData]);

  const openChat = useCallback((userId: string, name?: string, role?: "tutor" | "student") => {
    setChat({ userId, name, role });
  }, []);

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Loader2 className="animate-spin text-violet-400" size={36} />
      </div>
    );
  }

  if (isLocked) {
    return <LockScreen onUnlock={() => setIsLocked(false)} />;
  }

  return (
    <TuitionContext.Provider value={{ tutors, vacancies, applications, requests, loading, refresh: fetchAllData, openChat }}>
      {/* Global CSS override for this specific route to hide app-wide layout nav/footer elements */}
      <style dangerouslySetInnerHTML={{ __html: `
        body > header:not(.admin-header),
        body > nav:not(.admin-nav),
        body > footer { display: none !important; }
      `}} />
      <div className="min-h-screen bg-slate-50">
        {/* Top Header */}
        <header className="admin-header bg-white border-b border-slate-200/60 sticky top-0 z-30">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex items-center justify-between h-16">
              {/* Brand */}
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-violet-600 rounded-xl flex items-center justify-center shadow-md shadow-violet-200">
                  <GraduationCap size={16} className="text-white" />
                </div>
                <div>
                  <p className="font-black text-slate-900 text-sm leading-none">Tuition Hub</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Admin Panel</p>
                </div>
              </div>

              {/* Tabs */}
              <nav className="admin-nav flex items-center gap-1">
                {TABS.map((tab) => {
                  const counts: Record<string, number> = {
                    tutors: tutors.length,
                    vacancies: vacancies.filter((v) => v.status).length,
                    applications: applications.filter((a) => a.status === "pending").length,
                    requests: requests.filter((r) => r.status === "pending").length,
                  };
                  const count = counts[tab.id];
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`relative flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black transition-all ${activeTab === tab.id ? "bg-violet-600 text-white shadow-lg shadow-violet-200" : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"}`}
                    >
                      {tab.icon}
                      <span className="hidden sm:block">{tab.label}</span>
                      {count > 0 && (
                        <span className={`absolute -top-1 -right-1 w-4 h-4 rounded-full text-[9px] font-black flex items-center justify-center ${activeTab === tab.id ? "bg-white text-violet-700" : "bg-red-500 text-white"}`}>
                          {count > 9 ? "9+" : count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>

              {/* Right */}
              <div className="flex items-center gap-2">
                {loading && <Loader2 size={16} className="animate-spin text-violet-400" />}
                <button onClick={fetchAllData}
                  className="p-2 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-xl transition-colors" title="Refresh">
                  <RefreshCw size={15} />
                </button>
                <button onClick={() => { sessionStorage.removeItem("tuition_admin_auth"); setIsLocked(true); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-black text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors">
                  <Lock size={13} /> Lock
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-6 py-8">
          <AnimatePresence mode="wait">
            <motion.div key={activeTab} {...fadeUp}>
              {activeTab === "overview" && <OverviewTab />}
              {activeTab === "tutors" && <TutorsTab />}
              {activeTab === "vacancies" && <VacanciesTab />}
              {activeTab === "applications" && <ApplicationsTab />}
              {activeTab === "requests" && <RequestsTab />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Chat Drawer (slide from right) */}
      <AnimatePresence>
        {chat && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-slate-900/20 backdrop-blur-sm"
              onClick={() => setChat(null)}
            />
            <ChatDrawer userId={chat.userId} name={chat.name} role={chat.role} onClose={() => setChat(null)} />
          </>
        )}
      </AnimatePresence>
    </TuitionContext.Provider>
  );
}