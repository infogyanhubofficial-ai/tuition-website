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
  ShieldCheck,
  Calendar,
  AlertCircle,
  Loader2,
  AlignLeft,
  Mail,
  User,
  CreditCard,
  Clock,
  Check,
  Users,
  Shield,
  Award,
  Sparkles,
  Phone,
  Lock,
  Info,
} from 'lucide-react';
import confetti from 'canvas-confetti';

const WhatsAppIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-emerald-500">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.414 0 .004 5.412 0 12.048c0 2.12.554 4.189 1.605 6.006L0 24l6.117-1.605a11.803 11.803 0 005.925 1.586h.005c6.637 0 12.048-5.414 12.052-12.051a11.83 11.83 0 00-3.528-8.521z" />
  </svg>
);

type Course = {
  id: string;
  title: string;
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

  const rawParam = params?.id;
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

  const [userId, setUserId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const [form, setForm] = useState<EnrollmentForm>({
    full_name: '',
    email: '',
    whatsapp: '',
    remarks: '',
  });

  const getNepaliDateLine = (dateString?: string | null) => {
    if (!dateString) return 'मिति तय हुन बाँकी';
    try {
      const adDate = new Date(dateString);
      const bsDate = new NepaliDate(adDate);
      const nepaliDays = ['आइतबार', 'सोमबार', 'मंगलबार', 'बुधबार', 'बिहीबार', 'शुक्रबार', 'शनिबार'];
      const dayName = nepaliDays[adDate.getDay()];
      const bsFormatted = bsDate.format('MMMM D, YYYY', 'np');
      return `${bsFormatted} (${dayName})`;
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
        const [userResult, courseResult] = await Promise.all([
          supabase.auth.getUser(),
          decodedCourseName
            ? fetch(`/api/online_courses/${encodeURIComponent(decodedCourseName)}`)
            : Promise.resolve(null),
        ]);

        if (!isMounted) return;

        const user = userResult?.data?.user ?? null;

        if (user) {
          setIsSignedIn(true);
          setUserId(user.id);
          setForm((prev) => ({
            ...prev,
            full_name: user.user_metadata?.full_name || prev.full_name,
            email: user.email || prev.email,
          }));
        } else {
          setIsSignedIn(false);
          setUserId(null);
        }

        if (!courseResult) {
          setErrors({ general: 'Course not found.' });
          return;
        }

        if (!courseResult.ok) {
          const data = await courseResult.json().catch(() => null);
          throw new Error(data?.error || 'Course not found');
        }

        const courseData = await courseResult.json();
        if (!isMounted) return;

        setCourse(courseData);
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
    if (!course) {
      return {
        fullFee: 0,
        lockedPrice: 0,
        savings: 0,
        depositAmount: 0,
        discountPercent: 0,
      };
    }

    const lockedPrice = Math.round(Number(course.fee) || 0);
    const discountPercent = Number(course.discount) || 0;

    const fullFee =
      discountPercent > 0 && discountPercent < 100
        ? Math.round(lockedPrice / (1 - discountPercent / 100))
        : lockedPrice;

    const savings = fullFee - lockedPrice;
    const depositAmount = Math.round(lockedPrice * 0.1);

    return {
      fullFee,
      lockedPrice,
      savings,
      depositAmount,
      discountPercent,
    };
  }, [course]);

  const handleWhatsappChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 10);
    let formatted = raw;

    if (raw.length > 4) {
      formatted = `${raw.slice(0, 4)} ${raw.slice(4, 7)} ${raw.slice(7, 10)}`.trim();
    }

    setForm((prev) => ({ ...prev, whatsapp: formatted }));

    if (errors.whatsapp && raw.length === 10) {
      setErrors((prev) => ({ ...prev, whatsapp: '' }));
    }
  };

  const validateForm = useCallback(() => {
    const newErrors: Record<string, string> = {};
    const missingFields: string[] = [];

    if (!form.full_name.trim()) {
      newErrors.full_name = 'Name is required';
      missingFields.push('Full Name');
    }

    if (!form.email.trim() || !/^\S+@\S+\.\S+$/.test(form.email)) {
      newErrors.email = 'Valid email is required';
      missingFields.push('Valid Email Address');
    }

    if (form.whatsapp.replace(/\D/g, '').length !== 10) {
      newErrors.whatsapp = 'Valid 10-digit number required';
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

  const triggerConfetti = () => {
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 1000 };

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval = window.setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        window.clearInterval(interval);
        return;
      }

      const particleCount = 50 * (timeLeft / duration);

      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
      });

      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
      });
    }, 250);
  };

  const handleEnrollment = async () => {
    if (!course) {
      setErrors({ general: 'Course details are not loaded yet.' });
      return;
    }

    if (!validateForm()) return;

    setSubmitting(true);
    setErrors({});

    const formattedWhatsapp = `+977${form.whatsapp.replace(/\D/g, '')}`;

    try {
      let query = supabase.from('enrollments').select('id').eq('course_id', course.id);

      if (userId) {
        query = query.or(`user_id.eq.${userId},email.eq.${form.email}`);
      } else {
        query = query.or(`email.eq.${form.email},whatsapp_number.eq.${formattedWhatsapp}`);
      }

      const { data: existingRecords, error: checkError } = await query;

      if (checkError) throw checkError;

      if (existingRecords && existingRecords.length > 0) {
        setErrors({
          general: 'You have already registered for this course. Please check your WhatsApp/Email.',
        });
        return;
      }

      const { error: insertError } = await supabase.from('enrollments').insert([
        {
          user_id: userId,
          course_id: course.id,
          full_name: form.full_name.trim(),
          email: form.email.trim(),
          whatsapp_number: formattedWhatsapp,
          course_name: course.title,
          locked_price: pricing.lockedPrice,
          starting_date: course.start_datetime || null,
          remarks: form.remarks.trim() || null,
          status: 'pending',
        },
      ]);

      if (insertError) throw insertError;

      triggerConfetti();
      setShowSuccessModal(true);
    } catch (error: any) {
      setErrors({
        general: error?.message || 'Failed to enroll. Please try again.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleProceedToPayment = () => {
    const params = new URLSearchParams({
      name: form.full_name,
      email: form.email,
      phone: form.whatsapp.replace(/\D/g, ''),
      order_type: 'Course',
      order_name: course?.title || '',
      course_name: course?.title || '',
      price: String(pricing.depositAmount ?? 0),
    });

    router.push(`/order?${params.toString()}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-10 h-10 text-orange-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans pb-[100px] lg:pb-0">
      <AnimatePresence>
        {showValidationModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="bg-white rounded-[24px] shadow-2xl max-w-md w-full overflow-hidden border border-slate-100"
            >
              <div className="bg-orange-50 p-6 flex flex-col items-center border-b border-orange-100">
                <div className="w-14 h-14 bg-orange-100 rounded-full flex items-center justify-center mb-3">
                  <AlertCircle className="w-7 h-7 text-orange-600" />
                </div>
                <h3 className="text-xl font-black text-slate-900 text-center">Incomplete Information</h3>
              </div>

              <div className="p-6">
                <p className="text-slate-600 font-medium mb-4 text-center">
                  Please provide the following details to proceed with your enrollment:
                </p>

                <ul className="space-y-3 mb-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  {validationMessages.map((msg, idx) => (
                    <li key={idx} className="flex items-center gap-3 text-sm font-bold text-slate-700">
                      <div className="w-2 h-2 rounded-full bg-orange-500 shadow-sm shadow-orange-500/50" />
                      {msg}
                    </li>
                  ))}
                </ul>

                <div className="bg-blue-50/70 p-4 rounded-xl border border-blue-100 mb-6 flex gap-3 items-start">
                  <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-blue-800 font-medium leading-relaxed">
                    <span className="font-bold block mb-1">Why do we need this?</span>
                    We require accurate contact information for processing your certification, issuing billing receipts, and securely sharing class links and updates.
                  </p>
                </div>

                <button
                  onClick={() => setShowValidationModal(false)}
                  className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl hover:bg-black transition-colors shadow-lg shadow-slate-900/10"
                >
                  Got it, let me fill that out
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {showSuccessModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              className="bg-white rounded-[32px] shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-100"
            >
              <div className="bg-emerald-600 p-8 text-white text-center relative overflow-hidden">
                <div className="absolute inset-0 opacity-10" />
                <CheckCircle2 className="w-16 h-16 text-white mx-auto mb-4 drop-shadow-lg" />
                <h2 className="text-3xl font-black leading-tight">Seat Reserved!</h2>
                <p className="text-emerald-100 mt-2 font-medium">
                  You're one step away from confirming your spot.
                </p>
              </div>

              <div className="p-8 space-y-6">
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 text-center">
                  <h3 className="text-lg font-black text-slate-900 mb-2">Next Step: Complete Payment</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    We've saved your spot and locked in your discount. To fully confirm your enrollment,
                    please pay the 10% deposit from your offered fee.
                  </p>
                </div>

                <div className="flex justify-between items-center p-4 bg-orange-50/50 rounded-xl border border-orange-100">
                  <span className="text-slate-600 font-bold">Deposit Required for Booking</span>
                  <span className="text-2xl font-black text-orange-600">
                    Rs. {pricing.depositAmount.toLocaleString()}
                  </span>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center">
                  <p className="text-sm text-slate-600 font-medium">
                    <span className="font-bold text-slate-800">Note:</span> You can track your courses,
                    certificate and booking status on <span className="font-bold">My Courses</span>.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 pt-2">
                  <button
                    onClick={handleProceedToPayment}
                    className="flex-1 flex items-center justify-center gap-2 bg-slate-900 text-white font-bold py-4 rounded-xl hover:bg-black shadow-lg shadow-slate-900/20"
                  >
                    <CreditCard className="w-5 h-5" /> Pay Deposit Now
                  </button>
                  <button
                    onClick={() => router.push('/dashboard')}
                    className="flex-1 flex items-center justify-center gap-2 bg-slate-100 text-slate-700 font-bold py-4 rounded-xl hover:bg-slate-200 transition-colors"
                  >
                    <Clock className="w-5 h-5" /> Pay Later
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <nav className="w-full h-16 sm:h-20 bg-white border-b flex items-center px-4 lg:px-12 justify-between shrink-0 sticky top-0 z-40 shadow-sm">
        <Link
          href={`/onlinecourse/${encodeURIComponent(decodedCourseName)}`}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold text-xs sm:text-sm transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Back to Course</span>
          <span className="sm:hidden">Back</span>
        </Link>
        <div className="flex items-center">
          <h1 className="font-black text-slate-900 text-sm sm:text-lg lg:text-xl tracking-tight">
            GyanHub <span className="text-orange-600 ml-1">Online Course Booking</span>
          </h1>
        </div>
      </nav>

      <div className="flex-1 flex flex-col lg:flex-row w-full max-w-[1600px] mx-auto relative">
        <div className="w-full lg:w-[55%] p-6 sm:p-10 lg:p-16 bg-white flex flex-col">
          <div className="max-w-xl w-full mx-auto lg:mx-0">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] sm:text-[11px] font-black uppercase mb-4 border border-emerald-100 shadow-sm">
              <ShieldCheck className="w-3.5 h-3.5" /> Secure Booking
            </span>

            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-2">
              Complete your registration for
            </h2>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-[1.1] mb-4">
              {course?.title || 'Loading Course...'}
            </h1>
            <p className="text-slate-600 font-medium text-sm sm:text-base leading-relaxed mb-8 border-l-2 border-orange-500 pl-4">
              Strengthen your professional journey with industry-level training. Secure your spot before the batch fills up.
            </p>

            <div className="flex flex-wrap gap-3 mb-10 pb-8 border-b border-slate-100">
              <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200 text-xs font-bold text-slate-700">
                <Users className="w-4 h-4 text-orange-500" /> 1500+ Enrolled
              </div>
              <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200 text-xs font-bold text-slate-700">
                <Award className="w-4 h-4 text-orange-500" /> Certified Course
              </div>
              <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200 text-xs font-bold text-slate-700">
                <Shield className="w-4 h-4 text-orange-500" /> Industry Ready
              </div>
            </div>

            <div className="space-y-2 mb-10 bg-slate-50 p-6 rounded-2xl border border-slate-100">
              <h3 className="text-xs font-black uppercase text-slate-400 mb-3 tracking-widest">
                Course Schedule
              </h3>
              <div className="flex items-center gap-3 text-slate-800 font-bold text-lg">
                <Calendar className="w-5 h-5 text-orange-600" />
                <span>
                  {course?.start_datetime ? format(new Date(course.start_datetime), 'MMMM do, yyyy') : 'TBD'}
                </span>
              </div>
              <div className="pl-8 text-slate-500 font-semibold">{getNepaliDateLine(course?.start_datetime)}</div>
              <div className="pl-8 text-slate-500 font-semibold flex items-center gap-2 mt-1">
                <Clock className="w-4 h-4 text-slate-400" /> {course?.timing || 'To be announced'}
              </div>
              <div className="pl-8 text-slate-500 font-semibold flex items-center gap-2 mt-1">
                <Calendar className="w-4 h-4 text-slate-400" /> {course?.duration || 'Duration to be announced'}
              </div>
            </div>

            <div className="space-y-6">
              <motion.div animate={{ scale: focusedField === 'name' ? 1.02 : 1 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }}>
                <label className="text-sm font-bold text-slate-900 mb-2 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <User className="w-4 h-4 text-orange-600" /> Full Name
                  </span>
                  {form.full_name.trim() && !errors.full_name && <Check className="w-4 h-4 text-emerald-500" />}
                </label>
                <input
                  type="text"
                  value={form.full_name}
                  onChange={(e) => {
                    setForm((prev) => ({ ...prev, full_name: e.target.value }));
                    if (errors.full_name) setErrors((prev) => ({ ...prev, full_name: '' }));
                  }}
                  onFocus={() => setFocusedField('name')}
                  onBlur={() => setFocusedField(null)}
                  disabled={isSignedIn}
                  placeholder="John Doe"
                  className={`w-full h-14 rounded-2xl px-4 font-bold border-2 outline-none transition-all ${
                    isSignedIn
                      ? 'bg-slate-50 border-slate-100 text-slate-500 cursor-not-allowed'
                      : errors.full_name
                      ? 'bg-red-50 border-red-300 focus:border-red-500 text-red-900'
                      : form.full_name.trim()
                      ? 'bg-emerald-50/30 border-emerald-200 focus:border-emerald-500 text-slate-900'
                      : 'bg-white border-slate-200 focus:border-orange-500 text-slate-900'
                  }`}
                />
              </motion.div>

              <motion.div animate={{ scale: focusedField === 'email' ? 1.02 : 1 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }}>
                <label className="text-sm font-bold text-slate-900 mb-2 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-orange-600" /> Email Address
                  </span>
                  {form.email.trim() && !errors.email && /^\S+@\S+\.\S+$/.test(form.email) && (
                    <Check className="w-4 h-4 text-emerald-500" />
                  )}
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => {
                    setForm((prev) => ({ ...prev, email: e.target.value }));
                    if (errors.email) setErrors((prev) => ({ ...prev, email: '' }));
                  }}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  disabled={isSignedIn}
                  placeholder="example@gmail.com"
                  className={`w-full h-14 rounded-2xl px-4 font-bold border-2 outline-none transition-all ${
                    isSignedIn
                      ? 'bg-slate-50 border-slate-100 text-slate-500 cursor-not-allowed'
                      : errors.email
                      ? 'bg-red-50 border-red-300 focus:border-red-500 text-red-900'
                      : form.email.trim() && !errors.email
                      ? 'bg-emerald-50/30 border-emerald-200 focus:border-emerald-500 text-slate-900'
                      : 'bg-white border-slate-200 focus:border-orange-500 text-slate-900'
                  }`}
                />
              </motion.div>

              <motion.div animate={{ scale: focusedField === 'whatsapp' ? 1.01 : 1 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }}>
                <label className="text-sm font-bold text-slate-900 mb-2 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-emerald-500" /> WhatsApp Number <span className="text-red-500">*</span>
                  </span>
                  {form.whatsapp.replace(/\D/g, '').length === 10 && !errors.whatsapp && (
                    <Check className="w-4 h-4 text-emerald-500" />
                  )}
                </label>
                <div className={`relative flex items-center h-14 rounded-2xl border-2 transition-all bg-white overflow-hidden ${
                  errors.whatsapp
                    ? 'border-red-300 focus-within:border-red-500 bg-red-50'
                    : form.whatsapp.replace(/\D/g, '').length === 10
                    ? 'border-emerald-200 focus-within:border-emerald-500 bg-emerald-50/30'
                    : 'border-slate-200 focus-within:border-orange-500'
                }`}>
                  <div className="h-full px-4 flex items-center justify-center bg-slate-50 border-r border-inherit gap-2 text-slate-600 font-black">
                    <WhatsAppIcon />
                    <span>+977</span>
                  </div>
                  <input
                    type="tel"
                    placeholder="98XX XXX XXX"
                    value={form.whatsapp}
                    onChange={handleWhatsappChange}
                    onFocus={() => setFocusedField('whatsapp')}
                    onBlur={() => setFocusedField(null)}
                    className="flex-1 h-full px-4 font-bold text-slate-900 text-lg outline-none bg-transparent"
                  />
                </div>
              </motion.div>

              <motion.div animate={{ scale: focusedField === 'remarks' ? 1.01 : 1 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }}>
                <label className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
                  <AlignLeft className="w-4 h-4 text-orange-600" /> Remarks (Optional)
                </label>
                <textarea
                  value={form.remarks}
                  onChange={(e) => setForm((prev) => ({ ...prev, remarks: e.target.value }))}
                  onFocus={() => setFocusedField('remarks')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="Any specific expectations from this course?"
                  className="w-full h-28 p-4 rounded-2xl border-2 border-slate-200 focus:border-orange-500 outline-none resize-none font-medium bg-white transition-all"
                />
              </motion.div>

              {errors.general && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-xl bg-red-50 text-red-600 text-sm font-bold flex items-center gap-2 border border-red-100"
                >
                  <AlertCircle className="w-5 h-5 shrink-0" /> {errors.general}
                </motion.div>
              )}
            </div>
          </div>
        </div>

        <div className="w-full lg:w-[45%] bg-slate-900 text-white p-6 lg:p-16 flex flex-col relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-orange-600/10 blur-[120px] rounded-full pointer-events-none" />
          <div className="relative z-10 flex flex-col h-full max-w-md mx-auto w-full">
            <div className="flex justify-between items-center mb-8 border-b border-slate-800 pb-4">
              <h3 className="text-[11px] font-black uppercase text-slate-400 tracking-widest">
                {form.full_name.trim()
                  ? `${form.full_name.split(' ')[0]}'s Online Enrollment Summary | GyanHub`
                  : 'Your Enrollment Summary'}
              </h3>
            </div>

            <div className="mb-8 space-y-4 bg-slate-800/40 p-6 rounded-2xl border border-slate-700/50">
              <div>
                <span className="text-[10px] font-black uppercase text-orange-500 tracking-wider">
                  Online Course Name
                </span>
                <p className="text-lg font-bold text-white leading-tight mt-1">{course?.title || 'Loading...'}</p>
              </div>

              <div className="grid grid-cols-2 gap-y-4 gap-x-4 pt-2">
                <div>
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                    Starting Date
                  </span>
                  <div className="flex items-center gap-2 mt-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <p className="text-sm font-bold">
                      {course?.start_datetime ? format(new Date(course.start_datetime), 'MMM do, yyyy') : 'TBD'}
                    </p>
                  </div>
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                    Class Time
                  </span>
                  <div className="flex items-center gap-2 mt-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <p className="text-sm font-bold">{course?.timing || 'TBD'}</p>
                  </div>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                    Course Duration
                  </span>
                  <div className="flex items-center gap-2 mt-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <p className="text-sm font-bold">{course?.duration || 'TBD'}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6 mb-10">
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-medium">Standard Course Fee</span>
                <span className={`${pricing.savings > 0 ? 'text-slate-500 line-through decoration-red-500/50' : 'text-white'} font-bold`}>
                  Rs. {pricing.fullFee.toLocaleString()}
                </span>
              </div>

              {pricing.savings > 0 && (
                <div className="flex justify-between items-center bg-emerald-500/10 p-4 rounded-xl border border-emerald-500/20">
                  <span className="text-emerald-400 font-bold flex items-center gap-2 text-xs">
                    <Sparkles className="w-4 h-4" /> Limited Time Discount ({pricing.discountPercent}%)
                  </span>
                  <span className="text-emerald-400 font-black">- Rs. {pricing.savings.toLocaleString()}</span>
                </div>
              )}

              <div className="pt-6 border-t border-slate-800">
                <span className="text-slate-500 text-[11px] font-black uppercase tracking-widest block mb-2">
                  Offer Fee
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-slate-400">Rs.</span>
                  <div className="text-5xl sm:text-6xl font-black text-white tracking-tighter leading-none">
                    {pricing.lockedPrice.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-10 bg-slate-800/50 p-6 rounded-2xl border border-slate-700/50">
              <h4 className="text-xs font-black uppercase text-slate-400 mb-4 tracking-widest">Why This Course?</h4>
              <ul className="space-y-3">
                <li className="flex items-start gap-3 text-sm font-medium text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" /> Practical, hands-on industry skills
                </li>
                <li className="flex items-start gap-3 text-sm font-medium text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" /> Real-world project assignments
                </li>
                <li className="flex items-start gap-3 text-sm font-medium text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" /> Certification upon completion
                </li>
              </ul>
            </div>

            <div className="mt-auto hidden lg:block">
              <div className="flex items-center justify-center gap-2 text-slate-400 text-xs font-bold mb-4">
                <Lock className="w-3 h-3" /> Secure Enrollment Process
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleEnrollment}
                disabled={submitting || !course}
                className="w-full bg-orange-600 text-white font-black py-6 rounded-2xl hover:bg-orange-500 transition-all shadow-2xl shadow-orange-600/20 disabled:opacity-50 text-lg"
              >
                {submitting ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : 'Reserve My Seat'}
              </motion.button>
            </div>
          </div>
        </div>
      </div>

      <div className="lg:hidden fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-200 shadow-[0_-10px_40px_rgba(0,0,0,0.08)] z-50">
        <div className="flex items-center justify-between mb-3 px-2">
          <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Offer Fee</span>
          <span className="text-lg font-black text-slate-900">Rs. {pricing.lockedPrice.toLocaleString()}</span>
        </div>
        <button
          onClick={handleEnrollment}
          disabled={submitting || !course}
          className="w-full bg-orange-600 text-white font-black py-4 rounded-xl hover:bg-orange-700 transition-all shadow-lg shadow-orange-600/20 disabled:opacity-50 flex justify-center items-center gap-2"
        >
          {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Reserve My Seat'}
        </button>
        <div className="flex items-center justify-center gap-1.5 text-slate-400 text-[10px] font-bold mt-3 uppercase tracking-wider">
          <Lock className="w-3 h-3" /> 100% Secure Processing
        </div>
      </div>
    </div>
  );
}