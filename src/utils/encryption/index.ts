
import { EncryptionManager } from '../crypto/encryption-manager';
import { SecureConnectionMonitor, securityMonitor } from './security-monitor';

// Export the singleton instances
export const encryptionManager = EncryptionManager.getInstance();
export const pfsInstance = encryptionManager; // Alias for compatibility
export { securityMonitor };

// Re-export types and classes
export { SecureConnectionMonitor };
