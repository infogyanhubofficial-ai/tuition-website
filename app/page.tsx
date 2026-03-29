'use client';

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import NepaliDate from "nepali-date-converter"; 
import { 
  Search, CheckCircle, Clock, BookOpen, 
  Calculator, FlaskConical, Globe, Code, FileSpreadsheet, 
  Plus, ArrowRight, Play, Users, Sparkles, GraduationCap, 
  Flame, X, MonitorPlay, ShieldCheck, BadgeCheck, TrendingUp, History, Map
} from "lucide-react";

// --- INTERFACES ---
interface Vacancy {
  id: number | string;
  subject: string | string[]; 
  location: string;
  class_level: string;
  salary_range: string;
  created_at?: string;
  urgent?: boolean;
}

interface Tutor {
  id: number | string;
  name: string;
  subject: string | string[]; 
  experience: number;
  location: string;
}

interface CoursePromo {
  id: number | string;
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
      {extraCount > 0 && <span className="text-slate-400"> +{extraCount}</span>}
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
  if (s.includes("computer") || s.includes("it") || s.includes("autocad") || s.includes("gis") || s.includes("cad")) return <Code className="w-5 h-5 text-slate-600" />;
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

const formatCourseDate = (dateString?: string) => {
  if (!dateString) return 'TBA';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'TBA';

    const nDate = new NepaliDate(date);
    const nepaliMonths = [
      "Baisakh", "Jestha", "Ashadh", "Shrawan", "Bhadra", "Ashwin", 
      "Kartik", "Mangsir", "Poush", "Magh", "Falgun", "Chaitra"
    ];
    
    return `${nepaliMonths[nDate.getMonth()]} ${nDate.getDate()}, ${nDate.getYear()}`;
  } catch {
    return 'Coming Soon';
  }
};

// --- ANIMATION CONSTANTS ---
const smoothEase = [0.22, 1, 0.36, 1] as const;

const staggerContainer = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.15 } }
};

const staggerItem = {
  hidden: { opacity: 0, y: 30, filter: "blur(10px)" },
  show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.6, ease: smoothEase } }
};

// --- COMPONENTS ---
const SkeletonCard = () => (
  <div className="flex gap-4 p-4 rounded-3xl border border-white/60 bg-white/40 shadow-sm relative overflow-hidden min-w-[280px]">
    <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent z-10" />
    <div className="h-12 w-12 shrink-0 rounded-full bg-blue-100/50" />
    <div className="flex-1 space-y-3 py-1">
      <div className="h-4 w-3/4 rounded-md bg-slate-200/60" />
      <div className="h-3 w-1/2 rounded-md bg-slate-200/50" />
    </div>
  </div>
);

