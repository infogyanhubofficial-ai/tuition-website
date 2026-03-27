'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
// FIX: Use the new secure SSR-compatible client
import { createClient } from '@/lib/supabase/client';
import { motion, AnimatePresence, useAnimation, useInView } from 'framer-motion';
import {
  BookOpen, Check, ChevronRight, ChevronLeft, Clock3, GraduationCap,
  Laptop, MapPin, Phone, School, ShieldCheck, Sparkles, User,
  Users, Wallet, X, BadgeCheck, Home, AlertCircle, FileText, Lock, Search, Zap, Target
} from 'lucide-react';

// --- TYPES ---
type FormState = {
  contact_name: string;
  contact_number: string;
  email: string; // ADDED
  subjects: string[];
  location: string;
  chowk: string;
  landmark: string;
  class_level: string;
  description: string;
  salary_min: number;
  salary_max: number;
  tuition_type: string;
  student_gender_pref: string;
  status: boolean; 
  urgent: boolean; // ADDED
  class_time: string;
  duration: string;
  days_a_week: string[];
};

type TutorLite = {
  id: number | string;
  name?: string | null;
  subject?: string | null;
  location?: string | null;
  verified?: boolean | null;
};

// --- CONSTANTS ---
const CITIES = ['Kathmandu', 'Lalitpur', 'Bhaktapur', 'Pokhara', 'Chitwan', 'Biratnagar', 'Birgunj', 'Dharan', 'Butwal', 'Hetauda', 'Other'];
const SUBJECT_OPTIONS = ['Mathematics', 'Science', 'Physics', 'Chemistry', 'Biology', 'English', 'Nepali', 'Accountancy', 'Economics', 'Computer Science', 'IELTS', 'SAT Math', 'AutoCAD', 'Excel', 'Social Studies', 'Civil Engineering', 'Literature', 'Zoology'];
const CLASS_OPTIONS = ['Grade 1 - 5', 'Grade 6 - 8', 'SEE / Grade 9 - 10', '+2 / NEB', 'Bachelor Level', 'Entrance Preparation', 'Skill / Software Training'];
const TIME_OPTIONS = [
  { label: 'Morning', nepali: 'बिहान', value: 'Morning', hint: '6 AM - 11 AM' },
  { label: 'Afternoon', nepali: 'दिउँसो', value: 'Afternoon', hint: '12 PM - 4 PM' },
  { label: 'Evening', nepali: 'साँझ', value: 'Evening', hint: '5 PM - 9 PM' },
];
const DURATION_OPTIONS = [{ label: '1 hour', nepali: '१ घण्टा' }, { label: '1.5 hour', nepali: '१.५ घण्टा' }, { label: '2 hour', nepali: '२ घण्टा' }];
const DAY_OPTIONS = [
  { short: 'S', full: 'Sun', nepali: 'आइत' }, { short: 'M', full: 'Mon', nepali: 'सोम' }, { short: 'T', full: 'Tue', nepali: 'मंगल' },
  { short: 'W', full: 'Wed', nepali: 'बुध' }, { short: 'T', full: 'Thu', nepali: 'बिही' }, { short: 'F', full: 'Fri', nepali: 'शुक्र' }, { short: 'S', full: 'Sat', nepali: 'शनि' },
];
const DESCRIPTION_HINTS = ['e.g. My child is struggling with Algebra...', 'e.g. Need exam-focused Science prep...', 'e.g. Seeking an experienced +2 Accountancy tutor...'];

// --- UTILS ---
function cn(...classes: Array<string | false | null | undefined>) { return classes.filter(Boolean).join(' '); }
function normalizeSubjectString(subject?: any) {
  if (!subject) return [];
  if (Array.isArray(subject)) return subject.map((s) => String(s).trim().toLowerCase()).filter(Boolean);
  return String(subject).split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
}

// --- NEW/UPDATED UI COMPONENTS ---

function AnimatedCounter({ value }: { value: number }) {
  const [displayValue, setDisplayValue] = useState(0);
  useEffect(() => {
    let start = displayValue;
    const end = value;
    if (start === end) return;
    const duration = 500;
    const incrementTime = Math.max(10, duration / Math.abs(end - start));
    const timer = setInterval(() => {
      start += start < end ? 1 : -1;
      setDisplayValue(start);
      if (start === end) clearInterval(timer);
    }, incrementTime);
    return () => clearInterval(timer);
  }, [value, displayValue]);
  return <span>{displayValue}</span>;
}

