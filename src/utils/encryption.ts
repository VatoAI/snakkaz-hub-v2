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
