import React from 'react';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function getStoriesData() {
  const { data: featuredStory } = await supabase
    .from('gyanhub_stories')
    .select('*')
    .eq('featured', true) 
    .eq('status', 'published')
    .eq('is_approved', true)
    .limit(1)
    .maybeSingle(); 

  const { data: latestStories } = await supabase
    .from('gyanhub_stories')
    .select('*')
    .eq('status', 'published')
    .eq('is_approved', true)
    .order('published_at', { ascending: false })
    .limit(9);

  const { data: trendingStories } = await supabase
    .from('gyanhub_stories')
    .select('id, title, slug, read_time_minutes, views_count, likes_count') 
    .eq('status', 'published')
    .eq('is_approved', true)
    .order('views_count', { ascending: false })
    .limit(5);

  return { 
    featuredStory: featuredStory || null, 
    latestStories: latestStories || [], 
    trendingStories: trendingStories || [] 
  };
}

export default async function GyanHubStories({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { featuredStory, latestStories, trendingStories } = await getStoriesData();
  
  // Await searchParams for Next.js 15+
  const resolvedParams = await searchParams;
  const isTesting = resolvedParams.status === 'testing';

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'long', day: 'numeric', year: 'numeric' 
    });
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans relative">
      
      {/* 1. Newspaper Header */}
      <div className="text-center py-10 border-b-4 border-double border-slate-200">
          <h1 className="text-6xl font-black font-serif tracking-tighter italic">GyanHub Stories</h1>
          <p className="uppercase tracking-[0.3em] text-xs font-bold mt-2 text-slate-500">The Premier Educational Journal of Nepal</p>
      </div>

      {/* 2. Featured Editorial Section */}
      <header className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8 py-12 border-b border-slate-100">
        {featuredStory ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            <div className="lg:col-span-3 border-r border-slate-100 pr-8 space-y-6">
                <div className="pb-6 border-b border-slate-100">
                    <p className="text-orange-600 font-bold uppercase text-[10px] tracking-widest mb-1">{featuredStory.category}</p>
                    <p className="text-slate-400 text-sm">{formatDate(featuredStory.published_at)}</p>
                </div>
                <div>
                    <p className="font-serif text-xl font-bold leading-tight mb-1">{featuredStory.author_name}</p>
                    <p className="text-orange-600 text-[10px] font-bold uppercase mb-3 tracking-tighter">{featuredStory.author_profession || featuredStory.author_role}</p>
                    <p className="text-slate-600 text-sm leading-relaxed italic">"{featuredStory.author_bio || "Educational strategist and contributor."}"</p>
                </div>
            </div>

            <div className="lg:col-span-6 space-y-8">
                <Link href={`/stories/${featuredStory.slug}`}>
                    <h2 className="text-5xl font-black font-serif leading-none hover:text-orange-700 transition-colors">{featuredStory.title}</h2>
                </Link>
                <div className="w-full aspect-video rounded-lg overflow-hidden grayscale-[30%] hover:grayscale-0 transition-all duration-500 shadow-2xl border border-slate-100">
                    <img src={featuredStory.cover_image_url} alt={featuredStory.title} className="w-full h-full object-cover" />
                </div>
            </div>

            <div className="lg:col-span-3 space-y-6 flex flex-col justify-between h-full">
                <p className="text-lg text-slate-600 leading-relaxed first-letter:text-5xl first-letter:font-serif first-letter:font-bold first-letter:float-left first-letter:mr-3">
                  {featuredStory.excerpt}
                </p>
                <Link href={`/stories/${featuredStory.slug}`} className="bg-orange-600 !text-white text-center py-4 rounded-lg font-bold uppercase tracking-widest hover:bg-orange-700 transition-all shadow-xl flex items-center justify-center gap-2">
                    <span className="text-white">Read Full Editorial</span>
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                </Link>
            </div>
          </div>
        ) : <div className="text-center py-20 text-slate-500">No featured editorials available.</div>}
      </header>

      {/* 3. Latest Publications Grid */}
      <main className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8 py-16 grid grid-cols-1 lg:grid-cols-12 gap-16">
        <div className="lg:col-span-9 space-y-12">
          <h2 className="text-3xl font-serif font-bold italic border-b-2 border-slate-900 pb-2 inline-block">Latest Dispatches</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
            {latestStories.map((story) => (
              <article key={story.id} className="group border-b border-slate-100 pb-8 last:border-0 flex flex-col h-full">
                <Link href={`/stories/${story.slug}`} className="block overflow-hidden rounded-md mb-4 aspect-[16/10] bg-slate-100 border border-slate-50">
                  <img src={story.cover_image_url} alt={story.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </Link>
                <div className="flex-grow space-y-3">
                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-tighter text-orange-600">
                        <span>{story.category}</span>
                        <span>{story.read_time_minutes} MIN READ</span>
                    </div>
                    <Link href={`/stories/${story.slug}`}><h3 className="text-xl font-bold font-serif leading-tight group-hover:text-orange-700">{story.title}</h3></Link>
                    <p className="text-slate-500 text-sm line-clamp-3 leading-relaxed">{story.excerpt}</p>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-50 flex items-center justify-between text-slate-400">
                    <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1 text-[11px] font-bold"><span className="opacity-60">👁️</span> {story.views_count || 0}</span>
                        <span className="flex items-center gap-1 text-[11px] font-bold"><span className="opacity-60">❤️</span> {story.likes_count || 0}</span>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-tighter">{story.author_name}</span>
                </div>
              </article>
            ))}
          </div>
        </div>

        {/* 4. Sidebar */}
        <aside className="lg:col-span-3 space-y-8">
          <h2 className="text-xl font-serif font-bold italic border-b border-slate-200 pb-2">Top Stories</h2>
          <div className="space-y-8">
            {trendingStories.map((story, index) => (
              <Link key={story.id} href={`/stories/${story.slug}`} className="flex gap-4 group items-start">
                <span className="text-3xl font-serif italic text-slate-200 group-hover:text-orange-600 transition-colors mt-1">0{index + 1}</span>
                <div>
                  <h4 className="text-sm font-bold leading-tight group-hover:underline mb-1.5">{story.title}</h4>
                  <div className="flex items-center gap-3">
                    <p className="text-[10px] uppercase font-bold text-slate-400">{story.read_time_minutes} MIN READ</p>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 border-l border-slate-200 pl-3">
                      <span className="flex items-center gap-1"><span className="opacity-60">👁️</span> {story.views_count || 0}</span>
                      <span className="flex items-center gap-1"><span className="opacity-60">❤️</span> {story.likes_count || 0}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-12 p-6 bg-orange-50 rounded-xl border border-orange-100 text-center space-y-4">
              <h3 className="font-serif text-xl font-bold text-orange-900">Become an Editor</h3>
              <p className="text-sm text-orange-700 leading-relaxed">Publish your educational insights and research. Reach Nepal's biggest learning community.</p>
              <Link href="?status=testing" className="block w-full bg-orange-600 text-white py-3 rounded-lg font-bold shadow-lg hover:bg-orange-700 transition-all border-none">
                  Share My Article
              </Link>
          </div>
        </aside>
      </main>

      {/* Floating Share Button */}
      <Link 
        href="?status=testing" 
        className="fixed bottom-10 right-10 z-40 bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-500 hover:to-pink-400 text-white font-bold py-4 px-8 rounded-full shadow-lg transition-all duration-300 flex items-center gap-3 hover:scale-110 border border-pink-300"
      >
        <span className="text-xl">✨</span>
        <span className="uppercase tracking-tighter text-sm text-white drop-shadow-md">Share My Article</span>
      </Link>

      {/* --- PREMIER COMING SOON MODAL --- */}
      {isTesting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-500 px-4">
          <div className="bg-white rounded-[40px] shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-300 relative">
            
            {/* GyanHub Top Banner */}
            <div className="bg-orange-600 p-10 text-center relative overflow-hidden">
                <div className="absolute inset-0 opacity-10">
                    <svg width="100%" height="100%"><defs><pattern id="pattern" width="40" height="40" patternUnits="userSpaceOnUse"><circle cx="20" cy="20" r="1.5" fill="white"/></pattern></defs><rect width="100%" height="100%" fill="url(#pattern)"/></svg>
                </div>
                <CheckCircleIcon className="w-16 h-16 text-white mx-auto mb-5 drop-shadow-lg" />
                <h2 className="text-3xl font-black text-white tracking-tight leading-tight drop-shadow-md">Feature is Currently in Development</h2>
            </div>
            
            <div className="p-10 space-y-6 text-center">
              <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-orange-50 text-orange-700 border border-orange-100 text-xs font-black uppercase tracking-widest shadow-inner">
                 <ShieldCheckIcon className="w-4 h-4" /> 
                 GyanHub Journal Exclusive
              </div>
              <p className="text-slate-600 text-base leading-relaxed font-medium">
                We are currently refining the article submission pipeline to maintain the premier educational standards of GyanHub Journal. This feature will be implemented soon to help you share your insights.
              </p>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Keep checking back with us!</p>
            </div>

            {/* Modal Footer (FIXED BUTTON UI) */}
            <div className="px-10 pb-10 pt-4 space-y-5">
              <Link 
                href="/stories" 
                className="block w-full text-center bg-[#0F172A] hover:bg-black text-white font-black py-5 rounded-2xl transition-all shadow-xl hover:-translate-y-0.5 active:scale-95 border-none"
              >
                <span className="text-white drop-shadow-sm">Got it, returning to Journal</span>
              </Link>
              <p className="text-[10px] text-slate-400 text-center font-medium leading-relaxed">You are being kept up-to-date with current GyanHub feature deployments.</p>
            </div>
            
          </div>
        </div>
      )}

    </div>
  );
}

function CheckCircleIcon({ className }: { className?: string }) {
    return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 4 4 0 0118 0z" /></svg>;
}

function ShieldCheckIcon({ className }: { className?: string }) {
    return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>;
}