
import { supabase } from "@/integrations/supabase/client";

export const ensureMessageColumnsExist = async () => {
  try {
    await supabase.rpc('check_and_add_columns', { 
      p_table_name: 'messages', 
      column_names: ['is_edited', 'edited_at', 'is_deleted', 'deleted_at', 'group_id', 'read_at', 'is_delivered'] as any
    });
    console.log('Ensured message columns exist');
    return true;
  } catch (error) {
    console.error('Error checking columns:', error);
    // Continue anyway since the columns might already exist
    return false;
  }
};
