'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, ArrowRight, Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

interface AuthScreenProps {
  onDemoLogin: () => void;
}

export default function AuthScreen({ onDemoLogin }: AuthScreenProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // ── Ghost Account Intercept ──
    if (email.trim().toLowerCase() === 'sowmya@gmail.com' && password === 'sowmya') {
      const mockUser = { id: 'ghost-001', name: 'Sowmya', email: 'sowmya@gmail.com' };
      localStorage.setItem('midnight_user', JSON.stringify(mockUser));
      router.push('/');
      return;
    }

    const { error: authError } = isLogin
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password });

    if (authError) setError(authError.message);
    setLoading(false);
  };

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-[var(--color-bg)] relative overflow-hidden">
      {/* Subtle gold radial glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full bg-[var(--color-gold-glow)] blur-3xl opacity-60" />
        <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] rounded-full bg-[var(--color-gold-glow)] blur-3xl opacity-40" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-md mx-4"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="inline-block mb-4"
          >
            <svg width="52" height="52" viewBox="0 0 52 52" fill="none">
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
          </motion.div>
          <h1 className="text-2xl font-semibold tracking-tight text-gradient-gold">
            Daily Planner
          </h1>
          <p className="text-[var(--color-text-tertiary)] text-sm mt-1">
            Quiet luxury. Sharp focus.
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-white/60 dark:bg-[var(--color-bg-card)]/80 backdrop-blur-2xl rounded-2xl border border-[var(--color-border)] shadow-[var(--shadow-soft)] p-8">
          <div className="flex flex-col gap-4 mb-6">
            <button
              onClick={async () => {
                setLoading(true);
                setError('');
                const { error } = await supabase.auth.signInWithOAuth({
                  provider: 'google',
                  options: {
                    redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : undefined,
                  },
                });
                if (error) setError(error.message);
                setLoading(false);
              }}
              disabled={loading}
              className="relative w-full py-4 rounded-xl text-sm font-semibold text-gray-900 bg-white border-2 border-transparent bg-clip-padding hover:shadow-[0_0_20px_rgba(212,161,39,0.3)] transition-all flex items-center justify-center gap-3 cursor-pointer group shadow-lg"
              style={{
                backgroundImage: 'linear-gradient(white, white), linear-gradient(135deg, #D4A127, #B8860B)',
                backgroundOrigin: 'border-box',
              }}
            >
              <svg className="w-5 h-5 transition-transform group-hover:scale-110" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Continue with Google
            </button>
          </div>

          <div className="relative my-6 opacity-60 hover:opacity-100 transition-opacity">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[var(--color-border)]"></div>
            </div>
            <div className="relative flex justify-center text-[10px]">
              <span className="bg-[var(--color-bg-card)] px-3 text-[var(--color-text-ghost)] uppercase tracking-widest font-semibold backdrop-blur-md">
                Or Use Email
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 opacity-75 focus-within:opacity-100 transition-opacity">
            <div>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-ghost)]" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-[var(--color-bg-input)] border border-[var(--color-border)] rounded-xl text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-ghost)] focus:outline-none focus:border-[var(--color-border-gold)] focus:ring-1 focus:ring-[var(--color-gold-dim)] transition-all"
                  placeholder="Email"
                  required
                />
              </div>
            </div>

            <div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-ghost)]" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-[var(--color-bg-input)] border border-[var(--color-border)] rounded-xl text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-ghost)] focus:outline-none focus:border-[var(--color-border-gold)] focus:ring-1 focus:ring-[var(--color-gold-dim)] transition-all"
                  placeholder="Password"
                  required
                />
              </div>
            </div>

            <AnimatePresence>
              {error && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="text-[var(--color-danger)] text-xs"
                >
                  {error}
                </motion.p>
              )}
            </AnimatePresence>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl text-sm font-semibold tracking-wide disabled:opacity-50 transition-all bg-[var(--color-bg-input)] text-[var(--color-text-secondary)] hover:text-white hover:bg-[var(--color-text-secondary)] border border-[var(--color-border)]"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="w-4 h-4 border-2 border-[var(--color-text-ghost)] border-t-[var(--color-text-secondary)] rounded-full"/>
                </span>
              ) : (
                <span>{isLogin ? 'Sign in with Email' : 'Create Email Account'}</span>
              )}
            </button>
            <p className="text-center mt-2 text-[11px] text-[var(--color-text-tertiary)]">
              {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
              <button
                type="button"
                onClick={() => { setIsLogin(!isLogin); setError(''); }}
                className="text-[var(--color-text-secondary)] font-medium hover:underline cursor-pointer"
              >
                {isLogin ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </form>

          <div className="mt-6 pt-6 border-t border-[var(--color-border)]">
            <button
              onClick={onDemoLogin}
              className="w-full py-3 rounded-xl text-sm font-medium text-[var(--color-gold)] border border-[var(--color-border-gold)] bg-[var(--color-gold-dim)] hover:bg-[var(--color-gold-glow)] transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              Explore Demo Dashboard
            </button>
          </div>


        </div>
      </motion.div>
    </div>
  );
}
