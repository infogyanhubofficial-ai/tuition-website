'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Star, Send, User, Mail, MessageSquare, 
  CheckCircle2, AlertCircle, Loader2, ThumbsUp, HelpCircle, ThumbsDown,
  Quote, ChevronDown, ChevronUp
} from 'lucide-react';

export default function StudentReviewPage() {
  const [formData, setFormData] = useState({
    overallRating: 0,
    tutorRating: 0,
    contentRating: 0,
    skillRating: 0,
    materialsRating: 0,
    likedMost: '',
    improvements: '',
    testimonial: '',
    name: '',
    email: '',
    recommend: '' 
  });
  
  const [showTestimonial, setShowTestimonial] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastStatus, setToastStatus] = useState<'success' | 'error' | null>(null);
  const [toastMessage, setToastMessage] = useState('');

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const showToast = (type: 'success' | 'error', msg: string) => {
    setToastStatus(type);
    setToastMessage(msg);
    setTimeout(() => { setToastStatus(null); setToastMessage(''); }, 4000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Core Validation
    if (!formData.overallRating || !formData.tutorRating || !formData.contentRating || !formData.skillRating || !formData.materialsRating) {
      showToast('error', 'Please complete all star ratings before submitting.');
      return;
    }
    if (!formData.recommend) {
      showToast('error', 'Please tell us if you would recommend this course.');
      return;
    }

    // Optional Testimonial Validation
    if (showTestimonial && formData.testimonial.trim() && (!formData.name.trim() || !formData.email.trim())) {
      showToast('error', 'Please provide your name and email to submit a personalized testimonial.');
      return;
    }

    setIsSubmitting(true);

    // Handle anonymous fallback to prevent DB errors
    const finalName = showTestimonial && formData.name.trim() ? formData.name.trim() : 'Anonymous Student';
    const finalEmail = showTestimonial && formData.email.trim() ? formData.email.trim().toLowerCase() : 'anonymous@gyanhub.com.np';

    try {
      const { error } = await supabase
        .from('reviews')
        .insert([{ 
          name: finalName, 
          email: finalEmail, 
          overall_rating: formData.overallRating,
          tutor_rating: formData.tutorRating,
          content_rating: formData.contentRating,
          skill_improvement_rating: formData.skillRating,
          materials_rating: formData.materialsRating,
          liked_most: formData.likedMost.trim(),
          improvements_suggested: formData.improvements.trim(),
          testimonial: showTestimonial ? formData.testimonial.trim() : null,
          would_recommend: formData.recommend,
          status: 'pending'
        }]);

      if (error) throw error;

      showToast('success', 'Thank you! Your anonymous review has been submitted.');
      
      // Reset form
      setFormData({
        overallRating: 0, tutorRating: 0, contentRating: 0, skillRating: 0, materialsRating: 0, 
        likedMost: '', improvements: '', testimonial: '', name: '', email: '', recommend: ''
      });
      setShowTestimonial(false);

    } catch (error: any) {
      console.error("Error submitting review:", error);
      showToast('error', 'Failed to submit review. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reusable Star Rating Component
  const StarRating = ({ label, field, value }: { label: string, field: string, value: number }) => {
    const [hovered, setHovered] = useState(0);
    return (
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-4 bg-slate-950/30 rounded-xl border border-slate-800/50">
        <span className="text-slate-300 font-medium text-sm">{label}</span>
        <div className="flex gap-1" onMouseLeave={() => setHovered(0)}>
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star} type="button"
              onClick={() => updateField(field, star)}
              onMouseEnter={() => setHovered(star)}
              className="focus:outline-none transition-transform hover:scale-110 active:scale-95"
            >
              <Star className={`w-7 h-7 transition-colors duration-200 ${
                star <= (hovered || value) 
                  ? 'fill-amber-400 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]' 
                  : 'fill-slate-800 text-slate-700'
              }`} />
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-100 font-sans py-20 relative overflow-hidden selection:bg-blue-500/30">
      
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\'40\' height=\'40\' viewBox=\'0 0 40 40\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%2394a3b8\' fill-opacity=\'0.05\' fill-rule=\'evenodd\'%3E%3Cpath d=\'M0 40L40 0H20L0 20M40 40V20L20 40\'/%3E%3C/g%3E%3C/svg%3E')] pointer-events-none"></div>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full overflow-hidden pointer-events-none opacity-30">
        <div className="absolute -top-24 -right-24 w-[500px] h-[500px] bg-[#0ea5e9] rounded-full blur-[120px]"></div>
        <div className="absolute top-48 -left-24 w-[400px] h-[400px] bg-[#10b981] rounded-full blur-[120px] opacity-20"></div> 
      </div>

      <div className="max-w-4xl mx-auto px-4 relative z-10">
        
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-semibold mb-6 backdrop-blur-md">
            <MessageSquare className="w-4 h-4 text-emerald-400" /> Anonymous Feedback
          </div>
          <h1 className="text-4xl md:text-5xl font-serif font-bold tracking-tight leading-tight text-white mb-4">
            Rate Your Experience <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">with GyanHub</span>
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Your honest, anonymous feedback helps us maintain high standards and improve our curriculum for future students.
          </p>
        </div>

        {/* Review Form */}
        <form onSubmit={handleSubmit} className="space-y-8">

          {/* Section 1: Ratings */}
          <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-6 border-b border-slate-800 pb-4">Course Ratings</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <StarRating label="Overall Satisfaction" field="overallRating" value={formData.overallRating} />
              <StarRating label="Tutor's Teaching & Style" field="tutorRating" value={formData.tutorRating} />
              <StarRating label="Content Clarity & Organization" field="contentRating" value={formData.contentRating} />
              <StarRating label="Knowledge & Skills Improvement" field="skillRating" value={formData.skillRating} />
              <StarRating label="Recordings & Study Materials" field="materialsRating" value={formData.materialsRating} />
            </div>
          </div>

          {/* Section 2: Detailed Feedback */}
          <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-6 border-b border-slate-800 pb-4">Detailed Feedback</h3>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">What did you like most about this course?</label>
                <textarea 
                  required value={formData.likedMost} onChange={(e) => updateField('likedMost', e.target.value)}
                  placeholder="e.g., The hands-on projects, the instructor's clarity..." rows={3}
                  className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500 transition-all resize-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">What improvements or additional topics would you suggest?</label>
                <textarea 
                  value={formData.improvements} onChange={(e) => updateField('improvements', e.target.value)}
                  placeholder="e.g., More real-world examples, advanced module..." rows={3}
                  className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500 transition-all resize-none"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Optional Testimonial (Toggled) */}
          <div className={`bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl shadow-2xl overflow-hidden transition-all duration-500 ${showTestimonial ? 'ring-1 ring-blue-500/50' : ''}`}>
            <button 
              type="button"
              onClick={() => setShowTestimonial(!showTestimonial)}
              className="w-full flex items-center justify-between p-8 hover:bg-slate-800/50 transition-colors"
            >
              <div className="flex items-center gap-3 text-left">
                <div className={`p-2 rounded-lg ${showTestimonial ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-800 text-slate-400'}`}>
                  <Quote className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Would you like to share a personalized testimonial?</h3>
                  <p className="text-sm text-slate-400 mt-0.5">Share a quote we can feature on our platform. (Optional)</p>
                </div>
              </div>
              {showTestimonial ? <ChevronUp className="w-6 h-6 text-slate-400" /> : <ChevronDown className="w-6 h-6 text-slate-400" />}
            </button>

            {/* Expandable Content */}
            <div className={`transition-all duration-500 ease-in-out ${showTestimonial ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0 pointer-events-none'}`}>
              <div className="p-8 pt-0 space-y-6 border-t border-slate-800/50 mt-2">
                
                <div className="space-y-2 mt-6">
                  <label className="text-sm font-medium text-slate-300">Your Testimonial</label>
                  <textarea 
                    value={formData.testimonial} onChange={(e) => updateField('testimonial', e.target.value)}
                    placeholder="Write a short quote about your experience..." rows={4}
                    className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500 transition-all resize-none"
                  />
                </div>

                <div className="bg-blue-950/20 border border-blue-900/30 rounded-xl p-5 mb-2">
                  <p className="text-sm text-blue-300 flex items-center gap-2 mb-4">
                    <User className="w-4 h-4" /> Please provide your details so we can attribute your quote to you.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-400">Full Name</label>
                      <input 
                        type="text" value={formData.name} onChange={(e) => updateField('name', e.target.value)}
                        placeholder="John Doe"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500 transition-all"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-400">Email Address</label>
                      <input 
                        type="email" value={formData.email} onChange={(e) => updateField('email', e.target.value)}
                        placeholder="john@example.com"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500 transition-all"
                      />
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* Section 4: Recommendation & Submit */}
          <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl">
            <div className="mb-8">
              <label className="block text-center text-lg font-bold text-white mb-6">Would you recommend this course to others?</label>
              <div className="flex flex-wrap justify-center gap-4">
                <button type="button" onClick={() => updateField('recommend', 'Yes')}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${formData.recommend === 'Yes' ? 'bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.3)] scale-105' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
                  <ThumbsUp className="w-5 h-5" /> Yes
                </button>
                <button type="button" onClick={() => updateField('recommend', 'Maybe')}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${formData.recommend === 'Maybe' ? 'bg-blue-500 text-white shadow-[0_0_20px_rgba(59,130,246,0.3)] scale-105' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
                  <HelpCircle className="w-5 h-5" /> Maybe
                </button>
                <button type="button" onClick={() => updateField('recommend', 'No')}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${formData.recommend === 'No' ? 'bg-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.3)] scale-105' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
                  <ThumbsDown className="w-5 h-5" /> No
                </button>
              </div>
            </div>

            <button 
              type="submit" disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white rounded-xl font-bold transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(59,130,246,0.2)] hover:shadow-[0_0_25px_rgba(59,130,246,0.4)]"
            >
              {isSubmitting ? <><Loader2 className="w-5 h-5 animate-spin" /> Submitting Review...</> : <><Send className="w-5 h-5" /> Submit Anonymous Evaluation</>}
            </button>
          </div>
        </form>
      </div>

      {/* Toast Notification */}
      <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 transform ${toastStatus ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0 pointer-events-none'}`}>
        <div className={`px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 font-medium border ${
          toastStatus === 'success' 
            ? 'bg-emerald-900/90 text-emerald-100 border-emerald-500/50' 
            : 'bg-red-900/90 text-red-100 border-red-500/50'
        }`}>
          {toastStatus === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <AlertCircle className="w-5 h-5 text-red-400" />}
          {toastMessage}
        </div>
      </div>
    </div>
  );
}