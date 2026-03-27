'use client';

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import NepaliDate from "nepali-date-converter"; // <-- ADDED THIS IMPORT
import { 
  Search, CheckCircle, Clock, BookOpen, 
  Calculator, FlaskConical, Globe, Code, FileSpreadsheet, 
  Plus, ArrowRight, Play, Users, Sparkles, GraduationCap, 
  Flame, X, MonitorPlay, ShieldCheck, BadgeCheck
} from "lucide-react";

// --- INTERFACES ---
interface Vacancy {
  id: number;
  subject: string | string[]; 
  location: string;
  class_level: string;
  salary_range: string;
  created_at?: string;
  urgent?: boolean;
}

interface Tutor {
  id: number;
  name: string;
  subject: string | string[]; 
  experience: number;
  location: string;
}

interface CoursePromo {
  id: number;
  title: string;
  fee: string | number;
  start_datetime: string;
  cover_pic?: string;
  discount?: number;
}

// --- SAFE HELPER FUNCTIONS ---

const getInitials = (name?: string) => {
  if (!name) return "T";
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
};

const parseSubjects = (subjectData?: string | string[] | null): string[] => {
  if (!subjectData) return [];
  if (Array.isArray(subjectData)) return subjectData;
  if (typeof subjectData === 'string') {
    try {
      const parsed = JSON.parse(subjectData);
      return Array.isArray(parsed) ? parsed : [subjectData];
    } catch {
      return [subjectData];
    }
  }
  return [];
};

const formatSubjects = (subjectData?: string | string[] | null) => {
  const subjects = parseSubjects(subjectData);
  if (subjects.length === 0 || !subjects[0]) return "Tutor";

  const firstSubject = subjects[0];
  const extraCount = subjects.length - 1;

  return (
    <>
      <span className="text-blue-600 font-semibold">{firstSubject}</span>
      {extraCount > 0 && <span className="text-slate-400"> +{extraCount} more</span>}
    </>
  );
};

const getSubjectIcon = (subjectData?: string | string[] | null) => {
  const subjects = parseSubjects(subjectData);
  if (subjects.length === 0 || !subjects[0]) return <BookOpen className="w-5 h-5" />;
  
  const s = String(subjects[0]).toLowerCase();
  if (s.includes("math") || s.includes("account")) return <Calculator className="w-5 h-5 text-blue-600" />;
  if (s.includes("science") || s.includes("physics") || s.includes("chem") || s.includes("bio")) return <FlaskConical className="w-5 h-5 text-indigo-600" />;
  if (s.includes("english") || s.includes("ielts") || s.includes("pte")) return <Globe className="w-5 h-5 text-emerald-600" />;
  if (s.includes("computer") || s.includes("it") || s.includes("autocad")) return <Code className="w-5 h-5 text-slate-600" />;
  if (s.includes("excel")) return <FileSpreadsheet className="w-5 h-5 text-amber-600" />;
  
  return <BookOpen className="w-5 h-5 text-blue-500" />;
};

const formatPostedTime = (date?: string) => {
  if (!date) return "Recently";
  try {
    const diffHours = Math.floor((new Date().getTime() - new Date(date).getTime()) / 3600000);
    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  } catch {
    return "Recently";
  }
};

// --- UPDATED DATE FUNCTION ---
const formatCourseDate = (dateString?: string) => {
  if (!dateString) return 'TBA';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'TBA';

    const day = date.toLocaleDateString('en-US', { weekday: 'long' });
    const engDate = date.toLocaleDateString('en-US');
    
    // Accurate AD to BS conversion using the library
    const nDate = new NepaliDate(date);
    const nepaliMonths = [
      "Baisakh", "Jestha", "Ashadh", "Shrawan", "Bhadra", "Ashwin", 
      "Kartik", "Mangsir", "Poush", "Magh", "Falgun", "Chaitra"
    ];
    
    const bsYear = nDate.getYear();
    const bsMonthName = nepaliMonths[nDate.getMonth()];
    const bsDate = nDate.getDate();

    const nepaliDateStr = `${bsMonthName} ${bsDate}, ${bsYear}`;

    return `${day}, ${engDate} (${nepaliDateStr})`;
  } catch {
    return 'Coming Soon';
  }
};

