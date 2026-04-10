"use client";

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

// --- REUSABLE COMPONENT: DifficultyCard ---
const DifficultyCard = ({ level, description, questionCount, href, theme }) => {
  // Theme dictionaries for easy, medium, hard colors
  const themes = {
    easy: {
      border: "border-emerald-200 hover:border-emerald-500",
      bg: "bg-emerald-50",
      text: "text-emerald-700",
      button: "bg-emerald-600 hover:bg-emerald-700 text-white"
    },
    medium: {
      border: "border-amber-200 hover:border-amber-500",
      bg: "bg-amber-50",
      text: "text-amber-700",
      button: "bg-amber-600 hover:bg-amber-700 text-white"
    },
    hard: {
      border: "border-red-200 hover:border-red-500",
      bg: "bg-red-50",
      text: "text-red-700",
      button: "bg-red-600 hover:bg-red-700 text-white"
    }
  };

  const activeTheme = themes[theme];

  return (
    <div className={`flex flex-col justify-between rounded-2xl border bg-white p-8 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md ${activeTheme.border}`}>
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-2xl font-bold text-slate-900 capitalize">{level} Mode</h3>
          <span className={`inline-flex items-center rounded-lg px-3 py-1 text-sm font-bold ${activeTheme.bg} ${activeTheme.text}`}>
            {questionCount} Questions
          </span>
        </div>
        <p className="mb-8 text-slate-600 leading-relaxed">
          {description}
        </p>
      </div>
      
      <Link 
        href={href} 
        className={`inline-flex w-full items-center justify-center rounded-xl px-4 py-3.5 text-base font-semibold shadow-sm transition-colors ${activeTheme.button}`}
      >
        Start {level} Quiz
      </Link>
    </div>
  );
};

export default function ChapterDetailPage() {
  // Grab the dynamic chapter code from the URL (e.g., ACiE0101)
  const params = useParams();
  const chapterCode = params.code;

  // DUMMY DATA: Simulating a fetch for this specific chapter
  const chapter = {
    code: chapterCode,
    title: chapterCode === "ACiE0101" ? "Engineering Materials" : "Surveying and Levelling", 
    description: "This chapter covers the fundamental properties, types, and characteristics of construction materials. You will be tested on standard sizes, chemical compositions, and IS/NS testing standards.",
    topics: [
      "Properties of stones, bricks, and tiles",
      "Cement types and testing standards",
      "Timber characteristics and defects",
      "Paints, varnishes, and bitumens"
    ],
    stats: { total: 120, easy: 40, medium: 50, hard: 30 }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="mx-auto max-w-5xl px-4 md:px-6 lg:px-8">
        
        {/* BREADCRUMB */}
        <div className="mb-8 text-sm text-slate-500 flex items-center flex-wrap gap-2">
          <Link href="/quiz" className="hover:text-blue-600 transition-colors">Quiz Home</Link>
          <span>/</span>
          <Link href="/quiz/chapter-wise" className="hover:text-blue-600 transition-colors">Chapter-wise Practice</Link>
          <span>/</span>
          <span className="text-slate-900 font-medium bg-slate-200 px-2 py-0.5 rounded">{chapter.code}</span>
        </div>

        {/* CHAPTER OVERVIEW CARD */}
        <div className="mb-10 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm md:p-10">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-8">
            
            {/* Left side: Info */}
            <div className="flex-1">
              <div className="mb-4 inline-flex items-center rounded-lg bg-blue-50 px-3 py-1 text-sm font-bold tracking-wide text-blue-700">
                Chapter {chapter.code}
              </div>
              <h1 className="mb-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                {chapter.title}
              </h1>
              <p className="text-base text-slate-600 mb-6 leading-relaxed max-w-2xl">
                {chapter.description}
              </p>
              
              <div>
                <h4 className="font-semibold text-slate-900 mb-3">Key Topics Covered:</h4>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {chapter.topics.map((topic, index) => (
                    <li key={index} className="flex items-start text-sm text-slate-600">
                      <svg className="mr-2 mt-0.5 h-4 w-4 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      {topic}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Right side: Stats Box */}
            <div className="shrink-0 w-full md:w-48 rounded-xl bg-slate-50 p-5 border border-slate-100">
              <div className="text-center mb-4">
                <span className="block text-3xl font-black text-slate-800">{chapter.stats.total}</span>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Questions</span>
              </div>
              <div className="space-y-2 border-t border-slate-200 pt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Easy</span>
                  <span className="font-semibold text-emerald-600">{chapter.stats.easy}</span>
               </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Medium</span>
                  <span className="font-semibold text-amber-600">{chapter.stats.medium}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Hard</span>
                  <span className="font-semibold text-red-600">{chapter.stats.hard}</span>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* DIFFICULTY SELECTION */}
        <h2 className="text-2xl font-bold text-slate-900 mb-6">Select Difficulty Level</h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          
          <DifficultyCard 
            level="Easy"
            theme="easy"
            questionCount={10}
            description="Perfect for warming up. Tests your knowledge of direct definitions, basic formulas, and factual recall."
            href={`/quiz/chapter-wise/${chapter.code}/play?difficulty=easy`}
          />
          
          <DifficultyCard 
            level="Medium"
            theme="medium"
            questionCount={10}
            description="The standard level. Tests conceptual understanding and requires single-step calculations or formula application."
            href={`/quiz/chapter-wise/${chapter.code}/play?difficulty=medium`}
          />
          
          <DifficultyCard 
            level="Hard"
            theme="hard"
            questionCount={10}
            description="Challenge yourself. Involves multi-step numericals, complex scenarios, and edge-case IS/NS code specifications."
            href={`/quiz/chapter-wise/${chapter.code}/play?difficulty=hard`}
          />

        </div>

      </div>
    </div>
  );
}