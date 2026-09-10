import { NextResponse, type NextRequest } from "next/server";
import { createProxyClient } from "@/lib/supabase/proxy";

// Next.js 16 renamed middleware.ts to proxy.ts — see research.md Decision 1.
export async function proxy(request: NextRequest) {
  const { supabase, response } = createProxyClient(request);

  // Nothing may run between createServerClient and getUser() — see
  // research.md Decision 2 (a stray call here can cause random logouts).
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isPublicPath =
    request.nextUrl.pathname === "/" ||
    request.nextUrl.pathname.startsWith("/login") ||
    request.nextUrl.pathname === "/robots.txt" ||
    request.nextUrl.pathname === "/sitemap.xml" ||
    request.nextUrl.pathname.startsWith("/opengraph-image") ||
    request.nextUrl.pathname.startsWith("/twitter-image") ||
    request.nextUrl.pathname === "/manifest.webmanifest" ||
    request.nextUrl.pathname.startsWith("/icon") ||
    request.nextUrl.pathname.startsWith("/apple-icon");

  if (!user && !isPublicPath) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user && request.nextUrl.pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = "/calendario";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
