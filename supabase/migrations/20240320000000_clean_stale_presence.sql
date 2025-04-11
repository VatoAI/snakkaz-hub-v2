-- Drop the existing function if it exists
DROP FUNCTION IF EXISTS clean_stale_presence();

-- Create the function to clean up stale presence records (older than 5 minutes)
CREATE OR REPLACE FUNCTION clean_stale_presence()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM public.user_presence
  WHERE last_seen < NOW() - INTERVAL '5 minutes';
END;
$$; 