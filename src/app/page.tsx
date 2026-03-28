import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import Link from 'next/link';
import ClientDashboard from './ClientDashboard';

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  // Await search params for Next 15 compatibility
  const resolvedParams = await searchParams;
  
  // Allow the demo flow to bypass the Supabase server bouncer
  if (resolvedParams?.demo === 'true') {
    return <ClientDashboard initialUserId="demo" firstName="Hustler" />;
  }

  const cookieStore = await cookies();
  
  // 1. Initialize Supabase on the Server
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
              cookieStore.set(name, value, options);
            });
          } catch (error) {
            // Cannot directly set from server component, safely skip
          }
        },
      },
    }
  );

  // 2. Fetch the logged-in user securely
  const { data: { user }, error } = await supabase.auth.getUser();

  // 3. The Bouncer: If they aren't logged in, kick them back to the login screen
  if (error || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white relative overflow-hidden font-sans">
        <div className="relative z-10 w-full max-w-sm mx-4 bg-white/70 backdrop-blur-3xl rounded-3xl border border-white/80 shadow-2xl shadow-black/5 p-10 text-center">
          <svg width="48" height="48" viewBox="0 0 52 52" fill="none" className="mx-auto mb-6">
            <defs>
              <linearGradient id="logoGrad" x1="0" y1="0" x2="52" y2="52">
                <stop offset="0%" stopColor="#D4A127" />
                <stop offset="50%" stopColor="#B8860B" />
                <stop offset="100%" stopColor="#E6C55A" />
              </linearGradient>
            </defs>
            <rect x="4" y="4" width="20" height="20" rx="4" stroke="url(#logoGrad)" strokeWidth="2.5" fill="none" />
            <rect x="28" y="4" width="20" height="20" rx="4" stroke="url(#logoGrad)" strokeWidth="2.5" fill="none" opacity="0.6" />
            <rect x="4" y="28" width="20" height="20" rx="4" stroke="url(#logoGrad)" strokeWidth="2.5" fill="none" opacity="0.6" />
            <rect x="28" y="28" width="20" height="20" rx="4" stroke="url(#logoGrad)" strokeWidth="2.5" fill="none" />
            <circle cx="14" cy="14" r="3" fill="url(#logoGrad)" />
            <circle cx="38" cy="38" r="3" fill="url(#logoGrad)" />
          </svg>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 mb-2">Daily Planner</h1>
          <p className="text-gray-500 text-sm mb-8 font-medium">Quiet luxury. Sharp focus.</p>
          <Link href="/login" className="inline-flex w-full justify-center items-center gap-2 hover:scale-[1.02] active:scale-95 transition-all text-white font-medium py-3.5 px-6 rounded-2xl shadow-lg hover:shadow-xl bg-gradient-to-r from-[#D4A127] to-[#B8860B] hover:from-[#E6C55A] hover:to-[#D4A127]">
            Login to Continue
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
            </svg>
          </Link>
        </div>
      </div>
    );
  }

  // 4. Extract their name from Google Login
  const fullName = user.user_metadata?.full_name || 'Hustler';
  const firstName = fullName.split(' ')[0]; // Grabs just their first name

  // Note: We leave the dynamic time clock logic rendering to the Client Header
  // because server-time might be UTC while the user is in another timezone.

  return <ClientDashboard initialUserId={user.id} firstName={firstName} />;
}
