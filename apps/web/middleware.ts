import { NextRequest } from "next/server";
import { updateSession } from "./lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    "/",
    "/login",
    "/profile/:path*",
    "/calendar/:path*",
    "/library/:path*",
    "/settings/:path*",
    "/dashboard/:path*"
  ]
};
