import { supabase } from '@/integrations/supabase/client';
import { establishSecureConnection, generateKeyPair } from '../encryption';
import type { JsonWebKey } from '../encryption';

interface KeyExchangePayload {
  senderPublicKey: string;
  recipientId: string;
  timestamp: number;
}

export class KeyExchangeManager {
  private static instance: KeyExchangeManager;
  private knownPublicKeys: Map<string, JsonWebKey> = new Map();
  private secureConnectionsCallback: ((peerId: string, secret: CryptoKey) => void) | null = null;
  private localKeyPair: { publicKey: JsonWebKey, privateKey: JsonWebKey } | null = null;
  private keyExchangeUnsubscribe: (() => Promise<string>) | null = null;

  private constructor() {
  }

  public static getInstance(): KeyExchangeManager {
    if (!KeyExchangeManager.instance) {
      KeyExchangeManager.instance = new KeyExchangeManager();
    }
    return KeyExchangeManager.instance;
  }

  public setLocalKeyPair(keyPair: { publicKey: JsonWebKey, privateKey: JsonWebKey }): void {
    this.localKeyPair = keyPair;
    console.log("KeyExchangeManager received local key pair.");
  }

  public setSecureConnectionCallback(callback: (peerId: string, secret: CryptoKey) => void): void {
    this.secureConnectionsCallback = callback;
    console.log("KeyExchangeManager secure connection callback set.");
  }

  public async initiateKeyExchange(recipientId: string, localPublicKey: JsonWebKey): Promise<void> {
    if (!localPublicKey) {
      throw new Error("Local public key is not available for key exchange.");
    }
    console.log(`Initiating key exchange with ${recipientId}`);

    const payload: KeyExchangePayload = {
      senderPublicKey: JSON.stringify(localPublicKey),
      recipientId,
      timestamp: Date.now()
    };

    const user = (await supabase.auth.getUser()).data.user;
    if (!user) throw new Error("User not authenticated for key exchange");
    const userId = user.id;

    const { error } = await supabase
      .from('key_exchange')
      .insert([{
        sender_id: userId,
        recipient_id: recipientId,
        public_key: payload.senderPublicKey,
        created_at: new Date().toISOString()
      }]);

    if (error) {
      console.error("Supabase key exchange insert error:", error);
      throw new Error(`Key exchange initiation failed: ${error.message}`);
    }
    console.log(`Key exchange initiated successfully with ${recipientId}`);
  }

  public async handleIncomingKeyExchange(senderId: string, senderPublicKeyString: string): Promise<void> {
    console.log(`Handling incoming key exchange from ${senderId}`);
    if (!this.localKeyPair || !this.localKeyPair.privateKey) {
      console.error("Cannot handle incoming key exchange: Local private key not set.");
      return;
    }

    let senderPublicKey: JsonWebKey;
    try {
      senderPublicKey = JSON.parse(senderPublicKeyString);
      if (!senderPublicKey || typeof senderPublicKey !== 'object' || !senderPublicKey.kty) {
        throw new Error('Invalid public key format received (parsing).');
      }
    } catch (e) {
      console.error("Failed to parse incoming public key string:", senderPublicKeyString, e);
      throw new Error('Invalid public key format received (parsing error).');
    }

    this.knownPublicKeys.set(senderId, senderPublicKey);
    console.log(`Stored public key for ${senderId}`);

    try {
      console.log(`Attempting to establish secure connection with ${senderId}`);
      const sharedSecret = await establishSecureConnection(this.localKeyPair.privateKey, senderPublicKey);
      console.log(`Successfully derived shared secret with ${senderId}`);

      if (this.secureConnectionsCallback) {
        this.secureConnectionsCallback(senderId, sharedSecret);
        console.log(`Shared secret passed back via callback for ${senderId}`);
      } else {
        console.warn("Secure connection callback not set in KeyExchangeManager. Secret cannot be stored.");
      }
    } catch (error) {
      console.error(`Failed to establish secure connection with ${senderId}:`, error);
    }

    const existingExchange = await this.getExistingKeyExchange(senderId);
    if (!existingExchange && this.localKeyPair.publicKey) {
      console.log(`No existing exchange found with ${senderId}, initiating response key exchange.`);
      await this.initiateKeyExchange(senderId, this.localKeyPair.publicKey);
    } else if (existingExchange) {
      console.log(`Existing key exchange record found with ${senderId}. No response needed.`);
    } else {
      console.log(`Local public key missing for ${senderId}. Cannot initiate response.`);
    }
  }

