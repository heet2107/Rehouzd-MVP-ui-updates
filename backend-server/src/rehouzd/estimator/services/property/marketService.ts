import marketRepository from '../../repositories/marketRepository';
import logger from '../../utils/logger';

/**
 * Service for market data operations
 */
class MarketService {
  /**
   * Get market underwrite inputs for a specific location
   * 
   * @param state The state abbreviation (e.g., 'FL')
   * @param county The county name (e.g., 'Lake')
   * @returns Market data with cap_rate and operating_expense
   */
  async getMarketUnderwriteInputs(state: string, county: string): Promise<{
    cap_rate: number;
    operating_expense: number;
    reference_market: string;
  }> {
    try {
      // Normalize inputs
      const normalizedState = state.trim().toUpperCase();
      const normalizedCounty = county.trim();
      
      logger.info('Getting market underwrite inputs', { state: normalizedState, county: normalizedCounty });
      
      // Get market data from repository
      const marketData = await marketRepository.getMarketUnderwriteInputs(normalizedState, normalizedCounty);
      
      // If market data found, return it
      if (marketData) {
        return marketData;
      }
      
      // If no market data found, try to get default values
      logger.info('No market data found for location, using defaults', { 
        state: normalizedState, 
        county: normalizedCounty 
      });
      
      return await marketRepository.getDefaultMarketUnderwriteInputs();
    } catch (error: any) {
      logger.error('Error getting market underwrite inputs', {
        error: error.message,
        state,
        county
      });
      
      // Return default values on error
      return {
        cap_rate: 8.0,
        operating_expense: 40.0,
        reference_market: 'Default (Error Fallback)'
      };
    }
  }

  /**
   * Get market flip calculation inputs
   * 
   * @returns Market calculation reference data with interest_rate, total_closing_holding_costs, and margin_percentage
   */
  async getMarketFlipCalculationInputs(): Promise<{
    interest_rate: number;
    total_closing_holding_costs: number;
    margin_percentage: number;
    commission_rate: number;
  }> {
    try {
      logger.info('Getting market flip calculation inputs');
      
      // Get calculation reference data from repository
      const referenceData = await marketRepository.getMarketCalculationReference();
      
      // Return the data
      return referenceData;
    } catch (error: any) {
      logger.error('Error getting market flip calculation inputs', {
        error: error.message
      });
      
      // Return default values on error
      return {
        interest_rate: 7.0,
        total_closing_holding_costs: 4.0,
        margin_percentage: 20.0,
        commission_rate: 6.0
      };
    }
  }
}

export default new MarketService(); 