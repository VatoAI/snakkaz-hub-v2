
export const encryptMessage = async (message: string): Promise<{ encryptedContent: string, key: string, iv: string }> => {
  // Generate a random encryption key
  const key = await window.crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );

  // Generate a random IV
  const iv = window.crypto.getRandomValues(new Uint8Array(12));

  // Encode the message
  const encodedMessage = new TextEncoder().encode(message);

  // Encrypt the message
  const encryptedContent = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encodedMessage
  );

  // Convert the encrypted content to base64
  const encryptedBase64 = btoa(String.fromCharCode(...new Uint8Array(encryptedContent)));
  
  // Export the key and convert to base64
  const exportedKey = await window.crypto.subtle.exportKey("raw", key);
  const keyBase64 = btoa(String.fromCharCode(...new Uint8Array(exportedKey)));
  
  // Convert IV to base64
  const ivBase64 = btoa(String.fromCharCode(...iv));

  return {
    encryptedContent: encryptedBase64,
    key: keyBase64,
    iv: ivBase64
  };
};

export const decryptMessage = async (message: { encrypted_content: string; encryption_key: string; iv: string }): Promise<string> => {
  try {
    // Convert base64 to array buffer
    const encryptedData = Uint8Array.from(atob(message.encrypted_content), c => c.charCodeAt(0));
    const keyData = Uint8Array.from(atob(message.encryption_key), c => c.charCodeAt(0));
    const iv = Uint8Array.from(atob(message.iv), c => c.charCodeAt(0));

    // Import the key
    const key = await window.crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "AES-GCM", length: 256 },
      true,
      ["decrypt"]
    );

    // Decrypt the data
    const decryptedContent = await window.crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      encryptedData
    );

    // Convert the decrypted array buffer to string
    return new TextDecoder().decode(decryptedContent);
  } catch (error) {
    console.error('Decryption error:', error);
    return '[Krypteringsfeil]';
  }
};
