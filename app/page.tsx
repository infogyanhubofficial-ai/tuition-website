import type { Metadata } from "next";
import HomeClient from "./HomeClient";

const siteUrl = "https://www.gyanhub.com.np";
// Keep this for OpenGraph/Social Media previews
const logoUrl =
  "https://zuktarghyexwodqnnxlu.supabase.co/storage/v1/object/public/others/GyanHub_logo_website-removebg-preview__1_-removebg-preview.webp";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),

  // Changed: Removed the slogan pipe to prevent it from being indexed as a separate sitelink
  title: "GyanHub | Online Courses & Verified Tutors in Nepal",

  description:
    "GyanHub is Nepal’s all-in-one learning platform for online courses, recorded courses, verified tutors, tuition vacancies, certificate verification, and job-ready engineering training in AutoCAD, GIS, QGIS, Revit, ETABS, SAFE, RCDC, SolidWorks, estimation, costing, billing, and property valuation.",

  keywords: [
    "GyanHub",
    "GyanHub Nepal",
    "online courses Nepal",
    "recorded courses Nepal",
    "live online courses Nepal",
    "find tutors Nepal",
    "verified tutors Nepal",
    "home tuition Nepal",
    "online tutors Nepal",
    "tuition vacancy Nepal",
    "post tuition Nepal",
    "certificate verification Nepal",
    "engineering courses Nepal",
    "civil engineering courses Nepal",
    "AutoCAD course Nepal",
    "GIS training Nepal",
    "ArcGIS course Nepal",
    "QGIS training Nepal",
    "Revit BIM course Nepal",
    "ETABS training Nepal",
    "SAFE training Nepal",
    "RCDC training Nepal",
    "structural design course Nepal",
    "SolidWorks course Nepal",
    "estimation costing course Nepal",
    "contract billing course Nepal",
    "property valuation course Nepal",
    "architecture visualization course Nepal",
    "SketchUp course Nepal",
    "Enscape course Nepal",
    "job ready skills Nepal",
    "professional training Nepal",
    "skill development Nepal",
  ],

  authors: [{ name: "GyanHub" }],
  creator: "GyanHub",
  publisher: "GyanHub",
  category: "Education",

  // FIXED: Updated icon paths to your local /public/images folder
  icons: {
    icon: [
      { url: "/images/favicon.ico" },
      { url: "/images/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/images/icon.png", sizes: "512x512", type: "image/png" }, // This fixes the zoomed look
    ],
    apple: [
      { url: "/images/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  
  // Added: Connects your webmanifest
  manifest: "/images/site.webmanifest",

  alternates: {
    canonical: siteUrl,
  },

  openGraph: {
    title: "GyanHub | Online Courses & Verified Tutors",
    description:
      "Find verified tutors, post tuition requests, join live courses, access recorded courses, and learn job-ready skills with GyanHub.",
    url: siteUrl,
    siteName: "GyanHub",
    images: [
      {
        url: logoUrl,
        width: 1200,
        height: 630,
        alt: "GyanHub - Learn Today | Lead Tomorrow",
      },
    ],
    locale: "en_NP",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "GyanHub | Online Courses & Verified Tutors",
    description:
      "Nepal’s learning platform for tutors, live courses, recorded courses, and engineering training.",
    images: [logoUrl],
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
    },
  },
};

export default function Page() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "EducationalOrganization",
        "@id": `${siteUrl}/#organization`,
        name: "GyanHub",
        url: siteUrl,
        // Using the local high-res icon for Google's Knowledge Graph
        logo: `${siteUrl}/images/icon.png`,
        slogan: "Learn Today | Lead Tomorrow",
        description:
          "GyanHub is a Nepal-based learning platform offering online courses, recorded courses, verified tutors, and professional skill training.",
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
          "https://www.tiktok.com/@gyanhubofficial",
        ],
      },
      {
        "@type": "WebSite",
        "@id": `${siteUrl}/#website`,
        url: siteUrl,
        name: "GyanHub",
        publisher: {
          "@id": `${siteUrl}/#organization`,
        },
        potentialAction: {
          "@type": "SearchAction",
          target: `${siteUrl}/recording?search={search_term_string}`,
          "query-input": "required name=search_term_string",
        },
      },
      {
        "@type": "ItemList",
        name: "GyanHub Services",
        itemListElement: [
          "Find Verified Tutors",
          "Post Tuition Requests",
          "Live Online Courses",
          "Recorded Courses",
          "Certificate Verification",
          "Become a Tutor",
          "Engineering Skill Training",
        ].map((name, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name,
        })),
      },
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