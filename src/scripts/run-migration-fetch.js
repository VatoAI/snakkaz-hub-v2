import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wqpoozpbceucynsojmbk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndxcG9venBiY2V1Y3luc29qbWJrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczOTU2ODMwNSwiZXhwIjoyMDU1MTQ0MzA1fQ.pQu0Mn0MlB397_uKmtYKZWe7sZUO9ABpmYEYiHTNZCY';

const supabase = createClient(supabaseUrl, supabaseKey, {
  db: {
    schema: 'public'
  }
});

async function runMigration() {
  try {
    // First, let's create a function to clean up stale records
    const { error: deleteError } = await supabase
      .from('user_presence')
      .delete()
      .lt('last_seen', new Date(Date.now() - 5 * 60 * 1000).toISOString());

    if (deleteError) {
      throw deleteError;
    }

    console.log('Successfully cleaned up stale presence records');

    // Set up a cron job or scheduled task to run this cleanup periodically
    console.log('Note: You should set up a cron job or scheduled task to run this cleanup periodically');
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigration(); 