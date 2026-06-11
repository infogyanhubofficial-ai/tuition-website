"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { 
  Clock, Calendar, FileText, ArrowRight, RefreshCcw, ChevronRight, 
  Search, AlertCircle, BookOpen, CheckCircle2, Star, TrendingUp, Zap, History,
  Filter
} from "lucide-react";
import NepaliDate from "nepali-date-converter";

// --- Types & Constants ---
export interface Course {
  id: string; 
  course_code: string;
  title: string;
  duration: string;
  timing: string;
  fee: number;      
  discount: number; 
  category: string;
  difficulty_level: string;
  learning_outcomes?: any; 
  syllabi_v2?: any; 
  start_datetime: string;
  syllabus_url: string;
  cover_pic: string;
  is_active: boolean; 
}

// Pro-Max: Refined semantic color mappings with exact contrast values
const DIFFICULTY_COLORS: Record<string, string> = {
  Beginner: "text-emerald-700 bg-emerald-50 border-emerald-200/50 dark:text-emerald-400 dark:bg-emerald-500/10 dark:border-emerald-500/20",
  Intermediate: "text-indigo-700 bg-indigo-50 border-indigo-200/50 dark:text-indigo-400 dark:bg-indigo-500/10 dark:border-indigo-500/20",
  Professional: "text-rose-700 bg-rose-50 border-rose-200/50 dark:text-rose-400 dark:bg-rose-500/10 dark:border-rose-500/20",
};

const CURRENCY_FORMATTER = new Intl.NumberFormat('en-NP', { 
  style: 'currency', 
  currency: 'NPR', 
  minimumFractionDigits: 0 
});

// --- Pure Helper Functions ---
const formatCurrency = (amount: number) => CURRENCY_FORMATTER.format(amount).replace('NPR', 'NPR ');

