import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import { isAllowedAdminEmail } from "../admin";
import { isLocalDemoMode } from "../runtime";
import {
  getMissingSupabaseConfigMessage,
  getSupabaseAuthConfig
} from "./config";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request
  });

  const { pathname } = request.nextUrl;
  const isLoginPath = pathname === "/login";
  const isProtectedPath =
    pathname === "/" ||
    pathname === "/profile" ||
    pathname.startsWith("/profile/") ||
    pathname === "/calendar" ||
    pathname.startsWith("/calendar/") ||
    pathname === "/library" ||
    pathname.startsWith("/library/") ||
    pathname === "/settings" ||
    pathname.startsWith("/settings/") ||
    pathname === "/dashboard" ||
    pathname.startsWith("/dashboard/");

  if (isLocalDemoMode()) {
    return response;
  }

  const { url: supabaseUrl, anonKey: supabaseAnonKey } =
    getSupabaseAuthConfig();

  if (!supabaseUrl || !supabaseAnonKey) {
    if (isProtectedPath) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/login";
      redirectUrl.searchParams.set("error", getMissingSupabaseConfigMessage());
      return NextResponse.redirect(redirectUrl);
    }

    return response;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        response = NextResponse.next({
          request
        });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      }
    }
  });

  const {
    data: { user }
  } = await supabase.auth.getUser();

  const isAdmin = isAllowedAdminEmail(user?.email ?? null);

  if (isProtectedPath && (!user || !isAdmin)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set(
      "error",
      user && !isAdmin
        ? "관리자 계정으로 로그인해 주세요."
        : "로그인이 필요합니다."
    );

    return NextResponse.redirect(redirectUrl);
  }

  if (isLoginPath && user && isAdmin) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/";
    redirectUrl.searchParams.delete("error");

    return NextResponse.redirect(redirectUrl);
  }

  return response;
}
