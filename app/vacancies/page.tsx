'use client';

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { 
  Search, 
  MapPin, 
  Clock, 
  Flame, 
  Sparkles, 
  Briefcase, 
  ChevronRight, 
  Filter, 
  Eye,
  Plus,
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
  Users
} from "lucide-react";

export interface Vacancy {
  id: number;
  subject: string;
  location: string;
  class_level: string;
  description: string;
  salary_range: string;
  time?: string;
  class_time?: string;
  urgent: boolean | string;
  created_at?: string;
  applicants_count?: number;
  tuition_type?: string;
  mode_of_teaching?: string;
  status: boolean;
  days_a_week?: string;
  vacancy_applications?: { count: number }[];
}

type ViewMode = "grid" | "list";

const ITEMS_PER_PAGE = 6;

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function formatSalary(salary?: string) {
  if (!salary || salary.trim() === '') return "Negotiable";
  const s = salary.trim();
  if (s.toLowerCase().startsWith("rs")) return s;
  return `Rs. ${s}`;
}

function formatRelativeTime(dateString?: string) {
  if (!dateString) return "Active recently";
  const now = new Date();
  const then = new Date(dateString);
  const diffMs = now.getTime() - then.getTime();
  if (Number.isNaN(diffMs)) return "Active recently";

  const minutes = Math.floor(diffMs / 60000);
  const hours = Math.floor(diffMs / 3600000);
  const days = Math.floor(diffMs / 86400000);

  if (minutes < 1) return "Just posted";
  if (minutes < 60) return `${minutes} min ago`;
  if (hours < 24) return hours === 1 ? "Posted 1 hour ago" : `Posted ${hours} hours ago`;
  if (days === 1) return "Posted Yesterday";
  if (days < 7) return `Posted ${days} days ago`;
  return then.toLocaleDateString();
}

function getSubjectIcon(subject?: string) {
  const s = (subject || "").toLowerCase();
  
  if (s.includes("math") || s.includes("calc") || s.includes("algebra") || s.includes("geometry")) return <Calculator className="h-5 w-5" strokeWidth={1.5} />;
  if (s.includes("science") || s.includes("physics") || s.includes("chemistry") || s.includes("bio")) return <Atom className="h-5 w-5" strokeWidth={1.5} />;
  if (s.includes("english") || s.includes("nepali") || s.includes("byakaran") || s.includes("language") || s.includes("sanskrit") || s.includes("ielts")) return <Languages className="h-5 w-5" strokeWidth={1.5} />;
  if (s.includes("computer") || s.includes("it ") || s.includes("code") || s.includes("programming")) return <Code2 className="h-5 w-5" strokeWidth={1.5} />;
  if (s.includes("excel") || s.includes("spreadsheet")) return <FileSpreadsheet className="h-5 w-5" strokeWidth={1.5} />;
  if (s.includes("account") || s.includes("finance") || s.includes("business") || s.includes("eco")) return <LineChart className="h-5 w-5" strokeWidth={1.5} />;
  if (s.includes("geo") || s.includes("history") || s.includes("social")) return <Globe2 className="h-5 w-5" strokeWidth={1.5} />;
  if (s.includes("music") || s.includes("guitar") || s.includes("piano") || s.includes("vocal")) return <Music className="h-5 w-5" strokeWidth={1.5} />;
  if (s.includes("art") || s.includes("draw") || s.includes("paint") || s.includes("design")) return <Palette className="h-5 w-5" strokeWidth={1.5} />;
  return <BookOpen className="h-5 w-5" strokeWidth={1.5} />;
}

function GridIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("h-4 w-4 transition-colors", active ? "text-orange-600" : "text-slate-400")} fill="none">
      <rect x="4" y="4" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="2" />
      <rect x="14" y="4" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="2" />
      <rect x="4" y="14" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="2" />
      <rect x="14" y="14" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function ListIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("h-4 w-4 transition-colors", active ? "text-orange-600" : "text-slate-400")} fill="none">
      <path d="M8 7h12M8 12h12M8 17h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="4.5" cy="7" r="1.5" fill="currentColor" />
      <circle cx="4.5" cy="12" r="1.5" fill="currentColor" />
      <circle cx="4.5" cy="17" r="1.5" fill="currentColor" />
    </svg>
  );
}

