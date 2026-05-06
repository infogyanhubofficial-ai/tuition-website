"use client";

import React, { useState, useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { 
  Home, BookOpen, Award, Receipt, Compass, 
  Phone, LogOut, Menu, X, MessageCircle, GraduationCap, PlayCircle, ChevronDown, Sparkles,
  AlertCircle, ShoppingBag, Send, SearchX, CheckCircle, Loader2, Clock
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { tokens, StatusBadge } from "@/components/dashboard/shared";

// --- 1. SHARED COMPONENTS & HELPERS ---
const Toast = ({ message, type, onClose }: { message: string, type: 'success' | 'error', onClose: () => void }) => (
  <motion.div 
    initial={{ y: 50, opacity: 0, scale: 0.9 }} 
    animate={{ y: 0, opacity: 1, scale: 1 }} 
    exit={{ y: 20, opacity: 0, scale: 0.9 }}
    className="fixed bottom-6 right-6 z-[9999] bg-slate-900 text-white px-5 py-3.5 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.2)] flex items-center gap-3 border border-slate-700"
  >
    {type === 'success' ? <CheckCircle className="text-emerald-400 w-5 h-5" /> : <AlertCircle className="text-red-400 w-5 h-5" />}
    <span className="font-bold text-sm tracking-wide">{message}</span>
    <button onClick={onClose} className="ml-2 text-slate-400 hover:text-white transition-colors"><X size={16} /></button>
  </motion.div>
);

function NavButton({ icon, label, href, active, onClick, colorTheme = "blue" }: any) {
  const getThemeClasses = () => {
    switch (colorTheme) {
      case 'emerald': return { bg: 'bg-emerald-50', text: 'text-emerald-700', icon: 'text-emerald-600', border: 'border-emerald-500' };
      case 'violet': return { bg: 'bg-violet-50', text: 'text-violet-700', icon: 'text-violet-600', border: 'border-violet-500' };
      default: return { bg: 'bg-blue-50', text: 'text-blue-700', icon: 'text-blue-600', border: 'border-blue-500' };
    }
  };
  
  const theme = getThemeClasses();
  const baseClasses = `relative w-full flex items-center gap-3 px-4 py-3 sm:py-3.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 border-l-[3px] group overflow-hidden ${
    active ? `border-transparent shadow-sm ${theme.text}` : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/50 hover:shadow-sm hover:scale-[1.01]'
  }`;

  const innerContent = (
    <>
      {active && (
        <motion.div
          layoutId="sidebar-active"
          className={`absolute inset-0 ${theme.bg} border-l-[3px] ${theme.border} z-0`}
          initial={false}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        />
      )}
      <div className={`relative z-10 flex items-center gap-3 w-full`}>
        <div className={`transition-colors duration-200 ${active ? theme.icon : 'text-slate-400 group-hover:text-slate-600'}`}>{icon}</div>
        <span>{label}</span>
      </div>
    </>
  );

  if (href) return <Link href={href} onClick={onClick} className={baseClasses}>{innerContent}</Link>;
  return <button onClick={onClick} className={baseClasses}>{innerContent}</button>;
}

function MobileNavButton({ icon, label, active, onClick, href, colorTheme = "blue" }: any) {
  const getThemeClasses = () => {
    switch (colorTheme) {
      case 'emerald': return { bg: 'bg-emerald-50', text: 'text-emerald-700', glow: 'shadow-[0_0_15px_rgba(16,185,129,0.3)]' };
      case 'violet': return { bg: 'bg-violet-50', text: 'text-violet-700', glow: 'shadow-[0_0_15px_rgba(139,92,246,0.3)]' };
      default: return { bg: 'bg-blue-50', text: 'text-blue-700', glow: 'shadow-[0_0_15px_rgba(37,99,235,0.3)]' };
    }
  };

  const theme = getThemeClasses();

  const innerContent = (
    <div className={`flex flex-col items-center gap-1 p-1.5 sm:p-2 transition-all min-w-[55px] sm:min-w-[65px] ${active ? theme.text : 'text-slate-400 hover:text-slate-600'}`}>
      <div className={`p-2 rounded-full transition-all duration-300 ${active ? `${theme.bg} ${theme.glow} scale-110` : 'bg-transparent'}`}>
        {React.cloneElement(icon, { size: active ? 20 : 18 })}
      </div>
      {active && <span className="text-[10px] sm:text-xs font-extrabold tracking-widest transition-all">{label}</span>}
    </div>
  );

  if (href) return <Link href={href} onClick={onClick}>{innerContent}</Link>;
  return <motion.button whileTap={{ scale: 0.92 }} onClick={onClick}>{innerContent}</motion.button>;
}

// --- 2. MAIN LAYOUT COMPONENT ---
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>('');
  const [userName, setUserName] = useState<string>('User');
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false); 
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
  
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isInvoicesOpen, setIsInvoicesOpen] = useState(false);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const currentTab = searchParams ? searchParams.get('tab') : null;
  const isTuitionActive = pathname.includes('/dashboard/tuition');
  const isHomeActive = pathname === '/dashboard' && (!currentTab || currentTab === 'Overview');

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        setUserEmail(user.email || '');
        setUserName(user.user_metadata?.full_name || user.email?.split('@')[0] || 'User');
        setUserAvatar(user.user_metadata?.avatar_url || null);
      } else {
        router.push("/login?next=/dashboard");
      }
      setIsLoadingUser(false);
    };
    fetchUser();
  }, [supabase, router]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  const renderSidebarLinks = (onMobileClose?: () => void) => {
    return (
      <div className="space-y-1.5">
        <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest px-4 mb-2 mt-2">Personal</p>
        <NavButton icon={<Home size={20} />} label="Gyan Hub" href="/dashboard" active={isHomeActive && !isInvoicesOpen && !isChatOpen} onClick={onMobileClose} colorTheme="blue" />
        
        <div className="h-px bg-slate-200/50 my-6 mx-4" />
        <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest px-4 mb-2">Explore Hub</p>

        <Link href="/onlinecourse" onClick={onMobileClose} className="group flex items-center gap-3 px-4 py-3 text-sm font-bold text-slate-600 hover:bg-slate-100/50 hover:text-slate-900 transition-all rounded-xl hover:scale-[1.01]">
          <BookOpen size={20} className="text-slate-400 group-hover:text-blue-500 transition-colors" /> Live Courses
        </Link>
        <Link href="/recording" onClick={onMobileClose} className="group flex items-center gap-3 px-4 py-3 text-sm font-bold text-slate-600 hover:bg-slate-100/50 hover:text-slate-900 transition-all rounded-xl hover:scale-[1.01]">
          <PlayCircle size={20} className="text-slate-400 group-hover:text-blue-500 transition-colors" /> Recordings
        </Link>

        <div className="h-px bg-slate-200/50 my-6 mx-4" />
        <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest px-4 mb-2">Support & settings</p>
        
        <NavButton icon={<Receipt size={20} />} label="Invoices" onClick={() => { setIsInvoicesOpen(prev => !prev); setIsChatOpen(false); onMobileClose?.(); }} active={isInvoicesOpen} colorTheme="blue" />
        <NavButton icon={<MessageCircle size={20} />} label="Support Chat" onClick={() => { setIsChatOpen(prev => !prev); setIsInvoicesOpen(false); onMobileClose?.(); }} active={isChatOpen} colorTheme="blue" />

        <a href="https://wa.me/9763695665" target="_blank" rel="noopener noreferrer" className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-slate-600 hover:bg-green-50 hover:text-green-700 transition-all group hover:scale-[1.01]`}>
          <Phone size={20} className="text-slate-400 group-hover:text-green-500 transition-colors" />
          <span>WhatsApp Us</span>
        </a>

        <button onClick={handleSignOut} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-slate-600 hover:bg-red-50 hover:text-red-700 transition-all group hover:scale-[1.01]`}>
          <LogOut size={20} className="text-slate-400 group-hover:text-red-500 transition-colors" />
          <span>Signout</span>
        </button>
      </div>
    );
  };

  return (
    <div className={`min-h-screen bg-slate-50 text-slate-900 pb-24 lg:pb-12 font-sans overflow-x-hidden flex flex-col bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white via-slate-50 to-slate-100`}>
      <AnimatePresence>
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </AnimatePresence>

      {/* --- MOBILE SIDEBAR MENU OVERLAY --- */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] lg:hidden"
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", bounce: 0, duration: 0.4 }}
              className="fixed inset-y-0 left-0 w-[80%] max-w-sm bg-white shadow-2xl z-[101] lg:hidden flex flex-col"
            >
              <div className="p-4 sm:p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold shadow-sm">
                    {userName?.charAt(0).toUpperCase() || 'G'}
                  </div>
                  <span className="font-extrabold text-lg tracking-tight text-slate-900">Menu</span>
                </div>
                <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors">
                  <X size={20} className="text-slate-600"/>
                </button>
              </div>
              <div className="flex-1 overflow-y-auto py-2 custom-scrollbar">
                {renderSidebarLinks(() => setIsMobileMenuOpen(false))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 h-[70px] sm:h-20 flex items-center px-4 sm:px-6 shadow-sm">
        <div className="max-w-7xl mx-auto w-full flex justify-between items-center">
          <div className="relative">
            <button 
              onClick={() => setIsProfileOpen(!isProfileOpen)} 
              className="flex items-center gap-2 sm:gap-3 p-1.5 rounded-2xl hover:bg-slate-100 transition-all focus:outline-none ring-2 ring-transparent hover:ring-blue-100"
            >
              {isLoadingUser ? (
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-slate-200 animate-pulse"></div>
              ) : userAvatar ? (
                <img src={userAvatar} className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl object-cover border border-slate-200 shadow-sm" alt={userName} />
              ) : (
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl flex items-center justify-center text-white font-bold text-lg sm:text-xl shadow-sm">
                  {userName?.charAt(0).toUpperCase() || 'G'}
                </div>
              )}
              <div className="flex items-center gap-1.5 sm:gap-2">
                <p className="flex items-center gap-1.5 sm:gap-2 text-[16px] sm:text-[20px] font-extrabold tracking-tight">
                  <span className="text-slate-800 hidden sm:inline">{isLoadingUser ? 'Loading...' : userName}</span>
                  <span className="text-slate-300 font-normal hidden sm:inline">|</span>
                  <span className="text-blue-700 font-bold hidden sm:inline">Dashboard</span>
                </p>
                <ChevronDown size={16} className={`text-slate-400 transition-transform hidden sm:block ${isProfileOpen ? 'rotate-180' : ''}`} />
              </div>
            </button>

            <AnimatePresence>
              {isProfileOpen && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }} transition={{ duration: 0.15 }}
                  className="absolute left-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.08)] border border-slate-100 py-2 z-50 overflow-hidden"
                >
                  <div className="px-4 py-3 border-b border-slate-100 mb-1">
                    <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Signed in as</p>
                    <p className="text-sm font-bold text-slate-800 truncate">{userName}</p>
                  </div>
                  <button onClick={handleSignOut} className="w-full text-left px-4 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors">
                    <LogOut size={16}/> Sign out
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="relative hidden lg:flex items-center bg-slate-100/60 p-1.5 rounded-2xl border border-slate-200/60 gap-2 shadow-inner">
            <Link href="/dashboard" className="relative px-6 py-2.5 z-10 font-bold text-sm transition-all text-center rounded-xl overflow-hidden group text-slate-600 hover:text-slate-900">
              {isHomeActive && <motion.div layoutId="topnav-active" className="absolute inset-0 bg-white shadow-sm border border-slate-200/60 rounded-xl z-0" transition={{ type: "spring", stiffness: 400, damping: 30 }} />}
              <span className={`relative z-10 ${isHomeActive ? 'text-blue-700' : ''}`}>Home</span>
            </Link>
            
            <Link href="/dashboard/tuition" className="relative px-6 py-2.5 z-10 font-bold text-sm transition-all text-center rounded-xl overflow-hidden group text-slate-600 hover:text-slate-900">
              {isTuitionActive && <motion.div layoutId="topnav-active" className="absolute inset-0 bg-white shadow-sm border border-slate-200/60 rounded-xl z-0" transition={{ type: "spring", stiffness: 400, damping: 30 }} />}
              <span className={`relative z-10 flex items-center gap-2 ${isTuitionActive ? 'text-violet-700' : ''}`}>
                <Sparkles size={14} className={isTuitionActive ? 'text-violet-500' : 'text-slate-400'}/> Tuition Services
              </span>
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-4 sm:mt-8 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 relative flex-grow w-full">
        <aside className="hidden lg:block lg:col-span-3">
          <div className="bg-transparent p-2 sticky top-28 space-y-1 h-[calc(100vh-140px)] overflow-y-auto custom-scrollbar" style={{ maskImage: 'linear-gradient(to bottom, black 85%, transparent 100%)', WebkitMaskImage: 'linear-gradient(to bottom, black 85%, transparent 100%)' }}>
            {renderSidebarLinks()}
          </div>
        </aside>

        <main className="lg:col-span-9 w-full relative z-10 min-h-[500px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname} 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="w-full h-full"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <nav className="lg:hidden fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 bg-white/90 backdrop-blur-xl border border-slate-200/80 shadow-[0_8px_32px_rgba(0,0,0,0.08)] rounded-full px-3 py-2 flex justify-center gap-2 sm:gap-6 items-center">
        <MobileNavButton icon={<Home size={20} />} label="Home" href="/dashboard" active={isHomeActive && !isInvoicesOpen && !isChatOpen} colorTheme="blue" />
        <MobileNavButton icon={<GraduationCap size={20} />} label="Tuition" href="/dashboard/tuition" active={isTuitionActive} colorTheme="violet" />
        <MobileNavButton icon={<Menu size={20} />} label="Menu" active={isMobileMenuOpen} onClick={() => setIsMobileMenuOpen(true)} colorTheme="blue" />
      </nav>

      <AnimatePresence>
        {isInvoicesOpen && (
          <InvoicesModal userId={userId} userEmail={userEmail} onClose={() => setIsInvoicesOpen(false)} router={router} />
        )}
      </AnimatePresence>

      <div className="fixed bottom-24 sm:bottom-28 lg:bottom-10 right-4 lg:right-6 z-[80] flex flex-col items-end gap-4">
        <AnimatePresence>
          {isChatOpen && (
             <motion.div 
               initial={{ opacity: 0, y: 20, scale: 0.95 }} 
               animate={{ opacity: 1, y: 0, scale: 1 }} 
               exit={{ opacity: 0, y: 20, scale: 0.95 }}
               transition={{ duration: 0.2 }}
               className="w-[calc(100vw-32px)] sm:w-[380px] max-w-[400px] pointer-events-auto"
             >
               <ChatWidget userId={userId} showToast={showToast} onClose={() => setIsChatOpen(false)} />
             </motion.div>
          )}
        </AnimatePresence>

        <div className="relative group">
          {!isChatOpen && <div className="absolute -inset-1.5 bg-blue-500 rounded-full blur-md opacity-30 group-hover:opacity-50 animate-pulse transition duration-500"></div>}
          {!isChatOpen && (
             <div className="absolute right-full mr-4 top-1/2 -translate-y-1/2 bg-slate-800 text-white text-xs font-bold px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none whitespace-nowrap shadow-xl translate-x-2 group-hover:translate-x-0">
                Need Help?
             </div>
          )}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsChatOpen(prev => !prev)}
            className={`relative bg-gradient-to-br from-blue-600 to-blue-800 text-white px-4 sm:px-5 py-3.5 sm:py-4 rounded-2xl shadow-[0_10px_25px_rgba(29,78,216,0.5)] flex items-center gap-2.5 font-bold text-xs sm:text-sm hover:shadow-[0_15px_35px_rgba(29,78,216,0.6)] transition-all border border-blue-500`}
          >
            {isChatOpen ? <X size={20} className="fill-white/20" /> : <MessageCircle size={20} className="fill-white/20" />} 
            <span className="hidden sm:inline">{isChatOpen ? 'Close' : 'Support'}</span>
          </motion.button>
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// EMBEDDED VIEWS (INVOICES & CHATBOX)
// -------------------------------------------------------------

