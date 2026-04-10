import type { Metadata } from "next";
import TutorsPageClient from "./TutorsPageClient";

export const metadata: Metadata = {
  // [SEO FIX] Kept to 56 characters. Perfect length for Google Search Results.
  title: "Find Verified Tutors in Nepal | Home Tuition | Online Tuition",
  description:
    "Search and connect with verified home and online tutors in Nepal. Find expert private tutors in Kathmandu and across the country for all subjects on GyanHub.",
  keywords: [
    "tutors in Nepal",
    "home tuition Nepal",
    "online tutors Nepal",
    "private tutor Kathmandu",
    "best tutors in Nepal",
    "GyanHub tutors",
    "find tutor online Nepal"
  ],
  // [SEO FIX] Prevents duplicate content penalties if accessed via /tutors/
  alternates: {
    canonical: "https://www.gyanhub.com.np/tutors",
  },
  openGraph: {
    title: "Find Verified Tutors in Nepal | Home Tuition | Online Tuition",
    description:
      "Connect with qualified home and online tutors across Nepal and Kathmandu. Filter by subject, location, and hourly rate.",
    url: "https://www.gyanhub.com.np/tutors",
    siteName: "GyanHub",
    images: [
      {
        url: "https://zuktarghyexwodqnnxlu.supabase.co/storage/v1/object/public/others/GyanHub_logo_website-removebg-preview__1_-removebg-preview.webp",
        width: 1200,
        height: 630,
        alt: "GyanHub Tutors Directory",
      },
    ],
    locale: "en_NP",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Find Verified Tutors in Nepal | GyanHub",
    description:
      "Search and connect with verified home and online tutors in Nepal.",
    images: ["https://zuktarghyexwodqnnxlu.supabase.co/storage/v1/object/public/others/GyanHub_logo_website-removebg-preview__1_-removebg-preview.webp"],
  },
};

export default function TutorsPage() {
  // [SEO FIX] CollectionPage Schema tells Google this is a directory/list of items
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Verified Tutors in Nepal",
    description: "A directory of verified home and online tutors available across Nepal and Kathmandu.",
    url: "https://www.gyanhub.com.np/tutors",
    publisher: {
      "@type": "EducationalOrganization",
      name: "GyanHub",
      logo: {
        "@type": "ImageObject",
        url: "https://zuktarghyexwodqnnxlu.supabase.co/storage/v1/object/public/others/GyanHub_logo_website-removebg-preview__1_-removebg-preview.webp"
      }
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <TutorsPageClient />
    </>
  );
}