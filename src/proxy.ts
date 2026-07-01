import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Next.js 16 renamed the "middleware" convention to "proxy".
// Runs on every matched request. Auth is currently client-side (Zustand);
// in production you'd validate a JWT cookie here.
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const publicRoutes = ['/driver/auth']
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route))
  void isPublicRoute // placeholder until server-side auth is added
  return NextResponse.next()
}

export const config = {
  matcher: [
    // Match all paths except api, Next internals, favicon, and the MSW worker.
    '/((?!api|_next/static|_next/image|favicon.ico|mockServiceWorker.js).*)',
  ],
}