  public async getPublicKey(userId: string): Promise<JsonWebKey | null> {
    const cachedKey = this.knownPublicKeys.get(userId);
    if (cachedKey) {
      console.log(`Returning cached public key for ${userId}`);
      return cachedKey;
    }

    console.log(`Fetching public key for ${userId} from database.`);
    const { data, error } = await supabase
      .from('key_exchange')
      .select('public_key')
      .eq('sender_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error(`Error fetching public key for ${userId} from DB:`, error);
      return null;
    }

    if (data && data.public_key) {
      try {
        const publicKey = JSON.parse(data.public_key);
        if (!publicKey || typeof publicKey !== 'object' || !publicKey.kty) {
          throw new Error('Invalid public key format in DB (parsing).');
        }
        this.knownPublicKeys.set(userId, publicKey);
        console.log(`Successfully fetched and cached public key for ${userId}`);
        return publicKey;
      } catch(e) {
        console.error(`Failed to parse public key from DB for ${userId}:`, data.public_key, e);
        return null;
      }
    } else {
      console.log(`Public key not found in DB for ${userId}`);
      return null;
    }
  }

  private async getExistingKeyExchange(recipientId: string): Promise<boolean> {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) {
      console.warn("Cannot check existing key exchange: User not authenticated.");
      return false;
    }
    const localUserId = user.id;

    const { error, count } = await supabase
      .from('key_exchange')
      .select('id', { count: 'exact', head: true })
      .eq('sender_id', localUserId)
      .eq('recipient_id', recipientId);

    if (error) {
      console.error(`Failed to check existing key exchange with ${recipientId}:`, error);
      return false;
    }
    return (count ?? 0) > 0;
  }

  public async setupKeyExchangeListener(): Promise<void> {
    if (this.keyExchangeUnsubscribe) {
      console.log("Key exchange listener already set up. Unsubscribing previous one.");
      await this.keyExchangeUnsubscribe();
    }

    const user = (await supabase.auth.getUser()).data.user;
    if (!user) throw new Error('User not authenticated for key exchange listener');
    const userId = user.id;
    console.log(`Setting up key exchange listener for user ${userId}`);

    const channel = supabase
      .channel('key-exchange-listener')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'key_exchange',
          filter: `recipient_id=eq.${userId}`
        },
        async (payload) => {
          console.log('Received raw key exchange payload:', payload);
          if (payload.new && payload.new.sender_id && payload.new.public_key) {
            const { sender_id, public_key } = payload.new as { sender_id: string; public_key: string };
            if (sender_id !== userId) {
              await this.handleIncomingKeyExchange(sender_id, public_key);
            } else {
              console.log("Ignoring own key exchange message.");
            }
          } else {
            console.warn("Received incomplete key exchange payload:", payload);
          }
        }
      )
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
          console.log('Successfully subscribed to key exchange channel.');
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          console.error(`Key exchange channel subscription error: ${status}`, err || '');
        }
      });

    this.keyExchangeUnsubscribe = async () => {
      console.log("Unsubscribing from key exchange channel.");
      const status = await channel.unsubscribe();
      console.log("Key exchange channel unsubscribe status:", status);
      this.keyExchangeUnsubscribe = null;
      return status;
    };

    console.log("Key exchange listener setup complete.");
  }

  public async cleanup(): Promise<void> {
    if (this.keyExchangeUnsubscribe) {
      await this.keyExchangeUnsubscribe();
    }
    this.knownPublicKeys.clear();
    this.localKeyPair = null;
    this.secureConnectionsCallback = null;
    console.log("KeyExchangeManager cleaned up.");
  }
} 