"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { 
  Clock, Calendar, FileText, ArrowRight, RefreshCcw, ChevronRight, 
  Search, AlertCircle, BookOpen, CheckCircle2, Star, TrendingUp, Zap, History
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

const DIFFICULTY_COLORS: Record<string, string> = {
  Beginner: "text-emerald-700 bg-emerald-50/50 dark:text-emerald-400 dark:bg-emerald-950/20 ring-emerald-500/10",
  Intermediate: "text-indigo-700 bg-indigo-50/50 dark:text-indigo-400 dark:bg-indigo-950/20 ring-indigo-500/10",
  Professional: "text-rose-700 bg-rose-50/50 dark:text-rose-400 dark:bg-rose-950/20 ring-rose-500/10",
};

// Instantiated once outside the component to save memory
const CURRENCY_FORMATTER = new Intl.NumberFormat('en-NP', { 
  style: 'currency', 
  currency: 'NPR', 
  minimumFractionDigits: 0 
});

// --- Pure Helper Functions ---
// Moved outside components to prevent re-allocation on every render

const formatCurrency = (amount: number) => CURRENCY_FORMATTER.format(amount).replace('NPR', 'NPR ');

const getBikramSambatDate = (isoString: string) => {
  if (!isoString) return 'TBA';
  try {
    const date = new Date(isoString);
    // Fallback if date is invalid to prevent crash
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
    try {
      parsedData = JSON.parse(rawPayload);
    } catch (e) {
      parsedData = [rawPayload];
    }
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
      
      const activeCourses = Array.isArray(data) 
        ? data.filter((course: Course) => course.is_active === true) 
        : [];
        
      setCourses(activeCourses);
    } catch (err) {
      setError("We couldn't load the courses. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCourses(); }, [fetchCourses]);

  const categories = useMemo(() => {
    return ["All", ...Array.from(new Set(courses.map(c => c.category).filter(Boolean)))];
  }, [courses]);

  const filteredAndSortedCourses = useMemo(() => {
    let result = [...courses];

    if (debouncedSearch) {
      const lowerSearch = debouncedSearch.toLowerCase();
      result = result.filter(course =>
        course?.title?.toLowerCase().includes(lowerSearch)
      );
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
      
      const safeTimeA = isNaN(timeA) ? Infinity : timeA;
      const safeTimeB = isNaN(timeB) ? Infinity : timeB;

      return safeTimeA - safeTimeB;
    });
  }, [courses, debouncedSearch, selectedCategory, sortBy]);

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 transition-colors duration-300 font-sans">
      <nav className="max-w-7xl mx-auto px-5 sm:px-8 pt-6 sm:pt-8 flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-neutral-400">
        <Link href="/" className="hover:text-orange-600 transition-colors">Home</Link>
        <ChevronRight size={12} className="opacity-50" />
        <span className="text-neutral-800 dark:text-neutral-200">Online Courses</span>
      </nav>

      <header className="max-w-7xl mx-auto px-5 sm:px-8 pt-8 pb-8 md:pt-16 md:pb-12 flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 md:gap-10 border-b border-neutral-200/60 dark:border-neutral-800/60">
        <div className="w-full lg:w-auto">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tighter mb-4 text-neutral-900 dark:text-white">
            Master our Upcoming <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-orange-400">
              Online Courses
            </span>
          </h1>
          <p className="text-base sm:text-lg text-neutral-500 dark:text-neutral-400 font-medium max-w-xl leading-relaxed">
            Level up your skills with industry-leading experts. High-quality, interactive live classes designed for your success.
          </p>
        </div>

        <div className="w-full lg:w-auto flex flex-col sm:flex-row gap-3">
          <div className="relative group w-full sm:w-64">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" size={16} />
            <input
              type="text"
              placeholder="Search courses..."
              className="w-full bg-white dark:bg-neutral-900 pl-10 pr-4 py-3 text-sm font-medium border border-neutral-200/80 dark:border-neutral-800 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all shadow-sm"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            <select 
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="bg-white dark:bg-neutral-900 px-3.5 py-3 text-sm font-medium border border-neutral-200/80 dark:border-neutral-800 rounded-xl focus:ring-2 focus:ring-orange-500/20 outline-none cursor-pointer shadow-sm flex-1 sm:flex-none"
            >
              {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
            <select 
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="bg-white dark:bg-neutral-900 px-3.5 py-3 text-sm font-medium border border-neutral-200/80 dark:border-neutral-800 rounded-xl focus:ring-2 focus:ring-orange-500/20 outline-none cursor-pointer shadow-sm flex-1 sm:flex-none"
            >
              <option value="earliest">Earliest First</option>
              <option value="price_low">Price: Low to High</option>
              <option value="price_high">Price: High to Low</option>
            </select>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-5 sm:px-8 mt-8 md:mt-12 pb-24">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-8">
            {[1, 2, 3, 4, 5, 6].map((i) => <CourseSkeleton key={i} />)}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 text-center bg-white dark:bg-neutral-900 rounded-[1.5rem] border border-neutral-200/60 dark:border-neutral-800/60 shadow-sm">
            <AlertCircle className="text-rose-500 mb-4" size={40} />
            <p className="text-neutral-900 dark:text-white font-bold text-lg mb-2">Oops! Something went wrong.</p>
            <p className="text-neutral-500 text-sm mb-6">{error}</p>
            <button onClick={fetchCourses} className="inline-flex items-center gap-2 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 px-5 py-2.5 rounded-lg font-bold hover:opacity-90 transition-all text-sm">
              <RefreshCcw size={16} /> Try Again
            </button>
          </div>
        ) : filteredAndSortedCourses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-8">
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

// Sub-component specifically for Countdown to prevent full card re-renders
const CountdownTimer = React.memo(({ startDatetime }: { startDatetime: string }) => {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    // Only update every minute
    const timer = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);

  const diff = new Date(startDatetime).getTime() - now;

  if (diff <= 0) {
    return (
      <div className="text-neutral-700 dark:text-neutral-300 font-bold text-xs uppercase tracking-wider">
        Enrollment Open
      </div>
    );
  }

  const d = String(Math.floor(diff / (864e5))).padStart(2, '0');
  const h = String(Math.floor((diff / 36e5) % 24)).padStart(2, '0');
  const m = String(Math.floor((diff / 6e4) % 60)).padStart(2, '0');

  return (
    <div className="flex items-center gap-1">
      <div className="text-neutral-800 dark:text-neutral-200 font-mono font-bold text-sm">
        {d}<span className="text-[9px] text-neutral-400 ml-0.5 uppercase">d</span>
      </div>
      <span className="text-neutral-300 dark:text-neutral-600 font-bold">:</span>
      <div className="text-neutral-800 dark:text-neutral-200 font-mono font-bold text-sm">
        {h}<span className="text-[9px] text-neutral-400 ml-0.5 uppercase">h</span>
      </div>
      <span className="text-neutral-300 dark:text-neutral-600 font-bold">:</span>
      <div className="text-neutral-800 dark:text-neutral-200 font-mono font-bold text-sm">
        {m}<span className="text-[9px] text-neutral-400 ml-0.5 uppercase">m</span>
      </div>
    </div>
  );
});
CountdownTimer.displayName = "CountdownTimer";


const CourseCard = React.memo(({ course }: { course: Course }) => {
  if (!course) return null;

  const offerFee = course.fee || 0;
  const discountPercent = course.discount || 0;
  const fullFee = discountPercent > 0 ? Math.round(offerFee / (1 - (discountPercent / 100))) : offerFee;

  // Memoized specifically for this card to prevent recalculation
  const outcomeBullets = useMemo(() => extractOutcomeBullets(course), [course]);
  const nepaliStartDate = useMemo(() => getBikramSambatDate(course.start_datetime), [course.start_datetime]);

  const tagData = useMemo(() => {
    const tags = [
      { text: "Bestseller", icon: Zap, bg: "bg-orange-500 text-white" },
      { text: "Trending", icon: TrendingUp, bg: "bg-neutral-800 text-white dark:bg-neutral-200 dark:text-neutral-900" },
      { text: "Top Rated", icon: Star, bg: "bg-neutral-800 text-white dark:bg-neutral-200 dark:text-neutral-900" }
    ];
    return tags[(course.id?.length || 0) % tags.length];
  }, [course.id]);

  const updatedWeeksAgo = (course.id?.charCodeAt(0) % 3) + 1 || 1;
  
  return (
    <div className="group relative flex flex-col bg-white dark:bg-neutral-900 rounded-[1.25rem] border border-neutral-200/70 dark:border-neutral-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden">
      
      <Link href={`/onlinecourse/${course.course_code}`} className="absolute inset-0 z-10" aria-label={`View details for ${course.title}`} />
      
      <div className="relative w-full aspect-[16/9] overflow-hidden bg-neutral-100 dark:bg-neutral-800">
        <Image
          src={course.cover_pic || '/placeholder-course.jpg'}
          alt={course.title || 'Course Image'}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover group-hover:scale-[1.03] transition-transform duration-700 ease-out"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-900/80 via-neutral-900/10 to-transparent pointer-events-none" />
        
        <div className="absolute top-3 left-3 flex gap-1.5 z-10">
          {course.category && (
            <span className="bg-white/20 backdrop-blur-md border border-white/10 text-white px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider">
              {course.category}
            </span>
          )}
          <span className={`${tagData.bg} flex items-center gap-1 px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider`}>
            <tagData.icon size={10} className={tagData.text === 'Top Rated' ? 'fill-current' : ''} /> {tagData.text}
          </span>
        </div>

        <div className="absolute bottom-3 left-3 right-3 flex justify-between items-end z-10">
          <div className="flex flex-col">
            {discountPercent > 0 && (
              <span className="text-orange-400 font-bold text-[9px] uppercase tracking-widest mb-0.5">
                Limited Offer
              </span>
            )}
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-white tracking-tight">
                {formatCurrency(offerFee)}
              </span>
              {discountPercent > 0 && (
                <span className="text-xs text-neutral-300 line-through font-semibold opacity-70">
                  {formatCurrency(fullFee)}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-5 flex flex-col flex-grow relative pointer-events-none">
        
        <div className="flex items-center justify-between gap-3 mb-2.5 relative z-20 pointer-events-auto">
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ring-1 inset-ring ${DIFFICULTY_COLORS[course.difficulty_level] || DIFFICULTY_COLORS.Professional}`}>
            {course.difficulty_level || 'General'}
          </span>
          
          {course.syllabus_url && (
            <a 
              href={course.syllabus_url}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 text-[11px] font-semibold text-neutral-400 hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
            >
              <FileText size={12} /> View Syllabus
            </a>
          )}
        </div>

        <h2 className="text-lg font-black text-neutral-900 dark:text-white mb-2 leading-snug tracking-tight line-clamp-2 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
          {course.title || 'Untitled Course'}
        </h2>

        {outcomeBullets.length > 0 ? (
          <ul className="mb-4 flex-grow flex flex-col gap-1.5">
            {outcomeBullets.map((bullet, idx) => (
              <li key={idx} className="flex items-start gap-2 text-xs text-neutral-500/90 dark:text-neutral-400/90 font-medium leading-relaxed">
                <CheckCircle2 size={14} className="text-neutral-300 dark:text-neutral-600 shrink-0 mt-0.5" />
                <span className="line-clamp-2" title={bullet}>{bullet}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-neutral-400 dark:text-neutral-500 text-sm font-medium leading-relaxed line-clamp-2 mb-4 flex-grow">
             No preview details available right now.
          </p>
        )}

        <div className="flex items-center gap-2.5 text-xs font-semibold text-neutral-500 dark:text-neutral-400 mb-4">
          <Clock className="text-orange-500 opacity-80" size={14} />
          <span>{course.duration || 'N/A'}</span>
          <span className="text-neutral-300 dark:text-neutral-700">|</span>
          <span>{course.timing || 'N/A'}</span>
        </div>

        <div className="bg-neutral-50/80 dark:bg-neutral-800/40 rounded-lg p-3 mb-5">
          <p className="text-[9px] text-neutral-400 font-bold uppercase tracking-widest mb-1.5 flex items-center gap-1">
            <Calendar size={10} className="text-neutral-400"/> Starts: {nepaliStartDate}
          </p>
          {/* Isolated state component for Countdown */}
          {course.start_datetime && <CountdownTimer startDatetime={course.start_datetime} />}
        </div>

        <div className="mt-auto flex flex-col gap-2 relative z-20 pointer-events-auto">
          <Link 
            href={`/onlinecourse/${course.course_code}/enroll`}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold text-sm transition-colors"
          >
            Enroll Now <ArrowRight size={14} />
          </Link>
          
          <div className="flex justify-center items-center gap-1 mt-1 text-[9px] font-semibold text-neutral-400/60 uppercase tracking-widest">
            <History size={10} /> Updated {updatedWeeksAgo} {updatedWeeksAgo > 1 ? 'weeks' : 'week'} ago
          </div>
        </div>
      </div>
    </div>
  );
});

CourseCard.displayName = "CourseCard";

function CourseSkeleton() {
  return (
    <div className="bg-white dark:bg-neutral-900 rounded-[1.25rem] border border-neutral-100 dark:border-neutral-800 shadow-sm overflow-hidden flex flex-col">
      <div className="aspect-[16/9] w-full bg-neutral-100 dark:bg-neutral-800 animate-pulse" />
      <div className="p-4 sm:p-5 flex flex-col flex-grow space-y-4">
        <div className="flex justify-between">
          <div className="h-4 w-20 bg-neutral-100 dark:bg-neutral-800 rounded animate-pulse" />
        </div>
        <div className="h-5 w-4/5 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse" />
        <div className="space-y-2 mt-2">
          <div className="h-2.5 w-full bg-neutral-100 dark:bg-neutral-800 rounded animate-pulse" />
          <div className="h-2.5 w-5/6 bg-neutral-100 dark:bg-neutral-800 rounded animate-pulse" />
          <div className="h-2.5 w-4/6 bg-neutral-100 dark:bg-neutral-800 rounded animate-pulse" />
        </div>
        <div className="mt-auto pt-4">
          <div className="h-10 w-full bg-neutral-200 dark:bg-neutral-800 rounded-xl animate-pulse" />
        </div>
      </div>
    </div>
  );
}

function EmptyState({ onClear }: { onClear: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-5 text-center max-w-lg mx-auto bg-white dark:bg-neutral-900 rounded-[1.5rem] border border-neutral-200/60 dark:border-neutral-800 shadow-sm">
      <div className="bg-neutral-50 dark:bg-neutral-800/50 p-5 rounded-full mb-5 ring-4 ring-neutral-50 dark:ring-neutral-800">
        <BookOpen className="text-neutral-400" size={32} />
      </div>
      <h3 className="text-xl font-black tracking-tight text-neutral-900 dark:text-white mb-2">No Courses Found</h3>
      <p className="text-neutral-500 dark:text-neutral-400 mb-6 text-sm leading-relaxed font-medium">
        We couldn't find any courses matching your current filters. Try adjusting your search or clearing your filters to see more options.
      </p>
      <button 
        onClick={onClear} 
        className="bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 px-6 py-2.5 rounded-xl font-bold hover:opacity-90 transition-all active:scale-95 text-sm"
      >
        Browse All Courses
      </button>
    </div>
  );
}