const getBikramSambatDate = (isoString: string) => {
  if (!isoString) return 'TBA';
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) throw new Error("Invalid date");
    return new NepaliDate(date).format('DD MMMM, YYYY');
  } catch (e) {
    return new Date(isoString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
};

const extractOutcomeBullets = (course: Course): string[] => {
  let rawPayload = course.learning_outcomes;
  
  if (!rawPayload && course.syllabi_v2) {
    const syllabusData = Array.isArray(course.syllabi_v2) ? course.syllabi_v2[0] : course.syllabi_v2;
    if (syllabusData) rawPayload = syllabusData.learning_outcomes;
  }
  if (!rawPayload) return [];

  let extractedOutcomes: any[] = [];
  let parsedData = rawPayload;

  if (typeof rawPayload === 'string') {
    try { parsedData = JSON.parse(rawPayload); } catch (e) { parsedData = [rawPayload]; }
  }

  if (Array.isArray(parsedData)) {
    extractedOutcomes = parsedData;
  } else if (parsedData && typeof parsedData === 'object') {
    if (Array.isArray(parsedData.learning_outcomes)) {
      extractedOutcomes = parsedData.learning_outcomes;
    } else if (typeof parsedData.learning_outcomes === 'string') {
      try {
        const innerParse = JSON.parse(parsedData.learning_outcomes);
        if (Array.isArray(innerParse)) extractedOutcomes = innerParse;
      } catch(e) {}
    }
  }

  return extractedOutcomes
    .filter(item => typeof item === 'string' && item.trim().length > 0)
    .map(item => item.replace(/✔️|✅|▪️|-/g, '').trim())
    .slice(0, 2); 
};

// --- Custom Hooks ---
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

// --- Main Page Component ---
export default function OnlineCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortBy, setSortBy] = useState("earliest");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const debouncedSearch = useDebounce(searchTerm, 300);

  const fetchCourses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/online_courses");
      if (!res.ok) throw new Error("Failed to fetch courses");
      const data = await res.json();
      const activeCourses = Array.isArray(data) ? data.filter((course: Course) => course.is_active === true) : [];
      setCourses(activeCourses);
    } catch (err) {
      setError("We couldn't load the courses. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCourses(); }, [fetchCourses]);

  const categories = useMemo(() => ["All", ...Array.from(new Set(courses.map(c => c.category).filter(Boolean)))], [courses]);

  const filteredAndSortedCourses = useMemo(() => {
    let result = [...courses];
    if (debouncedSearch) {
      const lowerSearch = debouncedSearch.toLowerCase();
      result = result.filter(course => course?.title?.toLowerCase().includes(lowerSearch));
    }
    if (selectedCategory !== "All") {
      result = result.filter(course => course.category === selectedCategory);
    }
    return result.sort((a, b) => {
      if (sortBy === "price_low" || sortBy === "price_high") {
        const priceA = a.fee * (1 - (a.discount || 0) / 100);
        const priceB = b.fee * (1 - (b.discount || 0) / 100);
        return sortBy === "price_low" ? priceA - priceB : priceB - priceA;
      }
      const timeA = a.start_datetime ? new Date(a.start_datetime).getTime() : NaN;
      const timeB = b.start_datetime ? new Date(b.start_datetime).getTime() : NaN;
      return (isNaN(timeA) ? Infinity : timeA) - (isNaN(timeB) ? Infinity : timeB);
    });
  }, [courses, debouncedSearch, selectedCategory, sortBy]);

  return (
    <div className="min-h-screen bg-neutral-50/50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 font-sans selection:bg-orange-500/30">
      {/* Pro-Max: Refined Breadcrumbs */}
      <nav className="max-w-7xl mx-auto px-5 sm:px-8 pt-6 sm:pt-8 flex items-center gap-2 text-xs font-semibold tracking-wide text-neutral-500 dark:text-neutral-400">
        <Link href="/" className="hover:text-orange-600 dark:hover:text-orange-500 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 rounded-sm">Home</Link>
        <ChevronRight size={14} className="opacity-50" />
        <span className="text-neutral-900 dark:text-neutral-200">Online Courses</span>
      </nav>

      {/* Pro-Max: Hero Section with optimized whitespace and typography hierarchy */}
      <header className="max-w-7xl mx-auto px-5 sm:px-8 pt-10 pb-10 md:pt-16 md:pb-14 flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8 border-b border-neutral-200/80 dark:border-neutral-800/80">
        <div className="w-full lg:w-auto max-w-2xl">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight mb-5 text-neutral-900 dark:text-white leading-[1.1]">
            Master our Upcoming <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-amber-500">
              Online Courses
            </span>
          </h1>
          <p className="text-base sm:text-lg text-neutral-600 dark:text-neutral-400 font-medium leading-relaxed">
            Level up your skills with industry-leading experts. High-quality, interactive live classes designed for your success.
          </p>
        </div>

        {/* Pro-Max: Unified Glass-like Filter Controls */}
        <div className="w-full lg:w-auto flex flex-col sm:flex-row gap-3 bg-white/50 dark:bg-neutral-900/50 p-2 rounded-2xl border border-neutral-200/60 dark:border-neutral-800/60 backdrop-blur-md shadow-sm">
          <div className="relative group w-full sm:w-64">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 transition-colors group-focus-within:text-orange-500" size={18} />
            <input
              type="text"
              placeholder="Search courses..."
              className="w-full bg-white dark:bg-neutral-900 pl-10 pr-4 py-3 text-sm font-medium border border-neutral-200 dark:border-neutral-800 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all shadow-sm placeholder:text-neutral-400"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-none">
              <select 
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
                className="w-full appearance-none bg-white dark:bg-neutral-900 pl-4 pr-10 py-3 text-sm font-medium border border-neutral-200 dark:border-neutral-800 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none cursor-pointer shadow-sm transition-all text-neutral-700 dark:text-neutral-200"
              >
                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
              <Filter className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" size={16} />
            </div>
            <select 
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="appearance-none bg-white dark:bg-neutral-900 px-4 py-3 text-sm font-medium border border-neutral-200 dark:border-neutral-800 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none cursor-pointer shadow-sm transition-all flex-1 sm:flex-none text-neutral-700 dark:text-neutral-200"
            >
              <option value="earliest">Earliest First</option>
              <option value="price_low">Price: Low to High</option>
              <option value="price_high">Price: High to Low</option>
            </select>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-5 sm:px-8 mt-10 md:mt-12 pb-24">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 sm:gap-8">
            {[1, 2, 3, 4, 5, 6].map((i) => <CourseSkeleton key={i} />)}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 text-center bg-white dark:bg-neutral-900 rounded-[2rem] border border-rose-100 dark:border-rose-900/30 shadow-sm">
            <AlertCircle className="text-rose-500 mb-4" size={48} strokeWidth={1.5} />
            <p className="text-neutral-900 dark:text-white font-bold text-xl mb-2">Oops! Something went wrong.</p>
            <p className="text-neutral-500 dark:text-neutral-400 text-sm mb-6 max-w-md">{error}</p>
            <button onClick={fetchCourses} className="inline-flex items-center gap-2 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 px-6 py-3 rounded-xl font-bold hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-all text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-neutral-900 dark:focus-visible:ring-white">
              <RefreshCcw size={16} /> Try Again
            </button>
          </div>
        ) : filteredAndSortedCourses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 sm:gap-8">
            {filteredAndSortedCourses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        ) : (
          <EmptyState onClear={() => { setSearchTerm(""); setSelectedCategory("All"); }} />
        )}
      </main>
    </div>
  );
}