function MatchTrackerCard({ count, loading, location, subjectSelected }: { count: number, loading: boolean, location: string, subjectSelected: boolean }) {
  return (
    <div className="relative overflow-hidden rounded-[32px] bg-slate-950 p-6 shadow-2xl border border-slate-800 group shrink-0">
      <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-emerald-600/20 blur-[80px] group-hover:bg-emerald-500/30 transition-colors" />
      <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-teal-600/20 blur-[80px] group-hover:bg-teal-500/30 transition-colors" />
      
      <div className="relative z-10">
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400">Live Match Tracker</h3>
          <div className="flex items-center gap-2 rounded-full bg-emerald-500/10 px-2.5 py-1 border border-emerald-500/20">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
            </span>
            <span className="text-[10px] font-bold text-emerald-500 uppercase">Live</span>
          </div>
        </div>

        <div className="mb-2 flex items-baseline gap-3">
          <span className={cn("text-5xl font-black tracking-tighter transition-all duration-300", count > 0 ? "text-white" : "text-slate-600")}>
            {loading ? <span className="opacity-20">...</span> : <AnimatedCounter value={count} />}
          </span>
          <div className="flex flex-col">
             <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Available</span>
             <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tutors</span>
          </div>
        </div>

        {/* Skeleton State vs Real State */}
        <div className="mt-6 space-y-3 pt-6 border-t border-slate-800/50 min-h-[80px]">
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                <div className="flex items-center gap-3"><div className="w-5 h-5 rounded bg-slate-800 animate-pulse"/><div className="h-3 w-24 bg-slate-800 rounded animate-pulse"/></div>
                <div className="flex items-center gap-3"><div className="w-5 h-5 rounded bg-slate-800 animate-pulse"/><div className="h-3 w-32 bg-slate-800 rounded animate-pulse"/></div>
              </motion.div>
            ) : (
              <motion.div key="loaded" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3 text-xs font-medium">
                <div className="flex items-center gap-3">
                   <div className="p-1.5 rounded-md bg-white/5"><MapPin className={cn("h-3.5 w-3.5", location ? "text-emerald-400" : "text-slate-600")} /></div>
                   <span className={location ? "text-slate-300" : "text-slate-600"}>{location ? `In ${location}` : 'No location selected'}</span>
                </div>
                <div className="flex items-center gap-3">
                   <div className="p-1.5 rounded-md bg-white/5"><Search className={cn("h-3.5 w-3.5", subjectSelected ? "text-emerald-400" : "text-slate-600")} /></div>
                   <span className={subjectSelected ? "text-slate-300" : "text-slate-600"}>{subjectSelected ? 'Matched for your subjects' : 'Select subjects to match'}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function LivePreviewCard({ form }: { form: FormState }) {
  return (
    <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm relative overflow-hidden shrink-0">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-teal-500"></div>
      <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4">Vacancy Preview</h3>
      
      <div className="space-y-4">
        <div>
          <h4 className="font-black text-slate-900 text-lg leading-tight">
            {form.class_level ? `${form.class_level} Tutor Needed` : 'Tutor Requirement'}
          </h4>
          <p className="text-xs font-bold text-slate-500 mt-1 flex items-center gap-1">
            <MapPin className="h-3 w-3" /> {form.location || 'Location Pending'} {form.chowk ? `, ${form.chowk}` : ''}
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {form.subjects.length > 0 ? form.subjects.slice(0, 3).map((s) => (
            <span key={s} className="text-[10px] font-bold bg-emerald-50 text-emerald-600 px-2 py-1 rounded-md border border-emerald-100">{s}</span>
          )) : <span className="text-[10px] font-bold bg-slate-50 text-slate-400 px-2 py-1 rounded-md border border-slate-100">Subjects...</span>}
          {form.subjects.length > 3 && <span className="text-[10px] font-bold bg-slate-50 text-slate-500 px-2 py-1 rounded-md">+{form.subjects.length - 3} more</span>}
        </div>

        <div className="grid grid-cols-2 gap-2 pt-4 border-t border-slate-100 text-xs">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Budget</span>
            <span className="font-bold text-slate-900">Rs. {form.salary_min/1000}k - {form.salary_max/1000}k</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Mode</span>
            <span className="font-bold text-slate-900">{form.tuition_type || 'Any Mode'}</span>
          </div>
          <div className="flex flex-col gap-1 mt-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Schedule</span>
            <span className="font-bold text-slate-900">{form.days_a_week.length > 0 ? `${form.days_a_week.length} Days/wk` : 'Flexible'}</span>
          </div>
          <div className="flex flex-col gap-1 mt-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Timing</span>
            <span className="font-bold text-slate-900">{form.class_time || 'Any Time'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function FloatingInput({ label, name, value, onChange, type = 'text', hasError = false, errorMessage, placeholder }: any) {
  const hasValue = String(value || '').length > 0;
  return (
    <div className="relative w-full group">
      <input
        type={type} name={name} value={value} onChange={onChange} placeholder={placeholder || ' '}
        className={cn(
          'peer h-14 w-full rounded-2xl border bg-white/50 backdrop-blur-sm px-4 pt-5 text-sm text-slate-900 outline-none transition-all duration-300',
          hasError ? 'border-red-400 focus:shadow-[0_0_15px_rgba(248,113,113,0.3)]' :
          hasValue ? 'border-teal-300 focus:border-emerald-500 focus:shadow-[0_0_15px_rgba(16,185,129,0.2)]' :
          'border-slate-200 focus:border-emerald-500 focus:shadow-[0_0_15px_rgba(16,185,129,0.2)]',
          placeholder ? 'placeholder:text-slate-400 pt-0' : ''
        )}
      />
      {!placeholder && (
        <label className={cn("pointer-events-none absolute left-4 transition-all px-1 rounded-lg",
          hasValue ? "top-0 -translate-y-1/2 text-[11px] font-bold text-emerald-600 bg-white" : "top-1/2 -translate-y-1/2 text-sm text-slate-500 bg-transparent",
          "peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:text-[11px] font-bold peer-focus:text-emerald-600 peer-focus:bg-white"
        )}> {label} </label>
      )}
      {hasValue && !hasError && (
        <motion.span initial={{scale:0}} animate={{scale:1}} className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-teal-50 p-1 text-teal-600">
          <Check className="h-4 w-4" />
        </motion.span>
      )}
      {hasError && <p className="mt-1.5 text-[11px] font-bold text-red-500 flex items-center gap-1"><AlertCircle className="h-3 w-3"/> {errorMessage}</p>}
    </div>
  );
}

function DualRangeSlider({ min, max, value, onChange }: { min: number, max: number, value: [number, number], onChange: (val: [number, number]) => void }) {
  const [minVal, setMinVal] = useState(value[0]);
  const [maxVal, setMaxVal] = useState(value[1]);
  useEffect(() => { setMinVal(value[0]); setMaxVal(value[1]); }, [value]);
  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => { const val = Math.min(Number(e.target.value), maxVal - 500); setMinVal(val); onChange([val, maxVal]); };
  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => { const val = Math.max(Number(e.target.value), minVal + 500); setMaxVal(val); onChange([minVal, val]); };
  const minPercent = ((minVal - min) / (max - min)) * 100;
  const maxPercent = ((maxVal - min) / (max - min)) * 100;
  
  return (
    <div className="relative w-full pt-8 pb-4">
      {/* Floating Bubbles */}
      <div className="absolute top-0 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg shadow-lg transition-all" style={{ left: `${minPercent}%` }}>
        Rs.{minVal}
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900 rotate-45"></div>
      </div>
      <div className="absolute top-0 -translate-x-1/2 bg-emerald-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg shadow-lg transition-all" style={{ left: `${maxPercent}%` }}>
        Rs.{maxVal}
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-emerald-600 rotate-45"></div>
      </div>

      <div className="absolute h-2.5 w-full rounded-full bg-slate-200 top-1/2 -translate-y-1/2 pointer-events-none"></div>
      <div className="absolute h-2.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 top-1/2 -translate-y-1/2 pointer-events-none shadow-[0_0_10px_rgba(16,185,129,0.4)]" style={{ left: `${minPercent}%`, width: `${maxPercent - minPercent}%` }}></div>
      <input type="range" min={min} max={max} step={500} value={minVal} onChange={handleMinChange} className="absolute w-full appearance-none bg-transparent pointer-events-none top-1/2 -translate-y-1/2 z-20" />
      <input type="range" min={min} max={max} step={500} value={maxVal} onChange={handleMaxChange} className="absolute w-full appearance-none bg-transparent pointer-events-none top-1/2 -translate-y-1/2 z-30" />
      <style jsx>{`
        input[type=range]::-webkit-slider-thumb { pointer-events: auto; appearance: none; width: 28px; height: 28px; background: white; border: 3px solid #10b981; border-radius: 50%; cursor: grab; box-shadow: 0 4px 10px rgba(0,0,0,0.15); transition: transform 0.1s; }
        input[type=range]::-webkit-slider-thumb:active { transform: scale(1.1); cursor: grabbing; border-color: #0f766e; }
        input[type=range]::-moz-range-thumb { pointer-events: auto; appearance: none; width: 28px; height: 28px; background: white; border: 3px solid #10b981; border-radius: 50%; cursor: grab; box-shadow: 0 4px 10px rgba(0,0,0,0.15); transition: transform 0.1s; }
        input[type=range]::-moz-range-thumb:active { transform: scale(1.1); cursor: grabbing; border-color: #0f766e; }
      `}</style>
    </div>
  );
}

function SectionTitle({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string; }) {
  return (
    <div className="mb-8 relative z-10">
      <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-100 text-emerald-700 shadow-inner border border-white relative overflow-hidden">
         <div className="absolute inset-0 bg-emerald-400/10 mix-blend-multiply"></div>
         {icon}
      </div>
      <h2 className="text-2xl font-black tracking-tight text-slate-900">{title}</h2>
      <p className="mt-1 text-sm font-medium text-slate-500">{subtitle}</p>
    </div>
  );
}

function OptionCard({ title, subtitle, selected, onClick, icon }: { title: string; subtitle?: string; selected: boolean; onClick: () => void; icon?: React.ReactNode; }) {
  return (
    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="button" onClick={onClick} 
      className={cn('relative overflow-hidden rounded-[20px] p-4 text-left transition-all duration-300 border-2', 
      selected ? 'border-emerald-600 bg-gradient-to-br from-emerald-50 to-teal-50 shadow-[inset_0_0_20px_rgba(16,185,129,0.1)]' : 'border-transparent bg-white shadow-sm hover:shadow-md hover:border-emerald-200')}>
      <div className="flex items-start gap-3 relative z-10">
        {icon && <div className={cn("mt-0.5 transition-colors duration-300", selected ? "text-emerald-700" : "text-slate-400")}>{icon}</div>}
        <div>
          <p className={cn("font-bold transition-colors duration-300", selected ? "text-emerald-900" : "text-slate-700")}>{title}</p>
          {subtitle && <p className="mt-1 text-[11px] font-medium text-slate-500">{subtitle}</p>}
        </div>
      </div>
      <AnimatePresence>
        {selected && (
          <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }} className="absolute top-3 right-3 text-emerald-600">
            <Check className="h-5 w-5" />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

function DayButton({ short, nepali, selected, onClick, title }: { short: string; nepali: string; selected: boolean; onClick: () => void; title: string; }) {
  return (
    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} type="button" onClick={onClick} title={title} 
      className={cn('relative flex h-14 w-14 flex-col items-center justify-center rounded-[18px] border-2 text-xs font-bold transition-colors duration-300 overflow-hidden', 
      selected ? 'border-emerald-600 bg-emerald-600 text-white shadow-md' : 'border-transparent bg-white text-slate-700 hover:border-emerald-200 shadow-sm')}>
      <span className="relative z-10">{short}</span>
      <span className="text-[10px] font-medium opacity-80 relative z-10">{nepali}</span>
      {selected && <div className="absolute inset-0 bg-white/20 mix-blend-overlay"></div>}
    </motion.button>
  );
}

function ParticleBurst() {
  return (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
      {[...Array(12)].map((_, i) => {
        const angle = (i * 30) * (Math.PI / 180);
        const radius = 80;
        return (
          <motion.div
            key={i}
            initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
            animate={{ x: Math.cos(angle) * radius, y: Math.sin(angle) * radius, scale: [0, 1, 0], opacity: [1, 1, 0] }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className={cn("absolute w-2 h-2 rounded-full", i % 2 === 0 ? "bg-emerald-400" : i % 3 === 0 ? "bg-teal-400" : "bg-amber-400")}
          />
        );
      })}
    </div>
  );
}

// --- MAIN PAGE ---
export default function PostTuitionPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [user, setUser] = useState<any>(null); 
  const [authLoading, setAuthLoading] = useState(true); 
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [subjectQuery, setSubjectQuery] = useState('');
  const [hintIndex, setHintIndex] = useState(0);
  const [matchedTutors, setMatchedTutors] = useState<TutorLite[]>([]);
  const [matchLoading, setMatchLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showMobileSummary, setShowMobileSummary] = useState(false);

  // FIX: Initialize the secure SSR client
  const supabase = createClient();

  const [form, setForm] = useState<FormState>({
    contact_name: '', contact_number: '', email: '', subjects: [], location: '', chowk: '', landmark: '', class_level: '', description: '', salary_min: 10000, salary_max: 15000, tuition_type: 'Home Tuition', student_gender_pref: 'No Preference', 
    status: false, urgent: false, // ADDED URGENT
    class_time: '', duration: '', days_a_week: [],
  });

  useEffect(() => {
    setIsMounted(true);
    const checkUser = async () => {
      // FIX: Use getUser() for strict server cookie validation
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user ?? null);
      if (user?.email && !form.email) {
        setForm(prev => ({ ...prev, email: user.email as string }));
      }
      setAuthLoading(false);
    };
    checkUser();
    
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user?.email && !form.email) {
        setForm(prev => ({ ...prev, email: session.user.email as string }));
      }
    });
    
    return () => authListener.subscription.unsubscribe();
  }, [form.email, supabase]); // Added supabase to dependency array

  useEffect(() => {
    if (isMounted) {
      const draft = localStorage.getItem('gyanhub_tuition_draft');
      if (draft) { try { setForm(prev => ({ ...prev, ...JSON.parse(draft) })); } catch (e) {} }
    }
  }, [isMounted]);

  useEffect(() => {
    if (isMounted && !submitted) { localStorage.setItem('gyanhub_tuition_draft', JSON.stringify(form)); }
  }, [form, isMounted, submitted]);

  useEffect(() => {
    const timer = setInterval(() => setHintIndex((p) => (p + 1) % DESCRIPTION_HINTS.length), 3000);
    return () => clearInterval(timer);
  }, []);

  const isValidPhone = /^(98|97)\d{8}$/.test(form.contact_number);
  const isValidEmail = /^\S+@\S+\.\S+$/.test(form.email);
  const isDescValid = (form.description || '').trim().length >= 30;
  
  const errors = {
    name: (form.contact_name || '').trim() === '' ? 'Name is required' : '',
    phone: !isValidPhone ? 'Enter a valid 10-digit Nepali number' : '',
    email: !isValidEmail ? 'Enter a valid email address' : '',
    subjects: form.subjects.length === 0 ? 'Select at least one subject' : '',
    location: form.location === '' ? 'Select a City / Area' : '',
    classLevel: form.class_level === '' ? 'Select class level' : '',
    time: form.class_time === '' ? 'Select preferred time' : '',
    duration: form.duration === '' ? 'Select duration' : '',
    days: form.days_a_week.length === 0 ? 'Select at least one day' : '',
    desc: !isDescValid ? 'Description must be at least 30 characters' : '',
    terms: !termsAccepted ? 'You must accept the terms' : ''
  };

  const step1Valid = !errors.name && !errors.phone && !errors.email && !errors.subjects && !errors.location && !errors.classLevel;
  const step2Valid = !errors.time && !errors.duration && !errors.days;
  const step3Valid = !errors.desc && !errors.terms;

  useEffect(() => {
    if (form.subjects.length === 0) { setMatchedTutors([]); return; }
    setMatchLoading(true);
    
    const fetchMatches = async () => {
      let query = supabase.from('tutors').select('id, name, subject, location, verified');
      
      // Initial DB level optimization (starts with the city)
      if (form.location && form.tuition_type !== 'Online Class') {
        query = query.ilike('location', `${form.location}%`);
      }
      
      const { data } = await query;
      if (data) {
        const subjectSet = new Set(form.subjects.map(s => s.toLowerCase()));
        const formCity = form.location.trim().toLowerCase();
        
        const matches = (data as TutorLite[]).filter((t) => {
          // 1. Check Subjects
          const tutorSubjects = normalizeSubjectString(t.subject);
          const hasSubject = tutorSubjects.some(s => subjectSet.has(s));

          // 2. Exact match check against the "City" (first element of comma-separated string)
          let hasLocation = true;
          if (form.location && form.tuition_type !== 'Online Class') {
             const tutorCity = (t.location || '').split(',')[0].trim().toLowerCase();
             hasLocation = tutorCity === formCity;
          }

          return hasSubject && hasLocation;
        }).sort((a, b) => Number(Boolean(b.verified)) - Number(Boolean(a.verified)));
        
        setMatchedTutors(matches);
      }
      setMatchLoading(false);
    };
    const timeoutId = setTimeout(fetchMatches, 400);
    return () => clearTimeout(timeoutId);
  }, [form.subjects, form.location, form.tuition_type, supabase]); // Added supabase

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm(p => ({ ...p, [e.target.name]: e.target.value }));
    setShowErrors(false);
  };

  const handleSubjectKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const clean = subjectQuery.trim();
      if (clean && !form.subjects.includes(clean)) { setForm(p => ({ ...p, subjects: [...p.subjects, clean] })); setSubjectQuery(''); }
    }
  };

  const goNext = () => {
    setShowErrors(true);
    if (step === 1 && step1Valid) { setStep(2); setShowErrors(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }
    if (step === 2 && step2Valid) { setStep(3); setShowErrors(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return alert("Please sign in to post a requirement.");
    setShowErrors(true);
    if (!step1Valid || !step2Valid || !step3Valid) return;
    setLoading(true);
    
    const fullLocation = [form.location, form.chowk?.trim(), form.landmark?.trim() ? `Near ${form.landmark.trim()}` : ''].filter(Boolean).join(', ');
    
    const { error } = await supabase.from('vacancies').insert([{
      user_id: user.id, 
      contact_name: form.contact_name, 
      contact_number: form.contact_number, 
      email: form.email, // ADDED TO FILL DB
      subject: form.subjects.join(', '), 
      location: fullLocation, 
      class_level: form.class_level, 
      description: form.description, 
      salary_range: `Rs. ${form.salary_min} - Rs. ${form.salary_max}`, 
      tuition_type: form.tuition_type, 
      student_gender_pref: form.student_gender_pref, 
      status: false, 
      urgent: form.urgent, // ADDED TO FILL DB
      class_time: `${form.class_time} - ${form.duration}`, 
      days_a_week: form.days_a_week.join(', '),
    }]);

    setLoading(false);
    
    if (!error) { 
      setSubmitted(true); 
      localStorage.removeItem('gyanhub_tuition_draft'); 
      window.scrollTo(0,0); 
    } else { 
      console.error(error);
      setMessage('Error posting requirement. Please try again.'); 
    }
  };

  if (!isMounted || authLoading) return null;

  if (!user) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 bg-slate-50">
        <div className="max-w-md w-full bg-white rounded-[40px] p-10 shadow-xl border border-slate-100 text-center">
          <div className="mx-auto w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-6"><Lock className="h-8 w-8" /></div>
          <h2 className="text-2xl font-black text-slate-900 mb-2">Sign In Required</h2>
          <p className="text-slate-500 mb-8 font-medium">To maintain the safety of our tutors and students, you must be logged in to post a tuition requirement.</p>
          <div className="space-y-4">
            <Link href="/login?redirect=/post-tuition" className="block w-full bg-emerald-600 text-white font-bold py-4 rounded-2xl hover:bg-emerald-700 transition shadow-[0_10px_20px_rgba(16,185,129,0.3)] hover:-translate-y-1">Sign In to Continue</Link>
            <Link href="/" className="block w-full text-slate-500 font-bold py-2 hover:text-slate-900 transition">Back to Home</Link>
          </div>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 flex items-center justify-center">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="max-w-3xl w-full bg-white rounded-[40px] p-8 sm:p-12 text-center shadow-2xl border border-slate-100">
          <div className="relative mx-auto flex h-28 w-28 items-center justify-center rounded-full bg-emerald-50 text-emerald-500 mb-8 border-4 border-emerald-100">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.2 }}><Check className="h-14 w-14" /></motion.div>
            <ParticleBurst />
          </div>
          <h1 className="text-3xl font-black text-slate-900 mb-2">Requirement Posted Successfully!</h1>
          <p className="text-slate-500 font-medium text-lg">Your request is now visible to our network of verified tutors.</p>
          
          <div className="mt-12 bg-slate-50 rounded-[32px] p-6 sm:p-10 border border-slate-100 text-left">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-8 text-center">What Happens Next?</h3>
            <div className="flex flex-col sm:flex-row justify-between items-center gap-6 relative">
               <div className="hidden sm:block absolute top-6 left-0 w-full h-1 bg-gradient-to-r from-teal-200 to-emerald-200 z-0 rounded-full"></div>
               {[{ step: 1, title: 'Review Process', desc: 'We verify your request instantly.' }, { step: 2, title: 'Tutors Apply', desc: 'Matched tutors express interest.' }, { step: 3, title: 'Demo Scheduled', desc: 'We connect you for a free demo.' }].map((s, i) => (
                 <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 + (i * 0.1) }} key={i} className="relative z-10 flex flex-col items-center text-center bg-slate-50 px-4 w-full sm:w-1/3">
                   <div className="h-12 w-12 rounded-2xl bg-white text-emerald-600 flex items-center justify-center font-black text-lg mb-4 shadow-md border border-slate-100">{s.step}</div>
                   <h4 className="font-bold text-slate-900 mb-1">{s.title}</h4>
                   <p className="text-xs font-medium text-slate-500">{s.desc}</p>
                 </motion.div>
               ))}
            </div>
          </div>
          <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
            <Link href={`/tutors?subjects=${form.subjects.join(',')}&location=${form.location}`} className="bg-emerald-600 text-white font-bold py-4 px-8 rounded-2xl hover:bg-emerald-700 transition active:scale-95 shadow-[0_10px_20px_rgba(16,185,129,0.3)] flex items-center justify-center gap-2">View Matched Tutors <ChevronRight className="h-4 w-4"/></Link>
            <button onClick={() => window.location.reload()} className="bg-white text-slate-700 font-bold py-4 px-8 rounded-2xl hover:bg-slate-50 transition border border-slate-200 active:scale-95 shadow-sm">Post Another</button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 relative overflow-hidden">
      {/* Context-Aware Dynamic Background */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <motion.div animate={{ backgroundColor: step === 1 ? '#34d399' : step === 2 ? '#14b8a6' : '#10b981' }} className="absolute -top-64 -left-64 w-[600px] h-[600px] rounded-full mix-blend-multiply filter blur-[150px] opacity-20 transition-colors duration-1000"></motion.div>
        <motion.div animate={{ backgroundColor: step === 1 ? '#14b8a6' : step === 2 ? '#10b981' : '#34d399' }} className="absolute top-1/2 right-[-200px] w-[500px] h-[500px] rounded-full mix-blend-multiply filter blur-[150px] opacity-20 transition-colors duration-1000"></motion.div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 sm:py-12 sm:px-6 lg:px-8 relative z-10">
        <div className="mb-12 text-center lg:text-left">
          <span className="inline-flex rounded-full bg-emerald-100/80 backdrop-blur-sm border border-emerald-200 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-700 mb-6 shadow-sm">GyanHub Tuition Network</span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.1]">
              उत्कृष्ट शिक्षक खोज्नुहोस् <br className="hidden sm:block" />
              <span className="text-emerald-600">Find Your Perfect Tutor</span>
          </h1>
          <p className="mt-5 text-slate-600 font-medium text-lg max-w-2xl lg:mx-0 mx-auto">Post your requirement in 3 simple steps to connect with Nepal's top verified educators.</p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_380px] items-start">
          
          {/* Main Form Area */}
          <div className="bg-white/70 backdrop-blur-xl rounded-[40px] shadow-xl shadow-slate-200/50 border border-white p-6 sm:p-10 lg:p-12 relative overflow-hidden">
            
            {/* "Breadcrumb" Progress Bar */}
            <div className="mb-12 relative">
              <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-200 -translate-y-1/2 z-0 rounded-full"></div>
              <motion.div className="absolute top-1/2 left-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500 -translate-y-1/2 z-0 rounded-full" 
                initial={{ width: '0%' }} animate={{ width: `${((step - 1) / 2) * 100}%` }} transition={{ duration: 0.5, ease: "easeInOut" }} />
              
              <div className="flex justify-between items-center relative z-10 px-2">
                {[
                  { num: 1, label: 'Basics' },
                  { num: 2, label: 'Preferences' },
                  { num: 3, label: 'Details' }
                ].map((s) => {
                  const isActive = step === s.num;
                  const isDone = step > s.num;
                  return (
                    <div key={s.num} className="flex flex-col items-center">
                      <motion.div animate={isActive ? { scale: 1.1 } : { scale: 1 }}
                        className={cn("h-10 w-10 rounded-xl flex items-center justify-center font-black text-sm transition-all duration-300 shadow-sm", 
                        isActive ? "bg-white border-2 border-emerald-500 text-emerald-600 shadow-[0_0_20px_rgba(16,185,129,0.3)]" : 
                        isDone ? "bg-emerald-500 border-2 border-emerald-500 text-white" : "bg-slate-100 border-2 border-slate-200 text-slate-400")}>
                        {isDone ? <Check className="h-5 w-5"/> : s.num}
                      </motion.div>
                      <span className={cn("absolute -bottom-6 text-[10px] font-bold uppercase tracking-widest transition-colors", isActive ? "text-emerald-600" : isDone ? "text-slate-900" : "text-slate-400")}>{s.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8 mt-4">
              <AnimatePresence mode="wait">
                {step === 1 && (
                  <motion.div key="step1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.3 }}>
                    <SectionTitle icon={<User className="h-6 w-6 opacity-80"/>} title="Student Details" subtitle="Who is the learner and where are they located?" />
                    
                    <div className="grid sm:grid-cols-3 gap-6 mb-6">
                      <FloatingInput label="Student / Parent Name" name="contact_name" value={form.contact_name} onChange={handleInputChange} hasError={showErrors && errors.name} errorMessage={errors.name} />
                      <FloatingInput label="Phone Number" name="contact_number" type="tel" value={form.contact_number} onChange={handleInputChange} hasError={showErrors && errors.phone} errorMessage={errors.phone} />
                      <FloatingInput label="Email Address" name="email" type="email" value={form.email} onChange={handleInputChange} hasError={showErrors && errors.email} errorMessage={errors.email} />
                    </div>
                    
                    <div className="grid sm:grid-cols-2 gap-6 mb-6">
                      <div className="relative group">
                        <select name="location" value={form.location} onChange={handleInputChange} 
                          className={cn("w-full h-14 rounded-2xl border bg-white/50 backdrop-blur-sm px-4 text-sm font-bold outline-none transition-all duration-300 appearance-none", 
                          showErrors && errors.location ? "border-red-400 focus:shadow-[0_0_15px_rgba(248,113,113,0.3)]" : form.location ? "border-teal-300 focus:border-emerald-500" : "border-slate-200 focus:border-emerald-500 focus:shadow-[0_0_15px_rgba(16,185,129,0.2)]")}>
                          <option value="" disabled>Select City / Area *</option>
                          {CITIES.map(city => <option key={city} value={city}>{city}</option>)}
                        </select>
                      </div>
                      <div className="relative group">
                        <select name="class_level" value={form.class_level} onChange={handleInputChange} 
                          className={cn("w-full h-14 rounded-2xl border bg-white/50 backdrop-blur-sm px-4 text-sm font-bold outline-none transition-all duration-300 appearance-none", 
                          showErrors && errors.classLevel ? "border-red-400 focus:shadow-[0_0_15px_rgba(248,113,113,0.3)]" : form.class_level ? "border-teal-300 focus:border-emerald-500" : "border-slate-200 focus:border-emerald-500 focus:shadow-[0_0_15px_rgba(16,185,129,0.2)]")}>
                          <option value="" disabled>Select Class Level *</option>
                          {CLASS_OPTIONS.map(lvl => <option key={lvl} value={lvl}>{lvl}</option>)}
                        </select>
                      </div>
                    </div>
                    
                    <div className="mb-8 bg-white/40 backdrop-blur-sm p-6 rounded-[24px] border border-white/60 shadow-sm">
                      <label className="font-bold text-slate-900 mb-4 block text-sm">Chowk Name & Nearest Landmark</label>
                      <div className="grid sm:grid-cols-2 gap-6">
                        <FloatingInput label="Chowk Name (Optional)" name="chowk" value={form.chowk} onChange={handleInputChange} placeholder="e.g. Baneshwor Chowk" />
                        <FloatingInput label="Nearest Landmark" name="landmark" value={form.landmark} onChange={handleInputChange} placeholder="e.g. Everest Bank" />
                      </div>
                    </div>
                    
                    <div className={cn("bg-white/40 backdrop-blur-sm p-6 rounded-[24px] border shadow-sm transition-colors", showErrors && errors.subjects ? "border-red-300" : "border-white/60")}>
                      <label className="font-bold text-slate-900 mb-3 block text-sm">Which subjects do you need help with?</label>
                      <div className="flex gap-2 mb-4 bg-white p-1.5 rounded-2xl shadow-inner border border-slate-100">
                        <Search className="h-5 w-5 text-slate-400 ml-3 mt-3.5 absolute pointer-events-none"/>
                        <input type="text" value={subjectQuery} onChange={(e)=>setSubjectQuery(e.target.value)} onKeyDown={handleSubjectKeyDown} placeholder="Type subject and press Enter..." className="flex-1 h-12 pl-10 pr-4 rounded-xl bg-transparent text-sm font-bold outline-none" />
                        <button type="button" onClick={() => { if(subjectQuery) { setForm(p=>({...p, subjects:[...p.subjects, subjectQuery]})); setSubjectQuery(''); }}} className="bg-slate-900 text-white px-5 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-slate-800 transition shadow-md">Add</button>
                      </div>
                      
                      <div className="flex flex-wrap gap-2 mb-5 min-h-[32px]">
                        <AnimatePresence>
                          {form.subjects.map(sub => (
                            <motion.span layout initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} key={sub} className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-2 shadow-sm">
                              {sub} <X className="h-3 w-3 cursor-pointer hover:text-white/70 transition-colors" onClick={()=>setForm(p=>({...p, subjects: p.subjects.filter(s=>s!==sub)}))} />
                            </motion.span>
                          ))}
                        </AnimatePresence>
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                        {SUBJECT_OPTIONS.filter(s => !form.subjects.includes(s) && s.toLowerCase().includes(subjectQuery.toLowerCase())).slice(0, 10).map(sub => (
                          <button key={sub} type="button" onClick={()=>setForm(p=>({...p, subjects:[...p.subjects, sub]}))} className="bg-white border border-slate-200 text-slate-600 text-[11px] font-bold px-3 py-1.5 rounded-lg hover:border-emerald-300 hover:text-emerald-600 hover:shadow-sm transition-all">+ {sub}</button>
                        ))}
                      </div>
                      {showErrors && errors.subjects && <p className="mt-3 text-[11px] font-bold text-red-500 flex items-center gap-1"><AlertCircle className="h-3 w-3"/> {errors.subjects}</p>}
                    </div>
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div key="step2" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.3 }}>
                    <SectionTitle icon={<Clock3 className="h-6 w-6 opacity-80"/>} title="Schedule & Budget" subtitle="Set your preferred timings, mode, and budget." />
                    
                    <div className="mb-8">
                      <label className="font-bold text-slate-900 mb-3 block text-sm">Preferred Time</label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {TIME_OPTIONS.map(opt => <OptionCard key={opt.value} title={opt.label} subtitle={opt.nepali} selected={form.class_time === opt.value} onClick={()=>setForm(p=>({...p, class_time: opt.value}))} icon={<Clock3 className="h-4 w-4"/>} />)}
                      </div>
                      {showErrors && errors.time && <p className="mt-2 text-[11px] font-bold text-red-500 flex items-center gap-1"><AlertCircle className="h-3 w-3"/> {errors.time}</p>}
                    </div>
                    
                    <div className="mb-8">
                      <label className="font-bold text-slate-900 mb-3 block text-sm">Duration per class</label>
                      <div className="grid grid-cols-3 gap-3">
                        {DURATION_OPTIONS.map(opt => <OptionCard key={opt.label} title={opt.label} subtitle={opt.nepali} selected={form.duration === opt.label} onClick={()=>setForm(p=>({...p, duration: opt.label}))} />)}
                      </div>
                      {showErrors && errors.duration && <p className="mt-2 text-[11px] font-bold text-red-500 flex items-center gap-1"><AlertCircle className="h-3 w-3"/> {errors.duration}</p>}
                    </div>
                    
                    <div className="mb-8 bg-white/40 backdrop-blur-sm rounded-[24px] p-6 border border-white/60 shadow-sm">
                      <label className="font-bold text-slate-900 mb-4 block text-sm">Days per week</label>
                      <div className="flex flex-wrap gap-2.5">
                        {DAY_OPTIONS.map(day => <DayButton key={day.full} title={day.full} short={day.short} nepali={day.nepali} selected={form.days_a_week.includes(day.full)} onClick={() => setForm(p => ({ ...p, days_a_week: p.days_a_week.includes(day.full) ? p.days_a_week.filter(d => d !== day.full) : [...p.days_a_week, day.full] }))} />)}
                      </div>
                      {showErrors && errors.days && <p className="mt-3 text-[11px] font-bold text-red-500 flex items-center gap-1"><AlertCircle className="h-3 w-3"/> {errors.days}</p>}
                    </div>

                    <div className="mb-8 bg-white/40 backdrop-blur-sm rounded-[24px] p-6 sm:p-8 border border-white/60 shadow-sm">
                      <div className="flex justify-between items-end mb-2">
                         <label className="font-bold text-slate-900 block text-sm">Monthly Budget Range</label>
                      </div>
                      <DualRangeSlider min={1000} max={30000} value={[form.salary_min, form.salary_max]} onChange={([min, max]) => setForm(p => ({...p, salary_min: min, salary_max: max}))} />
                    </div>

                    <div className="mb-4">
                      <label className="font-bold text-slate-900 mb-3 block text-sm">Mode of Tuition</label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {[ { l: 'Home Tuition', i: Home }, { l: 'Online Class', i: Laptop }, { l: 'Physical Center', i: School } ].map(opt => <OptionCard key={opt.l} title={opt.l} selected={form.tuition_type === opt.l} onClick={()=>setForm(p=>({...p, tuition_type: opt.l}))} icon={<opt.i className="h-4 w-4"/>} />)}
                      </div>
                    </div>
                  </motion.div>
                )}

                {step === 3 && (
                  <motion.div key="step3" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.3 }}>
                    <SectionTitle icon={<FileText className="h-6 w-6 opacity-80"/>} title="Final Details" subtitle="Add specific requirements and finish posting." />
                    
                    <div className="mb-8">
                      <label className="font-bold text-slate-900 mb-3 block text-sm">Tutor Gender Preference</label>
                      <div className="flex flex-wrap gap-3">
                        {['No Preference', 'Male', 'Female'].map(g => (
                          <motion.button whileTap={{ scale: 0.95 }} key={g} type="button" onClick={()=>setForm(p=>({...p, student_gender_pref: g}))} 
                            className={cn("px-6 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-sm border-2", form.student_gender_pref === g ? "bg-slate-900 text-white border-slate-900" : "bg-white border-transparent text-slate-600 hover:border-slate-200")}>{g}</motion.button>
                        ))}
                      </div>
                    </div>

                    {/* NEW URGENT TOGGLE FOR MISSING DB FIELD */}
                    <div className="bg-emerald-50/80 backdrop-blur-sm rounded-2xl p-5 border border-emerald-100 flex items-start gap-4 mb-8 shadow-sm">
                      <input type="checkbox" id="urgent" checked={form.urgent} onChange={(e)=>setForm(p=>({...p, urgent: e.target.checked}))} className="mt-0.5 h-5 w-5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-600 cursor-pointer shadow-sm" />
                      <div>
                        <label htmlFor="urgent" className="text-sm font-bold text-slate-900 cursor-pointer leading-tight block">Mark as Urgent Requirement</label>
                        <p className="text-[11px] font-medium text-slate-500 mt-1">We will prioritize matching tutors for urgent requests.</p>
                      </div>
                    </div>
                    
                    <div className="mb-8 relative">
                      <label className="font-bold text-slate-900 mb-2 block text-sm">Detailed Description</label>
                      <div className="relative">
                        <textarea name="description" value={form.description} onChange={handleInputChange} 
                          className={cn("relative z-10 w-full h-36 rounded-2xl border bg-white/50 backdrop-blur-sm p-5 text-sm font-medium outline-none focus:bg-white transition-all resize-none shadow-sm", showErrors && errors.desc ? "border-red-400 focus:shadow-[0_0_15px_rgba(248,113,113,0.3)]" : isDescValid ? "border-teal-300 focus:border-emerald-500" : "border-slate-200 focus:border-emerald-500 focus:shadow-[0_0_15px_rgba(16,185,129,0.2)]")} />
                        
                        {/* Animated Hint Overlay */}
                        {!form.description && (
                          <div className="absolute top-5 left-5 right-5 pointer-events-none overflow-hidden h-6 z-20">
                            <AnimatePresence mode="popLayout">
                              <motion.span key={hintIndex} initial={{y:20, opacity:0}} animate={{y:0, opacity:1}} exit={{y:-20, opacity:0}} transition={{ duration: 0.4 }} className="absolute text-slate-400 text-sm font-medium block w-full truncate">
                                {DESCRIPTION_HINTS[hintIndex]}
                              </motion.span>
                            </AnimatePresence>
                          </div>
                        )}
                      </div>
                      {showErrors && errors.desc && <p className="mt-2 text-[11px] font-bold text-red-500 flex items-center gap-1"><AlertCircle className="h-3 w-3"/> {errors.desc}</p>}
                    </div>
                    
                    <div className="bg-emerald-50/80 backdrop-blur-sm rounded-2xl p-5 border border-emerald-100 flex items-start gap-4 mb-8 shadow-sm">
                      <input type="checkbox" id="terms" checked={termsAccepted} onChange={(e)=>setTermsAccepted(e.target.checked)} className="mt-0.5 h-5 w-5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-600 cursor-pointer shadow-sm" />
                      <div>
                        <label htmlFor="terms" className="text-sm font-bold text-slate-900 cursor-pointer leading-tight block">I agree to GyanHub's Terms of Service and Privacy Policy.</label>
                        {showErrors && errors.terms && <p className="text-[11px] font-bold text-red-500 mt-1">{errors.terms}</p>}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex justify-between items-center pt-8 mt-8 border-t border-slate-200/50">
                {step > 1 ? (
                  <button type="button" onClick={()=>setStep(p=>p-1)} className="font-bold text-slate-500 hover:text-slate-900 flex items-center gap-1 transition-colors text-sm"><ChevronLeft className="h-4 w-4"/> Back</button>
                ) : <div></div>}
                
                {step < 3 ? (
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="button" onClick={goNext} className="bg-slate-900 text-white font-black text-xs uppercase tracking-widest py-4 px-8 rounded-xl flex items-center gap-2 hover:bg-slate-800 transition shadow-[0_10px_20px_rgba(0,0,0,0.1)]">
                    Continue <ChevronRight className="h-4 w-4"/>
                  </motion.button>
                ) : (
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" disabled={loading} className="bg-emerald-600 text-white font-black text-xs uppercase tracking-widest py-4 px-8 rounded-xl flex items-center gap-2 hover:bg-emerald-700 transition disabled:opacity-50 shadow-[0_10px_20px_rgba(16,185,129,0.3)]">
                    {loading ? 'Posting...' : 'Post Requirement'} <Sparkles className="h-4 w-4"/>
                  </motion.button>
                )}
              </div>
            </form>
          </div>

          {/* Sticky Right Sidebar Dashboard */}
          <aside className="hidden lg:flex flex-col gap-6 sticky top-8 h-[calc(100vh-4rem)] overflow-y-auto pb-8 no-scrollbar">
            
            <MatchTrackerCard 
              count={matchedTutors.length} 
              loading={matchLoading} 
              location={form.location} 
              subjectSelected={form.subjects.length > 0} 
            />

            <LivePreviewCard form={form} />

            <div className="bg-slate-900 rounded-[32px] p-6 text-white overflow-hidden relative shadow-xl shrink-0">
              <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                <BadgeCheck className="h-32 w-32 rotate-12 text-emerald-400" />
              </div>
              <h3 className="font-bold mb-5 flex items-center gap-2 relative z-10 text-lg"><ShieldCheck className="h-6 w-6 text-emerald-400"/> Safe & Secure</h3>
              <ul className="space-y-4 text-sm font-medium text-slate-300 relative z-10">
                <li className="flex gap-3 items-start"><div className="mt-0.5 bg-emerald-400/20 p-1 rounded-full"><Check className="h-3 w-3 text-emerald-400 shrink-0"/></div> 100% Verified Educators</li>
                <li className="flex gap-3 items-start"><div className="mt-0.5 bg-emerald-400/20 p-1 rounded-full"><Check className="h-3 w-3 text-emerald-400 shrink-0"/></div> Privacy Protected Data</li>
                <li className="flex gap-3 items-start"><div className="mt-0.5 bg-emerald-400/20 p-1 rounded-full"><Check className="h-3 w-3 text-emerald-400 shrink-0"/></div> Free Trial Replacements</li>
              </ul>
            </div>
          </aside>
        </div>
      </div>

      {/* Mobile Bottom Sheet for Match Tracker */}
      <AnimatePresence>
        {showMobileSummary && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowMobileSummary(false)} className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 lg:hidden" />
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: "spring", bounce: 0, duration: 0.4 }} className="fixed bottom-0 left-0 w-full bg-slate-950 rounded-t-[40px] p-6 z-50 lg:hidden flex flex-col max-h-[80vh]">
              <div className="w-12 h-1.5 bg-slate-800 rounded-full mx-auto mb-6"></div>
              <div className="flex justify-between items-center mb-6">
                 <h2 className="text-white font-black text-xl">Match Summary</h2>
                 <button onClick={() => setShowMobileSummary(false)} className="bg-slate-800 text-slate-400 p-2 rounded-full hover:bg-slate-700 hover:text-white transition"><X className="h-5 w-5"/></button>
              </div>
              <div className="overflow-y-auto no-scrollbar pb-6 flex flex-col gap-6">
                 <MatchTrackerCard count={matchedTutors.length} loading={matchLoading} location={form.location} subjectSelected={form.subjects.length > 0} />
                 <LivePreviewCard form={form} />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Mobile Sticky Button */}
      <div className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-sm z-40">
        <motion.button whileTap={{ scale: 0.95 }} onClick={() => setShowMobileSummary(true)} className="w-full bg-slate-900 text-white font-bold py-4 px-6 rounded-2xl shadow-2xl flex items-center justify-between border border-slate-700">
          <span className="flex items-center gap-3"><Sparkles className="h-5 w-5 text-emerald-400"/> {matchLoading ? '...' : matchedTutors.length} Tutors Matched</span>
          <span className="text-[10px] uppercase tracking-wider font-black bg-white/20 px-3 py-1.5 rounded-lg">View</span>
        </motion.button>
      </div>

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}