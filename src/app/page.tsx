import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
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
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  // 2. Fetch the logged-in user securely
  const { data: { user }, error } = await supabase.auth.getUser();

  // 3. The Bouncer: If they aren't logged in, kick them back to the login screen
  if (error || !user) {
    redirect('/login'); 
  }

  // 4. Extract their name from Google Login
  const fullName = user.user_metadata?.full_name || 'Hustler';
  const firstName = fullName.split(' ')[0]; // Grabs just their first name

  // Note: We leave the dynamic time clock logic rendering to the Client Header
  // because server-time might be UTC while the user is in another timezone.

  return <ClientDashboard initialUserId={user.id} firstName={firstName} />;
}
