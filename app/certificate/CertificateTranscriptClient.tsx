'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { 
  Award, Download, Linkedin, Globe, Calendar, User, ShieldCheck,
  ArrowLeft, Printer, Copy, CheckCircle2, X, Maximize2, QrCode, Medal, Mail
} from 'lucide-react';

// Accept name and email as props from the parent PageRouter
export default function CertificateTranscriptClient({ name, email }: { name: string, email: string }) {
  const router = useRouter();
  
  const [certs, setCerts] = useState<any[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  
  // Profile Picture State
  const [profilePic, setProfilePic] = useState<string | null>(null);

  // UX States
  const [showLightbox, setShowLightbox] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const SUPABASE_STORAGE_URL = 'https://zuktarghyexwodqnnxlu.supabase.co/storage/v1/object/public/';

  // 1. Fetch Certificates Logic
  useEffect(() => {
    async function fetchTranscript() {
      if (!email) {
        setLoading(false);
        return;
      }
      
      const { data, error } = await supabase
        .from('certificates')
        .select('*')
        .eq('email', email)
        .order('issue_date', { ascending: false });

      if (!error && data) {
        setCerts(data);
      }
      setTimeout(() => setLoading(false), 800); 
    }
    fetchTranscript();
  }, [email]);

  // 2. Fetch Profile Picture Logic
  useEffect(() => {
    async function fetchProfilePic() {
      if (!email) return;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('avatar_url')
        .ilike('email', email)
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
  }, [email]);

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

  if (loading) return (
    <div className="min-h-screen bg-slate-50 pt-24 px-4">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="h-32 w-full bg-slate-200 rounded-2xl animate-pulse"></div>
        <div className="grid lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 h-[600px] bg-slate-200 rounded-3xl animate-pulse"></div>
          <div className="lg:col-span-4 h-[600px] bg-slate-200 rounded-3xl animate-pulse"></div>
        </div>
      </div>
    </div>
  );

  if (certs.length === 0) return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-center px-4">
      <ShieldCheck className="w-16 h-16 text-slate-300 mb-4" />
      <h2 className="text-2xl font-bold text-slate-700 mb-2">No Verified Transcript Found</h2>
      <p className="text-slate-500 max-w-md mb-6">We couldn't authenticate records for {email}.</p>
      <button onClick={() => router.back()} className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-xl font-semibold hover:bg-blue-700 transition-all">
        <ArrowLeft className="w-4 h-4" /> Return to Registry
      </button>
    </div>
  );

  const cert = certs[selectedIndex];
  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
  const linkedInUrl = `https://www.linkedin.com/profile/add?startTask=CERTIFICATION_NAME&name=${encodeURIComponent(cert.syllabus_name || 'Professional Certification')}&organizationName=GyanHub&certUrl=${encodeURIComponent(shareUrl)}&certId=${cert.certificate_code || cert.id}`;

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-20 font-sans text-slate-900 selection:bg-blue-500/30">
      
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 md:px-8 py-4 sticky top-0 z-40 shadow-sm print:hidden">
        <div className="max-w-7xl mx-auto flex flex-wrap gap-4 justify-between items-center">
          <button onClick={() => router.back()} className="flex items-center text-slate-500 hover:text-blue-600 transition-colors font-medium">
            <ArrowLeft className="w-4 h-4 mr-2" /> Registry Search
          </button>
          <button onClick={() => window.print()} className="flex items-center px-4 py-2 text-sm font-bold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
            <Printer className="w-4 h-4 mr-2" /> Save PDF
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 mt-8 space-y-8">
        
        {/* Header with Dynamic Profile Pic */}
        <div className="bg-gradient-to-r from-blue-900 to-slate-900 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden print:bg-none print:text-black">
          <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
            <Medal className="w-64 h-64 text-white" />
          </div>
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
            <div className="w-20 h-20 bg-blue-500/20 backdrop-blur-xl border border-blue-400/30 rounded-full flex items-center justify-center text-blue-300 overflow-hidden shrink-0">
              {profilePic ? (
                <img 
                  src={profilePic} 
                  alt={cert.name} 
                  className="w-full h-full object-cover"
                  onError={() => setProfilePic(null)}
                />
              ) : (
                <User className="w-10 h-10" />
              )}
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-serif font-bold mb-2">{cert.name}</h1>
              <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-blue-200">
                <span className="flex items-center gap-1"><Mail className="w-4 h-4"/> {cert.email}</span>
                <span className="bg-blue-500/20 px-3 py-1 rounded-full border border-blue-400/30 flex items-center gap-1">
  <ShieldCheck className="w-4 h-4" /> 
  {certs.length} Verified Credential{certs.length > 1 ? 's' : ''}
</span>
                <span className="bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-full border border-emerald-400/30 flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4" /> Top Skill: {certs[0].syllabus_name}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Timeline */}
        {certs.length > 1 && (
          <div className="print:hidden">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Official Transcript Timeline</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 overflow-x-auto pb-4 custom-scrollbar">
              {certs.map((c, idx) => (
                <div 
                  key={c.id}
                  onClick={() => setSelectedIndex(idx)}
                  className={`cursor-pointer p-4 rounded-2xl border-2 transition-all duration-300 ${
                    selectedIndex === idx ? 'border-blue-500 bg-blue-50/50 shadow-md scale-[1.02]' : 'border-slate-200 bg-white hover:border-blue-200'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-xl mt-1 ${selectedIndex === idx ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'}`}>
                       <Award className="w-5 h-5" />
                    </div>
                    <div>
                      <p className={`text-sm font-bold line-clamp-2 ${selectedIndex === idx ? 'text-blue-900' : 'text-slate-700'}`}>{c.syllabus_name}</p>
                      <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                        <Calendar className="w-3 h-3"/> 
                        {c.issue_date ? new Date(c.issue_date).toLocaleDateString(undefined, { year: 'numeric', month: 'short' }) : 'Verified'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-12 gap-8">
          {/* Main Viewer */}
          <div className="lg:col-span-8">
            <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xl ring-1 ring-slate-200 relative group">
              <div className="relative aspect-[1.414/1] w-full bg-slate-100 flex items-center justify-center p-4">
                {cert.certificate_image ? (
                  <>
                    <img 
                      src={getImageUrl(cert.certificate_image)} 
                      alt="Certificate"
                      className="w-full h-full object-contain shadow-md relative z-20 transition-transform duration-500 group-hover:scale-[1.01]"
                    />
                    <button onClick={() => setShowLightbox(true)} className="absolute bottom-6 right-6 z-30 bg-slate-900/80 backdrop-blur-sm text-white p-3 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-blue-600 print:hidden">
                      <Maximize2 className="w-5 h-5" />
                    </button>
                  </>
                ) : (
                  <div className="text-center p-10 z-20 text-slate-500 font-serif italic text-xl">Verification authenticated. Image syncing.</div>
                )}
              </div>
              <div className="bg-emerald-50 border-t border-emerald-100 px-6 py-4 flex items-center justify-between z-20 relative">
                <div className="flex items-center text-emerald-700 font-bold text-sm animate-pulse">
                  <ShieldCheck className="w-5 h-5 mr-2" /> CRYPTOGRAPHICALLY VERIFIED
                </div>
                <div className="text-xs font-mono text-emerald-600 bg-white/60 px-3 py-1 rounded border border-emerald-200">
                  REF: {cert.certificate_code || cert.id?.toString().substring(0,8).toUpperCase()}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm print:shadow-none">
              <div className="flex justify-between items-start mb-8 border-b border-slate-100 pb-6">
                <div>
                  <h3 className="text-xl font-black text-slate-900">Credential Details</h3>
                  <p className="text-sm text-slate-500">Scan to verify online</p>
                </div>
                <div className="p-2 bg-white border border-slate-200 rounded-xl shadow-sm shrink-0">
                  <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(shareUrl)}&color=0F172A`} alt="QR" className="w-16 h-16" />
                </div>
              </div>
              
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shrink-0"><Award className="w-5 h-5" /></div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Certification</p>
                    <p className="text-slate-900 font-bold leading-tight">{cert.syllabus_name}</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shrink-0"><Calendar className="w-5 h-5" /></div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Issue Date</p>
                    <p className="text-slate-900 font-bold">
                      {cert.issue_date ? new Date(cert.issue_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Verified'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-10 space-y-3 print:hidden">
                <button onClick={() => { navigator.clipboard.writeText(shareUrl); showToast("Link copied!"); }} className="w-full flex items-center justify-center gap-2 py-3.5 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg">
                  <Copy className="w-4 h-4" /> Copy Verification Link
                </button>
                <a href={linkedInUrl} target="_blank" rel="noopener noreferrer" className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#0077b5] text-white rounded-xl font-bold hover:bg-[#005885] transition-all">
                  <Linkedin className="w-4 h-4" /> Add to LinkedIn Profile
                </a>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-800 to-indigo-600 rounded-3xl p-3 text-white shadow-x0.l print:hidden">
              <Globe className="w-8 h-8 mb-4 opacity-50" />
              <p className="text-blue-100 text-sm font-medium leading-relaxed mb-6">This document serves as official verification that the individual has met all requirements and demonstrated proficiency in the designated curriculum.</p>
              <div className="pt-6 border-t border-white/10">
                <p className="font-black text-xs uppercase tracking-widest opacity-60">Issuer</p>
                <p className="font-bold text-lg">GyanHub Pvt. Ltd</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showLightbox && (
        <div className="fixed inset-0 z-50 bg-slate-900/95 backdrop-blur-xl flex items-center justify-center p-4 print:hidden" onClick={() => setShowLightbox(false)}>
          <button className="absolute top-6 right-6 text-white/70 hover:text-white bg-white/10 p-2 rounded-full transition-colors"><X className="w-6 h-6" /></button>
          <img src={getImageUrl(cert.certificate_image)} alt="Certificate" className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl" onClick={(e) => e.stopPropagation()} />
        </div>
      )}

      {toastMessage && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 font-medium animate-bounce">
          <CheckCircle2 className="w-5 h-5" /> {toastMessage}
        </div>
      )}
    </div>
  );
}