import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

const isDev = process.env.NODE_ENV !== "production";

/**
 * Builds a per-request Content-Security-Policy using a nonce. Next.js
 * automatically applies this nonce to the inline bootstrap/hydration scripts
 * it emits, so we never need 'unsafe-inline' for scripts. React Refresh in
 * development additionally requires 'unsafe-eval'.
 */
function buildCsp(nonce: string): string {
  const scriptSrc = isDev
    ? `'self' 'nonce-${nonce}' 'unsafe-eval'`
    : `'self' 'nonce-${nonce}' 'strict-dynamic'`;

  return [
    "default-src 'self'",
    `script-src ${scriptSrc}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "font-src 'self'",
    "connect-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ].join("; ");
}

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

  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const csp = buildCsp(nonce);

  // Pass the nonce + CSP on the request headers so Next.js can nonce its
  // inline scripts, and mirror the CSP onto the response sent to the browser.
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);
  return response;
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
