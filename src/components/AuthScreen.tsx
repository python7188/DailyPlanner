'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, ArrowRight, Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface AuthScreenProps {
  onDemoLogin: () => void;
}

export default function AuthScreen({ onDemoLogin }: AuthScreenProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error: authError } = isLogin
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password });

    if (authError) setError(authError.message);
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)] relative overflow-hidden">
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
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-2 uppercase tracking-wider">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-ghost)]" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-[var(--color-bg-input)] border border-[var(--color-border)] rounded-xl text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-ghost)] focus:outline-none focus:border-[var(--color-border-gold)] focus:ring-2 focus:ring-[var(--color-gold-dim)] transition-all"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-2 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-ghost)]" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-[var(--color-bg-input)] border border-[var(--color-border)] rounded-xl text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-ghost)] focus:outline-none focus:border-[var(--color-border-gold)] focus:ring-2 focus:ring-[var(--color-gold-dim)] transition-all"
                  placeholder="••••••••"
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
              className="btn-gold w-full py-3 rounded-xl text-sm font-semibold tracking-wide disabled:opacity-50 transition-all hover:shadow-[var(--shadow-gold)]"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                  />
                  Processing...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  {isLogin ? 'Sign In' : 'Create Account'}
                  <ArrowRight className="w-4 h-4" />
                </span>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-[var(--color-border)]">
            <button
              onClick={onDemoLogin}
              className="w-full py-3 rounded-xl text-sm font-medium text-[var(--color-gold)] border border-[var(--color-border-gold)] bg-[var(--color-gold-dim)] hover:bg-[var(--color-gold-glow)] transition-all flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Explore Demo
            </button>
          </div>

          <p className="text-center mt-4 text-xs text-[var(--color-text-tertiary)]">
            {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
            <button
              onClick={() => { setIsLogin(!isLogin); setError(''); }}
              className="text-[var(--color-gold)] font-medium hover:underline"
            >
              {isLogin ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
