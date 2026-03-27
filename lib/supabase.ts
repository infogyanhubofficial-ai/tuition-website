// lib/supabase.ts
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://zuktarghyexwodqnnxlu.supabase.co";
const supabaseKey = "sb_publishable_B8A5tOaBnI65j7yGTzhPPg_jqdGGUqm";

// Function to create a fresh client
const createSupabase = () => createClient(supabaseUrl, supabaseKey);

// Global declaration to handle Next.js Fast Refresh
declare global {
  var supabase: ReturnType<typeof createSupabase> | undefined;
}

// Export the singleton instance
export const supabase = globalThis.supabase ?? createSupabase();

if (process.env.NODE_ENV !== "production") {
  globalThis.supabase = supabase;
}