"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard, LogOut, Plus, Users, X, Edit2, Check, MapPin, Clock,
  Trash2, GraduationCap, ExternalLink, Monitor, Send, Lock, MessageCircle,
  AlertCircle, Layers, ShoppingCart, CalendarDays, Award, ChevronDown, Search,
  EyeOff, Eye, Loader2, MessageSquare, ArrowLeft, Upload, Copy, CheckSquare,
  Phone, Building2, CalendarClock, StickyNote, GripVertical, Ban, Globe2,
  TrendingUp, PieChart, CalendarRange, Archive,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";

/* ============================================================================
   INTERFACES & HELPERS
============================================================================ */
interface OnlineCourse {
  id: string; title: string; category: string; fee: number; discount: number; active_batch_no: number;
  duration: string; cover_pic: string; tutor_name: string; is_active: boolean;
  start_datetime: string; created_at: string;
}
interface CourseBatch {
  id: string; course_id: string; course_name: string; batch_no: number;
  start_datetime?: string; timing?: string; online_class_link?: string;
  google_classroom_link?: string; whatsapp_group_link?: string;
  is_active: boolean; created_at?: string;
}
interface PhysicalCourse {
  id: string; title: string; course_code: string | null; course_image_url: string | null;
  instructor_image_url: string | null; category: "Professional Training" | "University Subjects";
  learning_outcomes: string[] | null; instructor_name: string | null; location: string | null;
  start_date: string | null; timing: string | null; duration_weeks: number | null;
  price: number; discount_price: number | null; max_seats: number | null; enrolled_count: number | null;
  is_active: boolean; tutor_bio: string | null; batch_no: number | null;
  created_at: string; updated_at: string;
}
interface Enrollment {
  id: string; user_id: string; course_id: string; full_name: string; email: string;
  whatsapp_number: string; remarks: string; status: string; created_at: string;
  course_name: string; course_details_url: string; locked_price: number;
  starting_date: string; confirmed: boolean; is_confirmed?: boolean; paid_amount: number; remaining_amount: number;
  pending_amount: number; batch_no: number | null; order_id?: string | null;
}
interface Message {
  id: string; user_id: string; sender_role: string; content: string;
  created_at: string; is_read?: boolean;
  profiles?: { full_name: string; avatar_url: string; role: string; };
}
interface Certificate {
  id: string; name: string; email: string; syllabus_name: string;
  syllabus_id: number | null; issue_date: string; certificate_image: string;
  certificate_code: string; created_at: string; user_id?: string;
}
interface Order {
  id: string; full_name: string; email: string; contact_number: string;
  order_type: string; order_name: string; paid_amount: number; pending_amount: number;
  locked_price: number; screenshot_url: string; payment_screenshots: string[];
  status: string; created_at: string; updated_at?: string; user_id?: string;
  enrollment_id?: string;
}
interface PhysicalLead {
  id: string; course_id: string; course_code: string; course_title: string; category: string;
  full_name: string; phone: string; email: string | null; current_education: string | null;
  institution_name: string | null; office_location: string; course_price: number;
  discount_price: number | null; booking_amount: number | null; source: string;
  status: 'new' | 'contacted' | 'interested' | 'follow_up' | 'booked' | 'deposit_paid' | 'enrolled' | 'cancelled';
  remarks: string | null; counselor_notes: string | null; assigned_to: string | null;
  follow_up_date: string | null; batch_no: number | null; is_confirmed: boolean | null;
  created_at: string; updated_at: string; deleted: boolean; deleted_at: string | null; 
  pending_amount?: number;
}

