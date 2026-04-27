import React from 'react';
import { Metadata } from 'next';

// 1. Set the page title and description for browser tabs
export const metadata: Metadata = {
  title: 'Under Maintenance | Be Right Back',
  description: 'Our site is currently undergoing scheduled maintenance.',
};

export default function MaintenancePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 font-sans">
      <div className="max-w-lg w-full bg-white rounded-2xl shadow-xl p-8 md:p-12 text-center border border-gray-100 relative overflow-hidden">
        
        {/* Optional decorative top border */}
        <div className="absolute top-0 left-0 w-full h-1 bg-blue-600" />

        {/* 2. Animated Gear Icon */}
        <div className="mb-8 flex justify-center">
          <div className="h-24 w-24 bg-blue-50 rounded-full flex items-center justify-center relative">
            <svg 
              className="w-12 h-12 text-blue-600 animate-[spin_4s_linear_infinite]" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
            </svg>
          </div>
        </div>

        {/* 3. Main Content */}
        <h1 className="text-3xl font-extrabold text-gray-900 mb-4 tracking-tight">
          We're upgrading things.
        </h1>
        
        <p className="text-gray-500 mb-8 text-lg leading-relaxed">
          We are currently performing scheduled maintenance to improve your experience. We will be back online <span className="font-semibold text-gray-900">tonight</span>. 
          <br/>Thank you for your patience!
        </p>

        {/* 4. Support / Contact Area */}
        <div className="bg-gray-50 rounded-xl p-5 border border-gray-100 flex flex-col items-center justify-center space-y-2">
          <div className="flex items-center space-x-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
            </span>
            <span className="text-sm font-medium text-gray-700">System Status: Maintenance</span>
          </div>
          
          {/* Change this email to whatever you need, or remove the block if you don't want contact info */}
          <p className="text-sm text-gray-500 mt-3">
            Need urgent assistance? Contact us at 9763695665 or {' '}
            <a href="mailto:admin@gyanhub.com.np" className="text-blue-600 font-semibold hover:underline hover:text-blue-700 transition-colors">
              admin@gyanhub.com.np
            </a>
          </p>
        </div>

      </div>
    </div>
  );
}