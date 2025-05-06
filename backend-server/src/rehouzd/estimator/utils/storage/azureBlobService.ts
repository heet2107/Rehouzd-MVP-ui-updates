import { BlobServiceClient, ContainerClient, StorageSharedKeyCredential } from '@azure/storage-blob';
import config from '../../config';
import logger from '../logger';

// Flag to check if we're in development mode
const isDevelopment = config.env === 'development';

/**
 * Azure Blob Storage Service for handling property images
 */
class AzureBlobService {
  private blobServiceClient: BlobServiceClient;

  constructor() {
    // For local development, check if credentials are available
    if (isDevelopment && (!process.env.AZURE_STORAGE_ACCOUNT || !process.env.AZURE_STORAGE_KEY)) {
      logger.warn('Azure Storage credentials not found. Using mock implementation for development.');
      this.blobServiceClient = {} as BlobServiceClient; // Mock for development
    } else {
      // Initialize with Azure credentials
      const account = process.env.AZURE_STORAGE_ACCOUNT || '';
      const accountKey = process.env.AZURE_STORAGE_KEY || '';
      
      // Create shared key credential
      const sharedKeyCredential = new StorageSharedKeyCredential(account, accountKey);
      
      // Create the BlobServiceClient
      this.blobServiceClient = new BlobServiceClient(
        `https://${account}.blob.core.windows.net`,
        sharedKeyCredential
      );
    }
  }

  /**
   * Create a unique container name for a user and property
   */
  public generateContainerName(userId: string, propertyAddress: string): string {
    // Remove special characters and spaces, convert to lowercase
    const sanitizedAddress = propertyAddress
      .replace(/[^a-z0-9]/gi, '')
      .toLowerCase();
    
    return `user${userId}-${sanitizedAddress}`;
  }

  /**
   * Create a container if it doesn't exist
   */
  public async createContainerIfNotExists(containerName: string): Promise<ContainerClient> {
    if (isDevelopment) {
      logger.info(`[DEV] Mock container created: ${containerName}`);
      return {} as ContainerClient; // Mock for development
    }

    try {
      const containerClient = this.blobServiceClient.getContainerClient(containerName);
      
      // Create the container if it doesn't exist
      const createContainerResponse = await containerClient.createIfNotExists({
        access: 'blob', // Allows public read access for blobs
      });
      
      if (createContainerResponse.succeeded) {
        logger.info(`Container "${containerName}" created successfully`);
      } else {
        logger.info(`Container "${containerName}" already exists`);
      }
      
      return containerClient;
    } catch (error) {
      logger.error('Error creating container', { error, containerName });
      throw error;
    }
  }

  /**
   * Upload an image to Azure Blob Storage
   */
  public async uploadImage(
    containerName: string,
    blobName: string,
    buffer: Buffer,
    contentType: string
  ): Promise<string> {
    if (isDevelopment) {
      logger.info(`[DEV] Mock blob uploaded: ${blobName} to ${containerName}`);
      return `https://mock-storage/${containerName}/${blobName}`; // Mock URL for development
    }

    try {
      const containerClient = this.blobServiceClient.getContainerClient(containerName);
      const blockBlobClient = containerClient.getBlockBlobClient(blobName);
      
      // Upload the file
      await blockBlobClient.upload(buffer, buffer.length, {
        blobHTTPHeaders: {
          blobContentType: contentType,
        },
      });
      
      logger.info(`Blob "${blobName}" uploaded successfully to container "${containerName}"`);
      
      // Return the URL to the blob
      return blockBlobClient.url;
    } catch (error) {
      logger.error('Error uploading blob', { error, containerName, blobName });
      throw error;
    }
  }

  /**
   * List all blobs in a container
   */
  public async listBlobs(containerName: string): Promise<string[]> {
    if (isDevelopment) {
      logger.info(`[DEV] Mock listing blobs in container: ${containerName}`);
      return []; // Mock for development
    }

    try {
      const containerClient = this.blobServiceClient.getContainerClient(containerName);
      const blobs: string[] = [];
      
      // List all blobs in the container
      for await (const blob of containerClient.listBlobsFlat()) {
        blobs.push(blob.name);
      }
      
      return blobs;
    } catch (error) {
      logger.error('Error listing blobs', { error, containerName });
      throw error;
    }
  }

  /**
   * Delete a blob from a container
   */
  public async deleteBlob(containerName: string, blobName: string): Promise<void> {
    if (isDevelopment) {
      logger.info(`[DEV] Mock deleting blob: ${blobName} from ${containerName}`);
      return; // Mock for development
    }

    try {
      const containerClient = this.blobServiceClient.getContainerClient(containerName);
      const blockBlobClient = containerClient.getBlockBlobClient(blobName);
      
      await blockBlobClient.delete();
      logger.info(`Blob "${blobName}" deleted successfully from container "${containerName}"`);
    } catch (error) {
      logger.error('Error deleting blob', { error, containerName, blobName });
      throw error;
    }
  }
}

export default new AzureBlobService(); 