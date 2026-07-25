'use client';

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation"; 
import { createClient } from "@/lib/supabase/client"; 
import { motion, AnimatePresence, useScroll, useSpring, Variants } from "framer-motion"; 
import { 
  Menu, X, House, 
  MonitorPlay, GraduationCap, 
  Settings, BookOpen, Search, ChevronRight,
  Video, BookMarked, Bell, LayoutDashboard,
  Sparkles, AlertCircle, CheckCircle, ShieldAlert, ShoppingBag, 
  MessageCircle, Package
} from "lucide-react";

/* ============================================================
   BRAND TOKENS — must match homepage exactly:
   Primary Blue   #1E3A8A -> blue-900 (trust / headings / dark CTAs)
   Secondary Blue #2563EB -> blue-600 (interactive / links / online-class identity)
   Accent Orange  #F97316 -> orange-500 (CTAs, badges, "HOT"/urgency ONLY — never a category identity)
   Accent Teal    #10B981 -> emerald-500/600 (physical / success / active / location)
   ============================================================ */

// Data for the universal Search Palette
const searchData = [
  { label: "Home", href: "/", icon: House },
  { label: "Physical Classes", href: "/offline-class", icon: BookMarked },
  { label: "Online Class", href: "/onlinecourse", icon: MonitorPlay },
  { label: "Recordings", href: "/recording", icon: Video },
  { label: "Career-Ready Bundles", href: "/#bundles-section", icon: Package },
  { label: "Certificates", href: "/certificate", icon: GraduationCap },
  { label: "Dashboard", href: "/dashboard", icon: Settings },
];

