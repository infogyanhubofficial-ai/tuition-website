'use client';

import { 
  Search, User, Mail, Calendar, Linkedin, Copy, 
  CheckCircle2, Clock, BookOpen, ChevronRight, CalendarDays, ShieldCheck, AlertCircle, HelpCircle
} from 'lucide-react';
import { useState, useEffect, Suspense, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import Link from 'next/link'; 
import Image from 'next/image';
import confetti from 'canvas-confetti';


function CertificateContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const urlSearchQuery = searchParams.get('search') || '';

  const [searchQuery, setSearchQuery] = useState(urlSearchQuery);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(!!urlSearchQuery);
  const [results, setResults] = useState<any[]>([]);
  
  // 11. Copy-to-Clipboard Toast State
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
  const [stats, setStats] = useState({ alumni: 0, activeSyllabi: 0 });
  const [latestCourses, setLatestCourses] = useState<any[]>([]);

  const SUPABASE_STORAGE_URL = 'https://zuktarghyexwodqnnxlu.supabase.co/storage/v1/object/public/';

  // 6. Verification "Success" Sound
  const playSuccessSound = () => {
    // Note: Add a nice short 'ping.mp3' to your /public folder
    const audio = new Audio('/success-ping.mp3'); 
    audio.volume = 0.5;
    audio.play().catch(() => console.log('Audio autoplay prevented'));
  };

  useEffect(() => {
    const fetchInitialData = async () => {
      const [certCount, syllabiCount] = await Promise.all([
        supabase.from('certificates').select('*', { count: 'exact', head: true }),
        supabase.from('syllabi').select('*', { count: 'exact', head: true }).eq('status', 'active')
      ]);
      setStats({ alumni: certCount.count || 0, activeSyllabi: syllabiCount.count || 0 });

      const { data: courses } = await supabase
        .from('online-courses')
        .select('id, title, duration, start_datetime, cover_pic, fee')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(3);
      if (courses) setLatestCourses(courses);
    };
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (urlSearchQuery) {
      setSearchQuery(urlSearchQuery);
      executeSearch(urlSearchQuery);
    }
  }, [urlSearchQuery]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setHasSearched(true);
    router.push(`${pathname}?search=${encodeURIComponent(searchQuery.trim())}`, { scroll: false });
  };

  const handleQuickSearch = (query: string) => {
    setSearchQuery(query);
    setHasSearched(true);
    router.push(`${pathname}?search=${encodeURIComponent(query)}`, { scroll: false });
  };

  const executeSearch = async (query: string) => {
    setIsLoading(true);
    setHasSearched(true);
    
    const { data, error } = await supabase
      .from('certificates')
      .select(`id, name, email, issue_date, certificate_image, syllabus_name, syllabi:syllabus_id (duration)`)
      .or(`name.ilike.%${query}%,email.ilike.%${query}%`)
      .order('issue_date', { ascending: false, nullsFirst: false });

    if (!error && data) {
      setResults(data);
      if (data.length > 0) {
        triggerConfetti();
        playSuccessSound(); // Play sound on success
      }
    } else {
      setResults([]);
    }
    setTimeout(() => setIsLoading(false), 800);
  };

  const triggerConfetti = () => {
    confetti({ particleCount: 80, spread: 60, origin: { y: 0.65 }, colors: ['#3b82f6', '#10b981', '#DC143C'] });
  };

  const getImageUrl = (imagePath: string) => {
    if (!imagePath) return '/brand/placeholder-verify.png'; 
    if (imagePath.startsWith('http')) return imagePath;
    const cleanPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;
    return `${SUPABASE_STORAGE_URL}${cleanPath}`;
  };

  const getBaseUrl = () => typeof window !== 'undefined' ? window.location.origin : 'https://gyanhub.com.np';

  const copyToClipboard = (cert: any) => {
    const url = `${getBaseUrl()}/certificate/?name=${encodeURIComponent(cert.name)}&email=${encodeURIComponent(cert.email)}`;
    navigator.clipboard.writeText(url);
    setToastMessage('Link copied to clipboard! Share it with employers.');
    setTimeout(() => setToastMessage(null), 3500);
  };

  const openLinkedIn = (cert: any) => {
    const courseName = cert.syllabus_name || 'Professional Certification';
    const issueDate = new Date(cert.issue_date);
    const certUrl = `${getBaseUrl()}/certificate/?name=${encodeURIComponent(cert.name)}&email=${encodeURIComponent(cert.email)}`;
    const linkedInUrl = `https://www.linkedin.com/profile/add?startTask=CERTIFICATION_NAME&name=${encodeURIComponent(courseName)}&organizationName=GyanHub&issueYear=${issueDate.getFullYear()}&issueMonth=${issueDate.getMonth() + 1}&certUrl=${encodeURIComponent(certUrl)}`;
    window.open(linkedInUrl, '_blank', 'noopener,noreferrer');
  };

  // 7. Interactive Hover States (3D Tilt Logic)
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -4;
    const rotateY = ((x - centerX) / centerX) * 4;
    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    e.currentTarget.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg)`;
  };

  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-100 font-sans pb-20 selection:bg-blue-500/30">
      
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-slate-800/50 bg-gradient-to-b from-[#0F172A] to-[#1E293B]">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full overflow-hidden pointer-events-none opacity-30">
          <div className="absolute -top-24 -right-24 w-[500px] h-[500px] bg-[#0ea5e9] rounded-full blur-[120px]"></div>
          <div className="absolute top-48 -left-24 w-[400px] h-[400px] bg-[#DC143C] rounded-full blur-[120px] opacity-20"></div> 
        </div>

        <div className="relative max-w-7xl mx-auto px-4 py-24 lg:py-32 flex flex-col items-center gap-8 text-center">
          <div className="max-w-3xl space-y-8 z-10 w-full">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-serif font-bold tracking-tight leading-tight text-white">
              Verify Excellence. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-emerald-400">
                Instantly.
              </span>
            </h1>
            
            <form onSubmit={handleSearchSubmit} className="max-w-2xl mx-auto relative group">
              <div className="relative w-full rounded-2xl p-1.5 bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl transition-all focus-within:bg-white/10 focus-within:border-blue-500/50">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-slate-400 group-focus-within:text-blue-400 transition-colors" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Student Name or Registered Email..."
                  className="block w-full pl-12 pr-40 py-4 bg-transparent text-lg text-white outline-none placeholder:text-slate-500"
                  required
                />
                <div className="absolute inset-y-1.5 right-1.5 flex items-center">
                  <button
                    type="submit"
                    disabled={isLoading || !searchQuery.trim()}
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white px-8 py-3 rounded-xl font-medium transition-all h-full"
                  >
                    Authenticate
                  </button>
                </div>
              </div>

              {/* 4. Smart Search Suggestions */}
              {!hasSearched && (
                <div className="flex flex-wrap items-center justify-center gap-2 mt-4 text-sm text-slate-400">
                  <span className="mr-2 text-slate-500">Popular Queries:</span>
                  {['Civil Engineering', 'Nischal', 'AutoCAD'].map((chip) => (
                    <button 
                      key={chip} 
                      type="button" 
                      onClick={() => handleQuickSearch(chip)}
                      className="px-3 py-1 bg-slate-800/50 hover:bg-blue-500/20 hover:text-blue-400 border border-slate-700/50 rounded-full transition-colors cursor-pointer"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              )}
            </form>
          </div>
        </div>
      </section>

      {/* Dynamic Results Section */}
      {(hasSearched || urlSearchQuery) && (
        <section className="max-w-5xl mx-auto px-4 py-16 min-h-[500px]">
          <div className="flex items-center justify-between mb-8 border-b border-slate-800 pb-4">
            {/* 9. Micro-Copy Refinement */}
            <h2 className="text-2xl font-serif font-bold flex items-center gap-3 text-white">
              Credential Authenticated
            </h2>
          </div>

          {isLoading ? (
             /* 1. Skeleton Loading States */
             <div className="grid gap-8">
               {[1, 2, 3].map((i) => (
                 <div key={i} className="bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-2xl p-6 flex flex-col md:flex-row gap-8 animate-pulse">
                   <div className="w-full md:w-72 aspect-[4/3] bg-slate-800/80 rounded-xl"></div>
                   <div className="flex-1 space-y-5 w-full py-2">
                     <div className="h-6 w-32 bg-slate-800/80 rounded-full"></div>
                     <div className="h-8 w-3/4 bg-slate-800/80 rounded-md"></div>
                     <div className="grid grid-cols-[100px_1fr] gap-4">
                        <div className="h-4 w-20 bg-slate-800/80 rounded"></div>
                        <div className="h-4 w-40 bg-slate-800/80 rounded"></div>
                        <div className="h-4 w-20 bg-slate-800/80 rounded"></div>
                        <div className="h-4 w-32 bg-slate-800/80 rounded"></div>
                     </div>
                   </div>
                 </div>
               ))}
             </div>
          ) : results.length > 0 ? (
            <div className="grid gap-8">
              {results.map((cert) => (
                /* 3. Glassmorphism & 7. 3D Tilt */
                <div 
                  key={cert.id} 
                  onMouseMove={handleMouseMove}
                  onMouseLeave={handleMouseLeave}
                  style={{ transition: 'transform 0.1s ease-out' }}
                  className="group relative bg-slate-900/40 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-2xl flex flex-col md:flex-row gap-8 overflow-hidden z-10"
                >
                  <div className="absolute -bottom-6 -right-6 text-8xl font-black text-white/[0.02] pointer-events-none -rotate-12 select-none">OFFICIAL</div>

                  {/* 14. Responsive Card Stacks (Image adjusts width on mobile) */}
                  <div className="w-full md:w-72 aspect-[4/3] rounded-xl overflow-hidden border border-slate-600/50 flex-shrink-0 relative bg-slate-800">
                    {/* 2. Next.js Image Component */}
                    <Image 
                      src={getImageUrl(cert.certificate_image)} 
                      alt="Verified Certificate" 
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                      placeholder="blur"
                      // Tiny base64 placeholder for instant blurry loading
                      blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="
                    />
                  </div>
                  
                  <div className="flex-1 space-y-5 w-full z-10">
                    
                    {/* 13. "Verified" Badge Branding */}
                    <div className="flex items-center gap-2 bg-gradient-to-r from-emerald-900/40 to-emerald-800/20 w-fit px-4 py-1.5 rounded-full border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2L14.8 5H19V9.2L22 12L19 14.8V19H14.8L12 22L9.2 19H5V14.8L2 12L5 9.2V5H9.2L12 2Z" fill="#10B981" stroke="#059669" strokeWidth="1.5" strokeLinejoin="round"/>
                        <path d="M9 12L11 14L15 10" stroke="#0F172A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Institutionally Verified</span>
                    </div>
                    
                    <h3 className="text-2xl md:text-3xl font-serif font-bold text-white leading-tight">
                      {cert.syllabus_name || 'Professional Certification'} 
                    </h3>
                    
                    {/* 12. Vertical Data Alignment (CSS Grid Table) */}
                    <div className="grid grid-cols-[100px_1fr] gap-y-3 gap-x-4 text-sm bg-slate-900/60 p-5 rounded-xl border border-slate-800/80">
                      <div className="font-medium text-slate-500 flex items-center gap-2"><User className="w-4 h-4"/> Name</div>
                      <div className="font-bold text-white tracking-wide">{cert.name}</div>
                      
                      <div className="font-medium text-slate-500 flex items-center gap-2"><Mail className="w-4 h-4"/> Email</div>
                      <div className="text-slate-300 truncate">{cert.email}</div>
                      
                      <div className="font-medium text-slate-500 flex items-center gap-2"><Calendar className="w-4 h-4"/> Granted</div>
                      <div className="text-slate-300">{cert.issue_date ? new Date(cert.issue_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}</div>
                      
                      <div className="font-medium text-slate-500 flex items-center gap-2"><Clock className="w-4 h-4"/> Duration</div>
                      <div className="text-slate-300">{(cert.syllabi as any)?.duration || 'Standard Program'}</div>
                    </div>

                    <div className="pt-2 flex flex-wrap gap-3">
                      <button onClick={() => copyToClipboard(cert)} className="inline-flex items-center gap-2 px-6 py-2.5 bg-slate-800 border border-slate-700 hover:bg-slate-700 text-white text-sm font-semibold rounded-xl transition-colors">
                        <Copy className="w-4 h-4" /> Copy Record Link
                      </button>
                      
                      {/* 8. Enhanced LinkedIn Button */}
                      <button onClick={() => openLinkedIn(cert)} className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#0077b5] hover:bg-[#005885] text-white text-sm font-semibold rounded-xl transition-colors shadow-lg shadow-[#0077b5]/20">
                        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                        Add to Profile
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              
              {/* 15. Trust Footer */}
              <div className="text-center mt-12 text-sm text-slate-500 bg-slate-900/30 py-4 rounded-xl border border-slate-800/50">
                <ShieldCheck className="w-4 h-4 inline-block mr-2 text-slate-600" />
                This registry is strictly maintained by GyanHub. For disputes or missing records, <a href="/contact" className="text-blue-400 hover:underline">contact our verification office</a>.
              </div>
            </div>
          ) : (
            /* 10. Empty State Illustration */
            <div className="text-center py-20 bg-slate-900/40 backdrop-blur-md rounded-3xl border border-slate-800 shadow-2xl flex flex-col items-center">
              <div className="relative w-32 h-32 mb-6 opacity-80">
                {/* Clean inline SVG Map & Magnifying Glass */}
                <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M140 140C167.614 140 190 117.614 190 90C190 62.3858 167.614 40 140 40C112.386 40 90 62.3858 90 90C90 117.614 112.386 140 140 140Z" stroke="#3B82F6" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M104.645 104.645L40 169.289" stroke="#3B82F6" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round"/>
                  <rect x="30" y="50" width="80" height="60" rx="4" stroke="#475569" strokeWidth="4" strokeDasharray="8 8"/>
                </svg>
              </div>
              <h3 className="text-2xl font-serif font-bold text-slate-200 mb-2">No Verified Records Found</h3>
              <p className="text-slate-400 mb-8 max-w-md mx-auto">We couldn't authenticate a certificate matching the criteria provided.</p>
              
              <div className="bg-[#0F172A] border border-slate-800 p-6 rounded-2xl max-w-sm mx-auto text-left shadow-inner">
                <h4 className="font-semibold text-sm text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2"><HelpCircle className="w-4 h-4 text-blue-400"/> Troubleshooting</h4>
                <ul className="space-y-3 text-sm text-slate-400">
                  <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5"></div> Ensure exact spelling matching their official ID.</li>
                  <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5"></div> Try the exact email used during initial registration.</li>
                </ul>
              </div>
            </div>
          )}
        </section>
      )}

      {/* 11. Copy-to-Clipboard Feedback (Toast) */}
      <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 transform ${toastMessage ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0 pointer-events-none'}`}>
        <div className="bg-emerald-500 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 font-medium border border-emerald-400">
          <CheckCircle2 className="w-5 h-5 text-white" />
          {toastMessage}
        </div>
      </div>
    </div>
  );
}

// Change it to this:
export default function CertificateClient({ certificate }: { certificate: any }) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0F172A] flex items-center justify-center text-blue-500 animate-pulse">Loading Registry...</div>}>
      <CertificateContent />
    </Suspense>
  );
}