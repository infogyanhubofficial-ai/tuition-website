"use client";

import React, { useState, useEffect, useRef } from 'react';
import {
  Lock, SearchX, Send, MessageCircle, Copy, Check, MapPin, Mail, Phone,
  Clock, ChevronRight, ChevronDown, BookOpen, GraduationCap, Briefcase,
  ExternalLink, Navigation, Users, HelpCircle, Video, CreditCard, X
} from 'lucide-react';
import { createClient } from "@/lib/supabase/client";

// --- BRAND ---
const NAVY = '#12203D';
const ORANGE = '#F2711C';

// --- TYPES ---
interface ChatMessage {
  id: string;
  user_id: string;
  sender_role: 'user' | 'admin' | 'student' | 'tutor';
  content: string;
  created_at: string;
}

// --- HELPERS ---
function useNepalOpenStatus() {
  const [status, setStatus] = useState<{ open: boolean; label: string }>({ open: false, label: '' });

  useEffect(() => {
    const compute = () => {
      // Nepal Standard Time is UTC+5:45
      const now = new Date();
      const utc = now.getTime() + now.getTimezoneOffset() * 60000;
      const npt = new Date(utc + (5 * 60 + 45) * 60000);
      const day = npt.getDay(); // 0 Sun ... 6 Sat
      const hour = npt.getHours();
      const isSaturday = day === 6;
      const withinHours = hour >= 9 && hour < 18;
      const open = !isSaturday && withinHours;
      setStatus({
        open,
        label: open ? 'Open now' : isSaturday ? 'Closed today (Saturday)' : withinHours ? 'Open now' : 'Closed — back at 9 AM'
      });
    };
    compute();
    const id = setInterval(compute, 60000);
    return () => clearInterval(id);
  }, []);

  return status;
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          /* clipboard unavailable */
        }
      }}
      className="inline-flex items-center justify-center w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
      aria-label="Copy to clipboard"
    >
      {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
    </button>
  );
}

// --- QUICK ACTION CARDS ---
function QuickActionCards({ onBookConsultation }: { onBookConsultation: () => void }) {
  const cardClass = "bg-white rounded-2xl shadow-lg shadow-slate-900/5 border border-slate-100 p-5 flex flex-col items-start gap-3 hover:-translate-y-1 hover:shadow-xl transition-all duration-200 text-left w-full";

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto -mt-10 relative z-10 px-4 sm:px-0">
      {/* Explore Courses — up/down dropdown. Recordings excluded here since it has its own card + KPI below. */}
      <details className="group relative">
        <summary className={`${cardClass} list-none cursor-pointer [&::-webkit-details-marker]:hidden`}>
          <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${ORANGE}1A`, color: ORANGE }}>
            <BookOpen size={20} />
          </div>
          <div className="flex items-start justify-between w-full gap-2">
            <div>
              <p className="font-bold text-sm" style={{ color: NAVY }}>Explore Courses</p>
              <p className="text-xs text-slate-500 mt-0.5 leading-snug">Live & physical classes</p>
            </div>
            <ChevronDown size={16} className="text-slate-400 mt-1 shrink-0 transition-transform group-open:rotate-180" />
          </div>
        </summary>
        <div className="absolute left-0 right-0 z-20 mt-2 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl">
          <a href="/onlinecourse" className="block px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
            Online Classes
          </a>
          <a href="/offline-class" className="block px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
            Physical Classes
          </a>
        </div>
      </details>

      {/* Recorded Courses — its own card, own page & KPI */}
      <a href="/recording" className={cardClass}>
        <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${ORANGE}1A`, color: ORANGE }}>
          <Video size={20} />
        </div>
        <div>
          <p className="font-bold text-sm" style={{ color: NAVY }}>Recorded Courses</p>
          <p className="text-xs text-slate-500 mt-0.5 leading-snug">Learn anytime, at your pace</p>
        </div>
      </a>

      {/* Book a Consultation — opens a mini form instead of navigating away */}
      <button type="button" onClick={onBookConsultation} className={cardClass}>
        <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${ORANGE}1A`, color: ORANGE }}>
          <GraduationCap size={20} />
        </div>
        <div>
          <p className="font-bold text-sm" style={{ color: NAVY }}>Book a Consultation</p>
          <p className="text-xs text-slate-500 mt-0.5 leading-snug">Talk to an training consultant</p>
        </div>
      </button>

      {/* WhatsApp */}
      <a href="https://wa.me/9779763695665" target="_blank" rel="noopener noreferrer" className={cardClass}>
        <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${ORANGE}1A`, color: ORANGE }}>
          <MessageCircle size={20} />
        </div>
        <div>
          <p className="font-bold text-sm" style={{ color: NAVY }}>WhatsApp Us</p>
          <p className="text-xs text-slate-500 mt-0.5 leading-snug">Fastest way to reach us</p>
        </div>
      </a>
    </div>
  );
}

