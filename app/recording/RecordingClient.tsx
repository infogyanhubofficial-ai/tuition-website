"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  Search,
  Loader2,
  AlertTriangle,
  Star,
  CheckCircle2,
  Clock,
  Package,
  Layers3,
  ArrowRight,
  TrendingUp,
  Award,
  Users,
  Video,
  ListFilter,
  PlayCircle,
  Sparkles
} from "lucide-react";

// --- TYPES ---
interface RecordingCourse {
  id: string;
  course_name: string;
  category: string | null;
  difficulty_level: string | null;
  description: string | null;
  course_hours: string;
  standard_fee: number | string;
  discount: number | null;
  cover_pic_url: string | null;
  is_active: boolean | null;
  created_at?: string;
  rating?: number | null;
  enrolled_students?: number | null;
  learning_outcomes?: any;
}

interface BundlePackage {
  id: string;
  title: string;
  description: string;
  courses: string[];
  price: number;
  originalPrice: number;
  badge: string;
  highlight: string;
  isFeatured?: boolean;
}

// --- HARDCODED BUNDLES ---
const BUNDLES: BundlePackage[] = [
  {
    id: "architectural-design-bundle",
    title: "Architectural Design",
    description: "A complete architectural design workflow package for drafting, 3D modeling, BIM, rendering, and presentation.",
    courses: [
      "Architectural Visualization: AutoCAD, SketchUp, Enscape & Photoshop",
      "AutoCAD Basic to Advanced Course",
      "Autodesk Revit",
    ],
    price: 3333,
    originalPrice: 10000,
    badge: "🏛️ Best for Architects",
    highlight: "Perfect for design, modeling & visualization",
  },
  {
    id: "civil-engineering-bundle",
    title: "Civil Engineering",
    description: "A practical bundle for civil engineers covering design, costing, billing, and valuation workflows.",
    courses: [
      "Structural Design and Analysis",
      "Estimation, Costing & Contract Billing",
      "Property Valuation",
    ],
    price: 3333,
    originalPrice: 8000,
    badge: "🏗️ Civil Bestseller",
    highlight: "Strong job-focused practical combination",
  },
  {
    id: "complete-engineering-package",
    title: "Complete Engineering Package",
    description: "The ultimate all-in-one package for architectural, civil, and GIS-related engineering skills.",
    courses: [
      "Architectural Visualization: AutoCAD, SketchUp, Enscape & Photoshop",
      "AutoCAD Basic to Advanced Course",
      "Autodesk Revit",
      "Structural Design and Analysis",
      "Estimation, Costing & Contract Billing",
      "Property Valuation",
      "ArcGIS and Mapping",
    ],
    price: 5999,
    originalPrice: 20000,
    badge: "🚀 Ultimate Value",
    highlight: "The complete career accelerator (7 Courses)",
    isFeatured: true,
  },
];

const PROMO_TAGS = [
  "Popular Choice",
  "Career Focused",
  "Top Pick",
  "Learner Favorite",
  "Practical Skills",
  "High Value Course"
];

// --- UTILITIES ---
const formatCurrency = (amount: number | string) => {
  const num = Number(amount) || 0;
  return new Intl.NumberFormat("en-NP", {
    style: "currency",
    currency: "NPR",
    maximumFractionDigits: 0,
  }).format(num);
};

const calculateSalePrice = (fee: number | string, discount: number | null) => {
  const f = Number(fee) || 0;
  const d = Number(discount) || 0;
  return f - (f * d) / 100;
};

const parseDescription = (desc: string | null) => {
  if (!desc) return [];
  return desc.split("\n").map((line) => line.replace(/✔️|✔/g, "").trim()).filter(Boolean);
};

const formatRating = (rating?: number | null) => {
  return Number(rating ?? 4.8).toFixed(1);
};

const getStudentDisplay = (count?: number | null) => {
  if (count && count > 0) {
    return `${count.toLocaleString("en-NP")} learners`;
  }
  return "Popular course";
};

const getCourseBadge = (course: RecordingCourse) => {
  if (course.discount && course.discount >= 20) return { text: "🔥 Hot Deal", style: "bg-red-600 text-white" };
  if (course.enrolled_students && course.enrolled_students > 100) return { text: "⚡ Bestseller", style: "bg-amber-500 text-slate-900" };
  if (course.created_at) {
    const createdDate = new Date(course.created_at);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    if (createdDate > thirtyDaysAgo) return { text: "🆕 Newly Added", style: "bg-blue-600 text-white" };
  }
  return null;
};

