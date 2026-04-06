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
  CalendarDays
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md dark:bg-black/60" aria-modal="true" role="dialog" aria-labelledby="id-modal-title">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-md overflow-hidden rounded-[40px] bg-white dark:bg-slate-900 p-8 shadow-2xl border border-white dark:border-slate-800"
      >
        <button onClick={onClose} aria-label="Close modal" className="absolute right-6 top-6 flex h-8 w-8 items-center justify-center rounded-full bg-slate-50 dark:bg-slate-800 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
          <X className="h-4 w-4" />
        </button>
        <div className="flex h-16 w-16 items-center justify-center rounded-[24px] bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mb-6 shadow-inner">
          <ShieldCheck className="h-8 w-8" />
        </div>
        <h3 id="id-modal-title" className="text-2xl font-black text-slate-900 dark:text-white leading-tight">Identity Verification</h3>
        <p className="mt-4 text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
          If you have officially hired this tutor via the GyanHub Portal, please message the Admin from your dashboard to request identification documents. We protect our tutors' highly sensitive information.
        </p>
        <div className="mt-8">
          <button 
            onClick={onClose}
            aria-label="Acknowledge identity verification notice"
            className="w-full rounded-[20px] bg-slate-100 dark:bg-slate-800 py-4 text-sm font-black text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 transition-all"
          >
            Understood
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function AbstractHeroPattern() {
  return (
    <div className="absolute inset-0 overflow-hidden rounded-[40px] bg-white dark:bg-slate-950" aria-hidden="true">
      <div className="absolute top-0 right-0 w-full h-full opacity-60 mix-blend-multiply dark:mix-blend-lighten filter blur-3xl">
        <div className="absolute -top-24 -right-12 w-96 h-96 rounded-full bg-blue-100 dark:bg-blue-900/30 animate-blob"></div>
        <div className="absolute top-12 -left-12 w-72 h-72 rounded-full bg-indigo-100 dark:bg-indigo-900/30 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-32 left-1/3 w-80 h-80 rounded-full bg-violet-100 dark:bg-violet-900/30 animate-blob animation-delay-4000"></div>
      </div>
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cmVjdCB3aWR0aD0iOCIgaGVpZ2h0PSI4IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAiLz4KPGNpcmNsZSBjeD0iNCIgY3k9IjQiIHI9IjEiIGZpbGw9IiM2NDc0OGIiIGZpbGwtb3BhY2l0eT0iMC4xIi8+Cjwvc3ZnPg==')] dark:bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cmVjdCB3aWR0aD0iOCIgaGVpZ2h0PSI4IiBmaWxsPSIjMDAwIiBmaWxsLW9wYWNpdHk9IjAiLz4KPGNpcmNsZSBjeD0iNCIgY3k9IjQiIHI9IjEiIGZpbGw9IiNmOGZhZmMiIGZpbGwtb3BhY2l0eT0iMC4xIi8+Cjwvc3ZnPg==')]" />
    </div>
  );
}

const fadeUpVariant = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
} as const;

const getMaskedPhone = (phone?: string) => {
  if (!phone) return "98XXXXXX00";
  const clean = phone.replace(/\D/g, ''); 
  if (clean.length < 4) return "98XXXXXX00";
  return clean.slice(0, 2) + "XXXXXX" + clean.slice(-2);
};

