// File: lib/supabaseUtils.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL, 
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export function getCertificateImageUrl(rawPath) {
  if (!rawPath) return '/placeholder-empty.png'; 

  const cleanPath = rawPath.replace(/^(certificate\/)?uploads\//, '');

  const { data } = supabase.storage
    .from('certificates')
    .getPublicUrl(cleanPath);

  return data.publicUrl;
}