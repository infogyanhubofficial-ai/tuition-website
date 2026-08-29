"use client";

/**
 * GyanHub — Physical Course Detail Page
 * Route: /offline-class/[courseCode]
 *
 * Redesign Build Spec Implementation:
 * - Token Unification (navy, blue, orange, paper)
 * - Strict Orange Discipline (CTAs only)
 * - Blueprint / Spec Sheet motif (Title block chips, corner ticks, annotations)
 * - Instant Booking flow simplified (real price, no phantom double-discount)
 * - Real Data Fetching (Reviews, Certificates/Students count, Batch No, Syllabus)
 * - Integrated "Finding our center", Marquee galleries, and Video Modals.
 * - Map Button Text Color Fix
 * - Student Count minimum 113+
 * - Full Modal Implementation for Reserve Seat
 */

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  MapPin,
  Clock,
  Calendar,
  Users,
  Award,
  CheckCircle2,
  Laptop,
  Wifi,
  Car,
  MessageCircle,
  ChevronDown,
  Compass,
  FileWarning,
  X,
  PlayCircle,
  ExternalLink,
  Star,
  Quote,
} from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
);

type CourseCategory = "Professional Training" | "University Subjects";
type CourseStatus = "upcoming" | "ongoing" | "completed" | "cancelled";

interface LearningOutcomesJson {
  learning_outcomes?: string[];
}

interface PhysicalCourse {
  id: string;
  title: string;
  course_code: string | null;
  batch_no?: string | number | null; 
  syllabus_id?: number | null; 
  course_image_url: string | null;
  instructor_image_url: string | null;
  category: CourseCategory;
  description: string | null;
  learning_outcomes: LearningOutcomesJson | null;
  instructor_name: string | null;
  tutor_bio: string | null;
  location: string | null;
  start_date: string | null;
  timing: string | null;
  duration_weeks: number | null;
  price: number;
  discount_price: number | null;
  max_seats: number | null;
  enrolled_count: number | null;
  status: CourseStatus;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface ReviewWithProfile {
  id: string;
  overall_rating: number;
  testimonial: string;
  name: string;
  email: string | null;
  avatar_url: string | null;
  course: string;
}

function formatNPR(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return "—";
  return `Rs. ${amount.toLocaleString("en-IN")}`;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "To be announced";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatDateShort(dateStr: string | null): string {
  if (!dateStr) return "TBA";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { day: "numeric", month: "short" });
}

function seatsRemaining(course: PhysicalCourse): number {
  const max = course.max_seats ?? 30;
  const enrolled = course.enrolled_count ?? 0;
  return Math.max(max - enrolled, 0);
}

function discountPercent(course: PhysicalCourse): number | null {
  if (!course.discount_price || course.discount_price >= course.price) return null;
  return Math.round(((course.price - course.discount_price) / course.price) * 100);
}

function resolveStatusLabel(status: CourseStatus): string {
  switch (status) {
    case "upcoming":
      return "Upcoming";
    case "ongoing":
      return "Ongoing";
    case "completed":
      return "Completed";
    case "cancelled":
      return "Cancelled";
    default:
      return status;
  }
}

function extractOutcomes(course: PhysicalCourse): string[] {
  const raw = course.learning_outcomes?.learning_outcomes;
  if (Array.isArray(raw) && raw.length > 0) return raw;
  return [];
}

function initials(name: string | null): string {
  if (!name) return "GH";
  const parts = name.replace(/^(Er\.|Mr\.|Ms\.|Dr\.)\s*/i, "").split(" ").filter(Boolean);
  return parts.slice(0, 2).map((p) => p[0]?.toUpperCase()).join("");
}

const getYouTubeVideoId = (url: string | null) => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
};

const getYouTubeEmbedUrl = (url: string | null) => {
  const id = getYouTubeVideoId(url);
  return id ? `https://www.youtube.com/embed/${id}?autoplay=0&rel=0` : null;
};

const PARKING_VIDEO_URL = "https://youtu.be/KVTGqQwRCGY";
const WHATSAPP_NUMBER = "9779763695665";

const FAQ_ITEMS = [
  { q: "Do I need prior experience to join this course?", a: "No prior experience is required for most classes. The course is structured to take you from the fundamentals to practical, job-ready workflows step by step." },
  { q: "Is a laptop required for the classes?", a: "Yes, a laptop is required for the practical sessions. If you don't have one, reach out to us before enrolling and we'll help you plan around it." },
  { q: "Will I get access to class recordings?", a: "Yes, every enrolled student gets recordings of all live sessions, so you can revisit any topic at your pace." },
  { q: "What happens if I miss a class?", a: "You won't fall behind — recordings are shared after every session, and our support team can help you catch up before the next class." },
  { q: "Is there a refund policy?", a: "If you're unable to continue within the first two sessions for a genuine reason, reach out to our support team to discuss options." },
  { q: "Will I receive a certificate after completion?", a: "Yes, an industry-recognized certificate with QR verification and instructor signature is issued on successful completion." },
];

function useCountUp(target: number, durationMs = 900, start = true) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!start) return;
    let raf: number;
    const startTime = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - startTime) / durationMs, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * eased));
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, durationMs, start]);
  return value;
}

/* --- Blueprint Motif Components --- */

