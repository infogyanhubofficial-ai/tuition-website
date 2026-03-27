'use client';

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState, useMemo, useRef } from "react";
import { usePathname, useRouter } from "next/navigation"; 
// FIX: Use the new secure SSR-compatible client
import { createClient } from "@/lib/supabase/client"; 
import { motion, AnimatePresence, useScroll, useSpring, easeIn, easeOut } from "framer-motion";
import { 
  Menu, X, House, Users, BriefcaseBusiness, 
  MonitorPlay, GraduationCap, PlusCircle, UserPlus,
  LogOut, Settings, BookOpen, ChevronDown
} from "lucide-react";

const navItems = [
  { href: "/", label: "Home", icon: House },
  { href: "/tutors", label: "Tutors", icon: Users },
  { href: "/vacancies", label: "Vacancies", icon: BriefcaseBusiness },
  { href: "/certificate", label: "Certificates", icon: GraduationCap },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter(); 
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  
  const [user, setUser] = useState<any>(null);
  const [isTutor, setIsTutor] = useState(false);
  const [loadingUser, setLoadingUser] = useState(true);
  
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Initialize the secure client inside the component
  const supabase = createClient();

  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // --- IMPROVED AUTH & TUTOR CHECK LOGIC ---
  useEffect(() => {
    let mounted = true;

    const fetchSessionAndTutorStatus = async () => {
      // FIX: Use getUser() for strict validation against the server cookie
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

      // 2. Query the tutors table directly using the exact uuid
      try {
        const { data, error } = await supabase
          .from('tutors')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) {
          console.error("Supabase Error checking tutor status:", error.message);
        }

        if (mounted) {
          // If data exists, they are a tutor. If null, they are not.
          setIsTutor(!!data);
        }
      } catch (err) {
        console.error("Unexpected error:", err);
      } finally {
        if (mounted) setLoadingUser(false);
      }
    };

    // Initial check on mount
    fetchSessionAndTutorStatus();

    // Listen for logins/logouts globally
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        if (session?.user) {
          // If a new user logs in, re-run the whole check
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
  }, [supabase]); // Added supabase to dependency array

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- UNIFIED LOGIN ROUTING ---
  const handleLogin = () => {
    setMobileOpen(false); 
    router.push(`/login?next=${pathname}`); 
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setProfileDropdownOpen(false);
    // Refresh the router to update server components instantly
    router.refresh(); 
  };

  const isActive = useMemo(() => {
    return (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
  }, [pathname]);

  const mobileMenuVars = {
    initial: { opacity: 0, x: "100%" },
    animate: { 
      opacity: 1, 
      x: 0, 
      transition: { duration: 0.3, ease: easeOut }
    },
    exit: { 
      opacity: 0, 
      x: "100%", 
      transition: { duration: 0.3, ease: easeIn }
    }
  };

  const mobileLinkContainerVars = {
    initial: { transition: { staggerChildren: 0.09, staggerDirection: -1 } },
    animate: { transition: { delayChildren: 0.1, staggerChildren: 0.09, staggerDirection: 1 } }
  };

  const mobileLinkVars = {
    initial: { opacity: 0, y: 20 },
    animate: { 
      opacity: 1, 
      y: 0, 
      transition: { duration: 0.3, ease: easeOut }
    },
    exit: { opacity: 0, y: 20, transition: { duration: 0.2 } }
  };

  return (
    <>
      <motion.div 
        className="fixed top-0 left-0 right-0 h-[2px] bg-[#2D9CDB] origin-left z-[60]" 
        style={{ scaleX }} 
      />

      <header 
        className={`sticky top-0 z-50 w-full transition-all duration-300 ${
          scrolled 
            ? "py-3 bg-white/90 shadow-[0_4px_20px_rgba(0,0,0,0.04)] backdrop-blur-xl" 
            : `py-5 bg-[#f8f9fb]/80 backdrop-blur-md border-b border-transparent`
        }`}
      >
        <div className="mx-auto flex max-w-[90rem] items-center justify-between px-6 lg:px-8">
          
          <Link href="/" className="flex-shrink-0 outline-none rounded-lg focus-visible:ring-2 focus-visible:ring-[#2D9CDB]">
            <div className={`relative transition-all duration-300 ${scrolled ? 'w-[110px] h-[35px]' : 'w-[130px] h-[42px]'}`}>
              <Image 
                src="https://zuktarghyexwodqnnxlu.supabase.co/storage/v1/object/public/others/GyanHub_logo_website-removebg-preview.png" 
                alt="GyanHub Logo" 
                fill
                className="object-contain" 
                priority 
              />
            </div>
          </Link>

          <nav className="hidden items-center gap-1 xl:flex ml-8">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link 
                  key={item.href} 
                  href={item.href} 
                  className={`group relative flex items-center gap-2 px-4 py-2.5 rounded-full text-[14px] font-bold transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-[#2D9CDB] ${
                    active ? "bg-blue-50 text-[#2D9CDB]" : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  <Icon className={`h-[18px] w-[18px] transition-transform duration-200 group-hover:-translate-y-[1px]`} strokeWidth={2.5} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex-1" />

          <div className="hidden items-center gap-4 lg:flex">
            {/* ONLY SHOW IF NOT A TUTOR AND DONE LOADING */}
            {!loadingUser && !isTutor && (
              <>
                <Link 
                  href="/post-tuition" 
                  className="flex items-center gap-1.5 rounded-xl border-2 border-slate-200 px-4 py-2 text-[14px] font-bold text-slate-700 transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50 hover:shadow-sm active:scale-95"
                >
                  <PlusCircle className="h-4 w-4 text-slate-500" strokeWidth={2.5} />
                  Post Tuition
                </Link>

                <Link 
                  href="/become-a-tutor" 
                  className="flex items-center gap-1.5 rounded-xl bg-[#2D9CDB] px-5 py-2 text-[14px] font-bold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#288cc5] hover:shadow-[0_6px_15px_rgba(45,156,219,0.25)] active:scale-95"
                >
                  <UserPlus className="h-4 w-4" strokeWidth={2.5} />
                  Become Tutor
                </Link>
              </>
            )}

            <Link 
              href="/online-courses" 
              className="flex items-center gap-1.5 rounded-xl bg-[#FF6B35] px-5 py-2 text-[14px] font-bold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#f45d24] shadow-[0_4px_12px_rgba(255,107,53,0.2)] hover:shadow-[0_8px_16px_rgba(255,107,53,0.3)] active:scale-95"
            >
              <MonitorPlay className="h-4 w-4" strokeWidth={2.5} />
              Online Class
            </Link>

            <div className="relative ml-2 pl-4 flex items-center border-l border-slate-200" ref={dropdownRef}>
              {loadingUser ? (
                <div className="h-10 w-10 animate-pulse rounded-full bg-slate-200" />
              ) : !user ? (
                <button 
                  onClick={handleLogin} 
                  className="rounded-full bg-slate-100 px-5 py-2 text-sm font-bold text-slate-700 hover:bg-slate-200 hover:text-slate-900 transition-colors"
                >
                  Login
                </button>
              ) : (
                <>
                  <button 
                    onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                    aria-label="User menu"
                    aria-expanded={profileDropdownOpen}
                    className="group flex items-center gap-2 outline-none rounded-full focus-visible:ring-2 focus-visible:ring-[#2D9CDB]"
                  >
                    <div className="relative h-10 w-10 overflow-hidden rounded-full border-2 border-white shadow-sm ring-1 ring-slate-200 transition-transform duration-200 group-hover:scale-105">
                      <Image 
                        src={user?.user_metadata?.avatar_url || "/images/default-avatar.png"} 
                        alt="User Profile" 
                        fill
                        sizes="40px"
                        className="object-cover"
                      />
                    </div>
                    <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${profileDropdownOpen ? 'rotate-180' : ''}`} strokeWidth={2.5} />
                  </button>

                  <AnimatePresence>
                    {profileDropdownOpen && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-[calc(100%+12px)] w-56 rounded-2xl border border-slate-100 bg-white p-2 shadow-[0_10px_40px_rgba(0,0,0,0.08)] z-50"
                      >
                        <div className="px-3 py-2 mb-2 border-b border-slate-100">
                          <p className="text-sm font-bold text-slate-800 truncate">{user?.user_metadata?.full_name || 'User'}</p>
                          <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                        </div>
                        
                        {/* DESKTOP ROUTE FIX HERE */}
                        <Link href="/profile" onClick={() => setProfileDropdownOpen(false)} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors">
                          <Settings className="h-4 w-4" strokeWidth={2.5} /> Dashboard
                        </Link>
                        <Link href="/my-courses" onClick={() => setProfileDropdownOpen(false)} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors">
                          <BookOpen className="h-4 w-4" strokeWidth={2.5} /> My Courses
                        </Link>
                        
                        <div className="my-1 border-t border-slate-100" />
                        
                        <button onClick={handleLogout} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors">
                          <LogOut className="h-4 w-4" strokeWidth={2.5} /> Log Out
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              )}
            </div>
          </div>

          <button 
            onClick={() => setMobileOpen(true)} 
            aria-label="Open Mobile Menu"
            className="lg:hidden p-2 -mr-2 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
          >
            <Menu className="h-7 w-7" strokeWidth={2.5} />
          </button>
        </div>
      </header>

      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-[100] flex">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setMobileOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            
            <motion.div 
              variants={mobileMenuVars}
              initial="initial"
              animate="animate"
              exit="exit"
              role="dialog"
              aria-modal="true"
              aria-label="Mobile Navigation"
              className="absolute right-0 top-0 bottom-0 w-[85%] max-w-sm bg-white p-8 shadow-2xl overflow-y-auto flex flex-col"
            >
              <div className="flex justify-between items-center mb-10">
                <Image src="/images/logo.png" alt="Logo" width={110} height={35} />
                <button 
                  onClick={() => setMobileOpen(false)} 
                  aria-label="Close menu"
                  className="p-2 bg-slate-100 rounded-full text-slate-600 hover:bg-slate-200 transition-colors"
                >
                  <X className="h-5 w-5" strokeWidth={2.5} />
                </button>
              </div>

              <motion.nav 
                variants={mobileLinkContainerVars}
                initial="initial"
                animate="animate"
                exit="initial"
                className="flex flex-col gap-2 mb-8"
              >
                {navItems.map((item) => {
                  const active = isActive(item.href);
                  return (
                    <motion.div variants={mobileLinkVars} key={item.href}>
                      <Link 
                        href={item.href} 
                        onClick={() => setMobileOpen(false)} 
                        className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl text-lg font-bold transition-colors ${
                          active ? "bg-blue-50 text-[#2D9CDB]" : "text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <item.icon className={`h-6 w-6 ${active ? "text-[#2D9CDB]" : "text-slate-400"}`} strokeWidth={2.5} />
                        {item.label}
                      </Link>
                    </motion.div>
                  );
                })}
              </motion.nav>

              <div className="mt-auto flex flex-col gap-4">
                <hr className="border-slate-100 mb-2" />
                
                {loadingUser ? (
                  <div className="h-14 w-full animate-pulse rounded-2xl bg-slate-100" />
                ) : !user ? (
                  <button onClick={handleLogin} className="w-full flex items-center justify-center rounded-2xl bg-slate-100 py-4 text-[15px] font-bold text-slate-800 transition-colors hover:bg-slate-200">
                    Log In / Sign Up
                  </button>
                ) : (
                  <div className="flex flex-col gap-2">
                    {/* MOBILE ROUTE FIX HERE */}
                    <Link href="/profile" onClick={() => setMobileOpen(false)} className="flex w-full items-center gap-4 rounded-2xl bg-slate-50 p-3 hover:bg-slate-100 transition-colors">
                      <div className="relative h-12 w-12 rounded-full overflow-hidden border-2 border-white shadow-sm ring-1 ring-slate-200">
                        <Image src={user?.user_metadata?.avatar_url || "/images/default-avatar.png"} alt="User" fill sizes="48px" className="object-cover" />
                      </div>
                      <div className="text-left flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-900 truncate">{user?.user_metadata?.full_name || 'My Profile'}</p>
                        <p className="text-xs text-slate-500 truncate">Dashboard & Settings</p>
                      </div>
                    </Link>
                    <button onClick={handleLogout} className="w-full text-center rounded-2xl bg-red-50 py-3 text-sm font-bold text-red-600 transition-colors hover:bg-red-100">
                      Log Out
                    </button>
                  </div>
                )}
                
                {/* HIDE MOBILE BUTTONS IF THEY ARE A TUTOR */}
                {!loadingUser && (
                  <div className={`grid ${!isTutor ? 'grid-cols-2' : 'grid-cols-1'} gap-3 mt-2`}>
                    {!isTutor && (
                      <Link href="/become-a-tutor" onClick={() => setMobileOpen(false)} className="flex flex-col items-center justify-center gap-2 rounded-2xl bg-blue-50/50 border border-blue-100 p-4 font-bold text-[#2D9CDB] transition-colors hover:bg-blue-50">
                        <UserPlus className="h-6 w-6" strokeWidth={2.5} />
                        <span className="text-sm">Teach</span>
                      </Link>
                    )}
                    <Link href="/online-courses" onClick={() => setMobileOpen(false)} className="flex flex-col items-center justify-center gap-2 rounded-2xl bg-orange-50/50 border border-orange-100 p-4 font-bold text-[#FF6B35] transition-colors hover:bg-orange-50">
                      <MonitorPlay className="h-6 w-6" strokeWidth={2.5} />
                      <span className="text-sm">Learn</span>
                    </Link>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}