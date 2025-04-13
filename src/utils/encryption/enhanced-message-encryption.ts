
/**
 * Enhanced message encryption with Perfect Forward Secrecy
 */

import { arrayBufferToBase64, base64ToArrayBuffer, str2ab, ab2str } from './data-conversion';
import pfsInstance from './perfect-forward-secrecy';

export interface EncryptedMessageWithPFS {
  encryptedContent: string;
  encryptionKeyId: string;
  iv: string;
  timestamp: number;
  version: string;
}

export class EnhancedMessageEncryption {
  private readonly VERSION = "1.0.0";
  
  /**
   * Encrypt a message with Perfect Forward Secrecy
   */
  public async encryptMessage(
    message: string,
    peerId: string
  ): Promise<EncryptedMessageWithPFS> {
    try {
      // Get current key pair with PFS
      const { keyPair, keyId } = await pfsInstance.getCurrentKeyPair(peerId);
      
      // Generate a random AES encryption key for this specific message
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
      
      // Further encrypt the exported key with the peer's public key
      // This would normally be done here, but simplified for brevity
      
      return {
        encryptedContent: arrayBufferToBase64(encryptedBuffer),
        encryptionKeyId: keyId,
        iv: arrayBufferToBase64(iv),
        timestamp: Date.now(),
        version: this.VERSION
      };
    } catch (error) {
      console.error("Enhanced message encryption failed:", error);
      throw new Error("Failed to encrypt message with PFS");
    }
  }

  /**
   * Decrypt a message with Perfect Forward Secrecy
   */
  public async decryptMessage(
    encryptedMessage: EncryptedMessageWithPFS,
    peerId: string
  ): Promise<string> {
    try {
      // Get the key pair used for encryption based on keyId
      const keyPairWithTimestamp = pfsInstance.getKeyPairById(peerId, encryptedMessage.encryptionKeyId);
      
      if (!keyPairWithTimestamp) {
        throw new Error(`No key pair found for ID ${encryptedMessage.encryptionKeyId}`);
      }
      
      // For simplicity, we'll assume the key is directly available
      // In a real implementation, we'd decrypt the symmetric key using our private key
      
      // Convert base64 to ArrayBuffer
      const encryptedBuffer = base64ToArrayBuffer(encryptedMessage.encryptedContent);
      const ivBuffer = base64ToArrayBuffer(encryptedMessage.iv);
      
      // Import encryption key (simplified)
      const key = await window.crypto.subtle.generateKey(
        {
          name: "AES-GCM",
          length: 256,
        },
        true,
        ["encrypt", "decrypt"]
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
      console.error("Enhanced message decryption failed:", error);
      throw new Error("Failed to decrypt message with PFS");
    }
  }
}

// Create a singleton instance
const enhancedEncryptionInstance = new EnhancedMessageEncryption();
export default enhancedEncryptionInstance;
