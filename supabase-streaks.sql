-- Create user_profiles table to track streaks
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  current_streak integer DEFAULT 1,
  longest_streak integer DEFAULT 1,
  last_login_date date DEFAULT current_date,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view and update their own profile"
ON public.user_profiles
FOR ALL
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- RPC to record login and return streak information
CREATE OR REPLACE FUNCTION record_login(target_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  profile_record public.user_profiles%ROWTYPE;
  today date := current_date;
  yesterday date := current_date - interval '1 day';
  is_milestone boolean := false;
  milestone_val integer := 0;
BEGIN
  -- Check if profile exists
  SELECT * INTO profile_record FROM public.user_profiles WHERE id = target_user_id;

  IF NOT FOUND THEN
    -- First time login (or profile missing)
    INSERT INTO public.user_profiles (id, current_streak, longest_streak, last_login_date)
    VALUES (target_user_id, 1, 1, today)
    RETURNING * INTO profile_record;

    is_milestone := true;
    milestone_val := 1;
  ELSE
    -- Profile exists, check last login
    IF profile_record.last_login_date = yesterday THEN
      -- Consecutive login
      UPDATE public.user_profiles
      SET current_streak = current_streak + 1,
          longest_streak = GREATEST(longest_streak, current_streak + 1),
          last_login_date = today
      WHERE id = target_user_id
      RETURNING * INTO profile_record;
      
      -- Check if milestone (e.g., 3, 5, 10, 15, 30 days)
      IF profile_record.current_streak IN (3, 5, 7, 10, 14, 21, 30, 50, 100) THEN
        is_milestone := true;
        milestone_val := profile_record.current_streak;
      END IF;

    ELSIF profile_record.last_login_date < yesterday THEN
      -- Streak broken
      UPDATE public.user_profiles
      SET current_streak = 1,
          last_login_date = today
      WHERE id = target_user_id
      RETURNING * INTO profile_record;
    END IF;
    -- If last_login_date = today, it's just a same-day login, do nothing to streaks.
  END IF;

  RETURN json_build_object(
    'current_streak', profile_record.current_streak,
    'longest_streak', profile_record.longest_streak,
    'is_milestone', is_milestone,
    'milestone_val', milestone_val
  );
END;
$$;
