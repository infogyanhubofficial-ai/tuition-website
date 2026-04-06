import React from "react";
import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/client"; 
import { 
  PlayCircle, Clock, CheckCircle2, ShoppingCart, 
  ExternalLink, BarChart, BookOpen, ShieldCheck, 
  Video, Infinity, Award, ChevronDown, HelpCircle, FileText
} from "lucide-react";

// --- STRICT TYPES ---
interface RecordingCourse {
  id: string;
  course_name: string;
  category: string | null;
  difficulty_level: string | null;
  description: string | null;
  course_hours: string;
  standard_fee: number | string;
  discount: number | null;
  cover_pic_url: string | null;
  demo_video_url: string | null;
  syllabus_url: string | null;
  learning_outcomes: any;
  faqs: any;
  is_active: boolean | null;
}

interface PageProps {
  params: Promise<{ courseName: string }> | { courseName: string };
}

// --- UTILITY FUNCTIONS ---
const formatCurrency = (amount: number | string) => {
  const num = Number(amount) || 0;
  return new Intl.NumberFormat('en-NP', { style: 'currency', currency: 'NPR', maximumFractionDigits: 0 }).format(num);
};

const calculateSalePrice = (fee: number | string, discount: number | null) => {
  const numericFee = Number(fee) || 0;
  const activeDiscount = Number(discount) || 0;
  return numericFee - (numericFee * activeDiscount / 100);
};

const getLearningOutcomes = (data: any): string[] => {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (typeof data === 'object' && Array.isArray(data.learning_outcomes)) {
    return data.learning_outcomes;
  }
  return [];
};

const getFaqs = (data: any): { question: string; answer: string }[] => {
  if (!data) return [];
  const arr = Array.isArray(data) ? data : (data.faqs && Array.isArray(data.faqs) ? data.faqs : []);
  return arr.filter((item: any) => item && typeof item.question === 'string' && typeof item.answer === 'string');
};

const getYouTubeEmbedUrl = (url: string | null) => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? `https://www.youtube.com/embed/${match[2]}?autoplay=0&rel=0` : null;
};

const parseDescription = (desc: string | null) => {
  if (!desc) return [];
  return desc.split('\n')
    .map(line => line.replace(/✔️/g, '').trim())
    .filter(line => line.length > 0);
};

// --- DATA FETCHING ---
async function getCourse(rawCourseName: string): Promise<RecordingCourse | null> {
  const supabase = createClient();
  
  let searchName = rawCourseName;
  try {
    searchName = decodeURIComponent(rawCourseName);
  } catch (e) {
    // String is already fully decoded
  }

  const { data, error } = await supabase
    .from("recordings")
    .select("*")
    .ilike("course_name", searchName)
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  return data as RecordingCourse;
}

// --- DYNAMIC SEO METADATA ---
export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const resolvedParams = await props.params;
  const course = await getCourse(resolvedParams.courseName);

  if (!course) {
    return { title: 'Course Not Found' };
  }

  const plainDescription = course.description 
    ? course.description.replace(/✔️|\n/g, ' ').substring(0, 160) + '...'
    : `Enroll in ${course.course_name} today.`;

  return {
    title: `${course.course_name} | Premium Recording`,
    description: plainDescription,
    openGraph: {
      title: course.course_name,
      description: plainDescription,
      images: course.cover_pic_url ? [{ url: course.cover_pic_url }] : [],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: course.course_name,
      description: plainDescription,
      images: course.cover_pic_url ? [course.cover_pic_url] : [],
    }
  };
}

