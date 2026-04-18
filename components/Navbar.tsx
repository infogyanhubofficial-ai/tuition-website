'use client';

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation"; 
import { createClient } from "@/lib/supabase/client"; 
import { motion, AnimatePresence, useScroll, useSpring, Variants } from "framer-motion"; 
import { 
  Menu, X, House, Users, BriefcaseBusiness, 
  MonitorPlay, GraduationCap, PlusCircle, UserPlus,
  Settings, BookOpen, ChevronDown, Search, ChevronRight,
  Video, BookMarked, Bell, LayoutDashboard,
  Sparkles, Calendar, AlertCircle, Award, ShoppingBag, LogOut
} from "lucide-react";

// Data for the universal Search Palette
const searchData = [
  { label: "Home", href: "/", icon: House },
  { label: "Tutors", href: "/tutors", icon: Users },
  { label: "Vacancies", href: "/vacancies", icon: BriefcaseBusiness },
  { label: "Certificates", href: "/certificate", icon: GraduationCap },
  { label: "Recordings", href: "/recording", icon: Video }, 
  { label: "Dashboard", href: "/dashboard", icon: Settings },
  { label: "Post Tuition", href: "/post-tuition", icon: PlusCircle },
  { label: "Become a Tutor", href: "/become-a-tutor", icon: UserPlus },
  { label: "Online Class", href: "/onlinecourse", icon: MonitorPlay },
];

