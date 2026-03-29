-- =============================================
-- Focus Sessions Table (Log time and discipline)
-- =============================================
CREATE TABLE public.focus_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  duration_seconds INTEGER NOT NULL,
  notes TEXT,
  points_earned INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.focus_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own focus_sessions"
  ON public.focus_sessions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_focus_sessions_user_id ON public.focus_sessions(user_id);
