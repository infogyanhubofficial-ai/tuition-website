"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  User, Users, Briefcase, LayoutDashboard, FileText, Lock, MapPin, 
  Clock, DollarSign, Edit2, Trash2, Save, X, Plus, MessageCircle, 
  GraduationCap, Monitor, SearchX, CheckCircle, Flame, Sparkles, ExternalLink, RotateCcw, Check, AlertCircle, BookOpen, ArrowRight, Calendar 
} from "lucide-react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { 
  tokens, StatusBadge, SkeletonLoader, StatCard, AvatarDisplay, RecommendedRecordingsBox, 
  Vacancy, Tutor, GlobalRecording, OnlineCourse 
} from "@/components/dashboard/shared";

// --- ANIMATION VARIANTS ---
const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const fadeUpItem: Variants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

export default function TuitionServicesPage() {
  const router = useRouter();
  const supabase = createClient();

  // Core Page State
  const [dashboardMode, setDashboardMode] = useState<'student' | 'tutor'>('student');
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [loading, setLoading] = useState(true);

  // User & Tutor Profile State
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>('');
  const [userName, setUserName] = useState<string>('User');
  const [hasTutorProfile, setHasTutorProfile] = useState(false);
  const [tutorProfile, setTutorProfile] = useState<Tutor | null>(null);

  // Modals
  const [isApplicationsOpen, setIsApplicationsOpen] = useState(false);
  const [appFilterId, setAppFilterId] = useState<number | null>(null);

  // --- STUDENT DATA STATES ---
  const [vacancies, setVacancies] = useState<Vacancy[]>([]);
  const [appliedTutors, setAppliedTutors] = useState<any[]>([]);
  const [applicantCount, setApplicantCount] = useState(0);
  const [studentMyRequests, setStudentMyRequests] = useState<any[]>([]);
  
  // --- TUTOR DATA STATES ---
  const [allVacancies, setAllVacancies] = useState<Vacancy[]>([]);
  const [urgentVacancies, setUrgentVacancies] = useState<Vacancy[]>([]);
  const [tutorApplications, setTutorApplications] = useState<any[]>([]);
  const [studentRequests, setStudentRequests] = useState<any[]>([]);

  // --- GLOBAL DATA STATES ---
  const [verifiedTutors, setVerifiedTutors] = useState<Tutor[]>([]);
  const [latestCourse, setLatestCourse] = useState<OnlineCourse | null>(null);
  const [globalRecordings, setGlobalRecordings] = useState<GlobalRecording[]>([]);

  useEffect(() => { document.title = `GyanHub | Tuition | ${activeTab}`; }, [activeTab]);

  // Tab routing safety
  useEffect(() => {
    if (dashboardMode === 'tutor' && hasTutorProfile) {
      if (!['Dashboard', 'Available Vacancies', 'Student Requests', 'My Info'].includes(activeTab)) setActiveTab('Dashboard');
    } else if (dashboardMode === 'student') {
      if (!['Dashboard', 'Posted Vacancies', 'My Requests'].includes(activeTab)) setActiveTab('Dashboard');
    }
  }, [dashboardMode, hasTutorProfile, activeTab]);

  // Fetch Logic
  useEffect(() => {
    const fetchTuitionData = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login?next=/dashboard/tuition'); return; }
      
      setUserId(user.id);
      setUserEmail(user.email || '');
      setUserName(user.user_metadata?.full_name || 'User');
      const uid = user.id;
      const email = user.email || '';

      try {
        // 1. Fetch Global Data
        const { data: tData } = await supabase.from('tutors').select('*').eq('verified', true).limit(10);
        if (tData) setVerifiedTutors(tData);

        // Fetch course AND its matching syllabus/batch metadata 
        const { data: coursesV2 } = await supabase.from('online_courses_v2').select('*').eq('is_active', true).limit(1).maybeSingle();
        
        if (coursesV2) {
          // Fetch syllabus, cover pic, syllabus PDF, and join the online_tutors table for the name
          // Using select('*') safely avoids crashing if a custom duration column doesn't exist
          const { data: syllabus } = await supabase
            .from('syllabi_v2')
            .select('course_code, cover_pic, syllabus_pdf, online_tutors(name)')
            .eq('id', coursesV2.syllabus_id)
            .maybeSingle();

          // Fetch batch start date, timing, and duration using the active_batch_no
          const { data: batch } = await supabase
            .from('course_batches_v2')
            .select('*')
            .eq('syllabus_id', coursesV2.syllabus_id)
            .eq('batch_no', coursesV2.active_batch_no)
            .maybeSingle();

          // Handle Supabase relation responses safely
          const fetchedTutorName = Array.isArray(syllabus?.online_tutors) 
            ? (syllabus?.online_tutors as any)[0]?.name 
            : (syllabus?.online_tutors as any)?.name;

          setLatestCourse({
            id: coursesV2.syllabus_id || 'featured',
            title: coursesV2.name || 'Featured Course',
            fee: coursesV2.fee || 0,
            discount: coursesV2.discount || 0,
            cover_pic: syllabus?.cover_pic || '', 
            course_code: syllabus?.course_code || null,
            syllabus_pdf: syllabus?.syllabus_pdf || null,     
            tutor_name: fetchedTutorName || null,              
            start_datetime: batch?.start_datetime || null,    
            timing: batch?.timing || coursesV2?.timing || batch?.class_time || coursesV2?.class_time || null, 
            duration: batch?.duration || coursesV2?.duration || null,        
          } as any);
        }

        const { data: recData } = await supabase.from('recordings').select('id, course_name, course_hours, standard_fee, discount, cover_pic_url').eq('is_active', true).limit(3);
        if (recData) setGlobalRecordings(recData as any);

        // 2. Fetch Student Specific Data
        let vacancyQuery = supabase.from('vacancies').select('*').order('created_at', { ascending: false });
        if (email) vacancyQuery = vacancyQuery.or(`user_id.eq.${uid},email.ilike.${email}`);
        else vacancyQuery = vacancyQuery.eq('user_id', uid);
        
        const { data: vData } = await vacancyQuery;
        const activeVacs = (vData || []).filter((v: any) => v.status === true);
        const vIds = activeVacs.map((v: any) => v.id);
        
        if (vIds.length > 0) {
          const { data: appData } = await supabase.from('vacancy_applications')
            .select(`id, status, vacancy_id, created_at, applicant_name, user_id, vacancies ( subject, location ), tutors ( id, user_id, name, avatar_url, education, hour_rate, location )`)
            .in('vacancy_id', vIds).order('created_at', { ascending: false });
            
          if (appData) {
            const appCountMap: Record<number, number> = {};
            appData.forEach((app: any) => { appCountMap[app.vacancy_id] = (appCountMap[app.vacancy_id] || 0) + 1; });
            const formattedApps = appData.map((app: any) => ({ ...app, vacancies: Array.isArray(app.vacancies) ? app.vacancies[0] : app.vacancies, tutors: Array.isArray(app.tutors) ? app.tutors[0] : app.tutors || { name: app.applicant_name } }));
            setAppliedTutors(formattedApps);
            setApplicantCount(appData.length);
            setVacancies(activeVacs.map((v: any) => ({ ...v, applicant_count: appCountMap[v.id] || 0 })));
          }
        } else {
          setVacancies(activeVacs.map((v: any) => ({ ...v, applicant_count: 0 })));
          setAppliedTutors([]);
          setApplicantCount(0);
        }
        
        const { data: myReqs } = await supabase.from('student_requests').select('id, created_at, tutor_id, status, grade, preferred_mode, message, tutors(name, hour_rate, location)').eq('user_id', uid).order('created_at', { ascending: false });
        if (myReqs) setStudentMyRequests(myReqs);

        // 3. Fetch Tutor Specific Data & Set Auto-Mode
        const { data: profile } = await supabase.from('tutors').select('*').eq('user_id', uid).maybeSingle();
        let currentTutorId = null;
        
        if (profile) {
          setTutorProfile(profile as Tutor);
          setHasTutorProfile(true);
          setDashboardMode('tutor'); // Auto-lock to tutor mode if they have a profile
          currentTutorId = profile.id;
        } else {
          setHasTutorProfile(false);
          setDashboardMode('student'); // Ensure it defaults to student if no profile
        }

        const { data: allVacData } = await supabase.from('vacancies').select('*').order('created_at', { ascending: false });
        if (allVacData) {
          const activeAllVacs = allVacData.filter((v: any) => v.status === true);
          setAllVacancies(activeAllVacs);
          setUrgentVacancies(activeAllVacs.filter((v: any) => v.urgent === true));
        }

        const { data: tutorAppsData } = await supabase.from('vacancy_applications').select(`id, status, created_at, vacancy_id, vacancies(id, subject, location)`).eq('user_id', uid).order('created_at', { ascending: false });
        if (tutorAppsData) setTutorApplications(tutorAppsData);

        if (currentTutorId) {
          const { data: requestsData } = await supabase.from('student_requests').select('*').eq('tutor_id', currentTutorId).order('created_at', { ascending: false });
          if (requestsData) setStudentRequests(requestsData);
        }

      } catch (err) {
        console.error("Tuition Data Fetch Error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTuitionData();
  }, [supabase, router]);

  // Actions
  const handleUpdateVacancy = async (updatedVacancy: Vacancy) => {
    const { error } = await supabase.from('vacancies').update({
      subject: updatedVacancy.subject, location: updatedVacancy.location, salary_range: updatedVacancy.salary_range, class_time: updatedVacancy.class_time, class_level: updatedVacancy.class_level
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
      for (const key in updatedData) { if (updatedData[key as keyof Tutor] === '') dataToSave[key] = null; }
      if (dataToSave.hour_rate !== null && dataToSave.hour_rate !== undefined) dataToSave.hour_rate = Number(dataToSave.hour_rate);
      if (dataToSave.experience !== null && dataToSave.experience !== undefined) dataToSave.experience = Number(dataToSave.experience);
      
      const { data: existing } = await supabase.from('tutors').select('id').eq('user_id', userId).maybeSingle();
      let error;
      if (existing?.id) { const res = await supabase.from('tutors').update(dataToSave).eq('id', existing.id); error = res.error; }
      else { const res = await supabase.from('tutors').insert([dataToSave]); error = res.error; }
      
      if (!error) {
        const { data: refreshed } = await supabase.from('tutors').select('*').eq('user_id', userId).single();
        if (refreshed) setTutorProfile(refreshed);
        setHasTutorProfile(true);
        setDashboardMode('tutor');
        return true;
      }
      return false;
    } catch (e) { return false; }
  };

  const STUDENT_TABS = [
    { id: 'Dashboard', icon: LayoutDashboard, label: 'Overview' },
    { id: 'Posted Vacancies', icon: FileText, label: 'My Postings' },
    { id: 'My Requests', icon: Users, label: 'Tutor Requests' },
  ];

  const TUTOR_TABS = [
    { id: 'Dashboard', icon: LayoutDashboard, label: 'Overview' },
    { id: 'Available Vacancies', icon: Briefcase, label: 'Job Board' },
    { id: 'Student Requests', icon: Users, label: 'Student Requests' },
    { id: 'My Info', icon: User, label: 'My Profile' },
  ];

  const activeTabsList = dashboardMode === 'student' ? STUDENT_TABS : TUTOR_TABS;
  const firstName = userName.split(' ')[0];

  return (
    <div className="w-full relative pb-20">
      
      {/* 1. Dynamic Top Action Bar (Auto-Locked views) */}
      <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight hidden sm:block">
            {hasTutorProfile ? 'Tutor Dashboard' : 'Student Hub'}
          </h1>
        </div>
        
        {/* Only show "Become a Tutor" to users who strictly don't have a profile yet */}
        {!hasTutorProfile && dashboardMode === 'student' && (
          <button
            onClick={() => { setDashboardMode('tutor'); setActiveTab('Dashboard'); }}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-6 py-3 rounded-xl font-semibold text-sm transition-all shadow-md shadow-violet-600/20"
          >
            <Briefcase size={16} /> Become a Tutor
          </button>
        )}
      </div>

      {/* 2. Wrapped Navigation Tabs (No Horizontal Scroll) */}
      <div className="mb-8 pb-2">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full">
          {activeTabsList.map((tab) => {
            const isStudentMode = dashboardMode === 'student';
            const isActive = activeTab === tab.id;
            const themeColors = isStudentMode 
              ? { textActive: 'text-emerald-800', bgActive: 'bg-emerald-50 border-emerald-200', icon: 'text-emerald-600' } 
              : { textActive: 'text-violet-800', bgActive: 'bg-violet-50 border-violet-200', icon: 'text-violet-600' };

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center gap-2.5 px-5 py-2.5 sm:px-6 sm:py-3 rounded-xl text-xs sm:text-sm transition-all whitespace-nowrap overflow-hidden group ${
                  isActive ? `font-bold ${themeColors.textActive}` : 'font-medium text-slate-600 hover:text-slate-900 bg-white border border-slate-200 shadow-sm hover:shadow-md'
                }`}
              >
                {isActive && (
                  <motion.div 
                    layoutId={`tab-indicator-${dashboardMode}`} 
                    className={`absolute inset-0 ${themeColors.bgActive} border rounded-xl z-0`} 
                    transition={{ type: "spring", stiffness: 400, damping: 30 }} 
                  />
                )}
                <tab.icon size={16} className={`relative z-10 ${isActive ? themeColors.icon : 'text-slate-400 group-hover:text-slate-600 transition-colors'}`} />
                <span className="relative z-10">{tab.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* 3. Main Content Area */}
      {loading ? <SkeletonLoader /> : (
        <AnimatePresence mode="wait">
          <motion.div
            key={`${activeTab}-${dashboardMode}`}
            initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="w-full"
          >
            {/* LOCKED TUTOR GATEWAY (If they click Become a Tutor but have no profile) */}
            {dashboardMode === 'tutor' && !hasTutorProfile && (
              <div className={`bg-white border border-slate-200/60 rounded-3xl p-8 sm:p-12 lg:p-16 text-center flex flex-col items-center justify-center min-h-[50vh] shadow-sm relative overflow-hidden`}>
                <div className="absolute top-0 right-0 p-10 sm:p-20 opacity-[0.02]"><Lock size={200} className="sm:w-[300px] sm:h-[300px]"/></div>
                <div className={`w-20 h-20 sm:w-24 sm:h-24 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mb-6 border border-slate-100 shadow-inner`}><Lock size={32} /></div>
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3 tracking-tight relative z-10">Tutor Profile Required</h2>
                <p className="text-sm sm:text-base text-slate-500 font-medium max-w-sm mx-auto mb-8 relative z-10">You need to set up an approved tutor profile to access the job board and receive student requests.</p>
                <div className="flex flex-col sm:flex-row items-center gap-4 relative z-10">
                   <button onClick={() => window.location.href = '/become-a-tutor'} className={`bg-violet-600 hover:bg-violet-700 text-white px-8 py-3.5 rounded-xl font-semibold shadow-lg shadow-violet-600/20 hover:shadow-violet-600/40 hover:-translate-y-0.5 transition-all tracking-wide text-sm sm:text-base w-full sm:w-auto`}>Set up Tutor Profile</button>
                   <button onClick={() => { setDashboardMode('student'); setActiveTab('Dashboard'); }} className={`bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 px-8 py-3.5 rounded-xl font-semibold transition-all tracking-wide text-sm sm:text-base w-full sm:w-auto`}>Back to Student View</button>
                </div>
              </div>
            )}

            {/* STUDENT VIEWS */}
            {dashboardMode === 'student' && !hasTutorProfile && activeTab === 'Dashboard' && (
              <StudentDashboardView 
                count={applicantCount} course={latestCourse} verifiedTutors={verifiedTutors} 
                onShowApplications={() => { setAppFilterId(null); setIsApplicationsOpen(true); }} 
                globalRecordings={globalRecordings} router={router} firstName={firstName}
              />
            )}

            {dashboardMode === 'student' && !hasTutorProfile && activeTab === 'Posted Vacancies' && (
              <VacanciesView 
                vacancies={vacancies} onUpdate={handleUpdateVacancy} onDelete={handleDeleteVacancy} 
                onViewApplicants={(id: number) => { setAppFilterId(id); setIsApplicationsOpen(true); }} firstName={firstName}
              />
            )}

            {dashboardMode === 'student' && !hasTutorProfile && activeTab === 'My Requests' && (
              <StudentMyRequestsView 
                requests={studentMyRequests} firstName={firstName}
                onCancel={async (id: number) => {
                  setStudentMyRequests(prev => prev.filter(req => req.id !== id));
                  await supabase.from('student_requests').delete().eq('id', id);
                }} 
                onChatAdmin={() => router.push('/dashboard?tab=chat')} 
              />
            )}

            {/* TUTOR VIEWS */}
            {dashboardMode === 'tutor' && hasTutorProfile && activeTab === 'Dashboard' && (
              <TutorDashboardView 
                profile={tutorProfile} applicationsCount={tutorApplications.length} requestsCount={studentRequests.length} 
                course={latestCourse} urgentVacancies={urgentVacancies} firstName={firstName}
                onShowApplications={() => setIsApplicationsOpen(true)} 
                onShowRequests={() => setActiveTab('Student Requests')} 
                onFixProfile={() => setActiveTab('My Info')} 
                onShowJobBoard={() => setActiveTab('Available Vacancies')}
                globalRecordings={globalRecordings} router={router} 
              />
            )}

            {dashboardMode === 'tutor' && hasTutorProfile && activeTab === 'Available Vacancies' && (
              <AvailableVacanciesView vacancies={allVacancies} firstName={firstName} />
            )}

            {dashboardMode === 'tutor' && hasTutorProfile && activeTab === 'Student Requests' && (
              <StudentRequestsView 
                requests={studentRequests} firstName={firstName}
                onUpdateStatus={async (id: number, status: string) => {
                  setStudentRequests(prev => prev.map(req => req.id === id ? { ...req, status } : req));
                  await supabase.from('student_requests').update({ status }).eq('id', id);
                }} 
                onChatAdmin={() => router.push('/dashboard?tab=chat')} 
              />
            )}

            {dashboardMode === 'tutor' && hasTutorProfile && activeTab === 'My Info' && (
              <MyInfoView profile={tutorProfile} onSave={handleUpdateTutorInfo} firstName={firstName} />
            )}

          </motion.div>
        </AnimatePresence>
      )}

      {/* Global Page Modals */}
      <AnimatePresence>
        {isApplicationsOpen && dashboardMode === 'student' && (
          <ApplicationsModal
            applications={appFilterId ? appliedTutors.filter(a => a.vacancy_id === appFilterId) : appliedTutors}
            onClose={() => setIsApplicationsOpen(false)}
            onReject={async (id: number) => {
              setAppliedTutors(prev => prev.filter(app => app.id !== id));
              setApplicantCount(prev => Math.max(0, prev - 1));
              await supabase.from('vacancy_applications').delete().eq('id', id);
            }}
            onUpdateStatus={async (id: number, status: string) => {
              setAppliedTutors(prev => prev.map(app => app.id === id ? { ...app, status } : app));
              await supabase.from('vacancy_applications').update({ status }).eq('id', id);
            }}
          />
        )}
        {isApplicationsOpen && dashboardMode === 'tutor' && hasTutorProfile && (
          <TutorApplicationsModal applications={tutorApplications} onClose={() => setIsApplicationsOpen(false)} />
        )}
      </AnimatePresence>

      <style>{`
        @keyframes marquee { 0% { transform: translateX(0%); } 100% { transform: translateX(-50%); } } 
        .animate-marquee { animation: marquee 35s linear infinite; } 
        .animate-marquee:hover { animation-play-state: paused; } 
      `}</style>
    </div>
  );
}


// -------------------------------------------------------------
// STUDENT VIEWS (Refined & Polished)
// -------------------------------------------------------------

function StudentDashboardView({ count, course, verifiedTutors, onShowApplications, globalRecordings, router, firstName }: any) {
  return (
    <div className="space-y-8 w-full pb-10">
      
      {/* Premium Personalization Header */}
      <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/60 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
        <div className="relative z-10">
          <p className="text-sm font-semibold text-slate-500 mb-1">Overview</p>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-slate-900">Welcome back, {firstName} 👋</h2>
          <p className="text-slate-600 mt-2 font-medium max-w-md">Here is a snapshot of your tuition requests and recommended learning materials.</p>
        </div>
        {count > 0 && (
          <motion.button whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.98 }} onClick={onShowApplications} className={`relative z-10 w-full md:w-auto flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3.5 rounded-xl font-semibold text-sm transition-all shadow-lg shadow-emerald-600/20`}>
            <Users size={18} className="text-emerald-100"/> View {count} Applicant{count !== 1 ? 's' : ''}
          </motion.button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
        {course && (
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center px-2">
              <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <Sparkles size={14} className="text-emerald-500" /> Featured Live Course
              </h3>
              <Link href="/onlinecourse" className="text-[11px] font-bold text-emerald-600 uppercase tracking-wide hover:text-emerald-800 flex items-center gap-1 transition-colors">
                See All <ArrowRight size={14} />
              </Link>
            </div>
            <TuitionCourseCard course={course} theme="emerald" />
          </div>
        )}
        <div className="flex flex-col gap-6">
          {verifiedTutors?.length > 0 && (
            <div className="bg-gradient-to-br from-white to-slate-50 border border-slate-200/60 rounded-3xl p-6 sm:p-8 flex flex-col gap-5 shadow-sm hover:shadow-md transition-shadow">
              <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2"><Sparkles size={14} className="text-emerald-500" /> Find Tutors</h3>
              <p className="text-sm font-medium text-slate-600">Explore profiles of our top-rated, background-checked educators.</p>
              <Link href="/tutors" className="w-full text-center bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 hover:border-emerald-200 border border-slate-200 font-semibold py-3.5 rounded-xl transition-all text-sm shadow-sm hover:shadow">
                Browse {verifiedTutors.length}+ Premium Tutors
              </Link>
            </div>
          )}
          {globalRecordings?.length > 0 && <RecommendedRecordingsBox recordings={globalRecordings} router={router} />}
        </div>
      </div>

      {verifiedTutors?.length > 0 && <TutorsMarquee tutors={verifiedTutors} theme="emerald" />}
    </div>
  );
}

function VacanciesView({ vacancies, onUpdate, onDelete, onViewApplicants, firstName }: any) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editData, setEditData] = useState<Partial<Vacancy>>({});

  const startEdit = (v: Vacancy) => { setEditingId(v.id); setEditData(v); };
  const handleSave = async () => { if (editingId) { await onUpdate({ ...editData, id: editingId } as Vacancy); setEditingId(null); } };

  return (
    <div className="space-y-6 sm:space-y-8 w-full pb-10">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-2">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">My Postings</h2>
          <p className="text-sm font-medium text-slate-500 mt-1">Manage your active tutor requirements.</p>
        </div>
        <Link href="/post-tuition" className="w-full sm:w-auto flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-semibold text-sm transition-all shadow-md shadow-emerald-600/20 hover:shadow-lg hover:-translate-y-0.5">
          <Plus size={18} /> Post Vacancy
        </Link>
      </div>

      <motion.div variants={staggerContainer} initial="hidden" animate="show" className="space-y-5">
        {vacancies.length === 0 ? (
          <motion.div variants={fadeUpItem} className="flex flex-col items-center justify-center bg-white rounded-3xl py-20 px-6 border border-slate-200/60 shadow-sm text-center">
            <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-5">
              <FileText size={32} />
            </div>
            <h3 className="font-bold text-lg text-slate-800 mb-2">No active postings</h3>
            <p className="font-medium text-slate-500 text-sm max-w-sm mb-6">Create a vacancy to broadcast your requirements to our network of verified tutors.</p>
            <Link href="/post-tuition" className="text-emerald-700 font-semibold text-sm bg-emerald-50 hover:bg-emerald-100 px-6 py-3 rounded-xl transition-colors">Create your first posting</Link>
          </motion.div>
        ) : vacancies.map((v: Vacancy) => (
          <motion.div variants={fadeUpItem} key={v.id} className="bg-white border border-slate-200/60 rounded-3xl p-6 sm:p-8 flex flex-col gap-5 shadow-sm hover:shadow-lg hover:border-emerald-200 hover:-translate-y-1 transition-all duration-300 relative group overflow-hidden">
            {editingId === v.id ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 relative z-10 bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
                {[
                  { key: 'subject', label: 'Subject' }, { key: 'location', label: 'Location' },
                  { key: 'salary_range', label: 'Salary' }, { key: 'class_time', label: 'Class Time' },
                  { key: 'class_level', label: 'Class Level' }
                ].map(({ key, label }) => (
                  <div key={key} className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{label}</label>
                    <input value={(editData as any)[key] || ''} onChange={e => setEditData(p => ({ ...p, [key]: e.target.value }))}
                      className={`border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white shadow-sm transition-all`}
                    />
                  </div>
                ))}
                <div className="col-span-1 sm:col-span-2 flex flex-col sm:flex-row gap-3 mt-2">
                  <button onClick={handleSave} className="w-full sm:w-auto flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-6 py-2.5 rounded-xl font-semibold text-sm transition-colors shadow-sm"><Save size={16} /> Save Changes</button>
                  <button onClick={() => setEditingId(null)} className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-6 py-2.5 rounded-xl font-semibold text-sm transition-colors shadow-sm"><X size={16} /> Cancel</button>
                </div>
              </div>
            ) : (
              <>
                <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity z-50 rounded-l-3xl"></div>
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="font-bold text-xl sm:text-2xl text-slate-900 tracking-tight">{v.subject}</h3>
                      {v.urgent && <span className="bg-red-50 text-red-600 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-lg flex items-center gap-1 border border-red-100 shadow-sm"><Flame size={12} />Urgent</span>}
                    </div>
                    <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm text-slate-600 font-medium">
                      <span className="flex items-center gap-2"><MapPin size={16} className="text-slate-400" />{v.location}</span>
                      <span className="flex items-center gap-2"><Clock size={16} className="text-slate-400" />{v.class_time}</span>
                      <span className="flex items-center gap-2"><DollarSign size={16} className="text-slate-400" />{v.salary_range}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0 mt-4 sm:mt-0 w-full sm:w-auto">
                    <button onClick={() => onViewApplicants(v.id)} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl font-bold text-xs tracking-wide uppercase hover:bg-emerald-100 transition-colors shadow-sm">
                      <Users size={16} /> {v.applicant_count || 0} Applicants
                    </button>
                    <button onClick={() => startEdit(v)} className="p-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl transition-colors shadow-sm" title="Edit"><Edit2 size={16} /></button>
                    <button onClick={() => onDelete(v.id)} className="p-2.5 bg-white border border-slate-200 hover:bg-red-50 text-slate-600 hover:text-red-600 rounded-xl transition-colors shadow-sm" title="Delete"><Trash2 size={16} /></button>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}

function StudentMyRequestsView({ requests, onCancel, onChatAdmin, firstName }: any) {
  return (
    <div className="space-y-6 sm:space-y-8 w-full pb-10">
      <div className="px-2">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">Tutor Requests</h2>
        <p className="text-sm font-medium text-slate-500 mt-1">Track direct requests you've sent to specific tutors.</p>
      </div>

      <motion.div variants={staggerContainer} initial="hidden" animate="show" className="space-y-5">
        {requests.length === 0 ? (
          <motion.div variants={fadeUpItem} className="flex flex-col items-center justify-center bg-white rounded-3xl py-20 px-6 border border-slate-200/60 shadow-sm text-center">
            <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-5">
              <Users size={32} />
            </div>
            <h3 className="font-bold text-lg text-slate-800 mb-2">No requests sent</h3>
            <p className="font-medium text-slate-500 text-sm max-w-sm mb-6">Browse our premium tutors and send them a direct request for tuition.</p>
            <Link href="/tutors" className="text-emerald-700 font-semibold text-sm bg-emerald-50 hover:bg-emerald-100 px-6 py-3 rounded-xl transition-colors flex items-center gap-2">Browse Tutors <ArrowRight size={16} /></Link>
          </motion.div>
        ) : requests.map((req: any) => (
          <motion.div variants={fadeUpItem} key={req.id} className="bg-white border border-slate-200/60 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row justify-between gap-5 shadow-sm hover:shadow-lg hover:border-emerald-200 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity z-50 rounded-l-3xl"></div>
            <div>
              <p className="font-bold text-slate-900 text-lg sm:text-xl tracking-tight mb-3">{req.tutors?.name || 'Tutor'}</p>
              <div className="flex flex-wrap gap-x-5 gap-y-3 text-sm text-slate-600 font-medium">
                <span className="flex items-center gap-2"><GraduationCap size={16} className="text-slate-400" />{req.grade}</span>
                {req.preferred_mode && <span className="flex items-center gap-2"><Monitor size={16} className="text-slate-400" />{req.preferred_mode}</span>}
                {req.tutors?.location && <span className="flex items-center gap-2"><MapPin size={16} className="text-slate-400" />{req.tutors.location}</span>}
              </div>
              {req.message && <p className="text-sm text-slate-600 mt-4 italic bg-slate-50/80 rounded-xl p-4 border border-slate-100">"{req.message}"</p>}
              <div className="mt-4"><StatusBadge status={req.status} /></div>
            </div>
            <div className="flex flex-row sm:flex-col gap-2 shrink-0 mt-4 sm:mt-0 w-full sm:w-auto">
              <button onClick={onChatAdmin} className="flex-1 sm:flex-none px-5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-[11px] font-bold uppercase tracking-wider rounded-xl transition-colors shadow-sm flex items-center justify-center sm:justify-start gap-2"><MessageCircle size={16} />Support</button>
              <button onClick={() => onCancel(req.id)} className="flex-1 sm:flex-none px-5 py-2.5 bg-white hover:bg-red-50 text-slate-700 hover:text-red-700 border border-slate-200 text-[11px] font-bold uppercase tracking-wider rounded-xl transition-colors shadow-sm">Cancel</button>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}

// -------------------------------------------------------------
// TUTOR VIEWS (Refined & Polished)
// -------------------------------------------------------------

function TutorDashboardView({ profile, applicationsCount, requestsCount, course, urgentVacancies, onShowApplications, onShowRequests, onFixProfile, onShowJobBoard, globalRecordings, router, firstName }: any) {
  const completeness = profile ? [profile.bio, profile.education, profile.experience, profile.contact_num, profile.location, profile.hour_rate, profile.mode_of_teaching].filter(Boolean).length : 0;
  const pct = Math.round((completeness / 7) * 100);

  return (
    <div className="space-y-8 w-full pb-10">
      
      {/* Premium Personalization Header */}
      <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/60 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
        <div className="relative z-10">
          <p className="text-sm font-semibold text-slate-500 mb-1">Tutor Overview</p>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-slate-900">Welcome back, {firstName} 👋</h2>
          <p className="text-slate-600 mt-2 font-medium max-w-md">Manage your job applications, profile visibility, and incoming student requests.</p>
        </div>
      </div>

      {pct < 100 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-orange-50/80 border border-orange-200/60 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center gap-5 shadow-sm backdrop-blur-sm">
          <div className="hidden sm:flex w-12 h-12 bg-orange-100 rounded-full items-center justify-center shrink-0 shadow-inner">
            <AlertCircle className="w-6 h-6 text-orange-600" />
          </div>
          <div className="flex-1 w-full">
            <p className="font-bold text-orange-900 text-base">Your profile is {pct}% complete.</p>
            <p className="text-sm text-orange-800/80 font-medium mt-1">Complete your profile to rank higher and attract more students.</p>
            <div className="w-full bg-orange-200/50 rounded-full h-2 mt-4 overflow-hidden"><motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} className="bg-orange-500 h-2 rounded-full transition-all duration-1000" /></div>
          </div>
          <button onClick={onFixProfile} className="shrink-0 bg-white border border-orange-200 hover:border-orange-300 text-orange-800 hover:bg-orange-100 text-sm font-bold px-6 py-3 rounded-xl transition-all shadow-sm hover:shadow mt-4 sm:mt-0 w-full sm:w-auto">Complete Profile</button>
        </motion.div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 gap-5 sm:gap-6">
        <motion.div whileHover={{ scale: 1.02 }} className="cursor-pointer" onClick={onShowApplications}><StatCard label="My Applications" value={applicationsCount} icon={<Briefcase size={24} />} theme="violet" /></motion.div>
        <motion.div whileHover={{ scale: 1.02 }} className="cursor-pointer" onClick={onShowRequests}><StatCard label="Student Requests" value={requestsCount} icon={<Users size={24} />} theme="violet" /></motion.div>
        <div className="col-span-2 md:col-span-1">
          <motion.div whileHover={{ scale: 1.02 }} className="cursor-pointer" onClick={onShowJobBoard}><StatCard label="Urgent Vacancies" value={urgentVacancies?.length || 0} icon={<Flame size={24} />} theme="orange" /></motion.div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-4">
            <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} onClick={onShowApplications} className="w-full bg-slate-900 hover:bg-slate-800 text-white py-4 rounded-2xl font-semibold transition-colors flex items-center justify-center gap-3 shadow-md text-sm sm:text-base">
              <Briefcase size={20} className="text-slate-300" /> View My Applications
            </motion.button>
            <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} onClick={onShowRequests} className="w-full bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 py-4 rounded-2xl font-semibold transition-colors flex items-center justify-center gap-3 shadow-sm text-sm sm:text-base">
              <Users size={20} className="text-slate-400" /> View Student Requests
            </motion.button>
          </div>
          {globalRecordings?.length > 0 && <RecommendedRecordingsBox recordings={globalRecordings} router={router} />}
        </div>

        {course && (
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center px-2">
              <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <Sparkles size={14} className="text-violet-500" /> Featured Course for Tutors
              </h3>
              <Link href="/onlinecourse" className="text-[11px] font-bold text-violet-600 uppercase tracking-wide hover:text-violet-800 flex items-center gap-1 transition-colors">
                See All <ArrowRight size={14} />
              </Link>
            </div>
            <TuitionCourseCard course={course} theme="violet" />
          </div>
        )}
      </div>

      {urgentVacancies?.length > 0 && (
        <div className="bg-gradient-to-br from-white to-slate-50 border border-slate-200/60 rounded-3xl p-6 sm:p-8 shadow-sm">
          <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-5 flex items-center gap-2"><Flame size={16} className="text-red-500" /> Urgent Vacancies</h3>
          <div className="space-y-4">
            {urgentVacancies.slice(0, 3).map((v: Vacancy) => (
              <motion.div whileHover={{ scale: 1.01, x: 4 }} key={v.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white border border-slate-100 p-5 rounded-2xl shadow-sm hover:shadow-md hover:border-red-200 transition-all group">
                <div>
                  <p className="font-bold text-slate-900 text-lg group-hover:text-red-700 transition-colors">{v.subject}</p>
                  <p className="text-sm text-slate-500 font-medium mt-1 flex items-center gap-2"><MapPin size={14} className="text-slate-400" />{v.location} <span className="text-slate-300 mx-1">•</span> {v.class_level}</p>
                </div>
                <Link href={`/vacancies/${v.id}`} className="w-full sm:w-auto text-[11px] font-bold uppercase tracking-wider text-violet-700 hover:text-violet-800 flex items-center justify-center gap-1 bg-violet-50 hover:bg-violet-100 px-5 py-2.5 rounded-xl transition-colors">Apply <ArrowRight size={14} /></Link>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function AvailableVacanciesView({ vacancies }: any) {
  const [search, setSearch] = useState('');
  const filtered = vacancies.filter((v: Vacancy) => v.subject.toLowerCase().includes(search.toLowerCase()) || v.location.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6 sm:space-y-8 w-full pb-10">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5 px-2">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">Job Board</h2>
          <p className="text-sm font-medium text-slate-500 mt-1">Find and apply for tuition opportunities.</p>
        </div>
        <div className="relative w-full md:w-80">
          <SearchX size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search subjects or locations…"
            className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 shadow-sm transition-all"
          />
        </div>
      </div>

      <motion.div variants={staggerContainer} initial="hidden" animate="show" className="space-y-5">
        {filtered.length === 0 ? (
          <motion.div variants={fadeUpItem} className="flex flex-col items-center justify-center bg-white rounded-3xl py-20 px-6 border border-slate-200/60 shadow-sm text-center">
            <div className="w-20 h-20 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mb-5 border border-slate-100">
              <SearchX size={32} />
            </div>
            <h3 className="font-bold text-lg text-slate-800 mb-2">No vacancies found</h3>
            <p className="font-medium text-slate-500 text-sm max-w-sm">Try adjusting your search criteria or check back later for new opportunities.</p>
          </motion.div>
        ) : filtered.map((v: Vacancy) => (
          <motion.div variants={fadeUpItem} key={v.id} className="bg-white border border-slate-200/60 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row justify-between gap-5 hover:shadow-lg hover:border-violet-200 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-violet-500 opacity-0 group-hover:opacity-100 transition-opacity z-50 rounded-l-3xl"></div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <h3 className="font-bold text-xl sm:text-2xl text-slate-900 tracking-tight group-hover:text-violet-700 transition-colors">{v.subject}</h3>
                {v.urgent && <span className="bg-red-50 text-red-600 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-lg flex items-center gap-1 border border-red-100 shadow-sm"><Flame size={12} />Urgent</span>}
              </div>
              <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm text-slate-600 font-medium">
                <span className="flex items-center gap-2"><MapPin size={16} className="text-slate-400" />{v.location}</span>
                <span className="flex items-center gap-2"><GraduationCap size={16} className="text-slate-400" />{v.class_level}</span>
                <span className="flex items-center gap-2"><Clock size={16} className="text-slate-400" />{v.class_time}</span>
                <span className="flex items-center gap-2"><DollarSign size={16} className="text-slate-400" />{v.salary_range}</span>
              </div>
              {v.description && <p className="text-sm text-slate-500 mt-4 line-clamp-2 leading-relaxed font-normal">"{v.description}"</p>}
            </div>
            <div className="shrink-0 flex items-center mt-4 sm:mt-0 w-full sm:w-auto">
              <Link href={`/vacancies/${v.id}`} className="w-full flex items-center justify-center gap-2 bg-white border border-slate-200 hover:bg-violet-50 hover:text-violet-700 hover:border-violet-200 text-slate-700 px-6 py-3 rounded-xl font-semibold text-sm transition-all shadow-sm hover:shadow">
                View Details <ArrowRight size={16} />
              </Link>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}

function StudentRequestsView({ requests, onUpdateStatus, onChatAdmin }: any) {
  return (
    <div className="space-y-6 sm:space-y-8 w-full pb-10">
      <div className="px-2">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">Incoming Requests</h2>
        <p className="text-sm font-medium text-slate-500 mt-1">Students who have explicitly requested you for tuition.</p>
      </div>

      <motion.div variants={staggerContainer} initial="hidden" animate="show" className="space-y-5">
        {requests.length === 0 ? (
          <motion.div variants={fadeUpItem} className="flex flex-col items-center justify-center bg-white rounded-3xl py-20 px-6 border border-slate-200/60 shadow-sm text-center">
            <div className="w-20 h-20 bg-violet-50 text-violet-500 rounded-full flex items-center justify-center mb-5 border border-violet-100">
              <Users size={32} />
            </div>
            <h3 className="font-bold text-lg text-slate-800 mb-2">No student requests yet</h3>
            <p className="font-medium text-slate-500 text-sm max-w-sm">Make sure your profile is 100% complete and verified to attract more direct requests.</p>
          </motion.div>
        ) : requests.map((req: any) => (
          <motion.div variants={fadeUpItem} key={req.id} className="bg-white border border-slate-200/60 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row justify-between gap-5 relative overflow-hidden group hover:border-violet-200 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-violet-500 opacity-0 group-hover:opacity-100 transition-opacity z-50 rounded-l-3xl"></div>
            <div>
              <p className="font-bold text-slate-900 text-lg sm:text-xl tracking-tight mb-3">Student Request</p>
              <div className="flex flex-wrap gap-x-5 gap-y-3 text-sm text-slate-600 font-medium">
                <span className="flex items-center gap-2"><GraduationCap size={16} className="text-slate-400" />{req.grade}</span>
                {req.preferred_mode && <span className="flex items-center gap-2"><Monitor size={16} className="text-slate-400" />{req.preferred_mode}</span>}
              </div>
              {req.message && <p className="text-sm text-slate-600 mt-4 italic bg-slate-50/80 rounded-xl p-4 border border-slate-100 shadow-sm">"{req.message}"</p>}
              <div className="mt-4"><StatusBadge status={req.status} /></div>
            </div>
            <div className="flex flex-row sm:flex-col gap-2 shrink-0 mt-4 sm:mt-0 w-full sm:w-auto">
              {req.status !== 'accepted' && (
                <button onClick={() => onUpdateStatus(req.id, 'accepted')} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold uppercase tracking-wider rounded-xl transition-colors shadow-sm"><Check size={16} />Accept</button>
              )}
              {req.status !== 'rejected' && (
                <button onClick={() => onUpdateStatus(req.id, 'rejected')} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 text-[11px] font-bold uppercase tracking-wider rounded-xl transition-colors shadow-sm"><X size={16} />Decline</button>
              )}
              <button onClick={onChatAdmin} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-white hover:bg-violet-50 hover:text-violet-700 border border-slate-200 text-slate-600 text-[11px] font-bold uppercase tracking-wider rounded-xl transition-colors shadow-sm"><MessageCircle size={16} />Support</button>
            </div>
          </motion.div>
        ))}
      </motion.div>
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
    { key: 'name', label: 'Full Name', type: 'text', placeholder: 'John Doe' },
    { key: 'subject', label: 'Subjects (comma separated)', type: 'text', placeholder: 'Math, Physics, English' },
    { key: 'location', label: 'Location', type: 'text', placeholder: 'Kathmandu, Nepal' },
    { key: 'experience', label: 'Experience (Years)', type: 'number', placeholder: '3' },
    { key: 'education', label: 'Highest Education', type: 'text', placeholder: 'BSc Computer Science' },
    { key: 'hour_rate', label: 'Hourly Rate (Rs.)', type: 'number', placeholder: '500' },
    { key: 'contact_num', label: 'Contact Number', type: 'text', placeholder: '+977 98...' },
    { key: 'mode_of_teaching', label: 'Mode of Teaching', type: 'text', placeholder: 'Online / Physical' },
    { key: 'cv_url', label: 'CV Link (Google Drive)', type: 'text', placeholder: 'https://...' },
    { key: 'id_url', label: 'ID Card Link', type: 'text', placeholder: 'https://...' },
  ];

  return (
    <div className="space-y-6 sm:space-y-8 w-full pb-10">
      <div className="px-2">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">My Profile Info</h2>
        <p className="text-sm font-medium text-slate-500 mt-1">Keep your profile updated to attract the right students.</p>
      </div>
      
      <div className="bg-white border border-slate-200/60 rounded-3xl p-6 sm:p-8 md:p-10 shadow-sm space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {fields.map(({ key, label, type, placeholder }) => (
            <div key={key} className="flex flex-col gap-2">
              <label className="text-[11px] font-semibold text-slate-600 uppercase tracking-widest pl-1">{label}</label>
              {key === 'subject' ? (
                <input
                  type="text"
                  value={form.subject ? (Array.isArray(form.subject) ? form.subject.join(', ') : form.subject) : ''}
                  onChange={e => setForm(p => ({ ...p, subject: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-3.5 text-sm font-medium text-slate-800 outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 focus:bg-white shadow-sm transition-all"
                  placeholder={placeholder}
                />
              ) : (
                <input
                  type={type}
                  value={(form as any)[key] || ''}
                  onChange={e => setForm(p => ({ ...p, [key]: type === 'number' ? (e.target.value ? Number(e.target.value) : '') : e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-3.5 text-sm font-medium text-slate-800 outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 focus:bg-white shadow-sm transition-all"
                  placeholder={placeholder}
                />
              )}
            </div>
          ))}
        </div>
        
        <div className="flex flex-col gap-2">
          <label className="text-[11px] font-semibold text-slate-600 uppercase tracking-widest pl-1">Bio (About You)</label>
          <textarea
            value={form.bio || ''} onChange={e => setForm(p => ({ ...p, bio: e.target.value }))} rows={5}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-4 text-sm font-medium text-slate-800 outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 focus:bg-white shadow-sm transition-all resize-none leading-relaxed"
            placeholder="Tell students about your teaching methodology, achievements, and why they should choose you..."
          />
        </div>

        <div className="flex items-center gap-4 bg-slate-50/50 p-5 border border-slate-200 shadow-sm rounded-2xl cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => setForm(p => ({ ...p, availability: !(form.availability || false) }))}>
          <div className={`w-6 h-6 rounded-md flex items-center justify-center border transition-colors ${form.availability ? 'bg-violet-600 border-violet-600 text-white' : 'bg-white border-slate-300'}`}>
            {form.availability && <Check size={14} />}
          </div>
          <span className="font-semibold text-slate-800 text-sm sm:text-base select-none">Currently Available to accept new students</span>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 pt-8 border-t border-slate-200/60">
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleSave} disabled={saving} className="w-full sm:w-auto flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white px-8 py-3.5 rounded-xl font-semibold text-sm transition-all shadow-md shadow-violet-600/20">
            {saving ? <RotateCcw size={18} className="animate-spin" /> : <Save size={18} />}
            {saving ? 'Saving Changes…' : 'Save Profile Settings'}
          </motion.button>
          <AnimatePresence>
            {saved && (
              <motion.span initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="w-full sm:w-auto flex items-center justify-center gap-2 text-sm font-semibold bg-emerald-50 text-emerald-700 px-5 py-3 rounded-xl border border-emerald-200">
                <CheckCircle size={16} className="text-emerald-600" /> Saved successfully
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// LOCAL MODALS & CARDS (Refined)
// -------------------------------------------------------------

function ApplicationsModal({ applications, onClose, onReject, onUpdateStatus }: any) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/30 backdrop-blur-xl p-4 overflow-y-auto">
      <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} transition={{ type: "spring", stiffness: 300, damping: 30 }} className="bg-white rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl border border-slate-200 flex flex-col max-h-[85vh]">
        <div className="p-6 md:p-8 border-b border-slate-100 flex justify-between items-center bg-white shrink-0">
          <div>
            <h3 className="text-2xl font-bold text-slate-900 tracking-tight">Applicants</h3>
            <p className="text-sm text-slate-500 font-medium mt-1">{applications.length} tutor(s) applied to your vacancies.</p>
          </div>
          <button onClick={onClose} className="p-2.5 bg-slate-50 rounded-full border border-slate-200 hover:bg-slate-100 transition-colors text-slate-500"><X size={18} /></button>
        </div>
        <div className="flex-grow overflow-y-auto custom-scrollbar p-6 md:p-8 space-y-4 bg-slate-50/50">
          {applications.length === 0 ? (
            <div className="text-center py-16"><p className="text-slate-500 font-medium">No applications found.</p></div>
          ) : applications.map((app: any) => {
            const rawTutorName = app.tutors?.name || app.applicant_name || 'Applicant';
            return (
              <div key={app.id} className="bg-white border border-slate-200/60 rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row justify-between gap-5 shadow-sm hover:shadow-md transition-shadow">
                <div>
                  <Link href={`/tutors/${app.tutors?.id}-${rawTutorName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`} className="font-bold text-slate-900 text-lg hover:text-emerald-700 transition-colors">{rawTutorName}</Link>
                  <p className="text-sm text-slate-500 font-medium mt-1 mb-3">{app.vacancies?.subject} — {app.vacancies?.location}</p>
                  <StatusBadge status={app.status} />
                </div>
                <div className="flex gap-2 items-start shrink-0">
                  {app.status !== 'accepted' && (
                    <button onClick={() => onUpdateStatus(app.id, 'accepted')} className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold uppercase tracking-wider rounded-xl transition-colors shadow-sm">Accept</button>
                  )}
                  <button onClick={() => onReject(app.id)} className="px-5 py-2.5 bg-white hover:bg-red-50 text-slate-600 hover:text-red-700 border border-slate-200 text-[11px] font-bold uppercase tracking-wider rounded-xl transition-colors shadow-sm">Remove</button>
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
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/30 backdrop-blur-xl p-4 overflow-y-auto">
      <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} transition={{ type: "spring", stiffness: 300, damping: 30 }} className="bg-white rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl border border-slate-200 flex flex-col max-h-[85vh]">
        <div className="p-6 md:p-8 border-b border-slate-100 flex justify-between items-center bg-white shrink-0">
          <div>
            <h3 className="text-2xl font-bold text-slate-900 tracking-tight">My Job Applications</h3>
            <p className="text-sm text-slate-500 font-medium mt-1">Track the status of your applications.</p>
          </div>
          <button onClick={onClose} className="p-2.5 bg-slate-50 rounded-full border border-slate-200 hover:bg-slate-100 transition-colors text-slate-500"><X size={18} /></button>
        </div>
        <div className="flex-grow overflow-y-auto custom-scrollbar p-6 md:p-8 space-y-4 bg-slate-50/50">
          {applications.length === 0 ? (
            <div className="text-center py-16"><p className="text-slate-500 font-medium">No applications submitted yet.</p></div>
          ) : applications.map((app: any) => (
            <div key={app.id} className="bg-white border border-slate-200/60 rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm">
              <div>
                <p className="font-bold text-slate-900 text-lg">{app.vacancies?.subject}</p>
                <p className="text-sm text-slate-500 font-medium flex items-center gap-1.5 mt-1"><MapPin size={14} className="text-slate-400"/>{app.vacancies?.location}</p>
              </div>
              <StatusBadge status={app.status} />
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

function TutorsMarquee({ tutors, theme = 'emerald' }: { tutors: Tutor[], theme?: 'emerald' | 'violet' }) {
  const router = useRouter();
  if (!tutors || tutors.length === 0) return null;
  const displayTutors = [...tutors, ...tutors, ...tutors].map((t, i) => ({ ...t, _key: `${i}-${t.id}` }));
  const themeColor = theme === 'emerald' ? 'text-emerald-500' : 'text-violet-500';

  return (
    <div className={`bg-gradient-to-br from-white to-slate-50 border border-slate-200/60 rounded-3xl p-6 sm:p-8 flex flex-col relative overflow-hidden shadow-sm`}>
      <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-6"><Sparkles size={14} className={`inline ${themeColor} mr-1`} /> Premium Verified Tutors</h3>
      <div className="flex-grow w-full overflow-hidden relative flex items-center">
        <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none"></div>
        <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none"></div>
        <div className="flex w-max animate-marquee gap-5 h-full py-2">
          {displayTutors.map((tutor) => (
            <motion.div whileHover={{ y: -2 }} key={tutor._key} onClick={() => router.push(`/tutors/${tutor.id}`)} className="flex flex-col justify-between gap-3 bg-white border border-slate-100 p-4 rounded-2xl w-[280px] h-full shrink-0 shadow-sm hover:shadow-md cursor-pointer transition-shadow">
              <div className="flex items-center gap-3">
                <AvatarDisplay name={tutor.name || 'Tutor'} url={tutor.avatar_url} />
                <div className="overflow-hidden w-full">
                  <p className="font-bold text-slate-900 truncate">{tutor.name} <CheckCircle size={14} className="inline text-emerald-500 mb-0.5" /></p>
                  <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5">{tutor.education || (tutor.subject?.[0] || 'Premium Tutor')}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TuitionCourseCard({ course, theme = 'emerald' }: { course: any, theme?: 'emerald' | 'violet' }) {
  const offerPrice = course.fee || 0;
  const originalPrice = course.discount > 0 ? Math.round(course.fee / (1 - course.discount / 100)) : course.fee;
  
  // Uses course_code (e.g., 'AR') for the URL if available, otherwise falls back to encoded title
  const slug = course.course_code ? course.course_code : encodeURIComponent(course.title);
  
  const themeHover = theme === 'emerald' ? 'group-hover:text-emerald-700 hover:border-emerald-200' : 'group-hover:text-violet-700 hover:border-violet-200';
  const themeText = theme === 'emerald' ? 'text-emerald-600 hover:text-emerald-800' : 'text-violet-600 hover:text-violet-800';

  // Format date if it exists
  const formattedDate = course.start_datetime 
    ? new Date(course.start_datetime).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) 
    : null;

  return (
    <motion.div whileHover={{ y: -2 }} onClick={() => window.location.href = `/onlinecourse/${slug}`} className={`bg-white border border-slate-200/60 rounded-3xl overflow-hidden flex flex-col h-full shadow-sm hover:shadow-lg cursor-pointer group relative transition-all duration-300 ${themeHover}`}>
      
      {/* IMAGE SECTION */}
      <div className="relative w-full h-40 bg-slate-50 flex items-center justify-center border-b border-slate-100 overflow-hidden shrink-0">
        {course.cover_pic ? (
          <img 
            src={course.cover_pic} 
            alt={course.title} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <BookOpen size={48} className="text-slate-200 group-hover:scale-110 transition-transform duration-500" />
        )}
      </div>

      <div className="p-5 sm:p-6 flex flex-col flex-grow">
        <h4 className="font-bold text-xl mb-3 text-slate-900 transition-colors line-clamp-2">{course.title}</h4>
        
        {/* METADATA SECTION */}
        <div className="flex flex-col gap-2 mb-4 mt-1">
          {course.tutor_name && (
            <p className="text-xs text-slate-600 flex items-center gap-2 font-medium">
              <User size={14} className="text-slate-400" /> By <span className="text-slate-800 font-semibold">{course.tutor_name}</span>
            </p>
          )}
          {formattedDate && (
            <p className="text-xs text-slate-600 flex items-center gap-2 font-medium">
              <Calendar size={14} className="text-slate-400" /> Starts <span className="text-slate-800 font-semibold">{formattedDate}</span>
            </p>
          )}
          {course.duration && (
            <p className="text-xs text-slate-600 flex items-center gap-2 font-medium">
              <BookOpen size={14} className="text-slate-400" /> Duration: <span className="text-slate-800 font-semibold">{course.duration}</span>
            </p>
          )}
          {(course.timing || course.class_time) && (
            <p className="text-xs text-slate-600 flex items-center gap-2 font-medium">
              <Clock size={14} className="text-slate-400" /> Timing: <span className="text-slate-800 font-semibold">{course.timing || course.class_time}</span>
            </p>
          )}
          {course.syllabus_pdf && (
            <a 
              href={course.syllabus_pdf} 
              target="_blank" 
              rel="noopener noreferrer" 
              // IMPORTANT: stopPropagation prevents the main card click event from firing when clicking this link
              onClick={(e) => e.stopPropagation()} 
              className={`text-xs flex items-center gap-1.5 font-bold mt-1 w-max transition-colors ${themeText}`}
            >
              <FileText size={14} /> Download Syllabus
            </a>
          )}
        </div>

        <div className="flex items-end justify-between mt-auto pt-4 border-t border-slate-100">
          <div>
            <p className="text-slate-900 font-bold text-xl">Rs. {offerPrice.toLocaleString()}</p>
            {course.discount > 0 && <p className="text-slate-400 font-medium text-xs line-through mt-0.5">Rs. {originalPrice.toLocaleString()}</p>}
          </div>
          <button className="p-2.5 bg-slate-50 border border-slate-200 text-slate-600 rounded-xl group-hover:bg-white transition-colors"><ExternalLink size={16}/></button>
        </div>
      </div>
    </motion.div>
  );
}