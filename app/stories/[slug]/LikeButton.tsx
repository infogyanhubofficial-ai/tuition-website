"use client";

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

interface LikeButtonProps {
  storyId: number;
  initialLikes: number;
  userId?: string | null;
  initialHasLiked: boolean;
  variant: 'inline' | 'floating';
}

export default function LikeButton({ storyId, initialLikes, userId, initialHasLiked, variant }: LikeButtonProps) {
  const [likes, setLikes] = useState(initialLikes);
  const [hasLiked, setHasLiked] = useState(initialHasLiked);
  const [isLiking, setIsLiking] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // 1. Check LocalStorage for Anonymous Users on Mount
  useEffect(() => {
    setIsMounted(true);
    if (!userId) {
      const localLikeId = localStorage.getItem(`gyanhub_like_${storyId}`);
      if (localLikeId) {
        setHasLiked(true);
      }
    }
  }, [storyId, userId]);

  // 2. Synchronize state across all LikeButton instances instantly
  useEffect(() => {
    const handleSync = (e: any) => {
      if (e.detail.storyId === storyId) {
        setLikes(e.detail.likes);
        setHasLiked(e.detail.hasLiked);
      }
    };
    window.addEventListener('sync-likes', handleSync);
    return () => window.removeEventListener('sync-likes', handleSync);
  }, [storyId]);

  const handleLike = async () => {
    if (isLiking) return;
    setIsLiking(true);

    const newHasLiked = !hasLiked;
    const newLikes = newHasLiked ? likes + 1 : likes - 1;

    // Optimistic UI Update & Broadcast to other buttons on the page
    setHasLiked(newHasLiked);
    setLikes(newLikes);
    window.dispatchEvent(new CustomEvent('sync-likes', {
      detail: { storyId, likes: newLikes, hasLiked: newHasLiked }
    }));

    // Database Operation
    if (newHasLiked) {
      const payload: any = { story_id: storyId };
      if (userId) payload.user_id = userId; // Only attach if logged in

      // Insert and get the ID back
      const { data } = await supabase.from('story_likes').insert(payload).select('id').single();
      
      // If anonymous, save the Row ID to localStorage so they can unlike it later
      if (!userId && data) {
        localStorage.setItem(`gyanhub_like_${storyId}`, data.id.toString());
      }
    } else {
      if (userId) {
        // Logged in: Delete by User ID
        await supabase.from('story_likes').delete().match({ story_id: storyId, user_id: userId });
      } else {
        // Anonymous: Delete by LocalStorage Row ID
        const localLikeId = localStorage.getItem(`gyanhub_like_${storyId}`);
        if (localLikeId) {
          await supabase.from('story_likes').delete().eq('id', localLikeId);
          localStorage.removeItem(`gyanhub_like_${storyId}`);
        }
      }
    }
    
    setIsLiking(false);
  };

  // Prevent hydration mismatch by hiding until mounted
  if (!isMounted) return <div className="w-8 h-8 opacity-0"></div>;

  // --- FLOATING VARIANT (Only shows Likes, Glowing) ---
  if (variant === 'floating') {
    return (
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 xl:left-auto xl:-translate-x-0 xl:right-10 xl:bottom-10 z-50">
        <button 
          onClick={handleLike}
          disabled={isLiking}
          className={`flex xl:flex-col items-center gap-2 group transition-all duration-300 hover:scale-110 bg-white/95 backdrop-blur-md px-6 py-3 xl:py-4 xl:px-4 rounded-full xl:rounded-3xl border 
            ${hasLiked ? 'border-red-300 shadow-[0_0_25px_rgba(239,68,68,0.5)] text-red-500' : 'border-red-100 shadow-[0_0_20px_rgba(239,68,68,0.3)] text-slate-600 animate-pulse hover:animate-none hover:text-red-500'}`}
          title={hasLiked ? "Unlike story" : "Like this story!"}
        >
          <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${hasLiked ? 'bg-red-50' : 'bg-red-50/50 group-hover:bg-red-50'}`}>
            <svg className="w-6 h-6" fill={hasLiked ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <span className="font-bold text-sm xl:text-xs tracking-widest">{likes}</span>
        </button>
      </div>
    );
  }

  // --- INLINE VARIANT (For Header and Footer, Glowing) ---
  return (
    <button 
      onClick={handleLike} 
      disabled={isLiking}
      className={`flex items-center gap-1.5 transition-all duration-300 
        ${hasLiked ? 'text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]' : 'text-slate-500 hover:text-red-500 animate-pulse hover:animate-none drop-shadow-[0_0_8px_rgba(239,68,68,0.4)]'}`}
      title="Like this story"
    >
      <svg className="w-4 h-4" fill={hasLiked ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
      {likes}
    </button>
  );
}