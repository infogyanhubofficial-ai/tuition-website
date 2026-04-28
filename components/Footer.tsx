'use client';

import Link from "next/link";
import { useState } from "react";
import { 
  Facebook, Youtube, Instagram, Linkedin, 
  Mail, ChevronUp, MessageCircle, ShieldCheck, CheckCircle2,
  ArrowRight, Lock
} from "lucide-react";

// --- DATA ARRAYS ---
const SOCIAL_LINKS = [
  { icon: Facebook, href: "https://www.facebook.com/dashboard.php?id=61569757534336", label: "Facebook", hoverColor: "hover:bg-[#1877F2]" },
  { icon: Youtube, href: "https://www.youtube.com/@GyanHubOnline", label: "YouTube", hoverColor: "hover:bg-[#FF0000]" },
  { icon: Instagram, href: "https://www.instagram.com/gyanhubonline/?next=%2F", label: "Instagram", hoverColor: "hover:bg-[#E4405F]" },
  { icon: Linkedin, href: "https://www.linkedin.com/company/gyanhub/", label: "LinkedIn", hoverColor: "hover:bg-[#0A66C2]" },
  { icon: MessageCircle, href: "https://wa.me/9763695665", label: "WhatsApp", hoverColor: "hover:bg-[#25D366]" },
];

const COMPANY_LINKS = [
  { label: "About GyanHub", href: "/about" },
  { label: "GyanHub Stories", href: "#", isLocked: true },
  { label: "User's Data Policy", href: "/privacy-policy" },
];

const QUICK_LINKS = [
  { label: "Popular Courses", href: "/onlinecourse" },
  { label: "Find a Tutor", href: "/tutors" },
  { label: "Latest Vacancies", href: "/vacancies" },
  { label: "Recording Courses", href: "https://www.gyanhub.com.np/recording" },
];

const ADMIN_LINKS = [
  { label: "Contact Us", href: "/contact" },
  { label: "FAQs", href: "/faqs" },
  { label: "Refund & Return Policy", href: "/refund" },
];

