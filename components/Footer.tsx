'use client';

import Link from "next/link";
import { useState } from "react";
import { 
  Facebook, 
  Youtube, 
  Instagram, 
  Linkedin, 
  Mail, 
  ChevronUp,
  MessageCircle
} from "lucide-react";

export default function Footer() {
  const [email, setEmail] = useState('');

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Subscribed:', email);
    setEmail('');
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="relative bg-[#0A0F24] text-slate-300 pt-20 pb-10 border-t border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Grid Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8 mb-20">
          
          {/* Brand & Socials */}
          <div className="space-y-7 pr-4">
            {/* 1. Scaled Down Logo */}
            <Link href="/" className="inline-block text-2xl font-black tracking-tight transition-transform hover:scale-105">
              <span className="text-blue-500">Gyan</span>
              <span className="text-orange-500">Hub</span>
            </Link>
            
            {/* 2. Brightened Body Text */}
            <p className="text-[14px] leading-relaxed text-slate-300 max-w-xs font-medium">
              Dive into educational stories, level up your skills, and connect with a community that never stops growing.
            </p>
            
            {/* 3. Social Icons */}
            <div className="flex flex-wrap gap-2.5 pt-2">
              <a href="https://www.facebook.com/profile.php?id=61569757534336" target="_blank" rel="noreferrer" className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-slate-300 hover:bg-blue-600 hover:text-white transition-all hover:-translate-y-1">
                <Facebook className="h-[18px] w-[18px]" />
              </a>
              <a href="https://www.youtube.com/@GyanHubOnline" target="_blank" rel="noreferrer" className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-slate-300 hover:bg-red-600 hover:text-white transition-all hover:-translate-y-1">
                <Youtube className="h-[18px] w-[18px]" />
              </a>
              <a href="https://www.instagram.com/gyanhubonline/?next=%2F" target="_blank" rel="noreferrer" className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-slate-300 hover:bg-pink-600 hover:text-white transition-all hover:-translate-y-1">
                <Instagram className="h-[18px] w-[18px]" />
              </a>
              <a href="https://www.linkedin.com/company/gyanhub/" target="_blank" rel="noreferrer" className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-slate-300 hover:bg-blue-500 hover:text-white transition-all hover:-translate-y-1">
                <Linkedin className="h-[18px] w-[18px]" />
              </a>
              <a href="https://www.tiktok.com/@gyanhubofficial" target="_blank" rel="noreferrer" className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-slate-300 hover:bg-black hover:text-white transition-all hover:-translate-y-1">
                <svg className="h-[16px] w-[16px] fill-current" viewBox="0 0 24 24">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
                </svg>
              </a>
              <a href="https://wa.me/9763695665" target="_blank" rel="noreferrer" className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-slate-300 hover:bg-green-500 hover:text-white transition-all hover:-translate-y-1">
                <MessageCircle className="h-[18px] w-[18px]" />
              </a>
            </div>
          </div>

          {/* Company Links */}
          <div>
            <h3 className="text-[12px] font-black uppercase tracking-[0.15em] text-white mb-7">Company</h3>
            <ul className="space-y-5 text-[14px] font-medium text-slate-300">
              <li><Link href="/about" className="hover:text-blue-400 hover:translate-x-1 inline-block transition-transform">About GyanHub</Link></li>
              <li><Link href="/stories" className="hover:text-blue-400 hover:translate-x-1 inline-block transition-transform">GyanHub Stories</Link></li>
              <li><Link href="/privacy-policy" className="hover:text-blue-400 hover:translate-x-1 inline-block transition-transform">User's data policy</Link></li>
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h3 className="text-[12px] font-black uppercase tracking-[0.15em] text-white mb-7">admin</h3>
            <ul className="space-y-5 text-[14px] font-medium text-slate-300">
              <li><Link href="/contact" className="hover:text-blue-400 hover:translate-x-1 inline-block transition-transform">Contact Us</Link></li>
              <li><Link href="/faqs" className="hover:text-blue-400 hover:translate-x-1 inline-block transition-transform">FAQs</Link></li>
              <li><Link href="/refund" className="hover:text-blue-400 hover:translate-x-1 inline-block transition-transform">Refund & Return Policy</Link></li>
              <li className="pt-2">
                <a href="mailto:admin@gyanhub.com" className="flex items-center gap-2.5 text-blue-400 hover:text-blue-300 transition-colors group">
                  <div className="bg-blue-500/10 p-1.5 rounded-full group-hover:bg-blue-500/20 transition-colors">
                    <Mail className="h-3.5 w-3.5" />
                  </div>
                  admin@gyanhub.com
                </a>
              </li>
            </ul>
          </div>

          {/* Stay Updated & Newsletter */}
          <div>
            <h3 className="text-[12px] font-black uppercase tracking-[0.15em] text-white mb-7">Stay Updated</h3>
            
            <form onSubmit={handleSubscribe} className="relative max-w-sm">
              <input 
                type="email" 
                placeholder="Enter your email..." 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-white/5 border border-white/10 rounded-full pl-5 pr-[115px] py-3.5 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white/10 focus:ring-4 focus:ring-blue-500/10 transition-all"
              />
              <button 
                type="submit" 
                className="absolute right-1.5 top-1.5 bottom-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold px-5 rounded-full transition-all text-xs tracking-wide shadow-lg hover:shadow-blue-500/25 active:scale-95"
              >
                Subscribe
              </button>
            </form>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-slate-800/80 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-[13px] font-medium text-slate-500">
            © {new Date().getFullYear()} GyanHub Pvt. Ltd. All rights reserved. <Link href="https://www.gyanhub.com.np" className="hover:text-blue-400 transition-colors ml-1">www.gyanhub.com.np</Link>
          </p>
          
          {/* UPDATED: Whiteblue transparent card with black text based on user request */}
          <div className="flex items-center gap-3.5 bg-blue-50/70 backdrop-blur-sm px-6 py-3 rounded-2xl border border-blue-100/50 shadow-lg">
            <span className="text-[12px] font-black uppercase tracking-widest text-black">We Accept</span>
            {/* Logo container - backdrop is now light, so no extra background needed around logo */}
            <div className="flex items-center justify-center">
              <img 
                src="https://zuktarghyexwodqnnxlu.supabase.co/storage/v1/object/public/others/fonepay_payments_fatafat.png" 
                alt="Fonepay" 
                className="h-5 w-auto object-contain" 
                loading="lazy"
              />
            </div>
          </div>
        </div>

      </div>

      <button 
        onClick={scrollToTop}
        className="absolute bottom-10 right-6 md:right-10 h-12 w-12 bg-blue-600 hover:bg-blue-500 text-white rounded-full flex items-center justify-center shadow-[0_8px_30px_rgba(37,99,235,0.3)] transition-all hover:-translate-y-1.5 active:translate-y-0 z-10 border border-blue-400/20"
        aria-label="Scroll to top"
      >
        <ChevronUp className="h-5 w-5 stroke-[2.5]" />
      </button>
    </footer>
  );
}