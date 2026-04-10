"use client";

import React from 'react';
import Link from 'next/link';

export default function RapidFireIntroPage() {
  return (
    /* 1 & 25: Layout shell with improved background, moved upward slightly */
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#eff6ff,_#f8fafc_40%,_#f8fafc_100%)] px-4 pt-8 pb-12 md:pt-12 flex items-start justify-center">
      
      {/* 2 & 15: Increased content richness and premium max-width */}
      <div className="mx-auto max-w-3xl w-full">
        
        {/* 16: Improved Breadcrumb - Pill style, sharp, aligned */}
        <nav className="mb-8 flex items-center justify-center space-x-2 text-xs sm:text-sm font-medium text-slate-500">
          <Link 
            href="/quiz" 
            className="rounded-full bg-slate-200/60 px-3 py-1 hover:bg-slate-200 hover:text-slate-900 transition-colors"
          >
            Quiz Home
          </Link>
          <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
          <span className="rounded-full bg-white px-3 py-1 text-slate-900 shadow-sm border border-slate-200/60">
            Rapid Fire
          </span>
        </nav>

        {/* 3 & 14: Upgraded card styling with subtle hover motion/shadow */}
        <div className="group rounded-[28px] border border-slate-200/80 bg-white/90 backdrop-blur p-5 sm:p-8 md:p-12 shadow-[0_10px_40px_rgba(15,23,42,0.08)] text-center transition-all duration-300 hover:shadow-[0_15px_50px_rgba(15,23,42,0.12)]">
          
          {/* 2: Small Badge above title */}
          <div className="mb-6 inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 ring-1 ring-inset ring-blue-600/20">
            NEC Civil License Practice
          </div>

          {/* 4 & 14: Upgraded visual badge (Icon Area) with pulse/glow */}
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-orange-100 to-blue-100 text-orange-600 shadow-lg ring-1 ring-orange-200 transition-transform duration-300 group-hover:scale-105 group-hover:shadow-orange-200/50">
            <svg className="w-10 h-10 drop-shadow-sm" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          
          {/* 5: Better title hierarchy */}
          <h1 className="mb-2 text-2xl sm:text-3xl md:text-5xl font-extrabold tracking-tight text-slate-900">
            Rapid Fire Challenge
          </h1>
          <p className="mb-4 text-xs sm:text-sm font-bold text-orange-500 uppercase tracking-widest">
            Quick Revision Mode
          </p>
          
          {/* 6 & 20: Tighter, premium description copy, optimized widths */}
          <p className="mb-10 text-sm sm:text-base md:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
            Practice 20 mixed NEC Civil questions from across multiple chapters in a fast-paced challenge designed for revision, speed, and confidence building.
          </p>

          {/* 7, 8, 9, 14: Upgraded Stats Grid (Interactive stat cards, duration, balanced text) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
            <div className="rounded-2xl bg-slate-50 hover:bg-white border border-slate-200 p-4 sm:p-5 text-center transition-all duration-200 hover:-translate-y-1 hover:shadow-md cursor-default">
              <span className="block text-xl font-black text-slate-800">20</span>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 mt-1 block">Questions</span>
            </div>
            
            <div className="rounded-2xl bg-slate-50 hover:bg-white border border-slate-200 p-4 sm:p-5 text-center transition-all duration-200 hover:-translate-y-1 hover:shadow-md cursor-default">
              <span className="block text-xl font-black text-slate-800">Mixed</span>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 mt-1 block">Chapters</span>
            </div>
            
            <div className="rounded-2xl bg-slate-50 hover:bg-white border border-slate-200 p-4 sm:p-5 text-center transition-all duration-200 hover:-translate-y-1 hover:shadow-md cursor-default">
              <span className="block text-xl font-black text-slate-800">Balanced</span>
              <span className="text-[10px] font-semibold text-slate-400 mt-1 block">Easy • Med • Hard</span>
            </div>
            
            <div className="rounded-2xl bg-slate-50 hover:bg-white border border-slate-200 p-4 sm:p-5 text-center transition-all duration-200 hover:-translate-y-1 hover:shadow-md cursor-default ring-1 ring-blue-100 bg-blue-50/30">
              <span className="block text-xl font-black text-blue-700">~12m</span>
              <span className="text-xs font-bold uppercase tracking-wider text-blue-500 mt-1 block">Est. Time</span>
            </div>
          </div>

          {/* 11: Trust and exam relevance badge */}
          <div className="flex items-center justify-center gap-2 mb-8 text-sm text-slate-600 font-medium">
            <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Based on NEC Civil syllabus pattern
          </div>

          {/* 12, 13, 24: Action Buttons (Stronger CTA, secondary action, focus states) */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              href="/quiz/rapid-fire/play"
              className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-8 sm:px-10 py-4 text-base font-bold text-white shadow-lg transition-all hover:bg-slate-800 hover:-translate-y-0.5 active:translate-y-0 focus:outline-none focus:ring-4 focus:ring-slate-300"
            >
              Start Rapid Fire
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
            
            <Link 
              href="/quiz"
              className="w-full sm:w-auto rounded-2xl bg-white px-8 sm:px-10 py-4 text-base font-bold text-slate-700 border border-slate-200 shadow-sm transition-all hover:bg-slate-50 hover:-translate-y-0.5 active:translate-y-0 focus:outline-none focus:ring-4 focus:ring-slate-100"
            >
              Back to Modes
            </Link>
          </div>

          {/* 12 & 18: Supportive microcopy and preview text */}
          <p className="mt-6 text-xs sm:text-sm text-slate-400 font-medium">
            No signup friction • Instant start • Mobile friendly
          </p>

        </div>
        
        {/* 22: Scoreboard / Community Hook Teaser (Optional block below card) */}
        <div className="mt-8 text-center text-sm text-slate-500">
          <p>Join <span className="font-semibold text-slate-700">1,240+</span> engineers practicing today.</p>
        </div>

      </div>
    </div>
  );
}