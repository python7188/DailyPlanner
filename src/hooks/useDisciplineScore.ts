'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import type { Task } from '@/lib/supabase';
import { extractTimeMatch, parseTaskTime } from '@/utils/timeParser';

export function useDisciplineScore(userId: string | undefined, isDemo: boolean, tasks: Task[]) {
  const [score, setScore] = useState<number>(1000);
  const [lastDelta, setLastDelta] = useState<number>(0);
  const decayTracker = useRef<Record<string, number>>({});

  useEffect(() => {
    if (isDemo || !userId) return;
    
    async function fetchScore() {
      try {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('discipline_score')
          .eq('id', userId)
          .single();
          
        if (!error && data && data.discipline_score !== null) {
          setScore(data.discipline_score);
        }
      } catch (err) {
        console.error('Error fetching discipline score:', err);
      }
    }
    fetchScore();
  }, [userId, isDemo]);

  const applyDelta = async (delta: number) => {
    setLastDelta(delta);
    setScore(s => s + delta);
    
    if (!isDemo && userId) {
      try {
        await supabase.rpc('update_discipline_score', { target_user_id: userId, delta });
      } catch (err) {
        console.error('Score Sync Error:', err);
      }
    }
  };

  useEffect(() => {
    // Check for late tasks every 60 seconds
    const intervalId = setInterval(() => {
      let decayDelta = 0;
      const now = Date.now();
      const today = new Date().toISOString().split('T')[0];
      
      tasks.forEach(task => {
        if (task.is_completed) return;
        
        let isLate = false;
        const timeMatch = extractTimeMatch(task.title);
        
        if (timeMatch) {
          const parsedDate = parseTaskTime(timeMatch.raw, task.target_date);
          if (parsedDate && parsedDate.getTime() < now) {
            isLate = true;
          }
        } else {
          // If no specific time is provided, consider it late if it's from a past day
          if (task.target_date < today) {
            isLate = true;
          }
        }

        if (isLate) {
          // Only bleed if we haven't penalized in this interval cycle
          // We allow 1 point of bleed per minute per late task
          decayDelta -= 1;
        }
      });

      if (decayDelta < 0) {
        applyDelta(decayDelta);
      }
    }, 60000);

    return () => clearInterval(intervalId);
  }, [tasks, userId, isDemo]);

  return { score, lastDelta, applyDelta };
}
