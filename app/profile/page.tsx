"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard, FileText, BookOpen, LogOut, Plus,
  Bell, Users, Crown,
  X, Edit2, Check, MapPin, Clock,
  DollarSign, Trash2, Save, GraduationCap,
  Briefcase, User, ExternalLink, Phone, Monitor, SearchX, Send, Lock, MessageCircle, AlertCircle,
  CheckCircle, Flame, Sparkles, Link as LinkIcon, RotateCcw
} from "lucide-react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { createClient } from "@/lib/supabase/client";

// --- TYPES ---
interface Vacancy {
  id: number;
  subject: string;
  location: string;
  class_level: string;
  description?: string;
  salary_range: string;
  tuition_type?: string;
  student_gender_pref?: string;
  class_time: string;
  days_a_week?: string;
  contact_number?: string;
  contact_name?: string;
  user_id: string;
  email?: string;
  urgent?: boolean;
  status: boolean;
  applicant_count?: number;
  created_at: string;
}

interface OnlineCourse {
  id: string;
  title: string;
  cover_pic: string;
  start_datetime: string;
  timing?: string;
  fee: number;
  discount: number;
}

interface Tutor {
  id: number;
  user_id: string;
  name: string;
  subject: string[];
  avatar_url?: string;
  verified?: boolean;
  education?: string;
  hour_rate?: string | number;
  location?: string;
  bio?: string;
  experience?: string;
  contact_num?: string;
  cv_url?: string;
  id_url?: string;
  mode_of_teaching?: string;
  availability?: boolean;
}

interface ApplicationJoin {
  id: number;
  status: string;
  vacancy_id: number;
  user_id?: string;
  applicant_name?: string;
  vacancies: { subject: string; applicant_count?: number; location?: string };
  tutors: Tutor;
  created_at?: string;
}

interface TutorApplicationJoin {
  id: number;
  status: string;
  vacancy_id: number;
  created_at?: string;
  vacancies: {
    id: number;
    subject: string;
    location: string;
  };
}

interface ChatMessage {
  id: string;
  user_id: string;
  sender_role: 'user' | 'admin' | 'student' | 'tutor';
  content: string;
  created_at: string;
}

interface StudentRequest {
  id: number;
  created_at: string;
  tutor_id: number;
  student_name: string;
  phone: string;
  grade: string;
  preferred_mode?: string;
  message?: string;
  status: string;
  tutors?: {
    name: string;
    hour_rate: string;
    location: string;
  };
}

