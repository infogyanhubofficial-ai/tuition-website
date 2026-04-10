"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function PricingPage() {
  const router = useRouter();
  const [billingCycle, setBillingCycle] = useState('monthly'); // 'monthly' or 'full_access'
  const [loading, setLoading] = useState(false);

  const features = [
    { name: "Unlimited Rapid Fire Sets", free: "20 Sets Total", premium: true },
    { name: "All 10 ACiE Chapters Unlocked", free: "First 5 Only", premium: true },
    { name: "Full Model Exams", free: "2 Free Exams", premium: "Unlimited" },
    { name: "Detailed AI Performance Analytics", free: false, premium: true },
    { name: "Topic-wise Weakness Detection", free: false, premium: true },
    { name: "Downloadable PDF Explanations", free: false, premium: true },
    { name: "No Advertisements", free: false, premium: true },
  ];

  const handleUpgrade = (gateway) => {
    setLoading(true);
    // Simulate redirect to payment gateway (eSewa/Khalti)
    setTimeout(() => {
      alert(`Redirecting to ${gateway} Secure Payment Gateway...`);
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-white pb-20">
      {/* --- HERO SECTION --- */}
      <div className="relative overflow-hidden bg-slate-900 pt-16 pb-32 text-center text-white">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full opacity-10 pointer-events-none">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-500 via-transparent to-transparent"></div>
        </div>
        
        <div className="relative z-10 mx-auto max-w-3xl px-4">
          <h1 className="text-4xl font-black md:text-6xl mb-6 tracking-tight">
            Don't leave your <span className="text-blue-400">License</span> to chance.
          </h1>
          <p className="text-lg text-slate-400 mb-10 leading-relaxed">
            Join 5,000+ Nepali engineers using GyanHub Premium to pass the NEC License Exam on their first attempt.
          </p>

          {/* Toggle */}
          <div className="inline-flex items-center p-1 bg-slate-800 rounded-2xl mb-8 border border-slate-700">
            <button 
                onClick={() => setBillingCycle('monthly')}
                className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${billingCycle === 'monthly' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400'}`}
            >
              Monthly
            </button>
            <button 
                onClick={() => setBillingCycle('full_access')}
                className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${billingCycle === 'full_access' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400'}`}
            >
              Exam-Pass Full Access
            </button>
          </div>
        </div>
      </div>

      {/* --- PRICING CARDS --- */}
      <div className="mx-auto -mt-20 max-w-5xl px-4 grid grid-cols-1 md:grid-cols-2 gap-8 relative z-20">
        
        {/* FREE TIER */}
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xl flex flex-col">
          <div className="mb-6">
            <h3 className="text-xl font-bold text-slate-900">Basic Explorer</h3>
            <p className="text-sm text-slate-500 mt-1">Perfect for testing the platform.</p>
          </div>
          <div className="mb-8">
            <span className="text-4xl font-black text-slate-900">Rs. 0</span>
            <span className="text-slate-400 font-bold ml-2">/ Forever</span>
          </div>
          <ul className="space-y-4 mb-10 flex-1">
            {features.map((f, i) => (
              <li key={i} className={`flex items-center text-sm ${f.free ? 'text-slate-700' : 'text-slate-300 line-through'}`}>
                {f.free ? (
                    <svg className="w-5 h-5 text-emerald-500 mr-3 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                ) : (
                    <svg className="w-5 h-5 text-slate-300 mr-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                )}
                <span>{typeof f.free === 'string' ? f.free : f.name}</span>
              </li>
            ))}
          </ul>
          <button disabled className="w-full py-4 rounded-xl font-bold border border-slate-200 text-slate-400 bg-slate-50">
            Current Plan
          </button>
        </div>

        {/* PREMIUM TIER */}
        <div className="rounded-3xl border-2 border-blue-600 bg-white p-8 shadow-2xl flex flex-col relative transform md:scale-105">
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest">Most Popular</div>
          
          <div className="mb-6">
            <h3 className="text-xl font-bold text-slate-900">GyanHub Premium</h3>
            <p className="text-sm text-slate-500 mt-1">Unlock everything you need to pass.</p>
          </div>
          <div className="mb-8">
            <span className="text-4xl font-black text-slate-900">
                {billingCycle === 'monthly' ? 'Rs. 499' : 'Rs. 1,999'}
            </span>
            <span className="text-slate-400 font-bold ml-2">
                {billingCycle === 'monthly' ? '/ Month' : '/ Full Exam Season'}
            </span>
            {billingCycle === 'full_access' && (
                <p className="text-emerald-600 text-xs font-bold mt-2">Save 40% compared to monthly billing</p>
            )}
          </div>
          <ul className="space-y-4 mb-10 flex-1">
            {features.map((f, i) => (
              <li key={i} className="flex items-center text-sm text-slate-700 font-medium">
                <svg className="w-5 h-5 text-blue-600 mr-3 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                <span>{typeof f.premium === 'string' ? f.premium : f.name}</span>
              </li>
            ))}
          </ul>

          <div className="space-y-3">
            <p className="text-[10px] text-center font-bold text-slate-400 uppercase">Pay Securely Via</p>
            <div className="grid grid-cols-2 gap-3">
                <button 
                    onClick={() => handleUpgrade('eSewa')}
                    className="flex items-center justify-center py-3 px-4 rounded-xl border border-slate-200 hover:border-emerald-500 transition-colors group"
                >
                    <img src="https://blog.esewa.com.np/wp-content/uploads/2021/12/esewa_logo.png" className="h-6 grayscale group-hover:grayscale-0 transition-all" alt="eSewa" />
                </button>
                <button 
                    onClick={() => handleUpgrade('Khalti')}
                    className="flex items-center justify-center py-3 px-4 rounded-xl border border-slate-200 hover:border-purple-500 transition-colors group"
                >
                    <img src="https://khalti.com/static/img/logo1.png" className="h-6 grayscale group-hover:grayscale-0 transition-all" alt="Khalti" />
                </button>
            </div>
            <button 
                onClick={() => handleUpgrade('Fonepay')}
                className="w-full py-4 rounded-xl font-bold bg-slate-900 text-white shadow-lg hover:bg-slate-800 transition-all"
            >
              Pay with Fonepay / QR
            </button>
          </div>
        </div>
      </div>

      {/* --- TRUST SECTION --- */}
      <div className="mx-auto max-w-4xl px-4 mt-24 text-center">
        <h2 className="text-2xl font-bold text-slate-900 mb-12">Frequently Asked Questions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
            <div>
                <h4 className="font-bold text-slate-900 mb-2">What is the "Exam Season" plan?</h4>
                <p className="text-sm text-slate-500">This gives you full access until the next NEC License Exam is held. If the exam is delayed, your access is automatically extended.</p>
            </div>
            <div>
                <h4 className="font-bold text-slate-900 mb-2">Can I pay via Bank Transfer?</h4>
                <p className="text-sm text-slate-500">Yes! Message our support on WhatsApp and we will activate your account manually after you send the screenshot.</p>
            </div>
            <div>
                <h4 className="font-bold text-slate-900 mb-2">Is there a refund policy?</h4>
                <p className="text-sm text-slate-500">If you find the content is not as per the ACiE syllabus, we offer a 24-hour no-questions-asked refund.</p>
            </div>
            <div>
                <h4 className="font-bold text-slate-900 mb-2">Can I share my account?</h4>
                <p className="text-sm text-slate-500">Accounts are for individual use. Simultaneous logins from different locations will trigger a temporary lock for security.</p>
            </div>
        </div>
      </div>
      
      {/* WhatsApp Floating Button */}
      <a 
        href="https://wa.me/9779800000000" 
        target="_blank"
        className="fixed bottom-6 right-6 bg-emerald-500 text-white p-4 rounded-full shadow-2xl hover:scale-110 transition-transform z-50 flex items-center justify-center"
      >
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.89 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.743-.981z" /></svg>
      </a>
    </div>
  );
}