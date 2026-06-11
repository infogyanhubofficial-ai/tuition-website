'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen, Briefcase, CheckCircle2, ChevronLeft, ChevronRight, FileText,
  GraduationCap, Home, IdCard, Laptop, Lock, MapPin, Phone, ShieldCheck,
  User, UserCircle2, Building2, Link as LinkIcon, X, AlertCircle,
  Banknote, Loader2, Info, Sparkles, UploadCloud
} from 'lucide-react';
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

// --- MODERN UI COMPONENTS ---
function PremiumInput({ label, helperText, name, value, onChange, type = 'text', hasError = false, errorMessage, placeholder, icon: Icon, prefix }: any) {
  return (
    <div className="flex flex-col gap-2 w-full">
      <label className="text-sm font-bold text-slate-800">{label}</label>
      <div className="relative group">
        {Icon && <Icon className={cn("absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors", hasError ? "text-red-400" : value ? "text-blue-500" : "text-slate-400 group-focus-within:text-blue-500")} />}
        {prefix && <span className="absolute left-12 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-700">{prefix}</span>}
        <input
          type={type} name={name} value={value} onChange={onChange} placeholder={placeholder}
          className={cn(
            'w-full h-14 rounded-xl border bg-slate-50/50 px-4 text-sm font-medium text-slate-900 outline-none transition-all focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500',
            Icon ? 'pl-12' : '', prefix ? 'pl-[76px]' : '',
            hasError ? 'border-red-400 focus:ring-red-500/10 focus:border-red-500 bg-red-50/30' : 'border-slate-200 hover:border-slate-300'
          )}
        />
      </div>
      {errorMessage && hasError ? (
        <p className="text-xs font-semibold text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3"/> {errorMessage}</p>
      ) : helperText ? (
        <p className="text-xs text-slate-500">{helperText}</p>
      ) : null}
    </div>
  );
}

