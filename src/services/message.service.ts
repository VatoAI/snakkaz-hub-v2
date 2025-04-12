import { supabase } from '@/integrations/supabase/client';
import { EncryptionManager } from '@/utils/crypto/encryption-manager';
import { KeyExchangeManager } from '@/utils/crypto/key-exchange-manager';
import { WebRTCManager } from '@/utils/webrtc/webrtc-manager';

interface SendMessageParams {
  content: string;
  recipientId: string;
  groupId?: string;
}

interface EncryptedMessageData {
  ciphertext: string;
  nonce: string;
  senderId: string;
  recipientId: string;
  groupId?: string;
  timestamp: string;
}

export class MessageService {
  private static instance: MessageService;
  private encryptionManager: EncryptionManager;
  private keyExchangeManager: KeyExchangeManager;
  private webRTCManager: WebRTCManager;

  private constructor() {
    this.encryptionManager = EncryptionManager.getInstance();
    this.keyExchangeManager = KeyExchangeManager.getInstance();
    this.webRTCManager = WebRTCManager.getInstance();
    this.initializeWebRTC();
  }

  private async initializeWebRTC(): Promise<void> {
    await this.webRTCManager.initialize();
    this.webRTCManager.onMessage((message: { content: string, senderId: string }) => {
      this.notifyMessageCallbacks(message.content, message.senderId);
    });
  }

  public static getInstance(): MessageService {
    if (!MessageService.instance) {
      MessageService.instance = new MessageService();
    }
    return MessageService.instance;
  }

  public async sendMessage({ content, recipientId, groupId }: SendMessageParams): Promise<void> {
    try {
      const currentUser = (await supabase.auth.getUser()).data.user;
      if (!currentUser) throw new Error('User not authenticated');

      // Try to send via WebRTC first
      if (!groupId) {
        // Ensure WebRTC connection exists
        if (!this.webRTCManager.isConnected(recipientId)) {
          await this.webRTCManager.initiateConnection(recipientId);
        }

        // Attempt to send via WebRTC
        const sent = await this.webRTCManager.sendMessage(recipientId, content);
        if (sent) return;
      }

      // Fallback to Supabase if WebRTC fails or if it's a group message
      const recipientPublicKey = await this.keyExchangeManager.getPublicKey(recipientId);
      const encryptedMessage = await this.encryptionManager.encryptMessage(
        content,
        recipientPublicKey
      );

      const { error } = await supabase.from('messages').insert([{
        sender_id: currentUser.id,
        recipient_id: recipientId,
        group_id: groupId,
        encrypted_content: encryptedMessage.ciphertext,
        nonce: encryptedMessage.nonce,
        created_at: new Date().toISOString()
      }]);

      if (error) throw error;
    } catch (error) {
      console.error('Failed to send message:', error);
      throw error;
    }
  }

  public async decryptMessage(message: EncryptedMessageData): Promise<string> {
    try {
      // Get sender's public key
      const senderPublicKey = await this.keyExchangeManager.getPublicKey(message.senderId);

      // Decrypt the message
      const decryptedContent = await this.encryptionManager.decryptMessage(
        {
          ciphertext: message.ciphertext,
          nonce: message.nonce
        },
        senderPublicKey
      );

      return decryptedContent;
    } catch (error) {
      console.error('Failed to decrypt message:', error);
      throw error;
    }
  }

  private messageCallbacks: Set<(message: string, senderId: string) => void> = new Set();

  public onMessage(callback: (message: string, senderId: string) => void): void {
    this.messageCallbacks.add(callback);
  }

  private notifyMessageCallbacks(message: string, senderId: string): void {
    this.messageCallbacks.forEach(callback => callback(message, senderId));
  }

  public async setupMessageListener(): Promise<void> {
    const currentUser = (await supabase.auth.getUser()).data.user;
    if (!currentUser) throw new Error('User not authenticated');

    // Listen for Supabase messages
    supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `recipient_id=eq.${currentUser.id}`
        },
        async (payload) => {
          try {
            const message = payload.new as EncryptedMessageData;
            const decryptedContent = await this.decryptMessage(message);
            this.notifyMessageCallbacks(decryptedContent, message.senderId);
          } catch (error) {
            console.error('Error processing incoming message:', error);
          }
        }
      )
      .subscribe();
  }

  public async getMessages(recipientId: string, limit = 50): Promise<string[]> {
    const currentUser = (await supabase.auth.getUser()).data.user;
    if (!currentUser) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${currentUser.id},recipient_id.eq.${recipientId}),and(sender_id.eq.${recipientId},recipient_id.eq.${currentUser.id})`)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    const decryptedMessages = await Promise.all(
      data.map(async (message) => {
        try {
          return await this.decryptMessage(message as EncryptedMessageData);
        } catch (error) {
          console.error('Failed to decrypt message:', error);
          return '[Encrypted Message]';
        }
      })
    );

    return decryptedMessages.reverse();
  }
} 