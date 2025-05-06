import { Request, Response } from 'express';
import marketService from '../property/marketService';
import propertyConditionService from '../property/propertyConditionService';
import logger from '../../utils/logger';

/**
 * Interface for rent underwrite slider values
 */
interface RentUnderwriteValues {
  rent: number;
  expense: number;
  capRate: number;
  lowRehab: number;
  highRehab: number;
}

/**
 * Interface for flip underwrite slider values
 */
interface FlipUnderwriteValues {
  sellingCosts: number;
  holdingCosts: number;
  margin: number;
  lowRehab: number;
  highRehab: number;
  afterRepairValue: number;
}

/**
 * Interface for all underwrite slider values
 */
interface UnderwriteSliderValues {
  rent: RentUnderwriteValues;
  flip: FlipUnderwriteValues;
}

/**
 * Interface for a rental property
 */
interface RentalProperty {
  property_id?: string | number;
  price?: number;
  distance?: number;
  status?: string;
  event_type?: string;
  event_name?: string;
}

/**
 * Interface for address data
 */
interface AddressData {
  city?: string;
  state?: string;
  state_abbreviation?: string;
  county?: string;
  zip?: string;
  zip_code?: string;
  condition?: string;
  square_footage?: number;
  [key: string]: any;
}

/**
 * Mock database data for underwrite slider values
 * This JSON mimics what would normally be fetched from a database
 */
const defaultUnderwriteValues: UnderwriteSliderValues = {
  rent: {
    rent: 2500,
    expense: 40,
    capRate: 8.0,
    lowRehab: 50,
    highRehab: 75,
  },
  flip: {
    sellingCosts: 10,
    holdingCosts: 6,
    margin: 25,
    lowRehab: 50,
    highRehab: 75,
    afterRepairValue: 250000
  }
};

/**
 * Helper function to add no-cache headers to responses
 */
const addNoCacheHeaders = (res: Response): void => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
};

/**
 * Service for loading underwrite slider values
 */
class UnderwriteSliderLoaderService {
  /**
   * Get default underwrite slider values
   * @returns The default underwrite slider values
   */
  getDefaultUnderwriteValues(): UnderwriteSliderValues {
    console.log('inside getDefaultUnderwriteValues');
    return { ...defaultUnderwriteValues };
  }
  
  /**
   * Get market data for location
   * 
   * @param addressData The address data containing state and county
   * @returns Market data with cap rate and operating expense
   */
  async getMarketData(addressData: AddressData | null): Promise<{
    cap_rate: number;
    operating_expense: number;
    reference_market: string;
  }> {
    if (!addressData) {
      logger.info('No address data provided, using default market data');
      return {
        cap_rate: defaultUnderwriteValues.rent.capRate,
        operating_expense: defaultUnderwriteValues.rent.expense / 100,
        reference_market: 'Default'
      };
    }
    
    // Extract state and county from address data
    const state = addressData.state_abbreviation || addressData.state || '';
    const county = addressData.county || '';
    
    if (!state || !county) {
      logger.warn('Missing state or county in address data', { state, county });
      return {
        cap_rate: defaultUnderwriteValues.rent.capRate,
        operating_expense: defaultUnderwriteValues.rent.expense / 100,
        reference_market: 'Default'
      };
    }
    
    // Get market data from market service
    try {
      logger.info('Getting market data for location', { state, county });
      const marketData = await marketService.getMarketUnderwriteInputs(state, county);
      return marketData;
    } catch (error) {
      logger.error('Error getting market data', { error });
      return {
        cap_rate: defaultUnderwriteValues.rent.capRate,
        operating_expense: defaultUnderwriteValues.rent.expense / 100,
        reference_market: 'Default'
      };
    }
  }

