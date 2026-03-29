// app/onlinecourse/[id]/CourseDetailClient.tsx
"use client";

import { useEffect, useState, use, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import NepaliDate from 'nepali-date-converter'; 
import { 
  Calendar, Clock, BadgeCheck, ShieldCheck,
  User, SearchX, Sparkles, Zap, HelpCircle, CheckCircle2, Users,
  FileText, Star, Target, Briefcase, TrendingUp, MonitorPlay, BookOpen, Shield, Award, ChevronLeft
} from "lucide-react";

// --- Types ---
interface Course {
  id: string;
  title: string;
  fee: number;
  discount?: number;
  start_datetime?: string;
  duration?: string;
  timing?: string;
  demo_video_url?: string;
  cover_pic?: string;
  syllabus_url?: string;
  learning_outcomes?: any;
  faqs?: any;
  tutor_pic_url?: string;
  tutor_name?: string;
  tutor_bio?: string;
  certificate_url?: string;
}

interface StudentAvatar {
  full_name?: string;
  avatar_url?: string;
}

// --- Reusable Components ---
const Badge = ({ icon: Icon, title, value, colorClass, bgColorClass, borderColorClass }: any) => (
  <div className={`flex items-center gap-3 ${bgColorClass} border ${borderColorClass} px-5 py-4 rounded-2xl transition-transform hover:-translate-y-1 duration-300`}>
    <div className={`p-2 rounded-xl bg-white/10 ${colorClass}`}>
      <Icon className="w-5 h-5 opacity-90" aria-hidden="true" />
    </div>
    <div className="flex flex-col">
      <span className={`text-[10px] ${colorClass} opacity-80 font-black uppercase tracking-[0.2em]`}>{title}</span>
      <span className="text-white font-bold text-sm md:text-base mt-0.5">{value}</span>
    </div>
  </div>
);

const EnrollButton = ({ onClick, children, className = "" }: any) => (
  <button 
    onClick={onClick}
    aria-label="Enroll in course"
    className={`px-10 py-5 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-black rounded-2xl text-xl shadow-[0_10px_30px_rgba(249,115,22,0.3)] hover:shadow-[0_15px_40px_rgba(249,115,22,0.5)] hover:-translate-y-1 active:scale-95 transition-all duration-300 ${className}`}
  >
    {children}
  </button>
);

export function CourseDetailClient({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  
  // Safely decode the course name to handle spaces (%20) and special characters
  const decodedCourseName = useMemo(() => {
    try {
      return decodeURIComponent(resolvedParams.id);
    } catch (e) {
      return resolvedParams.id;
    }
  }, [resolvedParams.id]);

  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  
  const [avatars, setAvatars] = useState<StudentAvatar[]>([]);
  const [avatarsLoading, setAvatarsLoading] = useState(true);
  
  // Realistic Seat Drop
  const [seats, setSeats] = useState(20); 
  const [lastUpdated, setLastUpdated] = useState(1);

  const [courseCountdown, setCourseCountdown] = useState({ days: 0, hours: 0, mins: 0, secs: 0 });
  const [scrollProgress, setScrollProgress] = useState(0);

  // Randomized Course Tag
  const [courseTag, setCourseTag] = useState({ text: "Bestseller Course", icon: Zap });

  // Set Random Tag on Mount to prevent Hydration errors
  useEffect(() => {
    const tags = [
      { text: "Bestseller Course", icon: Zap },
      { text: "Highest Rated Course", icon: Star },
      { text: "High Demand Course", icon: TrendingUp },
      { text: "Industry Favorite", icon: Award }
    ];
    setCourseTag(tags[Math.floor(Math.random() * tags.length)]);
  }, []);

  // Realistic Urgency Simulator
  useEffect(() => {
    const seatInterval = setInterval(() => {
      setSeats(prev => {
        if (prev <= 2) return 2; 
        return prev - Math.floor(Math.random() * 3 + 1);
      });
      setLastUpdated(prev => prev < 15 ? prev + Math.floor(Math.random() * 3 + 1) : 2);
    }, 25000);
    return () => clearInterval(seatInterval);
  }, []);

  const handleBookSeat = () => {
    // Encodes the string back to handle spaces safely in the URL
    router.push(`/onlinecourse/${encodeURIComponent(decodedCourseName)}/enroll`);
  };

  const getEmbedUrl = (url: string) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    const videoId = (match && match[2].length === 11) ? match[2] : null;
    return videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0` : null;
  };

  const formatEnglishDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  const getNepaliDateLine = (dateString?: string) => {
    if (!dateString) return "नयाँ ब्याच चाँडै सुरु हुँदैछ";
    try {
      const adDate = new Date(dateString);
      const bsDate = new NepaliDate(adDate);
      const nepaliDays = ['आइतबार', 'सोमबार', 'मंगलबार', 'बुधबार', 'बिहीबार', 'शुक्रबार', 'शनिबार'];
      return `नयाँ ब्याच सुरु हुँदैछ: ${bsDate.format('MMMM D, YYYY')} (${nepaliDays[adDate.getDay()]})`;
    } catch (e) {
      return "नयाँ ब्याच चाँडै सुरु हुँदैछ";
    }
  };

  const smartExtract = (data: any, expectedKey: string): any[] => {
    if (!data) return [];
    let current = data;
    while (typeof current === 'string') {
      try { current = JSON.parse(current); } catch (e) { break; }
    }
    if (current && typeof current === 'object' && !Array.isArray(current)) {
      if (current[expectedKey] && Array.isArray(current[expectedKey])) current = current[expectedKey];
      else current = Object.values(current).find(v => Array.isArray(v)) || Object.values(current);
    }
    if (Array.isArray(current)) return current.length === 1 && Array.isArray(current[0]) ? current[0] : current;
    if (typeof current === 'string') return current.split('\n');
    return [];
  };

  const parsedLearningOutcomes = useMemo(() => smartExtract(course?.learning_outcomes, 'learning_outcomes'), [course?.learning_outcomes]);
  const parsedFaqs = useMemo(() => {
    return smartExtract(course?.faqs, 'faqs').map((item: any, i: number) => {
      if (typeof item === 'string') return { q: `Question ${i + 1}`, a: item };
      return { q: item?.q || item?.question || item?.title || `Question ${i + 1}`, a: item?.a || item?.answer || item?.content || item?.desc || JSON.stringify(item) };
    });
  }, [course?.faqs]);

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const totalScroll = document.documentElement.scrollTop;
          const windowHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
          setScrollProgress((totalScroll / windowHeight) * 100);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!course?.start_datetime) return;
    const courseTimer = setInterval(() => {
      const diff = new Date(course.start_datetime!).getTime() - new Date().getTime();
      if (diff > 0) {
        setCourseCountdown({
          days: Math.floor(diff / (1000 * 60 * 60 * 24)),
          hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          mins: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
          secs: Math.floor((diff % (1000 * 60)) / 1000),
        });
      }
    }, 1000);
    return () => clearInterval(courseTimer);
  }, [course?.start_datetime]);

  useEffect(() => {
    async function fetchCourse() {
      try {
        // Pass the properly encoded, cleaned string to the fetch API
        const res = await fetch(`/api/online-courses/${encodeURIComponent(decodedCourseName)}`);
        if (!res.ok) throw new Error("Course not found");
        setCourse(await res.json());
      } catch (err) { setError(true); } 
      finally { setLoading(false); }
    }
    fetchCourse();
  }, [decodedCourseName]);

  useEffect(() => {
    async function fetchAvatars() {
      try {
        const res = await fetch('/api/profile');
        if (res.ok) {
          const data = await res.json();
          setAvatars(Array.isArray(data) ? data.filter(p => p.full_name || p.avatar_url) : []);
        }
      } catch (err) {} 
      finally { setAvatarsLoading(false); }
    }
    fetchAvatars();
  }, []);

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 gap-8">
      <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
  
  if (error || !course) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6 text-center">
      <SearchX className="w-24 h-24 text-slate-300 mb-6" />
      <h2 className="text-3xl font-black text-slate-800 mb-4">Course Not Found</h2>
      <Link href="/onlinecourse" className="px-8 py-3 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 transition">Browse Courses</Link>
    </div>
  );

  // PRICING
  const finalPrice = course.fee || 0;
  const discount = course.discount || 0;
  const originalPrice = discount > 0 ? Math.round(finalPrice / (1 - (discount / 100))) : finalPrice;
  const formatPrice = (price: number) => new Intl.NumberFormat('en-IN').format(price);

  const displayAvatars = avatars.slice(0, 4);
  const remainingAvatars = avatars.length > 4 ? avatars.length - 4 : 0;

  // Reusable Certificate Card
  const CertificateCard = () => (
    <div className="p-8 rounded-[3rem] text-center flex flex-col items-center border border-slate-200 bg-white shadow-sm hover:shadow-xl transition-shadow duration-300">
      <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6">
        <BadgeCheck className="w-6 h-6" />
      </div>
      <h3 className="text-xl font-black text-slate-900 mb-2">Industry Certificate</h3>
      <p className="text-sm font-medium text-slate-500 mb-6">Earn a verified certificate upon completion to showcase your skills to employers.</p>
      
      {course.certificate_url ? (
        <Link href="https://www.gyanhub.com.np/certificate?name=Bhim%20Bahadur%20Thapa&email=thapanibas2018%40gmail.com" target="_blank" className="block relative group w-full cursor-pointer rounded-2xl overflow-hidden border border-slate-100 shadow-sm">
          <img src={course.certificate_url} className="w-full object-cover group-hover:scale-105 group-hover:blur-sm transition-all duration-500" alt="Course Certificate Verification" loading="lazy" />
          <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3">
             <ShieldCheck className="w-8 h-8 text-emerald-400" />
             <span className="bg-emerald-500 text-white text-xs font-black px-5 py-2.5 rounded-full shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
               Click to Verify Authenticity
             </span>
          </div>
        </Link>
      ) : (
        <div className="w-full aspect-[1.4/1] bg-slate-50 border border-slate-100 rounded-2xl flex flex-col gap-2 items-center justify-center text-slate-400 font-bold">
          <FileText className="w-6 h-6 opacity-50" />
          <span className="text-xs">Preview Unavailable</span>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-gray-900 overflow-x-hidden relative pb-[90px] xl:pb-0">
      
      {/* Progress Bar */}
      <div className="fixed top-0 left-0 h-1.5 bg-emerald-500 z-[60] transition-all duration-150 ease-out shadow-[0_0_10px_rgba(16,185,129,0.8)]" style={{ width: `${scrollProgress}%` }} />

      {/* Upgraded Catchy Marquee */}
      <div className="bg-gradient-to-r from-orange-600 via-amber-500 to-orange-600 text-white py-2.5 border-b border-orange-700/50 flex overflow-hidden shadow-md">
        <div className="whitespace-nowrap animate-marquee-slow font-black uppercase text-xs sm:text-sm tracking-widest shrink-0 drop-shadow-sm">
            ✨ SPECIAL ENROLLMENT OFFER: NRs. {formatPrice(finalPrice)} ONLY — CLAIM YOUR {discount}% DISCOUNT TODAY — ONLY {seats} SEATS REMAINING ✨ &nbsp;&nbsp;&nbsp;&nbsp;
            ✨ SPECIAL ENROLLMENT OFFER: NRs. {formatPrice(finalPrice)} ONLY — CLAIM YOUR {discount}% DISCOUNT TODAY — ONLY {seats} SEATS REMAINING ✨
        </div>
      </div>

      {/* HERO SECTION */}
      <section className="bg-slate-950 pt-16 pb-24 px-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/3 w-[800px] h-[800px] bg-emerald-900/20 blur-[120px] rounded-full pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 translate-y-1/3 -translate-x-1/3 w-[600px] h-[600px] bg-blue-900/10 blur-[100px] rounded-full pointer-events-none"></div>

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-16 items-center relative z-10">
          <div className="lg:col-span-7">
            
            <div className="mb-6 flex flex-wrap items-center gap-3">
              <Link 
                href="/onlinecourse" 
                className="bg-slate-500/20 text-white hover:bg-slate-500/40 border border-slate-500/30 px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-1.5 transition-all shadow-sm"
              >
                <ChevronLeft className="w-3.5 h-3.5 text-white" /> <span className="text-white">Back to Courses</span>
              </Link>
              <span className="bg-orange-500/20 text-orange-400 border border-orange-500/30 px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-1.5 shadow-sm">
                <courseTag.icon className="w-3.5 h-3.5 text-orange-400 fill-orange-400" /> {courseTag.text}
              </span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tighter leading-[1.1] mb-6">
              Master <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">{course.title}</span> Like A Pro
            </h1>

            <div className="mb-10 space-y-6">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-sm inline-block shadow-inner">
                    <p className="text-emerald-400 font-black uppercase tracking-[0.1em] text-sm mb-1.5 flex items-center gap-2">
                        <Calendar className="w-4 h-4" /> Next Batch: {course.start_datetime ? formatEnglishDate(course.start_datetime) : 'Coming Soon'}
                    </p>
                    <p className="text-slate-300 font-bold text-[15px]">{getNepaliDateLine(course.start_datetime)}</p>
                </div>

                <div className="flex flex-wrap items-stretch gap-4">
                    <div className="flex items-center gap-4 bg-slate-900/50 border border-slate-700 px-5 py-4 rounded-2xl shadow-inner backdrop-blur-sm">
                        <div className="flex flex-col">
                            <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Class Starts IN</span>
                            <span className="text-emerald-400 font-mono text-lg font-black tracking-wider flex gap-2">
                              <span className="bg-slate-800 px-2 py-1 rounded border border-slate-700">{String(courseCountdown.days).padStart(2, '0')}d</span>:
                              <span className="bg-slate-800 px-2 py-1 rounded border border-slate-700">{String(courseCountdown.hours).padStart(2, '0')}h</span>:
                              <span className="bg-slate-800 px-2 py-1 rounded border border-slate-700">{String(courseCountdown.mins).padStart(2, '0')}m</span>:
                              <span className="bg-slate-800 px-2 py-1 rounded border border-slate-700">{String(courseCountdown.secs).padStart(2, '0')}s</span>
                            </span>
                        </div>
                    </div>
                    <Badge icon={Clock} title="Duration" value={course.duration || 'TBA'} colorClass="text-blue-400" bgColorClass="bg-blue-900/20" borderColorClass="border-blue-500/20" />
                    <Badge icon={Users} title="Daily Class" value={course.timing || 'TBA'} colorClass="text-purple-400" bgColorClass="bg-purple-900/20" borderColorClass="border-purple-500/20" />
                </div>
            </div>

            <div className="flex items-center gap-5 mb-10 bg-white/5 p-4 rounded-3xl border border-white/10 inline-flex flex-wrap shadow-inner">
                <div className="flex -space-x-3">
                    {avatarsLoading ? (
                      [1, 2, 3].map(i => <div key={i} className="w-10 h-10 rounded-full border-2 border-slate-800 bg-slate-800 animate-pulse"></div>)
                    ) : (
                      <>
                        {displayAvatars.map((avatar, i) => (
                          <div key={i} className="w-12 h-12 rounded-full border-2 border-slate-900 bg-slate-800 flex items-center justify-center overflow-hidden relative z-10">
                              <img src={avatar.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(avatar.full_name || 'Student')}`} alt="Student" className="w-full h-full object-cover" />
                          </div>
                        ))}
                        {remainingAvatars > 0 && (
                          <div className="w-12 h-12 rounded-full border-2 border-slate-900 bg-slate-800 flex items-center justify-center text-xs text-white font-bold z-0">+{remainingAvatars}</div>
                        )}
                      </>
                    )}
                </div>
                <div className="flex flex-col">
                  <div className="flex text-amber-400 text-sm mb-1 gap-1">
                    <Star className="w-4 h-4 fill-current"/><Star className="w-4 h-4 fill-current"/><Star className="w-4 h-4 fill-current"/><Star className="w-4 h-4 fill-current"/><Star className="w-4 h-4 fill-current"/>
                  </div>
                  <p className="text-slate-300 text-sm font-bold tracking-tight">
                      <span className="text-white font-black">GyanHub Platform:</span> 1500+ Students • 4.9 Rating • 94% Success
                  </p>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
                <EnrollButton onClick={handleBookSeat} className="flex-1 sm:flex-none justify-center">Secure My Spot</EnrollButton>
            </div>
          </div>

          <div className="lg:col-span-5 relative">
            <div className="absolute -top-4 -right-4 z-20 backdrop-blur-xl bg-white/10 px-5 py-2.5 rounded-2xl border border-white/20 shadow-2xl">
                <p className="text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-2">
                  <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span></span>
                  Watch Demo Class
                </p>
            </div>
            
            <div className="rounded-[2.5rem] p-3 bg-slate-800 border border-slate-700 shadow-2xl relative z-10 transform lg:-rotate-2 transition-transform hover:rotate-0 duration-500">
              <div className="aspect-video rounded-[1.8rem] overflow-hidden bg-black relative group">
                  {course.demo_video_url ? (
                    <iframe title="Demo Video" className="w-full h-full absolute inset-0" src={getEmbedUrl(course.demo_video_url) || ""} allowFullScreen loading="lazy" sandbox="allow-scripts allow-same-origin allow-presentation"></iframe>
                  ) : (
                    <img src={course.cover_pic} className="w-full h-full object-cover opacity-60" alt="Cover" loading="lazy" />
                  )}
              </div>
            </div>

            <div className="mt-6 bg-slate-800/50 p-5 rounded-2xl border border-slate-700">
              <h4 className="text-emerald-400 text-xs font-black uppercase tracking-widest mb-3 flex items-center gap-2"><MonitorPlay className="w-4 h-4"/> What you'll see in this demo:</h4>
              <ul className="text-slate-300 text-sm font-medium space-y-2">
                <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" /> Direct preview of the teaching style</li>
                <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" /> Real course walkthrough with examples</li>
                <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" /> Video and audio quality check</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* MAIN CONTENT AREA */}
      <main className="max-w-7xl mx-auto px-6 py-20">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-12 xl:gap-20 relative">
          
          <div className="xl:col-span-2 space-y-20">
            
            <section className="bg-white p-8 md:p-10 rounded-[3rem] border border-slate-200 shadow-sm">
              <div className="flex items-center gap-4 mb-8">
                <div className="h-12 w-12 rounded-2xl bg-orange-100 flex items-center justify-center text-orange-600 shrink-0">
                  <Shield className="w-6 h-6" />
                </div>
                <h2 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900">Why Choose GyanHub?</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-8">
                {[
                  "Industry-focused & practical training", 
                  "Live Interactive + Recorded sessions", 
                  "Highly affordable Nepali pricing", 
                  "Verified Certification upon completion", 
                  "Direct mentorship from experts"
                ].map((reason, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                    <span className="text-slate-700 font-bold">{reason}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* MENTOR SECTION */}
            <section className="bg-slate-900 rounded-[3rem] p-1 shadow-xl overflow-hidden relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 blur-[80px] rounded-full pointer-events-none"></div>
                <div className="bg-white rounded-[2.8rem] p-8 md:p-12 flex flex-col md:flex-row gap-10 items-center relative z-10">
                  <div className="shrink-0 relative group">
                    <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500 to-blue-400 rounded-full rotate-6 blur-lg group-hover:rotate-12 transition-transform duration-500 opacity-60"></div>
                    {course.tutor_pic_url ? (
                      <img src={course.tutor_pic_url} className="relative w-40 h-40 md:w-48 md:h-48 rounded-full object-cover border-4 border-white shadow-xl" alt="Lead Mentor" />
                    ) : (
                      <div className="relative w-40 h-40 md:w-48 md:h-48 rounded-full bg-slate-100 border-4 border-white shadow-xl flex items-center justify-center"><User className="w-20 h-20 text-slate-300" /></div>
                    )}
                    <div className="absolute -bottom-3 -right-3 bg-white p-2 rounded-full shadow-lg border border-slate-100">
                      <div className="bg-blue-500 text-white w-10 h-10 rounded-full flex items-center justify-center"><BadgeCheck className="w-5 h-5" /></div>
                    </div>
                  </div>
                  <div>
                      <h3 className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">Course Lead Mentor</h3>
                      <h4 className="text-3xl md:text-4xl font-black mb-4 tracking-tight text-slate-900">{course.tutor_name || "Expert Educator"}</h4>
                      <p className="text-slate-600 leading-relaxed font-medium text-lg">{course.tutor_bio || "Bringing years of industry experience and practical knowledge directly to your screen."}</p>
                  </div>
                </div>
            </section>

            {/* Who This Course Is For */}
            <section>
                <div className="flex items-center gap-4 mb-10">
                  <div className="h-12 w-12 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                    <Target className="w-6 h-6" />
                  </div>
                  <h2 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900">Who Is This Course For?</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    "Beginners starting from zero",
                    "Students preparing for the job market",
                    "Professionals looking to upgrade skills",
                    "Freelancers wanting to expand services"
                  ].map((item, i) => (
                    <div key={i} className="bg-blue-50/50 border border-blue-100 p-5 rounded-2xl flex items-center gap-4">
                      <div className="bg-blue-500 text-white p-1.5 rounded-lg"><CheckCircle2 className="w-4 h-4"/></div>
                      <span className="font-bold text-slate-700">{item}</span>
                    </div>
                  ))}
                </div>
            </section>

            {/* SYLLABUS SECTION */}
            {course.syllabus_url && (
              <section>
                <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-6 md:p-8 rounded-[2rem] border border-slate-700 flex flex-col md:flex-row items-center justify-between gap-6 group hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                  <div className="flex items-center gap-5 text-center md:text-left flex-col md:flex-row">
                     <div className="bg-emerald-500/20 p-4 rounded-2xl text-emerald-400 shrink-0">
                       <BookOpen className="w-8 h-8" />
                     </div>
                     <div>
                       <h3 className="text-white font-black text-xl md:text-2xl mb-1.5">View Detailed Syllabus</h3>
                       <p className="text-slate-400 text-sm font-medium">Know every topic you'll learn day-by-day before enrolling.</p>
                     </div>
                  </div>
                  <a 
                    href={`https://docs.google.com/viewer?url=${encodeURIComponent(course.syllabus_url)}`} 
                    target="_blank" rel="noopener noreferrer" 
                    className="w-full md:w-auto px-8 py-4 bg-emerald-500 text-white rounded-xl font-black text-lg hover:bg-emerald-400 transition-colors whitespace-nowrap text-center shadow-lg shadow-emerald-500/30 active:scale-95"
                  >
                    Open PDF Curriculum
                  </a>
                </div>
              </section>
            )}

            {/* MASTER SECTION */}
            <section>
                <div className="flex items-center gap-4 mb-10">
                  <div className="h-12 w-12 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <h2 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900">What You Will Master</h2>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {parsedLearningOutcomes.length > 0 ? (
                        parsedLearningOutcomes.map((item: any, index: number) => (
                            <div key={index} className="bg-white border border-slate-200 hover:border-emerald-300 p-6 rounded-3xl shadow-sm hover:shadow-md transition-all group">
                                <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500 mb-4 group-hover:scale-110 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                                  <CheckCircle2 className="w-5 h-5" />
                                </div>
                                <p className="font-bold text-slate-700 leading-relaxed text-sm md:text-base">
                                  {typeof item === 'string' ? item : JSON.stringify(item)}
                                </p>
                            </div>
                        ))
                    ) : (
                        <p className="text-slate-500 italic col-span-2 p-8 border border-dashed border-slate-300 rounded-3xl text-center">Curriculum details are being updated.</p>
                    )}
                </div>
            </section>

            {/* Real Outcomes / Career Impact */}
            <section className="bg-orange-50/50 border border-orange-100 p-8 md:p-10 rounded-[3rem]">
                <div className="flex items-center gap-4 mb-8">
                  <div className="h-12 w-12 rounded-2xl bg-orange-500 flex items-center justify-center text-white shrink-0 shadow-md">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                  <h2 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900">Career Impact & Outcomes</h2>
                </div>
                <p className="text-slate-600 font-bold mb-8">After completing this course, you will be able to:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="flex gap-4">
                    <div className="bg-white p-2.5 rounded-xl border border-orange-200 shrink-0 h-min shadow-sm"><Briefcase className="w-5 h-5 text-orange-500"/></div>
                    <div>
                      <h4 className="font-black text-slate-800 mb-1">Apply for Jobs Confidently</h4>
                      <p className="text-sm text-slate-500 font-medium">Bypass the fresher struggle with practical knowledge.</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="bg-white p-2.5 rounded-xl border border-orange-200 shrink-0 h-min shadow-sm"><MonitorPlay className="w-5 h-5 text-orange-500"/></div>
                    <div>
                      <h4 className="font-black text-slate-800 mb-1">Work on Real Projects</h4>
                      <p className="text-sm text-slate-500 font-medium">Handle real-world scenarios independently.</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="bg-white p-2.5 rounded-xl border border-orange-200 shrink-0 h-min shadow-sm"><Sparkles className="w-5 h-5 text-orange-500"/></div>
                    <div>
                      <h4 className="font-black text-slate-800 mb-1">Freelance Opportunities</h4>
                      <p className="text-sm text-slate-500 font-medium">Start earning globally by offering your new skills.</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="bg-white p-2.5 rounded-xl border border-orange-200 shrink-0 h-min shadow-sm"><FileText className="w-5 h-5 text-orange-500"/></div>
                    <div>
                      <h4 className="font-black text-slate-800 mb-1">Build a Strong Portfolio</h4>
                      <p className="text-sm text-slate-500 font-medium">Showcase concrete assignments to future employers.</p>
                    </div>
                  </div>
                </div>
            </section>

            {/* Certificate Section (MOBILE ONLY - Above FAQ) */}
            <div className="block xl:hidden">
              <CertificateCard />
            </div>

            {/* FAQ SECTION */}
            <section>
                <div className="flex items-center gap-4 mb-10">
                  <div className="h-12 w-12 rounded-2xl bg-slate-200 flex items-center justify-center text-slate-700 shrink-0">
                    <HelpCircle className="w-6 h-6" />
                  </div>
                  <h2 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900">Frequently Asked Questions</h2>
                </div>
                
                <div className="space-y-4">
                    {parsedFaqs.length > 0 ? (
                        parsedFaqs.map((faq: any, i: number) => (
                            <details key={i} className="group bg-white border border-slate-200 rounded-3xl overflow-hidden [&_summary::-webkit-details-marker]:hidden shadow-sm hover:shadow-md transition-all">
                                <summary className="flex items-center justify-between cursor-pointer p-6 sm:p-8 font-black text-lg text-slate-800 outline-none">
                                    {faq.q}
                                    <span className="transition group-open:rotate-180 bg-slate-50 p-2 rounded-full">
                                        <svg fill="none" height="20" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="20"><path d="M6 9l6 6 6-6"></path></svg>
                                    </span>
                                </summary>
                                <div className="px-6 sm:px-8 pb-8 pt-0 text-slate-600 font-medium leading-relaxed border-t border-slate-50 mt-2">
                                    {faq.a}
                                </div>
                            </details>
                        ))
                    ) : (
                        <p className="text-slate-500 italic p-8 border border-dashed border-slate-300 rounded-3xl text-center bg-white">No FAQs available right now.</p>
                    )}
                </div>
            </section>
          </div>

          {/* RIGHT SIDEBAR (STICKY PRICING & CERTIFICATE) */}
          <div className="xl:relative">
            <div className="xl:sticky xl:top-28 space-y-8">
                
                {/* Pricing Card */}
                <div className="bg-white border border-slate-200 p-8 rounded-[3rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-orange-400 to-amber-400"></div>
                    
                    <div className="mb-8">
                        <div className="flex justify-between items-end mb-2">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Discount Seats Left</p>
                          <p className="text-[9px] font-bold text-red-500 uppercase flex items-center gap-1 animate-pulse">
                            <Clock className="w-3 h-3"/> Updated {lastUpdated}m ago
                          </p>
                        </div>
                        <div className="flex gap-1.5 items-end">
                          <span className="text-5xl font-black text-slate-900 tracking-tighter leading-none">{seats}</span>
                          <span className="text-lg font-bold text-slate-500 mb-1">/ 20</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2.5 rounded-full mt-4 overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full transition-all duration-1000 ease-out"
                            style={{ width: `${(seats / 20) * 100}%` }}
                          ></div>
                        </div>
                    </div>

                    <div className="mb-8 p-6 bg-slate-50 rounded-3xl border border-slate-100">
                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-2 tracking-[0.2em]">Course Fee</p>
                        <div className="flex flex-col">
                          {discount > 0 && (
                            <span className="text-lg font-bold text-slate-400 line-through mb-1">
                              NRs. {formatPrice(originalPrice)}
                            </span>
                          )}
                          <span className="text-4xl font-black text-emerald-600 tracking-tighter flex items-baseline gap-1">
                            <span className="text-lg text-emerald-600/70 font-bold">NRs.</span>
                            {formatPrice(finalPrice)}
                          </span>
                        </div>
                        {discount > 0 && (
                          <div className="mt-4 inline-block bg-orange-100 text-orange-700 px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider border border-orange-200">
                            🔥 {discount}% Discount Applied
                          </div>
                        )}
                    </div>

                    <button 
                      onClick={handleBookSeat}
                      className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-lg shadow-xl hover:shadow-2xl hover:bg-black transition-all active:scale-95 flex justify-center items-center gap-2 group"
                    >
                        Secure Your Seat <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                    
                    <div className="mt-6 pt-6 border-t border-slate-100 flex items-center justify-center gap-2 text-slate-500">
                      <ShieldCheck className="w-4 h-4" />
                      <span className="text-[10px] font-black uppercase tracking-widest">100% Secure Checkout</span>
                    </div>
                </div>

                {/* Desktop Certificate Card (Hidden on Mobile) */}
                <div className="hidden xl:block">
                   <CertificateCard />
                </div>
            </div>
          </div>
        </div>
      </main>

      {/* MOBILE STICKY CTA */}
      <div className="xl:hidden fixed bottom-0 left-0 w-full bg-white border-t border-slate-200 shadow-[0_-10px_30px_rgba(0,0,0,0.08)] z-50 p-4 flex items-center justify-between gap-4">
         <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-0.5">Total Fee</span>
            <span className="text-xl font-black text-slate-900 leading-none">Rs. {formatPrice(finalPrice)}</span>
         </div>
         <button 
           onClick={handleBookSeat}
           className="flex-1 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-black py-3.5 rounded-xl text-center shadow-lg active:scale-95 transition-transform"
         >
           Enroll Now
         </button>
      </div>

      <style jsx global>{`
        @keyframes marquee-slow {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee-slow {
          animation: marquee-slow 40s linear infinite;
        }
      `}</style>
    </div>
  );
}

function ArrowRight(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
    </svg>
  )
}