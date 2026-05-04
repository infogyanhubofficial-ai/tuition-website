"use client";

import React, { useState, useEffect, useRef, use } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

// Types matching your PostgreSQL 'orders_v2' table schema
interface OrderData {
  id: string;
  order_type: string;
  order_name: string;
  locked_price: number;
  paid_amount: number;
  remaining_amount: number;
  status: string;
  created_at: string;
  full_name: string;
  email: string;
  whatsapp_number: string;
}

// Helper to convert numbers to words (Indian/Nepali Numbering System)
function amountToWords(amount: number): string {
  if (amount === 0) return "Zero Rupees Only";
  const a = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
    "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"
  ];
  const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  const convert = (num: number): string => {
    if (num < 20) return a[num];
    if (num < 100) return b[Math.floor(num / 10)] + (num % 10 !== 0 ? " " + a[num % 10] : "");
    if (num < 1000) return a[Math.floor(num / 100)] + " Hundred" + (num % 100 !== 0 ? " " + convert(num % 100) : "");
    if (num < 10000) return convert(Math.floor(num / 1000)) + " Thousand" + (num % 1000 !== 0 ? " " + convert(num % 1000) : "");
    if (num < 100000) return convert(Math.floor(num / 1000)) + " Thousand" + (num % 1000 !== 0 ? " " + convert(num % 1000) : "");
    if (num < 10000000) return convert(Math.floor(num / 100000)) + " Lakh" + (num % 100000 !== 0 ? " " + convert(num % 100000) : "");
    return convert(Math.floor(num / 10000000)) + " Crore" + (num % 10000000 !== 0 ? " " + convert(num % 10000000) : "");
  };

  const wholePart = Math.floor(amount);
  const fractionPart = Math.round((amount - wholePart) * 100);

  let words = convert(wholePart).trim() + " Rupees";
  if (fractionPart > 0) {
    words += " and " + convert(fractionPart).trim() + " Paisa";
  }
  return words + " Only";
}

