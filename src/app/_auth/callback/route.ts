import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  if (!code) {
    return NextResponse.redirect(`${origin}/?error=${encodeURIComponent('AuthCallbackError: No code provided')}`);
  }

  const cookieStore = await cookies();
  
  // Resolve proxy domain
  const forwardedHost = request.headers.get('x-forwarded-host');
  const isLocalEnv = process.env.NODE_ENV === 'development';
  let targetUrl = `${origin}${next}`;
  if (!isLocalEnv && forwardedHost) {
    targetUrl = `https://${forwardedHost}${next}`;
  }

  // Use a 200 OK response with an HTML meta-refresh to ABSOLUTELY FORCE the browser
  // to process the Set-Cookie headers before navigating, bypassing Next.js edge bugs.
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta http-equiv="refresh" content="0; url=${targetUrl}">
      </head>
      <body style="background: #000; color: #fff; font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh;">
        <p>Authenticating... Please wait.</p>
        <script>window.location.href = "${targetUrl}";</script>
      </body>
    </html>
  `;
  const response = new NextResponse(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            try { cookieStore.set(name, value, options); } catch {}
            try { response.cookies.set(name, value, options); } catch {}
          });
        },
      },
    }
  );

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  
  if (error) {
    return NextResponse.redirect(`${origin}/?error=${encodeURIComponent('AuthCallbackError: ' + error.message)}`);
  }

  return response;
}
