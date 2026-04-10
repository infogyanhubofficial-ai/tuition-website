"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// --- MOCK STATE: Tell your developer to wire this to your backend auth/DB ---
const MOCK_AUTH_STATE = {
  isAuthenticated: true, // Toggle to false to see the Guest Mode!
  tier: "free", // "guest", "free", "premium"
  profile: {
    firstName: "Nischal",
    lastName: "S.",
    userId: "u_123"
  },
  streakData: {
    questionsToday: 12,
    goal: 30,
    currentStreak: 4,
    mockTestsUnlocked: 1
  },
  performanceSummary: {
    accuracy: 68,
    weakestChapter: { code: "CE0202", title: "Soil Mechanics", accuracy: 42.5 },
    strongestChapter: { code: "CE0901", title: "Transportation", accuracy: 88 },
    rankThisWeek: 14,
    rankMovement: "+2",
    lastAttempt: { 
      mode: "Chapter-wise Quiz", 
      chapter: "Structural Analysis", 
      score: "14/20", 
      timeSpent: "12m 30s" 
    }
  },
  featureAccess: {
    rapidFireAttemptsUsed: 18,
    rapidFireLimit: 20
  }
};

// --- REUSABLE COMPONENT: Continue Learning Card ---
const ContinueLearningCard = ({ lastAttempt }) => {
  if (!lastAttempt) return null;

  return (
    <div className="bg-white border border-indigo-100 rounded-2xl p-5 md:p-6 shadow-sm hover:shadow-md transition-all group flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-500 bg-indigo-50 px-2.5 py-1 rounded-md">Resume Practice</span>
          <span className="text-xs font-semibold text-slate-400">Last active 2 hrs ago</span>
        </div>
        <h3 className="text-lg font-bold text-slate-900 mb-1">{lastAttempt.chapter}</h3>
        <p className="text-sm text-slate-500 mb-4">{lastAttempt.mode} • Current Score: <strong className="text-slate-700">{lastAttempt.score}</strong></p>
      </div>
      <button className="w-full flex items-center justify-center gap-2 bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white px-4 py-3 rounded-xl font-bold transition-colors text-sm group-hover:shadow-sm">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        Continue Session
      </button>
    </div>
  );
};

// --- REUSABLE COMPONENT: DailyGoalCard ---
const DailyGoalCard = ({ questionsToday, goal = 30, streak, onStreakClick }) => {
  const progressPercent = Math.min((questionsToday / goal) * 100, 100);
  const isGoalMet = questionsToday >= goal;
  const daysToReward = 3 - (streak % 3);
  
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6 shadow-sm flex flex-col items-center justify-between gap-6 relative overflow-hidden h-full">
      <div className="w-full cursor-pointer group" onClick={onStreakClick}>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 group-hover:text-indigo-600 transition-colors">
            Daily Target
          </h3>
          <span className="text-sm font-black text-slate-700">{questionsToday} <span className="text-slate-400 font-medium">/ {goal}</span></span>
        </div>
        
        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden mb-3">
          <div 
            className={`h-full rounded-full transition-all duration-1000 ease-out ${isGoalMet ? 'bg-emerald-500' : 'bg-blue-500'}`}
            style={{ width: `${progressPercent}%` }}
          ></div>
        </div>
        
        <p className="text-xs text-slate-500 font-medium mb-4">
          {isGoalMet ? <span className="text-emerald-600 font-bold">Goal met! You're on fire.</span> : `Solve ${goal - questionsToday} more questions today.`}
        </p>
      </div>

      <div 
        onClick={onStreakClick}
        className="w-full bg-gradient-to-br from-orange-50 to-amber-50 hover:from-orange-100 border border-orange-100 rounded-xl p-3 flex items-center gap-4 cursor-pointer transition-colors"
      >
        <div className="flex flex-col items-center justify-center bg-white h-12 w-12 rounded-lg shadow-sm border border-orange-100 shrink-0">
          <span className="text-lg font-black text-orange-600">{streak}</span>
        </div>
        <div>
          <h4 className="font-bold text-sm text-slate-800 flex items-center gap-1">
            Current Streak <span className="text-orange-500">🔥</span>
          </h4>
          <p className="text-[10px] font-medium text-slate-600 mt-0.5 leading-snug">
            {isGoalMet && daysToReward === 3 ? "Reward unlocked!" : `${daysToReward} days to unlock 3 Mocks`}
          </p>
        </div>
      </div>
    </div>
  );
};