interface AppNotification {
  id: string;
  text: string;
  time: string;
  type: 'urgent' | 'warning' | 'info' | 'success';
  icon: any;
}

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter(); 
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  
  const [user, setUser] = useState<any>(null);
  const [isTutor, setIsTutor] = useState(false);
  const [loadingUser, setLoadingUser] = useState(true);
  
  const [actionDropdownOpen, setActionDropdownOpen] = useState(false);
  const [tuitionDropdownOpen, setTuitionDropdownOpen] = useState(false);
  const [mobileTuitionOpen, setMobileTuitionOpen] = useState(false);
  
  // Notification State
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [hasUnread, setHasUnread] = useState(false);
  const notifDropdownRef = useRef<HTMLDivElement>(null);

  // Search Modal State
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  const actionDropdownRef = useRef<HTMLDivElement>(null);
  const tuitionDropdownRef = useRef<HTMLDivElement>(null);

  const supabase = createClient();

  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100, damping: 30, restDelta: 0.001
  });

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const fetchUserActivity = useCallback(async (currentUser: any) => {
    const uid = currentUser.id;
    const email = currentUser.email;

    try {
      // Fetching all cross-functional data at once for the global notification feed
      const [
        enrollRes, orderRes, certRes,
        tutorRes, myReqsRes, myAppsRes, myVacanciesRes
      ] = await Promise.all([
        supabase.from('enrollments').select('*').eq('user_id', uid),
        supabase.from('orders').select('*').ilike('email', email),
        supabase.from('certificates').select('*').ilike('email', email),
        supabase.from('tutors').select('id').eq('user_id', uid).maybeSingle(),
        supabase.from('student_requests').select('id, status, created_at, tutors(name)').eq('user_id', uid),
        supabase.from('vacancy_applications').select('id, status, created_at, vacancies(subject)').eq('user_id', uid),
        supabase.from('vacancies').select('id').or(`user_id.eq.${uid},email.ilike.${email}`)
      ]);

      const enrollments = enrollRes.data || [];
      const orders = orderRes.data || [];
      const certs = certRes.data || [];

      // Associated Details Fetches
      let onlineCourses: any[] = [];
      if (enrollments.length > 0) {
        const cIds = Array.from(new Set(enrollments.map(e => e.course_id)));
        if (cIds.length > 0) {
          const { data: ocData } = await supabase.from('online_courses').select('id, title, start_datetime').in('id', cIds);
          onlineCourses = ocData || [];
        }
      }

      let incomingRequests: any[] = [];
      if (tutorRes.data) {
        const { data } = await supabase.from('student_requests').select('id, student_name, created_at').eq('tutor_id', tutorRes.data.id);
        incomingRequests = data || [];
      }

      let incomingApplications: any[] = [];
      if (myVacanciesRes.data && myVacanciesRes.data.length > 0) {
        const vIds = myVacanciesRes.data.map((v: any) => v.id);
        const { data } = await supabase.from('vacancy_applications').select('id, applicant_name, created_at, vacancies(subject), tutors(name)').in('vacancy_id', vIds);
        incomingApplications = data || [];
      }

      const notifs: AppNotification[] = [];
      const now = new Date();

      // 1. Upcoming Classes Priority
      let nextClass: { title: string, date: Date } | null = null;
      let closestDiff = Infinity;

      enrollments.forEach(e => {
        const c = onlineCourses.find(oc => oc.id === e.course_id || oc.title === e.course_name);
        if (c && c.start_datetime) {
          const start = new Date(c.start_datetime);
          if (start > now) {
            const diff = start.getTime() - now.getTime();
            if (diff < closestDiff) {
              closestDiff = diff;
              nextClass = { title: c.title, date: start };
            }
          }
        }
      });

      if (nextClass) {
        notifs.push({
          id: 'upcoming',
          text: `You have an upcoming online course "${(nextClass as any).title}" on ${(nextClass as any).date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}.`,
          time: new Date().toISOString(), // Stick it to top
          type: 'urgent',
          icon: Calendar
        });
      }

      // 2. Remaining Dues Priority
      enrollments.forEach(e => {
        if (e.remaining_amount > 0) {
          notifs.push({
            id: `due-${e.id}`,
            text: `You have a remaining due of Rs. ${e.remaining_amount} for your "${e.course_name}" enrollment.`,
            time: e.created_at,
            type: 'warning',
            icon: AlertCircle
          });
        }
      });

      // 3. App/Request Notifications (Tutors & Students)
      (myAppsRes.data || []).forEach((app: any) => {
        if (app.status !== 'pending') {
          const subj = Array.isArray(app.vacancies) ? app.vacancies[0]?.subject : app.vacancies?.subject;
          notifs.push({
            id: `my-app-${app.id}-${app.status}`,
            text: `Your application to "${subj || 'vacancy'}" was ${app.status}.`,
            time: app.created_at,
            type: app.status === 'accepted' ? 'success' : 'warning',
            icon: BriefcaseBusiness
          });
        }
      });

      (myReqsRes.data || []).forEach((req: any) => {
        if (req.status !== 'pending') {
          const tName = Array.isArray(req.tutors) ? req.tutors[0]?.name : req.tutors?.name;
          notifs.push({
            id: `my-req-${req.id}-${req.status}`,
            text: `${tName || 'Tutor'} ${req.status} your coaching request.`,
            time: req.created_at,
            type: req.status === 'accepted' ? 'success' : 'warning',
            icon: Users
          });
        }
      });

      incomingRequests.forEach((req: any) => {
        notifs.push({
          id: `in-req-${req.id}`,
          text: `${req.student_name} requested you for coaching.`,
          time: req.created_at,
          type: 'info',
          icon: Users
        });
      });

      incomingApplications.forEach((app: any) => {
        const tName = app.tutors?.name || app.applicant_name;
        const subj = Array.isArray(app.vacancies) ? app.vacancies[0]?.subject : app.vacancies?.subject;
        notifs.push({
          id: `in-app-${app.id}`,
          text: `${tName} applied to your vacancy: "${subj}".`,
          time: app.created_at,
          type: 'info',
          icon: BriefcaseBusiness
        });
      });

      // 4. Second Person Timeline (Sorted Descending)
      const timeline: AppNotification[] = [
        ...orders.filter((o: any) => o.order_type?.toLowerCase() === 'recording').map((o: any) => ({
          id: `ord-${o.id}`,
          text: `You have purchased ${o.order_name} recordings.`,
          time: o.created_at,
          type: 'info' as const,
          icon: ShoppingBag
        })),
        ...enrollments.map(e => ({
          id: `enr-${e.id}`,
          text: `You have enrolled in ${e.course_name} online course.`,
          time: e.created_at,
          type: 'info' as const,
          icon: BookOpen
        })),
        ...certs.map(c => ({
          id: `cert-${c.id}`,
          text: `You have earned a certificate: ${c.syllabus_name || c.name}.`,
          time: c.issue_date,
          type: 'success' as const,
          icon: Award
        }))
      ];

      notifs.push(...timeline);

      // Final Sorting by Time
      notifs.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

      setNotifications(notifs);
      if (notifs.length > 0) setHasUnread(true);
      
    } catch (err) {
      console.error("Error fetching notifications:", err);
    }
  }, [supabase]);

  useEffect(() => {
    let mounted = true;

    const fetchSessionAndTutorStatus = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        if (mounted) {
          setUser(null);
          setIsTutor(false);
          setLoadingUser(false);
        }
        return;
      }

      if (mounted) setUser(user);

      // Trigger notification fetch immediately after fetching user
      fetchUserActivity(user);

      try {
        const { data, error } = await supabase
          .from('tutors')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) console.error("Supabase Error checking tutor status:", error.message);
        if (mounted) setIsTutor(!!data);
      } catch (err) {
        console.error("Unexpected error:", err);
      } finally {
        if (mounted) setLoadingUser(false);
      }
    };

    fetchSessionAndTutorStatus();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        if (session?.user) {
          fetchSessionAndTutorStatus();
        } else {
          setUser(null);
          setIsTutor(false);
          setLoadingUser(false);
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase, fetchUserActivity]);

  // Real-Time Notification Subscription for Navbar
  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase.channel('navbar_realtime_updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vacancy_applications' }, () => fetchUserActivity(user))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'student_requests' }, () => fetchUserActivity(user))
      .subscribe();
      
    return () => { supabase.removeChannel(channel); };
  }, [user, fetchUserActivity, supabase]);

  // Handle outside clicks for dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (actionDropdownRef.current && !actionDropdownRef.current.contains(event.target as Node)) {
        setActionDropdownOpen(false);
      }
      if (tuitionDropdownRef.current && !tuitionDropdownRef.current.contains(event.target as Node)) {
        setTuitionDropdownOpen(false);
      }
      if (notifDropdownRef.current && !notifDropdownRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle Keyboard shortcuts for Search Modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Auto-focus search input when modal opens
  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [isSearchOpen]);

  const handleLogin = () => {
    setMobileOpen(false); 
    router.push(`/login?next=${pathname}`); 
  };

  const isActive = useMemo(() => {
    return (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
  }, [pathname]);

  const filteredSearchData = useMemo(() => {
    if (!searchQuery.trim()) return searchData;
    return searchData.filter((item) => 
      item.label.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  const executeSearchAction = (href: string) => {
    setIsSearchOpen(false);
    setSearchQuery("");
    setMobileOpen(false);
    router.push(href);
  };

  const mobileMenuVars: Variants = {
    initial: { opacity: 0, y: "100%" },
    animate: { opacity: 1, y: 0, transition: { type: "spring", damping: 25, stiffness: 200 } },
    exit: { opacity: 0, y: "100%", transition: { duration: 0.2 } }
  };

  const isTuitionActive = pathname.startsWith("/tutors") || pathname.startsWith("/vacancies");

  return (
    <>
      <div className="h-[76px] lg:h-[94px] w-full flex-shrink-0" aria-hidden="true" />

      {/* Progress Bar */}
      <motion.div 
        className="fixed top-0 left-0 right-0 h-[3px] bg-[#2D9CDB] origin-left z-[70]" 
        style={{ scaleX }} 
      />

      <div className={`fixed top-0 left-0 right-0 z-50 flex justify-center transition-all duration-300 ${scrolled ? 'pt-1 md:pt-2 px-3 md:px-6' : 'pt-2 md:pt-4 px-3 md:px-8'}`}>
        
        {/* ⭐ Gradient Border Wrapper */}
        <header 
          className={`w-full transition-all duration-300 ease-in-out rounded-full p-[1px] bg-gradient-to-r from-[#2D9CDB]/30 via-transparent to-[#FF6B35]/30 ${
            scrolled ? "max-w-[78rem] shadow-[0_8px_30px_rgb(0,0,0,0.06)]" : "max-w-[90rem] shadow-sm"
          }`}
        >
          <div className={`w-full h-full flex items-center justify-between gap-2 xl:gap-4 bg-white/90 backdrop-blur-xl rounded-full ${
            scrolled ? "py-1.5 md:py-2 px-3 md:px-5" : "py-2 md:py-3.5 px-4 md:px-8"
          }`}>
            
            {/* Logo */}
            <Link href="/" className="flex-shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-[#2D9CDB] z-20 rounded-lg">
              <motion.div 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`relative transition-all duration-300 ${
                  scrolled ? 'w-[125px] h-[36px] lg:w-[150px] lg:h-[42px]' : 'w-[135px] h-[40px] lg:w-[175px] lg:h-[50px]'
                }`}
              >
                <Image src="https://zuktarghyexwodqnnxlu.supabase.co/storage/v1/object/public/others/GyanHub_logo_website-removebg-preview__1_-removebg-preview.webp" alt="GyanHub Logo" fill className="object-contain" priority />
              </motion.div>
            </Link>

            {/* Desktop Nav Items */}
            <nav className="hidden lg:flex items-center justify-center gap-1 xl:gap-2 ml-4">
              
              <motion.div whileHover={{ y: -1 }} whileTap={{ scale: 0.97 }} className="relative flex flex-col justify-center">
                <Link 
                  href="/" 
                  className={`relative flex items-center px-3 py-2 rounded-lg text-[14px] font-semibold outline-none whitespace-nowrap transition-colors duration-200 ${isActive("/") ? "text-[#2D9CDB]" : "text-slate-500 hover:text-slate-800"}`}
                >
                  Home
                </Link>
                {isActive("/") && (
                  <motion.div layoutId="nav-indicator" className="absolute -bottom-1 left-3 right-3 h-[2px] bg-[#2D9CDB] rounded-full" />
                )}
              </motion.div>

              <motion.div 
                whileHover={{ y: -1 }} whileTap={{ scale: 0.97 }}
                className="relative flex flex-col justify-center" 
                ref={tuitionDropdownRef}
                onMouseEnter={() => setTuitionDropdownOpen(true)}
                onMouseLeave={() => setTuitionDropdownOpen(false)}
              >
                <button 
                  onClick={() => setTuitionDropdownOpen(!tuitionDropdownOpen)}
                  className={`flex items-center gap-1 px-3 py-2 rounded-lg text-[14px] font-semibold outline-none whitespace-nowrap transition-colors duration-200 ${isTuitionActive ? "text-[#2D9CDB]" : "text-slate-500 hover:text-slate-800"}`}
                >
                  <BookMarked className="h-[15px] w-[15px]" strokeWidth={2.5} />
                  Tuition
                  <ChevronDown className={`h-3.5 w-3.5 ml-0.5 transition-transform duration-200 ${tuitionDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                {isTuitionActive && (
                  <motion.div layoutId="nav-indicator" className="absolute -bottom-1 left-3 right-3 h-[2px] bg-[#2D9CDB] rounded-full" />
                )}
                
                {/* Layered Dropdown Panel */}
                <AnimatePresence>
                  {tuitionDropdownOpen && (
                    <motion.div 
                      initial={{ opacity: 0, y: 8, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.98 }}
                      transition={{ duration: 0.15 }}
                      className="absolute left-0 top-[calc(100%+4px)] w-56 rounded-2xl border border-slate-100/80 bg-white/95 backdrop-blur-xl p-2 shadow-[0_12px_40px_rgba(0,0,0,0.08)] z-50 origin-top-left cursor-default"
                    >
                      <Link href="/tutors" onClick={() => setTuitionDropdownOpen(false)} className="flex items-start gap-3 px-3 py-2.5 rounded-xl transition-colors group hover:bg-slate-50">
                        <Users className="h-5 w-5 mt-0.5 text-slate-400 group-hover:text-[#2D9CDB]" strokeWidth={2} />
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-slate-700 group-hover:text-[#2D9CDB]">Find Tutors</span>
                          <span className="text-[11px] text-slate-500">For students & parents</span>
                        </div>
                      </Link>
                      <Link href="/vacancies" onClick={() => setTuitionDropdownOpen(false)} className="flex items-start gap-3 px-3 py-2.5 rounded-xl transition-colors group hover:bg-slate-50 mt-1">
                        <BriefcaseBusiness className="h-5 w-5 mt-0.5 text-slate-400 group-hover:text-[#2D9CDB]" strokeWidth={2} />
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-slate-700 group-hover:text-[#2D9CDB]">View Vacancies</span>
                          <span className="text-[11px] text-slate-500">Explore teaching jobs</span>
                        </div>
                      </Link>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* ⭐ Image-Accurate Online Course Button (With Exact HOT Badge) */}
              <motion.div whileHover={{ y: -1 }} whileTap={{ scale: 0.97 }} className="relative flex items-center px-1 lg:pl-2">
                <Link href="/onlinecourse" className="relative flex items-center gap-1.5 rounded-full bg-gradient-to-b from-[#FF7A4A] to-[#FF6B35] px-4 py-2.5 text-[14px] font-semibold text-white shadow-[0_4px_12px_rgba(255,107,53,0.25)] hover:shadow-[0_6px_16px_rgba(255,107,53,0.35)] transition-all duration-200 mt-1">
                  <MonitorPlay className="h-[16px] w-[16px]" strokeWidth={2} />
                  Online Class
                  
                  {/* EXACT HOT Glowing Indicator Pill */}
                  <span className="absolute -top-3.5 -right-3 flex items-center justify-center rounded-full bg-white px-2.5 py-[2px] text-[9px] font-black tracking-wide text-[#FF6B35] shadow-[0_2px_10px_rgba(255,107,53,0.2)] border border-[#FF6B35]/40 z-10 animate-pulse">
                    <Sparkles className="w-[10px] h-[10px] mr-[3px]" strokeWidth={3} /> HOT
                  </span>
                </Link>
              </motion.div>

              {/* ⭐ Glowing Fade Blue Recording Button Desktop */}
              <motion.div whileHover={{ y: -1 }} whileTap={{ scale: 0.97 }} className="relative flex flex-col justify-center px-1 lg:ml-2">
                <Link href="/recording" className="relative flex items-center gap-1.5 rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 px-4 py-2 text-[13px] font-semibold text-white transition-all duration-200 shadow-[0_0_15px_rgba(59,130,246,0.4)] hover:shadow-[0_0_20px_rgba(59,130,246,0.6)] mt-1">
                  <Video className="h-[15px] w-[15px]" strokeWidth={2} />
                  Recordings
                </Link>
                {isActive("/recording") && (
                  <motion.div layoutId="nav-indicator" className="absolute -bottom-1.5 left-3 right-3 h-[2px] bg-blue-500 rounded-full" />
                )}
              </motion.div>

              {/* Certificate */}
              <motion.div whileHover={{ y: -1 }} whileTap={{ scale: 0.97 }} className="relative flex flex-col justify-center">
                <Link 
                  href="/certificate" 
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-[14px] font-semibold outline-none whitespace-nowrap transition-colors duration-200 ${isActive("/certificate") ? "text-[#2D9CDB]" : "text-slate-500 hover:text-slate-800"}`}
                >
                  <GraduationCap className="h-[16px] w-[16px]" strokeWidth={2} />
                  Certificate
                </Link>
                {isActive("/certificate") && (
                  <motion.div layoutId="nav-indicator" className="absolute -bottom-1 left-3 right-3 h-[2px] bg-[#2D9CDB] rounded-full" />
                )}
              </motion.div>

            </nav>

            {/* Desktop Actions */}
            <div className="hidden lg:flex flex-shrink-0 items-center gap-3 xl:gap-5 z-20">
              
              {/* Command Palette Search */}
              <button 
                onClick={() => setIsSearchOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-slate-500 hover:text-slate-800 bg-slate-50/50 border border-slate-200/70 hover:bg-slate-100 transition-all shadow-sm text-[13px] font-semibold"
              >
                <Search className="h-4 w-4" /> 
                <span className="hidden xl:inline">Search</span>
                <kbd className="hidden xl:flex items-center text-[10px] bg-slate-200/60 text-slate-500 px-1.5 py-0.5 rounded font-sans font-medium border border-slate-300/50">
                  ⌘K
                </kbd>
              </button>

              {/* Grouped Action Buttons */}
              {!loadingUser && !isTutor && (
                <div className="relative" ref={actionDropdownRef}>
                  <button 
                    onClick={() => setActionDropdownOpen(!actionDropdownOpen)}
                    className="flex items-center gap-1 px-3 py-2 text-[14px] font-semibold text-slate-600 hover:text-slate-900 transition-colors"
                  >
                    Get Started <ChevronDown className={`h-3.5 w-3.5 ml-0.5 transition-transform duration-200 ${actionDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  
                  <AnimatePresence>
                    {actionDropdownOpen && (
                      <motion.div 
                        initial={{ opacity: 0, y: 8, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.98 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-[calc(100%+8px)] w-56 rounded-2xl border border-slate-100/80 bg-white/95 backdrop-blur-xl p-2 shadow-[0_12px_40px_rgba(0,0,0,0.08)] z-50 origin-top-right"
                      >
                        <Link href="/post-tuition" onClick={() => setActionDropdownOpen(false)} className="flex items-start gap-3 px-3 py-2.5 rounded-xl transition-colors group hover:bg-slate-50">
                          <PlusCircle className="h-5 w-5 mt-0.5 text-slate-400 group-hover:text-[#2D9CDB]" strokeWidth={2} />
                          <div className="flex flex-col">
                            <span className="text-sm font-semibold text-slate-700 group-hover:text-[#2D9CDB]">Post a Tuition</span>
                            <span className="text-[11px] text-slate-500">For students & parents</span>
                          </div>
                        </Link>
                        <Link href="/become-a-tutor" onClick={() => setActionDropdownOpen(false)} className="flex items-start gap-3 px-3 py-2.5 rounded-xl transition-colors group hover:bg-slate-50 mt-1">
                          <UserPlus className="h-5 w-5 mt-0.5 text-slate-400 group-hover:text-[#2D9CDB]" strokeWidth={2} />
                          <div className="flex flex-col">
                            <span className="text-sm font-semibold text-slate-700 group-hover:text-[#2D9CDB]">Become a Tutor</span>
                            <span className="text-[11px] text-slate-500">For educators</span>
                          </div>
                        </Link>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Profile Area */}
              <div className="relative pl-6 flex items-center border-l border-slate-200/40">
                
                {/* ⭐ Interactive Notification Dropdown */}
                {!loadingUser && user && (
                  <div className="relative" ref={notifDropdownRef}>
                    <button 
                      onClick={() => { setShowNotifications(!showNotifications); setHasUnread(false); }} 
                      className="relative mr-3 p-2 text-slate-400 hover:text-slate-700 transition-colors rounded-full hover:bg-slate-100 outline-none"
                    >
                      <Bell className="h-5 w-5" strokeWidth={2} />
                      {hasUnread && <span className="absolute top-2 right-2.5 h-2 w-2 bg-red-500 rounded-full border border-white animate-pulse" />}
                    </button>

                    <AnimatePresence>
                      {showNotifications && (
                        <motion.div 
                          initial={{ opacity: 0, y: 8, scale: 0.98 }} 
                          animate={{ opacity: 1, y: 0, scale: 1 }} 
                          exit={{ opacity: 0, y: 8, scale: 0.98 }} 
                          transition={{ duration: 0.15 }}
                          className="absolute right-0 top-[calc(100%+12px)] w-80 sm:w-[400px] rounded-[24px] border border-slate-100 bg-white shadow-[0_20px_60px_rgba(0,0,0,0.12)] z-50 origin-top-right overflow-hidden flex flex-col max-h-[75vh]"
                        >
                          <div className="p-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center shrink-0">
                            <div>
                              <h4 className="font-black text-slate-800 text-base">Activity & Updates</h4>
                              <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mt-0.5">Your Recent Timeline</p>
                            </div>
                            <button onClick={() => setShowNotifications(false)} className="p-1.5 bg-white rounded-full text-slate-400 hover:text-slate-600 shadow-sm border border-slate-200"><X size={14} /></button>
                          </div>
                          
                          <div className="overflow-y-auto p-3 custom-scrollbar flex flex-col gap-2 flex-grow">
                            {notifications.length === 0 ? (
                              <div className="p-8 text-center text-slate-500 flex flex-col items-center gap-2">
                                <Bell className="w-8 h-8 opacity-20 text-slate-400 mb-2" />
                                <span className="text-sm font-bold text-slate-400">All caught up! 🎉</span>
                              </div>
                            ) : (
                              notifications.map((n) => {
                                const isUrgent = n.type === 'urgent';
                                const isWarning = n.type === 'warning';
                                const isSuccess = n.type === 'success';
                                
                                const bgClass = isUrgent ? 'bg-orange-50 border-orange-100' : isWarning ? 'bg-red-50 border-red-100' : isSuccess ? 'bg-emerald-50 border-emerald-100' : 'bg-white border-slate-100 hover:bg-slate-50';
                                const textClass = isUrgent ? 'text-orange-800' : isWarning ? 'text-red-800' : isSuccess ? 'text-emerald-800' : 'text-slate-700';
                                const iconColor = isUrgent ? 'text-orange-500' : isWarning ? 'text-red-500' : isSuccess ? 'text-emerald-500' : 'text-blue-500';
                                const IconComp = n.icon || Bell;

                                return (
                                  <div key={n.id} className={`p-4 rounded-[16px] border flex gap-4 items-start transition-colors shadow-sm ${bgClass}`}>
                                    <div className={`p-2 rounded-full shrink-0 bg-white shadow-sm border border-slate-100/50 ${iconColor}`}>
                                      <IconComp size={16} />
                                    </div>
                                    <div className="flex-1 mt-0.5">
                                      <p className={`text-[13px] font-bold leading-snug ${textClass}`}>{n.text}</p>
                                      <p className="text-[10px] text-slate-400 font-black mt-2 uppercase tracking-wider">
                                        {new Date(n.time).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                      </p>
                                    </div>
                                  </div>
                                )
                              })
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {loadingUser ? (
                  <div className="h-10 w-[120px] animate-pulse rounded-full bg-slate-100" />
                ) : !user ? (
                  <button onClick={handleLogin} className="rounded-xl px-5 py-2.5 text-[13px] font-bold text-white bg-slate-900 hover:bg-slate-800 transition-colors whitespace-nowrap shadow-md">
                    Log In
                  </button>
                ) : (
                  /* ⭐ FIX: Parent wrapper relative, but NOT overflow hidden */
                  <Link 
                    href="/dashboard"
                    className="group flex items-center gap-2.5 p-1 pr-4 rounded-full bg-white/60 backdrop-blur-sm border border-slate-200/80 hover:bg-white hover:shadow-[0_4px_20px_-4px_rgba(45,156,219,0.15)] hover:border-[#2D9CDB]/30 hover:ring-2 hover:ring-[#2D9CDB]/20 transition-all duration-300"
                  >
                    <div className="relative h-8 w-8 shrink-0">
                      {/* Image container handles the overflow masking */}
                      <div className="relative h-full w-full rounded-full overflow-hidden shadow-sm bg-slate-100 border border-slate-100 group-hover:border-white transition-colors">
                        <Image 
                          src={user?.user_metadata?.avatar_url || "/images/default-avatar.png"} 
                          alt="Profile" 
                          fill 
                          sizes="32px" 
                          className="object-cover" 
                        />
                      </div>
                      {/* Online indicator dot placed securely outside the overflow-hidden div */}
                      <span className="absolute bottom-0 right-0 h-2.5 w-2.5 bg-green-500 rounded-full ring-[2px] ring-white animate-[onlineGlow_2s_infinite] z-10" />
                    </div>
                    <span className="text-[13px] font-bold text-slate-700 group-hover:text-[#2D9CDB] transition-colors leading-none">
                      Dashboard
                    </span>
                  </Link>
                )}
              </div>
            </div>

            {/* Mobile Top Bar Actions */}
            <div className="flex items-center gap-5 ml-auto lg:hidden z-20">
              <button onClick={() => setIsSearchOpen(true)} className="p-1.5 text-slate-500 hover:text-slate-800 transition-colors">
                <Search className="h-5 w-5" strokeWidth={2} />
              </button>

              {loadingUser ? (
                <div className="h-8 w-8 rounded-full bg-slate-100 animate-pulse" />
              ) : !user ? (
                <button onClick={handleLogin} className="text-[13px] font-bold text-slate-800 transition-colors whitespace-nowrap">
                  Log In
                </button>
              ) : (
                /* ⭐ FIX for Mobile Profile Dropdown: Prevent clipping */
                <button className="relative h-8 w-8 shrink-0 cursor-pointer group" onClick={() => setMobileOpen(true)}>
                  <div className="relative h-full w-full rounded-full overflow-hidden border border-slate-200 shadow-sm group-hover:ring-2 group-hover:ring-[#2D9CDB]/30 transition-all">
                    <Image src={user?.user_metadata?.avatar_url || "/images/default-avatar.png"} alt="Profile" fill sizes="32px" className="object-cover" />
                  </div>
                  <span className="absolute bottom-0 right-0 h-2.5 w-2.5 bg-green-500 rounded-full ring-[2px] ring-white animate-[onlineGlow_2s_infinite] z-10" />
                </button>
              )}
              
              <button 
                onClick={() => setMobileOpen(true)} 
                className="p-1.5 text-slate-700 hover:text-slate-900 transition-colors"
              >
                <Menu className="h-6 w-6" strokeWidth={2} />
              </button>
            </div>

          </div>
        </header>
      </div>

      {/* --- SEARCH MODAL (COMMAND PALETTE) --- */}
      <AnimatePresence>
        {isSearchOpen && (
          <div className="fixed inset-0 z-[110] flex items-start justify-center pt-[12vh] px-4 sm:px-6">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}
              onClick={() => setIsSearchOpen(false)}
              className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.98, y: -10 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.98, y: -10 }} 
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative w-full max-w-xl bg-white rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.15)] overflow-hidden border border-slate-100 flex flex-col"
            >
              <div className="flex items-center px-4 py-4 border-b border-slate-100">
                <Search className="h-5 w-5 text-slate-400" />
                <input 
                  ref={searchInputRef}
                  type="text"
                  placeholder="Where do you want to go?" 
                  className="flex-1 ml-3 bg-transparent text-slate-800 text-base outline-none placeholder:text-slate-400 font-medium"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button 
                  onClick={() => setIsSearchOpen(false)} 
                  className="p-1.5 bg-slate-50 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors flex items-center gap-2"
                >
                  <span className="text-[10px] font-bold">ESC</span>
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="max-h-[50vh] overflow-y-auto p-2 flex flex-col gap-0.5">
                {filteredSearchData.length > 0 ? (
                  filteredSearchData.map((item, idx) => (
                    <button 
                      key={idx}
                      onClick={() => executeSearchAction(item.href)}
                      className="flex items-center justify-between w-full px-4 py-3 rounded-xl hover:bg-slate-50 group transition-colors outline-none focus-visible:bg-slate-50"
                    >
                      <div className="flex items-center gap-3">
                        <item.icon className="h-4 w-4 text-slate-400 group-hover:text-[#2D9CDB] transition-colors" strokeWidth={2} />
                        <span className="text-slate-600 text-sm font-semibold group-hover:text-slate-900 transition-colors">{item.label}</span>
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  ))
                ) : (
                  <div className="px-6 py-10 text-center flex flex-col items-center">
                    <Search className="h-8 w-8 text-slate-200 mb-3" />
                    <p className="text-slate-500 text-sm">No pages found matching "<span className="text-slate-800 font-medium">{searchQuery}</span>"</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- MOBILE MENU DRAWER --- */}
      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-[100] flex flex-col justify-end">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
              onClick={() => setMobileOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            
            <motion.div 
              variants={mobileMenuVars}
              initial="initial" animate="animate" exit="exit"
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={0.2}
              onDragEnd={(e, info) => {
                if (info.offset.y > 100) setMobileOpen(false); 
              }}
              className="relative w-full bg-white rounded-t-3xl px-5 pb-8 pt-3 shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto"
            >
              <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-5" />

              <div className="flex justify-between items-center mb-6">
                <Image src="https://zuktarghyexwodqnnxlu.supabase.co/storage/v1/object/public/others/GyanHub_logo_website-removebg-preview__1_-removebg-preview.webp" alt="Logo" width={110} height={35} />
                <button onClick={() => setMobileOpen(false)} className="p-2 bg-slate-50 rounded-full text-slate-500">
                  <X className="h-5 w-5" strokeWidth={2} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto pb-6 space-y-7">
                
                {/* Explore Navigation */}
                <div>
                  <h4 className="px-2 mb-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">Navigation</h4>
                  <div className="flex flex-col gap-0.5">
                    
                    <button onClick={() => { setMobileOpen(false); router.push("/"); }} className={`flex w-full items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold transition-colors ${isActive("/") ? "bg-slate-50 text-[#2D9CDB]" : "text-slate-600 hover:bg-slate-50"}`}>
                      <House className="h-4 w-4" strokeWidth={2} /> Home
                    </button>

                    <div className="flex flex-col">
                      <button onClick={() => setMobileTuitionOpen(!mobileTuitionOpen)} className={`flex w-full items-center justify-between px-3 py-3 rounded-xl text-sm font-semibold transition-colors ${isTuitionActive ? "bg-slate-50 text-[#2D9CDB]" : "text-slate-600 hover:bg-slate-50"}`}>
                        <div className="flex items-center gap-3">
                          <BookMarked className="h-4 w-4" strokeWidth={2} /> Tuition
                        </div>
                        <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${mobileTuitionOpen ? 'rotate-180' : ''}`} />
                      </button>
                      <AnimatePresence>
                        {mobileTuitionOpen && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                            <div className="pl-10 pr-4 py-1 flex flex-col gap-1">
                              <button onClick={() => { setMobileOpen(false); router.push("/tutors"); }} className={`flex items-center py-2 text-sm font-medium ${isActive("/tutors") ? "text-[#2D9CDB]" : "text-slate-500"}`}>Find Tutors</button>
                              <button onClick={() => { setMobileOpen(false); router.push("/vacancies"); }} className={`flex items-center py-2 text-sm font-medium ${isActive("/vacancies") ? "text-[#2D9CDB]" : "text-slate-500"}`}>View Vacancies</button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* ⭐ Exact Mobile HOT Badge Fix */}
                    <button onClick={() => { setMobileOpen(false); router.push("/onlinecourse"); }} className={`relative flex w-full items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold transition-colors ${isActive("/onlinecourse") ? "bg-slate-50 text-[#FF6B35]" : "text-slate-600 hover:bg-slate-50"}`}>
                      <MonitorPlay className="h-4 w-4" strokeWidth={2} /> Online Class
                      <span className="absolute top-2 right-2 flex items-center justify-center rounded-full bg-white px-2 py-[2px] text-[8px] font-black tracking-wide text-[#FF6B35] shadow-sm border border-[#FF6B35]/40 animate-pulse">
                        <Sparkles className="w-2.5 h-2.5 mr-[2px]" strokeWidth={3} /> HOT
                      </span>
                    </button>

                    {/* ⭐ Mobile Glowing Recording Button */}
                    <button onClick={() => { setMobileOpen(false); router.push("/recording"); }} className="relative flex w-full items-center gap-3 px-4 py-3 mt-1 rounded-xl text-sm font-semibold transition-colors bg-gradient-to-r from-blue-500 to-cyan-400 text-white shadow-[0_4px_12px_rgba(59,130,246,0.4)]">
                      <Video className="h-4 w-4" strokeWidth={2} /> Recordings
                    </button>

                    <button onClick={() => { setMobileOpen(false); router.push("/certificate"); }} className={`flex w-full items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold transition-colors ${isActive("/certificate") ? "bg-slate-50 text-[#2D9CDB]" : "text-slate-600 hover:bg-slate-50"}`}>
                      <GraduationCap className="h-4 w-4" strokeWidth={2} /> Certificate
                    </button>

                  </div>
                </div>

                {/* Single Dashboard Focus */}
                {!loadingUser && user && (
                  <div>
                    <h4 className="px-2 mb-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">Account</h4>
                    <button 
                      onClick={() => { setMobileOpen(false); router.push('/dashboard'); }} 
                      className="w-full bg-slate-50 text-slate-700 py-3.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 border border-slate-100 hover:bg-slate-100 transition-colors"
                    >
                      <LayoutDashboard className="h-4 w-4 text-[#2D9CDB]" /> 
                      Go to Dashboard
                    </button>
                  </div>
                )}

                {/* Actions & Auth */}
                <div>
                  <h4 className="px-2 mb-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">Actions</h4>
                  <div className="flex flex-col gap-3">
                    {!loadingUser && !isTutor && (
                      <div className="grid grid-cols-2 gap-3">
                        <button onClick={() => { setMobileOpen(false); router.push('/post-tuition'); }} className="flex flex-col items-center justify-center gap-1.5 bg-slate-50 border border-slate-100 shadow-sm text-slate-700 py-3.5 rounded-xl text-sm font-bold">
                          <PlusCircle className="h-5 w-5 text-[#2D9CDB]" />
                          <span>Post Tuition</span>
                        </button>
                        <button onClick={() => { setMobileOpen(false); router.push('/become-a-tutor'); }} className="flex flex-col items-center justify-center gap-1.5 bg-slate-50 border border-slate-100 shadow-sm text-slate-700 py-3.5 rounded-xl text-sm font-bold">
                          <UserPlus className="h-5 w-5 text-[#2D9CDB]" />
                          <span>Become Tutor</span>
                        </button>
                      </div>
                    )}
                    
                    <button onClick={() => { setMobileOpen(false); router.push('/onlinecourse'); }} className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-[#FF7A4A] to-[#FF6B35] shadow-[0_4px_12px_rgba(255,107,53,0.25)] text-white py-3.5 text-sm font-bold mt-1">
                      <MonitorPlay className="h-4 w-4" strokeWidth={2.5} /> Explore Online Classes
                    </button>

                    {!loadingUser && !user && (
                      <button onClick={handleLogin} className="w-full mt-2 flex items-center justify-center rounded-xl bg-slate-900 text-white py-4 text-sm font-bold shadow-md">
                        Log In / Sign Up
                      </button>
                    )}
                  </div>
                </div>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}