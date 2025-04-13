export const encryptMessage = async (plaintext: string): Promise<{ encryptedContent: string, key: string, iv: string }> => {
  try {
    // Generate a random encryption key and IV for this message
    const key = await crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );
    
    const iv = crypto.getRandomValues(new Uint8Array(12));
    
    // Encode the message as UTF-8
    const encoder = new TextEncoder();
    const data = encoder.encode(plaintext);
    
    // Encrypt the message
    const encryptedBuffer = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      data
    );
    
    // Convert encrypted data to base64 string
    const encryptedContent = btoa(String.fromCharCode(...new Uint8Array(encryptedBuffer)));
    
    // Export the key to JWK format
    const exportedKey = await crypto.subtle.exportKey('jwk', key);
    
    // Convert key to string and IV to base64 string
    return {
      encryptedContent,
      key: JSON.stringify(exportedKey),
      iv: btoa(String.fromCharCode(...iv))
    };
  } catch (error) {
    console.error('Encryption error:', error);
    throw error;
  }
};

export const decryptMessage = async (encryptedContent: string, keyString: string): Promise<string> => {
  try {
    if (!encryptedContent || !keyString) {
      throw new Error('Missing encrypted content or key');
    }
    
    // Parse the key from string to JWK
    const keyData = JSON.parse(keyString);
    
    // Import the key
    const key = await crypto.subtle.importKey(
      'jwk',
      keyData,
      { name: 'AES-GCM', length: 256 },
      false,
      ['decrypt']
    );
    
    // Get IV from the message (assuming it's stored with the message)
    const iv = new Uint8Array(Array.from(atob(keyData.iv || ''), c => c.charCodeAt(0)));
    
    // Convert base64 encrypted content to ArrayBuffer
    const encryptedBuffer = new Uint8Array(
      Array.from(atob(encryptedContent), c => c.charCodeAt(0))
    ).buffer;
    
    // Decrypt the message
    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      encryptedBuffer
    );
    
    // Decode the decrypted message
    const decoder = new TextDecoder();
    return decoder.decode(decryptedBuffer);
  } catch (error) {
    console.error('Decryption error:', error);
    throw error;
  }
};

// Define the JsonWebKey type locally if it's not available from lib.dom
export interface CustomJsonWebKey {
  kty: string;
  crv?: string;
  x?: string;
  y?: string;
  d?: string;
  n?: string;
  e?: string;
  p?: string;
  q?: string;
  dp?: string;
  dq?: string;
  qi?: string;
  k?: string;
  [key: string]: string | undefined;
}

// Use our custom type instead of the built-in one
export const generateKeyPair = async (): Promise<{ publicKey: any; privateKey: any }> => {
  try {
    // Generate ECDH key pair
    const keyPair = await crypto.subtle.generateKey(
      {
        name: 'ECDH',
        namedCurve: 'P-256'
      },
      true, // extractable
      ['deriveKey', 'deriveBits'] // can be used for these operations
    );

    // Export keys to JWK format for transmission
    const publicKey = await crypto.subtle.exportKey('jwk', keyPair.publicKey);
    const privateKey = await crypto.subtle.exportKey('jwk', keyPair.privateKey);

    return { publicKey, privateKey };
  } catch (error) {
    console.error('Error generating key pair:', error);
    throw error;
  }
};

// Fix establishSecureConnection function parameters
export const establishSecureConnection = async (
  localPrivateKey: any,
  remotePublicKey: any
): Promise<CryptoKey> => {
  try {
    // Import the local private key
    const privateKey = await crypto.subtle.importKey(
      'jwk',
      localPrivateKey,
      {
        name: 'ECDH',
        namedCurve: 'P-256'
      },
      false, // not extractable
      ['deriveKey', 'deriveBits'] // can be used for these operations
    );

    // Import the remote public key
    const publicKey = await crypto.subtle.importKey(
      'jwk',
      remotePublicKey,
      {
        name: 'ECDH',
        namedCurve: 'P-256'
      },
      true, // extractable
      [] // public key doesn't need operations specified
    );

    // Derive shared bits using ECDH
    const sharedBits = await crypto.subtle.deriveBits(
      {
        name: 'ECDH',
        public: publicKey
      },
      privateKey,
      256 // number of bits to derive
    );

    // Convert the shared bits to an AES-GCM key
    const sharedKey = await crypto.subtle.importKey(
      'raw',
      sharedBits,
      {
        name: 'AES-GCM',
        length: 256
      },
      false, // not extractable
      ['encrypt', 'decrypt'] // operations this key can perform
    );

    return sharedKey;
  } catch (error) {
    console.error('Error establishing secure connection:', error);
    throw error;
  }
};

// Update encryptMessage to work with the already established CryptoKey
export const encryptMessageWithKey = async (
  key: CryptoKey, 
  plaintext: string
): Promise<{ iv: string, encryptedData: string }> => {
  try {
    // Generate a random IV for this message
    const iv = crypto.getRandomValues(new Uint8Array(12));
    
    // Encode the message as UTF-8
    const encoder = new TextEncoder();
    const data = encoder.encode(plaintext);
    
    // Encrypt the message
    const encryptedBuffer = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      data
    );
    
    // Convert encrypted data and IV to base64 strings
    const encryptedData = btoa(String.fromCharCode(...new Uint8Array(encryptedBuffer)));
    const ivString = btoa(String.fromCharCode(...iv));
    
    return {
      iv: ivString,
      encryptedData
    };
  } catch (error) {
    console.error('Encryption error:', error);
    throw error;
  }
};

// Update decryptMessage to work with the already established CryptoKey
export const decryptMessageWithKey = async (
  key: CryptoKey,
  encryptedData: string,
  iv: string
): Promise<string> => {
  try {
    // Convert base64 strings back to ArrayBuffer/Uint8Array
    const encryptedBuffer = new Uint8Array(
      Array.from(atob(encryptedData), c => c.charCodeAt(0))
    ).buffer;
    
    const ivArray = new Uint8Array(
      Array.from(atob(iv), c => c.charCodeAt(0))
    );
    
    // Decrypt the message
    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: ivArray },
      key,
      encryptedBuffer
    );
    
    // Decode the decrypted message
    const decoder = new TextDecoder();
    return decoder.decode(decryptedBuffer);
  } catch (error) {
    console.error('Decryption error:', error);
    throw error;
  }
};
