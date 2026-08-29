"use client";

import { useEffect, useState, use, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import NepaliDate from 'nepali-date-converter'; 
import { createClient } from "@/lib/supabase/client"; 
import { 
  Calendar, Clock, BadgeCheck, ShieldCheck,
  User, SearchX, Sparkles, Zap, CheckCircle2, Users,
  FileText, Star, Target, Briefcase, TrendingUp, MonitorPlay, BookOpen, Shield, Award, ChevronLeft, MessageSquareText, ThumbsUp, ChevronDown, ChevronUp
} from "lucide-react";

// --- Types ---
interface Course {
  id: string; 
  course_code: string; 
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
  active_batch_id?: string;
  syllabus_id?: number;
}

interface StudentAvatar {
  full_name?: string;
  avatar_url?: string;
}

interface Review {
  id: string;
  created_at: string;
  name: string | null;
  email: string | null;
  overall_rating: number | null;
  tutor_rating: number | null;
  content_rating: number | null;
  skill_improvement_rating: number | null;
  materials_rating: number | null;
  liked_most: string | null;
  testimonial: string | null;
  would_recommend: string | null;
  avatar_url?: string | null;
}

interface CategoryAverages {
  tutor: number;
  content: number;
  materials: number;
  skills: number;
}

// --- Reusable Components ---
const Badge = ({ icon: Icon, title, value, colorClass, bgColorClass, borderColorClass }: any) => (
  <div className={`flex items-center gap-3 ${bgColorClass} border ${borderColorClass} px-4 py-3 md:px-5 md:py-4 rounded-2xl transition-transform hover:-translate-y-1 duration-300`}>
    <div className={`p-2 rounded-xl bg-white/10 ${colorClass}`}>
      <Icon className="w-4 h-4 md:w-5 md:h-5 opacity-90" aria-hidden="true" />
    </div>
    <div className="flex flex-col">
      <span className={`text-[9px] md:text-[10px] ${colorClass} opacity-80 font-bold uppercase tracking-[0.15em]`}>{title}</span>
      <span className="text-white font-semibold text-sm md:text-base mt-0.5">{value}</span>
    </div>
  </div>
);

const EnrollButton = ({ onClick, children, className = "" }: any) => (
  <button 
    onClick={onClick}
    aria-label="Enroll in course"
    className={`px-8 py-4 md:px-10 md:py-5 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-black rounded-2xl text-lg md:text-xl shadow-[0_10px_30px_rgba(249,115,22,0.3)] hover:shadow-[0_15px_40px_rgba(249,115,22,0.5)] hover:-translate-y-1 active:scale-95 transition-all duration-300 ${className}`}
  >
    {children}
  </button>
);

const ReviewStars = ({ rating }: { rating: number }) => (
  <div className="flex text-amber-400 text-xs md:text-sm gap-0.5">
    {[1, 2, 3, 4, 5].map((star) => (
      <Star key={star} className={`w-3.5 h-3.5 md:w-4 md:h-4 ${star <= rating ? 'fill-current text-amber-400' : 'text-slate-200'}`} />
    ))}
  </div>
);

// Progress bar for review sub-categories
const SubRatingBar = ({ label, value }: { label: string, value: number }) => (
  <div className="flex items-center justify-between text-sm w-full">
    <span className="text-slate-600 font-bold w-1/3">{label}</span>
    <div className="flex items-center gap-3 w-2/3 justify-end">
      <div className="w-full max-w-[120px] h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className="h-full bg-amber-400 rounded-full" style={{ width: `${(value / 5) * 100}%` }}></div>
      </div>
      <span className="font-extrabold text-slate-900 w-6 text-right">{value.toFixed(1)}</span>
    </div>
  </div>
);

export function CourseDetailClient({ params }: { params: Promise<any> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  
  const urlCourseCode = resolvedParams.courseCode || resolvedParams.id; 

  const [supabase] = useState(() => createClient());

  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  
  const [avatars, setAvatars] = useState<StudentAvatar[]>([]);
  const [avatarsLoading, setAvatarsLoading] = useState(true);
  
  // Real dynamic data states
  const [reviews, setReviews] = useState<Review[]>([]);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [averageRating, setAverageRating] = useState<string>("4.9");
  const [catAverages, setCatAverages] = useState<CategoryAverages>({ tutor: 4.8, content: 4.8, materials: 4.8, skills: 4.8 });
  const [certifiedStudentsCount, setCertifiedStudentsCount] = useState<number>(0);

  const [seats, setSeats] = useState(15); 
  const [offerTime, setOfferTime] = useState({ hours: 0, mins: 0, secs: 0 });
  const [courseCountdown, setCourseCountdown] = useState({ days: 0, hours: 0, mins: 0, secs: 0 });
  const [scrollProgress, setScrollProgress] = useState(0);
  const [courseTag, setCourseTag] = useState({ text: "Bestseller Course", icon: Zap });

  useEffect(() => {
    const tags = [
      { text: "Bestseller Course", icon: Zap },
      { text: "Highest Rated Course", icon: Star },
      { text: "High Demand Course", icon: TrendingUp },
      { text: "Industry Favorite", icon: Award }
    ];
    setCourseTag(tags[Math.floor(Math.random() * tags.length)]);
  }, []);

  const handleBookSeat = () => {
    if (urlCourseCode) {
      router.push(`/onlinecourse/${urlCourseCode}/enroll`);
    }
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
    const offerTimer = setInterval(() => {
      const now = new Date().getTime();
      const resetInterval = 48 * 60 * 60 * 1000;
      const timeRemaining = resetInterval - (now % resetInterval);

      setOfferTime({
        hours: Math.floor(timeRemaining / (1000 * 60 * 60)),
        mins: Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60)),
        secs: Math.floor((timeRemaining % (1000 * 60)) / 1000),
      });
    }, 1000);
    return () => clearInterval(offerTimer);
  }, []);

  useEffect(() => {
    if (!urlCourseCode) return;

    async function fetchCourseAndDynamicData() {
      try {
        const res = await fetch(`/api/online_courses/${urlCourseCode}`);
        
        if (!res.ok) {
          const rawText = await res.text();
          let errorMessage = "Course not found";
          try {
             const parsed = JSON.parse(rawText);
             if (parsed.error) errorMessage = parsed.error;
          } catch(e) {}
          throw new Error(errorMessage);
        }
        
        const courseData = await res.json();
        setCourse(courseData);

        if (courseData.syllabus_id) {
          // 1. Fetch Approved Reviews WITH extra ratings
          const { data: reviewsData } = await supabase
            .from('reviews')
            .select('id, created_at, name, email, overall_rating, tutor_rating, content_rating, materials_rating, skill_improvement_rating, liked_most, testimonial, would_recommend')
            .eq('syllabus_id', courseData.syllabus_id)
            .eq('status', 'approved');

          if (reviewsData && reviewsData.length > 0) {
             const allValidReviews = reviewsData as Review[];
             
             // Extract emails and fetch avatars
             const emails = Array.from(new Set(allValidReviews.map(r => r.email).filter(Boolean) as string[]));
             const profileMap: Record<string, string> = {};

             if (emails.length > 0) {
               const { data: profilesData } = await supabase
                 .from('profiles')
                 .select('email, avatar_url')
                 .in('email', emails);

               if (profilesData) {
                 profilesData.forEach(p => {
                   if (p.email && p.avatar_url) {
                     profileMap[p.email.toLowerCase()] = p.avatar_url;
                   }
                 });
               }
             }

             // Map avatars and filter valid displaying reviews
             let enrichedReviews = allValidReviews
                .filter(r => r.testimonial || r.liked_most) // Ensure there's text to show
                .map(r => ({
                   ...r,
                   avatar_url: r.email ? profileMap[r.email.toLowerCase()] || null : null
                }));

             // Sort Logic: 1. Avatar 2. Highest Rated 3. Has Testimonial
             enrichedReviews.sort((a, b) => {
                const aHasAvatar = a.avatar_url ? 1 : 0;
                const bHasAvatar = b.avatar_url ? 1 : 0;
                if (aHasAvatar !== bHasAvatar) return bHasAvatar - aHasAvatar;

                const aRating = a.overall_rating || 0;
                const bRating = b.overall_rating || 0;
                if (aRating !== bRating) return bRating - aRating;

                const aHasTest = a.testimonial?.trim() ? 1 : 0;
                const bHasTest = b.testimonial?.trim() ? 1 : 0;
                return bHasTest - aHasTest;
             });

             setReviews(enrichedReviews);

             // Calculate Global Averages
             let tTotal = 0, cTotal = 0, mTotal = 0, sTotal = 0, oTotal = 0;
             let tCount = 0, cCount = 0, mCount = 0, sCount = 0, oCount = 0;

             allValidReviews.forEach(r => {
                if (r.overall_rating) { oTotal += r.overall_rating; oCount++; }
                if (r.tutor_rating) { tTotal += r.tutor_rating; tCount++; }
                if (r.content_rating) { cTotal += r.content_rating; cCount++; }
                if (r.materials_rating) { mTotal += r.materials_rating; mCount++; }
                if (r.skill_improvement_rating) { sTotal += r.skill_improvement_rating; sCount++; }
             });

             const avgOverall = oCount > 0 ? (oTotal / oCount) : 5.0;
             setAverageRating(avgOverall.toFixed(1));

             setCatAverages({
               tutor: tCount > 0 ? (tTotal / tCount) : avgOverall,
               content: cCount > 0 ? (cTotal / cCount) : avgOverall,
               materials: mCount > 0 ? (mTotal / mCount) : avgOverall,
               skills: sCount > 0 ? (sTotal / sCount) : avgOverall,
             });
          }

          // 2. Fetch Certificate Count
          const sid = Number(courseData.syllabus_id);
          let targetIds = [sid];
          if ([6, 13, 16].includes(sid)) targetIds = [6, 13, 16];
          else if ([1, 8, 7].includes(sid)) targetIds = [1, 8, 7];

          const { count: certCount } = await supabase
            .from('certificates')
            .select('*', { count: 'exact', head: true })
            .in('syllabus_id', targetIds)
            .eq('deleted', false)
            .eq('status', 'active');

          if (certCount !== null) {
            setCertifiedStudentsCount(certCount > 0 ? certCount : 0);
          }
        }

        // 3. Fetch Real-time Seat Count
        try {
          if (courseData.active_batch_id) {
            const { count, error: countError } = await supabase
              .from('enrollments_v2') 
              .select('id', { count: 'exact' }) 
              .eq('batch_id', courseData.active_batch_id)
              .eq('is_confirmed', true);

            if (countError) {
              setSeats(15); 
            } else if (count !== null) {
              const remaining = 15 - count;
              setSeats(remaining <= 5 ? 5 : remaining);
            }
          } else {
            setSeats(15);
          }
        } catch (seatErr) {
          setSeats(15);
        }

      } catch (err) { 
        setError(true); 
      } finally { 
        setLoading(false); 
      }
    }
    fetchCourseAndDynamicData();
  }, [urlCourseCode, supabase]);

  useEffect(() => {
    async function fetchAvatars() {
      try {
        const res = await fetch('/api/dashboard');
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

  const finalPrice = course.fee || 0;
  const discount = course.discount || 0;
  const formatPrice = (price: number) => new Intl.NumberFormat('en-IN').format(price);

  const displayAvatars = avatars.slice(0, 4);
  const remainingAvatars = avatars.length > 4 ? avatars.length - 4 : 0;

  const displayStudentCount = certifiedStudentsCount > 50 
    ? `${certifiedStudentsCount}+` 
    : (certifiedStudentsCount > 0 ? `${certifiedStudentsCount}` : "New");

  const visibleReviews = showAllReviews ? reviews : reviews.slice(0, 4);

  const CertificateCard = () => (
    <div className="p-6 md:p-8 rounded-3xl md:rounded-[3rem] text-center flex flex-col items-center border border-slate-200 bg-white shadow-sm hover:shadow-xl transition-shadow duration-300">
      <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-5 md:mb-6">
        <BadgeCheck className="w-6 h-6" />
      </div>
      <h3 className="text-lg md:text-xl font-extrabold text-slate-900 mb-2">Industry Certificate</h3>
      <p className="text-xs md:text-sm font-medium text-slate-500 mb-5 md:mb-6">Earn a verified certificate upon completion to showcase your skills to employers.</p>
      
      <Link href="https://www.gyanhub.com.np/certificate" target="_blank" className="block relative group w-full cursor-pointer rounded-2xl overflow-hidden border border-slate-100 shadow-sm">
        <img 
          src="https://zuktarghyexwodqnnxlu.supabase.co/storage/v1/object/public/syllabi/Sample_Certificate.webp" 
          className="w-full object-cover group-hover:scale-105 group-hover:blur-sm transition-all duration-500" 
          alt="Course Certificate Verification" 
          loading="lazy" 
        />
        <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3">
           <ShieldCheck className="w-8 h-8 text-emerald-400" />
           <span className="bg-emerald-500 text-white text-xs font-bold px-4 md:px-5 py-2 md:py-2.5 rounded-full shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
             Click to Verify
           </span>
        </div>
      </Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-gray-900 overflow-x-hidden relative pb-[100px] xl:pb-0">
      
      <div className="fixed top-0 left-0 h-1.5 bg-emerald-500 z-[60] transition-all duration-150 ease-out shadow-[0_0_10px_rgba(16,185,129,0.8)]" style={{ width: `${scrollProgress}%` }} />

      {/* Marquee Banner */}
      <div className="bg-gradient-to-r from-orange-600 via-amber-500 to-orange-600 text-white py-2.5 border-b border-orange-700/50 flex overflow-hidden shadow-md">
        <style>{`
          @keyframes custom-marquee {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
          .animate-custom-marquee {
            display: flex;
            white-space: nowrap;
            animation: custom-marquee 25s linear infinite;
          }
        `}</style>
        <div className="animate-custom-marquee font-bold uppercase text-xs sm:text-sm tracking-widest w-max shrink-0 drop-shadow-sm">
          <span className="pr-10">✨ SPECIAL ENROLLMENT OFFER: NRs. {formatPrice(finalPrice)} ONLY — CLAIM YOUR {discount}% DISCOUNT TODAY — ONLY {seats} DISCOUNTED SEATS REMAINING ✨</span>
          <span className="pr-10">✨ SPECIAL ENROLLMENT OFFER: NRs. {formatPrice(finalPrice)} ONLY — CLAIM YOUR {discount}% DISCOUNT TODAY — ONLY {seats} DISCOUNTED SEATS REMAINING ✨</span>
        </div>
      </div>

      <section className="bg-slate-950 pt-10 pb-16 md:pt-16 md:pb-24 px-4 md:px-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/3 w-[800px] h-[800px] bg-emerald-900/20 blur-[120px] rounded-full pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 translate-y-1/3 -translate-x-1/3 w-[600px] h-[600px] bg-blue-900/10 blur-[100px] rounded-full pointer-events-none"></div>

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 md:gap-16 items-center relative z-10">
          <div className="lg:col-span-7">
            
            <div className="mb-4 md:mb-6 flex flex-wrap items-center gap-2 md:gap-3">
              <Link 
                href="/onlinecourse" 
                className="bg-slate-500/20 text-white hover:bg-slate-500/40 border border-slate-500/30 px-3 py-1 md:px-4 md:py-1.5 rounded-lg text-[9px] md:text-[10px] font-bold uppercase tracking-[0.15em] flex items-center gap-1.5 transition-all shadow-sm"
              >
                <ChevronLeft className="w-3.5 h-3.5 text-white" /> <span className="text-white">Back</span>
              </Link>
              <span className="bg-orange-500/20 text-orange-400 border border-orange-500/30 px-3 py-1 md:px-4 md:py-1.5 rounded-lg text-[9px] md:text-[10px] font-bold uppercase tracking-[0.15em] flex items-center gap-1.5 shadow-sm">
                <courseTag.icon className="w-3.5 h-3.5 text-orange-400 fill-orange-400" /> {courseTag.text}
              </span>
            </div>

            <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-white tracking-tighter leading-[1.15] md:leading-[1.1] mb-5 md:mb-6">
              Master <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">{course.title}</span> Like A Pro
            </h1>

            <div className="mb-8 md:mb-10 space-y-5 md:space-y-6">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 md:p-5 backdrop-blur-sm inline-block shadow-inner">
                    <p className="text-emerald-400 font-bold uppercase tracking-[0.1em] text-xs md:text-sm mb-1.5 flex items-center gap-2">
                        <Calendar className="w-4 h-4" /> Next Batch: {course.start_datetime ? formatEnglishDate(course.start_datetime) : 'Coming Soon'}
                    </p>
                    <p className="text-slate-300 font-semibold text-sm md:text-[15px]">{getNepaliDateLine(course.start_datetime)}</p>
                </div>

                <div className="flex flex-wrap items-stretch gap-3 md:gap-4">
                    <div className="flex items-center gap-3 md:gap-4 bg-slate-900/50 border border-slate-700 px-4 py-3 md:px-5 md:py-4 rounded-2xl shadow-inner backdrop-blur-sm">
                        <div className="flex flex-col">
                            <span className="text-[9px] md:text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Class Starts IN</span>
                            <span className="text-emerald-400 font-mono text-base md:text-lg font-extrabold tracking-wider flex gap-1 md:gap-2">
                              <span className="bg-slate-800 px-1.5 md:px-2 py-1 rounded border border-slate-700">{String(courseCountdown.days).padStart(2, '0')}d</span>:
                              <span className="bg-slate-800 px-1.5 md:px-2 py-1 rounded border border-slate-700">{String(courseCountdown.hours).padStart(2, '0')}h</span>:
                              <span className="bg-slate-800 px-1.5 md:px-2 py-1 rounded border border-slate-700">{String(courseCountdown.mins).padStart(2, '0')}m</span>:
                              <span className="bg-slate-800 px-1.5 md:px-2 py-1 rounded border border-slate-700">{String(courseCountdown.secs).padStart(2, '0')}s</span>
                            </span>
                        </div>
                    </div>
                    <Badge icon={Clock} title="Duration" value={course.duration} colorClass="text-blue-400" bgColorClass="bg-blue-900/20" borderColorClass="border-blue-500/20" />
                    <Badge icon={Users} title="Daily Class" value={course.timing} colorClass="text-blue-400" bgColorClass="bg-blue-900/20" borderColorClass="border-blue-500/20" />
                </div>
            </div>

            <div className="flex items-center gap-4 md:gap-5 mb-8 md:mb-10 bg-white/5 p-3 md:p-4 rounded-3xl border border-white/10 inline-flex flex-wrap shadow-inner">
                <div className="flex -space-x-3">
                    {avatarsLoading ? (
                      [1, 2, 3].map(i => <div key={i} className="w-8 h-8 md:w-10 md:h-10 rounded-full border-2 border-slate-800 bg-slate-800 animate-pulse"></div>)
                    ) : (
                      <>
                        {displayAvatars.map((avatar, i) => (
                          <div key={i} className="w-10 h-10 md:w-12 md:h-12 rounded-full border-2 border-slate-900 bg-slate-800 flex items-center justify-center overflow-hidden relative z-10">
                              <img src={avatar.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(avatar.full_name || 'Student')}`} alt="Student" className="w-full h-full object-cover" />
                          </div>
                        ))}
                        {remainingAvatars > 0 && (
                          <div className="w-10 h-10 md:w-12 md:h-12 rounded-full border-2 border-slate-900 bg-slate-800 flex items-center justify-center text-xs text-white font-bold z-0">+{remainingAvatars}</div>
                        )}
                      </>
                    )}
                </div>
                <div className="flex flex-col">
                  <div className="flex text-amber-400 text-xs md:text-sm mb-1 gap-1">
                    <Star className="w-3 h-3 md:w-4 md:h-4 fill-current"/><Star className="w-3 h-3 md:w-4 md:h-4 fill-current"/><Star className="w-3 h-3 md:w-4 md:h-4 fill-current"/><Star className="w-3 h-3 md:w-4 md:h-4 fill-current"/><Star className="w-3 h-3 md:w-4 md:h-4 fill-current"/>
                  </div>
                  <p className="text-slate-300 text-xs md:text-sm font-semibold tracking-tight">
                      <span className="text-white font-extrabold">Course Insights:</span> {displayStudentCount} Students • {averageRating} Rating
                  </p>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 md:gap-4 hidden md:flex">
                <EnrollButton onClick={handleBookSeat} className="flex-1 sm:flex-none justify-center">🎓 Reserve My Discounted Seat</EnrollButton>
                
                {course.syllabus_url && (
                  <a 
                    href={course.syllabus_url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-4 md:px-8 md:py-5 bg-slate-800 hover:bg-slate-700 !text-white font-extrabold rounded-2xl text-lg md:text-xl border border-slate-700 transition-all duration-300 active:scale-95 shadow-[0_10px_30px_rgba(0,0,0,0.3)] hover:shadow-[0_15px_40px_rgba(0,0,0,0.5)] hover:-translate-y-1"
                  >
                    <BookOpen className="w-5 h-5 text-white" /> <span className="text-white">View Syllabus</span>
                  </a>
                )}
            </div>
          </div>

          <div className="lg:col-span-5 relative mt-4 md:mt-0">
            <div className="absolute -top-3 -right-3 md:-top-4 md:-right-4 z-20 backdrop-blur-xl bg-white/10 px-4 py-2 md:px-5 md:py-2.5 rounded-2xl border border-white/20 shadow-2xl">
                <p className="text-[9px] md:text-[10px] font-bold text-white uppercase tracking-widest flex items-center gap-2">
                  <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span></span>
                  Watch Demo Class
                </p>
            </div>
            
            <div className="rounded-3xl md:rounded-[2.5rem] p-2 md:p-3 bg-slate-800 border border-slate-700 shadow-2xl relative z-10 transform lg:-rotate-2 transition-transform hover:rotate-0 duration-500">
              <div className="aspect-video rounded-2xl md:rounded-[1.8rem] overflow-hidden bg-black relative group">
                  {course.demo_video_url ? (
                    <iframe title="Demo Video" className="w-full h-full absolute inset-0" src={getEmbedUrl(course.demo_video_url) || ""} allowFullScreen loading="lazy" sandbox="allow-scripts allow-same-origin allow-presentation"></iframe>
                  ) : (
                    <img src={course.cover_pic} className="w-full h-full object-cover opacity-60" alt="Cover" loading="lazy" />
                  )}
              </div>
            </div>

            <div className="mt-4 md:mt-6 bg-slate-800/50 p-4 md:p-5 rounded-2xl border border-slate-700">
              <h4 className="text-emerald-400 text-[11px] md:text-xs font-bold uppercase tracking-widest mb-2 md:mb-3 flex items-center gap-2"><MonitorPlay className="w-4 h-4"/> What you'll see in this demo:</h4>
              <ul className="text-slate-300 text-xs md:text-sm font-medium space-y-1.5 md:space-y-2">
                <li className="flex items-start gap-2"><CheckCircle2 className="w-3.5 h-3.5 md:w-4 md:h-4 text-emerald-500 shrink-0 mt-0.5" /> Direct preview of the teaching style</li>
                <li className="flex items-start gap-2"><CheckCircle2 className="w-3.5 h-3.5 md:w-4 md:h-4 text-emerald-500 shrink-0 mt-0.5" /> Real course walkthrough with examples</li>
                <li className="flex items-start gap-2"><CheckCircle2 className="w-3.5 h-3.5 md:w-4 md:h-4 text-emerald-500 shrink-0 mt-0.5" /> Video and audio quality check</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-12 md:py-20">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-10 xl:gap-20 relative">
          
          <div className="xl:col-span-2 space-y-12 md:space-y-20">
            <section className="bg-white p-6 md:p-10 rounded-3xl md:rounded-[3rem] border border-slate-200 shadow-sm">
              <div className="flex items-center gap-3 md:gap-4 mb-6 md:mb-8">
                <div className="h-10 w-10 md:h-12 md:w-12 rounded-2xl bg-orange-100 flex items-center justify-center text-orange-600 shrink-0">
                  <Shield className="w-5 h-5 md:w-6 md:h-6" />
                </div>
                <h2 className="text-xl md:text-3xl font-extrabold tracking-tight text-slate-900">Why Choose GyanHub?</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 md:gap-y-6 gap-x-8">
                {[
                  "Industry-focused & practical training", 
                  "Live Interactive + Recorded sessions", 
                  "Highly affordable Nepali pricing", 
                  "Verified Certification upon completion", 
                  "Direct mentorship from experts"
                ].map((reason, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-emerald-500 shrink-0 mt-0.5 md:mt-0" />
                    <span className="text-sm md:text-base text-slate-700 font-semibold">{reason}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="bg-slate-900 rounded-3xl md:rounded-[3rem] p-1 shadow-xl overflow-hidden relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/20 blur-[80px] rounded-full pointer-events-none"></div>
                <div className="bg-white rounded-[1.4rem] md:rounded-[2.8rem] p-6 md:p-12 flex flex-col md:flex-row gap-6 md:gap-10 items-center relative z-10 text-center md:text-left">
                  <div className="shrink-0 relative group">
                    <div className="absolute inset-0 bg-gradient-to-tr from-blue-500 to-cyan-400 rounded-full rotate-6 blur-lg group-hover:rotate-12 transition-transform duration-500 opacity-60"></div>
                    {course.tutor_pic_url ? (
                      <img src={course.tutor_pic_url} className="relative w-32 h-32 md:w-48 md:h-48 rounded-full object-cover border-4 border-white shadow-xl" alt="Lead Mentor" />
                    ) : (
                      <div className="relative w-32 h-32 md:w-48 md:h-48 rounded-full bg-slate-100 border-4 border-white shadow-xl flex items-center justify-center"><User className="w-16 h-16 md:w-20 md:h-20 text-slate-300" /></div>
                    )}
                    <div className="absolute -bottom-2 -right-2 md:-bottom-3 md:-right-3 bg-white p-1.5 md:p-2 rounded-full shadow-lg border border-slate-100">
                      <div className="bg-blue-500 text-white w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center"><BadgeCheck className="w-4 h-4 md:w-5 md:h-5" /></div>
                    </div>
                  </div>
                  <div>
                      <h3 className="text-[10px] md:text-xs font-bold text-blue-600 uppercase tracking-[0.2em] mb-2 md:mb-3 flex items-center justify-center md:justify-start gap-2">Course Lead Mentor</h3>
                      <h4 className="text-2xl md:text-4xl font-extrabold mb-3 md:mb-4 tracking-tight text-slate-900">{course.tutor_name || "Expert Educator"}</h4>
                      <p className="text-sm md:text-lg text-slate-600 leading-relaxed font-medium">{course.tutor_bio || "Bringing years of industry experience and practical knowledge directly to your screen."}</p>
                  </div>
                </div>
            </section>

            <section>
                <div className="flex items-center gap-3 md:gap-4 mb-6 md:mb-10">
                  <div className="h-10 w-10 md:h-12 md:w-12 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                    <Target className="w-5 h-5 md:w-6 md:h-6" />
                  </div>
                  <h2 className="text-xl md:text-4xl font-extrabold tracking-tight text-slate-900">Who Is This Course For?</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                  {[
                    "Beginners starting from zero",
                    "Students preparing for the job market",
                    "Professionals looking to upgrade skills",
                    "Freelancers wanting to expand services"
                  ].map((item, i) => (
                    <div key={i} className="bg-blue-50/50 border border-blue-100 p-4 md:p-5 rounded-2xl flex items-center gap-3 md:gap-4">
                      <div className="bg-blue-500 text-white p-1 md:p-1.5 rounded-lg"><CheckCircle2 className="w-3.5 h-3.5 md:w-4 md:h-4"/></div>
                      <span className="font-semibold text-sm md:text-base text-slate-700">{item}</span>
                    </div>
                  ))}
                </div>
            </section>

            {course.syllabus_url && (
              <section>
                <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-5 md:p-8 rounded-2xl md:rounded-[2rem] border border-slate-700 flex flex-col md:flex-row items-center justify-between gap-5 md:gap-6 group hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                  <div className="flex items-center gap-4 md:gap-5 text-center md:text-left flex-col md:flex-row">
                     <div className="bg-emerald-500/20 p-3 md:p-4 rounded-2xl text-emerald-400 shrink-0">
                       <BookOpen className="w-6 h-6 md:w-8 md:h-8" />
                     </div>
                     <div>
                       <h3 className="text-white font-extrabold text-lg md:text-2xl mb-1 md:mb-1.5">View Detailed Syllabus</h3>
                       <p className="text-slate-400 text-xs md:text-sm font-medium">Know every topic you'll learn day-by-day before enrolling.</p>
                     </div>
                  </div>
                  <a 
                    href={course.syllabus_url} 
                    target="_blank" rel="noopener noreferrer" 
                    className="w-full md:w-auto px-6 py-3 md:px-8 md:py-4 bg-emerald-500 text-white rounded-xl font-bold md:font-black text-sm md:text-lg hover:bg-emerald-400 transition-colors whitespace-nowrap text-center shadow-lg shadow-emerald-500/30 active:scale-95"
                  >
                    Open PDF Curriculum
                  </a>
                </div>
              </section>
            )}

            <section>
                <div className="flex items-center gap-3 md:gap-4 mb-6 md:mb-10">
                  <div className="h-10 w-10 md:h-12 md:w-12 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                    <Sparkles className="w-5 h-5 md:w-6 md:h-6" />
                  </div>
                  <h2 className="text-xl md:text-4xl font-extrabold tracking-tight text-slate-900">What You Will Master</h2>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                    {parsedLearningOutcomes.length > 0 ? (
                        parsedLearningOutcomes.map((item: any, index: number) => (
                            <div key={index} className="bg-white border border-slate-200 hover:border-emerald-300 p-5 md:p-6 rounded-2xl md:rounded-3xl shadow-sm hover:shadow-md transition-all group">
                                <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500 mb-3 md:mb-4 group-hover:scale-110 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                                  <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5" />
                                </div>
                                <p className="font-semibold text-slate-700 leading-relaxed text-sm md:text-base">
                                  {typeof item === 'string' ? item : JSON.stringify(item)}
                                </p>
                            </div>
                        ))
                    ) : (
                        <p className="text-slate-500 italic col-span-2 p-6 md:p-8 border border-dashed border-slate-300 rounded-3xl text-center text-sm md:text-base">Curriculum details are being updated.</p>
                    )}
                </div>
            </section>

            {/* NEW STUDENT REVIEWS SECTION */}
            {reviews.length > 0 && (
              <section className="scroll-mt-24">
                  <div className="flex items-center gap-3 md:gap-4 mb-6 md:mb-8">
                    <div className="h-10 w-10 md:h-12 md:w-12 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                      <MessageSquareText className="w-5 h-5 md:w-6 md:h-6" />
                    </div>
                    <div>
                      <h2 className="text-xl md:text-4xl font-extrabold tracking-tight text-slate-900">Student Reviews</h2>
                    </div>
                  </div>

                  {/* Summary Box */}
                  <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm mb-8 flex flex-col md:flex-row gap-8 items-center">
                    <div className="flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-slate-200 pb-6 md:pb-0 md:pr-8 shrink-0">
                      <p className="text-4xl md:text-6xl font-black text-slate-900">{averageRating}</p>
                      <div className="flex mt-2 mb-1">
                        <ReviewStars rating={parseFloat(averageRating)} />
                      </div>
                      <p className="text-slate-500 font-semibold text-xs md:text-sm">Based on {reviews.length} reviews</p>
                    </div>

                    <div className="w-full flex-1 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                      <SubRatingBar label="Tutor" value={catAverages.tutor} />
                      <SubRatingBar label="Content" value={catAverages.content} />
                      <SubRatingBar label="Materials" value={catAverages.materials} />
                      <SubRatingBar label="Skill Impr." value={catAverages.skills} />
                    </div>
                  </div>
                  
                  {/* Reviews List */}
                  <div className="columns-1 sm:columns-2 gap-4 md:gap-6 space-y-4 md:space-y-6">
                      {visibleReviews.map((review) => (
                          <div key={review.id} className="break-inside-avoid bg-white p-5 md:p-6 rounded-2xl md:rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col">
                              <div className="flex justify-between items-start mb-4">
                                <ReviewStars rating={review.overall_rating || 5} />
                                {review.would_recommend?.toLowerCase() === 'yes' && (
                                  <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">
                                    <ThumbsUp size={12} /> Recommended
                                  </span>
                                )}
                              </div>
                              <p className="text-slate-700 italic font-medium text-sm md:text-base mb-5 leading-relaxed grow">
                                "{review.testimonial || review.liked_most}"
                              </p>
                              <div className="flex items-center gap-3 pt-4 border-t border-slate-100 mt-auto">
                                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 overflow-hidden border border-slate-200 shrink-0">
                                  {review.avatar_url ? (
                                    <img src={review.avatar_url} alt={review.name || "Student"} className="w-full h-full object-cover" />
                                  ) : (
                                    <User size={16} />
                                  )}
                                </div>
                                <div>
                                  <p className="font-bold text-slate-900 text-xs md:text-sm leading-tight">{review.name || "Anonymous Student"}</p>
                                  <p className="text-slate-400 text-[10px] md:text-xs mt-0.5">{new Date(review.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</p>
                                </div>
                              </div>
                          </div>
                      ))}
                  </div>

                  {/* Show All Toggle */}
                  {reviews.length > 4 && (
                    <div className="mt-8 flex justify-center">
                      <button 
                        onClick={() => setShowAllReviews(!showAllReviews)}
                        className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-3 px-6 rounded-xl transition-colors text-sm md:text-base"
                      >
                        {showAllReviews ? (
                          <>Show Less Reviews <ChevronUp size={18} /></>
                        ) : (
                          <>Read All {reviews.length} Reviews <ChevronDown size={18} /></>
                        )}
                      </button>
                    </div>
                  )}
              </section>
            )}

            <section className="bg-orange-50/50 border border-orange-100 p-6 md:p-10 rounded-3xl md:rounded-[3rem]">
                <div className="flex items-center gap-3 md:gap-4 mb-6 md:mb-8">
                  <div className="h-10 w-10 md:h-12 md:w-12 rounded-2xl bg-orange-500 flex items-center justify-center text-white shrink-0 shadow-md">
                    <TrendingUp className="w-5 h-5 md:w-6 md:h-6" />
                  </div>
                  <h2 className="text-xl md:text-3xl font-extrabold tracking-tight text-slate-900">Career Impact & Outcomes</h2>
                </div>
                <p className="text-slate-600 font-bold mb-6 md:mb-8 text-sm md:text-base">After completing this course, you will be able to:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 md:gap-6">
                  
                  <div className="flex gap-3 md:gap-4">
                    <div className="bg-white p-2.5 rounded-xl border border-orange-200 shrink-0 h-min shadow-sm">
                      <Briefcase className="w-4 h-4 md:w-5 md:h-5 text-orange-500" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm md:text-base text-slate-800">Job-Ready Portfolio</h4>
                      <p className="text-xs md:text-sm text-slate-600 mt-1">Showcase real projects to employers.</p>
                    </div>
                  </div>

                  <div className="flex gap-3 md:gap-4">
                    <div className="bg-white p-2.5 rounded-xl border border-orange-200 shrink-0 h-min shadow-sm">
                      <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-orange-500" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm md:text-base text-slate-800">Career Growth</h4>
                      <p className="text-xs md:text-sm text-slate-600 mt-1">Boost your earnings and land better roles.</p>
                    </div>
                  </div>

                </div>
            </section>
          </div>

          <div className="xl:col-span-1">
             <div className="sticky top-24 space-y-6 md:space-y-8">
                
                {/* Desktop Sidebar Offer Card */}
                <div className="bg-white p-6 md:p-8 rounded-3xl md:rounded-[3rem] border-2 border-orange-200 shadow-2xl relative overflow-hidden hidden xl:block">
                   <div className="absolute -top-10 -right-10 w-40 h-40 bg-orange-500/20 rounded-full blur-3xl animate-pulse"></div>
                   
                   <div className="flex items-center gap-2 mb-2 relative z-10">
                     <Zap className="w-5 h-5 text-orange-500 fill-orange-500" />
                     <h3 className="text-xl font-extrabold text-slate-900">Limited Time Offer</h3>
                   </div>
                   
                   <p className="text-slate-500 text-xs md:text-sm font-medium mb-5 relative z-10">
                     Offer expires in: <span className="font-mono font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded border border-red-100">
                       {String(offerTime.hours).padStart(2, '0')}h : {String(offerTime.mins).padStart(2, '0')}m : {String(offerTime.secs).padStart(2, '0')}s
                     </span>
                   </p>

                   <div className="mb-6 bg-red-50 p-4 rounded-2xl border border-red-100 relative overflow-hidden">
                     <div className="absolute top-0 left-0 w-1 h-full bg-red-500"></div>
                     <div className="flex flex-col">
                         <p className="text-xs md:text-sm font-bold text-red-600 mb-1 flex items-center gap-1.5">
                           <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span></span>
                           Filling fast today!
                         </p>
                         <p className="text-lg md:text-xl font-extrabold text-slate-900">Only <span className="text-red-600 text-3xl md:text-4xl">{seats}</span> discounted seats left</p>
                     </div>
                   </div>

                   <div className="relative group mb-5">
                       <div className="absolute -inset-1 bg-gradient-to-r from-orange-600 to-amber-500 rounded-2xl blur opacity-30 group-hover:opacity-60 transition duration-1000 group-hover:duration-200 animate-pulse"></div>
                       <EnrollButton onClick={handleBookSeat} className="relative w-full flex justify-center items-center gap-2 !py-3.5 md:!py-4 text-base md:text-[17px]">
                         🎓 Reserve My Discounted Seat
                       </EnrollButton>
                   </div>

                   <div className="flex flex-col items-center gap-3 border-t border-slate-100 pt-5">
                      <div className="flex items-center gap-2 text-[11px] md:text-xs text-slate-600 font-bold bg-slate-50 px-4 py-2 rounded-full border border-slate-200 shadow-sm w-full justify-center">
                         <Users className="w-3.5 h-3.5 md:w-4 md:h-4 text-emerald-500" />
                         Trusted by {displayStudentCount} students
                      </div>
                      <div className="flex items-center gap-2 text-[11px] md:text-xs text-slate-500 font-medium">
                         <ShieldCheck className="w-3.5 h-3.5 md:w-4 md:h-4 text-blue-500" />
                         Guidance by experts at GyanHub
                      </div>
                   </div>
                </div>

                <CertificateCard />
             </div>
          </div>
          
        </div>
      </main>

      {/* Mobile Sticky Enrollment Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 z-[100] flex items-center justify-between xl:hidden shadow-[0_-10px_20px_rgba(0,0,0,0.05)]">
          <div className="flex flex-col">
              <span className="text-[11px] font-bold text-red-500 mb-0.5 animate-pulse">Only {seats} discounted seats left</span>
              <span className="text-lg font-black text-slate-900">NRs. {formatPrice(finalPrice)}</span>
          </div>
          <EnrollButton onClick={handleBookSeat} className="!px-6 !py-3 !text-base">
              Reserve Seat
          </EnrollButton>
      </div>

    </div>
  );
}