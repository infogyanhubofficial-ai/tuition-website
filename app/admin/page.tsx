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
  Loader2, MessageSquare, ArrowLeft, Upload, Copy
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
  vacancies?: { subject: string; location: string; salary_range: string; contact_name: string; contact_number: string; };
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
  id: string; title: string; category: string; fee: number; discount: number;
  duration: string; cover_pic: string; tutor_name: string; is_active: boolean;
  start_datetime: string; created_at: string;
  class_info?: { google_classroom_link?: string; online_class_link?: string; };
}
interface CourseBatch {
  course_id: string;
  batch_no: number;
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
}
interface Message {
  id: string; user_id: string; sender_role: string; content: string;
  created_at: string; is_read?: boolean;
  profiles?: { full_name: string; avatar_url: string; role: string; };
}
interface Certificate {
  id: string; name: string; email: string; syllabus_name: string;
  syllabus_id: number | null; issue_date: string; certificate_image: string;
  certificate_code: string; created_at: string;
}
interface Order {
  id: string; full_name: string; email: string; contact_number: string;
  order_type: string; order_name: string; price: number; screenshot_url: string;
  status: string; created_at: string;
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

// --- FRAMER MOTION VARIANTS ---
const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } }
};
const staggerItem: Variants = {
  hidden: { opacity: 0, y: 20, scale: 0.98 },
  show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

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
      .on('postgres_changes', { event: '*', schema: 'public', table: 'enrollments' }, () => fetchAllData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => fetchAllData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'course_batches' }, () => fetchAllData())
      .subscribe();
    return () => { supabase.removeChannel(channels); };
  }, [router]);

  const fetchAllData = async () => {
    const [vacRes, appRes, reqRes, curRes, tutRes, msgRes, certRes, sylRes, enrRes, ordRes, batchRes] = await Promise.all([
      supabase.from("vacancies").select("*").order("created_at", { ascending: false }),
      supabase.from("vacancy_applications").select("*, vacancies(subject, location, salary_range, contact_name, contact_number)").order("id", { ascending: false }),
      supabase.from("student_requests").select("*, tutors(name, contact_num, hour_rate, user_id)").order("id", { ascending: false }),
      supabase.from("online_courses").select("*").order("created_at", { ascending: false }),
      supabase.from("tutors").select("*").order("created_at", { ascending: false }),
      supabase.from("messages").select("*").order("created_at", { ascending: false }),
      supabase.from("certificates").select("*").order("created_at", { ascending: false }),
      supabase.from("syllabi").select("id, name"),
      supabase.from("enrollments").select("*").order("created_at", { ascending: false }),
      supabase.from("orders").select("*").order("created_at", { ascending: false }),
      supabase.from("course_batches").select("*").order("batch_no", { ascending: false })
    ]);

    if (vacRes.data) setVacancies(vacRes.data);
    if (appRes.data) setApplications(appRes.data);
    if (reqRes.data) setRequests(reqRes.data);
    if (curRes.data) setCourses(curRes.data);
    if (tutRes.data) setTutors(tutRes.data);
    if (certRes.data) setCertificates(certRes.data);
    if (sylRes.data) setSyllabi(sylRes.data);
    if (enrRes.data) setEnrollments(enrRes.data);
    if (ordRes.data) setOrders(ordRes.data);
    if (batchRes.data) setBatches(batchRes.data);

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
    } else {
      setLoginError("Invalid username or password");
    }
  };

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

  if (loadingAuth) return <div className="min-h-screen flex items-center justify-center bg-slate-900 text-indigo-500"><Loader2 className="animate-spin" size={48} /></div>;

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
          <SidebarBtn icon={<BookOpen size={20}/>} label="Online Courses" active={activeTab === "Online Courses"} onClick={() => setActiveTab("Online Courses")} />
          <SidebarBtn icon={<CalendarDays size={20}/>} label="Bookings" active={activeTab === "Bookings"} onClick={() => setActiveTab("Bookings")} />
          <SidebarBtn icon={<Award size={20}/>} label="Certificates" active={activeTab === "Certificates"} onClick={() => setActiveTab("Certificates")} />
        </nav>
        <div className="p-4 border-t border-slate-800">
          <SidebarBtn icon={<LogOut size={20}/>} label="Lock Screen" color="text-red-400 hover:bg-red-500/10" onClick={() => { setIsLocked(true); setLoginPass(""); setLoginUser(""); }} />
        </div>
      </aside>

      <main className="ml-72 flex-1 p-10 bg-slate-100/50 min-h-screen relative">
        <AnimatePresence mode="wait">
          {activeTab === "Dashboard" && <DashboardView key="dash" conversations={conversations} loading={loadingConversations} onOpenChat={openChat} />}
          {activeTab === "Orders" && <OrdersManager key="ord" data={orders} refresh={fetchAllData} />}
          {activeTab === "Tutors" && <TutorsManager key="tut" data={tutors} refresh={fetchAllData} />}
          {activeTab === "Vacancies" && <VacanciesManager key="vac" data={vacancies} applications={applications} tutors={tutors} refresh={fetchAllData} />}
          {activeTab === "Applications" && <ApplicationsManager key="app" data={applications} tutors={tutors} refresh={fetchAllData} onOpenChat={openChat} />}
          {activeTab === "Tuition Requests" && <RequestsManager key="req" data={requests} refresh={fetchAllData} onOpenChat={openChat} />}
          {activeTab === "Online Courses" && <CoursesManager key="crs" data={courses} batches={batches} refresh={fetchAllData} />}
          {activeTab === "Bookings" && <BookingsManager key="book" courses={courses} enrollments={enrollments} batches={batches} refresh={fetchAllData} />}
          {activeTab === "Certificates" && <CertificatesManager key="cert" data={certificates} syllabi={syllabi} refresh={fetchAllData} />}
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
      {label && <span className={`text-xs font-bold ${checked ? activeText : 'text-slate-500'}`}>{label}</span>}
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
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-end">
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
      <div className="relative">
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
                  <div className="w-14 h-14 rounded-full bg-slate-200 flex items-center justify-center font-black text-slate-500 ml-2 overflow-hidden">
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
function OrdersManager({ data, refresh }: { data: Order[], refresh: () => void }) {
  const supabase = createClient();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'verified' | 'failed'>('all');
  const [orderTypeFilter, setOrderTypeFilter] = useState<'all' | 'recording' | 'course' | 'others'>('all'); 
  const [showAllOrders, setShowAllOrders] = useState(false);

  const filteredData = data.filter((o: Order) => {
    const s = searchQuery.toLowerCase();
    const matchesSearch = (o.full_name && o.full_name.toLowerCase().includes(s)) || 
                          (o.email && o.email.toLowerCase().includes(s)) || 
                          (o.order_name && o.order_name.toLowerCase().includes(s));
    
    const matchesStatus = statusFilter === 'all' ? true : o.status === statusFilter;
    
    let matchesType = true;
    if (orderTypeFilter !== 'all') {
      const lowerType = o.order_type?.toLowerCase() || '';
      if (orderTypeFilter === 'recording') matchesType = lowerType.includes('recording');
      else if (orderTypeFilter === 'course') matchesType = lowerType.includes('course');
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

  const handleStatusChange = async (id: string, newStatus: string) => {
    const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', id);
    if (error) alert("Update failed: " + error.message);
    else refresh();
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this order?")) {
      const { error } = await supabase.from('orders').delete().eq('id', id);
      if (error) alert("Delete failed: " + error.message);
      else refresh();
    }
  };

  const statusColors: any = { pending: 'bg-orange-100 text-orange-700', verified: 'bg-green-100 text-green-700', failed: 'bg-red-100 text-red-700' };

  const getImageUrl = (path: string) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    const { data } = supabase.storage.from('others').getPublicUrl(path);
    return data.publicUrl;
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-black text-slate-900">Orders</h2>
      </div>
      <div className="flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 min-w-[250px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input type="text" placeholder="Search by name, email, or order name..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-12 pr-4 py-4 bg-white rounded-2xl border border-slate-200 shadow-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all font-medium text-slate-700" />
        </div>
        <select className="bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 outline-none shadow-sm cursor-pointer" value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)}>
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="verified">Verified</option>
          <option value="failed">Failed</option>
        </select>
        
        <select className="bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 outline-none shadow-sm cursor-pointer" value={orderTypeFilter} onChange={e => setOrderTypeFilter(e.target.value as any)}>
          <option value="all">All Types</option>
          <option value="recording">Recording</option>
          <option value="course">Course</option>
          <option value="others">Others</option>
        </select>

        <label className="flex items-center gap-2 cursor-pointer text-sm font-bold text-slate-600 bg-white border border-slate-200 px-4 py-3 rounded-2xl shadow-sm">
          <input type="checkbox" checked={showAllOrders} onChange={(e) => setShowAllOrders(e.target.checked)} className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer" />
          Show All Time
        </label>
      </div>
      <div className="bg-white rounded-[30px] shadow-xl border border-slate-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100 text-xs font-black text-slate-400 uppercase tracking-widest">
              <th className="p-6">Date</th><th className="p-6">Customer Details</th><th className="p-6">Order Info</th><th className="p-6">Status</th><th className="p-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map(order => {
              return (
                <tr key={order.id} className="border-b border-slate-50 hover:bg-slate-50/50 cursor-pointer" onClick={() => setSelectedOrder(order)}>
                  <td className="p-6 text-sm text-slate-500 font-bold whitespace-nowrap">{new Date(order.created_at).toLocaleDateString()}</td>
                  <td className="p-6">
                    <p className="font-bold text-slate-900">{order.full_name}</p>
                    <p className="text-xs text-slate-500 mt-1">{order.contact_number} • {order.email}</p>
                  </td>
                  <td className="p-6">
                    <p className="font-bold text-slate-800 flex items-center gap-2">
                      <span className="uppercase text-[10px] tracking-widest bg-slate-100 px-2 py-1 rounded text-slate-500">{order.order_type}</span>
                      Rs. {order.price}
                    </p>
                    <p className="text-xs font-medium text-slate-500 mt-1 truncate max-w-[200px]" title={order.order_name}>
                      Target: {order.order_name}
                    </p>
                  </td>
                  <td className="p-6" onClick={(e) => e.stopPropagation()}>
                    <div className="relative inline-block w-36">
                      <select value={order.status} onChange={(e) => handleStatusChange(order.id, e.target.value)} className={`appearance-none w-full px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider outline-none cursor-pointer border border-transparent hover:border-slate-300 transition-all ${statusColors[order.status] || 'bg-slate-100 text-slate-700'}`}>
                        <option value="pending">PENDING</option>
                        <option value="verified">VERIFIED</option>
                        <option value="failed">FAILED</option>
                      </select>
                      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-50" />
                    </div>
                  </td>
                  <td className="p-6 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-end items-center gap-4">
                      <button onClick={() => handleDelete(order.id)} className="p-2 text-red-600 bg-red-50 rounded-xl hover:bg-red-100 transition-colors" title="Delete Order"><Trash2 size={16} /></button>
                      <span className="text-sm font-bold text-indigo-600 hover:text-indigo-800" onClick={(e) => { e.stopPropagation(); setSelectedOrder(order); }}>View Details</span>
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
            <h3 className="text-2xl font-black mb-6">Order Details</h3>
            
            <div className="grid grid-cols-2 gap-6 mb-6 text-sm font-medium text-slate-700">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase text-slate-400 mb-2">Customer Info</p>
                  <p><span className="font-bold text-slate-800">Name:</span> {selectedOrder.full_name}</p>
                  <p><span className="font-bold text-slate-800">Email:</span> {selectedOrder.email}</p>
                  <p><span className="font-bold text-slate-800">Phone:</span> {selectedOrder.contact_number}</p>
                </div>
                <a href={`https://wa.me/${selectedOrder.contact_number.replace(/\D/g,'')}`} target="_blank" rel="noopener noreferrer" className="mt-4 flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20b858] text-white px-4 py-2 rounded-xl text-xs font-black shadow-sm transition-colors w-full">
                  <MessageCircle size={16} /> Contact via WhatsApp
                </a>
              </div>
              
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2">
                <p className="text-[10px] font-black uppercase text-slate-400 mb-2">Order Info</p>
                <p><span className="font-bold text-slate-800">Type:</span> <span className="uppercase">{selectedOrder.order_type}</span></p>
                <p><span className="font-bold text-slate-800">Order Name:</span> {selectedOrder.order_name}</p>
                <p><span className="font-bold text-slate-800">Price:</span> Rs. {selectedOrder.price}</p>
                <p><span className="font-bold text-slate-800">Date:</span> {new Date(selectedOrder.created_at).toLocaleString()}</p>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col items-center">
              <p className="text-[10px] font-black uppercase text-slate-400 mb-4 w-full">Payment Screenshot</p>
              {selectedOrder.screenshot_url ? (
                <a href={getImageUrl(selectedOrder.screenshot_url)} target="_blank" rel="noreferrer" className="block max-w-full">
                  <img src={getImageUrl(selectedOrder.screenshot_url)} alt="Payment Receipt" className="rounded-lg shadow-sm border border-slate-200 max-h-96 object-contain cursor-zoom-in" />
                </a>
              ) : (
                <p className="text-slate-400 italic">No screenshot provided.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}

// --- SECTION: TUTOR LISTING ---
function TutorsManager({ data, refresh }: { data: Tutor[], refresh: () => void }) {
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
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex justify-between items-end">
        <h2 className="text-3xl font-black text-slate-900">Tutor Listing</h2>
      </div>
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input type="text" placeholder="Search by Tutor Name, Location, or Subjects..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-12 pr-4 py-4 bg-white rounded-2xl border border-slate-200 shadow-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all font-medium text-slate-700" />
      </div>
      <div className="bg-white rounded-[30px] shadow-xl border border-slate-100 overflow-hidden">
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
                    <p className="font-bold text-slate-900">{tutor.name || 'Unknown'}</p>
                    <p className="text-xs text-slate-500 mt-1">{tutor.location || 'No Location'} • {tutor.subject?.length > 0 ? tutor.subject.join(', ') : 'No Subjects'}</p>
                  </div>
                </td>
                <td className="p-6"><ToggleSwitch checked={tutor.verified} onChange={() => toggleBoolean(tutor.id, 'verified', tutor.verified)} label={tutor.verified ? "Verified" : "Unverified"} /></td>
                <td className="p-6"><ToggleSwitch checked={tutor.availability} onChange={() => toggleBoolean(tutor.id, 'availability', tutor.availability)} label={tutor.availability ? "Yes" : "No"} /></td>
                <td className="p-6 text-right">
                  <div className="flex justify-end items-center gap-4">
                    <button onClick={(e) => handleDeleteTutor(tutor.id, e)} className="p-2 text-red-600 bg-red-50 rounded-xl hover:bg-red-100 transition-colors" title="Delete Tutor"><Trash2 size={16} /></button>
                    <span className="text-sm font-bold text-indigo-600 hover:text-indigo-800">View Details</span>
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
              <h3 className="text-2xl font-black">{selectedTutor.name || 'Unknown'}</h3>
            </div>
            <div className="space-y-4 text-sm font-medium text-slate-700">
              <div className="grid grid-cols-2 gap-4">
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
function VacanciesManager({ data, applications, refresh, tutors }: any) {
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
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-black text-slate-900">Vacancies</h2>
        <button onClick={() => { setEditingData({ status: true, urgent: false }); setModalOpen(true); }} className="bg-indigo-600 text-white px-5 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all">
          <Plus size={18} /> Add Vacancy
        </button>
      </div>
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input type="text" placeholder="Search by subject, location, or contact name..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-12 pr-4 py-4 bg-white rounded-2xl border border-slate-200 shadow-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all font-medium text-slate-700" />
      </div>
      <div className="bg-white rounded-[30px] shadow-xl border border-slate-100 overflow-hidden">
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
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100"><p className="text-[10px] font-black uppercase text-slate-400 mb-1">Contact Name</p><p className="font-bold text-slate-800">{viewVacancy.contact_name || '-'}</p></div>
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
                      const matchedTutor = tutors?.find((t: any) => t.user_id === app.user_id);
                      const tutorLink = matchedTutor ? `/tutors/${matchedTutor.id}` : '#';
                      return (
                        <div key={app.id} className={`flex justify-between items-center p-4 rounded-2xl border ${app.status === 'accepted' ? 'bg-green-50 border-green-200' : app.status === 'rejected' ? 'bg-red-50 border-red-200' : 'bg-white border-slate-200 shadow-sm'}`}>
                          <div>
                            <a href={tutorLink} target="_blank" className="font-bold text-base text-indigo-600 hover:underline flex items-center gap-1">{app.applicant_name} <ExternalLink size={14} /></a>
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
              <div className="grid grid-cols-2 gap-4">
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
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <h2 className="text-3xl font-black text-slate-900">Applications</h2>
      <div className="bg-white rounded-[30px] shadow-xl border border-slate-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100 text-xs font-black text-slate-400 uppercase tracking-widest">
              <th className="p-6">Applicant (Tutor)</th><th className="p-6">Contact Info</th><th className="p-6">Applied For</th><th className="p-6">Vacancy Poster (Student)</th><th className="p-6">Student Response</th><th className="p-6 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item: VacancyApplication) => {
              const matchedTutor = tutors?.find((t: any) => t.user_id === item.user_id);
              const tutorLink = matchedTutor ? `/tutors/${matchedTutor.id}` : '#';
              return (
                <tr key={item.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                  <td className="p-6"><a href={tutorLink} target="_blank" className="font-bold text-indigo-600 hover:underline text-base flex items-center gap-1">{item.applicant_name} <ExternalLink size={14} /></a></td>
                  <td className="p-6"><p className="text-sm font-bold text-slate-700">{item.applicant_phone}</p><p className="text-xs font-medium text-slate-400 truncate max-w-[150px]">{item.applicant_email}</p></td>
                  <td className="p-6"><span onClick={() => window.open(`/vacancies/${item.vacancy_id}`, '_blank')} className="cursor-pointer text-sm text-slate-700 font-bold hover:text-indigo-600 hover:underline transition-colors flex items-center gap-1">{item.vacancies?.subject}</span></td>
                  <td className="p-6"><p className="text-sm font-bold text-slate-700">{item.vacancies?.contact_name || 'N/A'}</p><p className="text-xs font-medium text-slate-400">{item.vacancies?.contact_number || 'N/A'}</p></td>
                  <td className="p-6">
                    <div className="flex items-center gap-2">
                      <div className="relative inline-block w-36">
                        <select value={item.status} onChange={(e) => handleStatusChange(item.id, e.target.value)} className={`appearance-none w-full px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider outline-none cursor-pointer border border-transparent hover:border-slate-300 transition-all ${statusColors[item.status] || 'bg-slate-100 text-slate-700'}`}>
                          <option value="pending">PENDING</option><option value="accepted">ACCEPTED</option><option value="rejected">REJECTED</option>
                        </select>
                        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-50" />
                      </div>
                      {item.user_id && <button onClick={() => onOpenChat(item.user_id as any)} className="p-2 text-indigo-600 bg-indigo-50 rounded-xl hover:bg-indigo-100 transition-colors" title="Chat with Tutor"><MessageSquare size={16} /></button>}
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
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <h2 className="text-3xl font-black text-slate-900">Tuition Requests</h2>
      <div className="bg-white rounded-[30px] shadow-xl border border-slate-100 overflow-hidden">
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
                  <p className="font-bold text-indigo-600 hover:underline text-lg transition-colors inline-block" onClick={(e) => { e.stopPropagation(); if (item.user_id) onOpenChat(item.user_id); }} title="Chat with Student">{item.student_name}</p>
                  <p className="text-sm text-slate-500 mt-1">{item.phone}</p>
                </td>
                <td className="p-6">
                  {item.tutors ? (
                    <div>
                      <p className="font-bold text-indigo-600 hover:underline text-base transition-colors inline-block" onClick={(e) => { e.stopPropagation(); if (item.tutors?.user_id) onOpenChat(item.tutors.user_id); }} title="Chat with Tutor">{item.tutors.name}</p>
                      <p className="text-sm text-slate-500 mt-0.5">{item.tutors.contact_num} • Rs. {item.tutors.hour_rate}/hr</p>
                    </div>
                  ) : <p className="text-sm text-slate-400 italic">No specific tutor</p>}
                </td>
                <td className="p-6" onClick={(e) => e.stopPropagation()}>
                  <div className="relative inline-block w-36">
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

// --- SECTION: BOOKINGS ---
// --- SECTION: BOOKINGS ---
function BookingsManager({ courses, enrollments, batches, refresh }: { courses: OnlineCourse[], enrollments: Enrollment[], batches: CourseBatch[], refresh: () => void }) {
  const supabase = createClient();
  const [selectedCourse, setSelectedCourse] = useState<OnlineCourse | null>(null);
  const [selectedBatch, setSelectedBatch] = useState<number | 'unassigned' | null>(null);
  const [dateSort, setDateSort] = useState<'desc' | 'asc'>('desc');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'confirmed'>('all');
  const [searchQuery, setSearchQuery] = useState(""); // <-- NEW: Search state
  
  // Payment Editing State
  const [editingPayment, setEditingPayment] = useState<Enrollment | null>(null);
  const [editPaid, setEditPaid] = useState<number>(0);
  const [editRemaining, setEditRemaining] = useState<number>(0);
  
  // Add hidden enrollments state
  const [hiddenBookingIds, setHiddenBookingIds] = useState<Set<string>>(new Set());

  // PAGINATION STATE
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 20;

  // 🔥 FIX: Pagination Logic moved to the top level, before any early returns
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCourse, selectedBatch, dateSort, statusFilter, hiddenBookingIds, searchQuery]); // <-- NEW: Added searchQuery to dependencies

  const toggleConfirmation = async (enrollmentId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase.from('enrollments').update({ confirmed: !currentStatus }).eq('id', enrollmentId);
      if (error) { alert(`Could not update booking: ${error.message}`); return; }
      refresh();
    } catch (err) { alert("An unexpected error occurred while updating."); }
  };

  const openPaymentEdit = (enr: Enrollment) => {
    setEditingPayment(enr);
    setEditPaid(enr.paid_amount || 0);
    setEditRemaining(enr.remaining_amount || 0);
  };

  const savePayment = async () => {
    if (!editingPayment) return;
    const { error } = await supabase.from('enrollments').update({
      paid_amount: editPaid,
      remaining_amount: editRemaining
    }).eq('id', editingPayment.id);
    
    if (error) {
      alert("Failed to update payment: " + error.message);
    } else {
      refresh();
      setEditingPayment(null);
    }
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

  // STEP 1: SHOW COURSES LIST
  if (!selectedCourse) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900">Course Bookings</h2>
          <p className="text-slate-500 font-medium mt-1">Select an online course to view its batches and enrollments.</p>
        </div>
        
        <div className="flex flex-col gap-4">
          {courses.map(course => {
            const bookingCount = enrollments.filter(e => e.course_id === course.id).length;
            return (
              <div key={course.id} onClick={() => setSelectedCourse(course)} className="flex items-center justify-between p-5 bg-white border border-slate-200 rounded-2xl hover:border-indigo-400 hover:shadow-md cursor-pointer transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
                    <BookOpen size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base line-clamp-1">{course.title}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Starts: {course.start_datetime ? new Date(course.start_datetime).toLocaleDateString() : 'TBA'}</p>
                  </div>
                </div>
                <div className="text-right pl-4">
                  <p className="text-xl font-black text-indigo-600">{bookingCount}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Bookings</p>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>
    );
  }

  // STEP 2: SHOW BATCHES LIST FOR SELECTED COURSE
  if (selectedCourse && selectedBatch === null) {
    // Collect all available batches for the selected course
    const availableBatches = Array.from(new Set([
      ...batches.filter(b => b.course_id === selectedCourse.id).map(b => b.batch_no),
      ...enrollments.filter(e => e.course_id === selectedCourse.id && e.batch_no).map(e => e.batch_no as number)
    ])).sort((a, b) => b - a); // Highest first

    const unassignedCount = enrollments.filter(e => e.course_id === selectedCourse.id && !e.batch_no).length;

    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
        <div className="flex items-center gap-4">
          <button onClick={() => setSelectedCourse(null)} className="p-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm"><ArrowLeft size={20} className="text-slate-600" /></button>
          <div>
            <h2 className="text-2xl font-black text-slate-900">{selectedCourse.title}</h2>
            <p className="text-sm font-medium text-slate-500">Select a Batch to view its enrollments</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          {availableBatches.map(b => {
            const batchCount = enrollments.filter(e => e.course_id === selectedCourse.id && e.batch_no === b).length;
            return (
              <div key={b} onClick={() => setSelectedBatch(b)} className="flex items-center justify-between p-5 bg-white border border-slate-200 rounded-2xl hover:border-emerald-400 hover:shadow-md cursor-pointer transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center font-black text-xl">
                    {b}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-lg">Batch {b}</h3>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black text-emerald-600">{batchCount}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Enrollments</p>
                </div>
              </div>
            );
          })}

          {unassignedCount > 0 && (
             <div onClick={() => setSelectedBatch('unassigned')} className="flex items-center justify-between p-5 bg-white border border-slate-200 rounded-2xl hover:border-orange-400 hover:shadow-md cursor-pointer transition-all">
               <div className="flex items-center gap-4">
                 <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center font-black text-xl">
                   ?
                 </div>
                 <div>
                   <h3 className="font-bold text-slate-900 text-lg">Unassigned</h3>
                 </div>
               </div>
               <div className="text-right">
                 <p className="text-2xl font-black text-orange-600">{unassignedCount}</p>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Enrollments</p>
               </div>
             </div>
          )}
        </div>
      </motion.div>
    );
  }

  // STEP 3: SHOW ENROLLMENTS FOR SELECTED BATCH
  // Filter enrollments by course, chosen batch, search query, and hidden filter
  let courseEnrollments = enrollments.filter(e => {
    if (e.course_id !== selectedCourse.id) return false;
    if (hiddenBookingIds.has(e.id)) return false;
    
    // Batch Check
    if (selectedBatch === 'unassigned' && e.batch_no) return false;
    if (selectedBatch !== 'unassigned' && e.batch_no !== selectedBatch) return false;

    // <-- NEW: Search logic check -->
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

  const totalPages = Math.ceil(courseEnrollments.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedEnrollments = courseEnrollments.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handleCopyCSV = () => {
    const header = "Name,Phone,Email\n";
    const rows = courseEnrollments.map(e => `"${e.full_name}","${e.whatsapp_number}","${e.email}"`).join("\n");
    navigator.clipboard.writeText(header + rows).then(() => {
      alert("Copied to clipboard!");
    });
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      
      {/* <-- NEW: Redesigned Header & Search Bar --> */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => setSelectedBatch(null)} className="p-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm"><ArrowLeft size={20} className="text-slate-600" /></button>
            <div>
              <h2 className="text-2xl font-black text-slate-900">{selectedCourse.title}</h2>
              <p className="text-sm font-medium text-slate-500">
                {selectedBatch === 'unassigned' ? 'Unassigned Enrollments' : `Batch ${selectedBatch} Enrollments`}
              </p>
            </div>
          </div>
          {hiddenBookingIds.size > 0 && (
            <button onClick={handleUnhideAll} className="px-4 py-3 bg-blue-50 text-blue-600 rounded-xl text-sm font-bold hover:bg-blue-100 transition-colors flex items-center gap-2 shadow-sm">
              <Eye size={16} /> Unhide All ({hiddenBookingIds.size})
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-4 items-center">
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

      {/* STATS AND EXPORT BAR */}
      <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-4">
        <span className="text-sm font-black text-slate-600">Showing {courseEnrollments.length} Booking(s)</span>
        <button onClick={handleCopyCSV} className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-slate-700 transition-colors shadow-sm">
          <Copy size={14} /> Copy CSV List
        </button>
      </div>

      {/* COMPACT NO-SCROLL TABLE WITH PAGINATION */}
      <div className="bg-white rounded-[30px] shadow-xl border border-slate-100 overflow-hidden w-full flex flex-col">
        <div className="overflow-x-auto overflow-y-auto max-h-[600px]">
          <table className="w-full text-left border-collapse table-auto">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <th className="p-4 w-[25%]">Applicant Details</th>
                <th className="p-4 w-[15%]">Date</th>
                <th className="p-4 w-[30%]">Remarks</th>
                <th className="p-4 w-[12%]">Payment</th>
                <th className="p-4 w-[10%]">Confirmed</th>
                <th className="p-4 text-right w-[8%]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedEnrollments.map(enr => (
                <tr key={enr.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                  <td className="p-4 align-top">
                    <p className="font-bold text-slate-900 leading-tight">{enr.full_name}</p>
                    <p className="text-xs text-slate-500 mt-1 truncate" title={enr.email}>{enr.email}</p>
                    <p className="text-xs text-slate-500 mt-0.5 font-medium">WA: {enr.whatsapp_number}</p>
                  </td>
                  <td className="p-4 align-top text-sm text-slate-500 font-medium">
                    {new Date(enr.created_at).toLocaleDateString()}
                  </td>
                  <td className="p-4 align-top">
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-sm text-slate-700 whitespace-pre-wrap break-words h-auto min-w-[200px]">
                        {enr.remarks || <span className="italic text-slate-400">No remarks provided.</span>}
                    </div>
                  </td>
                  <td className="p-4 align-top whitespace-nowrap">
                    <p className="text-sm font-bold text-slate-800">Paid: Rs.{enr.paid_amount || 0}</p>
                    <p className="text-xs font-bold text-red-500 mt-0.5">Due: Rs.{enr.remaining_amount || 0}</p>
                  </td>
                  <td className="p-4 align-top">
                    <ToggleSwitch checked={!!enr.confirmed} onChange={() => toggleConfirmation(enr.id, !!enr.confirmed)} label={enr.confirmed ? 'Yes' : 'No'} activeColor="bg-green-500" activeText="text-green-600" />
                  </td>
                  <td className="p-4 align-top text-right">
                    <div className="flex justify-end gap-1 flex-wrap">
                      <button onClick={() => openPaymentEdit(enr)} className="p-1.5 text-emerald-600 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors" title="Edit Payment"><DollarSign size={16} /></button>
                      <button onClick={() => handleHide(enr.id)} className="p-1.5 text-slate-500 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors" title="Hide"><EyeOff size={16} /></button>
                      <button onClick={async () => { if (confirm('Remove this enrollment?')) { const { error } = await supabase.from('enrollments').delete().eq('id', enr.id); if (error) alert(error.message); else refresh(); } }} className="p-1.5 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors" title="Delete"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {paginatedEnrollments.length === 0 && <tr><td colSpan={6} className="p-10 text-center text-slate-500">No matching enrollments found.</td></tr>}
            </tbody>
          </table>
        </div>

        {/* PAGINATION FOOTER */}
        {courseEnrollments.length > 0 && (
          <div className="flex items-center justify-between p-6 border-t border-slate-100 bg-slate-50 shrink-0">
            <span className="text-sm font-medium text-slate-500">
              Showing {startIndex + 1} to {Math.min(startIndex + ITEMS_PER_PAGE, courseEnrollments.length)} of {courseEnrollments.length} entries
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

      {/* PAYMENT EDIT MODAL */}
      {editingPayment && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm" onClick={() => setEditingPayment(null)}>
          <div className="bg-white rounded-[30px] shadow-2xl p-8 max-w-sm w-full relative" onClick={e => e.stopPropagation()}>
            <button onClick={() => setEditingPayment(null)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-800"><X /></button>
            <h3 className="text-xl font-black mb-1">Edit Payment</h3>
            <p className="text-xs font-medium text-slate-500 mb-6">{editingPayment.full_name}</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Paid Amount (Rs)</label>
                <input type="number" value={editPaid} onChange={(e) => setEditPaid(Number(e.target.value))} className="w-full bg-slate-50 p-3 rounded-xl outline-none border border-slate-200 focus:border-indigo-500 font-bold text-slate-800 transition-colors" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Remaining Amount (Rs)</label>
                <input type="number" value={editRemaining} onChange={(e) => setEditRemaining(Number(e.target.value))} className="w-full bg-slate-50 p-3 rounded-xl outline-none border border-slate-200 focus:border-indigo-500 font-bold text-slate-800 transition-colors" />
              </div>
            </div>
            
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setEditingPayment(null)} className="px-4 py-2 font-bold text-slate-500 hover:text-slate-800 transition-colors">Cancel</button>
              <button onClick={savePayment} className="px-6 py-2 rounded-xl font-black bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-colors">Save</button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}

// --- SECTION: COURSES ---
function CoursesManager({ data, batches, refresh }: { data: OnlineCourse[], batches: CourseBatch[], refresh: () => void }) {
  const supabase = createClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Partial<OnlineCourse> | null>(null);
  const [editBatch, setEditBatch] = useState<Partial<CourseBatch>>({});

  const openEdit = (course: OnlineCourse) => {
    setEditingCourse({ ...course });
    // Pull course batches and pick highest batch_no for editing
    const courseBatches = batches.filter(b => b.course_id === course.id).sort((a,b) => b.batch_no - a.batch_no);
    if (courseBatches.length > 0) {
      setEditBatch({ ...courseBatches[0] });
    } else {
      setEditBatch({ batch_no: 1, is_active: true });
    }
    setModalOpen(true);
  };

  const saveCourse = async () => {
    if (!editingCourse) return;
    const payload = { ...editingCourse };
    payload.fee = parseFloat(payload.fee as any) || 0;
    payload.discount = parseFloat(payload.discount as any) || 0;
    
    // Legacy cleanup - keeping it structurally fine if using pure table mapping
    delete payload.class_info;

    let savedCourseId = editingCourse.id;

    // 1. Save Online Course Data
    if (payload.id) { 
      const { error } = await supabase.from('online_courses').update(payload).eq('id', payload.id); 
      if (error) { alert(error.message); return; }
    } else { 
      const { data: inserted, error } = await supabase.from('online_courses').insert([payload]).select('id').single(); 
      if (error) { alert(error.message); return; }
      savedCourseId = inserted.id;
    }

    // 2. Save Batch Data
    if (savedCourseId && editBatch.batch_no) {
      const exists = batches.find(b => b.course_id === savedCourseId && b.batch_no === editBatch.batch_no);
      
      const batchPayload = {
        course_id: savedCourseId,
        batch_no: editBatch.batch_no,
        online_class_link: editBatch.online_class_link || null,
        google_classroom_link: editBatch.google_classroom_link || null,
        whatsapp_group_link: editBatch.whatsapp_group_link || null,
        is_active: editBatch.is_active ?? true
      };

      if (exists) {
        const { error: bErr } = await supabase.from('course_batches')
          .update(batchPayload)
          .eq('course_id', savedCourseId)
          .eq('batch_no', editBatch.batch_no);
        if (bErr) alert("Batch Update Error: " + bErr.message);
      } else {
        const { error: bErr } = await supabase.from('course_batches')
          .insert([batchPayload]);
        if (bErr) alert("Batch Create Error: " + bErr.message);
      }
    }

    setModalOpen(false); 
    refresh();
  };

  const toggleCourseStatus = async (course: OnlineCourse) => {
    const { error } = await supabase.from('online_courses').update({ is_active: !course.is_active }).eq('id', course.id);
    if (error) alert(error.message); else refresh();
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex justify-between items-center"><h2 className="text-3xl font-black text-slate-900">Online Courses</h2></div>
      <div className="bg-white rounded-[30px] shadow-xl border border-slate-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100 text-xs font-black text-slate-400 uppercase tracking-widest">
              <th className="p-6">Course Title</th><th className="p-6">Pricing & Details</th><th className="p-6">Status</th><th className="p-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.map(course => (
              <tr key={course.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                <td className="p-6 flex items-center gap-4">
                  <img src={course.cover_pic || 'https://via.placeholder.com/50'} className="w-12 h-12 rounded-xl object-cover" alt="" />
                  <div><p className="font-bold text-slate-900 text-lg">{course.title}</p><p className="text-sm text-slate-500">Starts: {course.start_datetime ? new Date(course.start_datetime).toLocaleDateString() : 'N/A'}</p></div>
                </td>
                <td className="p-6"><p className="font-bold text-slate-800">Rs. {course.fee}</p>{course.discount > 0 && <p className="text-xs text-green-600 font-bold">{course.discount}% OFF</p>}</td>
                <td className="p-6"><ToggleSwitch checked={course.is_active} onChange={() => toggleCourseStatus(course)} label={course.is_active ? 'Active' : 'Draft'} /></td>
                <td className="p-6 text-right">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => openEdit(course)} className="p-2 text-indigo-600 bg-indigo-50 rounded-xl hover:bg-indigo-100" title="Edit Pricing"><Edit2 size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {modalOpen && editingCourse && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm" onClick={() => setModalOpen(false)}>
          <div className="bg-white rounded-[30px] shadow-2xl max-w-md w-full relative overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            {editingCourse.id && <p className="font-mono text-[10px] text-slate-400 absolute top-4 left-6">ID: {editingCourse.id}</p>}
            <button onClick={() => setModalOpen(false)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-800 z-10"><X /></button>
            <div className="p-6 border-b border-slate-100 bg-slate-50 mt-4"><h3 className="text-2xl font-black text-slate-900">Edit Course Config</h3><p className="text-sm text-slate-500 font-medium mt-1">{editingCourse.title}</p></div>
            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto no-scrollbar">
              <div><label className="block text-[10px] font-black text-slate-400 uppercase mb-1 ml-1">Fee (Rs)</label><input type="number" className="w-full bg-slate-50 p-3.5 rounded-xl outline-none border border-slate-200 focus:border-indigo-500 font-bold text-slate-800 text-sm" value={editingCourse.fee || ''} onChange={e => setEditingCourse({ ...editingCourse, fee: e.target.value as any })} /></div>
              <div><label className="block text-[10px] font-black text-slate-400 uppercase mb-1 ml-1">Discount (%)</label><input type="number" className="w-full bg-slate-50 p-3.5 rounded-xl outline-none border border-slate-200 focus:border-indigo-500 font-bold text-slate-800 text-sm" value={editingCourse.discount || ''} onChange={e => setEditingCourse({ ...editingCourse, discount: e.target.value as any })} /></div>
              <div><label className="block text-[10px] font-black text-slate-400 uppercase mb-1 ml-1">Start Date/Time</label><input type="datetime-local" className="w-full bg-slate-50 p-3.5 rounded-xl outline-none border border-slate-200 focus:border-indigo-500 font-bold text-slate-800 text-sm" value={editingCourse.start_datetime ? new Date(new Date(editingCourse.start_datetime).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ''} onChange={e => setEditingCourse({ ...editingCourse, start_datetime: new Date(e.target.value).toISOString() })} /></div>
              
              <hr className="border-slate-200 my-4" />
              
              <div className="bg-slate-100 p-4 rounded-xl border border-slate-200">
                <div className="flex justify-between items-center mb-3">
                  <label className="block text-[10px] font-black text-slate-500 uppercase ml-1">Batch Management</label>
                  <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded font-bold">Latest Default</span>
                </div>
                
                <div className="mb-3">
                  <label className="block text-[10px] font-bold text-slate-500 mb-1 ml-1">Target Batch No. (Increment to create new batch)</label>
                  <input type="number" className="w-full bg-white p-3 rounded-xl outline-none border border-slate-200 focus:border-indigo-500 font-black text-slate-800 text-sm" value={editBatch.batch_no || 1} onChange={e => setEditBatch({ ...editBatch, batch_no: Number(e.target.value) })} />
                </div>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1 ml-1">Google Classroom Link</label>
                    <input 
                      type="text" 
                      className="w-full bg-white p-3 rounded-xl outline-none border border-slate-200 focus:border-indigo-500 font-medium text-slate-800 text-sm" 
                      value={editBatch.google_classroom_link || ''} 
                      onChange={e => setEditBatch({ ...editBatch, google_classroom_link: e.target.value })} 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1 ml-1">Online Class Link</label>
                    <input 
                      type="text" 
                      className="w-full bg-white p-3 rounded-xl outline-none border border-slate-200 focus:border-indigo-500 font-medium text-slate-800 text-sm" 
                      value={editBatch.online_class_link || ''} 
                      onChange={e => setEditBatch({ ...editBatch, online_class_link: e.target.value })} 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1 ml-1">WhatsApp Group Link</label>
                    <input 
                      type="text" 
                      className="w-full bg-white p-3 rounded-xl outline-none border border-slate-200 focus:border-indigo-500 font-medium text-slate-800 text-sm" 
                      value={editBatch.whatsapp_group_link || ''} 
                      onChange={e => setEditBatch({ ...editBatch, whatsapp_group_link: e.target.value })} 
                    />
                  </div>
                </div>
              </div>

            </div>
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 shrink-0">
              <button onClick={() => setModalOpen(false)} className="px-6 py-3 font-bold text-slate-500 hover:text-slate-800">Cancel</button>
              <button onClick={saveCourse} className="px-8 py-3 rounded-2xl font-black bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-colors">Save</button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}

// --- SECTION: CERTIFICATES ---
function CertificatesManager({ data, syllabi, refresh }: { data: Certificate[], syllabi: any[], refresh: () => void }) {
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

  // 🔥 FIX: Pagination Logic moved to the top level 
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
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-black text-slate-900">Certificate Registry</h2>
        <button
          onClick={() => router.push('/admin/bulk-upload')}
          className="bg-indigo-600 text-white px-5 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all"
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

      <div className="bg-white rounded-[30px] shadow-xl border border-slate-100 overflow-hidden flex flex-col">
        <div className="overflow-x-auto overflow-y-auto max-h-[600px]">
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
                    <p className="font-bold text-slate-900">{cert.name}</p>
                    <p className="text-sm text-slate-500 mt-1">{cert.email}</p>
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
          <div className="flex items-center justify-between p-6 border-t border-slate-100 bg-slate-50 shrink-0">
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
      // Fetch user messages
      const { data } = await supabase.from("messages").select("*").eq("user_id", userId).order("created_at", { ascending: true });
      if (data) setMessages(data);
    };

    fetchMessages();

    // Listen for realtime chat updates
    const channel = supabase.channel(`chat_updates_${userId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `user_id=eq.${userId}` }, (payload) => {
         setMessages(prev => {
           // Prevent duplicate if we already added it via handleSend
           if (prev.some(msg => msg.id === payload.new.id)) return prev;
           return [...prev, payload.new as Message];
         });
      }).subscribe();
      
    return () => { supabase.removeChannel(channel); };
  }, [userId]); // Removed refreshData to prevent constant re-subscriptions

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    
    // Completely removed `is_read` from payload to fix the schema crash
    const msgPayload = { user_id: userId, sender_role: 'admin', content: newMessage.trim() };
    
    // Added .select().single() to return the inserted row instantly
    const { data, error } = await supabase.from("messages").insert([msgPayload]).select().single();
    
    if (!error && data) {
      setNewMessage("");
      // Optimistic update
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