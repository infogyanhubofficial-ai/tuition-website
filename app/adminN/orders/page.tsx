"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { 
  Search, AlertCircle, CheckSquare, Trash2, X, 
  ChevronDown, MessageCircle, ExternalLink, Wallet, FileText 
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

// --- TYPES ---
export interface Order {
  id: string;
  user_id: string;
  order_id: string;
  full_name: string;
  email: string;
  contact_number: string;
  order_type: string;
  order_name: string;
  status: "pending" | "verified" | "rejected";
  paid_amount: number;
  pending_amount: number;
  locked_price: number;
  screenshot_url: string | null;
  payment_screenshots: string[];
  created_at: string;
  updated_at: string;
}

// --- MAIN COMPONENT ---
export default function OrdersManager() {
  const supabase = createClient();

  // --- STATE MANAGEMENT ---
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [showPendingOnly, setShowPendingOnly] = useState<boolean>(false);
  const [typeFilter, setTypeFilter] = useState<string>("All");
  
  // Date Filters (Default to 7 days)
  const [dateRange, setDateRange] = useState<number>(7);
  const [showAllTime, setShowAllTime] = useState<boolean>(false);
  
  // Modal & Selection
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // --- DATA FETCHING & REAL-TIME ---
  const fetchAllData = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("orders_v2")
      .select("*")
      .order("updated_at", { ascending: false }); // Changed to updated_at

    if (error) {
      console.error("Error fetching orders:", error.message);
    } else if (data) {
      setOrders(data as Order[]);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchAllData();

    const channel = supabase
      .channel("admin-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders_v2" },
        () => fetchAllData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // --- CORE FUNCTIONS ---
  const handleVerifyPayment = async (order: Order, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (order.pending_amount <= 0) return;
    if (!confirm(`Verify Rs. ${order.pending_amount} for ${order.full_name}?`)) return;

    const newPaid = order.paid_amount + order.pending_amount;
    const { error } = await supabase
      .from("orders_v2")
      .update({
        paid_amount: newPaid,
        pending_amount: 0,
        status: "verified",
      })
      .eq("id", order.id);

    if (error) alert("Verification failed: " + error.message);
    else {
      fetchAllData();
      if (selectedOrder?.id === order.id) setIsModalOpen(false);
    }
  };

  const handleRejectPayment = async (order: Order, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (order.pending_amount <= 0) return;
    if (!confirm(`Reject pending payment of Rs. ${order.pending_amount} for ${order.full_name}?`)) return;

    const newStatus = order.paid_amount > 0 ? "verified" : "rejected";
    const { error } = await supabase
      .from("orders_v2")
      .update({
        pending_amount: 0,
        status: newStatus,
      })
      .eq("id", order.id);

    if (error) alert("Rejection failed: " + error.message);
    else {
      fetchAllData();
      if (selectedOrder?.id === order.id) setIsModalOpen(false);
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    const { error } = await supabase
      .from("orders_v2")
      .update({ status: newStatus })
      .eq("id", orderId);
      
    if (error) alert("Status update failed: " + error.message);
    else fetchAllData();
  };

  const handleDelete = async (orderId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (confirm("Are you sure you want to delete this order entirely? This action cannot be undone.")) {
      const { error } = await supabase.from("orders_v2").delete().eq("id", orderId);
      if (error) alert("Delete failed: " + error.message);
      else fetchAllData();
    }
  };

  const getImageUrl = (path: string) => {
    if (!path) return "";
    if (path.startsWith("http")) return path;
    const { data } = supabase.storage.from("others").getPublicUrl(path);
    return data.publicUrl;
  };

  // --- DATA FILTERING LOGIC ---
  const orderTypes = Array.from(new Set(orders.map((o) => o.order_type).filter(Boolean)));

  const filteredData = orders.filter((order) => {
    // 1. Hide orders where both paid and pending amounts are 0
    if (order.paid_amount === 0 && order.pending_amount === 0) return false;

    // 2. Search text matches (case-insensitive)
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch =
      (order.full_name && order.full_name.toLowerCase().includes(searchLower)) ||
      (order.email && order.email.toLowerCase().includes(searchLower)) ||
      (order.order_name && order.order_name.toLowerCase().includes(searchLower));
    if (!matchesSearch) return false;

    // 3. Match pending status only
    if (showPendingOnly && order.status !== "pending") return false;

    // 4. Match type filter
    if (typeFilter !== "All" && order.order_type !== typeFilter) return false;

    // 5. Match time filter based on selected dateRange (if not showing all time)
    if (!showAllTime) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - dateRange);
      // Fallback to created_at if updated_at is null for older records
      const dateToCompare = order.updated_at ? new Date(order.updated_at) : new Date(order.created_at);
      if (dateToCompare < cutoffDate) return false;
    }

    return true;
  });

  // Calculate total verified earnings for the displayed data
  const totalVerifiedEarning = filteredData
    .filter(order => order.status === "verified")
    .reduce((sum, order) => sum + order.paid_amount, 0);

  const openModal = (order: Order) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setSelectedOrder(null), 200); // Allow exit animation to finish
  };

  const statusColors = {
    pending: "bg-orange-100 text-orange-700 border-orange-200",
    verified: "bg-emerald-100 text-emerald-700 border-emerald-200",
    rejected: "bg-red-100 text-red-700 border-red-200",
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 pb-12">
      {/* HACK TO REMOVE GLOBAL FOOTER */}
      <style dangerouslySetInnerHTML={{ __html: `footer { display: none !important; }` }} />
      
      {/* HEADER & TOP ATTRACTION */}
      <div className="flex justify-between items-center flex-wrap gap-6 bg-white p-6 rounded-[24px] border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Order Management</h1>
          <p className="text-slate-500 font-medium mt-1">Review, filter, and verify financial transactions.</p>
        </div>
        
        {/* Total Earning Display */}
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white px-6 py-4 rounded-[20px] shadow-lg shadow-emerald-500/20 flex items-center gap-4">
          <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
            <Wallet size={24} className="text-white" />
          </div>
          <div>
            <p className="text-emerald-50 text-[11px] font-black uppercase tracking-widest opacity-90">Total Earning</p>
            <p className="text-3xl font-black">Rs. {totalVerifiedEarning.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* FILTERS SECTION */}
      <div className="flex flex-wrap items-center gap-4 bg-white p-4 rounded-[20px] border border-slate-200 shadow-sm">
        {/* Search */}
        <div className="relative flex-1 min-w-[250px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search name, email, or order..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full pl-11 pr-4 py-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all text-sm font-medium text-slate-700`}
          />
        </div>

        {/* Pending Only Checkbox */}
        <label className={`flex items-center gap-2 cursor-pointer border px-4 py-3 rounded-xl text-sm font-bold select-none transition-colors ${showPendingOnly ? 'bg-orange-50 border-orange-200 text-orange-700' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'}`}>
          <input
            type="checkbox"
            checked={showPendingOnly}
            onChange={(e) => setShowPendingOnly(e.target.checked)}
            className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500 border-slate-300"
          />
          Show Pending Only
        </label>

        {/* Type Dropdown */}
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className={`bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-indigo-500 cursor-pointer max-w-[200px]`}
        >
          <option value="All">All Order Types</option>
          {orderTypes.map((type, idx) => (
            <option key={idx} value={type}>{type}</option>
          ))}
        </select>

        {/* Date Range Dropdown */}
        <select
          value={dateRange}
          onChange={(e) => setDateRange(Number(e.target.value))}
          disabled={showAllTime}
          className={`bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-indigo-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          <option value={7}>Last 7 Days</option>
          <option value={15}>Last 15 Days</option>
          <option value={30}>Last 30 Days</option>
          <option value={90}>Last 90 Days</option>
        </select>

        {/* Toggle Show All Time */}
        <label className={`flex items-center gap-2 cursor-pointer border px-4 py-3 rounded-xl text-sm font-bold select-none transition-colors ${showAllTime ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'}`}>
          <input
            type="checkbox"
            checked={showAllTime}
            onChange={(e) => setShowAllTime(e.target.checked)}
            className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
          />
          Show All Time
        </label>
      </div>

      {/* MAIN TABLE VIEW */}
      <div className="bg-white rounded-[24px] shadow-sm border border-slate-200 overflow-x-auto w-full">
        {isLoading ? (
          <div className="p-10 text-center text-slate-500 font-medium">Loading orders...</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-black text-slate-400 uppercase tracking-widest">
                <th className="p-6">Date</th>
                <th className="p-6">Customer</th>
                <th className="p-6">Order Info</th>
                <th className="p-6 min-w-[220px]">Financials</th>
                <th className="p-6">Status</th>
                <th className="p-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {filteredData.map((order) => {
                  const remainingDue = Math.max(0, order.locked_price - order.paid_amount - order.pending_amount);
                  // Ensure updated_at fallback to created_at exists for display
                  const displayDate = order.updated_at ? new Date(order.updated_at) : new Date(order.created_at);
                  
                  return (
                    <motion.tr
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      key={order.id}
                      onClick={() => openModal(order)}
                      className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors"
                    >
                      <td className="p-6 text-sm text-slate-500 font-bold align-top whitespace-nowrap">
                        {displayDate.toLocaleDateString()}
                      </td>
                      <td className="p-6 align-top">
                        <p className="font-bold text-slate-900">{order.full_name}</p>
                        <p className="text-xs text-slate-500 mt-1">{order.contact_number}</p>
                        <p className="text-xs text-slate-400 truncate max-w-[200px]">{order.email}</p>
                      </td>
                      <td className="p-6 align-top">
                        <span className="uppercase text-[10px] tracking-widest bg-slate-100 border border-slate-200 px-2 py-1 rounded-md text-slate-500 whitespace-nowrap">
                          {order.order_type}
                        </span>
                        <p className="text-sm font-medium text-slate-700 mt-2 line-clamp-2 max-w-[250px]" title={order.order_name}>
                          {order.order_name}
                        </p>
                      </td>
                      <td className="p-6 align-top" onClick={(e) => e.stopPropagation()}>
                        <details className="group [&_summary::-webkit-details-marker]:hidden cursor-pointer">
                          <summary className="flex items-center gap-1 text-[11px] font-black uppercase text-indigo-600 bg-indigo-50 px-3 py-2 rounded-lg w-fit hover:bg-indigo-100 transition-colors border border-indigo-100">
                            View Breakdown
                            <ChevronDown size={14} className="group-open:rotate-180 transition-transform" />
                          </summary>
                          <div className="flex flex-col gap-1.5 mt-3 bg-slate-50 p-3 rounded-xl border border-slate-200 shadow-inner">
                            <div className="flex justify-between text-xs">
                              <span className="font-bold text-slate-500">Locked Price:</span>
                              <span className="font-bold text-slate-800">Rs.{order.locked_price}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="font-bold text-slate-500">Paid:</span>
                              <span className="font-black text-emerald-600">Rs.{order.paid_amount}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="font-bold text-slate-500">Pending:</span>
                              <span className={`font-black ${order.pending_amount > 0 ? "text-orange-500" : "text-slate-400"}`}>
                                Rs.{order.pending_amount}
                              </span>
                            </div>
                            <div className="flex justify-between text-xs border-t border-slate-200 pt-1.5 mt-0.5">
                              <span className="font-bold text-slate-500">Remaining:</span>
                              <span className="font-black text-red-500">Rs.{remainingDue}</span>
                            </div>
                          </div>
                        </details>
                      </td>
                      <td className="p-6 align-top" onClick={(e) => e.stopPropagation()}>
                        <div className="relative inline-block w-full max-w-[130px]">
                          <select
                            value={order.status}
                            onChange={(e) => handleStatusChange(order.id, e.target.value)}
                            className={`appearance-none w-full px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wider outline-none cursor-pointer border shadow-sm transition-all ${statusColors[order.status] || "bg-slate-100 text-slate-700 border-slate-200"}`}
                          >
                            <option value="pending">PENDING</option>
                            <option value="verified">VERIFIED</option>
                            <option value="rejected">REJECTED</option>
                          </select>
                          <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-50" />
                        </div>
                      </td>
                      <td className="p-6 text-right align-top">
                        <div className="flex flex-col items-end gap-2" onClick={(e) => e.stopPropagation()}>
                          <button onClick={() => openModal(order)} className="text-sm font-bold text-indigo-600 hover:text-indigo-800 whitespace-nowrap transition-colors">
                            View Details
                          </button>
                          
                          {/* VIEW INVOICE BUTTON ADDED HERE */}
                          <Link 
                            href={`/invoice/${order.id}`} 
                            className="text-sm font-bold text-slate-600 hover:text-slate-900 whitespace-nowrap transition-colors flex items-center gap-1 mt-1"
                          >
                            <FileText size={14} /> View Invoice
                          </Link>
                          
                          {order.pending_amount > 0 && (
                            <div className="flex gap-2 mt-2">
                              <button onClick={(e) => handleVerifyPayment(order, e)} className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition-colors" title="Verify Funds">
                                <CheckSquare size={16} />
                              </button>
                              <button onClick={(e) => handleRejectPayment(order, e)} className="p-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors" title="Reject Funds">
                                <X size={16} />
                              </button>
                            </div>
                          )}
                          
                          <button onClick={(e) => handleDelete(order.id, e)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors mt-auto" title="Delete Order">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
              
              {filteredData.length === 0 && !isLoading && (
                <tr>
                  <td colSpan={6} className="p-10 text-center text-slate-500 font-medium">
                    No orders match your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* DETAILED ORDER MODAL */}
      <AnimatePresence>
        {isModalOpen && selectedOrder && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm overflow-y-auto"
            onClick={closeModal}
          >
            <motion.div
              initial={{ y: 50, scale: 0.95 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: 20, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="bg-white rounded-[32px] shadow-2xl p-8 max-w-2xl w-full relative my-8"
              onClick={(e) => e.stopPropagation()}
            >
              <button onClick={closeModal} className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-full transition-colors">
                <X size={24} />
              </button>

              <h2 className="text-2xl font-black text-slate-900 mb-6 flex items-center gap-3">
                Order Details
                <span className={`text-xs px-3 py-1 rounded-full border uppercase tracking-widest ${statusColors[selectedOrder.status]}`}>
                  {selectedOrder.status}
                </span>
              </h2>

              {/* ACTION REQUIRED BANNER */}
              {selectedOrder.pending_amount > 0 && (
                <div className="mb-6 bg-orange-50 p-4 rounded-2xl border border-orange-200 flex items-center justify-between gap-4 shadow-sm">
                  <div className="flex gap-3 items-start">
                    <AlertCircle size={24} className="text-orange-500 shrink-0 mt-1 animate-pulse" />
                    <div>
                      <p className="text-orange-900 font-black">Action Required: Verify Funds</p>
                      <p className="text-orange-700 text-sm font-medium mt-1">
                        Rs. {selectedOrder.pending_amount} is pending review. Check the payment evidence below.
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 shrink-0">
                    <button onClick={() => handleVerifyPayment(selectedOrder)} className="px-4 py-2 bg-emerald-500 text-white text-xs font-bold rounded-xl shadow hover:bg-emerald-600 flex items-center justify-center gap-1 transition-colors">
                      <CheckSquare size={16} /> Verify
                    </button>
                    <button onClick={() => handleRejectPayment(selectedOrder)} className="px-4 py-2 bg-red-100 text-red-700 text-xs font-bold rounded-xl shadow-sm hover:bg-red-200 transition-colors flex items-center justify-center gap-1">
                      <X size={16} /> Reject
                    </button>
                  </div>
                </div>
              )}

              {/* INFO CARDS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 text-sm font-medium text-slate-700">
                {/* Customer Info */}
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 flex flex-col justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Customer Info</p>
                    <p className="mb-1"><span className="font-bold text-slate-800">Name:</span> {selectedOrder.full_name}</p>
                    <p className="mb-1 break-all"><span className="font-bold text-slate-800">Email:</span> {selectedOrder.email}</p>
                    <p className="mb-1"><span className="font-bold text-slate-800">Phone:</span> {selectedOrder.contact_number}</p>
                  </div>
                  <a
                    href={`https://wa.me/${(selectedOrder.contact_number || "").replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-5 flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20b858] text-white px-4 py-3 rounded-xl text-sm font-black shadow-sm transition-colors w-full"
                  >
                    <MessageCircle size={18} /> Contact via WhatsApp
                  </a>
                </div>

                {/* Financial Info */}
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Order Financials</p>
                  <p className="mb-1.5"><span className="font-bold text-slate-800">Type:</span> <span className="uppercase text-xs tracking-wider">{selectedOrder.order_type}</span></p>
                  <p className="mb-3 line-clamp-2" title={selectedOrder.order_name}><span className="font-bold text-slate-800">Target:</span> {selectedOrder.order_name}</p>
                  
                  <div className="space-y-1.5 bg-white p-3 rounded-xl border border-slate-200">
                    <p className="flex justify-between"><span className="text-slate-500">Locked Price:</span> <span className="font-bold">Rs. {selectedOrder.locked_price}</span></p>
                    <p className="flex justify-between"><span className="text-slate-500">Verified Paid:</span> <span className="font-black text-emerald-600">Rs. {selectedOrder.paid_amount}</span></p>
                    <p className="flex justify-between"><span className="text-slate-500">Pending Review:</span> <span className={`font-black ${selectedOrder.pending_amount > 0 ? 'text-orange-500' : 'text-slate-500'}`}>Rs. {selectedOrder.pending_amount}</span></p>
                    <div className="pt-1.5 border-t border-slate-100 mt-1">
                      <p className="flex justify-between"><span className="font-bold text-slate-800">Remaining Due:</span> <span className="font-black text-red-500">Rs. {Math.max(0, selectedOrder.locked_price - selectedOrder.paid_amount - selectedOrder.pending_amount)}</span></p>
                    </div>
                  </div>
                  
                  {/* VIEW INVOICE BUTTON ADDED TO MODAL */}
                  <Link 
                    href={`/invoice/${selectedOrder.id}`} 
                    className="mt-5 flex items-center justify-center gap-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 px-4 py-3 rounded-xl text-sm font-black shadow-sm transition-colors w-full"
                  >
                    <FileText size={18} /> View Generated Invoice
                  </Link>
                </div>
              </div>

              {/* PAYMENT EVIDENCE GALLERY */}
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 flex flex-col items-center">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 w-full text-center">
                  Payment Evidence ({selectedOrder.payment_screenshots?.length || (selectedOrder.screenshot_url ? 1 : 0)})
                </p>
                
                {selectedOrder.payment_screenshots && selectedOrder.payment_screenshots.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                    {selectedOrder.payment_screenshots.map((path, idx) => (
                      <a 
                        key={idx} 
                        href={getImageUrl(path)} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="block w-full relative group overflow-hidden rounded-xl border border-slate-200 shadow-sm"
                      >
                        <div className="absolute top-2 left-2 bg-slate-900/70 text-white text-[10px] font-black px-2.5 py-1 rounded-lg z-10 backdrop-blur-md">Upload {idx + 1}</div>
                        <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/10 transition-colors z-0 flex items-center justify-center">
                          <ExternalLink className="text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md" size={32} />
                        </div>
                        <img 
                          src={getImageUrl(path)} 
                          alt={`Payment Receipt ${idx + 1}`} 
                          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500" 
                        />
                      </a>
                    ))}
                  </div>
                ) : selectedOrder.screenshot_url ? (
                  <a 
                    href={getImageUrl(selectedOrder.screenshot_url)} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="block w-full relative group overflow-hidden rounded-xl border border-slate-200 shadow-sm"
                  >
                     <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/10 transition-colors z-0 flex items-center justify-center">
                        <ExternalLink className="text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md" size={32} />
                      </div>
                    <img 
                      src={getImageUrl(selectedOrder.screenshot_url)} 
                      alt="Payment Receipt" 
                      className="w-full max-h-80 object-contain bg-white group-hover:scale-[1.02] transition-transform duration-500" 
                    />
                  </a>
                ) : (
                  <div className="py-8 text-slate-400 italic font-medium flex flex-col items-center gap-2">
                    <Search className="opacity-30" size={32} />
                    No screenshot provided for this order.
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}