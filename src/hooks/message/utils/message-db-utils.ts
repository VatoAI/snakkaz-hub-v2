
import { supabase } from "@/integrations/supabase/client";

/**
 * Ensures required columns exist in the messages table
 */
export const ensureMessageColumnsExist = async () => {
  try {
    await supabase.rpc('check_and_add_columns', { 
      p_table_name: 'messages', 
      column_names: ['is_edited', 'edited_at', 'is_deleted', 'deleted_at', 'group_id'] as any
    });
  } catch (error) {
    console.log('Error checking columns, continuing anyway:', error);
  }
};

/**
 * Shows a toast notification for media upload progress
 */
export const showUploadToast = (toast: any, status: 'uploading' | 'success' | 'error', message?: string) => {
  if (status === 'uploading') {
    return toast({
      title: "Laster opp fil...",
      description: "Vennligst vent mens filen lastes opp",
    }).id;
  } else if (status === 'success') {
    return toast({
      title: "Fil lastet opp",
      description: message || "Sender melding med vedlegg...",
    });
  } else {
    return toast({
      title: "Feil",
      description: message || "Kunne ikke laste opp fil",
      variant: "destructive",
    });
  }
};

/**
 * Uploads media file to Supabase storage
 */
export const uploadMediaFile = async (mediaFile: File) => {
  const fileExt = mediaFile.name.split('.').pop();
  const filePath = `${crypto.randomUUID()}.${fileExt}`;

  const { error } = await supabase.storage
    .from('chat-media')
    .upload(filePath, mediaFile);

  if (error) {
    throw error;
  }

  return {
    mediaUrl: filePath,
    mediaType: mediaFile.type
  };
};
