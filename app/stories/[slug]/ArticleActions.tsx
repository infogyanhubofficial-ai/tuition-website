"use client";

import React, { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

interface ArticleActionsProps {
  storyId: number;
  initialLikes: number;
  initialViews: number;
  userId?: string | null; // Pass user ID if logged in
}

export default function ArticleActions({ storyId, initialLikes, initialViews, userId }: ArticleActionsProps) {
  const [likes, setLikes] = useState(initialLikes);
  const [hasLiked, setHasLiked] = useState(false); // In a real app, check if user already liked
  const [isLiking, setIsLiking] = useState(false);

  const handleLike = async () => {
    // If not logged in, you might want to redirect to login or show an alert.
    if (!userId) {
      alert("Please log in to like stories!");
      return;
    }

    setIsLiking(true);

    if (hasLiked) {
      // Unlike
      setLikes(prev => prev - 1);
      setHasLiked(false);
      await supabase.from('story_likes').delete().match({ story_id: storyId, user_id: userId });
    } else {
      // Like
      setLikes(prev => prev + 1);
      setHasLiked(true);
      await supabase.from('story_likes').insert({ story_id: storyId, user_id: userId });
    }
    
    setIsLiking(false);
  };

  return (
    <>
      {/* Floating Action Bar (Bottom Mobile / Side Desktop) */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 xl:left-auto xl:-translate-x-0 xl:right-10 xl:bottom-10 z-50 flex xl:flex-col items-center gap-4 bg-white/95 backdrop-blur-md px-6 py-3 xl:py-6 xl:px-4 rounded-full xl:rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-200 transition-all">
        
        {/* Like Button */}
        <button 
          onClick={handleLike}
          disabled={isLiking}
          className={`flex xl:flex-col items-center gap-2 group transition-all hover:scale-110 ${hasLiked ? 'text-red-500' : 'text-slate-500 hover:text-red-500'}`}
          title="Like this story"
        >
          <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${hasLiked ? 'bg-red-50' : 'bg-slate-50 group-hover:bg-red-50'}`}>
            <svg className="w-5 h-5" fill={hasLiked ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
          </div>
          <span className="font-bold text-sm xl:text-xs">{likes}</span>
        </button>

        <div className="w-[1px] h-8 xl:w-8 xl:h-[1px] bg-slate-200"></div>

        {/* View Counter (Static display on floating bar) */}
        <div className="flex xl:flex-col items-center gap-2 text-slate-400" title="Total Views">
          <div className="w-10 h-10 rounded-full flex items-center justify-center bg-slate-50">
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
          </div>
          <span className="font-bold text-sm xl:text-xs">{initialViews}</span>
        </div>
      </div>
    </>
  );
}