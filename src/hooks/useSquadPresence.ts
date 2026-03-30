"use client";

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface SquadMemberState {
  userId: string;
  username: string; // Used for UI display
  isRunning: boolean;
  timeLeft: string; // e.g., "15:00" or simple raw string depending on formatting
  disciplinePoints: number;
  startTimestamp?: number;
  baseElapsed?: number;
  mode?: 'stopwatch' | 'timer';
}

export function useSquadPresence(
  roomId: string | undefined,
  localUserSnapshot: SquadMemberState
) {
  const [squadMembers, setSquadMembers] = useState<SquadMemberState[]>([]);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!roomId || !localUserSnapshot.userId) return;

    // 1. Initialize the channel
    const roomChannel = supabase.channel(`room-${roomId}`, {
      config: {
        presence: {
          key: localUserSnapshot.userId,
        },
      },
    });

    // 2. Set up Presence listeners
    roomChannel
      .on('presence', { event: 'sync' }, () => {
        const state = roomChannel.presenceState<{ userState: SquadMemberState }>();
        const members: SquadMemberState[] = [];
        for (const id in state) {
          // state[id] is an array of presence objects for a given key
          if (state[id] && state[id].length > 0) {
            members.push(state[id][0].userState);
          }
        }
        setSquadMembers(members);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        // Handled securely by sync, but useful for explicit connection logging if needed
        console.log(`Squad Member Joined: ${key}`, newPresences);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log(`Squad Member Left: ${key}`, leftPresences);
      });

    // 3. Subscribe and track initial local state
    roomChannel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        const presenceStatus = await roomChannel.track({
          userState: localUserSnapshot,
        });
        console.log('Presence Tracking Status:', presenceStatus);
      }
    });

    setChannel(roomChannel);

    return () => {
      roomChannel.untrack();
      supabase.removeChannel(roomChannel);
    };
    // We do NOT want to re-run this effect every time localUserSnapshot changes,
    // otherwise it will completely disconnect/reconnect the WebSocket channel continuously.
    // Instead, we expose a separate `updateStatus` function to update the broadcasted state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, localUserSnapshot.userId]);

  // Method to update the local presence state and broadcast it to the channel without reconnecting
  const updateStatus = useCallback(
    async (newState: SquadMemberState) => {
      if (channel) {
        await channel.track({
          userState: newState,
        });
      }
    },
    [channel]
  );

  return { squadMembers, updateStatus };
}
