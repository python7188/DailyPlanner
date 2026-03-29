'use client';

import { useEffect, useRef } from 'react';
import type { Task } from '@/lib/supabase';
import { extractTimeMatch, parseTaskTime } from '@/utils/timeParser';

export function useNotifications(tasks: Task[]) {
  // Keep track of which timeouts were scheduled
  const timeoutsRef = useRef<{ [key: string]: NodeJS.Timeout }>({});

  useEffect(() => {
    // Request permission if not already determined
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window) || Notification.permission !== 'granted') {
      return;
    }

    const newTimeouts: { [key: string]: NodeJS.Timeout } = {};
    const now = Date.now();

    tasks.forEach((task) => {
      // Ignore completed tasks
      if (task.is_completed) return;

      const timeMatch = extractTimeMatch(task.title);
      if (!timeMatch) return;

      const parsedDate = parseTaskTime(timeMatch.raw, task.target_date);
      if (!parsedDate) return;

      const taskTimeMs = parsedDate.getTime();
      
      // Calculate times
      const preemptiveTime = taskTimeMs - 5 * 60 * 1000; // T-5 mins
      const followUpTime = taskTimeMs + 60 * 60 * 1000; // T+60 mins

      // Schedule pre-emptive notification
      if (preemptiveTime > now) {
        const id = `${task.id}-pre`;
        if (!timeoutsRef.current[id]) {
          const delay = preemptiveTime - now;
          newTimeouts[id] = setTimeout(() => {
            new Notification('Task Reminder', {
              body: `Upcoming in 5 minutes: ${task.title.replace(timeMatch.raw, '').trim()}`,
              icon: '/icon.png'
            });
          }, delay);
        } else {
          newTimeouts[id] = timeoutsRef.current[id];
        }
      }

      // Schedule follow-up notification
      if (followUpTime > now) {
        const id = `${task.id}-post`;
        if (!timeoutsRef.current[id]) {
          const delay = followUpTime - now;
          newTimeouts[id] = setTimeout(() => {
            new Notification('Following up', {
              body: `Did you complete: ${task.title}?`,
              icon: '/icon.png' // Make sure there is an icon.png in public if possible
            });
          }, delay);
        } else {
          newTimeouts[id] = timeoutsRef.current[id];
        }
      }
    });

    // Clear old timeouts that are no longer valid (e.g. task deleted/completed)
    Object.keys(timeoutsRef.current).forEach((key) => {
      if (!newTimeouts[key]) {
        clearTimeout(timeoutsRef.current[key]);
      }
    });

    timeoutsRef.current = newTimeouts;

    return () => {
      // Optional: Cleanup all on unmount, but often we want them to stay alive 
      // as long as the dashboard is mounted. 
      // If we unmount dashboard, we clear them.
      Object.values(timeoutsRef.current).forEach(clearTimeout);
      timeoutsRef.current = {};
    };
  }, [tasks]);
}
