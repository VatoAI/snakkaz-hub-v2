
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export function MigrationRunner() {
  const [isRunning, setIsRunning] = useState(false);

  const runMigration = async () => {
    try {
      setIsRunning(true);
      const sql = `
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
      `;

      // Use direct Supabase client call instead of executeSQL
      const { error } = await supabase.rpc('exec_sql', { sql });
      
      if (error) throw error;
      
      toast.success('Migration completed successfully');
    } catch (error) {
      console.error('Migration failed:', error);
      toast.error('Migration failed: ' + (error as Error).message);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="p-4">
      <Button 
        onClick={runMigration} 
        disabled={isRunning}
        className="w-full"
      >
        {isRunning ? 'Running Migration...' : 'Run Migration'}
      </Button>
    </div>
  );
} 
