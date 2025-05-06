import pool from '../../config/db';
import logger from '../../utils/logger';

export interface PropertyImage {
  id?: number;
  user_id: number;
  property_address: string;
  container_name: string;
  image_count: number;
  created_at?: Date;
  updated_at?: Date;
}

/**
 * Create a new property image entry or update if it exists
 */
export const createOrUpdatePropertyImage = async (imageData: PropertyImage): Promise<PropertyImage> => {
  const client = await pool.connect();
  try {
    // Check if entry already exists for this user and property address
    const checkQuery = `
      SELECT id, image_count FROM property_images 
      WHERE user_id = $1 AND property_address = $2
    `;
    const checkResult = await client.query(checkQuery, [imageData.user_id, imageData.property_address]);
    
    if (checkResult.rows.length > 0) {
      // Update existing entry
      const updateQuery = `
        UPDATE property_images 
        SET 
          container_name = $1, 
          image_count = $2, 
          updated_at = NOW() 
        WHERE id = $3
        RETURNING *
      `;
      const updateParams = [
        imageData.container_name,
        imageData.image_count,
        checkResult.rows[0].id
      ];
      
      const result = await client.query(updateQuery, updateParams);
      logger.info(`Updated property images for address: ${imageData.property_address}`);
      return result.rows[0];
    } else {
      // Create new entry
      const insertQuery = `
        INSERT INTO property_images (
          user_id, 
          property_address, 
          container_name, 
          image_count
        ) 
        VALUES ($1, $2, $3, $4) 
        RETURNING *
      `;
      const insertParams = [
        imageData.user_id, 
        imageData.property_address, 
        imageData.container_name, 
        imageData.image_count
      ];
      
      const result = await client.query(insertQuery, insertParams);
      logger.info(`Created property images entry for address: ${imageData.property_address}`);
      return result.rows[0];
    }
  } catch (error) {
    logger.error('Error in createOrUpdatePropertyImage', { error });
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Get property images for a specific user and address
 */
export const getPropertyImages = async (userId: number, propertyAddress: string): Promise<PropertyImage | null> => {
  const client = await pool.connect();
  try {
    const query = `
      SELECT * FROM property_images 
      WHERE user_id = $1 AND property_address = $2
    `;
    const result = await client.query(query, [userId, propertyAddress]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return result.rows[0];
  } catch (error) {
    logger.error('Error in getPropertyImages', { error });
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Get all property images for a specific user
 */
export const getAllPropertyImagesForUser = async (userId: number): Promise<PropertyImage[]> => {
  const client = await pool.connect();
  try {
    const query = `
      SELECT * FROM property_images 
      WHERE user_id = $1
      ORDER BY updated_at DESC
    `;
    const result = await client.query(query, [userId]);
    return result.rows;
  } catch (error) {
    logger.error('Error in getAllPropertyImagesForUser', { error });
    throw error;
  } finally {
    client.release();
  }
}; 