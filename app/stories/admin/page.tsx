"use client";

import React, { useState } from 'react';

// Mock Data strictly matching the SQL Schema provided earlier
const mockStories = [
  {
    id: 1,
    title: "The Future of AI in Nepali Classrooms",
    author_name: "Dr. Sandeep Karki",
    category: "Research & Insights",
    status: "published",
    is_featured: true,
    views_count: 1420,
    published_at: "Mar 26, 2026",
  },
  {
    id: 2,
    title: "My Experience Teaching Python in Banepa",
    author_name: "Anita Shrestha",
    category: "Tutor Diaries",
    status: "pending_review",
    is_featured: false,
    views_count: 0,
    published_at: "-",
  },
  {
    id: 3,
    title: "Top 10 High-Demand Digital Skills for 2026",
    author_name: "GyanHub Editorial",
    category: "EdTech News",
    status: "published",
    is_featured: false,
    views_count: 856,
    published_at: "Mar 24, 2026",
  },
  {
    id: 4,
    title: "Why Standardized Testing Needs a Rethink",
    author_name: "Prof. Anil Shrestha",
    category: "Opinions",
    status: "pending_review",
    is_featured: false,
    views_count: 0,
    published_at: "-",
  },
  {
    id: 5,
    title: "Draft: Upcoming Scholarship Opportunities",
    author_name: "Admin",
    category: "Student Success",
    status: "draft",
    is_featured: false,
    views_count: 0,
    published_at: "-",
  }
];

export default function StoriesAdminDashboard() {
  const [activeTab, setActiveTab] = useState("all");

  // Filter logic based on the SQL 'status' column
  const filteredStories = mockStories.filter(story => {
    if (activeTab === "all") return true;
    return story.status === activeTab;
  });

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-800">
      
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex-shrink-0 hidden md:flex flex-col">
        <div className="h-16 flex items-center px-6 bg-slate-950 text-white font-bold text-xl tracking-wide border-b border-slate-800">
          GyanHub<span className="text-blue-500 font-normal ml-1">Admin</span>
        </div>
        <nav className="flex-1 py-6 px-4 space-y-2">
          <a href="#" className="flex items-center gap-3 px-4 py-3 bg-blue-600 text-white rounded-lg transition-colors shadow-sm">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
            Dashboard
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-3 hover:bg-slate-800 rounded-lg transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
            All Stories
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-3 hover:bg-slate-800 rounded-lg transition-colors justify-between">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              Submissions
            </div>
            <span className="bg-blue-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">2</span>
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-3 hover:bg-slate-800 rounded-lg transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
            Subscribers
          </a>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 lg:px-8">
          <h1 className="text-xl font-bold text-slate-800">Stories Management</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-slate-500 hidden sm:block">March 26, 2026</span>
            <button className="bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold py-2 px-4 rounded-lg transition-colors flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              New Post
            </button>
          </div>
        </header>

        {/* Dashboard Content Scrollable Area */}
        <div className="flex-1 overflow-auto p-6 lg:p-8">
          
          {/* Quick Stats Mapping to DB */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <p className="text-sm font-medium text-slate-500 mb-1">Total Published</p>
              <h3 className="text-3xl font-bold text-slate-900">124</h3>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <p className="text-sm font-medium text-slate-500 mb-1">Pending Reviews</p>
              <div className="flex items-center gap-3">
                <h3 className="text-3xl font-bold text-amber-600">12</h3>
                <span className="flex h-3 w-3 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                </span>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <p className="text-sm font-medium text-slate-500 mb-1">Total Article Views</p>
              <h3 className="text-3xl font-bold text-slate-900">48.2k</h3>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <p className="text-sm font-medium text-slate-500 mb-1">Newsletter Subs</p>
              <h3 className="text-3xl font-bold text-blue-600">1,204</h3>
            </div>
          </div>

          {/* Table Area */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            
            {/* Table Header & Filters */}
            <div className="px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex space-x-1 bg-slate-100 p-1 rounded-lg w-full sm:w-auto">
                <button onClick={() => setActiveTab("all")} className={`flex-1 sm:flex-none px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${activeTab === "all" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>All</button>
                <button onClick={() => setActiveTab("published")} className={`flex-1 sm:flex-none px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${activeTab === "published" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>Published</button>
                <button onClick={() => setActiveTab("pending_review")} className={`flex-1 sm:flex-none px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${activeTab === "pending_review" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>Pending</button>
                <button onClick={() => setActiveTab("draft")} className={`flex-1 sm:flex-none px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${activeTab === "draft" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>Drafts</button>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <svg className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                <input type="text" placeholder="Search stories..." className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full sm:w-64" />
              </div>
            </div>

            {/* Actual Data Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-semibold">
                    <th className="px-6 py-4">Article Details</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Metrics</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredStories.map((story) => (
                    <tr key={story.id} className="hover:bg-slate-50 transition-colors">
                      {/* Title, Author, Category */}
                      <td className="px-6 py-4">
                        <div className="flex items-start gap-3">
                          {/* Star icon mapped to is_featured boolean */}
                          <button className={`mt-1 flex-shrink-0 ${story.is_featured ? 'text-amber-400' : 'text-slate-300 hover:text-amber-400'} transition-colors`} title={story.is_featured ? "Featured Story" : "Mark as Featured"}>
                            <svg className="w-5 h-5" fill={story.is_featured ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
                          </button>
                          <div>
                            <p className="text-sm font-bold text-slate-900 mb-1">{story.title}</p>
                            <p className="text-xs text-slate-500">By <span className="font-medium text-slate-700">{story.author_name}</span> • {story.category}</p>
                          </div>
                        </div>
                      </td>

                      {/* Status Badges mapping to SQL ENUM */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        {story.status === 'published' && (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                            Published
                          </span>
                        )}
                        {story.status === 'pending_review' && (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">
                            Pending Review
                          </span>
                        )}
                        {story.status === 'draft' && (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-800 border border-slate-200">
                            Draft
                          </span>
                        )}
                      </td>

                      {/* Metrics: Views and Date */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        <div className="flex flex-col gap-1">
                          <span className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                            {story.views_count.toLocaleString()}
                          </span>
                          <span className="text-xs text-slate-400">{story.published_at}</span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-3">
                          {/* Approve Button (Only show if pending) */}
                          {story.status === 'pending_review' && (
                            <button className="text-green-600 hover:text-green-800 bg-green-50 hover:bg-green-100 p-2 rounded-lg transition-colors" title="Approve & Publish">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                            </button>
                          )}
                          {/* Edit Button */}
                          <button className="text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 p-2 rounded-lg transition-colors" title="Edit Content">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                          </button>
                          {/* Delete Button */}
                          <button className="text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 p-2 rounded-lg transition-colors" title="Delete">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {/* Empty State Fallback */}
                  {filteredStories.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                        No stories found for the selected filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Pagination Mockup */}
            <div className="bg-slate-50 border-t border-slate-200 px-6 py-3 flex items-center justify-between">
              <span className="text-sm text-slate-500">Showing <span className="font-medium text-slate-900">{filteredStories.length}</span> results</span>
              <div className="flex gap-2">
                <button className="px-3 py-1 border border-slate-300 rounded text-sm text-slate-600 bg-white hover:bg-slate-50 disabled:opacity-50" disabled>Previous</button>
                <button className="px-3 py-1 border border-slate-300 rounded text-sm text-slate-600 bg-white hover:bg-slate-50">Next</button>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}