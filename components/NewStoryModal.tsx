'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { X, CheckCircle2, Loader2, AlertCircle, FileText } from 'lucide-react';
// FIXED: Using your exact Supabase client path
import { supabase } from '../lib/supabase';

interface NewStoryModalProps {
  userId: string;
  storyId?: string;
}

export default function NewStoryModal({ userId, storyId }: NewStoryModalProps) {
  const router = useRouter();
  
  const [saveStatus, setSaveStatus] = useState<'Idle' | 'Saving...' | 'Saved to Drafts' | 'Error'>('Idle');
  const [isLocked, setIsLocked] = useState(false);
  const [currentStoryId, setCurrentStoryId] = useState<string | undefined>(storyId);
  const [isLoading, setIsLoading] = useState(true);

  const [formData, setFormData] = useState({
    title: '',
    category: '',
    excerpt: '',
    content: ''
  });

  const isFirstRender = useRef(true);

  // 1. Initialize Story (Fetch existing OR create new blank draft)
  useEffect(() => {
    let isMounted = true;
    
    async function initializeStory() {
      if (storyId) {
        // Fetch existing story
        const { data, error } = await supabase
          .from('gyanhub_stories')
          .select('*')
          .eq('id', storyId)
          .single();

        if (data && isMounted) {
          setFormData({
            title: data.title || '',
            category: data.category || '',
            excerpt: data.excerpt || '',
            content: data.content || ''
          });
          if (data.status === 'published') setIsLocked(true);
        }
      } else {
        // Create a new blank draft instantly
        setSaveStatus('Saving...');
        const { data, error } = await supabase
          .from('gyanhub_stories')
          .insert({
            author_id: userId,
            status: 'draft',
            title: '', 
            content: ''
          })
          .select('id')
          .single();

        if (data && isMounted) {
          setCurrentStoryId(data.id);
          setSaveStatus('Saved to Drafts');
          
          // Silently update the URL so if they refresh, it loads this draft
          window.history.replaceState(null, '', `?action=edit&storyId=${data.id}`);
        }
      }
      if (isMounted) setIsLoading(false);
    }

    initializeStory();

    return () => { isMounted = false; };
  }, [storyId, userId]);

  // 2. Auto-Save Logic (Debounced)
  useEffect(() => {
    // Skip the first render to avoid useless saves
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    // Do not auto-save if the story is locked or hasn't been initialized yet
    if (isLocked || !currentStoryId || isLoading) return;

    setSaveStatus('Saving...');

    // Wait 1.5 seconds after the user stops typing to trigger the save
    const timer = setTimeout(async () => {
      const { error } = await supabase
        .from('gyanhub_stories')
        .update({
          title: formData.title,
          category: formData.category,
          excerpt: formData.excerpt,
          content: formData.content,
          updated_at: new Date().toISOString(),
        })
        .eq('id', currentStoryId);

      if (error) {
        setSaveStatus('Error');
        console.error("Auto-save error:", error);
      } else {
        setSaveStatus('Saved to Drafts');
      }
    }, 1500);

    return () => clearTimeout(timer); // Reset the timer if they type again before 1.5s
  }, [formData, currentStoryId, isLocked, isLoading]);

  // Handle inputs
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // Close Modal
  const handleClose = () => {
    // Remove query params to close the modal
    router.push('/stories/dashboard');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/40 backdrop-blur-sm">
      {/* Modal Container */}
      <div className="w-full max-w-5xl h-[90vh] bg-white rounded-[32px] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header Strip */}
        <header className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white z-10">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                {isLocked ? 'View Story' : 'Drafting Editor'}
              </h2>
              {/* Save Status Indicator */}
              <div className="flex items-center gap-1.5 mt-0.5">
                {saveStatus === 'Saving...' && <Loader2 className="w-3.5 h-3.5 text-blue-500 animate-spin" />}
                {saveStatus === 'Saved to Drafts' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
                {saveStatus === 'Error' && <AlertCircle className="w-3.5 h-3.5 text-red-500" />}
                <span className={`text-[11px] font-semibold uppercase tracking-wider ${
                  saveStatus === 'Error' ? 'text-red-500' : 'text-slate-400'
                }`}>
                  {saveStatus}
                </span>
              </div>
            </div>
          </div>
          
          <button 
            onClick={handleClose}
            className="p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-900 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </header>

        {/* Scrollable Editor Body */}
        <div className="flex-1 overflow-y-auto bg-[#F8FAFC]">
          {isLoading ? (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin mb-4 text-blue-500" />
              <p className="font-medium">Initializing Workspace...</p>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto py-10 px-6 sm:px-12 flex flex-col gap-6">
              
              {isLocked && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3 text-amber-800 mb-4">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold">This story is published and locked.</h4>
                    <p className="text-sm mt-1 opacity-90">To maintain content integrity, published articles cannot be directly edited here. Please contact an admin if changes are required.</p>
                  </div>
                </div>
              )}

              {/* Title Input */}
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                disabled={isLocked}
                placeholder="Story Title..."
                className="w-full text-4xl sm:text-5xl font-black text-slate-900 bg-transparent border-none outline-none placeholder:text-slate-300 disabled:opacity-70"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">Category</label>
                  <input
                    type="text"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    disabled={isLocked}
                    placeholder="e.g. Technology, Education"
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:border-blue-500 focus:ring-4 ring-blue-50 transition-all disabled:opacity-70 disabled:bg-slate-50"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">Excerpt (Short Description)</label>
                  <input
                    type="text"
                    name="excerpt"
                    value={formData.excerpt}
                    onChange={handleChange}
                    disabled={isLocked}
                    placeholder="A brief summary..."
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:border-blue-500 focus:ring-4 ring-blue-50 transition-all disabled:opacity-70 disabled:bg-slate-50"
                  />
                </div>
              </div>

              {/* Rich Text Placeholder / Textarea */}
              <div className="flex flex-col gap-1.5 flex-1 min-h-[400px]">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">Content</label>
                <textarea
                  name="content"
                  value={formData.content}
                  onChange={handleChange}
                  disabled={isLocked}
                  placeholder="Start writing your amazing story here..."
                  className="w-full flex-1 bg-white border border-slate-200 rounded-2xl p-6 text-base font-medium text-slate-700 outline-none focus:border-blue-500 focus:ring-4 ring-blue-50 transition-all resize-none disabled:opacity-70 disabled:bg-slate-50 leading-relaxed"
                ></textarea>
                <p className="text-[10px] text-slate-400 text-right mt-1 font-medium">
                  *This basic text area can be upgraded to a Rich Text Editor (like TipTap or ReactQuill) later.
                </p>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
}