export default function TutorDetailClient() {
  const params = useParams();
  
  // [SEO FIX] Handle the new SEO slug format (e.g. 57-ram-sharma-be-civil)
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
    if (latest > 400 && !showStickyHeader) setShowStickyHeader(true);
    if (latest <= 400 && showStickyHeader) setShowStickyHeader(false);
  });

  useEffect(() => {
    const fetchTutorAndSession = async () => {
      if (!numericId) return;
      
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      setSession(currentSession);

      // [SEO FIX] Query database using the extracted numeric ID
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
        tutor_id: numericId.toString(), // Send actual DB ID to order table
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
      window.open(`https://maps.google.com/?q=$${encodedLocation}`, '_blank');
    }
  };

  const formatExperience = (exp?: string | number) => {
    const num = Number(exp);
    if (!num || num === 0) return 'New Tutor';
    if (num >= 10) return '10+ Yrs';
    return `${num} Yrs`;
  };

  if (loading) return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 pb-28 lg:pb-20">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8 animate-pulse">
        <div className="h-48 sm:h-56 rounded-[40px] bg-slate-200/40 dark:bg-slate-800/40 relative">
          <div className="absolute -bottom-16 left-6 h-48 w-48 rounded-[36px] bg-slate-300/50 dark:bg-slate-700/50 border-4 border-[#F8FAFC] dark:border-slate-950"></div>
        </div>
        <div className="pt-16 grid gap-8 lg:grid-cols-[1fr_380px]">
          <div className="space-y-8">
             <div className="grid grid-cols-2 md:grid-cols-4 gap-4 auto-rows-[140px]">
                <div className="col-span-2 row-span-2 rounded-[32px] bg-slate-200/40 dark:bg-slate-800/40"></div>
                <div className="col-span-1 row-span-1 rounded-[32px] bg-slate-200/40 dark:bg-slate-800/40"></div>
                <div className="col-span-1 row-span-1 rounded-[32px] bg-slate-200/40 dark:bg-slate-800/40"></div>
                <div className="col-span-2 row-span-1 rounded-[32px] bg-slate-200/40 dark:bg-slate-800/40"></div>
             </div>
             <div className="h-64 rounded-[40px] bg-slate-200/40 dark:bg-slate-800/40"></div>
          </div>
          <div className="h-96 rounded-[40px] bg-slate-200/40 dark:bg-slate-800/40 hidden lg:block"></div>
        </div>
      </div>
    </div>
  );
  
  if (!tutor) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC] dark:bg-slate-950 p-4 text-center">
      <div className="h-24 w-24 bg-white dark:bg-slate-900 shadow-sm border border-slate-100 dark:border-slate-800 rounded-[32px] flex items-center justify-center text-slate-300 dark:text-slate-700 mb-6">
        <GraduationCap size={48} />
      </div>
      <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Tutor Not Found</h1>
      <p className="mt-2 text-slate-500 dark:text-slate-400 font-medium max-w-md">This tutor may have graduated from GyanHub or their profile is no longer active.</p>
    </div>
  );

  const displaySubjects = Array.isArray(tutor.subject) ? tutor.subject : [tutor.subject || 'Expertise Unlisted'];
  const visibleSubjects = displaySubjects.slice(0, 6);
  const remainingSubjects = displaySubjects.length - 6;

  const avatarUrl = tutor.avatar_url || tutor.photo;
  const ModeIcon = tutor.mode_of_teaching === 'Online' ? Laptop : tutor.mode_of_teaching === 'Home Visit' ? Home : Building2;
  const memberSince = tutor.created_at ? new Date(tutor.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : null;

  return (
    <main className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 transition-colors duration-300 pb-28 lg:pb-20 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-blue-600/20 [&::-webkit-scrollbar-thumb]:rounded-full">
      <GovernmentIdModal isOpen={showIdModal} onClose={() => setShowIdModal(false)} />

      <AnimatePresence>
        {showStickyHeader && (
          <motion.div 
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-800/50 shadow-sm hidden lg:block"
          >
            <div className="mx-auto max-w-7xl px-4 h-20 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="relative h-12 w-12 rounded-full overflow-hidden border-2 border-slate-100 dark:border-slate-800">
                  {avatarUrl ? (
                    <Image src={avatarUrl} alt={`${tutor.name || 'Tutor'} profile picture`} fill className="object-cover" sizes="48px" unoptimized quality={100} />
                  ) : (
                    <UserCircle2 className="h-full w-full text-slate-300" />
                  )}
                </div>
                <div>
                  <h3 className="font-black text-slate-900 dark:text-white flex items-center gap-2">
                    {tutor.name} {tutor.verified && <BadgeCheck className="h-5 w-5 text-blue-500 fill-blue-500 text-white dark:text-slate-900" />}
                  </h3>
                  <div className="flex items-center gap-1.5 text-[10px] font-black uppercase text-slate-400">
                     <span className="relative flex h-2 w-2">
                        {tutor.availability && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>}
                        <span className={cn("relative inline-flex rounded-full h-2 w-2", tutor.availability ? "bg-emerald-50" : "bg-slate-400")}></span>
                     </span>
                     {tutor.location || 'Location Unlisted'}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="text-[10px] font-black uppercase text-slate-400">Rate</p>
                  <p className="font-black text-slate-900 dark:text-white">Rs. {tutor.hour_rate || 'N/A'}/hr</p>
                </div>
                <Link 
                  href={`/tutors/${rawSlug}/book`}
                  onClick={triggerHaptic}
                  aria-label={`Book a session with ${tutor.name}`}
                  className="rounded-[20px] bg-indigo-600 px-6 py-3 text-sm font-black text-white shadow-lg shadow-indigo-500/25 hover:scale-105 active:scale-95 transition-all"
                >
                  Book Now
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        
        <div className="mb-6 flex items-center justify-between">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
            <Link href="/" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Home</Link>
            <ChevronRight className="h-3 w-3" aria-hidden="true" />
            <Link href="/tutors" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Tutors</Link>
            <ChevronRight className="h-3 w-3" aria-hidden="true" />
            <span className="text-slate-900 dark:text-white truncate max-w-[120px] sm:max-w-none" aria-current="page">{tutor.name}</span>
          </nav>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => { triggerHaptic(); setIsFavorite(!isFavorite); }} 
              aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
              className={cn("flex h-11 w-11 items-center justify-center rounded-[20px] transition-all active:scale-90", isFavorite ? "bg-red-50 dark:bg-red-500/10 text-red-500 shadow-inner" : "bg-white dark:bg-slate-900 text-slate-400 border border-slate-200 dark:border-slate-800 hover:border-red-200 dark:hover:border-red-900 hover:text-red-500")}
            >
              <Heart className="h-4 w-4" fill={isFavorite ? "currentColor" : "none"} />
            </button>
            <button 
              onClick={triggerHaptic}
              aria-label="Share tutor profile"
              className="flex h-11 w-11 items-center justify-center rounded-[20px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-blue-600 transition-all active:scale-90"
            >
              <Share2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        <motion.section 
          initial="hidden" animate="visible" variants={fadeUpVariant}
          className="relative overflow-visible rounded-[40px] border border-white/60 dark:border-white/5 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)]"
        >
          <div className="relative h-48 sm:h-56">
            <AbstractHeroPattern />
          </div>

          <div className="relative px-6 pb-10 sm:px-10">
            <div className="-mt-20 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-end w-full">
                
                <div className="relative shrink-0 group z-10">
                  <div className="h-40 w-40 sm:h-48 sm:w-48 rounded-[36px] p-1 bg-gradient-to-tr from-blue-500 to-indigo-600 shadow-xl shadow-blue-500/20 dark:shadow-blue-900/40">
                    <div className="relative h-full w-full rounded-[32px] overflow-hidden border-4 border-white dark:border-slate-900 bg-slate-100 dark:bg-slate-800">
                      {avatarUrl ? (
                        <Image src={avatarUrl} alt={`${tutor.name || 'Tutor'} profile photo`} fill className="object-cover relative z-10" sizes="(max-width: 768px) 160px, 192px" priority unoptimized quality={100} />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-blue-50 dark:bg-slate-800 text-blue-300">
                          <UserCircle2 className="h-20 w-20" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="pb-2 flex-1 relative z-10">
                  <div className="flex flex-col justify-start mb-1">
                    <h1 className="text-3xl font-black sm:text-4xl tracking-tight text-slate-900 dark:text-white whitespace-normal break-words flex items-center gap-2">
                      {tutor.name}
                      {tutor.verified && (
                        <BadgeCheck aria-label="Verified Tutor" className="h-7 w-7 text-blue-500 fill-blue-500 stroke-white dark:stroke-slate-900" />
                      )}
                    </h1>
                    {tutor.verified && (
                      <p className="text-blue-500 font-bold text-sm mt-1">Background Verified by GyanHub</p>
                    )}
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-2 mt-4">
                    {tutor.languages && tutor.languages.map((lang, idx) => (
                      <span key={idx} className="flex items-center gap-1.5 rounded-[16px] bg-slate-100 dark:bg-slate-800 px-3 py-1.5 text-[11px] font-bold text-slate-600 dark:text-slate-300">
                        {lang}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
          <div className="space-y-8">
            
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUpVariant} className="grid grid-cols-2 md:grid-cols-4 gap-4 auto-rows-[140px]">
               
               <div 
                 role="button"
                 tabIndex={0}
                 aria-label={`Open map for ${tutor.location}`}
                 onClick={handleMapClick}
                 onKeyDown={(e) => { if (e.key === 'Enter') handleMapClick() }}
                 className="col-span-2 row-span-2 rounded-[32px] p-6 border border-slate-100/60 dark:border-slate-800 shadow-sm relative overflow-hidden group cursor-pointer hover:border-purple-300 dark:hover:border-purple-500/50 transition-colors"
               >
                 <div className="absolute inset-0 opacity-20 dark:opacity-30 transition-transform duration-700 group-hover:scale-105" 
                      style={{ 
                        backgroundImage: `
                          radial-gradient(circle at 30% 40%, #c084fc 2px, transparent 3px),
                          radial-gradient(circle at 70% 60%, #818cf8 2px, transparent 3px),
                          linear-gradient(45deg, transparent 48%, #e2e8f0 49%, #e2e8f0 51%, transparent 52%),
                          linear-gradient(-45deg, transparent 48%, #e2e8f0 49%, #e2e8f0 51%, transparent 52%)
                        `, 
                        backgroundSize: '40px 40px, 50px 50px, 80px 80px, 100px 100px',
                        backgroundPosition: '0 0, 15px 25px, 0 0, 0 0'
                      }}>
                 </div>
                 <div className="absolute inset-0 bg-gradient-to-t from-white via-white/80 to-transparent dark:from-slate-900 dark:via-slate-900/80"></div>
                 
                 <div className="relative z-10 flex flex-col h-full justify-between pointer-events-none">
                   <div className="h-12 w-12 rounded-[20px] bg-purple-50 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center backdrop-blur-md shadow-sm group-hover:scale-110 transition-transform">
                     <MapPin className="h-6 w-6" />
                   </div>
                   
                   <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
                     <span className="absolute h-16 w-16 rounded-full bg-purple-400/20 animate-ping"></span>
                     <span className="absolute h-8 w-8 rounded-full bg-purple-400/40 animate-pulse"></span>
                     <span className="h-4 w-4 rounded-full bg-purple-600 border-2 border-white dark:border-slate-900 shadow-lg relative z-10"></span>
                   </div>

                   <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-purple-500 transition-colors">Open in Maps</p>
                    <p className="mt-1 text-2xl font-black text-slate-900 dark:text-white leading-tight group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">{tutor.location || 'Location Unlisted'}</p>
                   </div>
                 </div>
               </div>

               <div className="col-span-1 row-span-1 rounded-[32px] bg-white dark:bg-slate-900 p-6 border border-slate-100/60 dark:border-slate-800 shadow-sm flex flex-col justify-center">
                  <div className="flex items-center gap-2 mb-2 text-emerald-500">
                    <Award className="h-5 w-5" />
                  </div>
                  <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">{formatExperience(tutor.experience)}</p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">Experience</p>
               </div>

               <div className="col-span-1 row-span-1 rounded-[32px] bg-white dark:bg-slate-900 p-6 border border-slate-100/60 dark:border-slate-800 shadow-sm flex flex-col justify-center">
                  <div className="flex items-center gap-2 mb-2 text-blue-500">
                    <ModeIcon className="h-5 w-5" />
                  </div>
                  <p className="text-xl font-black text-slate-900 dark:text-white tracking-tight line-clamp-1">{tutor.mode_of_teaching || 'Hybrid'}</p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">Environment</p>
               </div>

               <div className="col-span-2 row-span-1 rounded-[32px] bg-white dark:bg-slate-900 p-6 border border-slate-100/60 dark:border-slate-800 shadow-sm flex flex-col justify-center">
                  <div className="flex items-center gap-2 mb-2 text-amber-500">
                    <GraduationCap className="h-5 w-5" />
                  </div>
                  <p className="text-lg font-black text-slate-900 dark:text-white tracking-tight line-clamp-2">{tutor.education || 'Credentials Unlisted'}</p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">Education</p>
               </div>
            </motion.div>

            <motion.section initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUpVariant} className="relative overflow-hidden rounded-[40px] border border-slate-100/60 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 sm:p-10 shadow-sm">
              <Quote className="absolute -top-4 -left-4 h-32 w-32 text-slate-50 dark:text-slate-800 opacity-50 rotate-180" />
              <div className="relative z-10">
                <h2 className="text-xl font-black text-slate-900 dark:text-white mb-6 flex items-center gap-3">
                  <div className="p-2 rounded-[14px] bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400"><BookOpen className="h-5 w-5" /></div>
                  The Professional Story
                </h2>
                
                <div className="prose prose-lg dark:prose-invert prose-slate max-w-none 
                  first-letter:text-6xl first-letter:font-serif first-letter:text-indigo-600 dark:first-letter:text-indigo-400 first-letter:float-left first-letter:mr-4 first-letter:mt-2 first-letter:leading-none text-slate-600 dark:text-slate-300">
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
                
                <div className="mt-10 border-t border-slate-100 dark:border-slate-800 pt-8">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-5">Core Expertise</h3>
                  <div className="flex flex-wrap gap-3">
                    {visibleSubjects.map((s, i) => (
                      <span 
                        key={i} 
                        className="rounded-[20px] bg-white dark:bg-slate-800 px-5 py-2.5 text-sm font-bold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shadow-sm transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/10 hover:border-blue-200 cursor-default whitespace-normal break-words inline-block"
                      >
                        {s}
                      </span>
                    ))}
                    {remainingSubjects > 0 && (
                      <span className="rounded-[20px] bg-slate-50 dark:bg-slate-800/50 px-5 py-2.5 text-sm font-bold text-slate-500 dark:text-slate-400 border border-dashed border-slate-200 dark:border-slate-700 cursor-default inline-block">
                        + {remainingSubjects} more
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </motion.section>

            {(tutor.cv_url || tutor.has_cv || tutor.id_url || tutor.has_id) && (
              <motion.section initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUpVariant} className="rounded-[40px] border border-slate-100/60 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 sm:p-10 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                    <div className="p-2 rounded-[14px] bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"><ShieldCheck className="h-5 w-5" /></div>
                    Verified Credentials
                  </h2>
                </div>
                
                <div className="grid gap-6 sm:grid-cols-2">
                  {(tutor.cv_url || tutor.has_cv) && (
                    <button 
                      onClick={() => handleLockedAction('cv')}
                      aria-label="Request to view tutor's CV"
                      className="group relative overflow-hidden rounded-[32px] border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 transition-all hover:border-blue-300 dark:hover:border-blue-500/50 hover:shadow-xl text-left h-48"
                    >
                      <div className={cn("absolute right-4 top-4 bottom-4 w-1/2 opacity-20 transition-all duration-500", !isPremiumDataUnlocked && "blur-[2px] group-hover:blur-[4px]")}>
                        <div className="h-full w-full rounded-lg border-2 border-slate-400 p-3 flex flex-col gap-2 shadow-inner bg-slate-50 dark:bg-slate-800">
                           <div className="h-4 w-1/2 bg-slate-400 rounded-sm"></div>
                           <div className="h-1 w-full bg-slate-300 rounded-full mt-2"></div>
                           <div className="h-1 w-5/6 bg-slate-300 rounded-full"></div>
                           <div className="h-1 w-4/6 bg-slate-300 rounded-full"></div>
                           <div className="h-2 w-1/3 bg-slate-400 rounded-sm mt-2"></div>
                           <div className="h-1 w-full bg-slate-300 rounded-full"></div>
                           <div className="h-1 w-full bg-slate-300 rounded-full"></div>
                        </div>
                      </div>
                      
                      <div className="relative z-10 flex flex-col justify-end h-full pointer-events-none">
                        <div className="flex items-center gap-4">
                          <div className="flex h-12 w-12 items-center justify-center rounded-[16px] bg-blue-50 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 shadow-sm">
                            <FileText className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-sm font-black text-slate-900 dark:text-white">Academic CV</p>
                            <p className="text-xs font-bold text-slate-500 mt-1">Full Work History</p>
                          </div>
                        </div>
                      </div>
                      
                      {!isPremiumDataUnlocked && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/40 dark:bg-black/50 backdrop-blur-sm transition-all group-hover:backdrop-blur-md z-20">
                           <div className="relative group/btn">
                             <div className="absolute -inset-1.5 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 opacity-60 blur-lg group-hover/btn:opacity-100 transition-opacity duration-300 animate-pulse"></div>
                             <div className="relative flex items-center gap-2.5 rounded-full bg-slate-900 dark:bg-white px-6 py-3.5 shadow-2xl transform transition-transform group-hover/btn:scale-105">
                               <Lock className="h-4 w-4 text-blue-400 dark:text-blue-600" />
                               <span className="text-xs font-black text-white dark:text-slate-900 uppercase tracking-widest">Unlock CV</span>
                             </div>
                           </div>
                        </div>
                      )}
                    </button>
                  )}

                  {(tutor.id_url || tutor.has_id) && (
                    <button 
                      onClick={() => setShowIdModal(true)}
                      aria-label="View identity verification status"
                      className="group relative overflow-hidden rounded-[32px] border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 transition-all hover:border-emerald-300 dark:hover:border-emerald-500/50 hover:shadow-xl text-left h-48"
                    >
                      <div className={cn("absolute right-4 top-1/2 -translate-y-1/2 w-[55%] h-24 opacity-20 transition-all duration-500", !isPremiumDataUnlocked && "blur-[2px] group-hover:blur-[4px]")}>
                        <div className="h-full w-full rounded-xl border-2 border-slate-400 p-2 flex items-start gap-2 shadow-sm bg-slate-50 dark:bg-slate-800 rotate-[-5deg]">
                           <div className="h-10 w-10 bg-slate-400 rounded-md shrink-0"></div>
                           <div className="flex-1 space-y-1.5 pt-1">
                             <div className="h-2 w-3/4 bg-slate-400 rounded-sm"></div>
                             <div className="h-1 w-full bg-slate-300 rounded-full"></div>
                             <div className="h-1 w-1/2 bg-slate-300 rounded-full"></div>
                             <div className="flex gap-1 mt-2">
                               <div className="h-4 w-4 bg-slate-300 rounded-full"></div>
                               <div className="h-1 w-1/3 bg-slate-300 rounded-full mt-1.5"></div>
                             </div>
                           </div>
                        </div>
                      </div>
                      
                      <div className="relative z-10 flex flex-col justify-end h-full pointer-events-none">
                        <div className="flex items-center gap-4">
                          <div className="flex h-12 w-12 items-center justify-center rounded-[16px] bg-emerald-50 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 shadow-sm">
                            <BadgeCheck className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-sm font-black text-slate-900 dark:text-white">Government ID</p>
                            <p className="text-xs font-bold text-slate-500 mt-1">Identity Verified</p>
                          </div>
                        </div>
                      </div>
                      
                      {!isPremiumDataUnlocked && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/40 dark:bg-black/50 backdrop-blur-sm transition-all group-hover:backdrop-blur-md z-20">
                           <div className="relative group/btn">
                             <div className="absolute -inset-1.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 opacity-60 blur-lg group-hover/btn:opacity-100 transition-opacity duration-300 animate-pulse"></div>
                             <div className="relative flex items-center gap-2.5 rounded-full bg-slate-900 dark:bg-white px-6 py-3.5 shadow-2xl transform transition-transform group-hover/btn:scale-105">
                               <Lock className="h-4 w-4 text-emerald-400 dark:text-emerald-600" />
                               <span className="text-xs font-black text-white dark:text-slate-900 uppercase tracking-widest">Verify ID</span>
                             </div>
                           </div>
                        </div>
                      )}
                    </button>
                  )}
                </div>
              </motion.section>
            )}
          </div>

          <aside className="hidden lg:block lg:sticky lg:top-28 lg:self-start z-10">
            <div className="rounded-[40px] border border-white/60 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-8 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.14)] dark:shadow-none">

              <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Tutor Fees</h3>
              <p className="mt-2 text-sm font-bold text-slate-400 dark:text-slate-500 leading-relaxed">
                Quoted Fee | May Vary
              </p>

              <div className="mt-8 mb-8 rounded-[24px] bg-slate-50/80 dark:bg-slate-800 p-6 border border-slate-100 dark:border-slate-700 text-center shadow-inner">
                 <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Hourly Fee Rate</p>
                 <div className="flex items-baseline justify-center gap-1">
                   <span className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Rs. {tutor.hour_rate || 'N/A'}</span>
                 </div>
              </div>

              <div className="space-y-4">
                <div 
                  role="button"
                  tabIndex={0}
                  aria-label="Request direct phone number"
                  onClick={() => handleLockedAction('phone')}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleLockedAction('phone') }}
                  className="cursor-pointer group flex items-center justify-between rounded-[24px] border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 transition-all duration-300 hover:border-indigo-400 dark:hover:border-indigo-500 hover:shadow-lg hover:-translate-y-0.5"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-slate-50 dark:bg-slate-800 text-slate-400 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-500/20 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors shrink-0">
                      <Phone className="h-5 w-5" />
                    </div>
                    <div className="pt-0.5 overflow-hidden">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 leading-none mb-1.5">Direct Phone</p>
                      
                      <div className="relative flex items-center h-7 w-full overflow-hidden">
                        {isPremiumDataUnlocked ? (
                          <p className="text-base font-black tracking-widest text-slate-900 dark:text-white">
                            {tutor.contact_num}
                          </p>
                        ) : (
                          <div className="flex items-center gap-2">
                            <p className="text-base font-black tracking-wider text-slate-800 dark:text-slate-200 opacity-50 select-none" aria-hidden="true">
                              {getMaskedPhone(tutor.contact_num)}
                            </p>
                            <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 group-hover:border-indigo-300 dark:group-hover:border-indigo-500/40 transition-colors shadow-sm whitespace-nowrap shrink-0">
                              <Lock className="h-3 w-3 text-indigo-500 dark:text-indigo-400 shrink-0" />
                              <span className="text-[9px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400">Locked</span>
                            </div>
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
                  className="group flex w-full items-center justify-center gap-2 rounded-[24px] bg-gradient-to-r from-blue-600 to-indigo-600 py-4 text-sm font-black text-white transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-500/25 active:scale-95"
                >
                  <Send className="h-5 w-5 transition-transform duration-300 group-hover:-translate-y-1 group-hover:translate-x-1" />
                  Request Booking
                </Link>
              </div>
              
              <div className="mt-8 flex flex-col items-center gap-3 border-t border-slate-100 dark:border-slate-800 pt-6">
                 <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                   <ShieldCheck className="h-4 w-4 text-slate-300 dark:text-slate-600" /> Secure via GyanHub
                 </div>
                 {memberSince && (
                   <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 dark:text-slate-500">
                     <CalendarDays className="h-3.5 w-3.5" /> Joined {memberSince}
                   </div>
                 )}
              </div>
            </div>
          </aside>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/80 dark:bg-slate-900/90 backdrop-blur-xl border-t border-slate-200/50 dark:border-slate-800 p-4 lg:hidden shadow-[0_-10px_40px_rgba(0,0,0,0.05)] pb-safe">
         <div className="mx-auto max-w-md flex items-center justify-between gap-4">
            <div className="flex-1">
               <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Hourly Rate</p>
               <p className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Rs. {tutor.hour_rate || 'N/A'}</p>
            </div>
            <Link 
              href={`/tutors/${rawSlug}/book`}
              onClick={triggerHaptic}
              aria-label={`Book a session with ${tutor.name}`}
              className="group flex items-center justify-center gap-2 rounded-[20px] bg-gradient-to-r from-blue-600 to-indigo-600 px-7 py-4 text-sm font-black text-white shadow-lg shadow-blue-500/25 active:scale-95 transition-all"
            >
              <Send className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" /> 
              Book Now
            </Link>
         </div>
      </div>

    </main>
  );
}