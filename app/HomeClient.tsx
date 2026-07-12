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
  Flame, X, MonitorPlay, ShieldCheck, BadgeCheck, History, MapPin,
  CheckCircle, Star, Award, Layers, PlayCircle, Package, Layers3, CheckCircle2,
  Calendar, Briefcase, ChevronRight, TrendingUp, Navigation, Tag, XCircle,
  ArrowLeft, MessageSquare
} from "lucide-react";

/* ============================================================
   BRAND TOKENS
   Primary Blue   #1E3A8A  -> tailwind blue-900 (trust / headings / dark CTAs)
   Secondary Blue #2563EB  -> tailwind blue-600 (interactive / links / info)
   Accent Orange  #F97316  -> tailwind orange-500 (CTAs, badges, highlights ONLY)
   Accent Teal    #10B981  -> tailwind emerald-500 (physical / success / active / location)
   Light BG       #F8FAFC  -> tailwind slate-50
   Dark Surface   #0F172A  -> tailwind slate-900
   ============================================================ */

/* ============================================================
   INTERFACES
   ============================================================ */
interface CoursePromo {
  id: number | string;
  title: string;
  fee: number;
  discount: number;
  original_fee: number;
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

type PhysicalClassStatus = "upcoming" | "ongoing" | "completed" | "cancelled";

/** Maps 1:1 to public.physicalcourses */
interface PhysicalClass {
  id: string;
  title: string;
  course_code: string | null;
  course_image_url: string | null;
  instructor_image_url: string | null;
  category: string;
  description: string | null;
  learning_outcomes: any;
  instructor_name: string | null;
  location: string | null;
  start_date: string | null;
  timing: string | null;
  duration_weeks: number | null;
  price: number | string | null;
  discount_price: number | string | null;
  max_seats: number | null;
  enrolled_count: number | null;
  status: PhysicalClassStatus | null;
  is_active: boolean;
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

/* ============================================================
   HARDCODED BUNDLES — theory + physical practical bridge
   ============================================================ */
const BUNDLES: BundlePackage[] = [
  {
    id: "architectural-design-bundle",
    title: "Architectural Design",
    description:
      "Online theory plus hands-on Baneshwor practical sessions covering drafting, 3D modeling, BIM, rendering, and presentation.",
    courses: [
      "AutoCAD Basic to Advanced Course",
      "Autodesk Revit",
      "Architectural Visualization: AutoCAD, SketchUp, Enscape & Photoshop",
    ],
    price: 5555,
    originalPrice: 10000,
    badge: "🏛️ Best for Architects",
    highlight: "Online theory + Physical practical",
    targetAudience: ["Architecture Students", "Draftmen", "Interior Designers", "Freelance Visualizers"],
    careerPath: ["2D Drafting", "BIM Modeling", "3D Visualization", "Job Ready Architect"],
  },
  {
    id: "civil-engineering-bundle",
    title: "Civil Engineering",
    description:
      "Bridges online theory with physical practical training in Baneshwor — design, costing, billing, and valuation workflows.",
    courses: [
      "Structural Design and Analysis",
      "Estimation, Costing & Contract Billing",
      "Property Valuation",
    ],
    price: 5555,
    originalPrice: 8000,
    badge: "🏗️ Civil Bestseller",
    highlight: "Online theory + Physical practical",
    targetAudience: ["Civil Engineering Students", "Site Engineers", "Consultants", "Contractors"],
    careerPath: ["Structural Analysis", "Cost Estimation", "Site Billing", "Valuation Expert"],
  },
  {
    id: "complete-engineering-package",
    title: "Complete Engineering Package",
    description:
      "The ultimate all-in-one package bridging online theory and physical practical training in Baneshwor — architectural, civil, and GIS skills.",
    courses: [
      "AutoCAD Basic to Advanced Course",
      "Autodesk Revit",
      "Architectural Visualization: AutoCAD, SketchUp, Enscape & Photoshop",
      "Structural Design and Analysis",
      "Estimation, Costing & Contract Billing",
      "Property Valuation",
      "ArcGIS and Mapping",
    ],
    price: 9999,
    originalPrice: 20000,
    badge: "🚀 Ultimate Value",
    highlight: "The complete career accelerator (7 Courses)",
    isFeatured: true,
    targetAudience: ["Engineering Freshers", "Multi-disciplinary Consultants", "Firm Owners", "Master's Students"],
    careerPath: ["Drafting & BIM", "Structural Design", "Costing & Valuation", "GIS & Final Delivery"],
  },
];

const LOCATION = {
  label: "Physical Classes: Near Eyeplex Mall, New Baneshwor, Kathmandu",
  mapsUrl: "https://maps.app.goo.gl/5ejsLX3YUsPtJjgQ9",
};

/* ============================================================
   HELPERS
   ============================================================ */
const formatCurrency = (amount: number | string | null | undefined) => {
  const num = Number(amount) || 0;
  return new Intl.NumberFormat("en-NP", { style: "currency", currency: "NPR", maximumFractionDigits: 0 }).format(num);
};
const calculateOriginalPrice = (discountedFee: number | string, discountPercent: number | null | undefined) => {
  const fee = Number(discountedFee) || 0;
  const discount = Number(discountPercent) || 0;
  if (discount === 0 || discount >= 100) return fee;
  return Math.round(fee / (1 - discount / 100));
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
  return desc.split("\n").map((line) => line.replace(/✔️|✔/g, "").trim()).filter(Boolean);
};
const formatDurationWeeks = (weeks?: number | null) => {
  if (!weeks || weeks <= 0) return null;
  return `${weeks} Week${weeks === 1 ? "" : "s"}`;
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

/** Derives a status when the DB doesn't have one set explicitly, from start_date */
const resolveStatus = (row: PhysicalClass): PhysicalClassStatus => {
  if (row.status) return row.status;
  if (!row.start_date) return "upcoming";
  const start = new Date(row.start_date).getTime();
  const now = Date.now();
  const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;
  if (start > now) return "upcoming";
  if (start <= now && start + THIRTY_DAYS > now) return "ongoing";
  return "completed";
};

const remainingSeats = (row: PhysicalClass): number | null => {
  if (row.max_seats === null || row.max_seats === undefined) return null;
  const enrolled = row.enrolled_count ?? 0;
  return Math.max(row.max_seats - enrolled, 0);
};

const STATUS_STYLES: Record<PhysicalClassStatus, { label: string; className: string; icon: React.ReactNode }> = {
  upcoming: { label: "Upcoming", className: "bg-blue-50 text-blue-700 border border-blue-200", icon: <Calendar className="w-3 h-3" /> },
  ongoing: { label: "Ongoing", className: "bg-emerald-50 text-emerald-700 border border-emerald-200", icon: <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" /><span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" /></span> },
  completed: { label: "Completed", className: "bg-slate-100 text-slate-500 border border-slate-200", icon: <CheckCircle2 className="w-3 h-3" /> },
  cancelled: { label: "Cancelled", className: "bg-red-50 text-red-600 border border-red-200", icon: <XCircle className="w-3 h-3" /> },
};

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

/* ============================================================
   PROFESSIONAL TRAINING CARD — backed by public.physicalcourses
   ============================================================ */
function PhysicalClassCard({ item, scrollY, index }: { item: PhysicalClass; scrollY: any; index: number }) {
  const y = useTransform(scrollY, [0, 1000], [0, index % 2 === 0 ? -24 : 24]);
  const status = resolveStatus(item);
  const seatsLeft = remainingSeats(item);
  const isLimited = seatsLeft !== null && seatsLeft > 0 && seatsLeft <= 5;
  const isFull = seatsLeft === 0;
  const hasDiscount = item.discount_price !== null && item.discount_price !== undefined && Number(item.discount_price) > 0 && Number(item.discount_price) < Number(item.price);

  return (
    <div className="group flex flex-col bg-white rounded-[28px] border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl hover:border-blue-200 transition-all duration-300">
      <div className="relative h-40 sm:h-48 bg-slate-100 overflow-hidden">
        {item.course_image_url ? (
          <motion.div style={{ y }} className="absolute inset-0">
            <Image src={item.course_image_url} alt={item.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
          </motion.div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-slate-300 bg-gradient-to-br from-slate-50 to-slate-100">
            <Award className="w-10 h-10 sm:w-12 sm:h-12" />
          </div>
        )}

        {/* Status badge */}
        <div className={`absolute top-3 left-3 text-[9px] sm:text-[10px] font-black uppercase px-2.5 py-1 rounded-full flex items-center gap-1.5 backdrop-blur-md ${STATUS_STYLES[status].className}`}>
          {STATUS_STYLES[status].icon} {STATUS_STYLES[status].label}
        </div>

        {/* Limited seats badge — brand orange, CTA/urgency only */}
        {isLimited && (
          <div className="absolute top-3 right-3 bg-orange-500 text-white text-[9px] sm:text-[10px] font-black uppercase px-2.5 py-1 rounded-full flex items-center gap-1 shadow-md">
            <Flame className="w-3 h-3" /> {seatsLeft} seat{seatsLeft === 1 ? "" : "s"} left
          </div>
        )}
        {isFull && (
          <div className="absolute top-3 right-3 bg-slate-800 text-white text-[9px] sm:text-[10px] font-black uppercase px-2.5 py-1 rounded-full">
            Full
          </div>
        )}
      </div>

      <div className="p-4 sm:p-5 flex flex-col flex-grow">
        <h3 className="font-bold text-slate-900 text-base sm:text-lg mb-1.5 line-clamp-2">{item.title}</h3>
        {item.description && (
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed line-clamp-2 mb-3">{item.description}</p>
        )}

        <div className="text-[11px] sm:text-xs font-medium text-slate-500 flex flex-col gap-1.5 sm:gap-2 mb-4 mt-auto">
          <div className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500 shrink-0" />
            <span className="truncate">{item.location || "New Baneshwor, Kathmandu"}</span>
          </div>
          {item.start_date && (
            <div className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600 shrink-0" />
              <span className="truncate">Starts {formatDateString(item.start_date)}</span>
            </div>
          )}
          {item.timing && (
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-500 shrink-0" />
              <span className="truncate">{item.timing}</span>
            </div>
          )}
          {formatDurationWeeks(item.duration_weeks) && (
            <div className="flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600 shrink-0" />
              <span className="truncate">{formatDurationWeeks(item.duration_weeks)}</span>
            </div>
          )}
          {item.instructor_name && (
            <div className="flex items-center gap-2">
              {item.instructor_image_url ? (
                <span className="relative w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full overflow-hidden shrink-0 bg-slate-200">
                  <Image src={item.instructor_image_url} alt={item.instructor_name} fill className="object-cover" />
                </span>
              ) : (
                <GraduationCap className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600 shrink-0" />
              )}
              <span className="truncate">Instructor: {item.instructor_name}</span>
            </div>
          )}
          {seatsLeft !== null && (
            <div className="flex items-center gap-2">
              <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 shrink-0" />
              <span className="truncate">{seatsLeft} seat{seatsLeft === 1 ? "" : "s"} remaining of {item.max_seats}</span>
            </div>
          )}
        </div>

        {/* Price row */}
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <div className="flex items-baseline gap-2">
            <span className="font-black text-base sm:text-lg text-slate-900">
              {formatCurrency(hasDiscount ? item.discount_price : item.price)}
            </span>
            {hasDiscount && (
              <span className="text-[10px] sm:text-xs font-medium line-through text-slate-400">{formatCurrency(item.price)}</span>
            )}
          </div>
          {hasDiscount && (
            <span className="inline-flex items-center gap-1 text-[9px] sm:text-[10px] font-black uppercase px-2 py-1 rounded-full bg-orange-50 text-orange-600 border border-orange-200">
              <Tag className="w-3 h-3" /> Discount
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 pt-3 sm:pt-4 border-t border-slate-100">
          <Link
            href={`/offline-class/${encodeURIComponent(item.course_code || item.id)}`}
            className="flex-1 text-center text-xs sm:text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl py-2.5 transition-colors shadow-sm"
          >
            View Details
          </Link>
          <Link
            href={isFull ? "#" : `/offline-class?type=physical&classId=${encodeURIComponent(item.id)}`}
            aria-disabled={isFull}
            className={`flex items-center justify-center gap-1 text-xs sm:text-sm font-bold rounded-xl py-2.5 px-3 transition-all shrink-0 shadow-sm ${
              isFull
                ? "bg-slate-100 text-slate-400 cursor-not-allowed pointer-events-none"
                : "bg-orange-500 hover:bg-orange-600 text-white hover:shadow-md hover:-translate-y-0.5"
            }`}
          >
            Enroll Now
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   MAIN COMPONENT
   ============================================================ */
export default function HomeClient() {
  const router = useRouter();
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();

  const [promoCourses, setPromoCourses] = useState<CoursePromo[]>([]);
  const [recordings, setRecordings] = useState<RecordingCourse[]>([]);
  const [physicalClasses, setPhysicalClasses] = useState<PhysicalClass[]>([]);
  const [certificateCount, setCertificateCount] = useState<number>(2000);
  const [showCompleted, setShowCompleted] = useState(false);

  const [search, setSearch] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isFabOpen, setIsFabOpen] = useState(false);

  const [showPromoPopup, setShowPromoPopup] = useState(false);
  const [popupView, setPopupView] = useState<"home" | "online" | "physical" | "recordings">("home");
  const [selectedBundle, setSelectedBundle] = useState<BundlePackage | null>(null);

  useEffect(() => {
    document.body.style.overflow = selectedBundle || showPromoPopup ? "hidden" : "unset";
    return () => { document.body.style.overflow = "unset"; };
  }, [selectedBundle, showPromoPopup]);

  /* ---- DATA FETCH ---- */
  useEffect(() => {
    let isMounted = true;
    const fetchHomeData = async () => {
      setLoading(true);
      try {
        const [recordingsRes, certRes, coursesRes, physicalClassesRes] = await Promise.all([
          supabase.from("recordings").select("*").eq("is_active", true).order("created_at", { ascending: false }),
          supabase.from("certificates").select("*", { count: "exact", head: true }),
          supabase.from("online_courses_v2").select("*").eq("is_active", true).limit(4),
          // Professional Training Hub — sourced directly from physicalcourses
          supabase
            .from("physicalcourses")
            .select("*")
            .eq("category", "Professional Training")
            .eq("is_active", true)
            .order("start_date", { ascending: true }),
        ]);
        if (!isMounted) return;

        if (recordingsRes.data) setRecordings(recordingsRes.data as RecordingCourse[]);
        if (certRes.count !== null) setCertificateCount(certRes.count);

        if (physicalClassesRes.data) {
          setPhysicalClasses(physicalClassesRes.data as PhysicalClass[]);
        }
        if (physicalClassesRes.error) {
          console.error("Professional Training fetch error:", physicalClassesRes.error);
        }

        if (coursesRes.data && coursesRes.data.length > 0) {
          const syllabusIds = coursesRes.data.map((c: any) => c.syllabus_id);
          const [onlineSyllabiRes, batchesRes] = await Promise.all([
            supabase.from("syllabi_v2").select("id, cover_pic, duration, course_code").in("id", syllabusIds),
            supabase.from("course_batches_v2").select("syllabus_id, batch_no, start_datetime, timing").in("syllabus_id", syllabusIds),
          ]);
          const mappedCourses: CoursePromo[] = coursesRes.data.map((course: any) => {
            const syllabus = onlineSyllabiRes.data?.find((s: any) => s.id === course.syllabus_id);
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
              course_code: syllabus?.course_code || undefined,
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
    // Show AI assistant popup after 1.5 seconds if not seen
    const hasSeenPromo = sessionStorage.getItem("has_seen_home_promo");
    if (!hasSeenPromo) {
      const timer = setTimeout(() => setShowPromoPopup(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const closePromoPopup = () => {
    setShowPromoPopup(false);
    sessionStorage.setItem("has_seen_home_promo", "true");
    setTimeout(() => setPopupView("home"), 300); // reset state after closing animation
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

  /* ---- Professional Training: sort + filter (upcoming -> ongoing -> completed hidden by default) ---- */
  const sortedPhysicalClasses = useMemo(() => {
    const withStatus = physicalClasses.map((c) => ({ ...c, _status: resolveStatus(c) }));
    const rank: Record<PhysicalClassStatus, number> = { upcoming: 0, ongoing: 1, cancelled: 2, completed: 3 };
    const visible = withStatus.filter((c) => showCompleted || c._status !== "completed");
    return visible.sort((a, b) => {
      const rankDiff = rank[a._status] - rank[b._status];
      if (rankDiff !== 0) return rankDiff;
      const aTime = a.start_date ? new Date(a.start_date).getTime() : Infinity;
      const bTime = b.start_date ? new Date(b.start_date).getTime() : Infinity;
      return aTime - bTime;
    });
  }, [physicalClasses, showCompleted]);

  const totalRemainingSeats = useMemo(() => {
    return physicalClasses.reduce((sum, c) => {
      const r = remainingSeats(c);
      return sum + (r ?? 0);
    }, 0);
  }, [physicalClasses]);

  /* ---- Bundle Modal ---- */
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
        outcomes: features.length > 0 ? features.slice(0, 3) : ["Practical workflows", "Real-world project application", "Industry standard techniques"],
      };
    });
    const totalBundleHours = bundleCoursesData.reduce((sum, c) => sum + c.hoursNum, 0);

    return (
      <div className="fixed inset-0 z-[300] flex items-start justify-center overflow-y-auto bg-slate-900/70 backdrop-blur-sm p-4 sm:p-6">
        <div className="fixed inset-0" onClick={() => setSelectedBundle(null)} />
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 16 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl my-auto flex flex-col overflow-hidden z-10"
        >
          <button onClick={() => setSelectedBundle(null)} className="absolute top-4 right-4 z-20 bg-black/20 hover:bg-black/40 transition-colors text-white p-2 rounded-full backdrop-blur-md">
            <X className="w-5 h-5" />
          </button>
          <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-950 text-white p-6 md:p-10 relative overflow-hidden shrink-0">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/20 rounded-full blur-[80px]" />
            <div className="relative z-10">
              <span className="inline-flex rounded-full px-3 py-1 text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 mb-4">{selectedBundle.badge}</span>
              <h2 className="text-2xl sm:text-4xl font-extrabold mb-2 text-white">{selectedBundle.title} Package</h2>
              <p className="text-blue-200 text-base sm:text-xl font-medium mb-6">{selectedBundle.courses.length} Industry-Ready Courses to Accelerate Your Career.</p>
              <div className="flex flex-wrap items-center gap-4 mb-8">
                <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-full">
                  <Star className="w-4 h-4 fill-orange-400 text-orange-400" />
                  <span className="text-sm font-bold text-white">4.8 Rating</span>
                </div>
                <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-full">
                  <Users className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm font-bold text-white">1,500+ Learners</span>
                </div>
              </div>
              <div className="bg-white/10 border border-white/20 rounded-2xl p-4 md:p-5 flex flex-col sm:flex-row items-center justify-between gap-5">
                <div>
                  <div className="text-sm text-slate-300 font-medium mb-1">Bundle Pricing</div>
                  <div className="flex items-baseline gap-3">
                    <span className="text-3xl sm:text-4xl font-black text-white">{formatCurrency(selectedBundle.price)}</span>
                    <span className="text-base sm:text-lg line-through text-slate-400">{formatCurrency(selectedBundle.originalPrice)}</span>
                  </div>
                  <div className="text-emerald-400 font-bold text-sm mt-1">You Save {savePercent}% ({formatCurrency(savings)})</div>
                </div>
                <Link
                  href={`/order?type=recording&courseName=${encodeURIComponent(selectedBundle.title + " Bundle")}&price=${selectedBundle.price}`}
                  onClick={() => setSelectedBundle(null)}
                  className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600 text-white font-bold py-3.5 px-8 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-md hover:shadow-lg hover:-translate-y-0.5"
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
              <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2"><Briefcase className="w-5 h-5 text-blue-600" /> The Career Path</h3>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200">
                {selectedBundle.careerPath.map((step, idx) => (
                  <React.Fragment key={idx}>
                    <div className="text-sm font-bold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-lg">{step}</div>
                    {idx < selectedBundle.careerPath.length - 1 && <ChevronRight className="w-4 h-4 text-slate-400 hidden sm:block" />}
                  </React.Fragment>
                ))}
              </div>
            </div>
            <div className="grid md:grid-cols-3 gap-6 md:gap-8 mb-10 md:mb-12">
              <div className="bg-white p-5 md:p-6 rounded-2xl border border-slate-200">
                <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2"><GraduationCap className="w-5 h-5 text-blue-600" /> Perfect For</h3>
                <ul className="space-y-3">
                  {selectedBundle.targetAudience.map((audience) => (
                    <li key={audience} className="flex items-start gap-2 text-sm text-slate-600 font-medium">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" /> {audience}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="md:col-span-2 bg-white p-5 md:p-6 rounded-2xl border border-slate-200">
                <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-blue-600" /> Bundle Benefits</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  {[`Lifetime access to all ${selectedBundle.courses.length} courses`, "Real-world project-based learning", "Learn at your own pace anytime", "Individual certificates for each course"].map((item) => (
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
                <div key={course.name} className="bg-white border border-slate-200 rounded-2xl p-4 md:p-5 flex flex-col sm:flex-row gap-4 md:gap-5">
                  <div className="bg-slate-50 p-3 md:p-4 rounded-xl h-fit w-fit"><PlayCircle className="w-6 h-6 text-blue-600" /></div>
                  <div className="flex-grow">
                    <h4 className="font-bold text-base md:text-lg text-slate-900 mb-1">{course.name}</h4>
                    {course.hoursStr && <div className="text-xs font-bold text-blue-700 bg-blue-50 inline-block px-2 py-1 rounded mb-3">{course.hoursStr}h Content</div>}
                    <ul className="space-y-1.5">
                      {course.outcomes.map((outcome: string) => (
                        <li key={outcome} className="flex items-start gap-2 text-xs md:text-sm text-slate-600">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" /> {outcome}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <Link href={`/recording/${encodeURIComponent(course.name)}`} onClick={() => setSelectedBundle(null)} className="text-sm font-bold text-blue-600 hover:underline flex items-center gap-1 shrink-0 h-fit mt-2 sm:mt-0">
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
                <span className="text-2xl font-black text-slate-900">{formatCurrency(selectedBundle.price)}</span>
                <span className="text-sm line-through text-slate-400">{formatCurrency(selectedBundle.originalPrice)}</span>
              </div>
            </div>
            <Link
              href={`/order?type=recording&courseName=${encodeURIComponent(selectedBundle.title + " Bundle")}&price=${selectedBundle.price}`}
              onClick={() => { document.body.style.overflow = "unset"; }}
              className="w-full sm:w-auto bg-blue-900 hover:bg-blue-950 text-white font-semibold py-2.5 px-6 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
              style={{ textDecoration: "none", color: "#ffffff" }}
            >
              Start Learning Today <ArrowRight className="w-4 h-4 text-white" />
            </Link>
          </div>
        </motion.div>
      </div>
    );
  };

  return (
    <main className="min-h-screen bg-[#F8FAFC] selection:bg-blue-100 selection:text-blue-900 text-slate-900 font-sans flex flex-col relative overflow-x-hidden">
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-blue-400/10 blur-[120px]" />
        <div className="absolute top-[20%] right-[-10%] w-[40vw] h-[40vw] rounded-full bg-emerald-400/10 blur-[120px]" />
      </div>

      {/* MULTI-STEP AI PROMO POPUP */}
      <AnimatePresence>
        {showPromoPopup && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={closePromoPopup} className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-sm sm:max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden z-10 flex flex-col border border-slate-100 max-h-[85vh]">
              
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0 bg-white z-20">
                {popupView !== "home" ? (
                  <button onClick={() => setPopupView("home")} className="flex items-center gap-1.5 text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors">
                    <ArrowLeft className="w-4 h-4" /> Back
                  </button>
                ) : (
                  <span className="font-extrabold text-slate-800 flex items-center gap-2 text-base">🤖 GyanHub AI Assistant</span>
                )}
                <button onClick={closePromoPopup} className="p-1.5 bg-slate-100 text-slate-500 rounded-full hover:bg-slate-200 transition-colors"><X className="w-4 h-4" /></button>
              </div>

              {/* Body */}
              <div className="p-5 overflow-y-auto bg-slate-50/50 flex-grow scrollbar-thin scrollbar-thumb-slate-200">
                
                {popupView === "home" && (
                  <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col gap-3">
                    <p className="text-slate-600 font-medium mb-2 text-sm sm:text-base leading-relaxed">
                      Hello! I'm the AI Assistant of GyanHub. <br/>What do you want today?
                    </p>
                    <button onClick={() => setPopupView("online")} className="w-full bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-200 text-slate-800 font-bold py-4 px-5 rounded-2xl flex items-center justify-between transition-all shadow-sm">
                      <span className="flex items-center gap-3"><MonitorPlay className="w-5 h-5 text-blue-600"/> Online Courses</span>
                      <ChevronRight className="w-5 h-5 text-blue-400" />
                    </button>
                    <button onClick={() => setPopupView("physical")} className="w-full bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-200 text-slate-800 font-bold py-4 px-5 rounded-2xl flex items-center justify-between transition-all shadow-sm">
                      <span className="flex items-center gap-3"><MapPin className="w-5 h-5 text-emerald-600"/> Physical Classes</span>
                      <ChevronRight className="w-5 h-5 text-emerald-400" />
                    </button>
                    <button onClick={() => setPopupView("recordings")} className="w-full bg-white hover:bg-orange-50 border border-slate-200 hover:border-orange-200 text-slate-800 font-bold py-4 px-5 rounded-2xl flex items-center justify-between transition-all shadow-sm">
                      <span className="flex items-center gap-3"><Play className="w-5 h-5 text-orange-600"/> Recordings</span>
                      <ChevronRight className="w-5 h-5 text-orange-400" />
                    </button>
                    <button onClick={() => window.open("https://wa.me/9763695665","_blank")} className="w-full bg-white hover:bg-slate-100 border border-slate-200 text-slate-800 font-bold py-4 px-5 rounded-2xl flex items-center justify-between transition-all shadow-sm">
                      <span className="flex items-center gap-3"><MessageSquare className="w-5 h-5 text-slate-500"/> Contact Administration</span>
                      <ChevronRight className="w-5 h-5 text-slate-400" />
                    </button>
                  </motion.div>
                )}

                {popupView === "online" && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col gap-4">
                    {promoCourses.length > 0 ? promoCourses.map(course => (
                      <div key={course.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                        <div className="relative h-32 bg-slate-100">
                          {course.cover_pic ? <Image src={course.cover_pic} alt={course.title} fill className="object-cover" /> : <div className="absolute inset-0 flex items-center justify-center"><MonitorPlay className="w-8 h-8 text-slate-300"/></div>}
                        </div>
                        <div className="p-4 flex flex-col gap-3">
                          <h4 className="font-bold text-slate-900 line-clamp-2 leading-tight">{course.title}</h4>
                          <div className="flex items-baseline gap-2">
                            <span className="font-black text-blue-700 text-lg">{formatCurrency(course.fee)}</span>
                            {!!course.discount && course.discount > 0 && <span className="text-xs font-medium line-through text-slate-400">{formatCurrency(course.original_fee)}</span>}
                          </div>
                          <div className="text-xs font-medium text-slate-600 grid grid-cols-2 gap-2 mt-1">
                            {course.start_date && <div className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-blue-500"/> Starts: {course.start_date}</div>}
                            {course.timing && <div className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-orange-500"/> {course.timing}</div>}
                            {course.duration && <div className="flex items-center gap-1.5 col-span-2"><Layers className="w-3.5 h-3.5 text-emerald-500"/> Duration: {course.duration}</div>}
                          </div>
                          <Link onClick={closePromoPopup} href={`/onlinecourse/${encodeURIComponent(course.course_code || course.title)}`} className="mt-2 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl text-center text-sm transition-colors shadow-sm">VIEW DETAILS</Link>
                        </div>
                      </div>
                    )) : <div className="text-center py-8 text-sm text-slate-500 font-medium">No online courses currently scheduled.</div>}
                  </motion.div>
                )}

                {popupView === "physical" && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col gap-4">
                    {sortedPhysicalClasses.length > 0 ? sortedPhysicalClasses.map(course => {
                      const hasDisc = course.discount_price !== null && course.discount_price !== undefined && Number(course.discount_price) > 0 && Number(course.discount_price) < Number(course.price);
                      return (
                        <div key={course.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                          <div className="relative h-32 bg-slate-100">
                            {course.course_image_url ? <Image src={course.course_image_url} alt={course.title} fill className="object-cover" /> : <div className="absolute inset-0 flex items-center justify-center"><Award className="w-8 h-8 text-slate-300"/></div>}
                          </div>
                          <div className="p-4 flex flex-col gap-3">
                            <h4 className="font-bold text-slate-900 line-clamp-2 leading-tight">{course.title}</h4>
                            <div className="flex items-baseline gap-2">
                              <span className="font-black text-emerald-700 text-lg">{formatCurrency(hasDisc ? course.discount_price : course.price)}</span>
                              {hasDisc && <span className="text-xs font-medium line-through text-slate-400">{formatCurrency(course.price)}</span>}
                            </div>
                            <div className="text-xs font-medium text-slate-600 grid grid-cols-2 gap-2 mt-1">
                              {course.start_date && <div className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-blue-500"/> Starts: {formatDateString(course.start_date)}</div>}
                              {course.timing && <div className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-orange-500"/> {course.timing}</div>}
                              {course.location && <div className="flex items-center gap-1.5 col-span-2"><MapPin className="w-3.5 h-3.5 text-emerald-500"/> {course.location}</div>}
                              {course.duration_weeks && <div className="flex items-center gap-1.5 col-span-2"><Layers className="w-3.5 h-3.5 text-blue-500"/> Duration: {formatDurationWeeks(course.duration_weeks)}</div>}
                            </div>
                            <Link onClick={closePromoPopup} href={`/offline-class/${encodeURIComponent(course.course_code || course.id)}`} className="mt-2 w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-center text-sm transition-colors shadow-sm">VIEW DETAILS</Link>
                          </div>
                        </div>
                      )
                    }) : <div className="text-center py-8 text-sm text-slate-500 font-medium">No physical classes available right now.</div>}
                  </motion.div>
                )}

                {popupView === "recordings" && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col gap-4">
                    {recordings.length > 0 ? recordings.map(course => {
                      const salePrice = calculateRecordingSalePrice(course.standard_fee, course.discount);
                      return (
                        <div key={course.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm flex items-stretch h-28">
                          <div className="relative w-28 shrink-0 bg-slate-900 flex items-center justify-center border-r border-slate-100">
                            {course.cover_pic_url ? (
                              <Image src={course.cover_pic_url} alt={course.course_name} fill className="object-cover opacity-80" />
                            ) : (
                              <Play className="w-8 h-8 text-slate-400" />
                            )}
                          </div>
                          <div className="p-3 flex flex-col flex-grow justify-between min-w-0">
                            <h4 className="font-bold text-slate-900 text-sm line-clamp-2 leading-tight">{course.course_name}</h4>
                            <div className="flex items-center justify-between w-full mt-1">
                               <div className="flex items-baseline gap-1.5">
                                 <span className="font-black text-orange-600 text-sm">{formatCurrency(salePrice)}</span>
                                 {!!course.discount && course.discount > 0 && <span className="text-[10px] font-medium line-through text-slate-400">{formatCurrency(course.standard_fee)}</span>}
                               </div>
                               <Link onClick={closePromoPopup} href={`/recording/${encodeURIComponent(course.course_name)}`} className="bg-orange-500 hover:bg-orange-600 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap shadow-sm">Details</Link>
                            </div>
                            <div className="flex items-center gap-3 text-[10px] font-medium text-slate-500 mt-1">
                               {course.course_hours && <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-slate-400" /> {course.course_hours}+ hrs</span>}
                               <span className="flex items-center gap-1"><Users className="w-3 h-3 text-slate-400" /> {(course.enrolled_students || 0).toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                      )
                    }) : <div className="text-center py-8 text-sm text-slate-500 font-medium">No recordings available.</div>}
                  </motion.div>
                )}

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="relative z-10 mx-auto w-full flex-grow pb-24">
        {/* 1. HERO — Two Pillars */}
        <section className="relative px-3 pt-10 pb-12 md:pt-24 md:pb-32 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-col items-center text-center">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.5 }} className="mb-5 sm:mb-6 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 sm:px-4 py-1.5 text-[11px] sm:text-xs font-bold text-slate-700 shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-orange-500" />
            </span>
            Nepal's Professional Engineering Training Platform
          </motion.div>

          <motion.h1 initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1, duration: 0.6 }} className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight text-slate-900 leading-[1.12] max-w-5xl">
            Learn Online Anywhere.<br />
            Train <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-900 to-orange-500">Physically</span> in Kathmandu.
          </motion.h1>

          <motion.p initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2, duration: 0.6 }} className="mt-4 sm:mt-6 max-w-2xl text-sm sm:text-lg font-medium leading-relaxed text-slate-600 px-2">
            On-demand recorded courses for self-paced learning, plus hands-on Professional Training at our New Baneshwor center — built for engineers who need real skills, not just theory.
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
                placeholder="Search courses, physical classes..."
                className="h-11 sm:h-14 w-full bg-transparent px-3 sm:px-4 text-sm sm:text-lg font-medium outline-none placeholder:text-slate-400 text-slate-800"
              />
              <button onClick={handleSearch} className="h-11 sm:h-12 px-5 sm:px-8 rounded-full bg-blue-900 text-white text-sm sm:text-base font-bold hover:bg-blue-950 transition-colors shrink-0">Search</button>
            </div>
            <AnimatePresence>
              {isSearchFocused && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute top-[calc(100%+12px)] left-2 right-2 sm:left-0 sm:right-0 bg-white border border-slate-200 rounded-3xl shadow-xl overflow-hidden text-left p-2">
                  <p className="px-4 py-2 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400">Quick Links</p>
                  <button onMouseDown={() => router.push("/offline-class")} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 rounded-xl text-sm sm:text-base font-semibold text-slate-700 transition-colors"><MapPin className="w-4 h-4 text-emerald-500" /> Physical Classes</button>
                  <button onMouseDown={() => router.push("/onlinecourse")} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 rounded-xl text-sm sm:text-base font-semibold text-slate-700 transition-colors"><MonitorPlay className="w-4 h-4 text-slate-400" /> Live Online Courses</button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Primary Action Buttons */}
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4, duration: 0.6 }} className="mt-8 flex flex-wrap justify-center gap-2 sm:gap-3 px-2 sm:px-0">
            <Link href="/onlinecourse" className="flex items-center gap-2 rounded-full bg-blue-600 px-5 sm:px-6 py-2.5 sm:py-3 text-[13px] sm:text-sm font-bold text-white shadow-md hover:bg-blue-700 hover:shadow-lg transition-all"><MonitorPlay className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Live Online Courses</Link>
            <Link href="/offline-class" className="flex items-center gap-2 rounded-full bg-emerald-600 px-5 sm:px-6 py-2.5 sm:py-3 text-[13px] sm:text-sm font-bold text-white shadow-md hover:bg-emerald-700 hover:shadow-lg transition-all"><MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Physical Training (Baneshwor)</Link>
            <Link href="/recording" className="flex items-center gap-2 rounded-full bg-white border border-slate-200 px-5 sm:px-6 py-2.5 sm:py-3 text-[13px] sm:text-sm font-bold text-slate-700 shadow-sm hover:shadow-md hover:border-orange-200 transition-all"><Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-500" /> Recordings</Link>
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6, duration: 0.6 }} className="mt-6 flex flex-wrap justify-center items-center gap-4 sm:gap-6 text-[13px] sm:text-sm font-semibold text-slate-500">
            <a href={LOCATION.mapsUrl} target="_blank" rel="noopener noreferrer" className="hover:text-emerald-600 transition-colors flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500" /> {LOCATION.label}
            </a>
            <span className="hidden sm:block w-1 h-1 rounded-full bg-slate-300" />
            <Link href="/certificate" className="hover:text-blue-700 transition-colors flex items-center gap-1">Verify Certificate <BadgeCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" /></Link>
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
                <p className="text-2xl sm:text-4xl font-black text-slate-900">{totalRemainingSeats || 50}+</p>
                <p className="text-[9px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider mt-1 sm:mt-2">Physical Class Slots</p>
              </div>
              <div className="flex flex-col items-center justify-center">
                <p className="text-2xl sm:text-4xl font-black text-slate-900">{certificateCount}+</p>
                <p className="text-[9px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider mt-1 sm:mt-2">Certificates Issued</p>
              </div>
            </div>
          </div>
        </section>

        {/* 3. PROFESSIONAL TRAINING HUB — live from physicalcourses */}
        <section className="py-12 md:py-20 bg-white border-y border-slate-200/60 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 md:mb-10">
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 flex items-center gap-2 sm:gap-3">
                <Award className="w-6 h-6 sm:w-8 sm:h-8 text-emerald-600" /> Professional Training Hub
              </h2>
              <p className="mt-1 sm:mt-2 text-sm sm:text-base text-slate-600 font-medium">Hands-on physical sessions at our New Baneshwor center.</p>
            </div>
            <div className="flex items-center gap-3">
              {physicalClasses.some((c) => resolveStatus(c) === "completed") && (
                <button
                  onClick={() => setShowCompleted((v) => !v)}
                  className="text-xs sm:text-sm font-bold text-slate-500 hover:text-slate-700 border border-slate-200 rounded-full px-4 py-2 transition-colors"
                >
                  {showCompleted ? "Hide completed" : "Show completed"}
                </button>
              )}
              <Link href="/offline-class" className="hidden sm:flex text-sm font-bold text-emerald-600 hover:text-emerald-700 items-center gap-1 shrink-0">View All <ArrowRight className="w-4 h-4" /></Link>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {loading ? (
              Array(4).fill(0).map((_, i) => <SkeletonCard key={i} />)
            ) : sortedPhysicalClasses.length > 0 ? (
              sortedPhysicalClasses.slice(0, 4).map((item, i) => <PhysicalClassCard key={item.id} item={item} scrollY={scrollY} index={i} />)
            ) : (
              <div className="col-span-full py-14 text-center bg-slate-50 rounded-[28px] border border-dashed border-slate-200">
                <Calendar className="w-9 h-9 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-700 font-bold">No Professional Training sessions are currently available.</p>
                <p className="text-slate-500 text-sm mt-1">New batches will be announced soon.</p>
              </div>
            )}
          </div>
          <Link href="/offline-class" className="mt-6 sm:hidden flex justify-center text-sm font-bold text-emerald-600 border border-emerald-100 bg-emerald-50 py-3 rounded-xl items-center gap-1">View All Physical Training <ArrowRight className="w-4 h-4" /></Link>
        </section>

        {/* 4. FEATURED LIVE ONLINE COURSES */}
        <section className="py-12 md:py-20 bg-slate-50 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-8 md:mb-10">
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 flex items-center gap-2 sm:gap-3"><MonitorPlay className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" /> Live Online Courses</h2>
              <p className="mt-1 sm:mt-2 text-sm sm:text-base text-slate-600 font-medium">Interactive sessions ready for enrollment.</p>
            </div>
            <Link href="/onlinecourse" className="hidden sm:flex text-sm font-bold text-blue-600 hover:text-blue-700 items-center gap-1">View All <ArrowRight className="w-4 h-4" /></Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {loading ? Array(4).fill(0).map((_, i) => <SkeletonCard key={i} />) : promoCourses.length > 0 ? promoCourses.map((course) => (
              <Link key={course.id} href={`/onlinecourse/${encodeURIComponent(course.course_code || course.title)}`} className="group flex flex-col bg-white rounded-[28px] border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl hover:border-blue-200 transition-all duration-300">
                <div className="relative h-40 sm:h-48 bg-slate-100 overflow-hidden">
                  {course.cover_pic ? (
                    <Image src={course.cover_pic} alt={course.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-slate-300"><MonitorPlay className="w-10 h-10 sm:w-12 sm:h-12" /></div>
                  )}
                  <div className="absolute top-3 left-3 bg-blue-700 text-white text-[9px] sm:text-[10px] font-black uppercase px-2 py-1 rounded-md flex items-center gap-1"><Flame className="w-3 h-3" /> Active</div>
                </div>
                <div className="p-4 sm:p-5 flex flex-col flex-grow">
                  <h3 className="font-bold text-slate-900 text-base sm:text-lg mb-3 sm:mb-4 line-clamp-2">{course.title}</h3>
                  <div className="text-[11px] sm:text-xs font-medium text-slate-500 flex flex-col gap-1.5 sm:gap-2 mb-4 mt-auto">
                    <div className="flex items-center gap-2"><Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600" /><span className="truncate">{course.start_date ? `Starts: ${course.start_date}` : "Enrollment Open"}</span></div>
                    {course.duration && <div className="flex items-center gap-2"><Layers className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600" /><span className="truncate">{course.duration}</span></div>}
                    {course.timing && <div className="flex items-center gap-2"><Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-500" /><span className="truncate">{course.timing}</span></div>}
                  </div>
                  <div className="flex items-center justify-between pt-3 sm:pt-4 border-t border-slate-100">
                    <div className="flex flex-col">
                      <span className="font-black text-base sm:text-lg text-slate-900">{formatCurrency(course.fee)}</span>
                      {!!course.discount && course.discount > 0 && <span className="text-[9px] sm:text-[10px] font-medium line-through text-slate-400">{formatCurrency(course.original_fee)}</span>}
                    </div>
                    <span className="text-xs sm:text-sm font-bold text-blue-600">Details</span>
                  </div>
                </div>
              </Link>
            )) : (
              <div className="col-span-full py-10 text-center text-slate-500 font-medium bg-white rounded-3xl border border-slate-200">No live courses currently scheduled.</div>
            )}
          </div>
          <Link href="/onlinecourse" className="mt-6 sm:hidden flex justify-center text-sm font-bold text-blue-600 border border-blue-100 bg-blue-50 py-3 rounded-xl items-center gap-1">View All Live Courses <ArrowRight className="w-4 h-4" /></Link>
        </section>

        {/* 5. RECORDINGS */}
        <section className="py-12 md:py-20 bg-white max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-8 md:mb-10">
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 flex items-center gap-2 sm:gap-3"><Play className="w-6 h-6 sm:w-8 sm:h-8 text-orange-500" /> Recording Courses</h2>
              <p className="mt-1 sm:mt-2 text-sm sm:text-base text-slate-600 font-medium">Learn anytime, anywhere at your own pace.</p>
            </div>
            <Link href="/recording" className="hidden sm:flex text-sm font-bold text-orange-600 hover:text-orange-700 items-center gap-1">View All <ArrowRight className="w-4 h-4" /></Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {loading ? Array(4).fill(0).map((_, i) => <SkeletonCard key={i} />) : randomRecordings.length > 0 ? randomRecordings.map((course) => {
              const salePrice = calculateRecordingSalePrice(course.standard_fee, course.discount);
              return (
                <Link key={course.id} href={`/recording/${encodeURIComponent(course.course_name)}`} className="group flex flex-col bg-white rounded-[28px] border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl hover:border-orange-200 transition-all duration-300">
                  <div className="relative h-36 sm:h-40 bg-slate-900 overflow-hidden flex items-center justify-center">
                    {course.cover_pic_url ? (
                      <>
                        <Image src={course.cover_pic_url} alt={course.course_name} fill className="object-cover opacity-60 group-hover:scale-105 transition-transform duration-500" />
                        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/30 opacity-0 group-hover:opacity-100 transition-opacity"><PlayCircle className="w-12 h-12 sm:w-14 sm:h-14 text-white drop-shadow-lg" /></div>
                      </>
                    ) : (
                      <Play className="w-10 h-10 sm:w-12 sm:h-12 text-white/50 group-hover:text-white transition-colors group-hover:scale-110 duration-300" />
                    )}
                    {course.course_hours && <div className="absolute bottom-2.5 right-2.5 sm:bottom-3 sm:right-3 bg-black/70 text-white text-[9px] sm:text-[10px] font-bold px-2 py-1 sm:px-2.5 sm:py-1 rounded-md backdrop-blur-md flex items-center gap-1.5"><Clock className="w-3 h-3 text-orange-400" /> {course.course_hours}+ hours</div>}
                  </div>
                  <div className="p-4 sm:p-5 flex flex-col flex-grow">
                    <h3 className="font-bold text-slate-900 text-base mb-2 line-clamp-2">{course.course_name}</h3>
                    <div className="text-[11px] sm:text-xs font-medium text-slate-500 flex items-center gap-1.5 sm:gap-2 mb-3 sm:mb-4 mt-auto"><Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> {(course.enrolled_students || 0).toLocaleString()} enrolled</div>
                    <div className="flex items-center justify-between pt-3 sm:pt-4 border-t border-slate-100">
                      <div className="flex flex-col">
                        <span className="font-black text-base sm:text-lg text-slate-900">{formatCurrency(salePrice)}</span>
                        {!!course.discount && course.discount > 0 && <span className="text-[9px] sm:text-[10px] font-medium line-through text-slate-400">{formatCurrency(course.standard_fee)}</span>}
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
          <Link href="/recording" className="mt-6 sm:hidden flex justify-center text-sm font-bold text-orange-600 border border-orange-100 bg-orange-50 py-3 rounded-xl items-center gap-1">View All Recordings <ArrowRight className="w-4 h-4" /></Link>
        </section>

        {/* 6. BUNDLES — theory + physical bridge */}
        <section id="bundles-section" className="py-12 md:py-20 bg-[#F8FAFC] border-y border-slate-200/60">
          <div className="max-w-6xl mx-auto px-3 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row items-center gap-3 sm:gap-4 mb-8 md:mb-12 text-center md:text-left justify-center md:justify-start">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-blue-700 text-white flex items-center justify-center shadow-lg shadow-blue-700/30 shrink-0"><Package className="w-6 h-6 sm:w-7 sm:h-7" /></div>
              <div>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900">Career-Ready Bundles</h2>
                <p className="text-slate-500 mt-1 text-sm sm:text-lg font-medium">Online theory + physical practical at Baneshwor — save up to 70%.</p>
              </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-6 md:gap-8 items-stretch">
              <div className="flex flex-col gap-6 md:gap-8">
                {BUNDLES.filter((b) => !b.isFeatured).map((bundle) => {
                  const savings = bundle.originalPrice - bundle.price;
                  const savePercent = Math.round((savings / bundle.originalPrice) * 100);
                  const bundleCoursesData = bundle.courses.map((courseName) => {
                    const found = recordings.find((c) => c.course_name === courseName);
                    return { name: courseName, hoursStr: found ? found.course_hours : null, hoursNum: parseHours(found?.course_hours) };
                  });
                  const totalBundleHours = bundleCoursesData.reduce((sum, c) => sum + c.hoursNum, 0);
                  return (
                    <div key={bundle.id} onClick={() => setSelectedBundle(bundle)} className="bg-white border border-slate-200 rounded-[28px] p-5 md:p-8 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col h-full group cursor-pointer">
                      <div className="flex flex-wrap items-start justify-between gap-2 sm:gap-3 mb-4 sm:mb-5">
                        <span className="inline-flex items-center rounded-full px-2.5 py-1 text-[10px] sm:text-xs font-bold bg-slate-100 text-slate-700">{bundle.badge}</span>
                        <span className="inline-flex items-center rounded-full px-2.5 py-1 text-[10px] sm:text-xs font-bold bg-orange-50 text-orange-600 ring-1 ring-orange-100">Save {savePercent}%</span>
                      </div>
                      <h3 className="text-xl sm:text-2xl font-extrabold leading-tight text-slate-900 mb-2 sm:mb-3 group-hover:text-blue-700 transition-colors">{bundle.title}</h3>
                      <div className="flex flex-wrap items-center gap-2 mb-4 sm:mb-5">
                        <div className="inline-flex items-center gap-1 sm:gap-1.5 rounded-full px-2.5 py-1 sm:px-3 sm:py-1.5 text-[10px] sm:text-xs font-semibold bg-blue-50 text-blue-700"><Layers3 className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> {bundle.highlight}</div>
                        {totalBundleHours > 0 && <div className="inline-flex items-center gap-1 sm:gap-1.5 rounded-full px-2.5 py-1 sm:px-3 sm:py-1.5 text-[10px] sm:text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200"><Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> {totalBundleHours} Hrs Total</div>}
                      </div>
                      <p className="text-xs sm:text-sm text-slate-600 mb-5 sm:mb-6 leading-relaxed">{bundle.description}</p>
                      <ul className="space-y-2 sm:space-y-3 mb-6 sm:mb-8 flex-grow">
                        {bundleCoursesData.map((courseData, index) => (
                          <li key={index} className="flex items-start justify-between gap-2 sm:gap-3 group/item">
                            <div className="flex items-start gap-2 sm:gap-3 pr-2">
                              <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 mt-0.5 text-emerald-500" />
                              <span className="text-xs sm:text-sm font-medium leading-snug transition-colors text-slate-700">{courseData.name}</span>
                            </div>
                            {courseData.hoursStr && <span className="text-[9px] sm:text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-md shrink-0 border border-slate-200">{courseData.hoursStr}h</span>}
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
                        <button className="w-full sm:w-auto bg-blue-900 group-hover:bg-orange-500 text-white font-bold py-3 sm:py-3.5 px-5 sm:px-6 rounded-xl transition-all flex items-center justify-center gap-2 text-sm sm:text-base">View Details <ArrowRight className="w-4 h-4" /></button>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="h-full">
                {BUNDLES.filter((b) => b.isFeatured).map((bundle) => {
                  const savings = bundle.originalPrice - bundle.price;
                  const savePercent = Math.round((savings / bundle.originalPrice) * 100);
                  const bundleCoursesData = bundle.courses.map((courseName) => {
                    const found = recordings.find((c) => c.course_name === courseName);
                    return { name: courseName, hoursStr: found ? found.course_hours : null, hoursNum: parseHours(found?.course_hours) };
                  });
                  const totalBundleHours = bundleCoursesData.reduce((sum, c) => sum + c.hoursNum, 0);
                  return (
                    <div key={bundle.id} onClick={() => setSelectedBundle(bundle)} className="relative overflow-hidden bg-gradient-to-b from-slate-900 to-slate-950 text-white rounded-[28px] p-6 sm:p-8 md:p-10 shadow-2xl transition-all duration-300 flex flex-col h-full ring-1 ring-white/10 group cursor-pointer hover:ring-orange-500/50">
                      <div className="absolute top-0 right-0 w-60 h-60 sm:w-80 sm:h-80 bg-blue-500/10 rounded-full blur-[80px] sm:blur-[100px] pointer-events-none" />
                      <div className="relative flex flex-col flex-grow z-10">
                        <div className="flex flex-wrap items-start justify-between gap-2 sm:gap-3 mb-6 sm:mb-8">
                          <span className="inline-flex items-center rounded-full px-3 py-1 sm:px-4 sm:py-1.5 text-[10px] sm:text-xs font-bold bg-blue-600 text-white">{bundle.badge}</span>
                          <span className="inline-flex items-center rounded-full px-3 py-1 sm:px-4 sm:py-1.5 text-[10px] sm:text-xs font-bold bg-orange-500 text-white">Save {savePercent}%</span>
                        </div>
                        <h3 className="text-3xl sm:text-4xl lg:text-5xl font-black leading-[1.1] mb-3 sm:mb-4 text-white">{bundle.title}</h3>
                        <div className="flex flex-wrap items-center gap-2 mb-4 sm:mb-6">
                          <div className="inline-flex items-center gap-1.5 sm:gap-2 rounded-full px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-bold bg-blue-500/10 text-blue-300 border border-blue-500/20"><Layers3 className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> {bundle.highlight}</div>
                          {totalBundleHours > 0 && <div className="inline-flex items-center gap-1.5 sm:gap-2 rounded-full px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30"><Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> {totalBundleHours} Hrs Total</div>}
                        </div>
                        <p className="text-sm sm:text-base text-slate-400 mb-6 sm:mb-8 leading-relaxed max-w-md font-light">{bundle.description}</p>
                        <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-4 sm:p-6 mb-6 sm:mb-8 flex-grow">
                          <h4 className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-4 sm:mb-5">Included in this package:</h4>
                          <ul className="space-y-3 sm:space-y-4">
                            {bundleCoursesData.map((courseData, index) => (
                              <li key={index} className="flex items-start justify-between gap-2 sm:gap-3 group/item">
                                <div className="flex items-start gap-2 sm:gap-3 pr-2">
                                  <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 shrink-0 mt-0.5 text-blue-400" />
                                  <span className="text-sm sm:text-base font-medium leading-snug transition-colors text-slate-300">{courseData.name}</span>
                                </div>
                                {courseData.hoursStr && <span className="text-[10px] sm:text-[11px] font-bold text-slate-300 bg-white/10 px-1.5 py-0.5 sm:px-2 sm:py-0.5 rounded-md shrink-0 border border-white/5">{courseData.hoursStr}h</span>}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="mt-auto pt-5 sm:pt-6 border-t border-white/10 flex flex-col justify-between gap-3 sm:gap-4 shrink-0">
                          <div className="flex items-baseline flex-wrap gap-2 sm:gap-3 mb-1 sm:mb-2">
                            <div className="text-4xl sm:text-5xl font-black tracking-tight text-white">{formatCurrency(bundle.price)}</div>
                            <div className="text-lg sm:text-xl font-medium line-through text-slate-500">{formatCurrency(bundle.originalPrice)}</div>
                          </div>
                          <button className="bg-orange-500 group-hover:bg-orange-600 rounded-xl px-5 py-3.5 sm:px-6 sm:py-4 text-base sm:text-lg flex items-center justify-center transition-all shadow-lg shrink-0 text-white w-full font-bold mt-1 sm:mt-2 hover:shadow-orange-500/30 hover:-translate-y-0.5">See Detailed Value Breakdown <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2" /></button>
                          <p className="text-center text-[11px] sm:text-[13px] mt-1 sm:mt-2 font-medium text-slate-400">One-time payment • Lifetime access • Earn your certificate</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* 7. CERTIFICATE TRUST SECTION */}
        <section className="py-14 md:py-20 bg-emerald-900 text-white overflow-hidden relative">
          <div className="absolute -top-40 -right-40 w-80 h-80 md:w-96 md:h-96 bg-emerald-500/30 blur-[80px] md:blur-[100px] rounded-full" />
          <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 md:gap-12 items-center">
              <div>
                <div className="inline-flex items-center gap-1.5 sm:gap-2 bg-emerald-800/50 border border-emerald-700 px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold text-emerald-300 mb-5 sm:mb-6"><ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> 100% Verifiable</div>
                <h2 className="text-3xl sm:text-4xl font-extrabold mb-4 sm:mb-6">Certified Engineers carry verifiable credentials.</h2>
                <p className="text-emerald-100/80 font-medium text-sm sm:text-lg leading-relaxed mb-6 sm:mb-8">Every course and physical training completion certificate comes with a unique verification ID. Employers can instantly verify authenticity online.</p>
                <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
                  <Link href="/certificate" className="w-full sm:w-auto text-center bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-xl font-bold transition-colors text-sm sm:text-base shadow-md hover:shadow-lg hover:-translate-y-0.5">Verify a Certificate</Link>
                  <Link href="/offline-class" className="text-emerald-200 text-sm sm:text-base font-bold hover:text-white transition-colors">Browse Physical Training</Link>
                </div>
              </div>
              <div className="relative mt-8 lg:mt-0">
                <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-6 md:p-8 rounded-3xl shadow-2xl rotate-2 sm:rotate-3 transform hover:rotate-0 transition-transform duration-500">
                  <div className="border-2 border-emerald-500/30 p-5 md:p-6 rounded-2xl relative">
                    <Award className="absolute top-4 right-4 md:top-6 md:right-6 w-10 h-10 md:w-12 md:h-12 text-emerald-400 opacity-50" />
                    <div className="w-12 h-3 md:w-16 md:h-4 bg-emerald-500/40 rounded-full mb-6 md:mb-8" />
                    <div className="w-3/4 h-6 md:h-8 bg-white/20 rounded-md mb-3 md:mb-4" />
                    <div className="w-1/2 h-3 md:h-4 bg-white/10 rounded-md mb-8 md:mb-12" />
                    <div className="flex justify-between items-end">
                      <div>
                        <div className="w-16 md:w-20 h-1.5 md:h-2 bg-white/20 rounded-full mb-2" />
                        <div className="w-24 md:w-32 h-1 bg-white/10 rounded-full" />
                      </div>
                      <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center"><CheckCircle className="w-5 h-5 md:w-6 md:h-6 text-emerald-400" /></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 8. WHY CHOOSE */}
        <section className="py-12 md:py-20 bg-slate-50 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="text-center mb-10 md:mb-16"><h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Why train with us?</h2></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {[
              { title: "Nepal-Focused Curriculum", desc: "Built specifically for engineering syllabi and job markets used in Nepal." },
              { title: "Physical + Online Hybrid", desc: "Combine self-paced online theory with hands-on physical practical sessions." },
              { title: "Practical, Career-Led Training", desc: "We focus on software and skills (AutoCAD, GIS, Revit) that get you hired." },
              { title: "Central Kathmandu Location", desc: `Easy to reach physical center ${LOCATION.label.replace("Physical Classes: ", "")}.` },
              { title: "Verifiable Achievements", desc: "Digital certificates that employers can verify with one click." },
            ].map((feature, i) => (
              <div key={i} className="flex items-start gap-3 sm:gap-4 p-4 bg-white rounded-2xl shadow-sm border border-slate-100">
                <div className="mt-1 flex-shrink-0 w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center"><CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-700" /></div>
                <div>
                  <h4 className="text-base sm:text-lg font-bold text-slate-900">{feature.title}</h4>
                  <p className="text-xs sm:text-sm font-medium text-slate-600 mt-1.5 sm:mt-2 leading-relaxed">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 9. LOCATION BANNER — fixed CTA, better spacing */}
        <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 -mt-6 md:-mt-10 mb-12 md:mb-16">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-5 sm:gap-6 bg-slate-900 text-white rounded-[28px] px-6 py-6 sm:px-10 sm:py-8 shadow-xl">
            <div className="flex items-center gap-4 text-center sm:text-left">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-emerald-500/15 flex items-center justify-center shrink-0 border border-emerald-500/20">
                <MapPin className="w-6 h-6 sm:w-7 sm:h-7 text-emerald-400" />
              </div>
              <div>
                <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-emerald-300 mb-1">Physical Training Center</p>
                <p className="text-base sm:text-lg font-bold leading-snug">{LOCATION.label}</p>
              </div>
            </div>
            <a
              href={LOCATION.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto shrink-0 inline-flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold px-6 py-3.5 rounded-xl transition-all shadow-md hover:shadow-lg hover:shadow-orange-500/25 hover:-translate-y-0.5 active:translate-y-0 text-sm sm:text-base"
            >
              <Navigation className="w-4 h-4 sm:w-5 sm:h-5" /> Get Directions
            </a>
          </div>
        </section>

        {/* 10. FINAL CTA */}
        <section className="py-14 md:py-24 max-w-6xl mx-auto px-3 sm:px-6">
          <div className="bg-slate-900 rounded-[32px] sm:rounded-[40px] p-8 sm:p-16 text-center text-white relative overflow-hidden shadow-2xl">
            <div className="absolute top-[-50%] left-[-10%] w-[100%] h-[200%] bg-blue-600/20 rotate-12 blur-3xl" />
            <div className="absolute bottom-[-30%] right-[-10%] w-[50%] h-[150%] bg-emerald-500/10 -rotate-12 blur-3xl" />
            <div className="relative z-10">
              <h2 className="text-3xl sm:text-5xl font-extrabold mb-4 sm:mb-6 tracking-tight text-white">Ready to level up your career?</h2>
              <p className="text-slate-400 text-sm sm:text-lg font-medium max-w-2xl mx-auto mb-8 sm:mb-10">Join engineers across Nepal learning online and training physically in Kathmandu.</p>
              <div className="flex flex-col sm:flex-row justify-center items-center gap-3 sm:gap-4">
                <Link href="/onlinecourse" style={{ color: "#0f172a" }} className="w-full sm:w-auto justify-center bg-white px-6 sm:px-8 py-3.5 sm:py-4 rounded-2xl font-bold shadow-lg hover:bg-slate-50 hover:scale-[1.02] transition-all flex items-center gap-2 text-sm sm:text-base">
                  <MonitorPlay className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" /> <span style={{ color: "#0f172a" }}>Online Courses</span>
                </Link>
                <Link href="/offline-class" className="w-full sm:w-auto justify-center bg-emerald-600 text-white px-6 sm:px-8 py-3.5 sm:py-4 rounded-2xl font-bold shadow-lg hover:shadow-emerald-500/25 hover:bg-emerald-500 hover:scale-[1.02] transition-all flex items-center gap-2 text-sm sm:text-base">
                  <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-white" /> <span className="text-white">Physical Training</span>
                </Link>
                <Link href="/recording" className="w-full sm:w-auto justify-center bg-orange-500 text-white px-6 sm:px-8 py-3.5 sm:py-4 rounded-2xl font-bold shadow-lg hover:shadow-orange-500/25 hover:bg-orange-400 hover:scale-[1.02] transition-all flex items-center gap-2 text-sm sm:text-base">
                  <Play className="w-4 h-4 sm:w-5 sm:h-5 text-white" /> <span className="text-white">Recordings</span>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>

      <AnimatePresence>{selectedBundle && renderBundleModal()}</AnimatePresence>

      {/* Mobile FAB */}
      <div className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-[90] xl:hidden flex flex-col items-end">
        <AnimatePresence>
          {isFabOpen && (
            <motion.div initial={{ opacity: 0, y: 20, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.9 }} transition={{ duration: 0.2 }} className="flex flex-col gap-2.5 sm:gap-3 mb-3 sm:mb-4 items-end">
              <Link href="/offline-class" onClick={() => setIsFabOpen(false)} className="flex items-center gap-3 bg-emerald-600 text-white px-4 sm:px-5 py-3 sm:py-3.5 rounded-2xl font-bold shadow-lg sm:shadow-xl active:scale-95 transition-transform text-xs sm:text-sm"><span className="text-white">Physical Training</span> <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" /></Link>
              <Link href="/onlinecourse" onClick={() => setIsFabOpen(false)} className="flex items-center gap-3 bg-blue-600 text-white px-4 sm:px-5 py-3 sm:py-3.5 rounded-2xl font-bold shadow-lg sm:shadow-xl active:scale-95 transition-transform text-xs sm:text-sm"><span className="text-white">Online Courses</span> <MonitorPlay className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" /></Link>
              <Link href="/recording" onClick={() => setIsFabOpen(false)} className="flex items-center gap-3 bg-white text-slate-900 border border-slate-200 px-4 sm:px-5 py-3 sm:py-3.5 rounded-2xl font-bold shadow-lg sm:shadow-xl active:scale-95 transition-transform text-xs sm:text-sm"><span className="text-slate-900">Recordings</span> <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-500" /></Link>
            </motion.div>
          )}
        </AnimatePresence>
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => setIsFabOpen(!isFabOpen)} aria-label="Toggle mobile menu" aria-expanded={isFabOpen} className={`flex h-14 w-14 md:h-16 md:w-16 items-center justify-center rounded-full shadow-[0_8px_20px_rgba(37,99,235,0.3)] text-white transition-colors duration-300 ${isFabOpen ? "bg-slate-900" : "bg-orange-500"}`}>
          <Plus className={`h-6 w-6 md:h-7 md:w-7 text-white transition-transform duration-300 ${isFabOpen ? "rotate-45" : ""}`} />
        </motion.button>
      </div>
      <AnimatePresence>
        {isFabOpen && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsFabOpen(false)} aria-hidden="true" className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-[80] xl:hidden" />}
      </AnimatePresence>
    </main>
  );
}

function Stat({ icon, value, label }: any) {
  return (
    <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 text-center shadow-sm">
      <div className="w-5 h-5 sm:w-6 sm:h-6 mx-auto text-blue-600 mb-1.5 sm:mb-2">{icon}</div>
      <div className="text-lg sm:text-2xl font-black text-slate-900">{value}</div>
      <div className="text-[9px] sm:text-xs font-bold text-slate-500 uppercase mt-0.5 sm:mt-0">{label}</div>
    </div>
  );
}