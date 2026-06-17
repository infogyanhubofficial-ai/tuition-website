'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from "@/lib/supabase/client"; 
import { Session } from '@supabase/supabase-js';
import { motion, useScroll, useMotionValueEvent, AnimatePresence } from 'framer-motion';
import {
  BadgeCheck,
  BookOpen,
  ChevronRight,
  GraduationCap,
  Lock,
  MapPin,
  Phone,
  ShieldCheck,
  FileText,
  X,
  Share2,
  Heart,
  Laptop,
  Home,
  Building2,
  Quote,
  Award,
  Send,
  UserCircle2,
  CalendarDays,
  Sparkles
} from 'lucide-react';

interface Tutor {
  id: number;
  name?: string;
  subject?: string | any[];
  languages?: string[];
  location?: string;
  experience?: string | number;
  education?: string;
  bio?: string;
  avatar_url?: string;
  photo?: string;
  verified?: boolean;
  contact_num?: string;
  cv_url?: string;
  id_url?: string;
  has_cv?: boolean;
  has_id?: boolean;
  mode_of_teaching?: string;
  hour_rate?: string | number; 
  availability?: boolean;
  created_at?: string;
}

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

const triggerHaptic = () => {
  if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
    window.navigator.vibrate(50); 
  }
};

function GovernmentIdModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm dark:bg-black/60" aria-modal="true" role="dialog" aria-labelledby="id-modal-title">
      <motion.div 
        initial={{ opacity: 0, scale: 0.98, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98, y: 10 }}
        transition={{ duration: 0.2 }}
        className="relative w-full max-w-md overflow-hidden rounded-[24px] bg-white dark:bg-slate-900 p-8 shadow-xl border border-slate-100 dark:border-slate-800"
      >
        <button onClick={onClose} aria-label="Close modal" className="absolute right-6 top-6 flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors">
          <X className="h-4 w-4" />
        </button>
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white mb-6 border border-slate-100 dark:border-slate-700">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <h3 id="id-modal-title" className="text-xl font-semibold text-slate-900 dark:text-white leading-tight">Identity Verification</h3>
        <p className="mt-3 text-slate-600 dark:text-slate-400 leading-relaxed text-sm">
          If you have officially hired this tutor via the GyanHub Portal, please message the Admin from your dashboard to request identification documents. We protect our tutors' highly sensitive information.
        </p>
        <div className="mt-8">
          <button 
            onClick={onClose}
            aria-label="Acknowledge identity verification notice"
            className="w-full rounded-xl bg-slate-900 dark:bg-white py-3.5 text-sm font-medium text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors"
          >
            Understood
          </button>
        </div>
      </motion.div>
    </div>
  );
}

const fadeUpVariant = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
} as const;

const getMaskedPhone = (phone?: string) => {
  if (!phone) return "98XXXXXX00";
  const clean = phone.replace(/\D/g, ''); 
  if (clean.length < 4) return "98XXXXXX00";
  return clean.slice(0, 2) + "••••••" + clean.slice(-2);
};

