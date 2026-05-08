import { updateSession } from '@/lib/supabase-middleware';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/audit')) {
    return NextResponse.next();
  }
  return await updateSession(request);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|install.sh|api/|audit).*)',
  ],
};
