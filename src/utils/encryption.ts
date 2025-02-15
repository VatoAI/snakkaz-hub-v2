
export const encryptMessage = async (message: string): Promise<{ encryptedContent: string, key: string, iv: string }> => {
  try {
    // Generate a new 256-bit key
    const key = await window.crypto.subtle.generateKey(
      {
        name: "AES-GCM",
        length: 256
      },
      true,
      ["encrypt", "decrypt"]
    );

    // Generate a random IV
    const iv = window.crypto.getRandomValues(new Uint8Array(12));

    // Encrypt the message
    const encodedMessage = new TextEncoder().encode(message);
    const encryptedData = await window.crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv
      },
      key,
      encodedMessage
    );

    // Export the key as raw bytes
    const exportedKey = await window.crypto.subtle.exportKey("raw", key);

    // Convert encrypted data, key and IV to base64
    const encryptedContent = btoa(String.fromCharCode.apply(null, [...new Uint8Array(encryptedData)]));
    const keyBase64 = btoa(String.fromCharCode.apply(null, [...new Uint8Array(exportedKey)]));
    const ivBase64 = btoa(String.fromCharCode.apply(null, [...iv]));

    return {
      encryptedContent,
      key: keyBase64,
      iv: ivBase64
    };
  } catch (error) {
    console.error('Encryption error:', error);
    throw error;
  }
};

export const decryptMessage = async (message: { encrypted_content: string; encryption_key: string; iv: string }): Promise<string> => {
  try {
    // Convert base64 strings back to Uint8Arrays
    const encryptedData = new Uint8Array(
      atob(message.encrypted_content).split('').map(c => c.charCodeAt(0))
    );
    const keyData = new Uint8Array(
      atob(message.encryption_key).split('').map(c => c.charCodeAt(0))
    );
    const iv = new Uint8Array(
      atob(message.iv).split('').map(c => c.charCodeAt(0))
    );

    // Import the key
    const key = await window.crypto.subtle.importKey(
      "raw",
      keyData,
      {
        name: "AES-GCM",
        length: 256
      },
      true,
      ["decrypt"]
    );

    // Decrypt the data
    const decryptedData = await window.crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv
      },
      key,
      encryptedData
    );

    // Convert the decrypted data back to a string
    return new TextDecoder().decode(decryptedData);
  } catch (error) {
    console.error('Decryption error:', error);
    return '[Krypteringsfeil]';
  }
};
