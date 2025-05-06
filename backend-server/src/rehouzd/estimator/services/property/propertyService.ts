import { Property } from '../../models/property/propertyModel';
import PropertyDistanceCalculator from '../../utils/geo/propertyDistanceCalculator';
import ComparablePropertiesHelper from '../../utils/property/comparablePropertiesHelper';
import parclLabsClient, { PropertyFilter } from '../../utils/api/parclLabsClient';
import propertyRepository from '../../repositories/propertyRepository';
import logger from '../../utils/logger';
import { AppError } from '../../middleware/errorHandler';

interface AddressInfo {
  address: string;
  city: string;
  state_abbreviation: string;
  zip_code: string;
  lat: number;
  lon: number;
}

export class PropertyService {
  /**
   * Format the address object from API or frontend
   */
  formatAddress(addressObj: any): AddressInfo {
    try {
      const addressParts = addressObj.formattedAddress.split(',');
      const street = addressParts[0]?.trim().toUpperCase() || '';
      const city = addressParts[1]?.trim().replace(/\s+/g, '') || '';
      const stateZipParts = addressParts[2]?.trim().split(' ') || [];
      const state_abbreviation = stateZipParts[0] || '';
      const zip_code = stateZipParts[1] || '';
      const lat = addressObj.lat || 0;
      const lon = addressObj.lon || 0;
      
      return {
        address: street,
        city,
        state_abbreviation,
        zip_code,
        lat,
        lon
      };
    } catch (error: any) {
      logger.error('Error formatting address', { error: error.message, addressObj });
      throw new AppError('Invalid address format', 400);
    }
  }

  /**
   * Get property filters based on property details
   */
  getPropertyFilters(property: any): PropertyFilter {
    return {
      property_type: property.property_type || 'SINGLE_FAMILY',
      min_beds: property.bedrooms || 3,
      max_beds: property.bedrooms || 3,
      min_baths: Math.floor(property.bathrooms) || 1,
      max_baths: Math.floor(property.bathrooms) || 1,
      min_sqft: property.square_footage ? Math.floor(property.square_footage * 0.8) : 800,
      max_sqft: property.square_footage ? Math.ceil(property.square_footage * 1.05) : 1050,
      // TODO: Remove this once we have a better way to handle year built
      min_year_built: property.year_built - 20 || 1950,
      max_year_built: property.year_built + 20 || 1960,
      event_history_sale_flag: true,
    };
  }

  /**
   * Get date range for property search
   */
  getDateRange(months: number = 6): { minEventDate: string; maxEventDate: string } {
    const today = new Date();
    const pastDate = new Date();
    pastDate.setMonth(today.getMonth() - months);

    const formatDate = (date: Date): string => {
      const year = date.getFullYear();
      const month = ('0' + (date.getMonth() + 1)).slice(-2);
      const day = ('0' + date.getDate()).slice(-2);
      return `${year}-${month}-${day}`;
    };

    return {
      minEventDate: formatDate(pastDate),
      maxEventDate: formatDate(today)
    };
  }

  /**
   * Extract property IDs from a collection of properties
   */
  extractPropertyIds(properties: any[]): string[] {
    if (!properties || !Array.isArray(properties)) {
      return [];
    }
    
    // Extract unique parcl_property_id values
    const propertyIds = properties
      .filter(property => property && property.parcl_property_id)
      .map(property => String(property.parcl_property_id));
    
    // Remove duplicates
    const uniqueIds = [...new Set(propertyIds)];
    
    logger.debug('Extracted property IDs', { 
      count: uniqueIds.length,
      originalCount: properties.length 
    });
    
    return uniqueIds;
  }

