import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isAuthenticated = !!req.auth;

  const protectedPrefixes = ["/dashboard", "/parent"];
  const isProtected = protectedPrefixes.some((p) => pathname.startsWith(p));

  if (isProtected && !isAuthenticated) {
    const signInUrl = new URL("/sign-in", req.url);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - /api/auth (NextAuth handlers)
     * - /_next (Next.js internals)
     * - /sign-in (public sign-in page)
     * - static files (images, favicons, etc.)
     */
    "/((?!api/auth|_next/static|_next/image|favicon.ico|images/).*)",
  ],
};
