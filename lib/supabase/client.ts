import { createBrowserClient } from '@supabase/ssr';
import { createClient as createStandardClient } from '@supabase/supabase-js';

const supabaseUrl = "https://zuktarghyexwodqnnxlu.supabase.co";
const supabaseKey = "sb_publishable_B8A5tOaBnI65j7yGTzhPPg_jqdGGUqm";

// 1. Your existing client for Client Components (e.g., EOI Page)
export function createClient() {
  return createBrowserClient(supabaseUrl, supabaseKey);
}

// 2. A standard client for fetching public data in Server Components (e.g., Landing Page)
export const supabase = createStandardClient(supabaseUrl, supabaseKey);

// 3. The TypeScript types required by your pages
export type Course = {
  id: string;
  course_name: string;
  course_code: string;
  semester: string;
  credit_hours: number;
  regular_fee: number;
  is_active: boolean;
  demo_available: boolean;
  display_order: number;
};