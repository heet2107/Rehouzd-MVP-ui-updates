/**
 * Application configuration
 * Gets values from environment variables or window.env
 */

// Get API URL from environment variables or window.env with fallback
const getApiUrl = (): string => {
  // First check window.env (from env-config.js for runtime configuration)
  if (window.env?.REACT_APP_API_URL) {
    return window.env.REACT_APP_API_URL;
  }
  
  // Then check process.env for build-time configuration
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  
  // Local development fallback
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:5004';
  }
  
  // Production default (would be updated for Azure)
  return '/api';
};

const config = {
  apiUrl: getApiUrl(),
  mapsApiKey: window.env?.REACT_APP_Maps_API_KEY || process.env.REACT_APP_Maps_API_KEY || '',
  googleMapId: window.env?.REACT_APP_GOOGLE_MAP_ID || process.env.REACT_APP_GOOGLE_MAP_ID || '',
};

export default config; 