export default function TutorDetailClient() {
  const params = useParams();
  
  const rawSlug = Array.isArray(params?.id) ? params.id[0] : params?.id; 
  const idString = rawSlug ? rawSlug.split('-')[0] : null;
  const numericId = Number(idString);
  
  const router = useRouter();
  const { scrollY } = useScroll();
  const supabase = createClient(); 

  const [tutor, setTutor] = useState<Tutor | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [showIdModal, setShowIdModal] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showStickyHeader, setShowStickyHeader] = useState(false);

  const isPremiumDataUnlocked = false; 

  useMotionValueEvent(scrollY, "change", (latest) => {
    if (latest > 300 && !showStickyHeader) setShowStickyHeader(true);
    if (latest <= 300 && showStickyHeader) setShowStickyHeader(false);
  });

  useEffect(() => {
    const fetchTutorAndSession = async () => {
      if (!numericId) return;
      
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      setSession(currentSession);

      const { data, error } = await supabase
        .from('tutors')
        .select('*')
        .eq('id', numericId)
        .single();

      if (!error) setTutor(data);
      setLoading(false);
    };
    fetchTutorAndSession();
  }, [numericId, supabase]);

  const handleLockedAction = async (requestType: 'cv' | 'phone') => {
    triggerHaptic();
    
    const { data: { session: currentSession } } = await supabase.auth.getSession();
    
    if (!currentSession) {
      router.push(`/login?redirect=/tutors/${rawSlug}`);
    } else {
      const userName = currentSession.user?.user_metadata?.full_name || '';
      const userEmail = currentSession.user?.email || '';
      const tutorName = tutor?.name || '';
      
      const queryParams = new URLSearchParams({
        tutor_id: numericId.toString(),
        request_type: requestType,
        name: userName,
        email: userEmail,
        tutor_name: tutorName
      });

      router.push(`/order?${queryParams.toString()}`);
    }
  };

  const handleMapClick = () => {
    if (tutor?.location) {
      const encodedLocation = encodeURIComponent(tutor.location);
      window.open(`http://googleusercontent.com/maps.google.com/?q=${encodedLocation}`, '_blank');
    }
  };

  const formatExperience = (exp?: string | number) => {
    const num = Number(exp);
    if (!num || num === 0) return 'New';
    if (num >= 10) return '10+ Years';
    return `${num} Years`;
  };

  if (loading) return (
    <div className="min-h-screen bg-white dark:bg-slate-950 pb-28 lg:pb-20">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8 animate-pulse">
        <div className="h-48 sm:h-56 rounded-[32px] bg-slate-100 dark:bg-slate-900 relative"></div>
      </div>
    </div>
  );
  
  if (!tutor) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#fafafa] dark:bg-slate-950 p-4 text-center">
      <div className="h-16 w-16 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-center text-slate-400 dark:text-slate-600 mb-6">
        <GraduationCap size={32} />
      </div>
      <h1 className="text-2xl font-semibold text-slate-900 dark:text-white tracking-tight">Tutor Not Found</h1>
      <p className="mt-2 text-slate-500 font-medium max-w-sm">This profile may have been removed or is no longer active on GyanHub.</p>
    </div>
  );

  const displaySubjects = Array.isArray(tutor.subject) ? tutor.subject : [tutor.subject || 'Expertise Unlisted'];
  const visibleSubjects = displaySubjects.slice(0, 6);
  const remainingSubjects = displaySubjects.length - 6;

  const avatarUrl = tutor.avatar_url || tutor.photo;
  const ModeIcon = tutor.mode_of_teaching === 'Online' ? Laptop : tutor.mode_of_teaching === 'Home Visit' ? Home : Building2;
  const memberSince = tutor.created_at ? new Date(tutor.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : null;

  // AI Summary Variables
  const firstName = tutor.name ? tutor.name.split(' ')[0] : 'This tutor';
  const educationStr = tutor.education ? tutor.education : 'academic professional';
  const subjectsStr = visibleSubjects.length > 0 ? visibleSubjects.join(', ') : 'general studies';

  return (
    <main className="min-h-screen bg-[#fafafa] dark:bg-slate-950 transition-colors duration-300 pb-28 lg:pb-20 selection:bg-slate-200 dark:selection:bg-slate-800">
      <GovernmentIdModal isOpen={showIdModal} onClose={() => setShowIdModal(false)} />

      <AnimatePresence>
        {showStickyHeader && (
          <motion.div 
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed top-0 left-0 right-0 z-50 bg-white/90 dark:bg-slate-950/90 backdrop-blur-md border-b border-slate-200/60 dark:border-slate-800/60 hidden lg:block"
          >
            <div className="mx-auto max-w-7xl px-4 h-16 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="relative h-10 w-10 shrink-0 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700">
                  {avatarUrl ? (
                    <Image src={avatarUrl} alt={`${tutor.name || 'Tutor'}`} fill className="object-cover" sizes="40px" unoptimized quality={100} />
                  ) : (
                    <UserCircle2 className="h-full w-full text-slate-300" />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5 text-sm">
                    {tutor.name} {tutor.verified && <BadgeCheck className="h-4 w-4 text-emerald-600" />}
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                     <span className={cn("h-1.5 w-1.5 rounded-full", tutor.availability ? "bg-emerald-500" : "bg-slate-400")}></span>
                     {tutor.location || 'Location Unlisted'}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="text-xs text-slate-500 font-medium">Hourly Rate</p>
                  <p className="font-semibold text-slate-900 dark:text-white text-sm">Nrs. {tutor.hour_rate || 'N/A'}</p>
                </div>
                <Link 
                  href={`/tutors/${rawSlug}/book`}
                  onClick={triggerHaptic}
                  className="rounded-lg bg-blue-500 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-600 shadow-sm"
                >
                  Book Session
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        
        {/* Breadcrumb & Actions */}
        <div className="mb-6 flex items-center justify-between">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm font-medium text-slate-500">
            <Link href="/" className="hover:text-slate-900 dark:hover:text-slate-300 transition-colors">Home</Link>
            <ChevronRight className="h-3 w-3" aria-hidden="true" />
            <Link href="/tutors" className="hover:text-slate-900 dark:hover:text-slate-300 transition-colors">Tutors</Link>
            <ChevronRight className="h-3 w-3" aria-hidden="true" />
            <span className="text-slate-900 dark:text-white truncate max-w-[120px] sm:max-w-none" aria-current="page">{tutor.name}</span>
          </nav>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => { triggerHaptic(); setIsFavorite(!isFavorite); }} 
              aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <Heart className="h-4 w-4" fill={isFavorite ? "#ef4444" : "none"} stroke={isFavorite ? "#ef4444" : "currentColor"} />
            </button>
            <button 
              onClick={triggerHaptic}
              aria-label="Share tutor profile"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <Share2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Hero Profile Section */}
        <motion.section 
          initial="hidden" animate="visible" variants={fadeUpVariant}
          className="relative rounded-2xl border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-6 sm:p-10"
        >
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start w-full">
              
              {/* Avatar (Fixed Square Box) */}
              <div className="relative shrink-0 z-10">
                <div className="h-32 w-32 shrink-0 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 overflow-hidden shadow-sm">
                  {avatarUrl ? (
                    <Image src={avatarUrl} alt={`${tutor.name || 'Tutor'}`} fill className="object-cover" sizes="128px" priority unoptimized quality={100} />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-slate-300">
                      <UserCircle2 className="h-16 w-16" />
                    </div>
                  )}
                </div>
              </div>

              {/* Main Info */}
              <div className="flex-1 relative z-10 pt-1">
                <div className="flex items-center gap-2 mb-1.5">
                  {tutor.availability && (
                    <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                      </span>
                      Accepting Students
                    </span>
                  )}
                  {memberSince && (
                    <span className="text-xs text-slate-500 font-medium px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-800">
                      Joined {memberSince}
                    </span>
                  )}
                </div>
                
                <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                  {tutor.name}
                  {tutor.verified && (
                    <BadgeCheck aria-label="Verified Tutor" className="h-6 w-6 text-emerald-600 shrink-0" />
                  )}
                </h1>

                {/* AI Academic Summary */}
                <div className="mt-3 flex items-start gap-2 rounded-lg bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 px-4 py-2.5 max-w-2xl">
                  <Sparkles className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300 leading-relaxed">
                    <span className="font-semibold text-slate-900 dark:text-white">Profile Insight: </span>
                    {firstName} is an expert <span className="font-semibold text-blue-700 dark:text-blue-400">{educationStr}</span> with expertise in subjects like <span className="font-semibold text-blue-700 dark:text-blue-400">{subjectsStr}</span>.
                  </p>
                </div>
                
                <div className="flex flex-wrap items-center gap-2 mt-4">
                  {tutor.languages && tutor.languages.map((lang, idx) => (
                    <span key={idx} className="flex items-center gap-1.5 rounded-md bg-slate-100 dark:bg-slate-800 px-2.5 py-1 text-xs font-medium text-slate-600 dark:text-slate-300">
                      {lang}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Body Grid */}
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="space-y-6">

            {/* AI Snapshot - Dynamic Feature */}
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUpVariant} className="rounded-2xl border border-amber-200/50 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-900/10 p-6 relative overflow-hidden">
               <div className="flex items-center gap-2 mb-4">
                 <div className="p-1.5 rounded-md bg-amber-100 dark:bg-amber-900/50">
                    <Sparkles className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                 </div>
                 <h3 className="text-sm font-semibold text-slate-900 dark:text-white tracking-tight">AI Summary</h3>
               </div>
               <ul className="text-slate-700 dark:text-slate-300 text-sm space-y-2.5 font-medium leading-relaxed">
                 <li className="flex gap-2">
                   <span className="text-amber-500">•</span>
                   Highly compatible with students focusing on {visibleSubjects.length > 0 ? visibleSubjects.join(', ') : 'general studies'}.
                 </li>
                 <li className="flex gap-2">
                   <span className="text-amber-500">•</span>
                   Demonstrates a strong professional background with {formatExperience(tutor.experience)} of academic engagement.
                 </li>
                 <li className="flex gap-2">
                   <span className="text-amber-500">•</span>
                   Optimized for {tutor.mode_of_teaching ? tutor.mode_of_teaching.toLowerCase() : 'adaptable'} learning sessions in {tutor.location || 'various regions'}.
                 </li>
               </ul>
            </motion.div>

            {/* Quick Details Cards */}
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUpVariant} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
               {/* Location */}
               <div 
                 role="button"
                 tabIndex={0}
                 onClick={handleMapClick}
                 onKeyDown={(e) => { if (e.key === 'Enter') handleMapClick() }}
                 className="group rounded-2xl bg-white dark:bg-slate-900 p-5 border border-slate-200/60 dark:border-slate-800 shadow-sm cursor-pointer hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
               >
                 <MapPin className="h-5 w-5 text-slate-400 group-hover:text-blue-500 mb-3 transition-colors" />
                 <p className="text-sm font-semibold text-slate-900 dark:text-white leading-tight">{tutor.location || 'Location Unlisted'}</p>
                 <p className="text-xs text-slate-500 mt-1.5 font-medium">Location</p>
               </div>

               {/* Experience */}
               <div className="rounded-2xl bg-white dark:bg-slate-900 p-5 border border-slate-200/60 dark:border-slate-800 shadow-sm">
                  <Award className="h-5 w-5 text-slate-400 mb-3" />
                  <p className="text-sm font-semibold text-slate-900 dark:text-white leading-tight">{formatExperience(tutor.experience)}</p>
                  <p className="text-xs text-slate-500 mt-1.5 font-medium">Professional Experience</p>
               </div>

               {/* Environment */}
               <div className="rounded-2xl bg-white dark:bg-slate-900 p-5 border border-slate-200/60 dark:border-slate-800 shadow-sm">
                  <ModeIcon className="h-5 w-5 text-slate-400 mb-3" />
                  <p className="text-sm font-semibold text-slate-900 dark:text-white leading-tight truncate">{tutor.mode_of_teaching || 'Hybrid Environment'}</p>
                  <p className="text-xs text-slate-500 mt-1.5 font-medium">Teaching Mode</p>
               </div>
            </motion.div>

            {/* Professional Story */}
            <motion.section initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUpVariant} className="rounded-2xl border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-slate-400" />
                Teaching Philosophy & Background
              </h2>
              
              <div className="prose prose-slate dark:prose-invert max-w-none text-slate-600 dark:text-slate-300 leading-relaxed text-sm sm:text-base font-medium">
                {tutor.bio ? (
                  tutor.bio.split('\n').map((line, i) => (
                    <span key={i}>
                      {line}
                      <br />
                    </span>
                  ))
                ) : (
                  'Building concepts that last a lifetime. Highly dedicated professional focusing on academic excellence and holistic student development.'
                )}
              </div>
              
              <div className="mt-8 border-t border-slate-100 dark:border-slate-800 pt-6">
                <h3 className="text-xs font-semibold text-slate-900 dark:text-white mb-4">Core Expertise Subjects</h3>
                <div className="flex flex-wrap gap-2">
                  {visibleSubjects.map((s, i) => (
                    <span 
                      key={i} 
                      className="rounded-lg bg-slate-50 dark:bg-slate-800/50 px-3 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                    >
                      {s}
                    </span>
                  ))}
                  {remainingSubjects > 0 && (
                    <span className="rounded-lg bg-slate-50 dark:bg-slate-800/50 px-3 py-1.5 text-sm font-medium text-slate-500 dark:text-slate-400 border border-dashed border-slate-200 dark:border-slate-700">
                      + {remainingSubjects} more
                    </span>
                  )}
                </div>
              </div>
            </motion.section>

            {/* Education Timeline Alternative */}
            <motion.section initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUpVariant} className="rounded-2xl border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-slate-400" />
                Latest Academic Credential
              </h2>
              <div className="pl-4 border-l-2 border-slate-100 dark:border-slate-800">
                 <div className="relative">
                    <div className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-slate-300 dark:bg-slate-600 border-[3px] border-white dark:border-slate-900"></div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white leading-tight">{tutor.education || 'Credentials Unlisted'}</p>
                    <p className="text-xs text-slate-500 mt-1">Verified Degree</p>
                 </div>
              </div>
            </motion.section>

            {/* Credentials Section */}
            {(tutor.cv_url || tutor.has_cv || tutor.id_url || tutor.has_id) && (
              <motion.section initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUpVariant} className="rounded-2xl border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 shadow-sm">
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-slate-400" />
                    Verified Documents
                  </h2>
                </div>
                
                <div className="grid gap-4 sm:grid-cols-2">
                  {(tutor.cv_url || tutor.has_cv) && (
                    <button 
                      onClick={() => handleLockedAction('cv')}
                      aria-label="Request to view tutor's CV"
                      className="group relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-5 transition-colors hover:border-slate-300 dark:hover:border-slate-700 text-left"
                    >
                      <div className="relative z-10 flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                          <FileText className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900 dark:text-white">Academic CV</p>
                          <p className="text-xs font-medium text-slate-500 mt-0.5">Full Work History</p>
                        </div>
                      </div>
                      
                      {!isPremiumDataUnlocked && (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center justify-center">
                           <div className="flex items-center gap-1.5 rounded-full bg-slate-200/50 dark:bg-slate-700/50 px-2.5 py-1">
                             <Lock className="h-3 w-3 text-slate-500" />
                             <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-400">Unlock</span>
                           </div>
                        </div>
                      )}
                    </button>
                  )}

                  {(tutor.id_url || tutor.has_id) && (
                    <button 
                      onClick={() => setShowIdModal(true)}
                      aria-label="View identity verification status"
                      className="group relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-5 transition-colors hover:border-slate-300 dark:hover:border-slate-700 text-left"
                    >
                      <div className="relative z-10 flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-emerald-600 dark:text-emerald-500">
                          <BadgeCheck className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900 dark:text-white">Government ID</p>
                          <p className="text-xs font-medium text-emerald-600 mt-0.5">Identity Verified</p>
                        </div>
                      </div>
                      
                      {!isPremiumDataUnlocked && (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center justify-center">
                           <div className="flex items-center gap-1.5 rounded-full bg-slate-200/50 dark:bg-slate-700/50 px-2.5 py-1">
                             <Lock className="h-3 w-3 text-slate-500" />
                             <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-400">Request</span>
                           </div>
                        </div>
                      )}
                    </button>
                  )}
                </div>
              </motion.section>
            )}
          </div>

          {/* Sticky Sidebar */}
          <aside className="hidden lg:block lg:sticky lg:top-24 lg:self-start z-10">
            <div className="rounded-2xl border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">

              <h3 className="text-lg font-semibold text-slate-900 dark:text-white tracking-tight">Booking Summary</h3>
              
              <div className="mt-6 mb-6 rounded-xl bg-slate-50 dark:bg-slate-800/50 p-5 border border-slate-100 dark:border-slate-800">
                 <p className="text-xs text-slate-500 mb-1 font-medium">Standard Hourly Rate</p>
                 <div className="flex items-baseline gap-1">
                   <span className="text-2xl font-semibold text-slate-900 dark:text-white">Nrs. {tutor.hour_rate || 'N/A'}</span>
                 </div>
              </div>

              <div className="space-y-3">
                <div 
                  role="button"
                  tabIndex={0}
                  aria-label="Request direct phone number"
                  onClick={() => handleLockedAction('phone')}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleLockedAction('phone') }}
                  className="group flex items-center justify-between rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3.5 cursor-pointer hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-500 shrink-0 border border-slate-100 dark:border-slate-700">
                      <Phone className="h-4 w-4" />
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-[10px] font-semibold uppercase text-slate-400 mb-0.5">Direct Phone</p>
                      
                      <div className="relative flex items-center w-full">
                        {isPremiumDataUnlocked ? (
                          <p className="text-sm font-semibold text-slate-900 dark:text-white">
                            {tutor.contact_num}
                          </p>
                        ) : (
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-slate-800 dark:text-slate-200 opacity-50 select-none">
                              {getMaskedPhone(tutor.contact_num)}
                            </p>
                            <Lock className="h-3 w-3 text-slate-400 shrink-0" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <Link 
                  href={`/tutors/${rawSlug}/book`}
                  onClick={triggerHaptic}
                  aria-label={`Request booking with ${tutor.name}`}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-500 py-3.5 text-sm font-medium text-white transition-colors hover:bg-blue-600 shadow-sm"
                >
                  <Send className="h-4 w-4" />
                  Request Booking
                </Link>
              </div>
              
              <div className="mt-6 flex flex-col items-center gap-2 border-t border-slate-100 dark:border-slate-800 pt-5">
                 <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                   <ShieldCheck className="h-3.5 w-3.5" /> Bookings protected by GyanHub
                 </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Mobile Sticky Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-t border-slate-200/60 dark:border-slate-800 p-4 lg:hidden pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
         <div className="mx-auto max-w-md flex items-center justify-between gap-4">
            <div className="flex-1">
               <p className="text-xs font-medium text-slate-500">Hourly Rate</p>
               <p className="text-lg font-semibold text-slate-900 dark:text-white">Nrs. {tutor.hour_rate || 'N/A'}</p>
            </div>
            <Link 
              href={`/tutors/${rawSlug}/book`}
              onClick={triggerHaptic}
              aria-label={`Book a session with ${tutor.name}`}
              className="flex items-center justify-center gap-2 rounded-xl bg-blue-500 px-6 py-3.5 text-sm font-medium text-white transition-colors hover:bg-blue-600 shadow-sm"
            >
              <Send className="h-4 w-4" /> 
              Book Now
            </Link>
         </div>
      </div>

    </main>
  );
}