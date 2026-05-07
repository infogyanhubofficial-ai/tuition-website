'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence, Variants } from 'framer-motion'; // Added Variants here
import confetti from 'canvas-confetti';
import { 
  Star, Send, User, Mail, MessageSquare, 
  CheckCircle2, AlertCircle, Loader2, ThumbsUp, HelpCircle, ThumbsDown,
  Quote, ChevronDown, ChevronUp, BookOpen, GraduationCap, Clock, Lock, Sparkles
} from 'lucide-react';

// Explicitly typed as Variants to fix the "type: string" incompatibility
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

// Explicitly typed as Variants to ensure "spring" is recognized as a valid literal
const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { 
      type: "spring", 
      stiffness: 300, 
      damping: 24 
    } 
  }
};

interface ReviewFormProps {
  syllabusId: string;
  initialAuthUser: { name: string | null; email: string | null } | null;
}

export default function ReviewForm({ syllabusId, initialAuthUser }: ReviewFormProps) {
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  const [courseDetails, setCourseDetails] = useState<any>(null);
  const [isLoadingCourse, setIsLoadingCourse] = useState(true);

  const [formData, setFormData] = useState({
    overallRating: 0, tutorRating: 0, contentRating: 0, skillRating: 0, materialsRating: 0,
    likedMost: '', improvements: '', testimonial: '', name: '', email: '', recommend: '' 
  });
  
  const [showTestimonial, setShowTestimonial] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastStatus, setToastStatus] = useState<'success' | 'error' | null>(null);
  const [toastMessage, setToastMessage] = useState('');

  // Hydration & Auto-save
  useEffect(() => {
    setMounted(true);
    const savedDraft = localStorage.getItem(`draft_review_${syllabusId}`);
    if (savedDraft) {
      try { setFormData(JSON.parse(savedDraft)); } catch (e) {}
    }
  }, [syllabusId]);

  useEffect(() => {
    if (mounted) localStorage.setItem(`draft_review_${syllabusId}`, JSON.stringify(formData));
  }, [formData, mounted, syllabusId]);

  // Fetch Course Data
  useEffect(() => {
    async function fetchCourseData() {
      if (!syllabusId) return;
      try {
        const { data, error } = await supabase
          .from('syllabi_v2')
          .select(`name, course_code, cover_pic, online_tutors ( name )`)
          .eq('id', syllabusId)
          .single();
        if (error) throw error;
        setCourseDetails(data);
      } catch (error) {
        console.error("Error fetching course details:", error);
      } finally {
        setIsLoadingCourse(false);
      }
    }
    fetchCourseData();
  }, [syllabusId]);

  const updateField = (field: string, value: any) => setFormData(prev => ({ ...prev, [field]: value }));

  const showToast = (type: 'success' | 'error', msg: string) => {
    setToastStatus(type); setToastMessage(msg);
    setTimeout(() => { setToastStatus(null); setToastMessage(''); }, 4000);
  };

  const isRatingsComplete = formData.overallRating > 0 && formData.tutorRating > 0 && formData.contentRating > 0 && formData.skillRating > 0 && formData.materialsRating > 0;
  const isFeedbackComplete = formData.likedMost.trim().length > 10;
  const isTestimonialComplete = !showTestimonial || (formData.testimonial.trim().length > 0 && formData.name.trim() && formData.email.trim());
  const isRecommendComplete = !!formData.recommend;
  const completedSteps = [isRatingsComplete, isFeedbackComplete, isTestimonialComplete, isRecommendComplete].filter(Boolean).length;
  const progressPercentage = (completedSteps / 4) * 100;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const hasAnyData = formData.overallRating || formData.tutorRating || formData.contentRating || 
                       formData.skillRating || formData.materialsRating || formData.likedMost.trim() || 
                       formData.improvements.trim() || formData.testimonial.trim() || formData.recommend;

    if (!hasAnyData) return showToast('error', 'Please fill out at least one field to submit your feedback.');

    setIsSubmitting(true);

    let finalName = (showTestimonial && formData.name.trim()) ? formData.name.trim() : null;
    let finalEmail = (showTestimonial && formData.email.trim()) ? formData.email.trim().toLowerCase() : null;

    if (!finalName && initialAuthUser?.name?.trim()) finalName = initialAuthUser.name.trim();
    if (!finalEmail && initialAuthUser?.email?.trim()) finalEmail = initialAuthUser.email.trim().toLowerCase();

    try {
      const { error } = await supabase.from('reviews').insert([{ 
        syllabus_id: parseInt(syllabusId), 
        name: finalName || null, 
        email: finalEmail || null, 
        overall_rating: formData.overallRating || null, 
        tutor_rating: formData.tutorRating || null, 
        content_rating: formData.contentRating || null,
        skill_improvement_rating: formData.skillRating || null, 
        materials_rating: formData.materialsRating || null,
        liked_most: formData.likedMost.trim() || null, 
        improvements_suggested: formData.improvements.trim() || null,
        testimonial: showTestimonial ? formData.testimonial.trim() || null : null, 
        would_recommend: formData.recommend || null,
        status: 'pending'
      }]);

      if (error) throw error;

      confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 }, colors: ['#3b82f6', '#10b981', '#ffffff'] });
      showToast('success', 'Thank you! Your feedback has been safely submitted.');
      localStorage.removeItem(`draft_review_${syllabusId}`);
      setTimeout(() => router.push('/certificate'), 3000);
    } catch (error: any) {
      showToast('error', `Failed to submit: ${error?.message || 'Please try again.'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const ratingLabels = ['Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];
  const ratingEmojis = ['😠', '😕', '😐', '🙂', '🤩'];
  const getEmojiHeader = () => {
    if (!formData.overallRating) return { emoji: '🤔', text: 'How was it?' };
    return { emoji: ratingEmojis[formData.overallRating - 1], text: ratingLabels[formData.overallRating - 1] };
  };

  const HeroStarRating = ({ label, field, value }: { label: string, field: string, value: number }) => {
    const [hovered, setHovered] = useState(0);
    return (
      <div className="flex flex-col items-center gap-4 p-8 mb-8 bg-gradient-to-b from-blue-500/10 to-transparent rounded-3xl border border-blue-500/20 shadow-[0_0_40px_rgba(59,130,246,0.15)] relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-50"></div>
        <div className="text-center">
          <span className="text-slate-200 font-bold text-xl block mb-1">{label}</span>
          <span className="text-sm font-semibold text-blue-400">{(hovered || value) ? ratingLabels[(hovered || value) - 1] : 'Tap to rate your experience'}</span>
        </div>
        <div className="flex gap-2 sm:gap-4 mt-2" onMouseLeave={() => setHovered(0)}>
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star} type="button" aria-label={`Rate ${star} stars`}
              onClick={() => updateField(field, star)}
              onMouseEnter={() => setHovered(star)}
              className="focus:outline-none focus:ring-4 focus:ring-blue-500/50 rounded-full transition-all duration-300 hover:scale-125 active:scale-90"
            >
              <Star className={`w-12 h-12 sm:w-16 sm:h-16 transition-colors duration-300 ${
                star <= (hovered || value) ? 'fill-amber-400 text-amber-400 drop-shadow-[0_0_20px_rgba(251,191,36,0.8)] scale-110' : 'fill-slate-800/80 text-slate-700'
              }`} />
            </button>
          ))}
        </div>
      </div>
    );
  };

  const StarRating = ({ label, field, value }: { label: string, field: string, value: number }) => {
    const [hovered, setHovered] = useState(0);
    return (
      <div className="flex flex-col gap-3 p-5 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] transition-all hover:bg-white/10">
        <div className="flex justify-between items-center">
          <span className="text-slate-200 font-medium text-sm">{label}</span>
          <span className="text-xs font-bold text-blue-400 bg-blue-500/10 px-2 py-1 rounded-md">{(hovered || value) ? ratingLabels[(hovered || value) - 1] : 'Rate'}</span>
        </div>
        <div className="flex gap-1.5" onMouseLeave={() => setHovered(0)}>
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star} type="button" aria-label={`Rate ${star} stars`}
              onClick={() => updateField(field, star)}
              onMouseEnter={() => setHovered(star)}
              className="focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-full transition-transform hover:scale-125 active:scale-90"
            >
              <Star className={`w-8 h-8 transition-colors duration-300 ${
                star <= (hovered || value) ? 'fill-amber-400 text-amber-400 drop-shadow-[0_0_12px_rgba(251,191,36,0.6)]' : 'fill-slate-800 text-slate-700'
              }`} />
            </button>
          ))}
        </div>
      </div>
    );
  };

  if (isLoadingCourse || !mounted) return <div className="min-h-screen bg-[#0F172A] flex justify-center items-center"><Loader2 className="w-10 h-10 animate-spin text-blue-500" /></div>;
  if (!courseDetails) return <div className="min-h-screen bg-[#0F172A] flex justify-center items-center text-white font-bold text-2xl">Course Not Found</div>;

  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-100 font-sans pb-32 relative overflow-hidden selection:bg-blue-500/30">
      
      <div className="fixed inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\'40\' height=\'40\' viewBox=\'0 0 40 40\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%2394a3b8\' fill-opacity=\'0.03\' fill-rule=\'evenodd\'%3E%3Cpath d=\'M0 40L40 0H20L0 20M40 40V20L20 40\'/%3E%3C/g%3E%3C/svg%3E')] pointer-events-none z-0"></div>
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full pointer-events-none opacity-40 z-0">
        <div className="absolute -top-32 -right-32 w-[600px] h-[600px] bg-blue-600/30 rounded-full blur-[150px]"></div>
        <div className="absolute top-1/3 -left-32 w-[500px] h-[500px] bg-emerald-600/20 rounded-full blur-[150px]"></div> 
      </div>

      <div className="sticky top-0 z-50 bg-[#0F172A]/80 backdrop-blur-xl border-b border-white/10 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <div className="flex flex-col">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Step {completedSteps} of 4</span>
            <span className="text-sm font-semibold text-white flex items-center gap-2">
              {progressPercentage > 0 ? <><CheckCircle2 className="w-4 h-4 text-emerald-400"/> Feedback captured</> : 'Evaluation started'}
            </span>
          </div>
          <div className="flex-1 max-w-xs h-2 bg-slate-800 rounded-full overflow-hidden">
            <motion.div initial={{ width: 0 }} animate={{ width: `${progressPercentage}%` }} className="h-full bg-gradient-to-r from-blue-500 to-emerald-400" />
          </div>
        </div>
      </div>

      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="max-w-4xl mx-auto px-4 mt-12 relative z-10">
        
        <motion.div variants={itemVariants} className="text-center mb-12">
          <div className="flex flex-wrap justify-center gap-3 mb-6">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold">
              <Clock className="w-3.5 h-3.5 text-blue-400" /> Takes less than 2 mins
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
              Draft Auto-Saved
            </span>
          </div>

          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-8" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
            Share Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">Learning Experience</span>
          </h1>
          
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 text-left max-w-2xl mx-auto shadow-2xl flex flex-col sm:flex-row gap-6 items-center sm:items-start relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent pointer-events-none"></div>
            {courseDetails.cover_pic ? (
              <img src={courseDetails.cover_pic} alt={courseDetails.name} className="w-24 h-24 rounded-2xl object-cover border border-slate-700 shadow-lg shrink-0" />
            ) : (
              <div className="w-24 h-24 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 shadow-lg">
                <BookOpen className="w-10 h-10 text-slate-500" />
              </div>
            )}
            <div className="flex-1 text-center sm:text-left z-10">
              <div className="text-xs font-bold tracking-widest text-emerald-400 uppercase mb-1">{courseDetails.course_code}</div>
              <h2 className="text-2xl font-bold text-white leading-snug mb-2">{courseDetails.name}</h2>
              <div className="flex items-center justify-center sm:justify-start gap-2 text-slate-400 text-sm">
                <GraduationCap className="w-4 h-4" /> <span>Instructor: <strong className="text-slate-200">{courseDetails.online_tutors?.name || 'GyanHub Tutor'}</strong></span>
              </div>
            </div>
          </div>

          <div className="mt-8 inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-950/30 border border-blue-900/50 rounded-xl text-blue-300 text-sm font-medium">
            <Lock className="w-4 h-4" /> Your feedback remains anonymous unless you add a public review.
          </div>
        </motion.div>

        <form onSubmit={handleSubmit} className="space-y-8">

          <motion.div variants={itemVariants} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.12)] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]">
            <div className="flex items-center justify-between mb-8 border-b border-white/10 pb-6">
              <h3 className="text-2xl font-bold text-white tracking-tight">Course Ratings</h3>
              <div className="flex items-center gap-2 bg-slate-800/80 px-4 py-2 rounded-full border border-slate-700">
                <span className="text-2xl">{getEmojiHeader().emoji}</span>
                <span className="font-bold text-slate-200">{getEmojiHeader().text}</span>
              </div>
            </div>
            
            <HeroStarRating label="Overall Course Rating" field="overallRating" value={formData.overallRating} />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
              <StarRating label="Tutor's Teaching Style" field="tutorRating" value={formData.tutorRating} />
              <StarRating label="Course Content & Flow" field="contentRating" value={formData.contentRating} />
              <StarRating label="Knowledge & Skills Improvement" field="skillRating" value={formData.skillRating} />
              <StarRating label="Recordings & Study Materials" field="materialsRating" value={formData.materialsRating} />
            </div>

            <AnimatePresence>
              {isRatingsComplete && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center gap-3 text-blue-300">
                  <Sparkles className="w-5 h-5" /> Thanks! Your ratings help instructors improve their teaching.
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          <motion.div variants={itemVariants} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.12)] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]">
            <h3 className="text-2xl font-bold text-white mb-8 border-b border-white/10 pb-6 tracking-tight">Detailed Feedback</h3>
            <div className="space-y-8">
              <div className="space-y-3">
                <div className="flex justify-between items-end">
                  <label className="text-sm font-semibold text-slate-300">What did you like most about this course?</label>
                  <span className={`text-xs font-medium ${formData.likedMost.length > 400 ? 'text-amber-400' : 'text-slate-500'}`}>{formData.likedMost.length} / 500</span>
                </div>
                <textarea 
                  maxLength={500} value={formData.likedMost} onChange={(e) => updateField('likedMost', e.target.value)}
                  placeholder="What practical skill helped you most? What did the instructor do well?" rows={3}
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all resize-none shadow-inner"
                />
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-end">
                  <label className="text-sm font-semibold text-slate-300">What improvements or additional topics would you suggest?</label>
                  <span className={`text-xs font-medium ${formData.improvements.length > 400 ? 'text-amber-400' : 'text-slate-500'}`}>{formData.improvements.length} / 500</span>
                </div>
                <textarea 
                  maxLength={500} value={formData.improvements} onChange={(e) => updateField('improvements', e.target.value)}
                  placeholder="e.g., More practice assignments and quizzes would have improve learning........" rows={3}
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all resize-none shadow-inner"
                />
              </div>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className={`bg-white/5 backdrop-blur-xl border rounded-3xl shadow-2xl overflow-hidden transition-all duration-500 ${showTestimonial ? 'border-blue-500/50 shadow-[0_0_30px_rgba(59,130,246,0.1)]' : 'border-white/10'}`}>
            <button type="button" aria-expanded={showTestimonial} onClick={() => setShowTestimonial(!showTestimonial)} className="w-full flex items-center justify-between p-6 md:p-8 hover:bg-white/5 transition-colors focus:outline-none focus:bg-white/5">
              <div className="flex items-center gap-4 text-left">
                <div className={`p-3 rounded-xl transition-colors ${showTestimonial ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-800 text-slate-400'}`}>
                  <Quote className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white tracking-tight">Add Public Review</h3>
                  <p className="text-sm text-slate-400 mt-1 font-medium">Share a public review to help future students. (Optional)</p>
                </div>
              </div>
              <motion.div animate={{ rotate: showTestimonial ? 180 : 0 }}><ChevronDown className="w-6 h-6 text-slate-400" /></motion.div>
            </button>

            <AnimatePresence>
              {showTestimonial && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                  <div className="p-6 md:p-8 pt-0 space-y-6 border-t border-white/10 mt-2">
                    <div className="space-y-3 mt-4">
                      <div className="flex justify-between items-end">
                        <label className="text-sm font-semibold text-slate-300">Your Learning Experience</label>
                        <span className="text-xs font-medium text-slate-500">{formData.testimonial.length} / 300</span>
                      </div>
                      <textarea 
                        maxLength={300} value={formData.testimonial} onChange={(e) => updateField('testimonial', e.target.value)}
                        placeholder="GyanHub's course completely changed how I approach..." rows={3}
                        className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition-all resize-none shadow-inner"
                      />
                    </div>

                    <div className="bg-blue-950/20 border border-blue-900/40 rounded-2xl p-6 relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                      <p className="text-sm text-blue-200 font-medium flex items-center gap-2 mb-5">
                        <Lock className="w-4 h-4" /> Provide your details to highlight your public review.
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Full Name</label>
                          <input 
                            type="text" value={formData.name} onChange={(e) => updateField('name', e.target.value)}
                            placeholder={initialAuthUser?.name || "Nischal Subedi"} className="w-full bg-slate-900/80 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500 transition-all shadow-inner"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Email Address</label>
                          <input 
                            type="email" value={formData.email} onChange={(e) => updateField('email', e.target.value)}
                            placeholder={initialAuthUser?.email || "nischal@example.com"} className="w-full bg-slate-900/80 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500 transition-all shadow-inner"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          <motion.div variants={itemVariants} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-10 shadow-2xl mb-24 md:mb-0">
            <div className="mb-10 text-center">
              <label className="block text-xl font-bold text-white mb-8 tracking-tight">Would you recommend this course to others?</label>
              <div className="flex flex-wrap justify-center gap-4">
                {[
                  { value: 'Yes', icon: ThumbsUp, color: 'emerald', text: 'Yes, definitely!' },
                  { value: 'Maybe', icon: HelpCircle, color: 'blue', text: 'Maybe' },
                  { value: 'No', icon: ThumbsDown, color: 'red', text: 'No' }
                ].map((option) => {
                  const Icon = option.icon;
                  const isSelected = formData.recommend === option.value;
                  return (
                    <button 
                      key={option.value} type="button" onClick={() => updateField('recommend', option.value)}
                      className={`relative flex items-center gap-2 px-6 py-4 rounded-2xl font-bold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-${option.color}-500 overflow-hidden ${
                        isSelected 
                          ? `bg-${option.color}-500 text-white shadow-[0_0_25px_rgba(var(--color-${option.color}-500),0.4)] scale-105 border border-transparent` 
                          : 'bg-slate-800/80 text-slate-400 border border-slate-700 hover:bg-slate-700 hover:text-white'
                      }`}
                    >
                      {isSelected && <span className="absolute inset-0 bg-white/20 animate-pulse"></span>}
                      <Icon className="w-5 h-5 relative z-10" /> <span className="relative z-10">{option.text}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="mb-8 flex flex-wrap justify-center gap-6">
              <span className={`text-sm font-semibold flex items-center gap-2 ${isRatingsComplete ? 'text-emerald-400' : 'text-slate-500'}`}>
                <CheckCircle2 className={`w-4 h-4 ${isRatingsComplete ? 'text-emerald-400' : 'text-slate-600'}`} /> Ratings
              </span>
              <span className={`text-sm font-semibold flex items-center gap-2 ${isRecommendComplete ? 'text-emerald-400' : 'text-slate-500'}`}>
                <CheckCircle2 className={`w-4 h-4 ${isRecommendComplete ? 'text-emerald-400' : 'text-slate-600'}`} /> Recommendation
              </span>
            </div>

            <button 
              type="submit" disabled={isSubmitting}
              className="hidden md:flex w-full items-center justify-center gap-2 py-5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white rounded-2xl font-bold text-lg transition-all disabled:opacity-50 shadow-[0_0_30px_rgba(59,130,246,0.3)] hover:shadow-[0_0_40px_rgba(59,130,246,0.5)] focus:ring-4 focus:ring-blue-500/50 outline-none"
            >
              {isSubmitting ? <><Loader2 className="w-6 h-6 animate-spin" /> Finalizing...</> : <><Send className="w-6 h-6" /> Submit Course Feedback</>}
            </button>
          </motion.div>
        </form>
      </motion.div>

      <div className="md:hidden fixed bottom-0 left-0 w-full p-4 bg-[#0F172A]/90 backdrop-blur-xl border-t border-white/10 z-50">
        <button 
          onClick={handleSubmit} disabled={isSubmitting}
          className="w-full flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl font-bold transition-all disabled:opacity-50 shadow-lg"
        >
          {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Submit Course Feedback'}
        </button>
      </div>

      <div className={`fixed top-24 md:bottom-8 md:top-auto left-1/2 -translate-x-1/2 z-[60] transition-all duration-400 transform ${toastStatus ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-[-20px] md:translate-y-10 opacity-0 scale-95 pointer-events-none'}`}>
        <div className={`px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 font-semibold border backdrop-blur-md ${toastStatus === 'success' ? 'bg-emerald-950/90 text-emerald-100 border-emerald-500/50' : 'bg-red-950/90 text-red-100 border-red-500/50'}`}>
          {toastStatus === 'success' ? <CheckCircle2 className="w-6 h-6 text-emerald-400" /> : <AlertCircle className="w-6 h-6 text-red-400" />} {toastMessage}
        </div>
      </div>
    </div>
  );
}