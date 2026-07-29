"use client";

/**
 * MASTER DASHBOARD — app/dashboard/page.tsx
 * ------------------------------------------------------------------
 * Replaces: dashboard/layout.tsx + dashboard/page.tsx + dashboard/physical-classes/page.tsx
 * UI/UX OVERHAUL APPLIED: Emotional Hero, Whitespace, Semantic Colors, 
 * Depth/Glassmorphism, Quick Actions, Visual Progress, & Fluid Typography.
 * ------------------------------------------------------------------
 */

import React, { useState, useEffect, useMemo, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Home, BookOpen, Award, Receipt, Compass, Phone, LogOut, Menu, X,
  MessageCircle, PlayCircle, ChevronDown, Sparkles, AlertCircle, ShoppingBag,
  Send, SearchX, CheckCircle, Loader2, Clock, MapPin, Video, Lock, Calendar,
  ArrowRight, Copy, ExternalLink, Settings, User as UserIcon, Info, Download, Target
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

// IMPROVEMENT #18: More Human Language
const NAV = [
  { key: "dashboard", label: "Home", icon: Home },
  { key: "learning", label: "My Courses", icon: BookOpen, children: ["My Courses", "Recordings"] },
  { key: "achievements", label: "My Certificates", icon: Award, children: ["Certificates"] },
  { key: "payments", label: "Billing", icon: Receipt, children: ["Orders", "Invoices"] },
  { key: "support", label: "Need Help?", icon: MessageCircle },
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

// IMPROVEMENT #11: Better Color System
const Pill = ({ children, variant = "neutral", dot = false }: { children: React.ReactNode, variant?: "neutral" | "brand" | "accent" | "success" | "danger" | "warning", dot?: boolean }) => {
  const styles = {
    neutral: "bg-slate-100 text-slate-700",
    brand: "bg-blue-50 text-blue-700",
    accent: "bg-orange-50 text-orange-700",
    success: "bg-emerald-50 text-emerald-700",
    warning: "bg-amber-50 text-amber-700",
    danger: "bg-rose-50 text-rose-700",
  };
  
  const dotColors = {
    neutral: "bg-slate-400",
    brand: "bg-blue-500",
    accent: "bg-orange-500",
    success: "bg-emerald-500",
    warning: "bg-amber-500",
    danger: "bg-rose-500",
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wide ${styles[variant]}`}>
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotColors[variant]} ${variant === 'success' ? 'animate-pulse' : ''}`} />}
      {children}
    </span>
  );
};

export const StatusBadge = ({ status }: { status: string }) => {
  const normalized = (status || "pending").toLowerCase();
  if (normalized === "verified" || normalized === "confirmed") return <Pill variant="success" dot>Confirmed</Pill>;
  if (normalized === "rejected") return <Pill variant="danger" dot>Action Needed</Pill>;
  return <Pill variant="warning" dot>Processing</Pill>;
};

export const SkeletonLoader = () => (
  <div className="w-full space-y-8 animate-pulse">
    <div className="h-64 bg-slate-200 rounded-[2rem] w-full" />
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div className="h-48 bg-slate-200 rounded-[2rem]" />
      <div className="h-48 bg-slate-200 rounded-[2rem]" />
      <div className="h-48 bg-slate-200 rounded-[2rem]" />
    </div>
  </div>
);

const Toast = ({ message, type, onClose }: { message: string; type: "success" | "error"; onClose: () => void }) => (
  <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }}
    className="fixed bottom-24 lg:bottom-6 right-6 z-[9999] bg-[#12203D] text-white px-5 py-3.5 rounded-2xl shadow-xl flex items-center gap-3">
    {type === "success" ? <CheckCircle className="text-emerald-400 w-5 h-5" /> : <AlertCircle className="text-rose-400 w-5 h-5" />}
    <span className="font-medium text-sm">{message}</span>
    <button onClick={onClose} className="ml-2 text-slate-400 hover:text-white transition-colors"><X size={16} /></button>
  </motion.div>
);

