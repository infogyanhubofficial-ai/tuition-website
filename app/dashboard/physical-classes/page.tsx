"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  MapPin, Clock, DollarSign, CheckCircle, AlertCircle, 
  BookOpen, Sparkles, Building, ArrowRight, Wallet, Receipt,
  Calendar // Added Calendar icon
} from "lucide-react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { createClient } from "@/lib/supabase/client";

// --- ANIMATION VARIANTS ---
const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const fadeUpItem: Variants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

// --- TYPES ---
interface PhysicalLead {
  id: string;
  course_title: string;
  course_code: string;
  category: string;
  office_location: string;
  course_price: number;
  discount_price: number | null;
  booking_amount: number | null;
  status: string;
  batch_no: number;
  start_date: string | null; // Added start_date
  is_confirmed: boolean;
  created_at: string;
  full_name: string; // Added to pass to order page
  email: string;     // Added to pass to order page
  phone: string;     // Added to pass to order page
}

export default function PhysicalClassesPage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState<string>('User');
  const [leads, setLeads] = useState<PhysicalLead[]>([]);

  useEffect(() => {
    document.title = `GyanHub | My Physical Classes`;
    
    const fetchPhysicalClasses = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) { 
        router.push('/login?next=/dashboard/physical-classes'); 
        return; 
      }
      
      setUserName(user.user_metadata?.full_name || 'User');
      const email = user.email || '';

      try {
        // Fetch leads matching the user's email
        const { data: leadsData, error } = await supabase
          .from('physical_leads')
          .select('*')
          .eq('email', email)
          .eq('deleted', false)
          .order('created_at', { ascending: false });

        if (error) throw error;
        if (leadsData) setLeads(leadsData as PhysicalLead[]);

      } catch (err) {
        console.error("Error fetching physical classes:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPhysicalClasses();
  }, [supabase, router]);

  const firstName = userName.split(' ')[0];

  return (
    <div className="w-full relative pb-20">
      {/* 1. Header Section */}
      <div className="mb-8 flex flex-col md:flex-row items-start md:items-end justify-between gap-4 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/60 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
        <div className="relative z-10">
          <p className="text-sm font-semibold text-slate-500 mb-1 flex items-center gap-2">
            <Building size={16} className="text-blue-500" /> Offline Campus
          </p>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-slate-900">
            Welcome back, {firstName} 👋
          </h2>
          <p className="text-slate-600 mt-2 font-medium max-w-md">
            Track your physical class enrollments, confirmation status, and fee statements here.
          </p>
        </div>
        
        <Link 
          href="/courses/physical" 
          className="relative z-10 w-full md:w-auto flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3.5 rounded-xl font-semibold text-sm transition-all shadow-lg shadow-blue-600/20"
        >
          <BookOpen size={18} className="text-blue-100"/> Browse New Classes
        </Link>
      </div>

      {/* 2. Main Content Area */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="w-full h-48 bg-slate-100 animate-pulse rounded-3xl border border-slate-200/50"></div>
          ))}
        </div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="show"
            className="space-y-6"
          >
            {leads.length === 0 ? (
              <motion.div variants={fadeUpItem} className="flex flex-col items-center justify-center bg-white rounded-3xl py-20 px-6 border border-slate-200/60 shadow-sm text-center">
                <div className="w-20 h-20 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mb-5 border border-slate-100">
                  <BookOpen size={32} />
                </div>
                <h3 className="font-bold text-lg text-slate-800 mb-2">No active enrollments found</h3>
                <p className="font-medium text-slate-500 text-sm max-w-sm mb-6">You haven't enrolled in any of our physical campus classes yet.</p>
                <Link href="/courses/physical" className="text-blue-700 font-semibold text-sm bg-blue-50 hover:bg-blue-100 px-6 py-3 rounded-xl transition-colors flex items-center gap-2">
                  Explore Physical Classes <ArrowRight size={16} />
                </Link>
              </motion.div>
            ) : (
              leads.map((lead) => (
                <ClassCard key={lead.id} lead={lead} />
              ))
            )}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}

// --- SUBCOMPONENTS ---

