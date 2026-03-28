'use client';

import AuthScreen from '@/components/AuthScreen';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    // If the user happens to land on /login but is already authenticated, send them to the dashboard
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        router.push('/');
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        router.push('/');
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  const handleDemoLogin = () => {
    // Navigate to the server-bounced dashboard with a demo bypass flag
    router.push('/?demo=true');
  };

  return <AuthScreen onDemoLogin={handleDemoLogin} />;
}