export default function Home() {
  const router = useRouter();
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();
  
  const yParallax = useTransform(scrollY, [0, 1000], [0, 300]);
  
  // States
  const [vacancies, setVacancies] = useState<Vacancy[]>([]);
  const [topTutors, setTopTutors] = useState<Tutor[]>([]);
  const [promoCourses, setPromoCourses] = useState<CoursePromo[]>([]); 
  const [search, setSearch] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [activeVacancyIndex, setActiveVacancyIndex] = useState(0);
  const [activeTutorIndex, setActiveTutorIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isFabOpen, setIsFabOpen] = useState(false);
  
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
          vacanciesRes, tutorsRes, tutorsCountRes, vacanciesCountRes, courseRes
        ] = await Promise.all([
          supabase.from("vacancies").select("id, subject, location, class_level, salary_range, created_at, urgent").order("urgent", { ascending: false, nullsFirst: false }).order("created_at", { ascending: false }).limit(6),
          supabase.from("tutors").select("id, name, subject, experience, location").eq('verified', true).limit(6),
          supabase.from("tutors").select("id", { count: "exact", head: true }),
          supabase.from("vacancies").select("id", { count: "exact", head: true }),
          // Changed order to target the soonest upcoming courses
          supabase.from("online-courses")
            .select("id, title, fee, start_datetime, cover_pic, discount")
            .gte("start_datetime", new Date().toISOString()) // Added to ensure it skips past courses
            .order("start_datetime", { ascending: true }) 
            .limit(2), 
        ]);

        if (!isMounted) return;

        if (!vacanciesRes.error) setVacancies(vacanciesRes.data || []);
        if (!tutorsRes.error) setTopTutors(tutorsRes.data || []);
        
        if (tutorsCountRes.count !== null) setTotalTutorsCount(tutorsCountRes.count);
        if (vacanciesCountRes.count !== null) {
          setTotalApplicationsCount(vacanciesCountRes.count); 
          setActiveVacanciesCount(vacanciesCountRes.count);
        }

        if (courseRes.data && courseRes.data.length > 0) {
          setTimeout(() => { if (isMounted) setPromoCourses(courseRes.data); }, 3000); 
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

  const handleRemovePromo = (id: string | number) => {
    setPromoCourses((prev) => prev.filter((course) => course.id !== id));
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

  const displayedVacancies = useMemo(() => {
    if (!vacancies || vacancies.length === 0) return [];
    return [...vacancies.slice(activeVacancyIndex), ...vacancies.slice(0, activeVacancyIndex)].slice(0, 4);
  }, [vacancies, activeVacancyIndex]);

  const displayedTutors = useMemo(() => {
    if (!topTutors || topTutors.length === 0) return [];
    return [...topTutors.slice(activeTutorIndex), ...topTutors.slice(0, activeTutorIndex)].slice(0, 4);
  }, [topTutors, activeTutorIndex]);

  const handleSearch = (queryOverride?: string) => {
    const query = queryOverride || search.trim();
    if (!query) return router.push("/tutors");
    router.push(`/tutors?search=${encodeURIComponent(query)}`);
  };

  return (
    <main className="min-h-screen bg-slate-50 selection:bg-blue-100 selection:text-blue-900 text-slate-900 font-sans flex flex-col relative overflow-x-hidden">
      
      {/* Background Depth Layers */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[20%] -left-[10%] w-[70vw] h-[70vw] rounded-full bg-blue-200/30 blur-[120px] mix-blend-multiply animate-[pulse_8s_ease-in-out_infinite]" />
        <div className="absolute top-[10%] -right-[10%] w-[60vw] h-[60vw] rounded-full bg-indigo-200/30 blur-[120px] mix-blend-multiply animate-[pulse_10s_ease-in-out_infinite_1s]" />
        <motion.div style={{ y: yParallax }} className="absolute top-[20%] left-[60%] w-[30vw] h-[30vw] rounded-full bg-gradient-to-tr from-sky-300/40 to-blue-500/10 blur-[60px] mix-blend-multiply opacity-60" />
      </div>

      {/* Floating Promo Cards */}
      <div className="fixed bottom-4 left-4 sm:bottom-6 sm:left-6 z-[100] w-full max-w-[320px] flex flex-col gap-3 pointer-events-none">
        <AnimatePresence>
          {promoCourses.map((course) => (
            <motion.div
              key={course.id}
              initial={{ opacity: 0, x: -50, scale: 0.9 }} 
              animate={{ opacity: 1, x: 0, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.9, x: -20 }}
              transition={{ duration: 0.4, ease: smoothEase }}
              className="relative bg-white/95 backdrop-blur-xl rounded-2xl p-4 shadow-[0_20px_40px_rgba(0,0,0,0.12)] border border-slate-200/60 overflow-hidden group pointer-events-auto"
            >
              <button 
                onClick={() => handleRemovePromo(course.id)} 
                className="absolute top-2 right-2 text-slate-400 hover:text-slate-700 transition-colors z-20 bg-slate-100 hover:bg-slate-200 rounded-full p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
              
              <div className="flex gap-3 items-center mb-3 pr-4">
                <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                  {course.cover_pic ? (
                    <Image src={course.cover_pic} alt={course.title} fill className="object-cover" />
                  ) : (
                    <MonitorPlay className="w-5 h-5 text-slate-400 m-auto mt-4" />
                  )}
                </div>
                <div>
                  <span className="text-[9px] font-black uppercase tracking-wider text-orange-600 mb-0.5 flex items-center gap-1">
                    <Flame className="w-3 h-3" /> New Course
                  </span>
                  <h4 className="font-bold text-slate-900 leading-tight line-clamp-2 text-[13px]">{course.title}</h4>
                </div>
              </div>

              <div className="flex items-center justify-between mb-3">
                 <div className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
                   <Clock className="w-3 h-3"/> {formatCourseDate(course.start_datetime)}
                 </div>
                 <div className="font-black text-slate-900 text-[13px]">Rs. {course.fee}</div>
              </div>

              {/* Updated Link to map properly to /onlinecourse/Title */}
              <Link 
                href={`/onlinecourse/${encodeURIComponent(course.title)}`} 
                onClick={() => handleRemovePromo(course.id)} 
                className="flex items-center justify-center w-full bg-slate-900 text-white !text-white text-[13px] font-bold py-2.5 rounded-xl hover:bg-slate-800 transition-colors"
              >
                View Details
              </Link>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="relative z-10 mx-auto w-full max-w-[90rem] px-4 pb-24 pt-4 sm:pt-8 sm:px-6 lg:px-8 flex-grow">
        
        {/* Grid Layout applies to Desktop, stacks on Mobile */}
        <div className="grid grid-cols-1 gap-8 xl:grid-cols-[300px_minmax(0,1fr)_300px]">
          
          {/* Left Sidebar: Desktop Only */}
          <aside className="hidden xl:block">
            <div className="sticky top-24 rounded-[32px] border border-white/60 bg-white/60 p-6 shadow-[0_8px_32px_rgba(37,99,235,0.04)] backdrop-blur-2xl">
              <div className="mb-5">
                <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  <Sparkles className="h-3.5 w-3.5 text-amber-400" /> Learn with Experts
                </p>
                <h3 className="text-xl font-extrabold text-slate-900 mt-1">Verified Tutors</h3>
              </div>
              <div className="space-y-3 relative overflow-hidden h-[360px]">
                {loading ? ( Array(4).fill(0).map((_, i) => <SkeletonCard key={i} />) ) : displayedTutors.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center text-slate-400"><Users className="mb-2 h-8 w-8 opacity-20" /><p className="text-sm font-bold">No tutors available yet.</p></div>
                ) : (
                  <AnimatePresence initial={false}>
                    {displayedTutors.map((tutor, idx) => (
                      <motion.div key={tutor.id} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.4, ease: smoothEase }} className="absolute w-full" style={{ top: `${idx * 88}px` }}>
                        <Link href={`/tutors/${tutor.id}`} className="group block rounded-2xl border border-white/80 bg-white/80 p-4 transition-all duration-300 hover:border-blue-200 hover:bg-white hover:shadow-[0_10px_20px_rgba(37,99,235,0.05)] hover:scale-[1.02]">
                          <div className="flex items-center gap-3">
                            <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-slate-100 font-bold text-slate-600 shadow-sm border border-slate-200 group-hover:bg-blue-50 group-hover:text-blue-600 group-hover:border-blue-200 transition-colors">
                              {getInitials(tutor.name)}
                              <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-blue-500 text-white opacity-0 transition-opacity group-hover:opacity-100"><Play className="h-2.5 w-2.5 ml-0.5" /></div>
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5">
                                <p className="truncate font-bold text-slate-900 text-sm">{tutor.name || 'Anonymous'}</p>
                                <BadgeCheck className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                              </div>
                              <p className="truncate text-xs font-medium text-slate-500 mt-0.5">{formatSubjects(tutor.subject)} • {tutor.experience || 0}y</p>
                            </div>
                          </div>
                        </Link>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                )}
              </div>
              <Link href="/tutors" className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-100/50 border border-slate-200/50 px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-100">Browse All Tutors <ArrowRight className="h-4 w-4" /></Link>
            </div>
          </aside>

          {/* Center Main Content */}
          <div className="min-w-0 flex flex-col gap-6 sm:gap-8">
            <motion.section 
              initial={{ opacity: 0.01, y: 30, filter: "blur(10px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} transition={{ duration: 0.8, ease: smoothEase }}
              className="relative overflow-hidden rounded-[32px] sm:rounded-[48px] border border-white/80 bg-white/50 px-5 py-10 shadow-[0_8px_40px_rgba(15,23,42,0.06)] ring-1 ring-white/60 backdrop-blur-2xl sm:px-12 sm:py-20"
            >
              <div className="relative z-10 mx-auto max-w-3xl text-center">
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2, duration: 0.5 }} className="mx-auto mb-6 sm:mb-8 inline-flex items-center gap-2 rounded-full border border-blue-200/60 bg-white/80 px-4 py-1.5 text-xs font-bold text-blue-700 backdrop-blur-md shadow-sm">
                  <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75"></span><span className="relative inline-flex h-2 w-2 rounded-full bg-blue-500"></span></span>
                  Nepal’s Premium Education Hub
                </motion.div>
                
                <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-slate-900 leading-[1.1]">
                  Find Trusted <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Tutors.</span><br className="hidden sm:block"/>
                  Join Online <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-rose-500">Classes.</span>
                </h1>
                <p className="mx-auto mt-6 max-w-lg text-base sm:text-lg font-medium leading-relaxed text-slate-600">
                  Connect with verified experts, learn from anywhere, or post your requirements in seconds.
                </p>
                
                {/* Search Engine */}
                <div className="relative mx-auto mt-8 sm:mt-10 max-w-2xl z-50" ref={searchContainerRef}>
                  <div className={`relative flex flex-col p-2 bg-white backdrop-blur-xl rounded-[28px] border transition-all duration-300 ${isSearchFocused ? 'border-blue-400 shadow-[0_20px_60px_-15px_rgba(37,99,235,0.2)] scale-[1.02]' : 'border-slate-200/80 shadow-md hover:shadow-lg'}`}>
                    <div className="flex items-center px-4 gap-3">
                      <Search className={`h-5 w-5 shrink-0 transition-colors ${isSearchFocused ? 'text-blue-600' : 'text-slate-400'}`} />
                      <input 
                        type="text" 
                        value={search} 
                        onChange={(e) => setSearch(e.target.value)} 
                        onFocus={() => setIsSearchFocused(true)} 
                        onKeyDown={(e) => e.key === "Enter" && handleSearch()} 
                        placeholder="What do you want to learn?" 
                        className="h-12 sm:h-14 w-full bg-transparent text-base sm:text-lg font-medium outline-none placeholder:text-slate-400 text-slate-800" 
                      />
                      <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => handleSearch()} className="hidden sm:flex h-11 items-center justify-center rounded-2xl bg-blue-600 px-8 text-sm font-bold text-white shadow-md transition-colors hover:bg-blue-700 shrink-0">Search</motion.button>
                    </div>

                    <AnimatePresence>
                      {isSearchFocused && (
                        <motion.div 
                          initial={{ opacity: 0, y: -10, height: 0 }} animate={{ opacity: 1, y: 0, height: 'auto' }} exit={{ opacity: 0, y: -10, height: 0 }}
                          className="absolute top-[calc(100%+8px)] left-0 right-0 bg-white border border-slate-200 rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] overflow-hidden"
                        >
                          <div className="p-4">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-1.5"><TrendingUp className="w-3.5 h-3.5"/> Trending Searches</h4>
                            <div className="flex flex-wrap gap-2">
                              {["AutoCAD", "IELTS", "Science", "GIS", "Mathematics"].map((tag) => (
                                <button key={tag} onMouseDown={() => handleSearch(tag)} className="px-3 py-1.5 bg-slate-50 border border-slate-100 hover:border-blue-200 hover:bg-blue-50 text-slate-600 hover:text-blue-700 rounded-xl text-xs font-bold transition-colors">
                                  {tag}
                                </button>
                              ))}
                            </div>
                            
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-5 mb-2 flex items-center gap-1.5"><History className="w-3.5 h-3.5"/> Quick Categories</h4>
                            <div className="flex flex-col">
                               <button onMouseDown={() => router.push('/tutors')} className="flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 rounded-xl text-left text-sm font-bold text-slate-700 transition-colors"><Users className="w-4 h-4 text-slate-400"/> Browse All Tutors</button>
                               <button onMouseDown={() => router.push('/online-courses')} className="flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 rounded-xl text-left text-sm font-bold text-slate-700 transition-colors"><MonitorPlay className="w-4 h-4 text-slate-400"/> Explore Online Classes</button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                <div className="mt-8 sm:mt-12 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
                  <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="w-full sm:w-auto">
                    <Link href="/post-tuition" className="group flex h-14 w-full sm:min-w-[200px] items-center justify-center gap-2 rounded-2xl bg-slate-900 px-8 text-sm font-bold text-white !text-white shadow-xl transition-all hover:bg-slate-800 hover:shadow-2xl">
                      Post Tuition Request <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="w-full sm:w-auto">
                    <Link href="/tutors" className="flex h-14 w-full sm:min-w-[160px] items-center justify-center gap-2 rounded-2xl bg-white border-2 border-slate-200 px-8 text-sm font-bold text-slate-700 transition-all hover:border-blue-600 hover:text-blue-700 hover:bg-blue-50">
                      Find Tutors
                    </Link>
                  </motion.div>
                </div>

                {/* Trust Layer */}
                <div className="mt-12 sm:mt-16 flex flex-col items-center border-t border-slate-200/60 pt-8">
                   <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-emerald-500" /> Trusted by 1000+ students across Nepal</p>
                   <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6">
                    <div className="flex flex-col items-center group">
                      <div className="flex items-center gap-2 font-black text-3xl text-slate-900 group-hover:text-blue-600 transition-colors">
                        <Users className="h-6 w-6 text-blue-500" /> {totalTutorsCount > 0 ? `${totalTutorsCount}+` : "..."}
                      </div>
                      <span className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-wider">Verified Tutors</span>
                    </div>
                    <div className="hidden h-10 w-px bg-slate-200 sm:block"></div>
                    <div className="flex flex-col items-center group">
                      <div className="flex items-center gap-2 font-black text-3xl text-slate-900 group-hover:text-emerald-600 transition-colors">
                        <GraduationCap className="h-6 w-6 text-emerald-500" /> {totalApplicationsCount > 0 ? `${totalApplicationsCount}+` : "..."}
                      </div>
                      <span className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-wider">Students Matched</span>
                    </div>
                  </div>
                </div>

              </div>
            </motion.section>

            {/* Mobile Sidebars */}
            <div className="xl:hidden w-full space-y-8 mt-2">
              <div>
                <div className="flex items-center justify-between mb-4 px-2">
                  <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2"><BadgeCheck className="w-5 h-5 text-blue-500" /> Top Tutors</h3>
                  <Link href="/tutors" className="text-sm font-bold text-blue-600 hover:text-blue-700">See All</Link>
                </div>
                <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-4 px-2 no-scrollbar">
                   {loading ? ( Array(3).fill(0).map((_, i) => <div key={i} className="snap-center"><SkeletonCard /></div>) ) : (
                     topTutors.map(tutor => (
                       <Link key={tutor.id} href={`/tutors/${tutor.id}`} className="snap-center shrink-0 w-[280px] bg-white rounded-3xl border border-slate-200 p-4 shadow-sm flex items-center gap-3 active:scale-95 transition-transform">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-slate-100 font-bold text-slate-600">{getInitials(tutor.name)}</div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-bold text-slate-900">{tutor.name || 'Anonymous'}</p>
                            <p className="truncate text-xs font-medium text-slate-500">{formatSubjects(tutor.subject)} • {tutor.experience}y</p>
                          </div>
                       </Link>
                     ))
                   )}
                </div>
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-4 px-2">
                  <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"/> Live Requests</h3>
                  <Link href="/vacancies" className="text-sm font-bold text-blue-600 hover:text-blue-700">See All</Link>
                </div>
                <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-4 px-2 no-scrollbar">
                   {loading ? ( Array(3).fill(0).map((_, i) => <div key={i} className="snap-center"><SkeletonCard /></div>) ) : (
                     vacancies.map(vacancy => (
                       <Link key={vacancy.id} href={`/vacancies/${vacancy.id}`} className={`snap-center shrink-0 w-[300px] bg-white rounded-3xl border ${vacancy.urgent ? 'border-orange-200 bg-orange-50' : 'border-slate-200'} p-4 shadow-sm flex items-center gap-3 active:scale-95 transition-transform`}>
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-50">{getSubjectIcon(vacancy.subject)}</div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-bold text-slate-900 flex items-center gap-1">{formatSubjects(vacancy.subject)} {vacancy.urgent && <Flame className="h-3 w-3 text-orange-500"/>}</p>
                            <p className="truncate text-xs font-medium text-slate-500 mt-1 flex items-center gap-1"><Map className="w-3 h-3"/> {vacancy.location || 'Remote'}</p>
                          </div>
                       </Link>
                     ))
                   )}
                </div>
              </div>
            </div>

            <motion.section variants={staggerContainer} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-50px" }} className="mt-4 sm:mt-10 rounded-[32px] sm:rounded-[48px] border border-white/60 bg-white/50 p-6 sm:p-12 shadow-[0_8px_32px_rgba(15,23,42,0.02)] backdrop-blur-xl">
              <div className="text-center mb-8 sm:mb-12">
                <h2 className="text-3xl font-extrabold text-slate-900 sm:text-4xl">How GyanHub Works</h2>
                <p className="mt-4 text-slate-600 font-medium text-sm sm:text-base max-w-2xl mx-auto">A secure marketplace designed to make finding education straightforward.</p>
              </div>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                <motion.div variants={staggerItem} className="group relative rounded-[32px] border border-white bg-white p-8 shadow-sm hover:shadow-[0_20px_40px_-15px_rgba(37,99,235,0.15)] flex flex-col items-center text-center transition-all duration-300 hover:-translate-y-2 hover:border-blue-100 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50 border border-slate-100 group-hover:scale-110 group-hover:bg-blue-50 group-hover:border-blue-200 transition-all duration-300">
                    <ShieldCheck className="h-8 w-8 text-slate-400 group-hover:text-blue-600 transition-colors" />
                  </div>
                  <h3 className="relative mb-3 text-xl font-bold text-slate-900">Tutor Discovery</h3>
                  <p className="relative text-sm font-medium leading-relaxed text-slate-500">Instantly browse and connect with verified experts suited perfectly to your learning needs.</p>
                </motion.div>

                <motion.div variants={staggerItem} className="group relative rounded-[32px] border border-white bg-white p-8 shadow-sm hover:shadow-[0_20px_40px_-15px_rgba(245,158,11,0.15)] flex flex-col items-center text-center transition-all duration-300 hover:-translate-y-2 hover:border-amber-100 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50 border border-slate-100 group-hover:scale-110 group-hover:bg-amber-50 group-hover:border-amber-200 transition-all duration-300">
                    <FileSpreadsheet className="h-8 w-8 text-slate-400 group-hover:text-amber-500 transition-colors" />
                  </div>
                  <h3 className="relative mb-3 text-xl font-bold text-slate-900">Post Vacancies</h3>
                  <p className="relative text-sm font-medium leading-relaxed text-slate-500">Broadcast your coaching requirements in seconds and receive immediate responses.</p>
                </motion.div>

                <motion.div variants={staggerItem} className="group relative rounded-[32px] border border-white bg-white p-8 shadow-sm hover:shadow-[0_20px_40px_-15px_rgba(16,185,129,0.15)] flex flex-col items-center text-center transition-all duration-300 hover:-translate-y-2 hover:border-emerald-100 overflow-hidden">
                   <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50 border border-slate-100 group-hover:scale-110 group-hover:bg-emerald-50 group-hover:border-emerald-200 transition-all duration-300">
                    <MonitorPlay className="h-8 w-8 text-slate-400 group-hover:text-emerald-500 transition-colors" />
                  </div>
                  <h3 className="relative mb-3 text-xl font-bold text-slate-900">Online Courses</h3>
                  <p className="relative text-sm font-medium leading-relaxed text-slate-500">Access high-quality, professional online courses to upgrade your technical skills.</p>
                </motion.div>
              </div>
            </motion.section>
          </div>

          {/* Right Sidebar: Desktop Only */}
          <aside className="hidden xl:block">
            <div className="sticky top-24 rounded-[32px] border border-white/60 bg-white/60 p-6 shadow-[0_8px_32px_rgba(37,99,235,0.04)] backdrop-blur-2xl">
              <div className="mb-5 flex items-center justify-between">
                <div><p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Real-time Feed</p><h3 className="text-xl font-extrabold text-slate-900 mt-1">Live Requests</h3></div>
                <div className="flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1">
                  <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span><span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span></span>
                  <span className="text-[10px] font-bold tracking-wide text-emerald-700">{activeVacanciesCount > 0 ? `${activeVacanciesCount} Active` : "Live"}</span>
                </div>
              </div>
              <div className="space-y-3 relative overflow-hidden h-[360px]">
                {loading ? ( Array(4).fill(0).map((_, i) => <SkeletonCard key={i} />) ) : displayedVacancies.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center text-slate-400"><Search className="mb-2 h-8 w-8 opacity-20" /><p className="text-sm font-bold">No active requests.</p></div>
                ) : (
                  <AnimatePresence initial={false}>
                    {displayedVacancies.map((vacancy, idx) => (
                      <motion.div key={vacancy.id} layout initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.4, ease: smoothEase }} className="absolute w-full" style={{ top: `${idx * 88}px` }}>
                        <Link href={`/vacancies/${vacancy.id}`} className={`group block rounded-2xl border ${vacancy.urgent ? 'border-orange-200 bg-orange-50/80 hover:border-orange-300' : 'border-white/80 bg-white/80 hover:border-blue-200'} p-4 transition-all duration-300 hover:bg-white hover:shadow-[0_10px_20px_rgba(0,0,0,0.05)] hover:scale-[1.02]`}>
                          <div className="flex items-center gap-3">
                            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border ${vacancy.urgent ? 'bg-orange-100/50 border-orange-200' : 'bg-slate-50 border-slate-100'} transition-colors`}>{getSubjectIcon(vacancy.subject)}</div>
                            <div className="min-w-0 flex-1">
                              <p className={`truncate font-bold text-sm flex items-center gap-1.5 transition-colors ${vacancy.urgent ? 'text-orange-700' : 'text-slate-900 group-hover:text-blue-600'}`}>{formatSubjects(vacancy.subject)} {vacancy.urgent && <Flame className="h-3.5 w-3.5 text-orange-500" />}</p>
                              <div className="flex items-center justify-between mt-0.5">
                                <p className="truncate text-xs font-medium text-slate-500">{vacancy.location || 'Remote'}</p>
                                <p suppressHydrationWarning className="text-[9px] font-black uppercase text-emerald-600 flex items-center gap-1"><Clock className="w-3 h-3" /> {formatPostedTime(vacancy.created_at)}</p>
                              </div>
                            </div>
                          </div>
                        </Link>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                )}
              </div>
              <Link href="/vacancies" className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-100/50 border border-slate-200/50 px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-100">View All Vacancies <ArrowRight className="h-4 w-4" /></Link>
            </div>
          </aside>
        </div>
      </div>

      {/* Expandable Mobile Floating Action Button */}
      <div className="fixed bottom-6 right-6 z-[90] xl:hidden flex flex-col items-end">
        <AnimatePresence>
          {isFabOpen && (
            <motion.div 
              initial={{ opacity: 0, y: 20, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.9 }} transition={{ duration: 0.2 }}
              className="flex flex-col gap-3 mb-4 items-end"
            >
              <Link href="/post-tuition" onClick={() => setIsFabOpen(false)} className="flex items-center gap-3 bg-slate-900 text-white px-5 py-3.5 rounded-2xl font-bold shadow-xl active:scale-95 transition-transform text-sm">
                <span>Post Tuition</span> <Plus className="w-4 h-4" />
              </Link>
              <Link href="/tutors" onClick={() => setIsFabOpen(false)} className="flex items-center gap-3 bg-white text-slate-900 border border-slate-200 px-5 py-3.5 rounded-2xl font-bold shadow-xl active:scale-95 transition-transform text-sm">
                <span>Find Tutors</span> <Users className="w-4 h-4" />
              </Link>
              <Link href="/online-courses" onClick={() => setIsFabOpen(false)} className="flex items-center gap-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-5 py-3.5 rounded-2xl font-bold shadow-xl active:scale-95 transition-transform text-sm">
                <span>Online Classes</span> <MonitorPlay className="w-4 h-4" />
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
        
        <motion.button 
          whileTap={{ scale: 0.9 }} 
          onClick={() => setIsFabOpen(!isFabOpen)} 
          className={`flex h-16 w-16 items-center justify-center rounded-full shadow-[0_10px_25px_rgba(37,99,235,0.4)] text-white transition-colors duration-300 ${isFabOpen ? 'bg-slate-900' : 'bg-blue-600'}`}
        >
          <Plus className={`h-7 w-7 transition-transform duration-300 ${isFabOpen ? 'rotate-45' : ''}`} />
        </motion.button>
      </div>

      {/* Overlay for FAB */}
      <AnimatePresence>
        {isFabOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setIsFabOpen(false)}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[80] xl:hidden"
          />
        )}
      </AnimatePresence>
      
    </main>
  );
}