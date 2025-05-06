import { Request, Response } from 'express';
import { buyerMatchingService } from '../services/buyerMatching/buyerMatchingService';
import logger from '../utils/logger';

/**
 * Get all active buyers
 * This endpoint returns all active buyers from the database
 * Frontend can then perform matching calculations as needed
 */
export const getAllActiveBuyers = async (req: Request, res: Response): Promise<void> => {
  try {
    const buyers = await buyerMatchingService.getAllActiveBuyers();
    
    res.status(200).json({
      success: true,
      data: buyers
    });
  } catch (error) {
    logger.error('Error fetching active buyers', { error });
    res.status(500).json({
      success: false,
      message: 'Failed to fetch active buyers',
      error: (error as Error).message || 'Unknown error'
    });
  }
};

// Export a default object for backward compatibility
export default {
  getAllActiveBuyers
}; 