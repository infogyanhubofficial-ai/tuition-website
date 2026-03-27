import React from 'react';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { Metadata, ResolvingMetadata } from 'next';
import LikeButton from './LikeButton';

export const revalidate = 60; 

// --- METADATA GENERATION FOR SOCIAL SHARING ---
export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> },
  parent: ResolvingMetadata
): Promise<Metadata> {
  const resolvedParams = await params;
  const safeSlug = decodeURIComponent(resolvedParams.slug);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get(name: string) { return undefined; } } } 
  );

  const { data: story } = await supabase
    .from('gyanhub_stories')
    .select('title, excerpt, cover_image_url, author_name')
    .eq('slug', safeSlug)
    .eq('status', 'published')
    .maybeSingle();

  if (!story) return { title: 'Story Not Found | GyanHub' };

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.gyanhub.com';

  return {
    title: `${story.title} | GyanHub`,
    description: story.excerpt,
    authors: [{ name: story.author_name }],
    openGraph: {
      title: story.title,
      description: story.excerpt,
      url: `${baseUrl}/stories/${safeSlug}`,
      siteName: 'GyanHub',
      images: [
        {
          url: story.cover_image_url,
          width: 1200, 
          height: 630, 
          alt: story.title,
        },
      ],
      locale: 'en_US',
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image', 
      title: story.title,
      description: story.excerpt,
      images: [story.cover_image_url],
    },
  };
}

// --- MAIN DATA FETCHING ---
async function getStoryDetails(slug: string) {
  const cookieStore = await cookies(); 
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get(name: string) { return cookieStore.get(name)?.value; } } }
  );

  // 1. Get Logged-in User (If any)
  const { data: { user } } = await supabase.auth.getUser();

  // 2. Fetch the main story
  const { data: story, error } = await supabase
    .from('gyanhub_stories')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .eq('is_approved', true)
    .maybeSingle();

  if (error || !story) return { story: null, relatedStories: [], user, hasLiked: false };

  // 3. Insert a view (Server-side tracking)
  await supabase.from('story_views').insert({ 
    story_id: story.id, 
    user_id: user?.id || null, // Logs the user if logged in, null if anonymous
    ip_address: 'server_render' 
  });

  // 4. Check if this specific logged-in user has already liked the story in the DB
  let hasLiked = false;
  if (user) {
    const { data: likeData } = await supabase
      .from('story_likes')
      .select('id')
      .eq('story_id', story.id)
      .eq('user_id', user.id)
      .maybeSingle();
    
    if (likeData) hasLiked = true;
  }

  // 5. Fetch related stories
  const { data: relatedStories } = await supabase
    .from('gyanhub_stories')
    .select('id, title, slug, cover_image_url, author_name, read_time_minutes, category')
    .eq('category', story.category)
    .eq('status', 'published')
    .eq('is_approved', true)
    .neq('id', story.id)
    .limit(3);

  return { story, relatedStories: relatedStories || [], user, hasLiked };
}

