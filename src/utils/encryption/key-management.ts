
/**
 * Key management utilities for encryption
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
