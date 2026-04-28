import type { Metadata } from "next";
import HomeClient from "./HomeClient";

export const metadata: Metadata = {
  title: "GyanHub | Online Courses & Tutors in Nepal",
  
  description:
    "GyanHub is a Nepal-based learning platform offering online and recorded courses in AutoCAD, GIS, Revit, and engineering skills. Find verified tutors or enroll in practical training designed for students and professionals.",
  
  keywords: [
    "online courses Nepal",
    "engineering courses Nepal",
    "AutoCAD course Nepal",
    "GIS training Nepal",
    "Revit course Nepal",
    "structural design course Nepal",
    "ETABS training Nepal",
    "recorded courses Nepal",
    "find tutors Nepal",
    "home tuition Nepal",
    "GyanHub Nepal"
  ],

  alternates: {
    canonical: "https://www.gyanhub.com.np",
  },

  openGraph: {
    title: "GyanHub | Online Courses & Tutors in Nepal",
    description:
      "Explore practical online courses and find verified tutors in Nepal. Learn AutoCAD, GIS, Revit, structural design, and more with GyanHub.",
    url: "https://www.gyanhub.com.np",
    siteName: "GyanHub",
    images: [
      {
        url: "https://zuktarghyexwodqnnxlu.supabase.co/storage/v1/object/public/others/GyanHub_logo_website-removebg-preview__1_-removebg-preview.webp",
        width: 1200,
        height: 630,
        alt: "GyanHub - Online Courses and Tutors in Nepal",
      },
    ],
    locale: "en_NP",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "GyanHub | Online Courses & Tutors in Nepal",
    description:
      "Learn practical skills and connect with tutors in Nepal. Join GyanHub for online and recorded courses.",
    images: [
      "https://zuktarghyexwodqnnxlu.supabase.co/storage/v1/object/public/others/GyanHub_logo_website-removebg-preview__1_-removebg-preview.webp",
    ],
  },

  metadataBase: new URL("https://www.gyanhub.com.np"),
};

export default function Page() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    name: "GyanHub",
    url: "https://www.gyanhub.com.np",
    logo: "https://zuktarghyexwodqnnxlu.supabase.co/storage/v1/object/public/others/GyanHub_logo_website-removebg-preview__1_-removebg-preview.webp",
    
    description:
      "GyanHub is an online learning and tutor marketplace in Nepal offering engineering courses, recorded training, and tutor discovery services.",
    
    address: {
      "@type": "PostalAddress",
      addressCountry: "NP",
    },

    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+977-9813111857",
      contactType: "customer support",
      availableLanguage: ["English", "Nepali"],
    },

    sameAs: [
      "https://www.facebook.com/dashboard.php?id=61569757534336",
      "https://www.youtube.com/@GyanHubOnline",
      "https://www.instagram.com/gyanhubonline/",
      "https://www.linkedin.com/company/gyanhub/",
      "https://www.tiktok.com/@gyanhubofficial"
    ],
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