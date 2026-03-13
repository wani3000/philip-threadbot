"use client";

import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseAuthConfig, getSupabaseConfigErrorMessage } from "./config";

let browserClient: ReturnType<typeof createBrowserClient> | null = null;

export function createBrowserSupabaseClient() {
  const { url: supabaseUrl, anonKey: supabaseAnonKey } =
    getSupabaseAuthConfig();

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(getSupabaseConfigErrorMessage("브라우저 인증"));
  }

  if (!browserClient) {
    browserClient = createBrowserClient(supabaseUrl, supabaseAnonKey);
  }

  return browserClient;
}