function InvoicesModal({ userId, userEmail, onClose, router }: any) {
  const supabase = createClient();
  const [orders, setOrders] = useState<any[]>([]);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [ordersError, setOrdersError] = useState<string | null>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<any | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      const { data: ordersData, error } = await supabase
        .from('orders_v2')
        .select('*')
        .or(`user_id.eq.${userId},email.ilike.${userEmail}`)
        .order('created_at', { ascending: false });
        
      if (error) {
        setOrdersError(error.message);
      } else if (ordersData) {
        setOrders(ordersData.map(o => ({
          ...o, 
          paid_amount: o.paid_amount || 0,
          pending_amount: o.pending_amount || 0,
          remaining_amount: o.remaining_amount || 0,
          price: o.paid_amount || 0, 
          screenshot_url: o.payment_screenshots?.[0] || '',
          service: o.order_name || 'GyanHub Service'
        })));
      }

      const { data: enrollsData } = await supabase
        .from('enrollments_v2')
        .select('*')
        .or(`user_id.eq.${userId},email.ilike.${userEmail}`);
        
      if (enrollsData) setEnrollments(enrollsData);

      setLoading(false);
    };
    if (userEmail || userId) fetchData();
  }, [userId, userEmail, supabase]);

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    const d = new Date(dateString);
    return isNaN(d.getTime()) ? 'N/A' : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 sm:p-6 overflow-y-auto">
      <AnimatePresence>
      {selectedTransaction ? (
        <TransactionModal 
          order={selectedTransaction} 
          enrollments={enrollments} 
          onClose={() => setSelectedTransaction(null)} 
          router={router} 
          onCloseModal={onClose}
        />
      ) : (
        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-slate-50 rounded-3xl w-full max-w-4xl shadow-2xl flex flex-col relative overflow-hidden h-[80vh]">
          <div className="flex justify-between items-center p-6 sm:p-8 bg-white border-b border-slate-200 shrink-0">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-3">
              <Receipt className="text-blue-600" size={28} /> My Billing & Invoices
            </h2>
            <button onClick={onClose} className="p-2.5 bg-slate-100 rounded-full hover:bg-slate-200 text-slate-600 transition-colors"><X size={18} /></button>
          </div>
          <div className="p-6 sm:p-8 flex-1 overflow-y-auto custom-scrollbar">
            {loading ? (
              <div className="flex justify-center items-center h-full"><Loader2 className="animate-spin text-blue-600" size={32} /></div>
            ) : (
              <TransactionsView orders={orders} ordersError={ordersError} formatDate={formatDate} setSelectedTransaction={setSelectedTransaction} enrollments={enrollments} router={router} onCloseModal={onClose} />
            )}
          </div>
        </motion.div>
      )}
      </AnimatePresence>
    </div>
  );
}

