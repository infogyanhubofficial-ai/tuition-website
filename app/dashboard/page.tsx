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
  CheckCircle, Flame, Sparkles, RotateCcw, Home, Award, ShoppingBag, PlayCircle,
  ChevronDown, ChevronUp, Video, Info, ArrowRight, Menu
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";

// --- DESIGN TOKENS ---
const tokens = {
  radius: {
    card: "rounded-2xl",
    button: "rounded-xl",
    badge: "rounded-lg",
  },
  padding: {
    small: "p-4 sm:p-5",
    main: "p-4 sm:p-6",
    hero: "p-6 sm:p-8 md:p-10",
  },
  shadow: {
    card: "shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-200/60 bg-gradient-to-b from-white to-slate-50/40",
    hover: "hover:shadow-[0_15px_35px_rgba(30,58,138,0.06)] hover:-translate-y-1 hover:border-blue-500/30 transition-all duration-300 ease-in-out",
  },
  colors: {
    primary: "blue-700",
    accent: "orange-500",
    surface: "bg-white",
    background: "bg-[#F8FAFC]",
  }
};

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
  course_code?: string;
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
  course_code?: string;
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

// --- MAIN PAGE ---
export default function ProfilePage() {
  const router = useRouter();
  const supabase = createClient();
  
  // States
  const [activeTab, setActiveTab] = useState('Overview');
  const [loading, setLoading] = useState(true);
  
  // Dropdown / Navigation States
  const [isExploreOpen, setIsExploreOpen] = useState(false);
  const [isCoursesOpen, setIsCoursesOpen] = useState(true);
  const [isTuitionServicesOpen, setIsTuitionServicesOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [dashboardMode, setDashboardMode] = useState<'home' | 'student' | 'tutor'>('home');
  
  // Lifted Modal States (to allow hiding floating elements globally)
  const [isApplicationsOpen, setIsApplicationsOpen] = useState(false);
  const [appFilterId, setAppFilterId] = useState<number | null>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<Order | null>(null);
  const [globalExpiredClassLink, setGlobalExpiredClassLink] = useState<string | null>(null);
  
  // Data States
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

  // Derived Properties
  const pendingVerificationOrders = useMemo(() =>
    orders.filter(o => o.status.toLowerCase() === 'pending' || o.status.toLowerCase() === 'processing'), [orders]);
  const pendingCoursePayments = useMemo(() => enrollments.filter(e => e.remaining_amount > 0), [enrollments]);
  const activeCourseAccess = useMemo(() => enrollments, [enrollments]);
  const recordingOrdersVerified = useMemo(() =>
    orders.filter(o => o.order_type === 'recording' && o.status.toLowerCase() === 'verified'), [orders]);

  // Derived Modal Tracker for Floating UI Management
  const isAnyModalOpen = isApplicationsOpen || !!selectedTransaction || !!globalExpiredClassLink;

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
      const { data: ordersV2, error: ordersError } = await supabase
        .from('orders_v2')
        .select('*')
        .eq('user_id', uid)
        .order('created_at', { ascending: false });
      if (ordersError) setOrdersError(ordersError.message);
      else if (ordersV2) {
        const mappedOrders = ordersV2.map(o => ({
          id: o.id,
          full_name: 'You',
          email: email,
          contact_number: '',
          order_type: o.order_type,
          order_name: o.order_name,
          price: o.paid_amount || 0,
          screenshot_url: o.payment_screenshots?.[0] || '',
          status: o.status || 'pending',
          created_at: o.created_at,
          enrollment_id: o.enrollment_id,
          locked_price: o.locked_price
        }));
        setOrders(mappedOrders as any);
        setOrdersError(null);
      }
      const { data: certs } = await supabase.from('certificates').select('*').ilike('email', email);
      if (certs) setCertificates(certs as any);
      const { data: recordings } = await supabase.from('recordings').select('*');
      if (recordings) setRecordingsList(recordings as any);
      
      const { data: enrollsV2 } = await supabase
        .from('enrollments_v2')
        .select('*')
        .or(`user_id.eq.${uid},email.ilike.${email}`)
        .order('created_at', { ascending: false });

      if (enrollsV2 && enrollsV2.length > 0) {
        const batchIds = Array.from(new Set(enrollsV2.map(e => e.batch_id)));
        const { data: batchesV2 } = await supabase
          .from('course_batches_v2')
          .select('*')
          .in('id', batchIds);
          
        const relatedSyllabusIds: string[] = [];
        if (batchesV2) {
          batchesV2.forEach(b => {
            if (b.syllabus_id) relatedSyllabusIds.push(b.syllabus_id);
            if (b.course_id) relatedSyllabusIds.push(b.course_id); 
          });
        }
        
        const { data: coursesV2 } = await supabase
          .from('online_courses_v2')
          .select('*')
          .in('syllabus_id', relatedSyllabusIds);
          
        const { data: syllabiV2 } = await supabase
          .from('syllabi_v2')
          .select('*')
          .in('id', relatedSyllabusIds);
          
        const mappedEnrollments = enrollsV2.map(env2 => {
          const batch = batchesV2?.find(b => b.id === env2.batch_id);
          const targetSyllabusId = batch?.syllabus_id || batch?.course_id;
          const syllabus = syllabiV2?.find(s => s.id === targetSyllabusId);
          const courseStorefront = coursesV2?.find(c => c.syllabus_id === targetSyllabusId);
          
          const relatedOrders = ordersV2?.filter(o => o.enrollment_id === env2.id && o.status !== 'rejected') || [];
          const paid = relatedOrders.reduce((sum, o) => sum + (o.paid_amount || 0), 0);
          const lockedPrice = relatedOrders.length > 0 ? relatedOrders[0].locked_price : (courseStorefront?.fee || 0);
          const remaining = Math.max(0, lockedPrice - paid);
          
          return {
            id: env2.id,
            user_id: env2.user_id || uid,
            course_id: targetSyllabusId || '',
            email: env2.email,
            course_name: syllabus?.name || courseStorefront?.title || 'Unknown Course',
            status: env2.is_confirmed ? 'confirmed' : 'pending',
            paid_amount: paid,
            remaining_amount: remaining,
            starting_date: batch?.start_datetime || new Date().toISOString(),
            batch_no: batch?.batch_no || 1,
            created_at: env2.created_at,
          };
        });
        setEnrollments(mappedEnrollments);
        
        const mappedBatches = batchesV2?.map(b => ({
          course_id: b.syllabus_id || b.course_id, 
          batch_no: b.batch_no || 1,
          online_class_link: b.online_class_link,
          google_classroom_link: b.google_classroom_link,
          whatsapp_group_link: b.whatsapp_group_link,
          is_active: b.is_active !== false,
          start_datetime: b.start_datetime,
          timing: b.timing
        })) || [];
        setCourseBatches(mappedBatches);
        
        const mappedCourses = coursesV2?.map(c => {
          const s = syllabiV2?.find(syl => syl.id === c.syllabus_id);
          let activeBatch = batchesV2?.find(b => b.syllabus_id === c.syllabus_id && b.batch_no === c.active_batch_no);
          if (!activeBatch) {
            activeBatch = batchesV2?.find(b => b.syllabus_id === c.syllabus_id);
          }
          return {
            id: c.syllabus_id,
            title: s?.name || c.name || 'Course',
            course_code: s?.course_code || '',
            category: s?.category,
            difficulty_level: s?.difficulty_level,
            cover_pic: s?.cover_pic || '',
            tutor_name: '',
            duration: s?.duration || '',
            timing: activeBatch?.timing || 'TBA',
            fee: c.fee,
            discount: c.discount || 0,
            start_datetime: activeBatch?.start_datetime || new Date().toISOString(),
            learning_outcomes: s?.learning_outcomes || [],
            faqs: s?.faqs || [],
            syllabus_url: s?.syllabus_pdf,
            syllabus: s
          };
        }) || [];
        setOnlineCourseDetails(mappedCourses as any);
      } else {
        setEnrollments([]);
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
    try {
      const { data: coursesV2 } = await supabase
        .from('online_courses_v2')
        .select('*')
        .eq('is_active', true);
        
      if (coursesV2 && coursesV2.length > 0) {
        const rand = coursesV2[Math.floor(Math.random() * coursesV2.length)];
        let courseTitle = rand.name || 'Featured Course';
        let courseCode = '';
        let coverPic = '';
        let tutorName = 'Expert Tutor';
        let duration = 'Flexible';
        let difficulty = 'All Levels';
        let batchTiming = 'TBA';
        let batchStart = new Date().toISOString();
        
        if (rand.syllabus_id) {
          const { data: sData } = await supabase
            .from('syllabi_v2')
            .select('*')
            .eq('id', rand.syllabus_id)
            .maybeSingle();
          if (sData) {
            courseTitle = sData.name || courseTitle;
            courseCode = sData.course_code || '';
            coverPic = sData.cover_pic || '';
            duration = sData.duration || duration;
            difficulty = sData.difficulty_level || difficulty;
            if (sData.tutor_id) {
              const { data: tData } = await supabase
                .from('online_tutors')
                .select('name')
                .eq('id', sData.tutor_id)
                .maybeSingle();
              if (tData?.name) tutorName = tData.name;
            }
          }
          let { data: bData } = await supabase
            .from('course_batches_v2')
            .select('timing, start_datetime')
            .eq('syllabus_id', rand.syllabus_id)
            .eq('batch_no', rand.active_batch_no || 1)
            .maybeSingle();

          if (!bData) {
            const { data: bDataFallback } = await supabase
              .from('course_batches_v2')
              .select('timing, start_datetime')
              .eq('syllabus_id', rand.syllabus_id)
              .limit(1)
              .maybeSingle();
            bData = bDataFallback;
          }
          if (bData) {
            batchTiming = bData.timing || 'TBA';
            batchStart = bData.start_datetime || batchStart;
          }
        }
        setLatestCourse({
          id: rand.syllabus_id || 'featured',
          title: courseTitle,
          course_code: courseCode,
          fee: rand.fee || 0,
          discount: rand.discount || 0,
          cover_pic: coverPic,
          start_datetime: batchStart, 
          tutor_name: tutorName,
          duration: duration,
          timing: batchTiming,
          difficulty_level: difficulty
        } as any);
      } else {
        const { data: v1Data } = await supabase
          .from('online_courses')
          .select('*')
          .limit(1)
          .maybeSingle();
        if (v1Data) setLatestCourse(v1Data as any);
      }
      
      const { data: tData } = await supabase.from('tutors').select('*').eq('verified', true).limit(10);
      if (tData) setVerifiedTutors(tData as any);
      
      const { data: recData } = await supabase
        .from('recordings')
        .select('id, course_name, course_hours, standard_fee, discount, cover_pic_url')
        .eq('is_active', true)
        .limit(3);
      if (recData) setGlobalRecordings(recData as any);
    } catch (err) {
      console.error("Global Data Fetch Error:", err);
    }
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

  const getRoleColors = () => {
    if (isTutorMode) return { bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200' };
    if (isStudentMode) return { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' };
    return { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' };
  };
  const roleColors = getRoleColors();

  // Unified rendering function for both Desktop Sidebar and Mobile Drawer
  const renderSidebarLinks = (onMobileClose?: () => void) => {
    const handleTabClick = (tab: string) => {
      setActiveTab(tab);
      if (onMobileClose) onMobileClose();
    };

    return (
      <div className="space-y-1">
        {dashboardMode === 'home' && (
          <NavButton icon={<Home size={20} />} label="Overview" active={activeTab === 'Overview'} onClick={() => handleTabClick('Overview')} colorTheme="blue" />
        )}

        {dashboardMode === 'tutor' && (
          hasTutorProfile ? (
            <>
              <NavButton icon={<LayoutDashboard size={20} />} label="Dashboard" active={activeTab === 'Dashboard'} onClick={() => handleTabClick('Dashboard')} colorTheme="violet" />
              <NavButton icon={<Briefcase size={20} />} label="Job Board" active={activeTab === 'Available Vacancies'} onClick={() => handleTabClick('Available Vacancies')} colorTheme="violet" />
              <NavButton icon={<Users size={20} />} label="Student Requests" active={activeTab === 'Student Requests'} onClick={() => handleTabClick('Student Requests')} colorTheme="violet" />
              <NavButton icon={<User size={20} />} label="My Info" active={activeTab === 'My Info'} onClick={() => handleTabClick('My Info')} colorTheme="violet" />
            </>
          ) : (
            <NavButton icon={<LayoutDashboard size={20} />} label="Dashboard" active={true} onClick={() => { if(onMobileClose) onMobileClose(); }} colorTheme="violet" />
          )
        )}

        {dashboardMode === 'student' && (
          hasTutorProfile ? (
            <NavButton icon={<LayoutDashboard size={20} />} label="Dashboard" active={true} onClick={() => { if(onMobileClose) onMobileClose(); }} colorTheme="emerald" />
          ) : (
            <>
              <NavButton icon={<LayoutDashboard size={20} />} label="Dashboard" active={activeTab === 'Dashboard'} onClick={() => handleTabClick('Dashboard')} colorTheme="emerald" />
              <NavButton icon={<FileText size={20} />} label="My Postings" active={activeTab === 'Posted Vacancies'} onClick={() => handleTabClick('Posted Vacancies')} colorTheme="emerald" />
              <NavButton icon={<Users size={20} />} label="My Requests" active={activeTab === 'My Requests'} onClick={() => handleTabClick('My Requests')} colorTheme="emerald" />
            </>
          )
        )}

        <div className="h-px bg-slate-200/60 my-5 mx-4" />
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-5 mb-3">My Learning Hub</p>

        <div className="flex flex-col w-full">
          <button
            onClick={() => setIsCoursesOpen(!isCoursesOpen)}
            className={`w-full flex items-center justify-between px-5 py-2.5 ${tokens.radius.button} text-sm font-bold transition-colors duration-200 ${(activeTab === 'Online Courses' || activeTab === 'Recording Courses') ? 'bg-blue-50 text-blue-700 border-l-[3px] border-blue-600' : 'text-slate-600 hover:bg-slate-100 border-l-[3px] border-transparent'}`}
          >
            <div className="flex items-center gap-3">
              <BookOpen size={18} className={(activeTab === 'Online Courses' || activeTab === 'Recording Courses') ? "text-blue-600" : "text-slate-400"} />
              <span>My Courses</span>
            </div>
            {isCoursesOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          <AnimatePresence>
            {isCoursesOpen && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="flex flex-col gap-1 pl-11 pr-4 overflow-hidden pt-1 pb-2">
                <button onClick={() => handleTabClick('Online Courses')} className={`text-[13px] font-bold py-1.5 text-left transition-colors ${activeTab === 'Online Courses' ? 'text-blue-700' : 'text-slate-500 hover:text-blue-600'}`}>Live Classes</button>
                <button onClick={() => handleTabClick('Recording Courses')} className={`text-[13px] font-bold py-1.5 text-left transition-colors ${activeTab === 'Recording Courses' ? 'text-blue-700' : 'text-slate-500 hover:text-blue-600'}`}>Recordings</button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <NavButton icon={<Award size={18} />} label="My Certificates" active={activeTab === 'My Certificates'} onClick={() => handleTabClick('My Certificates')} colorTheme="blue" />
        <NavButton icon={<DollarSign size={18} />} label="Transactions" active={activeTab === 'Transactions'} onClick={() => handleTabClick('Transactions')} colorTheme="blue" />
        <NavButton icon={<MessageCircle size={18} />} label="Support Chatbot" active={activeTab === 'Support Chatbot'} onClick={() => handleTabClick('Support Chatbot')} colorTheme="blue" />

        <div className="h-px bg-slate-200/60 my-5 mx-4" />

        <button onClick={() => setIsExploreOpen(!isExploreOpen)} className={`w-full flex items-center justify-between px-5 py-2.5 ${tokens.radius.button} text-sm font-bold text-slate-600 hover:bg-slate-100 transition-colors border-l-[3px] border-transparent`}>
          <div className="flex items-center gap-3">
            <Compass size={18} className="text-slate-400" />
            <span>Explore More</span>
          </div>
          {isExploreOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        <AnimatePresence>
          {isExploreOpen && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="flex flex-col gap-1 pl-11 pr-4 overflow-hidden pb-2">
              <Link href="/onlinecourse" className="text-[13px] font-bold text-slate-500 hover:text-blue-600 py-1.5 transition-colors block">Live Courses</Link>
              <Link href="/recording" className="text-[13px] font-bold text-slate-500 hover:text-blue-600 py-1.5 transition-colors block">Recordings</Link>
              <Link href="/become-a-tutor" className="text-[13px] font-bold text-slate-500 hover:text-blue-600 py-1.5 transition-colors block">Become a Tutor</Link>
              <Link href="/post-tuition" className="text-[13px] font-bold text-slate-500 hover:text-blue-600 py-1.5 transition-colors block">Post a Vacancy</Link>
            </motion.div>
          )}
        </AnimatePresence>

        <a href="https://wa.me/9763695665" target="_blank" rel="noopener noreferrer" className={`w-full flex items-center gap-3 px-5 py-2.5 ${tokens.radius.button} text-sm font-bold text-slate-600 hover:bg-green-50 hover:text-green-700 transition-colors mt-2 border-l-[3px] border-transparent`}>
          <Phone size={18} className="text-green-500" />
          <span>WhatsApp Us</span>
        </a>

        <div className="h-px bg-slate-200/60 my-5 mx-4" />
        <button onClick={handleSignOut} className={`w-full flex items-center gap-3 px-5 py-2.5 ${tokens.radius.button} text-sm font-bold text-red-600 hover:bg-red-50 transition-colors border-l-[3px] border-transparent`}>
          <LogOut size={18} />
          <span>Signout</span>
        </button>
      </div>
    );
  };

  return (
    <div className={`min-h-screen ${tokens.colors.background} text-slate-900 pb-24 lg:pb-12 font-sans overflow-x-hidden flex flex-col`}>
      {pendingVerificationOrders.length > 0 && (
        <div className="bg-amber-100 border-b border-amber-200 text-amber-800 py-2 overflow-hidden relative flex items-center z-50 shadow-sm">
          <div className="animate-marquee whitespace-nowrap flex gap-10 font-bold text-[10px] sm:text-xs uppercase tracking-wide">
            {[1, 2, 3].map(i => (
              <span key={i}>Your payment is initiated and will be verified within 24 hours. Please have patience. (तपाईंको भुक्तानी सुरु गरिएको छ र २४ घण्टा भित्र प्रमाणित गरिनेछ। कृपया धैर्य गर्नुहोस्।)</span>
            ))}
          </div>
        </div>
      )}

      <style>{`
        @keyframes marquee { 0% { transform: translateX(0%); } 100% { transform: translateX(-50%); } } 
        .animate-marquee { animation: marquee 45s linear infinite; } 
        .animate-marquee:hover { animation-play-state: paused; } 
        .custom-scrollbar::-webkit-scrollbar { width: 6px; } 
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; } 
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 8px; } 
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; } 
      `}</style>

      {/* Conditionally hide Floating Chat Button when any modal is open */}
      {!isAnyModalOpen && (
        <div className="fixed bottom-24 sm:bottom-28 lg:bottom-10 right-4 lg:right-6 z-[60]">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={scrollToChatbox}
            className={`bg-blue-700 text-white px-4 sm:px-5 py-3 ${tokens.radius.button} shadow-[0_4px_20px_rgba(29,78,216,0.4)] flex items-center gap-2 font-bold text-xs sm:text-sm hover:bg-blue-800 transition-colors border border-blue-600`}
          >
            <MessageCircle size={18} className="fill-white/20" /> Support
          </motion.button>
        </div>
      )}

      {/* Global Modals rendered here */}
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
        
        {selectedTransaction && (
          <TransactionModal order={selectedTransaction} enrollments={enrollments} onClose={() => setSelectedTransaction(null)} />
        )}
        
        {globalExpiredClassLink && (
          <ClassExpiredModal onClose={() => setGlobalExpiredClassLink(null)} classroomLink={globalExpiredClassLink} />
        )}
      </AnimatePresence>

      {/* Mobile Drawer Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/60 z-[100] lg:hidden backdrop-blur-sm"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 bottom-0 w-[280px] bg-white z-[110] lg:hidden overflow-y-auto flex flex-col shadow-2xl"
            >
              <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 sticky top-0 z-10">
                <span className="font-extrabold text-slate-800 text-lg flex items-center gap-2">
                  <Menu size={18} className="text-blue-600" /> Menu
                </span>
                <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 bg-white rounded-full border border-slate-200 text-slate-500 hover:bg-slate-100 transition-colors shadow-sm">
                  <X size={16} />
                </button>
              </div>
              <div className="p-3 flex-grow overflow-y-auto custom-scrollbar">
                {renderSidebarLinks(() => setIsMobileMenuOpen(false))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Navbar - hidden if modal is open but layout space maintained */}
      {!isAnyModalOpen ? (
        <nav className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/60 h-[70px] sm:h-20 flex items-center px-4 sm:px-6 shadow-sm">
          <div className="max-w-7xl mx-auto w-full flex justify-between items-center">
            <div className="flex items-center gap-2 sm:gap-3">
              {userAvatar ? (
                <img src={userAvatar} className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl object-cover border border-slate-200 shadow-sm" alt={userName} />
              ) : (
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-700 to-blue-900 rounded-lg sm:rounded-xl flex items-center justify-center text-white font-bold text-lg sm:text-xl shadow-sm">
                  {userName?.charAt(0).toUpperCase() || 'G'}
                </div>
              )}
              <p className="flex items-center gap-1.5 sm:gap-2 text-[16px] sm:text-[20px] font-extrabold tracking-tight">
                <span className="text-slate-800 hidden sm:inline">{userName}</span>
                <span className="text-slate-300 font-normal hidden sm:inline">|</span>
                <span className="text-blue-700 font-bold">GyanHub</span>
                {dashboardMode !== 'home' && (
                  <span className={`ml-1 sm:ml-2 text-[8px] sm:text-[10px] uppercase tracking-widest px-2 sm:px-3 py-1 ${tokens.radius.badge} font-bold border shadow-sm ${roleColors.bg} ${roleColors.text} ${roleColors.border}`}>
                    {isTutorMode ? 'Tutor' : 'Student'}
                  </span>
                )}
              </p>
            </div>
            <div className="relative hidden lg:flex items-center bg-slate-100/80 p-1.5 rounded-xl border border-slate-200/80 gap-1.5 shadow-inner">
              <button
                onClick={() => { setDashboardMode('home'); setActiveTab('Overview'); setIsTuitionServicesOpen(false); }}
                className={`relative px-5 py-2 z-10 font-bold text-sm transition-all text-center ${tokens.radius.badge} ${
                  dashboardMode === 'home' ? 'bg-blue-600 shadow-md text-white' : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                Home
              </button>
              <div className="relative">
                <button
                  onClick={() => setIsTuitionServicesOpen(!isTuitionServicesOpen)}
                  className={`relative px-5 py-2 z-10 font-bold text-sm transition-all text-center flex items-center gap-2 ${tokens.radius.badge} ${
                    (dashboardMode === 'student' || dashboardMode === 'tutor') 
                      ? `shadow-md text-white ${dashboardMode === 'student' ? 'bg-emerald-600' : 'bg-violet-600'}` 
                      : 'text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Tuition Services
                  {isTuitionServicesOpen ? <ChevronUp size={14} className="text-current" /> : <ChevronDown size={14} className="text-current" />}
                </button>
                <AnimatePresence>
                  {isTuitionServicesOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} transition={{ duration: 0.2 }}
                      className={`absolute top-full right-0 mt-3 w-48 bg-white border border-slate-100 shadow-[0_10px_40px_rgba(0,0,0,0.08)] ${tokens.radius.card} p-2 flex flex-col gap-1 z-50`}
                    >
                      <button
                        onClick={() => { setDashboardMode('student'); setActiveTab('Dashboard'); setIsTuitionServicesOpen(false); }}
                        className={`flex items-center gap-3 px-4 py-2.5 ${tokens.radius.button} font-bold text-sm transition-colors ${
                          dashboardMode === 'student' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-600 hover:bg-emerald-50 hover:text-emerald-700'
                        }`}
                      >
                        <Users size={16} className={dashboardMode === 'student' ? "text-white" : "text-emerald-500"} /> Student View
                      </button>
                      <button
                        onClick={() => { setDashboardMode('tutor'); setActiveTab('Dashboard'); setIsTuitionServicesOpen(false); }}
                        className={`flex items-center gap-3 px-4 py-2.5 ${tokens.radius.button} font-bold text-sm transition-colors mt-1 ${
                          dashboardMode === 'tutor' ? 'bg-violet-600 text-white shadow-md' : 'text-slate-600 hover:bg-violet-50 hover:text-violet-700'
                        }`}
                      >
                        <Briefcase size={16} className={dashboardMode === 'tutor' ? "text-white" : "text-violet-500"} /> Tutor View
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </nav>
      ) : (
        <div className="h-[70px] sm:h-20 w-full shrink-0" /> // Placeholder to prevent jump
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-4 sm:mt-8 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 relative flex-grow w-full">
        {/* Sidebar */}
        <aside className="hidden lg:block lg:col-span-3">
          <div className={`bg-transparent p-2 sticky top-28 space-y-1 h-[calc(100vh-140px)] overflow-y-auto custom-scrollbar`}>
            {renderSidebarLinks()}
          </div>
        </aside>

        {/* Main Content */}
        <main className="lg:col-span-9 w-full relative z-10" aria-busy={loading}>
          {loading ? <SkeletonLoader /> : (
            <AnimatePresence mode="wait">
              <motion.div
                key={`${activeTab}-${dashboardMode}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="w-full"
              >
                {/* LOCKED STATES */}
                {dashboardMode === 'tutor' && !hasTutorProfile && (
                  <div className={`bg-gradient-to-br from-white to-slate-50 border border-slate-200/60 ${tokens.radius.card} p-6 sm:p-10 lg:p-16 text-center flex flex-col items-center justify-center min-h-[50vh] ${tokens.shadow.card} relative overflow-hidden`}>
                    <div className="absolute top-0 right-0 p-10 sm:p-20 opacity-[0.03]"><Lock size={200} className="sm:w-[300px] sm:h-[300px]"/></div>
                    <div className={`w-20 h-20 sm:w-24 sm:h-24 bg-slate-100 text-slate-400 ${tokens.radius.card} flex items-center justify-center mb-6 shadow-inner`}><Lock size={32} /></div>
                    <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-3 tracking-tight relative z-10">Tutor Profile Locked</h2>
                    <p className="text-sm sm:text-lg text-slate-500 font-medium max-w-sm mx-auto mb-8 relative z-10">You need an approved tutor profile to access this dashboard.</p>
                    <button onClick={() => window.location.href = '/become-a-tutor'} className={`bg-blue-700 hover:bg-blue-800 text-white px-6 sm:px-8 py-3 sm:py-3.5 ${tokens.radius.button} font-bold shadow-lg transition-colors relative z-10 tracking-wide text-sm sm:text-base`}>Setup Tutor Profile</button>
                  </div>
                )}

                {dashboardMode === 'student' && hasTutorProfile && (
                  <div className={`bg-gradient-to-br from-white to-slate-50 border border-slate-200/60 ${tokens.radius.card} p-6 sm:p-10 lg:p-16 text-center flex flex-col items-center justify-center min-h-[50vh] ${tokens.shadow.card} relative overflow-hidden`}>
                    <div className="absolute top-0 right-0 p-10 sm:p-20 opacity-[0.03]"><Briefcase size={200} className="sm:w-[300px] sm:h-[300px]" /></div>
                    <div className={`w-20 h-20 sm:w-24 sm:h-24 bg-blue-50 text-blue-700 ${tokens.radius.card} flex items-center justify-center mb-6 shadow-inner`}><Briefcase size={32} /></div>
                    <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-3 tracking-tight relative z-10">Student View Restricted</h2>
                    <p className="text-sm sm:text-lg text-slate-500 font-medium max-w-sm mx-auto mb-8 relative z-10">You are registered as a Tutor. Please use the Tutor Dashboard.</p>
                    <button onClick={() => { setDashboardMode('tutor'); setActiveTab('Dashboard'); }} className={`bg-blue-700 hover:bg-blue-800 text-white px-6 sm:px-8 py-3 sm:py-3.5 ${tokens.radius.button} font-bold shadow-lg transition-colors relative z-10 tracking-wide text-sm sm:text-base`}>Go to Tutor Hub</button>
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
                  <MyCoursesView 
                    activeTab={activeTab} enrollments={enrollments} onlineCourseDetails={onlineCourseDetails} 
                    courseBatches={courseBatches} pendingVerificationOrders={pendingVerificationOrders} 
                    orders={orders} recordingsList={recordingsList} router={router}
                    onOpenExpiredModal={setGlobalExpiredClassLink}
                  />
                )}

                {activeTab === 'Recording Courses' && (
                  <MyCoursesView 
                    activeTab={activeTab} enrollments={enrollments} onlineCourseDetails={onlineCourseDetails} 
                    courseBatches={courseBatches} pendingVerificationOrders={pendingVerificationOrders} 
                    orders={orders} recordingsList={recordingsList} router={router}
                    onOpenExpiredModal={setGlobalExpiredClassLink}
                  />
                )}

                {activeTab === 'My Certificates' && <MyCertificatesView certificates={certificates} formatDate={formatDate} />}

                {activeTab === 'Transactions' && (
                  <TransactionsView 
                    orders={orders} 
                    ordersError={ordersError} 
                    enrollments={enrollments} 
                    formatDate={formatDate} 
                    selectedTransaction={selectedTransaction}
                    setSelectedTransaction={setSelectedTransaction}
                  />
                )}

                {activeTab === 'Support Chatbot' && (
                  <div className="space-y-4 sm:space-y-6">
                    <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900">Support Chat</h2>
                    <ChatBox userId={userId} userName={userName} isTutor={isTutorMode} />
                  </div>
                )}

                {/* STUDENT VIEWS */}
                {dashboardMode === 'student' && !hasTutorProfile && activeTab === 'Dashboard' && (
                  <DashboardView userId={userId} userName={userName} count={applicantCount} course={latestCourse} verifiedTutors={verifiedTutors} onShowApplications={() => openApplicationsModal()} globalRecordings={globalRecordings} router={router} />
                )}

                {dashboardMode === 'student' && !hasTutorProfile && activeTab === 'Posted Vacancies' && (
                  <VacanciesView vacancies={vacancies} onUpdate={handleUpdateVacancy} onDelete={handleDeleteVacancy} onViewApplicants={openApplicationsModal} />
                )}

                {dashboardMode === 'student' && !hasTutorProfile && activeTab === 'My Requests' && (
                  <StudentMyRequestsView requests={studentMyRequests} onCancel={handleCancelMyRequest} onChatAdmin={scrollToChatbox} />
                )}

                {/* TUTOR VIEWS */}
                {dashboardMode === 'tutor' && hasTutorProfile && activeTab === 'Dashboard' && (
                  <TutorDashboardView profile={tutorProfile} userId={userId} userName={userName} userEmail={userEmail} applicationsCount={tutorApplications.length} requestsCount={studentRequests.length} course={latestCourse} urgentVacancies={urgentVacancies} onShowApplications={() => openApplicationsModal()} onShowRequests={() => setActiveTab('Student Requests')} onFixProfile={() => setActiveTab('My Info')} globalRecordings={globalRecordings} router={router} />
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

      {/* Conditionally hide Mobile Bottom Nav when any modal is open */}
      {!isAnyModalOpen && (
        <nav className="lg:hidden fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 bg-white/95 backdrop-blur-md border border-slate-200/80 shadow-[0_8px_32px_rgba(0,0,0,0.12)] rounded-full px-3 py-1.5 flex justify-center gap-2 sm:gap-6 items-center">
          <MobileNavButton 
            icon={<Home size={18} />} 
            label="Home" 
            active={dashboardMode === 'home'} 
            onClick={() => { setDashboardMode('home'); setActiveTab('Overview'); setIsTuitionServicesOpen(false); setIsMobileMenuOpen(false); }} 
            colorTheme="blue" 
          />
          
          <div className="relative flex flex-col items-center">
            <AnimatePresence>
              {isTuitionServicesOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }} transition={{ duration: 0.2 }}
                  className={`absolute bottom-[calc(100%+12px)] left-1/2 -translate-x-1/2 bg-white ${tokens.radius.card} shadow-[0_10px_40px_rgba(0,0,0,0.15)] border border-slate-100 p-1.5 flex flex-col gap-1.5 min-w-[140px] z-50`}
                >
                  <button
                    onClick={() => { setDashboardMode('student'); setActiveTab('Dashboard'); setIsTuitionServicesOpen(false); setIsMobileMenuOpen(false); }}
                    className={`flex items-center gap-2 p-2.5 ${tokens.radius.button} text-xs font-bold transition-colors ${
                      dashboardMode === 'student' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-600 hover:bg-emerald-50'
                    }`}
                  >
                    <Users size={14} className={dashboardMode === 'student' ? 'text-white' : ''} /> Student
                  </button>
                  <button
                    onClick={() => { setDashboardMode('tutor'); setActiveTab('Dashboard'); setIsTuitionServicesOpen(false); setIsMobileMenuOpen(false); }}
                    className={`flex items-center gap-2 p-2.5 ${tokens.radius.button} text-xs font-bold transition-colors ${
                      dashboardMode === 'tutor' ? 'bg-violet-600 text-white shadow-md' : 'text-slate-600 hover:bg-violet-50'
                    }`}
                  >
                    <Briefcase size={14} className={dashboardMode === 'tutor' ? 'text-white' : ''} /> Tutor
                  </button>
                  <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-b border-r border-slate-100 transform rotate-45"></div>
                </motion.div>
              )}
            </AnimatePresence>
            <MobileNavButton
              icon={<GraduationCap size={18} />}
              label="Tuition"
              active={dashboardMode === 'student' || dashboardMode === 'tutor'}
              onClick={() => { setIsTuitionServicesOpen(!isTuitionServicesOpen); setIsMobileMenuOpen(false); }}
              colorTheme={dashboardMode === 'student' ? 'emerald' : dashboardMode === 'tutor' ? 'violet' : 'blue'}
            />
          </div>

          <MobileNavButton 
            icon={<Menu size={18} />} 
            label="Menu" 
            active={isMobileMenuOpen} 
            onClick={() => { setIsMobileMenuOpen(true); setIsTuitionServicesOpen(false); }} 
            colorTheme="blue" 
          />
        </nav>
      )}
    </div>
  );
}

// ─── CHAT BOX ───
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
    <div id="chatbox-section" className={`bg-white border border-slate-200/60 ${tokens.radius.card} overflow-hidden ${tokens.shadow.card} flex flex-col h-[500px] sm:h-[600px]`}>
      <div className={`p-4 sm:p-5 bg-blue-700 text-white shrink-0 shadow-sm`}>
        <h3 className="font-bold text-lg sm:text-xl flex items-center gap-2">
          <MessageCircle size={20} /> GyanHub Support
        </h3>
        <p className="text-blue-100 text-[10px] sm:text-xs mt-1 font-medium tracking-wide">We typically reply within a few hours. Mon–Sat.</p>
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6 space-y-4 bg-slate-50/50">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center text-slate-400 py-10">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4 shadow-inner">
              <MessageCircle size={24} className="text-blue-400" />
            </div>
            <p className="font-bold text-slate-600 text-base sm:text-lg mb-1">Start a conversation</p>
            <p className="text-xs sm:text-sm font-medium max-w-[250px] sm:max-w-xs text-slate-500">Ask us anything about your courses, payments, or enrollment. We're here to help!</p>
          </div>
        )}
        {messages.map((msg) => {
          const isOwn = msg.sender_role !== 'admin';
          return (
            <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
              {!isOwn && (
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-blue-700 flex items-center justify-center text-white text-xs font-bold shrink-0 mr-2 mt-1 shadow-sm">G</div>
              )}
              <div className={`max-w-[80%] sm:max-w-[75%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                {!isOwn && <span className="text-[9px] sm:text-[10px] font-bold text-blue-700 uppercase tracking-widest px-1">Support</span>}
                <div className={`px-3 py-2 sm:px-4 sm:py-3 rounded-2xl text-xs sm:text-sm font-medium shadow-sm leading-relaxed ${isOwn
                  ? 'bg-blue-600 text-white rounded-br-sm'
                  : 'bg-white text-slate-800 rounded-bl-sm border border-slate-100'
                  }`}>
                  {msg.content}
                </div>
                <span className={`text-[9px] sm:text-[10px] font-semibold px-1 tracking-wider ${isOwn ? 'text-slate-400 text-right' : 'text-slate-400'}`}>
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
      <div className="p-3 sm:p-4 border-t border-slate-200/60 bg-white flex gap-2 sm:gap-3 shrink-0">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message…"
          disabled={!userId}
          className={`flex-1 px-3 py-2 sm:px-4 sm:py-3 bg-slate-50 border border-slate-200 ${tokens.radius.button} text-xs sm:text-sm font-medium outline-none focus:border-blue-400 focus:bg-white transition-all placeholder:text-slate-400 disabled:opacity-50`}
        />
        <button
          onClick={handleSend}
          disabled={sending || !input.trim() || !userId}
          className={`bg-blue-700 hover:bg-blue-800 disabled:opacity-40 disabled:cursor-not-allowed text-white p-2 sm:p-3.5 ${tokens.radius.button} transition-colors shadow-sm`}
        >
          <Send size={16} className="sm:w-[18px] sm:h-[18px]" />
        </button>
      </div>
    </div>
  );
}

// ─── RECOMMENDED RECORDINGS BOX ───
function RecommendedRecordingsBox({ recordings, router }: { recordings: GlobalRecording[], router: any }) {
  if (!recordings || recordings.length === 0) return null;
  return (
    <div className={`bg-gradient-to-br from-white to-slate-50/50 border border-slate-200/60 ${tokens.radius.card} p-5 sm:p-6 ${tokens.shadow.card} flex flex-col gap-4 group hover:border-t-blue-600 transition-colors`}>
      <div className="flex items-center justify-between">
        <h3 className="text-[10px] sm:text-[11px] font-extrabold text-slate-500 uppercase tracking-widest flex items-center gap-1.5 sm:gap-2">
          <PlayCircle size={14} className="text-blue-600 sm:w-4 sm:h-4" /> Top Recordings
        </h3>
        <Link href="/recording" className="text-[9px] sm:text-[10px] font-extrabold uppercase text-blue-700 hover:underline flex items-center gap-1 tracking-wide">
          See All <ArrowRight size={12} className="sm:w-[14px] sm:h-[14px]"/>
        </Link>
      </div>
      <div className="flex flex-col gap-2 sm:gap-3">
        {recordings.map(r => {
          const finalPrice = r.discount > 0 ? Math.round(r.standard_fee * (1 - r.discount / 100)) : r.standard_fee;
          const hoursNum = r.course_hours?.toString().match(/\d+/) ? r.course_hours.toString().match(/\d+/)?.[0] : r.course_hours;
          const displayHours = hoursNum ? `${hoursNum}+ hrs` : 'N/A';
          return (
            <div key={r.id} onClick={() => router.push(`/recording/${encodeURIComponent(r.course_name)}`)} className={`flex items-center justify-between p-2.5 sm:p-3 bg-white border border-slate-100 ${tokens.radius.badge} shadow-sm hover:shadow-md hover:border-blue-200 hover:-translate-y-0.5 transition-all cursor-pointer`}>
              <div className="flex items-center gap-2 sm:gap-3">
                {r.cover_pic_url ? (
                  <img src={r.cover_pic_url} className={`w-10 h-10 sm:w-12 sm:h-12 ${tokens.radius.badge} object-cover border border-slate-100`} alt={r.course_name} />
                ) : (
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 ${tokens.radius.badge} bg-blue-50 flex items-center justify-center border border-blue-100`}>
                    <PlayCircle size={18} className="text-blue-400 sm:w-5 sm:h-5" />
                  </div>
                )}
                <div className="flex flex-col">
                  <p className="text-xs sm:text-sm font-bold text-slate-800 line-clamp-1 group-hover:text-blue-700 transition-colors">{r.course_name}</p>
                  <p className="text-[10px] sm:text-xs font-semibold text-slate-500 flex items-center gap-1 mt-0.5"><Clock size={10} /> {displayHours}</p>
                </div>
              </div>
              <p className="text-xs sm:text-sm font-bold text-slate-800 shrink-0 bg-slate-50 px-2 py-1 sm:px-2.5 sm:py-1 rounded-md border border-slate-200">Rs. {finalPrice}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── COURSE CARD ───
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
        className={`w-full flex justify-center items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-3 ${tokens.radius.button} font-bold text-xs sm:text-sm bg-slate-50 text-slate-400 border border-slate-200 cursor-not-allowed select-none transition-colors hover:bg-slate-100`}
      >
        <Lock className="w-3.5 h-3.5 shrink-0" /> {label}
      </button>
      <AnimatePresence>
        {showTip && (
          <motion.div
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}
            className={`absolute z-30 bottom-[calc(100%+8px)] left-0 right-0 bg-slate-900 text-white text-[10px] sm:text-xs font-semibold ${tokens.radius.badge} p-3 sm:p-4 shadow-xl border border-slate-700`}
          >
            <p className="leading-relaxed">{reason}</p>
            {onPayClick && (
              <button onClick={onPayClick} className={`mt-2 sm:mt-3 w-full bg-blue-600 hover:bg-blue-500 text-white text-[10px] sm:text-xs font-bold px-2 sm:px-3 py-1.5 sm:py-2 ${tokens.radius.badge} transition-colors tracking-wide`}>
                Pay to Unlock
              </button>
            )}
            <button onClick={() => setShowTip(false)} className="absolute top-1 right-1 text-slate-400 hover:text-white p-1"><X size={10} className="sm:w-3 sm:h-3" /></button>
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
    return new Date(dateString).toLocaleDateString();
  }
};

function CourseCard({ course, type, matched, batch, pendingVerificationOrders, router, onOpenExpiredModal }: any) {
  const [nowTick, setNowTick] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNowTick(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getCoverPic = () => {
    if (matched?.cover_pic) return matched.cover_pic;
    if (matched?.cover_pic_url) return matched.cover_pic_url;
    if (type === 'recording') return (course as Order).screenshot_url; 
    return null;
  };
  const coverPic = getCoverPic();

  if (type === 'recording') {
    const record = course as Order;
    const isVerified = record.status.toLowerCase() === 'verified';
    const rawHours = matched?.course_hours?.toString().match(/\d+/) || [];
    const displayHours = rawHours.length > 0 ? `${rawHours[0]}+ hours` : matched?.course_hours || 'N/A';

    return (
      <div className={`bg-white border border-slate-200/60 ${tokens.radius.card} overflow-hidden ${tokens.shadow.card} ${tokens.shadow.hover} flex flex-col w-full group relative cursor-pointer`} onClick={() => router.push(`/recording/${encodeURIComponent(record.order_name)}`)}>
        <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-blue-500 to-blue-700 opacity-0 group-hover:opacity-100 transition-opacity z-50"></div>
        {/* Visual Cover Area */}
        <div className="h-28 sm:h-40 bg-slate-100 relative w-full overflow-hidden shrink-0 border-b border-slate-100">
          {coverPic ? (
            <img src={coverPic} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt="Course Cover" />
          ) : (
            <div className="absolute inset-0 bg-slate-100 flex items-center justify-center">
               <Video className="w-10 h-10 sm:w-12 sm:h-12 text-slate-300" />
            </div>
          )}
        </div>

        <div className="p-4 sm:p-6 md:p-8 flex flex-col flex-grow w-full justify-between">
          <div>
            <div className="flex justify-between items-start mb-3 sm:mb-4">
              <div className="flex flex-col">
                <div className="flex items-center gap-2 mb-2 sm:mb-3">
                  <span className={`bg-slate-100 text-slate-600 text-[9px] sm:text-[10px] font-extrabold uppercase tracking-widest px-2 py-1 sm:px-2.5 sm:py-1 ${tokens.radius.badge} flex items-center gap-1.5`}>
                    <PlayCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> Recordings
                  </span>
                  {isVerified
                    ? <span className={`bg-blue-50 text-blue-700 text-[9px] sm:text-[10px] font-extrabold uppercase tracking-widest px-2 py-1 sm:px-2.5 sm:py-1 ${tokens.radius.badge}`}>Unlocked</span>
                    : <span className={`bg-orange-50 text-orange-700 text-[9px] sm:text-[10px] font-extrabold uppercase tracking-widest px-2 py-1 sm:px-2.5 sm:py-1 ${tokens.radius.badge}`}>Verifying</span>
                  }
                </div>
                <h3 className="font-extrabold text-xl sm:text-2xl text-slate-900 leading-snug sm:leading-tight break-words group-hover:text-blue-700 transition-colors">{record.order_name}</h3>
              </div>
            </div>
            {matched && (
              <div className={`mb-4 sm:mb-6 bg-slate-50 p-3 sm:p-4 ${tokens.radius.badge} border border-slate-100 flex flex-wrap gap-3 sm:gap-6`}>
                <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-semibold text-slate-600"><Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-500" /><span>{displayHours}</span></div>
                <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-semibold text-slate-600"><Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-orange-400 text-orange-400" /><span>{matched.rating || '4.5'} Rating</span></div>
                {matched.category && <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-semibold text-slate-600"><BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-500" /><span>{matched.category}</span></div>}
              </div>
            )}
            {matched?.learning_outcomes?.length > 0 && (
              <div className="mb-4 sm:mb-6 hidden sm:block">
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-2 sm:mb-3">What you'll learn</p>
                <ul className="text-xs sm:text-sm text-slate-600 font-medium grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
                  {matched.learning_outcomes.slice(0, 4).map((out: string, i: number) => (
                    <li key={i} className="flex items-start gap-1.5 sm:gap-2"><Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-500 shrink-0 mt-0.5" /><span className="line-clamp-2">{out}</span></li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <div className="mt-2 sm:mt-4 pt-4 sm:pt-5 border-t border-slate-100">
            {isVerified ? (
              <a href={matched?.recording_link || '#'} onClick={(e) => e.stopPropagation()} target="_blank" rel="noopener noreferrer" className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-blue-700 hover:bg-blue-800 text-white px-6 sm:px-8 py-3 sm:py-3.5 ${tokens.radius.button} font-bold text-sm transition-colors shadow-sm`}>
                <PlayCircle className="w-4 h-4 sm:w-5 sm:h-5" /> Watch Recording
              </a>
            ) : (
              <div className={`w-full sm:w-auto inline-flex justify-center bg-orange-50 text-orange-800 px-6 sm:px-8 py-3 sm:py-3.5 ${tokens.radius.button} font-bold text-xs sm:text-sm border border-orange-200 items-center gap-2`}>
                <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Pending Verification
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  const enroll = course as Enrollment;
  const effectiveStartDatetime = batch?.start_datetime || enroll.starting_date || matched?.start_datetime;
  const effectiveTiming = batch?.timing || matched?.timing;
  const onlineLink = batch?.online_class_link || null;
  const classroomLink = batch?.google_classroom_link || null;
  const whatsappLink = batch?.whatsapp_group_link || null;

  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
  const enrollStart = new Date(effectiveStartDatetime); enrollStart.setHours(0, 0, 0, 0);
  const isFutureOrToday = todayStart.getTime() <= enrollStart.getTime();
  const daysSinceStart = Math.floor((nowTick.getTime() - enrollStart.getTime()) / (1000 * 60 * 60 * 24));
  const isFinished = (batch && batch.is_active === false) || daysSinceStart > 30;

  const isUnverifiedPayment = pendingVerificationOrders.some((o: { order_name: string }) =>
  o.order_name.toLowerCase() === enroll.course_name.toLowerCase()
);

  const totalFee = enroll.paid_amount + enroll.remaining_amount;
  const tenPercentFee = Math.round(totalFee * 0.1);

  let accessTier: AccessTier;
  if (isUnverifiedPayment) {
    accessTier = 'BLOCKED_VERIFY';
  } else if (enroll.paid_amount === 0) {
    accessTier = 'BLOCKED_NO_PAY';
  } else if (enroll.remaining_amount > 0 && isFutureOrToday) {
    accessTier = 'PARTIAL_ACTIVE';
  } else if (enroll.remaining_amount > 0 && !isFutureOrToday) {
    accessTier = 'PARTIAL_OVERDUE';
  } else {
    accessTier = 'FULL_ACCESS';
  }

  const statusBadge = (() => {
    switch (accessTier) {
      case 'BLOCKED_VERIFY': return { label: 'Verification Pending', classes: 'bg-orange-50 text-orange-800 border-orange-200' };
      case 'BLOCKED_NO_PAY': return { label: 'Payment Pending', classes: 'bg-slate-100 text-slate-700 border-slate-200' };
      case 'PARTIAL_ACTIVE': return { label: 'Partially Paid', classes: 'bg-blue-50 text-blue-800 border-blue-200' };
      case 'PARTIAL_OVERDUE': return { label: 'Urgent Due', classes: 'bg-red-50 text-red-800 border-red-200' };
      case 'FULL_ACCESS': return { label: 'Access Active', classes: 'bg-emerald-50 text-emerald-800 border-emerald-200' };
    }
  })();

  const getCountdownStr = () => {
    const startObj = new Date(effectiveStartDatetime);
    const diffMs = startObj.getTime() - nowTick.getTime();

    if (diffMs > 0) {
      const d = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const h = Math.floor((diffMs / (1000 * 60 * 60)) % 24);
      const m = Math.floor((diffMs / (1000 * 60)) % 60);
      return `${d}d ${h}h ${m}m TO START`;
    } else if (!isFinished) {
      let target = new Date(nowTick);
      target.setHours(20, 0, 0, 0);
      if (nowTick.getTime() > target.getTime()) {
        target.setDate(target.getDate() + 1);
      }
      const diff8PM = target.getTime() - nowTick.getTime();
      const h = Math.floor((diff8PM / (1000 * 60 * 60)) % 24);
      const m = Math.floor((diff8PM / (1000 * 60)) % 60);
      return `${h}h ${m}m TO CLASS`;
    }
    return '';
  };

  const countdownStr = getCountdownStr();
  const isOrientation = new Date(effectiveStartDatetime).getTime() > nowTick.getTime();
  const payRoute = (price: number) =>
    router.push(`/order?order_type=course&courseName=${encodeURIComponent(enroll.course_name)}&price=${price}`);
  const canUseOnline = accessTier === 'PARTIAL_ACTIVE' || accessTier === 'FULL_ACCESS';
  const canUseAll = accessTier === 'FULL_ACCESS';

  return (
    <div className={`bg-white border border-slate-200/60 ${tokens.radius.card} overflow-hidden ${tokens.shadow.card} ${tokens.shadow.hover} flex flex-col w-full group relative`}>
      <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-orange-400 to-orange-600 opacity-0 group-hover:opacity-100 transition-opacity z-50"></div>
      
      {/* Visual Cover Area */}
      <div className="h-28 sm:h-40 bg-slate-100 relative w-full overflow-hidden shrink-0 border-b border-slate-100">
        {coverPic ? (
          <img src={coverPic} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt="Course Cover" />
        ) : (
          <div className="absolute inset-0 bg-slate-100 flex items-center justify-center">
             <BookOpen className="w-10 h-10 sm:w-12 sm:h-12 text-slate-300" />
          </div>
        )}
      </div>

      <div className="p-4 sm:p-6 md:p-8 flex flex-col flex-grow w-full justify-between">
        <div>
          <div className="flex flex-col items-start gap-2 sm:gap-3 mb-3 sm:mb-4">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <span className={`bg-blue-50 text-blue-700 text-[9px] sm:text-[10px] font-extrabold uppercase tracking-widest px-2 py-1 sm:px-2.5 sm:py-1 ${tokens.radius.badge} flex items-center gap-1.5`}>
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(29,78,216,0.8)]"></span> Live Class
              </span>
              <span className={`text-[9px] sm:text-[10px] font-extrabold uppercase tracking-widest px-2 py-1 sm:px-2.5 sm:py-1 ${tokens.radius.badge} border ${statusBadge.classes}`}>
                {statusBadge.label}
              </span>
            </div>
            {countdownStr && (
              <div className={`inline-flex items-center w-fit bg-slate-800 text-white shadow-md text-[10px] sm:text-[11px] font-bold uppercase tracking-widest px-2.5 py-1 sm:px-3 sm:py-1.5 ${tokens.radius.badge}`}>
                <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1.5 text-orange-400" />{countdownStr}
              </div>
            )}
            <h3 className="font-extrabold text-xl sm:text-2xl text-slate-900 leading-snug sm:leading-tight break-words mt-1">{enroll.course_name}</h3>
          </div>

          <div className="flex flex-wrap gap-2 sm:gap-6 mb-4 sm:mb-6 text-xs sm:text-sm font-semibold text-slate-600">
            {matched?.tutor_name && <span className="flex items-center gap-1 sm:gap-1.5 shrink-0"><User className="w-3.5 h-3.5 sm:w-4 sm:h-4" />{matched.tutor_name}</span>}
            {matched?.duration && <span className="flex items-center gap-1 sm:gap-1.5 shrink-0"><Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />{matched.duration}</span>}
            {matched?.category && <span className="flex items-center gap-1 sm:gap-1.5 shrink-0"><BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4" />{matched.category}</span>}
            {batch?.batch_no && <span className="flex items-center gap-1 sm:gap-1.5 shrink-0"><Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />Batch {batch.batch_no}</span>}
          </div>

          <div className={`mb-4 sm:mb-6 bg-slate-50 p-3 sm:p-4 ${tokens.radius.badge} border border-slate-100 flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-6`}>
            <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-700">
              <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600" />
              <span>Start: {new Date(effectiveStartDatetime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
            </div>
            <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-700">
              <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600" />
              <span>Time: {effectiveTiming || 'TBA'}</span>
            </div>
          </div>

          {matched?.learning_outcomes?.length > 0 && (
            <div className="mb-4 sm:mb-6 hidden sm:block">
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-2 sm:mb-3">Overview</p>
              <ul className="text-xs sm:text-sm text-slate-600 font-medium grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
                {matched.learning_outcomes.slice(0, 4).map((out: string, i: number) => (
                  <li key={i} className="flex items-start gap-1.5 sm:gap-2"><Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-500 shrink-0 mt-0.5" /><span className="line-clamp-2">{out}</span></li>
                ))}
              </ul>
              {matched.syllabus_url && (
                <a href={matched.syllabus_url} target="_blank" rel="noreferrer" className="mt-3 sm:mt-4 text-[10px] sm:text-[11px] font-extrabold text-blue-700 hover:text-orange-600 hover:underline inline-flex items-center gap-1 uppercase tracking-wide transition-colors">
                  View Full Syllabus <ExternalLink size={10} className="sm:w-3 sm:h-3" />
                </a>
              )}
            </div>
          )}
        </div>

        <div className="mt-2 sm:mt-4 pt-4 sm:pt-5 border-t border-slate-100 flex flex-col gap-3 sm:gap-4">
          {accessTier === 'BLOCKED_VERIFY' && (
            <div className={`flex items-center gap-2 sm:gap-3 bg-orange-50 border border-orange-200 ${tokens.radius.badge} px-4 py-3 sm:px-5 sm:py-4 text-orange-800 shadow-sm`}>
              <Clock className="w-4 h-4 sm:w-5 sm:h-5 shrink-0 text-orange-500" />
              <p className="text-xs sm:text-sm font-semibold leading-snug">Payment verifying. Access will unlock shortly.</p>
            </div>
          )}
          {accessTier === 'BLOCKED_NO_PAY' && (
            <div className={`bg-slate-50 border border-slate-200 ${tokens.radius.badge} p-4 sm:p-5 flex flex-col md:flex-row items-center justify-between gap-3 sm:gap-4 shadow-sm`}>
              <div className="flex items-start gap-2 sm:gap-3 text-slate-700">
                <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 shrink-0 text-blue-600" />
                <p className="text-xs sm:text-sm font-medium leading-tight">
                  Pay <strong>10% seat booking fee (Rs. {tenPercentFee})</strong> to lock enrollment and get class access.
                </p>
              </div>
              <button onClick={() => payRoute(tenPercentFee)} className={`w-full md:w-auto shrink-0 bg-blue-700 hover:bg-blue-800 text-white font-bold px-4 py-2.5 sm:px-6 sm:py-3 ${tokens.radius.button} text-xs sm:text-sm whitespace-nowrap transition-colors shadow-sm`}>
                Book Seat (Rs. {tenPercentFee})
              </button>
            </div>
          )}
          {accessTier === 'PARTIAL_ACTIVE' && enroll.remaining_amount > 0 && (
            <div className={`bg-blue-50 border border-blue-200 ${tokens.radius.badge} p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 sm:gap-4 text-blue-900 shadow-sm`}>
              <div className="flex items-start gap-2 sm:gap-3">
                <Info className="w-5 h-5 sm:w-6 sm:h-6 shrink-0 text-blue-600" />
                <div>
                  <p className="text-xs sm:text-sm font-medium leading-tight mb-1">
                    Due: <strong>Rs. {enroll.remaining_amount}</strong>. Pay after orientation on <strong>{new Date(effectiveStartDatetime).toLocaleDateString()}</strong>.
                  </p>
                  <p className="text-[10px] sm:text-xs font-semibold text-blue-700/80">Classroom & WhatsApp unlock fully upon payment.</p>
                </div>
              </div>
              <button onClick={() => payRoute(enroll.remaining_amount)} className={`w-full md:w-auto shrink-0 bg-blue-700 hover:bg-blue-800 text-white font-bold px-4 py-2.5 sm:px-6 sm:py-3 ${tokens.radius.button} text-xs sm:text-sm whitespace-nowrap transition-colors shadow-sm`}>
                Pay Now
              </button>
            </div>
          )}
          {accessTier === 'PARTIAL_OVERDUE' && (
            <div className={`bg-red-50 border border-red-200 ${tokens.radius.badge} p-4 sm:p-5 flex flex-col md:flex-row items-center justify-between gap-3 sm:gap-4 shadow-sm`}>
              <div className="flex items-start gap-2 sm:gap-3 text-red-800">
                <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 shrink-0 mt-0.5 text-red-600" />
                <div>
                  <p className="text-xs sm:text-sm font-bold leading-tight mb-0.5 sm:mb-1">Immediate clearance required.</p>
                  <p className="text-xs sm:text-sm font-medium text-red-700">Due: <strong>Rs. {enroll.remaining_amount}</strong></p>
                </div>
              </div>
              <button onClick={() => payRoute(enroll.remaining_amount)} className={`w-full md:w-auto shrink-0 bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-2.5 sm:px-6 sm:py-3 ${tokens.radius.button} text-xs sm:text-sm whitespace-nowrap transition-colors shadow-sm`}>
                Clear Dues
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
            {(() => {
              const locked = !canUseOnline;
              const buttonLabel = isOrientation ? 'Join Orientation' : 'Join Live Class';
              const lockedReason =
                accessTier === 'BLOCKED_NO_PAY' ? 'Pay the 10% seat booking fee to unlock the live class link.' :
                  accessTier === 'BLOCKED_VERIFY' ? 'Your payment is being verified. Access unlocks within 24 hours.' :
                    accessTier === 'PARTIAL_OVERDUE' ? 'Your class has started but payment is overdue. Clear your dues.' :
                      'Complete payment to access this link.';

              if (!onlineLink) {
                return (
                  <div className={`flex-1 flex justify-center items-center gap-1.5 sm:gap-2 px-3 py-2.5 sm:px-4 sm:py-3.5 ${tokens.radius.button} font-bold text-xs sm:text-sm bg-slate-50 text-slate-400 border border-dashed border-slate-200 min-w-0`}>
                    <Video className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" /> Link Soon
                  </div>
                );
              }
              if (locked) {
                return (
                  <LockedLinkButton
                    label={buttonLabel}
                    icon={<Video className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                    reason={lockedReason}
                    onPayClick={accessTier === 'BLOCKED_NO_PAY' ? () => payRoute(tenPercentFee) : accessTier === 'PARTIAL_OVERDUE' ? () => payRoute(enroll.remaining_amount) : undefined}
                  />
                );
              }
              if (isFinished) {
                return (
                  <button
                    onClick={() => onOpenExpiredModal(classroomLink || '')}
                    className={`flex-1 flex justify-center items-center gap-1.5 sm:gap-2 px-3 py-2.5 sm:px-4 sm:py-3.5 ${tokens.radius.button} font-bold text-xs sm:text-sm bg-slate-800 text-white hover:bg-slate-700 transition-colors min-w-0 shadow-sm`}
                  >
                    <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Class Ended
                  </button>
                );
              }
              return (
                <a href={onlineLink} target="_blank" rel="noopener noreferrer"
                  className={`flex-1 flex justify-center items-center gap-1.5 sm:gap-2 px-3 py-2.5 sm:px-4 sm:py-3.5 ${tokens.radius.button} font-bold text-xs sm:text-sm bg-blue-700 text-white hover:bg-blue-800 transition-colors min-w-0 shadow-[0_4px_15px_rgba(29,78,216,0.2)]`}
                >
                  <Video className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" /> {buttonLabel}
                </a>
              );
            })()}

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
                  <div className={`flex-1 flex justify-center items-center gap-1.5 sm:gap-2 px-3 py-2.5 sm:px-4 sm:py-3.5 ${tokens.radius.button} font-bold text-xs sm:text-sm bg-slate-50 text-slate-400 border border-dashed border-slate-200 min-w-0`}>
                    <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" /> Classroom Soon
                  </div>
                );
              }
              if (locked) {
                return (
                  <LockedLinkButton
                    label="Classroom"
                    icon={<BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                    reason={lockedReason}
                    onPayClick={accessTier === 'PARTIAL_ACTIVE' || accessTier === 'PARTIAL_OVERDUE' ? () => payRoute(enroll.remaining_amount) : undefined}
                  />
                );
              }
              return (
                <a href={classroomLink} target="_blank" rel="noopener noreferrer"
                  className={`flex-1 flex justify-center items-center gap-1.5 sm:gap-2 px-3 py-2.5 sm:px-4 sm:py-3.5 ${tokens.radius.button} font-bold text-xs sm:text-sm bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 shadow-sm transition-colors min-w-0`}
                >
                  <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-500 shrink-0" /> Classroom
                </a>
              );
            })()}

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
                  <div className={`flex-1 flex justify-center items-center gap-1.5 sm:gap-2 px-3 py-2.5 sm:px-4 sm:py-3.5 ${tokens.radius.button} font-bold text-xs sm:text-sm bg-slate-50 text-slate-400 border border-dashed border-slate-200 min-w-0`}>
                    <MessageCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" /> Group Soon
                  </div>
                );
              }
              if (locked) {
                return (
                  <LockedLinkButton
                    label="WhatsApp"
                    icon={<MessageCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                    reason={lockedReason}
                    onPayClick={accessTier === 'PARTIAL_ACTIVE' || accessTier === 'PARTIAL_OVERDUE' ? () => payRoute(enroll.remaining_amount) : undefined}
                  />
                );
              }
              return (
                <a href={whatsappLink} target="_blank" rel="noopener noreferrer"
                  className={`flex-1 flex justify-center items-center gap-1.5 sm:gap-2 px-3 py-2.5 sm:px-4 sm:py-3.5 ${tokens.radius.button} font-bold text-xs sm:text-sm bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 shadow-sm transition-colors min-w-0`}
                >
                  <MessageCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-500 shrink-0" /> WhatsApp
                </a>
              );
            })()}
          </div>

          <a href="https://wa.me/9763695665" target="_blank" rel="noopener noreferrer"
            className={`flex justify-center items-center gap-1.5 sm:gap-2 bg-transparent text-slate-500 hover:text-blue-700 px-4 sm:px-6 py-2 ${tokens.radius.button} font-bold text-xs sm:text-sm transition-colors mt-2 sm:mt-3`}
          >
            <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400" /> Contact Support
          </a>
        </div>
      </div>
    </div>
  );
}

// ─── MY COURSES VIEW ───
function MyCoursesView({ activeTab, enrollments, onlineCourseDetails, courseBatches, pendingVerificationOrders, orders, recordingsList, router, onOpenExpiredModal }: any) {
  const isOnline = activeTab === 'Online Courses';

  return (
    <div className="space-y-6 sm:space-y-8 w-full pb-10">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900">
          {isOnline ? 'Online Classes' : 'Recordings'}
        </h2>
        <Link href={isOnline ? "/onlinecourse" : "/recording"} className={`flex items-center gap-1.5 sm:gap-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-4 sm:px-6 py-2.5 sm:py-3 ${tokens.radius.button} font-bold text-xs sm:text-sm transition-colors shadow-sm`}>
          Explore {isOnline ? 'Courses' : 'Recordings'} <ExternalLink size={14} className="sm:w-4 sm:h-4" />
        </Link>
      </div>

      <div className="flex flex-col gap-5 sm:gap-8 w-full">
        {isOnline ? (
          enrollments.length === 0 ? (
            <div className="flex flex-col items-center justify-center bg-white rounded-3xl py-16 sm:py-20 px-4 sm:px-6 border border-dashed border-slate-200 text-center shadow-sm">
               <BookOpen size={40} className="text-slate-300 mb-3 sm:mb-4 sm:w-12 sm:h-12" />
               <p className="text-slate-500 font-bold text-sm sm:text-lg">No active online class enrollments.</p>
            </div>
          ) : (enrollments.map((course: Enrollment) => {
            const matched = onlineCourseDetails.find((oc: OnlineCourseExt) => oc.id === course.course_id || oc.title === course.course_name);
            const batch = courseBatches.find((b: CourseBatch) => b.course_id === course.course_id && b.batch_no === course.batch_no);
            return <CourseCard key={course.id} course={course} type="online" matched={matched} batch={batch} pendingVerificationOrders={pendingVerificationOrders} router={router} onOpenExpiredModal={onOpenExpiredModal} />;
          })
          )
        ) : (
          !orders || orders.filter((o: Order) => o.order_type === 'recording').length === 0 ? (
            <div className="flex flex-col items-center justify-center bg-white rounded-3xl py-16 sm:py-20 px-4 sm:px-6 border border-dashed border-slate-200 text-center shadow-sm">
               <Video size={40} className="text-slate-300 mb-3 sm:mb-4 sm:w-12 sm:h-12" />
               <p className="text-slate-500 font-bold text-sm sm:text-lg">No recording orders found.</p>
            </div>
          ) : (
            orders.filter((o: Order) => o.order_type === 'recording').map((record: Order) => {
              const matched = recordingsList.find((r: RecordingInfo) => r.course_name.toLowerCase() === record.order_name.toLowerCase());
              return <CourseCard key={record.id} course={record} type="recording" matched={matched} pendingVerificationOrders={pendingVerificationOrders} router={router} onOpenExpiredModal={onOpenExpiredModal} />;
            })
          )
        )}
      </div>
    </div>
  );
}

// ─── ACCOUNT OVERVIEW ───
function AccountOverviewView({ userName, userEmail, userWhatsapp, onSaveUser, orders, enrollments, certificates, onNavigate, pendingVerificationOrders, pendingCoursePayments, activeCourseAccess, recordingOrdersVerified, onlineCourseDetails }: any) {
  const timelineEvents = [
    ...(orders || []).filter((o: Order) => o.order_type?.toLowerCase() === 'recording').map((o: Order) => ({ id: o.id, type: 'Order', title: `Purchased ${o.order_name} recordings`, date: new Date(o.created_at), status: o.status })),
    ...(enrollments || []).map((e: Enrollment) => ({ id: e.id, type: 'Enrollment', title: `Enrolled in ${e.course_name} class`, date: new Date(e.created_at), status: e.remaining_amount === 0 ? 'cleared' : 'pending' })),
    ...(certificates || []).map((c: Certificate) => ({ id: `cert-${c.id}`, type: 'Certificate', title: `Certificate: ${c.syllabus_name || c.name}`, date: new Date(c.issue_date), status: 'verified' }))
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
    <div className="space-y-6 sm:space-y-10 w-full pb-10">
      <div className={`bg-slate-900 ${tokens.radius.card} p-6 sm:p-8 md:p-12 relative overflow-hidden group shadow-[0_20px_50px_rgba(0,0,0,0.15)]`}>
        <div className="absolute top-0 right-0 w-64 h-64 sm:w-96 sm:h-96 bg-gradient-to-bl from-blue-700/30 to-blue-500/0 blur-3xl pointer-events-none rounded-full"></div>
        <div className="relative z-10 text-white">
          <h2 className="text-[9px] sm:text-[10px] uppercase tracking-widest font-extrabold text-blue-400 mb-3 sm:mb-4 flex items-center gap-1.5 sm:gap-2"><Crown size={12} className="sm:w-[14px] sm:h-[14px]" /> My Learning Hub</h2>
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 sm:gap-8 break-words">
            <div>
              <h3 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tighter mb-2 sm:mb-3 text-white leading-tight">Welcome back, {userName}</h3>
              <p className="text-white/70 font-medium text-sm sm:text-lg tracking-wide">Continue building your skills and credentials.</p>
            </div>
            {nextClassInfo && (
              <div onClick={() => onNavigate('Online Courses')} className={`relative bg-gradient-to-br from-orange-500 to-orange-700 border border-orange-400 p-4 sm:p-6 ${tokens.radius.card} flex flex-col gap-1 w-full lg:min-w-[240px] lg:w-auto shadow-[0_0_30px_rgba(249,115,22,0.3)] overflow-hidden isolate cursor-pointer hover:scale-[1.02] transition-transform`}>
                <div className="absolute -top-10 -right-10 w-24 h-24 sm:w-32 sm:h-32 bg-orange-300 blur-3xl rounded-full opacity-50 -z-10"></div>
                <span className="text-[9px] sm:text-[10px] text-orange-100 font-extrabold uppercase tracking-widest flex items-center gap-1.5"><Calendar size={10} className="sm:w-3 sm:h-3" /> Next Class</span>
                <span className="text-lg sm:text-xl font-bold text-white break-words whitespace-normal leading-tight mt-0.5 sm:mt-1 max-w-full">{nextClassInfo.name}</span>
                <span className={`text-xs sm:text-sm font-bold text-orange-900 bg-white shadow-sm w-fit px-2 sm:px-3 py-1 sm:py-1.5 ${tokens.radius.badge} mt-2 sm:mt-3`}>Starts in {nextClassInfo.days} days</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-slate-800">
            {[
              { icon: GraduationCap, value: activeCourseAccess.length, label: 'Live Classes', tab: 'Online Courses' },
              { icon: Video, value: recordingOrdersVerified.length, label: 'Recordings', tab: 'Recording Courses' },
              { icon: AlertCircle, value: pendingCoursePayments.length, label: 'Pending Dues', tab: 'Online Courses', dot: pendingCoursePayments.length > 0 },
              { icon: Award, value: certificates?.length || 0, label: 'Certificates', tab: 'My Certificates' },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={i} onClick={() => onNavigate(item.tab)} className={`cursor-pointer bg-slate-800 hover:bg-slate-700 p-4 sm:p-6 ${tokens.radius.card} transition-colors border-t-4 border-t-transparent hover:border-t-blue-500 border-x border-b border-slate-700 min-h-[100px] sm:min-h-[140px] flex flex-col relative group shadow-sm hover:shadow-[0_10px_30px_rgba(29,78,216,0.15)]`}>
                  {item.dot && <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-red-500 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-pulse"></span>}
                  <div className={`p-2 sm:p-3 bg-slate-900 text-blue-400 rounded-xl w-fit mb-2 sm:mb-4 group-hover:scale-110 transition-transform`}><Icon className="w-4 h-4 sm:w-5 sm:h-5" /></div>
                  <div className="mt-auto">
                    <p className="text-2xl sm:text-4xl md:text-5xl font-semibold text-white leading-none tracking-tight">{item.value}</p>
                    <p className="text-[9px] sm:text-[10px] uppercase font-bold tracking-widest text-slate-400 mt-1.5 sm:mt-3">{item.label}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className={`bg-gradient-to-br from-white to-slate-50/50 p-5 sm:p-6 md:p-8 ${tokens.radius.card} border border-slate-200/60 shadow-sm`}>
        <h3 className="text-[10px] sm:text-xs font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 sm:gap-2 mb-5 sm:mb-8"><Activity size={14} className="sm:w-4 sm:h-4" /> Recent Timeline</h3>
        {timelineEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center bg-white rounded-3xl py-10 sm:py-12 px-4 sm:px-6 border border-dashed border-slate-200 text-center">
            <p className="text-slate-500 text-sm sm:text-base font-semibold">No recent activity found.</p>
          </div>
        ) : (
          <div className="space-y-6 sm:space-y-8 relative before:absolute before:inset-y-0 before:left-4 before:w-px before:bg-slate-200 ml-1 sm:ml-2">
            {timelineEvents.map((event, idx) => {
              const IconComp = event.type === 'Certificate' ? Award : event.type === 'Order' ? ShoppingBag : BookOpen;
              return (
                <div key={`${event.id}-${idx}`} className="relative flex items-start gap-4 sm:gap-6 group">
                  <div className={`flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full border-[2px] border-white shadow-sm shrink-0 z-10 bg-slate-100 text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors`}>
                    <IconComp className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  </div>
                  <div className={`flex-1 bg-white p-4 sm:p-5 ${tokens.radius.card} border border-slate-100 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5`}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-2 mb-1 sm:mb-2">
                      <span className={`w-fit font-extrabold text-[9px] sm:text-[10px] uppercase tracking-widest px-2 py-0.5 sm:px-2.5 sm:py-1 ${tokens.radius.badge} bg-slate-50 border border-slate-100 text-slate-600`}>{event.type}</span>
                      <time className="text-[10px] sm:text-xs font-semibold text-slate-400 tracking-wide">{event.date.toLocaleDateString()}</time>
                    </div>
                    <p className="text-xs sm:text-sm font-bold text-slate-800 leading-snug break-words">{event.title}</p>
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

// ─── TRANSACTIONS VIEW ───
function TransactionsView({ orders, ordersError, enrollments, formatDate, selectedTransaction, setSelectedTransaction }: any) {
  return (
    <div className="space-y-6 sm:space-y-8 w-full pb-10">
      <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900">Transactions</h2>
      
      <div className="space-y-4 sm:space-y-5 max-w-4xl">
        {ordersError && <div className="p-4 sm:p-5 bg-red-50 text-red-600 text-xs sm:text-sm rounded-xl border border-red-200 font-bold shadow-sm">Error loading billing history. Please refresh.</div>}
        
        {(!orders || orders.length === 0) ? (
          <div className="flex flex-col items-center justify-center bg-white rounded-3xl py-12 sm:py-16 px-4 sm:px-6 border border-dashed border-slate-200 text-center shadow-sm">
            <p className="text-slate-500 font-semibold text-sm sm:text-lg">No transactions found.</p>
          </div>
        ) : orders.map((order: Order) => (
          <div key={order.id} onClick={() => setSelectedTransaction(order)} className={`cursor-pointer bg-white p-4 sm:p-5 md:p-6 ${tokens.radius.card} border border-slate-200/60 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 hover:border-blue-300 hover:shadow-md hover:-translate-y-0.5 transition-all group`}>
            <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
              <div className="p-2.5 sm:p-3 bg-slate-50 text-slate-400 rounded-xl shrink-0 border border-slate-100 group-hover:bg-blue-50 group-hover:text-blue-600 group-hover:border-blue-100 transition-colors"><ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5" /></div>
              <div className="overflow-hidden">
                <p className="font-bold text-slate-900 text-base sm:text-lg leading-tight truncate group-hover:text-blue-700 transition-colors">{order.order_name}</p>
                <p className="text-[9px] sm:text-[11px] font-bold text-slate-400 mt-1 sm:mt-1.5 uppercase tracking-widest">{order.order_type} • {formatDate(order.created_at)}</p>
              </div>
            </div>
            <div className="text-right w-full sm:w-auto flex flex-row sm:flex-col justify-between items-center sm:items-end border-t sm:border-0 border-slate-100 pt-3 sm:pt-0 shrink-0">
              <p className="font-extrabold text-lg sm:text-xl text-slate-900 tracking-tight">Rs. {order.price}</p>
              <div className="mt-1 sm:mt-2"><StatusBadge status={order.status} /></div>
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

  const getScreenshotUrl = (path: string) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    return `https://zuktarghyexwodqnnxlu.supabase.co/storage/v1/object/public/others/${path}`;
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 sm:p-6 overflow-y-auto">
      <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} className={`bg-white ${tokens.radius.card} w-full max-w-xl shadow-[0_20px_60px_rgba(0,0,0,0.15)] border border-slate-200 flex flex-col my-auto relative`}>
        <button onClick={onClose} className="absolute top-4 sm:top-5 right-4 sm:right-5 p-2 bg-slate-100 rounded-full hover:bg-slate-200 text-slate-600 z-[60] transition-colors">
          <X size={16} className="sm:w-[18px] sm:h-[18px]" />
        </button>
        <div className="p-6 sm:p-8 md:p-10 space-y-6 sm:space-y-8 pt-12 sm:pt-16">
          <div className={`text-center p-4 sm:p-6 bg-slate-50 border border-slate-100 ${tokens.radius.badge}`}>
            <p className="text-[9px] sm:text-[10px] font-extrabold text-blue-700 uppercase tracking-widest mb-1.5 sm:mb-2">{order.order_type} PURCHASE</p>
            <h4 className="text-xl sm:text-2xl font-extrabold text-slate-900 leading-tight break-words">{order.order_name}</h4>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div className={`p-4 sm:p-5 bg-white border border-slate-200 ${tokens.radius.badge} shadow-sm`}>
              <p className="text-[9px] sm:text-[10px] uppercase font-extrabold text-slate-400 tracking-widest mb-1 sm:mb-2">Amount Paid</p>
              <p className="font-extrabold text-xl sm:text-2xl tracking-tight text-slate-800">Rs. {order.price}</p>
            </div>
            <div className={`p-4 sm:p-5 bg-white border border-slate-200 ${tokens.radius.badge} shadow-sm`}>
              <p className="text-[9px] sm:text-[10px] uppercase font-extrabold text-slate-400 tracking-widest mb-1 sm:mb-2">Date</p>
              <p className="font-semibold text-slate-700 text-sm sm:text-lg tracking-tight mt-0.5 sm:mt-1">{new Date(order.created_at).toLocaleDateString()}</p>
            </div>
            <div className={`col-span-2 p-4 sm:p-5 ${tokens.radius.badge} border flex justify-between items-center shadow-sm ${remainingDue > 0 ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-200'}`}>
              <p className={`text-[9px] sm:text-[10px] uppercase font-extrabold tracking-widest ${remainingDue > 0 ? 'text-red-600' : 'text-slate-500'}`}>Remaining Due</p>
              <p className={`font-extrabold text-sm sm:text-lg tracking-tight ${remainingDue > 0 ? 'text-red-700' : 'text-slate-800'}`}>{remainingDue > 0 ? `Rs. ${remainingDue}` : 'No due remaining'}</p>
            </div>
            <div className={`col-span-2 p-4 sm:p-5 bg-white ${tokens.radius.badge} border border-slate-200 shadow-sm flex justify-between items-center`}>
              <p className="text-[9px] sm:text-[10px] uppercase font-extrabold text-slate-400 tracking-widest">Status</p>
              <StatusBadge status={order.status} />
            </div>
          </div>
          <div>
            <h4 className="text-[10px] sm:text-[11px] font-extrabold uppercase text-slate-500 tracking-widest mb-2 sm:mb-3">Payment Screenshot</h4>
            {order.screenshot_url ? (
              <div className={`border border-slate-200 overflow-hidden bg-slate-50 p-2 ${tokens.radius.badge} shadow-inner`}>
                <img
                  src={getScreenshotUrl(order.screenshot_url)}
                  alt="Payment Receipt"
                  className={`w-full object-contain ${tokens.radius.badge} max-h-[250px] sm:max-h-[350px]`}
                />
              </div>
            ) : (
              <div className={`p-8 sm:p-10 border border-dashed border-slate-200 ${tokens.radius.badge} text-center flex flex-col items-center text-slate-400 bg-slate-50`}>
                <SearchX size={32} className="mb-2 sm:mb-3 opacity-50 sm:w-9 sm:h-9" />
                <p className="font-bold text-xs sm:text-sm tracking-wide">No screenshot attached</p>
              </div>
            )}
            
            <button onClick={onClose} className={`w-full mt-4 sm:mt-6 py-3 sm:py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-bold ${tokens.radius.button} transition-colors shadow-sm`}>
              Close Details
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ─── CERTIFICATES VIEW ───
function MyCertificatesView({ certificates, formatDate }: any) {
  return (
    <div className="space-y-6 sm:space-y-8 w-full pb-10">
      <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900">My Certificates</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-8">
        {!certificates || certificates.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center bg-white rounded-3xl py-16 sm:py-20 px-4 sm:px-6 border border-dashed border-slate-200 text-center shadow-sm">
            <Award size={40} className="mb-3 sm:mb-4 text-slate-300 sm:w-12 sm:h-12" />
            <p className="text-sm sm:text-lg font-bold text-slate-500">No certificates earned yet.</p>
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
    <div className={`bg-gradient-to-br from-white to-slate-50/50 border border-slate-200/60 ${tokens.radius.card} p-5 sm:p-8 ${tokens.shadow.card} ${tokens.shadow.hover} flex flex-col gap-4 sm:gap-6 relative overflow-hidden h-full group`}>
      <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-blue-500 to-blue-700 opacity-0 group-hover:opacity-100 transition-opacity z-50"></div>
      <div className="flex justify-between items-start z-10 relative">
        <div className={`p-3 sm:p-4 bg-blue-50 text-blue-700 ${tokens.radius.button} border border-blue-100 shadow-[0_0_15px_rgba(29,78,216,0.1)]`}><Award size={24} className="sm:w-7 sm:h-7" /></div>
        <div className="text-right">
          <p className="text-[9px] sm:text-[10px] uppercase font-extrabold text-slate-400 tracking-widest mb-0.5 sm:mb-1">Issue Date</p>
          <p className="text-xs sm:text-sm font-bold text-slate-700 tracking-wide">{formatDate(cert.issue_date)}</p>
        </div>
      </div>
      <div className="z-10 relative flex-grow py-1 sm:py-2">
        <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 leading-tight mb-2 sm:mb-3 break-words tracking-tight">{cert.syllabus_name || cert.name}</h3>
        <p className="text-xs sm:text-sm text-slate-500 font-medium">Issued to: <span className="font-bold text-slate-800">{cert.name}</span></p>
      </div>
      <div className={`bg-white p-3 sm:p-4 ${tokens.radius.badge} border border-slate-200 flex justify-between items-center mt-auto z-10 relative shadow-sm`}>
        <div className="overflow-hidden mr-2">
          <p className="text-[9px] sm:text-[10px] uppercase font-extrabold text-slate-400 tracking-widest mb-0.5 sm:mb-1">Certificate ID</p>
          <p className="text-[10px] sm:text-xs font-bold text-slate-700 truncate tracking-wide" title={cert.certificate_code}>{cert.certificate_code}</p>
        </div>
        <div className="flex gap-1.5 sm:gap-2 shrink-0">
          <a href={`/certificate?name=${encodeURIComponent(cert.name)}&email=${encodeURIComponent(cert.email)}`} target="_blank" rel="noopener noreferrer" className={`p-2 sm:p-2.5 bg-slate-50 text-slate-600 hover:bg-blue-50 hover:text-blue-700 ${tokens.radius.badge} border border-slate-200 transition-colors`} title="View"><ExternalLink size={14} className="sm:w-4 sm:h-4" /></a>
          <button onClick={handleShare} className={`p-2 sm:p-2.5 bg-slate-50 text-slate-600 hover:bg-blue-50 hover:text-blue-700 ${tokens.radius.badge} border border-slate-200 transition-colors`} title="Copy link">
            {copied ? <Check size={14} className="sm:w-4 sm:h-4 text-green-500" /> : <Copy size={14} className="sm:w-4 sm:h-4" />}
          </button>
        </div>
      </div>
      <div className="absolute -right-8 -bottom-8 opacity-[0.02] pointer-events-none group-hover:scale-110 transition-transform duration-700"><Award size={150} className="sm:w-[180px] sm:h-[180px]" /></div>
    </div>
  );
}

// ─── EXPIRED CLASS MODAL ───
function ClassExpiredModal({ onClose, classroomLink }: { onClose: () => void; classroomLink: string }) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <motion.div initial={{ scale: 0.95, opacity: 0, y: 10 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 10 }} className={`bg-white ${tokens.radius.card} w-full max-w-md overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.15)] border border-slate-200 text-center p-8 sm:p-10 relative`}>
        <button onClick={onClose} className="absolute top-4 sm:top-5 right-4 sm:right-5 p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors"><X size={16} className="sm:w-[18px] sm:h-[18px]"/></button>
        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-slate-100 text-slate-500 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-inner"><PlayCircle size={24} className="sm:w-8 sm:h-8" /></div>
        <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 mb-2 sm:mb-3 tracking-tight">Class is Finished</h3>
        <p className="text-sm sm:text-base font-medium text-slate-500 mb-6 sm:mb-8 leading-relaxed">Class is finished, please refer to recordings available in the next button.</p>
        <button onClick={() => { onClose(); window.open(classroomLink || '/recording', '_blank'); }} className={`w-full py-3.5 sm:py-4 bg-blue-700 text-white ${tokens.radius.button} text-sm sm:text-base font-bold transition-colors hover:bg-blue-800 shadow-md tracking-wide`}>
          Explore Recordings
        </button>
      </motion.div>
    </div>
  );
}

// ─── SHARED UI COMPONENTS ───
function NavButton({ icon, label, active, onClick, colorTheme = "blue" }: any) {
  const getThemeClasses = () => {
    switch (colorTheme) {
      case 'emerald': return active ? 'bg-emerald-50 text-emerald-700 border-emerald-500 shadow-sm' : 'border-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900';
      case 'violet': return active ? 'bg-violet-50 text-violet-700 border-violet-500 shadow-sm' : 'border-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900';
      default: return active ? 'bg-blue-50 text-blue-700 border-blue-500 shadow-sm' : 'border-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900';
    }
  };
  const iconThemeClass = () => {
    if (!active) return 'text-slate-400';
    switch (colorTheme) {
      case 'emerald': return 'text-emerald-600';
      case 'violet': return 'text-violet-600';
      default: return 'text-blue-600';
    }
  };

  return (
    <button onClick={onClick} className={`w-full flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3.5 ${tokens.radius.button} text-xs sm:text-sm font-bold transition-colors duration-200 border-l-[3px] ${getThemeClasses()}`}>
      <div className={iconThemeClass()}>{icon}</div>
      <span>{label}</span>
    </button>
  );
}

function MobileNavButton({ icon, label, active, onClick, colorTheme = "blue" }: any) {
  const getThemeClasses = () => {
    switch (colorTheme) {
      case 'emerald': return active ? 'text-emerald-700 bg-emerald-50 shadow-sm' : 'text-slate-500 bg-transparent';
      case 'violet': return active ? 'text-violet-700 bg-violet-50 shadow-sm' : 'text-slate-500 bg-transparent';
      default: return active ? 'text-blue-700 bg-blue-50 shadow-sm' : 'text-slate-500 bg-transparent';
    }
  };

  return (
    <motion.button whileTap={{ scale: 0.95 }} onClick={onClick} className={`flex flex-col items-center gap-0.5 sm:gap-1 p-1.5 sm:p-2 ${tokens.radius.button} transition-colors min-w-[50px] sm:min-w-[60px] ${active ? getThemeClasses().split(' ')[0] : 'text-slate-500'}`}>
      <div className={`p-1.5 sm:p-2 rounded-full ${getThemeClasses().replace(getThemeClasses().split(' ')[0], '')}`}>{icon}</div>
      {active && <span className="text-[9px] sm:text-[10px] font-extrabold tracking-widest">{label}</span>}
    </motion.button>
  );
}

function StatCard({ label, value, icon }: any) {
  return (
    <div className={`bg-gradient-to-br from-white to-slate-50/80 p-5 sm:p-6 ${tokens.radius.card} flex items-center justify-between h-full ${tokens.shadow.card} relative overflow-hidden group border-t-4 border-t-transparent hover:border-t-blue-600 transition-all`}>
      <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-blue-500/5 rounded-full blur-2xl -mr-8 -mt-8 sm:-mr-10 sm:-mt-10 pointer-events-none transition-all group-hover:bg-blue-500/10"></div>
      <div className="relative z-10 flex flex-col">
        <p className="text-[9px] sm:text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1 sm:mb-2">{label}</p>
        <p className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-slate-800">{value}</p>
      </div>
      <div className={`p-3 sm:p-4 bg-slate-50 text-slate-400 ${tokens.radius.button} border border-slate-100 relative z-10 shrink-0 group-hover:bg-blue-50 group-hover:text-blue-700 group-hover:scale-110 transition-all shadow-sm`}>{icon}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const st = status.toLowerCase();
  const isAccepted = st === 'accepted' || st === 'verified';
  const isRejected = st === 'rejected';
  
  const colorMap = {
    bg: isAccepted ? 'bg-emerald-50 border-emerald-200' : isRejected ? 'bg-red-50 border-red-200' : 'bg-slate-100 border-slate-200',
    text: isAccepted ? 'text-emerald-700' : isRejected ? 'text-red-700' : 'text-slate-700',
    icon: isAccepted ? CheckCircle : isRejected ? X : Clock
  };

  const Icon = colorMap.icon;

  return (
    <div className={`flex items-center gap-1 sm:gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 ${colorMap.bg} ${colorMap.text} border ${tokens.radius.badge} w-fit shadow-sm`}>
      <Icon size={10} className="sm:w-3 sm:h-3" />
      <span className="text-[10px] sm:text-xs font-bold capitalize tracking-wide">{status}</span>
    </div>
  );
}

function AvatarDisplay({ name, url }: { name: string; url?: string }) {
  if (url) return <img src={url} className={`h-10 w-10 sm:h-12 sm:w-12 ${tokens.radius.badge} object-cover border border-slate-200 shadow-sm`} alt={name} />;
  return (
    <div className={`h-10 w-10 sm:h-12 sm:w-12 ${tokens.radius.badge} bg-gradient-to-br from-blue-700 to-blue-900 flex items-center justify-center text-white font-extrabold text-base sm:text-lg shrink-0 shadow-sm`}>
      {name?.charAt(0) || 'T'}
    </div>
  );
}

function SkeletonLoader() {
  return (
    <div className="p-4 sm:p-8 md:p-10 animate-pulse w-full relative z-10">
      <div className={`bg-slate-200/60 ${tokens.radius.card} h-40 sm:h-48 mb-6 sm:mb-10`}></div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 mb-6 sm:mb-10">
        <div className={`lg:col-span-5 h-48 sm:h-64 bg-slate-200/60 ${tokens.radius.card}`}></div>
        <div className={`lg:col-span-7 h-48 sm:h-64 bg-slate-200/60 ${tokens.radius.card}`}></div>
      </div>
    </div>
  );
}

// ─── TUTOR MARQUEE ───
function TutorsMarquee({ tutors, className = "h-full" }: { tutors: Tutor[]; className?: string }) {
  const router = useRouter();
  if (!tutors || tutors.length === 0) return null;
  const displayTutors = [...tutors, ...tutors, ...tutors].map((t, i) => ({ ...t, _key: `${i}-${t.id}` }));

  return (
    <div className={`bg-gradient-to-br from-white to-slate-50 border border-slate-200/60 ${tokens.radius.card} p-5 sm:p-8 flex flex-col relative overflow-hidden ${className} ${tokens.shadow.card}`}>
      <div className="flex justify-between items-center mb-4 sm:mb-6 shrink-0 z-10 relative">
        <h3 className="text-[10px] sm:text-[11px] font-extrabold text-slate-500 uppercase tracking-widest flex items-center gap-1.5 sm:gap-2">
          <Sparkles size={14} className="text-orange-500 sm:w-4 sm:h-4" /> Verified Premium Tutors
        </h3>
      </div>
      <div className="flex-grow w-full overflow-hidden relative flex items-center">
        <div className="absolute left-0 top-0 bottom-0 w-12 sm:w-20 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none"></div>
        <div className="absolute right-0 top-0 bottom-0 w-12 sm:w-20 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none"></div>
        <div className="flex w-max animate-marquee gap-4 sm:gap-6 h-full items-stretch py-2 sm:py-3">
          {displayTutors.map((tutor) => (
            <div key={tutor._key} onClick={() => router.push(`/tutors/${tutor.id}`)}
              className={`flex flex-col justify-between gap-3 sm:gap-5 bg-white border border-slate-100 p-4 sm:p-6 ${tokens.radius.card} w-[280px] sm:w-[380px] h-full shrink-0 shadow-sm hover:shadow-md hover:-translate-y-1 hover:border-blue-300 transition-all cursor-pointer`}
            >
              <div className="flex items-center gap-3 sm:gap-4">
                <AvatarDisplay name={tutor.name || 'Tutor'} url={tutor.avatar_url} />
                <div className="overflow-hidden w-full">
                  <div className="flex items-center gap-1 sm:gap-1.5">
                    <p className="font-extrabold text-slate-900 text-sm sm:text-lg truncate tracking-tight">{tutor.name}</p>
                    <CheckCircle size={14} className="text-blue-600 shrink-0 sm:w-4 sm:h-4" />
                  </div>
                  <p className="text-[10px] sm:text-xs text-slate-500 font-bold truncate tracking-wide mt-0.5 sm:mt-1">
                    {tutor.education || (tutor.subject && tutor.subject.length > 0 ? tutor.subject[0] : 'Premium Tutor')}
                  </p>
                </div>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 line-clamp-2 flex-grow font-medium leading-relaxed">
                {tutor.bio ? `"${tutor.bio}"` : "Passionate about teaching and helping students achieve their best."}
              </p>
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
  const slug = course.course_code ? course.course_code : encodeURIComponent(course.title);

  return (
    <div onClick={() => window.location.href = `/onlinecourse/${slug}`}
      className={`bg-white border border-slate-200/60 ${tokens.radius.card} overflow-hidden flex flex-col h-full ${tokens.shadow.card} ${tokens.shadow.hover} cursor-pointer group relative`}
    >
      <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-orange-400 to-orange-600 opacity-0 group-hover:opacity-100 transition-opacity z-50"></div>
      <div className="relative w-full h-36 sm:h-48 bg-slate-100 overflow-hidden shrink-0 border-b border-slate-100">
        <div className={`absolute top-3 sm:top-4 right-3 sm:right-4 bg-white text-slate-700 text-[9px] sm:text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-1 sm:px-3 sm:py-1.5 ${tokens.radius.badge} shadow-md z-20`}>Featured</div>
        {course.discount > 0 && (
          <div className="absolute top-5 sm:top-6 left-[-35px] sm:left-[-40px] bg-red-600 text-white font-extrabold text-[9px] sm:text-[11px] uppercase px-10 sm:px-12 py-1 sm:py-1.5 rotate-[-45deg] z-20 tracking-widest shadow-lg">{course.discount}% OFF</div>
        )}
        {course.cover_pic ? (
          <img src={course.cover_pic} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-300"><BookOpen size={40} className="sm:w-12 sm:h-12"/></div>
        )}
      </div>
      <div className="flex flex-col justify-between w-full h-full p-4 sm:p-6 md:p-8">
        <h4 className="font-extrabold text-xl sm:text-2xl mb-3 sm:mb-5 tracking-tight leading-tight break-words group-hover:text-blue-700 transition-colors">{course.title}</h4>
        <div className="flex flex-col gap-2 sm:gap-3 mb-4 sm:mb-6 border-b border-slate-100 pb-3 sm:pb-5">
          {[
            { val: course.tutor_name, icon: User, label: 'Instructor' },
            { val: course.duration, icon: Activity, label: 'Duration' },
            { val: course.start_datetime ? new Date(course.start_datetime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : null, icon: Calendar, label: 'Starts' },
            { val: course.timing, icon: Clock, label: 'Timing' },
            { val: course.difficulty_level, icon: Star, label: 'Level' },
          ].filter(i => i.val).map(({ val, icon: Icon, label }) => (
            <p key={label} className="text-[10px] sm:text-xs font-bold text-slate-600 flex items-center gap-1.5 sm:gap-2">
              <Icon size={12} className={`shrink-0 text-slate-400 sm:w-3.5 sm:h-3.5`} /> <span className="text-slate-400 uppercase tracking-widest text-[9px] sm:text-[10px] w-16 sm:w-20">{label}</span> <span className="truncate">{val}</span>
            </p>
          ))}
        </div>
        <div className="flex flex-wrap items-end justify-between gap-2 sm:gap-3 mt-auto">
          <div className="flex items-end gap-1.5 sm:gap-2">
            <p className="text-slate-900 font-extrabold text-xl sm:text-2xl tracking-tight">Rs. {offerPrice.toLocaleString()}</p>
            {course.discount > 0 && <p className="text-slate-400 font-bold text-xs sm:text-sm line-through mb-0.5 sm:mb-1">Rs. {originalPrice.toLocaleString()}</p>}
          </div>
          <button onClick={(e) => { e.stopPropagation(); window.location.href = `/onlinecourse/${slug}`; }} className={`p-2 sm:p-2.5 border bg-slate-50 border-slate-200 text-slate-600 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 ${tokens.radius.badge} transition-all shadow-sm`} title="See course details">
            <ExternalLink size={16} className="sm:w-[18px] sm:h-[18px]"/>
          </button>
        </div>
      </div>
    </div>
  );
}

function ApplicationsModal({ applications, onClose, onReject, onUpdateStatus }: any) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 sm:p-6 overflow-y-auto">
      <motion.div initial={{ scale: 0.95, opacity: 0, y: 10 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 10 }} className={`bg-white ${tokens.radius.card} w-full max-w-3xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.15)] border border-slate-200 flex flex-col max-h-[90vh] my-auto`}>
        <div className="p-5 sm:p-6 md:p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
          <h3 className="text-xl sm:text-2xl font-extrabold text-slate-800 tracking-tight">Applications ({applications.length})</h3>
          <button onClick={onClose} className="p-2 bg-white rounded-full border border-slate-200 hover:bg-slate-100 text-slate-500 transition-colors shadow-sm"><X size={16} className="sm:w-[18px] sm:h-[18px]" /></button>
        </div>
        <div className="flex-grow overflow-y-auto custom-scrollbar p-5 sm:p-6 md:p-8 space-y-4 sm:space-y-5">
          {applications.length === 0 ? (
            <div className="flex flex-col items-center justify-center bg-white rounded-3xl py-12 sm:py-16 px-4 sm:px-6 border border-dashed border-slate-200 text-center shadow-sm">
              <p className="text-slate-500 font-bold text-sm sm:text-lg">No applications yet.</p>
            </div>
          ) : applications.map((app: ApplicationJoin) => {
            const tutorId = app.tutors?.id;
            const rawTutorName = app.tutors?.name || app.applicant_name || 'applicant';
            const tutorSlug = `${tutorId}-${rawTutorName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

            return (
              <div key={app.id} className={`bg-white border border-slate-200 ${tokens.radius.card} p-4 sm:p-6 flex flex-col sm:flex-row justify-between gap-4 sm:gap-5 shadow-sm hover:shadow-md transition-shadow`}>
                <div>
                  <Link
                    href={tutorId ? `/tutors/${tutorSlug}` : '#'}
                    className="font-extrabold text-slate-900 text-base sm:text-lg hover:text-blue-700 transition-colors cursor-pointer inline-block tracking-tight"
                  >
                    {rawTutorName}
                  </Link>
                  <p className="text-xs sm:text-sm text-slate-500 font-bold mt-1 tracking-wide">{app.vacancies?.subject} — {app.vacancies?.location}</p>
                  <div className="mt-2 sm:mt-3"><StatusBadge status={app.status} /></div>
                </div>
                <div className="flex gap-2 shrink-0 items-start">
                  {app.status !== 'accepted' && (
                    <button onClick={() => onUpdateStatus(app.id, 'accepted')} className={`px-4 py-2 sm:px-5 sm:py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-[10px] sm:text-xs font-extrabold uppercase tracking-widest ${tokens.radius.button} transition-colors shadow-sm`}>Accept</button>
                  )}
                  <button onClick={() => onReject(app.id)} className={`px-4 py-2 sm:px-5 sm:py-2.5 bg-white hover:bg-slate-50 text-slate-600 text-[10px] sm:text-xs font-extrabold uppercase tracking-widest ${tokens.radius.button} border border-slate-200 transition-colors shadow-sm`}>Remove</button>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}

function TutorApplicationsModal({ applications, onClose }: any) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 sm:p-6 overflow-y-auto">
      <motion.div initial={{ scale: 0.95, opacity: 0, y: 10 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 10 }} className={`bg-white ${tokens.radius.card} w-full max-w-3xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.15)] border border-slate-200 flex flex-col max-h-[90vh] my-auto`}>
        <div className="p-5 sm:p-6 md:p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
          <h3 className="text-xl sm:text-2xl font-extrabold text-slate-800 tracking-tight">My Applications ({applications.length})</h3>
          <button onClick={onClose} className="p-2 bg-white rounded-full border border-slate-200 hover:bg-slate-100 text-slate-500 transition-colors shadow-sm"><X size={16} className="sm:w-[18px] sm:h-[18px]" /></button>
        </div>
        <div className="flex-grow overflow-y-auto custom-scrollbar p-5 sm:p-6 md:p-8 space-y-4 sm:space-y-5">
          {applications.length === 0 ? (
            <div className="flex flex-col items-center justify-center bg-white rounded-3xl py-12 sm:py-16 px-4 sm:px-6 border border-dashed border-slate-200 text-center shadow-sm">
              <p className="text-slate-500 font-bold text-sm sm:text-lg">No applications submitted yet.</p>
            </div>
          ) : applications.map((app: TutorApplicationJoin) => (
            <div key={app.id} className={`bg-white border border-slate-200 ${tokens.radius.card} p-4 sm:p-6 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4`}>
              <div>
                <p className="font-extrabold text-slate-900 text-base sm:text-lg tracking-tight">{app.vacancies?.subject}</p>
                <p className="text-xs sm:text-sm text-slate-500 font-bold mt-0.5 sm:mt-1 flex items-center gap-1 sm:gap-1.5 tracking-wide"><MapPin size={12} className="text-slate-400 sm:w-3.5 sm:h-3.5" />{app.vacancies?.location}</p>
              </div>
              <StatusBadge status={app.status} />
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

function DashboardView({ userId, userName, count, course, verifiedTutors, onShowApplications, globalRecordings, router }: any) {
  return (
    <div className="space-y-6 sm:space-y-10 w-full pb-10">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900">Student Hub</h2>
        {count > 0 && (
          <button onClick={onShowApplications} className={`w-full md:w-auto flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 sm:px-6 py-2.5 sm:py-3 ${tokens.radius.button} font-bold text-sm transition-colors shadow-md`}>
            <Users size={16} className="sm:w-[18px] sm:h-[18px]"/> {count} Applicant{count !== 1 ? 's' : ''}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
        {course && (
          <div className="flex flex-col gap-4 sm:gap-5">
            <div className="flex justify-between items-center px-1">
              <h3 className="text-[10px] sm:text-[11px] font-extrabold text-slate-500 uppercase tracking-widest flex items-center gap-1.5 sm:gap-2">
                <Sparkles size={14} className="text-blue-600 sm:w-4 sm:h-4" /> Featured Live Course
              </h3>
              <Link href="/onlinecourse" className="text-[9px] sm:text-[10px] font-extrabold text-blue-700 uppercase tracking-wide hover:underline flex items-center gap-1">
                See All <ArrowRight size={12} className="sm:w-[14px] sm:h-[14px]" />
              </Link>
            </div>
            <LatestCourseCard course={course} isTutor={false} />
          </div>
        )}
        <div className="flex flex-col gap-5 sm:gap-6">
          {verifiedTutors?.length > 0 && (
            <div className={`bg-gradient-to-br from-white to-slate-50/50 border border-slate-200/60 ${tokens.radius.card} p-5 sm:p-8 flex flex-col gap-4 sm:gap-5 ${tokens.shadow.card}`}>
              <h3 className="text-[10px] sm:text-[11px] font-extrabold text-slate-500 uppercase tracking-widest flex items-center gap-1.5 sm:gap-2"><Sparkles size={14} className="text-orange-500 sm:w-4 sm:h-4" /> Find Tutors</h3>
              <Link href="/tutors" className={`w-full text-center bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 hover:border-blue-200 border border-slate-200 font-bold py-3 sm:py-3.5 ${tokens.radius.button} transition-colors text-sm shadow-sm hover:shadow-md`}>Browse {verifiedTutors.length}+ Verified Tutors</Link>
            </div>
          )}
          {globalRecordings?.length > 0 && <RecommendedRecordingsBox recordings={globalRecordings} router={router} />}
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
    <div className="space-y-6 sm:space-y-8 w-full pb-10">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900">My Postings</h2>
        <Link href="/post-tuition" className={`w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-700 hover:bg-blue-800 text-white px-5 sm:px-6 py-2.5 sm:py-3 ${tokens.radius.button} font-bold text-sm transition-colors shadow-sm`}>
          <Plus size={16} className="sm:w-[18px] sm:h-[18px]"/> Post Vacancy
        </Link>
      </div>

      <div className="space-y-5 sm:space-y-6">
        {vacancies.length === 0 ? (
          <div className="flex flex-col items-center justify-center bg-white rounded-3xl py-16 sm:py-20 px-4 sm:px-6 border border-dashed border-slate-200 text-center shadow-sm">
            <FileText size={40} className="text-slate-300 mb-3 sm:mb-4 sm:w-12 sm:h-12" />
            <p className="font-bold text-slate-500 text-sm sm:text-lg">No active vacancies. Post one to find tutors!</p>
          </div>
        ) : vacancies.map((v: Vacancy) => (
          <div key={v.id} className={`bg-gradient-to-br from-white to-slate-50/50 border border-slate-200/60 ${tokens.radius.card} p-5 sm:p-6 md:p-8 flex flex-col gap-4 sm:gap-5 ${tokens.shadow.card} group hover:border-blue-300 transition-colors relative`}>
            {editingId === v.id ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 relative z-10">
                {[
                  { key: 'subject', label: 'Subject' }, { key: 'location', label: 'Location' },
                  { key: 'salary_range', label: 'Salary' }, { key: 'class_time', label: 'Class Time' },
                  { key: 'class_level', label: 'Class Level' }
                ].map(({ key, label }) => (
                  <div key={key} className="flex flex-col gap-1 sm:gap-1.5">
                    <label className="text-[9px] sm:text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">{label}</label>
                    <input value={(editData as any)[key] || ''} onChange={e => setEditData(p => ({ ...p, [key]: e.target.value }))}
                      className={`border border-slate-200 ${tokens.radius.badge} px-3 py-2 sm:px-4 sm:py-2.5 text-xs sm:text-sm font-bold outline-none focus:border-blue-400 bg-white shadow-sm`}
                    />
                  </div>
                ))}
                <div className="col-span-1 sm:col-span-2 flex flex-col sm:flex-row gap-2 sm:gap-3 mt-1 sm:mt-2">
                  <button onClick={handleSave} className={`w-full sm:w-auto flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-5 sm:px-6 py-2.5 ${tokens.radius.button} font-bold text-sm transition-colors shadow-sm`}><Save size={14} className="sm:w-4 sm:h-4" /> Save</button>
                  <button onClick={() => setEditingId(null)} className={`w-full sm:w-auto flex items-center justify-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-5 sm:px-6 py-2.5 ${tokens.radius.button} font-bold text-sm transition-colors shadow-sm`}><X size={14} className="sm:w-4 sm:h-4" /> Cancel</button>
                </div>
              </div>
            ) : (
              <>
                <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-blue-400 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity z-50"></div>
                <div className="flex flex-col sm:flex-row justify-between items-start gap-3 sm:gap-4">
                  <div>
                    <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                      <h3 className="font-extrabold text-xl sm:text-2xl text-slate-900 tracking-tight">{v.subject}</h3>
                      {v.urgent && <span className={`bg-red-50 text-red-600 text-[9px] sm:text-[10px] font-extrabold uppercase tracking-widest px-2 py-0.5 sm:px-2.5 sm:py-1 ${tokens.radius.badge} flex items-center gap-1 border border-red-100 shadow-sm`}><Flame size={10} className="sm:w-3 sm:h-3" />Urgent</span>}
                    </div>
                    <div className="flex flex-wrap gap-3 sm:gap-5 text-xs sm:text-sm text-slate-600 font-bold">
                      <span className="flex items-center gap-1 sm:gap-1.5"><MapPin size={14} className="text-slate-400 sm:w-4 sm:h-4" />{v.location}</span>
                      <span className="flex items-center gap-1 sm:gap-1.5"><Clock size={14} className="text-slate-400 sm:w-4 sm:h-4" />{v.class_time}</span>
                      <span className="flex items-center gap-1 sm:gap-1.5"><DollarSign size={14} className="text-slate-400 sm:w-4 sm:h-4" />{v.salary_range}</span>
                    </div>
                  </div>
                  <div className="flex gap-1.5 sm:gap-2 shrink-0 mt-3 sm:mt-0 w-full sm:w-auto justify-end">
                    <button onClick={() => onViewApplicants(v.id)} className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 sm:gap-2 px-3 py-2 sm:px-4 sm:py-2.5 bg-blue-50 text-blue-700 border border-blue-200 ${tokens.radius.badge} font-extrabold text-[10px] sm:text-xs tracking-wide uppercase hover:bg-blue-100 transition-colors shadow-sm`}>
                      <Users size={14} className="sm:w-4 sm:h-4"/> {v.applicant_count || 0}
                    </button>
                    <button onClick={() => startEdit(v)} className={`p-2 sm:p-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 ${tokens.radius.badge} transition-colors shadow-sm`} title="Edit"><Edit2 size={14} className="sm:w-4 sm:h-4"/></button>
                    <button onClick={() => onDelete(v.id)} className={`p-2 sm:p-2.5 bg-white border border-slate-200 hover:bg-red-50 text-slate-600 hover:text-red-600 ${tokens.radius.badge} transition-colors shadow-sm`} title="Delete"><Trash2 size={14} className="sm:w-4 sm:h-4"/></button>
                  </div>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function StudentMyRequestsView({ requests, onCancel, onChatAdmin }: any) {
  return (
    <div className="space-y-6 sm:space-y-8 w-full pb-10">
      <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900">My Requests</h2>

      <div className="space-y-5 sm:space-y-6">
        {requests.length === 0 ? (
          <div className="flex flex-col items-center justify-center bg-white rounded-3xl py-16 sm:py-20 px-4 sm:px-6 border border-dashed border-slate-200 text-center shadow-sm">
            <Users size={40} className="text-slate-300 mb-3 sm:mb-4 sm:w-12 sm:h-12" />
            <p className="font-bold text-slate-500 text-sm sm:text-lg">No tutor requests sent yet.</p>
            <Link href="/tutors" className="mt-2 sm:mt-3 text-blue-700 font-extrabold text-xs sm:text-sm uppercase tracking-wide hover:underline flex items-center gap-1">Browse Tutors <ArrowRight size={12} className="sm:w-[14px] sm:h-[14px]" /></Link>
          </div>
        ) : requests.map((req: StudentRequest) => (
          <div key={req.id} className={`bg-white border border-slate-200/60 ${tokens.radius.card} p-5 sm:p-6 md:p-8 flex flex-col sm:flex-row justify-between gap-4 sm:gap-5 ${tokens.shadow.card} group hover:border-blue-300 transition-colors relative overflow-hidden`}>
            <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-blue-400 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity z-50"></div>
            <div>
              <p className="font-extrabold text-slate-900 text-lg sm:text-xl tracking-tight">{req.tutors?.name || 'Tutor'}</p>
              <div className="flex flex-wrap gap-3 sm:gap-4 mt-2 sm:mt-3 text-xs sm:text-sm text-slate-600 font-bold">
                <span className="flex items-center gap-1 sm:gap-1.5"><GraduationCap size={14} className="text-slate-400 sm:w-4 sm:h-4" />{req.grade}</span>
                {req.preferred_mode && <span className="flex items-center gap-1 sm:gap-1.5"><Monitor size={14} className="text-slate-400 sm:w-4 sm:h-4" />{req.preferred_mode}</span>}
                {req.tutors?.location && <span className="flex items-center gap-1 sm:gap-1.5"><MapPin size={14} className="text-slate-400 sm:w-4 sm:h-4" />{req.tutors.location}</span>}
              </div>
              {req.message && <p className={`text-xs sm:text-sm text-slate-600 mt-3 sm:mt-4 italic bg-slate-50 ${tokens.radius.badge} p-3 sm:p-4 border border-slate-100`}>"{req.message}"</p>}
              <div className="mt-3 sm:mt-4"><StatusBadge status={req.status} /></div>
            </div>
            <div className="flex flex-row sm:flex-col gap-2 shrink-0 mt-3 sm:mt-0 w-full sm:w-auto">
              <button onClick={onChatAdmin} className={`flex-1 sm:flex-none px-4 py-2 sm:px-5 sm:py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-[10px] sm:text-xs font-extrabold uppercase tracking-widest ${tokens.radius.button} transition-colors shadow-sm flex items-center justify-center sm:justify-start gap-1.5`}><MessageCircle size={14} className="sm:w-4 sm:h-4"/>Support</button>
              <button onClick={() => onCancel(req.id)} className={`flex-1 sm:flex-none px-4 py-2 sm:px-5 sm:py-2.5 bg-white hover:bg-red-50 text-slate-700 hover:text-red-700 border border-slate-200 text-[10px] sm:text-xs font-extrabold uppercase tracking-widest ${tokens.radius.button} transition-colors shadow-sm`}>Cancel</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TutorDashboardView({ profile, userId, userName, userEmail, applicationsCount, requestsCount, course, urgentVacancies, onShowApplications, onShowRequests, onFixProfile, globalRecordings, router }: any) {
  const completeness = profile ? [profile.bio, profile.education, profile.experience, profile.contact_num, profile.location, profile.hour_rate, profile.mode_of_teaching].filter(Boolean).length : 0;
  const pct = Math.round((completeness / 7) * 100);

  return (
    <div className="space-y-6 sm:space-y-10 w-full pb-10">
      <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900">Tutor Hub</h2>

      {pct < 100 && (
        <div className={`bg-orange-50 border border-orange-200 ${tokens.radius.card} p-5 sm:p-6 md:p-8 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-5 shadow-sm`}>
          <div className="hidden sm:flex w-10 h-10 sm:w-12 sm:h-12 bg-orange-100 rounded-full items-center justify-center shrink-0">
            <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" />
          </div>
          <div className="flex-1 w-full">
            <p className="font-bold text-orange-900 text-sm sm:text-base">Profile {pct}% complete — finish it to attract more students.</p>
            <div className="w-full bg-orange-200/50 rounded-full h-1.5 sm:h-2 mt-2 sm:mt-3 overflow-hidden"><div className="bg-orange-500 h-1.5 sm:h-2 rounded-full transition-all duration-1000" style={{ width: `${pct}%` }}></div></div>
          </div>
          <button onClick={onFixProfile} className={`shrink-0 bg-white border border-orange-200 text-orange-800 hover:bg-orange-100 text-xs sm:text-sm font-bold px-4 py-2.5 sm:px-6 sm:py-3 ${tokens.radius.button} transition-colors shadow-sm w-full sm:w-auto`}>Complete Profile</button>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
        <StatCard label="Applications" value={applicationsCount} icon={<Briefcase size={20} className="sm:w-6 sm:h-6" />} />
        <StatCard label="Requests" value={requestsCount} icon={<Users size={20} className="sm:w-6 sm:h-6" />} />
        <div className="col-span-2 md:col-span-1">
          <StatCard label="Urgent Vacancies" value={urgentVacancies?.length || 0} icon={<Flame size={20} className="sm:w-6 sm:h-6" />} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
        <div className="flex flex-col gap-5 sm:gap-6">
          <div className="flex flex-col gap-3 sm:gap-4">
            <button onClick={onShowApplications} className={`w-full bg-slate-900 hover:bg-slate-800 text-white py-3.5 sm:py-4 ${tokens.radius.button} font-bold transition-colors flex items-center justify-center gap-2 shadow-sm text-sm sm:text-base`}>
              <Briefcase size={18} className="sm:w-5 sm:h-5" /> View My Applications
            </button>
            <button onClick={onShowRequests} className={`w-full bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 py-3.5 sm:py-4 ${tokens.radius.button} font-bold transition-colors flex items-center justify-center gap-2 shadow-sm text-sm sm:text-base`}>
              <Users size={18} className="sm:w-5 sm:h-5" /> View Student Requests
            </button>
          </div>
          {globalRecordings?.length > 0 && <RecommendedRecordingsBox recordings={globalRecordings} router={router} />}
        </div>

        {course && (
          <div className="flex flex-col gap-4 sm:gap-5">
            <div className="flex justify-between items-center px-1">
              <h3 className="text-[10px] sm:text-[11px] font-extrabold text-slate-500 uppercase tracking-widest flex items-center gap-1.5 sm:gap-2">
                <Sparkles size={14} className="text-blue-600 sm:w-4 sm:h-4" /> Featured Course
              </h3>
              <Link href="/onlinecourse" className="text-[9px] sm:text-[10px] font-extrabold text-blue-700 uppercase tracking-wide hover:underline flex items-center gap-1">
                See All <ArrowRight size={12} className="sm:w-[14px] sm:h-[14px]" />
              </Link>
            </div>
            <LatestCourseCard course={course} isTutor={true} />
          </div>
        )}
      </div>

      {urgentVacancies?.length > 0 && (
        <div className={`bg-gradient-to-br from-white to-slate-50/50 border border-slate-200/60 ${tokens.radius.card} p-5 sm:p-8 ${tokens.shadow.card}`}>
          <h3 className="text-[10px] sm:text-[11px] font-extrabold text-slate-500 uppercase tracking-widest mb-4 sm:mb-5 flex items-center gap-1.5 sm:gap-2"><Flame size={14} className="text-red-500 sm:w-4 sm:h-4" /> Urgent Vacancies</h3>
          <div className="space-y-3 sm:space-y-4">
            {urgentVacancies.slice(0, 3).map((v: Vacancy) => (
              <div key={v.id} className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white border border-slate-100 p-4 sm:p-5 ${tokens.radius.badge} shadow-sm hover:shadow-md hover:border-red-200 transition-all group`}>
                <div>
                  <p className="font-extrabold text-slate-900 text-base sm:text-lg group-hover:text-red-700 transition-colors">{v.subject}</p>
                  <p className="text-xs sm:text-sm text-slate-500 font-bold mt-1 flex items-center gap-1.5"><MapPin size={12} className="text-slate-400 sm:w-3.5 sm:h-3.5" />{v.location} <span className="text-slate-300 mx-1">•</span> {v.class_level}</p>
                </div>
                <Link href={`/vacancies/${v.id}`} className="w-full sm:w-auto text-[10px] sm:text-xs font-extrabold uppercase tracking-widest text-blue-700 hover:text-blue-800 flex items-center justify-center gap-1 bg-blue-50 px-4 py-2.5 sm:py-2 rounded-lg">Apply <ExternalLink size={12} className="sm:w-[14px] sm:h-[14px]"/></Link>
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
    <div className="space-y-6 sm:space-y-8 w-full pb-10">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-5">
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900">Job Board</h2>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search subject or location…"
          className={`border border-slate-200 bg-white ${tokens.radius.button} px-4 py-2.5 sm:px-5 sm:py-3.5 text-xs sm:text-sm font-bold outline-none focus:border-blue-500 shadow-sm w-full sm:w-80`}
        />
      </div>

      <div className="space-y-5 sm:space-y-6">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center bg-white rounded-3xl py-16 sm:py-20 px-4 sm:px-6 border border-dashed border-slate-200 text-center shadow-sm">
            <SearchX size={40} className="text-slate-300 mb-3 sm:mb-4 sm:w-12 sm:h-12" />
            <p className="font-bold text-slate-500 text-sm sm:text-lg">No vacancies found.</p>
          </div>
        ) : filtered.map((v: Vacancy) => (
          <div key={v.id} className={`bg-gradient-to-br from-white to-slate-50/50 border border-slate-200/60 ${tokens.radius.card} p-5 sm:p-6 md:p-8 ${tokens.shadow.card} flex flex-col sm:flex-row justify-between gap-4 sm:gap-5 hover:border-blue-300 transition-colors relative overflow-hidden group`}>
            <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-blue-400 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity z-50"></div>
            <div className="flex-1">
              <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                <h3 className="font-extrabold text-xl sm:text-2xl text-slate-900 tracking-tight group-hover:text-blue-700 transition-colors">{v.subject}</h3>
                {v.urgent && <span className={`bg-red-50 text-red-600 text-[9px] sm:text-[10px] font-extrabold uppercase tracking-widest px-2 py-0.5 sm:px-2.5 sm:py-1 ${tokens.radius.badge} flex items-center gap-1 border border-red-100 shadow-sm`}><Flame size={10} className="sm:w-3 sm:h-3" />Urgent</span>}
              </div>
              <div className="flex flex-wrap gap-3 sm:gap-5 text-xs sm:text-sm text-slate-600 font-bold">
                <span className="flex items-center gap-1 sm:gap-1.5"><MapPin size={14} className="text-slate-400 sm:w-4 sm:h-4" />{v.location}</span>
                <span className="flex items-center gap-1 sm:gap-1.5"><GraduationCap size={14} className="text-slate-400 sm:w-4 sm:h-4" />{v.class_level}</span>
                <span className="flex items-center gap-1 sm:gap-1.5"><Clock size={14} className="text-slate-400 sm:w-4 sm:h-4" />{v.class_time}</span>
                <span className="flex items-center gap-1 sm:gap-1.5"><DollarSign size={14} className="text-slate-400 sm:w-4 sm:h-4" />{v.salary_range}</span>
              </div>
              {v.description && <p className="text-xs sm:text-sm text-slate-500 mt-3 sm:mt-4 line-clamp-2 leading-relaxed font-medium">"{v.description}"</p>}
            </div>
            <div className="shrink-0 flex items-center mt-3 sm:mt-0 w-full sm:w-auto">
              <Link href={`/vacancies/${v.id}`} className={`w-full flex items-center justify-center gap-2 bg-white border border-slate-200 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 text-slate-700 px-5 sm:px-6 py-2.5 sm:py-3 ${tokens.radius.button} font-bold text-xs sm:text-sm transition-all shadow-sm`}>
                View Details <ExternalLink size={14} className="sm:w-4 sm:h-4"/>
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StudentRequestsView({ requests, onUpdateStatus, onChatAdmin }: any) {
  return (
    <div className="space-y-6 sm:space-y-8 w-full pb-10">
      <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900">Student Requests</h2>

      <div className="space-y-5 sm:space-y-6">
        {requests.length === 0 ? (
          <div className="flex flex-col items-center justify-center bg-white rounded-3xl py-16 sm:py-20 px-4 sm:px-6 border border-dashed border-slate-200 text-center shadow-sm">
            <Users size={40} className="text-slate-300 mb-3 sm:mb-4 sm:w-12 sm:h-12" />
            <p className="font-bold text-slate-500 text-sm sm:text-lg">No student requests yet. Complete your profile to attract students.</p>
          </div>
        ) : requests.map((req: StudentRequest) => (
          <div key={req.id} className={`bg-gradient-to-br from-white to-slate-50/50 border border-slate-200/60 ${tokens.radius.card} p-5 sm:p-6 md:p-8 ${tokens.shadow.card} flex flex-col sm:flex-row justify-between gap-4 sm:gap-5 relative overflow-hidden group hover:border-blue-300 transition-colors`}>
            <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-blue-400 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity z-50"></div>
            <div>
              <p className="font-extrabold text-slate-900 text-lg sm:text-xl tracking-tight">{req.tutors?.name || 'Tutor'}</p>
              <div className="flex flex-wrap gap-3 sm:gap-4 mt-2 sm:mt-3 text-xs sm:text-sm text-slate-600 font-bold">
                <span className="flex items-center gap-1 sm:gap-1.5"><GraduationCap size={14} className="text-slate-400 sm:w-4 sm:h-4" />{req.grade}</span>
                {req.preferred_mode && <span className="flex items-center gap-1 sm:gap-1.5"><Monitor size={14} className="text-slate-400 sm:w-4 sm:h-4" />{req.preferred_mode}</span>}
              </div>
              {req.message && <p className={`text-xs sm:text-sm text-slate-600 mt-3 sm:mt-4 italic bg-white ${tokens.radius.badge} p-3 sm:p-4 border border-slate-100 shadow-sm`}>"{req.message}"</p>}
              <div className="mt-3 sm:mt-4"><StatusBadge status={req.status} /></div>
            </div>
            <div className="flex flex-row sm:flex-col gap-2 shrink-0 mt-3 sm:mt-0">
              {req.status !== 'accepted' && (
                <button onClick={() => onUpdateStatus(req.id, 'accepted')} className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 sm:gap-2 px-4 sm:px-5 py-2.5 sm:py-3 bg-slate-900 hover:bg-slate-800 text-white text-[10px] sm:text-xs font-extrabold uppercase tracking-widest ${tokens.radius.button} transition-colors shadow-sm`}><Check size={14} className="sm:w-4 sm:h-4" />Accept</button>
              )}
              {req.status !== 'rejected' && (
                <button onClick={() => onUpdateStatus(req.id, 'rejected')} className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 sm:gap-2 px-4 sm:px-5 py-2.5 sm:py-3 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 text-[10px] sm:text-xs font-extrabold uppercase tracking-widest ${tokens.radius.button} transition-colors shadow-sm`}><X size={14} className="sm:w-4 sm:h-4" />Decline</button>
              )}
              <button onClick={onChatAdmin} className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 sm:gap-2 px-4 sm:px-5 py-2.5 sm:py-3 bg-white hover:bg-blue-50 hover:text-blue-700 border border-slate-200 text-slate-600 text-[10px] sm:text-xs font-extrabold uppercase tracking-widest ${tokens.radius.button} transition-colors shadow-sm`}><MessageCircle size={14} className="sm:w-4 sm:h-4" />Support</button>
            </div>
          </div>
        ))}
      </div>
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
    <div className="space-y-6 sm:space-y-8 w-full pb-10">
      <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900">My Info</h2>
      
      <div className={`bg-gradient-to-br from-white to-slate-50/50 border border-slate-200/60 ${tokens.radius.card} p-5 sm:p-8 md:p-10 ${tokens.shadow.card} space-y-6 sm:space-y-8`}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {fields.map(({ key, label, type }) => (
            <div key={key} className="flex flex-col gap-1.5 sm:gap-2">
              <label className="text-[9px] sm:text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">{label}</label>
              {key === 'subject' ? (
                <input
                  type="text"
                  value={form.subject ? (Array.isArray(form.subject) ? form.subject.join(', ') : form.subject) : ''}
                  onChange={e => setForm(p => ({ ...p, subject: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }))}
                  className={`border border-slate-200 ${tokens.radius.button} px-4 sm:px-5 py-2.5 sm:py-3.5 text-xs sm:text-sm font-bold outline-none focus:border-blue-500 focus:bg-white bg-white shadow-sm transition-colors`}
                  placeholder="Math, Science, English"
                />
              ) : (
                <input
                  type={type}
                  value={(form as any)[key] || ''}
                  onChange={e => setForm(p => ({ ...p, [key]: type === 'number' ? (e.target.value ? Number(e.target.value) : '') : e.target.value }))}
                  className={`border border-slate-200 ${tokens.radius.button} px-4 sm:px-5 py-2.5 sm:py-3.5 text-xs sm:text-sm font-bold outline-none focus:border-blue-500 focus:bg-white bg-white shadow-sm transition-colors`}
                />
              )}
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-1.5 sm:gap-2">
          <label className="text-[9px] sm:text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">Bio</label>
          <textarea
            value={form.bio || ''}
            onChange={e => setForm(p => ({ ...p, bio: e.target.value }))}
            rows={5}
            className={`border border-slate-200 ${tokens.radius.button} px-4 sm:px-5 py-3 sm:py-4 text-xs sm:text-sm font-bold outline-none focus:border-blue-500 bg-white shadow-sm resize-none transition-colors leading-relaxed`}
            placeholder="Tell students about yourself…"
          />
        </div>

        <div className="flex items-center gap-3 sm:gap-4 bg-white p-4 sm:p-5 border border-slate-200 shadow-sm rounded-2xl">
          <label className="flex items-center gap-2.5 sm:gap-3 cursor-pointer">
            <input type="checkbox" checked={form.availability || false} onChange={e => setForm(p => ({ ...p, availability: e.target.checked }))}
              className="w-4 h-4 sm:w-5 sm:h-5 accent-blue-700 rounded cursor-pointer"
            />
            <span className="font-extrabold text-slate-800 text-sm sm:text-base">Currently Available for Students</span>
          </label>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 pt-6 sm:pt-8 border-t border-slate-200/60">
          <button onClick={handleSave} disabled={saving} className={`w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white px-6 sm:px-8 py-3 sm:py-3.5 ${tokens.radius.button} font-bold text-xs sm:text-sm transition-colors shadow-md tracking-wide`}>
            {saving ? <RotateCcw size={16} className="animate-spin sm:w-[18px] sm:h-[18px]" /> : <Save size={16} className="sm:w-[18px] sm:h-[18px]" />}
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
          {saved && (
            <span className="w-full sm:w-auto flex items-center justify-center gap-1.5 text-slate-600 text-xs sm:text-sm font-bold bg-green-50 text-green-700 px-4 py-2.5 sm:py-2 rounded-xl sm:rounded-lg border border-green-200">
              <CheckCircle size={14} className="text-green-600 sm:w-4 sm:h-4" /> Saved successfully
            </span>
          )}
        </div>
      </div>
    </div>
  );
}