import { createClient } from '@supabase/supabase-js';
import { RealtimeChannel } from '@supabase/supabase-js';

export class SignalingService {
  private channel: RealtimeChannel | null = null;
  private supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY
  );

  constructor(private userId: string) {}

  public async verifyConnection() {
    return await this.supabase.from('health').select('status').single();
  }

  public setupSignalingListener(callback: (signal: any) => Promise<void>) {
    if (this.channel) {
      this.channel.unsubscribe();
    }

    this.channel = this.supabase
      .channel(`signaling-${this.userId}`)
      .on('broadcast', { event: 'signal' }, async (payload) => {
        await callback(payload);
      })
      .subscribe((status) => {
        console.log('Signaling channel subscription status:', status);
        if (status === 'CLOSED') {
          console.log('Failed to subscribe to signaling channel:', status);
        }
      });

    return () => {
      if (this.channel) {
        this.channel.unsubscribe();
        this.channel = null;
      }
    };
  }

  public async sendSignal(targetUserId: string, signal: any) {
    if (!this.channel) {
      throw new Error('Signaling channel not initialized');
    }

    return await this.channel.send({
      type: 'broadcast',
      event: 'signal',
      payload: {
        ...signal,
        target: targetUserId
      }
    });
  }
}
