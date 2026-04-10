import React from 'react';
import Link from 'next/link';
import Script from 'next/script';
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
  MessageCircle
} from 'lucide-react';

// --- DATABASE SETUP ---
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// --- TYPES ---
interface TopicDay {
  day: number;
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
}

interface Course {
  id: string;
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
  syllabus: SyllabusData | any | null; 
  tutor_id?: number | null; 
  tutor_name: string | null;
  tutor_pic_url: string | null;
  tutor_bio: string | null;
}

// --- HELPER FUNCTIONS ---
function getYouTubeEmbedUrl(url: string | null) {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) 
    ? `https://www.youtube.com/embed/${match[2]}?rel=0&modestbranding=1` 
    : null;
}

// --- REAL DATA FETCHING ---
async function getCourseAndTutorData(id: string): Promise<{ course: Course | null, tutor: Tutor | null }> {
  
  const { data: courseData, error: courseError } = await supabase
    .from('online-courses')
    .select('*')
    .eq('tutor_id', id)
    .limit(1)
    .single();

  if (courseError || !courseData) {
    console.error("Failed to fetch course data by tutor_id:", courseError?.message);
    return { course: null, tutor: null };
  }

  const { data: tutorData, error: tutorError } = await supabase
    .from('online_tutors')
    .select('*')
    .eq('id', id)
    .single();

  if (tutorError) {
    console.error("Failed to fetch tutor data:", tutorError?.message);
  }

  return { course: courseData as Course, tutor: tutorData };
}

// --- GENERATE HTML CONTENT FOR PDF COMPILER ---
function generateSyllabusHTML(
  course: Course, 
  syllabusData: SyllabusData | null,
  tutorName: string,
  tutorDesignation: string,
  tutorSignature: string | null | undefined
) {
  let htmlSyllabusContent = '';

  if (syllabusData && syllabusData.sections) {
    syllabusData.sections.forEach(section => {
      htmlSyllabusContent += `<div class="pdf-avoid-break" style="page-break-inside: avoid; break-inside: avoid;"><h3 style="color: #0f172a; border-bottom: 2px solid #cbd5e1; padding-bottom: 5px; margin-top: 25px; font-size: 18px;">${section.title}</h3></div>`;
      section.days.forEach(day => {
        htmlSyllabusContent += `
          <div class="pdf-avoid-break" style="margin-bottom: 15px; padding-left: 15px; border-left: 3px solid #0d9488; page-break-inside: avoid; break-inside: avoid;">
            <h4 style="margin: 0 0 5px 0; color: #334155; font-size: 16px;">Day ${day.day}: ${day.title}</h4>
            <ul style="margin: 0; padding-left: 20px; color: #475569; font-size: 14px;">
              ${day.topics.map(topic => `<li style="margin-bottom: 4px; page-break-inside: avoid; break-inside: avoid;">${topic}</li>`).join('')}
            </ul>
          </div>
        `;
      });
    });
  } else {
    htmlSyllabusContent = `<p>No syllabus data available.</p>`;
  }

  const signatureHtml = `
    <div class="pdf-avoid-break" style="margin-top: 50px; text-align: right; page-break-inside: avoid; break-inside: avoid;">
      ${tutorSignature ? `<img src="${tutorSignature}" alt="Signature" style="max-height: 60px; display: inline-block; margin-bottom: 10px;" crossorigin="anonymous" /><br/>` : ''}
      <span style="font-weight: bold; color: #0f172a; font-size: 16px; display: block;">${tutorName}</span>
      <span style="color: #475569; font-size: 14px; display: block;">${tutorDesignation}</span>
    </div>
  `;

  return `
    <div style="font-family: 'Helvetica Neue', Arial, sans-serif; color: #333; line-height: 1.5; padding: 0px; background: #ffffff;">
        <div style="text-align: center; border-bottom: 2px solid #eee; padding-bottom: 15px; margin-bottom: 20px;">
            <img style="height: 140px; margin: 0 auto 15px auto; display: block;" src="https://zuktarghyexwodqnnxlu.supabase.co/storage/v1/object/public/others/GyanHub_logo_website-removebg-preview__1_-removebg-preview.webp" alt="Company Logo" crossorigin="anonymous" />
            <h1 style="margin: 0 0 10px 0; color: #0f172a; font-size: 24px;">"${course.title}"</h1>
            <p style="color: #0d9488; font-weight: bold; margin: 0; font-size: 14px;">Course Duration: ${course.duration}</p>
        </div>
        <div style="padding: 5px 0;">
            ${htmlSyllabusContent}
            ${signatureHtml}
        </div>
    </div>`;
}

