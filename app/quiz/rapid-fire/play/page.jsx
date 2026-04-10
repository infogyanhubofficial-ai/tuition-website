"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

export default function RapidFirePlayPage() {
  const router = useRouter();

  // State Management
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [reviewedQuestions, setReviewedQuestions] = useState({});
  const [visitedQuestions, setVisitedQuestions] = useState({});
  const [confidenceLevels, setConfidenceLevels] = useState({});
  const [status, setStatus] = useState('loading'); // 'loading', 'playing', 'submitting'
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [touchStart, setTouchStart] = useState(null);

  // Fetch Mixed Questions (Simulated)
  useEffect(() => {
    setTimeout(() => {
      const dummyQuestions = [
        {
          id: 'rf1',
          chapter_code: 'ACiE0101',
          difficulty: 'easy',
          question: `What is the standard size of a modular brick according to IS codes?`,
          option_a: '190 x 90 x 90 mm',
          option_b: '200 x 100 x 100 mm',
          option_c: '230 x 115 x 75 mm',
          option_d: '225 x 110 x 70 mm',
        },
        {
          id: 'rf2',
          chapter_code: 'ACiE0105',
          difficulty: 'medium',
          question: `If the fore bearing of a line is 45°, its back bearing will be:`,
          option_a: '135°',
          option_b: '225°',
          option_c: '315°',
          option_d: '45°',
        },
        {
          id: 'rf3',
          chapter_code: 'ACiE0202',
          difficulty: 'hard',
          question: `According to USCS, a soil with more than 50% retained on a No. 200 sieve and more than 50% of the coarse fraction passing the No. 4 sieve is:`,
          option_a: 'Gravel',
          option_b: 'Sand',
          option_c: 'Silt',
          option_d: 'Clay',
        }
      ];
      setQuestions(dummyQuestions);
      setVisitedQuestions({ 0: true });
      setStatus('playing');
    }, 1200); 
  }, []);

  // Timer Effect
  useEffect(() => {
    let timer;
    if (status === 'playing') {
      timer = setInterval(() => setTimeElapsed(prev => prev + 1), 1000);
    }
    return () => clearInterval(timer);
  }, [status]);

  const currentQ = questions[currentIndex];

  // Logic Handlers
  const handleSelectOption = useCallback((questionId, option) => {
    setUserAnswers(prev => ({ ...prev, [questionId]: option }));
  }, []);

  const handleNext = useCallback(() => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setVisitedQuestions(prev => ({ ...prev, [currentIndex + 1]: true }));
    }
  }, [currentIndex, questions.length]);

  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setVisitedQuestions(prev => ({ ...prev, [currentIndex - 1]: true }));
    }
  }, [currentIndex]);

  const toggleReview = () => {
    setReviewedQuestions(prev => ({ ...prev, [currentQ.id]: !prev[currentQ.id] }));
  };

  const clearAnswer = () => {
    setUserAnswers(prev => {
      const next = { ...prev };
      delete next[currentQ.id];
      return next;
    });
    setConfidenceLevels(prev => {
      const next = { ...prev };
      delete next[currentQ.id];
      return next;
    });
  };

  const handleSetConfidence = (level) => {
    setConfidenceLevels(prev => ({ ...prev, [currentQ.id]: level }));
  };

  const handleSubmit = () => {
    setStatus('submitting');
    setTimeout(() => {
      alert("Rapid Fire Completed! (Results page coming next)");
      router.push(`/quiz/results/rapid-fire-attempt-123`);
    }, 1000);
  };

  // Keyboard Navigation Support
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (status !== 'playing') return;
      const key = e.key.toUpperCase();
      if (['A', 'B', 'C', 'D'].includes(key)) {
        handleSelectOption(currentQ.id, key);
      } else if (e.key === 'Enter') {
        currentIndex === questions.length - 1 ? handleSubmit() : handleNext();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrevious();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [status, currentQ, currentIndex, handleSelectOption, handleNext, handlePrevious, questions.length]);

  // Swipe Navigation Handlers
  const handleTouchStart = (e) => setTouchStart(e.targetTouches[0].clientX);
  const handleTouchEnd = (e) => {
    if (!touchStart) return;
    const touchEnd = e.changedTouches[0].clientX;
    if (touchStart - touchEnd > 50) handleNext(); // Swipe left
    if (touchStart - touchEnd < -50) handlePrevious(); // Swipe right
    setTouchStart(null);
  };

  // Format Timer
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // --- UI: LOADING STATE ---
  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_#eff6ff,_#f8fafc_40%)]">
        <div className="w-full max-w-2xl px-4 text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-orange-500 mb-6 shadow-sm"></div>
          <h2 className="text-xl font-bold text-slate-800 animate-pulse mb-8">Compiling mixed questions...</h2>
          <div className="bg-white/50 rounded-2xl p-8 shadow-sm text-left">
            <div className="h-4 bg-slate-200 rounded w-1/4 mb-6"></div>
            <div className="h-8 bg-slate-200 rounded w-3/4 mb-10"></div>
            <div className="space-y-4">
              {[1, 2, 3, 4].map(i => <div key={i} className="h-14 bg-slate-200 rounded-xl w-full"></div>)}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- UI: PLAYING STATE ---
  const isLastQuestion = currentIndex === questions.length - 1;
  const progressPercentage = Math.round(((currentIndex + 1) / questions.length) * 100);
  const hasAnsweredCurrent = !!userAnswers[currentQ?.id];
  const isReviewed = reviewedQuestions[currentQ?.id];
  const answeredCount = Object.keys(userAnswers).length;

  return (
    <div 
      className="min-h-screen bg-[radial-gradient(circle_at_top,_#eff6ff,_#f8fafc_40%)] flex flex-col items-center py-6 px-4 md:py-12"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      
      {/* HEADER SECTION */}
      <div className="w-full max-w-4xl mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 leading-tight tracking-tight flex items-center gap-2">
            <svg className="w-6 h-6 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Rapid Fire
          </h2>
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1 block">Mixed Syllabus</span>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Timer */}
          <div className="flex items-center gap-2 bg-white px-4 py-1.5 rounded-lg font-mono font-bold text-slate-700 shadow-sm ring-1 ring-slate-200">
            <svg className="w-4 h-4 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {formatTime(timeElapsed)}
          </div>
        </div>
      </div>

      {/* QUESTION PALETTE GRID */}
      <div className="w-full max-w-4xl bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6 flex flex-wrap gap-2">
        {questions.map((q, idx) => {
          const isAns = !!userAnswers[q.id];
          const isRev = !!reviewedQuestions[q.id];
          const isVis = !!visitedQuestions[idx];
          const isCur = idx === currentIndex;

          let blockClass = "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"; 
          if (isRev) blockClass = "bg-amber-100 border-amber-300 text-amber-800"; 
          else if (isAns) blockClass = "bg-emerald-100 border-emerald-300 text-emerald-800"; 
          else if (isVis) blockClass = "bg-slate-100 border-slate-300 text-slate-600"; 

          return (
            <button
              key={q.id}
              onClick={() => setCurrentIndex(idx)}
              className={`w-10 h-10 flex items-center justify-center rounded-lg border-2 text-sm font-bold transition-all ${blockClass} ${isCur ? 'ring-2 ring-offset-2 ring-orange-400' : ''}`}
            >
              {idx + 1}
            </button>
          );
        })}
      </div>

      {/* MAIN QUESTION CARD */}
      <div className="w-full max-w-4xl bg-white/90 backdrop-blur rounded-[28px] shadow-[0_10px_40px_rgba(15,23,42,0.08)] border border-slate-200 overflow-hidden flex flex-col relative">
        
        {/* Progress Bar (Rapid Fire Gradient) */}
        <div className="w-full h-2 bg-slate-100 relative">
          <div 
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-orange-500 to-rose-600 transition-all duration-500 ease-out"
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>

        <div className="p-6 md:p-10 flex-1">
          {/* Top Card Stats & Controls */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="text-sm font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
                {currentIndex + 1} of {questions.length}
              </div>
              <div className="text-sm font-semibold text-slate-500 hidden sm:block">
                Ans: {answeredCount} / {questions.length}
              </div>
            </div>

            <button 
              onClick={toggleReview}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-bold transition-all ${isReviewed ? 'bg-amber-100 text-amber-700 ring-1 ring-amber-300' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
            >
              <svg className="w-4 h-4" fill={isReviewed ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
              Mark for Review
            </button>
          </div>

          {/* Animated Question Container */}
          <div key={currentIndex} className="animate-in fade-in slide-in-from-right-8 duration-300">
            
            {/* Dynamic Question Tags (Specific to Rapid Fire) */}
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">From:</span>
                <span className="inline-flex items-center rounded bg-slate-800 px-2.5 py-1 text-xs font-semibold text-white shadow-sm">
                  {currentQ.chapter_code}
                </span>
              </div>
              
              <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-bold shadow-sm ring-1 
                ${currentQ.difficulty === 'easy' ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' : 
                  currentQ.difficulty === 'hard' ? 'bg-red-50 text-red-700 ring-red-200' : 
                  'bg-amber-50 text-amber-700 ring-amber-200'}`}>
                <span>{currentQ.difficulty === 'easy' ? '🟢' : currentQ.difficulty === 'hard' ? '🔴' : '🟡'}</span>
                <span className="uppercase tracking-wide">{currentQ.difficulty}</span>
              </div>
            </div>

            {/* Question Text */}
            <h3 className="text-2xl md:text-3xl font-bold text-slate-900 mb-8 leading-relaxed md:leading-loose">
              {currentQ.question}
            </h3>

            {/* Options */}
            <div className="space-y-4 md:space-y-6">
              {['A', 'B', 'C', 'D'].map((opt) => {
                const optionKey = `option_${opt.toLowerCase()}`;
                const isSelected = userAnswers[currentQ.id] === opt;
                
                return (
                  <button
                    key={opt}
                    onClick={() => handleSelectOption(currentQ.id, opt)}
                    className={`w-full flex items-center p-4 md:p-5 rounded-2xl border-2 text-left transition-all duration-200 hover:shadow-md hover:-translate-y-[1px] hover:scale-[1.01] active:scale-[0.99] group ${
                      isSelected 
                        ? 'border-slate-900 bg-slate-50 text-slate-900 shadow-sm ring-2 ring-slate-200' 
                        : 'border-slate-200 bg-white hover:border-slate-400 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl mr-5 font-black text-lg transition-colors ${
                      isSelected ? 'bg-slate-900 text-white shadow-inner' : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200 group-hover:text-slate-600'
                    }`}>
                      {opt}
                    </span>
                    <span className="text-lg font-medium leading-relaxed flex-1">
                      {currentQ[optionKey]}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Sub-actions (Clear & Confidence) */}
            <div className="mt-6 flex flex-wrap items-center justify-between gap-4 h-10">
              {hasAnsweredCurrent && (
                <div className="flex items-center gap-2 animate-in fade-in duration-200">
                  <span className="text-sm font-semibold text-slate-500">Confidence:</span>
                  {['Low', 'Medium', 'High'].map(level => (
                    <button 
                      key={level}
                      onClick={() => handleSetConfidence(level)}
                      className={`px-3 py-1 text-xs font-bold rounded-full transition-colors ${confidenceLevels[currentQ.id] === level ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              )}

              {hasAnsweredCurrent && (
                <button 
                  onClick={clearAnswer}
                  className="text-sm font-semibold text-slate-400 hover:text-red-500 transition-colors ml-auto flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Clear Answer
                </button>
              )}
            </div>
          </div>
        </div>

        {/* STICKY BOTTOM NAVIGATION BAR */}
        <div className="sticky bottom-0 bg-white/95 backdrop-blur-md border-t border-slate-200 p-4 md:px-10 md:py-6 flex items-center justify-between rounded-b-[28px] z-10">
          <button
            onClick={handlePrevious}
            disabled={currentIndex === 0 || status === 'submitting'}
            className="px-6 py-3 rounded-xl font-bold text-slate-500 transition-all duration-200 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-30 disabled:hover:bg-transparent hover:scale-[1.02] active:scale-[0.98]"
          >
            Previous
          </button>
          
          {!isLastQuestion ? (
            <button
              onClick={handleNext}
              className={`px-10 py-3 rounded-xl font-bold shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-[1px] hover:scale-[1.02] active:scale-[0.98] ${
                hasAnsweredCurrent ? 'bg-slate-900 text-white hover:bg-slate-800' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 ring-1 ring-inset ring-slate-200'
              }`}
            >
              {hasAnsweredCurrent ? 'Next Question' : 'Skip Question'}
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={status === 'submitting'}
              className="bg-emerald-600 text-white px-10 py-3 rounded-xl font-bold shadow-lg transition-all duration-200 hover:shadow-xl hover:-translate-y-[1px] hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 flex items-center gap-2"
            >
              {status === 'submitting' ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
                  Scoring...
                </span>
              ) : 'Finish Rapid Fire'}
            </button>
          )}
        </div>
      </div>
      
      {/* Footer Meta */}
      <div className="mt-8 text-center text-sm font-medium text-slate-400 flex flex-col items-center gap-2">
        <p>Shortcuts: <kbd className="bg-slate-200 px-1.5 py-0.5 rounded text-slate-700">A</kbd> <kbd className="bg-slate-200 px-1.5 py-0.5 rounded text-slate-700">B</kbd> <kbd className="bg-slate-200 px-1.5 py-0.5 rounded text-slate-700">C</kbd> <kbd className="bg-slate-200 px-1.5 py-0.5 rounded text-slate-700">D</kbd> to select, <kbd className="bg-slate-200 px-1.5 py-0.5 rounded text-slate-700">Enter</kbd> to go next.</p>
        <p className="flex items-center gap-1 text-orange-500/80">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Your speed & accuracy will be analyzed
        </p>
      </div>

    </div>
  );
}