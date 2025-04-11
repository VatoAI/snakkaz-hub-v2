import { createClient, SupabaseClient, User, RealtimeChannel } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export class SupabaseService {
  private static instance: SupabaseService;
  private client: SupabaseClient<Database>;
  private currentUser: User | null = null;
  private activeChannels: Map<string, RealtimeChannel> = new Map();
  private reconnectAttempts: number = 0;
  private readonly MAX_RECONNECT_ATTEMPTS = 5;
  private readonly RECONNECT_DELAY = 2000; // 2 seconds

  private constructor() {
    this.client = supabase;

    // Setup auth state change listener
    this.client.auth.onAuthStateChange((event, session) => {
      this.currentUser = session?.user ?? null;
      
      // Reconnect realtime channels on auth change
      if (event === 'SIGNED_IN') {
        this.reconnectChannels();
      } else if (event === 'SIGNED_OUT') {
        this.disconnectAllChannels();
      }
    });
  }

  private async reconnectChannels() {
    for (const [channelName, channel] of this.activeChannels.entries()) {
      try {
        await channel.unsubscribe();
        const newChannel = await this.resubscribeChannel(channelName);
        this.activeChannels.set(channelName, newChannel);
      } catch (error) {
        console.error(`Failed to reconnect channel ${channelName}:`, error);
      }
    }
  }

  private disconnectAllChannels() {
    for (const [channelName, channel] of this.activeChannels.entries()) {
      try {
        channel.unsubscribe();
        this.activeChannels.delete(channelName);
      } catch (error) {
        console.error(`Failed to disconnect channel ${channelName}:`, error);
      }
    }
  }

  private async resubscribeChannel(channelName: string): Promise<RealtimeChannel> {
    return new Promise((resolve, reject) => {
      const channel = this.client.channel(channelName);
      
      channel.on('system', { event: '*' }, (status) => {
        console.log(`Channel ${channelName} status:`, status);
      });

      channel.subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          resolve(channel);
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          if (this.reconnectAttempts < this.MAX_RECONNECT_ATTEMPTS) {
            this.reconnectAttempts++;
            console.log(`Attempting to reconnect channel ${channelName}. Attempt ${this.reconnectAttempts}`);
            setTimeout(() => {
              this.resubscribeChannel(channelName)
                .then(resolve)
                .catch(reject);
            }, this.RECONNECT_DELAY);
          } else {
            reject(new Error(`Failed to connect to channel ${channelName} after ${this.MAX_RECONNECT_ATTEMPTS} attempts`));
          }
        }
      });
    });
  }

  public static getInstance(): SupabaseService {
    if (!SupabaseService.instance) {
      SupabaseService.instance = new SupabaseService();
    }
    return SupabaseService.instance;
  }

  // Auth methods
  public async signIn(email: string, password: string) {
    const { data, error } = await this.client.auth.signInWithPassword({
      email,
      password
    });
    if (error) throw error;
    return data;
  }

  public async signOut() {
    const { error } = await this.client.auth.signOut();
    if (error) throw error;
  }

  // Messages methods
  public async sendMessage(params: {
    content: string;
    senderId: string;
    receiverId?: string;
    groupId?: string;
    encryptedContent: string;
    encryptionKey: string;
    iv: string;
    ttl?: number;
    mediaUrl?: string;
    mediaType?: string;
  }) {
    const { error } = await this.client
      .from('messages')
      .insert({
        sender_id: params.senderId,
        receiver_id: params.receiverId,
        group_id: params.groupId,
        encrypted_content: params.encryptedContent,
        encryption_key: params.encryptionKey,
        iv: params.iv,
        ephemeral_ttl: params.ttl,
        media_url: params.mediaUrl,
        media_type: params.mediaType
      });
    
    if (error) throw error;
  }

  public async editMessage(params: {
    messageId: string,
    senderId: string,
    encryptedContent: string,
    encryptionKey: string,
    iv: string
  }) {
    const { error } = await this.client
      .from('messages')
      .update({
        encrypted_content: params.encryptedContent,
        encryption_key: params.encryptionKey,
        iv: params.iv,
        is_edited: true,
        edited_at: new Date().toISOString()
      })
      .eq('id', params.messageId)
      .eq('sender_id', params.senderId); // Ensure only the sender can edit
    
    if (error) throw error;
  }

  public async deleteMessage(params: {
    messageId: string,
    senderId: string
  }) {
    const { error } = await this.client
      .from('messages')
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString()
      })
      .eq('id', params.messageId)
      .eq('sender_id', params.senderId); // Ensure only the sender can delete
    
    if (error) throw error;
  }

  public async getMessages(params: {
    userId: string;
    receiverId?: string;
    groupId?: string;
    limit?: number;
    offset?: number;
  }) {
    let query = this.client
      .from('messages')
      .select('*, sender:profiles(*)')
      .order('created_at', { ascending: true });

    if (params.receiverId) {
      query = query.or(
        `and(sender_id.eq.${params.userId},receiver_id.eq.${params.receiverId}),` +
        `and(sender_id.eq.${params.receiverId},receiver_id.eq.${params.userId})`
      );
    } else if (params.groupId) {
      query = query.eq('group_id', true);
    } else {
      query = query.is('receiver_id', null).is('group_id', null);
    }

    if (params.limit) {
      query = query.limit(params.limit);
    }

    if (params.offset) {
      query = query.range(params.offset, params.offset + (params.limit || 50) - 1);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  // Realtime subscription methods
  public async subscribeToMessages(
    callback: (payload: any) => void,
    filter?: { userId?: string; receiverId?: string; groupId?: string }
  ): Promise<RealtimeChannel> {
    const channelName = 'messages';
    const channelFilters: any = {
      event: '*',
      schema: 'public',
      table: 'messages'
    };

    if (filter) {
      const filterConditions: string[] = [];
      if (filter.userId) {
        filterConditions.push(`sender_id=eq.${filter.userId}`);
      }
      if (filter.receiverId) {
        filterConditions.push(`receiver_id=eq.${filter.receiverId}`);
      }
      if (filter.groupId) {
        filterConditions.push(`group_id=eq.${filter.groupId}`);
      }
      if (filterConditions.length > 0) {
        channelFilters.filter = filterConditions.join(' AND ');
      }
    }

    try {
      const channel = this.client.channel(channelName);
      
      channel.on('system', { event: '*' }, (status) => {
        console.log(`Messages channel status:`, status);
      });

      channel
        .on('postgres_changes', channelFilters, callback)
        .subscribe((status) => {
          console.log('Messages subscription status:', status);
          if (status === 'SUBSCRIBED') {
            this.activeChannels.set(channelName, channel);
          }
        });

      return channel;
    } catch (error) {
      console.error('Error subscribing to messages:', error);
      throw error;
    }
  }

  // Add signaling channel subscription
  public async subscribeToSignaling(
    userId: string,
    callback: (payload: any) => void
  ): Promise<RealtimeChannel> {
    const channelName = `signaling:${userId}`;
    
    try {
      const channel = this.client.channel(channelName);
      
      channel.on('system', { event: '*' }, (status) => {
        console.log(`Signaling channel status:`, status);
      });

      channel
        .on('broadcast', { event: 'signal' }, callback)
        .subscribe((status) => {
          console.log('Signaling subscription status:', status);
          if (status === 'SUBSCRIBED') {
            this.activeChannels.set(channelName, channel);
          }
        });

      return channel;
    } catch (error) {
      console.error('Error subscribing to signaling:', error);
      throw error;
    }
  }

  // Add method to send signaling message
  public async sendSignal(targetUserId: string, signal: any) {
    const channelName = `signaling:${targetUserId}`;
    try {
      await this.client.channel(channelName).send({
        type: 'broadcast',
        event: 'signal',
        payload: signal
      });
    } catch (error) {
      console.error('Error sending signal:', error);
      throw error;
    }
  }

  // User profile methods
  public async updateProfile(userId: string, updates: Partial<Database['public']['Tables']['profiles']['Update']>) {
    const { error } = await this.client
      .from('profiles')
      .update(updates)
      .eq('id', userId);
    
    if (error) throw error;
  }

  public async getProfile(userId: string) {
    const { data, error } = await this.client
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) throw error;
    return data;
  }

  // Storage methods
  public async uploadMedia(file: File, bucket: string) {
    const fileExt = file.name.split('.').pop();
    const filePath = `${crypto.randomUUID()}.${fileExt}`;

    const { error } = await this.client.storage
      .from(bucket)
      .upload(filePath, file);
    
    if (error) throw error;
    return filePath;
  }

  public getMediaUrl(bucket: string, path: string) {
    return this.client.storage
      .from(bucket)
      .getPublicUrl(path).data.publicUrl;
  }

  // Helper methods
  public getCurrentUser(): User | null {
    return this.currentUser;
  }

  public getClient(): SupabaseClient<Database> {
    return this.client;
  }

  static async executeSQL(sql: string) {
    try {
      const { data, error } = await supabase.rpc('execute_sql', { sql_command: sql });
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error executing SQL:', error);
      throw error;
    }
  }
} 