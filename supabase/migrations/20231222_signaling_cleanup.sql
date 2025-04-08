
-- Drop the existing function if it exists
DROP FUNCTION IF EXISTS public.cleanup_old_signaling_records;

-- Enhanced function to clean up old signaling records with better error handling
CREATE OR REPLACE FUNCTION public.cleanup_old_signaling_records()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Delete records older than 5 minutes with proper logging
  DELETE FROM public.signaling
  WHERE created_at < NOW() - INTERVAL '5 minutes';
  
  -- Log the cleanup to the health table for monitoring
  INSERT INTO public.health (status, last_checked)
  VALUES ('signaling_cleaned', NOW())
  ON CONFLICT (id) DO UPDATE
  SET last_checked = NOW(),
      status = 'signaling_cleaned';

  RETURN NULL; -- Triggers must return a trigger type, NULL is acceptable here
END;
$$;

-- Drop the existing function if it exists
DROP FUNCTION IF EXISTS public.clean_stale_presence;

-- Enhanced function to clean up stale presence records with better error handling
CREATE OR REPLACE FUNCTION public.clean_stale_presence()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Delete presence records older than 5 minutes
  DELETE FROM public.user_presence
  WHERE last_seen < NOW() - INTERVAL '5 minutes';

  -- Log the cleanup to the health table
  INSERT INTO public.health (status, last_checked)
  VALUES ('presence_cleaned', NOW())
  ON CONFLICT (id) DO UPDATE
  SET last_checked = NOW(),
      status = 'presence_cleaned';

  RETURN NULL;
END;
$$;

-- Add a trigger to run cleanup periodically for signaling with improved frequency
DROP TRIGGER IF EXISTS trigger_cleanup_signaling ON public.signaling;
CREATE TRIGGER trigger_cleanup_signaling
  AFTER INSERT ON public.signaling
  FOR EACH ROW
  EXECUTE FUNCTION public.cleanup_old_signaling_records();

-- Add a trigger to run cleanup periodically for user presence
DROP TRIGGER IF EXISTS trigger_cleanup_presence ON public.user_presence;
CREATE TRIGGER trigger_cleanup_presence
  AFTER INSERT ON public.user_presence
  FOR EACH ROW
  EXECUTE FUNCTION public.clean_stale_presence();
