'use client';

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from '@/lib/supabase';
import { 
  Facebook, Youtube, Instagram, Linkedin, 
  Mail, ChevronUp, MessageCircle, ShieldCheck, CheckCircle2,
  ArrowRight, Lock, MapPin, BookOpen, PlayCircle, BadgeCheck,
  Package, AlertCircle
} from "lucide-react";

// --- CANONICAL LOCATION LINK (single source of truth — match this everywhere else on the site) ---
const MAPS_URL = "https://maps.app.goo.gl/5ejsLX3YUsPtJjgQ9";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// --- DATA ARRAYS ---
const SOCIAL_LINKS = [
  { icon: Facebook, href: "https://www.facebook.com/dashboard.php?id=61569757534336", label: "Facebook", hoverColor: "hover:bg-[#1877F2]" },
  { icon: Youtube, href: "https://www.youtube.com/@GyanHubOnline", label: "YouTube", hoverColor: "hover:bg-[#FF0000]" },
  { icon: Instagram, href: "https://www.instagram.com/gyanhubonline/?next=%2F", label: "Instagram", hoverColor: "hover:bg-[#E4405F]" },
  { icon: Linkedin, href: "https://www.linkedin.com/company/gyanhub/", label: "LinkedIn", hoverColor: "hover:bg-[#0A66C2]" },
  { icon: MessageCircle, href: "https://wa.me/9763695665", label: "WhatsApp", hoverColor: "hover:bg-[#25D366]" },
];

const COMPANY_LINKS = [
  { label: "About GyanHub", href: "/company/about" },
  { label: "GyanHub Stories", href: "/stories", isLocked: true }, // Coming soon — see inline badge, no alert()
  { label: "User's Data Policy", href: "/company/privacy-policy" },
  { label: "Terms & Conditions", href: "/company/terms" },
];

// Cross-links the site's two flagship conversion paths (Certificate Verification + Bundles)
// alongside the existing course-format links. Placed first in the grid — see column-order note below.
const OUR_PROGRAMS = [
  { label: "Online Courses", href: "/onlinecourse", icon: BookOpen },
  { label: "Physical Classes", href: "/offline-class", icon: MapPin },
  { label: "Recording Courses", href: "/recording", icon: PlayCircle },
  { label: "Career-Ready Bundles", href: "/#bundles-section", icon: Package },
  { label: "Verify a Certificate", href: "/certificate", icon: BadgeCheck },
];

const ADMIN_LINKS = [
  { label: "Contact Us", href: "/company/contact" },
  { label: "FAQs", href: "/company/faqs" },
  { label: "Refund & Return Policy", href: "/company/refund" },
];

// Organization structured data — reuses the same handles/address already rendered below.
const ORG_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "GyanHub Pvt. Ltd.",
  "url": "https://www.gyanhub.com.np",
  "email": "admin@gyanhub.com",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "Near Eyeplex Mall, New Baneshwor",
    "addressLocality": "Kathmandu",
    "addressCountry": "NP",
  },
  "sameAs": [
    "https://www.facebook.com/dashboard.php?id=61569757534336",
    "https://www.youtube.com/@GyanHubOnline",
    "https://www.instagram.com/gyanhubonline/",
    "https://www.linkedin.com/company/gyanhub/",
    "https://www.tiktok.com/@gyanhubofficial",
  ],
};

