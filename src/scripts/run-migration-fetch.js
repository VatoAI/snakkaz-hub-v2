import fetch from 'node-fetch';

const supabaseUrl = 'https://wqpoozpbceucynsojmbk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndxcG9venBiY2V1Y3luc29qbWJrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczOTU2ODMwNSwiZXhwIjoyMDU1MTQ0MzA1fQ.pQu0Mn0MlB397_uKmtYKZWe7sZUO9ABpmYEYiHTNZCY';

const sql = `
-- Drop the trigger first
DROP TRIGGER IF EXISTS trigger_clean_stale_presence ON public.user_presence;

-- Drop the function
DROP FUNCTION IF EXISTS clean_stale_presence();

-- Create the function to clean up stale presence records
CREATE OR REPLACE FUNCTION clean_stale_presence()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM public.user_presence
  WHERE last_seen < NOW() - INTERVAL '5 minutes';
END;
$$;

-- Recreate the trigger
CREATE TRIGGER trigger_clean_stale_presence
  AFTER INSERT OR UPDATE
  ON public.user_presence
  FOR EACH STATEMENT
  EXECUTE FUNCTION clean_stale_presence();
`;

async function runMigration() {
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      },
      body: JSON.stringify({ sql })
    });

    const result = await response.text();
    console.log('Migration result:', result);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigration(); 