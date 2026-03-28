-- =============================================
-- Daily Planner — Supabase Database Schema
-- =============================================

-- 1. Create the tasks table
CREATE TABLE public.tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  is_completed BOOLEAN DEFAULT false NOT NULL,
  priority TEXT DEFAULT 'medium' NOT NULL CHECK (priority IN ('low', 'medium', 'high')),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 2. Enable Row Level Security
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies — users can only access their own tasks

-- SELECT: Users can only read their own tasks
CREATE POLICY "Users can view own tasks"
  ON public.tasks
  FOR SELECT
  USING (auth.uid() = user_id);

-- INSERT: Users can only create tasks for themselves
CREATE POLICY "Users can create own tasks"
  ON public.tasks
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- UPDATE: Users can only update their own tasks
CREATE POLICY "Users can update own tasks"
  ON public.tasks
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- DELETE: Users can only delete their own tasks
CREATE POLICY "Users can delete own tasks"
  ON public.tasks
  FOR DELETE
  USING (auth.uid() = user_id);

-- 4. Create an index for faster user-based queries
CREATE INDEX idx_tasks_user_id ON public.tasks(user_id);
CREATE INDEX idx_tasks_created_at ON public.tasks(created_at DESC);

-- =============================================
-- 5. Goals Table (Intelligent Progress Engine)
-- =============================================
CREATE TABLE public.goals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  start_value NUMERIC DEFAULT 0 NOT NULL,
  target_value NUMERIC NOT NULL,
  current_value NUMERIC DEFAULT 0 NOT NULL,
  deadline DATE,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own goals" 
  ON public.goals FOR ALL 
  USING (auth.uid() = user_id) 
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_goals_user_id ON public.goals(user_id);

-- =============================================
-- 6. Sub-Tasks Table (Goal milestones)
-- =============================================
CREATE TABLE public.sub_tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  goal_id UUID REFERENCES public.goals(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  achieved_value NUMERIC DEFAULT 0 NOT NULL,
  is_completed BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.sub_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage sub_tasks for their goals"
  ON public.sub_tasks FOR ALL
  USING (
    goal_id IN (SELECT id FROM public.goals WHERE user_id = auth.uid())
  )
  WITH CHECK (
    goal_id IN (SELECT id FROM public.goals WHERE user_id = auth.uid())
  );

CREATE INDEX idx_sub_tasks_goal_id ON public.sub_tasks(goal_id);
