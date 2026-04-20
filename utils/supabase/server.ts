import { createClient as createSupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

export const createClient = () =>
  createSupabaseClient(supabaseUrl!, supabaseSecretKey!, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