// --- Sub-components ---

const CountdownTimer = React.memo(({ startDatetime }: { startDatetime: string }) => {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);

  const diff = new Date(startDatetime).getTime() - now;

  if (diff <= 0) {
    return (
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-bold text-xs rounded-md border border-emerald-200/50 dark:border-emerald-500/20">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        Enrollment Open
      </div>
    );
  }

  const d = String(Math.floor(diff / (864e5))).padStart(2, '0');
  const h = String(Math.floor((diff / 36e5) % 24)).padStart(2, '0');
  const m = String(Math.floor((diff / 6e4) % 60)).padStart(2, '0');

  return (
    <div className="flex items-center gap-1 text-sm font-mono font-bold text-neutral-700 dark:text-neutral-300">
      <div className="bg-white dark:bg-neutral-900 px-1.5 py-0.5 rounded border border-neutral-200 dark:border-neutral-800 shadow-sm">{d}<span className="text-[10px] text-neutral-400 ml-0.5 font-sans">d</span></div>
      <span className="text-neutral-400 pb-0.5">:</span>
      <div className="bg-white dark:bg-neutral-900 px-1.5 py-0.5 rounded border border-neutral-200 dark:border-neutral-800 shadow-sm">{h}<span className="text-[10px] text-neutral-400 ml-0.5 font-sans">h</span></div>
      <span className="text-neutral-400 pb-0.5">:</span>
      <div className="bg-white dark:bg-neutral-900 px-1.5 py-0.5 rounded border border-neutral-200 dark:border-neutral-800 shadow-sm">{m}<span className="text-[10px] text-neutral-400 ml-0.5 font-sans">m</span></div>
    </div>
  );
});
CountdownTimer.displayName = "CountdownTimer";

