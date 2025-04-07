-- Add automatic cleanup for signaling table to prevent buildup of stale records

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

-- Add a trigger to run cleanup periodically
DROP TRIGGER IF EXISTS trigger_cleanup_signaling ON public.signaling;
CREATE TRIGGER trigger_cleanup_signaling
  AFTER INSERT ON public.signaling
  FOR EACH STATEMENT
  EXECUTE FUNCTION public.cleanup_old_signaling_records();