'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import NepaliDate from 'nepali-date-converter'; // <-- Added Import
import { createClient } from "@/lib/supabase/client";
import { 
  CheckCircle2, ChevronLeft, ShieldCheck, 
  Calendar, AlertCircle, Loader2, AlignLeft, Mail, User, CreditCard, Clock
} from 'lucide-react';

const WhatsAppIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-emerald-500">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.414 0 .004 5.412 0 12.048c0 2.12.554 4.189 1.605 6.006L0 24l6.117-1.605a11.803 11.803 0 005.925 1.586h.005c6.637 0 12.048-5.414 12.052-12.051a11.83 11.83 0 00-3.528-8.521z"/>
  </svg>
);

export default function CourseEnrollmentPage() {
  const params = useParams();
  const rawId = params?.id;
  const course_id = Array.isArray(rawId) ? rawId[0] : rawId; 
  const router = useRouter();
  const supabase = createClient();

  const [isSignedIn, setIsSignedIn] = useState(false);
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  
  const [form, setForm] = useState({ 
    full_name: '', 
    email: '', 
    whatsapp: '', 
    remarks: '' 
  });
  const [errorMsg, setErrorMsg] = useState('');

  // <-- FIX: Added 'np' parameter to force Nepali script
  const getNepaliDateLine = (dateString?: string) => {
    if (!dateString) return "मिति तय हुन बाँकी";
    try {
      const adDate = new Date(dateString);
      const bsDate = new NepaliDate(adDate);
      const nepaliDays = ['आइतबार', 'सोमबार', 'मंगलबार', 'बुधबार', 'बिहीबार', 'शुक्रबार', 'शनिबार'];
      const dayName = nepaliDays[adDate.getDay()];
      
      // The 'np' argument converts it strictly to Nepali script
      const bsFormatted = bsDate.format('MMMM D, YYYY', 'np'); 
      return `${bsFormatted} (${dayName})`;
    } catch (e) {
      return "मिति तय हुन बाँकी";
    }
  };

  useEffect(() => {
    const initData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        setIsSignedIn(true);
        setUserId(user.id);
        setForm(prev => ({
          ...prev,
          full_name: user.user_metadata?.full_name || '',
          email: user.email || ''
        }));
      }

      if (course_id) {
        try {
          const { data, error } = await supabase
            .from('online-courses')
            .select('*')
            .eq('id', course_id)
            .single();

          if (error) throw error;
          setCourse(data);
        } catch (err) {
          setErrorMsg("Could not load course details.");
        }
      }
      setLoading(false);
    };
    
    initData();
  }, [course_id, supabase]);

  const pricing = useMemo(() => {
    if (!course) return { fullFee: 0, lockedPrice: 0, savings: 0, discountPercent: 0 };
    const fullFee = Math.round(Number(course.fee) || 0);
    const discountPercent = Number(course.discount) || 0;
    const lockedPrice = Math.round(fullFee - (fullFee * (discountPercent / 100)));
    const savings = fullFee - lockedPrice;
    
    // 10% of locked price required for deposit
    const depositAmount = Math.round(lockedPrice * 0.10);
    
    return { fullFee, lockedPrice, savings, discountPercent, depositAmount };
  }, [course]);

  const handleWhatsappChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.replace(/\D/g, '').substring(0, 10);
    let formatted = raw;
    if (raw.length > 4) formatted = `${raw.substring(0, 4)} ${raw.substring(4, 7)} ${raw.substring(7, 10)}`.trim();
    setForm({ ...form, whatsapp: formatted });
  };

  const handleEnrollment = async () => {
    if (!form.full_name || !form.email) return setErrorMsg("Please provide your name and email.");
    if (form.whatsapp.replace(/\D/g, '').length !== 10) return setErrorMsg("Enter a valid 10-digit number.");

    setSubmitting(true);
    setErrorMsg('');
    
    // Check for existing registration
    const formattedWhatsapp = `+977${form.whatsapp.replace(/\D/g, '')}`;
    
    try {
      let query = supabase.from('enrollments').select('id').eq('course_id', course?.id);
      
      if (userId) {
        // If logged in, check by user ID or email
        query = query.or(`user_id.eq.${userId},email.eq.${form.email}`);
      } else {
        // If guest, check by email or whatsapp
        query = query.or(`email.eq.${form.email},whatsapp_number.eq.${formattedWhatsapp}`);
      }
      
      const { data: existingRecords } = await query;
      
      if (existingRecords && existingRecords.length > 0) {
        setErrorMsg("You have already registered for this course. Please check your WhatsApp/Email.");
        setSubmitting(false);
        return;
      }

      // Proceed with insert
      const { error } = await supabase.from('enrollments').insert([{
        user_id: userId,
        course_id: course?.id,
        full_name: form.full_name,
        email: form.email,
        whatsapp_number: formattedWhatsapp,
        course_name: course?.title,
        locked_price: pricing.lockedPrice,
        starting_date: course?.start_datetime,
        remarks: form.remarks,
        status: 'pending'
      }]);

      if (error) throw error;
      
      setShowSuccessModal(true);
    } catch (err) {
      setErrorMsg("Failed to enroll. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleProceedToPayment = () => {
    // Redirect to the dynamic order page matching the params logic requested
    const params = new URLSearchParams({
      name: form.full_name,
      email: form.email,
      phone: form.whatsapp.replace(/\D/g, ''),
      order_type: "course enrollment",
      request_type: "course",
      tutor_name: "GyanHub Courses",
      course_name: course?.title,
      // Pass the deposit amount logic so the order page knows what to charge
      price: (pricing?.depositAmount ?? 0).toString()
    });
    
    router.push(`/order?${params.toString()}`);
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <Loader2 className="w-10 h-10 text-orange-600 animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <AnimatePresence>
        {showSuccessModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-[32px] shadow-2xl max-w-2xl w-full overflow-hidden">
              <div className="bg-emerald-600 p-8 text-white text-center">
                <CheckCircle2 className="w-12 h-12 text-white mx-auto mb-4" />
                <h2 className="text-2xl font-black leading-tight">Interest Registered!</h2>
              </div>
              <div className="p-8 space-y-6">
                <p className="text-slate-700 text-center leading-relaxed font-medium">
                  Your interest for the course is registered and you will receive the orientation link via WhatsApp and Email.
                </p>
                
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-amber-900 text-sm leading-relaxed">
                  <strong>However, your discount is not locked yet.</strong> To lock your discount, please proceed to pay a deposit of <strong>Rs. {(pricing?.depositAmount ?? 0).toLocaleString()}</strong> (10% of the total fee) out of <strong>Rs. {pricing.lockedPrice.toLocaleString()}</strong> to confirm your enrollment.
                </div>

                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <button 
                    onClick={() => router.push('/my-courses')} 
                    className="flex-1 flex items-center justify-center gap-2 bg-slate-100 text-slate-700 font-bold py-4 rounded-xl hover:bg-slate-200 transition-colors"
                  >
                    <Clock className="w-5 h-5" /> I will pay later
                  </button>
                  <button 
                    onClick={handleProceedToPayment} 
                    className="flex-1 flex items-center justify-center gap-2 bg-slate-900 text-white font-bold py-4 rounded-xl hover:bg-black shadow-lg hover:shadow-xl transition-all"
                  >
                    <CreditCard className="w-5 h-5" /> Proceed to Payment
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <nav className="w-full h-20 bg-white border-b flex items-center px-6 lg:px-12 justify-between shrink-0">
        <Link href={`/online-courses/${course_id}`} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold text-sm transition-colors">
          <ChevronLeft className="w-4 h-4" /> Back to Course
        </Link>
        
        <div className="flex items-center gap-4">
          {/* FIX: Removed broken image logo and border */}
          <div className="flex flex-col">
            <h2 className="font-black text-slate-900 text-sm lg:text-xl tracking-tighter uppercase leading-none">GyanHub</h2>
            <span className="text-[9px] lg:text-[11px] font-bold text-orange-600 uppercase tracking-widest leading-tight">Registration Form</span>
          </div>
        </div>
      </nav>

      <div className="flex-1 flex flex-col lg:flex-row w-full max-w-[1600px] mx-auto relative">
        <div className="w-full lg:w-[60%] p-6 sm:p-10 lg:p-16 bg-white flex flex-col">
          <div className="max-w-xl w-full mx-auto lg:mx-0">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 text-orange-700 text-[10px] font-black uppercase mb-4 border border-orange-100">
              <ShieldCheck className="w-3 h-3" /> Secure Registration
            </span>
            <h1 className="text-3xl lg:text-5xl font-black text-slate-900 tracking-tight leading-[1.1] mb-6">
              Registration for <br/>
              <span className="text-orange-600">{course?.title || 'Loading...'}</span>
            </h1>
            
            <div className="space-y-2 mb-10">
              <div className="flex items-center gap-2 text-slate-800 font-bold">
                <Calendar className="w-4 h-4 text-orange-500" />
                <span>{course?.start_datetime ? format(new Date(course.start_datetime), 'PPP') : 'TBD'}</span>
              </div>
              
              <div className="pl-6 text-slate-500 font-semibold tracking-tight">{getNepaliDateLine(course?.start_datetime)}</div>
              <div className="pl-6 text-slate-500 font-semibold">Timing: {course?.timing || 'To be announced'}</div>
            </div>

            <div className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2"><User className="w-4 h-4 text-orange-600" /> Full Name</label>
                  <input type="text" value={form.full_name} onChange={(e) => setForm({...form, full_name: e.target.value})} disabled={isSignedIn} placeholder="Full Name" className={`w-full h-14 rounded-2xl px-4 font-bold border-2 outline-none transition-all ${isSignedIn ? 'bg-slate-50 border-slate-100 text-slate-400 cursor-not-allowed' : 'bg-white border-slate-200 focus:border-orange-500 text-slate-900'}`} />
                </div>
                <div>
                  <label className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2"><Mail className="w-4 h-4 text-orange-600" /> Email Address</label>
                  <input type="email" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} disabled={isSignedIn} placeholder="example@gmail.com" className={`w-full h-14 rounded-2xl px-4 font-bold border-2 outline-none transition-all ${isSignedIn ? 'bg-slate-50 border-slate-100 text-slate-400 cursor-not-allowed' : 'bg-white border-slate-200 focus:border-orange-500 text-slate-900'}`} />
                </div>
              </div>

              <div>
                <label className="text-sm font-bold text-slate-900 mb-2 block">Primary WhatsApp Number <span className="text-red-500">*</span></label>
                <div className="relative flex items-center h-14 rounded-2xl border-2 border-slate-200 focus-within:border-orange-500 bg-white overflow-hidden">
                    <div className="h-full px-4 flex items-center justify-center bg-slate-50 border-r gap-2 text-slate-400 font-black">
                      <WhatsAppIcon />
                      <span>+977</span>
                    </div>
                    <input type="tel" placeholder="98XX XXX XXX" value={form.whatsapp} onChange={handleWhatsappChange} className="flex-1 h-full px-4 font-bold text-slate-900 text-lg outline-none bg-transparent" />
                </div>
              </div>

              <div>
                <label className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2"><AlignLeft className="w-4 h-4 text-orange-600" /> Remarks</label>
                <textarea value={form.remarks} onChange={(e) => setForm({...form, remarks: e.target.value})} placeholder="Any specific requirements?" className="w-full h-28 p-4 rounded-2xl border-2 border-slate-200 focus:border-orange-500 outline-none resize-none font-medium bg-white" />
              </div>

              {errorMsg && <div className="p-4 rounded-xl bg-red-50 text-red-600 text-sm font-bold flex items-center gap-2"><AlertCircle className="w-5 h-5 shrink-0"/> {errorMsg}</div>}
            </div>
          </div>
        </div>

        <div className="w-full lg:w-[40%] bg-slate-900 text-white p-6 lg:p-16 flex flex-col relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-orange-600/10 blur-[100px] rounded-full"></div>
          <div className="relative z-10 flex flex-col h-full">
            <h3 className="text-[10px] font-black uppercase text-slate-500 mb-8 border-b border-slate-800 pb-4 tracking-widest">Your Enrollment Summary</h3>
            <div className="space-y-6 mb-10">
              <div className="flex justify-between items-center group">
                <span className="text-slate-400 font-medium">Standard Course Fee</span>
                <span className={`font-bold transition-all ${pricing.savings > 0 ? 'text-slate-500 line-through decoration-red-500/50' : 'text-white'}`}>Rs. {pricing.fullFee.toLocaleString()}</span>
              </div>
              {pricing.savings > 0 && (
                <div className="flex justify-between items-center bg-emerald-500/5 p-4 rounded-xl border border-emerald-500/10">
                  <span className="text-emerald-400 font-bold flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> Discount ({pricing.discountPercent}%)</span>
                  <span className="text-emerald-400 font-black">- Rs. {pricing.savings.toLocaleString()}</span>
                </div>
              )}
              <div className="pt-6 border-t border-slate-800">
                <span className="text-slate-500 text-[10px] font-black uppercase tracking-widest block mb-2">Locked Offer Price</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-slate-400">Rs.</span>
                  <div className="text-6xl font-black text-white tracking-tighter leading-none">{pricing.lockedPrice.toLocaleString()}</div>
                </div>
              </div>
            </div>
            {course?.cover_pic && (
              <div className="w-full aspect-video rounded-3xl overflow-hidden border border-slate-800 mb-10 shadow-2xl relative group">
                <img src={course.cover_pic} alt="Preview" className="w-full h-full object-cover" />
              </div>
            )}
            <div className="mt-auto">
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleEnrollment} disabled={submitting || !course} className="w-full bg-orange-600 text-white font-black py-6 rounded-2xl hover:bg-orange-500 transition-all shadow-2xl shadow-orange-600/20 disabled:opacity-50">
                {submitting ? <Loader2 className="w-6 h-6 animate-spin mx-auto"/> : 'Register My Name'}
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}