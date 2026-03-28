import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  if (code) {
    const cookieStore = await cookies();
    
    // 1. Create the response object immediately
    const response = NextResponse.redirect(`${origin}${next}`);
    
    // 2. Initialize client, surgically attaching cookies directly to the Response object
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
             return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => {
                cookieStore.set(name, value, options);       // Update Next.js context
                response.cookies.set({ name, value, ...options }); // Force headers on redirect payload
              });
            } catch (error) {
              // Ignore
            }
          },
        },
      }
    );

    // 3. Trade the Code for the Session, invoking `setAll` implicitly
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      // 4. Return the explicit response armed with the Set-Cookie headers
      return response;
    } else {
      return NextResponse.redirect(`${origin}/?error=${encodeURIComponent('AuthCallbackError: ' + error.message)}`);
    }
  }

  // If code is missing or error happens
  return NextResponse.redirect(`${origin}/?error=${encodeURIComponent('AuthCallbackError: No code provided')}`);
}
