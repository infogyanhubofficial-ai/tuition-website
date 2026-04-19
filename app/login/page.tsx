'use client';

import { useEffect, Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function LoginRedirector() {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  useEffect(() => {
    let isMounted = true;

    const initiateAuth = async () => {
      const nextUrl =
        searchParams.get('next') ||
        searchParams.get('redirect') ||
        '/dashboard';

      // 1. Check if the user is already logged in
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // --- NEW CODE: Link guest records since we know the user is authenticated ---
        const { error: rpcError } = await supabase.rpc('link_guest_bookings');
        if (rpcError) {
          console.error("Error linking guest records:", rpcError);
        }
        // -------------------------------------------------------------------------

        // Send them to the intended page
        router.push(nextUrl);
        return;
      }

      // 2. If not logged in, automatically trigger Google OAuth
      const redirectUrl = `${window.location.origin}/auth/callback?next=${nextUrl}`;

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectUrl,
        },
      });

      if (error && isMounted) {
        console.error("Login error:", error.message);
        setErrorMsg(error.message);
      }
    };

    initiateAuth();

    return () => {
      isMounted = false;
    };
  }, [router, searchParams, supabase.auth]);

  // Display an error if the redirect fails for some reason
  if (errorMsg) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6 text-slate-600">
        <p>Something went wrong: {errorMsg}</p>
      </div>
    );
  }

  // Display a blank background (or a loading spinner) while the redirect happens
  return <div className="min-h-screen bg-[#F8FAFC]" />;
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F8FAFC]" />}>
      <LoginRedirector />
    </Suspense>
  );
}