export default function Footer() {
  const [email, setEmail] = useState('');
  const [subscribeStatus, setSubscribeStatus] = useState<'idle' | 'submitting' | 'success'>('idle');

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    setSubscribeStatus('submitting');
    setTimeout(() => {
      setSubscribeStatus('success');
      setEmail('');
      setTimeout(() => setSubscribeStatus('idle'), 3000);
    }, 1000);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="relative bg-[#0A0F24] bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-900/10 via-[#0A0F24] to-[#0A0F24] text-slate-400 pt-16 md:pt-24 pb-8 md:pb-12 border-t border-slate-800 overflow-hidden font-sans">
      
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        
        {/* Top Grid Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-10 mb-12 md:mb-20">
          
          {/* --- Brand & Socials Column --- */}
          <div className="space-y-5 lg:col-span-2 pr-4 lg:pr-12">
            
            <Link href="/" className="inline-flex items-center gap-2 text-3xl font-black tracking-tight transition-transform hover:scale-105 outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-lg">
              <div className="drop-shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                <span className="text-blue-500">Gyan</span>
                <span className="text-orange-500">Hub</span>
              </div>
              <span className="relative flex h-2 w-2 mt-1">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </Link>
            
            <p className="text-[15px] leading-relaxed text-slate-400">
              Dive into educational stories, level up your skills, and connect with a community that never stops growing.
            </p>
            
            <div className="flex flex-wrap gap-3 pt-2">
              {SOCIAL_LINKS.map((social) => {
                const Icon = social.icon;
                return (
                  <a 
                    key={social.label}
                    href={social.href} 
                    target="_blank" 
                    rel="noreferrer" 
                    aria-label={`Follow us on ${social.label}`}
                    className={`flex h-10 w-10 items-center justify-center rounded-full bg-white/5 border border-white/5 text-slate-400 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${social.hoverColor} hover:text-white hover:border-transparent`}
                  >
                    <Icon className="h-4 w-4 stroke-[2]" />
                  </a>
                );
              })}
              
              <a 
                href="https://www.tiktok.com/@gyanhubofficial" 
                target="_blank" 
                rel="noreferrer" 
                aria-label="Follow us on TikTok"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 border border-white/5 text-slate-400 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:bg-black hover:text-white hover:border-transparent"
              >
                <svg className="h-[15px] w-[15px] fill-current" viewBox="0 0 24 24">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
                </svg>
              </a>
            </div>
          </div>

          {/* --- Company Links Column --- */}
          <div>
            <h3 className="text-[13px] font-semibold uppercase tracking-[0.15em] text-slate-200 mb-5">Company</h3>
            <ul className="space-y-3 text-[14px] text-slate-400">
              {COMPANY_LINKS.map(link => (
                <li key={link.label}>
                  {link.isLocked ? (
                    <button 
                      onClick={(e) => { e.preventDefault(); alert("This feature will be available soon!"); }}
                      className="group relative inline-flex items-center text-slate-500 hover:text-slate-300 transition-colors cursor-help"
                      title="This feature will be available soon!"
                    >
                      {link.label}
                      <Lock className="w-3 h-3 ml-1.5 opacity-70" />
                    </button>
                  ) : (
                    <Link href={link.href} className="group relative inline-flex items-center hover:text-white transition-colors">
                      {link.label}
                      <span className="absolute -bottom-1 left-0 w-0 h-[2px] bg-blue-500 transition-all duration-300 group-hover:w-full"></span>
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* --- Quick Links Column --- */}
          <div>
            <h3 className="text-[13px] font-semibold uppercase tracking-[0.15em] text-slate-200 mb-5">Quick Links</h3>
            <ul className="space-y-3 text-[14px] text-slate-400">
              {QUICK_LINKS.map(link => (
                <li key={link.label}>
                  <Link href={link.href} className="group relative inline-flex items-center hover:text-white transition-colors">
                    {link.label}
                    <span className="absolute -bottom-1 left-0 w-0 h-[2px] bg-blue-500 transition-all duration-300 group-hover:w-full"></span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* --- Admin/Support Links Column --- */}
          <div>
            <h3 className="text-[13px] font-semibold uppercase tracking-[0.15em] text-slate-200 mb-5">Admin</h3>
            <ul className="space-y-3 text-[14px] text-slate-400">
              {ADMIN_LINKS.map(link => (
                <li key={link.label}>
                  <Link href={link.href} className="group relative inline-flex items-center hover:text-white transition-colors">
                    {link.label}
                    <span className="absolute -bottom-1 left-0 w-0 h-[2px] bg-blue-500 transition-all duration-300 group-hover:w-full"></span>
                  </Link>
                </li>
              ))}
              <li className="pt-2">
                <a href="mailto:admin@gyanhub.com" className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors group p-1.5 -ml-1.5 rounded-lg hover:bg-blue-500/10">
                  <div className="bg-blue-500/10 p-1.5 rounded-full group-hover:bg-blue-500/20 transition-colors">
                    <Mail className="h-3.5 w-3.5" />
                  </div>
                  admin@gyanhub.com
                </a>
              </li>
            </ul>
          </div>

        </div>

        {/* --- Newsletter Section --- */}
        <div className="bg-gradient-to-r from-slate-800/40 to-slate-900/40 border border-white/5 rounded-3xl p-6 md:p-8 mb-10 md:mb-16 flex flex-col md:flex-row items-center justify-between gap-6 md:gap-8 backdrop-blur-sm">
          <div className="max-w-md w-full text-center md:text-left">
            <h3 className="text-lg md:text-xl font-bold text-white mb-2">Subscribe to our Newsletter</h3>
            <p className="text-sm text-slate-400">Get the latest course updates, educational stories, and tech news delivered straight to your inbox.</p>
          </div>
          
          <div className="w-full md:w-auto flex-1 max-w-md">
            <form onSubmit={handleSubscribe} className="relative group">
              <input 
                type="email" 
                placeholder="Enter your email address..." 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={subscribeStatus !== 'idle'}
                required
                aria-label="Email Address"
                className="w-full bg-[#0A0F24]/50 border border-white/10 rounded-2xl pl-5 pr-[130px] py-4 text-sm text-white placeholder-slate-500 outline-none transition-all focus:border-blue-500 focus:bg-white/5 focus:shadow-[0_0_15px_rgba(59,130,246,0.1)] disabled:opacity-50"
              />
              <button 
                type="submit" 
                disabled={subscribeStatus !== 'idle'}
                aria-label="Subscribe"
                className="absolute right-2 top-2 bottom-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-5 rounded-xl transition-all text-sm tracking-wide shadow-lg hover:shadow-blue-500/25 active:scale-95 disabled:opacity-80 flex items-center justify-center gap-2 min-w-[110px]"
              >
                {subscribeStatus === 'submitting' ? (
                  <span className="animate-pulse">Sending...</span>
                ) : subscribeStatus === 'success' ? (
                  <><CheckCircle2 className="w-4 h-4"/> Done!</>
                ) : (
                  <>Subscribe <ArrowRight className="w-4 h-4 group-focus-within:translate-x-1 transition-transform"/></>
                )}
              </button>
            </form>
            <p className="text-[11px] text-slate-500 mt-3 flex items-center justify-center md:justify-start gap-1.5 ml-2">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500/80"/> We respect your privacy. No spam.
            </p>
          </div>
        </div>

        {/* --- Bottom Bar --- */}
        <div className="pt-6 md:pt-8 border-t border-slate-800/80 flex flex-col md:flex-row justify-between items-center gap-6">
          
          <p className="text-[13px] text-slate-500/80 text-center md:text-left">
            © {new Date().getFullYear()} GyanHub Pvt. Ltd. All rights reserved. 
            <Link href="https://www.gyanhub.com.np" className="text-slate-400 hover:text-blue-400 transition-colors ml-1 border-b border-transparent hover:border-blue-400">
              www.gyanhub.com.np
            </Link>
          </p>
          
          {/* Modified Payment Badge to fit dark theme */}
          <div className="group flex items-center gap-3 bg-white/5 hover:bg-white/10 px-4 py-2.5 rounded-xl border border-white/5 transition-all duration-300">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 group-hover:text-slate-300 transition-colors">We Accept</span>
            <div className="h-3 w-[1px] bg-slate-700"></div>
            <div className="flex items-center justify-center">
              <img 
                src="https://zuktarghyexwodqnnxlu.supabase.co/storage/v1/object/public/others/fonepay_payments_fatafat.png" 
                alt="Fonepay" 
                className="h-4 w-auto object-contain opacity-60 group-hover:opacity-100 transition-opacity duration-300" 
                loading="lazy"
              />
            </div>
          </div>
        </div>

      </div>

      {/* Softened Scroll to Top Button */}
      <button 
        onClick={scrollToTop}
        className="absolute top-8 right-6 md:right-8 h-10 w-10 bg-white/5 hover:bg-blue-600 text-slate-400 hover:text-white rounded-xl flex items-center justify-center shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-blue-500/20 border border-white/5 hover:border-blue-500 z-10 group"
        aria-label="Scroll to top"
      >
        <ChevronUp className="h-4 w-4 stroke-[2] group-hover:animate-bounce" />
      </button>
      
    </footer>
  );
}