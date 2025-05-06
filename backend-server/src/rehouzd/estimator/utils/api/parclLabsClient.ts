import axios, { AxiosInstance, AxiosResponse } from 'axios';
import config from '../../config';
import logger from '../../utils/logger';
import { AppError } from '../../middleware/errorHandler';

export interface AddressSearchParams {
  address: string;
  city: string;
  state_abbreviation: string;
  zip_code: string;
}

export interface PropertyFilter {
  property_type: string;
  min_beds: number;
  max_beds: number;
  min_baths: number;
  max_baths: number;
  min_sqft: number;
  max_sqft: number;
  min_year_built: number;
  max_year_built: number;
  event_history_sale_flag: boolean;
}

class ParclLabsClient {
  private client: AxiosInstance;
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.PARCL_LABS_API_KEY || '';
    this.baseUrl = 'https://api.parcllabs.com';

    if (!this.apiKey) {
      logger.error('Parcl Labs API key is not set');
      throw new AppError('API configuration error', 500);
    }

    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Authorization': this.apiKey,
        'Content-Type': 'application/json',
      },
    });

    // Add response interceptor for logging
    this.client.interceptors.response.use(
      (response) => {
        logger.debug('API request successful', {
          url: response.config.url,
          method: response.config.method?.toUpperCase(),
          status: response.status,
        });
        return response;
      },
      (error) => {
        // If the error is a 404, return an empty response instead of rejecting
        if (error.response && error.response.status === 404) {
          logger.warn('API returned 404, treating as empty response', {
            url: error.config?.url,
            method: error.config?.method?.toUpperCase(),
          });
          
          // Create an empty response structure
          return {
            data: { items: [] },
            status: 200,
            statusText: 'OK',
            headers: error.response.headers,
            config: error.config,
          };
        }
        
        logger.error('API request failed', {
          url: error.config?.url,
          method: error.config?.method?.toUpperCase(),
          status: error.response?.status,
          message: error.message,
        });
        return Promise.reject(error);
      }
    );
  }

  async searchAddress(addresses: AddressSearchParams[]): Promise<AxiosResponse> {
    try {
      return await this.client.post('/v1/property/search_address', addresses);
    } catch (error: any) {
      // Handle 404 as empty result
      if (error.response && error.response.status === 404) {
        logger.warn('Address search returned 404, treating as empty data', { addresses });
        return {
          data: { items: [] },
          status: 200,
          statusText: 'OK',
          headers: error.response.headers,
          config: error.config,
        } as AxiosResponse;
      }
      
      logger.error('Error searching address', { 
        error: error.message, 
        addresses 
      });
      throw new AppError(`Failed to search address: ${error.message}`, 502);
    }
  }

  async searchMarkets(query: string, stateAbbreviation: string, locationType = 'ZIP5'): Promise<AxiosResponse> {
    try {
      return await this.client.get(`/v1/search/markets`, {
        params: {
          query,
          state_abbreviation: stateAbbreviation,
          location_type: locationType
        }
      });
    } catch (error: any) {
      // Handle 404 as empty result
      if (error.response && error.response.status === 404) {
        logger.warn('Market search returned 404, treating as empty data', { query, stateAbbreviation });
        return {
          data: { items: [] },
          status: 200,
          statusText: 'OK',
          headers: error.response.headers,
          config: error.config,
        } as AxiosResponse;
      }
      
      logger.error('Error searching markets', { 
        error: error.message, 
        query, 
        stateAbbreviation 
      });
      throw new AppError(`Failed to search markets: ${error.message}`, 502);
    }
  }

  async searchProperties(
    parclId: string,
    filters: PropertyFilter,
  ): Promise<AxiosResponse> {
    try {
      const params: any = {
        parcl_id: parclId,
        property_type: filters.property_type,
        square_footage_min: filters.min_sqft,
        square_footage_max: filters.max_sqft,
        bedrooms_min: filters.min_beds,
        bedrooms_max: filters.max_beds,
        bathrooms_min: filters.min_baths,
        bathrooms_max: filters.max_baths,
        year_built_min: filters.min_year_built,
        year_built_max: filters.max_year_built,
        event_history_sale_flag: filters.event_history_sale_flag,
      };

      console.log("Property filters: " + params.parcl_id);
      console.log("Property filters: " + params.property_type);
      console.log("Property filters: " + params.event_history_sale_flag);

      return await this.client.get('/v1/property/search', { params });
    } catch (error: any) {
      // Handle 404 as empty result
      if (error.response && error.response.status === 404) {
        logger.warn('Property search returned 404, treating as empty data', { parclId });
        return {
          data: { items: [] },
          status: 200,
          statusText: 'OK',
          headers: error.response.headers,
          config: error.config,
        } as AxiosResponse;
      }
      
      logger.error('Error searching properties', { 
        error: error.message, 
        parclId, 
        filters 
      });
      throw new AppError(`Failed to search properties: ${error.message}`, 502);
    }
  }

  /**
   * Get property event history for single or multiple properties
   * 
   * @param parclPropertyIds Array of property IDs to fetch event history for
   * @param startDate Optional start date for filtering events
   * @param endDate Optional end date for filtering events
   * @returns API response with event history
   */
  async getPropertyEventHistory(
    parclPropertyIds: string | string[], 
    startDate?: string,
    endDate?: string
  ): Promise<AxiosResponse> {
    try {
      // Convert single ID to array if needed
      const propertyIds = Array.isArray(parclPropertyIds) 
        ? parclPropertyIds 
        : [parclPropertyIds];
      
      logger.debug('Fetching property event history', { 
        propertyCount: propertyIds.length,
        startDate,
        endDate
      });

      const payload: any = {
        parcl_property_id: propertyIds
      };

      if (startDate) {
        payload.start_date = startDate;
      }

      if (endDate) {
        payload.end_date = endDate;
      }

      console.log('Payload:', payload);

      return await this.client.post('/v1/property/event_history', payload);
    } catch (error: any) {
      // Handle 404 as empty result
      if (error.response && error.response.status === 404) {
        // Convert single ID to array if needed
        const propertyIds = Array.isArray(parclPropertyIds) 
          ? parclPropertyIds 
          : [parclPropertyIds];
          
        logger.warn('Event history returned 404, treating as empty data', { propertyCount: propertyIds.length });
        return {
          data: { items: [] },
          status: 200,
          statusText: 'OK',
          headers: error.response.headers,
          config: error.config,
        } as AxiosResponse;
      }
      
      logger.error('Error fetching property event history', { 
        error: error.message, 
        propertyCount: Array.isArray(parclPropertyIds) ? parclPropertyIds.length : 1,
        startDate,
        endDate
      });
      throw new AppError(`Failed to fetch property event history: ${error.message}`, 502);
    }
  }
}

export default new ParclLabsClient(); 