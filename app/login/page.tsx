'use client';

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Chrome } from "lucide-react";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client"; 

function LoginContent() {
  const [loading, setLoading] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const nextUrl =
    searchParams.get('next') ||
    searchParams.get('redirect') ||
    '/my-courses';

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        router.push(nextUrl);
      } else {
        setIsCheckingAuth(false);
      }
    };

    checkUser();
  }, [router, nextUrl]);

  const handleGoogleSignIn = async () => {
    setLoading(true);

    // ✅ FIX: Always use current origin (localhost or production automatically)
    const redirectUrl = `${window.location.origin}/auth/callback?next=${nextUrl}`;

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: redirectUrl,
      },
    });

    if (error) {
      console.error("Login error:", error.message);
      setLoading(false);
    }
  };

  if (isCheckingAuth) {
    return <div className="min-h-screen bg-[#F8FAFC]" />;
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-[32px] shadow-xl shadow-slate-200/60 p-10 border border-slate-100"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Welcome to GyanHub
          </h1>
          <p className="text-slate-500 font-medium mt-2">
            Continue with Google to get started
          </p>
        </div>

        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full bg-slate-900 hover:bg-black text-white p-4 rounded-2xl font-black flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-50"
        >
          <Chrome size={20} />
          {loading ? "Connecting..." : "Continue with Google"}
        </button>
      </motion.div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F8FAFC]" />}>
      <LoginContent />
    </Suspense>
  );
}