// --- PAGE COMPONENT ---
export default async function StoryDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const safeSlug = decodeURIComponent(resolvedParams.slug);

  const { story, relatedStories, user, hasLiked } = await getStoryDetails(safeSlug);

  if (!story) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FDFCF8] text-slate-900">
        <h1 className="text-4xl font-serif font-bold mb-4">Story Not Found</h1>
        <p className="text-slate-600 mb-8">This article may have been removed or is pending review.</p>
        <Link href="/stories" className="bg-slate-900 text-white px-6 py-3 font-serif font-bold">
          Return to The Journal
        </Link>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  const isValidUrl = (url: string) => url && typeof url === 'string' && url.startsWith('http');
  const currentViews = (story.views_count || 0) + 1; // +1 for the current page load

  return (
    <div className="min-h-screen bg-[#FDFCF8] text-slate-900 font-serif selection:bg-slate-300 pb-20 lg:pb-0 relative">
      
      {/* Interactive Floating Like Button (Glowing) */}
      <LikeButton 
        storyId={story.id} 
        initialLikes={story.likes_count || 0} 
        userId={user?.id} 
        initialHasLiked={hasLiked}
        variant="floating"
      />

      {/* 1. Minimalist Breadcrumbs */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 font-sans">
        <nav className="flex text-xs font-bold tracking-widest uppercase text-slate-400 gap-2">
          <Link href="/" className="hover:text-slate-900 transition-colors">Home</Link>
          <span>/</span>
          <Link href="/stories" className="hover:text-slate-900 transition-colors">Stories</Link>
          <span>/</span>
          <span className="text-slate-900">{story.category}</span>
        </nav>
      </div>

      {/* 2. Newspaper Header & Byline */}
      <header className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-8 border-b-2 border-slate-900">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 leading-[1.1] mb-6 tracking-tight">
          {story.title}
        </h1>
        
        <p className="text-xl sm:text-2xl text-slate-600 leading-relaxed italic mb-8">
          {story.excerpt}
        </p>
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pt-6 border-t border-slate-300">
          <div className="flex items-center gap-4">
            {isValidUrl(story.author_avatar_url) ? (
              <img src={story.author_avatar_url} alt={story.author_name} className="w-12 h-12 rounded-full object-cover grayscale" />
            ) : (
              <div className="w-12 h-12 bg-slate-900 rounded-full flex items-center justify-center text-white font-sans font-bold text-lg">
                {story.author_name?.charAt(0)?.toUpperCase() || 'A'}
              </div>
            )}
            <div className="text-left font-sans">
              <p className="font-bold text-slate-900 text-sm uppercase tracking-wide">By {story.author_name}</p>
              <p className="text-xs text-slate-500 font-medium">{story.author_profession || story.author_role || 'Contributor'}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 text-xs font-sans font-bold text-slate-500 uppercase tracking-widest">
            <span>{formatDate(story.published_at)}</span>
            <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
            <span className="flex items-center gap-1" title="Views">👁️ {currentViews}</span>
            <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
            
            {/* Inline Top Glowing Like Button */}
            <LikeButton storyId={story.id} initialLikes={story.likes_count || 0} userId={user?.id} initialHasLiked={hasLiked} variant="inline" />
          </div>
        </div>
      </header>

      {/* 3. Article Body */}
      <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <figure className="w-full sm:w-1/2 float-none sm:float-right sm:ml-8 sm:mb-6 mb-8 border border-slate-200 p-2 bg-white shadow-sm">
          <div className="aspect-[4/3] bg-slate-100 overflow-hidden relative">
            {isValidUrl(story.cover_image_url) ? (
              <img src={story.cover_image_url} alt={story.title} className="w-full h-full object-cover grayscale-[20%]" />
            ) : (
               <div className="absolute inset-0 flex items-center justify-center text-slate-400 font-sans text-xs">Image Unavailable</div>
            )}
          </div>
          <figcaption className="text-[10px] font-sans text-slate-400 mt-2 uppercase tracking-wider text-right">
            GyanHub / {story.category}
          </figcaption>
        </figure>

        <div className="text-lg text-slate-800 leading-[1.9] 
            [&>p]:mb-6 
            [&>p:first-of-type]:first-letter:text-7xl [&>p:first-of-type]:first-letter:font-black [&>p:first-of-type]:first-letter:float-left [&>p:first-of-type]:first-letter:mr-4 [&>p:first-of-type]:first-letter:mt-2
            [&>h2]:text-2xl [&>h2]:font-bold [&>h2]:text-slate-900 [&>h2]:mt-12 [&>h2]:mb-4
            [&>h3]:text-xl [&>h3]:font-bold [&>h3]:text-slate-900 [&>h3]:mt-8 [&>h3]:mb-3
            [&>blockquote]:border-l-4 [&>blockquote]:border-slate-900 [&>blockquote]:pl-6 [&>blockquote]:my-10 [&>blockquote]:text-2xl [&>blockquote]:italic [&>blockquote]:text-slate-600
            [&>ul]:list-square [&>ul]:pl-8 [&>ul]:mb-8 [&>ul>li]:mb-2
            [&>ol]:list-decimal [&>ol]:pl-8 [&>ol]:mb-8 [&>ol>li]:mb-2"
        >
          {story.content ? (
             <div dangerouslySetInnerHTML={{ __html: story.content }} />
          ) : (
            <p>Content is currently being processed. Please check back later.</p>
          )}
        </div>

        {/* Bottom Post Data & Author Bio Box */}
        <div className="mt-16 border-t-2 border-slate-900 pt-8 flex flex-col sm:flex-row justify-between items-start gap-8">
          <div className="flex-1">
            <h4 className="text-sm font-bold font-sans uppercase tracking-widest text-slate-900 mb-2">About The Author</h4>
            <p className="font-bold text-xl mb-1">{story.author_name}</p>
            <p className="text-slate-600 italic mb-4 text-sm sm:text-base">
              {story.author_bio || "Educational strategist and active contributor to the GyanHub community."}
            </p>
          </div>

          <div className="flex flex-col items-start sm:items-end gap-2 font-sans">
             <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Article Metrics</span>
             <div className="flex items-center gap-4 text-sm font-bold text-slate-700 bg-slate-100 px-4 py-2 rounded-md">
                <span className="flex items-center gap-1" title="Views">👁️ {currentViews}</span>
                
                {/* Inline Bottom Glowing Like Button */}
                <LikeButton storyId={story.id} initialLikes={story.likes_count || 0} userId={user?.id} initialHasLiked={hasLiked} variant="inline" />
             </div>
          </div>
        </div>
      </article>

      {/* 4. Read Next Section */}
      {relatedStories.length > 0 && (
        <section className="border-t border-slate-200 bg-slate-50 py-20 px-4 sm:px-6 lg:px-8 font-sans">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-xl font-black uppercase tracking-widest text-slate-900 mb-10 text-center">Related Dispatches</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {relatedStories.map((related) => (
                <Link href={`/stories/${related.slug}`} key={related.id} className="group flex flex-col">
                  <div className="w-full aspect-[4/3] bg-white border border-slate-200 mb-4 overflow-hidden relative">
                    {isValidUrl(related.cover_image_url) ? (
                      <img src={related.cover_image_url} alt={related.title} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-slate-200 text-slate-400">No Image</div>
                    )}
                  </div>
                  <h3 className="font-bold font-serif text-lg text-slate-900 leading-snug group-hover:text-blue-600 transition-colors mb-2">
                    {related.title}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-slate-500 font-bold uppercase tracking-wider mt-auto pt-2">
                    <span>{related.author_name}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}