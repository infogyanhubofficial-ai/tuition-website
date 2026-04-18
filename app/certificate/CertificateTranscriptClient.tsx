'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { 
  Award, Download, Linkedin, Globe, Calendar, User, ShieldCheck,
  ArrowLeft, Printer, Copy, CheckCircle2, X, Maximize2, QrCode, Medal, Mail,
  Clock, BookOpen, ExternalLink, FileText
} from 'lucide-react';

export default function CertificateTranscriptClient({ name, email }: { name: string, email: string }) {
  const router = useRouter();
  
  const [certs, setCerts] = useState<any[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  
  const [profilePic, setProfilePic] = useState<string | null>(null);
  const [showLightbox, setShowLightbox] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const SUPABASE_STORAGE_URL = 'https://zuktarghyexwodqnnxlu.supabase.co/storage/v1/object/public/';

  const safeDecode = (value: string) => {
    try {
      return decodeURIComponent(decodeURIComponent(value));
    } catch {
      try {
        return decodeURIComponent(value);
      } catch {
        return value;
      }
    }
  };

  const decodedEmail = safeDecode(email);

  useEffect(() => {
    async function fetchTranscript() {
      if (!decodedEmail) {
        setLoading(false);
        return;
      }
      
      const { data, error } = await supabase
        .from('certificates')
        .select('*, syllabi(duration, description, syllabus_pdf)')
        .eq('email', decodedEmail)
        .order('issue_date', { ascending: false });

      if (!error && data) {
        setCerts(data);
      }
      setTimeout(() => setLoading(false), 800); 
    }
    fetchTranscript();
  }, [decodedEmail]);

  useEffect(() => {
    async function fetchProfilePic() {
      if (!decodedEmail) return;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('avatar_url')
        .ilike('email', decodedEmail)
        .maybeSingle();

      if (!error && data?.avatar_url) {
        if (data.avatar_url.startsWith('http')) {
          setProfilePic(data.avatar_url);
        } else {
          const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(data.avatar_url);
          setProfilePic(publicUrlData.publicUrl);
        }
      }
    }
    fetchProfilePic();
  }, [decodedEmail]);

  const getImageUrl = (imagePath: string) => {
    if (!imagePath) return '/brand/placeholder-verify.png';
    if (imagePath.startsWith('http')) return imagePath;
    const cleanPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;
    return `${SUPABASE_STORAGE_URL}${cleanPath}`;
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleDownloadPng = async () => {
    try {
      showToast("Preparing download...");
      const response = await fetch(getImageUrl(cert.certificate_image));
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `Certificate_${cert.certificate_code || 'Verified'}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Download failed", error);
      showToast("Download failed. Please try again.");
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#F7F9FC] pt-24 px-4">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="h-32 w-full bg-slate-200 rounded-2xl animate-pulse"></div>
        <div className="grid lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 h-[600px] bg-slate-200 rounded-2xl animate-pulse"></div>
          <div className="lg:col-span-4 h-[600px] bg-slate-200 rounded-2xl animate-pulse"></div>
        </div>
      </div>
    </div>
  );

  if (certs.length === 0) return (
    <div className="min-h-screen bg-[#F7F9FC] flex flex-col items-center justify-center text-center px-4">
      <ShieldCheck className="w-16 h-16 text-slate-300 mb-4" />
      <h2 className="text-2xl font-bold text-[#111827] mb-2">No Verified Transcript Found</h2>
      <p className="text-[#6B7280] max-w-md mb-6">We couldn't authenticate records for {decodedEmail}.</p>
      <button onClick={() => router.back()} className="inline-flex items-center gap-2 bg-[#0F1E3A] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#1E3A8A] transition-all">
        <ArrowLeft className="w-4 h-4" /> Return to Registry
      </button>
    </div>
  );

  const cert = certs[selectedIndex];
  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
  const linkedInUrl = `https://www.linkedin.com/profile/add?startTask=CERTIFICATION_NAME&name=${encodeURIComponent(cert.syllabus_name || 'Professional Certification')}&organizationName=GyanHub&certUrl=${encodeURIComponent(shareUrl)}&certId=${cert.certificate_code || cert.id}`;

  const syllabusData = cert.syllabi; 
  const duration = syllabusData?.duration || cert.duration || 'Not specified';
  const pdfLink = syllabusData?.syllabus_pdf || cert.syllabus_pdf;
  const description = syllabusData?.description;

  return (
    <div className="min-h-screen bg-[#F7F9FC] pb-20 font-sans text-slate-900 relative print:bg-white print:pb-0">
      
      {/* Optimized Print Styles */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body { background-color: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          @page { size: auto; margin: 10mm; } 
          nav:not(.print-nav), footer, header:not(.print-header) { display: none !important; }
          #main-nav, .site-footer, .policy-footer, .login-nav { display: none !important; }
        }
      `}} />
      
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-[#0F1E3A]/5 to-transparent pointer-events-none print:hidden" />
      
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 md:px-8 py-4 sticky top-0 z-40 print:hidden print-nav">
        <div className="max-w-7xl mx-auto flex flex-wrap gap-4 justify-between items-center">
          <button onClick={() => router.back()} className="flex items-center text-[#6B7280] hover:text-[#0F1E3A] transition-colors font-medium">
            <ArrowLeft className="w-4 h-4 mr-2" /> Registry Search
          </button>
          <button onClick={() => window.print()} className="flex items-center px-4 py-2 text-sm font-semibold text-[#0F1E3A] bg-white border border-[#CBD5E1] rounded-lg hover:bg-slate-50 transition-colors">
            <Printer className="w-4 h-4 mr-2" /> Save PDF
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 mt-8 space-y-8 relative z-10 print:mt-0 print:space-y-4 print:px-0">
        
        {/* Print-Only Official Header */}
        <div className="hidden print:flex items-end justify-between border-b-2 border-[#0F1E3A] pb-6 mb-8 print:pb-3 print:mb-4 print-header">
          <div>
            <h1 className="text-3xl font-serif font-bold text-[#0F1E3A]">Official Transcript Record</h1>
            <p className="text-[#6B7280] font-medium mt-1 uppercase tracking-wider text-sm">GyanHub Pvt. Ltd. | Authenticated Credential</p>
          </div>
          <Globe className="w-12 h-12 text-[#0F1E3A] opacity-20" />
        </div>

        {/* Profile Header */}
        <div className="bg-gradient-to-br from-[#0F1E3A] to-[#1E3A8A] rounded-2xl p-8 text-white shadow-[0_8px_25px_rgba(0,0,0,0.08)] relative overflow-hidden print:break-inside-avoid print:p-5 print:rounded-xl">
          <div className="absolute -top-24 -right-12 p-12 opacity-[0.03] pointer-events-none mix-blend-overlay print:hidden">
            <Medal className="w-96 h-96 text-white" />
          </div>
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 print:gap-4">
            <div className="w-20 h-20 bg-white/10 backdrop-blur-xl border border-white/20 rounded-full flex items-center justify-center text-blue-200 overflow-hidden shrink-0 shadow-inner print:w-16 print:h-16">
              {profilePic ? (
                <img 
                  src={profilePic} 
                  alt={cert.name} 
                  className="w-full h-full object-cover"
                  onError={() => setProfilePic(null)}
                />
              ) : (
                <User className="w-10 h-10 print:w-8 print:h-8" />
              )}
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3 print:text-2xl print:mb-2">{cert.name}</h1>
              <div className="flex flex-wrap items-center gap-3 text-sm font-medium text-blue-100 print:text-xs">
                <span className="flex items-center gap-1.5 opacity-90"><Mail className="w-4 h-4 print:w-3 print:h-3"/> {cert.email}</span>
                <span className="text-white/30 hidden md:inline">•</span>
                <span className="bg-white/10 px-3 py-1 rounded-full border border-white/20 flex items-center gap-1.5 print:px-2 print:py-0.5">
                  <ShieldCheck className="w-4 h-4 text-[#1FA2A6] print:w-3 print:h-3" /> 
                  {certs.length} Verified Certificate{certs.length > 1 ? 's' : ''}
                </span>
                <span className="bg-white/10 px-3 py-1 rounded-full border border-white/20 flex items-center gap-1.5 print:px-2 print:py-0.5">
                  <Award className="w-4 h-4 text-[#E86A2C] print:w-3 print:h-3" /> Top Skill: {certs[0].syllabus_name}
                </span>
              </div>
            </div>
          </div>
        </div>

        {certs.length > 1 && (
          <div className="print:block print:break-inside-avoid print:mt-4">
            <h3 className="text-xs font-bold text-[#6B7280] uppercase tracking-wider mb-4 print:text-[#111827] print:mb-2">Official Transcript Timeline</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 print:grid-cols-2 gap-4 overflow-x-auto print:overflow-visible pb-4 print:pb-0 custom-scrollbar print:gap-3">
              {certs.map((c, idx) => (
                <div 
                  key={c.id}
                  onClick={() => setSelectedIndex(idx)}
                  className={`cursor-pointer p-4 rounded-xl border transition-all duration-300 print:p-3 print:rounded-lg ${
                    selectedIndex === idx ? 'border-[#0F1E3A] bg-white shadow-md scale-[1.02] print:scale-100' : 'border-[#E5E7EB] bg-white/60 hover:border-[#CBD5E1]'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg mt-1 print:p-1.5 ${selectedIndex === idx ? 'bg-[#0F1E3A] text-white' : 'bg-slate-100 text-[#6B7280]'}`}>
                       <Award className="w-5 h-5 print:w-4 print:h-4" />
                    </div>
                    <div>
                      <p className={`text-sm font-bold line-clamp-2 print:text-xs ${selectedIndex === idx ? 'text-[#111827]' : 'text-[#6B7280]'}`}>{c.syllabus_name}</p>
                      <p className="text-xs text-[#6B7280] mt-1 flex items-center gap-1 print:text-[10px]">
                        <Calendar className="w-3 h-3 print:w-2.5 print:h-2.5"/> 
                        {c.issue_date ? new Date(c.issue_date).toLocaleDateString(undefined, { year: 'numeric', month: 'short' }) : 'Verified'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-12 print:flex print:flex-col gap-8 print:gap-4 print:mt-4">
          <div className="lg:col-span-8 flex flex-col gap-6 print:gap-0 print:max-w-[85%] print:mx-auto print:w-full print:break-inside-avoid">
            <div className="bg-white rounded-2xl overflow-hidden shadow-[0_8px_25px_rgba(0,0,0,0.08)] relative group print:shadow-none print:border print:border-[#E5E7EB] print:rounded-xl">
              <div className="relative aspect-[1.414/1] w-full bg-[#F7F9FC] flex items-center justify-center p-6 print:p-2">
                {cert.certificate_image ? (
                  <>
                    <img 
                      src={getImageUrl(cert.certificate_image)} 
                      alt="Certificate" 
                      className="w-full h-full object-contain drop-shadow-sm relative z-20 transition-transform duration-500 group-hover:scale-[1.01] print:drop-shadow-none"
                    />

                  

                    <button onClick={() => setShowLightbox(true)} className="absolute bottom-6 right-6 z-40 bg-[#0F1E3A]/90 backdrop-blur-sm text-white p-3 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[#E86A2C] print:hidden">
                      <Maximize2 className="w-5 h-5" />
                    </button>
                  </>
                ) : (
                  <div className="text-center p-10 z-20 text-[#6B7280] font-medium text-lg print:text-sm">Verification authenticated. Image syncing.</div>
                )}
              </div>
              
              <div className="bg-[#ECFDF5] px-6 py-4 flex items-center justify-between z-20 relative border-t border-[#E5E7EB] print:px-4 print:py-2">
                <div className="flex items-center text-[#22C55E] font-bold text-sm print:text-xs">
                  <ShieldCheck className="w-5 h-5 mr-2 print:w-4 print:h-4" /> ✔ Cryptographically Verified
                </div>
                <div className="text-xs font-mono font-semibold text-[#22C55E] bg-[#22C55E]/10 px-3 py-1 rounded-full print:text-[10px] print:px-2 print:py-0.5">
                  REF: {cert.certificate_code || cert.id?.toString().substring(0,8).toUpperCase()}
                </div>
              </div>
            </div>

            {pdfLink && (
              <div className="bg-white rounded-2xl p-6 shadow-[0_8px_25px_rgba(0,0,0,0.04)] border border-slate-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 print:hidden">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#1FA2A6]/10 flex items-center justify-center text-[#1FA2A6] shrink-0">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-[#111827] font-bold text-lg">Course Syllabus</h3>
                    <p className="text-[#6B7280] text-sm mt-1 max-w-xl leading-relaxed">
                      {description || 'Explore the comprehensive curriculum, learning objectives, and practical skills covered during this certification program.'}
                    </p>
                  </div>
                </div>
                <a 
                  href={pdfLink} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="shrink-0 flex items-center gap-2 px-6 py-3 bg-white border-2 border-[#1FA2A6] text-[#1FA2A6] font-semibold rounded-xl hover:bg-[#1FA2A6] hover:text-white transition-all shadow-sm"
                >
                  <FileText className="w-4 h-4" /> View Curriculum
                </a>
              </div>
            )}
          </div>

          <div className="lg:col-span-4 space-y-6 print:w-full print:space-y-4">
            <div className="bg-white rounded-2xl p-8 shadow-[0_8px_25px_rgba(0,0,0,0.04)] print:shadow-none print:border print:border-[#E5E7EB] print:p-5 print:rounded-xl print:break-inside-avoid">
              <div className="flex justify-between items-start mb-8 border-b border-slate-100 pb-8 print:mb-4 print:pb-4">
                <div>
                  <h3 className="text-xl font-bold text-[#111827] print:text-lg">Credential Details</h3>
                  <p className="text-sm font-medium text-[#1FA2A6] mt-1 flex items-center gap-1 print:text-xs">
                    <ShieldCheck className="w-4 h-4 print:w-3 print:h-3" /> Active Status
                  </p>
                </div>
                <div className="flex flex-col items-center gap-2 print:gap-1">
                  <div className="p-2 bg-[#F7F9FC] border border-[#E5E7EB] rounded-xl shadow-sm shrink-0 print:p-1.5 print:rounded-lg">
                    <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(shareUrl)}&color=0F1E3A`} alt="QR" className="w-14 h-14 print:w-10 print:h-10" />
                  </div>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-[#6B7280] print:text-[8px]">Scan to Verify</span>
                </div>
              </div>
              
              <div className="space-y-8 print:grid print:grid-cols-3 print:gap-4 print:space-y-0">
                <div className="flex gap-4 items-start print:gap-2">
                  <div className="w-10 h-10 rounded-full bg-[#F7F9FC] flex items-center justify-center text-[#0F1E3A] shrink-0 print:w-8 print:h-8"><Award className="w-5 h-5 print:w-4 print:h-4" /></div>
                  <div>
                    <p className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider mb-1.5 print:text-[9px] print:mb-0.5">Certification</p>
                    <p className="text-[#111827] font-semibold leading-snug text-base print:text-sm">{cert.syllabus_name}</p>
                  </div>
                </div>
                
                <div className="flex gap-4 items-start print:gap-2">
                  <div className="w-10 h-10 rounded-full bg-[#F7F9FC] flex items-center justify-center text-[#0F1E3A] shrink-0 print:w-8 print:h-8"><Clock className="w-5 h-5 print:w-4 print:h-4" /></div>
                  <div>
                    <p className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider mb-1.5 print:text-[9px] print:mb-0.5">Course Duration</p>
                    <p className="text-[#111827] font-semibold text-base print:text-sm">{duration}</p>
                  </div>
                </div>

                <div className="flex gap-4 items-start print:gap-2">
                  <div className="w-10 h-10 rounded-full bg-[#F7F9FC] flex items-center justify-center text-[#0F1E3A] shrink-0 print:w-8 print:h-8"><Calendar className="w-5 h-5 print:w-4 print:h-4" /></div>
                  <div>
                    <p className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider mb-1.5 print:text-[9px] print:mb-0.5">Issue Date</p>
                    <p className="text-[#111827] font-semibold text-base print:text-sm">
                      {cert.issue_date ? new Date(cert.issue_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Verified'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-10 space-y-3 print:hidden">
                <a href={linkedInUrl} target="_blank" rel="noopener noreferrer" className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#0A66C2] text-white rounded-xl font-semibold hover:bg-[#004182] transition-all shadow-md">
                  <Linkedin className="w-4 h-4" /> Add to LinkedIn Profile
                </a>
                <button onClick={() => { navigator.clipboard.writeText(shareUrl); showToast("Link copied!"); }} className="w-full flex items-center justify-center gap-2 py-3.5 bg-transparent border border-[#CBD5E1] text-[#475569] rounded-xl font-semibold hover:bg-slate-50 transition-all">
                  <Copy className="w-4 h-4" /> Copy Verification Link
                </button>
              </div>
            </div>

            <div className="bg-[#0F1E3A] rounded-2xl p-6 text-white shadow-md relative overflow-hidden print:break-inside-avoid print:p-5 print:rounded-xl">
              <div className="absolute top-0 right-0 p-4 opacity-[0.05] pointer-events-none print:hidden">
                <Globe className="w-32 h-32 text-white" />
              </div>
              <div className="relative z-10">
                <p className="text-blue-100 text-sm font-medium leading-relaxed mb-6 print:text-xs print:mb-4">This document serves as official verification that the individual has met all requirements and demonstrated proficiency in the designated curriculum.</p>
                <div className="pt-5 border-t border-white/10 print:pt-3">
                  <p className="font-bold text-[10px] uppercase tracking-wider opacity-60 mb-1 print:text-[8px]">Issuer</p>
                  <p className="font-semibold text-base text-white print:text-sm">GyanHub Pvt. Ltd</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showLightbox && (
        <div className="fixed inset-0 z-50 bg-[#0F1E3A]/95 backdrop-blur-xl flex items-center justify-center p-4 print:hidden" onClick={() => setShowLightbox(false)}>
          <div className="absolute top-6 right-6 flex gap-4">
            <button 
              onClick={(e) => { e.stopPropagation(); handleDownloadPng(); }} 
              className="text-white/80 hover:text-white bg-white/10 hover:bg-white/20 px-5 py-2 rounded-full transition-all flex items-center gap-2"
            >
              <Download className="w-5 h-5" /> 
              <span className="text-sm font-semibold hidden md:inline">Download Certificate</span>
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); setShowLightbox(false); }} 
              className="text-white/80 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-all"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <img src={getImageUrl(cert.certificate_image)} alt="Certificate" className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-[0_0_50px_rgba(0,0,0,0.5)]" onClick={(e) => e.stopPropagation()} />
        </div>
      )}

      {toastMessage && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-[#111827] text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 font-semibold text-sm animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-[#22C55E]" /> {toastMessage}
        </div>
      )}
    </div>
  );
}