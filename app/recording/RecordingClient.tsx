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
  Sparkles,
  X,
  ChevronRight,
  GraduationCap,
  Briefcase,
  ShieldCheck
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
  targetAudience: string[];
  careerPath: string[];
}

// --- HARDCODED BUNDLES ---
const BUNDLES: BundlePackage[] = [
  {
    id: "architectural-design-bundle",
    title: "Architectural Design",
    description: "A complete architectural design workflow package for drafting, 3D modeling, BIM, rendering, and presentation.",
    courses: [
      "AutoCAD Basic to Advanced Course",
      "Autodesk Revit",
      "Architectural Visualization: AutoCAD, SketchUp, Enscape & Photoshop",
    ],
    price: 3333,
    originalPrice: 10000,
    badge: "🏛️ Best for Architects",
    highlight: "Perfect for design, modeling & visualization",
    targetAudience: ["Architecture Students", "Draftsmen", "Interior Designers", "Freelance Visualizers"],
    careerPath: ["2D Drafting", "BIM Modeling", "3D Visualization", "Job Ready Architect"]
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
    targetAudience: ["Civil Engineering Students", "Site Engineers", "Consultants", "Contractors"],
    careerPath: ["Structural Analysis", "Cost Estimation", "Site Billing", "Valuation Expert"]
  },
  {
    id: "complete-engineering-package",
    title: "Complete Engineering Package",
    description: "The ultimate all-in-one package for architectural, civil, and GIS-related engineering skills.",
    courses: [
      "AutoCAD Basic to Advanced Course",
      "Autodesk Revit",
      "Architectural Visualization: AutoCAD, SketchUp, Enscape & Photoshop",
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
    targetAudience: ["Engineering Freshers", "Multi-disciplinary Consultants", "Firm Owners", "Master's Students"],
    careerPath: ["Drafting & BIM", "Structural Design", "Costing & Valuation", "GIS & Final Delivery"]
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
  if (course.enrolled_students && course.enrolled_students > 100) return { text: "⚡ Bestseller", style: "bg-blue-600 text-white" };
  if (course.created_at) {
    const createdDate = new Date(course.created_at);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    if (createdDate > thirtyDaysAgo) return { text: "🆕 Newly Added", style: "bg-slate-800 text-white" };
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

  // Bundle Modal State
  const [selectedBundle, setSelectedBundle] = useState<BundlePackage | null>(null);

  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (selectedBundle) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    }
  }, [selectedBundle]);

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

  // Render Modal Helper
  const renderBundleModal = () => {
    if (!selectedBundle) return null;

    const savings = selectedBundle.originalPrice - selectedBundle.price;
    const savePercent = Math.round((savings / selectedBundle.originalPrice) * 100);

    const bundleCoursesData = selectedBundle.courses.map(courseName => {
      const found = courses.find(c => c.course_name === courseName);
      const features = parseDescription(found?.description || "");
      return {
        name: courseName,
        hoursStr: found ? found.course_hours : null,
        hoursNum: parseHours(found?.course_hours),
        outcomes: features.length > 0 ? features.slice(0, 3) : ["Practical workflows", "Real-world project application", "Industry standard techniques"],
        icon: <PlayCircle className="w-5 h-5 text-blue-500" />
      };
    });

    const totalBundleHours = bundleCoursesData.reduce((sum, c) => sum + c.hoursNum, 0);

    return (
      <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/60 backdrop-blur-sm p-4 sm:p-6 transition-all">
        {/* Click outside to close */}
        <div className="fixed inset-0" onClick={() => setSelectedBundle(null)}></div>
        
        <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-xl my-auto flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          
          {/* Sticky Header with Close - FIXED CONTRAST HERE */}
          <div className="absolute top-4 right-4 z-20">
            <button 
              onClick={() => setSelectedBundle(null)}
              className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-full transition-colors backdrop-blur-sm"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* 1. Top Section (Instant Clarity) */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 text-white p-6 sm:p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[80px] pointer-events-none" />
            
            <div className="relative z-10 flex flex-col items-start">
              <span className="inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold bg-blue-500/20 text-blue-200 border border-blue-500/30 mb-3">
                {selectedBundle.badge}
              </span>
              
              <h2 className="text-2xl sm:text-3xl font-bold mb-2 leading-tight">
                {selectedBundle.title} Package
              </h2>
              <p className="text-blue-100 text-base sm:text-lg font-normal mb-6 opacity-90">
                {selectedBundle.courses.length} Industry-Ready Courses to Accelerate Your Career.
              </p>

              <div className="flex flex-wrap items-center gap-3 mb-6">
                <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full border border-white/5">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span className="text-xs font-semibold">4.8 Rating</span>
                </div>
                <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full border border-white/5">
                  <Users className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-xs font-semibold">1,500+ Learners</span>
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-xl p-4 w-full flex flex-col sm:flex-row items-center justify-between gap-4 backdrop-blur-sm">
                <div>
                  <div className="text-xs text-slate-300 font-medium mb-1">Bundle Pricing</div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-white">{formatCurrency(selectedBundle.price)}</span>
                    <span className="text-base line-through text-slate-400">{formatCurrency(selectedBundle.originalPrice)}</span>
                  </div>
                  <div className="text-emerald-400 font-medium text-xs mt-1">You Save {savePercent}% ({formatCurrency(savings)})</div>
                </div>
                
                <Link
                  href={`/order?type=recording&courseName=${encodeURIComponent(selectedBundle.title + " Bundle")}&price=${selectedBundle.price}`}
                  onClick={() => document.body.style.overflow = "unset"}
                  className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
                  style={{ textDecoration: 'none' }}
                >
                  Get This Bundle <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>

          <div className="p-5 sm:p-8 overflow-y-auto max-h-[60vh] bg-slate-50">
            
            {/* 3. Total Value Visualization */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
              <div className="bg-white p-3 rounded-xl border border-slate-200 text-center shadow-sm">
                <Layers3 className="w-5 h-5 mx-auto text-blue-600 mb-1.5" />
                <div className="text-xl font-bold text-slate-900">{selectedBundle.courses.length}</div>
                <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Total Courses</div>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-200 text-center shadow-sm">
                <Clock className="w-5 h-5 mx-auto text-blue-600 mb-1.5" />
                <div className="text-xl font-bold text-slate-900">{totalBundleHours}+</div>
                <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Hours of Video</div>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-200 text-center shadow-sm">
                <ShieldCheck className="w-5 h-5 mx-auto text-emerald-600 mb-1.5" />
                <div className="text-xl font-bold text-slate-900">{selectedBundle.courses.length}</div>
                <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Certificates</div>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-200 text-center shadow-sm">
                <TrendingUp className="w-5 h-5 mx-auto text-amber-600 mb-1.5" />
                <div className="text-xl font-bold text-slate-900">Life</div>
                <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Time Access</div>
              </div>
            </div>

            {/* Advanced Idea: Career Path Visualization */}
            <div className="mb-8">
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-blue-600" /> The Career Path
              </h3>
              <div className="flex flex-wrap items-center gap-2 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                {selectedBundle.careerPath.map((step, idx) => (
                  <React.Fragment key={idx}>
                    <div className="text-xs font-semibold text-slate-700 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200">
                      {step}
                    </div>
                    {idx < selectedBundle.careerPath.length - 1 && (
                      <ChevronRight className="w-3 h-3 text-slate-400 hidden sm:block" />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mb-8">
              {/* 4. Who This Bundle Is For */}
              <div className="md:col-span-1 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2 text-sm">
                  <GraduationCap className="w-4 h-4 text-blue-600" /> Perfect For
                </h3>
                <ul className="space-y-2">
                  {selectedBundle.targetAudience.map((audience, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-[13px] text-slate-600 font-medium">
                      <div className="w-1 h-1 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                      {audience}
                    </li>
                  ))}
                </ul>
              </div>

              {/* 5. What You Get (Benefits) */}
              <div className="md:col-span-2 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-blue-600" /> Bundle Benefits
                </h3>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span className="text-[13px] text-slate-600 font-medium">Lifetime access to all {selectedBundle.courses.length} courses</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span className="text-[13px] text-slate-600 font-medium">Real-world project-based learning</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span className="text-[13px] text-slate-600 font-medium">Learn at your own pace anytime</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span className="text-[13px] text-slate-600 font-medium">Individual certificates for each course</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Courses Breakdown */}
            <div>
              <h3 className="text-xl font-bold text-slate-900 mb-4">Courses Included Inside</h3>
              <div className="space-y-3">
                {bundleCoursesData.map((course, idx) => (
                  <div key={idx} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 shrink-0 hidden sm:block">
                      {course.icon}
                    </div>
                    <div className="flex-grow">
                      <h4 className="font-semibold text-base text-slate-900 mb-1">{course.name}</h4>
                      {course.hoursStr && (
                        <div className="text-[10px] font-semibold text-blue-600 bg-blue-50 inline-block px-1.5 py-0.5 rounded mb-2">
                          {course.hoursStr}h Content
                        </div>
                      )}
                      <ul className="space-y-1">
                        {course.outcomes.map((outcome, oIdx) => (
                          <li key={oIdx} className="flex items-start gap-1.5 text-[13px] text-slate-500">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                            {outcome}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <Link
                      href={`/recording/${encodeURIComponent(course.name)}`}
                      className="shrink-0 text-[13px] font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 mt-2 sm:mt-0"
                      onClick={() => document.body.style.overflow = "unset"}
                    >
                      View Course <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* 7. Final Sticky CTA Section */}
          <div className="bg-white border-t border-slate-100 p-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 z-20 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
            <div>
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-0.5">Limited Time Offer</div>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-bold text-slate-900">{formatCurrency(selectedBundle.price)}</span>
                <span className="text-xs line-through text-slate-400">{formatCurrency(selectedBundle.originalPrice)}</span>
              </div>
            </div>
            <Link
                href={`/order?type=recording&courseName=${encodeURIComponent(selectedBundle.title + " Bundle")}&price=${selectedBundle.price}`}
                onClick={() => document.body.style.overflow = "unset"}
                className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2.5 px-6 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
                style={{ textDecoration: 'none', color: '#ffffff' }} /* Add color: '#ffffff' here */
              >
                Start Learning Today
                <ArrowRight className="w-4 h-4 text-white" />
              </Link>
          </div>

        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-16 md:pb-24">
      
      {/* HERO SECTION */}
      <div className="bg-slate-950 text-white pt-16 md:pt-24 pb-12 md:pb-16 px-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-[300px] h-[300px] md:w-[500px] md:h-[500px] bg-blue-600/15 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row gap-8 items-center relative z-10">
          <div className="flex-1 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-300 font-medium text-xs md:text-sm mb-6 border border-blue-500/20 backdrop-blur-sm">
              <TrendingUp className="w-3.5 h-3.5 md:w-4 md:h-4" /> Learn Today | Lead Tomorrow
            </div>
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-4 md:mb-6 leading-[1.15]">
              Master Practical Skills. <br className="hidden md:block"/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
                Learn at Your Pace.
              </span>
            </h1>
            <p className="text-base md:text-lg text-slate-400 max-w-2xl mx-auto md:mx-0 mb-8 leading-relaxed font-normal">
              Skip online classes. Get lifetime access to premium, industry-ready course recordings taught by leading experts and actively used in real-world projects.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center gap-3 justify-center md:justify-start">
              <button 
                onClick={scrollToCourses}
                className="w-full sm:w-auto px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-base transition-colors flex items-center justify-center gap-2"
              >
                Browse Courses <ArrowRight className="w-4 h-4" />
              </button>
              <button 
                onClick={scrollToBundles}
                className="w-full sm:w-auto px-6 py-3 rounded-lg bg-transparent hover:bg-white/5 border border-slate-700 hover:border-slate-500 text-white font-semibold text-base transition-colors flex items-center justify-center gap-2"
              >
                Explore Bundles <Package className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* STATS STRIP */}
        <div className="max-w-5xl mx-auto mt-16 md:mt-24 pt-8 md:pt-10 border-t border-slate-800/60 relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center md:text-left">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-3 group">
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-blue-400"><Users className="w-5 h-5" /></div>
              <div><p className="font-bold text-xl text-white">1,500+</p><p className="text-[10px] text-slate-500 uppercase tracking-wider font-medium mt-0.5">Active Learners</p></div>
            </div>
            <div className="flex flex-col md:flex-row items-center md:items-start gap-3 group">
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-emerald-400"><Video className="w-5 h-5" /></div>
              <div><p className="font-bold text-xl text-white">10+</p><p className="text-[10px] text-slate-500 uppercase tracking-wider font-medium mt-0.5">Premium Courses</p></div>
            </div>
            <div className="flex flex-col md:flex-row items-center md:items-start gap-3 group">
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-amber-400"><Award className="w-5 h-5" /></div>
              <div><p className="font-bold text-xl text-white">4.8/5</p><p className="text-[10px] text-slate-500 uppercase tracking-wider font-medium mt-0.5">Average Rating</p></div>
            </div>
            <div className="flex flex-col md:flex-row items-center md:items-start gap-3 group">
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-blue-400"><Clock className="w-5 h-5" /></div>
              <div><p className="font-bold text-xl text-white">Lifetime</p><p className="text-[10px] text-slate-500 uppercase tracking-wider font-medium mt-0.5">Course Access</p></div>
            </div>
          </div>
        </div>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div id="course-catalog" className="sticky top-0 z-30 bg-white/95 backdrop-blur-md shadow-sm border-b border-slate-200">
        <div className="max-w-5xl mx-auto p-3 md:py-4 px-4">
          <div className="flex flex-col lg:flex-row gap-4 justify-between items-center">
            
            <div className="flex gap-2 overflow-x-auto w-full lg:w-auto pb-1 lg:pb-0 scrollbar-hide">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors duration-200 ${
                    activeCategory === cat
                      ? "bg-blue-600 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="flex w-full lg:w-auto gap-3 items-center lg:flex-1 lg:max-w-md lg:justify-end">
              <div className="relative shrink-0 hidden sm:block">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                  <ListFilter className="w-3.5 h-3.5 text-slate-400" />
                </div>
                <select 
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="appearance-none pl-8 pr-7 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
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
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white transition-colors"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CONTENT GRID */}
      <div className="max-w-5xl mx-auto p-4 mt-8 md:mt-12">
        {dbError && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700 flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-sm">Database error</p>
              <p className="text-xs mt-1">{dbError}</p>
            </div>
          </div>
        )}

        {isLoading && (
          <div className="flex justify-center py-24">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              <span className="text-slate-500 text-sm font-medium">Loading premium catalog...</span>
            </div>
          </div>
        )}

        {!isLoading && filteredAndSortedCourses.length === 0 && !dbError && (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-200 mt-2">
            <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
              <Search className="w-5 h-5 text-slate-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1.5">No courses found</h3>
            <p className="text-slate-500 text-sm mb-5 max-w-xs mx-auto">We couldn't find any courses matching "{searchQuery}" in this category.</p>
            <button 
              onClick={() => { setSearchQuery(""); setActiveCategory("All"); }}
              className="px-5 py-2 bg-slate-100 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-200 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        )}

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
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
                className="group flex flex-col overflow-hidden rounded-2xl bg-white border border-slate-200 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:border-blue-200"
              >
                <div className="relative aspect-video overflow-hidden bg-slate-100">
                  <img
                    src={course.cover_pic_url || "/api/placeholder/800/450"}
                    alt={course.course_name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  
                  <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/60 opacity-80" />

                  {courseBadge && (
                    <div className={`absolute top-3 left-3 font-semibold text-[10px] px-2.5 py-1 rounded-md shadow-sm flex items-center gap-1 tracking-wide uppercase ${courseBadge.style}`}>
                      {courseBadge.text}
                    </div>
                  )}

                  {!!course.discount && Number(course.discount) > 0 && !courseBadge?.text.includes("Hot Deal") && (
                    <div className="absolute top-3 right-3 bg-red-500 text-white font-bold text-[10px] px-2 py-0.5 rounded shadow-sm tracking-wider uppercase">
                      {course.discount}% OFF
                    </div>
                  )}

                  <div className="absolute bottom-3 right-3 bg-slate-900/70 backdrop-blur-sm text-white text-[10px] font-semibold px-2 py-1 rounded flex items-center gap-1.5 z-20 shadow-sm">
                    <span className="tracking-wide">{course.course_hours} HRS RECORDED</span>
                  </div>

                  <div className="absolute inset-0 flex items-center justify-center bg-slate-900/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <PlayCircle className="w-12 h-12 text-white drop-shadow-md transform scale-95 group-hover:scale-100 transition-all duration-300" strokeWidth={1.5} />
                  </div>
                </div>

                <div className="p-4 sm:p-5 flex flex-col flex-grow relative">
                  <div className="flex items-center justify-between text-xs mb-2.5">
                    <div className="flex items-center gap-1 text-slate-500 font-medium">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span className="font-semibold text-slate-700">{formatRating(course.rating)}</span>
                      <span>({getStudentDisplay(course.enrolled_students)})</span>
                    </div>
                  </div>

                  <h3 className="font-bold text-lg text-slate-900 mb-1.5 line-clamp-2 leading-snug group-hover:text-blue-600 transition-colors">
                    {course.course_name}
                  </h3>

                  <p className="text-[13px] text-slate-500 mb-4 line-clamp-2 leading-relaxed">
                    {hookLine}
                  </p>

                  <ul className="text-[13px] text-slate-600 mb-5 space-y-2 flex-grow">
                    {features.length > 0 ? (
                      features.slice(0, 3).map((feature, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                          <span className="line-clamp-2 leading-tight">{feature}</span>
                        </li>
                      ))
                    ) : (
                      <>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                          <span className="leading-tight">Industry Standard Curriculum</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                          <span className="leading-tight">Practical Real-World Projects</span>
                        </li>
                      </>
                    )}
                  </ul>

                  <div className="mt-auto pt-4 border-t border-slate-100">
                    <div className="flex items-center gap-1 text-slate-400 text-[10px] font-semibold uppercase tracking-wider mb-2">
                      <Sparkles className="w-3 h-3 text-blue-400" /> {promoTag}
                    </div>
                    
                    <div className="flex justify-between items-end gap-2">
                      <div className="flex flex-col min-w-0 pr-1">
                        <div className="flex items-baseline gap-1.5 flex-wrap">
                          <div className="font-bold text-xl text-slate-900 tracking-tight leading-none">
                            {formatCurrency(price)}
                          </div>
                          {!!course.discount && Number(course.discount) > 0 && (
                            <div className="text-[10px] font-medium line-through text-slate-400 shrink-0">
                              {formatCurrency(course.standard_fee)}
                            </div>
                          )}
                        </div>
                        {savings > 0 && (
                          <div className="text-[10px] font-semibold text-emerald-600 mt-1">
                            Save {formatCurrency(savings)}
                          </div>
                        )}
                      </div>

                      <div className="shrink-0 text-blue-600 text-[13px] font-semibold group-hover:underline">
                        Details &rarr;
                      </div>
                    </div>
                  </div>
                  
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 mt-12 md:mt-20 mb-10 md:mb-12">
         <div className="h-px w-full bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
      </div>

      {/* BUNDLES SECTION */}
      <section id="bundles-section" className="max-w-5xl mx-auto px-4 pb-12">
        <div className="flex flex-col md:flex-row items-center gap-4 mb-8 md:mb-10 text-center md:text-left justify-center md:justify-start">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900">
              Career-Ready Bundles
            </h2>
            <p className="text-slate-500 mt-1 text-sm md:text-base">
              Save up to 70% with selected premium course combinations
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 md:gap-8 items-stretch">
          
          {/* LEFT HALF */}
          <div className="flex flex-col gap-6 md:gap-8">
            {BUNDLES.filter(b => !b.isFeatured).map((bundle) => {
              const savings = bundle.originalPrice - bundle.price;
              const savePercent = Math.round((savings / bundle.originalPrice) * 100);

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
                <div key={bundle.id} className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col h-full group cursor-pointer" onClick={() => setSelectedBundle(bundle)}>
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <span className="inline-flex items-center rounded-md px-2.5 py-1 text-[11px] font-semibold bg-slate-100 text-slate-600">
                      {bundle.badge}
                    </span>
                    <span className="inline-flex items-center rounded-md px-2.5 py-1 text-[11px] font-bold bg-emerald-50 text-emerald-600">
                      Save {savePercent}%
                    </span>
                  </div>

                  <h3 className="text-xl md:text-2xl font-bold leading-tight text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">
                    {bundle.title}
                  </h3>
                  
                  <div className="flex flex-wrap items-center gap-2 mb-4">
                    <div className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium bg-blue-50 text-blue-700">
                      <Layers3 className="w-3 h-3" />
                      {bundle.highlight}
                    </div>
                    {totalBundleHours > 0 && (
                      <div className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium bg-slate-50 text-slate-600">
                        <Clock className="w-3 h-3" />
                        {totalBundleHours} Hrs Total
                      </div>
                    )}
                  </div>

                  <p className="text-[13px] text-slate-600 mb-5 leading-relaxed">{bundle.description}</p>

                  <ul className="space-y-2.5 mb-6 flex-grow">
                    {bundleCoursesData.map((courseData, index) => (
                      <li key={index} className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5 text-emerald-500" />
                          <span className="text-[13px] font-medium leading-snug text-slate-700">
                            {courseData.name}
                          </span>
                        </div>
                        {courseData.hoursStr && (
                           <span className="text-[9px] font-semibold text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded shrink-0">
                             {courseData.hoursStr}h
                           </span>
                        )}
                      </li>
                    ))}
                  </ul>

                  <div className="mt-auto pt-5 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-baseline gap-2 mb-0.5">
                        <div className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">
                          {formatCurrency(bundle.price)}
                        </div>
                        <div className="text-xs font-medium line-through text-slate-400">
                          {formatCurrency(bundle.originalPrice)}
                        </div>
                      </div>
                      <p className="text-[11px] font-medium text-slate-500">One-time payment • Lifetime access</p>
                    </div>
                    
                    <button
                      className="bg-slate-100 text-slate-700 group-hover:bg-blue-600 group-hover:text-white flex items-center justify-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors shrink-0"
                    >
                      <span>View Details</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
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
                <div key={bundle.id} className="relative overflow-hidden bg-slate-900 text-white rounded-2xl p-6 md:p-8 shadow-lg transition-all duration-300 flex flex-col h-full cursor-pointer hover:shadow-xl" onClick={() => setSelectedBundle(bundle)}>
                  <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[80px] pointer-events-none" />
                  
                  <div className="relative flex flex-col flex-grow z-10">
                    <div className="flex items-start justify-between gap-2 mb-6">
                      <span className="inline-flex items-center rounded-md px-3 py-1 text-[11px] font-semibold bg-blue-500/20 text-blue-200">
                        {bundle.badge}
                      </span>
                      <span className="inline-flex items-center rounded-md px-3 py-1 text-[11px] font-bold bg-emerald-500/20 text-emerald-300">
                        Save {savePercent}%
                      </span>
                    </div>

                    <h3 className="text-3xl md:text-4xl font-bold leading-tight mb-3 text-white">
                      {bundle.title}
                    </h3>
                    
                    <div className="flex flex-wrap items-center gap-2 mb-5">
                      <div className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium bg-blue-500/10 text-blue-300">
                        <Layers3 className="w-3.5 h-3.5" />
                        {bundle.highlight}
                      </div>
                      {totalBundleHours > 0 && (
                        <div className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium bg-white/5 text-slate-300">
                          <Clock className="w-3.5 h-3.5" />
                          {totalBundleHours} Hrs Total
                        </div>
                      )}
                    </div>

                    <p className="text-sm text-slate-400 mb-6 leading-relaxed max-w-sm font-normal">
                      {bundle.description}
                    </p>

                    <div className="bg-white/5 rounded-xl p-5 mb-6 flex-grow">
                      <h4 className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-4">Included in this package:</h4>
                      <ul className="space-y-3">
                        {bundleCoursesData.map((courseData, index) => (
                          <li key={index} className="flex items-start justify-between gap-2">
                            <div className="flex items-start gap-2.5">
                              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-blue-400" />
                              <span className="text-[13px] font-medium leading-snug text-slate-200">
                                {courseData.name}
                              </span>
                            </div>
                            {courseData.hoursStr && (
                               <span className="text-[9px] font-semibold text-slate-400 bg-white/5 px-1.5 py-0.5 rounded shrink-0">
                                 {courseData.hoursStr}h
                               </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="mt-auto pt-5 border-t border-white/10">
                      <div className="flex items-baseline gap-2.5 mb-2">
                        <div className="text-4xl font-bold tracking-tight text-white">
                          {formatCurrency(bundle.price)}
                        </div>
                        <div className="text-sm font-medium line-through text-slate-500">
                          {formatCurrency(bundle.originalPrice)}
                        </div>
                      </div>
                      
                      <button
                        className="w-full mt-4 bg-blue-600 hover:bg-blue-500 flex items-center justify-center gap-2 rounded-lg px-5 py-3.5 text-sm font-semibold transition-colors text-white"
                      >
                        <span>See Detailed Value Breakdown</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* RENDER MODAL OVERLAY */}
      {renderBundleModal()}

    </div>
  );
}