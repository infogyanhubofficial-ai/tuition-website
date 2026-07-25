"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function LayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const hideFooter = pathname.startsWith("/company");

  return (
    <>
      {/* Navbar is always shown */}
      <Navbar />

      <main className="flex-grow w-full">
        {children}
      </main>

      {/* Footer is hidden only on /company/* */}
      {!hideFooter && <Footer />}
    </>
  );
}