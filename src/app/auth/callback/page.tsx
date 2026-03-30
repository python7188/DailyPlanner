'use client';

import { useEffect, Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';

function AuthCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const handleAuthCallback = async () => {
      const code = searchParams.get('code');
      const next = searchParams.get('next') ?? '/';
      
      if (code) {
        const { error: authError } = await supabase.auth.exchangeCodeForSession(code);
        if (authError) {
          if (mounted) setError(authError.message);
          return;
        }
      }
      
      if (mounted) {
        router.push(next);
      }
    };

    handleAuthCallback();

    return () => {
      mounted = false;
    };
  }, [router, searchParams]);

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black dark:bg-[var(--color-bg)] p-4 text-center">
        <p className="text-red-500 mb-4">{error}</p>
        <button 
          onClick={() => router.push('/')}
          className="px-4 py-2 bg-gray-800 rounded-xl border border-gray-700 text-white hover:bg-gray-700"
        >
          Return Home
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--color-bg)] text-white">
      <motion.div 
        animate={{ rotate: 360 }} 
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} 
        className="w-8 h-8 border-2 border-[var(--color-text-ghost)] border-t-[var(--color-gold)] rounded-full mb-4"
      />
      <p className="text-[var(--color-text-secondary)]">Authenticating... Please wait.</p>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)]">
        <p className="text-[var(--color-text-secondary)]">Loading...</p>
      </div>
    }>
      <AuthCallback />
    </Suspense>
  );
}
