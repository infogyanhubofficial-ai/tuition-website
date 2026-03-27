import React from 'react';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import NewStoryModal from '@/components/NewStoryModal'; // Make sure to create this component!

// --- Helper Functions ---
function timeAgo(dateString: string) {
  if (!dateString) return "just now";
  const date = new Date(dateString);
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  let interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + " days ago";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + " hours ago";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + " minutes ago";
  return Math.floor(seconds) + " seconds ago";
}

function formatNumber(num: number) {
  if (!num) return "0";
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

// --- Main Server Component ---
export default async function EditorDashboard({ 
  searchParams 
}: { 
  searchParams: Promise<{ tab?: string; action?: string; storyId?: string }> 
}) {
  // 1. Await cookies (Required in Next.js 15+)
  const cookieStore = await cookies(); 
  
  // 2. Initialize Supabase Server Client safely
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
      },
    }
  );

  // 3. Strict Server-Side Authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    // FIXED: Routes through the unified Hub and Spoke login system
    redirect('/login?next=/stories/dashboard'); 
  }

  // Extract user's name safely
  const userName = user.user_metadata?.full_name || user.email?.split('@')[0] || "Author";
  const firstName = userName.split(' ')[0];

  // 4. Fetch Personalized Data (Only stories matching this exact user ID)
  const { data: storiesData, error: dbError } = await supabase
    .from('gyanhub_stories')
    .select('id, title, slug, status, updated_at, views_count, likes_count, comments_count, shares_count')
    .eq('author_id', user.id) 
    .order('updated_at', { ascending: false });

  if (dbError) {
    console.error("Database Error Fetching Stories:", dbError.message);
  }

  const stories = storiesData || [];

  // 5. Calculate Activity Metrics
  const publishedCount = stories.filter(s => s.status === 'published').length;
  const pendingCount = stories.filter(s => s.status === 'pending').length;
  // Treat null status as a draft for newly initialized auto-saves
  const draftCount = stories.filter(s => s.status === 'draft' || s.status === null).length;

  const totalViews = stories.reduce((sum, story) => sum + (story.views_count || 0), 0);
  const totalEngagement = stories.reduce((sum, story) => 
    sum + (story.likes_count || 0) + (story.comments_count || 0) + (story.shares_count || 0), 0
  );

  // 6. Handle URL Parameters for Modals & Tabs
  const resolvedSearchParams = await searchParams;
  const activeTab = resolvedSearchParams?.tab || 'all';
  const showModal = resolvedSearchParams?.action === 'new' || resolvedSearchParams?.action === 'edit';
  const editingStoryId = resolvedSearchParams?.storyId;
  
  const filteredStories = stories.filter(story => {
    if (activeTab === 'all') return true;
    if (activeTab === 'drafts') return story.status === 'draft' || story.status === 'pending' || story.status === null;
    if (activeTab === 'published') return story.status === 'published';
    return true;
  });

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900 flex relative">
      
      {/* --- RENDER MODAL OVERLAY --- */}
      {showModal && <NewStoryModal userId={user.id} storyId={editingStoryId} />}

      {/* --- SLIM SIDEBAR --- */}
      <aside className="w-20 bg-white border-r border-slate-200 flex flex-col items-center py-8 justify-between hidden md:flex shrink-0 z-10 sticky top-0 h-screen">
        <div className="space-y-8 flex flex-col items-center w-full">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-md">
            G
          </div>
          <nav className="flex flex-col gap-6 w-full items-center">
            <Link href="/stories/dashboard" className="p-3 bg-blue-50 text-blue-600 rounded-xl transition-colors relative group" title="Dashboard">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
            </Link>
            <Link href="/profile" className="p-3 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-colors" title="My Profile">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
            </Link>
          </nav>
        </div>
        <form action="/auth/signout" method="post">
          <button type="submit" className="p-3 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors" title="Log Out">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
          </button>
        </form>
      </aside>

      {/* --- MAIN WORKSPACE --- */}
      <main className="flex-1 flex flex-col max-w-6xl mx-auto w-full px-4 sm:px-8 py-8 h-screen overflow-y-auto">
        
        {/* Personalized Header */}
        <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-10">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Welcome back, {firstName}!</h1>
            <p className="text-slate-500 mt-1 text-lg">Ready to share some Gyan today?</p>
          </div>
          {/* UPDATED: Triggers the new Modal via URL parameter */}
          <Link href="?action=new" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-all shadow-sm shadow-blue-600/20 flex items-center justify-center gap-2 shrink-0 border-none hover:-translate-y-0.5">
            <span className="text-xl leading-none">✍️</span> Write New Story
          </Link>
        </header>

        {/* Analytics Strip */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex items-center gap-5 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Your Total Reads</p>
              <p className="text-2xl font-black text-slate-900">{formatNumber(totalViews)}</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex items-center gap-5 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Total Engagement</p>
              <p className="text-2xl font-black text-slate-900">{formatNumber(totalEngagement)}</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex items-center gap-5 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Published</p>
              <p className="text-2xl font-black text-slate-900">{publishedCount}</p>
            </div>
          </div>
        </section>

        {/* Tabbed Workspace */}
        <div className="border-b border-slate-200 mb-6 flex justify-between items-end">
          <nav className="flex space-x-8">
            <Link href="?tab=all" className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'all' ? 'border-blue-600 text-blue-900' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}>
              All Stories ({stories.length})
            </Link>
            <Link href="?tab=drafts" className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'drafts' ? 'border-blue-600 text-blue-900' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}>
              Drafts & In Review ({draftCount + pendingCount})
            </Link>
            <Link href="?tab=published" className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'published' ? 'border-blue-600 text-blue-900' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}>
              Published ({publishedCount})
            </Link>
          </nav>
        </div>

        {/* Article List */}
        <div className="space-y-4 pb-12">
          {filteredStories.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-300 flex flex-col items-center shadow-sm">
              <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
              </div>
              <p className="text-xl font-bold text-slate-900 mb-2">No stories here yet</p>
              <p className="text-sm text-slate-500 max-w-sm mb-6">Start writing to share your knowledge with the GyanHub community.</p>
              <Link href="?action=new" className="bg-slate-900 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-slate-800 transition-colors">
                Start Writing
              </Link>
            </div>
          ) : (
            filteredStories.map((story) => (
              <div key={story.id} className="group bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center gap-5 transition-all hover:shadow-md hover:border-blue-200">
                
                <div className="w-full md:w-32 h-20 bg-slate-50 rounded-xl shrink-0 border border-slate-100 flex items-center justify-center text-slate-300 overflow-hidden">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    {(!story.status || story.status === 'draft') && <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] uppercase font-black tracking-wider bg-slate-100 text-slate-600">⚪ Draft</span>}
                    {story.status === 'pending' && <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] uppercase font-black tracking-wider bg-amber-100 text-amber-700 border border-amber-200">🟡 In Review</span>}
                    {story.status === 'published' && <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] uppercase font-black tracking-wider bg-emerald-100 text-emerald-700 border border-emerald-200">🟢 Published</span>}
                    
                    <span className="text-xs text-slate-400 font-medium">
                      {story.status === 'published' ? 'Published ' : 'Last updated '}
                      {timeAgo(story.updated_at)}
                    </span>
                  </div>
                  
                  <h3 className="text-lg font-bold text-slate-900 truncate mb-1.5 group-hover:text-blue-600 transition-colors">{story.title || "Untitled Draft"}</h3>

                  {story.status === 'published' && (
                    <div className="flex items-center gap-4 text-sm font-semibold text-slate-500">
                      <span className="flex items-center gap-1.5" title="Likes">❤️ {story.likes_count || 0}</span>
                      <span className="flex items-center gap-1.5" title="Comments">💬 {story.comments_count || 0}</span>
                      <span className="flex items-center gap-1.5" title="Shares">↗️ {story.shares_count || 0}</span>
                      <span className="flex items-center gap-1.5 text-slate-400 ml-2 border-l pl-4 border-slate-200" title="Views">👁️ {formatNumber(story.views_count || 0)} views</span>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-2 w-full md:w-auto justify-end mt-4 md:mt-0 pt-4 md:pt-0 border-t md:border-none border-slate-100 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                  {story.status === 'published' ? (
                    <>
                      <button disabled className="px-4 py-2 text-sm font-semibold text-slate-400 bg-slate-50 border border-slate-200 rounded-lg flex items-center gap-2 cursor-not-allowed" title="Published stories cannot be edited">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                        Locked
                      </button>
                      <Link href={`/stories/${story.slug}`} className="px-4 py-2 text-sm font-semibold text-blue-600 bg-blue-50 border border-blue-100 rounded-lg hover:bg-blue-100 flex items-center gap-2 transition-colors">
                        View Live
                      </Link>
                    </>
                  ) : (
                    <>
                      {/* UPDATED: Triggers Modal to open with existing Story ID */}
                      <Link href={`?action=edit&storyId=${story.id}`} className="px-4 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-blue-600 flex items-center gap-2 transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                        Continue Editing
                      </Link>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}