// Wrap params in a Promise
export default function SingleInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  
  // Unwrap the params Promise
  const resolvedParams = use(params);
  const orderId = resolvedParams.id;

  const [order, setOrder] = useState<OrderData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const invoiceRef = useRef<HTMLDivElement>(null);

  // Fetch the specific order based on the URL parameter
  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) return;
      
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from("orders_v2")
          .select("*")
          .eq("id", orderId)
          .single();

        if (error) {
          console.error("Error fetching order:", error);
          return;
        }

        if (data) {
          setOrder(data);
        }
      } catch (err) {
        console.error("Unexpected error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  const handleDownloadPDF = async () => {
    if (!invoiceRef.current || !order) return;
    
    try {
      setIsDownloading(true);
      
      const htmlToImage = await import('html-to-image');
      const { jsPDF } = await import('jspdf');
      
      const element = invoiceRef.current;
      
      // Temporarily force A4 width formatting exclusively for the PDF engine
      const originalWidth = element.style.width;
      const originalMaxWidth = element.style.maxWidth;
      element.style.width = '800px';
      element.style.maxWidth = '800px';
      
      // Allow DOM to briefly process width change
      await new Promise(r => setTimeout(r, 50));

      const dataUrl = await htmlToImage.toJpeg(element, { 
        quality: 0.8,
        pixelRatio: 1.5,
        backgroundColor: '#ffffff',
      });
      
      // Revert fluid responsive width immediately
      element.style.width = originalWidth;
      element.style.maxWidth = originalMaxWidth;
      
      const pdf = new jsPDF({ format: 'a4', orientation: 'portrait', unit: 'mm' });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      pdf.addImage(dataUrl, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
      
      const firstName = order.full_name?.trim().split(" ")[0] || "Client";
      const pdfFilename = `${firstName}_Invoice_GyanHub.pdf`;

      pdf.save(pdfFilename);
      
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handlePayRemaining = () => {
    if (!order) return;
    
    // Construct the URL parameters for the checkout page
    const params = new URLSearchParams({
      order_id: order.id,
      price: order.remaining_amount.toString(),
      name: order.full_name || "",
      email: order.email || "",
      phone: order.whatsapp_number || "",
      course_name: order.order_name || "",
      order_type: order.order_type || "",
    });

    // Assuming your checkout page is at /checkout. Adjust if necessary.
    router.push(`/order?${params.toString()}`);
  };

  // Format currency
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-NP", {
      style: "currency",
      currency: "NPR",
    }).format(amount || 0);

  // ==========================================
  // LOADING / NOT FOUND STATES
  // ==========================================
  if (isLoading) {
    return (
      <div className="fixed inset-0 z-[9999] bg-gray-50 flex items-center justify-center font-sans print:hidden">
        <div className="animate-pulse text-[#0A2A66] font-medium flex items-center gap-2">
          <svg className="animate-spin h-5 w-5 text-[#F26522]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Loading Invoice Data...
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="fixed inset-0 z-[9999] bg-gray-50 flex flex-col items-center justify-center font-sans p-4 print:hidden">
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 text-center max-w-md w-full">
          <div className="text-red-500 mb-4 flex justify-center">
             <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
             </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Invoice Not Found</h2>
          <p className="text-gray-500 text-sm mb-6">We couldn't find an order with the provided ID.</p>
          <button 
            onClick={() => router.back()} 
            className="w-full bg-[#0A2A66] hover:bg-blue-800 text-white px-4 py-2 rounded shadow transition-all font-medium"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // ==========================================
  // INVOICE LOGIC
  // ==========================================
  
  // Extract 3rd and 4th blocks of UUID (e.g., 4d85-98ba)
  const idParts = order.id.split('-');
  const displayInvoiceNo = idParts.length >= 4 
    ? `${idParts[2]}-${idParts[3]}` 
    : order.id.substring(0, 8);

  const isDue = order.remaining_amount > 0;
  const amountToConvert = isDue ? order.remaining_amount : order.locked_price;
  const amountWordsLabel = isDue ? "Due Amount (in words):" : "Total Amount (in words):";

  return (
    <div className="fixed inset-0 z-[9999] overflow-y-auto bg-gray-100 font-sans text-gray-800 print:relative print:inset-auto print:overflow-visible print:bg-white print:z-auto print:h-auto flex flex-col items-center">
      
      {/* ==========================================
          RUNNING INFO BANNER (Print Hidden)
          ========================================== */}
      {isDue && (
        <div className="w-full bg-amber-50 border-b border-amber-200 text-amber-800 text-sm py-2.5 px-4 flex items-center justify-between print:hidden z-50 sticky top-0 shadow-sm">
          <div className="flex-1 overflow-hidden flex items-center mr-4">
            <marquee scrollamount="5" className="font-medium tracking-wide">
              💡 <strong className="uppercase">Sponsorship Tip:</strong> If someone is sponsoring you for this service, you can copy this link and send it to them. They can initiate the payment easily from their side!
            </marquee>
          </div>
          <button 
            onClick={handleCopyLink} 
            className="flex-shrink-0 bg-amber-500 hover:bg-amber-600 text-white px-4 py-1.5 rounded-md text-xs font-bold shadow-sm transition-colors flex items-center gap-1.5"
          >
            {isCopied ? (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                Copied!
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                Copy Link
              </>
            )}
          </button>
        </div>
      )}

      <div className="w-full max-w-[210mm] mt-6 mb-4 flex flex-col lg:flex-row justify-between items-center gap-4 print:hidden px-4 md:px-0">
        
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="w-full lg:w-auto bg-white lg:bg-transparent border border-gray-200 lg:border-none text-gray-600 lg:text-gray-500 hover:text-[#0A2A66] font-medium flex items-center justify-center lg:justify-start gap-1.5 transition-colors py-2.5 lg:py-0 rounded shadow-sm lg:shadow-none"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
          </svg>
          Go Back
        </button>
        
        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row w-full lg:w-auto gap-3">
          
          {/* New Pay Remaining Amount Button */}
          {isDue && (
            <button
              onClick={handlePayRemaining}
              className="flex-1 sm:flex-none bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2.5 rounded shadow-md transition-all flex justify-center items-center gap-2 font-bold border border-emerald-500 animate-pulse hover:animate-none"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"></path>
              </svg>
              Pay Remaining: {formatCurrency(order.remaining_amount)}
            </button>
          )}

          <div className="flex flex-1 sm:flex-none gap-3">
            <button
              onClick={handleDownloadPDF}
              disabled={isDownloading}
              className="w-full sm:w-auto bg-[#0A2A66] hover:bg-blue-800 text-white px-6 py-2.5 rounded shadow-md transition-all flex justify-center items-center gap-2 font-medium disabled:opacity-70 text-sm sm:text-base"
            >
              {isDownloading ? (
                 <span className="animate-pulse">Generating...</span>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                  </svg>
                  Download PDF
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ==========================================
          INVOICE VIEWER WRAPPER 
          ========================================== */}
      <div className="w-full flex justify-center px-0 sm:px-4 md:px-0 pb-10 print:pb-0 print:block">
        
        {/* Responsive Document Container */}
        <div 
          ref={invoiceRef}
          className="w-full max-w-[210mm] min-h-auto md:min-h-[297mm] bg-white shadow-none sm:shadow-2xl relative overflow-hidden print:shadow-none print:w-full print:h-auto z-0"
        >
          {/* Subtle Top Gradient Fade */}
          <div className="absolute top-0 left-0 w-full h-[6px] bg-gradient-to-r from-[#0A2A66] via-[#3d5a99] to-[#F26522] z-10"></div>

          {/* Faint Center Watermark */}
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none -z-10">
            <img
              src="https://zuktarghyexwodqnnxlu.supabase.co/storage/v1/object/public/others/LOGO_BG_REMOVED.png"
              alt="Watermark"
              className="w-4/5 md:w-2/3 grayscale"
              crossOrigin="anonymous"
            />
          </div>

          <div className="px-5 py-8 sm:px-8 sm:py-10 md:px-12 md:py-14 relative z-10">
            
            {/* HEADER SECTION */}
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 border-b border-gray-100 pb-6 md:pb-8">
              <div className="flex items-center gap-4 sm:gap-6">
                <img
                  src="https://zuktarghyexwodqnnxlu.supabase.co/storage/v1/object/public/others/LOGO_BG_REMOVED.png"
                  alt="Gyan Hub Logo"
                  className="h-14 sm:h-16 md:h-20 object-contain"
                  crossOrigin="anonymous"
                />
                <div className="w-px h-12 sm:h-16 bg-gray-200"></div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-semibold text-[#0A2A66] tracking-tight">
                    Gyan Hub Pvt. Ltd.
                  </h1>
                  <p className="text-[10px] sm:text-xs text-gray-500 font-medium uppercase tracking-widest mt-1">
                    Learn Today | Lead Tomorrow
                  </p>
                  <p className="text-[9px] sm:text-[11px] text-[#F26522] font-medium lowercase tracking-wide mt-0.5">
                    www.gyanhub.com.np
                  </p>
                </div>
              </div>

              <div className="text-left sm:text-right w-full sm:w-auto mt-2 sm:mt-0">
                <h2 className="text-3xl md:text-4xl font-light text-[#0A2A66] mb-2 md:mb-3 tracking-widest uppercase">
                  Invoice
                </h2>
                <div className="text-xs sm:text-sm flex flex-col gap-1">
                  <p className="text-gray-500">
                    <span className="font-semibold text-gray-700 w-16 sm:w-20 inline-block text-left sm:text-right mr-2">No:</span> 
                    {displayInvoiceNo}
                  </p>
                  <p className="text-gray-500">
                    <span className="font-semibold text-gray-700 w-16 sm:w-20 inline-block text-left sm:text-right mr-2">Date:</span> 
                    {new Date(order.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </p>
                </div>
              </div>
            </header>

            {/* PARTIES SECTION */}
            <div className="flex flex-col md:flex-row justify-between gap-6 md:gap-8 mt-8 md:mt-12 mb-8 md:mb-12 relative">
              
              {/* Conditionally render stamp */}
              {order.status === 'verified' && (
                <div className="absolute top-1/2 md:top-auto md:-top-[85px] left-1/2 md:left-0 right-0 -translate-x-1/2 md:translate-x-0 -translate-y-1/2 md:translate-y-0 flex justify-center pointer-events-none z-0 opacity-[0.08] md:opacity-85">
                  <img 
                    src="https://zuktarghyexwodqnnxlu.supabase.co/storage/v1/object/public/syllabi/STAMP.png" 
                    alt="Company Stamp" 
                    className="w-[120px] h-[120px] sm:w-[110px] sm:h-[110px] object-contain -rotate-12 mix-blend-multiply"
                    crossOrigin="anonymous"
                  />
                </div>
              )}

              <div className="space-y-1 text-xs sm:text-sm text-gray-600 z-10 w-full md:w-1/2">
                <h3 className="text-[10px] md:text-xs font-bold text-[#F26522] uppercase tracking-wider mb-2 md:mb-3">Company Details</h3>
                <p className="font-semibold text-[#0A2A66]">PAN No: <span className="font-normal text-gray-600">622327826</span></p>
                <p className="pt-1 md:pt-2">Gatthaghar, Bhaktapur</p>
                <p>Bagmati, Nepal</p>
                <p className="pt-1 md:pt-2 text-gray-500">admin@gyanhub.com.np | +977-9763695665</p>
              </div>

              <div className="space-y-1 text-left md:text-right z-10 w-full md:w-1/2 mt-4 md:mt-0 pt-4 md:pt-0 border-t border-gray-100 md:border-none">
                <h3 className="text-[10px] md:text-xs font-bold text-[#F26522] uppercase tracking-wider mb-2 md:mb-3">Bill To</h3>
                <p className="text-base sm:text-lg font-semibold text-[#0A2A66]">{order.full_name || "N/A"}</p>
                <p className="text-xs sm:text-sm text-gray-600 break-all">{order.email || "N/A"}</p>
                <p className="text-xs sm:text-sm text-gray-600">{order.whatsapp_number || "N/A"}</p>
              </div>
            </div>

            {/* ITEMS TABLE */}
            <div className="mt-8 relative z-10 overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[320px]">
                <thead>
                  <tr className="border-b-2 border-black">
                    <th className="py-2 px-1 sm:py-3 sm:px-2 font-bold text-black uppercase text-[10px] sm:text-[11px] tracking-wider w-7/12">Description</th>
                    <th className="py-2 pl-2 sm:pl-6 pr-2 font-bold text-black uppercase text-[10px] sm:text-[11px] tracking-wider text-left">Type</th>
                    <th className="py-2 pl-2 pr-1 sm:pr-6 font-bold text-black uppercase text-[10px] sm:text-[11px] tracking-wider text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                    <td className="py-4 sm:py-5 px-1 sm:px-2 text-gray-800 font-medium text-xs sm:text-sm">{order.order_name}</td>
                    <td className="py-4 sm:py-5 pl-2 sm:pl-6 pr-2 text-left text-gray-500 text-xs sm:text-sm capitalize whitespace-nowrap">{order.order_type}</td>
                    <td className="py-4 sm:py-5 pl-2 pr-1 sm:pr-6 text-right font-medium text-[#0A2A66] text-xs sm:text-sm">{formatCurrency(order.locked_price)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* CALCULATION SECTION */}
            <div className="flex flex-col lg:flex-row mt-6 sm:mt-8 gap-6 md:gap-4">
              
              <div className="w-full lg:w-7/12 text-left flex flex-col justify-start pt-0 sm:pt-2 pr-0 sm:pr-6">
                {/* AMOUNT IN WORDS */}
                <div className="mb-4 sm:mb-5 bg-gray-50 p-3 sm:p-4 rounded border border-gray-100">
                  <p className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-wider mb-1 font-semibold">{amountWordsLabel}</p>
                  <p className="text-xs sm:text-sm font-bold text-[#0A2A66] capitalize">{amountToWords(amountToConvert)}</p>
                </div>

                {/* THANK YOU NOTE */}
                <p className="text-[10px] sm:text-xs text-gray-500 font-light max-w-sm leading-relaxed m-0 p-0 hidden lg:block">
                  <span className="font-semibold text-gray-700 block mb-1">Thank you for choosing GyanHub as your educational partner.</span>
                  This is a system-generated invoice. If you notice any discrepancies, please inform us within 48 hours of receipt. Claims made after this period may not be considered.
                </p>
              </div>
              
              <div className="w-full lg:w-5/12">
                <div className="bg-gray-50/50 p-4 sm:p-6 rounded-lg border border-gray-50">
                  <div className="flex justify-between py-1.5 sm:py-2 text-sm sm:text-base">
                    <span className="font-bold text-black">Total</span>
                    <span className="font-bold text-black">{formatCurrency(order.locked_price)}</span>
                  </div>
                  <div className="flex justify-between py-1.5 sm:py-2 text-xs sm:text-sm border-b border-gray-200">
                    <span className="text-gray-500">Amount Paid</span>
                    <span className="font-medium text-green-600">-{formatCurrency(order.paid_amount)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-3 mt-2">
                    <span className="text-xs sm:text-sm font-semibold text-[#0A2A66]">Balance Due</span>
                    <span className="text-base sm:text-lg font-bold text-red-600 tracking-tight">
                      {formatCurrency(order.remaining_amount)}
                    </span>
                  </div>
                </div>

                {/* SMALL UNVERIFIED WATERMARK/STAMP */}
                {order.status !== 'verified' && (
                  <div className="mt-4 sm:mt-6 border-[3px] sm:border-[4px] border-red-600 border-dashed text-red-600 font-bold text-[10px] sm:text-[11px] leading-snug uppercase tracking-wide p-3 sm:p-4 transform -rotate-3 text-center bg-white mix-blend-multiply opacity-90">
                    <span className="block text-lg sm:text-xl font-black mb-1">🚫 INVALID 🚫</span>
                    This is just a draft invoice and any service purchase from {order.full_name || "Customer"} is not activated yet.
                  </div>
                )}
              </div>
            </div>
            
            {/* MOBILE ONLY THANK YOU NOTE */}
            <p className="text-[10px] sm:text-xs text-gray-500 font-light leading-relaxed mt-6 block lg:hidden">
              <span className="font-semibold text-gray-700 block mb-1">Thank you for choosing GyanHub as your educational partner.</span>
              This is a system-generated invoice. If you notice any discrepancies, please inform us within 48 hours of receipt. Claims made after this period may not be considered.
            </p>

            {/* FOOTER & SIGNATURE SECTION */}
            <div className="mt-10 sm:mt-16 flex flex-col-reverse sm:flex-row items-start sm:items-end gap-8 pb-4 sm:pb-0">
              <div className="w-full sm:w-8/12 text-left">
                <h4 className="text-[10px] font-bold text-[#0A2A66] uppercase tracking-wider mb-2 sm:mb-3">Terms & Conditions</h4>
                <ul className="text-[9px] sm:text-[10px] text-gray-500 max-w-lg leading-tight list-disc pl-3 space-y-1 m-0">
                  <li>All payments made are non-refundable.</li>
                  <li>The amount stated in this invoice must be paid in full within the specified deadline.</li>
                  <li>Any discrepancies in this invoice must be reported within 48 hours of receipt.</li>
                  <li>Once payment is completed, the amount cannot be modified, transferred, or adjusted.</li>
                  <li>Late payments may be subject to applicable charges or penalties.</li>
                  <li>This is a digitally generated invoice and is valid without a physical signature or stamp.</li>
                  <li>This transaction shall be governed and interpreted in accordance with the laws of Nepal.</li>
                  <li>All transaction details and personal information will be kept strictly confidential.</li>
                </ul>
              </div>

              <div className="w-full sm:w-4/12 text-left sm:text-center flex flex-col items-start sm:items-center">
                <div className="relative h-16 sm:h-20 flex justify-center items-end">
                  {/* Conditionally render signature */}
                  {order.status === 'verified' && (
                    <img 
                      src="https://zuktarghyexwodqnnxlu.supabase.co/storage/v1/object/public/syllabi/DIRECTOR_SIGN-removebg-preview%20(1).png" 
                      alt="Director Signature" 
                      className="h-16 sm:h-20 object-contain mix-blend-multiply z-10"
                      crossOrigin="anonymous"
                    />
                  )}
                </div>
                <div className="w-3/4 sm:w-full h-[1px] bg-gray-300 mt-1 sm:mt-2 mb-1"></div>
                <p className="text-[10px] sm:text-xs font-semibold text-[#0A2A66]">Authorized Signatory</p>
                <p className="text-[9px] sm:text-[10px] text-gray-500">Gyan Hub Pvt. Ltd.</p>
              </div>
            </div>

          </div>

          {/* BOTTOM NETWORK/WAVE BRANDING PATTERN */}
          <div className="absolute bottom-0 left-0 w-full h-24 sm:h-32 -z-10 overflow-hidden opacity-10">
             <svg viewBox="0 0 1000 200" preserveAspectRatio="none" className="w-full h-full text-[#0A2A66] fill-current">
                <path d="M0,150 C200,100 300,200 500,150 C700,100 800,180 1000,100 L1000,200 L0,200 Z" opacity="0.3"></path>
                <path d="M0,180 C250,130 400,220 700,160 C850,130 950,190 1000,170 L1000,200 L0,200 Z" opacity="0.5"></path>
                <circle cx="200" cy="125" r="4" fill="#F26522" opacity="0.8"></circle>
                <line x1="200" y1="125" x2="350" y2="160" stroke="#0A2A66" strokeWidth="1" opacity="0.5"></line>
                <circle cx="350" cy="160" r="3"></circle>
                <line x1="350" y1="160" x2="500" y2="150" stroke="#0A2A66" strokeWidth="1" opacity="0.5"></line>
                <circle cx="500" cy="150" r="5" fill="#F26522" opacity="0.8"></circle>
                <line x1="500" y1="150" x2="700" y2="130" stroke="#0A2A66" strokeWidth="1" opacity="0.5"></line>
                <circle cx="700" cy="130" r="3"></circle>
             </svg>
          </div>
          
          <div className="absolute bottom-3 sm:bottom-4 w-full text-center text-[8px] sm:text-[9px] text-gray-400 font-medium tracking-widest">
             REG NO: 363467/81/82 &nbsp; | &nbsp; PAN NO: 622327826
          </div>
        </div>
      </div>
    </div>
  );
}