  /**
   * Get property and market data
   */
  async getPropertyAndMarketData(addressInput: any): Promise<any> {
    try {
      // Format the address
      const { address, city, zip_code, state_abbreviation } = this.formatAddress(addressInput);
      logger.info('Processing property data request', { address, city, state_abbreviation });

      // Get address data first
      const addressDataResponse = await parclLabsClient.searchAddress([{ address, city, state_abbreviation, zip_code }]);
      const addressData = addressDataResponse.data;

      if (!addressData.items?.length) {
        logger.warn('No property data found', { address, city, state_abbreviation });
        throw new AppError('Could not retrieve property data', 404);
      }

      // Extract property details
      const propertyDetails = addressData.items[0];
      
      // Check if property is a single-family home
      if (propertyDetails.property_type && propertyDetails.property_type !== 'SINGLE_FAMILY') {
        logger.info('Non-single family home detected', { 
          propertyType: propertyDetails.property_type,
          address: propertyDetails.address 
        });
        
        // Return early with target property and empty comparables
        return {
          targetProperty: propertyDetails,
          comparableProperties: [],
          radiusUsed: 0,
          monthsUsed: 0
        };
      }
      
      // Now get market data
      const marketDataResponse = await parclLabsClient.searchMarkets(zip_code, state_abbreviation);
      const marketData = marketDataResponse.data;

      if (!marketData.items?.length) {
        logger.warn('No market data found', { address, city, state_abbreviation });
        throw new AppError('Could not retrieve market data', 404);
      }

      console.log('marketData...', marketData);

      // Save property data
      const property = new Property(
        0,
        propertyDetails.parcl_property_id || '',
        propertyDetails.address || '',
        propertyDetails.city || '',
        propertyDetails.state_abbreviation || '',
        propertyDetails.county || '',
        propertyDetails.zip_code || '',
        parseFloat(propertyDetails.bathrooms) || 0,
        Math.floor(parseFloat(propertyDetails.bedrooms) || 0),
        parseFloat(propertyDetails.square_footage) || 0,
        parseInt(propertyDetails.year_built) || 0,
        parseFloat(propertyDetails.latitude) || 0,
        parseFloat(propertyDetails.longitude) || 0,
        propertyDetails.current_entity_owner_name || ''
      );

      // Add debug logging to see what's being saved
      console.log('Saving property data:', JSON.stringify({
        parcl_id: propertyDetails.parcl_property_id,
        bathrooms: propertyDetails.bathrooms,
        bedrooms: propertyDetails.bedrooms,
        square_footage: propertyDetails.square_footage,
        year_built: propertyDetails.year_built,
        latitude: propertyDetails.latitude,
        longitude: propertyDetails.longitude
      }));

      try {
        await propertyRepository.savePropertyData(property);
      } catch (error) {
        console.error('Failed to save property data:', error);
        // Continue execution even if saving fails
      }
      
      // Get neighborhood properties
      const parclId = marketData.items[0]?.parcl_id;
      
      if (!parclId) {
        throw new AppError('Could not extract necessary data for the related sales search', 404);
      }

      // Get property filters and date range
      const propertyFilters = this.getPropertyFilters(propertyDetails);
      const { minEventDate, maxEventDate } = this.getDateRange(6);

      // Get related properties
      const relatedPropertiesResponse = await parclLabsClient.searchProperties(
        parclId,
        propertyFilters,
      );

      const relatedPropertiesData = relatedPropertiesResponse.data;

      // Calculate neighborhood properties - use 1.5 miles for initial collection
      const distanceCalculator = new PropertyDistanceCalculator(
        { items: [propertyDetails] }, 
        relatedPropertiesData
      );
      
      const neighborhoodProperties = distanceCalculator.calculatePropertiesWithinRadius(1.5);

      logger.info('Neighborhood properties calculated', { 
        count: neighborhoodProperties.length,
        address: property.address 
      });
      
      // Extract property IDs from neighborhood properties
      const propertyIds = this.extractPropertyIds(neighborhoodProperties);
      
      if (propertyIds.length === 0) {
        logger.warn('No property IDs found for event history search', { address: property.address });
        
        // Return simplified response with only target property and empty comparables
        return {
          targetProperty: propertyDetails,
          comparableProperties: []
        };
      }
      
      // Get event history for the properties
      const eventHistoryResponse = await parclLabsClient.getPropertyEventHistory(
        propertyIds, 
        minEventDate,
        maxEventDate
      );
      
      // Find comparable properties
      const comparableHelper = new ComparablePropertiesHelper(propertyDetails);
      const comparablePropertiesResult = comparableHelper.findComparableProperties(
        neighborhoodProperties,
        eventHistoryResponse.data
      );
      
      logger.info('Comparable properties analysis completed', {
        count: comparablePropertiesResult.properties.length,
        radiusUsed: comparablePropertiesResult.radiusUsed,
        monthsUsed: comparablePropertiesResult.monthsUsed
      });

      // console.log("Comp pros are..." + JSON.stringify(comparablePropertiesResult.properties));
      
      // Return target property and comparable properties
      return {
        targetProperty: propertyDetails,
        comparableProperties: comparablePropertiesResult.properties.map(comp => ({
          ...comp.property,
          eventDetails: comp.eventDetails,
          price: comp.eventDetails.price,
          distance: comp.distanceInMiles
        })),
        radiusUsed: comparablePropertiesResult.radiusUsed,
        monthsUsed: comparablePropertiesResult.monthsUsed
      };
      
    } catch (error: any) {
      if (error instanceof AppError) {
        throw error;
      }

      logger.log("Error in getPropertyAndMarketData...", error.message);
      
      logger.error('Error in getPropertyAndMarketData', { error: error.message });
      throw new AppError(`Error fetching property data: ${error.message}`, 500);
    }
  }
}

export default new PropertyService(); 