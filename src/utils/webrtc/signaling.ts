import { createClient } from '@supabase/supabase-js';
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';

export interface SignalPayload {
  target: string;
  type: string;
  data: any;
}

export class SignalingService {
  private channel: RealtimeChannel | null = null;
  private supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY
  );
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout: NodeJS.Timeout | null = null;

  constructor(private userId: string) {}

  public async verifyConnection() {
    try {
      const { data, error } = await this.supabase.from('health').select('status').single();
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error verifying connection:', error);
      return { data: null, error };
    }
  }

  public setupSignalingListener(callback: (signal: SignalPayload) => Promise<void>) {
    if (this.channel) {
      this.channel.unsubscribe();
    }

    const setupChannel = () => {
      this.channel = this.supabase
        .channel(`signaling-${this.userId}`)
        .on('broadcast', { event: 'signal' }, async (payload: RealtimePostgresChangesPayload<any>) => {
          try {
            await callback(payload.new as SignalPayload);
          } catch (error) {
            console.error('Error handling signal:', error);
          }
        })
        .subscribe((status) => {
          console.log('Signaling channel subscription status:', status);
          
          if (status === 'CLOSED') {
            console.log('Signaling channel closed, attempting to reconnect...');
            this.handleReconnect();
          } else if (status === 'SUBSCRIBED') {
            console.log('Successfully subscribed to signaling channel');
            this.reconnectAttempts = 0;
          }
        });
    };

    setupChannel();

    return () => {
      if (this.reconnectTimeout) {
        clearTimeout(this.reconnectTimeout);
      }
      if (this.channel) {
        this.channel.unsubscribe();
        this.channel = null;
      }
    };
  }

  private handleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);

    this.reconnectTimeout = setTimeout(() => {
      console.log(`Attempting to reconnect (attempt ${this.reconnectAttempts})...`);
      this.setupSignalingListener(() => Promise.resolve());
    }, delay);
  }

  public async sendSignal(targetUserId: string, signal: Omit<SignalPayload, 'target'>) {
    if (!this.channel) {
      throw new Error('Signaling channel not initialized');
    }

    try {
      const response = await this.channel.send({
        type: 'broadcast',
        event: 'signal',
        payload: {
          ...signal,
          target: targetUserId
        }
      });

      if (!response) {
        throw new Error('Failed to send signal');
      }

      return { error: null };
    } catch (error) {
      console.error('Error sending signal:', error);
      return { error };
    }
  }
}
