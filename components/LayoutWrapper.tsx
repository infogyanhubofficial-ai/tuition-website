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

  const hideLayout =
    pathname.startsWith("/company") || pathname.startsWith("/admin") || pathname.startsWith("/certificate") || pathname.startsWith("/e-GP-Sample");

  return (
    <>
      {/* Hide Navbar on /company/* and /admin/* */}
      {!hideLayout && <Navbar />}

      <main className="flex-grow w-full">
        {children}
      </main>

      {/* Hide Footer on /company/* and /admin/* */}
      {!hideLayout && <Footer />}
    </>
  );
}