import React from 'react';
import { Metadata } from 'next';
import OnlineCoursesPage from './OnlineCourseClient';

// --- SEO METADATA FOR THE MAIN LISTING PAGE ---
export const metadata: Metadata = {
  title: 'Live Online Courses | Master New Skills',
  description: 'Level up your skills with industry-leading experts. High-quality, interactive live online classes designed for your career success.',
  openGraph: {
    title: 'Live Online Courses & Bootcamps',
    description: 'Browse our upcoming live, interactive online courses taught by industry professionals.',
    type: 'website',
  }
};

export default function Page() {
  return (
    <main>
      {/* Render the interactive client component */}
      <OnlineCoursesPage />
    </main>
  );
}