"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard, Briefcase, FileText, MessageSquare, BookOpen, LogOut,
  Plus, Trash2, Edit2, X, Send, Loader2, MapPin, ExternalLink, ChevronDown,
  Search, Users, ChevronRight, User, Award, Upload, CalendarDays, ArrowLeft,
  Lock, ShoppingCart
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";

// --- TYPES ---
interface Vacancy {
  id: number; subject: string; location: string; class_level: string;
  description: string; salary_range: string; tuition_type: string;
  student_gender_pref: string; class_time: string; days_a_week: string;
  contact_number: string; contact_name: string; status: boolean; urgent: boolean;
  user_id?: string; created_at: string;
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
}
interface Enrollment {
  id: string; user_id: string; course_id: string; full_name: string; email: string;
  whatsapp_number: string; remarks: string; status: string; created_at: string;
  course_name: string; course_details_url: string; locked_price: number;
  starting_date: string; confirmed: boolean;
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
  order_type: string; tutor_name: string; price: number; screenshot_url: string;
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
      .subscribe();
    return () => { supabase.removeChannel(channels); };
  }, [router]);

  const fetchAllData = async () => {
    const [vacRes, appRes, reqRes, curRes, tutRes, msgRes, certRes, sylRes, enrRes, ordRes] = await Promise.all([
      supabase.from("vacancies").select("*").order("created_at", { ascending: false }),
      supabase.from("vacancy_applications").select("*, vacancies(subject, location, salary_range, contact_name, contact_number)").order("id", { ascending: false }),
      supabase.from("student_requests").select("*, tutors(name, contact_num, hour_rate, user_id)").order("id", { ascending: false }),
      supabase.from("online-courses").select("*").order("created_at", { ascending: false }),
      supabase.from("tutors").select("*").order("created_at", { ascending: false }),
      supabase.from("messages").select("*").order("created_at", { ascending: false }),
      supabase.from("certificates").select("*").order("created_at", { ascending: false }),
      supabase.from("syllabi").select("id, name"),
      supabase.from("enrollments").select("*").order("created_at", { ascending: false }),
      supabase.from("orders").select("*").order("created_at", { ascending: false })
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
          {activeTab === "Online Courses" && <CoursesManager key="crs" data={courses} refresh={fetchAllData} />}
          {activeTab === "Bookings" && <BookingsManager key="book" courses={courses} enrollments={enrollments} refresh={fetchAllData} />}
          {activeTab === "Certificates" && <CertificatesManager key="cert" data={certificates} syllabi={syllabi} refresh={fetchAllData} />}
        </AnimatePresence>

        <AnimatePresence>
          {chatOpen && activeUser && (
            <ChatModal
              userId={activeUser}
              onClose={() => setChatOpen(false)}
              tutors={tutors}
              vacancies={vacancies}
              applications={applications}
              requests={requests}
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

  const filteredData = data.filter((o: Order) => {
    const s = searchQuery.toLowerCase();
    const matchesSearch = (o.full_name && o.full_name.toLowerCase().includes(s)) || (o.email && o.email.toLowerCase().includes(s)) || (o.tutor_name && o.tutor_name.toLowerCase().includes(s));
    const matchesStatus = statusFilter === 'all' ? true : o.status === statusFilter;
    return matchesSearch && matchesStatus;
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
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input type="text" placeholder="Search by name, email, or target..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-12 pr-4 py-4 bg-white rounded-2xl border border-slate-200 shadow-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all font-medium text-slate-700" />
        </div>
        <select className="bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 outline-none shadow-sm cursor-pointer" value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)}>
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="verified">Verified</option>
          <option value="failed">Failed</option>
        </select>
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
              const isCourse = order.order_type.toLowerCase().includes('course');
              return (
                <tr key={order.id} className="border-b border-slate-50 hover:bg-slate-50/50 cursor-pointer" onClick={() => setSelectedOrder(order)}>
                  <td className="p-6 text-sm text-slate-500 font-bold whitespace-nowrap">{new Date(order.created_at).toLocaleDateString()}</td>
                  <td className="p-6">
                    <p className="font-bold text-slate-900">{order.full_name}</p>
                    <p className="text-xs text-slate-500 mt-1">{order.contact_number} • {order.email}</p>
                  </td>
                  <td className="p-6">
                    <p className="font-bold text-slate-800 flex items-center gap-2">
                      <span className="uppercase text-[10px] tracking-widest bg-slate-100 px-2 py-1 rounded text-slate-500">{isCourse ? 'COURSE' : order.order_type}</span>
                      Rs. {order.price}
                    </p>
                    <p className="text-xs font-medium text-slate-500 mt-1 truncate max-w-[200px]" title={order.tutor_name}>
                      {isCourse ? `Course: ${order.tutor_name} | Target: GyanHub Online Courses` : `Target: ${order.tutor_name}`}
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
                      <span className="text-sm font-bold text-indigo-600 hover:text-indigo-800" onClick={(e) => { e.stopPropagation(); setSelectedOrder(order); }}>View Receipt</span>
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
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2">
                <p className="text-[10px] font-black uppercase text-slate-400">Customer Info</p>
                <p><span className="font-bold">Name:</span> {selectedOrder.full_name}</p>
                <p><span className="font-bold">Email:</span> {selectedOrder.email}</p>
                <p><span className="font-bold">Phone:</span> {selectedOrder.contact_number}</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2">
                <p className="text-[10px] font-black uppercase text-slate-400">Order Info</p>
                {selectedOrder.order_type.toLowerCase().includes('course') ? (
                  <>
                    <p><span className="font-bold">Course:</span> <span className="uppercase">{selectedOrder.tutor_name}</span></p>
                    <p><span className="font-bold">Target:</span> GyanHub Online Courses</p>
                  </>
                ) : (
                  <>
                    <p><span className="font-bold">Type:</span> <span className="uppercase">{selectedOrder.order_type}</span></p>
                    <p><span className="font-bold">Target:</span> {selectedOrder.tutor_name}</p>
                  </>
                )}
                <p><span className="font-bold">Price:</span> Rs. {selectedOrder.price}</p>
                <p><span className="font-bold">Date:</span> {new Date(selectedOrder.created_at).toLocaleString()}</p>
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
function BookingsManager({ courses, enrollments, refresh }: { courses: OnlineCourse[], enrollments: Enrollment[], refresh: () => void }) {
  const supabase = createClient();
  const [selectedCourse, setSelectedCourse] = useState<OnlineCourse | null>(null);
  const [dateSort, setDateSort] = useState<'desc' | 'asc'>('desc');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'confirmed'>('all');

  const toggleConfirmation = async (enrollmentId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase.from('enrollments').update({ confirmed: !currentStatus }).eq('id', enrollmentId);
      if (error) { alert(`Could not update booking: ${error.message}`); return; }
      refresh();
    } catch (err) { alert("An unexpected error occurred while updating."); }
  };

  if (selectedCourse) {
    let courseEnrollments = enrollments.filter(e => e.course_id === selectedCourse.id);
    if (statusFilter === 'confirmed') courseEnrollments = courseEnrollments.filter(e => e.confirmed);
    if (statusFilter === 'pending') courseEnrollments = courseEnrollments.filter(e => !e.confirmed);
    courseEnrollments.sort((a, b) => {
      const timeA = new Date(a.created_at).getTime(); const timeB = new Date(b.created_at).getTime();
      return dateSort === 'desc' ? timeB - timeA : timeA - timeB;
    });
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => setSelectedCourse(null)} className="p-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm"><ArrowLeft size={20} className="text-slate-600" /></button>
            <div><h2 className="text-2xl font-black text-slate-900">{selectedCourse.title}</h2><p className="text-sm font-medium text-slate-500">Managing Enrollments</p></div>
          </div>
          <div className="flex gap-4 items-center">
            <select className="bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none shadow-sm cursor-pointer" value={dateSort} onChange={e => setDateSort(e.target.value as 'desc' | 'asc')}>
              <option value="desc">Date: Newest First</option><option value="asc">Date: Oldest First</option>
            </select>
            <select className="bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none shadow-sm cursor-pointer" value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)}>
              <option value="all">Status: All</option><option value="pending">Status: Pending Only</option><option value="confirmed">Status: Confirmed Only</option>
            </select>
          </div>
        </div>
        <div className="bg-white rounded-[30px] shadow-xl border border-slate-100 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-xs font-black text-slate-400 uppercase tracking-widest">
                <th className="p-6">Applicant Name</th><th className="p-6">Contact Details</th><th className="p-6">Booking Date</th><th className="p-6">Remarks</th><th className="p-6">Confirmed</th><th className="p-6 text-right">Delete</th>
              </tr>
            </thead>
            <tbody>
              {courseEnrollments.map(enr => (
                <tr key={enr.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                  <td className="p-6 font-bold text-slate-900">{enr.full_name}</td>
                  <td className="p-6"><p className="text-sm text-slate-800 font-medium">{enr.email}</p><p className="text-xs text-slate-500 mt-1">WA: {enr.whatsapp_number}</p></td>
                  <td className="p-6 text-sm text-slate-500 font-medium">{new Date(enr.created_at).toLocaleDateString()}</td>
                  <td className="p-6 text-sm text-slate-600 max-w-[150px] truncate" title={enr.remarks}>{enr.remarks || '-'}</td>
                  <td className="p-6"><ToggleSwitch checked={!!enr.confirmed} onChange={() => toggleConfirmation(enr.id, !!enr.confirmed)} label={enr.confirmed ? 'Confirmed' : 'Pending'} activeColor="bg-green-500" activeText="text-green-600" /></td>
                  <td className="p-6 text-right">
                    <button onClick={async () => { if (confirm('Remove this enrollment?')) { const { error } = await supabase.from('enrollments').delete().eq('id', enr.id); if (error) alert(error.message); else refresh(); } }} className="p-2 text-red-600 bg-red-50 rounded-xl hover:bg-red-100 transition-colors"><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
              {courseEnrollments.length === 0 && <tr><td colSpan={6} className="p-10 text-center text-slate-500">No matching enrollments found.</td></tr>}
            </tbody>
          </table>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex justify-between items-center">
        <div><h2 className="text-3xl font-black text-slate-900">Course Bookings</h2><p className="text-slate-500 font-medium mt-1">Select a course to view and manage its enrollments.</p></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map(course => {
          const bookingCount = enrollments.filter(e => e.course_id === course.id).length;
          return (
            <div key={course.id} onClick={() => setSelectedCourse(course)} className="bg-white border border-slate-200 rounded-3xl overflow-hidden hover:shadow-xl hover:border-indigo-300 transition-all cursor-pointer group">
              <div className="h-40 w-full bg-slate-100 relative overflow-hidden">
                {course.cover_pic ? <img src={course.cover_pic} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" /> : <div className="w-full h-full flex items-center justify-center text-slate-300"><BookOpen size={48} /></div>}
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-xl text-xs font-black text-indigo-700 shadow-sm">{bookingCount} Booking{bookingCount !== 1 ? 's' : ''}</div>
              </div>
              <div className="p-6">
                <h3 className="font-black text-lg text-slate-900 leading-tight mb-2 group-hover:text-indigo-600 transition-colors line-clamp-2">{course.title}</h3>
                <p className="text-sm font-medium text-slate-500 flex items-center gap-2"><CalendarDays size={14} /> {course.start_datetime ? new Date(course.start_datetime).toLocaleDateString() : 'TBA'}</p>
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

// --- SECTION: COURSES ---
function CoursesManager({ data, refresh }: { data: OnlineCourse[], refresh: () => void }) {
  const supabase = createClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Partial<OnlineCourse> | null>(null);

  const saveCourse = async () => {
    if (!editingCourse) return;
    const payload = { ...editingCourse };
    payload.fee = parseFloat(payload.fee as any) || 0;
    payload.discount = parseFloat(payload.discount as any) || 0;
    if (payload.id) { const { error } = await supabase.from('online-courses').update(payload).eq('id', payload.id); if (error) alert(error.message); }
    else { const { error } = await supabase.from('online-courses').insert([payload]); if (error) alert(error.message); }
    setModalOpen(false); refresh();
  };

  const toggleCourseStatus = async (course: OnlineCourse) => {
    const { error } = await supabase.from('online-courses').update({ is_active: !course.is_active }).eq('id', course.id);
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
                    <button onClick={() => { setEditingCourse({ ...course }); setModalOpen(true); }} className="p-2 text-indigo-600 bg-indigo-50 rounded-xl hover:bg-indigo-100" title="Edit Pricing"><Edit2 size={16} /></button>
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
            <div className="p-6 space-y-4">
              <div><label className="block text-[10px] font-black text-slate-400 uppercase mb-1 ml-1">Fee (Rs)</label><input type="number" className="w-full bg-slate-50 p-3.5 rounded-xl outline-none border border-slate-200 focus:border-indigo-500 font-bold text-slate-800 text-sm" value={editingCourse.fee || ''} onChange={e => setEditingCourse({ ...editingCourse, fee: e.target.value as any })} /></div>
              <div><label className="block text-[10px] font-black text-slate-400 uppercase mb-1 ml-1">Discount (%)</label><input type="number" className="w-full bg-slate-50 p-3.5 rounded-xl outline-none border border-slate-200 focus:border-indigo-500 font-bold text-slate-800 text-sm" value={editingCourse.discount || ''} onChange={e => setEditingCourse({ ...editingCourse, discount: e.target.value as any })} /></div>
              <div><label className="block text-[10px] font-black text-slate-400 uppercase mb-1 ml-1">Start Date/Time</label><input type="datetime-local" className="w-full bg-slate-50 p-3.5 rounded-xl outline-none border border-slate-200 focus:border-indigo-500 font-bold text-slate-800 text-sm" value={editingCourse.start_datetime ? new Date(new Date(editingCourse.start_datetime).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ''} onChange={e => setEditingCourse({ ...editingCourse, start_datetime: new Date(e.target.value).toISOString() })} /></div>
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
  // NEW: State for image preview popup
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [form, setForm] = useState({
    id: null as string | null,
    name: '', email: '', syllabus_name: '',
    issue_date: new Date().toISOString().split('T')[0],
    certificate_code: '', existing_image: '', file: null as File | null
  });

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

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-black text-slate-900">Certificate Registry</h2>
        {/* FIX 1: Redirect to /admin/bulk-upload instead of opening create modal */}
        <button
          onClick={() => router.push('/admin/bulk-upload')}
          className="bg-indigo-600 text-white px-5 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all"
        >
          <Plus size={18} /> Generate New
        </button>
      </div>

      <div className="bg-white rounded-[30px] shadow-xl border border-slate-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100 text-xs font-black text-slate-400 uppercase tracking-widest">
              <th className="p-6">Student Info</th><th className="p-6">Course Name</th><th className="p-6">Issue Date & Code</th><th className="p-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.map(cert => (
              // FIX 2: Click on row opens image preview popup
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
            {data.length === 0 && <tr><td colSpan={4} className="p-10 text-center text-slate-500">No certificates generated yet.</td></tr>}
          </tbody>
        </table>
      </div>

      {/* FIX 2: Certificate image preview modal */}
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
              src={previewImage}
              alt="Certificate Preview"
              className="w-full rounded-2xl shadow-2xl border border-white/10"
            />
            <a
              href={previewImage}
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

      {/* Edit-only modal (no create, that goes to bulk-upload) */}
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

// --- CHAT MODAL WITH TOGGLEABLE DETAILS VIEW ---
function ChatModal({ userId, onClose, tutors, vacancies, applications, requests, profilesMap, refreshData }: any) {
  const supabase = createClient();
  const [msg, setMsg] = useState("");
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [showDetails, setShowDetails] = useState(false);
  const [expandedVacId, setExpandedVacId] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const tutorProfile = tutors.find((t: Tutor) => t.user_id === userId);
  const studentVacancy = vacancies.find((v: Vacancy) => v.user_id === userId);
  const studentRequest = requests.find((r: StudentRequest) => r.user_id === userId);
  const role = tutorProfile ? "Tutor" : "Student";
  const displayName = tutorProfile?.name || studentVacancy?.contact_name || studentRequest?.student_name || profilesMap?.full_name || "Unknown User";
  const displayPhone = tutorProfile?.contact_num || studentVacancy?.contact_number || studentRequest?.phone || "Phone N/A";
  const tutorApps = applications.filter((a: VacancyApplication) => a.user_id === userId);
  const tutorIncomingReqs = tutorProfile ? requests.filter((r: StudentRequest) => r.tutor_id === tutorProfile.id) : [];
  const studentVacs = vacancies.filter((v: Vacancy) => v.user_id === userId);
  const studentOutgoingReqs = requests.filter((r: StudentRequest) => r.user_id === userId);

  useEffect(() => {
    const fetchChat = async () => {
      const { data } = await supabase.from('messages').select('*').eq('user_id', userId).order('created_at', { ascending: true });
      if (data) setChatMessages(data);
      try {
        await supabase.from('messages').update({ is_read: true }).eq('user_id', userId).eq('sender_role', 'user');
        refreshData();
      } catch (e) { console.warn("is_read column missing or update failed"); }
    };
    fetchChat();
    const channel = supabase.channel(`chat-${userId}`).on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `user_id=eq.${userId}` }, (payload) => {
      setChatMessages((prev) => [...prev, payload.new as Message]);
      supabase.from('messages').update({ is_read: true }).eq('id', payload.new.id).then(() => refreshData());
    }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userId, refreshData]);

  useEffect(() => {
    if (!showDetails) messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, showDetails]);

  const handleSend = async () => {
    if (!msg.trim()) return;
    const newMsgData = { user_id: userId, sender_role: 'admin', content: msg.trim() };
    setMsg("");
    const { error } = await supabase.from('messages').insert([newMsgData]);
    if (error) alert("Failed to send message: " + error.message);
  };

  const deleteMessage = async (msgId: string) => {
    if (confirm("Are you sure you want to delete this message?")) {
      const { error } = await supabase.from('messages').delete().eq('id', msgId);
      if (error) alert("Failed to delete message: " + error.message);
      else { setChatMessages(prev => prev.filter(m => m.id !== msgId)); refreshData(); }
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm pt-20 pb-10">
      <div className="bg-white rounded-[30px] shadow-2xl max-w-4xl w-full flex flex-col h-[85vh] max-h-[850px] overflow-hidden">
        <div onClick={() => setShowDetails(!showDetails)} className="p-6 border-b bg-slate-50 flex justify-between items-center shrink-0 cursor-pointer hover:bg-slate-100 transition-colors select-none group">
          <div>
            <h3 className="text-xl font-black text-slate-900 flex items-center gap-3">
              {displayName}
              <span className={`text-[10px] uppercase tracking-widest px-2.5 py-1 rounded-md font-bold ${role === 'Tutor' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>{role}</span>
            </h3>
            <p className="text-sm text-slate-500 font-medium mt-1">{displayPhone} • <span className="text-indigo-500 group-hover:underline">{showDetails ? 'Switch to Chat' : 'View Activity Details'}</span></p>
          </div>
          <button onClick={(e) => { e.stopPropagation(); onClose(); }} className="text-slate-400 hover:text-slate-800 p-2"><X size={24} /></button>
        </div>

        {showDetails ? (
          <div className="flex-1 p-8 overflow-y-auto bg-slate-50/50 space-y-8">
            {role === 'Tutor' ? (
              <>
                <div>
                  <h4 className="font-black text-lg mb-4 text-slate-900">Applications to Vacancies</h4>
                  {tutorApps.length === 0 ? <p className="text-sm text-slate-500">No applications found.</p> : (
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                      <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-100 text-xs text-slate-500 uppercase"><tr><th className="p-4">Subject & Location</th><th className="p-4">Salary</th><th className="p-4">Student Status</th></tr></thead>
                        <tbody className="text-sm font-medium">
                          {tutorApps.map((app: any) => (
                            <tr key={app.id} className="border-b border-slate-50">
                              <td className="p-4"><p className="font-bold text-slate-800">{app.vacancies?.subject}</p><p className="text-xs text-slate-500">{app.vacancies?.location}</p></td>
                              <td className="p-4 text-green-600 font-bold">{app.vacancies?.salary_range}</td>
                              <td className="p-4 uppercase text-xs font-black tracking-wider text-slate-500">{app.status}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
                <div>
                  <h4 className="font-black text-lg mb-4 text-slate-900">Direct Requests from Students</h4>
                  {tutorIncomingReqs.length === 0 ? <p className="text-sm text-slate-500">No requests found.</p> : (
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                      <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-100 text-xs text-slate-500 uppercase"><tr><th className="p-4">Student Name</th><th className="p-4">Contact</th><th className="p-4">Status</th></tr></thead>
                        <tbody className="text-sm font-medium">
                          {tutorIncomingReqs.map((req: any) => (
                            <tr key={req.id} className="border-b border-slate-50">
                              <td className="p-4 font-bold text-slate-800">{req.student_name}</td>
                              <td className="p-4 text-slate-600">{req.phone}</td>
                              <td className="p-4 uppercase text-xs font-black tracking-wider text-slate-500">{req.status}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <div>
                  <h4 className="font-black text-lg mb-4 text-slate-900">Posted Vacancies & Applicants</h4>
                  {studentVacs.length === 0 ? <p className="text-sm text-slate-500">No vacancies posted.</p> : (
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                      <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-100 text-xs text-slate-500 uppercase"><tr><th className="p-4">Date</th><th className="p-4">Subject</th><th className="p-4">Total Applicants</th></tr></thead>
                        <tbody className="text-sm font-medium">
                          {studentVacs.map((vac: Vacancy) => {
                            const vacApps = applications.filter((a: VacancyApplication) => a.vacancy_id === vac.id);
                            const isExpanded = expandedVacId === vac.id;
                            return (
                              <React.Fragment key={vac.id}>
                                <tr onClick={() => setExpandedVacId(isExpanded ? null : vac.id)} className="border-b border-slate-50 hover:bg-slate-50 cursor-pointer">
                                  <td className="p-4 text-slate-500">{new Date(vac.created_at).toLocaleDateString()}</td>
                                  <td className="p-4 font-bold text-slate-800 flex items-center gap-2"><ChevronRight size={16} className={`transition-transform ${isExpanded ? 'rotate-90 text-indigo-500' : 'text-slate-400'}`} /> {vac.subject}</td>
                                  <td className="p-4 font-black text-indigo-600">{vacApps.length}</td>
                                </tr>
                                {isExpanded && (
                                  <tr className="bg-slate-50/50">
                                    <td colSpan={3} className="p-4 border-b border-slate-100">
                                      {vacApps.length === 0 ? <p className="text-xs text-slate-400 pl-8">No tutors have applied yet.</p> : (
                                        <div className="pl-8 space-y-2">
                                          {vacApps.map((a: VacancyApplication) => (
                                            <div key={a.id} className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-200">
                                              <div><p className="text-sm font-bold text-slate-800">{a.applicant_name}</p><p className="text-xs text-slate-500">{a.applicant_phone}</p></div>
                                              <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded ${a.status === 'accepted' ? 'bg-green-100 text-green-700' : a.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-slate-200 text-slate-700'}`}>{a.status}</span>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </td>
                                  </tr>
                                )}
                              </React.Fragment>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
                <div>
                  <h4 className="font-black text-lg mb-4 text-slate-900">Direct Tutor Requests Made</h4>
                  {studentOutgoingReqs.length === 0 ? <p className="text-sm text-slate-500">No requests made.</p> : (
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                      <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-100 text-xs text-slate-500 uppercase"><tr><th className="p-4">Tutor Applied</th><th className="p-4">Tutor Contact</th><th className="p-4">Status</th></tr></thead>
                        <tbody className="text-sm font-medium">
                          {studentOutgoingReqs.map((req: any) => (
                            <tr key={req.id} className="border-b border-slate-50">
                              <td className="p-4 font-bold text-slate-800">{req.tutors?.name || 'Unknown'}</td>
                              <td className="p-4 text-slate-600">{req.tutors?.contact_num || 'N/A'}</td>
                              <td className="p-4 uppercase text-xs font-black tracking-wider text-slate-500">{req.status}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        ) : (
          <>
            <div className="flex-1 p-6 overflow-y-auto bg-white flex flex-col gap-4">
              {chatMessages.length === 0 && <p className="text-center text-slate-400 mt-10 font-medium">No messages yet.</p>}
              {chatMessages.map(m => (
                <div key={m.id} className={`flex group items-center ${m.sender_role === 'admin' ? 'justify-end' : 'justify-start'}`}>
                  {m.sender_role === 'admin' && <button onClick={() => deleteMessage(m.id)} className="opacity-0 group-hover:opacity-100 p-2 text-red-500 hover:bg-red-50 rounded-full mr-2 transition-all"><Trash2 size={16} /></button>}
                  <div className={`max-w-[75%] px-5 py-3.5 rounded-3xl font-medium text-[15px] break-words whitespace-pre-wrap ${m.sender_role === 'admin' ? 'bg-indigo-600 text-white rounded-tr-sm' : 'bg-slate-100 text-slate-800 rounded-tl-sm'}`}>{m.content}</div>
                  {m.sender_role === 'user' && <button onClick={() => deleteMessage(m.id)} className="opacity-0 group-hover:opacity-100 p-2 text-red-500 hover:bg-red-50 rounded-full ml-2 transition-all"><Trash2 size={16} /></button>}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            <div className="p-4 border-t bg-slate-50 shrink-0 flex gap-2">
              <input type="text" placeholder="Type a message as admin..." className="flex-1 bg-white px-5 py-4 rounded-2xl outline-none border border-slate-200 focus:border-indigo-500 font-medium transition-colors" value={msg} onChange={e => setMsg(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend()} />
              <button onClick={handleSend} className="bg-indigo-600 text-white px-6 rounded-2xl font-black hover:bg-indigo-700 transition-colors"><Send size={18} /></button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
