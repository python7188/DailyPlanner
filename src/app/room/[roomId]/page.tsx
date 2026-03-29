import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import ExecutionRoom from '@/components/ExecutionRoom';
import Link from 'next/link';

export default async function SquadRoomPage({ params }: { params: Promise<{ roomId: string }> }) {
  const resolvedParams = await params;
  const roomId = resolvedParams.roomId;

  const cookieStore = await cookies();
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {
          // Read-only in server components
        },
      },
    }
  );

  const { data: { user }, error } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-[var(--color-bg)] relative overflow-hidden font-sans">
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

      <div className="w-full h-screen relative z-10 pt-16">
        <ExecutionRoom 
          userId={user?.id || 'guest'} 
          roomId={roomId} 
        />
      </div>
    </div>
  );
}
