"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard, FileText, BookOpen, LogOut, Plus,
  Users, Crown, Calendar, Star, Compass, Activity,
  X, Edit2, Check, MapPin, Clock, Copy,
  DollarSign, Trash2, Save, GraduationCap,
  Briefcase, User, ExternalLink, Phone, Monitor, SearchX, Send, Lock, MessageCircle, AlertCircle,
  CheckCircle, Flame, Sparkles, Link as LinkIcon, RotateCcw, Home, Award, ShoppingBag, PlayCircle,
  ChevronDown, ChevronUp, Video, Info, Shield, ArrowRight
} from "lucide-react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { createClient } from "@/lib/supabase/client";

// ─── TYPES ───────────────────────────────────────────────────────────────────

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
  tutor_name?: string;
  duration?: string;
  difficulty_level?: string;
}

interface Tutor {
  id: number;
  user_id: string;
  name: string;
  subject: string[];
  avatar_url?: string;
  verified?: boolean;
  education?: string;
  hour_rate?: string | number | null;
  location?: string;
  bio?: string;
  experience?: string | number | null;
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
  vacancies: { id: number; subject: string; location: string };
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
  tutors?: { name: string; hour_rate: string | number | null; location: string };
}

interface Order {
  id: string;
  full_name: string;
  email: string;
  contact_number: string;
  order_type: string;
  order_name: string;
  price: number;
  screenshot_url: string;
  status: string;
  created_at: string;
  admin_message?: any;
}

interface Certificate {
  id: number;
  name: string;
  syllabus_name: string;
  issue_date: string;
  certificate_code: string;
  email: string;
  status: string;
}

interface Enrollment {
  id: string;
  user_id: string;
  course_id: string;
  email: string;
  course_name: string;
  status: string;
  paid_amount: number;
  remaining_amount: number;
  starting_date: string;
  batch_no?: number;
  created_at: string;
}

interface CourseBatch {
  course_id: string;
  batch_no: number;
  online_class_link?: string;
  google_classroom_link?: string;
  whatsapp_group_link?: string;
  is_active: boolean;
  start_datetime?: string;
  timing?: string;
}

interface RecordingInfo {
  course_name: string;
  recording_link: string;
  cover_pic_url: string;
  category: string;
  course_hours: string;
  rating: number;
  enrolled_students: number;
  learning_outcomes: string[];
}

interface GlobalRecording {
  id: string;
  course_name: string;
  course_hours: string;
  standard_fee: number;
  discount: number;
  cover_pic_url: string;
}

interface OnlineCourseExt {
  id: string;
  title: string;
  category?: string;
  difficulty_level?: string;
  cover_pic: string;
  tutor_name: string;
  duration: string;
  timing: string;
  fee: number;
  discount: number;
  start_datetime: string;
  learning_outcomes: string[];
  faqs: string[];
  syllabus_url?: string;
  syllabus?: any;
}

// ─── MOTION VARIANTS ─────────────────────────────────────────────────────────

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } }
};