function DocumentLinkCard({ title, subtitle, helperText, icon: Icon, value, placeholder, onChange, hasError, errorMessage }: any) {
  const isDrive = value && value.includes('drive.google.com');
  return (
    <div className="flex flex-col gap-2 w-full">
      <label className="text-sm font-bold text-slate-800">{title}</label>
      <div className={cn(
        "relative rounded-2xl border p-5 sm:p-6 transition-all bg-slate-50/50", 
        hasError ? "border-red-300 bg-red-50/30" : value && isDrive ? "border-emerald-300 bg-emerald-50/30 shadow-sm" : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
      )}>
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-start sm:items-center">
          <div className={cn("p-4 rounded-2xl flex-shrink-0 transition-colors", value && isDrive ? "bg-emerald-100 text-emerald-600" : "bg-white text-slate-400 border border-slate-200 shadow-sm")}>
            {value && isDrive ? <CheckCircle2 className="w-6 h-6"/> : <UploadCloud className="w-6 h-6" />}
          </div>
          <div className="flex-1 w-full space-y-3">
            <div>
              <p className="text-sm font-semibold text-slate-700">{subtitle}</p>
              <p className="text-xs text-slate-500 mt-0.5">Please ensure link sharing is set to "Anyone with the link".</p>
            </div>
            <div className="relative">
              <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="url" value={value} onChange={onChange} placeholder={placeholder} 
                className={cn(
                  "w-full h-12 rounded-xl border bg-white pl-11 pr-4 text-sm font-medium outline-none transition-all focus:ring-4 focus:ring-blue-500/10 shadow-sm",
                  hasError ? "border-red-300 focus:border-red-500" : "border-slate-200 focus:border-blue-500"
                )} 
              />
            </div>
          </div>
        </div>
      </div>
      {errorMessage && hasError ? (
        <p className="text-xs font-semibold text-red-500 flex items-center gap-1 mt-1"><AlertCircle className="w-3 h-3"/> {errorMessage}</p>
      ) : helperText ? (
        <p className="text-xs font-medium text-slate-500 mt-1">{helperText}</p>
      ) : null}
    </div>
  )
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
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user ?? null);
      
      if (user) {
        const { data: existingProfile } = await supabase
          .from('tutors')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (existingProfile) {
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
          const draft = localStorage.getItem('tutor_profile_draft');
          if (draft) { 
            try { setForm(prev => ({ ...prev, ...JSON.parse(draft) })); } catch (e) {} 
          } else if (user.user_metadata) {
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
  }, [supabase]);

  useEffect(() => {
    if (isMounted && !submitted) localStorage.setItem('tutor_profile_draft', JSON.stringify(form));
  }, [form, isMounted, submitted]);

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
    cv_url: form.cv_url && !isDriveLink(form.cv_url) ? 'Must be a valid Google Drive link' : '', 
    mode_of_teaching: !form.mode_of_teaching ? 'Select a teaching mode' : '',
    hour_rate: !form.hour_rate || Number(form.hour_rate) < 200 ? 'Minimum rate is Rs. 200/hr' : '',
    id_url: form.id_url && !isDriveLink(form.id_url) ? 'Must be a valid Google Drive link' : '' 
  };

  const step1Valid = !errors.name && !errors.contact && !errors.subject && !errors.location && !errors.education;
  const step2Valid = !errors.experience && !errors.bio && !errors.cv_url && !errors.id_url; 
  const step3Valid = !errors.mode_of_teaching && !errors.hour_rate;

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

  const getMissingFields = (currentStep: number) => {
    const missing = [];
    if (currentStep === 1) {
      if (errors.name) missing.push("Full Name");
      if (errors.contact) missing.push("Phone Number (10 digits)");
      if (errors.location) missing.push("City");
      if (errors.education) missing.push("Highest Qualification");
      if (errors.subject) missing.push("Expertise / Subjects (Add at least 1)");
    } else if (currentStep === 2) {
      if (errors.experience) missing.push("Years of Experience");
      if (errors.bio) missing.push("Professional Bio (Minimum 50 characters)");
      if (errors.cv_url) missing.push("CV Link (Must be valid Google Drive link)");
      if (errors.id_url) missing.push("ID Link (Must be valid Google Drive link)");
    } else if (currentStep === 3) {
      if (errors.mode_of_teaching) missing.push("Preferred Teaching Mode");
      if (errors.hour_rate) missing.push("Standard Hourly Rate (Min 200)");
    }
    return missing;
  };

  const goNext = () => {
    setShowErrors(true);
    const missing = getMissingFields(step);

    if (step === 1) {
      if (step1Valid) {
        navigateStep(2);
        setShowErrors(false);
        document.getElementById('form-top')?.scrollIntoView({ behavior: 'smooth' });
      } else {
        alert(`Please complete or fix the following required fields:\n\n• ${missing.join('\n• ')}`);
      }
    } else if (step === 2) {
      if (step2Valid) {
        navigateStep(3);
        setShowErrors(false);
        document.getElementById('form-top')?.scrollIntoView({ behavior: 'smooth' });
      } else {
        alert(`Please complete or fix the following required fields:\n\n• ${missing.join('\n• ')}`);
      }
    }
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // FIX: Intercept "Enter" key press so it doesn't auto-submit the whole form
    if (step < 3) {
      goNext();
      return;
    }

    if (!user) return alert("Please sign in first.");
    setShowErrors(true);
    
    if (!step3Valid) {
      const missing = getMissingFields(3);
      if (missing.length > 0) {
        alert(`Please complete or fix the following required fields:\n\n• ${missing.join('\n• ')}`);
      }
      return;
    }

    if (!step1Valid || !step2Valid || !step3Valid) return;
    
    setLoading(true);
    const fullLocation = form.chowk.trim() ? `${form.location}, ${form.chowk.trim()}` : form.location;

    try {
      const { error: insertError } = await supabase.from('tutors').upsert({
        user_id: user.id, 
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
      }, { onConflict: 'user_id' }); 

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

  const slideVariants = {
    enter: (direction: number) => ({ x: direction > 0 ? 30 : -30, opacity: 0 }),
    center: { zIndex: 1, x: 0, opacity: 1 },
    exit: (direction: number) => ({ zIndex: 0, x: direction < 0 ? 30 : -30, opacity: 0 })
  };

  if (!isMounted) return null;

  if (authLoading) {
    return (
      <div className="flex min-h-screen bg-slate-50">
        <div className="hidden lg:flex w-[40%] bg-slate-900 p-12 animate-pulse">
          <div className="w-full h-full bg-slate-800/50 rounded-3xl"></div>
        </div>
        <div className="w-full lg:w-[60%] p-6 sm:p-12 animate-pulse flex flex-col justify-center">
           <div className="max-w-2xl mx-auto w-full space-y-6">
             <div className="h-10 w-3/4 bg-slate-200 rounded-xl mb-12"></div>
             <div className="h-16 w-full bg-slate-200/60 rounded-2xl"></div>
             <div className="h-16 w-full bg-slate-200/60 rounded-2xl"></div>
             <div className="h-40 w-full bg-slate-200/60 rounded-2xl"></div>
           </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-10 shadow-sm border border-slate-100 text-center">
          <div className="mx-auto w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6"><Lock className="h-8 w-8" /></div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Sign In Required</h2>
          <p className="text-slate-500 mb-8">To become a verified tutor and manage your profile, please sign in.</p>
          <div className="space-y-4">
            <Link href="/login?redirect=/become-tutor" className="block w-full bg-blue-600 text-white font-bold py-4 rounded-xl hover:bg-blue-700 transition">Sign In to Continue</Link>
            <button onClick={() => router.push('/')} className="block w-full text-slate-500 font-semibold hover:text-slate-900 transition py-2">Back to Home</button>
          </div>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="max-w-2xl w-full bg-white rounded-3xl p-8 sm:p-12 text-center shadow-sm border border-slate-100">
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-emerald-50 text-emerald-500 mb-6">
            <CheckCircle2 className="h-12 w-12" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-3">Application Submitted!</h1>
          <p className="text-slate-500 font-medium">Welcome to the Tutor Network. Your profile is now under review.</p>
          
          <div className="mt-10 bg-slate-50/50 rounded-2xl p-6 sm:p-8 border border-slate-100 text-left">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-6 text-center">Next Steps</h3>
            <div className="space-y-4">
               <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex gap-4 items-center">
                 <ShieldCheck className="w-8 h-8 text-blue-500 flex-shrink-0"/>
                 <div>
                   <h4 className="font-bold text-slate-900">Document Verification</h4>
                   <p className="text-sm text-slate-500">Our team will review your submitted credentials within 24 hours.</p>
                 </div>
               </div>
               <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex gap-4 items-center opacity-70">
                 <Sparkles className="w-8 h-8 text-slate-400 flex-shrink-0"/>
                 <div>
                   <h4 className="font-bold text-slate-900">Verified Badge Status</h4>
                   <p className="text-sm text-slate-500">Once approved, your profile goes live with a verified badge.</p>
                 </div>
               </div>
            </div>
          </div>
          <button onClick={() => router.push('/tutors')} className="mt-10 bg-slate-900 text-white font-bold py-4 px-10 rounded-xl hover:bg-slate-800 transition w-full sm:w-auto">Explore Directory</button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-slate-50 relative">
      
      {/* Top Fixed Progress Bar */}
      <div className="fixed top-0 left-0 w-full h-1 bg-slate-200 z-50">
        <motion.div className="h-full bg-blue-600" initial={{ width: 0 }} animate={{ width: `${(step / 3) * 100}%` }} transition={{ duration: 0.5, ease: "easeInOut" }} />
      </div>

      {/* LEFT PANEL */}
      <div className="lg:w-[40%] lg:fixed lg:h-screen lg:top-0 lg:left-0 bg-slate-900 p-8 sm:p-12 lg:p-16 text-white overflow-y-auto flex flex-col border-r border-slate-800">
        <div className="relative z-10 flex-1 flex flex-col">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-800 px-4 py-1.5 text-xs font-bold uppercase tracking-widest w-max text-slate-300">
            <ShieldCheck className="h-4 w-4 text-emerald-400" /> Secure Application
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4 leading-tight">Build Your <br/><span className="text-blue-400">Professional Profile</span></h1>
          <p className="text-slate-400 font-medium leading-relaxed mb-10 max-w-md">Join a premium network of educators. Build a comprehensive profile that highlights your expertise and attracts dedicated students.</p>

          <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50 mb-12">
            <div className="flex justify-between items-end mb-3">
              <div>
                <h3 className="font-bold text-white">Profile Strength</h3>
                <p className="text-sm text-slate-400 mt-1">Complete all fields to rank higher.</p>
              </div>
              <span className={cn("text-2xl font-bold", strength === 100 ? "text-emerald-400" : "text-blue-400")}>{strength}%</span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2 mt-4">
              <motion.div className={cn("h-2 rounded-full", strength === 100 ? "bg-emerald-400" : "bg-blue-500")} initial={{ width: 0 }} animate={{ width: `${strength}%` }} transition={{ duration: 0.5 }} />
            </div>
          </div>

          <div className="mt-auto hidden lg:block">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4 px-1">Live Card Preview</h3>
            <div className="rounded-2xl border border-slate-700 bg-slate-800 p-6 relative overflow-hidden">
              {hasProSubject && <div className="absolute top-0 right-0 bg-blue-600 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg uppercase tracking-wider">Pro Subject</div>}
              
              <div className="flex gap-4 items-start mb-5">
                <div className="h-16 w-16 shrink-0 rounded-xl bg-slate-700 overflow-hidden border border-slate-600">
                  {form.avatar_url ? <img src={form.avatar_url} className="h-full w-full object-cover" /> : <UserCircle2 className="h-full w-full p-2 text-slate-400" />}
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-lg font-bold text-white truncate">
                    {form.name || <span className="text-slate-500">Your Full Name</span>}
                  </h4>
                  <p className="text-sm text-slate-400 truncate mt-0.5">{form.education || 'Highest Qualification'}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-6 min-h-[28px]">
                <AnimatePresence>
                  {form.subject.length > 0 ? form.subject.slice(0, 3).map(s => (
                    <motion.span key={s} layout initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="text-[11px] bg-slate-700 text-slate-200 border border-slate-600 px-3 py-1 rounded-md font-medium">
                      {s}
                    </motion.span>
                  )) : (
                    <span className="text-xs text-slate-500 font-medium">Selected subjects will appear here...</span>
                  )}
                </AnimatePresence>
              </div>

              <div className="space-y-2 pt-4 border-t border-slate-700 text-sm font-medium text-slate-300">
                <div className="flex items-center gap-3"><MapPin className="h-4 w-4 text-slate-500" /> {form.location || 'Your City'}</div>
                <div className="flex items-center gap-3"><Briefcase className="h-4 w-4 text-slate-500" /> {form.experience ? `${form.experience} Years Experience` : 'Experience'}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="lg:w-[60%] lg:ml-[40%] p-6 sm:p-12 lg:p-16 xl:p-24 min-h-screen pb-40 lg:pb-32">
        <div className="max-w-2xl mx-auto">
          
          {/* Scroll Target Anchor */}
          <div id="form-top" className="invisible -mt-24 pt-24"></div>

          {/* Interactive Steppers */}
          <div className="flex justify-between items-center mb-10 relative">
            <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-100 -z-10 -translate-y-1/2 rounded-full"></div>
            {['Basics', 'Credentials', 'Preferences'].map((label, idx) => {
              const num = idx + 1;
              const isDone = step > num;
              const isActive = step === num;
              return (
                <div key={num} className="flex flex-col items-center gap-2 cursor-pointer bg-slate-50 px-2 sm:px-4" onClick={() => { if(isDone || (num===2&&step1Valid) || (num===3&&step2Valid)) { navigateStep(num); document.getElementById('form-top')?.scrollIntoView({ behavior: 'smooth' }); }}}>
                  <div className={cn(
                      "h-10 w-10 sm:h-12 sm:w-12 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ring-4 ring-slate-50", 
                      isActive ? "bg-blue-600 text-white shadow-md" : 
                      isDone ? "bg-emerald-500 text-white" : "bg-white text-slate-400 border border-slate-200"
                    )}
                  >
                    {isDone ? <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6"/> : num}
                  </div>
                  <span className={cn("text-[10px] sm:text-xs font-bold uppercase tracking-wider absolute -bottom-6 w-max text-center transition-colors", isActive ? "text-blue-600" : isDone ? "text-emerald-600" : "text-slate-400")}>{label}</span>
                </div>
              );
            })}
          </div>

          <form onSubmit={handleSubmit} className="mt-12 space-y-8">
            <AnimatePresence mode="wait" custom={direction}>
              
              {/* --- STEP 1: BASICS --- */}
              {step === 1 && (
                <motion.div key="step1" custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }} className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">Personal Information</h2>
                    <p className="text-slate-500 mt-1">Let's start with your basic contact and academic details.</p>
                  </div>
                  
                  <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
                    <div className="grid sm:grid-cols-2 gap-6">
                      <PremiumInput label="Full Name" name="name" placeholder="E.g. Khusbu Kharel" value={form.name} onChange={(e: any) => updateField('name', e.target.value)} icon={User} hasError={showErrors && errors.name} errorMessage={errors.name} />
                      <PremiumInput label="Phone Number" helperText="Use your active WhatsApp number" name="contact_num" type="tel" placeholder="E.g. 9812345678" value={form.contact_num} onChange={(e: any) => updateField('contact_num', e.target.value)} icon={Phone} hasError={showErrors && errors.contact} errorMessage={errors.contact} />
                    </div>
                    
                    <div className="grid sm:grid-cols-2 gap-6">
                      <div className="flex flex-col gap-2 w-full">
                        <label className="text-sm font-bold text-slate-800">City</label>
                        <div className="relative">
                          <MapPin className={cn("absolute left-4 top-1/2 w-5 h-5 -translate-y-1/2 z-10 transition-colors", form.location ? "text-blue-500" : "text-slate-400")} />
                          <select value={form.location} onChange={(e) => updateField('location', e.target.value)} className={cn("w-full h-14 rounded-xl border bg-slate-50/50 pl-12 pr-4 text-sm font-medium outline-none appearance-none cursor-pointer transition-all", showErrors && errors.location ? "border-red-400 focus:ring-red-500/10 bg-red-50/30" : "border-slate-200 hover:border-slate-300 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white")}>
                            <option value="" disabled>Select City</option>
                            {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                        </div>
                        {showErrors && errors.location && <p className="text-xs font-semibold text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3"/> {errors.location}</p>}
                      </div>
                      <PremiumInput label="Chowk / Area (Optional)" helperText="E.g. Kausaltar, Baneshwor" name="chowk" value={form.chowk} onChange={(e: any) => updateField('chowk', e.target.value)} icon={MapPin} />
                    </div>

                    <PremiumInput 
                      label="Highest Qualification" 
                      helperText="E.g. MBA Student, BE Civil, MSc Geomatics"
                      name="education" 
                      value={form.education} 
                      onChange={(e: any) => updateField('education', e.target.value)} 
                      icon={GraduationCap} 
                      hasError={showErrors && errors.education} 
                      errorMessage={errors.education} 
                      placeholder="Enter your highest degree" 
                    />
                  </div>

                  <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-sm font-bold text-slate-800">Expertise / Subjects Taught</label>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-2 p-3 rounded-xl bg-slate-50/50 border border-slate-200 min-h-[60px] items-center focus-within:ring-4 focus-within:ring-blue-500/10 focus-within:border-blue-500 focus-within:bg-white transition-all">
                      <AnimatePresence>
                        {form.subject.map((s) => (
                          <motion.span layout initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} key={s} className="flex items-center gap-2 rounded-md bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700 border border-blue-100">
                            {s} <button type="button" onClick={() => toggleSubject(s)} className="hover:text-blue-900 transition-colors"><X className="h-3 w-3" /></button>
                          </motion.span>
                        ))}
                      </AnimatePresence>
                      <input type="text" value={subjectInput} onChange={(e) => setSubjectInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); toggleSubject(subjectInput); } }} placeholder="Type subject and press enter..." className="flex-1 bg-transparent py-1 px-2 text-sm font-medium outline-none placeholder:text-slate-400 min-w-[150px]" />
                    </div>
                    
                    <div className="flex flex-wrap gap-2 pt-2">
                      {filteredSubjects.map(sub => {
                        const isSelected = form.subject.includes(sub);
                        return (
                          <button key={sub} type="button" onClick={() => toggleSubject(sub)} className={cn("rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all", isSelected ? "bg-slate-100 text-slate-400 border-slate-200 opacity-50 cursor-not-allowed" : "bg-white text-slate-600 hover:border-blue-300 hover:text-blue-600 border-slate-200")}>
                            + {sub}
                          </button>
                        );
                      })}
                    </div>
                    {showErrors && errors.subject && <p className="text-xs font-semibold text-red-500 flex items-center gap-1 mt-2"><AlertCircle className="w-3 h-3"/> {errors.subject}</p>}
                  </div>
                </motion.div>
              )}

              {/* --- STEP 2: CREDENTIALS --- */}
              {step === 2 && (
                <motion.div key="step2" custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }} className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">Professional Credentials</h2>
                    <p className="text-slate-500 mt-1">Tell students about your experience and upload your documents.</p>
                  </div>

                  <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
                    <PremiumInput label="Years of Experience" helperText="Enter 0 if you are just starting out." name="experience" type="number" value={form.experience} placeholder="E.g. 2" onChange={(e: any) => updateField('experience', e.target.value)} icon={Briefcase} hasError={showErrors && errors.experience} errorMessage={errors.experience} />
                    
                    <div className="flex flex-col gap-2 w-full">
                      <label className="text-sm font-bold text-slate-800">Professional Bio</label>
                      <div className="relative">
                        <textarea rows={5} value={form.bio} onChange={(e) => updateField('bio', e.target.value)} placeholder={BIO_PLACEHOLDERS[hintIndex]} className={cn("w-full rounded-xl border bg-slate-50/50 px-4 py-4 text-sm font-medium outline-none transition-all resize-none focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500", showErrors && errors.bio ? "border-red-400 bg-red-50/30" : "border-slate-200 hover:border-slate-300")} />
                        <div className="absolute bottom-4 right-4 flex items-center gap-2 bg-white/80 backdrop-blur rounded-full px-2 py-1 shadow-sm border border-slate-100">
                          <span className="text-[10px] font-bold text-slate-500">{form.bio.length} / 50 min</span>
                          <svg className="w-4 h-4 transform -rotate-90">
                            <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="2" fill="transparent" className="text-slate-200" />
                            <motion.circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="2" fill="transparent" 
                              className={bioProgress >= 100 ? "text-emerald-500" : "text-orange-400"} 
                              strokeDasharray={2 * Math.PI * 7} strokeDashoffset={2 * Math.PI * 7 * (1 - bioProgress / 100)} 
                              transition={{ duration: 0.3 }} />
                          </svg>
                        </div>
                      </div>
                      {showErrors && errors.bio ? (
                        <p className="text-xs font-semibold text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3"/> {errors.bio}</p>
                      ) : (
                        <p className="text-xs text-slate-500">Write at least 50 characters describing your teaching style.</p>
                      )}
                    </div>
                  </div>

                  <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
                    <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">Supporting Documents</h3>
                    
                    <DocumentLinkCard 
                      title="Curriculum Vitae (CV) - Optional" 
                      subtitle="Link your professional resume or portfolio." 
                      helperText="You can provide this later if unavailable now. PDF format preferred."
                      placeholder="https://drive.google.com/file/d/..."
                      icon={FileText} 
                      value={form.cv_url} 
                      onChange={(e: any) => updateField('cv_url', e.target.value)} 
                      hasError={showErrors && errors.cv_url} 
                      errorMessage={errors.cv_url} 
                    />

                    <DocumentLinkCard 
                      title="Government Identification - Optional" 
                      subtitle="Provide a link to your Citizenship, License, or Passport." 
                      helperText="You can provide this later if unavailable now. Information is encrypted."
                      placeholder="https://drive.google.com/file/d/..."
                      icon={IdCard} 
                      value={form.id_url} 
                      onChange={(e: any) => updateField('id_url', e.target.value)} 
                      hasError={showErrors && errors.id_url} 
                      errorMessage={errors.id_url} 
                    />
                  </div>
                </motion.div>
              )}

              {/* --- STEP 3: PREFERENCES --- */}
              {step === 3 && (
                <motion.div key="step3" custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }} className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">Teaching Preferences</h2>
                    <p className="text-slate-500 mt-1">Set your availability and pricing models.</p>
                  </div>

                  <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
                    <div>
                      <label className="text-sm font-bold text-slate-800 block mb-4">Preferred Teaching Mode</label>
                      <div className="grid gap-4 sm:grid-cols-3">
                        {TEACHING_MODES.map((mode) => {
                          const isActive = form.mode_of_teaching === mode.value;
                          return (
                            <button key={mode.value} type="button" onClick={() => updateField('mode_of_teaching', mode.value)} 
                              className={cn('relative rounded-2xl border p-5 text-left transition-all duration-200 overflow-hidden group', isActive ? 'border-blue-600 bg-blue-50/50 ring-4 ring-blue-50' : 'border-slate-200 bg-slate-50/30 hover:border-slate-300 hover:bg-slate-50')}>
                              <mode.icon className={cn("h-6 w-6 mb-3 transition-colors", isActive ? "text-blue-600" : "text-slate-400 group-hover:text-blue-500")} />
                              <h4 className="text-sm font-bold text-slate-900">{mode.label}</h4>
                              <p className="text-[10px] text-slate-500 mt-1 leading-tight">{mode.desc}</p>
                              {isActive && (
                                <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="absolute top-4 right-4 text-blue-600">
                                  <CheckCircle2 className="h-4 w-4" />
                                </motion.div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                      {showErrors && errors.mode_of_teaching && <p className="text-xs font-semibold text-red-500 flex items-center gap-1 mt-3"><AlertCircle className="w-3 h-3"/> {errors.mode_of_teaching}</p>}
                    </div>

                    <div className="pt-4 border-t border-slate-100">
                      <PremiumInput label="Standard Hourly Rate" helperText="To ensure quality standards, minimum rate is Rs. 200/hr." name="hour_rate" type="number" prefix="NPR" placeholder="E.g. 500" value={form.hour_rate} onChange={(e: any) => updateField('hour_rate', e.target.value)} icon={Banknote} hasError={showErrors && errors.hour_rate} errorMessage={errors.hour_rate} />
                    </div>
                  </div>

                  <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-5 flex gap-4 items-start">
                     <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5"/>
                     <p className="text-sm text-blue-900 font-medium leading-relaxed">
                       By submitting this application, you agree to our terms of service. You can continually update your profile and provide missing documents even after your initial submission.
                     </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Bottom Navigation */}
            <div className="fixed bottom-0 left-0 lg:left-[40%] w-full lg:w-[60%] bg-white/80 backdrop-blur-xl border-t border-slate-200 px-6 py-4 sm:py-5 z-40 pb-[calc(env(safe-area-inset-bottom)+1rem)]">
              <div className="max-w-2xl mx-auto w-full flex items-center justify-between">
                {step > 1 ? (
                  <button type="button" onClick={() => { navigateStep(step - 1); document.getElementById('form-top')?.scrollIntoView({ behavior: 'smooth' }); }} className="font-bold text-slate-500 hover:text-slate-900 text-sm flex items-center gap-1 transition-colors px-4 py-2 rounded-xl hover:bg-slate-100">
                    <ChevronLeft className="h-4 w-4"/> Back
                  </button>
                ) : <div/>}
                
                {step < 3 ? (
                  <button type="button" onClick={goNext} className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm py-3.5 px-6 rounded-xl transition-all flex items-center gap-2 group shadow-sm">
                    Continue Registration <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform"/>
                  </button>
                ) : (
                  <button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm py-3.5 px-8 rounded-xl disabled:opacity-70 transition-all flex items-center gap-2 shadow-sm">
                    {loading ? <><Loader2 className="h-4 w-4 animate-spin"/> Processing...</> : <><CheckCircle2 className="h-4 w-4"/> Submit Application</>}
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