// --- COMPONENTS ---
const SkeletonCard = () => (
  <div className="flex gap-4 p-4 rounded-3xl border border-white/60 bg-white/40 shadow-sm relative overflow-hidden">
    <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent z-10" />
    <div className="h-12 w-12 shrink-0 rounded-full bg-blue-100/50" />
    <div className="flex-1 space-y-3 py-1">
      <div className="h-4 w-3/4 rounded-md bg-slate-200/60" />
      <div className="h-3 w-1/2 rounded-md bg-slate-200/50" />
      <div className="h-3 w-1/4 rounded-md bg-slate-200/40" />
    </div>
  </div>
);

const staggerContainer = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.2 } }
};

const staggerItem = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } }
} as const;

export default function Home() {
  const router = useRouter();
  
  // States
  const [vacancies, setVacancies] = useState<Vacancy[]>([]);
  const [topTutors, setTopTutors] = useState<Tutor[]>([]);
  const [promoCourse, setPromoCourse] = useState<CoursePromo | null>(null);
  const [showPromo, setShowPromo] = useState(false);
  const [search, setSearch] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [activeVacancyIndex, setActiveVacancyIndex] = useState(0);
  const [activeTutorIndex, setActiveTutorIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  
  const [totalTutorsCount, setTotalTutorsCount] = useState(0);
  const [totalApplicationsCount, setTotalApplicationsCount] = useState(0);
  const [activeVacanciesCount, setActiveVacanciesCount] = useState(0);

  // Data Fetching
  useEffect(() => {
    let isMounted = true;

    const fetchHomeData = async () => {
      setLoading(true);
      try {
        const [
          vacanciesRes, 
          tutorsRes, 
          tutorsCountRes, 
          vacanciesCountRes,
          courseRes
        ] = await Promise.all([
          supabase.from("vacancies")
            .select("id, subject, location, class_level, salary_range, created_at, urgent")
            .order("urgent", { ascending: false, nullsFirst: false })
            .order("created_at", { ascending: false })
            .limit(6),
          supabase.from("tutors")
            .select("id, name, subject, experience, location")
            .eq('verified', true)
            .limit(6),
          supabase.from("tutors").select("id", { count: "exact", head: true }),
          supabase.from("vacancies").select("id", { count: "exact", head: true }),
          supabase.from("online-courses")
            .select("id, title, fee, start_datetime, cover_pic, discount")
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle(),
        ]);

        if (!isMounted) return;

        if (!vacanciesRes.error) setVacancies(vacanciesRes.data || []);
        if (!tutorsRes.error) setTopTutors(tutorsRes.data || []);
        
        if (tutorsCountRes.count !== null) setTotalTutorsCount(tutorsCountRes.count);
        if (vacanciesCountRes.count !== null) {
          setTotalApplicationsCount(vacanciesCountRes.count); 
          setActiveVacanciesCount(vacanciesCountRes.count);
        }

        if (courseRes.data) {
          setPromoCourse(courseRes.data);
          setTimeout(() => { if (isMounted) setShowPromo(true); }, 1500); 
        }
      } catch (err) {
        console.error("Home Data Fetch Error:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchHomeData();

    return () => { isMounted = false; }; 
  }, []);

  // Animation Intervals
  useEffect(() => {
    if (vacancies.length <= 1) return;
    const interval = setInterval(() => setActiveVacancyIndex((prev) => (prev + 1) % vacancies.length), 4000);
    return () => clearInterval(interval);
  }, [vacancies]);

  useEffect(() => {
    if (topTutors.length <= 1) return;
    const interval = setInterval(() => setActiveTutorIndex((prev) => (prev + 1) % topTutors.length), 4500);
    return () => clearInterval(interval);
  }, [topTutors]);

  // Safe Slice Memos
  const displayedVacancies = useMemo(() => {
    if (!vacancies || vacancies.length === 0) return [];
    return [...vacancies.slice(activeVacancyIndex), ...vacancies.slice(0, activeVacancyIndex)].slice(0, 4);
  }, [vacancies, activeVacancyIndex]);

  const displayedTutors = useMemo(() => {
    if (!topTutors || topTutors.length === 0) return [];
    return [...topTutors.slice(activeTutorIndex), ...topTutors.slice(0, activeTutorIndex)].slice(0, 4);
  }, [topTutors, activeTutorIndex]);

  // Search Handler
  const handleSearch = (queryOverride?: string) => {
    const query = queryOverride || search.trim();
    if (!query) return router.push("/tutors");
    router.push(`/tutors?search=${encodeURIComponent(query)}`);
  };

  return (
    <main className="min-h-screen bg-slate-50 selection:bg-blue-100 selection:text-blue-900 text-slate-900 font-sans flex flex-col relative overflow-hidden">
      
      {/* Background Orbs */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[20%] -left-[10%] w-[70vw] h-[70vw] rounded-full bg-blue-200/30 blur-[120px] mix-blend-multiply animate-[pulse_8s_ease-in-out_infinite]" />
        <div className="absolute top-[10%] -right-[10%] w-[60vw] h-[60vw] rounded-full bg-indigo-200/30 blur-[120px] mix-blend-multiply animate-[pulse_10s_ease-in-out_infinite_1s]" />
        <div className="absolute -bottom-[20%] left-[20%] w-[80vw] h-[80vw] rounded-full bg-sky-200/30 blur-[120px] mix-blend-multiply animate-[pulse_12s_ease-in-out_infinite_2s]" />
      </div>

      {/* Promo Modal */}
      <AnimatePresence>
        {showPromo && promoCourse && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-3xl p-8 shadow-2xl overflow-hidden border border-slate-100"
            >
              <div className="absolute top-4 right-4 bg-orange-100 text-orange-600 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide flex items-center gap-1 z-10">
                <Flame className="w-3 h-3" /> Offer
              </div>
              <button onClick={() => setShowPromo(false)} className="absolute top-4 left-4 text-slate-400 hover:text-slate-700 transition-colors z-10 bg-white/50 rounded-full p-1">
                <X className="w-6 h-6" />
              </button>
              
              <div className="mt-4 text-center">
                <div className="relative w-full h-40 mb-6 rounded-2xl overflow-hidden bg-slate-100 flex items-center justify-center">
                  {promoCourse.cover_pic ? (
                    <Image
                      src={promoCourse.cover_pic}
                      alt={promoCourse.title}
                      fill
                      unoptimized 
                      className="object-cover"
                    />
                  ) : (
                    <MonitorPlay className="w-12 h-12 text-slate-400" />
                  )}
                </div>

                <h3 className="text-2xl font-extrabold text-slate-900 mb-2 leading-tight">
                  {promoCourse.title} <span className="text-orange-600 inline-block font-bold">Online Course</span>
                </h3>
                
                <p suppressHydrationWarning className="text-slate-500 font-medium mb-5 flex items-center justify-center gap-2 text-sm">
                  <Clock className="w-4 h-4" />
                  Starts: {formatCourseDate(promoCourse.start_datetime)}
                </p>
                
                <div className="flex items-center justify-center gap-3 mb-8">
                  <span className="text-xl text-slate-400 line-through font-semibold">
                    Rs. {promoCourse.discount 
                      ? Math.round(Number(promoCourse.fee || 0) / (1 - promoCourse.discount / 100)) 
                      : Math.round(Number(promoCourse.fee || 0) * 1.25)}
                  </span>
                  <span className="text-4xl font-black text-orange-600">Rs. {promoCourse.fee}</span>
                </div>

                <Link href={`/online-courses/${promoCourse.id}`} onClick={() => setShowPromo(false)} className="block w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-orange-600/25 hover:shadow-xl hover:scale-[1.02] transition-all">
                  Join Now
                </Link>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative z-10 mx-auto max-w-[90rem] px-4 pb-24 pt-8 sm:px-6 lg:px-8 flex-grow">
        <div className="grid grid-cols-1 gap-8 xl:grid-cols-[300px_minmax(0,1fr)_300px]">
          
          {/* Left Sidebar: Top Tutors */}
          <aside className="hidden xl:block">
            <div className="sticky top-24 rounded-3xl border border-white/60 bg-white/60 p-6 shadow-[0_8px_32px_rgba(37,99,235,0.04)] backdrop-blur-2xl">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-slate-400">
                    <Sparkles className="h-3.5 w-3.5 text-amber-400" /> Learn with Experts
                  </p>
                  <h3 className="text-xl font-extrabold text-slate-900 mt-1">Verified Tutors</h3>
                </div>
              </div>
              <div className="space-y-3 relative overflow-hidden h-[360px]">
                {loading ? (
                  Array(4).fill(0).map((_, i) => <SkeletonCard key={i} />)
                ) : displayedTutors.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center text-slate-400">
                    <Users className="mb-2 h-8 w-8 opacity-20" />
                    <p className="text-sm font-bold">No tutors available yet.</p>
                  </div>
                ) : (
                  <AnimatePresence initial={false}>
                    {displayedTutors.map((tutor, idx) => (
                      <motion.div key={tutor.id} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.4, ease: "easeInOut" }} className="absolute w-full" style={{ top: `${idx * 88}px` }}>
                        <Link href={`/tutors/${tutor.id}`} className="group block rounded-2xl border border-white/80 bg-white/80 p-4 transition-all duration-300 hover:border-blue-100 hover:bg-white hover:shadow-xl hover:scale-[1.02]">
                          <div className="flex items-center gap-3">
                            <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-blue-500 font-bold text-white shadow-md">
                              {getInitials(tutor.name)}
                              <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-blue-500 text-white opacity-0 transition-opacity group-hover:opacity-100"><Play className="h-2.5 w-2.5 ml-0.5" /></div>
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5">
                                <p className="truncate font-bold text-slate-900">{tutor.name || 'Anonymous'}</p>
                                <div className="flex items-center justify-center bg-blue-50 rounded-full p-0.5 shrink-0" title="Verified Tutor"><BadgeCheck className="h-3.5 w-3.5 text-blue-600" /></div>
                              </div>
                              <p className="truncate text-xs font-medium text-slate-500 mt-0.5">{formatSubjects(tutor.subject)} • {tutor.experience || 0}y exp</p>
                            </div>
                          </div>
                        </Link>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                )}
              </div>
              <Link href="/tutors" className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-100">Browse All Tutors <ArrowRight className="h-4 w-4" /></Link>
            </div>
          </aside>

          {/* Main Content */}
          <div className="min-w-0 flex flex-col gap-8">
            <motion.section 
              initial={{ opacity: 0.01, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative overflow-hidden rounded-[40px] border border-white/60 bg-white/40 px-6 py-14 shadow-[0_8px_32px_rgba(15,23,42,0.04)] ring-1 ring-white/50 backdrop-blur-2xl sm:px-12 sm:py-20"
            >
              <div className="relative z-10 mx-auto max-w-3xl text-center">
                <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-blue-200/50 bg-white/60 px-4 py-1.5 text-xs font-bold text-blue-700 backdrop-blur-md shadow-sm">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75"></span>
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-500"></span>
                  </span>
                  Nepal’s Leading Education Hub
                </motion.div>
                <h1 className="text-5xl tracking-tight text-slate-900 sm:text-6xl md:text-7xl">
                  <span className="font-medium">Welcome to</span> <br />
                  <span className="font-extrabold text-blue-600">GyanHub Pvt. Ltd</span>
                </h1>
                <p className="mx-auto mt-6 max-w-xl text-lg font-medium leading-relaxed text-slate-600">Find trusted tutors across Nepal, join interactive online classes, or post your tuition requirement in minutes. <br/><span className="text-sm mt-2 block opacity-80">योग्य शिक्षक खोज्नुहोस्, अनलाइन कक्षामा सहभागी हुनुहोस् वा ट्यूशन आवश्यकताहरू पोस्ट गर्नुहोस्—अब सबै कुरा सरल र व्यवस्थित।</span></p>
                
                {/* Search Bar */}
                <div className="relative mx-auto mt-10 max-w-2xl z-50">
                  <div className={`flex flex-col gap-2 p-2 sm:flex-row bg-white/90 backdrop-blur-md rounded-[24px] border transition-all duration-300 ${isSearchFocused ? 'border-blue-300 shadow-xl scale-[1.01]' : 'border-white shadow-sm'}`}>
                    <div className="flex flex-1 items-center px-4 gap-3">
                      <Search className="h-5 w-5 text-blue-500 shrink-0" />
                      <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} onFocus={() => setIsSearchFocused(true)} onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)} onKeyDown={(e) => e.key === "Enter" && handleSearch()} placeholder="What do you want to learn? (e.g. AutoCAD)" className="h-12 w-full bg-transparent text-sm font-medium outline-none" />
                    </div>
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => handleSearch()} className="h-12 rounded-[18px] bg-blue-600 px-8 text-sm font-bold text-white shadow-lg transition hover:bg-blue-700 shrink-0">Search</motion.button>
                  </div>
                </div>

                {/* Call to Action */}
                <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                  <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                    <Link href="/post-tuition" className="group relative flex h-14 min-w-[220px] items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-8 text-sm font-bold text-white shadow-xl transition-all">
                      <span className="relative z-10 flex items-center gap-2">Post Tuition Request <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></span>
                    </Link>
                  </motion.div>
                </div>

                {/* Stats */}
                <div className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-4 border-t border-slate-300/40 pt-8">
                  <div className="flex items-center gap-2"><Users className="h-5 w-5 text-blue-500" /><span className="text-sm font-bold text-slate-700">{totalTutorsCount > 0 ? `${totalTutorsCount}+` : "..."} Trusted Tutors</span></div>
                  <div className="hidden h-4 w-px bg-slate-300 sm:block"></div>
                  <div className="flex items-center gap-2"><GraduationCap className="h-5 w-5 text-emerald-500" /><span className="text-sm font-bold text-slate-700">{totalApplicationsCount > 0 ? `${totalApplicationsCount}+` : "..."} Students Applied</span></div>
                </div>
              </div>
            </motion.section>

            {/* Features Section */}
            <motion.section variants={staggerContainer} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-100px" }} className="mt-16 rounded-[40px] border border-white/60 bg-white/50 p-8 shadow-sm backdrop-blur-2xl sm:p-12">
              <div className="text-center mb-10"><h2 className="text-3xl font-extrabold text-slate-900 sm:text-4xl">What is GyanHub?</h2><p className="mt-4 text-slate-600 font-medium text-lg max-w-2xl mx-auto">A secure, automated marketplace designed exclusively for searching tutors, posting vacancies, and accessing elite online courses.</p></div>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                <motion.div variants={staggerItem} className="relative rounded-[28px] border border-white bg-white/80 p-8 shadow-sm flex flex-col items-center text-center transition-all duration-300 hover:-translate-y-1 group">
                  <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors"><ShieldCheck className="h-8 w-8 text-blue-600" /></div>
                  <h3 className="mb-3 text-xl font-bold text-slate-900">Tutor Discovery</h3>
                  <p className="text-sm font-medium leading-relaxed text-slate-500">Instantly browse and connect with verified, top-tier experts suited perfectly to your learning needs.</p>
                </motion.div>
                <motion.div variants={staggerItem} className="relative rounded-[28px] border border-white bg-white/80 p-8 shadow-sm flex flex-col items-center text-center transition-all duration-300 hover:-translate-y-1 group">
                  <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 group-hover:bg-amber-500/20 transition-colors"><FileSpreadsheet className="h-8 w-8 text-amber-600" /></div>
                  <h3 className="mb-3 text-xl font-bold text-slate-900">Instant Vacancy Posting</h3>
                  <p className="text-sm font-medium leading-relaxed text-slate-500">Broadcast your coaching requirements in seconds and receive immediate responses from interested candidates.</p>
                </motion.div>
                <motion.div variants={staggerItem} className="relative rounded-[28px] border border-white bg-white/80 p-8 shadow-sm flex flex-col items-center text-center transition-all duration-300 hover:-translate-y-1 group">
                  <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 group-hover:bg-emerald-500/20 transition-colors"><MonitorPlay className="h-8 w-8 text-emerald-600" /></div>
                  <h3 className="mb-3 text-xl font-bold text-slate-900">Automated Learning</h3>
                  <p className="text-sm font-medium leading-relaxed text-slate-500">Access high-quality, professional online courses seamlessly and upgrade your technical and academic skills.</p>
                </motion.div>
              </div>
            </motion.section>
          </div>

          {/* Right Sidebar: Live Vacancies */}
          <aside className="hidden xl:block">
            <div className="sticky top-24 rounded-3xl border border-white/60 bg-white/60 p-6 shadow-[0_8px_32px_rgba(37,99,235,0.04)] backdrop-blur-2xl">
              <div className="mb-5 flex items-center justify-between">
                <div><p className="text-xs font-bold uppercase tracking-widest text-slate-400">Real-time Feed</p><h3 className="text-xl font-extrabold text-slate-900 mt-1">Live Coaching Requests</h3></div>
                <div className="flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1">
                  <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span><span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span></span>
                  <span className="text-[10px] font-bold tracking-wide text-emerald-700">{activeVacanciesCount > 0 ? `${activeVacanciesCount} Active` : "Live"}</span>
                </div>
              </div>
              <div className="space-y-3 relative overflow-hidden h-[360px]">
                {loading ? ( Array(4).fill(0).map((_, i) => <SkeletonCard key={i} />) ) : displayedVacancies.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center text-slate-400">
                    <Search className="mb-2 h-8 w-8 opacity-20" />
                    <p className="text-sm font-bold">No active requests.</p>
                  </div>
                ) : (
                  <AnimatePresence initial={false}>
                    {displayedVacancies.map((vacancy, idx) => (
                      <motion.div key={vacancy.id} layout initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.4, ease: "easeInOut" }} className="absolute w-full" style={{ top: `${idx * 88}px` }}>
                        <Link href={`/vacancies/${vacancy.id}`} className={`group block rounded-2xl border ${vacancy.urgent ? 'border-orange-200 bg-orange-50/80' : 'border-white/80 bg-white/80'} p-4 transition-all duration-300 hover:scale-[1.02]`}>
                          <div className="flex items-center gap-3">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-50/80">{getSubjectIcon(vacancy.subject)}</div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate font-bold text-slate-900 group-hover:text-blue-600 transition-colors flex items-center gap-1.5">{formatSubjects(vacancy.subject)} {vacancy.urgent && <Flame className="h-4 w-4 text-orange-500" />}</p>
                              <div className="flex items-center justify-between mt-0.5">
                                <p className="truncate text-xs font-medium text-slate-500">{vacancy.location || 'Remote'}</p>
                                <p suppressHydrationWarning className="text-[10px] font-bold text-emerald-600 flex items-center gap-1"><Clock className="w-3 h-3" /> {formatPostedTime(vacancy.created_at)}</p>
                              </div>
                              {vacancy.salary_range && <div className="mt-1.5 inline-block rounded-md bg-slate-100/80 px-2 py-0.5 text-[10px] font-bold text-slate-600">{vacancy.salary_range}</div>}
                            </div>
                          </div>
                        </Link>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                )}
              </div>
              <Link href="/vacancies" className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-100">View All Vacancies <ArrowRight className="h-4 w-4" /></Link>
            </div>
          </aside>
        </div>
      </div>

      {/* Mobile Floating Action Button */}
      <div className="fixed bottom-6 right-6 z-50 xl:hidden">
        <Link href="/post-tuition">
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 shadow-xl text-white"><Plus className="h-6 w-6" /></motion.button>
        </Link>
      </div>
    </main>
  );
}