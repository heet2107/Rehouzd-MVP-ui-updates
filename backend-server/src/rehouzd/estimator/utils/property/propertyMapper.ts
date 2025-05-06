import { GeoProperty } from '../geo/propertyDistanceCalculator';
import { ComparableProperty, ComparablePropertiesResult, EventHistoryItem } from './comparablePropertiesHelper';
import { EnrichedPropertyModel, PropertyAnalysisResponse } from '../../interfaces/propertyModels';
import logger from '../logger';

/**
 * Utility class to map property data to enriched models
 */
class PropertyMapper {
  /**
   * Create an enriched property model from a geo property
   */
  createEnrichedProperty(
    property: GeoProperty,
    originProperty: GeoProperty,
    isComparable: boolean = false,
    saleEvent?: EventHistoryItem
  ): EnrichedPropertyModel {
    const distance = this.calculateDistance(
      originProperty.latitude, 
      originProperty.longitude,
      property.latitude, 
      property.longitude
    );

    return {
      parcl_property_id: String(property.parcl_property_id || ''),
      address: property.address || '',
      city: property.city || '',
      state: property.state_abbreviation || '',
      zip_code: property.zip_code || '',
      county: property.county || '',
      
      bedrooms: property.bedrooms || 0,
      bathrooms: property.bathrooms || 0,
      square_footage: property.square_footage || 0,
      year_built: property.year_built || 0,
      lot_size_sqft: property.lot_size_sqft,
      property_type: property.property_type || 'UNKNOWN',
      
      latitude: property.latitude,
      longitude: property.longitude,
      distanceFromTarget: distance,
      
      lastSalePrice: saleEvent?.price,
      lastSaleDate: saleEvent?.event_date,
      daysOnMarket: saleEvent?.days_on_market,
      
      isComparable,
      
      rawPropertyData: property,
      saleEvent
    };
  }
  
  /**
   * Create the full property analysis response
   */
  createPropertyAnalysisResponse(
    targetProperty: GeoProperty,
    neighborhoodProperties: GeoProperty[],
    comparablePropertiesResult: ComparablePropertiesResult,
    eventHistory: EventHistoryItem[]
  ): PropertyAnalysisResponse {
    logger.debug('Creating property analysis response', {
      neighborhoodCount: neighborhoodProperties.length,
      comparablesCount: comparablePropertiesResult.properties.length,
      eventsCount: eventHistory.length
    });
    
    // Create a map of property ID to event for quick lookups
    const propertyEventMap = new Map<string, EventHistoryItem>();
    eventHistory.forEach(event => {
      // Only store SOLD events in our map
      if (event.event_type === 'SALE' && event.event_name === 'SOLD') {
        propertyEventMap.set(String(event.parcl_property_id), event);
      }
    });
    
    // Create a set of comparable property IDs for quick lookups
    const comparablePropertyIds = new Set(
      comparablePropertiesResult.properties.map(comp => 
        String(comp.property.parcl_property_id)
      )
    );
    
    // Create enriched models for all neighborhood properties
    const enrichedNeighborhoodProperties = neighborhoodProperties.map(property => {
      const propertyId = String(property.parcl_property_id || '');
      const isComparable = comparablePropertyIds.has(propertyId);
      const saleEvent = propertyEventMap.get(propertyId);
      
      return this.createEnrichedProperty(
        property,
        targetProperty,
        isComparable,
        saleEvent
      );
    });
    
    // Create enriched models for comparable properties only
    const enrichedComparableProperties = enrichedNeighborhoodProperties
      .filter(property => property.isComparable)
      .sort((a, b) => a.distanceFromTarget - b.distanceFromTarget);
    
    // Create the target property model
    const enrichedTargetProperty = this.createEnrichedProperty(
      targetProperty, 
      targetProperty,
      false,
      propertyEventMap.get(String(targetProperty.parcl_property_id || ''))
    );
    
    // Calculate statistics
    const pricePerSqftValues = enrichedComparableProperties
      .filter(p => p.lastSalePrice && p.square_footage)
      .map(p => (p.lastSalePrice as number) / p.square_footage)
      .sort((a, b) => a - b);
    
    const averagePricePerSqft = pricePerSqftValues.length > 0
      ? pricePerSqftValues.reduce((sum, value) => sum + value, 0) / pricePerSqftValues.length
      : 0;
    
    const medianPricePerSqft = pricePerSqftValues.length > 0
      ? this.calculateMedian(pricePerSqftValues)
      : 0;
    
    return {
      targetProperty: enrichedTargetProperty,
      neighborhoodProperties: enrichedNeighborhoodProperties,
      comparableProperties: enrichedComparableProperties,
      analysisMetadata: {
        radiusUsed: comparablePropertiesResult.radiusUsed,
        monthsUsed: comparablePropertiesResult.monthsUsed,
        totalPropertiesFound: enrichedNeighborhoodProperties.length,
        comparablePropertiesFound: enrichedComparableProperties.length,
        medianPricePerSqft,
        averagePricePerSqft,
        timestamp: new Date().toISOString()
      }
    };
  }
  
  /**
   * Calculate the distance between two points using haversine formula
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const earthRadiusMiles = 3958.8;
    
    const dLat = this.degreesToRadians(lat2 - lat1);
    const dLon = this.degreesToRadians(lon2 - lon1);
    
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(this.degreesToRadians(lat1)) *
      Math.cos(this.degreesToRadians(lat2)) *
      Math.sin(dLon / 2) ** 2;
      
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return earthRadiusMiles * c;
  }
  
  /**
   * Convert degrees to radians
   */
  private degreesToRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
  
  /**
   * Calculate the median of an array of numbers
   */
  private calculateMedian(values: number[]): number {
    if (values.length === 0) return 0;
    
    const sortedValues = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sortedValues.length / 2);
    
    return sortedValues.length % 2 === 0
      ? (sortedValues[mid - 1] + sortedValues[mid]) / 2
      : sortedValues[mid];
  }
}

export default new PropertyMapper(); 