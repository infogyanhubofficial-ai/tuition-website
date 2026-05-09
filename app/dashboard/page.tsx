"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { 
  BookOpen, PlayCircle, Award, Clock, Check, Calendar, Lock, 
  AlertCircle, ShoppingBag, ExternalLink, Video, Crown, X, Copy, 
  CheckCircle, MessageCircle, Sparkles, Monitor, Compass, BarChart, ArrowRight,
  Timer, User
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { SkeletonLoader } from "@/components/dashboard/shared";

// --- BUNDLE DEFINITIONS ---
const BUNDLES: Record<string, string[]> = {
  "architectural design": [
    "AutoCAD Basic to Advanced Course",
    "Autodesk Revit",
    "Architectural Visualization: AutoCAD, SketchUp, Enscape & Photoshop"
  ],
  "architectural design bundle": [
    "AutoCAD Basic to Advanced Course",
    "Autodesk Revit",
    "Architectural Visualization: AutoCAD, SketchUp, Enscape & Photoshop"
  ],
  "civil engineering": [
    "Structural Design and Analysis",
    "Estimation, Costing & Contract Billing",
    "Property Valuation"
  ],
  "civil engineering bundle": [
    "Structural Design and Analysis",
    "Estimation, Costing & Contract Billing",
    "Property Valuation"
  ],
  "complete engineering package": [
    "AutoCAD Basic to Advanced Course",
    "Autodesk Revit",
    "Architectural Visualization: AutoCAD, SketchUp, Enscape & Photoshop",
    "Structural Design and Analysis",
    "Estimation, Costing & Contract Billing",
    "Property Valuation",
    "ArcGIS and Mapping"
  ],
  "complete engineering package bundle": [
    "AutoCAD Basic to Advanced Course",
    "Autodesk Revit",
    "Architectural Visualization: AutoCAD, SketchUp, Enscape & Photoshop",
    "Structural Design and Analysis",
    "Estimation, Costing & Contract Billing",
    "Property Valuation",
    "ArcGIS and Mapping"
  ]
};

// --- HELPER COMPONENTS ---
const Toast = ({ message, type, onClose }: { message: string, type: 'success' | 'error', onClose: () => void }) => (
  <motion.div 
    initial={{ y: 50, opacity: 0, scale: 0.9 }} 
    animate={{ y: 0, opacity: 1, scale: 1 }} 
    exit={{ y: 20, opacity: 0, scale: 0.9 }}
    className="fixed bottom-6 right-6 z-[9999] bg-slate-800 text-white px-5 py-3.5 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.2)] flex items-center gap-3 border border-slate-700"
  >
    {type === 'success' ? <CheckCircle className="text-emerald-400 w-5 h-5" /> : <AlertCircle className="text-red-400 w-5 h-5" />}
    <span className="font-medium text-sm tracking-wide">{message}</span>
    <button onClick={onClose} className="ml-2 text-slate-400 hover:text-white transition-colors"><X size={16} /></button>
  </motion.div>
);

