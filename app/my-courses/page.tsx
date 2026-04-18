'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from "@/lib/supabase/client";
import { motion, Variants } from 'framer-motion';
import NepaliDate from 'nepali-date-converter';
import {
  Award,
  BookOpen,
  Calendar,
  ChevronRight,
  Clock,
  Compass,
  GraduationCap,
  Loader2,
  Sparkles,
  PlayCircle,
  AlertCircle,
  CheckCircle2,
  FileText,
  Receipt,
  XCircle,
  X
} from 'lucide-react';

// --- Interfaces based on DB schema updates ---
interface Certificate {
  id: number;
  syllabus_name: string;
  certificate_image: string;
  issue_date: string;
  certificate_code: string;
}

interface Enrollment {
  id: string;
  course_name: string;
  starting_date: string;
  status: string;
  locked_price: number;
  confirmed: boolean;
  course_details_url: string;
  created_at: string;
}

interface OnlineCourse {
  id: string;
  title: string;
  duration: string;
  fee: number;
  discount: number;
  cover_pic: string;
  start_datetime: string;
}

interface Order {
  id: string;
  order_type: string;
  tutor_name: string;
  price: number;
  status: string;
  created_at: string;
}

// --- Typed as Variants to resolve framer-motion TS error ---
const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } }
};

// --- Helper: Dual Date Formatter ---
const formatDualDate = (dateString?: string) => {
  if (!dateString) return 'TBA';
  const adDate = new Date(dateString);
  if (isNaN(adDate.getTime())) return 'TBA';

  // Format AD Date
  const optionsAD: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  const adFormatted = adDate.toLocaleDateString('en-US', optionsAD);

  // Format BS Date
  try {
    const bsDate = new NepaliDate(adDate);
    const bsFormatted = bsDate.format('MMMM D, YYYY');
    return `${adFormatted} (${bsFormatted})`;
  } catch (e) {
    return adFormatted; 
  }
};

