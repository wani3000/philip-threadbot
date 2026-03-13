import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseAuthConfig, getSupabaseConfigErrorMessage } from "./config";

export async function createServerSupabaseClient() {
  const { url: supabaseUrl, anonKey: supabaseAnonKey } =
    getSupabaseAuthConfig();

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(getSupabaseConfigErrorMessage());
  }

  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Components may not allow setting cookies directly.
        }
      }
    }
  });
}
