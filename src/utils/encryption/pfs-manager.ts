
import { generateKeyPair } from '../encryption';

interface KeyPairWithTimestamp {
  keyPair: { publicKey: JsonWebKey; privateKey: JsonWebKey };
  timestamp: number;
}

export class PFSManager {
  private keyPairStore: Map<string, KeyPairWithTimestamp[]> = new Map();
  private readonly MAX_STORED_KEYS = 5;
  private readonly KEY_ROTATION_INTERVAL = 1000 * 60 * 60; // 1 hour in milliseconds

  constructor() {}

  public async getCurrentKeyPair(peerId: string): Promise<{ publicKey: JsonWebKey; privateKey: JsonWebKey }> {
    let keyPairs = this.keyPairStore.get(peerId);
    
    if (!keyPairs || keyPairs.length === 0) {
      const newKeyPair = await this.generateAndStoreKeyPair(peerId);
      return newKeyPair.keyPair;
    }
    
    // Return the most recent key pair
    return keyPairs[keyPairs.length - 1].keyPair;
  }

  private async generateAndStoreKeyPair(peerId: string): Promise<KeyPairWithTimestamp> {
    const keyPair = await generateKeyPair();
    const keyPairWithTimestamp: KeyPairWithTimestamp = {
      keyPair,
      timestamp: Date.now()
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

  public async rotateKeys(peerId: string): Promise<void> {
    const keyPairs = this.keyPairStore.get(peerId);
    
    if (!keyPairs || keyPairs.length === 0) {
      await this.generateAndStoreKeyPair(peerId);
      return;
    }
    
    const latestKeyPair = keyPairs[keyPairs.length - 1];
    const timeSinceLastRotation = Date.now() - latestKeyPair.timestamp;
    
    if (timeSinceLastRotation > this.KEY_ROTATION_INTERVAL) {
      await this.generateAndStoreKeyPair(peerId);
    }
  }

  public getKeyHistory(peerId: string): KeyPairWithTimestamp[] {
    return this.keyPairStore.get(peerId) || [];
  }

  public clearKeys(peerId: string): void {
    this.keyPairStore.delete(peerId);
  }
}