export default function GeneralDashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  // Route-based Tab State
  const initialTab = searchParams.get('tab') || 'Overview';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [loading, setLoading] = useState(true);

  // Floating Feedback System (Toast)
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // User State
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>('');
  const [userName, setUserName] = useState<string>('User');

  // Data States
  const [orders, setOrders] = useState<any[]>([]);
  const [certificates, setCertificates] = useState<any[]>([]);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [courseBatches, setCourseBatches] = useState<any[]>([]);
  const [recordingsList, setRecordingsList] = useState<any[]>([]);
  const [onlineCourseDetails, setOnlineCourseDetails] = useState<any[]>([]);
  
  // Modals
  const [globalExpiredClassLink, setGlobalExpiredClassLink] = useState<string | null>(null);
  const [orientationData, setOrientationData] = useState<{ link: string, date: string } | null>(null);

  // Derived Properties
  const expandedRecordingOrders = useMemo(() => {
    const recOrders = orders.filter(o => o.order_type === 'recording');
    return recOrders.flatMap(o => {
      let rawName = o.order_name.toLowerCase().trim();
      let key = rawName.replace(' (featured)', '').trim();
      
      let courses = BUNDLES[key] || BUNDLES[rawName];
      
      // Fallback: If it still wasn't found and has 'bundle' at the end, try checking without 'bundle'
      if (!courses && key.endsWith(' bundle')) {
         courses = BUNDLES[key.replace(' bundle', '').trim()];
      }

      if (courses) {
        return courses.map((courseName, idx) => ({
          ...o, id: `${o.id}-${idx}`, order_name: courseName, original_bundle: o.order_name
        }));
      }
      return [o];
    });
  }, [orders]);

  const pendingVerificationOrders = useMemo(() =>
    orders.filter(o => (o.pending_amount || 0) > 0 || o.status.toLowerCase() === 'pending' || o.status.toLowerCase() === 'processing'), [orders]);
  
  const pendingCoursePayments = useMemo(() => enrollments.filter(e => e.remaining_amount > 0), [enrollments]);
  const activeCourseAccess = useMemo(() => enrollments, [enrollments]);

  useEffect(() => { document.title = `GyanHub | ${activeTab}`; }, [activeTab]);

  // Real Data Fetching Logic
  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      let currentUser = user;

      if (!currentUser) {
        const { data: { session } } = await supabase.auth.getSession();
        currentUser = session?.user || null;
      }

      if (!currentUser) {
        router.push('/login?next=/dashboard');
        return;
      }
      
      setUserId(currentUser.id);
      setUserEmail(currentUser.email || '');
      setUserName(currentUser.user_metadata?.full_name || 'User');

      const uid = currentUser.id;
      const email = currentUser.email || '';

      try {
        const { data: fetchedOrders, error: err } = await supabase
          .from('orders_v2')
          .select('*')
          .or(`user_id.eq.${uid},email.ilike.${email}`)
          .order('created_at', { ascending: false });

        if (!err && fetchedOrders) {
          const mappedOrders = fetchedOrders
            .filter(o => (o.paid_amount || 0) > 0 || (o.pending_amount || 0) > 0)
            .map(o => ({
              id: o.id, full_name: o.full_name || 'You', email: o.email || email,
              order_type: o.order_type?.toLowerCase() || 'other', order_name: o.order_name,
              price: o.paid_amount || 0, pending_amount: Number(o.pending_amount) || 0,
              remaining_amount: Number(o.remaining_amount) || 0,
              screenshot_url: o.payment_screenshots?.[0] || '', status: o.status || 'pending', 
              created_at: o.created_at, enrollment_id: o.enrollment_id, locked_price: o.locked_price
            }));
          setOrders(mappedOrders);
        }

        const { data: certs } = await supabase.from('certificates').select('*').ilike('email', email);
        if (certs) setCertificates(certs);
        const { data: recordings } = await supabase.from('recordings').select('*');
        if (recordings) setRecordingsList(recordings);

        const { data: enrollsV2 } = await supabase
          .from('enrollments_v2')
          .select('*')
          .or(`user_id.eq.${uid},email.ilike.${email}`)
          .order('created_at', { ascending: false });

        if (enrollsV2 && enrollsV2.length > 0) {
          const batchIds = Array.from(new Set(enrollsV2.map(e => e.batch_id)));
          const { data: batchesV2 } = await supabase.from('course_batches_v2').select('*').in('id', batchIds);
          
          const relatedSyllabusIds: string[] = [];
          batchesV2?.forEach(b => {
            if (b.syllabus_id) relatedSyllabusIds.push(b.syllabus_id);
            if (b.course_id) relatedSyllabusIds.push(b.course_id); 
          });
          
          const { data: coursesV2 } = await supabase.from('online_courses_v2').select('*');
          const { data: syllabiV2 } = await supabase.from('syllabi_v2').select('*').in('id', relatedSyllabusIds);

          const tutorIds = [...new Set(syllabiV2?.map(s => s.tutor_id).filter(Boolean))];
          const { data: tutorsData } = await supabase.from('online_tutors').select('id, name').in('id', tutorIds);
          
          const mappedEnrollments = enrollsV2.map(env2 => {
            const batch = batchesV2?.find(b => b.id === env2.batch_id);
            const targetSyllabusId = batch?.syllabus_id || batch?.course_id;
            const syllabus = syllabiV2?.find(s => s.id === targetSyllabusId);
            const courseStorefront = coursesV2?.find(c => c.syllabus_id === targetSyllabusId || c.id === targetSyllabusId);
            const courseName = syllabus?.name || courseStorefront?.title || 'Unknown Course';

            const relatedOrders = fetchedOrders?.filter(o => 
              o.enrollment_id === env2.id && o.status !== 'rejected'
            ) || [];
            
            const primaryOrder = relatedOrders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

            let literal_paid_amount = 0;
            let literal_remaining_amount = Number(courseStorefront?.fee) || 0; 
            let lockedPrice = literal_remaining_amount;

            if (primaryOrder) {
              literal_paid_amount = Number(primaryOrder.paid_amount);
              literal_remaining_amount = Number(primaryOrder.remaining_amount);
              lockedPrice = Number(primaryOrder.locked_price);
            }

            return {
              id: env2.id,
              user_id: env2.user_id || uid,
              course_id: targetSyllabusId || '',
              batch_id: env2.batch_id,
              email: env2.email,
              course_name: courseName,
              status: env2.is_confirmed ? 'confirmed' : 'pending',
              paid_amount: literal_paid_amount,
              remaining_amount: literal_remaining_amount,
              locked_price: lockedPrice,
              starting_date: batch?.start_datetime || new Date().toISOString(),
              batch_no: batch?.batch_no || 1,
              created_at: env2.created_at,
            };
          }).sort((a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
          
          setEnrollments(mappedEnrollments);
          setCourseBatches(batchesV2 || []);
          
          const mappedCourses = coursesV2?.map(c => {
            const s = syllabiV2?.find(syl => syl.id === c.syllabus_id);
            const t = tutorsData?.find(tut => tut.id === s?.tutor_id);
            return {
              id: c.syllabus_id, title: s?.name || c.name || 'Course', fee: c.fee, discount: c.discount || 0,
              learning_outcomes: s?.learning_outcomes || [], syllabus_url: s?.syllabus_pdf,
              duration: s?.duration, tutor_name: t?.name
            };
          }) || [];
          setOnlineCourseDetails(mappedCourses);
        }
      } catch (err) {
        console.warn("Neutral tables fetch exception:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [supabase, router]);

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    const d = new Date(dateString);
    return isNaN(d.getTime()) ? 'N/A' : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const TABS = [
    { id: 'Overview', icon: BookOpen, label: 'Overview', short: 'Overview' },
    { id: 'Online Courses', icon: Video, label: 'Online Classes', short: 'Live' },
    { id: 'Recording Courses', icon: PlayCircle, label: 'Recordings', short: 'Records' },
    { id: 'My Certificates', icon: Award, label: 'Certificates', short: 'Awards' },
  ];

  return (
    <div className="w-full relative min-h-screen pb-10 font-sans text-slate-800 bg-[#F8FAFC]">
      <AnimatePresence>
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </AnimatePresence>

      <AnimatePresence>
        {pendingVerificationOrders.length > 0 && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="bg-gradient-to-r from-orange-400 to-amber-500 text-white py-2.5 overflow-hidden relative flex items-center z-50 shadow-md -mt-4 sm:-mt-8 mb-6 rounded-b-2xl">
            <div className="animate-marquee whitespace-nowrap flex gap-10 font-semibold text-[10px] sm:text-xs uppercase tracking-widest px-4">
              <span>Your payment is initiated and will be verified within 24 hours. Please have patience.</span>
              <span>तपाईंको भुक्तानी सुरु गरिएको छ र २४ घण्टा भित्र प्रमाणित गरिनेछ। कृपया धैर्य गर्नुहोस्।</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mb-8 w-full">
        <div className="flex flex-wrap sm:flex-nowrap p-1.5 bg-slate-200/60 backdrop-blur-md rounded-[1.25rem] w-full relative gap-1 sm:gap-0">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-[calc(50%-4px)] sm:w-auto sm:flex-1 relative flex flex-col sm:flex-row items-center justify-center gap-2 py-3 px-2 sm:px-4 rounded-xl transition-all duration-300 z-10 ${
                  isActive ? 'text-white' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {isActive && (
                  <motion.div layoutId="activeTabPill" className="absolute inset-0 bg-indigo-600 rounded-xl shadow-[0_4px_15px_rgba(79,70,229,0.3)]" transition={{ type: "spring", stiffness: 400, damping: 30 }} />
                )}
                <tab.icon className={`relative z-10 shrink-0 w-4 h-4 sm:w-5 sm:h-5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span className="relative z-10 text-[11px] sm:text-sm font-medium truncate">
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {loading ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full relative">
           <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/40 to-transparent z-10"></div>
           <SkeletonLoader />
        </motion.div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 15 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="w-full"
          >
            {activeTab === 'Overview' && (
              <AccountOverviewView
                userName={userName} 
                orders={orders} enrollments={enrollments} certificates={certificates}
                onNavigate={(tab: string) => setActiveTab(tab)}
                pendingCoursePayments={pendingCoursePayments}
                activeCourseAccess={activeCourseAccess}
                expandedRecordingOrders={expandedRecordingOrders} 
                onlineCourseDetails={onlineCourseDetails}
                router={router}
                pendingVerificationOrders={pendingVerificationOrders}
              />
            )}

            {(activeTab === 'Online Courses' || activeTab === 'Recording Courses') && (
              <MyCoursesView 
                activeTab={activeTab} enrollments={enrollments} onlineCourseDetails={onlineCourseDetails} 
                courseBatches={courseBatches} pendingVerificationOrders={pendingVerificationOrders} 
                orders={orders} expandedRecordingOrders={expandedRecordingOrders} recordingsList={recordingsList} 
                router={router} onOpenExpiredModal={setGlobalExpiredClassLink} onOpenOrientationModal={setOrientationData} formatDate={formatDate}
              />
            )}

            {activeTab === 'My Certificates' && <MyCertificatesView certificates={certificates} formatDate={formatDate} showToast={showToast} />}

          </motion.div>
        </AnimatePresence>
      )}

      {/* Class Expired Modal */}
      <AnimatePresence>
        {globalExpiredClassLink && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-4">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className={`bg-white rounded-3xl w-full max-w-md p-10 text-center relative shadow-2xl overflow-hidden`}>
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-600 to-amber-500"></div>
              <button onClick={() => setGlobalExpiredClassLink(null)} className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 bg-slate-100 p-2 rounded-full transition-colors"><X size={18}/></button>
              <div className="w-20 h-20 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner"><Video size={32} /></div>
              <h3 className="text-2xl font-bold tracking-tight mb-3 text-slate-800">Class is Finished</h3>
              <p className="text-slate-500 mb-8 leading-relaxed font-medium">The live sessions for this batch have concluded. You can still access the complete recordings.</p>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => { setGlobalExpiredClassLink(null); window.open(globalExpiredClassLink || '/recording', '_blank'); }} className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium shadow-lg transition-all">Explore Recordings</motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Orientation Session Modal */}
      <AnimatePresence>
        {orientationData && (
           <OrientationModal data={orientationData} onClose={() => setOrientationData(null)} />
        )}
      </AnimatePresence>

      <style>{`
        @keyframes marquee { 0% { transform: translateX(0%); } 100% { transform: translateX(-50%); } } 
        .animate-marquee { animation: marquee 35s linear infinite; } 
        .animate-marquee:hover { animation-play-state: paused; } 
        @keyframes shimmer { 100% { transform: translateX(100%); } }
      `}</style>
    </div>
  );
}

// -------------------------------------------------------------
// VIEW COMPONENTS
// -------------------------------------------------------------

function AccountOverviewView({ userName, orders, enrollments, certificates, onNavigate, pendingCoursePayments, activeCourseAccess, expandedRecordingOrders, onlineCourseDetails, router, pendingVerificationOrders }: any) {
  const timelineEvents = [
    ...(orders || []).filter((o: any) => o.order_type?.toLowerCase() === 'recording').map((o: any) => ({ id: o.id, type: 'Order', title: `Purchased ${o.order_name} recordings`, date: new Date(o.created_at) })),
    ...(enrollments || []).map((e: any) => ({ id: e.id, type: 'Enrollment', title: `Enrolled in ${e.course_name}`, date: new Date(e.created_at) })),
    ...(certificates || []).map((c: any) => ({ id: `cert-${c.id}`, type: 'Certificate', title: `Certificate: ${c.syllabus_name || c.name}`, date: new Date(c.issue_date) }))
  ].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 5);

  const totalCourses = activeCourseAccess.length + (expandedRecordingOrders?.length || 0);

  const timelineContainer = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const timelineItem = { hidden: { opacity: 0, x: -20 }, visible: { opacity: 1, x: 0 } };

  const visiblePendingPayments = pendingCoursePayments?.filter((enroll: any) => {
    const hasPendingOrder = pendingVerificationOrders?.some((o: any) =>
      o.enrollment_id === enroll.id ||
      (o.order_name?.toLowerCase() === enroll.course_name?.toLowerCase() && o.order_type?.toLowerCase() !== 'recording')
    );
    return !hasPendingOrder;
  }) || [];

  return (
    <div className="space-y-8 sm:space-y-10 w-full">
      {visiblePendingPayments.length > 0 && (
        <div className="flex flex-col gap-4">
          {visiblePendingPayments.map((enroll: any) => {
            const isFutureClass = enroll.starting_date ? new Date(enroll.starting_date).getTime() > new Date().getTime() : false;
            
            const tenPercentAmt = Math.round((Number(enroll.locked_price) || 0) * 0.1);
            const isSeatBooking = isFutureClass && (Number(enroll.paid_amount) === 0);
            const amountToPay = isSeatBooking ? tenPercentAmt : enroll.remaining_amount;
            
            const title = isSeatBooking ? "Seat Booking Required" : "Action Required: Pending Due";
            const desc = isSeatBooking 
              ? <span>Secure your seat for <strong className="font-semibold text-red-900">{enroll.course_name}</strong> by depositing 10% (<strong className="font-semibold text-red-900 bg-red-100 px-2 py-0.5 rounded">Rs. {amountToPay}</strong>) of the locked price.</span>
              : <span>You have a remaining payment of <strong className="font-semibold text-red-900 bg-red-100 px-2 py-0.5 rounded">Rs. {amountToPay}</strong> for <strong className="font-semibold text-red-900">{enroll.course_name}</strong>.</span>;

            return (
              <div key={enroll.id} className="bg-gradient-to-r from-red-50 to-white border border-red-200 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-red-500"></div>
                <div className="flex items-start gap-5 text-red-900 pl-2">
                  <div className="p-3.5 bg-red-100 text-red-600 rounded-2xl shrink-0 shadow-inner"><AlertCircle size={24} /></div>
                  <div>
                    <p className="text-base sm:text-lg font-bold leading-tight mb-1.5">{title}</p>
                    <p className="text-sm font-medium text-red-700/90 leading-relaxed">{desc}</p>
                  </div>
                </div>
                <motion.button whileTap={{ scale: 0.95 }} onClick={() => router.push(`/order?order_type=course&courseName=${encodeURIComponent(enroll.course_name)}&price=${amountToPay}`)} className="w-full md:w-auto shrink-0 bg-red-600 hover:bg-red-700 text-white font-medium px-8 py-3.5 rounded-xl text-sm whitespace-nowrap transition-all shadow-md group-hover:shadow-xl group-hover:-translate-y-0.5">
                  Pay Rs. {amountToPay}
                </motion.button>
              </div>
            );
          })}
        </div>
      )}

      <div className={`bg-slate-900 rounded-[2rem] p-6 sm:p-10 relative overflow-hidden group shadow-xl border border-slate-800`}>
        <div className="absolute inset-0 opacity-[0.04] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay"></div>
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-gradient-to-bl from-indigo-500/20 via-amber-400/10 to-transparent blur-3xl pointer-events-none rounded-full translate-x-1/4 -translate-y-1/4 animate-pulse duration-10000"></div>
        <Crown className="absolute -bottom-8 -right-8 w-48 h-48 text-white opacity-5 rotate-12" />
        
        <div className="relative z-10 text-white">
          <h2 className="text-[10px] sm:text-xs uppercase tracking-widest font-bold text-amber-400 mb-3 flex items-center gap-2">
            <Sparkles size={14} /> My Learning Hub - Learn Today
          </h2>
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div>
              <h3 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight mb-3 text-white leading-tight">Welcome back, {userName}</h3>
              <p className="text-white/80 font-medium text-base sm:text-lg tracking-wide leading-relaxed max-w-2xl">
                {totalCourses === 0 && certificates.length === 0 ? (
                    "You have no trace of activity with GyanHub! Keep building your credentials. "
                ) : (
                  <>You have <span className="text-amber-400 font-semibold">{totalCourses} courses</span> and <span className="text-indigo-400 font-semibold">{certificates.length} certificates</span>! Keep building your credentials. </>
                )}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5 mt-6 sm:mt-10 pt-6 border-t border-slate-700/80">
            {[
              { icon: BookOpen, value: activeCourseAccess.length, label: 'Live Classes', sub: 'Keep pushing forward!', tab: 'Online Courses', color: 'text-indigo-300' },
              { icon: Video, value: expandedRecordingOrders?.length || 0, label: 'Recordings', sub: 'Lifetime access', tab: 'Recording Courses', color: 'text-amber-300' },
              { icon: AlertCircle, value: pendingCoursePayments.length, label: 'Pending Dues', sub: pendingCoursePayments.length > 0 ? 'Action required' : 'All clear', tab: 'Online Courses', dot: pendingCoursePayments.length > 0, color: 'text-red-300' },
              { icon: Award, value: certificates?.length || 0, label: 'Certificates', sub: 'Top 10% learner 🏆', tab: 'My Certificates', color: 'text-emerald-300' },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <motion.div 
                  whileTap={{ scale: 0.95 }} 
                  key={i} 
                  onClick={() => onNavigate(item.tab)} 
                  className={`cursor-pointer bg-white/5 backdrop-blur-lg p-4 sm:p-5 rounded-2xl transition-all duration-300 border border-slate-700/50 border-t-white/10 min-h-[120px] sm:min-h-[140px] flex flex-col relative group shadow-sm hover:bg-white/10 hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(79,70,229,0.15)] hover:border-indigo-500/30`}
                >
                  {item.dot && <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.6)]"></span>}
                  <div className={`p-2 sm:p-3 bg-slate-900/60 ${item.color} rounded-xl w-fit mb-3 group-hover:scale-110 group-hover:rotate-3 transition-transform shadow-inner`}><Icon size={18} /></div>
                  <div className="mt-auto">
                    <p className="text-2xl sm:text-3xl font-extrabold text-white leading-none tracking-tight">{item.value}</p>
                    <p className="text-[10px] uppercase font-semibold tracking-widest text-slate-300 mt-2">{item.label}</p>
                    <p className="text-[9px] sm:text-[10px] font-medium text-slate-400 mt-1 truncate">{item.sub}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-[0_4px_20px_rgba(0,0,0,0.02)] relative overflow-hidden">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-8"><Clock size={16} /> Recent Timeline</h3>
        {timelineEvents.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-slate-400">
            <Clock size={40} className="mb-4 opacity-20" />
            <p className="text-sm font-medium">No recent activity found.</p>
          </div>
        ) : (
          <motion.div variants={timelineContainer} initial="hidden" animate="visible" className="space-y-8 relative before:absolute before:inset-y-0 before:left-[1.1rem] before:w-0.5 before:bg-slate-100">
            {timelineEvents.map((event: any, idx: number) => {
              const isPurchase = event.type === 'Order' || event.type === 'Enrollment';
              const IconComp = event.type === 'Certificate' ? Award : isPurchase ? ShoppingBag : BookOpen;
              const colorClass = event.type === 'Certificate' ? 'text-amber-600 bg-amber-50 border-amber-200' : 'text-indigo-600 bg-indigo-50 border-indigo-200';
              
              return (
                <motion.div variants={timelineItem} key={`${event.id}-${idx}`} className="relative flex items-start gap-6 group">
                  <div className={`flex items-center justify-center w-9 h-9 rounded-full border-[3px] border-white z-10 shadow-sm transition-transform group-hover:scale-110 ${colorClass}`}><IconComp size={16} /></div>
                  <div className="flex-1 bg-slate-50/50 group-hover:bg-slate-50 p-5 rounded-2xl border border-slate-100 transition-colors">
                    <p className="text-sm font-semibold text-slate-800 leading-relaxed">{event.title}</p>
                    <time className="text-[10px] font-medium text-slate-400 tracking-widest uppercase block mt-2">{event.date.toLocaleDateString()}</time>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>
    </div>
  );
}

function MyCoursesView({ activeTab, enrollments, onlineCourseDetails, courseBatches, pendingVerificationOrders, expandedRecordingOrders, recordingsList, router, onOpenExpiredModal, onOpenOrientationModal, formatDate }: any) {
  const isOnline = activeTab === 'Online Courses';

  return (
    <div className="space-y-8 w-full">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
        <h2 className="text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-800">
          {isOnline ? 'Live Classes' : 'Recordings'}
        </h2>
        <motion.button whileTap={{ scale: 0.95 }} onClick={() => router.push(isOnline ? "/onlinecourse" : "/recording")} className="group flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-7 py-3.5 rounded-xl font-medium text-sm shadow-[0_4px_15px_rgba(79,70,229,0.3)] hover:shadow-[0_8px_25px_rgba(79,70,229,0.4)] transition-all">
          Explore {isOnline ? 'Courses' : 'Recordings'} <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
        </motion.button>
      </div>

      <div className="flex flex-col gap-6 w-full">
        {isOnline ? (
          enrollments.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-300 flex flex-col items-center shadow-inner">
               <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mb-5 text-indigo-500 shadow-sm">
                 <Monitor size={32} />
               </div>
               <h3 className="text-xl font-semibold text-slate-800 mb-2 tracking-tight">No Active Enrollments</h3>
               <p className="text-slate-500 max-w-md mx-auto mb-8 font-medium leading-relaxed">
                 You haven't enrolled in any live classes yet. Explore our latest courses to boost your skills.
               </p>
               <button onClick={() => router.push("/onlinecourse")} className="flex items-center gap-2 px-8 py-3.5 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-colors shadow-md group">
                 <Compass size={18} /> Explore Courses <ArrowRight size={16} className="ml-1 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
               </button>
            </motion.div>
          ) : (enrollments.map((course: any) => {
            const matched = onlineCourseDetails.find((oc: any) => oc.id === course.course_id || oc.title === course.course_name);
            const batch = courseBatches.find((b: any) => b.id === course.batch_id); 
            return <CourseCard key={course.id} course={course} type="online" matched={matched} batch={batch} pendingVerificationOrders={pendingVerificationOrders} router={router} onOpenOrientationModal={onOpenOrientationModal} formatDate={formatDate} />;
          })
          )
        ) : (
          !expandedRecordingOrders || expandedRecordingOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center bg-slate-50/50 rounded-3xl py-20 px-6 border border-dashed border-slate-300 text-center shadow-inner">
               <div className="bg-white p-5 rounded-full shadow-sm mb-5 border border-slate-100"><Video size={40} className="text-amber-500" /></div>
               <p className="text-slate-800 font-semibold text-xl mb-2 tracking-tight">No recording access</p>
               <p className="text-slate-500 font-medium text-sm mb-8 max-w-sm leading-relaxed">You haven't purchased any course recordings. Unlock lifetime access today.</p>
               <Link href="/recording" className="bg-white border-2 border-slate-200 text-slate-700 hover:border-indigo-500 hover:text-indigo-600 px-8 py-3 rounded-xl font-medium text-sm shadow-sm transition-all group flex items-center gap-2">
                 View Recordings <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
               </Link>
            </div>
          ) : (
            expandedRecordingOrders.map((record: any) => {
              const matched = recordingsList.find((r: any) => r.course_name.toLowerCase() === record.order_name.toLowerCase());
              return <CourseCard key={record.id} course={record} type="recording" matched={matched} pendingVerificationOrders={pendingVerificationOrders} router={router} formatDate={formatDate} />;
            })
          )
        )}
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// STANDARDIZED COURSE CARD (Handles both Recordings & Online)
// -------------------------------------------------------------
function CourseCard({ course, type, matched, batch, router, pendingVerificationOrders = [], onOpenOrientationModal, formatDate }: any) {
  const isRec = type === 'recording';
  const title = isRec ? course.order_name : course.course_name;
  
  const cardBgStyle = isRec 
    ? "bg-gradient-to-br from-blue-50/70 to-white border-blue-200 shadow-[0_8px_30px_rgba(37,99,235,0.06)]" 
    : "bg-gradient-to-br from-orange-50/40 to-white border-orange-100/60 shadow-[0_8px_30px_rgba(234,88,12,0.04)]";
  
  const isVerified = isRec ? course.status?.toLowerCase() === 'verified' : true;
  const isFullyPaid = (course.remaining_amount || 0) <= 0;
  const isConfirmed = course.status === 'confirmed';

  let accessTier = 'FULL_ACCESS';
  let isClassStarted = false;
  
  let displayPayAmount = course.remaining_amount;
  let bannerText = `Remaining Due: Rs. ${course.remaining_amount}`;
  let bannerSubtext = "Pay now to avoid access interruptions.";

  const isUnverifiedPayment = pendingVerificationOrders.some((o: any) => 
    (o.enrollment_id === course.id) ||
    (o.order_name?.toLowerCase() === course.course_name?.toLowerCase() && o.order_type?.toLowerCase() !== 'recording')
  );

  if (!isRec) {
    const targetDateStr = course.starting_date ? course.starting_date.split('T')[0] + 'T20:00:00+05:45' : null;
    isClassStarted = targetDateStr ? new Date(targetDateStr).getTime() <= new Date().getTime() : true;

    if (course.paid_amount === 0) {
      accessTier = isUnverifiedPayment ? 'BLOCKED_VERIFY' : 'BLOCKED_NO_PAY';
    } else if (course.remaining_amount > 0) {
      if (isClassStarted) {
        accessTier = 'BLOCKED_DUE_PAST_START'; 
      } else {
        accessTier = 'PARTIAL_ACTIVE'; 
      }
    } else {
      accessTier = 'FULL_ACCESS'; 
    }

    const tenPercentAmt = Math.round((Number(course.locked_price) || 0) * 0.1);

    if (!isClassStarted && course.paid_amount === 0) {
       displayPayAmount = tenPercentAmt;
       bannerText = `Seat Booking Required`;
       bannerSubtext = `Deposit 10% (Rs. ${tenPercentAmt}) of the locked price to secure your seat.`;
    } else {
       displayPayAmount = course.remaining_amount;
       bannerText = `Action Required: Pending Due`;
       bannerSubtext = `You have a remaining payment of Rs. ${course.remaining_amount}.`;
    }
  }

  const LockedResourceButton = ({ label, icon, reason, className = "" }: { label: string, icon: React.ReactNode, reason: string, className?: string }) => (
    <div className={`relative group/locked flex-1 ${className}`}>
      <button className="w-full flex items-center justify-center gap-2 bg-slate-200/50 text-slate-500 py-3.5 rounded-xl font-bold text-sm cursor-not-allowed transition-colors hover:bg-slate-200 border border-transparent">
        {icon} {label}
      </button>
      <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-56 bg-slate-800 text-white text-xs font-medium p-3 rounded-lg opacity-0 group-hover/locked:opacity-100 transition-opacity pointer-events-none z-50 text-center shadow-lg">
        {reason}
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
      </div>
    </div>
  );

  return (
    <motion.div whileTap={{ scale: 0.99 }} className="relative group/card h-full transition-all duration-300 hover:-translate-y-1">
      <div className={`absolute -inset-0.5 rounded-3xl blur-xl opacity-0 group-hover/card:opacity-15 transition duration-500 z-0 ${isRec ? 'bg-indigo-600' : 'bg-orange-500'}`}></div>
      
      <div className={`relative rounded-3xl border p-6 sm:p-8 flex flex-col z-10 overflow-hidden h-full ${cardBgStyle}`}>
        
        {isRec ? (
          <>
            <div className={`absolute top-0 left-0 w-full h-1.5 bg-blue-500 z-50`}></div>
            <div className="flex justify-between items-start mb-6">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <span className={`bg-white/80 text-blue-800 border border-blue-200 text-[10px] sm:text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg inline-block shadow-sm`}>
                    Recordings
                  </span>
                  {course.original_bundle && (
                    <span className={`bg-indigo-100 text-indigo-800 border border-indigo-200 text-[10px] sm:text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg inline-block shadow-sm flex items-center gap-1`}>
                       <Sparkles size={12}/> Bundle
                    </span>
                  )}
                </div>
                <h3 className="font-extrabold text-3xl sm:text-4xl text-slate-900 tracking-tight group-hover/card:text-blue-700 transition-colors leading-tight max-w-2xl">{title}</h3>
                
                {matched && (
                  <div className="flex flex-wrap items-center gap-2 mt-4 mb-2">
                    {matched.category && (
                      <span className="text-xs text-slate-700 font-bold bg-white/60 px-2.5 py-1.5 rounded-lg border border-slate-200/60 shadow-sm">{matched.category}</span>
                    )}
                    {matched.difficulty_level && (
                      <span className="text-xs text-slate-700 font-bold bg-white/60 px-2.5 py-1.5 rounded-lg border border-slate-200/60 shadow-sm flex items-center gap-1">
                        <BarChart size={12} className="text-slate-500"/> {matched.difficulty_level}
                      </span>
                    )}
                    {(matched.duration || matched.course_hours) && (
                      <span className="text-xs text-slate-700 font-bold bg-white/60 px-2.5 py-1.5 rounded-lg border border-slate-200/60 shadow-sm flex items-center gap-1">
                        <Timer size={12} className="text-slate-500"/> {matched.duration || matched.course_hours} Hours
                      </span>
                    )}
                  </div>
                )}
              </div>
              <div className="bg-white p-3.5 rounded-2xl border border-blue-200 shrink-0 shadow-inner group-hover/card:scale-110 group-hover/card:rotate-6 transition-transform">
                <Video className="w-8 h-8 text-blue-500" />
              </div>
            </div>
            
            <div className="w-full bg-blue-200/60 rounded-full h-1 mt-2 mb-4 overflow-hidden">
               <div className="h-full bg-blue-500 w-full rounded-full opacity-50"></div>
            </div>

            {matched && matched.learning_outcomes?.length > 0 && (
              <div className="mt-2 border-t border-blue-300/40 pt-6 hidden sm:block">
                <p className="text-[10px] uppercase font-extrabold text-slate-500 tracking-widest mb-4">Core Concepts</p>
                <ul className="text-sm text-slate-800 font-semibold grid grid-cols-2 gap-y-3 gap-x-6">
                  {matched.learning_outcomes.slice(0, 4).map((out: string, i: number) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <Check className={`w-4 h-4 mt-0.5 shrink-0 text-blue-600`} />
                      <span className="line-clamp-2 leading-relaxed">{out}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-8 pt-6 border-t border-blue-300/40 flex flex-col justify-end flex-grow">
              {isVerified ? (
                <div className="flex justify-end mt-auto">
                  <button onClick={() => {
                      if (matched?.recording_link) {
                          window.open(matched.recording_link, '_blank');
                      } else {
                          router.push(`/recording/${encodeURIComponent(title)}`);
                      }
                  }} className="group/btn bg-white border-2 border-blue-300 hover:border-blue-600 hover:text-blue-700 text-slate-900 px-8 py-3 rounded-xl font-extrabold text-sm transition-all flex items-center gap-2 shadow-sm hover:shadow-md">
                    <PlayCircle size={18} /> Watch Recording <ArrowRight size={16} className="group-hover/btn:translate-x-1 transition-transform"/>
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 text-amber-800 p-5 rounded-xl shadow-sm mt-auto">
                  <Lock size={20} className="shrink-0 text-amber-500" />
                  <div className="flex flex-col">
                    <span className="font-semibold text-sm">Pending Verification</span>
                    <span className="text-xs font-medium opacity-80">This recording will be accessible after your payment is successfully verified.</span>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <div className={`absolute top-0 left-0 w-full h-1.5 bg-orange-400 z-50`}></div>
            
            {(!isFullyPaid && !isUnverifiedPayment) && (
              <div className="absolute top-1.5 left-0 right-0 bg-red-50 border-b border-red-100 px-4 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 z-50 shadow-sm">
                <div className="flex flex-col">
                   <div className="flex items-center gap-2 text-sm font-extrabold text-red-900">
                      <AlertCircle size={16} className="animate-pulse text-red-600" />
                      {bannerText}
                   </div>
                   <span className="text-xs text-red-700 font-medium pl-6">{bannerSubtext}</span>
                </div>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/order?order_type=course&courseName=${encodeURIComponent(course.course_name)}&price=${displayPayAmount}`);
                  }}
                  className="bg-red-600 hover:bg-red-700 text-white font-extrabold px-5 py-2 rounded-lg text-xs shadow-md transition-colors whitespace-nowrap self-stretch sm:self-auto"
                >
                  Pay Rs. {displayPayAmount}
                </button>
              </div>
            )}

            <div className={`flex justify-between items-start mb-5 ${(!isFullyPaid && !isUnverifiedPayment) ? 'mt-12' : ''}`}>
              <div className="pr-4">
                <h3 className="font-extrabold text-3xl sm:text-4xl text-slate-900 leading-tight mb-4 tracking-tight group-hover/card:text-orange-700 transition-colors">
                  {course.course_name}
                </h3>
                
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <span className="inline-flex items-center px-3 py-1.5 rounded-full text-[11px] font-bold bg-white border border-orange-200 text-orange-900 shadow-sm">
                    Batch {course.batch_no || 1}
                  </span>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold shadow-sm ${
                    isConfirmed ? "bg-emerald-100 text-emerald-900 border border-emerald-200" : "bg-slate-100 text-slate-800 border border-slate-300"
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${isConfirmed ? 'bg-emerald-500 animate-pulse' : 'bg-slate-500'}`}></span>
                    {isConfirmed ? "Confirmed" : "Pending Verification"}
                  </span>
                </div>

                {matched && (
                   <div className="flex flex-wrap items-center gap-3">
                     {matched.tutor_name && (
                       <span className="flex items-center gap-1.5 text-xs text-slate-700 font-bold bg-white/80 px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm">
                         <User size={14} className="text-orange-500"/> By {matched.tutor_name}
                       </span>
                     )}
                     {matched.duration && (
                       <span className="flex items-center gap-1.5 text-xs text-slate-700 font-bold bg-white/80 px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm">
                         <Timer size={14} className="text-orange-500"/> {matched.duration}
                       </span>
                     )}
                   </div>
                )}
              </div>
            </div>

            <div className="w-full bg-orange-200/50 rounded-full h-1 mt-2 mb-6 overflow-hidden">
               <div className={`h-full rounded-full ${isFullyPaid ? 'bg-emerald-500 w-full' : 'bg-orange-500 w-1/3'}`}></div>
            </div>

            <div className="py-5 mb-6 border-y border-orange-200/60 flex flex-col sm:flex-row gap-6 flex-grow">
              <div className="flex items-center text-sm flex-1">
                <div className="w-10 h-10 rounded-full bg-white border border-orange-200 flex items-center justify-center mr-4 shrink-0 shadow-sm">
                  <Calendar className="text-orange-600 w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-600 font-extrabold uppercase tracking-wider mb-0.5">Starting Date</p>
                  <p className="text-slate-900 font-extrabold text-base">{formatDate(course.starting_date)}</p>
                </div>
              </div>
              
              <div className="w-px bg-orange-200/60 hidden sm:block"></div>
              
              <div className="flex items-center text-sm flex-1">
                <div className="w-10 h-10 rounded-full bg-white border border-orange-200 flex items-center justify-center mr-4 shrink-0 shadow-sm">
                  <Clock className="text-orange-600 w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-600 font-extrabold uppercase tracking-wider mb-0.5">Class Timing</p>
                  <p className="text-slate-900 font-extrabold text-base">{batch?.timing || "TBA"}</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 mt-auto pt-2">
              {accessTier === 'BLOCKED_VERIFY' ? (
                <LockedResourceButton label={isClassStarted ? "Live Class" : "Orientation Session"} icon={<Lock size={16}/>} reason="Payment verification pending." className="text-black" />
              ) : accessTier === 'BLOCKED_NO_PAY' ? (
                <LockedResourceButton label={isClassStarted ? "Live Class" : "Orientation Session"} icon={<Lock size={16}/>} reason="Pay seat booking fee to unlock." className="text-black" />
              ) : accessTier === 'BLOCKED_DUE_PAST_START' ? (
                <LockedResourceButton label="Live Class" icon={<Lock size={16}/>} reason="Class has started. Clear due to unlock." className="text-black" />
              ) : (
                <button 
                  onClick={() => {
                     if(!isClassStarted) {
                        onOpenOrientationModal({ link: batch?.online_class_link || '#', date: course.starting_date });
                     } else {
                        window.open(batch?.online_class_link || '#', '_blank');
                     }
                  }}
                  className="group/btn w-full flex items-center justify-center gap-2 px-4 py-3.5 bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/20 hover:shadow-lg rounded-xl text-white font-extrabold text-sm transition-all border border-indigo-700"
                >
                  <Video size={18} /> {isClassStarted ? 'Join Live Class' : 'Join Orientation Session'} <ArrowRight size={16} className="group-hover/btn:translate-x-1 transition-transform ml-1"/>
                </button>
              )}

              <div className="flex flex-col sm:flex-row gap-3">
                {accessTier !== 'FULL_ACCESS' ? (
                  <>
                    <LockedResourceButton label="Google Classroom" icon={<Lock size={18}/>} reason="Clear remaining due to unlock." />
                    <LockedResourceButton label="WhatsApp" icon={<Lock size={18}/>} reason="Clear remaining due to unlock." />
                  </>
                ) : (
                  <>
                    <a
                      href={batch?.google_classroom_link || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => !batch?.google_classroom_link && e.preventDefault()}
                      className={`group/link flex-1 flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl border transition-all shadow-sm font-extrabold text-sm text-black ${
                        batch?.google_classroom_link
                          ? "bg-orange-500 border-orange-600 hover:bg-orange-600 hover:border-orange-700 hover:shadow-md text-white"
                          : "border-slate-300 text-slate-500 cursor-not-allowed bg-slate-200/50 shadow-none"
                      }`}
                      title="Google Classroom"
                    >
                      <BookOpen size={18} className={batch?.google_classroom_link ? "group-hover/link:-translate-y-0.5 transition-transform" : ""} /> Google Classroom
                    </a>
                    <a
                      href={batch?.whatsapp_group_link || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => !batch?.whatsapp_group_link && e.preventDefault()}
                      className={`group/link flex-1 flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl border transition-all shadow-sm font-extrabold text-sm text-black ${
                        batch?.whatsapp_group_link
                          ? "bg-[#25D366] border-[#1DA851] hover:bg-[#1DA851] hover:shadow-md text-white"
                          : "border-slate-300 text-slate-500 cursor-not-allowed bg-slate-200/50 shadow-none"
                      }`}
                      title="WhatsApp Group"
                    >
                      <MessageCircle size={18} className={batch?.whatsapp_group_link ? "group-hover/link:-translate-y-0.5 transition-transform" : ""} /> WhatsApp
                    </a>
                  </>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
}

function MyCertificatesView({ certificates, formatDate, showToast }: any) {
  return (
    <div className="space-y-8 w-full">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
        <h2 className="text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-800">My Certificates</h2>
        {certificates?.length > 0 && (
           <div className="bg-amber-100 border border-amber-200 text-amber-800 px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-2 shadow-sm">
             <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span> Industry Standard Certificate
           </div>
        )}
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {!certificates || certificates.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center bg-slate-50/50 rounded-3xl py-20 px-6 border border-dashed border-slate-300 text-center shadow-inner">
            <div className="bg-white p-5 rounded-full shadow-sm mb-5 border border-slate-100"><Award size={40} className="text-amber-400" /></div>
            <p className="text-slate-800 font-semibold text-xl mb-2 tracking-tight">No certificates earned yet</p>
            <p className="text-slate-500 font-medium text-sm">Complete a course to unlock your first certificate.</p>
          </div>
        ) : certificates.map((cert: any) => (
          <motion.div 
            whileTap={{ scale: 0.99 }} 
            key={cert.id} 
            className="bg-gradient-to-br from-amber-50/30 to-white border border-amber-200/80 rounded-3xl p-8 shadow-sm flex flex-col gap-6 relative overflow-hidden group hover:shadow-[0_10px_40px_rgb(251,191,36,0.15)] hover:-translate-y-1 hover:border-amber-400 transition-all duration-300"
          >
             <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-amber-400/20 via-orange-500/5 to-transparent blur-3xl rounded-full group-hover:scale-125 transition-transform duration-700 pointer-events-none"></div>
             
             <div className="flex justify-between items-start z-10">
                <div className="p-4 bg-gradient-to-br from-amber-100 to-amber-200 text-amber-700 rounded-2xl border border-amber-300 shadow-sm group-hover:scale-110 group-hover:rotate-3 transition-transform">
                  <Award size={32} className="drop-shadow-sm" />
                </div>
                <div className="text-right bg-white px-3 py-2 rounded-xl border border-slate-100 shadow-sm">
                  <p className="text-[9px] uppercase font-bold text-slate-400 tracking-widest mb-1">Issue Date</p>
                  <p className="text-xs font-semibold text-slate-800">{formatDate(cert.issue_date)}</p>
                </div>
             </div>
             
             <div className="z-10 mt-4">
                 <h3 className="text-2xl font-semibold text-slate-800 leading-snug mb-3 tracking-tight group-hover:text-amber-700 transition-colors">{cert.syllabus_name || cert.name}</h3>
                 <p className="text-sm text-slate-500 font-medium bg-white inline-block px-3 py-1.5 rounded-lg border border-slate-100 shadow-sm">Issued to: <span className="font-semibold text-slate-800">{cert.name}</span></p>
             </div>

             <div className="border-t border-slate-100 pt-6 mt-auto flex flex-col sm:flex-row gap-3 z-10">
                <a 
                  href={`/certificate?name=${encodeURIComponent(cert.name)}&email=${encodeURIComponent(cert.email)}`} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="group/certbtn flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-3.5 rounded-xl text-sm font-medium flex justify-center items-center gap-2 shadow-md hover:shadow-lg transition-all"
                >
                  <ExternalLink size={16}/> View Certificate
                </a>
                <button 
                  onClick={() => {
                    const url = `${window.location.origin}/certificate?name=${encodeURIComponent(cert.name)}&email=${encodeURIComponent(cert.email)}`;
                    navigator.clipboard.writeText(url);
                    showToast("Certificate link copied!", "success");
                  }}
                  className="flex-1 bg-white border border-slate-200 text-slate-700 hover:border-indigo-500 hover:text-indigo-600 hover:bg-indigo-50 py-3.5 rounded-xl text-sm font-medium flex justify-center items-center gap-2 transition-all shadow-sm"
                >
                  <Copy size={16}/> Copy Link
                </button>
             </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function OrientationModal({ data, onClose }: { data: { link: string, date: string }, onClose: () => void }) {
  const [timeLeft, setTimeLeft] = useState({ d: 0, h: 0, m: 0, s: 0 });

  useEffect(() => {
    const targetDateStr = data.date.split('T')[0] + 'T20:00:00+05:45';
    const target = new Date(targetDateStr).getTime();

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const diff = target - now;
      
      if (diff <= 0) {
        setTimeLeft({ d: 0, h: 0, m: 0, s: 0 });
        clearInterval(interval);
      } else {
        setTimeLeft({
          d: Math.floor(diff / (1000 * 60 * 60 * 24)),
          h: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          m: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
          s: Math.floor((diff % (1000 * 60)) / 1000)
        });
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [data.date]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-4">
      <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className={`bg-white rounded-3xl w-full max-w-md p-8 md:p-10 text-center relative shadow-2xl overflow-hidden border-2 border-indigo-100`}>
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
        <button onClick={onClose} className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 bg-slate-100 p-2 rounded-full transition-colors"><X size={18}/></button>
        
        <div className="w-20 h-20 bg-indigo-50 border border-indigo-100 text-indigo-500 rounded-full flex items-center justify-center mx-auto mb-5 shadow-inner">
           <Timer size={36} />
        </div>
        
        <h3 className="text-2xl font-black tracking-tight mb-2 text-slate-900">Orientation Session</h3>
        <p className="text-slate-500 mb-8 font-medium">Session begins exactly at 8:00 PM (NST).</p>
        
        <div className="grid grid-cols-4 gap-2 sm:gap-3 mb-8">
           <div className="bg-slate-50 border border-slate-100 rounded-xl py-3 flex flex-col items-center justify-center shadow-inner">
              <span className="text-2xl font-black text-indigo-600">{timeLeft.d}</span>
              <span className="text-[10px] uppercase font-bold text-slate-400">Days</span>
           </div>
           <div className="bg-slate-50 border border-slate-100 rounded-xl py-3 flex flex-col items-center justify-center shadow-inner">
              <span className="text-2xl font-black text-indigo-600">{timeLeft.h.toString().padStart(2, '0')}</span>
              <span className="text-[10px] uppercase font-bold text-slate-400">Hours</span>
           </div>
           <div className="bg-slate-50 border border-slate-100 rounded-xl py-3 flex flex-col items-center justify-center shadow-inner">
              <span className="text-2xl font-black text-indigo-600">{timeLeft.m.toString().padStart(2, '0')}</span>
              <span className="text-[10px] uppercase font-bold text-slate-400">Mins</span>
           </div>
           <div className="bg-slate-50 border border-slate-100 rounded-xl py-3 flex flex-col items-center justify-center shadow-inner">
              <span className="text-2xl font-black text-indigo-600">{timeLeft.s.toString().padStart(2, '0')}</span>
              <span className="text-[10px] uppercase font-bold text-slate-400">Secs</span>
           </div>
        </div>

        <motion.button 
           whileHover={{ scale: 1.02 }} 
           whileTap={{ scale: 0.98 }} 
           onClick={() => { onClose(); window.open(data.link, '_blank'); }} 
           className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/30 transition-all text-sm uppercase tracking-wide flex justify-center items-center gap-2"
        >
           <Video size={18} /> Join Orientation Now
        </motion.button>
      </motion.div>
    </motion.div>
  );
}