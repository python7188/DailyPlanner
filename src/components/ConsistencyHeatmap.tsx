'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { getLocalDateString } from '@/utils/timeParser';

interface ConsistencyHeatmapProps {
  tasks: { target_date: string; is_completed: boolean }[];
}

export default function ConsistencyHeatmap({ tasks }: ConsistencyHeatmapProps) {
  // Build heatmap data for the last 16 weeks (112 days)
  const { weeks, maxCount } = useMemo(() => {
    const completedByDate: Record<string, number> = {};
    tasks.forEach((t) => {
      if (t.is_completed) {
        const dateStr = (t.target_date || '').split('T')[0];
        if (dateStr) {
          completedByDate[dateStr] = (completedByDate[dateStr] || 0) + 1;
        }
      }
    });

    const today = new Date();
    const dayOfWeek = today.getDay(); // 0=Sun
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - dayOfWeek - 15 * 7); // 16 weeks back

    const weeks: string[][] = [];
    let currentWeek: string[] = [];
    let maxCount = 0;

    for (let i = 0; i < 16 * 7 + dayOfWeek + 1; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const count = completedByDate[dateStr] || 0;
      if (count > maxCount) maxCount = count;

      currentWeek.push(dateStr);
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    }
    if (currentWeek.length > 0) {
      weeks.push(currentWeek);
    }

    return { weeks, maxCount, completedByDate };
  }, [tasks]);

  const completedByDate: Record<string, number> = {};
  tasks.forEach((t) => {
    if (t.is_completed) {
      const dateStr = t.target_date.split('T')[0];
      completedByDate[dateStr] = (completedByDate[dateStr] || 0) + 1;
    }
  });

  const todayStr = getLocalDateString();

  const getOpacity = (date: string): number => {
    const count = completedByDate[date] || 0;
    if (count === 0) return 0.06;
    if (maxCount === 0) return 0.06;
    return 0.1 + (count / maxCount) * 0.8;
  };

  const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <div className="px-6 lg:px-8 py-4">
      <div className="card-surface p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-[var(--color-text-secondary)]">
            Consistency Heatmap
          </h3>
          <div className="flex items-center gap-1.5 text-[9px] text-[var(--color-text-ghost)]">
            <span>Less</span>
            {[0.06, 0.2, 0.4, 0.6, 0.9].map((op, i) => (
              <div
                key={i}
                className="w-2.5 h-2.5 rounded-[3px]"
                style={{ backgroundColor: `rgba(212, 168, 83, ${op})` }}
              />
            ))}
            <span>More</span>
          </div>
        </div>

        <div className="flex gap-0.5">
          {/* Day labels */}
          <div className="flex flex-col gap-0.5 mr-1 justify-start pt-0">
            {dayLabels.map((label, i) => (
              <div
                key={i}
                className="h-[11px] flex items-center text-[8px] text-[var(--color-text-ghost)] leading-none"
              >
                {i % 2 === 1 ? label : ''}
              </div>
            ))}
          </div>

          {/* Grid */}
          <div className="flex gap-0.5 overflow-x-auto">
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-0.5">
                {week.map((date) => {
                  const count = completedByDate[date] || 0;
                  const isToday = date === todayStr;
                  const isFuture = date > todayStr;

                  return (
                    <motion.div
                      key={date}
                      whileHover={{ scale: 1.8, zIndex: 10 }}
                      className="w-[11px] h-[11px] rounded-[3px] relative group cursor-default"
                      style={{
                        backgroundColor: isFuture
                          ? 'transparent'
                          : `rgba(212, 168, 83, ${getOpacity(date)})`,
                        border: isToday ? '1px solid var(--color-gold)' : isFuture ? '1px solid rgba(212, 168, 83, 0.1)' : 'none',
                      }}
                    >
                      {/* Tooltip */}
                      {!isFuture && (
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:block z-50">
                          <div className="bg-black/90 backdrop-blur-sm text-white text-[9px] px-2 py-1 rounded-md whitespace-nowrap shadow-lg">
                            <span className="font-medium">{count} task{count !== 1 ? 's' : ''}</span>
                            <br />
                            <span className="text-white/50">
                              {new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                              })}
                            </span>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
