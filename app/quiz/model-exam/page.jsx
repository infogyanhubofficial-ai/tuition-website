"use client";

import React from 'react';
import Link from 'next/link';

export default function ModelExamIntroPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 flex items-center justify-center">
      <div className="mx-auto max-w-3xl w-full">
        
        {/* BREADCRUMB */}
        <div className="mb-6 text-sm text-slate-500 text-center">
          <Link href="/quiz" className="hover:text-blue-600 transition-colors">Quiz Home</Link>
          <span className="mx-2">/</span>
          <span className="text-slate-900 font-medium bg-slate-200 px-2 py-0.5 rounded">NEC Model Exam</span>
        </div>

        {/* MAIN CARD */}
        <div className="rounded-3xl border border-slate-200 bg-white p-8 md:p-12 shadow-sm text-center">
          
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
          </div>
          
          <h1 className="mb-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            NEC Model Exam
          </h1>
          
          <p className="mb-10 text-base text-slate-600 leading-relaxed max-w-xl mx-auto">
            Simulate the exact experience of the Nepal Engineering Council license exam. The syllabus weightage, marking scheme, and time limit are strictly enforced.
          </p>

          {/* Exam Specs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10 text-left max-w-2xl mx-auto">
            
            <div className="rounded-xl bg-slate-50 p-5 border border-slate-100 flex items-center">
              <div className="h-10 w-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mr-4 shrink-0">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <div>
                <p className="text-sm font-bold uppercase tracking-wider text-slate-500">Duration</p>
                <p className="text-xl font-bold text-slate-900">2 Hours</p>
              </div>
            </div>

            <div className="rounded-xl bg-slate-50 p-5 border border-slate-100 flex items-center">
              <div className="h-10 w-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mr-4 shrink-0">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <div>
                <p className="text-sm font-bold uppercase tracking-wider text-slate-500">Total Marks</p>
                <p className="text-xl font-bold text-slate-900">100 Marks</p>
              </div>
            </div>

          </div>

          {/* Instructions Box */}
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-6 text-left max-w-2xl mx-auto mb-10">
            <h4 className="font-bold text-amber-900 mb-3 flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              Important Instructions
            </h4>
            <ul className="space-y-2 text-sm text-amber-800 list-disc list-inside">
              <li>The exam consists of <strong>80 questions</strong> (60 questions of 1 mark, 20 questions of 2 marks).</li>
              <li>The timer cannot be paused once started.</li>
              <li>You can navigate between questions using the Question Palette.</li>
              <li>The exam will auto-submit when the timer reaches zero.</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <Link 
            href="/quiz/model-exam/play"
            className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-12 py-4 text-base font-bold text-white shadow-sm transition-all hover:bg-emerald-700 hover:-translate-y-0.5"
          >
            Start Official Mock Test
          </Link>

        </div>
      </div>
    </div>
  );
}