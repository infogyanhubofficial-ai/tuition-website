'use client';

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
// FIX: Use the secure SSR-compatible client
import { createClient } from "@/lib/supabase/client";
import { 
  MapPin, 
  Clock, 
  CalendarDays, 
  ShieldCheck, 
  Share2, 
  Bookmark, 
  ChevronRight, 
  UserCircle2, 
  GraduationCap, 
  Laptop, 
  Home, 
  Building2, 
  Send, 
  Loader2, 
  AlertCircle,
  Calculator,
  Languages,
  Atom,
  Code2,
  FileSpreadsheet,
  LineChart,
  Globe2,
  Music,
  Palette,
  BookOpen,
  CheckCircle2,
  Home as HomeIcon,
  ChevronDown
} from "lucide-react";

interface Vacancy {
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
  status?: boolean; // FIX: Changed from string to boolean
  urgency?: boolean; // Added to match your new DB schema
  created_at?: string;
}

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

// IMPROVED: Cleans redundant "Rs", handles ranges, and adds comma formatting
function formatSalary(salary?: string) {
  if (!salary || salary.trim() === '') return "Negotiable";
  
  // Remove existing "Rs", "Rs.", or "Rupees" to standardize
  let cleanStr = salary.replace(/(rs\.?|rupees)\s*/gi, '').trim();
  
  // Handle ranges separated by a dash
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

function formatRelativeTime(dateString?: string) {
  if (!dateString) return "Recently posted";
  const now = new Date();
  const then = new Date(dateString);
  const diffMs = now.getTime() - then.getTime();
  if (Number.isNaN(diffMs)) return "Recently posted";

  const minutes = Math.floor(diffMs / 60000);
  const hours = Math.floor(diffMs / 3600000);
  const days = Math.floor(diffMs / 86400000);

  if (minutes < 1) return "Posted just now";
  if (minutes < 60) return `Posted ${minutes} mins ago`;
  if (hours < 24) return hours === 1 ? "Posted 1 hour ago" : `Posted ${hours} hours ago`;
  if (days === 1) return "Posted yesterday";
  if (days < 7) return `Posted ${days} days ago`;
  return `Posted on ${then.toLocaleDateString()}`;
}

function getSubjectIcon(subject?: string) {
  const s = (subject || "").toLowerCase();
  if (s.includes("math") || s.includes("calc")) return <Calculator className="h-8 w-8" strokeWidth={1.5} />;
  if (s.includes("science") || s.includes("physics") || s.includes("bio")) return <Atom className="h-8 w-8" strokeWidth={1.5} />;
  if (s.includes("english") || s.includes("nepali") || s.includes("language")) return <Languages className="h-8 w-8" strokeWidth={1.5} />;
  if (s.includes("computer") || s.includes("code") || s.includes("programming")) return <Code2 className="h-8 w-8" strokeWidth={1.5} />;
  if (s.includes("excel") || s.includes("spreadsheet")) return <FileSpreadsheet className="h-8 w-8" strokeWidth={1.5} />;
  if (s.includes("account") || s.includes("finance") || s.includes("business")) return <LineChart className="h-8 w-8" strokeWidth={1.5} />;
  if (s.includes("geo") || s.includes("social") || s.includes("history")) return <Globe2 className="h-8 w-8" strokeWidth={1.5} />;
  if (s.includes("music") || s.includes("guitar")) return <Music className="h-8 w-8" strokeWidth={1.5} />;
  if (s.includes("art") || s.includes("design")) return <Palette className="h-8 w-8" strokeWidth={1.5} />;
  return <BookOpen className="h-8 w-8" strokeWidth={1.5} />;
}

// Custom Progressive Disclosure Component for Description
function ExpandableDescription({ text }: { text: string }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isLong = text.length > 400;

  return (
    <div className="relative">
      <div className={cn(
        "prose prose-slate max-w-none text-[15px] leading-[1.8] text-slate-600 font-medium whitespace-pre-wrap transition-all duration-500",
        !isExpanded && isLong && "max-h-[200px] overflow-hidden"
      )}>
        {text}
      </div>
      {!isExpanded && isLong && (
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent pointer-events-none" />
      )}
      {isLong && (
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-4 flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-orange-600 hover:text-orange-700 transition-colors"
        >
          {isExpanded ? "Show Less" : "Read Full Description"}
          <ChevronDown className={cn("h-4 w-4 transition-transform duration-300", isExpanded && "rotate-180")} />
        </button>
      )}
    </div>
  );
}

// High Fidelity Skeleton
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
            <div>
              <div className="h-6 w-40 bg-slate-200 rounded mb-4" />
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-28 rounded-[24px] bg-slate-200/50" />
                ))}
              </div>
            </div>
            <div>
              <div className="h-6 w-40 bg-slate-200 rounded mb-4" />
              <div className="h-24 rounded-[24px] bg-slate-200/50" />
            </div>
            <div>
              <div className="h-6 w-40 bg-slate-200 rounded mb-4" />
              <div className="h-48 rounded-[32px] bg-slate-200/50" />
            </div>
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