function VacancySkeleton({ viewMode }: { viewMode: ViewMode }) {
  return (
    <div className={cn(
      "flex flex-col justify-between rounded-[32px] border border-white/40 bg-white/60 backdrop-blur-xl p-6 shadow-sm animate-pulse",
      viewMode === 'list' && "md:flex-row md:items-center md:gap-8 h-auto"
    )}>
      <div className={cn("space-y-4", viewMode === 'list' && "flex-1")}>
        <div className="flex justify-between items-start">
          <div className="h-12 w-12 rounded-[20px] bg-slate-200/60" />
          <div className="h-6 w-20 rounded-full bg-slate-200/60" />
        </div>
        <div className="h-7 w-3/4 bg-slate-200/80 rounded-lg" />
        <div className="flex gap-2">
          <div className="h-6 w-20 bg-slate-200/50 rounded-md" />
          <div className="h-6 w-24 bg-slate-200/50 rounded-md" />
        </div>
        <div className="space-y-2 pt-2">
          <div className="h-3 w-full bg-slate-200/50 rounded-md" />
          <div className="h-3 w-5/6 bg-slate-200/50 rounded-md" />
        </div>
      </div>
      <div className={cn(
        "mt-6 flex justify-between items-end border-t border-slate-100 pt-5 gap-4",
        viewMode === 'list' && "mt-0 md:border-t-0 md:border-l md:border-slate-100 md:pl-8 md:pt-0 md:flex-col md:items-end md:justify-center md:w-56"
      )}>
        <div className={cn("space-y-2", viewMode === 'list' && "text-right w-full")}>
          <div className={cn("h-3 w-16 bg-slate-200/60 rounded-md", viewMode === 'list' && "ml-auto")} />
          <div className={cn("h-7 w-24 bg-slate-200/80 rounded-lg", viewMode === 'list' && "ml-auto")} />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <div className="h-11 w-11 bg-slate-200/60 rounded-xl shrink-0" />
          <div className="h-11 flex-1 md:w-28 bg-slate-200/80 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

function Pagination({ currentPage, totalPages, onPageChange }: { currentPage: number; totalPages: number; onPageChange: (p: number) => void; }) {
  if (totalPages <= 1) return null;
  return (
    <div className="mt-12 sticky bottom-6 flex justify-center z-30 pointer-events-none">
      <div className="inline-flex items-center gap-2 rounded-full border border-slate-200/60 bg-white/80 px-2 py-2 shadow-[0_8px_30px_rgb(0,0,0,0.08)] backdrop-blur-xl pointer-events-auto">
        <button 
          onClick={() => onPageChange(currentPage - 1)} 
          disabled={currentPage === 1} 
          className="inline-flex h-9 items-center justify-center rounded-full px-4 text-sm font-bold text-slate-700 transition-all hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent"
        >
          Previous
        </button>
        <div className="h-4 w-px bg-slate-200/60 mx-1"></div>
        <span className="text-sm font-semibold text-slate-500 px-3">
          <span className="text-slate-900">{currentPage}</span> / {totalPages}
        </span>
        <div className="h-4 w-px bg-slate-200/60 mx-1"></div>
        <button 
          onClick={() => onPageChange(currentPage + 1)} 
          disabled={currentPage === totalPages} 
          className="inline-flex h-9 items-center justify-center rounded-full px-4 text-sm font-bold text-slate-700 transition-all hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent"
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default function VacanciesPage() {
  const router = useRouter(); 
  const [vacancies, setVacancies] = useState<Vacancy[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [search, setSearch] = useState("");
  const [selectedMode, setSelectedMode] = useState("All");
  const [urgentOnly, setUrgentOnly] = useState(false);
  
  // UX States
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [currentPage, setCurrentPage] = useState(1);
  const [quickView, setQuickView] = useState<Vacancy | null>(null);

  const resultsTopRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const savedMode = localStorage.getItem('vacancyViewMode') as ViewMode;
    if (savedMode === 'grid' || savedMode === 'list') {
      setViewMode(savedMode);
    }
  }, []);

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem('vacancyViewMode', mode);
  };

  useEffect(() => {
    const fetchVacancies = async () => {
      setLoading(true);
      
      const { data, error } = await supabase
        .from("vacancies")
        .select("*, vacancy_applications(count)")
        .eq("status", true) 
        .order("id", { ascending: false });

      if (!error && data) {
        const mappedData: Vacancy[] = data.map(v => ({
          ...v,
          // Extract count from Supabase relationship array, fallback to legacy applicants_count
          applicants_count: v.vacancy_applications?.[0]?.count ?? v.applicants_count ?? 0
        }));
        setVacancies(mappedData);
      }
      setLoading(false);
    };
    fetchVacancies();
  }, []);

  const filteredVacancies = useMemo(() => {
    return vacancies.filter((v) => {
      const q = search.trim().toLowerCase();
      const matchesSearch = !q || [v.subject, v.location, v.description].some(field => field?.toLowerCase().includes(q));
      
      // Standardize teaching mode check: prioritize mode_of_teaching fallback to tuition_type
      const vMode = (v.mode_of_teaching || v.tuition_type || "").toLowerCase();
      const matchesMode = selectedMode === 'All' || vMode.includes(selectedMode.toLowerCase());
      
      // Safely check for true boolean OR string 'true'
      const isVacancyUrgent = v.urgent === true || String(v.urgent).toLowerCase() === 'true';
      const matchesUrgent = !urgentOnly || isVacancyUrgent;

      return matchesSearch && matchesMode && matchesUrgent;
    });
  }, [vacancies, search, selectedMode, urgentOnly]);

  const totalPages = Math.max(1, Math.ceil(filteredVacancies.length / ITEMS_PER_PAGE));

  const paginatedVacancies = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredVacancies.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredVacancies, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedMode, urgentOnly]);

  useEffect(() => {
    if (quickView) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'auto';
  }, [quickView]);

  return (
    <main className="min-h-screen bg-[#F8FAFC] px-4 py-8 sm:px-6 lg:px-8 font-sans antialiased selection:bg-orange-200 selection:text-orange-900">
      <div className="mx-auto max-w-7xl">
        
        {/* Header */}
        <div className="mb-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">
              Tuition <span className="bg-gradient-to-br from-orange-400 to-orange-600 bg-clip-text text-transparent">Vacancies</span>
            </h1>
            <p className="mt-3 text-base font-medium text-slate-500">
              Discover and apply to active teaching opportunities across Nepal.
            </p>
          </div>
          
          {/* New Post Vacancy CTA */}
          <Link
            href="/post-tuition"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-3.5 text-sm font-bold text-white shadow-[0_0_20px_rgba(249,115,22,0.3)] transition-all duration-300 hover:shadow-[0_0_25px_rgba(249,115,22,0.5)] active:scale-95"
          >
            <Plus className="h-5 w-5" />
            Post Vacancy
          </Link>
        </div>

        <div className="grid gap-8 lg:grid-cols-[280px_1fr] xl:grid-cols-[300px_1fr]">
          
          {/* Sticky Filter Sidebar - SaaS Glassmorphism */}
          <aside className="relative hidden lg:block">
            <div className="sticky top-28 rounded-[32px] border border-white/40 bg-white/60 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-xl">
              <div className="flex items-center gap-3 mb-6 border-b border-slate-200/60 pb-5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-50 text-orange-600">
                  <Filter className="h-4 w-4" />
                </div>
                <h2 className="text-sm font-black uppercase tracking-widest text-slate-900">Filters</h2>
              </div>
              
              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Search Keyword</label>
                  <div className="relative group">
                    <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-orange-500" />
                    <input 
                      type="text" 
                      placeholder="Subject, location..." 
                      className="w-full rounded-2xl border border-slate-200/80 bg-white/50 p-3.5 pl-10 pr-10 text-sm font-medium text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-500/10"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                    <kbd className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-mono text-[10px] font-bold text-slate-400 pointer-events-none">
                      Search
                    </kbd>
                  </div>
                </div>
                
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Teaching Mode</label>
                  <div className="relative">
                    <select 
                      className="w-full rounded-2xl border border-slate-200/80 bg-white/50 p-3.5 text-sm font-medium text-slate-900 outline-none transition-all focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-500/10 appearance-none cursor-pointer"
                      value={selectedMode}
                      onChange={(e) => setSelectedMode(e.target.value)}
                    >
                      <option value="All">All Environments</option>
                      <option value="Online">Online Sessions</option>
                      <option value="Home">Home Tuition</option>
                      <option value="Center">At Institute</option>
                    </select>
                    <ChevronRight className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 rotate-90 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                <button 
                  onClick={() => setUrgentOnly(!urgentOnly)}
                  className={cn(
                    "group flex w-full items-center justify-between rounded-2xl border p-4 transition-all duration-300 active:scale-[0.98]",
                    urgentOnly 
                      ? "border-orange-200 bg-orange-50/50 shadow-inner" 
                      : "border-slate-200/80 bg-white/50 hover:border-slate-300 hover:bg-white"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Flame className={cn("h-4 w-4 transition-colors", urgentOnly ? "text-orange-600" : "text-slate-400 group-hover:text-slate-600")} />
                    <span className={cn("text-xs font-bold transition-colors", urgentOnly ? "text-orange-900" : "text-slate-600")}>Urgent Needs Only</span>
                  </div>
                  <div className={cn("h-5 w-9 rounded-full relative transition-all duration-300", urgentOnly ? "bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.4)]" : "bg-slate-200")}>
                    <div className={cn("absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all duration-300 shadow-sm", urgentOnly ? "right-0.5" : "left-0.5")} />
                  </div>
                </button>

                {/* Modernized Alert Box */}
                <div className="mt-8 rounded-[24px] bg-gradient-to-br from-slate-900 to-slate-800 p-6 text-white text-center shadow-[0_20px_40px_-10px_rgba(0,0,0,0.3)] relative overflow-hidden border border-slate-700/50">
                   <div className="absolute -top-12 -right-12 h-32 w-32 rounded-full bg-orange-500 blur-[40px] opacity-30" />
                   <div className="relative z-10">
                     <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-[16px] bg-white/10 mb-4 border border-white/10 backdrop-blur-md shadow-inner">
                       <Briefcase className="h-5 w-5 text-orange-400" />
                     </div>
                     <h3 className="text-sm font-black mb-2 tracking-tight">Never miss a job</h3>
                     <p className="text-xs text-slate-400 mb-6 leading-relaxed font-medium">Get WhatsApp alerts instantly when tuitions matching your skills are posted.</p>
                     
                     <a 
                       href="https://whatsapp.com/channel/0029Vb6FOdD11ulUBEbw4Q0r"
                       target="_blank"
                       rel="noopener noreferrer"
                       className="block w-full rounded-xl bg-orange-500 text-white font-bold py-3.5 text-xs hover:bg-orange-400 transition-all duration-300 shadow-[0_0_15px_rgba(249,115,22,0.3)] hover:shadow-[0_0_25px_rgba(249,115,22,0.5)] active:scale-95 tracking-wide"
                     >
                       Set Up Alerts
                     </a>
                   </div>
                </div>
              </div>
            </div>
          </aside>

          {/* Compact Horizontal Scroll for Mobile Filters */}
          <div className="lg:hidden mb-2 flex gap-3 overflow-x-auto pb-4 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden">
            <div className="relative shrink-0 w-[65%] snap-center">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search..." 
                className="h-12 w-full rounded-[20px] border border-slate-200/80 bg-white/80 backdrop-blur-md pl-10 pr-4 text-sm font-medium outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 shadow-sm" 
                value={search} 
                onChange={(e) => setSearch(e.target.value)} 
              />
            </div>
            <select 
              className="h-12 shrink-0 rounded-[20px] border border-slate-200/80 bg-white/80 backdrop-blur-md px-4 pr-8 text-sm font-medium outline-none shadow-sm snap-center appearance-none" 
              value={selectedMode} 
              onChange={(e) => setSelectedMode(e.target.value)}
              style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2394a3b8' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: `right 0.5rem center`, backgroundRepeat: `no-repeat`, backgroundSize: `1.5em 1.5em` }}
            >
              <option value="All">All Modes</option>
              <option value="Online">Online</option>
              <option value="Home">Home</option>
            </select>
            <button 
              onClick={() => setUrgentOnly(!urgentOnly)}
              className={cn(
                "h-12 shrink-0 rounded-[20px] border px-4 text-sm font-bold shadow-sm snap-center flex items-center gap-2 transition-colors",
                urgentOnly ? "border-orange-200 bg-orange-50 text-orange-600" : "border-slate-200/80 bg-white/80 backdrop-blur-md text-slate-600"
              )}
            >
              <Flame className="h-4 w-4" />
              Urgent
            </button>
          </div>

          <div className="flex-1">
            <div className="mb-6 flex items-center justify-between bg-white/40 backdrop-blur-md border border-slate-200/50 rounded-2xl p-2 px-4 shadow-sm">
              <p className="text-sm font-semibold text-slate-500">
                Showing <strong className="text-slate-900 font-black">{filteredVacancies.length}</strong> results
              </p>
              
              <div className="flex items-center gap-1.5 rounded-xl bg-slate-100/80 p-1">
                <button 
                  onClick={() => handleViewModeChange("grid")} 
                  className={cn("flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-300", viewMode === "grid" ? "bg-white text-orange-600 shadow-sm" : "text-slate-400 hover:text-slate-600")}
                >
                  <GridIcon active={viewMode === "grid"} />
                </button>
                <button 
                  onClick={() => handleViewModeChange("list")} 
                  className={cn("flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-300", viewMode === "list" ? "bg-white text-orange-600 shadow-sm" : "text-slate-400 hover:text-slate-600")}
                >
                  <ListIcon active={viewMode === "list"} />
                </button>
              </div>
            </div>

            <div ref={resultsTopRef} className="-mt-10 pt-10" />

            {loading ? (
              <div className={cn("grid gap-6", viewMode === "grid" ? "sm:grid-cols-2" : "grid-cols-1")}>
                {Array.from({ length: ITEMS_PER_PAGE }).map((_, i) => <VacancySkeleton key={i} viewMode={viewMode} />)}
              </div>
            ) : filteredVacancies.length === 0 ? (
              <div className="py-28 text-center flex flex-col items-center justify-center rounded-[40px] border border-dashed border-slate-300 bg-gradient-to-b from-white/60 to-slate-50/60 backdrop-blur-sm">
                <div className="mb-6 relative">
                  <div className="absolute inset-0 bg-orange-200 rounded-full blur-2xl opacity-40"></div>
                  <div className="relative h-20 w-20 flex items-center justify-center rounded-[24px] bg-white shadow-xl border border-slate-100">
                    <Search className="h-8 w-8 text-orange-400" />
                  </div>
                </div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">No matching vacancies</h3>
                <p className="mt-3 text-sm font-medium text-slate-500 max-w-sm leading-relaxed">Try adjusting your filters or clearing your search to see more opportunities.</p>
                <button 
                  onClick={() => { setSearch(''); setSelectedMode('All'); setUrgentOnly(false); }} 
                  className="mt-8 rounded-2xl bg-white border border-slate-200 px-6 py-3.5 text-sm font-bold text-slate-700 hover:bg-slate-50 hover:text-orange-600 active:scale-95 transition-all shadow-sm"
                >
                  Clear All Filters
                </button>
              </div>
            ) : (
              <div className={cn(
                "grid gap-6 transition-all duration-500", 
                viewMode === "grid" ? "sm:grid-cols-2" : "grid-cols-1"
              )}>
                {paginatedVacancies.map((vacancy) => {
                  const appliedCount = vacancy.applicants_count || 0;
                  const isHot = appliedCount >= 5;
                  
                  // Handle strict boolean truthiness + string edge cases from DB
                  const isUrgent = vacancy.urgent === true || String(vacancy.urgent).toLowerCase() === 'true';

                  // Standardized Derived Variables
                  const displayMode = vacancy.mode_of_teaching || vacancy.tuition_type;
                  const displayTime = vacancy.class_time || vacancy.time || 'Flexible Time';

                  return (
                    <article
                      key={vacancy.id}
                      onClick={() => router.push(`/vacancies/${vacancy.id}`)}
                      className={cn(
                        "cursor-pointer group relative flex flex-col justify-between rounded-[32px] bg-white/60 backdrop-blur-xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-500 ease-out hover:-translate-y-1",
                        isUrgent 
                          ? "border-2 border-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.3)] hover:shadow-[0_20px_40px_-15px_rgba(249,115,22,0.4)]" 
                          : "border border-white/40 hover:border-orange-300/50 hover:shadow-[0_20px_40px_-15px_rgba(249,115,22,0.15)]",
                        viewMode === "list" && "md:flex-row md:items-start md:gap-8 h-auto"
                      )}
                    >
                      <div className={cn(viewMode === "list" && "flex-1")}>
                        <div className="flex justify-between items-start mb-5">
                          {/* Refined Icon Container */}
                          <div className="flex h-14 w-14 items-center justify-center rounded-[20px] bg-orange-500/10 text-orange-600 border border-orange-500/20 group-hover:scale-110 group-hover:bg-orange-500 group-hover:text-white transition-all duration-500 ease-out shadow-sm">
                              {getSubjectIcon(vacancy.subject)}
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {/* 🔥 Upgraded Glowing Fire Button for Urgent vacancies */}
                            {isUrgent && (
                              <div className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 px-3 py-1.5 text-[11px] font-black uppercase tracking-wider text-white border border-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.6)] backdrop-blur-sm z-10 transition-transform hover:scale-105">
                                <Flame className="h-4 w-4 animate-pulse" />
                                Urgent
                              </div>
                            )}
                          </div>
                        </div>

                        <h3 className="text-xl font-black text-slate-900 mb-3 truncate tracking-tight group-hover:text-orange-600 transition-colors duration-300">
                          {vacancy.subject}
                        </h3>

                        <div className="flex flex-wrap gap-2 mb-5">
                          <span className="rounded-lg bg-slate-100/80 px-2.5 py-1 text-[11px] font-bold text-slate-700 border border-slate-200/60">
                            {vacancy.class_level}
                          </span>
                          {displayMode && (
                            <span className="rounded-lg bg-indigo-50/80 px-2.5 py-1 text-[11px] font-bold text-indigo-700 border border-indigo-100/60">
                              {displayMode}
                            </span>
                          )}
                        </div>

                        <div className={cn("grid gap-2.5 mb-5", viewMode === 'list' ? "sm:grid-cols-3" : "grid-cols-1")}>
                           <div className="flex items-center gap-2.5 text-xs font-semibold text-slate-500">
                             <MapPin className="h-4 w-4 text-slate-400" /> <span className="truncate">{vacancy.location}</span>
                           </div>
                           <div className="flex items-center gap-2.5 text-xs font-semibold text-slate-500">
                             <Clock className="h-4 w-4 text-slate-400" /> <span>{displayTime}</span>
                           </div>
                        </div>

                        <p className={cn("text-sm text-slate-600 font-medium leading-[1.7]", viewMode === 'grid' && "line-clamp-2")}>
                          {vacancy.description}
                        </p>

                        <div className="mt-5 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {isHot ? (
                              <div className="flex items-center gap-1.5 text-[11px] font-black text-orange-500 uppercase tracking-wide">
                                <Flame className="h-4 w-4" fill="currentColor" /> High Demand ({appliedCount} Applied)
                              </div>
                            ) : appliedCount > 0 ? (
                              <div className="flex items-center gap-1.5 text-[11px] font-black text-blue-500 uppercase tracking-wide">
                                <Users className="h-4 w-4" /> {appliedCount} Applied
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5 text-[11px] font-black text-emerald-500 uppercase tracking-wide">
                                <Sparkles className="h-4 w-4" /> Be the first to apply
                              </div>
                            )}
                          </div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{formatRelativeTime(vacancy.created_at)}</span>
                        </div>
                      </div>

                      <div className={cn(
                        "mt-6 flex justify-between items-end border-t border-slate-100/80 pt-5 gap-4",
                        viewMode === 'list' && "mt-0 md:border-t-0 md:border-l md:pl-8 md:pt-0 md:flex-col md:items-end md:justify-center md:w-64"
                      )}>
                        <div className={cn(viewMode === 'list' && "text-right w-full mb-3")}>
                          <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-black mb-1.5">Monthly Salary</p>
                          <p className="text-xl font-black text-slate-900 leading-none truncate tracking-tight">
                            {formatSalary(vacancy.salary_range)}
                          </p>
                        </div>
                        
                        <div 
                          className="flex gap-2.5 w-full md:w-auto"
                          onClick={(e) => e.stopPropagation()} 
                        >
                          <button 
                            onClick={(e) => {
                              e.preventDefault();
                              setQuickView(vacancy);
                            }}
                            className="flex h-12 w-12 items-center justify-center rounded-[16px] bg-slate-50/80 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-all duration-300 border border-slate-200/80 shrink-0 active:scale-95 z-10"
                            aria-label="Quick View"
                          >
                            <Eye className="h-5 w-5" />
                          </button>

                          <Link 
                            href={`/vacancies/${vacancy.id}/apply`}
                            className="group flex flex-1 h-12 items-center justify-center gap-2 rounded-[16px] bg-gradient-to-r from-orange-500 to-orange-600 px-5 text-sm font-bold text-white transition-all duration-300 hover:shadow-[0_0_20px_rgba(249,115,22,0.4)] active:scale-95 z-10"
                          >
                            Apply <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                          </Link>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}

            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={(p) => {
              setCurrentPage(p);
              resultsTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }} />
          </div>
        </div>
      </div>
    </main>
  );
}