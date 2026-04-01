"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { 
  PlayCircle, Clock, CheckCircle2, X, ShoppingCart, 
  ExternalLink, BarChart, BookOpen, ShieldCheck, Zap,
  Video, Infinity, Award, ArrowRight, Search, Loader2, AlertTriangle,
  ChevronDown, HelpCircle, ChevronUp
} from "lucide-react";

// --- STRICT TYPES (Aligned perfectly with your Supabase Postgres schema) ---
interface RecordingCourse {
  id: string; // uuid
  course_name: string; // text
  category: string | null; // text null
  difficulty_level: string | null; // text null
  description: string | null; // text null
  course_hours: string; // text
  standard_fee: number | string; // numeric(10,2) can return as string
  discount: number | null; // smallint null
  cover_pic_url: string | null; // text null
  demo_video_url: string | null; // text null
  syllabus_url: string | null; // text null
  learning_outcomes: any; // jsonb safely handled
  faqs: any; // jsonb null
  is_active: boolean | null; // boolean null
  created_at?: string;
  updated_at?: string;
}

interface FaqItem {
  question: string;
  answer: string;
}

// --- UTILITY FUNCTIONS ---
const formatCurrency = (amount: number | string) => {
  const num = Number(amount) || 0;
  return new Intl.NumberFormat('en-NP', { style: 'currency', currency: 'NPR', maximumFractionDigits: 0 }).format(num);
};

const calculateSalePrice = (fee: number | string, discount: number | null) => {
  const numericFee = Number(fee) || 0;
  const activeDiscount = Number(discount) || 0;
  return numericFee - (numericFee * activeDiscount / 100);
};

const getLearningOutcomes = (data: any): string[] => {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (typeof data === 'object' && Array.isArray(data.learning_outcomes)) {
    return data.learning_outcomes;
  }
  return [];
};

// Safely parses the FAQs from JSONB
const getFaqs = (data: any): FaqItem[] => {
  if (!data) return [];
  const arr = Array.isArray(data) ? data : (data.faqs && Array.isArray(data.faqs) ? data.faqs : []);
  // Ensure we only return items that actually have a question and answer
  return arr.filter((item: any) => item && typeof item.question === 'string' && typeof item.answer === 'string');
};

const getYouTubeEmbedUrl = (url: string | null) => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? `https://www.youtube.com/embed/${match[2]}?autoplay=0&rel=0` : null;
};

const parseDescription = (desc: string | null) => {
  if (!desc) return [];
  return desc.split('\n')
    .map(line => line.replace(/✔️/g, '').trim())
    .filter(line => line.length > 0);
};

