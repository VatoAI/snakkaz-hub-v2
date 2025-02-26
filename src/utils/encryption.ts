
export async function generateKeyPair() {
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

  return { publicKey, privateKey };
}

export async function establishSecureConnection(
  localPublicKey: JsonWebKey,
  localPrivateKey: JsonWebKey,
  remotePublicKey: JsonWebKey
) {
  const importedLocalPrivateKey = await window.crypto.subtle.importKey(
    "jwk",
    localPrivateKey,
    {
      name: "ECDH",
      namedCurve: "P-256",
    },
    false,
    ["deriveBits"]
  );

  const importedRemotePublicKey = await window.crypto.subtle.importKey(
    "jwk",
    remotePublicKey,
    {
      name: "ECDH",
      namedCurve: "P-256",
    },
    false,
    []
  );

  const sharedSecret = await window.crypto.subtle.deriveBits(
    {
      name: "ECDH",
      public: importedRemotePublicKey,
    },
    importedLocalPrivateKey,
    256
  );

  const sharedKey = await window.crypto.subtle.importKey(
    "raw",
    sharedSecret,
    {
      name: "AES-GCM",
      length: 256,
    },
    false,
    ["encrypt", "decrypt"]
  );

  return sharedKey;
}

export async function encryptMessage(message: string): Promise<{ encryptedContent: string; key: string; iv: string }> {
  const key = await window.crypto.subtle.generateKey(
    {
      name: "AES-GCM",
      length: 256,
    },
    true,
    ["encrypt", "decrypt"]
  );

  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encodedMessage = new TextEncoder().encode(message);

  const encryptedData = await window.crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv,
    },
    key,
    encodedMessage
  );

  const exportedKey = await window.crypto.subtle.exportKey("jwk", key);
  
  return {
    encryptedContent: btoa(String.fromCharCode(...new Uint8Array(encryptedData))),
    key: JSON.stringify(exportedKey),
    iv: btoa(String.fromCharCode(...iv))
  };
}

export async function decryptMessage(message: { encrypted_content: string, encryption_key: string | null, iv: string | null }): Promise<string> {
  if (!message.encryption_key || !message.iv) {
    throw new Error("Missing encryption key or IV");
  }

  const key = await window.crypto.subtle.importKey(
    "jwk",
    JSON.parse(message.encryption_key),
    {
      name: "AES-GCM",
      length: 256,
    },
    false,
    ["decrypt"]
  );

  const iv = Uint8Array.from(atob(message.iv), c => c.charCodeAt(0));
  const encryptedData = Uint8Array.from(atob(message.encrypted_content), c => c.charCodeAt(0));

  try {
    const decryptedData = await window.crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: iv,
      },
      key,
      encryptedData
    );

    return new TextDecoder().decode(decryptedData);
  } catch (error) {
    console.error("Decryption error:", error);
    throw new Error("Failed to decrypt message");
  }
}
