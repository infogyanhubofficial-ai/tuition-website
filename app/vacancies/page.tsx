import type { Metadata } from "next";
import VacanciesPage from "./VacancyPageClient";

export const metadata: Metadata = {
  // [SEO] Highly targeted title for the main job board
  title: "Tuition Vacancies & Teaching Jobs in Nepal",
  description:
    "Browse the latest home tuition, online tutoring, and institute teaching jobs in Kathmandu and across Nepal. Apply directly to urgent tutor vacancies.",
  keywords: [
    "tuition vacancies Nepal",
    "teaching jobs Kathmandu",
    "home tuition jobs in Nepal",
    "online tutoring jobs Nepal",
    "part time teaching jobs Nepal",
    "GyanHub vacancies"
  ],
  alternates: {
    canonical: "https://www.gyanhub.com.np/vacancies",
  },
  openGraph: {
    title: "Tuition Vacancies & Teaching Jobs in Nepal",
    description: "Browse the latest home tuition and online teaching jobs across Nepal.",
    url: "https://www.gyanhub.com.np/vacancies",
    siteName: "GyanHub",
    images: [
      {
        url: "https://zuktarghyexwodqnnxlu.supabase.co/storage/v1/object/public/others/GyanHub_logo_website-removebg-preview.png",
        width: 1200,
        height: 630,
        alt: "GyanHub Tuition Vacancies List",
      },
    ],
    locale: "en_NP",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Tuition Vacancies & Teaching Jobs in Nepal",
    description: "Browse the latest home tuition and online teaching jobs across Nepal.",
    images: ["https://zuktarghyexwodqnnxlu.supabase.co/storage/v1/object/public/others/GyanHub_logo_website-removebg-preview.png"],
  },
};

export default function Page() {
  // [SEO] CollectionPage schema for the directory of job postings
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Tuition Vacancies in Nepal",
    description: "A directory of the latest home tuition and online teaching jobs in Nepal.",
    url: "https://www.gyanhub.com.np/vacancies",
    publisher: {
      "@type": "EducationalOrganization",
      name: "GyanHub",
      logo: {
        "@type": "ImageObject",
        url: "https://zuktarghyexwodqnnxlu.supabase.co/storage/v1/object/public/others/GyanHub_logo_website-removebg-preview.png"
      }
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <VacanciesPage />
    </>
  );
}