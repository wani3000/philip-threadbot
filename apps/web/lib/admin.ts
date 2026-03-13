import { isLocalDemoMode } from "./runtime";
import { createServerSupabaseClient } from "./supabase/server";
import { hasSupabaseAuthConfig } from "./supabase/config";

function getAdminEmails() {
  return String(process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
}

export async function getAdminAccessToken() {
  if (isLocalDemoMode()) {
    const demoToken = process.env.ADMIN_BEARER_TOKEN;

    if (!demoToken) {
      throw new Error("로컬 데모용 ADMIN_BEARER_TOKEN이 설정되지 않았습니다.");
    }

    return demoToken;
  }

  if (!hasSupabaseAuthConfig()) {
    throw new Error("Supabase 인증 설정이 아직 완료되지 않았습니다.");
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { session }
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error("관리자 로그인이 필요합니다.");
  }

  return session.access_token;
}

export async function getAdminSessionState() {
  if (isLocalDemoMode()) {
    return {
      isAuthenticated: true,
      isAdmin: true,
      email: getAdminEmails()[0] ?? "demo-admin@local",
      mode: "demo" as const,
      authConfigured: true
    };
  }

  if (!hasSupabaseAuthConfig()) {
    return {
      isAuthenticated: false,
      isAdmin: false,
      email: null,
      mode: "live" as const,
      authConfigured: false
    };
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  const email = user?.email?.toLowerCase() ?? null;
  const isAdmin = email ? getAdminEmails().includes(email) : false;

  return {
    isAuthenticated: Boolean(user),
    isAdmin,
    email,
    mode: "live" as const,
    authConfigured: true
  };
}

export function isAllowedAdminEmail(email?: string | null) {
  if (!email) {
    return false;
  }

  return getAdminEmails().includes(email.toLowerCase());
}
