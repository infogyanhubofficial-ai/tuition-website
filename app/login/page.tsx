'use client';

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { GraduationCap, Briefcase, Chrome } from "lucide-react";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client"; 

function LoginContent() {
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<"student" | "tutor">("student");
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const nextUrl = searchParams.get('next') || searchParams.get('redirect') || '/my-courses';

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

    // FIX: Force production domain to avoid localhost redirects
    const getURL = () => {
      let url =
        process.env.NEXT_PUBLIC_SITE_URL ?? // Set this in your cPanel/Env
        process.env.NEXT_PUBLIC_VERCEL_URL ?? // For Vercel users
        'https://gyanhub.com.np'; // Hardcoded Fallback
        
      // Ensure it's not local if we aren't actually on localhost
      if (!window.location.host.includes('localhost') && url.includes('localhost')) {
        url = 'https://gyanhub.com.np';
      }
      
      // Make sure it has https
      url = url.includes('http') ? url : `https://${url}`;
      return url;
    };

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${getURL()}/auth/callback?role=${role}&next=${nextUrl}`,
      },
    });

    if (error) {
      console.error("Login error:", error.message);
      setLoading(false);
    }
  };

  if (isCheckingAuth) return <div className="min-h-screen bg-[#F8FAFC]"></div>; 

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-[32px] shadow-xl shadow-slate-200/60 p-10 border border-slate-100"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Welcome to GyanHub</h1>
          <p className="text-slate-500 font-medium mt-2">Choose your path to get started</p>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <button onClick={() => setRole("student")} className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${role === "student" ? "border-blue-600 bg-blue-50 text-blue-600" : "border-slate-100 text-slate-400"}`}>
            <GraduationCap size={24} />
            <span className="text-xs font-black">STUDENT</span>
          </button>
          <button onClick={() => setRole("tutor")} className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${role === "tutor" ? "border-emerald-600 bg-emerald-50 text-emerald-600" : "border-slate-100 text-slate-400"}`}>
            <Briefcase size={24} />
            <span className="text-xs font-black">TUTOR</span>
          </button>
        </div>

        <button onClick={handleGoogleSignIn} disabled={loading} className="w-full bg-slate-900 hover:bg-black text-white p-4 rounded-2xl font-black flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-50">
          <Chrome size={20} />
          {loading ? "Connecting..." : "Continue with Google"}
        </button>
      </motion.div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F8FAFC]"></div>}>
      <LoginContent />
    </Suspense>
  );
}