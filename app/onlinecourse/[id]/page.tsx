// app/onlinecourse/[id]/page.tsx
import { CourseDetailClient } from "./CourseDetailClient";

// 1. Generate Metadata for Social Media Link Previews
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const decodedCourseName = decodeURIComponent(resolvedParams.id);
  
  try {
    // Note: Server components require absolute URLs for fetch.
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.gyanhub.com.np';
    const res = await fetch(`${baseUrl}/api/online-courses/${encodeURIComponent(decodedCourseName)}`);
    
    if (!res.ok) {
      return { title: 'Course Not Found | GyanHub' };
    }
    
    const course = await res.json();

    return {
      title: `${course.title} | GyanHub Online Courses`,
      description: `Enroll in ${course.title} at GyanHub. Connect with the best tutors in Nepal.`,
      openGraph: {
        title: `${course.title} | GyanHub`,
        description: `Enroll in ${course.title} at GyanHub. Connect with the best tutors in Nepal.`,
        url: `${baseUrl}/onlinecourse/${encodeURIComponent(decodedCourseName)}`,
        siteName: 'GyanHub',
        images: [
          {
            url: course.cover_pic, // Must be an absolute URL in your DB
            width: 1200,
            height: 630,
            alt: course.title,
          },
        ],
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title: course.title,
        description: `Enroll in ${course.title} at GyanHub. Connect with the best tutors in Nepal.`,
        images: [course.cover_pic],
      },
    };
  } catch (error) {
    return {
      title: 'GyanHub Online Courses',
    };
  }
}

// 2. Render the interactive Client Component
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  return <CourseDetailClient params={params} />;
}