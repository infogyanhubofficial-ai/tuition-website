"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import { createBrowserClient } from "@supabase/ssr";
import {
  LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer
} from "recharts";
import {
  TrendingUp, TrendingDown, DollarSign, Target, AlertTriangle,
  Plus, BrainCircuit, Filter, X, Lock, Pencil, Trash2, Check
} from "lucide-react";

// --- TYPES (Matching your DB Schema) ---
type TransactionType = "revenue" | "tutor_payment" | "marketing_expense";

interface Transaction {
  id: number;
  course_date: string;
  transaction_type: TransactionType;
  syllabus_id: number | null;
  batch_name: string | null;
  amount: number;
  notes: string | null;
  syllabi_v2?: {
    name: string;
  } | null;
}

interface Syllabus {
  id: number;
  name: string;
}

// --- HELPER FUNCTIONS ---
const formatCurrency = (amount: number) => `Nrs ${amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
const safeDiv = (num: number, den: number) => den === 0 ? 0 : num / den;

// Timezone safe date string formatter (YYYY-MM-DD)
const getLocalDateString = (d: Date) => {
  const offset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - offset).toISOString().split('T')[0];
};

// --- MAIN COMPONENT ---
export default function AccountDashboard() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  
  // --- STATE ---
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pinInput, setPinInput] = useState("");
  
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [syllabiList, setSyllabiList] = useState<Syllabus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  // Filters
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [selectedCourse, setSelectedCourse] = useState<string>("All");

  // Modals & Inline Edit State
  const [selectedCourseForModal, setSelectedCourseForModal] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  // Add Transaction Form State
  const [formDate, setFormDate] = useState(getLocalDateString(new Date()));
  const [formType, setFormType] = useState<TransactionType>("revenue");
  const [formSyllabusId, setFormSyllabusId] = useState<string>("");
  const [formBatch, setFormBatch] = useState("");
  const [formAmount, setFormAmount] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit Transaction State
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<Transaction>>({});
  const [isUpdating, setIsUpdating] = useState(false);

  // --- DATA FETCHING ---
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    
    const { data: txData, error: txError } = await supabase
      .from('finance_transactions')
      .select(`
        id, 
        course_date, 
        transaction_type, 
        syllabus_id, 
        batch_name, 
        amount, 
        notes,
        syllabi_v2 ( name )
      `)
      .order('course_date', { ascending: false });

    if (txError) console.error("Error fetching transactions:", txError);
    else setAllTransactions(txData as unknown as Transaction[]);

    const { data: syllabusData, error: syllabusError } = await supabase
      .from('syllabi_v2')
      .select('id, name')
      .order('name', { ascending: true });

    if (syllabusError) console.error("Error fetching syllabi:", syllabusError);
    else setSyllabiList(syllabusData || []);

    setIsLoading(false);
  }, [supabase]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated, fetchData]);

  // --- HANDLERS ---
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput === "1191") {
      setIsAuthenticated(true);
    } else {
      alert("Incorrect PIN");
      setPinInput("");
    }
  };

  const setQuickDate = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);
    
    setEndDate(getLocalDateString(end));
    setStartDate(getLocalDateString(start));
  };

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formAmount || Number(formAmount) <= 0) return alert("Amount must be greater than 0");

    setIsSubmitting(true);
    const { error } = await supabase.from('finance_transactions').insert({
      course_date: formDate,
      transaction_type: formType,
      syllabus_id: formSyllabusId ? parseInt(formSyllabusId) : null,
      batch_name: formBatch.trim() || null,
      amount: Number(formAmount),
      notes: formNotes.trim() || null
    });

    if (error) {
      alert(`Error adding transaction: ${error.message}`);
    } else {
      setIsAddModalOpen(false);
      setFormAmount("");
      setFormNotes("");
      setFormBatch("");
      fetchData();
    }
    setIsSubmitting(false);
  };

  // --- EDIT & DELETE HANDLERS ---
  const handleEditClick = (tx: Transaction) => {
    setEditingId(tx.id);
    setEditFormData({
      course_date: tx.course_date,
      transaction_type: tx.transaction_type,
      syllabus_id: tx.syllabus_id,
      batch_name: tx.batch_name || "",
      amount: tx.amount,
      notes: tx.notes || ""
    });
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;
    if (!editFormData.amount || Number(editFormData.amount) <= 0) return alert("Amount must be greater than 0");

    setIsUpdating(true);
    const { error } = await supabase
      .from('finance_transactions')
      .update({
        course_date: editFormData.course_date,
        transaction_type: editFormData.transaction_type,
        syllabus_id: editFormData.syllabus_id ? Number(editFormData.syllabus_id) : null,
        batch_name: editFormData.batch_name?.trim() || null,
        amount: Number(editFormData.amount),
        notes: editFormData.notes?.trim() || null
      })
      .eq('id', editingId);

    if (error) {
      alert(`Error updating transaction: ${error.message}`);
    } else {
      setEditingId(null);
      fetchData();
    }
    setIsUpdating(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this transaction? This action cannot be undone.")) return;
    
    const { error } = await supabase.from('finance_transactions').delete().eq('id', id);
    if (error) {
      alert(`Error deleting transaction: ${error.message}`);
    } else {
      fetchData();
    }
  };

  // --- FILTER ENGINE ---
  const filteredTransactions = useMemo(() => {
    return allTransactions.filter((tx) => {
      const txDate = new Date(tx.course_date);
      const courseName = tx.syllabi_v2?.name || "Unknown Course";

      const isAfterStart = startDate ? txDate >= new Date(startDate) : true;
      const isBeforeEnd = endDate ? txDate <= new Date(endDate) : true;
      const matchesCourse = selectedCourse === "All" || courseName === selectedCourse;

      return isAfterStart && isBeforeEnd && matchesCourse;
    });
  }, [allTransactions, startDate, endDate, selectedCourse]);

  const availableCourses = useMemo(() => {
    const courses = new Set<string>();
    allTransactions.forEach(tx => {
      if (tx.syllabi_v2?.name) courses.add(tx.syllabi_v2.name);
    });
    return Array.from(courses).sort();
  }, [allTransactions]);

  // --- METRICS & BI ENGINE ---
  const { kpis, courseMetrics, chartData, alerts, aiInsights } = useMemo(() => {
    let rev = 0, tutExp = 0, mktExp = 0;
    
    type BatchMetrics = { rev: number; tut: number; mkt: number };
    const courseMap: Record<string, { 
      rev: number; tut: number; mkt: number; 
      batches: Record<string, BatchMetrics> 
    }> = {};
    const monthlyMap: Record<string, { rev: number; exp: number }> = {};

    filteredTransactions.forEach((tx) => {
      const val = Number(tx.amount);
      const month = tx.course_date.substring(0, 7);
      const courseName = tx.syllabi_v2?.name || "Unknown Course";
      const batchKey = tx.batch_name || "General/No Batch";

      if (!monthlyMap[month]) monthlyMap[month] = { rev: 0, exp: 0 };
      if (!courseMap[courseName]) courseMap[courseName] = { rev: 0, tut: 0, mkt: 0, batches: {} };
      if (!courseMap[courseName].batches[batchKey]) courseMap[courseName].batches[batchKey] = { rev: 0, tut: 0, mkt: 0 };

      if (tx.transaction_type === "revenue") {
        rev += val;
        monthlyMap[month].rev += val;
        courseMap[courseName].rev += val;
        courseMap[courseName].batches[batchKey].rev += val;
      } else if (tx.transaction_type === "tutor_payment") {
        tutExp += val;
        monthlyMap[month].exp += val;
        courseMap[courseName].tut += val;
        courseMap[courseName].batches[batchKey].tut += val;
      } else if (tx.transaction_type === "marketing_expense") {
        mktExp += val;
        monthlyMap[month].exp += val;
        courseMap[courseName].mkt += val;
        courseMap[courseName].batches[batchKey].mkt += val;
      }
    });

    const totalExp = tutExp + mktExp;
    const netProfit = rev - totalExp;
    const margin = safeDiv(netProfit, rev) * 100;
    const totalROI = safeDiv(rev - mktExp, mktExp) * 100;

    const courses = Object.entries(courseMap).map(([name, data]) => {
      const profit = data.rev - (data.tut + data.mkt);
      const margin = safeDiv(profit, data.rev) * 100;
      const roi = safeDiv(data.rev - data.mkt, data.mkt) * 100;
      
      let health = "Good";
      if (margin > 40 && roi > 200) health = "Excellent";
      if (margin < 10 || roi < 50) health = "Poor";
      if (profit < 0) health = "Critical";

      const batchList = Object.entries(data.batches).map(([bName, bData]) => {
        const bProfit = bData.rev - (bData.tut + bData.mkt);
        const bMargin = safeDiv(bProfit, bData.rev) * 100;
        return { name: bName, ...bData, profit: bProfit, margin: bMargin };
      }).sort((a, b) => b.profit - a.profit);

      return {
        name,
        revenue: data.rev,
        tutorCost: data.tut,
        marketingCost: data.mkt,
        profit,
        margin,
        roi,
        batchCount: Object.keys(data.batches).length,
        batchList,
        health
      };
    }).sort((a, b) => b.profit - a.profit);

    const trends = Object.entries(monthlyMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({
        name: month,
        Revenue: data.rev,
        Expenses: data.exp,
        Profit: data.rev - data.exp
      }));

    const generatedAlerts = [];
    if (totalExp > rev && rev > 0) generatedAlerts.push("🚨 Business is operating at a net loss in this period.");
    if (mktExp > rev * 0.5 && rev > 0) generatedAlerts.push("🚨 Marketing expenses exceed 50% of total revenue.");

    const topCourse = courses[0];
    const insights = [
      topCourse ? `${topCourse.name} is your top performer, generating ${formatCurrency(topCourse.profit)} in pure profit.` : "No revenue data available for this period.",
      margin > 30 ? "Overall business health is strong with a profit margin above 30%." : "Profit margins are tight. Consider reviewing tutor cost ratios.",
      mktExp > 0 ? `For every Nrs spent on marketing, you generate ${formatCurrency(safeDiv(rev, mktExp))} in revenue.` : "No marketing spend recorded in this timeframe."
    ].filter(Boolean);

    return {
      kpis: { rev, tutExp, mktExp, totalExp, netProfit, margin, totalROI },
      courseMetrics: courses,
      chartData: trends,
      alerts: generatedAlerts,
      aiInsights: insights
    };
  }, [filteredTransactions]);

  // --- PIN SCREEN ---
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 font-sans">
        <style dangerouslySetInnerHTML={{ __html: `footer, .footer { display: none !important; }` }} />
        <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-sm text-center">
          <div className="mx-auto bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mb-4">
            <Lock className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Admin Access</h2>
          <p className="text-sm text-gray-500 mb-6">Enter PIN to access financial intelligence.</p>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              autoFocus
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              className="w-full text-center text-2xl tracking-[0.5em] py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
              placeholder="••••"
            />
            <button
              type="submit"
              className="w-full bg-blue-600 text-white font-semibold py-3 rounded-xl hover:bg-blue-700 transition-colors"
            >
              Unlock Dashboard
            </button>
          </form>
        </div>
      </div>
    );
  }

  // --- UI COMPONENTS ---
  const StatCard = ({ title, value, icon: Icon, subtitle, colorClass }: any) => (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-start space-x-4">
      <div className={`p-3 rounded-lg ${colorClass}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div>
        <p className="text-sm text-gray-500 font-medium">{title}</p>
        <h3 className="text-2xl font-bold text-gray-900 mt-1">{value}</h3>
        {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
      </div>
    </div>
  );

  const selectedCourseData = courseMetrics.find(c => c.name === selectedCourseForModal);

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50">Loading Financial Data...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans relative">
      <style dangerouslySetInnerHTML={{ __html: `footer, .footer { display: none !important; }` }} />

      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">GyanHub Intelligence</h1>
          <p className="text-gray-500 mt-1">Financial overview & business metrics</p>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center text-sm font-medium shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" /> Add Transaction
          </button>
        </div>
      </div>

      {/* GLOBAL FILTERS */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-8 flex flex-wrap items-center gap-4">
        <div className="flex items-center text-gray-500 font-medium mr-2">
          <Filter className="w-5 h-5 mr-2" /> Filters:
        </div>
        
        <div className="flex space-x-2 mr-4 border-r border-gray-200 pr-6">
          <button onClick={() => setQuickDate(7)} className="px-3 py-1.5 text-xs font-medium bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors">Last 7 Days</button>
          <button onClick={() => setQuickDate(15)} className="px-3 py-1.5 text-xs font-medium bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors">Last 15 Days</button>
          <button onClick={() => setQuickDate(30)} className="px-3 py-1.5 text-xs font-medium bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors">Last 30 Days</button>
        </div>

        <div className="flex flex-col">
          <label className="text-[10px] uppercase font-bold text-gray-400 mb-1">Start Date</label>
          <input 
            type="date" 
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex flex-col">
          <label className="text-[10px] uppercase font-bold text-gray-400 mb-1">End Date</label>
          <input 
            type="date" 
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex flex-col">
          <label className="text-[10px] uppercase font-bold text-gray-400 mb-1">Course</label>
          <select 
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[150px]"
          >
            <option value="All">All Courses</option>
            {availableCourses.map(course => (
              <option key={course} value={course}>{course}</option>
            ))}
          </select>
        </div>

        {(startDate || endDate || selectedCourse !== "All") && (
          <div className="flex flex-col justify-end h-full mt-4">
            <button 
              onClick={() => { setStartDate(""); setEndDate(""); setSelectedCourse("All"); }}
              className="text-sm text-red-500 hover:text-red-700 font-medium px-2 py-1.5"
            >
              Clear
            </button>
          </div>
        )}
      </div>

      {/* ALERTS */}
      {alerts.length > 0 && (
        <div className="mb-8 space-y-2">
          {alerts.map((alert, i) => (
            <div key={i} className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-center text-sm">
              <AlertTriangle className="w-5 h-5 mr-3 text-red-600" />
              {alert}
            </div>
          ))}
        </div>
      )}

      {/* TOP KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard title="Total Revenue" value={formatCurrency(kpis.rev)} icon={TrendingUp} colorClass="bg-emerald-500" />
        <StatCard 
          title="Total Expenses" 
          value={formatCurrency(kpis.totalExp)} 
          icon={TrendingDown} 
          colorClass="bg-red-500" 
          subtitle={`Tutor: ${formatCurrency(kpis.tutExp)} | Mkt: ${formatCurrency(kpis.mktExp)}`} 
        />
        <StatCard 
          title="Net Profit" 
          value={formatCurrency(kpis.netProfit)} 
          icon={DollarSign} 
          colorClass="bg-blue-500" 
          subtitle={`${kpis.margin.toFixed(1)}% Profit Margin`} 
        />
        <StatCard 
          title="Marketing ROI" 
          value={`${kpis.totalROI.toFixed(1)}%`} 
          icon={Target} 
          colorClass="bg-purple-500" 
          subtitle="Revenue over Marketing Spend" 
        />
      </div>

      {/* TABS NAVIGATION */}
      <div className="flex space-x-1 border-b border-gray-200 mb-8">
        {["overview", "profitability", "ledger"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 text-sm font-medium capitalize border-b-2 transition-colors ${
              activeTab === tab ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* TAB CONTENT */}
      
      {/* 1. OVERVIEW TAB */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="col-span-2 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="text-lg font-semibold mb-6">Revenue vs Expenses Trend</h3>
              {chartData.length > 0 ? (
                <div className="h-72 w-full">
                  <ResponsiveContainer>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} />
                      <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => `${val/1000}k`} />
                      <RechartsTooltip formatter={(value: any) => formatCurrency(Number(value || 0))} />
                      <Legend />
                      <Line type="monotone" dataKey="Revenue" stroke="#10b981" strokeWidth={3} dot={{r: 4}} />
                      <Line type="monotone" dataKey="Expenses" stroke="#f43f5e" strokeWidth={3} dot={{r: 4}} />
                      <Line type="monotone" dataKey="Profit" stroke="#3b82f6" strokeWidth={3} dot={{r: 4}} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-72 flex items-center justify-center text-gray-400">No data for selected filters</div>
              )}
            </div>

            <div className="space-y-6">
              <div className="bg-gradient-to-br from-indigo-50 to-blue-50 p-6 rounded-xl border border-indigo-100 shadow-sm">
                <div className="flex items-center space-x-2 mb-4 text-indigo-800">
                  <BrainCircuit className="w-5 h-5" />
                  <h3 className="font-semibold text-lg">AI Financial Insights</h3>
                </div>
                <ul className="space-y-3">
                  {aiInsights.map((insight, idx) => (
                    <li key={idx} className="text-sm text-indigo-900 leading-relaxed bg-white/60 p-3 rounded-lg backdrop-blur-sm">
                      {insight}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="text-lg font-semibold mb-4">Expense Breakdown</h3>
                {(kpis.tutExp > 0 || kpis.mktExp > 0) ? (
                  <div className="h-48 w-full">
                    <ResponsiveContainer>
                      <PieChart>
                        <Pie data={[
                          { name: "Tutor Cost", value: kpis.tutExp },
                          { name: "Marketing Cost", value: kpis.mktExp }
                        ]} innerRadius={50} outerRadius={80} paddingAngle={5} dataKey="value">
                          <Cell fill="#f43f5e" />
                          <Cell fill="#f59e0b" />
                        </Pie>
                        <RechartsTooltip formatter={(value: any) => formatCurrency(Number(value || 0))} />
                        <Legend verticalAlign="bottom" height={36}/>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-48 flex items-center justify-center text-gray-400 text-sm">No expenses in this period</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. PROFITABILITY TAB */}
      {activeTab === "profitability" && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-800">Course & Marketing ROI Analysis</h3>
              <p className="text-sm text-gray-500">Click any course to view batch-level profitability</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-white text-gray-500 border-b border-gray-200">
                  <tr>
                    <th className="p-4 font-medium">Course Name</th>
                    <th className="p-4 font-medium">Batches</th>
                    <th className="p-4 font-medium">Revenue</th>
                    <th className="p-4 font-medium">Tutor Cost</th>
                    <th className="p-4 font-medium">Marketing</th>
                    <th className="p-4 font-medium">Net Profit</th>
                    <th className="p-4 font-medium">Margin</th>
                    <th className="p-4 font-medium">Health</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {courseMetrics.length > 0 ? courseMetrics.map((c, idx) => (
                    <tr 
                      key={idx} 
                      onClick={() => setSelectedCourseForModal(c.name)}
                      className="hover:bg-blue-50 cursor-pointer transition-colors"
                    >
                      <td className="p-4 font-medium text-blue-600 underline-offset-2 hover:underline">{c.name}</td>
                      <td className="p-4 text-gray-500">{c.batchCount}</td>
                      <td className="p-4 text-emerald-600 font-medium">{formatCurrency(c.revenue)}</td>
                      <td className="p-4 text-red-500">{formatCurrency(c.tutorCost)}</td>
                      <td className="p-4 text-orange-500">{formatCurrency(c.marketingCost)}</td>
                      <td className={`p-4 font-bold ${c.profit >= 0 ? "text-blue-600" : "text-red-600"}`}>
                        {formatCurrency(c.profit)}
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          c.margin >= 30 ? "bg-emerald-100 text-emerald-800" : 
                          c.margin > 0 ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800"
                        }`}>
                          {c.margin.toFixed(1)}%
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          c.health === "Excellent" ? "bg-green-100 text-green-700" :
                          c.health === "Good" ? "bg-blue-100 text-blue-700" :
                          c.health === "Poor" ? "bg-orange-100 text-orange-700" : "bg-red-100 text-red-700"
                        }`}>
                          {c.health}
                        </span>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-gray-500">No course data matches the current filters.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 3. RAW LEDGER TAB (Now with Inline Edit & Delete) */}
      {activeTab === "ledger" && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-800">Raw Ledger View</h3>
          </div>
          <div className="overflow-x-auto h-[600px] overflow-y-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-white text-gray-500 sticky top-0 border-b border-gray-200 shadow-sm z-10">
                <tr>
                  <th className="p-4 font-medium w-32">Date</th>
                  <th className="p-4 font-medium w-40">Type</th>
                  <th className="p-4 font-medium w-48">Course</th>
                  <th className="p-4 font-medium w-32">Batch</th>
                  <th className="p-4 font-medium">Notes</th>
                  <th className="p-4 font-medium text-right w-32">Amount</th>
                  <th className="p-4 font-medium text-center w-24">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredTransactions.length > 0 ? filteredTransactions.map((tx) => (
                  <tr key={tx.id} className={`hover:bg-gray-50 transition-colors ${editingId === tx.id ? 'bg-blue-50/50' : ''}`}>
                    
                    {/* DATE */}
                    <td className="p-4">
                      {editingId === tx.id ? (
                        <input 
                          type="date" 
                          value={editFormData.course_date} 
                          onChange={e => setEditFormData({...editFormData, course_date: e.target.value})}
                          className="w-full border border-gray-300 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                        />
                      ) : (
                        <span className="text-gray-600">{tx.course_date}</span>
                      )}
                    </td>

                    {/* TYPE */}
                    <td className="p-4">
                      {editingId === tx.id ? (
                        <select 
                          value={editFormData.transaction_type} 
                          onChange={e => setEditFormData({...editFormData, transaction_type: e.target.value as TransactionType})}
                          className="w-full border border-gray-300 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                        >
                          <option value="revenue">Revenue</option>
                          <option value="tutor_payment">Tutor Payment</option>
                          <option value="marketing_expense">Marketing Expense</option>
                        </select>
                      ) : (
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          tx.transaction_type === "revenue" ? "bg-emerald-100 text-emerald-800" : 
                          tx.transaction_type === "tutor_payment" ? "bg-red-100 text-red-800" : "bg-orange-100 text-orange-800"
                        }`}>
                          {tx.transaction_type.replace('_', ' ').toUpperCase()}
                        </span>
                      )}
                    </td>

                    {/* COURSE */}
                    <td className="p-4">
                      {editingId === tx.id ? (
                        <select 
                          value={editFormData.syllabus_id || ""} 
                          onChange={e => setEditFormData({...editFormData, syllabus_id: e.target.value ? Number(e.target.value) : null})}
                          className="w-full border border-gray-300 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                        >
                          <option value="">-- None --</option>
                          {syllabiList.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                      ) : (
                        <span className="text-gray-900 font-medium">{tx.syllabi_v2?.name || "N/A"}</span>
                      )}
                    </td>

                    {/* BATCH */}
                    <td className="p-4">
                      {editingId === tx.id ? (
                        <input 
                          type="text" 
                          placeholder="Batch"
                          value={editFormData.batch_name || ""} 
                          onChange={e => setEditFormData({...editFormData, batch_name: e.target.value})}
                          className="w-full border border-gray-300 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                        />
                      ) : (
                        <span className="text-gray-600">{tx.batch_name || "-"}</span>
                      )}
                    </td>

                    {/* NOTES */}
                    <td className="p-4">
                      {editingId === tx.id ? (
                        <input 
                          type="text" 
                          placeholder="Notes"
                          value={editFormData.notes || ""} 
                          onChange={e => setEditFormData({...editFormData, notes: e.target.value})}
                          className="w-full border border-gray-300 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                        />
                      ) : (
                        <span className="text-gray-500 max-w-xs truncate block">{tx.notes || "-"}</span>
                      )}
                    </td>

                    {/* AMOUNT */}
                    <td className="p-4 text-right">
                      {editingId === tx.id ? (
                        <input 
                          type="number" 
                          step="0.01"
                          value={editFormData.amount} 
                          onChange={e => setEditFormData({...editFormData, amount: Number(e.target.value)})}
                          className="w-24 border border-gray-300 rounded px-2 py-1 text-xs text-right focus:ring-1 focus:ring-blue-500 focus:outline-none ml-auto block"
                        />
                      ) : (
                        <span className={`font-medium ${tx.transaction_type === "revenue" ? "text-emerald-600" : "text-gray-900"}`}>
                          {tx.transaction_type === "revenue" ? "+" : "-"}{formatCurrency(tx.amount)}
                        </span>
                      )}
                    </td>

                    {/* ACTIONS */}
                    <td className="p-4 text-center">
                      {editingId === tx.id ? (
                        <div className="flex justify-center space-x-2">
                          <button 
                            onClick={handleSaveEdit} 
                            disabled={isUpdating}
                            className="text-green-600 hover:bg-green-100 p-1.5 rounded transition-colors disabled:opacity-50"
                            title="Save"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => setEditingId(null)} 
                            className="text-gray-500 hover:bg-gray-200 p-1.5 rounded transition-colors"
                            title="Cancel"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex justify-center space-x-2 opacity-0 group-hover:opacity-100 md:opacity-100 transition-opacity">
                          <button 
                            onClick={() => handleEditClick(tx)} 
                            className="text-blue-600 hover:bg-blue-100 p-1.5 rounded transition-colors"
                            title="Edit"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDelete(tx.id)} 
                            className="text-red-500 hover:bg-red-100 p-1.5 rounded transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-gray-500">No transactions match the current filters.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- BATCH PROFITABILITY MODAL --- */}
      {selectedCourseForModal && selectedCourseData && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gray-50">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{selectedCourseData.name} - Batches</h2>
                <p className="text-sm text-gray-500">Detailed profitability breakdown by batch</p>
              </div>
              <button onClick={() => setSelectedCourseForModal(null)} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div className="overflow-y-auto p-0">
              <table className="w-full text-left text-sm">
                <thead className="bg-white text-gray-500 sticky top-0 border-b border-gray-200">
                  <tr>
                    <th className="p-4 font-medium">Batch Name</th>
                    <th className="p-4 font-medium">Revenue</th>
                    <th className="p-4 font-medium">Tutor Cost</th>
                    <th className="p-4 font-medium">Marketing</th>
                    <th className="p-4 font-medium">Net Profit</th>
                    <th className="p-4 font-medium">Margin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {selectedCourseData.batchList.map((b, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="p-4 font-medium text-gray-900">{b.name}</td>
                      <td className="p-4 text-emerald-600">{formatCurrency(b.rev)}</td>
                      <td className="p-4 text-red-500">{formatCurrency(b.tut)}</td>
                      <td className="p-4 text-orange-500">{formatCurrency(b.mkt)}</td>
                      <td className={`p-4 font-bold ${b.profit >= 0 ? "text-blue-600" : "text-red-600"}`}>
                        {formatCurrency(b.profit)}
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          b.margin >= 30 ? "bg-emerald-100 text-emerald-800" : 
                          b.margin > 0 ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800"
                        }`}>
                          {b.margin.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --- ADD TRANSACTION MODAL --- */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col overflow-hidden">
            <div className="p-5 border-b border-gray-200 flex justify-between items-center bg-gray-50">
              <h2 className="text-lg font-bold text-gray-900">Add Transaction</h2>
              <button onClick={() => setIsAddModalOpen(false)} className="p-1 hover:bg-gray-200 rounded-full transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <form onSubmit={handleAddTransaction} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input 
                  type="date" 
                  required
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Transaction Type</label>
                <select 
                  value={formType}
                  onChange={(e) => setFormType(e.target.value as TransactionType)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="revenue">Revenue (Income)</option>
                  <option value="tutor_payment">Tutor Payment (Expense)</option>
                  <option value="marketing_expense">Marketing Expense</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Course (Optional)</label>
                <select 
                  value={formSyllabusId}
                  onChange={(e) => setFormSyllabusId(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Select Course --</option>
                  {syllabiList.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Batch Name (Optional)</label>
                <input 
                  type="text" 
                  placeholder="e.g. Morning-Batch-A"
                  value={formBatch}
                  onChange={(e) => setFormBatch(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount (Nrs)</label>
                <input 
                  type="number" 
                  required
                  min="1"
                  step="0.01"
                  placeholder="0.00"
                  value={formAmount}
                  onChange={(e) => setFormAmount(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
                <textarea 
                  rows={2}
                  placeholder="Additional details..."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-4 flex justify-end space-x-3">
                <button 
                  type="button" 
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center transition-colors"
                >
                  {isSubmitting ? "Saving..." : "Save Transaction"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}