const staggerItem: Variants = {
  hidden: { opacity: 0, y: 20, scale: 0.98 },
  show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const router = useRouter();
  const supabase = createClient();

  const [activeTab, setActiveTab] = useState('Overview');
  const [loading, setLoading] = useState(true);

  const [isApplicationsOpen, setIsApplicationsOpen] = useState(false);
  const [appFilterId, setAppFilterId] = useState<number | null>(null);
  const [isExploreOpen, setIsExploreOpen] = useState(false);
  const [isCoursesOpen, setIsCoursesOpen] = useState(true);

  const [dashboardMode, setDashboardMode] = useState<'home' | 'student' | 'tutor'>('home');
  const [hasTutorProfile, setHasTutorProfile] = useState(false);

  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>('');
  const [userName, setUserName] = useState<string>('User');
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [userWhatsapp, setUserWhatsapp] = useState<string>('');

  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersError, setOrdersError] = useState<string | null>(null);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [courseBatches, setCourseBatches] = useState<CourseBatch[]>([]);
  const [recordingsList, setRecordingsList] = useState<RecordingInfo[]>([]);
  const [onlineCourseDetails, setOnlineCourseDetails] = useState<OnlineCourseExt[]>([]);

  const [vacancies, setVacancies] = useState<Vacancy[]>([]);
  const [verifiedTutors, setVerifiedTutors] = useState<Tutor[]>([]);
  const [appliedTutors, setAppliedTutors] = useState<ApplicationJoin[]>([]);
  const [applicantCount, setApplicantCount] = useState(0);
  const [studentMyRequests, setStudentMyRequests] = useState<StudentRequest[]>([]);

  const [latestCourse, setLatestCourse] = useState<OnlineCourse | null>(null);
  const [globalRecordings, setGlobalRecordings] = useState<GlobalRecording[]>([]);

  const [tutorProfile, setTutorProfile] = useState<Tutor | null>(null);
  const [tutorApplications, setTutorApplications] = useState<TutorApplicationJoin[]>([]);
  const [allVacancies, setAllVacancies] = useState<Vacancy[]>([]);
  const [urgentVacancies, setUrgentVacancies] = useState<Vacancy[]>([]);
  const [studentRequests, setStudentRequests] = useState<StudentRequest[]>([]);

  const pendingVerificationOrders = useMemo(() =>
    orders.filter(o => o.status.toLowerCase() === 'pending' || o.status.toLowerCase() === 'processing'), [orders]);
  const pendingCoursePayments = useMemo(() => enrollments.filter(e => e.remaining_amount > 0), [enrollments]);
  const activeCourseAccess = useMemo(() => enrollments, [enrollments]); // All valid enrollments count as active access visually.
  const recordingOrdersVerified = useMemo(() =>
    orders.filter(o => o.order_type === 'recording' && o.status.toLowerCase() === 'verified'), [orders]);

  useEffect(() => { document.title = `GyanHub | ${activeTab}`; }, [activeTab]);

  useEffect(() => {
    const sharedTabs = ['Overview', 'Online Courses', 'Recording Courses', 'My Certificates', 'Transactions', 'Support Chatbot'];
    if (dashboardMode === 'home') {
      if (!sharedTabs.includes(activeTab)) setActiveTab('Overview');
    } else if (dashboardMode === 'tutor' && hasTutorProfile) {
      if (!sharedTabs.includes(activeTab) && !['Dashboard', 'Available Vacancies', 'Student Requests', 'My Info'].includes(activeTab))
        setActiveTab('Dashboard');
    } else if (dashboardMode === 'student') {
      if (!sharedTabs.includes(activeTab) && !['Dashboard', 'Posted Vacancies', 'My Requests'].includes(activeTab))
        setActiveTab('Dashboard');
    }
  }, [dashboardMode, hasTutorProfile, activeTab]);

  const fetchNeutralData = useCallback(async (email: string, uid: string) => {
    if (!email || !uid) return;
    try {
      const [ordersRes, certsRes, enrollRes, recordingsRes] = await Promise.all([
        supabase.from('orders').select('*').ilike('email', email).order('created_at', { ascending: false }),
        supabase.from('certificates').select('*').ilike('email', email),
        supabase.from('enrollments').select('*').or(`user_id.eq.${uid},email.ilike.${email}`).order('created_at', { ascending: false }),
        supabase.from('recordings').select('course_name, recording_link, cover_pic_url, category, course_hours, rating, enrolled_students, learning_outcomes')
      ]);

      if (ordersRes.error) setOrdersError(ordersRes.error.message);
      else if (ordersRes.data) { setOrders(ordersRes.data as any); setOrdersError(null); }

      if (certsRes.data) setCertificates(certsRes.data as any);
      if (recordingsRes.data) setRecordingsList(recordingsRes.data as any);

      if (enrollRes.data && enrollRes.data.length > 0) {
        const enrolls = enrollRes.data as Enrollment[];
        setEnrollments(enrolls);
        const courseIds = Array.from(new Set(enrolls.map(e => e.course_id)));
        const [coursesRes, batchesRes] = await Promise.all([
          supabase.from('online_courses').select('id, title, category, difficulty_level, cover_pic, tutor_name, duration, timing, fee, discount, start_datetime, learning_outcomes, syllabus_url, syllabus, faqs').in('id', courseIds),
          supabase.from('course_batches').select('*').in('course_id', courseIds)
        ]);
        if (coursesRes.data) setOnlineCourseDetails(coursesRes.data as any);
        if (batchesRes.data) setCourseBatches(batchesRes.data as any);
      }
    } catch (err) {
      console.warn("Neutral tables fetch exception:", err);
    }
  }, [supabase]);

  const fetchStudentData = useCallback(async (uid: string, email: string) => {
    try {
      let vacancyQuery = supabase.from('vacancies').select('*').order('created_at', { ascending: false });
      if (email && email.trim() !== '') vacancyQuery = vacancyQuery.or(`user_id.eq.${uid},email.ilike.${email}`);
      else vacancyQuery = vacancyQuery.eq('user_id', uid);

      const { data: vData } = await vacancyQuery;
      const activeVacs = (vData || []).filter((v: any) => v.status === true);
      const vIds = activeVacs.map((v: any) => v.id);

      if (vIds.length > 0) {
        const { data: appData } = await supabase
          .from('vacancy_applications')
          .select(`id, status, vacancy_id, created_at, applicant_name, user_id, vacancies ( subject, location ), tutors ( id, user_id, name, avatar_url, education, hour_rate, location )`)
          .in('vacancy_id', vIds)
          .order('created_at', { ascending: false });

        if (appData) {
          const appCountMap: Record<number, number> = {};
          appData.forEach((app: any) => { appCountMap[app.vacancy_id] = (appCountMap[app.vacancy_id] || 0) + 1; });
          const formattedApps = appData.map((app: any) => ({
            ...app,
            vacancies: Array.isArray(app.vacancies) ? app.vacancies[0] : app.vacancies,
            tutors: Array.isArray(app.tutors) ? app.tutors[0] : app.tutors || { name: app.applicant_name }
          }));
          setAppliedTutors(formattedApps as any);
          setApplicantCount(appData.length);
          setVacancies(activeVacs.map((v: any) => ({ ...v, applicant_count: appCountMap[v.id] || 0 })));
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
      if (myReqs) setStudentMyRequests(myReqs as any);
    } catch (err) {
      console.error("Fetch Student Data Error:", err);
    }
  }, [supabase]);

  const fetchGlobalData = useCallback(async () => {
    const { data: cData } = await supabase
      .from('online_courses')
      .select('id, title, fee, start_datetime, cover_pic, discount, tutor_name, duration, timing, difficulty_level')
      .gte('start_datetime', new Date().toISOString())
      .order('start_datetime', { ascending: true })
      .limit(1)
      .maybeSingle();
    if (cData) setLatestCourse(cData as any);

    const { data: tData } = await supabase.from('tutors').select('*').eq('verified', true).limit(10);
    if (tData) setVerifiedTutors(tData as any);

    const { data: recData } = await supabase
      .from('recordings')
      .select('id, course_name, course_hours, standard_fee, discount, cover_pic_url')
      .eq('is_active', true)
      .limit(3);
    if (recData) setGlobalRecordings(recData as any);
  }, [supabase]);

  const fetchTutorData = useCallback(async (uid: string) => {
    try {
      const { data: profile } = await supabase.from('tutors').select('*').eq('user_id', uid).maybeSingle();
      let currentTutorId: number | null = null;

      if (profile) {
        setTutorProfile(profile as any);
        setHasTutorProfile(true);
        currentTutorId = profile.id;
        if (profile.name && userName === 'User') setUserName(profile.name);
        if (profile.avatar_url && !userAvatar) setUserAvatar(profile.avatar_url);
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
      if (tutorAppsData) setTutorApplications(tutorAppsData as any);

      if (currentTutorId) {
        const { data: requestsData } = await supabase
          .from('student_requests').select('*').eq('tutor_id', currentTutorId).order('created_at', { ascending: false });
        if (requestsData) setStudentRequests(requestsData as any);
      }
    } catch (err) {
      console.error("Tutor Data Fetch Error:", err);
      setHasTutorProfile(false);
    }
  }, [supabase, userName, userAvatar]);

  const initProfile = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) { setLoading(false); router.push("/login?next=/profile"); return; }
      setUserId(user.id);
      setUserEmail(user.email || '');
      setUserName(user.user_metadata?.full_name || user.email?.split('@')[0] || 'User');
      setUserWhatsapp(user.user_metadata?.whatsapp || '');
      setUserAvatar(user.user_metadata?.avatar_url || null);
      await Promise.allSettled([
        fetchNeutralData(user.email || '', user.id),
        fetchStudentData(user.id, user.email || ''),
        fetchGlobalData(),
        fetchTutorData(user.id)
      ]);
    } catch (err) {
      console.error("Critical Initialization Error:", err);
    } finally {
      setLoading(false);
    }
  }, [fetchNeutralData, fetchStudentData, fetchGlobalData, fetchTutorData, router, supabase]);

  useEffect(() => {
    initProfile();
    const handlePopState = () => initProfile();
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [initProfile]);

  useEffect(() => {
    if (!userId) return;
    const channel = supabase.channel('realtime_dashboard_updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vacancy_applications' }, () => {
        fetchStudentData(userId, userEmail); fetchTutorData(userId);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'student_requests' }, () => {
        fetchStudentData(userId, userEmail); fetchTutorData(userId);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userId, userEmail, fetchStudentData, fetchTutorData, supabase]);

  const scrollToChatbox = () => {
    setActiveTab('Support Chatbot');
    setTimeout(() => {
      const el = document.getElementById('chatbox-section');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const openApplicationsModal = (vacancyId: number | null = null) => {
    setAppFilterId(vacancyId);
    setIsApplicationsOpen(true);
  };

  const handleUpdateStatus = async (applicationId: number, newStatus: string) => {
    setAppliedTutors(prev => prev.map(app => app.id === applicationId ? { ...app, status: newStatus } : app));
    await supabase.from('vacancy_applications').update({ status: newStatus }).eq('id', applicationId);
  };

  const handleRejectApplication = async (applicationId: number) => {
    setAppliedTutors(prev => prev.filter(app => app.id !== applicationId));
    setApplicantCount(prev => Math.max(0, prev - 1));
    await supabase.from('vacancy_applications').delete().eq('id', applicationId);
  };

  const handleUpdateStudentRequest = async (requestId: number, newStatus: string) => {
    setStudentRequests(prev => prev.map(req => req.id === requestId ? { ...req, status: newStatus } : req));
    await supabase.from('student_requests').update({ status: newStatus }).eq('id', requestId);
  };

  const handleCancelMyRequest = async (requestId: number) => {
    setStudentMyRequests(prev => prev.filter(req => req.id !== requestId));
    await supabase.from('student_requests').delete().eq('id', requestId);
  };

  const handleUpdateVacancy = async (updatedVacancy: Vacancy) => {
    const { error } = await supabase.from('vacancies').update({
      subject: updatedVacancy.subject, location: updatedVacancy.location, salary_range: updatedVacancy.salary_range,
      class_time: updatedVacancy.class_time, class_level: updatedVacancy.class_level, student_gender_pref: updatedVacancy.student_gender_pref
    }).eq('id', updatedVacancy.id);
    if (!error) setVacancies(prev => prev.map(v => v.id === updatedVacancy.id ? updatedVacancy : v));
  };

  const handleDeleteVacancy = async (id: number) => {
    const { error } = await supabase.from('vacancies').update({ status: false }).eq('id', id);
    if (!error) setVacancies(prev => prev.filter(v => v.id !== id));
  };

  const handleUpdateTutorInfo = async (updatedData: Partial<Tutor>): Promise<boolean> => {
    if (!userId) return false;
    try {
      const dataToSave: any = { ...updatedData, user_id: userId };
      for (const key in updatedData) {
        if (updatedData[key as keyof Tutor] === '') dataToSave[key] = null;
      }
      if (dataToSave.hour_rate !== null && dataToSave.hour_rate !== undefined)
        dataToSave.hour_rate = Number(dataToSave.hour_rate);
      if (dataToSave.experience !== null && dataToSave.experience !== undefined)
        dataToSave.experience = Number(dataToSave.experience);

      const { data: existing } = await supabase.from('tutors').select('id').eq('user_id', userId).maybeSingle();
      let error;
      if (existing?.id) { const res = await supabase.from('tutors').update(dataToSave).eq('id', existing.id); error = res.error; }
      else { const res = await supabase.from('tutors').insert([dataToSave]); error = res.error; }
      if (!error) {
        const { data: refreshed } = await supabase.from('tutors').select('*').eq('user_id', userId).single();
        if (refreshed) setTutorProfile(refreshed);
        setHasTutorProfile(true);
        if (updatedData.name) setUserName(updatedData.name);
        return true;
      } else { console.error("Supabase save error:", error.message); return false; }
    } catch (e) { console.error("Save error:", e); return false; }
  };

  const handleSaveProfileHeader = async (newName: string, newWhatsapp: string) => {
    setUserName(newName); setUserWhatsapp(newWhatsapp);
    await supabase.auth.updateUser({ data: { full_name: newName, whatsapp: newWhatsapp } });
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    const d = new Date(dateString);
    return isNaN(d.getTime()) ? 'N/A' : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const isTutorMode = dashboardMode === 'tutor';
  const isStudentMode = dashboardMode === 'student';

  return (
    <div className="min-h-screen bg-[#F0F4F8] text-slate-900 pb-32 lg:pb-20 font-sans overflow-x-hidden relative flex flex-col">
      {pendingVerificationOrders.length > 0 && (
        <div className="bg-amber-100 border-b border-amber-200 text-amber-800 py-2.5 overflow-hidden relative flex items-center z-50">
          <div className="animate-marquee whitespace-nowrap flex gap-10 font-black text-xs uppercase tracking-widest">
            {[1,2,3].map(i => (
              <span key={i}>Your payment is initiated and will be verified within 24 hours. Please have patience. (तपाईंको भुक्तानी सुरु गरिएको छ र २४ घण्टा भित्र प्रमाणित गरिनेछ। कृपया धैर्य गर्नुहोस्।)</span>
            ))}
          </div>
        </div>
      )}

      <div className="fixed inset-0 pointer-events-none z-0 opacity-[0.02]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}></div>
      <div className="fixed top-0 left-0 w-full h-[500px] bg-gradient-to-br from-blue-100/40 via-transparent to-transparent pointer-events-none -z-10"></div>
      <div className="fixed bottom-0 right-0 w-full h-[500px] bg-gradient-to-tl from-slate-200/50 via-transparent to-transparent pointer-events-none -z-10"></div>

      <style>{`
        @keyframes marquee { 0% { transform: translateX(0%); } 100% { transform: translateX(-50%); } }
        .animate-marquee { animation: marquee 30s linear infinite; }
        .animate-marquee:hover { animation-play-state: paused; }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 8px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
        .glass-panel { background: rgba(255, 255, 255, 0.65); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.8); }
        .shadow-soft { box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.03); }
        .shadow-medium { box-shadow: 0 12px 30px -5px rgba(0, 0, 0, 0.06); }
        .shadow-strong { box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.1), 0 0 40px rgba(99, 102, 241, 0.05); }
      `}</style>

      {/* Floating Chat Button */}
      <div className="fixed bottom-[100px] lg:bottom-10 right-4 lg:right-6 z-[60]">
        <motion.button
          onClick={scrollToChatbox}
          animate={{ y: [0, -8, 0] }}
          transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
          className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white px-5 py-3.5 rounded-xl shadow-[0_10px_25px_rgba(79,70,229,0.4)] flex items-center gap-2 font-black text-sm hover:scale-105 transition-transform border border-indigo-400/50"
        >
          <MessageCircle size={18} className="fill-white/20" /> GyanHub Support
        </motion.button>
      </div>

      <AnimatePresence>
        {isApplicationsOpen && isStudentMode && (
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
      <nav className="sticky top-0 z-40 bg-white/70 backdrop-blur-2xl border-b border-white/40 h-24 flex items-center px-6 shadow-soft">
        <div className="max-w-7xl mx-auto w-full flex justify-between items-center">
          <div className="hidden sm:flex items-center gap-3">
            {userAvatar ? (
              <img src={userAvatar} className="w-11 h-11 rounded-lg object-cover shadow-sm border border-slate-200" alt={userName} />
            ) : (
              <div className="w-11 h-11 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-lg flex items-center justify-center text-white font-black text-2xl shadow-sm">
                {userName?.charAt(0).toUpperCase() || 'G'}
              </div>
            )}
            <p className="flex items-center gap-2 text-[22px] font-extrabold tracking-tight">
              <span className="bg-gradient-to-r from-slate-900 via-slate-700 to-slate-500 bg-clip-text text-transparent">{userName}</span>
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Gyan Hub</span>
              {dashboardMode !== 'home' && (
                <span className={`ml-2 text-[10px] uppercase tracking-[0.12em] px-3 py-1 rounded-md font-semibold border backdrop-blur-sm ${isTutorMode ? 'bg-green-100/60 text-green-700 border-green-200' : 'bg-blue-100/60 text-blue-700 border-blue-200'}`}>
                  {isTutorMode ? 'Tutor Mode' : 'Student Mode'}
                </span>
              )}
            </p>
          </div>

          <div className="relative hidden md:flex items-center bg-slate-200/50 p-1.5 rounded-lg border border-white shadow-inner backdrop-blur-md">
            {(['home', 'student', 'tutor'] as const).map(mode => (
              <button key={mode} onClick={() => { setDashboardMode(mode); setActiveTab(mode === 'home' ? 'Overview' : 'Dashboard'); }} className="relative px-5 py-2 z-10 font-black text-sm transition-colors w-24 text-center">
                <span className={dashboardMode === mode ? (mode === 'tutor' ? 'text-green-600' : mode === 'student' ? 'text-blue-600' : 'text-slate-800') : 'text-slate-500 hover:text-slate-700'}>
                  {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </span>
                {dashboardMode === mode && <motion.div layoutId="modeSwitch" className="absolute inset-0 bg-white shadow-sm rounded-md -z-10 border border-slate-100" />}
              </button>
            ))}
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 mt-10 grid grid-cols-1 lg:grid-cols-12 gap-10 relative flex-grow">
        {/* Sidebar */}
        <aside className="hidden lg:block lg:col-span-3">
          <div className="glass-panel rounded-xl p-4 sticky top-32 space-y-2 shadow-soft h-[calc(100vh-160px)] overflow-y-auto custom-scrollbar">
            {dashboardMode === 'home' && (
              <NavButton icon={<Home size={20} />} label="Overview" active={activeTab === 'Overview'} onClick={() => setActiveTab('Overview')} color="text-slate-700" />
            )}
            {dashboardMode === 'tutor' && (
              hasTutorProfile ? (
                <>
                  <NavButton icon={<LayoutDashboard size={20} />} label="Dashboard" active={activeTab === 'Dashboard'} onClick={() => setActiveTab('Dashboard')} isTutor={true} />
                  <NavButton icon={<Briefcase size={20} />} label="Job Board" active={activeTab === 'Available Vacancies'} onClick={() => setActiveTab('Available Vacancies')} isTutor={true} />
                  <NavButton icon={<Users size={20} />} label="Student Requests" active={activeTab === 'Student Requests'} onClick={() => setActiveTab('Student Requests')} isTutor={true} />
                  <NavButton icon={<User size={20} />} label="My Info" active={activeTab === 'My Info'} onClick={() => setActiveTab('My Info')} isTutor={true} />
                </>
              ) : (
                <NavButton icon={<LayoutDashboard size={20} />} label="Dashboard" active={true} onClick={() => {}} isTutor={true} />
              )
            )}
            {dashboardMode === 'student' && (
              hasTutorProfile ? (
                <NavButton icon={<LayoutDashboard size={20} />} label="Dashboard" active={true} onClick={() => {}} isTutor={false} />
              ) : (
                <>
                  <NavButton icon={<LayoutDashboard size={20} />} label="Dashboard" active={activeTab === 'Dashboard'} onClick={() => setActiveTab('Dashboard')} isTutor={false} />
                  <NavButton icon={<FileText size={20} />} label="My Postings" active={activeTab === 'Posted Vacancies'} onClick={() => setActiveTab('Posted Vacancies')} isTutor={false} />
                  <NavButton icon={<Users size={20} />} label="My Requests" active={activeTab === 'My Requests'} onClick={() => setActiveTab('My Requests')} isTutor={false} />
                </>
              )
            )}

            <div className="h-px bg-slate-200/60 my-6 mx-4" />
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-5 mb-2">My Learning Hub</p>

            <div className="flex flex-col w-full">
              <button
                onClick={() => setIsCoursesOpen(!isCoursesOpen)}
                className={`w-full flex items-center justify-between px-5 py-4 rounded-lg text-[14px] font-black transition-all duration-300 ${(activeTab === 'Online Courses' || activeTab === 'Recording Courses') ? 'bg-blue-50/80 text-blue-700 shadow-sm translate-x-1 border border-blue-200/50' : 'text-slate-600/80 hover:bg-white hover:shadow-soft hover:text-slate-900 border border-transparent'}`}
              >
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-md transition-colors ${(activeTab === 'Online Courses' || activeTab === 'Recording Courses') ? 'bg-blue-200/50' : 'bg-transparent'}`}>
                    <BookOpen size={20} />
                  </div>
                  <span>My Courses</span>
                </div>
                {isCoursesOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              <AnimatePresence>
                {isCoursesOpen && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="flex flex-col gap-1 pl-[60px] pr-4 overflow-hidden pt-1 pb-2">
                    <button onClick={() => setActiveTab('Online Courses')} className={`text-[13px] font-bold py-2 text-left transition-colors ${activeTab === 'Online Courses' ? 'text-blue-600 border-l-2 border-blue-500 pl-2 -ml-[2px]' : 'text-slate-500 hover:text-blue-600 border-l-2 border-transparent pl-2 -ml-[2px]'}`}>Online Classes</button>
                    <button onClick={() => setActiveTab('Recording Courses')} className={`text-[13px] font-bold py-2 text-left transition-colors ${activeTab === 'Recording Courses' ? 'text-indigo-600 border-l-2 border-indigo-500 pl-2 -ml-[2px]' : 'text-slate-500 hover:text-indigo-600 border-l-2 border-transparent pl-2 -ml-[2px]'}`}>Recordings</button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <NavButton icon={<Award size={20} />} label="My Certificates" active={activeTab === 'My Certificates'} onClick={() => setActiveTab('My Certificates')} color="text-slate-700" />
            <NavButton icon={<DollarSign size={20} />} label="Transactions" active={activeTab === 'Transactions'} onClick={() => setActiveTab('Transactions')} color="text-slate-700" />
            <NavButton icon={<MessageCircle size={20} />} label="Support Chatbot" active={activeTab === 'Support Chatbot'} onClick={() => setActiveTab('Support Chatbot')} color="text-slate-700" />

            <div className="h-px bg-slate-200/60 my-6 mx-4" />

            <button onClick={() => setIsExploreOpen(!isExploreOpen)} className="w-full flex items-center justify-between px-5 py-4 rounded-lg text-[14px] font-black text-slate-600/80 hover:bg-white hover:shadow-soft hover:text-slate-900 transition-all duration-300">
              <div className="flex items-center gap-4">
                <div className="p-2 rounded-md bg-slate-100/80"><Compass size={20} className="text-slate-500" /></div>
                <span>Explore More</span>
              </div>
              {isExploreOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            <AnimatePresence>
              {isExploreOpen && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="flex flex-col gap-2 pl-[60px] pr-4 overflow-hidden pb-2">
                  <Link href="/onlinecourse" className="text-sm font-bold text-slate-500 hover:text-blue-600 py-1.5 transition-colors block">Live Courses</Link>
                  <Link href="/recording" className="text-sm font-bold text-slate-500 hover:text-blue-600 py-1.5 transition-colors block">Recordings</Link>
                  <Link href="/become-a-tutor" className="text-sm font-bold text-slate-500 hover:text-blue-600 py-1.5 transition-colors block">Become a Tutor</Link>
                  <Link href="/post-tuition" className="text-sm font-bold text-slate-500 hover:text-blue-600 py-1.5 transition-colors block">Post a Vacancy</Link>
                </motion.div>
              )}
            </AnimatePresence>

            <a href="https://wa.me/9763695665" target="_blank" rel="noopener noreferrer" className="w-full flex items-center gap-4 px-5 py-4 rounded-lg text-[14px] font-black text-emerald-600 hover:bg-emerald-50 hover:shadow-soft transition-all duration-300 mt-2">
              <div className="p-2 rounded-md bg-emerald-100/80"><Phone size={20} className="text-emerald-600" /></div>
              <span>WhatsApp GyanHub</span>
            </a>

            <div className="h-px bg-slate-200/60 my-6 mx-4" />
            <NavButton icon={<LogOut size={20} />} label="Signout" color="text-red-500" onClick={handleSignOut} isTutor={isTutorMode} />
          </div>
        </aside>

        {/* Main Content */}
        <main className="lg:col-span-9 w-full relative z-10" aria-busy={loading}>
          {loading ? <SkeletonLoader /> : (
            <AnimatePresence mode="wait">
              <motion.div
                key={`${activeTab}-${dashboardMode}`}
                initial={{ opacity: 0, y: 30, filter: "blur(8px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -20, filter: "blur(8px)" }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="w-full"
              >
                {/* LOCKED STATES */}
                {dashboardMode === 'tutor' && !hasTutorProfile && (
                  <div className="glass-panel p-10 lg:p-16 rounded-xl text-center flex flex-col items-center justify-center min-h-[60vh] shadow-medium relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-20 opacity-5"><Lock size={300} /></div>
                    <div className="w-24 h-24 bg-red-50 text-red-500 rounded-xl flex items-center justify-center mb-8 shadow-inner rotate-3"><Lock size={40} /></div>
                    <h2 className="text-4xl font-black text-slate-900 mb-4 tracking-tight relative z-10">Tutor Profile Locked</h2>
                    <p className="text-lg text-slate-600/80 font-medium max-w-md mx-auto mb-10 relative z-10">You need an approved tutor profile to access this dashboard.</p>
                    <button onClick={() => window.location.href = '/become-a-tutor'} className="bg-gradient-to-r from-emerald-500 to-green-600 text-white px-10 py-4 rounded-lg font-black shadow-[0_10px_30px_-10px_rgba(16,185,129,0.8)] hover:scale-[1.02] transition-all relative z-10">Setup Tutor Profile</button>
                  </div>
                )}
                {dashboardMode === 'student' && hasTutorProfile && (
                  <div className="glass-panel p-10 lg:p-16 rounded-xl text-center flex flex-col items-center justify-center min-h-[60vh] shadow-medium relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-20 opacity-5"><Briefcase size={300} /></div>
                    <div className="w-24 h-24 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center mb-8 shadow-inner -rotate-3"><Briefcase size={40} /></div>
                    <h2 className="text-4xl font-black text-slate-900 mb-4 tracking-tight relative z-10">Student View Restricted</h2>
                    <p className="text-lg text-slate-600/80 font-medium max-w-md mx-auto mb-10 relative z-10">You are registered as a Tutor. Please use the Tutor Dashboard.</p>
                    <button onClick={() => { setDashboardMode('tutor'); setActiveTab('Dashboard'); }} className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-10 py-4 rounded-lg font-black shadow-[0_10px_30px_-10px_rgba(37,99,235,0.8)] hover:scale-[1.02] transition-all relative z-10">Go to Tutor Hub</button>
                  </div>
                )}

                {/* UNIVERSAL VIEWS */}
                {activeTab === 'Overview' && dashboardMode === 'home' && (
                  <AccountOverviewView
                    userName={userName} userEmail={userEmail} userWhatsapp={userWhatsapp} onSaveUser={handleSaveProfileHeader}
                    orders={orders} enrollments={enrollments} certificates={certificates}
                    onNavigate={(tab: string) => setActiveTab(tab)}
                    pendingVerificationOrders={pendingVerificationOrders}
                    pendingCoursePayments={pendingCoursePayments}
                    activeCourseAccess={activeCourseAccess}
                    recordingOrdersVerified={recordingOrdersVerified}
                    onlineCourseDetails={onlineCourseDetails}
                  />
                )}
                {activeTab === 'Online Courses' && (
                  <MyCoursesView activeTab={activeTab} enrollments={enrollments} onlineCourseDetails={onlineCourseDetails} courseBatches={courseBatches} pendingVerificationOrders={pendingVerificationOrders} orders={orders} recordingsList={recordingsList} router={router} />
                )}
                {activeTab === 'Recording Courses' && (
                  <MyCoursesView activeTab={activeTab} enrollments={enrollments} onlineCourseDetails={onlineCourseDetails} courseBatches={courseBatches} pendingVerificationOrders={pendingVerificationOrders} orders={orders} recordingsList={recordingsList} router={router} />
                )}
                {activeTab === 'My Certificates' && <MyCertificatesView certificates={certificates} formatDate={formatDate} />}
                {activeTab === 'Transactions' && <TransactionsView orders={orders} ordersError={ordersError} enrollments={enrollments} formatDate={formatDate} />}
                {activeTab === 'Support Chatbot' && (
                  <div className="space-y-6">
                    <h2 className="text-5xl font-black tracking-tighter text-slate-900 ml-2">Support Chat</h2>
                    <ChatBox userId={userId} userName={userName} isTutor={isTutorMode} />
                  </div>
                )}

                {/* STUDENT VIEWS */}
                {dashboardMode === 'student' && !hasTutorProfile && activeTab === 'Dashboard' && (
                  <DashboardView userId={userId} userName={userName} count={applicantCount} course={latestCourse} verifiedTutors={verifiedTutors} onShowApplications={() => openApplicationsModal()} globalRecordings={globalRecordings} />
                )}
                {dashboardMode === 'student' && !hasTutorProfile && activeTab === 'Posted Vacancies' && (
                  <VacanciesView vacancies={vacancies} onUpdate={handleUpdateVacancy} onDelete={handleDeleteVacancy} onViewApplicants={openApplicationsModal} />
                )}
                {dashboardMode === 'student' && !hasTutorProfile && activeTab === 'My Requests' && (
                  <StudentMyRequestsView requests={studentMyRequests} onCancel={handleCancelMyRequest} onChatAdmin={scrollToChatbox} />
                )}

                {/* TUTOR VIEWS */}
                {dashboardMode === 'tutor' && hasTutorProfile && activeTab === 'Dashboard' && (
                  <TutorDashboardView profile={tutorProfile} userId={userId} userName={userName} userEmail={userEmail} applicationsCount={tutorApplications.length} requestsCount={studentRequests.length} course={latestCourse} urgentVacancies={urgentVacancies} onShowApplications={() => openApplicationsModal()} onShowRequests={() => setActiveTab('Student Requests')} onFixProfile={() => setActiveTab('My Info')} globalRecordings={globalRecordings} />
                )}
                {dashboardMode === 'tutor' && hasTutorProfile && activeTab === 'Available Vacancies' && (
                  <AvailableVacanciesView vacancies={allVacancies} />
                )}
                {dashboardMode === 'tutor' && hasTutorProfile && activeTab === 'Student Requests' && (
                  <StudentRequestsView requests={studentRequests} onUpdateStatus={handleUpdateStudentRequest} onChatAdmin={scrollToChatbox} />
                )}
                {dashboardMode === 'tutor' && hasTutorProfile && activeTab === 'My Info' && (
                  <MyInfoView profile={tutorProfile} onSave={handleUpdateTutorInfo} />
                )}
              </motion.div>
            </AnimatePresence>
          )}
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      <nav className="lg:hidden fixed bottom-6 left-6 right-6 z-50 glass-panel shadow-[0_20px_40px_rgba(0,0,0,0.15)] rounded-xl p-2 flex justify-between items-center px-4">
        <MobileNavButton icon={<Home size={20} />} label="Home" active={dashboardMode === 'home'} onClick={() => { setDashboardMode('home'); setActiveTab('Overview'); }} color="text-slate-700" />
        <MobileNavButton icon={<Users size={20} />} label="Student" active={dashboardMode === 'student'} onClick={() => { setDashboardMode('student'); setActiveTab('Dashboard'); }} isTutor={false} />
        <MobileNavButton icon={<Briefcase size={20} />} label="Tutor" active={dashboardMode === 'tutor'} onClick={() => { setDashboardMode('tutor'); setActiveTab('Dashboard'); }} isTutor={true} />
      </nav>
    </div>
  );
}

// ─── CHAT BOX ────────────────────────────────────────────────────────────────

function ChatBox({ userId, userName, isTutor }: { userId: string | null; userName: string; isTutor: boolean }) {
  const supabase = createClient();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!userId) return;
    const fetchMessages = async () => {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });
      if (data) setMessages(data as any);
    };
    fetchMessages();

    const channel = supabase
      .channel(`support_chat_${userId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'messages',
        filter: `user_id=eq.${userId}`
      }, (payload) => {
        setMessages(prev => {
          if (prev.some(m => m.id === payload.new.id)) return prev;
          return [...prev, payload.new as ChatMessage];
        });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId, supabase]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !userId) return;
    setSending(true);
    const content = input.trim();
    setInput('');

    // Optimistic UI Update Fix
    const tempId = Date.now().toString();
    const tempMsg: ChatMessage = {
      id: tempId,
      user_id: userId,
      sender_role: isTutor ? 'tutor' : 'student',
      content,
      created_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempMsg]);

    const { data } = await supabase.from('messages').insert([{
      user_id: userId,
      sender_role: isTutor ? 'tutor' : 'student',
      content
    }]).select();

    if (data && data.length > 0) {
      setMessages(prev => {
        const filtered = prev.filter(m => m.id !== tempId && m.id !== data[0].id);
        return [...filtered, data[0] as ChatMessage];
      });
    }
    
    setSending(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  return (
    <div id="chatbox-section" className="glass-panel rounded-xl overflow-hidden shadow-medium flex flex-col" style={{ height: '600px' }}>
      {/* Header */}
      <div className="p-5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white shrink-0">
        <h3 className="font-black text-lg flex items-center gap-2">
          <MessageCircle size={20} /> GyanHub Support
        </h3>
        <p className="text-blue-100 text-xs mt-0.5 font-medium">We typically reply within a few hours. Mon–Sat.</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4 bg-white/50">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center text-slate-400 py-10">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
              <MessageCircle size={28} className="text-blue-400" />
            </div>
            <p className="font-black text-slate-500 text-base mb-1">Start a conversation</p>
            <p className="text-sm font-medium max-w-xs">Ask us anything about your courses, payments, or enrollment. We're here to help!</p>
          </div>
        )}

        {messages.map((msg) => {
          const isOwn = msg.sender_role !== 'admin';
          return (
            <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
              {!isOwn && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white text-xs font-black shrink-0 mr-2 mt-1 shadow-sm">G</div>
              )}
              <div className={`max-w-[75%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                {!isOwn && <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest px-1">GyanHub Support</span>}
                <div className={`px-4 py-3 rounded-2xl text-sm font-medium shadow-sm leading-relaxed ${isOwn
                  ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-br-sm'
                  : 'bg-white text-slate-800 rounded-bl-sm border border-slate-100 shadow-soft'
                }`}>
                  {msg.content}
                </div>
                <span className={`text-[10px] font-bold px-1 ${isOwn ? 'text-slate-400 text-right' : 'text-slate-400'}`}>
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-slate-100 bg-white flex gap-3 shrink-0">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message…"
          disabled={!userId}
          className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-blue-400 focus:bg-white transition-all placeholder:text-slate-400 disabled:opacity-50"
        />
        <button
          onClick={handleSend}
          disabled={sending || !input.trim() || !userId}
          className="bg-gradient-to-br from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white p-3.5 rounded-xl transition-all shadow-sm hover:scale-105 active:scale-95"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}

// ─── RECOMMENDED RECORDINGS BOX ───────────────────────────────────────────────

function RecommendedRecordingsBox({ recordings }: { recordings: GlobalRecording[] }) {
  const router = useRouter();
  if (!recordings || recordings.length === 0) return null;
  return (
    <div className="glass-panel rounded-xl p-6 shadow-soft flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-black text-slate-600 uppercase tracking-widest flex items-center gap-2">
          <PlayCircle size={16} className="text-indigo-500" /> Top Recordings
        </h3>
        <Link href="/recording" className="text-[10px] font-black uppercase text-indigo-600 hover:underline flex items-center gap-1">
          See All <ArrowRight size={14} />
        </Link>
      </div>
      <div className="flex flex-col gap-3">
        {recordings.map(r => {
          const finalPrice = r.discount > 0 ? Math.round(r.standard_fee * (1 - r.discount / 100)) : r.standard_fee;
          return (
            <div key={r.id} onClick={() => router.push('/recording')} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-lg hover:border-indigo-200 transition-colors cursor-pointer group">
              <div className="flex items-center gap-3">
                {r.cover_pic_url ? (
                  <img src={r.cover_pic_url} className="w-12 h-12 rounded-md object-cover border border-slate-100" alt={r.course_name} />
                ) : (
                  <div className="w-12 h-12 rounded-md bg-indigo-50 flex items-center justify-center border border-indigo-100">
                    <PlayCircle size={20} className="text-indigo-300"/>
                  </div>
                )}
                <div className="flex flex-col">
                  <p className="text-sm font-black text-slate-900 line-clamp-1 group-hover:text-indigo-700 transition-colors">{r.course_name}</p>
                  <p className="text-xs font-bold text-slate-500 flex items-center gap-1 mt-0.5"><Clock size={10}/> {r.course_hours}</p>
                </div>
              </div>
              <p className="text-sm font-black text-slate-900 shrink-0 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-100">Rs. {finalPrice}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── COURSE CARD ──────────────────────────────────────────────────────────────

type AccessTier = 'BLOCKED_NO_PAY' | 'BLOCKED_VERIFY' | 'PARTIAL_ACTIVE' | 'PARTIAL_OVERDUE' | 'FULL_ACCESS';

function LockedLinkButton({ label, icon, reason, onPayClick }: {
  label: string;
  icon: React.ReactNode;
  reason: string;
  onPayClick?: () => void;
}) {
  const [showTip, setShowTip] = useState(false);
  return (
    <div className="flex-1 relative min-w-[140px]">
      <button
        onClick={() => setShowTip(t => !t)}
        className="w-full flex justify-center items-center gap-2 px-4 py-3.5 rounded-lg font-bold text-sm bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed select-none"
      >
        <Lock className="w-3.5 h-3.5 shrink-0" /> {label}
      </button>
      <AnimatePresence>
        {showTip && (
          <motion.div
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}
            className="absolute z-30 bottom-[calc(100%+8px)] left-0 right-0 bg-slate-900 text-white text-xs font-bold rounded-lg p-3 shadow-strong"
          >
            <p>{reason}</p>
            {onPayClick && (
              <button onClick={onPayClick} className="mt-2 w-full bg-blue-500 hover:bg-blue-400 text-white text-xs font-black px-3 py-1.5 rounded-md transition-colors">
                Pay to Unlock
              </button>
            )}
            <button onClick={() => setShowTip(false)} className="absolute top-1.5 right-1.5 text-slate-400 hover:text-white"><X size={12} /></button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const formatNepaliDate = (dateString: string) => {
  try {
    const d = new Date(dateString);
    return new Intl.DateTimeFormat('ne-NP', {
      calendar: 'nepali',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    }).format(d);
  } catch (e) {
    // Graceful fallback to prevent crashes if locale not fully supported
    return new Date(dateString).toLocaleDateString();
  }
};

function CourseCard({ course, type, matched, batch, pendingVerificationOrders, router }: {
  course: Enrollment | Order;
  type: 'online' | 'recording';
  matched: any;
  batch?: CourseBatch;
  pendingVerificationOrders: Order[];
  router: any;
}) {
  const [expiredModalData, setExpiredModalData] = useState<{ isOpen: boolean; link: string }>({ isOpen: false, link: '' });
  const [nowTick, setNowTick] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNowTick(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // ── RECORDING TYPE ──
  if (type === 'recording') {
    const record = course as Order;
    const isVerified = record.status.toLowerCase() === 'verified';
    const rawHours = matched?.course_hours?.toString().match(/\d+/) || [];
    const displayHours = rawHours.length > 0 ? `${rawHours[0]}+ hours` : matched?.course_hours || 'N/A';

    return (
      <div className="bg-white border border-slate-100 rounded-xl overflow-hidden shadow-medium hover:shadow-strong transition-all duration-500 flex flex-col group relative w-full">
        <div className="p-6 md:p-8 flex flex-col flex-grow relative z-10 w-full justify-between">
          <div>
            <div className="flex justify-between items-start mb-4">
              <div className="flex flex-col">
                <div className="flex items-center gap-2 mb-2">
                  <span className="bg-indigo-100 text-indigo-700 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md flex items-center gap-1">
                    <PlayCircle className="w-3 h-3" /> Recordings
                  </span>
                  {isVerified
                    ? <span className="bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md">Unlocked</span>
                    : <span className="bg-amber-100 text-amber-700 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md">Verifying</span>
                  }
                </div>
                <h3 className="font-black text-2xl text-slate-900 leading-tight group-hover:text-indigo-900 transition-colors break-words">{record.order_name}</h3>
              </div>
            </div>

            {matched && (
              <div className="mb-6 bg-slate-50 p-4 rounded-lg border border-slate-100 flex flex-wrap gap-6 shadow-inner">
                <div className="flex items-center gap-2 text-sm font-bold text-slate-600"><Clock className="w-4 h-4 text-indigo-400" /><span>{displayHours}</span></div>
                <div className="flex items-center gap-2 text-sm font-bold text-slate-600"><Star className="w-4 h-4 fill-amber-500 text-amber-500" /><span>{matched.rating || '4.5'} Rating</span></div>
                {matched.category && <div className="flex items-center gap-2 text-sm font-bold text-slate-600"><BookOpen className="w-4 h-4 text-purple-400" /><span>{matched.category}</span></div>}
              </div>
            )}

            {matched?.learning_outcomes?.length > 0 && (
              <div className="mb-6">
                <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest mb-3">What you'll learn</p>
                <ul className="text-sm text-slate-600 font-medium grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
                  {matched.learning_outcomes.slice(0, 4).map((out: string, i: number) => (
                    <li key={i} className="flex items-start gap-2"><Check className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" /><span className="line-clamp-2">{out}</span></li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100">
            {isVerified ? (
              <a href={matched?.recording_link || '#'} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-3.5 rounded-lg font-black text-sm shadow-[0_0_15px_rgba(79,70,229,0.3)] hover:scale-[1.02] transition-all">
                <PlayCircle className="w-5 h-5" /> Watch Recording Now
              </a>
            ) : (
              <div className="inline-flex bg-amber-50 text-amber-600 px-8 py-3.5 rounded-lg font-bold text-sm border border-amber-200 items-center gap-2">
                <Lock className="w-4 h-4" /> Pending Verification
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── ONLINE COURSE TYPE ──
  const enroll = course as Enrollment;

  // Resolve links and dates overriding online_courses info with batch info
  const effectiveStartDatetime = batch?.start_datetime || enroll.starting_date || matched?.start_datetime;
  const effectiveTiming = batch?.timing || matched?.timing;
  const onlineLink = batch?.online_class_link || null;
  const classroomLink = batch?.google_classroom_link || null;
  const whatsappLink = batch?.whatsapp_group_link || null;

  // Date calculations
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
  const enrollStart = new Date(effectiveStartDatetime); enrollStart.setHours(0, 0, 0, 0);
  const isFutureOrToday = todayStart.getTime() <= enrollStart.getTime();
  const daysSinceStart = Math.floor((nowTick.getTime() - enrollStart.getTime()) / (1000 * 60 * 60 * 24));
  const isFinished = (batch && batch.is_active === false) || daysSinceStart > 30;

  const isUnverifiedPayment = pendingVerificationOrders.some(o =>
    o.order_name.toLowerCase() === enroll.course_name.toLowerCase()
  );

  const totalFee = enroll.paid_amount + enroll.remaining_amount;
  const tenPercentFee = Math.round(totalFee * 0.1);

  // ── Determine access tier ──
  let accessTier: AccessTier;
  if (isUnverifiedPayment) {
    accessTier = 'BLOCKED_VERIFY';
  } else if (enroll.paid_amount === 0) {
    accessTier = 'BLOCKED_NO_PAY';
  } else if (enroll.remaining_amount > 0 && isFutureOrToday) {
    accessTier = 'PARTIAL_ACTIVE'; // online only unlocked
  } else if (enroll.remaining_amount > 0 && !isFutureOrToday) {
    accessTier = 'PARTIAL_OVERDUE'; // all locked, urgent due
  } else {
    accessTier = 'FULL_ACCESS';
  }

  // ── Status badge ──
  const statusBadge = (() => {
    switch (accessTier) {
      case 'BLOCKED_VERIFY': return { label: 'Verification in Progress', classes: 'bg-amber-100 text-amber-700 border-amber-200' };
      case 'BLOCKED_NO_PAY': return { label: 'Payment Pending', classes: 'bg-rose-100 text-rose-700 border-rose-200' };
      case 'PARTIAL_ACTIVE': return { label: 'Partially Paid', classes: 'bg-blue-100 text-blue-700 border-blue-200' };
      case 'PARTIAL_OVERDUE': return { label: 'Urgent Due', classes: 'bg-red-100 text-red-700 border-red-300 animate-pulse' };
      case 'FULL_ACCESS': return { label: 'Access Active', classes: 'bg-emerald-100 text-emerald-700 border-emerald-200' };
    }
  })();

  // ── Countdown ──
  const getCountdownStr = () => {
    const startObj = new Date(effectiveStartDatetime);
    const diffMs = startObj.getTime() - nowTick.getTime();
    
    if (diffMs > 0) {
      const d = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const h = Math.floor((diffMs / (1000 * 60 * 60)) % 24);
      const m = Math.floor((diffMs / (1000 * 60)) % 60);
      const s = Math.floor((diffMs / 1000) % 60);
      return `${d}D ${h}H ${m}MIN ${s}S TO ORIENTATION SESSION`;
    } else if (!isFinished) {
      let target = new Date(nowTick);
      target.setHours(20, 0, 0, 0); // Default to 8:00 PM today
      if (nowTick.getTime() > target.getTime()) {
        target.setDate(target.getDate() + 1); // Move to 8:00 PM tomorrow if past
      }
      const diff8PM = target.getTime() - nowTick.getTime();
      const h = Math.floor((diff8PM / (1000 * 60 * 60)) % 24);
      const m = Math.floor((diff8PM / (1000 * 60)) % 60);
      const s = Math.floor((diff8PM / 1000) % 60);
      return `${h}H ${m}MIN ${s}S FOR ONLINE CLASS`;
    }
    return '';
  };
  const countdownStr = getCountdownStr();
  const isOrientation = new Date(effectiveStartDatetime).getTime() > nowTick.getTime();

  const payRoute = (price: number) =>
    router.push(`/order?order_type=course&courseName=${encodeURIComponent(enroll.course_name)}&price=${price}`);

  // ── Button rendering helpers ──
  const canUseOnline = accessTier === 'PARTIAL_ACTIVE' || accessTier === 'FULL_ACCESS';
  const canUseAll = accessTier === 'FULL_ACCESS';

  return (
    <div className="bg-white border border-slate-100 rounded-xl overflow-hidden shadow-medium hover:shadow-strong transition-all duration-500 flex flex-col group relative w-full">
      <AnimatePresence>
        {expiredModalData.isOpen && (
          <ClassExpiredModal onClose={() => setExpiredModalData({ isOpen: false, link: '' })} classroomLink={expiredModalData.link} />
        )}
      </AnimatePresence>

      <div className="p-6 md:p-8 flex flex-col flex-grow relative z-10 w-full justify-between">
        <div>
          {/* Badges */}
          <div className="flex flex-col items-start gap-3 mb-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-blue-100 text-blue-700 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span> Live Online
              </span>
              <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md border ${statusBadge.classes}`}>
                {statusBadge.label}
              </span>
            </div>
            {countdownStr && (
              <div className="inline-flex items-center w-fit bg-indigo-50 border border-indigo-200 text-indigo-700 text-[11px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg shadow-sm">
                <Calendar className="w-3.5 h-3.5 mr-1.5 text-indigo-500" />{countdownStr}
              </div>
            )}
            <h3 className="font-black text-2xl text-slate-900 leading-tight group-hover:text-blue-900 transition-colors break-words mt-1">{enroll.course_name}</h3>
          </div>

          {/* Meta */}
          <div className="flex flex-wrap gap-2 sm:gap-6 mb-6 text-sm font-bold text-blue-600">
            {matched?.tutor_name && <span className="flex items-center gap-1.5 shrink-0"><User className="w-4 h-4" />{matched.tutor_name}</span>}
            {matched?.duration && <span className="flex items-center gap-1.5 text-slate-500 shrink-0"><Clock className="w-4 h-4" />{matched.duration}</span>}
            {matched?.category && <span className="flex items-center gap-1.5 text-slate-500 shrink-0"><BookOpen className="w-4 h-4" />{matched.category}</span>}
            {batch?.batch_no && <span className="flex items-center gap-1.5 text-slate-500 shrink-0"><Users className="w-4 h-4" />Batch {batch.batch_no}</span>}
            {matched?.difficulty_level && <span className="flex items-center gap-1.5 text-purple-500 shrink-0"><Star className="w-4 h-4" />{matched.difficulty_level}</span>}
          </div>

          {/* Info strip */}
          <div className="mb-6 bg-slate-50 p-4 rounded-lg border border-slate-100 flex flex-wrap gap-6 shadow-inner">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-600">
              <Calendar className="w-4 h-4 text-emerald-500" />
              <span>Start: {new Date(effectiveStartDatetime).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} ({formatNepaliDate(effectiveStartDatetime)})</span>
            </div>
            <div className="flex items-center gap-2 text-sm font-bold text-slate-600">
              <Clock className="w-4 h-4 text-blue-500" />
              <span>Timing: {effectiveTiming || 'N/A'}</span>
            </div>
          </div>

          {/* Syllabus */}
          {matched?.learning_outcomes?.length > 0 && (
            <div className="mb-6">
              <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest mb-3">Compact Syllabus</p>
              <ul className="text-sm text-slate-600 font-medium grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
                {matched.learning_outcomes.slice(0, 4).map((out: string, i: number) => (
                  <li key={i} className="flex items-start gap-2"><Check className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" /><span className="line-clamp-2">{out}</span></li>
                ))}
              </ul>
              {matched.syllabus_url && (
                <a href={matched.syllabus_url} target="_blank" rel="noreferrer" className="mt-3 text-[11px] font-black text-blue-600 hover:underline inline-flex items-center gap-1">
                  View Full Syllabus <ExternalLink size={10} />
                </a>
              )}
            </div>
          )}
        </div>

        {/* ── ACTION AREA ── */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col gap-4">

          {/* Payment alert banners */}
          {accessTier === 'BLOCKED_VERIFY' && (
            <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-lg px-5 py-3.5 text-amber-700">
              <Clock className="w-5 h-5 shrink-0" />
              <p className="text-sm font-bold">Your payment is being verified. Links unlock within 24 hours.</p>
            </div>
          )}

          {accessTier === 'BLOCKED_NO_PAY' && (
            <div className="bg-rose-50 rounded-lg border border-rose-200 p-5 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-start gap-3 text-rose-800">
                <AlertCircle className="w-6 h-6 shrink-0" />
                <p className="text-sm font-medium leading-tight">
                  Pay <strong>10% seat booking fee (Rs. {tenPercentFee})</strong> now to lock your enrollment and unlock class access.
                </p>
              </div>
              <button onClick={() => payRoute(tenPercentFee)} className="w-full md:w-auto shrink-0 bg-rose-600 hover:bg-rose-700 text-white font-black px-6 py-3 rounded-md text-sm whitespace-nowrap transition-colors shadow-sm">
                Book Seat (Rs. {tenPercentFee})
              </button>
            </div>
          )}

          {accessTier === 'PARTIAL_ACTIVE' && enroll.remaining_amount > 0 && (
            <div className="bg-blue-50 rounded-lg border border-blue-200 p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-blue-800">
              <div className="flex items-start gap-3">
                <Info className="w-6 h-6 shrink-0" />
                <div>
                  <p className="text-sm font-medium leading-tight mb-1">
                    Remaining due: <strong>Rs. {enroll.remaining_amount}</strong>. Pay after orientation on <strong>{new Date(effectiveStartDatetime).toLocaleDateString()}</strong>.
                  </p>
                  <p className="text-xs font-bold text-blue-600/80">Google Classroom & WhatsApp unlock after full payment.</p>
                </div>
              </div>
              <button onClick={() => payRoute(enroll.remaining_amount)} className="w-full md:w-auto shrink-0 bg-blue-600 hover:bg-blue-700 text-white font-black px-6 py-3 rounded-md text-sm whitespace-nowrap transition-colors shadow-sm">
                Pay Now (Rs. {enroll.remaining_amount})
              </button>
            </div>
          )}

          {accessTier === 'PARTIAL_OVERDUE' && (
            <div className="bg-red-50 rounded-lg border border-red-200 p-5 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-start gap-3 text-red-800">
                <Flame className="w-6 h-6 shrink-0 mt-0.5 animate-pulse" />
                <div>
                  <p className="text-sm font-black leading-tight mb-1">Immediate clearance required for full access.</p>
                  <p className="text-sm font-medium text-red-700">Remaining due: <strong>Rs. {enroll.remaining_amount}</strong></p>
                </div>
              </div>
              <button onClick={() => payRoute(enroll.remaining_amount)} className="w-full md:w-auto shrink-0 bg-red-600 hover:bg-red-700 text-white font-black px-6 py-3 rounded-md text-sm whitespace-nowrap transition-colors shadow-sm">
                Clear Due Now
              </button>
            </div>
          )}

          {/* ── ALWAYS-VISIBLE 3 BUTTONS ── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">

            {/* Button 1: Online Class Link */}
            {(() => {
              const locked = !canUseOnline;
              const buttonLabel = isOrientation ? 'Join Orientation Session' : 'Join Online Class';
              const lockedReason =
                accessTier === 'BLOCKED_NO_PAY' ? 'Pay the 10% seat booking fee to unlock the live class link.' :
                accessTier === 'BLOCKED_VERIFY' ? 'Your payment is being verified. Access unlocks within 24 hours.' :
                accessTier === 'PARTIAL_OVERDUE' ? 'Your class has started but payment is overdue. Clear your dues to regain access.' :
                'Complete payment to access this link.';

              if (!onlineLink) {
                return (
                  <div className="flex-1 flex justify-center items-center gap-2 px-4 py-3.5 rounded-lg font-bold text-sm bg-slate-50 text-slate-400 border border-dashed border-slate-200 min-w-0">
                    <Video className="w-4 h-4 shrink-0" /> Link Coming Soon
                  </div>
                );
              }

              if (locked) {
                return (
                  <LockedLinkButton
                    label={buttonLabel}
                    icon={<Video className="w-4 h-4" />}
                    reason={lockedReason}
                    onPayClick={accessTier === 'BLOCKED_NO_PAY' ? () => payRoute(tenPercentFee) : accessTier === 'PARTIAL_OVERDUE' ? () => payRoute(enroll.remaining_amount) : undefined}
                  />
                );
              }

              if (isFinished) {
                return (
                  <button
                    onClick={() => setExpiredModalData({ isOpen: true, link: classroomLink || '' })}
                    className="flex-1 flex justify-center items-center gap-2 px-4 py-3.5 rounded-lg font-black text-sm bg-slate-800 text-white hover:bg-slate-700 transition-colors shadow-sm min-w-0"
                  >
                    <Lock className="w-4 h-4" /> Class Ended
                  </button>
                );
              }

              return (
                <a href={onlineLink} target="_blank" rel="noopener noreferrer"
                  className="flex-1 flex justify-center items-center gap-2 px-4 py-3.5 rounded-lg font-black text-sm bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-500 hover:to-indigo-500 shadow-md transition-all hover:scale-[1.02] min-w-0"
                >
                  <Video className="w-4 h-4 shrink-0" /> {buttonLabel}
                </a>
              );
            })()}

            {/* Button 2: Google Classroom */}
            {(() => {
              const locked = !canUseAll;
              const lockedReason =
                accessTier === 'BLOCKED_NO_PAY' ? 'Pay the seat booking fee to access Google Classroom.' :
                accessTier === 'BLOCKED_VERIFY' ? 'Awaiting payment verification.' :
                accessTier === 'PARTIAL_ACTIVE' ? 'Pay remaining dues after orientation to unlock Classroom.' :
                accessTier === 'PARTIAL_OVERDUE' ? 'Clear overdue payment to access Google Classroom.' :
                'Complete payment to access this resource.';

              if (!classroomLink) {
                return (
                  <div className="flex-1 flex justify-center items-center gap-2 px-4 py-3.5 rounded-lg font-bold text-sm bg-slate-50 text-slate-400 border border-dashed border-slate-200 min-w-0">
                    <BookOpen className="w-4 h-4 shrink-0" /> Classroom Soon
                  </div>
                );
              }

              if (locked) {
                return (
                  <LockedLinkButton
                    label="Google Classroom"
                    icon={<BookOpen className="w-4 h-4" />}
                    reason={lockedReason}
                    onPayClick={accessTier === 'PARTIAL_ACTIVE' || accessTier === 'PARTIAL_OVERDUE' ? () => payRoute(enroll.remaining_amount) : undefined}
                  />
                );
              }

              return (
                <a href={classroomLink} target="_blank" rel="noopener noreferrer"
                  className="flex-1 flex justify-center items-center gap-2 px-4 py-3.5 rounded-lg font-bold text-sm bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200 transition-colors shadow-sm min-w-0"
                >
                  <BookOpen className="w-4 h-4 text-blue-500 shrink-0" /> Google Classroom
                </a>
              );
            })()}

            {/* Button 3: WhatsApp Group */}
            {(() => {
              const locked = !canUseAll;
              const lockedReason =
                accessTier === 'BLOCKED_NO_PAY' ? 'Pay the seat booking fee to join the WhatsApp group.' :
                accessTier === 'BLOCKED_VERIFY' ? 'Awaiting payment verification.' :
                accessTier === 'PARTIAL_ACTIVE' ? 'Pay remaining dues after orientation to join the group.' :
                accessTier === 'PARTIAL_OVERDUE' ? 'Clear overdue payment to join the WhatsApp group.' :
                'Complete payment to access this group.';

              if (!whatsappLink) {
                return (
                  <div className="flex-1 flex justify-center items-center gap-2 px-4 py-3.5 rounded-lg font-bold text-sm bg-slate-50 text-slate-400 border border-dashed border-slate-200 min-w-0">
                    <MessageCircle className="w-4 h-4 shrink-0" /> Group Soon
                  </div>
                );
              }

              if (locked) {
                return (
                  <LockedLinkButton
                    label="WhatsApp Group"
                    icon={<MessageCircle className="w-4 h-4" />}
                    reason={lockedReason}
                    onPayClick={accessTier === 'PARTIAL_ACTIVE' || accessTier === 'PARTIAL_OVERDUE' ? () => payRoute(enroll.remaining_amount) : undefined}
                  />
                );
              }

              return (
                <a href={whatsappLink} target="_blank" rel="noopener noreferrer"
                  className="flex-1 flex justify-center items-center gap-2 px-4 py-3.5 rounded-lg font-bold text-sm bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors shadow-sm min-w-0"
                >
                  <MessageCircle className="w-4 h-4 text-emerald-500 shrink-0" /> WhatsApp Group
                </a>
              );
            })()}
          </div>

          {/* Always-visible GyanHub WhatsApp support */}
          <a href="https://wa.me/9763695665" target="_blank" rel="noopener noreferrer"
            className="flex justify-center items-center gap-2 bg-white text-slate-600 hover:bg-slate-50 border border-slate-200 px-6 py-3 rounded-lg font-bold text-sm transition-colors shadow-sm"
          >
            <Phone className="w-4 h-4 text-green-500" /> Contact GyanHub Support
          </a>
        </div>
      </div>
    </div>
  );
}

// ─── MY COURSES VIEW ──────────────────────────────────────────────────────────

function MyCoursesView({ activeTab, enrollments, onlineCourseDetails, courseBatches, pendingVerificationOrders, orders, recordingsList, router }: any) {
  const isOnline = activeTab === 'Online Courses';

  return (
    <div className="space-y-10 w-full pb-10">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h2 className="text-5xl font-black tracking-tighter text-slate-900 ml-2">
          {isOnline ? 'Online Classes' : 'Recordings'}
        </h2>
        <Link href={isOnline ? "/onlinecourse" : "/recording"} className="flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-5 py-2.5 rounded-lg font-black text-sm transition-colors shadow-sm">
          Explore More {isOnline ? 'Courses' : 'Recordings'} <ExternalLink size={16} />
        </Link>
      </div>
      <div className="flex flex-col gap-8 w-full">
        {isOnline ? (
          enrollments.length === 0 ? (
            <p className="text-slate-500 italic p-12 text-center glass-panel rounded-xl shadow-soft font-bold text-lg">No active online course enrollments found.</p>
          ) : (
            enrollments.map((course: Enrollment) => {
              const matched = onlineCourseDetails.find((oc: OnlineCourseExt) => oc.id === course.course_id || oc.title === course.course_name);
              const batch = courseBatches.find((b: CourseBatch) => b.course_id === course.course_id && b.batch_no === course.batch_no);
              return <CourseCard key={course.id} course={course} type="online" matched={matched} batch={batch} pendingVerificationOrders={pendingVerificationOrders} router={router} />;
            })
          )
        ) : (
          !orders || orders.filter((o: Order) => o.order_type === 'recording').length === 0 ? (
            <p className="text-slate-500 italic p-12 text-center glass-panel rounded-xl shadow-soft font-bold text-lg">No recording orders found.</p>
          ) : (
            orders.filter((o: Order) => o.order_type === 'recording').map((record: Order) => {
              const matched = recordingsList.find((r: RecordingInfo) => r.course_name.toLowerCase() === record.order_name.toLowerCase());
              return <CourseCard key={record.id} course={record} type="recording" matched={matched} pendingVerificationOrders={pendingVerificationOrders} router={router} />;
            })
          )
        )}
      </div>
    </div>
  );
}

// ─── ACCOUNT OVERVIEW ─────────────────────────────────────────────────────────

function AccountOverviewView({ userName, userEmail, userWhatsapp, onSaveUser, orders, enrollments, certificates, onNavigate, pendingVerificationOrders, pendingCoursePayments, activeCourseAccess, recordingOrdersVerified, onlineCourseDetails }: any) {
  const timelineEvents = [
    ...(orders || []).filter((o: Order) => o.order_type?.toLowerCase() === 'recording').map((o: Order) => ({ id: o.id, type: 'Order', title: `Purchased ${o.order_name} recordings`, date: new Date(o.created_at), status: o.status })),
    ...(enrollments || []).map((e: Enrollment) => ({ id: e.id, type: 'Enrollment', title: `Enrolled in ${e.course_name} online course`, date: new Date(e.created_at), status: e.remaining_amount === 0 ? 'cleared' : 'pending' })),
    ...(certificates || []).map((c: Certificate) => ({ id: `cert-${c.id}`, type: 'Certificate', title: `Certificate Earned: ${c.syllabus_name || c.name}`, date: new Date(c.issue_date), status: 'verified' }))
  ].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 5);

  const getNextClassCountdown = () => {
    const activeDetails = activeCourseAccess
      .map((e: Enrollment) => onlineCourseDetails.find((c: OnlineCourseExt) => c.title === e.course_name || c.id === e.course_id))
      .filter(Boolean);
    const future = activeDetails
      .filter((c: OnlineCourseExt) => new Date(c.start_datetime) > new Date())
      .sort((a: OnlineCourseExt, b: OnlineCourseExt) => new Date(a.start_datetime).getTime() - new Date(b.start_datetime).getTime());
    if (!future.length) return null;
    const days = Math.ceil((new Date(future[0].start_datetime).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return { name: future[0].title, days };
  };

  const nextClassInfo = getNextClassCountdown();

  return (
    <div className="space-y-10 w-full pb-10">
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-blue-900 rounded-xl p-8 md:p-10 shadow-strong relative overflow-hidden group border border-slate-800">
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-blue-500/20 rounded-full blur-[80px] pointer-events-none"></div>
        <div className="relative z-10 text-white">
          <h2 className="text-[10px] uppercase tracking-[0.2em] font-black text-blue-300 mb-3 flex items-center gap-2"><Crown size={14} /> My Learning Hub</h2>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 break-words">
            <div>
              <h3 className="text-4xl md:text-5xl font-black tracking-tighter mb-2">Welcome back, {userName}</h3>
              <p className="text-blue-100/80 font-medium">Continue building your skills and credentials.</p>
            </div>
            {nextClassInfo && (
              <div className="bg-white/10 backdrop-blur-md border border-white/20 p-5 rounded-lg flex flex-col gap-1 min-w-[200px]">
                <span className="text-[10px] text-blue-200 font-bold uppercase tracking-widest flex items-center gap-1.5"><Calendar size={12} /> Next Class Countdown</span>
                <span className="text-xl font-black text-white truncate max-w-[220px]">{nextClassInfo.name}</span>
                <span className="text-sm font-bold text-blue-300 bg-blue-500/20 w-fit px-3 py-1 rounded-md mt-2">Starts in {nextClassInfo.days} days</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-10 border-t border-white/10 pt-8">
            {[
              { icon: GraduationCap, value: activeCourseAccess.length, label: 'Active Courses', color: 'bg-blue-500/20 text-blue-300', tab: 'Online Courses' },
              { icon: Video, value: recordingOrdersVerified.length, label: 'Recordings', color: 'bg-indigo-500/20 text-indigo-300', tab: 'Recording Courses' },
              { icon: AlertCircle, value: pendingCoursePayments.length, label: 'Pending Dues', color: 'bg-rose-500/20 text-rose-300', tab: 'Online Courses', dot: pendingCoursePayments.length > 0 },
              { icon: Award, value: certificates?.length || 0, label: 'Certificates', color: 'bg-emerald-500/20 text-emerald-300', tab: 'My Certificates' },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={i} onClick={() => onNavigate(item.tab)} className="cursor-pointer bg-white/5 hover:bg-white/10 p-5 rounded-lg transition-all group/card border border-white/5 min-h-[140px] flex flex-col relative">
                  {item.dot && <span className="absolute top-4 right-4 w-2 h-2 bg-rose-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(244,63,94,0.8)]"></span>}
                  <div className={`p-3 ${item.color} rounded-md w-fit mb-4 group-hover/card:scale-110 transition-transform`}><Icon className="w-5 h-5" /></div>
                  <div className="mt-auto">
                    <p className="text-3xl font-black text-white leading-none">{item.value}</p>
                    <p className="text-[10px] uppercase font-bold tracking-widest text-blue-200 mt-2">{item.label}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="bg-white p-6 md:p-8 rounded-xl border border-slate-100 shadow-soft">
        <h3 className="text-[13px] font-black text-slate-500/80 uppercase tracking-[0.1em] flex items-center gap-2 mb-6"><Activity size={16} /> Recent Timeline</h3>
        {timelineEvents.length === 0 ? (
          <p className="text-slate-400 text-sm font-bold text-center py-10">No recent activity found.</p>
        ) : (
          <div className="space-y-8 relative before:absolute before:inset-y-0 before:left-4 before:w-px before:bg-gradient-to-b before:from-slate-200 before:to-transparent ml-2">
            {timelineEvents.map((event, idx) => {
              const isCert = event.type === 'Certificate';
              const isOrder = event.type === 'Order';
              const iconBg = isCert ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : isOrder ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-blue-50 border-blue-200 text-blue-600';
              const IconComp = isCert ? Award : isOrder ? ShoppingBag : BookOpen;
              return (
                <div key={`${event.id}-${idx}`} className="relative flex items-start gap-6 group">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full border-[2px] border-white shadow-sm shrink-0 z-10 ${iconBg}`}>
                    <IconComp className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 bg-white p-5 rounded-lg border border-slate-100 shadow-soft group-hover:shadow-medium group-hover:-translate-y-0.5 transition-all">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <span className={`font-black text-[10px] uppercase tracking-widest px-2.5 py-1 rounded-md ${isCert ? 'bg-emerald-100/50 text-emerald-700' : isOrder ? 'bg-indigo-100/50 text-indigo-700' : 'bg-blue-100/50 text-blue-700'}`}>{event.type}</span>
                      <time className="text-[10px] font-bold text-slate-400">{event.date.toLocaleDateString()}</time>
                    </div>
                    <p className="text-sm font-black text-slate-800 leading-snug break-words">{event.title}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── TRANSACTIONS VIEW ────────────────────────────────────────────────────────

function TransactionsView({ orders, ordersError, enrollments, formatDate }: any) {
  const [selectedTransaction, setSelectedTransaction] = useState<Order | null>(null);

  return (
    <div className="space-y-10 w-full pb-10">
      <AnimatePresence>
        {selectedTransaction && <TransactionModal order={selectedTransaction} enrollments={enrollments} onClose={() => setSelectedTransaction(null)} />}
      </AnimatePresence>
      <h2 className="text-5xl font-black tracking-tighter text-slate-900 ml-2">Transactions</h2>
      <div className="space-y-4 max-w-4xl">
        {ordersError && <div className="p-4 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 font-bold">Error loading billing history. Please refresh.</div>}
        {(!orders || orders.length === 0) ? (
          <div className="glass-panel p-10 rounded-xl border-dashed text-center text-slate-400 font-bold shadow-soft">No transactions found.</div>
        ) : orders.map((order: Order) => (
          <div key={order.id} onClick={() => setSelectedTransaction(order)} className="cursor-pointer bg-white p-6 rounded-lg border border-slate-100 shadow-soft flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:shadow-medium hover:-translate-y-1 hover:border-indigo-200 transition-all group">
            <div className="flex items-center gap-5 w-full sm:w-auto">
              <div className="p-4 bg-slate-50 group-hover:bg-indigo-50 text-slate-400 group-hover:text-indigo-600 rounded-md shrink-0 transition-colors border border-slate-100 shadow-inner"><ShoppingBag className="w-5 h-5" /></div>
              <div className="overflow-hidden">
                <p className="font-black text-slate-900 text-base leading-tight group-hover:text-indigo-800 transition-colors truncate">{order.order_name}</p>
                <p className="text-[11px] font-bold text-slate-400 mt-1.5 uppercase tracking-widest">{order.order_type} • {formatDate(order.created_at)}</p>
              </div>
            </div>
            <div className="text-right w-full sm:w-auto flex flex-row sm:flex-col justify-between items-center sm:items-end border-t sm:border-0 border-slate-100 pt-4 sm:pt-0 shrink-0">
              <p className="font-black text-xl text-slate-900">Rs. {order.price}</p>
              <div className="mt-1.5"><StatusBadge status={order.status} /></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TransactionModal({ order, enrollments, onClose }: { order: Order; enrollments: Enrollment[]; onClose: () => void }) {
  const relatedEnrollment = enrollments?.find((e: Enrollment) => e.course_name.toLowerCase() === order.order_name.toLowerCase());
  const remainingDue = relatedEnrollment ? relatedEnrollment.remaining_amount : 0;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4">
      <motion.div initial={{ scale: 0.95, opacity: 0, y: 10 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 10 }} className="bg-white rounded-xl w-full max-w-lg shadow-strong flex flex-col max-h-[90vh] relative overflow-y-auto custom-scrollbar">
        
        {/* Absolutely positioned cross symbol prevents cutting off by overflow-hidden */}
        <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-slate-100 rounded-full shadow-sm hover:bg-slate-200 text-slate-600 z-[60] transition-colors">
          <X size={20} />
        </button>

        <div className="p-8 space-y-6 pt-14">
          <div className="text-center p-5 bg-gradient-to-b from-slate-50 to-white border border-slate-100 rounded-lg">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{order.order_type} PURCHASE</p>
            <h4 className="text-2xl font-black text-slate-900 leading-tight break-words">{order.order_name}</h4>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-emerald-50/50 rounded-lg border border-emerald-100">
              <p className="text-[10px] uppercase font-black text-emerald-500 tracking-widest mb-1">Amount Paid</p>
              <p className="font-black text-2xl text-emerald-700">Rs. {order.price}</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
              <p className="text-[10px] uppercase font-black text-slate-500 tracking-widest mb-1">Date</p>
              <p className="font-bold text-slate-700 text-lg mt-1">{new Date(order.created_at).toLocaleDateString()}</p>
            </div>
            <div className={`col-span-2 p-4 rounded-lg border flex justify-between items-center ${remainingDue > 0 ? 'bg-rose-50 border-rose-100' : 'bg-emerald-50 border-emerald-100'}`}>
              <p className={`text-[10px] uppercase font-black tracking-widest ${remainingDue > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>Remaining Due Balance</p>
              <p className={`font-black ${remainingDue > 0 ? 'text-rose-700' : 'text-emerald-700'}`}>{remainingDue > 0 ? `Rs. ${remainingDue}` : 'No due remaining for this course'}</p>
            </div>
            <div className="col-span-2 p-4 bg-slate-50 rounded-lg border border-slate-100 flex justify-between items-center">
              <p className="text-[10px] uppercase font-black text-slate-500 tracking-widest">Status</p>
              <StatusBadge status={order.status} />
            </div>
          </div>
          <div>
            <h4 className="text-[11px] font-black uppercase text-slate-400 tracking-widest mb-3">Payment Screenshot</h4>
            {order.screenshot_url ? (
              <div className="rounded-lg border-2 border-slate-100 overflow-hidden bg-slate-50 p-2">
                <img src={order.screenshot_url} alt="Payment Receipt" className="w-full object-contain rounded-md max-h-[300px]" />
              </div>
            ) : (
              <div className="p-8 border-2 border-dashed border-slate-200 rounded-lg text-center flex flex-col items-center text-slate-400 bg-slate-50">
                <SearchX size={32} className="mb-2 opacity-50" />
                <p className="font-bold text-sm">No screenshot attached</p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ─── CERTIFICATES VIEW ────────────────────────────────────────────────────────

function MyCertificatesView({ certificates, formatDate }: any) {
  return (
    <div className="space-y-10 w-full pb-10">
      <h2 className="text-5xl font-black tracking-tighter text-slate-900 ml-2">My Certificates</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {!certificates || certificates.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center glass-panel rounded-xl py-16 text-slate-400 border-dashed shadow-soft">
            <Award size={40} className="mb-3 opacity-30 text-emerald-500" />
            <p className="text-sm font-bold">No certificates earned yet.</p>
            <p className="text-xs mt-1">Complete courses to unlock verifiable credentials.</p>
          </div>
        ) : certificates.map((cert: Certificate) => (
          <CertificateCard key={cert.id} cert={cert} formatDate={formatDate} />
        ))}
      </div>
    </div>
  );
}

function CertificateCard({ cert, formatDate }: { cert: Certificate; formatDate: (d?: string) => string }) {
  const [copied, setCopied] = useState(false);
  const handleShare = () => {
    const url = `${window.location.origin}/certificate?name=${encodeURIComponent(cert.name)}&email=${encodeURIComponent(cert.email)}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white border border-slate-100 rounded-xl p-6 shadow-soft hover:shadow-medium hover:-translate-y-1 transition-all group flex flex-col gap-4 relative overflow-hidden h-full">
      <div className="flex justify-between items-start z-10 relative">
        <div className="p-4 bg-emerald-50 text-emerald-600 rounded-lg shadow-sm"><Award size={28} /></div>
        <div className="text-right">
          <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Issue Date</p>
          <p className="text-sm font-bold text-slate-700">{formatDate(cert.issue_date)}</p>
        </div>
      </div>
      <div className="z-10 relative flex-grow py-2">
        <h3 className="text-xl font-black text-slate-900 leading-tight mb-2 group-hover:text-emerald-800 transition-colors break-words">{cert.syllabus_name || cert.name}</h3>
        <p className="text-sm text-slate-500 font-medium">Issued to: <span className="font-black text-slate-800">{cert.name}</span></p>
      </div>
      <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 flex justify-between items-center mt-auto z-10 relative">
        <div className="overflow-hidden mr-2">
          <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest mb-0.5">Certificate ID</p>
          <p className="text-xs font-black text-slate-700 truncate" title={cert.certificate_code}>{cert.certificate_code}</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <a href={`/certificate?name=${encodeURIComponent(cert.name)}&email=${encodeURIComponent(cert.email)}`} target="_blank" rel="noopener noreferrer" className="p-2.5 bg-white text-blue-600 hover:bg-blue-50 rounded-md shadow-sm border border-slate-200 hover:border-blue-200 transition-colors" title="View"><ExternalLink size={16} /></a>
          <button onClick={handleShare} className="p-2.5 bg-white text-slate-600 hover:bg-slate-50 rounded-md shadow-sm border border-slate-200 transition-colors" title="Copy link">
            {copied ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
          </button>
        </div>
      </div>
      <div className="absolute -right-10 -bottom-10 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-700"><Award size={140} /></div>
    </div>
  );
}

// ─── EXPIRED CLASS MODAL ──────────────────────────────────────────────────────

function ClassExpiredModal({ onClose, classroomLink }: { onClose: () => void; classroomLink: string }) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4">
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white rounded-xl w-full max-w-sm overflow-hidden shadow-strong text-center p-8 relative">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 text-slate-400 hover:bg-slate-100 rounded-full"><X size={20} /></button>
        <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-5 shadow-inner"><PlayCircle size={32} /></div>
        <h3 className="text-xl font-black text-slate-800 mb-2">Class is Finished</h3>
        <p className="text-sm font-medium text-slate-600/80 mb-8">Class is finished, please refer to recordings available in next button.</p>
        <button onClick={() => { onClose(); window.open(classroomLink || '/recording', '_blank'); }} className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-black shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:scale-[1.02] transition-transform">
          Explore Recordings
        </button>
      </motion.div>
    </div>
  );
}

// ─── SHARED UI COMPONENTS ─────────────────────────────────────────────────────

function NavButton({ icon, label, active, onClick, color, isTutor }: any) {
  const themeColor = isTutor ? 'text-green-700' : isTutor === false ? 'text-blue-700' : color || 'text-slate-700';
  const themeBg = isTutor ? 'bg-green-50/80 border-green-200/50 shadow-sm' : isTutor === false ? 'bg-blue-50/80 border-blue-200/50 shadow-sm' : 'bg-slate-100/80 border-slate-200/50 shadow-sm';
  const activeIconBg = isTutor ? 'bg-green-200/50' : isTutor === false ? 'bg-blue-200/50' : 'bg-slate-200/80';

  return (
    <button onClick={onClick} className={`w-full flex items-center gap-4 px-5 py-4 rounded-lg text-[14px] font-black transition-all duration-300 border border-transparent ${active ? `${themeBg} ${themeColor} translate-x-1` : `text-slate-600/80 hover:bg-white hover:shadow-soft hover:text-slate-900 ${color || ''}`}`}>
      <div className={`p-2 rounded-md transition-colors ${active ? activeIconBg : 'bg-transparent'}`}>{icon}</div>
      <span>{label}</span>
    </button>
  );
}

function MobileNavButton({ icon, label, active, onClick, color, isTutor }: any) {
  const themeColor = isTutor ? 'text-green-600' : isTutor === false ? 'text-blue-600' : 'text-slate-700';
  const activeBg = isTutor ? 'bg-green-100' : isTutor === false ? 'bg-blue-100' : 'bg-slate-200';
  return (
    <motion.button whileTap={{ scale: 0.85 }} onClick={onClick} className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-all min-w-[60px] ${active ? themeColor : `text-slate-400 ${color || ''}`}`}>
      <div className={`p-2.5 rounded-md ${active ? activeBg : 'bg-transparent'}`}>{icon}</div>
      <span className="text-[10px] font-black tracking-widest">{label}</span>
    </motion.button>
  );
}

function StatCard({ label, value, icon, isTutor }: any) {
  const themeText = isTutor ? 'text-green-600' : 'text-blue-600';
  const themeBg = isTutor ? 'bg-green-100' : 'bg-blue-100';
  return (
    <div className={`glass-panel p-6 rounded-xl flex items-center justify-between h-full hover:-translate-y-1 transition-all duration-500 shadow-soft border border-white/60 relative overflow-hidden group`}>
      <div className={`absolute -right-4 -top-4 opacity-[0.03] scale-150 group-hover:scale-[2] transition-transform duration-700 ${themeText}`}>{icon}</div>
      <div className="relative z-10 flex flex-col">
        <p className="text-[11px] font-bold text-slate-500/80 uppercase tracking-widest mb-1">{label}</p>
        <p className="text-4xl sm:text-5xl font-black tracking-tighter text-slate-900">{value}</p>
      </div>
      <div className={`p-4 ${themeBg} ${themeText} rounded-lg shadow-inner relative z-10 shrink-0`}>{icon}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const st = status.toLowerCase();
  const isAccepted = st === 'accepted' || st === 'verified';
  const isRejected = st === 'rejected';
  const colorMap = {
    bg: isAccepted ? 'bg-green-50' : isRejected ? 'bg-red-50' : 'bg-orange-50',
    border: isAccepted ? 'border-green-200' : isRejected ? 'border-red-200' : 'border-orange-200',
    text: isAccepted ? 'text-green-700' : isRejected ? 'text-red-700' : 'text-orange-700',
    dot: isAccepted ? 'bg-green-500' : isRejected ? 'bg-red-500' : 'bg-orange-500',
  };
  return (
    <div className={`flex items-center gap-2 px-3 py-1 ${colorMap.bg} border ${colorMap.border} ${colorMap.text} rounded-md w-fit shadow-sm`}>
      <span className={`w-1.5 h-1.5 rounded-full ${colorMap.dot} ${isAccepted ? 'animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.8)]' : ''}`}></span>
      <span className="text-[10px] font-black uppercase tracking-widest">{status}</span>
    </div>
  );
}

function AvatarDisplay({ name, url }: { name: string; url?: string }) {
  if (url) return <img src={url} className="h-14 w-14 rounded-lg object-cover border border-white shadow-sm" alt={name} />;
  return (
    <div className="h-14 w-14 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 border border-white shadow-sm flex items-center justify-center text-white font-black text-xl shrink-0">
      {name?.charAt(0) || 'T'}
    </div>
  );
}

function SkeletonLoader() {
  return (
    <div className="p-8 md:p-10 animate-pulse w-full relative z-10">
      <div className="glass-panel shadow-soft p-8 rounded-xl mb-10 border border-white/60">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div className="w-full md:w-1/2 space-y-4">
            <div className="h-12 bg-slate-200/60 rounded-md w-3/4"></div>
            <div className="h-5 bg-slate-200/60 rounded-md w-1/2"></div>
          </div>
          <div className="h-14 bg-slate-200/60 rounded-md w-40 shrink-0"></div>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 mb-10">
        <div className="lg:col-span-5 h-56 bg-white/40 border border-white/60 rounded-xl"></div>
        <div className="lg:col-span-7 h-56 bg-white/40 border border-white/60 rounded-xl"></div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-7 h-[500px] bg-white/40 border border-white/60 rounded-xl"></div>
        <div className="lg:col-span-5 h-[500px] bg-white/40 border border-white/60 rounded-xl"></div>
      </div>
    </div>
  );
}

// ─── TUTOR MARQUEE ────────────────────────────────────────────────────────────

function TutorsMarquee({ tutors, className = "h-full" }: { tutors: Tutor[]; className?: string }) {
  const router = useRouter();
  if (!tutors || tutors.length === 0) return null;
  const displayTutors = [...tutors, ...tutors, ...tutors].map((t, i) => ({ ...t, _key: `${i}-${t.id}` }));

  return (
    <div className={`glass-panel shadow-soft rounded-xl p-6 md:p-8 flex flex-col relative overflow-hidden ${className}`}>
      <div className="flex justify-between items-center mb-6 shrink-0 z-10 relative bg-white/50 backdrop-blur-md p-4 rounded-lg border border-white/80 shadow-sm">
        <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
          <Sparkles size={16} className="text-blue-500" /> Verified Premium Tutors
        </h3>
      </div>
      <div className="flex-grow w-full overflow-hidden relative flex items-center">
        <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-[#F0F4F8]/80 to-transparent z-10 pointer-events-none"></div>
        <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-[#F0F4F8]/80 to-transparent z-10 pointer-events-none"></div>
        <div className="flex w-max animate-marquee gap-6 h-full items-stretch py-2">
          {displayTutors.map((tutor) => (
            <div key={tutor._key} onClick={() => router.push(`/tutors/${tutor.id}`)}
              className="flex flex-col justify-between gap-4 bg-white/80 backdrop-blur-md border border-white p-6 rounded-lg w-[420px] h-full shrink-0 shadow-soft hover:shadow-medium hover:-translate-y-1 transition-all duration-500 cursor-pointer"
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
              <p className="text-sm text-slate-600/80 line-clamp-3 mt-2 flex-grow font-medium leading-relaxed">
                {tutor.bio ? `"${tutor.bio}"` : "Passionate about teaching and helping students achieve their best."}
              </p>
              <div className="flex items-center justify-between mt-2 text-xs text-slate-500 font-bold border-t border-slate-100 pt-4">
                <span className="flex items-center gap-1.5 truncate max-w-[60%] bg-slate-50 px-2.5 py-1.5 rounded-md border border-slate-100">
                  <GraduationCap size={14} className="shrink-0 text-slate-400" /><span className="truncate">{tutor.education || 'N/A'}</span>
                </span>
                <span className="flex items-center gap-1.5 shrink-0 bg-green-50 px-2.5 py-1.5 rounded-md border border-green-100">
                  <Clock size={14} className="text-green-500" />
                  {tutor.availability ? <span className="text-green-700">Available</span> : <span className="text-slate-500">Busy</span>}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function LatestCourseCard({ course, isTutor }: { course: OnlineCourse; isTutor: boolean }) {
  const offerPrice = course.fee;
  const originalPrice = course.discount > 0 ? Math.round(course.fee / (1 - course.discount / 100)) : course.fee;
  return (
    <div onClick={() => window.location.href = `/onlinecourse/${encodeURIComponent(course.title)}`}
      className={`glass-panel rounded-xl overflow-hidden flex flex-col h-full shadow-soft ${isTutor ? 'hover:border-green-400' : 'hover:border-blue-400'} hover:shadow-strong transition-all duration-500 cursor-pointer group relative`}
    >
      {/* Cover Image */}
      <div className="relative w-full h-44 bg-slate-100 overflow-hidden shrink-0 border-b border-slate-100">
        <div className="absolute top-3 right-3 bg-orange-500/90 backdrop-blur-sm text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-md shadow-sm z-20">Featured</div>
        {course.discount > 0 && (
          <div className="absolute top-5 left-[-35px] bg-red-500 text-white font-black text-[10px] uppercase px-10 py-1.5 rotate-[-45deg] shadow-lg z-20 tracking-widest">{course.discount}% OFF</div>
        )}
        {course.cover_pic ? (
          <img src={course.cover_pic} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-300 bg-slate-100"><BookOpen size={40} /></div>
        )}
      </div>

      <div className="flex flex-col justify-between w-full h-full p-6">
        <h4 className="font-black text-xl mb-4 tracking-tight leading-tight break-words">{course.title}</h4>
        <div className="flex flex-col gap-2 mb-6 border-b border-slate-100 pb-4">
          {[
            { val: course.tutor_name, icon: User, label: 'Instructor' },
            { val: course.duration, icon: Activity, label: 'Duration' },
            { val: course.start_datetime ? new Date(course.start_datetime).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : null, icon: Calendar, label: 'Starts' },
            { val: course.timing, icon: Clock, label: 'Timing' },
            { val: course.difficulty_level, icon: Star, label: 'Level' },
          ].filter(i => i.val).map(({ val, icon: Icon, label }) => (
            <p key={label} className="text-xs font-bold text-slate-600 flex items-center gap-2">
              <Icon size={14} className={`shrink-0 ${isTutor ? 'text-green-500' : 'text-blue-500'}`} /> {label}: {val}
            </p>
          ))}
        </div>
        <div className="flex flex-wrap items-end justify-between gap-3 mt-auto">
          <div className="flex items-end gap-3">
            <p className="text-slate-900 font-black text-2xl tracking-tighter">Rs. {offerPrice.toLocaleString()}</p>
            {course.discount > 0 && <p className="text-slate-400/80 font-bold text-xs line-through mb-1">Rs. {originalPrice.toLocaleString()}</p>}
          </div>
          <button onClick={(e) => { e.stopPropagation(); window.location.href='/onlinecourse'; }} className={`p-2.5 rounded-lg border ${isTutor ? 'bg-green-50 border-green-200 text-green-600 hover:bg-green-100' : 'bg-blue-50 border-blue-200 text-blue-600 hover:bg-blue-100'} transition-colors shadow-sm hover:-translate-y-0.5`} title="See all online courses">
            <ExternalLink size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

function ApplicationsModal({ applications, onClose, onReject, onUpdateStatus }: any) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4">
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white rounded-xl w-full max-w-2xl overflow-hidden shadow-strong flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
          <h3 className="text-xl font-black text-slate-800">Applications ({applications.length})</h3>
          <button onClick={onClose} className="p-2 bg-white rounded-full shadow-sm hover:bg-slate-100 text-slate-500"><X size={20} /></button>
        </div>
        <div className="flex-grow overflow-y-auto custom-scrollbar p-6 space-y-4">
          {applications.length === 0 ? (
            <p className="text-center text-slate-400 font-bold py-10">No applications yet.</p>
          ) : applications.map((app: ApplicationJoin) => (
            <div key={app.id} className="bg-white border border-slate-100 rounded-lg p-5 shadow-soft flex flex-col sm:flex-row justify-between gap-4">
              <div>
                <p className="font-black text-slate-900 text-base">{app.tutors?.name || app.applicant_name || 'Applicant'}</p>
                <p className="text-sm text-slate-500 font-medium mt-1">{app.vacancies?.subject} — {app.vacancies?.location}</p>
                <div className="mt-2"><StatusBadge status={app.status} /></div>
              </div>
              <div className="flex gap-2 shrink-0 items-start">
                {app.status !== 'accepted' && (
                  <button onClick={() => onUpdateStatus(app.id, 'accepted')} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-lg transition-colors">Accept</button>
                )}
                <button onClick={() => onReject(app.id)} className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-black rounded-lg border border-red-200 transition-colors">Remove</button>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

function TutorApplicationsModal({ applications, onClose }: any) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4">
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white rounded-xl w-full max-w-2xl overflow-hidden shadow-strong flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
          <h3 className="text-xl font-black text-slate-800">My Applications ({applications.length})</h3>
          <button onClick={onClose} className="p-2 bg-white rounded-full shadow-sm hover:bg-slate-100 text-slate-500"><X size={20} /></button>
        </div>
        <div className="flex-grow overflow-y-auto custom-scrollbar p-6 space-y-4">
          {applications.length === 0 ? (
            <p className="text-center text-slate-400 font-bold py-10">No applications submitted yet.</p>
          ) : applications.map((app: TutorApplicationJoin) => (
            <div key={app.id} className="bg-white border border-slate-100 rounded-lg p-5 shadow-soft flex justify-between items-center">
              <div>
                <p className="font-black text-slate-900">{app.vacancies?.subject}</p>
                <p className="text-sm text-slate-500 font-medium mt-1 flex items-center gap-1"><MapPin size={12} />{app.vacancies?.location}</p>
              </div>
              <StatusBadge status={app.status} />
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

function DashboardView({ userId, userName, count, course, verifiedTutors, onShowApplications, globalRecordings }: any) {
  return (
    <div className="space-y-8 w-full pb-10">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <h2 className="text-5xl font-black tracking-tighter text-slate-900">Student Hub</h2>
        {count > 0 && (
          <button onClick={onShowApplications} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-black text-sm shadow-md transition-all hover:scale-[1.02]">
            <Users size={18} /> {count} Applicant{count !== 1 ? 's' : ''}
          </button>
        )}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {course && (
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center px-1">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                <Sparkles size={16} className="text-orange-500" /> Featured Online Course
              </h3>
              <Link href="/onlinecourse" className="text-xs font-black text-blue-600 hover:underline flex items-center gap-1">
                See All <ArrowRight size={14} />
              </Link>
            </div>
            <LatestCourseCard course={course} isTutor={false} />
          </div>
        )}
        <div className="flex flex-col gap-6">
          {verifiedTutors?.length > 0 && (
            <div className="glass-panel rounded-xl p-6 shadow-soft flex flex-col gap-4">
              <h3 className="text-sm font-black text-slate-600 uppercase tracking-widest flex items-center gap-2"><Sparkles size={14} className="text-blue-500" /> Find Tutors</h3>
              <Link href="/tutors" className="w-full text-center bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-black py-4 rounded-xl transition-colors text-sm">Browse {verifiedTutors.length}+ Verified Tutors</Link>
            </div>
          )}
          {globalRecordings?.length > 0 && <RecommendedRecordingsBox recordings={globalRecordings} />}
        </div>
      </div>
      {verifiedTutors?.length > 0 && <TutorsMarquee tutors={verifiedTutors} />}
    </div>
  );
}

function VacanciesView({ vacancies, onUpdate, onDelete, onViewApplicants }: any) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editData, setEditData] = useState<Partial<Vacancy>>({});

  const startEdit = (v: Vacancy) => { setEditingId(v.id); setEditData(v); };
  const handleSave = async () => { if (editingId) { await onUpdate({ ...editData, id: editingId } as Vacancy); setEditingId(null); } };

  return (
    <div className="space-y-8 w-full pb-10">
      <div className="flex items-center justify-between">
        <h2 className="text-5xl font-black tracking-tighter text-slate-900">My Postings</h2>
        <Link href="/post-tuition" className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-black text-sm shadow-md transition-all hover:scale-[1.02]">
          <Plus size={18} /> Post Vacancy
        </Link>
      </div>
      {vacancies.length === 0 ? (
        <div className="glass-panel p-12 rounded-xl text-center text-slate-400 shadow-soft border-dashed">
          <FileText size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-bold">No active vacancies. Post one to find tutors!</p>
        </div>
      ) : vacancies.map((v: Vacancy) => (
        <div key={v.id} className="bg-white border border-slate-100 rounded-xl p-6 shadow-soft flex flex-col gap-4">
          {editingId === v.id ? (
            <div className="grid grid-cols-2 gap-4">
              {[
                { key: 'subject', label: 'Subject' }, { key: 'location', label: 'Location' },
                { key: 'salary_range', label: 'Salary' }, { key: 'class_time', label: 'Class Time' },
                { key: 'class_level', label: 'Class Level' }
              ].map(({ key, label }) => (
                <div key={key} className="flex flex-col gap-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</label>
                  <input value={(editData as any)[key] || ''} onChange={e => setEditData(p => ({ ...p, [key]: e.target.value }))}
                    className="border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium outline-none focus:border-blue-400 bg-slate-50"
                  />
                </div>
              ))}
              <div className="col-span-2 flex gap-3">
                <button onClick={handleSave} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-lg font-black text-sm transition-colors"><Save size={16} /> Save</button>
                <button onClick={() => setEditingId(null)} className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-5 py-2.5 rounded-lg font-black text-sm transition-colors"><X size={16} /> Cancel</button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-black text-xl text-slate-900">{v.subject}</h3>
                    {v.urgent && <span className="bg-red-100 text-red-700 text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md flex items-center gap-1"><Flame size={10} />Urgent</span>}
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm text-slate-500 font-medium">
                    <span className="flex items-center gap-1"><MapPin size={13} />{v.location}</span>
                    <span className="flex items-center gap-1"><Clock size={13} />{v.class_time}</span>
                    <span className="flex items-center gap-1"><DollarSign size={13} />{v.salary_range}</span>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => onViewApplicants(v.id)} className="flex items-center gap-1.5 px-4 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg font-black text-xs hover:bg-blue-100 transition-colors">
                    <Users size={14} /> {v.applicant_count || 0}
                  </button>
                  <button onClick={() => startEdit(v)} className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors"><Edit2 size={15} /></button>
                  <button onClick={() => onDelete(v.id)} className="p-2 bg-red-50 hover:bg-red-100 text-red-500 rounded-lg border border-red-200 transition-colors"><Trash2 size={15} /></button>
                </div>
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  );
}

function StudentMyRequestsView({ requests, onCancel, onChatAdmin }: any) {
  return (
    <div className="space-y-8 w-full pb-10">
      <h2 className="text-5xl font-black tracking-tighter text-slate-900">My Requests</h2>
      {requests.length === 0 ? (
        <div className="glass-panel p-12 rounded-xl text-center text-slate-400 shadow-soft border-dashed">
          <Users size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-bold">No tutor requests sent yet.</p>
          <Link href="/tutors" className="mt-4 inline-block text-blue-600 font-black text-sm hover:underline">Browse Tutors →</Link>
        </div>
      ) : requests.map((req: StudentRequest) => (
        <div key={req.id} className="bg-white border border-slate-100 rounded-xl p-6 shadow-soft flex flex-col sm:flex-row justify-between gap-4">
          <div>
            <p className="font-black text-slate-900 text-base">{req.tutors?.name || 'Tutor'}</p>
            <div className="flex flex-wrap gap-3 mt-2 text-sm text-slate-500 font-medium">
              <span className="flex items-center gap-1"><GraduationCap size={13} />{req.grade}</span>
              {req.preferred_mode && <span className="flex items-center gap-1"><Monitor size={13} />{req.preferred_mode}</span>}
              {req.tutors?.location && <span className="flex items-center gap-1"><MapPin size={13} />{req.tutors.location}</span>}
            </div>
            {req.message && <p className="text-sm text-slate-600 mt-3 italic bg-slate-50 rounded-lg p-3 border border-slate-100">"{req.message}"</p>}
            <div className="mt-3"><StatusBadge status={req.status} /></div>
          </div>
          <div className="flex gap-2 shrink-0 items-start">
            <button onClick={onChatAdmin} className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-black rounded-lg transition-colors flex items-center gap-1.5"><MessageCircle size={14} />Chat Support</button>
            <button onClick={() => onCancel(req.id)} className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-black rounded-lg transition-colors">Cancel</button>
          </div>
        </div>
      ))}
    </div>
  );
}

function TutorDashboardView({ profile, userId, userName, userEmail, applicationsCount, requestsCount, course, urgentVacancies, onShowApplications, onShowRequests, onFixProfile, globalRecordings }: any) {
  const completeness = profile ? [profile.bio, profile.education, profile.experience, profile.contact_num, profile.location, profile.hour_rate, profile.mode_of_teaching].filter(Boolean).length : 0;
  const pct = Math.round((completeness / 7) * 100);

  return (
    <div className="space-y-8 w-full pb-10">
      <h2 className="text-5xl font-black tracking-tighter text-slate-900">Tutor Hub</h2>

      {pct < 100 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 flex items-start gap-4">
          <AlertCircle className="w-6 h-6 text-amber-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-black text-amber-800">Profile {pct}% complete — finish your profile to attract more students.</p>
            <div className="w-full bg-amber-100 rounded-full h-2 mt-3"><div className="bg-amber-500 h-2 rounded-full transition-all" style={{ width: `${pct}%` }}></div></div>
          </div>
          <button onClick={onFixProfile} className="shrink-0 bg-amber-500 hover:bg-amber-600 text-white text-xs font-black px-4 py-2 rounded-lg transition-colors">Complete Profile</button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard label="My Applications" value={applicationsCount} icon={<Briefcase size={24} />} isTutor={true} />
        <StatCard label="Student Requests" value={requestsCount} icon={<Users size={24} />} isTutor={true} />
        <StatCard label="Urgent Vacancies" value={urgentVacancies?.length || 0} icon={<Flame size={24} />} isTutor={true} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-4">
            <button onClick={onShowApplications} className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white py-4 rounded-xl font-black shadow-[0_10px_25px_rgba(16,185,129,0.3)] hover:scale-[1.02] transition-all flex items-center justify-center gap-2">
              <Briefcase size={20} /> View My Applications
            </button>
            <button onClick={onShowRequests} className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 text-white py-4 rounded-xl font-black shadow-[0_10px_25px_rgba(59,130,246,0.3)] hover:scale-[1.02] transition-all flex items-center justify-center gap-2">
              <Users size={20} /> View Student Requests
            </button>
          </div>
          {globalRecordings?.length > 0 && <RecommendedRecordingsBox recordings={globalRecordings} />}
        </div>
        {course && (
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center px-1">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                <Sparkles size={16} className="text-orange-500" /> Featured Online Course
              </h3>
              <Link href="/onlinecourse" className="text-xs font-black text-blue-600 hover:underline flex items-center gap-1">
                See All <ArrowRight size={14} />
              </Link>
            </div>
            <LatestCourseCard course={course} isTutor={true} />
          </div>
        )}
      </div>

      {urgentVacancies?.length > 0 && (
        <div className="glass-panel rounded-xl p-6 shadow-soft">
          <h3 className="text-sm font-black text-red-600 uppercase tracking-widest mb-4 flex items-center gap-2"><Flame size={16} className="animate-pulse" /> Urgent Vacancies</h3>
          <div className="space-y-3">
            {urgentVacancies.slice(0, 3).map((v: Vacancy) => (
              <div key={v.id} className="flex items-center justify-between bg-red-50 border border-red-100 p-4 rounded-lg">
                <div>
                  <p className="font-black text-slate-900">{v.subject}</p>
                  <p className="text-xs text-slate-500 font-medium mt-0.5 flex items-center gap-1"><MapPin size={11} />{v.location} • {v.class_level}</p>
                </div>
                <Link href={`/vacancies/${v.id}`} className="text-xs font-black text-red-600 hover:underline flex items-center gap-1">Apply <ExternalLink size={11} /></Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function AvailableVacanciesView({ vacancies }: any) {
  const [search, setSearch] = useState('');
  const filtered = vacancies.filter((v: Vacancy) =>
    v.subject.toLowerCase().includes(search.toLowerCase()) || v.location.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 w-full pb-10">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h2 className="text-5xl font-black tracking-tighter text-slate-900">Job Board</h2>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search subject or location…"
          className="border border-slate-200 bg-white rounded-xl px-4 py-3 text-sm font-medium outline-none focus:border-blue-400 shadow-soft w-full sm:w-64"
        />
      </div>
      {filtered.length === 0 ? (
        <div className="glass-panel p-12 rounded-xl text-center text-slate-400 shadow-soft"><p className="font-bold">No vacancies found.</p></div>
      ) : filtered.map((v: Vacancy) => (
        <div key={v.id} className="bg-white border border-slate-100 rounded-xl p-6 shadow-soft flex flex-col sm:flex-row justify-between gap-4 hover:shadow-medium hover:-translate-y-0.5 transition-all">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-black text-xl text-slate-900">{v.subject}</h3>
              {v.urgent && <span className="bg-red-100 text-red-700 text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md flex items-center gap-1"><Flame size={10} />Urgent</span>}
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-slate-500 font-medium">
              <span className="flex items-center gap-1"><MapPin size={13} />{v.location}</span>
              <span className="flex items-center gap-1"><GraduationCap size={13} />{v.class_level}</span>
              <span className="flex items-center gap-1"><Clock size={13} />{v.class_time}</span>
              <span className="flex items-center gap-1"><DollarSign size={13} />{v.salary_range}</span>
            </div>
            {v.description && <p className="text-sm text-slate-600 mt-3 line-clamp-2">{v.description}</p>}
          </div>
          <div className="shrink-0">
            <Link href={`/vacancies/${v.id}`} className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-black text-sm shadow-md transition-all hover:scale-[1.02]">
              Apply <ExternalLink size={14} />
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}

function StudentRequestsView({ requests, onUpdateStatus, onChatAdmin }: any) {
  return (
    <div className="space-y-8 w-full pb-10">
      <h2 className="text-5xl font-black tracking-tighter text-slate-900">Student Requests</h2>
      {requests.length === 0 ? (
        <div className="glass-panel p-12 rounded-xl text-center text-slate-400 shadow-soft border-dashed">
          <Users size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-bold">No student requests yet. Complete your profile to attract students.</p>
        </div>
      ) : requests.map((req: StudentRequest) => (
        <div key={req.id} className="bg-white border border-slate-100 rounded-xl p-6 shadow-soft flex flex-col sm:flex-row justify-between gap-4">
          <div>
            <p className="font-black text-slate-900 text-base">{req.tutors?.name || 'Tutor'}</p>
            <div className="flex flex-wrap gap-3 mt-2 text-sm text-slate-500 font-medium">
              <span className="flex items-center gap-1"><Phone size={13} />{req.phone}</span>
              <span className="flex items-center gap-1"><GraduationCap size={13} />{req.grade}</span>
              {req.preferred_mode && <span className="flex items-center gap-1"><Monitor size={13} />{req.preferred_mode}</span>}
            </div>
            {req.message && <p className="text-sm text-slate-600 mt-3 italic bg-slate-50 rounded-lg p-3 border border-slate-100">"{req.message}"</p>}
            <div className="mt-3"><StatusBadge status={req.status} /></div>
          </div>
          <div className="flex flex-col gap-2 shrink-0">
            {req.status !== 'accepted' && (
              <button onClick={() => onUpdateStatus(req.id, 'accepted')} className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-lg transition-colors justify-center"><Check size={14} />Accept</button>
            )}
            {req.status !== 'rejected' && (
              <button onClick={() => onUpdateStatus(req.id, 'rejected')} className="flex items-center gap-1.5 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-black rounded-lg transition-colors justify-center"><X size={14} />Decline</button>
            )}
            <button onClick={onChatAdmin} className="flex items-center gap-1.5 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-black rounded-lg transition-colors justify-center"><MessageCircle size={14} />Support</button>
          </div>
        </div>
      ))}
    </div>
  );
}

function MyInfoView({ profile, onSave }: any) {
  const [form, setForm] = useState<Partial<Tutor>>(profile || {});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => { if (profile) setForm(profile); }, [profile]);

  const handleSave = async () => {
    setSaving(true);
    const ok = await onSave(form);
    setSaving(false);
    if (ok) { setSaved(true); setTimeout(() => setSaved(false), 3000); }
  };

  const fields = [
    { key: 'name', label: 'Full Name', type: 'text' },
    { key: 'subject', label: 'Subjects (comma separated)', type: 'text' },
    { key: 'location', label: 'Location', type: 'text' },
    { key: 'experience', label: 'Experience (Years)', type: 'number' },
    { key: 'education', label: 'Education', type: 'text' },
    { key: 'hour_rate', label: 'Hourly Rate (Rs.)', type: 'number' },
    { key: 'contact_num', label: 'Contact Number', type: 'text' },
    { key: 'mode_of_teaching', label: 'Mode of Teaching', type: 'text' },
    { key: 'cv_url', label: 'CV URL', type: 'text' },
    { key: 'id_url', label: 'ID Card URL', type: 'text' },
  ];

  return (
    <div className="space-y-8 w-full pb-10">
      <h2 className="text-5xl font-black tracking-tighter text-slate-900">My Info</h2>
      <div className="bg-white border border-slate-100 rounded-xl p-8 shadow-soft space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {fields.map(({ key, label, type }) => (
            <div key={key} className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</label>
              {key === 'subject' ? (
                <input
                  type="text"
                  value={form.subject ? (Array.isArray(form.subject) ? form.subject.join(', ') : form.subject) : ''}
                  onChange={e => setForm(p => ({ ...p, subject: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }))}
                  className="border border-slate-200 rounded-lg px-4 py-3 text-sm font-medium outline-none focus:border-blue-400 focus:bg-blue-50/30 bg-slate-50 transition-all"
                  placeholder="Math, Science, English"
                />
              ) : (
                <input
                  type={type}
                  value={(form as any)[key] || ''}
                  onChange={e => setForm(p => ({ ...p, [key]: type === 'number' ? (e.target.value ? Number(e.target.value) : '') : e.target.value }))}
                  className="border border-slate-200 rounded-lg px-4 py-3 text-sm font-medium outline-none focus:border-blue-400 focus:bg-blue-50/30 bg-slate-50 transition-all"
                />
              )}
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Bio</label>
          <textarea
            value={form.bio || ''}
            onChange={e => setForm(p => ({ ...p, bio: e.target.value }))}
            rows={4}
            className="border border-slate-200 rounded-lg px-4 py-3 text-sm font-medium outline-none focus:border-blue-400 bg-slate-50 resize-none transition-all"
            placeholder="Tell students about yourself…"
          />
        </div>

        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.availability || false} onChange={e => setForm(p => ({ ...p, availability: e.target.checked }))}
              className="w-4 h-4 accent-green-600"
            />
            <span className="font-black text-slate-700 text-sm">Currently Available for Students</span>
          </label>
        </div>

        <div className="flex items-center gap-4 pt-4 border-t border-slate-100">
          <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 disabled:opacity-50 text-white px-8 py-3.5 rounded-xl font-black text-sm shadow-md transition-all hover:scale-[1.02]">
            {saving ? <RotateCcw size={16} className="animate-spin" /> : <Save size={16} />}
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
          {saved && (
            <span className="flex items-center gap-1.5 text-emerald-600 text-sm font-black">
              <CheckCircle size={16} /> Saved successfully!
            </span>
          )}
        </div>
      </div>
    </div>
  );
}