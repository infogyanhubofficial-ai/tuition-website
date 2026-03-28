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
  title: string;
  duration: string;
  timing: string;
  fee: number;      
  discount: number; 
  category: string;
  difficulty_level: string;
  description: string;
  start_datetime: string;
  syllabus_url: string;
  cover_pic: string;
}

const DIFFICULTY_COLORS: Record<string, string> = {
  Beginner: "text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/30 ring-emerald-500/20",
  Intermediate: "text-indigo-600 bg-indigo-50 dark:text-indigo-400 dark:bg-indigo-950/30 ring-indigo-500/20",
  Professional: "text-rose-600 bg-rose-50 dark:text-rose-400 dark:bg-rose-950/30 ring-rose-500/20",
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

function useGlobalTimer() {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60000); 
    return () => clearInterval(timer);
  }, []);
  return now;
}

// --- Main Page Component ---
export default function OnlineCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortBy, setSortBy] = useState("newest");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const debouncedSearch = useDebounce(searchTerm, 300);
  const globalTime = useGlobalTimer();

  const fetchCourses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/online-courses");
      if (!res.ok) throw new Error("Failed to fetch courses");
      const data = await res.json();
      setCourses(Array.isArray(data) ? data : []);
    } catch (err) {
      setError("We couldn't load the courses. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCourses(); }, [fetchCourses]);

  const filteredAndSortedCourses = useMemo(() => {
    let result = courses.filter(course =>
      course?.title?.toLowerCase().includes(debouncedSearch.toLowerCase())
    );

    if (selectedCategory !== "All") {
      result = result.filter(course => course.category === selectedCategory);
    }

    return result.sort((a, b) => {
      const priceA = a.fee * (1 - (a.discount || 0) / 100);
      const priceB = b.fee * (1 - (b.discount || 0) / 100);
      
      if (sortBy === "price_low") return priceA - priceB;
      if (sortBy === "price_high") return priceB - priceA;
      return new Date(b.start_datetime).getTime() - new Date(a.start_datetime).getTime();
    });
  }, [courses, debouncedSearch, selectedCategory, sortBy]);

  const categories = ["All", ...Array.from(new Set(courses.map(c => c.category).filter(Boolean)))];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors duration-300">
      <nav className="max-w-7xl mx-auto px-6 pt-8 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-gray-500">
        <Link href="/" className="hover:text-orange-600 transition-colors">Home</Link>
        <ChevronRight size={12} />
        <span className="text-orange-600">Online Courses</span>
      </nav>

      <header className="max-w-7xl mx-auto px-6 sm:px-8 pt-12 pb-10 flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8 border-b border-gray-200 dark:border-gray-800">
        <div className="w-full lg:w-auto">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight mb-3 text-gray-900 dark:text-white">
            Master Your Future <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-amber-500">
              Online Courses
            </span>
          </h1>
          <p className="text-lg text-gray-500 dark:text-gray-400 font-medium max-w-xl">
            Level up your skills with industry-leading experts. High-quality, interactive live classes designed for your success.
          </p>
        </div>

        <div className="w-full lg:w-auto flex flex-col sm:flex-row gap-4">
          <div className="relative group w-full sm:w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search courses..."
              className="w-full bg-white dark:bg-gray-900 pl-11 pr-4 py-3.5 text-sm font-medium border border-gray-200 dark:border-gray-800 rounded-2xl focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all shadow-sm"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <select 
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="bg-white dark:bg-gray-900 px-4 py-3.5 text-sm font-medium border border-gray-200 dark:border-gray-800 rounded-2xl focus:ring-4 focus:ring-orange-500/20 outline-none cursor-pointer shadow-sm flex-1 sm:flex-none"
            >
              {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
            <select 
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="bg-white dark:bg-gray-900 px-4 py-3.5 text-sm font-medium border border-gray-200 dark:border-gray-800 rounded-2xl focus:ring-4 focus:ring-orange-500/20 outline-none cursor-pointer shadow-sm flex-1 sm:flex-none"
            >
              <option value="newest">Newest First</option>
              <option value="price_low">Price: Low to High</option>
              <option value="price_high">Price: High to Low</option>
            </select>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 sm:px-8 mt-12 pb-24">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {[1, 2, 3, 4, 5, 6].map((i) => <CourseSkeleton key={i} />)}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-24 text-center bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
            <AlertCircle className="text-rose-500 mb-4" size={48} />
            <p className="text-gray-900 dark:text-white font-bold text-xl mb-2">Oops! Something went wrong.</p>
            <p className="text-gray-500 mb-6">{error}</p>
            <button onClick={fetchCourses} className="inline-flex items-center gap-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-6 py-3 rounded-xl font-bold hover:opacity-90 transition-all">
              <RefreshCcw size={18} /> Try Again
            </button>
          </div>
        ) : filteredAndSortedCourses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {filteredAndSortedCourses.map((course) => (
              <CourseCard key={course.id} course={course} globalTime={globalTime} />
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

const CourseCard = React.memo(({ course, globalTime }: { course: Course; globalTime: number }) => {
  if (!course) return null;

  const currencyFormatter = new Intl.NumberFormat('en-NP', { style: 'currency', currency: 'NPR', minimumFractionDigits: 0 });

  const offerFee = course.fee || 0;
  const discountPercent = course.discount || 0;
  const fullFee = discountPercent > 0 ? Math.round(offerFee / (1 - (discountPercent / 100))) : offerFee;

  const getBikramSambatDate = (isoString: string) => {
    if (!isoString) return 'TBA';
    try {
      const date = new Date(isoString);
      return new NepaliDate(date).format('DD MMMM, YYYY');
    } catch (e) {
      return new Date(isoString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };
  const nepaliStartDate = getBikramSambatDate(course.start_datetime);

  const getCountdown = () => {
    if (!course.start_datetime) return null;
    const diff = new Date(course.start_datetime).getTime() - globalTime;
    if (diff <= 0) return { expired: true };
    return {
      expired: false,
      d: String(Math.floor(diff / (864e5))).padStart(2, '0'),
      h: String(Math.floor((diff / 36e5) % 24)).padStart(2, '0'),
      m: String(Math.floor((diff / 6e4) % 60)).padStart(2, '0')
    };
  };
  const countdown = getCountdown();

  // Bullet Point Extractor: Cleans the DB description to render clean list items
  const descriptionBullets = useMemo(() => {
    if (!course.description) return [];
    return course.description
      .split('\n')
      .filter(line => line.trim().length > 0)
      .map(line => line.replace(/✔️|✅|▪️|-/g, '').trim()) // Strip generic bullets from DB
      .slice(0, 4); // Keep top 4 for density
  }, [course.description]);

  // Consistent Random Tag based on ID length
  const tagData = useMemo(() => {
    const tags = [
      { text: "Bestseller", icon: Zap, bg: "bg-orange-500 text-white", border: "border-orange-400" },
      { text: "Trending", icon: TrendingUp, bg: "bg-blue-500 text-white", border: "border-blue-400" },
      { text: "Top Rated", icon: Star, bg: "bg-amber-500 text-white", border: "border-amber-400" }
    ];
    return tags[(course.id?.length || 0) % tags.length];
  }, [course.id]);

  // Mock 'Last Updated' logic (1 to 3 weeks based on ID)
  const updatedWeeksAgo = (course.id?.charCodeAt(0) % 3) + 1;

  return (
    <div className="group relative flex flex-col bg-gradient-to-b from-gray-50 to-white dark:from-gray-900/50 dark:to-gray-900 rounded-[1.5rem] border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300 overflow-hidden">
      
      {/* 1. FULL CARD CLICKABLE (Absolute Link stretching over card) */}
      <Link href={`/online-courses/${course.id}`} className="absolute inset-0 z-10" aria-label={`View details for ${course.title}`} />
      
      {/* --- TOP IMAGE SECTION --- */}
      <div className="relative w-full aspect-[16/9] overflow-hidden bg-gray-100 dark:bg-gray-800">
        <Image
          src={course.cover_pic || '/placeholder-course.jpg'}
          alt={course.title || 'Course Image'}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover group-hover:scale-[1.05] transition-transform duration-700 ease-out"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/90 via-gray-900/20 to-transparent pointer-events-none" />
        
        <div className="absolute top-4 left-4 flex gap-2 z-10">
          {course.category && (
            <span className="bg-white/10 backdrop-blur-md border border-white/20 text-white px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider shadow-sm">
              {course.category}
            </span>
          )}
          {/* Dynamic Interactive Tag */}
          <span className={`${tagData.bg} border ${tagData.border} flex items-center gap-1 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider shadow-md`}>
            <tagData.icon size={12} className={tagData.text === 'Top Rated' ? 'fill-current' : ''} /> {tagData.text}
          </span>
        </div>

        <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end z-10">
          <div className="flex flex-col">
            {discountPercent > 0 && (
              <span className="text-orange-400 font-bold text-[10px] uppercase tracking-widest mb-0.5 animate-pulse">
                Limited Offer
              </span>
            )}
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-white drop-shadow-md tracking-tight">
                {currencyFormatter.format(offerFee).replace('NPR', 'NPR ')}
              </span>
              {discountPercent > 0 && (
                <span className="text-sm text-gray-300 line-through font-bold opacity-80">
                  {currencyFormatter.format(fullFee)}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* --- CONTENT SECTION (Increased Density) --- */}
      <div className="p-4 sm:p-5 flex flex-col flex-grow relative pointer-events-none">
        
        {/* Difficulty & Syllabus (Z-20 to allow clicks over main link) */}
        <div className="flex items-center justify-between gap-3 mb-3 relative z-20 pointer-events-auto">
          <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ring-1 inset-ring ${DIFFICULTY_COLORS[course.difficulty_level] || DIFFICULTY_COLORS.Professional}`}>
            {course.difficulty_level || 'General'}
          </span>
          
          {course.syllabus_url && (
            <a 
              href={`https://docs.google.com/viewer?url=${encodeURIComponent(course.syllabus_url)}`}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs font-bold text-gray-400 hover:text-orange-600 dark:hover:text-orange-400 transition-colors bg-gray-50 dark:bg-gray-800/50 px-2 py-1 rounded-md"
            >
              <FileText size={12} /> View Syllabus
            </a>
          )}
        </div>

        <h2 className="text-lg sm:text-xl font-black text-gray-900 dark:text-white mb-3 leading-tight line-clamp-2 group-hover:text-orange-600 dark:group-hover:text-orange-500 transition-colors">
          {course.title || 'Untitled Course'}
        </h2>

        {/* 5. Bullet Style Preview */}
        {descriptionBullets.length > 0 ? (
          <ul className="space-y-1.5 mb-5 flex-grow">
            {descriptionBullets.map((bullet, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400 font-medium">
                <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                <span className="line-clamp-1">{bullet}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500 dark:text-gray-400 text-sm font-medium leading-relaxed line-clamp-3 mb-5 flex-grow">
             No preview details available right now.
          </p>
        )}

        <div className="flex items-center gap-3 text-xs sm:text-sm font-bold text-gray-600 dark:text-gray-300 mb-4 bg-gray-50/50 dark:bg-gray-800/30 p-2.5 rounded-xl border border-gray-100 dark:border-gray-800">
          <Clock className="text-orange-500" size={16} />
          <span>{course.duration || 'N/A'}</span>
          <span className="text-gray-300 dark:text-gray-700">|</span>
          <span>{course.timing || 'N/A'}</span>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-3 mb-5 border border-gray-100 dark:border-gray-700 shadow-sm">
          <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-2 flex items-center gap-1.5">
            <Calendar size={12} className="text-emerald-500"/> Starts: {nepaliStartDate}
          </p>
          {countdown && !countdown.expired ? (
            <div className="flex items-center gap-1.5">
              <div className="bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 text-gray-900 dark:text-white font-mono font-black px-2 py-1 rounded-md text-sm">
                {countdown.d}<span className="text-[9px] text-gray-400 ml-0.5 uppercase">d</span>
              </div>
              <span className="text-gray-300 font-bold">:</span>
              <div className="bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 text-gray-900 dark:text-white font-mono font-black px-2 py-1 rounded-md text-sm">
                {countdown.h}<span className="text-[9px] text-gray-400 ml-0.5 uppercase">h</span>
              </div>
              <span className="text-gray-300 font-bold">:</span>
              <div className="bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 text-gray-900 dark:text-white font-mono font-black px-2 py-1 rounded-md text-sm">
                {countdown.m}<span className="text-[9px] text-gray-400 ml-0.5 uppercase">m</span>
              </div>
            </div>
          ) : (
            <div className="text-emerald-600 dark:text-emerald-400 font-black text-xs uppercase tracking-wider">
               Enrollment Open
            </div>
          )}
        </div>

        {/* --- BOTTOM CTA SECTION --- */}
        <div className="mt-auto flex flex-col gap-3 relative z-20 pointer-events-auto">
          <div className="flex items-center gap-2">
            <Link 
              href={`/online-courses/${course.id || '#'}/enroll`}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-black text-white bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 shadow-[0_5px_15px_rgba(234,88,12,0.2)] hover:shadow-[0_8px_25px_rgba(234,88,12,0.4)] transition-all active:scale-95"
            >
              Enroll Now <ArrowRight size={16} />
            </Link>
          </div>
          
          {/* Last Updated Meta */}
          <div className="flex justify-center items-center gap-1.5 mt-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
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
    <div className="bg-white dark:bg-gray-900 rounded-[1.5rem] border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden flex flex-col">
      <div className="aspect-[16/9] w-full bg-gray-200 dark:bg-gray-800 animate-pulse" />
      <div className="p-5 flex flex-col flex-grow space-y-4">
        <div className="flex justify-between">
          <div className="h-5 w-24 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
        </div>
        <div className="h-6 w-4/5 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
        <div className="space-y-2 mt-2">
          <div className="h-3 w-full bg-gray-100 dark:bg-gray-800/50 rounded animate-pulse" />
          <div className="h-3 w-5/6 bg-gray-100 dark:bg-gray-800/50 rounded animate-pulse" />
          <div className="h-3 w-4/6 bg-gray-100 dark:bg-gray-800/50 rounded animate-pulse" />
        </div>
        <div className="mt-auto pt-4">
          <div className="h-12 w-full bg-gray-200 dark:bg-gray-800 rounded-xl animate-pulse" />
        </div>
      </div>
    </div>
  );
}

function EmptyState({ onClear }: { onClear: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center max-w-lg mx-auto bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm">
      <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-full mb-6 ring-8 ring-gray-50 dark:ring-gray-800">
        <BookOpen className="text-gray-400" size={40} />
      </div>
      <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2">No Courses Found</h3>
      <p className="text-gray-500 dark:text-gray-400 mb-8 leading-relaxed font-medium">
        We couldn't find any courses matching your current filters. Try adjusting your search or clearing your filters to see more options.
      </p>
      <button 
        onClick={onClear} 
        className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-8 py-3.5 rounded-xl font-black shadow-lg hover:opacity-90 transition-all active:scale-95"
      >
        Browse All Courses
      </button>
    </div>
  );
}