export default function Footer() {
  const [email, setEmail] = useState('');
  const [subscribeStatus, setSubscribeStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [subscribeError, setSubscribeError] = useState<string | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Scroll-to-top button becomes usable anywhere on the page, not just once the footer is in view.
  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 480);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) return;

    // Client-side format check — routes through the same inline error UI as the
    // server-failure path below, instead of relying on the browser's native tooltip.
    if (!EMAIL_REGEX.test(cleanEmail)) {
      setSubscribeError("Enter a valid email address.");
      setSubscribeStatus('error');
      setTimeout(() => {
        setSubscribeStatus('idle');
        setSubscribeError(null);
      }, 4000);
      return;
    }

    setSubscribeStatus('submitting');
    setSubscribeError(null);

    try {
      const { error } = await supabase
        .from('newsletter_subscribers')
        .insert([{ email: cleanEmail }]);

      // Gracefully handle unique constraint violation if already subscribed
      if (error && error.code !== '23505') {
        throw error;
      }

      setSubscribeStatus('success');
      setEmail('');
      setTimeout(() => setSubscribeStatus('idle'), 3000);
    } catch (err: any) {
      console.error("Newsletter Error:", err.message);
      setSubscribeError("Couldn't subscribe right now. Please try again.");
      setSubscribeStatus('error');
      setTimeout(() => {
        setSubscribeStatus('idle');
        setSubscribeError(null);
      }, 4000);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="relative bg-[#0A0F24] bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-900/10 via-[#0A0F24] to-[#0A0F24] text-slate-400 pt-16 md:pt-24 pb-8 md:pb-12 border-t border-slate-800 overflow-hidden font-sans">

      {/* Organization structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ORG_JSON_LD) }}
      />

      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        
        {/* Top Grid Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-10 mb-12 md:mb-20">
          
          {/* --- Brand, Socials & Location Column --- */}
          <div className="space-y-6 sm:col-span-2 lg:col-span-2 pr-4 lg:pr-12">
            
            <Link href="/" className="inline-flex items-center gap-2 text-3xl font-black tracking-tight transition-transform hover:scale-105 outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded-lg">
              <div className="drop-shadow-[0_0_15px_rgba(37,99,235,0.3)]">
                <span className="text-blue-600">Gyan</span>
                <span className="text-orange-500">Hub</span>
              </div>
              <span className="relative flex h-2 w-2 mt-1">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </Link>
            
            <p className="text-[15px] leading-relaxed text-slate-400">
              Nepal's premier engineering education platform offering expert-led courses, hands-on practical training, and career-ready skills for the modern workforce.
            </p>
            
            {/* Physical Location — emerald icon matches the site's "physical / location" category color, same canonical link used everywhere */}
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-emerald-500" />
                Physical Classes
              </h4>
              <a 
                href={MAPS_URL}
                target="_blank" 
                rel="noreferrer"
                className="text-[14px] text-slate-400 hover:text-blue-400 transition-colors block"
              >
                Near Eyeplex Mall, New Baneshwor, Kathmandu
              </a>
            </div>
            
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

          {/* --- Our Programs Column — moved ahead of Company: action-oriented links deserve
               the higher-intent position over About/Privacy for a conversion-focused footer --- */}
          <div>
            <h3 className="text-[13px] font-semibold uppercase tracking-[0.15em] text-slate-200 mb-5">Our Programs</h3>
            <ul className="space-y-3 text-[14px] text-slate-400">
              {OUR_PROGRAMS.map(link => {
                const Icon = link.icon;
                return (
                  <li key={link.label}>
                    <Link href={link.href} className="group relative inline-flex items-center gap-2 hover:text-white transition-colors">
                      {Icon && <Icon className="h-3.5 w-3.5 text-slate-500 group-hover:text-blue-400 transition-colors" />}
                      {link.label}
                      <span className="absolute -bottom-1 left-0 w-0 h-[2px] bg-blue-600 transition-all duration-300 group-hover:w-full"></span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* --- Company Links Column --- */}
          <div>
            <h3 className="text-[13px] font-semibold uppercase tracking-[0.15em] text-slate-200 mb-5">Company</h3>
            <ul className="space-y-3 text-[14px] text-slate-400">
              {COMPANY_LINKS.map(link => (
                <li key={link.label}>
                  {(link as any).isLocked ? (
                    // Static "coming soon" indicator — no click needed, no alert() interruption.
                    <span
                      className="group relative inline-flex items-center text-slate-500 cursor-default"
                      title="Coming soon"
                    >
                      {link.label}
                      <span className="ml-2 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-slate-500 bg-white/5 border border-white/10 rounded-full px-2 py-0.5">
                        <Lock className="w-2.5 h-2.5" /> Soon
                      </span>
                    </span>
                  ) : (
                    <Link href={link.href} className="group relative inline-flex items-center hover:text-white transition-colors">
                      {link.label}
                      <span className="absolute -bottom-1 left-0 w-0 h-[2px] bg-blue-600 transition-all duration-300 group-hover:w-full"></span>
                    </Link>
                  )}
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
                    <span className="absolute -bottom-1 left-0 w-0 h-[2px] bg-blue-600 transition-all duration-300 group-hover:w-full"></span>
                  </Link>
                </li>
              ))}
              <li className="pt-2">
                <a href="mailto:admin@gyanhub.com" className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors group p-1.5 -ml-1.5 rounded-lg hover:bg-blue-600/10">
                  <div className="bg-blue-600/10 p-1.5 rounded-full group-hover:bg-blue-600/20 transition-colors">
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
            {/* Stacks input + button vertically on very narrow phones (below sm) so the
                absolute-positioned button never crowds/clips the placeholder text;
                reverts to the inline pill layout from sm upward. */}
            <form onSubmit={handleSubscribe} className="relative group flex flex-col sm:block gap-2 sm:gap-0">
              <input 
                type="email" 
                placeholder="Enter your email address..." 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={subscribeStatus === 'submitting'}
                required
                aria-label="Email Address"
                aria-invalid={subscribeStatus === 'error'}
                className={`w-full bg-[#0A0F24]/50 border rounded-2xl pl-5 pr-5 sm:pr-[130px] py-4 text-sm text-white placeholder-slate-500 outline-none transition-all focus:bg-white/5 disabled:opacity-50 ${
                  subscribeStatus === 'error'
                    ? 'border-red-500/60 focus:border-red-500'
                    : 'border-white/10 focus:border-blue-600 focus:shadow-[0_0_15px_rgba(37,99,235,0.1)]'
                }`}
              />
              <button 
                type="submit" 
                disabled={subscribeStatus === 'submitting'}
                aria-label="Subscribe"
                className="w-full sm:w-auto sm:absolute sm:right-2 sm:top-2 sm:bottom-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-5 py-3.5 sm:py-0 rounded-xl transition-all text-sm tracking-wide shadow-lg hover:shadow-blue-600/25 active:scale-95 disabled:opacity-80 flex items-center justify-center gap-2 sm:min-w-[110px]"
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
            <p aria-live="polite" className="min-h-[1.25rem]">
              {subscribeStatus === 'error' && subscribeError ? (
                <span className="text-[11px] text-red-400 mt-3 flex items-center justify-center md:justify-start gap-1.5 ml-2">
                  <AlertCircle className="w-3.5 h-3.5"/> {subscribeError}
                </span>
              ) : (
                <span className="text-[11px] text-slate-500 mt-3 flex items-center justify-center md:justify-start gap-1.5 ml-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500/80"/> We respect your privacy. No spam.
                </span>
              )}
            </p>
          </div>
        </div>

        {/* --- Bottom Bar --- */}
        <div className="pt-6 md:pt-8 border-t border-slate-800/80 flex flex-col md:flex-row justify-between items-center gap-6">
          
          <p className="text-[13px] text-slate-500/80 text-center md:text-left">
            © {new Date().getFullYear()} GyanHub Pvt. Ltd. All rights reserved. 
            <a
              href="https://www.gyanhub.com.np"
              target="_blank"
              rel="noreferrer"
              className="text-slate-400 hover:text-blue-400 transition-colors ml-1 border-b border-transparent hover:border-blue-400"
            >
              www.gyanhub.com.np
            </a>
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            {/* Trust badge — reinforces the homepage's certificate-verification story one more time before exit */}
            <Link
              href="/certificate"
              className="group flex items-center gap-2 bg-emerald-500/10 hover:bg-emerald-500/20 px-4 py-2.5 rounded-xl border border-emerald-500/20 transition-all duration-300"
            >
              <BadgeCheck className="h-4 w-4 text-emerald-400" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-300 group-hover:text-emerald-200 transition-colors">2,400+ Certified</span>
            </Link>

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

      </div>

      {/* Scroll to Top — fixed to viewport, appears once the user has actually scrolled */}
      {showScrollTop && (
        <button 
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 h-12 w-12 bg-white/10 hover:bg-blue-600 text-slate-200 hover:text-white rounded-xl flex items-center justify-center shadow-lg backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:shadow-blue-600/20 border border-white/10 hover:border-blue-600 z-40 group"
          aria-label="Scroll to top"
        >
          <ChevronUp className="h-5 w-5 stroke-[2] group-hover:animate-bounce" />
        </button>
      )}
      
    </footer>
  );
}