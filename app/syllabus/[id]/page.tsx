import React from 'react';
import Script from 'next/script';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import {
  ArrowLeft,
  Clock,
  BarChart,
  CheckCircle,
  BookOpen,
  PlayCircle,
  User,
  Download,
  MessageCircle,
  Star,
  ChevronDown,
  ListChecks,
  BadgeCheck,
  MessagesSquare,
  CalendarClock,
} from 'lucide-react';

// --- DATABASE SETUP ---
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// --- TYPES ---
interface TopicDay {
  day: number | string;
  title: string;
  topics: string[];
}

interface SyllabusSection {
  title: string;
  days: TopicDay[];
}

interface SyllabusData {
  sections: SyllabusSection[];
}

interface Tutor {
  id: number;
  name: string | null;
  designation: string | null;
  signature_url: string | null;
  tutor_pic_url: string | null;
  tutor_bio: string | null;
}

interface Course {
  id: string;
  course_code: string;
  title: string;
  category: string | null;
  difficulty_level: string | null;
  description: string | null;
  duration: string;
  timing: string | null;
  start_datetime: string | null;
  cover_pic: string | null;
  demo_video_url: string | null;
  learning_outcomes: string[] | null;
  syllabus: SyllabusData | null;
  tutor_id?: number | null;
  tutor_name: string | null;
  tutor_pic_url: string | null;
  tutor_bio: string | null;
}

interface Review {
  id: string;
  name: string | null;
  overall_rating: number | null;
  tutor_rating: number | null;
  content_rating: number | null;
  skill_improvement_rating: number | null;
  materials_rating: number | null;
  liked_most: string | null;
  testimonial: string | null;
  would_recommend: string | null;
  created_at: string;
}

// --- HELPER FUNCTIONS ---
function getYouTubeEmbedUrl(url: string | null) {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11
    ? `https://www.youtube.com/embed/${match[2]}?rel=0&modestbranding=1`
    : null;
}

