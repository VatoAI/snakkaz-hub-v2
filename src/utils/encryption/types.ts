
/**
 * Shared types for encryption utilities
 */

// Interface for encrypted message
export interface EncryptedMessage {
  encrypted_content: string;
  encryption_key: string;
  iv: string;
}
