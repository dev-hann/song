import { type NextRequest, NextResponse } from 'next/server';
import { auth } from './server/auth';

const publicPaths = ['/login', '/api/auth', '/shared'];
const publicApiPaths = ['/api/melon', '/api/health', '/api/youtube', '/api/shared'];

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  for (const p of publicPaths) {
    if (pathname.startsWith(p)) {return;}
  }

  for (const p of publicApiPaths) {
    if (pathname.startsWith(p)) {return;}
  }

  let session;
  try {
    session = await auth();
  } catch {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (pathname.startsWith('/api/')) {
    if (!session?.user.id) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }
  } else if (!pathname.startsWith('/_next')) {
    if (!session?.user.id) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icons|sw.js|manifest.json|registerSW.js|serwist).*)'],
};
