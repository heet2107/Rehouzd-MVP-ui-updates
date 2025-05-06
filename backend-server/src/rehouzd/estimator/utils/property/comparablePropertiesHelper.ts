import logger from '../logger';
import { GeoProperty, PropertyCollection } from '../geo/propertyDistanceCalculator';

export interface EventHistoryItem {
  parcl_property_id: string;
  event_type: string;
  event_name: string;
  event_date: string;
  price?: number;
  [key: string]: any;
}

export interface EventHistoryResponse {
  items: EventHistoryItem[];
}

export interface ComparableProperty {
  property: GeoProperty;
  eventDetails: EventHistoryItem;
  distanceInMiles: number;
}

export interface ComparablePropertiesResult {
  properties: ComparableProperty[];
  radiusUsed: number;
  monthsUsed: number;
}

/**
 * Helper class to find comparable properties based on event history
 * with adaptive radius and timeframe strategy
 */
class ComparablePropertiesHelper {
  private originProperty: GeoProperty;

  /**
   * Initialize with origin property
   */
  constructor(originProperty: GeoProperty) {
    this.originProperty = originProperty;
  }

  /**
   * Find comparable sold properties using adaptive radius and timeframe
   * 
   * @param properties All properties within max radius
   * @param eventHistory Event history for properties
   * @returns Comparable properties with the radius and timeframe used
   */
  findComparableProperties(
    properties: GeoProperty[],
    eventHistory: EventHistoryResponse
  ): ComparablePropertiesResult {
    // Define our adaptive radius and timeframe strategies
    const strategies = [
      { radius: 0.5, months: 3 },
      { radius: 0.75, months: 6 },
      { radius: 1.0, months: 6 },
      { radius: 1.5, months: 6 }
    ];
    
    logger.info('Finding comparable properties with adaptive strategy', {
      totalProperties: properties.length,
      totalEvents: eventHistory.items.length
    });
    
    // Try each strategy until we find enough properties
    for (const strategy of strategies) {
      const { radius, months } = strategy;
      const result = this.getPropertiesWithStrategy(properties, eventHistory, radius, months);
      
      if (result.properties.length >= 10) {
        logger.info('Found sufficient comparable properties', {
          count: result.properties.length,
          radius,
          months
        });
        return result;
      }
      
      logger.info('Insufficient comparable properties found, trying larger radius/timeframe', {
        count: result.properties.length,
        radius,
        months,
        nextStrategy: strategies[strategies.indexOf(strategy) + 1] || 'none'
      });
    }
    
    // If we've tried all strategies, return the results from the last strategy
    const lastStrategy = strategies[strategies.length - 1];
    return this.getPropertiesWithStrategy(
      properties, 
      eventHistory, 
      lastStrategy.radius, 
      lastStrategy.months
    );
  }
  
  /**
   * Get properties using specific radius and timeframe
   */
  private getPropertiesWithStrategy(
    properties: GeoProperty[],
    eventHistory: EventHistoryResponse,
    radiusMiles: number,
    months: number
  ): ComparablePropertiesResult {
    // Calculate cutoff date for the given months
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - months);
    
    // Filter properties by distance
    const propertiesWithinRadius = this.filterPropertiesByDistance(properties, radiusMiles);
    
    // Find property IDs within radius
    const propertyIds = new Set(
      propertiesWithinRadius.map(p => p.parcl_property_id ? String(p.parcl_property_id) : '')
    );
    
    // Group events by property ID and get the latest sale event for each property
    const latestSaleEvents = eventHistory.items
      .filter(event => 
        propertyIds.has(String(event.parcl_property_id)) &&
        event.event_type === 'SALE' &&
        event.event_name === 'SOLD' &&
        new Date(event.event_date) >= cutoffDate
      )
      .reduce((acc, event) => {
        const propertyId = String(event.parcl_property_id);
        const existingEvent = acc.get(propertyId);
        
        if (!existingEvent || new Date(event.event_date) > new Date(existingEvent.event_date)) {
          acc.set(propertyId, event);
        }
        
        return acc;
      }, new Map<string, EventHistoryItem>());

