'use client';

import React, { useEffect, useMemo, useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import {
  Search, Clock, BookOpen, Calculator, FlaskConical, Globe, Code, 
  FileSpreadsheet, Plus, ArrowRight, Play, Users, Sparkles, GraduationCap,
  Flame, X, MonitorPlay, ShieldCheck, BadgeCheck, History, Map, 
  CheckCircle, Star, Award, Layers, PlayCircle, Package, Layers3, CheckCircle2,
  Calendar, Briefcase, ChevronRight, TrendingUp
} from "lucide-react";

// --- INTERFACES ---
interface Vacancy {
  id: number | string;
  subject: string | string[];
  location: string;
  class_level: string;
  salary_range: string;
  created_at?: string;
  urgent?: boolean;
}

interface Tutor {
  id: number | string;
  name: string;
  subject: string | string[];
  experience: number;
  location: string;
}

interface CoursePromo {
  id: number | string;
  title: string;
  fee: number;          // This is the DISCOUNTED fee in the DB
  discount: number;     // Percentage
  original_fee: number; // Calculated via Math
  cover_pic?: string;
  duration?: string;
  active_batch_no?: number | null;
  course_code?: string | null; 
  start_date?: string | null; 
  timing?: string | null;
}

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
    description:
      "A complete architectural design workflow package for drafting, 3D modeling, BIM, rendering, and presentation.",
    courses: [
      "AutoCAD Basic to Advanced Course",
      "Autodesk Revit",
      "Architectural Visualization: AutoCAD, SketchUp, Enscape & Photoshop",
    ],
    price: 3333,
    originalPrice: 10000,
    badge: "🏛️ Best for Architects",
    highlight: "Perfect for design, modeling & visualization",
    targetAudience: [
      "Architecture Students",
      "Draftsmen",
      "Interior Designers",
      "Freelance Visualizers",
    ],
    careerPath: ["2D Drafting", "BIM Modeling", "3D Visualization", "Job Ready Architect"],
  },
  {
    id: "civil-engineering-bundle",
    title: "Civil Engineering",
    description:
      "A practical bundle for civil engineers covering design, costing, billing, and valuation workflows.",
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
    careerPath: ["Structural Analysis", "Cost Estimation", "Site Billing", "Valuation Expert"],
  },
  {
    id: "complete-engineering-package",
    title: "Complete Engineering Package",
    description:
      "The ultimate all-in-one package for architectural, civil, and GIS-related engineering skills.",
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
    targetAudience: [
      "Engineering Freshers",
      "Multi-disciplinary Consultants",
      "Firm Owners",
      "Master's Students",
    ],
    careerPath: ["Drafting & BIM", "Structural Design", "Costing & Valuation", "GIS & Final Delivery"],
  },
];

// --- SAFE HELPER FUNCTIONS ---
const formatCurrency = (amount: number | string) => {
  const num = Number(amount) || 0;
  return new Intl.NumberFormat("en-NP", {
    style: "currency",
    currency: "NPR",
    maximumFractionDigits: 0,
  }).format(num);
};

const calculateOriginalPrice = (discountedFee: number | string, discountPercent: number | null | undefined) => {
  const fee = Number(discountedFee) || 0;
  const discount = Number(discountPercent) || 0;
  if (discount === 0 || discount >= 100) return fee;
  return Math.round(fee / (1 - (discount / 100)));
};

const calculateRecordingSalePrice = (standardFee: number | string, discount: number | null | undefined) => {
  const f = Number(standardFee) || 0;
  const d = Number(discount) || 0;
  return f - (f * d) / 100;
};

const parseHours = (hoursStr: string | null | undefined): number => {
  if (!hoursStr) return 0;
  const match = hoursStr.match(/[\d.]+/);
  return match ? parseFloat(match[0]) : 0;
};

const parseDescription = (desc: string | null) => {
  if (!desc) return [];
  return desc
    .split("\n")
    .map((line) => line.replace(/✔️|✔/g, "").trim())
    .filter(Boolean);
};

const getInitials = (name?: string) => {
  if (!name) return "T";
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
};

const parseSubjects = (subjectData?: string | string[] | null): string[] => {
  if (!subjectData) return [];
  if (Array.isArray(subjectData)) return subjectData;
  if (typeof subjectData === "string") {
    try {
      const parsed = JSON.parse(subjectData);
      return Array.isArray(parsed) ? parsed : [subjectData];
    } catch {
      return [subjectData];
    }
  }
  return [];
};

const formatSubjects = (subjectData?: string | string[] | null) => {
  const subjects = parseSubjects(subjectData);
  if (subjects.length === 0 || !subjects[0]) return "Tutor";
  const firstSubject = subjects[0];
  const extraCount = subjects.length - 1;
  return (
    <>
      <span className="text-blue-600 font-semibold">{firstSubject}</span>
      {extraCount > 0 && <span className="text-slate-400"> +{extraCount}</span>}
    </>
  );
};

const getSubjectIcon = (subjectData?: string | string[] | null) => {
  const subjects = parseSubjects(subjectData);
  if (subjects.length === 0 || !subjects[0]) return <BookOpen className="w-5 h-5" />;
  const s = String(subjects[0]).toLowerCase();
  if (s.includes("math") || s.includes("account")) return <Calculator className="w-5 h-5 text-blue-600" />;
  if (s.includes("science") || s.includes("physics") || s.includes("chem") || s.includes("bio")) return <FlaskConical className="w-5 h-5 text-indigo-600" />;
  if (s.includes("english") || s.includes("ielts") || s.includes("pte")) return <Globe className="w-5 h-5 text-emerald-600" />;
  if (s.includes("computer") || s.includes("it") || s.includes("autocad") || s.includes("gis") || s.includes("cad")) return <Code className="w-5 h-5 text-slate-600" />;
  if (s.includes("excel")) return <FileSpreadsheet className="w-5 h-5 text-amber-600" />;
  return <BookOpen className="w-5 h-5 text-blue-500" />;
};

const formatPostedTime = (date?: string) => {
  if (!date) return "Recently";
  try {
    const diffHours = Math.floor((new Date().getTime() - new Date(date).getTime()) / 3600000);
    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  } catch {
    return "Recently";
  }
};

const formatDateString = (dateStr?: string | null) => {
  if (!dateStr) return null;
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return dateStr;
  }
};

// --- ANIMATION CONSTANTS ---
const SkeletonCard = () => (
  <div className="flex gap-4 p-4 rounded-3xl border border-slate-200 bg-white shadow-sm relative overflow-hidden min-w-[280px]">
    <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-slate-100/50 to-transparent z-10" />
    <div className="h-12 w-12 shrink-0 rounded-full bg-slate-100" />
    <div className="flex-1 space-y-3 py-1">
      <div className="h-4 w-3/4 rounded-md bg-slate-200" />
      <div className="h-3 w-1/2 rounded-md bg-slate-100" />
    </div>
  </div>
);

