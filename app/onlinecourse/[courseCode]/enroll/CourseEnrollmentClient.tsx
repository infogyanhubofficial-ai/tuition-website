'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import NepaliDate from 'nepali-date-converter';
import { createClient } from '@/lib/supabase/client';
import {
  CheckCircle2,
  ChevronLeft,
  Calendar,
  AlertCircle,
  Loader2,
  CreditCard,
  Clock,
  Check,
  Users,
  Shield,
  Award,
  Sparkles,
  Lock,
  Info,
  BookOpen,
  HeadphonesIcon
} from 'lucide-react';
import confetti from 'canvas-confetti';

const WhatsAppIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-emerald-500">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.414 0 .004 5.412 0 12.048c0 2.12.554 4.189 1.605 6.006L0 24l6.117-1.605a11.803 11.803 0 005.925 1.586h.005c6.637 0 12.048-5.414 12.052-12.051a11.83 11.83 0 00-3.528-8.521z" />
  </svg>
);

type Course = {
  id: string;
  course_code?: string;
  title: string;
  description?: string | null;
  batch_id?: string;
  fee: number;
  discount?: number | null;
  start_datetime?: string | null;
  timing?: string | null;
  duration?: string | null;
};

type EnrollmentForm = {
  full_name: string;
  email: string;
  whatsapp: string;
  remarks: string;
};

