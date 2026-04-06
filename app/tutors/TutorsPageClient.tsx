'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronRight,
  ChevronLeft,
  MapPin,
  Search,
  User,
  Plus,
  ShieldCheck,
  CheckCircle2,
  Eye,
  X,
  GraduationCap,
  Filter,
  SlidersHorizontal
} from 'lucide-react';

type Tutor = {
  id: number | string;
  name?: string | null;
  subject?: string | any[] | null;
  subjects?: string[] | string | null;
  expertise?: string | null;
  avatar_url?: string | null;
  photo?: string | null;
  verified?: boolean | null;
  location?: string | null;
  education?: string | null;
  experience?: number | string | null;
  bio?: string | null;
  rating?: number | string | null;
  hour_rate?: number | string | null; 
  availability?: boolean;
  mode_of_teaching?: string | null;
};

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

function parseRate(tutor: Tutor) {
  const rate = Number(tutor.hour_rate); 
  if (!Number.isNaN(rate) && rate > 0) return `Rs. ${rate}/hr`;
  return 'Rate on request';
}

// [SEO FIX] Helper function to generate SEO-friendly URLs
const generateSeoSlug = (tutor: Tutor) => {
  if (!tutor) return '';
  const name = tutor.name || 'tutor';
  const subject = Array.isArray(tutor.subject) 
    ? tutor.subject[0] 
    : (tutor.subject || (Array.isArray(tutor.subjects) ? tutor.subjects[0] : tutor.subjects) || 'expert');
  
  // Combine, make lowercase, and replace spaces/symbols with hyphens
  const safeString = `${name}-${subject}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  
  return `${tutor.id}-${safeString}`;
};

function SkeletonCard() {
  return (
    <div className="flex flex-col justify-between h-full rounded-[24px] border-2 border-slate-200/50 bg-white/70 backdrop-blur-md p-6 animate-pulse">
      <div>
        <div className="flex items-start gap-4">
          <div className="h-20 w-20 shrink-0 rounded-[24px] bg-slate-200/50" />
          <div className="flex-1 space-y-3 pt-1">
            <div className="h-6 w-3/4 rounded-lg bg-slate-200/50" />
            <div className="flex gap-2">
              <div className="h-6 w-20 rounded-lg bg-slate-100/50" />
              <div className="h-6 w-24 rounded-lg bg-slate-100/50" />
            </div>
          </div>
        </div>
        <div className="mt-6 flex gap-4">
          <div className="h-4 w-24 rounded bg-slate-100/50" />
          <div className="h-4 w-28 rounded bg-slate-100/50" />
        </div>
        <div className="mt-5 space-y-2">
          <div className="h-3 w-full rounded bg-slate-50" />
          <div className="h-3 w-5/6 rounded bg-slate-50" />
        </div>
      </div>
      <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-5">
        <div className="space-y-2">
          <div className="h-2 w-16 rounded bg-slate-100" />
          <div className="h-6 w-24 rounded bg-slate-200" />
        </div>
        <div className="flex gap-2 w-32 h-10 rounded-xl bg-slate-100" />
      </div>
    </div>
  );
}

function TutorCard({ tutor, onQuickView }: { tutor: Tutor; onQuickView: (t: Tutor) => void }) {
  const router = useRouter();
  const [imageError, setImageError] = useState(false);
  const avatarUrl = tutor.avatar_url || tutor.photo;
  
  const displaySubject = Array.isArray(tutor.subject) 
    ? tutor.subject[0] 
    : tutor.subject || (Array.isArray(tutor.subjects) ? tutor.subjects[0] : tutor.subjects) || 'Expert Tutor';

  const borderStyles = !tutor.availability 
    ? "border-2 border-red-500 shadow-red-500/10 hover:border-red-600" 
    : tutor.verified 
      ? "border-2 border-blue-500 shadow-blue-500/10 hover:border-blue-600" 
      : "border-2 border-slate-200/50 hover:border-indigo-300";

  return (
    <div 
      // [SEO FIX] Use generateSeoSlug for programmatic routing
      onClick={() => router.push(`/tutors/${generateSeoSlug(tutor)}`)}
      className={cn(
        "cursor-pointer group flex flex-col justify-between h-full rounded-3xl bg-white/70 backdrop-blur-md p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-blue-500/10 relative overflow-hidden",
        borderStyles
      )}
    >
      
      <div className={cn(
        "absolute top-5 right-5 flex items-center gap-2 rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide shadow-sm z-10 bg-white border",
        tutor.availability 
          ? "border-emerald-100 text-emerald-700" 
          : "border-red-100 text-red-500" 
      )}>
        {tutor.availability ? (
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
        ) : (
           <span className="relative inline-flex rounded-full h-2 w-2 bg-red-400"></span>
        )}
        {tutor.availability ? "Live" : "Busy"}
      </div>

      <div>
        <div className="flex items-start gap-5">
          <div className="relative shrink-0 overflow-hidden shadow-sm border border-slate-100/50 bg-white" style={{ borderRadius: '24px' }}>
            {avatarUrl && !imageError ? (
              <img
                src={avatarUrl}
                alt={`${tutor.name || 'Expert'} - Verified Tutor in Nepal`}
                onError={() => setImageError(true)}
                className="h-20 w-20 object-cover transition-transform duration-700 group-hover:scale-110"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center bg-slate-50 text-slate-400 transition-transform duration-700 group-hover:scale-110">
                <User className="h-8 w-8" />
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1 pt-1">
            <div className="flex items-center gap-2">
               <h2 className="text-xl font-black tracking-tight text-slate-900 truncate">
                {tutor.name}
              </h2>
              {tutor.verified && (
                <div className="group/tooltip relative flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full bg-blue-500/20 animate-pulse"></div>
                  <ShieldCheck className="h-5 w-5 text-blue-600 drop-shadow-sm shrink-0 cursor-help relative z-10" />
                  <div className="absolute bottom-full mb-2 hidden group-hover/tooltip:block w-48 text-center rounded-xl bg-slate-900 px-3 py-2 text-[11px] font-medium text-white shadow-xl z-20">
                    GyanHub Top Rated & Verified
                  </div>
                </div>
              )}
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="rounded-lg bg-blue-50/80 border border-blue-100 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-blue-700">
                {displaySubject}
              </span>
              {tutor.education && (
                <span className="flex items-center gap-1.5 rounded-lg bg-slate-50 border border-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                  <GraduationCap className="h-3.5 w-3.5 text-slate-400" />
                  {tutor.education}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center gap-5 text-sm font-medium text-slate-600">
          <div className="flex items-center gap-1.5">
            <MapPin className="h-4 w-4 text-orange-500" /> 
            {tutor.location || 'N/A'}
          </div>
          <div className={cn(
            "flex items-center gap-1.5",
            tutor.availability ? "text-emerald-600" : "text-slate-400"
          )}>
            <CheckCircle2 className="h-4 w-4" /> 
            {tutor.availability ? 'Ready to Teach' : 'Currently Booked'}
          </div>
        </div>

        <p className="mt-4 text-sm leading-[1.6] text-slate-500 line-clamp-2">
          "{tutor.bio || 'Professional tutor dedicated to student excellence.'}"
        </p>
      </div>

      <div className="mt-6 flex flex-col gap-4 border-t border-slate-100/80 pt-5">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1">Hourly Rate</p>
          <p className="text-2xl font-black tracking-tight text-indigo-600">{parseRate(tutor)}</p>
        </div>
        
        <div className="flex gap-2 w-full">
          <button 
            onClick={(e) => { 
              e.stopPropagation();
              e.preventDefault(); 
              onQuickView(tutor); 
            }}
            aria-label={`Quick view profile for ${tutor.name || 'this tutor'}`}
            className="flex flex-1 h-11 items-center justify-center gap-2 rounded-xl bg-slate-50 border border-slate-200/60 text-sm font-bold text-slate-600 transition-all hover:bg-slate-100 hover:text-slate-900 active:scale-95"
          >
            <Eye className="h-4 w-4" /> View Info
          </button>
          <Link 
            // [SEO FIX] Use generateSeoSlug for Link href
            href={`/tutors/${generateSeoSlug(tutor)}`}
            onClick={(e) => e.stopPropagation()}
            aria-label={`Go to full profile for ${tutor.name || 'this tutor'}`}
            className="flex flex-1 h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-sm font-bold text-white transition-all hover:shadow-lg hover:shadow-indigo-500/25 active:scale-95"
          >
            Profile <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function TutorsPageClient() {
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasProfile, setHasProfile] = useState(false);
  const [quickViewTutor, setQuickViewTutor] = useState<Tutor | null>(null);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  
  const [subjectSearch, setSubjectSearch] = useState('');
  const [location, setLocation] = useState('All');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [maxRate, setMaxRate] = useState<number>(5000);

  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 4;

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const { data: tutorData } = await supabase
        .from('tutors')
        .select('*')
        .order('id', { ascending: false });

      if (tutorData) setTutors(tutorData as Tutor[]);

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: existingProfile } = await supabase
          .from('tutors')
          .select('id')
          .eq('contact_num', user.user_metadata?.phone || '') 
          .maybeSingle();
        
        if (existingProfile) setHasProfile(true);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  const filteredTutors = useMemo(() => {
    return tutors.filter((tutor) => {
      let subjectStr = '';
      if (Array.isArray(tutor.subject)) {
        subjectStr = tutor.subject.join(' ').toLowerCase();
      } else {
        subjectStr = String(tutor.subject || '').toLowerCase();
      }

      const searchStr = subjectSearch.toLowerCase().trim();
      const matchesSubject = !searchStr || subjectStr.includes(searchStr);
      const matchesLocation = location === 'All' || String(tutor.location || '').toLowerCase() === location.toLowerCase();
      const matchesVerified = !verifiedOnly || tutor.verified === true;
      const rate = Number(tutor.hour_rate);
      const matchesRate = Number.isNaN(rate) || rate <= maxRate;

      return matchesSubject && matchesLocation && matchesVerified && matchesRate;
    });
  }, [tutors, subjectSearch, location, verifiedOnly, maxRate]);

  const totalPages = Math.ceil(filteredTutors.length / ITEMS_PER_PAGE);
  const paginatedTutors = filteredTutors.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div className="relative min-h-screen bg-[#F8FAFC] px-4 py-8 sm:px-6 lg:px-8 font-sans overflow-hidden">
      
      {/* Gradient Background Accents */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-blue-400/20 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-purple-400/20 blur-[140px]" />
      </div>

      <div className="relative z-10 sticky top-0 mx-auto max-w-7xl bg-[#F8FAFC]/80 py-4 backdrop-blur-xl border-b border-slate-200/50 lg:border-none lg:bg-transparent lg:backdrop-blur-none lg:py-6 lg:mb-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">
              Find Verified <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Tutors in Nepal</span>
            </h1>
            <div className="mt-3 max-w-2xl text-slate-600 font-medium space-y-2">
              <p>
                Looking for expert <strong>coaching in Nepal</strong> or a dedicated <strong>private tutor online</strong>? GyanHub connects students with top-rated educators for personalized learning.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsMobileFilterOpen(!isMobileFilterOpen)}
              aria-label="Toggle mobile search filters"
              aria-expanded={isMobileFilterOpen}
              className="lg:hidden flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-white px-4 text-sm font-bold text-slate-700 shadow-sm border border-slate-200"
            >
              <Filter className="h-4 w-4" /> Filters
            </button>

            {!hasProfile && (
              <Link 
                href="/post-tutor"
                className="group flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 text-sm font-bold text-white shadow-lg shadow-blue-500/20 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-500/30 active:scale-95"
              >
                <Plus className="h-5 w-5 transition-transform duration-300 group-hover:rotate-90" />
                Become a Tutor
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="relative z-10 mx-auto mt-6 max-w-7xl">
        <div className="flex flex-col lg:grid lg:grid-cols-[320px_1fr] gap-8">
          
          <aside className={cn(
            "lg:block transition-all duration-300",
            isMobileFilterOpen ? "block" : "hidden"
          )}>
             <div className="sticky top-28 rounded-3xl border border-white/60 bg-white/70 p-6 shadow-xl shadow-slate-200/40 backdrop-blur-md space-y-7">
                <div className="sticky top-0 z-20 bg-white/70 backdrop-blur-md pb-4 -mt-2 pt-2 flex items-center gap-3 border-b border-slate-100/80">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                    <SlidersHorizontal className="h-4 w-4" />
                  </div>
                  <h2 className="text-sm font-black uppercase tracking-widest text-slate-900">Search Filters</h2>
                </div>
                
                <button 
                  onClick={() => setVerifiedOnly(!verifiedOnly)}
                  aria-label="Show verified tutors only"
                  aria-pressed={verifiedOnly}
                  className={cn(
                    "flex w-full items-center justify-between rounded-2xl border p-4 transition-all active:scale-[0.98]",
                    verifiedOnly ? "border-indigo-200 bg-indigo-50/80" : "border-slate-100 bg-white/50"
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className={cn("h-5 w-5 transition-colors", verifiedOnly ? "text-indigo-600" : "text-slate-400")} />
                    <span className={cn("text-sm font-bold transition-colors", verifiedOnly ? "text-indigo-900" : "text-slate-600")}>Verified Tutors</span>
                  </div>
                  <div className={cn("h-6 w-11 rounded-full relative transition-colors duration-300 shadow-inner", verifiedOnly ? "bg-indigo-600" : "bg-slate-200")}>
                    <div className={cn("absolute top-1 h-4 w-4 rounded-full bg-white transition-all duration-300 shadow-sm", verifiedOnly ? "right-1" : "left-1")} />
                  </div>
                </button>

                <div className="space-y-6">
                  <div>
                    <label htmlFor="subject-search" className="text-[11px] font-black uppercase tracking-widest text-slate-500 mb-3 block">Search Subject</label>
                    <div className="relative group">
                      <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-blue-500" />
                      <input 
                        id="subject-search"
                        name="subjectSearch"
                        type="text" 
                        placeholder="e.g. Mathematics, React..." 
                        aria-label="Search tutors by subject"
                        className="w-full rounded-2xl border border-slate-200 bg-white/50 p-3.5 pl-11 text-sm font-medium text-slate-900 outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                        value={subjectSearch}
                        onChange={(e) => setSubjectSearch(e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="location-filter" className="text-[11px] font-black uppercase tracking-widest text-slate-500 mb-3 block">Location</label>
                    <select 
                      id="location-filter"
                      name="location"
                      aria-label="Filter tutors by location"
                      className="w-full rounded-2xl border border-slate-200 bg-white/50 p-3.5 text-sm font-medium text-slate-900 outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 appearance-none"
                      style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: `right 1rem center`, backgroundRepeat: `no-repeat`, backgroundSize: `1.5em 1.5em` }}
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                    >
                      <option value="All">Everywhere (Nepal & Online)</option>
                      <option value="Kathmandu">Kathmandu</option>
                      <option value="Lalitpur">Lalitpur</option>
                      <option value="Bhaktapur">Bhaktapur</option>
                      <option value="Online">Online Sessions Only</option>
                    </select>
                  </div>

                  <div className="group relative">
                    <div className="flex justify-between items-end mb-4">
                      <label htmlFor="max-rate-slider" className="text-[11px] font-black uppercase tracking-widest text-slate-500 block">Max Hourly Rate</label>
                      <span className="rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-black text-indigo-700">Rs. {maxRate}</span>
                    </div>
                    <input 
                      id="max-rate-slider"
                      name="maxRate"
                      type="range" 
                      min="100" 
                      max="5000" 
                      step="100" 
                      aria-label="Adjust maximum hourly rate"
                      value={maxRate}
                      onChange={(e) => setMaxRate(Number(e.target.value))}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 hover:accent-indigo-500"
                    />
                  </div>
                </div>
             </div>
          </aside>

          <main>
            {loading ? (
              <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                {[...Array(4)].map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col h-full">
                <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                  <AnimatePresence mode="popLayout">
                    {paginatedTutors.length > 0 ? (
                      paginatedTutors.map((tutor, idx) => (
                        <motion.div
                          key={tutor.id}
                          layout
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ duration: 0.4, delay: idx * 0.05 }}
                        >
                          <TutorCard tutor={tutor} onQuickView={setQuickViewTutor} />
                        </motion.div>
                      ))
                    ) : (
                      <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        className="col-span-full py-24 text-center flex flex-col items-center justify-center rounded-[32px] border-2 border-dashed border-slate-200/60 bg-white/40 backdrop-blur-sm"
                      >
                        <div className="relative flex items-center justify-center w-24 h-24 mb-6">
                          <div className="absolute inset-0 bg-blue-100 rounded-full blur-xl opacity-60"></div>
                          <Search className="h-12 w-12 text-blue-500 relative z-10" />
                          <div className="absolute top-0 right-0 h-6 w-6 bg-yellow-400 rounded-full flex items-center justify-center shadow-sm z-20">
                            <span className="text-[10px] font-black text-white">?</span>
                          </div>
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 tracking-tight">No Tutors Found</h3>
                        <p className="mt-2 text-slate-500 font-medium">Try adjusting your filters to see more results.</p>
                        <button 
                          onClick={() => { setSubjectSearch(''); setLocation('All'); setVerifiedOnly(false); setMaxRate(5000); }}
                          className="mt-6 rounded-xl bg-slate-100 px-6 py-3 text-sm font-bold text-slate-700 hover:bg-slate-200 transition-all active:scale-95 shadow-sm"
                        >
                          Reset Filters
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {totalPages > 1 && (
                  <div className="mt-12 flex items-center justify-between border-t border-slate-200/60 pt-6 mb-8">
                    <button
                      onClick={() => { setCurrentPage(prev => Math.max(prev - 1, 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                      disabled={currentPage === 1}
                      aria-label="Go to previous page"
                      className="flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-slate-700 shadow-sm border border-slate-200/60 transition-hover hover:bg-slate-50 hover:shadow-md disabled:opacity-40 disabled:hover:shadow-sm"
                    >
                      <ChevronLeft className="h-4 w-4" /> Prev
                    </button>
                    <span className="text-sm font-semibold text-slate-500 bg-white/50 px-4 py-2 rounded-lg backdrop-blur-sm" aria-label={`Page ${currentPage} of ${totalPages}`}>
                      <strong className="text-slate-900">{currentPage}</strong> / <strong className="text-slate-900">{totalPages}</strong>
                    </span>
                    <button
                      onClick={() => { setCurrentPage(prev => Math.min(prev + 1, totalPages)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                      disabled={currentPage === totalPages}
                      aria-label="Go to next page"
                      className="flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-slate-700 shadow-sm border border-slate-200/60 transition-hover hover:bg-slate-50 hover:shadow-md disabled:opacity-40 disabled:hover:shadow-sm"
                    >
                      Next <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </main>
        </div>
      </div>

      <AnimatePresence>
        {quickViewTutor && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-lg rounded-[32px] bg-white p-8 shadow-2xl border border-white/20"
            >
              <button 
                onClick={() => setQuickViewTutor(null)} 
                aria-label="Close quick view modal"
                className="absolute right-6 top-6 rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
              <div className="flex items-center gap-5 mb-6">
                <img 
                  src={quickViewTutor.avatar_url || quickViewTutor.photo || ''} 
                  alt={`${quickViewTutor.name || 'Tutor'} Profile Picture`} 
                  className="h-20 w-20 rounded-3xl object-cover bg-slate-100 shadow-sm border border-slate-100" 
                />
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-2xl font-black tracking-tight text-slate-900">{quickViewTutor.name}</h3>
                    {quickViewTutor.verified && (
                      <div className="flex items-center justify-center rounded-full bg-blue-50 px-2 py-1 gap-1 border border-blue-100 mt-1">
                        <ShieldCheck className="h-4 w-4 text-blue-600" />
                        <span className="text-[10px] uppercase font-bold text-blue-600 tracking-wider">Verified</span>
                      </div>
                    )}
                  </div>
                  <p className="font-bold text-indigo-600 mt-1">{quickViewTutor.education || 'Expert Educator'}</p>
                </div>
              </div>
              
              <div className="bg-slate-50/80 p-5 rounded-2xl border border-slate-100 mb-8 max-h-60 overflow-y-auto">
                <p className="text-sm leading-[1.7] text-slate-600 break-words">
                  {quickViewTutor.bio || 'No bio provided.'}
                </p>
              </div>

              <Link 
                // [SEO FIX] Use generateSeoSlug for quick view modal Link href
                href={`/tutors/${generateSeoSlug(quickViewTutor)}`} 
                className="flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 py-4 text-sm font-bold text-white shadow-lg shadow-blue-500/25 transition-all hover:shadow-xl hover:-translate-y-0.5 active:scale-95"
              >
                View Full Profile
              </Link>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}