// --- REUSABLE COMPONENT: CompetitiveLeaderboardCard ---
const CompetitiveLeaderboardCard = ({ weeklyData, currentUserRank }) => {
  return (
    <div className="flex flex-col rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden h-[400px]">
      <div className="bg-slate-900 p-5 text-white relative flex-shrink-0 flex justify-between items-center">
        <h3 className="text-lg font-bold flex items-center gap-2">Live Leaderboard</h3>
        <span className="text-xs font-bold bg-indigo-500/30 text-indigo-200 px-2 py-1 rounded">This Week</span>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col">
          {weeklyData.map((user) => {
            const isCurrentUser = user.user_id === currentUserRank.userId;
            let rankClasses = "bg-slate-100 text-slate-600 border-slate-200";
            let rowClasses = isCurrentUser ? "bg-indigo-50/50 border-l-4 border-l-indigo-500" : "border-b border-slate-50";
            
            if (user.rank === 1) { 
              rankClasses = "bg-yellow-100 text-yellow-700 border-yellow-300 ring-2 ring-yellow-200"; 
              rowClasses += " bg-gradient-to-r from-yellow-50/50 to-transparent"; 
            } else if (user.rank === 2) { 
              rankClasses = "bg-slate-200 text-slate-700 border-slate-300"; 
            } else if (user.rank === 3) { 
              rankClasses = "bg-orange-100 text-orange-800 border-orange-200"; 
            }

            return (
              <div key={user.user_id} className={`flex items-center justify-between p-3.5 ${rowClasses}`}>
                <div className="flex items-center gap-3">
                  <div className={`flex h-7 w-7 items-center justify-center rounded-full border text-[10px] font-bold ${rankClasses}`}>
                    {user.rank === 1 ? '🥇' : user.rank}
                  </div>
                  <div className="flex items-center gap-2">
                    <p className={`text-sm font-bold ${isCurrentUser ? 'text-indigo-700' : 'text-slate-800'}`}>
                      {user.display_name} {isCurrentUser && "(You)"}
                    </p>
                    {/* Drama: Movement Indicator */}
                    {user.movement === 'up' && <span className="text-[10px] text-emerald-500 flex items-center">↑</span>}
                    {user.movement === 'down' && <span className="text-[10px] text-rose-500 flex items-center">↓</span>}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-slate-700">{user.correct_count}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// --- REUSABLE COMPONENT: ModeCard ---
const ModeCard = ({ 
  title, purpose, description, meta, timeEstimate, href, icon, buttonText, microcopy, theme = "blue", isFlagship = false, isLocked = false, authState
}) => {
  const router = useRouter();
  
  const themes = {
    blue: { wrapper: "bg-gradient-to-b from-blue-50/50 to-white", bg: "bg-blue-50 text-blue-600", button: "bg-blue-600 hover:bg-blue-700" },
    amber: { wrapper: "bg-gradient-to-b from-amber-50/50 to-white", bg: "bg-amber-50 text-amber-600", button: "bg-amber-600 hover:bg-amber-700" },
    emerald: { wrapper: "bg-gradient-to-br from-emerald-50 to-white ring-2 ring-emerald-100", bg: "bg-emerald-100 text-emerald-700", button: "bg-emerald-600 hover:bg-emerald-700" },
    indigo: { wrapper: "bg-gradient-to-b from-indigo-50/50 to-white", bg: "bg-indigo-50 text-indigo-600", button: "bg-indigo-600 hover:bg-indigo-700" },
    locked: { wrapper: "bg-slate-50 text-slate-400", bg: "bg-slate-100 text-slate-400", button: "bg-slate-800 hover:bg-slate-900" } // Dark button for guest login
  };
  
  // If guest, force locked theme visually but button acts as Login CTA
  const isGuest = !authState.isAuthenticated;
  const activeTheme = (isLocked || isGuest) ? themes.locked : themes[theme];

  const handleAction = (e) => {
    e.preventDefault();
    if (isGuest) alert("Opening Auth Modal: Login to Continue!");
    else if (isLocked) alert("Opening Upgrade Modal!");
    else router.push(href);
  };

  return (
    <div className={`relative flex flex-col justify-between rounded-[24px] border p-6 md:p-8 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${activeTheme.wrapper} ${isFlagship && !isGuest ? 'border-emerald-300' : 'border-slate-200'}`}>
      {isFlagship && !isGuest && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-emerald-500 px-4 py-1 text-xs font-black uppercase text-white shadow-md">
          Flagship Mode
        </div>
      )}

      <div>
        <div className="mb-5 flex items-start justify-between">
          <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${activeTheme.bg} shadow-sm`}>
            {icon}
          </div>
          <span className="inline-flex items-center rounded-full bg-white border border-slate-200 px-3 py-1 text-xs font-bold text-slate-600 shadow-sm">
            ⏱ {timeEstimate}
          </span>
        </div>
        <h3 className={`text-xl md:text-2xl font-black mb-1 tracking-tight ${(isLocked||isGuest) ? 'text-slate-600' : 'text-slate-900'}`}>{title}</h3>
        <p className={`text-[10px] md:text-xs font-bold uppercase tracking-wider mb-3 ${isFlagship && !isGuest ? 'text-emerald-600' : 'text-slate-400'}`}>{purpose}</p>
        <p className="text-sm text-slate-600 mb-6 leading-relaxed font-medium">{description}</p>
      </div>
      
      <div>
        <div className="mb-6 flex flex-wrap gap-2">
          {meta.map((tag, i) => (
            <span key={i} className="inline-flex items-center rounded-md border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-bold text-slate-500 shadow-sm">{tag}</span>
          ))}
        </div>
        <div className="text-center">
          <button onClick={handleAction} className={`w-full rounded-xl px-4 py-3.5 text-sm font-black text-white transition-all shadow-md ${activeTheme.button}`}>
            {isGuest ? 'Login to Start Free' : isLocked ? 'Unlock Premium' : buttonText}
          </button>
          <p className="mt-2 text-xs font-bold text-slate-400">{isGuest ? 'Requires Free Account' : microcopy}</p>
        </div>
      </div>
    </div>
  );
};

// --- MAIN PAGE ---
export default function QuizDashboardPage() {
  const authState = MOCK_AUTH_STATE; // Replace with real auth hook in production

  const weeklyLeaderboardData = [
    { rank: 1, user_id: "u1", display_name: "Aayush K.", correct_count: 184, movement: 'same' },
    { rank: 2, user_id: "u2", display_name: "Suman P.", correct_count: 171, movement: 'up' },
    { rank: 3, user_id: "u3", display_name: "Rabin D.", correct_count: 165, movement: 'down' },
    { rank: 14, user_id: "u_123", display_name: "Nischal S.", correct_count: 85, movement: 'up' }, // Current User
    { rank: 15, user_id: "u5", display_name: "Kriti A.", correct_count: 82, movement: 'same' }
  ];

  return (
    <div className="min-h-screen bg-slate-50 relative pb-20 font-sans">
      <div className="absolute top-0 left-0 w-full h-[400px] bg-gradient-to-b from-blue-100/40 to-transparent pointer-events-none"></div>
      
      <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8 relative z-10 pt-6">
        
        {/* HERO SECTION: Dynamic based on Auth */}
        <div className="mb-8 text-center max-w-3xl mx-auto pt-4 md:pt-8">
          {authState.isAuthenticated ? (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 mb-4">
                Welcome back, {authState.profile.firstName} 👋
              </h1>
              {/* Personal Data Chips */}
              <div className="flex flex-wrap justify-center gap-2 md:gap-4 mb-6">
                <div className="bg-white border border-slate-200 shadow-sm rounded-full px-4 py-1.5 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                  <span className="text-xs font-bold text-slate-600">Accuracy: <span className="text-slate-900">{authState.performanceSummary.accuracy}%</span></span>
                </div>
                <div className="bg-white border border-slate-200 shadow-sm rounded-full px-4 py-1.5 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-rose-500"></div>
                  <span className="text-xs font-bold text-slate-600">Focus: <span className="text-slate-900">Soil Mechanics</span></span>
                </div>
                <div className="bg-white border border-slate-200 shadow-sm rounded-full px-4 py-1.5 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                  <span className="text-xs font-bold text-slate-600">Rank: <span className="text-slate-900">#{authState.performanceSummary.rankThisWeek}</span></span>
                </div>
              </div>
              <button className="bg-slate-900 text-white px-8 py-3 rounded-full font-bold text-sm hover:bg-slate-800 transition-colors shadow-lg">
                Continue Practice
              </button>
            </div>
          ) : (
            // GUEST HERO
            <div className="animate-in fade-in duration-500">
              <div className="inline-flex items-center rounded-full border border-blue-200 bg-white shadow-sm px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-blue-700 mb-6">
                Civil Engineering Syllabus Updated
              </div>
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 mb-6">
                Nepal Engineering Council <br className="hidden sm:block" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">License Exam Prep</span>
              </h1>
              <p className="text-lg text-slate-600 font-medium mb-8">
                The most realistic practice platform for Nepali Civil Engineers. Master individual chapters or simulate the 2-hour official exam.
              </p>
              <button className="bg-blue-600 text-white px-10 py-4 rounded-full font-black text-sm hover:bg-blue-700 transition-colors shadow-xl shadow-blue-600/20">
                Create Free Account
              </button>
            </div>
          )}
        </div>

        {/* GUIDED EXPERIENCE: Focus Today */}
        {authState.isAuthenticated && (
          <div className="max-w-5xl mx-auto mb-12">
            <h2 className="text-lg font-black text-slate-900 mb-4 px-1">Your Focus Today</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <ContinueLearningCard lastAttempt={authState.performanceSummary.lastAttempt} />
              <DailyGoalCard 
                questionsToday={authState.streakData.questionsToday} 
                goal={authState.streakData.goal}
                streak={authState.streakData.currentStreak} 
                onStreakClick={() => document.getElementById('gyanhub-special-mode').scrollIntoView({ behavior: 'smooth' })}
              />
            </div>
          </div>
        )}

        {/* GUEST BENEFITS PREVIEW */}
        {!authState.isAuthenticated && (
          <div className="max-w-4xl mx-auto mb-16 grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div className="text-2xl mb-2">📊</div>
              <h3 className="font-bold text-slate-900 text-sm">Save Progress</h3>
              <p className="text-xs text-slate-500 mt-1">Never lose your quiz history.</p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div className="text-2xl mb-2">🧠</div>
              <h3 className="font-bold text-slate-900 text-sm">AI Analytics</h3>
              <p className="text-xs text-slate-500 mt-1">Track your weakest chapters.</p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div className="text-2xl mb-2">🏆</div>
              <h3 className="font-bold text-slate-900 text-sm">Live Leaderboard</h3>
              <p className="text-xs text-slate-500 mt-1">Compete with other engineers.</p>
            </div>
          </div>
        )}

        {/* MAIN LAYOUT: Mobile Stack Ordering using Flex/Grid */}
        <div className="max-w-5xl mx-auto flex flex-col lg:flex-row gap-8">
          
          {/* LEFT/MAIN COLUMN: Practice Modes */}
          <div className="flex-1 order-1 lg:order-1">
            <h2 className="text-2xl font-black text-slate-900 mb-6 tracking-tight">Practice Modes</h2>
            
            <div className="grid grid-cols-1 gap-6">
              
              <ModeCard 
                id="gyanhub-special-mode"
                theme="indigo"
                authState={authState}
                title="GyanHub Special"
                purpose="Weekly Public Challenge"
                description="Compete with thousands of engineers. This is the ONLY mode where your score is public on the leaderboard. New set every week."
                meta={["🏆 Leaderboard Eligible", "Public Score"]}
                timeEstimate="30 mins"
                href="/quiz/gyanhub-special"
                buttonText="Start Special Quiz"
                microcopy="Will be posted to leaderboard"
                icon={<svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M19 11A7 7 0 015 11V4h14v7zM8 21h8M12 18v3" /></svg>}
              />

              <ModeCard 
                theme="emerald"
                isFlagship={true}
                authState={authState}
                isLocked={authState.isAuthenticated && authState.streakData.mockTestsUnlocked === 0 && authState.tier === 'free'}
                title="NEC Model Exam"
                purpose="Full exam simulation under pressure"
                description="The ultimate test. 80 questions strictly weighted by the official NEC syllabus with a running 2-hour countdown timer."
                meta={["Official Weightage", "1-Mark & 2-Mark Questions"]}
                timeEstimate="2 Hours"
                href="/quiz/model-exam"
                buttonText="Start Official Mock Test"
                microcopy="Simulate the real exam pressure"
                icon={<svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ModeCard 
                  theme="blue"
                  authState={authState}
                  title="Chapter-wise"
                  purpose="Master one chapter at a time"
                  description="Focus your studies. Select a specific Civil Engineering chapter and master the core concepts."
                  meta={["10 Chapters", "Difficulty Control"]}
                  timeEstimate="10 mins"
                  href="/quiz/chapter-wise"
                  buttonText="Choose Chapter"
                  microcopy="Start with your weakest area"
                  icon={<svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253" /></svg>}
                />

                <ModeCard 
                  theme="amber"
                  authState={authState}
                  isLocked={authState.isAuthenticated && authState.tier === "free" && authState.featureAccess.rapidFireAttemptsUsed >= authState.featureAccess.rapidFireLimit}
                  title="Rapid Fire"
                  purpose="Quick revision checks"
                  description="Solve 20 random, mixed-difficulty questions pulled from across the entire syllabus."
                  meta={["20Q Set", "Mixed Chapters"]}
                  timeEstimate="15 mins"
                  href="/quiz/rapid-fire"
                  buttonText="Start Rapid Fire"
                  microcopy={`${authState.featureAccess.rapidFireAttemptsUsed}/20 Free Used`}
                  icon={<svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
                />
              </div>

            </div>
          </div>

          {/* RIGHT COLUMN: Leaderboard & Stats (Stacks to bottom on mobile) */}
          <div className="w-full lg:w-80 flex flex-col gap-6 order-2 lg:order-2">
            <CompetitiveLeaderboardCard 
              weeklyData={weeklyLeaderboardData} 
              currentUserRank={{userId: authState.profile.userId}}
            />
            {/* Can add the ExpertiseLevelCard here as well if desired */}
          </div>

        </div>
      </div>
    </div>
  );
}