  /**
   * Calculate rental values based on top rental properties
   * 
   * @param propertyId The ID of the main property
   * @param neighborhoodProperties Array of rental properties
   * @param addressData Address data for market information
   * @returns Rental values based on top rental properties and market data
   */
  async calculateRentalValues(
    propertyId: string, 
    neighborhoodProperties: RentalProperty[] = [],
    addressData: AddressData | null = null
  ): Promise<RentUnderwriteValues> {
    console.log(`Calculating rental values for property ${propertyId} using ${neighborhoodProperties.length} neighborhood properties`);
    
    // Filter to get only rental properties
    const rentalProperties = neighborhoodProperties.filter(prop => 
      prop.status === 'LISTED_RENT' || 
      prop.event_type === 'RENTAL' || 
      prop.event_name === 'LISTED_RENT'
    );
    
    console.log(`Found ${rentalProperties.length} rental properties`);
    
    // Default rental values in case we don't have enough data
    const defaultRentValues = this.getDefaultUnderwriteValues().rent;
    
    // If no rental properties, return default values
    if (rentalProperties.length === 0) {
      console.log('No rental properties found, using default values');
      return defaultRentValues;
    }
    
    // Sort rental properties by price (descending)
    const sortedRentals = [...rentalProperties].sort((a, b) => 
      (b.price || 0) - (a.price || 0)
    );
    
    // Take the top 3 rental properties (or all if less than 3)
    const topRentals = sortedRentals.slice(0, Math.min(3, sortedRentals.length));
    
    console.log(`Using top ${topRentals.length} rental properties for calculations`);
    
    let selectedRent = defaultRentValues.rent;
    if (topRentals.length >= 3) {
      // Use the third property (index 2)
      selectedRent = topRentals[2].price || defaultRentValues.rent;
      console.log(`Using the third highest rental price: $${selectedRent}`);
    } else if (topRentals.length > 0) {
      // If fewer than 3 properties, use the last one
      selectedRent = topRentals[topRentals.length - 1].price || defaultRentValues.rent;
      console.log(`Using the last rental price (${topRentals.length} rentals available): $${selectedRent}`);
    } else {
      console.log(`No rental properties found, using default rent: $${selectedRent}`);
    }
    
    // Get market data for cap rate and operating expense
    const marketData = await this.getMarketData(addressData);
    console.log('Using market data:', marketData);
    
        
    // Calculate rehab costs based on property condition and square footage
    let rehabCosts = {
      lowRehab: defaultRentValues.lowRehab,
      highRehab: defaultRentValues.highRehab,
      condition: 'Default'
    };

    if (addressData?.condition && addressData?.square_footage) {
      try {
        rehabCosts = await propertyConditionService.calculateRehabCosts(
          addressData.condition,
          addressData.square_footage
        );
        console.log(`Calculated rehab costs based on condition '${rehabCosts.condition}' and ${addressData.square_footage} sqft:`, rehabCosts);
      } catch (error) {
        logger.error('Error calculating rehab costs, using defaults', { error });
      }
    } else {
      logger.info('Missing property condition or square footage, using default rehab costs', {
        condition: addressData?.condition,
        squareFootage: addressData?.square_footage
      });
    }
    
    // Use the calculated rent, expense, cap rate, and rehab costs
    return {
      rent: selectedRent,
      expense: marketData.operating_expense,
      capRate: marketData.cap_rate,
      lowRehab: rehabCosts.lowRehab,
      highRehab: rehabCosts.highRehab
      };
  }

  private async getCalculationReferenceData() {
    try {
      logger.info('Getting calculation reference values');
      const referenceData = await marketService.getMarketFlipCalculationInputs();
      return referenceData;
    } catch (error) {
      logger.error('Error getting market calculation reference data', { error });
      return {
        interest_rate: 7.0,
        total_closing_holding_costs: 4.0,
        margin_percentage: 20.0,
        commission_rate: 6.0
      };
    }
  }

