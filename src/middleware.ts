import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Runs on every matched request (see `config.matcher` below).
// Auth is currently enforced client-side via Zustand; this file exists so
// Next.js actually picks it up (the previous proxy.ts / proxy() export was
// silently ignored). Server-side JWT validation can be added here later.
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const publicRoutes = ['/driver/auth']
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route))
  void isPublicRoute // placeholder until cookie-based JWT validation is added
  return NextResponse.next()
}

export const config = {
  matcher: [
    // Match all paths except api, Next internals, favicon, and the MSW worker.
    '/((?!api|_next/static|_next/image|favicon.ico|mockServiceWorker.js).*)',
  ],
}
