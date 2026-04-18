"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { 
  ArrowLeft, Lock, ShieldCheck, CheckCircle2, Info, User, Mail, 
  Phone, Loader2, UploadCloud, FileCheck, Receipt, GraduationCap, 
  FileText, Sparkles, PlayCircle, MessageCircle, Tag
} from "lucide-react";

// --- TYPES ---
type OrderMode = "cv_phone" | "badge" | "course" | "recording" | "unknown";

// --- IMAGE COMPRESSION UTILITY ---
// Compresses image to WebP format for maximum storage savings
const compressImage = (file: File): Promise<File> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Failed to get canvas context'));

        // Max dimensions for the screenshot to save space
        const MAX_WIDTH = 1200;
        const MAX_HEIGHT = 1200;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        // Export as WebP with 0.5 quality for extreme compression
        canvas.toBlob(
          (blob) => {
            if (!blob) return reject(new Error('Canvas is empty'));
            // Rename file extension to .webp
            const newFileName = file.name.replace(/\.[^/.]+$/, ".webp");
            const compressedFile = new File([blob], newFileName, {
              type: 'image/webp',
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          },
          'image/webp',
          0.5 
        );
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
};

function CheckoutContent() {
  // 0. FIX: SCROLL TO TOP ON MOUNT
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, []);

  const searchParams = useSearchParams();
  const router = useRouter(); 
  const supabase = createClient();

  // 1. SAFELY PARSE URL PARAMS
  const urlType = searchParams.get("type")?.toLowerCase() || ""; 
  const requestType = searchParams.get("request_type")?.toLowerCase() || ""; 
  const orderType = searchParams.get("order_type")?.toLowerCase() || ""; 
  const tutorId = searchParams.get("tutor_id") || "";
  
  const urlName = searchParams.get("name") || "";
  const urlEmail = searchParams.get("email") || "";
  const urlPhone = searchParams.get("phone") || "";
  const urlTutorName = searchParams.get("tutor_name") || searchParams.get("tutorName") || "";
  const urlCourseName = searchParams.get("courseName") || searchParams.get("course_name") || "";
  const urlPrice = searchParams.get("price") || "0";

  // 2. DETERMINE ORDER MODE
  let currentMode: OrderMode = "unknown";
  if (urlType === "recording") currentMode = "recording";
  else if (orderType.includes("course") || requestType === "course") currentMode = "course";
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
  const [showRecordingSuccess, setShowRecordingSuccess] = useState(false);

  // 5. DYNAMIC DATA STATE
  const [fetchedTutorName, setFetchedTutorName] = useState(urlTutorName);
  const [isFetchingData, setIsFetchingData] = useState(false);

  // 6. INITIALIZATION & DATA FETCHING
  useEffect(() => {
    const initializeCheckout = async () => {
      setIsFetchingData(true);
      try {
        if (!urlName || !urlEmail) {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            if (!urlName) setFullName(user.user_metadata?.full_name || '');
            if (!urlEmail) setEmail(user.email || '');
          }
        }
        if (tutorId && !urlTutorName && currentMode === 'cv_phone') {
          const { data, error } = await supabase
            .from('tutors')
            .select('name, full_name')
            .eq('id', tutorId)
            .single();

          if (data) setFetchedTutorName(data.full_name || data.name || `Tutor #${tutorId}`);
          else setFetchedTutorName(`Tutor #${tutorId}`);
        }
      } catch (error) {
        console.error("Initialization Error:", error);
      } finally {
        setIsFetchingData(false);
      }
    };
    initializeCheckout();
  }, [tutorId, urlTutorName, urlName, urlEmail, currentMode, supabase]);

  // 7. CONFIGURE UI AND DATA BASED ON MODE
  const getOrderConfig = () => {
    switch (currentMode) {
      case "recording":
        return {
          title: "Recording Video Access",
          orderName: urlCourseName || "Selected Course",
          price: parseInt(urlPrice) || 0,
          icon: <PlayCircle className="w-5 h-5 text-indigo-600 shrink-0" />,
          notice: `You are purchasing instant access to "${urlCourseName || 'this course'}". Please complete the payment to proceed.`,
          noticeStyle: "bg-blue-50 border-blue-200/60 text-blue-800",
          noticeIcon: <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
        };
      case "course":
        return {
          title: "Online Course Enrollment",
          orderName: urlCourseName || "Selected Course",
          price: parseInt(urlPrice) || 0,
          icon: <GraduationCap className="w-5 h-5 text-indigo-600 shrink-0" />,
          notice: `You are securing your enrollment for "${urlCourseName || 'this course'}". We will process your deposit and lock your discount for the online class within 24 hours.`,
          noticeStyle: "bg-blue-50 border-blue-200/60 text-blue-800",
          noticeIcon: <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
        };
      case "badge":
        return {
          title: "Verification Badge (1-Year)",
          orderName: fullName || urlName || "Your Profile Verification",
          price: 500,
          icon: <ShieldCheck className="w-5 h-5 text-indigo-600 shrink-0" />,
          notice: "You must submit original documents later. Badge won't be verified otherwise and payment is non-refundable.",
          noticeStyle: "bg-amber-50 border-amber-200/60 text-amber-800",
          noticeIcon: <Info className="w-5 h-5 shrink-0 mt-0.5" />
        };
      case "cv_phone":
        return {
          title: "CV & Contact Detail Unlock",
          orderName: fetchedTutorName || `Tutor #${tutorId || 'Unknown'}`,
          price: 1000,
          icon: <FileText className="w-5 h-5 text-indigo-600 shrink-0" />,
          notice: "Bonus Highlight: We will provide you BOTH the CV and the Direct Contact Details within 24 hours via WhatsApp and Email.",
          noticeStyle: "bg-emerald-50 border-emerald-200/60 text-emerald-800",
          noticeIcon: <Sparkles className="w-5 h-5 shrink-0 mt-0.5 text-emerald-600" />
        };
      default:
        return {
          title: "Unknown Service",
          orderName: "Unknown",
          price: 0,
          icon: <Info className="w-5 h-5 text-slate-400 shrink-0" />,
          notice: "Invalid request. Please go back and try again.",
          noticeStyle: "bg-slate-50 border-slate-200/60 text-slate-800",
          noticeIcon: <Info className="w-5 h-5 shrink-0 mt-0.5" />
        };
    }
  };

  const config = getOrderConfig();
  const amountInWords = config.price === 1000 ? "One Thousand Rupees" : config.price === 500 ? "Five Hundred Rupees" : `${config.price.toLocaleString()} Rupees`;

  // 8. VALIDATION CHECKS
  const isPhoneValid = contactNumber.replace(/\D/g, '').length >= 10;
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isNameValid = fullName.trim().length > 2;

  // 9. SUBMIT HANDLER
  const handleSubmit = async () => {
    // Check and point users to missing fields
    if (!isNameValid) { alert("Please enter your Full Name."); document.getElementById("fullName")?.focus(); return; }
    if (!isEmailValid) { alert("Please enter a valid Email Address."); document.getElementById("email")?.focus(); return; }
    if (!isPhoneValid) { alert("Please enter a valid Contact Number (at least 10 digits)."); document.getElementById("contactNumber")?.focus(); return; }
    if (!screenshot) { alert("Please upload your payment screenshot."); document.getElementById("dropzone-file")?.focus(); return; }
    if (!agreeRefund) { alert("Please agree to the Refund & Return Policy."); document.getElementById("agreeRefund")?.focus(); return; }
    if (!agreePrivacy) { alert("Please agree to the User's Data Policy."); document.getElementById("agreePrivacy")?.focus(); return; }
    if (currentMode === "unknown") { alert("Invalid order type. Please restart the checkout process."); return; }

    setIsUploading(true);
    try {
      // --- COMPRESS THE IMAGE BEFORE UPLOAD ---
      const compressedScreenshot = await compressImage(screenshot);

      const fileExt = compressedScreenshot.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `receipts/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('others')
        .upload(filePath, compressedScreenshot); // Upload the compressed file
        
      if (uploadError) throw uploadError;

      // Inserting exact columns per the DB Schema
      const { error: dbError } = await supabase.from('orders').insert([{
        full_name: fullName,
        email: email,
        contact_number: contactNumber,
        order_type: currentMode,
        order_name: config.orderName,
        price: config.price,
        screenshot_url: uploadData.path,
        agreed_refund_policy: agreeRefund,
        agreed_privacy_policy: agreePrivacy
      }]);
      
      if (dbError) throw dbError;

      if (currentMode === "recording") {
        setIsUploading(false);
        setShowRecordingSuccess(true);
      } else {
        alert("Order submitted successfully!");
        // --- UPDATED REDIRECT TO /dashboard ---
        router.push("/dashboard"); 
      }
      
    } catch (error: any) {
      console.error("Error submitting order:", error);
      alert(`Failed to submit order: ${error.message || 'Please try again.'}`);
      setIsUploading(false); 
    } 
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-24 relative selection:bg-blue-100">
      {/* FLOATING WHATSAPP BUTTON */}
      <a 
        href="https://wa.me/9763695665" 
        target="_blank" 
        rel="noopener noreferrer" 
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-[#25D366] text-white px-5 py-3.5 rounded-full shadow-xl hover:-translate-y-1 hover:shadow-2xl hover:bg-[#20b858] transition-all font-bold group border border-[#20b858]/50"
      >
        <MessageCircle className="w-6 h-6" />
        <span className="hidden sm:inline">Immediate Support</span>
      </a>

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
                    <label htmlFor="fullName" className="block text-sm font-medium text-slate-700 mb-1.5">Full Name <span className="text-red-500">*</span></label>
                    <div className="flex items-center border border-slate-300 rounded-xl focus-within:ring-4 focus-within:ring-blue-600/10 focus-within:border-blue-600 bg-white transition-all overflow-hidden">
                      <div className="pl-4 text-slate-400"><User className="w-4 h-4" /></div>
                      <input 
                        id="fullName"
                        type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="John Doe"
                        className="w-full px-3 py-3 outline-none bg-transparent font-medium text-slate-900 placeholder:text-slate-400"
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">Email Address <span className="text-red-500">*</span></label>
                    <div className="flex items-center border border-slate-300 rounded-xl focus-within:ring-4 focus-within:ring-blue-600/10 focus-within:border-blue-600 bg-white transition-all overflow-hidden">
                      <div className="pl-4 text-slate-400"><Mail className="w-4 h-4" /></div>
                      <input 
                        id="email"
                        type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com"
                        className="w-full px-3 py-3 outline-none bg-transparent font-medium text-slate-900 placeholder:text-slate-400"
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <label htmlFor="contactNumber" className="block text-sm font-medium text-slate-700 mb-1.5">Contact Number <span className="text-red-500">*</span></label>
                  <div className="flex items-center border border-slate-300 rounded-xl focus-within:ring-4 focus-within:ring-blue-600/10 focus-within:border-blue-600 bg-white transition-all overflow-hidden group">
                    <span className="flex items-center gap-2 text-slate-500 px-4 py-3 border-r border-slate-200 font-medium bg-slate-50">
                      <Phone className="w-4 h-4" /> +977
                    </span>
                    <input 
                      id="contactNumber"
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
                          <p className="text-xs text-slate-400 font-medium">PNG, JPG or JPEG (Will be compressed to WEBP automatically)</p>
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
              
              {/* ATTRACTIVE ORDER TYPE & NAME */}
              <div className="bg-gradient-to-br from-indigo-50 via-blue-50/50 to-white border border-indigo-100/80 rounded-2xl p-6 space-y-5 shadow-sm">
                
                {/* Order Type */}
                <div className="flex flex-col gap-2">
                  <span className="text-indigo-500 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5" /> Order Type
                  </span>
                  <div className="flex items-center gap-2.5">
                    {config.icon}
                    <strong className="text-slate-900 font-black text-lg leading-tight">
                      {config.title}
                    </strong>
                  </div>
                </div>

                <div className="w-full h-px bg-indigo-100/60"></div>

                {/* Order Name */}
                <div className="flex flex-col gap-2">
                  <span className="text-indigo-500 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" /> Reference Name
                  </span>
                  {isFetchingData ? (
                    <div className="flex items-center gap-2 text-indigo-600">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm font-semibold">Loading data...</span>
                    </div>
                  ) : (
                    <div className="inline-flex w-fit px-3 py-1.5 bg-indigo-100/50 text-indigo-800 rounded-lg border border-indigo-200/50">
                      <strong className="font-bold whitespace-normal break-words leading-tight">
                        {config.orderName}
                      </strong>
                    </div>
                  )}
                </div>
              </div>

              {/* RECORDINGS HIGHLIGHT (Google Classroom Notice) */}
              {currentMode === 'recording' && (
                <div className="bg-emerald-50 border-2 border-emerald-500/20 p-5 rounded-2xl flex gap-3 shadow-sm mb-2">
                  <GraduationCap className="w-6 h-6 text-emerald-600 shrink-0" />
                  <p className="text-sm font-bold text-emerald-900 leading-snug">
                    You will be added to Google Classroom where you will find all class recordings and study materials immediately after payment.
                  </p>
                </div>
              )}

              {/* Dynamic Standard Notice Box */}
              {currentMode !== 'recording' && (
                <div className={`border rounded-2xl p-4 flex gap-3 shadow-sm ${config.noticeStyle}`}>
                  {config.noticeIcon}
                  <p className="text-sm leading-relaxed font-medium">{config.notice}</p>
                </div>
              )}

              <div className="pt-2">
                <div className="flex items-center justify-between mb-6 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <span className="text-slate-600 font-bold">Total Amount</span>
                  <span className="text-2xl font-black text-slate-900 tracking-tight">
                    Rs. {config.price.toLocaleString()}
                  </span>
                </div>

                <div className="space-y-3.5 mb-6">
                  <label htmlFor="agreeRefund" className="flex items-start gap-3 cursor-pointer group">
                    <div className="relative flex items-center justify-center mt-0.5">
                      <input id="agreeRefund" type="checkbox" checked={agreeRefund} onChange={(e) => setAgreeRefund(e.target.checked)} className="peer w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer" />
                    </div>
                    <span className="text-[13px] text-slate-600 leading-snug group-hover:text-slate-800 transition-colors">
                      I have read and agree to the <a href="/refund" className="text-blue-600 hover:underline font-semibold" target="_blank">Refund & Return Policy</a>.
                    </span>
                  </label>
                  <label htmlFor="agreePrivacy" className="flex items-start gap-3 cursor-pointer group">
                    <div className="relative flex items-center justify-center mt-0.5">
                      <input id="agreePrivacy" type="checkbox" checked={agreePrivacy} onChange={(e) => setAgreePrivacy(e.target.checked)} className="peer w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer" />
                    </div>
                    <span className="text-[13px] text-slate-600 leading-snug group-hover:text-slate-800 transition-colors">
                      I have read and agree to the <a href="/privacy-policy" className="text-blue-600 hover:underline font-semibold" target="_blank">User's data policy</a>.
                    </span>
                  </label>
                </div>

                <button 
                  disabled={isUploading || isFetchingData}
                  onClick={handleSubmit}
                  className={`w-full py-4 rounded-2xl font-bold text-lg transition-all flex justify-center items-center gap-2 ${
                    (isUploading || isFetchingData)
                      ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                      : "bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 shadow-lg shadow-blue-600/20 hover:shadow-blue-600/40 hover:-translate-y-0.5" 
                  }`}
                >
                  {isUploading ? <><Loader2 className="w-5 h-5 animate-spin" /> Processing...</> : <><Lock className="w-5 h-5" /> Complete Order</>}
                </button>
              </div>

            </div>
          </div>

        </div>
      </main>

      {/* --- SUCCESS MODAL FOR RECORDINGS --- */}
      {showRecordingSuccess && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-[28px] p-8 max-w-md w-full shadow-2xl text-center flex flex-col items-center animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6 shadow-sm border-4 border-white">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            
            <h3 className="text-2xl font-black text-slate-900 mb-2">Thank you!</h3>
            <p className="text-slate-600 font-medium mb-5 leading-relaxed">
              Thank you for choosing GyanHub for the recording course of <strong className="text-slate-900">"{urlCourseName}"</strong>.
            </p>
            
            <div className="bg-blue-50 border border-blue-100 p-4.5 rounded-[16px] text-sm text-blue-800 mb-8 text-left w-full">
              You will get an invitation to join Google Classroom in your email within half an hour. For any queries or problems, please message us at <a href="https://wa.me/9763695665" target="_blank" rel="noopener noreferrer" className="font-bold underline text-blue-900">9763695665 on WhatsApp</a>.
            </div>
            
            {/* --- UPDATED REDIRECT AND BUTTON TEXT --- */}
            <button 
              onClick={() => router.push("/dashboard")} 
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 rounded-[14px] transition-all shadow-md hover:shadow-lg active:scale-[0.98]"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      )}
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