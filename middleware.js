import { NextResponse } from 'next/server';

// Kill common exploit probes (PHP CGI, WordPress, env dumps, etc.) before they hit app code.
const BLOCK =
  /\.(?:php|phtml|phar|cgi|asp|aspx|jsp|cfm)(?:$|\?)|^\/(?:wp-|wordpress|phpmyadmin|cgi-bin|vendor\/phpunit|xmlrpc\.php|\.env|\.git|actuator|solr|manager\/html)/i;

const SCANNER_UA =
  /(?:nikto|sqlmap|nmap|masscan|zgrab|dirbuster|gobuster|wfuzz|nuclei|httpx|acunetix|nessus|openvas|havij|wpscan|libwww-perl|python-urllib|java\/|go-http-client\/0|curl\/7\.[0-9]|wget\/1)/i;

export function middleware(req) {
  const { pathname, search } = req.nextUrl;
  const pathQ = pathname + (search || '');

  if (BLOCK.test(pathname) || BLOCK.test(pathQ) || /\.php\d/i.test(pathname)) {
    return new NextResponse('Not found', {
      status: 404,
      headers: {
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'no-store',
        'X-Robots-Tag': 'noindex'
      }
    });
  }

  // Classic PHP-CGI style query abuse: ?-d+allow_url_include=… / ?-s / auto_prepend_file=
  if (/[?&]-d|[?&]-s(?:&|$)|auto_prepend_file|allow_url_include|php:\/\/input/i.test(search || '')) {
    return new NextResponse('Not found', {
      status: 404,
      headers: { 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'no-store' }
    });
  }

  const ua = req.headers.get('user-agent') || '';
  if (pathname.startsWith('/api/') && (!ua || SCANNER_UA.test(ua))) {
    // Don't hang scanners on upstreams — cheap reject. Real browsers always send a UA.
    return NextResponse.json(
      {
        ok: false,
        error: 'forbidden',
        message: 'Use a normal browser or identify your client. Public pages: https://www.strategycoin.io/'
      },
      {
        status: 403,
        headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' }
      }
    );
  }

  const res = NextResponse.next();
  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.headers.set('X-Frame-Options', 'SAMEORIGIN');
  res.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  if (pathname.startsWith('/api/')) {
    res.headers.set('X-Robots-Tag', 'noindex, nofollow');
  }
  return res;
}

export const config = {
  matcher: [
    // Everything except Next static assets and images
    '/((?!_next/static|_next/image|favicon.ico|strategy-icon\\.png|strategy-logo\\.svg|strategy-wordmark\\.png).*)'
  ]
};
