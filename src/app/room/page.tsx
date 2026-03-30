'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import ExecutionRoom from '@/components/ExecutionRoom';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

function SquadRoomInner() {
  const searchParams = useSearchParams();
  const roomId = searchParams.get('id') || 'unnamed-room';
  const [userId, setUserId] = useState<string>('guest');

  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        setUserId(data.user.id);
      }
    };
    fetchUser();
  }, []);

  return (
    <div className="flex-1 flex flex-col w-full bg-[var(--color-bg)] relative overflow-hidden font-sans">
      <div className="absolute top-0 left-0 w-full h-16 flex items-center justify-between px-8 z-50">
        <Link href="/" className="text-[var(--color-text-ghost)] hover:text-white transition-colors text-sm font-bold tracking-widest uppercase">
          ← Exit War Room
        </Link>
        <div className="text-[var(--color-gold)] text-sm font-bold tracking-widest uppercase">
          Squad Room: {roomId}
        </div>
      </div>
      
      {/* Background Ambient Layers */}
      <div className="absolute inset-0 z-0 bg-noise opacity-20 mix-blend-overlay pointer-events-none" />
      <div className="absolute top-1/4 left-1/4 w-[40vw] h-[40vw] rounded-full bg-[var(--color-gold)] opacity-[0.03] blur-[120px] pointer-events-none" />

      <div className="flex-1 w-full relative z-10 pt-16 flex flex-col">
        <ExecutionRoom 
          userId={userId} 
          roomId={roomId} 
        />
      </div>
    </div>
  );
}

export default function SquadRoomPage() {
  return (
    <Suspense fallback={
      <div className="flex-1 flex items-center justify-center w-full bg-[var(--color-bg)]">
        <div className="w-8 h-8 border-2 border-[var(--color-gold)] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <SquadRoomInner />
    </Suspense>
  );
}