  /**
   * Calculate flip values based on property condition and market data
   * 
   * @param propertyId The ID of the main property
   * @param neighborhoodProperties Array of properties
   * @param addressData Address data containing property condition and square footage
   * @returns Flip underwrite values with selling costs, holding costs, margin, and rehab costs
   */
  async calculateFlipValues(
    propertyId: string,
    neighborhoodProperties: RentalProperty[] = [],
    addressData: AddressData | null = null
  ): Promise<FlipUnderwriteValues> {
    console.log(`Calculating sold values for property ${propertyId} using ${JSON.stringify(neighborhoodProperties)}`);

    // Default flip values in case we don't have enough data
    const defaultFlipValues = this.getDefaultUnderwriteValues().flip;
    
    // Filter to get only rental properties
    const soldProperties = neighborhoodProperties.filter(prop => 
      prop.event_type === 'SALE' || 
      prop.event_name === 'SOLD' ||
      prop.status === 'SOLD'
    );
    
    console.log(`Found ${soldProperties.length} sold properties`);
    
    // If no rental properties, return default values
    if (soldProperties.length === 0) {
      console.log('No sold properties found, using default values');
      return defaultFlipValues;
    }
    
    // Sort rental properties by price (descending)
    const sortedSoldProperties = [...soldProperties].sort((a, b) => 
      (b.price || 0) - (a.price || 0)
    );
    
    // Take the top 3 rental properties (or all if less than 3)
    const topSoldProperties = sortedSoldProperties.slice(0, Math.min(2, sortedSoldProperties.length));
    
    console.log(`Using top ${topSoldProperties.length} sold properties for calculations`);
    
    let selectedSold = 250000
    if (topSoldProperties.length >= 2) {
      selectedSold = topSoldProperties[1].price || 250000;
      console.log(`Using the third highest rental price: $${selectedSold}`);
    } else if (topSoldProperties.length > 0) {
      selectedSold = topSoldProperties[topSoldProperties.length - 1].price || 250000;
      console.log(`Using the last rental price (${topSoldProperties.length} rentals available): $${selectedSold}`);
    } else {
      console.log(`No sold properties found, using default sold: $${selectedSold}`);
    }
    console.log(`Calculating flip values for property ${propertyId}`);
    
    
    // Get market calculation reference data for interest rate, holding costs, and margin
    const calculationReferenceData = await this.getCalculationReferenceData();
    console.log('Using calculation reference data:', calculationReferenceData);
    
    // Calculate rehab costs based on property condition and square footage
    let rehabCosts = {
      lowRehab: defaultFlipValues.lowRehab,
      highRehab: defaultFlipValues.highRehab,
      condition: 'Default'
    };
    
    console.log('addressData', addressData);
    
    if (addressData?.condition && addressData?.square_footage) {
      try {
        rehabCosts = await propertyConditionService.calculateRehabCosts(
          addressData.condition,
          addressData.square_footage
        );
        console.log(`Calculated rehab costs based on condition '${rehabCosts.condition}' and ${addressData.square_footage} sqft:`, rehabCosts);
      } catch (error) {
        logger.error('Error calculating rehab costs, using defaults', { error });
      }
    } else {
      logger.info('Missing property condition or square footage, using default rehab costs', {
        condition: addressData?.condition,
        squareFootage: addressData?.square_footage
      });
    }
   
    
    // Use the calculated values or defaults
    return {
      sellingCosts: calculationReferenceData.commission_rate || defaultFlipValues.sellingCosts,
      holdingCosts: calculationReferenceData.total_closing_holding_costs || defaultFlipValues.holdingCosts,
      margin: calculationReferenceData.margin_percentage || defaultFlipValues.margin,
      lowRehab: rehabCosts.lowRehab,
      highRehab: rehabCosts.highRehab,
      afterRepairValue: selectedSold
    };
  }