interface AppNotification {
  id: string;
  text: string;
  time: string;
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

export default function ProfilePage() {
  const router = useRouter();
  const supabase = createClient();

  const [activeTab, setActiveTab] = useState('Dashboard');
  const [loading, setLoading] = useState(true);

  // Modals & Filtering State
  const [isApplicationsOpen, setIsApplicationsOpen] = useState(false);
  const [appFilterId, setAppFilterId] = useState<number | null>(null);

  // Notification State
  const [hasUnread, setHasUnread] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  // App Mode State
  const [isTutorMode, setIsTutorMode] = useState(false);
  const [hasTutorProfile, setHasTutorProfile] = useState(false);

  // Student Data
  const [vacancies, setVacancies] = useState<Vacancy[]>([]);
  const [verifiedTutors, setVerifiedTutors] = useState<Tutor[]>([]);
  const [appliedTutors, setAppliedTutors] = useState<ApplicationJoin[]>([]);
  const [applicantCount, setApplicantCount] = useState(0);
  const [studentMyRequests, setStudentMyRequests] = useState<StudentRequest[]>([]);

  // Shared Data
  const [latestCourse, setLatestCourse] = useState<OnlineCourse | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>('');
  const [userName, setUserName] = useState<string>('User');

  // Tutor Data
  const [tutorProfile, setTutorProfile] = useState<Tutor | null>(null);
  const [tutorApplications, setTutorApplications] = useState<TutorApplicationJoin[]>([]);
  const [allVacancies, setAllVacancies] = useState<Vacancy[]>([]);
  const [urgentVacancies, setUrgentVacancies] = useState<Vacancy[]>([]);
  const [studentRequests, setStudentRequests] = useState<StudentRequest[]>([]);

  useEffect(() => {
    document.title = `GyanHub | ${activeTab}`;
  }, [activeTab]);

  useEffect(() => {
    if (isTutorMode && hasTutorProfile) {
      if (activeTab === 'Posted Vacancies' || activeTab === 'My Requests') setActiveTab('Available Vacancies');
    } else {
      if (activeTab === 'Available Vacancies' || activeTab === 'My Info' || activeTab === 'Student Requests') setActiveTab('Dashboard');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTutorMode, hasTutorProfile]);

  const mergeNotifications = useCallback((newNotifs: AppNotification[]) => {
    if (!newNotifs || newNotifs.length === 0) return;

    setHasUnread(true);

    setNotifications(prev => {
      const map = new Map<string, AppNotification>();
      prev.forEach(n => map.set(n.id, n));
      newNotifs.forEach(n => map.set(n.id, n));
      return Array.from(map.values()).sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
    });
  }, []);

  const fetchStudentData = useCallback(async (uid: string, email: string, uName: string) => {
    try {
      let vacancyQuery = supabase.from('vacancies').select('*').order('created_at', { ascending: false });
      if (email && email.trim() !== '') {
        vacancyQuery = vacancyQuery.or(`user_id.eq.${uid},email.ilike.${email}`);
      } else {
        vacancyQuery = vacancyQuery.eq('user_id', uid);
      }

      const { data: vData } = await vacancyQuery;
      const activeVacs = (vData || []).filter((v: any) => v.status === true);
      const vIds = activeVacs.map((v: any) => v.id);

      const notifs: AppNotification[] = [];

      if (vIds.length > 0) {
        const { data: appData } = await supabase
          .from('vacancy_applications')
          .select(`id, status, vacancy_id, created_at, applicant_name, user_id, vacancies ( subject, location ), tutors ( id, user_id, name, avatar_url, education, hour_rate, location )`)
          .in('vacancy_id', vIds)
          .order('created_at', { ascending: false });

        if (appData) {
          const appCountMap: Record<number, number> = {};
          appData.forEach((app: any) => {
            appCountMap[app.vacancy_id] = (appCountMap[app.vacancy_id] || 0) + 1;
            notifs.push({
              id: `s-app-${app.id}`,
              text: `${app.tutors?.name || app.applicant_name} applied to your vacancy: "${Array.isArray(app.vacancies) ? app.vacancies[0]?.subject : app.vacancies?.subject}"`,
              time: app.created_at
            });
          });

          const formattedApps = appData.map((app: any) => ({
            ...app,
            vacancies: Array.isArray(app.vacancies) ? app.vacancies[0] : app.vacancies,
            tutors: Array.isArray(app.tutors) ? app.tutors[0] : app.tutors || { name: app.applicant_name }
          }));

          setAppliedTutors(formattedApps as any);
          setApplicantCount(appData.length);

          const finalVacs = activeVacs.map((v: any) => ({ ...v, applicant_count: appCountMap[v.id] || 0 }));
          setVacancies(finalVacs);
        }
      } else {
        setVacancies(activeVacs.map((v: any) => ({ ...v, applicant_count: 0 })));
        setAppliedTutors([]);
        setApplicantCount(0);
      }

      const { data: myReqs } = await supabase
        .from('student_requests')
        .select('id, created_at, tutor_id, status, grade, preferred_mode, message, tutors(name, hour_rate, location)')
        .eq('user_id', uid)
        .order('created_at', { ascending: false });

      if (myReqs) {
        setStudentMyRequests(myReqs as any);
        myReqs.forEach((req: any) => {
          if (req.status !== 'pending') {
            notifs.push({
              id: `s-req-upd-${req.id}-${req.status}`,
              text: `${req.tutors?.name || 'Tutor'} ${req.status} your coaching request.`,
              time: req.created_at
            });
          }
        });
      }

      mergeNotifications(notifs);
    } catch (err) {
      console.error("Fetch Student Data Error:", err);
    }
  }, [mergeNotifications, supabase]);

  const fetchGlobalData = useCallback(async () => {
    const { data: cData } = await supabase
      .from('online-courses')
      .select('id, title, fee, start_datetime, cover_pic, discount')
      .gte('start_datetime', new Date().toISOString()) // Only future/upcoming courses
      .order('start_datetime', { ascending: true }) // Earliest starting course first
      .limit(1)
      .maybeSingle();
    
    if (cData) setLatestCourse(cData as any);

    const { data: tData } = await supabase
      .from('tutors')
      .select('*')
      .eq('verified', true)
      .limit(10);
      
    if (tData) setVerifiedTutors(tData as any);
  }, [supabase]);

  const fetchTutorData = useCallback(async (uid: string) => {
    try {
      const { data: profile } = await supabase.from('tutors').select('*').eq('user_id', uid).maybeSingle();
      let currentTutorId: number | null = null;
      const notifs: AppNotification[] = [];

      if (profile) {
        setTutorProfile(profile as any);
        setHasTutorProfile(true);
        setIsTutorMode(true);
        currentTutorId = profile.id;
        if (profile.name) setUserName(profile.name);
      } else {
        setHasTutorProfile(false);
      }

      const { data: allVacData } = await supabase.from('vacancies').select('*').order('created_at', { ascending: false });
      if (allVacData) {
        const activeVacs = allVacData.filter((v: any) => v.status === true);
        setAllVacancies(activeVacs);
        setUrgentVacancies(activeVacs.filter((v: any) => v.urgent === true));
      }

      const { data: tutorAppsData } = await supabase
        .from('vacancy_applications')
        .select(`id, status, created_at, vacancy_id, vacancies(id, subject, location)`)
        .eq('user_id', uid)
        .order('created_at', { ascending: false });

      if (tutorAppsData) {
        setTutorApplications(tutorAppsData as any);
        tutorAppsData.forEach((app: any) => {
          if (app.status !== 'pending') {
            const vac = Array.isArray(app.vacancies) ? app.vacancies[0] : app.vacancies;
            notifs.push({
              id: `t-app-upd-${app.id}-${app.status}`,
              text: `Your application to "${vac?.subject || 'vacancy'}" was ${app.status}.`,
              time: app.created_at
            });
          }
        });
      }

      if (currentTutorId) {
        const { data: requestsData } = await supabase
          .from('student_requests')
          .select('*')
          .eq('tutor_id', currentTutorId)
          .order('created_at', { ascending: false });
        if (requestsData) {
          setStudentRequests(requestsData as any);
          requestsData.forEach((req: any) => {
            notifs.push({
              id: `req-${req.id}`,
              text: `${req.student_name} requested you for coaching.`,
              time: req.created_at
            });
          });
        }
      }

      mergeNotifications(notifs);
    } catch (err) {
      console.error("Tutor Data Fetch Error:", err);
      setHasTutorProfile(false);
    }
  }, [mergeNotifications, supabase]);

  const initProfile = useCallback(async () => {
    try {
      setLoading(true);
      
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error || !user) {
        setLoading(false);
        router.push("/login?next=/profile");
        return; 
      }

      setUserId(user.id);
      setUserEmail(user.email || '');
      const uName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';
      setUserName(uName);

      await Promise.allSettled([
        fetchStudentData(user.id, user.email || '', uName),
        fetchGlobalData(),
        fetchTutorData(user.id)
      ]);
      
    } catch (err) {
      console.error("Critical Initialization Error:", err);
    } finally {
      setLoading(false);
    }
  }, [fetchStudentData, fetchGlobalData, fetchTutorData, router, supabase]);

  useEffect(() => {
    initProfile();
    const handlePopState = () => initProfile();
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [initProfile]);

  // --- REALTIME SUBSCRIPTIONS ---
  useEffect(() => {
    if (!userId) return;

    const channel = supabase.channel('realtime_dashboard_updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vacancy_applications' }, () => {
        fetchStudentData(userId, userEmail, userName);
        fetchTutorData(userId);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'student_requests' }, () => {
        fetchStudentData(userId, userEmail, userName);
        fetchTutorData(userId);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId, userEmail, userName, fetchStudentData, fetchTutorData, supabase]);

  const handleNotificationClick = () => {
    setHasUnread(false);
    setShowNotifications(prev => !prev);
  };

  const scrollToChatbox = () => {
    setActiveTab('Dashboard');
    setTimeout(() => document.getElementById('chatbox-section')?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const openApplicationsModal = (vacancyId: number | null = null) => {
    setAppFilterId(vacancyId);
    setIsApplicationsOpen(true);
  };

  const handleUpdateStatus = async (applicationId: number, newStatus: string) => {
    setAppliedTutors(prev => prev.map(app => app.id === applicationId ? { ...app, status: newStatus } : app));
    const { error } = await supabase.from('vacancy_applications').update({ status: newStatus }).eq('id', applicationId);
    if (error) console.error("Update error:", error);
  };

  const handleRejectApplication = async (applicationId: number) => {
    setAppliedTutors(prev => prev.filter(app => app.id !== applicationId));
    setApplicantCount(prev => Math.max(0, prev - 1));
    const { error } = await supabase.from('vacancy_applications').delete().eq('id', applicationId);
    if (error) console.error("Delete error:", error);
  };

  const handleUpdateStudentRequest = async (requestId: number, newStatus: string) => {
    setStudentRequests(prev => prev.map(req => req.id === requestId ? { ...req, status: newStatus } : req));
    const { error } = await supabase.from('student_requests').update({ status: newStatus }).eq('id', requestId);
    if (error) console.error("Update error:", error);
  };

  const handleCancelMyRequest = async (requestId: number) => {
    setStudentMyRequests(prev => prev.filter(req => req.id !== requestId));
    const { error } = await supabase.from('student_requests').delete().eq('id', requestId);
    if (error) console.error("Cancel error:", error);
  };

  const handleUpdateVacancy = async (updatedVacancy: Vacancy) => {
    const { error } = await supabase.from('vacancies').update({
      subject: updatedVacancy.subject,
      location: updatedVacancy.location,
      salary_range: updatedVacancy.salary_range,
      class_time: updatedVacancy.class_time,
      class_level: updatedVacancy.class_level,
      student_gender_pref: updatedVacancy.student_gender_pref
    }).eq('id', updatedVacancy.id);

    if (!error) setVacancies(prev => prev.map(v => v.id === updatedVacancy.id ? updatedVacancy : v));
    else console.error("Vacancy update error:", error);
  };

  const handleDeleteVacancy = async (id: number) => {
    const { error } = await supabase.from('vacancies').update({ status: false }).eq('id', id);
    if (!error) setVacancies(prev => prev.filter(v => v.id !== id));
    else console.error("Vacancy delete error:", error);
  };

  const handleUpdateTutorInfo = async (updatedData: Partial<Tutor>): Promise<boolean> => {
    if (!userId) return false;
    const { error } = await supabase.from('tutors').upsert({ ...updatedData, user_id: userId }, { onConflict: 'user_id' });
    if (!error) {
      setTutorProfile(prev => ({ ...(prev || {}), ...updatedData, user_id: userId } as Tutor));
      setHasTutorProfile(true);
      if (updatedData.name) setUserName(updatedData.name);
      return true;
    }
    console.error("Tutor info update error:", error);
    return false;
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  const handleModeSwitch = (mode: 'student' | 'tutor') => {
    if (mode === 'tutor' && !hasTutorProfile) setIsTutorMode(true);
    else setIsTutorMode(mode === 'tutor');
  };

  return (
    <div className="min-h-screen bg-[#F0F4F8] text-slate-900 pb-32 lg:pb-20 font-sans overflow-x-hidden">
      <style>{`
        @keyframes marquee { 0% { transform: translateX(0%); } 100% { transform: translateX(-50%); } }
        .animate-marquee { animation: marquee 20s linear infinite; }
        .animate-marquee:hover { animation-play-state: paused; }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
        .glass-panel { background: rgba(255, 255, 255, 0.7); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border: 1px solid rgba(255, 255, 255, 0.8); box-shadow: 0 4px 30px rgba(0, 0, 0, 0.03); }
      `}</style>

      {/* Floating Chat Button (Moved to vertically centered on the right side) */}
      <div className="fixed top-1/2 -translate-y-1/2 right-4 lg:right-6 z-[60]">
        <motion.button
          onClick={scrollToChatbox}
          animate={{ y: [0, -8, 0] }}
          transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
          className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white px-5 py-3.5 rounded-full shadow-[0_10px_25px_rgba(79,70,229,0.4)] flex items-center gap-2 font-black text-sm hover:scale-105 transition-transform border border-indigo-400/50"
          aria-label="Open GyanHub Support Chat"
        >
          <MessageCircle size={18} className="fill-white/20" /> GyanHub Support
        </motion.button>
      </div>

      <AnimatePresence>
        {isApplicationsOpen && !isTutorMode && (
          <ApplicationsModal
            applications={appFilterId ? appliedTutors.filter(a => a.vacancy_id === appFilterId) : appliedTutors}
            onClose={() => setIsApplicationsOpen(false)}
            onReject={handleRejectApplication}
            onUpdateStatus={handleUpdateStatus}
          />
        )}
        {isApplicationsOpen && isTutorMode && hasTutorProfile && (
          <TutorApplicationsModal applications={tutorApplications} onClose={() => setIsApplicationsOpen(false)} />
        )}
      </AnimatePresence>

      {/* Navbar */}
      <nav className="sticky top-0 z-40 bg-white/70 backdrop-blur-2xl border-b border-white/40 h-24 flex items-center px-6 transition-all duration-300 shadow-[0_4px_30px_rgba(0,0,0,0.02)]">
        <div className="max-w-7xl mx-auto w-full flex justify-between items-center">
          <div className="flex items-center gap-5">
            <div className="hidden sm:flex items-center gap-3">
              <div className="w-11 h-11 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-[0_8px_16px_rgba(79,70,229,0.3)] border border-white/20">G</div>
              <p className="text-xl font-black flex items-center gap-3 tracking-tighter text-slate-800">
                {userName}'s Hub
                <span className={`text-[10px] uppercase tracking-widest px-2.5 py-1 rounded-lg font-bold border shadow-sm ${isTutorMode ? 'bg-green-100/50 text-green-700 border-green-200' : 'bg-blue-100/50 text-blue-700 border-blue-200'}`}>
                  {isTutorMode ? 'Tutor Mode' : 'Student Mode'}
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6 relative">
            <div className="relative flex items-center bg-slate-200/50 p-1.5 rounded-2xl border border-white shadow-inner backdrop-blur-md">
              <button onClick={() => handleModeSwitch('student')} className="relative px-5 py-2.5 z-10 font-black text-sm transition-colors w-24">
                <span className={!isTutorMode ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700'}>Student</span>
                {!isTutorMode && <motion.div layoutId="modeSwitch" className="absolute inset-0 bg-white shadow-md rounded-xl -z-10 border border-slate-100" />}
              </button>
              <button onClick={() => handleModeSwitch('tutor')} className="relative px-5 py-2.5 z-10 font-black text-sm transition-colors w-24">
                <span className={isTutorMode ? 'text-green-600' : 'text-slate-500 hover:text-slate-700'}>Tutor</span>
                {isTutorMode && <motion.div layoutId="modeSwitch" className="absolute inset-0 bg-white shadow-md rounded-xl -z-10 border border-slate-100" />}
              </button>
            </div>

            <div className="relative">
              <button
                onClick={handleNotificationClick}
                aria-label="Toggle notifications"
                className="p-3.5 bg-white rounded-2xl border border-white text-slate-500 relative cursor-pointer hover:bg-slate-50 shadow-sm hover:shadow-md transition-all group"
              >
                <Bell size={20} className="group-hover:text-blue-600 transition-colors" />
                {hasUnread && <span className="absolute top-2.5 right-3 w-3 h-3 bg-red-500 rounded-full border-2 border-white shadow-[0_0_15px_rgba(239,68,68,0.8)] animate-pulse"></span>}
              </button>

              <AnimatePresence>
                {showNotifications && (
                  <motion.div
                    initial={{ opacity: 0, y: 15, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 top-full mt-4 w-[340px] bg-white shadow-[0_30px_60px_-15px_rgba(0,0,0,0.15)] rounded-3xl border border-slate-100 overflow-hidden z-[100]"
                  >
                    <div className="p-5 bg-slate-50/80 border-b border-slate-100 flex justify-between items-center backdrop-blur-sm">
                      <h4 className="font-black tracking-tight text-slate-800 text-lg">Notifications</h4>
                      <button onClick={() => setShowNotifications(false)} className="p-1.5 bg-white shadow-sm text-slate-400 hover:text-slate-600 rounded-full transition-colors border border-slate-100" aria-label="Close notifications"><X size={14} /></button>
                    </div>
                    <div className="max-h-80 overflow-y-auto custom-scrollbar">
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center text-sm font-bold text-slate-400">All caught up! 🎉</div>
                      ) : (
                        notifications.map(n => (
                          <div key={n.id} className="p-5 border-b border-slate-50 hover:bg-blue-50/50 transition-colors cursor-default group">
                            <p className="text-sm font-bold text-slate-700 leading-snug group-hover:text-blue-900 transition-colors">{n.text}</p>
                            <p className="text-[10px] text-slate-400 font-black mt-2 uppercase tracking-widest">{new Date(n.time).toLocaleDateString()} • {new Date(n.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 mt-12 grid grid-cols-1 lg:grid-cols-12 gap-10 relative">
        <aside className="hidden lg:block lg:col-span-3" aria-label="Sidebar navigation">
          <div className="glass-panel rounded-[32px] p-4 sticky top-32 space-y-2">
            {isTutorMode ? (
              hasTutorProfile ? (
                <>
                  <NavButton icon={<LayoutDashboard size={20} />} label="Dashboard" active={activeTab === 'Dashboard'} onClick={() => setActiveTab('Dashboard')} isTutor={true} />
                  <NavButton icon={<Briefcase size={20} />} label="Job Board" active={activeTab === 'Available Vacancies'} onClick={() => setActiveTab('Available Vacancies')} isTutor={true} />
                  <NavButton icon={<Users size={20} />} label="Requests" active={activeTab === 'Student Requests'} onClick={() => setActiveTab('Student Requests')} isTutor={true} />
                  <NavButton icon={<BookOpen size={20} />} label="Courses" active={false} onClick={() => window.location.href = '/online-courses'} isTutor={true} />
                  <NavButton icon={<User size={20} />} label="My Info" active={activeTab === 'My Info'} onClick={() => setActiveTab('My Info')} isTutor={true} />
                </>
              ) : (
                <NavButton icon={<LayoutDashboard size={20} />} label="Dashboard" active={true} onClick={() => { }} isTutor={true} />
              )
            ) : (
              hasTutorProfile ? (
                <NavButton icon={<LayoutDashboard size={20} />} label="Dashboard" active={true} onClick={() => { }} isTutor={false} />
              ) : (
                <>
                  <NavButton icon={<LayoutDashboard size={20} />} label="Dashboard" active={activeTab === 'Dashboard'} onClick={() => setActiveTab('Dashboard')} isTutor={false} />
                  <NavButton icon={<FileText size={20} />} label="My Postings" active={activeTab === 'Posted Vacancies'} onClick={() => setActiveTab('Posted Vacancies')} isTutor={false} />
                  <NavButton icon={<Users size={20} />} label="My Requests" active={activeTab === 'My Requests'} onClick={() => setActiveTab('My Requests')} isTutor={false} />
                  <NavButton icon={<BookOpen size={20} />} label="Courses" active={false} onClick={() => window.location.href = '/online-courses'} isTutor={false} />
                </>
              )
            )}
            <div className="h-px bg-slate-200/60 my-6 mx-4" />
            <NavButton icon={<LogOut size={20} />} label="Signout" color="text-red-500" onClick={handleSignOut} isTutor={isTutorMode} />
          </div>
        </aside>

        <main className="lg:col-span-9 w-full" aria-busy={loading}>
          {loading ? <SkeletonLoader /> : (
            <AnimatePresence mode="wait">
              <motion.div
                key={`${activeTab}-${isTutorMode}`}
                initial={{ opacity: 0, y: 30, filter: "blur(8px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -20, filter: "blur(8px)" }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="w-full"
              >
                {/* LOCKED STATES */}
                {isTutorMode && !hasTutorProfile && (
                  <div className="glass-panel p-16 rounded-[40px] text-center flex flex-col items-center justify-center min-h-[60vh] relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-20 opacity-5"><Lock size={300} /></div>
                    <div className="w-24 h-24 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mb-8 shadow-inner rotate-3"><Lock size={40} /></div>
                    <h2 className="text-4xl font-black text-slate-900 mb-4 tracking-tight relative z-10">Tutor Profile Locked</h2>
                    <p className="text-lg text-slate-500 font-medium max-w-md mx-auto mb-10 relative z-10">You need an approved tutor profile to access this dashboard and start applying for jobs.</p>
                    <button onClick={() => window.location.href = '/become-a-tutor'} className="bg-gradient-to-r from-emerald-500 to-green-600 text-white px-10 py-4 rounded-2xl font-black shadow-[0_10px_30px_-10px_rgba(16,185,129,0.8)] hover:scale-105 transition-all relative z-10">
                      Setup Tutor Profile
                    </button>
                  </div>
                )}
                {!isTutorMode && hasTutorProfile && (
                  <div className="glass-panel p-16 rounded-[40px] text-center flex flex-col items-center justify-center min-h-[60vh] relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-20 opacity-5"><Briefcase size={300} /></div>
                    <div className="w-24 h-24 bg-blue-50 text-blue-500 rounded-3xl flex items-center justify-center mb-8 shadow-inner -rotate-3"><Briefcase size={40} /></div>
                    <h2 className="text-4xl font-black text-slate-900 mb-4 tracking-tight relative z-10">Student View Restricted</h2>
                    <p className="text-lg text-slate-500 font-medium max-w-md mx-auto mb-10 relative z-10">You are registered as a Tutor. Please use the Tutor Dashboard to manage your activities.</p>
                    <button onClick={() => handleModeSwitch('tutor')} className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-10 py-4 rounded-2xl font-black shadow-[0_10px_30px_-10px_rgba(37,99,235,0.8)] hover:scale-105 transition-all relative z-10">
                      Go to Tutor Hub
                    </button>
                  </div>
                )}

                {/* STUDENT VIEWS */}
                {!isTutorMode && !hasTutorProfile && activeTab === 'Dashboard' && (
                  <DashboardView userId={userId} userName={userName} count={applicantCount} course={latestCourse} verifiedTutors={verifiedTutors} onShowApplications={() => openApplicationsModal()} />
                )}
                {!isTutorMode && !hasTutorProfile && activeTab === 'Posted Vacancies' && (
                  <VacanciesView vacancies={vacancies} onUpdate={handleUpdateVacancy} onDelete={handleDeleteVacancy} onViewApplicants={openApplicationsModal} />
                )}
                {!isTutorMode && !hasTutorProfile && activeTab === 'My Requests' && (
                  <StudentMyRequestsView requests={studentMyRequests} onCancel={handleCancelMyRequest} onChatAdmin={scrollToChatbox} />
                )}

                {/* TUTOR VIEWS */}
                {isTutorMode && hasTutorProfile && activeTab === 'Dashboard' && (
                  <TutorDashboardView profile={tutorProfile} userId={userId} userName={userName} userEmail={userEmail} applicationsCount={tutorApplications.length} requestsCount={studentRequests.length} course={latestCourse} urgentVacancies={urgentVacancies} onShowApplications={() => openApplicationsModal()} onShowRequests={() => setActiveTab('Student Requests')} onFixProfile={() => setActiveTab('My Info')} />
                )}
                {isTutorMode && hasTutorProfile && activeTab === 'Available Vacancies' && (
                  <AvailableVacanciesView vacancies={allVacancies} />
                )}
                {isTutorMode && hasTutorProfile && activeTab === 'Student Requests' && (
                  <StudentRequestsView requests={studentRequests} onUpdateStatus={handleUpdateStudentRequest} onChatAdmin={scrollToChatbox} />
                )}
                {isTutorMode && hasTutorProfile && activeTab === 'My Info' && (
                  <MyInfoView profile={tutorProfile} onSave={handleUpdateTutorInfo} />
                )}
              </motion.div>
            </AnimatePresence>
          )}
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      <nav className="lg:hidden fixed bottom-6 left-6 right-6 z-50 glass-panel shadow-[0_20px_40px_rgba(0,0,0,0.15)] rounded-3xl p-2 flex justify-between items-center px-4" aria-label="Mobile navigation">
        {isTutorMode ? (
          hasTutorProfile ? (
            <>
              <MobileNavButton icon={<LayoutDashboard size={20} />} label="Home" active={activeTab === 'Dashboard'} onClick={() => setActiveTab('Dashboard')} isTutor={true} />
              <MobileNavButton icon={<Briefcase size={20} />} label="Jobs" active={activeTab === 'Available Vacancies'} onClick={() => setActiveTab('Available Vacancies')} isTutor={true} />
              <MobileNavButton icon={<Users size={20} />} label="Reqs" active={activeTab === 'Student Requests'} onClick={() => setActiveTab('Student Requests')} isTutor={true} />
              <MobileNavButton icon={<User size={20} />} label="Info" active={activeTab === 'My Info'} onClick={() => setActiveTab('My Info')} isTutor={true} />
            </>
          ) : <MobileNavButton icon={<LayoutDashboard size={20} />} label="Home" active={true} onClick={() => { }} isTutor={true} />
        ) : (
          hasTutorProfile ? (
            <MobileNavButton icon={<LayoutDashboard size={20} />} label="Home" active={true} onClick={() => { }} isTutor={false} />
          ) : (
            <>
              <MobileNavButton icon={<LayoutDashboard size={20} />} label="Home" active={activeTab === 'Dashboard'} onClick={() => setActiveTab('Dashboard')} isTutor={false} />
              <MobileNavButton icon={<FileText size={20} />} label="Posts" active={activeTab === 'Posted Vacancies'} onClick={() => setActiveTab('Posted Vacancies')} isTutor={false} />
              <MobileNavButton icon={<Users size={20} />} label="Reqs" active={activeTab === 'My Requests'} onClick={() => setActiveTab('My Requests')} isTutor={false} />
            </>
          )
        )}
      </nav>
    </div>
  );
}

// --- SUB-COMPONENTS ---

function NavButton({ icon, label, active, onClick, color, isTutor }: any) {
  const themeColor = isTutor ? 'text-green-700' : 'text-blue-700';
  const themeBg = isTutor ? 'bg-green-50/80 border-green-200/50 shadow-sm' : 'bg-blue-50/80 border-blue-200/50 shadow-sm';

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-[14px] font-black transition-all duration-300 border border-transparent ${active ? `${themeBg} ${themeColor} translate-x-1` : `text-slate-500 hover:bg-slate-50 hover:text-slate-800 ${color || ''}`}`}
    >
      <div className={`p-2 rounded-xl transition-colors ${active ? (isTutor ? 'bg-green-200/50' : 'bg-blue-200/50') : 'bg-transparent'}`}>
        {icon}
      </div>
      <span>{label}</span>
    </button>
  );
}

function MobileNavButton({ icon, label, active, onClick, color, isTutor }: any) {
  const themeColor = isTutor ? 'text-green-600' : 'text-blue-600';
  return (
    <motion.button
      whileTap={{ scale: 0.85 }}
      onClick={onClick}
      className={`flex flex-col items-center gap-1 p-2 rounded-2xl transition-all min-w-[60px] ${active ? themeColor : `text-slate-400 ${color || ''}`}`}
    >
      <div className={`p-2.5 rounded-2xl ${active ? (isTutor ? 'bg-green-100' : 'bg-blue-100') : 'bg-transparent'}`}>
        {icon}
      </div>
      <span className="text-[10px] font-black tracking-widest">{label}</span>
    </motion.button>
  );
}

function StatCard({ label, value, icon, isTutor }: any) {
  const themeText = isTutor ? 'text-green-600' : 'text-blue-600';
  const themeBg = isTutor ? 'bg-green-100' : 'bg-blue-100';
  const hoverEffect = isTutor
    ? 'hover:shadow-[0_20px_40px_-15px_rgba(16,185,129,0.3)] hover:border-green-300'
    : 'hover:shadow-[0_20px_40px_-15px_rgba(37,99,235,0.3)] hover:border-blue-300';

  return (
    <div className={`glass-panel p-8 rounded-[32px] flex flex-col justify-between h-full hover:-translate-y-2 transition-all duration-500 ${hoverEffect} relative overflow-hidden group`}>
      <div className={`absolute -right-4 -top-4 opacity-[0.03] scale-150 group-hover:scale-[2] transition-transform duration-700 ${themeText}`}>{icon}</div>
      <div className={`p-4 w-fit ${themeBg} ${themeText} rounded-2xl mb-6 shadow-inner relative z-10`}>{icon}</div>
      <div className="relative z-10">
        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">{label}</p>
        <p className="text-5xl font-black tracking-tighter text-slate-900">{value}</p>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const isAccepted = status === 'accepted';
  const isRejected = status === 'rejected';

  const colorMap = {
    bg: isAccepted ? 'bg-green-50' : isRejected ? 'bg-red-50' : 'bg-orange-50',
    border: isAccepted ? 'border-green-200' : isRejected ? 'border-red-200' : 'border-orange-200',
    text: isAccepted ? 'text-green-700' : isRejected ? 'text-red-700' : 'text-orange-700',
    dot: isAccepted ? 'bg-green-500' : isRejected ? 'bg-red-500' : 'bg-orange-500',
  };

  return (
    <div className={`flex items-center gap-2 px-4 py-1.5 ${colorMap.bg} border ${colorMap.border} ${colorMap.text} rounded-xl w-fit shadow-sm`}>
      <span className={`w-2 h-2 rounded-full ${colorMap.dot} ${isAccepted ? 'animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.8)]' : ''}`}></span>
      <span className="text-[10px] font-black uppercase tracking-widest">{status}</span>
    </div>
  );
}

function AvatarDisplay({ name, url }: { name: string; url?: string }) {
  if (url) return <img src={url} className="h-14 w-14 rounded-2xl object-cover border-2 border-white shadow-md" alt={name} />;
  return (
    <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 border-2 border-white shadow-md flex items-center justify-center text-white font-black text-xl shrink-0">
      {name?.charAt(0) || 'T'}
    </div>
  );
}

function TutorsMarquee({ tutors, className = "h-full" }: { tutors: Tutor[]; className?: string }) {
  const router = useRouter();
  if (!tutors || tutors.length === 0) return null;

  // Triple the array for seamless loop
  const displayTutors = [
    ...tutors.map(t => ({ ...t, _key: `a-${t.id}` })),
    ...tutors.map(t => ({ ...t, _key: `b-${t.id}` })),
    ...tutors.map(t => ({ ...t, _key: `c-${t.id}` })),
  ];

  return (
    <div className={`glass-panel rounded-[32px] p-6 md:p-8 flex flex-col relative overflow-hidden ${className}`}>
      <div className="flex justify-between items-center mb-6 shrink-0 z-10 relative bg-white/50 backdrop-blur-md p-4 rounded-2xl border border-white/80 shadow-sm">
        <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
          <Sparkles size={16} className="text-blue-500" /> Verified Premium Tutors
        </h3>
      </div>

      <div className="flex-grow w-full overflow-hidden relative group flex items-center">
        <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-[#F0F4F8] to-transparent z-10 pointer-events-none"></div>
        <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-[#F0F4F8] to-transparent z-10 pointer-events-none"></div>

        <div className="flex w-max animate-marquee gap-6 h-full items-stretch py-2">
          {displayTutors.map((tutor) => (
            <div
              key={tutor._key}
              onClick={() => router.push(`/tutors/${tutor.id}`)}
              className="flex flex-col justify-between gap-4 bg-white/80 backdrop-blur-md border border-white p-6 rounded-[28px] w-[360px] h-full shrink-0 shadow-sm hover:shadow-[0_20px_40px_-15px_rgba(37,99,235,0.15)] hover:border-blue-200 hover:-translate-y-2 transition-all duration-500 cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <AvatarDisplay name={tutor.name} url={tutor.avatar_url} />
                <div className="overflow-hidden w-full">
                  <div className="flex items-center gap-1.5">
                    <p className="font-black text-slate-900 text-lg truncate">{tutor.name}</p>
                    {tutor.verified && <CheckCircle size={16} className="text-blue-500 fill-blue-50 shrink-0" />}
                  </div>
                  <p className="text-sm text-blue-600 font-bold truncate mt-0.5">{tutor.subject?.join(', ') || 'Various Subjects'}</p>
                </div>
              </div>

              <p className="text-sm text-slate-500 line-clamp-2 mt-2 flex-grow font-medium leading-relaxed">
                {tutor.bio ? `"${tutor.bio}"` : "Passionate about teaching and helping students excel in their academic journey."}
              </p>

              <div className="flex items-center justify-between mt-2 text-xs text-slate-500 font-bold border-t border-slate-100 pt-4">
                <span className="flex items-center gap-1.5 truncate max-w-[60%] bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100">
                  <GraduationCap size={14} className="shrink-0 text-slate-400" /> <span className="truncate">{tutor.education || 'N/A'}</span>
                </span>
                <span className="flex items-center gap-1.5 shrink-0 bg-green-50 px-2.5 py-1.5 rounded-lg border border-green-100">
                  <Clock size={14} className="text-green-500" /> {tutor.availability ? <span className="text-green-700">Available</span> : <span className="text-slate-500">Busy</span>}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function UrgentVacanciesList({ vacancies }: { vacancies: Vacancy[] }) {
  const router = useRouter();
  if (!vacancies || vacancies.length === 0) return null;

  return (
    <div className="glass-panel rounded-[32px] p-6 md:p-8 flex flex-col relative h-[380px] overflow-hidden bg-gradient-to-b from-white/80 to-white/40">
      <div className="flex items-center gap-2 mb-6 shrink-0">
        <Flame size={20} className="text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-pulse" />
        <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-widest">Urgent Vacancies</h3>
      </div>
      <div className="overflow-y-auto pr-3 space-y-4 custom-scrollbar flex-grow">
        {vacancies.map((v) => (
          <div
            key={v.id}
            onClick={() => router.push(`/vacancies/${v.id}`)}
            className="bg-gradient-to-br from-red-50 to-orange-50 border border-red-100 p-5 rounded-2xl hover:bg-red-100/50 hover:shadow-lg hover:border-red-300 hover:-translate-y-0.5 transition-all cursor-pointer group"
          >
            <div className="flex justify-between items-start mb-3 gap-4">
              <p className="font-black text-slate-900 text-lg group-hover:text-red-700 transition-colors leading-tight">{v.subject}</p>
              <p className="text-xs font-black text-red-600 bg-white/60 px-2.5 py-1 rounded-lg shrink-0 border border-red-100/50 shadow-sm">{v.salary_range}</p>
            </div>
            <div className="flex items-center gap-5 text-xs text-slate-600 font-bold">
              <span className="flex items-center gap-1.5 truncate"><MapPin size={12} className="text-red-500" /> {v.location}</span>
              <span className="flex items-center gap-1.5 shrink-0"><Clock size={12} className="text-orange-500" /> {v.class_time}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ChatBox({ userId, userName, isTutor }: { userId: string | null; userName: string; isTutor: boolean }) {
  const supabase = createClient(); 

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [chatLoading, setChatLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const themeBorder = isTutor ? 'border-green-200 focus:border-green-500 focus:ring-green-100' : 'border-blue-200 focus:border-blue-500 focus:ring-blue-100';
  const themeButton = isTutor ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700';
  const userMsgClass = isTutor ? 'bg-green-50 text-green-800 border border-green-100' : 'bg-blue-50 text-blue-800 border border-blue-100';

  useEffect(() => {
    if (!userId) return;

    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

      if (!error && data) setMessages(data as ChatMessage[]);
      setChatLoading(false);
    };

    fetchMessages();

    const subscription = supabase
      .channel(`messages:${userId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, payload => {
        const newMsg = payload.new as ChatMessage;
        if (newMsg.user_id === userId) {
          setMessages(prev => [...prev, newMsg]);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(subscription); };
  }, [userId, supabase]);

  useEffect(() => {
    if (messagesEndRef.current?.parentElement) {
      const container = messagesEndRef.current.parentElement;
      container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !userId) return;

    const msgData = {
      user_id: userId,
      sender_role: isTutor ? 'tutor' : 'student',
      content: newMessage.trim(),
    };

    setNewMessage('');
    const { error } = await supabase.from('messages').insert([msgData]);
    if (error) console.error("Error sending message:", error);
  };

  return (
    <div id="chatbox-section" className="glass-panel rounded-[32px] flex flex-col h-[500px] overflow-hidden scroll-mt-32">
      <div className="p-6 border-b border-slate-200/50 bg-white/50 backdrop-blur-sm">
        <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">Message GyanHub Admin</h3>
        <p className="text-sm text-slate-500 font-medium">Get support or ask questions directly.</p>
      </div>

      <div className="flex-grow p-6 overflow-y-auto flex flex-col gap-4 bg-white/30 custom-scrollbar">
        {chatLoading ? (
          <div className="flex items-center justify-center h-full" aria-label="Loading messages">
            <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-500 rounded-full animate-spin"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400">
            <SearchX size={40} className="mb-2 opacity-50" />
            <p className="text-sm font-bold">No messages yet.</p>
            <p className="text-xs">Send a message to start the conversation.</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isAdmin = msg.sender_role === 'admin';
            return (
              <div key={msg.id} className={`flex flex-col ${isAdmin ? 'items-start' : 'items-end'}`}>
                <span className="text-[10px] text-slate-400 font-bold mb-1 px-1 opacity-80">
                  {isAdmin ? 'admin · Nischal' : `${isTutor ? 'tutor' : 'student'} · ${userName}`}
                </span>
                <div className={`max-w-[80%] rounded-2xl p-4 text-sm font-medium shadow-sm ${isAdmin ? 'bg-white text-slate-800 border border-slate-100 rounded-tl-none' : `${userMsgClass} rounded-tr-none`}`}>
                  {msg.content}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage} className="p-4 bg-white/50 backdrop-blur-sm border-t border-slate-200/50 flex gap-3">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type your message..."
          aria-label="Chat message input"
          className={`flex-grow bg-white border ${themeBorder} focus:ring-4 rounded-xl px-4 py-3 text-sm font-medium outline-none transition-all shadow-inner`}
        />
        <button
          type="submit"
          disabled={!newMessage.trim()}
          aria-label="Send message"
          className={`${themeButton} text-white p-3 rounded-xl shadow-[0_4px_15px_rgba(0,0,0,0.1)] disabled:opacity-50 disabled:cursor-not-allowed transition-all`}
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}

function DashboardView({ count, course, verifiedTutors, onShowApplications, userId, userName }: any) {
  return (
    <div className="space-y-10">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-white/40 p-8 rounded-[32px] border border-white/60 shadow-sm backdrop-blur-md">
        <div>
          <h2 className="text-5xl font-black text-slate-900 tracking-tighter mb-2">Dashboard</h2>
          <p className="text-slate-500 font-bold tracking-wide">Welcome back. Here is your overview.</p>
        </div>
        <button onClick={() => window.location.href = '/post-tuition'} className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-2xl text-sm font-black shadow-[0_10px_30px_-10px_rgba(37,99,235,0.6)] hover:scale-105 transition-all flex items-center gap-3">
          <Plus size={20} /> Post Vacancy
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-5 h-full cursor-pointer group" onClick={onShowApplications}>
          <StatCard label="Total Tutors Applied" value={count} icon={<Users size={28} />} isTutor={false} />
        </div>
        <div className="lg:col-span-7 flex flex-col justify-end">
          <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-4 ml-2">Featured Online Course</h3>
          {course ? <LatestCourseCard course={course} isTutor={false} /> : <div className="glass-panel p-10 rounded-[32px] border-dashed text-center text-slate-400 font-bold">No courses available</div>}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-7 flex flex-col gap-6 h-[500px]">
          <TutorsMarquee tutors={verifiedTutors} className="h-full" />
        </div>
        <div className="lg:col-span-5">
          <ChatBox userId={userId} userName={userName} isTutor={false} />
        </div>
      </div>
    </div>
  );
}

function VacanciesView({ vacancies, onUpdate, onDelete, onViewApplicants }: { vacancies: Vacancy[]; onUpdate: (v: Vacancy) => void; onDelete: (id: number) => void; onViewApplicants: (id: number) => void }) {
  return (
    <div className="space-y-10">
      <h2 className="text-5xl font-black tracking-tighter text-slate-900 ml-2">My Vacancies</h2>

      {vacancies.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-panel p-20 rounded-[40px] text-center border-dashed flex flex-col items-center justify-center gap-6">
          <div className="p-8 bg-blue-50 rounded-full shadow-inner text-blue-300"><SearchX size={64} /></div>
          <div>
            <p className="text-2xl font-black text-slate-800 mb-2">No Vacancies Posted</p>
            <p className="text-slate-500 font-medium">Create your first vacancy to start receiving tutor applications.</p>
          </div>
          <button onClick={() => window.location.href = '/post-tuition'} className="mt-6 bg-blue-600 text-white px-10 py-4 rounded-2xl font-black shadow-lg shadow-blue-600/30 hover:bg-blue-700 transition-colors">Post Vacancy Now</button>
        </motion.div>
      ) : (
        <motion.div variants={staggerContainer} initial="hidden" animate="show" className="grid gap-8">
          {vacancies.map((v) => (
            <motion.div key={v.id} variants={staggerItem} layout>
              <VacancyCard vacancy={v} onSave={onUpdate} onDelete={onDelete} onViewApplicants={onViewApplicants} />
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}

function VacancyCard({ vacancy, onSave, onDelete, onViewApplicants }: { vacancy: Vacancy; onSave: (v: Vacancy) => void; onDelete: (id: number) => void; onViewApplicants: (id: number) => void }) {
  const [isEditing, setIsEditing] = useState(false);
  const [edited, setEdited] = useState(vacancy);

  const handleSave = () => { onSave(edited); setIsEditing(false); };
  const handleCancel = () => { setEdited(vacancy); setIsEditing(false); };

  return (
    <div className="glass-panel p-8 md:p-10 rounded-[40px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_30px_60px_-15px_rgba(37,99,235,0.15)] hover:border-blue-200 transition-all duration-500 group relative overflow-hidden">
      <div className="absolute -right-20 -top-20 w-64 h-64 bg-blue-50 rounded-full blur-3xl opacity-50 group-hover:opacity-100 transition-opacity pointer-events-none"></div>

      <div className="flex flex-col w-full relative z-10">
        {isEditing ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
            <input
              className="col-span-2 text-3xl font-black bg-white shadow-inner p-5 rounded-2xl border border-slate-100 outline-none text-slate-800 focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all"
              value={edited.subject}
              onChange={e => setEdited({ ...edited, subject: e.target.value })}
              aria-label="Subject"
            />
            {[
              { icon: MapPin, val: edited.location, key: 'location', color: 'text-blue-500', bg: 'bg-blue-50', placeholder: 'Location' },
              { icon: DollarSign, val: edited.salary_range, key: 'salary_range', color: 'text-emerald-500', bg: 'bg-emerald-50', placeholder: 'Salary Range' },
              { icon: Clock, val: edited.class_time, key: 'class_time', color: 'text-orange-500', bg: 'bg-orange-50', placeholder: 'Class Time' },
              { icon: Users, val: edited.student_gender_pref || '', key: 'student_gender_pref', color: 'text-purple-500', bg: 'bg-purple-50', placeholder: 'Gender Preference' }
            ].map((f) => (
              <div key={f.key} className="flex items-center gap-4 bg-white shadow-sm p-4 rounded-2xl border border-slate-100 focus-within:border-blue-400 focus-within:ring-4 focus-within:ring-blue-100 transition-all">
                <div className={`p-2 rounded-xl ${f.bg} ${f.color}`}><f.icon size={20} /></div>
                <input
                  className="bg-transparent outline-none font-bold text-slate-700 w-full"
                  value={f.val}
                  onChange={e => setEdited({ ...edited, [f.key]: e.target.value })}
                  placeholder={f.placeholder}
                  aria-label={f.placeholder}
                />
              </div>
            ))}
            <div className="col-span-2 flex gap-4 mt-4">
              <button onClick={handleSave} className="flex-1 bg-green-500 text-white p-4 rounded-2xl hover:bg-green-600 shadow-md transition-all font-black flex justify-center items-center gap-2"><Save size={20} /> Save Changes</button>
              <button onClick={handleCancel} className="flex-1 bg-slate-100 text-slate-600 p-4 rounded-2xl hover:bg-slate-200 transition-all font-black">Cancel</button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-start mb-8">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h4 className="text-3xl md:text-4xl font-black tracking-tighter text-slate-900 group-hover:text-blue-900 transition-colors">{vacancy.subject}</h4>
                  {vacancy.urgent && <span className="bg-red-50 border border-red-200 text-red-600 text-[10px] font-black px-3 py-1 rounded-xl uppercase tracking-wider flex items-center gap-1.5 shadow-sm"><Flame size={12} /> Urgent Hire</span>}
                </div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                  Posted by {vacancy.contact_name || vacancy.email || 'You'} on {new Date(vacancy.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {[
                { icon: MapPin, label: 'Location', value: vacancy.location, bg: 'bg-blue-50', color: 'text-blue-500' },
                { icon: DollarSign, label: 'Budget', value: `Rs. ${vacancy.salary_range}`, bg: 'bg-emerald-50', color: 'text-emerald-500' },
                { icon: Clock, label: 'Timing', value: vacancy.class_time, bg: 'bg-orange-50', color: 'text-orange-500' },
                { icon: User, label: 'Preference', value: vacancy.student_gender_pref || 'Any', bg: 'bg-purple-50', color: 'text-purple-500' },
              ].map(({ icon: Icon, label, value, bg, color }) => (
                <div key={label} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
                  <div className={`p-2.5 ${bg} ${color} rounded-xl`}><Icon size={18} /></div>
                  <div className="overflow-hidden">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
                    <p className="font-black text-slate-800 truncate">{value}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-6 border-t border-slate-200/60">
              {(vacancy.applicant_count ?? 0) > 0 ? (
                <button
                  onClick={() => onViewApplicants(vacancy.id)}
                  className="w-full md:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3.5 rounded-2xl font-black text-sm shadow-[0_8px_20px_-6px_rgba(37,99,235,0.6)] hover:scale-105 hover:shadow-[0_12px_25px_-6px_rgba(37,99,235,0.8)] transition-all"
                >
                  <Users size={18} /> View {vacancy.applicant_count} Applicants
                </button>
              ) : (
                <div className="w-full md:w-auto flex items-center justify-center gap-2 bg-slate-100 text-slate-400 px-6 py-3.5 rounded-2xl font-bold text-sm border border-slate-200">
                  <Users size={18} /> No Applicants Yet
                </div>
              )}

              <div className="flex w-full md:w-auto gap-3">
                <button onClick={() => setIsEditing(true)} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-3.5 bg-white border border-slate-200 text-slate-600 rounded-2xl font-bold text-sm hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 shadow-sm transition-colors">
                  <Edit2 size={16} /> Edit
                </button>
                <button onClick={() => onDelete(vacancy.id)} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-3.5 bg-white border border-slate-200 text-slate-600 rounded-2xl font-bold text-sm hover:bg-red-50 hover:text-red-600 hover:border-red-200 shadow-sm transition-colors">
                  <Trash2 size={16} /> Delete
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function StudentMyRequestsView({ requests, onCancel, onChatAdmin }: { requests: StudentRequest[]; onCancel: (id: number) => void; onChatAdmin: () => void }) {
  return (
    <div className="space-y-10">
      <h2 className="text-5xl font-black tracking-tighter text-slate-900 ml-2">My Requests</h2>

      {requests.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-panel p-20 rounded-[40px] text-center border-dashed flex flex-col items-center justify-center gap-6">
          <div className="p-8 bg-slate-100/50 rounded-full shadow-inner text-slate-400"><Users size={64} /></div>
          <div>
            <p className="text-2xl font-black text-slate-800 mb-2">No Requests Made</p>
            <p className="text-slate-500 font-medium">You haven't requested any tutors directly yet.</p>
          </div>
        </motion.div>
      ) : (
        <div className="glass-panel rounded-[32px] overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-[11px] font-bold text-slate-500 uppercase tracking-widest bg-white/50 border-b border-white">
                <th className="py-4 pl-8">Tutor Info</th>
                <th className="py-4">Details</th>
                <th className="py-4">Status</th>
                <th className="py-4 pr-8 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((req) => (
                <tr key={req.id} className="border-b border-slate-100/50 hover:bg-white/60 transition-colors group">
                  <td className="py-6 pl-8">
                    <p className="font-black text-slate-800 text-base">{req.tutors?.name || 'Unknown Tutor'}</p>
                    <div className="text-xs text-slate-500 font-bold mt-1 flex items-center gap-3">
                      <span className="flex items-center gap-1"><MapPin size={12} className="text-slate-400" /> {req.tutors?.location || 'Anywhere'}</span>
                      <span className="flex items-center gap-1 text-emerald-600"><DollarSign size={12} /> {req.tutors?.hour_rate || 'N/A'}/hr</span>
                    </div>
                  </td>
                  <td className="py-6 pr-4">
                    <p className="text-sm font-bold text-slate-700 mb-1">For Grade: <span className="text-blue-600">{req.grade}</span></p>
                    <p className="text-[10px] text-slate-400 mt-0.5 tracking-widest uppercase">Requested on: {new Date(req.created_at).toLocaleDateString()}</p>
                  </td>
                  <td className="py-6"><StatusBadge status={req.status} /></td>
                  <td className="py-6 pr-8 text-right">
                    <div className="flex justify-end gap-3">
                      <button onClick={onChatAdmin} className="inline-flex items-center gap-2 bg-slate-800 text-white px-4 py-2.5 rounded-xl text-xs font-black shadow-md hover:bg-slate-700 transition-all">
                        <MessageCircle size={14} /> Admin
                      </button>
                      <button onClick={() => onCancel(req.id)} className="inline-flex items-center gap-2 bg-white text-red-600 px-4 py-2.5 rounded-xl text-xs font-black border border-red-100 shadow-sm hover:bg-red-50 transition-all">
                        Cancel
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function TutorDashboardView({ profile, applicationsCount, requestsCount, course, urgentVacancies, onShowApplications, onShowRequests, onFixProfile, userId, userName, userEmail }: any) {
  const handleVerifyClick = () => {
    const params = new URLSearchParams({
      name: profile?.name || userName || '',
      email: userEmail || '',
      phone: profile?.contact_num || '',
      order_type: "verified batch"
    });
    window.location.href = `/order?${params.toString()}`;
  };

  return (
    <div className="space-y-10">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-white/40 p-8 rounded-[32px] border border-white/60 shadow-sm backdrop-blur-md">
        <div>
          <h2 className="text-5xl font-black text-slate-900 tracking-tighter mb-2">Tutor Hub</h2>
          <p className="text-slate-500 font-bold tracking-wide">Ready to teach? Manage your profile and jobs.</p>
        </div>
        <button onClick={() => window.location.href = '/vacancies'} className="bg-gradient-to-r from-emerald-500 to-green-600 text-white px-8 py-4 rounded-2xl text-sm font-black shadow-[0_10px_30px_-10px_rgba(16,185,129,0.6)] hover:scale-105 transition-all flex items-center gap-3">
          <Briefcase size={20} /> Browse Jobs
        </button>
      </header>

      {!profile?.availability && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-white border border-red-200 text-red-700 p-6 rounded-[32px] flex items-center gap-5 shadow-sm">
          <div className="p-4 bg-red-50 rounded-2xl text-red-600"><AlertCircle className="h-6 w-6" /></div>
          <div>
            <h4 className="font-black text-base tracking-tight">Profile is Hidden</h4>
            <p className="text-sm font-medium mt-0.5 text-slate-600">Your availability is OFF. Students cannot see your profile in search.</p>
          </div>
          <button onClick={onFixProfile} className="ml-auto bg-red-600 px-6 py-3 rounded-xl text-sm font-black text-white shadow-sm hover:bg-red-700 transition-colors">Fix Now</button>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-6 grid grid-cols-2 gap-6">
          <div className="cursor-pointer group h-full" onClick={onShowApplications}>
            <StatCard label="Vacancies Applied" value={applicationsCount} icon={<Briefcase size={24} />} isTutor={true} />
          </div>
          <div className="cursor-pointer group h-full" onClick={onShowRequests}>
            <StatCard label="Student Requests" value={requestsCount} icon={<Users size={24} />} isTutor={true} />
          </div>
        </div>
        <div className="lg:col-span-6 flex flex-col justify-end">
          <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-4 ml-2">Featured Online Course</h3>
          {course ? <LatestCourseCard course={course} isTutor={true} /> : <div className="glass-panel p-10 rounded-[32px] border-dashed text-center text-slate-400 font-bold">No courses available</div>}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-7 flex flex-col gap-6">
          {profile?.verified ? (
            <div className="h-[250px] bg-gradient-to-br from-emerald-900 via-[#1a2e22] to-black rounded-[32px] p-8 md:p-10 text-white flex flex-col md:flex-row justify-between items-center shadow-[0_20px_50px_-15px_rgba(16,185,129,0.3)] border border-emerald-800 relative overflow-hidden group">
              <div className="relative z-10 text-center md:text-left mb-6 md:mb-0">
                <h3 className="text-4xl font-black tracking-tighter mb-3 text-emerald-400">Profile Boosted!</h3>
                <p className="text-emerald-100 font-bold max-w-[280px] tracking-wide leading-relaxed text-sm">Your profile is verified and getting 3× more visibility.</p>
              </div>
              <div className="relative z-10 bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 px-8 py-4 rounded-2xl font-black text-sm flex items-center gap-2 shadow-[0_0_30px_rgba(52,211,153,0.3)]">
                <CheckCircle size={20} /> Verified Status Active
              </div>
              <Sparkles size={160} className="absolute -right-8 top-1/2 -translate-y-1/2 opacity-10 text-emerald-400 pointer-events-none" />
            </div>
          ) : (
            <div className="h-[250px] bg-gradient-to-br from-slate-900 via-[#1a1c23] to-black rounded-[32px] p-8 md:p-10 text-white flex flex-col md:flex-row justify-between items-center shadow-[0_20px_50px_-15px_rgba(16,185,129,0.3)] border border-slate-800 relative overflow-hidden group">
              <div className="relative z-10 text-center md:text-left mb-6 md:mb-0">
                <h3 className="text-4xl font-black tracking-tighter mb-3">Boost Your Profile</h3>
                <p className="text-slate-400 font-bold max-w-[280px] tracking-wide leading-relaxed text-sm">Get verified and appear at the top of search results for students looking for your expertise.</p>
              </div>
              <button onClick={handleVerifyClick} className="relative z-10 bg-green-500 text-white px-8 py-4 rounded-2xl font-black text-sm hover:scale-105 hover:bg-green-400 shadow-[0_0_30px_rgba(34,197,94,0.4)] transition-all whitespace-nowrap">
                Get Verified
              </button>
              <Crown size={160} className="absolute -right-8 top-1/2 -translate-y-1/2 opacity-5 rotate-12 group-hover:rotate-0 transition-transform duration-700 text-green-500 blur-sm pointer-events-none" />
            </div>
          )}
          <UrgentVacanciesList vacancies={urgentVacancies} />
        </div>

        <div className="lg:col-span-5">
          <ChatBox userId={userId} userName={userName} isTutor={true} />
        </div>
      </div>
    </div>
  );
}

function StudentRequestsView({ requests, onUpdateStatus, onChatAdmin }: { requests: StudentRequest[]; onUpdateStatus: (id: number, status: string) => void; onChatAdmin: () => void }) {
  return (
    <div className="space-y-10">
      <h2 className="text-5xl font-black tracking-tighter text-slate-900 ml-2">Student Requests</h2>

      {requests.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-panel p-20 rounded-[40px] text-center border-dashed flex flex-col items-center justify-center gap-6">
          <div className="p-8 bg-slate-100/50 rounded-full shadow-inner text-slate-400"><Users size={64} /></div>
          <div>
            <p className="text-2xl font-black text-slate-800 mb-2">No Direct Requests Yet</p>
            <p className="text-slate-500 font-medium">Students can request your coaching directly from your profile.</p>
          </div>
        </motion.div>
      ) : (
        <div className="glass-panel rounded-[32px] overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-[11px] font-bold text-slate-500 uppercase tracking-widest bg-white/50 border-b border-white">
                <th className="py-4 pl-8">Student Info</th>
                <th className="py-4">Message & Details</th>
                <th className="py-4">Status</th>
                <th className="py-4 pr-8 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((req) => (
                <tr key={req.id} className="border-b border-slate-100/50 hover:bg-white/60 transition-colors group">
                  <td className="py-6 pl-8">
                    <p className="font-black text-slate-800 text-base">{req.student_name}</p>
                    <p className="text-[10px] text-slate-400 mt-1 tracking-widest uppercase">{new Date(req.created_at).toLocaleDateString()}</p>
                  </td>
                  <td className="py-6 pr-4">
                    <p className="text-sm font-bold text-slate-700 mb-1">Grade: <span className="text-emerald-600">{req.grade}</span> • Mode: <span className="text-blue-600">{req.preferred_mode || 'Any'}</span></p>
                    <p className="text-sm text-slate-500 italic line-clamp-2">"{req.message || 'No additional message provided.'}"</p>
                  </td>
                  <td className="py-6">
                    <select
                      value={req.status}
                      onChange={(e) => onUpdateStatus(req.id, e.target.value)}
                      aria-label="Update request status"
                      className={`text-xs font-black uppercase tracking-widest px-4 py-2.5 rounded-xl outline-none border cursor-pointer appearance-none shadow-sm transition-colors ${req.status === 'accepted' ? 'bg-green-50 text-green-700 border-green-200' : req.status === 'rejected' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-orange-50 text-orange-700 border-orange-200'}`}
                    >
                      <option value="pending">Pending</option>
                      <option value="accepted">Accept</option>
                      <option value="rejected">Reject</option>
                    </select>
                  </td>
                  <td className="py-6 pr-8 text-right">
                    <button onClick={onChatAdmin} className="inline-flex items-center gap-2 bg-slate-800 text-white px-4 py-2.5 rounded-xl text-xs font-black shadow-md hover:bg-slate-700 transition-all">
                      <MessageCircle size={14} /> Chat Admin
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function AvailableVacanciesView({ vacancies }: { vacancies: Vacancy[] }) {
  const urgentVacancies = vacancies.filter(v => v.urgent === true);

  return (
    <div className="space-y-10">
      <h2 className="text-5xl font-black tracking-tighter text-slate-900 ml-2">Urgent Job Board</h2>

      {urgentVacancies.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-panel p-20 rounded-[40px] text-center border-dashed flex flex-col items-center justify-center gap-6">
          <div className="p-8 bg-slate-100/50 rounded-full shadow-inner text-slate-400"><SearchX size={64} /></div>
          <div>
            <p className="text-2xl font-black text-slate-800 mb-2">No Urgent Openings Right Now</p>
            <p className="text-slate-500 font-medium">There are currently no urgent vacancies posted by students.</p>
          </div>
        </motion.div>
      ) : (
        <motion.div variants={staggerContainer} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {urgentVacancies.map((v) => (
            <motion.div key={v.id} variants={staggerItem} className="relative rounded-[32px] p-8 overflow-hidden group border border-red-500/20 bg-gradient-to-br from-slate-900 via-[#2d0a0f] to-black text-white shadow-[0_15px_40px_-10px_rgba(220,38,38,0.4)] hover:shadow-[0_20px_50px_-10px_rgba(220,38,38,0.6)] hover:-translate-y-1 transition-all">
              <div className="absolute top-0 right-0 w-64 h-64 bg-red-600 rounded-full blur-[80px] opacity-20 pointer-events-none group-hover:opacity-30 transition-opacity"></div>

              <div className="relative z-10 flex justify-between items-start mb-6">
                <span className="bg-red-500/20 text-red-400 border border-red-500/30 text-[10px] font-black px-3 py-1.5 rounded-lg uppercase tracking-wider flex items-center gap-1.5 shrink-0 shadow-inner">
                  <Flame size={14} /> Urgent Hire
                </span>
              </div>

              <div className="relative z-10 mb-8">
                <h3 className="text-2xl font-black text-white mb-2 leading-tight">{v.subject || 'Tuition Job'}</h3>
                <p className="font-black text-xl text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.3)]">{v.salary_range}</p>
              </div>

              <div className="relative z-10 space-y-4 flex-grow mb-8 border-t border-slate-700/50 pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-2.5 bg-slate-800 rounded-xl text-blue-400"><MapPin size={16} /></div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Location</p>
                    <p className="font-bold text-slate-200">{v.location}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="p-2.5 bg-slate-800 rounded-xl text-orange-400"><Clock size={16} /></div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Timing</p>
                    <p className="font-bold text-slate-200">{v.class_time}</p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => window.location.href = `/vacancies/${v.id}/apply`}
                className="relative z-10 w-full py-4 bg-red-600 text-white rounded-2xl font-black text-sm hover:bg-red-500 transition-colors shadow-[0_5px_15px_rgba(220,38,38,0.5)] flex justify-center items-center gap-2"
              >
                Apply Now <ExternalLink size={16} />
              </button>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}

function MyInfoView({ profile, onSave }: { profile: Tutor | null; onSave: (p: Partial<Tutor>) => Promise<boolean> }) {
  const [form, setForm] = useState({
    name: profile?.name || '',
    subject: profile?.subject?.join(', ') || '',
    location: profile?.location || '',
    experience: profile?.experience || '',
    education: profile?.education || '',
    bio: profile?.bio || '',
    contact_num: profile?.contact_num || '',
    mode_of_teaching: profile?.mode_of_teaching || '',
    hour_rate: profile?.hour_rate || '',
    availability: profile?.availability || false,
    cv_url: profile?.cv_url || '',
    id_url: profile?.id_url || ''
  });
  const [status, setStatus] = useState('');

  useEffect(() => {
    if (profile) {
      setForm({
        name: profile.name || '',
        subject: profile.subject?.join(', ') || '',
        location: profile.location || '',
        experience: profile.experience || '',
        education: profile.education || '',
        bio: profile.bio || '',
        contact_num: profile.contact_num || '',
        mode_of_teaching: profile.mode_of_teaching || '',
        hour_rate: profile.hour_rate || '',
        availability: profile.availability || false,
        cv_url: profile.cv_url || '',
        id_url: profile.id_url || ''
      });
    }
  }, [profile]);

  const handleSubmit = async () => {
    setStatus('Saving...');
    const subjectArray = form.subject.split(',').map(s => s.trim()).filter(Boolean);
    const success = await onSave({ ...form, subject: subjectArray });
    setStatus(success ? 'Saved successfully!' : 'Error saving. Please try again.');
    setTimeout(() => setStatus(''), 3000);
  };

  const fields = [
    { key: 'name', label: 'Full Name', icon: User, placeholder: 'e.g. John Doe', type: 'text' },
    { key: 'subject', label: 'Subjects (Comma Separated)', icon: BookOpen, placeholder: 'e.g. Math, Science', type: 'text' },
    { key: 'location', label: 'Location', icon: MapPin, placeholder: 'e.g. Kathmandu, Nepal', type: 'text' },
    { key: 'contact_num', label: 'Contact Number', icon: Phone, placeholder: 'e.g. +977-9800000000', type: 'text' },
    { key: 'education', label: 'Education', icon: GraduationCap, placeholder: 'e.g. BSc Computer Science', type: 'text' },
    { key: 'experience', label: 'Experience', icon: Briefcase, placeholder: 'e.g. 5 Years', type: 'text' },
    { key: 'mode_of_teaching', label: 'Mode of Teaching', icon: Monitor, placeholder: 'e.g. Online, Physical, Both', type: 'text' },
    { key: 'hour_rate', label: 'Hourly Rate (Rs)', icon: DollarSign, placeholder: 'e.g. 500', type: 'number' },
    { key: 'cv_url', label: 'CV / Resume URL', icon: LinkIcon, placeholder: 'https://drive.google.com/...', type: 'text' },
    { key: 'id_url', label: 'Government ID URL', icon: LinkIcon, placeholder: 'https://drive.google.com/...', type: 'text' },
  ];

  return (
    <div className="space-y-10 max-w-5xl">
      <h2 className="text-5xl font-black tracking-tighter text-slate-900 ml-2">My Info</h2>

      <div className="glass-panel p-10 rounded-[40px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] space-y-8 relative overflow-hidden">
        <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-green-50 rounded-full blur-3xl opacity-60 pointer-events-none"></div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
          {fields.map(({ key, label, icon: Icon, placeholder, type }) => (
            <div key={key} className="space-y-3">
              <label htmlFor={`field-${key}`} className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-2">{label}</label>
              <div className="flex items-center gap-4 bg-white shadow-sm p-4 rounded-2xl border border-slate-100 focus-within:ring-4 focus-within:ring-green-100 focus-within:border-green-400 transition-all group">
                <div className="p-2 bg-slate-50 rounded-xl group-focus-within:bg-green-50 transition-colors">
                  <Icon size={20} className="text-slate-400 group-focus-within:text-green-600" />
                </div>
                <input
                  id={`field-${key}`}
                  className="bg-transparent outline-none w-full font-black text-slate-800"
                  value={String(form[key as keyof typeof form])}
                  type={type}
                  onChange={e => setForm({ ...form, [key]: e.target.value })}
                  placeholder={placeholder}
                />
              </div>
            </div>
          ))}

          <div className="space-y-3 md:col-span-2 flex flex-col justify-center">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-2">Availability Settings</label>
            <div
              role="switch"
              aria-checked={form.availability}
              tabIndex={0}
              onClick={() => setForm({ ...form, availability: !form.availability })}
              onKeyDown={e => e.key === 'Enter' && setForm({ ...form, availability: !form.availability })}
              className={`cursor-pointer flex items-center justify-between p-6 rounded-3xl border transition-all shadow-sm ${form.availability ? 'bg-green-50/80 border-green-200' : 'bg-white border-slate-100'}`}
            >
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-2xl transition-colors ${form.availability ? 'bg-green-200/50' : 'bg-slate-50'}`}>
                  <Clock size={24} className={form.availability ? 'text-green-600' : 'text-slate-400'} />
                </div>
                <div>
                  <span className={`block text-lg font-black tracking-tight ${form.availability ? 'text-green-800' : 'text-slate-700'}`}>
                    {form.availability ? 'Available for New Students' : 'Currently Not Available'}
                  </span>
                  <span className="text-sm text-slate-400 font-medium">Toggle this to show up as active in student search</span>
                </div>
              </div>
              <div className={`flex w-16 h-9 rounded-full p-1.5 transition-colors ${form.availability ? 'bg-green-500' : 'bg-slate-200'}`}>
                <motion.div
                  layout
                  className="w-6 h-6 bg-white rounded-full shadow-sm"
                  animate={{ x: form.availability ? 28 : 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-3 relative z-10">
          <label htmlFor="bio-textarea" className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-2">Bio</label>
          <textarea
            id="bio-textarea"
            className="w-full bg-white shadow-sm p-6 rounded-[28px] border border-slate-100 focus:ring-4 focus:ring-green-100 focus:border-green-400 outline-none font-bold text-slate-800 resize-none h-40 transition-all"
            value={form.bio}
            onChange={e => setForm({ ...form, bio: e.target.value })}
            placeholder="Tell students about your teaching experience..."
          />
        </div>

        <div className="pt-8 flex items-center gap-6 border-t border-slate-200/60 relative z-10">
          <button onClick={handleSubmit} className="bg-gradient-to-r from-emerald-500 to-green-600 text-white px-10 py-4 rounded-2xl font-black shadow-[0_10px_30px_-10px_rgba(16,185,129,0.6)] hover:scale-105 transition-all flex items-center gap-3">
            <Save size={20} /> Save Profile
          </button>
          {status && (
            <span className={`font-black tracking-wide ${status.includes('Error') ? 'text-red-500' : 'text-emerald-600'}`}>
              {status}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function LatestCourseCard({ course, isTutor }: { course: OnlineCourse; isTutor: boolean }) {
  const offerPrice = course.fee;
  const originalPrice = course.discount > 0 ? Math.round(course.fee / (1 - course.discount / 100)) : course.fee;
  const hoverBorder = isTutor
    ? 'hover:border-green-400 hover:shadow-[0_20px_40px_-15px_rgba(16,185,129,0.2)]'
    : 'hover:border-blue-400 hover:shadow-[0_20px_40px_-15px_rgba(37,99,235,0.2)]';

  return (
    <div
      onClick={() => window.location.href = `/onlinecourse/${encodeURIComponent(course.title)}`}
      className={`glass-panel rounded-[32px] p-6 flex flex-col md:flex-row gap-6 items-center ${hoverBorder} transition-all duration-500 cursor-pointer group relative overflow-hidden`}
    >
      {course.discount > 0 && (
        <div className="absolute top-6 right-[-35px] bg-red-500 text-white font-black text-[10px] uppercase px-10 py-1.5 rotate-45 shadow-lg z-10 tracking-widest">
          {course.discount}% OFF
        </div>
      )}
      <div className="overflow-hidden rounded-2xl shrink-0 w-full md:w-32 h-40 md:h-32 shadow-md">
        <img src={course.cover_pic} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={course.title} />
      </div>
      <div className="flex-grow w-full">
        <h4 className="font-black text-xl mb-3 tracking-tight group-hover:text-slate-800 leading-tight">
          {course.title}
          <span className="inline-block bg-orange-100 border border-orange-200 text-orange-600 text-[10px] px-2.5 py-1 rounded-lg uppercase tracking-wider ml-2 align-middle font-bold shadow-sm">Online</span>
        </h4>
        {(course.start_datetime || course.timing) && (
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 mb-4 bg-white/50 w-fit px-3 py-1.5 rounded-xl border border-white">
            <Clock size={14} className={isTutor ? 'text-green-500' : 'text-blue-500'} />
            <span>
              {course.start_datetime ? new Date(course.start_datetime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}
              {course.start_datetime && course.timing ? ' · ' : ''}
              {course.timing || ''}
            </span>
          </div>
        )}
        <div className="flex items-end gap-3">
          <p className="text-slate-900 font-black text-3xl tracking-tighter">Rs. {offerPrice.toLocaleString()}</p>
          {course.discount > 0 && <p className="text-slate-400 font-bold text-sm line-through mb-1.5">Rs. {originalPrice.toLocaleString()}</p>}
        </div>
      </div>
    </div>
  );
}

// --- MODALS ---

function ApplicationsModal({ applications, onClose, onReject, onUpdateStatus }: any) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-4 md:p-6" role="dialog" aria-modal="true" aria-label="Applicant Tracking">
      <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 10 }} className="bg-white/90 backdrop-blur-2xl rounded-[40px] max-w-5xl w-full overflow-hidden flex flex-col shadow-[0_40px_80px_-20px_rgba(0,0,0,0.5)] border border-white/40 max-h-[90vh]">

        <div className="p-8 md:p-10 border-b border-slate-200/50 flex justify-between items-center bg-gradient-to-r from-blue-50/50 to-transparent">
          <div>
            <h3 className="text-3xl font-black tracking-tighter text-slate-900 mb-1 flex items-center gap-3"><Users className="text-blue-500" /> Applicant Tracking</h3>
            <p className="text-slate-500 font-bold tracking-wide">Review and manage tutors who applied to your vacancy.</p>
          </div>
          <button onClick={onClose} aria-label="Close modal" className="p-3 bg-white shadow-sm hover:shadow-md hover:scale-105 rounded-full transition-all border border-slate-100 text-slate-400 hover:text-slate-700"><X size={24} /></button>
        </div>

        <div className="flex-grow overflow-y-auto p-6 md:p-10 custom-scrollbar">
          {applications.length === 0 ? (
            <div className="text-center py-20 flex flex-col items-center">
              <div className="p-8 bg-slate-50 rounded-full mb-6 shadow-inner"><Users size={64} className="text-slate-300" /></div>
              <p className="font-black text-2xl text-slate-800 mb-2">No Applicants Yet.</p>
              <p className="text-slate-500 font-medium">When tutors apply, they will appear here.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {applications.map((app: any) => {
                const targetTutorId = app.tutors?.id;
                return (
                  <div key={app.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-[0_10px_30px_rgba(37,99,235,0.1)] hover:border-blue-200 transition-all flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 group">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                      <AvatarDisplay name={app.tutors?.name || app.applicant_name} url={app.tutors?.avatar_url} />
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <a href={targetTutorId ? `/tutors/${targetTutorId}` : '#'} target="_blank" rel="noreferrer" className="font-black text-xl text-slate-900 group-hover:text-blue-900 transition-colors flex items-center gap-1 hover:underline">
                            {app.tutors?.name || app.applicant_name} <ExternalLink size={14} className="text-slate-400" />
                          </a>
                          <StatusBadge status={app.status} />
                        </div>
                        <p className="text-sm font-bold text-blue-600 mb-2">{app.vacancies?.subject} <span className="text-slate-400 font-medium ml-2">— Applied on {new Date(app.created_at).toLocaleDateString()}</span></p>
                        <div className="flex flex-wrap gap-4 text-xs font-bold text-slate-500">
                          <span className="flex items-center gap-1.5"><MapPin size={14} className="text-slate-400" /> {app.tutors?.location || 'N/A'}</span>
                          <span className="flex items-center gap-1.5"><DollarSign size={14} className="text-emerald-500" /> Rs. {app.tutors?.hour_rate || 'N/A'}/hr</span>
                          <span className="flex items-center gap-1.5"><GraduationCap size={14} className="text-purple-500" /> {app.tutors?.education || 'N/A'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex w-full lg:w-auto gap-3 shrink-0 pt-4 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                      {app.status === 'pending' ? (
                        <>
                          <button onClick={() => onUpdateStatus(app.id, 'accepted')} className="flex-1 lg:flex-none px-6 py-3.5 bg-green-500 text-white rounded-2xl shadow-[0_5px_15px_rgba(34,197,94,0.3)] hover:bg-green-600 hover:-translate-y-1 transition-all font-black flex items-center justify-center gap-2">
                            <Check size={18} /> Accept
                          </button>
                          <button onClick={() => onUpdateStatus(app.id, 'rejected')} className="flex-1 lg:flex-none px-6 py-3.5 bg-white border border-slate-200 text-slate-600 rounded-2xl shadow-sm hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all font-black flex items-center justify-center gap-2">
                            <X size={18} /> Decline
                          </button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => onUpdateStatus(app.id, app.status === 'accepted' ? 'rejected' : 'accepted')} className="flex-1 lg:flex-none px-5 py-3.5 bg-orange-100 text-orange-700 rounded-2xl hover:bg-orange-200 transition-all font-black flex items-center justify-center gap-2">
                            <RotateCcw size={16} /> Undo ({app.status === 'accepted' ? 'Reject' : 'Accept'})
                          </button>
                          <button onClick={() => onReject(app.id)} className="w-full lg:w-auto px-5 py-3.5 bg-white border border-slate-200 text-slate-400 rounded-2xl shadow-sm hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all font-black flex items-center justify-center gap-2">
                            <Trash2 size={18} /> Remove Entry
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

function TutorApplicationsModal({ applications, onClose }: any) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-4 md:p-6" role="dialog" aria-modal="true" aria-label="Vacancies Applied">
      <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 10 }} className="bg-white/90 backdrop-blur-2xl rounded-[40px] max-w-5xl w-full overflow-hidden flex flex-col shadow-[0_40px_80px_-20px_rgba(0,0,0,0.5)] border border-white/40 max-h-[90vh]">
        <div className="p-8 md:p-10 border-b border-slate-200/50 flex justify-between items-center bg-gradient-to-r from-green-50/50 to-transparent">
          <div>
            <h3 className="text-3xl font-black tracking-tighter text-slate-900 mb-1 flex items-center gap-3"><Briefcase className="text-green-500" /> Vacancies Applied</h3>
            <p className="text-slate-500 font-bold tracking-wide">Track the status of jobs you have applied for.</p>
          </div>
          <button onClick={onClose} aria-label="Close modal" className="p-3 bg-white shadow-sm hover:shadow-md hover:scale-105 rounded-full transition-all border border-slate-100 text-slate-400 hover:text-slate-700"><X size={24} /></button>
        </div>

        <div className="flex-grow overflow-y-auto p-6 md:p-10 custom-scrollbar">
          {applications.length === 0 ? (
            <div className="text-center py-20 flex flex-col items-center">
              <div className="p-8 bg-slate-50 rounded-full mb-6 shadow-inner"><Briefcase size={64} className="text-slate-300" /></div>
              <p className="font-black text-2xl text-slate-800 mb-2">No Applications Yet.</p>
              <p className="text-slate-500 font-medium">Browse available jobs and apply to see them here.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {applications.map((app: any) => (
                <div key={app.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-[0_10px_30px_rgba(16,185,129,0.1)] hover:border-green-200 transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 group">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-black text-xl text-slate-900 group-hover:text-green-800 transition-colors">{app.vacancies?.subject}</h4>
                      <StatusBadge status={app.status} />
                    </div>
                    <div className="flex items-center gap-4 text-sm font-bold text-slate-500">
                      <span className="flex items-center gap-1.5"><MapPin size={14} className="text-slate-400" /> {app.vacancies?.location}</span>
                      <span className="flex items-center gap-1.5"><Clock size={14} className="text-slate-400" /> Applied: {new Date(app.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <a href={`/vacancies/${app.vacancy_id}`} className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-white border border-slate-200 text-slate-600 font-black text-sm rounded-2xl hover:bg-green-50 hover:text-green-600 hover:border-green-200 transition-all shadow-sm shrink-0">
                    View Job Details <ExternalLink size={16} />
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

function SkeletonLoader() {
  return (
    <div className="p-8 md:p-10 animate-pulse w-full" aria-label="Loading dashboard" role="status">
      <div className="glass-panel p-8 rounded-[32px] mb-10 border border-white/60">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div className="w-full md:w-1/2 space-y-4">
            <div className="h-12 bg-slate-200/60 rounded-2xl w-3/4"></div>
            <div className="h-5 bg-slate-200/60 rounded-xl w-1/2"></div>
          </div>
          <div className="h-14 bg-slate-200/60 rounded-2xl w-40 shrink-0"></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 mb-10">
        <div className="lg:col-span-5 h-56 bg-white/40 border border-white/60 rounded-[32px]"></div>
        <div className="lg:col-span-7 h-56 bg-white/40 border border-white/60 rounded-[32px]"></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-7 h-[500px] bg-white/40 border border-white/60 rounded-[32px]"></div>
        <div className="lg:col-span-5 h-[500px] bg-white/40 border border-white/60 rounded-[32px]"></div>
      </div>
    </div>
  );
}