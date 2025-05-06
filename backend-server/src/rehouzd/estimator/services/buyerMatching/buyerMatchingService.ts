import {
  buyerModel,
  Buyer
} from '../../models/buyer/buyerModel';

/**
 * Service for buyer matching functionality
 */
export class BuyerMatchingService {
  /**
   * Get all active buyers
   * @returns Promise<Buyer[]> Array of active buyers
   */
  public async getAllActiveBuyers(): Promise<Buyer[]> {
    try {
      return await buyerModel.getAllActiveBuyers();
    } catch (error) {
      console.error('Service: Error fetching active buyers:', error);
      throw error;
    }
  }
}

// Export a singleton instance
export const buyerMatchingService = new BuyerMatchingService(); 