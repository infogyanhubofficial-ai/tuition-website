import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_URL = "https://www.gyanhub.com.np";
const LOGO_URL = `${SITE_URL}/logo.png`;
const OG_IMAGE_URL = `${SITE_URL}/logo.png`;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),

  title: {
    template: "%s | GyanHub",
    default: "GyanHub - Learn Today | Lead Tomorrow",
  },

  description:
    "Nepal's premium network connecting expert educators with eager learners. Specialized in Engineering, Design, and Technical training.",

  keywords: [
    "GyanHub",
    "Tutors Nepal",
    "Engineering Tuition",
    "Online Courses Nepal",
    "Skill Development",
  ],

  authors: [{ name: "GyanHub Team" }],

  openGraph: {
    title: "GyanHub - Learn Today | Lead Tomorrow",
    description:
      "Connect with the best tutors in Nepal. Join 1200+ students mastering technical skills.",
    url: SITE_URL,
    siteName: "GyanHub",
    images: [
      {
        url: OG_IMAGE_URL,
        width: 1200,
        height: 630,
        alt: "GyanHub Logo",
      },
    ],
    locale: "en_US",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "GyanHub | Nepal’s Educator Network",
    description:
      "Expert-led technical training and student-tutor matching.",
    images: [OG_IMAGE_URL],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  colorScheme: "light",
  themeColor: "#f8fafc",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "GyanHub",
    url: SITE_URL,
    logo: LOGO_URL,
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "GyanHub",
    url: SITE_URL,
  };

  return (
    <html
      lang="en"
      className="light"
      style={{ colorScheme: "light" }}
      suppressHydrationWarning
    >
      <head>
        <meta name="color-scheme" content="light only" />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationSchema),
          }}
        />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(websiteSchema),
          }}
        />
      </head>

      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-slate-50 text-slate-900 min-h-screen flex flex-col overflow-x-hidden`}
      >
        <Navbar />

        <main className="flex-grow w-full">
          {children}
        </main>

        <Footer />
      </body>
    </html>
  );
}