const getSeededRandom = (seedStr: string, array: string[]) => {
  let hash = 0;
  for (let i = 0; i < seedStr.length; i++) {
    hash = seedStr.charCodeAt(i) + ((hash << 5) - hash);
  }
  return array[Math.abs(hash) % array.length];
};

const getLearningHook = (course: RecordingCourse) => {
  const fallback = `Master practical ${course.category || "industry"} skills to advance your career.`;
  if (Array.isArray(course.learning_outcomes) && course.learning_outcomes.length > 0) return course.learning_outcomes[0];
  if (typeof course.learning_outcomes === "string") {
    try {
      const parsed = JSON.parse(course.learning_outcomes);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed[0];
      if (parsed?.learning_outcomes?.length > 0) return parsed.learning_outcomes[0];
    } catch { return fallback; }
  }
  return fallback;
};

// Parses hours string like "42h", "15", "10.5" into a number for totaling
const parseHours = (hoursStr: string | null | undefined): number => {
  if (!hoursStr) return 0;
  const match = hoursStr.match(/[\d.]+/);
  return match ? parseFloat(match[0]) : 0;
};

// --- COMPONENT ---
export default function RecordingClient() {
  const supabase = createClient();

  const [courses, setCourses] = useState<RecordingCourse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);
  
  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [sortBy, setSortBy] = useState("popular");

  useEffect(() => {
    const fetchCourses = async () => {
      setIsLoading(true);
      setDbError(null);
      try {
        const { data, error } = await supabase.from("recordings").select("*").order("created_at", { ascending: false });
        if (error) throw error;
        setCourses((data as RecordingCourse[]) || []);
      } catch (err: any) {
        setDbError(err?.message || "Failed to load recordings.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchCourses();
  }, [supabase]);

  const categories = useMemo(() => {
    const cats = courses.map((c) => c.category).filter(Boolean) as string[];
    return ["All", ...Array.from(new Set(cats))];
  }, [courses]);

  const filteredAndSortedCourses = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    let result = courses.filter((course) => {
      if (course.is_active === false) return false;
      const matchSearch = !q || course.course_name.toLowerCase().includes(q) || (course.description || "").toLowerCase().includes(q) || (course.category || "").toLowerCase().includes(q);
      const matchCategory = activeCategory === "All" || course.category === activeCategory;
      return matchSearch && matchCategory;
    });

    result.sort((a, b) => {
      const priceA = calculateSalePrice(a.standard_fee, a.discount);
      const priceB = calculateSalePrice(b.standard_fee, b.discount);
      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
      const ratingA = a.rating || 0;
      const ratingB = b.rating || 0;
      const studentsA = a.enrolled_students || 0;
      const studentsB = b.enrolled_students || 0;

      switch (sortBy) {
        case "price_asc": return priceA - priceB;
        case "price_desc": return priceB - priceA;
        case "newest": return dateB - dateA;
        case "rating": return ratingB - ratingA;
        case "popular": default: return studentsB - studentsA;
      }
    });
    return result;
  }, [courses, searchQuery, activeCategory, sortBy]);

  const scrollToCourses = () => document.getElementById("course-catalog")?.scrollIntoView({ behavior: "smooth" });
  const scrollToBundles = () => document.getElementById("bundles-section")?.scrollIntoView({ behavior: "smooth" });

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      
      {/* HERO SECTION */}
      <div className="bg-slate-950 text-white pt-24 pb-16 px-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-[500px] h-[500px] bg-blue-600/15 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-10 items-center relative z-10">
          <div className="flex-1 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 text-blue-300 font-medium text-sm mb-8 border border-blue-500/20 backdrop-blur-sm">
              <TrendingUp className="w-4 h-4" /> Learn Today | Lead Tomorrow
            </div>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6 leading-[1.1]">
              Master Practical Skills. <br className="hidden md:block"/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
                Learn at Your Pace.
              </span>
            </h1>
            <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto md:mx-0 mb-10 leading-relaxed font-light">
              Skip online classes. Get lifetime access to premium, industry-ready course recordings taught by leading experts and actively used in real-world projects.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center gap-4 justify-center md:justify-start">
              <button 
                onClick={scrollToCourses}
                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-lg transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2"
              >
                Browse Courses <ArrowRight className="w-5 h-5" />
              </button>
              <button 
                onClick={scrollToBundles}
                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-transparent hover:bg-white/5 border border-slate-700 hover:border-slate-500 text-white font-bold text-lg transition-all flex items-center justify-center gap-2"
              >
                Explore Recording Bundles <Package className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* STATS STRIP */}
        <div className="max-w-6xl mx-auto mt-24 pt-10 border-t border-slate-800 relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center md:text-left">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-4 group">
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-blue-400 group-hover:border-blue-500/50 transition-colors"><Users className="w-6 h-6" /></div>
              <div><p className="font-bold text-2xl text-white">1,500+</p><p className="text-xs text-slate-500 uppercase tracking-widest font-semibold mt-1">Active Learners</p></div>
            </div>
            <div className="flex flex-col md:flex-row items-center md:items-start gap-4 group">
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-emerald-400 group-hover:border-emerald-500/50 transition-colors"><Video className="w-6 h-6" /></div>
              <div><p className="font-bold text-2xl text-white">10+</p><p className="text-xs text-slate-500 uppercase tracking-widest font-semibold mt-1">Premium Courses</p></div>
            </div>
            <div className="flex flex-col md:flex-row items-center md:items-start gap-4 group">
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-amber-400 group-hover:border-amber-500/50 transition-colors"><Award className="w-6 h-6" /></div>
              <div><p className="font-bold text-2xl text-white">4.8/5</p><p className="text-xs text-slate-500 uppercase tracking-widest font-semibold mt-1">Average Rating</p></div>
            </div>
            <div className="flex flex-col md:flex-row items-center md:items-start gap-4 group">
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-blue-400 group-hover:border-blue-500/50 transition-colors"><Clock className="w-6 h-6" /></div>
              <div><p className="font-bold text-2xl text-white">Lifetime</p><p className="text-xs text-slate-500 uppercase tracking-widest font-semibold mt-1">Course Access</p></div>
            </div>
          </div>
        </div>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div id="course-catalog" className="sticky top-0 z-30 bg-white/95 backdrop-blur-xl shadow-sm border-b border-slate-200">
        <div className="max-w-6xl mx-auto p-4 md:py-5">
          <div className="flex flex-col lg:flex-row gap-5 justify-between items-center">
            
            <div className="flex gap-2 overflow-x-auto w-full lg:w-auto pb-2 lg:pb-0 scrollbar-hide -mx-4 px-4 lg:mx-0 lg:px-0">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-4 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all duration-200 ${
                    activeCategory === cat
                      ? "bg-slate-900 text-white shadow-md active:scale-95"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900 active:scale-95"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="flex w-full lg:w-auto gap-3 items-center lg:flex-1 lg:max-w-xl lg:justify-end">
              <div className="relative shrink-0">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                  <ListFilter className="w-4 h-4 text-slate-400" />
                </div>
                <select 
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="appearance-none pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="popular">Most Popular</option>
                  <option value="newest">Newest Added</option>
                  <option value="rating">Highest Rated</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                </select>
              </div>

              <div className="relative w-full shrink-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  placeholder="Search courses..."
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CONTENT GRID */}
      <div className="max-w-6xl mx-auto p-4 mt-10">
        {dbError && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold">Database error</p>
              <p className="text-sm">{dbError}</p>
            </div>
          </div>
        )}

        {isLoading && (
          <div className="flex justify-center py-32">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <span className="text-slate-500 font-medium">Loading premium catalog...</span>
            </div>
          </div>
        )}

        {!isLoading && filteredAndSortedCourses.length === 0 && !dbError && (
          <div className="text-center py-24 bg-white rounded-3xl border border-dashed border-slate-300 mt-2">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">No courses found</h3>
            <p className="text-slate-500 mb-6 max-w-sm mx-auto">We couldn't find any courses matching "{searchQuery}" in this category.</p>
            <button 
              onClick={() => { setSearchQuery(""); setActiveCategory("All"); }}
              className="px-6 py-2 bg-slate-900 text-white font-medium rounded-xl hover:bg-slate-800 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        )}

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredAndSortedCourses.map((course) => {
            const price = calculateSalePrice(course.standard_fee, course.discount);
            const savings = Number(course.standard_fee) - price;
            const features = parseDescription(course.description);
            const url = encodeURIComponent(course.course_name);
            const courseBadge = getCourseBadge(course);
            const hookLine = getLearningHook(course);
            const promoTag = getSeededRandom(course.id, PROMO_TAGS);

            return (
              <Link
                key={course.id}
                href={`/recording/${url}`}
                className="group flex flex-col overflow-hidden rounded-[20px] bg-white border border-slate-200/80 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:border-blue-300"
              >
                <div className="relative aspect-video overflow-hidden bg-slate-100">
                  <img
                    src={course.cover_pic_url || "/api/placeholder/800/450"}
                    alt={course.course_name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  
                  <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/50 opacity-80" />

                  {courseBadge && (
                    <div className={`absolute top-3 left-3 font-bold text-[11px] px-3 py-1.5 rounded-full shadow-sm flex items-center gap-1.5 tracking-wide uppercase ${courseBadge.style}`}>
                      {courseBadge.text}
                    </div>
                  )}

                  {!!course.discount && Number(course.discount) > 0 && !courseBadge?.text.includes("Hot Deal") && (
                    <div className="absolute top-3 right-3 bg-red-600 text-white font-bold text-[11px] px-2.5 py-1 rounded-md shadow-sm tracking-wide uppercase">
                      {course.discount}% OFF
                    </div>
                  )}

                  <div className="absolute bottom-3 right-3 bg-slate-900/80 backdrop-blur-md border border-slate-600/50 text-slate-100 text-[11px] font-bold px-2.5 py-1 rounded-md flex items-center gap-2 z-20 shadow-lg group-hover:border-blue-500/50 transition-all duration-300">
                    <div className="flex items-center justify-center relative w-2 h-2">
                      <span className="absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75 animate-ping"></span>
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500"></span>
                    </div>
                    <span className="tracking-wide">{course.course_hours} HRS RECORDED</span>
                  </div>

                  <div className="absolute inset-0 flex items-center justify-center bg-slate-900/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 backdrop-blur-[2px]">
                    <PlayCircle className="w-16 h-16 text-white drop-shadow-xl transform scale-90 group-hover:scale-100 transition-all duration-300" strokeWidth={1.5} />
                  </div>
                </div>

                <div className="p-6 flex flex-col flex-grow relative">
                  <div className="flex items-center justify-between text-xs mb-3">
                    <div className="flex items-center gap-1.5 text-slate-500 font-medium">
                      <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                      <span className="font-bold text-slate-700">{formatRating(course.rating)}</span>
                      <span>({getStudentDisplay(course.enrolled_students)})</span>
                    </div>
                  </div>

                  <h3 className="font-extrabold text-[1.15rem] text-slate-900 mb-2 line-clamp-2 leading-snug group-hover:text-blue-700 transition-colors">
                    {course.course_name}
                  </h3>

                  <p className="text-sm text-slate-500 mb-5 line-clamp-2 leading-relaxed">
                    {hookLine}
                  </p>

                  <ul className="text-sm text-slate-700 mb-6 space-y-3 flex-grow">
                    {features.length > 0 ? (
                      features.slice(0, 3).map((feature, index) => (
                        <li key={index} className="flex items-start gap-2.5">
                          <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                          <span className="line-clamp-2 leading-tight">{feature}</span>
                        </li>
                      ))
                    ) : (
                      <>
                        <li className="flex items-start gap-2.5">
                          <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                          <span className="leading-tight">Industry Standard Curriculum</span>
                        </li>
                        <li className="flex items-start gap-2.5">
                          <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                          <span className="leading-tight">Practical Real-World Projects</span>
                        </li>
                      </>
                    )}
                  </ul>

                  <div className="mt-auto pt-5 border-t border-slate-100">
                    <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-bold uppercase tracking-wider mb-3">
                      <Sparkles className="w-3.5 h-3.5 text-blue-500" /> {promoTag}
                    </div>
                    
                    <div className="flex justify-between items-center gap-3">
                      <div className="flex flex-col min-w-0 pr-1">
                        <div className="flex items-baseline gap-1.5 flex-wrap">
                          <div className="font-extrabold text-[1.35rem] text-slate-900 tracking-tight leading-none">
                            {formatCurrency(price)}
                          </div>
                          {!!course.discount && Number(course.discount) > 0 && (
                            <div className="text-[11px] font-medium line-through text-slate-400 shrink-0">
                              {formatCurrency(course.standard_fee)}
                            </div>
                          )}
                        </div>
                        {savings > 0 && (
                          <div className="text-[11px] font-bold text-emerald-600 mt-1.5">
                            Save {formatCurrency(savings)}
                          </div>
                        )}
                      </div>

                      <div className="shrink-0 rounded-xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white px-4 py-2.5 text-[13px] font-bold transition-all shadow-sm">
                        View Details
                      </div>
                    </div>
                  </div>
                  
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 mt-20 mb-8">
         <div className="h-px w-full bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
      </div>

      {/* BUNDLES SECTION */}
      <section id="bundles-section" className="max-w-6xl mx-auto px-4 pb-12">
        <div className="flex items-center gap-4 mb-10 text-center md:text-left justify-center md:justify-start">
          <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-600/30 shrink-0">
            <Package className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900">
              Career-Ready Recording Bundles
            </h2>
            <p className="text-slate-500 mt-1 text-lg">
              Save up to 70% with selected premium course combinations
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 items-stretch">
          
          {/* LEFT HALF */}
          <div className="flex flex-col gap-8">
            {BUNDLES.filter(b => !b.isFeatured).map((bundle) => {
              const savings = bundle.originalPrice - bundle.price;
              const savePercent = Math.round((savings / bundle.originalPrice) * 100);

              // Match courses in bundle to DB data to get hours
              const bundleCoursesData = bundle.courses.map(courseName => {
                const found = courses.find(c => c.course_name === courseName);
                return {
                  name: courseName,
                  hoursStr: found ? found.course_hours : null,
                  hoursNum: parseHours(found?.course_hours)
                };
              });
              const totalBundleHours = bundleCoursesData.reduce((sum, c) => sum + c.hoursNum, 0);

              return (
                <div key={bundle.id} className="bg-white border border-slate-200 rounded-[24px] p-8 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col h-full group">
                  <div className="flex items-start justify-between gap-3 mb-5">
                    <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-bold bg-slate-100 text-slate-700">
                      {bundle.badge}
                    </span>
                    <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-bold bg-red-50 text-red-600 ring-1 ring-red-100">
                      Save {savePercent}%
                    </span>
                  </div>

                  <h3 className="text-2xl font-extrabold leading-tight text-slate-900 mb-3">
                    {bundle.title}
                  </h3>
                  
                  <div className="flex flex-wrap items-center gap-2 mb-5">
                    <div className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold bg-blue-50 text-blue-700">
                      <Layers3 className="w-3.5 h-3.5" />
                      {bundle.highlight}
                    </div>
                    {totalBundleHours > 0 && (
                      <div className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <Clock className="w-3.5 h-3.5" />
                        {totalBundleHours} Hrs Total
                      </div>
                    )}
                  </div>

                  <p className="text-sm text-slate-600 mb-6 leading-relaxed">{bundle.description}</p>

                  <ul className="space-y-3 mb-8 flex-grow">
                    {bundleCoursesData.map((courseData, index) => (
                      <li key={index} className="flex items-start justify-between gap-3 group/item">
                        <div className="flex items-start gap-3">
                          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-500" />
                          <Link 
                            href={`/recording/${encodeURIComponent(courseData.name)}`}
                            className="text-sm font-medium leading-snug transition-colors text-slate-700 hover:text-blue-600 hover:underline"
                          >
                            {courseData.name}
                          </Link>
                        </div>
                        {courseData.hoursStr && (
                           <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-md shrink-0 border border-slate-200">
                             {courseData.hoursStr}h
                           </span>
                        )}
                      </li>
                    ))}
                  </ul>

                  <div className="mt-auto pt-6 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                    <div>
                      <div className="flex items-baseline gap-2 mb-1">
                        <div className="text-3xl font-black tracking-tight text-slate-900">
                          {formatCurrency(bundle.price)}
                        </div>
                        <div className="text-sm font-medium line-through text-slate-400">
                          {formatCurrency(bundle.originalPrice)}
                        </div>
                      </div>
                      <p className="text-xs font-medium text-slate-500">One-time payment • Lifetime access</p>
                    </div>
                    
                    <Link
                      href={`/order?type=recording&courseName=${encodeURIComponent(bundle.title + " Bundle")}&price=${bundle.price}`}
                      className="bg-slate-900 hover:bg-slate-800 flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-sm font-bold transition-all shadow-md border border-slate-800 shrink-0"
                      style={{ textDecoration: 'none' }}
                    >
                      <span className="text-white" style={{ color: '#ffffff' }}>Get Bundle Offer</span>
                      <ArrowRight className="w-4 h-4 text-white" style={{ color: '#ffffff' }} />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          {/* RIGHT HALF: Featured */}
          <div className="h-full">
            {BUNDLES.filter(b => b.isFeatured).map((bundle) => {
              const savings = bundle.originalPrice - bundle.price;
              const savePercent = Math.round((savings / bundle.originalPrice) * 100);

              // Match courses in bundle to DB data to get hours
              const bundleCoursesData = bundle.courses.map(courseName => {
                const found = courses.find(c => c.course_name === courseName);
                return {
                  name: courseName,
                  hoursStr: found ? found.course_hours : null,
                  hoursNum: parseHours(found?.course_hours)
                };
              });
              const totalBundleHours = bundleCoursesData.reduce((sum, c) => sum + c.hoursNum, 0);

              return (
                <div key={bundle.id} className="relative overflow-hidden bg-gradient-to-b from-slate-900 to-slate-950 text-white rounded-[24px] p-8 md:p-10 shadow-2xl transition-all duration-300 flex flex-col h-full ring-1 ring-white/10 group">
                  <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />
                  
                  <div className="relative flex flex-col flex-grow z-10">
                    <div className="flex items-start justify-between gap-3 mb-8">
                      <span className="inline-flex items-center rounded-full px-4 py-1.5 text-xs font-bold bg-blue-500 text-white">
                        {bundle.badge}
                      </span>
                      <span className="inline-flex items-center rounded-full px-4 py-1.5 text-xs font-bold bg-red-500 text-white">
                        Save {savePercent}%
                      </span>
                    </div>

                    <h3 className="text-4xl lg:text-5xl font-black leading-[1.1] mb-4 text-white">
                      {bundle.title}
                    </h3>
                    
                    <div className="flex flex-wrap items-center gap-2 mb-6">
                      <div className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold bg-blue-500/10 text-blue-300 border border-blue-500/20">
                        <Layers3 className="w-4 h-4" />
                        {bundle.highlight}
                      </div>
                      {totalBundleHours > 0 && (
                        <div className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                          <Clock className="w-4 h-4" />
                          {totalBundleHours} Hrs Total Content
                        </div>
                      )}
                    </div>

                    <p className="text-base text-slate-400 mb-8 leading-relaxed max-w-md font-light">
                      {bundle.description}
                    </p>

                    <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-6 mb-8 flex-grow">
                      <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-5">Included in this package:</h4>
                      <ul className="space-y-4">
                        {bundleCoursesData.map((courseData, index) => (
                          <li key={index} className="flex items-start justify-between gap-3 group/item">
                            <div className="flex items-start gap-3">
                              <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-blue-400" />
                              <Link 
                                href={`/recording/${encodeURIComponent(courseData.name)}`}
                                className="text-base font-medium leading-snug transition-colors text-slate-300 hover:text-white hover:underline decoration-blue-400/50 underline-offset-4"
                              >
                                {courseData.name}
                              </Link>
                            </div>
                            {courseData.hoursStr && (
                               <span className="text-[10px] font-bold text-slate-300 bg-white/10 px-2 py-1 rounded-md shrink-0 border border-white/5">
                                 {courseData.hoursStr}h
                               </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="mt-auto pt-6 border-t border-white/10">
                      <div className="flex items-baseline gap-3 mb-2">
                        <div className="text-5xl font-black tracking-tight text-white">
                          {formatCurrency(bundle.price)}
                        </div>
                        <div className="text-xl font-medium line-through text-slate-500">
                          {formatCurrency(bundle.originalPrice)}
                        </div>
                      </div>
                      
                      <Link
                        href={`/order?type=recording&courseName=${encodeURIComponent(bundle.title + " Bundle")}&price=${bundle.price}`}
                        className="w-full mt-6 bg-blue-600 hover:bg-blue-500 flex items-center justify-center gap-2 rounded-xl px-6 py-4 text-lg font-bold transition-all shadow-lg hover:-translate-y-0.5 shrink-0"
                        style={{ textDecoration: 'none' }}
                      >
                        <span className="text-white" style={{ color: '#ffffff' }}>Get Ultimate Offer</span>
                        <ArrowRight className="w-5 h-5 text-white" style={{ color: '#ffffff' }} />
                      </Link>
                      <p className="text-center text-[13px] mt-4 font-medium text-slate-400">
                        One-time payment • Lifetime access • Earn your certificate
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

    </div>
  );
}