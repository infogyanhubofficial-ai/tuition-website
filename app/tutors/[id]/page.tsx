import type { Metadata, ResolvingMetadata } from "next";
import { supabase } from "@/lib/supabase"; 
import TutorDetailClient from "./TutorDetailClient";

type Props = {
  params: Promise<{ id: string }> | { id: string };
};

// 1. DYNAMIC METADATA GENERATION
export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  // Await params to support all Next.js versions (14 & 15)
  const resolvedParams = await params;
  const rawSlug = resolvedParams.id; // e.g., "57-ram-sharma-be-civil"
  
  // [SEO FIX] Extract just the ID from the slug for the DB query
  const idString = rawSlug.split('-')[0];
  const numericId = Number(idString);

  // Fetch the specific tutor's data server-side
  const { data: tutor, error } = await supabase
    .from("tutors")
    .select("*")
    .eq("id", numericId)
    .single();

  if (error) {
    console.error("Metadata Supabase Error:", error.message);
  }

  // Fallback if the tutor ID doesn't exist or was deleted
  if (!tutor) {
    return {
      title: {
        absolute: "Tutor Not Found | GyanHub"
      },
      description: "The requested tutor profile could not be found on GyanHub.",
      alternates: {
        canonical: "https://www.gyanhub.com.np/tutors",
      },
    };
  }

  // Safely parse data for SEO strings
  const tutorName = tutor.name || "Expert Tutor";
  const location = tutor.location ? `in ${tutor.location}` : "Online";
  const avatarUrl = tutor.avatar_url || tutor.photo || "https://zuktarghyexwodqnnxlu.supabase.co/storage/v1/object/public/others/GyanHub_logo_website-removebg-preview.png";
  
  // Format subjects into a readable string
  let subjectsString = "Various Subjects";
  if (Array.isArray(tutor.subject) && tutor.subject.length > 0) {
    subjectsString = tutor.subject.join(", ");
  } else if (typeof tutor.subject === "string") {
    subjectsString = tutor.subject;
  } else if (tutor.expertise) {
    subjectsString = tutor.expertise;
  }

  const cleanBio = tutor.bio ? tutor.bio.substring(0, 150).replace(/\n/g, ' ') + "..." : `Book a session with ${tutorName} for expert tutoring ${location}.`;

  return {
    title: {
      absolute: `${tutorName} | ${subjectsString} Tutor ${location} | GyanHub`
    },
    description: cleanBio,
    keywords: [
      `${tutorName}`,
      `${subjectsString} tutor`,
      `tutor ${location}`,
      "GyanHub tutor",
      "private tuition Nepal"
    ],
    alternates: {
      // [SEO FIX] Use the full SEO slug for the canonical URL
      canonical: `https://www.gyanhub.com.np/tutors/${rawSlug}`,
    },
    openGraph: {
      title: `${tutorName} - Verified Tutor on GyanHub`,
      description: cleanBio,
      // [SEO FIX] Use the full SEO slug for social sharing
      url: `https://www.gyanhub.com.np/tutors/${rawSlug}`,
      siteName: "GyanHub",
      images: [
        {
          url: avatarUrl,
          width: 800,
          height: 800,
          alt: `${tutorName} Profile Picture`,
        },
      ],
      locale: "en_NP",
      type: "profile",
    },
    twitter: {
      card: "summary_large_image",
      title: `${tutorName} | GyanHub Tutor`,
      description: cleanBio,
      images: [avatarUrl],
    },
  };
}

// 2. SERVER COMPONENT & JSON-LD INJECTION
export default async function TutorProfilePage({ params }: Props) {
  // Await params and extract the numeric ID
  const resolvedParams = await params;
  const rawSlug = resolvedParams.id;
  const idString = rawSlug.split('-')[0];
  const numericId = Number(idString);

  // Fetch tutor again to build the Schema markup
  const { data: tutor } = await supabase
    .from("tutors")
    .select("name, bio, avatar_url, photo, subject, location, verified")
    .eq("id", numericId)
    .single();

  let jsonLd = null;

  if (tutor) {
    const tutorName = tutor.name || "Expert Tutor";
    const avatarUrl = tutor.avatar_url || tutor.photo || "https://zuktarghyexwodqnnxlu.supabase.co/storage/v1/object/public/others/GyanHub_logo_website-removebg-preview.png";
    
    jsonLd = {
      "@context": "https://schema.org",
      "@type": "ProfilePage",
      "dateCreated": new Date().toISOString(),
      "mainEntity": {
        "@type": "Person",
        "name": tutorName,
        "description": tutor.bio || `Verified tutor on GyanHub located in ${tutor.location || 'Nepal'}.`,
        "image": avatarUrl,
        "jobTitle": "Tutor",
        "homeLocation": {
          "@type": "Place",
          "name": tutor.location || "Nepal"
        },
        "worksFor": {
          "@type": "EducationalOrganization",
          "name": "GyanHub",
          "url": "https://www.gyanhub.com.np"
        }
      }
    };
  }

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <TutorDetailClient />
    </>
  );
}