export default function HomeClient() {
  const router = useRouter();
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();

  const [vacancies, setVacancies] = useState<Vacancy[]>([]);
  const [topTutors, setTopTutors] = useState<Tutor[]>([]);
  const [promoCourses, setPromoCourses] = useState<CoursePromo[]>([]);
  const [recordings, setRecordings] = useState<RecordingCourse[]>([]);
  const [certificateCount, setCertificateCount] = useState<number>(2000);
  
  const [search, setSearch] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isFabOpen, setIsFabOpen] = useState(false);
  
  const [showPromoPopup, setShowPromoPopup] = useState(false);
  const [selectedBundle, setSelectedBundle] = useState<BundlePackage | null>(null);

  useEffect(() => {
    if (selectedBundle || showPromoPopup) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [selectedBundle, showPromoPopup]);

  useEffect(() => {
    let isMounted = true;
    const fetchHomeData = async () => {
      setLoading(true);
      try {
        const [vacanciesRes, tutorsRes, recordingsRes, certRes, coursesRes] = await Promise.all([
          supabase.from("vacancies").select("id, subject, location, class_level, salary_range, created_at, urgent").order("urgent", { ascending: false, nullsFirst: false }).order("created_at", { ascending: false }).limit(6),
          supabase.from("tutors").select("id, name, subject, experience, location").eq("verified", true).limit(8),
          supabase.from("recordings").select("*").eq("is_active", true).order("created_at", { ascending: false }),
          supabase.from("certificates").select("*", { count: "exact", head: true }),
          supabase.from("online_courses_v2").select("*").eq("is_active", true).limit(4)
        ]);

        if (!isMounted) return;
        if (!vacanciesRes.error) setVacancies(vacanciesRes.data || []);
        if (!tutorsRes.error) setTopTutors(tutorsRes.data || []);
        if (recordingsRes.data) setRecordings(recordingsRes.data as RecordingCourse[]);
        if (certRes.count !== null) setCertificateCount(certRes.count);

        if (coursesRes.data && coursesRes.data.length > 0) {
          const syllabusIds = coursesRes.data.map((c: any) => c.syllabus_id);
          
          const syllabiRes = await supabase
            .from("syllabi_v2")
            .select("id, cover_pic, duration, course_code")
            .in("id", syllabusIds);

          const batchesRes = await supabase
            .from("course_batches_v2")
            .select("syllabus_id, batch_no, start_datetime, timing")
            .in("syllabus_id", syllabusIds);

          const mappedCourses: CoursePromo[] = coursesRes.data.map((course: any) => {
            const syllabus = syllabiRes.data?.find((s: any) => s.id === course.syllabus_id);
            const activeBatch = batchesRes.data?.find((b: any) => b.syllabus_id === course.syllabus_id && b.batch_no === course.active_batch_no);

            return {
              id: course.syllabus_id,
              title: course.name,
              fee: course.fee,
              discount: course.discount,
              original_fee: calculateOriginalPrice(course.fee, course.discount),
              active_batch_no: course.active_batch_no,
              start_date: formatDateString(activeBatch?.start_datetime),
              timing: activeBatch?.timing,
              cover_pic: syllabus?.cover_pic || undefined,
              duration: syllabus?.duration || undefined,
              course_code: syllabus?.course_code || undefined 
            };
          });
          setPromoCourses(mappedCourses);
        }
      } catch (err) {
        console.error("Home Data Fetch Error:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchHomeData();
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    if (promoCourses.length > 0) {
      const hasSeenPromo = sessionStorage.getItem('has_seen_home_promo');
      if (!hasSeenPromo) {
        const timer = setTimeout(() => {
          setShowPromoPopup(true);
        }, 1500); 
        return () => clearTimeout(timer);
      }
    }
  }, [promoCourses]);

  const closePromoPopup = () => {
    setShowPromoPopup(false);
    sessionStorage.setItem('has_seen_home_promo', 'true');
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) setIsSearchFocused(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = () => {
    if (search.trim()) router.push(`/recording?search=${encodeURIComponent(search)}`);
  };

  const activeStudents = Math.ceil(certificateCount * 1.5);

  const randomRecordings = useMemo(() => {
    if (!recordings.length) return [];
    const shuffled = [...recordings];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled.slice(0, 4);
  }, [recordings]);

  // --- RENDER BUNDLE MODAL ---
  const renderBundleModal = () => {
    if (!selectedBundle) return null;

    const savings = selectedBundle.originalPrice - selectedBundle.price;
    const savePercent = Math.round((savings / selectedBundle.originalPrice) * 100);

    const bundleCoursesData = selectedBundle.courses.map((courseName) => {
      const found = recordings.find((c) => c.course_name === courseName);
      const features = parseDescription(found?.description || "");

      return {
        name: courseName,
        hoursStr: found?.course_hours || null,
        hoursNum: parseHours(found?.course_hours),
        outcomes:
          features.length > 0
            ? features.slice(0, 3)
            : ["Practical workflows", "Real-world project application", "Industry standard techniques"],
      };
    });

    const totalBundleHours = bundleCoursesData.reduce((sum, c) => sum + c.hoursNum, 0);

    return (
      <div className="fixed inset-0 z-[300] flex items-start justify-center overflow-y-auto bg-slate-900/70 backdrop-blur-sm p-4 sm:p-6">
        <div className="fixed inset-0" onClick={() => setSelectedBundle(null)} />

        <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl my-auto flex flex-col overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-200">
          <button
            onClick={() => setSelectedBundle(null)}
            className="absolute top-4 right-4 z-20 bg-black/20 hover:bg-black/40 transition-colors text-white p-2 rounded-full backdrop-blur-md"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 text-white p-6 md:p-10 relative overflow-hidden shrink-0">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/20 rounded-full blur-[80px]" />

            <div className="relative z-10">
              <span className="inline-flex rounded-full px-3 py-1 text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 mb-4">
                {selectedBundle.badge}
              </span>

              {/* FIX: Added explicitly mapped text-white to headings here */}
              <h2 className="text-2xl sm:text-4xl font-extrabold mb-2 text-white">
                {selectedBundle.title} Package
              </h2>

              <p className="text-blue-200 text-base sm:text-xl font-medium mb-6">
                {selectedBundle.courses.length} Industry-Ready Courses to Accelerate Your Career.
              </p>

              <div className="flex flex-wrap items-center gap-4 mb-8">
                <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-full">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  {/* FIX: Added text-white to explicitly ensure readability */}
                  <span className="text-sm font-bold text-white">4.8 Rating</span>
                </div>

                <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-full">
                  <Users className="w-4 h-4 text-emerald-400" />
                  {/* FIX: Added text-white to explicitly ensure readability */}
                  <span className="text-sm font-bold text-white">1,500+ Learners</span>
                </div>
              </div>

              <div className="bg-white/10 border border-white/20 rounded-2xl p-4 md:p-5 flex flex-col sm:flex-row items-center justify-between gap-5">
                <div>
                  <div className="text-sm text-slate-300 font-medium mb-1">Bundle Pricing</div>
                  <div className="flex items-baseline gap-3">
                    {/* FIX: Added text-white here to ensure it does not render black on dark background */}
                    <span className="text-3xl sm:text-4xl font-black text-white">{formatCurrency(selectedBundle.price)}</span>
                    <span className="text-base sm:text-lg line-through text-slate-400">
                      {formatCurrency(selectedBundle.originalPrice)}
                    </span>
                  </div>
                  <div className="text-emerald-400 font-bold text-sm mt-1">
                    You Save {savePercent}% ({formatCurrency(savings)})
                  </div>
                </div>

                <Link
                  href={`/order?type=recording&courseName=${encodeURIComponent(
                    selectedBundle.title + " Bundle"
                  )}&price=${selectedBundle.price}`}
                  onClick={() => setSelectedBundle(null)}
                  className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 px-8 rounded-xl flex items-center justify-center gap-2 transition-colors"
                >
                  Get This Bundle <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            </div>
          </div>

          <div className="p-6 md:p-10 overflow-y-auto max-h-[50vh] bg-slate-50">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
              <Stat icon={<Layers3 />} value={selectedBundle.courses.length} label="Total Courses" />
              <Stat icon={<Clock />} value={`${totalBundleHours}+`} label="Hours of Video" />
              <Stat icon={<ShieldCheck />} value={selectedBundle.courses.length} label="Certificates" />
              <Stat icon={<TrendingUp />} value="Life" label="Time Access" />
            </div>

            <div className="mb-10 md:mb-12">
              <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-blue-600" /> The Career Path
              </h3>

              <div className="flex flex-wrap items-center gap-2 sm:gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200">
                {selectedBundle.careerPath.map((step, idx) => (
                  <React.Fragment key={idx}>
                    <div className="text-sm font-bold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-lg">
                      {step}
                    </div>
                    {idx < selectedBundle.careerPath.length - 1 && (
                      <ChevronRight className="w-4 h-4 text-slate-400 hidden sm:block" />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6 md:gap-8 mb-10 md:mb-12">
              <div className="bg-white p-5 md:p-6 rounded-2xl border border-slate-200">
                <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-blue-600" /> Perfect For
                </h3>

                <ul className="space-y-3">
                  {selectedBundle.targetAudience.map((audience) => (
                    <li key={audience} className="flex items-start gap-2 text-sm text-slate-600 font-medium">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                      {audience}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="md:col-span-2 bg-white p-5 md:p-6 rounded-2xl border border-slate-200">
                <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-blue-600" /> Bundle Benefits
                </h3>

                <div className="grid sm:grid-cols-2 gap-4">
                  {[
                    `Lifetime access to all ${selectedBundle.courses.length} courses`,
                    "Real-world project-based learning",
                    "Learn at your own pace anytime",
                    "Individual certificates for each course",
                  ].map((item) => (
                    <div key={item} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                      <span className="text-sm text-slate-700 font-medium">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <h3 className="text-xl md:text-2xl font-extrabold text-slate-900 mb-6">Courses Included Inside</h3>

            <div className="space-y-4">
              {bundleCoursesData.map((course) => (
                <div
                  key={course.name}
                  className="bg-white border border-slate-200 rounded-2xl p-4 md:p-5 flex flex-col sm:flex-row gap-4 md:gap-5"
                >
                  <div className="bg-slate-50 p-3 md:p-4 rounded-xl h-fit w-fit">
                    <PlayCircle className="w-6 h-6 text-blue-500" />
                  </div>

                  <div className="flex-grow">
                    <h4 className="font-bold text-base md:text-lg text-slate-900 mb-1">{course.name}</h4>

                    {course.hoursStr && (
                      <div className="text-xs font-bold text-blue-600 bg-blue-50 inline-block px-2 py-1 rounded mb-3">
                        {course.hoursStr}h Content
                      </div>
                    )}

                    <ul className="space-y-1.5">
                      {course.outcomes.map((outcome: string) => (
                        <li key={outcome} className="flex items-start gap-2 text-xs md:text-sm text-slate-600">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                          {outcome}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Link
                    href={`/recording/${encodeURIComponent(course.name)}`}
                    onClick={() => setSelectedBundle(null)}
                    className="text-sm font-bold text-blue-600 hover:underline flex items-center gap-1 shrink-0 h-fit mt-2 sm:mt-0"
                  >
                    View Course <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border-t border-slate-200 p-5 md:px-10 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0">
            <div className="text-center sm:text-left w-full sm:w-auto">
              <div className="text-xs font-bold text-slate-500 uppercase mb-1">Limited Time Offer</div>
              <div className="flex items-baseline justify-center sm:justify-start gap-2">
                <span className="text-2xl font-black text-slate-900">
                  {formatCurrency(selectedBundle.price)}
                </span>
                <span className="text-sm line-through text-slate-400">
                  {formatCurrency(selectedBundle.originalPrice)}
                </span>
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
    <main className="min-h-screen bg-[#F8FAFC] selection:bg-blue-100 selection:text-blue-900 text-slate-900 font-sans flex flex-col relative overflow-x-hidden">
      
      {/* Background Decor */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-blue-400/10 blur-[120px]" />
        <div className="absolute top-[20%] right-[-10%] w-[40vw] h-[40vw] rounded-full bg-orange-400/10 blur-[120px]" />
      </div>

      {/* PROMO POPUP */}
      <AnimatePresence>
        {showPromoPopup && promoCourses.length > 0 && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={closePromoPopup}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 20 }} 
              className="relative w-full max-w-sm sm:max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden z-10 flex flex-col border border-slate-100"
            >
              <button onClick={closePromoPopup} className="absolute top-3 right-3 z-20 w-8 h-8 bg-black/40 text-white rounded-full flex items-center justify-center hover:bg-black/60 transition-colors backdrop-blur-md">
                <X className="w-4 h-4" />
              </button>
              
              <div className="relative h-48 sm:h-56 bg-slate-100 w-full overflow-hidden">
                {promoCourses[0].cover_pic ? (
                  <Image src={promoCourses[0].cover_pic} alt={promoCourses[0].title} fill className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-slate-800 text-white"><MonitorPlay className="w-10 h-10 opacity-50" /></div>
                )}
                <div className="absolute top-3 left-3 bg-red-600 text-white text-[10px] sm:text-[11px] font-black uppercase px-3 py-1 sm:py-1.5 rounded-lg flex items-center gap-1.5 shadow-lg"><Flame className="w-3.5 h-3.5"/> New Live Course</div>
              </div>
              
              <div className="p-5 sm:p-6 flex flex-col">
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-4 line-clamp-2 leading-snug">{promoCourses[0].title}</h3>
                
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3 sm:p-4 flex flex-col gap-3 mb-5">
                  <div className="flex items-center gap-3 text-xs sm:text-sm font-semibold text-slate-700">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0"><Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" /></div>
                    <div><span className="text-slate-500 text-[10px] sm:text-xs block font-medium">Starting Date</span>{promoCourses[0].start_date || "Upcoming"}</div>
                  </div>
                  {promoCourses[0].duration && (
                    <div className="flex items-center gap-3 text-xs sm:text-sm font-semibold text-slate-700">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center shrink-0"><Layers className="w-3.5 h-3.5 sm:w-4 sm:h-4" /></div>
                      <div><span className="text-slate-500 text-[10px] sm:text-xs block font-medium">Duration</span>{promoCourses[0].duration}</div>
                    </div>
                  )}
                  {promoCourses[0].timing && (
                    <div className="flex items-center gap-3 text-xs sm:text-sm font-semibold text-slate-700">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0"><Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" /></div>
                      <div><span className="text-slate-500 text-[10px] sm:text-xs block font-medium">Timing</span>{promoCourses[0].timing}</div>
                    </div>
                  )}
                </div>
                
                <Link 
                  href={`/onlinecourse/${encodeURIComponent(promoCourses[0].course_code || promoCourses[0].title)}`}
                  onClick={closePromoPopup}
                  className="w-full py-3.5 sm:py-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm sm:text-base text-center transition-colors shadow-md flex items-center justify-center gap-2"
                >
                  View Course Details <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                </Link>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="relative z-10 mx-auto w-full flex-grow pb-24">
        
        {/* 1. HERO SECTION */}
        <section className="relative px-3 pt-10 pb-12 md:pt-24 md:pb-32 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-col items-center text-center">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.5 }} className="mb-5 sm:mb-6 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 sm:px-4 py-1.5 text-[11px] sm:text-xs font-bold text-slate-700 shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-500"></span>
            </span>
            Nepal’s Premier Learning Ecosystem
          </motion.div>

          <motion.h1 initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1, duration: 0.6 }} className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-slate-900 leading-[1.15] max-w-5xl">
            Master your skills.<br />
            Find <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">expert tutors</span> & 
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-rose-500"> top courses</span>.
          </motion.h1>

          <motion.p initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2, duration: 0.6 }} className="mt-4 sm:mt-6 max-w-2xl text-sm sm:text-lg font-medium leading-relaxed text-slate-600 px-2">
            One platform to find verified personal tutors, post tuition requests, join live professional training, and earn verifiable certificates.
          </motion.p>

          {/* Search Bar */}
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3, duration: 0.6 }} className="relative mt-8 sm:mt-10 w-full max-w-2xl z-40 px-2 sm:px-0" ref={searchContainerRef}>
            <div className={`flex items-center p-1.5 sm:p-2 bg-white rounded-full border transition-all duration-300 ${isSearchFocused ? "border-blue-400 shadow-[0_8px_30px_rgba(37,99,235,0.15)] ring-4 ring-blue-50" : "border-slate-200 shadow-md"}`}>
              <Search className={`h-4 w-4 sm:h-5 sm:w-5 ml-3 sm:ml-4 shrink-0 transition-colors ${isSearchFocused ? "text-blue-600" : "text-slate-400"}`} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="What do you want to learn today?"
                className="h-11 sm:h-14 w-full bg-transparent px-3 sm:px-4 text-sm sm:text-lg font-medium outline-none placeholder:text-slate-400 text-slate-800"
              />
              <button onClick={handleSearch} className="h-11 sm:h-12 px-5 sm:px-8 rounded-full bg-slate-900 text-white text-sm sm:text-base font-bold hover:bg-slate-800 transition-colors shrink-0">
                Search
              </button>
            </div>
            
            {/* Quick Search Dropdown */}
            <AnimatePresence>
              {isSearchFocused && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute top-[calc(100%+12px)] left-2 right-2 sm:left-0 sm:right-0 bg-white border border-slate-200 rounded-3xl shadow-xl overflow-hidden text-left p-2">
                  <p className="px-4 py-2 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400">Quick Links</p>
                  <button onMouseDown={() => router.push("/tutors")} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 rounded-xl text-sm sm:text-base font-semibold text-slate-700 transition-colors"><Users className="w-4 h-4 text-slate-400" /> Browse Tutors</button>
                  <button onMouseDown={() => router.push("/vacancies")} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 rounded-xl text-sm sm:text-base font-semibold text-slate-700 transition-colors"><FileSpreadsheet className="w-4 h-4 text-slate-400" /> View Tuition Vacancies</button>
                  <button onMouseDown={() => router.push("/onlinecourse")} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 rounded-xl text-sm sm:text-base font-semibold text-slate-700 transition-colors"><MonitorPlay className="w-4 h-4 text-slate-400" /> Live Online Courses</button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Primary Action Buttons */}
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4, duration: 0.6 }} className="mt-8 flex flex-wrap justify-center gap-2 sm:gap-3 px-2 sm:px-0">
            <Link href="/tutors" className="flex items-center gap-2 rounded-full bg-white border border-slate-200 px-5 sm:px-6 py-2.5 sm:py-3 text-[13px] sm:text-sm font-bold text-slate-700 shadow-sm hover:shadow-md hover:border-blue-200 transition-all"><Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600" /> Find Tutors</Link>
            <Link href="/post-tuition" className="flex items-center gap-2 rounded-full bg-blue-600 px-5 sm:px-6 py-2.5 sm:py-3 text-[13px] sm:text-sm font-bold text-white shadow-md hover:bg-blue-700 transition-all"><Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Post Request</Link>
            <Link href="/onlinecourse" className="flex items-center gap-2 rounded-full bg-white border border-slate-200 px-5 sm:px-6 py-2.5 sm:py-3 text-[13px] sm:text-sm font-bold text-slate-700 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all"><MonitorPlay className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600" /> Live Courses</Link>
            <Link href="/recording" className="flex items-center gap-2 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 px-5 sm:px-6 py-2.5 sm:py-3 text-[13px] sm:text-sm font-bold text-white shadow-md hover:shadow-lg transition-all"><Play className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Recordings</Link>
          </motion.div>

          {/* Secondary Links */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6, duration: 0.6 }} className="mt-6 flex flex-wrap justify-center items-center gap-4 sm:gap-6 text-[13px] sm:text-sm font-semibold text-slate-500">
            <Link href="/become-a-tutor" className="hover:text-blue-600 transition-colors flex items-center gap-1">Become a Tutor <ArrowRight className="w-3 h-3" /></Link>
            <span className="hidden sm:block w-1 h-1 rounded-full bg-slate-300"></span>
            <Link href="/certificate" className="hover:text-emerald-600 transition-colors flex items-center gap-1">Verify Certificate <BadgeCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" /></Link>
          </motion.div>
        </section>

        {/* 2. TRUST & STATS STRIP */}
        <section className="border-y border-slate-200/60 bg-white/50 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 md:py-10">
            <div className="grid grid-cols-3 gap-2 sm:gap-8 text-center divide-x divide-slate-200/60">
              <div className="flex flex-col items-center justify-center">
                <p className="text-2xl sm:text-4xl font-black text-slate-900">{activeStudents}+</p>
                <p className="text-[9px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider mt-1 sm:mt-2">Active Students</p>
              </div>
              <div className="flex flex-col items-center justify-center">
                <p className="text-2xl sm:text-4xl font-black text-slate-900">10+</p>
                <p className="text-[9px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider mt-1 sm:mt-2">Active Courses</p>
              </div>
              <div className="flex flex-col items-center justify-center">
                <p className="text-2xl sm:text-4xl font-black text-slate-900">{certificateCount}+</p>
                <p className="text-[9px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider mt-1 sm:mt-2">Certificates</p>
              </div>
            </div>
          </div>
        </section>

        {/* 3. MAIN SERVICES GRID */}
        <section className="py-12 md:py-20 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Everything you need to grow</h2>
            <p className="mt-2 sm:mt-4 text-sm sm:text-base text-slate-600 font-medium">Explore all services available on GyanHub.</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {[
              { title: "Find Tutors", desc: "Browse verified tutors for academic subjects, languages, and technical skills.", icon: Users, color: "text-blue-600", bg: "bg-blue-50", link: "/tutors" },
              { title: "Post Tuition", desc: "Can't find the perfect match? Post your requirements and let tutors apply.", icon: Plus, color: "text-indigo-600", bg: "bg-indigo-50", link: "/post-tuition" },
              { title: "Live Courses", desc: "Join interactive, live professional training sessions with expert instructors.", icon: MonitorPlay, color: "text-emerald-600", bg: "bg-emerald-50", link: "/onlinecourse" },
              { title: "Recordings", desc: "Learn at your own pace with lifetime access to high-quality recorded courses.", icon: Play, color: "text-orange-600", bg: "bg-orange-50", link: "/recording" },
              { title: "Verify Certificates", desc: "Check the authenticity of certificates issued by GyanHub easily.", icon: BadgeCheck, color: "text-slate-700", bg: "bg-slate-100", link: "/certificate" },
              { title: "Become a Tutor", desc: "Join our network of educators and professionals to start teaching.", icon: GraduationCap, color: "text-blue-600", bg: "bg-blue-50", link: "/become-a-tutor" },
            ].map((service, idx) => (
              <Link key={idx} href={service.link} className="group p-5 md:p-6 rounded-3xl bg-white border border-slate-200 hover:border-blue-200 hover:shadow-xl transition-all duration-300">
                <div className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl ${service.bg} flex items-center justify-center mb-4 md:mb-5 group-hover:scale-110 transition-transform`}>
                  <service.icon className={`w-6 h-6 md:w-7 md:h-7 ${service.color}`} />
                </div>
                <h3 className="text-lg md:text-xl font-bold text-slate-900 mb-2">{service.title}</h3>
                <p className="text-xs md:text-sm font-medium text-slate-500 leading-relaxed mb-4">{service.desc}</p>
                <span className="text-xs md:text-sm font-bold text-blue-600 flex items-center gap-1 group-hover:gap-2 transition-all">Explore <ArrowRight className="w-3.5 h-3.5 md:w-4 md:h-4" /></span>
              </Link>
            ))}
          </div>
        </section>

        {/* 4. AUDIENCE SEGMENTATION */}
        <section className="py-12 md:py-16 bg-slate-900 text-white">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
              <div className="p-6 md:p-8 rounded-3xl bg-slate-800/50 border border-slate-700">
                <BookOpen className="w-8 h-8 md:w-10 md:h-10 text-blue-400 mb-5 md:mb-6" />
                <h3 className="text-xl md:text-2xl font-bold mb-2 md:mb-3">For Students & Parents</h3>
                <p className="text-sm md:text-base text-slate-400 font-medium mb-5 md:mb-6">Find reliable home or online tutors for school, college, and entrance preparations. Post requirements for free.</p>
                <Link href="/tutors" className="text-blue-400 font-bold hover:text-blue-300 flex items-center gap-2 text-sm md:text-base">Find a Tutor <ArrowRight className="w-4 h-4"/></Link>
              </div>
              <div className="p-6 md:p-8 rounded-3xl bg-slate-800/50 border border-slate-700">
                <Layers className="w-8 h-8 md:w-10 md:h-10 text-emerald-400 mb-5 md:mb-6" />
                <h3 className="text-xl md:text-2xl font-bold mb-2 md:mb-3">For Professionals</h3>
                <p className="text-sm md:text-base text-slate-400 font-medium mb-5 md:mb-6">Upskill with live and recorded courses in AutoCAD, GIS, IT, and more. Earn verifiable certificates to boost your resume.</p>
                <Link href="/onlinecourse" className="text-emerald-400 font-bold hover:text-emerald-300 flex items-center gap-2 text-sm md:text-base">Explore Courses <ArrowRight className="w-4 h-4"/></Link>
              </div>
              <div className="p-6 md:p-8 rounded-3xl bg-slate-800/50 border border-slate-700">
                <GraduationCap className="w-8 h-8 md:w-10 md:h-10 text-orange-400 mb-5 md:mb-6" />
                <h3 className="text-xl md:text-2xl font-bold mb-2 md:mb-3">For Educators</h3>
                <p className="text-sm md:text-base text-slate-400 font-medium mb-5 md:mb-6">Create a verified profile, browse active tuition requests, and connect directly with students looking for your expertise.</p>
                <Link href="/become-a-tutor" className="text-orange-400 font-bold hover:text-orange-300 flex items-center gap-2 text-sm md:text-base">Join as Tutor <ArrowRight className="w-4 h-4"/></Link>
              </div>
            </div>
          </div>
        </section>

        {/* 5. FEATURED LIVE COURSES */}
        <section className="py-12 md:py-20 bg-white border-y border-slate-200/60 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-8 md:mb-10">
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 flex items-center gap-2 sm:gap-3"><MonitorPlay className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" /> Live Courses</h2>
              <p className="mt-1 sm:mt-2 text-sm sm:text-base text-slate-600 font-medium">Interactive sessions ready for enrollment.</p>
            </div>
            <Link href="/onlinecourse" className="hidden sm:flex text-sm font-bold text-blue-600 hover:text-blue-700 items-center gap-1">View All <ArrowRight className="w-4 h-4"/></Link>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {loading ? Array(4).fill(0).map((_, i) => <SkeletonCard key={i} />) : promoCourses.length > 0 ? promoCourses.map(course => {
              return (
                <Link key={course.id} href={`/onlinecourse/${encodeURIComponent(course.course_code || course.title)}`} className="group flex flex-col bg-white rounded-3xl border border-slate-200 overflow-hidden hover:shadow-xl hover:border-blue-200 transition-all">
                  <div className="relative h-40 sm:h-48 bg-slate-100 overflow-hidden">
                    {course.cover_pic ? (
                      <Image src={course.cover_pic} alt={course.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-slate-300"><MonitorPlay className="w-10 h-10 sm:w-12 sm:h-12" /></div>
                    )}
                    <div className="absolute top-3 left-3 bg-red-500 text-white text-[9px] sm:text-[10px] font-black uppercase px-2 py-1 rounded-md flex items-center gap-1"><Flame className="w-3 h-3"/> Active</div>
                  </div>
                  <div className="p-4 sm:p-5 flex flex-col flex-grow">
                    <h3 className="font-bold text-slate-900 text-base sm:text-lg mb-3 sm:mb-4 line-clamp-2">{course.title}</h3>
                    
                    <div className="text-[11px] sm:text-xs font-medium text-slate-500 flex flex-col gap-1.5 sm:gap-2 mb-4 mt-auto">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500" /> 
                        <span className="truncate">{course.start_date ? `Starts: ${course.start_date}` : "Enrollment Open"}</span>
                      </div>
                      {course.duration && (
                        <div className="flex items-center gap-2">
                          <Layers className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-500" /> 
                          <span className="truncate">{course.duration}</span>
                        </div>
                      )}
                      {course.timing && (
                        <div className="flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-500" /> 
                          <span className="truncate">{course.timing}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-3 sm:pt-4 border-t border-slate-100">
                      <div className="flex flex-col">
                         <span className="font-black text-base sm:text-lg text-slate-900">{formatCurrency(course.fee)}</span>
                         {!!course.discount && course.discount > 0 && (
                           <span className="text-[9px] sm:text-[10px] font-medium line-through text-slate-400">{formatCurrency(course.original_fee)}</span>
                         )}
                      </div>
                      <span className="text-xs sm:text-sm font-bold text-blue-600">Details</span>
                    </div>
                  </div>
                </Link>
              );
            }) : (
              <div className="col-span-full py-10 text-center text-slate-500 font-medium bg-white rounded-3xl border border-slate-200">No live courses currently scheduled.</div>
            )}
          </div>
          <Link href="/onlinecourse" className="mt-6 sm:hidden flex justify-center text-sm font-bold text-blue-600 border border-blue-100 bg-blue-50 py-3 rounded-xl items-center gap-1">View All Live Courses <ArrowRight className="w-4 h-4"/></Link>
        </section>

        {/* 6. FEATURED RECORDINGS (Randomized) */}
        <section className="py-12 md:py-20 bg-slate-50 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-8 md:mb-10">
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 flex items-center gap-2 sm:gap-3"><Play className="w-6 h-6 sm:w-8 sm:h-8 text-orange-500" /> Recording Courses</h2>
              <p className="mt-1 sm:mt-2 text-sm sm:text-base text-slate-600 font-medium">Learn anytime, anywhere at your own pace.</p>
            </div>
            <Link href="/recording" className="hidden sm:flex text-sm font-bold text-orange-600 hover:text-orange-700 items-center gap-1">View All <ArrowRight className="w-4 h-4"/></Link>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {loading ? Array(4).fill(0).map((_, i) => <SkeletonCard key={i} />) : randomRecordings.length > 0 ? randomRecordings.map(course => {
              const salePrice = calculateRecordingSalePrice(course.standard_fee, course.discount);
              return (
                <Link key={course.id} href={`/recording/${encodeURIComponent(course.course_name)}`} className="group flex flex-col bg-white rounded-3xl border border-slate-200 overflow-hidden hover:shadow-xl hover:border-orange-200 transition-all">
                  <div className="relative h-36 sm:h-40 bg-slate-900 overflow-hidden flex items-center justify-center">
                    {course.cover_pic_url ? (
                      <>
                        <Image src={course.cover_pic_url} alt={course.course_name} fill className="object-cover opacity-60 group-hover:scale-105 transition-transform duration-500" />
                        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/30 opacity-0 group-hover:opacity-100 transition-opacity">
                           <PlayCircle className="w-12 h-12 sm:w-14 sm:h-14 text-white drop-shadow-lg" />
                        </div>
                      </>
                    ) : (
                      <Play className="w-10 h-10 sm:w-12 sm:h-12 text-white/50 group-hover:text-white transition-colors group-hover:scale-110 duration-300" />
                    )}
                    {course.course_hours && (
                      <div className="absolute bottom-2.5 right-2.5 sm:bottom-3 sm:right-3 bg-black/70 text-white text-[9px] sm:text-[10px] font-bold px-2 py-1 sm:px-2.5 sm:py-1 rounded-md backdrop-blur-md flex items-center gap-1.5">
                        <Clock className="w-3 h-3 text-orange-400" /> {course.course_hours}+ hours
                      </div>
                    )}
                  </div>
                  <div className="p-4 sm:p-5 flex flex-col flex-grow">
                    <h3 className="font-bold text-slate-900 text-base mb-2 line-clamp-2">{course.course_name}</h3>
                    <div className="text-[11px] sm:text-xs font-medium text-slate-500 flex items-center gap-1.5 sm:gap-2 mb-3 sm:mb-4 mt-auto">
                      <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> {(course.enrolled_students || 0).toLocaleString()} enrolled
                    </div>
                    <div className="flex items-center justify-between pt-3 sm:pt-4 border-t border-slate-100">
                      <div className="flex flex-col">
                        <span className="font-black text-base sm:text-lg text-slate-900">{formatCurrency(salePrice)}</span>
                        {!!course.discount && course.discount > 0 && (
                          <span className="text-[9px] sm:text-[10px] font-medium line-through text-slate-400">{formatCurrency(course.standard_fee)}</span>
                        )}
                      </div>
                      <span className="text-xs sm:text-sm font-bold text-orange-600">Watch Now</span>
                    </div>
                  </div>
                </Link>
              );
            }) : (
              <div className="col-span-full py-10 text-center text-slate-500 font-medium bg-white rounded-3xl border border-slate-200">No recorded courses available right now.</div>
            )}
          </div>
          <Link href="/recording" className="mt-6 sm:hidden flex justify-center text-sm font-bold text-orange-600 border border-orange-100 bg-orange-50 py-3 rounded-xl items-center gap-1">View All Recordings <ArrowRight className="w-4 h-4"/></Link>
        </section>

        {/* 7. INTERACTIVE BUNDLES SECTION */}
        <section id="bundles-section" className="py-12 md:py-20 bg-[#F8FAFC] border-y border-slate-200/60">
          <div className="max-w-6xl mx-auto px-3 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row items-center gap-3 sm:gap-4 mb-8 md:mb-12 text-center md:text-left justify-center md:justify-start">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-600/30 shrink-0">
                <Package className="w-6 h-6 sm:w-7 sm:h-7" />
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900">Career-Ready Bundles</h2>
                <p className="text-slate-500 mt-1 text-sm sm:text-lg font-medium">Save up to 70% with curated premium combinations.</p>
              </div>
            </div>
            
            <div className="grid lg:grid-cols-2 gap-6 md:gap-8 items-stretch">
              {/* LEFT HALF */}
              <div className="flex flex-col gap-6 md:gap-8">
                {BUNDLES.filter(b => !b.isFeatured).map((bundle) => {
                  const savings = bundle.originalPrice - bundle.price;
                  const savePercent = Math.round((savings / bundle.originalPrice) * 100);

                  const bundleCoursesData = bundle.courses.map(courseName => {
                    const found = recordings.find(c => c.course_name === courseName);
                    return {
                      name: courseName,
                      hoursStr: found ? found.course_hours : null,
                      hoursNum: parseHours(found?.course_hours)
                    };
                  });
                  const totalBundleHours = bundleCoursesData.reduce((sum, c) => sum + c.hoursNum, 0);

                  return (
                    <div 
                      key={bundle.id} 
                      onClick={() => setSelectedBundle(bundle)}
                      className="bg-white border border-slate-200 rounded-[24px] p-5 md:p-8 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col h-full group cursor-pointer"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2 sm:gap-3 mb-4 sm:mb-5">
                        <span className="inline-flex items-center rounded-full px-2.5 py-1 text-[10px] sm:text-xs font-bold bg-slate-100 text-slate-700">
                          {bundle.badge}
                        </span>
                        <span className="inline-flex items-center rounded-full px-2.5 py-1 text-[10px] sm:text-xs font-bold bg-red-50 text-red-600 ring-1 ring-red-100">
                          Save {savePercent}%
                        </span>
                      </div>

                      <h3 className="text-xl sm:text-2xl font-extrabold leading-tight text-slate-900 mb-2 sm:mb-3 group-hover:text-blue-600 transition-colors">{bundle.title}</h3>
                      
                      <div className="flex flex-wrap items-center gap-2 mb-4 sm:mb-5">
                        <div className="inline-flex items-center gap-1 sm:gap-1.5 rounded-full px-2.5 py-1 sm:px-3 sm:py-1.5 text-[10px] sm:text-xs font-semibold bg-blue-50 text-blue-700">
                          <Layers3 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                          {bundle.highlight}
                        </div>
                        {totalBundleHours > 0 && (
                          <div className="inline-flex items-center gap-1 sm:gap-1.5 rounded-full px-2.5 py-1 sm:px-3 sm:py-1.5 text-[10px] sm:text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                            {totalBundleHours} Hrs Total
                          </div>
                        )}
                      </div>

                      <p className="text-xs sm:text-sm text-slate-600 mb-5 sm:mb-6 leading-relaxed">{bundle.description}</p>

                      <ul className="space-y-2 sm:space-y-3 mb-6 sm:mb-8 flex-grow">
                        {bundleCoursesData.map((courseData, index) => (
                          <li key={index} className="flex items-start justify-between gap-2 sm:gap-3 group/item">
                            <div className="flex items-start gap-2 sm:gap-3 pr-2">
                              <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 mt-0.5 text-emerald-500" />
                              <span className="text-xs sm:text-sm font-medium leading-snug transition-colors text-slate-700">
                                {courseData.name}
                              </span>
                            </div>
                            {courseData.hoursStr && (
                               <span className="text-[9px] sm:text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-md shrink-0 border border-slate-200">
                                 {courseData.hoursStr}h
                               </span>
                            )}
                          </li>
                        ))}
                      </ul>

                      <div className="mt-auto pt-4 sm:pt-5 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 shrink-0">
                        <div>
                          <div className="flex items-baseline gap-2 mb-1">
                            <span className="text-2xl sm:text-3xl font-black text-slate-900">{formatCurrency(bundle.price)}</span>
                            <span className="text-xs sm:text-sm line-through text-slate-400">{formatCurrency(bundle.originalPrice)}</span>
                          </div>
                          <p className="text-[10px] sm:text-xs font-medium text-slate-500">One-time payment • Lifetime access</p>
                        </div>
                        <button className="w-full sm:w-auto bg-slate-900 group-hover:bg-blue-600 text-white font-bold py-3 sm:py-3.5 px-5 sm:px-6 rounded-xl transition-all flex items-center justify-center gap-2 text-sm sm:text-base">
                          View Details <ArrowRight className="w-4 h-4" />
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
                    const found = recordings.find(c => c.course_name === courseName);
                    return {
                      name: courseName,
                      hoursStr: found ? found.course_hours : null,
                      hoursNum: parseHours(found?.course_hours)
                    };
                  });
                  const totalBundleHours = bundleCoursesData.reduce((sum, c) => sum + c.hoursNum, 0);

                  return (
                    <div 
                      key={bundle.id} 
                      onClick={() => setSelectedBundle(bundle)}
                      className="relative overflow-hidden bg-gradient-to-b from-slate-900 to-slate-950 text-white rounded-[24px] p-6 sm:p-8 md:p-10 shadow-2xl transition-all duration-300 flex flex-col h-full ring-1 ring-white/10 group cursor-pointer hover:ring-blue-500/50"
                    >
                      <div className="absolute top-0 right-0 w-60 h-60 sm:w-80 sm:h-80 bg-blue-500/10 rounded-full blur-[80px] sm:blur-[100px] pointer-events-none" />
                      
                      <div className="relative flex flex-col flex-grow z-10">
                        <div className="flex flex-wrap items-start justify-between gap-2 sm:gap-3 mb-6 sm:mb-8">
                          <span className="inline-flex items-center rounded-full px-3 py-1 sm:px-4 sm:py-1.5 text-[10px] sm:text-xs font-bold bg-blue-500 text-white">
                            {bundle.badge}
                          </span>
                          <span className="inline-flex items-center rounded-full px-3 py-1 sm:px-4 sm:py-1.5 text-[10px] sm:text-xs font-bold bg-red-500 text-white">
                            Save {savePercent}%
                          </span>
                        </div>

                        <h3 className="text-3xl sm:text-4xl lg:text-5xl font-black leading-[1.1] mb-3 sm:mb-4 text-white">{bundle.title}</h3>
                        
                        <div className="flex flex-wrap items-center gap-2 mb-4 sm:mb-6">
                          <div className="inline-flex items-center gap-1.5 sm:gap-2 rounded-full px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-bold bg-blue-500/10 text-blue-300 border border-blue-500/20">
                            <Layers3 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            {bundle.highlight}
                          </div>
                          {totalBundleHours > 0 && (
                            <div className="inline-flex items-center gap-1.5 sm:gap-2 rounded-full px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                              <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                              {totalBundleHours} Hrs Total
                            </div>
                          )}
                        </div>

                        <p className="text-sm sm:text-base text-slate-400 mb-6 sm:mb-8 leading-relaxed max-w-md font-light">{bundle.description}</p>

                        <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-4 sm:p-6 mb-6 sm:mb-8 flex-grow">
                          <h4 className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-4 sm:mb-5">Included in this package:</h4>
                          <ul className="space-y-3 sm:space-y-4">
                            {bundleCoursesData.map((courseData, index) => (
                              <li key={index} className="flex items-start justify-between gap-2 sm:gap-3 group/item">
                                <div className="flex items-start gap-2 sm:gap-3 pr-2">
                                  <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 shrink-0 mt-0.5 text-blue-400" />
                                  <span className="text-sm sm:text-base font-medium leading-snug transition-colors text-slate-300">
                                    {courseData.name}
                                  </span>
                                </div>
                                {courseData.hoursStr && (
                                   <span className="text-[10px] sm:text-[11px] font-bold text-slate-300 bg-white/10 px-1.5 py-0.5 sm:px-2 sm:py-0.5 rounded-md shrink-0 border border-white/5">
                                     {courseData.hoursStr}h
                                   </span>
                                )}
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="mt-auto pt-5 sm:pt-6 border-t border-white/10 flex flex-col justify-between gap-3 sm:gap-4 shrink-0">
                          <div>
                            <div className="flex items-baseline flex-wrap gap-2 sm:gap-3 mb-1 sm:mb-2">
                              <div className="text-4xl sm:text-5xl font-black tracking-tight text-white">{formatCurrency(bundle.price)}</div>
                              <div className="text-lg sm:text-xl font-medium line-through text-slate-500">{formatCurrency(bundle.originalPrice)}</div>
                            </div>
                          </div>
                          
                          <button className="bg-blue-600 group-hover:bg-blue-500 rounded-xl px-5 py-3.5 sm:px-6 sm:py-4 text-base sm:text-lg flex items-center justify-center transition-all shadow-lg shrink-0 text-white w-full font-bold mt-1 sm:mt-2">
                            See Detailed Value Breakdown <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
                          </button>
                          <p className="text-center text-[11px] sm:text-[13px] mt-1 sm:mt-2 font-medium text-slate-400">
                            One-time payment • Lifetime access • Earn your certificate
                          </p>
                        </div>

                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* 8 & 9. DYNAMIC DATA ROW: TUTORS & VACANCIES */}
        <section className="py-12 md:py-20 bg-white border-y border-slate-200/60 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12">
            
            {/* Tutors */}
            <div>
              <div className="flex items-center justify-between mb-5 sm:mb-6">
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 flex items-center gap-2"><BadgeCheck className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500"/> Featured Tutors</h2>
                <Link href="/tutors" className="text-xs sm:text-sm font-bold text-blue-600">See All</Link>
              </div>
              <div className="space-y-3 sm:space-y-4">
                {loading ? Array(4).fill(0).map((_, i) => <SkeletonCard key={i} />) : topTutors.slice(0, 4).map(tutor => (
                   <Link key={tutor.id} href={`/tutors/${tutor.id}`} className="flex items-center gap-3 sm:gap-4 bg-white border border-slate-200 p-3 sm:p-4 rounded-2xl hover:shadow-md hover:border-blue-200 transition-all">
                     <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500 shrink-0 text-sm sm:text-base">{getInitials(tutor.name)}</div>
                     <div>
                       <h4 className="font-bold text-sm sm:text-base text-slate-900">{tutor.name || "Tutor"}</h4>
                       <p className="text-[11px] sm:text-sm font-medium text-slate-500 mt-0.5 sm:mt-1">{formatSubjects(tutor.subject)} • {tutor.experience}y exp</p>
                     </div>
                   </Link>
                ))}
              </div>
            </div>

            {/* Vacancies */}
            <div>
              <div className="flex items-center justify-between mb-5 sm:mb-6">
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 flex items-center gap-2"><div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-emerald-500 animate-pulse"/> Coaching Requests</h2>
                <Link href="/vacancies" className="text-xs sm:text-sm font-bold text-blue-600">See All</Link>
              </div>
              <div className="space-y-3 sm:space-y-4">
                {loading ? Array(4).fill(0).map((_, i) => <SkeletonCard key={i} />) : vacancies.slice(0, 4).map(vac => (
                   <Link key={vac.id} href={`/vacancies/${vac.id}`} className={`flex items-center gap-3 sm:gap-4 bg-white border ${vac.urgent ? 'border-orange-200' : 'border-slate-200'} p-3 sm:p-4 rounded-2xl hover:shadow-md transition-all`}>
                     <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center shrink-0 ${vac.urgent ? 'bg-orange-50' : 'bg-slate-50'}`}>
                       {getSubjectIcon(vac.subject)}
                     </div>
                     <div className="flex-1 min-w-0">
                       <h4 className="font-bold text-sm sm:text-base text-slate-900 flex items-center gap-1.5 sm:gap-2 truncate">{formatSubjects(vac.subject)} {vac.urgent && <Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-500" />}</h4>
                       <div className="flex items-center justify-between mt-0.5 sm:mt-1">
                         <p className="text-[11px] sm:text-sm font-medium text-slate-500 truncate">{vac.location || "Remote"}</p>
                         <p className="text-[9px] sm:text-[10px] font-bold uppercase text-slate-400">{formatPostedTime(vac.created_at)}</p>
                       </div>
                     </div>
                   </Link>
                ))}
              </div>
            </div>

          </div>
        </section>

        {/* 10. CERTIFICATE TRUST SECTION */}
        <section className="py-14 md:py-20 bg-emerald-900 text-white overflow-hidden relative">
          <div className="absolute -top-40 -right-40 w-80 h-80 md:w-96 md:h-96 bg-emerald-500/30 blur-[80px] md:blur-[100px] rounded-full"></div>
          <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 md:gap-12 items-center">
              <div>
                <div className="inline-flex items-center gap-1.5 sm:gap-2 bg-emerald-800/50 border border-emerald-700 px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold text-emerald-300 mb-5 sm:mb-6">
                  <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> 100% Verifiable
                </div>
                <h2 className="text-3xl sm:text-4xl font-extrabold mb-4 sm:mb-6">Trusted Certificates that validate your skills.</h2>
                <p className="text-emerald-100/80 font-medium text-sm sm:text-lg leading-relaxed mb-6 sm:mb-8">
                  Every course completion certificate issued by GyanHub comes with a unique verification link and ID. Employers and institutions can instantly verify authenticity online, giving your resume true credibility.
                </p>
                <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
                  <Link href="/certificate" className="w-full sm:w-auto text-center bg-emerald-500 hover:bg-emerald-400 text-white px-6 py-3 rounded-xl font-bold transition-colors text-sm sm:text-base">Verify a Certificate</Link>
                  <Link href="/onlinecourse" className="text-emerald-200 text-sm sm:text-base font-bold hover:text-white transition-colors">Browse Certifiable Courses</Link>
                </div>
              </div>
              <div className="relative mt-8 lg:mt-0">
                <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-6 md:p-8 rounded-3xl shadow-2xl rotate-2 sm:rotate-3 transform hover:rotate-0 transition-transform duration-500">
                  <div className="border-2 border-emerald-500/30 p-5 md:p-6 rounded-2xl relative">
                    <Award className="absolute top-4 right-4 md:top-6 md:right-6 w-10 h-10 md:w-12 md:h-12 text-emerald-400 opacity-50" />
                    <div className="w-12 h-3 md:w-16 md:h-4 bg-emerald-500/40 rounded-full mb-6 md:mb-8"></div>
                    <div className="w-3/4 h-6 md:h-8 bg-white/20 rounded-md mb-3 md:mb-4"></div>
                    <div className="w-1/2 h-3 md:h-4 bg-white/10 rounded-md mb-8 md:mb-12"></div>
                    <div className="flex justify-between items-end">
                      <div>
                        <div className="w-16 md:w-20 h-1.5 md:h-2 bg-white/20 rounded-full mb-2"></div>
                        <div className="w-24 md:w-32 h-1 bg-white/10 rounded-full"></div>
                      </div>
                      <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 md:w-6 md:h-6 text-emerald-400" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 11. WHY CHOOSE GYANHUB */}
        <section className="py-12 md:py-20 bg-slate-50 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="text-center mb-10 md:mb-16">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Why choose GyanHub?</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {[
              { title: "Nepal-Focused Platform", desc: "Built specifically for the educational landscape and syllabus of Nepal." },
              { title: "Strictly Verified Tutors", desc: "Every tutor undergoes ID and qualification verification before teaching." },
              { title: "Live & Recorded Options", desc: "Learn interactively in live classes or at your own pace with recordings." },
              { title: "Practical, Career-Led Training", desc: "We focus on software and skills (AutoCAD, GIS, Excel) that get you hired." },
              { title: "Secure Tuition Marketplace", desc: "Post a request and get matched securely without sharing personal contact info publicly." },
              { title: "Verifiable Achievements", desc: "Digital certificates that employers can verify with one click." }
            ].map((feature, i) => (
              <div key={i} className="flex items-start gap-3 sm:gap-4 p-2 sm:p-4 bg-white sm:bg-transparent rounded-2xl sm:rounded-none shadow-sm sm:shadow-none border sm:border-none border-slate-100">
                <div className="mt-1 flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-blue-100 flex items-center justify-center"><CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600"/></div>
                <div>
                  <h4 className="text-base sm:text-lg font-bold text-slate-900">{feature.title}</h4>
                  <p className="text-xs sm:text-sm font-medium text-slate-600 mt-1.5 sm:mt-2 leading-relaxed">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 12. FINAL CTA */}
        <section className="py-14 md:py-24 max-w-6xl mx-auto px-3 sm:px-6">
          <div className="bg-slate-900 rounded-[32px] sm:rounded-[40px] p-8 sm:p-16 text-center text-white relative overflow-hidden shadow-2xl">
            <div className="absolute top-[-50%] left-[-10%] w-[100%] h-[200%] bg-blue-500/20 rotate-12 blur-3xl"></div>
            <div className="absolute bottom-[-30%] right-[-10%] w-[50%] h-[150%] bg-orange-500/10 -rotate-12 blur-3xl"></div>
            
            <div className="relative z-10">
              <h2 className="text-3xl sm:text-5xl font-extrabold mb-4 sm:mb-6 tracking-tight text-white">Ready to start learning?</h2>
              <p className="text-slate-400 text-sm sm:text-lg font-medium max-w-2xl mx-auto mb-8 sm:mb-10">
                Join thousands of students and professionals in Nepal upgrading their skills on GyanHub.
              </p>
              
              <div className="flex flex-col sm:flex-row justify-center items-center gap-3 sm:gap-4">
                <Link 
                  href="/onlinecourse" 
                  style={{ color: '#0f172a' }}
                  className="w-full sm:w-auto justify-center bg-white px-6 sm:px-8 py-3.5 sm:py-4 rounded-2xl font-bold shadow-lg hover:bg-slate-50 hover:scale-[1.02] transition-all flex items-center gap-2 text-sm sm:text-base"
                >
                  <MonitorPlay className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600"/> <span style={{ color: '#0f172a' }}>Live Classes</span>
                </Link>
                
                <Link 
                  href="/recording" 
                  className="w-full sm:w-auto justify-center bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 sm:px-8 py-3.5 sm:py-4 rounded-2xl font-bold shadow-lg hover:shadow-orange-500/25 hover:from-orange-400 hover:to-orange-500 hover:scale-[1.02] transition-all flex items-center gap-2 text-sm sm:text-base"
                >
                  <PlayCircle className="w-4 h-4 sm:w-5 sm:h-5 text-white"/> <span className="text-white">Recordings</span>
                </Link>
                
                <Link 
                  href="/tutors" 
                  className="w-full sm:w-auto justify-center bg-slate-800 border border-slate-700 text-white px-6 sm:px-8 py-3.5 sm:py-4 rounded-2xl font-bold shadow-lg hover:bg-slate-700 hover:border-slate-500 hover:scale-[1.02] transition-all flex items-center gap-2 text-sm sm:text-base"
                >
                  <Users className="w-4 h-4 sm:w-5 sm:h-5 text-slate-300"/> <span className="text-white">Find Tutors</span>
                </Link>
              </div>
            </div>
          </div>
        </section>

      </div>

      {/* RENDER MODAL HERE */}
      <AnimatePresence>
        {selectedBundle && renderBundleModal()}
      </AnimatePresence>

      {/* Mobile FAB */}
      <div className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-[90] xl:hidden flex flex-col items-end">
        <AnimatePresence>
          {isFabOpen && (
            <motion.div initial={{ opacity: 0, y: 20, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.9 }} transition={{ duration: 0.2 }} className="flex flex-col gap-2.5 sm:gap-3 mb-3 sm:mb-4 items-end">
              <Link href="/tutors" onClick={() => setIsFabOpen(false)} className="flex items-center gap-3 bg-slate-900 text-white px-4 sm:px-5 py-3 sm:py-3.5 rounded-2xl font-bold shadow-lg sm:shadow-xl active:scale-95 transition-transform text-xs sm:text-sm"><span className="text-white">Find Tutors</span> <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" /></Link>
              <Link href="/post-tuition" onClick={() => setIsFabOpen(false)} className="flex items-center gap-3 bg-blue-600 text-white px-4 sm:px-5 py-3 sm:py-3.5 rounded-2xl font-bold shadow-lg sm:shadow-xl active:scale-95 transition-transform text-xs sm:text-sm"><span className="text-white">Post Request</span> <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" /></Link>
              <Link href="/onlinecourse" onClick={() => setIsFabOpen(false)} className="flex items-center gap-3 bg-white text-slate-900 border border-slate-200 px-4 sm:px-5 py-3 sm:py-3.5 rounded-2xl font-bold shadow-lg sm:shadow-xl active:scale-95 transition-transform text-xs sm:text-sm"><span className="text-slate-900">Online Courses</span> <MonitorPlay className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600" /></Link>
              <Link href="/recording" onClick={() => setIsFabOpen(false)} className="flex items-center gap-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 sm:px-5 py-3 sm:py-3.5 rounded-2xl font-bold shadow-lg sm:shadow-xl active:scale-95 transition-transform text-xs sm:text-sm"><span className="text-white">Recording Courses</span> <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" /></Link>
            </motion.div>
          )}
        </AnimatePresence>
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => setIsFabOpen(!isFabOpen)} aria-label="Toggle mobile menu" aria-expanded={isFabOpen} className={`flex h-14 w-14 md:h-16 md:w-16 items-center justify-center rounded-full shadow-[0_8px_20px_rgba(37,99,235,0.3)] text-white transition-colors duration-300 ${isFabOpen ? "bg-slate-900" : "bg-blue-600"}`}>
          <Plus className={`h-6 w-6 md:h-7 md:w-7 text-white transition-transform duration-300 ${isFabOpen ? "rotate-45" : ""}`} />
        </motion.button>
      </div>
      <AnimatePresence>
        {isFabOpen && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsFabOpen(false)} aria-hidden="true" className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-[80] xl:hidden" />}
      </AnimatePresence>
    </main>
  );
}

// Sub-Component for Modal
function Stat({ icon, value, label }: any) {
  return (
    <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 text-center shadow-sm">
      <div className="w-5 h-5 sm:w-6 sm:h-6 mx-auto text-blue-600 mb-1.5 sm:mb-2">{icon}</div>
      <div className="text-lg sm:text-2xl font-black text-slate-900">{value}</div>
      <div className="text-[9px] sm:text-xs font-bold text-slate-500 uppercase mt-0.5 sm:mt-0">{label}</div>
    </div>
  );
}