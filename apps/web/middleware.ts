import { NextRequest, NextResponse } from "next/server";

const protectedPrefixes = [
  "/profile",
  "/calendar",
  "/library",
  "/settings",
  "/dashboard"
];

function isProtectedPath(pathname: string) {
  return protectedPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!isProtectedPath(pathname)) {
    return NextResponse.next();
  }

  const hasSupabaseSessionCookie = request.cookies
    .getAll()
    .some((cookie) => cookie.name.startsWith("sb-"));

  if (hasSupabaseSessionCookie) {
    return NextResponse.next();
  }

  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = "/";
  redirectUrl.searchParams.set("auth", "required");

  return NextResponse.redirect(redirectUrl);
}

export const config = {
  matcher: [
    "/profile/:path*",
    "/calendar/:path*",
    "/library/:path*",
    "/settings/:path*",
    "/dashboard/:path*"
  ]
};
