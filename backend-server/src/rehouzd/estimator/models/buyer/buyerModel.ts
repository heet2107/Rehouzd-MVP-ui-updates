import pool from '../../config/db';

export interface Buyer {
  slvr_int_inv_dtl_sk: number;
  investor_company_nm_txt: string;
  investor_profile: any;
  num_prop_purchased_lst_12_mths_nr: number;
  active_flg: boolean;
}

/**
 * Buyer Model - Handles database operations for buyers
 */
export class BuyerModel {
  /**
   * Get all active buyers
   * @returns Promise<Buyer[]> Array of active buyers
   */
  public async getAllActiveBuyers(): Promise<Buyer[]> {
    const client = await pool.connect();
    
    try {
      const query = `
      SELECT DISTINCT ON (investor_company_nm_txt)
      slvr_int_inv_dtl_sk,
      investor_company_nm_txt,
      investor_profile,
      num_prop_purchased_lst_12_mths_nr,
      active_flg
      FROM slvr_int_invst
      WHERE active_flg = true
      ORDER BY 
      investor_company_nm_txt,                 
      num_prop_purchased_lst_12_mths_nr DESC; 
      `;

      const result = await client.query(query);
      return result.rows;
    } catch (error) {
      console.error('Model: Error fetching buyers:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get a buyer by ID
   * @param buyerId The ID of the buyer to retrieve
   * @returns Promise<Buyer | null> The buyer if found, null otherwise
   */
  public async getBuyerById(buyerId: number): Promise<Buyer | null> {
    const client = await pool.connect();
    
    try {
      const query = `
        SELECT 
          slvr_int_inv_dtl_sk,
          investor_company_nm_txt,
          investor_profile,
          num_prop_purchased_lst_12_mths_nr,
          active_flg
        FROM slvr_int_invst
        WHERE slvr_int_inv_dtl_sk = $1;
      `;

      const result = await client.query(query, [buyerId]);
      
      if (result.rows.length > 0) {
        return result.rows[0];
      } else {
        return null;
      }
    } catch (error) {
      console.error('Model: Error fetching buyer:', error);
      throw error;
    } finally {
      client.release();
    }
  }
}

// Export a singleton instance for use throughout the application
export const buyerModel = new BuyerModel();

// Also export the original functions for backward compatibility
export const getAllActiveBuyers = async (): Promise<Buyer[]> => {
  return buyerModel.getAllActiveBuyers();
};

export const getBuyerById = async (buyerId: number): Promise<Buyer | null> => {
  return buyerModel.getBuyerById(buyerId);
}; 