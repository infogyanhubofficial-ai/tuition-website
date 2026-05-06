"use client";
import React from "react";
import Link from "next/link";
import { CheckCircle, X, Clock, PlayCircle, Star, BookOpen, User, Activity, Calendar, ExternalLink, Sparkles } from "lucide-react";

// --- 1. DESIGN TOKENS ---
export const tokens = {
  radius: {
    card: "rounded-2xl",
    button: "rounded-xl",
    badge: "rounded-lg",
  },
  padding: {
    small: "p-4 sm:p-5",
    main: "p-4 sm:p-6",
    hero: "p-6 sm:p-8 md:p-10",
  },
  shadow: {
    card: "shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-200/60 bg-gradient-to-b from-white to-slate-50/40",
    hover: "hover:shadow-[0_15px_35px_rgba(30,58,138,0.06)] hover:-translate-y-1 hover:border-blue-500/30 transition-all duration-300 ease-in-out",
  },
  colors: {
    primary: "blue-700",
    accent: "orange-500",
    surface: "bg-white",
    background: "bg-[#F8FAFC]",
  }
};

// --- 2. TYPES ---
export interface Vacancy {
  id: number;
  subject: string;
  location: string;
  class_level: string;
  description?: string;
  salary_range: string;
  class_time: string;
  urgent?: boolean;
  status: boolean;
  applicant_count?: number;
}

export interface OnlineCourse {
  id: string;
  title: string;
  course_code?: string;
  cover_pic: string;
  start_datetime: string;
  timing?: string;
  fee: number;
  discount: number;
  tutor_name?: string;
  duration?: string;
  difficulty_level?: string;
}

export interface Tutor {
  id: number;
  user_id: string;
  name: string;
  subject: string[];
  avatar_url?: string;
  verified?: boolean;
  education?: string;
  hour_rate?: string | number | null;
  location?: string;
  bio?: string;
  experience?: string | number | null;
  contact_num?: string;
  availability?: boolean;
}

export interface GlobalRecording {
  id: string;
  course_name: string;
  course_hours: string;
  standard_fee: number;
  discount: number;
  cover_pic_url: string;
}

// --- 3. SHARED UI COMPONENTS ---

export function StatusBadge({ status }: { status: string }) {
  const st = status.toLowerCase();
  const isAccepted = st === 'accepted' || st === 'verified';
  const isRejected = st === 'rejected';
  
  const colorMap = {
    bg: isAccepted ? 'bg-emerald-50 border-emerald-200' : isRejected ? 'bg-red-50 border-red-200' : 'bg-slate-100 border-slate-200',
    text: isAccepted ? 'text-emerald-700' : isRejected ? 'text-red-700' : 'text-slate-700',
    icon: isAccepted ? CheckCircle : isRejected ? X : Clock
  };

  const Icon = colorMap.icon;

  return (
    <div className={`flex items-center gap-1 sm:gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 ${colorMap.bg} ${colorMap.text} border ${tokens.radius.badge} w-fit shadow-sm`}>
      <Icon size={10} className="sm:w-3 sm:h-3" />
      <span className="text-[10px] sm:text-xs font-bold capitalize tracking-wide">{status}</span>
    </div>
  );
}

export function AvatarDisplay({ name, url }: { name: string; url?: string }) {
  if (url) return <img src={url} className={`h-10 w-10 sm:h-12 sm:w-12 ${tokens.radius.badge} object-cover border border-slate-200 shadow-sm`} alt={name} />;
  return (
    <div className={`h-10 w-10 sm:h-12 sm:w-12 ${tokens.radius.badge} bg-gradient-to-br from-blue-700 to-blue-900 flex items-center justify-center text-white font-extrabold text-base sm:text-lg shrink-0 shadow-sm`}>
      {name?.charAt(0) || 'T'}
    </div>
  );
}

export function SkeletonLoader() {
  return (
    <div className="p-4 sm:p-8 md:p-10 animate-pulse w-full relative z-10">
      <div className={`bg-slate-200/60 ${tokens.radius.card} h-40 sm:h-48 mb-6 sm:mb-10`}></div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 mb-6 sm:mb-10">
        <div className={`lg:col-span-5 h-48 sm:h-64 bg-slate-200/60 ${tokens.radius.card}`}></div>
        <div className={`lg:col-span-7 h-48 sm:h-64 bg-slate-200/60 ${tokens.radius.card}`}></div>
      </div>
    </div>
  );
}

