
/**
 * Secure Message Store
 * 
 * Provides encrypted local storage for messages with automatic purging
 * and secure deletion capabilities
 */

import { str2ab, ab2str, arrayBufferToBase64, base64ToArrayBuffer } from '../encryption/data-conversion';
import { DecryptedMessage } from '@/types/message';

export class SecureMessageStore {
  private readonly STORAGE_KEY = 'secure_messages_v1';
  private readonly ENCRYPTION_KEY_KEY = 'secure_message_key_v1';
  private readonly MAX_MESSAGES = 1000;
  private readonly MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
  private encryptionKey: CryptoKey | null = null;
  
  constructor() {
    this.initializeEncryptionKey();
  }
  
  /**
   * Initialize or retrieve encryption key for message storage
   */
  private async initializeEncryptionKey(): Promise<void> {
    try {
      // Check if we already have a stored key
      const storedKeyData = localStorage.getItem(this.ENCRYPTION_KEY_KEY);
      
      if (storedKeyData) {
        // Import the existing key
        const keyData = JSON.parse(storedKeyData);
        this.encryptionKey = await window.crypto.subtle.importKey(
          "jwk",
          keyData,
          { name: "AES-GCM", length: 256 },
          false,
          ["encrypt", "decrypt"]
        );
      } else {
        // Generate a new key
        this.encryptionKey = await window.crypto.subtle.generateKey(
          { name: "AES-GCM", length: 256 },
          true,
          ["encrypt", "decrypt"]
        );
        
        // Store the key
        const exportedKey = await window.crypto.subtle.exportKey("jwk", this.encryptionKey);
        localStorage.setItem(this.ENCRYPTION_KEY_KEY, JSON.stringify(exportedKey));
      }
    } catch (error) {
      console.error("Failed to initialize secure message store:", error);
    }
  }
  
  /**
   * Store messages securely
   */
  public async storeMessages(messages: DecryptedMessage[]): Promise<boolean> {
    try {
      if (!this.encryptionKey) {
        await this.initializeEncryptionKey();
        if (!this.encryptionKey) throw new Error("Failed to initialize encryption key");
      }
      
      // Convert messages to string
      const messagesString = JSON.stringify(messages);
      
      // Generate IV
      const iv = window.crypto.getRandomValues(new Uint8Array(12));
      
      // Encrypt the messages
      const encryptedBuffer = await window.crypto.subtle.encrypt(
        { name: "AES-GCM", iv },
        this.encryptionKey,
        str2ab(messagesString)
      );
      
      // Store the encrypted data with IV
      const storageData = {
        iv: arrayBufferToBase64(iv),
        data: arrayBufferToBase64(encryptedBuffer),
        timestamp: Date.now()
      };
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(storageData));
      return true;
    } catch (error) {
      console.error("Failed to store messages securely:", error);
      return false;
    }
  }
  
  /**
   * Retrieve stored messages
   */
  public async retrieveMessages(): Promise<DecryptedMessage[]> {
    try {
      if (!this.encryptionKey) {
        await this.initializeEncryptionKey();
        if (!this.encryptionKey) throw new Error("Failed to initialize encryption key");
      }
      
      const storedData = localStorage.getItem(this.STORAGE_KEY);
      if (!storedData) return [];
      
      const { iv, data, timestamp } = JSON.parse(storedData);
      
      // Check if data is too old
      if (Date.now() - timestamp > this.MAX_AGE_MS) {
        this.securelyDeleteMessages();
        return [];
      }
      
      // Decrypt the data
      const decryptedBuffer = await window.crypto.subtle.decrypt(
        { name: "AES-GCM", iv: base64ToArrayBuffer(iv) },
        this.encryptionKey,
        base64ToArrayBuffer(data)
      );
      
      // Parse and return the messages
      return JSON.parse(ab2str(decryptedBuffer));
    } catch (error) {
      console.error("Failed to retrieve messages:", error);
      return [];
    }
  }
  
  /**
   * Securely delete stored messages
   */
  public async securelyDeleteMessages(): Promise<void> {
    try {
      // Overwrite with random data before removing
      const dummyData = window.crypto.getRandomValues(new Uint8Array(1024));
      localStorage.setItem(this.STORAGE_KEY, arrayBufferToBase64(dummyData));
      
      // Then remove
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.error("Error during secure deletion:", error);
    }
  }
  
  /**
   * Purge old messages from storage
   */
  public async purgeOldMessages(): Promise<void> {
    try {
      const messages = await this.retrieveMessages();
      
      if (messages.length === 0) return;
      
      // Filter out old messages
      const now = Date.now();
      const filteredMessages = messages.filter(msg => {
        const messageDate = new Date(msg.created_at).getTime();
        return now - messageDate <= this.MAX_AGE_MS;
      });
      
      // Trim to max size
      const trimmedMessages = filteredMessages.slice(-this.MAX_MESSAGES);
      
      // Only update storage if anything changed
      if (trimmedMessages.length !== messages.length) {
        await this.storeMessages(trimmedMessages);
      }
    } catch (error) {
      console.error("Failed to purge old messages:", error);
    }
  }
}

// Create singleton instance
const secureMessageStoreInstance = new SecureMessageStore();
export default secureMessageStoreInstance;
