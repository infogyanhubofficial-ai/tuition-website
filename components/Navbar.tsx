'use client';

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState, useMemo, useRef } from "react";
import { usePathname, useRouter } from "next/navigation"; 
import { createClient } from "@/lib/supabase/client"; 
import { motion, AnimatePresence, useScroll, useSpring, Variants } from "framer-motion"; 
import { 
  Menu, X, House, Users, BriefcaseBusiness, 
  MonitorPlay, GraduationCap, PlusCircle, UserPlus,
  LogOut, Settings, BookOpen, ChevronDown, Search, Sparkles, ChevronRight, CheckCircle2,
  Video // Added Video icon for Recordings
} from "lucide-react";

// --- Configuration & Data ---
const navItems = [
  { href: "/", label: "Home", icon: House },
  { href: "/tutors", label: "Tutors", icon: Users },
  { href: "/vacancies", label: "Vacancies", icon: BriefcaseBusiness },
  { href: "/certificate", label: "Certificates", icon: GraduationCap },
  { href: "/recording", label: "Recordings", icon: Video }, // Added Recordings here
];

// Data for the universal Search Palette
const searchData = [
  { label: "Home", href: "/", icon: House },
  { label: "Tutors", href: "/tutors", icon: Users },
  { label: "Vacancies", href: "/vacancies", icon: BriefcaseBusiness },
  { label: "Certificates", href: "/certificate", icon: GraduationCap },
  { label: "Recordings", href: "/recording", icon: Video }, // Added Recordings to Search
  { label: "Dashboard", href: "/profile", icon: Settings },
  { label: "Post Tuition", href: "/post-tuition", icon: PlusCircle },
  { label: "Become a Tutor", href: "/become-a-tutor", icon: UserPlus },
  { label: "Online Class", href: "/onlinecourse", icon: MonitorPlay },
  { label: "My Courses", href: "/my-courses", icon: BookOpen },
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
  const [actionDropdownOpen, setActionDropdownOpen] = useState(false);
  
  // Search Modal State
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Custom Logout Toast State
  const [showLogoutToast, setShowLogoutToast] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const actionDropdownRef = useRef<HTMLDivElement>(null);

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

  // Handle outside clicks for dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
      if (actionDropdownRef.current && !actionDropdownRef.current.contains(event.target as Node)) {
        setActionDropdownOpen(false);
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

  // 🔥 UPDATED LOGOUT LOGIC
  const handleLogout = async () => {
    setProfileDropdownOpen(false);
    setMobileOpen(false);
    
    // Show the thank you toast
    setShowLogoutToast(true);

    // Sign out in the background
    await supabase.auth.signOut();
    
    // Wait 3 seconds for the user to read the message before refreshing the page
    setTimeout(() => {
      setShowLogoutToast(false);
      router.refresh(); 
    }, 3000);
  };

  const isActive = useMemo(() => {
    return (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
  }, [pathname]);

  // Filter search results dynamically
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

  return (
    <>
      <div className="h-[76px] lg:h-[94px] w-full flex-shrink-0" aria-hidden="true" />

      {/* Progress Bar */}
      <motion.div 
        className="fixed top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#2D9CDB] to-[#FF6B35] origin-left z-[70]" 
        style={{ scaleX }} 
      />

      <div className={`fixed top-0 left-0 right-0 z-50 flex justify-center transition-all duration-500 ${scrolled ? 'pt-1 md:pt-2 px-3 md:px-6' : 'pt-2 md:pt-4 px-3 md:px-8'}`}>
        <header 
          className={`w-full transition-all duration-500 ease-in-out backdrop-blur-2xl rounded-full ${
            scrolled 
              ? "max-w-[72rem] py-1.5 md:py-2 px-3 md:px-5 bg-white/85 border border-slate-200/80 shadow-[0_8px_30px_rgba(45,156,219,0.08)]" 
              : "max-w-[90rem] py-2 md:py-3.5 px-4 md:px-8 bg-white/70 border border-slate-200/50 shadow-sm"
          }`}
        >
          <div className="flex items-center justify-between w-full h-full gap-2 xl:gap-4">
            
            <Link href="/" className="flex-shrink-0 outline-none rounded-lg focus-visible:ring-2 focus-visible:ring-[#2D9CDB] z-20">
              <motion.div 
                whileHover={{ scale: 1.05, rotate: -2 }}
                whileTap={{ scale: 0.95 }}
                animate={{ scale: scrolled ? 0.95 : 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
                className={`relative transition-all duration-500 ${
                  scrolled ? 'w-[110px] h-[32px] lg:w-[140px] lg:h-[42px]' : 'w-[120px] h-[36px] lg:w-[170px] lg:h-[50px]'
                }`}
              >
                <Image src="https://zuktarghyexwodqnnxlu.supabase.co/storage/v1/object/public/others/GyanHub_logo_website-removebg-preview__1_-removebg-preview.webp" alt="GyanHub Logo" fill className="object-contain" priority />
              </motion.div>
            </Link>

            {/* Desktop Nav Items */}
            <nav className="hidden lg:flex items-center justify-center gap-2 xl:gap-6">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link 
                    key={item.href} 
                    href={item.href} 
                    className={`relative group flex items-center gap-1.5 py-2 text-[13px] xl:text-[14px] font-bold outline-none whitespace-nowrap transition-colors duration-300 ${
                      active ? "text-[#2D9CDB]" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <Icon className={`h-[15px] w-[15px] xl:h-[17px] xl:w-[17px] transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:scale-110 ${active ? 'fill-[#2D9CDB]/10' : ''}`} strokeWidth={2.5} />
                    {item.label}
                    <span className={`absolute -bottom-1 left-1/2 h-[2px] -translate-x-1/2 rounded-full bg-[#2D9CDB] transition-all duration-300 ease-out ${
                      active ? "w-full" : "w-0 group-hover:w-full opacity-50"
                    }`} />
                  </Link>
                );
              })}
            </nav>

            {/* Desktop Actions */}
            <div className="hidden lg:flex flex-shrink-0 items-center gap-3 xl:gap-4 z-20">
              
              <button 
                onClick={() => setIsSearchOpen(true)}
                className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors text-xs font-bold border border-slate-200 active:scale-95"
              >
                <Search className="h-3.5 w-3.5" /> Search <kbd className="font-sans font-black text-[10px] bg-white px-1.5 rounded border border-slate-200 shadow-sm ml-1">⌘K</kbd>
              </button>

              {/* Grouped Action Buttons */}
              {!loadingUser && !isTutor && (
                <div className="relative" ref={actionDropdownRef}>
                  <button 
                    onClick={() => setActionDropdownOpen(!actionDropdownOpen)}
                    className="group flex items-center gap-1.5 px-3 py-2 text-[13px] font-bold text-slate-600 hover:text-[#2D9CDB] transition-colors"
                  >
                    Get Started <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${actionDropdownOpen ? 'rotate-180 text-[#2D9CDB]' : ''}`} />
                  </button>
                  
                  <AnimatePresence>
                    {actionDropdownOpen && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-[calc(100%+8px)] w-56 rounded-2xl border border-slate-100 bg-white/95 backdrop-blur-xl p-2 shadow-[0_15px_40px_rgba(0,0,0,0.1)] z-50 origin-top-right"
                      >
                        <Link href="/post-tuition" onClick={() => setActionDropdownOpen(false)} className="flex items-start gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-[#2D9CDB] transition-colors group/item">
                          <PlusCircle className="h-5 w-5 mt-0.5 text-slate-400 group-hover/item:text-[#2D9CDB]" />
                          <div className="flex flex-col">
                            <span>Post a Tuition</span>
                            <span className="text-[10px] font-medium text-slate-400 group-hover/item:text-[#2D9CDB]/70">For Students & Parents</span>
                          </div>
                        </Link>
                        <Link href="/become-a-tutor" onClick={() => setActionDropdownOpen(false)} className="flex items-start gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-[#2D9CDB] transition-colors group/item mt-1">
                          <UserPlus className="h-5 w-5 mt-0.5 text-slate-400 group-hover/item:text-[#2D9CDB]" />
                          <div className="flex flex-col">
                            <span>Become a Tutor</span>
                            <span className="text-[10px] font-medium text-slate-400 group-hover/item:text-[#2D9CDB]/70">For Educators</span>
                          </div>
                        </Link>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.95 }}>
                <Link href="/onlinecourse" className="relative group flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#FF6B35] to-[#f45d24] px-5 py-2.5 text-[13px] font-bold text-white shadow-[0_10px_25px_rgba(255,107,53,0.3)] hover:shadow-[0_12px_30px_rgba(255,107,53,0.45)] transition-all duration-300">
                  <MonitorPlay className="h-[15px] w-[15px] transition-transform group-hover:rotate-12" strokeWidth={2.5} />
                  Online Class
                  <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center rounded-full bg-white border border-orange-200 px-1.5 py-0.5 shadow-sm">
                    <span className="text-[9px] font-black text-[#FF6B35] uppercase tracking-tighter flex items-center gap-0.5"><Sparkles className="w-2 h-2 fill-current"/> Hot</span>
                  </span>
                </Link>
              </motion.div>

              <div className="relative pl-3 flex items-center border-l border-slate-200/80" ref={dropdownRef}>
                {loadingUser ? (
                  <div className="h-10 w-10 animate-pulse rounded-full bg-slate-200" />
                ) : !user ? (
                  <motion.button whileTap={{ scale: 0.95 }} onClick={handleLogin} className="rounded-full bg-slate-50 border border-slate-200 px-5 py-2.5 text-[13px] font-bold text-slate-700 hover:bg-slate-100 hover:text-slate-900 shadow-sm transition-all whitespace-nowrap">
                    Login
                  </motion.button>
                ) : (
                  <>
                    <motion.button whileTap={{ scale: 0.95 }} onClick={() => setProfileDropdownOpen(!profileDropdownOpen)} className="group flex items-center gap-2 outline-none rounded-full bg-transparent hover:bg-slate-50 pr-2 transition-all duration-200">
                      <div className="relative h-10 w-10 rounded-full border-2 border-transparent group-hover:border-[#2D9CDB]/30 transition-colors p-0.5">
                        <div className="relative h-full w-full overflow-hidden rounded-full shadow-sm">
                          <Image src={user?.user_metadata?.avatar_url || "/images/default-avatar.png"} alt="Profile" fill sizes="40px" className="object-cover" />
                        </div>
                        <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
                      </div>
                      <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform duration-300 ${profileDropdownOpen ? 'rotate-180' : ''}`} strokeWidth={2.5} />
                    </motion.button>
                    
                    <AnimatePresence>
                      {profileDropdownOpen && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }} transition={{ duration: 0.15 }}
                          className="absolute right-0 top-[calc(100%+12px)] w-60 rounded-3xl border border-slate-100 bg-white/95 backdrop-blur-xl p-2 shadow-[0_15px_40px_rgba(0,0,0,0.12)] z-50 origin-top-right"
                        >
                          <div className="px-4 py-3 mb-2 border-b border-slate-100/80 bg-slate-50/50 rounded-2xl">
                            <p className="text-[14px] font-black text-slate-900 truncate">{user?.user_metadata?.full_name || 'User'}</p>
                            <p className="text-[11px] font-bold text-slate-500 truncate">{user?.email}</p>
                          </div>
                          <button onClick={() => { setProfileDropdownOpen(false); router.push('/profile'); }} className="group flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-[13px] font-bold text-slate-600 hover:bg-[#2D9CDB]/10 hover:text-[#2D9CDB] transition-all">
                            <Settings className="h-4 w-4 group-hover:rotate-90 transition-transform" strokeWidth={2.5} /> Dashboard
                          </button>
                          <button onClick={() => { setProfileDropdownOpen(false); router.push('/my-courses'); }} className="group flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-[13px] font-bold text-slate-600 hover:bg-orange-50 hover:text-[#FF6B35] transition-all">
                            <BookOpen className="h-4 w-4 group-hover:-translate-y-1 transition-transform" strokeWidth={2.5} /> My Courses
                          </button>
                          <div className="my-1 border-t border-slate-100" />
                          <button onClick={handleLogout} className="group flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-[13px] font-bold text-red-600 hover:bg-red-50 transition-all">
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
            <div className="flex items-center gap-3 ml-auto lg:hidden z-20">
              <motion.button whileTap={{ scale: 0.9 }} onClick={() => setIsSearchOpen(true)} className="p-1.5 rounded-full text-slate-500 bg-slate-50 border border-slate-200 shadow-sm flex items-center justify-center">
                <Search className="h-5 w-5" />
              </motion.button>

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
              
              <motion.button 
                whileTap={{ scale: 0.9 }}
                onClick={() => setMobileOpen(true)} 
                className="p-1.5 rounded-full text-slate-700 bg-slate-50 border border-slate-200 shadow-sm flex items-center justify-center"
              >
                <Menu className="h-5 w-5" strokeWidth={2.5} />
              </motion.button>
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
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: -10 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: -10 }} 
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col"
            >
              {/* Search Header */}
              <div className="flex items-center px-4 py-4 border-b border-slate-100 bg-slate-50/50">
                <Search className="h-6 w-6 text-[#2D9CDB]" />
                <input 
                  ref={searchInputRef}
                  type="text"
                  placeholder="Where do you want to go?" 
                  className="flex-1 ml-3 bg-transparent text-slate-800 font-bold text-lg outline-none placeholder:text-slate-400 placeholder:font-medium"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button 
                  onClick={() => setIsSearchOpen(false)} 
                  className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Search Results */}
              <div className="max-h-[50vh] overflow-y-auto p-3 flex flex-col gap-1">
                {filteredSearchData.length > 0 ? (
                  filteredSearchData.map((item, idx) => (
                    <button 
                      key={idx}
                      onClick={() => executeSearchAction(item.href)}
                      className="flex items-center justify-between w-full p-3 rounded-2xl hover:bg-slate-50 group transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-[#2D9CDB]"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-slate-100 group-hover:bg-white group-hover:shadow-sm rounded-xl text-slate-500 group-hover:text-[#2D9CDB] transition-all">
                          <item.icon className="h-5 w-5" />
                        </div>
                        <span className="text-slate-700 font-bold text-base group-hover:text-slate-900">{item.label}</span>
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-300 opacity-0 group-hover:opacity-100 group-hover:-translate-x-1 transition-all" />
                    </button>
                  ))
                ) : (
                  <div className="px-6 py-10 text-center flex flex-col items-center">
                    <Search className="h-10 w-10 text-slate-200 mb-3" />
                    <p className="text-slate-500 font-medium">No pages found matching "<span className="text-slate-800 font-bold">{searchQuery}</span>"</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- CUSTOM LOGOUT TOAST --- */}
      <AnimatePresence>
        {showLogoutToast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-4 bg-slate-900 text-white px-5 py-4 rounded-2xl shadow-2xl border border-slate-700 w-[90%] max-w-sm"
          >
            <div className="bg-emerald-500/20 text-emerald-400 p-2 rounded-full shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="flex flex-col">
              <span className="font-black text-sm">Thank you for connecting!</span>
              <span className="text-xs text-slate-400 font-medium mt-0.5">We hope to connect soon in the future.</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- MOBILE MENU DRAWER --- */}
      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-[100] flex flex-col justify-end">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
              onClick={() => setMobileOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
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
              className="relative w-full bg-white rounded-t-[2.5rem] px-5 pb-8 pt-4 shadow-[0_-20px_40px_rgba(0,0,0,0.15)] flex flex-col max-h-[90vh] overflow-y-auto"
            >
              <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-6" />

              <div className="flex justify-between items-center mb-6">
                <Image src="https://zuktarghyexwodqnnxlu.supabase.co/storage/v1/object/public/others/GyanHub_logo_website-removebg-preview__1_-removebg-preview.webp" alt="Logo" width={110} height={35} />
                <motion.button whileTap={{ scale: 0.9 }} onClick={() => setMobileOpen(false)} className="p-2 bg-slate-100 rounded-full text-slate-700">
                  <X className="h-5 w-5" strokeWidth={2.5} />
                </motion.button>
              </div>

              <div className="flex-1 overflow-y-auto pb-6 space-y-6">
                <div>
                  <h4 className="px-2 mb-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Explore</h4>
                  <div className="flex flex-col gap-1">
                    {navItems.map((item) => {
                      const active = isActive(item.href);
                      return (
                        <button 
                          key={item.href} onClick={() => { setMobileOpen(false); router.push(item.href); }} 
                          className={`flex w-full items-center gap-3 px-4 py-3.5 rounded-2xl text-[15px] font-black transition-all duration-200 ${
                            active ? "bg-[#2D9CDB]/10 text-[#2D9CDB]" : "bg-transparent text-slate-700 hover:bg-slate-50 active:scale-[0.98]"
                          }`}
                        >
                          <item.icon className={`h-5 w-5 ${active ? "text-[#2D9CDB]" : "text-slate-400"}`} strokeWidth={2.5} />
                          {item.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {!loadingUser && user && (
                  <div>
                    <h4 className="px-2 mb-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Account</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <button onClick={() => { setMobileOpen(false); router.push('/profile'); }} className="bg-slate-50 border border-slate-100 text-slate-700 py-3.5 rounded-2xl font-bold text-[13px] flex flex-col items-center justify-center gap-2 active:scale-95 transition-transform">
                        <Settings className="h-5 w-5 text-slate-400" /> Dashboard
                      </button>
                      <button onClick={() => { setMobileOpen(false); router.push('/my-courses'); }} className="bg-orange-50 border border-orange-100 text-[#FF6B35] py-3.5 rounded-2xl font-bold text-[13px] flex flex-col items-center justify-center gap-2 active:scale-95 transition-transform">
                        <BookOpen className="h-5 w-5" /> My Courses
                      </button>
                    </div>
                  </div>
                )}

                <div>
                  <h4 className="px-2 mb-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Actions</h4>
                  <div className="flex flex-col gap-2.5">
                    {!loadingUser && !isTutor && (
                      <div className="grid grid-cols-2 gap-2.5">
                        <button onClick={() => { setMobileOpen(false); router.push('/post-tuition'); }} className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 py-3 text-[12px] font-black active:scale-95 transition-transform text-center px-2">
                          <PlusCircle className="h-5 w-5 text-slate-400" />
                          <div className="flex flex-col items-center leading-tight mt-1">
                            <span>Post Tuition</span>
                            <span className="text-[9px] font-medium text-slate-400">For Parents</span>
                          </div>
                        </button>
                        <button onClick={() => { setMobileOpen(false); router.push('/become-a-tutor'); }} className="flex flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-[#2D9CDB] text-[#2D9CDB] py-3 text-[12px] font-black active:scale-95 transition-transform text-center px-2">
                          <UserPlus className="h-5 w-5 opacity-70" />
                          <div className="flex flex-col items-center leading-tight mt-1">
                            <span>Become Tutor</span>
                            <span className="text-[9px] font-medium opacity-70">For Teachers</span>
                          </div>
                        </button>
                      </div>
                    )}
                    
                    <button onClick={() => { setMobileOpen(false); router.push('/onlinecourse'); }} className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#FF6B35] to-[#f45d24] text-white py-4 text-[14px] font-black shadow-[0_8px_20px_rgba(255,107,53,0.3)] active:scale-95 transition-transform">
                      <MonitorPlay className="h-4 w-4" strokeWidth={2.5} /> Explore Online Classes
                    </button>

                    {!loadingUser && !user ? (
                      <button onClick={handleLogin} className="w-full mt-2 flex items-center justify-center rounded-xl bg-slate-900 text-white py-4 text-[14px] font-black active:scale-95 transition-transform">
                        Log In / Sign Up
                      </button>
                    ) : (
                      <button onClick={handleLogout} className="w-full mt-2 text-center rounded-xl bg-red-50 py-3.5 text-[13px] font-bold text-red-600 active:scale-95 transition-transform">
                        Log Out
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