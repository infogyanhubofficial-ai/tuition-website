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
  }
};

export default function RecordingPage() {
  return (
    <main>
      {/* We import and render your client component here */}
      <RecordingClient />
    </main>
  );
}