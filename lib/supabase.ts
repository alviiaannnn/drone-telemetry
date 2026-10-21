import { createClient } from "@supabase/supabase-js";

// Client publik (anon key). Dibuat lazy agar build tidak gagal saat env belum di-set.
export function supabaseBrowser() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
