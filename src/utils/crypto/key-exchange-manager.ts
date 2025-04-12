import { supabase } from '@/integrations/supabase/client';
import { EncryptionManager, KeyPair } from './encryption-manager';

interface KeyExchangePayload {
  senderPublicKey: string;
  recipientId: string;
  timestamp: number;
}

export class KeyExchangeManager {
  private static instance: KeyExchangeManager;
  private encryptionManager: EncryptionManager;
  private knownPublicKeys: Map<string, string> = new Map();

  private constructor() {
    this.encryptionManager = EncryptionManager.getInstance();
  }

  public static getInstance(): KeyExchangeManager {
    if (!KeyExchangeManager.instance) {
      KeyExchangeManager.instance = new KeyExchangeManager();
    }
    return KeyExchangeManager.instance;
  }

  public async initiateKeyExchange(recipientId: string): Promise<void> {
    const publicKey = this.encryptionManager.getPublicKey();
    
    const payload: KeyExchangePayload = {
      senderPublicKey: publicKey,
      recipientId,
      timestamp: Date.now()
    };

    const { error } = await supabase
      .from('key_exchange')
      .insert([{
        sender_id: (await supabase.auth.getUser()).data.user?.id,
        recipient_id: recipientId,
        public_key: publicKey,
        created_at: new Date().toISOString()
      }]);

    if (error) throw new Error(`Key exchange failed: ${error.message}`);
  }

  public async handleIncomingKeyExchange(senderId: string, senderPublicKey: string): Promise<void> {
    // Verify the sender's public key format
    if (!this.isValidPublicKey(senderPublicKey)) {
      throw new Error('Invalid public key format');
    }

    // Store the sender's public key
    this.knownPublicKeys.set(senderId, senderPublicKey);

    // Send back our public key if we haven't already
    const existingExchange = await this.getExistingKeyExchange(senderId);
    if (!existingExchange) {
      await this.initiateKeyExchange(senderId);
    }
  }

  public async getPublicKey(userId: string): Promise<string> {
    // Check if we already have the public key
    const cachedKey = this.knownPublicKeys.get(userId);
    if (cachedKey) return cachedKey;

    // If not, fetch it from the database
    const { data, error } = await supabase
      .from('key_exchange')
      .select('public_key')
      .eq('sender_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      throw new Error('Public key not found for user');
    }

    // Cache and return the public key
    this.knownPublicKeys.set(userId, data.public_key);
    return data.public_key;
  }

  private async getExistingKeyExchange(userId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('key_exchange')
      .select('id')
      .eq('sender_id', (await supabase.auth.getUser()).data.user?.id)
      .eq('recipient_id', userId)
      .limit(1);

    if (error) throw new Error(`Failed to check existing key exchange: ${error.message}`);
    return !!data && data.length > 0;
  }

  private isValidPublicKey(publicKey: string): boolean {
    try {
      const decoded = Buffer.from(publicKey, 'base64');
      return decoded.length === 32; // Libsodium public key length
    } catch {
      return false;
    }
  }

  public async setupKeyExchangeListener(): Promise<void> {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    if (!userId) throw new Error('User not authenticated');

    supabase
      .channel('key-exchange')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'key_exchange',
          filter: `recipient_id=eq.${userId}`
        },
        async (payload) => {
          const { sender_id, public_key } = payload.new;
          await this.handleIncomingKeyExchange(sender_id, public_key);
        }
      )
      .subscribe();
  }
} 