    logger.info('Found latest sale events for properties', {
      totalProperties: propertyIds.size,
      propertiesWithSales: latestSaleEvents.size
    });


    const latestRentalEvents = eventHistory.items
      .filter(event => 
        propertyIds.has(String(event.parcl_property_id)) &&
        event.event_type === 'RENTAL' &&
        // (event.event_name === 'LISTED_RENT' || event.event_name === 'LISTING_REMOVED') &&
        (event.event_name === 'LISTED_RENT') &&
        new Date(event.event_date) >= cutoffDate
      )
      .reduce((acc, event) => {
        const propertyId = String(event.parcl_property_id);
        const existingEvent = acc.get(propertyId);
        
        if (!existingEvent || new Date(event.event_date) > new Date(existingEvent.event_date)) {
          acc.set(propertyId, event);
        }
        
        return acc;
      }, new Map<string, EventHistoryItem>());

    logger.info('Found latest rental events for properties', {
      totalProperties: propertyIds.size,
      propertiesWithRentals: latestRentalEvents.size
    });
    
    // Map each latest event to its property with distance information
    const comparableProperties: ComparableProperty[] = Array.from(latestSaleEvents.values())
      .map(event => {
        const property = propertiesWithinRadius.find(
          p => String(p.parcl_property_id) === String(event.parcl_property_id)
        );
        
        if (!property) {
          logger.warn('Event property not found in properties list', { 
            propertyId: event.parcl_property_id 
          });
          return null;
        }
        
        const distance = this.calculateDistance(
          this.originProperty.latitude,
          this.originProperty.longitude,
          property.latitude,
          property.longitude
        );
        
        return {
          property,
          eventDetails: event,
          distanceInMiles: distance
        };
      }).filter(Boolean) as ComparableProperty[];
    
    // Add rental events to comparable properties
    const rentalComparableProperties: ComparableProperty[] = Array.from(latestRentalEvents.values())
      .map(event => {
        const property = propertiesWithinRadius.find(
          p => String(p.parcl_property_id) === String(event.parcl_property_id)
        );
        
        if (!property) {
          logger.warn('Event property not found in properties list', { 
            propertyId: event.parcl_property_id 
          });
          return null;
        }
        
        const distance = this.calculateDistance(
          this.originProperty.latitude,
          this.originProperty.longitude,
          property.latitude,
          property.longitude
        );
        
        return {
          property,
          eventDetails: event,
          distanceInMiles: distance
        };
      }).filter(Boolean) as ComparableProperty[];
    
    // Combine sale and rental properties, but ensure each property only appears once
    // with the most recent event taking precedence
    const allProperties = [...comparableProperties, ...rentalComparableProperties];
    
    // Create a map to deduplicate by property ID, keeping the most recent event
    const propertyMap = new Map<string, ComparableProperty>();
    
    for (const prop of allProperties) {
      const propertyId = String(prop.property.parcl_property_id);
      const existingProp = propertyMap.get(propertyId);
      
      // If we don't have this property yet, or this event is more recent, use this one
      if (!existingProp || 
          new Date(prop.eventDetails.event_date) > new Date(existingProp.eventDetails.event_date)) {
        propertyMap.set(propertyId, prop);
      }
    }
    
    // Convert back to array and sort by distance
    const dedupedProperties = Array.from(propertyMap.values());
    dedupedProperties.sort((a, b) => a.distanceInMiles - b.distanceInMiles);
    
    return {
      properties: dedupedProperties,
      radiusUsed: radiusMiles,
      monthsUsed: months
    };
  }
  
  /**
   * Filter properties by distance from origin
   */
  private filterPropertiesByDistance(properties: GeoProperty[], radiusMiles: number): GeoProperty[] {
    return properties.filter(property => {
      // Skip the origin property itself
      if (
        property.latitude === this.originProperty.latitude && 
        property.longitude === this.originProperty.longitude
      ) {
        return false;
      }
      
      const distance = this.calculateDistance(
        this.originProperty.latitude,
        this.originProperty.longitude,
        property.latitude,
        property.longitude
      );
      
      return distance <= radiusMiles;
    });
  }
  
  /**
   * Calculate distance between two points using haversine formula
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
}

export default ComparablePropertiesHelper; 