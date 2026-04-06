'use client';

import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { 
  MapPin, Clock, CalendarDays, ShieldCheck, Share2, 
  UserCircle2, GraduationCap, Laptop, Home, Building2, 
  Send, Loader2, AlertCircle, Calculator, Languages, Atom, Code2, 
  FileSpreadsheet, LineChart, Globe2, Music, Palette, BookOpen, 
  CheckCircle2, Home as HomeIcon, ChevronDown, ArrowRight, Flame,
  Map as MapIcon, Link as LinkIcon, ChevronRight
} from "lucide-react";

// --- INTERFACES ---
export interface Vacancy {
  id: number;
  subject: string;
  location: string;
  class_level: string;
  description: string;
  salary_range: string;
  class_time: string;
  days_a_week: string;
  student_gender_pref?: string;
  tuition_type?: string;
  status?: boolean; 
  urgency?: boolean; 
  created_at?: string;
  contact_name?: string; 
}

// --- UTILS ---
function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function formatSalary(salary?: string) {
  if (!salary || salary.trim() === '') return "Negotiable";
  let cleanStr = salary.replace(/(rs\.?|rupees)\s*/gi, '').trim();
  if (cleanStr.includes('-')) {
    const parts = cleanStr.split('-').map(p => p.trim());
    const formattedParts = parts.map(p => {
      const num = Number(p.replace(/,/g, ''));
      return isNaN(num) || p === '' ? p : num.toLocaleString('en-IN');
    });
    return `Rs. ${formattedParts.join(' - ')}`;
  } else {
    const num = Number(cleanStr.replace(/,/g, ''));
    return isNaN(num) || cleanStr === '' ? `Rs. ${cleanStr}` : `Rs. ${num.toLocaleString('en-IN')}`;
  }
}

function formatRelativeTime(dateString?: string, isUrgent?: boolean) {
  if (!dateString) return "Recently posted";
  const now = new Date();
  const then = new Date(dateString);
  const diffMs = now.getTime() - then.getTime();
  if (Number.isNaN(diffMs)) return "Recently posted";

  const days = Math.floor(diffMs / 86400000);
  const urgencySuffix = isUrgent ? " → May close soon" : "";

  if (diffMs < 3600000) return `Posted just now${urgencySuffix}`;
  if (diffMs < 86400000) return `Posted today${urgencySuffix}`;
  if (days === 1) return `Posted yesterday${urgencySuffix}`;
  if (days < 7) return `Posted ${days} days ago${urgencySuffix}`;
  return `Posted on ${then.toLocaleDateString()}`;
}

function getSubjectConfig(subject?: string) {
  const s = (subject || "").toLowerCase();
  if (s.includes("math") || s.includes("calc")) return { icon: Calculator, color: "text-blue-600", bg: "bg-blue-100/50", border: "group-hover:border-blue-200" };
  if (s.includes("science") || s.includes("physics") || s.includes("bio")) return { icon: Atom, color: "text-indigo-600", bg: "bg-indigo-100/50", border: "group-hover:border-indigo-200" };
  if (s.includes("english") || s.includes("nepali")) return { icon: Languages, color: "text-emerald-600", bg: "bg-emerald-100/50", border: "group-hover:border-emerald-200" };
  if (s.includes("computer") || s.includes("it ") || s.includes("code")) return { icon: Code2, color: "text-slate-700", bg: "bg-slate-100", border: "group-hover:border-slate-300" };
  if (s.includes("excel") || s.includes("spreadsheet")) return { icon: FileSpreadsheet, color: "text-amber-600", bg: "bg-amber-100/50", border: "group-hover:border-amber-200" };
  if (s.includes("account") || s.includes("finance")) return { icon: LineChart, color: "text-cyan-600", bg: "bg-cyan-100/50", border: "group-hover:border-cyan-200" };
  if (s.includes("geo") || s.includes("social")) return { icon: Globe2, color: "text-teal-600", bg: "bg-teal-100/50", border: "group-hover:border-teal-200" };
  if (s.includes("music") || s.includes("art")) return { icon: Palette, color: "text-rose-600", bg: "bg-rose-100/50", border: "group-hover:border-rose-200" };
  
  return { icon: BookOpen, color: "text-orange-600", bg: "bg-orange-100/50", border: "group-hover:border-orange-200" };
}

