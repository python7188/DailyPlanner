-- Add discipline score column to user profiles tracking their daily momentum
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS discipline_score INTEGER DEFAULT 1000;

-- RPC to update discipline score atomically
CREATE OR REPLACE FUNCTION update_discipline_score(target_user_id UUID, delta INTEGER)
RETURNS INTEGER AS $$
DECLARE
    new_score INTEGER;
BEGIN
    UPDATE public.user_profiles
    SET discipline_score = discipline_score + delta
    WHERE id = target_user_id
    RETURNING discipline_score INTO new_score;
    
    RETURN new_score;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