interface AppNotification {
  id: string;
  text: string;
  time: string;
  type: 'urgent' | 'warning' | 'info' | 'success';
  icon: any;
  actionUrl: string; 
}

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter(); 
  const [mobileOpen, setMobileOpen] = useState(false);
  
  const [user, setUser] = useState<any>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  // Notification State
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [hasUnread, setHasUnread] = useState(false);
  const notifDropdownRef = useRef<HTMLDivElement>(null);

  // Search Modal State
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [avatarError, setAvatarError] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const [supabase] = useState(() => createClient());

  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });

  const fetchUserActivity = useCallback(async (currentUser: any) => {
    const uid = currentUser.id;
    const email = currentUser.email;

    try {
      // Aggregate Data Fetching (Removed Tutor & Vacancy tables)
      const [
        enrollRes, orderRes, messagesRes, batchesRes
      ] = await Promise.all([
        supabase.from('enrollments_v2').select('*').or(`user_id.eq.${uid},email.ilike.${email}`),
        supabase.from('orders_v2').select('*').or(`user_id.eq.${uid},email.ilike.${email}`),
        supabase.from('messages').select('*').eq('user_id', uid).order('created_at', { ascending: false }).limit(10),
        supabase.from('course_batches_v2').select('*')
      ]);

      const enrollments = enrollRes.data || [];
      const orders = orderRes.data || [];
      const messages = messagesRes.data || [];
      const batches = batchesRes.data || [];

      const notifs: AppNotification[] = [];
      const now = new Date();

      // ==========================================
      // FINANCIAL & BILLING NOTIFICATIONS
      // ==========================================
      orders.forEach((o: any) => {
        const title = o.order_name || o.service || 'Service';
        
        // Success Checkout
        if (now.getTime() - new Date(o.created_at).getTime() < 86400000) {
          notifs.push({ id: `chk-${o.id}`, text: `Successful Checkout: Your order for ${title} was received!`, time: o.created_at, type: 'success', icon: ShoppingBag, actionUrl: '/dashboard?tab=Invoices' });
        }
        
        // Payment Verification Success
        if (o.status === 'verified') {
          notifs.push({ id: `ver-${o.id}`, text: `Your payment for ${title} has been verified. Receipt available.`, time: o.updated_at || o.created_at, type: 'success', icon: CheckCircle, actionUrl: '/dashboard?tab=Invoices' });
        }
        
        // Payment Rejected — most severe: blocks the user's enrollment, needs immediate action
        if (o.status === 'rejected') {
          notifs.push({ id: `rej-${o.id}`, text: `Action Required: Your recent payment screenshot for ${title} was invalid. Please re-upload.`, time: o.updated_at || o.created_at, type: 'urgent', icon: ShieldAlert, actionUrl: '/dashboard?tab=Invoices' });
        }

        // Pending Balance — needs attention but not blocking
        if (o.remaining_amount > 0) {
          notifs.push({ id: `bal-${o.id}`, text: `You have an outstanding balance of Rs. ${o.remaining_amount} for ${title}.`, time: o.created_at, type: 'warning', icon: AlertCircle, actionUrl: '/dashboard?tab=Invoices' });
        }
      });

      // ==========================================
      // SUPPORT & COMMUNICATION
      // ==========================================
      const latestAdminMsg = messages.find((m: any) => m.sender_role === 'admin');
      if (latestAdminMsg) {
        notifs.push({ id: `msg-${latestAdminMsg.id}`, text: `GyanHub Support: "${latestAdminMsg.content}"`, time: latestAdminMsg.created_at, type: 'info', icon: MessageCircle, actionUrl: '/dashboard' });
      }

      // ==========================================
      // ACCOUNT & SECURITY
      // ==========================================
      if (!currentUser.user_metadata?.avatar_url) {
        notifs.push({ id: 'prof-nudge', text: `Complete your profile! Add a profile picture to personalize your account.`, time: now.toISOString(), type: 'info', icon: Settings, actionUrl: '/dashboard' });
      }

      // ==========================================
      // GLOBAL HUB ACTIVITY
      // ==========================================
      // Upcoming Live Session Check — time-critical, urgent
      enrollments.forEach((e: any) => {
        const batch = batches.find((b: any) => b.syllabus_id === e.course_id || b.id === e.batch_id);
        if (batch && batch.start_datetime) {
          const start = new Date(batch.start_datetime);
          const diffMs = start.getTime() - now.getTime();
          if (diffMs > 0 && diffMs <= 86400000) { // Within 24 hours
             const isImminent = diffMs <= 3600000; // Within 1 hour
             notifs.push({ id: `live-${batch.id}`, text: `Reminder: ${e.course_name} starts in ${isImminent ? 'less than 1 hour' : 'less than 24 hours'}. Get your meeting link.`, time: now.toISOString(), type: 'urgent', icon: Video, actionUrl: '/dashboard?tab=Online Courses' });
          }
        }
        
        // Syllabus Resource Update (Simulated based on course structure)
        if (e.status === 'active') {
          notifs.push({ id: `syl-upd-${e.id}`, text: `New study materials have been added to your ${e.course_name} course.`, time: now.toISOString(), type: 'info', icon: BookOpen, actionUrl: '/dashboard?tab=Online Courses' });
        }
      });

      // Sort (Latest First), deduplicate and set
      const uniqueNotifs = Array.from(new Map(notifs.map(item => [item.id, item])).values());
      uniqueNotifs.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

      setNotifications(uniqueNotifs);
      if (uniqueNotifs.length > 0) setHasUnread(true);
      
    } catch (err) {
      console.error("Error fetching notifications:", err);
    }
  }, [supabase]);

  useEffect(() => {
    let mounted = true;

    const fetchSessionStatus = async () => {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError && (authError.message.includes("Lock broken") || authError.message.includes("steal"))) {
          return;
        }
        
        if (!user) {
          if (mounted) {
            setUser(null);
            setLoadingUser(false);
          }
          return;
        }

        if (mounted) setUser(user);
        fetchUserActivity(user);

      } catch (err: any) {
        if (err?.name === 'AbortError' || err?.message?.includes("Lock broken") || err?.message?.includes("steal")) {
          return; 
        }
        console.error("Unexpected error:", err);
      } finally {
        if (mounted) setLoadingUser(false);
      }
    };

    fetchSessionStatus();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (mounted) {
        if (event === 'INITIAL_SESSION') return; 

        if (session?.user) {
          fetchSessionStatus();
        } else {
          setUser(null);
          setLoadingUser(false);
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase, fetchUserActivity]);

  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase.channel('navbar_realtime_updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders_v2' }, () => fetchUserActivity(user))
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () => fetchUserActivity(user))
      .subscribe();
      
    return () => { supabase.removeChannel(channel); };
  }, [user, fetchUserActivity, supabase]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifDropdownRef.current && !notifDropdownRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Subtle elevation once the page has scrolled past the hero — keeps the
  // floating pill from feeling like it's hovering over nothing.
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 8);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Reset the broken-image fallback whenever the signed-in user changes.
  useEffect(() => {
    setAvatarError(false);
  }, [user?.user_metadata?.avatar_url]);

  // Lock background scroll while an overlay (search palette or mobile drawer) is open.
  useEffect(() => {
    if (isSearchOpen || mobileOpen) {
      const original = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = original;
      };
    }
  }, [isSearchOpen, mobileOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setIsSearchOpen(false);
        setMobileOpen(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

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

  const isPhysicalClassActive = pathname.startsWith("/offline-class");

  return (
    <>
      {/* Progress Bar (Kept fixed so it remains visible at the top edge of the screen) */}
      <motion.div 
        className="fixed top-0 left-0 right-0 h-[3px] bg-blue-600 origin-left z-[70]" 
        style={{ scaleX }} 
      />

      <div className="relative w-full z-50 flex justify-center pt-2 md:pt-4 px-3 md:px-8">
        
        {/* Softened Gradient Border Wrapper */}
        <header 
          className={`w-full transition-all duration-300 ease-in-out rounded-full p-[1px] bg-gradient-to-r from-blue-600/20 via-transparent to-orange-500/15 max-w-[90rem] ${
            isScrolled ? "shadow-[0_8px_30px_rgba(15,23,42,0.08)]" : ""
          }`}
        >
          <div className="w-full h-full flex items-center justify-between gap-2 xl:gap-6 bg-white/95 backdrop-blur-xl rounded-full py-2 md:py-3.5 px-4 md:px-8">
            
            {/* Logo */}
            <Link href="/" className="flex-shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-blue-600 z-20 rounded-lg">
              <motion.div 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="relative transition-all duration-300 w-[135px] h-[40px] lg:w-[160px] lg:h-[46px]"
              >
                <Image src="https://zuktarghyexwodqnnxlu.supabase.co/storage/v1/object/public/others/GyanHub_logo_website-removebg-preview__1_-removebg-preview.webp" alt="GyanHub Logo" fill className="object-contain" priority />
              </motion.div>
            </Link>

            {/* Desktop Nav Items */}
            <nav className="hidden lg:flex items-center justify-center gap-2 lg:gap-3 ml-2">
              
              <motion.div whileHover={{ y: -1 }} whileTap={{ scale: 0.97 }} className="relative flex flex-col justify-center">
                <Link 
                  href="/" 
                  aria-current={isActive("/") ? "page" : undefined}
                  className={`relative flex items-center px-3 py-2 rounded-lg text-[14px] font-medium outline-none focus-visible:ring-2 focus-visible:ring-blue-600/40 whitespace-nowrap transition-colors duration-200 ${isActive("/") ? "text-blue-600" : "text-slate-500 hover:text-slate-800"}`}
                >
                  Home
                </Link>
                {isActive("/") && (
                  <motion.div layoutId="nav-indicator" className="absolute -bottom-1 left-3 right-3 h-[2px] bg-blue-600 rounded-full" />
                )}
              </motion.div>

              {/* Physical Class — emerald identity, matches homepage's "physical / location" token */}
              <motion.div whileHover={{ y: -1 }} whileTap={{ scale: 0.97 }} className="relative flex items-center">
                <Link
                  href="/offline-class"
                  aria-current={isPhysicalClassActive ? "page" : undefined}
                  className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-[14px] font-semibold whitespace-nowrap transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/40 ${
                    isPhysicalClassActive
                      ? "bg-emerald-600 text-white shadow-[0_4px_12px_rgba(16,185,129,0.3)]"
                      : "bg-emerald-600/10 text-emerald-600 hover:bg-emerald-600/15"
                  }`}
                >
                  <BookMarked className="h-[15px] w-[15px]" strokeWidth={2} />
                  Physical Class
                </Link>
              </motion.div>

              {/* Online Course Button — blue identity (its correct category color); orange stays reserved for the HOT badge only */}
              <motion.div whileHover={{ y: -1 }} whileTap={{ scale: 0.97 }} className="relative flex items-center px-1 lg:pl-2">
                <Link href="/onlinecourse" className="relative flex items-center gap-1.5 rounded-full bg-gradient-to-b from-blue-500 to-blue-600 px-4 py-2.5 text-[14px] font-semibold text-white shadow-[0_4px_12px_rgba(37,99,235,0.25)] hover:shadow-[0_6px_16px_rgba(37,99,235,0.35)] transition-all duration-200 mt-1">
                  <MonitorPlay className="h-[16px] w-[16px]" strokeWidth={2} />
                  Online Class
                  <span className="absolute -top-3.5 -right-3 flex items-center justify-center rounded-full bg-white px-2 py-[2px] text-[9px] font-bold tracking-wide text-orange-500 shadow-sm border border-orange-500/20 z-10 animate-pulse">
                    <Sparkles className="w-[10px] h-[10px] mr-[2px]" strokeWidth={2.5} /> HOT
                  </span>
                </Link>
              </motion.div>

              {/* Recordings Button */}
              <motion.div whileHover={{ y: -1 }} whileTap={{ scale: 0.97 }} className="relative flex flex-col justify-center px-1 lg:ml-2">
                <Link href="/recording" className="relative flex items-center gap-1.5 rounded-full bg-blue-600/10 hover:bg-blue-600/15 px-4 py-2 text-[13px] font-medium text-blue-600 transition-all duration-200 mt-1">
                  <Video className="h-[15px] w-[15px]" strokeWidth={2} />
                  Recordings
                </Link>
              </motion.div>

              {/* Certificate */}
              <motion.div whileHover={{ y: -1 }} whileTap={{ scale: 0.97 }} className="relative flex flex-col justify-center">
                <Link 
                  href="/certificate" 
                  aria-current={isActive("/certificate") ? "page" : undefined}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-[14px] font-medium outline-none focus-visible:ring-2 focus-visible:ring-blue-600/40 whitespace-nowrap transition-colors duration-200 ${isActive("/certificate") ? "text-blue-600" : "text-slate-500 hover:text-slate-800"}`}
                >
                  <GraduationCap className="h-[16px] w-[16px] text-slate-400" strokeWidth={2} />
                  Certificate
                </Link>
                {isActive("/certificate") && (
                  <motion.div layoutId="nav-indicator" className="absolute -bottom-1 left-3 right-3 h-[2px] bg-blue-600 rounded-full" />
                )}
              </motion.div>

            </nav>

            {/* Desktop Actions */}
            <div className="hidden lg:flex flex-shrink-0 items-center gap-4 xl:gap-5 z-20">
              
              {/* Command Palette Search */}
              <button 
                onClick={() => setIsSearchOpen(true)}
                aria-label="Open search (Cmd+K)"
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-slate-500 hover:text-slate-800 bg-slate-50 border border-slate-200/50 hover:bg-slate-100/80 transition-all text-[13px] font-medium outline-none focus-visible:ring-2 focus-visible:ring-blue-600/40"
              >
                <Search className="h-4 w-4 text-slate-400" /> 
                <span className="hidden xl:inline">Search</span>
                <kbd className="hidden xl:flex items-center text-[10px] bg-slate-200/50 text-slate-500 px-1.5 py-0.5 rounded font-sans font-medium border border-slate-300/30">
                  ⌘K
                </kbd>
              </button>

              {/* Profile Area */}
              <div className="relative pl-5 flex items-center border-l border-slate-200/50">
                
                {/* Notifications */}
                {!loadingUser && user && (
                  <div className="relative" ref={notifDropdownRef}>
                    <button 
                      onClick={() => { setShowNotifications(!showNotifications); setHasUnread(false); }} 
                      aria-label="Notifications"
                      aria-expanded={showNotifications}
                      aria-haspopup="true"
                      className="relative mr-3 p-2 text-slate-400 hover:text-slate-700 transition-colors rounded-full hover:bg-slate-100 outline-none focus-visible:ring-2 focus-visible:ring-blue-600/40"
                    >
                      <Bell className="h-5 w-5" strokeWidth={1.5} />
                      {hasUnread && <span className="absolute top-2 right-2.5 h-2 w-2 bg-red-500 rounded-full border border-white animate-pulse" />}
                    </button>

                    <AnimatePresence>
                      {showNotifications && (
                        <motion.div 
                          initial={{ opacity: 0, y: 8, scale: 0.98 }} 
                          animate={{ opacity: 1, y: 0, scale: 1 }} 
                          exit={{ opacity: 0, y: 8, scale: 0.98 }} 
                          transition={{ duration: 0.15 }}
                          className="absolute right-0 top-[calc(100%+12px)] w-80 sm:w-[400px] rounded-[24px] border border-slate-100 bg-white shadow-[0_12px_40px_rgba(0,0,0,0.08)] z-50 origin-top-right overflow-hidden flex flex-col max-h-[75vh]"
                        >
                          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center shrink-0">
                            <div>
                              <h4 className="font-semibold text-slate-800 text-sm">Activity & Updates</h4>
                              <p className="text-[10px] uppercase tracking-wider text-slate-400 font-medium mt-0.5">Your Recent Timeline</p>
                            </div>
                            <button onClick={() => setShowNotifications(false)} aria-label="Close notifications" className="p-1.5 bg-white rounded-full text-slate-400 hover:text-slate-600 shadow-sm border border-slate-200"><X size={14} /></button>
                          </div>
                          
                          <div className="overflow-y-auto p-2 custom-scrollbar flex flex-col gap-1.5 flex-grow">
                            {notifications.length === 0 ? (
                              <div className="p-8 text-center text-slate-500 flex flex-col items-center gap-2">
                                <Bell className="w-8 h-8 opacity-20 text-slate-400 mb-2" />
                                <span className="text-sm font-medium text-slate-400">All caught up! 🎉</span>
                              </div>
                            ) : (
                              notifications.map((n) => {
                                const isUrgent = n.type === 'urgent';
                                const isWarning = n.type === 'warning';
                                const isSuccess = n.type === 'success';
                                
                                // Severity mapping: urgent = red (most severe, blocking),
                                // warning = orange/amber (needs attention, not blocking),
                                // success = emerald, info = blue.
                                const bgClass = isUrgent ? 'bg-red-50/40 border-red-100/50' : isWarning ? 'bg-orange-50/40 border-orange-100/50' : isSuccess ? 'bg-emerald-50/40 border-emerald-100/50' : 'bg-white border-transparent hover:bg-slate-50';
                                const textClass = 'text-slate-700'; 
                                const iconColor = isUrgent ? 'text-red-500' : isWarning ? 'text-orange-500' : isSuccess ? 'text-emerald-500' : 'text-blue-600';
                                const IconComp = n.icon || Bell;

                                return (
                                  <div 
                                    key={n.id} 
                                    onClick={() => {
                                      setShowNotifications(false);
                                      if (n.actionUrl) router.push(n.actionUrl);
                                    }}
                                    className={`p-3.5 rounded-[16px] border flex gap-3 items-start transition-all cursor-pointer ${bgClass}`}
                                  >
                                    <div className={`p-2 rounded-full shrink-0 bg-white shadow-sm border border-slate-100/50 ${iconColor}`}>
                                      <IconComp size={16} strokeWidth={2} />
                                    </div>
                                    <div className="flex-1 mt-0.5">
                                      <p className={`text-[13px] font-medium leading-snug ${textClass}`}>{n.text}</p>
                                      <p className="text-[10px] text-slate-400 font-semibold mt-1.5 uppercase tracking-wider">
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
                  <div className="h-9 w-[110px] animate-pulse rounded-full bg-slate-100" />
                ) : !user ? (
                  <button onClick={handleLogin} className="rounded-xl px-5 py-2 text-[13px] font-semibold text-white bg-slate-900 hover:bg-slate-800 transition-colors whitespace-nowrap shadow-sm">
                    Log In
                  </button>
                ) : (
                  <Link 
                    href="/dashboard"
                    className="group flex items-center gap-2.5 p-1 pr-4 rounded-full bg-white/60 backdrop-blur-sm border border-slate-200/50 hover:bg-white hover:shadow-sm hover:border-slate-300 transition-all duration-300"
                  >
                    <div className="relative h-8 w-8 shrink-0">
                      <div className="relative h-full w-full rounded-full overflow-hidden shadow-sm bg-slate-100 border border-slate-100 group-hover:border-white transition-colors">
                        <Image 
                          src={avatarError ? "/images/default-avatar.png" : (user?.user_metadata?.avatar_url || "/images/default-avatar.png")} 
                          alt="Profile" 
                          fill 
                          sizes="32px" 
                          className="object-cover" 
                          onError={() => setAvatarError(true)}
                        />
                      </div>
                      <span className="absolute bottom-0 right-0 h-2.5 w-2.5 bg-green-500 rounded-full ring-[2px] ring-white z-10" />
                    </div>
                    <span className="text-[13px] font-medium text-slate-700 group-hover:text-slate-900 transition-colors leading-none">
                      Dashboard
                    </span>
                  </Link>
                )}
              </div>
            </div>

            {/* Mobile Top Bar Actions */}
            <div className="flex items-center gap-4 ml-auto lg:hidden z-20">
              <button onClick={() => setIsSearchOpen(true)} aria-label="Open search" className="p-1.5 text-slate-500 hover:text-slate-800 transition-colors">
                <Search className="h-5 w-5" strokeWidth={2} />
              </button>

              {loadingUser ? (
                <div className="h-8 w-8 rounded-full bg-slate-100 animate-pulse" />
              ) : !user ? (
                <button onClick={handleLogin} className="text-[13px] font-semibold text-slate-800 transition-colors whitespace-nowrap">
                  Log In
                </button>
              ) : (
                <button className="relative h-8 w-8 shrink-0 cursor-pointer group" onClick={() => setMobileOpen(true)} aria-label="Open menu">
                  <div className="relative h-full w-full rounded-full overflow-hidden border border-slate-200 shadow-sm transition-all">
                    <Image
                    src={avatarError ? "/images/default-avatar.png" : (user?.user_metadata?.avatar_url || "/images/default-avatar.png")}
                    alt="Profile"
                    fill
                    sizes="32px"
                    className="object-cover"
                    onError={() => setAvatarError(true)}
                  />
                  </div>
                  <span className="absolute bottom-0 right-0 h-2.5 w-2.5 bg-green-500 rounded-full ring-[2px] ring-white z-10" />
                </button>
              )}
              
              <button 
                onClick={() => setMobileOpen(true)} 
                aria-label="Open menu"
                className="p-1 text-slate-700 hover:text-slate-900 transition-colors"
              >
                <Menu className="h-6 w-6" strokeWidth={1.5} />
              </button>
            </div>

          </div>
        </header>
      </div>

      {/* --- SEARCH MODAL (COMMAND PALETTE) --- */}
      <AnimatePresence>
        {isSearchOpen && (
          <div className="fixed inset-0 z-[110] flex items-start justify-center pt-[12vh] px-4 sm:px-6" role="dialog" aria-modal="true" aria-label="Search">
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
              className="relative w-full max-w-xl bg-white rounded-2xl shadow-[0_16px_40px_rgba(0,0,0,0.1)] overflow-hidden border border-slate-100 flex flex-col"
            >
              <div className="flex items-center px-4 py-3.5 border-b border-slate-100">
                <Search className="h-5 w-5 text-slate-400" strokeWidth={2} />
                <input 
                  ref={searchInputRef}
                  type="text"
                  placeholder="Where do you want to go?" 
                  className="flex-1 ml-3 bg-transparent text-slate-800 text-sm outline-none placeholder:text-slate-400 font-medium"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button 
                  onClick={() => setIsSearchOpen(false)} 
                  aria-label="Close search"
                  className="p-1.5 bg-slate-50 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors flex items-center gap-1.5"
                >
                  <span className="text-[10px] font-semibold">ESC</span>
                  <X className="h-4 w-4" strokeWidth={2} />
                </button>
              </div>

              <div className="max-h-[50vh] overflow-y-auto p-2 flex flex-col gap-0.5">
                {filteredSearchData.length > 0 ? (
                  filteredSearchData.map((item, idx) => (
                    <button 
                      key={idx}
                      onClick={() => executeSearchAction(item.href)}
                      className="flex items-center justify-between w-full px-3 py-2.5 rounded-xl hover:bg-slate-50 group transition-colors outline-none focus-visible:bg-slate-50"
                    >
                      <div className="flex items-center gap-3">
                        <item.icon className="h-4 w-4 text-slate-400 group-hover:text-blue-600 transition-colors" strokeWidth={1.5} />
                        <span className="text-slate-600 text-sm font-medium group-hover:text-slate-900 transition-colors">{item.label}</span>
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  ))
                ) : (
                  <div className="px-6 py-10 text-center flex flex-col items-center">
                    <Search className="h-8 w-8 text-slate-200 mb-3" />
                    <p className="text-slate-500 text-sm font-medium">No pages found matching "<span className="text-slate-800">{searchQuery}</span>"</p>
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
          <div className="fixed inset-0 z-[100] flex flex-col justify-end" role="dialog" aria-modal="true" aria-label="Menu">
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
              onDragEnd={(_, info) => {
                if (info.offset.y > 100) setMobileOpen(false); 
              }}
              className="relative w-full bg-white rounded-t-3xl px-4 pb-6 pt-2 shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto"
            >
              <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-4" />

              <div className="flex justify-between items-center mb-5 px-1">
                <Image src="https://zuktarghyexwodqnnxlu.supabase.co/storage/v1/object/public/others/GyanHub_logo_website-removebg-preview__1_-removebg-preview.webp" alt="Logo" width={110} height={35} />
                <button onClick={() => setMobileOpen(false)} aria-label="Close menu" className="p-2 bg-slate-50 rounded-full text-slate-500 hover:bg-slate-100">
                  <X className="h-5 w-5" strokeWidth={1.5} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto pb-4 space-y-5 px-1">
                
                {/* Explore Navigation */}
                <div>
                  <h4 className="px-2 mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Navigation</h4>
                  <div className="flex flex-col gap-1">
                    
                    <button onClick={() => { setMobileOpen(false); router.push("/"); }} className={`flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${isActive("/") ? "bg-slate-50 text-blue-600" : "text-slate-600 hover:bg-slate-50"}`}>
                      <House className="h-4 w-4" strokeWidth={2} /> Home
                    </button>

                    <button
                      onClick={() => { setMobileOpen(false); router.push("/offline-class"); }}
                      aria-current={isPhysicalClassActive ? "page" : undefined}
                      className={`flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                        isPhysicalClassActive ? "bg-emerald-600 text-white" : "bg-emerald-600/10 text-emerald-600 hover:bg-emerald-600/15"
                      }`}
                    >
                      <BookMarked className="h-4 w-4" strokeWidth={2} /> Physical Class
                    </button>

                    {/* Dominant Primary Mobile Action */}
                    <button onClick={() => { setMobileOpen(false); router.push("/onlinecourse"); }} className={`relative flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${isActive("/onlinecourse") ? "bg-blue-500/5 text-blue-600" : "text-slate-600 hover:bg-slate-50"}`}>
                      <MonitorPlay className="h-4 w-4" strokeWidth={2} /> Online Class
                      <span className="absolute top-2 right-2 flex items-center justify-center rounded-full bg-white px-2 py-[2px] text-[8px] font-bold tracking-wide text-orange-500 shadow-sm border border-orange-500/20 animate-pulse">
                        <Sparkles className="w-2.5 h-2.5 mr-[2px]" strokeWidth={2.5} /> HOT
                      </span>
                    </button>

                    {/* Secondary Action - Softened from gradient */}
                    <button onClick={() => { setMobileOpen(false); router.push("/recording"); }} className={`flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${isActive("/recording") ? "bg-slate-50 text-blue-600" : "text-slate-600 hover:bg-slate-50"}`}>
                      <Video className="h-4 w-4" strokeWidth={2} /> Recordings
                    </button>

                    <button onClick={() => { setMobileOpen(false); router.push("/certificate"); }} className={`flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${isActive("/certificate") ? "bg-slate-50 text-blue-600" : "text-slate-600 hover:bg-slate-50"}`}>
                      <GraduationCap className="h-4 w-4" strokeWidth={2} /> Certificate
                    </button>

                  </div>
                </div>

                {/* Single Dashboard Focus */}
                {!loadingUser && user && (
                  <div>
                    <h4 className="px-2 mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Account</h4>
                    <button 
                      onClick={() => { setMobileOpen(false); router.push('/dashboard'); }} 
                      className="w-full bg-slate-50 text-slate-700 py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2 border border-slate-100 hover:bg-slate-100 transition-colors"
                    >
                      <LayoutDashboard className="h-4 w-4 text-slate-500" strokeWidth={2} /> 
                      Go to Dashboard
                    </button>
                  </div>
                )}

                {/* Actions & Auth */}
                <div>
                  <h4 className="px-2 mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Actions</h4>
                  <div className="flex flex-col gap-2">
                    
                    <button onClick={() => { setMobileOpen(false); router.push('/onlinecourse'); }} className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-blue-500 to-blue-600 shadow-[0_4px_12px_rgba(37,99,235,0.25)] text-white py-3 text-sm font-semibold mt-1">
                      <MonitorPlay className="h-4 w-4" strokeWidth={2} /> Explore Online Classes
                    </button>

                    {!loadingUser && !user && (
                      <button onClick={handleLogin} className="w-full mt-1 flex items-center justify-center rounded-xl bg-slate-900 text-white py-3 text-sm font-semibold shadow-sm">
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