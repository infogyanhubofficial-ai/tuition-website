"use client";

/**
 * MASTER DASHBOARD — app/dashboard/page.tsx
 * ------------------------------------------------------------------
 * Replaces: dashboard/layout.tsx + dashboard/page.tsx + dashboard/physical-classes/page.tsx
 *
 * Architecture follows the "ecosystem, not product-catalog" recommendation:
 *  Dashboard → Learning → Achievements → Payments → Support → Account
 *
 * "Physical Classes" is no longer a separate route/page — it is a
 * course TYPE (Online / Offline / Hybrid) rendered inside Learning,
 * alongside online enrollments and recordings.
 *
 * NOTE: This file focuses on data relations/wiring, reusing the visual
 * language (Tailwind classes, motion patterns) already used across the
 * three source files provided. Swap in your real design system as needed.
 * ------------------------------------------------------------------
 */

import React, { useState, useEffect, useMemo, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Home, BookOpen, Award, Receipt, Compass, Phone, LogOut, Menu, X,
  MessageCircle, PlayCircle, ChevronDown, Sparkles, AlertCircle, ShoppingBag,
  Send, SearchX, CheckCircle, Loader2, Clock, MapPin, Video, Lock, Calendar,
  ArrowRight, Crown, Copy, ExternalLink, Settings, User as UserIcon
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { StatusBadge, SkeletonLoader } from "@/components/dashboard/shared";

// =====================================================================
// CONSTANTS / RELATIONS
// =====================================================================

// Recording bundle → child-course expansion (relation: 1 order -> N courses)
const BUNDLES: Record<string, string[]> = {
  "architectural design": ["AutoCAD Basic to Advanced Course", "Autodesk Revit", "Architectural Visualization: AutoCAD, SketchUp, Enscape & Photoshop"],
  "architectural design bundle": ["AutoCAD Basic to Advanced Course", "Autodesk Revit", "Architectural Visualization: AutoCAD, SketchUp, Enscape & Photoshop"],
  "civil engineering": ["Structural Design and Analysis", "Estimation, Costing & Contract Billing", "Property Valuation"],
  "civil engineering bundle": ["Structural Design and Analysis", "Estimation, Costing & Contract Billing", "Property Valuation"],
  "complete engineering package": ["AutoCAD Basic to Advanced Course", "Autodesk Revit", "Architectural Visualization: AutoCAD, SketchUp, Enscape & Photoshop", "Structural Design and Analysis", "Estimation, Costing & Contract Billing", "Property Valuation", "ArcGIS and Mapping"],
  "complete engineering package bundle": ["AutoCAD Basic to Advanced Course", "Autodesk Revit", "Architectural Visualization: AutoCAD, SketchUp, Enscape & Photoshop", "Structural Design and Analysis", "Estimation, Costing & Contract Billing", "Property Valuation", "ArcGIS and Mapping"],
};

// The new ecosystem-first nav. Nothing here names a product; everything
// names a *journey*. Sub-items are rendered by the active top-level key.
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

// Any row flagged deleted (either `is_deleted` or `deleted` column) is
// treated as if it doesn't exist — never surfaced anywhere in the dashboard.
const notDeleted = (rows: any[] | null | undefined) => (rows || []).filter((r) => !r?.is_deleted && !r?.deleted);

// Unified learning-item shape — this is the ONE relation every course
// type (online enrollment, offline/physical lead, recording order)
// gets normalized into, so the UI never needs to branch on data source.
interface LearningItem {
  id: string;
  courseType: CourseType;
  title: string;
  status: "confirmed" | "pending" | "rejected";
  batchNo?: number;
  startingDate?: string | null;
  location?: string | null; // only offline
  timing?: string | null;
  paidAmount: number;
  remainingAmount: number;
  lockedPrice?: number;
  isFullyPaid: boolean;
  hasUnverifiedPayment: boolean;
  meta?: { tutorName?: string; duration?: string; classroomLink?: string; whatsappLink?: string; recordingLink?: string; original_bundle?: string };
}

// =====================================================================
// SMALL SHARED UI
// =====================================================================

const Toast = ({ message, type, onClose }: { message: string; type: "success" | "error"; onClose: () => void }) => (
  <motion.div initial={{ y: 50, opacity: 0, scale: 0.9 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 20, opacity: 0, scale: 0.9 }}
    className="fixed bottom-6 right-6 z-[9999] bg-slate-900 text-white px-5 py-3.5 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.2)] flex items-center gap-3 border border-slate-700">
    {type === "success" ? <CheckCircle className="text-emerald-400 w-5 h-5" /> : <AlertCircle className="text-red-400 w-5 h-5" />}
    <span className="font-bold text-sm tracking-wide">{message}</span>
    <button onClick={onClose} className="ml-2 text-slate-400 hover:text-white transition-colors"><X size={16} /></button>
  </motion.div>
);

function NavButton({ icon, label, active, onClick }: any) {
  return (
    <button onClick={onClick} className={`relative w-full flex items-center gap-3 px-4 py-3 sm:py-3.5 rounded-xl text-sm font-bold transition-all border-l-[3px] group overflow-hidden ${active ? "text-blue-700" : "border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/50"}`}>
      {active && <motion.div layoutId="sidebar-active" className="absolute inset-0 bg-blue-50 border-l-[3px] border-blue-500 z-0" transition={{ type: "spring", stiffness: 400, damping: 30 }} />}
      <div className={`relative z-10 flex items-center gap-3 w-full`}>
        <div className={active ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600"}>{icon}</div>
        <span>{label}</span>
      </div>
    </button>
  );
}

function MobileNavButton({ icon, label, active, onClick }: any) {
  return (
    <motion.button whileTap={{ scale: 0.92 }} onClick={onClick} className={`flex flex-col items-center gap-1 p-1.5 sm:p-2 min-w-[55px] transition-all ${active ? "text-blue-700" : "text-slate-400"}`}>
      <div className={`p-2 rounded-full transition-all ${active ? "bg-blue-50 scale-110 shadow-[0_0_15px_rgba(37,99,235,0.3)]" : ""}`}>
        {React.cloneElement(icon, { size: active ? 20 : 18 })}
      </div>
      {active && <span className="text-[10px] font-extrabold tracking-widest">{label}</span>}
    </motion.button>
  );
}

// =====================================================================
// PAGE
// =====================================================================

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  // ---- Auth / profile ----
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState("");
  const [userName, setUserName] = useState("User");
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  // ---- Nav state ----
  const initialTab = (searchParams.get("tab") as NavKey) || "dashboard";
  const [activeTab, setActiveTab] = useState<NavKey>(initialTab);
  const [learningFilter, setLearningFilter] = useState<"all" | CourseType>("all");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // ---- Toast ----
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const showToast = (message: string, type: "success" | "error" = "success") => { setToast({ message, type }); setTimeout(() => setToast(null), 4000); };

  // ---- Raw data (relations straight from Supabase) ----
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<any[]>([]);
  const [certificates, setCertificates] = useState<any[]>([]);
  const [enrollments, setEnrollments] = useState<any[]>([]); // online (enrollments_v2)
  const [courseBatches, setCourseBatches] = useState<any[]>([]);
  const [recordingsList, setRecordingsList] = useState<any[]>([]);
  const [onlineCourseDetails, setOnlineCourseDetails] = useState<any[]>([]);
  const [physicalLeads, setPhysicalLeads] = useState<any[]>([]); // offline (physical_leads)

  // ---- Modals ----
  const [orientationData, setOrientationData] = useState<{ link: string; date: string } | null>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<any | null>(null);

  useEffect(() => { document.title = `GyanHub | ${activeTab}`; }, [activeTab]);

  // -------------------------------------------------------------
  // FETCH — one effect, every relation the dashboard needs
  // -------------------------------------------------------------
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
            created_at: o.created_at, enrollment_id: o.enrollment_id, service: o.order_name || "GyanHub Service",
          }));

        const { data: certs } = await supabase.from("certificates").select("*").ilike("email", email);
        setCertificates(notDeleted(certs));

        const { data: recordings } = await supabase.from("recordings").select("*");
        setRecordingsList(notDeleted(recordings));

        const { data: leads } = await supabase.from("physical_leads").select("*").eq("email", email).eq("deleted", false).order("created_at", { ascending: false });
        setPhysicalLeads(notDeleted(leads));

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
          setCourseBatches(batchesV2);
          setOnlineCourseDetails(coursesV2);
        }

        // =====================================================================
        // FIX IMPLEMENTATION: RECONCILE MISSING ORDERS ROWS FROM ENROLLMENTS
        // =====================================================================
        // If an enrollment contains a remaining balance but possesses no valid matching line row 
        // within orders_v2, we generate a synthetic invoice row so it surfaces correctly in Payments.
        const synthesizedOrders = [...mappedOrders];
        
        finalMappedEnrollments.forEach((e: any) => {
          const hasLinkedOrderRow = mappedOrders.some(o => o.enrollment_id === e.id || (o.order_name?.toLowerCase() === e.course_name?.toLowerCase()));
          
          if (!hasLinkedOrderRow && e.remaining_amount > 0) {
            synthesizedOrders.push({
              id: `synth-${e.id}`,
              order_type: "online course",
              order_name: e.course_name,
              paid_amount: e.paid_amount,
              pending_amount: 0,
              remaining_amount: e.remaining_amount,
              locked_price: e.locked_price,
              screenshot_url: "",
              status: "pending",
              created_at: e.created_at,
              enrollment_id: e.id,
              service: e.course_name,
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

  // -------------------------------------------------------------
  // DERIVED — normalize every source into one LearningItem[] list
  // -------------------------------------------------------------
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

  const pendingVerificationOrders = useMemo(() => orders.filter((o) => (o.pending_amount || 0) > 0 || ["pending", "processing"].includes(o.status.toLowerCase())), [orders]);
  const pendingCoursePayments = useMemo(() => enrollments.filter((e) => e.remaining_amount > 0), [enrollments]);

  const learningItems: LearningItem[] = useMemo(() => {
    const online: LearningItem[] = enrollments.map((e) => ({
      id: e.id, courseType: "online", title: e.course_name, status: e.status,
      batchNo: e.batch_no, startingDate: e.starting_date, timing: e.batch?.timing,
      paidAmount: e.paid_amount, remainingAmount: e.remaining_amount, lockedPrice: e.locked_price,
      isFullyPaid: (e.remaining_amount || 0) <= 0,
      hasUnverifiedPayment: pendingVerificationOrders.some((o) => o.enrollment_id === e.id || (o.order_name?.toLowerCase() === e.course_name?.toLowerCase() && o.order_type !== "recording")),
      meta: { tutorName: e.tutor_name, duration: e.duration, classroomLink: e.batch?.google_classroom_link, whatsappLink: e.batch?.whatsapp_group_link },
    }));

    const recordings: LearningItem[] = expandedRecordingOrders.map((r) => {
      const matched = recordingsList.find((rl) => rl.course_name.toLowerCase() === r.order_name.toLowerCase());
      const st = r.status?.toLowerCase();
      return {
        id: r.id, courseType: "recording", title: r.order_name,
        status: st === "verified" ? "confirmed" : st === "rejected" ? "rejected" : "pending",
        paidAmount: r.paid_amount, remainingAmount: st === "rejected" ? r.paid_amount || 0 : 0,
        isFullyPaid: st === "verified", hasUnverifiedPayment: st === "pending" || st === "processing",
        meta: { recordingLink: matched?.recording_link, original_bundle: r.original_bundle },
      };
    });

    const offline: LearningItem[] = physicalLeads.map((l) => {
      const total = l.discount_price ?? l.course_price;
      const paid = l.booking_amount || 0;
      const remaining = Math.max(0, total - paid);
      const isRejected = l.status?.toLowerCase() === "rejected";
      return {
        id: l.id, courseType: "offline", title: l.course_title,
        status: isRejected ? "rejected" : l.is_confirmed ? "confirmed" : "pending",
        batchNo: l.batch_no, startingDate: l.start_date, location: l.office_location,
        paidAmount: paid, remainingAmount: isRejected ? Math.max(paid, remaining) : remaining, lockedPrice: total,
        isFullyPaid: !isRejected && remaining <= 0, hasUnverifiedPayment: false,
      };
    });

    return [...online, ...recordings, ...offline];
  }, [enrollments, expandedRecordingOrders, recordingsList, physicalLeads, pendingVerificationOrders]);

  const filteredLearningItems = learningFilter === "all" ? learningItems : learningItems.filter((i) => i.courseType === learningFilter);
  const totalCourses = learningItems.length;

  const timelineEvents = useMemo(() => [
    ...orders.filter((o) => o.order_type === "recording").map((o) => ({ id: o.id, title: `Purchased ${o.order_name} recordings`, date: new Date(o.created_at) })),
    ...enrollments.map((e) => ({ id: e.id, title: `Enrolled in ${e.course_name}`, date: new Date(e.created_at) })),
    ...physicalLeads.map((l) => ({ id: l.id, title: `Applied for ${l.course_title} (Offline)`, date: new Date(l.created_at) })),
    ...certificates.map((c) => ({ id: `cert-${c.id}`, title: `Certificate: ${c.syllabus_name || c.name}`, date: new Date(c.issue_date) })),
  ].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 6), [orders, enrollments, physicalLeads, certificates]);

  const formatDate = (d?: string) => { if (!d) return "N/A"; const x = new Date(d); return isNaN(x.getTime()) ? "N/A" : x.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }); };

  const handleSignOut = async () => { await supabase.auth.signOut(); window.location.href = "/"; };
  const goPay = (courseName: string, amount: number) => router.push(`/order?order_type=course&courseName=${encodeURIComponent(courseName)}&price=${amount}`);

  // -------------------------------------------------------------
  // SIDEBAR
  // -------------------------------------------------------------
  const renderSidebar = (onNavigate?: () => void) => (
    <div className="space-y-1.5">
      {NAV.filter((n) => n.key !== "account").map((item) => (
        <NavButton
          key={item.key}
          icon={<item.icon size={20} />}
          label={item.label}
          active={activeTab === item.key}
          onClick={() => { setActiveTab(item.key); onNavigate?.(); }}
        />
      ))}
      <div className="h-px bg-slate-200/50 my-6 mx-4" />
      <a href="https://wa.me/9763695665" target="_blank" rel="noopener noreferrer" className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-slate-600 hover:bg-green-50 hover:text-green-700 transition-all group">
        <Phone size={20} className="text-slate-400 group-hover:text-green-500" /> WhatsApp Us
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
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsMobileMenuOpen(false)} className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] lg:hidden" />
            <motion.div initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} transition={{ type: "spring", bounce: 0, duration: 0.4 }} className="fixed inset-y-0 left-0 w-[80%] max-w-sm bg-white shadow-2xl z-[101] lg:hidden flex flex-col">
              <div className="p-4 sm:p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <span className="font-extrabold text-lg text-slate-900 truncate">{userName}&apos;s Menu</span>
                <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full"><X size={20} /></button>
              </div>
              <div className="flex-1 overflow-y-auto py-2">{renderSidebar(() => setIsMobileMenuOpen(false))}</div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* TOP BAR */}
      <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 h-[70px] sm:h-20 flex items-center px-4 sm:px-6 shadow-sm">
        <div className="max-w-7xl mx-auto w-full flex justify-between items-center">
          <div className="relative">
            <button onClick={() => PlayCircle && setIsProfileOpen(!isProfileOpen)} className="flex items-center gap-2 sm:gap-3 p-1.5 rounded-2xl hover:bg-slate-100 transition-all">
              {isLoadingUser ? <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-slate-200 animate-pulse" /> : userAvatar ? (
                <img src={userAvatar} className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl object-cover border border-slate-200" alt={userName} />
              ) : (
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl flex items-center justify-center text-white font-bold text-lg">{userName?.charAt(0).toUpperCase() || "G"}</div>
              )}
              <p className="flex items-center gap-1.5 sm:gap-2 text-[16px] sm:text-[20px] font-extrabold tracking-tight">
                <span className="text-slate-800">{isLoadingUser ? "Loading..." : userName}</span>
                <span className="text-slate-300 font-normal">|</span>
                <span className="text-blue-700 font-bold capitalize">{activeTab}</span>
              </p>
              <ChevronDown size={16} className={`text-slate-400 transition-transform ${isProfileOpen ? "rotate-180" : ""}`} />
            </button>
            <AnimatePresence>
              {isProfileOpen && (
                <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }} className="absolute left-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.08)] border border-slate-100 py-2 z-50">
                  <div className="px-4 py-3 border-b border-slate-100 mb-1">
                    <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Signed in as</p>
                    <p className="text-sm font-bold text-slate-800 truncate">{userName}</p>
                  </div>
                  <button onClick={() => { setActiveTab("account"); setIsProfileOpen(false); }} className="w-full text-left px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2"><Settings size={16} /> Account</button>
                  <button onClick={handleSignOut} className="w-full text-left px-4 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50 flex items-center gap-2"><LogOut size={16} /> Sign out</button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-4 sm:mt-8 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 flex-grow w-full">
        <aside className="hidden lg:block lg:col-span-3">
          <div className="sticky top-28 space-y-1">{renderSidebar()}</div>
        </aside>

        <main className="lg:col-span-9 w-full min-h-[500px]">
          {loading ? <SkeletonLoader /> : (
            <AnimatePresence mode="wait">
              <motion.div key={activeTab} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.3 }}>
                {activeTab === "dashboard" && (
                  <OverviewView
                    userName={userName} totalCourses={totalCourses} certificates={certificates}
                    pendingCoursePayments={pendingCoursePayments} onNavigate={setActiveTab} timelineEvents={timelineEvents}
                    learningItems={learningItems} goPay={goPay}
                  />
                )}
                {activeTab === "learning" && (
                  <LearningView items={filteredLearningItems} filter={learningFilter} setFilter={setLearningFilter}
                    router={router} formatDate={formatDate} onOpenOrientationModal={setOrientationData} goPay={goPay} />
                )}
                {activeTab === "achievements" && <AchievementsView certificates={certificates} formatDate={formatDate} showToast={showToast} />}
                {activeTab === "payments" && <PaymentsView orders={orders} enrollments={enrollments} formatDate={formatDate} setSelectedTransaction={setSelectedTransaction} router={router} goPay={goPay} />}
                {activeTab === "support" && <SupportView userId={userId} showToast={showToast} />}
                {activeTab === "account" && <AccountView userName={userName} userEmail={userEmail} onSignOut={handleSignOut} />}
              </motion.div>
            </AnimatePresence>
          )}
        </main>
      </div>

      {/* MOBILE BOTTOM NAV */}
      <nav className="lg:hidden fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 bg-white/90 backdrop-blur-xl border border-slate-200/80 shadow-[0_8px_32px_rgba(0,0,0,0.08)] rounded-full px-3 py-2 flex justify-center gap-2 sm:gap-4 items-center">
        <MobileNavButton icon={<Home size={20} />} label="Home" active={activeTab === "dashboard"} onClick={() => setActiveTab("dashboard")} />
        <MobileNavButton icon={<BookOpen size={20} />} label="Learn" active={activeTab === "learning"} onClick={() => setActiveTab("learning")} />
        <MobileNavButton icon={<Award size={20} />} label="Awards" active={activeTab === "achievements"} onClick={() => setActiveTab("achievements")} />
        <MobileNavButton icon={<Receipt size={20} />} label="Pay" active={activeTab === "payments"} onClick={() => setActiveTab("payments")} />
        <MobileNavButton icon={<Menu size={20} />} label="Menu" active={isMobileMenuOpen} onClick={() => setIsMobileMenuOpen(true)} />
      </nav>

      {/* ORIENTATION MODAL */}
      <AnimatePresence>{orientationData && <OrientationModal data={orientationData} onClose={() => setOrientationData(null)} />}</AnimatePresence>

      {/* TRANSACTION DETAIL MODAL */}
      <AnimatePresence>
        {selectedTransaction && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 sm:p-6 overflow-y-auto">
            <TransactionModal order={selectedTransaction} enrollments={enrollments} onClose={() => setSelectedTransaction(null)} router={router} />
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// =====================================================================
// DASHBOARD (Overview)
// =====================================================================
function OverviewView({ userName, totalCourses, certificates, pendingCoursePayments, onNavigate, timelineEvents, learningItems, goPay }: any) {
  const continueItem = learningItems.find((i: LearningItem) => i.isFullyPaid === false) || learningItems[0];

  return (
    <div className="space-y-8 sm:space-y-10 w-full">
      {pendingCoursePayments.length > 0 && (
        <div className="flex flex-col gap-4">
          {pendingCoursePayments.map((e: any) => (
            <div key={e.id} className="bg-gradient-to-r from-red-50 to-white border border-red-200 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-red-500" />
              <div className="flex items-start gap-5 text-red-900 pl-2">
                <div className="p-3.5 bg-red-100 text-red-600 rounded-2xl shrink-0"><AlertCircle size={24} /></div>
                <div>
                  <p className="text-base sm:text-lg font-bold mb-1.5">Action Required: Pending Due</p>
                  <p className="text-sm font-medium text-red-700/90">Remaining payment of <strong>Rs. {e.remaining_amount}</strong> for <strong>{e.course_name}</strong>.</p>
                </div>
              </div>
              <button onClick={() => goPay(e.course_name, e.remaining_amount)} className="w-full md:w-auto bg-red-600 hover:bg-red-700 text-white font-medium px-8 py-3.5 rounded-xl text-sm shadow-md">Pay Rs. {e.remaining_amount}</button>
            </div>
          ))}
        </div>
      )}

      {/* Hero — Netflix-style "continue learning", deeper blue version */}
      <div className="bg-gradient-to-br from-indigo-900 via-blue-900 to-slate-900 rounded-[2rem] p-6 sm:p-10 relative overflow-hidden shadow-lg shadow-indigo-900/20">
        <div className="absolute inset-0 bg-black/10 pointer-events-none" />
        <div className="absolute -top-16 -right-16 w-72 h-72 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        <Crown className="absolute -bottom-8 -right-8 w-48 h-48 text-white opacity-[0.06] rotate-12" />
        <div className="relative z-10 text-white">
          <h2 className="text-[10px] sm:text-xs uppercase tracking-widest font-bold text-amber-300 mb-3 flex items-center gap-2"><Sparkles size={14} /> Continue Learning</h2>
          <h3 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight mb-3">Welcome back, {userName}</h3>
          {continueItem ? (
            <div className="mt-4 flex items-center justify-between flex-wrap gap-4 bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-5">
              <div>
                <p className="text-white/70 text-xs uppercase tracking-widest font-bold mb-1">{continueItem.courseType}</p>
                <p className="text-xl font-bold">{continueItem.title}</p>
              </div>
              <button onClick={() => onNavigate("learning")} className="bg-white text-indigo-900 hover:bg-slate-100 px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 shadow-md">Resume <ArrowRight size={16} /></button>
            </div>
          ) : (
            <p className="text-white/80 font-medium text-base sm:text-lg max-w-2xl">You have no active courses yet — explore what's available and start building your credentials.</p>
          )}

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5 mt-6 sm:mt-10 pt-6 border-t border-white/15">
            {[
              { icon: BookOpen, value: totalCourses, label: "Courses", tab: "learning" },
              { icon: AlertCircle, value: pendingCoursePayments.length, label: "Pending Dues", tab: "payments", dot: pendingCoursePayments.length > 0 },
              { icon: Award, value: certificates?.length || 0, label: "Certificates", tab: "achievements" },
              { icon: MessageCircle, value: "24/7", label: "Support", tab: "support" },
            ].map((item, i) => (
              <motion.div whileTap={{ scale: 0.95 }} key={i} onClick={() => onNavigate(item.tab)} className="cursor-pointer bg-white/10 backdrop-blur-md p-4 sm:p-5 rounded-2xl border border-white/15 min-h-[120px] flex flex-col relative hover:bg-white/15 transition-all">
                {item.dot && <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-red-400 rounded-full animate-pulse" />}
                <div className="p-2 sm:p-3 bg-white/10 rounded-xl w-fit mb-3"><item.icon size={18} /></div>
                <div className="mt-auto">
                  <p className="text-2xl sm:text-3xl font-extrabold text-white">{item.value}</p>
                  <p className="text-[10px] uppercase font-semibold tracking-widest text-white/70 mt-2">{item.label}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity Timeline */}
      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-8"><Clock size={16} /> Recent Activity</h3>
        {timelineEvents.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-slate-400"><Clock size={40} className="mb-4 opacity-20" /><p className="text-sm font-medium">No recent activity found.</p></div>
        ) : (
          <div className="space-y-6">
            {timelineEvents.map((e: any) => (
              <div key={e.id} className="flex items-start gap-6">
                <div className="flex items-center justify-center w-9 h-9 rounded-full border-[3px] border-white bg-indigo-50 text-indigo-600 shadow-sm"><BookOpen size={16} /></div>
                <div className="flex-1 bg-slate-50/50 p-5 rounded-2xl border border-slate-100">
                  <p className="text-sm font-semibold text-slate-800">{e.title}</p>
                  <time className="text-[10px] font-medium text-slate-400 tracking-widest uppercase block mt-2">{e.date.toLocaleDateString()}</time>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// =====================================================================
// LEARNING (My Courses across Online / Offline / Recordings)
// =====================================================================
const TYPE_COLORS: Record<"all" | CourseType, { active: string; text: string; dot: string; ring: string }> = {
  all: { active: "bg-slate-800 text-white", text: "text-slate-600", dot: "bg-slate-500", ring: "ring-slate-300" },
  online: { active: "bg-orange-500 text-white", text: "text-orange-700", dot: "bg-orange-500", ring: "ring-orange-300" },
  offline: { active: "bg-emerald-500 text-white", text: "text-emerald-700", dot: "bg-emerald-500", ring: "ring-emerald-300" },
  recording: { active: "bg-blue-500 text-white", text: "text-blue-700", dot: "bg-blue-500", ring: "ring-blue-300" },
};

function LearningView({ items, filter, setFilter, router, formatDate, onOpenOrientationModal, goPay }: any) {
  const FILTERS: { key: "all" | CourseType; label: string }[] = [
    { key: "all", label: "All" }, { key: "online", label: "Online" }, { key: "offline", label: "Offline" }, { key: "recording", label: "Recordings" },
  ];

  return (
    <div className="space-y-8 w-full">
      <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-5">
        <h2 className="text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-800">My Courses</h2>
        
        {/* Updated Explore Container */}
        <div className="flex flex-wrap gap-2 sm:gap-3">
          <Link href="/onlinecourse" className="group flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 sm:px-5 sm:py-3 rounded-xl font-medium text-sm shadow-md transition-colors">
            Online <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform hidden sm:block" />
          </Link>
          <Link href="/offline-class" className="group flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 sm:px-5 sm:py-3 rounded-xl font-medium text-sm shadow-md transition-colors">
            Physical <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform hidden sm:block" />
          </Link>
          <Link href="/recording" className="group flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 sm:px-5 sm:py-3 rounded-xl font-medium text-sm shadow-md transition-colors">
            Recording <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform hidden sm:block" />
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 bg-slate-100/70 p-1.5 rounded-2xl w-fit">
        {FILTERS.map((f) => {
          const c = TYPE_COLORS[f.key];
          const isActive = filter === f.key;
          return (
            <button key={f.key} onClick={() => setFilter(f.key)} className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold transition-all ${isActive ? `${c.active} shadow-sm` : `bg-transparent ${c.text} hover:bg-white`}`}>
              <span className={`w-2 h-2 rounded-full ${isActive ? "bg-white/80" : c.dot}`} />
              {f.label}
            </button>
          );
        })}
      </div>

      {items.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-300 flex flex-col items-center shadow-inner">
          <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mb-5 text-indigo-500"><Compass size={32} /></div>
          <h3 className="text-xl font-semibold text-slate-800 mb-2">No courses here yet</h3>
          <p className="text-slate-500 max-w-md mx-auto mb-8 font-medium">Try a different filter, or explore what's new.</p>
          <div className="flex flex-wrap justify-center gap-3">
             <Link href="/onlinecourse" className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700">Online</Link>
             <Link href="/offline-class" className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700">Physical</Link>
             <Link href="/recording" className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700">Recording</Link>
          </div>
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
  const badgeColor = item.courseType === "online" ? "orange" : item.courseType === "offline" ? "emerald" : "blue";
  const isClassStarted = item.startingDate ? new Date(item.startingDate).getTime() <= Date.now() : true;

  return (
    <div className={`relative rounded-3xl border p-6 sm:p-8 flex flex-col bg-white shadow-sm border-slate-200`}>
      <div className={`absolute top-0 left-0 w-full h-1.5 rounded-t-3xl bg-${badgeColor}-400`} />
      <div className="flex justify-between items-start mb-5 gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className={`bg-${badgeColor}-50 text-${badgeColor}-800 border border-${badgeColor}-200 text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg`}>{item.courseType}</span>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold ${
              item.status === "confirmed" ? "bg-emerald-100 text-emerald-900 border border-emerald-200"
              : item.status === "rejected" ? "bg-red-100 text-red-900 border border-red-200"
              : "bg-slate-100 text-slate-800 border border-slate-300"}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${item.status === "confirmed" ? "bg-emerald-500 animate-pulse" : item.status === "rejected" ? "bg-red-500" : "bg-slate-500"}`} />
              {item.status === "confirmed" ? "Confirmed" : item.status === "rejected" ? "Payment Rejected" : "Pending Verification"}
            </span>
            {item.batchNo && <span className="px-3 py-1.5 rounded-full text-[11px] font-bold bg-white border border-slate-200 text-slate-700">Batch {item.batchNo}</span>}
          </div>
          <h3 className="font-extrabold text-2xl sm:text-3xl text-slate-900 tracking-tight">{item.title}</h3>
          <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-slate-600 font-medium">
            {item.location && <span className="flex items-center gap-1.5"><MapPin size={14} className="text-slate-400" /> {item.location}</span>}
            {item.startingDate && <span className="flex items-center gap-1.5"><Calendar size={14} className="text-slate-400" /> {formatDate(item.startingDate)}</span>}
            {item.timing && <span className="flex items-center gap-1.5"><Clock size={14} className="text-slate-400" /> {item.timing}</span>}
            {item.meta?.tutorName && <span className="flex items-center gap-1.5"><UserIcon size={14} className="text-slate-400" /> {item.meta.tutorName}</span>}
          </div>
        </div>
      </div>

      {item.status === "rejected" ? (
        <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5">
          <div>
            <p className="text-sm font-extrabold text-red-900 flex items-center gap-2"><AlertCircle size={16} /> Payment Rejected</p>
            <p className="text-xs text-red-700 font-medium mt-1">Your last payment for this course wasn't accepted. Please retry to secure your spot.</p>
          </div>
          <button onClick={() => goPay(item.title, item.remainingAmount || item.lockedPrice || item.paidAmount)} className="bg-red-600 hover:bg-red-700 text-white font-extrabold px-5 py-2 rounded-lg text-xs shadow-md whitespace-nowrap">Retry Payment</button>
        </div>
      ) : !item.isFullyPaid && (
        <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5">
          <p className="text-sm font-extrabold text-amber-900 flex items-center gap-2"><AlertCircle size={16} /> Remaining Due: Rs. {item.remainingAmount}</p>
          <button onClick={() => goPay(item.title, item.remainingAmount)} className="bg-amber-600 hover:bg-amber-700 text-white font-extrabold px-5 py-2 rounded-lg text-xs shadow-md whitespace-nowrap">Pay Rs. {item.remainingAmount}</button>
        </div>
      )}

      <div className="mt-auto pt-4 border-t border-slate-100 flex flex-col sm:flex-row gap-3">
        {item.courseType === "recording" && (
          item.hasUnverifiedPayment ? (
            <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl w-full"><Lock size={18} /> <span className="text-sm font-semibold">Pending Verification</span></div>
          ) : (
            <button onClick={() => item.meta?.recordingLink ? window.open(item.meta.recordingLink, "_blank") : router.push(`/recording/${encodeURIComponent(item.title)}`)} className="bg-white border-2 border-blue-300 hover:border-blue-600 text-slate-900 px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2"><PlayCircle size={18} /> Watch Recording</button>
          )
        )}
        {item.courseType === "online" && (
          item.hasUnverifiedPayment || !item.isFullyPaid ? (
            <div className="flex items-center gap-3 bg-slate-100 text-slate-500 p-4 rounded-xl w-full font-bold text-sm"><Lock size={18} /> Clear dues to unlock class access</div>
          ) : (
            <>
              <button onClick={() => !isClassStarted ? onOpenOrientationModal({ link: "#", date: item.startingDate }) : window.open("#", "_blank")} className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-xl text-white font-extrabold text-sm"><Video size={18} /> {isClassStarted ? "Join Live Class" : "Join Orientation"}</button>
              <a href={item.meta?.classroomLink || "#"} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border bg-orange-500 text-white font-extrabold text-sm"><BookOpen size={18} /> Classroom</a>
            </>
          )
        )}
        {item.courseType === "offline" && (
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-600"><MapPin size={16} className="text-emerald-500" /> Visit your campus for class access & materials.</div>
        )}
      </div>
    </div>
  );
}

// =====================================================================
// ACHIEVEMENTS (Certificates)
// =====================================================================
function AchievementsView({ certificates, formatDate, showToast }: any) {
  return (
    <div className="space-y-8 w-full">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
        <h2 className="text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-800">Achievements</h2>
        {certificates?.length > 0 && <div className="bg-amber-100 border border-amber-200 text-amber-800 px-4 py-2 rounded-full text-xs font-semibold">🏆 {certificates.length} Earned</div>}
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {!certificates || certificates.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center bg-slate-50/50 rounded-3xl py-20 px-6 border border-dashed border-slate-300 text-center">
            <div className="bg-white p-5 rounded-full shadow-sm mb-5 border border-slate-100"><Award size={40} className="text-amber-400" /></div>
            <p className="text-slate-800 font-semibold text-xl mb-2">No certificates earned yet</p>
            <p className="text-slate-500 font-medium text-sm">Complete a course to unlock your first certificate.</p>
          </div>
        ) : certificates.map((cert: any) => (
          <div key={cert.id} className="bg-gradient-to-br from-amber-50/30 to-white border border-amber-200/80 rounded-3xl p-8 shadow-sm flex flex-col gap-6">
            <div className="flex justify-between items-start">
              <div className="p-4 bg-gradient-to-br from-amber-100 to-amber-200 text-amber-700 rounded-2xl border border-amber-300"><Award size={32} /></div>
              <div className="text-right bg-white px-3 py-2 rounded-xl border border-slate-100"><p className="text-[9px] uppercase font-bold text-slate-400 tracking-widest mb-1">Issue Date</p><p className="text-xs font-semibold text-slate-800">{formatDate(cert.issue_date)}</p></div>
            </div>
            <div>
              <h3 className="text-2xl font-semibold text-slate-800 mb-2">{cert.syllabus_name || cert.name}</h3>
              <p className="text-sm text-slate-500 font-medium">Issued to: <span className="font-semibold text-slate-800">{cert.name}</span></p>
            </div>
            <div className="border-t border-slate-100 pt-6 flex flex-col sm:flex-row gap-3">
              <a href={`/certificate?name=${encodeURIComponent(cert.name)}&email=${encodeURIComponent(cert.email)}`} target="_blank" rel="noopener noreferrer" className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-3.5 rounded-xl text-sm font-medium flex justify-center items-center gap-2"><ExternalLink size={16} /> View Certificate</a>
              <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/certificate?name=${encodeURIComponent(cert.name)}&email=${encodeURIComponent(cert.email)}`); showToast("Certificate link copied!"); }} className="flex-1 bg-white border border-slate-200 text-slate-700 hover:border-indigo-500 py-3.5 rounded-xl text-sm font-medium flex justify-center items-center gap-2"><Copy size={16} /> Copy Link</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// =====================================================================
// PAYMENTS (Orders + Invoices — Stripe-style page, not a popup)
// =====================================================================
function PaymentsView({ orders, enrollments, formatDate, setSelectedTransaction, router, goPay }: any) {
  return (
    <div className="space-y-6 w-full">
      <h2 className="text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-800">Payments</h2>

      {(!orders || orders.length === 0) ? (
        <div className="flex flex-col items-center justify-center bg-white rounded-2xl py-16 px-6 border border-dashed border-slate-300 text-center">
          <div className="bg-slate-50 p-4 rounded-full mb-4 border border-slate-100"><Receipt size={32} className="text-slate-400" /></div>
          <p className="text-slate-900 font-extrabold text-lg mb-1">No transaction history found</p>
          <p className="text-slate-500 font-medium text-sm">Your invoices and dues will appear here.</p>
        </div>
      ) : orders.map((order: any) => {
        const relatedEnrollment = enrollments?.find((e: any) => e.id === order.enrollment_id || (e.course_name?.toLowerCase() === order.order_name?.toLowerCase()));
        const remainingDue = order.remaining_amount ?? relatedEnrollment?.remaining_amount ?? 0;
        const hasPending = order.pending_amount > 0;
        const isRejected = order.status?.toLowerCase() === "rejected";
        return (
          <div key={order.id} onClick={() => setSelectedTransaction(order)} className="cursor-pointer bg-white p-5 md:p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col hover:shadow-lg hover:border-blue-300 transition-all">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className={`p-3.5 rounded-2xl shrink-0 border border-slate-100 ${isRejected ? "bg-red-50 text-red-500" : hasPending ? "bg-orange-50 text-orange-500" : "bg-slate-50 text-slate-500"}`}>{isRejected ? <AlertCircle size={20} /> : hasPending ? <Clock size={20} /> : <ShoppingBag size={20} />}</div>
                <div className="overflow-hidden flex-1 min-w-0">
                  <p className="font-extrabold text-slate-900 text-lg truncate">{order.service}</p>
                  <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">{order.order_type} • {formatDate(order.created_at)}</p>
                </div>
              </div>
              <div className="text-right w-full sm:w-auto flex flex-row sm:flex-col justify-between items-center sm:items-end gap-2 pt-4 sm:pt-0 border-t border-slate-100 sm:border-0">
                {isRejected ? (
                  <p className="text-red-600 font-bold text-sm">Payment rejected</p>
                ) : hasPending ? (
                  <div className="text-xs text-right"><p className="text-orange-500 font-bold">Rs. {order.pending_amount} pending verification</p><p className="text-red-500 font-medium">Remaining: <strong>Rs. {remainingDue}</strong></p></div>
                ) : <p className="font-black text-xl text-slate-900">Rs. {order.paid_amount}</p>}
                <StatusBadge status={order.status} />
              </div>
            </div>
            {isRejected ? (
              <div className="w-full mt-4 pt-4 border-t border-slate-100 flex justify-end" onClick={(e) => e.stopPropagation()}>
                <button onClick={() => goPay(relatedEnrollment?.course_name || order.order_name, remainingDue || order.paid_amount)} className="px-5 py-2.5 text-sm font-bold rounded-xl bg-red-600 hover:bg-red-700 text-white">Retry Payment</button>
              </div>
            ) : remainingDue > 0 && !hasPending && (
              <div className="w-full mt-4 pt-4 border-t border-slate-100 flex justify-end" onClick={(e) => e.stopPropagation()}>
                <button onClick={() => goPay(relatedEnrollment?.course_name || order.order_name, remainingDue)} className="px-5 py-2.5 text-sm font-bold rounded-xl bg-amber-600 hover:bg-amber-700 text-white">Pay Remaining (Rs. {remainingDue})</button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function TransactionModal({ order, enrollments, onClose, router }: any) {
  const getScreenshotUrl = (path: string) => path.startsWith("http") ? path : `https://zuktarghyexwodqnnxlu.supabase.co/storage/v1/object/public/others/${path}`;
  const relatedEnrollment = enrollments?.find((e: any) => e.id === order.enrollment_id || (e.course_name?.toLowerCase() === order.order_name?.toLowerCase()));
  const remainingDue = order.remaining_amount ?? relatedEnrollment?.remaining_amount ?? 0;
  const hasPending = order.pending_amount > 0;
  const isRejected = order.status?.toLowerCase() === "rejected";

  return (
    <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl border border-slate-200 flex flex-col relative my-auto max-h-[90vh]">
      <button onClick={onClose} className="absolute top-4 right-4 p-2.5 bg-slate-100 rounded-full hover:bg-slate-200 text-slate-600 z-[60]"><X size={18} /></button>
      <div className="p-6 md:p-8 space-y-6 pt-14 overflow-y-auto">
        <div className="text-center">
          <p className="text-[10px] font-extrabold text-blue-600 uppercase tracking-widest mb-3">{order.order_type} PURCHASE</p>
          <h4 className="text-2xl font-black text-slate-900">{order.service}</h4>
        </div>
        {isRejected && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
            <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={18} />
            <div className="flex-1">
              <p className="text-sm font-bold text-red-800">This payment was rejected</p>
              <p className="text-xs text-red-700 mt-1">Please retry your payment to continue with this course.</p>
            </div>
            <button onClick={() => router.push(`/order?order_type=course&courseName=${encodeURIComponent(relatedEnrollment?.course_name || order.order_name)}&price=${remainingDue || order.paid_amount}`)} className="shrink-0 bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-2 rounded-lg text-xs whitespace-nowrap">Retry Payment</button>
          </div>
        )}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
          <div className="p-4 sm:p-5 bg-slate-50 border border-slate-100 rounded-2xl"><p className="text-[10px] uppercase font-extrabold text-slate-400 mb-1.5">Amount Paid</p><p className="font-black text-xl text-slate-900">Rs. {order.paid_amount}</p></div>
          {hasPending && <div className="p-4 sm:p-5 bg-orange-50 border border-orange-100 rounded-2xl"><p className="text-[10px] uppercase font-extrabold text-orange-500 mb-1.5">Unverified</p><p className="font-black text-xl text-orange-600">Rs. {order.pending_amount}</p></div>}
          <div className="p-4 sm:p-5 bg-slate-50 border border-slate-100 rounded-2xl"><p className="text-[10px] uppercase font-extrabold text-slate-400 mb-1.5">Date</p><p className="font-semibold text-slate-700 text-lg">{new Date(order.created_at).toLocaleDateString()}</p></div>
          <div className={`col-span-2 md:col-span-3 p-4 sm:p-5 rounded-2xl border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${remainingDue > 0 ? "bg-red-50 border-red-200" : "bg-slate-50 border-slate-200"}`}>
            <div><p className={`text-[10px] uppercase font-extrabold ${remainingDue > 0 ? "text-red-600" : "text-slate-500"}`}>Remaining Due</p><p className={`font-black text-lg ${remainingDue > 0 ? "text-red-700" : "text-slate-800"}`}>{remainingDue > 0 ? `Rs. ${remainingDue}` : "No due remaining"}</p></div>
            {!isRejected && remainingDue > 0 && !hasPending && <button onClick={() => router.push(`/order?order_type=course&courseName=${encodeURIComponent(relatedEnrollment?.course_name || order.order_name)}&price=${remainingDue}`)} className="w-full sm:w-auto shrink-0 font-bold px-6 py-3 rounded-xl text-sm bg-red-600 hover:bg-red-700 text-white">Pay Now</button>}
          </div>
          <div className="col-span-2 md:col-span-3 p-4 sm:p-5 bg-white rounded-2xl border border-slate-200 flex justify-between items-center"><p className="text-[10px] uppercase font-extrabold text-slate-400">Verification Status</p><StatusBadge status={order.status} /></div>
        </div>
        <div>
          <h4 className="text-[10px] font-extrabold uppercase text-slate-400 mb-3">Payment Screenshot</h4>
          {order.screenshot_url ? (
            <div className="border border-slate-200 bg-slate-50 p-2 rounded-2xl"><img src={getScreenshotUrl(order.screenshot_url)} alt="Receipt" className="w-full object-contain rounded-xl max-h-[250px]" /></div>
          ) : (
            <div className="p-10 border-2 border-dashed border-slate-200 rounded-2xl text-center flex flex-col items-center text-slate-400"><SearchX size={36} className="mb-3 opacity-40" /><p className="font-bold text-sm text-slate-500">No screenshot attached</p></div>
          )}
          {order.status === "verified" && !order.id.startsWith("synth-") && <button onClick={() => router.push(`/invoice/${order.id}`)} className="mt-6 w-full py-4 bg-slate-900 hover:bg-black text-white rounded-xl font-bold flex justify-center items-center gap-2"><Receipt size={18} /> View Official Invoice</button>}
        </div>
        <button onClick={onClose} className="w-full mt-2 py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold">Close</button>
      </div>
    </motion.div>
  );
}

// =====================================================================
// SUPPORT (Chat + Help Center, embedded — not a floating popup)
// =====================================================================
function SupportView({ userId, showToast }: any) {
  return (
    <div className="space-y-6 w-full">
      <h2 className="text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-800">Support</h2>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2"><ChatWidget userId={userId} showToast={showToast} /></div>
        <div className="space-y-4">
          <a href="https://wa.me/9763695665" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 bg-white border border-slate-200 rounded-2xl p-5 hover:border-green-400 transition-all">
            <Phone size={20} className="text-green-500" /> <span className="font-bold text-slate-800">WhatsApp Us</span>
          </a>
          <div className="bg-white border border-slate-200 rounded-2xl p-5">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Campus</p>
            <p className="text-sm font-semibold text-slate-700 flex items-start gap-2"><MapPin size={16} className="text-blue-500 mt-0.5" /> New Baneshwor Campus (Near Eyeplex Mall)</p>
          </div>
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
    <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm flex flex-col h-[500px] sm:h-[600px]">
      <div className="p-4 bg-gradient-to-r from-blue-700 to-blue-800 text-white flex items-center gap-3 shrink-0">
        <div className="p-2 bg-white/10 rounded-full"><MessageCircle size={18} /></div>
        <div><h3 className="font-extrabold text-lg">GyanHub Support</h3><p className="text-blue-100 text-[10px] font-semibold uppercase tracking-widest flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" /> Online</p></div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5 bg-slate-50/50">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center text-slate-400 py-10">
            <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center mb-3 border border-blue-100"><MessageCircle size={24} className="text-blue-400" /></div>
            <p className="font-extrabold text-slate-700 text-base mb-1">Start a conversation</p>
            <p className="font-medium text-xs max-w-[200px]">Ask us anything about courses, payments, or account issues.</p>
          </div>
        )}
        {messages.map((msg) => {
          const isOwn = msg.sender_role !== "admin";
          return (
            <div key={msg.id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
              {!isOwn && <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-blue-600 to-blue-800 flex items-center justify-center text-white text-[10px] font-extrabold mr-2 mt-1 shrink-0">G</div>}
              <div className={`max-w-[80%] ${isOwn ? "items-end" : "items-start"} flex flex-col gap-1`}>
                <div className={`px-4 py-2.5 rounded-2xl text-sm font-medium ${isOwn ? "bg-blue-600 text-white rounded-br-sm" : "bg-white text-slate-800 rounded-bl-sm border border-slate-200"}`}>{msg.content}</div>
                <span className="text-[9px] font-extrabold tracking-widest uppercase opacity-50">{formatTime(msg.created_at)}</span>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} className="h-2" />
      </div>
      <div className="p-3 sm:p-4 border-t border-slate-200 bg-white flex gap-2">
        <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") handleSend(); }} placeholder="Type your message…" className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-blue-400" />
        <button onClick={handleSend} disabled={sending || !input.trim()} className="bg-blue-600 hover:bg-blue-700 text-white px-4 rounded-xl disabled:opacity-50 font-bold flex items-center justify-center shrink-0">{sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}</button>
      </div>
    </div>
  );
}

// =====================================================================
// ACCOUNT
// =====================================================================
function AccountView({ userName, userEmail, onSignOut }: any) {
  return (
    <div className="space-y-6 w-full max-w-xl">
      <h2 className="text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-800">Account</h2>
      <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
        <div><p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Name</p><p className="font-semibold text-slate-800">{userName}</p></div>
        <div><p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Email</p><p className="font-semibold text-slate-800">{userEmail}</p></div>
      </div>
      <button onClick={onSignOut} className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200"><LogOut size={18} /> Sign out</button>
    </div>
  );
}

// =====================================================================
// ORIENTATION COUNTDOWN MODAL
// =====================================================================
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
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-4">
      <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="bg-white rounded-3xl w-full max-w-md p-8 md:p-10 text-center relative shadow-2xl border-2 border-indigo-100">
        <button onClick={onClose} className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 bg-slate-100 p-2 rounded-full"><X size={18} /></button>
        <h3 className="text-2xl font-black tracking-tight mb-2 text-slate-900">Orientation Session</h3>
        <p className="text-slate-500 mb-8 font-medium">Session begins exactly at 8:00 PM (NST).</p>
        <div className="grid grid-cols-4 gap-2 sm:gap-3 mb-8">
          {[["Days", timeLeft.d], ["Hours", timeLeft.h], ["Mins", timeLeft.m], ["Secs", timeLeft.s]].map(([label, val]) => (
            <div key={label as string} className="bg-slate-50 border border-slate-100 rounded-xl py-3 flex flex-col items-center justify-center">
              <span className="text-2xl font-black text-indigo-600">{String(val).padStart(2, "0")}</span>
              <span className="text-[10px] uppercase font-bold text-slate-400">{label}</span>
            </div>
          ))}
        </div>
        <button onClick={() => { onClose(); window.open(data.link, "_blank"); }} className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg text-sm uppercase tracking-wide flex justify-center items-center gap-2"><Video size={18} /> Join Orientation Now</button>
      </motion.div>
    </motion.div>
  );
}

// =====================================================================
// EXPORT — wrapped in Suspense for useSearchParams()
// =====================================================================
export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4"><Loader2 className="animate-spin text-blue-600 w-10 h-10" /><p className="text-slate-500 font-bold text-sm">Loading your dashboard...</p></div>}>
      <DashboardContent />
    </Suspense>
  );
}