import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  const supabaseUrl = "https://zuktarghyexwodqnnxlu.supabase.co";
  const supabaseKey = "sb_publishable_B8A5tOaBnI65j7yGTzhPPg_jqdGGUqm";

  return createBrowserClient(supabaseUrl, supabaseKey);
}