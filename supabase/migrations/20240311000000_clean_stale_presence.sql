-- Create a function to execute dynamic SQL
CREATE OR REPLACE FUNCTION execute_sql(sql_command text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE sql_command;
  RETURN json_build_object('status', 'success');
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('status', 'error', 'message', SQLERRM);
END;
$$;

-- Drop the existing trigger if it exists
DROP TRIGGER IF EXISTS clean_stale_presence_trigger ON public.user_presence;

-- Drop the existing function if it exists
DROP FUNCTION IF EXISTS clean_stale_presence();

-- Create the function with the correct return type
CREATE OR REPLACE FUNCTION clean_stale_presence()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM public.user_presence
  WHERE last_seen < NOW() - INTERVAL '5 minutes';
END;
$$;

-- Create a trigger to automatically clean up stale records
CREATE OR REPLACE TRIGGER clean_stale_presence_trigger
AFTER INSERT OR UPDATE ON public.user_presence
FOR EACH STATEMENT
EXECUTE FUNCTION clean_stale_presence(); 