"use client";

/**
 * MASTER DASHBOARD — app/dashboard/page.tsx
 * ------------------------------------------------------------------
 * Replaces: dashboard/layout.tsx + dashboard/page.tsx + dashboard/physical-classes/page.tsx
 *
 * Architecture follows the "ecosystem, not product-catalog" recommendation:
 * Dashboard → Learning → Achievements → Payments → Support → Account
 *
 * "Physical Classes" is no longer a separate route/page — it is a
 * course TYPE (Online / Offline / Hybrid) rendered inside Learning,
 * alongside online enrollments and recordings.
 * ------------------------------------------------------------------
 */

import React, { useState, useEffect, useMemo, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Home, BookOpen, Award, Receipt, Compass, Phone, LogOut, Menu, X,
  MessageCircle, PlayCircle, ChevronDown, Sparkles, AlertCircle, ShoppingBag,
  Send, SearchX, CheckCircle, Loader2, Clock, MapPin, Video, Lock, Calendar,
  ArrowRight, Crown, Copy, ExternalLink, Settings, User as UserIcon, Info
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";

// =====================================================================
// CONSTANTS / RELATIONS
// =====================================================================

const BUNDLES: Record<string, string[]> = {
  "architectural design": ["AutoCAD Basic to Advanced Course", "Autodesk Revit", "Architectural Visualization: AutoCAD, SketchUp, Enscape & Photoshop"],
  "architectural design bundle": ["AutoCAD Basic to Advanced Course", "Autodesk Revit", "Architectural Visualization: AutoCAD, SketchUp, Enscape & Photoshop"],
  "civil engineering": ["Structural Design and Analysis", "Estimation, Costing & Contract Billing", "Property Valuation"],
  "civil engineering bundle": ["Structural Design and Analysis", "Estimation, Costing & Contract Billing", "Property Valuation"],
  "complete engineering package": ["AutoCAD Basic to Advanced Course", "Autodesk Revit", "Architectural Visualization: AutoCAD, SketchUp, Enscape & Photoshop", "Structural Design and Analysis", "Estimation, Costing & Contract Billing", "Property Valuation", "ArcGIS and Mapping"],
  "complete engineering package bundle": ["AutoCAD Basic to Advanced Course", "Autodesk Revit", "Architectural Visualization: AutoCAD, SketchUp, Enscape & Photoshop", "Structural Design and Analysis", "Estimation, Costing & Contract Billing", "Property Valuation", "ArcGIS and Mapping"],
};

const NAV = [
  { key: "dashboard", label: "Dashboard", icon: Home },
  { key: "learning", label: "Learning", icon: BookOpen, children: ["My Courses", "Recordings"] },
  { key: "achievements", label: "Achievements", icon: Award, children: ["Certificates"] },
  { key: "payments", label: "Payments", icon: Receipt, children: ["Orders", "Invoices"] },
  { key: "support", label: "Support", icon: MessageCircle },
  { key: "account", label: "Account", icon: Settings },
] as const;

type NavKey = typeof NAV[number]["key"];
type CourseType = "online" | "offline" | "recording";

const notDeleted = (rows: any[] | null | undefined) => (rows || []).filter((r) => !r?.is_deleted && !r?.deleted);

interface LearningItem {
  id: string;
  courseType: CourseType;
  title: string;
  status: "confirmed" | "pending" | "rejected";
  batchNo?: number;
  startingDate?: string | null;
  location?: string | null;
  timing?: string | null;
  paidAmount: number;
  remainingAmount: number;
  currentDueToPay: number; 
  isBookingFeeDue?: boolean;
  lockedPrice?: number;
  isFullyPaid: boolean;
  hasUnverifiedPayment: boolean;
  meta?: { tutorName?: string; duration?: string; classroomLink?: string; whatsappLink?: string; recordingLink?: string; original_bundle?: string };
}

// =====================================================================
// SHARED UI COMPONENTS (Polished & Standardized)
// =====================================================================

const Pill = ({ children, variant = "neutral", dot = false }: { children: React.ReactNode, variant?: "neutral" | "brand" | "accent" | "success" | "danger" | "warning", dot?: boolean }) => {
  const styles = {
    neutral: "bg-slate-100 text-slate-700 border-slate-200",
    brand: "bg-[#12203D]/10 text-[#12203D] border-[#12203D]/20",
    accent: "bg-[#F2711C]/10 text-[#F2711C] border-[#F2711C]/20",
    success: "bg-green-50 text-green-700 border-green-200",
    warning: "bg-orange-50 text-orange-700 border-orange-200",
    danger: "bg-red-50 text-red-700 border-red-200",
  };
  
  const dotColors = {
    neutral: "bg-slate-500",
    brand: "bg-[#12203D]",
    accent: "bg-[#F2711C]",
    success: "bg-green-500",
    warning: "bg-orange-500",
    danger: "bg-red-500",
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${styles[variant]}`}>
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotColors[variant]} ${variant === 'success' ? 'animate-pulse' : ''}`} />}
      {children}
    </span>
  );
};

export const StatusBadge = ({ status }: { status: string }) => {
  const normalized = (status || "pending").toLowerCase();
  if (normalized === "verified" || normalized === "confirmed") return <Pill variant="success" dot>Confirmed</Pill>;
  if (normalized === "rejected") return <Pill variant="danger" dot>Rejected</Pill>;
  return <Pill variant="warning" dot>Pending</Pill>;
};

export const SkeletonLoader = () => (
  <div className="w-full space-y-6 animate-pulse">
    <div className="h-48 bg-slate-200 rounded-2xl w-full" />
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="h-32 bg-slate-200 rounded-2xl" />
      <div className="h-32 bg-slate-200 rounded-2xl" />
      <div className="h-32 bg-slate-200 rounded-2xl" />
    </div>
  </div>
);

const Toast = ({ message, type, onClose }: { message: string; type: "success" | "error"; onClose: () => void }) => (
  <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }}
    className="fixed bottom-6 right-6 z-[9999] bg-[#12203D] text-white px-5 py-3 rounded-full shadow-sm flex items-center gap-3">
    {type === "success" ? <CheckCircle className="text-green-400 w-4 h-4" /> : <AlertCircle className="text-red-400 w-4 h-4" />}
    <span className="font-medium text-sm">{message}</span>
    <button onClick={onClose} className="ml-2 text-slate-400 hover:text-white transition-colors"><X size={16} /></button>
  </motion.div>
);

function NavButton({ icon, label, active, onClick }: any) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-3 rounded-full text-sm font-medium transition-colors ${active ? "bg-[#12203D] text-white" : "text-slate-600 hover:bg-slate-100 hover:text-[#12203D]"}`}>
      <div className={`${active ? "text-white" : "text-slate-400"}`}>{icon}</div>
      <span>{label}</span>
    </button>
  );
}

function MobileNavButton({ icon, label, active, onClick }: any) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center gap-1 p-2 min-w-[56px] transition-colors ${active ? "text-[#12203D]" : "text-slate-400"}`}>
      <div className={`p-1.5 rounded-full ${active ? "bg-slate-100" : ""}`}>
        {React.cloneElement(icon, { size: 20 })}
      </div>
      <span className="text-[10px] font-medium tracking-wide">{label}</span>
    </button>
  );
}

