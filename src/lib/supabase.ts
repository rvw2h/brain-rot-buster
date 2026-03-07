import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

const SUPABASE_URL =
  import.meta.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://tfiettgrvdkmwxazfoli.supabase.co";

const SUPABASE_ANON_KEY =
  import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRmaWV0dGdydmRrbXd4YXpmb2xpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2MzQ0OTksImV4cCI6MjA4ODIxMDQ5OX0.bZMPO4V1ypPN6ck7mXYqa0SZbj1cwg2SUqBz2vXSptM";

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error("Missing Supabase environment variables");
}

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

