
import { supabase } from '@/integrations/supabase/client';
import { SignalPayload } from './types';

export class SignalingService {
  private subscription: { unsubscribe: () => void } | null = null;
  
  constructor(private userId: string) {}
  
  public async sendSignal(signal: SignalPayload): Promise<void> {
    try {
      const { error } = await supabase
        .from('signaling')
        .insert({
          sender_id: signal.sender_id,
          receiver_id: signal.receiver_id,
          signal_data: signal.signal_data,
          created_at: new Date().toISOString()
        });
      
      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Error sending signal:', error);
      throw error;
    }
  }
  
  public setupSignalingListener(callback: (signal: SignalPayload) => void): (() => void) {
    // Clean up any existing subscription
    if (this.subscription) {
      this.subscription.unsubscribe();
      this.subscription = null;
    }
    
    // Create new subscription
    this.subscription = supabase
      .channel('signaling-channel')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'signaling',
        filter: `receiver_id=eq.${this.userId}`
      }, (payload) => {
        const signal = payload.new as SignalPayload;
        callback(signal);
      })
      .subscribe();
    
    // Return cleanup function
    return () => {
      if (this.subscription) {
        this.subscription.unsubscribe();
        this.subscription = null;
      }
    };
  }
  
  public async verifyConnection(): Promise<{ data: any, error: any }> {
    try {
      return await supabase
        .from('health')
        .select('status')
        .single();
    } catch (error) {
      console.error('Error verifying connection:', error);
      return { data: null, error };
    }
  }
}
