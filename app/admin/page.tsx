"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard, LogOut, Plus, Users, X, Edit2, Check, MapPin, Clock,
  Trash2, GraduationCap, ExternalLink, Monitor, Send, Lock, MessageCircle,
  AlertCircle, Layers, ShoppingCart, CalendarDays, Award, ChevronDown, Search,
  EyeOff, Eye, Loader2, MessageSquare, ArrowLeft, Upload, Copy, CheckSquare,
  Phone, Building2, CalendarClock, StickyNote, GripVertical, Ban, Globe2,
  TrendingUp, PieChart, CalendarRange, Archive, TrendingDown, Wallet, Landmark,
  PiggyBank, AlertTriangle, Activity, Target, Pencil, FileBarChart, Calendar, BookOpen, Menu
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import {
  ResponsiveContainer, BarChart, Bar, PieChart as RechartsPieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from "recharts";

/* ============================================================================
   INTERFACES & HELPERS
============================================================================ */

// --- Admin Types ---
interface OnlineCourse {
  id: string; title: string; category: string; fee: number; discount: number; active_batch_no: number;
  duration: string; cover_pic: string; tutor_name: string; is_active: boolean;
  start_datetime: string; created_at: string;
}

interface CourseBatch {
  id: string; course_id: string; course_name: string; batch_no: number;
  start_datetime?: string; timing?: string; online_class_link?: string;
  google_classroom_link?: string; whatsapp_group_link?: string;
  is_active: boolean; created_at?: string;
}

interface PhysicalCourse {
  id: string; title: string; course_code: string | null; course_image_url: string | null;
  instructor_image_url: string | null; category: "Professional Training" | "University Subjects";
  learning_outcomes?: string[] | string | null; instructor_name: string | null; location: string | null;
  start_date: string | null; timing: string | null; duration_weeks: number | null;
  price: number; discount_price: number | null; max_seats: number | null; enrolled_count: number | null;
  is_active: boolean; tutor_bio: string | null; batch_no: number | null;
  created_at: string; updated_at: string;
}

interface Enrollment {
  id: string; user_id: string; course_id: string; full_name: string; email: string;
  whatsapp_number: string; remarks: string; status: string; created_at: string;
  course_name: string; course_details_url: string; locked_price: number;
  starting_date: string; confirmed: boolean; is_confirmed?: boolean; paid_amount: number; remaining_amount: number;
  pending_amount: number; batch_no: number | null; order_id?: string | null;
}

interface Message {
  id: string; user_id: string; sender_role: string; content: string;
  created_at: string; is_read?: boolean;
  profiles?: { full_name: string; avatar_url: string; role: string; };
}

interface Certificate {
  id: string; name: string; email: string; syllabus_name: string;
  syllabus_id: number | null; issue_date: string; certificate_image: string;
  certificate_code: string; created_at: string; user_id?: string;
}

interface Order {
  id: string; full_name: string; email: string; contact_number: string;
  order_type: string; order_name: string; paid_amount: number; pending_amount: number;
  locked_price: number; screenshot_url: string; payment_screenshots: string[];
  status: string; created_at: string; updated_at?: string; user_id?: string;
  enrollment_id?: string; leads_id?: string | null; bill_no?: string | number | null; remaining_amount?: number;
}

interface PhysicalLead {
  id: string; course_id: string; course_code: string; course_title: string; category: string;
  full_name: string; phone: string; email: string | null; current_education: string | null;
  institution_name: string | null; office_location: string; source: string;
  status: 'new' | 'contacted' | 'interested' | 'follow_up' | 'booked' | 'deposit_paid' | 'enrolled' | 'cancelled';
  remarks: string | null; counselor_notes: string | null; assigned_to: string | null;
  follow_up_date: string | null; batch_no: number | null; is_confirmed: boolean | null;
  start_date?: string | null; created_at: string; updated_at: string; deleted: boolean; deleted_at: string | null;
  course_price: number; discount_price?: number | null; booking_amount?: number | null;
  order_id?: string | null; bill_no?: string | number | null; locked_price?: number;
  paid_amount?: number; pending_amount?: number; remaining_amount?: number;
  order_status?: string; payment_screenshots?: string[];
}

// --- Finance/ERP Types ---
type AccountingCategory =
  | "COURSE_INCOME" | "OTHER_INCOME" | "OWNER_INVESTMENT" | "OWNER_WITHDRAWAL"
  | "TUTOR_PAYMENT" | "SALARY" | "RENT" | "OFFICE_EXPENSE" | "MISCELLANEOUS" | "MARKETING";

type AccountingStatus = "CURRENT" | "PREPAID" | "OUTSTANDING";
type AccountingSubType = "PHYSICAL" | "ONLINE" | "HYBRID" | "BOTH" | "MONTHLY" | "BONUS" | "NISCHAL" | "DIPESH";
type TransactionType = "INCOME" | "EXPENSE" | "INVESTMENT" | "WITHDRAWAL";
type DateRangeOption = "ALL" | "LAST_7_DAYS" | "LAST_15_DAYS" | "LAST_30_DAYS" | "LAST_45_DAYS" | "LAST_3_MONTHS" | "LAST_6_MONTHS" | "THIS_YEAR" | "CUSTOM";

interface Transaction {
  id: string; transaction_date: string; category: AccountingCategory; accounting_status: AccountingStatus;
  syllabus_id: number | null; batch_name: string | null; sub_type: AccountingSubType | null;
  amount: number; description: string | null; is_accounting: boolean;
}

interface Syllabus {
  id: number; name: string;
}

interface CategoryRule {
  label: string; requiresSyllabus: boolean; requiresBatch: boolean; subTypeOptions: AccountingSubType[] | null; subTypeRequired: boolean;
}

const CATEGORY_RULES: Record<AccountingCategory, CategoryRule> = {
  COURSE_INCOME: { label: "Course income", requiresSyllabus: true, requiresBatch: true, subTypeOptions: ["PHYSICAL", "ONLINE", "HYBRID"], subTypeRequired: true },
  TUTOR_PAYMENT: { label: "Tutor payment", requiresSyllabus: true, requiresBatch: true, subTypeOptions: ["PHYSICAL", "ONLINE", "BOTH"], subTypeRequired: true },
  MARKETING: { label: "Marketing", requiresSyllabus: false, requiresBatch: false, subTypeOptions: null, subTypeRequired: false },
  OWNER_INVESTMENT: { label: "Owner investment", requiresSyllabus: false, requiresBatch: false, subTypeOptions: ["NISCHAL", "DIPESH"], subTypeRequired: true },
  OWNER_WITHDRAWAL: { label: "Owner withdrawal", requiresSyllabus: false, requiresBatch: false, subTypeOptions: ["NISCHAL", "DIPESH"], subTypeRequired: true },
  SALARY: { label: "Salary", requiresSyllabus: false, requiresBatch: false, subTypeOptions: ["MONTHLY", "BONUS"], subTypeRequired: true },
  OTHER_INCOME: { label: "Other income", requiresSyllabus: false, requiresBatch: false, subTypeOptions: null, subTypeRequired: false },
  RENT: { label: "Rent", requiresSyllabus: false, requiresBatch: false, subTypeOptions: null, subTypeRequired: false },
  OFFICE_EXPENSE: { label: "Office expense", requiresSyllabus: false, requiresBatch: false, subTypeOptions: null, subTypeRequired: false },
  MISCELLANEOUS: { label: "Miscellaneous", requiresSyllabus: false, requiresBatch: false, subTypeOptions: null, subTypeRequired: false },
};

const CATEGORY_ORDER: AccountingCategory[] = ["COURSE_INCOME", "OTHER_INCOME", "OWNER_INVESTMENT", "OWNER_WITHDRAWAL", "TUTOR_PAYMENT", "SALARY", "RENT", "OFFICE_EXPENSE", "MISCELLANEOUS", "MARKETING"];
const INCOME_CATEGORIES: AccountingCategory[] = ["COURSE_INCOME", "OTHER_INCOME"];
const OWNER_CATEGORIES: AccountingCategory[] = ["OWNER_INVESTMENT", "OWNER_WITHDRAWAL"];

function deriveTransactionType(category: AccountingCategory): TransactionType {
  if (INCOME_CATEGORIES.includes(category)) return "INCOME";
  if (category === "OWNER_INVESTMENT") return "INVESTMENT";
  if (category === "OWNER_WITHDRAWAL") return "WITHDRAWAL";
  return "EXPENSE";
}

// Helpers
const NPR = new Intl.NumberFormat("en-NP", { style: "currency", currency: "NPR", maximumFractionDigits: 0 });
const money = (n: number) => NPR.format(n);
const pct = (n: number) => `${(n * 100).toFixed(1)}%`;
const PIE_COLORS = ["#1F6F5C", "#5B7DA6", "#9C7A2A", "#8C3F3F", "#7A5B9C", "#4C8C6C", "#B0813F"];

function timeAgo(dateString: string) {
  const now = new Date();
  const past = new Date(dateString);
  const diffMins = Math.floor((now.getTime() - past.getTime()) / 60000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  return `${Math.floor(diffHrs / 24)}d ago`;
}

function isoDateOnly(d: Date) { return d.toISOString().slice(0, 10); }

/* ============================================================================
   CUSTOM HOOKS (Finance Analytics)
============================================================================ */
function useAnalytics(rows: Transaction[], syllabi: Syllabus[]) {
  return useMemo(() => {
    const acct = rows.filter((r) => r.is_accounting);

    const PNL_INCOME: AccountingCategory[] = ["COURSE_INCOME", "OTHER_INCOME", "OWNER_WITHDRAWAL"];
    const PNL_EXPENSE: AccountingCategory[] = ["TUTOR_PAYMENT", "SALARY", "RENT", "OFFICE_EXPENSE", "MISCELLANEOUS", "MARKETING"];

    const totalIncome = acct.filter((r) => PNL_INCOME.includes(r.category)).reduce((s, r) => s + r.amount, 0);
    const totalExpense = acct.filter((r) => PNL_EXPENSE.includes(r.category)).reduce((s, r) => s + r.amount, 0);
    const netProfit = totalIncome - totalExpense;

    const current = acct.filter((r) => r.accounting_status === "CURRENT");
    const cashIncome = current.filter((r) => INCOME_CATEGORIES.includes(r.category)).reduce((s, r) => s + r.amount, 0);
    const cashInvestment = current.filter((r) => r.category === "OWNER_INVESTMENT").reduce((s, r) => s + r.amount, 0);
    const cashWithdrawal = current.filter((r) => r.category === "OWNER_WITHDRAWAL").reduce((s, r) => s + r.amount, 0);
    const cashExpense = current.filter((r) => PNL_EXPENSE.includes(r.category)).reduce((s, r) => s + r.amount, 0);
    
    const currentCash = cashIncome + cashInvestment - cashWithdrawal - cashExpense;
    
    const outstanding = acct.filter((r) => r.accounting_status === "OUTSTANDING");
    const outReceivable = outstanding.filter((r) => INCOME_CATEGORIES.includes(r.category)).reduce((s, r) => s + r.amount, 0);
    const outPayable = outstanding.filter((r) => PNL_EXPENSE.includes(r.category)).reduce((s, r) => s + r.amount, 0);
    
    const expectedCash = currentCash - outPayable;

    const courseMap = new Map<string, { id: string, name: string, revenue: number, tutor: number, marketing: number }>();
    const batchMap = new Map<string, { courseName: string, batch: string, revenue: number, tutor: number, marketing: number }>();

    rows.forEach(t => {
      const isAllocatedMarketing = t.category === "MARKETING" && t.is_accounting === false;
      const isDirectCoursePnl = (t.category === "COURSE_INCOME" || t.category === "TUTOR_PAYMENT") && t.is_accounting === true;

      if (!isAllocatedMarketing && !isDirectCoursePnl) return;
      if (!t.syllabus_id) return;
      
      const syllabus = syllabi.find(s => s.id === t.syllabus_id);
      const cName = syllabus ? syllabus.name : `Course #${t.syllabus_id}`;
      
      if (!courseMap.has(cName)) courseMap.set(cName, { id: String(t.syllabus_id), name: cName, revenue: 0, tutor: 0, marketing: 0 });
      const cRow = courseMap.get(cName)!;

      if (t.category === "COURSE_INCOME") cRow.revenue += t.amount;
      if (t.category === "TUTOR_PAYMENT") cRow.tutor += t.amount;
      if (t.category === "MARKETING") cRow.marketing += t.amount;

      if (t.batch_name) {
        const bId = `${cName} - ${t.batch_name}`;
        if (!batchMap.has(bId)) batchMap.set(bId, { courseName: cName, batch: t.batch_name, revenue: 0, tutor: 0, marketing: 0 });
        const bRow = batchMap.get(bId)!;
        if (t.category === "COURSE_INCOME") bRow.revenue += t.amount;
        if (t.category === "TUTOR_PAYMENT") bRow.tutor += t.amount;
        if (t.category === "MARKETING") bRow.marketing += t.amount;
      }
    });

    const courseStats = Array.from(courseMap.values()).map(c => {
      const profit = c.revenue - c.tutor - c.marketing;
      const margin = c.revenue > 0 ? profit / c.revenue : 0;
      const roi = c.marketing > 0 ? c.revenue / c.marketing : 0;
      const profitContribution = netProfit > 0 ? profit / netProfit : 0;
      
      let score = 1;
      if (margin > 0.4) score++;
      if (margin > 0.2) score++;
      if (roi > 5) score++;
      if (profit > 50000) score++;
      
      return { ...c, profit, margin, roi, profitContribution, score: Math.min(5, Math.max(1, score)) };
    }).sort((a, b) => b.profit - a.profit);

    const batchStats = Array.from(batchMap.values()).map(b => ({
      ...b, profit: b.revenue - b.tutor - b.marketing
    })).sort((a, b) => b.profit - a.profit);

    const expenseData = [
      { name: "Tutor", value: acct.filter(r => r.category === "TUTOR_PAYMENT").reduce((s, r) => s + r.amount, 0) },
      { name: "Salary", value: acct.filter(r => r.category === "SALARY").reduce((s, r) => s + r.amount, 0) },
      { name: "Rent", value: acct.filter(r => r.category === "RENT").reduce((s, r) => s + r.amount, 0) },
      { name: "Marketing", value: acct.filter(r => r.category === "MARKETING").reduce((s, r) => s + r.amount, 0) },
      { name: "Office", value: acct.filter(r => r.category === "OFFICE_EXPENSE").reduce((s, r) => s + r.amount, 0) },
      { name: "Misc", value: acct.filter(r => r.category === "MISCELLANEOUS").reduce((s, r) => s + r.amount, 0) },
    ].filter(d => d.value > 0);

    const monthMap = new Map<string, { month: string, revenue: number, expense: number, profit: number }>();
    acct.forEach(t => {
      if (!PNL_INCOME.includes(t.category) && !PNL_EXPENSE.includes(t.category)) return;

      const d = new Date(t.transaction_date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (!monthMap.has(key)) monthMap.set(key, { month: d.toLocaleString('en', { month: 'short', year: '2-digit' }), revenue: 0, expense: 0, profit: 0 });
      
      const m = monthMap.get(key)!;
      if (PNL_INCOME.includes(t.category)) m.revenue += t.amount;
      else if (PNL_EXPENSE.includes(t.category)) m.expense += t.amount;
      
      m.profit = m.revenue - m.expense;
    });
    const monthlyTrends = Array.from(monthMap.entries()).sort((a, b) => a[0].localeCompare(b[0])).map((x, i, arr) => {
      const m = x[1];
      const expenseRatio = m.revenue > 0 ? m.expense / m.revenue : 0;
      let profitGrowth: number | null = null;
      if (i > 0) {
        const prev = arr[i - 1][1];
        if (prev.profit > 0) {
          profitGrowth = (m.profit - prev.profit) / prev.profit;
        }
      }
      return { ...m, expenseRatio, profitGrowth };
    });

    let healthScore = 50;
    const overallMargin = totalIncome > 0 ? netProfit / totalIncome : 0;
    
    if (overallMargin > 0.3) healthScore += 20;
    else if (overallMargin > 0.1) healthScore += 10;
    else if (overallMargin < 0) healthScore -= 20;
    if (currentCash > 200000) healthScore += 15;
    else if (currentCash < 50000) healthScore -= 15;
    if (outReceivable > outPayable) healthScore += 10;
    else if (outPayable > outReceivable * 1.5) healthScore -= 10;

    const avgMonthlyExpense = totalExpense / Math.max(1, monthlyTrends.length);
    const runwayMonths = avgMonthlyExpense > 0 ? currentCash / avgMonthlyExpense : 99;
    if (runwayMonths > 6) healthScore += 5;

    const nischalInv = acct.filter(r => r.category === "OWNER_INVESTMENT" && r.sub_type === "NISCHAL").reduce((s, r) => s + r.amount, 0);
    const nischalWith = acct.filter(r => r.category === "OWNER_WITHDRAWAL" && r.sub_type === "NISCHAL").reduce((s, r) => s + r.amount, 0);
    const dipeshInv = acct.filter(r => r.category === "OWNER_INVESTMENT" && r.sub_type === "DIPESH").reduce((s, r) => s + r.amount, 0);
    const dipeshWith = acct.filter(r => r.category === "OWNER_WITHDRAWAL" && r.sub_type === "DIPESH").reduce((s, r) => s + r.amount, 0);

    const positiveCourseProfits = courseStats.filter(c => c.profit > 0);
    const totalCourseProfit = positiveCourseProfits.reduce((s, c) => s + c.profit, 0);

    const reports = {
      operatingExpenseRatio: totalIncome > 0 ? totalExpense / totalIncome : 0,
      receivableRatio: totalIncome > 0 ? outReceivable / totalIncome : 0,
      cashCollectionCoverage: (currentCash + outReceivable) > 0 ? currentCash / (currentCash + outReceivable) : 0,
      expenseEfficiency: totalExpense > 0 ? netProfit / totalExpense : 0,
      breakEvenRevenue: totalExpense,
      top1Dependency: totalCourseProfit > 0 && positiveCourseProfits.length > 0 ? positiveCourseProfits[0].profit / totalCourseProfit : 0,
      top3Dependency: totalCourseProfit > 0 ? positiveCourseProfits.slice(0, 3).reduce((s, c) => s + c.profit, 0) / totalCourseProfit : 0,
      cashSafety: runwayMonths,
      liabilityRisk: outPayable > 0 ? outReceivable / outPayable : (outReceivable > 0 ? 999 : 0)
    };

    return {
      totalIncome, totalExpense, netProfit, overallMargin,
      currentCash, outReceivable, outPayable, expectedCash,
      courseStats, batchStats, expenseData, monthlyTrends,
      healthScore: Math.min(100, Math.max(0, healthScore)),
      runwayMonths, avgMonthlyExpense, reports,
      nischal: { inv: nischalInv, with: nischalWith, net: nischalInv - nischalWith },
      dipesh: { inv: dipeshInv, with: dipeshWith, net: dipeshInv - dipeshWith }
    };
  }, [rows, syllabi]);
}

/* ============================================================================
   CUSTOM HOOKS (Admin Data)
============================================================================ */
function useSupabase() {
  return useMemo(() => createClient(), []);
}

function useMessages(supabase: any, enabled: boolean) {
  const [conversations, setConversations] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMessages = useCallback(async () => {
    const { data, error } = await supabase.from("messages").select("*").order("created_at", { ascending: false });
    if (error) {
      console.error("Messages Fetch Error:", error);
      setLoading(false);
      return;
    }
    if (data) {
      const userIds = [...new Set(data.map((m: any) => m.user_id))].filter(Boolean);
      let profileMap: Record<string, any> = {};
      if (userIds.length > 0) {
        const { data: profiles, error: profileErr } = await supabase.from('profiles').select('id, full_name, avatar_url, role').in('id', userIds);
        if (profileErr) console.error("Profiles Fetch Error:", profileErr);
        if (profiles) profiles.forEach((p: any) => { profileMap[p.id] = p; });
      }
      const unreadCounts: Record<string, number> = {};
      for (const msg of data) {
        if (msg.sender_role === 'user' && msg.is_read === false) unreadCounts[msg.user_id] = (unreadCounts[msg.user_id] || 0) + 1;
      }
      const uniqueConversations: Message[] = [];
      const seenUsers = new Set();
      for (const msg of data) {
        if (!seenUsers.has(msg.user_id)) {
          seenUsers.add(msg.user_id);
          const hasUnread = (unreadCounts[msg.user_id] || 0) > 0;
          uniqueConversations.push({ ...msg, is_read: !hasUnread, profiles: profileMap[msg.user_id] } as Message);
        }
      }
      setConversations(uniqueConversations);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    if (!enabled) return;
    fetchMessages();
    const channel = supabase.channel('admin_messages_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, fetchMessages)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [enabled, fetchMessages, supabase]);

  return { conversations, loading, refresh: fetchMessages };
}

function useOrdersAndEnrollments(supabase: any, enabled: boolean) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);

  const fetchData = useCallback(async () => {
    const [ordRes, enrRes] = await Promise.all([
      supabase.from("orders_v2").select("*").eq("deleted", false).order("created_at", { ascending: false }),
      supabase.from("enrollments_v2").select("*, course_batches_v2(syllabus_id, batch_no)").eq("deleted", false).order("created_at", { ascending: false })
    ]);

    if (ordRes.error) console.error("Orders Fetch Error:", ordRes.error);
    if (enrRes.error) console.error("Enrollments Fetch Error:", enrRes.error);

    const fetchedOrders = ordRes.data ? ordRes.data.map((o: any) => ({
      ...o, full_name: o.full_name || 'N/A', email: o.email || 'N/A', contact_number: o.whatsapp_number || o.contact_number || 'N/A',
      paid_amount: o.paid_amount ?? 0, pending_amount: o.pending_amount ?? 0, locked_price: o.locked_price ?? 0,
      remaining_amount: o.remaining_amount ?? Math.max(0, (o.locked_price ?? 0) - (o.paid_amount ?? 0) - (o.pending_amount ?? 0)),
      leads_id: o.leads_id ?? null, bill_no: o.bill_no ?? null,
      order_type: o.order_type || 'Online Course', order_name: o.order_name || 'Course Enrollment', payment_screenshots: o.payment_screenshots || [],
      screenshot_url: o.payment_screenshots?.length > 0 ? o.payment_screenshots[o.payment_screenshots.length - 1] : o.screenshot_url,
      updated_at: o.updated_at || o.created_at,
    })) : [];

    setOrders(fetchedOrders);

    if (enrRes.data) {
      setEnrollments(enrRes.data.map((e: any) => {
        const linkedOrder = fetchedOrders.find((o: any) => o.enrollment_id === e.id);
        return {
          ...e, confirmed: e.is_confirmed !== undefined ? e.is_confirmed : e.confirmed,
          course_id: e.course_batches_v2?.syllabus_id?.toString() || e.course_id, batch_no: e.course_batches_v2?.batch_no || e.batch_no,
          locked_price: linkedOrder ? Number(linkedOrder.locked_price) : 0, paid_amount: linkedOrder ? Number(linkedOrder.paid_amount) : 0,
          pending_amount: linkedOrder ? Number(linkedOrder.pending_amount) : 0,
          remaining_amount: linkedOrder ? Number(linkedOrder.pending_amount) : 0, order_id: linkedOrder ? linkedOrder.id : null
        };
      }));
    }
  }, [supabase]);

  useEffect(() => {
    if (!enabled) return;
    fetchData();
    const channel = supabase.channel('admin_orders_enrollments')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders_v2' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'enrollments_v2' }, fetchData)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [enabled, fetchData, supabase]);

  return { orders, enrollments, refresh: fetchData };
}

function useCoursesAndBatches(supabase: any, enabled: boolean) {
  const [courses, setCourses] = useState<OnlineCourse[]>([]);
  const [batches, setBatches] = useState<CourseBatch[]>([]);
  const [syllabi, setSyllabi] = useState<any[]>([]);

  const fetchData = useCallback(async () => {
    const [curRes, batchRes, sylRes] = await Promise.all([
      supabase.from("online_courses_v2").select("*").order("created_at", { ascending: false }),
      supabase.from("course_batches_v2").select("*").order("batch_no", { ascending: false }),
      supabase.from("syllabi_v2").select("id, name")
    ]);

    if (curRes.error) console.error("Courses Fetch Error:", curRes.error);
    else setCourses(curRes.data.map((c: any) => ({ ...c, id: c.syllabus_id?.toString() || c.id, title: c.name || c.title })));

    if (batchRes.error) console.error("Batches Fetch Error:", batchRes.error);
    else setBatches(batchRes.data.map((b: any) => ({ ...b, course_id: b.syllabus_id?.toString() || b.course_id })));

    if (sylRes.error) console.error("Syllabi Fetch Error:", sylRes.error);
    else setSyllabi(sylRes.data);
  }, [supabase]);

  useEffect(() => {
    if (!enabled) return;
    fetchData();
    const channel = supabase.channel('admin_courses_batches')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'online_courses_v2' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'course_batches_v2' }, fetchData)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [enabled, fetchData, supabase]);

  return { courses, batches, syllabi, refresh: fetchData };
}

function usePhysical(supabase: any, enabled: boolean) {
  const [physicalCourses, setPhysicalCourses] = useState<PhysicalCourse[]>([]);
  const [physicalLeads, setPhysicalLeads] = useState<PhysicalLead[]>([]);

  const fetchData = useCallback(async () => {
    const [coursesRes, leadsRes] = await Promise.all([
      supabase.from("physicalcourses").select("*").order("created_at", { ascending: false }),
      supabase.from("physical_leads").select("*").eq("deleted", false).order("created_at", { ascending: false })
    ]);

    if (coursesRes.error) console.error("Physical Courses Fetch Error:", coursesRes.error);
    else setPhysicalCourses(coursesRes.data);

    if (leadsRes.error) console.error("Physical Leads Fetch Error:", leadsRes.error);
    else setPhysicalLeads(leadsRes.data);
  }, [supabase]);

  useEffect(() => {
    if (!enabled) return;
    fetchData();
    const channel = supabase.channel('admin_physical')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'physicalcourses' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'physical_leads' }, fetchData)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [enabled, fetchData, supabase]);

  return { physicalCourses, physicalLeads, refresh: fetchData };
}

function useCertificates(supabase: any, enabled: boolean) {
  const [certificates, setCertificates] = useState<Certificate[]>([]);

  const fetchCertificates = useCallback(async () => {
    const { data, error } = await supabase.from("certificates").select("*").eq("deleted", false).order("created_at", { ascending: false });
    if (error) console.error("Certificates Fetch Error:", error);
    else setCertificates(data);
  }, [supabase]);

  useEffect(() => {
    if (!enabled) return;
    fetchCertificates();
    const channel = supabase.channel('admin_certificates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'certificates' }, fetchCertificates)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [enabled, fetchCertificates, supabase]);

  return { certificates, refresh: fetchCertificates };
}


/* ============================================================================
   SHARED PRIMITIVES
============================================================================ */
function SidebarBtn({ icon, label, active, onClick, color }: any) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-4 px-5 py-3.5 rounded-lg text-sm font-bold transition-all relative ${active ? "bg-white/[0.06] text-white" : `hover:bg-white/[0.04] ${color || "text-[#9C9788]"}`}`}>
      {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[#B8862E] rounded-r" />}
      {icon} <span>{label}</span>
    </button>
  );
}

function SectionHeader({ eyebrow, title, subtitle, action }: { eyebrow: string; title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="flex justify-between items-end flex-wrap gap-4 pb-5 border-b border-[#E6E0D2]">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#B8862E] mb-1">{eyebrow}</p>
        <h2 className="text-2xl md:text-3xl font-serif font-bold text-[#14161F] tracking-tight">{title}</h2>
        {subtitle && <p className="text-[#857D6E] font-medium mt-1 text-sm">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

function SearchBar({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="relative w-full">
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#B4AF9F]" size={17} />
      <input type="text" placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} className="w-full pl-11 pr-4 py-3.5 bg-white rounded-xl border border-[#E6E0D2] shadow-sm outline-none focus:border-[#B8862E] focus:ring-2 focus:ring-[#B8862E]/10 transition-all font-medium text-[#14161F] text-sm" />
    </div>
  );
}

function ToggleSwitch({ checked, onChange, label, activeColor = '#0E7C7B' }: { checked: boolean, onChange: () => void, label?: string, activeColor?: string }) {
  return (
    <div className="flex items-center gap-2 cursor-pointer" onClick={(e) => { e.stopPropagation(); onChange(); }}>
      <div className="w-10 h-6 flex items-center rounded-full p-1 transition-colors duration-300 shrink-0" style={{ backgroundColor: checked ? activeColor : '#D8D2C2' }}>
        <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${checked ? 'translate-x-4' : 'translate-x-0'}`}></div>
      </div>
      {label && <span className="text-xs font-bold whitespace-nowrap" style={{ color: checked ? activeColor : '#857D6E' }}>{label}</span>}
    </div>
  );
}


/* ============================================================================
   ACCOUNTS / ERP MANAGER (Adapted from FinanceDashboard)
============================================================================ */
function AccountsManager({ supabase }: { supabase: any }) {
  const [allRows, setAllRows] = useState<Transaction[]>([]);
  const [syllabi, setSyllabi] = useState<Syllabus[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters State
  const [dateRange, setDateRange] = useState<DateRangeOption>("ALL");
  const [customRange, setCustomRange] = useState({ start: "", end: "" });
  const [courseFilter, setCourseFilter] = useState<string>("ALL");
  
  // Reports Modal State
  const [showReports, setShowReports] = useState(false);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      
      const [ledgerRes, syllabiRes] = await Promise.all([
        supabase.from("gyanhub_accounting").select("*").order("transaction_date", { ascending: false }),
        supabase.from("syllabi_v2").select("id, name") 
      ]);

      if (ledgerRes.data) setAllRows(ledgerRes.data.map((d: any) => ({ ...d, amount: Number(d.amount) })));
      if (syllabiRes.data) setSyllabi(syllabiRes.data);
      if (syllabiRes.error) console.error("Syllabi fetch error:", syllabiRes.error);
      
      setIsLoading(false);
    }
    fetchData();
  }, [supabase]);

  // Filter Rows based on selected filters
  const filteredRows = useMemo(() => {
    return allRows.filter((r) => {
      // 1. Filter by Course
      if (courseFilter !== "ALL" && String(r.syllabus_id) !== courseFilter) {
        return false;
      }
      
      // 2. Filter by Date Range
      if (dateRange === "ALL") return true;
      
      const date = new Date(r.transaction_date);
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      
      const getPastDate = (days: number) => {
        const d = new Date(now);
        d.setDate(d.getDate() - days);
        return d;
      };

      switch (dateRange) {
        case "LAST_7_DAYS": return date >= getPastDate(7);
        case "LAST_15_DAYS": return date >= getPastDate(15);
        case "LAST_30_DAYS": return date >= getPastDate(30);
        case "LAST_45_DAYS": return date >= getPastDate(45);
        case "LAST_3_MONTHS": 
          const m3 = new Date(now); m3.setMonth(m3.getMonth() - 3); return date >= m3;
        case "LAST_6_MONTHS": 
          const m6 = new Date(now); m6.setMonth(m6.getMonth() - 6); return date >= m6;
        case "THIS_YEAR":
          return date.getFullYear() === now.getFullYear();
        case "CUSTOM":
          if (customRange.start && date < new Date(customRange.start)) return false;
          if (customRange.end && date > new Date(customRange.end)) return false;
          return true;
        default:
          return true;
      }
    });
  }, [allRows, dateRange, courseFilter, customRange]);

  const globalAnalytics = useAnalytics(allRows, syllabi);
  const analytics = useAnalytics(filteredRows, syllabi);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[500px] text-[#B8862E]">
        <Loader2 className="animate-spin mr-2" size={32} /> Loading Financial Models...
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 w-full pb-24">
      <SectionHeader 
        eyebrow="GyanHub Management" 
        title="Executive ERP Dashboard" 
        subtitle="Manage accounting ledgers, cash flow, and financial health."
        action={
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowReports(true)}
              className="flex items-center gap-2 bg-[#14161F] hover:bg-[#22242F] text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors shadow-sm"
            >
              <FileBarChart size={16} />
              Accounting Reports
            </button>
            <p className="font-mono text-xs text-[#857D6E] bg-white border border-[#E6E0D2] px-3 py-2 rounded-lg hidden sm:block">
              {new Date().toLocaleDateString("en-NP", { year: "numeric", month: "long", day: "numeric" })}
            </p>
          </div>
        } 
      />

      {/* Filters Section */}
      <div className="bg-white border border-[#E6E0D2] rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center gap-6 shadow-sm">
        <div className="flex items-start gap-2 text-[#857D6E] w-full sm:w-auto">
          <Calendar size={16} className="mt-1 shrink-0" />
          <div className="flex flex-col gap-1 w-full">
            <label className="text-[10px] uppercase tracking-wide font-bold">Date Range</label>
            <div className="flex flex-wrap items-center gap-2">
              <select 
                value={dateRange} 
                onChange={(e) => setDateRange(e.target.value as DateRangeOption)}
                className="w-full sm:w-auto text-sm bg-transparent border-b border-[#E6E0D2] focus:border-[#B8862E] focus:outline-none pb-1 pr-6 font-bold text-[#14161F]"
              >
                <option value="ALL">All Time</option>
                <option value="LAST_7_DAYS">Last 7 Days</option>
                <option value="LAST_15_DAYS">Last 15 Days</option>
                <option value="LAST_30_DAYS">Last 30 Days</option>
                <option value="LAST_45_DAYS">Last 45 Days</option>
                <option value="LAST_3_MONTHS">Last 3 Months</option>
                <option value="LAST_6_MONTHS">Last 6 Months</option>
                <option value="THIS_YEAR">This Year</option>
                <option value="CUSTOM">Custom Range</option>
              </select>
              {dateRange === "CUSTOM" && (
                <div className="flex flex-wrap items-center gap-1 bg-[#FAF8F3] rounded border border-[#E6E0D2] px-2 py-0.5 mt-2 sm:mt-0 w-full sm:w-auto">
                  <input 
                    type="date" 
                    className="text-xs bg-transparent focus:outline-none font-mono text-[#14161F]" 
                    value={customRange.start} 
                    onChange={(e) => setCustomRange(c => ({...c, start: e.target.value}))} 
                  />
                  <span className="text-[#857D6E] text-[10px]">to</span>
                  <input 
                    type="date" 
                    className="text-xs bg-transparent focus:outline-none font-mono text-[#14161F]" 
                    value={customRange.end} 
                    onChange={(e) => setCustomRange(c => ({...c, end: e.target.value}))} 
                  />
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="w-full h-px sm:w-px sm:h-8 bg-[#E6E0D2]"></div>
        <div className="flex items-start gap-2 text-[#857D6E] w-full sm:w-auto">
          <BookOpen size={16} className="mt-1 shrink-0" />
          <div className="flex flex-col gap-1 w-full">
            <label className="text-[10px] uppercase tracking-wide font-bold">Course</label>
            <select 
              value={courseFilter} 
              onChange={(e) => setCourseFilter(e.target.value)}
              className="w-full sm:w-auto text-sm bg-transparent border-b border-[#E6E0D2] focus:border-[#B8862E] focus:outline-none pb-1 pr-6 font-bold text-[#14161F]"
            >
              <option value="ALL">All Courses</option>
              {syllabi.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      <section>
        <div className="mb-4">
          <h2 className="font-serif text-xl text-[#14161F] font-bold">Business Health</h2>
          <p className="text-sm text-[#857D6E]">Automated operational assessment (KPIs ignore filters & compute all-time)</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-1 rounded-xl border border-[#E6E0D2] bg-[#14161F] text-white p-6 flex flex-col justify-center items-center text-center shadow-sm">
            <Activity className="mb-2 text-[#0E7C7B]" size={32} />
            <div className="text-5xl font-serif mb-1 font-bold">{globalAnalytics.healthScore}</div>
            <div className="text-sm text-[#9C9788] uppercase tracking-wide font-bold">Health Score / 100</div>
            <div className="mt-4 text-xs bg-[#0E7C7B]/20 text-[#0E7C7B] px-3 py-1 rounded-full border border-[#0E7C7B]/30 font-bold">
              {globalAnalytics.healthScore > 75 ? "Optimal" : globalAnalytics.healthScore > 50 ? "Stable" : "Requires Attention"}
            </div>
          </div>
          <div className="md:col-span-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard title="Current Cash" value={money(globalAnalytics.currentCash)} icon={<Wallet />} />
            <MetricCard title="Cash Runway" value={`${globalAnalytics.runwayMonths.toFixed(1)} Months`} icon={<Clock />} />
            <MetricCard title="Overall Profit Margin" value={pct(globalAnalytics.overallMargin)} icon={<Target />} trend={globalAnalytics.overallMargin > 0 ? "up" : "down"} />
            <MetricCard title="Expected Cash" value={money(globalAnalytics.expectedCash)} icon={<PiggyBank />} subtext="Current Cash minus Payables" />
            <MetricCard title="Outstanding Receivable" value={money(globalAnalytics.outReceivable)} icon={<TrendingUp />} color="#8A6416" />
            <MetricCard title="Outstanding Payable" value={money(globalAnalytics.outPayable)} icon={<TrendingDown />} color="#B23B3B" />
            <MetricCard title="Net Profit (All Time)" value={money(globalAnalytics.netProfit)} icon={<Landmark />} color={globalAnalytics.netProfit >= 0 ? "#1E8F6F" : "#B23B3B"} />
            <div className="rounded-xl border border-[#E6E0D2] bg-white p-5 shadow-sm flex flex-col justify-center">
              <p className="text-[11px] uppercase tracking-wide text-[#857D6E] font-bold mb-2">Top Course</p>
              <p className="font-bold text-sm truncate text-[#14161F]">{globalAnalytics.courseStats[0]?.name || "None"}</p>
              <p className="text-sm font-mono text-[#0E7C7B] font-bold">{money(globalAnalytics.courseStats[0]?.profit || 0)} profit</p>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="mb-4">
          <h2 className="font-serif text-xl text-[#14161F] font-bold">Course Analytics</h2>
          <p className="text-sm text-[#857D6E]">Revenue vs Direct Costs (Filtered Data)</p>
        </div>
        <div className="rounded-xl border border-[#E6E0D2] bg-white overflow-x-auto shadow-sm w-full">
          <table className="w-full text-sm text-left">
            <thead className="bg-[#FAF8F3] text-[#857D6E] text-[11px] uppercase tracking-wider font-bold whitespace-nowrap">
              <tr>
                <th className="px-6 py-4">Course</th>
                <th className="px-6 py-4 text-right">Revenue</th>
                <th className="px-6 py-4 text-right">Tutor Cost</th>
                <th className="px-6 py-4 text-right">Marketing</th>
                <th className="px-6 py-4 text-right">Net Profit</th>
                <th className="px-6 py-4 text-right">Mktg ROI</th>
                <th className="px-6 py-4 text-right">Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E6E0D2] whitespace-nowrap">
              {analytics.courseStats.map((c) => (
                <tr key={c.id} className="hover:bg-[#FAF8F3] transition-colors">
                  <td className="px-6 py-4 font-bold text-[#14161F]">{c.name}</td>
                  <td className="px-6 py-4 text-right font-mono text-[#4A4638]">{money(c.revenue)}</td>
                  <td className="px-6 py-4 text-right font-mono text-[#B23B3B]">{c.tutor > 0 ? money(c.tutor) : "-"}</td>
                  <td className="px-6 py-4 text-right font-mono text-[#B23B3B]">{c.marketing > 0 ? money(c.marketing) : "-"}</td>
                  <td className={`px-6 py-4 text-right font-mono font-bold ${c.profit >= 0 ? "text-[#1E8F6F]" : "text-[#B23B3B]"}`}>
                    {money(c.profit)}
                  </td>
                  <td className="px-6 py-4 text-right font-mono text-[#8A6416] font-bold">
                    {c.roi > 0 ? `${c.roi.toFixed(1)}x` : "-"}
                  </td>
                  <td className="px-6 py-4 text-right text-[#8A6416] text-xs">
                    {"★".repeat(c.score)}{"☆".repeat(5 - c.score)}
                  </td>
                </tr>
              ))}
              {analytics.courseStats.length === 0 && (
                <tr><td colSpan={7} className="px-6 py-8 text-center text-[#857D6E] font-medium">No course data recorded yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <div className="mb-4">
          <h2 className="font-serif text-xl text-[#14161F] font-bold">Financial Trends</h2>
          <p className="text-sm text-[#857D6E]">Cash flow and spending allocation (Filtered Data)</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-xl border border-[#E6E0D2] bg-white p-5 shadow-sm">
            <h3 className="font-serif text-lg mb-4 font-bold text-[#14161F]">Monthly Revenue vs Expense</h3>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.monthlyTrends} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E6E0D2" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#857D6E" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "#857D6E" }} axisLine={false} tickLine={false} tickFormatter={(v) => `Rs ${v/1000}k`} width={50} />
                  <Tooltip formatter={(v: any) => money(Number(v))} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Legend wrapperStyle={{ fontSize: 12, paddingTop: '10px' }} />
                  <Bar dataKey="revenue" name="Revenue" fill="#1E8F6F" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expense" name="Expense" fill="#B23B3B" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-xl border border-[#E6E0D2] bg-white p-5 shadow-sm">
            <h3 className="font-serif text-lg mb-4 font-bold text-[#14161F]">Expense Breakdown</h3>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie data={analytics.expenseData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={2}>
                    {analytics.expenseData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v: any) => money(Number(v))} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <div className="mb-4">
              <h2 className="font-serif text-xl text-[#14161F] font-bold">Top Performing Batches</h2>
              <p className="text-sm text-[#857D6E]">Ranked by Net Profit (Filtered Data)</p>
            </div>
            <div className="rounded-xl border border-[#E6E0D2] bg-white shadow-sm flex flex-col gap-0 divide-y divide-[#E6E0D2] max-h-[400px] overflow-y-auto">
              {analytics.batchStats.slice(0, 10).map((b) => (
                <div key={`${b.courseName}-${b.batch}`} className="p-4 flex items-center justify-between hover:bg-[#FAF8F3]">
                  <div className="truncate pr-2">
                    <p className="font-bold text-[#14161F] truncate">{b.batch}</p>
                    <p className="text-[11px] text-[#857D6E] mt-0.5 truncate">{b.courseName}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`font-mono font-bold ${b.profit >= 0 ? "text-[#1E8F6F]" : "text-[#B23B3B]"}`}>{money(b.profit)}</p>
                    <p className="text-[10px] font-bold text-[#857D6E] mt-0.5">Margin: {pct(b.revenue > 0 ? b.profit/b.revenue : 0)}</p>
                  </div>
                </div>
              ))}
              {analytics.batchStats.length === 0 && <div className="p-8 text-center text-sm font-medium text-[#857D6E]">No batch records found.</div>}
            </div>
          </div>

          <div>
            <div className="mb-4">
              <h2 className="font-serif text-xl text-[#14161F] font-bold">Owner Capital & Withdrawals</h2>
              <p className="text-sm text-[#857D6E]">Tracking investments and profit distribution (Filtered Data)</p>
            </div>
            <div className="grid grid-cols-1 gap-4">
              <div className="rounded-xl border border-[#E6E0D2] bg-white p-5 shadow-sm">
                <h4 className="font-serif font-bold text-lg text-[#14161F] mb-3 border-b border-[#E6E0D2] pb-2">Nischal</h4>
                <div className="grid grid-cols-3 gap-2 text-center overflow-x-auto pb-2">
                  <div>
                    <p className="text-[10px] uppercase font-bold tracking-wide text-[#857D6E]">Investment</p>
                    <p className="font-mono text-[#1E8F6F] font-bold text-sm mt-1">{money(analytics.nischal.inv)}</p>
                  </div>
                  <div className="border-l border-r border-[#E6E0D2]">
                    <p className="text-[10px] uppercase font-bold tracking-wide text-[#857D6E]">Withdrawal</p>
                    <p className="font-mono text-[#B23B3B] font-bold text-sm mt-1">{money(analytics.nischal.with)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold tracking-wide text-[#857D6E]">Net Capital</p>
                    <p className="font-mono font-bold text-sm mt-1 text-[#14161F]">{money(analytics.nischal.net)}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-[#E6E0D2] bg-white p-5 shadow-sm">
                <h4 className="font-serif font-bold text-lg text-[#14161F] mb-3 border-b border-[#E6E0D2] pb-2">Dipesh</h4>
                <div className="grid grid-cols-3 gap-2 text-center overflow-x-auto pb-2">
                  <div>
                    <p className="text-[10px] uppercase font-bold tracking-wide text-[#857D6E]">Investment</p>
                    <p className="font-mono text-[#1E8F6F] font-bold text-sm mt-1">{money(analytics.dipesh.inv)}</p>
                  </div>
                  <div className="border-l border-r border-[#E6E0D2]">
                    <p className="text-[10px] uppercase font-bold tracking-wide text-[#857D6E]">Withdrawal</p>
                    <p className="font-mono text-[#B23B3B] font-bold text-sm mt-1">{money(analytics.dipesh.with)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold tracking-wide text-[#857D6E]">Net Capital</p>
                    <p className="font-mono font-bold text-sm mt-1 text-[#14161F]">{money(analytics.dipesh.net)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <hr className="border-[#E6E0D2]" />

      <section>
        <div className="mb-6">
          <h2 className="font-serif text-xl text-[#14161F] font-bold">Accounting Ledger</h2>
          <p className="text-sm text-[#857D6E]">Record or edit transactions directly to the database</p>
        </div>
        <LedgerSection rows={allRows} setRows={setAllRows} syllabi={syllabi} supabase={supabase} />
      </section>

      {/* Reports Modal */}
      {showReports && (
        <ReportsModal analytics={analytics} onClose={() => setShowReports(false)} />
      )}
    </motion.div>
  );
}

// Support components for AccountsManager
function MetricCard({ title, value, icon, subtext, color = "#14161F", trend }: { title: string, value: string, icon: React.ReactNode, subtext?: string, color?: string, trend?: "up" | "down" }) {
  return (
    <div className="rounded-xl border border-[#E6E0D2] bg-white p-5 shadow-sm flex flex-col justify-center transition-transform hover:-translate-y-1">
      <div className="flex justify-between items-start mb-2 text-[#857D6E]">
        <span className="text-[11px] font-bold uppercase tracking-wider">{title}</span>
        <span className="opacity-70" style={{ color }}>{icon}</span>
      </div>
      <div className="text-xl md:text-2xl font-mono font-bold flex items-center gap-2 truncate" style={{ color }}>
        {value}
        {trend === "up" && <TrendingUp size={16} className="text-[#1E8F6F] shrink-0" />}
        {trend === "down" && <TrendingDown size={16} className="text-[#B23B3B] shrink-0" />}
      </div>
      {subtext && <div className="text-xs text-[#857D6E] font-medium mt-2 leading-snug">{subtext}</div>}
    </div>
  );
}

function LedgerSection({ rows, setRows, syllabi, supabase }: { rows: Transaction[], setRows: React.Dispatch<React.SetStateAction<Transaction[]>>, syllabi: Syllabus[], supabase: any }) {
  const formRef = useRef<HTMLDivElement>(null);

  const emptyDraft = {
    transaction_date: new Date().toISOString().slice(0, 10),
    category: "COURSE_INCOME" as AccountingCategory,
    accounting_status: "CURRENT" as AccountingStatus,
    syllabus_id: "",
    batch_name: "",
    sub_type: "" as AccountingSubType | "",
    amount: "",
    description: "",
    is_accounting: true,
  };

  const [draft, setDraft] = useState(emptyDraft);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<AccountingCategory | "ALL">("ALL");

  const rule = CATEGORY_RULES[draft.category];
  
  const visibleRows = useMemo(() => 
    (categoryFilter === "ALL" ? rows : rows.filter((r) => r.category === categoryFilter))
      .slice().sort((a, b) => (a.transaction_date < b.transaction_date ? 1 : -1)),
  [rows, categoryFilter]);

  function handleEdit(tx: Transaction) {
    setEditingId(tx.id);
    setDraft({
      transaction_date: tx.transaction_date,
      category: tx.category,
      accounting_status: tx.accounting_status,
      syllabus_id: tx.syllabus_id ? String(tx.syllabus_id) : "",
      batch_name: tx.batch_name || "",
      sub_type: tx.sub_type || "",
      amount: String(tx.amount),
      description: tx.description || "",
      is_accounting: tx.is_accounting
    });
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function cancelEdit() {
    setEditingId(null);
    setDraft(emptyDraft);
    setError(null);
  }

  function validateTransaction(d: typeof draft) {
    if (rule.requiresSyllabus && !d.syllabus_id.trim()) return `${rule.label} requires selecting a course.`;
    if (rule.requiresBatch && !d.batch_name.trim()) return `${rule.label} requires batch name.`;
    if (rule.subTypeRequired && (!d.sub_type || !rule.subTypeOptions?.includes(d.sub_type as any))) return `${rule.label} requires specific sub-type.`;
    const amt = Number(d.amount);
    if (!d.amount.trim() || Number.isNaN(amt) || amt <= 0) return "Amount must be greater than 0.";
    return null;
  }

  async function handleSubmit() {
    const err = validateTransaction(draft);
    if (err) return setError(err);
    
    setError(null);
    setIsSubmitting(true);

    const finalIsAccounting = draft.category === "MARKETING" ? draft.is_accounting : true;

    const payload = {
      transaction_date: draft.transaction_date,
      category: draft.category,
      accounting_status: draft.accounting_status,
      syllabus_id: draft.syllabus_id ? Number(draft.syllabus_id) : null,
      batch_name: draft.batch_name || null,
      sub_type: draft.sub_type || null,
      amount: Number(draft.amount),
      description: draft.description || null,
      is_accounting: finalIsAccounting,
    };

    if (editingId) {
      const { data, error: updateError } = await supabase
        .from("gyanhub_accounting")
        .update(payload)
        .eq("id", editingId)
        .select()
        .single();

      if (updateError) {
        setError(updateError.message);
      } else {
        const updatedRow = { ...data, amount: Number(data.amount) } as Transaction;
        setRows((r) => r.map((prev) => prev.id === editingId ? updatedRow : prev));
        cancelEdit();
      }
    } else {
      const { data, error: insertError } = await supabase
        .from("gyanhub_accounting")
        .insert([payload])
        .select()
        .single();

      if (insertError) {
        setError(insertError.message);
      } else {
        setRows((r) => [{ ...data, amount: Number(data.amount) } as Transaction, ...r]);
        setDraft({ ...emptyDraft, transaction_date: draft.transaction_date });
      }
    }
    
    setIsSubmitting(false);
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-8">
      <div ref={formRef} className="bg-white border border-[#E6E0D2] rounded-xl p-5 h-fit shadow-sm relative">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-serif font-bold text-lg text-[#14161F]">{editingId ? "Edit Entry" : "New Entry"}</h3>
          {editingId && (
            <button onClick={cancelEdit} className="text-[#857D6E] hover:bg-[#FAF8F3] p-1 rounded-full transition-colors" title="Cancel Edit">
              <X size={18} />
            </button>
          )}
        </div>
        
        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5 text-xs font-bold"><span className="uppercase tracking-wide text-[#857D6E]">Date</span>
            <input type="date" value={draft.transaction_date} onChange={(e) => setDraft((d) => ({ ...d, transaction_date: e.target.value }))} className="font-mono text-sm border border-[#E6E0D2] rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[#B8862E]/40" />
          </label>
          
          <label className="flex flex-col gap-1.5 text-xs font-bold"><span className="uppercase tracking-wide text-[#857D6E]">Category</span>
            <select value={draft.category} onChange={(e) => setDraft(d => ({ ...d, category: e.target.value as AccountingCategory, sub_type: "", syllabus_id: CATEGORY_RULES[e.target.value as AccountingCategory].requiresSyllabus ? d.syllabus_id : "", batch_name: CATEGORY_RULES[e.target.value as AccountingCategory].requiresBatch ? d.batch_name : "" }))} className="text-sm border border-[#E6E0D2] rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[#B8862E]/40">
              {CATEGORY_ORDER.map((c) => <option key={c} value={c}>{CATEGORY_RULES[c].label}</option>)}
            </select>
          </label>

          <label className="flex flex-col gap-1.5 text-xs font-bold"><span className="uppercase tracking-wide text-[#857D6E]">Status</span>
            <select value={draft.accounting_status} onChange={(e) => setDraft((d) => ({ ...d, accounting_status: e.target.value as AccountingStatus }))} className="text-sm border border-[#E6E0D2] rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[#B8862E]/40">
              <option value="CURRENT">Current</option><option value="PREPAID">Prepaid</option><option value="OUTSTANDING">Outstanding</option>
            </select>
          </label>

          {(rule.requiresSyllabus || draft.category === "MARKETING") && (
            <label className="flex flex-col gap-1.5 text-xs font-bold"><span className="uppercase tracking-wide text-[#857D6E]">Course</span>
              <select value={draft.syllabus_id} onChange={(e) => setDraft((d) => ({ ...d, syllabus_id: e.target.value }))} className="text-sm border border-[#E6E0D2] rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[#B8862E]/40">
                <option value="">Select a Course...</option>
                {syllabi.map((s) => (
                  <option key={s.id} value={s.id}>{s.name || `Course #${s.id}`}</option>
                ))}
              </select>
            </label>
          )}

          {(rule.requiresBatch || draft.category === "MARKETING") && (
            <label className="flex flex-col gap-1.5 text-xs font-bold"><span className="uppercase tracking-wide text-[#857D6E]">Batch Name</span>
              <input type="text" value={draft.batch_name} onChange={(e) => setDraft((d) => ({ ...d, batch_name: e.target.value }))} placeholder="e.g. DSA-Batch-11" className="text-sm border border-[#E6E0D2] rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[#B8862E]/40" />
            </label>
          )}

          {rule.subTypeOptions && (
            <label className="flex flex-col gap-1.5 text-xs font-bold"><span className="uppercase tracking-wide text-[#857D6E]">Sub-type</span>
              <select value={draft.sub_type} onChange={(e) => setDraft((d) => ({ ...d, sub_type: e.target.value as AccountingSubType }))} className="text-sm border border-[#E6E0D2] rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[#B8862E]/40">
                <option value="">Select…</option>{rule.subTypeOptions.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </label>
          )}

          <label className="flex flex-col gap-1.5 text-xs font-bold"><span className="uppercase tracking-wide text-[#857D6E]">Amount (NPR)</span>
            <input type="number" min={1} value={draft.amount} onChange={(e) => setDraft((d) => ({ ...d, amount: e.target.value }))} placeholder="0" className="font-mono text-sm border border-[#E6E0D2] rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[#B8862E]/40" />
          </label>

          <label className="flex flex-col gap-1.5 text-xs font-bold"><span className="uppercase tracking-wide text-[#857D6E]">Description</span>
            <textarea value={draft.description} onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))} rows={2} className="text-sm border border-[#E6E0D2] rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[#B8862E]/40 resize-none" />
          </label>

          {draft.category === "MARKETING" && (
            <label className="flex items-center gap-2 text-xs pt-1 font-bold">
              <input
                type="checkbox"
                checked={draft.is_accounting}
                onChange={(e) => setDraft((d) => ({ ...d, is_accounting: e.target.checked }))}
                className="accent-[#0E7C7B] w-4 h-4 shrink-0"
              />
              <span className="text-[#14161F]">
                Counts toward global P&L
                <span className="block text-[10px] text-[#857D6E] mt-0.5 font-medium leading-tight">
                  Uncheck if this is just tracking analytical marketing spend to calculate ROI on a course/batch.
                </span>
              </span>
            </label>
          )}

          {error && <p className="text-xs text-[#B23B3B] bg-[#F3DAD6] border border-[#EAC2BC] rounded-lg px-3 py-2 flex items-center gap-1 font-bold"><AlertTriangle size={14} className="shrink-0"/> {error}</p>}

          <div className="flex gap-2 mt-2">
            {editingId && (
              <button onClick={cancelEdit} disabled={isSubmitting} className="flex-1 bg-[#FAF8F3] text-[#14161F] text-sm font-bold rounded-lg py-2.5 transition-colors hover:bg-[#EFEBE1] border border-[#E6E0D2]">
                Cancel
              </button>
            )}
            <button onClick={handleSubmit} disabled={isSubmitting} className={`flex-[2] bg-[#14161F] text-white text-sm font-bold rounded-lg py-2.5 transition-colors ${isSubmitting ? "opacity-70" : "hover:bg-[#22242F]"}`}>
              {isSubmitting ? "Saving..." : (editingId ? "Update Entry" : "Post to Ledger")}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white border border-[#E6E0D2] rounded-xl overflow-hidden shadow-sm flex flex-col h-fit">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b border-[#E6E0D2] bg-[#FAF8F3]">
          <h3 className="font-serif font-bold text-lg text-[#14161F]">Recent Transactions</h3>
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value as AccountingCategory | "ALL")} className="text-xs font-bold border border-[#E6E0D2] rounded-md px-2 py-1.5 bg-white focus:outline-none w-full sm:w-auto">
            <option value="ALL">All categories</option>
            {CATEGORY_ORDER.map((c) => <option key={c} value={c}>{CATEGORY_RULES[c].label}</option>)}
          </select>
        </div>

        <div className="overflow-x-auto max-h-[700px] w-full">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-[#EFEBE1] z-10 whitespace-nowrap">
              <tr className="text-[10px] font-bold uppercase tracking-wider text-[#857D6E]">
                <th className="text-left px-5 py-3">Date</th>
                <th className="text-left px-4 py-3">Category</th>
                <th className="text-left px-4 py-3">Course/Batch</th>
                <th className="text-right px-5 py-3">Amount</th>
                <th className="text-right px-4 py-3 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E6E0D2] whitespace-nowrap md:whitespace-normal">
              {visibleRows.map((r) => {
                const type = deriveTransactionType(r.category);
                const isOutflow = type === "EXPENSE" || type === "WITHDRAWAL";
                
                let courseName = "";
                if (r.syllabus_id) {
                  const s = syllabi.find(s => s.id === r.syllabus_id);
                  courseName = s ? s.name : `Course #${r.syllabus_id}`;
                }

                return (
                  <tr key={r.id} className="hover:bg-[#FAF8F3] transition-colors group">
                    <td className="px-5 py-3 font-mono text-xs font-bold text-[#857D6E] whitespace-nowrap align-top">{r.transaction_date}</td>
                    <td className="px-4 py-3 align-top min-w-[120px]">
                      <div className="font-bold text-[#14161F] text-xs flex flex-wrap gap-1">
                        {CATEGORY_RULES[r.category].label}
                        {!r.is_accounting && <span className="text-[9px] bg-[#EFEBE1] text-[#857D6E] px-1 py-0.5 rounded">NON-P&L</span>}
                      </div>
                      <div className="text-[10px] font-medium text-[#857D6E] mt-0.5 max-w-[200px] truncate md:whitespace-normal md:break-words">{r.description}</div>
                    </td>
                    <td className="px-4 py-3 text-xs font-bold text-[#857D6E] align-top">
                      {courseName ? <div>{courseName}</div> : null}
                      {r.batch_name ? <div className="font-medium">{r.batch_name}</div> : (r.sub_type ? <div className="font-medium">{r.sub_type}</div> : "—")}
                    </td>
                    <td className={`px-5 py-3 text-right font-mono font-bold align-top ${isOutflow ? "text-[#B23B3B]" : "text-[#1E8F6F]"}`}>
                      {isOutflow ? "−" : "+"}{money(r.amount)}
                    </td>
                    <td className="px-3 py-3 text-right align-top">
                      <button onClick={() => handleEdit(r)} className="p-1.5 text-[#B4AF9F] hover:bg-[#EFEBE1] hover:text-[#14161F] rounded transition-colors opacity-100 lg:opacity-0 group-hover:opacity-100" title="Edit Entry">
                        <Pencil size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {visibleRows.length === 0 && (
                <tr><td colSpan={5} className="px-5 py-8 text-center text-sm font-medium text-[#857D6E]">No transactions found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ReportsModal({ analytics, onClose }: { analytics: ReturnType<typeof useAnalytics>, onClose: () => void }) {
  const [activeTab, setActiveTab] = useState(1);

  const REPORT_LIST = [
    { id: 1, title: "Operating Expense Ratio", question: "Are we spending efficiently?" },
    { id: 2, title: "Collection Health", question: "Are we collecting our income?" },
    { id: 3, title: "Profit per Expense Rupee", question: "How efficiently do we spend?" },
    { id: 4, title: "Course Profit Contribution", question: "Which courses drive profit?" },
    { id: 5, title: "Profit Concentration", question: "Are we dependent on a few courses?" },
    { id: 6, title: "Break-Even Revenue", question: "How much must we earn to cover costs?" },
    { id: 7, title: "Expense-to-Revenue Trend", question: "Is efficiency improving?" },
    { id: 8, title: "Monthly Profit Growth", question: "Is profitability growing?" },
    { id: 9, title: "Cash Safety / Runway", question: "How long can we operate?" },
    { id: 10, title: "Outstanding Liability Risk", question: "Can outstanding money cover what we owe?" },
  ];

  const renderReportContent = () => {
    const r = analytics.reports;

    switch (activeTab) {
      case 1:
        return (
          <div className="space-y-4">
            <h3 className="text-xl md:text-2xl font-serif font-bold text-[#14161F]">Operating Expense Ratio</h3>
            <p className="text-sm font-medium text-[#857D6E]">How much of our revenue are we consuming just to operate the business?</p>
            <div className="bg-white p-4 md:p-6 rounded-xl border border-[#E6E0D2] shadow-sm">
              <div className="text-4xl md:text-5xl font-serif font-bold mb-2 text-[#B23B3B]">{pct(r.operatingExpenseRatio)}</div>
              <p className="text-xs md:text-sm font-mono font-bold text-[#B4AF9F]">Formula: Total Expense / Total Income × 100</p>
              <div className="mt-6 w-full bg-[#EFEBE1] rounded-full h-3">
                <div className="bg-[#B23B3B] h-3 rounded-full transition-all duration-1000" style={{ width: `${Math.min(100, r.operatingExpenseRatio * 100)}%` }}></div>
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            <h3 className="text-xl md:text-2xl font-serif font-bold text-[#14161F]">Collection Health</h3>
            <p className="text-sm font-medium text-[#857D6E]">How much of our earned money is actually in our hands?</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white p-4 md:p-6 rounded-xl border border-[#E6E0D2] shadow-sm">
                <p className="text-[11px] font-bold uppercase tracking-wide text-[#857D6E] mb-2">Cash Collection Coverage</p>
                <div className="text-3xl md:text-4xl font-serif font-bold text-[#1E8F6F]">{pct(r.cashCollectionCoverage)}</div>
                <p className="text-xs font-bold text-[#B4AF9F] mt-2">Cash / (Cash + Receivables)</p>
              </div>
              <div className="bg-white p-4 md:p-6 rounded-xl border border-[#E6E0D2] shadow-sm">
                <p className="text-[11px] font-bold uppercase tracking-wide text-[#857D6E] mb-2">Receivable Ratio</p>
                <div className="text-3xl md:text-4xl font-serif font-bold text-[#8A6416]">{pct(r.receivableRatio)}</div>
                <p className="text-xs font-bold text-[#B4AF9F] mt-2">Outstanding / Total Income</p>
              </div>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-4">
            <h3 className="text-xl md:text-2xl font-serif font-bold text-[#14161F]">Expense Efficiency</h3>
            <p className="text-sm font-medium text-[#857D6E]">For every Rs 1 we spend, how much profit are we generating?</p>
            <div className="bg-white p-4 md:p-6 rounded-xl border border-[#E6E0D2] shadow-sm">
              <div className="text-4xl md:text-5xl font-serif font-bold mb-2 text-[#1E8F6F]">{r.expenseEfficiency.toFixed(2)}x</div>
              <p className="text-sm text-[#14161F] font-bold">Every Rs 1 of expense generates Rs {r.expenseEfficiency.toFixed(2)} in profit.</p>
              <p className="text-xs font-mono font-bold text-[#B4AF9F] mt-4">Formula: Net Profit / Total Expense</p>
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-4">
            <h3 className="text-xl md:text-2xl font-serif font-bold text-[#14161F]">Course Profit Contribution</h3>
            <p className="text-sm font-medium text-[#857D6E]">Which courses are actually responsible for our total profit?</p>
            <div className="bg-white rounded-xl border border-[#E6E0D2] overflow-x-auto shadow-sm">
              <table className="w-full text-sm whitespace-nowrap">
                <thead className="bg-[#FAF8F3]">
                  <tr className="text-left text-[11px] font-bold uppercase tracking-wider text-[#857D6E]">
                    <th className="px-4 py-3">Course</th>
                    <th className="px-4 py-3 text-right">Net Profit</th>
                    <th className="px-4 py-3 text-right">Contribution %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E6E0D2]">
                  {analytics.courseStats.filter(c => c.profit > 0).map(c => (
                    <tr key={c.id}>
                      <td className="px-4 py-3 font-bold truncate max-w-[150px] md:max-w-xs">{c.name}</td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-[#1E8F6F]">{money(c.profit)}</td>
                      <td className="px-4 py-3 text-right font-mono font-bold">{pct(c.profitContribution)}</td>
                    </tr>
                  ))}
                  {analytics.courseStats.filter(c => c.profit > 0).length === 0 && (
                    <tr><td colSpan={3} className="px-4 py-6 text-center font-medium text-[#857D6E]">No profitable courses in this period.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );
      case 5:
        return (
          <div className="space-y-4">
            <h3 className="text-xl md:text-2xl font-serif font-bold text-[#14161F]">Profit Concentration</h3>
            <p className="text-sm font-medium text-[#857D6E]">How dependent is GyanHub&apos;s profit on a small number of courses?</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white p-4 md:p-6 rounded-xl border border-[#E6E0D2] shadow-sm text-center">
                <p className="text-[11px] font-bold uppercase tracking-wide text-[#857D6E] mb-2">Top 1 Course Dependency</p>
                <div className="text-4xl font-serif font-bold text-[#B23B3B]">{pct(r.top1Dependency)}</div>
              </div>
              <div className="bg-white p-4 md:p-6 rounded-xl border border-[#E6E0D2] shadow-sm text-center">
                <p className="text-[11px] font-bold uppercase tracking-wide text-[#857D6E] mb-2">Top 3 Course Dependency</p>
                <div className="text-4xl font-serif font-bold text-[#B23B3B]">{pct(r.top3Dependency)}</div>
              </div>
            </div>
          </div>
        );
      case 6:
        return (
          <div className="space-y-4">
            <h3 className="text-xl md:text-2xl font-serif font-bold text-[#14161F]">Break-Even Revenue</h3>
            <p className="text-sm font-medium text-[#857D6E]">How much revenue do we need to cover our expenses?</p>
            <div className="bg-white p-4 md:p-6 rounded-xl border border-[#E6E0D2] shadow-sm">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 border-b border-[#E6E0D2] pb-4 mb-4">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wide text-[#857D6E] mb-1">Break-even Revenue (Total Cost)</p>
                  <div className="text-2xl md:text-3xl font-mono font-bold text-[#B23B3B]">{money(r.breakEvenRevenue)}</div>
                </div>
                <div className="sm:text-right">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-[#857D6E] mb-1">Actual Revenue</p>
                  <div className="text-2xl md:text-3xl font-mono font-bold text-[#1E8F6F]">{money(analytics.totalIncome)}</div>
                </div>
              </div>
              <div className="text-sm font-bold text-[#14161F]">
                {analytics.totalIncome >= r.breakEvenRevenue 
                  ? `Comfortably above break-even by ${money(analytics.totalIncome - r.breakEvenRevenue)}` 
                  : `Currently operating below break-even point by ${money(r.breakEvenRevenue - analytics.totalIncome)}`}
              </div>
            </div>
          </div>
        );
      case 7:
        return (
          <div className="space-y-4">
            <h3 className="text-xl md:text-2xl font-serif font-bold text-[#14161F]">Expense-to-Revenue Trend</h3>
            <p className="text-sm font-medium text-[#857D6E]">Is our operational efficiency improving over time?</p>
            <div className="bg-white rounded-xl border border-[#E6E0D2] overflow-x-auto shadow-sm">
              <table className="w-full text-sm whitespace-nowrap">
                <thead className="bg-[#FAF8F3]">
                  <tr className="text-left text-[11px] font-bold uppercase tracking-wider text-[#857D6E]">
                    <th className="px-4 py-3">Month</th>
                    <th className="px-4 py-3 text-right">Revenue</th>
                    <th className="px-4 py-3 text-right">Expense</th>
                    <th className="px-4 py-3 text-right">Expense Ratio</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E6E0D2]">
                  {[...analytics.monthlyTrends].reverse().map(m => (
                    <tr key={m.month}>
                      <td className="px-4 py-3 font-bold">{m.month}</td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-[#1E8F6F]">{money(m.revenue)}</td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-[#B23B3B]">{money(m.expense)}</td>
                      <td className={`px-4 py-3 text-right font-mono font-bold ${m.expenseRatio > 0.8 ? 'text-[#B23B3B]' : ''}`}>
                        {pct(m.expenseRatio)}
                      </td>
                    </tr>
                  ))}
                  {analytics.monthlyTrends.length === 0 && (
                    <tr><td colSpan={4} className="px-4 py-6 text-center font-medium text-[#857D6E]">No trends to show.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );
      case 8:
        return (
          <div className="space-y-4">
            <h3 className="text-xl md:text-2xl font-serif font-bold text-[#14161F]">Monthly Profit Growth</h3>
            <p className="text-sm font-medium text-[#857D6E]">Is profitability actually growing or shrinking?</p>
            <div className="bg-white rounded-xl border border-[#E6E0D2] overflow-x-auto shadow-sm">
              <table className="w-full text-sm whitespace-nowrap">
                <thead className="bg-[#FAF8F3]">
                  <tr className="text-left text-[11px] font-bold uppercase tracking-wider text-[#857D6E]">
                    <th className="px-4 py-3">Month</th>
                    <th className="px-4 py-3 text-right">Net Profit</th>
                    <th className="px-4 py-3 text-right">M-o-M Growth</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E6E0D2]">
                  {[...analytics.monthlyTrends].reverse().map((m, idx) => (
                    <tr key={m.month}>
                      <td className="px-4 py-3 font-bold">{m.month}</td>
                      <td className={`px-4 py-3 text-right font-mono font-bold ${m.profit >= 0 ? 'text-[#1E8F6F]' : 'text-[#B23B3B]'}`}>
                        {money(m.profit)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold">
                        {m.profitGrowth === null ? "—" : (
                          <span className={m.profitGrowth > 0 ? "text-[#1E8F6F]" : "text-[#B23B3B]"}>
                            {m.profitGrowth > 0 ? "+" : ""}{pct(m.profitGrowth)}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {analytics.monthlyTrends.length === 0 && (
                    <tr><td colSpan={3} className="px-4 py-6 text-center font-medium text-[#857D6E]">No trends to show.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );
      case 9:
        return (
          <div className="space-y-4">
            <h3 className="text-xl md:text-2xl font-serif font-bold text-[#14161F]">Cash Safety & Runway</h3>
            <p className="text-sm font-medium text-[#857D6E]">How long can we operate with our current cash buffer?</p>
            <div className="bg-white p-4 md:p-6 rounded-xl border border-[#E6E0D2] shadow-sm">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                <div>
                  <div className="text-4xl md:text-5xl font-serif font-bold text-[#14161F]">
                    {r.cashSafety === 99 ? "∞" : r.cashSafety.toFixed(1)} <span className="text-lg md:text-xl font-sans text-[#857D6E]">months</span>
                  </div>
                  <p className="text-xs md:text-sm font-mono font-bold text-[#B4AF9F] mt-2">Current Cash: {money(analytics.currentCash)} <br className="sm:hidden" /> / Avg Mo Exp: {money(analytics.avgMonthlyExpense)}</p>
                </div>
                <div className={`px-6 py-3 rounded-xl border-2 font-bold text-lg w-full sm:w-auto text-center
                  ${r.cashSafety < 2 ? "bg-red-50 border-red-200 text-red-700" : 
                    r.cashSafety < 4 ? "bg-orange-50 border-orange-200 text-orange-700" :
                    r.cashSafety < 6 ? "bg-green-50 border-green-200 text-green-700" :
                    "bg-blue-50 border-blue-200 text-blue-700"}
                `}>
                  {r.cashSafety < 2 ? "🔴 Critical" : 
                   r.cashSafety < 4 ? "🟠 Watch" :
                   r.cashSafety < 6 ? "🟢 Healthy" : "🔵 Strong"}
                </div>
              </div>
            </div>
          </div>
        );
      case 10:
        return (
          <div className="space-y-4">
            <h3 className="text-xl md:text-2xl font-serif font-bold text-[#14161F]">Outstanding Liability Risk</h3>
            <p className="text-sm font-medium text-[#857D6E]">Can our outstanding expected money cover what we owe?</p>
            <div className="bg-white p-4 md:p-6 rounded-xl border border-[#E6E0D2] shadow-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-b border-[#E6E0D2] pb-6 mb-6">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wide text-[#857D6E] mb-1">Receivables (Inflow)</p>
                  <div className="text-2xl md:text-3xl font-mono font-bold text-[#8A6416]">{money(analytics.outReceivable)}</div>
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wide text-[#857D6E] mb-1">Payables (Outflow)</p>
                  <div className="text-2xl md:text-3xl font-mono font-bold text-[#B23B3B]">{money(analytics.outPayable)}</div>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wide text-[#857D6E] mb-1">Receivable-to-Payable Ratio</p>
                  <div className="text-xl md:text-2xl font-mono font-bold">{r.liabilityRisk === 999 ? "∞" : r.liabilityRisk.toFixed(2)}x</div>
                </div>
                <div className={`px-4 py-2 rounded-lg font-bold text-sm w-full sm:w-auto text-center
                  ${r.liabilityRisk > 1.2 || r.liabilityRisk === 999 ? "bg-[#DCEEE6] text-[#1E8F6F]" : 
                    r.liabilityRisk > 0.8 ? "bg-orange-50 text-orange-700" : "bg-red-50 text-red-700"}
                `}>
                  {r.liabilityRisk > 1.2 || r.liabilityRisk === 999 ? "🟢 Comfortable" : 
                   r.liabilityRisk > 0.8 ? "🟠 Monitor" : "🔴 Cash Pressure Potential"}
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#14161F]/40 backdrop-blur-sm flex items-center justify-center p-2 md:p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[95vw] md:max-w-5xl max-h-[90vh] md:max-h-[85vh] flex flex-col overflow-hidden border border-[#E6E0D2]">
        <div className="flex items-center justify-between p-4 md:p-5 border-b border-[#E6E0D2] shrink-0">
          <div>
            <h2 className="text-lg md:text-xl font-serif font-bold text-[#14161F]">Executive Accounting Reports</h2>
            <p className="text-[10px] md:text-xs font-medium text-[#857D6E] mt-1">Deep financial insights derived from filtered real-time ledger data</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-[#FAF8F3] rounded-full transition-colors text-[#857D6E] shrink-0">
            <X size={20} />
          </button>
        </div>
        
        <div className="flex flex-col md:flex-row flex-1 overflow-hidden min-h-[400px]">
          {/* Sidebar - horizontally scrollable on mobile */}
          <div className="w-full md:w-1/3 border-b md:border-b-0 md:border-r border-[#E6E0D2] bg-[#FAF8F3] shrink-0 flex md:flex-col overflow-x-auto md:overflow-x-visible md:overflow-y-auto snap-x md:snap-none hide-scrollbar">
            {REPORT_LIST.map((r) => (
              <button
                key={r.id}
                onClick={() => setActiveTab(r.id)}
                className={`w-64 md:w-full shrink-0 text-left p-3 md:p-4 border-r md:border-r-0 md:border-b border-[#E6E0D2] transition-colors snap-start
                  ${activeTab === r.id ? 'bg-white border-b-4 md:border-b-0 md:border-l-4 border-b-[#14161F] md:border-l-[#14161F]' : 'hover:bg-white/50 border-b-4 md:border-b-0 md:border-l-4 border-b-transparent md:border-l-transparent'}`}
              >
                <div className={`font-bold text-xs md:text-sm ${activeTab === r.id ? 'text-[#14161F]' : 'text-[#857D6E]'}`}>{r.title}</div>
                <div className="text-[10px] font-medium text-[#B4AF9F] mt-1 line-clamp-2 md:line-clamp-none">{r.question}</div>
              </button>
            ))}
          </div>
          
          {/* Content Area */}
          <div className="w-full md:w-2/3 bg-white overflow-y-auto p-4 md:p-8 relative">
            {renderReportContent()}
          </div>
        </div>
      </div>
    </div>
  );
}


/* ============================================================================
   ROOT COMPONENT (AdminDashboard)
============================================================================ */
export default function AdminDashboard() {
  const supabase = useSupabase();

  const [isLocked, setIsLocked] = useState(true);
  const [loginUser, setLoginUser] = useState("");
  const [loginPass, setLoginPass] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [activeTab, setActiveTab] = useState("Accounts");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const [chatOpen, setChatOpen] = useState(false);
  const [activeUser, setActiveUser] = useState<string | null>(null);

  // Initialize Admin State
  useEffect(() => {
    const checkAdmin = () => {
      const unlocked = localStorage.getItem('admin_unlocked');
      if (unlocked === 'true') setIsLocked(false);
      setLoadingAuth(false);
    };
    checkAdmin();
  }, []);

  // Close sidebar on tab change on mobile
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [activeTab]);

  // Isolate Data Domains
  const isUnlocked = !isLocked && !loadingAuth;
  const { conversations, loading: loadingConversations } = useMessages(supabase, isUnlocked);
  const { orders, enrollments, refresh: refreshOrdersAndEnr } = useOrdersAndEnrollments(supabase, isUnlocked);
  const { courses, batches, syllabi, refresh: refreshCoursesAndBatches } = useCoursesAndBatches(supabase, isUnlocked);
  const { physicalCourses, physicalLeads, refresh: refreshPhysical } = usePhysical(supabase, isUnlocked);
  const { certificates, refresh: refreshCertificates } = useCertificates(supabase, isUnlocked);

  const openChat = (userId: string) => {
    if (!userId) return;
    setActiveUser(userId);
    setChatOpen(true);
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginUser === "Nischal" && loginPass === "Xolox900") {
      setIsLocked(false);
      setLoginError("");
      localStorage.setItem('admin_unlocked', 'true');
    } else {
      setLoginError("Invalid username or password");
    }
  };

  const handleLogout = () => {
    setIsLocked(true);
    setLoginPass("");
    setLoginUser("");
    localStorage.removeItem('admin_unlocked');
  };

  if (loadingAuth) return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#14161F] text-[#B8862E]">
      <Loader2 className="animate-spin" size={40} />
    </div>
  );

  if (isLocked) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#14161F] px-4 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{ backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 27px, #B8862E 28px)" }} />
        <div className="bg-[#F6F3EC] p-6 sm:p-10 rounded-2xl shadow-2xl max-w-sm w-[95%] sm:w-full relative border border-[#E6E0D2]">
          <div className="absolute -top-9 left-1/2 -translate-x-1/2 h-16 w-16 bg-[#B8862E] rounded-full flex items-center justify-center border-4 border-[#14161F] shadow-xl">
            <Lock className="text-white" size={26} />
          </div>
          <p className="text-center text-[10px] font-bold uppercase tracking-[0.3em] text-[#B8862E] mt-8">Registrar Access</p>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-center text-[#14161F] mt-1 mb-8">Ledger Locked</h2>
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-[#857D6E] uppercase tracking-widest mb-2">Username</label>
              <input type="text" value={loginUser} onChange={(e) => setLoginUser(e.target.value)} className="w-full bg-white p-3.5 rounded-lg outline-none border border-[#E6E0D2] focus:border-[#B8862E] font-bold text-[#14161F] transition-colors" placeholder="Username" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-[#857D6E] uppercase tracking-widest mb-2">Password</label>
              <input type="password" value={loginPass} onChange={(e) => setLoginPass(e.target.value)} className="w-full bg-white p-3.5 rounded-lg outline-none border border-[#E6E0D2] focus:border-[#B8862E] font-bold text-[#14161F] transition-colors" placeholder="Password" />
            </div>
            {loginError && <p className="text-[#B23B3B] text-xs font-bold text-center mt-2">{loginError}</p>}
            <button type="submit" className="w-full bg-[#14161F] hover:bg-[#22242F] text-white font-bold py-3.5 rounded-lg shadow-lg transition-all mt-4 tracking-wide">Unlock Dashboard</button>
          </form>
        </div>
      </div>
    );
  }

  const navItems = [
    { key: "Accounts", label: "ERP & Accounts", icon: <Wallet size={18} /> },
    { key: "Dashboard", label: "Inbox", icon: <LayoutDashboard size={18} /> },
    { key: "Orders", label: "Orders", icon: <ShoppingCart size={18} /> },
    { key: "Batch Management", label: "Batch Management", icon: <Layers size={18} /> },
    { key: "Bookings", label: "Bookings & Leads", icon: <CalendarDays size={18} /> },
    { key: "Certificates", label: "Certificates", icon: <Award size={18} /> },
  ];

  return (
    <div className="fixed inset-0 z-[9999] bg-[#F6F3EC] text-[#14161F] font-sans flex flex-col md:flex-row overflow-hidden">
      
      {/* Mobile Top Header */}
      <div className="md:hidden flex items-center justify-between bg-[#14161F] text-white p-4 shrink-0 shadow-md relative z-40">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded bg-[#B8862E] flex items-center justify-center text-[#14161F] font-serif font-bold">GH</div>
          <span className="font-serif font-bold">The Registrar</span>
        </div>
        <button onClick={() => setIsSidebarOpen(true)} className="text-[#B4AF9F] p-2 -mr-2">
          <Menu size={24} />
        </button>
      </div>

      {/* Sidebar Overlay (Mobile) */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm" 
            onClick={() => setIsSidebarOpen(false)} 
          />
        )}
      </AnimatePresence>

      <aside className={`fixed md:relative z-50 transform transition-transform duration-300 w-72 bg-[#14161F] text-[#B4AF9F] flex flex-col h-full overflow-y-auto no-scrollbar border-r border-black/30 shrink-0 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}>
        <div className="p-8 flex items-center justify-between gap-4 md:justify-start">
          <div className="flex items-center gap-4">
            <div className="h-11 w-11 rounded-lg bg-[#B8862E] flex items-center justify-center text-[#14161F] font-serif font-bold text-lg shadow-lg">GH</div>
            <div>
              <p className="text-lg font-serif font-bold text-white tracking-tight leading-tight">The Registrar</p>
              <p className="text-[10px] uppercase font-bold tracking-[0.25em] text-[#B8862E]">Admin Ledger</p>
            </div>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-[#B4AF9F] hover:text-white"><X size={24}/></button>
        </div>
        <nav className="flex-1 px-4 space-y-1 mt-4 pb-10">
          {navItems.map(item => (
            <SidebarBtn key={item.key} icon={item.icon} label={item.label} active={activeTab === item.key} onClick={() => setActiveTab(item.key)} />
          ))}
        </nav>
        <div className="p-4 border-t border-white/10 shrink-0">
          <SidebarBtn icon={<LogOut size={18} />} label="Lock Screen" color="text-[#C97B6B] hover:bg-[#B23B3B]/10" onClick={handleLogout} />
        </div>
      </aside>

      <main className="flex-1 p-4 md:p-6 lg:p-10 h-full relative overflow-y-auto overflow-x-hidden">
        <AnimatePresence mode="wait">
          {activeTab === "Dashboard" && <DashboardView key="dash" conversations={conversations} loading={loadingConversations} onOpenChat={openChat} />}
          {activeTab === "Orders" && <OrdersManager key="ord" data={orders} refresh={refreshOrdersAndEnr} onOpenChat={openChat} />}
          {activeTab === "Accounts" && <AccountsManager key="accounts" supabase={supabase} />}
          {activeTab === "Batch Management" && <BatchManager key="batch" data={courses} batches={batches} physicalCourses={physicalCourses} refresh={() => { refreshCoursesAndBatches(); refreshPhysical(); }} />}
          {activeTab === "Bookings" && <BookingsManager key="book" courses={courses} enrollments={enrollments} batches={batches} syllabi={syllabi} physicalLeads={physicalLeads} physicalCourses={physicalCourses} orders={orders} refresh={() => { refreshOrdersAndEnr(); refreshPhysical(); refreshCoursesAndBatches(); }} onOpenChat={openChat} />}
          {activeTab === "Certificates" && <CertificatesManager key="cert" data={certificates} syllabi={syllabi} refresh={refreshCertificates} onOpenChat={openChat} />}
        </AnimatePresence>

        <AnimatePresence>
          {chatOpen && activeUser && (
            <ChatModal
              userId={activeUser}
              onClose={() => setChatOpen(false)}
              profilesMap={conversations.find(c => c.user_id === activeUser)?.profiles}
            />
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}


/* ============================================================================
   DASHBOARD (INBOX)
============================================================================ */
function DashboardView({ conversations, loading, onOpenChat }: any) {
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const unreadCount = conversations.filter((c: any) => !c.is_read).length;
  const filteredData = conversations.filter((c: any) => {
    const isUnread = !c.is_read;
    const matchesFilter = filter === 'unread' ? isUnread : true;
    const searchLower = searchQuery.toLowerCase();
    const nameMatch = c.profiles?.full_name?.toLowerCase().includes(searchLower) || "unknown user".includes(searchLower);
    const contentMatch = c.content?.toLowerCase().includes(searchLower);
    return matchesFilter && (!searchQuery || nameMatch || contentMatch);
  });

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6 w-full max-w-full">
      <SectionHeader eyebrow="Correspondence" title="Inbox" subtitle="Every conversation with a user, in one line."
        action={
          <div className="flex bg-white p-1 rounded-lg border border-[#E6E0D2] w-full sm:w-auto">
            <button onClick={() => setFilter('all')} className={`flex-1 sm:flex-none px-4 py-2 rounded-md text-sm font-bold transition-all ${filter === 'all' ? 'bg-[#14161F] text-white' : 'text-[#857D6E] hover:text-[#14161F]'}`}>All</button>
            <button onClick={() => setFilter('unread')} className={`flex-1 sm:flex-none justify-center px-4 py-2 rounded-md text-sm font-bold transition-all flex items-center gap-1.5 ${filter === 'unread' ? 'bg-[#14161F] text-white' : 'text-[#857D6E] hover:text-[#14161F]'}`}>
              Unread {unreadCount > 0 && <span className="bg-[#B23B3B] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{unreadCount}</span>}
            </button>
          </div>
        } />
      <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Search by name or message content..." />
      <div className="bg-white rounded-2xl shadow-sm border border-[#E6E0D2] overflow-hidden min-h-[400px]">
        {loading ? (
          <div className="flex items-center justify-center h-[400px] text-[#B4AF9F]"><Loader2 className="animate-spin" size={30} /></div>
        ) : filteredData.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[400px] text-[#B4AF9F] p-4 text-center">
            <MessageSquare size={44} className="mb-4 opacity-40" />
            <p className="text-base font-bold">No {filter === 'unread' ? 'unread ' : ''}conversations found</p>
          </div>
        ) : (
          <div className="divide-y divide-[#EFEBE1]">
            {filteredData.map((msg: any) => {
              const isUnread = !msg.is_read;
              const name = msg.profiles?.full_name || "Unknown User";
              return (
                <div key={msg.id} onClick={() => onOpenChat(msg.user_id)} className="group flex items-center gap-3 sm:gap-4 p-4 sm:p-5 hover:bg-[#FAF8F3] cursor-pointer transition-colors relative">
                  {isUnread && <div className="absolute left-2 sm:left-3 w-2 h-2 bg-[#B23B3B] rounded-full"></div>}
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#EFEBE1] flex items-center justify-center font-bold text-[#857D6E] ml-2 sm:ml-2 overflow-hidden shrink-0">
                    {msg.profiles?.avatar_url ? <img src={msg.profiles.avatar_url} className="w-full h-full object-cover" alt="" /> : name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-1">
                      <h4 className={`text-sm font-bold truncate pr-2 ${isUnread ? 'text-[#14161F]' : 'text-[#4A4638]'}`}>{name}</h4>
                      <span className="text-[10px] sm:text-xs font-bold text-[#B4AF9F] whitespace-nowrap shrink-0">{timeAgo(msg.created_at)}</span>
                    </div>
                    <p className={`text-xs sm:text-sm truncate ${isUnread ? 'text-[#14161F] font-bold' : 'text-[#857D6E] font-medium'}`}>
                      {msg.sender_role === 'admin' && <span className="mr-1 text-[#0E7C7B] font-bold">You:</span>}{msg.content}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
}

/* ============================================================================
   ORDERS
============================================================================ */
type RangeKey = 'today' | '7d' | '30d' | 'all' | 'custom';

function OrderInsights({ data }: { data: Order[] }) {
  const [rangeKey, setRangeKey] = useState<RangeKey>('today');
  const [customFrom, setCustomFrom] = useState(isoDateOnly(new Date()));
  const [customTo, setCustomTo] = useState(isoDateOnly(new Date()));

  const { from, to } = useMemo(() => {
    const now = new Date();
    if (rangeKey === 'today') {
      const start = new Date(now); start.setHours(0, 0, 0, 0);
      const end = new Date(now); end.setHours(23, 59, 59, 999);
      return { from: start, to: end };
    }
    if (rangeKey === '7d') {
      const start = new Date(now); start.setDate(start.getDate() - 6); start.setHours(0, 0, 0, 0);
      return { from: start, to: now };
    }
    if (rangeKey === '30d') {
      const start = new Date(now); start.setDate(start.getDate() - 29); start.setHours(0, 0, 0, 0);
      return { from: start, to: now };
    }
    if (rangeKey === 'custom') {
      const start = new Date(customFrom + 'T00:00:00');
      const end = new Date(customTo + 'T23:59:59');
      return { from: start, to: end };
    }
    return { from: new Date(0), to: now };
  }, [rangeKey, customFrom, customTo]);

  const inRange = useMemo(() => data.filter(o => {
    const d = new Date(o.updated_at || o.created_at);
    return d >= from && d <= to;
  }), [data, from, to]);

  const verified = inRange.filter(o => o.status === 'verified');
  const totalVerifiedAmount = verified.reduce((s, o) => s + (o.paid_amount || 0), 0);
  const totalPendingAmount = inRange.reduce((s, o) => s + (o.pending_amount || 0), 0);

  const byType: Record<string, { verifiedAmount: number; count: number }> = {};
  verified.forEach(o => {
    const key = o.order_type || 'Other';
    if (!byType[key]) byType[key] = { verifiedAmount: 0, count: 0 };
    byType[key].verifiedAmount += (o.paid_amount || 0);
    byType[key].count += 1;
  });

  const rangeOptions: { key: RangeKey; label: string }[] = [
    { key: 'today', label: 'Today' },
    { key: '7d', label: '7 Days' },
    { key: '30d', label: '30 Days' },
    { key: 'all', label: 'All Time' },
    { key: 'custom', label: 'Custom' },
  ];

  return (
    <div className="bg-white rounded-2xl border border-[#E6E0D2] shadow-sm p-4 md:p-5 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <p className="text-xs font-bold uppercase tracking-widest text-[#857D6E] flex items-center gap-2"><TrendingUp size={14} className="text-[#B8862E]" /> Revenue Insights</p>
        <div className="flex flex-wrap gap-1 bg-[#FAF8F3] p-1 rounded-lg border border-[#E6E0D2]">
          {rangeOptions.map(r => (
            <button key={r.key} onClick={() => setRangeKey(r.key)} className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex-1 sm:flex-none ${rangeKey === r.key ? 'bg-[#14161F] text-white' : 'text-[#857D6E] hover:text-[#14161F]'}`}>{r.label}</button>
          ))}
        </div>
      </div>

      {rangeKey === 'custom' && (
        <div className="flex flex-wrap items-center gap-3 w-full">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <CalendarRange size={14} className="text-[#B4AF9F] hidden sm:block" />
            <label className="text-[10px] font-bold uppercase text-[#857D6E] w-8">From</label>
            <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)} className="flex-1 sm:w-auto bg-[#FAF8F3] border border-[#E6E0D2] rounded-lg px-3 py-2 text-xs font-bold text-[#14161F] outline-none focus:border-[#B8862E]" />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <label className="text-[10px] font-bold uppercase text-[#857D6E] w-8 sm:ml-2">To</label>
            <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)} className="flex-1 sm:w-auto bg-[#FAF8F3] border border-[#E6E0D2] rounded-lg px-3 py-2 text-xs font-bold text-[#14161F] outline-none focus:border-[#B8862E]" />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-[#DCEEE6] border border-[#C3E3D5] rounded-xl p-4">
          <p className="text-[10px] font-bold uppercase text-[#1E8F6F]/80 mb-1">Verified Amount</p>
          <p className="text-xl md:text-2xl font-black text-[#1E8F6F] truncate">Rs. {totalVerifiedAmount.toLocaleString()}</p>
          <p className="text-[10px] font-bold text-[#1E8F6F]/70 mt-1">{verified.length} verified order(s)</p>
        </div>
        <div className="bg-[#F5E7C8] border border-[#E9D6A2] rounded-xl p-4">
          <p className="text-[10px] font-bold uppercase text-[#8A6416]/80 mb-1">Pending Review</p>
          <p className="text-xl md:text-2xl font-black text-[#8A6416] truncate">Rs. {totalPendingAmount.toLocaleString()}</p>
          <p className="text-[10px] font-bold text-[#8A6416]/70 mt-1">{inRange.filter(o => o.pending_amount > 0).length} order(s) awaiting review</p>
        </div>
        <div className="bg-[#FAF8F3] border border-[#E6E0D2] rounded-xl p-4">
          <p className="text-[10px] font-bold uppercase text-[#857D6E] mb-1">Orders Touched</p>
          <p className="text-xl md:text-2xl font-black text-[#14161F]">{inRange.length}</p>
          <p className="text-[10px] font-bold text-[#857D6E] mt-1">in selected range</p>
        </div>
      </div>

      <div>
        <p className="text-[10px] font-bold uppercase text-[#857D6E] mb-2 flex items-center gap-1.5"><PieChart size={12} /> Verified Amount by Order Type</p>
        {Object.keys(byType).length === 0 ? (
          <p className="text-xs text-[#B4AF9F] font-bold italic">No verified orders in this range.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {Object.entries(byType).map(([type, v]) => (
              <div key={type} className="bg-[#0E7C7B]/10 border border-[#0E7C7B]/20 rounded-lg px-3 py-2 flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase text-[#0E7C7B]">{type}</span>
                <span className="text-sm font-black text-[#0E7C7B]">Rs. {v.verifiedAmount.toLocaleString()}</span>
                <span className="text-[10px] font-bold text-[#0E7C7B]/70">({v.count})</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function OrdersManager({ data, refresh, onOpenChat }: { data: Order[], refresh: () => void, onOpenChat: (id: string) => void }) {
  const supabase = useSupabase();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'verified' | 'rejected'>('all');
  const [orderTypeFilter, setOrderTypeFilter] = useState<'all' | 'recording' | 'Online Course' | 'physical' | 'others'>('all');
  const [showAllOrders, setShowAllOrders] = useState(true);

  const filteredData = data.filter((o: Order) => {
    if (o.paid_amount === 0 && o.pending_amount === 0) return false;
    const s = searchQuery.toLowerCase();
    const matchesSearch = (o.full_name && o.full_name.toLowerCase().includes(s)) || (o.email && o.email.toLowerCase().includes(s)) || (o.order_name && o.order_name.toLowerCase().includes(s));
    const matchesStatus = statusFilter === 'all' ? true :
      (statusFilter === 'pending' && (o.status === 'pending' || o.pending_amount > 0)) ? true :
      (statusFilter === 'verified' && o.status === 'verified' && o.pending_amount === 0) ? true : o.status === statusFilter;
    let matchesType = true;
    if (orderTypeFilter !== 'all') {
      const lowerType = o.order_type?.toLowerCase() || '';
      if (orderTypeFilter === 'recording') matchesType = lowerType.includes('recording');
      else if (orderTypeFilter === 'Online Course') matchesType = lowerType.includes('online') || (lowerType.includes('course') && !lowerType.includes('physical'));
      else if (orderTypeFilter === 'physical') matchesType = lowerType.includes('physical');
      else if (orderTypeFilter === 'others') matchesType = !lowerType.includes('recording') && !lowerType.includes('course') && !lowerType.includes('physical');
    }
    let matchesDate = true;
    if (!showAllOrders) {
      const threeDaysAgo = new Date(); threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      matchesDate = new Date(o.updated_at || o.created_at) >= threeDaysAgo;
    }
    return matchesSearch && matchesStatus && matchesType && matchesDate;
  });

  const confirmRelatedEntities = async (enrollmentId: string) => {
    await supabase.from('enrollments_v2').update({ is_confirmed: true }).eq('id', enrollmentId);
    await supabase.from('physical_leads').update({ is_confirmed: true } as any).eq('id', enrollmentId);
  };

  const handleStatusChange = async (orderId: string, newStatus: string, enrollmentId?: string) => {
    const { error } = await supabase.from('orders_v2').update({ status: newStatus, updated_at: new Date().toISOString() }).eq('id', orderId);
    if (!error && newStatus === 'verified' && enrollmentId) {
      await confirmRelatedEntities(enrollmentId);
    }
    if (error) alert("Status update failed: " + error.message); else refresh();
  };

  const handleVerifyPayment = async (order: Order) => {
    if (order.pending_amount <= 0) return;
    if (!confirm(`Verify Rs. ${order.pending_amount} for ${order.full_name}?`)) return;

    const newPaid = order.paid_amount + order.pending_amount;

    const { error: orderError } = await supabase
      .from('orders_v2')
      .update({ 
        paid_amount: newPaid, 
        pending_amount: 0, 
        status: 'verified', 
        updated_at: new Date().toISOString() 
      })
      .eq('id', order.id);

    if (orderError) {
      alert("Verification failed: " + orderError.message);
      return;
    }

    if (order.enrollment_id) {
      if (order.order_type === "Online Course") {
        await supabase
          .from("enrollments_v2")
          .update({ is_confirmed: true })
          .eq("id", order.enrollment_id);
      } 
      else if (order.order_type === "Physical Class") {
        await supabase
          .from("physical_leads")
          .update({
            is_confirmed: true,
            status: "deposit_paid",
          })
          .eq("id", order.enrollment_id);
      }
    }

    refresh();
    setSelectedOrder(null);
  };

  const handleRejectPayment = async (order: Order) => {
    if (order.pending_amount <= 0) return;
    if (!confirm(`Reject pending payment of Rs. ${order.pending_amount} for ${order.full_name}?`)) return;
    const newStatus = order.paid_amount > 0 ? 'verified' : 'rejected';
    const { error } = await supabase.from('orders_v2').update({ pending_amount: 0, status: newStatus, updated_at: new Date().toISOString() }).eq('id', order.id);
    if (error) alert("Rejection failed: " + error.message); else { refresh(); setSelectedOrder(null); }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Remove this order from the ledger? (It will be archived, not permanently erased.)")) {
      const { error } = await supabase.from('orders_v2').update({ deleted: true, updated_at: new Date().toISOString() }).eq('id', id);
      if (error) alert("Archive failed: " + error.message); else refresh();
    }
  };

  const statusColors: any = { pending: 'bg-[#F5E7C8] text-[#8A6416] border-[#E9D6A2]', verified: 'bg-[#DCEEE6] text-[#1E8F6F] border-[#C3E3D5]', rejected: 'bg-[#F3DAD6] text-[#B23B3B] border-[#EAC2BC]' };

  const getImageUrl = (path: string) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    const { data } = supabase.storage.from('others').getPublicUrl(path);
    return data.publicUrl;
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 w-full">
      <SectionHeader eyebrow="Finance" title="Orders & Invoices" subtitle="Verify payments and reconcile accounts." />

      <OrderInsights data={data} />

      <div className="flex flex-col sm:flex-row flex-wrap gap-3 items-start sm:items-center w-full">
        <div className="w-full sm:flex-1 sm:min-w-[250px]"><SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Search by name, email, or order name..." /></div>
        <select className="w-full sm:w-auto bg-white border border-[#E6E0D2] rounded-xl px-4 py-3 text-sm font-bold text-[#14161F] outline-none shadow-sm cursor-pointer" value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)}>
          <option value="all">All Status</option><option value="pending">Needs Review (Pending)</option><option value="verified">Verified Only</option><option value="rejected">Rejected Only</option>
        </select>
        <select className="w-full sm:w-auto bg-white border border-[#E6E0D2] rounded-xl px-4 py-3 text-sm font-bold text-[#14161F] outline-none shadow-sm cursor-pointer" value={orderTypeFilter} onChange={e => setOrderTypeFilter(e.target.value as any)}>
          <option value="all">All Types</option><option value="recording">Recording</option><option value="Online Course">Online Course</option><option value="physical">Physical Class</option><option value="others">Others</option>
        </select>
        <label className="w-full sm:w-auto flex items-center gap-2 cursor-pointer text-sm font-bold text-[#4A4638] bg-white border border-[#E6E0D2] px-4 py-3 rounded-xl shadow-sm whitespace-nowrap">
          <input type="checkbox" checked={showAllOrders} onChange={(e) => setShowAllOrders(e.target.checked)} className="w-4 h-4 rounded accent-[#B8862E] cursor-pointer shrink-0" />
          Show All Time
        </label>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-[#E6E0D2] overflow-x-auto w-full">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="bg-[#FAF8F3] border-b border-[#E6E0D2] text-[10px] font-bold text-[#857D6E] uppercase tracking-widest">
              <th className="p-4 md:p-5">Last Updated</th>
              <th className="p-4 md:p-5">Customer</th>
              <th className="p-4 md:p-5">Order Info</th>
              <th className="p-4 md:p-5">Approval</th>
              <th className="p-4 md:p-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map(order => {
              const remainingAmount = Math.max(0, order.locked_price - order.paid_amount - order.pending_amount);
              return (
                <tr key={order.id} className="border-b border-[#EFEBE1] hover:bg-[#FAF8F3] cursor-pointer" onClick={() => setSelectedOrder(order)}>
                  <td className="p-4 md:p-5 text-xs md:text-sm text-[#857D6E] font-bold whitespace-nowrap align-top">
                    {new Date(order.updated_at || order.created_at).toLocaleDateString()}
                    <p className="text-[9px] md:text-[10px] font-bold text-[#B4AF9F] mt-0.5">{timeAgo(order.updated_at || order.created_at)}</p>
                  </td>
                  <td className="p-4 md:p-5 align-top">
                    <p className="font-bold text-sm text-[#14161F] cursor-pointer hover:text-[#0E7C7B] hover:underline break-words max-w-[150px]" onClick={(e) => { e.stopPropagation(); order.user_id ? onOpenChat(order.user_id) : alert('No linked user account found for this order.'); }}>{order.full_name}</p>
                    <p className="text-[10px] md:text-xs font-bold text-[#857D6E] mt-1">{order.contact_number}</p>
                    <p className="text-[10px] md:text-xs font-bold text-[#857D6E] truncate max-w-[150px]">{order.email}</p>
                  </td>
                  <td className="p-4 md:p-5 align-top">
                    <p className="font-bold text-[#4A4638] flex items-center gap-2 flex-wrap mb-2">
                      <span className="uppercase text-[9px] md:text-[10px] font-bold tracking-widest bg-[#EFEBE1] px-2 py-1 rounded text-[#857D6E] whitespace-nowrap">{order.order_type}</span>
                    </p>
                    <div className="mt-2 mb-2">
                      {order.pending_amount > 0 && (
                        <div className="mb-2 bg-[#F5E7C8] text-[#8A6416] px-3 py-1.5 rounded-lg border border-[#E9D6A2] text-[9px] md:text-[10px] font-bold uppercase inline-flex items-center gap-1">
                          <AlertCircle size={13} /> Pending: Rs. {order.pending_amount}
                        </div>
                      )}
                      <details className="group [&_summary::-webkit-details-marker]:hidden" onClick={(e) => e.stopPropagation()}>
                        <summary className="flex items-center gap-1 cursor-pointer text-[9px] md:text-[10px] font-bold uppercase text-[#0E7C7B] bg-[#0E7C7B]/10 px-3 py-1.5 rounded-lg w-fit hover:bg-[#0E7C7B]/20 transition-colors border border-[#0E7C7B]/20">
                          Financial Details <ChevronDown size={13} className="group-open:rotate-180 transition-transform" />
                        </summary>
                        <div className="flex flex-col gap-1.5 mt-2 bg-[#FAF8F3] p-3 rounded-xl border border-[#E6E0D2] min-w-[200px]">
                          <div className="flex justify-between items-center text-xs"><span className="font-bold text-[#857D6E]">Paid:</span><span className="font-bold text-[#1E8F6F]">Rs.{order.paid_amount} <span className="text-[#B4AF9F] font-bold text-[10px]">/ Rs.{order.locked_price}</span></span></div>
                          <div className="flex justify-between items-center text-xs"><span className="font-bold text-[#857D6E]">Pending:</span><span className="font-bold text-[#C08A28]">Rs.{order.pending_amount} <span className="text-[#D8C58F] font-bold text-[10px]">/ Rs.{order.locked_price}</span></span></div>
                          <div className="flex justify-between items-center text-xs border-t border-[#E6E0D2] pt-1.5 mt-0.5"><span className="font-bold text-[#857D6E]">Remaining:</span><span className="font-bold text-[#B23B3B]">Rs.{remainingAmount} <span className="text-[#D9A9A2] font-bold text-[10px]">/ Rs.{order.locked_price}</span></span></div>
                        </div>
                      </details>
                    </div>
                    <p className="text-[10px] md:text-xs font-bold text-[#857D6E] truncate max-w-[200px]" title={order.order_name}>Target: {order.order_name}</p>
                  </td>
                  <td className="p-4 md:p-5 align-top" onClick={(e) => e.stopPropagation()}>
                    <div className="flex flex-col gap-2 md:gap-3 w-[120px]">
                      <div className="relative w-full">
                        <select value={order.status} onChange={(e) => handleStatusChange(order.id, e.target.value, order.enrollment_id)} className={`appearance-none w-full px-3 py-2 rounded-lg text-[10px] md:text-xs font-bold uppercase tracking-wider outline-none cursor-pointer border shadow-sm transition-all hover:opacity-80 ${statusColors[order.status] || 'bg-[#EFEBE1] text-[#4A4638] border-[#E6E0D2]'}`}>
                          <option value="pending">PENDING</option><option value="verified">VERIFIED</option><option value="rejected">REJECTED</option>
                        </select>
                        <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-50" />
                      </div>
                      {order.pending_amount > 0 && (
                        <div className="flex flex-col gap-1 mt-1 border-t border-[#E6E0D2] pt-2">
                          <button onClick={() => handleVerifyPayment(order)} className="px-2 py-1.5 bg-[#1E8F6F] text-white text-[9px] md:text-[10px] font-bold rounded shadow-sm hover:opacity-90 flex items-center justify-center gap-1"><CheckSquare size={12} /> Verify</button>
                          <button onClick={() => handleRejectPayment(order)} className="px-2 py-1.5 bg-[#F3DAD6] text-[#B23B3B] text-[9px] md:text-[10px] font-bold rounded shadow-sm hover:opacity-90">Reject</button>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="p-4 md:p-5 text-right align-top" onClick={(e) => e.stopPropagation()}>
                    <div className="flex flex-col md:flex-row justify-end items-end md:items-center gap-2 mt-1">
                      <span className="text-xs md:text-sm font-bold text-[#0E7C7B] hover:opacity-80 whitespace-nowrap cursor-pointer" onClick={(e) => { e.stopPropagation(); setSelectedOrder(order); }}>Details</span>
                      <button onClick={() => handleDelete(order.id)} className="p-1.5 md:p-2 text-[#B23B3B] bg-[#F3DAD6] rounded-lg hover:opacity-80 transition-colors" title="Archive Order"><Archive size={14} /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filteredData.length === 0 && <tr><td colSpan={5} className="p-6 text-center font-bold text-[#857D6E]">No orders found.</td></tr>}
          </tbody>
        </table>
      </div>

      {selectedOrder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#14161F]/60 p-4 backdrop-blur-sm" onClick={() => setSelectedOrder(null)}>
          <div className="bg-white rounded-2xl shadow-2xl p-5 md:p-8 max-w-[95vw] md:max-w-2xl w-full relative overflow-y-auto max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <button onClick={() => setSelectedOrder(null)} className="absolute top-4 right-4 md:top-6 md:right-6 text-[#B4AF9F] hover:text-[#14161F]"><X /></button>
            <h3 className="text-xl md:text-2xl font-serif font-bold mb-4 md:mb-6 flex flex-wrap items-center gap-2">Order Details <span className={`text-[9px] md:text-[10px] uppercase tracking-widest px-2 py-1 rounded-full border font-sans font-bold ${statusColors[selectedOrder.status] || 'bg-[#EFEBE1] text-[#4A4638]'}`}>{selectedOrder.status}</span></h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-6 text-xs md:text-sm font-medium text-[#4A4638]">
              <div className="bg-[#FAF8F3] p-4 rounded-xl border border-[#E6E0D2] flex flex-col justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase text-[#B4AF9F] mb-2">Customer Info</p>
                  <p className="break-words"><span className="font-bold text-[#14161F]">Name:</span> <span className="cursor-pointer font-bold hover:text-[#0E7C7B] hover:underline" onClick={() => selectedOrder.user_id ? onOpenChat(selectedOrder.user_id) : alert('No linked user account.')}>{selectedOrder.full_name}</span></p>
                  <p className="break-all font-bold"><span className="font-bold text-[#14161F]">Email:</span> {selectedOrder.email}</p>
                  <p className="font-bold"><span className="font-bold text-[#14161F]">Phone:</span> {selectedOrder.contact_number}</p>
                </div>
                <a href={`https://wa.me/${(selectedOrder.contact_number || '').replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="mt-4 flex items-center justify-center gap-2 bg-[#25D366] hover:opacity-90 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition-colors w-full">
                  <MessageCircle size={16} /> Contact on WhatsApp
                </a>
              </div>
              <div className="bg-[#FAF8F3] p-4 rounded-xl border border-[#E6E0D2] space-y-2 relative font-bold">
                {selectedOrder.pending_amount > 0 && <div className="absolute -top-2 -right-2 bg-[#C08A28] text-white rounded-full p-1.5 shadow-lg"><AlertCircle size={14} /></div>}
                <p className="text-[10px] font-bold uppercase text-[#B4AF9F] mb-2">Order Info</p>
                <p><span className="font-bold text-[#14161F]">Type:</span> <span className="uppercase">{selectedOrder.order_type}</span></p>
                <p className="break-words"><span className="font-bold text-[#14161F]">Order Name:</span> {selectedOrder.order_name}</p>
                <p><span className="font-bold text-[#14161F]">Verified Paid:</span> <span className="text-[#1E8F6F]">Rs. {selectedOrder.paid_amount}</span> / Rs. {selectedOrder.locked_price}</p>
                <p><span className="font-bold text-[#14161F]">Pending Review:</span> <span className="text-[#C08A28]">Rs. {selectedOrder.pending_amount}</span> / Rs. {selectedOrder.locked_price}</p>
                <p><span className="font-bold text-[#14161F]">Remaining Due:</span> <span className="text-[#B23B3B]">Rs. {Math.max(0, selectedOrder.locked_price - selectedOrder.paid_amount - selectedOrder.pending_amount)}</span></p>
                <p className="pt-2 border-t border-[#E6E0D2] mt-2"><span className="font-bold text-[#14161F]">Created:</span> {new Date(selectedOrder.created_at).toLocaleString()}</p>
                <p><span className="font-bold text-[#14161F]">Last Updated:</span> {new Date(selectedOrder.updated_at || selectedOrder.created_at).toLocaleString()}</p>
              </div>
            </div>
            {selectedOrder.pending_amount > 0 && (
              <div className="bg-[#F5E7C8] p-4 rounded-xl border border-[#E9D6A2] flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div><p className="text-[#8A6416] font-bold text-sm">Action Required</p><p className="text-[#8A6416]/80 text-xs font-bold mt-1 md:mt-0">Verify the screenshot below to approve Rs. {selectedOrder.pending_amount}.</p></div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => handleVerifyPayment(selectedOrder)} className="flex-1 md:flex-none px-4 py-2 bg-[#1E8F6F] text-white text-xs font-bold rounded-lg shadow hover:opacity-90 flex items-center justify-center gap-1"><CheckSquare size={14} /> Verify</button>
                  <button onClick={() => handleRejectPayment(selectedOrder)} className="flex-1 md:flex-none px-4 py-2 bg-[#F3DAD6] text-[#B23B3B] text-xs font-bold rounded-lg shadow hover:opacity-90 text-center">Reject</button>
                </div>
              </div>
            )}
            <div className="bg-[#FAF8F3] p-4 rounded-xl border border-[#E6E0D2] flex flex-col items-center">
              <p className="text-[10px] font-bold uppercase text-[#B4AF9F] mb-4 w-full text-center md:text-left">Payment Screenshots ({selectedOrder.payment_screenshots?.length || (selectedOrder.screenshot_url ? 1 : 0)})</p>
              {selectedOrder.payment_screenshots && selectedOrder.payment_screenshots.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                  {selectedOrder.payment_screenshots.map((path, idx) => (
                    <a key={idx} href={getImageUrl(path)} target="_blank" rel="noreferrer" className="block w-full relative group">
                      <div className="absolute top-2 left-2 bg-[#14161F]/70 text-white text-[10px] font-bold px-2 py-1 rounded-md z-10 backdrop-blur-md">Upload {idx + 1}</div>
                      <img src={getImageUrl(path)} alt={`Payment Receipt ${idx + 1}`} className="rounded-lg shadow-sm border border-[#E6E0D2] w-full h-40 md:h-48 object-cover cursor-zoom-in group-hover:opacity-90 transition-opacity" />
                    </a>
                  ))}
                </div>
              ) : selectedOrder.screenshot_url ? (
                <a href={getImageUrl(selectedOrder.screenshot_url)} target="_blank" rel="noreferrer" className="block max-w-full">
                  <img src={getImageUrl(selectedOrder.screenshot_url)} alt="Payment Receipt" className="rounded-lg shadow-sm border border-[#E6E0D2] max-h-64 md:max-h-96 object-contain cursor-zoom-in w-full" />
                </a>
              ) : <p className="text-[#B4AF9F] font-bold italic py-4">No screenshot provided.</p>}
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}

/* ============================================================================
   BATCH MANAGEMENT
============================================================================ */
function BatchManager({ data, batches, physicalCourses, refresh }: { data: OnlineCourse[], batches: CourseBatch[], physicalCourses: PhysicalCourse[], refresh: () => void }) {
  const [courseType, setCourseType] = useState<'online' | 'physical'>('online');

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 w-full">
      <SectionHeader
        eyebrow="Curriculum"
        title="Batch Management"
        subtitle="Configure course pricing, batches, and physical class offerings."
        action={
          <div className="flex flex-col sm:flex-row bg-white p-1 rounded-xl border border-[#E6E0D2] shadow-sm w-full md:w-auto">
            <button onClick={() => setCourseType('online')} className={`flex-1 justify-center px-4 md:px-5 py-2.5 rounded-lg text-xs md:text-sm font-bold transition-all flex items-center gap-2 ${courseType === 'online' ? 'bg-[#0E7C7B] text-white shadow' : 'text-[#857D6E] hover:text-[#14161F]'}`}>
              <Globe2 size={15} /> Online
            </button>
            <button onClick={() => setCourseType('physical')} className={`flex-1 justify-center px-4 md:px-5 py-2.5 rounded-lg text-xs md:text-sm font-bold transition-all flex items-center gap-2 ${courseType === 'physical' ? 'bg-[#B8543D] text-white shadow' : 'text-[#857D6E] hover:text-[#14161F]'}`}>
              <Building2 size={15} /> Physical
            </button>
          </div>
        }
      />
      {courseType === 'online' ? (
        <OnlineBatchManager data={data} batches={batches} refresh={refresh} />
      ) : (
        <PhysicalCoursesManager data={physicalCourses} refresh={refresh} />
      )}
    </motion.div>
  );
}

function OnlineBatchManager({ data, batches, refresh }: { data: OnlineCourse[], batches: CourseBatch[], refresh: () => void }) {
  const supabase = useSupabase();
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [courseModalOpen, setCourseModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Partial<OnlineCourse>>({});
  const [batchModalOpen, setBatchModalOpen] = useState(false);
  const [editingBatch, setEditingBatch] = useState<Partial<CourseBatch>>({});

  const openCourseEdit = (course: OnlineCourse) => { setEditingCourse({ ...course }); setCourseModalOpen(true); };

  const saveCourse = async () => {
    if (!editingCourse.id) return;
    const { error } = await supabase.from('online_courses_v2').update({
      name: editingCourse.title, fee: Number(editingCourse.fee), discount: Number(editingCourse.discount),
      active_batch_no: Number(editingCourse.active_batch_no), is_active: editingCourse.is_active
    }).eq('syllabus_id', editingCourse.id);
    if (error) { alert("Course Update Error: " + error.message); return; }
    setCourseModalOpen(false); refresh();
  };

  const toggleCourseStatus = async (course: OnlineCourse) => {
    const { error } = await supabase.from('online_courses_v2').update({ is_active: !course.is_active }).eq('syllabus_id', course.id);
    if (error) alert(error.message); else refresh();
  };

  const openBatchEdit = (batch: Partial<CourseBatch>, courseId: string, courseName: string) => {
    setEditingBatch({ ...batch, course_id: courseId, course_name: courseName, is_active: batch.is_active ?? true });
    setBatchModalOpen(true);
  };

  const saveBatch = async () => {
    if (!editingBatch.course_id || !editingBatch.batch_no) { alert("Syllabus ID and Batch No are required."); return; }
    const payload = {
      syllabus_id: editingBatch.course_id, course_name: editingBatch.course_name, batch_no: editingBatch.batch_no,
      start_datetime: editingBatch.start_datetime || null, timing: editingBatch.timing || null,
      online_class_link: editingBatch.online_class_link || null, google_classroom_link: editingBatch.google_classroom_link || null,
      whatsapp_group_link: editingBatch.whatsapp_group_link || null, is_active: editingBatch.is_active
    };
    if (editingBatch.id) {
      const { error } = await supabase.from('course_batches_v2').update(payload).eq('id', editingBatch.id);
      if (error) { alert("Batch Update Error: " + error.message); return; }
    } else {
      const { error } = await supabase.from('course_batches_v2').insert([payload]);
      if (error) { alert("Batch Create Error: " + error.message); return; }
    }
    setBatchModalOpen(false); refresh();
  };

  const toggleBatchStatus = async (batch: CourseBatch) => {
    const { error } = await supabase.from('course_batches_v2').update({ is_active: !batch.is_active }).eq('id', batch.id);
    if (error) alert(error.message); else refresh();
  };

  if (selectedCourseId) {
    const selectedCourse = data.find(c => c.id === selectedCourseId);
    if (!selectedCourse) return <p>Course not found</p>;
    const courseBatches = batches.filter(b => b.course_id === selectedCourseId).sort((a, b) => {
      const timeA = a.start_datetime ? new Date(a.start_datetime).getTime() : 0;
      const timeB = b.start_datetime ? new Date(b.start_datetime).getTime() : 0;
      return timeB - timeA;
    });

    return (
      <div className="space-y-6 w-full">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3 md:gap-4 w-full md:w-auto">
            <button onClick={() => setSelectedCourseId(null)} className="p-2 md:p-3 bg-white border border-[#E6E0D2] rounded-xl hover:bg-[#FAF8F3] transition-colors shadow-sm shrink-0"><ArrowLeft size={19} className="text-[#4A4638]" /></button>
            <div className="min-w-0">
              <p className="text-[9px] md:text-[10px] font-bold uppercase tracking-[0.3em] text-[#B8862E] mb-1">Batch Management</p>
              <h2 className="text-xl md:text-2xl font-serif font-bold text-[#14161F] truncate">{selectedCourse.title}</h2>
            </div>
          </div>
          <button onClick={() => openBatchEdit({ batch_no: (courseBatches[0]?.batch_no || 0) + 1 }, selectedCourse.id, selectedCourse.title)} className="w-full md:w-auto justify-center bg-[#14161F] text-white px-5 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg hover:bg-[#22242F] transition-all whitespace-nowrap">
            <Plus size={17} /> Create New Batch
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-[#E6E0D2] overflow-x-auto w-full">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-[#FAF8F3] border-b border-[#E6E0D2] text-[10px] font-bold text-[#857D6E] uppercase tracking-widest">
                <th className="p-4 w-20 md:w-24 text-center">No.</th><th className="p-4">Schedule</th><th className="p-4">Links</th><th className="p-4">Status</th><th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {courseBatches.map(batch => (
                <tr key={batch.id} className="border-b border-[#EFEBE1] hover:bg-[#FAF8F3]">
                  <td className="p-4 text-center"><span className="w-8 h-8 md:w-10 md:h-10 mx-auto bg-[#0E7C7B]/10 text-[#0E7C7B] rounded-lg md:rounded-xl flex items-center justify-center font-bold text-sm md:text-lg">{batch.batch_no}</span></td>
                  <td className="p-4">
                    <p className="font-bold text-[#14161F] flex items-center gap-1.5 text-xs md:text-sm"><Clock size={13} className="text-[#B4AF9F] shrink-0" /> {batch.start_datetime ? new Date(batch.start_datetime).toLocaleString() : 'No Start Date'}</p>
                    <p className="text-[11px] md:text-sm font-bold text-[#857D6E] mt-1 line-clamp-1">Timing: {batch.timing || 'TBD'}</p>
                  </td>
                  <td className="p-4 space-y-1.5">
                    {batch.online_class_link ? <a href={batch.online_class_link} target="_blank" className="text-xs md:text-sm font-bold text-[#0E7C7B] hover:underline flex items-center gap-1.5 truncate max-w-[150px]"><Monitor size={12} className="shrink-0" /> Class</a> : <p className="text-[10px] md:text-xs font-bold text-[#B4AF9F]">No Class Link</p>}
                    {batch.google_classroom_link ? <a href={batch.google_classroom_link} target="_blank" className="text-xs md:text-sm font-bold text-[#1E8F6F] hover:underline flex items-center gap-1.5 truncate max-w-[150px]"><GraduationCap size={12} className="shrink-0" /> Classroom</a> : <p className="text-[10px] md:text-xs font-bold text-[#B4AF9F]">No Classroom</p>}
                    {batch.whatsapp_group_link ? <a href={batch.whatsapp_group_link} target="_blank" className="text-xs md:text-sm font-bold text-[#25D366] hover:underline flex items-center gap-1.5 truncate max-w-[150px]"><MessageCircle size={12} className="shrink-0" /> WhatsApp</a> : <p className="text-[10px] md:text-xs font-bold text-[#B4AF9F]">No WhatsApp</p>}
                  </td>
                  <td className="p-4"><ToggleSwitch checked={batch.is_active} onChange={() => toggleBatchStatus(batch)} label={batch.is_active ? 'Active' : 'Archived'} /></td>
                  <td className="p-4 text-right"><button onClick={() => openBatchEdit(batch, selectedCourse.id, selectedCourse.title)} className="p-2 text-[#0E7C7B] bg-[#0E7C7B]/10 rounded-lg hover:bg-[#0E7C7B]/20" title="Edit Batch"><Edit2 size={15} /></button></td>
                </tr>
              ))}
              {courseBatches.length === 0 && <tr><td colSpan={5} className="p-8 text-center font-bold text-[#857D6E]">No batches created for this course yet.</td></tr>}
            </tbody>
          </table>
        </div>

        {batchModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#14161F]/60 p-4 backdrop-blur-sm" onClick={() => setBatchModalOpen(false)}>
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full relative overflow-hidden flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
              <button onClick={() => setBatchModalOpen(false)} className="absolute top-4 right-4 md:top-6 md:right-6 text-[#B4AF9F] hover:text-[#14161F] z-10"><X /></button>
              <div className="p-5 md:p-6 border-b border-[#E6E0D2] bg-[#FAF8F3] mt-2 md:mt-4">
                <h3 className="text-xl md:text-2xl font-serif font-bold text-[#14161F] pr-6">{editingBatch.id ? `Edit Batch ${editingBatch.batch_no}` : 'Create New Batch'}</h3>
                <p className="text-xs md:text-sm text-[#857D6E] font-bold mt-1 line-clamp-1">{selectedCourse.title}</p>
              </div>
              <div className="p-5 md:p-6 space-y-4 overflow-y-auto no-scrollbar">
                <div className="grid grid-cols-2 gap-3 md:gap-4">
                  <div><label className="block text-[10px] font-bold text-[#857D6E] uppercase mb-1 ml-1">Batch No.</label><input type="number" className="w-full bg-[#FAF8F3] p-3 rounded-xl outline-none border border-[#E6E0D2] focus:border-[#B8862E] font-bold text-[#14161F] text-sm" value={editingBatch.batch_no || ''} onChange={e => setEditingBatch({ ...editingBatch, batch_no: Number(e.target.value) })} /></div>
                  <div><label className="block text-[10px] font-bold text-[#857D6E] uppercase mb-1 ml-1">Status</label><div className="pt-2"><ToggleSwitch checked={!!editingBatch.is_active} onChange={() => setEditingBatch({ ...editingBatch, is_active: !editingBatch.is_active })} label={editingBatch.is_active ? 'Active' : 'Inactive'} /></div></div>
                </div>
                <div><label className="block text-[10px] font-bold text-[#857D6E] uppercase mb-1 ml-1">Start Date & Time</label><input type="datetime-local" className="w-full bg-[#FAF8F3] p-3 rounded-xl outline-none border border-[#E6E0D2] focus:border-[#B8862E] font-bold text-[#14161F] text-xs sm:text-sm" value={editingBatch.start_datetime ? new Date(new Date(editingBatch.start_datetime).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ''} onChange={e => setEditingBatch({ ...editingBatch, start_datetime: new Date(e.target.value).toISOString() })} /></div>
                <div><label className="block text-[10px] font-bold text-[#857D6E] uppercase mb-1 ml-1">Timing Description</label><input type="text" className="w-full bg-[#FAF8F3] p-3 rounded-xl outline-none border border-[#E6E0D2] focus:border-[#B8862E] font-bold text-[#14161F] text-sm" value={editingBatch.timing || ''} onChange={e => setEditingBatch({ ...editingBatch, timing: e.target.value })} placeholder='e.g., 8:00 PM to 9:30 PM' /></div>
                <hr className="border-[#E6E0D2] my-2" />
                <div><label className="block text-[10px] font-bold text-[#857D6E] uppercase mb-1 ml-1">Online Class Link</label><input type="text" className="w-full bg-[#FAF8F3] p-3 rounded-xl outline-none border border-[#E6E0D2] focus:border-[#B8862E] font-bold text-[#14161F] text-sm" value={editingBatch.online_class_link || ''} onChange={e => setEditingBatch({ ...editingBatch, online_class_link: e.target.value })} placeholder="https://meet.google.com/..." /></div>
                <div><label className="block text-[10px] font-bold text-[#857D6E] uppercase mb-1 ml-1">Google Classroom Link</label><input type="text" className="w-full bg-[#FAF8F3] p-3 rounded-xl outline-none border border-[#E6E0D2] focus:border-[#B8862E] font-bold text-[#14161F] text-sm" value={editingBatch.google_classroom_link || ''} onChange={e => setEditingBatch({ ...editingBatch, google_classroom_link: e.target.value })} placeholder="https://classroom.google.com/..." /></div>
                <div><label className="block text-[10px] font-bold text-[#857D6E] uppercase mb-1 ml-1">WhatsApp Group Link</label><input type="text" className="w-full bg-[#FAF8F3] p-3 rounded-xl outline-none border border-[#E6E0D2] focus:border-[#B8862E] font-bold text-[#14161F] text-sm" value={editingBatch.whatsapp_group_link || ''} onChange={e => setEditingBatch({ ...editingBatch, whatsapp_group_link: e.target.value })} placeholder="https://chat.whatsapp.com/..." /></div>
              </div>
              <div className="p-4 md:p-6 border-t border-[#E6E0D2] bg-[#FAF8F3] flex justify-end gap-3 shrink-0">
                <button onClick={() => setBatchModalOpen(false)} className="px-4 py-2 font-bold text-[#857D6E] hover:text-[#14161F] text-sm">Cancel</button>
                <button onClick={saveBatch} className="px-6 py-2 rounded-xl font-bold bg-[#14161F] text-white shadow-lg hover:bg-[#22242F] transition-colors text-sm">Save Batch</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full">
      <div className="bg-white rounded-2xl shadow-sm border border-[#E6E0D2] overflow-x-auto w-full">
        <table className="w-full text-left border-collapse min-w-[700px]">
          <thead>
            <tr className="bg-[#FAF8F3] border-b border-[#E6E0D2] text-[10px] font-bold text-[#857D6E] uppercase tracking-widest">
              <th className="p-4 md:p-5">Course</th>
              <th className="p-4 md:p-5">Pricing</th>
              <th className="p-4 md:p-5 text-center">Active Batch</th>
              <th className="p-4 md:p-5 text-center">Status</th>
              <th className="p-4 md:p-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.map(course => (
              <tr key={course.id} className="border-b border-[#EFEBE1] hover:bg-[#FAF8F3] cursor-pointer" onClick={() => openCourseEdit(course)}>
                <td className="p-4 md:p-5"><p className="font-bold text-[#14161F] text-sm md:text-base line-clamp-2">{course.title}</p><p className="text-[10px] md:text-xs text-[#B4AF9F] font-mono font-bold mt-1">ID: {course.id}</p></td>
                <td className="p-4 md:p-5 whitespace-nowrap"><p className="font-bold text-sm md:text-base text-[#4A4638]">Rs. {course.fee}</p>{course.discount > 0 ? <p className="text-[10px] md:text-xs text-[#1E8F6F] font-bold bg-[#DCEEE6] px-2 py-0.5 rounded inline-block mt-1">{course.discount}% Discount</p> : <p className="text-[10px] md:text-xs font-bold text-[#B4AF9F] mt-1">No Discount</p>}</td>
                <td className="p-4 md:p-5 text-center"><span className="inline-block bg-[#0E7C7B]/10 text-[#0E7C7B] font-bold px-3 py-1.5 rounded-xl border border-[#0E7C7B]/20 text-sm md:text-lg">{course.active_batch_no || '-'}</span></td>
                <td className="p-4 md:p-5 flex justify-center" onClick={e => e.stopPropagation()}><ToggleSwitch checked={course.is_active} onChange={() => toggleCourseStatus(course)} label={course.is_active ? 'Active' : 'Hidden'} /></td>
                <td className="p-4 md:p-5 text-right" onClick={e => e.stopPropagation()}>
                  <button onClick={(e) => { e.stopPropagation(); setSelectedCourseId(course.id); }} className="px-3 md:px-5 py-2 text-[10px] md:text-xs font-bold text-white bg-[#14161F] rounded-lg md:rounded-xl hover:bg-[#22242F] shadow-sm transition-colors flex items-center justify-center gap-1 whitespace-nowrap ml-auto"><Layers size={13} /> Batches</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {courseModalOpen && editingCourse && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#14161F]/60 p-4 backdrop-blur-sm" onClick={() => setCourseModalOpen(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full relative overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            <p className="font-mono text-[9px] md:text-[10px] font-bold text-[#B4AF9F] absolute top-4 left-4 md:left-6">ID: {editingCourse.id}</p>
            <button onClick={() => setCourseModalOpen(false)} className="absolute top-4 right-4 md:top-6 md:right-6 text-[#B4AF9F] hover:text-[#14161F] z-10"><X /></button>
            <div className="p-5 md:p-6 border-b border-[#E6E0D2] bg-[#FAF8F3] mt-6 md:mt-4"><h3 className="text-xl md:text-2xl font-serif font-bold text-[#14161F]">Edit Config</h3></div>
            <div className="p-5 md:p-6 space-y-4">
              <div><label className="block text-[10px] font-bold text-[#857D6E] uppercase mb-1 ml-1">Course Name</label><input type="text" className="w-full bg-[#FAF8F3] p-3 rounded-xl outline-none border border-[#E6E0D2] focus:border-[#B8862E] font-bold text-[#14161F] text-sm" value={editingCourse.title || ''} onChange={e => setEditingCourse({ ...editingCourse, title: e.target.value })} /></div>
              <div><label className="block text-[10px] font-bold text-[#857D6E] uppercase mb-1 ml-1">Fee (Rs)</label><input type="number" className="w-full bg-[#FAF8F3] p-3 rounded-xl outline-none border border-[#E6E0D2] focus:border-[#B8862E] font-bold text-[#14161F] text-sm" value={editingCourse.fee || ''} onChange={e => setEditingCourse({ ...editingCourse, fee: Number(e.target.value) })} /></div>
              <div><label className="block text-[10px] font-bold text-[#857D6E] uppercase mb-1 ml-1">Discount (%)</label><input type="number" className="w-full bg-[#FAF8F3] p-3 rounded-xl outline-none border border-[#E6E0D2] focus:border-[#B8862E] font-bold text-[#14161F] text-sm" value={editingCourse.discount || ''} onChange={e => setEditingCourse({ ...editingCourse, discount: Number(e.target.value) })} /></div>
              <div><label className="block text-[10px] font-bold text-[#857D6E] uppercase mb-1 ml-1">Active Batch No.</label><input type="number" className="w-full bg-[#FAF8F3] p-3 rounded-xl outline-none border border-[#E6E0D2] focus:border-[#B8862E] font-bold text-[#14161F] text-sm" value={editingCourse.active_batch_no || ''} onChange={e => setEditingCourse({ ...editingCourse, active_batch_no: Number(e.target.value) })} /></div>
            </div>
            <div className="p-4 md:p-6 border-t border-[#E6E0D2] bg-[#FAF8F3] flex justify-end gap-3 shrink-0">
              <button onClick={() => setCourseModalOpen(false)} className="px-4 py-2 font-bold text-[#857D6E] hover:text-[#14161F] text-sm">Cancel</button>
              <button onClick={saveCourse} className="px-6 py-2 rounded-xl font-bold bg-[#14161F] text-white shadow-lg hover:bg-[#22242F] transition-colors text-sm">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PhysicalCoursesManager({ data, refresh }: { data: PhysicalCourse[], refresh: () => void }) {
  const supabase = useSupabase();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<PhysicalCourse>>({});
  const [searchQuery, setSearchQuery] = useState("");

  const emptyForm: Partial<PhysicalCourse> = {
    title: '', course_code: '', category: 'Professional Training', instructor_name: '',
    location: 'Near Eyeplex Mall, New Baneshwor, Kathmandu', start_date: '', timing: '',
    duration_weeks: undefined, price: 0, discount_price: undefined, max_seats: 30,
    enrolled_count: 0, is_active: true, tutor_bio: '', batch_no: undefined,
    learning_outcomes: [], course_image_url: '', instructor_image_url: '',
  };

  const openCreate = () => { setEditing({ ...emptyForm }); setModalOpen(true); };
  const openEdit = (course: PhysicalCourse) => { setEditing({ ...course }); setModalOpen(true); };

  const save = async () => {
    if (!editing.title || !editing.category || editing.price === undefined) { alert("Title, category, and price are required."); return; }
    const payload = {
      title: editing.title,
      course_code: editing.course_code || null,
      course_image_url: editing.course_image_url || null,
      instructor_image_url: editing.instructor_image_url || null,
      category: editing.category,
      learning_outcomes: editing.learning_outcomes || [],
      instructor_name: editing.instructor_name || null,
      location: editing.location || 'Near Eyeplex Mall, New Baneshwor, Kathmandu',
      start_date: editing.start_date || null,
      timing: editing.timing || null,
      duration_weeks: editing.duration_weeks ? Number(editing.duration_weeks) : null,
      price: Number(editing.price),
      discount_price: editing.discount_price !== undefined && editing.discount_price !== null && (editing.discount_price as any) !== '' ? Number(editing.discount_price) : null,
      max_seats: editing.max_seats ? Number(editing.max_seats) : 30,
      enrolled_count: editing.enrolled_count ? Number(editing.enrolled_count) : 0,
      is_active: editing.is_active ?? true,
      tutor_bio: editing.tutor_bio || null,
      batch_no: editing.batch_no ? Number(editing.batch_no) : null,
      updated_at: new Date().toISOString(),
    };
    if (editing.id) {
      const { error } = await supabase.from('physicalcourses').update(payload).eq('id', editing.id);
      if (error) { alert("Update failed: " + error.message); return; }
    } else {
      const { error } = await supabase.from('physicalcourses').insert([payload]);
      if (error) { alert("Create failed: " + error.message); return; }
    }
    setModalOpen(false); refresh();
  };

  const toggleActive = async (course: PhysicalCourse) => {
    const { error } = await supabase.from('physicalcourses').update({ is_active: !course.is_active, updated_at: new Date().toISOString() }).eq('id', course.id);
    if (error) alert(error.message); else refresh();
  };

  const filtered = data.filter(c => {
    const s = searchQuery.toLowerCase();
    return c.title?.toLowerCase().includes(s) || (c.course_code || '').toLowerCase().includes(s) || c.category?.toLowerCase().includes(s);
  });

  const rawOutcomes = editing?.learning_outcomes as string | string[] | null | undefined;
  const outcomesArray = Array.isArray(rawOutcomes)
    ? rawOutcomes
    : typeof rawOutcomes === 'string'
      ? rawOutcomes
          .replace(/^\{|\}$/g, '')
          .split(',')
          .map(s => s.replace(/^"|"$/g, '').trim())
          .filter(Boolean)
      : [];

  const outcomesText = outcomesArray.join("\n");

  return (
    <div className="space-y-6 w-full">
      <div className="flex flex-col sm:flex-row gap-3 items-center w-full">
        <div className="flex-1 w-full"><SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Search by title, code, or category..." /></div>
        <button onClick={openCreate} className="w-full sm:w-auto justify-center bg-[#14161F] text-white px-5 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg hover:bg-[#22242F] transition-all whitespace-nowrap"><Plus size={17} /> Add Physical Course</button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-[#E6E0D2] overflow-x-auto w-full">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="bg-[#FAF8F3] border-b border-[#E6E0D2] text-[10px] font-bold text-[#857D6E] uppercase tracking-widest">
              <th className="p-4 md:p-5">Course</th>
              <th className="p-4 md:p-5">Category</th>
              <th className="p-4 md:p-5">Pricing</th>
              <th className="p-4 md:p-5 text-center">Seats</th>
              <th className="p-4 md:p-5 text-center">Status</th>
              <th className="p-4 md:p-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(course => (
              <tr key={course.id} className="border-b border-[#EFEBE1] hover:bg-[#FAF8F3] cursor-pointer" onClick={() => openEdit(course)}>
                <td className="p-4 md:p-5">
                  <p className="font-bold text-[#14161F] text-sm md:text-base line-clamp-2">{course.title}</p>
                  <p className="text-[10px] md:text-xs font-bold text-[#B4AF9F] font-mono mt-1">{course.course_code || 'No Code'} {course.batch_no ? `· Batch ${course.batch_no}` : ''}</p>
                  <p className="text-[10px] md:text-xs font-bold text-[#857D6E] mt-1 flex items-center gap-1 truncate max-w-[200px]"><MapPin size={11} className="shrink-0" /> {course.location}</p>
                </td>
                <td className="p-4 md:p-5"><span className="uppercase text-[9px] md:text-[10px] tracking-widest bg-[#B8543D]/10 text-[#B8543D] px-2 py-1 rounded font-bold whitespace-nowrap">{course.category}</span></td>
                <td className="p-4 md:p-5 whitespace-nowrap">
                  <p className="font-bold text-[#4A4638] text-sm md:text-base">Rs. {course.price}</p>
                  {course.discount_price ? <p className="text-[10px] md:text-xs text-[#1E8F6F] font-bold bg-[#DCEEE6] px-2 py-0.5 rounded inline-block mt-1">Now Rs. {course.discount_price}</p> : <p className="text-[10px] md:text-xs font-bold text-[#B4AF9F] mt-1">No Discount</p>}
                </td>
                <td className="p-4 md:p-5 text-center"><span className="inline-block bg-[#B8543D]/10 text-[#B8543D] font-bold px-3 py-1.5 rounded-xl border border-[#B8543D]/20 text-xs md:text-sm whitespace-nowrap">{course.enrolled_count ?? 0} / {course.max_seats ?? '-'}</span></td>
                <td className="p-4 md:p-5 flex justify-center" onClick={e => e.stopPropagation()}><ToggleSwitch checked={course.is_active} onChange={() => toggleActive(course)} label={course.is_active ? 'Active' : 'Hidden'} activeColor="#B8543D" /></td>
                <td className="p-4 md:p-5 text-right" onClick={e => e.stopPropagation()}>
                  <button onClick={() => openEdit(course)} className="p-2 text-[#B8543D] bg-[#B8543D]/10 rounded-lg hover:bg-[#B8543D]/20" title="Edit Course"><Edit2 size={15} /></button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={6} className="p-10 text-center font-bold text-[#857D6E]">No physical courses found.</td></tr>}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#14161F]/60 p-2 md:p-4 backdrop-blur-sm" onClick={() => setModalOpen(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full relative overflow-hidden flex flex-col max-h-[95vh] md:max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <button onClick={() => setModalOpen(false)} className="absolute top-4 right-4 md:top-6 md:right-6 text-[#B4AF9F] hover:text-[#14161F] z-10"><X /></button>
            <div className="p-4 md:p-6 border-b border-[#E6E0D2] bg-[#FAF8F3] mt-2 md:mt-4">
              <h3 className="text-xl md:text-2xl font-serif font-bold text-[#14161F] pr-6">{editing.id ? 'Edit Physical Course' : 'Add Physical Course'}</h3>
            </div>
            <div className="p-4 md:p-6 space-y-4 overflow-y-auto no-scrollbar flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                <div className="md:col-span-2"><label className="block text-[10px] font-bold text-[#857D6E] uppercase mb-1 ml-1">Course Title</label><input type="text" className="w-full bg-[#FAF8F3] p-3 rounded-xl outline-none border border-[#E6E0D2] focus:border-[#B8543D] font-bold text-[#14161F] text-sm" value={editing.title || ''} onChange={e => setEditing({ ...editing, title: e.target.value })} /></div>
                <div><label className="block text-[10px] font-bold text-[#857D6E] uppercase mb-1 ml-1">Course Code</label><input type="text" className="w-full bg-[#FAF8F3] p-3 rounded-xl outline-none border border-[#E6E0D2] focus:border-[#B8543D] font-bold text-[#14161F] text-sm" value={editing.course_code || ''} onChange={e => setEditing({ ...editing, course_code: e.target.value })} /></div>
                <div>
                  <label className="block text-[10px] font-bold text-[#857D6E] uppercase mb-1 ml-1">Category</label>
                  <select className="w-full bg-[#FAF8F3] p-3 rounded-xl outline-none border border-[#E6E0D2] focus:border-[#B8543D] font-bold text-[#14161F] text-sm" value={editing.category || 'Professional Training'} onChange={e => setEditing({ ...editing, category: e.target.value as any })}>
                    <option value="Professional Training">Professional Training</option>
                    <option value="University Subjects">University Subjects</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                <div><label className="block text-[10px] font-bold text-[#857D6E] uppercase mb-1 ml-1">Instructor Name</label><input type="text" className="w-full bg-[#FAF8F3] p-3 rounded-xl outline-none border border-[#E6E0D2] focus:border-[#B8543D] font-bold text-[#14161F] text-sm" value={editing.instructor_name || ''} onChange={e => setEditing({ ...editing, instructor_name: e.target.value })} /></div>
                <div><label className="block text-[10px] font-bold text-[#857D6E] uppercase mb-1 ml-1">Batch No.</label><input type="number" className="w-full bg-[#FAF8F3] p-3 rounded-xl outline-none border border-[#E6E0D2] focus:border-[#B8543D] font-bold text-[#14161F] text-sm" value={editing.batch_no ?? ''} onChange={e => setEditing({ ...editing, batch_no: Number(e.target.value) })} /></div>
              </div>
              <div><label className="block text-[10px] font-bold text-[#857D6E] uppercase mb-1 ml-1">Location / Branch</label><input type="text" className="w-full bg-[#FAF8F3] p-3 rounded-xl outline-none border border-[#E6E0D2] focus:border-[#B8543D] font-bold text-[#14161F] text-sm" value={editing.location || ''} onChange={e => setEditing({ ...editing, location: e.target.value })} /></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                <div><label className="block text-[10px] font-bold text-[#857D6E] uppercase mb-1 ml-1">Start Date</label><input type="date" className="w-full bg-[#FAF8F3] p-3 rounded-xl outline-none border border-[#E6E0D2] focus:border-[#B8543D] font-bold text-[#14161F] text-sm" value={editing.start_date || ''} onChange={e => setEditing({ ...editing, start_date: e.target.value })} /></div>
                <div><label className="block text-[10px] font-bold text-[#857D6E] uppercase mb-1 ml-1">Timing</label><input type="text" placeholder="e.g., 5:00 PM - 7:00 PM" className="w-full bg-[#FAF8F3] p-3 rounded-xl outline-none border border-[#E6E0D2] focus:border-[#B8543D] font-bold text-[#14161F] text-sm" value={editing.timing || ''} onChange={e => setEditing({ ...editing, timing: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-3 gap-2 md:gap-4">
                <div><label className="block text-[10px] font-bold text-[#857D6E] uppercase mb-1 ml-1 truncate">Duration (wks)</label><input type="number" className="w-full bg-[#FAF8F3] p-3 rounded-xl outline-none border border-[#E6E0D2] focus:border-[#B8543D] font-bold text-[#14161F] text-sm" value={editing.duration_weeks ?? ''} onChange={e => setEditing({ ...editing, duration_weeks: Number(e.target.value) })} /></div>
                <div><label className="block text-[10px] font-bold text-[#857D6E] uppercase mb-1 ml-1">Max Seats</label><input type="number" className="w-full bg-[#FAF8F3] p-3 rounded-xl outline-none border border-[#E6E0D2] focus:border-[#B8543D] font-bold text-[#14161F] text-sm" value={editing.max_seats ?? ''} onChange={e => setEditing({ ...editing, max_seats: Number(e.target.value) })} /></div>
                <div><label className="block text-[10px] font-bold text-[#857D6E] uppercase mb-1 ml-1">Enrolled</label><input type="number" className="w-full bg-[#FAF8F3] p-3 rounded-xl outline-none border border-[#E6E0D2] focus:border-[#B8543D] font-bold text-[#14161F] text-sm" value={editing.enrolled_count ?? ''} onChange={e => setEditing({ ...editing, enrolled_count: Number(e.target.value) })} /></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                <div><label className="block text-[10px] font-bold text-[#857D6E] uppercase mb-1 ml-1">Price (Rs)</label><input type="number" className="w-full bg-[#FAF8F3] p-3 rounded-xl outline-none border border-[#E6E0D2] focus:border-[#B8543D] font-bold text-[#14161F] text-sm" value={editing.price ?? ''} onChange={e => setEditing({ ...editing, price: Number(e.target.value) })} /></div>
                <div><label className="block text-[10px] font-bold text-[#857D6E] uppercase mb-1 ml-1">Discount Price (Rs)</label><input type="number" className="w-full bg-[#FAF8F3] p-3 rounded-xl outline-none border border-[#E6E0D2] focus:border-[#B8543D] font-bold text-[#14161F] text-sm" value={editing.discount_price ?? ''} onChange={e => setEditing({ ...editing, discount_price: e.target.value === '' ? undefined : Number(e.target.value) })} /></div>
              </div>
              <div><label className="block text-[10px] font-bold text-[#857D6E] uppercase mb-1 ml-1">Learning Outcomes (one per line)</label><textarea rows={3} className="w-full bg-[#FAF8F3] p-3 rounded-xl outline-none border border-[#E6E0D2] focus:border-[#B8543D] font-bold text-[#14161F] text-sm resize-none" value={outcomesText} onChange={e => setEditing({ ...editing, learning_outcomes: e.target.value.split("\n").map(s => s.trim()).filter(Boolean) })} /></div>
              <div><label className="block text-[10px] font-bold text-[#857D6E] uppercase mb-1 ml-1">Tutor Bio</label><textarea rows={2} className="w-full bg-[#FAF8F3] p-3 rounded-xl outline-none border border-[#E6E0D2] focus:border-[#B8543D] font-bold text-[#14161F] text-sm resize-none" value={editing.tutor_bio || ''} onChange={e => setEditing({ ...editing, tutor_bio: e.target.value })} /></div>
              <div className="pt-2"><ToggleSwitch checked={!!editing.is_active} onChange={() => setEditing({ ...editing, is_active: !editing.is_active })} label={editing.is_active ? 'Active (visible to public)' : 'Inactive (hidden)'} activeColor="#B8543D" /></div>
            </div>
            <div className="p-4 md:p-6 border-t border-[#E6E0D2] bg-[#FAF8F3] flex justify-end gap-3 shrink-0">
              <button onClick={() => setModalOpen(false)} className="px-4 md:px-6 py-2.5 font-bold text-[#857D6E] hover:text-[#14161F] text-sm">Cancel</button>
              <button onClick={save} className="px-6 md:px-8 py-2.5 rounded-xl font-bold bg-[#B8543D] text-white shadow-lg hover:opacity-90 transition-colors text-sm">Save Course</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================================================
   BOOKINGS & LEADS
============================================================================ */
function BookingsManager({ courses, enrollments, batches, syllabi, physicalCourses, physicalLeads, orders, refresh, onOpenChat }: any) {
  const [bookingType, setBookingType] = useState<'online' | 'physical'>('online');

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 w-full">
      <SectionHeader
        eyebrow="Enrollment Desk"
        title="Bookings & Leads"
        subtitle="Two desks, one ledger — online enrollments and walk-in leads."
        action={
          <div className="flex flex-col sm:flex-row bg-white p-1 rounded-xl border border-[#E6E0D2] shadow-sm w-full md:w-auto">
            <button onClick={() => setBookingType('online')} className={`flex-1 justify-center px-4 md:px-5 py-2.5 rounded-lg text-xs md:text-sm font-bold transition-all flex items-center gap-2 ${bookingType === 'online' ? 'bg-[#0E7C7B] text-white shadow' : 'text-[#857D6E] hover:text-[#14161F]'}`}>
              <Globe2 size={15} /> Online
            </button>
            <button onClick={() => setBookingType('physical')} className={`flex-1 justify-center px-4 md:px-5 py-2.5 rounded-lg text-xs md:text-sm font-bold transition-all flex items-center gap-2 ${bookingType === 'physical' ? 'bg-[#B8543D] text-white shadow' : 'text-[#857D6E] hover:text-[#14161F]'}`}>
              <Building2 size={15} /> Physical
            </button>
          </div>
        }
      />
      {bookingType === 'online' ? (
        <OnlineBookingsView courses={courses} enrollments={enrollments} batches={batches} syllabi={syllabi} orders={orders} refresh={refresh} onOpenChat={onOpenChat} />
      ) : (
        <PhysicalLeadsView physicalCourses={physicalCourses} data={physicalLeads} orders={orders} refresh={refresh} />
      )}
    </motion.div>
  );
}

function OnlineBookingsView({ courses, enrollments, batches, syllabi, orders, refresh, onOpenChat }: any) {
  const supabase = useSupabase();
  const [selectedCourse, setSelectedCourse] = useState<OnlineCourse | null>(null);
  const [selectedBatch, setSelectedBatch] = useState<number | 'unassigned' | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'confirmed'>('all');
  const [editingPayment, setEditingPayment] = useState<Enrollment | null>(null);
  const [editLocked, setEditLocked] = useState<number>(0);
  const [editPaid, setEditPaid] = useState<number>(0);
  const [isAddingBooking, setIsAddingBooking] = useState(false);
  const [newBooking, setNewBooking] = useState({ name: '', email: '', wa: '', locked_price: 0, paid_amount: 0 });
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 20;

  useEffect(() => { setCurrentPage(1); }, [selectedCourse, selectedBatch, searchQuery, statusFilter]);

  const toggleConfirmation = async (enrollmentId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase.from('enrollments_v2').update({ is_confirmed: !currentStatus }).eq('id', enrollmentId);
      if (error) { alert(`Could not update booking: ${error.message}`); return; }
      refresh();
    } catch { alert("An unexpected error occurred while updating."); }
  };

  const deleteEnrollment = async (enrollmentId: string) => {
    if (confirm("Are you sure you want to delete this enrollment? This action will set it to archived.")) {
      try {
        const { error } = await supabase.from('enrollments_v2').update({ deleted: true }).eq('id', enrollmentId);
        if (error) { alert(`Failed to delete: ${error.message}`); return; }
        refresh();
      } catch { alert("An unexpected error occurred."); }
    }
  };

  const openPaymentEdit = (enr: Enrollment) => { 
    setEditingPayment(enr); 
    setEditLocked(enr.locked_price || 0);
    setEditPaid(enr.paid_amount || 0); 
  };

  const savePayment = async () => {
    if (!editingPayment) return;
    const newPending = 0;

    if (!editingPayment.order_id) {
      const course = courses.find((c: any) => c.id === editingPayment.course_id);
      const { data: newOrder, error: insErr } = await supabase.from('orders_v2').insert([{
        enrollment_id: editingPayment.id, full_name: editingPayment.full_name, email: editingPayment.email,
        whatsapp_number: editingPayment.whatsapp_number, order_type: 'Online Course',
        order_name: editingPayment.course_name || (course?.title || 'Course Enrollment'),
        paid_amount: editPaid, pending_amount: newPending, locked_price: editLocked,
        status: editPaid >= editLocked ? 'verified' : 'pending'
      }]).select().single();
      if (insErr) { alert("Failed to auto-create missing order: " + insErr.message); return; }
      refresh(); setEditingPayment(null); return;
    }
    
    const { error } = await supabase.from('orders_v2').update({ 
      paid_amount: editPaid, 
      pending_amount: newPending, 
      locked_price: editLocked, 
      updated_at: new Date().toISOString() 
    }).eq('id', editingPayment.order_id);
    
    if (error) alert("Failed to update payment: " + error.message); else { refresh(); setEditingPayment(null); }
  };

  const openAddBookingModal = () => {
    const fee = Number(selectedCourse?.fee) || 0;
    const discount = Number(selectedCourse?.discount) || 0;
    setNewBooking({ name: '', email: '', wa: '', locked_price: fee - (fee * discount / 100), paid_amount: 0 });
    setIsAddingBooking(true);
  };

  const saveManualBooking = async () => {
    if (!selectedCourse) return;
    if (!newBooking.name || !newBooking.email || !newBooking.wa) { alert("Please fill all contact details!"); return; }
    let resolvedBatchId = null;
    if (selectedBatch !== 'unassigned' && selectedBatch !== null) {
      const matchedBatch = batches.find((b: any) => b.course_id === selectedCourse.id && b.batch_no === selectedBatch);
      if (matchedBatch) resolvedBatchId = matchedBatch.id;
    }
    if (!resolvedBatchId) { alert("Error: You must be inside a specific valid batch to add a booking."); return; }
    const enrPayload = { batch_id: resolvedBatchId, full_name: newBooking.name, email: newBooking.email, whatsapp_number: newBooking.wa, is_confirmed: true };
    const { data: enrData, error: enrErr } = await supabase.from('enrollments_v2').insert([enrPayload]).select().single();
    if (enrErr) { alert("Error adding enrollment: " + enrErr.message); return; }
    
    const ordPayload = {
      enrollment_id: enrData.id, full_name: newBooking.name, email: newBooking.email, whatsapp_number: newBooking.wa,
      order_type: 'Online Course', order_name: selectedCourse.title, paid_amount: newBooking.paid_amount, 
      pending_amount: 0, locked_price: newBooking.locked_price, status: newBooking.paid_amount >= newBooking.locked_price ? 'verified' : 'pending'
    };
    const { error: ordErr } = await supabase.from('orders_v2').insert([ordPayload]);
    if (ordErr) alert("Enrollment added, but auto-order creation failed: " + ordErr.message);
    setIsAddingBooking(false);
    setNewBooking({ name: '', email: '', wa: '', locked_price: 0, paid_amount: 0 });
    refresh();
  };

  const handleCopyCSV = () => {
    const header = "name,email,syllabus_id,contact_number\n";
    const rows = courseEnrollments.map((e: any) => `"${e.full_name || ''}","${e.email || ''}","${e.course_id || ''}","${e.whatsapp_number || ''}"`).join("\n");
    navigator.clipboard.writeText(header + rows).then(() => alert("Enrollment list copied to clipboard!"));
  };

  if (!selectedCourse) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 mt-2 w-full">
        {courses.map((course: any) => {
          const batchCount = batches.filter((b: any) => b.course_id === course.id).length;
          return (
            <div key={course.id} onClick={() => setSelectedCourse(course)} className="flex flex-col items-center justify-center p-6 bg-white border border-[#E6E0D2] rounded-2xl hover:border-[#0E7C7B] hover:shadow-md cursor-pointer transition-all aspect-square relative text-center group w-full max-w-full sm:max-w-[280px] mx-auto">
              <div className="absolute top-4 right-4 bg-[#0E7C7B]/10 text-[#0E7C7B] font-bold text-[10px] uppercase tracking-wider px-3 py-1.5 rounded-lg">{batchCount} Batches</div>
              <div className="w-14 h-14 bg-[#0E7C7B]/10 rounded-xl flex items-center justify-center text-[#0E7C7B] mb-4 group-hover:scale-105 transition-transform"><Globe2 size={26} /></div>
              <h3 className="font-bold text-[#14161F] text-sm md:text-base px-2 leading-snug">{course.title}</h3>
            </div>
          );
        })}
      </div>
    );
  }

  if (selectedCourse && selectedBatch === null) {
    const availableBatches = Array.from(new Set([
      ...batches.filter((b: any) => b.course_id === selectedCourse.id).map((b: any) => b.batch_no),
      ...enrollments.filter((e: any) => e.course_id === selectedCourse.id && e.batch_no).map((e: any) => e.batch_no as number)
    ])).sort((a, b) => b - a);
    const unassignedCount = enrollments.filter((e: any) => e.course_id === selectedCourse.id && !e.batch_no).length;

    return (
      <div className="space-y-6 w-full">
        <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
          <button onClick={() => setSelectedCourse(null)} className="self-start p-2 md:p-3 bg-white border border-[#E6E0D2] rounded-xl hover:bg-[#FAF8F3] transition-colors shadow-sm shrink-0"><ArrowLeft size={19} className="text-[#4A4638]" /></button>
          <div className="min-w-0">
            <h2 className="text-xl md:text-2xl font-serif font-bold text-[#14161F] truncate">{selectedCourse.title}</h2>
            <p className="text-xs md:text-sm font-medium text-[#857D6E]">Select a batch to view its enrollments</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {availableBatches.map(b => {
            const batchCount = enrollments.filter((e: any) => e.course_id === selectedCourse.id && e.batch_no === b).length;
            return (
              <div key={b} onClick={() => setSelectedBatch(b)} className="flex items-center justify-between p-5 md:p-6 bg-white border border-[#E6E0D2] rounded-2xl hover:border-[#0E7C7B] hover:shadow-md cursor-pointer transition-all">
                <div className="flex items-center gap-3 md:gap-4"><div className="w-12 h-12 md:w-14 md:h-14 bg-[#0E7C7B]/10 text-[#0E7C7B] rounded-xl flex items-center justify-center font-bold text-xl md:text-2xl">{b}</div><h3 className="font-bold text-[#14161F] text-lg md:text-xl">Batch {b}</h3></div>
                <div className="text-right"><p className="text-2xl md:text-3xl font-bold text-[#0E7C7B]">{batchCount}</p><p className="text-[9px] md:text-[10px] font-bold text-[#B4AF9F] uppercase tracking-widest">Enrollments</p></div>
              </div>
            );
          })}
          {unassignedCount > 0 && (
            <div onClick={() => setSelectedBatch('unassigned')} className="flex items-center justify-between p-5 md:p-6 bg-white border border-[#E6E0D2] rounded-2xl hover:border-[#C08A28] hover:shadow-md cursor-pointer transition-all">
              <div className="flex items-center gap-3 md:gap-4"><div className="w-12 h-12 md:w-14 md:h-14 bg-[#F5E7C8] text-[#8A6416] rounded-xl flex items-center justify-center font-bold text-xl md:text-2xl">?</div><h3 className="font-bold text-[#14161F] text-lg md:text-xl">Unassigned</h3></div>
              <div className="text-right"><p className="text-2xl md:text-3xl font-bold text-[#C08A28]">{unassignedCount}</p><p className="text-[9px] md:text-[10px] font-bold text-[#B4AF9F] uppercase tracking-widest">Enrollments</p></div>
            </div>
          )}
        </div>
      </div>
    );
  }

  let courseEnrollments = enrollments.filter((e: any) => {
    if (e.course_id !== selectedCourse.id) return false;
    if (selectedBatch === 'unassigned' && e.batch_no) return false;
    if (selectedBatch !== 'unassigned' && e.batch_no !== selectedBatch) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      if (!e.full_name?.toLowerCase().includes(q) && !e.email?.toLowerCase().includes(q) && !e.whatsapp_number?.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  if (statusFilter === 'confirmed') courseEnrollments = courseEnrollments.filter((e: any) => e.confirmed);
  if (statusFilter === 'pending') courseEnrollments = courseEnrollments.filter((e: any) => !e.confirmed);

  const predictedVolume = courseEnrollments.reduce((sum: number, e: any) => sum + (e.confirmed ? (e.locked_price || 0) : 0), 0);
  const collectedVolume = courseEnrollments.reduce((sum: number, e: any) => sum + (e.paid_amount || 0), 0);
  const pendingVolume = courseEnrollments.reduce((sum: number, e: any) => sum + (e.confirmed ? ((e.locked_price || 0) - (e.paid_amount || 0)) : 0), 0);

  const totalPages = Math.ceil(courseEnrollments.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedEnrollments = courseEnrollments.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  return (
    <div className="space-y-6 w-full">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3 md:gap-4 w-full md:w-auto">
            <button onClick={() => setSelectedBatch(null)} className="p-2 md:p-3 bg-white border border-[#E6E0D2] rounded-xl hover:bg-[#FAF8F3] transition-colors shadow-sm shrink-0"><ArrowLeft size={19} className="text-[#4A4638]" /></button>
            <div className="min-w-0">
              <h2 className="text-xl md:text-2xl font-serif font-bold text-[#14161F] truncate">{selectedCourse.title}</h2>
              <p className="text-xs md:text-sm font-medium text-[#857D6E] truncate">{selectedBatch === 'unassigned' ? 'Unassigned Enrollments' : `Batch ${selectedBatch} Enrollments`}</p>
            </div>
          </div>
          <button onClick={openAddBookingModal} className="w-full md:w-auto justify-center px-5 py-3 bg-[#0E7C7B] text-white rounded-xl text-sm font-bold hover:opacity-90 transition-colors flex items-center gap-2 shadow-sm whitespace-nowrap"><Plus size={16} /> Add Booking</button>
        </div>
        
        <div className="flex flex-col sm:flex-row flex-wrap gap-3 items-start sm:items-center w-full">
          <div className="w-full sm:flex-1 sm:min-w-[250px]"><SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Search by name, email, or phone..." /></div>
          <select className="w-full sm:w-auto bg-white border border-[#E6E0D2] rounded-xl px-4 py-3 text-sm font-bold text-[#14161F] outline-none shadow-sm cursor-pointer" value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)}>
            <option value="all">Status: All</option>
            <option value="pending">Status: Pending</option>
            <option value="confirmed">Status: Confirmed</option>
          </select>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center bg-[#FAF8F3] p-4 rounded-2xl border border-[#E6E0D2] mb-4 gap-4 w-full">
        <div className="flex flex-wrap items-center gap-2 md:gap-3">
            <span className="text-xs md:text-sm font-bold text-[#4A4638] bg-white px-3 py-1.5 rounded-lg border border-[#E6E0D2] shadow-sm whitespace-nowrap">Showing {courseEnrollments.length}</span>
            <span className="text-xs md:text-sm font-bold text-[#0E7C7B] bg-[#0E7C7B]/10 px-3 py-1.5 rounded-lg border border-[#0E7C7B]/20 shadow-sm whitespace-nowrap">Predicted: <span className="font-black">Rs. {predictedVolume}</span></span>
            <span className="text-xs md:text-sm font-bold text-[#1E8F6F] bg-[#DCEEE6] px-3 py-1.5 rounded-lg border border-[#C3E3D5] shadow-sm whitespace-nowrap">Collected: <span className="font-black">Rs. {collectedVolume}</span></span>
            <span className="text-xs md:text-sm font-bold text-[#B23B3B] bg-[#F3DAD6] px-3 py-1.5 rounded-lg border border-[#EAC2BC] shadow-sm whitespace-nowrap">Pending: <span className="font-black">Rs. {pendingVolume}</span></span>
        </div>
        <button onClick={handleCopyCSV} className="w-full lg:w-auto justify-center flex items-center gap-2 bg-[#14161F] text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-[#22242F] transition-colors shadow-sm whitespace-nowrap shrink-0"><Copy size={14} /> Copy CSV List</button>
      </div>

      <div className="bg-white border border-[#E6E0D2] shadow-sm overflow-x-auto w-full flex flex-col rounded-xl">
        <div className="overflow-y-auto max-h-[600px] w-full">
          <table className="w-full text-left border-collapse table-auto text-xs min-w-[900px]">
            <thead>
              <tr className="bg-[#FAF8F3] border-b border-[#E6E0D2] text-[#4A4638] uppercase font-bold tracking-wider sticky top-0 z-10">
                <th className="p-3 border-r border-[#E6E0D2]">Full Name</th>
                <th className="p-3 border-r border-[#E6E0D2]">Email</th>
                <th className="p-3 border-r border-[#E6E0D2]">Contact Number</th>
                <th className="p-3 border-r border-[#E6E0D2]">Locked Fee</th>
                <th className="p-3 border-r border-[#E6E0D2]">Paid Amount</th>
                <th className="p-3 border-r border-[#E6E0D2]">Remaining Amount</th>
                <th className="p-3 border-r border-[#E6E0D2] text-center">Confirmed</th>
                <th className="p-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedEnrollments.map((enr: any) => {
                const lockedFee = enr.locked_price || 0;
                const paidAmt = enr.paid_amount || 0;
                const pendingAmt = lockedFee - paidAmt;
                
                return (
                  <tr key={enr.id} className="border-b border-[#EFEBE1] hover:bg-[#FBF6EA] transition-colors">
                    <td className="p-3 border-r border-[#E6E0D2] font-bold text-[#14161F] cursor-pointer hover:text-[#0E7C7B] hover:underline truncate max-w-[150px]" onClick={(e) => { e.stopPropagation(); enr.user_id ? onOpenChat(enr.user_id) : alert('No linked user account.'); }}>{enr.full_name}</td>
                    <td className="p-3 border-r border-[#E6E0D2] font-bold text-[#4A4638] truncate max-w-[150px]">{enr.email}</td>
                    <td className="p-3 border-r border-[#E6E0D2] font-bold text-[#4A4638]">{enr.whatsapp_number}</td>
                    <td className="p-3 border-r border-[#E6E0D2] font-bold text-[#4A4638]">Rs. {lockedFee}</td>
                    <td className="p-3 border-r border-[#E6E0D2] text-[#1E8F6F] font-bold">Rs. {paidAmt}</td>
                    <td className={`p-3 border-r border-[#E6E0D2] font-bold ${pendingAmt > 0 ? 'text-[#B23B3B]' : 'text-[#4A4638]'}`}>
                      Rs. {pendingAmt}
                    </td>
                    <td className="p-3 border-r border-[#E6E0D2] text-center">
                      <input type="checkbox" checked={!!enr.confirmed} onChange={() => toggleConfirmation(enr.id, !!enr.confirmed)} className="w-5 h-5 cursor-pointer accent-[#1E8F6F] rounded" />
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex justify-center gap-2">
                        <button onClick={() => openPaymentEdit(enr)} className="text-[10px] font-bold bg-[#FAF8F3] border border-[#E6E0D2] px-3 py-1.5 rounded hover:bg-[#EFEBE1] transition-colors flex items-center gap-1"><Edit2 size={12} />Edit</button>
                        <button onClick={() => deleteEnrollment(enr.id)} className="text-[10px] font-bold bg-[#F3DAD6] text-[#B23B3B] border border-[#EAC2BC] px-3 py-1.5 rounded hover:opacity-80 transition-colors flex items-center gap-1"><Trash2 size={12} />Delete</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {paginatedEnrollments.length === 0 && <tr><td colSpan={8} className="p-8 text-center font-bold text-[#857D6E]">No matching enrollments found.</td></tr>}
            </tbody>
          </table>
        </div>
        {courseEnrollments.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between p-4 border-t border-[#E6E0D2] bg-[#FAF8F3] shrink-0 gap-4">
            <span className="text-xs font-bold text-[#4A4638]">Showing {startIndex + 1} to {Math.min(startIndex + ITEMS_PER_PAGE, courseEnrollments.length)} of {courseEnrollments.length} entries</span>
            <div className="flex gap-2">
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-4 py-2 rounded border border-[#E6E0D2] text-xs font-bold bg-white text-[#4A4638] disabled:opacity-50 hover:bg-[#EFEBE1] transition-colors">Previous</button>
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || totalPages === 0} className="px-4 py-2 rounded border border-[#E6E0D2] text-xs font-bold bg-white text-[#4A4638] disabled:opacity-50 hover:bg-[#EFEBE1] transition-colors">Next</button>
            </div>
          </div>
        )}
      </div>

      {isAddingBooking && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#14161F]/60 p-4 backdrop-blur-sm" onClick={() => setIsAddingBooking(false)}>
          <div className="bg-white rounded-2xl shadow-2xl p-6 md:p-8 max-w-sm w-full relative" onClick={e => e.stopPropagation()}>
            <button onClick={() => setIsAddingBooking(false)} className="absolute top-4 right-4 md:top-6 md:right-6 text-[#B4AF9F] hover:text-[#14161F]"><X /></button>
            <h3 className="text-xl md:text-2xl font-serif font-bold mb-1">Add Booking</h3>
            <p className="text-[10px] md:text-xs font-medium text-[#857D6E] mb-6">Create enrollment manually.</p>
            <div className="space-y-4">
              <div><label className="block text-[10px] font-bold text-[#857D6E] uppercase mb-1">Full Name</label><input type="text" value={newBooking.name} onChange={(e) => setNewBooking({ ...newBooking, name: e.target.value })} className="w-full bg-[#FAF8F3] p-3 rounded-xl outline-none border border-[#E6E0D2] focus:border-[#B8862E] font-bold text-[#14161F] text-sm" placeholder="John Doe" /></div>
              <div><label className="block text-[10px] font-bold text-[#857D6E] uppercase mb-1">Email Address</label><input type="email" value={newBooking.email} onChange={(e) => setNewBooking({ ...newBooking, email: e.target.value })} className="w-full bg-[#FAF8F3] p-3 rounded-xl outline-none border border-[#E6E0D2] focus:border-[#B8862E] font-bold text-[#14161F] text-sm" placeholder="john@example.com" /></div>
              <div><label className="block text-[10px] font-bold text-[#857D6E] uppercase mb-1">WhatsApp Number</label><input type="text" value={newBooking.wa} onChange={(e) => setNewBooking({ ...newBooking, wa: e.target.value })} className="w-full bg-[#FAF8F3] p-3 rounded-xl outline-none border border-[#E6E0D2] focus:border-[#B8862E] font-bold text-[#14161F] text-sm" placeholder="98XXXXXXXX" /></div>
              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-[#E6E0D2]">
                <div><label className="block text-[10px] font-bold text-[#857D6E] uppercase mb-1">Locked Price</label><input type="number" value={newBooking.locked_price} onChange={(e) => setNewBooking({ ...newBooking, locked_price: Number(e.target.value) })} className="w-full bg-[#FAF8F3] p-3 rounded-xl outline-none border border-[#E6E0D2] focus:border-[#B8862E] font-bold text-[#14161F] text-sm" /></div>
                <div><label className="block text-[10px] font-bold text-[#857D6E] uppercase mb-1">Paid Amount</label><input type="number" value={newBooking.paid_amount} onChange={(e) => setNewBooking({ ...newBooking, paid_amount: Number(e.target.value) })} className="w-full bg-[#FAF8F3] p-3 rounded-xl outline-none border border-[#E6E0D2] focus:border-[#1E8F6F] font-bold text-[#1E8F6F] text-sm" /></div>
              </div>
            </div>
            <div className="mt-8 flex justify-end gap-3">
              <button onClick={() => setIsAddingBooking(false)} className="px-4 md:px-5 py-2.5 font-bold text-[#857D6E] hover:text-[#14161F] transition-colors text-sm">Cancel</button>
              <button onClick={saveManualBooking} className="px-5 md:px-6 py-2.5 rounded-xl font-bold bg-[#0E7C7B] text-white shadow-lg hover:opacity-90 transition-colors text-sm">Add</button>
            </div>
          </div>
        </div>
      )}

      {editingPayment && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#14161F]/60 p-4 backdrop-blur-sm" onClick={() => setEditingPayment(null)}>
          <div className="bg-white rounded-2xl shadow-2xl p-6 md:p-8 max-w-sm w-full relative" onClick={e => e.stopPropagation()}>
            <button onClick={() => setEditingPayment(null)} className="absolute top-4 right-4 md:top-6 md:right-6 text-[#B4AF9F] hover:text-[#14161F]"><X /></button>
            <h3 className="text-lg md:text-xl font-serif font-bold mb-1 pr-6">Edit Payment Details</h3>
            <p className="text-[10px] md:text-xs font-bold text-[#857D6E] mb-6 truncate">{editingPayment.full_name}</p>
            <div className="space-y-4">
              <div><label className="block text-[10px] font-bold text-[#857D6E] uppercase mb-1">Locked Fee (Rs)</label><input type="number" value={editLocked} onChange={(e) => setEditLocked(Number(e.target.value))} className="w-full bg-[#FAF8F3] p-3 rounded-xl outline-none border border-[#E6E0D2] focus:border-[#8A6416] font-black text-[#8A6416] text-sm" /></div>
              <div><label className="block text-[10px] font-bold text-[#857D6E] uppercase mb-1">Paid Amount (Rs)</label><input type="number" value={editPaid} onChange={(e) => setEditPaid(Number(e.target.value))} className="w-full bg-[#FAF8F3] p-3 rounded-xl outline-none border border-[#E6E0D2] focus:border-[#1E8F6F] font-black text-[#1E8F6F] text-sm" /></div>
              <div className="p-3 bg-[#EFEBE1] rounded-xl flex justify-between items-center border border-[#E6E0D2]">
                <label className="block text-[10px] font-bold text-[#857D6E] uppercase">Remaining Amount</label>
                <span className={`font-black text-sm ${editLocked - editPaid > 0 ? 'text-[#B23B3B]' : 'text-[#1E8F6F]'}`}>Rs. {Math.max(0, editLocked - editPaid)}</span>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setEditingPayment(null)} className="px-4 py-2 font-bold text-[#857D6E] hover:text-[#14161F] transition-colors text-sm">Cancel</button>
              <button onClick={savePayment} className="px-5 md:px-6 py-2 rounded-xl font-bold bg-[#0E7C7B] text-white shadow-lg hover:opacity-90 transition-colors text-sm">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PhysicalLeadsView({ physicalCourses, data, orders, refresh }: { physicalCourses: PhysicalCourse[]; data: PhysicalLead[]; orders: Order[]; refresh: () => void }) {
  const supabase = useSupabase();
  const [selectedCourse, setSelectedCourse] = useState<PhysicalCourse | null>(null);
  const [selectedBatch, setSelectedBatch] = useState<number | 'unassigned' | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [confirmedFilter, setConfirmedFilter] = useState<'all' | 'pending' | 'confirmed'>('all');
  const [editingLead, setEditingLead] = useState<PhysicalLead | null>(null);
  const [editForm, setEditForm] = useState({
    full_name: '', phone: '', email: '', office_location: '', remarks: '', counselor_notes: '',
    status: 'new' as PhysicalLead['status'], assigned_to: '', follow_up_date: '', batch_no: undefined as number | undefined, start_date: '',
  });
  const [editLocked, setEditLocked] = useState<number>(0);
  const [editPaid, setEditPaid] = useState<number>(0);
  const [isAddingLead, setIsAddingLead] = useState(false);
  const [newLead, setNewLead] = useState({ full_name: '', phone: '', email: '', locked_price: 0, paid_amount: 0 });
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 20;

  useEffect(() => { setCurrentPage(1); }, [selectedCourse, selectedBatch, searchQuery, confirmedFilter]);

  const leadsWithOrders: PhysicalLead[] = useMemo(() => {
    const physicalOrders = orders.filter(o => !!o.leads_id);
    return data.map(lead => {
      const matches = physicalOrders.filter(o => o.leads_id === lead.id);
      if (matches.length === 0) return { ...lead, order_id: null };
      if (matches.length > 1) {
        console.warn(`[PhysicalLeadsView] Multiple orders found for lead ${lead.id}; using the most recent one.`);
      }
      const newest = matches.reduce((a, b) => new Date(a.created_at) > new Date(b.created_at) ? a : b);
      return {
        ...lead,
        order_id: newest.id,
        bill_no: newest.bill_no ?? null,
        locked_price: newest.locked_price ?? 0,
        paid_amount: newest.paid_amount ?? 0,
        pending_amount: newest.pending_amount ?? 0,
        remaining_amount: newest.remaining_amount ?? Math.max(0, (newest.locked_price ?? 0) - (newest.paid_amount ?? 0) - (newest.pending_amount ?? 0)),
        order_status: newest.status,
        payment_screenshots: newest.payment_screenshots || [],
      };
    });
  }, [data, orders]);

  const toggleConfirmation = async (leadId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase.from('physical_leads').update({ is_confirmed: !currentStatus }).eq('id', leadId);
      if (error) { alert(`Could not update lead: ${error.message}`); return; }
      refresh();
    } catch { alert("An unexpected error occurred while updating."); }
  };

  const deleteLead = async (leadId: string) => {
    if (confirm("Are you sure you want to delete this lead? This action will set it to archived.")) {
      try {
        const { error } = await supabase.from('physical_leads').update({ deleted: true }).eq('id', leadId);
        if (error) { alert(`Failed to delete: ${error.message}`); return; }
        refresh();
      } catch { alert("An unexpected error occurred."); }
    }
  };

  const openEditLead = (lead: PhysicalLead) => {
    setEditingLead(lead);
    setEditForm({
      full_name: lead.full_name || '', phone: lead.phone || '', email: lead.email || '',
      office_location: lead.office_location || '', remarks: lead.remarks || '', counselor_notes: lead.counselor_notes || '',
      status: lead.status, assigned_to: lead.assigned_to || '', follow_up_date: lead.follow_up_date || '',
      batch_no: lead.batch_no ?? undefined, start_date: (lead as any).start_date || '',
    });
    setEditLocked(lead.locked_price ?? 0);
    setEditPaid(lead.paid_amount ?? 0);
  };

  const saveLeadDetails = async (leadId: string) => {
    const { error } = await supabase.from('physical_leads').update({
      full_name: editForm.full_name,
      phone: editForm.phone,
      email: editForm.email || null,
      office_location: editForm.office_location || null,
      remarks: editForm.remarks || null,
      counselor_notes: editForm.counselor_notes || null,
      status: editForm.status,
      assigned_to: editForm.assigned_to || null,
      follow_up_date: editForm.follow_up_date || null,
      batch_no: editForm.batch_no ?? null,
      start_date: editForm.start_date || null,
      updated_at: new Date().toISOString(),
    }).eq('id', leadId);
    if (error) { alert("Failed to update lead details: " + error.message); return false; }
    return true;
  };

  const saveOrderPayment = async (leadId: string) => {
    const { error } = await supabase.from('orders_v2').update({
      locked_price: editLocked,
      paid_amount: editPaid,
      pending_amount: 0, 
      updated_at: new Date().toISOString(),
    }).eq('leads_id', leadId);
    if (error) { alert("Failed to update payment: " + error.message); return false; }
    return true;
  };

  const handleSaveEdit = async () => {
    if (!editingLead) return;
    const leadOk = await saveLeadDetails(editingLead.id);
    if (!leadOk) return;
    if (editingLead.order_id) {
      const orderOk = await saveOrderPayment(editingLead.id);
      if (!orderOk) return;
    }
    setEditingLead(null);
    refresh();
  };

  const saveManualLead = async () => {
    if (!selectedCourse) return;
    if (!newLead.full_name || !newLead.phone) { alert("Name and Phone are required."); return; }
    const targetBatch = selectedCourse.batch_no;
    const payload = {
      course_id: selectedCourse.id,
      course_code: selectedCourse.course_code || '',
      course_title: selectedCourse.title,
      category: selectedCourse.category,
      full_name: newLead.full_name,
      phone: newLead.phone,
      email: newLead.email || null,
      office_location: selectedCourse.location || 'Kathmandu',
      course_price: selectedCourse.discount_price || selectedCourse.price,
      source: 'Walk-in',
      status: 'new',
      batch_no: targetBatch,
      current_education: null,
      institution_name: null,
      remarks: 'Manually added by Admin',
      counselor_notes: null,
      assigned_to: null,
      follow_up_date: null,
      is_confirmed: false
    };
    
    const { data: leadData, error: leadErr } = await supabase.from('physical_leads').insert([payload]).select().single();
    if (leadErr) { alert("Failed to add lead: " + leadErr.message); return; }

    const ordPayload = {
      leads_id: leadData.id,
      full_name: newLead.full_name,
      email: newLead.email || '',
      whatsapp_number: newLead.phone,
      order_type: 'Physical Class',
      order_name: selectedCourse.title,
      paid_amount: newLead.paid_amount,
      pending_amount: 0,
      locked_price: newLead.locked_price,
      status: newLead.paid_amount >= newLead.locked_price ? 'verified' : 'pending'
    };

    const { error: ordErr } = await supabase.from('orders_v2').insert([ordPayload]);
    if (ordErr) alert("Lead added, but order creation failed: " + ordErr.message);

    setIsAddingLead(false);
    setNewLead({ full_name: '', phone: '', email: '', locked_price: 0, paid_amount: 0 });
    refresh();
  };

  const filteredLeads = leadsWithOrders.filter(l => {
    const matchesCourse = l.course_id === selectedCourse?.id || l.course_code === selectedCourse?.course_code;
    if (!matchesCourse) return false;
    if (selectedBatch === 'unassigned') {
      if (l.batch_no) return false;
    } else if (selectedBatch !== null) {
      if (l.batch_no !== selectedBatch) return false;
    }
    if (confirmedFilter === 'confirmed' && !l.is_confirmed) return false;
    if (confirmedFilter === 'pending' && l.is_confirmed) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        l.full_name?.toLowerCase().includes(q) ||
        l.phone?.toLowerCase().includes(q) ||
        (l.email || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleCopyContactsCSV = () => {
    const header = "name,email,phone\n";
    const rows = filteredLeads.map(e => `"${e.full_name || ''}","${e.email || ''}","${e.phone || ''}"`).join("\n");
    navigator.clipboard.writeText(header + rows).then(() => alert("Contact details copied to clipboard!"));
  };

  const handleCopyCSV = () => {
    const header = "name,email,phone,course,office,status,confirmed,locked_price,paid_amount,remaining_amount\n";
    const rows = filteredLeads.map(e => `"${e.full_name || ''}","${e.email || ''}","${e.phone || ''}","${e.course_title || ''}","${e.office_location || ''}","${e.status}","${e.is_confirmed ? 'Yes' : 'No'}","${e.locked_price ?? 0}","${e.paid_amount ?? 0}","${e.remaining_amount ?? 0}"`).join("\n");
    navigator.clipboard.writeText(header + rows).then(() => alert("Lead list copied to clipboard!"));
  };

  if (!selectedCourse) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 mt-2 w-full">
        {physicalCourses.map(course => {
          const activeLeadCount = leadsWithOrders.filter(l =>
            (l.course_id === course.id || l.course_code === course.course_code) && l.status !== 'cancelled'
          ).length;
          return (
            <div
              key={course.id}
              onClick={() => setSelectedCourse(course)}
              className="flex flex-col items-center justify-center p-5 md:p-6 bg-white border border-[#E6E0D2] rounded-2xl hover:border-[#B8543D] hover:shadow-md cursor-pointer transition-all aspect-square relative text-center group w-full max-w-full sm:max-w-[280px] mx-auto"
            >
              <div className="absolute top-4 right-4 bg-[#B8543D]/10 text-[#B8543D] font-bold text-[9px] md:text-[10px] uppercase tracking-wider px-2 md:px-3 py-1.5 rounded-lg">
                {activeLeadCount} Active Leads
              </div>
              <div className="w-12 h-12 md:w-14 md:h-14 bg-[#B8543D]/10 text-[#B8543D] rounded-xl flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <Building2 size={24} className="md:w-6 md:h-6" />
              </div>
              <h3 className="font-bold text-[#14161F] text-sm md:text-base px-2 leading-snug">{course.title}</h3>
              <p className="text-[10px] md:text-xs font-bold text-[#B4AF9F] font-mono mt-1">{course.course_code || 'No Code'}</p>
            </div>
          );
        })}
        {physicalCourses.length === 0 && (
          <div className="col-span-full bg-white rounded-2xl border border-[#E6E0D2] p-10 md:p-16 text-center">
            <Building2 size={40} className="mx-auto mb-4 text-[#D8D2C2]" />
            <p className="text-base md:text-lg font-serif font-bold text-[#14161F]">No physical offerings configured</p>
          </div>
        )}
      </div>
    );
  }

  if (selectedCourse && selectedBatch === null) {
    const availableBatches = Array.from(new Set([
      ...leadsWithOrders.filter(l => (l.course_id === selectedCourse.id || l.course_code === selectedCourse.course_code) && l.batch_no).map(l => l.batch_no as number),
      selectedCourse.batch_no
    ])).filter(Boolean).sort((a, b) => (b as number) - (a as number));
    
    const unassignedCount = leadsWithOrders.filter(l => (l.course_id === selectedCourse.id || l.course_code === selectedCourse.course_code) && !l.batch_no).length;

    return (
      <div className="space-y-6 w-full">
        <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
          <button onClick={() => setSelectedBatch(null)} className="self-start p-2 md:p-3 bg-white border border-[#E6E0D2] rounded-xl hover:bg-[#FAF8F3] transition-colors shadow-sm shrink-0">
            <ArrowLeft size={19} className="text-[#4A4638]" />
          </button>
          <div className="min-w-0">
            <h2 className="text-xl md:text-2xl font-serif font-bold text-[#14161F] truncate">{selectedCourse.title}</h2>
            <p className="text-xs md:text-sm font-medium text-[#857D6E]">Select a batch to view physical leads</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {availableBatches.map(b => {
            const batchCount = leadsWithOrders.filter(l => (l.course_id === selectedCourse.id || l.course_code === selectedCourse.course_code) && l.batch_no === b).length;
            return (
              <div key={b} onClick={() => setSelectedBatch(b as number)} className="flex items-center justify-between p-5 md:p-6 bg-white border border-[#E6E0D2] rounded-2xl hover:border-[#B8543D] hover:shadow-md cursor-pointer transition-all">
                <div className="flex items-center gap-3 md:gap-4">
                  <div className="w-12 h-12 md:w-14 md:h-14 bg-[#B8543D]/10 text-[#B8543D] rounded-xl flex items-center justify-center font-bold text-xl md:text-2xl">{b}</div>
                  <h3 className="font-bold text-[#14161F] text-lg md:text-xl">Batch {b}</h3>
                </div>
                <div className="text-right">
                  <p className="text-2xl md:text-3xl font-bold text-[#B8543D]">{batchCount}</p>
                  <p className="text-[9px] md:text-[10px] font-bold text-[#B4AF9F] uppercase tracking-widest">Leads</p>
                </div>
              </div>
            );
          })}
          {unassignedCount > 0 && (
            <div onClick={() => setSelectedBatch('unassigned')} className="flex items-center justify-between p-5 md:p-6 bg-white border border-[#E6E0D2] rounded-2xl hover:border-[#C08A28] hover:shadow-md cursor-pointer transition-all">
              <div className="flex items-center gap-3 md:gap-4">
                <div className="w-12 h-12 md:w-14 md:h-14 bg-[#F5E7C8] text-[#8A6416] rounded-xl flex items-center justify-center font-bold text-xl md:text-2xl">?</div>
                <h3 className="font-bold text-[#14161F] text-lg md:text-xl">Unassigned</h3>
              </div>
              <div className="text-right">
                <p className="text-2xl md:text-3xl font-bold text-[#C08A28]">{unassignedCount}</p>
                <p className="text-[9px] md:text-[10px] font-bold text-[#B4AF9F] uppercase tracking-widest">Leads</p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  const predictedVolume = filteredLeads.reduce((sum, e) => sum + (e.is_confirmed ? (e.locked_price || 0) : 0), 0);
  const collectedVolume = filteredLeads.reduce((sum, e) => sum + (e.paid_amount || 0), 0);
  const pendingVolume = filteredLeads.reduce((sum, e) => sum + (e.is_confirmed ? Math.max(0, (e.locked_price || 0) - (e.paid_amount || 0)) : 0), 0);

  const totalPages = Math.ceil(filteredLeads.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedLeads = filteredLeads.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  return (
    <div className="space-y-6 w-full">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3 md:gap-4 w-full md:w-auto">
            <button onClick={() => setSelectedBatch(null)} className="p-2 md:p-3 bg-white border border-[#E6E0D2] rounded-xl hover:bg-[#FAF8F3] transition-colors shadow-sm shrink-0">
              <ArrowLeft size={19} className="text-[#4A4638]" />
            </button>
            <div className="min-w-0">
              <h2 className="text-xl md:text-2xl font-serif font-bold text-[#14161F] truncate">{selectedCourse.title}</h2>
              <p className="text-xs md:text-sm font-medium text-[#857D6E] truncate">{selectedBatch === 'unassigned' ? 'Unassigned Leads' : `Batch ${selectedBatch} Leads`}</p>
            </div>
          </div>
          <button onClick={() => {
            setNewLead({ full_name: '', phone: '', email: '', locked_price: selectedCourse.discount_price || selectedCourse.price || 0, paid_amount: 0 });
            setIsAddingLead(true);
          }} className="w-full md:w-auto justify-center px-5 py-3 bg-[#B8543D] text-white rounded-xl text-sm font-bold hover:opacity-90 transition-colors flex items-center gap-2 shadow-sm whitespace-nowrap">
            <Plus size={16} /> Add Lead
          </button>
        </div>
        
        <div className="flex flex-col sm:flex-row flex-wrap gap-3 items-start sm:items-center w-full">
          <div className="w-full sm:flex-1 sm:min-w-[250px]">
            <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Search by name, email, or phone..." />
          </div>
          <select className="w-full sm:w-auto bg-white border border-[#E6E0D2] rounded-xl px-4 py-3 text-sm font-bold text-[#14161F] outline-none shadow-sm cursor-pointer" value={confirmedFilter} onChange={e => setConfirmedFilter(e.target.value as any)}>
            <option value="all">Status: All</option>
            <option value="pending">Status: Pending</option>
            <option value="confirmed">Status: Confirmed</option>
          </select>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center bg-[#FAF8F3] p-4 rounded-2xl border border-[#E6E0D2] mb-4 gap-4 w-full">
        <div className="flex flex-wrap items-center gap-2 md:gap-3">
            <span className="text-xs md:text-sm font-bold text-[#4A4638] bg-white px-3 py-1.5 rounded-lg border border-[#E6E0D2] shadow-sm whitespace-nowrap">Showing {filteredLeads.length}</span>
            <span className="text-xs md:text-sm font-bold text-[#B8543D] bg-[#B8543D]/10 px-3 py-1.5 rounded-lg border border-[#B8543D]/20 shadow-sm whitespace-nowrap">Predicted: <span className="font-black">Rs. {predictedVolume}</span></span>
            <span className="text-xs md:text-sm font-bold text-[#1E8F6F] bg-[#DCEEE6] px-3 py-1.5 rounded-lg border border-[#C3E3D5] shadow-sm whitespace-nowrap">Collected: <span className="font-black">Rs. {collectedVolume}</span></span>
            <span className="text-xs md:text-sm font-bold text-[#B23B3B] bg-[#F3DAD6] px-3 py-1.5 rounded-lg border border-[#EAC2BC] shadow-sm whitespace-nowrap">Pending: <span className="font-black">Rs. {pendingVolume}</span></span>
        </div>
        <div className="flex gap-2 w-full lg:w-auto">
          <button onClick={handleCopyContactsCSV} className="flex-1 lg:flex-none justify-center flex items-center gap-2 bg-white text-[#4A4638] border border-[#E6E0D2] px-4 py-2 rounded-xl text-xs font-bold hover:bg-[#FAF8F3] transition-colors shadow-sm whitespace-nowrap shrink-0">
            <Phone size={14} /> Contact List
          </button>
          <button onClick={handleCopyCSV} className="flex-1 lg:flex-none justify-center flex items-center gap-2 bg-[#14161F] text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-[#22242F] transition-colors shadow-sm whitespace-nowrap shrink-0">
            <Copy size={14} /> Full CSV
          </button>
        </div>
      </div>

      <div className="bg-white border border-[#E6E0D2] shadow-sm overflow-x-auto w-full flex flex-col rounded-xl">
        <div className="overflow-y-auto max-h-[600px] w-full">
          <table className="w-full text-left border-collapse table-auto text-xs min-w-[1000px]">
            <thead>
              <tr className="bg-[#FAF8F3] border-b border-[#E6E0D2] text-[#4A4638] uppercase font-bold tracking-wider sticky top-0 z-10">
                <th className="p-3 border-r border-[#E6E0D2]">Lead Details</th>
                <th className="p-3 border-r border-[#E6E0D2]">Contact Info</th>
                <th className="p-3 border-r border-[#E6E0D2]">Status & Notes</th>
                <th className="p-3 border-r border-[#E6E0D2]">Locked Fee</th>
                <th className="p-3 border-r border-[#E6E0D2]">Paid Amount</th>
                <th className="p-3 border-r border-[#E6E0D2]">Remaining</th>
                <th className="p-3 border-r border-[#E6E0D2] text-center">Confirmed</th>
                <th className="p-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedLeads.map(lead => {
                const lockedFee = lead.locked_price || 0;
                const paidAmt = lead.paid_amount || 0;
                const pendingAmt = Math.max(0, lockedFee - paidAmt);
                
                return (
                  <tr key={lead.id} className="border-b border-[#EFEBE1] hover:bg-[#FBF6EA] transition-colors">
                    <td className="p-3 border-r border-[#E6E0D2] align-top">
                      <p className="font-bold text-[#14161F] truncate max-w-[150px]">{lead.full_name}</p>
                      <p className="text-[10px] text-[#857D6E] font-bold mt-1">Source: {lead.source}</p>
                      <p className="text-[10px] text-[#B4AF9F] font-bold">Branch: {lead.office_location}</p>
                    </td>
                    <td className="p-3 border-r border-[#E6E0D2] align-top">
                      <p className="font-bold text-[#4A4638]">{lead.phone}</p>
                      <p className="text-[10px] font-bold text-[#857D6E] truncate max-w-[150px] mt-1">{lead.email || 'N/A'}</p>
                    </td>
                    <td className="p-3 border-r border-[#E6E0D2] align-top">
                      <span className="uppercase text-[9px] font-bold tracking-widest bg-[#EFEBE1] px-2 py-1 rounded text-[#857D6E] inline-block mb-1">{lead.status.replace('_', ' ')}</span>
                      {lead.remarks && <p className="text-[10px] font-medium text-[#4A4638] line-clamp-2 mt-1" title={lead.remarks}><StickyNote size={10} className="inline mr-1 text-[#B4AF9F]"/>{lead.remarks}</p>}
                    </td>
                    <td className="p-3 border-r border-[#E6E0D2] font-bold text-[#4A4638] align-top">Rs. {lockedFee}</td>
                    <td className="p-3 border-r border-[#E6E0D2] text-[#1E8F6F] font-bold align-top">Rs. {paidAmt}</td>
                    <td className={`p-3 border-r border-[#E6E0D2] font-bold align-top ${pendingAmt > 0 ? 'text-[#B23B3B]' : 'text-[#4A4638]'}`}>
                      Rs. {pendingAmt}
                    </td>
                    <td className="p-3 border-r border-[#E6E0D2] text-center align-top pt-4">
                      <input type="checkbox" checked={!!lead.is_confirmed} onChange={() => toggleConfirmation(lead.id, !!lead.is_confirmed)} className="w-5 h-5 cursor-pointer accent-[#B8543D] rounded" />
                    </td>
                    <td className="p-3 text-center align-top">
                      <div className="flex flex-col gap-2">
                        <button onClick={() => openEditLead(lead)} className="text-[10px] font-bold bg-[#FAF8F3] border border-[#E6E0D2] px-3 py-1.5 rounded hover:bg-[#EFEBE1] transition-colors flex items-center justify-center gap-1"><Edit2 size={12} />Edit</button>
                        <button onClick={() => deleteLead(lead.id)} className="text-[10px] font-bold bg-[#F3DAD6] text-[#B23B3B] border border-[#EAC2BC] px-3 py-1.5 rounded hover:opacity-80 transition-colors flex items-center justify-center gap-1"><Trash2 size={12} />Delete</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {paginatedLeads.length === 0 && <tr><td colSpan={8} className="p-8 text-center font-bold text-[#857D6E]">No matching leads found.</td></tr>}
            </tbody>
          </table>
        </div>
        {filteredLeads.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between p-4 border-t border-[#E6E0D2] bg-[#FAF8F3] shrink-0 gap-4">
            <span className="text-xs font-bold text-[#4A4638]">Showing {startIndex + 1} to {Math.min(startIndex + ITEMS_PER_PAGE, filteredLeads.length)} of {filteredLeads.length} entries</span>
            <div className="flex gap-2">
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-4 py-2 rounded border border-[#E6E0D2] text-xs font-bold bg-white text-[#4A4638] disabled:opacity-50 hover:bg-[#EFEBE1] transition-colors">Previous</button>
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || totalPages === 0} className="px-4 py-2 rounded border border-[#E6E0D2] text-xs font-bold bg-white text-[#4A4638] disabled:opacity-50 hover:bg-[#EFEBE1] transition-colors">Next</button>
            </div>
          </div>
        )}
      </div>

      {isAddingLead && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#14161F]/60 p-4 backdrop-blur-sm" onClick={() => setIsAddingLead(false)}>
          <div className="bg-white rounded-2xl shadow-2xl p-6 md:p-8 max-w-sm w-full relative" onClick={e => e.stopPropagation()}>
            <button onClick={() => setIsAddingLead(false)} className="absolute top-4 right-4 md:top-6 md:right-6 text-[#B4AF9F] hover:text-[#14161F]"><X /></button>
            <h3 className="text-xl md:text-2xl font-serif font-bold mb-1">Add Physical Lead</h3>
            <p className="text-[10px] md:text-xs font-medium text-[#857D6E] mb-6">Create lead manually for {selectedCourse.title}.</p>
            <div className="space-y-4">
              <div><label className="block text-[10px] font-bold text-[#857D6E] uppercase mb-1">Full Name</label><input type="text" value={newLead.full_name} onChange={(e) => setNewLead({ ...newLead, full_name: e.target.value })} className="w-full bg-[#FAF8F3] p-3 rounded-xl outline-none border border-[#E6E0D2] focus:border-[#B8543D] font-bold text-[#14161F] text-sm" placeholder="John Doe" /></div>
              <div><label className="block text-[10px] font-bold text-[#857D6E] uppercase mb-1">Email Address</label><input type="email" value={newLead.email} onChange={(e) => setNewLead({ ...newLead, email: e.target.value })} className="w-full bg-[#FAF8F3] p-3 rounded-xl outline-none border border-[#E6E0D2] focus:border-[#B8543D] font-bold text-[#14161F] text-sm" placeholder="john@example.com" /></div>
              <div><label className="block text-[10px] font-bold text-[#857D6E] uppercase mb-1">Phone Number</label><input type="text" value={newLead.phone} onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })} className="w-full bg-[#FAF8F3] p-3 rounded-xl outline-none border border-[#E6E0D2] focus:border-[#B8543D] font-bold text-[#14161F] text-sm" placeholder="98XXXXXXXX" /></div>
              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-[#E6E0D2]">
                <div><label className="block text-[10px] font-bold text-[#857D6E] uppercase mb-1">Locked Price</label><input type="number" value={newLead.locked_price} onChange={(e) => setNewLead({ ...newLead, locked_price: Number(e.target.value) })} className="w-full bg-[#FAF8F3] p-3 rounded-xl outline-none border border-[#E6E0D2] focus:border-[#B8543D] font-bold text-[#14161F] text-sm" /></div>
                <div><label className="block text-[10px] font-bold text-[#857D6E] uppercase mb-1">Paid Amount</label><input type="number" value={newLead.paid_amount} onChange={(e) => setNewLead({ ...newLead, paid_amount: Number(e.target.value) })} className="w-full bg-[#FAF8F3] p-3 rounded-xl outline-none border border-[#E6E0D2] focus:border-[#1E8F6F] font-bold text-[#1E8F6F] text-sm" /></div>
              </div>
            </div>
            <div className="mt-8 flex justify-end gap-3">
              <button onClick={() => setIsAddingLead(false)} className="px-4 md:px-5 py-2.5 font-bold text-[#857D6E] hover:text-[#14161F] transition-colors text-sm">Cancel</button>
              <button onClick={saveManualLead} className="px-5 md:px-6 py-2.5 rounded-xl font-bold bg-[#B8543D] text-white shadow-lg hover:opacity-90 transition-colors text-sm">Add Lead</button>
            </div>
          </div>
        </div>
      )}

      {editingLead && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#14161F]/60 p-4 backdrop-blur-sm" onClick={() => setEditingLead(null)}>
          <div className="bg-white rounded-2xl shadow-2xl p-6 md:p-8 max-w-2xl w-full relative overflow-y-auto max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <button onClick={() => setEditingLead(null)} className="absolute top-4 right-4 md:top-6 md:right-6 text-[#B4AF9F] hover:text-[#14161F]"><X /></button>
            <h3 className="text-lg md:text-xl font-serif font-bold mb-1 pr-6">Edit Lead Details</h3>
            <p className="text-[10px] md:text-xs font-bold text-[#857D6E] mb-6 truncate">{editingLead.full_name}</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <h4 className="font-bold text-xs uppercase text-[#B4AF9F] border-b border-[#E6E0D2] pb-1">Contact & Status</h4>
                <div><label className="block text-[10px] font-bold text-[#857D6E] uppercase mb-1">Full Name</label><input type="text" value={editForm.full_name} onChange={e => setEditForm({...editForm, full_name: e.target.value})} className="w-full bg-[#FAF8F3] p-2.5 rounded-lg outline-none border border-[#E6E0D2] focus:border-[#B8543D] font-bold text-[#14161F] text-xs" /></div>
                <div><label className="block text-[10px] font-bold text-[#857D6E] uppercase mb-1">Phone</label><input type="text" value={editForm.phone} onChange={e => setEditForm({...editForm, phone: e.target.value})} className="w-full bg-[#FAF8F3] p-2.5 rounded-lg outline-none border border-[#E6E0D2] focus:border-[#B8543D] font-bold text-[#14161F] text-xs" /></div>
                <div>
                  <label className="block text-[10px] font-bold text-[#857D6E] uppercase mb-1">Status</label>
                  <select value={editForm.status} onChange={e => setEditForm({...editForm, status: e.target.value as any})} className="w-full bg-[#FAF8F3] p-2.5 rounded-lg outline-none border border-[#E6E0D2] focus:border-[#B8543D] font-bold text-[#14161F] text-xs">
                    <option value="new">New</option>
                    <option value="contacted">Contacted</option>
                    <option value="interested">Interested</option>
                    <option value="follow_up">Follow Up</option>
                    <option value="booked">Booked</option>
                    <option value="deposit_paid">Deposit Paid</option>
                    <option value="enrolled">Enrolled</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                <div><label className="block text-[10px] font-bold text-[#857D6E] uppercase mb-1">Batch Number</label><input type="number" value={editForm.batch_no || ''} onChange={e => setEditForm({...editForm, batch_no: e.target.value ? Number(e.target.value) : undefined})} className="w-full bg-[#FAF8F3] p-2.5 rounded-lg outline-none border border-[#E6E0D2] focus:border-[#B8543D] font-bold text-[#14161F] text-xs" placeholder="Batch No" /></div>
              </div>

              <div className="space-y-4">
                <h4 className="font-bold text-xs uppercase text-[#B4AF9F] border-b border-[#E6E0D2] pb-1">Payment & Notes</h4>
                <div><label className="block text-[10px] font-bold text-[#857D6E] uppercase mb-1">Locked Fee (Rs)</label><input type="number" value={editLocked} onChange={(e) => setEditLocked(Number(e.target.value))} className="w-full bg-[#FAF8F3] p-2.5 rounded-lg outline-none border border-[#E6E0D2] focus:border-[#8A6416] font-black text-[#8A6416] text-xs" /></div>
                <div><label className="block text-[10px] font-bold text-[#857D6E] uppercase mb-1">Paid Amount (Rs)</label><input type="number" value={editPaid} onChange={(e) => setEditPaid(Number(e.target.value))} className="w-full bg-[#FAF8F3] p-2.5 rounded-lg outline-none border border-[#E6E0D2] focus:border-[#1E8F6F] font-black text-[#1E8F6F] text-xs" /></div>
                <div><label className="block text-[10px] font-bold text-[#857D6E] uppercase mb-1">General Remarks</label><textarea rows={2} value={editForm.remarks} onChange={e => setEditForm({...editForm, remarks: e.target.value})} className="w-full bg-[#FAF8F3] p-2.5 rounded-lg outline-none border border-[#E6E0D2] focus:border-[#B8543D] font-bold text-[#14161F] text-xs resize-none" /></div>
              </div>
            </div>

            <div className="mt-8 flex justify-end gap-3 border-t border-[#E6E0D2] pt-4">
              <button onClick={() => setEditingLead(null)} className="px-4 py-2 font-bold text-[#857D6E] hover:text-[#14161F] transition-colors text-sm">Cancel</button>
              <button onClick={handleSaveEdit} className="px-5 md:px-6 py-2.5 rounded-xl font-bold bg-[#B8543D] text-white shadow-lg hover:opacity-90 transition-colors text-sm">Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================================================
   CERTIFICATES
============================================================================ */
function CertificatesManager({ data, syllabi, refresh }: any) {
  const supabase = useSupabase();
  const [searchQuery, setSearchQuery] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [newCert, setNewCert] = useState({ name: '', email: '', syllabus_id: '', issue_date: new Date().toISOString().split('T')[0] });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filtered = data.filter((c: any) =>
    (c.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.certificate_code || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const generateCode = () => 'GH' + Math.random().toString(36).substr(2, 6).toUpperCase();

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const syllabus = syllabi.find((s: any) => s.id.toString() === newCert.syllabus_id);
    const payload = {
      name: newCert.name,
      email: newCert.email,
      syllabus_id: syllabus ? syllabus.id : null,
      syllabus_name: syllabus ? syllabus.name : 'Unknown Course',
      issue_date: newCert.issue_date,
      certificate_code: generateCode(),
      certificate_image: 'placeholder.png'
    };

    const { error } = await supabase.from('certificates').insert([payload]);
    if (error) alert("Error creating certificate: " + error.message);
    else {
      setShowAdd(false);
      setNewCert({ name: '', email: '', syllabus_id: '', issue_date: new Date().toISOString().split('T')[0] });
      refresh();
    }
    setIsSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to revoke this certificate?")) {
      const { error } = await supabase.from('certificates').update({ deleted: true }).eq('id', id);
      if (error) alert(error.message); else refresh();
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 w-full">
      <SectionHeader eyebrow="Credentials" title="Certificates" subtitle="Issue and manage verified digital certificates." action={
        <button onClick={() => setShowAdd(true)} className="w-full sm:w-auto justify-center bg-[#14161F] text-white px-5 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg hover:bg-[#22242F] transition-all">
          <Award size={17} /> Issue Certificate
        </button>
      } />
      
      <div className="w-full sm:w-1/2 md:w-1/3">
        <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Search by name, email, or code..." />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-[#E6E0D2] overflow-x-auto w-full">
        <table className="w-full text-left border-collapse min-w-[700px]">
          <thead>
            <tr className="bg-[#FAF8F3] border-b border-[#E6E0D2] text-[10px] font-bold text-[#857D6E] uppercase tracking-widest">
              <th className="p-4">Student</th>
              <th className="p-4">Course</th>
              <th className="p-4">Issue Date</th>
              <th className="p-4">Verification Code</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((cert: any) => (
              <tr key={cert.id} className="border-b border-[#EFEBE1] hover:bg-[#FAF8F3]">
                <td className="p-4">
                  <p className="font-bold text-[#14161F]">{cert.name}</p>
                  <p className="text-[10px] font-bold text-[#857D6E] truncate max-w-[200px]">{cert.email}</p>
                </td>
                <td className="p-4 font-bold text-[#4A4638] text-xs">{cert.syllabus_name}</td>
                <td className="p-4 font-mono text-xs font-bold text-[#857D6E]">{new Date(cert.issue_date).toLocaleDateString()}</td>
                <td className="p-4 font-mono text-xs font-bold text-[#0E7C7B] bg-[#0E7C7B]/10 px-3 py-1 rounded-lg inline-block mt-2">{cert.certificate_code}</td>
                <td className="p-4 text-right">
                  <button onClick={() => handleDelete(cert.id)} className="p-2 text-[#B23B3B] bg-[#F3DAD6] rounded-lg hover:opacity-80 transition-colors" title="Revoke">
                    <Ban size={15} />
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={5} className="p-8 text-center font-bold text-[#857D6E]">No certificates found.</td></tr>}
          </tbody>
        </table>
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#14161F]/60 p-4 backdrop-blur-sm" onClick={() => setShowAdd(false)}>
          <div className="bg-white rounded-2xl shadow-2xl p-6 md:p-8 max-w-sm w-full relative" onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowAdd(false)} className="absolute top-4 right-4 md:top-6 md:right-6 text-[#B4AF9F] hover:text-[#14161F]"><X /></button>
            <h3 className="text-xl md:text-2xl font-serif font-bold mb-1">Issue Certificate</h3>
            <p className="text-[10px] md:text-xs font-medium text-[#857D6E] mb-6">Record a new official certificate.</p>
            <form onSubmit={handleAdd} className="space-y-4">
              <div><label className="block text-[10px] font-bold text-[#857D6E] uppercase mb-1">Student Name</label><input required type="text" value={newCert.name} onChange={(e) => setNewCert({ ...newCert, name: e.target.value })} className="w-full bg-[#FAF8F3] p-3 rounded-xl outline-none border border-[#E6E0D2] focus:border-[#B8862E] font-bold text-[#14161F] text-sm" /></div>
              <div><label className="block text-[10px] font-bold text-[#857D6E] uppercase mb-1">Email</label><input required type="email" value={newCert.email} onChange={(e) => setNewCert({ ...newCert, email: e.target.value })} className="w-full bg-[#FAF8F3] p-3 rounded-xl outline-none border border-[#E6E0D2] focus:border-[#B8862E] font-bold text-[#14161F] text-sm" /></div>
              <div>
                <label className="block text-[10px] font-bold text-[#857D6E] uppercase mb-1">Course</label>
                <select required value={newCert.syllabus_id} onChange={(e) => setNewCert({ ...newCert, syllabus_id: e.target.value })} className="w-full bg-[#FAF8F3] p-3 rounded-xl outline-none border border-[#E6E0D2] focus:border-[#B8862E] font-bold text-[#14161F] text-sm">
                  <option value="">Select a course...</option>
                  {syllabi.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div><label className="block text-[10px] font-bold text-[#857D6E] uppercase mb-1">Issue Date</label><input required type="date" value={newCert.issue_date} onChange={(e) => setNewCert({ ...newCert, issue_date: e.target.value })} className="w-full bg-[#FAF8F3] p-3 rounded-xl outline-none border border-[#E6E0D2] focus:border-[#B8862E] font-bold text-[#14161F] text-sm" /></div>
              <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-[#E6E0D2]">
                <button type="button" onClick={() => setShowAdd(false)} className="px-4 py-2 font-bold text-[#857D6E] hover:text-[#14161F] transition-colors text-sm">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="px-6 py-2.5 rounded-xl font-bold bg-[#14161F] text-white shadow-lg hover:bg-[#22242F] transition-colors text-sm disabled:opacity-50">Issue</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </motion.div>
  );
}

/* ============================================================================
   CHAT MODAL
============================================================================ */
function ChatModal({ userId, onClose, profilesMap }: { userId: string, onClose: () => void, profilesMap: any }) {
  const supabase = useSupabase();
  const [messages, setMessages] = useState<any[]>([]);
  const [reply, setReply] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchChat = async () => {
      const { data } = await supabase.from('messages').select('*').eq('user_id', userId).order('created_at', { ascending: true });
      if (data) setMessages(data);
      await supabase.from('messages').update({ is_read: true }).eq('user_id', userId).eq('sender_role', 'user').eq('is_read', false);
    };
    fetchChat();

    const channel = supabase.channel(`chat_${userId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `user_id=eq.${userId}` }, (payload) => {
        setMessages((prev) => [...prev, payload.new]);
        if (payload.new.sender_role === 'user') supabase.from('messages').update({ is_read: true }).eq('id', payload.new.id);
      }).subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId, supabase]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reply.trim()) return;
    const msg = reply.trim();
    setReply("");
    const { error } = await supabase.from('messages').insert([{ user_id: userId, sender_role: 'admin', content: msg, is_read: true }]);
    if (error) alert("Failed to send message: " + error.message);
  };

  const name = profilesMap?.full_name || "User Chat";
  
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-[#14161F]/60 p-2 sm:p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col h-[85vh] sm:h-[80vh] border border-[#E6E0D2]" onClick={e => e.stopPropagation()}>
        <div className="p-4 sm:p-5 border-b border-[#E6E0D2] flex justify-between items-center bg-[#FAF8F3] rounded-t-2xl shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#EFEBE1] flex items-center justify-center font-bold text-[#857D6E] overflow-hidden shadow-sm">
              {profilesMap?.avatar_url ? <img src={profilesMap.avatar_url} className="w-full h-full object-cover" alt="" /> : name.charAt(0)}
            </div>
            <div>
              <h3 className="font-bold text-[#14161F] text-sm sm:text-base">{name}</h3>
              <p className="text-[10px] sm:text-xs font-bold text-[#0E7C7B] uppercase tracking-widest">Live Support</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-[#B4AF9F] hover:bg-[#EFEBE1] rounded-full transition-colors"><X size={20} /></button>
        </div>
        
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-white bg-opacity-50" style={{ backgroundImage: "radial-gradient(#E6E0D2 1px, transparent 1px)", backgroundSize: "20px 20px" }}>
          {messages.map((msg, i) => {
            const isAdmin = msg.sender_role === 'admin';
            const showTime = i === 0 || new Date(msg.created_at).getTime() - new Date(messages[i-1].created_at).getTime() > 300000;
            return (
              <div key={msg.id} className="flex flex-col">
                {showTime && <span className="text-[9px] sm:text-[10px] font-bold text-[#B4AF9F] text-center my-2 uppercase tracking-widest">{new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>}
                <div className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-2.5 text-sm font-medium shadow-sm ${isAdmin ? 'bg-[#14161F] text-white rounded-br-sm self-end' : 'bg-white border border-[#E6E0D2] text-[#14161F] rounded-bl-sm self-start'}`}>
                  {msg.content}
                </div>
              </div>
            );
          })}
          {messages.length === 0 && <div className="h-full flex items-center justify-center text-sm font-bold text-[#B4AF9F] italic">No messages yet. Start the conversation.</div>}
        </div>
        
        <form onSubmit={handleSend} className="p-3 sm:p-4 border-t border-[#E6E0D2] bg-[#FAF8F3] rounded-b-2xl flex gap-2 shrink-0">
          <input type="text" value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Type your reply..." className="flex-1 bg-white border border-[#E6E0D2] rounded-xl px-4 py-3 text-sm font-medium text-[#14161F] outline-none focus:border-[#B8862E] focus:ring-1 focus:ring-[#B8862E] transition-all shadow-sm" />
          <button type="submit" disabled={!reply.trim()} className="bg-[#14161F] text-white p-3 rounded-xl hover:bg-[#22242F] disabled:opacity-50 transition-colors shadow-sm flex items-center justify-center w-12 h-12 shrink-0"><Send size={18} /></button>
        </form>
      </div>
    </div>
  );
}