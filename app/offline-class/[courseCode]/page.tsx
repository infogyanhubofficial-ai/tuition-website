"use client";

/**
 * GyanHub — Physical Course Detail Page
 * Route: /offline-class/[courseCode]
 *
 * Self-contained per Nischal's convention: all types, helpers, sub-components,
 * and data-fetching are inlined here. No shared utils imported.
 *
 * This page's single job is to build enough trust that the visitor fills in
 * the "Reserve Your Seat" form further down this same page. Every CTA on
 * the page (hero, pricing, sidebar, mobile bar, final CTA) is an in-page
 * anchor link to #reserve-seat — there is no separate /enroll route.
 * Submitting the form inserts a row directly into public.physical_leads
 * (see ReserveSeatForm), so every submission is a lead the sales/counselor
 * team can follow up on and move through status: new → contacted →
 * interested → follow_up → booked → deposit_paid → enrolled.
 *
 * INSTANT BOOKING OFFER
 * ----------------------
 * A separate, time-pressure-flavoured upsell from the plain lead form:
 * discount_price (or price) × 0.8 → instant booking price, × 0.10 →
 * today's deposit. Clicking its CTA does NOT scroll to #reserve-seat —
 * it opens a tiny modal for name/email/WhatsApp, then redirects to
 * /order with `price` set to the deposit and `locked_price` set to the
 * full instant booking price, so the order page can track the remaining
 * balance as pending. 
 */

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from "@supabase/supabase-js";
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
  Globe,
  MessageCircle,
  ChevronDown,
  Compass,
  Ruler,
  PenTool,
  Layers,
  Building2,
  GraduationCap,
  ShieldCheck,
  FileWarning,
  X,
  Flame,
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

const OUTCOME_ICONS = [Compass, Ruler, PenTool, Layers, Globe, Building2, ShieldCheck, GraduationCap];

const WHATSAPP_NUMBER = "9779763695665";

const FAQ_ITEMS = [
  { q: "Do I need prior experience to join this course?", a: "No prior experience is required for most classes. The course is structured to take you from the fundamentals to practical, job-ready workflows step by step." },
  { q: "Is a laptop required for the classes?", a: "Yes, a laptop is required for the practical sessions. If you don't have one, reach out to us before enrolling and we'll help you plan around it." },
  { q: "Will I get access to class recordings?", a: "Yes, every enrolled student gets recordings of all live sessions, so you can revisit any topic at your own pace." },
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

function SeatsBar({ course, animate }: { course: PhysicalCourse; animate: boolean }) {
  const max = course.max_seats ?? 30;
  const enrolled = course.enrolled_count ?? 0;
  const remaining = seatsRemaining(course);
  const animatedEnrolled = useCountUp(enrolled, 800, animate);
  const filledPct = max > 0 ? Math.min((enrolled / max) * 100, 100) : 0;

  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1.5">
        <span className="font-medium text-[#0B1B3A]/60">
          {animatedEnrolled} / {max} enrolled
        </span>
        <span className={`font-semibold ${remaining <= 5 ? "text-[#FF7A18]" : "text-[#1E3A8A]"}`}>
          {remaining} seats left
        </span>
      </div>
      <div className="h-2 w-full rounded-full bg-[#0B1B3A]/8 overflow-hidden">
        <div
          className="h-full rounded-full bg-[#1E3A8A] transition-all duration-700 ease-out"
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
        <span className={`text-[#0B1B3A]/35 line-through ${small}`}>{formatNPR(course.price)}</span>
      )}
      {discPct !== null && (
        <span className="text-xs font-semibold text-[#FF7A18] bg-[#FF7A18]/10 px-2.5 py-1 rounded-full">
          Save {discPct}%
        </span>
      )}
    </div>
  );
}

