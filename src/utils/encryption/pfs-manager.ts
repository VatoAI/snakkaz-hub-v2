import { generateKeyPair } from './key-management';
import { EncryptedMessage } from './types';

export class PFSManager {
  private static readonly KEY_ROTATION_INTERVAL = 1000 * 60 * 60; // 1 hour
  private static readonly MAX_KEYS_PER_PEER = 5;
  private keyPairs: Map<string, Array<{ publicKey: JsonWebKey; privateKey: JsonWebKey; timestamp: number }>> = new Map();
  private rotationTimers: Map<string, NodeJS.Timeout> = new Map();

  constructor() {
    this.initializeKeyRotation();
  }

  private initializeKeyRotation() {
    // Clean up old keys periodically
    setInterval(() => {
      this.cleanupOldKeys();
    }, PFSManager.KEY_ROTATION_INTERVAL);
  }

  public async getCurrentKeyPair(peerId: string): Promise<{ publicKey: JsonWebKey; privateKey: JsonWebKey }> {
    const peerKeys = this.keyPairs.get(peerId);
    if (!peerKeys || peerKeys.length === 0) {
      const newKeyPair = await generateKeyPair();
      this.keyPairs.set(peerId, [{ ...newKeyPair, timestamp: Date.now() }]);
      return newKeyPair;
    }
    return peerKeys[peerKeys.length - 1];
  }

  public async rotateKeys(peerId: string): Promise<{ publicKey: JsonWebKey; privateKey: JsonWebKey }> {
    const newKeyPair = await generateKeyPair();
    const peerKeys = this.keyPairs.get(peerId) || [];
    
    // Add new key pair
    peerKeys.push({ ...newKeyPair, timestamp: Date.now() });
    
    // Remove oldest key if we exceed the maximum
    if (peerKeys.length > PFSManager.MAX_KEYS_PER_PEER) {
      peerKeys.shift();
    }
    
    this.keyPairs.set(peerId, peerKeys);
    return newKeyPair;
  }

  private cleanupOldKeys() {
    const now = Date.now();
    for (const [peerId, keys] of this.keyPairs.entries()) {
      const validKeys = keys.filter(key => 
        now - key.timestamp < PFSManager.KEY_ROTATION_INTERVAL
      );
      if (validKeys.length === 0) {
        this.keyPairs.delete(peerId);
      } else {
        this.keyPairs.set(peerId, validKeys);
      }
    }
  }

  public getKeyHistory(peerId: string): Array<{ publicKey: JsonWebKey; timestamp: number }> {
    const keys = this.keyPairs.get(peerId);
    if (!keys) return [];
    return keys.map(({ publicKey, timestamp }) => ({ publicKey, timestamp }));
  }

  public clearKeys(peerId: string) {
    this.keyPairs.delete(peerId);
    const timer = this.rotationTimers.get(peerId);
    if (timer) {
      clearInterval(timer);
      this.rotationTimers.delete(peerId);
    }
  }
} 