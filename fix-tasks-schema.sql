-- ============================================================
-- FIX: Daily Planner — Tasks Table Schema Migration
-- Run this in your Supabase SQL Editor (once only)
-- ============================================================
-- The original schema is missing columns the app relies on.
-- This migration adds them safely using IF NOT EXISTS guards.
-- ============================================================

-- 1. Add target_date (required — tasks are date-scoped)
ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS target_date DATE DEFAULT CURRENT_DATE NOT NULL;

-- 2. Add time_target_minutes (optional — used for timed tasks)
ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS time_target_minutes INT;

-- 3. Add order_index (optional — used for drag-and-drop ordering)
ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS order_index INT DEFAULT 0;

-- 4. Drop the legacy `priority` column (no longer used in the app)
--    If you want to keep it, comment out this line.
ALTER TABLE public.tasks
  DROP COLUMN IF EXISTS priority;

-- 5. Backfill target_date for any existing rows (sets them to today)
UPDATE public.tasks
  SET target_date = CURRENT_DATE
  WHERE target_date IS NULL;

-- 6. Verify: run this SELECT to confirm columns exist
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'tasks'
ORDER BY ordinal_position;
