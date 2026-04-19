import type { Metadata } from "next";
import HomeClient from "./HomeClient";

export const metadata: Metadata = {
  // [SEO FIX] Shortened title to ~60 characters to prevent Google truncation
  title: "GyanHub | Courses & Tutors in Nepal",
  description:
    "Learn AutoCAD, SketchUp, GIS, ETABS, SAFE, RCDC, Revit BIM, estimation costing, structural design, and more in Nepal. Find verified tutors or join online and recorded courses on GyanHub.",
  keywords: [
    "AutoCAD course Nepal",
    "GIS training Nepal",
    "Revit BIM course Nepal",
    "ETABS training Nepal",
    "SketchUp course Nepal",
    "Enscape training Nepal",
    "estimation costing course Nepal",
    "structural design course Nepal",
    "property valuation course Nepal",
    "SolidWorks training Nepal",
    "online courses Nepal",
    "recorded courses Nepal",
    "tutors in Nepal",
    "home tuition Nepal",
    "GyanHub"
  ],
  // [SEO FIX] Added canonical URL to prevent duplicate content penalties
  alternates: {
    canonical: "https://www.gyanhub.com.np",
  },
  openGraph: {
    title: "GyanHub | Courses & Tutors in Nepal",
    description:
      "Join practical training in AutoCAD, GIS, ETABS, Revit BIM, and more. Find tutors or enroll in online and recorded courses with GyanHub.",
    url: "https://www.gyanhub.com.np",
    siteName: "GyanHub",
    images: [
      {
        url: "https://zuktarghyexwodqnnxlu.supabase.co/storage/v1/object/public/others/GyanHub_logo_website-removebg-preview__1_-removebg-preview.webp",
        width: 1200,
        height: 630,
        alt: "GyanHub Courses and Tutors",
      },
    ],
    locale: "en_NP",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "GyanHub | Courses & Tutors in Nepal",
    description:
      "Learn in-demand skills with GyanHub. Explore tutors and professional courses in Nepal.",
    images: ["https://zuktarghyexwodqnnxlu.supabase.co/storage/v1/object/public/others/GyanHub_logo_website-removebg-preview__1_-removebg-preview.webp"],
  },
  metadataBase: new URL("https://www.gyanhub.com.np"),
};

export default function Page() {
  // [SEO FIX] Added exact social links and WhatsApp contact point to Schema
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    name: "GyanHub",
    url: "https://www.gyanhub.com.np",
    logo: "https://zuktarghyexwodqnnxlu.supabase.co/storage/v1/object/public/others/GyanHub_logo_website-removebg-preview__1_-removebg-preview.webp",
    description: "Online learning and tutor discovery platform in Nepal offering engineering courses, AutoCAD, GIS, and private tutoring.",
    address: {
      "@type": "PostalAddress",
      addressCountry: "NP",
    },
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+977-9763695665",
      contactType: "customer service",
      availableLanguage: ["English", "Nepali"]
    },
    sameAs: [
      "https://www.facebook.com/dashboard.php?id=61569757534336",
      "https://www.youtube.com/@GyanHubOnline",
      "https://www.instagram.com/gyanhubonline/?next=%2F",
      "https://www.linkedin.com/company/gyanhub/",
      "https://www.tiktok.com/@gyanhubofficial"
    ]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <HomeClient />
    </>
  );
}