export default function CourseEnrollmentClient() {
  const params = useParams();
  const router = useRouter();

  const rawParam = params?.courseCode || params?.id;
  const courseSlug = Array.isArray(rawParam) ? rawParam[0] : rawParam || '';

  const supabase = useMemo(() => createClient(), []);

  const decodedCourseName = useMemo(() => {
    if (!courseSlug) return '';
    try {
      return decodeURIComponent(courseSlug);
    } catch {
      return courseSlug;
    }
  }, [courseSlug]);

  const [isSignedIn, setIsSignedIn] = useState(false);
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [validationMessages, setValidationMessages] = useState<string[]>([]);
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);

  const [userId, setUserId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const [form, setForm] = useState<EnrollmentForm>({
    full_name: '',
    email: '',
    whatsapp: '',
    remarks: '',
  });

  // Calculate filled steps for progress bar
  const filledCount = useMemo(() => {
    let count = 0;
    if (form.full_name.trim()) count++;
    if (form.email.trim()) count++;
    if (form.whatsapp.replace(/\D/g, '').length === 10) count++;
    if (form.remarks.trim()) count++;
    return count;
  }, [form]);

  const getNepaliDateLine = (dateString?: string | null) => {
    if (!dateString) return 'मिति तय हुन बाँकी';
    try {
      const adDate = new Date(dateString);
      const bsDate = new NepaliDate(adDate);
      const nepaliDays = ['आइतबार', 'सोमबार', 'मंगलबार', 'बुधबार', 'बिहीबार', 'शुक्रबार', 'शनिबार'];
      const dayName = nepaliDays[adDate.getDay()];
      return `${bsDate.format('MMMM D, YYYY', 'np')} (${dayName})`;
    } catch {
      return 'मिति तय हुन बाँकी';
    }
  };

  useEffect(() => {
    let isMounted = true;

    const initData = async () => {
      setLoading(true);
      setErrors({});

      try {
        const { data: userData } = await supabase.auth.getUser();
        const user = userData?.user ?? null;

        if (user && isMounted) {
          setIsSignedIn(true);
          setUserId(user.id);
          setForm((prev) => ({
            ...prev,
            full_name: user.user_metadata?.full_name || prev.full_name,
            email: user.email || prev.email,
          }));
        } else if (isMounted) {
          setIsSignedIn(false);
          setUserId(null);
        }

        if (decodedCourseName) {
          const res = await fetch(`/api/online_courses/${encodeURIComponent(decodedCourseName)}`);
          
          if (!res.ok) {
            const rawText = await res.text();
            let errorMessage = "Course not found";
            try {
               const parsed = JSON.parse(rawText);
               if (parsed.error) errorMessage = parsed.error;
            } catch(e) {}
            
            throw new Error(errorMessage);
          }

          const courseData = await res.json();
          if (isMounted) setCourse(courseData);
        } else {
          throw new Error("Invalid course parameter.");
        }
      } catch (error: any) {
        if (!isMounted) return;
        setErrors({
          general: error?.message || 'Could not load course details.',
        });
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    initData();

    return () => {
      isMounted = false;
    };
  }, [decodedCourseName, supabase]);

  const pricing = useMemo(() => {
    if (!course) return { fullFee: 0, lockedPrice: 0, savings: 0, depositAmount: 0, discountPercent: 0 };
    const lockedPrice = Math.round(Number(course.fee) || 0);
    const discountPercent = Number(course.discount) || 0;
    const fullFee = discountPercent > 0 && discountPercent < 100
      ? Math.round(lockedPrice / (1 - discountPercent / 100))
      : lockedPrice;
    return {
      fullFee,
      lockedPrice,
      savings: fullFee - lockedPrice,
      depositAmount: Math.round(lockedPrice * 0.1),
      discountPercent,
    };
  }, [course]);

  const hasCourseStarted = useMemo(() => {
    if (!course?.start_datetime) return false;
    return new Date(course.start_datetime) < new Date();
  }, [course?.start_datetime]);

  const amountToPay = hasCourseStarted ? pricing.lockedPrice : pricing.depositAmount;

  const handleWhatsappChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 10);
    let formatted = raw;
    if (raw.length > 4) formatted = `${raw.slice(0, 4)} ${raw.slice(4, 7)} ${raw.slice(7, 10)}`.trim();
    setForm((prev) => ({ ...prev, whatsapp: formatted }));
    if (errors.whatsapp && raw.length === 10) setErrors((prev) => ({ ...prev, whatsapp: '' }));
  };

  const validateForm = useCallback(() => {
    const newErrors: Record<string, string> = {};
    const missingFields: string[] = [];

    if (!form.full_name.trim()) {
      newErrors.full_name = 'Required';
      missingFields.push('Full Name');
    }
    if (!form.email.trim() || !/^\S+@\S+\.\S+$/.test(form.email)) {
      newErrors.email = 'Required';
      missingFields.push('Valid Email Address');
    }
    if (form.whatsapp.replace(/\D/g, '').length !== 10) {
      newErrors.whatsapp = 'Required';
      missingFields.push('10-Digit WhatsApp Number');
    }

    setErrors(newErrors);

    if (missingFields.length > 0) {
      setValidationMessages(missingFields);
      setShowValidationModal(true);
      return false;
    }
    return true;
  }, [form]);

  const isFormValid = useMemo(() => {
    return form.full_name.trim() && /^\S+@\S+\.\S+$/.test(form.email) && form.whatsapp.replace(/\D/g, '').length === 10;
  }, [form]);

  const triggerConfetti = () => {
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 1000 };
    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval = window.setInterval(() => {
      const timeLeft = animationEnd - Date.now();
      if (timeLeft <= 0) return window.clearInterval(interval);
      const particleCount = 50 * (timeLeft / duration);
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
    }, 250);
  };

  const handleEnrollment = async () => {
    if (!course || !course.batch_id) {
      setErrors({ general: 'Course details or batch information missing.' });
      return;
    }
    if (!validateForm()) return;

    setSubmitting(true);
    setErrors({});
    const formattedWhatsapp = `+977${form.whatsapp.replace(/\D/g, '')}`;

    try {
      let query = supabase.from('enrollments_v2').select('id').eq('batch_id', course.batch_id);
      if (userId) query = query.or(`user_id.eq.${userId},email.eq.${form.email}`);
      else query = query.or(`email.eq.${form.email},whatsapp_number.eq.${formattedWhatsapp}`);

      const { data: existingRecords, error: checkError } = await query;
      if (checkError) throw checkError;

      if (existingRecords && existingRecords.length > 0) {
        router.push('/dashboard');
        return;
      }

      const { data: newEnrollment, error: insertError } = await supabase
        .from('enrollments_v2')
        .insert([{
          user_id: userId || null,
          batch_id: course.batch_id,
          full_name: form.full_name.trim(),
          email: form.email.trim(),
          whatsapp_number: formattedWhatsapp,
          remarks: form.remarks.trim() || null,
        }])
        .select('id')
        .single();

      if (insertError) throw insertError;

      if (newEnrollment?.id) {
        const { data: newOrder, error: orderError } = await supabase
          .from('orders_v2')
          .insert([{
            user_id: userId || null,
            enrollment_id: newEnrollment.id,
            order_type: 'Online Course',
            order_name: course.title,
            locked_price: pricing.lockedPrice,
            paid_amount: 0.00,
            full_name: form.full_name.trim(),
            email: form.email.trim(),
            whatsapp_number: formattedWhatsapp,
            status: 'pending'
          }])
          .select('id')
          .single();

        if (orderError) throw orderError;
        if (newOrder?.id) setCreatedOrderId(newOrder.id);
      }

      triggerConfetti();
      setShowSuccessModal(true);
    } catch (error: any) {
      setErrors({ general: error?.message || 'Failed to enroll. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleProceedToPayment = () => {
    const queryParams = new URLSearchParams({
      name: form.full_name,
      email: form.email,
      phone: form.whatsapp.replace(/\D/g, ''),
      order_type: 'Online Course', // FIX: Specifically pass 'Online Course' here instead of 'Course'
      order_name: course?.title || '',
      course_name: course?.title || '',
      price: String(amountToPay ?? 0),
    });
    if (createdOrderId) queryParams.append('order_id', createdOrderId);
    router.push(`/order?${queryParams.toString()}`);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#F5F8FF]">
        <Loader2 className="w-10 h-10 text-[#1E3A8A] animate-spin" />
      </div>
    );
  }

  const firstName = form.full_name.trim() ? form.full_name.split(' ')[0] : 'Your';

  return (
    // 1. Soft Educational Background Base
    <div className="fixed inset-0 z-[100] bg-gradient-to-br from-[#F5F8FF] to-white overflow-y-auto flex flex-col font-sans text-slate-900">
      
      {/* Background Micro-Polish: Abstract Light Shapes */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-15%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[#1E3A8A]/5 blur-[100px]" />
        <div className="absolute top-[30%] right-[-10%] w-[40%] h-[40%] rounded-full bg-[#FF7A18]/5 blur-[120px]" />
      </div>

      <AnimatePresence>
        {/* VALIDATION MODAL */}
        {showValidationModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-[#0B1B3A]/40 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="bg-white rounded-3xl shadow-xl max-w-sm w-full overflow-hidden border border-slate-100"
            >
              <div className="p-6 text-center">
                <AlertCircle strokeWidth={1.5} className="w-10 h-10 text-[#FF7A18] mx-auto mb-3" />
                <h3 className="text-xl font-bold text-slate-900 mb-1">Details Required</h3>
                <p className="text-slate-500 text-sm mb-5">Please complete these fields to proceed:</p>
                <ul className="space-y-2 mb-6 text-left bg-slate-50 p-4 rounded-2xl">
                  {validationMessages.map((msg, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm font-medium text-slate-700">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#FF7A18]" />
                      {msg}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => setShowValidationModal(false)}
                  className="w-full bg-[#0B1B3A] text-white font-semibold py-3.5 rounded-2xl hover:bg-[#1E3A8A] transition-colors shadow-md"
                >
                  Return to Form
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* SUCCESS MODAL */}
        {showSuccessModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-[#0B1B3A]/60 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden"
            >
              <div className="p-8 text-center bg-emerald-50/50 border-b border-emerald-100/50">
                <CheckCircle2 strokeWidth={1.5} className="w-14 h-14 text-emerald-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Seat Reserved!</h2>
                <p className="text-slate-600 mt-2 text-sm leading-relaxed">
                  {hasCourseStarted 
                    ? "Complete full payment to secure admission and unlock immediate access to class links." 
                    : "Complete the 10% deposit to lock in your discounted seat."}
                </p>
              </div>

              <div className="p-8 space-y-4">
                <div className="flex justify-between items-center py-3 border-b border-slate-100 mb-4">
                  <span className="text-slate-500 text-sm font-medium">{hasCourseStarted ? 'Full Amount' : 'Deposit Amount'}</span>
                  <span className="text-2xl font-bold text-slate-900 tracking-tight">Rs. {amountToPay.toLocaleString()}</span>
                </div>
                
                <button
                  onClick={handleProceedToPayment}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#FF7A18] to-orange-400 text-white font-bold py-4 rounded-2xl shadow-[0_8px_20px_-6px_rgba(255,122,24,0.5)] hover:-translate-y-0.5 transition-all duration-300"
                >
                  <CreditCard strokeWidth={2} className="w-5 h-5" /> Proceed to Payment
                </button>
                <button
                  onClick={() => router.push('/dashboard')}
                  className="w-full text-slate-500 font-medium py-3 rounded-2xl hover:bg-slate-50 transition-colors"
                >
                  Pay Later via Dashboard
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* HEADER NAV - Glassmorphic minimal header */}
      <nav className="relative z-20 w-full min-h-[64px] py-2 bg-white/70 backdrop-blur-md border-b border-white flex items-center px-4 lg:px-8 justify-between shrink-0 sticky top-0 shadow-sm">
        <Link
          href={`/onlinecourse/${encodeURIComponent(course?.course_code || decodedCourseName)}`}
          className="flex items-center gap-1.5 text-slate-500 hover:text-[#1E3A8A] font-medium text-sm transition-colors whitespace-nowrap shrink-0 group"
        >
          <ChevronLeft strokeWidth={2} className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          <span className="hidden sm:inline">Back to Course</span>
          <span className="sm:hidden">Back</span>
        </Link>
        <div className="flex-1 min-w-0 px-4 flex flex-col items-end sm:items-center justify-center">
          <h1 className="truncate text-sm sm:text-base font-bold text-[#0B1B3A]">
            <span className="text-[#1E3A8A]">{firstName}&apos;s</span> Enrollment
          </h1>
          {/* Progress Bar added here */}
          <div className="flex gap-1.5 mt-1.5">
            {[1, 2, 3, 4].map((step) => (
              <div
                key={step}
                className={`h-1.5 w-6 sm:w-8 rounded-full transition-all duration-500 ${
                  filledCount >= step ? 'bg-emerald-500 shadow-sm' : 'bg-slate-200'
                }`}
              />
            ))}
          </div>
        </div>
      </nav>

      {/* MAIN LAYOUT - Balanced 2-Column Grid */}
      <main className="relative z-10 flex-1 w-full max-w-[1100px] mx-auto px-4 sm:px-6 py-8 lg:py-12 pb-32 lg:pb-12">
        
        {/* HERO STRIP */}
        <div className="mb-10 text-center lg:text-left max-w-2xl mx-auto lg:mx-0">
          <p className="text-xs sm:text-sm font-bold text-[#FF7A18] mb-3 uppercase tracking-widest">
            Complete your registration for
          </p>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#0B1B3A] tracking-tight leading-[1.15] mb-4">
            {course?.title || 'Loading Course...'}
          </h1>
          <div className="flex flex-wrap justify-center lg:justify-start items-center gap-3 sm:gap-6 mt-6">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-600 bg-white/60 px-3 py-1.5 rounded-full border border-white shadow-sm">
              <Users strokeWidth={1.5} className="w-4 h-4 text-[#1E3A8A]" /> 500+ Students
            </div>
            <div className="flex items-center gap-2 text-sm font-medium text-slate-600 bg-white/60 px-3 py-1.5 rounded-full border border-white shadow-sm">
              <Award strokeWidth={1.5} className="w-4 h-4 text-[#1E3A8A]" /> Certificate Included
            </div>
            <div className="flex items-center gap-2 text-sm font-medium text-slate-600 bg-white/60 px-3 py-1.5 rounded-full border border-white shadow-sm">
              <BookOpen strokeWidth={1.5} className="w-4 h-4 text-[#1E3A8A]" /> Industry Focused
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          
          {/* LEFT COLUMN - Form Fields in Soft Cards */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            
            {/* Soft Info Card */}
            {course?.description && (
              <div className="bg-white/60 backdrop-blur-md p-6 rounded-3xl border border-white shadow-sm">
                <p className="text-slate-600 text-sm leading-relaxed font-medium">
                  {course.description}
                </p>
              </div>
            )}

            {/* Main Form Container */}
            <div className="bg-white/80 backdrop-blur-xl p-6 sm:p-8 rounded-3xl border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
              <div className="flex justify-between items-end mb-6">
                <h3 className="text-xl font-bold text-[#0B1B3A] tracking-tight">Student Details</h3>
                {isFormValid && (
                  <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs font-bold text-emerald-600 flex items-center gap-1.5 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                    <CheckCircle2 strokeWidth={2} className="w-3.5 h-3.5" /> Ready
                  </motion.span>
                )}
              </div>
              
              <div className="space-y-5">
                <div className="relative group">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 block transition-colors group-focus-within:text-[#1E3A8A]">Full Name</label>
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      value={form.full_name}
                      onChange={(e) => {
                        setForm(prev => ({ ...prev, full_name: e.target.value }));
                        if (errors.full_name) setErrors(prev => ({ ...prev, full_name: '' }));
                      }}
                      disabled={isSignedIn}
                      placeholder="e.g. John Doe"
                      className={`w-full px-5 py-4 rounded-2xl bg-white outline-none text-slate-900 font-medium placeholder:text-slate-300 transition-all duration-300 ${
                        errors.full_name ? 'border border-red-300 shadow-[0_0_0_4px_rgba(239,68,68,0.1)]' : 'border border-slate-100 focus:border-[#1E3A8A]/30 focus:shadow-[0_0_0_4px_rgba(30,58,138,0.05)] hover:border-slate-200 shadow-sm'
                      }`}
                    />
                    {form.full_name.trim() && !errors.full_name && <Check strokeWidth={3} className="absolute right-5 w-4 h-4 text-emerald-400" />}
                  </div>
                </div>

                <div className="relative group">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 block transition-colors group-focus-within:text-[#1E3A8A]">Email Address</label>
                  <div className="relative flex items-center">
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => {
                        setForm(prev => ({ ...prev, email: e.target.value }));
                        if (errors.email) setErrors(prev => ({ ...prev, email: '' }));
                      }}
                      disabled={isSignedIn}
                      placeholder="e.g. john@example.com"
                      className={`w-full px-5 py-4 rounded-2xl bg-white outline-none text-slate-900 font-medium placeholder:text-slate-300 transition-all duration-300 ${
                        errors.email ? 'border border-red-300 shadow-[0_0_0_4px_rgba(239,68,68,0.1)]' : 'border border-slate-100 focus:border-[#1E3A8A]/30 focus:shadow-[0_0_0_4px_rgba(30,58,138,0.05)] hover:border-slate-200 shadow-sm'
                      }`}
                    />
                    {form.email.trim() && !errors.email && /^\S+@\S+\.\S+$/.test(form.email) && <Check strokeWidth={3} className="absolute right-5 w-4 h-4 text-emerald-400" />}
                  </div>
                </div>

                <div className="relative group">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 block transition-colors group-focus-within:text-[#1E3A8A]">WhatsApp Number</label>
                  <div className={`flex items-center rounded-2xl bg-white transition-all duration-300 shadow-sm ${
                    errors.whatsapp ? 'border border-red-300 shadow-[0_0_0_4px_rgba(239,68,68,0.1)]' : 'border border-slate-100 focus-within:border-[#1E3A8A]/30 focus-within:shadow-[0_0_0_4px_rgba(30,58,138,0.05)] hover:border-slate-200'
                  }`}>
                    <div className="pl-5 pr-4 py-4 flex items-center border-r border-slate-100 bg-slate-50/50 rounded-l-2xl gap-2.5 shrink-0">
                      <WhatsAppIcon />
                      <span className="text-slate-600 font-bold text-sm">+977</span>
                    </div>
                    <div className="relative flex-1 flex items-center">
                      <input
                        type="tel"
                        value={form.whatsapp}
                        onChange={handleWhatsappChange}
                        placeholder="98XX XXX XXX"
                        className="w-full px-5 py-4 bg-transparent outline-none text-slate-900 font-medium placeholder:text-slate-300"
                      />
                      {form.whatsapp.replace(/\D/g, '').length === 10 && !errors.whatsapp && <Check strokeWidth={3} className="absolute right-5 w-4 h-4 text-emerald-400" />}
                    </div>
                  </div>
                </div>

                <div className="relative group pt-2">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 block transition-colors group-focus-within:text-[#1E3A8A]">Remarks (Optional)</label>
                  <textarea
                    value={form.remarks}
                    onChange={(e) => setForm(prev => ({ ...prev, remarks: e.target.value }))}
                    placeholder="Any specific expectations from this course?"
                    className="w-full px-5 py-4 rounded-2xl bg-white border border-slate-100 focus:border-[#1E3A8A]/30 focus:shadow-[0_0_0_4px_rgba(30,58,138,0.05)] hover:border-slate-200 shadow-sm outline-none text-sm text-slate-900 font-medium placeholder:text-slate-300 resize-none h-24 transition-all duration-300"
                  />
                </div>

                {errors.general && (
                  <div className="p-4 rounded-2xl bg-red-50 text-red-600 text-sm font-semibold flex items-center gap-2 border border-red-100">
                    <AlertCircle strokeWidth={2} className="w-5 h-5 shrink-0" /> {errors.general}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN - Sticky Glass Pricing Panel */}
          <div className="lg:col-span-5 relative">
            <div className="sticky top-24 space-y-6">
              
              {/* Educational Trust Block */}
              <div className="bg-white/70 backdrop-blur-md p-6 rounded-3xl border border-white shadow-sm">
                <h4 className="text-[11px] font-bold uppercase text-slate-400 tracking-widest mb-4">Upcoming Batch Schedule</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold mb-1">
                      <Calendar strokeWidth={1.5} className="w-4 h-4 text-[#1E3A8A]" /> Start Date
                    </div>
                    <p className="text-sm font-bold text-[#0B1B3A]">
                      {course?.start_datetime ? format(new Date(course.start_datetime), 'MMM do, yyyy') : 'TBD'}
                    </p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold mb-1">
                      <Clock strokeWidth={1.5} className="w-4 h-4 text-[#1E3A8A]" /> Time
                    </div>
                    <p className="text-sm font-bold text-[#0B1B3A]">{course?.timing || 'TBD'}</p>
                  </div>
                </div>
              </div>

              {/* MODERN GLASS PRICING CARD */}
              <div className="bg-[#0B1B3A]/90 backdrop-blur-xl rounded-3xl p-8 shadow-[0_20px_60px_-15px_rgba(11,27,58,0.3)] border border-white/10 hover:shadow-[0_20px_60px_-15px_rgba(30,58,138,0.5)] hover:border-white/20 transition-all duration-500 relative overflow-hidden group">
                
                {/* Subtle Inner Glow */}
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-white/5 to-transparent pointer-events-none opacity-50" />
                
                <div className="relative z-10 space-y-4 mb-8 border-b border-white/10 pb-6">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 text-sm font-medium">Standard Fee</span>
                    <span className={`text-slate-400 text-sm ${pricing.savings > 0 ? 'line-through decoration-slate-500/50' : ''}`}>
                      Rs. {pricing.fullFee.toLocaleString()}
                    </span>
                  </div>

                  {pricing.savings > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-white text-sm font-medium">Discount</span>
                      {/* Animated Discount Pill */}
                      <motion.span 
                        animate={{ scale: [1, 1.05, 1] }} 
                        transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                        className="bg-[#FF7A18]/20 text-[#FF7A18] text-xs font-bold px-2.5 py-1 rounded-full border border-[#FF7A18]/30 flex items-center gap-1.5"
                      >
                        <Sparkles strokeWidth={2} className="w-3 h-3" /> Save Rs. {pricing.savings.toLocaleString()}
                      </motion.span>
                    </div>
                  )}
                </div>

                <div className="relative z-10 mb-8">
                  <span className="text-[#FF7A18] text-[10px] font-black uppercase tracking-[0.2em] mb-2 block opacity-90">
                    Locked Final Price
                  </span>
                  <div className="flex items-baseline gap-2 group-hover:scale-[1.02] transition-transform duration-300 origin-left">
                    <span className="text-2xl text-white/60 font-medium">Rs.</span>
                    <span className="text-5xl font-black tracking-tight text-white drop-shadow-md">
                      {pricing.lockedPrice.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Info Callout */}
                <div className="relative z-10 hidden lg:flex items-start gap-3 p-4 mb-8 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-sm">
                  <Info strokeWidth={2} className="w-5 h-5 text-[#FF7A18] shrink-0 mt-0.5 opacity-90" />
                  <p className="text-slate-300 text-xs leading-relaxed font-medium">
                    Only <strong className="text-white font-bold text-sm">Rs. {pricing.depositAmount.toLocaleString()}</strong> is required for booking. The remaining payment can be made after the orientation session.
                  </p>
                </div>

                {/* Primary Conversion CTA */}
                <div className="relative z-10 hidden lg:block">
                  <motion.button
                    animate={isFormValid ? { scale: [1, 1.02, 1] } : {}}
                    transition={{ repeat: Infinity, duration: 2.5 }}
                    onClick={handleEnrollment}
                    disabled={submitting || !course}
                    className="w-full bg-gradient-to-r from-[#FF7A18] to-orange-400 text-white font-bold py-4.5 rounded-full shadow-[0_8px_20px_-6px_rgba(255,122,24,0.5)] hover:shadow-[0_12px_24px_-8px_rgba(255,122,24,0.6)] hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:hover:translate-y-0 flex justify-center items-center gap-2 text-[15px] tracking-wide"
                  >
                    {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Secure My Seat Now'}
                  </motion.button>
                </div>
              </div>

              {/* Educational Trust Footer */}
              <div className="hidden lg:flex flex-col gap-2.5 px-2">
                <div className="flex items-center gap-2.5 text-xs text-slate-500 font-medium">
                  <Lock strokeWidth={1.5} className="w-4 h-4 text-slate-400" /> Secured GyanHub's Encrypted Registration
                </div>
                <div className="flex items-center gap-2.5 text-xs text-slate-500 font-medium">
                  <HeadphonesIcon strokeWidth={1.5} className="w-4 h-4 text-slate-400" /> On-call assistance available via WA: 9763695665
                </div>
              </div>

            </div>
          </div>
        </div>
      </main>

      {/* MOBILE STICKY CTA - Modern Floating Style */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-xl border-t border-white shadow-[0_-20px_40px_rgba(11,27,58,0.08)] z-50 rounded-t-3xl pb-8">
        <div className="mb-3.5 text-center px-4">
          <p className="text-[11px] text-slate-500 font-medium leading-snug">
            Only <strong className="text-[#0B1B3A] font-extrabold text-xs">Rs. {pricing.depositAmount.toLocaleString()}</strong> required for booking. Pay rest after orientation.
          </p>
        </div>
        <button
          onClick={handleEnrollment}
          disabled={submitting || !course}
          className="w-full bg-gradient-to-r from-[#FF7A18] to-orange-400 text-white font-bold py-4 rounded-full shadow-[0_8px_20px_-6px_rgba(255,122,24,0.4)] disabled:opacity-50 flex justify-center items-center gap-2 text-sm sm:text-base tracking-wide"
        >
          {submitting ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : !isFormValid ? (
            'Complete Details to Reserve'
          ) : (
            'Secure My Seat Now'
          )}
        </button>
      </div>
    </div>
  );
}