
import { supabase } from "@/integrations/supabase/client";

// Function to ensure the messages table has all necessary columns for editing/deleting
export const ensureMessageColumnsExist = async () => {
  try {
    // Call the Supabase function to check and add columns
    await supabase.rpc('check_and_add_columns', {
      p_table_name: 'messages',
      column_names: ['is_edited', 'edited_at', 'is_deleted', 'deleted_at', 'group_id']
    });
    
    console.log('Ensured all columns exist');
    return true;
  } catch (error) {
    console.error('Error ensuring columns exist:', error);
    return false;
  }
};
