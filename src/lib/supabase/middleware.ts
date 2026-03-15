import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            supabaseResponse.cookies.set(name, value, options as any)
          )
        },
      },
    }
  )

  const pathname = request.nextUrl.pathname

  // Skip auth check for API routes — they handle auth themselves
  if (pathname.startsWith('/api/')) {
    return supabaseResponse
  }

  // Protected page routes - require authentication
  const protectedPaths = ['/upload', '/activity', '/profile', '/admin']
  const isProtectedPath = protectedPaths.some((path) =>
    pathname.startsWith(path)
  )

  // Use getSession() instead of getUser() to avoid network calls in Edge middleware.
  // getSession() reads JWT from cookies locally — instant, no Supabase API round-trip.
  // Actual server-side verification happens in page/API route level.
  if (isProtectedPath) {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      url.searchParams.set('redirectTo', pathname)
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}
