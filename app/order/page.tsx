"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { 
  ArrowLeft, Lock, ShieldCheck, CheckCircle2, Info, User, Mail, 
  Phone, Loader2, UploadCloud, FileCheck, Receipt, GraduationCap, FileText, Sparkles
} from "lucide-react";

// --- TYPES ---
type OrderMode = "cv_phone" | "badge" | "course" | "unknown";

function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter(); 
  const supabase = createClient();

  // 1. SAFELY PARSE URL PARAMS (Always fallback to empty string)
  const requestType = searchParams.get("request_type")?.toLowerCase() || ""; 
  const orderType = searchParams.get("order_type")?.toLowerCase() || ""; 
  const tutorId = searchParams.get("tutor_id") || "";
  
  const urlName = searchParams.get("name") || "";
  const urlEmail = searchParams.get("email") || "";
  const urlPhone = searchParams.get("phone") || "";
  const urlTutorName = searchParams.get("tutor_name") || searchParams.get("tutorName") || "";
  const urlCourseName = searchParams.get("course_name") || "";
  const urlPrice = searchParams.get("price") || "0";

  // 2. DETERMINE ORDER MODE
  let currentMode: OrderMode = "unknown";
  if (orderType.includes("course") || requestType === "course") currentMode = "course";
  else if (orderType.includes("verif") || orderType.includes("batch") || orderType.includes("badge")) currentMode = "badge";
  else if (requestType === "cv" || requestType === "phone") currentMode = "cv_phone"; 

  // 3. FORM STATE
  const [fullName, setFullName] = useState(urlName);
  const [email, setEmail] = useState(urlEmail);
  const [contactNumber, setContactNumber] = useState(urlPhone);
  
  // 4. UPLOAD & POLICY STATE
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [agreeRefund, setAgreeRefund] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);

  // 5. DYNAMIC DATA STATE (For fetching tutor names)
  const [fetchedTutorName, setFetchedTutorName] = useState(urlTutorName);
  const [isFetchingData, setIsFetchingData] = useState(false);

  // 6. INITIALIZATION & DATA FETCHING EFFECT
  useEffect(() => {
    const initializeCheckout = async () => {
      setIsFetchingData(true);

      try {
        // Fetch User Info if missing (from Supabase Auth)
        if (!urlName || !urlEmail) {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            if (!urlName) setFullName(user.user_metadata?.full_name || '');
            if (!urlEmail) setEmail(user.email || '');
          }
        }

        // Fetch Tutor Name if missing, but we have an ID
        if (tutorId && !urlTutorName && currentMode === 'cv_phone') {
          const { data, error } = await supabase
            .from('tutors')
            .select('name, full_name')
            .eq('id', tutorId)
            .single();

          if (data) {
            setFetchedTutorName(data.full_name || data.name || `Tutor #${tutorId}`);
          } else {
            setFetchedTutorName(`Tutor #${tutorId}`);
          }
        }
      } catch (error) {
        console.error("Initialization Error:", error);
      } finally {
        setIsFetchingData(false);
      }
    };

    initializeCheckout();
  }, [tutorId, urlTutorName, urlName, urlEmail, currentMode, supabase]);

  // 7. CONFIGURE UI BASED ON MODE
  const getOrderConfig = () => {
    switch (currentMode) {
      case "course":
        return {
          title: `Course Enrollment: ${urlCourseName || 'Selected Course'}`,
          provider: fetchedTutorName || "GyanHub Courses",
          price: parseInt(urlPrice) || 0,
          icon: <GraduationCap className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />,
          notice: `You are securing your enrollment for "${urlCourseName || 'this course'}". We will process your deposit and lock your discount for online class within 24 hours.`,
          noticeStyle: "bg-blue-50 border-blue-200/60 text-blue-800",
          noticeIcon: <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
        };
      case "badge":
        return {
          title: "Verification Badge (One-year)",
          provider: fullName || urlName || "Your Profile",
          price: 500,
          icon: <ShieldCheck className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />,
          notice: "You must submit original documents later. Badge won't be verified otherwise and payment is non-refundable.",
          noticeStyle: "bg-amber-50 border-amber-200/60 text-amber-800",
          noticeIcon: <Info className="w-5 h-5 shrink-0 mt-0.5" />
        };
      case "cv_phone":
        return {
          title: "Curriculum Vitae & Contact Number",
          provider: fetchedTutorName || `Tutor #${tutorId || 'Unknown'}`,
          price: 1000,
          icon: <FileText className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />,
          notice: "Bonus Highlight: We will provide you BOTH the CV and the Direct Contact Details within 24 hours via WhatsApp and Email.",
          noticeStyle: "bg-emerald-50 border-emerald-200/60 text-emerald-800",
          noticeIcon: <Sparkles className="w-5 h-5 shrink-0 mt-0.5 text-emerald-600" />
        };
      default:
        return {
          title: "Unknown Service",
          provider: "Unknown",
          price: 0,
          icon: <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />,
          notice: "Invalid request. Please go back and try again.",
          noticeStyle: "bg-slate-50 border-slate-200/60 text-slate-800",
          noticeIcon: <Info className="w-5 h-5 shrink-0 mt-0.5" />
        };
    }
  };

  const config = getOrderConfig();
  
  // Safe string formatting
  const amountInWords = config.price === 1000 ? "One Thousand Rupees" : config.price === 500 ? "Five Hundred Rupees" : `${config.price.toLocaleString()} Rupees`;
  const avatarInitial = config.provider ? config.provider.charAt(0).toUpperCase() : 'G';

  // 8. VALIDATION
  const isPhoneValid = contactNumber.replace(/\D/g, '').length >= 10;
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isNameValid = fullName.trim().length > 2;
  const isFormValid = isPhoneValid && isEmailValid && isNameValid && screenshot && agreeRefund && agreePrivacy && !isFetchingData && currentMode !== "unknown";

  // 9. SUBMIT HANDLER
  const handleSubmit = async () => {
    if (!isFormValid || !screenshot) return;
    
    setIsUploading(true);
    try {
      // Create a unique file name
      const fileExt = screenshot.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `receipts/${fileName}`;

      // 1. Upload logic (UNCOMMENTED!)
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('others')
        .upload(filePath, screenshot);
        
      if (uploadError) throw uploadError;

      // 2. Database insert logic (UNCOMMENTED AND MAPPED TO YOUR SQL!)
      const { error: dbError } = await supabase.from('orders').insert([{
        full_name: fullName,
        email: email,
        contact_number: contactNumber,
        order_type: currentMode,
        tutor_name: config.provider, // Mapped to your SQL column
        price: config.price,
        screenshot_url: uploadData.path,
        agreed_refund_policy: agreeRefund,
        agreed_privacy_policy: agreePrivacy
      }]);
      
      if (dbError) throw dbError;

      alert("Order submitted successfully!");
      router.push("/"); 
      
    } catch (error: any) {
      console.error("Error submitting order:", error);
      alert(`Failed to submit order: ${error.message || 'Please try again.'}`);
      setIsUploading(false); 
    } 
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-24 relative selection:bg-blue-100">
      
      {/* HEADER */}
      <header className="bg-white border-b border-slate-200 px-4 py-4 md:px-8 flex items-center justify-between sticky top-0 z-40">
        <button onClick={() => window.history.back()} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors group">
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="font-medium">Back</span>
        </button>
        <div className="flex items-center gap-2 text-slate-700">
          <Lock className="w-4 h-4 text-emerald-600" />
          <span className="font-medium text-sm">Secure Checkout</span>
        </div>
        <div className="w-16"></div>
      </header>

      {/* MAIN CONTENT */}
      <main className="max-w-6xl mx-auto px-4 md:px-8 pt-8 md:pt-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
          
          {/* LEFT COLUMN */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Contact Information */}
            <section className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                <User className="w-5 h-5 text-blue-600" /> Contact Information
              </h2>
              <div className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Name <span className="text-red-500">*</span></label>
                    <div className="flex items-center border border-slate-300 rounded-xl focus-within:ring-4 focus-within:ring-blue-600/10 focus-within:border-blue-600 bg-white transition-all overflow-hidden">
                      <div className="pl-4 text-slate-400"><User className="w-4 h-4" /></div>
                      <input 
                        type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="John Doe"
                        className="w-full px-3 py-3 outline-none bg-transparent font-medium text-slate-900 placeholder:text-slate-400"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Email Address <span className="text-red-500">*</span></label>
                    <div className="flex items-center border border-slate-300 rounded-xl focus-within:ring-4 focus-within:ring-blue-600/10 focus-within:border-blue-600 bg-white transition-all overflow-hidden">
                      <div className="pl-4 text-slate-400"><Mail className="w-4 h-4" /></div>
                      <input 
                        type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com"
                        className="w-full px-3 py-3 outline-none bg-transparent font-medium text-slate-900 placeholder:text-slate-400"
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Contact Number <span className="text-red-500">*</span></label>
                  <div className="flex items-center border border-slate-300 rounded-xl focus-within:ring-4 focus-within:ring-blue-600/10 focus-within:border-blue-600 bg-white transition-all overflow-hidden group">
                    <span className="flex items-center gap-2 text-slate-500 px-4 py-3 border-r border-slate-200 font-medium bg-slate-50">
                      <Phone className="w-4 h-4" /> +977
                    </span>
                    <input 
                      type="tel" value={contactNumber} onChange={(e) => setContactNumber(e.target.value)} placeholder="98XXXXXXXX"
                      className="w-full px-4 py-3 outline-none bg-transparent font-medium text-slate-900 placeholder:text-slate-400"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Payment Method */}
            <section className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" /> Payment Method
                </h2>
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg w-fit">
                  <Lock className="w-3.5 h-3.5" /> 100% Secure Checkout
                </div>
              </div>

              <div className="border-2 border-emerald-500/20 bg-emerald-50/50 rounded-2xl p-6 relative overflow-hidden flex flex-col items-center justify-center text-center">
                <p className="text-sm font-semibold text-slate-600 mb-4">Scan QR to pay securely via Fonepay</p>
                <img 
                  src="https://zuktarghyexwodqnnxlu.supabase.co/storage/v1/object/public/others/Bank%20QR.jpg" 
                  alt="Fonepay Accepted Here" 
                  className="w-full max-w-[280px] h-auto drop-shadow-sm object-contain mix-blend-multiply"
                />
              </div>

              <div className="mt-8">
                <div className="bg-blue-50/50 border border-blue-100 p-5 rounded-2xl leading-relaxed mb-6 flex gap-3">
                  <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                  <p className="text-[14.5px] text-slate-700">
                    You have to deposit <strong className="text-slate-900">{amountInWords}</strong> and upload a screenshot below. Payment will be verified and the service activated within 24 hours. Support: <strong className="text-blue-700">9763695665</strong>.
                  </p>
                </div>

                <label className="block text-sm font-bold text-slate-800 mb-3">Upload Payment Screenshot <span className="text-red-500">*</span></label>
                <div className="flex items-center justify-center w-full">
                  <label htmlFor="dropzone-file" className={`flex flex-col items-center justify-center w-full h-36 border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-200 ${screenshot ? 'border-emerald-500 bg-emerald-50 hover:bg-emerald-100' : 'border-slate-300 bg-slate-50 hover:bg-slate-100'}`}>
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      {screenshot ? (
                        <>
                          <FileCheck className="w-10 h-10 text-emerald-500 mb-2" />
                          <p className="text-sm text-emerald-700 font-bold">{screenshot.name}</p>
                          <p className="text-xs text-emerald-600/70 mt-1 font-medium">Click to change file</p>
                        </>
                      ) : (
                        <>
                          <UploadCloud className="w-10 h-10 text-slate-400 mb-3" />
                          <p className="mb-1 text-sm text-slate-600"><span className="font-bold text-blue-600">Click to upload</span> or drag and drop</p>
                          <p className="text-xs text-slate-400 font-medium">PNG, JPG or JPEG (MAX. 5MB)</p>
                        </>
                      )}
                    </div>
                    <input 
                      id="dropzone-file" type="file" accept="image/*" className="hidden" 
                      onChange={(e) => { if (e.target.files && e.target.files.length > 0) setScreenshot(e.target.files[0]); }}
                    />
                  </label>
                </div>
              </div>
            </section>
          </div>

          {/* RIGHT COLUMN */}
          <div className="lg:col-span-5">
            <div className="sticky top-24 bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col gap-6">
              
              <h2 className="text-xl font-bold pb-4 border-b border-slate-100 text-slate-900 flex items-center gap-2">
                <Receipt className="w-5 h-5 text-blue-600" /> Order Summary
              </h2>
              
              <div className="bg-gradient-to-br from-slate-50 to-blue-50/30 border border-slate-200/60 rounded-2xl p-5 space-y-4 shadow-sm">
                <div className="flex justify-between items-start gap-4 pb-5 border-b border-slate-200/60">
                  <span className="text-slate-500 text-xs font-bold uppercase tracking-wider shrink-0 pt-0.5">Service Requested</span>
                  <div className="flex items-start gap-2 max-w-[65%] justify-end text-right">
                    <div className="shrink-0 pt-0.5">{config.icon}</div>
                    <strong className="text-slate-900 font-bold whitespace-normal break-words leading-tight">
                      {config.title}
                    </strong>
                  </div>
                </div>

                <div className="flex justify-between items-start gap-4 pt-5">
                  <span className="text-slate-500 text-xs font-bold uppercase tracking-wider shrink-0 pt-1.5">
                    {currentMode === 'course' ? 'Provider Name' : 'Tutor Name'}
                  </span>
                  <div className="flex items-start justify-end gap-2.5 max-w-[65%] text-right">
                    {isFetchingData ? (
                      <Loader2 className="w-4 h-4 text-blue-600 animate-spin mt-1" />
                    ) : (
                      <>
                        <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs shrink-0 mt-0.5">
                          {avatarInitial}
                        </div>
                        <strong className="text-slate-900 font-bold whitespace-normal break-words leading-tight pt-1">
                          {config.provider}
                        </strong>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Dynamic Notice Box */}
              <div className={`border rounded-2xl p-4 flex gap-3 shadow-sm ${config.noticeStyle}`}>
                {config.noticeIcon}
                <p className="text-sm leading-relaxed font-medium">{config.notice}</p>
              </div>

              <div className="pt-2">
                <div className="flex items-center justify-between mb-6 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <span className="text-slate-600 font-bold">Total Amount</span>
                  <span className="text-2xl font-black text-slate-900 tracking-tight">
                    Rs. {config.price.toLocaleString()}
                  </span>
                </div>

                <div className="space-y-3.5 mb-6">
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <div className="relative flex items-center justify-center mt-0.5">
                      <input type="checkbox" checked={agreeRefund} onChange={(e) => setAgreeRefund(e.target.checked)} className="peer w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer" />
                    </div>
                    <span className="text-[13px] text-slate-600 leading-snug group-hover:text-slate-800 transition-colors">
                      I have read and agree to the <a href="/refund" className="text-blue-600 hover:underline font-semibold" target="_blank">Refund & Return Policy</a>.
                    </span>
                  </label>
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <div className="relative flex items-center justify-center mt-0.5">
                      <input type="checkbox" checked={agreePrivacy} onChange={(e) => setAgreePrivacy(e.target.checked)} className="peer w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer" />
                    </div>
                    <span className="text-[13px] text-slate-600 leading-snug group-hover:text-slate-800 transition-colors">
                      I have read and agree to the <a href="/privacy-policy" className="text-blue-600 hover:underline font-semibold" target="_blank">User's data policy</a>.
                    </span>
                  </label>
                </div>

                <button 
                  disabled={!isFormValid || isUploading || isFetchingData}
                  onClick={handleSubmit}
                  className={`w-full py-4 rounded-2xl text-white font-bold text-lg transition-all flex justify-center items-center gap-2 ${
                    (isFormValid && !isUploading && !isFetchingData)
                      ? "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg shadow-blue-600/20 hover:shadow-blue-600/40 hover:-translate-y-0.5" 
                      : "bg-slate-200 text-slate-400 cursor-not-allowed"
                  }`}
                >
                  {isUploading ? <><Loader2 className="w-5 h-5 animate-spin" /> Processing...</> : <><Lock className="w-5 h-5" /> Complete Order</>}
                </button>
                
                {!isFormValid && (
                  <p className="text-center text-xs text-slate-500 mt-4 font-medium flex items-center justify-center gap-1.5">
                    <Info className="w-3.5 h-3.5" /> Complete all fields to enable payment
                  </p>
                )}
              </div>

            </div>
          </div>

        </div>
      </main>
    </div>
  );
}

export default function CheckoutPage() {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => setIsMounted(true), []);
  if (!isMounted) return null;

  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-slate-500 gap-4"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /><p className="font-medium text-slate-600">Loading secure checkout...</p></div>}>
      <CheckoutContent />
    </Suspense>
  );
}