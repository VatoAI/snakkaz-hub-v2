/**
 * Message encryption and decryption utilities
 */

import { EncryptedMessage } from './types';
import { str2ab, ab2str, arrayBufferToBase64, base64ToArrayBuffer } from './data-conversion';
import { PFSManager } from './pfs-manager';

export class MessageEncryption {
  private pfsManager: PFSManager;

  constructor() {
    this.pfsManager = new PFSManager();
  }

  public async encryptMessage(
    message: string,
    peerId: string,
    isDirect: boolean = false
  ): Promise<{ encryptedContent: string, key: string, iv: string, keyId: string }> {
    try {
      // Get current key pair for PFS
      const keyPair = await this.pfsManager.getCurrentKeyPair(peerId);
      const keyId = Date.now().toString(); // Unique identifier for the key used

      // Generate random encryption key
      const key = await window.crypto.subtle.generateKey(
        {
          name: "AES-GCM",
          length: 256,
        },
        true,
        ["encrypt", "decrypt"]
      );

      // Generate random IV
      const iv = window.crypto.getRandomValues(new Uint8Array(12));
      
      // Encrypt the message
      const encryptedBuffer = await window.crypto.subtle.encrypt(
        {
          name: "AES-GCM",
          iv: iv,
        },
        key,
        str2ab(message)
      );
      
      // Export the key for storage
      const exportedKey = await window.crypto.subtle.exportKey("jwk", key);
      
      return {
        encryptedContent: arrayBufferToBase64(encryptedBuffer),
        key: JSON.stringify(exportedKey),
        iv: arrayBufferToBase64(iv),
        keyId
      };
    } catch (error) {
      console.error("Message encryption failed:", error);
      throw new Error("Failed to encrypt message");
    }
  }

  public async decryptMessage(
    encryptedMessage: string,
    encryptionKey: string,
    iv: string,
    keyId: string,
    peerId: string
  ): Promise<string> {
    try {
      // Verify key is still valid
      const keyHistory = this.pfsManager.getKeyHistory(peerId);
      const keyIsValid = keyHistory.some(key => key.timestamp.toString() === keyId);
      
      if (!keyIsValid) {
        throw new Error("Invalid or expired key");
      }

      // Convert base64 to ArrayBuffer
      const encryptedBuffer = base64ToArrayBuffer(encryptedMessage);
      const ivBuffer = base64ToArrayBuffer(iv);
      
      // Import encryption key
      const key = await window.crypto.subtle.importKey(
        "jwk",
        JSON.parse(encryptionKey),
        {
          name: "AES-GCM",
          length: 256,
        },
        false,
        ["decrypt"]
      );
      
      // Decrypt the message
      const decryptedBuffer = await window.crypto.subtle.decrypt(
        {
          name: "AES-GCM",
          iv: new Uint8Array(ivBuffer),
        },
        key,
        encryptedBuffer
      );
      
      return ab2str(decryptedBuffer);
    } catch (error) {
      console.error("Message decryption failed:", error);
      throw new Error("Failed to decrypt message");
    }
  }

  public async rotateKeys(peerId: string) {
    await this.pfsManager.rotateKeys(peerId);
  }

  public clearKeys(peerId: string) {
    this.pfsManager.clearKeys(peerId);
  }
}
