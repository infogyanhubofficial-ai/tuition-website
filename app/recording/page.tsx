import React from 'react';
import { Metadata } from 'next';
import RecordingClient from './RecordingClient';

// --- SEO METADATA FOR THE MAIN LISTING PAGE ---
export const metadata: Metadata = {
  title: 'Premium Course Recordings | Learn at Your Own Pace',
  description: 'Browse our exclusive catalog of premium recorded courses taught by industry experts. Get lifetime access instantly.',
  openGraph: {
    title: 'Premium Course Recordings',
    description: 'Browse our exclusive catalog of premium recorded courses taught by industry experts.',
    type: 'website',
    images: [
      {
        url: 'https://zuktarghyexwodqnnxlu.supabase.co/storage/v1/object/public/others/Recording.webp',
        width: 1200,
        height: 630,
        alt: 'Premium Course Recordings Link Preview Image',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Premium Course Recordings',
    description: 'Browse our exclusive catalog of premium recorded courses taught by industry experts.',
    images: ['https://zuktarghyexwodqnnxlu.supabase.co/storage/v1/object/public/others/Recording.webp'],
  },
};

export default function RecordingPage() {
  return (
    <main>
      {/* We import and render your client component here */}
      <RecordingClient />
    </main>
  );
}