"use client";
import { Certificate, Syllabus } from "./types";
import React, { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { Award, UploadCloud, Loader2 } from "lucide-react";
import { Toaster, toast } from "react-hot-toast";

import RegistryView from "@/components/certificate/RegistryView";
import BulkUploadView from "@/components/certificate/BulkUploadView";

// --- TYPES ---

export default function CertificateMasterDashboard() {
  const supabase = createClient();
  const [activeTab, setActiveTab] = useState<"Registry" | "BulkUpload">("Registry");
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [syllabi, setSyllabi] = useState<Syllabus[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      // 1. Fetch Syllabi
      const sylRes = await supabase.from("syllabi_v2").select("id, name");
      if (sylRes.data) setSyllabi(sylRes.data);

      // 2. Fetch ALL Certificates bypassing the 1000 max-rows limit
      let allCerts: Certificate[] = [];
      let fetchMore = true;
      let step = 0;
      const limit = 1000;

      while (fetchMore) {
        const { data, error } = await supabase
          .from("certificates")
          .select("*")
          .order("created_at", { ascending: false })
          .range(step * limit, (step + 1) * limit - 1);

        if (error) {
          throw error;
        }

        if (data && data.length > 0) {
          allCerts = allCerts.concat(data);
          // If we received fewer records than the limit, we've hit the end of the table
          if (data.length < limit) {
            fetchMore = false;
          } else {
            step++;
          }
        } else {
          fetchMore = false;
        }
      }

      setCertificates(allCerts);
    } catch (error: any) {
      toast.error(`Error fetching data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Real-time synchronization
    const channel = supabase
      .channel("admin-certificates-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "certificates" },
        () => {
          fetchData(); // Instantly refresh data when bulk uploads finish
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-indigo-500">
        <Loader2 className="animate-spin mb-4" size={48} />
        <p className="font-bold text-slate-500 tracking-widest uppercase text-sm">Initializing Master Hub</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10 font-sans text-slate-900">
      <Toaster position="top-right" toastOptions={{ duration: 3000, style: { fontWeight: 'bold' } }} />
      
      <div className="max-w-7xl mx-auto space-y-8">
        {/* HEADER & HIGH-LEVEL SUMMARY */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Certificate Hub</h1>
            <p className="mt-2 text-slate-500 font-medium">Manage registry records and high-volume batch issuances.</p>
          </div>
          
          <div className="flex gap-4">
            <div className="bg-white px-6 py-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center min-w-[140px]">
              <span className="text-3xl font-black text-indigo-600">{certificates.length}</span>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mt-1">Total Issued</span>
            </div>
            <div className="bg-white px-6 py-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center min-w-[140px]">
              <span className="text-3xl font-black text-emerald-500">{syllabi.length}</span>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mt-1">Active Syllabi</span>
            </div>
          </div>
        </div>

        {/* UNIFIED TAB NAVIGATION */}
        <div className="flex bg-slate-200/50 p-1.5 rounded-2xl w-fit">
          <button
            onClick={() => setActiveTab("Registry")}
            className={`relative flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all ${
              activeTab === "Registry" ? "text-indigo-700" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {activeTab === "Registry" && (
              <motion.div layoutId="activeTabIndicator" className="absolute inset-0 bg-white rounded-xl shadow-sm border border-slate-200" />
            )}
            <span className="relative z-10 flex items-center gap-2"><Award size={18} /> Elite Registry</span>
          </button>
          
          <button
            onClick={() => setActiveTab("BulkUpload")}
            className={`relative flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all ${
              activeTab === "BulkUpload" ? "text-indigo-700" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {activeTab === "BulkUpload" && (
              <motion.div layoutId="activeTabIndicator" className="absolute inset-0 bg-white rounded-xl shadow-sm border border-slate-200" />
            )}
            <span className="relative z-10 flex items-center gap-2"><UploadCloud size={18} /> Enterprise Bulk Issuance</span>
          </button>
        </div>

        {/* TAB VIEWS */}
        <div className="relative w-full">
          <AnimatePresence mode="wait">
            {activeTab === "Registry" ? (
              <motion.div key="registry" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                <RegistryView 
                  data={certificates} 
                  syllabi={syllabi} 
                  refresh={fetchData} 
                  onSwitchTab={() => setActiveTab("BulkUpload")} 
                />
              </motion.div>
            ) : (
              <motion.div key="bulkupload" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                <BulkUploadView />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}