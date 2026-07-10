"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { 
  ArrowLeft, Lock, ShieldCheck, CheckCircle2, Info, User, Mail, 
  Phone, Loader2, UploadCloud, FileCheck, Receipt, GraduationCap, 
  FileText, Sparkles, PlayCircle, MessageCircle, Tag, Users
} from "lucide-react";

// --- TYPES ---
type OrderMode = "cv_phone" | "badge" | "course" | "physical_course" | "recording" | "unknown";

// --- HELPERS ---
function convertOrderType(orderType: string): OrderMode {
  if (!orderType) return "unknown";
  const lowerCaseType = orderType.toLowerCase();
  
  if (lowerCaseType === "online course") return "course";
  if (lowerCaseType === "offline course" || lowerCaseType === "physical class") return "physical_course";
  if (lowerCaseType === "recording") return "recording";
  if (lowerCaseType.includes("verification") || lowerCaseType.includes("badge") || lowerCaseType.includes("batch")) return "badge";
  if (lowerCaseType.includes("tutoring") || lowerCaseType.includes("cv") || lowerCaseType.includes("phone")) return "cv_phone";
  
  return "unknown";
}

function getModeFromUrl(urlType: string, requestType: string, orderTypeParam: string): OrderMode {
  if (urlType === "recording") return "recording";
  if (
    orderTypeParam === "offline course" ||
    orderTypeParam === "physical class"
  )
    return "physical_course";

  if (
    orderTypeParam.includes("course") ||
    requestType === "course" ||
    orderTypeParam === "online course"
  )
    return "course";

  if (
    orderTypeParam.includes("verif") ||
    orderTypeParam.includes("batch") ||
    orderTypeParam.includes("badge")
  )
    return "badge";

  if (
    requestType === "cv" ||
    requestType === "phone" ||
    orderTypeParam === "tutoring"
  )
    return "cv_phone";

  return "unknown";
}

// --- IMAGE COMPRESSION UTILITY ---
const compressImage = (file: File): Promise<File> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new window.Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Failed to get canvas context'));

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

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Canvas is empty"));
              return;
            }

            const newFileName = file.name.replace(/\.[^/.]+$/, ".webp");
            resolve(
              new File([blob], newFileName, {
                type: "image/webp",
                lastModified: Date.now(),
              })
            );
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

const normalizeOrderType = (orderType: string) => {
  switch (orderType) {
    case "Offline Course":
      return "Physical Class";
    default:
      return orderType;
  }
};

