// app/onlinecourse/[id]/enroll/page.tsx
import { Metadata } from 'next';
import CourseEnrollmentClient from './CourseEnrollmentClient';

type Props = {
  params: { id: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const courseId = decodeURIComponent(params.id);
  
  try {
    // Note: Server-side fetch requires an absolute URL. 
    // Ensure NEXT_PUBLIC_SITE_URL is set in your .env (e.g., https://www.gyanhub.com.np)
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.gyanhub.com.np';
    const res = await fetch(`${siteUrl}/api/online_courses/${encodeURIComponent(courseId)}`, {
      next: { revalidate: 60 } 
    });
    
    if (!res.ok) throw new Error("Course not found");
    const course = await res.json();

    return {
      title: `Enrollment | ${course.title}`,
      description: "Secure your seat for this industry-level training course at GyanHub.",
      openGraph: {
        title: `Enrollment | ${course.title}`,
        description: "Secure your seat for this industry-level training course at GyanHub.",
        url: `${siteUrl}/onlinecourse/${encodeURIComponent(courseId)}/enroll`,
        siteName: 'GyanHub',
        images: course.cover_pic ? [
          {
            url: course.cover_pic, // Ensure your DB stores the full absolute URL for images
            width: 1200,
            height: 630,
            alt: course.title,
          }
        ] : [],
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title: `Enrollment | ${course.title}`,
        images: course.cover_pic ? [course.cover_pic] : [],
      }
    };
  } catch (error) {
    return {
      title: 'Course Enrollment | GyanHub',
    };
  }
}

export default function EnrollmentPage() {
  return <CourseEnrollmentClient />;
}