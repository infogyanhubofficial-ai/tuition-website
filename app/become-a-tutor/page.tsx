'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen, Briefcase, CheckCircle2, ChevronLeft, ChevronRight, FileText,
  GraduationCap, Home, IdCard, Laptop, Lock, MapPin, Phone, ShieldCheck,
  User, UserCircle2, Building2, Link as LinkIcon, X, AlertCircle,
  Banknote, Loader2, Info, Sparkles
} from 'lucide-react';
// FIX: Import the new secure SSR-compatible client
import { createClient } from '@/lib/supabase/client';

// --- UTILS & CONSTANTS ---
function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

const CITIES = ['Kathmandu', 'Lalitpur', 'Bhaktapur', 'Pokhara', 'Chitwan', 'Biratnagar', 'Birgunj', 'Dharan', 'Butwal', 'Hetauda', 'Other'];
const SUBJECT_SUGGESTIONS = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'Computer Science', 'Accountancy', 'Economics', 'C Programming', 'AutoCAD', 'ETABS', 'SAFE', 'Structural Design', 'Civil Engineering', 'Revit', 'SEE Preparation', '+2 Science', 'Bachelor Level Math'];
const TEACHING_MODES = [
  { value: 'Home Visit', label: 'Home Visit', desc: 'Teach at student’s home', icon: Home },
  { value: 'Online', label: 'Online', desc: 'Teach remotely from anywhere', icon: Laptop },
  { value: "Tutor's Location", label: "Tutor's Center", desc: 'Students come to your place', icon: Building2 },
];
const BIO_PLACEHOLDERS = ["I am a passionate Civil Engineer...", "Dedicated +2 Science teacher...", "I help students master Mathematics..."];
const PRO_SUBJECTS = ['AutoCAD', 'ETABS', 'SAFE', 'Structural Design', 'Revit', 'C Programming'];

// --- COMPONENTS ---
function FloatingInput({ label, name, value, onChange, type = 'text', hasError = false, errorMessage, placeholder, icon: Icon, prefix, tooltip }: any) {
  const hasValue = String(value).length > 0;
  return (
    <div className="relative w-full group">
      {Icon && <Icon className={cn("absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 transition-colors z-10", hasValue ? "text-blue-500" : "text-slate-400")} />}
      {prefix && <span className="absolute left-11 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-700 z-10">{prefix}</span>}
      <input
        type={type} name={name} value={value} onChange={onChange} placeholder={placeholder || ' '}
        className={cn(
          'peer h-14 w-full rounded-2xl border bg-white px-4 pt-5 text-sm font-medium text-slate-900 outline-none transition-all',
          Icon ? 'pl-11' : '', prefix ? 'pl-[72px]' : '',
          hasError ? 'border-red-400 focus:shadow-[0_0_15px_rgba(248,113,113,0.3)] focus:border-red-500' :
          hasValue ? 'border-emerald-300 focus:border-blue-500 focus:shadow-[0_0_15px_rgba(59,130,246,0.3)]' :
          'border-slate-200 focus:border-blue-500 focus:shadow-[0_0_15px_rgba(59,130,246,0.3)]',
          placeholder ? 'placeholder:text-slate-400 pt-0' : ''
        )}
      />
      {!placeholder && (
        <label className={cn("pointer-events-none absolute transition-all bg-white px-1 z-10 rounded-md",
          Icon ? (hasValue ? "left-10" : "left-11") : "left-4",
          hasValue ? "top-0 -translate-y-1/2 text-[11px] font-bold text-blue-600" : "top-1/2 -translate-y-1/2 text-sm text-slate-500 font-medium",
          "peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:text-[11px] peer-focus:font-bold peer-focus:text-blue-600",
          Icon && "peer-focus:left-10"
        )}>
          {label}
        </label>
      )}
      
      {tooltip && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2 group-hover:opacity-100 opacity-0 transition-opacity z-20">
          <Info className="h-4 w-4 text-slate-400" />
          <div className="absolute bottom-full right-0 mb-2 w-48 bg-slate-800 text-white text-[10px] p-2 rounded-lg shadow-lg pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
            {tooltip}
          </div>
        </div>
      )}

      {hasValue && !hasError && !prefix && !tooltip && (
        <motion.span initial={{scale:0}} animate={{scale:1}} className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-emerald-50 p-1 text-emerald-600">
          <CheckCircle2 className="h-4 w-4" />
        </motion.span>
      )}
      {hasError && <p className="mt-1.5 text-[11px] font-bold text-red-500 flex items-center gap-1"><AlertCircle className="h-3 w-3"/> {errorMessage}</p>}
    </div>
  );
}