function CheckoutContent() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const searchParams = useSearchParams();
  const router = useRouter(); 
  const supabase = createClient();

  // 1. SAFELY PARSE URL PARAMS
  const urlType = searchParams.get("type")?.toLowerCase() || ""; 
  const requestType = searchParams.get("request_type")?.toLowerCase() || ""; 
  const orderTypeParam = searchParams.get("order_type")?.toLowerCase() || ""; 
  const tutorId = searchParams.get("tutor_id") || "";
  
  const urlName = searchParams.get("name") || "";
  const urlEmail = searchParams.get("email") || "";
  const urlPhone = searchParams.get("phone") || "";
  const urlTutorName = searchParams.get("tutor_name") || searchParams.get("tutorName") || "";
  const urlCourseName = searchParams.get("courseName") || searchParams.get("course_name") || "";
  const urlPrice = searchParams.get("price") || "0"; 
  
  const urlEnrollmentId = searchParams.get("enrollment_id") || searchParams.get("enrollmentId") || null;
  const urlOrderId = searchParams.get("order_id") || searchParams.get("orderId") || null; 
  const urlLockedPrice = searchParams.get("locked_price") || null;

  // FIELD LOCKING STATE: Lock it down if data came from URL OR if it gets pulled from Authenticated User profile
  const [isNameLocked, setIsNameLocked] = useState<boolean>(Boolean(urlName));
  const [isEmailLocked, setIsEmailLocked] = useState<boolean>(Boolean(urlEmail));
  const [isPhoneLocked, setIsPhoneLocked] = useState<boolean>(Boolean(urlPhone));

  // 2. DETERMINE ORDER MODE
  const [currentMode, setCurrentMode] = useState<OrderMode>("unknown");

  // 3. BULLETPROOF FORM STATE
  const [fullName, setFullName] = useState<string>(urlName || "");
  const [email, setEmail] = useState<string>(urlEmail || "");
  const [contactNumber, setContactNumber] = useState<string>(urlPhone || "");
  
  // 4. UPLOAD & POLICY STATE
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [agreeRefund, setAgreeRefund] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [showRecordingSuccess, setShowRecordingSuccess] = useState(false);

  // 5. DYNAMIC DATA STATE
  const [fetchedTutorName, setFetchedTutorName] = useState(urlTutorName);
  const [isFetchingData, setIsFetchingData] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [fetchedLockedPrice, setFetchedLockedPrice] = useState<number | null>(null);

  // 6. INITIALIZATION & DATA FETCHING
  useEffect(() => {
    const initializeCheckout = async () => {
      setIsFetchingData(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setCurrentUserId(user.id);
          
          // Apply User Profile Data and Lock Field 
          if (!urlName && user.user_metadata?.full_name) {
            setFullName(user.user_metadata.full_name);
            setIsNameLocked(true);
          }
          if (!urlEmail && user.email) {
            setEmail(user.email);
            setIsEmailLocked(true);
          }
          if (!urlPhone && user.phone) {
            setContactNumber(user.phone);
            setIsPhoneLocked(true);
          }
        }

        let determinedMode: OrderMode | null = null;

        // Priority 1: Existing Order ID
        if (urlOrderId) {
          const { data: existingOrder } = await supabase
            .from('orders_v2')
            .select('order_type')
            .eq('id', urlOrderId)
            .maybeSingle();

          if (existingOrder?.order_type) {
            determinedMode = convertOrderType(existingOrder.order_type);
          }
        }

        // Priority 2: Existing Enrollment ID
        if (!determinedMode && urlEnrollmentId) {
          const { data: existingOrder } = await supabase
            .from('orders_v2')
            .select('order_type')
            .eq('enrollment_id', urlEnrollmentId)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (existingOrder?.order_type) {
            determinedMode = convertOrderType(existingOrder.order_type);
          }
        }

        // Priority 3: URL Fallback
        if (!determinedMode) {
          determinedMode = getModeFromUrl(urlType, requestType, orderTypeParam);
        }

        setCurrentMode(determinedMode);

        // Fetch dependent data based on determinedMode
        if (tutorId && !urlTutorName && determinedMode === 'cv_phone') {
          const { data, error } = await supabase
            .from('tutors')
            .select('name, full_name')
            .eq('id', tutorId)
            .single();

          if (data) setFetchedTutorName(data.full_name || data.name || `Tutor #${tutorId}`);
          else setFetchedTutorName(`Tutor #${tutorId}`);
        }

        if (determinedMode === 'course' && urlCourseName && !urlOrderId) {
          const { data: syllabus } = await supabase
            .from('syllabi_v2')
            .select('id')
            .ilike('name', urlCourseName)
            .single();

          if (syllabus) {
            const { data: storefront } = await supabase
              .from('online_courses_v2')
              .select('fee')
              .eq('syllabus_id', syllabus.id)
              .single();
            
            if (storefront && storefront.fee) {
              setFetchedLockedPrice(storefront.fee); 
            }
          }
        }

      } catch (error) {
        console.error("Initialization Error:", error);
      } finally {
        setIsFetchingData(false);
      }
    };
    initializeCheckout();
  }, [tutorId, urlTutorName, urlName, urlEmail, urlPhone, urlCourseName, urlOrderId, urlEnrollmentId, urlType, requestType, orderTypeParam, supabase]);

  // 7. CONFIGURE UI AND DATA BASED ON MODE
  const getOrderConfig = () => {
    const customPrice = Number(urlPrice) || 0;

    switch (currentMode) {
      case "recording":
        return {
          title: "Recording Video Access", 
          orderName: urlCourseName || "Selected Course",
          price: customPrice,
          dbOrderType: "recording",
          icon: <PlayCircle className="w-5 h-5 text-indigo-600" />,
          noticeIcon: <Info className="w-5 h-5 text-indigo-600 shrink-0" />,
          noticeStyle: "bg-indigo-50/50 border-indigo-100 text-indigo-900",
          notice: "Payment for recording access. You will receive an email shortly with details."
        };
      case "course":
        return {
          title: "Online Course Enrollment", 
          orderName: urlCourseName || "Selected Course",
          price: customPrice, 
          dbOrderType: "Online Course",
          icon: <GraduationCap className="w-5 h-5 text-blue-600" />,
          noticeIcon: <Info className="w-5 h-5 text-blue-600 shrink-0" />,
          noticeStyle: "bg-blue-50/50 border-blue-100 text-blue-900",
          notice: "Your enrollment is currently pending. Please complete your payment below to secure your spot."
        };
      case "physical_course":
        return {
          title: "Offline Course Seat Reservation", 
          orderName: urlCourseName || "Selected Offline Course",
          price: customPrice, 
          dbOrderType: "Offline Course",
          icon: <Users className="w-5 h-5 text-purple-600" />,
          noticeIcon: <Info className="w-5 h-5 text-purple-600 shrink-0" />,
          noticeStyle: "bg-purple-50/50 border-purple-100 text-purple-900",
          notice: "Your seat reservation is currently pending. Complete the payment below to reserve."
        };
      case "badge":
        return {
          title: "Verification Badge (1-Year)", 
          orderName: fullName || urlName || "Your Profile Verification",
          dbOrderType: "Verification",
          price: customPrice,
          icon: <Sparkles className="w-5 h-5 text-amber-600" />,
          noticeIcon: <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0" />,
          noticeStyle: "bg-amber-50/50 border-amber-100 text-amber-900",
          notice: "Your verification request has been received. Complete payment to activate your badge."
        };
      case "cv_phone":
        return {
          title: "CV & Contact Detail Unlock", 
          orderName: fetchedTutorName || urlCourseName || `Tutor #${tutorId || 'Unknown'}`,
          dbOrderType: "Tutoring",
          price: customPrice,
          icon: <FileText className="w-5 h-5 text-emerald-600" />,
          noticeIcon: <Info className="w-5 h-5 text-emerald-600 shrink-0" />,
          noticeStyle: "bg-emerald-50/50 border-emerald-100 text-emerald-900",
          notice: "Complete payment below to unlock this profile's complete CV and contact information."
        };
      default:
        return {
          title: "Secure Checkout", 
          orderName: urlCourseName || "Selected Service",
          dbOrderType: "Unknown",
          price: customPrice,
          icon: <Receipt className="w-5 h-5 text-slate-600" />,
          noticeIcon: <Info className="w-5 h-5 text-slate-600 shrink-0" />,
          noticeStyle: "bg-slate-50/50 border-slate-200 text-slate-800",
          notice: "Please review your payment details before completing the checkout."
        };
    }
  };

  const config = getOrderConfig();
  const dbOrderType = normalizeOrderType(config.dbOrderType);
  const amountInWords = config.price === 1000 ? "One Thousand Rupees" : config.price === 500 ? "Five Hundred Rupees" : `${config.price.toLocaleString()} Rupees`;

  // 8. BULLETPROOF VALIDATION CHECKS
  const safePhone = contactNumber || '';
  const safeEmail = email || '';
  const safeName = fullName || '';

  const isPhoneValid = safePhone.replace(/\D/g, '').length >= 10;
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(safeEmail);
  const isNameValid = safeName.trim().length > 2;

  // 9. SUBMIT HANDLER
  const handleSubmit = async () => {
    if (!isNameValid) { alert("Please enter your Full Name."); document.getElementById("fullName")?.focus(); return; }
    if (!isEmailValid) { alert("Please enter a valid Email Address."); document.getElementById("email")?.focus(); return; }
    if (!isPhoneValid) { alert("Please enter a valid Contact Number (at least 10 digits)."); document.getElementById("contactNumber")?.focus(); return; }
    if (!screenshot) { alert("Please upload your payment screenshot."); document.getElementById("dropzone-file")?.focus(); return; }
    if (!agreeRefund) { alert("Please agree to the Refund & Return Policy."); document.getElementById("agreeRefund")?.focus(); return; }
    if (!agreePrivacy) { alert("Please agree to the User's Data Policy."); document.getElementById("agreePrivacy")?.focus(); return; }
    if (currentMode === "unknown" && !urlOrderId) { alert("Invalid order type. Please restart the checkout process."); return; }

    setIsUploading(true);

    const finalNormalizedEmail = safeEmail.trim().toLowerCase();
    const paidAmount = config.price; 

    try {
      // 1. Upload Screenshot
      const compressedScreenshot = await compressImage(screenshot);
      const fileExt = compressedScreenshot.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `receipts/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('others')
        .upload(filePath, compressedScreenshot);
        
      if (uploadError) throw uploadError;

      // 2. Decide if we are UPDATING an existing order or INSERTING a new one
      let targetOrderId = urlOrderId;
      let finalEnrollmentId = urlEnrollmentId;
      let finalLockedPrice: number | null = fetchedLockedPrice ?? (urlLockedPrice ? Number(urlLockedPrice) : paidAmount);
      
      let previousPaidAmount = 0;
      let previousPendingAmount = 0; // Track pending amount
      let previousScreenshots: string[] = [];

      // A. Check if we have an exact order_id first (From Invoice URL)
      if (targetOrderId) {
        const { data: existingOrder } = await supabase
          .from('orders_v2')
          .select('id, locked_price, paid_amount, pending_amount, payment_screenshots') 
          .eq('id', targetOrderId)
          .maybeSingle();

        if (existingOrder) {
          previousPaidAmount = existingOrder.paid_amount || 0;
          previousPendingAmount = existingOrder.pending_amount || 0; 
          previousScreenshots = existingOrder.payment_screenshots || [];
          if (existingOrder.locked_price && !fetchedLockedPrice) {
            finalLockedPrice = existingOrder.locked_price;
          }
        }
      } 
      // B. ONLINE COURSE PRE-CHECK: Prevent Duplicate Insertions
      else if (dbOrderType === "Online Course") {
        
        // Resolve Enrollment ID if missing
        if (!finalEnrollmentId) {
          const { data: rpcId, error: rpcError } = await supabase.rpc('get_latest_enrollment_id_for_checkout', {
            search_email: finalNormalizedEmail
          });

          if (rpcId && !rpcError) {
            finalEnrollmentId = rpcId;
          } else {
            alert("We couldn't find your enrollment record. Please make sure you used the same email address as your enrollment form.");
            setIsUploading(false);
            return; 
          }
        }

        // Check for ANY existing online course order linked to this enrollment ID (pending or verified)
        if (finalEnrollmentId) {
          const { data: existingOrder } = await supabase
            .from('orders_v2')
            .select('id, locked_price, paid_amount, pending_amount, payment_screenshots') 
            .eq('enrollment_id', finalEnrollmentId)
            .eq('order_type', 'Online Course')
            .order('created_at', { ascending: false }) // Ensures we get the latest one
            .limit(1)
            .maybeSingle();

          if (existingOrder) {
            targetOrderId = existingOrder.id; // Intercept: Switch to UPDATE mode
            previousPaidAmount = existingOrder.paid_amount || 0;
            previousPendingAmount = existingOrder.pending_amount || 0; 
            previousScreenshots = existingOrder.payment_screenshots || [];
            
            // Preserve the original locked price from the database if we didn't fetch one recently
            if (existingOrder.locked_price && !fetchedLockedPrice) {
              finalLockedPrice = existingOrder.locked_price;
            }
          }
        }
      }

      // Ensure locked price is never lower than what the user paid + pending total
      finalLockedPrice = finalLockedPrice ?? previousPaidAmount + previousPendingAmount + paidAmount;

      if (finalLockedPrice < (previousPaidAmount + previousPendingAmount + paidAmount)) {
        finalLockedPrice = previousPaidAmount + previousPendingAmount + paidAmount;
      }

      if (targetOrderId) {
        
        // --- UPDATE EXISTING ORDER (ADD TO PENDING, NOT PAID) ---
        const { error: dbError } = await supabase
          .from('orders_v2')
          .update({
            pending_amount: previousPendingAmount + paidAmount, 
            payment_screenshots: [...previousScreenshots, uploadData.path], 
            status: 'pending', 
            full_name: safeName.trim(),
            email: finalNormalizedEmail,
            whatsapp_number: safePhone.trim(),
            user_id: currentUserId || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', targetOrderId);

        if (dbError) throw dbError;

      } else {

        // --- INSERT NEW ORDER ---
        const { error: dbError } = await supabase.from('orders_v2').insert([{
          user_id: currentUserId || null,
          enrollment_id: finalEnrollmentId || null,
          order_type: dbOrderType,        
          order_name: config.orderName,
          locked_price: finalLockedPrice,
          paid_amount: 0, 
          pending_amount: paidAmount, 
          payment_screenshots: [uploadData.path],
          status: 'pending',
          full_name: safeName.trim(),            
          email: finalNormalizedEmail,          
          whatsapp_number: safePhone.trim()      
        }]);
        
        if (dbError) throw dbError;
      }

      // 3. Handle Success Redirects
      if (currentMode === "recording" && !urlOrderId) {
        setIsUploading(false);
        setShowRecordingSuccess(true);
      } else {
        alert("Payment screenshot uploaded successfully! Your payment is being verified.");
        router.push("/dashboard"); 
      }
      
    } catch (error: any) {
      console.error("Error processing order:", error);
      alert(`Failed to process order: ${error.message || 'Please try again.'}`);
      setIsUploading(false); 
    } 
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20 relative selection:bg-blue-100">
      <a 
        href="https://wa.me/9763695665" 
        target="_blank" 
        rel="noopener noreferrer" 
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-emerald-500 text-white px-4 py-3 rounded-full shadow-lg hover:shadow-xl hover:bg-emerald-600 transition-all font-semibold group border border-emerald-400"
      >
        <MessageCircle className="w-5 h-5" />
        <span className="hidden sm:inline">Immediate Support</span>
      </a>

      {/* ADDED: id="local-checkout-header" to protect it from the global hiding CSS */}
      <header id="local-checkout-header" className="bg-white border-b border-slate-200 px-4 py-3 md:px-8 flex items-center justify-between sticky top-0 z-40">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="font-medium text-sm">Back</span>
        </button>
        <div className="flex items-center gap-1.5 text-slate-700">
          <Lock className="w-4 h-4 text-emerald-600" />
          <span className="font-semibold text-sm">Secure Checkout</span>
        </div>
        <div className="w-16"></div>
      </header>

      <main className="max-w-6xl mx-auto px-4 md:px-8 pt-6 md:pt-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          
          <div className="lg:col-span-7 space-y-6">
            
            <section className="bg-white p-5 sm:p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex justify-between items-center mb-5">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-600" /> Contact Information
                </h2>
                {(isNameLocked || isEmailLocked || isPhoneLocked) && (
                  <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-md flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Details Locked
                  </span>
                )}
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="fullName" className="block text-sm font-medium text-slate-700 mb-1.5">Full Name <span className="text-red-500">*</span></label>
                    <div className={`flex items-center border border-slate-200 rounded-xl transition-all overflow-hidden ${isNameLocked ? 'bg-slate-50 cursor-not-allowed' : 'bg-white focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-blue-400'}`}>
                      <div className="pl-4 text-slate-400"><User className="w-4 h-4" /></div>
                      <input 
                        id="fullName"
                        type="text" 
                        value={fullName} 
                        onChange={(e) => !isNameLocked && setFullName(e.target.value)} 
                        placeholder="John Doe"
                        readOnly={isNameLocked}
                        className={`w-full px-3 py-2.5 outline-none bg-transparent font-medium placeholder:text-slate-400 ${isNameLocked ? 'text-slate-500 cursor-not-allowed' : 'text-slate-900'}`}
                      />
                      {isNameLocked && <div className="pr-4 text-slate-400"><Lock className="w-4 h-4" /></div>}
                    </div>
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">Email Address <span className="text-red-500">*</span></label>
                    <div className={`flex items-center border border-slate-200 rounded-xl transition-all overflow-hidden ${isEmailLocked ? 'bg-slate-50 cursor-not-allowed' : 'bg-white focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-blue-400'}`}>
                      <div className="pl-4 text-slate-400"><Mail className="w-4 h-4" /></div>
                      <input 
                        id="email"
                        type="email" 
                        value={email} 
                        onChange={(e) => !isEmailLocked && setEmail(e.target.value)} 
                        placeholder="you@example.com"
                        readOnly={isEmailLocked}
                        className={`w-full px-3 py-2.5 outline-none bg-transparent font-medium placeholder:text-slate-400 ${isEmailLocked ? 'text-slate-500 cursor-not-allowed' : 'text-slate-900'}`}
                      />
                      {isEmailLocked && <div className="pr-4 text-slate-400"><Lock className="w-4 h-4" /></div>}
                    </div>
                  </div>
                </div>
                <div>
                  <label htmlFor="contactNumber" className="block text-sm font-medium text-slate-700 mb-1.5">Contact Number <span className="text-red-500">*</span></label>
                  <div className={`flex items-center border border-slate-200 rounded-xl transition-all overflow-hidden ${isPhoneLocked ? 'bg-slate-50 cursor-not-allowed' : 'bg-white focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-blue-400'}`}>
                    <span className={`flex items-center gap-1.5 px-3 py-2.5 border-r border-slate-200 font-medium ${isPhoneLocked ? 'text-slate-400 bg-slate-100' : 'text-slate-500 bg-slate-50'}`}>
                      <Phone className="w-4 h-4" /> +977
                    </span>
                    <input 
                      id="contactNumber"
                      type="tel" 
                      value={contactNumber} 
                      onChange={(e) => !isPhoneLocked && setContactNumber(e.target.value)} 
                      placeholder="98XXXXXXXX"
                      readOnly={isPhoneLocked}
                      className={`w-full px-3 py-2.5 outline-none bg-transparent font-medium placeholder:text-slate-400 ${isPhoneLocked ? 'text-slate-500 cursor-not-allowed' : 'text-slate-900'}`}
                    />
                    {isPhoneLocked && <div className="pr-4 text-slate-400"><Lock className="w-4 h-4" /></div>}
                  </div>
                </div>
              </div>
            </section>

            <section className="bg-white p-5 sm:p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" /> Payment Method
                </h2>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md w-fit">
                  <Lock className="w-3.5 h-3.5" /> 100% Secure Checkout
                </div>
              </div>

              <div className="border border-emerald-100 bg-emerald-50/30 rounded-xl p-5 relative overflow-hidden flex flex-col items-center justify-center text-center">
                <p className="text-sm font-medium text-slate-600 mb-3">Scan QR to pay securely via Fonepay</p>
                <Image 
                  src="https://zuktarghyexwodqnnxlu.supabase.co/storage/v1/object/public/others/Bank%20QR.jpg" 
                  alt="Fonepay Accepted Here" 
                  width={240}
                  height={240}
                  className="w-full max-w-[240px] h-auto object-contain mix-blend-multiply opacity-90"
                />
              </div>

              <div className="mt-6">
                <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-xl leading-relaxed mb-5 flex gap-3">
                  <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                  <p className="text-sm text-slate-700 font-medium">
                    You have to deposit <strong className="text-slate-900">{amountInWords}</strong> and upload a screenshot below. Payment will be verified and the service activated within 24 hours. Support: <strong className="text-blue-600">9763695665</strong>.
                  </p>
                </div>

                <label className="block text-sm font-semibold text-slate-800 mb-2">Upload Payment Screenshot <span className="text-red-500">*</span></label>
                <div className="flex items-center justify-center w-full">
                  <label htmlFor="dropzone-file" className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200 ${screenshot ? 'border-emerald-400 bg-emerald-50/50 hover:bg-emerald-50' : 'border-slate-300 bg-slate-50/50 hover:bg-slate-50'}`}>
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      {screenshot ? (
                        <>
                          <FileCheck className="w-8 h-8 text-emerald-500 mb-2" />
                          <p className="text-sm text-emerald-700 font-semibold">{screenshot.name}</p>
                          <p className="text-xs text-emerald-600/70 mt-1 font-medium">Click to change file</p>
                        </>
                      ) : (
                        <>
                          <UploadCloud className="w-8 h-8 text-slate-400 mb-2" />
                          <p className="mb-1 text-sm text-slate-600"><span className="font-semibold text-blue-600">Click to upload</span> or drag and drop</p>
                          <p className="text-xs text-slate-400 font-medium">PNG, JPG or JPEG (Will be compressed automatically)</p>
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

          <div className="lg:col-span-5">
            <div className="sticky top-20 bg-white p-5 sm:p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-5">
              
              <h2 className="text-lg font-bold pb-3 border-b border-slate-100 text-slate-900 flex items-center gap-2">
                <Receipt className="w-5 h-5 text-blue-600" /> Order Summary
              </h2>
              
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-5 space-y-4">
                
                <div className="flex flex-col gap-1.5">
                  <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5" /> Order Type
                  </span>
                  <div className="flex items-center gap-2">
                    {config.icon}
                    <span className="text-slate-900 font-bold text-base leading-tight">
                      {config.title}
                    </span>
                  </div>
                </div>

                <div className="w-full h-px bg-slate-200"></div>

                <div className="flex flex-col gap-1.5">
                  <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" /> Reference Name
                  </span>
                  {isFetchingData ? (
                    <div className="flex items-center gap-2 text-slate-500">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm font-medium">Loading data...</span>
                    </div>
                  ) : (
                    <div className="text-slate-800 font-semibold text-sm whitespace-normal break-words leading-tight">
                      {config.orderName}
                    </div>
                  )}
                </div>
              </div>

              {currentMode === 'recording' && !urlOrderId && (
                <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl flex gap-3 mb-1">
                  <GraduationCap className="w-5 h-5 text-slate-600 shrink-0" />
                  <p className="text-sm font-medium text-slate-700 leading-snug">
                    You will be added to Google Classroom where you will find all class recordings and study materials immediately after payment.
                  </p>
                </div>
              )}

              {(currentMode !== 'recording' || urlOrderId) && (
                <div className={`border rounded-xl p-4 flex gap-3 ${config.noticeStyle}`}>
                  {config.noticeIcon}
                  <p className="text-sm leading-relaxed font-medium">{config.notice}</p>
                </div>
              )}

              <div className="pt-1">
                <div className="flex items-center justify-between mb-5 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <span className="text-slate-600 font-semibold">{urlOrderId ? "Remaining Amount" : "Total Amount"}</span>
                  <span className="text-xl font-bold text-slate-900 tracking-tight">
                    Rs. {config.price.toLocaleString()}
                  </span>
                </div>

                <div className="space-y-3 mb-6">
                  <label htmlFor="agreeRefund" className="flex items-start gap-2.5 cursor-pointer group">
                    <div className="relative flex items-center justify-center mt-0.5">
                      <input id="agreeRefund" type="checkbox" checked={agreeRefund} onChange={(e) => setAgreeRefund(e.target.checked)} className="peer w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer" />
                    </div>
                    <span className="text-sm text-slate-600 leading-snug group-hover:text-slate-800 transition-colors font-medium">
                      I have read and agree to the <Link href="/refund" className="text-blue-600 hover:text-blue-700 hover:underline font-semibold" target="_blank">Refund & Return Policy</Link>.
                    </span>
                  </label>
                  <label htmlFor="agreePrivacy" className="flex items-start gap-2.5 cursor-pointer group">
                    <div className="relative flex items-center justify-center mt-0.5">
                      <input id="agreePrivacy" type="checkbox" checked={agreePrivacy} onChange={(e) => setAgreePrivacy(e.target.checked)} className="peer w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer" />
                    </div>
                    <span className="text-sm text-slate-600 leading-snug group-hover:text-slate-800 transition-colors font-medium">
                      I have read and agree to the <Link href="/privacy-policy" className="text-blue-600 hover:text-blue-700 hover:underline font-semibold" target="_blank">User's data policy</Link>.
                    </span>
                  </label>
                </div>

                <button 
                  disabled={
                    isUploading || 
                    isFetchingData || 
                    !isNameValid || 
                    !isEmailValid || 
                    !isPhoneValid || 
                    !agreeRefund || 
                    !agreePrivacy || 
                    !screenshot
                  }
                  onClick={handleSubmit}
                  className={`w-full py-3.5 rounded-xl font-semibold text-base transition-all flex justify-center items-center gap-2 ${
                    (
                      isUploading || 
                      isFetchingData || 
                      !isNameValid || 
                      !isEmailValid || 
                      !isPhoneValid || 
                      !agreeRefund || 
                      !agreePrivacy || 
                      !screenshot
                    )
                      ? "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
                      : "bg-blue-600 text-white hover:bg-blue-700 shadow-sm hover:shadow-md" 
                  }`}
                >
                  {isUploading ? <><Loader2 className="w-5 h-5 animate-spin" /> Processing...</> : <><Lock className="w-4 h-4" /> Complete Order</>}
                </button>
              </div>

            </div>
          </div>

        </div>
      </main>

      {showRecordingSuccess && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-xl text-center flex flex-col items-center animate-in zoom-in-95 duration-200">
            <div className="w-14 h-14 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-5 border border-emerald-100">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            
            <h3 className="text-xl font-bold text-slate-900 mb-2">Thank you!</h3>
            <p className="text-slate-600 font-medium mb-5 leading-relaxed text-sm">
              Thank you for choosing GyanHub for the recording course of <strong className="text-slate-900">"{urlCourseName}"</strong>.
            </p>
            
            <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl text-sm text-slate-700 mb-6 text-left w-full font-medium">
              You will get an invitation to join Google Classroom in your email within half an hour. For any queries or problems, please message us at <a href="https://wa.me/9763695665" target="_blank" rel="noopener noreferrer" className="font-semibold text-blue-600 hover:underline">9763695665 on WhatsApp</a>.
            </div>
            
            <button 
              onClick={() => router.push("/dashboard")} 
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3 rounded-xl transition-all shadow-sm active:scale-[0.98]"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// THIS IS THE FIX: Wrap it in a Suspense boundary and export default it!
export default function OrderPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500">Loading secure checkout...</div>}>
      {/* ADDED: Global style injection to hide standard navbars/footers without breaking the local header */}
      <style dangerouslySetInnerHTML={{
        __html: `
          nav, footer, header:not(#local-checkout-header) {
            display: none !important;
          }
        `
      }} />
      <CheckoutContent />
    </Suspense>
  );
}