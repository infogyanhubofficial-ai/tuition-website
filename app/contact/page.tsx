"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Lock, SearchX, Send, MessageCircle } from 'lucide-react';
import { createClient } from "@/lib/supabase/client";

// --- TYPES ---
interface ChatMessage {
  id: string;
  user_id: string;
  sender_role: 'user' | 'admin' | 'student' | 'tutor';
  content: string;
  created_at: string;
}

// --- CHATBOX COMPONENT ---
function ChatBox({ userId, userName, isTutor }: { userId: string | null, userName: string, isTutor: boolean }) {
  const supabase = createClient();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const themeBorder = isTutor ? 'border-green-200 focus:border-green-500 focus:ring-green-100' : 'border-blue-200 focus:border-blue-500 focus:ring-blue-100';
  const themeButton = isTutor ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700';
  const userMsgClass = isTutor ? 'bg-green-50 text-green-800 border border-green-100' : 'bg-blue-50 text-blue-800 border border-blue-100';

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
  }, [messages]);

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
    if (error) console.error("Error sending message:", error);
  };

  return (
    <div id="chatbox-section" className="bg-white/70 backdrop-blur-md border border-slate-200/60 shadow-lg rounded-[32px] flex flex-col h-[500px] overflow-hidden scroll-mt-32 w-full">
      <div className="p-6 border-b border-slate-200/50 bg-white/50 backdrop-blur-sm">
        <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">Message GyanHub Admin</h3>
        <p className="text-sm text-slate-500 font-medium">Get support or ask questions directly.</p>
      </div>
      
      <div className="flex-grow p-6 overflow-y-auto flex flex-col gap-4 bg-slate-50/50 custom-scrollbar">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-500 rounded-full animate-spin"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400">
            <SearchX size={40} className="mb-2 opacity-50" />
            <p className="text-sm font-bold">No messages yet.</p>
            <p className="text-xs">Send a message to start the conversation.</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isAdmin = msg.sender_role === 'admin';
            return (
              <div key={msg.id} className={`flex flex-col ${isAdmin ? 'items-start' : 'items-end'}`}>
                <span className="text-[10px] text-slate-400 font-bold mb-1 px-1 opacity-80">
                  {isAdmin ? 'admin . Nischal' : `${isTutor ? 'tutor' : 'student'} . ${userName}`}
                </span>
                <div className={`max-w-[80%] rounded-2xl p-4 text-sm font-medium shadow-sm ${isAdmin ? 'bg-white text-slate-800 border border-slate-100 rounded-tl-none' : `${userMsgClass} rounded-tr-none`}`}>
                  {msg.content}
                </div>
              </div>
            );
          })
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
        <button type="submit" disabled={!newMessage.trim()} className={`${themeButton} text-white p-3 rounded-xl shadow-[0_4px_15px_rgba(0,0,0,0.1)] disabled:opacity-50 disabled:cursor-not-allowed transition-all`}>
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

  // Initialize Auth State to conditionally show the ChatBox
  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data, error } = await supabase.auth.getUser();
        if (data?.user) {
          setIsSignedIn(true);
          setUserId(data.user.id);
          setUserName(data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || 'User');
          
          // Optionally check if they are a verified tutor to pass the correct theme to the chatbox
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
      
      {/* 1. Welcoming Header (Hero Section) */}
      <section className="bg-white border-b border-slate-200 py-16 px-4 sm:px-6 lg:px-8 text-center">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 mb-4 tracking-tight">
            Get in Touch with GyanHub
          </h1>
          <p className="text-lg sm:text-xl text-slate-600 leading-relaxed">
            Whether you are a student seeking the perfect tutor, an educator looking for your next opportunity, or an institution wanting to collaborate—we are here to help.
          </p>
        </div>
      </section>

      {/* Main Content Layout */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8">
          
          {/* Left Column: Contact Info & Socials (5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-8">
            
            {/* Quick Contact Cards */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 flex flex-col gap-8">
              <h2 className="text-2xl font-bold text-slate-900 border-b border-slate-100 pb-4">
                Contact Information
              </h2>

              {/* Location Card */}
              <div className="flex items-start gap-4">
                <div className="bg-blue-50 p-3 rounded-full text-blue-600 shrink-0">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">Our Office</h3>
                  <p className="text-slate-600 mt-1">Gatthaghar, Bhaktapur, Nepal</p>
                  <p className="text-sm text-slate-500 mt-1">(Drop by for a chat about your educational journey!)</p>
                </div>
              </div>

              {/* Email Card */}
              <div className="flex items-start gap-4">
                <div className="bg-blue-50 p-3 rounded-full text-blue-600 shrink-0">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">Email Us</h3>
                  <a href="mailto:admin@gyanhub.com.np" className="text-blue-600 hover:text-blue-800 transition-colors mt-1 block">
                    admin@gyanhub.com.np
                  </a>
                </div>
              </div>

              {/* Phone Card */}
              <div className="flex items-start gap-4">
                <div className="bg-blue-50 p-3 rounded-full text-blue-600 shrink-0">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">Phone & WhatsApp</h3>
                  <a href="tel:+9779763695665" className="text-blue-600 hover:text-blue-800 transition-colors mt-1 block font-medium">
                    +977 9763695665
                  </a>
                  <p className="text-sm text-slate-500 mt-1">Available for quick inquiries</p>
                </div>
              </div>

              {/* Business Hours */}
              <div className="flex items-start gap-4">
                <div className="bg-slate-100 p-3 rounded-full text-slate-600 shrink-0">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">Business Hours</h3>
                  <p className="text-slate-600 mt-1">Sunday – Friday: 9:00 AM – 6:00 PM</p>
                  <p className="text-red-500 text-sm font-medium mt-1">Saturday: Closed</p>
                </div>
              </div>
            </div>

            {/* Social Media Grid */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
              <h2 className="text-xl font-bold text-slate-900 mb-2">Connect With Our Community</h2>
              <p className="text-sm text-slate-600 mb-6">Follow us for educational opportunities, course updates, and skill-building tips.</p>
              
              <div className="flex flex-wrap gap-4">
                {/* Facebook */}
                <a href="https://www.facebook.com/profile.php?id=61569757534336" target="_blank" rel="noopener noreferrer" className="w-12 h-12 flex items-center justify-center rounded-full bg-slate-100 text-[#1877F2] hover:bg-[#1877F2] hover:text-white transition-all duration-300">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                </a>
                {/* Instagram */}
                <a href="https://www.instagram.com/gyanhubonline/?next=%2F" target="_blank" rel="noopener noreferrer" className="w-12 h-12 flex items-center justify-center rounded-full bg-slate-100 text-[#E4405F] hover:bg-[#E4405F] hover:text-white transition-all duration-300">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                </a>
                {/* LinkedIn */}
                <a href="https://www.linkedin.com/company/gyanhub/" target="_blank" rel="noopener noreferrer" className="w-12 h-12 flex items-center justify-center rounded-full bg-slate-100 text-[#0A66C2] hover:bg-[#0A66C2] hover:text-white transition-all duration-300">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                </a>
                {/* TikTok */}
                <a href="https://www.tiktok.com/@gyanhubofficial" target="_blank" rel="noopener noreferrer" className="w-12 h-12 flex items-center justify-center rounded-full bg-slate-100 text-black hover:bg-black hover:text-white transition-all duration-300">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 2.78-1.15 5.54-3.33 7.39-2.26 1.93-5.32 2.65-8.22 2.1-2.92-.55-5.34-2.45-6.68-5.11-1.37-2.73-1.17-6.1.48-8.66 1.58-2.45 4.31-3.96 7.23-4.04v4.06c-1.63.13-3.2 1.05-4.04 2.45-.8 1.34-.84 3.09-.16 4.47.66 1.35 1.98 2.31 3.48 2.5 1.51.18 3.12-.23 4.23-1.26 1.18-1.1 1.72-2.74 1.66-4.36-.11-6.19-.04-12.38-.04-18.57h1.33z"/></svg>
                </a>
                {/* YouTube */}
                <a href="https://www.youtube.com/@GyanHubOnline" target="_blank" rel="noopener noreferrer" className="w-12 h-12 flex items-center justify-center rounded-full bg-slate-100 text-[#FF0000] hover:bg-[#FF0000] hover:text-white transition-all duration-300">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                </a>
              </div>
            </div>

          </div>

          {/* Right Column: ChatBox Form Area with Lock Overlay */}
          <div className="lg:col-span-7 relative h-full min-h-[500px]">
            {authLoading ? (
              <div className="flex items-center justify-center h-full bg-slate-100/50 rounded-[32px] border border-slate-200">
                <div className="w-8 h-8 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
              </div>
            ) : isSignedIn ? (
              <ChatBox userId={userId} userName={userName} isTutor={isTutor} />
            ) : (
              // The Locked Form View
              <div className="relative h-full">
                {/* Visual Background Form to peek behind the lock */}
                <div className="bg-white rounded-[32px] shadow-lg shadow-slate-200/50 border border-slate-100 p-8 sm:p-10 h-full pointer-events-none opacity-40 blur-[2px]">
                  <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2"><MessageCircle /> Live Support</h2>
                  <div className="space-y-6">
                    <div className="w-full h-12 bg-slate-100 rounded-xl"></div>
                    <div className="w-full h-12 bg-slate-100 rounded-xl"></div>
                    <div className="w-full h-32 bg-slate-100 rounded-xl"></div>
                    <div className="w-full h-12 bg-blue-100 rounded-xl"></div>
                  </div>
                </div>

                <div className="absolute inset-0 z-10 flex items-center justify-center p-6 backdrop-blur-[4px] bg-slate-50/20 rounded-[32px]">
                  <div className="bg-white/95 border border-slate-200 shadow-xl rounded-3xl p-8 max-w-sm text-center transform transition-all">
                    <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                      <Lock className="w-8 h-8" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-3 tracking-tight">Live Chat Locked</h3>
                    <p className="text-slate-500 mb-8 text-sm leading-relaxed font-medium">
                      Sign in to your GyanHub account to chat directly with our administration and support team.
                    </p>
                    
                    <div className="flex flex-col gap-3">
                      <button 
                        onClick={() => window.location.href = '/login'}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-6 rounded-2xl transition-all duration-200 shadow-[0_5px_15px_rgba(37,99,235,0.3)] hover:shadow-[0_8px_20px_rgba(37,99,235,0.4)] hover:-translate-y-0.5"
                      >
                        Sign In to Chat
                      </button>
                      <button 
                        onClick={() => window.location.href = '/register'}
                        className="w-full bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 font-bold py-3.5 px-6 rounded-2xl transition-all duration-200"
                      >
                        Create Account
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Interactive Map Embed */}
      <section className="border-t border-slate-200">
        <div className="w-full h-[400px] bg-slate-200 relative">
          <iframe 
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d14131.066427338785!2d85.35824982627993!3d27.693616654767746!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39eb1a2380cb4e9d%3A0xc3c54d144362d85!2sGatthaghar%2C%20Madhyapur%20Thimi%2044600%2C%20Nepal!5e0!3m2!1sen!2sus!4v1700000000000!5m2!1sen!2sus" 
            width="100%" 
            height="100%" 
            style={{ border: 0 }} 
            allowFullScreen={false} 
            loading="lazy" 
            referrerPolicy="no-referrer-when-downgrade"
            title="GyanHub Office Location in Gatthaghar, Bhaktapur"
            className="absolute inset-0"
          ></iframe>
        </div>
      </section>

    </div>
  );
}