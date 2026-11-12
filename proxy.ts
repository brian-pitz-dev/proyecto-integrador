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

  const path = request.nextUrl.pathname;
  const isPublicPath =
    ["/", "/robots.txt", "/sitemap.xml", "/manifest.webmanifest"].includes(path) ||
    [
      "/login",
      "/signup",
      "/privacidad",
      "/opengraph-image",
      "/twitter-image",
      "/icon",
      "/apple-icon",
    ].some((p) => path.startsWith(p));

  if (!user && !isPublicPath) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  const isOnboardingPath = path === "/onboarding";
  const needsOnboarding = !!user && !user.user_metadata?.onboarding_completed;

  if (needsOnboarding && !isOnboardingPath && !isPublicPath) {
    const url = request.nextUrl.clone();
    url.pathname = "/onboarding";
    return NextResponse.redirect(url);
  }

  if (user && !needsOnboarding && isOnboardingPath) {
    const url = request.nextUrl.clone();
    url.pathname = "/calendario";
    return NextResponse.redirect(url);
  }

  if (user && request.nextUrl.pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = needsOnboarding ? "/onboarding" : "/calendario";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
