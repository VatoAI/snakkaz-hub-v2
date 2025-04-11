export async function generateKeyPair(): Promise<{ publicKey: JsonWebKey; privateKey: JsonWebKey }> {
  try {
    const keyPair = await crypto.subtle.generateKey(
      {
        name: 'ECDH',
        namedCurve: 'P-256'
      },
      true,
      ['deriveKey', 'deriveBits']
    );

    const [publicKey, privateKey] = await Promise.all([
      crypto.subtle.exportKey('jwk', keyPair.publicKey),
      crypto.subtle.exportKey('jwk', keyPair.privateKey)
    ]);

    return { publicKey, privateKey };
  } catch (error) {
    console.error('Error generating key pair:', error);
    throw error;
  }
}

export async function encryptMessage(message: string, key: CryptoKey): Promise<string> {
  try {
    const encoder = new TextEncoder();
    const encodedMessage = encoder.encode(message);
    
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encryptedContent = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      key,
      encodedMessage
    );

    const encryptedArray = new Uint8Array(encryptedContent);
    const result = new Uint8Array(iv.length + encryptedArray.length);
    result.set(iv);
    result.set(encryptedArray, iv.length);

    return btoa(String.fromCharCode(...result));
  } catch (error) {
    console.error('Error encrypting message:', error);
    throw error;
  }
}

export async function decryptMessage(encryptedMessage: string, key: CryptoKey): Promise<string> {
  try {
    const encryptedArray = Uint8Array.from(atob(encryptedMessage), c => c.charCodeAt(0));
    const iv = encryptedArray.slice(0, 12);
    const encryptedContent = encryptedArray.slice(12);

    const decryptedContent = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      key,
      encryptedContent
    );

    const decoder = new TextDecoder();
    return decoder.decode(decryptedContent);
  } catch (error) {
    console.error('Error decrypting message:', error);
    throw error;
  }
}

export async function establishSecureConnection(
  localPublicKey: JsonWebKey,
  localPrivateKey: JsonWebKey,
  peerPublicKey: JsonWebKey
): Promise<CryptoKey> {
  try {
    const [localPrivate, peerPublic] = await Promise.all([
      crypto.subtle.importKey(
        'jwk',
        localPrivateKey,
        { name: 'ECDH', namedCurve: 'P-256' },
        false,
        ['deriveKey']
      ),
      crypto.subtle.importKey(
        'jwk',
        peerPublicKey,
        { name: 'ECDH', namedCurve: 'P-256' },
        false,
        []
      )
    ]);

    const derivedKey = await crypto.subtle.deriveKey(
      {
        name: 'ECDH',
        public: peerPublic
      },
      localPrivate,
      {
        name: 'AES-GCM',
        length: 256
      },
      false,
      ['encrypt', 'decrypt']
    );

    return derivedKey;
  } catch (error) {
    console.error('Error establishing secure connection:', error);
    throw error;
  }
} 