"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import {
  Users,
  BookOpen,
  Download,
  Plus,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronRight,
  ArrowLeft,
  Calendar,
  Link as LinkIcon,
  MessageCircle,
  Wallet,
  Settings,
  Trash2,
  Filter,
  FileText
} from "lucide-react";

// ==========================================
// 1. SUPABASE CLIENT INITIALIZATION
// ==========================================
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ==========================================
// 2. TYPESCRIPT INTERFACES
// ==========================================
export interface OnlineCourse {
  syllabus_id: number;
  name: string;
  fee: number;
  discount: number;
  active_batch_no: number;
  is_active: boolean;
}

export interface CourseBatch {
  id: string;
  syllabus_id: number;
  course_name: string;
  batch_no: number;
  start_datetime: string | null;
  timing: string | null;
  online_class_link: string | null;
  google_classroom_link: string | null;
  whatsapp_group_link: string | null;
  is_active: boolean;
}

export interface Enrollment {
  id: string;
  user_id: string | null;
  batch_id: string | null;
  full_name: string;
  email: string;
  whatsapp_number: string;
  is_confirmed: boolean;
  remarks: string | null;
  created_at?: string;
}

export interface Order {
  id: string;
  enrollment_id: string;
  paid_amount: number;
  locked_price: number;
}

// ==========================================
// UTILITY FUNCTIONS
// ==========================================
const formatNrs = (amount: number) => {
  return `Nrs ${amount.toLocaleString("en-IN")}`;
};

