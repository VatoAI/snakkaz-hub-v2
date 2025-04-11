import { supabaseAdmin } from '../utils/supabase-admin';

async function runMigration() {
  try {
    const sql = `
      -- Drop the existing function if it exists
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
    `;

    const { error } = await supabaseAdmin.rpc('exec_sql', { sql });
    
    if (error) {
      console.error('Migration failed:', error);
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