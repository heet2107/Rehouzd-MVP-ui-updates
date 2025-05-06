import { Pool } from 'pg';
import config from './index';
import logger from '../utils/logger';

// Create a pool instance with our configuration
const pool = new Pool({
  host: process.env.DB_HOST || 'postgres',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'rehouzd',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // How long a client is allowed to remain idle before being closed
  connectionTimeoutMillis: 2000, // How long to wait before timing out when connecting a new client
});

// Log pool errors
pool.on('error', (err) => {
  logger.error('Unexpected error on idle client', { error: err });
  process.exit(-1);
});

// Simple query method
export const query = async (text: string, params?: any[]) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    
    logger.debug('Executed query', { 
      query: text, 
      duration, 
      rows: res.rowCount 
    });
    
    return res;
  } catch (error) {
    logger.error('Error executing query', { 
      query: text, 
      error, 
      params 
    });
    throw error;
  }
};

export default pool;