function ReserveSeatForm({ course, courseCode }: { course: PhysicalCourse; courseCode: string }) {
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    email: "",
    currentEducation: "",
    institutionName: "",
    remarks: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  function update(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMsg(null);

    if (!form.fullName.trim() || !form.phone.trim()) {
      setErrorMsg("Please share your name and phone number so we can reach you.");
      return;
    }

    const fullName = form.fullName.trim();
    const phone = form.phone.trim();

    setSubmitting(true);

    try {
      const { data: currentCourse } = await supabase
        .from("physicalcourses")
        .select("start_date")
        .eq("id", course.id)
        .single();

      const startDate = currentCourse?.start_date ?? course.start_date ?? null;

      const { data: existingLead, error: lookupError } = await supabase
        .from("physical_leads")
        .select("id, remarks")
        .eq("course_id", course.id)
        .eq("phone", phone)
        .maybeSingle();

      if (lookupError) {
        console.error("[ReserveSeatForm] Lookup error:", lookupError.message);
      }

      if (existingLead) {
        const mergedRemarks = form.remarks.trim()
          ? existingLead.remarks
            ? `${existingLead.remarks} | ${form.remarks.trim()}`
            : form.remarks.trim()
          : existingLead.remarks;

        const { error: updateError } = await supabase
          .from("physical_leads")
          .update({
            updated_at: new Date().toISOString(),
            remarks: mergedRemarks,
          })
          .eq("id", existingLead.id);

        if (updateError) {
          console.error("[ReserveSeatForm] Update error:", updateError.message);
          setErrorMsg("Something went wrong updating your details. Please try again, or message us on WhatsApp instead.");
          setSubmitting(false);
          return;
        }
      } else {
        const { error: insertError } = await supabase.from("physical_leads").insert({
          course_id: course.id,
          course_code: course.course_code ?? courseCode,
          start_date: startDate,
          course_title: course.title,
          category: course.category,
          full_name: fullName,
          phone,
          email: form.email.trim() || null,
          current_education: form.currentEducation.trim() || null,
          institution_name: form.institutionName.trim() || null,
          office_location: course.location || "New Baneshwor",
          course_price: course.price,
          discount_price: course.discount_price ?? null,
          remarks: form.remarks.trim() || null,
          source: "Website",
        });

        if (insertError) {
          console.error("[ReserveSeatForm] Insert error:", insertError.message);
          setErrorMsg("Something went wrong submitting your details. Please try again, or message us on WhatsApp instead.");
          setSubmitting(false);
          return;
        }
      }

      setSubmitting(false);
      setSubmitted(true);
    } catch (err) {
      console.error("[ReserveSeatForm] Unexpected error:", err);
      setErrorMsg("Something went wrong submitting your details. Please try again, or message us on WhatsApp instead.");
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="max-w-md rounded-2xl border border-[#0B1B3A]/10 bg-white p-8 text-center">
        <div className="w-14 h-14 rounded-full bg-[#1E3A8A]/10 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-7 h-7 text-[#1E3A8A]" />
        </div>
        <h3 className="font-display text-lg font-bold text-[#0B1B3A] mb-2">Seat request received</h3>
        <p className="text-sm text-[#0B1B3A]/60 mb-5">
          Our counselor will call or message you on <span className="font-medium text-[#0B1B3A]">{form.phone}</span> shortly to confirm your seat and next steps.
        </p>
        <a
          href={`https://wa.me/${WHATSAPP_NUMBER}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm font-medium text-[#1E3A8A] hover:underline"
        >
          <MessageCircle className="w-4 h-4" /> Or message us on WhatsApp now
        </a>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-md rounded-2xl border border-[#0B1B3A]/10 bg-white p-7 shadow-sm space-y-4"
    >
      <div>
        <label className="block text-xs font-medium text-[#0B1B3A]/60 mb-1.5">Full Name *</label>
        <input
          type="text"
          required
          value={form.fullName}
          onChange={(e) => update("fullName", e.target.value)}
          className="w-full rounded-lg border border-[#0B1B3A]/15 px-3.5 py-2.5 text-sm text-[#0B1B3A] focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30"
          placeholder="Your full name"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-[#0B1B3A]/60 mb-1.5">Phone Number *</label>
        <input
          type="tel"
          required
          value={form.phone}
          onChange={(e) => update("phone", e.target.value)}
          className="w-full rounded-lg border border-[#0B1B3A]/15 px-3.5 py-2.5 text-sm text-[#0B1B3A] focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30"
          placeholder="98XXXXXXXX"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-[#0B1B3A]/60 mb-1.5">Email</label>
        <input
          type="email"
          value={form.email}
          onChange={(e) => update("email", e.target.value)}
          className="w-full rounded-lg border border-[#0B1B3A]/15 px-3.5 py-2.5 text-sm text-[#0B1B3A] focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30"
          placeholder="you@example.com"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-[#0B1B3A]/60 mb-1.5">Current Education</label>
        <select
          value={form.currentEducation}
          onChange={(e) => update("currentEducation", e.target.value)}
          className="w-full rounded-lg border border-[#0B1B3A]/15 px-3.5 py-2.5 text-sm text-[#0B1B3A] bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30"
        >
          <option value="">Select</option>
          <option value="+2 / High School">+2 / High School</option>
          <option value="Bachelor's">Bachelor&apos;s</option>
          <option value="Master's">Master&apos;s</option>
          <option value="Working Professional">Working Professional</option>
          <option value="Other">Other</option>
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-[#0B1B3A]/60 mb-1.5">Institution Name</label>
        <input
          type="text"
          value={form.institutionName}
          onChange={(e) => update("institutionName", e.target.value)}
          className="w-full rounded-lg border border-[#0B1B3A]/15 px-3.5 py-2.5 text-sm text-[#0B1B3A] focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30"
          placeholder="Your college / school"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-[#0B1B3A]/60 mb-1.5">Anything we should know?</label>
        <textarea
          value={form.remarks}
          onChange={(e) => update("remarks", e.target.value)}
          rows={2}
          className="w-full rounded-lg border border-[#0B1B3A]/15 px-3.5 py-2.5 text-sm text-[#0B1B3A] focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30 resize-none"
          placeholder="Optional"
        />
      </div>

      {errorMsg && <p className="text-xs text-[#FF7A18] font-medium">{errorMsg}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[#FF7A18] text-white font-semibold hover:bg-[#e86c0f] transition-colors disabled:opacity-60"
      >
        {submitting ? "Submitting…" : "Confirm My Seat"} <ArrowRight className="w-4 h-4" />
      </button>
      <p className="text-[11px] text-center text-[#0B1B3A]/40">
        Our counselor will reach out to confirm seat availability and payment.
      </p>
    </form>
  );
}

function InstantBookingOfferCard({
  course,
  seatsLeft,
  websitePrice,
  instantBookingPrice,
  bookingAmount,
  variant,
  onDismiss,
  onReserve,
}: {
  course: PhysicalCourse;
  seatsLeft: number;
  websitePrice: number;
  instantBookingPrice: number;
  bookingAmount: number;
  variant: "desktop" | "mobile";
  onDismiss?: () => void;
  onReserve: () => void;
}) {
  return (
    <div
      className={`gh-instant-card-enter relative bg-white rounded-[20px] shadow-lg border border-[#FF7A18]/25 p-5 ${
        variant === "desktop" ? "gh-instant-shadow-pulse" : ""
      }`}
    >
      {variant === "mobile" && onDismiss && (
        <button
          onClick={onDismiss}
          aria-label="Dismiss offer"
          className="absolute top-3 right-3 w-6 h-6 rounded-full bg-[#0B1B3A]/5 flex items-center justify-center text-[#0B1B3A]/40 hover:bg-[#0B1B3A]/10 hover:text-[#0B1B3A]/70 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}

      <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wide text-[#FF7A18] bg-[#FF7A18]/10 px-2 py-1 rounded-full">
        Limited Time
      </span>

      <h3 className="mt-2.5 text-sm font-bold text-[#0B1B3A]">🔥 Instant Booking Offer</h3>
      <p className="mt-1 text-xs text-[#0B1B3A]/55 leading-snug pr-4">
        Reserve your seat today and unlock an exclusive website booking discount.
      </p>

      <p className="mt-2.5 text-[11px] font-semibold text-[#FF7A18]">
        {seatsLeft > 0 ? `Only ${seatsLeft} seat${seatsLeft === 1 ? "" : "s"} remaining` : "Waitlist open"}
      </p>

      <div className="mt-4">
        <p className="text-sm font-semibold text-[#0B1B3A]">Book Your Seat Today</p>
        <p className="text-sm font-semibold text-[#FF7A18]">Get an EXTRA 20% OFF</p>
      </div>

      <div className="mt-4 space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-[#0B1B3A]/45">Original Price</span>
          <span className="text-[#0B1B3A]/40 line-through">{formatNPR(course.price)}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-[#0B1B3A]/45">Website Price</span>
          <span className="font-semibold text-[#1E3A8A]">{formatNPR(websitePrice)}</span>
        </div>
        <div className="flex items-center justify-between pt-2 mt-1 border-t border-dashed border-[#0B1B3A]/10">
          <span className="text-xs font-medium text-[#0B1B3A]/60">Instant Booking Price</span>
          <span className="text-2xl font-display font-bold text-[#FF7A18]">{formatNPR(instantBookingPrice)}</span>
        </div>
      </div>

      <div className="mt-4 bg-[#F5F8FF] border border-[#1E3A8A]/10 rounded-xl p-3">
        <p className="text-[11px] text-[#0B1B3A]/60 leading-snug">
          Only 10% payment is required today to reserve your seat. Pay the remaining amount on or before Day 2 of
          the class.
        </p>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-[11px] font-medium text-[#0B1B3A]/50">Today&apos;s Booking Amount</span>
          <span className="text-base font-bold text-[#1E3A8A]">{formatNPR(bookingAmount)}</span>
        </div>
      </div>

      <ul className="mt-4 space-y-1.5">
        {[
          "Extra 20% website booking discount",
          "Seat reserved immediately",
          "Lock today's discounted price",
          "Only 10% payment today",
          "Remaining payment by Day 2 of class",
        ].map((b, i) => (
          <li key={i} className="flex items-start gap-1.5 text-xs text-[#0B1B3A]/65">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#1E3A8A] shrink-0 mt-0.5" /> {b}
          </li>
        ))}
      </ul>

      <button
        onClick={onReserve}
        className="gh-instant-cta-pulse mt-4 w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#FF7A18] text-white text-sm font-semibold hover:bg-[#e86c0f] transition-colors"
      >
        Reserve Seat & Claim Offer <ArrowRight className="w-4 h-4" />
      </button>
      <a
        href={`https://wa.me/${WHATSAPP_NUMBER}`}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2 block text-center text-xs font-medium text-[#0B1B3A]/50 hover:text-[#1E3A8A]"
      >
        Chat on WhatsApp
      </a>
    </div>
  );
}

function InstantBookingModal({
  courseTitle,
  bookingAmount,
  instantBookingPrice,
  onClose,
  onSubmit,
}: {
  courseTitle: string;
  bookingAmount: number;
  instantBookingPrice: number;
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
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
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
      <div className="bg-white rounded-2xl p-6 sm:p-7 max-w-sm w-full shadow-xl relative">
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 w-7 h-7 rounded-full bg-[#0B1B3A]/5 flex items-center justify-center text-[#0B1B3A]/40 hover:bg-[#0B1B3A]/10 hover:text-[#0B1B3A]/70 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wide text-[#FF7A18] bg-[#FF7A18]/10 px-2 py-1 rounded-full">
          Limited Time
        </span>
        <h3 className="mt-2.5 text-lg font-display font-bold text-[#0B1B3A]">Claim Your Instant Booking Price</h3>
        <p className="mt-1 text-sm text-[#0B1B3A]/55 leading-snug">
          Share your details and we&apos;ll take you to a secure page to pay {formatNPR(bookingAmount)} today and
          lock in {formatNPR(instantBookingPrice)} for {courseTitle}.
        </p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-3.5">
          <div>
            <label className="block text-xs font-medium text-[#0B1B3A]/60 mb-1.5">Full Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-[#0B1B3A]/15 px-3.5 py-2.5 text-sm text-[#0B1B3A] focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30"
              placeholder="Your full name"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#0B1B3A]/60 mb-1.5">Email *</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-[#0B1B3A]/15 px-3.5 py-2.5 text-sm text-[#0B1B3A] focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#0B1B3A]/60 mb-1.5">WhatsApp Number *</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-lg border border-[#0B1B3A]/15 px-3.5 py-2.5 text-sm text-[#0B1B3A] focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30"
              placeholder="98XXXXXXXX"
            />
          </div>

          {error && <p className="text-xs text-[#FF7A18] font-medium">{error}</p>}

          <button
            type="submit"
            disabled={redirecting}
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[#FF7A18] text-white font-semibold hover:bg-[#e86c0f] transition-colors disabled:opacity-60"
          >
            {redirecting ? "Redirecting…" : "Continue to Payment"} <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}

export default function OfflineCourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const courseCode = decodeURIComponent(String(params?.courseCode ?? ""));

  const [course, setCourse] = useState<PhysicalCourse | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [statsInView, setStatsInView] = useState(false);
  const [showInstantModal, setShowInstantModal] = useState(false);
  const [offerExpanded, setOfferExpanded] = useState(false);

  useEffect(() => {
    let active = true;
    async function fetchCourse() {
      setLoading(true);
      setNotFound(false);
      const { data, error } = await supabase
        .from("physicalcourses")
        .select("*")
        .eq("course_code", courseCode)
        .eq("is_active", true)
        .maybeSingle();

      if (!active) return;
      if (error || !data) {
        setNotFound(true);
        setCourse(null);
      } else {
        setCourse(data as PhysicalCourse);
      }
      setLoading(false);
    }
    if (courseCode) fetchCourse();
    return () => {
      active = false;
    };
  }, [courseCode]);

  useEffect(() => {
    const timeout = setTimeout(() => setStatsInView(true), 250);
    return () => clearTimeout(timeout);
  }, [loading]);

  const outcomes = useMemo(() => (course ? extractOutcomes(course) : []), [course]);
  const seatsLeft = course ? seatsRemaining(course) : 0;
  const statusLabel = course ? resolveStatusLabel(course.status) : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F8FF] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-full border-4 border-[#1E3A8A]/15 border-t-[#1E3A8A] animate-spin" />
          <p className="font-mono text-xs tracking-[0.2em] text-[#0B1B3A]/50 uppercase">
            Loading course details…
          </p>
        </div>
      </div>
    );
  }

  if (notFound || !course) {
    return (
      <div className="min-h-screen bg-[#F5F8FF] flex items-center justify-center px-6">
        <div className="max-w-md w-full text-center bg-white border border-[#0B1B3A]/10 rounded-2xl p-10 shadow-sm">
          <div className="w-16 h-16 rounded-full bg-[#FF7A18]/10 flex items-center justify-center mx-auto mb-5">
            <FileWarning className="w-8 h-8 text-[#FF7A18]" strokeWidth={1.75} />
          </div>
          <h1 className="font-semibold text-xl text-[#0B1B3A] mb-2">
            This course sheet isn&apos;t on file
          </h1>
          <p className="text-sm text-[#0B1B3A]/60 mb-6">
            We couldn&apos;t find an active offline course with the code{" "}
            <span className="font-mono text-[#0B1B3A]">{courseCode}</span>. It may have ended or the
            link may be outdated.
          </p>
          <button
            onClick={() => router.push("/offline-classes")}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#1E3A8A] text-white text-sm font-medium hover:bg-[#16295e] transition-colors"
          >
            Browse all offline courses <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  const heroImage = course.course_image_url || null;

  const classDetails = [
    { icon: MapPin, label: "Location", value: course.location || "New Baneshwor, Kathmandu" },
    { icon: Clock, label: "Timing", value: course.timing || "To be announced" },
    { icon: Laptop, label: "Laptop", value: "Required for practicals" },
    { icon: Wifi, label: "Internet", value: "Provided in class" },
    { icon: Car, label: "Parking", value: "Available nearby" },
    { icon: Award, label: "Certificate", value: "Included on completion" },
  ];

  const websitePrice = course.discount_price ?? course.price;
  const instantBookingPrice = Math.round(websitePrice * 0.8);
  const bookingAmount = Math.round(instantBookingPrice * 0.1);

  async function handleInstantBookingSubmit(details: { name: string; email: string; phone: string }) {
    const { data: currentCourse } = await supabase
      .from("physicalcourses")
      .select("start_date")
      .eq("id", course!.id)
      .single();

    const { data: existingLead } = await supabase
      .from("physical_leads")
      .select("id, remarks")
      .eq("course_id", course!.id)
      .eq("phone", details.phone)
      .maybeSingle();

    if (existingLead) {
      const updatedRemarks = existingLead.remarks 
        ? `${existingLead.remarks} | Upgraded to Instant Booking` 
        : "Upgraded to Instant Booking";

      const { error } = await supabase
        .from("physical_leads")
        .update({
          discount_price: instantBookingPrice,
          remarks: updatedRemarks,
        })
        .eq("id", existingLead.id);

      if (error) console.error("Error updating physical lead record:", error);
    } else {
      const { error } = await supabase.from("physical_leads").insert({
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
        discount_price: instantBookingPrice,
        source: "Website",
        status: "new",
        remarks: "Initiated Instant Booking (Order Type: Offline Course)",
      });

      if (error) console.error("Error creating physical lead record:", error);
    }

    const params = new URLSearchParams({
      type: "course",
      order_type: "Offline Course",
      courseName: course!.title,
      price: String(bookingAmount),
      locked_price: String(instantBookingPrice),
      name: details.name,
      email: details.email,
      phone: details.phone,
    });
    router.push(`/order?${params.toString()}`);
  }

  return (
    <div className="min-h-screen bg-[#F5F8FF] text-[#0B1B3A] font-sans pb-24 lg:pb-0">
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes ghInstantCardIn {
              from { opacity: 0; transform: scale(0.95); }
              to { opacity: 1; transform: scale(1); }
            }
            @keyframes ghInstantShadowPulse {
              0%, 100% { box-shadow: 0 10px 25px -10px rgba(255,122,24,0.15); }
              50% { box-shadow: 0 12px 32px -8px rgba(255,122,24,0.32); }
            }
            @keyframes ghInstantCtaPulse {
              0%, 100% { transform: scale(1); }
              50% { transform: scale(1.02); }
            }
            .gh-instant-card-enter {
              animation: ghInstantCardIn 0.4s ease-out both;
            }
            .gh-instant-shadow-pulse {
              animation: ghInstantShadowPulse 4s ease-in-out infinite;
            }
            .gh-instant-cta-pulse {
              animation: ghInstantCtaPulse 2.4s ease-in-out infinite;
            }
            @keyframes ghFlamePulse {
              0%, 100% { transform: scale(1) rotate(0deg); }
              50% { transform: scale(1.15) rotate(-4deg); }
            }
            @keyframes ghBarGlow {
              0%, 100% { box-shadow: 0 6px 20px -6px rgba(255,122,24,0.35); }
              50% { box-shadow: 0 8px 28px -4px rgba(255,122,24,0.55); }
            }
            .gh-flame-pulse {
              display: inline-block;
              animation: ghFlamePulse 1.6s ease-in-out infinite;
            }
            .gh-bar-glow {
              animation: ghBarGlow 2.6s ease-in-out infinite;
            }
            @media (prefers-reduced-motion: reduce) {
              .gh-instant-card-enter, .gh-instant-shadow-pulse, .gh-instant-cta-pulse,
              .gh-flame-pulse, .gh-bar-glow {
                animation: none !important;
              }
            }
          `,
        }}
      />
      <main className="grid lg:grid-cols-[1fr_360px] gap-0 max-w-[1400px] mx-auto">
        
        <div className="lg:hidden sticky top-0 z-[60] col-span-full flex flex-col max-h-[85vh]">
          <button
            onClick={() => setOfferExpanded(!offerExpanded)}
            className="gh-bar-glow w-full flex items-center justify-between gap-3 px-4 py-3.5 bg-gradient-to-r from-[#FF7A18] to-[#FF9A4D] border-b-2 border-[#e86c0f]/40 text-left"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="gh-flame-pulse text-xl leading-none shrink-0">🔥</span>
              <div className="min-w-0">
                <div className="text-[13px] font-extrabold text-white uppercase tracking-wide leading-tight">
                  Instant Booking Offer
                </div>
                <div className="text-[11px] font-medium text-white/85 leading-tight">
                  Extra 20% off — reserve now
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <div className="flex flex-col items-end leading-tight">
                <span className="text-base font-extrabold text-white">{formatNPR(instantBookingPrice)}</span>
                <span className="text-[10px] font-semibold text-white/80">Save 20%</span>
              </div>
              <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                <ChevronDown
                  className={`w-4 h-4 text-white transition-transform ${offerExpanded ? "rotate-180" : ""}`}
                />
              </div>
            </div>
          </button>

          {offerExpanded && (
            <div className="overflow-y-auto p-4 bg-[#F5F8FF]">
              <InstantBookingOfferCard
                course={course}
                seatsLeft={seatsLeft}
                websitePrice={websitePrice}
                instantBookingPrice={instantBookingPrice}
                bookingAmount={bookingAmount}
                variant="mobile"
                onReserve={() => {
                  setOfferExpanded(false);
                  setShowInstantModal(true);
                }}
              />
            </div>
          )}
        </div>

        <div className="min-w-0">
          <section className="px-6 lg:px-12 pt-10 lg:pt-14 pb-10">
            <div className="grid lg:grid-cols-[1.05fr_0.95fr] gap-10 items-start">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <span className="font-mono text-[11px] tracking-wider text-[#1E3A8A]/70 bg-[#1E3A8A]/8 px-2.5 py-1 rounded-md">
                    {course.course_code ?? "GH-000"}
                  </span>
                  <span className="text-[11px] uppercase tracking-wider text-[#0B1B3A]/45 font-medium">
                    {course.category}
                  </span>
                  {statusLabel && (
                    <span className="text-[11px] font-semibold text-[#1E3A8A] bg-white border border-[#1E3A8A]/15 px-2.5 py-1 rounded-full ml-auto lg:ml-0">
                      {statusLabel}
                    </span>
                  )}
                </div>

                <h1 className="font-display text-3xl sm:text-4xl lg:text-[2.75rem] leading-[1.1] font-bold tracking-tight text-[#0B1B3A]">
                  {course.title}
                </h1>

                {course.instructor_name && (
                  <p className="mt-2 text-sm text-[#0B1B3A]/55">
                    Taught by <span className="font-medium text-[#0B1B3A]/80">{course.instructor_name}</span>
                  </p>
                )}

                <p className="mt-4 text-base text-[#0B1B3A]/65 leading-relaxed max-w-xl">
                  {course.description ||
                    "Hands-on practical training with real projects, industry tools, recordings, and a certificate on completion."}
                </p>

                <div className="mt-6">
                  <PriceBlock course={course} size="lg" />
                </div>

                <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-lg">
                  {[
                    { icon: Calendar, label: "Starts", value: formatDateShort(course.start_date) },
                    { icon: Layers, label: "Duration", value: course.duration_weeks ? `${course.duration_weeks} wks` : "—" },
                    { icon: Users, label: "Seats left", value: `${seatsLeft}` },
                  ].map((f, i) => (
                    <div key={i} className="bg-white rounded-lg border border-[#0B1B3A]/8 px-3 py-2.5">
                      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-[#0B1B3A]/40 font-medium">
                        <f.icon className="w-3 h-3" /> {f.label}
                      </div>
                      <div className="text-sm font-semibold text-[#0B1B3A] mt-0.5">{f.value}</div>
                    </div>
                  ))}
                </div>

                <div className="mt-7 flex flex-wrap items-center gap-3">
                  <a
                    href="#reserve-seat"
                    className="group inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-[#FF7A18] text-white font-semibold shadow-[0_8px_24px_-8px_rgba(255,122,24,0.6)] hover:bg-[#e86c0f] hover:-translate-y-0.5 transition-all"
                  >
                    Reserve Your Seat
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </a>
                  <a
                    href="#learn"
                    className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl border border-[#0B1B3A]/15 text-[#0B1B3A] font-medium hover:bg-white transition-colors"
                  >
                    What you&apos;ll learn
                  </a>
                </div>
              </div>

              <div className="relative rounded-2xl overflow-hidden border border-[#0B1B3A]/10 shadow-xl bg-[#0B1B3A]/[0.04] aspect-[4/3] p-3">
                {heroImage ? (
                  <div className="relative w-full h-full rounded-xl overflow-hidden bg-white">
                    <Image
                      src={heroImage}
                      alt={course.title}
                      fill
                      className="object-contain"
                      sizes="(max-width: 1024px) 100vw, 45vw"
                      priority
                    />
                  </div>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-3 bg-[#0B1B3A]">
                    <Compass className="w-14 h-14 text-white/25" strokeWidth={1} />
                    <span className="font-mono text-[11px] tracking-widest text-white/40 uppercase">
                      {course.course_code}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </section>

          <section className="px-6 lg:px-12 py-12 bg-white border-y border-[#0B1B3A]/8">
            <h2 className="font-display text-xl sm:text-2xl font-bold mb-6">Class Details</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {classDetails.map((d, i) => (
                <div key={i} className="flex items-start gap-3 bg-[#F5F8FF] rounded-xl border border-[#0B1B3A]/8 p-4">
                  <div className="w-9 h-9 rounded-lg bg-[#1E3A8A]/10 flex items-center justify-center shrink-0">
                    <d.icon className="w-4 h-4 text-[#1E3A8A]" strokeWidth={1.75} />
                  </div>
                  <div>
                    <div className="text-[11px] uppercase tracking-wide text-[#0B1B3A]/40 font-medium">{d.label}</div>
                    <div className="text-sm font-semibold text-[#0B1B3A] mt-0.5">{d.value}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {outcomes.length > 0 && (
            <section id="learn" className="px-6 lg:px-12 py-14 scroll-mt-20">
              <h2 className="font-display text-xl sm:text-2xl font-bold mb-6">What You&apos;ll Learn</h2>
              <div className="grid sm:grid-cols-2 gap-3 max-w-4xl">
                {outcomes.map((outcome, i) => {
                  const Icon = OUTCOME_ICONS[i % OUTCOME_ICONS.length];
                  return (
                    <div
                      key={i}
                      className="flex items-start gap-3 bg-white rounded-xl border border-[#0B1B3A]/8 px-4 py-3.5"
                    >
                      <div className="w-7 h-7 rounded-md bg-[#1E3A8A]/10 flex items-center justify-center shrink-0 mt-0.5">
                        <Icon className="w-3.5 h-3.5 text-[#1E3A8A]" strokeWidth={2} />
                      </div>
                      <p className="text-sm text-[#0B1B3A]/80 leading-snug pt-0.5">{outcome}</p>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {course.instructor_name && (
            <section className="px-6 lg:px-12 py-14 bg-white border-y border-[#0B1B3A]/8">
              <h2 className="font-display text-xl sm:text-2xl font-bold mb-6">Meet Your Instructor</h2>
              <div className="max-w-3xl flex flex-col sm:flex-row gap-6">
                <div className="w-24 h-24 rounded-2xl overflow-hidden bg-[#1E3A8A] shrink-0 relative flex items-center justify-center">
                  {course.instructor_image_url ? (
                    <Image
                      src={course.instructor_image_url}
                      alt={course.instructor_name}
                      fill
                      className="object-cover"
                      sizes="96px"
                    />
                  ) : (
                    <span className="font-display text-2xl font-bold text-white">
                      {initials(course.instructor_name)}
                    </span>
                  )}
                </div>
                <div>
                  <h3 className="font-display text-lg font-bold text-[#0B1B3A]">{course.instructor_name}</h3>
                  <p className="text-sm text-[#1E3A8A] font-medium mt-0.5">{course.category} Instructor</p>
                  <p className="text-sm text-[#0B1B3A]/65 mt-3 leading-relaxed whitespace-pre-line">
                    {course.tutor_bio ||
                      "Brings practical, field-tested experience into every class — teaching the workflows actually used on the job, not just theory."}
                  </p>
                </div>
              </div>
            </section>
          )}

          <section className="px-6 lg:px-12 py-14">
            <h2 className="font-display text-xl sm:text-2xl font-bold mb-6">Course Fee</h2>
            <div className="max-w-md rounded-2xl border border-[#0B1B3A]/10 p-7 shadow-sm bg-white">
              <PriceBlock course={course} size="lg" />
              <div className="mt-5">
                <SeatsBar course={course} animate={statsInView} />
              </div>
              <ul className="mt-5 space-y-2">
                {[
                  "Full class recordings",
                  "Certificate on completion, QR-verified",
                  "Hands-on projects",
                  "Post-class support",
                ].map((inc, i) => (
                  <li key={i} className="flex items-center gap-2.5 text-sm text-[#0B1B3A]/70">
                    <CheckCircle2 className="w-4 h-4 text-[#1E3A8A] shrink-0" /> {inc}
                  </li>
                ))}
              </ul>
              <a
                href="#reserve-seat"
                className="mt-6 w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[#FF7A18] text-white font-semibold hover:bg-[#e86c0f] transition-colors"
              >
                Reserve Your Seat <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </section>

          <section id="reserve-seat" className="px-6 lg:px-12 py-14 bg-white border-y border-[#0B1B3A]/8 scroll-mt-20">
            <h2 className="font-display text-xl sm:text-2xl font-bold mb-2">Reserve Your Seat</h2>
            <p className="text-sm text-[#0B1B3A]/55 mb-6 max-w-md">
              Share your details and our counselor will call to confirm your seat for {course.title}.
            </p>
            <ReserveSeatForm course={course} courseCode={courseCode} />
          </section>

          <section className="px-6 lg:px-12 py-14">
            <h2 className="font-display text-xl sm:text-2xl font-bold mb-6">Frequently Asked Questions</h2>
            <div className="max-w-2xl space-y-3">
              {FAQ_ITEMS.map((item, i) => (
                <div key={i} className="rounded-xl border border-[#0B1B3A]/10 bg-white overflow-hidden">
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
                    aria-expanded={openFaq === i}
                  >
                    <span className="text-sm font-medium text-[#0B1B3A]">{item.q}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-[#0B1B3A]/40 shrink-0 transition-transform ${
                        openFaq === i ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {openFaq === i && (
                    <div className="px-5 pb-4 text-sm text-[#0B1B3A]/60 leading-relaxed">{item.a}</div>
                  )}
                </div>
              ))}
            </div>
          </section>

          <section className="px-6 lg:px-12 py-16 bg-[#0B1B3A] text-white text-center">
            <h2 className="font-display text-2xl sm:text-3xl font-bold mb-3">
              Only {seatsLeft} seats left
            </h2>
            <p className="text-white/60 max-w-md mx-auto mb-8">
              Classes stay small on purpose so training stays practical. Reserve your seat before it fills up.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <a
                href="#reserve-seat"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-[#FF7A18] text-white font-semibold hover:bg-[#e86c0f] transition-colors"
              >
                Reserve My Seat <ArrowRight className="w-4 h-4" />
              </a>
              <a
                href={`https://wa.me/${WHATSAPP_NUMBER}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl border border-white/20 text-white font-medium hover:bg-white/5 transition-colors"
              >
                <MessageCircle className="w-4 h-4" /> Talk to an Advisor
              </a>
            </div>
          </section>
        </div>

        <aside className="hidden lg:block border-l border-[#0B1B3A]/8 bg-white">
          <div className="sticky top-6 p-6 space-y-4">
            <InstantBookingOfferCard
              course={course}
              seatsLeft={seatsLeft}
              websitePrice={websitePrice}
              instantBookingPrice={instantBookingPrice}
              bookingAmount={bookingAmount}
              variant="desktop"
              onReserve={() => setShowInstantModal(true)}
            />
            <div className="rounded-2xl border border-[#0B1B3A]/10 shadow-sm overflow-hidden">
              <div className="bg-[#0B1B3A] text-white px-5 py-4">
                <span className="font-mono text-[11px] tracking-widest text-white/50 uppercase">Course Fee</span>
                <div className="mt-1">
                  <PriceBlock course={course} size="md" />
                </div>
              </div>
              <div className="p-5 space-y-4">
                <SeatsBar course={course} animate={statsInView} />
                <div className="flex items-center justify-between text-sm pt-1">
                  <span className="text-[#0B1B3A]/50">Starts</span>
                  <span className="font-medium text-[#0B1B3A]">{formatDate(course.start_date)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#0B1B3A]/50">Duration</span>
                  <span className="font-medium text-[#0B1B3A]">
                    {course.duration_weeks ? `${course.duration_weeks} weeks` : "—"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#0B1B3A]/50">Timing</span>
                  <span className="font-medium text-[#0B1B3A] text-right">{course.timing || "TBA"}</span>
                </div>
                <a
                  href="#reserve-seat"
                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#FF7A18] text-white font-semibold hover:bg-[#e86c0f] transition-colors"
                >
                  Reserve Your Seat <ArrowRight className="w-4 h-4" />
                </a>
                <a
                  href={`https://wa.me/${WHATSAPP_NUMBER}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-[#25D366]/30 text-[#128C4A] font-medium hover:bg-[#25D366]/5 transition-colors"
                >
                  <MessageCircle className="w-4 h-4" /> Chat on WhatsApp
                </a>
              </div>
            </div>
          </div>
        </aside>
      </main>

      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-20 bg-white border-t border-[#0B1B3A]/10 px-4 py-3 shadow-[0_-4px_20px_-8px_rgba(11,27,58,0.15)]">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="font-display font-bold text-sm text-[#0B1B3A] truncate">
              {course.title}
            </div>
            <div className="flex items-center gap-1.5 mt-0.5 text-[#0B1B3A]/60">
              <Calendar className="w-3.5 h-3.5 shrink-0" />
              <span className="text-[11px] font-medium">Starts {formatDateShort(course.start_date)}</span>
            </div>
          </div>
          <a
            href="#reserve-seat"
            className="inline-flex items-center gap-1.5 px-6 py-3 rounded-xl bg-[#FF7A18] text-white font-semibold text-sm hover:bg-[#e86c0f] transition-colors shrink-0"
          >
            Reserve Seat <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>

      {showInstantModal && (
        <InstantBookingModal
          courseTitle={course.title}
          bookingAmount={bookingAmount}
          instantBookingPrice={instantBookingPrice}
          onClose={() => setShowInstantModal(false)}
          onSubmit={handleInstantBookingSubmit}
        />
      )}
    </div>
  );
}