export function StatCard({ label, value, icon }: any) {
  return (
    <div className={`bg-gradient-to-br from-white to-slate-50/80 p-5 sm:p-6 ${tokens.radius.card} flex items-center justify-between h-full ${tokens.shadow.card} relative overflow-hidden group border-t-4 border-t-transparent hover:border-t-blue-600 transition-all`}>
      <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-blue-500/5 rounded-full blur-2xl -mr-8 -mt-8 sm:-mr-10 sm:-mt-10 pointer-events-none transition-all group-hover:bg-blue-500/10"></div>
      <div className="relative z-10 flex flex-col">
        <p className="text-[9px] sm:text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1 sm:mb-2">{label}</p>
        <p className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-slate-800">{value}</p>
      </div>
      <div className={`p-3 sm:p-4 bg-slate-50 text-slate-400 ${tokens.radius.button} border border-slate-100 relative z-10 shrink-0 group-hover:bg-blue-50 group-hover:text-blue-700 group-hover:scale-110 transition-all shadow-sm`}>{icon}</div>
    </div>
  );
}

export function RecommendedRecordingsBox({ recordings, router }: { recordings: GlobalRecording[], router: any }) {
  if (!recordings || recordings.length === 0) return null;
  return (
    <div className={`bg-gradient-to-br from-white to-slate-50/50 border border-slate-200/60 ${tokens.radius.card} p-5 sm:p-6 ${tokens.shadow.card} flex flex-col gap-4 group hover:border-t-blue-600 transition-colors`}>
      <div className="flex items-center justify-between">
        <h3 className="text-[10px] sm:text-[11px] font-extrabold text-slate-500 uppercase tracking-widest flex items-center gap-1.5 sm:gap-2">
          <PlayCircle size={14} className="text-blue-600 sm:w-4 sm:h-4" /> Top Recordings
        </h3>
        <Link href="/recording" className="text-[9px] sm:text-[10px] font-extrabold uppercase text-blue-700 hover:underline flex items-center gap-1 tracking-wide">
          See All <ExternalLink size={12} className="sm:w-[14px] sm:h-[14px]"/>
        </Link>
      </div>
      <div className="flex flex-col gap-2 sm:gap-3">
        {recordings.map(r => {
          const finalPrice = r.discount > 0 ? Math.round(r.standard_fee * (1 - r.discount / 100)) : r.standard_fee;
          const hoursNum = r.course_hours?.toString().match(/\d+/) ? r.course_hours.toString().match(/\d+/)?.[0] : r.course_hours;
          const displayHours = hoursNum ? `${hoursNum}+ hrs` : 'N/A';
          return (
            <div key={r.id} onClick={() => router.push(`/recording/${encodeURIComponent(r.course_name)}`)} className={`flex items-center justify-between p-2.5 sm:p-3 bg-white border border-slate-100 ${tokens.radius.badge} shadow-sm hover:shadow-md hover:border-blue-200 hover:-translate-y-0.5 transition-all cursor-pointer`}>
              <div className="flex items-center gap-2 sm:gap-3">
                {r.cover_pic_url ? (
                  <img src={r.cover_pic_url} className={`w-10 h-10 sm:w-12 sm:h-12 ${tokens.radius.badge} object-cover border border-slate-100`} alt={r.course_name} />
                ) : (
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 ${tokens.radius.badge} bg-blue-50 flex items-center justify-center border border-blue-100`}>
                    <PlayCircle size={18} className="text-blue-400 sm:w-5 sm:h-5" />
                  </div>
                )}
                <div className="flex flex-col">
                  <p className="text-xs sm:text-sm font-bold text-slate-800 line-clamp-1 group-hover:text-blue-700 transition-colors">{r.course_name}</p>
                  <p className="text-[10px] sm:text-xs font-semibold text-slate-500 flex items-center gap-1 mt-0.5"><Clock size={10} /> {displayHours}</p>
                </div>
              </div>
              <p className="text-xs sm:text-sm font-bold text-slate-800 shrink-0 bg-slate-50 px-2 py-1 sm:px-2.5 sm:py-1 rounded-md border border-slate-200">Rs. {finalPrice}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}