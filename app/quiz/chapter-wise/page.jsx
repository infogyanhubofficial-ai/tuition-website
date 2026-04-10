"use client";

import React, { useState } from 'react';
import Link from 'next/link';

// --- REUSABLE COMPONENT: ChapterCard ---
const ChapterCard = ({ 
  chapterCode, title, description, total, easy, medium, hard, 
  progress, bestScore, isWeak, isPopular, readiness 
}) => {
  
  // Calculate progress percentage
  const progressPercent = Math.round((progress / total) * 100) || 0;

  return (
    <div className="group relative flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-4 md:p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-300 hover:shadow-lg overflow-hidden">
      
      {/* Subtle top border highlight on hover */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-indigo-500 opacity-0 transition-opacity group-hover:opacity-100"></div>

      <div>
        {/* Top Row: Code Badge & Intelligence Badges */}
        <div className="mb-4 flex items-center justify-between">
          <span className="inline-flex items-center rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-bold tracking-wide text-blue-700 border border-blue-100">
            {chapterCode}
          </span>
          <div className="flex gap-2">
            {isPopular && (
              <span className="inline-flex items-center rounded-md bg-orange-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-orange-600 border border-orange-100">
                🔥 Popular
              </span>
            )}
            {isWeak && (
              <span className="inline-flex items-center rounded-md bg-rose-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-rose-600 border border-rose-100">
                ⚠️ Needs Practice
              </span>
            )}
          </div>
        </div>
        
        {/* Title & Description */}
        <h3 className="mb-1.5 text-lg font-bold text-slate-900 line-clamp-1">{title}</h3>
        <p className="mb-5 text-sm text-slate-500 line-clamp-2 leading-relaxed">
          {description}
        </p>
      </div>

      <div>
        {/* Chapter Progress & Readiness */}
        <div className="mb-5 rounded-xl bg-slate-50 p-3 border border-slate-100">
          <div className="flex justify-between items-end mb-2">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Readiness</p>
              <p className="text-sm font-bold text-slate-800">{readiness}% Ready</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Attempted</p>
              <p className="text-sm font-bold text-slate-800">{progress} <span className="text-slate-400 text-xs font-medium">/ {total}</span></p>
            </div>
          </div>
          <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${progressPercent}%` }}></div>
          </div>
        </div>

        {/* Stats Row (Difficulty & Time) */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between text-xs font-medium text-slate-600">
          {/* Difficulty Dots (Mobile stacked, Desktop inline) */}
          <div className="flex flex-wrap gap-3">
            <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-emerald-400 mr-1.5"></span>{easy}</span>
            <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-amber-400 mr-1.5"></span>{medium}</span>
            <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-rose-400 mr-1.5"></span>{hard}</span>
          </div>
          <div className="flex gap-3 sm:justify-end">
            <span className="flex items-center text-slate-500"><svg className="w-3.5 h-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> ~12m</span>
            {bestScore && <span className="text-emerald-600 font-bold">Best: {bestScore}</span>}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2.5">
          <Link 
            href={`/quiz/chapter-wise/${chapterCode}`} 
            className="flex-1 inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-3.5 text-sm font-bold text-white transition-all shadow-sm hover:bg-blue-700 hover:shadow-md"
          >
            Start Practice
          </Link>
          <Link 
            href={`/quiz/chapter-wise/${chapterCode}/play?difficulty=mixed`} 
            className="sm:w-auto inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50 hover:text-blue-600"
            title="Quick 10 Questions"
          >
            ⚡ Quick Start
          </Link>
        </div>
      </div>
    </div>
  );
};


export default function ChapterSelectionPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState("default");

  // INTELLIGENT DUMMY DATA: Now includes progress, weak flags, and readiness
  const chapters = [
    { code: "ACiE0101", title: "Engineering Materials", description: "Properties, types, and characteristics of stones, bricks, cement, timber, metals, and paints.", total: 120, easy: 40, medium: 50, hard: 30, progress: 45, readiness: 65, bestScore: "8/10", isWeak: false, isPopular: true },
    { code: "ACiE0105", title: "Surveying and Levelling", description: "Fundamentals of surveying, linear/vertical distance measurements, compass surveying, and contouring.", total: 95, easy: 30, medium: 45, hard: 20, progress: 12, readiness: 30, bestScore: "4/10", isWeak: true, isPopular: false },
    { code: "ACiE0202", title: "Soil Classification", description: "Index properties of soil, phase relationships, atterberg limits, and unified soil classification system.", total: 150, easy: 50, medium: 60, hard: 40, progress: 140, readiness: 92, bestScore: "10/10", isWeak: false, isPopular: false },
    { code: "ACiE0301", title: "Structural Analysis", description: "Determinate and indeterminate structures, shear force, bending moment diagrams, and truss analysis.", total: 110, easy: 20, medium: 50, hard: 40, progress: 5, readiness: 15, bestScore: null, isWeak: true, isPopular: true },
    { code: "ACiE0601", title: "Water Supply Engineering", description: "Sources of water, water demand, quality standards, and treatment processes.", total: 80, easy: 35, medium: 30, hard: 15, progress: 0, readiness: 0, bestScore: null, isWeak: false, isPopular: false }
  ];

  // Search & Sort Logic
  let processedChapters = chapters.filter(chapter => 
    chapter.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    chapter.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (sortOption === "weakest") {
    processedChapters = processedChapters.sort((a, b) => a.readiness - b.readiness);
  } else if (sortOption === "attempted") {
    processedChapters = processedChapters.sort((a, b) => b.progress - a.progress);
  }

  return (
    // Background with faint engineering grid pattern
    <div className="min-h-screen bg-slate-50 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px] py-8 md:py-12 relative">
      
      <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8 relative z-10">
        
        {/* ONBOARDING HELPER & GREETING */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
          <p className="text-sm font-bold text-slate-800">👋 Welcome back, Nischal</p>
          <div className="inline-flex items-center rounded-full bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-700 border border-amber-200 shadow-sm">
            💡 Tip: Start with your weakest chapters (marked in red) for best results.
          </div>
        </div>

        {/* PREMIUM BREADCRUMB */}
        <div className="mb-6 flex items-center text-sm font-medium text-slate-500">
          <Link href="/quiz" className="hover:text-blue-600 transition-colors flex items-center">
            <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
            Home
          </Link>
          <svg className="w-4 h-4 mx-2 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
          <span className="text-slate-900 bg-white px-2.5 py-1 rounded-md border border-slate-200 shadow-sm">Chapter-wise Practice</span>
        </div>

        {/* HERO SECTION (NEC Focused) */}
        <div className="mb-10">
          <div className="inline-flex items-center rounded-md bg-blue-100 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-blue-800 mb-4">
            👉 ACiE Syllabus Based
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl mb-3">
            Chapter-wise Practice <span className="text-slate-400 font-light hidden sm:inline">| NEC Civil</span>
          </h1>
          <p className="text-slate-600 max-w-2xl text-base mb-6">
            Master the official Nepal Engineering Council syllabus one topic at a time. Track your readiness and focus on areas that need improvement.
          </p>

          {/* Hero Info Strip */}
          <div className="flex flex-wrap gap-4 md:gap-8 border-y border-slate-200 py-4 bg-white/50 backdrop-blur-sm rounded-xl px-6 shadow-sm">
            <div><p className="text-xs font-bold text-slate-400 uppercase">Total Chapters</p><p className="text-lg font-black text-slate-800">10</p></div>
            <div className="w-px h-10 bg-slate-200 hidden sm:block"></div>
            <div><p className="text-xs font-bold text-slate-400 uppercase">Total Questions</p><p className="text-lg font-black text-slate-800">555+</p></div>
            <div className="w-px h-10 bg-slate-200 hidden sm:block"></div>
            <div><p className="text-xs font-bold text-slate-400 uppercase">Your Attempts</p><p className="text-lg font-black text-blue-600">24</p></div>
          </div>
        </div>
        
        {/* STICKY SEARCH & SORT BAR */}
        <div className="sticky top-4 z-20 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/80 backdrop-blur-md p-3 rounded-2xl border border-slate-200 shadow-sm">
          
          <div className="w-full md:max-w-md relative">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input 
              type="text" 
              placeholder="Search chapters or topics (e.g., Soil)..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border-none bg-slate-100 py-3 pl-11 pr-4 text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <span className="text-sm font-bold text-slate-500 whitespace-nowrap hidden sm:block">Sort by:</span>
            <select 
              value={sortOption} 
              onChange={(e) => setSortOption(e.target.value)}
              className="w-full md:w-auto rounded-xl border border-slate-200 bg-white py-3 pl-4 pr-10 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm appearance-none cursor-pointer"
              style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundPosition: `right 12px center`, backgroundRepeat: `no-repeat`, backgroundSize: `16px` }}
            >
              <option value="default">Default Syllabus Order</option>
              <option value="weakest">Weakest First (Needs Practice)</option>
              <option value="attempted">Most Attempted</option>
            </select>
          </div>
        </div>

        {/* CHAPTERS GRID */}
        {processedChapters.length > 0 ? (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3 mb-16">
            {processedChapters.map((chapter) => (
              <ChapterCard 
                key={chapter.code}
                {...chapter}
              />
            ))}
          </div>
        ) : (
          /* PREMIUM EMPTY STATE */
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white py-20 px-6 text-center shadow-sm mb-16">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-slate-50 mb-6">
              <svg className="h-10 w-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">No chapters found</h3>
            <p className="text-slate-500 max-w-sm mx-auto mb-8">We couldn't find any chapters matching "<span className="font-semibold text-slate-700">{searchQuery}</span>". Try searching with a different keyword or syllabus code.</p>
            <div className="flex justify-center gap-4">
              <button onClick={() => setSearchQuery("")} className="rounded-xl bg-slate-900 px-6 py-3 text-sm font-bold text-white shadow-sm hover:bg-slate-800 transition-colors">
                Clear search
              </button>
            </div>
          </div>
        )}

        {/* MOCK EXAM UPSELL (Engagement Booster) */}
        <div className="rounded-3xl bg-slate-900 p-8 md:p-12 text-center relative overflow-hidden shadow-xl border border-slate-800">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none transform translate-x-1/3 -translate-y-1/3"></div>
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4 relative z-10">Ready to test your full knowledge?</h2>
          <p className="text-slate-400 mb-8 max-w-2xl mx-auto relative z-10">Stop practicing in silos. Take the 100-mark NEC mock exam to see exactly where you stand on the live leaderboard.</p>
          <Link href="/quiz/model-exam" className="inline-flex items-center justify-center rounded-xl bg-emerald-500 px-8 py-4 text-base font-bold text-white shadow-sm transition-all hover:bg-emerald-400 hover:-translate-y-1 relative z-10">
            Start Model Exam
            <svg className="ml-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
          </Link>
        </div>

      </div>
    </div>
  );
}