export default function MyCoursesPage() {
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [upcomingCourses, setUpcomingCourses] = useState<OnlineCourse[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  
  // State for user details to build dynamic URL
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');

  // State for login popup
  const [showLoginPopup, setShowLoginPopup] = useState(false);

  // --- Helper: Supabase Image URL ---
  const getImageUrl = (path: string, bucket = 'certificates') => {
    if (!path) return '';
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
  };

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        // Trigger login popup if no user is found
        if (!user) {
          setShowLoginPopup(true);
          setLoading(false);
          return;
        }

        const fetchedName = user.user_metadata?.full_name || 'Student';
        const fetchedEmail = user.email || '';
        const userId = user.id;

        setUserName(fetchedName);
        setUserEmail(fetchedEmail);

        // Fetch Data Promises
        const certPromise = supabase
          .from('certificates')
          .select('id, syllabus_name, certificate_image, issue_date, certificate_code')
          .ilike('email', fetchedEmail);
          
        const enrollPromise = supabase
          .from('enrollments')
          .select('id, course_name, starting_date, status, locked_price, confirmed, course_details_url, created_at')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });
          
        const coursesPromise = supabase
          .from('online_courses')
          .select('id, title, duration, fee, discount, cover_pic, start_datetime')
          .gte('start_datetime', new Date().toISOString())
          .order('start_datetime', { ascending: true })
          .limit(4);

        const ordersPromise = supabase
          .from('orders')
          .select('id, order_type, tutor_name, price, status, created_at')
          .ilike('email', fetchedEmail)
          .order('created_at', { ascending: false });

        const [certRes, enrollRes, coursesRes, ordersRes] = await Promise.all([
          certPromise, 
          enrollPromise, 
          coursesPromise, 
          ordersPromise
        ]);

        if (certRes.data) setCertificates(certRes.data);
        if (enrollRes.data) setEnrollments(enrollRes.data);
        if (coursesRes.data) setUpcomingCourses(coursesRes.data);
        if (ordersRes.data) setOrders(ordersRes.data);

        // Optional: log errors if any specific table fails
        if (certRes.error) console.error('Certificates Error:', certRes.error.message);
        if (enrollRes.error) console.error('Enrollments Error:', enrollRes.error.message);
        if (coursesRes.error) console.error('Courses Error:', coursesRes.error.message);
        if (ordersRes.error) console.error('Orders Error:', ordersRes.error.message);

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, [supabase]);

  // Combine Enrollments and Orders into a single sorted list
  const combinedBookings = [
    ...enrollments.map(e => ({ ...e, _type: 'enrollment' as const })),
    ...orders.map(o => ({ ...o, _type: 'order' as const }))
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="flex flex-col items-center gap-4 text-blue-600">
          <Loader2 className="h-10 w-10 animate-spin" />
          <p className="text-sm font-bold tracking-widest uppercase text-slate-400">Loading your journey...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24 font-sans selection:bg-blue-200 relative">
      
      {/* Dynamic Header Section */}
      <header className="bg-white border-b border-slate-200 pt-12 pb-8 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 pointer-events-none" />
        <div className="max-w-7xl mx-auto relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mb-2">
              Welcome back, {userName || 'Student'}
            </h1>
            <p className="text-slate-500 font-medium">
              Track your GyanHub learning journey, view bookings, and discover what's next.
            </p>
          </div>
          <div className="flex gap-4">
            <div className="bg-blue-50 border border-blue-100 rounded-[20px] px-6 py-3 flex items-center gap-3">
              <Award className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 leading-none">Certificates</p>
                <p className="text-lg font-black text-blue-700 leading-tight">{certificates.length}</p>
              </div>
            </div>
            <div className="bg-emerald-50 border border-emerald-100 rounded-[20px] px-6 py-3 flex items-center gap-3">
              <BookOpen className="h-5 w-5 text-emerald-600" />
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 leading-none">Active Bookings</p>
                <p className="text-lg font-black text-emerald-700 leading-tight">{combinedBookings.length}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
        
        {/* SECTION 1: Active Bookings & Orders Unified */}
        <section>
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2.5 bg-gradient-to-br from-emerald-100 to-teal-50 rounded-[14px] text-emerald-600 shadow-sm border border-emerald-200/50">
              <Compass className="h-6 w-6" />
            </div>
            <h2 className="text-2xl font-black text-slate-900">My Bookings</h2>
          </div>

          {combinedBookings.length === 0 ? (
            <div className="rounded-[32px] border border-dashed border-slate-300 bg-slate-50 p-12 text-center">
              <Calendar className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-slate-700">No active bookings</h3>
              <p className="text-slate-500 mt-2">Ready to level up? Check out our upcoming courses below.</p>
            </div>
          ) : (
            <div className="bg-white rounded-[32px] border border-slate-200/60 shadow-sm overflow-hidden p-2">
              <div className="divide-y divide-slate-100">
                {combinedBookings.map((item) => {
                  
                  if (item._type === 'enrollment') {
                    const booking = item as Enrollment & { _type: 'enrollment' };
                    return (
                      <div key={`enroll-${booking.id}`} className="p-4 sm:p-6 hover:bg-slate-50/50 transition-colors rounded-[24px]">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                          
                          {/* Left: Course Info */}
                          <div className="flex items-start gap-4 flex-1">
                            <div className="hidden sm:flex h-12 w-12 rounded-[16px] bg-indigo-50 items-center justify-center text-indigo-600 shrink-0">
                              <PlayCircle className="h-6 w-6" />
                            </div>
                            <div>
                              <div className="flex items-center gap-3">
                                <h3 className="text-lg font-black text-slate-900">{booking.course_name}</h3>
                                {/* Conditional Enrollment Status Badge */}
                                <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest ${
                                  booking.confirmed 
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                                    : 'bg-orange-100 text-orange-800 border border-orange-200'
                                }`}>
                                  {booking.confirmed ? 'Confirmed' : 'Pending'}
                                </span>
                              </div>
                              
                              <div className="flex flex-wrap items-center gap-3 mt-1.5 text-sm font-medium text-slate-500">
                                <span className="flex items-center gap-1.5">
                                  <Calendar className="h-4 w-4" /> Start: {formatDualDate(booking.starting_date)}
                                </span>
                              </div>

                              {/* Syllabus Secondary Action Button */}
                              {booking.course_details_url && (
                                <Link 
                                  href={booking.course_details_url} 
                                  className="mt-3 inline-flex items-center gap-1.5 text-sm font-bold text-blue-600 hover:text-blue-800 transition-colors"
                                >
                                  <FileText className="h-4 w-4" /> View Course Syllabus
                                </Link>
                              )}
                            </div>
                          </div>
                          
                          {/* Right: Price & Status */}
                          <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start mt-2 sm:mt-0">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Fee</span>
                            <span className="text-lg font-black text-slate-700">Rs. {booking.locked_price}</span>
                          </div>
                        </div>

                        {/* Conditional Logic: Payment & Notifications */}
                        <div className="mt-5">
                          {booking.confirmed ? (
                            <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100/60 flex items-start gap-3">
                              <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                              <p className="text-sm text-emerald-800 font-medium leading-relaxed">
                                You are successfully booked for the online course starting <strong>{formatDualDate(booking.starting_date)}</strong>. Stay calm and be prepared for the class. For any queries, WhatsApp us for assistance.
                              </p>
                            </div>
                          ) : (
                            <div className="bg-orange-50 rounded-2xl p-5 border border-orange-200/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
                              <div className="flex items-start gap-3">
                                <AlertCircle className="h-5 w-5 text-orange-500 shrink-0 mt-0.5" />
                                <div>
                                  <p className="text-sm text-orange-900 font-black mb-1">
                                    Please pay Rs. {Math.round(booking.locked_price * 0.1)} ASAP to lock your fee and discount.
                                  </p>
                                  <p className="text-xs text-orange-700 font-medium">
                                    Remember: fees are subject to change. For queries, WhatsApp us.
                                  </p>
                                </div>
                              </div>
                              <Link 
                                href={`/order?name=${encodeURIComponent(userName)}&email=${encodeURIComponent(userEmail)}&order_type=course enrollment&request_type=course&course_name=${encodeURIComponent(booking.course_name)}&price=${Math.round(booking.locked_price * 0.1)}`} 
                                className="shrink-0 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white px-6 py-3 rounded-xl text-sm font-black shadow-lg shadow-orange-500/20 active:scale-95 transition-all text-center"
                              >
                                Pay Now
                              </Link>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  } 
                  
                  if (item._type === 'order') {
                    const order = item as Order & { _type: 'order' };
                    const isPending = order.status.toLowerCase() === 'pending';
                    const isRejected = order.status.toLowerCase() === 'rejected';
                    const isVerified = order.status.toLowerCase() === 'verified';
                    
                    return (
                      <div key={`order-${order.id}`} className="p-4 sm:p-6 hover:bg-slate-50/50 transition-colors rounded-[24px]">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                          
                          {/* Left: Order Info */}
                          <div className="flex items-start gap-4 flex-1">
                            <div className="hidden sm:flex h-12 w-12 rounded-[16px] bg-slate-100 border border-slate-200 items-center justify-center text-slate-500 shrink-0">
                              <FileText className="h-6 w-6" />
                            </div>
                            <div>
                              <div className="flex flex-wrap items-center gap-3">
                                <h3 className="text-lg font-black text-slate-900 capitalize">
                                  {order.order_type.replace('_', ' ')}
                                </h3>
                                {/* Order Status Badge */}
                                <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest ${
                                  isVerified ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                                  isRejected ? 'bg-red-100 text-red-800 border border-red-200' :
                                  'bg-orange-100 text-orange-800 border border-orange-200'
                                }`}>
                                  {order.status}
                                </span>
                              </div>
                              
                              <p className="text-sm font-bold text-slate-600 mt-1">
                                Item/Target: <span className="font-medium text-slate-900">{order.tutor_name}</span>
                              </p>
                              
                              <div className="flex flex-wrap items-center gap-3 mt-1.5 text-sm font-medium text-slate-500">
                                <span className="flex items-center gap-1.5">
                                  <Clock className="h-4 w-4" /> Ordered: {formatDualDate(order.created_at)}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          {/* Right: Price & Actions */}
                          <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start mt-2 sm:mt-0 gap-3">
                            <div className="text-right">
                              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Amount</span>
                              <span className="text-lg font-black text-slate-700">Rs. {order.price}</span>
                            </div>
                          </div>
                        </div>

                        {/* Payment Context or Retrying */}
                        <div className="mt-5">
                          {isVerified && (
                            <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100/60 flex items-start gap-3">
                              <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                              <p className="text-sm text-emerald-800 font-medium">
                                Your order has been verified successfully. Check your email or related platform section for updates.
                              </p>
                            </div>
                          )}
                          
                          {(isPending || isRejected) && (
                            <div className={`rounded-2xl p-5 border flex flex-col md:flex-row md:items-center justify-between gap-4 ${isRejected ? 'bg-red-50 border-red-200/60' : 'bg-orange-50 border-orange-200/60'}`}>
                              <div className="flex items-start gap-3">
                                {isRejected ? (
                                  <XCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                                ) : (
                                  <AlertCircle className="h-5 w-5 text-orange-500 shrink-0 mt-0.5" />
                                )}
                                <div>
                                  <p className={`text-sm font-black mb-1 ${isRejected ? 'text-red-900' : 'text-orange-900'}`}>
                                    {isRejected ? 'Payment rejected or screenshot invalid.' : 'Payment verification is pending.'}
                                  </p>
                                  <p className={`text-xs font-medium ${isRejected ? 'text-red-700' : 'text-orange-700'}`}>
                                    If the amount wasn't deducted, or you uploaded the wrong screenshot, please retry the payment below.
                                  </p>
                                </div>
                              </div>
                              
                              <Link 
                                href={`/order?name=${encodeURIComponent(userName)}&email=${encodeURIComponent(userEmail)}&type=${encodeURIComponent(order.order_type)}&course_name=${encodeURIComponent(order.tutor_name)}&price=${order.price}`} 
                                className={`shrink-0 text-white px-6 py-3 rounded-xl text-sm font-black active:scale-95 transition-all text-center ${
                                  isRejected 
                                    ? 'bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 shadow-lg shadow-red-500/20' 
                                    : 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-lg shadow-orange-500/20'
                                }`}
                              >
                                Pay Now
                              </Link>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  }
                  
                  return null;
                })}
              </div>
            </div>
          )}
        </section>

        {/* SECTION 2: Completed Courses / Certificates */}
        <section>
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2.5 bg-gradient-to-br from-amber-100 to-yellow-50 rounded-[14px] text-amber-600 shadow-sm border border-amber-200/50">
              <GraduationCap className="h-6 w-6" />
            </div>
            <h2 className="text-2xl font-black text-slate-900">Completed Courses</h2>
          </div>

          {certificates.length === 0 ? (
            <div className="rounded-[32px] border border-dashed border-slate-300 bg-slate-50 p-12 text-center">
              <Award className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-slate-700">No certificates yet</h3>
              <p className="text-slate-500 mt-2">Finish a course to earn your first certified credential.</p>
            </div>
          ) : (
            <motion.div 
              variants={staggerContainer} initial="hidden" animate="show" 
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {certificates.map((cert) => (
                <motion.div key={cert.id} variants={fadeUp}>
                  <Link 
                    href={`/certificate/?name=${encodeURIComponent(userName)}&email=${encodeURIComponent(userEmail)}`} 
                    className="group block cursor-pointer"
                  >
                    <div className="relative rounded-[28px] overflow-hidden bg-white border border-slate-200 shadow-sm transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/10 hover:-translate-y-1 hover:border-blue-200">
                      
                      <div className="aspect-[4/3] w-full bg-slate-100 relative overflow-hidden">
                        {cert.certificate_image ? (
                          <img 
                            src={getImageUrl(cert.certificate_image)} 
                            alt={cert.syllabus_name} 
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center bg-blue-50/50">
                            <Award className="h-16 w-16 text-blue-200" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent" />
                        <div className="absolute bottom-4 left-4 right-4 text-white">
                          <p className="text-xs font-bold text-blue-300 mb-1 flex items-center gap-1.5">
                            <Calendar className="h-3 w-3" /> 
                            {formatDualDate(cert.issue_date)}
                          </p>
                          <h3 className="text-lg font-black leading-tight line-clamp-2">{cert.syllabus_name || 'Professional Course'}</h3>
                        </div>
                      </div>
                      
                      <div className="p-5 flex items-center justify-between bg-white">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Credential ID</p>
                          <p className="text-sm font-bold text-slate-700 font-mono mt-0.5">{cert.certificate_code || `GH-${cert.id}XX`}</p>
                        </div>
                        <div className="h-8 w-8 rounded-full bg-slate-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                          <ChevronRight className="h-4 w-4" />
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          )}
        </section>

        {/* SECTION 3: Upcoming Online Courses */}
        <section>
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-indigo-100 to-blue-50 rounded-[14px] text-indigo-600 shadow-sm border border-indigo-200/50">
                <Sparkles className="h-6 w-6" />
              </div>
              <h2 className="text-2xl font-black text-slate-900">Upcoming Courses</h2>
            </div>
            <Link href="/online_courses" className="text-sm font-bold text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1">
              View All <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          <motion.div variants={staggerContainer} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {upcomingCourses.map((course) => {
              
              const offerPrice = course.fee;
              const fullPrice = (course.discount > 0 && course.discount < 100)
                ? Math.round(course.fee / (1 - (course.discount / 100))) 
                : course.fee;

              return (
                <motion.div key={course.id} variants={fadeUp}>
                  <Link href={`/onlinecourse/${encodeURIComponent(course.title)}`} className="group block h-full cursor-pointer">
                    <div className="relative h-full flex flex-col rounded-[28px] overflow-hidden bg-white border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                      
                      {course.discount > 0 && (
                        <div className="absolute top-4 -right-8 z-20 w-32 bg-red-500 text-white text-[10px] font-black uppercase tracking-widest py-1 text-center rotate-45 shadow-lg shadow-red-500/30">
                          {course.discount}% OFF
                        </div>
                      )}

                      <div className="relative h-40 w-full bg-slate-100 overflow-hidden">
                        {course.cover_pic ? (
                          <img 
                            src={getImageUrl(course.cover_pic, 'courses')} 
                            alt={course.title}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center">
                            <BookOpen className="h-10 w-10 text-slate-400" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-slate-900/10 group-hover:bg-transparent transition-colors duration-300" />
                      </div>

                      <div className="p-5 flex flex-col flex-grow">
                        <div className="flex flex-col gap-1.5 mb-3">
                          <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-wider text-slate-400">
                            <Clock className="h-3.5 w-3.5" />
                            {course.duration}
                          </div>
                          <div className="flex items-center gap-2 text-[10px] font-bold tracking-wide text-blue-600">
                            <Calendar className="h-3.5 w-3.5" />
                            Starts: {formatDualDate(course.start_datetime)}
                          </div>
                        </div>
                        
                        <h3 className="text-base font-black text-slate-900 leading-tight mb-4 flex-grow group-hover:text-blue-600 transition-colors">
                          {course.title}
                        </h3>
                        
                        <div className="flex items-end justify-between pt-4 border-t border-slate-100 mt-auto">
                          <div>
                            {course.discount > 0 && (
                              <p className="text-xs font-bold text-slate-400 line-through mb-0.5">Rs. {fullPrice}</p>
                            )}
                            <p className="text-lg font-black text-blue-600 flex items-center gap-1">
                              Rs. {offerPrice}
                            </p>
                          </div>
                          <div className="h-8 w-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                            <ChevronRight className="h-4 w-4" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        </section>

      </main>

      {/* FLOATING WHATSAPP BUTTON */}
      <a
        href="https://wa.me/9779763695665"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-[100] flex h-[60px] w-[60px] items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg shadow-[#25D366]/40 transition-transform duration-300 hover:scale-110 hover:shadow-xl hover:shadow-[#25D366]/50 active:scale-95"
        aria-label="Chat with us on WhatsApp"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="32"
          height="32"
          fill="currentColor"
          viewBox="0 0 16 16"
        >
          <path d="M13.601 2.326A7.85 7.85 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.9 7.9 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.9 7.9 0 0 0 13.6 2.326zM7.994 14.521a6.6 6.6 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.56 6.56 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592m3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.73.73 0 0 0-.529.247c-.182.198-.691.677-.691 1.654s.71 1.916.81 2.049c.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232"/>
        </svg>
      </a>

      {/* LOGIN POPUP MODAL */}
      {showLoginPopup && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[24px] p-6 sm:p-8 max-w-md w-full shadow-2xl relative animate-in zoom-in-95 duration-300">
            <button 
              onClick={() => setShowLoginPopup(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
              aria-label="Close popup"
            >
              <X className="h-5 w-5" />
            </button>
            
            <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 mb-5">
              <AlertCircle className="h-6 w-6" />
            </div>
            
            <h3 className="text-xl font-black text-slate-900 mb-3">Sign in to continue</h3>
            <p className="text-slate-600 mb-6 leading-relaxed text-sm">
              For all your activities like booking online courses and tracking certificates, your email is taken as your identity. Please log in for a smoother experience.
            </p>
            
            <div className="flex flex-col gap-3">
              <Link 
                href="/login" 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-lg shadow-blue-500/20"
              >
                Sign In Now <ChevronRight className="h-4 w-4" />
              </Link>
              <button 
                onClick={() => setShowLoginPopup(false)}
                className="w-full bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold py-3 px-4 rounded-xl transition-colors"
              >
                Continue as Guest
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}