// --- MAIN SERVER COMPONENT ---
export default async function RecordingDetailPage(props: PageProps) {
  const resolvedParams = await props.params;
  const course = await getCourse(resolvedParams.courseName);

  if (!course) {
    notFound();
  }

  const extractedOutcomes = getLearningOutcomes(course.learning_outcomes);
  const extractedFaqs = getFaqs(course.faqs);
  const activeDiscount = course.discount || 0;
  const salePrice = calculateSalePrice(course.standard_fee, activeDiscount);
  
  const orderUrl = `/order?type=recording&courseId=${course.id}&courseName=${encodeURIComponent(course.course_name)}&price=${salePrice}&cover=${encodeURIComponent(course.cover_pic_url || '')}`;

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-blue-100 pb-20">
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Link href="/recording" className="text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors flex items-center gap-1">
           &larr; Back to all recordings
        </Link>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-[28px] shadow-xl border border-slate-200/60 overflow-hidden flex flex-col md:flex-row">
          
          <div className="w-full md:w-[65%] flex flex-col">
            
            <div className="w-full aspect-video bg-slate-900 relative flex-shrink-0">
              {course.demo_video_url ? (
                <iframe 
                  src={getYouTubeEmbedUrl(course.demo_video_url) || ''} 
                  className="w-full h-full absolute inset-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                  allowFullScreen
                ></iframe>
              ) : (
                <img src={course.cover_pic_url || "/api/placeholder/800/450"} alt={`${course.course_name} Cover`} className="w-full h-full object-cover" />
              )}
            </div>

            <div className="p-6 md:p-10 flex-grow">
              <div className="flex flex-wrap gap-2 mb-5">
                {course.category && (
                  <span className="bg-blue-50 border border-blue-100 text-blue-700 text-xs font-bold px-3 py-1.5 rounded-[10px]">
                    {course.category}
                  </span>
                )}
                {course.difficulty_level && (
                  <span className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 text-slate-600 text-xs font-bold px-3 py-1.5 rounded-[10px]">
                    <BarChart size={14} className="stroke-[2] text-slate-400"/> {course.difficulty_level}
                  </span>
                )}
              </div>

              <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-slate-900 mb-8 tracking-tight leading-tight">
                {course.course_name}
              </h1>

              {course.description && (
                <div className="bg-slate-50 border border-slate-100 rounded-[20px] p-6 mb-10">
                  <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-widest mb-5">Included in this recording</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8">
                    {parseDescription(course.description).map((feature, idx) => (
                      <div key={idx} className="flex items-start gap-3">
                        <CheckCircle2 size={18} className="text-emerald-500 flex-shrink-0 mt-0.5 stroke-[2]" />
                        <span className="text-sm text-slate-600 font-medium leading-relaxed">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {extractedOutcomes.length > 0 && (
                <div className="mb-4">
                  <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                    <Award size={22} className="text-blue-600" /> What you will learn
                  </h2>
                  <ul className="space-y-4">
                    {extractedOutcomes.map((outcome, idx) => (
                      <li key={idx} className="flex gap-4 p-5 bg-white border border-slate-100 shadow-sm rounded-[20px]">
                        <div className="bg-blue-50 text-blue-600 font-extrabold h-8 w-8 rounded-[10px] flex items-center justify-center flex-shrink-0 text-sm">
                          {idx + 1}
                        </div>
                        <p className="text-slate-600 text-sm leading-relaxed pt-1.5">{outcome}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

            </div>
          </div>

          <div className="w-full md:w-[35%] bg-slate-50/80 border-t md:border-t-0 md:border-l border-slate-200 flex flex-col">
            <div className="p-6 md:p-10 sticky top-6">
              
              <div className="mb-8">
                {activeDiscount > 0 && (
                  <div className="inline-block bg-red-100 text-red-600 font-black px-3 py-1.5 rounded-[10px] text-xs uppercase tracking-wide mb-4">
                    Limited Time {activeDiscount}% Off
                  </div>
                )}
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Price</div>
                <div className="flex flex-wrap items-end gap-3 mb-1">
                  <span className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-none">
                    {formatCurrency(salePrice)}
                  </span>
                </div>
                {activeDiscount > 0 && (
                  <div className="text-slate-500 font-medium text-sm mt-2">
                    <span className="line-through">{formatCurrency(course.standard_fee)}</span>
                  </div>
                )}
              </div>

              <Link 
                href={orderUrl}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg py-4 rounded-[14px] shadow-[0_8px_20px_-6px_rgba(37,99,235,0.4)] transition-all active:scale-[0.98] mb-4"
              >
                <ShoppingCart size={18} className="stroke-[2]" /> Buy Recording
              </Link>

              {course.syllabus_url && course.syllabus_url !== "#" && (
                <a 
                  href={course.syllabus_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 font-bold py-3.5 rounded-[14px] transition-all mb-8 shadow-sm"
                >
                  <BookOpen size={18} className="stroke-[2]" /> View Full Syllabus <ExternalLink size={14} className="text-slate-400" />
                </a>
              )}

              <div className="space-y-4 pt-8 border-t border-slate-200">
                <div className="flex items-center gap-3 text-sm text-slate-600 font-medium">
                  <Clock size={18} className="text-slate-400 stroke-[2]" />
                  <span>{course.course_hours} Hours of HD Video</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-600 font-medium">
                  <Infinity size={18} className="text-slate-400 stroke-[2]" />
                  <span>Full Lifetime Access</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-600 font-medium">
                  <ShieldCheck size={18} className="text-slate-400 stroke-[2]" />
                  <span>Secure SSL Checkout</span>
                </div>
                {/* NEW ITEM ADDED HERE */}
                <div className="flex items-center gap-3 text-sm text-slate-600 font-medium">
                  <FileText size={18} className="text-slate-400 stroke-[2]" />
                  <span>Study materials like class notes, sheets, sample reports</span>
                </div>
              </div>

              {/* MOVED FAQ SECTION - Under Checkout info in Sidebar */}
              {extractedFaqs.length > 0 && (
                <div className="mt-8 pt-8 border-t border-slate-200">
                  <h2 className="text-lg font-bold text-slate-900 mb-5 flex items-center gap-2">
                    <HelpCircle size={20} className="text-blue-600" /> Frequently Asked Questions
                  </h2>
                  <div className="space-y-3">
                    {extractedFaqs.map((faq, idx) => (
                      <details 
                        key={idx} 
                        className="group bg-white border border-slate-200 hover:border-slate-300 transition-colors duration-300 rounded-[16px] overflow-hidden [&_summary::-webkit-details-marker]:hidden shadow-sm"
                      >
                        <summary className="w-full text-left px-5 py-3.5 flex justify-between items-center cursor-pointer bg-white hover:bg-slate-50 focus:outline-none focus:bg-blue-50/50">
                          <span className="font-bold pr-4 leading-snug text-slate-800 group-open:text-blue-700 text-sm">
                            {faq.question}
                          </span>
                          <div className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center bg-slate-100 text-slate-500 group-open:bg-blue-100 group-open:text-blue-600 transition-colors">
                            <ChevronDown size={16} className="transition-transform duration-300 group-open:rotate-180" />
                          </div>
                        </summary>
                        <div className="px-5 pb-4 pt-1 border-t border-slate-100/0">
                          <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line">
                            {faq.answer}
                          </p>
                        </div>
                      </details>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}