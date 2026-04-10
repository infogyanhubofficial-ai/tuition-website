import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

// Store the logo URL in a variable so it's easy to change everywhere at once
const LOGO_URL = "https://zuktarghyexwodqnnxlu.supabase.co/storage/v1/object/public/others/GyanHub_logo_website-removebg-preview__1_-removebg-preview.webp";

// --- GLOBAL SEO & METADATA ---
export const metadata: Metadata = {
  title: {
    template: '%s | GyanHub', 
    default: 'GyanHub - Learn Today | Lead Tomorrow', 
  },
  description: "Nepal's premium network connecting expert educators with eager learners. Specialized in Engineering, Design, and Technical training.",
  keywords: ["GyanHub", "Tutors Nepal", "Engineering Tuition", "Online Courses Nepal", "Skill Development"],
  authors: [{ name: "GyanHub Team" }],
  
  // OpenGraph (Facebook, LinkedIn, Discord)
  openGraph: {
    title: 'GyanHub - Learn Today | Lead Tomorrow',
    description: "Connect with the best tutors in Nepal. Join 1200+ students mastering technical skills.",
    url: 'https://gyanhub.com.np', // Replace with your actual domain
    siteName: 'GyanHub',
    images: [
      {
        url: LOGO_URL,
        width: 1200,
        height: 630,
        alt: 'GyanHub Logo',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },

  // Twitter
  twitter: {
    card: 'summary_large_image',
    title: 'GyanHub | Nepal’s Educator Network',
    description: 'Expert-led technical training and student-tutor matching.',
    images: [LOGO_URL],
  },

  // Icons - THIS IS WHAT SETS THE BROWSER ICON (FAVICON)
  icons: {
    icon: LOGO_URL,
    apple: LOGO_URL,
    shortcut: LOGO_URL, // Added shortcut for broader browser support
  },
};

// Separate Viewport configuration (Next.js 14+ requirement)
export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#f8fafc', // Matches bg-slate-50
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // Added suppressHydrationWarning to fix the Next.js console error
    <html lang="en" className="light" style={{ colorScheme: 'light' }} suppressHydrationWarning>
      <head>
        <meta name="color-scheme" content="light only" />
        <meta 
          httpEquiv="Content-Security-Policy" 
          content="upgrade-insecure-requests; block-all-mixed-content; default-src * 'unsafe-inline' 'unsafe-eval'; connect-src * 'unsafe-inline'; img-src * data: blob:; frame-src *;" 
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-slate-50 text-slate-900 flex flex-col min-h-screen`}>
        <Navbar />
        
        <main className="w-full flex-grow">
          {children}
        </main>
        
        <Footer />
      </body>
    </html>
  );
}