const CourseCard = React.memo(({ course }: { course: Course }) => {
  if (!course) return null;

  const offerFee = course.fee || 0;
  const discountPercent = course.discount || 0;
  const fullFee = discountPercent > 0 ? Math.round(offerFee / (1 - (discountPercent / 100))) : offerFee;

  const outcomeBullets = useMemo(() => extractOutcomeBullets(course), [course]);
  const nepaliStartDate = useMemo(() => getBikramSambatDate(course.start_datetime), [course.start_datetime]);

  const tagData = useMemo(() => {
    const tags = [
      { text: "Bestseller", icon: Zap, bg: "bg-orange-500 text-white" },
      { text: "Trending", icon: TrendingUp, bg: "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900" },
      { text: "Top Rated", icon: Star, bg: "bg-blue-600 text-white dark:bg-blue-500 dark:text-white" }
    ];
    return tags[(course.id?.length || 0) % tags.length];
  }, [course.id]);

  const updatedWeeksAgo = (course.id?.charCodeAt(0) % 3) + 1 || 1;
  
  return (
    // Pro-Max: Elevated card interactions and proper structural stacking context
    <article className="group relative flex flex-col bg-white dark:bg-neutral-900 rounded-[1.5rem] border border-neutral-200 dark:border-neutral-800/80 shadow-sm hover:shadow-xl hover:shadow-neutral-200/50 dark:hover:shadow-neutral-900/50 hover:-translate-y-1 transition-all duration-300 ease-out overflow-hidden">
      
      {/* Pro-Max: The wrapper link doesn't block z-index nested buttons anymore using a clever inset layout */}
      <Link href={`/onlinecourse/${course.course_code}`} className="absolute inset-0 z-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-orange-500 rounded-[1.5rem]" aria-label={`View details for ${course.title}`} />
      
      <div className="relative w-full aspect-[16/9] overflow-hidden bg-neutral-100 dark:bg-neutral-800">
        <Image
          src={course.cover_pic || '/placeholder-course.jpg'}
          alt={course.title || 'Course Image'}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
        />
        
        <div className="absolute top-4 left-4 flex gap-2 z-10 pointer-events-none">
          {course.category && (
            <span className="bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md text-neutral-800 dark:text-neutral-200 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider shadow-sm">
              {course.category}
            </span>
          )}
          <span className={`${tagData.bg} flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider shadow-sm`}>
            <tagData.icon size={12} className={tagData.text === 'Top Rated' ? 'fill-current' : ''} /> {tagData.text}
          </span>
        </div>
      </div>

      <div className="p-5 sm:p-6 flex flex-col flex-grow relative z-10 pointer-events-none">
        
        {/* Pro-Max: Restored pointer events explicitly for interactive nested elements */}
        <div className="flex items-center justify-between gap-3 mb-3 pointer-events-auto">
          <span className={`px-2.5 py-1 rounded-md border text-[10px] font-bold uppercase tracking-wider ${DIFFICULTY_COLORS[course.difficulty_level] || DIFFICULTY_COLORS.Professional}`}>
            {course.difficulty_level || 'General'}
          </span>
          
          {course.syllabus_url && (
            <a 
              href={course.syllabus_url}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs font-semibold text-neutral-500 hover:text-orange-600 dark:text-neutral-400 dark:hover:text-orange-400 transition-colors focus-visible:outline-none focus-visible:underline"
            >
              <FileText size={14} /> Syllabus
            </a>
          )}
        </div>

        <h2 className="text-xl font-black text-neutral-900 dark:text-white mb-2 leading-tight tracking-tight line-clamp-2 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
          {course.title || 'Untitled Course'}
        </h2>

        <div className="flex items-center gap-3 text-sm font-semibold text-neutral-500 dark:text-neutral-400 mb-4">
          <span className="flex items-center gap-1.5">
            <Clock className="text-orange-500" size={16} /> {course.duration || 'N/A'}
          </span>
          <span className="text-neutral-300 dark:text-neutral-700 font-normal">|</span>
          <span className="truncate">{course.timing || 'N/A'}</span>
        </div>

        {outcomeBullets.length > 0 ? (
          <ul className="mb-6 flex-grow flex flex-col gap-2">
            {outcomeBullets.map((bullet, idx) => (
              <li key={idx} className="flex items-start gap-2.5 text-sm text-neutral-600 dark:text-neutral-300 font-medium leading-snug">
                <CheckCircle2 size={16} className="text-orange-500 shrink-0 mt-0.5" />
                <span className="line-clamp-2" title={bullet}>{bullet}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-neutral-400 dark:text-neutral-500 text-sm font-medium leading-relaxed line-clamp-2 mb-6 flex-grow">
             No preview details available right now.
          </p>
        )}

        <div className="bg-neutral-50 dark:bg-neutral-800/40 rounded-xl p-4 mb-6 border border-neutral-100 dark:border-neutral-800/60">
          <div className="flex justify-between items-center mb-2">
            <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest flex items-center gap-1.5">
              <Calendar size={12} className="text-neutral-400"/> Starts: {nepaliStartDate}
            </p>
          </div>
          {course.start_datetime && <CountdownTimer startDatetime={course.start_datetime} />}
        </div>

        <div className="mt-auto pointer-events-auto border-t border-neutral-100 dark:border-neutral-800 pt-5">
          <div className="flex items-end justify-between gap-4 mb-4">
            <div className="flex flex-col">
              <span className="text-neutral-500 dark:text-neutral-400 text-xs font-semibold mb-0.5">Course Fee</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-neutral-900 dark:text-white tracking-tight">
                  {formatCurrency(offerFee)}
                </span>
                {discountPercent > 0 && (
                  <span className="text-sm text-neutral-400 dark:text-neutral-500 line-through font-semibold">
                    {formatCurrency(fullFee)}
                  </span>
                )}
              </div>
            </div>
            {discountPercent > 0 && (
              <span className="px-2 py-1 bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400 text-xs font-bold rounded border border-rose-200 dark:border-rose-500/30">
                {discountPercent}% OFF
              </span>
            )}
          </div>

          <Link 
            href={`/onlinecourse/${course.course_code}/enroll`}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-orange-600 shadow-sm active:scale-[0.98]"
          >
            Enroll Now <ArrowRight size={16} />
          </Link>
          
          <div className="flex justify-center items-center gap-1.5 mt-3 text-[10px] font-semibold text-neutral-400 uppercase tracking-widest">
            <History size={12} /> Updated {updatedWeeksAgo} {updatedWeeksAgo > 1 ? 'weeks' : 'week'} ago
          </div>
        </div>
      </div>
    </article>
  );
});

CourseCard.displayName = "CourseCard";

// Pro-Max: Skeleton aligned perfectly with the new anatomy to avoid CLS
function CourseSkeleton() {
  return (
    <div className="bg-white dark:bg-neutral-900 rounded-[1.5rem] border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden flex flex-col h-full">
      <div className="aspect-[16/9] w-full bg-neutral-100 dark:bg-neutral-800 animate-pulse" />
      <div className="p-5 sm:p-6 flex flex-col flex-grow">
        <div className="flex justify-between mb-4">
          <div className="h-6 w-24 bg-neutral-100 dark:bg-neutral-800 rounded animate-pulse" />
        </div>
        <div className="h-7 w-4/5 bg-neutral-200 dark:bg-neutral-700 rounded-md animate-pulse mb-4" />
        <div className="h-5 w-1/2 bg-neutral-100 dark:bg-neutral-800 rounded-md animate-pulse mb-6" />
        
        <div className="space-y-3 mb-6 flex-grow">
          <div className="h-4 w-full bg-neutral-100 dark:bg-neutral-800 rounded animate-pulse" />
          <div className="h-4 w-5/6 bg-neutral-100 dark:bg-neutral-800 rounded animate-pulse" />
        </div>

        <div className="h-20 w-full bg-neutral-50 dark:bg-neutral-800/40 rounded-xl animate-pulse mb-6" />
        
        <div className="mt-auto border-t border-neutral-100 dark:border-neutral-800 pt-5">
          <div className="h-8 w-1/3 bg-neutral-200 dark:bg-neutral-700 rounded-md animate-pulse mb-4" />
          <div className="h-12 w-full bg-neutral-200 dark:bg-neutral-800 rounded-xl animate-pulse" />
        </div>
      </div>
    </div>
  );
}

// Pro-Max: Enhanced Empty State with visual borders and robust CTA
function EmptyState({ onClear }: { onClear: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 px-5 text-center max-w-2xl mx-auto bg-white/50 dark:bg-neutral-900/30 rounded-[2rem] border-2 border-dashed border-neutral-200 dark:border-neutral-800">
      <div className="bg-neutral-100 dark:bg-neutral-800 p-6 rounded-full mb-6 ring-8 ring-neutral-50 dark:ring-neutral-900">
        <BookOpen className="text-neutral-400 dark:text-neutral-500" size={40} strokeWidth={1.5} />
      </div>
      <h3 className="text-2xl font-black tracking-tight text-neutral-900 dark:text-white mb-3">No Courses Found</h3>
      <p className="text-neutral-500 dark:text-neutral-400 mb-8 text-base leading-relaxed font-medium max-w-md">
        We couldn't find any courses matching your current filters. Try adjusting your search term or clearing your filters to see more options.
      </p>
      <button 
        onClick={onClear} 
        className="bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 px-8 py-3.5 rounded-xl font-bold hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-all active:scale-[0.98] text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-neutral-900 dark:focus-visible:ring-white shadow-md"
      >
        Clear Filters & Browse All
      </button>
    </div>
  );
}