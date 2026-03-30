'use client';

import AuthScreen from '@/components/AuthScreen';
import { supabase } from '@/lib/supabase';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, Suspense } from 'react';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const errorMsg = searchParams.get('error');

  useEffect(() => {
    // If we received an explicit error from the server bouncer, alert the user so they can read it!
    if (errorMsg && errorMsg !== 'AccessDenied' && !errorMsg.includes('Auth session missing!')) {
      alert(`AUTH PIPELINE ERROR:\n\n${errorMsg}\n\nPlease screenshot this and send it back.`);
    }
  }, [errorMsg]);

  useEffect(() => {
    // Ghost user: if already logged in via localStorage, skip to dashboard
    try {
      const ghost = localStorage.getItem('midnight_user');
      if (ghost && JSON.parse(ghost).id === 'ghost-001') {
        router.push('/');
        return;
      }
    } catch {}

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

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-[100dvh] flex items-center justify-center text-white">Loading...</div>}>
      <LoginContent />
    </Suspense>
  );
}
