import type { Metadata } from "next";
import { CourseDetailClient } from "./CourseDetailClient";
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
    .select("id, course_code, name, description, cover_pic, duration, faqs")
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
    name: storefront.name || syllabus.name,
    description: syllabus.description,
    cover_pic: syllabus.cover_pic,
    duration: syllabus.duration,
    faqs: syllabus.faqs,
    fee: storefront.fee,
    discount: storefront.discount,
  };
}

function getDescription(courseTitle: string, description?: string | null) {
  return (
    description ||
    `Enroll in ${courseTitle} at GyanHub. Join live online classes with expert mentors, recordings, study materials, and verified certification.`
  );
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { courseCode } = await params;
  const decodedCourseCode = decodeURIComponent(courseCode).trim();
  const course = await getCourse(decodedCourseCode);

  if (!course) {
    return {
      title: {
        absolute: "Online Course | GyanHub",
      },
    };
  }

  const courseTitle = course.title || course.name || "Online Course";
  const description = getDescription(courseTitle, course.description);
  const courseUrl = `${siteUrl}/onlinecourse/${encodeURIComponent(
    course.course_code
  )}`;

  return {
    title: {
      absolute: `${courseTitle} | GyanHub`,
    },
    description,
    alternates: {
      canonical: courseUrl,
    },
    openGraph: {
      title: `${courseTitle} | GyanHub`,
      description,
      url: courseUrl,
      siteName: "GyanHub",
      images: [
        {
          url: course.cover_pic || fallbackImage,
          width: 1200,
          height: 630,
          alt: `${courseTitle} by GyanHub`,
        },
      ],
      locale: "en_NP",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${courseTitle} | GyanHub`,
      description,
      images: [course.cover_pic || fallbackImage],
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function Page({ params }: PageProps) {
  const { courseCode } = await params;
  const decodedCourseCode = decodeURIComponent(courseCode).trim();
  const course = await getCourse(decodedCourseCode);

  const courseTitle = course?.title || course?.name || "Online Course";
  const description = course
    ? getDescription(courseTitle, course.description)
    : "Live online course by GyanHub.";
  const courseUrl = `${siteUrl}/onlinecourse/${encodeURIComponent(
    course?.course_code || decodedCourseCode
  )}`;

  const jsonLd = course
    ? {
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "Course",
            name: courseTitle,
            description,
            image: course.cover_pic || fallbackImage,
            url: courseUrl,
            provider: {
              "@type": "EducationalOrganization",
              name: "GyanHub",
              url: siteUrl,
            },
            offers: {
              "@type": "Offer",
              price: Number(course.fee || 0),
              priceCurrency: "NPR",
              availability: "https://schema.org/InStock",
              url: courseUrl,
            },
            courseMode: "Online",
            timeRequired: course.duration || undefined,
          },
          {
            "@type": "BreadcrumbList",
            itemListElement: [
              {
                "@type": "ListItem",
                position: 1,
                name: "Home",
                item: siteUrl,
              },
              {
                "@type": "ListItem",
                position: 2,
                name: "Online Courses",
                item: `${siteUrl}/onlinecourse`,
              },
              {
                "@type": "ListItem",
                position: 3,
                name: courseTitle,
                item: courseUrl,
              },
            ],
          },
        ],
      }
    : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}

      <CourseDetailClient
        params={Promise.resolve({
          courseCode: decodedCourseCode,
        })}
      />
    </>
  );
}