// [SEO FIX] Helper function to generate SEO-friendly URLs for Similar Vacancies
const generateVacancySeoSlug = (vacancy: Vacancy) => {
  if (!vacancy) return '';
  const subject = vacancy.subject || 'tuition';
  const location = vacancy.location || 'nepal';
  
  // Combine, make lowercase, and replace spaces/symbols with hyphens
  const safeString = `${subject}-${location}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  
  return `${vacancy.id}-${safeString}`;
};

function FormattedDescription({ text }: { text: string }) {
  const lines = text.split('\n');
  
  return (
    <div className="space-y-3 text-[15px] leading-[1.8] text-slate-600 font-medium">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={idx} className="h-2" />;
        
        if (trimmed.endsWith(':') || (trimmed === trimmed.toUpperCase() && trimmed.length > 5)) {
          return <h4 key={idx} className="font-black text-slate-900 mt-6 mb-2 text-base">{trimmed}</h4>;
        }
        
        if (trimmed.startsWith('-') || trimmed.startsWith('•') || trimmed.startsWith('*')) {
          return (
            <div key={idx} className="flex gap-3 items-start relative pl-2">
              <span className="h-1.5 w-1.5 rounded-full bg-orange-500 mt-2.5 shrink-0 absolute left-0" />
              <span className="pl-3">{trimmed.substring(1).trim()}</span>
            </div>
          );
        }
        
        return <p key={idx}>{trimmed}</p>;
      })}
    </div>
  );
}

function ExpandableDescription({ text }: { text: string }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isLong = text.length > 300;

  return (
    <div className="relative">
      <motion.div 
        animate={{ maxHeight: isExpanded || !isLong ? 2000 : 250 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="overflow-hidden"
      >
        <FormattedDescription text={text} />
      </motion.div>
      
      {!isExpanded && isLong && (
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white via-white/80 to-transparent pointer-events-none" />
      )}
      
      {isLong && (
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          aria-expanded={isExpanded}
          aria-label={isExpanded ? "Show less description" : "Read full description"}
          className="relative mt-2 flex items-center gap-1.5 text-[11px] font-black uppercase tracking-[0.15em] text-orange-600 hover:text-orange-700 transition-colors z-10"
        >
          {isExpanded ? "Show Less" : "Read Full Description"}
          <ChevronDown className={cn("h-4 w-4 transition-transform duration-300", isExpanded && "rotate-180")} />
        </button>
      )}
    </div>
  );
}

function VacancySkeleton() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-28 lg:pb-20 animate-pulse">
      <div className="bg-white border-b border-slate-200">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="h-4 w-48 bg-slate-200 rounded mb-6" />
          <div className="flex gap-5">
            <div className="h-16 w-16 rounded-[24px] bg-slate-200" />
            <div className="space-y-4 flex-1">
              <div className="h-10 w-3/4 max-w-md bg-slate-200 rounded-lg" />
              <div className="h-4 w-64 bg-slate-100 rounded" />
            </div>
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[1fr_380px] items-start">
          <div className="space-y-12">
            <div><div className="h-6 w-40 bg-slate-200 rounded mb-4" /><div className="grid grid-cols-2 gap-4 sm:grid-cols-3">{[1, 2, 3].map(i => (<div key={i} className="h-28 rounded-[24px] bg-slate-200/50" />))}</div></div>
            <div><div className="h-6 w-40 bg-slate-200 rounded mb-4" /><div className="h-24 rounded-[24px] bg-slate-200/50" /></div>
            <div><div className="h-6 w-40 bg-slate-200 rounded mb-4" /><div className="h-48 rounded-[32px] bg-slate-200/50" /></div>
          </div>
          <div className="hidden lg:block space-y-6">
            <div className="h-64 rounded-[32px] bg-slate-200/50" />
            <div className="h-32 rounded-[24px] bg-slate-200/50" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VacancyDetailClient() {
  const params = useParams();
  
  // [SEO FIX] Extract the slug and ID from the URL params
  const rawSlug = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const idString = rawSlug ? rawSlug.split('-')[0] : null;
  const numericId = Number(idString);

  const router = useRouter();
  const supabase = createClient();

  const [vacancy, setVacancy] = useState<Vacancy | null>(null);
  const [similarVacancies, setSimilarVacancies] = useState<Vacancy[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [hasApplied, setHasApplied] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  useEffect(() => {
    if (!numericId) return;

    const fetchData = async () => {
      setLoading(true);
      setAuthLoading(true);

      const { data: vacancyData, error: vacancyError } = await supabase
        .from("vacancies")
        .select("*")
        .eq("id", numericId)
        .single();

      if (!vacancyError && vacancyData) {
        setVacancy(vacancyData);
        
        const { data: similarData } = await supabase
          .from("vacancies")
          .select("id, subject, location, class_level, salary_range, urgency, tuition_type")
          .neq("id", numericId)
          .or(`subject.ilike.%${vacancyData.subject}%,class_level.eq.${vacancyData.class_level}`)
          .limit(3);
          
        if (similarData) setSimilarVacancies(similarData as Vacancy[]);
      }

      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user && vacancyData) {
        const { data: applicationData } = await supabase
          .from("vacancy_applications")
          .select("id")
          .eq("vacancy_id", numericId)
          .eq("user_id", user.id)
          .single();

        if (applicationData) setHasApplied(true);
      }

      setLoading(false);
      setAuthLoading(false);
    };

    fetchData();
  }, [numericId, supabase]);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleShare = async () => {
    const shareUrl = typeof window !== "undefined" ? window.location.href : "";
    const shareTitle = vacancy?.subject ? `${vacancy.subject} tuition on GyanHub` : "GyanHub vacancy";

    try {
      if (navigator.share) {
        await navigator.share({ title: shareTitle, url: shareUrl });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        triggerToast("Link copied to clipboard");
      }
    } catch (error) {
      console.error("Share failed:", error);
    }
  };

  const renderActionButton = (isMobile = false) => {
    const baseClass = cn(
      "group relative overflow-hidden flex items-center justify-center gap-2 text-sm sm:text-base font-black transition-all duration-300",
      isMobile ? "w-full py-3.5 rounded-2xl" : "w-full py-4 rounded-[20px]"
    );

    if (authLoading) {
      return (
        <button disabled aria-label="Loading authentication status" className={cn(baseClass, "bg-slate-100/50 text-slate-400 animate-pulse border border-slate-200")}>
          <Loader2 className="h-5 w-5 animate-spin" /> Checking...
        </button>
      );
    }

    if (!user) {
      return (
        // [SEO FIX] Ensure redirect uses the slug
        <Link href={`/login?redirect=/vacancies/${rawSlug}`} aria-label="Sign in to apply" className={cn(baseClass, "bg-slate-900 text-white !text-white shadow-xl hover:-translate-y-1 hover:shadow-2xl active:scale-95")}>
          <UserCircle2 className="h-5 w-5" /> <span>Sign In to Apply</span>
        </Link>
      );
    }

    if (hasApplied) {
      return (
        <div className={cn(baseClass, "bg-emerald-50 text-emerald-600 border border-emerald-200 shadow-sm cursor-default")} aria-label="Application already sent">
          <CheckCircle2 className="h-5 w-5" /> Application Sent
        </div>
      );
    }

    return (
      // [SEO FIX] Ensure apply action uses the slug
      <Link href={`/vacancies/${rawSlug}/apply`} aria-label={`Apply for ${vacancy?.subject} vacancy`} className={cn(baseClass, "bg-gradient-to-r from-orange-500 to-orange-600 text-white !text-white shadow-[0_10px_25px_rgba(249,115,22,0.3)] hover:-translate-y-1 hover:shadow-[0_15px_30px_rgba(249,115,22,0.4)] active:scale-95")}>
        <div className="absolute inset-0 bg-white/20 scale-0 group-hover:scale-150 rounded-full transition-transform duration-700 ease-out opacity-0 group-hover:opacity-100 origin-center" />
        <span className="relative z-10">Apply Now</span> <Send className="h-4 w-4 relative z-10 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
      </Link>
    );
  };

  if (loading) return <VacancySkeleton />;

  if (!vacancy) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC]">
        <AlertCircle className="h-16 w-16 text-slate-300 mb-4" />
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Vacancy Not Found</h1>
        <p className="text-slate-500 mt-2 font-medium">This job may have been filled or removed.</p>
        <button onClick={() => router.push('/vacancies')} aria-label="Go back to vacancies page" className="mt-8 text-sm font-black uppercase tracking-widest text-orange-600 hover:text-orange-700 transition-colors">
          ← Back to Vacancies
        </button>
      </div>
    );
  }

  const isUrgent = vacancy.urgency === true;
  const isOnline = vacancy.tuition_type?.toLowerCase().includes('online');
  const ModeIcon = isOnline ? Laptop : vacancy.tuition_type?.toLowerCase().includes('home') ? Home : Building2;
  const SubConfig = getSubjectConfig(vacancy.subject);

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-32 lg:pb-20 relative">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {showToast && (
          <motion.div 
            initial={{ opacity: 0, y: -50, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -20, scale: 0.9 }}
            role="alert"
            className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-2 bg-slate-900 text-white px-5 py-3 rounded-full shadow-2xl font-bold text-sm"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400" /> {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Section */}
      <div className="bg-white border-b border-slate-200 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 to-white pointer-events-none" />
        
        <div className="relative z-10 mx-auto max-w-7xl px-4 py-8 sm:px-10 lg:px-8">
          <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
            <Link href="/" className="hover:text-orange-600 transition-colors flex items-center gap-1.5"><HomeIcon className="h-3 w-3" /> Home</Link>
            <span className="text-slate-300 font-light text-sm" aria-hidden="true">/</span>
            <Link href="/vacancies" className="hover:text-orange-600 transition-colors">Vacancies</Link>
            <span className="text-slate-300 font-light text-sm" aria-hidden="true">/</span>
            <span className="text-slate-900 truncate max-w-[120px] sm:max-w-none" aria-current="page">{vacancy.subject}</span>
          </nav>

          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex gap-5 sm:gap-6 w-full lg:w-auto">
              <motion.div whileHover={{ scale: 1.05, rotate: -5 }} className={cn("flex h-16 w-16 sm:h-20 sm:w-20 shrink-0 items-center justify-center rounded-[20px] sm:rounded-[24px] shadow-sm border", SubConfig.bg, SubConfig.color, SubConfig.border)}>
                <SubConfig.icon className="h-8 w-8 sm:h-10 sm:w-10" aria-hidden="true" />
              </motion.div>
              <div className="pt-1 flex-1">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-2">
                  <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">{vacancy.subject}</h1>
                  {isUrgent && (
                    <div className="inline-flex w-fit items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-1 text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-rose-600 border border-rose-100">
                      <Flame className="w-3 h-3" /> Urgent
                    </div>
                  )}
                </div>
                
                <p className="text-sm font-bold text-slate-600 mb-4 flex items-center gap-1.5">
                  <UserCircle2 className="w-4 h-4 text-slate-400" /> 
                  Posted by <span className="text-slate-900">{vacancy.contact_name || "Anonymous Parent/Student"}</span>
                </p>
                
                <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] sm:text-sm font-bold text-slate-500">
                  <div className="flex items-center gap-1.5"><MapPin className="h-4 w-4 text-slate-400" /> {vacancy.location}</div>
                  <div className="flex items-center gap-1.5"><Clock className="h-4 w-4 text-slate-400" /> {formatRelativeTime(vacancy.created_at, isUrgent)}</div>
                </div>
              </div>
            </div>

            <div className="hidden lg:flex items-center gap-3 w-72 shrink-0">
                {renderActionButton(false)}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:gap-12 lg:grid-cols-[1fr_380px] items-start">
          
          <main className="space-y-8 sm:space-y-12">
            
            <section>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 mb-5 flex items-center gap-3">
                <div className="p-1.5 sm:p-2 rounded-xl bg-orange-100/50 text-orange-500"><UserCircle2 className="h-5 w-5" /></div> 
                Student Profile
              </h2>
              <div className="grid grid-cols-2 gap-4 sm:gap-5 sm:grid-cols-3">
                <motion.div whileHover={{ y: -5 }} className="group rounded-[24px] sm:rounded-[28px] bg-white p-5 sm:p-6 border border-slate-200/60 shadow-sm hover:border-blue-200 hover:shadow-lg transition-all">
                  <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl sm:rounded-2xl bg-blue-50 flex items-center justify-center mb-3 sm:mb-4 text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                    <GraduationCap className="h-5 w-5 sm:h-6 sm:w-6" />
                  </div>
                  <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Class Level</p>
                  <p className="text-sm sm:text-base font-black text-slate-900 truncate">{vacancy.class_level || 'Not Specified'}</p>
                </motion.div>
                <motion.div whileHover={{ y: -5 }} className="group rounded-[24px] sm:rounded-[28px] bg-white p-5 sm:p-6 border border-slate-200/60 shadow-sm hover:border-emerald-200 hover:shadow-lg transition-all">
                  <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl sm:rounded-2xl bg-emerald-50 flex items-center justify-center mb-3 sm:mb-4 text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                    <ModeIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                  </div>
                  <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Tuition Type</p>
                  <p className="text-sm sm:text-base font-black text-slate-900 truncate">{vacancy.tuition_type || 'Any Mode'}</p>
                </motion.div>
                <motion.div whileHover={{ y: -5 }} className="group rounded-[24px] sm:rounded-[28px] bg-white p-5 sm:p-6 border border-slate-200/60 shadow-sm hover:border-purple-200 hover:shadow-lg transition-all col-span-2 sm:col-span-1">
                  <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl sm:rounded-2xl bg-purple-50 flex items-center justify-center mb-3 sm:mb-4 text-purple-500 group-hover:bg-purple-500 group-hover:text-white transition-colors">
                    <UserCircle2 className="h-5 w-5 sm:h-6 sm:w-6" />
                  </div>
                  <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Gender Pref.</p>
                  <p className="text-sm sm:text-base font-black text-slate-900 truncate">{vacancy.student_gender_pref || 'No Preference'}</p>
                </motion.div>
              </div>
            </section>

            <section>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 mb-5 flex items-center gap-3">
                <div className="p-1.5 sm:p-2 rounded-xl bg-blue-100/50 text-blue-500"><MapIcon className="h-5 w-5" /></div>
                Location Map
              </h2>
              <div className="relative w-full h-48 sm:h-64 bg-slate-100 rounded-[28px] overflow-hidden border border-slate-200 group">
                {isOnline ? (
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-600 flex flex-col items-center justify-center text-white p-6 text-center">
                    <Globe2 className="w-16 h-16 opacity-50 mb-3" />
                    <h3 className="font-black text-2xl tracking-tight">Online Tuition</h3>
                    <p className="font-medium opacity-80 mt-1 text-sm">Teach from anywhere in the world.</p>
                  </div>
                ) : (
                  <a 
                    // [SEO FIX] Fixed map URL template string
                    href={`https://maps.google.com/?q=${encodeURIComponent(vacancy.location)}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    aria-label={`Open map for ${vacancy.location}`}
                    className="absolute inset-0 block cursor-pointer"
                  >
                    <img 
                      src="https://zuktarghyexwodqnnxlu.supabase.co/storage/v1/object/public/others/street%20view.jpg" 
                      alt="Map representation of vacancy location" 
                      className="w-full h-full object-cover opacity-50 filter grayscale-[40%] group-hover:grayscale-0 group-hover:opacity-70 transition-all duration-300" 
                    />
                    <div className="absolute inset-0 bg-slate-900/5 group-hover:bg-transparent transition-colors duration-300" />
                    
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="relative group-hover:-translate-y-2 transition-transform duration-300 flex flex-col items-center">
                        <div className="bg-slate-900 text-white px-4 py-2 rounded-xl font-bold text-sm shadow-2xl flex items-center gap-2 mb-2">
                          <MapPin className="w-4 h-4 text-orange-400" /> {vacancy.location}
                        </div>
                        <div className="w-4 h-4 bg-slate-900 rotate-45 -mt-4 shadow-xl" />
                      </div>
                    </div>
                  </a>
                )}
              </div>
            </section>

            <section>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 mb-5 flex items-center gap-3">
                <div className="p-1.5 sm:p-2 rounded-xl bg-emerald-100/50 text-emerald-600"><BookOpen className="h-5 w-5" /></div>
                Job Description
              </h2>
              <div className="rounded-[32px] sm:rounded-[36px] bg-white p-6 sm:p-10 border border-slate-200/60 shadow-sm">
                <ExpandableDescription text={vacancy.description || 'No detailed description provided.'} />
              </div>
            </section>

            {similarVacancies.length > 0 && (
              <section className="pt-8 border-t border-slate-200/60">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg sm:text-xl font-black text-slate-900">Similar Requests</h2>
                </div>
                <div className="flex overflow-x-auto gap-4 pb-4 snap-x no-scrollbar">
                  {similarVacancies.map((sim) => {
                    const Conf = getSubjectConfig(sim.subject);
                    return (
                      <Link 
                        key={sim.id} 
                        // [SEO FIX] Use generateVacancySeoSlug for programmatic routing
                        href={`/vacancies/${generateVacancySeoSlug(sim)}`} 
                        aria-label={`View similar vacancy for ${sim.subject}`}
                        className="snap-center shrink-0 w-[280px] bg-white rounded-3xl border border-slate-200/60 p-5 shadow-sm hover:shadow-md hover:border-slate-300 active:scale-95 transition-all"
                      >
                        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-4", Conf.bg, Conf.color)}>
                          <Conf.icon className="w-5 h-5" />
                        </div>
                        <h4 className="font-bold text-slate-900 truncate mb-1 text-sm">{sim.subject}</h4>
                        <p className="text-xs font-medium text-slate-500 mb-4 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5"/> {sim.location || 'Remote'}</p>
                        <div className="flex items-center justify-between mt-auto">
                          <span className="text-xs font-black text-orange-600 bg-orange-50 px-2 py-1 rounded-lg">{formatSalary(sim.salary_range)}</span>
                          <ChevronRight className="w-4 h-4 text-slate-300" />
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </section>
            )}

          </main>

          <aside className="hidden lg:block lg:sticky lg:top-8 lg:self-start space-y-6">
            
            <div className="rounded-[40px] bg-white border border-slate-200/60 p-8 shadow-sm">
              <div className="mb-6 flex flex-col items-center justify-center rounded-[24px] bg-orange-50/50 border border-orange-100/50 p-6 text-center">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-500 mb-2">Monthly Salary</p>
                <p className="text-3xl font-black text-slate-900 tracking-tight leading-tight w-full break-words">
                  {formatSalary(vacancy.salary_range)}
                </p>
              </div>

              {renderActionButton(false)}
              
              <div className="mt-6 pt-6 border-t border-slate-100">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4 text-center">Summary</h3>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50/80 border border-slate-100">
                    <Clock className="h-4 w-4 text-indigo-500 shrink-0" />
                    <div className="flex-1 min-w-0"><p className="text-[9px] font-black uppercase text-slate-400">Timing</p><p className="text-xs font-bold text-slate-700 truncate">{vacancy.class_time || 'Flexible'}</p></div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50/80 border border-slate-100">
                    <CalendarDays className="h-4 w-4 text-purple-500 shrink-0" />
                    <div className="flex-1 min-w-0"><p className="text-[9px] font-black uppercase text-slate-400">Days/Week</p><p className="text-xs font-bold text-slate-700 truncate">{vacancy.days_a_week || 'TBD'}</p></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-[32px] bg-emerald-50/50 border border-emerald-100/50 p-6 flex gap-4 shadow-sm">
               <ShieldCheck className="h-8 w-8 text-emerald-500 shrink-0 mt-1" />
               <div>
                 <h4 className="font-black text-emerald-900 text-sm tracking-tight">GyanHub Guarantee</h4>
                 <p className="mt-1 text-[11px] font-bold text-emerald-700/80 leading-relaxed">Verified Listing. This client is pre-screened by our team.</p>
               </div>
            </div>

          </aside>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-3xl border-t border-slate-200 p-4 lg:hidden shadow-[0_-20px_40px_rgba(0,0,0,0.08)] pb-safe">
         <div className="mx-auto max-w-md flex items-center justify-between gap-3">
            <button aria-label="Share vacancy link" onClick={handleShare} className="flex flex-col items-center justify-center w-14 h-12 rounded-2xl bg-slate-50 border border-slate-200 text-slate-500 active:scale-95 transition-transform shrink-0">
              <Share2 className="w-5 h-5" />
            </button>
            <div className="flex-1 min-w-0 hidden sm:block px-2">
               <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mb-0.5">Salary</p>
               <p className="text-base font-black text-slate-900 truncate tracking-tight">{formatSalary(vacancy.salary_range)}</p>
            </div>
            <div className="flex-[2] flex w-full">
              {renderActionButton(true)}
            </div>
         </div>
      </div>

    </div>
  );
}