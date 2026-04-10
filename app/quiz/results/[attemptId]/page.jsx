"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function ResultsPage() {
  const params = useParams();
  const attemptId = params.attemptId;

  // --- STATE ---
  const [showWrongOnly, setShowWrongOnly] = useState(false);
  const [expandedExplanations, setExpandedExplanations] = useState({});
  const [animateRing, setAnimateRing] = useState(false);

  useEffect(() => {
    // Trigger progress ring animation after mount
    const timer = setTimeout(() => setAnimateRing(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // --- SIMULATED BACKEND DATA ---
  // Change `mode` to "Chapter Practice" or "Rapid Fire" to see the UI adapt!
  const resultData = {
    mode: "NEC Model Exam", // Supports: "NEC Model Exam", "Rapid Fire", "Chapter Practice"
    chapterCode: "Full Syllabus", 
    score: 68,
    total: 100,
    timeTaken: "1h 45m 12s",
    speedStatus: "Paced perfectly ⏱️",
    readiness: 82,
    rankStatus: "Top 15% among users this week",
    weakAreas: ["Structural Analysis", "Hydraulics"],
    strongAreas: ["Surveying", "Construction Management"],
    difficultyStats: { easy: { score: 35, total: 40 }, medium: { score: 20, total: 30 }, hard: { score: 13, total: 30 } },
    questions: [
      {
        id: 'q1', difficulty: 'easy',
        question: `What is the standard size of a modular brick according to IS codes?`,
        option_a: '190 x 90 x 90 mm', option_b: '200 x 100 x 100 mm', option_c: '230 x 115 x 75 mm', option_d: '225 x 110 x 70 mm',
        correct_option: 'A', user_answer: 'A',
        is_marked_for_review: false,
        explanation: 'The nominal size of a modular brick is 200x100x100 mm, but the actual standard size (without mortar thickness) is 190x90x90 mm.'
      },
      {
        id: 'q2', difficulty: 'hard',
        question: `Which type of cement is recommended for underwater construction?`,
        option_a: 'Ordinary Portland Cement', option_b: 'Quick Setting Cement', option_c: 'Sulphate Resisting Cement', option_d: 'Low Heat Cement',
        correct_option: 'B', user_answer: 'C', 
        is_marked_for_review: true,
        explanation: 'Quick setting cement is used for underwater construction as it sets very quickly (initial setting time is 5 minutes) preventing the cement from washing away.'
      },
      {
        id: 'q3', difficulty: 'medium',
        question: `The initial setting time of Ordinary Portland Cement (OPC) should not be less than:`,
        option_a: '15 minutes', option_b: '30 minutes', option_c: '60 minutes', option_d: '600 minutes',
        correct_option: 'B', user_answer: 'B',
        is_marked_for_review: true,
        explanation: 'According to IS standards, the initial setting time of OPC should not be less than 30 minutes to allow sufficient time for mixing, transporting, and placing.'
      }
    ]
  };

  // --- MODE DETECTION ---
  const isMockTest = resultData.mode.toLowerCase().includes("mock") || resultData.mode.toLowerCase().includes("model exam");
  const isRapidFire = resultData.mode.toLowerCase().includes("rapid");
  const isChapter = resultData.mode.toLowerCase().includes("chapter");

  const percentage = Math.round((resultData.score / resultData.total) * 100);
  
  // --- DYNAMIC SCORING LOGIC ---
  let statusText = "Needs Improvement";
  let statusColor = "bg-rose-100 text-rose-700 border-rose-200";
  let ringColor = "stroke-rose-500";
  let expLevel = "Weak 🔴";
  let hint = "Focus on fundamental definitions and formulas.";

  if (isMockTest) {
    // Official NEC Logic: 50 Marks to Pass
    if (resultData.score >= 50) {
      statusText = "Passed — Exam Ready!";
      statusColor = "bg-emerald-100 text-emerald-800 border-emerald-200";
      ringColor = "stroke-emerald-500";
      expLevel = "Ready 🟢";
      hint = "You cleared the 50-mark threshold. Keep practicing to secure a wider margin.";
    } else {
      statusText = "Failed — Needs More Prep";
      statusColor = "bg-rose-100 text-rose-800 border-rose-200";
      ringColor = "stroke-rose-500";
      expLevel = "Not Ready 🔴";
      hint = "You need 50 marks to pass. Review your weakest chapters extensively.";
    }
  } else {
    // Standard Accuracy Logic for Rapid Fire & Chapter Practice
    if (percentage >= 80) {
      statusText = "Excellent Accuracy!";
      statusColor = "bg-emerald-100 text-emerald-800 border-emerald-200";
      ringColor = "stroke-emerald-500";
      expLevel = "Strong 🟢";
      hint = "Maintain this accuracy while improving your speed.";
    } else if (percentage >= 60) {
      statusText = "Good — Improve weak areas";
      statusColor = "bg-blue-100 text-blue-800 border-blue-200";
      ringColor = "stroke-blue-500";
      expLevel = "Moderate 🟡";
      hint = "Focus on hard-level questions to push your score higher.";
    }
  }

  // --- DYNAMIC NEXT STEPS ---
  let nextStep = {
    title: "Keep Practicing", desc: "Continue your studies.", btn: "Go to Dashboard", link: "/quiz"
  };

  if (isMockTest) {
    nextStep = {
      title: "Review Weak Chapters", 
      desc: `Your score dipped heavily in ${resultData.weakAreas[0] || 'certain areas'}. Take a Chapter-wise quiz for that specific section.`, 
      btn: "Practice Chapters →", 
      link: "/quiz/chapter-wise"
    };
  } else if (isRapidFire) {
    nextStep = {
      title: "Beat Your Record", 
      desc: "Rapid Fire is about building reflexes. Play another round to improve your speed and accuracy.", 
      btn: "Play Another Round ⚡", 
      link: "/quiz/rapid-fire"
    };
  } else if (isChapter) {
    nextStep = {
      title: "Level Up Difficulty", 
      desc: "Mastered the basics? Challenge yourself with complex numericals to push your readiness to 100%.", 
      btn: "Retry Hard Level 🔥", 
      link: `/quiz/chapter-wise/${resultData.chapterCode}?difficulty=hard`
    };
  }

  // Ring Math
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const offset = animateRing ? circumference - (percentage / 100) * circumference : circumference;

  const toggleExplanation = (id) => {
    setExpandedExplanations(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // --- FILTERING LOGIC (Mode Accurate) ---
  let filteredQuestions = resultData.questions;

  // 1. Mock Exam: ONLY show explicitly flagged questions by default
  if (isMockTest) {
    filteredQuestions = filteredQuestions.filter(q => q.is_marked_for_review);
  }

  // 2. Apply "Wrong Only" toggle if active
  if (showWrongOnly) {
    filteredQuestions = filteredQuestions.filter(q => q.user_answer !== q.correct_option);
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-32 pt-6 md:py-12 px-4 relative">
      <div className="mx-auto max-w-4xl">
        
        {/* ==========================================
            A. SCORE SECTION (HERO CARD)
            ========================================== */}
        <div className="mb-8 rounded-3xl bg-white p-6 md:p-12 shadow-sm border border-slate-200 text-center relative overflow-hidden">
          <div className={`absolute top-0 left-0 w-full h-2 ${
            isMockTest 
              ? (resultData.score >= 50 ? 'bg-gradient-to-r from-emerald-400 to-emerald-600' : 'bg-gradient-to-r from-rose-400 to-rose-600')
              : (percentage >= 80 ? 'bg-gradient-to-r from-emerald-400 to-emerald-600' : percentage >= 60 ? 'bg-gradient-to-r from-blue-400 to-blue-600' : 'bg-gradient-to-r from-rose-400 to-rose-600')
          }`}></div>

          <div className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-400">
            {resultData.mode} • {resultData.chapterCode}
          </div>
          <h1 className="mb-8 text-2xl md:text-3xl font-extrabold text-slate-900">
            {isMockTest ? 'Exam Completed' : 'Quiz Completed'}
          </h1>

          {/* Animated Score Ring */}
          <div className="mx-auto mb-4 relative flex h-40 w-40 items-center justify-center">
            <svg className="h-full w-full -rotate-90 transform drop-shadow-sm" viewBox="0 0 140 140">
              <circle cx="70" cy="70" r={radius} className="fill-none stroke-slate-100" strokeWidth="12" />
              <circle cx="70" cy="70" r={radius} className={`fill-none ${ringColor} transition-all duration-1500 ease-out`} strokeWidth="12" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset} />
            </svg>
            <div className="absolute flex flex-col items-center justify-center mt-1">
              {isMockTest ? (
                <>
                  <span className="text-4xl font-black text-slate-900">{resultData.score}</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">/ {resultData.total} Marks</span>
                </>
              ) : (
                <>
                  <span className="text-4xl font-black text-slate-900">{percentage}%</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Accuracy</span>
                </>
              )}
            </div>
          </div>

          {/* Status & Expertise */}
          <div className={`mx-auto mb-4 inline-flex items-center rounded-full px-5 py-2 text-sm font-bold border ${statusColor}`}>
            {statusText}
          </div>
          
          <div className="mb-1 text-slate-800 font-bold">
            Expertise Level: <span className="text-slate-900">{expLevel}</span>
          </div>
          <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-6">
            {resultData.rankStatus}
          </p>
          
          <div className="max-w-md mx-auto bg-slate-50 border border-slate-100 rounded-xl p-4 text-xs text-slate-500 mb-6">
            <strong className="text-slate-700 block mb-1">💡 Improvement Hint:</strong> {hint}
          </div>

          <button className="text-sm font-bold text-blue-600 hover:text-blue-700 flex items-center justify-center mx-auto">
            <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
            Share Score
          </button>
        </div>

        {/* ==========================================
            B. STATS SECTION
            ========================================== */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="rounded-2xl bg-emerald-50 border border-emerald-100 p-5 text-center shadow-sm">
            <p className="text-3xl font-black text-emerald-600">{resultData.score}</p>
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-800 mt-1">{isMockTest ? 'Marks' : 'Correct'}</p>
          </div>
          <div className="rounded-2xl bg-rose-50 border border-rose-100 p-5 text-center shadow-sm">
            <p className="text-3xl font-black text-rose-600">{resultData.total - resultData.score}</p>
            <p className="text-xs font-bold uppercase tracking-wider text-rose-800 mt-1">{isMockTest ? 'Lost' : 'Wrong'}</p>
          </div>
          <div className="rounded-2xl bg-slate-50 border border-slate-200 p-5 text-center shadow-sm col-span-2 md:col-span-1">
            <p className="text-xl font-black text-slate-700 mt-1.5">{resultData.timeTaken}</p>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mt-1.5">Time</p>
            <p className={`text-[10px] font-semibold mt-1 ${isRapidFire ? 'text-amber-600' : 'text-emerald-600'}`}>{resultData.speedStatus}</p>
          </div>
          <div className="rounded-2xl bg-blue-50 border border-blue-100 p-5 shadow-sm col-span-2 md:col-span-1 flex flex-col justify-center">
            <p className="text-xs font-bold uppercase tracking-wider text-blue-800 mb-2">Difficulty Breakdown</p>
            <div className="space-y-1.5 text-xs font-bold">
              <div className="flex justify-between text-emerald-700"><span>Easy</span><span>{resultData.difficultyStats.easy.score}/{resultData.difficultyStats.easy.total}</span></div>
              <div className="flex justify-between text-amber-700"><span>Medium</span><span>{resultData.difficultyStats.medium.score}/{resultData.difficultyStats.medium.total}</span></div>
              <div className="flex justify-between text-rose-700"><span>Hard</span><span>{resultData.difficultyStats.hard.score}/{resultData.difficultyStats.hard.total}</span></div>
            </div>
          </div>
        </div>

        {/* ==========================================
            C. INTELLIGENCE LAYER (Strong/Weak Areas)
            ========================================== */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center">
              <svg className="w-4 h-4 text-emerald-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              Strong Areas
            </h3>
            <ul className="space-y-2 text-sm font-medium text-slate-600">
              {resultData.strongAreas.map((area, i) => <li key={i} className="flex items-start"><span className="text-emerald-500 mr-2">✓</span>{area}</li>)}
            </ul>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center">
              <svg className="w-4 h-4 text-rose-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              Weak Areas (Review Needed)
            </h3>
            <ul className="space-y-2 text-sm font-medium text-slate-600">
              {resultData.weakAreas.map((area, i) => <li key={i} className="flex items-start"><span className="text-rose-500 mr-2">✗</span>{area}</li>)}
            </ul>
          </div>
        </div>

        {/* ==========================================
            D. DYNAMIC NEXT STEP FLOW
            ========================================== */}
        <div className={`mb-10 rounded-2xl p-6 md:p-8 text-white shadow-lg flex flex-col md:flex-row items-center justify-between gap-6 ${isRapidFire ? 'bg-amber-600' : 'bg-slate-900'}`}>
          <div>
            <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${isRapidFire ? 'text-amber-100' : 'text-blue-400'}`}>Recommended Next Step</p>
            <h3 className="text-xl font-bold mb-2">{nextStep.title}</h3>
            <p className={`text-sm max-w-md ${isRapidFire ? 'text-amber-50' : 'text-slate-400'}`}>{nextStep.desc}</p>
          </div>
          <Link href={nextStep.link} className={`w-full md:w-auto text-center px-6 py-4 rounded-xl font-bold shadow-sm transition-colors whitespace-nowrap ${isRapidFire ? 'bg-white text-amber-700 hover:bg-amber-50' : 'bg-blue-600 hover:bg-blue-500 text-white'}`}>
            {nextStep.btn}
          </Link>
        </div>

        {/* ==========================================
            E. REVIEW SECTION (MODE ACCURATE FILTERING)
            ========================================== */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-1">Detailed Review</h2>
            {isMockTest && (
              <p className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded border border-amber-100 inline-block">
                Showing ONLY questions you Marked for Review during the Mock Exam.
              </p>
            )}
          </div>
          
          {/* Toggle: Show Wrong Only */}
          <div className="inline-flex bg-slate-200 p-1 rounded-lg">
            <button 
              onClick={() => setShowWrongOnly(false)} 
              className={`px-4 py-2 text-xs font-bold rounded-md transition-all ${!showWrongOnly ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              All ({isMockTest ? resultData.questions.filter(q => q.is_marked_for_review).length : resultData.total})
            </button>
            <button 
              onClick={() => setShowWrongOnly(true)} 
              className={`px-4 py-2 text-xs font-bold rounded-md transition-all ${showWrongOnly ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Wrong Only
            </button>
          </div>
        </div>

        <div className="space-y-6 mb-12">
          {filteredQuestions.map((q, index) => {
            const isCorrect = q.user_answer === q.correct_option;
            const skipped = !q.user_answer;
            const isExpanded = expandedExplanations[q.id];

            const diffColors = {
              easy: "bg-emerald-100 text-emerald-700",
              medium: "bg-amber-100 text-amber-700",
              hard: "bg-rose-100 text-rose-700"
            };

            return (
              <div key={q.id} className={`rounded-2xl border bg-white shadow-sm transition-all overflow-hidden ${isCorrect ? 'border-emerald-200' : 'border-rose-200'}`}>
                
                {/* Header */}
                <div className={`px-5 py-3 border-b flex justify-between items-center ${isCorrect ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'}`}>
                  <div className="flex items-center gap-3">
                    <span className={`font-bold ${isCorrect ? 'text-emerald-800' : 'text-rose-800'}`}>
                      Q. {isMockTest ? `(Reviewed)` : index + 1}
                    </span>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${diffColors[q.difficulty]}`}>
                      {q.difficulty}
                    </span>
                  </div>
                  {isCorrect ? (
                    <span className="flex items-center text-sm font-bold text-emerald-600">✓ Correct</span>
                  ) : (
                    <span className="flex items-center text-sm font-bold text-rose-600">✗ Incorrect</span>
                  )}
                </div>

                {/* Body */}
                <div className="p-5 md:p-6">
                  <p className="mb-6 text-base font-semibold text-slate-900 leading-relaxed">{q.question}</p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    {/* User's Choice */}
                    <div className={`rounded-xl p-4 border ${isCorrect ? 'bg-emerald-50 border-emerald-300 ring-1 ring-emerald-500 text-emerald-900' : 'bg-rose-50 border-rose-200 text-rose-900'}`}>
                      <p className="text-[10px] font-bold uppercase tracking-wider mb-1 opacity-60">Your Answer</p>
                      <p className="font-semibold text-sm flex items-start">
                        {isCorrect && <span className="text-emerald-600 mr-2 font-black">✓</span>}
                        {skipped ? "Skipped" : `${q.user_answer}. ${q[`option_${q.user_answer.toLowerCase()}`]}`}
                      </p>
                    </div>

                    {/* Correct Answer (if wrong) */}
                    {!isCorrect && (
                      <div className="rounded-xl p-4 border border-emerald-300 bg-emerald-50 text-emerald-900 ring-1 ring-emerald-500 relative">
                        <div className="absolute -top-2.5 right-3 bg-emerald-500 text-white text-[10px] font-bold uppercase px-2 py-0.5 rounded shadow-sm">Correct Answer</div>
                        <p className="text-[10px] font-bold uppercase tracking-wider mb-1 opacity-60">Correct Option</p>
                        <p className="font-semibold text-sm flex items-start">
                          <span className="text-emerald-600 mr-2 font-black">✓</span>
                          {q.correct_option}. {q[`option_${q.correct_option.toLowerCase()}`]}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Collapsible Explanation */}
                  <div className="mt-2">
                    <button onClick={() => toggleExplanation(q.id)} className="text-sm font-bold text-blue-600 hover:text-blue-800 flex items-center transition-colors">
                      {isExpanded ? 'Hide Explanation' : 'View Explanation'}
                      <svg className={`w-4 h-4 ml-1 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                    </button>
                    
                    {isExpanded && (
                      <div className="mt-3 rounded-xl bg-slate-50 p-4 border border-slate-200 text-sm text-slate-700 leading-relaxed animate-in fade-in slide-in-from-top-2">
                        <strong className="text-slate-900 block mb-1">Concept:</strong>
                        {q.explanation}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          
          {filteredQuestions.length === 0 && (
            <div className="text-center py-10 bg-white rounded-2xl border border-slate-200 shadow-sm">
              <div className="text-4xl mb-3">🎯</div>
              <p className="text-slate-900 font-bold mb-1">Nothing to show here!</p>
              <p className="text-slate-500 text-sm">
                {isMockTest 
                  ? "You didn't mark any questions for review during this Mock Exam." 
                  : "Perfect! You have no wrong answers to review."}
              </p>
            </div>
          )}
        </div>

        {/* Engagement / Leaderboard CTA */}
        <div className="text-center pb-10">
          <p className="text-sm font-medium text-slate-500 mb-3">Want to see how you stack up against others?</p>
          <Link href="/quiz" className="inline-flex items-center text-sm font-bold text-blue-600 hover:text-blue-800">
            See Weekly Top Performers 
            <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
          </Link>
        </div>

      </div>

      {/* ==========================================
          D. MOBILE STICKY ACTION BAR
          ========================================== */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 pb-safe flex gap-3 z-50 md:hidden shadow-[0_-10px_40px_rgba(0,0,0,0.08)]">
        <Link href="/quiz" className="flex-1 py-4 text-center rounded-xl border border-slate-300 bg-white text-sm font-bold text-slate-700 hover:bg-slate-50">
          Dashboard
        </Link>
        <Link href={nextStep.link} className={`flex-1 py-4 text-center rounded-xl text-sm font-bold text-white shadow-sm ${isRapidFire ? 'bg-amber-600' : 'bg-slate-900'}`}>
          {nextStep.btn.replace(' →', '').replace(' ⚡', '').replace(' 🔥', '')}
        </Link>
      </div>

    </div>
  );
}