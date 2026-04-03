import createIntlMiddleware from 'next-intl/middleware'
import { type NextRequest } from 'next/server'
import { routing } from '@/i18n/routing'
import { updateSession } from '@/lib/supabase/middleware'

const intlMiddleware = createIntlMiddleware(routing)

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip i18n for API routes and auth callback
  if (pathname.startsWith('/api/') || pathname.startsWith('/auth/')) {
    return await updateSession(request)
  }

  // Run next-intl middleware (locale detection + redirect/rewrite)
  const intlResponse = intlMiddleware(request)

  // If next-intl issued a redirect (e.g., / -> /ko), return it directly
  if (intlResponse.status >= 300 && intlResponse.status < 400) {
    return intlResponse
  }

  // Run Supabase session refresh and merge cookies onto intl response
  const supabaseResponse = await updateSession(request)
  supabaseResponse.cookies.getAll().forEach((cookie) => {
    intlResponse.cookies.set(cookie.name, cookie.value, cookie as Parameters<typeof intlResponse.cookies.set>[2])
  })

  return intlResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
