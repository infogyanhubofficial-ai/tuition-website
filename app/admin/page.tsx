"use client";
import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard, FileText, BookOpen, LogOut, Plus,
  Bell, Users, Crown, X, Edit2, Check, MapPin, Clock,
  DollarSign, Trash2, Save, GraduationCap, Briefcase, User,
  ExternalLink, Phone, Monitor, SearchX, Send, Lock, MessageCircle,
  AlertCircle, CheckCircle, Flame, Sparkles, Link as LinkIcon, RotateCcw,
  ShoppingCart, CalendarDays, Award, ChevronDown, Search, EyeOff, Eye,
  Loader2, MessageSquare, ArrowLeft, Upload, Copy, Settings, Layers,
  CheckSquare
} from "lucide-react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { createClient } from "@/lib/supabase/client";

// --- TYPES ---
interface Vacancy {
  id: number; subject: string; location: string; class_level: string;
  description: string; salary_range: string; tuition_type: string;
  student_gender_pref: string; class_time: string; days_a_week: string;
  contact_number: string; contact_name: string; status: boolean; urgent: boolean;
  user_id?: string; created_at: string; applicant_count?: number;
}
interface VacancyApplication {
  id: number; vacancy_id: number; applicant_name: string; applicant_phone: string;
  applicant_email: string; cover_message: string; status: string; user_id?: string;
  vacancies?: { subject: string; location: string; salary_range: string; contact_name: string; contact_number: string; user_id?: string; };
}
interface StudentRequest {
  id: number; student_name: string; phone: string; grade: string;
  preferred_mode: string; message: string; status: string; created_at: string;
  tutor_id?: number; user_id?: string;
  tutors?: { name: string; contact_num: string; hour_rate: number; user_id?: string; };
}
interface Tutor {
  id: number; name: string; contact_num: string; cv_url: string; id_url: string;
  avatar_url: string; education: string; bio: string; verified: boolean;
  availability: boolean; created_at: string; subject: string[]; location: string;
  hour_rate: number; user_id?: string;
}
interface OnlineCourse {
  id: string; title: string; category: string; fee: number; discount: number; active_batch_no: number;
  duration: string; cover_pic: string; tutor_name: string; is_active: boolean;
  start_datetime: string; created_at: string;
}
interface CourseBatch {
  id: string;
  course_id: string; // syllabus_id
  course_name: string;
  batch_no: number;
  start_datetime?: string;
  timing?: string;
  online_class_link?: string;
  google_classroom_link?: string;
  whatsapp_group_link?: string;
  is_active: boolean;
  created_at?: string;
}
interface Enrollment {
  id: string; user_id: string; course_id: string; full_name: string; email: string;
  whatsapp_number: string; remarks: string; status: string; created_at: string;
  course_name: string; course_details_url: string; locked_price: number;
  starting_date: string; confirmed: boolean;
  paid_amount: number;
  remaining_amount: number;
  batch_no: number | null;
  order_id?: string | null;
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
  order_type: string; order_name: string; 
  paid_amount: number; 
  pending_amount: number; 
  locked_price: number; 
  screenshot_url: string;
  payment_screenshots: string[]; // Support for multiple screenshots
  status: string; created_at: string; user_id?: string;
}

// --- UTILS ---
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

