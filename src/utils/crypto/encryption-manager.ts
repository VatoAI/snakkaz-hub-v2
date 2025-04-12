import { Buffer } from 'buffer';
import sodium from 'libsodium-wrappers';

export interface KeyPair {
  publicKey: string;
  privateKey: string;
}

export interface EncryptedMessage {
  ciphertext: string;
  nonce: string;
}

export class EncryptionManager {
  private static instance: EncryptionManager;
  private initialized = false;
  private keyPair: KeyPair | null = null;

  private constructor() {}

  public static getInstance(): EncryptionManager {
    if (!EncryptionManager.instance) {
      EncryptionManager.instance = new EncryptionManager();
    }
    return EncryptionManager.instance;
  }

  public async initialize(): Promise<void> {
    if (this.initialized) return;
    await sodium.ready;
    this.initialized = true;
    await this.loadOrGenerateKeyPair();
  }

  private async loadOrGenerateKeyPair(): Promise<void> {
    const storedKeyPair = localStorage.getItem('userKeyPair');
    if (storedKeyPair) {
      this.keyPair = JSON.parse(storedKeyPair);
    } else {
      this.keyPair = await this.generateKeyPair();
      localStorage.setItem('userKeyPair', JSON.stringify(this.keyPair));
    }
  }

  public async generateKeyPair(): Promise<KeyPair> {
    await this.ensureInitialized();
    const keyPair = sodium.crypto_box_keypair();
    return {
      publicKey: Buffer.from(keyPair.publicKey).toString('base64'),
      privateKey: Buffer.from(keyPair.privateKey).toString('base64')
    };
  }

  public async encryptMessage(
    message: string,
    recipientPublicKey: string
  ): Promise<EncryptedMessage> {
    await this.ensureInitialized();
    if (!this.keyPair) throw new Error('No key pair available');

    const nonce = sodium.randombytes_buf(sodium.crypto_box_NONCEBYTES);
    const messageBuffer = Buffer.from(message, 'utf8');
    const recipientPublicKeyBuffer = Buffer.from(recipientPublicKey, 'base64');
    const senderPrivateKeyBuffer = Buffer.from(this.keyPair.privateKey, 'base64');

    const encryptedMessage = sodium.crypto_box_easy(
      messageBuffer,
      nonce,
      recipientPublicKeyBuffer,
      senderPrivateKeyBuffer
    );

    return {
      ciphertext: Buffer.from(encryptedMessage).toString('base64'),
      nonce: Buffer.from(nonce).toString('base64')
    };
  }

  public async decryptMessage(
    encryptedMessage: EncryptedMessage,
    senderPublicKey: string
  ): Promise<string> {
    await this.ensureInitialized();
    if (!this.keyPair) throw new Error('No key pair available');

    const ciphertextBuffer = Buffer.from(encryptedMessage.ciphertext, 'base64');
    const nonceBuffer = Buffer.from(encryptedMessage.nonce, 'base64');
    const senderPublicKeyBuffer = Buffer.from(senderPublicKey, 'base64');
    const recipientPrivateKeyBuffer = Buffer.from(this.keyPair.privateKey, 'base64');

    const decryptedMessage = sodium.crypto_box_open_easy(
      ciphertextBuffer,
      nonceBuffer,
      senderPublicKeyBuffer,
      recipientPrivateKeyBuffer
    );

    return Buffer.from(decryptedMessage).toString('utf8');
  }

  public getPublicKey(): string {
    if (!this.keyPair) throw new Error('No key pair available');
    return this.keyPair.publicKey;
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }
  }

  public async verifyAndImportKeyPair(keyPair: KeyPair): Promise<boolean> {
    await this.ensureInitialized();
    try {
      const publicKeyBuffer = Buffer.from(keyPair.publicKey, 'base64');
      const privateKeyBuffer = Buffer.from(keyPair.privateKey, 'base64');
      
      // Verify the key pair is valid by attempting to encrypt and decrypt a test message
      const testMessage = 'test';
      const nonce = sodium.randombytes_buf(sodium.crypto_box_NONCEBYTES);
      const encrypted = sodium.crypto_box_easy(
        Buffer.from(testMessage),
        nonce,
        publicKeyBuffer,
        privateKeyBuffer
      );
      
      const decrypted = sodium.crypto_box_open_easy(
        encrypted,
        nonce,
        publicKeyBuffer,
        privateKeyBuffer
      );
      
      const isValid = Buffer.from(decrypted).toString('utf8') === testMessage;
      
      if (isValid) {
        this.keyPair = keyPair;
        localStorage.setItem('userKeyPair', JSON.stringify(keyPair));
      }
      
      return isValid;
    } catch (error) {
      console.error('Invalid key pair:', error);
      return false;
    }
  }
} 