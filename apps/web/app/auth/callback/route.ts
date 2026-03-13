import { NextRequest, NextResponse } from "next/server";
import { isAllowedAdminEmail } from "../../../lib/admin";
import { getMissingSupabaseConfigMessage } from "../../../lib/supabase/config";
import { createServerSupabaseClient } from "../../../lib/supabase/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const nextPath = requestUrl.searchParams.get("next") ?? "/";
  const redirectUrl = new URL(nextPath, requestUrl.origin);

  if (!code) {
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("error", "Google 로그인 코드가 없습니다.");
    return NextResponse.redirect(redirectUrl);
  }

  try {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      redirectUrl.pathname = "/login";
      redirectUrl.searchParams.set("error", error.message);
      return NextResponse.redirect(redirectUrl);
    }

    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!isAllowedAdminEmail(user?.email ?? null)) {
      await supabase.auth.signOut();
      redirectUrl.pathname = "/login";
      redirectUrl.searchParams.set("error", "관리자 계정으로 로그인해 주세요.");
      return NextResponse.redirect(redirectUrl);
    }

    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set(
      "error",
      error instanceof Error ? error.message : getMissingSupabaseConfigMessage()
    );
    return NextResponse.redirect(redirectUrl);
  }
}
