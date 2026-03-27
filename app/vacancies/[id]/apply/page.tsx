'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
// FIX: Use the secure SSR-compatible client
import { createClient } from "@/lib/supabase/client";
import {
  ArrowLeft,
  CheckCircle2,
  MapPin,
  Clock,
  MessageSquare,
  Phone,
  UserCircle2,
  Sparkles,
  Send,
  Loader2,
  MessageCircle,
  Mail,
  Briefcase,
  UserPlus
} from 'lucide-react';

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

export default function ApplyVacancyPage() {
  const params = useParams();
  const rawId = params?.id;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;
  const router = useRouter();

  // FIX: Initialize the secure client inside the component
  const supabase = createClient();

  // States
  const [vacancy, setVacancy] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [tutorId, setTutorId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    applicant_name: '',
    applicant_phone: '',
    applicant_email: '',
    cover_message: ''
  });

  // Fetch Vacancy Summary & Check Auth & Check Tutor Profile
  useEffect(() => {
    const initPage = async () => {
      if (!id) return;
      setLoading(true);

      // 1. Get current logged-in user using the secure getUser()
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        // If they are not logged in, redirect them to the login page
        router.push(`/login?redirect=/vacancies/${id}/apply`);
        return;
      }
      
      setUser(user);

      // 2. Check if the user has a tutor profile
      // FIX: Changed from 'phone, email' to 'contact_num' to match the actual DB schema
      const { data: tutorData, error: tutorError } = await supabase
        .from('tutors')
        .select('id, name, contact_num') 
        .eq('user_id', user.id)
        .maybeSingle(); // FIX: maybeSingle() prevents crashes if rows don't exist

      if (tutorError) {
        console.error("Error fetching tutor profile:", tutorError);
      }

      if (tutorData) {
        setTutorId(tutorData.id);
        // Pre-fill form with tutor data using the correct column name
        setFormData(prev => ({
          ...prev,
          applicant_name: tutorData.name || '',
          applicant_phone: tutorData.contact_num || '', // Mapped to contact_num
          applicant_email: user.email || '' // Email comes straight from Auth session
        }));
      } else {
        // Pre-fill email if available from their account (even if no tutor profile yet)
        setFormData(prev => ({ ...prev, applicant_email: user.email || '' }));
      }

      // 3. Fetch Vacancy details for the summary card
      const { data, error } = await supabase
        .from('vacancies')
        .select('id, subject, location, salary_range, class_level')
        .eq('id', Number(id))
        .single();

      if (!error) setVacancy(data);
      setLoading(false);
    };

    initPage();
  }, [id, router, supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    
    if (!tutorId) {
      alert("You must create a tutor profile before applying.");
      return;
    }

    setIsSubmitting(true);

    // Fetch the absolute latest session right before submitting to be safe
    const { data: { user } } = await supabase.auth.getUser();
    const currentUserId = user?.id;

    if (!currentUserId) {
      alert("You must be logged in to submit an application.");
      setIsSubmitting(false);
      return;
    }

    // Insert into the vacancy_applications table WITH the user_id AND tutor_id
    const { error } = await supabase
      .from('vacancy_applications')
      .insert([
        {
          vacancy_id: Number(id),
          user_id: currentUserId, 
          tutor_id: tutorId, 
          applicant_name: formData.applicant_name,
          applicant_phone: formData.applicant_phone,
          applicant_email: formData.applicant_email,
          cover_message: formData.cover_message,
          status: 'pending'
        }
      ]);

    setIsSubmitting(false);

    if (!error) {
      setIsSuccess(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      console.error("Application Error:", error);
      alert('Something went wrong submitting your application. Please ensure you are logged in and try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <Loader2 className="h-10 w-10 animate-spin text-orange-500" />
      </div>
    );
  }

  if (!vacancy) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC]">
        <h1 className="text-2xl font-black text-slate-900">Vacancy Not Found</h1>
        <button onClick={() => router.back()} className="mt-4 text-orange-600 font-bold hover:underline">Go Back</button>
      </div>
    );
  }

  // --- TUTOR PROFILE REQUIRED UI ---
  if (user && !tutorId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-4">
        <div className="max-w-md w-full bg-white rounded-[40px] p-10 shadow-xl border border-slate-100 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-orange-400 to-red-500"></div>
          <div className="mx-auto w-16 h-16 bg-orange-50 text-orange-500 rounded-2xl flex items-center justify-center mb-6">
            <UserPlus className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-2">Tutor Profile Required</h2>
          <p className="text-slate-500 mb-8 font-medium">To maintain quality and trust, you must have an active tutor profile to apply for jobs.</p>
          <div className="space-y-4">
            <Link href="/become-tutor" className="block w-full bg-orange-500 text-white font-bold py-4 rounded-2xl hover:bg-orange-600 transition shadow-[0_10px_20px_rgba(249,115,22,0.2)] hover:-translate-y-1">
              Create Tutor Profile
            </Link>
            <button onClick={() => router.back()} className="block w-full text-slate-500 font-bold py-2 hover:text-slate-900 transition">
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- SUCCESS STATE UI ---
  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-4">
        <div className="max-w-md w-full rounded-[40px] bg-white p-8 sm:p-10 text-center shadow-2xl shadow-orange-900/5 animate-in zoom-in duration-500">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-50 text-emerald-500 mb-6 shadow-inner">
            <CheckCircle2 className="h-10 w-10" />
          </div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Application Sent!</h2>
          <p className="mt-4 text-slate-500 font-medium leading-relaxed">
            Your application for <strong className="text-slate-900">{vacancy.subject}</strong> has been successfully submitted to GyanHub.
          </p>

          <div className="mt-8 rounded-2xl bg-emerald-50/80 border border-emerald-100 p-5 flex items-start gap-4 text-left">
             <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <MessageCircle className="h-5 w-5" fill="currentColor" fillOpacity={0.2} />
             </div>
             <div>
                <p className="text-sm font-black text-emerald-900 tracking-wide">WhatsApp Update</p>
                <p className="text-xs font-bold text-emerald-700 mt-1.5 leading-relaxed">
                  We will review your profile and update you on WhatsApp regarding the next steps within <span className="text-emerald-900 font-black">24-36 hours</span>.
                </p>
             </div>
          </div>

          <div className="mt-10">
            <Link 
              href={`/vacancies/${id}`}
              className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-orange-500 py-4 text-sm font-black text-white shadow-lg shadow-orange-200 transition-all duration-300 hover:-translate-y-1 hover:bg-orange-600 active:scale-95"
            >
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" /> 
              Back to Vacancy
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // --- MAIN APPLICATION UI ---
  return (
    <div className="min-h-screen bg-[#F8FAFC] py-8 sm:py-12 lg:py-20 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        
        <button onClick={() => router.back()} className="group mb-8 flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-orange-600 transition-colors uppercase tracking-widest">
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" /> Back to details
        </button>

        <div className="grid gap-8 lg:grid-cols-[380px_1fr] items-start">
          
          {/* LEFT: Clean Vacancy Summary */}
          <aside className="space-y-6">
            <div className="rounded-[40px] border border-orange-100 bg-white p-8 shadow-xl shadow-orange-900/5">
              
              <div className="flex items-center gap-2 mb-8">
                <div className="h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-600">Application Summary</p>
              </div>
              
              <div className="flex flex-col items-center text-center mb-8">
                <div className="flex h-20 w-20 items-center justify-center rounded-[24px] border-4 border-slate-50 bg-orange-50 text-orange-600 shadow-sm overflow-hidden mb-4">
                  <Briefcase className="h-8 w-8" />
                </div>
                <h2 className="text-2xl font-black text-slate-900">{vacancy.subject}</h2>
                <p className="mt-1 text-sm font-bold text-slate-500">{vacancy.class_level}</p>
              </div>

              {/* Attractive Details */}
              <div className="rounded-3xl bg-slate-50 border border-slate-100 p-5 mb-8 space-y-4">
                 <div className="flex items-center justify-between border-b border-slate-200/60 pb-4">
                    <span className="text-xs font-bold text-slate-500 flex items-center gap-2"><MapPin className="h-4 w-4" /> Location</span>
                    <span className="text-sm font-black text-slate-900 truncate max-w-[150px]">{vacancy.location}</span>
                 </div>
                 <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 flex items-center gap-2"><Clock className="h-4 w-4" /> Est. Salary</span>
                    <span className="text-sm font-black text-orange-600">{vacancy.salary_range ? `Rs. ${vacancy.salary_range}` : 'Negotiable'}</span>
                 </div>
              </div>

              <div className="rounded-2xl bg-orange-50/50 p-4 border border-orange-100/50">
                 <p className="text-[11px] font-bold text-orange-800 leading-relaxed text-center">
                   Submit your details to express interest. GyanHub will review and connect you with the client.
                 </p>
              </div>
            </div>
          </aside>

          {/* RIGHT: The Application Form */}
          <main className="rounded-[40px] border border-slate-200 bg-white p-6 sm:p-10 shadow-sm">
            <div className="mb-8 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-orange-600">
                <Sparkles className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">Tutor Application</h1>
                <p className="text-sm font-medium text-slate-500">Provide your contact info to apply for this tuition.</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              
              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-400">Full Name</label>
                  <div className="relative group">
                    <UserCircle2 className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-orange-500" />
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. Khusbu Kharel"
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 pl-12 text-sm font-medium outline-none transition-all focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-500/10 disabled:opacity-70 disabled:cursor-not-allowed"
                      value={formData.applicant_name}
                      onChange={(e) => setFormData({...formData, applicant_name: e.target.value})}
                      disabled // Disabled because it's pulled from their tutor profile
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-400">WhatsApp / Phone Number</label>
                  <div className="relative group">
                    <Phone className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-orange-500" />
                    <input 
                      type="tel" 
                      required
                      placeholder="e.g. 9800000000"
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 pl-12 text-sm font-medium outline-none transition-all focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-500/10"
                      value={formData.applicant_phone}
                      onChange={(e) => setFormData({...formData, applicant_phone: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-400">Email Address</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-orange-500" />
                  <input 
                    type="email" 
                    required
                    placeholder="e.g. tutor@example.com"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 pl-12 text-sm font-medium outline-none transition-all focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-500/10"
                    value={formData.applicant_email}
                    onChange={(e) => setFormData({...formData, applicant_email: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-400">Why are you a good fit? (Optional)</label>
                <div className="relative group">
                  <MessageSquare className="absolute left-4 top-4 h-5 w-5 text-slate-400 transition-colors group-focus-within:text-orange-500" />
                  <textarea 
                    rows={4}
                    placeholder="Briefly mention your experience or availability..."
                    className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 p-4 pl-12 text-sm font-medium outline-none transition-all focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-500/10"
                    value={formData.cover_message}
                    onChange={(e) => setFormData({...formData, cover_message: e.target.value})}
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 to-orange-600 py-4 text-base font-black text-white shadow-lg shadow-orange-500/25 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-orange-500/30 active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      <Send className="h-5 w-5 transition-transform duration-300 group-hover:-translate-y-1 group-hover:translate-x-1" />
                      Submit Application
                    </>
                  )}
                </button>
                <p className="mt-4 text-center text-xs font-bold text-slate-400">
                  By applying, you agree to GyanHub's platform guidelines.
                </p>
              </div>

            </form>
          </main>

        </div>
      </div>
    </div>
  );
}