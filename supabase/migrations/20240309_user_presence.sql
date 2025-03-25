
-- Ensure user_presence table has the correct structure
CREATE TABLE IF NOT EXISTS public.user_presence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL,
  status public.user_status NOT NULL DEFAULT 'online'::public.user_status,
  last_seen TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add indexes for quick lookups
CREATE INDEX IF NOT EXISTS idx_user_presence_user_id ON public.user_presence(user_id);
CREATE INDEX IF NOT EXISTS idx_user_presence_status ON public.user_presence(status);

-- Ensure we have the user_status enum type
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_status') THEN
    CREATE TYPE public.user_status AS ENUM ('online', 'busy', 'brb');
  END IF;
END$$;

-- Function to clean up stale presence records (older than 5 minutes)
CREATE OR REPLACE FUNCTION clean_stale_presence()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM public.user_presence
  WHERE last_seen < NOW() - INTERVAL '5 minutes';
END;
$$;

-- Make sure we have the clean-up trigger
DROP TRIGGER IF EXISTS trigger_clean_stale_presence ON public.user_presence;
CREATE TRIGGER trigger_clean_stale_presence
  AFTER INSERT OR UPDATE ON public.user_presence
  FOR EACH STATEMENT
  EXECUTE FUNCTION clean_stale_presence();

-- Function to safely handle presence upserts with explicit error handling
CREATE OR REPLACE FUNCTION handle_presence_upsert(
  p_user_id UUID,
  p_status user_status,
  p_last_seen TIMESTAMP WITH TIME ZONE
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  -- Try to insert, if it fails with unique violation, update instead
  BEGIN
    INSERT INTO public.user_presence(user_id, status, last_seen)
    VALUES (p_user_id, p_status, p_last_seen);
  EXCEPTION
    WHEN unique_violation THEN
      UPDATE public.user_presence
      SET status = p_status, last_seen = p_last_seen
      WHERE user_id = p_user_id;
  END;
END;
$$;
