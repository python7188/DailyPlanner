'use client';

import { useState, useMemo, useEffect } from 'react';
import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts';
import { motion } from 'framer-motion';
import { TrendingUp, Plus, Edit2 } from 'lucide-react';

interface MicroMetricsProps {
  selectedDate: string | null;
}

export default function MicroMetrics({ selectedDate }: MicroMetricsProps) {
  const [metrics, setMetrics] = useState<Record<string, number>>({});
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState('');

  // Target date logic: If no date selected, default to today
  const targetDate = selectedDate || new Date().toISOString().split('T')[0];

  useEffect(() => {
    const saved = localStorage.getItem('dailyplanner_micrometrics');
    if (saved) {
      try { setMetrics(JSON.parse(saved)); } catch (e) {}
    } else {
      // Mock data for the sparkline to look premium initially
      const mock: Record<string, number> = {};
      const today = new Date();
      for (let i = 14; i >= 0; i--) {
        const d = new Date(today.getTime() - i * 86400000).toISOString().split('T')[0];
        // Add a nice organic curve
        mock[d] = Math.max(10, Math.floor(50 + Math.sin(i / 2) * 20 + Math.random() * 15));
      }
      setMetrics(mock);
    }
  }, []);

  const saveMetric = (val: number) => {
    const fresh = { ...metrics, [targetDate]: val };
    setMetrics(fresh);
    localStorage.setItem('dailyplanner_micrometrics', JSON.stringify(fresh));
    setIsEditing(false);
  };

  const chartData = useMemo(() => {
    const data = [];
    const baseDate = new Date(targetDate + 'T00:00:00');
    // Generate 14 days of context leading up to the selected date
    for (let i = 13; i >= 0; i--) {
      const d = new Date(baseDate.getTime() - i * 86400000).toISOString().split('T')[0];
      data.push({
        date: d,
        label: new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        value: metrics[d] !== undefined ? metrics[d] : null,
      });
    }
    return data;
  }, [metrics, targetDate]);

  const currentMetric = metrics[targetDate];

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      const val = parseFloat(inputValue);
      if (!isNaN(val)) saveMetric(val);
      else setIsEditing(false);
    }
    if (e.key === 'Escape') setIsEditing(false);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6 rounded-2xl bg-[var(--color-bg-card)] border border-[var(--color-border)] p-4 flex flex-col sm:flex-row gap-6 sm:items-center relative overflow-hidden group shadow-[var(--shadow-soft)] ring-1 ring-black/5"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--color-gold)] opacity-[0.03] rounded-bl-full pointer-events-none" />

      {/* Left side: Metric Input */}
      <div className="flex-1 shrink-0 z-10 w-full sm:w-auto">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className="w-4 h-4 text-[var(--color-gold)]" />
          <h3 className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-widest">
            Daily Metric
          </h3>
        </div>
        
        <div className="flex items-end gap-2 text-[var(--color-text-primary)] min-h-[40px]">
          {isEditing ? (
            <input
              autoFocus
              className="bg-[var(--color-bg-input)] border border-[var(--color-border-gold)] text-lg rounded-lg px-3 py-1.5 w-28 text-[var(--color-gold)] font-bold outline-none ring-2 ring-[#D4A127]/20 shadow-[var(--shadow-gold)]"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={() => {
                const val = parseFloat(inputValue);
                if (!isNaN(val)) saveMetric(val);
                else setIsEditing(false);
              }}
              placeholder="e.g. 75.5"
            />
          ) : (
            <div 
              className="group/edit flex items-center gap-2 cursor-pointer py-1"
              onClick={() => {
                setInputValue(currentMetric !== undefined ? String(currentMetric) : '');
                setIsEditing(true);
              }}
            >
              {currentMetric !== undefined ? (
                <>
                  <span className="text-3xl font-bold tracking-tight text-gradient-gold drop-shadow-sm">
                    {currentMetric}
                  </span>
                  <Edit2 className="w-4 h-4 text-[var(--color-text-ghost)] opacity-0 group-hover/edit:opacity-100 transition-opacity" />
                </>
              ) : (
                <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-dashed border-[var(--color-border)] hover:border-[var(--color-border-gold)] text-[10px] uppercase font-bold text-[var(--color-text-tertiary)] hover:text-[var(--color-gold)] hover:bg-[var(--color-gold-dim)] transition-all">
                  <Plus className="w-3.5 h-3.5" /> Log today
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right side: Sparkline */}
      <div className="h-16 flex-1 min-w-[200px] w-full relative pointer-events-auto z-10">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="goldGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#D4A127" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#D4A127" stopOpacity={0} />
              </linearGradient>
            </defs>
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'rgba(25, 25, 25, 0.95)', 
                backdropFilter: 'blur(12px)',
                borderColor: 'rgba(212, 161, 39, 0.4)',
                borderRadius: '8px',
                fontSize: '12px',
                padding: '8px 12px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
              }}
              itemStyle={{ color: '#E6C55A', fontWeight: 700 }}
              labelStyle={{ color: '#A0A0A0', marginBottom: '6px', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px' }}
              cursor={{ stroke: 'rgba(212, 161, 39, 0.5)', strokeWidth: 1, strokeDasharray: '4 4' }}
              // Handle null values in tooltip
              formatter={(value: any) => [value || 'No Data', 'Metric']}
              labelFormatter={(label) => label}
            />
            <Area 
              type="monotone" 
              dataKey="value" 
              stroke="#D4A127" 
              strokeWidth={2.5}
              fillOpacity={1} 
              fill="url(#goldGradient)" 
              animationDuration={1000}
              connectNulls={true}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
