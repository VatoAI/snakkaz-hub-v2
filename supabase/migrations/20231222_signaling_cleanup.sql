-- Drop the existing function if it exists
DROP FUNCTION IF EXISTS public.cleanup_old_signaling_records;

-- Function to clean up old signaling records
CREATE OR REPLACE FUNCTION public.cleanup_old_signaling_records()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Delete records older than 5 minutes
  DELETE FROM public.signaling
  WHERE created_at < NOW() - INTERVAL '5 minutes';

  RETURN NULL; -- Triggers must return a trigger type, NULL is acceptable here
END;
$$;

-- Drop the existing function if it exists
DROP FUNCTION IF EXISTS public.clean_stale_presence;

-- Function to clean up stale presence records (older than 5 minutes)
CREATE OR REPLACE FUNCTION public.clean_stale_presence()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM public.user_presence
  WHERE last_seen < NOW() - INTERVAL '5 minutes';

  RETURN NULL; -- Triggers must return a trigger type, NULL is acceptable here
END;
$$;

-- Add a trigger to run cleanup periodically for signaling
DROP TRIGGER IF EXISTS trigger_cleanup_signaling ON public.signaling;
CREATE TRIGGER trigger_cleanup_signaling
  AFTER INSERT ON public.signaling
  FOR EACH STATEMENT
  EXECUTE FUNCTION public.cleanup_old_signaling_records();

-- Add a trigger to run cleanup periodically for user presence
DROP TRIGGER IF EXISTS trigger_cleanup_presence ON public.user_presence;
CREATE TRIGGER trigger_cleanup_presence
  AFTER INSERT ON public.user_presence
  FOR EACH STATEMENT
  EXECUTE FUNCTION public.clean_stale_presence();