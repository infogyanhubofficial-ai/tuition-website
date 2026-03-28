'use client';

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState, useMemo, useRef } from "react";
import { usePathname, useRouter } from "next/navigation"; 
import { createClient } from "@/lib/supabase/client"; 
import { motion, AnimatePresence, useScroll, useSpring } from "framer-motion";
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
  }, [supabase]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogin = () => {
    setMobileOpen(false); 
    router.push(`/login?next=${pathname}`); 
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setProfileDropdownOpen(false);
    setMobileOpen(false);
    router.refresh(); 
  };

  const isActive = useMemo(() => {
    return (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
  }, [pathname]);

  const mobileMenuVars = {
    initial: { opacity: 0, y: "-100%" },
    animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const } },
    exit: { opacity: 0, y: "-100%", transition: { duration: 0.3, ease: "easeIn" as const } }
  };

  const mobileLinkContainerVars = {
    initial: { transition: { staggerChildren: 0.05, staggerDirection: -1 } },
    animate: { transition: { delayChildren: 0.15, staggerChildren: 0.07, staggerDirection: 1 } }
  };

  const mobileLinkVars = {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" as const } },
    exit: { opacity: 0, y: -10, transition: { duration: 0.2 } }
  };

  return (
    <>
      {/* BULLETPROOF FIX: This outer div claims physical space in the document flow, preventing overlap. */}
      {/* The height is carefully calculated to match the non-scrolled navbar height (Padding + Content). */}
      <div className="h-[76px] lg:h-[94px] w-full flex-shrink-0" aria-hidden="true" />

      {/* Progress Bar */}
      <motion.div 
        className="fixed top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#2D9CDB] to-[#FF6B35] origin-left z-[70]" 
        style={{ scaleX }} 
      />

      <div className={`fixed top-0 left-0 right-0 z-50 flex justify-center transition-all duration-500 ${scrolled ? 'pt-1 md:pt-1 px-3 md:px-6' : 'pt-2 md:pt-4 px-3 md:px-8'}`}>
        <header 
          className={`w-full transition-all duration-500 ease-in-out bg-white/95 backdrop-blur-xl border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.06)] rounded-full ${
            scrolled ? "max-w-[72rem] py-1.5 md:py-2 px-3 md:px-5" : "max-w-[90rem] py-2 md:py-3.5 px-4 md:px-8"
          }`}
        >
          <div className="flex items-center justify-between w-full h-full gap-2 xl:gap-4">
            
            <Link href="/" className="flex-shrink-0 outline-none rounded-lg focus-visible:ring-2 focus-visible:ring-[#2D9CDB] z-20">
              <motion.div 
                animate={{ scale: scrolled ? 0.95 : 1 }}
                className={`relative transition-all duration-500 ${
                  scrolled ? 'w-[110px] h-[32px] lg:w-[140px] lg:h-[42px]' : 'w-[120px] h-[36px] lg:w-[170px] lg:h-[50px]'
                }`}
              >
                <Image src="https://zuktarghyexwodqnnxlu.supabase.co/storage/v1/object/public/others/GyanHub_logo_website-removebg-preview.png" alt="GyanHub Logo" fill className="object-contain" priority />
              </motion.div>
            </Link>

            {/* Desktop Nav Items */}
            <nav className="hidden lg:flex items-center justify-center gap-1 xl:gap-4">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link 
                    key={item.href} 
                    href={item.href} 
                    className={`relative group flex items-center gap-1.5 px-3 py-2 rounded-full text-[13px] xl:text-[14px] font-bold transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#2D9CDB] whitespace-nowrap ${
                      active ? "text-[#2D9CDB]" : "text-slate-700 hover:text-slate-900"
                    }`}
                  >
                    {active && (
                      <motion.span 
                        layoutId="magic-indicator" 
                        className="absolute inset-0 bg-[#2D9CDB]/10 rounded-full -z-10" 
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      />
                    )}
                    <Icon className="h-[15px] w-[15px] xl:h-[17px] xl:w-[17px] transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:scale-110" strokeWidth={2.5} />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {/* Desktop Actions */}
            <div className="hidden lg:flex flex-shrink-0 items-center gap-1.5 xl:gap-3 z-20">
              {!loadingUser && !isTutor && (
                <>
                  <Link href="/post-tuition" className="group flex items-center gap-1 px-1.5 py-2 text-[12px] xl:text-[13px] font-bold text-slate-500 hover:text-[#2D9CDB] transition-colors whitespace-nowrap">
                    Post Tuition
                  </Link>
                  <Link href="/become-a-tutor" className="flex items-center gap-1.5 rounded-full border border-slate-300 px-3 xl:px-4 py-2 text-[12px] xl:text-[13px] font-bold text-slate-700 hover:border-[#2D9CDB] hover:text-[#2D9CDB] hover:bg-[#2D9CDB]/5 transition-all duration-200 active:scale-95 whitespace-nowrap">
                    Become Tutor
                  </Link>
                </>
              )}
              <Link href="/online-courses" className="flex items-center gap-1.5 rounded-full bg-[#FF6B35] px-4 xl:px-5 py-2 text-[12px] xl:text-[13px] font-bold text-white shadow-md hover:shadow-lg hover:bg-[#f45d24] hover:-translate-y-[1px] transition-all duration-200 active:scale-95 whitespace-nowrap">
                <MonitorPlay className="h-[15px] w-[15px]" strokeWidth={2.5} />
                Online Class
              </Link>
              <div className="relative pl-1.5 xl:pl-2 flex items-center border-l border-slate-200 ml-1" ref={dropdownRef}>
                {loadingUser ? (
                  <div className="h-9 w-9 animate-pulse rounded-full bg-slate-200" />
                ) : !user ? (
                  <button onClick={handleLogin} className="rounded-full bg-slate-50 border border-slate-200 px-4 xl:px-5 py-2 text-[12px] xl:text-[13px] font-bold text-slate-700 hover:bg-slate-100 hover:text-slate-900 shadow-sm transition-all whitespace-nowrap active:scale-95">
                    Login
                  </button>
                ) : (
                  <>
                    <button onClick={() => setProfileDropdownOpen(!profileDropdownOpen)} className="group flex items-center gap-2 outline-none rounded-full focus-visible:ring-2 focus-visible:ring-[#2D9CDB] bg-white hover:bg-slate-50 border border-slate-100 pr-3 transition-all duration-200 shadow-sm whitespace-nowrap">
                      <div className="relative h-9 w-9 xl:h-10 xl:w-10 overflow-hidden rounded-full border border-slate-200 group-hover:border-[#2D9CDB] transition-colors duration-200">
                        <Image src={user?.user_metadata?.avatar_url || "/images/default-avatar.png"} alt="Profile" fill sizes="40px" className="object-cover" />
                      </div>
                      <span className="hidden xl:block text-[13px] xl:text-[14px] font-bold text-slate-700">
                        Hi, {user?.user_metadata?.full_name?.split(' ')[0] || 'User'}
                      </span>
                      <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${profileDropdownOpen ? 'rotate-180' : ''}`} strokeWidth={2.5} />
                    </button>
                    <AnimatePresence>
                      {profileDropdownOpen && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          transition={{ duration: 0.15 }}
                          className="absolute right-0 top-[calc(100%+12px)] w-60 rounded-3xl border border-slate-100 bg-white/95 backdrop-blur-xl p-2 shadow-[0_15px_40px_rgba(0,0,0,0.1)] z-50"
                        >
                          <div className="px-4 py-3 mb-2 border-b border-slate-100">
                            <p className="text-[14px] font-black text-slate-900 truncate">{user?.user_metadata?.full_name || 'User'}</p>
                            <p className="text-[12px] font-medium text-slate-500 truncate">{user?.email}</p>
                          </div>
                          <Link href="/profile" onClick={() => setProfileDropdownOpen(false)} className="group flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-[14px] font-bold text-slate-600 hover:bg-[#2D9CDB]/10 hover:text-[#2D9CDB] transition-all">
                            <Settings className="h-4 w-4 group-hover:rotate-90 transition-transform" strokeWidth={2.5} /> Dashboard
                          </Link>
                          <Link href="/my-courses" onClick={() => setProfileDropdownOpen(false)} className="group flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-[14px] font-bold text-slate-600 hover:bg-orange-50 hover:text-[#FF6B35] transition-all">
                            <BookOpen className="h-4 w-4 group-hover:-translate-y-1 transition-transform" strokeWidth={2.5} /> My Courses
                          </Link>
                          <div className="my-1 border-t border-slate-100" />
                          <button onClick={handleLogout} className="group flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-[14px] font-bold text-red-600 hover:bg-red-50 transition-all">
                            <LogOut className="h-4 w-4 group-hover:-translate-x-1 transition-transform" strokeWidth={2.5} /> Log Out
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </>
                )}
              </div>
            </div>

            {/* Mobile Top Bar Actions */}
            <div className="flex items-center gap-2 ml-auto lg:hidden z-20">
              {loadingUser ? (
                <div className="h-8 w-8 rounded-full bg-slate-200 animate-pulse" />
              ) : !user ? (
                <button onClick={handleLogin} className="text-[11px] font-black text-slate-700 px-3 py-2 bg-slate-100 border border-slate-200 rounded-full hover:bg-slate-200 transition-colors whitespace-nowrap">
                  LOGIN
                </button>
              ) : (
                <div className="relative h-8 w-8 rounded-full overflow-hidden border border-slate-200 shadow-sm cursor-pointer" onClick={() => setMobileOpen(true)}>
                  <Image src={user?.user_metadata?.avatar_url || "/images/default-avatar.png"} alt="Profile" fill sizes="32px" className="object-cover" />
                </div>
              )}
              <button 
                onClick={() => setMobileOpen(true)} 
                aria-label="Open Mobile Menu"
                className="p-1.5 rounded-full text-slate-700 bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-colors flex items-center justify-center"
              >
                <Menu className="h-5 w-5" strokeWidth={2.5} />
              </button>
            </div>

          </div>
        </header>
      </div>

      {/* Mobile Menu Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-[100] flex flex-col">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
              onClick={() => setMobileOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            
            <motion.div 
              variants={mobileMenuVars}
              initial="initial" animate="animate" exit="exit"
              className="relative w-full bg-white bg-gradient-to-b from-blue-50/50 to-white rounded-b-[2.5rem] p-5 sm:p-8 shadow-2xl flex flex-col max-h-[95vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-6">
                <Image src="https://zuktarghyexwodqnnxlu.supabase.co/storage/v1/object/public/others/GyanHub_logo_website-removebg-preview.png" alt="Logo" width={110} height={35} />
                <button 
                  onClick={() => setMobileOpen(false)} 
                  className="p-2 bg-slate-100 rounded-full text-slate-700 hover:bg-slate-200 transition-colors flex items-center justify-center"
                >
                  <X className="h-5 w-5" strokeWidth={2.5} />
                </button>
              </div>

              {/* MOBILE OPTIMIZATION: Rebuilt Profile Block to show Dashboard & My Courses clearly */}
              {!loadingUser && user && (
                <div className="bg-gradient-to-br from-[#2D9CDB]/5 to-[#FF6B35]/5 p-5 rounded-3xl mb-6 border border-slate-100 shadow-sm flex flex-col items-center text-center">
                  <div className="relative w-16 h-16 rounded-full overflow-hidden border-4 border-white shadow-md mb-2">
                    <Image src={user?.user_metadata?.avatar_url || "/images/default-avatar.png"} alt="User" fill sizes="64px" className="object-cover" />
                  </div>
                  <h3 className="text-[16px] font-black text-slate-900">{user?.user_metadata?.full_name || 'My Profile'}</h3>
                  <p className="text-[12px] font-medium text-slate-500 mb-4">{user?.email}</p>
                  
                  <div className="flex flex-col w-full gap-2">
                    <Link href="/profile" onClick={() => setMobileOpen(false)} className="w-full bg-white text-[#2D9CDB] py-2.5 rounded-xl font-bold text-[13px] shadow-sm hover:shadow-md transition-all border border-blue-100 flex items-center justify-center gap-2">
                      <Settings className="h-4 w-4" /> Dashboard
                    </Link>
                    <Link href="/my-courses" onClick={() => setMobileOpen(false)} className="w-full bg-orange-50 text-[#FF6B35] py-2.5 rounded-xl font-bold text-[13px] shadow-sm hover:shadow-md transition-all border border-orange-100 flex items-center justify-center gap-2">
                      <BookOpen className="h-4 w-4" /> My Courses
                    </Link>
                  </div>
                </div>
              )}

              <motion.nav variants={mobileLinkContainerVars} className="flex flex-col gap-1 mb-6">
                {navItems.map((item) => {
                  const active = isActive(item.href);
                  return (
                    <motion.div variants={mobileLinkVars} key={item.href}>
                      <Link 
                        href={item.href} 
                        onClick={() => setMobileOpen(false)} 
                        className={`flex items-center gap-3 px-4 py-3.5 min-h-[48px] rounded-2xl text-[15px] font-black transition-all duration-200 border ${
                          active ? "bg-[#2D9CDB]/10 text-[#2D9CDB] border-[#2D9CDB]/20 shadow-sm" : "bg-white text-slate-700 border-transparent hover:bg-slate-50 hover:scale-[1.02]"
                        }`}
                      >
                        <item.icon className={`h-5 w-5 ${active ? "text-[#2D9CDB]" : "text-slate-400"}`} strokeWidth={2.5} />
                        {item.label}
                      </Link>
                    </motion.div>
                  );
                })}
              </motion.nav>

              {/* MOBILE OPTIMIZATION: Rebuilt bottom bar to explicitly show Post Tuition and Become Tutor */}
              <div className="mt-auto sticky bottom-0 bg-white/95 backdrop-blur-md pt-3 pb-2 border-t border-slate-100 flex flex-col gap-2.5">
                {!loadingUser && !user && (
                  <button onClick={handleLogin} className="w-full flex items-center justify-center rounded-xl bg-slate-100 min-h-[50px] text-[14px] font-black text-slate-800 transition-colors hover:bg-slate-200">
                    Log In / Sign Up
                  </button>
                )}

                {!loadingUser && !isTutor && (
                   <>
                     <Link href="/post-tuition" onClick={() => setMobileOpen(false)} className="w-full flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 hover:border-[#2D9CDB] hover:text-[#2D9CDB] min-h-[50px] text-[14px] font-black transition-all active:scale-95 whitespace-nowrap">
                       <PlusCircle className="h-4 w-4" strokeWidth={2.5} /> Post a Tuition
                     </Link>
                     <Link href="/become-a-tutor" onClick={() => setMobileOpen(false)} className="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-[#2D9CDB] text-[#2D9CDB] hover:bg-[#2D9CDB]/5 min-h-[50px] text-[14px] font-black transition-all active:scale-95 whitespace-nowrap">
                       <UserPlus className="h-4 w-4" strokeWidth={2.5} /> Become a Tutor
                     </Link>
                   </>
                )}
                
                <Link href="/online-courses" onClick={() => setMobileOpen(false)} className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#FF6B35] text-white min-h-[50px] text-[14px] font-black shadow-md transition-all active:scale-95 whitespace-nowrap">
                  <MonitorPlay className="h-4 w-4" strokeWidth={2.5} /> Explore Online Classes
                </Link>

                {!loadingUser && user && (
                  <button onClick={handleLogout} className="mt-1 w-full text-center rounded-xl bg-red-50 py-2.5 text-[13px] font-bold text-red-600 transition-colors hover:bg-red-100">
                    Log Out
                  </button>
                )}
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}