function NavButton({ icon, label, active, onClick }: any) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl text-sm font-semibold transition-all duration-200 ${active ? "bg-[#12203D] text-white shadow-md shadow-blue-900/10 translate-x-1" : "text-slate-500 hover:bg-slate-100/80 hover:text-[#12203D]"}`}>
      <div className={`${active ? "text-white" : "text-slate-400"}`}>{icon}</div>
      <span>{label}</span>
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

      if (isFuture) {
        if (e.paid_amount < tenPercent) { dueToPay = Math.round(tenPercent - e.paid_amount); bookingFeeDue = true; }
        else dueToPay = 0; 
      }

      return {
        id: e.id, courseType: "online", title: e.course_name, status: e.status,
        batchNo: e.batch_no, startingDate: e.starting_date, timing: e.batch?.timing,
        paidAmount: Math.round(e.paid_amount), remainingAmount: Math.round(e.remaining_amount), lockedPrice: e.locked_price,
        currentDueToPay: dueToPay, isBookingFeeDue: bookingFeeDue, isFullyPaid: (e.remaining_amount || 0) <= 0,
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
        paid = primaryOrder.paid_amount; remaining = primaryOrder.remaining_amount;
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

      if (isFuture) {
        if (paid < tenPercent) { dueToPay = Math.round(tenPercent - paid); bookingFeeDue = true; }
        else dueToPay = 0; 
      }
      if (isRejected) { dueToPay = Math.max(Math.round(paid), Math.round(remaining)); bookingFeeDue = false; }

      return {
        id: l.id, courseType: "offline", title: l.course_title,
        status: isRejected ? "rejected" : l.is_confirmed ? "confirmed" : "pending",
        batchNo: l.batch_no, startingDate: actualStartDate, location: l.office_location,
        paidAmount: Math.round(paid), remainingAmount: isRejected ? Math.max(Math.round(paid), Math.round(remaining)) : Math.round(remaining), lockedPrice: total,
        currentDueToPay: dueToPay, isBookingFeeDue: bookingFeeDue,
        isFullyPaid: !isRejected && remaining <= 0, hasUnverifiedPayment: hasUnverified,
      };
    });

    return [...online, ...recordings, ...offline];
  }, [enrollments, expandedRecordingOrders, recordingsList, physicalLeads, physicalCourses, pendingVerificationOrders, orders]);

  const allActionablePayments = useMemo(() => {
    return learningItems
      .filter((i) => i.currentDueToPay > 0 && !i.isFullyPaid && !i.hasUnverifiedPayment)
      .map((i) => ({
        id: i.id, course_name: i.title, amount_to_pay: i.currentDueToPay,
        courseType: i.courseType, isBookingFeeDue: i.isBookingFeeDue
      }));
  }, [learningItems]);

  const filteredLearningItems = learningFilter === "all" ? learningItems : learningItems.filter((i) => i.courseType === learningFilter);
  const totalCourses = learningItems.length;

  const timelineEvents = useMemo(() => [
    ...orders.filter((o) => o.order_type === "recording" && !o.id.toString().startsWith("synth-")).map((o) => ({ id: o.id, title: `Purchased ${o.order_name} recordings`, date: new Date(o.created_at) })),
    ...enrollments.map((e) => ({ id: e.id, title: `Enrolled in ${e.course_name}`, date: new Date(e.created_at) })),
    ...physicalLeads.map((l) => ({ id: l.id, title: `Applied for ${l.course_title} (Offline)`, date: new Date(l.created_at) })),
    ...certificates.map((c) => ({ id: `cert-${c.id}`, title: `Earned: ${c.syllabus_name || c.name}`, date: new Date(c.issue_date) })),
  ].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 5), [orders, enrollments, physicalLeads, certificates]);

  const formatDate = (d?: string) => { if (!d) return "N/A"; const x = new Date(d); return isNaN(x.getTime()) ? "N/A" : x.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }); };
  const handleSignOut = async () => { await supabase.auth.signOut(); window.location.href = "/"; };
  
  const goPay = (courseName: string, amount: number, orderTypeStr: string = "course") => {
    let type = "course";
    if (orderTypeStr) {
      const lower = orderTypeStr.toLowerCase();
      if (lower.includes("offline") || lower.includes("physical")) type = "offline course";
      else if (lower.includes("recording")) type = "recording";
      else type = "course"; 
    }
    router.push(`/order?order_type=${encodeURIComponent(type)}&courseName=${encodeURIComponent(courseName)}&price=${amount}`);
  };

  // IMPROVEMENT #16: Sidebar Needs More Personality
  const renderSidebar = (onNavigate?: () => void) => (
    <div className="bg-white rounded-[2rem] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col gap-2">
      <div className="flex items-center gap-4 px-2 mb-6 mt-2">
        {userAvatar ? (
          <img src={userAvatar} alt={userName} className="w-12 h-12 rounded-full object-cover shadow-sm ring-2 ring-white" />
        ) : (
          <div className="w-12 h-12 bg-gradient-to-br from-[#12203D] to-blue-800 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-sm">
            {userName?.charAt(0).toUpperCase() || "U"}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="font-bold text-[#12203D] truncate text-base leading-tight">{userName}</p>
        </div>
      </div>

      {NAV.filter((n) => n.key !== "account").map((item) => (
        <NavButton
          key={item.key}
          icon={<item.icon size={20} strokeWidth={2.5} />}
          label={item.label}
          active={activeTab === item.key}
          onClick={() => { setActiveTab(item.key); onNavigate?.(); }}
        />
      ))}
      <div className="h-px bg-slate-100 my-4 mx-4" />
      <a href="https://wa.me/9763695665" target="_blank" rel="noopener noreferrer" className="w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl text-sm font-semibold text-slate-500 hover:bg-slate-100/80 hover:text-[#12203D] transition-colors group">
        <Phone size={20} strokeWidth={2.5} className="text-slate-400 group-hover:text-[#12203D]" /> WhatsApp Us
      </a>
      <NavButton
        icon={<Settings size={20} strokeWidth={2.5} />}
        label="Account"
        active={activeTab === "account"}
        onClick={() => { setActiveTab("account"); onNavigate?.(); }}
      />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-900 pb-32 lg:pb-16 font-sans overflow-x-hidden flex flex-col">
      <AnimatePresence>{toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}</AnimatePresence>

      {/* TOP BAR (Cleaned up, less borders) */}
      <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-200/50 h-20 flex items-center px-6">
        <div className="max-w-7xl mx-auto w-full flex justify-between items-center">
          
          <div className="relative">
             <div className="flex items-center gap-2 lg:hidden">
               {/* Mobile Logo fallback if sidebar hidden (Fix: Clickable) */}
               <Link href="/">
                 <img src="https://zuktarghyexwodqnnxlu.supabase.co/storage/v1/object/public/others/LOGO_BG_REMOVED.png" alt="GyanHub" className="h-7 w-auto object-contain cursor-pointer" />
               </Link>
             </div>
             <p className="hidden lg:flex items-center gap-3 text-lg font-bold text-[#12203D] tracking-tight">
                <span>Dashboard</span>
                <span className="text-slate-300 font-normal">/</span>
                <span className="text-[#F2711C] capitalize">{NAV.find(n => n.key === activeTab)?.label || activeTab}</span>
             </p>
          </div>

          <div className="flex items-center gap-4">
             {/* Desktop Logo (Fix: Clickable) */}
             <Link href="/">
               <img src="https://zuktarghyexwodqnnxlu.supabase.co/storage/v1/object/public/others/LOGO_BG_REMOVED.png" alt="GyanHub Logo" className="hidden lg:block h-8 w-auto object-contain drop-shadow-sm cursor-pointer" />
             </Link>
             <div className="lg:hidden">
               {userAvatar ? (
                  <img src={userAvatar} alt="Profile" className="w-10 h-10 rounded-full border border-slate-200 cursor-pointer" onClick={() => setActiveTab("account")} />
               ) : (
                  <div onClick={() => setActiveTab("account")} className="w-10 h-10 bg-[#12203D] rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm cursor-pointer">{userName?.charAt(0).toUpperCase()}</div>
               )}
             </div>
          </div>

        </div>
      </nav>

      {/* IMPROVEMENT #5: More White Space */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-8 lg:mt-12 grid grid-cols-1 lg:grid-cols-12 gap-10 flex-grow w-full">
        <aside className="hidden lg:block lg:col-span-3">
          <div className="sticky top-28 space-y-1">{renderSidebar()}</div>
        </aside>

        <main className="lg:col-span-9 w-full min-h-[600px]">
          {/* Fix: Display accurate pending notification */}
          {pendingVerificationOrders.length > 0 && (
            <div className="mb-8 space-y-4">
              {pendingVerificationOrders.map((order) => (
                <div key={order.id} className="bg-blue-50/80 border border-blue-100 p-5 rounded-2xl shadow-sm flex items-start sm:items-center gap-4 text-blue-900">
                  <div className="p-2 bg-blue-100 rounded-full shrink-0"><Info className="w-5 h-5 text-blue-600" /></div>
                  <p className="text-sm font-medium">
                    A payment of <strong className="font-bold">Rs. {order.pending_amount > 0 ? order.pending_amount : order.paid_amount}</strong> for <strong className="font-bold">{order.service}</strong> is pending and will be approved within 24 hours.
                  </p>
                </div>
              ))}
            </div>
          )}

          {loading ? <SkeletonLoader /> : (
            <AnimatePresence mode="wait">
              <motion.div key={activeTab} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3, ease: "easeOut" }}>
                {activeTab === "dashboard" && (
                  <OverviewView
                    userName={userName} totalCourses={totalCourses} certificates={certificates}
                    allActionablePayments={allActionablePayments} onNavigate={setActiveTab} timelineEvents={timelineEvents}
                    learningItems={learningItems} goPay={goPay}
                    hasPendingVerification={pendingVerificationOrders.length > 0} // Added to hide action required blocks
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

      {/* IMPROVEMENT #19: Better Mobile Navigation (Floating Pill) WITH JSX FIX */}
      <nav className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-white/90 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] rounded-full px-2 py-2 flex justify-center gap-1 items-center border border-slate-200/50 w-[92%] max-w-[400px]">
        {NAV.filter(n => n.key !== 'account').map((n) => {
          const Icon = n.icon;
          return (
            <button key={n.key} onClick={() => setActiveTab(n.key)} className={`flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-full transition-all duration-300 ${activeTab === n.key ? "bg-[#12203D] text-white shadow-md scale-105" : "text-slate-400 hover:text-slate-700"}`}>
               <Icon size={20} strokeWidth={activeTab === n.key ? 2.5 : 2} />
               {activeTab === n.key && <span className="text-[9px] font-bold mt-1 tracking-wide">{n.label.split(" ")[0]}</span>}
            </button>
          );
        })}
      </nav>

      {/* MODALS */}
      <AnimatePresence>{orientationData && <OrientationModal data={orientationData} onClose={() => setOrientationData(null)} />}</AnimatePresence>
      <AnimatePresence>
        {selectedTransaction && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-6 overflow-y-auto">
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

function OverviewView({ userName, totalCourses, certificates, allActionablePayments, onNavigate, timelineEvents, learningItems, goPay, hasPendingVerification }: any) {
  // IMPROVEMENT #2: Hero Section Needs Emotion
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good Morning" : hour < 18 ? "Good Afternoon" : "Good Evening";
  
  return (
    <div className="space-y-10 w-full">
      {/* Fix: Hide all Action Required blocks if there is a pending verification active globally */}
      {!hasPendingVerification && allActionablePayments.length > 0 && (
        <div className="flex flex-col gap-4">
          {allActionablePayments.map((e: any) => (
            <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} key={e.id} className="bg-rose-50 border-none rounded-[2rem] p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-rose-100 rounded-full text-rose-600 shrink-0"><AlertCircle size={24} strokeWidth={2.5}/></div>
                <div>
                  <p className="text-xl font-bold text-rose-900 mb-1">Action Required</p>
                  <p className="text-sm font-medium text-rose-700">
                    {e.isBookingFeeDue ? "Booking fee" : "Remaining payment"} of <strong className="font-bold">Rs. {e.amount_to_pay}</strong> is due for {e.course_name}.
                  </p>
                </div>
              </div>
              <button onClick={() => goPay(e.course_name, e.amount_to_pay, e.courseType)} className="w-full md:w-auto bg-rose-600 hover:bg-rose-700 text-white font-bold px-8 py-3.5 rounded-full text-sm transition-all shadow-md shadow-rose-600/20 hover:scale-105">Pay Rs. {e.amount_to_pay}</button>
            </motion.div>
          ))}
        </div>
      )}

      {/* IMPROVEMENT #2 & #20: Hero Section with Emotion and WOW Factor */}
      <div className="bg-gradient-to-br from-[#12203D] via-[#1a2d54] to-[#0f1b33] rounded-[2.5rem] p-10 md:p-14 relative overflow-hidden text-white shadow-2xl shadow-blue-900/20">
        {/* Animated Glow Backdrops */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/20 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-orange-500/10 rounded-full blur-[60px] translate-y-1/2 -translate-x-1/4 pointer-events-none" />
        
        <div className="relative z-10 max-w-2xl">
          <h2 className="text-sm uppercase tracking-widest font-bold text-orange-400 mb-4 flex items-center gap-2"><Sparkles size={16} /> Dashboard</h2>
          <h3 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 leading-tight">{greeting}, {userName.split(" ")[0]}!</h3>
          
          {/* Replaced Learning Progress with Verified Certificate Counter */}
          <div className="mt-8 mb-10">
            <div className="inline-flex items-center gap-4 bg-white/10 border border-white/20 p-4 rounded-2xl backdrop-blur-sm">
              <div className="p-3 bg-orange-500 rounded-full text-white">
                <Award size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-300">GyanHub Verified Certificates</p>
                <p className="text-2xl font-bold text-white">{certificates.length} Earned</p>
              </div>
            </div>
          </div>
          
          <button onClick={() => onNavigate("learning")} className="bg-[#F2711C] hover:bg-orange-500 text-white px-8 py-4 rounded-full font-bold text-base flex items-center gap-3 transition-all hover:scale-105 shadow-xl shadow-orange-600/30">
            {totalCourses > 0 ? "Continue Learning" : "Explore Courses"} <ArrowRight size={20} strokeWidth={3} />
          </button>
        </div>
      </div>

      {/* Quick Actions (Removed Resume Course KPI per request) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { icon: Download, label: "Certificates", color: "text-emerald-600", bg: "bg-emerald-50", action: () => onNavigate("achievements") },
          { icon: Calendar, label: "Live Classes", color: "text-purple-600", bg: "bg-purple-50", action: () => onNavigate("learning") },
          { icon: MessageCircle, label: "Contact Mentor", color: "text-orange-600", bg: "bg-orange-50", action: () => onNavigate("support") },
        ].map((item, i) => (
          <motion.div whileHover={{ y: -4 }} key={i} onClick={item.action} className="cursor-pointer bg-white p-5 rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-slate-100 flex flex-col items-center justify-center text-center gap-3 transition-all">
             <div className={`p-4 rounded-full ${item.bg} ${item.color}`}><item.icon size={24} strokeWidth={2.5}/></div>
             <p className="font-bold text-slate-700 text-sm">{item.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
        <h3 className="text-xl font-bold text-[#12203D] mb-8">Recent Activity</h3>
        {timelineEvents.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-slate-400 bg-slate-50 rounded-[2rem]">
            <Clock size={40} className="mb-4 opacity-40 text-slate-500" />
            <p className="text-base font-semibold text-slate-600">Your journey starts here.</p>
            <p className="text-sm font-medium mt-1">Enroll in a course to see activity.</p>
          </div>
        ) : (
          <div className="space-y-0 relative before:absolute before:inset-0 before:ml-6 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-slate-200 before:to-transparent">
            {/* IMPROVEMENT #12: Better Timeline */}
            {timelineEvents.map((e: any, index: number) => (
              <div key={e.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active py-4">
                <div className="flex items-center justify-center w-12 h-12 rounded-full border-4 border-white bg-blue-50 text-blue-600 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm relative z-10 ml-0 md:ml-auto">
                  <BookOpen size={20} strokeWidth={2.5} />
                </div>
                <div className="w-[calc(100%-4rem)] md:w-[calc(50%-3rem)] bg-white p-5 rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.04)] border border-slate-100 ml-4 md:ml-0 hover:shadow-md transition-shadow">
                  <p className="text-base font-bold text-slate-800">{e.title}</p>
                  <time className="text-xs font-semibold text-slate-400 uppercase tracking-wide mt-2 block">{e.date.toLocaleDateString()}</time>
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
    { key: "all", label: "All Courses" }, { key: "online", label: "Online" }, { key: "offline", label: "Offline" }, { key: "recording", label: "Recordings" },
  ];

  return (
    <div className="space-y-10 w-full">
      <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-6">
        <h2 className="text-4xl font-extrabold tracking-tight text-[#12203D]">Keep Learning</h2>
        
        {/* Fix for Black Label UI Issue: Enforcing explicit white text properties to avoid global class overrides */}
        <div className="flex flex-wrap gap-3">
          <Link href="/onlinecourse" className="flex items-center gap-2 bg-[#12203D] hover:bg-slate-800 text-white !text-white px-6 py-3 rounded-full font-bold text-sm transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5">
            <Sparkles size={18} className="text-white"/> <span className="text-white">Explore Online</span>
          </Link>
          <Link href="/offline-class" className="flex items-center gap-2 bg-[#12203D] hover:bg-slate-800 text-white !text-white px-6 py-3 rounded-full font-bold text-sm transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5">
            <MapPin size={18} className="text-white"/> <span className="text-white">Explore Physical</span>
          </Link>
          <Link href="/recording" className="flex items-center gap-2 bg-[#12203D] hover:bg-slate-800 text-white !text-white px-6 py-3 rounded-full font-bold text-sm transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5">
            <PlayCircle size={18} className="text-white"/> <span className="text-white">Explore Recording</span>
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 bg-white p-2 rounded-full shadow-sm border border-slate-100 inline-flex">
        {FILTERS.map((f) => {
          const isActive = filter === f.key;
          return (
            <button key={f.key} onClick={() => setFilter(f.key)} className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all ${isActive ? "bg-[#12203D] text-white shadow-md" : "text-slate-500 hover:text-slate-800"}`}>
              {f.label}
            </button>
          );
        })}
      </div>

      {items.length === 0 ? (
        // IMPROVEMENT #7: Better Empty States
        <div className="text-center py-32 bg-white rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col items-center justify-center">
          <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mb-6">
            <Compass size={40} className="text-blue-500" strokeWidth={2} />
          </div>
          <h3 className="text-2xl font-bold text-[#12203D] mb-3">No courses here yet</h3>
          <p className="text-slate-500 font-medium text-base mb-8 max-w-sm">Ready to build new skills? Explore our catalog and start learning today.</p>
          <Link href="/onlinecourse" className="bg-[#12203D] hover:bg-slate-800 text-white px-8 py-4 rounded-full font-bold shadow-lg transition-transform hover:scale-105">Browse Catalog</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
  
  const getCourseTypeVariant = (type: CourseType) => {
    if (type === 'online') return 'brand';
    if (type === 'offline') return 'accent';
    return 'neutral';
  };

  // Generate a stable random gradient based on title length for cover image placeholder
  const gradients = [
    "from-blue-100 to-indigo-100", "from-orange-100 to-amber-100", 
    "from-emerald-100 to-teal-100", "from-purple-100 to-fuchsia-100"
  ];
  const coverGradient = gradients[item.title.length % gradients.length];

  return (
    // IMPROVEMENT #1, #9: Add Course Cover Images (Gradient Mock) & Remove Card Overload
    <motion.div whileHover={{ y: -4 }} className="rounded-[2rem] bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden flex flex-col transition-all">
      <div className={`h-32 bg-gradient-to-br ${coverGradient} relative flex items-end p-6`}>
         {/* Decorative Icon */}
         <div className="absolute top-6 right-6 p-3 bg-white/50 backdrop-blur-md rounded-2xl text-[#12203D]">
            <BookOpen size={24} strokeWidth={2} />
         </div>
         <div className="flex flex-wrap gap-2 relative z-10">
           <Pill variant={getCourseTypeVariant(item.courseType)}>{item.courseType.toUpperCase()}</Pill>
           <StatusBadge status={item.status} />
         </div>
      </div>
      
      <div className="p-6 md:p-8 flex flex-col flex-1">
        <h3 className="font-extrabold text-2xl text-[#12203D] mb-4 leading-tight">{item.title}</h3>
        
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-slate-500 font-semibold mb-8">
          {item.location && <span className="flex items-center gap-2"><MapPin size={18} className="text-slate-400" /> {item.location}</span>}
          {item.startingDate && <span className="flex items-center gap-2"><Calendar size={18} className="text-slate-400" /> {formatDate(item.startingDate)}</span>}
          {item.timing && <span className="flex items-center gap-2"><Clock size={18} className="text-slate-400" /> {item.timing}</span>}
          {item.meta?.tutorName && <span className="flex items-center gap-2"><UserIcon size={18} className="text-slate-400" /> {item.meta.tutorName}</span>}
        </div>

        {/* Action / Warning areas */}
        {item.status === "rejected" ? (
          <div className="bg-rose-50 border border-rose-100 rounded-2xl p-5 flex flex-col gap-4 mb-6">
            <div>
              <p className="text-base font-bold text-rose-900 flex items-center gap-2 mb-1"><AlertCircle size={18} /> Payment Rejected</p>
              <p className="text-sm text-rose-700 font-medium">Your last payment was not accepted.</p>
            </div>
            <button onClick={() => goPay(item.title, item.currentDueToPay > 0 ? item.currentDueToPay : item.remainingAmount, item.courseType)} className="bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 rounded-xl text-sm transition-colors">Retry Payment</button>
          </div>
        ) : !item.isFullyPaid && item.currentDueToPay > 0 && !item.hasUnverifiedPayment ? (
          <div className="bg-orange-50 border border-orange-100 rounded-2xl p-5 flex flex-col gap-4 mb-6">
            <p className="text-base font-bold text-orange-900 flex items-center gap-2">
              <AlertCircle size={18} /> Action Required: Rs. {item.currentDueToPay} Due
            </p>
            <button onClick={() => goPay(item.title, item.currentDueToPay, item.courseType)} className="bg-[#F2711C] hover:bg-orange-600 text-white font-bold py-3 rounded-xl text-sm shadow-sm transition-colors">Pay Rs. {item.currentDueToPay}</button>
          </div>
        ) : !item.isFullyPaid && item.currentDueToPay === 0 && item.remainingAmount > 0 && !item.hasUnverifiedPayment ? (
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 flex flex-col gap-4 mb-6">
            <p className="text-sm font-bold text-blue-900 flex items-center gap-2"><CheckCircle size={18} /> Seat Reserved</p>
            <button onClick={() => goPay(item.title, item.remainingAmount, item.courseType)} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl text-sm shadow-sm transition-colors">Pay Remaining</button>
          </div>
        ) : null}

        {/* Action Buttons */}
        <div className="mt-auto pt-6 border-t border-slate-100 flex flex-col sm:flex-row gap-3">
          {item.courseType === "recording" && (
            item.hasUnverifiedPayment ? (
              <div className="flex justify-center items-center gap-3 bg-slate-50 text-slate-500 py-3.5 rounded-xl w-full font-bold text-sm"><Lock size={18} /> Pending Verification</div>
            ) : (
              <button onClick={() => item.meta?.recordingLink ? window.open(item.meta.recordingLink, "_blank") : router.push(`/recording/${encodeURIComponent(item.title)}`)} className="bg-[#12203D] hover:bg-slate-800 text-white py-3.5 px-6 rounded-xl font-bold text-sm flex-1 flex justify-center items-center gap-2 transition-transform hover:scale-[1.02]"><PlayCircle size={20} /> Watch Recording</button>
            )
          )}
          {item.courseType === "online" && (
            item.hasUnverifiedPayment || !item.isFullyPaid ? (
              <div className="flex justify-center items-center gap-3 bg-slate-50 text-slate-500 py-3.5 rounded-xl w-full font-bold text-sm"><Lock size={18} /> Clear dues to unlock</div>
            ) : (
              <>
                <button onClick={() => !isClassStarted ? onOpenOrientationModal({ link: "#", date: item.startingDate }) : window.open("#", "_blank")} className="flex-1 bg-[#12203D] hover:bg-slate-800 text-white py-3.5 px-6 rounded-xl font-bold text-sm flex justify-center items-center gap-2 transition-transform hover:scale-[1.02]"><Video size={20} /> {isClassStarted ? "Join Class" : "Orientation"}</button>
                <a href={item.meta?.classroomLink || "#"} target="_blank" rel="noopener noreferrer" className="flex-1 bg-slate-100 hover:bg-slate-200 text-[#12203D] py-3.5 px-6 rounded-xl font-bold text-sm flex justify-center items-center gap-2 transition-colors"><BookOpen size={20} /> Classroom</a>
              </>
            )
          )}
          {item.courseType === "offline" && (
            <div className="flex justify-center items-center gap-2 py-3.5 text-sm font-bold text-slate-600 bg-slate-50 rounded-xl w-full"><MapPin size={18} className="text-[#F2711C]" /> Class at Center</div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function AchievementsView({ certificates, formatDate, showToast }: any) {
  return (
    <div className="space-y-10 w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-4xl font-extrabold tracking-tight text-[#12203D]">Your Certificates</h2>
        {certificates?.length > 0 && <Pill variant="accent">{certificates.length} Earned</Pill>}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {!certificates || certificates.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center bg-white rounded-[2.5rem] py-32 px-6 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] text-center">
            <div className="w-24 h-24 bg-amber-50 rounded-full flex items-center justify-center mb-6">
              <Award size={40} className="text-amber-500" strokeWidth={2} />
            </div>
            <p className="text-[#12203D] font-bold text-2xl mb-3">No certificates earned yet</p>
            <p className="text-slate-500 font-medium text-base">Complete a course to unlock your first achievement.</p>
          </div>
        ) : certificates.map((cert: any) => (
          <motion.div whileHover={{ y: -4 }} key={cert.id} className="bg-white border border-slate-100 rounded-[2rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col gap-6 transition-all">
            <div className="flex justify-between items-start">
              <div className="p-4 bg-amber-50 text-amber-500 rounded-2xl"><Award size={32} strokeWidth={2.5}/></div>
              <div className="text-right">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Issue Date</p>
                <p className="text-base font-bold text-slate-800">{formatDate(cert.issue_date)}</p>
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-extrabold text-[#12203D] mb-2 leading-tight">{cert.syllabus_name || cert.name}</h3>
              <p className="text-base text-slate-500 font-medium">Issued to: <span className="font-bold text-slate-800">{cert.name}</span></p>
            </div>
            <div className="border-t border-slate-100 pt-6 flex flex-col sm:flex-row gap-3">
              <a href={`/certificate?name=${encodeURIComponent(cert.name)}&email=${encodeURIComponent(cert.email)}`} target="_blank" rel="noopener noreferrer" className="flex-1 bg-[#12203D] hover:bg-slate-800 text-white font-bold py-3.5 rounded-xl text-sm flex justify-center items-center gap-2 transition-transform hover:scale-[1.02]"><ExternalLink color="white" size={18} /> View Certificate</a>
              <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/certificate?name=${encodeURIComponent(cert.name)}&email=${encodeURIComponent(cert.email)}`); showToast("Certificate link copied!"); }} className="flex-1 bg-slate-100 hover:bg-slate-200 text-[#12203D] font-bold py-3.5 rounded-xl text-sm flex justify-center items-center gap-2 transition-colors"><Copy size={18} /> Copy Link</button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function PaymentsView({ orders, enrollments, physicalLeads, formatDate, setSelectedTransaction, router, goPay }: any) {
  return (
    <div className="space-y-10 w-full">
      <h2 className="text-4xl font-extrabold tracking-tight text-[#12203D]">Billing & Invoices</h2>
      
      {(!orders || orders.length === 0) ? (
        <div className="flex flex-col items-center justify-center bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[2.5rem] py-32 px-6 border border-slate-100 text-center">
          <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mb-6">
            <Receipt size={40} className="text-blue-500" strokeWidth={2} />
          </div>
          <p className="text-[#12203D] font-bold text-2xl mb-3">No transaction history</p>
          <p className="text-slate-500 font-medium text-base">Your invoices and dues will appear here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order: any) => {
            const relatedEnrollment = enrollments?.find((e: any) => e.id === order.enrollment_id || (e.course_name?.toLowerCase() === order.order_name?.toLowerCase()));
            const relatedLead = physicalLeads?.find((l: any) => l.id === order.leads_id || (l.course_title?.toLowerCase() === order.order_name?.toLowerCase()));
            const remainingDue = order.remaining_amount ?? relatedEnrollment?.remaining_amount ?? (relatedLead ? Math.max(0, (relatedLead.discount_price ?? relatedLead.course_price ?? 0) - (relatedLead.booking_amount ?? 0)) : 0);
            
            const totalAmount = (Number(order.paid_amount) || 0) + (Number(remainingDue) || 0);
            const paidPercent = totalAmount === 0 ? 100 : Math.round((Number(order.paid_amount) / totalAmount) * 100);
            
            const hasPending = order.pending_amount > 0;
            const isRejected = order.status?.toLowerCase() === "rejected";

            return (
              <motion.div whileHover={{ scale: 1.01 }} key={order.id} onClick={() => setSelectedTransaction(order)} className="cursor-pointer bg-white p-6 md:p-8 rounded-[2rem] border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col lg:flex-row lg:items-center justify-between gap-6 transition-all">
                <div className="flex items-start md:items-center gap-5 flex-1 min-w-0">
                  <div className="p-4 bg-slate-50 rounded-2xl text-slate-500 shrink-0">
                    {isRejected ? <AlertCircle size={24} className="text-rose-500"/> : hasPending ? <Clock size={24} className="text-amber-500" /> : <Receipt size={24} className="text-blue-500" />}
                  </div>
                  <div className="overflow-hidden flex-1 min-w-0">
                    <p className="font-extrabold text-[#12203D] text-lg truncate mb-1">{order.service}</p>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{order.order_type} • {formatDate(order.created_at)}</p>
                  </div>
                </div>

                {/* IMPROVEMENT #15: Payment Visualizations */}
                <div className="flex-1 w-full lg:max-w-xs flex flex-col gap-2">
                   <div className="flex justify-between text-sm font-bold text-slate-700">
                     <span>Rs. {order.paid_amount} Paid</span>
                     {remainingDue > 0 ? <span className="text-orange-600">Rs. {remainingDue} Left</span> : <span className="text-emerald-600">Fully Paid</span>}
                   </div>
                   <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                      <div className={`h-full rounded-full ${remainingDue === 0 ? 'bg-emerald-500' : 'bg-[#12203D]'}`} style={{ width: `${Math.min(paidPercent, 100)}%` }} />
                   </div>
                </div>

                <div className="text-right flex items-center justify-between lg:flex-col lg:items-end lg:justify-center gap-3 w-full lg:w-auto mt-2 lg:mt-0 pt-4 lg:pt-0 border-t border-slate-100 lg:border-0">
                  <StatusBadge status={order.status} />
                  {isRejected ? (
                    <button onClick={(e) => { e.stopPropagation(); goPay(relatedEnrollment?.course_name || relatedLead?.course_title || order.order_name, remainingDue || order.paid_amount, order.order_type); }} className="px-6 py-2.5 text-sm font-bold rounded-full bg-rose-600 hover:bg-rose-700 text-white transition-transform hover:scale-105">Retry</button>
                  ) : remainingDue > 0 && !hasPending && (
                    <button onClick={(e) => { e.stopPropagation(); goPay(relatedEnrollment?.course_name || relatedLead?.course_title || order.order_name, remainingDue, order.order_type); }} className="px-6 py-2.5 text-sm font-bold rounded-full bg-[#F2711C] hover:bg-orange-600 text-white transition-transform hover:scale-105">Pay Now</button>
                  )}
                </div>
              </motion.div>
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
    <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} className="bg-white rounded-[2rem] w-full max-w-xl shadow-2xl flex flex-col relative max-h-[90vh] overflow-hidden">
      <div className="flex items-center justify-between p-8 border-b border-slate-100 bg-slate-50/50">
        <h4 className="text-2xl font-extrabold text-[#12203D]">Receipt</h4>
        <button onClick={onClose} className="p-2 bg-white rounded-full shadow-sm text-slate-400 hover:text-slate-800 transition-colors"><X size={20} strokeWidth={2.5} /></button>
      </div>
      <div className="p-8 space-y-8 overflow-y-auto">
        <div className="text-center">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">{order.order_type} PURCHASE</p>
          <h4 className="text-2xl font-extrabold text-[#12203D]">{order.service}</h4>
        </div>
        
        {isRejected && (
          <div className="p-5 bg-rose-50 rounded-2xl flex items-start gap-4">
            <AlertCircle className="text-rose-500 shrink-0 mt-0.5" size={24} />
            <div className="flex-1">
              <p className="text-base font-bold text-rose-900 mb-1">Payment rejected</p>
              <p className="text-sm text-rose-700 font-medium">Please verify your details and retry your payment.</p>
            </div>
            <button onClick={() => goPay(relatedEnrollment?.course_name || relatedLead?.course_title || order.order_name, remainingDue || order.paid_amount, order.order_type)} className="shrink-0 bg-rose-600 hover:bg-rose-700 text-white font-bold px-5 py-2.5 rounded-full text-sm">Retry</button>
          </div>
        )}
        
        <div className="grid grid-cols-2 gap-4">
          <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100"><p className="text-xs uppercase font-bold text-slate-400 tracking-widest mb-2">Amount Paid</p><p className="font-extrabold text-2xl text-[#12203D]">Rs. {order.paid_amount}</p></div>
          <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100"><p className="text-xs uppercase font-bold text-slate-400 tracking-widest mb-2">Date</p><p className="font-bold text-[#12203D] text-xl">{new Date(order.created_at).toLocaleDateString()}</p></div>
          {hasPending && <div className="col-span-2 p-5 bg-amber-50 rounded-2xl"><p className="text-xs uppercase font-bold text-amber-600 tracking-widest mb-2">Unverified Amount</p><p className="font-extrabold text-2xl text-amber-700">Rs. {order.pending_amount}</p></div>}
          
          <div className={`col-span-2 p-6 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${remainingDue > 0 ? "bg-orange-50 border border-orange-100" : "bg-emerald-50 border border-emerald-100"}`}>
            <div>
               <p className={`text-xs uppercase font-bold tracking-widest mb-2 ${remainingDue > 0 ? "text-orange-600" : "text-emerald-600"}`}>Remaining Due</p>
               <p className={`font-extrabold text-2xl ${remainingDue > 0 ? "text-orange-700" : "text-emerald-700"}`}>{remainingDue > 0 ? `Rs. ${remainingDue}` : "Fully Paid"}</p>
            </div>
            {!isRejected && remainingDue > 0 && !hasPending && <button onClick={() => goPay(relatedEnrollment?.course_name || relatedLead?.course_title || order.order_name, remainingDue, order.order_type)} className="w-full sm:w-auto shrink-0 font-bold px-8 py-4 rounded-xl text-base bg-[#F2711C] hover:bg-orange-600 text-white shadow-md">Pay Now</button>}
          </div>
        </div>
        
        <div>
          <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">Payment Receipt</h4>
          {order.screenshot_url ? (
            <div className="bg-slate-50 p-3 rounded-[1.5rem]"><img src={getScreenshotUrl(order.screenshot_url)} alt="Receipt" className="w-full object-contain rounded-xl max-h-[300px]" /></div>
          ) : (
            <div className="py-12 bg-slate-50 rounded-[1.5rem] text-center flex flex-col items-center text-slate-400"><SearchX size={32} strokeWidth={1.5} className="mb-3 opacity-50" /><p className="font-semibold text-sm">No receipt image provided</p></div>
          )}
          {order.status === "verified" && !order.id.startsWith("synth-") && <button onClick={() => router.push(`/invoice/${order.id}`)} className="mt-6 w-full py-4 bg-[#12203D] hover:bg-slate-800 text-white rounded-xl font-bold flex justify-center items-center gap-2 shadow-lg hover:shadow-xl transition-all"><Receipt size={20} /> View Official Invoice</button>}
        </div>
      </div>
    </motion.div>
  );
}

function SupportView({ userId, showToast }: any) {
  return (
    <div className="space-y-10 w-full">
      <h2 className="text-4xl font-extrabold tracking-tight text-[#12203D]">Need Help?</h2>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2"><ChatWidget userId={userId} showToast={showToast} /></div>
        <div className="space-y-6">
          <a href="https://wa.me/9763695665" target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[2rem] p-8 hover:shadow-md transition-shadow group">
            <div className="p-4 bg-green-50 rounded-2xl text-green-600 group-hover:scale-110 transition-transform"><Phone size={24} strokeWidth={2.5}/></div>
            <div>
               <p className="font-extrabold text-[#12203D] text-lg mb-1">WhatsApp Us</p>
               <p className="text-sm font-medium text-slate-500">Fastest response time</p>
            </div>
          </a>
          <a href="https://maps.app.goo.gl/CcgigHh5BRMhcHnEA" target="_blank" rel="noopener noreferrer" className="bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[2rem] p-8 block hover:shadow-md transition-shadow cursor-pointer">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Visit Our Office</p>
            <div className="flex items-start gap-4">
               <div className="p-4 bg-orange-50 rounded-2xl text-[#F2711C]"><MapPin size={24} strokeWidth={2.5}/></div>
               <p className="text-base font-bold text-[#12203D] leading-tight mt-1 hover:text-[#F2711C] transition-colors">New Baneshwor office <br/><span className="text-sm text-slate-500 font-medium block mt-1">(Near Eyeplex Mall)</span></p>
            </div>
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
    <div className="bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[2.5rem] overflow-hidden flex flex-col h-[600px] border border-slate-100">
      <div className="p-6 bg-[#12203D] text-white flex items-center gap-4 shrink-0">
        <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-sm"><MessageCircle size={24} strokeWidth={2.5}/></div>
        <div>
          <h3 className="font-extrabold text-lg">GyanHub Support</h3>
          <p className="text-white/80 text-xs font-bold uppercase tracking-widest mt-1 flex items-center gap-2"><span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" /> Online Now</p>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 bg-slate-50/50">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center text-slate-400">
            <div className="p-5 bg-slate-100 rounded-full mb-4"><MessageCircle size={32} className="text-slate-400" /></div>
            <p className="font-extrabold text-slate-700 text-lg mb-2">Start a conversation</p>
            <p className="font-medium text-sm max-w-xs text-slate-500">Ask us anything about courses, payments, or account issues.</p>
          </div>
        )}
        {messages.map((msg) => {
          const isOwn = msg.sender_role !== "admin";
          return (
            <div key={msg.id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
              {!isOwn && <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#12203D] to-blue-800 flex items-center justify-center text-white text-xs font-bold mr-3 mt-1 shrink-0 shadow-sm">G</div>}
              <div className={`max-w-[85%] sm:max-w-[70%] ${isOwn ? "items-end" : "items-start"} flex flex-col gap-1.5`}>
                <div className={`px-5 py-3.5 text-sm font-semibold shadow-sm ${isOwn ? "bg-[#12203D] text-white rounded-[1.5rem] rounded-br-md" : "bg-white text-slate-800 rounded-[1.5rem] rounded-bl-md border border-slate-100"}`}>{msg.content}</div>
                <span className="text-[10px] font-bold tracking-widest uppercase text-slate-400 px-2">{formatTime(msg.created_at)}</span>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} className="h-2" />
      </div>
      <div className="p-4 md:p-6 border-t border-slate-100 bg-white flex gap-4">
        <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") handleSend(); }} placeholder="Type your message…" className="flex-1 px-6 py-4 bg-slate-50 border border-slate-100 rounded-full text-sm font-semibold outline-none focus:border-[#12203D]/30 focus:ring-4 focus:ring-blue-50 transition-all" />
        <button onClick={handleSend} disabled={sending || !input.trim()} className="bg-[#12203D] hover:bg-slate-800 text-white w-14 h-14 rounded-full disabled:opacity-50 font-medium flex items-center justify-center shrink-0 transition-all shadow-lg hover:shadow-xl hover:-translate-y-1">{sending ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} strokeWidth={2.5}/>}</button>
      </div>
    </div>
  );
}

function AccountView({ userName, userEmail, onSignOut }: any) {
  return (
    <div className="space-y-10 w-full max-w-2xl">
      <h2 className="text-4xl font-extrabold tracking-tight text-[#12203D]">Account Setup</h2>
      <div className="bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[2.5rem] p-8 md:p-10 space-y-8 border border-slate-100">
        <div>
           <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Full Name</p>
           <p className="font-extrabold text-2xl text-slate-800">{userName}</p>
        </div>
        <div className="h-px bg-slate-100 w-full" />
        <div>
           <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Email Address</p>
           <p className="font-extrabold text-2xl text-slate-800">{userEmail}</p>
        </div>
      </div>
      <button onClick={onSignOut} className="w-full flex items-center justify-center gap-3 px-8 py-5 rounded-2xl font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 transition-colors text-lg"><LogOut size={24} /> Sign out securely</button>
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
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-6">
      <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} className="bg-white rounded-[2.5rem] w-full max-w-lg flex flex-col relative shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-8 bg-[#12203D] text-white">
          <h3 className="text-2xl font-extrabold flex items-center gap-3"><Video size={28}/> Orientation Session</h3>
          <button onClick={onClose} className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors"><X size={20} strokeWidth={2.5}/></button>
        </div>
        <div className="p-10 text-center">
          <p className="text-slate-600 mb-8 font-semibold text-lg">Session begins exactly at 8:00 PM (NST).</p>
          <div className="grid grid-cols-4 gap-4 mb-10">
            {[["Days", timeLeft.d], ["Hours", timeLeft.h], ["Mins", timeLeft.m], ["Secs", timeLeft.s]].map(([label, val]) => (
              <div key={label as string} className="bg-slate-50 border border-slate-100 rounded-[1.5rem] py-6 flex flex-col items-center justify-center shadow-inner">
                <span className="text-3xl font-extrabold text-[#12203D]">{String(val).padStart(2, "0")}</span>
                <span className="text-xs uppercase font-bold text-slate-400 tracking-widest mt-2">{label}</span>
              </div>
            ))}
          </div>
          <button onClick={() => { onClose(); window.open(data.link, "_blank"); }} className="w-full py-5 bg-[#F2711C] hover:bg-orange-600 text-white rounded-2xl font-bold text-lg flex justify-center items-center gap-3 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">Join Orientation Now</button>
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
    <Suspense fallback={<div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-6"><Loader2 className="animate-spin text-blue-500 w-12 h-12" /><p className="text-slate-600 font-bold text-lg tracking-wide">Waking up dashboard...</p></div>}>
      <DashboardContent />
    </Suspense>
  );
}