function DriveLinkCard({ title, subtitle, icon: Icon, value, placeholder, secure = false, onChange, hasError, errorMessage }: any) {
  const [isVerifying, setIsVerifying] = useState(false);
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    if (value && value.includes('drive.google.com')) {
      setIsVerifying(true);
      setIsValid(false);
      const timer = setTimeout(() => {
        setIsVerifying(false);
        setIsValid(true);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setIsVerifying(false);
      setIsValid(false);
    }
  }, [value]);

  return (
    <div className={cn("rounded-2xl border bg-white p-5 transition-all duration-300", 
      hasError ? "border-red-400 ring-4 ring-red-50" : 
      isValid ? "border-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.2)]" : "border-slate-200")}>
      <div className="flex items-start gap-4">
        <div className={cn("rounded-2xl p-3 transition-colors", 
          isValid ? "bg-emerald-50 text-emerald-600" : 
          secure ? "bg-blue-50 text-blue-600" : "bg-slate-100 text-slate-600")}>
          {isVerifying ? <Loader2 className="h-6 w-6 animate-spin" /> : 
           isValid ? <motion.div initial={{scale:0}} animate={{scale:1}}><CheckCircle2 className="h-6 w-6" /></motion.div> : 
           <Icon className="h-6 w-6" />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-bold text-slate-900">{title}</h4>
            {secure && <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-blue-700"><Lock className="h-3 w-3" /> Encrypted</span>}
          </div>
          <p className="mt-1 text-xs font-medium text-slate-500">{subtitle}</p>
          <div className="relative mt-4">
            <LinkIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input type="url" value={value} onChange={onChange} placeholder={placeholder} 
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm font-medium outline-none transition focus:border-blue-500 focus:bg-white focus:shadow-[0_0_15px_rgba(59,130,246,0.3)]" />
          </div>
          {hasError && <p className="mt-2 text-[11px] font-bold text-red-500 flex items-center gap-1"><AlertCircle className="h-3 w-3"/> {errorMessage}</p>}
        </div>
      </div>
    </div>
  );
}

export default function PostTutorPage() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [loading, setLoading] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [subjectInput, setSubjectInput] = useState('');
  const [showErrors, setShowErrors] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [hintIndex, setHintIndex] = useState(0);

  // FIX: Initialize the secure SSR client
  const supabase = createClient();

  const [form, setForm] = useState({
    name: '', subject: [] as string[], location: '', chowk: '', experience: '', 
    education: '', bio: '', avatar_url: '', contact_num: '', cv_url: '', 
    mode_of_teaching: '', hour_rate: '', id_url: '',
    verified: false,
    availability: false
  });

  useEffect(() => {
    setIsMounted(true);
    const checkUser = async () => {
      // FIX: Use getUser() for strict server cookie validation
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user ?? null);
      
      if (user) {
        // --- Check for existing profile to allow editing/upserting safely ---
        const { data: existingProfile } = await supabase
          .from('tutors')
          .select('*')
          .eq('user_id', user.id) // FIX: Use user.id securely
          .single();

        if (existingProfile) {
          // Parse location and chowk if they were combined
          const locParts = (existingProfile.location || '').split(', ');
          setForm({
            name: existingProfile.name || '',
            subject: existingProfile.subject || [],
            location: locParts[0] || '',
            chowk: locParts[1] || '',
            experience: existingProfile.experience?.toString() || '',
            education: existingProfile.education || '',
            bio: existingProfile.bio || '',
            avatar_url: existingProfile.avatar_url || '',
            contact_num: existingProfile.contact_num || '',
            cv_url: existingProfile.cv_url || '',
            mode_of_teaching: existingProfile.mode_of_teaching || '',
            hour_rate: existingProfile.hour_rate?.toString() || '',
            id_url: existingProfile.id_url || '',
            verified: existingProfile.verified || false,
            availability: existingProfile.availability || false
          });
        } else {
          // If no existing profile, check local draft or use session data
          const draft = localStorage.getItem('tutor_profile_draft');
          if (draft) { 
            try { setForm(prev => ({ ...prev, ...JSON.parse(draft) })); } catch (e) {} 
          } else if (user.user_metadata) { // FIX: Use user.user_metadata
            setForm(prev => ({
              ...prev,
              name: prev.name || user.user_metadata.full_name || '',
              avatar_url: prev.avatar_url || user.user_metadata.avatar_url || '',
            }));
          }
        }
      }
      setAuthLoading(false);
    };
    checkUser();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    const timer = setInterval(() => setHintIndex((p) => (p + 1) % BIO_PLACEHOLDERS.length), 4000);
    return () => {
      clearInterval(timer);
      authListener.subscription.unsubscribe();
    };
  }, [supabase]); // Added supabase to dependencies

  useEffect(() => {
    if (isMounted && !submitted) localStorage.setItem('tutor_profile_draft', JSON.stringify(form));
  }, [form, isMounted, submitted]);

  // Validations
  const isValidPhone = /^(98|97)\d{8}$/.test(form.contact_num);
  const isBioValid = form.bio.trim().length >= 50;
  const isDriveLink = (url: string) => !url || url.includes('drive.google.com');

  const errors = {
    name: !form.name.trim() ? 'Name is required' : '',
    contact: !isValidPhone ? 'Valid 10-digit Nepali number required' : '',
    subject: form.subject.length === 0 ? 'Add at least one subject' : '',
    location: !form.location ? 'Select your city' : '',
    education: !form.education.trim() ? 'Highest qualification is required' : '',
    experience: !form.experience ? 'Experience is required' : '',
    bio: !isBioValid ? 'Bio must be at least 50 characters' : '',
    cv_url: form.cv_url && !isDriveLink(form.cv_url) ? 'Please provide a Google Drive link' : (!form.cv_url ? 'CV is required' : ''),
    mode_of_teaching: !form.mode_of_teaching ? 'Select a teaching mode' : '',
    hour_rate: !form.hour_rate || Number(form.hour_rate) < 200 ? 'Minimum rate is Rs. 200/hr' : '',
    id_url: !form.id_url || !isDriveLink(form.id_url) ? 'Valid Google Drive link to ID required' : ''
  };

  const step1Valid = !errors.name && !errors.contact && !errors.subject && !errors.location && !errors.education;
  const step2Valid = !errors.experience && !errors.bio && !errors.cv_url;
  const step3Valid = !errors.mode_of_teaching && !errors.hour_rate;
  const step4Valid = !errors.id_url;

  const strength = useMemo(() => {
    const checks = [form.name, form.subject.length > 0, form.location, form.contact_num, form.experience, form.education, isBioValid, form.cv_url, form.mode_of_teaching, form.hour_rate, form.id_url];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  }, [form, isBioValid]);

  const hasProSubject = useMemo(() => form.subject.some(s => PRO_SUBJECTS.includes(s)), [form.subject]);

  const bioProgress = Math.min((form.bio.length / 50) * 100, 100);

  const filteredSubjects = useMemo(() => {
    if (!subjectInput.trim()) return SUBJECT_SUGGESTIONS.slice(0, 8);
    return SUBJECT_SUGGESTIONS.filter(item => item.toLowerCase().includes(subjectInput.toLowerCase())).slice(0, 8);
  }, [subjectInput]);

  function updateField(key: string, value: any) { setForm(p => ({ ...p, [key]: value })); setShowErrors(false); }

  function toggleSubject(subject: string) {
    const trimmed = subject.trim();
    if (!trimmed) return;
    setForm((prev) => ({
      ...prev,
      subject: prev.subject.includes(trimmed) ? prev.subject.filter((s) => s !== trimmed) : [...prev.subject, trimmed]
    }));
    setSubjectInput('');
  }

  const navigateStep = (newStep: number) => {
    setDirection(newStep > step ? 1 : -1);
    setStep(newStep);
  };

  const goNext = () => {
    setShowErrors(true);
    if (step === 1 && step1Valid) { navigateStep(2); setShowErrors(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }
    if (step === 2 && step2Valid) { navigateStep(3); setShowErrors(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }
    if (step === 3 && step3Valid) { navigateStep(4); setShowErrors(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return alert("Please sign in first.");
    setShowErrors(true);
    if (!step1Valid || !step2Valid || !step3Valid || !step4Valid) return;
    
    setLoading(true);
    const fullLocation = form.chowk.trim() ? `${form.location}, ${form.chowk.trim()}` : form.location;

    try {
      // --- FIXED: Changed .insert() to .upsert() with onConflict parameter ---
      const { error: insertError } = await supabase.from('tutors').upsert({
        user_id: user.id, // Supabase maps this against the unique constraint
        name: form.name,
        subject: form.subject, 
        location: fullLocation,
        experience: Number(form.experience),
        education: form.education,
        bio: form.bio,
        avatar_url: form.avatar_url,
        contact_num: form.contact_num,
        cv_url: form.cv_url,
        mode_of_teaching: form.mode_of_teaching,
        hour_rate: Number(form.hour_rate),
        id_url: form.id_url,
        verified: form.verified,
        availability: form.availability
      }, { onConflict: 'user_id' }); // Tells Postgres to update if user_id exists

      if (insertError) throw insertError;
      setSubmitted(true);
      localStorage.removeItem('tutor_profile_draft');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      alert("Error saving profile: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  // Animation variants
  const slideVariants = {
    enter: (direction: number) => ({ x: direction > 0 ? 50 : -50, opacity: 0, scale: 0.95 }),
    center: { zIndex: 1, x: 0, opacity: 1, scale: 1 },
    exit: (direction: number) => ({ zIndex: 0, x: direction < 0 ? 50 : -50, opacity: 0, scale: 0.95 })
  };

  if (!isMounted) return null;

  if (authLoading) {
    return (
      <div className="flex min-h-screen bg-slate-50">
        <div className="hidden lg:flex w-1/2 bg-slate-900 p-12 animate-pulse">
          <div className="w-full h-full bg-slate-800 rounded-[40px] opacity-50"></div>
        </div>
        <div className="w-full lg:w-1/2 p-6 sm:p-12 animate-pulse">
           <div className="h-10 w-full bg-slate-200 rounded-xl mb-12"></div>
           <div className="space-y-6">
             <div className="h-16 w-full bg-slate-200 rounded-2xl"></div>
             <div className="h-16 w-full bg-slate-200 rounded-2xl"></div>
             <div className="h-40 w-full bg-slate-200 rounded-2xl"></div>
           </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-[40px] p-10 shadow-xl border border-slate-100 text-center">
          <div className="mx-auto w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6"><Lock className="h-8 w-8" /></div>
          <h2 className="text-2xl font-black text-slate-900 mb-2">Sign In Required</h2>
          <p className="text-slate-500 mb-8">To become a verified tutor and manage your profile, you must be signed in.</p>
          <div className="space-y-4">
            <Link href="/login?redirect=/become-tutor" className="block w-full bg-blue-600 text-white font-bold py-4 rounded-2xl hover:bg-blue-700 transition shadow-lg shadow-blue-100">Sign In to Continue</Link>
            <button onClick={() => router.push('/')} className="block w-full text-slate-500 font-bold py-2">Back to Home</button>
          </div>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", bounce: 0.4 }} className="max-w-2xl w-full bg-white rounded-[40px] p-8 sm:p-12 text-center shadow-xl shadow-blue-900/5">
          <motion.div initial={{ rotate: -180, scale: 0 }} animate={{ rotate: 0, scale: 1 }} transition={{ delay: 0.2, type: "spring" }} className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 mb-6">
            <CheckCircle2 className="h-12 w-12" />
          </motion.div>
          <h1 className="text-3xl font-black text-slate-900 mb-2">Profile Submitted!</h1>
          <p className="text-slate-500 font-medium">Welcome to the GyanHub Tutor Network.</p>
          
          <div className="mt-10 bg-slate-50 rounded-3xl p-6 sm:p-8 border border-slate-100 text-left relative overflow-hidden">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6 text-center">Next 24 Hours</h3>
            
            <div className="space-y-8 relative before:absolute before:inset-0 before:ml-[1.1rem] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
               <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.4 }} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                 <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-blue-500 text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 animate-pulse">
                   <ShieldCheck className="w-5 h-5"/>
                 </div>
                 <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                   <h4 className="font-bold text-slate-900">Document Verification</h4>
                   <p className="text-xs text-slate-500 mt-1">Our team is reviewing your ID and CV.</p>
                 </div>
               </motion.div>
               <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.6 }} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                 <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-slate-200 text-slate-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                   <Sparkles className="w-5 h-5"/>
                 </div>
                 <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-4 rounded-2xl border border-slate-100 shadow-sm opacity-60">
                   <h4 className="font-bold text-slate-900">Verified Badge Status</h4>
                   <p className="text-xs text-slate-500 mt-1">Profile goes live with verified trust signals.</p>
                 </div>
               </motion.div>
            </div>
          </div>
          <button onClick={() => router.push('/tutors')} className="mt-10 bg-slate-900 text-white font-bold py-4 px-10 rounded-2xl hover:bg-slate-800 transition shadow-lg w-full sm:w-auto">Explore Directory</button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-slate-50 relative">
      
      {/* Top Fixed Progress Bar */}
      <div className="fixed top-0 left-0 w-full h-1.5 bg-slate-200 z-50">
        <motion.div className="h-full bg-blue-600" initial={{ width: 0 }} animate={{ width: `${(step / 4) * 100}%` }} transition={{ duration: 0.5, ease: "easeInOut" }} />
      </div>

      {/* LEFT PANEL (Fixed on Desktop) */}
      <div className="lg:w-[45%] lg:fixed lg:h-screen lg:top-0 lg:left-0 bg-[#0A0F24] p-8 sm:p-12 text-white overflow-hidden flex flex-col">
        {/* Background ambient glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600 rounded-full mix-blend-screen filter blur-[100px] opacity-20 animate-pulse pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-600 rounded-full mix-blend-screen filter blur-[100px] opacity-10 pointer-events-none"></div>
        
        <div className="relative z-10 flex-1 flex flex-col">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-bold uppercase tracking-widest backdrop-blur w-max">
            <ShieldCheck className="h-4 w-4 text-emerald-400" /> Secure Onboarding
          </div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight mb-4 leading-tight">Build Your <br/><span className="text-blue-400">Tutor Profile</span></h1>
          <p className="max-w-md text-slate-400 font-medium leading-relaxed mb-10">Join Nepal's premium network of educators. Build a professional profile that attracts the right students.</p>

          <div className="flex items-center gap-6 mb-12">
            <motion.div 
              animate={{ 
                boxShadow: strength === 100 ? "0 0 40px rgba(52, 211, 153, 0.4)" : "0 0 20px rgba(59, 130, 246, 0.2)",
                borderColor: strength === 100 ? "rgba(52, 211, 153, 0.5)" : "rgba(255, 255, 255, 0.1)"
              }}
              className="relative w-24 h-24 rounded-full bg-white/5 backdrop-blur flex flex-col items-center justify-center border transition-colors duration-700"
            >
              <span className={cn("text-2xl font-black", strength === 100 ? "text-emerald-400" : "text-white")}>{strength}%</span>
              <span className="text-[9px] uppercase tracking-wider text-slate-400 mt-1">Strength</span>
              {/* Circular SVG Progress */}
              <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                <circle cx="48" cy="48" r="46" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-white/5" />
                <motion.circle cx="48" cy="48" r="46" stroke="currentColor" strokeWidth="4" fill="transparent" 
                  className={strength === 100 ? "text-emerald-400" : "text-blue-500"} strokeDasharray={2 * Math.PI * 46} 
                  initial={{ strokeDashoffset: 2 * Math.PI * 46 }} animate={{ strokeDashoffset: 2 * Math.PI * 46 * (1 - strength / 100) }} transition={{ duration: 1 }} />
              </svg>
            </motion.div>
            <div>
              <h3 className="font-bold text-lg">{strength === 100 ? "Profile Optimized!" : "Almost there..."}</h3>
              <p className="text-sm text-slate-400">Students prefer complete profiles.</p>
            </div>
          </div>

          {/* Sticky Preview Card */}
          <div className="mt-auto hidden lg:block">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4 px-2">Live Card Preview</h3>
            <motion.div layout className={cn("rounded-[32px] border bg-[#111827] p-6 shadow-2xl relative overflow-hidden transition-all duration-500", hasProSubject ? "border-blue-500/50 shadow-[0_0_30px_rgba(59,130,246,0.15)]" : "border-white/10")}>
              {hasProSubject && <div className="absolute top-0 right-0 bg-gradient-to-l from-blue-600 to-blue-400 text-white text-[9px] font-black px-4 py-1 rounded-bl-xl uppercase tracking-widest shadow-lg">Pro Tutor</div>}
              
              <div className="flex gap-4 items-start mb-5">
                <div className="h-16 w-16 shrink-0 rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
                  {form.avatar_url ? <img src={form.avatar_url} className="h-full w-full object-cover" /> : <UserCircle2 className="h-full w-full p-2 text-slate-500" />}
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-xl font-black text-white truncate">
                    {form.name ? (
                      <motion.span initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}>{form.name}</motion.span>
                    ) : (
                      <span className="text-slate-600 flex items-center gap-1">Your Name <motion.span animate={{ opacity: [0,1,0] }} transition={{ repeat: Infinity, duration: 1 }}>|</motion.span></span>
                    )}
                  </h4>
                  <p className="text-xs font-bold text-slate-400 truncate">{form.education || 'Highest Qualification'}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5 mb-6 min-h-[28px]">
                <AnimatePresence>
                  {form.subject.length > 0 ? form.subject.slice(0, 3).map(s => (
                    <motion.span key={s} layout initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="text-[10px] bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2.5 py-1 rounded-lg font-bold">
                      {s}
                    </motion.span>
                  )) : (
                    <span className="text-[10px] border border-dashed border-slate-600 text-slate-600 px-3 py-1 rounded-lg font-medium">Select subjects...</span>
                  )}
                </AnimatePresence>
              </div>

              <div className="space-y-3 pt-5 border-t border-white/10 text-xs font-medium text-slate-300">
                <div className="flex items-center gap-3"><MapPin className={cn("h-4 w-4", form.location ? "text-blue-400" : "text-slate-600")} /> {form.location || 'Your City'}</div>
                <div className="flex items-center gap-3"><Briefcase className={cn("h-4 w-4", form.experience ? "text-emerald-400" : "text-slate-600")} /> {form.experience ? `${form.experience} Years Exp.` : 'Experience'}</div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL (Scrollable Form) */}
      <div className="lg:w-[55%] lg:ml-[45%] p-6 sm:p-12 lg:p-20 min-h-screen">
        <div className="max-w-xl mx-auto">
          
          {/* Interactive Steppers */}
          <div className="flex justify-between items-center mb-12 relative">
            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-200 -z-10 -translate-y-1/2 rounded-full"></div>
            {['Basics', 'Credentials', 'Preferences', 'Verify'].map((label, idx) => {
              const num = idx + 1;
              const isDone = step > num;
              const isActive = step === num;
              return (
                <div key={num} className="flex flex-col items-center gap-2 cursor-pointer bg-slate-50 px-2" onClick={() => { if(isDone || (num===2&&step1Valid) || (num===3&&step2Valid) || (num===4&&step3Valid)) navigateStep(num); }}>
                  <motion.div 
                    animate={isActive ? { scale: 1.1, y: -2 } : { scale: 1, y: 0 }}
                    className={cn(
                      "h-10 w-10 rounded-xl flex items-center justify-center font-black text-sm transition-all duration-300 shadow-sm", 
                      isActive ? "bg-white/70 backdrop-blur-md border border-blue-200 text-blue-600 shadow-[0_4px_20px_rgba(59,130,246,0.15)] ring-4 ring-blue-50" : 
                      isDone ? "bg-emerald-500 text-white border-none" : "bg-white text-slate-400 border border-slate-200"
                    )}
                  >
                    {isDone ? <CheckCircle2 className="h-5 w-5"/> : num}
                  </motion.div>
                  <span className={cn("text-[10px] font-bold uppercase tracking-wider absolute -bottom-6 w-max text-center transition-colors", isActive ? "text-blue-600" : isDone ? "text-emerald-600" : "text-slate-400")}>{label}</span>
                </div>
              );
            })}
          </div>

          <form onSubmit={handleSubmit} className="mt-8 pb-32">
            <AnimatePresence mode="wait" custom={direction}>
              {step === 1 && (
                <motion.div key="step1" custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3, ease: "easeInOut" }} className="space-y-6">
                  <h2 className="text-2xl font-black text-slate-900 mb-8">Let's start with the basics</h2>
                  <div className="grid sm:grid-cols-2 gap-6">
                    <FloatingInput label="Full Name" name="name" value={form.name} onChange={(e: any) => updateField('name', e.target.value)} icon={User} hasError={showErrors && errors.name} errorMessage={errors.name} />
                    <FloatingInput label="Phone Number" name="contact_num" type="tel" value={form.contact_num} onChange={(e: any) => updateField('contact_num', e.target.value)} icon={Phone} hasError={showErrors && errors.contact} errorMessage={errors.contact} />
                  </div>
                  <div className="grid sm:grid-cols-2 gap-6">
                    <div className="relative group">
                      <MapPin className={cn("absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 z-10 transition-colors", form.location ? "text-blue-500" : "text-slate-400")} />
                      <select value={form.location} onChange={(e) => updateField('location', e.target.value)} className={cn("w-full h-14 rounded-2xl border bg-white pl-11 pr-4 text-sm font-bold outline-none appearance-none cursor-pointer transition-all", showErrors && errors.location ? "border-red-400 focus:shadow-[0_0_15px_rgba(248,113,113,0.3)]" : "border-slate-200 focus:border-blue-500 focus:shadow-[0_0_15px_rgba(59,130,246,0.3)]")}>
                        <option value="" disabled>Select City *</option>
                        {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <FloatingInput label="Chowk / Area (Optional)" name="chowk" value={form.chowk} onChange={(e: any) => updateField('chowk', e.target.value)} icon={MapPin} placeholder="e.g. Baneshwor" />
                  </div>
                  
                  <FloatingInput 
                    label="Highest Qualification" 
                    name="education" 
                    value={form.education} 
                    onChange={(e: any) => updateField('education', e.target.value)} 
                    icon={GraduationCap} 
                    hasError={showErrors && errors.education} 
                    errorMessage={errors.education} 
                    placeholder="e.g. MBA, BE Civil, MSc Geomatics" 
                  />
                  
                  <div className={cn("rounded-3xl border p-6 transition-colors", showErrors && errors.subject ? "border-red-300 bg-red-50/50" : "border-slate-200 bg-white")}>
                    <label className="block text-sm font-black text-slate-900 mb-3">Expertise / Subjects</label>
                    <div className="flex flex-wrap gap-2 mb-4 p-2 rounded-xl bg-slate-50 border border-slate-100 min-h-[50px] items-center focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                      <AnimatePresence>
                        {form.subject.map((s) => (
                          <motion.span layout initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} key={s} className="flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-1.5 text-[11px] font-bold text-white shadow-sm">
                            {s} <button type="button" onClick={() => toggleSubject(s)} className="hover:text-red-200 transition-colors"><X className="h-3 w-3" /></button>
                          </motion.span>
                        ))}
                      </AnimatePresence>
                      <input type="text" value={subjectInput} onChange={(e) => setSubjectInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); toggleSubject(subjectInput); } }} placeholder="Type and press enter..." className="flex-1 bg-transparent py-1 px-2 text-sm font-bold outline-none placeholder:text-slate-400 min-w-[120px]" />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {filteredSubjects.map(sub => {
                        const isSelected = form.subject.includes(sub);
                        return (
                          <button key={sub} type="button" onClick={() => toggleSubject(sub)} className={cn("rounded-lg border px-3 py-1.5 text-[10px] font-black uppercase transition-all", isSelected ? "bg-blue-50 text-blue-600 border-blue-200 scale-95 opacity-50 pointer-events-none" : "bg-white text-slate-600 hover:border-slate-400 hover:bg-slate-50 border-slate-200")}>
                            + {sub}
                          </button>
                        );
                      })}
                    </div>
                    {showErrors && errors.subject && <p className="mt-3 text-[11px] font-bold text-red-500 flex items-center gap-1"><AlertCircle className="h-3 w-3"/> {errors.subject}</p>}
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div key="step2" custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3, ease: "easeInOut" }} className="space-y-6">
                  <h2 className="text-2xl font-black text-slate-900 mb-8">Professional Credentials</h2>
                  <FloatingInput label="Years of Experience" name="experience" type="number" value={form.experience} onChange={(e: any) => updateField('experience', e.target.value)} icon={Briefcase} hasError={showErrors && errors.experience} errorMessage={errors.experience} />
                  
                  <div className="relative">
                    <textarea rows={6} value={form.bio} onChange={(e) => updateField('bio', e.target.value)} placeholder={BIO_PLACEHOLDERS[hintIndex]} className={cn("w-full rounded-2xl border bg-white px-5 py-5 text-sm font-medium outline-none transition-all resize-none", showErrors && errors.bio ? "border-red-400 focus:shadow-[0_0_15px_rgba(248,113,113,0.3)]" : "border-slate-200 focus:border-blue-500 focus:shadow-[0_0_15px_rgba(59,130,246,0.3)]")} />
                    <div className="absolute bottom-4 right-4 flex items-center gap-2">
                      <span className="text-[10px] font-bold text-slate-400">{form.bio.length} / 50</span>
                      <svg className="w-6 h-6 transform -rotate-90">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="transparent" className="text-slate-100" />
                        <motion.circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="transparent" 
                          className={bioProgress >= 100 ? "text-emerald-500" : "text-red-400"} 
                          strokeDasharray={2 * Math.PI * 10} strokeDashoffset={2 * Math.PI * 10 * (1 - bioProgress / 100)} 
                          transition={{ duration: 0.3 }} />
                      </svg>
                    </div>
                    {showErrors && errors.bio && <p className="mt-1 text-[11px] font-bold text-red-500 flex items-center gap-1"><AlertCircle className="h-3 w-3"/> {errors.bio}</p>}
                  </div>

                  <DriveLinkCard title="CV Link" subtitle="Paste a viewable Google Drive link." icon={FileText} value={form.cv_url} onChange={(e: any) => updateField('cv_url', e.target.value)} hasError={showErrors && errors.cv_url} errorMessage={errors.cv_url} />
                </motion.div>
              )}

              {step === 3 && (
                <motion.div key="step3" custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3, ease: "easeInOut" }} className="space-y-8">
                  <h2 className="text-2xl font-black text-slate-900 mb-8">Teaching Preferences</h2>
                  <div className="grid gap-4 sm:grid-cols-3">
                    {TEACHING_MODES.map((mode) => {
                      const isActive = form.mode_of_teaching === mode.value;
                      return (
                        <button key={mode.value} type="button" onClick={() => updateField('mode_of_teaching', mode.value)} 
                          className={cn('relative rounded-[24px] border-2 p-5 text-left transition-all duration-300 overflow-hidden group', isActive ? 'border-blue-600 bg-blue-50/50 shadow-md' : 'border-slate-200 hover:border-blue-300')}>
                          <mode.icon className={cn("h-6 w-6 mb-3 transition-colors", isActive ? "text-blue-600" : "text-slate-400 group-hover:text-blue-500")} />
                          <h4 className="text-sm font-black text-slate-900">{mode.label}</h4>
                          {isActive && (
                            <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="absolute top-4 right-4 text-blue-600">
                              <CheckCircle2 className="h-5 w-5" />
                            </motion.div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  {showErrors && errors.mode_of_teaching && <p className="text-[11px] font-bold text-red-500 flex items-center gap-1"><AlertCircle className="h-3 w-3"/> {errors.mode_of_teaching}</p>}
                  
                  <FloatingInput label="Rate per Hour" name="hour_rate" type="number" prefix="Rs." value={form.hour_rate} onChange={(e: any) => updateField('hour_rate', e.target.value)} icon={Banknote} hasError={showErrors && errors.hour_rate} errorMessage={errors.hour_rate} tooltip="To ensure quality standards, minimum rate is Rs. 200/hr" />
                </motion.div>
              )}

              {step === 4 && (
                <motion.div key="step4" custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3, ease: "easeInOut" }} className="space-y-6">
                  <h2 className="text-2xl font-black text-slate-900 mb-8">Verify Your Identity</h2>
                  <DriveLinkCard title="Government ID" subtitle="Link to Citizenship, License, or Passport." icon={IdCard} value={form.id_url} secure onChange={(e: any) => updateField('id_url', e.target.value)} hasError={showErrors && errors.id_url} errorMessage={errors.id_url} />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Bottom Navigation */}
            <div className="fixed bottom-0 left-0 lg:left-[45%] w-full lg:w-[55%] bg-white/80 backdrop-blur-xl border-t border-slate-200 p-6 z-40 flex items-center justify-between">
              <div className="max-w-xl mx-auto w-full flex items-center justify-between">
                {step > 1 ? (
                  <button type="button" onClick={() => navigateStep(step - 1)} className="font-bold text-slate-500 hover:text-slate-900 uppercase tracking-widest text-[11px] flex items-center gap-1 transition-colors">
                    <ChevronLeft className="h-4 w-4"/> Back
                  </button>
                ) : <div/>}
                
                {step < 4 ? (
                  <button type="button" onClick={goNext} className="bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest text-[11px] py-4 px-8 rounded-2xl shadow-[0_10px_30px_rgba(59,130,246,0.3)] transition-all flex items-center gap-2 group">
                    Continue <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform"/>
                  </button>
                ) : (
                  <button type="submit" disabled={loading} className="bg-emerald-500 hover:bg-emerald-600 text-white font-black uppercase tracking-widest text-[11px] py-4 px-8 rounded-2xl shadow-[0_10px_30px_rgba(16,185,129,0.3)] disabled:opacity-50 transition-all flex items-center gap-2">
                    {loading ? <><Loader2 className="h-4 w-4 animate-spin"/> Submitting...</> : <><CheckCircle2 className="h-4 w-4"/> Submit Profile</>}
                  </button>
                )}
              </div>
            </div>
          </form>

        </div>
      </div>
    </div>
  );
}