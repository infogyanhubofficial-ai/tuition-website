import type { Metadata, ResolvingMetadata } from "next";
import { supabase } from "@/lib/supabase"; 
import VacancyDetailClient from "./VacancyDetailClient";

type Props = {
  params: Promise<{ id: string }> | { id: string };
};

// 1. DYNAMIC METADATA GENERATION
export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  // Await params to support Next.js 15+ 
  const resolvedParams = await params;
  const rawSlug = resolvedParams.id; // e.g., "57-applied-mechanics-kathmandu"
  
  // [SEO FIX] Extract just the numeric ID for the DB query
  const idString = rawSlug.split('-')[0];
  const numericId = Number(idString);

  // Fetch the specific vacancy data server-side
  const { data: vacancy, error } = await supabase
    .from("vacancies")
    .select("*")
    .eq("id", numericId)
    .single();

  if (error) {
    console.error("Vacancy Metadata Error:", error.message);
  }

  // Fallback if the vacancy ID doesn't exist or was deleted
  if (!vacancy || vacancy.status === false) {
    return {
      title: {
        absolute: "Vacancy Not Found | GyanHub"
      },
      description: "The requested tuition vacancy is no longer available on GyanHub.",
      alternates: {
        canonical: "https://www.gyanhub.com.np/vacancies",
      },
    };
  }

  // Safely parse data for SEO strings
  const subject = vacancy.subject || "Tuition";
  const location = vacancy.location || "Nepal";
  const teachingMode = vacancy.mode_of_teaching || vacancy.tuition_type || "Home/Online";
  const isUrgent = vacancy.urgent === true || String(vacancy.urgent).toLowerCase() === 'true' ? " [URGENT]" : "";

  // Create a clean, SEO-friendly description snippet (max ~155 chars for Google)
  const rawDescription = vacancy.description || `Apply for this ${subject} tuition vacancy in ${location} via GyanHub.`;
  const cleanDescription = rawDescription.substring(0, 155).replace(/\n/g, ' ') + "...";

  return {
    title: {
      absolute: `${subject} Tutor Wanted in ${location}${isUrgent} | GyanHub`
    },
    description: cleanDescription,
    keywords: [
      `${subject} tutor wanted`,
      `tuition jobs in ${location}`,
      `${subject} tuition ${location}`,
      `${teachingMode} teaching jobs Nepal`,
      "GyanHub vacancies",
      "home tuition jobs Kathmandu",
      "part time teaching Nepal"
    ],
    alternates: {
      // [SEO FIX] Use the full SEO slug for the canonical URL
      canonical: `https://www.gyanhub.com.np/vacancies/${rawSlug}`,
    },
    openGraph: {
      title: `${subject} Tutor Wanted in ${location} | GyanHub`,
      description: cleanDescription,
      url: `https://www.gyanhub.com.np/vacancies/${rawSlug}`,
      siteName: "GyanHub",
      images: [
        {
          url: "https://zuktarghyexwodqnnxlu.supabase.co/storage/v1/object/public/others/GyanHub_logo_website-removebg-preview__1_-removebg-preview.webp",
          width: 1200,
          height: 630,
          alt: `Tuition Vacancy for ${subject} in ${location}`,
        },
      ],
      locale: "en_NP",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `Tutor Wanted: ${subject} in ${location}`,
      description: cleanDescription,
      images: ["https://zuktarghyexwodqnnxlu.supabase.co/storage/v1/object/public/others/GyanHub_logo_website-removebg-preview__1_-removebg-preview.webp"],
    },
  };
}

// 2. SERVER COMPONENT & JOB POSTING JSON-LD INJECTION
export default async function VacancyProfilePage({ params }: Props) {
  // Await params and extract the numeric ID
  const resolvedParams = await params;
  const rawSlug = resolvedParams.id;
  const idString = rawSlug.split('-')[0];
  const numericId = Number(idString);

  // Fetch vacancy again to build the Schema markup
  const { data: vacancy } = await supabase
    .from("vacancies")
    .select("*")
    .eq("id", numericId)
    .single();

  let jsonLd = null;

  if (vacancy && vacancy.status !== false) {
    const subject = vacancy.subject || "Tuition Vacancy";
    
    // Determine if the job is remote for Google Jobs Schema
    const modeString = (vacancy.mode_of_teaching || vacancy.tuition_type || "").toLowerCase();
    const locString = (vacancy.location || "").toLowerCase();
    const isOnline = modeString.includes("online") || locString.includes("online") || locString.includes("remote");
    
    const postedDate = vacancy.created_at ? new Date(vacancy.created_at).toISOString() : new Date().toISOString();
    
    // Google Jobs REQUIRES a validThrough date. We default to 30 days from posting.
    const validThroughDate = new Date(postedDate);
    validThroughDate.setDate(validThroughDate.getDate() + 30);

    // JobPosting Schema tells Google Jobs to list this directly in their job search UI
    jsonLd = {
      "@context": "https://schema.org",
      "@type": "JobPosting",
      "title": `${subject} Tutor`,
      "description": vacancy.description || `Tutor required for ${subject} in ${vacancy.location || 'Nepal'}. Apply via GyanHub.`,
      "datePosted": postedDate,
      "validThrough": validThroughDate.toISOString(),
      "employmentType": "PART_TIME",
      "hiringOrganization": {
        "@type": "Organization",
        "name": "GyanHub",
        "sameAs": "https://www.gyanhub.com.np",
        "logo": "https://zuktarghyexwodqnnxlu.supabase.co/storage/v1/object/public/others/GyanHub_logo_website-removebg-preview__1_-removebg-preview.webp"
      },
      "jobLocation": {
        "@type": "Place",
        "address": {
          "@type": "PostalAddress",
          "addressLocality": isOnline ? "Remote" : (vacancy.location || "Nepal"),
          "addressCountry": "NP"
        }
      },
      "jobLocationType": isOnline ? "TELECOMMUTE" : undefined,
      "baseSalary": vacancy.salary_range ? {
        "@type": "MonetaryAmount",
        "currency": "NPR",
        "value": {
          "@type": "QuantitativeValue",
          "value": vacancy.salary_range.replace(/[^0-9-]/g, ''), // Strip out "Rs." for schema
          "unitText": "MONTH"
        }
      } : undefined
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
      {/* Client component handles the interactivity and client-side fetching */}
      <VacancyDetailClient />
    </>
  );
}