function ClassCard({ lead }: { lead: PhysicalLead }) {
  const router = useRouter();

  // Financial Calculations
  const totalFee = lead.discount_price !== null && lead.discount_price !== undefined 
    ? lead.discount_price 
    : lead.course_price;
    
  const paidAmount = lead.booking_amount || 0;
  const remainingAmount = Math.max(0, totalFee - paidAmount);

  // Status mappings
  const isConfirmed = lead.is_confirmed;

  const handlePayRemaining = () => {
    // Construct the URL parameters for the checkout page based on the locked lead details
    const params = new URLSearchParams({
      lead_id: lead.id,
      price: remainingAmount.toString(),
      name: lead.full_name || "",
      email: lead.email || "",
      phone: lead.phone || "",
      course_name: lead.course_title || "",
      order_type: "Physical Class", // Adjust string based on how your /order page interprets types
    });

    router.push(`/order?${params.toString()}`);
  };
  
  return (
    <motion.div 
      variants={fadeUpItem} 
      className="bg-white border border-slate-200/60 rounded-3xl p-6 sm:p-8 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group flex flex-col md:flex-row gap-6 md:gap-10"
    >
      <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity z-50 rounded-l-3xl"></div>
      
      {/* Left Column: Course Details */}
      <div className="flex-1">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md">
                {lead.category}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">
                Batch {lead.batch_no}
              </span>
            </div>
            <h3 className="font-bold text-xl sm:text-2xl text-slate-900 tracking-tight">
              {lead.course_title}
            </h3>
            <p className="text-sm text-slate-500 font-medium mt-1">
              Code: {lead.course_code}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm text-slate-600 font-medium mt-6">
          <span className="flex items-center gap-2">
            <MapPin size={16} className="text-slate-400" />
            {lead.office_location} Campus
          </span>
          {/* Newly added locked start date */}
          {lead.start_date && (
            <span className="flex items-center gap-2">
              <Calendar size={16} className="text-slate-400" />
              Starts: {new Date(lead.start_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
            </span>
          )}
          <span className="flex items-center gap-2">
            <Clock size={16} className="text-slate-400" />
            Applied on {new Date(lead.created_at).toLocaleDateString()}
          </span>
        </div>
      </div>

      {/* Right Column: Status & Financials */}
      <div className="shrink-0 w-full md:w-[320px] bg-slate-50 rounded-2xl p-5 border border-slate-100 flex flex-col justify-between">
        {/* Confirmation Status */}
        <div className="mb-5 pb-5 border-b border-slate-200">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Admission Status</p>
          {isConfirmed ? (
            <div className="flex items-center gap-2 text-emerald-700 bg-emerald-100/50 border border-emerald-200 px-4 py-2.5 rounded-xl">
              <CheckCircle size={18} className="text-emerald-600" />
              <span className="font-bold text-sm">Seat Confirmed</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-orange-700 bg-orange-100/50 border border-orange-200 px-4 py-2.5 rounded-xl">
              <AlertCircle size={18} className="text-orange-600" />
              <span className="font-bold text-sm">Pending Confirmation</span>
            </div>
          )}
        </div>

        {/* Financial Breakdown */}
        <div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Fee Statement</p>
          <div className="space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-600 font-medium flex items-center gap-2">
                <Receipt size={14} className="text-slate-400" /> Total Fee
              </span>
              <span className="font-bold text-slate-900">Rs. {totalFee.toLocaleString()}</span>
            </div>
            
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-600 font-medium flex items-center gap-2">
                <Wallet size={14} className="text-slate-400" /> Amount Paid
              </span>
              <span className="font-bold text-emerald-600">Rs. {paidAmount.toLocaleString()}</span>
            </div>
            
            <div className="pt-3 mt-1 border-t border-slate-200/80 flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <span className="text-slate-800 font-bold text-sm">Remaining Due</span>
                <span className={`font-bold ${remainingAmount > 0 ? 'text-red-600' : 'text-slate-900'}`}>
                  Rs. {remainingAmount.toLocaleString()}
                </span>
              </div>
              
              {/* Added Pay Remaining Amount Button */}
              {remainingAmount > 0 && (
                <button
                  onClick={handlePayRemaining}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg shadow-sm transition-all flex justify-center items-center gap-2 font-semibold text-sm"
                >
                  Pay Remaining <ArrowRight size={16} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}