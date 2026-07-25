"use client";

import React, { useState, useEffect } from 'react';
import { 
  Lock, Shield, Book, User, BarChart, CheckCircle2, 
  AlertTriangle, Mail, Phone, MapPin, Clock, Server, 
  Key, Eye, ChevronDown, ChevronUp
} from 'lucide-react';

export default function PrivacyPolicy() {
  const [activeSection, setActiveSection] = useState('intro');
  const [scrollProgress, setScrollProgress] = useState(0);
  // FIX: Explicitly type the state as number | null
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Scroll Progress & Sticky ToC Observer
  useEffect(() => {
    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollTop;
      const windowHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scroll = `${totalScroll / windowHeight}`;
      setScrollProgress(Number(scroll) * 100);
    };

    window.addEventListener('scroll', handleScroll);

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    }, { rootMargin: '-20% 0px -80% 0px' });

    document.querySelectorAll('section[id]').forEach((section) => {
      observer.observe(section);
    });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      observer.disconnect();
    };
  }, []);

  // FIX: Provide a string type for the 'id' parameter
  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const navItems = [
    { id: 'intro', label: 'Introduction' },
    { id: 'information', label: 'Information We Collect' },
    { id: 'usage', label: 'Data Usage' },
    { id: 'sharing', label: 'Data Sharing' },
    { id: 'security', label: 'Security' },
    { id: 'rights', label: 'Your Rights' },
    { id: 'faq', label: 'FAQ' },
    { id: 'contact', label: 'Contact' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-200 selection:text-blue-900 relative">
      
      {/* Blueprint Background Pattern */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-0" 
           style={{ backgroundImage: 'radial-gradient(#0f172a 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
      </div>

      {/* Progress Bar */}
      <div 
        className="fixed top-0 left-0 h-1 bg-blue-600 z-50 transition-all duration-150 ease-out"
        style={{ width: `${scrollProgress}%` }}
      />

      {/* Header */}
      <header className="relative z-10 pt-24 pb-12 px-6 text-center">
        <div className="max-w-2xl mx-auto">
          <div className="inline-flex items-center justify-center gap-2 px-4 py-1.5 mb-6 rounded-full bg-white border border-slate-200 shadow-sm text-sm font-medium text-slate-600">
            <Lock className="w-4 h-4 text-blue-500" />
            <span>Updated Jan 1, 2025</span>
            <span className="w-1 h-1 bg-slate-300 rounded-full mx-1"></span>
            <span className="text-slate-400">v1.2</span>
            <span className="w-1 h-1 bg-slate-300 rounded-full mx-1"></span>
            <span className="text-slate-400 flex items-center gap-1"><Clock className="w-3 h-3"/> 5 min read</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-6">
            Privacy Policy
          </h1>
        </div>
      </header>

      {/* Trust Banner */}
      <div className="relative z-10 max-w-4xl mx-auto px-6 mb-16">
        <div className="bg-slate-900 text-white rounded-[24px] p-6 md:p-8 flex flex-col md:flex-row items-center gap-6 shadow-2xl shadow-slate-900/20">
          <div className="bg-white/10 p-4 rounded-full">
            <Shield className="w-8 h-8 text-blue-400" />
          </div>
          <div className="text-center md:text-left flex-1">
            <h3 className="text-xl font-bold mb-1">Your Privacy Matters</h3>
            <p className="text-slate-300 text-sm md:text-base">
              We collect only the information necessary to provide our services. We never sell your personal information to third parties.
            </p>
          </div>
        </div>
      </div>

      {/* Main Layout Grid */}
      <div className="relative z-10 max-w-6xl mx-auto px-6 pb-32 flex flex-col lg:flex-row gap-16">
        
        {/* Sticky Sidebar */}
        <aside className="hidden lg:block w-64 shrink-0">
          <div className="sticky top-12 bg-white/50 backdrop-blur-xl border border-slate-200 rounded-[24px] p-6 shadow-sm">
            <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-6">Contents</h4>
            <nav className="flex flex-col gap-3">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollTo(item.id)}
                  className={`text-left text-sm font-medium transition-all duration-200 flex items-center gap-3 ${
                    activeSection === item.id 
                      ? 'text-blue-600 translate-x-2' 
                      : 'text-slate-500 hover:text-slate-800 hover:translate-x-1'
                  }`}
                >
                  <div className={`w-1.5 h-1.5 rounded-full transition-colors ${activeSection === item.id ? 'bg-blue-600' : 'bg-transparent'}`} />
                  {item.label}
                </button>
              ))}
            </nav>
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 max-w-2xl text-lg text-slate-600 leading-[1.8] tracking-[0.015em] space-y-24">
          
          {/* Intro */}
          <section id="intro" className="scroll-mt-24">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-6 leading-tight">
              Your trust is as important as your education.
            </h2>
            <div className="space-y-6">
              <p>
                At <strong className="text-slate-900">GyanHub</strong>, education begins with trust. Every learner, educator, and professional deserves complete transparency in how their information is handled. 
              </p>
              <p>
                We collect only what is necessary to provide meaningful educational experiences and protect your privacy with the same care we bring to every course we create. This policy explains what information we collect, why we collect it, and how we protect it under the Privacy Act, 2075 (2018) of Nepal.
              </p>
            </div>
          </section>

          {/* 01. Information We Collect */}
          <section id="information" className="scroll-mt-24">
            <div className="relative mb-10">
              <span className="text-[120px] font-black text-slate-100 absolute -top-16 -left-8 -z-10 select-none">01</span>
              <h2 className="text-3xl font-bold text-slate-900">Information We Collect</h2>
              <p className="text-blue-600 font-medium mt-2">What we gather to improve your experience</p>
            </div>
            
            <div className="grid sm:grid-cols-2 gap-4 mt-8">
              {[
                { icon: User, title: 'Personal Details', desc: 'Name, email, and location to match you with local opportunities.' },
                { icon: Book, title: 'Academic Info', desc: 'Qualifications and subjects of expertise for tutor profiles.' },
                { icon: BarChart, title: 'Usage Data', desc: 'Search preferences and course views to personalize content.' },
                { icon: Shield, title: 'Security Data', desc: 'Login timestamps and device data to prevent fraud.' }
              ].map((card, idx) => (
                <div key={idx} className="bg-white border border-slate-200 p-6 rounded-[24px] shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group cursor-default">
                  <card.icon className="w-8 h-8 text-slate-400 group-hover:text-blue-500 transition-colors mb-4" />
                  <h3 className="text-base font-bold text-slate-900 mb-2">{card.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{card.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* 02. Data Usage */}
          <section id="usage" className="scroll-mt-24">
            <div className="relative mb-10">
              <span className="text-[120px] font-black text-slate-100 absolute -top-16 -left-8 -z-10 select-none">02</span>
              <h2 className="text-3xl font-bold text-slate-900">How We Use Your Data</h2>
              <p className="text-blue-600 font-medium mt-2">Purpose and application</p>
            </div>
            <p className="mb-6">
              We only use your data to facilitate and improve our educational services. We never use it for obscure tracking or invasive profiling. Your information helps us:
            </p>
            <ul className="space-y-4">
              {[
                'Connect students with the most relevant and qualified tutors.',
                'Display professional profiles to users actively seeking specific services.',
                'Provide personalized recommendations for skill-based training.',
                'Communicate regarding updates, opportunities, or customer support.'
              ].map((item, idx) => (
                <li key={idx} className="flex items-start gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                  <CheckCircle2 className="w-6 h-6 text-blue-500 shrink-0 mt-0.5" />
                  <span className="text-slate-700">{item}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* 03. Data Sharing */}
          <section id="sharing" className="scroll-mt-24">
            <div className="relative mb-10">
              <span className="text-[120px] font-black text-slate-100 absolute -top-16 -left-8 -z-10 select-none">03</span>
              <h2 className="text-3xl font-bold text-slate-900">Data Sharing</h2>
              <p className="text-green-600 font-medium mt-2">Our commitment to your privacy</p>
            </div>
            
            <div className="bg-green-50 border border-green-200 rounded-[24px] p-8 md:p-10 shadow-sm mb-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="bg-green-100 p-3 rounded-full">
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-green-900">We Never Sell Your Data</h3>
              </div>
              <p className="text-green-800 text-lg leading-relaxed font-medium">
                Your information belongs to you.<br/>
                Not advertisers.<br/>
                Not marketers.
              </p>
            </div>
            <p>
              Your data remains securely within the GyanHub ecosystem to serve your educational needs. We only share data when legally required by the laws of Nepal.
            </p>
          </section>

          {/* 04. Security */}
          <section id="security" className="scroll-mt-24">
            <div className="relative mb-10">
              <span className="text-[120px] font-black text-slate-100 absolute -top-16 -left-8 -z-10 select-none">04</span>
              <h2 className="text-3xl font-bold text-slate-900">Data Security</h2>
              <p className="text-blue-600 font-medium mt-2">How we protect you</p>
            </div>
            <p className="mb-8">
              We implement robust, industry-standard digital security measures to protect your personal information against unauthorized access, alteration, or disclosure.
            </p>

            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { icon: Key, title: 'End-to-End Encryption', desc: 'All data transmitted is encrypted using TLS 1.3.' },
                { icon: Server, title: 'Secure Servers', desc: 'Hosted on enterprise-grade, compliant cloud infrastructure.' },
                { icon: Lock, title: 'Strict Access Control', desc: 'Only authorized personnel can access sensitive systems.' },
                { icon: Eye, title: 'Regular Monitoring', desc: '24/7 security scanning for vulnerabilities and threats.' }
              ].map((feature, idx) => (
                <div key={idx} className="flex items-start gap-4 p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
                  <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                    <feature.icon className="w-6 h-6 text-slate-700" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm mb-1">{feature.title}</h4>
                    <p className="text-sm text-slate-500 leading-snug">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 05. Your Rights */}
          <section id="rights" className="scroll-mt-24">
             <div className="relative mb-10">
              <span className="text-[120px] font-black text-slate-100 absolute -top-16 -left-8 -z-10 select-none">05</span>
              <h2 className="text-3xl font-bold text-slate-900">Your Rights & Control</h2>
              <p className="text-amber-600 font-medium mt-2">You are in the driver's seat</p>
            </div>
            
            <div className="bg-amber-50 border border-amber-200 rounded-[24px] p-8 flex gap-6 items-start">
              <AlertTriangle className="w-8 h-8 text-amber-600 shrink-0" />
              <div>
                <h3 className="text-lg font-bold text-amber-900 mb-2">Complete Control</h3>
                <p className="text-amber-800/80 leading-relaxed">
                  You have the right to view, update, correct, or permanently delete your account and personal information from our database at any time. If you wish to execute a data deletion request, simply reach out to our privacy team.
                </p>
              </div>
            </div>
          </section>

          {/* Expandable FAQ */}
          <section id="faq" className="scroll-mt-24">
            <div className="relative mb-10">
              <h2 className="text-3xl font-bold text-slate-900">Frequently Asked Questions</h2>
            </div>
            <div className="space-y-4">
              {[
                { q: "Can I delete my data permanently?", a: "Yes. You can request account deletion from your profile settings or by contacting support. We will erase your personal data within 30 days." },
                { q: "Do you use cookies?", a: "We use essential cookies to keep you logged in and analytics cookies to improve our platform. You can manage these preferences in your browser." },
                { q: "Is my payment information stored?", a: "No. All transactions are processed securely through certified third-party payment gateways. GyanHub does not store your credit card or bank details." }
              ].map((faq, idx) => (
                <div key={idx} className="border border-slate-200 rounded-2xl bg-white overflow-hidden transition-all duration-200">
                  <button 
                    onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                    className="w-full text-left px-6 py-5 flex justify-between items-center focus:outline-none"
                  >
                    <span className="font-bold text-slate-800">{faq.q}</span>
                    {openFaq === idx ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                  </button>
                  <div className={`px-6 overflow-hidden transition-all duration-300 ease-in-out ${openFaq === idx ? 'max-h-40 pb-5 opacity-100' : 'max-h-0 opacity-0'}`}>
                    <p className="text-slate-600 text-base">{faq.a}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 06. Contact Section - Updated Frame, Light Blue Boxes, Redirects */}
          <section id="contact" className="scroll-mt-24">
            {/* Frame changed to dark blue (bg-blue-900) */}
            <div className="bg-blue-900 text-white rounded-[32px] p-10 md:p-12 shadow-2xl relative overflow-hidden">
              <div className="relative z-10 text-center mb-10">
                <h2 className="text-3xl md:text-4xl font-bold mb-3 text-white">Need Help?</h2>
                <p className="text-blue-100 font-medium flex items-center justify-center gap-2">
                  <Clock className="w-4 h-4"/> Average response within 24 hours
                </p>
              </div>

              <div className="grid sm:grid-cols-3 gap-6 relative z-10">
                {/* Email Card - Light Blue (bg-blue-500) */}
                <a href="mailto:admin@gyanhub.com.np" className="bg-blue-500 hover:bg-blue-600 transition-colors p-6 rounded-2xl flex flex-col items-center text-center border border-blue-400 shadow-md">
                  <Mail className="w-8 h-8 text-white mb-4" strokeWidth={1.5} />
                  <span className="text-sm font-bold uppercase tracking-wider text-white mb-4">Email</span>
                  <span className="font-bold text-white text-sm md:text-base break-all">admin@gyanhub.com.np</span>
                </a>
                
                {/* Phone Card - Light Blue (bg-blue-500) */}
                <a href="tel:9763695665" className="bg-blue-500 hover:bg-blue-600 transition-colors p-6 rounded-2xl flex flex-col items-center text-center border border-blue-400 shadow-md">
                  <Phone className="w-8 h-8 text-white mb-4" strokeWidth={1.5} />
                  <span className="text-sm font-bold uppercase tracking-wider text-white mb-4">Phone</span>
                  <span className="font-bold text-white text-base leading-relaxed">+977<br/>9763695665</span>
                </a>
                
                {/* Office Card - Light Blue (bg-blue-500) & Clickable to Maps */}
                <a 
                  href="https://maps.app.goo.gl/GXcMpBFLjnPFyij8A" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="bg-blue-500 hover:bg-blue-600 transition-colors p-6 rounded-2xl flex flex-col items-center text-center border border-blue-400 shadow-md cursor-pointer"
                >
                  <MapPin className="w-8 h-8 text-white mb-4" strokeWidth={1.5} />
                  <span className="text-sm font-bold uppercase tracking-wider text-white mb-4">Office</span>
                  <span className="font-bold text-white text-base leading-relaxed">Gatthaghar,<br/>Bhaktapur</span>
                </a>
              </div>
            </div>
          </section>

          {/* Ending */}
          <footer className="pt-24 pb-12 text-center">
            <div className="w-16 h-1 bg-slate-200 mx-auto mb-10 rounded-full"></div>
            <h3 className="text-2xl font-bold text-slate-900 mb-2">Privacy is built on trust.</h3>
            <p className="text-slate-500">Thank you for choosing GyanHub.</p>
            
            {/* Print Friendly Utility */}
            <button 
              onClick={() => window.print()}
              className="mt-8 text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-2 mx-auto"
            >
              Print Policy
            </button>
          </footer>

        </main>
      </div>
    </div>
  );
}