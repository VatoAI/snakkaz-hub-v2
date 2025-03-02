
/**
 * Data conversion utilities for encryption
 */

// Convert string to Uint8Array
export const str2ab = (str: string): Uint8Array => {
  const encoder = new TextEncoder();
  return encoder.encode(str);
};

// Convert Uint8Array to string
export const ab2str = (buf: ArrayBuffer): string => {
  const decoder = new TextDecoder();
  return decoder.decode(buf);
};

// Convert Uint8Array to Base64-string
export const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  bytes.forEach(byte => binary += String.fromCharCode(byte));
  return window.btoa(binary);
};

// Convert Base64-string to Uint8Array
export const base64ToArrayBuffer = (base64: string): ArrayBuffer => {
  const binaryString = window.atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
};