function TransactionsView({ orders, ordersError, formatDate, setSelectedTransaction, enrollments, router, onCloseModal }: any) {
  return (
    <div className="space-y-4 w-full">
      {ordersError && <div className="p-4 bg-red-50 text-red-700 text-sm rounded-xl border border-red-200 font-bold flex items-center gap-3"><AlertCircle size={18}/> Error loading billing history.</div>}
      
      {(!orders || orders.length === 0) ? (
        <div className="flex flex-col items-center justify-center bg-slate-50/50 rounded-2xl py-16 px-6 border border-dashed border-slate-300 text-center shadow-inner">
          <div className="bg-white p-4 rounded-full shadow-sm mb-4 border border-slate-100"><Receipt size={32} className="text-slate-400" /></div>
          <p className="text-slate-900 font-extrabold text-lg mb-1 tracking-tight">No transaction history found</p>
          <p className="text-slate-500 font-medium text-sm">Your verified and unverified invoices will appear here.</p>
        </div>
      ) : orders.map((order: any) => {
        const relatedEnrollment = enrollments?.find((e: any) => 
          (order.enrollment_id && e.id === order.enrollment_id) || 
          (e.course_name && order.order_name && e.course_name.toLowerCase() === order.order_name.toLowerCase())
        );
        
        const remainingDue = order.remaining_amount ?? relatedEnrollment?.remaining_amount ?? 0;
        const hasPendingAmount = order.pending_amount > 0;

        return (
          <div key={order.id} onClick={() => setSelectedTransaction(order)} className="cursor-pointer bg-white p-5 md:p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col hover:shadow-lg hover:border-blue-300 hover:-translate-y-0.5 transition-all group">
            
            {/* Top Info Section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 w-full">
              <div className="flex items-center gap-4 w-full sm:w-auto flex-1 min-w-0">
                <div className={`p-3.5 rounded-2xl shrink-0 border border-slate-100 transition-colors ${hasPendingAmount ? 'bg-orange-50 text-orange-500' : 'bg-slate-50 text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-600'}`}>
                  {hasPendingAmount ? <Clock size={20} /> : <ShoppingBag size={20} />}
                </div>
                <div className="overflow-hidden flex-1 min-w-0">
                  <p className="font-extrabold text-slate-900 text-lg leading-tight truncate group-hover:text-blue-700 transition-colors">
                    {order.service}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest truncate">
                      {order.order_type || 'Service'} <span className="mx-2 opacity-50">•</span> {formatDate(order.created_at)}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="text-right w-full sm:w-auto flex flex-row sm:flex-col justify-between items-center sm:items-end pt-4 sm:pt-0 shrink-0 gap-2 border-t border-slate-100 sm:border-0">
                {hasPendingAmount ? (
                  <div className="flex flex-col gap-1 text-xs text-right mt-1 sm:mt-0">
                    <p className="text-slate-500 font-medium">Paid: <strong className="text-slate-900 ml-1">Rs. {order.paid_amount}</strong></p>
                    <p className="text-orange-500 font-bold">Your Rs. {order.pending_amount} payment is initiated and not verified yet</p>
                    <p className="text-red-500 font-medium">Remaining: <strong className="text-red-600 ml-1">Rs. {remainingDue}</strong></p>
                  </div>
                ) : (
                  <p className="font-black text-xl text-slate-900 tracking-tight">Rs. {order.paid_amount}</p>
                )}
                
                <div className="mt-2 sm:mt-1 flex flex-wrap justify-end gap-2">
                  <StatusBadge status={order.status} />
                </div>
              </div>
            </div>

            {/* Bottom Action Section */}
            {(order.status === 'verified' || remainingDue > 0) && (
              <div className="w-full mt-4 pt-4 border-t border-slate-100 flex flex-wrap justify-end gap-3" onClick={(e) => e.stopPropagation()}>
                {order.status === 'verified' && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); onCloseModal(); router.push(`/invoice/${order.id}`); }} 
                    className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-bold rounded-xl transition-colors flex items-center gap-2"
                  >
                    <Receipt size={16} /> View Invoice
                  </button>
                )}
                {/* Only display the Pay Remaining button if there's no unverified pending amount */}
                {remainingDue > 0 && !hasPendingAmount && (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      const courseName = relatedEnrollment?.course_name || order.order_name || order.service;
                      router.push(`/order?order_type=course&courseName=${encodeURIComponent(courseName)}&price=${remainingDue}`); 
                    }} 
                    className="px-5 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all shadow-sm flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white"
                  >
                    Pay Remaining (Rs. {remainingDue})
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function TransactionModal({ order, enrollments, onClose, router, onCloseModal }: any) {
  const getScreenshotUrl = (path: string) => path.startsWith('http') ? path : `https://zuktarghyexwodqnnxlu.supabase.co/storage/v1/object/public/others/${path}`;

  const relatedEnrollment = enrollments?.find((e: any) => 
    (order.enrollment_id && e.id === order.enrollment_id) || 
    (e.course_name && order.order_name && e.course_name.toLowerCase() === order.order_name.toLowerCase())
  );
  
  const remainingDue = order.remaining_amount ?? relatedEnrollment?.remaining_amount ?? 0;
  
  // Logic checks explicitly for pending_amount > 0 to restrict payment actions
  const hasPendingAmount = order.pending_amount > 0;

  return (
    <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl border border-slate-200 flex flex-col relative overflow-hidden my-auto max-h-[90vh]">
      {/* Top absolute Close Button */}
      <button onClick={onClose} className="absolute top-4 right-4 p-2.5 bg-slate-100 rounded-full hover:bg-slate-200 text-slate-600 z-[60] transition-colors"><X size={18} /></button>
      
      <div className="p-6 md:p-8 space-y-6 pt-14 overflow-y-auto custom-scrollbar">
        <div className="text-center">
          <p className="text-[10px] font-extrabold text-blue-600 uppercase tracking-widest mb-3 flex items-center justify-center gap-2"><ShoppingBag size={14}/> {order.order_type || 'GYANHUB'} PURCHASE</p>
          <h4 className="text-2xl font-black text-slate-900 leading-tight tracking-tight">{order.service}</h4>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
          <div className="col-span-1 p-4 sm:p-5 bg-slate-50 border border-slate-100 rounded-2xl shadow-sm flex flex-col justify-center">
            <p className="text-[10px] uppercase font-extrabold text-slate-400 tracking-widest mb-1.5">Amount Paid</p>
            <p className="font-black text-xl tracking-tight text-slate-900">Rs. {order.paid_amount}</p>
          </div>
          
          {hasPendingAmount && (
            <div className="col-span-1 p-4 sm:p-5 bg-orange-50 border border-orange-100 rounded-2xl shadow-sm flex flex-col justify-center">
              <p className="text-[10px] uppercase font-extrabold text-orange-500 tracking-widest mb-1.5">Unverified</p>
              <p className="font-black text-xl tracking-tight text-orange-600">Rs. {order.pending_amount}</p>
            </div>
          )}

          <div className="col-span-1 p-4 sm:p-5 bg-slate-50 border border-slate-100 rounded-2xl shadow-sm flex flex-col justify-center">
            <p className="text-[10px] uppercase font-extrabold text-slate-400 tracking-widest mb-1.5">Date</p>
            <p className="font-semibold text-slate-700 text-lg tracking-tight mt-0.5">{new Date(order.created_at).toLocaleDateString()}</p>
          </div>
          
          <div className={`col-span-2 md:col-span-3 p-4 sm:p-5 rounded-2xl border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm ${remainingDue > 0 ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-200'}`}>
            <div>
              <p className={`text-[10px] uppercase font-extrabold tracking-widest ${remainingDue > 0 ? 'text-red-600' : 'text-slate-500'}`}>Remaining Due</p>
              <p className={`font-black text-lg tracking-tight ${remainingDue > 0 ? 'text-red-700' : 'text-slate-800'}`}>{remainingDue > 0 ? `Rs. ${remainingDue}` : 'No due remaining'}</p>
            </div>
            {remainingDue > 0 && !hasPendingAmount && (
              <button 
                onClick={() => {
                  const courseName = relatedEnrollment?.course_name || order.order_name || order.service;
                  router.push(`/order?order_type=course&courseName=${encodeURIComponent(courseName)}&price=${remainingDue}`); 
                }} 
                className="w-full sm:w-auto shrink-0 font-bold px-6 py-3 rounded-xl text-sm whitespace-nowrap transition-all shadow-sm bg-red-600 hover:bg-red-700 text-white"
              >
                Pay Now
              </button>
            )}
          </div>
          
          <div className="col-span-2 md:col-span-3 p-4 sm:p-5 bg-white rounded-2xl border border-slate-200 shadow-sm flex justify-between items-center">
            <p className="text-[10px] uppercase font-extrabold text-slate-400 tracking-widest">Verification Status</p>
            <StatusBadge status={order.status} />
          </div>
        </div>
        
        <div>
          <h4 className="text-[10px] font-extrabold uppercase text-slate-400 tracking-widest mb-3">Payment Screenshot</h4>
          {order.screenshot_url ? (
            <div className="border border-slate-200 bg-slate-50 p-2 rounded-2xl">
              <img src={getScreenshotUrl(order.screenshot_url)} alt="Receipt" className="w-full object-contain rounded-xl max-h-[250px]" />
            </div>
          ) : (
            <div className="p-10 border-2 border-dashed border-slate-200 rounded-2xl text-center flex flex-col items-center text-slate-400 bg-slate-50/50">
              <SearchX size={36} className="mb-3 opacity-40" />
              <p className="font-bold text-sm text-slate-500">No screenshot attached</p>
            </div>
          )}
          {order.status === 'verified' && (
            <button onClick={() => { onCloseModal(); router.push(`/invoice/${order.id}`); }} className="mt-6 w-full py-4 bg-gradient-to-r from-slate-900 to-slate-800 hover:from-black hover:to-slate-900 text-white rounded-xl font-bold flex justify-center items-center gap-2 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all tracking-wide">
              <Receipt size={18} /> View Official Invoice
            </button>
          )}
          {hasPendingAmount && (
            <div className="mt-6 p-4 bg-orange-50 border border-orange-100 rounded-xl flex items-start gap-3">
              <AlertCircle className="text-orange-500 shrink-0 mt-0.5" size={18} />
              <p className="text-xs text-orange-700 leading-relaxed font-medium">Your Rs. {order.pending_amount} payment is initiated and not verified yet. The official invoice and any remaining payments will be unlocked once our team confirms the transaction.</p>
            </div>
          )}
        </div>

        <button onClick={onClose} className="w-full mt-2 py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors">
          Close Invoice Details
        </button>
      </div>
    </motion.div>
  );
}

function ChatWidget({ userId, showToast, onClose }: any) {
  const supabase = createClient();
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!userId) return;
    const fetchMessages = async () => {
      const { data } = await supabase.from('messages').select('*').eq('user_id', userId).order('created_at', { ascending: true });
      if (data) setMessages(data);
    };
    fetchMessages();
    const channel = supabase.channel(`support_chat_${userId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `user_id=eq.${userId}` }, (payload) => {
        setMessages(prev => prev.some(m => m.id === payload.new.id) ? prev : [...prev, payload.new]);
      }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userId, supabase]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, sending]);

  const handleSend = async () => {
    if (!input.trim() || !userId) return;
    setSending(true);
    const content = input.trim();
    setInput('');
    const tempId = Date.now().toString();
    const tempMsg = { id: tempId, user_id: userId, sender_role: 'student', content, created_at: new Date().toISOString() };
    setMessages(prev => [...prev, tempMsg]);
    
    const { data, error } = await supabase.from('messages').insert([{ user_id: userId, sender_role: 'student', content }]).select();
    if (data && data.length > 0) {
      setMessages(prev => [...prev.filter(m => m.id !== tempId && m.id !== data[0].id), data[0]]);
    } else if (error) {
       showToast("Failed to send message. Please try again.", "error");
       setMessages(prev => prev.filter(m => m.id !== tempId));
    }
    setSending(false);
  };

  const formatTime = (isoString: string) => {
     const d = new Date(isoString);
     if(isNaN(d.getTime())) return "";
     return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-2xl flex flex-col h-[500px] sm:h-[600px] relative">
      <div className="p-4 bg-gradient-to-r from-blue-700 to-blue-800 text-white flex justify-between items-center shrink-0 shadow-md relative z-10">
        <div className="flex items-center gap-3">
           <div className="p-2 bg-white/10 rounded-full backdrop-blur-sm"><MessageCircle size={18} /></div>
           <div>
              <h3 className="font-extrabold text-lg tracking-tight">GyanHub Support</h3>
              <p className="text-blue-100 text-[10px] mt-0.5 font-semibold tracking-widest uppercase flex items-center gap-1.5">
                 <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span> Online
              </p>
           </div>
        </div>
        <button onClick={onClose} className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"><X size={16}/></button>
      </div>
      
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-5 space-y-5 bg-slate-50/50">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center text-slate-400 py-10">
            <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center mb-3 border border-blue-100"><MessageCircle size={24} className="text-blue-400" /></div>
            <p className="font-extrabold text-slate-700 text-base tracking-tight mb-1">Start a conversation</p>
            <p className="font-medium text-xs max-w-[200px] leading-relaxed">Ask us anything about courses, payments, or account issues.</p>
          </div>
        )}
        
        {messages.map((msg) => {
          const isOwn = msg.sender_role !== 'admin';
          return (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
              {!isOwn && <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-blue-600 to-blue-800 flex items-center justify-center text-white text-[10px] font-extrabold mr-2 mt-1 shadow-sm shrink-0">G</div>}
              <div className={`max-w-[80%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                <div className={`px-4 py-2.5 rounded-2xl text-sm font-medium leading-relaxed shadow-sm ${isOwn ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-white text-slate-800 rounded-bl-sm border border-slate-200'}`}>
                  {msg.content}
                </div>
                <span className={`text-[9px] font-extrabold tracking-widest uppercase opacity-50 ${isOwn ? 'pr-1' : 'pl-1'}`}>{formatTime(msg.created_at)}</span>
              </div>
            </motion.div>
          );
        })}
        
        {sending && (
           <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-end">
              <div className="bg-blue-600 text-white px-4 py-3 rounded-2xl rounded-br-sm shadow-sm flex items-center gap-1.5">
                 <span className="w-1 h-1 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                 <span className="w-1 h-1 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                 <span className="w-1 h-1 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </div>
           </motion.div>
        )}
        <div ref={bottomRef} className="h-2" />
      </div>

      <div className="p-3 sm:p-4 border-t border-slate-200 bg-white flex gap-2 z-10 relative shadow-[0_-10px_20px_rgba(0,0,0,0.02)]">
        <input 
          value={input} 
          onChange={e => setInput(e.target.value)} 
          onKeyDown={(e) => { if (e.key === 'Enter') handleSend(); }} 
          placeholder="Type your message…" 
          className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50 transition-all" 
        />
        <button 
          onClick={handleSend} 
          disabled={sending || !input.trim()} 
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 rounded-xl disabled:opacity-50 font-bold transition-all flex items-center justify-center shadow-md disabled:shadow-none hover:-translate-y-0.5 active:translate-y-0 shrink-0"
        >
          {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
        </button>
      </div>
    </div>
  );
}