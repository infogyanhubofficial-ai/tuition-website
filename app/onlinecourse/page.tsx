import React from "react";
import type { Metadata } from "next";
import OnlineCoursesPage from "./OnlineCourseClient";

const siteUrl = "https://www.gyanhub.com.np";
const pageUrl = `${siteUrl}/onlinecourse`;

const ogImage =
  "https://zuktarghyexwodqnnxlu.supabase.co/storage/v1/object/public/others/GyanHub_logo_website-removebg-preview__1_-removebg-preview.webp";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),

  title: {
    absolute: "Live Online Courses in Nepal | GyanHub",
  },

  description:
    "Join GyanHub live online courses in Nepal and learn job-ready skills from expert instructors. Explore AutoCAD, GIS, QGIS, Revit BIM, ETABS, SAFE, RCDC, Structural Design, Estimation, Costing, Property Valuation, SolidWorks, SketchUp, Enscape, and professional engineering training.",

  keywords: [
    "live online courses Nepal",
    "online courses Nepal",
    "GyanHub online courses",
    "engineering courses Nepal",
    "AutoCAD course Nepal",
    "GIS training Nepal",
    "ArcGIS course Nepal",
    "QGIS course Nepal",
    "Revit BIM course Nepal",
    "ETABS training Nepal",
    "SAFE training Nepal",
    "RCDC training Nepal",
    "structural design course Nepal",
    "estimation costing course Nepal",
    "property valuation course Nepal",
    "SolidWorks course Nepal",
    "architecture visualization course Nepal",
    "job ready skills Nepal",
  ],

  alternates: {
    canonical: pageUrl,
  },

  openGraph: {
    title: "Live Online Courses in Nepal | GyanHub",
    description:
      "Browse upcoming live online courses by GyanHub and learn practical engineering, design, GIS, and professional skills online.",
    url: pageUrl,
    siteName: "GyanHub",
    images: [
      {
        url: ogImage,
        width: 1200,
        height: 630,
        alt: "GyanHub Live Online Courses in Nepal",
      },
    ],
    locale: "en_NP",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "Live Online Courses in Nepal | GyanHub",
    description:
      "Join practical live online courses in Nepal with GyanHub and build job-ready engineering, design, GIS, and technical skills.",
    images: [ogImage],
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

  category: "Education",
};

export default function Page() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${pageUrl}/#collectionpage`,
        name: "Live Online Courses in Nepal | GyanHub",
        url: pageUrl,
        description:
          "A collection of live online courses offered by GyanHub for students, engineers, architects, and professionals in Nepal.",
        isPartOf: {
          "@type": "WebSite",
          name: "GyanHub",
          url: siteUrl,
        },
      },
      {
        "@type": "ItemList",
        name: "GyanHub Live Online Course Categories",
        itemListElement: [
          "AutoCAD Training",
          "GIS and Mapping Training",
          "QGIS Training",
          "Revit BIM Training",
          "Structural Design Training",
          "ETABS, SAFE and RCDC Training",
          "Estimation, Costing and Contract Billing",
          "Property Valuation Training",
          "SolidWorks 3D Modelling",
          "Architecture Visualization",
        ].map((name, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name,
        })),
      },
      {
        "@type": "EducationalOrganization",
        name: "GyanHub",
        url: siteUrl,
        logo: ogImage,
        slogan: "Learn Today | Lead Tomorrow",
        address: {
          "@type": "PostalAddress",
          addressCountry: "NP",
        },
      },
    ],
  };

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <OnlineCoursesPage />
    </main>
  );
}