"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { Clock, Calendar, FileText, ArrowRight, RefreshCcw, ChevronRight, Search, SlidersHorizontal, AlertCircle, BookOpen } from "lucide-react";
// 13. Nepali Date Converter
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

// 14. Global Timer Hook (Optimized Performance)
function useGlobalTimer() {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    // Update every minute instead of every second to save CPU
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

  // 11 & 12. Filtering and Sorting Logic
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
      // Default to newest (assuming start_datetime)
      return new Date(b.start_datetime).getTime() - new Date(a.start_datetime).getTime();
    });
  }, [courses, debouncedSearch, selectedCategory, sortBy]);

  const categories = ["All", ...Array.from(new Set(courses.map(c => c.category).filter(Boolean)))];
  const featuredCourses = useMemo(() => courses.slice(0, 2), [courses]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors duration-300">
      {/* Breadcrumbs */}
      <nav className="max-w-7xl mx-auto px-6 pt-8 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-gray-500">
        <Link href="/" className="hover:text-orange-600 transition-colors">Home</Link>
        <ChevronRight size={12} />
        <span className="text-orange-600">Online Courses</span>
      </nav>

      {/* 3. Improve Typography Hierarchy */}
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

        {/* 11 & 12. UI Controls (Search, Filter, Sort) */}
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
              className="bg-white dark:bg-gray-900 px-4 py-3.5 text-sm font-medium border border-gray-200 dark:border-gray-800 rounded-2xl focus:ring-4 focus:ring-orange-500/20 outline-none cursor-pointer shadow-sm"
            >
              {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
            <select 
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="bg-white dark:bg-gray-900 px-4 py-3.5 text-sm font-medium border border-gray-200 dark:border-gray-800 rounded-2xl focus:ring-4 focus:ring-orange-500/20 outline-none cursor-pointer shadow-sm"
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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

  const currencyFormatter = new Intl.NumberFormat('en-NP', {
    style: 'currency',
    currency: 'NPR',
    minimumFractionDigits: 0
  });

  const offerFee = course.fee || 0;
  const discountPercent = course.discount || 0;
  const fullFee = discountPercent > 0 
    ? Math.round(offerFee / (1 - (discountPercent / 100))) 
    : offerFee;

  // 13. Nepali Date Logic implementation
  const getBikramSambatDate = (isoString: string) => {
    if (!isoString) return 'TBA';
    try {
      const date = new Date(isoString);
      const nepaliDate = new NepaliDate(date);
      return nepaliDate.format('DD MMMM, YYYY');
    } catch (e) {
      // Fallback
      return new Date(isoString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const nepaliStartDate = getBikramSambatDate(course.start_datetime);

  // 7. Improved Boxed Countdown Logic
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

  return (
    // 8 & 9. Add Hover Elevation Depth & Consistent Border Radius
    <div className="group flex flex-col bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 hover:border-orange-500/50 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 overflow-hidden relative">
      
      {/* --- TOP IMAGE SECTION --- */}
      {/* 1. Fix Image Quality: aspect-ratio, object-fit */}
      <div className="relative w-full aspect-[16/9] overflow-hidden bg-gray-100 dark:bg-gray-800">
        <Image
          src={course.cover_pic || '/placeholder-course.jpg'}
          alt={course.title || 'Course Image'}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover group-hover:scale-[1.05] transition-transform duration-500"
        />
        {/* 2. Gradient Overlay on Images */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />
        
        {/* Top Badges */}
        <div className="absolute top-4 left-4 flex gap-2 z-10">
          {/* 4. Reduce Badge Noise - 1 Primary Badge */}
          {course.category && (
            <span className="bg-orange-600 text-white px-3 py-1 rounded-lg text-[11px] font-black uppercase tracking-wider shadow-lg">
              {course.category}
            </span>
          )}
        </div>

        {/* 5. Make Price the Hero Element */}
        <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end z-10">
          <div className="flex flex-col">
            {discountPercent > 0 && (
              <span className="text-orange-400 font-bold text-xs uppercase tracking-wider mb-1 animate-pulse">
                Limited Offer
              </span>
            )}
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-white drop-shadow-md">
                {currencyFormatter.format(offerFee).replace('NPR', 'NPR ')}
              </span>
              {discountPercent > 0 && (
                <span className="text-sm text-gray-300 line-through font-medium">
                  {currencyFormatter.format(fullFee)}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* --- CONTENT SECTION --- */}
      <div className="p-6 flex flex-col flex-grow">
        {/* 4. Secondary Row for extra labels */}
        <div className="flex items-center justify-between gap-3 mb-4">
          <span className={`px-3 py-1 rounded-lg text-xs font-bold ring-1 inset-ring ${DIFFICULTY_COLORS[course.difficulty_level] || DIFFICULTY_COLORS.Professional}`}>
            {course.difficulty_level || 'General'}
          </span>
          
          {course.syllabus_url && (
            <a 
              href={`https://docs.google.com/viewer?url=${encodeURIComponent(course.syllabus_url)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
            >
              <FileText size={14} /> Syllabus
            </a>
          )}
        </div>

        {/* 3. Typography Hierarchy */}
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2 leading-tight line-clamp-2 group-hover:text-orange-600 dark:group-hover:text-orange-500 transition-colors">
          {course.title || 'Untitled Course'}
        </h2>

        <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed line-clamp-2 mb-6 flex-grow">
          {course.description || 'No description available.'}
        </p>

        <div className="space-y-4 mb-6">
          <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
            <Clock className="text-orange-500" size={16} />
            <span className="font-medium">{course.duration || 'N/A'}</span>
            <span className="text-gray-300 dark:text-gray-700">|</span>
            <span className="font-medium">{course.timing || 'N/A'}</span>
          </div>
        </div>

        {/* 7. Improve Countdown Design */}
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 mb-6 border border-gray-100 dark:border-gray-800">
          <p className="text-[11px] text-gray-500 font-bold uppercase tracking-wider mb-2">
            Starts: {nepaliStartDate}
          </p>
          {countdown && !countdown.expired ? (
            <div className="flex items-center gap-2">
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white font-mono font-bold px-2.5 py-1.5 rounded-lg text-sm shadow-sm">
                {countdown.d}
                <span className="text-[10px] text-gray-400 ml-1">d</span>
              </div>
              <span className="text-gray-400 font-bold">:</span>
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white font-mono font-bold px-2.5 py-1.5 rounded-lg text-sm shadow-sm">
                {countdown.h}
                <span className="text-[10px] text-gray-400 ml-1">h</span>
              </div>
              <span className="text-gray-400 font-bold">:</span>
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white font-mono font-bold px-2.5 py-1.5 rounded-lg text-sm shadow-sm">
                {countdown.m}
                <span className="text-[10px] text-gray-400 ml-1">m</span>
              </div>
            </div>
          ) : (
            <div className="text-emerald-600 dark:text-emerald-400 font-black text-sm uppercase tracking-wider">
              Enrollment Open Now
            </div>
          )}
        </div>

        {/* 6. Add CTA Button (Very Important) */}
        <div className="flex items-center gap-3 mt-auto">
          <Link 
            href={`/online-courses/${course.id || '#'}`}
            className="flex-1 text-center py-3 px-4 rounded-xl font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 dark:text-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors"
          >
            Details
          </Link>
          <Link 
            href={`/online-courses/${course.id || '#'}/enroll`}
            className="flex-[2] flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-white bg-orange-600 hover:bg-orange-700 shadow-lg shadow-orange-600/20 hover:shadow-orange-600/40 transition-all active:scale-95"
          >
            Enroll Now <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    </div>
  );
});

CourseCard.displayName = "CourseCard";

// 15. Loading Skeleton Variety
function CourseSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden flex flex-col">
      <div className="aspect-[16/9] w-full bg-gray-200 dark:bg-gray-800 animate-pulse" />
      <div className="p-6 flex flex-col flex-grow space-y-4">
        <div className="flex justify-between">
          <div className="h-6 w-24 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
          <div className="h-6 w-16 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
        </div>
        <div className="h-7 w-4/5 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
        <div className="space-y-2 mt-2">
          <div className="h-4 w-full bg-gray-100 dark:bg-gray-800/50 rounded animate-pulse" />
          <div className="h-4 w-2/3 bg-gray-100 dark:bg-gray-800/50 rounded animate-pulse" />
        </div>
        <div className="mt-auto pt-6 flex gap-3">
          <div className="h-12 flex-1 bg-gray-200 dark:bg-gray-800 rounded-xl animate-pulse" />
          <div className="h-12 flex-[2] bg-gray-200 dark:bg-gray-800 rounded-xl animate-pulse delay-75" />
        </div>
      </div>
    </div>
  );
}

// 10. Improve Empty State UX
function EmptyState({ onClear }: { onClear: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center max-w-lg mx-auto bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
      <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-full mb-6">
        <BookOpen className="text-gray-400" size={48} />
      </div>
      <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2">No Courses Found</h3>
      <p className="text-gray-500 dark:text-gray-400 mb-8 leading-relaxed">
        We couldn't find any courses matching your current filters. Try adjusting your search or clearing your filters to see more options.
      </p>
      <button 
        onClick={onClear} 
        className="bg-orange-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-orange-600/20 hover:bg-orange-700 hover:-translate-y-0.5 transition-all"
      >
        Browse All Courses
      </button>
    </div>
  );
}