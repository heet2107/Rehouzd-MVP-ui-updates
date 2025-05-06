import pool from '../../config/db';

export interface SpecialistCall {
  user_id: number;
  mobile_number: number | string;
  requested_at?: string;
}

/**
 * Insert a Specialist Call
 */
export const saveSpecialistCall = async (call: SpecialistCall): Promise<number | undefined> => {
  const client = await pool.connect();
  try {
    let query: string;
    let values: any[];
    
    if (call.requested_at) {
      // If a specific timestamp is provided, use it
      query = `
        INSERT INTO specialist_calls (user_id, requested_at)
        VALUES ($1, $2)
        RETURNING id;
      `;
      values = [
        call.user_id, 
        call.requested_at
      ];
    } else {
      // Otherwise use NOW() for current timestamp
      query = `
        INSERT INTO specialist_calls (user_id, requested_at)
        VALUES ($1, NOW())
        RETURNING id;
      `;
      values = [
        call.user_id,
      ];
    }
    
    const result = await client.query(query, values);
    
    console.log('Specialist call saved successfully');
    return result.rows[0]?.id;
  } catch (error : any) {
    console.error('Error saving specialist call:', error.message);
    throw new Error(`Failed to save specialist call: ${error.message}`);
  } finally {
    client.release();
  }
};

/**
 * Get all specialist calls with user details
 */
export const getAllSpecialistCallsWithUser = async (): Promise<any[]> => {
  const client = await pool.connect();

  const query = `
    SELECT 
      sc.id AS call_id, 
      sc.user_id,  
      sc.requested_at,
      u.username, 
      u.email, 
      u.mobile_number AS user_mobile, 
      u.first_name, 
      u.last_name
    FROM specialist_calls sc
    JOIN users u ON sc.user_id = u.user_id
    ORDER BY sc.requested_at DESC;
  `;

  try {
    const result = await client.query(query);
    return result.rows;
  } catch (error) {
    console.error('Error fetching specialist calls with user info:', error);
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Get distinct specialist callback requests with user details (latest request)
 */
export const getDistinctSpecialistCalls = async (): Promise<any[]> => {
  const client = await pool.connect();
  try {
    const query = `
      SELECT DISTINCT ON (sc.user_id) 
          sc.id AS call_id,
          sc.user_id,
          u.first_name,
          u.last_name,
          u.email,
          u.mobile_number,
          sc.requested_at
      FROM specialist_calls sc
      JOIN users u ON sc.user_id = u.user_id
      ORDER BY sc.user_id, sc.requested_at DESC;
    `;

    const result = await client.query(query);
    return result.rows;

  } catch (error) {
    console.error('Error fetching specialist calls:', error);
    throw error;
  } finally {
    client.release();
  }
};