// ==========================================
// 3. MAIN CONTAINER COMPONENT
// ==========================================
export default function OnlineCourseAdmin() {
  const [activeTab, setActiveTab] = useState<"batches" | "bookings">("bookings");

  // Shared State
  const [courses, setCourses] = useState<OnlineCourse[]>([]);
  const [batches, setBatches] = useState<CourseBatch[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch all data
  const fetchAllData = async (silent = false) => {
    if (!silent) setIsLoading(true);
    
    const [coursesRes, batchesRes, enrollmentsRes, ordersRes] = await Promise.all([
      supabase.from("online_courses_v2").select("*").order("name"),
      supabase.from("course_batches_v2").select("*").order("batch_no", { ascending: false }),
      supabase.from("enrollments_v2").select("*").order("created_at", { ascending: false }),
      supabase.from("orders_v2").select("*"),
    ]);

    if (coursesRes.error) console.error("Courses Fetch Error:", coursesRes.error);
    if (batchesRes.error) console.error("Batches Fetch Error:", batchesRes.error);
    if (enrollmentsRes.error) console.error("Enrollments Fetch Error:", enrollmentsRes.error);
    if (ordersRes.error) console.error("Orders Fetch Error:", ordersRes.error);

    if (coursesRes.data) setCourses(coursesRes.data);
    if (batchesRes.data) setBatches(batchesRes.data);
    if (enrollmentsRes.data) setEnrollments(enrollmentsRes.data);
    if (ordersRes.data) setOrders(ordersRes.data);
    
    if (!silent) setIsLoading(false);
  };

  // Setup Realtime subscriptions
  useEffect(() => {
    fetchAllData();

    const channel = supabase
      .channel("online_course_dashboard")
      .on("postgres_changes", { event: "*", schema: "public", table: "online_courses_v2" }, () => fetchAllData(true))
      .on("postgres_changes", { event: "*", schema: "public", table: "course_batches_v2" }, () => fetchAllData(true))
      .on("postgres_changes", { event: "*", schema: "public", table: "enrollments_v2" }, () => fetchAllData(true))
      .on("postgres_changes", { event: "*", schema: "public", table: "orders_v2" }, () => fetchAllData(true))
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-6 md:p-10 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* HEADER & TABS */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900">
              Online Courses
            </h1>
            <p className="text-slate-500 font-medium mt-1">
              Manage curriculums, cohorts, and student financials.
            </p>
          </div>

          <div className="flex p-1 bg-slate-200/60 rounded-xl">
            <button
              onClick={() => setActiveTab("batches")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold text-sm transition-all ${
                activeTab === "batches"
                  ? "bg-white text-indigo-600 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <BookOpen size={18} />
              Course & Batches
            </button>
            <button
              onClick={() => setActiveTab("bookings")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold text-sm transition-all ${
                activeTab === "bookings"
                  ? "bg-white text-indigo-600 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Users size={18} />
              Student Bookings
            </button>
          </div>
        </div>

        {/* LOADING STATE OR ACTIVE MODULE */}
        {isLoading ? (
          <div className="h-64 flex items-center justify-center">
            <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full" />
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {activeTab === "batches" && (
              <motion.div
                key="batches"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <BatchManager courses={courses} batches={batches} refreshData={fetchAllData} />
              </motion.div>
            )}
            {activeTab === "bookings" && (
              <motion.div
                key="bookings"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <BookingsManager
                  courses={courses}
                  batches={batches}
                  enrollments={enrollments}
                  orders={orders}
                  refreshData={fetchAllData}
                />
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}

// ==========================================
// 4. MODULE A: BATCH MANAGER
// ==========================================
function BatchManager({
  courses,
  batches,
  refreshData,
}: {
  courses: OnlineCourse[];
  batches: CourseBatch[];
  refreshData: (silent?: boolean) => void;
}) {
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);

  // Modal States
  const [isCourseModalOpen, setCourseModalOpen] = useState(false);
  const [isBatchModalOpen, setBatchModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Partial<OnlineCourse>>({});
  const [editingBatch, setEditingBatch] = useState<Partial<CourseBatch>>({});

  const activeCourse = courses.find((c) => c.syllabus_id === selectedCourseId);
  const filteredBatches = batches.filter((b) => b.syllabus_id === selectedCourseId);

  // --- Handlers ---
  const saveCourse = async () => {
    if (!editingCourse.name || editingCourse.fee === undefined) return alert("Title and Fee required.");
    const payload = {
      ...editingCourse,
      discount: editingCourse.discount || 0,
      active_batch_no: editingCourse.active_batch_no || 1,
      is_active: editingCourse.is_active ?? true,
    };

    if (editingCourse.syllabus_id) {
      await supabase.from("online_courses_v2").update(payload).eq("syllabus_id", editingCourse.syllabus_id);
    } else {
      await supabase.from("online_courses_v2").insert(payload);
    }
    setCourseModalOpen(false);
    refreshData(true);
  };

  const saveBatch = async () => {
    if (!editingBatch.start_datetime || editingBatch.batch_no === undefined) return alert("Start date and Batch Number required.");
    const payload = {
      ...editingBatch,
      syllabus_id: selectedCourseId,
      course_name: activeCourse?.name || "Unknown Course",
      is_active: editingBatch.is_active ?? true,
    };

    if (editingBatch.id) {
      await supabase.from("course_batches_v2").update(payload).eq("id", editingBatch.id);
    } else {
      await supabase.from("course_batches_v2").insert(payload);
    }
    setBatchModalOpen(false);
    refreshData(true);
  };

  const toggleCourseStatus = async (syllabus_id: number, current: boolean) => {
    await supabase.from("online_courses_v2").update({ is_active: !current }).eq("syllabus_id", syllabus_id);
    refreshData(true);
  };

  const toggleBatchStatus = async (id: string, current: boolean) => {
    await supabase.from("course_batches_v2").update({ is_active: !current }).eq("id", id);
    refreshData(true);
  };

  return (
    <div className="bg-white rounded-[24px] shadow-sm border border-slate-200 overflow-hidden min-h-[500px]">
      <AnimatePresence mode="wait">
        {/* ROOT VIEW: COURSES */}
        {!selectedCourseId ? (
          <motion.div
            key="root"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="p-6 md:p-8"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Settings className="text-indigo-500" size={24} /> 
                Course Catalog
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-xs font-black text-slate-400 uppercase tracking-widest">
                    <th className="p-4 rounded-tl-xl">Course Title</th>
                    <th className="p-4">Financials</th>
                    <th className="p-4">Active Batch</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 rounded-tr-xl text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {courses.map((course) => (
                    <tr key={course.syllabus_id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 font-bold text-slate-900">{course.name}</td>
                      <td className="p-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-slate-700">{formatNrs(course.fee)}</span>
                          <span className="text-xs text-emerald-600 font-bold bg-emerald-50 w-fit px-2 py-0.5 rounded-md mt-1">
                            -{formatNrs(course.discount)} Off
                          </span>
                        </div>
                      </td>
                      <td className="p-4 font-bold text-indigo-600">Cohort #{course.active_batch_no}</td>
                      <td className="p-4">
                        <button
                          onClick={() => toggleCourseStatus(course.syllabus_id, course.is_active)}
                          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                            course.is_active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {course.is_active ? <CheckCircle size={14} /> : <XCircle size={14} />}
                          {course.is_active ? "Active" : "Inactive"}
                        </button>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <button
                            onClick={() => { setEditingCourse(course); setCourseModalOpen(true); }}
                            className="text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => setSelectedCourseId(course.syllabus_id)}
                            className="text-sm font-bold bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors"
                          >
                            View Batches
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {courses.length === 0 && (
                     <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-400 font-medium">No courses created yet.</td>
                     </tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        ) : (
          /* DRILL-DOWN VIEW: BATCHES */
          <motion.div
            key="drilldown"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="p-6 md:p-8"
          >
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
              <div>
                <button
                  onClick={() => setSelectedCourseId(null)}
                  className="text-slate-400 hover:text-slate-800 flex items-center gap-2 font-bold text-sm transition-colors mb-2"
                >
                  <ArrowLeft size={16} /> Back to Courses
                </button>
                <h2 className="text-2xl font-black text-slate-900">{activeCourse?.name} - Batches</h2>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => { setEditingBatch({ batch_no: (activeCourse?.active_batch_no || 0) + 1 }); setBatchModalOpen(true); }}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 transition-colors shadow-sm shadow-indigo-600/20"
                >
                  <Plus size={16} /> Add Batch
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-xs font-black text-slate-400 uppercase tracking-widest">
                    <th className="p-4 rounded-tl-xl">Batch #</th>
                    <th className="p-4">Start Date</th>
                    <th className="p-4">Resources</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 rounded-tr-xl text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredBatches.map((batch) => (
                    <tr key={batch.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 font-black text-lg text-slate-900">#{batch.batch_no}</td>
                      <td className="p-4 font-bold text-slate-600 flex items-center gap-2">
                        <Calendar size={16} className="text-slate-400"/>
                        {batch.start_datetime ? new Date(batch.start_datetime).toLocaleDateString() : "TBD"}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          {batch.online_class_link && (
                            <a href={batch.online_class_link} target="_blank" className="text-indigo-600 hover:text-indigo-800 bg-indigo-50 p-2 rounded-lg" title="Meet Link">
                              <LinkIcon size={16} />
                            </a>
                          )}
                          {batch.whatsapp_group_link && (
                            <a href={batch.whatsapp_group_link} target="_blank" className="text-emerald-600 hover:text-emerald-800 bg-emerald-50 p-2 rounded-lg" title="WhatsApp Link">
                              <MessageCircle size={16} />
                            </a>
                          )}
                           {batch.google_classroom_link && (
                            <a href={batch.google_classroom_link} target="_blank" className="text-amber-600 hover:text-amber-800 bg-amber-50 p-2 rounded-lg" title="Classroom Link">
                              <BookOpen size={16} />
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <button
                          onClick={() => toggleBatchStatus(batch.id, batch.is_active)}
                          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                            batch.is_active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {batch.is_active ? <CheckCircle size={14} /> : <XCircle size={14} />}
                          {batch.is_active ? "Active" : "Inactive"}
                        </button>
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => { setEditingBatch(batch); setBatchModalOpen(true); }}
                          className="text-sm font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredBatches.length === 0 && (
                     <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-400 font-medium">No batches created for this course yet.</td>
                     </tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODALS */}
      <AnimatePresence>
        {isCourseModalOpen && (
          <ModalOverlay onClose={() => setCourseModalOpen(false)}>
            <h3 className="text-2xl font-black text-slate-900 mb-6">{editingCourse.syllabus_id ? "Edit Course" : "New Course"}</h3>
            <div className="space-y-4">
              <label className="block text-sm font-bold text-slate-700">Course Title
                <input type="text" className="mt-1 w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200" 
                  value={editingCourse.name || ""} onChange={e => setEditingCourse({...editingCourse, name: e.target.value})} />
              </label>
              <div className="grid grid-cols-2 gap-4">
                <label className="block text-sm font-bold text-slate-700">Base Fee (Nrs)
                  <input type="number" className="mt-1 w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200" 
                    value={editingCourse.fee || ""} onChange={e => setEditingCourse({...editingCourse, fee: Number(e.target.value)})} />
                </label>
                <label className="block text-sm font-bold text-slate-700">Discount (Nrs)
                  <input type="number" className="mt-1 w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200" 
                    value={editingCourse.discount || ""} onChange={e => setEditingCourse({...editingCourse, discount: Number(e.target.value)})} />
                </label>
              </div>
              <label className="block text-sm font-bold text-slate-700">Current Active Batch Number
                  <input type="number" className="mt-1 w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200" 
                    value={editingCourse.active_batch_no || ""} onChange={e => setEditingCourse({...editingCourse, active_batch_no: Number(e.target.value)})} />
              </label>
              <button onClick={saveCourse} className="w-full mt-4 bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 transition-colors">Save Course</button>
            </div>
          </ModalOverlay>
        )}

        {isBatchModalOpen && (
          <ModalOverlay onClose={() => setBatchModalOpen(false)}>
            <h3 className="text-2xl font-black text-slate-900 mb-6">{editingBatch.id ? "Edit Batch" : "New Batch"}</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <label className="block text-sm font-bold text-slate-700">Batch Number
                  <input type="number" className="mt-1 w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200" 
                    value={editingBatch.batch_no || ""} onChange={e => setEditingBatch({...editingBatch, batch_no: Number(e.target.value)})} />
                </label>
                <label className="block text-sm font-bold text-slate-700">Start Date
                  <input type="date" className="mt-1 w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200" 
                    value={editingBatch.start_datetime ? editingBatch.start_datetime.split('T')[0] : ""} onChange={e => setEditingBatch({...editingBatch, start_datetime: e.target.value})} />
                </label>
              </div>
              <label className="block text-sm font-bold text-slate-700">Online Class Link (Meet/Zoom)
                  <input type="url" className="mt-1 w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200" 
                    value={editingBatch.online_class_link || ""} onChange={e => setEditingBatch({...editingBatch, online_class_link: e.target.value})} />
              </label>
              <label className="block text-sm font-bold text-slate-700">WhatsApp Group Link
                  <input type="url" className="mt-1 w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200" 
                    value={editingBatch.whatsapp_group_link || ""} onChange={e => setEditingBatch({...editingBatch, whatsapp_group_link: e.target.value})} />
              </label>
              <label className="block text-sm font-bold text-slate-700">Google Classroom Link
                  <input type="url" className="mt-1 w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200" 
                    value={editingBatch.google_classroom_link || ""} onChange={e => setEditingBatch({...editingBatch, google_classroom_link: e.target.value})} />
              </label>
              <button onClick={saveBatch} className="w-full mt-4 bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 transition-colors">Save Batch</button>
            </div>
          </ModalOverlay>
        )}
      </AnimatePresence>
    </div>
  );
}


// ==========================================
// 5. MODULE B: BOOKINGS MANAGER
// ==========================================
function BookingsManager({
  courses,
  batches,
  enrollments,
  orders,
  refreshData
}: {
  courses: OnlineCourse[];
  batches: CourseBatch[];
  enrollments: Enrollment[];
  orders: Order[];
  refreshData: (silent?: boolean) => void;
}) {
  // Navigation State
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null); 
  
  // Pagination & Filter State
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<"all" | "confirmed" | "pending">("all");
  const itemsPerPage = 20;

  // Modals
  const [isManualBookingModalOpen, setManualBookingModalOpen] = useState(false);
  const [isPaymentModalOpen, setPaymentModalOpen] = useState(false);
  
  // Forms
  const [manualForm, setManualForm] = useState({ full_name: "", email: "", phone: "", is_confirmed: true, locked_price: 0, paid_amount: 0 });
  const [paymentForm, setPaymentForm] = useState({ enrollment_id: "", paid_amount: 0, locked_price: 0 });

  // Derived Data & Filtering (Now with strict client-side sorting)
  const courseBatches = batches.filter(b => b.syllabus_id === selectedCourseId);
  
  const filteredEnrollments = enrollments.filter(e => {
    // 1. Filter by Batch
    const matchBatch = selectedBatchId === "unassigned" ? e.batch_id === null : e.batch_id === selectedBatchId;
    if (!matchBatch) return false;
    
    // 2. Filter by Status
    if (statusFilter === "confirmed" && !e.is_confirmed) return false;
    if (statusFilter === "pending" && e.is_confirmed) return false;
    
    return true;
  }).sort((a, b) => {
    // Enforce newest first by sorting on the client side
    const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
    const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
    
    if (dateA !== dateB) return dateB - dateA; // Descending time
    
    // Fallback: reverse ID to guarantee non-alphabetical newest-first if created_at is identical/missing
    return (b.id || "").localeCompare(a.id || ""); 
  });

  // Pagination Logic
  const totalPages = Math.ceil(filteredEnrollments.length / itemsPerPage);
  const paginatedEnrollments = filteredEnrollments.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Financial Aggregates
  const stats = useMemo(() => {
    let predicted = 0;
    let collected = 0;
    filteredEnrollments.forEach(enroll => {
      if (enroll.is_confirmed) {
        const order = orders.find(o => o.enrollment_id === enroll.id);
        if (order) {
          predicted += order.locked_price;
          collected += order.paid_amount;
        }
      }
    });
    return { predicted, collected, remaining: predicted - collected };
  }, [filteredEnrollments, orders]);


  // --- Handlers ---
  const handleCourseClick = (syllabus_id: number) => {
    setSelectedCourseId(syllabus_id);
    setSelectedBatchId(null); // Reset batch when course changes
    setCurrentPage(1);
  };

  const openManualBooking = () => {
    const selectedCourse = courses.find(c => c.syllabus_id === selectedCourseId);
    const defaultLockedPrice = selectedCourse ? (selectedCourse.fee - selectedCourse.discount) : 0;
    
    setManualForm({
      full_name: "",
      email: "",
      phone: "",
      is_confirmed: true,
      locked_price: defaultLockedPrice,
      paid_amount: 0
    });
    setManualBookingModalOpen(true);
  };

  const saveManualBooking = async () => {
    if(!manualForm.full_name || !manualForm.email) return alert("Name and Email required.");
    const targetBatch = selectedBatchId === "unassigned" ? null : selectedBatchId;
    
    // Insert Enrollment
    const { data: encData, error: encError } = await supabase.from("enrollments_v2").insert({
      full_name: manualForm.full_name,
      email: manualForm.email,
      whatsapp_number: manualForm.phone,
      batch_id: targetBatch,
      is_confirmed: manualForm.is_confirmed
    }).select().single();

    if (encError) return alert(encError.message);

    // Auto-generate Order with inputted financials
    await supabase.from("orders_v2").insert({
      enrollment_id: encData.id,
      paid_amount: manualForm.paid_amount,
      locked_price: manualForm.locked_price
    });

    setManualBookingModalOpen(false);
    refreshData(true);
  };

  const savePayment = async () => {
    const existingOrder = orders.find(o => o.enrollment_id === paymentForm.enrollment_id);
    if (existingOrder) {
      await supabase.from("orders_v2").update({
        paid_amount: paymentForm.paid_amount,
        locked_price: paymentForm.locked_price
      }).eq("id", existingOrder.id);
    } else {
      await supabase.from("orders_v2").insert(paymentForm);
    }
    setPaymentModalOpen(false);
    refreshData(true);
  };

  const toggleConfirmation = async (id: string, current: boolean) => {
    await supabase.from("enrollments_v2").update({ is_confirmed: !current }).eq("id", id);
    refreshData(true);
  };

  const deleteBooking = async (id: string) => {
    if (window.confirm("Are you sure you want to permanently delete this booking?")) {
      await supabase.from("enrollments_v2").delete().eq("id", id);
      refreshData(true);
    }
  };

  const handleExportCSV = () => {
    const headers = "Name,Email,WhatsApp Number,Syllabus ID,Locked Fee,Paid Fee,Remaining Fee\n";
    const rows = filteredEnrollments.map(e => {
        const syllabusIdStr = selectedCourseId || "";
        const order = orders.find(o => o.enrollment_id === e.id);
        const lockedPrice = order?.locked_price || 0;
        const paidAmount = order?.paid_amount || 0;
        const remainingFee = lockedPrice - paidAmount;

        return `"${e.full_name}","${e.email}","${e.whatsapp_number}","${syllabusIdStr}","${lockedPrice}","${paidAmount}","${remainingFee}"`;
    }).join('\n');
    
    const csvContent = headers + rows;

    navigator.clipboard.writeText(csvContent)
      .then(() => alert("CSV copied to clipboard!"))
      .catch((err) => {
        console.error("Failed to copy CSV: ", err);
        alert("Failed to copy to clipboard.");
      });
  };

  return (
    <div className="space-y-6">
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-6 rounded-[24px] border border-slate-200 shadow-sm">
        {/* STEP 1: COURSE SELECTION */}
        <div>
          <label className="block text-sm font-black text-slate-400 uppercase tracking-widest mb-3">
            Step 1: Select Course
          </label>
          <select
            value={selectedCourseId || ""}
            onChange={(e) => handleCourseClick(Number(e.target.value))}
            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 font-bold text-slate-700 cursor-pointer"
          >
            <option value="" disabled>-- Select a Course --</option>
            {courses.map(course => (
              <option key={course.syllabus_id} value={course.syllabus_id}>
                {course.name} (Cohort #{course.active_batch_no})
              </option>
            ))}
          </select>
        </div>

        {/* STEP 2: BATCH SELECTION */}
        {selectedCourseId && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <label className="block text-sm font-black text-slate-400 uppercase tracking-widest mb-3">
              Step 2: Select Cohort
            </label>
            <select
              value={selectedBatchId || ""}
              onChange={(e) => { setSelectedBatchId(e.target.value); setCurrentPage(1); }}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 font-bold text-slate-700 cursor-pointer"
            >
              <option value="" disabled>-- Select a Batch --</option>
              {courseBatches.map(batch => (
                <option key={batch.id} value={batch.id}>
                  Batch #{batch.batch_no}
                </option>
              ))}
              <option value="unassigned">Unassigned / Leads</option>
            </select>
          </motion.div>
        )}
      </div>

      {/* STEP 3: ENROLLMENT TABLE & AGGREGATES */}
      <AnimatePresence>
        {selectedBatchId && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-[24px] shadow-sm border border-slate-200 overflow-hidden mt-8"
          >
            {/* Header Panel */}
            <div className="p-6 md:p-8 border-b border-slate-100 bg-slate-50">
              <div className="flex flex-col xl:flex-row justify-between gap-6">
                
                {/* Financial Aggregates */}
                <div className="flex flex-wrap gap-4">
                  <div className="bg-white px-5 py-4 rounded-xl border border-slate-200 shadow-sm min-w-[180px]">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Predicted Volume</p>
                    <p className="text-2xl font-black text-slate-900 mt-1">{formatNrs(stats.predicted)}</p>
                  </div>
                  <div className="bg-emerald-50 px-5 py-4 rounded-xl border border-emerald-100 shadow-sm min-w-[180px]">
                    <p className="text-[10px] font-black uppercase text-emerald-600 tracking-widest">Collected Volume</p>
                    <p className="text-2xl font-black text-emerald-700 mt-1">{formatNrs(stats.collected)}</p>
                  </div>
                  <div className="bg-orange-50 px-5 py-4 rounded-xl border border-orange-100 shadow-sm min-w-[180px]">
                    <p className="text-[10px] font-black uppercase text-orange-600 tracking-widest">Remaining Volume</p>
                    <p className="text-2xl font-black text-orange-700 mt-1">{formatNrs(stats.remaining)}</p>
                  </div>
                </div>

                {/* Actions & Filters */}
                <div className="flex flex-wrap items-end justify-end gap-3 shrink-0">
                  <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2.5 shadow-sm">
                    <Filter size={16} className="text-slate-400" />
                    <select
                      className="bg-transparent text-sm font-bold text-slate-700 outline-none cursor-pointer"
                      value={statusFilter}
                      onChange={(e) => { setStatusFilter(e.target.value as any); setCurrentPage(1); }}
                    >
                      <option value="all">All Status</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="pending">Pending</option>
                    </select>
                  </div>

                  <button onClick={handleExportCSV} className="text-sm font-bold bg-slate-900 text-white px-4 py-2.5 rounded-xl hover:bg-slate-800 transition-colors flex items-center gap-2 shadow-sm">
                    <Download size={16} /> Export to Clipboard
                  </button>
                  <button onClick={openManualBooking} className="text-sm font-bold bg-indigo-600 text-white px-4 py-2.5 rounded-xl hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-sm shadow-indigo-600/20">
                    <Plus size={16} /> Manual Booking
                  </button>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left">
                <thead className="bg-white text-xs font-black text-slate-400 uppercase tracking-widest">
                  <tr>
                    <th className="px-6 py-4">Student</th>
                    <th className="px-6 py-4">Contact</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Financials</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {paginatedEnrollments.map(enrollment => {
                    const order = orders.find(o => o.enrollment_id === enrollment.id);
                    const isPendingFunds = order && order.paid_amount < order.locked_price;
                    const isUnassigned = enrollment.batch_id === null;

                    return (
                      <tr key={enrollment.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <p className="font-bold text-slate-900">{enrollment.full_name}</p>
                          <div className="flex items-center gap-2 mt-1">
                             {isUnassigned && (
                                <span className="flex items-center gap-1 text-[10px] bg-orange-100 text-orange-700 px-2 py-0.5 rounded-md font-bold uppercase tracking-widest">
                                  <AlertCircle size={10} /> Needs Batch
                                </span>
                             )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-slate-600 font-medium">{enrollment.email}</p>
                          <p className="text-xs text-slate-400 font-medium mt-0.5">{enrollment.whatsapp_number}</p>
                        </td>
                        <td className="px-6 py-4">
                           <button
                            onClick={() => toggleConfirmation(enrollment.id, enrollment.is_confirmed)}
                            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                              enrollment.is_confirmed ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                            }`}
                          >
                            {enrollment.is_confirmed ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                            {enrollment.is_confirmed ? "Confirmed" : "Pending"}
                          </button>
                        </td>
                        <td className="px-6 py-4">
                          {order ? (
                            <div className="flex flex-col gap-1">
                              <span className="text-sm font-bold text-slate-900">Paid: {formatNrs(order.paid_amount)}</span>
                              <span className="text-xs text-slate-500 font-medium">Locked: {formatNrs(order.locked_price)}</span>
                              {isPendingFunds && (
                                <span className="text-[10px] font-black uppercase text-red-500 tracking-wider">
                                  Due: {formatNrs(order.locked_price - order.paid_amount)}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400 italic">No Financial Record</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {/* VIEW INVOICE BUTTON */}
                            {order && (
                              <Link
                                href={`/invoice/${order.id}`}
                                className="text-sm font-bold bg-slate-50 border border-slate-200 text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 px-3 py-1.5 rounded-lg transition-colors inline-flex items-center gap-1.5"
                                title="View Generated Invoice"
                              >
                                <FileText size={14} /> Invoice
                              </Link>
                            )}

                            <button
                              onClick={() => {
                                setPaymentForm({
                                  enrollment_id: enrollment.id,
                                  paid_amount: order?.paid_amount || 0,
                                  locked_price: order?.locked_price || 0
                                });
                                setPaymentModalOpen(true);
                              }}
                              className="text-sm font-bold bg-slate-100 text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 px-3 py-1.5 rounded-lg transition-colors inline-flex items-center gap-1.5"
                            >
                              <Wallet size={14} /> Edit Finances
                            </button>
                            <button
                              onClick={() => deleteBooking(enrollment.id)}
                              className="text-sm font-bold bg-red-50 text-red-600 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors inline-flex items-center gap-1.5"
                              title="Delete Booking"
                            >
                              <Trash2 size={14} /> Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {paginatedEnrollments.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-medium">
                        No enrollments found for this selection.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
                <span className="text-sm font-bold text-slate-500">
                  Page {currentPage} of {totalPages}
                </span>
                <div className="flex gap-2">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(p => p - 1)}
                    className="px-4 py-2 rounded-lg border border-slate-200 bg-white font-bold text-sm text-slate-600 disabled:opacity-50 hover:bg-slate-50"
                  >
                    Previous
                  </button>
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(p => p + 1)}
                    className="px-4 py-2 rounded-lg border border-slate-200 bg-white font-bold text-sm text-slate-600 disabled:opacity-50 hover:bg-slate-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODALS */}
      <AnimatePresence>
        {isManualBookingModalOpen && (
           <ModalOverlay onClose={() => setManualBookingModalOpen(false)}>
            <h3 className="text-2xl font-black text-slate-900 mb-6">Manual Booking</h3>
            <div className="space-y-4">
              <label className="block text-sm font-bold text-slate-700">Student Full Name
                <input type="text" className="mt-1 w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200" 
                  value={manualForm.full_name} onChange={e => setManualForm({...manualForm, full_name: e.target.value})} />
              </label>
              <div className="grid grid-cols-2 gap-4">
                <label className="block text-sm font-bold text-slate-700">Email
                  <input type="email" className="mt-1 w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200" 
                    value={manualForm.email} onChange={e => setManualForm({...manualForm, email: e.target.value})} />
                </label>
                <label className="block text-sm font-bold text-slate-700">Phone (WhatsApp)
                  <input type="text" className="mt-1 w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200" 
                    value={manualForm.phone} onChange={e => setManualForm({...manualForm, phone: e.target.value})} />
                </label>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <label className="block text-sm font-bold text-slate-700">Locked Fee (Nrs)
                  <input type="number" className="mt-1 w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200" 
                    value={manualForm.locked_price} onChange={e => setManualForm({...manualForm, locked_price: Number(e.target.value)})} />
                </label>
                <label className="block text-sm font-bold text-slate-700">Paid Amount (Nrs)
                  <input type="number" className="mt-1 w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200" 
                    value={manualForm.paid_amount} onChange={e => setManualForm({...manualForm, paid_amount: Number(e.target.value)})} />
                </label>
              </div>

              <label className="flex items-center gap-3 mt-4 cursor-pointer bg-slate-50 p-4 rounded-xl border border-slate-200">
                <input type="checkbox" className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" 
                  checked={manualForm.is_confirmed} onChange={e => setManualForm({...manualForm, is_confirmed: e.target.checked})} />
                <span className="font-bold text-slate-700 text-sm">Mark as Confirmed Registration</span>
              </label>
              <button onClick={saveManualBooking} className="w-full mt-6 bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 transition-colors">Create Booking</button>
            </div>
           </ModalOverlay>
        )}

        {isPaymentModalOpen && (
           <ModalOverlay onClose={() => setPaymentModalOpen(false)}>
            <h3 className="text-2xl font-black text-slate-900 mb-6 flex items-center gap-2">
              <Wallet className="text-indigo-600" /> Adjust Finances
            </h3>
            <div className="space-y-4">
               <label className="block text-sm font-bold text-slate-700">Paid Amount (Nrs)
                  <input type="number" className="mt-1 w-full p-3 bg-emerald-50 border border-emerald-200 rounded-xl outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 text-emerald-900 font-bold" 
                    value={paymentForm.paid_amount} onChange={e => setPaymentForm({...paymentForm, paid_amount: Number(e.target.value)})} />
              </label>
              <label className="block text-sm font-bold text-slate-700">Locked Price / Total Fee (Nrs)
                  <input type="number" className="mt-1 w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200" 
                    value={paymentForm.locked_price} onChange={e => setPaymentForm({...paymentForm, locked_price: Number(e.target.value)})} />
              </label>
              <button onClick={savePayment} className="w-full mt-6 bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 transition-colors">Update Financials</button>
            </div>
           </ModalOverlay>
        )}
      </AnimatePresence>
    </div>
  );
}

// ==========================================
// 6. SHARED COMPONENTS
// ==========================================
function ModalOverlay({ children, onClose }: { children: React.ReactNode, onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="bg-white w-full max-w-lg rounded-[32px] p-8 shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          onClick={onClose} 
          className="absolute top-6 right-6 p-2 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-900 transition-colors"
        >
          <XCircle size={20} />
        </button>
        {children}
      </motion.div>
    </motion.div>
  );
}