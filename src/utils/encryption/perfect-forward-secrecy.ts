
/**
 * Perfect Forward Secrecy (PFS) implementation
 * 
 * This provides enhanced security by rotating encryption keys regularly
 * and ensuring previous communications remain secure even if a key is compromised.
 */

import { generateKeyPair } from './key-management';

// Interface for key pair with timestamp
export interface KeyPairWithTimestamp {
  keyPair: { publicKey: JsonWebKey; privateKey: JsonWebKey };
  timestamp: number;
  identifier: string;
}

export class PerfectForwardSecrecy {
  private keyPairStore: Map<string, KeyPairWithTimestamp[]> = new Map();
  private readonly MAX_STORED_KEYS = 5;
  private readonly KEY_ROTATION_INTERVAL = 1000 * 60 * 60; // 1 hour in milliseconds
  
  /**
   * Get the current key pair for a peer
   * Generates a new one if none exists or if rotation is needed
   */
  public async getCurrentKeyPair(peerId: string): Promise<{ keyPair: { publicKey: JsonWebKey; privateKey: JsonWebKey }, keyId: string }> {
    let keyPairs = this.keyPairStore.get(peerId);
    
    if (!keyPairs || keyPairs.length === 0) {
      const newKeyPair = await this.generateAndStoreKeyPair(peerId);
      return { 
        keyPair: newKeyPair.keyPair,
        keyId: newKeyPair.identifier
      };
    }
    
    // Check if key rotation is needed
    const latestKeyPair = keyPairs[keyPairs.length - 1];
    const timeSinceLastRotation = Date.now() - latestKeyPair.timestamp;
    
    if (timeSinceLastRotation > this.KEY_ROTATION_INTERVAL) {
      console.log(`Key rotation needed for peer ${peerId}, generating new key pair`);
      const newKeyPair = await this.generateAndStoreKeyPair(peerId);
      return { 
        keyPair: newKeyPair.keyPair,
        keyId: newKeyPair.identifier
      };
    }
    
    // Return the most recent key pair
    return { 
      keyPair: latestKeyPair.keyPair,
      keyId: latestKeyPair.identifier
    };
  }

  /**
   * Generate and store a new key pair
   */
  private async generateAndStoreKeyPair(peerId: string): Promise<KeyPairWithTimestamp> {
    const keyPair = await generateKeyPair();
    const keyId = crypto.randomUUID();
    
    const keyPairWithTimestamp: KeyPairWithTimestamp = {
      keyPair,
      timestamp: Date.now(),
      identifier: keyId
    };
    
    let keyPairs = this.keyPairStore.get(peerId) || [];
    
    // Add new key pair
    keyPairs.push(keyPairWithTimestamp);
    
    // Limit number of stored key pairs
    if (keyPairs.length > this.MAX_STORED_KEYS) {
      keyPairs = keyPairs.slice(-this.MAX_STORED_KEYS);
    }
    
    this.keyPairStore.set(peerId, keyPairs);
    
    return keyPairWithTimestamp;
  }

  /**
   * Get a key pair by its identifier
   */
  public getKeyPairById(peerId: string, keyId: string): KeyPairWithTimestamp | undefined {
    const keyPairs = this.keyPairStore.get(peerId);
    if (!keyPairs) return undefined;
    
    return keyPairs.find(kp => kp.identifier === keyId);
  }

  /**
   * Force key rotation for a specific peer
   */
  public async rotateKeys(peerId: string): Promise<string> {
    const newKeyPair = await this.generateAndStoreKeyPair(peerId);
    return newKeyPair.identifier;
  }

  /**
   * Get all key history for a peer
   * Used for debugging and auditing
   */
  public getKeyHistory(peerId: string): KeyPairWithTimestamp[] {
    return [...(this.keyPairStore.get(peerId) || [])];
  }

  /**
   * Clear all keys for a peer
   * Used when ending a session
   */
  public clearKeys(peerId: string): void {
    this.keyPairStore.delete(peerId);
  }

  /**
   * Perform periodic maintenance on keys
   * - Remove expired keys
   * - Rotate keys that are about to expire
   */
  public async performKeyMaintenance(): Promise<void> {
    const peersToMaintain = Array.from(this.keyPairStore.keys());
    
    for (const peerId of peersToMaintain) {
      await this.getCurrentKeyPair(peerId);
    }
    
    console.log(`Completed key maintenance for ${peersToMaintain.length} peers`);
  }
}

// Create singleton instance
const pfsInstance = new PerfectForwardSecrecy();
export default pfsInstance;
