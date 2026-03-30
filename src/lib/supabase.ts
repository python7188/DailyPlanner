'use client';

import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);

export interface Task {
  id: string;
  user_id: string;
  title: string;
  is_completed: boolean;
  target_date: string; // ISO date string YYYY-MM-DD
  created_at: string;
  order_index?: number;
  time_target_minutes?: number;
}

export interface Goal {
  id: string;
  user_id: string;
  title: string;
  start_value: number;
  target_value: number;
  current_value: number;
  deadline: string; // ISO date string
  created_at: string;
}

export interface SubTask {
  id: string;
  goal_id: string;
  title: string;
  achieved_value: number;
  is_completed: boolean;
  created_at: string;
}

/*
-- UPDATED SQL SCHEMA --

-- Remove old tasks table and recreate
DROP TABLE IF EXISTS tasks;

CREATE TABLE tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  is_completed BOOLEAN DEFAULT false NOT NULL,
  target_date DATE DEFAULT CURRENT_DATE NOT NULL,
  time_target_minutes INT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own tasks"
  ON tasks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own tasks"
  ON tasks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own tasks"
  ON tasks FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users delete own tasks"
  ON tasks FOR DELETE
  USING (auth.uid() = user_id);

-- Goals table
CREATE TABLE goals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  target_metric NUMERIC DEFAULT 100 NOT NULL,
  current_metric NUMERIC DEFAULT 0 NOT NULL,
  deadline DATE,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own goals"
  ON goals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own goals"
  ON goals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own goals"
  ON goals FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users delete own goals"
  ON goals FOR DELETE
  USING (auth.uid() = user_id);
*/
