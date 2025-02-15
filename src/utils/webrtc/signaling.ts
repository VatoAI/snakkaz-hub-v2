
import { supabase } from '@/integrations/supabase/client';
import type { SignalingInsert } from './types';

export class SignalingService {
  constructor(private userId: string) {}

  setupSignalingListener(onSignal: (signal: any) => Promise<void>) {
    const channel = supabase
      .channel('signaling')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'signaling',
          filter: `receiver_id=eq.${this.userId}`
        },
        async (payload) => {
          console.log('Received signal:', payload);
          await onSignal(payload.new);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }

  async sendSignal(signalMessage: SignalingInsert) {
    await supabase
      .from('signaling')
      .insert([signalMessage]);
  }
}