// --- MAIN COMPONENT ---
export default function AdminDashboard() {
  const router = useRouter();
  const supabase = createClient();

  const [isLocked, setIsLocked] = useState(true);
  const [loginUser, setLoginUser] = useState("");
  const [loginPass, setLoginPass] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [activeTab, setActiveTab] = useState("Dashboard");

  const [vacancies, setVacancies] = useState<Vacancy[]>([]);
  const [applications, setApplications] = useState<VacancyApplication[]>([]);
  const [requests, setRequests] = useState<StudentRequest[]>([]);
  const [courses, setCourses] = useState<OnlineCourse[]>([]);
  const [batches, setBatches] = useState<CourseBatch[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [conversations, setConversations] = useState<Message[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [syllabi, setSyllabi] = useState<any[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [chatOpen, setChatOpen] = useState(false);
  const [activeUser, setActiveUser] = useState<string | null>(null);

  useEffect(() => {
    const checkAdminAndFetch = async () => {
      const unlocked = localStorage.getItem('admin_unlocked');
      if (unlocked === 'true') {
        setIsLocked(false);
      }
      await fetchAllData();
      setLoadingAuth(false);
    };
    
    checkAdminAndFetch();
    
    const channels = supabase.channel('admin-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => fetchAllData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vacancy_applications' }, () => fetchAllData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'student_requests' }, () => fetchAllData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vacancies' }, () => fetchAllData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'certificates' }, () => fetchAllData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'enrollments_v2' }, () => fetchAllData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders_v2' }, () => fetchAllData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'course_batches_v2' }, () => fetchAllData())
      .subscribe();
      
    return () => { supabase.removeChannel(channels); };
  }, [router]);

  const fetchAllData = async () => {
    const [vacRes, appRes, reqRes, curRes, tutRes, msgRes, certRes, sylRes, enrRes, ordRes, batchRes] = await Promise.all([
      supabase.from("vacancies").select("*").order("created_at", { ascending: false }),
      supabase.from("vacancy_applications").select("*, vacancies(subject, location, salary_range, contact_name, contact_number, user_id)").order("id", { ascending: false }),
      supabase.from("student_requests").select("*, tutors(name, contact_num, hour_rate, user_id)").order("id", { ascending: false }),
      supabase.from("online_courses_v2").select("*").order("created_at", { ascending: false }),
      supabase.from("tutors").select("*").order("created_at", { ascending: false }),
      supabase.from("messages").select("*").order("created_at", { ascending: false }),
      supabase.from("certificates").select("*").order("created_at", { ascending: false }),
      supabase.from("syllabi_v2").select("id, name"),
      supabase.from("enrollments_v2").select("*, course_batches_v2(syllabus_id, batch_no)").order("created_at", { ascending: false }),
      supabase.from("orders_v2").select("*").order("created_at", { ascending: false }),
      supabase.from("course_batches_v2").select("*").order("batch_no", { ascending: false })
    ]);

    if (vacRes.data) setVacancies(vacRes.data);
    if (appRes.data) setApplications(appRes.data);
    if (reqRes.data) setRequests(reqRes.data);
    
    if (curRes.data) setCourses(curRes.data.map((c: any) => ({ ...c, id: c.syllabus_id?.toString() || c.id, title: c.name || c.title })));
    if (tutRes.data) setTutors(tutRes.data);
    if (certRes.data) setCertificates(certRes.data);
    if (sylRes.data) setSyllabi(sylRes.data);
    
    const fetchedOrders = ordRes.data || [];

    if (fetchedOrders.length > 0) {
      setOrders(fetchedOrders.map((o: any) => ({ 
        ...o, 
        full_name: o.full_name || 'N/A',
        email: o.email || 'N/A',
        contact_number: o.whatsapp_number || o.contact_number || 'N/A', 
        paid_amount: o.paid_amount ?? 0,
        pending_amount: o.pending_amount ?? 0,
        locked_price: o.locked_price ?? 0,
        order_type: o.order_type || 'Online Course',
        order_name: o.order_name || 'Course Enrollment',
        payment_screenshots: o.payment_screenshots || [],
        screenshot_url: o.payment_screenshots?.length > 0 ? o.payment_screenshots[o.payment_screenshots.length - 1] : o.screenshot_url 
      })));
    }

    if (enrRes.data) {
      setEnrollments(enrRes.data.map((e: any) => {
        const linkedOrder = fetchedOrders.find((o: any) => o.enrollment_id === e.id);
        return { 
          ...e, 
          confirmed: e.is_confirmed !== undefined ? e.is_confirmed : e.confirmed, 
          course_id: e.course_batches_v2?.syllabus_id?.toString() || e.course_id, 
          batch_no: e.course_batches_v2?.batch_no || e.batch_no,
          locked_price: linkedOrder ? Number(linkedOrder.locked_price) : 0,
          paid_amount: linkedOrder ? Number(linkedOrder.paid_amount) : 0,
          remaining_amount: linkedOrder ? Number(linkedOrder.remaining_amount) : 0,
          order_id: linkedOrder ? linkedOrder.id : null
        };
      }));
    }
    
    if (batchRes.data) setBatches(batchRes.data.map((b: any) => ({ ...b, course_id: b.syllabus_id?.toString() || b.course_id })));

    if (msgRes.error) {
      console.error("Error fetching messages:", msgRes.error);
      setLoadingConversations(false);
    } else if (msgRes.data) {
      const userIds = [...new Set(msgRes.data.map((m: any) => m.user_id))].filter(Boolean);
      let profileMap: Record<string, any> = {};
      if (userIds.length > 0) {
        const { data: profiles } = await supabase.from('profiles').select('id, full_name, avatar_url, role').in('id', userIds);
        if (profiles) profiles.forEach(p => { profileMap[p.id] = p; });
      }
      const unreadCounts: Record<string, number> = {};
      for (const msg of msgRes.data) {
        if (msg.sender_role === 'user' && msg.is_read === false) {
          unreadCounts[msg.user_id] = (unreadCounts[msg.user_id] || 0) + 1;
        }
      }
      const uniqueConversations: Message[] = [];
      const seenUsers = new Set();
      for (const msg of msgRes.data) {
        if (!seenUsers.has(msg.user_id)) {
          seenUsers.add(msg.user_id);
          const hasUnread = (unreadCounts[msg.user_id] || 0) > 0;
          uniqueConversations.push({ ...msg, is_read: !hasUnread, profiles: profileMap[msg.user_id] } as Message);
        }
      }
      setConversations(uniqueConversations);
      setLoadingConversations(false);
    }
  };

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

  if (loadingAuth) return <div className="min-h-screen flex items-center justify-center bg-slate-900 text-indigo-500"><Loader2 className="animate-spin" size={48} /></div>;

  if (isLocked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4">
        <div className="bg-white p-10 rounded-[30px] shadow-2xl max-w-sm w-full relative">
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 h-20 w-20 bg-indigo-600 rounded-full flex items-center justify-center border-4 border-slate-900 shadow-xl">
            <Lock className="text-white" size={32} />
          </div>
          <h2 className="text-2xl font-black text-center text-slate-900 mt-6 mb-2">Admin Locked</h2>
          <p className="text-center text-slate-500 text-sm font-medium mb-8">Please enter your credentials.</p>
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase mb-2">Username</label>
              <input type="text" value={loginUser} onChange={(e) => setLoginUser(e.target.value)} className="w-full bg-slate-50 p-4 rounded-xl outline-none border border-slate-200 focus:border-indigo-500 font-bold text-slate-800 transition-colors" placeholder="Username" />
            </div>
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase mb-2">Password</label>
              <input type="password" value={loginPass} onChange={(e) => setLoginPass(e.target.value)} className="w-full bg-slate-50 p-4 rounded-xl outline-none border border-slate-200 focus:border-indigo-500 font-bold text-slate-800 transition-colors" placeholder="Password" />
            </div>
            {loginError && <p className="text-red-500 text-xs font-bold text-center mt-2">{loginError}</p>}
            <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 rounded-xl shadow-lg shadow-indigo-600/30 transition-all mt-4">Unlock Dashboard</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex">
      <aside className="w-72 bg-slate-900 text-slate-300 flex flex-col fixed h-full z-40 overflow-y-auto no-scrollbar">
        <div className="p-8 flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black shadow-lg shadow-indigo-500/30">GH</div>
          <p className="text-xl font-black text-white tracking-tight">Admin<span className="text-indigo-400">Panel</span></p>
        </div>
        <nav className="flex-1 px-4 space-y-2 mt-4 pb-10">
          <SidebarBtn icon={<LayoutDashboard size={20}/>} label="Dashboard (Inbox)" active={activeTab === "Dashboard"} onClick={() => setActiveTab("Dashboard")} />
          <SidebarBtn icon={<ShoppingCart size={20}/>} label="Orders" active={activeTab === "Orders"} onClick={() => setActiveTab("Orders")} />
          <SidebarBtn icon={<Users size={20}/>} label="Tutor Listing" active={activeTab === "Tutors"} onClick={() => setActiveTab("Tutors")} />
          <SidebarBtn icon={<Briefcase size={20}/>} label="Vacancies" active={activeTab === "Vacancies"} onClick={() => setActiveTab("Vacancies")} />
          <SidebarBtn icon={<FileText size={20}/>} label="Applications" active={activeTab === "Applications"} onClick={() => setActiveTab("Applications")} />
          <SidebarBtn icon={<MessageSquare size={20}/>} label="Tuition Requests" active={activeTab === "Tuition Requests"} onClick={() => setActiveTab("Tuition Requests")} />
          <SidebarBtn icon={<Layers size={20}/>} label="Batch Management" active={activeTab === "Batch Management"} onClick={() => setActiveTab("Batch Management")} />
          <SidebarBtn icon={<CalendarDays size={20}/>} label="Bookings" active={activeTab === "Bookings"} onClick={() => setActiveTab("Bookings")} />
          <SidebarBtn icon={<Award size={20}/>} label="Certificates" active={activeTab === "Certificates"} onClick={() => setActiveTab("Certificates")} />
        </nav>
        <div className="p-4 border-t border-slate-800">
          <SidebarBtn icon={<LogOut size={20}/>} label="Lock Screen" color="text-red-400 hover:bg-red-500/10" onClick={handleLogout} />
        </div>
      </aside>

      <main className="ml-72 flex-1 p-10 bg-slate-100/50 min-h-screen relative overflow-x-hidden">
        <AnimatePresence mode="wait">
          {activeTab === "Dashboard" && <DashboardView key="dash" conversations={conversations} loading={loadingConversations} onOpenChat={openChat} />}
          {activeTab === "Orders" && <OrdersManager key="ord" data={orders} refresh={fetchAllData} onOpenChat={openChat} />}
          {activeTab === "Tutors" && <TutorsManager key="tut" data={tutors} refresh={fetchAllData} onOpenChat={openChat} />}
          {activeTab === "Vacancies" && <VacanciesManager key="vac" data={vacancies} applications={applications} tutors={tutors} refresh={fetchAllData} onOpenChat={openChat} />}
          {activeTab === "Applications" && <ApplicationsManager key="app" data={applications} tutors={tutors} refresh={fetchAllData} onOpenChat={openChat} />}
          {activeTab === "Tuition Requests" && <RequestsManager key="req" data={requests} refresh={fetchAllData} onOpenChat={openChat} />}
          {activeTab === "Batch Management" && <BatchManager key="batch" data={courses} batches={batches} refresh={fetchAllData} />}
          {activeTab === "Bookings" && <BookingsManager key="book" courses={courses} enrollments={enrollments} batches={batches} refresh={fetchAllData} onOpenChat={openChat} />}
          {activeTab === "Certificates" && <CertificatesManager key="cert" data={certificates} syllabi={syllabi} refresh={fetchAllData} onOpenChat={openChat} />}
        </AnimatePresence>

        <AnimatePresence>
          {chatOpen && activeUser && (
            <ChatModal
              userId={activeUser}
              onClose={() => setChatOpen(false)}
              profilesMap={conversations.find(c => c.user_id === activeUser)?.profiles}
              refreshData={fetchAllData}
            />
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

// --- SIDEBAR BTN ---
function SidebarBtn({ icon, label, active, onClick, color }: any) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-sm font-bold transition-all ${active ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20" : `hover:bg-slate-800 ${color || "text-slate-400"}`}`}>
      {icon} <span>{label}</span>
    </button>
  );
}

// --- SHARED TOGGLE SWITCH ---
function ToggleSwitch({ checked, onChange, label, activeColor = 'bg-indigo-500', activeText = 'text-indigo-600' }: { checked: boolean, onChange: () => void, label?: string, activeColor?: string, activeText?: string }) {
  return (
    <div className="flex items-center gap-2 cursor-pointer" onClick={(e) => { e.stopPropagation(); onChange(); }}>
      <div className={`w-10 h-6 flex items-center rounded-full p-1 transition-colors duration-300 ease-in-out ${checked ? activeColor : 'bg-slate-300'}`}>
        <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ease-in-out ${checked ? 'translate-x-4' : 'translate-x-0'}`}></div>
      </div>
      {label && <span className={`text-xs font-bold whitespace-nowrap ${checked ? activeText : 'text-slate-500'}`}>{label}</span>}
    </div>
  );
}

// --- SECTION: DASHBOARD (INBOX) ---
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
    const matchesSearch = !searchQuery || nameMatch || contentMatch;
    return matchesFilter && matchesSearch;
  });

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6 w-full max-w-full">
      <div className="flex justify-between items-end flex-wrap gap-4">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">Inbox</h2>
          <p className="text-slate-500 font-medium mt-1">Manage all user communications.</p>
        </div>
        <div className="flex bg-slate-200/50 p-1 rounded-xl">
          <button onClick={() => setFilter('all')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${filter === 'all' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}>All Messages</button>
          <button onClick={() => setFilter('unread')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${filter === 'unread' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700 flex items-center gap-1'}`}>
            Unread {unreadCount > 0 && <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{unreadCount}</span>}
          </button>
        </div>
      </div>
      <div className="relative w-full">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input type="text" placeholder="Search by name or message content..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-12 pr-4 py-4 bg-white rounded-2xl border border-slate-200 shadow-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all font-medium text-slate-700" />
      </div>
      <div className="bg-white rounded-[30px] shadow-xl shadow-slate-200/40 border border-slate-100 overflow-hidden min-h-[400px]">
        {loading ? (
          <div className="flex items-center justify-center h-[400px] text-slate-400"><Loader2 className="animate-spin" size={32} /></div>
        ) : filteredData.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[400px] text-slate-400">
            <MessageSquare size={48} className="mb-4 opacity-50" />
            <p className="text-lg font-bold">No {filter === 'unread' ? 'unread ' : ''}conversations found</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredData.map((msg: any) => {
              const isUnread = !msg.is_read;
              const name = msg.profiles?.full_name || "Unknown User";
              return (
                <div key={msg.id} onClick={() => onOpenChat(msg.user_id)} className="group flex items-center gap-4 p-6 hover:bg-slate-50/80 cursor-pointer transition-colors relative">
                  {isUnread && <div className="absolute left-3 w-2.5 h-2.5 bg-red-500 rounded-full shadow-[0_0_10px_rgba(239,68,68,0.5)]"></div>}
                  <div className="w-14 h-14 rounded-full bg-slate-200 flex items-center justify-center font-black text-slate-500 ml-2 overflow-hidden shrink-0">
                    {msg.profiles?.avatar_url ? <img src={msg.profiles.avatar_url} className="w-full h-full object-cover" alt="" /> : name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-1">
                      <h4 className={`text-base font-bold truncate ${isUnread ? 'text-slate-900' : 'text-slate-700'}`}>{name}</h4>
                      <span className="text-xs text-slate-400 whitespace-nowrap ml-4">{timeAgo(msg.created_at)}</span>
                    </div>
                    <p className={`text-sm truncate ${isUnread ? 'text-slate-800 font-bold' : 'text-slate-500'}`}>
                      {msg.sender_role === 'admin' && <span className="mr-1 text-indigo-500">You:</span>}{msg.content}
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

// --- SECTION: ORDERS ---
function OrdersManager({ data, refresh, onOpenChat }: { data: Order[], refresh: () => void, onOpenChat: (id: string) => void }) {
  const supabase = createClient();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'verified' | 'rejected'>('all');
  const [orderTypeFilter, setOrderTypeFilter] = useState<'all' | 'recording' | 'Online Course' | 'others'>('all'); 
  const [showAllOrders, setShowAllOrders] = useState(true);

  const filteredData = data.filter((o: Order) => {
    const s = searchQuery.toLowerCase();
    const matchesSearch = (o.full_name && o.full_name.toLowerCase().includes(s)) || 
                          (o.email && o.email.toLowerCase().includes(s)) || 
                          (o.order_name && o.order_name.toLowerCase().includes(s));
    
    const matchesStatus = statusFilter === 'all' ? true : 
                          (statusFilter === 'pending' && (o.status === 'pending' || o.pending_amount > 0)) ? true :
                          (statusFilter === 'verified' && o.status === 'verified' && o.pending_amount === 0) ? true :
                          o.status === statusFilter;
    
    let matchesType = true;
    if (orderTypeFilter !== 'all') {
      const lowerType = o.order_type?.toLowerCase() || '';
      if (orderTypeFilter === 'recording') matchesType = lowerType.includes('recording');
      else if (orderTypeFilter === 'Online Course') matchesType = lowerType.includes('course');
      else if (orderTypeFilter === 'others') matchesType = !lowerType.includes('recording') && !lowerType.includes('course');
    }

    let matchesDate = true;
    if (!showAllOrders) {
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      matchesDate = new Date(o.created_at) >= threeDaysAgo;
    }

    return matchesSearch && matchesStatus && matchesType && matchesDate;
  });

  // --- ACTIONS ---
  const handleStatusChange = async (orderId: string, newStatus: string) => {
    const { error } = await supabase.from('orders_v2').update({ status: newStatus }).eq('id', orderId);
    if (error) alert("Status update failed: " + error.message);
    else refresh();
  };

  const handleVerifyPayment = async (order: Order) => {
    if(order.pending_amount <= 0) return;
    if(!confirm(`Verify Rs. ${order.pending_amount} for ${order.full_name}?`)) return;

    const newPaid = order.paid_amount + order.pending_amount;
    const { error } = await supabase.from('orders_v2').update({
        paid_amount: newPaid,
        pending_amount: 0,
        status: 'verified'
    }).eq('id', order.id);

    if(error) alert("Verification failed: " + error.message);
    else {
        refresh();
        setSelectedOrder(null);
    }
  }

  const handleRejectPayment = async (order: Order) => {
    if(order.pending_amount <= 0) return;
    if(!confirm(`Reject pending payment of Rs. ${order.pending_amount} for ${order.full_name}?`)) return;

    const newStatus = order.paid_amount > 0 ? 'verified' : 'rejected';
    const { error } = await supabase.from('orders_v2').update({
        pending_amount: 0,
        status: newStatus
    }).eq('id', order.id);

    if(error) alert("Rejection failed: " + error.message);
    else {
        refresh();
        setSelectedOrder(null);
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this order entirely?")) {
      const { error } = await supabase.from('orders_v2').delete().eq('id', id);
      if (error) alert("Delete failed: " + error.message);
      else refresh();
    }
  };

  const statusColors: any = { pending: 'bg-orange-100 text-orange-700 border-orange-200', verified: 'bg-green-100 text-green-700 border-green-200', rejected: 'bg-red-100 text-red-700 border-red-200' };

  const getImageUrl = (path: string) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    const { data } = supabase.storage.from('others').getPublicUrl(path);
    return data.publicUrl;
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 w-full">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-black text-slate-900">Orders & Invoices</h2>
      </div>
      <div className="flex flex-wrap gap-4 items-center w-full">
        <div className="relative flex-1 min-w-[250px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input type="text" placeholder="Search by name, email, or order name..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-12 pr-4 py-4 bg-white rounded-2xl border border-slate-200 shadow-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all font-medium text-slate-700" />
        </div>
        <select className="bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 outline-none shadow-sm cursor-pointer" value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)}>
          <option value="all">All Status</option>
          <option value="pending">Needs Review (Pending)</option>
          <option value="verified">Verified Only</option>
          <option value="rejected">Rejected Only</option>
        </select>
        
        <select className="bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 outline-none shadow-sm cursor-pointer" value={orderTypeFilter} onChange={e => setOrderTypeFilter(e.target.value as any)}>
          <option value="all">All Types</option>
          <option value="recording">Recording</option>
          <option value="Online Course">Online Course</option>
          <option value="others">Others</option>
        </select>

        <label className="flex items-center gap-2 cursor-pointer text-sm font-bold text-slate-600 bg-white border border-slate-200 px-4 py-3 rounded-2xl shadow-sm whitespace-nowrap">
          <input type="checkbox" checked={showAllOrders} onChange={(e) => setShowAllOrders(e.target.checked)} className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-50 cursor-pointer" />
          Show All Time
        </label>
      </div>
      
      <div className="bg-white rounded-[30px] shadow-xl border border-slate-100 overflow-x-auto w-full">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100 text-xs font-black text-slate-400 uppercase tracking-widest">
              <th className="p-6">Date</th>
              <th className="p-6">Customer Details</th>
              <th className="p-6">Order Info</th>
              <th className="p-6">Approval Action</th>
              <th className="p-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map(order => {
              const remainingAmount = Math.max(0, order.locked_price - order.paid_amount - order.pending_amount);
              return (
                <tr key={order.id} className="border-b border-slate-50 hover:bg-slate-50/50 cursor-pointer" onClick={() => setSelectedOrder(order)}>
                  <td className="p-6 text-sm text-slate-500 font-bold whitespace-nowrap align-top">{new Date(order.created_at).toLocaleDateString()}</td>
                  <td className="p-6 align-top">
                    <p className="font-bold text-slate-900 cursor-pointer hover:text-indigo-600 hover:underline" onClick={(e) => { e.stopPropagation(); order.user_id ? onOpenChat(order.user_id) : alert('No linked user account found for this order.'); }}>
                      {order.full_name}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">{order.contact_number}</p>
                    <p className="text-xs text-slate-500">{order.email}</p>
                  </td>
                  <td className="p-6 align-top">
                    <p className="font-bold text-slate-800 flex items-center gap-2 flex-wrap mb-2">
                      <span className="uppercase text-[10px] tracking-widest bg-slate-100 px-2 py-1 rounded text-slate-500 whitespace-nowrap">{order.order_type}</span>
                    </p>
                    
                    {/* NEW: Explicit Breakdown Box */}
                    <div className="flex flex-col gap-1.5 mt-1 mb-3 bg-slate-50 p-3 rounded-xl border border-slate-100 min-w-[220px]">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-slate-500">Paid:</span>
                        <span className="font-black text-emerald-600">Rs.{order.paid_amount} <span className="text-slate-400 font-medium">/ Rs.{order.locked_price}</span></span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-slate-500">Pending:</span>
                        <span className="font-black text-orange-500">Rs.{order.pending_amount} <span className="text-orange-300 font-medium">/ Rs.{order.locked_price}</span></span>
                      </div>
                      <div className="flex justify-between items-center text-xs border-t border-slate-200 pt-1.5 mt-0.5">
                        <span className="font-bold text-slate-500">Remaining:</span>
                        <span className="font-black text-red-500">Rs.{remainingAmount} <span className="text-red-300 font-medium">/ Rs.{order.locked_price}</span></span>
                      </div>
                    </div>

                    <p className="text-xs font-medium text-slate-500 truncate max-w-[250px]" title={order.order_name}>
                      Target: {order.order_name}
                    </p>
                  </td>
                  <td className="p-6 align-top" onClick={(e) => e.stopPropagation()}>
                    <div className="flex flex-col gap-3">
                      {/* NEW: Always Clickable Status Dropdown */}
                      <div className="relative inline-block w-full max-w-[140px]">
                        <select
                          value={order.status}
                          onChange={(e) => handleStatusChange(order.id, e.target.value)}
                          className={`appearance-none w-full px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider outline-none cursor-pointer border shadow-sm transition-all hover:opacity-80 ${statusColors[order.status] || 'bg-slate-100 text-slate-700 border-slate-200'}`}
                        >
                          <option value="pending">PENDING</option>
                          <option value="verified">VERIFIED</option>
                          <option value="rejected">REJECTED</option>
                        </select>
                        <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-50" />
                      </div>

                      {/* Verify Action buttons show up underneath if there is money pending */}
                      {order.pending_amount > 0 && (
                          <div className="flex flex-col gap-1.5 mt-1 border-t border-slate-100 pt-3">
                              <button onClick={() => handleVerifyPayment(order)} className="px-3 py-1.5 bg-emerald-500 text-white text-[10px] font-bold rounded shadow-sm hover:bg-emerald-600 flex items-center justify-center gap-1"><CheckSquare size={12}/> Verify Funds</button>
                              <button onClick={() => handleRejectPayment(order)} className="px-3 py-1.5 bg-red-50 text-red-600 text-[10px] font-bold rounded shadow-sm hover:bg-red-100">Reject Funds</button>
                          </div>
                      )}
                    </div>
                  </td>
                  <td className="p-6 text-right align-top" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-end items-center gap-4 mt-2">
                      <button onClick={() => handleDelete(order.id)} className="p-2 text-red-600 bg-red-50 rounded-xl hover:bg-red-100 transition-colors" title="Delete Order"><Trash2 size={16} /></button>
                      <span className="text-sm font-bold text-indigo-600 hover:text-indigo-800 whitespace-nowrap cursor-pointer" onClick={(e) => { e.stopPropagation(); setSelectedOrder(order); }}>View Details</span>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filteredData.length === 0 && <tr><td colSpan={5} className="p-6 text-center text-slate-500">No orders found.</td></tr>}
          </tbody>
        </table>
      </div>

      {selectedOrder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm" onClick={() => setSelectedOrder(null)}>
          <div className="bg-white rounded-[30px] shadow-2xl p-8 max-w-2xl w-full relative overflow-y-auto max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <button onClick={() => setSelectedOrder(null)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-800"><X /></button>
            <h3 className="text-2xl font-black mb-6 flex items-center gap-2">Order Details <span className={`text-[10px] uppercase tracking-widest px-2 py-1 rounded-full border ${statusColors[selectedOrder.status] || 'bg-slate-100 text-slate-700'}`}>{selectedOrder.status}</span></h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 text-sm font-medium text-slate-700">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase text-slate-400 mb-2">Customer Info</p>
                  <p><span className="font-bold text-slate-800">Name:</span> <span className="cursor-pointer hover:text-indigo-600 hover:underline" onClick={() => selectedOrder.user_id ? onOpenChat(selectedOrder.user_id) : alert('No linked user account.')}>{selectedOrder.full_name}</span></p>
                  <p className="break-all"><span className="font-bold text-slate-800">Email:</span> {selectedOrder.email}</p>
                  <p><span className="font-bold text-slate-800">Phone:</span> {selectedOrder.contact_number}</p>
                </div>
                <a href={`https://wa.me/${(selectedOrder.contact_number || '').replace(/\D/g,'')}`} target="_blank" rel="noopener noreferrer" className="mt-4 flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20b858] text-white px-4 py-2 rounded-xl text-xs font-black shadow-sm transition-colors w-full">
                  <MessageCircle size={16} /> Contact via WhatsApp
                </a>
              </div>
              
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2 relative">
                {selectedOrder.pending_amount > 0 && (
                   <div className="absolute -top-3 -right-3 bg-orange-500 text-white rounded-full p-2 shadow-lg animate-bounce">
                     <AlertCircle size={16} />
                   </div>
                )}
                <p className="text-[10px] font-black uppercase text-slate-400 mb-2">Order Info</p>
                <p><span className="font-bold text-slate-800">Type:</span> <span className="uppercase">{selectedOrder.order_type}</span></p>
                <p><span className="font-bold text-slate-800">Order Name:</span> {selectedOrder.order_name}</p>
                <p><span className="font-bold text-slate-800 text-emerald-600">Verified Paid:</span> Rs. {selectedOrder.paid_amount} / Rs. {selectedOrder.locked_price}</p>
                <p><span className="font-bold text-slate-800 text-orange-600">Pending Review:</span> Rs. {selectedOrder.pending_amount} / Rs. {selectedOrder.locked_price}</p>
                <p><span className="font-bold text-slate-800 text-red-500">Remaining Due:</span> Rs. {Math.max(0, selectedOrder.locked_price - selectedOrder.paid_amount - selectedOrder.pending_amount)}</p>
                <p className="pt-2 border-t border-slate-200 mt-2"><span className="font-bold text-slate-800">Date:</span> {new Date(selectedOrder.created_at).toLocaleString()}</p>
              </div>
            </div>

            {selectedOrder.pending_amount > 0 && (
                <div className="bg-orange-50 p-4 rounded-xl border border-orange-200 flex items-center justify-between gap-4 mb-6">
                    <div>
                        <p className="text-orange-800 font-bold text-sm">Action Required</p>
                        <p className="text-orange-600 text-xs font-medium">Verify the screenshot below to approve Rs. {selectedOrder.pending_amount}.</p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                        <button onClick={() => handleVerifyPayment(selectedOrder)} className="px-4 py-2 bg-emerald-500 text-white text-xs font-bold rounded-lg shadow hover:bg-emerald-600 flex items-center gap-1"><CheckSquare size={14}/> Verify Funds</button>
                        <button onClick={() => handleRejectPayment(selectedOrder)} className="px-4 py-2 bg-red-100 text-red-600 text-xs font-bold rounded-lg shadow hover:bg-red-200">Reject</button>
                    </div>
                </div>
            )}

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col items-center">
              <p className="text-[10px] font-black uppercase text-slate-400 mb-4 w-full">Payment Screenshots ({selectedOrder.payment_screenshots?.length || (selectedOrder.screenshot_url ? 1 : 0)})</p>
              
              {selectedOrder.payment_screenshots && selectedOrder.payment_screenshots.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                    {selectedOrder.payment_screenshots.map((path, idx) => (
                        <a key={idx} href={getImageUrl(path)} target="_blank" rel="noreferrer" className="block max-w-full relative group">
                            <div className="absolute top-2 left-2 bg-slate-900/70 text-white text-[10px] font-bold px-2 py-1 rounded-md z-10 backdrop-blur-md">Upload {idx + 1}</div>
                            <img src={getImageUrl(path)} alt={`Payment Receipt ${idx + 1}`} className="rounded-lg shadow-sm border border-slate-200 w-full h-48 object-cover cursor-zoom-in group-hover:opacity-90 transition-opacity" />
                        </a>
                    ))}
                </div>
              ) : selectedOrder.screenshot_url ? (
                <a href={getImageUrl(selectedOrder.screenshot_url)} target="_blank" rel="noreferrer" className="block max-w-full">
                  <img src={getImageUrl(selectedOrder.screenshot_url)} alt="Payment Receipt" className="rounded-lg shadow-sm border border-slate-200 max-h-96 object-contain cursor-zoom-in" />
                </a>
              ) : (
                <p className="text-slate-400 italic py-4">No screenshot provided.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}

// --- SECTION: TUTOR LISTING ---
function TutorsManager({ data, refresh, onOpenChat }: { data: Tutor[], refresh: () => void, onOpenChat: (id: string) => void }) {
  const supabase = createClient();
  const [selectedTutor, setSelectedTutor] = useState<Tutor | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredData = data.filter((t: Tutor) => {
    const s = searchQuery.toLowerCase();
    return (t.name && t.name.toLowerCase().includes(s)) || (t.location && t.location.toLowerCase().includes(s)) || (t.subject && t.subject.some(sub => sub.toLowerCase().includes(s)));
  });

  const toggleBoolean = async (id: number, field: 'verified' | 'availability', currentValue: boolean) => {
    const { error } = await supabase.from('tutors').update({ [field]: !currentValue }).eq('id', id);
    if (error) alert("Update failed: " + error.message);
    else refresh();
  };

  const handleDeleteTutor = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Are you entirely sure you want to permanently DELETE this tutor?")) {
      const { error } = await supabase.from('tutors').delete().eq('id', id);
      if (error) alert("Delete failed: " + error.message);
      else refresh();
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 w-full">
      <div className="flex justify-between items-end">
        <h2 className="text-3xl font-black text-slate-900">Tutor Listing</h2>
      </div>
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input type="text" placeholder="Search by Tutor Name, Location, or Subjects..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-12 pr-4 py-4 bg-white rounded-2xl border border-slate-200 shadow-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all font-medium text-slate-700" />
      </div>
      <div className="bg-white rounded-[30px] shadow-xl border border-slate-100 overflow-x-auto w-full">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100 text-xs font-black text-slate-400 uppercase tracking-widest">
              <th className="p-6">Tutor Info</th><th className="p-6">Verified</th><th className="p-6">Available</th><th className="p-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map(tutor => (
              <tr key={tutor.id} className="border-b border-slate-50 hover:bg-slate-50/50 cursor-pointer" onClick={() => setSelectedTutor(tutor)}>
                <td className="p-6 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-slate-200 border border-slate-300 overflow-hidden shrink-0 flex items-center justify-center text-slate-400">
                    {tutor.avatar_url ? <img src={tutor.avatar_url} className="w-full h-full object-cover" /> : <User size={24} />}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 cursor-pointer hover:text-indigo-600 hover:underline" onClick={(e) => { e.stopPropagation(); tutor.user_id ? onOpenChat(tutor.user_id) : alert('No linked user account found.'); }}>{tutor.name || 'Unknown'}</p>
                    <p className="text-xs text-slate-500 mt-1">{tutor.location || 'No Location'} • {tutor.subject?.length > 0 ? tutor.subject.join(', ') : 'No Subjects'}</p>
                  </div>
                </td>
                <td className="p-6"><ToggleSwitch checked={tutor.verified} onChange={() => toggleBoolean(tutor.id, 'verified', tutor.verified)} label={tutor.verified ? "Verified" : "Unverified"} /></td>
                <td className="p-6"><ToggleSwitch checked={tutor.availability} onChange={() => toggleBoolean(tutor.id, 'availability', tutor.availability)} label={tutor.availability ? "Yes" : "No"} /></td>
                <td className="p-6 text-right">
                  <div className="flex justify-end items-center gap-4">
                    <button onClick={(e) => handleDeleteTutor(tutor.id, e)} className="p-2 text-red-600 bg-red-50 rounded-xl hover:bg-red-100 transition-colors" title="Delete Tutor"><Trash2 size={16} /></button>
                    <span className="text-sm font-bold text-indigo-600 hover:text-indigo-800 whitespace-nowrap">View Details</span>
                  </div>
                </td>
              </tr>
            ))}
            {filteredData.length === 0 && <tr><td colSpan={4} className="p-6 text-center text-slate-500">No tutors found.</td></tr>}
          </tbody>
        </table>
      </div>
      {selectedTutor && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm" onClick={() => setSelectedTutor(null)}>
          <div className="bg-white rounded-[30px] shadow-2xl p-8 max-w-lg w-full relative overflow-y-auto max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <p className="font-mono text-[10px] text-slate-400 absolute top-4 left-6">ID: {selectedTutor.id}</p>
            <button onClick={() => setSelectedTutor(null)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-800"><X /></button>
            <div className="flex items-center gap-4 mb-6 mt-4">
              <div className="w-16 h-16 rounded-full bg-slate-200 border border-slate-300 overflow-hidden shrink-0 flex items-center justify-center text-slate-400">
                {selectedTutor.avatar_url ? <img src={selectedTutor.avatar_url} className="w-full h-full object-cover" /> : <User size={32} />}
              </div>
              <h3 className="text-2xl font-black cursor-pointer hover:text-indigo-600 hover:underline" onClick={() => selectedTutor.user_id ? onOpenChat(selectedTutor.user_id) : alert('No linked user account.')}>{selectedTutor.name || 'Unknown'}</h3>
            </div>
            <div className="space-y-4 text-sm font-medium text-slate-700">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <span className="text-xs font-black text-slate-400 uppercase block mb-1">Phone Number</span>
                  {selectedTutor.contact_num || 'Not provided'}
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <span className="text-xs font-black text-slate-400 uppercase block mb-1">Academic CV</span>
                  {selectedTutor.cv_url ? <a href={selectedTutor.cv_url} target="_blank" className="text-indigo-600 hover:underline flex items-center gap-1">View Document <ExternalLink size={14} /></a> : 'No CV uploaded'}
                </div>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <span className="text-xs font-black text-slate-400 uppercase block mb-1">Education</span>
                <p className="font-bold text-slate-800">{selectedTutor.education || 'Not provided'}</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <span className="text-xs font-black text-slate-400 uppercase block mb-1">Biography</span>
                <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{selectedTutor.bio || 'Not provided'}</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <span className="text-xs font-black text-slate-400 uppercase block mb-1">ID Document</span>
                {selectedTutor.id_url ? <a href={selectedTutor.id_url} target="_blank" className="text-indigo-600 hover:underline flex items-center gap-1">View ID <ExternalLink size={14} /></a> : 'No ID uploaded'}
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}

// --- SECTION: VACANCIES ---
function VacanciesManager({ data, applications, refresh, tutors, onOpenChat }: any) {
  const supabase = createClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingData, setEditingData] = useState<Partial<Vacancy> | null>(null);
  const [viewVacancy, setViewVacancy] = useState<Vacancy | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredData = data.filter((item: Vacancy) => {
    const searchLower = searchQuery.toLowerCase();
    return (item.contact_name && item.contact_name.toLowerCase().includes(searchLower)) || (item.subject && item.subject.toLowerCase().includes(searchLower)) || (item.location && item.location.toLowerCase().includes(searchLower));
  });

  const handleDelete = async (id: number) => {
    if (confirm("Delete this vacancy?")) {
      const { error } = await supabase.from("vacancies").delete().eq("id", id);
      if (error) alert("Delete failed: " + error.message);
      else refresh();
    }
  };

  const handleToggleStatus = async (item: Vacancy) => {
    const { error } = await supabase.from("vacancies").update({ status: !item.status }).eq("id", item.id);
    if (error) alert("Update failed: " + error.message);
    else refresh();
  };

  const handleToggleUrgent = async (item: Vacancy) => {
    const { error } = await supabase.from("vacancies").update({ urgent: !item.urgent }).eq("id", item.id);
    if (error) alert("Update failed: " + error.message);
    else refresh();
  };

  const saveEdit = async () => {
    if (editingData?.id) {
      const { error } = await supabase.from('vacancies').update(editingData).eq('id', editingData.id);
      if (error) alert("Update failed: " + error.message);
    } else {
      const { error } = await supabase.from('vacancies').insert([editingData]);
      if (error) alert("Create failed: " + error.message);
    }
    setModalOpen(false);
    refresh();
  };

  const vacancyApps = viewVacancy ? applications.filter((a: any) => a.vacancy_id === viewVacancy.id).sort((a: any, b: any) => {
    if (a.status === 'accepted' && b.status !== 'accepted') return -1;
    if (a.status !== 'accepted' && b.status === 'accepted') return 1;
    return 0;
  }) : [];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 w-full">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <h2 className="text-3xl font-black text-slate-900">Vacancies</h2>
        <button onClick={() => { setEditingData({ status: true, urgent: false }); setModalOpen(true); }} className="bg-indigo-600 text-white px-5 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all whitespace-nowrap">
          <Plus size={18} /> Add Vacancy
        </button>
      </div>
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input type="text" placeholder="Search by subject, location, or contact name..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-12 pr-4 py-4 bg-white rounded-2xl border border-slate-200 shadow-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all font-medium text-slate-700" />
      </div>
      <div className="bg-white rounded-[30px] shadow-xl border border-slate-100 overflow-x-auto w-full">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100 text-xs font-black text-slate-400 uppercase tracking-widest">
              <th className="p-6">Date Posted</th><th className="p-6">Subject & Location</th><th className="p-6">Urgent</th><th className="p-6">Status</th><th className="p-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map((item: Vacancy) => (
              <tr key={item.id} onClick={() => setViewVacancy(item)} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors cursor-pointer">
                <td className="p-6 text-sm text-slate-500 font-bold whitespace-nowrap">{new Date(item.created_at).toLocaleDateString()}</td>
                <td className="p-6">
                  <p className="font-bold text-slate-900 text-lg">{item.subject}</p>
                  <p className="text-sm text-slate-500 mt-1">{item.location} • {item.salary_range}</p>
                </td>
                <td className="p-6"><ToggleSwitch checked={!!item.urgent} onChange={() => handleToggleUrgent(item)} label={item.urgent ? 'URGENT' : 'NORMAL'} activeColor="bg-red-500" activeText="text-red-600" /></td>
                <td className="p-6"><ToggleSwitch checked={item.status} onChange={() => handleToggleStatus(item)} label={item.status ? 'OPEN' : 'CLOSED'} /></td>
                <td className="p-6 text-right">
                  <div className="flex justify-end gap-2" onClick={e => e.stopPropagation()}>
                    <button onClick={() => { setEditingData(item); setModalOpen(true); }} className="p-2 text-blue-600 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors" title="Edit"><Edit2 size={16} /></button>
                    <button onClick={() => handleDelete(item.id)} className="p-2 text-red-600 bg-red-50 rounded-xl hover:bg-red-100 transition-colors" title="Delete"><Trash2 size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredData.length === 0 && <tr><td colSpan={5} className="p-10 text-center text-slate-500">No vacancies found.</td></tr>}
          </tbody>
        </table>
      </div>

      {viewVacancy && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm" onClick={() => setViewVacancy(null)}>
          <div className="bg-white rounded-[30px] shadow-2xl max-w-2xl w-full relative overflow-hidden flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <p className="font-mono text-[10px] text-slate-400 absolute top-4 left-6">ID: {viewVacancy.id}</p>
            <button onClick={() => setViewVacancy(null)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-800 z-10"><X /></button>
            <div className="p-6 border-b border-slate-100 bg-slate-50 mt-4">
              <h3 className="text-2xl font-black text-slate-900 pr-8">{viewVacancy.subject}</h3>
              <p className="text-sm font-bold text-slate-500 mt-1 flex items-center gap-2"><MapPin size={14} /> {viewVacancy.location}</p>
            </div>
            <div className="p-6 overflow-y-auto space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100"><p className="text-[10px] font-black uppercase text-slate-400 mb-1">Contact Name</p><p className="font-bold text-slate-800 cursor-pointer hover:text-indigo-600 hover:underline" onClick={() => viewVacancy.user_id ? onOpenChat(viewVacancy.user_id) : alert('No linked user account.')}>{viewVacancy.contact_name || '-'}</p></div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100"><p className="text-[10px] font-black uppercase text-slate-400 mb-1">Phone</p><p className="font-bold text-slate-800">{viewVacancy.contact_number || '-'}</p></div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100"><p className="text-[10px] font-black uppercase text-slate-400 mb-1">Salary Range</p><p className="font-bold text-slate-800 text-green-600">{viewVacancy.salary_range || '-'}</p></div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100"><p className="text-[10px] font-black uppercase text-slate-400 mb-1">Class Time</p><p className="font-bold text-slate-800">{viewVacancy.class_time || '-'}</p></div>
              </div>
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                <p className="text-[10px] font-black uppercase text-slate-400 mb-2">Description</p>
                <p className="text-sm font-medium text-slate-700 whitespace-pre-wrap">{viewVacancy.description || 'No description provided.'}</p>
              </div>
              <div className="mt-4">
                <h4 className="font-black text-lg mb-4 text-slate-900">Applied Tutors ({vacancyApps.length})</h4>
                {vacancyApps.length === 0 ? <p className="text-slate-500 text-center py-6 bg-slate-50 rounded-2xl">No applications yet.</p> : (
                  <div className="space-y-3">
                    {vacancyApps.map((app: any) => {
                      return (
                        <div key={app.id} className={`flex justify-between items-center p-4 rounded-2xl border ${app.status === 'accepted' ? 'bg-green-50 border-green-200' : app.status === 'rejected' ? 'bg-red-50 border-red-200' : 'bg-white border-slate-200 shadow-sm'}`}>
                          <div>
                            <span onClick={() => app.user_id ? onOpenChat(app.user_id) : alert('No linked user account.')} className="cursor-pointer font-bold text-base text-indigo-600 hover:underline flex items-center gap-1">{app.applicant_name} <MessageSquare size={14} /></span>
                            <p className="text-sm text-slate-500 mt-0.5">{app.applicant_phone} • {app.applicant_email}</p>
                          </div>
                          <div className="text-right">
                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${app.status === 'accepted' ? 'bg-green-200 text-green-800' : app.status === 'rejected' ? 'bg-red-200 text-red-800' : 'bg-orange-100 text-orange-700'}`}>{app.status}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {modalOpen && editingData && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm" onClick={() => setModalOpen(false)}>
          <div className="bg-white rounded-[30px] shadow-2xl max-w-2xl w-full relative overflow-hidden flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
            {editingData.id && <p className="font-mono text-[10px] text-slate-400 absolute top-4 left-6">ID: {editingData.id}</p>}
            <button onClick={() => setModalOpen(false)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-800 z-10"><X /></button>
            <div className="p-6 border-b border-slate-100 bg-slate-50 mt-4">
              <h3 className="text-2xl font-black text-slate-900">{editingData.id ? 'Edit Vacancy' : 'Create Vacancy'}</h3>
            </div>
            <div className="p-6 overflow-y-auto space-y-4">
              <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-2">
                <ToggleSwitch checked={!!editingData.urgent} onChange={() => setEditingData({ ...editingData, urgent: !editingData.urgent })} label="Mark as Urgent" activeColor="bg-red-500" activeText="text-red-600" />
                <ToggleSwitch checked={!!editingData.status} onChange={() => setEditingData({ ...editingData, status: !editingData.status })} label="Status (Open)" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="block text-[10px] font-black text-slate-400 uppercase mb-1 ml-1">Subject</label><input type="text" className="w-full bg-slate-50 p-3.5 rounded-xl outline-none border border-slate-200 focus:border-indigo-500 font-bold text-slate-800 text-sm transition-colors" value={editingData.subject || ''} onChange={e => setEditingData({ ...editingData, subject: e.target.value })} /></div>
                <div><label className="block text-[10px] font-black text-slate-400 uppercase mb-1 ml-1">Location</label><input type="text" className="w-full bg-slate-50 p-3.5 rounded-xl outline-none border border-slate-200 focus:border-indigo-500 font-bold text-slate-800 text-sm transition-colors" value={editingData.location || ''} onChange={e => setEditingData({ ...editingData, location: e.target.value })} /></div>
                <div><label className="block text-[10px] font-black text-slate-400 uppercase mb-1 ml-1">Contact Name</label><input type="text" className="w-full bg-slate-50 p-3.5 rounded-xl outline-none border border-slate-200 focus:border-indigo-500 font-bold text-slate-800 text-sm transition-colors" value={editingData.contact_name || ''} onChange={e => setEditingData({ ...editingData, contact_name: e.target.value })} /></div>
                <div><label className="block text-[10px] font-black text-slate-400 uppercase mb-1 ml-1">Contact Phone</label><input type="text" className="w-full bg-slate-50 p-3.5 rounded-xl outline-none border border-slate-200 focus:border-indigo-500 font-bold text-slate-800 text-sm transition-colors" value={editingData.contact_number || ''} onChange={e => setEditingData({ ...editingData, contact_number: e.target.value })} /></div>
                <div><label className="block text-[10px] font-black text-slate-400 uppercase mb-1 ml-1">Salary Range</label><input type="text" className="w-full bg-slate-50 p-3.5 rounded-xl outline-none border border-slate-200 focus:border-indigo-500 font-bold text-slate-800 text-sm transition-colors" value={editingData.salary_range || ''} onChange={e => setEditingData({ ...editingData, salary_range: e.target.value })} /></div>
                <div><label className="block text-[10px] font-black text-slate-400 uppercase mb-1 ml-1">Class Time</label><input type="text" className="w-full bg-slate-50 p-3.5 rounded-xl outline-none border border-slate-200 focus:border-indigo-500 font-bold text-slate-800 text-sm transition-colors" value={editingData.class_time || ''} onChange={e => setEditingData({ ...editingData, class_time: e.target.value })} /></div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 ml-1">Full Description</label>
                <textarea className="w-full bg-slate-50 p-3.5 rounded-xl outline-none border border-slate-200 focus:border-indigo-500 font-bold text-slate-800 text-sm transition-colors h-24 resize-none" value={editingData.description || ''} onChange={e => setEditingData({ ...editingData, description: e.target.value })} />
              </div>
            </div>
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 shrink-0">
              <button onClick={() => setModalOpen(false)} className="px-6 py-3 font-bold text-slate-500 hover:text-slate-800">Cancel</button>
              <button onClick={saveEdit} className="px-8 py-3 rounded-2xl font-black bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-colors">Save Details</button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}

// --- SECTION: APPLICATIONS ---
function ApplicationsManager({ data, refresh, onOpenChat, tutors }: any) {
  const supabase = createClient();
  const handleStatusChange = async (id: number, newStatus: string) => {
    const { error } = await supabase.from("vacancy_applications").update({ status: newStatus }).eq("id", id);
    if (error) alert("Update failed: " + error.message);
    else refresh();
  };
  const statusColors: any = { pending: 'bg-orange-100 text-orange-700', accepted: 'bg-green-100 text-green-700', rejected: 'bg-red-100 text-red-700' };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 w-full">
      <h2 className="text-3xl font-black text-slate-900">Applications</h2>
      <div className="bg-white rounded-[30px] shadow-xl border border-slate-100 overflow-x-auto w-full">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100 text-xs font-black text-slate-400 uppercase tracking-widest">
              <th className="p-6">Applicant (Tutor)</th><th className="p-6">Contact Info</th><th className="p-6">Applied For</th><th className="p-6">Vacancy Poster (Student)</th><th className="p-6">Student Response</th><th className="p-6 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item: VacancyApplication) => {
              return (
                <tr key={item.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                  <td className="p-6">
                    <span onClick={() => item.user_id ? onOpenChat(item.user_id) : alert('No linked user account.')} className="cursor-pointer font-bold text-indigo-600 hover:underline text-base flex items-center gap-1">
                      {item.applicant_name} <MessageSquare size={14} />
                    </span>
                  </td>
                  <td className="p-6"><p className="text-sm font-bold text-slate-700 whitespace-nowrap">{item.applicant_phone}</p><p className="text-xs font-medium text-slate-400 break-all">{item.applicant_email}</p></td>
                  <td className="p-6"><span onClick={() => window.open(`/vacancies/${item.vacancy_id}`, '_blank')} className="cursor-pointer text-sm text-slate-700 font-bold hover:text-indigo-600 hover:underline transition-colors flex items-center gap-1">{item.vacancies?.subject}</span></td>
                  <td className="p-6">
                    <p className="text-sm font-bold text-slate-700 cursor-pointer hover:text-indigo-600 hover:underline" onClick={() => item.vacancies?.user_id ? onOpenChat(item.vacancies.user_id) : alert('No linked user account.')}>{item.vacancies?.contact_name || 'N/A'}</p>
                    <p className="text-xs font-medium text-slate-400">{item.vacancies?.contact_number || 'N/A'}</p>
                  </td>
                  <td className="p-6">
                    <div className="flex items-center gap-2">
                      <div className="relative inline-block w-full max-w-[130px]">
                        <select value={item.status} onChange={(e) => handleStatusChange(item.id, e.target.value)} className={`appearance-none w-full px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider outline-none cursor-pointer border border-transparent hover:border-slate-300 transition-all ${statusColors[item.status] || 'bg-slate-100 text-slate-700'}`}>
                          <option value="pending">PENDING</option><option value="accepted">ACCEPTED</option><option value="rejected">REJECTED</option>
                        </select>
                        <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-50" />
                      </div>
                      {item.user_id && <button onClick={() => onOpenChat(item.user_id as any)} className="p-2 text-indigo-600 bg-indigo-50 rounded-xl hover:bg-indigo-100 transition-colors shrink-0" title="Chat with Tutor"><MessageSquare size={16} /></button>}
                    </div>
                  </td>
                  <td className="p-6 text-right">
                    <button onClick={async () => { if (confirm('Delete?')) { const { error } = await supabase.from('vacancy_applications').delete().eq('id', item.id); if (error) alert(error.message); else refresh(); } }} className="p-2 text-red-600 bg-red-50 rounded-xl hover:bg-red-100"><Trash2 size={16} /></button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}

// --- SECTION: TUITION REQUESTS ---
function RequestsManager({ data, refresh, onOpenChat }: any) {
  const supabase = createClient();
  const [viewMessage, setViewMessage] = useState<string | null>(null);
  const handleStatusChange = async (id: number, newStatus: string) => {
    const { error } = await supabase.from("student_requests").update({ status: newStatus }).eq("id", id);
    if (error) alert("Update failed: " + error.message);
    else refresh();
  };
  const statusColors: any = { pending: 'bg-orange-100 text-orange-700', accepted: 'bg-green-100 text-green-700', rejected: 'bg-red-100 text-red-700' };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 w-full">
      <h2 className="text-3xl font-black text-slate-900">Tuition Requests</h2>
      <div className="bg-white rounded-[30px] shadow-xl border border-slate-100 overflow-x-auto w-full">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100 text-xs font-black text-slate-400 uppercase tracking-widest">
              <th className="p-6">Student Info</th><th className="p-6">Applied To (Tutor)</th><th className="p-6">Status</th><th className="p-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item: StudentRequest) => (
              <tr key={item.id} className="border-b border-slate-50 hover:bg-slate-50/50 cursor-pointer transition-colors" onClick={() => setViewMessage(item.message)}>
                <td className="p-6">
                  <p className="font-bold text-indigo-600 hover:underline text-lg transition-colors inline-block whitespace-nowrap" onClick={(e) => { e.stopPropagation(); item.user_id ? onOpenChat(item.user_id) : alert('No user account linked.'); }} title="Chat with Student">{item.student_name}</p>
                  <p className="text-sm text-slate-500 mt-1">{item.phone}</p>
                </td>
                <td className="p-6">
                  {item.tutors ? (
                    <div>
                      <p className="font-bold text-indigo-600 hover:underline text-base transition-colors inline-block whitespace-nowrap" onClick={(e) => { e.stopPropagation(); item.tutors?.user_id ? onOpenChat(item.tutors.user_id) : alert('No user account linked.'); }} title="Chat with Tutor">{item.tutors.name}</p>
                      <p className="text-sm text-slate-500 mt-0.5 whitespace-nowrap">{item.tutors.contact_num} • Rs. {item.tutors.hour_rate}/hr</p>
                    </div>
                  ) : <p className="text-sm text-slate-400 italic">No specific tutor</p>}
                </td>
                <td className="p-6" onClick={(e) => e.stopPropagation()}>
                  <div className="relative inline-block w-full max-w-[140px]">
                    <select value={item.status} onChange={(e) => handleStatusChange(item.id, e.target.value)} className={`appearance-none w-full px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider outline-none cursor-pointer border border-transparent hover:border-slate-300 transition-all ${statusColors[item.status] || 'bg-slate-100 text-slate-700'}`}>
                      <option value="pending">PENDING</option><option value="accepted">ACCEPTED</option><option value="rejected">REJECTED</option>
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-50" />
                  </div>
                </td>
                <td className="p-6 text-right" onClick={(e) => e.stopPropagation()}>
                  <button onClick={async () => { if (confirm('Delete?')) { const { error } = await supabase.from('student_requests').delete().eq('id', item.id); if (error) alert(error.message); else refresh(); } }} className="p-2 text-red-600 bg-red-50 rounded-xl hover:bg-red-100"><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
            {data.length === 0 && <tr><td colSpan={4} className="p-10 text-center text-slate-500">No requests found.</td></tr>}
          </tbody>
        </table>
      </div>
      {viewMessage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm" onClick={() => setViewMessage(null)}>
          <div className="bg-white rounded-[30px] shadow-2xl max-w-lg w-full relative p-8" onClick={e => e.stopPropagation()}>
            <button onClick={() => setViewMessage(null)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-800"><X /></button>
            <h3 className="text-xl font-black mb-4">Student Message</h3>
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 text-slate-700 font-medium whitespace-pre-wrap leading-relaxed">{viewMessage}</div>
            <div className="mt-6 flex justify-end">
              <button onClick={() => setViewMessage(null)} className="px-6 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-bold transition-colors">Close</button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}

// --- NEW SECTION: BATCH MANAGEMENT (Formerly Courses) ---
function BatchManager({ data, batches, refresh }: { data: OnlineCourse[], batches: CourseBatch[], refresh: () => void }) {
  const supabase = createClient();
  
  // View States
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  
  // Course Modal State
  const [courseModalOpen, setCourseModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Partial<OnlineCourse>>({});

  // Batch Modal State
  const [batchModalOpen, setBatchModalOpen] = useState(false);
  const [editingBatch, setEditingBatch] = useState<Partial<CourseBatch>>({});

  // 1. Course Handlers
  const openCourseEdit = (course: OnlineCourse) => {
    setEditingCourse({ ...course });
    setCourseModalOpen(true);
  };

  const saveCourse = async () => {
    if (!editingCourse.id) return;
    const { error } = await supabase.from('online_courses_v2').update({
      name: editingCourse.title, // Maps Title edit back to the `name` column!
      fee: Number(editingCourse.fee),
      discount: Number(editingCourse.discount),
      active_batch_no: Number(editingCourse.active_batch_no),
      is_active: editingCourse.is_active
    }).eq('syllabus_id', editingCourse.id);
    
    if (error) { alert("Course Update Error: " + error.message); return; }
    setCourseModalOpen(false);
    refresh();
  };

  const toggleCourseStatus = async (course: OnlineCourse) => {
    const { error } = await supabase.from('online_courses_v2').update({ is_active: !course.is_active }).eq('syllabus_id', course.id);
    if (error) alert(error.message); else refresh();
  };

  // 2. Batch Handlers
  const openBatchEdit = (batch: Partial<CourseBatch>, courseId: string, courseName: string) => {
    setEditingBatch({ 
      ...batch, 
      course_id: courseId, 
      course_name: courseName,
      is_active: batch.is_active ?? true 
    });
    setBatchModalOpen(true);
  };

  const saveBatch = async () => {
    if (!editingBatch.course_id || !editingBatch.batch_no) { alert("Syllabus ID and Batch No are required."); return; }
    
    const payload = {
      syllabus_id: editingBatch.course_id,
      course_name: editingBatch.course_name,
      batch_no: editingBatch.batch_no,
      start_datetime: editingBatch.start_datetime || null,
      timing: editingBatch.timing || null,
      online_class_link: editingBatch.online_class_link || null,
      google_classroom_link: editingBatch.google_classroom_link || null,
      whatsapp_group_link: editingBatch.whatsapp_group_link || null,
      is_active: editingBatch.is_active
    };

    if (editingBatch.id) {
      // Update
      const { error } = await supabase.from('course_batches_v2').update(payload).eq('id', editingBatch.id);
      if (error) { alert("Batch Update Error: " + error.message); return; }
    } else {
      // Insert
      const { error } = await supabase.from('course_batches_v2').insert([payload]);
      if (error) { alert("Batch Create Error: " + error.message); return; }
    }
    
    setBatchModalOpen(false);
    refresh();
  };

  const toggleBatchStatus = async (batch: CourseBatch) => {
    const { error } = await supabase.from('course_batches_v2').update({ is_active: !batch.is_active }).eq('id', batch.id);
    if (error) alert(error.message); else refresh();
  };

  // VIEWS
  if (selectedCourseId) {
    const selectedCourse = data.find(c => c.id === selectedCourseId);
    if (!selectedCourse) return <p>Course not found</p>;
    
    // Sort batches for this course, newest start date first
    const courseBatches = batches.filter(b => b.course_id === selectedCourseId).sort((a, b) => {
      const timeA = a.start_datetime ? new Date(a.start_datetime).getTime() : 0;
      const timeB = b.start_datetime ? new Date(b.start_datetime).getTime() : 0;
      return timeB - timeA;
    });

    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 w-full">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <button onClick={() => setSelectedCourseId(null)} className="p-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm"><ArrowLeft size={20} className="text-slate-600" /></button>
            <div>
              <h2 className="text-2xl font-black text-slate-900">{selectedCourse.title}</h2>
              <p className="text-sm font-medium text-slate-500">Manage batches for this specific course.</p>
            </div>
          </div>
          <button onClick={() => openBatchEdit({ batch_no: (courseBatches[0]?.batch_no || 0) + 1 }, selectedCourse.id, selectedCourse.title)} className="bg-indigo-600 text-white px-5 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all whitespace-nowrap">
            <Plus size={18} /> Create New Batch
          </button>
        </div>

        <div className="bg-white rounded-[30px] shadow-xl border border-slate-100 overflow-x-auto w-full">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-xs font-black text-slate-400 uppercase tracking-widest">
                <th className="p-6 w-24 text-center">Batch No</th>
                <th className="p-6">Schedule Details</th>
                <th className="p-6">Platform Links</th>
                <th className="p-6">Status</th>
                <th className="p-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {courseBatches.map(batch => (
                <tr key={batch.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                  <td className="p-6 text-center">
                    <span className="w-10 h-10 mx-auto bg-indigo-50 text-indigo-700 rounded-xl flex items-center justify-center font-black text-lg">
                      {batch.batch_no}
                    </span>
                  </td>
                  <td className="p-6">
                    <p className="font-bold text-slate-900 flex items-center gap-2"><Clock size={14} className="text-slate-400"/> {batch.start_datetime ? new Date(batch.start_datetime).toLocaleString() : 'No Start Date Set'}</p>
                    <p className="text-sm text-slate-500 mt-1">Timing: {batch.timing || 'TBD'}</p>
                  </td>
                  <td className="p-6 space-y-1">
                    {batch.online_class_link ? <a href={batch.online_class_link} target="_blank" className="text-sm font-bold text-blue-600 hover:underline flex items-center gap-1"><Monitor size={12}/> Class Link</a> : <p className="text-xs text-slate-400">No Class Link</p>}
                    {batch.google_classroom_link ? <a href={batch.google_classroom_link} target="_blank" className="text-sm font-bold text-emerald-600 hover:underline flex items-center gap-1"><GraduationCap size={12}/> Classroom</a> : <p className="text-xs text-slate-400">No Classroom Link</p>}
                    {batch.whatsapp_group_link ? <a href={batch.whatsapp_group_link} target="_blank" className="text-sm font-bold text-green-600 hover:underline flex items-center gap-1"><MessageCircle size={12}/> WhatsApp Group</a> : <p className="text-xs text-slate-400">No WA Link</p>}
                  </td>
                  <td className="p-6"><ToggleSwitch checked={batch.is_active} onChange={() => toggleBatchStatus(batch)} label={batch.is_active ? 'Active' : 'Archived'} /></td>
                  <td className="p-6 text-right">
                    <button onClick={() => openBatchEdit(batch, selectedCourse.id, selectedCourse.title)} className="p-2 text-indigo-600 bg-indigo-50 rounded-xl hover:bg-indigo-100" title="Edit Batch"><Edit2 size={16} /></button>
                  </td>
                </tr>
              ))}
              {courseBatches.length === 0 && <tr><td colSpan={5} className="p-10 text-center text-slate-500">No batches created for this course yet.</td></tr>}
            </tbody>
          </table>
        </div>

        {/* BATCH MODAL */}
        {batchModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm" onClick={() => setBatchModalOpen(false)}>
            <div className="bg-white rounded-[30px] shadow-2xl max-w-lg w-full relative overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
              <button onClick={() => setBatchModalOpen(false)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-800 z-10"><X /></button>
              <div className="p-6 border-b border-slate-100 bg-slate-50 mt-4">
                <h3 className="text-2xl font-black text-slate-900">{editingBatch.id ? `Edit Batch ${editingBatch.batch_no}` : 'Create New Batch'}</h3>
                <p className="text-sm text-slate-500 font-medium mt-1">{selectedCourse.title}</p>
              </div>
              <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto no-scrollbar">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 ml-1">Batch Number</label>
                    <input type="number" className="w-full bg-slate-50 p-3.5 rounded-xl outline-none border border-slate-200 focus:border-indigo-500 font-black text-slate-800 text-sm" value={editingBatch.batch_no || ''} onChange={e => setEditingBatch({ ...editingBatch, batch_no: Number(e.target.value) })} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 ml-1">Status</label>
                    <div className="pt-2"><ToggleSwitch checked={!!editingBatch.is_active} onChange={() => setEditingBatch({ ...editingBatch, is_active: !editingBatch.is_active })} label={editingBatch.is_active ? 'Active' : 'Inactive'} /></div>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 ml-1">Start Date & Time</label>
                  <input type="datetime-local" className="w-full bg-slate-50 p-3.5 rounded-xl outline-none border border-slate-200 focus:border-indigo-500 font-bold text-slate-800 text-sm" value={editingBatch.start_datetime ? new Date(new Date(editingBatch.start_datetime).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ''} onChange={e => setEditingBatch({ ...editingBatch, start_datetime: new Date(e.target.value).toISOString() })} />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 ml-1">Timing Description (e.g., "8:00 PM to 9:30 PM")</label>
                  <input type="text" className="w-full bg-slate-50 p-3.5 rounded-xl outline-none border border-slate-200 focus:border-indigo-500 font-bold text-slate-800 text-sm" value={editingBatch.timing || ''} onChange={e => setEditingBatch({ ...editingBatch, timing: e.target.value })} placeholder="e.g., 8:00 PM to 9:30 PM" />
                </div>
                <hr className="border-slate-100 my-2" />
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 ml-1">Online Class Link (Meet/Zoom)</label>
                  <input type="text" className="w-full bg-slate-50 p-3.5 rounded-xl outline-none border border-slate-200 focus:border-indigo-500 font-medium text-slate-800 text-sm" value={editingBatch.online_class_link || ''} onChange={e => setEditingBatch({ ...editingBatch, online_class_link: e.target.value })} placeholder="https://meet.google.com/..." />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 ml-1">Google Classroom Link</label>
                  <input type="text" className="w-full bg-slate-50 p-3.5 rounded-xl outline-none border border-slate-200 focus:border-indigo-500 font-medium text-slate-800 text-sm" value={editingBatch.google_classroom_link || ''} onChange={e => setEditingBatch({ ...editingBatch, google_classroom_link: e.target.value })} placeholder="https://classroom.google.com/..." />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 ml-1">WhatsApp Group Link</label>
                  <input type="text" className="w-full bg-slate-50 p-3.5 rounded-xl outline-none border border-slate-200 focus:border-indigo-500 font-medium text-slate-800 text-sm" value={editingBatch.whatsapp_group_link || ''} onChange={e => setEditingBatch({ ...editingBatch, whatsapp_group_link: e.target.value })} placeholder="https://chat.whatsapp.com/..." />
                </div>
              </div>
              <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 shrink-0">
                <button onClick={() => setBatchModalOpen(false)} className="px-6 py-3 font-bold text-slate-500 hover:text-slate-800">Cancel</button>
                <button onClick={saveBatch} className="px-8 py-3 rounded-2xl font-black bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-colors">Save Batch</button>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    );
  }

  // ROOT VIEW (Show Courses Table)
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 w-full">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900">Batch Management</h2>
          <p className="text-slate-500 font-medium mt-1">Manage global course configurations and drill down into batches.</p>
        </div>
      </div>
      <div className="bg-white rounded-[30px] shadow-xl border border-slate-100 overflow-x-auto w-full">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100 text-xs font-black text-slate-400 uppercase tracking-widest">
              <th className="p-6">Course Overview</th>
              <th className="p-6">Configured Pricing</th>
              <th className="p-6 text-center">Active Batch</th>
              <th className="p-6 text-center">Status</th>
              <th className="p-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.map(course => (
              <tr key={course.id} className="border-b border-slate-50 hover:bg-slate-50/50 cursor-pointer" onClick={() => openCourseEdit(course)}>
                <td className="p-6">
                  <p className="font-bold text-slate-900 text-lg">{course.title}</p>
                  <p className="text-xs text-slate-500 font-mono mt-1">ID: {course.id}</p>
                </td>
                <td className="p-6 whitespace-nowrap">
                  <p className="font-black text-slate-800">Rs. {course.fee}</p>
                  {course.discount > 0 ? <p className="text-xs text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded inline-block mt-1">{course.discount}% Discount</p> : <p className="text-xs text-slate-400 mt-1">No Discount</p>}
                </td>
                <td className="p-6 text-center">
                  <span className="inline-block bg-indigo-50 text-indigo-700 font-black px-3 py-1.5 rounded-xl border border-indigo-100 shadow-sm text-lg">
                    {course.active_batch_no || '-'}
                  </span>
                </td>
                <td className="p-6 flex justify-center" onClick={e => e.stopPropagation()}>
                  <ToggleSwitch checked={course.is_active} onChange={() => toggleCourseStatus(course)} label={course.is_active ? 'Active' : 'Inactive'} />
                </td>
                <td className="p-6 text-right" onClick={e => e.stopPropagation()}>
                  <div className="flex justify-end gap-3 items-center">
                    <button onClick={(e) => { e.stopPropagation(); setSelectedCourseId(course.id); }} className="px-5 py-2 text-xs font-black text-white bg-slate-800 rounded-xl hover:bg-slate-900 shadow-md shadow-slate-900/20 transition-colors flex items-center gap-1 whitespace-nowrap">
                      <Layers size={14} /> View Batches
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {courseModalOpen && editingCourse && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm" onClick={() => setCourseModalOpen(false)}>
          <div className="bg-white rounded-[30px] shadow-2xl max-w-sm w-full relative overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            <p className="font-mono text-[10px] text-slate-400 absolute top-4 left-6">ID: {editingCourse.id}</p>
            <button onClick={() => setCourseModalOpen(false)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-800 z-10"><X /></button>
            <div className="p-6 border-b border-slate-100 bg-slate-50 mt-4">
              <h3 className="text-2xl font-black text-slate-900">Edit Config</h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 ml-1">Course Name</label>
                <input type="text" className="w-full bg-slate-50 p-3.5 rounded-xl outline-none border border-slate-200 focus:border-indigo-500 font-black text-slate-800 text-sm" value={editingCourse.title || ''} onChange={e => setEditingCourse({ ...editingCourse, title: e.target.value })} />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 ml-1">Fee (Rs)</label>
                <input type="number" className="w-full bg-slate-50 p-3.5 rounded-xl outline-none border border-slate-200 focus:border-indigo-500 font-black text-slate-800 text-sm" value={editingCourse.fee || ''} onChange={e => setEditingCourse({ ...editingCourse, fee: Number(e.target.value) })} />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 ml-1">Discount (%)</label>
                <input type="number" className="w-full bg-slate-50 p-3.5 rounded-xl outline-none border border-slate-200 focus:border-indigo-500 font-black text-slate-800 text-sm" value={editingCourse.discount || ''} onChange={e => setEditingCourse({ ...editingCourse, discount: Number(e.target.value) })} />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 ml-1">Active Batch No.</label>
                <input type="number" className="w-full bg-slate-50 p-3.5 rounded-xl outline-none border border-slate-200 focus:border-indigo-500 font-black text-slate-800 text-sm" value={editingCourse.active_batch_no || ''} onChange={e => setEditingCourse({ ...editingCourse, active_batch_no: Number(e.target.value) })} />
              </div>
            </div>
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 shrink-0">
              <button onClick={() => setCourseModalOpen(false)} className="px-6 py-3 font-bold text-slate-500 hover:text-slate-800">Cancel</button>
              <button onClick={saveCourse} className="px-8 py-3 rounded-2xl font-black bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-colors">Save</button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}

// --- SECTION: BOOKINGS ---
function BookingsManager({ courses, enrollments, batches, refresh, onOpenChat }: { courses: OnlineCourse[], enrollments: Enrollment[], batches: CourseBatch[], refresh: () => void, onOpenChat: (id: string) => void }) {
  const supabase = createClient();
  const [selectedCourse, setSelectedCourse] = useState<OnlineCourse | null>(null);
  const [selectedBatch, setSelectedBatch] = useState<number | 'unassigned' | null>(null);
  const [dateSort, setDateSort] = useState<'desc' | 'asc'>('desc');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'confirmed'>('all');
  const [searchQuery, setSearchQuery] = useState(""); 
  
  // Payment Editing State
  const [editingPayment, setEditingPayment] = useState<Enrollment | null>(null);
  const [editPaid, setEditPaid] = useState<number>(0);
  const [editLockedPrice, setEditLockedPrice] = useState<number>(0); 
  
  // Manual Booking State
  const [isAddingBooking, setIsAddingBooking] = useState(false);
  const [newBooking, setNewBooking] = useState({ name: '', email: '', wa: '', locked_price: 0, paid_amount: 0 });

  // Hidden enrollments state
  const [hiddenBookingIds, setHiddenBookingIds] = useState<Set<string>>(new Set());

  // PAGINATION STATE
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 20;

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCourse, selectedBatch, dateSort, statusFilter, hiddenBookingIds, searchQuery]); 

  const toggleConfirmation = async (enrollmentId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase.from('enrollments_v2').update({ is_confirmed: !currentStatus }).eq('id', enrollmentId);
      if (error) { alert(`Could not update booking: ${error.message}`); return; }
      refresh();
    } catch (err) { alert("An unexpected error occurred while updating."); }
  };

  const openPaymentEdit = (enr: Enrollment) => {
    setEditingPayment(enr);
    setEditPaid(enr.paid_amount || 0);
    setEditLockedPrice(enr.locked_price || 0);
  };

  const savePayment = async () => {
    if (!editingPayment) return;
    
    // Automatically construct Order entry if it's completely missing
    if (!editingPayment.order_id) {
       const course = courses.find(c => c.id === editingPayment.course_id);
       
       const { data: newOrder, error: insErr } = await supabase.from('orders_v2').insert([{
         enrollment_id: editingPayment.id,
         full_name: editingPayment.full_name,
         email: editingPayment.email,
         whatsapp_number: editingPayment.whatsapp_number,
         order_type: 'Online Course',
         order_name: editingPayment.course_name || (course?.title || 'Course Enrollment'),
         paid_amount: editPaid,
         pending_amount: 0, // Admin override, defaults to verified paid
         locked_price: editLockedPrice,
         status: editPaid >= editLockedPrice ? 'verified' : 'pending'
       }]).select().single();

       if (insErr) {
         if (insErr.message.includes("order_type_check")) {
             alert(`Database check constraint failed: Your orders_v2 table rejects "Online Course" as an order_type.\n\nPlease check your Supabase schema. Error: ${insErr.message}`);
         } else {
             alert("Failed to auto-create missing order: " + insErr.message);
         }
         return;
       }
       refresh();
       setEditingPayment(null);
       return;
    }

    // UPDATE ORDERS_V2 DIRECTLY
    const { error } = await supabase.from('orders_v2').update({
      paid_amount: editPaid,
      locked_price: editLockedPrice
    }).eq('id', editingPayment.order_id);
    
    if (error) {
      alert("Failed to update payment: " + error.message);
    } else {
      refresh();
      setEditingPayment(null);
    }
  };

  const openAddBookingModal = () => {
    const fee = Number(selectedCourse?.fee) || 0;
    const discount = Number(selectedCourse?.discount) || 0;
    const defaultLocked = fee - (fee * discount / 100);
    
    setNewBooking({ name: '', email: '', wa: '', locked_price: defaultLocked, paid_amount: 0 });
    setIsAddingBooking(true);
  };

  const saveManualBooking = async () => {
    if (!selectedCourse) return;
    if (!newBooking.name || !newBooking.email || !newBooking.wa) {
      alert("Please fill all contact details!");
      return;
    }

    // 1. Find the actual UUID of the currently selected batch
    let resolvedBatchId = null;
    if (selectedBatch !== 'unassigned' && selectedBatch !== null) {
      const matchedBatch = batches.find(b => b.course_id === selectedCourse.id && b.batch_no === selectedBatch);
      if (matchedBatch) {
        resolvedBatchId = matchedBatch.id;
      }
    }

    // Strict Check
    if (!resolvedBatchId) {
      alert("Error: You must be inside a specific valid batch to add a booking.");
      return;
    }

    // 2. Insert Enrollment
    const enrPayload = {
      batch_id: resolvedBatchId,
      full_name: newBooking.name,
      email: newBooking.email,
      whatsapp_number: newBooking.wa,
      is_confirmed: true 
    };

    const { data: enrData, error: enrErr } = await supabase.from('enrollments_v2').insert([enrPayload]).select().single();

    if (enrErr) {
      alert("Error adding enrollment: " + enrErr.message);
      return;
    }

    // 3. Insert corresponding Order auto using the modal's financial inputs
    const ordPayload = {
      enrollment_id: enrData.id,
      full_name: newBooking.name,
      email: newBooking.email,
      whatsapp_number: newBooking.wa,
      order_type: 'Online Course', 
      order_name: selectedCourse.title,
      paid_amount: newBooking.paid_amount,
      pending_amount: 0,
      locked_price: newBooking.locked_price,
      status: newBooking.paid_amount >= newBooking.locked_price ? 'verified' : 'pending'
    };

    const { error: ordErr } = await supabase.from('orders_v2').insert([ordPayload]);

    if (ordErr) {
      if (ordErr.message.includes("order_type_check")) {
        alert("Enrollment created, but auto-order creation failed because your Database strictly checks for a specific string format.");
      } else {
        alert("Enrollment added, but auto-order creation failed: " + ordErr.message);
      }
    }

    // 4. Cleanup and refresh UI
    setIsAddingBooking(false);
    setNewBooking({ name: '', email: '', wa: '', locked_price: 0, paid_amount: 0 });
    refresh();
  };

  const handleHide = (id: string) => {
    setHiddenBookingIds(prev => {
      const newSet = new Set(prev);
      newSet.add(id);
      return newSet;
    });
  };

  const handleUnhideAll = () => {
    setHiddenBookingIds(new Set());
  };

  // STEP 1: SHOW COURSES LIST (Square Boxes Layout)
  if (!selectedCourse) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 w-full">
        <div>
          <h2 className="text-3xl font-black text-slate-900">Course Bookings</h2>
          <p className="text-slate-500 font-medium mt-1">Select an online course to view its batches and enrollments.</p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6 mt-6 w-full">
          {courses.map(course => {
            const batchCount = batches.filter(b => b.course_id === course.id).length;
            return (
              <div 
                key={course.id} 
                onClick={() => setSelectedCourse(course)} 
                className="flex flex-col items-center justify-center p-6 bg-white border border-slate-200 rounded-3xl hover:border-indigo-500 hover:shadow-xl hover:-translate-y-1 cursor-pointer transition-all aspect-square relative text-center group w-full max-w-[300px] mx-auto"
              >
                <div className="absolute top-4 right-4 bg-indigo-50 text-indigo-700 font-black text-[10px] uppercase tracking-wider px-3 py-1.5 rounded-xl shadow-sm">
                  {batchCount} Batches
                </div>
                <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-500 mb-4 group-hover:scale-110 transition-transform duration-300 shadow-inner">
                  <BookOpen size={28} />
                </div>
                <h3 className="font-black text-slate-900 text-base px-2 leading-snug">{course.title}</h3>
              </div>
            );
          })}
        </div>
      </motion.div>
    );
  }

  // STEP 2: SHOW BATCHES LIST FOR SELECTED COURSE
  if (selectedCourse && selectedBatch === null) {
    const availableBatches = Array.from(new Set([
      ...batches.filter(b => b.course_id === selectedCourse.id).map(b => b.batch_no),
      ...enrollments.filter(e => e.course_id === selectedCourse.id && e.batch_no).map(e => e.batch_no as number)
    ])).sort((a, b) => b - a);

    const unassignedCount = enrollments.filter(e => e.course_id === selectedCourse.id && !e.batch_no).length;

    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 w-full">
        <div className="flex items-center gap-4">
          <button onClick={() => setSelectedCourse(null)} className="p-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm"><ArrowLeft size={20} className="text-slate-600" /></button>
          <div>
            <h2 className="text-2xl font-black text-slate-900">{selectedCourse.title}</h2>
            <p className="text-sm font-medium text-slate-500">Select a Batch to view its enrollments</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-6">
          {availableBatches.map(b => {
            const batchCount = enrollments.filter(e => e.course_id === selectedCourse.id && e.batch_no === b).length;
            return (
              <div key={b} onClick={() => setSelectedBatch(b)} className="flex items-center justify-between p-6 bg-white border border-slate-200 rounded-2xl hover:border-emerald-400 hover:shadow-md cursor-pointer transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center font-black text-2xl">
                    {b}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-xl">Batch {b}</h3>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-black text-emerald-600">{batchCount}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Enrollments</p>
                </div>
              </div>
            );
          })}

          {unassignedCount > 0 && (
             <div onClick={() => setSelectedBatch('unassigned')} className="flex items-center justify-between p-6 bg-white border border-slate-200 rounded-2xl hover:border-orange-400 hover:shadow-md cursor-pointer transition-all">
               <div className="flex items-center gap-4">
                 <div className="w-14 h-14 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center font-black text-2xl">
                   ?
                 </div>
                 <div>
                   <h3 className="font-bold text-slate-900 text-xl">Unassigned</h3>
                 </div>
               </div>
               <div className="text-right">
                 <p className="text-3xl font-black text-orange-600">{unassignedCount}</p>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Enrollments</p>
               </div>
             </div>
          )}
        </div>
      </motion.div>
    );
  }

  // STEP 3: SHOW ENROLLMENTS FOR SELECTED BATCH
  let courseEnrollments = enrollments.filter(e => {
    if (e.course_id !== selectedCourse.id) return false;
    if (hiddenBookingIds.has(e.id)) return false;
    
    if (selectedBatch === 'unassigned' && e.batch_no) return false;
    if (selectedBatch !== 'unassigned' && e.batch_no !== selectedBatch) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = e.full_name?.toLowerCase().includes(q);
      const matchEmail = e.email?.toLowerCase().includes(q);
      const matchPhone = e.whatsapp_number?.toLowerCase().includes(q);
      if (!matchName && !matchEmail && !matchPhone) return false;
    }
    return true;
  });

  if (statusFilter === 'confirmed') courseEnrollments = courseEnrollments.filter(e => e.confirmed);
  if (statusFilter === 'pending') courseEnrollments = courseEnrollments.filter(e => !e.confirmed);
  
  courseEnrollments.sort((a, b) => {
    const timeA = new Date(a.created_at).getTime(); const timeB = new Date(b.created_at).getTime();
    return dateSort === 'desc' ? timeB - timeA : timeA - timeB;
  });

  // Calculate Aggregates
  const totalVolume = courseEnrollments.reduce((sum, e) => sum + (e.locked_price || 0), 0);
  const predictedVolume = courseEnrollments.reduce((sum, e) => sum + (e.confirmed ? (e.locked_price || 0) : 0), 0);
  const collectedVolume = courseEnrollments.reduce((sum, e) => sum + (e.paid_amount || 0), 0);
  const remainingVolume = courseEnrollments.reduce((sum, e) => {
    if (!e.confirmed) return sum;
    return sum + Math.max(0, (e.locked_price || 0) - (e.paid_amount || 0));
  }, 0);

  const totalPages = Math.ceil(courseEnrollments.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedEnrollments = courseEnrollments.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handleCopyCSV = () => {
    const header = "Name,Phone,Email\n";
    const rows = courseEnrollments.map(e => `"${e.full_name}","${e.whatsapp_number}","${e.email}"`).join("\n");
    navigator.clipboard.writeText(header + rows).then(() => alert("Copied to clipboard!"));
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 w-full">
      
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button onClick={() => setSelectedBatch(null)} className="p-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm"><ArrowLeft size={20} className="text-slate-600" /></button>
            <div>
              <h2 className="text-2xl font-black text-slate-900">{selectedCourse.title}</h2>
              <p className="text-sm font-medium text-slate-500">
                {selectedBatch === 'unassigned' ? 'Unassigned Enrollments' : `Batch ${selectedBatch} Enrollments`}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {hiddenBookingIds.size > 0 && (
              <button onClick={handleUnhideAll} className="px-4 py-3 bg-blue-50 text-blue-600 rounded-xl text-sm font-bold hover:bg-blue-100 transition-colors flex items-center gap-2 shadow-sm">
                <Eye size={16} /> Unhide All ({hiddenBookingIds.size})
              </button>
            )}
            <button onClick={openAddBookingModal} className="px-5 py-3 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-sm shadow-indigo-600/30 whitespace-nowrap">
              <Plus size={16} /> Add Booking
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 items-center w-full">
          <div className="relative flex-1 min-w-[250px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search by name, email, or phone number..." 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
              className="w-full pl-11 pr-4 py-3 bg-white rounded-xl border border-slate-200 shadow-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all font-medium text-slate-700 text-sm" 
            />
          </div>
          <select className="bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none shadow-sm cursor-pointer" value={dateSort} onChange={e => setDateSort(e.target.value as 'desc' | 'asc')}>
            <option value="desc">Date: Newest First</option><option value="asc">Date: Oldest First</option>
          </select>
          <select className="bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none shadow-sm cursor-pointer" value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)}>
            <option value="all">Status: All</option><option value="pending">Status: Pending Only</option><option value="confirmed">Status: Confirmed Only</option>
          </select>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-4 gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-black text-slate-600 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm whitespace-nowrap">
            Showing {courseEnrollments.length} Booking(s)
          </span>
          <span className="text-sm font-bold text-slate-700 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm whitespace-nowrap">
            Total Vol: <span className="text-slate-900 font-black">Rs. {totalVolume}</span>
          </span>
          <span className="text-sm font-bold text-blue-800 bg-blue-100 px-3 py-1.5 rounded-lg border border-blue-200 shadow-sm whitespace-nowrap">
            Predicted Vol: <span className="font-black">Rs. {predictedVolume}</span>
          </span>
          <span className="text-sm font-bold text-emerald-800 bg-emerald-100 px-3 py-1.5 rounded-lg border border-emerald-200 shadow-sm whitespace-nowrap">
            Collected: <span className="font-black">Rs. {collectedVolume}</span>
          </span>
          <span className="text-sm font-bold text-rose-800 bg-rose-100 px-3 py-1.5 rounded-lg border border-rose-200 shadow-sm whitespace-nowrap">
            Remaining: <span className="font-black">Rs. {remainingVolume}</span>
          </span>
        </div>
        <button onClick={handleCopyCSV} className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-slate-700 transition-colors shadow-sm whitespace-nowrap shrink-0">
          <Copy size={14} /> Copy CSV List
        </button>
      </div>

      {/* EXCEL SHEET STYLED TABLE */}
      <div className="bg-white border border-slate-300 shadow-sm overflow-x-auto w-full flex flex-col rounded-md">
        <div className="overflow-y-auto max-h-[600px] w-full">
          <table className="w-full text-left border-collapse table-auto text-xs">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-300 text-slate-700 uppercase font-black tracking-wider sticky top-0 z-10 shadow-sm">
                <th className="p-3 border-r border-slate-300 w-12 text-center bg-slate-100">No.</th>
                <th className="p-3 border-r border-slate-300 w-[20%] bg-slate-100">Applicant Details</th>
                <th className="p-3 border-r border-slate-300 w-[12%] bg-slate-100">Date</th>
                <th className="p-3 border-r border-slate-300 w-[25%] bg-slate-100">Remarks</th>
                <th className="p-3 border-r border-slate-300 w-[18%] bg-slate-100">Payment Info</th>
                <th className="p-3 border-r border-slate-300 w-[8%] text-center bg-slate-100">Confirmed</th>
                <th className="p-3 text-center w-[10%] bg-slate-100">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedEnrollments.map((enr, idx) => (
                <tr key={enr.id} className="border-b border-slate-300 hover:bg-amber-50/50 transition-colors">
                  <td className="p-3 border-r border-slate-300 text-center text-slate-500 font-mono align-top">
                    {startIndex + idx + 1}
                  </td>
                  <td className="p-3 border-r border-slate-300 align-top leading-relaxed">
                    <p className="font-bold text-slate-900 text-sm cursor-pointer hover:text-indigo-600 hover:underline" onClick={(e) => { e.stopPropagation(); enr.user_id ? onOpenChat(enr.user_id) : alert('No linked user account.'); }}>
                      {enr.full_name}
                    </p>
                    <p className="text-slate-600 break-all">{enr.email}</p>
                    <p className="text-slate-600 font-medium">WA: {enr.whatsapp_number}</p>
                  </td>
                  <td className="p-3 border-r border-slate-300 align-top text-slate-700 font-medium whitespace-nowrap">
                    {new Date(enr.created_at).toLocaleDateString()}
                  </td>
                  <td className="p-3 border-r border-slate-300 align-top text-slate-700 break-words" title={enr.remarks}>
                    {enr.remarks || '-'}
                  </td>
                  <td className="p-3 border-r border-slate-300 align-top whitespace-nowrap">
                    <div className="flex justify-between w-full mb-1 gap-2">
                      <span className="text-slate-500 font-bold">Total Fee:</span> 
                      <span className="font-bold text-slate-700">Rs.{enr.locked_price || 0}</span>
                    </div>
                    <div className="flex justify-between w-full mb-1 gap-2">
                      <span className="text-slate-500 font-bold">Paid:</span> 
                      <span className="font-black text-slate-800">Rs.{enr.paid_amount || 0}</span>
                    </div>
                    <div className="flex justify-between w-full pt-1 border-t border-slate-200 mt-1 gap-2">
                      <span className="text-slate-500 font-bold">Due:</span> 
                      <span className="font-black text-red-600">Rs.{Math.max(0, (enr.locked_price || 0) - (enr.paid_amount || 0))}</span>
                    </div>
                  </td>
                  <td className="p-3 border-r border-slate-300 align-top text-center">
                    <input 
                      type="checkbox" 
                      checked={!!enr.confirmed} 
                      onChange={() => toggleConfirmation(enr.id, !!enr.confirmed)} 
                      className="w-5 h-5 cursor-pointer accent-green-600 border-slate-300 rounded" 
                    />
                  </td>
                  <td className="p-2 align-top text-center">
                    <div className="flex flex-col gap-1.5 w-full max-w-[80px] mx-auto">
                      <button onClick={() => openPaymentEdit(enr)} className="w-full text-[10px] font-bold bg-slate-100 border border-slate-300 text-slate-700 py-1.5 rounded hover:bg-slate-200 transition-colors flex items-center justify-center gap-1"><Edit2 size={12}/> Edit Pay</button>
                      <button onClick={() => handleHide(enr.id)} className="w-full text-[10px] font-bold bg-slate-100 border border-slate-300 text-slate-600 py-1.5 rounded hover:bg-slate-200 transition-colors flex items-center justify-center gap-1"><EyeOff size={12}/> Hide</button>
                      <button onClick={async () => { if (confirm('Remove this enrollment?')) { const { error } = await supabase.from('enrollments_v2').delete().eq('id', enr.id); if (error) alert(error.message); else refresh(); } }} className="w-full text-[10px] font-bold bg-red-50 text-red-600 border border-red-200 py-1.5 rounded hover:bg-red-100 transition-colors flex items-center justify-center gap-1"><Trash2 size={12}/> Del</button>
                    </div>
                  </td>
                </tr>
              ))}
              {paginatedEnrollments.length === 0 && <tr><td colSpan={7} className="p-8 text-center text-slate-500 font-medium">No matching enrollments found.</td></tr>}
            </tbody>
          </table>
        </div>

        {courseEnrollments.length > 0 && (
          <div className="flex flex-wrap items-center justify-between p-4 border-t border-slate-300 bg-slate-50 shrink-0 gap-4">
            <span className="text-xs font-bold text-slate-600">
              Showing {startIndex + 1} to {Math.min(startIndex + ITEMS_PER_PAGE, courseEnrollments.length)} of {courseEnrollments.length} entries
            </span>
            <div className="flex gap-2">
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-4 py-2 rounded border border-slate-300 text-xs font-bold bg-white text-slate-700 disabled:opacity-50 hover:bg-slate-100 transition-colors">Previous</button>
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || totalPages === 0} className="px-4 py-2 rounded border border-slate-300 text-xs font-bold bg-white text-slate-700 disabled:opacity-50 hover:bg-slate-100 transition-colors">Next</button>
            </div>
          </div>
        )}
      </div>

      {/* MANUAL BOOKING MODAL */}
      {isAddingBooking && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm" onClick={() => setIsAddingBooking(false)}>
          <div className="bg-white rounded-[30px] shadow-2xl p-8 max-w-sm w-full relative" onClick={e => e.stopPropagation()}>
            <button onClick={() => setIsAddingBooking(false)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-800"><X /></button>
            <h3 className="text-2xl font-black mb-1">Add Booking</h3>
            <p className="text-xs font-medium text-slate-500 mb-6">Create enrollment and link order manually.</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Full Name</label>
                <input type="text" value={newBooking.name} onChange={(e) => setNewBooking({...newBooking, name: e.target.value})} className="w-full bg-slate-50 p-3.5 rounded-xl outline-none border border-slate-200 focus:border-indigo-500 font-bold text-slate-800 transition-colors" placeholder="John Doe" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Email Address</label>
                <input type="email" value={newBooking.email} onChange={(e) => setNewBooking({...newBooking, email: e.target.value})} className="w-full bg-slate-50 p-3.5 rounded-xl outline-none border border-slate-200 focus:border-indigo-500 font-bold text-slate-800 transition-colors" placeholder="john@example.com" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">WhatsApp Number</label>
                <input type="text" value={newBooking.wa} onChange={(e) => setNewBooking({...newBooking, wa: e.target.value})} className="w-full bg-slate-50 p-3.5 rounded-xl outline-none border border-slate-200 focus:border-indigo-500 font-bold text-slate-800 transition-colors" placeholder="98XXXXXXXX" />
              </div>
              
              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Locked Price (Rs)</label>
                  <input type="number" value={newBooking.locked_price} onChange={(e) => setNewBooking({...newBooking, locked_price: Number(e.target.value)})} className="w-full bg-slate-50 p-3.5 rounded-xl outline-none border border-slate-200 focus:border-indigo-500 font-bold text-slate-800 transition-colors" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Paid Amount (Rs)</label>
                  <input type="number" value={newBooking.paid_amount} onChange={(e) => setNewBooking({...newBooking, paid_amount: Number(e.target.value)})} className="w-full bg-slate-50 p-3.5 rounded-xl outline-none border border-slate-200 focus:border-emerald-500 font-bold text-emerald-600 transition-colors" />
                </div>
              </div>
            </div>
            
            <div className="mt-8 flex justify-end gap-3">
              <button onClick={() => setIsAddingBooking(false)} className="px-5 py-3 font-bold text-slate-500 hover:text-slate-800 transition-colors">Cancel</button>
              <button onClick={saveManualBooking} className="px-6 py-3 rounded-xl font-black bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-colors">Add Enrollment</button>
            </div>
          </div>
        </div>
      )}

      {/* PAYMENT EDIT MODAL */}
      {editingPayment && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm" onClick={() => setEditingPayment(null)}>
          <div className="bg-white rounded-[30px] shadow-2xl p-8 max-w-sm w-full relative" onClick={e => e.stopPropagation()}>
            <button onClick={() => setEditingPayment(null)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-800"><X /></button>
            <h3 className="text-xl font-black mb-1">Edit Payment</h3>
            <p className="text-xs font-medium text-slate-500 mb-6">{editingPayment.full_name}</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Total Locked Fee (Rs)</label>
                <input type="number" value={editLockedPrice} onChange={(e) => setEditLockedPrice(Number(e.target.value))} className="w-full bg-slate-50 p-3 rounded-xl outline-none border border-slate-200 focus:border-indigo-500 font-black text-slate-800 transition-colors" />
              </div>
              
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Paid Amount (Rs)</label>
                <input type="number" value={editPaid} onChange={(e) => setEditPaid(Number(e.target.value))} className="w-full bg-slate-50 p-3 rounded-xl outline-none border border-slate-200 focus:border-emerald-500 font-black text-emerald-600 transition-colors" />
              </div>

              <div className="p-3 bg-slate-100 rounded-xl flex justify-between items-center border border-slate-200">
                <label className="block text-[10px] font-black text-slate-500 uppercase">Calculated Due</label>
                <span className="font-black text-red-600">Rs. {Math.max(0, editLockedPrice - editPaid)}</span>
              </div>

              {!editingPayment.order_id && (
                 <div className="bg-blue-50 p-3 rounded-xl border border-blue-100 mt-2">
                   <p className="text-xs font-bold text-blue-700 flex items-start gap-1"><AlertCircle size={14} className="shrink-0 mt-0.5" /> No linked order found. Saving this will automatically create an order linking to this enrollment.</p>
                 </div>
              )}
            </div>
            
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setEditingPayment(null)} className="px-4 py-2 font-bold text-slate-500 hover:text-slate-800 transition-colors">Cancel</button>
              <button onClick={savePayment} className="px-6 py-2 rounded-xl font-black bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-colors">Save Details</button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}


// --- SECTION: CERTIFICATES ---
function CertificatesManager({ data, syllabi, refresh, onOpenChat }: { data: Certificate[], syllabi: any[], refresh: () => void, onOpenChat: (id: string) => void }) {
  const supabase = createClient();
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
    id: null as string | null,
    name: '', email: '', syllabus_name: '',
    issue_date: new Date().toISOString().split('T')[0],
    certificate_code: '', existing_image: '', file: null as File | null
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

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
    if (confirm("Delete this certificate permanently?")) {
      const { error } = await supabase.from("certificates").delete().eq("id", id);
      if (error) alert(error.message); else refresh();
    }
  };

  const filteredData = data.filter((cert) => {
    const s = searchQuery.toLowerCase();
    return (
      (cert.name && cert.name.toLowerCase().includes(s)) ||
      (cert.email && cert.email.toLowerCase().includes(s)) ||
      (cert.syllabus_name && cert.syllabus_name.toLowerCase().includes(s)) ||
      (cert.certificate_code && cert.certificate_code.toLowerCase().includes(s))
    );
  });

  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentData = filteredData.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 w-full">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <h2 className="text-3xl font-black text-slate-900">Certificate Registry</h2>
        <button
          onClick={() => router.push('/admin/bulk-upload')}
          className="bg-indigo-600 text-white px-5 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all whitespace-nowrap"
        >
          <Plus size={18} /> Generate New
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input 
          type="text" 
          placeholder="Search by name, email, course, or certificate code..." 
          value={searchQuery} 
          onChange={(e) => setSearchQuery(e.target.value)} 
          className="w-full pl-12 pr-4 py-4 bg-white rounded-2xl border border-slate-200 shadow-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all font-medium text-slate-700" 
        />
      </div>

      <div className="bg-white rounded-[30px] shadow-xl border border-slate-100 overflow-x-auto w-full flex flex-col">
        <div className="overflow-y-auto max-h-[600px] w-full">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-xs font-black text-slate-400 uppercase tracking-widest">
                <th className="p-6">Student Info</th><th className="p-6">Course Name</th><th className="p-6">Issue Date & Code</th><th className="p-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentData.map(cert => (
                <tr
                  key={cert.id}
                  className="border-b border-slate-50 hover:bg-slate-50/50 cursor-pointer"
                  onClick={() => cert.certificate_image && setPreviewImage(cert.certificate_image)}
                >
                  <td className="p-6">
                    <p className="font-bold text-slate-900 cursor-pointer hover:text-indigo-600 hover:underline" onClick={(e) => { e.stopPropagation(); cert.user_id ? onOpenChat(cert.user_id) : alert('No linked user account.'); }}>{cert.name}</p>
                    <p className="text-sm text-slate-500 mt-1 break-all">{cert.email}</p>
                  </td>
                  <td className="p-6"><p className="font-bold text-slate-800">{cert.syllabus_name}</p></td>
                  <td className="p-6">
                    <p className="text-sm font-bold text-slate-800">{cert.issue_date ? new Date(cert.issue_date).toLocaleDateString() : 'N/A'}</p>
                    <p className="text-xs font-mono text-slate-500 mt-1">{cert.certificate_code || '-'}</p>
                  </td>
                  <td className="p-6 text-right" onClick={e => e.stopPropagation()}>
                    <div className="flex justify-end gap-2">
                      <button onClick={() => openEditModal(cert)} className="p-2 text-blue-600 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors" title="Edit"><Edit2 size={16} /></button>
                      <button onClick={() => handleDelete(cert.id)} className="p-2 text-red-600 bg-red-50 rounded-xl hover:bg-red-100" title="Delete"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredData.length === 0 && <tr><td colSpan={4} className="p-10 text-center text-slate-500">No matching certificates found.</td></tr>}
            </tbody>
          </table>
        </div>

        {filteredData.length > 0 && (
          <div className="flex flex-wrap items-center justify-between p-6 border-t border-slate-100 bg-slate-50 shrink-0 gap-4">
            <span className="text-sm font-medium text-slate-500">
              Showing {startIndex + 1} to {Math.min(startIndex + ITEMS_PER_PAGE, filteredData.length)} of {filteredData.length} entries
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 rounded-xl text-sm font-bold bg-white border border-slate-200 text-slate-700 disabled:opacity-50 hover:bg-slate-50 transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages || totalPages === 0}
                className="px-4 py-2 rounded-xl text-sm font-bold bg-white border border-slate-200 text-slate-700 disabled:opacity-50 hover:bg-slate-50 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {previewImage && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/80 p-4 backdrop-blur-sm"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-4xl w-full" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute -top-10 right-0 text-white/70 hover:text-white p-2 transition-colors"
            >
              <X size={28} />
            </button>
            <img
              src={getImageUrl(previewImage)}
              alt="Certificate Preview"
              className="w-full rounded-2xl shadow-2xl border border-white/10"
            />
            <a
              href={getImageUrl(previewImage)}
              target="_blank"
              rel="noreferrer"
              className="mt-4 flex items-center justify-center gap-2 text-white/70 hover:text-white text-sm font-bold transition-colors"
              onClick={e => e.stopPropagation()}
            >
              <ExternalLink size={16} /> Open Full Size
            </a>
          </div>
        </div>
      )}

      {editModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm" onClick={() => !uploading && setEditModalOpen(false)}>
          <div className="bg-white rounded-[30px] shadow-2xl max-w-lg w-full relative overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            <button onClick={() => setEditModalOpen(false)} disabled={uploading} className="absolute top-6 right-6 text-slate-400 hover:text-slate-800 z-10"><X /></button>
            <div className="p-6 border-b border-slate-100 bg-slate-50 mt-4">
              <h3 className="text-2xl font-black text-slate-900">Edit Certificate Record</h3>
              <p className="text-sm text-slate-500 font-medium mt-1">Updates the secure verified registry directly.</p>
            </div>
            <div className="p-6 space-y-4">
              <div><label className="block text-[10px] font-black text-slate-400 uppercase mb-1 ml-1">Student Full Name</label><input type="text" className="w-full bg-slate-50 p-3.5 rounded-xl outline-none border border-slate-200 focus:border-indigo-500 font-bold text-slate-800 text-sm" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
              <div><label className="block text-[10px] font-black text-slate-400 uppercase mb-1 ml-1">Student Email Address</label><input type="email" className="w-full bg-slate-50 p-3.5 rounded-xl outline-none border border-slate-200 focus:border-indigo-500 font-bold text-slate-800 text-sm" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 ml-1">Course Name (Select or Type Custom)</label>
                <input list="syllabi-options" type="text" className="w-full bg-slate-50 p-3.5 rounded-xl outline-none border border-slate-200 focus:border-indigo-500 font-bold text-slate-800 text-sm" value={form.syllabus_name} onChange={e => setForm({ ...form, syllabus_name: e.target.value })} placeholder="e.g. Graphic Design Masterclass" />
                <datalist id="syllabi-options">{syllabi.map(s => <option key={s.id} value={s.name} />)}</datalist>
              </div>
              <div><label className="block text-[10px] font-black text-slate-400 uppercase mb-1 ml-1">Completion/Issue Date</label><input type="date" className="w-full bg-slate-50 p-3.5 rounded-xl outline-none border border-slate-200 focus:border-indigo-500 font-bold text-slate-800 text-sm" value={form.issue_date} onChange={e => setForm({ ...form, issue_date: e.target.value })} /></div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 ml-1">Upload Certificate (PNG/JPG)</label>
                <label className="w-full flex items-center justify-center gap-2 bg-indigo-50 text-indigo-600 p-4 rounded-xl border border-dashed border-indigo-200 cursor-pointer hover:bg-indigo-100 transition-colors">
                  <Upload size={18} />
                  {form.file ? form.file.name : form.existing_image ? 'Image Exists (Click to Replace)' : 'Select Image File'}
                  <input type="file" accept="image/png, image/jpeg" className="hidden" onChange={e => { if (e.target.files && e.target.files[0]) setForm({ ...form, file: e.target.files[0] }); }} />
                </label>
              </div>
            </div>
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 shrink-0">
              <button onClick={() => setEditModalOpen(false)} disabled={uploading} className="px-6 py-3 font-bold text-slate-500 hover:text-slate-800 disabled:opacity-50">Cancel</button>
              <button onClick={handleSave} disabled={uploading} className="px-8 py-3 rounded-2xl font-black bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center gap-2">
                {uploading ? <Loader2 size={16} className="animate-spin" /> : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}

// --- NEW COMPONENT: FULL ADMIN CHAT MODAL ---
function ChatModal({ userId, onClose, profilesMap }: any) {
  const supabase = createClient();
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
         setMessages(prev => {
           if (prev.some(msg => msg.id === payload.new.id)) return prev;
           return [...prev, payload.new as Message];
         });
      }).subscribe();
      
    return () => { supabase.removeChannel(channel); };
  }, [userId]); 

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    
    const msgPayload = { user_id: userId, sender_role: 'admin', content: newMessage.trim() };
    
    const { data, error } = await supabase.from("messages").insert([msgPayload]).select().single();
    
    if (!error && data) {
      setNewMessage("");
      setMessages(prev => [...prev, data as Message]); 
    } else {
      alert("Failed to send message: " + error?.message);
    }
  };

  const userName = profilesMap?.full_name || "User";

  return (
    <div className="fixed inset-0 z-[120] flex justify-end bg-slate-900/20 backdrop-blur-sm" onClick={onClose}>
      <motion.div 
        initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col" 
        onClick={e => e.stopPropagation()}
      >
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-black text-slate-500 overflow-hidden">
              {profilesMap?.avatar_url ? <img src={profilesMap.avatar_url} className="w-full h-full object-cover" /> : userName.charAt(0)}
            </div>
            <div>
              <h3 className="font-black text-slate-900">{userName}</h3>
              <span className="text-[10px] uppercase font-bold text-green-500 tracking-wider">Online</span>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-800 transition-colors bg-slate-50 hover:bg-slate-100 rounded-full"><X size={18} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2">
              <MessageSquare size={40} className="opacity-20" />
              <p className="text-sm font-medium">No messages yet. Say hello!</p>
            </div>
          ) : (
            messages.map((msg, idx) => {
              const isAdmin = msg.sender_role === 'admin';
              return (
                <div key={idx} className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'}`}>
                  <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${isAdmin ? 'bg-indigo-600 text-white rounded-tr-sm' : 'bg-white border border-slate-200 text-slate-800 rounded-tl-sm shadow-sm'}`}>
                    {msg.content}
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 font-medium px-1">{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 bg-white border-t border-slate-100 shrink-0">
          <form onSubmit={handleSend} className="relative flex items-center">
            <input 
              type="text" 
              value={newMessage} 
              onChange={e => setNewMessage(e.target.value)} 
              placeholder="Type your message..." 
              className="w-full bg-slate-50 pl-4 pr-12 py-3.5 rounded-full outline-none border border-slate-200 focus:border-indigo-500 font-medium text-slate-800 text-sm transition-all"
            />
            <button type="submit" disabled={!newMessage.trim()} className="absolute right-2 p-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 transition-colors shadow-sm">
              <Send size={16} />
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}