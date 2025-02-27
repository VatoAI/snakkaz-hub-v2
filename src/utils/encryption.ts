
/**
 * Krypterings-utilities for meldinger
 */

// Generer et tilfeldig nøkkelpar for sikker kommunikasjon
export const generateKeyPair = async (): Promise<{ publicKey: JsonWebKey; privateKey: JsonWebKey }> => {
  try {
    const keyPair = await window.crypto.subtle.generateKey(
      {
        name: "ECDH",
        namedCurve: "P-256",
      },
      true,
      ["deriveKey", "deriveBits"]
    );

    const publicKey = await window.crypto.subtle.exportKey(
      "jwk",
      keyPair.publicKey
    );

    const privateKey = await window.crypto.subtle.exportKey(
      "jwk",
      keyPair.privateKey
    );

    return {
      publicKey,
      privateKey,
    };
  } catch (error) {
    console.error("Key generation failed:", error);
    throw new Error("Failed to generate key pair");
  }
};

// Etabler sikker forbindelse mellom to parter
export const establishSecureConnection = async (
  localPublicKey: JsonWebKey,
  localPrivateKey: JsonWebKey,
  remotePublicKey: JsonWebKey
): Promise<CryptoKey> => {
  try {
    // Importer nøkler
    const privateKey = await window.crypto.subtle.importKey(
      "jwk",
      localPrivateKey,
      {
        name: "ECDH",
        namedCurve: "P-256",
      },
      false,
      ["deriveKey", "deriveBits"]
    );

    const publicKey = await window.crypto.subtle.importKey(
      "jwk",
      remotePublicKey,
      {
        name: "ECDH",
        namedCurve: "P-256",
      },
      true,
      []
    );

    // Utlede en felles hemmelighet
    const derivedKey = await window.crypto.subtle.deriveKey(
      {
        name: "ECDH",
        public: publicKey,
      },
      privateKey,
      {
        name: "AES-GCM",
        length: 256,
      },
      false,
      ["encrypt", "decrypt"]
    );

    return derivedKey;
  } catch (error) {
    console.error("Secure connection establishment failed:", error);
    throw new Error("Failed to establish secure connection");
  }
};

// Konverter string til Uint8Array
const str2ab = (str: string): Uint8Array => {
  const encoder = new TextEncoder();
  return encoder.encode(str);
};

// Konverter Uint8Array til string
const ab2str = (buf: ArrayBuffer): string => {
  const decoder = new TextDecoder();
  return decoder.decode(buf);
};

// Konverter Uint8Array til Base64-string
const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  bytes.forEach(byte => binary += String.fromCharCode(byte));
  return window.btoa(binary);
};

// Konverter Base64-string til Uint8Array
const base64ToArrayBuffer = (base64: string): ArrayBuffer => {
  const binaryString = window.atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
};

// Krypter melding
export const encryptMessage = async (message: string): Promise<{ encryptedContent: string, key: string, iv: string }> => {
  try {
    // Generer tilfeldig krypteringsnøkkel
    const key = await window.crypto.subtle.generateKey(
      {
        name: "AES-GCM",
        length: 256,
      },
      true,
      ["encrypt", "decrypt"]
    );

    // Generer tilfeldig IV
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    
    // Krypter meldingen
    const encryptedBuffer = await window.crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv: iv,
      },
      key,
      str2ab(message)
    );
    
    // Eksporter nøkkelen for lagring
    const exportedKey = await window.crypto.subtle.exportKey("jwk", key);
    
    return {
      encryptedContent: arrayBufferToBase64(encryptedBuffer),
      key: JSON.stringify(exportedKey),
      iv: arrayBufferToBase64(iv)
    };
  } catch (error) {
    console.error("Message encryption failed:", error);
    throw new Error("Failed to encrypt message");
  }
};

// Interface for kryptert melding
export interface EncryptedMessage {
  encrypted_content: string;
  encryption_key: string;
  iv: string;
}

// Dekrypter melding
export const decryptMessage = async (
  encryptedContent: string,
  encryptionKey: string,
  iv: string
): Promise<string> => {
  try {
    // Konverter base64 til ArrayBuffer
    const encryptedBuffer = base64ToArrayBuffer(encryptedContent);
    const ivBuffer = base64ToArrayBuffer(iv);
    
    // Importer krypteringsnøkkel
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
    
    // Dekrypter meldingen
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
};

// Overloaded decryptMessage function that accepts a message object
export async function decryptMessage(message: EncryptedMessage): Promise<string>;
export async function decryptMessage(encryptedContent: string, encryptionKey: string, iv: string): Promise<string>;
export async function decryptMessage(
  messageOrContent: EncryptedMessage | string,
  encryptionKey?: string,
  iv?: string
): Promise<string> {
  try {
    if (typeof messageOrContent === 'object') {
      return decryptMessage(
        messageOrContent.encrypted_content,
        messageOrContent.encryption_key,
        messageOrContent.iv
      );
    } else if (typeof messageOrContent === 'string' && encryptionKey && iv) {
      // Konverter base64 til ArrayBuffer
      const encryptedBuffer = base64ToArrayBuffer(messageOrContent);
      const ivBuffer = base64ToArrayBuffer(iv);
      
      // Importer krypteringsnøkkel
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
      
      // Dekrypter meldingen
      const decryptedBuffer = await window.crypto.subtle.decrypt(
        {
          name: "AES-GCM",
          iv: new Uint8Array(ivBuffer),
        },
        key,
        encryptedBuffer
      );
      
      return ab2str(decryptedBuffer);
    } else {
      throw new Error("Invalid arguments for decryptMessage");
    }
  } catch (error) {
    console.error("Message decryption failed:", error);
    throw new Error("Failed to decrypt message");
  }
}
