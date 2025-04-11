import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wqpoozpbceucynsojmbk.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndxcG9venBiY2V1Y3luc29qbWJrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczOTU2ODMwNSwiZXhwIjoyMDU1MTQ0MzA1fQ.pQu0Mn0MlB397_uKmtYKZWe7sZUO9ABpmYEYiHTNZCY';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  try {
    // First, drop the existing function
    const { error: dropError } = await supabaseAdmin
      .from('_temp_migrations')
      .select('*')
      .limit(1)
      .maybeSingle()
      .or('sql.eq.DROP FUNCTION IF EXISTS clean_stale_presence()');

    if (dropError) {
      console.error('Failed to drop function:', dropError);
      process.exit(1);
    }

    // Then create the new function
    const { error: createError } = await supabaseAdmin
      .from('_temp_migrations')
      .select('*')
      .limit(1)
      .maybeSingle()
      .or(`sql.eq.CREATE OR REPLACE FUNCTION clean_stale_presence()
      RETURNS void
      LANGUAGE plpgsql
      AS $$
      BEGIN
        DELETE FROM public.user_presence
        WHERE last_seen < NOW() - INTERVAL '5 minutes';
      END;
      $$;`);

    if (createError) {
      console.error('Failed to create function:', createError);
      process.exit(1);
    }

    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Unexpected error:', error);
    process.exit(1);
  }
}

runMigration(); 