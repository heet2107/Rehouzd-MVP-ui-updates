import { DefaultAzureCredential } from '@azure/identity';
import { SecretClient } from '@azure/keyvault-secrets';
import logger from './logger';

/**
 * Utility for accessing Azure Key Vault secrets
 */
class KeyVaultService {
  private client: SecretClient | null = null;
  private isInitialized = false;
  private readonly keyVaultName: string | undefined;

  constructor() {
    this.keyVaultName = process.env.KEYVAULT_NAME;
  }

  /**
   * Initialize the Key Vault client
   */
  public async initialize(): Promise<boolean> {
    if (this.isInitialized) {
      return true;
    }

    if (!this.keyVaultName) {
      logger.warn('Key Vault name not provided. Key Vault integration disabled.');
      return false;
    }

    try {
      // Check if running in Azure with managed identity
      if (process.env.IDENTITY_ENDPOINT && process.env.IDENTITY_HEADER) {
        logger.info('Initializing Key Vault client with managed identity');
        
        const credential = new DefaultAzureCredential();
        const keyVaultUrl = `https://${this.keyVaultName}.vault.azure.net`;
        
        this.client = new SecretClient(keyVaultUrl, credential);
        this.isInitialized = true;
        
        logger.info('Key Vault client initialized successfully');
        return true;
      } else {
        logger.warn('Not running with managed identity. Key Vault integration disabled.');
        return false;
      }
    } catch (error) {
      logger.error('Failed to initialize Key Vault client', { error });
      return false;
    }
  }

  /**
   * Get a secret from Key Vault
   * @param secretName The name of the secret
   * @returns The secret value or null if not found
   */
  public async getSecret(secretName: string): Promise<string | null> {
    if (!this.isInitialized) {
      const initialized = await this.initialize();
      if (!initialized) {
        return null;
      }
    }

    try {
      if (!this.client) {
        return null;
      }

      const secret = await this.client.getSecret(secretName);
      return secret.value || null;
    } catch (error) {
      logger.error(`Failed to get secret: ${secretName}`, { error });
      return null;
    }
  }
}

// Export a singleton instance
export const keyVaultService = new KeyVaultService();

export default keyVaultService; 