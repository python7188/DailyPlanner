import { NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  // Grab the URL the user just landed on
  const { searchParams, origin } = new URL(request.url);
  
  // Extract the secret 'code' Google sent back
  const code = searchParams.get('code');
  
  // Determine where to send them after logging in (defaults to the home dashboard '/')
  const next = searchParams.get('next') ?? '/';

  if (code) {
    const cookieStore = await cookies();
    
    // Initialize the secure server-side Supabase client
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name: string, options: CookieOptions) {
            cookieStore.set({ name, value: '', ...options });
          },
        },
      }
    );

    // Exchange the Google code for a secure, permanent user session
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      // Boom. They are logged in. Redirect them to the dashboard.
      return NextResponse.redirect(`${origin}${next}`);
    } else {
      console.error("Auth callback error:", error.message);
    }
  }

  // If something goes wrong, send them back to the login page
  return NextResponse.redirect(`${origin}/?error=CouldNotLogin`);
}
