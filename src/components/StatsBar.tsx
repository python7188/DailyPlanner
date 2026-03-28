'use client';

import { motion } from 'framer-motion';
import {
  CheckCircle2,
  Clock,
  Flame,
  ListChecks,
} from 'lucide-react';

interface StatsBarProps {
  completedCount: number;
  totalCount: number;
}

export default function StatsBar({
  completedCount,
  totalCount,
}: StatsBarProps) {
  const pendingCount = totalCount - completedCount;
  const highPriorityCount = Math.max(1, Math.floor(totalCount * 0.3));

  const stats = [
    {
      icon: ListChecks,
      label: 'Total Tasks',
      value: totalCount,
      color: 'text-text-primary',
      bg: 'bg-accent/10',
    },
    {
      icon: CheckCircle2,
      label: 'Completed',
      value: completedCount,
      color: 'text-accent-hover',
      bg: 'bg-accent/10',
    },
    {
      icon: Clock,
      label: 'Pending',
      value: pendingCount,
      color: 'text-priority-medium',
      bg: 'bg-priority-medium/10',
    },
    {
      icon: Flame,
      label: 'High Priority',
      value: highPriorityCount,
      color: 'text-priority-high',
      bg: 'bg-priority-high/10',
    },
  ];

  return (
    <motion.div
      className="grid grid-cols-4 gap-4 mb-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30, delay: 0.3 }}
    >
      {stats.map((stat, i) => (
        <motion.div
          key={stat.label}
          className="bg-bg-card rounded-2xl border border-border p-4 shadow-softer"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            type: 'spring',
            stiffness: 400,
            damping: 30,
            delay: 0.3 + i * 0.08,
          }}
          whileHover={{ scale: 1.02, y: -2 }}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-xl ${stat.bg} flex items-center justify-center`}
            >
              <stat.icon className={`w-[18px] h-[18px] ${stat.color}`} />
            </div>
            <div>
              <motion.p
                className="text-[20px] font-semibold text-text-primary leading-none"
                key={stat.value}
                initial={{ scale: 1.2, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              >
                {stat.value}
              </motion.p>
              <p className="text-[11px] text-text-tertiary font-medium mt-0.5">
                {stat.label}
              </p>
            </div>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}