// 🔒 Escape any DB-sourced string before it is ever concatenated into raw HTML
// (used only for the PDF-export path, which sets innerHTML on the client).
function escapeHtml(input: unknown): string {
  const str = input === null || input === undefined ? '' : String(input);
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function slugify(input: string, fallback: string): string {
  const s = input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return s || fallback;
}

// 🟢 SMART JSON PARSER: Fixes mismatched or "undefined" database JSON
function normalizeSyllabus(raw: any): SyllabusData | null {
  if (!raw) return null;

  let data = raw;

  while (typeof data === 'string') {
    try {
      data = JSON.parse(data);
    } catch (e) {
      break;
    }
  }

  let sectionsArray: any[] = [];
  if (data && Array.isArray(data.sections)) {
    sectionsArray = data.sections;
  } else if (Array.isArray(data)) {
    if (data[0] && (data[0].days || data[0].sections || data[0].title)) {
      sectionsArray = data;
    } else {
      sectionsArray = [{ title: 'Course Curriculum', days: data }];
    }
  }

  if (sectionsArray.length === 0) return null;

  const normalizedSections: SyllabusSection[] = sectionsArray.map((sec: any, sIdx: number) => {
    let daysArray: any[] = [];
    if (Array.isArray(sec.days)) daysArray = sec.days;
    else if (Array.isArray(sec.topics)) daysArray = [sec];

    const normalizedDays: TopicDay[] = daysArray.map((d: any, dIdx: number) => {
      let topicsArray: any[] = [];
      if (Array.isArray(d.topics)) topicsArray = d.topics;
      else if (typeof d.topics === 'string') topicsArray = [d.topics];
      else if (Array.isArray(d.items)) topicsArray = d.items;
      else topicsArray = ['Topic details provided in class'];

      return {
        day: d.day || dIdx + 1,
        title: d.title || d.name || `Topic ${dIdx + 1}`,
        topics: topicsArray.map(t => (typeof t === 'string' ? t : t.title || t.name || 'Content Segment')),
      };
    });

    return {
      title: sec.title || sec.module || sec.name || `Module ${sIdx + 1}`,
      days: normalizedDays,
    };
  });

  return { sections: normalizedSections };
}

// --- REAL DATA FETCHING FROM SYLLABI_V2 ---
async function getCourseAndTutorData(courseCode: string): Promise<{ course: Course | null; tutor: Tutor | null }> {
  const decodedCode = decodeURIComponent(courseCode).trim();
  const isNumeric = /^\d+$/.test(decodedCode);

  let query = supabase.from('syllabi_v2').select(`*, online_tutors (*)`);

  if (isNumeric) {
    query = query.or(`id.eq.${Number(decodedCode)},course_code.ilike.${decodedCode}`);
  } else {
    query = query.ilike('course_code', decodedCode);
  }

  const { data: syllabusData, error: courseError } = await query.maybeSingle();

  if (courseError || !syllabusData) {
    return { course: null, tutor: null };
  }

  const tutorData = Array.isArray(syllabusData.online_tutors)
    ? syllabusData.online_tutors[0]
    : syllabusData.online_tutors;

  const safeSyllabus = normalizeSyllabus(syllabusData.syllabus_content);

  const mappedCourse: Course = {
    id: syllabusData.id.toString(),
    course_code: syllabusData.course_code,
    title: syllabusData.name || '',
    category: syllabusData.category || null,
    difficulty_level: syllabusData.difficulty_level || null,
    description: syllabusData.description || null,
    duration: syllabusData.duration || 'TBA',
    timing: syllabusData.timing || null,
    start_datetime: syllabusData.start_datetime || null,
    cover_pic: syllabusData.cover_pic || null,
    demo_video_url: syllabusData.demo_video_url || null,
    learning_outcomes: syllabusData.learning_outcomes || null,
    syllabus: safeSyllabus,
    tutor_id: syllabusData.tutor_id || null,
    tutor_name: tutorData?.name || null,
    tutor_pic_url: tutorData?.tutor_pic_url || null,
    tutor_bio: tutorData?.tutor_bio || null,
  };

  return { course: mappedCourse, tutor: tutorData };
}

// --- REAL REVIEWS FROM public.reviews ---
function avgOf(reviews: Review[], key: keyof Review): number {
  const vals = reviews
    .map(r => r[key])
    .filter((v): v is number => typeof v === 'number');
  if (!vals.length) return 0;
  return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10;
}

async function getReviews(syllabusId: number): Promise<{ reviews: Review[]; avg: number; count: number }> {
  const { data, error } = await supabase
    .from('reviews')
    .select(
      'id, name, overall_rating, tutor_rating, content_rating, skill_improvement_rating, materials_rating, liked_most, testimonial, would_recommend, created_at'
    )
    .eq('syllabus_id', syllabusId)
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
    .limit(50);

  if (error || !data || data.length === 0) {
    return { reviews: [], avg: 0, count: 0 };
  }

  const rated = data.filter(r => typeof r.overall_rating === 'number');
  const avg = rated.length ? avgOf(data, 'overall_rating') : 0;

  return { reviews: data, avg, count: rated.length };
}

// --- SEO METADATA ---
export async function generateMetadata({ params }: { params: Promise<any> }): Promise<Metadata> {
  const resolvedParams = await params;
  const urlParam = resolvedParams.courseCode || resolvedParams.id;
  if (!urlParam) return {};

  const { course } = await getCourseAndTutorData(urlParam);
  if (!course) return {};

  const title = `${course.title} — Syllabus & Reviews`;
  const description = course.description
    ? course.description.slice(0, 155)
    : `Full day-wise syllabus for ${course.title}. Duration: ${course.duration}.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: course.cover_pic ? [course.cover_pic] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: course.cover_pic ? [course.cover_pic] : undefined,
    },
  };
}

// --- GENERATE HTML CONTENT FOR PDF COMPILER (all interpolated values escaped) ---
function generateSyllabusHTML(
  course: Course,
  syllabusData: SyllabusData | null,
  tutorName: string,
  tutorDesignation: string,
  tutorSignature: string | null | undefined
) {
  let htmlSyllabusContent = '';

  if (syllabusData && syllabusData.sections && syllabusData.sections.length > 0) {
    syllabusData.sections.forEach(section => {
      htmlSyllabusContent += `<div class="pdf-avoid-break" style="page-break-inside: avoid; break-inside: avoid;"><h3 style="color: #0f172a; border-bottom: 2px solid #cbd5e1; padding-bottom: 5px; margin-top: 25px; font-size: 18px;">${escapeHtml(
        section.title
      )}</h3></div>`;
      section.days.forEach(day => {
        htmlSyllabusContent += `
          <div class="pdf-avoid-break" style="margin-bottom: 15px; padding-left: 15px; border-left: 3px solid #0d9488; page-break-inside: avoid; break-inside: avoid;">
            <h4 style="margin: 0 0 5px 0; color: #334155; font-size: 16px;">Day ${escapeHtml(day.day)}: ${escapeHtml(
          day.title
        )}</h4>
            <ul style="margin: 0; padding-left: 20px; color: #475569; font-size: 14px;">
              ${day.topics
                .map(
                  topic =>
                    `<li style="margin-bottom: 4px; page-break-inside: avoid; break-inside: avoid;">${escapeHtml(
                      topic
                    )}</li>`
                )
                .join('')}
            </ul>
          </div>
        `;
      });
    });
  } else {
    htmlSyllabusContent = `<p>No syllabus data available.</p>`;
  }

  const safeSignatureUrl = tutorSignature ? escapeHtml(tutorSignature) : null;

  const signatureHtml = `
    <div class="pdf-avoid-break" style="margin-top: 50px; text-align: right; page-break-inside: avoid; break-inside: avoid;">
      ${
        safeSignatureUrl
          ? `<img src="${safeSignatureUrl}" alt="Signature" style="max-height: 60px; display: inline-block; margin-bottom: 10px;" crossorigin="anonymous" /><br/>`
          : ''
      }
      <span style="font-weight: bold; color: #0f172a; font-size: 16px; display: block;">${escapeHtml(
        tutorName
      )}</span>
      <span style="color: #475569; font-size: 14px; display: block;">${escapeHtml(tutorDesignation)}</span>
    </div>
  `;

  return `
    <div style="font-family: 'Helvetica Neue', Arial, sans-serif; color: #333; line-height: 1.5; padding: 0px; background: #ffffff;">
        <div style="text-align: center; border-bottom: 2px solid #eee; padding-bottom: 15px; margin-bottom: 20px;">
            <img style="height: 140px; margin: 0 auto 15px auto; display: block;" src="https://zuktarghyexwodqnnxlu.supabase.co/storage/v1/object/public/others/GyanHub_logo_website-removebg-preview__1_-removebg-preview.webp" alt="Company Logo" crossorigin="anonymous" />
            <h1 style="margin: 0 0 10px 0; color: #0f172a; font-size: 24px;">"${escapeHtml(course.title)}"</h1>
            <p style="color: #0d9488; font-weight: bold; margin: 0; font-size: 14px;">Course Duration: ${escapeHtml(
              course.duration
            )}</p>
        </div>
        <div style="padding: 5px 0;">
            ${htmlSyllabusContent}
            ${signatureHtml}
        </div>
    </div>`;
}

// --- SMALL STAR RATING SUB-COMPONENT (server-rendered, animated via CSS + IntersectionObserver) ---
function StarRating({ value, size = 16, animate = false }: { value: number; size?: number; animate?: boolean }) {
  const rounded = Math.round(value);
  return (
    <div className={`flex text-amber-400 ${animate ? 'stars-animate' : ''}`} aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          size={size}
          fill={i <= rounded ? 'currentColor' : 'none'}
          className={`${i <= rounded ? '' : 'text-slate-300'} ${animate ? 'star-item' : ''}`}
          style={animate ? ({ transitionDelay: `${i * 60}ms` } as React.CSSProperties) : undefined}
          aria-hidden="true"
        />
      ))}
    </div>
  );
}

// --- MAIN PAGE COMPONENT ---
export default async function CourseSyllabusPage({ params }: { params: Promise<any> }) {
  const resolvedParams = await params;
  const urlParam = resolvedParams.courseCode || resolvedParams.id;

  if (!urlParam) {
    notFound();
  }

  const { course, tutor } = await getCourseAndTutorData(urlParam);

  if (!course) {
    notFound();
  }

  const { reviews, avg, count } = await getReviews(Number(course.id));

  const tutorAvg = avgOf(reviews, 'tutor_rating');
  const contentAvg = avgOf(reviews, 'content_rating');
  const materialsAvg = avgOf(reviews, 'materials_rating');
  const skillAvg = avgOf(reviews, 'skill_improvement_rating');

  const embedUrl = getYouTubeEmbedUrl(course.demo_video_url);

  const displayTutorName = tutor?.name || course.tutor_name || 'Instructor Name TBD';
  const displayTutorDesignation = tutor?.designation || 'Course Tutor';
  const displaySignature = tutor?.signature_url;

  const syllabusData = course.syllabus;
  const hasSections = syllabusData?.sections && Array.isArray(syllabusData.sections) && syllabusData.sections.length > 0;
  const moduleAnchors = hasSections
    ? syllabusData!.sections.map((s, i) => ({ id: `module-${i}-${slugify(s.title, `m${i}`)}`, title: s.title }))
    : [];

  const htmlContent = generateSyllabusHTML(course, syllabusData, displayTutorName, displayTutorDesignation, displaySignature);

  const startDate = course.start_datetime ? new Date(course.start_datetime) : null;
  const showUpcomingBatch = !!(startDate && !isNaN(startDate.getTime()) && startDate.getTime() > Date.now());

  // JSON-LD structured data — lets Google show star ratings directly in search results
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: course.title,
    description: course.description || undefined,
    provider: { '@type': 'Organization', name: 'GyanHub' },
    ...(count > 0
      ? { aggregateRating: { '@type': 'AggregateRating', ratingValue: avg, reviewCount: count } }
      : {}),
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 font-sans pb-28 lg:pb-24">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Page-scoped styles: accordion chevron rotation, bar-fill / star reveal animation, focus rings, active nav state */}
      <style>{`
        details.syllabus-module summary { list-style: none; cursor: pointer; }
        details.syllabus-module summary::-webkit-details-marker { display: none; }
        details.syllabus-module .accordion-chevron { transition: transform 0.25s ease; }
        details.syllabus-module[open] .accordion-chevron { transform: rotate(180deg); }

        .rating-bar-fill { width: 0%; transition: width 0.9s cubic-bezier(0.16, 1, 0.3, 1); }
        .rating-bar-fill.in-view { width: var(--target-width); }

        .stars-animate .star-item { opacity: 0; transform: scale(0.4) rotate(-20deg); transition: opacity 0.4s ease, transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1); }
        .stars-animate.in-view .star-item { opacity: 1; transform: scale(1) rotate(0deg); }

        .nav-link { position: relative; color: #64748b; }
        .nav-link.nav-active { color: #0f172a; }
        .nav-link.nav-active::after { content: ''; position: absolute; left: 0; right: 0; bottom: -1rem; height: 2px; background: #0f172a; }

        .day-card { transition: box-shadow 0.2s ease, border-color 0.2s ease; }
        .day-card:hover { border-color: #0d9488; box-shadow: 0 4px 12px rgba(15, 23, 42, 0.06); }

        .focus-ring:focus-visible { outline: none; box-shadow: 0 0 0 2px #ffffff, 0 0 0 4px #0d9488; }

        #download-pdf-btn .spinner { display: none; }
        #download-pdf-btn.is-loading .spinner { display: inline-block; }
        #download-pdf-btn.is-loading .download-icon { display: none; }
        .spinner { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.4); border-top-color: #fff; border-radius: 50%; animation: spin 0.7s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }

        .sort-btn[data-active="true"] { background: #0f172a; color: #fff; border-color: #0f172a; }

        .review-hidden { display: none; }
      `}</style>

      {/* 1. HEADER / HERO */}
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-8 pt-6 pb-0">
          <button
            type="button"
            id="back-btn"
            data-fallback-href={`/onlinecourse/${course.course_code}`}
            className="focus-ring inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors mb-6 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg"
          >
            <ArrowLeft size={16} /> Back
          </button>

          <h1 className="text-3xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-3 leading-tight">
            &quot;{course.title}&quot; <span className="block md:inline text-orange-500">Syllabus</span>
          </h1>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-4">
            {count > 0 ? (
              <div className="flex items-center gap-2">
                <StarRating value={avg} size={18} animate />
                <span className="font-bold text-slate-900">{avg}</span>
                <span className="text-slate-500 text-sm">
                  ({count} review{count === 1 ? '' : 's'})
                </span>
              </div>
            ) : (
              <span className="text-slate-400 text-sm italic">No reviews yet — be the first</span>
            )}

            {showUpcomingBatch && startDate && (
              <span className="flex items-center gap-1.5 bg-orange-50 text-orange-700 px-3 py-1 rounded-full text-xs font-semibold">
                <CalendarClock size={14} />
                Next batch: {startDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-slate-600">
            {course.difficulty_level && (
              <span className="flex items-center gap-1.5 bg-slate-100 px-3 py-1 rounded-full text-slate-700">
                <BarChart size={16} className="text-teal-600" />
                {course.difficulty_level}
              </span>
            )}
            <span className="flex items-center gap-1.5 bg-slate-100 px-3 py-1 rounded-full text-slate-700">
              <Clock size={16} className="text-teal-600" />
              {course.duration}
            </span>
          </div>

          <nav className="flex gap-8 text-sm font-semibold border-t border-slate-100 pt-4 mt-6 overflow-x-auto">
            <a href="#overview-section" data-target="overview-section" className="nav-link focus-ring pb-4 transition-colors whitespace-nowrap">
              Overview
            </a>
            <a href="#syllabus-section" data-target="syllabus-section" className="nav-link focus-ring pb-4 transition-colors whitespace-nowrap">
              Syllabus
            </a>
            <a href="#reviews-section" data-target="reviews-section" className="nav-link focus-ring pb-4 transition-colors whitespace-nowrap">
              Reviews
            </a>
            <a href="#instructor-section" data-target="instructor-section" className="nav-link focus-ring pb-4 transition-colors whitespace-nowrap">
              Instructor
            </a>
          </nav>
        </div>
      </header>

      {/* 2. TOP LAYOUT */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 mt-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* LEFT COLUMN */}
          <div className="w-full lg:w-[65%] space-y-8">
            <section id="overview-section" className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8 scroll-mt-28">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">What you will learn?</h2>
              <p className="text-slate-600 leading-relaxed mb-8 text-lg whitespace-pre-wrap">
                {course.description || 'No description provided.'}
              </p>

              {course.learning_outcomes && Array.isArray(course.learning_outcomes) && course.learning_outcomes.length > 0 && (
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-4">Learning Outcomes</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {course.learning_outcomes.map((outcome, idx) => (
                      <div key={idx} className="flex items-start gap-3 text-slate-600">
                        <CheckCircle size={20} className="text-teal-600 shrink-0 mt-0.5" />
                        <span className="text-sm leading-relaxed">{outcome}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {moduleAnchors.length > 1 && (
                <div className="mt-8 pt-6 border-t border-slate-100">
                  <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                    <ListChecks size={16} className="text-teal-600" /> Jump to a module
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {moduleAnchors.map((m, i) => (
                      <a
                        key={m.id}
                        href={`#${m.id}`}
                        className="focus-ring text-xs font-medium bg-slate-100 hover:bg-teal-50 hover:text-teal-700 text-slate-600 px-3 py-1.5 rounded-full transition-colors"
                      >
                        {i + 1}. {m.title}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </section>

            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center gap-5 relative overflow-hidden">
              <div className="absolute -top-4 -right-4 opacity-[0.04] pointer-events-none">
                <BookOpen size={140} />
              </div>
              <div className="bg-emerald-500 text-white p-3 rounded-xl shrink-0 relative z-10 shadow-sm">
                <CheckCircle size={26} />
              </div>
              <div className="relative z-10 flex-1">
                <h3 className="text-emerald-950 font-bold text-lg mb-1">Lifetime Access Included</h3>
                <p className="text-emerald-800 text-sm leading-relaxed">
                  All class recordings and study materials provided during the course are valid for lifetime access. Need more info?
                </p>
              </div>
              <a
                href="https://wa.me/9763695665"
                target="_blank"
                rel="noopener noreferrer"
                className="focus-ring inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white px-5 py-3 rounded-xl text-sm font-bold transition-all shadow-sm shrink-0 relative z-10 hover:-translate-y-0.5"
              >
                <MessageCircle size={18} />
                WhatsApp Us
              </a>
            </div>

            <section id="syllabus-section" className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden scroll-mt-28">
              <div className="bg-slate-900 px-6 py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <BookOpen size={24} className="text-teal-400 shrink-0" />
                  <h2 className="text-xl font-bold text-white leading-tight">
                    {course.title} <span className="text-orange-500">Day-wise Syllabus</span>
                  </h2>
                </div>

                <button
                  id="download-pdf-btn"
                  data-html={encodeURIComponent(htmlContent)}
                  data-filename={`${course.title.replace(/\s+/g, '_')}_Syllabus.pdf`}
                  className="focus-ring inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-500 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors shrink-0 cursor-pointer disabled:opacity-50"
                >
                  <span className="spinner" aria-hidden="true" />
                  <Download size={18} className="download-icon" />
                  <span id="download-btn-text">Download PDF</span>
                </button>
              </div>

              <div className="p-6 md:p-8">
                {hasSections ? (
                  <div className="space-y-4">
                    {syllabusData!.sections.map((section, sIdx) => (
                      <details
                        key={sIdx}
                        id={moduleAnchors[sIdx]?.id}
                        className="syllabus-module group scroll-mt-28 border border-slate-100 rounded-xl overflow-hidden"
                        open={sIdx === 0}
                      >
                        <summary className="focus-ring flex items-center justify-between gap-3 bg-slate-50 hover:bg-slate-100 transition-colors px-5 py-4">
                          <span className="flex items-center gap-3 text-left">
                            <span className="bg-slate-900 text-white text-xs px-2 py-1 rounded shrink-0">Part {sIdx + 1}</span>
                            <span className="text-base font-bold text-slate-900">{section.title}</span>
                            <span className="text-xs text-slate-400 hidden sm:inline">
                              ({section.days.length} day{section.days.length === 1 ? '' : 's'})
                            </span>
                          </span>
                          <ChevronDown size={20} className="accordion-chevron text-slate-500 shrink-0" aria-hidden="true" />
                        </summary>

                        <div className="px-5 pb-6 pt-2">
                          <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 md:before:ml-[1.125rem] before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-slate-200 before:to-slate-100">
                            {section.days.map((day, dIdx) => (
                              <div key={dIdx} className="relative flex items-start gap-4 md:gap-6 group/day">
                                <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-teal-50 text-teal-700 shadow-sm shrink-0 z-10 font-bold text-sm">
                                  D{day.day}
                                </div>

                                <div className="day-card flex-1 bg-slate-50 p-5 rounded-xl border border-slate-100">
                                  <h4 className="text-md font-bold text-slate-900 mb-3 leading-snug">
                                    Day {day.day}: {day.title}
                                  </h4>
                                  <ul className="space-y-2">
                                    {day.topics.map((topic, tIdx) => (
                                      <li key={tIdx} className="text-sm text-slate-600 flex items-start gap-2">
                                        <span className="text-teal-500 mt-0.5">•</span>
                                        <span className="leading-relaxed">{topic}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </details>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <BookOpen size={40} className="mx-auto text-slate-300 mb-3" aria-hidden="true" />
                    <p className="text-slate-500 font-medium">Detailed syllabus will be uploaded shortly.</p>
                    <p className="text-slate-400 text-sm mt-1">Check back soon, or message us on WhatsApp for the full outline.</p>
                  </div>
                )}
              </div>
            </section>

            {/* REVIEWS SECTION — pulled live from public.reviews */}
            <section id="reviews-section" className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8 scroll-mt-28">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <h2 className="text-2xl font-bold text-slate-900">Student Reviews</h2>
                {count > 0 && (
                  <div className="flex items-center gap-2">
                    <StarRating value={avg} />
                    <span className="text-sm font-semibold text-slate-700">{avg} / 5</span>
                  </div>
                )}
              </div>

              {count > 0 && (
                <div className="mb-8 overflow-x-auto rounded-xl border border-slate-100">
                  <table className="w-full text-sm">
                    <caption className="sr-only">Rating breakdown across all {count} reviews</caption>
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
                        <th scope="col" className="text-left font-semibold px-4 py-3">
                          Category
                        </th>
                        <th scope="col" className="text-left font-semibold px-4 py-3 w-1/2">
                          Rating
                        </th>
                        <th scope="col" className="text-right font-semibold px-4 py-3">
                          Score
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {[
                        { label: 'Tutor', value: tutorAvg },
                        { label: 'Content', value: contentAvg },
                        { label: 'Materials', value: materialsAvg },
                        { label: 'Skill Improvement', value: skillAvg },
                      ].map(cat => (
                        <tr key={cat.label}>
                          <td className="px-4 py-3 font-medium text-slate-700 whitespace-nowrap">{cat.label}</td>
                          <td className="px-4 py-3">
                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden max-w-[200px]">
                              <div
                                className="rating-bar-fill h-full bg-teal-500 rounded-full"
                                style={{ ['--target-width' as any]: `${(cat.value / 5) * 100}%` }}
                              />
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-slate-900 whitespace-nowrap">
                            {cat.value || '–'} / 5
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-slate-50/60">
                        <td className="px-4 py-3 font-bold text-slate-900 whitespace-nowrap">Overall</td>
                        <td className="px-4 py-3">
                          <div className="h-2 bg-slate-200 rounded-full overflow-hidden max-w-[200px]">
                            <div
                              className="rating-bar-fill h-full bg-orange-500 rounded-full"
                              style={{ ['--target-width' as any]: `${(avg / 5) * 100}%` }}
                            />
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-slate-900 whitespace-nowrap">{avg || '–'} / 5</td>
                      </tr>
                    </tbody>
                  </table>
                  <p className="text-xs text-slate-400 px-4 py-2 bg-slate-50 border-t border-slate-100">
                    Based on all {count} approved review{count === 1 ? '' : 's'}.
                  </p>
                </div>
              )}

              {reviews.length === 0 ? (
                <div className="text-center py-12">
                  <MessagesSquare size={40} className="mx-auto text-slate-300 mb-3" aria-hidden="true" />
                  <p className="text-slate-500 font-medium">No reviews yet.</p>
                  <p className="text-slate-400 text-sm mt-1">Be the first to share your experience after completing this course.</p>
                </div>
              ) : (
                <>
                  <div className="flex flex-wrap gap-2 mb-5" role="group" aria-label="Sort reviews">
                    <button type="button" className="sort-btn focus-ring text-xs font-semibold px-3 py-1.5 rounded-full border border-slate-200 text-slate-600 transition-colors" data-sort="recent" data-active="true">
                      Most Recent
                    </button>
                    <button type="button" className="sort-btn focus-ring text-xs font-semibold px-3 py-1.5 rounded-full border border-slate-200 text-slate-600 transition-colors" data-sort="rating" data-active="false">
                      Highest Rated
                    </button>
                    <button type="button" className="sort-btn focus-ring text-xs font-semibold px-3 py-1.5 rounded-full border border-slate-200 text-slate-600 transition-colors" data-sort="recommended" data-active="false">
                      Recommended First
                    </button>
                  </div>

                  <div id="reviews-grid" className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {reviews.map((r, idx) => (
                      <div
                        key={r.id}
                        className={`bg-slate-50 border border-slate-100 rounded-xl p-5 ${idx >= 5 ? 'review-hidden' : ''}`}
                        data-rating={r.overall_rating ?? 0}
                        data-date={new Date(r.created_at).getTime()}
                        data-recommend={r.would_recommend === 'Yes' ? 1 : 0}
                      >
                        <div className="flex items-center justify-between mb-2 gap-2">
                          <div className="flex items-center gap-2">
                            {typeof r.overall_rating === 'number' && <StarRating value={r.overall_rating} size={14} />}
                            <span className="text-sm font-semibold text-slate-700">{r.name || 'Anonymous'}</span>
                          </div>
                          {r.would_recommend === 'Yes' && (
                            <span className="flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full shrink-0">
                              <BadgeCheck size={12} aria-hidden="true" /> Recommends
                            </span>
                          )}
                        </div>
                        {r.testimonial && <p className="text-sm text-slate-600 leading-relaxed mb-2">{r.testimonial}</p>}
                        {r.liked_most && <p className="text-xs text-teal-700 font-medium">Liked most: {r.liked_most}</p>}
                      </div>
                    ))}
                  </div>

                  {reviews.length > 5 && (
                    <div className="flex justify-center mt-6">
                      <button
                        type="button"
                        id="reviews-toggle-btn"
                        data-expanded="false"
                        data-total={reviews.length}
                        className="focus-ring text-sm font-semibold text-teal-700 hover:text-teal-800 bg-teal-50 hover:bg-teal-100 px-5 py-2.5 rounded-full transition-colors"
                      >
                        Show all {reviews.length} reviews
                      </button>
                    </div>
                  )}
                </>
              )}
            </section>
          </div>

          {/* RIGHT COLUMN */}
          <aside className="w-full lg:w-[35%] space-y-6">
            <div className="sticky top-28 space-y-6">
              {embedUrl && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="p-4 border-b border-slate-100 flex items-center gap-2">
                    <PlayCircle size={20} className="text-teal-600" />
                    <h3 className="font-bold text-slate-900">Course Preview</h3>
                  </div>
                  <div className="relative aspect-video w-full bg-slate-900">
                    <iframe
                      src={embedUrl}
                      title="Course Demo Video"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="absolute top-0 left-0 w-full h-full"
                    />
                  </div>
                </div>
              )}

              <div id="instructor-section" className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden scroll-mt-28">
                <div className="p-6">
                  <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
                    <User size={20} className="text-slate-400" />
                    Course Instructor
                  </h3>

                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-20 h-20 rounded-full bg-slate-100 overflow-hidden shrink-0 border-2 border-teal-100">
                      {course.tutor_pic_url ? (
                        <img src={course.tutor_pic_url} alt={displayTutorName} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400 bg-slate-50">
                          <User size={32} />
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="text-lg font-bold text-slate-900">{displayTutorName}</h4>
                        <span className="flex items-center gap-1 text-[10px] font-semibold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded-full">
                          <BadgeCheck size={11} aria-hidden="true" /> Verified
                        </span>
                      </div>
                      <p className="text-sm font-medium text-teal-700 mb-1">{displayTutorDesignation}</p>
                      {tutorAvg > 0 && (
                        <div className="flex items-center gap-1.5 mt-1">
                          <StarRating value={tutorAvg} size={12} />
                          <span className="text-xs text-slate-500">{tutorAvg} instructor rating</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <p className="text-sm text-slate-600 leading-relaxed mb-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
                    {course.tutor_bio || 'Biography details are currently being updated.'}
                  </p>

                  {displaySignature && (
                    <div className="mt-4 pt-4 border-t border-slate-100 flex justify-end">
                      <img
                        src={displaySignature}
                        alt={`${displayTutorName} Signature`}
                        className="h-10 opacity-70 mix-blend-multiply"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>

      {/* MOBILE STICKY CTA BAR */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 shadow-[0_-4px_12px_rgba(0,0,0,0.05)] px-4 py-3">
        <a
          href="https://wa.me/9763695665"
          target="_blank"
          rel="noopener noreferrer"
          className="focus-ring flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white px-5 py-3 rounded-xl text-sm font-bold transition-colors w-full"
        >
          <MessageCircle size={18} />
          Enroll / Ask a Question
        </a>
      </div>

      {/* --- NEXT.JS NATIVE SCRIPTS --- */}
      <Script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js" strategy="lazyOnload" />

      <Script id="page-interactivity" strategy="afterInteractive">
        {`
          if (typeof window !== 'undefined') {
            document.documentElement.style.scrollBehavior = 'smooth';

            var reviewsExpanded = false;

            function applyReviewVisibility() {
              var grid = document.getElementById('reviews-grid');
              if (!grid) return;
              var cards = Array.prototype.slice.call(grid.children);
              cards.forEach(function (card, idx) {
                if (reviewsExpanded || idx < 5) {
                  card.classList.remove('review-hidden');
                } else {
                  card.classList.add('review-hidden');
                }
              });
            }

            // --- Back button: real referrer, sensible fallback ---
            document.addEventListener('click', function (e) {
              var backBtn = e.target.closest('#back-btn');
              if (backBtn) {
                e.preventDefault();
                var cameFromSameSite = document.referrer && document.referrer.indexOf(window.location.host) !== -1;
                if (cameFromSameSite && window.history.length > 1) {
                  window.history.back();
                } else {
                  window.location.href = backBtn.getAttribute('data-fallback-href');
                }
                return;
              }

              // --- PDF download with spinner state ---
              var btn = e.target.closest('#download-pdf-btn');
              if (btn) {
                e.preventDefault();
                if (btn.classList.contains('is-loading')) return;

                var btnText = document.getElementById('download-btn-text');
                var originalText = btnText ? btnText.innerText : 'Download PDF';
                if (btnText) btnText.innerText = 'Generating...';
                btn.classList.add('is-loading');
                btn.style.opacity = '0.85';
                btn.style.pointerEvents = 'none';

                var tryGeneratePDF = function () {
                  if (window.html2pdf) {
                    var element = document.createElement('div');
                    // Content passed through generateSyllabusHTML(), which HTML-escapes
                    // every DB-sourced field before it reaches this innerHTML assignment.
                    element.innerHTML = decodeURIComponent(btn.getAttribute('data-html'));

                    window.html2pdf().set({
                      margin: [15, 15, 30, 15],
                      filename: btn.getAttribute('data-filename'),
                      image: { type: 'jpeg', quality: 1 },
                      html2canvas: { scale: 2, useCORS: true, scrollY: 0 },
                      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
                      pagebreak: { mode: ['css', 'legacy'], avoid: ['.pdf-avoid-break', 'li', 'ul'] }
                    }).from(element).save().then(function () {
                      if (btnText) btnText.innerText = originalText;
                      btn.classList.remove('is-loading');
                      btn.style.opacity = '1';
                      btn.style.pointerEvents = 'auto';
                    });
                  } else {
                    setTimeout(tryGeneratePDF, 200);
                  }
                };

                tryGeneratePDF();
              }

              // --- Review sort buttons ---
              var sortBtn = e.target.closest('.sort-btn');
              if (sortBtn) {
                var mode = sortBtn.getAttribute('data-sort');
                var grid = document.getElementById('reviews-grid');
                if (grid) {
                  var cards = Array.prototype.slice.call(grid.children);
                  cards.sort(function (a, b) {
                    if (mode === 'rating') {
                      return parseFloat(b.getAttribute('data-rating')) - parseFloat(a.getAttribute('data-rating'));
                    }
                    if (mode === 'recommended') {
                      var recDiff = parseInt(b.getAttribute('data-recommend')) - parseInt(a.getAttribute('data-recommend'));
                      if (recDiff !== 0) return recDiff;
                      return parseFloat(b.getAttribute('data-date')) - parseFloat(a.getAttribute('data-date'));
                    }
                    return parseFloat(b.getAttribute('data-date')) - parseFloat(a.getAttribute('data-date'));
                  });
                  cards.forEach(function (card) { grid.appendChild(card); });
                }
                document.querySelectorAll('.sort-btn').forEach(function (b) { b.setAttribute('data-active', 'false'); });
                sortBtn.setAttribute('data-active', 'true');
                applyReviewVisibility();
              }

              // --- Reviews show all / show less toggle ---
              var toggleBtn = e.target.closest('#reviews-toggle-btn');
              if (toggleBtn) {
                reviewsExpanded = !reviewsExpanded;
                var total = toggleBtn.getAttribute('data-total');
                toggleBtn.setAttribute('data-expanded', reviewsExpanded ? 'true' : 'false');
                toggleBtn.textContent = reviewsExpanded ? 'Show less' : 'Show all ' + total + ' reviews';
                applyReviewVisibility();
                if (!reviewsExpanded) {
                  var section = document.getElementById('reviews-section');
                  if (section) section.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
              }
            });

            applyReviewVisibility();

            // --- Scroll-spy for sticky nav ---
            var navLinks = Array.prototype.slice.call(document.querySelectorAll('.nav-link'));
            var sections = navLinks
              .map(function (l) { return document.getElementById(l.getAttribute('data-target')); })
              .filter(Boolean);

            if ('IntersectionObserver' in window && sections.length) {
              var spyObserver = new IntersectionObserver(
                function (entries) {
                  entries.forEach(function (entry) {
                    if (entry.isIntersecting) {
                      navLinks.forEach(function (l) { l.classList.remove('nav-active'); });
                      var match = navLinks.find(function (l) { return l.getAttribute('data-target') === entry.target.id; });
                      if (match) match.classList.add('nav-active');
                    }
                  });
                },
                { rootMargin: '-45% 0px -50% 0px', threshold: 0 }
              );
              sections.forEach(function (s) { spyObserver.observe(s); });
            }

            // --- Reveal-on-scroll for stars and rating bars ---
            if ('IntersectionObserver' in window) {
              var revealObserver = new IntersectionObserver(
                function (entries, obs) {
                  entries.forEach(function (entry) {
                    if (entry.isIntersecting) {
                      entry.target.classList.add('in-view');
                      obs.unobserve(entry.target);
                    }
                  });
                },
                { threshold: 0.4 }
              );
              document.querySelectorAll('.stars-animate, .rating-bar-fill').forEach(function (el) {
                revealObserver.observe(el);
              });
            }
          }
        `}
      </Script>
    </div>
  );
}