// --- COMPONENTS ---
export default function RecordedCoursesPage() {
  const router = useRouter();
  const supabase = createClient();

  // --- State ---
  const [courses, setCourses] = useState<RecordingCourse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null); 
  const [activeModalCourse, setActiveModalCourse] = useState<RecordingCourse | null>(null);
  const [expandedFaqIndex, setExpandedFaqIndex] = useState<number | null>(null); // Track open FAQ
  
  // Mobile specific accordion states
  const [showLearningOutcomes, setShowLearningOutcomes] = useState(false);
  const [showMobileFaqs, setShowMobileFaqs] = useState(false);
  
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  // Fetch Live Data from Supabase
  useEffect(() => {
    const fetchRecordings = async () => {
      setIsLoading(true);
      setDbError(null);
      try {
        const { data, error } = await supabase
          .from("recordings")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;
        
        if (data) {
          setCourses(data as RecordingCourse[]);
        }
      } catch (error: any) {
        console.error("Error fetching recordings:", error);
        setDbError(error.message || "Failed to load courses. Please check your database connection.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecordings();
  }, [supabase]);

  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (activeModalCourse) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [activeModalCourse]);

  const handleOpenModal = (course: RecordingCourse) => {
    setActiveModalCourse(course);
    setExpandedFaqIndex(null); // Reset FAQ state when opening a new modal
    setShowLearningOutcomes(false); // Reset mobile accordions
    setShowMobileFaqs(false);
  };

  const handlePurchaseClick = (course: RecordingCourse) => {
    const salePrice = calculateSalePrice(course.standard_fee, course.discount);
    const orderUrl = `/order?type=recording&courseId=${course.id}&courseName=${encodeURIComponent(course.course_name)}&price=${salePrice}&cover=${encodeURIComponent(course.cover_pic_url || '')}`;
    setActiveModalCourse(null);
    router.push(orderUrl);
  };

  // Dynamic categories from live DB data
  const categories = useMemo(() => {
    const cats = courses.map(c => c.category).filter(Boolean) as string[];
    return ["All", ...Array.from(new Set(cats))];
  }, [courses]);

  // Filter the live data
  const filteredCourses = useMemo(() => {
    return courses.filter(course => {
      if (course.is_active === false) return false;
      
      const matchesSearch = 
        course.course_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (course.description && course.description.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesCategory = activeCategory === "All" || course.category === activeCategory;

      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, activeCategory, courses]);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-24 selection:bg-blue-100">
      
      {/* --- PREMIUM HERO SECTION --- */}
      <section className="relative bg-[#0f172a] text-white pt-24 pb-48 px-4 sm:px-6 lg:px-8 overflow-hidden isolation-auto">
        
        {/* Animated Background Glowing Orbs */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
          {/* Subtle Grid overlay */}
          <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
          
          {/* Blue Orb */}
          <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[70%] rounded-full bg-blue-600/20 blur-[120px] animate-blob mix-blend-screen"></div>
          
          {/* Emerald Orb */}
          <div className="absolute top-[20%] -right-[10%] w-[45%] h-[60%] rounded-full bg-emerald-500/15 blur-[120px] animate-blob animation-delay-2000 mix-blend-screen"></div>
          
          {/* Deep Violet Orb */}
          <div className="absolute -bottom-[20%] left-[20%] w-[60%] h-[50%] rounded-full bg-indigo-600/15 blur-[120px] animate-blob animation-delay-4000 mix-blend-screen"></div>
        </div>

        {/* Hero Content Wrapper */}
        <div className="max-w-[1400px] mx-auto relative z-10 flex flex-col items-center text-center">
          
          <div className="bg-white/5 backdrop-blur-md border border-white/10 p-1 rounded-full mb-8 shadow-2xl">
            <span className="bg-blue-600/30 text-blue-300 border border-blue-500/30 px-5 py-2 rounded-full text-sm font-bold tracking-wide uppercase flex items-center gap-2">
              <Zap size={16} className="fill-blue-400" /> Instant Course Recording Access
            </span>
          </div>
          
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6 max-w-5xl leading-[1.1]">
            Master New Skills on Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-emerald-400 drop-shadow-sm">Schedule</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-slate-300/90 max-w-3xl leading-relaxed mb-10 font-medium">
            Premium recorded courses taught by industry experts. Get lifetime access instantly and learn at your own pace with our exclusive discounted course recordings.
          </p>

          <div className="flex flex-wrap justify-center gap-6 md:gap-12 text-sm md:text-base font-semibold text-slate-300/80 bg-slate-900/40 backdrop-blur-xl border border-white/10 px-8 py-5 rounded-2xl shadow-xl">
            <div className="flex items-center gap-2.5"><Infinity size={20} className="text-blue-400 stroke-[2]" /> Lifetime Access</div>
            <div className="hidden md:block w-px h-5 bg-white/10"></div>
            <div className="flex items-center gap-2.5"><Award size={20} className="text-emerald-400 stroke-[2]" /> Industry-Focused</div>
            <div className="hidden md:block w-px h-5 bg-white/10"></div>
            <div className="flex items-center gap-2.5"><ShieldCheck size={20} className="text-indigo-400 stroke-[2]" /> Secure Checkout</div>
          </div>

        </div>
      </section>

      {/* --- LISTING & FILTER SECTION --- */}
      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 relative z-20 -mt-16">
        
        {/* Search & Filter Bar */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-white p-4 mb-10 flex flex-col lg:flex-row gap-4 items-center justify-between">
          <div className="flex overflow-x-auto w-full lg:w-auto gap-2 pb-2 lg:pb-0 hide-scrollbar flex-grow">
            {categories.map(cat => (
              <button 
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`whitespace-nowrap px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${
                  activeCategory === cat 
                  ? "bg-slate-900 text-white shadow-md transform scale-[1.02]" 
                  : "bg-slate-50/80 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/60"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="relative w-full lg:w-96 flex-shrink-0 group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search size={18} className="text-slate-400 group-focus-within:text-blue-600 transition-colors" />
            </div>
            <input
              type="text"
              placeholder="Search recordings..."
              className="block w-full pl-11 pr-4 py-3.5 border border-slate-200/80 rounded-xl bg-slate-50/50 focus:bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-slate-900 shadow-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Results Header */}
        <div className="mb-6 flex justify-between items-end">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {activeCategory === "All" ? "All Recordings" : activeCategory}
            </h2>
            <p className="text-slate-500 font-medium text-sm mt-1">
              {isLoading ? "Fetching from database..." : `Showing ${filteredCourses.length} ${filteredCourses.length === 1 ? 'course' : 'courses'}`}
            </p>
          </div>
        </div>

        {/* Database Error State */}
        {dbError && (
          <div className="bg-red-50 rounded-[24px] border border-red-200 p-10 flex flex-col items-center justify-center shadow-sm mb-8 text-center">
            <AlertTriangle className="w-10 h-10 text-red-500 mb-4" />
            <h3 className="text-lg font-bold text-red-900 mb-2">Database Error</h3>
            <p className="text-red-700 max-w-md">{dbError}</p>
            <p className="text-red-600 text-sm mt-4">Make sure you have enabled Row Level Security (RLS) allowing SELECT queries on the recordings table.</p>
          </div>
        )}

        {/* Loading State */}
        {isLoading && !dbError && (
          <div className="bg-white rounded-[24px] border border-slate-200 p-20 flex flex-col items-center justify-center shadow-sm">
            <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-4" />
            <p className="text-slate-600 font-medium">Loading live recordings from Supabase...</p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !dbError && filteredCourses.length === 0 && (
          <div className="bg-white rounded-[24px] border border-dashed border-slate-300 p-16 text-center flex flex-col items-center justify-center">
            <div className="bg-slate-50 p-4 rounded-full mb-4">
              <Search size={32} className="text-slate-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">No recordings found</h3>
            <p className="text-slate-500 max-w-sm mb-6">
              {courses.length === 0 
                ? "Your database 'recordings' table is empty. Please add courses to Supabase." 
                : `We couldn't find any courses matching "${searchQuery}" in ${activeCategory}.`}
            </p>
            <button 
              onClick={() => { setSearchQuery(""); setActiveCategory("All"); }}
              className="bg-slate-900 text-white px-6 py-2.5 rounded-[12px] font-bold text-sm hover:bg-blue-600 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        )}

        {/* Course Grid */}
        {!isLoading && !dbError && filteredCourses.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredCourses.map((course, index) => {
              const activeDiscount = course.discount || 0;
              const salePrice = calculateSalePrice(course.standard_fee, activeDiscount);
              const features = parseDescription(course.description);
              const isFeatured = index === 0 && filteredCourses.length > 1; 

              return (
                <div 
                  key={course.id} 
                  onClick={() => handleOpenModal(course)}
                  className={`bg-white rounded-[24px] border border-slate-200/60 shadow-sm hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.08)] hover:-translate-y-[2px] transition-all duration-300 group cursor-pointer flex flex-col overflow-hidden ${isFeatured ? 'md:col-span-2 lg:col-span-2 md:flex-row' : ''}`}
                >
                  <div className={`relative bg-slate-100 overflow-hidden flex-shrink-0 ${isFeatured ? 'md:w-[45%] md:h-auto h-60' : 'aspect-video w-full'}`}>
                    <img 
                      src={course.cover_pic_url || "/api/placeholder/800/450"} 
                      alt={course.course_name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-slate-900/10 to-transparent opacity-80"></div>
                    
                    <div className="absolute top-4 left-4 flex flex-col items-start gap-2">
                      <div className="bg-slate-900/80 backdrop-blur-md text-white rounded-[10px] px-2.5 py-1 text-xs font-semibold flex items-center gap-1.5 border border-white/10 shadow-sm">
                        <Video size={14} className="stroke-[2]" /> Recorded
                      </div>
                    </div>

                    {activeDiscount > 0 && (
                      <div className="absolute top-4 right-4 bg-red-500/95 backdrop-blur-md text-white text-xs font-bold px-2.5 py-1 rounded-[10px] shadow-sm border border-red-400/20">
                        {activeDiscount}% OFF
                      </div>
                    )}
                    
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="bg-white/90 backdrop-blur-sm p-3.5 rounded-full shadow-xl transform scale-90 group-hover:scale-100 transition-transform">
                        <PlayCircle size={28} className="text-blue-600 fill-blue-600/10" />
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col flex-grow">
                    <div className={`p-6 md:p-7 flex-grow ${isFeatured ? 'flex flex-col justify-center' : ''}`}>
                      <div className="flex items-center gap-3 mb-4">
                        {course.category && (
                          <>
                            <span className="text-blue-600 text-xs font-bold tracking-wide uppercase">{course.category}</span>
                            <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                          </>
                        )}
                        <span className="flex items-center gap-1 text-slate-500 text-xs font-medium">
                          <Clock size={14} className="stroke-[1.5]" /> {course.course_hours} Hours
                        </span>
                      </div>

                      <h3 className={`font-extrabold text-slate-900 tracking-tight leading-snug mb-5 group-hover:text-blue-600 transition-colors ${isFeatured ? 'text-2xl md:text-3xl' : 'text-xl line-clamp-2'}`}>
                        {course.course_name}
                      </h3>

                      {features.length > 0 && (
                        <ul className="space-y-2 mb-2 flex-grow">
                          {features.slice(0, isFeatured ? 4 : 3).map((feature, idx) => (
                            <li key={idx} className="flex items-start gap-2.5 text-sm text-slate-500">
                              <CheckCircle2 size={16} className="text-emerald-500 mt-0.5 flex-shrink-0 stroke-[2]" />
                              <span className={isFeatured ? '' : 'line-clamp-1'}>{feature}</span>
                            </li>
                          ))}
                          {features.length > (isFeatured ? 4 : 3) && (
                            <li className="text-xs font-semibold text-slate-400 pl-7 mt-2">
                              + {features.length - (isFeatured ? 4 : 3)} more included
                            </li>
                          )}
                        </ul>
                      )}
                    </div>

                    <div className="mt-auto p-5 md:px-7 md:py-5 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between">
                      <div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Recording Price</div>
                        <div className="flex items-baseline gap-2">
                          <span className="text-2xl font-black text-slate-900 tracking-tight">
                            {formatCurrency(salePrice)}
                          </span>
                          {activeDiscount > 0 && (
                            <span className="text-sm text-slate-400 line-through font-medium">
                              {formatCurrency(course.standard_fee)}
                            </span>
                          )}
                        </div>
                      </div>
                      <button className="bg-white border border-slate-200 text-slate-700 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 px-4 py-2.5 rounded-[14px] font-bold text-sm transition-all shadow-sm flex items-center gap-1.5 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600">
                        View Details <ArrowRight size={16} className="transform group-hover:translate-x-0.5 transition-transform" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* QUICK VIEW MODAL */}
      {activeModalCourse && (() => {
        const extractedOutcomes = getLearningOutcomes(activeModalCourse.learning_outcomes);
        const extractedFaqs = getFaqs(activeModalCourse.faqs);
        const modalDiscount = activeModalCourse.discount || 0;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-0 md:p-6 lg:p-10">
            <div 
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" 
              onClick={() => setActiveModalCourse(null)}
            ></div>
            
            <div className="relative bg-white md:rounded-[28px] shadow-2xl w-full h-full md:h-auto max-w-6xl md:max-h-[90vh] overflow-hidden flex flex-col md:flex-row animate-in fade-in zoom-in-95 duration-200">
              
              <button 
                onClick={() => setActiveModalCourse(null)}
                className="absolute top-3 right-3 md:top-5 md:right-5 z-50 p-2 md:p-2.5 bg-black/50 hover:bg-black/70 text-white md:bg-white/90 md:backdrop-blur md:hover:bg-slate-100 md:text-slate-600 rounded-full shadow-sm md:border md:border-slate-200/50 transition-colors"
              >
                <X size={20} className="stroke-[2]" />
              </button>

              <div className="w-full md:w-[65%] overflow-y-auto custom-scrollbar flex flex-col h-full md:h-auto">
                <div className="w-full aspect-video bg-slate-900 relative flex-shrink-0">
                  {activeModalCourse.demo_video_url ? (
                    <iframe 
                      src={getYouTubeEmbedUrl(activeModalCourse.demo_video_url) || ''} 
                      className="w-full h-full absolute inset-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                      allowFullScreen
                    ></iframe>
                  ) : (
                    <img src={activeModalCourse.cover_pic_url || "/api/placeholder/800/450"} alt="Cover" className="w-full h-full object-cover" />
                  )}
                </div>

                <div className="p-5 md:p-8 lg:p-10 flex-grow pb-[140px] md:pb-8">
                  <div className="flex flex-wrap gap-2 mb-4 md:mb-5">
                    {activeModalCourse.category && (
                      <span className="bg-blue-50 border border-blue-100 text-blue-700 text-xs font-bold px-3 py-1.5 rounded-[10px]">
                        {activeModalCourse.category}
                      </span>
                    )}
                    {activeModalCourse.difficulty_level && (
                      <span className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 text-slate-600 text-xs font-bold px-3 py-1.5 rounded-[10px]">
                        <BarChart size={14} className="stroke-[2] text-slate-400"/> {activeModalCourse.difficulty_level}
                      </span>
                    )}
                  </div>

                  <h2 className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-slate-900 mb-6 md:mb-8 tracking-tight leading-tight">
                    {activeModalCourse.course_name}
                  </h2>

                  {/* Included Section */}
                  {activeModalCourse.description && (
                    <div className="bg-slate-50 border border-slate-100 rounded-[20px] p-5 md:p-7 mb-8 md:mb-10">
                      <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-widest mb-4 md:mb-5">Included in this recording</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 md:gap-y-4 gap-x-8">
                        {parseDescription(activeModalCourse.description).map((feature, idx) => (
                          <div key={idx} className="flex items-start gap-3">
                            <CheckCircle2 size={18} className="text-emerald-500 flex-shrink-0 mt-0.5 stroke-[2]" />
                            <span className="text-sm text-slate-600 font-medium leading-relaxed">{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Desktop Learning Outcomes */}
                  {extractedOutcomes.length > 0 && (
                    <div className="hidden md:block mb-10">
                      <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                        <Award size={22} className="text-blue-600" /> What you will learn
                      </h3>
                      <ul className="space-y-4">
                        {extractedOutcomes.map((outcome, idx) => (
                          <li key={idx} className="flex gap-4 p-5 bg-white border border-slate-100 shadow-sm rounded-[20px]">
                            <div className="bg-blue-50 text-blue-600 font-extrabold h-8 w-8 rounded-[10px] flex items-center justify-center flex-shrink-0 text-sm">
                              {idx + 1}
                            </div>
                            <p className="text-slate-600 text-sm leading-relaxed pt-1.5">{outcome}</p>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Mobile Learning Outcomes Accordion */}
                  {extractedOutcomes.length > 0 && (
                    <div className="md:hidden mb-4">
                      <button 
                        onClick={() => setShowLearningOutcomes(!showLearningOutcomes)}
                        className="w-full flex items-center justify-between p-4 bg-white border border-slate-200 rounded-[16px] shadow-sm font-bold text-slate-900"
                      >
                        <span className="flex items-center gap-2"><Award size={20} className="text-blue-600" /> What you will learn</span>
                        <ChevronDown size={20} className={`text-slate-500 transition-transform ${showLearningOutcomes ? 'rotate-180' : ''}`} />
                      </button>
                      
                      {showLearningOutcomes && (
                        <div className="pt-3 animate-in fade-in duration-200">
                          <ul className="space-y-3">
                            {extractedOutcomes.map((outcome, idx) => (
                              <li key={idx} className="flex gap-3 p-4 bg-slate-50 border border-slate-100 rounded-[16px]">
                                <div className="bg-blue-100 text-blue-700 font-bold h-6 w-6 rounded-md flex items-center justify-center flex-shrink-0 text-xs">
                                  {idx + 1}
                                </div>
                                <p className="text-slate-700 text-sm leading-snug">{outcome}</p>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Desktop FAQ Section */}
                  {extractedFaqs.length > 0 && (
                    <div className="hidden md:block mb-4">
                      <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                        <HelpCircle size={22} className="text-blue-600" /> Frequently Asked Questions
                      </h3>
                      <div className="space-y-3">
                        {extractedFaqs.map((faq, idx) => {
                          const isOpen = expandedFaqIndex === idx;
                          return (
                            <div 
                              key={idx} 
                              className={`bg-white border transition-all duration-300 rounded-2xl overflow-hidden ${
                                isOpen ? 'border-blue-200 shadow-md shadow-blue-500/5' : 'border-slate-200 hover:border-slate-300'
                              }`}
                            >
                              <button
                                onClick={() => setExpandedFaqIndex(isOpen ? null : idx)}
                                className={`w-full text-left px-6 py-4 flex justify-between items-center transition-colors focus:outline-none ${
                                  isOpen ? 'bg-blue-50/50' : 'bg-white hover:bg-slate-50'
                                }`}
                              >
                                <span className={`font-bold pr-4 leading-snug ${isOpen ? 'text-blue-700' : 'text-slate-800'}`}>
                                  {faq.question}
                                </span>
                                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                                  isOpen ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'
                                }`}>
                                  <ChevronDown size={18} className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                                </div>
                              </button>
                              
                              <div 
                                className={`transition-all duration-300 ease-in-out ${
                                  isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                                }`}
                              >
                                <div className="px-6 pb-5 pt-1 border-t border-slate-100/0">
                                  <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line">
                                    {faq.answer}
                                  </p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Mobile FAQ Accordion */}
                  {extractedFaqs.length > 0 && (
                    <div className="md:hidden mb-4">
                      <button 
                        onClick={() => setShowMobileFaqs(!showMobileFaqs)}
                        className="w-full flex items-center justify-between p-4 bg-white border border-slate-200 rounded-[16px] shadow-sm font-bold text-slate-900"
                      >
                        <span className="flex items-center gap-2"><HelpCircle size={20} className="text-blue-600" /> FAQs</span>
                        <ChevronDown size={20} className={`text-slate-500 transition-transform ${showMobileFaqs ? 'rotate-180' : ''}`} />
                      </button>
                      
                      {showMobileFaqs && (
                        <div className="pt-3 space-y-2 animate-in fade-in duration-200">
                          {extractedFaqs.map((faq, idx) => {
                            const isOpen = expandedFaqIndex === idx;
                            return (
                              <div key={idx} className="bg-slate-50 border border-slate-200 rounded-[16px] overflow-hidden">
                                <button
                                  onClick={() => setExpandedFaqIndex(isOpen ? null : idx)}
                                  className="w-full text-left p-4 flex justify-between items-center"
                                >
                                  <span className={`font-bold text-sm pr-2 ${isOpen ? 'text-blue-700' : 'text-slate-800'}`}>
                                    {faq.question}
                                  </span>
                                  <ChevronDown size={16} className={`flex-shrink-0 text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                                </button>
                                {isOpen && (
                                  <div className="px-4 pb-4 pt-0">
                                    <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line">
                                      {faq.answer}
                                    </p>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                </div>
              </div>

              {/* Sidebar Checklist & Pricing (Desktop) / Sticky Bottom Nav (Mobile) */}
              <div className="w-full md:w-[35%] bg-white md:bg-slate-50/80 border-t md:border-t-0 md:border-l border-slate-200 flex flex-col fixed md:relative bottom-0 left-0 z-40 md:z-auto">
                <div className="p-4 md:p-8 lg:p-10 sticky top-0 flex flex-row md:flex-col items-center md:items-stretch justify-between shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.1)] md:shadow-none bg-white md:bg-transparent">
                  <div className="mb-0 md:mb-8 w-[45%] md:w-auto">
                    {modalDiscount > 0 && (
                      <div className="hidden md:inline-block bg-red-100 text-red-600 font-black px-3 py-1.5 rounded-[10px] text-xs uppercase tracking-wide mb-4">
                        Limited Time {modalDiscount}% Off
                      </div>
                    )}
                    <div className="text-[10px] md:text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-0.5 md:mb-1">Total Price</div>
                    <div className="flex flex-col md:flex-row md:items-end gap-1 md:gap-3 mb-1">
                      <span className="text-2xl md:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-none">
                        {formatCurrency(calculateSalePrice(activeModalCourse.standard_fee, modalDiscount))}
                      </span>
                    </div>
                    {modalDiscount > 0 && (
                      <div className="text-slate-500 font-medium text-xs md:text-sm mt-1 md:mt-2">
                        <span className="line-through">{formatCurrency(activeModalCourse.standard_fee)}</span>
                        <span className="md:hidden text-red-500 ml-1 font-bold">({modalDiscount}% Off)</span>
                      </div>
                    )}
                  </div>

                  <button 
                    onClick={() => handlePurchaseClick(activeModalCourse)}
                    className="w-[50%] md:w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-base md:text-lg py-3.5 md:py-4 rounded-[12px] md:rounded-[14px] shadow-[0_8px_20px_-6px_rgba(37,99,235,0.4)] transition-all active:scale-[0.98] md:mb-4"
                  >
                    <ShoppingCart size={18} className="stroke-[2] hidden sm:block" /> Buy <span className="hidden sm:inline">Recording</span>
                  </button>

                  <div className="hidden md:block">
                    {activeModalCourse.syllabus_url && activeModalCourse.syllabus_url !== "#" && (
                      <a 
                        href={activeModalCourse.syllabus_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="w-full flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 font-bold py-3.5 rounded-[14px] transition-all mb-8 shadow-sm"
                      >
                        <BookOpen size={18} className="stroke-[2]" /> View Full Syllabus <ExternalLink size={14} className="text-slate-400" />
                      </a>
                    )}

                    <div className="space-y-4 pt-8 border-t border-slate-200">
                      <div className="flex items-center gap-3 text-sm text-slate-600 font-medium">
                        <Clock size={18} className="text-slate-400 stroke-[2]" />
                        <span>{activeModalCourse.course_hours} Hours of HD Video</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-slate-600 font-medium">
                        <Infinity size={18} className="text-slate-400 stroke-[2]" />
                        <span>Full Lifetime Access</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-slate-600 font-medium">
                        <ShieldCheck size={18} className="text-slate-400 stroke-[2]" />
                        <span>Secure SSL Checkout</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        );
      })()}

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite alternate ease-in-out;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 10px; }
      `}} />
    </div>
  );
}