function timeAgo(dateString: string) {
  const now = new Date();
  const past = new Date(dateString);
  const diffMins = Math.floor((now.getTime() - past.getTime()) / 60000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  return `${Math.floor(diffHrs / 24)}d ago`;
}

function isoDateOnly(d: Date) { return d.toISOString().slice(0, 10); }

/* ============================================================================
   CUSTOM HOOKS
============================================================================ */
function useSupabase() {
  return useMemo(() => createClient(), []);
}

function useMessages(supabase: any, enabled: boolean) {
  const [conversations, setConversations] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMessages = useCallback(async () => {
    const { data, error } = await supabase.from("messages").select("*").order("created_at", { ascending: false });
    if (error) {
      console.error("Messages Fetch Error:", error);
      setLoading(false);
      return;
    }
    if (data) {
      const userIds = [...new Set(data.map((m: any) => m.user_id))].filter(Boolean);
      let profileMap: Record<string, any> = {};
      if (userIds.length > 0) {
        const { data: profiles, error: profileErr } = await supabase.from('profiles').select('id, full_name, avatar_url, role').in('id', userIds);
        if (profileErr) console.error("Profiles Fetch Error:", profileErr);
        if (profiles) profiles.forEach((p: any) => { profileMap[p.id] = p; });
      }
      const unreadCounts: Record<string, number> = {};
      for (const msg of data) {
        if (msg.sender_role === 'user' && msg.is_read === false) unreadCounts[msg.user_id] = (unreadCounts[msg.user_id] || 0) + 1;
      }
      const uniqueConversations: Message[] = [];
      const seenUsers = new Set();
      for (const msg of data) {
        if (!seenUsers.has(msg.user_id)) {
          seenUsers.add(msg.user_id);
          const hasUnread = (unreadCounts[msg.user_id] || 0) > 0;
          uniqueConversations.push({ ...msg, is_read: !hasUnread, profiles: profileMap[msg.user_id] } as Message);
        }
      }
      setConversations(uniqueConversations);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    if (!enabled) return;
    fetchMessages();
    const channel = supabase.channel('admin_messages_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, fetchMessages)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [enabled, fetchMessages, supabase]);

  return { conversations, loading, refresh: fetchMessages };
}

function useOrdersAndEnrollments(supabase: any, enabled: boolean) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);

  const fetchData = useCallback(async () => {
    const [ordRes, enrRes] = await Promise.all([
      supabase.from("orders_v2").select("*").eq("deleted", false).order("created_at", { ascending: false }),
      supabase.from("enrollments_v2").select("*, course_batches_v2(syllabus_id, batch_no)").eq("deleted", false).order("created_at", { ascending: false })
    ]);

    if (ordRes.error) console.error("Orders Fetch Error:", ordRes.error);
    if (enrRes.error) console.error("Enrollments Fetch Error:", enrRes.error);

    const fetchedOrders = ordRes.data ? ordRes.data.map((o: any) => ({
      ...o, full_name: o.full_name || 'N/A', email: o.email || 'N/A', contact_number: o.whatsapp_number || o.contact_number || 'N/A',
      paid_amount: o.paid_amount ?? 0, pending_amount: o.pending_amount ?? 0, locked_price: o.locked_price ?? 0,
      order_type: o.order_type || 'Online Course', order_name: o.order_name || 'Course Enrollment', payment_screenshots: o.payment_screenshots || [],
      screenshot_url: o.payment_screenshots?.length > 0 ? o.payment_screenshots[o.payment_screenshots.length - 1] : o.screenshot_url,
      updated_at: o.updated_at || o.created_at,
    })) : [];

    setOrders(fetchedOrders);

    if (enrRes.data) {
      setEnrollments(enrRes.data.map((e: any) => {
        const linkedOrder = fetchedOrders.find((o: any) => o.enrollment_id === e.id);
        return {
          ...e, confirmed: e.is_confirmed !== undefined ? e.is_confirmed : e.confirmed,
          course_id: e.course_batches_v2?.syllabus_id?.toString() || e.course_id, batch_no: e.course_batches_v2?.batch_no || e.batch_no,
          locked_price: linkedOrder ? Number(linkedOrder.locked_price) : 0, paid_amount: linkedOrder ? Number(linkedOrder.paid_amount) : 0,
          pending_amount: linkedOrder ? Number(linkedOrder.pending_amount) : 0,
          remaining_amount: linkedOrder ? Number(linkedOrder.pending_amount) : 0, order_id: linkedOrder ? linkedOrder.id : null
        };
      }));
    }
  }, [supabase]);

  useEffect(() => {
    if (!enabled) return;
    fetchData();
    const channel = supabase.channel('admin_orders_enrollments')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders_v2' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'enrollments_v2' }, fetchData)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [enabled, fetchData, supabase]);

  return { orders, enrollments, refresh: fetchData };
}

function useCoursesAndBatches(supabase: any, enabled: boolean) {
  const [courses, setCourses] = useState<OnlineCourse[]>([]);
  const [batches, setBatches] = useState<CourseBatch[]>([]);
  const [syllabi, setSyllabi] = useState<any[]>([]);

  const fetchData = useCallback(async () => {
    const [curRes, batchRes, sylRes] = await Promise.all([
      supabase.from("online_courses_v2").select("*").order("created_at", { ascending: false }),
      supabase.from("course_batches_v2").select("*").order("batch_no", { ascending: false }),
      supabase.from("syllabi_v2").select("id, name")
    ]);

    if (curRes.error) console.error("Courses Fetch Error:", curRes.error);
    else setCourses(curRes.data.map((c: any) => ({ ...c, id: c.syllabus_id?.toString() || c.id, title: c.name || c.title })));

    if (batchRes.error) console.error("Batches Fetch Error:", batchRes.error);
    else setBatches(batchRes.data.map((b: any) => ({ ...b, course_id: b.syllabus_id?.toString() || b.course_id })));

    if (sylRes.error) console.error("Syllabi Fetch Error:", sylRes.error);
    else setSyllabi(sylRes.data);
  }, [supabase]);

  useEffect(() => {
    if (!enabled) return;
    fetchData();
    const channel = supabase.channel('admin_courses_batches')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'online_courses_v2' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'course_batches_v2' }, fetchData)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [enabled, fetchData, supabase]);

  return { courses, batches, syllabi, refresh: fetchData };
}

function usePhysical(supabase: any, enabled: boolean) {
  const [physicalCourses, setPhysicalCourses] = useState<PhysicalCourse[]>([]);
  const [physicalLeads, setPhysicalLeads] = useState<PhysicalLead[]>([]);

  const fetchData = useCallback(async () => {
    const [coursesRes, leadsRes] = await Promise.all([
      supabase.from("physicalcourses").select("*").order("created_at", { ascending: false }),
      supabase.from("physical_leads").select("*").eq("deleted", false).order("created_at", { ascending: false })
    ]);

    if (coursesRes.error) console.error("Physical Courses Fetch Error:", coursesRes.error);
    else setPhysicalCourses(coursesRes.data);

    if (leadsRes.error) console.error("Physical Leads Fetch Error:", leadsRes.error);
    else setPhysicalLeads(leadsRes.data);
  }, [supabase]);

  useEffect(() => {
    if (!enabled) return;
    fetchData();
    const channel = supabase.channel('admin_physical')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'physicalcourses' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'physical_leads' }, fetchData)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [enabled, fetchData, supabase]);

  return { physicalCourses, physicalLeads, refresh: fetchData };
}

function useCertificates(supabase: any, enabled: boolean) {
  const [certificates, setCertificates] = useState<Certificate[]>([]);

  const fetchCertificates = useCallback(async () => {
    const { data, error } = await supabase.from("certificates").select("*").eq("deleted", false).order("created_at", { ascending: false });
    if (error) console.error("Certificates Fetch Error:", error);
    else setCertificates(data);
  }, [supabase]);

  useEffect(() => {
    if (!enabled) return;
    fetchCertificates();
    const channel = supabase.channel('admin_certificates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'certificates' }, fetchCertificates)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [enabled, fetchCertificates, supabase]);

  return { certificates, refresh: fetchCertificates };
}

/* ============================================================================
   ROOT COMPONENT
============================================================================ */
export default function AdminDashboard() {
  const supabase = useSupabase();

  const [isLocked, setIsLocked] = useState(true);
  const [loginUser, setLoginUser] = useState("");
  const [loginPass, setLoginPass] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [activeTab, setActiveTab] = useState("Dashboard");
  
  const [chatOpen, setChatOpen] = useState(false);
  const [activeUser, setActiveUser] = useState<string | null>(null);

  // Initialize Admin State
  useEffect(() => {
    const checkAdmin = () => {
      const unlocked = localStorage.getItem('admin_unlocked');
      if (unlocked === 'true') setIsLocked(false);
      setLoadingAuth(false);
    };
    checkAdmin();
  }, []);

  // Isolate Data Domains
  const isUnlocked = !isLocked && !loadingAuth;
  const { conversations, loading: loadingConversations } = useMessages(supabase, isUnlocked);
  const { orders, enrollments, refresh: refreshOrdersAndEnr } = useOrdersAndEnrollments(supabase, isUnlocked);
  const { courses, batches, syllabi, refresh: refreshCoursesAndBatches } = useCoursesAndBatches(supabase, isUnlocked);
  const { physicalCourses, physicalLeads, refresh: refreshPhysical } = usePhysical(supabase, isUnlocked);
  const { certificates, refresh: refreshCertificates } = useCertificates(supabase, isUnlocked);

  const openChat = (userId: string) => {
    if (!userId) return;
    setActiveUser(userId);
    setChatOpen(true);
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginUser === "Nischal" && loginPass === "Xolox900") {
      setIsLocked(false);
      setLoginError("");
      localStorage.setItem('admin_unlocked', 'true');
    } else {
      setLoginError("Invalid username or password");
    }
  };

  const handleLogout = () => {
    setIsLocked(true);
    setLoginPass("");
    setLoginUser("");
    localStorage.removeItem('admin_unlocked');
  };

  if (loadingAuth) return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#14161F] text-[#B8862E]">
      <Loader2 className="animate-spin" size={40} />
    </div>
  );

  if (isLocked) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#14161F] px-4 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{ backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 27px, #B8862E 28px)" }} />
        <div className="bg-[#F6F3EC] p-10 rounded-2xl shadow-2xl max-w-sm w-full relative border border-[#E6E0D2]">
          <div className="absolute -top-9 left-1/2 -translate-x-1/2 h-16 w-16 bg-[#B8862E] rounded-full flex items-center justify-center border-4 border-[#14161F] shadow-xl">
            <Lock className="text-white" size={26} />
          </div>
          <p className="text-center text-[10px] font-bold uppercase tracking-[0.3em] text-[#B8862E] mt-8">Registrar Access</p>
          <h2 className="text-3xl font-serif font-bold text-center text-[#14161F] mt-1 mb-8">Ledger Locked</h2>
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-[#857D6E] uppercase tracking-widest mb-2">Username</label>
              <input type="text" value={loginUser} onChange={(e) => setLoginUser(e.target.value)} className="w-full bg-white p-3.5 rounded-lg outline-none border border-[#E6E0D2] focus:border-[#B8862E] font-medium text-[#14161F] transition-colors" placeholder="Username" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-[#857D6E] uppercase tracking-widest mb-2">Password</label>
              <input type="password" value={loginPass} onChange={(e) => setLoginPass(e.target.value)} className="w-full bg-white p-3.5 rounded-lg outline-none border border-[#E6E0D2] focus:border-[#B8862E] font-medium text-[#14161F] transition-colors" placeholder="Password" />
            </div>
            {loginError && <p className="text-[#B23B3B] text-xs font-bold text-center mt-2">{loginError}</p>}
            <button type="submit" className="w-full bg-[#14161F] hover:bg-[#22242F] text-white font-bold py-3.5 rounded-lg shadow-lg transition-all mt-4 tracking-wide">Unlock Dashboard</button>
          </form>
        </div>
      </div>
    );
  }

  const navItems = [
    { key: "Dashboard", label: "Inbox", icon: <LayoutDashboard size={18} /> },
    { key: "Orders", label: "Orders", icon: <ShoppingCart size={18} /> },
    { key: "Batch Management", label: "Batch Management", icon: <Layers size={18} /> },
    { key: "Bookings", label: "Bookings & Leads", icon: <CalendarDays size={18} /> },
    { key: "Certificates", label: "Certificates", icon: <Award size={18} /> },
  ];

  return (
    <div className="fixed inset-0 z-[9999] bg-[#F6F3EC] text-[#14161F] font-sans flex overflow-hidden">
      <aside className="w-72 bg-[#14161F] text-[#B4AF9F] flex flex-col h-full overflow-y-auto no-scrollbar border-r border-black/30 shrink-0">
        <div className="p-8 flex items-center gap-4">
          <div className="h-11 w-11 rounded-lg bg-[#B8862E] flex items-center justify-center text-[#14161F] font-serif font-bold text-lg shadow-lg">GH</div>
          <div>
            <p className="text-lg font-serif font-bold text-white tracking-tight leading-tight">The Registrar</p>
            <p className="text-[10px] uppercase tracking-[0.25em] text-[#B8862E]">Admin Ledger</p>
          </div>
        </div>
        <nav className="flex-1 px-4 space-y-1 mt-4 pb-10">
          {navItems.map(item => (
            <SidebarBtn key={item.key} icon={item.icon} label={item.label} active={activeTab === item.key} onClick={() => setActiveTab(item.key)} />
          ))}
        </nav>
        <div className="p-4 border-t border-white/10 shrink-0">
          <SidebarBtn icon={<LogOut size={18} />} label="Lock Screen" color="text-[#C97B6B] hover:bg-[#B23B3B]/10" onClick={handleLogout} />
        </div>
      </aside>

      <main className="flex-1 p-10 h-full relative overflow-y-auto">
        <AnimatePresence mode="wait">
          {activeTab === "Dashboard" && <DashboardView key="dash" conversations={conversations} loading={loadingConversations} onOpenChat={openChat} />}
          {activeTab === "Orders" && <OrdersManager key="ord" data={orders} refresh={refreshOrdersAndEnr} onOpenChat={openChat} />}
          {activeTab === "Batch Management" && <BatchManager key="batch" data={courses} batches={batches} physicalCourses={physicalCourses} refresh={() => { refreshCoursesAndBatches(); refreshPhysical(); }} />}
          {activeTab === "Bookings" && <BookingsManager key="book" courses={courses} enrollments={enrollments} batches={batches} syllabi={syllabi} physicalLeads={physicalLeads} physicalCourses={physicalCourses} orders={orders} refresh={() => { refreshOrdersAndEnr(); refreshPhysical(); refreshCoursesAndBatches(); }} onOpenChat={openChat} />}
          {activeTab === "Certificates" && <CertificatesManager key="cert" data={certificates} syllabi={syllabi} refresh={refreshCertificates} onOpenChat={openChat} />}
        </AnimatePresence>

        <AnimatePresence>
          {chatOpen && activeUser && (
            <ChatModal
              userId={activeUser}
              onClose={() => setChatOpen(false)}
              profilesMap={conversations.find(c => c.user_id === activeUser)?.profiles}
            />
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

/* ============================================================================
   SHARED PRIMITIVES
============================================================================ */
function SidebarBtn({ icon, label, active, onClick, color }: any) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-4 px-5 py-3.5 rounded-lg text-sm font-bold transition-all relative ${active ? "bg-white/[0.06] text-white" : `hover:bg-white/[0.04] ${color || "text-[#9C9788]"}`}`}>
      {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[#B8862E] rounded-r" />}
      {icon} <span>{label}</span>
    </button>
  );
}

function SectionHeader({ eyebrow, title, subtitle, action }: { eyebrow: string; title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="flex justify-between items-end flex-wrap gap-4 pb-5 border-b border-[#E6E0D2]">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#B8862E] mb-1">{eyebrow}</p>
        <h2 className="text-3xl font-serif font-bold text-[#14161F] tracking-tight">{title}</h2>
        {subtitle && <p className="text-[#857D6E] font-medium mt-1 text-sm">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

function SearchBar({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="relative w-full">
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#B4AF9F]" size={17} />
      <input type="text" placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} className="w-full pl-11 pr-4 py-3.5 bg-white rounded-xl border border-[#E6E0D2] shadow-sm outline-none focus:border-[#B8862E] focus:ring-2 focus:ring-[#B8862E]/10 transition-all font-medium text-[#14161F] text-sm" />
    </div>
  );
}

function ToggleSwitch({ checked, onChange, label, activeColor = '#0E7C7B' }: { checked: boolean, onChange: () => void, label?: string, activeColor?: string }) {
  return (
    <div className="flex items-center gap-2 cursor-pointer" onClick={(e) => { e.stopPropagation(); onChange(); }}>
      <div className="w-10 h-6 flex items-center rounded-full p-1 transition-colors duration-300" style={{ backgroundColor: checked ? activeColor : '#D8D2C2' }}>
        <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${checked ? 'translate-x-4' : 'translate-x-0'}`}></div>
      </div>
      {label && <span className="text-xs font-bold whitespace-nowrap" style={{ color: checked ? activeColor : '#857D6E' }}>{label}</span>}
    </div>
  );
}

/* ============================================================================
   DASHBOARD (INBOX)
============================================================================ */
function DashboardView({ conversations, loading, onOpenChat }: any) {
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const unreadCount = conversations.filter((c: any) => !c.is_read).length;
  const filteredData = conversations.filter((c: any) => {
    const isUnread = !c.is_read;
    const matchesFilter = filter === 'unread' ? isUnread : true;
    const searchLower = searchQuery.toLowerCase();
    const nameMatch = c.profiles?.full_name?.toLowerCase().includes(searchLower) || "unknown user".includes(searchLower);
    const contentMatch = c.content?.toLowerCase().includes(searchLower);
    return matchesFilter && (!searchQuery || nameMatch || contentMatch);
  });

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6 w-full max-w-full">
      <SectionHeader eyebrow="Correspondence" title="Inbox" subtitle="Every conversation with a user, in one line."
        action={
          <div className="flex bg-white p-1 rounded-lg border border-[#E6E0D2]">
            <button onClick={() => setFilter('all')} className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${filter === 'all' ? 'bg-[#14161F] text-white' : 'text-[#857D6E] hover:text-[#14161F]'}`}>All</button>
            <button onClick={() => setFilter('unread')} className={`px-4 py-2 rounded-md text-sm font-bold transition-all flex items-center gap-1.5 ${filter === 'unread' ? 'bg-[#14161F] text-white' : 'text-[#857D6E] hover:text-[#14161F]'}`}>
              Unread {unreadCount > 0 && <span className="bg-[#B23B3B] text-white text-[10px] px-1.5 py-0.5 rounded-full">{unreadCount}</span>}
            </button>
          </div>
        } />
      <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Search by name or message content..." />
      <div className="bg-white rounded-2xl shadow-sm border border-[#E6E0D2] overflow-hidden min-h-[400px]">
        {loading ? (
          <div className="flex items-center justify-center h-[400px] text-[#B4AF9F]"><Loader2 className="animate-spin" size={30} /></div>
        ) : filteredData.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[400px] text-[#B4AF9F]">
            <MessageSquare size={44} className="mb-4 opacity-40" />
            <p className="text-base font-bold">No {filter === 'unread' ? 'unread ' : ''}conversations found</p>
          </div>
        ) : (
          <div className="divide-y divide-[#EFEBE1]">
            {filteredData.map((msg: any) => {
              const isUnread = !msg.is_read;
              const name = msg.profiles?.full_name || "Unknown User";
              return (
                <div key={msg.id} onClick={() => onOpenChat(msg.user_id)} className="group flex items-center gap-4 p-5 hover:bg-[#FAF8F3] cursor-pointer transition-colors relative">
                  {isUnread && <div className="absolute left-3 w-2 h-2 bg-[#B23B3B] rounded-full"></div>}
                  <div className="w-12 h-12 rounded-full bg-[#EFEBE1] flex items-center justify-center font-bold text-[#857D6E] ml-2 overflow-hidden shrink-0">
                    {msg.profiles?.avatar_url ? <img src={msg.profiles.avatar_url} className="w-full h-full object-cover" alt="" /> : name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-1">
                      <h4 className={`text-sm font-bold truncate ${isUnread ? 'text-[#14161F]' : 'text-[#4A4638]'}`}>{name}</h4>
                      <span className="text-xs text-[#B4AF9F] whitespace-nowrap ml-4">{timeAgo(msg.created_at)}</span>
                    </div>
                    <p className={`text-sm truncate ${isUnread ? 'text-[#14161F] font-bold' : 'text-[#857D6E]'}`}>
                      {msg.sender_role === 'admin' && <span className="mr-1 text-[#0E7C7B]">You:</span>}{msg.content}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
}

/* ============================================================================
   ORDERS
============================================================================ */
type RangeKey = 'today' | '7d' | '30d' | 'all' | 'custom';

function OrderInsights({ data }: { data: Order[] }) {
  const [rangeKey, setRangeKey] = useState<RangeKey>('today');
  const [customFrom, setCustomFrom] = useState(isoDateOnly(new Date()));
  const [customTo, setCustomTo] = useState(isoDateOnly(new Date()));

  const { from, to } = useMemo(() => {
    const now = new Date();
    if (rangeKey === 'today') {
      const start = new Date(now); start.setHours(0, 0, 0, 0);
      const end = new Date(now); end.setHours(23, 59, 59, 999);
      return { from: start, to: end };
    }
    if (rangeKey === '7d') {
      const start = new Date(now); start.setDate(start.getDate() - 6); start.setHours(0, 0, 0, 0);
      return { from: start, to: now };
    }
    if (rangeKey === '30d') {
      const start = new Date(now); start.setDate(start.getDate() - 29); start.setHours(0, 0, 0, 0);
      return { from: start, to: now };
    }
    if (rangeKey === 'custom') {
      const start = new Date(customFrom + 'T00:00:00');
      const end = new Date(customTo + 'T23:59:59');
      return { from: start, to: end };
    }
    return { from: new Date(0), to: now };
  }, [rangeKey, customFrom, customTo]);

  const inRange = useMemo(() => data.filter(o => {
    const d = new Date(o.updated_at || o.created_at);
    return d >= from && d <= to;
  }), [data, from, to]);

  const verified = inRange.filter(o => o.status === 'verified');
  const totalVerifiedAmount = verified.reduce((s, o) => s + (o.paid_amount || 0), 0);
  const totalPendingAmount = inRange.reduce((s, o) => s + (o.pending_amount || 0), 0);

  const byType: Record<string, { verifiedAmount: number; count: number }> = {};
  verified.forEach(o => {
    const key = o.order_type || 'Other';
    if (!byType[key]) byType[key] = { verifiedAmount: 0, count: 0 };
    byType[key].verifiedAmount += (o.paid_amount || 0);
    byType[key].count += 1;
  });

  const rangeOptions: { key: RangeKey; label: string }[] = [
    { key: 'today', label: 'Today' },
    { key: '7d', label: '7 Days' },
    { key: '30d', label: '30 Days' },
    { key: 'all', label: 'All Time' },
    { key: 'custom', label: 'Custom' },
  ];

  return (
    <div className="bg-white rounded-2xl border border-[#E6E0D2] shadow-sm p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs font-bold uppercase tracking-widest text-[#857D6E] flex items-center gap-2"><TrendingUp size={14} className="text-[#B8862E]" /> Revenue Insights</p>
        <div className="flex bg-[#FAF8F3] p-1 rounded-lg border border-[#E6E0D2]">
          {rangeOptions.map(r => (
            <button key={r.key} onClick={() => setRangeKey(r.key)} className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${rangeKey === r.key ? 'bg-[#14161F] text-white' : 'text-[#857D6E] hover:text-[#14161F]'}`}>{r.label}</button>
          ))}
        </div>
      </div>

      {rangeKey === 'custom' && (
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <CalendarRange size={14} className="text-[#B4AF9F]" />
            <label className="text-[10px] font-bold uppercase text-[#857D6E]">From</label>
            <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)} className="bg-[#FAF8F3] border border-[#E6E0D2] rounded-lg px-3 py-2 text-xs font-bold text-[#14161F] outline-none focus:border-[#B8862E]" />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[10px] font-bold uppercase text-[#857D6E]">To</label>
            <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)} className="bg-[#FAF8F3] border border-[#E6E0D2] rounded-lg px-3 py-2 text-xs font-bold text-[#14161F] outline-none focus:border-[#B8862E]" />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-[#DCEEE6] border border-[#C3E3D5] rounded-xl p-4">
          <p className="text-[10px] font-bold uppercase text-[#1E8F6F]/80 mb-1">Verified Amount</p>
          <p className="text-2xl font-black text-[#1E8F6F]">Rs. {totalVerifiedAmount.toLocaleString()}</p>
          <p className="text-[10px] font-bold text-[#1E8F6F]/70 mt-1">{verified.length} verified order(s)</p>
        </div>
        <div className="bg-[#F5E7C8] border border-[#E9D6A2] rounded-xl p-4">
          <p className="text-[10px] font-bold uppercase text-[#8A6416]/80 mb-1">Pending Review</p>
          <p className="text-2xl font-black text-[#8A6416]">Rs. {totalPendingAmount.toLocaleString()}</p>
          <p className="text-[10px] font-bold text-[#8A6416]/70 mt-1">{inRange.filter(o => o.pending_amount > 0).length} order(s) awaiting review</p>
        </div>
        <div className="bg-[#FAF8F3] border border-[#E6E0D2] rounded-xl p-4">
          <p className="text-[10px] font-bold uppercase text-[#857D6E] mb-1">Orders Touched</p>
          <p className="text-2xl font-black text-[#14161F]">{inRange.length}</p>
          <p className="text-[10px] font-bold text-[#857D6E] mt-1">in selected range</p>
        </div>
      </div>

      <div>
        <p className="text-[10px] font-bold uppercase text-[#857D6E] mb-2 flex items-center gap-1.5"><PieChart size={12} /> Verified Amount by Order Type</p>
        {Object.keys(byType).length === 0 ? (
          <p className="text-xs text-[#B4AF9F] italic">No verified orders in this range.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {Object.entries(byType).map(([type, v]) => (
              <div key={type} className="bg-[#0E7C7B]/10 border border-[#0E7C7B]/20 rounded-lg px-3 py-2 flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase text-[#0E7C7B]">{type}</span>
                <span className="text-sm font-black text-[#0E7C7B]">Rs. {v.verifiedAmount.toLocaleString()}</span>
                <span className="text-[10px] font-bold text-[#0E7C7B]/70">({v.count})</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function OrdersManager({ data, refresh, onOpenChat }: { data: Order[], refresh: () => void, onOpenChat: (id: string) => void }) {
  const supabase = useSupabase();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'verified' | 'rejected'>('all');
  const [orderTypeFilter, setOrderTypeFilter] = useState<'all' | 'recording' | 'Online Course' | 'physical' | 'others'>('all');
  const [showAllOrders, setShowAllOrders] = useState(true);

  const filteredData = data.filter((o: Order) => {
    if (o.paid_amount === 0 && o.pending_amount === 0) return false;
    const s = searchQuery.toLowerCase();
    const matchesSearch = (o.full_name && o.full_name.toLowerCase().includes(s)) || (o.email && o.email.toLowerCase().includes(s)) || (o.order_name && o.order_name.toLowerCase().includes(s));
    const matchesStatus = statusFilter === 'all' ? true :
      (statusFilter === 'pending' && (o.status === 'pending' || o.pending_amount > 0)) ? true :
      (statusFilter === 'verified' && o.status === 'verified' && o.pending_amount === 0) ? true : o.status === statusFilter;
    let matchesType = true;
    if (orderTypeFilter !== 'all') {
      const lowerType = o.order_type?.toLowerCase() || '';
      if (orderTypeFilter === 'recording') matchesType = lowerType.includes('recording');
      else if (orderTypeFilter === 'Online Course') matchesType = lowerType.includes('online') || (lowerType.includes('course') && !lowerType.includes('physical'));
      else if (orderTypeFilter === 'physical') matchesType = lowerType.includes('physical');
      else if (orderTypeFilter === 'others') matchesType = !lowerType.includes('recording') && !lowerType.includes('course') && !lowerType.includes('physical');
    }
    let matchesDate = true;
    if (!showAllOrders) {
      const threeDaysAgo = new Date(); threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      matchesDate = new Date(o.updated_at || o.created_at) >= threeDaysAgo;
    }
    return matchesSearch && matchesStatus && matchesType && matchesDate;
  });

  const confirmRelatedEntities = async (enrollmentId: string) => {
    await supabase.from('enrollments_v2').update({ is_confirmed: true }).eq('id', enrollmentId);
    await supabase.from('physical_leads').update({ is_confirmed: true } as any).eq('id', enrollmentId);
  };

  const handleStatusChange = async (orderId: string, newStatus: string, enrollmentId?: string) => {
    const { error } = await supabase.from('orders_v2').update({ status: newStatus, updated_at: new Date().toISOString() }).eq('id', orderId);
    if (!error && newStatus === 'verified' && enrollmentId) {
      await confirmRelatedEntities(enrollmentId);
    }
    if (error) alert("Status update failed: " + error.message); else refresh();
  };

  const handleVerifyPayment = async (order: Order) => {
    if (order.pending_amount <= 0) return;
    if (!confirm(`Verify Rs. ${order.pending_amount} for ${order.full_name}?`)) return;
    const newPaid = order.paid_amount + order.pending_amount;
    const { error } = await supabase.from('orders_v2').update({ paid_amount: newPaid, pending_amount: 0, status: 'verified', updated_at: new Date().toISOString() }).eq('id', order.id);
    
    if (!error && order.enrollment_id) {
      await confirmRelatedEntities(order.enrollment_id);
    }
    
    if (error) alert("Verification failed: " + error.message); else { refresh(); setSelectedOrder(null); }
  };

  const handleRejectPayment = async (order: Order) => {
    if (order.pending_amount <= 0) return;
    if (!confirm(`Reject pending payment of Rs. ${order.pending_amount} for ${order.full_name}?`)) return;
    const newStatus = order.paid_amount > 0 ? 'verified' : 'rejected';
    const { error } = await supabase.from('orders_v2').update({ pending_amount: 0, status: newStatus, updated_at: new Date().toISOString() }).eq('id', order.id);
    if (error) alert("Rejection failed: " + error.message); else { refresh(); setSelectedOrder(null); }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Remove this order from the ledger? (It will be archived, not permanently erased.)")) {
      const { error } = await supabase.from('orders_v2').update({ deleted: true, updated_at: new Date().toISOString() }).eq('id', id);
      if (error) alert("Archive failed: " + error.message); else refresh();
    }
  };

  const statusColors: any = { pending: 'bg-[#F5E7C8] text-[#8A6416] border-[#E9D6A2]', verified: 'bg-[#DCEEE6] text-[#1E8F6F] border-[#C3E3D5]', rejected: 'bg-[#F3DAD6] text-[#B23B3B] border-[#EAC2BC]' };

  const getImageUrl = (path: string) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    const { data } = supabase.storage.from('others').getPublicUrl(path);
    return data.publicUrl;
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 w-full">
      <SectionHeader eyebrow="Finance" title="Orders & Invoices" subtitle="Verify payments and reconcile accounts." />

      <OrderInsights data={data} />

      <div className="flex flex-wrap gap-3 items-center w-full">
        <div className="flex-1 min-w-[250px]"><SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Search by name, email, or order name..." /></div>
        <select className="bg-white border border-[#E6E0D2] rounded-xl px-4 py-3 text-sm font-bold text-[#14161F] outline-none shadow-sm cursor-pointer" value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)}>
          <option value="all">All Status</option><option value="pending">Needs Review (Pending)</option><option value="verified">Verified Only</option><option value="rejected">Rejected Only</option>
        </select>
        <select className="bg-white border border-[#E6E0D2] rounded-xl px-4 py-3 text-sm font-bold text-[#14161F] outline-none shadow-sm cursor-pointer" value={orderTypeFilter} onChange={e => setOrderTypeFilter(e.target.value as any)}>
          <option value="all">All Types</option><option value="recording">Recording</option><option value="Online Course">Online Course</option><option value="physical">Physical Class</option><option value="others">Others</option>
        </select>
        <label className="flex items-center gap-2 cursor-pointer text-sm font-bold text-[#4A4638] bg-white border border-[#E6E0D2] px-4 py-3 rounded-xl shadow-sm whitespace-nowrap">
          <input type="checkbox" checked={showAllOrders} onChange={(e) => setShowAllOrders(e.target.checked)} className="w-4 h-4 rounded accent-[#B8862E] cursor-pointer" />
          Show All Time
        </label>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-[#E6E0D2] overflow-x-auto w-full">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#FAF8F3] border-b border-[#E6E0D2] text-[10px] font-bold text-[#857D6E] uppercase tracking-widest">
              <th className="p-5">Last Updated</th><th className="p-5">Customer</th><th className="p-5">Order Info</th><th className="p-5">Approval</th><th className="p-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map(order => {
              const remainingAmount = Math.max(0, order.locked_price - order.paid_amount - order.pending_amount);
              return (
                <tr key={order.id} className="border-b border-[#EFEBE1] hover:bg-[#FAF8F3] cursor-pointer" onClick={() => setSelectedOrder(order)}>
                  <td className="p-5 text-sm text-[#857D6E] font-bold whitespace-nowrap align-top">
                    {new Date(order.updated_at || order.created_at).toLocaleDateString()}
                    <p className="text-[10px] font-medium text-[#B4AF9F] mt-0.5">{timeAgo(order.updated_at || order.created_at)}</p>
                  </td>
                  <td className="p-5 align-top">
                    <p className="font-bold text-[#14161F] cursor-pointer hover:text-[#0E7C7B] hover:underline" onClick={(e) => { e.stopPropagation(); order.user_id ? onOpenChat(order.user_id) : alert('No linked user account found for this order.'); }}>{order.full_name}</p>
                    <p className="text-xs text-[#857D6E] mt-1">{order.contact_number}</p>
                    <p className="text-xs text-[#857D6E]">{order.email}</p>
                  </td>
                  <td className="p-5 align-top">
                    <p className="font-bold text-[#4A4638] flex items-center gap-2 flex-wrap mb-2">
                      <span className="uppercase text-[10px] tracking-widest bg-[#EFEBE1] px-2 py-1 rounded text-[#857D6E] whitespace-nowrap">{order.order_type}</span>
                    </p>
                    <div className="mt-2 mb-2">
                      {order.pending_amount > 0 && (
                        <div className="mb-2 bg-[#F5E7C8] text-[#8A6416] px-3 py-1.5 rounded-lg border border-[#E9D6A2] text-[10px] font-bold uppercase inline-flex items-center gap-1">
                          <AlertCircle size={13} /> Pending: Rs. {order.pending_amount}
                        </div>
                      )}
                      <details className="group [&_summary::-webkit-details-marker]:hidden" onClick={(e) => e.stopPropagation()}>
                        <summary className="flex items-center gap-1 cursor-pointer text-[10px] font-bold uppercase text-[#0E7C7B] bg-[#0E7C7B]/10 px-3 py-1.5 rounded-lg w-fit hover:bg-[#0E7C7B]/20 transition-colors border border-[#0E7C7B]/20">
                          Financial Details <ChevronDown size={13} className="group-open:rotate-180 transition-transform" />
                        </summary>
                        <div className="flex flex-col gap-1.5 mt-2 bg-[#FAF8F3] p-3 rounded-xl border border-[#E6E0D2] min-w-[220px]">
                          <div className="flex justify-between items-center text-xs"><span className="font-bold text-[#857D6E]">Paid:</span><span className="font-bold text-[#1E8F6F]">Rs.{order.paid_amount} <span className="text-[#B4AF9F] font-medium">/ Rs.{order.locked_price}</span></span></div>
                          <div className="flex justify-between items-center text-xs"><span className="font-bold text-[#857D6E]">Pending:</span><span className="font-bold text-[#C08A28]">Rs.{order.pending_amount} <span className="text-[#D8C58F] font-medium">/ Rs.{order.locked_price}</span></span></div>
                          <div className="flex justify-between items-center text-xs border-t border-[#E6E0D2] pt-1.5 mt-0.5"><span className="font-bold text-[#857D6E]">Remaining:</span><span className="font-bold text-[#B23B3B]">Rs.{remainingAmount} <span className="text-[#D9A9A2] font-medium">/ Rs.{order.locked_price}</span></span></div>
                        </div>
                      </details>
                    </div>
                    <p className="text-xs font-medium text-[#857D6E] truncate max-w-[250px]" title={order.order_name}>Target: {order.order_name}</p>
                  </td>
                  <td className="p-5 align-top" onClick={(e) => e.stopPropagation()}>
                    <div className="flex flex-col gap-3">
                      <div className="relative inline-block w-full max-w-[140px]">
                        <select value={order.status} onChange={(e) => handleStatusChange(order.id, e.target.value, order.enrollment_id)} className={`appearance-none w-full px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider outline-none cursor-pointer border shadow-sm transition-all hover:opacity-80 ${statusColors[order.status] || 'bg-[#EFEBE1] text-[#4A4638] border-[#E6E0D2]'}`}>
                          <option value="pending">PENDING</option><option value="verified">VERIFIED</option><option value="rejected">REJECTED</option>
                        </select>
                        <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-50" />
                      </div>
                      {order.pending_amount > 0 && (
                        <div className="flex flex-col gap-1.5 mt-1 border-t border-[#E6E0D2] pt-3">
                          <button onClick={() => handleVerifyPayment(order)} className="px-3 py-1.5 bg-[#1E8F6F] text-white text-[10px] font-bold rounded shadow-sm hover:opacity-90 flex items-center justify-center gap-1"><CheckSquare size={12} /> Verify Funds</button>
                          <button onClick={() => handleRejectPayment(order)} className="px-3 py-1.5 bg-[#F3DAD6] text-[#B23B3B] text-[10px] font-bold rounded shadow-sm hover:opacity-90">Reject Funds</button>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="p-5 text-right align-top" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-end items-center gap-3 mt-2">
                      <button onClick={() => handleDelete(order.id)} className="p-2 text-[#B23B3B] bg-[#F3DAD6] rounded-lg hover:opacity-80 transition-colors" title="Archive Order"><Archive size={15} /></button>
                      <span className="text-sm font-bold text-[#0E7C7B] hover:opacity-80 whitespace-nowrap cursor-pointer" onClick={(e) => { e.stopPropagation(); setSelectedOrder(order); }}>View Details</span>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filteredData.length === 0 && <tr><td colSpan={5} className="p-6 text-center text-[#857D6E]">No orders found.</td></tr>}
          </tbody>
        </table>
      </div>

      {selectedOrder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#14161F]/60 p-4 backdrop-blur-sm" onClick={() => setSelectedOrder(null)}>
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full relative overflow-y-auto max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <button onClick={() => setSelectedOrder(null)} className="absolute top-6 right-6 text-[#B4AF9F] hover:text-[#14161F]"><X /></button>
            <h3 className="text-2xl font-serif font-bold mb-6 flex items-center gap-2">Order Details <span className={`text-[10px] uppercase tracking-widest px-2 py-1 rounded-full border font-sans ${statusColors[selectedOrder.status] || 'bg-[#EFEBE1] text-[#4A4638]'}`}>{selectedOrder.status}</span></h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 text-sm font-medium text-[#4A4638]">
              <div className="bg-[#FAF8F3] p-4 rounded-xl border border-[#E6E0D2] flex flex-col justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase text-[#B4AF9F] mb-2">Customer Info</p>
                  <p><span className="font-bold text-[#14161F]">Name:</span> <span className="cursor-pointer hover:text-[#0E7C7B] hover:underline" onClick={() => selectedOrder.user_id ? onOpenChat(selectedOrder.user_id) : alert('No linked user account.')}>{selectedOrder.full_name}</span></p>
                  <p className="break-all"><span className="font-bold text-[#14161F]">Email:</span> {selectedOrder.email}</p>
                  <p><span className="font-bold text-[#14161F]">Phone:</span> {selectedOrder.contact_number}</p>
                </div>
                <a href={`https://wa.me/${(selectedOrder.contact_number || '').replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="mt-4 flex items-center justify-center gap-2 bg-[#25D366] hover:opacity-90 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition-colors w-full">
                  <MessageCircle size={16} /> Contact via WhatsApp
                </a>
              </div>
              <div className="bg-[#FAF8F3] p-4 rounded-xl border border-[#E6E0D2] space-y-2 relative">
                {selectedOrder.pending_amount > 0 && <div className="absolute -top-3 -right-3 bg-[#C08A28] text-white rounded-full p-2 shadow-lg"><AlertCircle size={16} /></div>}
                <p className="text-[10px] font-bold uppercase text-[#B4AF9F] mb-2">Order Info</p>
                <p><span className="font-bold text-[#14161F]">Type:</span> <span className="uppercase">{selectedOrder.order_type}</span></p>
                <p><span className="font-bold text-[#14161F]">Order Name:</span> {selectedOrder.order_name}</p>
                <p><span className="font-bold text-[#14161F] text-[#1E8F6F]">Verified Paid:</span> Rs. {selectedOrder.paid_amount} / Rs. {selectedOrder.locked_price}</p>
                <p><span className="font-bold text-[#14161F] text-[#C08A28]">Pending Review:</span> Rs. {selectedOrder.pending_amount} / Rs. {selectedOrder.locked_price}</p>
                <p><span className="font-bold text-[#14161F] text-[#B23B3B]">Remaining Due:</span> Rs. {Math.max(0, selectedOrder.locked_price - selectedOrder.paid_amount - selectedOrder.pending_amount)}</p>
                <p className="pt-2 border-t border-[#E6E0D2] mt-2"><span className="font-bold text-[#14161F]">Created:</span> {new Date(selectedOrder.created_at).toLocaleString()}</p>
                <p><span className="font-bold text-[#14161F]">Last Updated:</span> {new Date(selectedOrder.updated_at || selectedOrder.created_at).toLocaleString()}</p>
              </div>
            </div>
            {selectedOrder.pending_amount > 0 && (
              <div className="bg-[#F5E7C8] p-4 rounded-xl border border-[#E9D6A2] flex items-center justify-between gap-4 mb-6">
                <div><p className="text-[#8A6416] font-bold text-sm">Action Required</p><p className="text-[#8A6416]/80 text-xs font-medium">Verify the screenshot below to approve Rs. {selectedOrder.pending_amount}.</p></div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => handleVerifyPayment(selectedOrder)} className="px-4 py-2 bg-[#1E8F6F] text-white text-xs font-bold rounded-lg shadow hover:opacity-90 flex items-center gap-1"><CheckSquare size={14} /> Verify</button>
                  <button onClick={() => handleRejectPayment(selectedOrder)} className="px-4 py-2 bg-[#F3DAD6] text-[#B23B3B] text-xs font-bold rounded-lg shadow hover:opacity-90">Reject</button>
                </div>
              </div>
            )}
            <div className="bg-[#FAF8F3] p-4 rounded-xl border border-[#E6E0D2] flex flex-col items-center">
              <p className="text-[10px] font-bold uppercase text-[#B4AF9F] mb-4 w-full">Payment Screenshots ({selectedOrder.payment_screenshots?.length || (selectedOrder.screenshot_url ? 1 : 0)})</p>
              {selectedOrder.payment_screenshots && selectedOrder.payment_screenshots.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                  {selectedOrder.payment_screenshots.map((path, idx) => (
                    <a key={idx} href={getImageUrl(path)} target="_blank" rel="noreferrer" className="block max-w-full relative group">
                      <div className="absolute top-2 left-2 bg-[#14161F]/70 text-white text-[10px] font-bold px-2 py-1 rounded-md z-10 backdrop-blur-md">Upload {idx + 1}</div>
                      <img src={getImageUrl(path)} alt={`Payment Receipt ${idx + 1}`} className="rounded-lg shadow-sm border border-[#E6E0D2] w-full h-48 object-cover cursor-zoom-in group-hover:opacity-90 transition-opacity" />
                    </a>
                  ))}
                </div>
              ) : selectedOrder.screenshot_url ? (
                <a href={getImageUrl(selectedOrder.screenshot_url)} target="_blank" rel="noreferrer" className="block max-w-full">
                  <img src={getImageUrl(selectedOrder.screenshot_url)} alt="Payment Receipt" className="rounded-lg shadow-sm border border-[#E6E0D2] max-h-96 object-contain cursor-zoom-in" />
                </a>
              ) : <p className="text-[#B4AF9F] italic py-4">No screenshot provided.</p>}
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}

/* ============================================================================
   BATCH MANAGEMENT
============================================================================ */
function BatchManager({ data, batches, physicalCourses, refresh }: { data: OnlineCourse[], batches: CourseBatch[], physicalCourses: PhysicalCourse[], refresh: () => void }) {
  const [courseType, setCourseType] = useState<'online' | 'physical'>('online');

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 w-full">
      <SectionHeader
        eyebrow="Curriculum"
        title="Batch Management"
        subtitle="Configure course pricing, batches, and physical class offerings."
        action={
          <div className="flex bg-white p-1 rounded-xl border border-[#E6E0D2] shadow-sm">
            <button onClick={() => setCourseType('online')} className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${courseType === 'online' ? 'bg-[#0E7C7B] text-white shadow' : 'text-[#857D6E] hover:text-[#14161F]'}`}>
              <Globe2 size={15} /> Online Courses
            </button>
            <button onClick={() => setCourseType('physical')} className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${courseType === 'physical' ? 'bg-[#B8543D] text-white shadow' : 'text-[#857D6E] hover:text-[#14161F]'}`}>
              <Building2 size={15} /> Physical Courses
            </button>
          </div>
        }
      />
      {courseType === 'online' ? (
        <OnlineBatchManager data={data} batches={batches} refresh={refresh} />
      ) : (
        <PhysicalCoursesManager data={physicalCourses} refresh={refresh} />
      )}
    </motion.div>
  );
}

function OnlineBatchManager({ data, batches, refresh }: { data: OnlineCourse[], batches: CourseBatch[], refresh: () => void }) {
  const supabase = useSupabase();
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [courseModalOpen, setCourseModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Partial<OnlineCourse>>({});
  const [batchModalOpen, setBatchModalOpen] = useState(false);
  const [editingBatch, setEditingBatch] = useState<Partial<CourseBatch>>({});

  const openCourseEdit = (course: OnlineCourse) => { setEditingCourse({ ...course }); setCourseModalOpen(true); };

  const saveCourse = async () => {
    if (!editingCourse.id) return;
    const { error } = await supabase.from('online_courses_v2').update({
      name: editingCourse.title, fee: Number(editingCourse.fee), discount: Number(editingCourse.discount),
      active_batch_no: Number(editingCourse.active_batch_no), is_active: editingCourse.is_active
    }).eq('syllabus_id', editingCourse.id);
    if (error) { alert("Course Update Error: " + error.message); return; }
    setCourseModalOpen(false); refresh();
  };

  const toggleCourseStatus = async (course: OnlineCourse) => {
    const { error } = await supabase.from('online_courses_v2').update({ is_active: !course.is_active }).eq('syllabus_id', course.id);
    if (error) alert(error.message); else refresh();
  };

  const openBatchEdit = (batch: Partial<CourseBatch>, courseId: string, courseName: string) => {
    setEditingBatch({ ...batch, course_id: courseId, course_name: courseName, is_active: batch.is_active ?? true });
    setBatchModalOpen(true);
  };

  const saveBatch = async () => {
    if (!editingBatch.course_id || !editingBatch.batch_no) { alert("Syllabus ID and Batch No are required."); return; }
    const payload = {
      syllabus_id: editingBatch.course_id, course_name: editingBatch.course_name, batch_no: editingBatch.batch_no,
      start_datetime: editingBatch.start_datetime || null, timing: editingBatch.timing || null,
      online_class_link: editingBatch.online_class_link || null, google_classroom_link: editingBatch.google_classroom_link || null,
      whatsapp_group_link: editingBatch.whatsapp_group_link || null, is_active: editingBatch.is_active
    };
    if (editingBatch.id) {
      const { error } = await supabase.from('course_batches_v2').update(payload).eq('id', editingBatch.id);
      if (error) { alert("Batch Update Error: " + error.message); return; }
    } else {
      const { error } = await supabase.from('course_batches_v2').insert([payload]);
      if (error) { alert("Batch Create Error: " + error.message); return; }
    }
    setBatchModalOpen(false); refresh();
  };

  const toggleBatchStatus = async (batch: CourseBatch) => {
    const { error } = await supabase.from('course_batches_v2').update({ is_active: !batch.is_active }).eq('id', batch.id);
    if (error) alert(error.message); else refresh();
  };

  if (selectedCourseId) {
    const selectedCourse = data.find(c => c.id === selectedCourseId);
    if (!selectedCourse) return <p>Course not found</p>;
    const courseBatches = batches.filter(b => b.course_id === selectedCourseId).sort((a, b) => {
      const timeA = a.start_datetime ? new Date(a.start_datetime).getTime() : 0;
      const timeB = b.start_datetime ? new Date(b.start_datetime).getTime() : 0;
      return timeB - timeA;
    });

    return (
      <div className="space-y-6 w-full">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <button onClick={() => setSelectedCourseId(null)} className="p-3 bg-white border border-[#E6E0D2] rounded-xl hover:bg-[#FAF8F3] transition-colors shadow-sm"><ArrowLeft size={19} className="text-[#4A4638]" /></button>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#B8862E] mb-1">Batch Management</p>
              <h2 className="text-2xl font-serif font-bold text-[#14161F]">{selectedCourse.title}</h2>
            </div>
          </div>
          <button onClick={() => openBatchEdit({ batch_no: (courseBatches[0]?.batch_no || 0) + 1 }, selectedCourse.id, selectedCourse.title)} className="bg-[#14161F] text-white px-5 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg hover:bg-[#22242F] transition-all whitespace-nowrap">
            <Plus size={17} /> Create New Batch
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-[#E6E0D2] overflow-x-auto w-full">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#FAF8F3] border-b border-[#E6E0D2] text-[10px] font-bold text-[#857D6E] uppercase tracking-widest">
                <th className="p-5 w-24 text-center">Batch No</th><th className="p-5">Schedule</th><th className="p-5">Platform Links</th><th className="p-5">Status</th><th className="p-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {courseBatches.map(batch => (
                <tr key={batch.id} className="border-b border-[#EFEBE1] hover:bg-[#FAF8F3]">
                  <td className="p-5 text-center"><span className="w-10 h-10 mx-auto bg-[#0E7C7B]/10 text-[#0E7C7B] rounded-xl flex items-center justify-center font-bold text-lg">{batch.batch_no}</span></td>
                  <td className="p-5">
                    <p className="font-bold text-[#14161F] flex items-center gap-2"><Clock size={13} className="text-[#B4AF9F]" /> {batch.start_datetime ? new Date(batch.start_datetime).toLocaleString() : 'No Start Date Set'}</p>
                    <p className="text-sm text-[#857D6E] mt-1">Timing: {batch.timing || 'TBD'}</p>
                  </td>
                  <td className="p-5 space-y-1">
                    {batch.online_class_link ? <a href={batch.online_class_link} target="_blank" className="text-sm font-bold text-[#0E7C7B] hover:underline flex items-center gap-1"><Monitor size={12} /> Class Link</a> : <p className="text-xs text-[#B4AF9F]">No Class Link</p>}
                    {batch.google_classroom_link ? <a href={batch.google_classroom_link} target="_blank" className="text-sm font-bold text-[#1E8F6F] hover:underline flex items-center gap-1"><GraduationCap size={12} /> Classroom</a> : <p className="text-xs text-[#B4AF9F]">No Classroom Link</p>}
                    {batch.whatsapp_group_link ? <a href={batch.whatsapp_group_link} target="_blank" className="text-sm font-bold text-[#25D366] hover:underline flex items-center gap-1"><MessageCircle size={12} /> WhatsApp Group</a> : <p className="text-xs text-[#B4AF9F]">No WA Link</p>}
                  </td>
                  <td className="p-5"><ToggleSwitch checked={batch.is_active} onChange={() => toggleBatchStatus(batch)} label={batch.is_active ? 'Active' : 'Archived'} /></td>
                  <td className="p-5 text-right"><button onClick={() => openBatchEdit(batch, selectedCourse.id, selectedCourse.title)} className="p-2 text-[#0E7C7B] bg-[#0E7C7B]/10 rounded-lg hover:bg-[#0E7C7B]/20" title="Edit Batch"><Edit2 size={15} /></button></td>
                </tr>
              ))}
              {courseBatches.length === 0 && <tr><td colSpan={5} className="p-10 text-center text-[#857D6E]">No batches created for this course yet.</td></tr>}
            </tbody>
          </table>
        </div>

        {batchModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#14161F]/60 p-4 backdrop-blur-sm" onClick={() => setBatchModalOpen(false)}>
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full relative overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
              <button onClick={() => setBatchModalOpen(false)} className="absolute top-6 right-6 text-[#B4AF9F] hover:text-[#14161F] z-10"><X /></button>
              <div className="p-6 border-b border-[#E6E0D2] bg-[#FAF8F3] mt-4">
                <h3 className="text-2xl font-serif font-bold text-[#14161F]">{editingBatch.id ? `Edit Batch ${editingBatch.batch_no}` : 'Create New Batch'}</h3>
                <p className="text-sm text-[#857D6E] font-medium mt-1">{selectedCourse.title}</p>
              </div>
              <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto no-scrollbar">
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-[10px] font-bold text-[#857D6E] uppercase mb-1 ml-1">Batch Number</label><input type="number" className="w-full bg-[#FAF8F3] p-3.5 rounded-xl outline-none border border-[#E6E0D2] focus:border-[#B8862E] font-bold text-[#14161F] text-sm" value={editingBatch.batch_no || ''} onChange={e => setEditingBatch({ ...editingBatch, batch_no: Number(e.target.value) })} /></div>
                  <div><label className="block text-[10px] font-bold text-[#857D6E] uppercase mb-1 ml-1">Status</label><div className="pt-2"><ToggleSwitch checked={!!editingBatch.is_active} onChange={() => setEditingBatch({ ...editingBatch, is_active: !editingBatch.is_active })} label={editingBatch.is_active ? 'Active' : 'Inactive'} /></div></div>
                </div>
                <div><label className="block text-[10px] font-bold text-[#857D6E] uppercase mb-1 ml-1">Start Date & Time</label><input type="datetime-local" className="w-full bg-[#FAF8F3] p-3.5 rounded-xl outline-none border border-[#E6E0D2] focus:border-[#B8862E] font-bold text-[#14161F] text-sm" value={editingBatch.start_datetime ? new Date(new Date(editingBatch.start_datetime).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ''} onChange={e => setEditingBatch({ ...editingBatch, start_datetime: new Date(e.target.value).toISOString() })} /></div>
                <div><label className="block text-[10px] font-bold text-[#857D6E] uppercase mb-1 ml-1">Timing Description</label><input type="text" className="w-full bg-[#FAF8F3] p-3.5 rounded-xl outline-none border border-[#E6E0D2] focus:border-[#B8862E] font-bold text-[#14161F] text-sm" value={editingBatch.timing || ''} onChange={e => setEditingBatch({ ...editingBatch, timing: e.target.value })} placeholder='e.g., 8:00 PM to 9:30 PM' /></div>
                <hr className="border-[#E6E0D2] my-2" />
                <div><label className="block text-[10px] font-bold text-[#857D6E] uppercase mb-1 ml-1">Online Class Link</label><input type="text" className="w-full bg-[#FAF8F3] p-3.5 rounded-xl outline-none border border-[#E6E0D2] focus:border-[#B8862E] font-medium text-[#14161F] text-sm" value={editingBatch.online_class_link || ''} onChange={e => setEditingBatch({ ...editingBatch, online_class_link: e.target.value })} placeholder="https://meet.google.com/..." /></div>
                <div><label className="block text-[10px] font-bold text-[#857D6E] uppercase mb-1 ml-1">Google Classroom Link</label><input type="text" className="w-full bg-[#FAF8F3] p-3.5 rounded-xl outline-none border border-[#E6E0D2] focus:border-[#B8862E] font-medium text-[#14161F] text-sm" value={editingBatch.google_classroom_link || ''} onChange={e => setEditingBatch({ ...editingBatch, google_classroom_link: e.target.value })} placeholder="https://classroom.google.com/..." /></div>
                <div><label className="block text-[10px] font-bold text-[#857D6E] uppercase mb-1 ml-1">WhatsApp Group Link</label><input type="text" className="w-full bg-[#FAF8F3] p-3.5 rounded-xl outline-none border border-[#E6E0D2] focus:border-[#B8862E] font-medium text-[#14161F] text-sm" value={editingBatch.whatsapp_group_link || ''} onChange={e => setEditingBatch({ ...editingBatch, whatsapp_group_link: e.target.value })} placeholder="https://chat.whatsapp.com/..." /></div>
              </div>
              <div className="p-6 border-t border-[#E6E0D2] bg-[#FAF8F3] flex justify-end gap-3 shrink-0">
                <button onClick={() => setBatchModalOpen(false)} className="px-6 py-3 font-bold text-[#857D6E] hover:text-[#14161F]">Cancel</button>
                <button onClick={saveBatch} className="px-8 py-3 rounded-xl font-bold bg-[#14161F] text-white shadow-lg hover:bg-[#22242F] transition-colors">Save Batch</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full">
      <div className="bg-white rounded-2xl shadow-sm border border-[#E6E0D2] overflow-x-auto w-full">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#FAF8F3] border-b border-[#E6E0D2] text-[10px] font-bold text-[#857D6E] uppercase tracking-widest">
              <th className="p-5">Course</th><th className="p-5">Pricing</th><th className="p-5 text-center">Active Batch</th><th className="p-5 text-center">Status</th><th className="p-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.map(course => (
              <tr key={course.id} className="border-b border-[#EFEBE1] hover:bg-[#FAF8F3] cursor-pointer" onClick={() => openCourseEdit(course)}>
                <td className="p-5"><p className="font-bold text-[#14161F] text-base">{course.title}</p><p className="text-xs text-[#B4AF9F] font-mono mt-1">ID: {course.id}</p></td>
                <td className="p-5 whitespace-nowrap"><p className="font-bold text-[#4A4638]">Rs. {course.fee}</p>{course.discount > 0 ? <p className="text-xs text-[#1E8F6F] font-bold bg-[#DCEEE6] px-2 py-0.5 rounded inline-block mt-1">{course.discount}% Discount</p> : <p className="text-xs text-[#B4AF9F] mt-1">No Discount</p>}</td>
                <td className="p-5 text-center"><span className="inline-block bg-[#0E7C7B]/10 text-[#0E7C7B] font-bold px-3 py-1.5 rounded-xl border border-[#0E7C7B]/20 text-lg">{course.active_batch_no || '-'}</span></td>
                <td className="p-5 flex justify-center" onClick={e => e.stopPropagation()}><ToggleSwitch checked={course.is_active} onChange={() => toggleCourseStatus(course)} label={course.is_active ? 'Active' : 'Inactive'} /></td>
                <td className="p-5 text-right" onClick={e => e.stopPropagation()}>
                  <button onClick={(e) => { e.stopPropagation(); setSelectedCourseId(course.id); }} className="px-5 py-2 text-xs font-bold text-white bg-[#14161F] rounded-xl hover:bg-[#22242F] shadow-sm transition-colors flex items-center gap-1 whitespace-nowrap ml-auto"><Layers size={13} /> View Batches</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {courseModalOpen && editingCourse && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#14161F]/60 p-4 backdrop-blur-sm" onClick={() => setCourseModalOpen(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full relative overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            <p className="font-mono text-[10px] text-[#B4AF9F] absolute top-4 left-6">ID: {editingCourse.id}</p>
            <button onClick={() => setCourseModalOpen(false)} className="absolute top-6 right-6 text-[#B4AF9F] hover:text-[#14161F] z-10"><X /></button>
            <div className="p-6 border-b border-[#E6E0D2] bg-[#FAF8F3] mt-4"><h3 className="text-2xl font-serif font-bold text-[#14161F]">Edit Config</h3></div>
            <div className="p-6 space-y-4">
              <div><label className="block text-[10px] font-bold text-[#857D6E] uppercase mb-1 ml-1">Course Name</label><input type="text" className="w-full bg-[#FAF8F3] p-3.5 rounded-xl outline-none border border-[#E6E0D2] focus:border-[#B8862E] font-bold text-[#14161F] text-sm" value={editingCourse.title || ''} onChange={e => setEditingCourse({ ...editingCourse, title: e.target.value })} /></div>
              <div><label className="block text-[10px] font-bold text-[#857D6E] uppercase mb-1 ml-1">Fee (Rs)</label><input type="number" className="w-full bg-[#FAF8F3] p-3.5 rounded-xl outline-none border border-[#E6E0D2] focus:border-[#B8862E] font-bold text-[#14161F] text-sm" value={editingCourse.fee || ''} onChange={e => setEditingCourse({ ...editingCourse, fee: Number(e.target.value) })} /></div>
              <div><label className="block text-[10px] font-bold text-[#857D6E] uppercase mb-1 ml-1">Discount (%)</label><input type="number" className="w-full bg-[#FAF8F3] p-3.5 rounded-xl outline-none border border-[#E6E0D2] focus:border-[#B8862E] font-bold text-[#14161F] text-sm" value={editingCourse.discount || ''} onChange={e => setEditingCourse({ ...editingCourse, discount: Number(e.target.value) })} /></div>
              <div><label className="block text-[10px] font-bold text-[#857D6E] uppercase mb-1 ml-1">Active Batch No.</label><input type="number" className="w-full bg-[#FAF8F3] p-3.5 rounded-xl outline-none border border-[#E6E0D2] focus:border-[#B8862E] font-bold text-[#14161F] text-sm" value={editingCourse.active_batch_no || ''} onChange={e => setEditingCourse({ ...editingCourse, active_batch_no: Number(e.target.value) })} /></div>
            </div>
            <div className="p-6 border-t border-[#E6E0D2] bg-[#FAF8F3] flex justify-end gap-3 shrink-0">
              <button onClick={() => setCourseModalOpen(false)} className="px-6 py-3 font-bold text-[#857D6E] hover:text-[#14161F]">Cancel</button>
              <button onClick={saveCourse} className="px-8 py-3 rounded-xl font-bold bg-[#14161F] text-white shadow-lg hover:bg-[#22242F] transition-colors">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PhysicalCoursesManager({ data, refresh }: { data: PhysicalCourse[], refresh: () => void }) {
  const supabase = useSupabase();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<PhysicalCourse>>({});
  const [searchQuery, setSearchQuery] = useState("");

  const emptyForm: Partial<PhysicalCourse> = {
    title: '', course_code: '', category: 'Professional Training', instructor_name: '',
    location: 'Near Eyeplex Mall, New Baneshwor, Kathmandu', start_date: '', timing: '',
    duration_weeks: undefined, price: 0, discount_price: undefined, max_seats: 30,
    enrolled_count: 0, is_active: true, tutor_bio: '', batch_no: undefined,
    learning_outcomes: [], course_image_url: '', instructor_image_url: '',
  };

  const openCreate = () => { setEditing({ ...emptyForm }); setModalOpen(true); };
  const openEdit = (course: PhysicalCourse) => { setEditing({ ...course }); setModalOpen(true); };

  const save = async () => {
    if (!editing.title || !editing.category || editing.price === undefined) { alert("Title, category, and price are required."); return; }
    const payload = {
      title: editing.title,
      course_code: editing.course_code || null,
      course_image_url: editing.course_image_url || null,
      instructor_image_url: editing.instructor_image_url || null,
      category: editing.category,
      learning_outcomes: editing.learning_outcomes || [],
      instructor_name: editing.instructor_name || null,
      location: editing.location || 'Near Eyeplex Mall, New Baneshwor, Kathmandu',
      start_date: editing.start_date || null,
      timing: editing.timing || null,
      duration_weeks: editing.duration_weeks ? Number(editing.duration_weeks) : null,
      price: Number(editing.price),
      discount_price: editing.discount_price !== undefined && editing.discount_price !== null && (editing.discount_price as any) !== '' ? Number(editing.discount_price) : null,
      max_seats: editing.max_seats ? Number(editing.max_seats) : 30,
      enrolled_count: editing.enrolled_count ? Number(editing.enrolled_count) : 0,
      is_active: editing.is_active ?? true,
      tutor_bio: editing.tutor_bio || null,
      batch_no: editing.batch_no ? Number(editing.batch_no) : null,
      updated_at: new Date().toISOString(),
    };
    if (editing.id) {
      const { error } = await supabase.from('physicalcourses').update(payload).eq('id', editing.id);
      if (error) { alert("Update failed: " + error.message); return; }
    } else {
      const { error } = await supabase.from('physicalcourses').insert([payload]);
      if (error) { alert("Create failed: " + error.message); return; }
    }
    setModalOpen(false); refresh();
  };

  const toggleActive = async (course: PhysicalCourse) => {
    const { error } = await supabase.from('physicalcourses').update({ is_active: !course.is_active, updated_at: new Date().toISOString() }).eq('id', course.id);
    if (error) alert(error.message); else refresh();
  };

  const filtered = data.filter(c => {
    const s = searchQuery.toLowerCase();
    return c.title?.toLowerCase().includes(s) || (c.course_code || '').toLowerCase().includes(s) || c.category?.toLowerCase().includes(s);
  });

  const rawOutcomes = editing.learning_outcomes;
  const outcomesArray = Array.isArray(rawOutcomes)
    ? rawOutcomes
    : typeof rawOutcomes === 'string'
      ? rawOutcomes
          .replace(/^\{|\}$/g, '') // Removes Postgres array brackets {} if they exist
          .split(',')
          .map(s => s.replace(/^"|"$/g, '').trim()) // Removes quotes and whitespace
          .filter(Boolean)
      : [];

  const outcomesText = outcomesArray.join("\n");

  return (
    <div className="space-y-6 w-full">
      <div className="flex flex-wrap gap-3 items-center w-full">
        <div className="flex-1 min-w-[250px]"><SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Search by title, course code, or category..." /></div>
        <button onClick={openCreate} className="bg-[#14161F] text-white px-5 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg hover:bg-[#22242F] transition-all whitespace-nowrap"><Plus size={17} /> Add Physical Course</button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-[#E6E0D2] overflow-x-auto w-full">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#FAF8F3] border-b border-[#E6E0D2] text-[10px] font-bold text-[#857D6E] uppercase tracking-widest">
              <th className="p-5">Course</th><th className="p-5">Category</th><th className="p-5">Pricing</th><th className="p-5 text-center">Seats</th><th className="p-5 text-center">Status</th><th className="p-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(course => (
              <tr key={course.id} className="border-b border-[#EFEBE1] hover:bg-[#FAF8F3] cursor-pointer" onClick={() => openEdit(course)}>
                <td className="p-5">
                  <p className="font-bold text-[#14161F] text-base">{course.title}</p>
                  <p className="text-xs text-[#B4AF9F] font-mono mt-1">{course.course_code || 'No Code'} {course.batch_no ? `· Batch ${course.batch_no}` : ''}</p>
                  <p className="text-xs text-[#857D6E] mt-1 flex items-center gap-1"><MapPin size={11} /> {course.location}</p>
                </td>
                <td className="p-5"><span className="uppercase text-[10px] tracking-widest bg-[#B8543D]/10 text-[#B8543D] px-2 py-1 rounded font-bold">{course.category}</span></td>
                <td className="p-5 whitespace-nowrap">
                  <p className="font-bold text-[#4A4638]">Rs. {course.price}</p>
                  {course.discount_price ? <p className="text-xs text-[#1E8F6F] font-bold bg-[#DCEEE6] px-2 py-0.5 rounded inline-block mt-1">Now Rs. {course.discount_price}</p> : <p className="text-xs text-[#B4AF9F] mt-1">No Discount</p>}
                </td>
                <td className="p-5 text-center"><span className="inline-block bg-[#B8543D]/10 text-[#B8543D] font-bold px-3 py-1.5 rounded-xl border border-[#B8543D]/20">{course.enrolled_count ?? 0} / {course.max_seats ?? '-'}</span></td>
                <td className="p-5 flex justify-center" onClick={e => e.stopPropagation()}><ToggleSwitch checked={course.is_active} onChange={() => toggleActive(course)} label={course.is_active ? 'Active' : 'Inactive'} activeColor="#B8543D" /></td>
                <td className="p-5 text-right" onClick={e => e.stopPropagation()}>
                  <button onClick={() => openEdit(course)} className="p-2 text-[#B8543D] bg-[#B8543D]/10 rounded-lg hover:bg-[#B8543D]/20" title="Edit Course"><Edit2 size={15} /></button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={6} className="p-10 text-center text-[#857D6E]">No physical courses found.</td></tr>}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#14161F]/60 p-4 backdrop-blur-sm" onClick={() => setModalOpen(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full relative overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            <button onClick={() => setModalOpen(false)} className="absolute top-6 right-6 text-[#B4AF9F] hover:text-[#14161F] z-10"><X /></button>
            <div className="p-6 border-b border-[#E6E0D2] bg-[#FAF8F3] mt-4">
              <h3 className="text-2xl font-serif font-bold text-[#14161F]">{editing.id ? 'Edit Physical Course' : 'Add Physical Course'}</h3>
            </div>
            <div className="p-6 space-y-4 max-h-[65vh] overflow-y-auto no-scrollbar">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2"><label className="block text-[10px] font-bold text-[#857D6E] uppercase mb-1 ml-1">Course Title</label><input type="text" className="w-full bg-[#FAF8F3] p-3.5 rounded-xl outline-none border border-[#E6E0D2] focus:border-[#B8543D] font-bold text-[#14161F] text-sm" value={editing.title || ''} onChange={e => setEditing({ ...editing, title: e.target.value })} /></div>
                <div><label className="block text-[10px] font-bold text-[#857D6E] uppercase mb-1 ml-1">Course Code</label><input type="text" className="w-full bg-[#FAF8F3] p-3.5 rounded-xl outline-none border border-[#E6E0D2] focus:border-[#B8543D] font-bold text-[#14161F] text-sm" value={editing.course_code || ''} onChange={e => setEditing({ ...editing, course_code: e.target.value })} /></div>
                <div>
                  <label className="block text-[10px] font-bold text-[#857D6E] uppercase mb-1 ml-1">Category</label>
                  <select className="w-full bg-[#FAF8F3] p-3.5 rounded-xl outline-none border border-[#E6E0D2] focus:border-[#B8543D] font-bold text-[#14161F] text-sm" value={editing.category || 'Professional Training'} onChange={e => setEditing({ ...editing, category: e.target.value as any })}>
                    <option value="Professional Training">Professional Training</option>
                    <option value="University Subjects">University Subjects</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-[10px] font-bold text-[#857D6E] uppercase mb-1 ml-1">Instructor Name</label><input type="text" className="w-full bg-[#FAF8F3] p-3.5 rounded-xl outline-none border border-[#E6E0D2] focus:border-[#B8543D] font-bold text-[#14161F] text-sm" value={editing.instructor_name || ''} onChange={e => setEditing({ ...editing, instructor_name: e.target.value })} /></div>
                <div><label className="block text-[10px] font-bold text-[#857D6E] uppercase mb-1 ml-1">Batch No.</label><input type="number" className="w-full bg-[#FAF8F3] p-3.5 rounded-xl outline-none border border-[#E6E0D2] focus:border-[#B8543D] font-bold text-[#14161F] text-sm" value={editing.batch_no ?? ''} onChange={e => setEditing({ ...editing, batch_no: Number(e.target.value) })} /></div>
              </div>
              <div><label className="block text-[10px] font-bold text-[#857D6E] uppercase mb-1 ml-1">Location / Branch</label><input type="text" className="w-full bg-[#FAF8F3] p-3.5 rounded-xl outline-none border border-[#E6E0D2] focus:border-[#B8543D] font-medium text-[#14161F] text-sm" value={editing.location || ''} onChange={e => setEditing({ ...editing, location: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-[10px] font-bold text-[#857D6E] uppercase mb-1 ml-1">Start Date</label><input type="date" className="w-full bg-[#FAF8F3] p-3.5 rounded-xl outline-none border border-[#E6E0D2] focus:border-[#B8543D] font-bold text-[#14161F] text-sm" value={editing.start_date || ''} onChange={e => setEditing({ ...editing, start_date: e.target.value })} /></div>
                <div><label className="block text-[10px] font-bold text-[#857D6E] uppercase mb-1 ml-1">Timing</label><input type="text" placeholder="e.g., 5:00 PM - 7:00 PM" className="w-full bg-[#FAF8F3] p-3.5 rounded-xl outline-none border border-[#E6E0D2] focus:border-[#B8543D] font-bold text-[#14161F] text-sm" value={editing.timing || ''} onChange={e => setEditing({ ...editing, timing: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div><label className="block text-[10px] font-bold text-[#857D6E] uppercase mb-1 ml-1">Duration (weeks)</label><input type="number" className="w-full bg-[#FAF8F3] p-3.5 rounded-xl outline-none border border-[#E6E0D2] focus:border-[#B8543D] font-bold text-[#14161F] text-sm" value={editing.duration_weeks ?? ''} onChange={e => setEditing({ ...editing, duration_weeks: Number(e.target.value) })} /></div>
                <div><label className="block text-[10px] font-bold text-[#857D6E] uppercase mb-1 ml-1">Max Seats</label><input type="number" className="w-full bg-[#FAF8F3] p-3.5 rounded-xl outline-none border border-[#E6E0D2] focus:border-[#B8543D] font-bold text-[#14161F] text-sm" value={editing.max_seats ?? ''} onChange={e => setEditing({ ...editing, max_seats: Number(e.target.value) })} /></div>
                <div><label className="block text-[10px] font-bold text-[#857D6E] uppercase mb-1 ml-1">Enrolled</label><input type="number" className="w-full bg-[#FAF8F3] p-3.5 rounded-xl outline-none border border-[#E6E0D2] focus:border-[#B8543D] font-bold text-[#14161F] text-sm" value={editing.enrolled_count ?? ''} onChange={e => setEditing({ ...editing, enrolled_count: Number(e.target.value) })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-[10px] font-bold text-[#857D6E] uppercase mb-1 ml-1">Price (Rs)</label><input type="number" className="w-full bg-[#FAF8F3] p-3.5 rounded-xl outline-none border border-[#E6E0D2] focus:border-[#B8543D] font-bold text-[#14161F] text-sm" value={editing.price ?? ''} onChange={e => setEditing({ ...editing, price: Number(e.target.value) })} /></div>
                <div><label className="block text-[10px] font-bold text-[#857D6E] uppercase mb-1 ml-1">Discount Price (Rs)</label><input type="number" className="w-full bg-[#FAF8F3] p-3.5 rounded-xl outline-none border border-[#E6E0D2] focus:border-[#B8543D] font-bold text-[#14161F] text-sm" value={editing.discount_price ?? ''} onChange={e => setEditing({ ...editing, discount_price: e.target.value === '' ? undefined : Number(e.target.value) })} /></div>
              </div>
              <div><label className="block text-[10px] font-bold text-[#857D6E] uppercase mb-1 ml-1">Learning Outcomes (one per line)</label><textarea rows={4} className="w-full bg-[#FAF8F3] p-3.5 rounded-xl outline-none border border-[#E6E0D2] focus:border-[#B8543D] font-medium text-[#14161F] text-sm resize-none" value={outcomesText} onChange={e => setEditing({ ...editing, learning_outcomes: e.target.value.split("\n").map(s => s.trim()).filter(Boolean) })} /></div>
              <div><label className="block text-[10px] font-bold text-[#857D6E] uppercase mb-1 ml-1">Tutor Bio</label><textarea rows={3} className="w-full bg-[#FAF8F3] p-3.5 rounded-xl outline-none border border-[#E6E0D2] focus:border-[#B8543D] font-medium text-[#14161F] text-sm resize-none" value={editing.tutor_bio || ''} onChange={e => setEditing({ ...editing, tutor_bio: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-[10px] font-bold text-[#857D6E] uppercase mb-1 ml-1">Course Image URL</label><input type="text" className="w-full bg-[#FAF8F3] p-3.5 rounded-xl outline-none border border-[#E6E0D2] focus:border-[#B8543D] font-medium text-[#14161F] text-sm" value={editing.course_image_url || ''} onChange={e => setEditing({ ...editing, course_image_url: e.target.value })} /></div>
                <div><label className="block text-[10px] font-bold text-[#857D6E] uppercase mb-1 ml-1">Instructor Image URL</label><input type="text" className="w-full bg-[#FAF8F3] p-3.5 rounded-xl outline-none border border-[#E6E0D2] focus:border-[#B8543D] font-medium text-[#14161F] text-sm" value={editing.instructor_image_url || ''} onChange={e => setEditing({ ...editing, instructor_image_url: e.target.value })} /></div>
              </div>
              <div className="pt-2"><ToggleSwitch checked={!!editing.is_active} onChange={() => setEditing({ ...editing, is_active: !editing.is_active })} label={editing.is_active ? 'Active (visible to public)' : 'Inactive (hidden)'} activeColor="#B8543D" /></div>
            </div>
            <div className="p-6 border-t border-[#E6E0D2] bg-[#FAF8F3] flex justify-end gap-3 shrink-0">
              <button onClick={() => setModalOpen(false)} className="px-6 py-3 font-bold text-[#857D6E] hover:text-[#14161F]">Cancel</button>
              <button onClick={save} className="px-8 py-3 rounded-xl font-bold bg-[#B8543D] text-white shadow-lg hover:opacity-90 transition-colors">Save Course</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================================================
   BOOKINGS & LEADS
============================================================================ */
function BookingsManager({ courses, enrollments, batches, syllabi, physicalCourses, physicalLeads, orders, refresh, onOpenChat }: any) {
  const [bookingType, setBookingType] = useState<'online' | 'physical'>('online');

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 w-full">
      <SectionHeader
        eyebrow="Enrollment Desk"
        title="Bookings & Leads"
        subtitle="Two desks, one ledger — online enrollments and walk-in leads."
        action={
          <div className="flex bg-white p-1 rounded-xl border border-[#E6E0D2] shadow-sm">
            <button onClick={() => setBookingType('online')} className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${bookingType === 'online' ? 'bg-[#0E7C7B] text-white shadow' : 'text-[#857D6E] hover:text-[#14161F]'}`}>
              <Globe2 size={15} /> Online
            </button>
            <button onClick={() => setBookingType('physical')} className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${bookingType === 'physical' ? 'bg-[#B8543D] text-white shadow' : 'text-[#857D6E] hover:text-[#14161F]'}`}>
              <Building2 size={15} /> Physical Leads
            </button>
          </div>
        }
      />
      {bookingType === 'online' ? (
        <OnlineBookingsView courses={courses} enrollments={enrollments} batches={batches} syllabi={syllabi} orders={orders} refresh={refresh} onOpenChat={onOpenChat} />
      ) : (
        <PhysicalLeadsView physicalCourses={physicalCourses} data={physicalLeads} refresh={refresh} />
      )}
    </motion.div>
  );
}

function OnlineBookingsView({ courses, enrollments, batches, syllabi, orders, refresh, onOpenChat }: any) {
  const supabase = useSupabase();
  const [selectedCourse, setSelectedCourse] = useState<OnlineCourse | null>(null);
  const [selectedBatch, setSelectedBatch] = useState<number | 'unassigned' | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'confirmed'>('all');
  const [editingPayment, setEditingPayment] = useState<Enrollment | null>(null);
  const [editLocked, setEditLocked] = useState<number>(0);
  const [editPaid, setEditPaid] = useState<number>(0);
  const [isAddingBooking, setIsAddingBooking] = useState(false);
  const [newBooking, setNewBooking] = useState({ name: '', email: '', wa: '', locked_price: 0, paid_amount: 0 });
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 20;

  useEffect(() => { setCurrentPage(1); }, [selectedCourse, selectedBatch, searchQuery, statusFilter]);

  const toggleConfirmation = async (enrollmentId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase.from('enrollments_v2').update({ is_confirmed: !currentStatus }).eq('id', enrollmentId);
      if (error) { alert(`Could not update booking: ${error.message}`); return; }
      refresh();
    } catch { alert("An unexpected error occurred while updating."); }
  };

  const deleteEnrollment = async (enrollmentId: string) => {
    if (confirm("Are you sure you want to delete this enrollment? This action will set it to archived.")) {
      try {
        const { error } = await supabase.from('enrollments_v2').update({ deleted: true }).eq('id', enrollmentId);
        if (error) { alert(`Failed to delete: ${error.message}`); return; }
        refresh();
      } catch { alert("An unexpected error occurred."); }
    }
  };

  const openPaymentEdit = (enr: Enrollment) => { 
    setEditingPayment(enr); 
    setEditLocked(enr.locked_price || 0);
    setEditPaid(enr.paid_amount || 0); 
  };

  const savePayment = async () => {
    if (!editingPayment) return;
    const newPending = editLocked - editPaid;

    if (!editingPayment.order_id) {
      const course = courses.find((c: any) => c.id === editingPayment.course_id);
      const { data: newOrder, error: insErr } = await supabase.from('orders_v2').insert([{
        enrollment_id: editingPayment.id, full_name: editingPayment.full_name, email: editingPayment.email,
        whatsapp_number: editingPayment.whatsapp_number, order_type: 'Online Course',
        order_name: editingPayment.course_name || (course?.title || 'Course Enrollment'),
        paid_amount: editPaid, pending_amount: newPending, locked_price: editLocked,
        status: editPaid >= editLocked ? 'verified' : 'pending'
      }]).select().single();
      if (insErr) { alert("Failed to auto-create missing order: " + insErr.message); return; }
      refresh(); setEditingPayment(null); return;
    }
    
    const { error } = await supabase.from('orders_v2').update({ 
      paid_amount: editPaid, 
      pending_amount: newPending, 
      locked_price: editLocked, 
      updated_at: new Date().toISOString() 
    }).eq('id', editingPayment.order_id);
    
    if (error) alert("Failed to update payment: " + error.message); else { refresh(); setEditingPayment(null); }
  };

  const openAddBookingModal = () => {
    const fee = Number(selectedCourse?.fee) || 0;
    const discount = Number(selectedCourse?.discount) || 0;
    setNewBooking({ name: '', email: '', wa: '', locked_price: fee - (fee * discount / 100), paid_amount: 0 });
    setIsAddingBooking(true);
  };

  const saveManualBooking = async () => {
    if (!selectedCourse) return;
    if (!newBooking.name || !newBooking.email || !newBooking.wa) { alert("Please fill all contact details!"); return; }
    let resolvedBatchId = null;
    if (selectedBatch !== 'unassigned' && selectedBatch !== null) {
      const matchedBatch = batches.find((b: any) => b.course_id === selectedCourse.id && b.batch_no === selectedBatch);
      if (matchedBatch) resolvedBatchId = matchedBatch.id;
    }
    if (!resolvedBatchId) { alert("Error: You must be inside a specific valid batch to add a booking."); return; }
    const enrPayload = { batch_id: resolvedBatchId, full_name: newBooking.name, email: newBooking.email, whatsapp_number: newBooking.wa, is_confirmed: true };
    const { data: enrData, error: enrErr } = await supabase.from('enrollments_v2').insert([enrPayload]).select().single();
    if (enrErr) { alert("Error adding enrollment: " + enrErr.message); return; }
    const ordPayload = {
      enrollment_id: enrData.id, full_name: newBooking.name, email: newBooking.email, whatsapp_number: newBooking.wa,
      order_type: 'Online Course', order_name: selectedCourse.title, paid_amount: newBooking.paid_amount, pending_amount: Math.max(0, newBooking.locked_price - newBooking.paid_amount),
      locked_price: newBooking.locked_price, status: newBooking.paid_amount >= newBooking.locked_price ? 'verified' : 'pending'
    };
    const { error: ordErr } = await supabase.from('orders_v2').insert([ordPayload]);
    if (ordErr) alert("Enrollment added, but auto-order creation failed: " + ordErr.message);
    setIsAddingBooking(false);
    setNewBooking({ name: '', email: '', wa: '', locked_price: 0, paid_amount: 0 });
    refresh();
  };

  if (!selectedCourse) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5 mt-2 w-full">
        {courses.map((course: any) => {
          const batchCount = batches.filter((b: any) => b.course_id === course.id).length;
          return (
            <div key={course.id} onClick={() => setSelectedCourse(course)} className="flex flex-col items-center justify-center p-6 bg-white border border-[#E6E0D2] rounded-2xl hover:border-[#0E7C7B] hover:shadow-md cursor-pointer transition-all aspect-square relative text-center group w-full max-w-[280px] mx-auto">
              <div className="absolute top-4 right-4 bg-[#0E7C7B]/10 text-[#0E7C7B] font-bold text-[10px] uppercase tracking-wider px-3 py-1.5 rounded-lg">{batchCount} Batches</div>
              <div className="w-14 h-14 bg-[#0E7C7B]/10 rounded-xl flex items-center justify-center text-[#0E7C7B] mb-4 group-hover:scale-105 transition-transform"><Globe2 size={26} /></div>
              <h3 className="font-bold text-[#14161F] text-base px-2 leading-snug">{course.title}</h3>
            </div>
          );
        })}
      </div>
    );
  }

  if (selectedCourse && selectedBatch === null) {
    const availableBatches = Array.from(new Set([
      ...batches.filter((b: any) => b.course_id === selectedCourse.id).map((b: any) => b.batch_no),
      ...enrollments.filter((e: any) => e.course_id === selectedCourse.id && e.batch_no).map((e: any) => e.batch_no as number)
    ])).sort((a, b) => b - a);
    const unassignedCount = enrollments.filter((e: any) => e.course_id === selectedCourse.id && !e.batch_no).length;

    return (
      <div className="space-y-6 w-full">
        <div className="flex items-center gap-4">
          <button onClick={() => setSelectedCourse(null)} className="p-3 bg-white border border-[#E6E0D2] rounded-xl hover:bg-[#FAF8F3] transition-colors shadow-sm"><ArrowLeft size={19} className="text-[#4A4638]" /></button>
          <div><h2 className="text-xl font-serif font-bold text-[#14161F]">{selectedCourse.title}</h2><p className="text-sm font-medium text-[#857D6E]">Select a batch to view its enrollments</p></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {availableBatches.map(b => {
            const batchCount = enrollments.filter((e: any) => e.course_id === selectedCourse.id && e.batch_no === b).length;
            return (
              <div key={b} onClick={() => setSelectedBatch(b)} className="flex items-center justify-between p-6 bg-white border border-[#E6E0D2] rounded-2xl hover:border-[#0E7C7B] hover:shadow-md cursor-pointer transition-all">
                <div className="flex items-center gap-4"><div className="w-14 h-14 bg-[#0E7C7B]/10 text-[#0E7C7B] rounded-xl flex items-center justify-center font-bold text-2xl">{b}</div><h3 className="font-bold text-[#14161F] text-xl">Batch {b}</h3></div>
                <div className="text-right"><p className="text-3xl font-bold text-[#0E7C7B]">{batchCount}</p><p className="text-[10px] font-bold text-[#B4AF9F] uppercase tracking-widest">Enrollments</p></div>
              </div>
            );
          })}
          {unassignedCount > 0 && (
            <div onClick={() => setSelectedBatch('unassigned')} className="flex items-center justify-between p-6 bg-white border border-[#E6E0D2] rounded-2xl hover:border-[#C08A28] hover:shadow-md cursor-pointer transition-all">
              <div className="flex items-center gap-4"><div className="w-14 h-14 bg-[#F5E7C8] text-[#8A6416] rounded-xl flex items-center justify-center font-bold text-2xl">?</div><h3 className="font-bold text-[#14161F] text-xl">Unassigned</h3></div>
              <div className="text-right"><p className="text-3xl font-bold text-[#C08A28]">{unassignedCount}</p><p className="text-[10px] font-bold text-[#B4AF9F] uppercase tracking-widest">Enrollments</p></div>
            </div>
          )}
        </div>
      </div>
    );
  }

  let courseEnrollments = enrollments.filter((e: any) => {
    if (e.course_id !== selectedCourse.id) return false;
    if (selectedBatch === 'unassigned' && e.batch_no) return false;
    if (selectedBatch !== 'unassigned' && e.batch_no !== selectedBatch) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      if (!e.full_name?.toLowerCase().includes(q) && !e.email?.toLowerCase().includes(q) && !e.whatsapp_number?.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  if (statusFilter === 'confirmed') courseEnrollments = courseEnrollments.filter(e => e.confirmed);
  if (statusFilter === 'pending') courseEnrollments = courseEnrollments.filter(e => !e.confirmed);

  const predictedVolume = courseEnrollments.reduce((sum: number, e: any) => sum + (e.locked_price || 0), 0);
  const collectedVolume = courseEnrollments.reduce((sum: number, e: any) => sum + (e.paid_amount || 0), 0);
  const pendingVolume = courseEnrollments.reduce((sum: number, e: any) => sum + ((e.locked_price || 0) - (e.paid_amount || 0)), 0);

  const totalPages = Math.ceil(courseEnrollments.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedEnrollments = courseEnrollments.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  return (
    <div className="space-y-6 w-full">
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button onClick={() => setSelectedBatch(null)} className="p-3 bg-white border border-[#E6E0D2] rounded-xl hover:bg-[#FAF8F3] transition-colors shadow-sm"><ArrowLeft size={19} className="text-[#4A4638]" /></button>
            <div><h2 className="text-xl font-serif font-bold text-[#14161F]">{selectedCourse.title}</h2><p className="text-sm font-medium text-[#857D6E]">{selectedBatch === 'unassigned' ? 'Unassigned Enrollments' : `Batch ${selectedBatch} Enrollments`}</p></div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button onClick={openAddBookingModal} className="px-5 py-3 bg-[#0E7C7B] text-white rounded-xl text-sm font-bold hover:opacity-90 transition-colors flex items-center gap-2 shadow-sm whitespace-nowrap"><Plus size={16} /> Add Booking</button>
          </div>
        </div>
        <div className="flex flex-wrap gap-3 items-center w-full">
          <div className="flex-1 min-w-[250px]"><SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Search by name, email, or phone number..." /></div>
          <select className="bg-white border border-[#E6E0D2] rounded-xl px-4 py-3 text-sm font-bold text-[#14161F] outline-none shadow-sm cursor-pointer" value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)}>
            <option value="all">Status: All</option>
            <option value="pending">Status: Pending Only</option>
            <option value="confirmed">Status: Confirmed Only</option>
          </select>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 p-4 bg-[#FAF8F3] rounded-2xl border border-[#E6E0D2]">
        <span className="text-sm font-bold text-[#4A4638] bg-white px-3 py-1.5 rounded-lg border border-[#E6E0D2] shadow-sm whitespace-nowrap">Showing {courseEnrollments.length} Booking(s)</span>
        <span className="text-sm font-bold text-[#0E7C7B] bg-[#0E7C7B]/10 px-3 py-1.5 rounded-lg border border-[#0E7C7B]/20 shadow-sm whitespace-nowrap">Predicted: <span className="font-black">Rs. {predictedVolume}</span></span>
        <span className="text-sm font-bold text-[#1E8F6F] bg-[#DCEEE6] px-3 py-1.5 rounded-lg border border-[#C3E3D5] shadow-sm whitespace-nowrap">Collected: <span className="font-black">Rs. {collectedVolume}</span></span>
        <span className="text-sm font-bold text-[#B23B3B] bg-[#F3DAD6] px-3 py-1.5 rounded-lg border border-[#EAC2BC] shadow-sm whitespace-nowrap">Pending: <span className="font-black">Rs. {pendingVolume}</span></span>
      </div>

      <div className="bg-white border border-[#E6E0D2] shadow-sm overflow-x-auto w-full flex flex-col rounded-xl">
        <div className="overflow-y-auto max-h-[600px] w-full">
          <table className="w-full text-left border-collapse table-auto text-xs">
            <thead>
              <tr className="bg-[#FAF8F3] border-b border-[#E6E0D2] text-[#4A4638] uppercase font-bold tracking-wider sticky top-0 z-10">
                <th className="p-3 border-r border-[#E6E0D2]">Full Name</th>
                <th className="p-3 border-r border-[#E6E0D2]">Email</th>
                <th className="p-3 border-r border-[#E6E0D2]">Contact Number</th>
                <th className="p-3 border-r border-[#E6E0D2]">Locked Fee</th>
                <th className="p-3 border-r border-[#E6E0D2]">Paid Amount</th>
                <th className="p-3 border-r border-[#E6E0D2]">Remaining Amount</th>
                <th className="p-3 border-r border-[#E6E0D2] text-center">Confirmed</th>
                <th className="p-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedEnrollments.map((enr: any) => {
                const lockedFee = enr.locked_price || 0;
                const paidAmt = enr.paid_amount || 0;
                const pendingAmt = lockedFee - paidAmt;
                
                return (
                  <tr key={enr.id} className="border-b border-[#EFEBE1] hover:bg-[#FBF6EA] transition-colors">
                    <td className="p-3 border-r border-[#E6E0D2] font-bold text-[#14161F] cursor-pointer hover:text-[#0E7C7B] hover:underline" onClick={(e) => { e.stopPropagation(); enr.user_id ? onOpenChat(enr.user_id) : alert('No linked user account.'); }}>{enr.full_name}</td>
                    <td className="p-3 border-r border-[#E6E0D2] text-[#4A4638]">{enr.email}</td>
                    <td className="p-3 border-r border-[#E6E0D2] text-[#4A4638]">{enr.whatsapp_number}</td>
                    <td className="p-3 border-r border-[#E6E0D2] text-[#4A4638]">Rs. {lockedFee}</td>
                    <td className="p-3 border-r border-[#E6E0D2] text-[#1E8F6F] font-bold">Rs. {paidAmt}</td>
                    <td className={`p-3 border-r border-[#E6E0D2] font-bold ${pendingAmt > 0 ? 'text-[#B23B3B]' : 'text-[#4A4638]'}`}>
                      Rs. {pendingAmt}
                    </td>
                    <td className="p-3 border-r border-[#E6E0D2] text-center">
                      <input type="checkbox" checked={!!enr.confirmed} onChange={() => toggleConfirmation(enr.id, !!enr.confirmed)} className="w-5 h-5 cursor-pointer accent-[#1E8F6F] rounded" />
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex justify-center gap-2">
                        <button onClick={() => openPaymentEdit(enr)} className="text-[10px] font-bold bg-[#FAF8F3] border border-[#E6E0D2] px-3 py-1.5 rounded hover:bg-[#EFEBE1] transition-colors flex items-center gap-1"><Edit2 size={12} />Edit</button>
                        <button onClick={() => deleteEnrollment(enr.id)} className="text-[10px] font-bold bg-[#F3DAD6] text-[#B23B3B] border border-[#EAC2BC] px-3 py-1.5 rounded hover:opacity-80 transition-colors flex items-center gap-1"><Trash2 size={12} />Delete</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {paginatedEnrollments.length === 0 && <tr><td colSpan={8} className="p-8 text-center text-[#857D6E] font-medium">No matching enrollments found.</td></tr>}
            </tbody>
          </table>
        </div>
        {courseEnrollments.length > 0 && (
          <div className="flex flex-wrap items-center justify-between p-4 border-t border-[#E6E0D2] bg-[#FAF8F3] shrink-0 gap-4">
            <span className="text-xs font-bold text-[#4A4638]">Showing {startIndex + 1} to {Math.min(startIndex + ITEMS_PER_PAGE, courseEnrollments.length)} of {courseEnrollments.length} entries</span>
            <div className="flex gap-2">
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-4 py-2 rounded border border-[#E6E0D2] text-xs font-bold bg-white text-[#4A4638] disabled:opacity-50 hover:bg-[#EFEBE1] transition-colors">Previous</button>
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || totalPages === 0} className="px-4 py-2 rounded border border-[#E6E0D2] text-xs font-bold bg-white text-[#4A4638] disabled:opacity-50 hover:bg-[#EFEBE1] transition-colors">Next</button>
            </div>
          </div>
        )}
      </div>

      {isAddingBooking && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#14161F]/60 p-4 backdrop-blur-sm" onClick={() => setIsAddingBooking(false)}>
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full relative" onClick={e => e.stopPropagation()}>
            <button onClick={() => setIsAddingBooking(false)} className="absolute top-6 right-6 text-[#B4AF9F] hover:text-[#14161F]"><X /></button>
            <h3 className="text-2xl font-serif font-bold mb-1">Add Booking</h3>
            <p className="text-xs font-medium text-[#857D6E] mb-6">Create enrollment manually.</p>
            <div className="space-y-4">
              <div><label className="block text-[10px] font-bold text-[#857D6E] uppercase mb-1">Full Name</label><input type="text" value={newBooking.name} onChange={(e) => setNewBooking({ ...newBooking, name: e.target.value })} className="w-full bg-[#FAF8F3] p-3.5 rounded-xl outline-none border border-[#E6E0D2] focus:border-[#B8862E] font-bold text-[#14161F]" placeholder="John Doe" /></div>
              <div><label className="block text-[10px] font-bold text-[#857D6E] uppercase mb-1">Email Address</label><input type="email" value={newBooking.email} onChange={(e) => setNewBooking({ ...newBooking, email: e.target.value })} className="w-full bg-[#FAF8F3] p-3.5 rounded-xl outline-none border border-[#E6E0D2] focus:border-[#B8862E] font-bold text-[#14161F]" placeholder="john@example.com" /></div>
              <div><label className="block text-[10px] font-bold text-[#857D6E] uppercase mb-1">WhatsApp Number</label><input type="text" value={newBooking.wa} onChange={(e) => setNewBooking({ ...newBooking, wa: e.target.value })} className="w-full bg-[#FAF8F3] p-3.5 rounded-xl outline-none border border-[#E6E0D2] focus:border-[#B8862E] font-bold text-[#14161F]" placeholder="98XXXXXXXX" /></div>
              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-[#E6E0D2]">
                <div><label className="block text-[10px] font-bold text-[#857D6E] uppercase mb-1">Locked Price (Rs)</label><input type="number" value={newBooking.locked_price} onChange={(e) => setNewBooking({ ...newBooking, locked_price: Number(e.target.value) })} className="w-full bg-[#FAF8F3] p-3.5 rounded-xl outline-none border border-[#E6E0D2] focus:border-[#B8862E] font-bold text-[#14161F]" /></div>
                <div><label className="block text-[10px] font-bold text-[#857D6E] uppercase mb-1">Paid Amount (Rs)</label><input type="number" value={newBooking.paid_amount} onChange={(e) => setNewBooking({ ...newBooking, paid_amount: Number(e.target.value) })} className="w-full bg-[#FAF8F3] p-3.5 rounded-xl outline-none border border-[#E6E0D2] focus:border-[#1E8F6F] font-bold text-[#1E8F6F]" /></div>
              </div>
            </div>
            <div className="mt-8 flex justify-end gap-3">
              <button onClick={() => setIsAddingBooking(false)} className="px-5 py-3 font-bold text-[#857D6E] hover:text-[#14161F] transition-colors">Cancel</button>
              <button onClick={saveManualBooking} className="px-6 py-3 rounded-xl font-bold bg-[#0E7C7B] text-white shadow-lg hover:opacity-90 transition-colors">Add Enrollment</button>
            </div>
          </div>
        </div>
      )}

      {editingPayment && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#14161F]/60 p-4 backdrop-blur-sm" onClick={() => setEditingPayment(null)}>
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full relative" onClick={e => e.stopPropagation()}>
            <button onClick={() => setEditingPayment(null)} className="absolute top-6 right-6 text-[#B4AF9F] hover:text-[#14161F]"><X /></button>
            <h3 className="text-xl font-serif font-bold mb-1">Edit Payment Details</h3>
            <p className="text-xs font-medium text-[#857D6E] mb-6">{editingPayment.full_name}</p>
            <div className="space-y-4">
              <div><label className="block text-[10px] font-bold text-[#857D6E] uppercase mb-1">Locked Fee (Rs)</label><input type="number" value={editLocked} onChange={(e) => setEditLocked(Number(e.target.value))} className="w-full bg-[#FAF8F3] p-3 rounded-xl outline-none border border-[#E6E0D2] focus:border-[#8A6416] font-black text-[#8A6416]" /></div>
              <div><label className="block text-[10px] font-bold text-[#857D6E] uppercase mb-1">Paid Amount (Rs)</label><input type="number" value={editPaid} onChange={(e) => setEditPaid(Number(e.target.value))} className="w-full bg-[#FAF8F3] p-3 rounded-xl outline-none border border-[#E6E0D2] focus:border-[#1E8F6F] font-black text-[#1E8F6F]" /></div>
              <div className="p-3 bg-[#EFEBE1] rounded-xl flex justify-between items-center border border-[#E6E0D2]">
                <label className="block text-[10px] font-bold text-[#857D6E] uppercase">Remaining Amount</label>
                <span className={`font-black ${editLocked - editPaid > 0 ? 'text-[#B23B3B]' : 'text-[#1E8F6F]'}`}>Rs. {Math.max(0, editLocked - editPaid)}</span>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setEditingPayment(null)} className="px-4 py-2 font-bold text-[#857D6E] hover:text-[#14161F] transition-colors">Cancel</button>
              <button onClick={savePayment} className="px-6 py-2 rounded-xl font-bold bg-[#0E7C7B] text-white shadow-lg hover:opacity-90 transition-colors">Save Details</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PhysicalLeadsView({ physicalCourses, data, refresh }: { physicalCourses: PhysicalCourse[]; data: PhysicalLead[]; refresh: () => void }) {
  const supabase = useSupabase();
  const [selectedCourse, setSelectedCourse] = useState<PhysicalCourse | null>(null);
  const [selectedBatch, setSelectedBatch] = useState<number | 'unassigned' | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [confirmedFilter, setConfirmedFilter] = useState<'all' | 'pending' | 'confirmed'>('all');
  const [editingLead, setEditingLead] = useState<PhysicalLead | null>(null);
  const [editLocked, setEditLocked] = useState<number>(0);
  const [editPaid, setEditPaid] = useState<number>(0);
  const [isAddingLead, setIsAddingLead] = useState(false);
  const [newLead, setNewLead] = useState({ full_name: '', phone: '', email: '', office_location: '', source: 'Walk-in' });
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 20;

  useEffect(() => { setCurrentPage(1); }, [selectedCourse, selectedBatch, searchQuery, confirmedFilter]);

  const toggleConfirmation = async (leadId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase.from('physical_leads').update({ is_confirmed: !currentStatus }).eq('id', leadId);
      if (error) { alert(`Could not update lead: ${error.message}`); return; }
      refresh();
    } catch { alert("An unexpected error occurred while updating."); }
  };

  const deleteLead = async (leadId: string) => {
    if (confirm("Are you sure you want to delete this lead? This action will set it to archived.")) {
      try {
        const { error } = await supabase.from('physical_leads').update({ deleted: true }).eq('id', leadId);
        if (error) { alert(`Failed to delete: ${error.message}`); return; }
        refresh();
      } catch { alert("An unexpected error occurred."); }
    }
  };

  const openEditLead = (lead: PhysicalLead) => {
    setEditingLead(lead);
    setEditLocked(lead.discount_price ?? lead.course_price ?? 0);
    setEditPaid(lead.booking_amount || 0);
  };

  const saveLeadPayment = async () => {
    if (!editingLead) return;
    const newPending = editLocked - editPaid;
    const { error } = await supabase.from('physical_leads').update({
      booking_amount: editPaid,
      pending_amount: newPending,
      discount_price: editLocked,
      updated_at: new Date().toISOString()
    }).eq('id', editingLead.id);
    
    if (error) alert("Error: " + error.message);
    else { setEditingLead(null); refresh(); }
  };

  const saveManualLead = async () => {
    if (!selectedCourse) return;
    if (!newLead.full_name || !newLead.phone) { alert("Name and Phone are required."); return; }

    const targetBatch = selectedCourse.batch_no;

    const payload = {
      course_id: selectedCourse.id,
      course_code: selectedCourse.course_code || '',
      course_title: selectedCourse.title,
      category: selectedCourse.category,
      full_name: newLead.full_name,
      phone: newLead.phone,
      email: newLead.email || null,
      office_location: newLead.office_location || selectedCourse.location || 'Kathmandu',
      course_price: selectedCourse.price,
      discount_price: selectedCourse.discount_price,
      source: newLead.source,
      status: 'new',
      batch_no: targetBatch,
      booking_amount: 0,
      pending_amount: selectedCourse.discount_price || selectedCourse.price,
      current_education: null,
      institution_name: null,
      remarks: 'Manually added by Admin',
      counselor_notes: null,
      assigned_to: null,
      follow_up_date: null,
      is_confirmed: false
    };

    const { error } = await supabase.from('physical_leads').insert([payload]);
    if (error) { alert("Failed to add lead: " + error.message); return; }

    setIsAddingLead(false);
    setNewLead({ full_name: '', phone: '', email: '', office_location: '', source: 'Walk-in' });
    refresh();
  };

  const filteredLeads = data.filter(l => {
    const matchesCourse = l.course_id === selectedCourse?.id || l.course_code === selectedCourse?.course_code;
    if (!matchesCourse) return false;

    if (selectedBatch === 'unassigned') {
      if (l.batch_no) return false;
    } else if (selectedBatch !== null) {
      if (l.batch_no !== selectedBatch) return false;
    }

    if (confirmedFilter === 'confirmed' && !l.is_confirmed) return false;
    if (confirmedFilter === 'pending' && l.is_confirmed) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        l.full_name?.toLowerCase().includes(q) ||
        l.phone?.toLowerCase().includes(q) ||
        (l.email || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleCopyContactsCSV = () => {
    const header = "name,email,phone\n";
    const rows = filteredLeads.map(e => `"${e.full_name || ''}","${e.email || ''}","${e.phone || ''}"`).join("\n");
    navigator.clipboard.writeText(header + rows).then(() => alert("Contact details copied to clipboard!"));
  };

  const handleCopyCSV = () => {
    const header = "name,email,phone,course,office,status,confirmed\n";
    const rows = filteredLeads.map(e => `"${e.full_name || ''}","${e.email || ''}","${e.phone || ''}","${e.course_title || ''}","${e.office_location || ''}","${e.status}","${e.is_confirmed ? 'Yes' : 'No'}"`).join("\n");
    navigator.clipboard.writeText(header + rows).then(() => alert("Lead list copied to clipboard!"));
  };

  if (!selectedCourse) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5 mt-2 w-full">
        {physicalCourses.map(course => {
          const activeLeadCount = data.filter(l => 
            (l.course_id === course.id || l.course_code === course.course_code) && l.status !== 'cancelled'
          ).length;

          return (
            <div 
              key={course.id} 
              onClick={() => setSelectedCourse(course)} 
              className="flex flex-col items-center justify-center p-6 bg-white border border-[#E6E0D2] rounded-2xl hover:border-[#B8543D] hover:shadow-md cursor-pointer transition-all aspect-square relative text-center group w-full max-w-[280px] mx-auto"
            >
              <div className="absolute top-4 right-4 bg-[#B8543D]/10 text-[#B8543D] font-bold text-[10px] uppercase tracking-wider px-3 py-1.5 rounded-lg">
                {activeLeadCount} Active Leads
              </div>
              <div className="w-14 h-14 bg-[#B8543D]/10 text-[#B8543D] rounded-xl flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <Building2 size={26} />
              </div>
              <h3 className="font-bold text-[#14161F] text-base px-2 leading-snug">{course.title}</h3>
              <p className="text-xs text-[#B4AF9F] font-mono mt-1">{course.course_code || 'No Code'}</p>
            </div>
          );
        })}
        {physicalCourses.length === 0 && (
          <div className="col-span-full bg-white rounded-2xl border border-[#E6E0D2] p-16 text-center">
            <Building2 size={40} className="mx-auto mb-4 text-[#D8D2C2]" />
            <p className="text-lg font-serif font-bold text-[#14161F]">No physical offerings configured</p>
          </div>
        )}
      </div>
    );
  }

  if (selectedCourse && selectedBatch === null) {
    const availableBatches = Array.from(new Set([
      ...data.filter(l => (l.course_id === selectedCourse.id || l.course_code === selectedCourse.course_code) && l.batch_no).map(l => l.batch_no as number),
      selectedCourse.batch_no
    ])).filter(Boolean).sort((a, b) => b - a);

    const unassignedCount = data.filter(l => (l.course_id === selectedCourse.id || l.course_code === selectedCourse.course_code) && !l.batch_no).length;

    return (
      <div className="space-y-6 w-full">
        <div className="flex items-center gap-4">
          <button onClick={() => setSelectedCourse(null)} className="p-3 bg-white border border-[#E6E0D2] rounded-xl hover:bg-[#FAF8F3] transition-colors shadow-sm"><ArrowLeft size={19} className="text-[#4A4638]" /></button>
          <div><h2 className="text-xl font-serif font-bold text-[#14161F]">{selectedCourse.title}</h2><p className="text-sm font-medium text-[#857D6E]">Select a batch to view its leads</p></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {availableBatches.map(b => {
            const batchCount = data.filter(l => (l.course_id === selectedCourse.id || l.course_code === selectedCourse.course_code) && l.batch_no === b).length;
            return (
              <div key={b} onClick={() => setSelectedBatch(b)} className="flex items-center justify-between p-6 bg-white border border-[#E6E0D2] rounded-2xl hover:border-[#B8543D] hover:shadow-md cursor-pointer transition-all">
                <div className="flex items-center gap-4"><div className="w-14 h-14 bg-[#B8543D]/10 text-[#B8543D] rounded-xl flex items-center justify-center font-bold text-2xl">{b}</div><h3 className="font-bold text-[#14161F] text-xl">Batch {b}</h3></div>
                <div className="text-right"><p className="text-3xl font-bold text-[#B8543D]">{batchCount}</p><p className="text-[10px] font-bold text-[#B4AF9F] uppercase tracking-widest">Leads</p></div>
              </div>
            );
          })}
          {unassignedCount > 0 && (
            <div onClick={() => setSelectedBatch('unassigned')} className="flex items-center justify-between p-6 bg-white border border-[#E6E0D2] rounded-2xl hover:border-[#C08A28] hover:shadow-md cursor-pointer transition-all">
              <div className="flex items-center gap-4"><div className="w-14 h-14 bg-[#F5E7C8] text-[#8A6416] rounded-xl flex items-center justify-center font-bold text-2xl">?</div><h3 className="font-bold text-[#14161F] text-xl">Unassigned</h3></div>
              <div className="text-right"><p className="text-3xl font-bold text-[#C08A28]">{unassignedCount}</p><p className="text-[10px] font-bold text-[#B4AF9F] uppercase tracking-widest">Leads</p></div>
            </div>
          )}
        </div>
      </div>
    );
  }

  const predictedVolume = filteredLeads.reduce((sum, l) => sum + (l.discount_price ?? l.course_price ?? 0), 0);
  const collectedVolume = filteredLeads.reduce((sum, l) => sum + (l.booking_amount || 0), 0);
  const pendingVolume = filteredLeads.reduce((sum, l) => sum + ((l.discount_price ?? l.course_price ?? 0) - (l.booking_amount || 0)), 0);

  const totalPages = Math.ceil(filteredLeads.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedLeads = filteredLeads.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  return (
    <div className="space-y-6 w-full">
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button onClick={() => setSelectedBatch(null)} className="p-3 bg-white border border-[#E6E0D2] rounded-xl hover:bg-[#FAF8F3] transition-colors shadow-sm"><ArrowLeft size={19} className="text-[#4A4638]" /></button>
            <div><h2 className="text-xl font-serif font-bold text-[#14161F]">{selectedCourse.title}</h2><p className="text-sm font-medium text-[#857D6E]">{selectedBatch === 'unassigned' ? 'Unassigned Leads' : `Batch ${selectedBatch} Leads`}</p></div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button onClick={() => setIsAddingLead(true)} className="px-5 py-3 bg-[#B8543D] text-white rounded-xl text-sm font-bold hover:opacity-90 transition-colors flex items-center gap-2 shadow-sm whitespace-nowrap"><Plus size={16} /> Add Lead</button>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-3 items-center w-full">
          <div className="flex-1 min-w-[240px]">
            <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Search applicants by name, phone, or email..." />
          </div>
          <select className="bg-white border border-[#E6E0D2] rounded-xl px-4 py-3 text-sm font-bold text-[#14161F] outline-none shadow-sm cursor-pointer" value={confirmedFilter} onChange={e => setConfirmedFilter(e.target.value as any)}>
            <option value="all">Confirmed: All</option>
            <option value="pending">Confirmed: Pending</option>
            <option value="confirmed">Confirmed: Confirmed</option>
          </select>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center bg-[#FAF8F3] p-4 rounded-2xl border border-[#E6E0D2] mb-4 gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-bold text-[#4A4638] bg-white px-3 py-1.5 rounded-lg border border-[#E6E0D2] shadow-sm whitespace-nowrap">Showing {filteredLeads.length} Leads</span>
          <span className="text-sm font-bold text-[#0E7C7B] bg-[#0E7C7B]/10 px-3 py-1.5 rounded-lg border border-[#0E7C7B]/20 shadow-sm whitespace-nowrap">Predicted: <span className="font-black">Rs. {predictedVolume}</span></span>
          <span className="text-sm font-bold text-[#1E8F6F] bg-[#DCEEE6] px-3 py-1.5 rounded-lg border border-[#C3E3D5] shadow-sm whitespace-nowrap">Collected: <span className="font-black">Rs. {collectedVolume}</span></span>
          <span className="text-sm font-bold text-[#B23B3B] bg-[#F3DAD6] px-3 py-1.5 rounded-lg border border-[#EAC2BC] shadow-sm whitespace-nowrap">Pending: <span className="font-black">Rs. {pendingVolume}</span></span>
        </div>
        <div className="flex gap-2">
          <button onClick={handleCopyContactsCSV} className="flex items-center gap-2 bg-[#14161F] text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-[#22242F] transition-colors shadow-sm whitespace-nowrap shrink-0"><Copy size={14} /> Contact Details</button>
          <button onClick={handleCopyCSV} className="flex items-center gap-2 bg-[#14161F] text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-[#22242F] transition-colors shadow-sm whitespace-nowrap shrink-0"><Copy size={14} /> Copy CSV List</button>
        </div>
      </div>

      <div className="bg-white border border-[#E6E0D2] shadow-sm overflow-x-auto w-full flex flex-col rounded-xl">
        <div className="overflow-y-auto max-h-[600px] w-full">
          <table className="w-full text-left border-collapse table-auto text-xs">
            <thead>
              <tr className="bg-[#FAF8F3] border-b border-[#E6E0D2] text-[#4A4638] uppercase font-bold tracking-wider sticky top-0 z-10">
                <th className="p-3 border-r border-[#E6E0D2]">Full Name</th>
                <th className="p-3 border-r border-[#E6E0D2]">Email</th>
                <th className="p-3 border-r border-[#E6E0D2]">Contact Number</th>
                <th className="p-3 border-r border-[#E6E0D2]">Locked Fee</th>
                <th className="p-3 border-r border-[#E6E0D2]">Paid Amount</th>
                <th className="p-3 border-r border-[#E6E0D2]">Remaining Amount</th>
                <th className="p-3 border-r border-[#E6E0D2] text-center">Confirmed</th>
                <th className="p-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedLeads.map(lead => {
                const lockedFee = lead.discount_price ?? lead.course_price ?? 0;
                const paidAmt = lead.booking_amount || 0;
                const pendingAmt = lockedFee - paidAmt;

                return (
                  <tr key={lead.id} className="border-b border-[#EFEBE1] hover:bg-[#FBF6EA] transition-colors">
                    <td className="p-3 border-r border-[#E6E0D2] font-bold text-[#14161F]">{lead.full_name}</td>
                    <td className="p-3 border-r border-[#E6E0D2] text-[#4A4638]">{lead.email || '-'}</td>
                    <td className="p-3 border-r border-[#E6E0D2] text-[#4A4638]">{lead.phone}</td>
                    <td className="p-3 border-r border-[#E6E0D2] text-[#4A4638]">Rs. {lockedFee}</td>
                    <td className="p-3 border-r border-[#E6E0D2] text-[#1E8F6F] font-bold">Rs. {paidAmt}</td>
                    <td className={`p-3 border-r border-[#E6E0D2] font-bold ${pendingAmt > 0 ? 'text-[#B23B3B]' : 'text-[#4A4638]'}`}>
                      Rs. {pendingAmt}
                    </td>
                    <td className="p-3 border-r border-[#E6E0D2] text-center">
                      <input type="checkbox" checked={!!lead.is_confirmed} onChange={() => toggleConfirmation(lead.id, !!lead.is_confirmed)} className="w-5 h-5 cursor-pointer accent-[#1E8F6F] rounded" />
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex justify-center gap-2">
                        <button onClick={() => openEditLead(lead)} className="text-[10px] font-bold bg-[#FAF8F3] border border-[#E6E0D2] px-3 py-1.5 rounded hover:bg-[#EFEBE1] transition-colors shadow-sm flex items-center gap-1"><Edit2 size={12} />Edit</button>
                        <button onClick={() => deleteLead(lead.id)} className="text-[10px] font-bold bg-[#F3DAD6] text-[#B23B3B] border border-[#EAC2BC] px-3 py-1.5 rounded hover:opacity-80 transition-colors flex items-center gap-1"><Trash2 size={12} />Delete</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {paginatedLeads.length === 0 && <tr><td colSpan={8} className="p-8 text-center text-[#857D6E] font-medium">No matching pipeline records found.</td></tr>}
            </tbody>
          </table>
        </div>
        {filteredLeads.length > 0 && (
          <div className="flex flex-wrap items-center justify-between p-4 border-t border-[#E6E0D2] bg-[#FAF8F3] shrink-0 gap-4">
            <span className="text-xs font-bold text-[#4A4638]">Showing {startIndex + 1} to {Math.min(startIndex + ITEMS_PER_PAGE, filteredLeads.length)} of {filteredLeads.length} entries</span>
            <div className="flex gap-2">
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-4 py-2 rounded border border-[#E6E0D2] text-xs font-bold bg-white text-[#4A4638] disabled:opacity-50 hover:bg-[#EFEBE1] transition-colors">Previous</button>
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || totalPages === 0} className="px-4 py-2 rounded border border-[#E6E0D2] text-xs font-bold bg-white text-[#4A4638] disabled:opacity-50 hover:bg-[#EFEBE1] transition-colors">Next</button>
            </div>
          </div>
        )}
      </div>

      {isAddingLead && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#14161F]/60 p-4 backdrop-blur-sm" onClick={() => setIsAddingLead(false)}>
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full relative" onClick={e => e.stopPropagation()}>
            <button onClick={() => setIsAddingLead(false)} className="absolute top-6 right-6 text-[#B4AF9F] hover:text-[#14161F]"><X /></button>
            <h3 className="text-2xl font-serif font-bold mb-1">Add Walk-in Lead</h3>
            <p className="text-xs font-medium text-[#857D6E] mb-6">Create a physical lead directly in the ledger.</p>
            <div className="space-y-4">
              <div><label className="block text-[10px] font-bold text-[#857D6E] uppercase mb-1">Full Name</label><input type="text" value={newLead.full_name} onChange={(e) => setNewLead({ ...newLead, full_name: e.target.value })} className="w-full bg-[#FAF8F3] p-3.5 rounded-xl outline-none border border-[#E6E0D2] focus:border-[#B8543D] font-bold text-[#14161F]" placeholder="John Doe" /></div>
              <div><label className="block text-[10px] font-bold text-[#857D6E] uppercase mb-1">Phone Number</label><input type="text" value={newLead.phone} onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })} className="w-full bg-[#FAF8F3] p-3.5 rounded-xl outline-none border border-[#E6E0D2] focus:border-[#B8543D] font-bold text-[#14161F]" placeholder="98XXXXXXXX" /></div>
              <div><label className="block text-[10px] font-bold text-[#857D6E] uppercase mb-1">Email Address (Optional)</label><input type="email" value={newLead.email} onChange={(e) => setNewLead({ ...newLead, email: e.target.value })} className="w-full bg-[#FAF8F3] p-3.5 rounded-xl outline-none border border-[#E6E0D2] focus:border-[#B8543D] font-bold text-[#14161F]" placeholder="john@example.com" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-[10px] font-bold text-[#857D6E] uppercase mb-1">Office / Branch</label><input type="text" value={newLead.office_location} onChange={(e) => setNewLead({ ...newLead, office_location: e.target.value })} className="w-full bg-[#FAF8F3] p-3.5 rounded-xl outline-none border border-[#E6E0D2] focus:border-[#B8543D] font-bold text-[#14161F]" placeholder="Kathmandu" /></div>
                <div><label className="block text-[10px] font-bold text-[#857D6E] uppercase mb-1">Source</label><input type="text" value={newLead.source} onChange={(e) => setNewLead({ ...newLead, source: e.target.value })} className="w-full bg-[#FAF8F3] p-3.5 rounded-xl outline-none border border-[#E6E0D2] focus:border-[#B8543D] font-bold text-[#14161F]" placeholder="Walk-in" /></div>
              </div>
              <div className="bg-[#B8543D]/10 p-3 rounded-xl border border-[#B8543D]/20 mt-2">
                <p className="text-xs font-bold text-[#B8543D]">Note: This lead will be saved permanently into the currently active Batch {selectedCourse?.batch_no || '(Unassigned)'}.</p>
              </div>
            </div>
            <div className="mt-8 flex justify-end gap-3">
              <button onClick={() => setIsAddingLead(false)} className="px-5 py-3 font-bold text-[#857D6E] hover:text-[#14161F] transition-colors">Cancel</button>
              <button onClick={saveManualLead} className="px-6 py-3 rounded-xl font-bold bg-[#B8543D] text-white shadow-lg hover:opacity-90 transition-colors">Add Lead</button>
            </div>
          </div>
        </div>
      )}

      {editingLead && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#14161F]/60 p-4 backdrop-blur-sm" onClick={() => setEditingLead(null)}>
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full relative" onClick={e => e.stopPropagation()}>
            <button onClick={() => setEditingLead(null)} className="absolute top-6 right-6 text-[#B4AF9F] hover:text-[#14161F]"><X /></button>
            <h3 className="text-xl font-serif font-bold mb-1">Edit Payment Details</h3>
            <p className="text-xs font-medium text-[#857D6E] mb-6">{editingLead.full_name}</p>
            <div className="space-y-4">
              <div><label className="block text-[10px] font-bold text-[#857D6E] uppercase mb-1">Locked Fee (Rs)</label><input type="number" value={editLocked} onChange={(e) => setEditLocked(Number(e.target.value))} className="w-full bg-[#FAF8F3] p-3 rounded-xl outline-none border border-[#E6E0D2] focus:border-[#8A6416] font-black text-[#8A6416]" /></div>
              <div><label className="block text-[10px] font-bold text-[#857D6E] uppercase mb-1">Paid Amount (Rs)</label><input type="number" value={editPaid} onChange={(e) => setEditPaid(Number(e.target.value))} className="w-full bg-[#FAF8F3] p-3 rounded-xl outline-none border border-[#E6E0D2] focus:border-[#1E8F6F] font-black text-[#1E8F6F]" /></div>
              <div className="p-3 bg-[#EFEBE1] rounded-xl flex justify-between items-center border border-[#E6E0D2]">
                <label className="block text-[10px] font-bold text-[#857D6E] uppercase">Remaining Amount</label>
                <span className={`font-black ${editLocked - editPaid > 0 ? 'text-[#B23B3B]' : 'text-[#1E8F6F]'}`}>Rs. {Math.max(0, editLocked - editPaid)}</span>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setEditingLead(null)} className="px-4 py-2 font-bold text-[#857D6E] hover:text-[#14161F] transition-colors">Cancel</button>
              <button onClick={saveLeadPayment} className="px-6 py-2 rounded-xl font-bold bg-[#0E7C7B] text-white shadow-lg hover:opacity-90 transition-colors">Save Details</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================================================
   CERTIFICATES
============================================================================ */
function CertificatesManager({ data, syllabi, refresh, onOpenChat }: { data: Certificate[], syllabi: any[], refresh: () => void, onOpenChat: (id: string) => void }) {
  const supabase = useSupabase();
  const router = useRouter();
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const getImageUrl = (path: string) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    const { data } = supabase.storage.from('certificates').getPublicUrl(path);
    return data.publicUrl;
  };

  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const [form, setForm] = useState({
    id: null as string | null, name: '', email: '', syllabus_name: '',
    issue_date: new Date().toISOString().split('T')[0], certificate_code: '', existing_image: '', file: null as File | null
  });

  useEffect(() => { setCurrentPage(1); }, [searchQuery]);

  const generateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = 'Gyan-';
    for (let i = 0; i < 6; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
    return result;
  };

  const openEditModal = (cert: Certificate) => {
    setForm({ id: cert.id, name: cert.name || '', email: cert.email || '', syllabus_name: cert.syllabus_name || '', issue_date: cert.issue_date || new Date().toISOString().split('T')[0], certificate_code: cert.certificate_code || '', existing_image: cert.certificate_image || '', file: null });
    setEditModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.email || !form.syllabus_name) { alert('Please fill out all text fields.'); return; }
    if (!form.id && !form.file) { alert('You must upload an image when creating a new certificate.'); return; }
    setUploading(true);
    let finalImageUrl = form.existing_image;
    if (form.file) {
      const fileExt = form.file.name.split('.').pop();
      const fileName = `${Date.now()}_${form.name.replace(/\s+/g, '_')}.${fileExt}`;
      const { data: uploadData, error: uploadError } = await supabase.storage.from('certificates').upload(fileName, form.file);
      if (uploadError) { alert('Error uploading image: ' + uploadError.message); setUploading(false); return; }
      const { data: { publicUrl } } = supabase.storage.from('certificates').getPublicUrl(uploadData.path);
      finalImageUrl = publicUrl;
    }
    const matchingSyllabus = syllabi.find(s => s.name === form.syllabus_name);
    const resolvedSyllabusId = matchingSyllabus ? matchingSyllabus.id : null;
    const certCode = form.id ? form.certificate_code : generateCode();
    const payload = { name: form.name, email: form.email, syllabus_name: form.syllabus_name, syllabus_id: resolvedSyllabusId, issue_date: form.issue_date, certificate_code: certCode, certificate_image: finalImageUrl };
    let error;
    if (form.id) { const { error: updateError } = await supabase.from('certificates').update(payload).eq('id', form.id); error = updateError; }
    else { const { error: insertError } = await supabase.from('certificates').insert([payload]); error = insertError; }
    setUploading(false);
    if (!error) { setEditModalOpen(false); refresh(); }
    else alert('Database error: ' + error.message);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Archive this certificate? It will be removed from the registry but not permanently erased.")) {
      const { error } = await supabase.from("certificates").update({ deleted: true }).eq("id", id);
      if (error) alert(error.message); else refresh();
    }
  };

  const filteredData = data.filter((cert) => {
    const s = searchQuery.toLowerCase();
    return (cert.name && cert.name.toLowerCase().includes(s)) || (cert.email && cert.email.toLowerCase().includes(s)) || (cert.syllabus_name && cert.syllabus_name.toLowerCase().includes(s)) || (cert.certificate_code && cert.certificate_code.toLowerCase().includes(s));
  });

  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentData = filteredData.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 w-full">
      <SectionHeader eyebrow="Records" title="Certificate Registry" subtitle="The permanent record of every completion."
        action={<button onClick={() => router.push('/admin/bulk-upload')} className="bg-[#14161F] text-white px-5 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg hover:bg-[#22242F] transition-all whitespace-nowrap"><Plus size={17} /> Generate New</button>} />

      <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Search by name, email, course, or certificate code..." />

      <div className="bg-white rounded-2xl shadow-sm border border-[#E6E0D2] overflow-x-auto w-full flex flex-col">
        <div className="overflow-y-auto max-h-[600px] w-full">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#FAF8F3] border-b border-[#E6E0D2] text-[10px] font-bold text-[#857D6E] uppercase tracking-widest">
                <th className="p-5">Student</th><th className="p-5">Course</th><th className="p-5">Issue Date & Code</th><th className="p-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentData.map(cert => (
                <tr key={cert.id} className="border-b border-[#EFEBE1] hover:bg-[#FAF8F3] cursor-pointer" onClick={() => cert.certificate_image && setPreviewImage(cert.certificate_image)}>
                  <td className="p-5">
                    <p className="font-bold text-[#14161F] cursor-pointer hover:text-[#0E7C7B] hover:underline" onClick={(e) => { e.stopPropagation(); cert.user_id ? onOpenChat(cert.user_id) : alert('No linked user account.'); }}>{cert.name}</p>
                    <p className="text-sm text-[#857D6E] mt-1 break-all">{cert.email}</p>
                  </td>
                  <td className="p-5"><p className="font-bold text-[#4A4638]">{cert.syllabus_name}</p></td>
                  <td className="p-5"><p className="text-sm font-bold text-[#14161F]">{cert.issue_date ? new Date(cert.issue_date).toLocaleDateString() : 'N/A'}</p><p className="text-xs font-mono text-[#857D6E] mt-1">{cert.certificate_code || '-'}</p></td>
                  <td className="p-5 text-right" onClick={e => e.stopPropagation()}>
                    <div className="flex justify-end gap-2">
                      <button onClick={() => openEditModal(cert)} className="p-2 text-[#0E7C7B] bg-[#0E7C7B]/10 rounded-lg hover:bg-[#0E7C7B]/20 transition-colors" title="Edit"><Edit2 size={15} /></button>
                      <button onClick={() => handleDelete(cert.id)} className="p-2 text-[#B23B3B] bg-[#F3DAD6] rounded-lg hover:opacity-80" title="Archive"><Archive size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredData.length === 0 && <tr><td colSpan={4} className="p-10 text-center text-[#857D6E]">No matching certificates found.</td></tr>}
            </tbody>
          </table>
        </div>
        {filteredData.length > 0 && (
          <div className="flex flex-wrap items-center justify-between p-6 border-t border-[#E6E0D2] bg-[#FAF8F3] shrink-0 gap-4">
            <span className="text-sm font-medium text-[#857D6E]">Showing {startIndex + 1} to {Math.min(startIndex + ITEMS_PER_PAGE, filteredData.length)} of {filteredData.length} entries</span>
            <div className="flex gap-2">
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-4 py-2 rounded-xl text-sm font-bold bg-white border border-[#E6E0D2] text-[#4A4638] disabled:opacity-50 hover:bg-[#EFEBE1] transition-colors">Previous</button>
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || totalPages === 0} className="px-4 py-2 rounded-xl text-sm font-bold bg-white border border-[#E6E0D2] text-[#4A4638] disabled:opacity-50 hover:bg-[#EFEBE1] transition-colors">Next</button>
            </div>
          </div>
        )}
      </div>

      {previewImage && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-[#14161F]/80 p-4 backdrop-blur-sm" onClick={() => setPreviewImage(null)}>
          <div className="relative max-w-4xl w-full" onClick={e => e.stopPropagation()}>
            <button onClick={() => setPreviewImage(null)} className="absolute -top-10 right-0 text-white/70 hover:text-white p-2 transition-colors"><X size={26} /></button>
            <img src={getImageUrl(previewImage)} alt="Certificate Preview" className="w-full rounded-2xl shadow-2xl border border-white/10" />
            <a href={getImageUrl(previewImage)} target="_blank" rel="noreferrer" className="mt-4 flex items-center justify-center gap-2 text-white/70 hover:text-white text-sm font-bold transition-colors" onClick={e => e.stopPropagation()}><ExternalLink size={16} /> Open Full Size</a>
          </div>
        </div>
      )}

      {editModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#14161F]/60 p-4 backdrop-blur-sm" onClick={() => !uploading && setEditModalOpen(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full relative overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            <button onClick={() => setEditModalOpen(false)} disabled={uploading} className="absolute top-6 right-6 text-[#B4AF9F] hover:text-[#14161F] z-10"><X /></button>
            <div className="p-6 border-b border-[#E6E0D2] bg-[#FAF8F3] mt-4"><h3 className="text-2xl font-serif font-bold text-[#14161F]">Edit Certificate Record</h3><p className="text-sm text-[#857D6E] font-medium mt-1">Updates the verified registry directly.</p></div>
            <div className="p-6 space-y-4">
              <div><label className="block text-[10px] font-bold text-[#857D6E] uppercase mb-1 ml-1">Student Full Name</label><input type="text" className="w-full bg-[#FAF8F3] p-3.5 rounded-xl outline-none border border-[#E6E0D2] focus:border-[#B8862E] font-bold text-[#14161F] text-sm" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
              <div><label className="block text-[10px] font-bold text-[#857D6E] uppercase mb-1 ml-1">Student Email Address</label><input type="email" className="w-full bg-[#FAF8F3] p-3.5 rounded-xl outline-none border border-[#E6E0D2] focus:border-[#B8862E] font-bold text-[#14161F] text-sm" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
              <div>
                <label className="block text-[10px] font-bold text-[#857D6E] uppercase mb-1 ml-1">Course Name</label>
                <input list="syllabi-options" type="text" className="w-full bg-[#FAF8F3] p-3.5 rounded-xl outline-none border border-[#E6E0D2] focus:border-[#B8862E] font-bold text-[#14161F] text-sm" value={form.syllabus_name} onChange={e => setForm({ ...form, syllabus_name: e.target.value })} placeholder="e.g. Graphic Design Masterclass" />
                <datalist id="syllabi-options">{syllabi.map(s => <option key={s.id} value={s.name} />)}</datalist>
              </div>
              <div><label className="block text-[10px] font-bold text-[#857D6E] uppercase mb-1 ml-1">Issue Date</label><input type="date" className="w-full bg-[#FAF8F3] p-3.5 rounded-xl outline-none border border-[#E6E0D2] focus:border-[#B8862E] font-bold text-[#14161F] text-sm" value={form.issue_date} onChange={e => setForm({ ...form, issue_date: e.target.value })} /></div>
              <div>
                <label className="block text-[10px] font-bold text-[#857D6E] uppercase mb-1 ml-1">Upload Certificate (PNG/JPG)</label>
                <label className="w-full flex items-center justify-center gap-2 bg-[#0E7C7B]/10 text-[#0E7C7B] p-4 rounded-xl border border-dashed border-[#0E7C7B]/30 cursor-pointer hover:bg-[#0E7C7B]/20 transition-colors">
                  <Upload size={17} />
                  {form.file ? form.file.name : form.existing_image ? 'Image Exists (Click to Replace)' : 'Select Image File'}
                  <input type="file" accept="image/png, image/jpeg" className="hidden" onChange={e => { if (e.target.files && e.target.files[0]) setForm({ ...form, file: e.target.files[0] }); }} />
                </label>
              </div>
            </div>
            <div className="p-6 border-t border-[#E6E0D2] bg-[#FAF8F3] flex justify-end gap-3 shrink-0">
              <button onClick={() => setEditModalOpen(false)} disabled={uploading} className="px-6 py-3 font-bold text-[#857D6E] hover:text-[#14161F] disabled:opacity-50">Cancel</button>
              <button onClick={handleSave} disabled={uploading} className="px-8 py-3 rounded-xl font-bold bg-[#14161F] text-white shadow-lg hover:bg-[#22242F] transition-colors disabled:opacity-50 flex items-center gap-2">{uploading ? <Loader2 size={16} className="animate-spin" /> : 'Save Changes'}</button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}

/* ============================================================================
   CHAT MODAL
============================================================================ */
function ChatModal({ userId, onClose, profilesMap }: any) {
  const supabase = useSupabase();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchMessages = async () => {
      const { data } = await supabase.from("messages").select("*").eq("user_id", userId).order("created_at", { ascending: true });
      if (data) setMessages(data);
    };
    fetchMessages();
    const channel = supabase.channel(`chat_updates_${userId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `user_id=eq.${userId}` }, (payload) => {
        setMessages(prev => prev.some(msg => msg.id === payload.new.id) ? prev : [...prev, payload.new as Message]);
      }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userId, supabase]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    const msgPayload = { user_id: userId, sender_role: 'admin', content: newMessage.trim() };
    const { data, error } = await supabase.from("messages").insert([msgPayload]).select().single();
    if (!error && data) { setNewMessage(""); setMessages(prev => [...prev, data as Message]); }
    else alert("Failed to send message: " + error?.message);
  };

  const userName = profilesMap?.full_name || "User";

  return (
    <div className="fixed inset-0 z-[120] flex justify-end bg-[#14161F]/20 backdrop-blur-sm" onClick={onClose}>
      <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b border-[#E6E0D2] flex justify-between items-center bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#EFEBE1] flex items-center justify-center font-bold text-[#857D6E] overflow-hidden">
              {profilesMap?.avatar_url ? <img src={profilesMap.avatar_url} className="w-full h-full object-cover" /> : userName.charAt(0)}
            </div>
            <div><h3 className="font-bold text-[#14161F]">{userName}</h3><span className="text-[10px] uppercase font-bold text-[#1E8F6F] tracking-wider">Online</span></div>
          </div>
          <button onClick={onClose} className="p-2 text-[#B4AF9F] hover:text-[#14161F] transition-colors bg-[#FAF8F3] hover:bg-[#EFEBE1] rounded-full"><X size={18} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#FAF8F3]">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-[#B4AF9F] space-y-2"><MessageSquare size={38} className="opacity-30" /><p className="text-sm font-medium">No messages yet. Say hello!</p></div>
          ) : (
            messages.map((msg, idx) => {
              const isAdmin = msg.sender_role === 'admin';
              return (
                <div key={idx} className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'}`}>
                  <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${isAdmin ? 'bg-[#14161F] text-white rounded-tr-sm' : 'bg-white border border-[#E6E0D2] text-[#14161F] rounded-tl-sm shadow-sm'}`}>{msg.content}</div>
                  <span className="text-[10px] text-[#B4AF9F] mt-1 font-medium px-1">{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
        <div className="p-4 bg-white border-t border-[#E6E0D2] shrink-0">
          <form onSubmit={handleSend} className="relative flex items-center">
            <input type="text" value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder="Type your message..." className="w-full bg-[#FAF8F3] pl-4 pr-12 py-3.5 rounded-full outline-none border border-[#E6E0D2] focus:border-[#B8862E] font-medium text-[#14161F] text-sm transition-all" />
            <button type="submit" disabled={!newMessage.trim()} className="absolute right-2 p-2 bg-[#14161F] text-white rounded-full hover:bg-[#22242F] disabled:opacity-50 transition-colors shadow-sm"><Send size={16} /></button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}