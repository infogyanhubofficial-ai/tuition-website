// app/onlinecourse/[courseCode]/enroll/page.tsx
import type { Metadata } from "next";
import CourseEnrollmentClient from "./CourseEnrollmentClient";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const siteUrl = "https://www.gyanhub.com.np";

const fallbackImage =
  "https://zuktarghyexwodqnnxlu.supabase.co/storage/v1/object/public/others/GyanHub_logo_website-removebg-preview__1_-removebg-preview.webp";

type PageProps = {
  params: Promise<{ courseCode: string }>;
};

async function getCourse(courseCode: string) {
  const { data: syllabus } = await supabase
    .from("syllabi_v2")
    .select("id, course_code, name, description, cover_pic")
    .ilike("course_code", courseCode)
    .maybeSingle();

  if (!syllabus) return null;

  const { data: storefront } = await supabase
    .from("online_courses_v2")
    .select("name, fee, discount, is_active")
    .eq("syllabus_id", syllabus.id)
    .eq("is_active", true)
    .maybeSingle();

  if (!storefront) return null;

  return {
    course_code: syllabus.course_code,
    title: storefront.name || syllabus.name,
    description: syllabus.description,
    cover_pic: syllabus.cover_pic,
    fee: storefront.fee,
    discount: storefront.discount,
  };
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { courseCode } = await params;
  const decodedCourseCode = decodeURIComponent(courseCode).trim();
  const course = await getCourse(decodedCourseCode);

  const courseTitle = course?.title || "Online Course";
  const enrollUrl = `${siteUrl}/onlinecourse/${encodeURIComponent(
    course?.course_code || decodedCourseCode
  )}/enroll`;

  const description = `Enroll for ${courseTitle} at GyanHub. Secure your seat for live online training with expert mentors, recordings, study materials, and verified certification.`;

  return {
    title: {
      absolute: "Enrollment for Online Course | GyanHub",
    },

    description,

    alternates: {
      canonical: enrollUrl,
    },

    openGraph: {
      title: "Enrollment for Online Course | GyanHub",
      description,
      url: enrollUrl,
      siteName: "GyanHub",
      images: [
        {
          url: course?.cover_pic || fallbackImage,
          width: 1200,
          height: 630,
          alt: `${courseTitle} Enrollment by GyanHub`,
        },
      ],
      locale: "en_NP",
      type: "website",
    },

    twitter: {
      card: "summary_large_image",
      title: "Enrollment for Online Course | GyanHub",
      description,
      images: [course?.cover_pic || fallbackImage],
    },

    robots: {
      index: true,
      follow: true,
    },
  };
}

export default function EnrollmentPage() {
  return <CourseEnrollmentClient />;
}