// --- MAIN PAGE COMPONENT ---
export default async function CourseSyllabusPage({ params }: { params: { id: string } }) {
  const resolvedParams = await params;
  const { course, tutor } = await getCourseAndTutorData(resolvedParams.id);

  if (!course) {
    notFound();
  }

  const embedUrl = getYouTubeEmbedUrl(course.demo_video_url);

  const displayTutorName = tutor?.name || course.tutor_name || "Instructor Name TBD";
  const displayTutorDesignation = tutor?.designation || "Course Tutor";
  const displaySignature = tutor?.signature_url;
  
  const syllabusData = course.syllabus as SyllabusData | null;
  const hasSections = syllabusData?.sections && Array.isArray(syllabusData.sections) && syllabusData.sections.length > 0;

  const htmlContent = generateSyllabusHTML(course, syllabusData, displayTutorName, displayTutorDesignation, displaySignature);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 font-sans pb-24">
      
      {/* 1. HEADER / HERO */}
      <header className="bg-white border-b border-slate-200 pt-6 pb-0 px-4 md:px-8 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto">
          <Link 
            href=".." 
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors mb-6 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg"
          >
            <ArrowLeft size={16} /> Back to Courses
          </Link>

          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight mb-4">
            &quot;{course.title}&quot; <span className="text-orange-500">Syllabus Page</span>
          </h1>
          
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

          <nav className="flex gap-8 text-sm font-semibold text-slate-500 border-t border-slate-100 pt-4 mt-6">
            <a href="#syllabus-section" className="text-slate-900 border-b-2 border-slate-900 pb-3 hover:text-slate-900 transition-colors">Overview</a>
            <a href="#instructor-section" className="hover:text-slate-900 pb-3 transition-colors">Instructor</a>
          </nav>
        </div>
      </header>

      {/* 2. TOP LAYOUT */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 mt-8">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* LEFT COLUMN */}
          <div className="w-full lg:w-[65%] space-y-8">
            
            <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8">
              <h2 className="text-xl font-bold text-slate-900 mb-4">What you will learn?</h2>
              <p className="text-slate-600 leading-relaxed mb-8 text-lg whitespace-pre-wrap">
                {course.description || "No description provided."}
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
                className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white px-5 py-3 rounded-xl text-sm font-bold transition-all shadow-sm shrink-0 relative z-10 hover:-translate-y-0.5"
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
                  className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-500 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors shrink-0 cursor-pointer disabled:opacity-50"
                >
                  <Download size={18} />
                  <span id="download-btn-text">Download PDF</span>
                </button>
              </div>
              
              <div className="p-6 md:p-8">
                {hasSections ? (
                  <div className="space-y-10">
                    {syllabusData.sections.map((section, sIdx) => (
                      <div key={sIdx}>
                        <h3 className="text-lg font-bold text-slate-900 border-b-2 border-slate-100 pb-3 mb-6 flex items-center gap-2">
                          <span className="bg-slate-900 text-white text-xs px-2 py-1 rounded">Part {sIdx + 1}</span>
                          {section.title}
                        </h3>
                        
                        <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 md:before:ml-[1.125rem] before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-slate-200 before:to-slate-100">
                          {section.days.map((day, dIdx) => (
                            <div key={dIdx} className="relative flex items-start gap-4 md:gap-6 group">
                              <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-teal-50 text-teal-700 shadow-sm shrink-0 z-10 font-bold text-sm">
                                D{day.day}
                              </div>
                              
                              <div className="flex-1 bg-slate-50 p-5 rounded-xl border border-slate-100 hover:shadow-md transition-shadow">
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
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500 italic text-center py-8">
                    Detailed syllabus will be uploaded shortly.
                  </p>
                )}
              </div>
            </section>
          </div>

          {/* RIGHT COLUMN */}
          <aside className="w-full lg:w-[35%] space-y-6">
            <div className="sticky top-24 space-y-6">
              
              {embedUrl && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="p-4 border-b border-slate-100 flex items-center gap-2">
                    <PlayCircle size={20} className="text-red-500" />
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
                    <div className="w-16 h-16 rounded-full bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
                      {course.tutor_pic_url ? (
                        <img 
                          src={course.tutor_pic_url} 
                          alt={displayTutorName} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400 bg-slate-50">
                          <User size={32} />
                        </div>
                      )}
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-slate-900">
                        {displayTutorName}
                      </h4>
                      <p className="text-sm font-medium text-teal-700 mb-1">
                        {displayTutorDesignation}
                      </p>
                    </div>
                  </div>

                  <p className="text-sm text-slate-600 leading-relaxed mb-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
                    {course.tutor_bio || "Biography details are currently being updated."}
                  </p>

                  {/* INSTRUCTOR SIGNATURE RENDERED HERE */}
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

      {/* --- NEXT.JS NATIVE SCRIPTS --- */}
      {/* Loads the library safely across navigations */}
      <Script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js" strategy="lazyOnload" />
      
      {/* Inline Script utilizing Event Delegation for Next.js SPA architecture */}
      <Script id="pdf-download-handler" strategy="afterInteractive">
        {`
          if (typeof window !== 'undefined') {
            document.documentElement.style.scrollBehavior = 'smooth';

            // Use event delegation to persist logic across Next.js navigations
            document.addEventListener('click', function(e) {
              var btn = e.target.closest('#download-pdf-btn');
              if (btn) {
                e.preventDefault();
                var btnText = document.getElementById('download-btn-text');
                
                // Prevent multiple clicks
                if (btnText && btnText.innerText === 'Generating PDF...') return;
                
                var originalText = btnText ? btnText.innerText : 'Download PDF';
                if (btnText) btnText.innerText = 'Generating PDF...';
                
                btn.style.opacity = '0.5';
                btn.style.pointerEvents = 'none';

                var tryGeneratePDF = function() {
                  if (window.html2pdf) {
                    var element = document.createElement('div');
                    element.innerHTML = decodeURIComponent(btn.getAttribute('data-html'));
                    
                    window.html2pdf().set({
                      margin: [15, 15, 30, 15], 
                      filename: btn.getAttribute('data-filename'),
                      image: { type: 'jpeg', quality: 1 },
                      html2canvas: { scale: 2, useCORS: true, scrollY: 0 }, 
                      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
                      pagebreak: { mode: ['css', 'legacy'], avoid: ['.pdf-avoid-break', 'li', 'ul'] } 
                    }).from(element).save().then(function() {
                      if (btnText) btnText.innerText = originalText;
                      btn.style.opacity = '1';
                      btn.style.pointerEvents = 'auto';
                    });
                  } else {
                    // Retry if script hasn't finished loading yet
                    setTimeout(tryGeneratePDF, 200);
                  }
                };
                
                tryGeneratePDF();
              }
            });
          }
        `}
      </Script>
    </div>
  );
}