function TitleBlockChip({ code, batch }: { code: string; batch?: string | number | null }) {
  const displayBatch = batch ? `BATCH.${String(batch).padStart(2, "0")}` : "REV.01";
  return (
    <div className="inline-flex items-center border border-dashed border-[#0B1B3A]/40 px-2.5 py-1 font-mono text-[11px] tracking-widest text-[#0B1B3A] uppercase bg-white">
      {code} / {displayBatch}
    </div>
  );
}

function CornerFrame({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`relative p-3 ${className}`}>
      <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-[#0B1B3A]" />
      <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-[#0B1B3A]" />
      <div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-[#0B1B3A]" />
      <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-[#0B1B3A]" />
      {children}
    </div>
  );
}

function AnnotationTag({ index, label, value }: { index: string | number; label: string; value: string }) {
  const idxStr = String(index).padStart(2, "0");
  return (
    <div className="flex flex-col gap-1.5 pb-3 border-b border-dashed border-[#0B1B3A]/15">
      <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-mono text-[#0B1B3A]/50">
        <span className="text-[#1E3A8A] font-bold">[{idxStr}]</span> {label}
      </div>
      <div className="text-sm font-semibold text-[#0B1B3A]">{value}</div>
    </div>
  );
}

function TrustStatsBar({ studentCount, avgRating }: { studentCount: number; avgRating: number }) {
  // If student count is less than 100, default to 113. Otherwise show real count.
  const displayCount = studentCount < 100 ? 113 : studentCount;
  
  return (
    <div className="flex flex-wrap items-center gap-x-8 gap-y-4 py-5 border-y border-dashed border-[#0B1B3A]/15 mt-8 w-full">
      <div className="flex flex-col">
        <span className="font-display font-bold text-xl text-[#0B1B3A]">15+</span>
        <span className="font-mono text-[10px] uppercase tracking-wider text-[#0B1B3A]/50">Batches Run</span>
      </div>
      <div className="flex flex-col">
        <span className="font-display font-bold text-xl text-[#0B1B3A]">{displayCount}+</span>
        <span className="font-mono text-[10px] uppercase tracking-wider text-[#0B1B3A]/50">Certified Students</span>
      </div>
      {avgRating > 0 && (
        <div className="flex flex-col">
          <span className="font-display font-bold text-xl text-[#0B1B3A]">{avgRating.toFixed(1)}/5</span>
          <span className="font-mono text-[10px] uppercase tracking-wider text-[#0B1B3A]/50">Avg. Rating</span>
        </div>
      )}
    </div>
  );
}

/* --- Interactive Components --- */

const GLIMPSE_PHOTOS = [
  { url: "https://zuktarghyexwodqnnxlu.supabase.co/storage/v1/object/public/others/Certificate_Distribution_First_Batch.webp", caption: "E-bidding Course Certificate Distribution - Batch 01" },
  { url: "https://zuktarghyexwodqnnxlu.supabase.co/storage/v1/object/public/others/Happy_Faces_With_GyanHub.webp", caption: "Happy Faces with GyanHub" },
  { url: "https://zuktarghyexwodqnnxlu.supabase.co/storage/v1/object/public/others/E-Certificate.webp", caption: "e-Certificates of GyanHub" },
  { url: "https://zuktarghyexwodqnnxlu.supabase.co/storage/v1/object/public/others/Batch_3_Teaching.webp", caption: "Physical Class" },
  { url: "https://zuktarghyexwodqnnxlu.supabase.co/storage/v1/object/public/others/Batch_2_teaching.webp", caption: "E-bidding - Batch 02" },
  { url: "https://zuktarghyexwodqnnxlu.supabase.co/storage/v1/object/public/others/Batch_3_Orientation.webp", caption: "Orientation Day" },
  { url: "https://zuktarghyexwodqnnxlu.supabase.co/storage/v1/object/public/others/Certificate_Distribution_Shrawan_batch.webp", caption: "Individual Certificate Distribution" },
];

function GlimpseMarquee() {
  const looped = [...GLIMPSE_PHOTOS, ...GLIMPSE_PHOTOS];
  return (
    <div className="relative w-full overflow-hidden border-y border-dashed border-[#0B1B3A]/15 bg-white py-6">
      <div className="mx-auto max-w-6xl px-6 lg:px-12 mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-[#1E3A8A]">
          See past batches in action
        </h2>
        <span className="hidden font-mono text-[11px] text-[#0B1B3A]/40 sm:block">
          {GLIMPSE_PHOTOS.length} photos · live from the classroom
        </span>
      </div>

      <div className="gh-marquee-mask">
        <div className="gh-marquee-track">
          {looped.map((photo, idx) => (
            <div
              key={`${photo.url}-${idx}`}
              className="relative h-52 w-72 shrink-0 overflow-hidden rounded-xl border border-[#0B1B3A]/8 shadow-sm"
            >
              <img src={photo.url} alt={photo.caption} className="h-full w-full object-cover" loading="lazy" />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-3 py-2">
                <span className="font-mono text-[11px] font-semibold uppercase tracking-wide text-white">
                  {photo.caption}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ReviewsMarquee({ reviews }: { reviews: ReviewWithProfile[] }) {
  if (!reviews || reviews.length === 0) return null;
  const looped = reviews.length < 5 ? [...reviews, ...reviews, ...reviews] : [...reviews, ...reviews];

  return (
    <div className="relative overflow-hidden pt-6 pb-12">
      <div className="gh-marquee-mask">
        <div className="gh-review-track">
          {looped.map((review, idx) => (
            <div
              key={`${review.id}-${idx}`}
              className="w-[320px] shrink-0 rounded-xl border border-[#0B1B3A]/10 bg-white p-6 shadow-sm"
            >
              <div className="mb-3 flex text-[#1E3A8A]">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={14} fill={i < review.overall_rating ? "currentColor" : "transparent"} strokeWidth={i < review.overall_rating ? 0 : 1} />
                ))}
              </div>
              <p className="relative font-serif italic leading-relaxed text-[#0B1B3A]/90 min-h-[4.5rem]">
                <Quote size={20} className="absolute -left-1 -top-1 -z-10 text-[#0B1B3A]/5" />
                &ldquo;{review.testimonial}&rdquo;
              </p>
              <div className="mt-4 flex items-center gap-3 border-t border-dashed border-[#0B1B3A]/10 pt-4">
                <div className="h-8 w-8 overflow-hidden rounded-full bg-[#1E3A8A]/10">
                  {review.avatar_url ? (
                    <img src={review.avatar_url} alt={review.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center font-mono text-[10px] font-bold text-[#1E3A8A]">
                      {initials(review.name)}
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-mono text-[11px] font-semibold uppercase text-[#0B1B3A]">
                    {review.name}
                  </p>
                  <p className="truncate text-[10px] text-[#0B1B3A]/50 uppercase tracking-wider">{review.course}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function VideoModal({
  videoUrl,
  title,
  onClose,
}: {
  videoUrl: string;
  title: string;
  onClose: () => void;
}) {
  const embedUrl = getYouTubeEmbedUrl(videoUrl);

  if (!embedUrl) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="relative aspect-video w-full max-w-3xl overflow-hidden rounded-xl bg-black shadow-2xl"
      >
        <button
          onClick={onClose}
          aria-label="Close video"
          className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
        >
          ✕
        </button>
        <iframe
          src={embedUrl}
          title={title}
          className="h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </motion.div>
    </motion.div>
  );
}

function SeatsBar({ course, animate }: { course: PhysicalCourse; animate: boolean }) {
  const max = course.max_seats ?? 30;
  const enrolled = course.enrolled_count ?? 0;
  const remaining = seatsRemaining(course);
  const animatedEnrolled = useCountUp(enrolled, 800, animate);
  const filledPct = max > 0 ? Math.min((enrolled / max) * 100, 100) : 0;

  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1.5">
        <span className="font-medium text-[#0B1B3A]/60 font-mono text-[11px] uppercase tracking-wider">
          {animatedEnrolled} / {max} Enrolled
        </span>
        <span className="font-semibold text-[#1E3A8A] font-mono text-[11px] uppercase tracking-wider">
          {remaining} Left
        </span>
      </div>
      <div className="h-1.5 w-full bg-[#0B1B3A]/10 overflow-hidden rounded-none">
        <div
          className="h-full bg-[#1E3A8A] transition-all duration-700 ease-out rounded-none"
          style={{ width: `${animate ? filledPct : 0}%` }}
        />
      </div>
    </div>
  );
}

function PriceBlock({ course, size = "lg" }: { course: PhysicalCourse; size?: "lg" | "md" }) {
  const discPct = discountPercent(course);
  const big = size === "lg" ? "text-4xl sm:text-5xl" : "text-2xl";
  const small = size === "lg" ? "text-lg" : "text-sm";
  return (
    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
      <span className={`font-display font-bold text-[#0B1B3A] ${big}`}>
        {formatNPR(course.discount_price ?? course.price)}
      </span>
      {course.discount_price && (
        <span className={`text-[#0B1B3A]/35 line-through font-mono ${small}`}>{formatNPR(course.price)}</span>
      )}
      {discPct !== null && (
        <span className="text-[10px] font-mono font-bold text-[#1E3A8A] bg-[#1E3A8A]/10 px-2.5 py-1 uppercase tracking-wider">
          Save {discPct}%
        </span>
      )}
    </div>
  );
}

function InstantBookingModal({
  courseTitle,
  bookingAmount,
  websitePrice,
  onClose,
  onSubmit,
}: {
  courseTitle: string;
  bookingAmount: number;
  websitePrice: number;
  onClose: () => void;
  onSubmit: (details: { name: string; email: string; phone: string }) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [redirecting, setRedirecting] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (name.trim().length < 3) {
      setError("Please enter your full name.");
      return;
    }
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }
    if (phone.replace(/\D/g, "").length < 10) {
      setError("Please enter a valid WhatsApp number.");
      return;
    }

    setRedirecting(true);
    try {
      await onSubmit({ name: name.trim(), email: email.trim(), phone: phone.trim() });
    } catch (err) {
      setError("Something went wrong processing your request. Please try again.");
      setRedirecting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#0B1B3A]/60 backdrop-blur-sm">
      <div className="bg-white p-7 max-w-sm w-full shadow-2xl relative border border-[#0B1B3A]/10">
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 w-7 h-7 rounded bg-[#0B1B3A]/5 flex items-center justify-center text-[#0B1B3A]/40 hover:bg-[#0B1B3A]/10 hover:text-[#0B1B3A]/70 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <span className="inline-flex items-center text-[10px] font-mono font-bold uppercase tracking-widest text-[#1E3A8A] bg-[#1E3A8A]/10 px-2 py-1">
          Reserve Your Seat
        </span>
        <h3 className="mt-4 text-lg font-display font-bold text-[#0B1B3A]">Join {courseTitle}</h3>
        <p className="mt-2 text-sm text-[#0B1B3A]/60 leading-relaxed">
          Provide your details to secure your seat at the discounted price of {formatNPR(websitePrice)}. A 10% downpayment of <strong className="text-[#1E3A8A]">{formatNPR(bookingAmount)}</strong> is required today for booking.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-widest text-[#0B1B3A]/60 mb-1.5">Full Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-[#0B1B3A]/15 px-3 py-2.5 text-sm text-[#0B1B3A] focus:outline-none focus:border-[#1E3A8A]"
              placeholder="Your full name"
            />
          </div>
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-widest text-[#0B1B3A]/60 mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-[#0B1B3A]/15 px-3 py-2.5 text-sm text-[#0B1B3A] focus:outline-none focus:border-[#1E3A8A]"
              placeholder="you@example.com (Optional)"
            />
          </div>
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-widest text-[#0B1B3A]/60 mb-1.5">WhatsApp Number *</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full border border-[#0B1B3A]/15 px-3 py-2.5 text-sm text-[#0B1B3A] focus:outline-none focus:border-[#1E3A8A]"
              placeholder="98XXXXXXXX"
            />
          </div>

          {error && <p className="text-xs text-[#E11D48] font-medium">{error}</p>}

          <button
            type="submit"
            disabled={redirecting}
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-[#F97316] text-white font-mono text-[13px] uppercase tracking-widest font-bold hover:bg-[#EA580C] transition-colors disabled:opacity-60"
          >
            {redirecting ? "Redirecting…" : `Pay ${formatNPR(bookingAmount)} Downpayment`} <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}

/* --- Main Page Component --- */

export default function OfflineCourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const courseCode = decodeURIComponent(String(params?.courseCode ?? ""));

  const [course, setCourse] = useState<PhysicalCourse | null>(null);
  const [studentCount, setStudentCount] = useState<number>(0);
  const [reviews, setReviews] = useState<ReviewWithProfile[]>([]);
  const [avgRating, setAvgRating] = useState<number>(0);
  
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [statsInView, setStatsInView] = useState(false);
  const [showInstantModal, setShowInstantModal] = useState(false);
  
  // Updated state to use url rather than id
  const [activeVideo, setActiveVideo] = useState<{ url: string; title: string } | null>(null);

  useEffect(() => {
    let active = true;
    async function fetchData() {
      setLoading(true);
      setNotFound(false);
      
      // 1. Fetch Course
      const { data: courseData, error } = await supabase
        .from("physicalcourses")
        .select("*")
        .eq("course_code", courseCode)
        .eq("is_active", true)
        .maybeSingle();

      if (!active) return;
      if (error || !courseData) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      
      setCourse(courseData as PhysicalCourse);

      // 2. Fetch ancillary real data if syllabus_id is present
      if (courseData.syllabus_id) {
        const syllabusId = courseData.syllabus_id;

        // Fetch Certificates Count
        const { count: certCount } = await supabase
          .from("certificates")
          .select("id", { count: "exact", head: true })
          .eq("syllabus_id", syllabusId)
          .eq("status", "active");

        if (active) setStudentCount(certCount || 0);

        // Fetch Approved Reviews
        const { data: revsData } = await supabase
          .from("reviews")
          .select("id, overall_rating, testimonial, name, email")
          .eq("syllabus_id", syllabusId)
          .eq("status", "approved")
          .order("overall_rating", { ascending: false })
          .limit(10);

        if (revsData && revsData.length > 0 && active) {
          const emails = revsData.map((r) => r.email).filter(Boolean);
          let profilesData: any[] = [];
          
          if (emails.length > 0) {
            const { data: profs } = await supabase
              .from("profiles")
              .select("email, full_name, avatar_url")
              .in("email", emails);
            if (profs) profilesData = profs;
          }

          const combinedReviews = revsData.map((r) => {
            const profile = profilesData.find((p) => p.email === r.email);
            return {
              id: r.id,
              overall_rating: r.overall_rating || 5,
              testimonial: r.testimonial || "Great course!",
              name: profile?.full_name || r.name || "Anonymous",
              email: r.email,
              avatar_url: profile?.avatar_url || null,
              course: courseData.title,
            };
          });

          setReviews(combinedReviews);
          const sum = combinedReviews.reduce((acc, curr) => acc + curr.overall_rating, 0);
          setAvgRating(sum / combinedReviews.length);
        }
      }
      
      setLoading(false);
    }
    
    if (courseCode) fetchData();
    return () => {
      active = false;
    };
  }, [courseCode]);

  useEffect(() => {
    const timeout = setTimeout(() => setStatsInView(true), 250);
    return () => clearTimeout(timeout);
  }, [loading]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F8FF] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-none border-4 border-[#1E3A8A]/15 border-t-[#1E3A8A] animate-spin" />
          <p className="font-mono text-xs tracking-[0.2em] text-[#0B1B3A]/50 uppercase">
            Loading Spec Sheet…
          </p>
        </div>
      </div>
    );
  }

  if (notFound || !course) {
    return (
      <div className="min-h-screen bg-[#F5F8FF] flex items-center justify-center px-6">
        <div className="max-w-md w-full text-center bg-white border border-[#0B1B3A]/10 p-10 shadow-sm">
          <div className="w-16 h-16 bg-[#1E3A8A]/10 flex items-center justify-center mx-auto mb-5">
            <FileWarning className="w-8 h-8 text-[#1E3A8A]" strokeWidth={1.75} />
          </div>
          <h1 className="font-display font-semibold text-xl text-[#0B1B3A] mb-2">
            Drawing Not Found
          </h1>
          <p className="text-sm text-[#0B1B3A]/60 mb-6">
            We couldn&apos;t find an active offline course with the code{" "}
            <span className="font-mono text-[#0B1B3A] bg-[#0B1B3A]/5 px-1">{courseCode}</span>.
          </p>
          <Link
            href="/offline-classes"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1E3A8A] text-white font-mono text-xs uppercase tracking-wider hover:bg-[#16295e] transition-colors"
          >
            Return to Index <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  const outcomes = extractOutcomes(course);
  const statusLabel = resolveStatusLabel(course.status);
  const heroImage = course.course_image_url || null;

  const classDetails = [
    { label: "Location", value: course.location || "New Baneshwor, Kathmandu" },
    { label: "Timing", value: course.timing || "To be announced" },
    { label: "Laptop", value: "Required for practicals" },
    { label: "Internet", value: "Provided in class" },
    { label: "Parking", value: "Available nearby" },
    { label: "Certificate", value: "Included on completion" },
  ];

  const websitePrice = course.discount_price ?? course.price;
  const bookingAmount = Math.round(websitePrice * 0.1);

  async function handleInstantBookingSubmit(details: { name: string; email: string; phone: string }) {
    const { data: currentCourse } = await supabase
      .from("physicalcourses")
      .select("start_date, batch_no")
      .eq("id", course!.id)
      .single();

    // Safely parse batch_no to integer, defaulting to 1 if not set
    let parsedBatchNo = 1;
    if (currentCourse?.batch_no) {
      parsedBatchNo = parseInt(String(currentCourse.batch_no), 10) || 1;
    } else if (course?.batch_no) {
      parsedBatchNo = parseInt(String(course.batch_no), 10) || 1;
    }

    const { data: existingLead } = await supabase
      .from("physical_leads")
      .select("id, remarks")
      .eq("course_id", course!.id)
      .eq("phone", details.phone)
      .maybeSingle();

    let targetLeadId: string;

    if (existingLead) {
      targetLeadId = existingLead.id;
      const updatedRemarks = existingLead.remarks 
        ? `${existingLead.remarks} | Upgraded to Booking` 
        : "Upgraded to Booking";

      await supabase
        .from("physical_leads")
        .update({
          discount_price: websitePrice,
          booking_amount: bookingAmount,
          remarks: updatedRemarks,
          updated_at: new Date().toISOString(),
        })
        .eq("id", targetLeadId);
    } else {
      targetLeadId = crypto.randomUUID(); 
      const { error } = await supabase.from("physical_leads").insert({
        id: targetLeadId,
        course_id: course!.id,
        course_code: course!.course_code ?? courseCode,
        start_date: currentCourse?.start_date ?? course!.start_date ?? null,
        course_title: course!.title,
        category: course!.category,
        full_name: details.name,
        phone: details.phone,
        email: details.email || null,
        office_location: course!.location || "New Baneshwor",
        course_price: course!.price,
        discount_price: websitePrice,
        booking_amount: bookingAmount,
        source: "Website",
        status: "new",
        remarks: "Initiated Booking",
        batch_no: parsedBatchNo,
      });

      if (error) throw error;
    }

    await supabase.from("orders_v2").update({
      locked_price: websitePrice,
      pending_amount: 0,
      paid_amount: 0 
    }).eq("leads_id", targetLeadId);

    const { data: existingOrder } = await supabase
      .from("orders_v2")
      .select("id")
      .eq("leads_id", targetLeadId)
      .maybeSingle();

    const redirectParams = new URLSearchParams({
      type: "course",
      order_type: "Physical Class",
      courseName: course!.title,
      price: String(bookingAmount), 
      locked_price: String(websitePrice),
      name: details.name,
      email: details.email || "",
      phone: details.phone,
      leads_id: targetLeadId,
    });
    
    if (existingOrder?.id) {
      redirectParams.append("order_id", existingOrder.id);
    }

    router.push(`/order?${redirectParams.toString()}`);
  }

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_ITEMS.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.a,
      },
    })),
  };

  return (
    <div className="min-h-screen bg-[#F5F8FF] text-[#0B1B3A] font-sans pb-24 lg:pb-0 overflow-x-hidden">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <style dangerouslySetInnerHTML={{
        __html: `
        .gh-marquee-mask { -webkit-mask-image: linear-gradient(to right, transparent 0, #000 5%, #000 95%, transparent 100%); mask-image: linear-gradient(to right, transparent 0, #000 5%, #000 95%, transparent 100%); }
        .gh-marquee-track { display: flex; gap: 1.25rem; width: max-content; padding: 0 1.25rem; animation: gh-scroll 40s linear infinite; }
        .gh-marquee-track:hover { animation-play-state: paused; }
        .gh-review-track { display: flex; gap: 1.5rem; width: max-content; padding: 0 1.5rem; animation: gh-review-scroll 55s linear infinite; }
        .gh-review-track:hover { animation-play-state: paused; }
        @keyframes gh-scroll { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        @keyframes gh-review-scroll { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        @media (prefers-reduced-motion: reduce) { .gh-marquee-track, .gh-review-track { animation: none; overflow-x: auto; } }
      `}} />

      <main className="grid lg:grid-cols-[1fr_360px] gap-0 max-w-[1400px] mx-auto">
        <div className="min-w-0">
          
          {/* Hero Section */}
          <section className="px-6 lg:px-12 pt-10 lg:pt-14 pb-10">
            <div className="grid lg:grid-cols-[1.05fr_0.95fr] gap-10 items-start">
              <div>
                <div className="flex flex-wrap items-center gap-3 mb-6">
                  <TitleBlockChip code={course.course_code ?? "GH-000"} batch={course.batch_no} />
                  <span className="text-[11px] font-mono uppercase tracking-widest text-[#0B1B3A]/50">
                    {course.category}
                  </span>
                  {statusLabel && (
                    <span className="text-[11px] font-mono uppercase tracking-widest text-[#1E3A8A] border border-[#1E3A8A]/20 px-2 py-0.5 bg-white ml-auto sm:ml-0">
                      {statusLabel}
                    </span>
                  )}
                </div>

                <h1 className="font-display text-3xl sm:text-4xl lg:text-[2.75rem] leading-[1.1] font-bold tracking-tight text-[#0B1B3A]">
                  {course.title}
                </h1>

                <p className="mt-5 text-base text-[#0B1B3A]/70 leading-relaxed max-w-xl">
                  {course.description ||
                    "Hands-on practical training with real projects, industry tools, recordings, and a certificate on completion."}
                </p>

                <div className="mt-8">
                  <PriceBlock course={course} size="lg" />
                </div>

                <div className="mt-8 flex flex-wrap gap-3">
                  <button
                    onClick={() => setShowInstantModal(true)}
                    className="inline-flex items-center gap-2 px-6 py-3.5 bg-[#F97316] text-white font-mono text-[13px] uppercase tracking-widest font-bold hover:bg-[#EA580C] transition-colors shadow-sm"
                  >
                    Reserve Seat <ArrowRight className="w-4 h-4" />
                  </button>
                  {course.syllabus_id && (
                    <Link
                      href={`/syllabus/${course.syllabus_id}`}
                      className="inline-flex items-center gap-2 px-6 py-3.5 border border-[#0B1B3A]/15 text-[#0B1B3A] font-mono text-[13px] uppercase tracking-widest font-bold hover:bg-white transition-colors bg-white/50"
                    >
                      View Syllabus
                    </Link>
                  )}
                </div>

                <TrustStatsBar studentCount={studentCount} avgRating={avgRating} />
              </div>

              <CornerFrame className="bg-[#0B1B3A]/[0.02]">
                <div className="relative w-full aspect-[4/3] bg-white overflow-hidden border border-[#0B1B3A]/10">
                  {heroImage ? (
                    <Image
                      src={heroImage}
                      alt={course.title}
                      fill
                      className="object-contain"
                      sizes="(max-width: 1024px) 100vw, 45vw"
                      priority
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-3 bg-[#0B1B3A]">
                      <Compass className="w-14 h-14 text-white/25" strokeWidth={1} />
                      <span className="font-mono text-[11px] tracking-widest text-white/40 uppercase">
                        {course.course_code}
                      </span>
                    </div>
                  )}
                </div>
              </CornerFrame>
            </div>
          </section>

          <GlimpseMarquee />

          {/* Course Blueprint */}
          <section className="px-6 lg:px-12 py-12 bg-white border-b border-dashed border-[#0B1B3A]/15">
            <h2 className="font-display text-xl sm:text-2xl font-bold mb-8">Course Blueprint</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-8">
              {classDetails.map((d, i) => (
                <AnnotationTag key={i} index={i + 1} label={d.label} value={d.value} />
              ))}
            </div>
          </section>

          {/* Curriculum */}
          {outcomes.length > 0 && (
            <section id="learn" className="px-6 lg:px-12 py-14 scroll-mt-20">
              <h2 className="font-display text-xl sm:text-2xl font-bold mb-2">Curriculum Breakdown</h2>
              <p className="text-sm text-[#0B1B3A]/60 mb-8 max-w-xl">
                A structured, step-by-step path from fundamental concepts to hands-on, job-ready application.
              </p>
              <div className="max-w-3xl flex flex-col gap-0 border-t border-dashed border-[#0B1B3A]/15">
                {outcomes.map((outcome, i) => (
                  <div key={i} className="py-5 border-b border-dashed border-[#0B1B3A]/15 flex items-start gap-4 hover:bg-white/50 transition-colors px-2">
                    <div className="font-mono text-[#1E3A8A] font-bold text-sm tracking-wider mt-0.5">
                      M{String(i + 1).padStart(2, "0")}
                    </div>
                    <div className="text-base text-[#0B1B3A] leading-relaxed">
                      {outcome}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Location & Parking */}
          <section className="border-y border-dashed border-[#0B1B3A]/15 bg-white py-16 px-6 lg:px-12">
            <div className="mx-auto max-w-5xl">
              <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:items-center">
                <div>
                  <h2 className="mb-4 font-display text-xl sm:text-2xl font-bold text-[#0B1B3A]">
                    Finding Our Centre
                  </h2>
                  <p className="mb-8 text-[#0B1B3A]/70 text-sm leading-relaxed">
                    Located right near Eyeplex Mall in New Baneshwor. Easy to reach via public
                    transit, with dedicated on-site parking for two-wheelers.
                  </p>
                  <div className="flex flex-col gap-4 sm:flex-row">
                    <a
                      href="https://www.google.com/maps/place/Gyan+Hub+Pvt.+Ltd/@27.6920528,85.3336796,17z"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group inline-flex items-center justify-center gap-2 border border-[#1E3A8A] bg-[#1E3A8A] px-6 py-3 font-mono text-[11px] uppercase tracking-widest font-bold transition hover:bg-[#16295e]"
                      style={{ color: "#ffffff" }}
                    >
                      <MapPin size={16} />
                      Open in Maps
                      <ExternalLink size={14} className="transition group-hover:translate-x-0.5" />
                    </a>
                    <button
                      onClick={() => setActiveVideo({ url: PARKING_VIDEO_URL, title: "Parking Guide" })}
                      className="inline-flex items-center justify-center gap-2 border border-[#0B1B3A]/20 bg-[#F5F8FF] px-6 py-3 font-mono text-[11px] uppercase tracking-widest font-bold text-[#0B1B3A] transition hover:border-[#1E3A8A] hover:text-[#1E3A8A]"
                    >
                      <PlayCircle size={16} />
                      Watch Parking Guide
                    </button>
                  </div>
                </div>
                <CornerFrame className="bg-[#0B1B3A]/5">
                  <div className="relative aspect-video w-full overflow-hidden border border-[#0B1B3A]/10 bg-neutral-200">
                    <iframe
                      src="https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d14130.826620579247!2d85.3362545!3d27.6920528!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39eb1990925a6f83%3A0xaec6838aa0bdb23d!2sGyan%20Hub%20Pvt.%20Ltd!5e0!3m2!1sen!2snp!4v1700000000000!5m2!1sen!2snp"
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      allowFullScreen={false}
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      title="GyanHub Location Map"
                    />
                  </div>
                </CornerFrame>
              </div>
            </div>
          </section>

          {/* Instructor */}
          {course.instructor_name && (
            <section className="px-6 lg:px-12 py-14">
              <h2 className="font-display text-xl sm:text-2xl font-bold mb-8">Meet Your Instructor</h2>
              <div className="max-w-3xl flex flex-col sm:flex-row gap-8 items-start">
                <CornerFrame className="shrink-0 bg-white">
                  <div className="w-28 h-28 bg-[#1E3A8A] relative flex items-center justify-center border border-[#0B1B3A]/10 overflow-hidden">
                    {course.instructor_image_url ? (
                      <Image
                        src={course.instructor_image_url}
                        alt={course.instructor_name}
                        fill
                        className="object-cover"
                        sizes="112px"
                      />
                    ) : (
                      <span className="font-display text-2xl font-bold text-white">
                        {initials(course.instructor_name)}
                      </span>
                    )}
                  </div>
                </CornerFrame>
                <div>
                  <h3 className="font-display text-xl font-bold text-[#0B1B3A]">{course.instructor_name}</h3>
                  <div className="flex flex-wrap items-center gap-2 mt-3">
                    <span className="font-mono text-[10px] uppercase tracking-widest text-[#1E3A8A] bg-[#1E3A8A]/10 px-2 py-1">
                      {course.category} Instructor
                    </span>
                    <span className="font-mono text-[10px] uppercase tracking-widest text-[#0B1B3A]/60 border border-[#0B1B3A]/20 px-2 py-1">
                      Industry Practitioner
                    </span>
                  </div>
                  <p className="text-base text-[#0B1B3A]/70 mt-4 leading-relaxed whitespace-pre-line max-w-2xl">
                    {course.tutor_bio ||
                      "Brings practical, field-tested experience into every class — teaching the workflows actually used on the job, not just the underlying theory."}
                  </p>
                </div>
              </div>
            </section>
          )}

          {/* Reviews Flow */}
          {reviews.length > 0 && (
            <section className="border-y border-dashed border-[#0B1B3A]/15 bg-white py-14">
              <div className="mx-auto mb-6 px-6 lg:px-12">
                <h2 className="font-display text-xl sm:text-2xl font-bold text-[#0B1B3A]">
                  Hear from Past Students
                </h2>
                <p className="mt-2 text-sm text-[#0B1B3A]/70">
                  Genuine experiences from our physical classroom batches.
                </p>
              </div>
              <ReviewsMarquee reviews={reviews} />
            </section>
          )}

          {/* FAQ */}
          <section className="px-6 lg:px-12 py-14 bg-[#F5F8FF]">
            <h2 className="font-display text-xl sm:text-2xl font-bold mb-8">Frequently Asked Questions</h2>
            <div className="max-w-2xl border-t border-dashed border-[#0B1B3A]/15">
              {FAQ_ITEMS.map((item, i) => (
                <div key={i} className="border-b border-dashed border-[#0B1B3A]/15">
                  <button
                    className="w-full flex items-center justify-between gap-4 py-5 text-left group"
                    aria-expanded={false}
                    onClick={(e) => {
                      const ans = e.currentTarget.nextElementSibling;
                      if (ans) ans.classList.toggle('hidden');
                      const icon = e.currentTarget.querySelector('svg');
                      if (icon) icon.classList.toggle('rotate-180');
                    }}
                  >
                    <span className="text-sm font-semibold text-[#0B1B3A] group-hover:text-[#1E3A8A] transition-colors">{item.q}</span>
                    <ChevronDown className="w-4 h-4 text-[#0B1B3A]/40 shrink-0 transition-transform" />
                  </button>
                  <div className="hidden pb-5 text-sm text-[#0B1B3A]/70 leading-relaxed pr-8">
                    {item.a}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Closing Band */}
          <section className="px-6 lg:px-12 py-20 bg-[#0B1B3A] text-white flex flex-col items-center text-center border-t-4 border-[#1E3A8A]">
            <h2 className="font-display text-2xl sm:text-3xl font-bold mb-4">
              Ready to start building?
            </h2>
            <p className="text-white/60 max-w-lg mx-auto mb-10">
              Join the next cohort and turn concepts into practical, job-ready skills under expert guidance.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <button
                onClick={() => setShowInstantModal(true)}
                className="inline-flex items-center gap-2 px-8 py-4 bg-[#F97316] text-white font-mono text-[13px] uppercase tracking-widest font-bold hover:bg-[#EA580C] transition-colors"
              >
                Enroll Now <ArrowRight className="w-4 h-4" />
              </button>
              <a
                href={`https://wa.me/${WHATSAPP_NUMBER}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-8 py-4 border border-white/20 text-white font-mono text-[13px] uppercase tracking-widest hover:bg-white/5 transition-colors"
              >
                <MessageCircle className="w-4 h-4" /> Ask a Question
              </a>
            </div>
          </section>
        </div>

        {/* Sidebar Summary */}
        <aside className="hidden lg:block border-l border-dashed border-[#0B1B3A]/15 bg-[#F5F8FF]">
          <div className="sticky top-6 p-6 space-y-6">
            <div className="bg-white border border-[#0B1B3A]/15 shadow-sm">
              <div className="bg-[#F5F8FF] border-b border-[#0B1B3A]/15 px-6 py-4 flex items-center justify-between">
                <span className="font-mono text-[11px] tracking-widest text-[#0B1B3A]/60 uppercase">Enrollment</span>
                <TitleBlockChip code="FEE-SMRY" batch={course.batch_no} />
              </div>
              <div className="p-6">
                <PriceBlock course={course} size="md" />
                <div className="mt-6 mb-6">
                  <SeatsBar course={course} animate={statsInView} />
                </div>
                
                <div className="space-y-4 mb-8">
                  <div className="flex items-center justify-between text-sm pb-3 border-b border-dashed border-[#0B1B3A]/10">
                    <span className="text-[#0B1B3A]/60">Cohort Starts</span>
                    <span className="font-semibold text-[#0B1B3A]">{formatDate(course.start_date)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm pb-3 border-b border-dashed border-[#0B1B3A]/10">
                    <span className="text-[#0B1B3A]/60">Duration</span>
                    <span className="font-semibold text-[#0B1B3A]">
                      {course.duration_weeks ? `${course.duration_weeks} weeks` : "—"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#0B1B3A]/60">Timing</span>
                    <span className="font-semibold text-[#0B1B3A] text-right">{course.timing || "TBA"}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={() => setShowInstantModal(true)}
                    className="w-full inline-flex items-center justify-center gap-2 px-5 py-4 bg-[#F97316] text-white font-mono text-[12px] uppercase tracking-widest font-bold hover:bg-[#EA580C] transition-colors"
                  >
                    Reserve Seat <ArrowRight className="w-4 h-4" />
                  </button>
                  <a
                    href={`https://wa.me/${WHATSAPP_NUMBER}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center gap-2 px-5 py-4 border border-[#0B1B3A]/20 text-[#0B1B3A] font-mono text-[12px] uppercase tracking-widest hover:bg-[#0B1B3A]/5 transition-colors"
                  >
                    <MessageCircle className="w-4 h-4" /> Chat on WhatsApp
                  </a>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </main>

      {/* Mobile Sticky CTA */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-20 bg-white border-t border-[#0B1B3A]/15 p-4 shadow-[0_-10px_30px_rgba(11,27,58,0.05)]">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="font-display font-bold text-sm text-[#0B1B3A] truncate">
              {course.title}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-[#0B1B3A]/60">
              <span className="font-mono text-[10px] uppercase tracking-widest">Starts {formatDateShort(course.start_date)}</span>
            </div>
          </div>
          <button
            onClick={() => setShowInstantModal(true)}
            className="inline-flex items-center gap-2 px-6 py-3.5 bg-[#F97316] text-white font-mono text-[12px] uppercase tracking-widest font-bold hover:bg-[#EA580C] transition-colors shrink-0"
          >
            Enroll <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {activeVideo && (
          <VideoModal
            videoUrl={activeVideo.url}
            title={activeVideo.title}
            onClose={() => setActiveVideo(null)}
          />
        )}
      </AnimatePresence>
      
      {showInstantModal && (
        <InstantBookingModal
          courseTitle={course.title}
          bookingAmount={bookingAmount}
          websitePrice={websitePrice}
          onClose={() => setShowInstantModal(false)}
          onSubmit={handleInstantBookingSubmit}
        />
      )}
    </div>
  );
}