"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

export default function ModelExamPlayPage() {
  const router = useRouter();
  const examContainerRef = useRef(null); // Reference for fullscreen target

  // --- CORE EXAM STATE ---
  const [sessionId, setSessionId] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [reviewFlags, setReviewFlags] = useState({});
  const [confidenceFlags, setConfidenceFlags] = useState({});
  const [timeLeft, setTimeLeft] = useState(7200); 
  const [status, setStatus] = useState('loading'); // loading, playing, paused, submitting

  // --- MOCK USER TIER (For limits) ---
  const userTier = 'free'; // Change to 'premium' to remove limits

  // --- UI/UX STATE ---
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [paletteFilter, setPaletteFilter] = useState('all');
  const [saveToast, setSaveToast] = useState(false);
  const [limitWarning, setLimitWarning] = useState(false);
  const [jumpToQ, setJumpToQ] = useState("");
  const paletteContainerRef = useRef(null);

  // --- 1. SETUP: FETCH/INITIALIZE EXAM SESSION ---
  useEffect(() => {
    setTimeout(() => {
      const generatedQuestions = Array.from({ length: 80 }, (_, i) => ({
        id: `q${i + 1}`,
        question_number: i + 1,
        marks: i < 60 ? 1 : 2,
        difficulty: i % 4 === 0 ? 'hard' : i % 3 === 0 ? 'easy' : 'medium',
        question: `Sample NEC Exam Question ${i + 1}. This represents a rigorous engineering concept that requires careful calculation or theoretical recall.`,
        option_a: 'First option statement',
        option_b: 'Second option statement',
        option_c: 'Third option statement',
        option_d: 'Fourth option statement',
      }));
      setQuestions(generatedQuestions);

      const mockBackendActiveSession = {
        session_id: "uuid-1234",
        time_remaining_seconds: 5400,
        saved_answers: {} 
      };

      setSessionId(mockBackendActiveSession.session_id);
      setTimeLeft(mockBackendActiveSession.time_remaining_seconds);
      setUserAnswers(mockBackendActiveSession.saved_answers);
      
      const firstUnanswered = generatedQuestions.findIndex(q => !mockBackendActiveSession.saved_answers[q.id]);
      setCurrentIndex(firstUnanswered !== -1 ? firstUnanswered : 0);

      setStatus('playing');
    }, 1200);
  }, []);

  // --- 2. TIMER LOGIC & WARNINGS ---
  useEffect(() => {
    if (status !== 'playing') return; // Pauses naturally when status changes
    
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          executeFinalSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [status]);

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  let timerColor = "bg-white border-slate-200 text-slate-800";
  let timerIconColor = "text-slate-400";
  if (timeLeft <= 300) { timerColor = "bg-red-50 border-red-300 text-red-700 animate-pulse"; timerIconColor = "text-red-500"; }
  else if (timeLeft <= 600) { timerColor = "bg-orange-50 border-orange-200 text-orange-700"; timerIconColor = "text-orange-500"; }
  else if (timeLeft <= 1800) { timerColor = "bg-amber-50 border-amber-200 text-amber-700"; timerIconColor = "text-amber-500"; }

  // --- 3. KEYBOARD SUPPORT ---
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (status !== 'playing' || showSubmitModal) return;
      if (e.target.tagName === 'INPUT') return;

      const currentQ = questions[currentIndex];
      if (!currentQ) return;

      switch(e.key.toLowerCase()) {
        case 'a': handleSelectOption(currentQ.id, 'A'); break;
        case 'b': handleSelectOption(currentQ.id, 'B'); break;
        case 'c': handleSelectOption(currentQ.id, 'C'); break;
        case 'd': handleSelectOption(currentQ.id, 'D'); break;
        case 'arrowleft': handlePrevious(); break;
        case 'arrowright': handleNext(); break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, questions, status, showSubmitModal]);

  // --- 4. SCROLL PALETTE ---
  useEffect(() => {
    const activeBtn = document.getElementById(`palette-btn-${currentIndex}`);
    if (activeBtn) {
      activeBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [currentIndex, paletteFilter, isPaletteOpen]);

  // --- 5. ACTION HANDLERS ---
  const handleSelectOption = (questionId, option) => {
    const newAnswers = { ...userAnswers, [questionId]: option };
    setUserAnswers(newAnswers);
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 1500);
  };

  const handleClearResponse = () => {
    const currentId = questions[currentIndex].id;
    const newAnswers = { ...userAnswers };
    delete newAnswers[currentId];
    setUserAnswers(newAnswers);
  };

  const toggleReviewFlag = () => {
    const currentId = questions[currentIndex].id;
    const isCurrentlyFlagged = reviewFlags[currentId];

    // FREE TIER LIMIT: Max 10 reviews
    if (!isCurrentlyFlagged && userTier === 'free') {
      const currentReviewCount = Object.keys(reviewFlags).filter(k => reviewFlags[k]).length;
      if (currentReviewCount >= 10) {
        setLimitWarning(true);
        setTimeout(() => setLimitWarning(false), 3000);
        return;
      }
    }

    setReviewFlags(prev => ({ ...prev, [currentId]: !isCurrentlyFlagged }));
  };

  const toggleConfidence = () => {
    const currentId = questions[currentIndex].id;
    setConfidenceFlags(prev => ({ ...prev, [currentId]: !prev[currentId] }));
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) setCurrentIndex(prev => prev + 1);
  };

  const handlePrevious = () => {
    if (currentIndex > 0) setCurrentIndex(prev => prev - 1);
  };

  const handleJumpToQ = (e) => {
    e.preventDefault();
    const qNum = parseInt(jumpToQ);
    if (qNum > 0 && qNum <= questions.length) {
      setCurrentIndex(qNum - 1);
      setJumpToQ("");
      setIsPaletteOpen(false);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      // FIX 1: Request fullscreen on our specific container to cover root layouts
      examContainerRef.current?.requestFullscreen().catch(() => {});
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
    }
  };

  const executeFinalSubmit = () => {
    setStatus('submitting');
    setShowSubmitModal(false);
    setTimeout(() => {
      router.push('/quiz/results/mock-test-123');
    }, 1500);
  };

  // --- STATS CALCULATION ---
  const answeredCount = Object.keys(userAnswers).length;
  const reviewCount = Object.keys(reviewFlags).filter(k => reviewFlags[k]).length;
  const notAnsweredCount = questions.length - answeredCount;
  const progressPercent = (answeredCount / questions.length) * 100 || 0;

  const filteredPaletteQs = questions.filter((q) => {
    if (paletteFilter === 'unanswered') return !userAnswers[q.id];
    if (paletteFilter === 'review') return reviewFlags[q.id];
    return true;
  });

  // --- UI: LOADING SKELETON ---
  if (status === 'loading') {
    return (
      <div className="fixed inset-0 z-[100] flex min-h-screen flex-col bg-slate-50">
        <div className="h-14 bg-white border-b border-slate-200 animate-pulse"></div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-emerald-600 mb-4"></div>
            <p className="text-slate-600 font-bold uppercase tracking-widest text-sm">Initializing Secure Exam...</p>
          </div>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  const isAnswered = !!userAnswers[currentQ?.id];

  return (
    // FIX 1: fixed inset-0 z-[100] overlays the entire screen, hiding your Next.js Layout Navbars/Footers
    <div ref={examContainerRef} className="fixed inset-0 z-[100] bg-slate-100 flex flex-col overflow-hidden">
      
      {/* --- FIX 3: PAUSE OVERLAY --- */}
      {status === 'paused' && (
        <div className="absolute inset-0 z-[80] bg-slate-900/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center">
          <svg className="w-16 h-16 text-slate-400 mb-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="text-3xl font-black text-white mb-4">Exam Paused</h2>
          <p className="text-slate-400 max-w-md mb-8">
            Your timer is paused and the questions are hidden to maintain exam integrity.
          </p>
          <button 
            onClick={() => setStatus('playing')} 
            className="bg-emerald-500 hover:bg-emerald-600 text-white px-10 py-4 rounded-xl font-bold shadow-lg transition-transform transform hover:scale-105"
          >
            Resume Exam
          </button>
        </div>
      )}

      {/* 1. TOP PROGRESS BAR */}
      <div className="absolute top-0 left-0 w-full h-1 bg-slate-200 z-50">
        <div className="h-full bg-emerald-500 transition-all duration-300" style={{ width: `${progressPercent}%` }}></div>
      </div>

      {/* 2. EXAM HEADER */}
      <header className="flex-none bg-white border-b border-slate-200 shadow-sm px-4 py-3 flex items-center justify-between z-40 relative mt-1">
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex h-8 w-8 bg-emerald-100 text-emerald-700 rounded items-center justify-center font-black">
            N
          </div>
          <div>
            <h1 className="text-sm font-black text-slate-900 leading-none">NEC Model Exam <span className="hidden sm:inline text-slate-400 font-normal ml-1">| ACiE Civil</span></h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Official Mock Test</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Pause Button */}
          <button onClick={() => setStatus('paused')} className="hidden sm:flex items-center text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors">
            <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            Pause
          </button>

          <button onClick={toggleFullscreen} className="hidden sm:flex items-center text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors">
            <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
            Fullscreen
          </button>
          
          <div className={`flex items-center px-3 py-1.5 rounded-lg border shadow-sm transition-colors ${timerColor}`}>
            <svg className={`w-4 h-4 mr-1.5 ${timerIconColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <span className="font-mono font-black text-sm">{formatTime(timeLeft)}</span>
          </div>
        </div>
      </header>

      {/* 3. MAIN EXAM LAYOUT */}
      <div className="flex-1 max-w-[1400px] w-full mx-auto flex flex-col lg:flex-row gap-6 p-4 md:p-6 overflow-hidden">
        
        {/* === LEFT COLUMN: QUESTION UI === */}
        <div className="flex-1 flex flex-col min-w-0 pb-16 lg:pb-0 h-full">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex-1 flex flex-col relative">
            
            <div className="bg-slate-50 border-b border-slate-200 px-5 py-3 flex items-center justify-between flex-none">
              <div className="flex items-center gap-3">
                <h2 className="text-base font-black text-slate-800">Q. {currentIndex + 1}</h2>
                <div className="h-4 w-px bg-slate-300"></div>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${currentQ.marks === 2 ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200 text-slate-700'}`}>
                  {currentQ.marks} {currentQ.marks > 1 ? 'Marks' : 'Mark'}
                </span>
                <span className={`hidden sm:inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${currentQ.difficulty === 'hard' ? 'bg-rose-50 text-rose-600' : currentQ.difficulty === 'easy' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                  {currentQ.difficulty}
                </span>
              </div>
              
              <div className={`text-xs font-bold text-emerald-600 flex items-center transition-opacity duration-300 ${saveToast ? 'opacity-100' : 'opacity-0'}`}>
                <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg> Saved
              </div>
            </div>

            {reviewFlags[currentQ.id] && (
              <div className="bg-amber-50 border-b border-amber-200 px-5 py-2 flex items-center text-xs font-bold text-amber-800 flex-none">
                <svg className="w-4 h-4 mr-2 text-amber-500" fill="currentColor" viewBox="0 0 20 20"><path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" /></svg>
                You have marked this question for review
              </div>
            )}

            {/* Scrollable Question Content */}
            <div className="p-5 md:p-8 flex-1 overflow-y-auto">
              <h3 className="text-lg md:text-xl font-medium text-slate-900 mb-8 leading-relaxed">
                {currentQ.question}
              </h3>

              <div className="space-y-3 max-w-3xl">
                {['A', 'B', 'C', 'D'].map((opt) => {
                  const optionKey = `option_${opt.toLowerCase()}`;
                  const isSelected = userAnswers[currentQ.id] === opt;
                  return (
                    <button
                      key={opt}
                      onClick={() => handleSelectOption(currentQ.id, opt)}
                      className={`w-full flex items-center p-4 rounded-xl border text-left transition-all duration-200 transform hover:scale-[1.01] active:scale-[0.99] ${
                        isSelected 
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-900 shadow-sm ring-1 ring-emerald-500' 
                          : 'border-slate-300 bg-white hover:bg-slate-50 text-slate-700 hover:border-slate-400'
                      }`}
                    >
                      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg mr-4 font-black text-sm border transition-colors ${
                        isSelected ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-slate-100 border-slate-200 text-slate-500'
                      }`}>
                        {opt}
                      </span>
                      <span className="text-base font-medium leading-relaxed">
                        {currentQ[optionKey]}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="mt-8 flex items-center justify-between border-t border-slate-100 pt-6">
                <button 
                  onClick={handleClearResponse}
                  disabled={!isAnswered}
                  className="text-sm font-bold text-slate-500 hover:text-rose-600 disabled:opacity-30 transition-colors flex items-center"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  Clear Response
                </button>

                <button 
                  onClick={toggleConfidence}
                  className={`text-sm font-bold px-3 py-1.5 rounded-lg border transition-colors ${confidenceFlags[currentQ.id] ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                >
                  {confidenceFlags[currentQ.id] ? 'Confident ✓' : 'Not Sure ?'}
                </button>
              </div>
            </div>

            {/* Desktop Navigation Footer */}
            <div className="hidden lg:flex bg-slate-50 border-t border-slate-200 p-4 items-center justify-between flex-none relative">
              
              {/* FIX 2: Limit Warning Toast */}
              {limitWarning && (
                <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-slate-900 text-white text-xs font-bold px-4 py-2 rounded-lg shadow-lg">
                  Free users can mark up to 10 questions.
                </div>
              )}

              <button onClick={handlePrevious} disabled={currentIndex === 0} className="px-6 py-2.5 rounded-xl font-bold text-slate-600 border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 transition-colors">
                ← Previous
              </button>
              
              <div className="flex gap-3">
                <button onClick={toggleReviewFlag} className={`px-6 py-2.5 rounded-xl font-bold border transition-colors ${reviewFlags[currentQ.id] ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'}`}>
                  Mark for Review
                </button>
                <button onClick={handleNext} disabled={currentIndex === questions.length - 1} className="bg-slate-900 text-white px-8 py-2.5 rounded-xl font-bold shadow-sm hover:bg-slate-800 disabled:opacity-50 transition-colors">
                  Save & Next →
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* === RIGHT COLUMN: INTELLIGENT PALETTE (Desktop) === */}
        <div className="hidden lg:flex w-80 flex-col gap-4 shrink-0 h-full overflow-hidden">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 flex-none">
            <h3 className="text-sm font-black text-slate-800 mb-4 border-b border-slate-100 pb-3">Exam Status</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                <p className="text-2xl font-black text-emerald-600">{answeredCount}</p>
                <p className="text-[10px] font-bold uppercase text-emerald-800">Answered</p>
              </div>
              <div className="text-center p-3 bg-slate-50 rounded-xl border border-slate-200">
                <p className="text-2xl font-black text-slate-600">{notAnsweredCount}</p>
                <p className="text-[10px] font-bold uppercase text-slate-500">Remaining</p>
              </div>
              <div className="text-center p-3 bg-amber-50 rounded-xl border border-amber-100 col-span-2">
                <p className="text-xl font-black text-amber-600">{reviewCount}</p>
                <p className="text-[10px] font-bold uppercase text-amber-800">Marked for Review</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 flex-1 flex flex-col min-h-0">
            <div className="flex bg-slate-100 p-1 rounded-lg mb-4 flex-none">
              {['all', 'unanswered', 'review'].map(filter => (
                <button 
                  key={filter} 
                  onClick={() => setPaletteFilter(filter)} 
                  className={`flex-1 text-[10px] font-bold uppercase tracking-wider py-1.5 rounded-md transition-all ${paletteFilter === filter ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  {filter}
                </button>
              ))}
            </div>

            <div ref={paletteContainerRef} className="grid grid-cols-5 gap-2 overflow-y-auto pr-2 custom-scrollbar flex-1 pb-4">
              {filteredPaletteQs.map((q) => {
                const globalIndex = questions.findIndex(x => x.id === q.id);
                const isAns = !!userAnswers[q.id];
                const isRev = !!reviewFlags[q.id];
                const isCur = currentIndex === globalIndex;

                let btnClass = "border-slate-200 bg-white text-slate-600 hover:bg-slate-50";
                if (isAns) btnClass = "border-emerald-500 bg-emerald-500 text-white shadow-sm";
                if (isRev && !isAns) btnClass = "border-amber-400 bg-amber-400 text-white";
                if (isRev && isAns) btnClass = "border-emerald-500 bg-emerald-500 text-white relative overflow-hidden";
                const ringClass = isCur ? "ring-2 ring-slate-900 ring-offset-1" : "";

                return (
                  <button
                    key={q.id}
                    id={`palette-btn-${globalIndex}`}
                    onClick={() => setCurrentIndex(globalIndex)}
                    className={`h-9 w-full rounded border text-xs font-bold transition-all ${btnClass} ${ringClass}`}
                  >
                    {isRev && isAns && <div className="absolute top-0 right-0 w-0 h-0 border-t-[10px] border-l-[10px] border-t-amber-400 border-l-transparent"></div>}
                    {globalIndex + 1}
                  </button>
                );
              })}
            </div>

            <form onSubmit={handleJumpToQ} className="mt-4 pt-4 border-t border-slate-100 flex gap-2 flex-none">
              <input 
                type="number" min="1" max="80" placeholder="Go to Q..." 
                value={jumpToQ} onChange={e => setJumpToQ(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold focus:outline-none focus:border-blue-500 focus:bg-white"
              />
              <button type="submit" className="bg-slate-900 text-white px-3 rounded-lg font-bold text-xs hover:bg-slate-800">Go</button>
            </form>
          </div>

          <button onClick={() => setShowSubmitModal(true)} className="w-full bg-emerald-600 text-white py-4 rounded-xl font-black shadow-sm hover:bg-emerald-700 transition-colors uppercase tracking-widest text-sm flex-none">
            Submit Exam
          </button>
        </div>

      </div>

      {/* MOBILE UX BOTTOM BAR */}
      <div className="lg:hidden absolute bottom-0 left-0 w-full bg-white border-t border-slate-200 p-3 pb-safe flex gap-2 z-40 shadow-[0_-10px_40px_rgba(0,0,0,0.08)]">
        <button onClick={handlePrevious} disabled={currentIndex === 0} className="flex-1 py-3 rounded-xl border border-slate-300 bg-white font-bold text-slate-700 text-sm hover:bg-slate-50 disabled:opacity-40">
          Prev
        </button>
        <button onClick={() => setIsPaletteOpen(true)} className="flex-none w-16 flex flex-col items-center justify-center py-2 rounded-xl bg-slate-100 text-slate-700 relative">
          
          {limitWarning && (
             <div className="absolute -top-10 bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded whitespace-nowrap">Limit reached</div>
          )}

          <svg className="w-5 h-5 mb-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
          <span className="text-[9px] font-black">{currentIndex + 1}/80</span>
        </button>
        <button onClick={handleNext} disabled={currentIndex === questions.length - 1} className="flex-1 py-3 rounded-xl bg-slate-900 font-bold text-white text-sm shadow-sm hover:bg-slate-800 disabled:opacity-50">
          Next
        </button>
      </div>

      {/* MOBILE PALETTE */}
      {isPaletteOpen && (
        <div className="lg:hidden absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex flex-col justify-end">
          <div className="bg-white rounded-t-3xl p-5 max-h-[85vh] flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-black text-slate-900 text-lg">Question Palette</h3>
              <button onClick={() => setIsPaletteOpen(false)} className="bg-slate-100 p-2 rounded-full text-slate-600 hover:bg-slate-200">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="flex justify-between mb-4 text-xs font-bold text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-100">
              <span className="text-emerald-600">{answeredCount} Ans</span>
              <span>{notAnsweredCount} Rem</span>
              <span className="text-amber-600">{reviewCount} Rev</span>
            </div>
            
            <div className="grid grid-cols-6 gap-2 overflow-y-auto pb-6">
              {questions.map((q, idx) => {
                const isAns = !!userAnswers[q.id];
                const isRev = !!reviewFlags[q.id];
                const isCur = currentIndex === idx;

                let btnClass = "border-slate-200 bg-white text-slate-600";
                if (isAns) btnClass = "border-emerald-500 bg-emerald-500 text-white";
                if (isRev && !isAns) btnClass = "border-amber-400 bg-amber-400 text-white";
                if (isRev && isAns) btnClass = "border-emerald-500 bg-emerald-500 text-white relative overflow-hidden";
                const ringClass = isCur ? "ring-2 ring-slate-900 ring-offset-1" : "";

                return (
                  <button key={q.id} onClick={() => { setCurrentIndex(idx); setIsPaletteOpen(false); }} className={`h-10 w-full rounded border text-sm font-bold ${btnClass} ${ringClass}`}>
                    {isRev && isAns && <div className="absolute top-0 right-0 w-0 h-0 border-t-[10px] border-l-[10px] border-t-amber-400 border-l-transparent"></div>}
                    {idx + 1}
                  </button>
                );
              })}
            </div>
            
            <div className="flex gap-2 mt-2">
               <button onClick={toggleReviewFlag} className="flex-1 bg-amber-100 text-amber-800 py-4 rounded-xl font-bold shadow-sm">
                 Mark Review
               </button>
               <button onClick={() => { setIsPaletteOpen(false); setShowSubmitModal(true); }} className="flex-[2] bg-emerald-600 text-white py-4 rounded-xl font-black shadow-sm">
                 SUBMIT EXAM
               </button>
            </div>
          </div>
        </div>
      )}

      {/* SUBMIT CONFIRMATION MODAL */}
      {showSubmitModal && (
        <div className="absolute inset-0 z-[60] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl animate-in zoom-in-95">
            <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <h2 className="text-2xl font-black text-center text-slate-900 mb-2">Submit Exam?</h2>
            <p className="text-sm text-center text-slate-500 mb-6">Are you sure you want to finish? You cannot undo this action.</p>
            
            <div className="bg-slate-50 rounded-xl p-4 mb-6 border border-slate-100">
              <div className="flex justify-between text-sm font-bold mb-2"><span className="text-slate-500">Answered:</span><span className="text-emerald-600">{answeredCount}</span></div>
              <div className="flex justify-between text-sm font-bold mb-2"><span className="text-slate-500">Marked for Review:</span><span className="text-amber-600">{reviewCount}</span></div>
              <div className="flex justify-between text-sm font-bold"><span className="text-slate-500">Unanswered:</span><span className="text-rose-600">{notAnsweredCount}</span></div>
            </div>

            <div className="flex flex-col gap-3">
              <button onClick={executeFinalSubmit} disabled={status === 'submitting'} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3.5 rounded-xl font-bold shadow-sm transition-colors">
                {status === 'submitting' ? 'Submitting securely...' : 'Yes, Submit Exam'}
              </button>
              <button onClick={() => setShowSubmitModal(false)} disabled={status === 'submitting'} className="w-full bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 py-3.5 rounded-xl font-bold transition-colors">
                Cancel, Return to Exam
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}