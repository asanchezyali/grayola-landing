// middleware.ts
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  const { data: { session } } = await supabase.auth.getSession();

  const path = req.nextUrl.pathname;

  if (path.startsWith('/auth')) {
    if (session) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
    return res;
  }

  if (path.startsWith('/dashboard') || path.startsWith('/projects')) {
    if (!session) {
      return NextResponse.redirect(new URL('/auth/login', req.url));
    }

    if (path.includes('/admin')) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();

      if (!profile || profile.role !== 'project_manager') {
        return NextResponse.redirect(new URL('/dashboard', req.url));
      }
    }

    return res;
  }

  return res;
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/projects/:path*',
    '/admin/:path*',
    '/auth/:path*',
  ],
};