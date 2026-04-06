"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { 
  PlayCircle, Clock, CheckCircle2, 
  ShieldCheck, Zap, Video, Infinity, 
  Award, ArrowRight, Search, Loader2, AlertTriangle
} from "lucide-react";

// --- STRICT TYPES ---
interface RecordingCourse {
  id: string; // uuid
  course_name: string; // text
  category: string | null; // text null
  difficulty_level: string | null; // text null
  description: string | null; // text null
  course_hours: string; // text
  standard_fee: number | string; // numeric(10,2)
  discount: number | null; // smallint null
  cover_pic_url: string | null; // text null
  is_active: boolean | null; // boolean null
  created_at?: string;
  updated_at?: string;
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

const parseDescription = (desc: string | null) => {
  if (!desc) return [];
  return desc.split('\n')
    .map(line => line.replace(/✔️/g, '').trim())
    .filter(line => line.length > 0);
};

// --- COMPONENTS ---
export default function RecordingClient() {
  const supabase = createClient();

  // --- State ---
  const [courses, setCourses] = useState<RecordingCourse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null); 
  
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
          .select("id, course_name, category, difficulty_level, description, course_hours, standard_fee, discount, cover_pic_url, is_active, created_at")
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
          <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
          <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[70%] rounded-full bg-blue-600/20 blur-[120px] animate-blob mix-blend-screen"></div>
          <div className="absolute top-[20%] -right-[10%] w-[45%] h-[60%] rounded-full bg-emerald-500/15 blur-[120px] animate-blob animation-delay-2000 mix-blend-screen"></div>
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

              {/* Encode the course name for the URL */}
              const urlFriendlyName = encodeURIComponent(course.course_name);

              return (
                <Link 
                  href={`/recording/${urlFriendlyName}`}
                  key={course.id} 
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
                      <div className="bg-white border border-slate-200 text-slate-700 font-bold text-sm px-4 py-2.5 rounded-[14px] transition-all shadow-sm flex items-center gap-1.5 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600">
                        View Details <ArrowRight size={16} className="transform group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>

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
      `}} />
    </div>
  );
}