import { SupabaseService } from '@/services/supabase.service';
import { RealtimeChannel } from '@supabase/supabase-js';

export class SignalingService {
  private channel: RealtimeChannel | null = null;
  private supabase: SupabaseService;

  constructor(private userId: string) {
    this.supabase = SupabaseService.getInstance();
  }

  public async setupSignalingChannel(onSignal: (signal: any) => void) {
    try {
      this.channel = await this.supabase.subscribeToSignaling(
        this.userId,
        (payload) => {
          console.log('Received signal:', payload);
          onSignal(payload);
        }
      );
    } catch (error) {
      console.error('Error setting up signaling channel:', error);
      throw error;
    }
  }

  public async sendSignal(targetUserId: string, signal: any) {
    try {
      await this.supabase.sendSignal(targetUserId, signal);
    } catch (error) {
      console.error('Error sending signal:', error);
      throw error;
    }
  }

  public async disconnect() {
    if (this.channel) {
      try {
        await this.channel.unsubscribe();
        this.channel = null;
      } catch (error) {
        console.error('Error disconnecting signaling channel:', error);
      }
    }
  }
}