export default function VacancyDetailPage() {
  const params = useParams();
  const rawId = params?.id;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;
  const router = useRouter();

  // FIX: Initialize the secure client inside the component
  const supabase = createClient();

  const [vacancy, setVacancy] = useState<Vacancy | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  
  const [user, setUser] = useState<any>(null);
  const [hasApplied, setHasApplied] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      setLoading(true);
      setAuthLoading(true);

      const { data: vacancyData, error: vacancyError } = await supabase
        .from("vacancies")
        .select("*")
        .eq("id", Number(id))
        .single();

      if (!vacancyError && vacancyData) {
        setVacancy(vacancyData);
      }

      // FIX: Securely gets user from server cookies instead of local storage
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user && vacancyData) {
        const { data: applicationData } = await supabase
          .from("vacancy_applications")
          .select("id")
          .eq("vacancy_id", Number(id))
          .eq("user_id", user.id)
          .single();

        if (applicationData) {
          setHasApplied(true);
        }
      }

      setLoading(false);
      setAuthLoading(false);
      
      setIsSaved(window.localStorage.getItem(`gh_saved_vacancy_${id}`) === "1");
    };

    fetchData();
  }, [id, supabase]);

  const handleSave = () => {
    if (!id) return;
    const next = !isSaved;
    setIsSaved(next);
    window.localStorage.setItem(`gh_saved_vacancy_${id}`, next ? "1" : "0");
  };

  const handleShare = async () => {
    const shareUrl = typeof window !== "undefined" ? window.location.href : "";
    const shareTitle = vacancy?.subject ? `${vacancy.subject} tuition on GyanHub` : "GyanHub vacancy";

    try {
      if (navigator.share) {
        await navigator.share({ title: shareTitle, url: shareUrl });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        alert("Vacancy link copied to clipboard.");
      }
    } catch (error) {
      console.error("Share failed:", error);
    }
  };

  const renderActionButton = (isMobile = false) => {
    const baseClass = cn(
      "group relative overflow-hidden flex w-full items-center justify-center gap-2 rounded-[20px] text-base font-black transition-all duration-300",
      isMobile ? "py-4" : "py-4"
    );

    if (authLoading) {
      return (
        <button disabled className={cn(baseClass, "bg-slate-100/50 text-slate-400 animate-pulse border border-slate-200")}>
          <Loader2 className="h-5 w-5 animate-spin" /> Checking Status...
        </button>
      );
    }

    if (!user) {
      return (
        <Link 
          href={`/login?redirect=/vacancies/${id}`} 
          className={cn(baseClass, "bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600 text-white shadow-[0_8px_20px_rgba(249,115,22,0.3)] hover:-translate-y-1 hover:shadow-[0_12px_25px_rgba(249,115,22,0.4)] active:scale-95")}
        >
          {/* Subtle sweep animation layer */}
          <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.2)_50%,transparent_75%)] bg-[length:250%_250%] opacity-0 group-hover:opacity-100 group-hover:animate-shimmer" />
          <UserCircle2 className="h-5 w-5 relative z-10" /> <span className="relative z-10">Sign In to Apply</span>
        </Link>
      );
    }

    if (hasApplied) {
      return (
        <div className={cn(baseClass, "bg-emerald-50 text-emerald-600 border border-emerald-200 shadow-sm cursor-default")}>
          <CheckCircle2 className="h-5 w-5" /> Application Sent
        </div>
      );
    }

    return (
      <Link 
        href={`/vacancies/${id}/apply`}
        className={cn(baseClass, "bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600 text-white shadow-[0_8px_20px_rgba(249,115,22,0.3)] hover:-translate-y-1 hover:shadow-[0_12px_25px_rgba(249,115,22,0.4)] active:scale-95")}
      >
        <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.2)_50%,transparent_75%)] bg-[length:250%_250%] opacity-0 group-hover:opacity-100 group-hover:animate-[shimmer_2s_infinite_linear]" />
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
        <button onClick={() => router.push('/vacancies')} className="mt-8 text-sm font-black uppercase tracking-widest text-orange-600 hover:text-orange-700 transition-colors">
          ← Back to Vacancies
        </button>
      </div>
    );
  }

  // FIX: Status is now a boolean, check directly.
  const isUrgent = vacancy.urgency === true;
  const ModeIcon = vacancy.tuition_type?.toLowerCase().includes('online') ? Laptop : vacancy.tuition_type?.toLowerCase().includes('home') ? Home : Building2;

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-28 lg:pb-20">
      
      {/* Modern Hero Section with Subtle Mesh */}
      <div className="bg-white border-b border-slate-200 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-50/50 via-white to-blue-50/30 pointer-events-none" />
        
        {/* Abstract Mesh Blobs */}
        <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-[500px] h-[500px] bg-orange-200 rounded-full mix-blend-multiply filter blur-[80px] opacity-20 animate-blob pointer-events-none" />
        <div className="absolute bottom-0 left-0 translate-y-1/4 -translate-x-1/4 w-[400px] h-[400px] bg-blue-200 rounded-full mix-blend-multiply filter blur-[80px] opacity-20 animate-blob animation-delay-2000 pointer-events-none" />

        <div className="relative z-10 mx-auto max-w-7xl px-4 py-8 sm:px-10 lg:px-8">
          
          {/* Minimalist Breadcrumbs */}
          <nav className="mb-8 flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
            <Link href="/" className="hover:text-orange-600 transition-colors flex items-center gap-1.5"><HomeIcon className="h-3 w-3" /> Home</Link>
            <span className="text-slate-300 font-light text-sm">/</span>
            <Link href="/vacancies" className="hover:text-orange-600 transition-colors">Vacancies</Link>
            <span className="text-slate-300 font-light text-sm">/</span>
            <span className="text-slate-900 truncate max-w-[120px] sm:max-w-none">{vacancy.subject}</span>
          </nav>

          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div className="flex gap-6">
              {/* Wrapped Icon Blob */}
              <div className="group flex h-20 w-20 shrink-0 items-center justify-center rounded-[24px] bg-orange-100/50 text-orange-600 border border-orange-500/10 shadow-sm transition-transform duration-300 hover:scale-110">
                 {getSubjectIcon(vacancy.subject)}
              </div>
              <div className="pt-1">
                <div className="flex flex-wrap items-center gap-3 mb-3">
                  <h1 className="text-3xl font-black text-slate-900 tracking-tight sm:text-5xl">{vacancy.subject}</h1>
                  {isUrgent && (
                    <div className="relative flex items-center gap-1.5 rounded-full bg-rose-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-rose-600 border border-rose-100 shadow-sm overflow-hidden">
                      <div className="absolute inset-0 bg-rose-400 opacity-10 animate-pulse" />
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                      </span>
                      <span className="relative z-10">Urgent Hiring</span>
                    </div>
                  )}
                </div>
                
                <div className="flex flex-wrap items-center gap-x-5 gap-y-3 text-sm font-bold text-slate-500">
                  <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-slate-400" /> {vacancy.location}</div>
                  <div className="flex items-center gap-2 text-indigo-600 bg-indigo-50/80 border border-indigo-100/50 px-3 py-1.5 rounded-lg text-xs tracking-wide shadow-sm">
                    <Clock className="h-3.5 w-3.5" /> {formatRelativeTime(vacancy.created_at)}
                  </div>
                </div>
              </div>
            </div>

            {/* Interactive Save/Share Icons */}
            <div className="hidden md:flex items-center gap-3">
              <button 
                onClick={handleSave}
                className={cn(
                  "flex h-12 w-12 items-center justify-center rounded-full border transition-all duration-300 active:scale-90 shadow-sm", 
                  isSaved 
                    ? "border-orange-200 bg-orange-50 text-orange-600 shadow-orange-500/10" 
                    : "border-slate-200/80 bg-white/80 text-slate-400 hover:bg-orange-500 hover:text-white hover:border-orange-500 hover:shadow-orange-500/20"
                )}
              >
                <Bookmark className="h-5 w-5 transition-transform" fill={isSaved ? "currentColor" : "none"} />
              </button>
              <button 
                onClick={handleShare} 
                className="flex h-12 w-12 items-center justify-center rounded-full border border-slate-200/80 bg-white/80 text-slate-400 shadow-sm transition-all duration-300 hover:bg-blue-500 hover:text-white hover:border-blue-500 hover:shadow-blue-500/20 active:scale-90"
              >
                <Share2 className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[1fr_380px] items-start">
          
          <main className="space-y-12">
            
            {/* Visual Requirements Cards - Glassmorphism */}
            <section>
              <h2 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-3">
                <div className="p-2 rounded-xl bg-orange-100/50 text-orange-500"><UserCircle2 className="h-5 w-5" /></div> 
                Student Profile
              </h2>
              <div className="grid grid-cols-2 gap-5 sm:grid-cols-3">
                <div className="group rounded-[28px] bg-white/70 backdrop-blur-md p-6 border border-white/20 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(59,130,246,0.08)] transition-all">
                  <div className="h-12 w-12 rounded-2xl bg-blue-50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    <GraduationCap className="h-6 w-6 text-blue-500" />
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1.5">Class Level</p>
                  <p className="font-black text-slate-900">{vacancy.class_level || 'Not Specified'}</p>
                </div>
                <div className="group rounded-[28px] bg-white/70 backdrop-blur-md p-6 border border-white/20 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(16,185,129,0.08)] transition-all">
                  <div className="h-12 w-12 rounded-2xl bg-emerald-50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    <ModeIcon className="h-6 w-6 text-emerald-500" />
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1.5">Tuition Type</p>
                  <p className="font-black text-slate-900">{vacancy.tuition_type || 'Any Mode'}</p>
                </div>
                <div className="group rounded-[28px] bg-white/70 backdrop-blur-md p-6 border border-white/20 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(168,85,247,0.08)] transition-all col-span-2 sm:col-span-1">
                  <div className="h-12 w-12 rounded-2xl bg-purple-50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    <UserCircle2 className="h-6 w-6 text-purple-500" />
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1.5">Gender Pref.</p>
                  <p className="font-black text-slate-900">{vacancy.student_gender_pref || 'No Preference'}</p>
                </div>
              </div>
            </section>

            {/* Time & Commitment Timeline */}
            <section>
              <h2 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-3">
                <div className="p-2 rounded-xl bg-orange-100/50 text-orange-500"><CalendarDays className="h-5 w-5" /></div>
                Time & Commitment
              </h2>
              <div className="rounded-[32px] bg-white/70 backdrop-blur-md border border-white/20 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
                <div className="grid sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-100/50">
                  <div className="p-6 flex items-center gap-5">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[20px] bg-slate-100/50 text-slate-500 border border-white"><Clock className="h-5 w-5" /></div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Class Schedule</p>
                      <p className="font-black text-slate-900">{vacancy.class_time || 'Flexible Schedule'}</p>
                    </div>
                  </div>
                  <div className="p-6 flex items-center gap-5">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[20px] bg-slate-100/50 text-slate-500 border border-white"><CalendarDays className="h-5 w-5" /></div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Days Per Week</p>
                      <p className="font-black text-slate-900">{vacancy.days_a_week || 'To be decided'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Typography Polished Description with Progressive Disclosure */}
            <section>
              <h2 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-3">
                <div className="p-2 rounded-xl bg-orange-100/50 text-orange-500"><BookOpen className="h-5 w-5" /></div>
                Job Description
              </h2>
              <div className="rounded-[36px] bg-white/70 backdrop-blur-md p-8 sm:p-10 border border-white/20 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                <ExpandableDescription text={vacancy.description || 'No detailed description provided.'} />
              </div>
            </section>

          </main>

          {/* Sticky Sidebar with Layered Shadows */}
          <aside className="hidden lg:block lg:sticky lg:top-8 lg:self-start space-y-8">
            
            {/* Main Action Card */}
            <div className="rounded-[40px] border border-white/60 bg-white/70 backdrop-blur-xl p-8 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.14)]">
              
              {/* Highlighted Monthly Salary - FIXED WRAPPING AND PADDING */}
              <div className="mb-8 flex flex-col items-center justify-center rounded-[24px] bg-gradient-to-b from-orange-50/80 to-orange-50/30 border border-orange-100/60 p-6 text-center shadow-inner">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-500 mb-2">Monthly Salary</p>
                <p className="text-3xl font-black text-orange-600 tracking-tight leading-tight w-full break-words">
                  {formatSalary(vacancy.salary_range)}
                </p>
              </div>

              {/* Dynamic Auth/Status CTA */}
              {renderActionButton(false)}
              
              {/* Feature Grid 'At a Glance' - IMPROVED LIST LAYOUT */}
              <div className="mt-8 pt-8 border-t border-slate-100/80">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-5 text-center">At a Glance</h3>
                <div className="flex flex-col gap-3">
                  
                  {/* Location Stat */}
                  <div className="flex items-center gap-4 p-3 rounded-[20px] bg-slate-50/50 border border-slate-100/80 hover:bg-white transition-colors">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100/50 text-blue-600">
                      <MapPin className="h-4 w-4" strokeWidth={2} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-black uppercase text-slate-400 mb-0.5">Location</p>
                      <p className="text-sm font-bold text-slate-700 truncate">{vacancy.location}</p>
                    </div>
                  </div>

                  {/* Time Stat */}
                  <div className="flex items-center gap-4 p-3 rounded-[20px] bg-slate-50/50 border border-slate-100/80 hover:bg-white transition-colors">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-100/50 text-indigo-600">
                      <Clock className="h-4 w-4" strokeWidth={2} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-black uppercase text-slate-400 mb-0.5">Timing</p>
                      <p className="text-sm font-bold text-slate-700 truncate">{vacancy.class_time || 'Flexible'}</p>
                    </div>
                  </div>

                  {/* Class Level Stat */}
                  <div className="flex items-center gap-4 p-3 rounded-[20px] bg-slate-50/50 border border-slate-100/80 hover:bg-white transition-colors">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-purple-100/50 text-purple-600">
                      <GraduationCap className="h-4 w-4" strokeWidth={2} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-black uppercase text-slate-400 mb-0.5">Class</p>
                      <p className="text-sm font-bold text-slate-700 truncate">{vacancy.class_level}</p>
                    </div>
                  </div>

                </div>
              </div>
            </div>

            {/* Elevated GyanHub Guarantee Trust Badge */}
            <div className="rounded-[32px] bg-emerald-50/80 backdrop-blur-md border border-emerald-100/50 p-6 flex gap-5 shadow-sm relative overflow-hidden">
               <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent pointer-events-none" />
               <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[20px] bg-emerald-100/80 text-emerald-600 drop-shadow-[0_0_15px_rgba(16,185,129,0.3)] border border-white/60 relative z-10">
                 <ShieldCheck className="h-6 w-6" />
               </div>
               <div className="relative z-10">
                 <h4 className="font-black text-emerald-900 tracking-tight">GyanHub Guarantee</h4>
                 <p className="mt-1.5 text-xs font-bold text-emerald-700/80 leading-[1.6]">
                   Verified Listing: This client has been pre-screened by the GyanHub team for your safety.
                 </p>
               </div>
            </div>

          </aside>
        </div>
      </div>

      {/* Mobile Fixed Bottom Bar - Heavy Blur & Float */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-3xl border-t border-slate-100/50 p-4 lg:hidden shadow-[0_-20px_40px_rgba(0,0,0,0.08)] pb-safe">
         <div className="mx-auto max-w-md flex items-center justify-between gap-5">
            <div className="flex-1 min-w-0 hidden sm:block">
               <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Monthly Salary</p>
               <p className="text-xl font-black text-slate-900 truncate tracking-tight">{formatSalary(vacancy.salary_range)}</p>
            </div>
            <div className="flex-[2] flex w-full">
              {renderActionButton(true)}
            </div>
         </div>
      </div>

    </div>
  );
}