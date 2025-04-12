import { supabase } from '@/integrations/supabase/client';
import { SupabaseClient } from '@supabase/supabase-js';

export class SupabaseService {
  private static instance: SupabaseService;
  private supabase: SupabaseClient;
  
  private constructor() {
    this.supabase = supabase;
  }
  
  public static getInstance(): SupabaseService {
    if (!SupabaseService.instance) {
      SupabaseService.instance = new SupabaseService();
    }
    return SupabaseService.instance;
  }
  
  public async getProfile(userId: string) {
    try {
      const { data, error } = await this.supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
  }
  
  public async updateProfile(userId: string, updates: any) {
    try {
      const { error } = await this.supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId);
      
      if (error) {
        throw error;
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error updating profile:', error);
      return { success: false, error };
    }
  }
  
  public async getMessages({ 
    userId, 
    receiverId, 
    groupId, 
    limit 
  }: { 
    userId: string; 
    receiverId?: string; 
    groupId?: string; 
    limit?: number; 
  }) {
    try {
      let query = this.supabase
        .from('messages')
        .select('*, sender:sender_id(id, username, full_name, avatar_url)')
        .order('created_at', { ascending: true })
        .limit(limit || 50);
      
      if (receiverId) {
        query = query.or(`sender_id.eq.${userId},receiver_id.eq.${userId}`);
        query = query.or(`sender_id.eq.${receiverId},receiver_id.eq.${receiverId}`);
      } else if (groupId) {
        query = query.eq('group_id', groupId);
      } else {
        query = query.is('group_id', null);
      }
      
      const { data, error } = await query;
      
      if (error) {
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error('Error fetching messages:', error);
      return null;
    }
  }
  
  public subscribeToMessages(
    callback: (payload: any) => void,
    { userId, receiverId, groupId }: { userId?: string; receiverId?: string; groupId?: string }
  ) {
    let channel = this.supabase
      .channel('public:messages')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'messages' },
        (payload) => {
          if (userId && receiverId) {
            if (
              (payload.new.sender_id === userId && payload.new.receiver_id === receiverId) ||
              (payload.new.sender_id === receiverId && payload.new.receiver_id === userId)
            ) {
              callback(payload);
            }
          } else if (userId && !receiverId) {
            if (payload.new.group_id === null) {
              callback(payload);
            }
          } else if (groupId) {
            if (payload.new.group_id === groupId) {
              callback(payload);
            }
          } else {
            callback(payload);
          }
        }
      );
    
    return channel.subscribe();
  }
  
  public async uploadMedia(file: File, folder: string): Promise<string | null> {
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${crypto.randomUUID()}.${fileExt}`;
      
      const { error } = await this.supabase.storage
        .from(folder)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });
      
      if (error) {
        throw error;
      }
      
      return filePath;
    } catch (error) {
      console.error('Error uploading media:', error);
      return null;
    }
  }

  // Fix the message sending method
  public async sendMessage({ 
    content, 
    senderId, 
    receiverId, 
    groupId, 
    encryptedContent, 
    encryptionKey, 
    iv, 
    ttl, 
    mediaUrl, 
    mediaType 
  }: { 
    content: string; 
    senderId: string; 
    receiverId?: string; 
    groupId?: string; 
    encryptedContent: string; 
    encryptionKey: string; 
    iv: string; 
    ttl?: number | null; 
    mediaUrl?: string | null; 
    mediaType?: string | null; 
  }) {
    try {
      // Convert groupId from string to correct type for database
      // Database expects boolean or null, not string
      const dbGroupId = groupId ? true : null;
      
      const { error } = await this.supabase
        .from('messages')
        .insert({
          encrypted_content: encryptedContent,
          encryption_key: encryptionKey,
          iv: iv,
          sender_id: senderId,
          receiver_id: receiverId,
          ephemeral_ttl: ttl,
          media_url: mediaUrl,
          media_type: mediaType,
          group_id: dbGroupId
        });
      
      if (error) {
        throw error;
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }
  
  public async editMessage({
    messageId,
    senderId,
    encryptedContent,
    encryptionKey,
    iv
  }: {
    messageId: string;
    senderId: string;
    encryptedContent: string;
    encryptionKey: string;
    iv: string;
  }) {
    try {
      const { error } = await this.supabase
        .from('messages')
        .update({
          encrypted_content: encryptedContent,
          encryption_key: encryptionKey,
          iv: iv,
          is_edited: true,
          edited_at: new Date().toISOString()
        })
        .eq('id', messageId)
        .eq('sender_id', senderId);
      
      if (error) {
        throw error;
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error editing message:', error);
      return { success: false, error };
    }
  }
  
  public async deleteMessage({ messageId, senderId }: { messageId: string; senderId: string }) {
    try {
      const { error } = await this.supabase
        .from('messages')
        .update({
          is_deleted: true,
          deleted_at: new Date().toISOString()
        })
        .eq('id', messageId)
        .eq('sender_id', senderId);
      
      if (error) {
        throw error;
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error deleting message:', error);
      return { success: false, error };
    }
  }
}