// --- TRUST STATS ---
function TrustStats() {
  const stats = [
    { value: '2,400+', label: 'Learners Trained' },
    { value: '15+', label: 'Professional Programs' },
    { value: '100+', label: 'Live Sessions Monthly' },
    { value: '<24h', label: 'Response Time' },
  ];
  return (
    <section className="py-14" style={{ backgroundColor: NAVY }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 sm:grid-cols-4 gap-8 text-center">
        {stats.map((s) => (
          <div key={s.label}>
            <p className="text-3xl sm:text-4xl font-black" style={{ color: ORANGE }}>{s.value}</p>
            <p className="text-slate-300 text-sm mt-1 font-medium">{s.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

// --- WHY CONTACT US ---
function WhyContactCards() {
  const cards = [
    { icon: GraduationCap, title: 'Admissions Guidance', desc: 'Need help selecting the right program for your goals?' },
    { icon: CreditCard, title: 'Course & Payments Support', desc: 'Questions about enrollment, payments, or certificates?' },
    { icon: HelpCircle, title: 'Technical Support', desc: 'Need help accessing your learning portal or account?' },
    { icon: Briefcase, title: 'Business Partnerships', desc: 'Explore collaboration opportunities with GyanHub.' },
  ];
  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h2 className="text-2xl sm:text-3xl font-black text-center mb-10" style={{ color: NAVY }}>Why Contact GyanHub?</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map(({ icon: Icon, title, desc }) => (
          <div key={title} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 hover:shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-4" style={{ backgroundColor: `${NAVY}0D`, color: NAVY }}>
              <Icon size={20} />
            </div>
            <h3 className="font-bold text-slate-900 mb-1">{title}</h3>
            <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

// --- CONTACT (LEAD) FORM — reused for general inquiries and consultation requests ---
function ContactForm({
  title = 'Send Us a Message',
  subtitle = "Prefer not to sign in? Fill this out and we'll get back to you — typically within 24 hours.",
  messagePlaceholder = 'How can we help? Admissions, courses, payments, certificates...',
  submitLabel = 'Submit Inquiry',
  successTitle = 'Message received',
  successBody = 'Thanks for reaching out. Our team typically replies within 24 hours.',
  tag = '',
  onSuccess,
}: {
  title?: string;
  subtitle?: string;
  messagePlaceholder?: string;
  submitLabel?: string;
  successTitle?: string;
  successBody?: string;
  tag?: string;
  onSuccess?: () => void;
}) {
  const supabase = createClient();
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' });
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) return;
    setStatus('sending');
    try {
      const { error } = await supabase.from('contact_inquiries').insert([{
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || null,
        message: `${tag}${form.message.trim()}`,
      }]);
      if (error) throw error;
      setStatus('sent');
      setForm({ name: '', email: '', phone: '', message: '' });
      onSuccess?.();
    } catch (err) {
      console.error('Error submitting inquiry:', err);
      setStatus('error');
    }
  };

  if (status === 'sent') {
    return (
      <div className="bg-white rounded-[28px] shadow-lg border border-slate-100 p-10 h-full flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mb-5" style={{ backgroundColor: '#DCFCE7', color: '#16A34A' }}>
          <Check size={28} />
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-2">{successTitle}</h3>
        <p className="text-slate-500 text-sm max-w-xs">
          {successBody}
        </p>
        <button
          onClick={() => setStatus('idle')}
          className="mt-6 text-sm font-bold"
          style={{ color: ORANGE }}
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[28px] shadow-lg border border-slate-100 p-8 h-full flex flex-col">
      <h3 className="text-xl font-bold flex items-center gap-2" style={{ color: NAVY }}>
        <MessageCircle size={20} /> {title}
      </h3>
      <p className="text-sm text-slate-500 mt-1 mb-6">
        {subtitle}
      </p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 flex-grow">
        <input
          type="text"
          required
          placeholder="Full name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="w-full border border-slate-200 focus:border-slate-400 rounded-xl px-4 py-3 text-sm outline-none transition-colors"
        />
        <input
          type="email"
          required
          placeholder="Email address"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="w-full border border-slate-200 focus:border-slate-400 rounded-xl px-4 py-3 text-sm outline-none transition-colors"
        />
        <input
          type="tel"
          placeholder="Phone"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          className="w-full border border-slate-200 focus:border-slate-400 rounded-xl px-4 py-3 text-sm outline-none transition-colors"
        />
        <textarea
          required
          placeholder={messagePlaceholder}
          rows={4}
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
          className="w-full border border-slate-200 focus:border-slate-400 rounded-xl px-4 py-3 text-sm outline-none transition-colors resize-none flex-grow"
        />
        {status === 'error' && (
          <p className="text-xs text-red-500 font-medium">Something went wrong. Please try again or WhatsApp us.</p>
        )}
        <button
          type="submit"
          disabled={status === 'sending'}
          className="w-full text-white font-bold py-3.5 rounded-xl transition-all disabled:opacity-60"
          style={{ backgroundColor: ORANGE }}
        >
          {status === 'sending' ? 'Sending...' : submitLabel}
        </button>
      </form>
    </div>
  );
}

// --- MODAL WRAPPER (used for the Book a Consultation mini form) ---
function Modal({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md">
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute -top-3 -right-3 z-10 w-9 h-9 rounded-full bg-white shadow-lg flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors"
        >
          <X size={18} />
        </button>
        {children}
      </div>
    </div>
  );
}

// --- CHATBOX COMPONENT ---
function ChatBox({ userId, userName, isTutor }: { userId: string | null, userName: string, isTutor: boolean }) {
  const supabase = createClient();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [showTyping, setShowTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const themeBorder = isTutor ? 'border-green-200 focus:border-green-500 focus:ring-green-100' : 'border-slate-200 focus:ring-orange-100';
  const userMsgClass = isTutor ? 'bg-green-50 text-green-800 border border-green-100' : 'bg-orange-50 text-slate-800 border border-orange-100';

  useEffect(() => {
    if (!userId) return;
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

      if (!error && data) {
        setMessages(data as ChatMessage[]);
      }
      setLoading(false);
    };

    fetchMessages();

    const subscription = supabase
      .channel('public:messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, payload => {
        const newMsg = payload.new as ChatMessage;
        if (newMsg.user_id === userId) {
          setMessages(prev => [...prev, newMsg]);
          if (newMsg.sender_role === 'admin') setShowTyping(false);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(subscription); };
  }, [userId]);

  useEffect(() => {
    if (messagesEndRef.current && messagesEndRef.current.parentElement) {
      const container = messagesEndRef.current.parentElement;
      container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
    }
  }, [messages, showTyping]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !userId) return;

    const currentRole = isTutor ? 'tutor' : 'student';
    const msgData = {
      user_id: userId,
      sender_role: currentRole,
      content: newMessage.trim(),
    };

    setNewMessage('');
    const { error } = await supabase.from('messages').insert([msgData]);
    if (error) {
      console.error("Error sending message:", error);
    } else {
      // Lightweight typing indicator to signal the support team will respond
      setShowTyping(true);
      setTimeout(() => setShowTyping(false), 6000);
    }
  };

  return (
    <div id="chatbox-section" className="bg-white/70 backdrop-blur-md border border-slate-200/60 shadow-lg rounded-[32px] flex flex-col h-[500px] overflow-hidden scroll-mt-32 w-full">
      <div className="p-6 border-b border-slate-200/50 bg-white/50 backdrop-blur-sm">
        <h3 className="text-xl font-black tracking-tight flex items-center gap-2" style={{ color: NAVY }}>
          <MessageCircle size={20} /> Student Support Center
        </h3>
        <p className="text-sm text-slate-500 font-medium mt-0.5">
          Ask about admissions, classes, payments, or certificates.
        </p>
        <p className="text-xs text-slate-400 font-medium mt-1">Typically replies within a few hours</p>
      </div>

      <div className="flex-grow p-6 overflow-y-auto flex flex-col gap-4 bg-slate-50/50 custom-scrollbar">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-500 rounded-full animate-spin"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 text-center px-6">
            <SearchX size={40} className="mb-3 opacity-50" />
            <p className="text-sm font-bold text-slate-500">Start a conversation with our support team.</p>
            <p className="text-xs mt-1">We&apos;re here to help with admissions, courses, payments, and certificates.</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isAdmin = msg.sender_role === 'admin';
            return (
              <div key={msg.id} className={`flex flex-col ${isAdmin ? 'items-start' : 'items-end'}`}>
                <span className="text-[10px] text-slate-400 font-bold mb-1 px-1 opacity-80">
                  {isAdmin ? 'GyanHub Support' : `${isTutor ? 'Tutor' : 'You'} · ${userName}`}
                </span>
                <div className={`max-w-[80%] rounded-2xl p-4 text-sm font-medium shadow-sm ${isAdmin ? 'bg-white text-slate-800 border border-slate-100 rounded-tl-none' : `${userMsgClass} rounded-tr-none`}`}>
                  {msg.content}
                </div>
              </div>
            );
          })
        )}
        {showTyping && (
          <div className="flex flex-col items-start">
            <span className="text-[10px] text-slate-400 font-bold mb-1 px-1 opacity-80">GyanHub Support</span>
            <div className="bg-white border border-slate-100 rounded-2xl rounded-tl-none px-4 py-3 flex gap-1 items-center">
              <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
              <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
              <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce"></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage} className="p-4 bg-white/50 backdrop-blur-sm border-t border-slate-200/50 flex gap-3">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type your message..."
          className={`flex-grow bg-white border ${themeBorder} focus:ring-4 rounded-xl px-4 py-3 text-sm font-medium outline-none transition-all shadow-inner`}
        />
        <button
          type="submit"
          disabled={!newMessage.trim()}
          className="text-white p-3 rounded-xl shadow-[0_4px_15px_rgba(0,0,0,0.1)] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          style={{ backgroundColor: isTutor ? '#16A34A' : ORANGE }}
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}

// --- MAIN PAGE COMPONENT ---
export default function ContactPage() {
  const supabase = createClient();
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>('User');
  const [isTutor, setIsTutor] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [showConsultation, setShowConsultation] = useState(false);
  const officeStatus = useNepalOpenStatus();

  const OFFICE_ADDRESS = 'New Baneshwor (Near Eyeplex Mall), Kathmandu, Nepal';
  // Exact coordinates resolved from https://maps.app.goo.gl/GXcMpBFLjnPFyij8A (Gyan Hub Pvt. Ltd.)
  const MAP_LAT = 27.6920528;
  const MAP_LNG = 85.3362545;
  const MAP_EMBED_SRC = `https://www.google.com/maps?q=${MAP_LAT},${MAP_LNG}(Gyan+Hub+Pvt.+Ltd)&z=17&output=embed`;
  const DIRECTIONS_URL = 'https://maps.app.goo.gl/GXcMpBFLjnPFyij8A';
  const EMAIL = 'admin@gyanhub.com.np';
  const PHONE_DISPLAY = '+977 9763695665';
  const PHONE_TEL = '+9779763695665';
  const WHATSAPP_URL = `https://wa.me/9779763695665`;

  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data, error } = await supabase.auth.getUser();
        if (data?.user) {
          setIsSignedIn(true);
          setUserId(data.user.id);
          setUserName(data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || 'User');

          const { data: tutorProfile } = await supabase.from('tutors').select('id').eq('user_id', data.user.id).maybeSingle();
          if (tutorProfile) {
            setIsTutor(true);
          }
        }
      } catch (err) {
        console.error("Auth check failed:", err);
      } finally {
        setAuthLoading(false);
      }
    };
    initAuth();
  }, [supabase.auth, supabase]);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}</style>

      {/* 1. Hero */}
      <section className="pb-24 pt-16 px-4 sm:px-6 lg:px-8 text-center" style={{ background: `linear-gradient(180deg, ${NAVY} 0%, #1c2f52 100%)` }}>
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-4 tracking-tight">
            Let&apos;s Build Your Future Together
          </h1>
          <p className="text-lg sm:text-xl text-slate-300 leading-relaxed">
            Whether you&apos;re looking to join a professional training program, attend classroom sessions,
            or learn online &mdash; our training consultants are ready to help you at every step of your
            learning journey.
          </p>
        </div>
      </section>

      {/* Quick Action Cards (overlapping hero) */}
      <QuickActionCards onBookConsultation={() => setShowConsultation(true)} />

      {/* Trust Statistics */}
      <div className="mt-14">
        <TrustStats />
      </div>

      {/* Main Content Layout */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8">

          {/* Left Column: Contact Info & Socials (5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-8">

            {/* Quick Contact Cards */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 flex flex-col gap-7">
              <h2 className="text-2xl font-bold border-b border-slate-100 pb-4" style={{ color: NAVY }}>
                Contact Information
              </h2>

              {/* Location Card */}
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-full shrink-0" style={{ backgroundColor: `${ORANGE}1A`, color: ORANGE }}>
                  <MapPin size={22} />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">Head Office</h3>
                  <p className="text-slate-600 mt-1">{OFFICE_ADDRESS}</p>
                  <p className="text-sm text-slate-500 mt-1">Walk-in consultation available</p>
                </div>
              </div>

              {/* Email Card */}
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-full shrink-0" style={{ backgroundColor: `${ORANGE}1A`, color: ORANGE }}>
                  <Mail size={22} />
                </div>
                <div className="flex-grow">
                  <h3 className="font-semibold text-slate-900">Email Us</h3>
                  <div className="flex items-center gap-1 mt-1">
                    <a href={`mailto:${EMAIL}`} className="text-slate-600 hover:text-slate-900 transition-colors">
                      {EMAIL}
                    </a>
                    <CopyButton value={EMAIL} />
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Replies within 24 hours · English & Nepali</p>
                </div>
              </div>

              {/* Phone Card */}
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-full shrink-0" style={{ backgroundColor: `${ORANGE}1A`, color: ORANGE }}>
                  <Phone size={22} />
                </div>
                <div className="flex-grow">
                  <h3 className="font-semibold text-slate-900">Call or WhatsApp</h3>
                  <div className="flex items-center gap-1 mt-1">
                    <a href={`tel:${PHONE_TEL}`} className="text-slate-600 hover:text-slate-900 transition-colors font-medium">
                      {PHONE_DISPLAY}
                    </a>
                    <CopyButton value={PHONE_DISPLAY} />
                    <a
                      href={WHATSAPP_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-2 inline-flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
                    >
                      WhatsApp
                    </a>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Admissions, enrollment, technical support & course info</p>
                </div>
              </div>

              {/* Business Hours Table */}
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-full shrink-0" style={{ backgroundColor: `${NAVY}0D`, color: NAVY }}>
                  <Clock size={22} />
                </div>
                <div className="flex-grow">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-slate-900">Office Hours</h3>
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${officeStatus.open ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                      {officeStatus.label}
                    </span>
                  </div>
                  <table className="w-full text-sm text-slate-600 mt-2">
                    <tbody>
                      <tr className="border-t border-slate-100">
                        <td className="py-1.5">Sunday – Friday</td>
                        <td className="py-1.5 text-right font-medium">9:00 AM – 6:00 PM</td>
                      </tr>
                      <tr className="border-t border-slate-100">
                        <td className="py-1.5">Saturday</td>
                        <td className="py-1.5 text-right font-medium text-red-500">Closed</td>
                      </tr>
                    </tbody>
                  </table>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                    For urgent payment or enrollment issues, message us on WhatsApp during business hours for faster assistance.
                  </p>
                </div>
              </div>
            </div>

            {/* Social Media Grid */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
              <div className="flex items-center gap-2 mb-1">
                <Users size={18} style={{ color: ORANGE }} />
                <h2 className="text-xl font-bold" style={{ color: NAVY }}>15K+ Learners Connected</h2>
              </div>
              <p className="text-sm text-slate-600 mb-6">
                Follow us for free learning resources, course launches, career tips, and scholarships.
              </p>

              <div className="flex flex-wrap gap-4">
                {[
                  { name: 'Facebook', href: 'https://www.facebook.com/dashboard.php?id=61569757534336', color: '#1877F2', path: 'M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z' },
                  { name: 'Instagram', href: 'https://www.instagram.com/gyanhubonline/?next=%2F', color: '#E4405F', path: 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z' },
                  { name: 'LinkedIn', href: 'https://www.linkedin.com/company/gyanhub/', color: '#0A66C2', path: 'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z' },
                  { name: 'TikTok', href: 'https://www.tiktok.com/@gyanhubofficial', color: '#000000', path: 'M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 2.78-1.15 5.54-3.33 7.39-2.26 1.93-5.32 2.65-8.22 2.1-2.92-.55-5.34-2.45-6.68-5.11-1.37-2.73-1.17-6.1.48-8.66 1.58-2.45 4.31-3.96 7.23-4.04v4.06c-1.63.13-3.2 1.05-4.04 2.45-.8 1.34-.84 3.09-.16 4.47.66 1.35 1.98 2.31 3.48 2.5 1.51.18 3.12-.23 4.23-1.26 1.18-1.1 1.72-2.74 1.66-4.36-.11-6.19-.04-12.38-.04-18.57h1.33z' },
                  { name: 'YouTube', href: 'https://www.youtube.com/@GyanHubOnline', color: '#FF0000', path: 'M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z' },
                ].map((s) => (
                  <a
                    key={s.name}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative w-12 h-12 flex items-center justify-center rounded-full bg-slate-100 transition-all duration-300"
                    style={{ color: s.color }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = s.color; e.currentTarget.style.color = '#fff'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = ''; e.currentTarget.style.color = s.color; }}
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d={s.path} /></svg>
                    <span className="absolute -bottom-7 left-1/2 -translate-x-1/2 text-[10px] font-bold text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      {s.name}
                    </span>
                  </a>
                ))}
              </div>
            </div>

            {/* FAQ Shortcut */}
            <a href="/company/faqs" className="flex items-center justify-between bg-white rounded-2xl shadow-sm border border-slate-100 p-6 hover:shadow-md transition-shadow group">
              <span className="font-bold text-slate-700">Still looking for answers? Read FAQs</span>
              <ChevronRight size={18} className="text-slate-400 group-hover:translate-x-1 transition-transform" />
            </a>
          </div>

          {/* Right Column: ChatBox / Contact Form (7 cols) */}
          <div className="lg:col-span-7 relative h-full min-h-[500px]">
            {authLoading ? (
              <div className="flex items-center justify-center h-full bg-slate-100/50 rounded-[32px] border border-slate-200">
                <div className="w-8 h-8 border-4 border-slate-200 rounded-full animate-spin" style={{ borderTopColor: ORANGE }}></div>
              </div>
            ) : isSignedIn ? (
              <ChatBox userId={userId} userName={userName} isTutor={isTutor} />
            ) : (
              <div className="flex flex-col gap-6 h-full">
                {/* Contact form is fully usable without signing in */}
                <ContactForm />

                {/* Optional: sign in for live chat */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: `${NAVY}0D`, color: NAVY }}>
                      <Lock size={18} />
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 text-sm">Personal Support Requires Login</p>
                      <p className="text-xs text-slate-500 mt-0.5">Your conversations stay secure and accessible only to you.</p>
                    </div>
                  </div>
                  <button
                    onClick={() => window.location.href = '/login'}
                    className="shrink-0 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-all"
                    style={{ backgroundColor: NAVY }}
                  >
                    Sign In
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Why Contact GyanHub */}
      <WhyContactCards />

      {/* Book a Consultation — standalone form, not just the modal */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden grid grid-cols-1 lg:grid-cols-2">
          <div className="p-10 sm:p-12 flex flex-col justify-center" style={{ backgroundColor: NAVY }}>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5" style={{ backgroundColor: `${ORANGE}1A`, color: ORANGE }}>
              <GraduationCap size={22} />
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white mb-3">Book a Free Consultation</h2>
            <p className="text-slate-300 leading-relaxed">
              Not sure which program fits your goals? Share a few details and one of our education
              advisors will reach out to walk you through your options.
            </p>
          </div>
          <div className="p-6 sm:p-8">
            <ContactForm
              title="Book a Consultation"
              subtitle="Tell us a bit about what you're looking for."
              messagePlaceholder="What are you hoping to learn or achieve?"
              submitLabel="Request Consultation"
              successTitle="Consultation requested"
              successBody="Thanks! An advisor will reach out shortly to schedule your call."
              tag="[Consultation Request] "
            />
          </div>
        </div>
      </section>

      {/* Book a Consultation — mini form modal, triggered from the quick action card above */}
      {showConsultation && (
        <Modal onClose={() => setShowConsultation(false)}>
          <ContactForm
            title="Book a Consultation"
            subtitle="Tell us a bit about what you're looking for and we'll schedule a call."
            messagePlaceholder="What are you hoping to learn or achieve?"
            submitLabel="Request Consultation"
            successTitle="Consultation requested"
            successBody="Thanks! An advisor will reach out shortly to schedule your call."
            tag="[Consultation Request] "
          />
        </Modal>
      )}

      {/* Visit Our Office */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-8 sm:p-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-slate-100">
            <div>
              <h2 className="text-2xl font-black" style={{ color: NAVY }}>Visit Our Office</h2>
              <p className="text-slate-500 mt-2 max-w-lg">
                {OFFICE_ADDRESS}. Walk-in consultation available during business hours &mdash; no appointment needed.
              </p>
            </div>
            <a
              href={DIRECTIONS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 shrink-0 font-bold px-6 py-3 rounded-xl transition-all hover:opacity-90"
              style={{ backgroundColor: ORANGE, color: '#ffffff' }}
            >
              <Navigation size={16} /> Get Directions
            </a>
          </div>

          <div className="w-full h-[400px] bg-slate-200 relative">
            {!mapLoaded && (
              <div className="absolute inset-0 bg-slate-100 animate-pulse flex items-center justify-center">
                <MapPin className="text-slate-300" size={32} />
              </div>
            )}
            <iframe
              src={MAP_EMBED_SRC}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen={false}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="GyanHub Head Office in New Baneshwor, Kathmandu"
              className="absolute inset-0"
              onLoad={() => setMapLoaded(true)}
            ></iframe>
            <a
              href={DIRECTIONS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute bottom-4 right-4 z-10 inline-flex items-center gap-1.5 bg-white shadow-lg rounded-full px-4 py-2 text-xs font-bold text-slate-700 hover:text-slate-900 transition-colors"
            >
              <ExternalLink size={13} /> Open in Google Maps
            </a>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="text-center py-20 px-4" style={{ background: `linear-gradient(135deg, ${NAVY} 0%, #1E3A8A 100%)` }}>
        <div className="max-w-2xl mx-auto">
          <p className="text-lg sm:text-xl text-blue-100 leading-relaxed">
            Every engineer starts with curiosity. Every career starts with one decision.
          </p>
          <h2 className="text-2xl sm:text-3xl font-black text-white mt-4 mb-10">
            Thank you for letting GyanHub be part of yours.
          </h2>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <details className="group relative">
              <summary className="inline-flex list-none cursor-pointer items-center gap-2 rounded-xl px-6 py-3.5 font-bold transition-all hover:opacity-90 [&::-webkit-details-marker]:hidden" style={{ backgroundColor: ORANGE, color: '#ffffff' }}>
                Explore Courses
                <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
              </summary>
              <div className="absolute left-1/2 z-10 mt-2 w-56 -translate-x-1/2 overflow-hidden rounded-xl border border-slate-200 bg-white text-left shadow-2xl">
                <a href="/onlinecourse" className="block px-4 py-3 text-sm font-medium text-slate-900 transition-colors hover:bg-slate-100">
                  Online Classes
                </a>
                <a href="/offline-class" className="block px-4 py-3 text-sm font-medium text-slate-900 transition-colors hover:bg-slate-100">
                  Physical Classes
                </a>
                <a href="/recording" className="block px-4 py-3 text-sm font-medium text-slate-900 transition-colors hover:bg-slate-100">
                  Recordings
                </a>
              </div>
            </details>
            <a
              href={DIRECTIONS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-white/30 px-6 py-3.5 font-bold transition-colors hover:bg-white/10"
              style={{ color: '#ffffff' }}
            >
              Visit the Training Center
            </a>
            <a
              href="#chatbox-section"
              className="inline-flex items-center gap-2 rounded-xl border border-white/30 px-6 py-3.5 font-bold transition-colors hover:bg-white/10"
              style={{ color: '#ffffff' }}
            >
              Talk to Us
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}