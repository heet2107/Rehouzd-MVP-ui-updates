import dotenv from 'dotenv';
import path from 'path';
import development from './environments/development';
import production from './environments/production';

// Load environment variables from .env file if not in production
if (process.env.NODE_ENV !== 'production') {
  dotenv.config({ path: path.resolve(process.cwd(), '.env') });
} else {
  // In production, Azure App Service will inject environment variables
  // including secrets from Key Vault
  console.log('Running in production mode. Using environment variables.');
}

// Determine which environment to use
const env = process.env.NODE_ENV || 'development';

// Select the appropriate config
const configs: { [key: string]: any } = {
  development,
  production
};

// Default to development if environment not found
const config = configs[env] || development;

export default {
  ...config,
  // Add common config properties here
  server: {
    port: process.env.PORT || 5004,
    host: process.env.HOST || '0.0.0.0'
  },
  email: {
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT ? parseInt(process.env.EMAIL_PORT) : 587,
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
    from: process.env.EMAIL_FROM || 'noreply@rehouzd.com'
  },
  keyVault: {
    name: process.env.KEYVAULT_NAME,
    enabled: process.env.NODE_ENV === 'production' && !!process.env.KEYVAULT_NAME
  }
}; 