// =====================================================================
// PAGE COMPONENT
// =====================================================================

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  // State
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState("");
  const [userName, setUserName] = useState("User");
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  const initialTab = (searchParams.get("tab") as NavKey) || "dashboard";
  const [activeTab, setActiveTab] = useState<NavKey>(initialTab);
  const [learningFilter, setLearningFilter] = useState<"all" | CourseType>("all");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const showToast = (message: string, type: "success" | "error" = "success") => { setToast({ message, type }); setTimeout(() => setToast(null), 4000); };

  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<any[]>([]);
  const [certificates, setCertificates] = useState<any[]>([]);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [recordingsList, setRecordingsList] = useState<any[]>([]);
  const [physicalLeads, setPhysicalLeads] = useState<any[]>([]);
  const [physicalCourses, setPhysicalCourses] = useState<any[]>([]);

  const [orientationData, setOrientationData] = useState<{ link: string; date: string } | null>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<any | null>(null);

  // Hide global header and footer dynamically
  useEffect(() => {
    const style = document.createElement("style");
    style.innerHTML = "header, footer { display: none !important; }";
    document.head.appendChild(style);
    return () => { document.head.removeChild(style); };
  }, []);

  useEffect(() => { document.title = `GyanHub | ${activeTab}`; }, [activeTab]);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login?next=/dashboard"); return; }

      setUserId(user.id);
      setUserEmail(user.email || "");
      setUserName(user.user_metadata?.full_name || user.email?.split("@")[0] || "User");
      setUserAvatar(user.user_metadata?.avatar_url || null);
      setIsLoadingUser(false);

      const uid = user.id;
      const email = user.email || "";

      try {
        const { data: rawOrders } = await supabase.from("orders_v2").select("*").or(`user_id.eq.${uid},email.ilike.${email}`).order("created_at", { ascending: false });
        const fetchedOrders = notDeleted(rawOrders);
        const mappedOrders = fetchedOrders
          .filter((o: any) => (o.paid_amount || 0) > 0 || (o.pending_amount || 0) > 0)
          .map((o: any) => ({
            id: o.id, order_type: o.order_type?.toLowerCase() || "other", order_name: o.order_name,
            paid_amount: o.paid_amount || 0, pending_amount: Number(o.pending_amount) || 0,
            remaining_amount: Number(o.remaining_amount) || 0, locked_price: o.locked_price,
            screenshot_url: o.payment_screenshots?.[0] || "", status: o.status || "pending",
            created_at: o.created_at, enrollment_id: o.enrollment_id, leads_id: o.leads_id, service: o.order_name || "GyanHub Service",
          }));

        const { data: certs } = await supabase.from("certificates").select("*").ilike("email", email);
        setCertificates(notDeleted(certs));

        const { data: recordings } = await supabase.from("recordings").select("*");
        setRecordingsList(notDeleted(recordings));

        const { data: leads } = await supabase.from("physical_leads").select("*").eq("email", email).eq("deleted", false).order("created_at", { ascending: false });
        const finalLeads = notDeleted(leads);
        setPhysicalLeads(finalLeads);

        // Fetch physical courses to get correct starting dates
        const { data: pCourses } = await supabase.from("physicalcourses").select("*");
        setPhysicalCourses(pCourses || []);

        const { data: rawEnrolls } = await supabase.from("enrollments_v2").select("*").or(`user_id.eq.${uid},email.ilike.${email}`).order("created_at", { ascending: false });
        const enrollsV2 = notDeleted(rawEnrolls);

        let finalMappedEnrollments: any[] = [];
        if (enrollsV2.length > 0) {
          const batchIds = Array.from(new Set(enrollsV2.map((e: any) => e.batch_id)));
          const { data: rawBatches } = await supabase.from("course_batches_v2").select("*").in("id", batchIds);
          const batchesV2 = notDeleted(rawBatches);
          const relatedSyllabusIds: string[] = [];
          batchesV2.forEach((b: any) => { if (b.syllabus_id) relatedSyllabusIds.push(b.syllabus_id); if (b.course_id) relatedSyllabusIds.push(b.course_id); });
          
          const { data: rawCourses } = await supabase.from("online_courses_v2").select("*");
          const coursesV2 = notDeleted(rawCourses);
          const { data: rawSyllabi } = await supabase.from("syllabi_v2").select("*").in("id", relatedSyllabusIds);
          const syllabiV2 = notDeleted(rawSyllabi);
          
          const tutorIds = [...new Set(syllabiV2.map((s: any) => s.tutor_id).filter(Boolean))];
          const { data: tutorsData } = await supabase.from("online_tutors").select("id, name").in("id", tutorIds);

          finalMappedEnrollments = enrollsV2.map((e: any) => {
            const batch = batchesV2.find((b: any) => b.id === e.batch_id);
            const targetSyllabusId = batch?.syllabus_id || batch?.course_id;
            const syllabus = syllabiV2.find((s: any) => s.id === targetSyllabusId);
            const courseStorefront = coursesV2.find((c: any) => c.syllabus_id === targetSyllabusId || c.id === targetSyllabusId);
            const courseName = syllabus?.name || courseStorefront?.title || "Unknown Course";
            
            const relatedOrders = fetchedOrders.filter((o: any) => o.enrollment_id === e.id);
            const primaryOrder = relatedOrders.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
            
            let paid = 0, remaining = Number(courseStorefront?.fee) || 0, locked = remaining;
            if (primaryOrder) { 
              paid = Number(primaryOrder.paid_amount); 
              remaining = Number(primaryOrder.remaining_amount); 
              locked = Number(primaryOrder.locked_price); 
            }
            
            const tutor = tutorsData?.find((t: any) => t.id === syllabus?.tutor_id);
            const isRejected = primaryOrder?.status?.toLowerCase() === "rejected";
            return {
              id: e.id, course_id: targetSyllabusId || "", batch_id: e.batch_id, course_name: courseName,
              status: isRejected ? "rejected" : e.is_confirmed ? "confirmed" : "pending",
              paid_amount: paid, remaining_amount: remaining,
              locked_price: locked, starting_date: batch?.start_datetime || new Date().toISOString(),
              batch_no: batch?.batch_no || 1, created_at: e.created_at, batch,
              tutor_name: tutor?.name, duration: syllabus?.duration,
            };
          }).sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

          setEnrollments(finalMappedEnrollments);
        }

        const synthesizedOrders = [...mappedOrders];
        
        // 1. Synthesize Orders for Unpaid Online Courses
        finalMappedEnrollments.forEach((e: any) => {
          const hasLinkedOrderRow = mappedOrders.some(o => o.enrollment_id === e.id || (o.order_name?.toLowerCase() === e.course_name?.toLowerCase()));
          if (!hasLinkedOrderRow && e.remaining_amount > 0) {
            synthesizedOrders.push({
              id: `synth-${e.id}`, order_type: "online course", order_name: e.course_name,
              paid_amount: e.paid_amount, pending_amount: 0, remaining_amount: e.remaining_amount,
              locked_price: e.locked_price, screenshot_url: "", status: "pending", created_at: e.created_at,
              enrollment_id: e.id, leads_id: null, service: e.course_name,
            });
          }
        });

        // 2. Synthesize Orders for Unpaid Physical Leads
        finalLeads.forEach((l: any) => {
          const hasLinkedOrderRow = mappedOrders.some(o => o.leads_id === l.id || (o.order_name?.toLowerCase() === l.course_title?.toLowerCase() && o.order_type.includes("physical")));
          const total = l.discount_price ?? l.course_price;
          const paid = l.booking_amount || 0;
          const remaining = Math.max(0, total - paid);

          if (!hasLinkedOrderRow && remaining > 0) {
            synthesizedOrders.push({
              id: `synth-lead-${l.id}`, order_type: "Physical Class", order_name: l.course_title,
              paid_amount: paid, pending_amount: 0, remaining_amount: remaining,
              locked_price: total, screenshot_url: "", status: "pending", created_at: l.created_at,
              enrollment_id: null, leads_id: l.id, service: l.course_title,
            });
          }
        });

        setOrders(synthesizedOrders);
      } catch (err) {
        console.warn("dashboard fetch exception:", err);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [supabase, router]);

  const expandedRecordingOrders = useMemo(() => {
    const recOrders = orders.filter((o) => o.order_type === "recording");
    return recOrders.flatMap((o) => {
      const rawName = o.order_name.toLowerCase().trim();
      const key = rawName.replace(" (featured)", "").trim();
      let courses = BUNDLES[key] || BUNDLES[rawName];
      if (!courses && key.endsWith(" bundle")) courses = BUNDLES[key.replace(" bundle", "").trim()];
      if (courses) return courses.map((name, idx) => ({ ...o, id: `${o.id}-${idx}`, order_name: name, original_bundle: o.order_name }));
      return [o];
    });
  }, [orders]);

  const pendingVerificationOrders = useMemo(() => orders.filter((o) => {
    if (o.id?.toString().startsWith("synth-")) return false; 
    return (Number(o.pending_amount) > 0) || ["pending", "processing"].includes((o.status || "").toLowerCase());
  }), [orders]);

  const learningItems: LearningItem[] = useMemo(() => {
    const online: LearningItem[] = enrollments.map((e) => {
      const isFuture = e.starting_date ? new Date(e.starting_date).getTime() > Date.now() : false;
      const locked = e.locked_price || 0;
      const tenPercent = Math.round(locked * 0.1);
      let dueToPay = Math.round(e.remaining_amount);
      let bookingFeeDue = false;

      // 10% Logic if Future class
      if (isFuture) {
        if (e.paid_amount < tenPercent) {
          dueToPay = Math.round(tenPercent - e.paid_amount);
          bookingFeeDue = true;
        }
        else dueToPay = 0; // 10% is paid, class hasn't started, they don't *have* to pay immediately
      }

      return {
        id: e.id, courseType: "online", title: e.course_name, status: e.status,
        batchNo: e.batch_no, startingDate: e.starting_date, timing: e.batch?.timing,
        paidAmount: Math.round(e.paid_amount), remainingAmount: Math.round(e.remaining_amount), lockedPrice: e.locked_price,
        currentDueToPay: dueToPay,
        isBookingFeeDue: bookingFeeDue,
        isFullyPaid: (e.remaining_amount || 0) <= 0,
        hasUnverifiedPayment: pendingVerificationOrders.some((o) => o.enrollment_id === e.id || (o.order_name?.toLowerCase() === e.course_name?.toLowerCase() && o.order_type !== "recording")),
        meta: { tutorName: e.tutor_name, duration: e.duration, classroomLink: e.batch?.google_classroom_link, whatsappLink: e.batch?.whatsapp_group_link },
      };
    });

    const recordings: LearningItem[] = expandedRecordingOrders.map((r) => {
      const matched = recordingsList.find((rl) => rl.course_name.toLowerCase() === r.order_name.toLowerCase());
      const st = r.status?.toLowerCase();
      return {
        id: r.id, courseType: "recording", title: r.order_name,
        status: st === "verified" ? "confirmed" : st === "rejected" ? "rejected" : "pending",
        paidAmount: Math.round(r.paid_amount), remainingAmount: st === "rejected" ? Math.round(r.paid_amount || 0) : 0,
        currentDueToPay: st === "rejected" ? Math.round(r.paid_amount || 0) : 0,
        isFullyPaid: st === "verified", hasUnverifiedPayment: st === "pending" || st === "processing",
        meta: { recordingLink: matched?.recording_link, original_bundle: r.original_bundle },
      };
    });

    const offline: LearningItem[] = physicalLeads.map((l) => {
      const relatedOrders = orders.filter((o) => o.leads_id === l.id);
      const primaryOrder = relatedOrders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
      
      const total = l.discount_price ?? l.course_price;
      let paid = l.booking_amount || 0;
      let remaining = Math.max(0, total - paid);
      let hasUnverified = false;

      if (primaryOrder) {
        paid = primaryOrder.paid_amount;
        remaining = primaryOrder.remaining_amount;
        // FIX: Ignore synthesized orders so it doesn't lock up the payment UI
        const isSynth = primaryOrder.id?.toString().startsWith("synth-");
        hasUnverified = !isSynth && (primaryOrder.pending_amount > 0 || ["pending", "processing"].includes((primaryOrder.status || "").toLowerCase()));
      }
      
      const isRejected = l.status?.toLowerCase() === "rejected" || primaryOrder?.status === "rejected";
      
      const pCourse = physicalCourses.find(c => c.title === l.course_title);
      const actualStartDate = l.start_date || pCourse?.start_date;
      
      const isFuture = actualStartDate ? new Date(actualStartDate).getTime() > Date.now() : false;
      const tenPercent = Math.round(total * 0.1);
      let dueToPay = Math.round(remaining);
      let bookingFeeDue = false;

      // 10% Logic if Future class
      if (isFuture) {
        if (paid < tenPercent) {
          dueToPay = Math.round(tenPercent - paid);
          bookingFeeDue = true;
        }
        else dueToPay = 0; // 10% paid, rest deferred till class starts
      }

      if (isRejected) {
        dueToPay = Math.max(Math.round(paid), Math.round(remaining)); // If rejected, force pay back what they tried
        bookingFeeDue = false; // Overwrite if rejected
      }

      return {
        id: l.id, courseType: "offline", title: l.course_title,
        status: isRejected ? "rejected" : l.is_confirmed ? "confirmed" : "pending",
        batchNo: l.batch_no, startingDate: actualStartDate, location: l.office_location,
        paidAmount: Math.round(paid), remainingAmount: isRejected ? Math.max(Math.round(paid), Math.round(remaining)) : Math.round(remaining), lockedPrice: total,
        currentDueToPay: dueToPay,
        isBookingFeeDue: bookingFeeDue,
        isFullyPaid: !isRejected && remaining <= 0, hasUnverifiedPayment: hasUnverified,
      };
    });

    return [...online, ...recordings, ...offline];
  }, [enrollments, expandedRecordingOrders, recordingsList, physicalLeads, physicalCourses, pendingVerificationOrders, orders]);

  // Consolidate all pending payments that REQUIRE action right now
  const allActionablePayments = useMemo(() => {
    return learningItems
      .filter((i) => i.currentDueToPay > 0 && !i.isFullyPaid && !i.hasUnverifiedPayment)
      .map((i) => ({
        id: i.id,
        course_name: i.title,
        amount_to_pay: i.currentDueToPay,
        courseType: i.courseType,
        isBookingFeeDue: i.isBookingFeeDue
      }));
  }, [learningItems]);

  const filteredLearningItems = learningFilter === "all" ? learningItems : learningItems.filter((i) => i.courseType === learningFilter);
  const totalCourses = learningItems.length;

  const timelineEvents = useMemo(() => [
    ...orders.filter((o) => o.order_type === "recording" && !o.id.toString().startsWith("synth-")).map((o) => ({ id: o.id, title: `Purchased ${o.order_name} recordings`, date: new Date(o.created_at) })),
    ...enrollments.map((e) => ({ id: e.id, title: `Enrolled in ${e.course_name} (Online)`, date: new Date(e.created_at) })),
    ...physicalLeads.map((l) => ({ id: l.id, title: `Applied for ${l.course_title} (Offline)`, date: new Date(l.created_at) })),
    ...certificates.map((c) => ({ id: `cert-${c.id}`, title: `Certificate: ${c.syllabus_name || c.name}`, date: new Date(c.issue_date) })),
  ].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 6), [orders, enrollments, physicalLeads, certificates]);

  const formatDate = (d?: string) => { if (!d) return "N/A"; const x = new Date(d); return isNaN(x.getTime()) ? "N/A" : x.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }); };
  const handleSignOut = async () => { await supabase.auth.signOut(); window.location.href = "/"; };
  
  const goPay = (courseName: string, amount: number, orderTypeStr: string = "course") => {
    let type = "course";
    if (orderTypeStr) {
      const lower = orderTypeStr.toLowerCase();
      // Important: Mapping exactly to 'offline course' to match checkout handler logic
      if (lower.includes("offline") || lower.includes("physical")) type = "offline course";
      else if (lower.includes("recording")) type = "recording";
      else type = "course"; 
    }
    router.push(`/order?order_type=${encodeURIComponent(type)}&courseName=${encodeURIComponent(courseName)}&price=${amount}`);
  };

  const renderSidebar = (onNavigate?: () => void) => (
    <div className="space-y-2">
      {NAV.filter((n) => n.key !== "account").map((item) => (
        <NavButton
          key={item.key}
          icon={<item.icon size={20} />}
          label={item.label}
          active={activeTab === item.key}
          onClick={() => { setActiveTab(item.key); onNavigate?.(); }}
        />
      ))}
      <div className="h-px bg-slate-200 my-6 mx-4" />
      <a href="https://wa.me/9763695665" target="_blank" rel="noopener noreferrer" className="w-full flex items-center gap-3 px-4 py-3 rounded-full text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors group">
        <Phone size={20} className="text-slate-400 group-hover:text-[#12203D]" /> WhatsApp Us
      </a>
      <NavButton
        icon={<Settings size={20} />}
        label="Account"
        active={activeTab === "account"}
        onClick={() => { setActiveTab("account"); onNavigate?.(); }}
      />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-24 lg:pb-12 font-sans overflow-x-hidden flex flex-col">
      <AnimatePresence>{toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}</AnimatePresence>

      {/* MOBILE MENU */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsMobileMenuOpen(false)} className="fixed inset-0 bg-slate-900/40 z-[100] lg:hidden" />
            <motion.div initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} transition={{ type: "spring", bounce: 0, duration: 0.4 }} className="fixed inset-y-0 left-0 w-[80%] max-w-sm bg-white shadow-xl z-[101] lg:hidden flex flex-col">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <span className="font-bold text-lg text-slate-900 truncate">{userName}</span>
                <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 bg-slate-200 rounded-full hover:bg-slate-300"><X size={20} /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-4">{renderSidebar(() => setIsMobileMenuOpen(false))}</div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* TOP BAR */}
      <nav className="sticky top-0 z-40 bg-white border-b border-slate-200 h-16 flex items-center px-6 shadow-sm">
        <div className="max-w-7xl mx-auto w-full flex justify-between items-center">
          
          {/* User Profile / Navigation block */}
          <div className="relative">
            <button onClick={() => setIsProfileOpen(!isProfileOpen)} className="flex items-center gap-3 p-1 rounded-full hover:bg-slate-50 transition-colors">
              {isLoadingUser ? <div className="w-8 h-8 rounded-full bg-slate-200 animate-pulse" /> : (
                userAvatar ? (
                  <img src={userAvatar} alt={userName} className="w-8 h-8 rounded-full object-cover border border-slate-200 shadow-sm" />
                ) : (
                  <div className="w-8 h-8 bg-[#12203D] rounded-full flex items-center justify-center text-white font-medium text-sm shadow-sm">
                    {userName?.charAt(0).toUpperCase() || "U"}
                  </div>
                )
              )}
              <p className="flex items-center gap-2 text-base font-bold text-[#12203D]">
                <span>{isLoadingUser ? "Loading..." : userName}</span>
                <span className="text-slate-300 font-normal">|</span>
                <span className="text-[#F2711C] capitalize">{activeTab}</span>
              </p>
              <ChevronDown size={16} className={`text-slate-400 transition-transform ${isProfileOpen ? "rotate-180" : ""}`} />
            </button>
            <AnimatePresence>
              {isProfileOpen && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute left-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-sm border border-slate-200 py-2 z-50">
                  <div className="px-4 py-3 border-b border-slate-100 mb-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Signed in as</p>
                    <p className="text-sm font-medium text-slate-800 truncate">{userName}</p>
                  </div>
                  <button onClick={() => { setActiveTab("account"); setIsProfileOpen(false); }} className="w-full text-left px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2"><Settings size={16} /> Account</button>
                  <button onClick={handleSignOut} className="w-full text-left px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 flex items-center gap-2"><LogOut size={16} /> Sign out</button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* GyanHub Logo Right Side */}
          <div className="flex items-center">
            <img 
              src="https://zuktarghyexwodqnnxlu.supabase.co/storage/v1/object/public/others/LOGO_BG_REMOVED.png" 
              alt="GyanHub Logo" 
              className="h-9 w-auto object-contain drop-shadow-sm" 
            />
          </div>

        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 flex-grow w-full">
        <aside className="hidden lg:block lg:col-span-3">
          <div className="sticky top-24 space-y-1">{renderSidebar()}</div>
        </aside>

        <main className="lg:col-span-9 w-full min-h-[500px]">
          
          {/* Unverified Payments Global Notification */}
          {pendingVerificationOrders.length > 0 && (
            <div className="mb-6 space-y-3">
              {pendingVerificationOrders.map((order) => (
                <div key={order.id} className="bg-blue-50 border border-blue-200 p-4 rounded-xl shadow-sm flex items-start sm:items-center gap-3 text-blue-900">
                  <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5 sm:mt-0" />
                  <p className="text-sm font-medium">Your order for <strong className="font-bold">{order.service}</strong> is initiated and will be verified within 24 hours.</p>
                </div>
              ))}
            </div>
          )}

          {loading ? <SkeletonLoader /> : (
            <AnimatePresence mode="wait">
              <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                {activeTab === "dashboard" && (
                  <OverviewView
                    userName={userName} totalCourses={totalCourses} certificates={certificates}
                    allActionablePayments={allActionablePayments} onNavigate={setActiveTab} timelineEvents={timelineEvents}
                    learningItems={learningItems} goPay={goPay}
                  />
                )}
                {activeTab === "learning" && (
                  <LearningView items={filteredLearningItems} filter={learningFilter} setFilter={setLearningFilter}
                    router={router} formatDate={formatDate} onOpenOrientationModal={setOrientationData} goPay={goPay} />
                )}
                {activeTab === "achievements" && <AchievementsView certificates={certificates} formatDate={formatDate} showToast={showToast} />}
                {activeTab === "payments" && <PaymentsView orders={orders} enrollments={enrollments} physicalLeads={physicalLeads} formatDate={formatDate} setSelectedTransaction={setSelectedTransaction} router={router} goPay={goPay} />}
                {activeTab === "support" && <SupportView userId={userId} showToast={showToast} />}
                {activeTab === "account" && <AccountView userName={userName} userEmail={userEmail} onSignOut={handleSignOut} />}
              </motion.div>
            </AnimatePresence>
          )}
        </main>
      </div>

      {/* MOBILE BOTTOM NAV */}
      <nav className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-white border border-slate-200 shadow-sm rounded-full px-4 py-2 flex justify-center gap-4 items-center">
        <MobileNavButton icon={<Home size={20} />} label="Home" active={activeTab === "dashboard"} onClick={() => setActiveTab("dashboard")} />
        <MobileNavButton icon={<BookOpen size={20} />} label="Learn" active={activeTab === "learning"} onClick={() => setActiveTab("learning")} />
        <MobileNavButton icon={<Award size={20} />} label="Awards" active={activeTab === "achievements"} onClick={() => setActiveTab("achievements")} />
        <MobileNavButton icon={<Receipt size={20} />} label="Pay" active={activeTab === "payments"} onClick={() => setActiveTab("payments")} />
        <MobileNavButton icon={<Menu size={20} />} label="Menu" active={isMobileMenuOpen} onClick={() => setIsMobileMenuOpen(true)} />
      </nav>

      {/* MODALS */}
      <AnimatePresence>{orientationData && <OrientationModal data={orientationData} onClose={() => setOrientationData(null)} />}</AnimatePresence>
      <AnimatePresence>
        {selectedTransaction && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/40 p-6 overflow-y-auto">
            <TransactionModal order={selectedTransaction} enrollments={enrollments} physicalLeads={physicalLeads} onClose={() => setSelectedTransaction(null)} router={router} goPay={goPay} />
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// =====================================================================
// VIEWS
// =====================================================================

function OverviewView({ userName, totalCourses, certificates, allActionablePayments, onNavigate, timelineEvents, learningItems, goPay }: any) {
  return (
    <div className="space-y-8 w-full">
      {allActionablePayments.length > 0 && (
        <div className="flex flex-col gap-4">
          {allActionablePayments.map((e: any) => (
            <div key={e.id} className="bg-red-50 border border-red-200 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 shadow-sm">
              <div className="flex items-start gap-4 text-red-900">
                <AlertCircle className="text-red-500 mt-1" size={24} />
                <div>
                  <p className="text-lg font-bold mb-1">Action Required</p>
                  <p className="text-sm font-medium text-red-700">
                    {e.isBookingFeeDue ? "Booking fee" : "Remaining payment"} of Rs. {e.amount_to_pay} for {e.course_name} ({e.courseType}).
                  </p>
                </div>
              </div>
              <button onClick={() => goPay(e.course_name, e.amount_to_pay, e.courseType)} className="w-full md:w-auto bg-red-600 hover:bg-red-700 text-white font-medium px-6 py-3 rounded-full text-sm transition-colors shadow-sm">Pay Rs. {e.amount_to_pay}</button>
            </div>
          ))}
        </div>
      )}

      {/* Hero Section */}
      <div className="bg-[#12203D] rounded-2xl p-8 md:p-10 relative overflow-hidden text-white shadow-sm">
        <div className="relative z-10">
          <h2 className="text-xs uppercase tracking-wide font-bold text-[#F2711C] mb-2 flex items-center gap-2"><Sparkles size={14} /> Welcome Back</h2>
          <h3 className="text-3xl md:text-4xl font-bold tracking-tight mb-6">Hello, {userName}</h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-8 border-t border-white/10">
            {[
              { icon: BookOpen, value: totalCourses, label: "Courses", tab: "learning" },
              { icon: AlertCircle, value: allActionablePayments.length, label: "Pending Dues", tab: "payments", dot: allActionablePayments.length > 0 },
              { icon: Award, value: certificates?.length || 0, label: "Certificates", tab: "achievements" },
              { icon: MessageCircle, value: "24/7", label: "Support", tab: "support" },
            ].map((item, i) => (
              <div key={i} onClick={() => onNavigate(item.tab)} className="cursor-pointer bg-white/5 p-5 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors relative">
                {item.dot && <span className="absolute top-3 right-3 w-2 h-2 bg-[#F2711C] rounded-full" />}
                <item.icon size={20} className="text-[#F2711C] mb-3" />
                <p className="text-2xl font-bold">{item.value}</p>
                <p className="text-[10px] uppercase font-medium tracking-wide text-white/60 mt-1">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-2 mb-6"><Clock size={16} /> Recent Activity</h3>
        {timelineEvents.length === 0 ? (
          <div className="flex flex-col items-center py-10 text-slate-400"><Clock size={32} className="mb-3 opacity-30" /><p className="text-sm font-medium">No recent activity.</p></div>
        ) : (
          <div className="space-y-4">
            {timelineEvents.map((e: any) => (
              <div key={e.id} className="flex items-start gap-4">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 text-slate-600 shrink-0"><BookOpen size={16} /></div>
                <div className="flex-1 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <p className="text-sm font-medium text-slate-800">{e.title}</p>
                  <time className="text-[10px] font-medium text-slate-400 tracking-wide uppercase mt-1 block">{e.date.toLocaleDateString()}</time>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function LearningView({ items, filter, setFilter, router, formatDate, onOpenOrientationModal, goPay }: any) {
  const FILTERS: { key: "all" | CourseType; label: string }[] = [
    { key: "all", label: "All" }, { key: "online", label: "Online" }, { key: "offline", label: "Offline" }, { key: "recording", label: "Recordings" },
  ];

  return (
    <div className="space-y-8 w-full">
      <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-5">
        <h2 className="text-3xl font-bold tracking-tight text-[#12203D]">My Courses</h2>
        
        {/* Make explore buttons visually pop */}
        <div className="flex flex-wrap gap-3">
          <Link href="/onlinecourse" className="flex items-center gap-2 bg-[#12203D] hover:bg-slate-800 shadow-md text-white px-5 py-2.5 rounded-full font-medium text-sm transition-all hover:-translate-y-0.5">
            <Sparkles size={16}/> <span className="text-white">Explore Online</span>
          </Link>
          <Link href="/offline-class" className="flex items-center gap-2 bg-[#F2711C] hover:bg-orange-600 shadow-md text-white px-5 py-2.5 rounded-full font-medium text-sm transition-all hover:-translate-y-0.5">
            <MapPin size={16}/> <span className="text-white">Explore Physical</span>
          </Link>
          <Link href="/recording" className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 shadow-md text-white px-5 py-2.5 rounded-full font-medium text-sm transition-all hover:-translate-y-0.5">
            <PlayCircle size={16}/> <span className="text-white">Explore Recording</span>
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const isActive = filter === f.key;
          return (
            <button key={f.key} onClick={() => setFilter(f.key)} className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${isActive ? "bg-[#12203D] text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
              {f.label}
            </button>
          );
        })}
      </div>

      {items.length === 0 ? (
        <div className="text-center py-20 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col items-center">
          <Compass size={32} className="text-slate-400 mb-4" />
          <h3 className="text-lg font-bold text-slate-800 mb-2">No courses found</h3>
          <p className="text-slate-500 font-medium text-sm mb-6">Try a different filter, or explore our catalog.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {items.map((item: LearningItem) => (
            <LearningCard key={`${item.courseType}-${item.id}`} item={item} router={router} formatDate={formatDate} onOpenOrientationModal={onOpenOrientationModal} goPay={goPay} />
          ))}
        </div>
      )}
    </div>
  );
}

function LearningCard({ item, router, formatDate, onOpenOrientationModal, goPay }: { item: LearningItem; router: any; formatDate: any; onOpenOrientationModal: any; goPay: any }) {
  const isClassStarted = item.startingDate ? new Date(item.startingDate).getTime() <= Date.now() : true;
  
  // Mapping course type to our Pill variants
  const getCourseTypeVariant = (type: CourseType) => {
    if (type === 'online') return 'brand';
    if (type === 'offline') return 'accent';
    return 'neutral';
  };

  return (
    <div className="rounded-2xl border border-slate-200 p-6 md:p-8 flex flex-col bg-white shadow-sm">
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <Pill variant={getCourseTypeVariant(item.courseType)}>{item.courseType.toUpperCase()}</Pill>
        <StatusBadge status={item.status} />
        {item.batchNo && <Pill variant="neutral">Batch {item.batchNo}</Pill>}
      </div>
      
      <h3 className="font-bold text-2xl text-[#12203D] mb-4">{item.title}</h3>
      
      <div className="flex flex-wrap items-center gap-5 text-sm text-slate-600 font-medium mb-6">
        {item.location && <span className="flex items-center gap-2"><MapPin size={16} className="text-slate-400" /> {item.location}</span>}
        {item.startingDate && <span className="flex items-center gap-2"><Calendar size={16} className="text-slate-400" /> {formatDate(item.startingDate)}</span>}
        {item.timing && <span className="flex items-center gap-2"><Clock size={16} className="text-slate-400" /> {item.timing}</span>}
        {item.meta?.tutorName && <span className="flex items-center gap-2"><UserIcon size={16} className="text-slate-400" /> {item.meta.tutorName}</span>}
      </div>

      {item.status === "rejected" ? (
        <div className="bg-red-50 border border-red-200 rounded-2xl px-5 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <p className="text-sm font-bold text-red-900 flex items-center gap-2"><AlertCircle size={16} /> Payment Rejected</p>
            <p className="text-xs text-red-700 font-medium mt-1">Your last payment was not accepted. Please retry.</p>
          </div>
          <button onClick={() => goPay(item.title, item.currentDueToPay > 0 ? item.currentDueToPay : item.remainingAmount, item.courseType)} className="bg-red-600 hover:bg-red-700 text-white font-medium px-5 py-2.5 rounded-full text-sm">Retry Payment</button>
        </div>
      ) : !item.isFullyPaid && item.currentDueToPay > 0 && !item.hasUnverifiedPayment ? (
        <div className="bg-orange-50 border border-orange-200 rounded-2xl px-5 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <p className="text-sm font-bold text-orange-900 flex items-center gap-2">
            <AlertCircle size={16} /> 
            Action Required: Rs. {item.currentDueToPay} {item.isBookingFeeDue ? "Booking Fee Due" : "Due"}
          </p>
          <button onClick={() => goPay(item.title, item.currentDueToPay, item.courseType)} className="bg-[#F2711C] hover:bg-orange-600 text-white font-medium px-5 py-2.5 rounded-full text-sm shadow-sm">Pay Rs. {item.currentDueToPay}</button>
        </div>
      ) : !item.isFullyPaid && item.currentDueToPay === 0 && item.remainingAmount > 0 && !item.hasUnverifiedPayment ? (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl px-5 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <p className="text-sm font-bold text-blue-900 flex items-center gap-2"><CheckCircle size={16} /> You have booked for {item.title} course.</p>
          <button onClick={() => goPay(item.title, item.remainingAmount, item.courseType)} className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2.5 rounded-full text-sm shadow-sm">Pay Remaining Now</button>
        </div>
      ) : null}

      <div className="mt-auto pt-6 border-t border-slate-100 flex flex-col sm:flex-row gap-4">
        {item.courseType === "recording" && (
          item.hasUnverifiedPayment ? (
            <div className="flex items-center gap-3 bg-slate-50 text-slate-500 px-5 py-3 rounded-full w-full font-medium text-sm"><Lock size={16} /> Pending Verification</div>
          ) : (
            <button onClick={() => item.meta?.recordingLink ? window.open(item.meta.recordingLink, "_blank") : router.push(`/recording/${encodeURIComponent(item.title)}`)} className="bg-[#12203D] hover:bg-slate-800 text-white px-6 py-3 rounded-full font-medium text-sm flex justify-center items-center gap-2"><PlayCircle size={18} /> Watch Recording</button>
          )
        )}
        {item.courseType === "online" && (
          item.hasUnverifiedPayment || !item.isFullyPaid ? (
            <div className="flex items-center gap-3 bg-slate-50 text-slate-500 px-5 py-3 rounded-full w-full font-medium text-sm"><Lock size={16} /> Clear dues to unlock</div>
          ) : (
            <>
              <button onClick={() => !isClassStarted ? onOpenOrientationModal({ link: "#", date: item.startingDate }) : window.open("#", "_blank")} className="flex-1 bg-[#12203D] hover:bg-slate-800 text-white px-6 py-3 rounded-full font-medium text-sm flex justify-center items-center gap-2"><Video size={18} /> {isClassStarted ? "Join Live Class" : "Join Orientation"}</button>
              <a href={item.meta?.classroomLink || "#"} target="_blank" rel="noopener noreferrer" className="flex-1 bg-slate-100 hover:bg-slate-200 text-[#12203D] px-6 py-3 rounded-full font-medium text-sm flex justify-center items-center gap-2"><BookOpen size={18} /> Classroom</a>
            </>
          )
        )}
        {item.courseType === "offline" && (
          <div className="flex items-center gap-2 text-sm font-medium text-slate-600"><MapPin size={16} className="text-[#F2711C]" /> Visit your office for class access.</div>
        )}
      </div>
    </div>
  );
}

function AchievementsView({ certificates, formatDate, showToast }: any) {
  return (
    <div className="space-y-8 w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-3xl font-bold tracking-tight text-[#12203D]">Achievements</h2>
        {certificates?.length > 0 && <Pill variant="accent">{certificates.length} Earned</Pill>}
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {!certificates || certificates.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center bg-slate-50 rounded-2xl py-20 px-6 border border-slate-200 text-center">
            <Award size={32} className="text-slate-400 mb-4" />
            <p className="text-slate-800 font-bold text-lg mb-2">No certificates earned yet</p>
            <p className="text-slate-500 font-medium text-sm">Complete a course to unlock your first certificate.</p>
          </div>
        ) : certificates.map((cert: any) => (
          <div key={cert.id} className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm flex flex-col gap-6">
            <div className="flex justify-between items-start">
              <div className="p-4 bg-slate-50 text-[#12203D] rounded-2xl border border-slate-100"><Award size={24} /></div>
              <div className="text-right">
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wide mb-1">Issue Date</p>
                <p className="text-sm font-medium text-slate-800">{formatDate(cert.issue_date)}</p>
              </div>
            </div>
            <div>
              <h3 className="text-xl font-bold text-[#12203D] mb-1">{cert.syllabus_name || cert.name}</h3>
              <p className="text-sm text-slate-500 font-medium">Issued to: <span className="font-medium text-slate-800">{cert.name}</span></p>
            </div>
            <div className="border-t border-slate-100 pt-6 flex flex-col sm:flex-row gap-3">
              <a href={`/certificate?name=${encodeURIComponent(cert.name)}&email=${encodeURIComponent(cert.email)}`} target="_blank" rel="noopener noreferrer" className="flex-1 bg-[#12203D] hover:bg-slate-800 text-white font-semibold py-3 rounded-full text-sm flex justify-center items-center gap-2"><ExternalLink color="white" size={16} /> <span className="text-white">View Certificate</span></a>
              <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/certificate?name=${encodeURIComponent(cert.name)}&email=${encodeURIComponent(cert.email)}`); showToast("Certificate link copied!"); }} className="flex-1 bg-slate-100 hover:bg-slate-200 text-[#12203D] font-semibold py-3 rounded-full text-sm flex justify-center items-center gap-2"><Copy size={16} /> Copy Link</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PaymentsView({ orders, enrollments, physicalLeads, formatDate, setSelectedTransaction, router, goPay }: any) {
  return (
    <div className="space-y-8 w-full">
      <h2 className="text-3xl font-bold tracking-tight text-[#12203D]">Payments</h2>
      {(!orders || orders.length === 0) ? (
        <div className="flex flex-col items-center justify-center bg-slate-50 rounded-2xl py-20 px-6 border border-slate-200 text-center">
          <Receipt size={32} className="text-slate-400 mb-4" />
          <p className="text-slate-900 font-bold text-lg mb-2">No transaction history found</p>
          <p className="text-slate-500 font-medium text-sm">Your invoices and dues will appear here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order: any) => {
            const relatedEnrollment = enrollments?.find((e: any) => e.id === order.enrollment_id || (e.course_name?.toLowerCase() === order.order_name?.toLowerCase()));
            const relatedLead = physicalLeads?.find((l: any) => l.id === order.leads_id || (l.course_title?.toLowerCase() === order.order_name?.toLowerCase()));
            
            // Link due amount properly for online or offline items
            const remainingDue = order.remaining_amount ?? relatedEnrollment?.remaining_amount ?? (relatedLead ? Math.max(0, (relatedLead.discount_price ?? relatedLead.course_price ?? 0) - (relatedLead.booking_amount ?? 0)) : 0);
            
            const hasPending = order.pending_amount > 0;
            const isRejected = order.status?.toLowerCase() === "rejected";
            return (
              <div key={order.id} onClick={() => setSelectedTransaction(order)} className="cursor-pointer bg-white p-5 md:p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col hover:border-[#12203D]/30 transition-colors">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-slate-500 shrink-0">
                      {isRejected ? <AlertCircle size={20} className="text-red-500"/> : hasPending ? <Clock size={20} /> : <ShoppingBag size={20} />}
                    </div>
                    <div className="overflow-hidden flex-1 min-w-0">
                      <p className="font-bold text-[#12203D] text-base truncate">{order.service}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{order.order_type} • {formatDate(order.created_at)}</p>
                    </div>
                  </div>
                  <div className="text-right w-full sm:w-auto flex flex-row sm:flex-col justify-between items-center sm:items-end gap-2 pt-4 sm:pt-0 border-t border-slate-100 sm:border-0">
                    {isRejected ? (
                      <p className="text-red-600 font-medium text-sm">Payment rejected</p>
                    ) : hasPending ? (
                      <div className="text-right"><p className="text-orange-500 font-medium text-sm">Rs. {order.pending_amount} unverified</p></div>
                    ) : <p className="font-bold text-lg text-[#12203D]">Rs. {order.paid_amount}</p>}
                    <StatusBadge status={order.status} />
                  </div>
                </div>
                {isRejected ? (
                  <div className="w-full mt-4 pt-4 border-t border-slate-100 flex justify-end" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => goPay(relatedEnrollment?.course_name || relatedLead?.course_title || order.order_name, remainingDue || order.paid_amount, order.order_type)} className="px-5 py-2 text-sm font-medium rounded-full bg-red-600 hover:bg-red-700 text-white">Retry Payment</button>
                  </div>
                ) : remainingDue > 0 && !hasPending && (
                  <div className="w-full mt-4 pt-4 border-t border-slate-100 flex justify-end" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => goPay(relatedEnrollment?.course_name || relatedLead?.course_title || order.order_name, remainingDue, order.order_type)} className="px-5 py-2 text-sm font-medium rounded-full bg-[#F2711C] hover:bg-orange-600 text-white">Pay Remaining (Rs. {remainingDue})</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function TransactionModal({ order, enrollments, physicalLeads, onClose, router, goPay }: any) {
  const getScreenshotUrl = (path: string) => path.startsWith("http") ? path : `https://zuktarghyexwodqnnxlu.supabase.co/storage/v1/object/public/others/${path}`;
  const relatedEnrollment = enrollments?.find((e: any) => e.id === order.enrollment_id || (e.course_name?.toLowerCase() === order.order_name?.toLowerCase()));
  const relatedLead = physicalLeads?.find((l: any) => l.id === order.leads_id || (l.course_title?.toLowerCase() === order.order_name?.toLowerCase()));
  
  const remainingDue = order.remaining_amount ?? relatedEnrollment?.remaining_amount ?? (relatedLead ? Math.max(0, (relatedLead.discount_price ?? relatedLead.course_price ?? 0) - (relatedLead.booking_amount ?? 0)) : 0);
  
  const hasPending = order.pending_amount > 0;
  const isRejected = order.status?.toLowerCase() === "rejected";

  return (
    <motion.div initial={{ scale: 0.95, opacity: 0, y: 10 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 10 }} className="bg-white rounded-2xl w-full max-w-xl shadow-lg border border-slate-200 flex flex-col relative max-h-[90vh]">
      <div className="flex items-center justify-between p-6 border-b border-slate-100">
        <h4 className="text-lg font-bold text-[#12203D]">Transaction Details</h4>
        <button onClick={onClose} className="p-2 bg-slate-50 rounded-full hover:bg-slate-100 text-slate-500"><X size={18} /></button>
      </div>
      <div className="p-6 md:p-8 space-y-6 overflow-y-auto">
        <div className="text-center">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2">{order.order_type} PURCHASE</p>
          <h4 className="text-xl font-bold text-[#12203D]">{order.service}</h4>
        </div>
        
        {isRejected && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3">
            <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={18} />
            <div className="flex-1">
              <p className="text-sm font-bold text-red-800">Payment rejected</p>
              <p className="text-xs text-red-700 mt-1">Please retry your payment.</p>
            </div>
            <button onClick={() => goPay(relatedEnrollment?.course_name || relatedLead?.course_title || order.order_name, remainingDue || order.paid_amount, order.order_type)} className="shrink-0 bg-red-600 hover:bg-red-700 text-white font-medium px-4 py-2 rounded-full text-xs">Retry</button>
          </div>
        )}
        
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl"><p className="text-[10px] uppercase font-bold text-slate-400 tracking-wide mb-1">Amount Paid</p><p className="font-bold text-lg text-[#12203D]">Rs. {order.paid_amount}</p></div>
          <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl"><p className="text-[10px] uppercase font-bold text-slate-400 tracking-wide mb-1">Date</p><p className="font-medium text-slate-700 text-lg">{new Date(order.created_at).toLocaleDateString()}</p></div>
          {hasPending && <div className="col-span-2 p-4 bg-orange-50 border border-orange-100 rounded-2xl"><p className="text-[10px] uppercase font-bold text-orange-600 tracking-wide mb-1">Unverified Amount</p><p className="font-bold text-lg text-orange-700">Rs. {order.pending_amount}</p></div>}
          
          <div className={`col-span-2 p-5 rounded-2xl border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${remainingDue > 0 ? "bg-red-50 border-red-200" : "bg-slate-50 border-slate-200"}`}>
            <div><p className={`text-[10px] uppercase font-bold tracking-wide mb-1 ${remainingDue > 0 ? "text-red-600" : "text-slate-500"}`}>Remaining Due</p><p className={`font-bold text-lg ${remainingDue > 0 ? "text-red-700" : "text-[#12203D]"}`}>{remainingDue > 0 ? `Rs. ${remainingDue}` : "Fully Paid"}</p></div>
            {!isRejected && remainingDue > 0 && !hasPending && <button onClick={() => goPay(relatedEnrollment?.course_name || relatedLead?.course_title || order.order_name, remainingDue, order.order_type)} className="w-full sm:w-auto shrink-0 font-medium px-6 py-2.5 rounded-full text-sm bg-[#F2711C] hover:bg-orange-600 text-white">Pay Now</button>}
          </div>
        </div>
        
        <div>
          <h4 className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-3">Payment Screenshot</h4>
          {order.screenshot_url ? (
            <div className="border border-slate-200 bg-slate-50 p-2 rounded-2xl"><img src={getScreenshotUrl(order.screenshot_url)} alt="Receipt" className="w-full object-contain rounded-xl max-h-[250px]" /></div>
          ) : (
            <div className="p-8 border border-slate-200 bg-slate-50 rounded-2xl text-center flex flex-col items-center text-slate-400"><SearchX size={24} className="mb-2 opacity-50" /><p className="font-medium text-sm">No screenshot provided</p></div>
          )}
          {order.status === "verified" && !order.id.startsWith("synth-") && <button onClick={() => router.push(`/invoice/${order.id}`)} className="mt-6 w-full py-3.5 bg-[#12203D] hover:bg-slate-800 text-white rounded-full font-medium flex justify-center items-center gap-2"><Receipt size={18} /> View Official Invoice</button>}
        </div>
      </div>
    </motion.div>
  );
}

function SupportView({ userId, showToast }: any) {
  return (
    <div className="space-y-8 w-full">
      <h2 className="text-3xl font-bold tracking-tight text-[#12203D]">Support</h2>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2"><ChatWidget userId={userId} showToast={showToast} /></div>
        <div className="space-y-4">
          <a href="https://wa.me/9763695665" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 bg-white border border-slate-200 rounded-2xl p-6 hover:border-[#12203D]/30 transition-colors">
            <Phone size={20} className="text-[#12203D]" /> <span className="font-medium text-[#12203D]">WhatsApp Us</span>
          </a>
          <a href="https://maps.app.goo.gl/CcgigHh5BRMhcHnEA" target="_blank" rel="noopener noreferrer" className="bg-white border border-slate-200 rounded-2xl p-6 block hover:border-[#12203D]/30 transition-colors cursor-pointer">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2">office</p>
            <p className="text-sm font-medium text-[#12203D] flex items-start gap-2 hover:text-[#F2711C] transition-colors"><MapPin size={16} className="text-[#F2711C] shrink-0 mt-0.5" /> New Baneshwor office (Near Eyeplex Mall)</p>
          </a>
        </div>
      </div>
    </div>
  );
}

function ChatWidget({ userId, showToast }: any) {
  const supabase = createClient();
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!userId) return;
    const fetchMessages = async () => { const { data } = await supabase.from("messages").select("*").eq("user_id", userId).order("created_at", { ascending: true }); if (data) setMessages(data); };
    fetchMessages();
    const channel = supabase.channel(`support_chat_${userId}`).on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `user_id=eq.${userId}` }, (payload) => {
      setMessages((prev) => (prev.some((m) => m.id === payload.new.id) ? prev : [...prev, payload.new]));
    }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userId, supabase]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, sending]);

  const handleSend = async () => {
    if (!input.trim() || !userId) return;
    setSending(true);
    const content = input.trim(); setInput("");
    const tempId = Date.now().toString();
    const tempMsg = { id: tempId, user_id: userId, sender_role: "student", content, created_at: new Date().toISOString() };
    setMessages((prev) => [...prev, tempMsg]);
    const { data, error } = await supabase.from("messages").insert([{ user_id: userId, sender_role: "student", content }]).select();
    if (data && data.length > 0) setMessages((prev) => [...prev.filter((m) => m.id !== tempId && m.id !== data[0].id), data[0]]);
    else if (error) { showToast("Failed to send message.", "error"); setMessages((prev) => prev.filter((m) => m.id !== tempId)); }
    setSending(false);
  };

  const formatTime = (iso: string) => { const d = new Date(iso); return isNaN(d.getTime()) ? "" : d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }); };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm flex flex-col h-[500px] sm:h-[600px]">
      <div className="p-4 bg-[#12203D] text-white flex items-center gap-3 shrink-0">
        <div className="p-2 bg-white/10 rounded-full"><MessageCircle size={18} /></div>
        <div>
          <h3 className="font-bold text-base">GyanHub Support</h3>
          <p className="text-white/60 text-[10px] font-medium uppercase tracking-wide flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" /> Online</p>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center text-slate-400">
            <MessageCircle size={32} className="mb-3 opacity-30" />
            <p className="font-bold text-slate-600 text-sm mb-1">Start a conversation</p>
            <p className="font-medium text-xs max-w-xs">Ask us anything about courses, payments, or account issues.</p>
          </div>
        )}
        {messages.map((msg) => {
          const isOwn = msg.sender_role !== "admin";
          return (
            <div key={msg.id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
              {!isOwn && <div className="w-6 h-6 rounded-full bg-[#12203D] flex items-center justify-center text-white text-[10px] font-bold mr-2 mt-1 shrink-0">G</div>}
              <div className={`max-w-[80%] ${isOwn ? "items-end" : "items-start"} flex flex-col gap-1`}>
                <div className={`px-4 py-2.5 rounded-2xl text-sm font-medium ${isOwn ? "bg-[#12203D] text-white rounded-br-none" : "bg-white text-slate-800 rounded-bl-none border border-slate-200"}`}>{msg.content}</div>
                <span className="text-[10px] font-medium tracking-wide uppercase text-slate-400">{formatTime(msg.created_at)}</span>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} className="h-2" />
      </div>
      <div className="p-4 border-t border-slate-200 bg-white flex gap-3">
        <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") handleSend(); }} placeholder="Type your message…" className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-full text-sm font-medium outline-none focus:border-[#12203D]/30" />
        <button onClick={handleSend} disabled={sending || !input.trim()} className="bg-[#12203D] hover:bg-slate-800 text-white w-10 h-10 rounded-full disabled:opacity-50 font-medium flex items-center justify-center shrink-0 transition-colors">{sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}</button>
      </div>
    </div>
  );
}

function AccountView({ userName, userEmail, onSignOut }: any) {
  return (
    <div className="space-y-8 w-full max-w-xl">
      <h2 className="text-3xl font-bold tracking-tight text-[#12203D]">Account</h2>
      <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 space-y-6">
        <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Name</p><p className="font-bold text-lg text-slate-800">{userName}</p></div>
        <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Email</p><p className="font-bold text-lg text-slate-800">{userEmail}</p></div>
      </div>
      <button onClick={onSignOut} className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-full font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-200"><LogOut size={18} /> Sign out</button>
    </div>
  );
}

function OrientationModal({ data, onClose }: { data: { link: string; date: string }; onClose: () => void }) {
  const [timeLeft, setTimeLeft] = useState({ d: 0, h: 0, m: 0, s: 0 });
  useEffect(() => {
    const target = new Date(data.date.split("T")[0] + "T20:00:00+05:45").getTime();
    const interval = setInterval(() => {
      const diff = target - Date.now();
      if (diff <= 0) { setTimeLeft({ d: 0, h: 0, m: 0, s: 0 }); clearInterval(interval); }
      else setTimeLeft({ d: Math.floor(diff / 86400000), h: Math.floor((diff % 86400000) / 3600000), m: Math.floor((diff % 3600000) / 60000), s: Math.floor((diff % 60000) / 1000) });
    }, 1000);
    return () => clearInterval(interval);
  }, [data.date]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/40 p-4">
      <motion.div initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 10 }} className="bg-white rounded-2xl w-full max-w-md flex flex-col relative shadow-lg">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h3 className="text-lg font-bold text-[#12203D]">Orientation Session</h3>
          <button onClick={onClose} className="p-2 bg-slate-50 rounded-full hover:bg-slate-100 text-slate-500"><X size={18} /></button>
        </div>
        <div className="p-8 text-center">
          <p className="text-slate-500 mb-6 font-medium text-sm">Session begins exactly at 8:00 PM (NST).</p>
          <div className="grid grid-cols-4 gap-3 mb-8">
            {[["Days", timeLeft.d], ["Hours", timeLeft.h], ["Mins", timeLeft.m], ["Secs", timeLeft.s]].map(([label, val]) => (
              <div key={label as string} className="bg-slate-50 border border-slate-100 rounded-2xl py-4 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-[#12203D]">{String(val).padStart(2, "0")}</span>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wide mt-1">{label}</span>
              </div>
            ))}
          </div>
          <button onClick={() => { onClose(); window.open(data.link, "_blank"); }} className="w-full py-3.5 bg-[#12203D] hover:bg-slate-800 text-white rounded-full font-medium text-sm flex justify-center items-center gap-2"><Video size={18} /> Join Orientation</button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// =====================================================================
// EXPORT
// =====================================================================
export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4"><Loader2 className="animate-spin text-[#12203D] w-10 h-10" /><p className="text-slate-500 font-medium text-sm">Loading dashboard...</p></div>}>
      <DashboardContent />
    </Suspense>
  );
}