'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import {
  ArrowLeft,
  CheckCircle2,
  GraduationCap,
  Home,
  Laptop,
  MessageSquare,
  Phone,
  ShieldCheck,
  UserCircle2,
  Building2,
  Sparkles,
  Send,
  Loader2,
  ChevronRight
} from 'lucide-react';

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

export default function BookTutorPage() {
  const params = useParams();
  const id = params?.id;
  const router = useRouter();

  // States
  const [tutor, setTutor] = useState<any>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loadingTutor, setLoadingTutor] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    student_name: '',
    phone: '',
    grade: '',
    preferred_mode: 'Online',
    message: ''
  });

  // Extract the numeric ID from the slug
  const numericTutorId = id ? parseInt(String(id).split('-')[0], 10) : null;

  // Fetch Tutor Summary & Current User
  useEffect(() => {
    const fetchInitialData = async () => {
      // 1. Fetch the currently authenticated user
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      }

      // 2. Fetch the tutor details using the parsed numeric ID
      if (!numericTutorId || isNaN(numericTutorId)) {
        setLoadingTutor(false);
        return;
      }

      const { data: tutorData, error: tutorError } = await supabase
        .from('tutors')
        .select('id, name, subject, avatar_url, hour_rate, verified, mode_of_teaching')
        .eq('id', numericTutorId)
        .single();

      if (!tutorError && tutorData) {
        setTutor(tutorData);
      }
      setLoadingTutor(false);
    };

    fetchInitialData();
  }, [numericTutorId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!numericTutorId) return;

    setIsSubmitting(true);

    // Insert into student_requests table using the parsed numeric ID
    const { error } = await supabase
      .from('student_requests')
      .insert([
        {
          tutor_id: numericTutorId,
          user_id: userId,
          ...formData,
          status: 'pending'
        }
      ]);

    setIsSubmitting(false);

    if (!error) {
      setIsSuccess(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      console.error('Insert error:', error);
      alert('Something went wrong. Please try again.');
    }
  };

  if (loadingTutor) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!tutor) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC]">
        <h1 className="text-2xl font-black text-slate-900">Tutor Not Found</h1>
        <button onClick={() => router.back()} className="mt-4 text-blue-600 font-bold">Go Back</button>
      </div>
    );
  }

  const tutorHandle = tutor.name.split(' ').join('');

  // --- SUCCESS STATE UI ---
  if (isSuccess) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC] p-4 text-center">
        <nav className="mb-10 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">
           <Link href="/tutors" className="hover:text-orange-600 transition-colors">Tutors</Link>
           <ChevronRight className="h-3 w-3" />
           <span className="text-slate-900">{tutor.name}</span>
           <ChevronRight className="h-3 w-3" />
           <span className="text-blue-600">Request Confirmed</span>
        </nav>

        <div className="max-w-xl w-full rounded-[48px] border border-emerald-100 bg-white p-12 shadow-2xl shadow-emerald-900/5 animate-in zoom-in duration-500 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/50 to-white/95 pointer-events-none" />

          <div className="relative z-10 flex flex-col items-center">
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-emerald-100/70 border border-emerald-100 text-emerald-600 mb-8 shadow-inner">
              <CheckCircle2 className="h-12 w-12" />
            </div>

            <h2 className="text-4xl sm:text-5xl font-black text-emerald-900 tracking-tight mb-5">Request Confirmed!</h2>
            
            <div className="max-w-md space-y-4 text-center">
              <p className="text-lg font-medium text-slate-600 leading-relaxed">
                Thanks! We've received your request to connect with <strong className="text-slate-900">{tutor.name}</strong>.
              </p>
              
              <div className="mt-6 rounded-2xl bg-emerald-100/50 border border-emerald-100 p-5 flex items-start gap-3 text-left">
                 <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                 <div>
                    <p className="text-sm font-black text-emerald-900 tracking-wide mb-1">Look out for our message!</p>
                    <p className="text-xs font-bold text-emerald-700 leading-relaxed">
                       The GyanHub team will review your details and contact you shortly. We coordinate the first demo session and our service is <span className="text-emerald-900 font-black">100% free for students</span>.
                    </p>
                 </div>
              </div>
            </div>

            <div className="mt-12 w-full border-t border-emerald-100 pt-8 flex justify-end">
              <Link 
                href="/tutors"
                className="group inline-flex items-center gap-2 text-sm font-black text-blue-600 hover:text-blue-700 transition-colors duration-300"
              >
                Back to Tutor Directory <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1 rotate-180" /> 
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- MAIN BOOKING UI ---
  return (
    <div className="min-h-screen bg-[#F8FAFC] py-8 sm:py-12 lg:py-20 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        
        <button onClick={() => router.back()} className="group mb-6 flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors uppercase tracking-widest">
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" /> Go Back
        </button>

        {/* PAGE THEME HEADER */}
        <div className="mb-10">
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Connect with tutor <span className="text-blue-600">@{tutorHandle}</span>
          </h1>
          <p className="mt-2 text-base font-medium text-slate-500">
            Fill out the form below to request a session. We'll handle the introduction!
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[400px_1fr] items-start">
          
          {/* LEFT: Tutor Summary & Trust Signals */}
          <aside className="space-y-6">
            <div className="rounded-[40px] bg-slate-900 p-8 text-white shadow-2xl shadow-blue-900/20 relative overflow-hidden">
              <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-blue-600 blur-3xl opacity-20" />
              
              <div className="relative z-10">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400 mb-6">You are contacting</p>
                
                <div className="flex items-center gap-4 mb-6">
                  <div className="h-16 w-16 shrink-0 rounded-2xl bg-slate-800 border-2 border-slate-700 overflow-hidden">
                    {tutor.avatar_url ? (
                      <img src={tutor.avatar_url} alt={tutor.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-slate-500"><UserCircle2 size={32} /></div>
                    )}
                  </div>
                  <div className="overflow-hidden">
                    <h2 className="text-xl font-black flex items-center gap-2 truncate">
                      {tutor.name}
                      {tutor.verified && <ShieldCheck className="h-4 w-4 text-blue-400 shrink-0" />}
                    </h2>
                    <p className="text-sm text-slate-400 font-medium truncate">{Array.isArray(tutor.subject) ? tutor.subject.join(', ') : tutor.subject}</p>
                  </div>
                </div>

                <div className="rounded-2xl bg-white/5 border border-white/10 p-4 mb-8">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Estimated Hourly Rate</p>
                  <p className="text-2xl font-black text-white">Rs. {tutor.hour_rate || 'N/A'}</p>
                </div>

                <ul className="space-y-4 text-sm font-medium text-slate-300">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
                    <span>No upfront payment required.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
                    <span>GyanHub coordinates the first demo session for you.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
                    <span>100% Free Service for students.</span>
                  </li>
                </ul>
              </div>
            </div>
          </aside>

          {/* RIGHT: The Booking Form */}
          <main className="rounded-[40px] border border-slate-200 bg-white p-6 sm:p-10 shadow-sm">
            <div className="mb-8 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <Sparkles className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Student Details</h2>
                <p className="text-sm font-medium text-slate-500">Fill this out and we'll connect you right away.</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Row 1: Name & Phone */}
              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-400">Student / Parent Name</label>
                  <div className="relative group">
                    <UserCircle2 className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-blue-600" />
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. Khusbu Kharel"
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 pl-12 text-sm font-medium outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                      value={formData.student_name}
                      onChange={(e) => setFormData({...formData, student_name: e.target.value})}
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-400">Phone Number</label>
                  <div className="relative group">
                    <Phone className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-blue-600" />
                    <input 
                      type="tel" 
                      required
                      placeholder="e.g. 9800000000"
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 pl-12 text-sm font-medium outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              {/* Row 2: Grade */}
              <div>
                <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-400">Student's Current Grade / Level</label>
                <div className="relative group">
                  <GraduationCap className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-blue-600" />
                  <select 
                    required
                    className="w-full appearance-none rounded-2xl border border-slate-200 bg-slate-50 p-4 pl-12 text-sm font-medium outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                    value={formData.grade}
                    onChange={(e) => setFormData({...formData, grade: e.target.value})}
                  >
                    <option value="" disabled>Select Education Level</option>
                    <option value="School (Up to Class 10)">School (Up to Class 10)</option>
                    <option value="+2 (Science/Mgmt/Arts)">+2 Level (Science/Mgmt/Arts)</option>
                    <option value="Bachelor Degree">Bachelor Degree</option>
                    <option value="Professional Course">Professional / Software Course</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              {/* Visual Toggle for Teaching Mode */}
              <div>
                <label className="mb-3 block text-[10px] font-black uppercase tracking-widest text-slate-400">Your Preferred Mode of Learning</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'Online', icon: Laptop },
                    { id: 'Home Visit', icon: Home },
                    { id: 'Tutor Center', icon: Building2 }
                  ].map((mode) => (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => setFormData({...formData, preferred_mode: mode.id})}
                      className={cn(
                        "flex flex-col items-center justify-center gap-2 rounded-2xl border p-4 transition-all active:scale-95",
                        formData.preferred_mode === mode.id 
                          ? "border-blue-500 bg-blue-50 text-blue-700 shadow-sm" 
                          : "border-slate-200 bg-slate-50 text-slate-500 hover:border-blue-300 hover:bg-white"
                      )}
                    >
                      <mode.icon className={cn("h-6 w-6", formData.preferred_mode === mode.id ? "text-blue-600" : "text-slate-400")} />
                      <span className="text-[11px] font-bold uppercase tracking-wider text-center">{mode.id}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Message */}
              <div>
                <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-400">Specific Requirement(s) For Your Study (Optional)</label>
                <div className="relative group">
                  <MessageSquare className="absolute left-4 top-4 h-5 w-5 text-slate-400 transition-colors group-focus-within:text-blue-600" />
                  <textarea 
                    rows={4}
                    placeholder="E.g., I need help specifically with AutoCAD 3D rendering..."
                    className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 p-4 pl-12 text-sm font-medium outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                    value={formData.message}
                    onChange={(e) => setFormData({...formData, message: e.target.value})}
                  />
                </div>
              </div>

              {/* Submit Button (Soft to Solid style) */}
              <div className="pt-4 border-t border-slate-100">
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-50 py-4.5 text-base font-black text-blue-600 transition-all duration-300 hover:-translate-y-1 hover:bg-blue-600 hover:text-white hover:shadow-xl hover:shadow-blue-200 active:scale-95 ring-1 ring-inset ring-blue-100/50 hover:ring-blue-600 disabled:opacity-50 disabled:pointer-events-none"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      <Send className="h-5 w-5 transition-transform duration-300 group-hover:-translate-y-1 group-hover:translate-x-1" />
                      Submit Request
                    </>
                  )}
                </button>
                <p className="mt-4 text-center text-xs font-bold text-slate-400">
                  By submitting, you agree to GyanHub's Terms of Service.
                </p>
              </div>

            </form>
          </main>

        </div>
      </div>
    </div>
  );
}