  /**
   * Get underwrite slider values for a specific property
   * In the future, this will query the database based on property ID
   * For now, it returns mock data with slight variations based on property ID
   * 
   * @param propertyId The ID of the property
   * @param neighborhoodProperties Optional array of neighborhood properties
   * @param addressData Optional address data for market calculations
   * @returns The underwrite slider values for the specified property
   */
  async getUnderwriteValuesForProperty(
    propertyId: string, 
    neighborhoodProperties: RentalProperty[] = [],
    addressData: AddressData | null = null
  ): Promise<UnderwriteSliderValues> {
    // Mimic a database delay
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Calculate rental values based on top rental properties and market data
    const rentalValues = await this.calculateRentalValues(propertyId, neighborhoodProperties, addressData);
    const flipValues = await this.calculateFlipValues(propertyId, neighborhoodProperties, addressData);
    
    // In a real implementation, we would query the database here
    // For now, return mock data with slight variations based on property ID
    
    // Use the last digit of the property ID to create variations
    const lastDigit = parseInt(propertyId.slice(-1)) || 0;
    const multiplier = 1 + (lastDigit / 20); // Create a multiplier between 1.0 and 1.45
    
    // Use rental values for rent, expense and cap rate, but calculate the rest
    return {
      rent: rentalValues,
      flip: flipValues
    };
  }

  /**
   * Save underwrite slider values for a specific property
   * In the future, this will save to the database
   * For now, it just logs the values
   * 
   * @param propertyId The ID of the property
   * @param values The underwrite slider values to save
   * @returns A success message
   */
  async saveUnderwriteValuesForProperty(
    propertyId: string, 
    values: UnderwriteSliderValues
  ): Promise<{ success: boolean; message: string }> {
    // Mimic a database delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // In a real implementation, we would save to the database here
    console.log(`Saving underwrite values for property ${propertyId}:`, JSON.stringify(values, null, 2));
    
    // Return success
    return {
      success: true,
      message: `Underwrite values for property ${propertyId} saved successfully`
    };
  }

  /**
   * Express route handler to get underwrite slider values
   */
  getUnderwriteValues = async (req: Request, res: Response): Promise<void> => {
    try {
      // Add no-cache headers
      addNoCacheHeaders(res);
      
      const propertyId = req.params.propertyId || req.query.propertyId as string;
      console.log(`Getting underwrite values for property: ${propertyId || 'default'}`);
      
      // Get neighborhood properties from request
      const neighborhoodProperties = 
        req.body?.neighborhoodProperties || 
        req.query?.neighborhoodProperties || 
        [];
        
      // Get address data from request
      const addressData = req.body?.addressData || req.query?.addressData || null;
      
      if (!propertyId) {
        // If no property ID is provided, return default values
        const defaultValues = this.getDefaultUnderwriteValues();
        console.log('Returning default values:', defaultValues);
        
        res.json({
          success: true,
          data: defaultValues
        });
        return;
      }
      
      // Get values for the specified property
      const values = await this.getUnderwriteValuesForProperty(propertyId, neighborhoodProperties, addressData);
      console.log(`Returning values for property ${propertyId}:`, values);
      
      res.json({
        success: true,
        data: values
      });
    } catch (error) {
      console.error('Error fetching underwrite values:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to load underwrite values',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * Express route handler to save underwrite slider values
   */
  saveUnderwriteValues = async (req: Request, res: Response): Promise<void> => {
    try {
      // Add no-cache headers
      addNoCacheHeaders(res);
      
      const { propertyId, values } = req.body;
      console.log(`Request to save underwrite values for property ${propertyId}:`, values);
      
      if (!propertyId) {
        res.status(400).json({
          success: false,
          message: 'Property ID is required'
        });
        return;
      }
      
      if (!values) {
        res.status(400).json({
          success: false,
          message: 'Underwrite values are required'
        });
        return;
      }
      
      // Save values for the specified property
      const result = await this.saveUnderwriteValuesForProperty(propertyId, values);
      
      res.json({
        success: true,
        message: result.message
      });
    } catch (error) {
      console.error('Error saving underwrite values:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to save underwrite values',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };
}

export default new UnderwriteSliderLoaderService(); 