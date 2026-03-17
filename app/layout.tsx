import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Home Tuition Platform",
  description: "Find and post home tuition opportunities",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Navbar />

        <main style={{ minHeight: "70vh" }}>
          {children}
        </main>

        <footer
          style={{
            borderTop: "1px solid #ccc",
            padding: "20px",
            textAlign: "center",
            marginTop: "40px",
            background: "white",
          }}
        >
          <p>© {new Date().getFullYear()} GyanHub Tuition Platform</p>
          <p>Connecting students with the best tutors.</p>
        </footer>
      </body>
    </html>
  );
}