import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import ReviewForm from './ReviewForm';

// In Next.js 15+, params is a Promise!
export default async function StudentReviewPage({ params }: { params: Promise<{ id: string }> }) {
  
  // 🚨 THE FIX: You must 'await' params to get the ID properly in Next.js 15+
  const resolvedParams = await params;
  const syllabusId = resolvedParams.id;

  // Await the cookies store
  const cookieStore = await cookies();

  // Safely initialize the Supabase server client
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  // 1. Check for a logged in user via secure cookies
  const { data: { user } } = await supabase.auth.getUser();

  let authUser = null;

  if (user) {
    // 2. Fetch the profile details securely on the backend
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', user.id)
      .maybeSingle();

    // 3. Assemble the exact data we need for the form
    authUser = {
      name: profile?.full_name || user.user_metadata?.full_name || user.user_metadata?.name || null,
      email: profile?.email || user.email || null,
    };
  }

  // Pass the securely fetched user AND the resolved syllabusId directly into the interactive Client form
  return <ReviewForm syllabusId={syllabusId} initialAuthUser={authUser} />;
}