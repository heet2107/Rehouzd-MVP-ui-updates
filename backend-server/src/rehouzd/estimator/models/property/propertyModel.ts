import pool from '../../config/db';
import logger from '../../utils/logger';

export class Property {
    etlNr: number;
    parclPropertyId: number;
    investorCompany?: string | null;
    address: string;
    city: string;
    stateAbbreviation: string;
    county: string;
    zipCode: string;
    bathrooms: number;
    bedrooms: number;
    squareFootage: number;
    yearBuilt: number;
    latitude: number;
    longitude: number;

    constructor(
        etlNr: number,
        parclPropertyId: number,
        address: string,
        city: string,
        stateAbbreviation: string,
        county: string,
        zipCode: string,
        bathrooms: number,
        bedrooms: number,
        squareFootage: number,
        yearBuilt: number,
        latitude: number,
        longitude: number,
        investorCompany?: string
    ) {
        this.etlNr = etlNr;
        this.parclPropertyId = parclPropertyId;
        this.address = address;
        this.city = city;
        this.stateAbbreviation = stateAbbreviation;
        this.county = county;
        this.zipCode = zipCode;
        this.bathrooms = bathrooms;
        this.bedrooms = bedrooms;
        this.squareFootage = squareFootage;
        this.yearBuilt = yearBuilt;
        this.latitude = latitude;
        this.longitude = longitude;
        this.investorCompany = investorCompany || null;
    }
}

/**
 * Save property address details to the database
 */
export const savePropertyAddress = async (
  property: Property
): Promise<{ addressId: number }> => {
  const client = await pool.connect();
  try {
    const insertAddressQuery = `
      INSERT INTO brnz_goog_prop_add_dtl (
        load_date_dt,
        record_inserted_ts,
        prop_address_line_txt,
        prop_city_nm,
        prop_state_nm,
        prop_cnty_nm,
        prop_zip_cd
      )
      VALUES (
        CURRENT_DATE,
        $1,
        $2,
        $3,
        $4,
        $5,
        $6
      )
      RETURNING brnz_goog_prop_add_dtl_sk
    `;

    const insertAddressValues = [
      new Date(),
      property.address,
      property.city,
      property.stateAbbreviation,
      property.county,
      property.zipCode,
    ];

    logger.debug('Saving property address', { address: property.address });
    const result = await client.query(insertAddressQuery, insertAddressValues);
    
    return { addressId: result.rows[0].brnz_goog_prop_add_dtl_sk };
  } catch (error: any) {
    logger.error('Failed to save property address', { 
      error: error.message,
      property: property.address
    });
    
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Save property sales details to the database
 */
export const savePropertySales = async (
  addressId: number,
  property: Property,
  salePrice: number | null
): Promise<{ salesId: number }> => {
  const client = await pool.connect();
  try {
    const insertSalesQuery = `
      INSERT INTO brnz_prcl_prop_sales_dtl (
        load_date_dt,
        brnz_goog_prop_add_dtl_fk,
        record_inserted_ts,
        investor_company_nm_txt,
        prop_attr_bth_cnt,
        prop_attr_br_cnt,
        prop_attr_sqft_nr,
        prop_yr_blt_nr,
        prop_address_line_txt,
        prop_city_nm,
        prop_state_nm,
        prop_cnty_nm,
        prop_zip_cd,
        prop_list_price_amt,
        prop_status_cd,
        prop_acty_sub_status_cd,
        prop_acty_status_cd,
        prop_latitude_val,
        prop_longitude_val
      )
      VALUES (
        CURRENT_DATE,
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        $7,
        $8,
        $9,
        $10,
        $11,
        $12,
        $13,
        $14,
        $15,
        $16,
        $17,
        $18
      )
      RETURNING brnz_prcl_prop_sales_dtl_sk
    `;

    const salesValues = [
      addressId,
      new Date(),
      property.investorCompany || null,
      property.bathrooms,
      property.bedrooms,
      property.squareFootage,
      property.yearBuilt,
      property.address,
      property.city,
      property.stateAbbreviation,
      property.county,
      property.zipCode,
      salePrice,
      '',
      '',
      '',
      property.latitude,
      property.longitude,
    ];

    logger.debug('Saving property sales', { address: property.address });
    const result = await client.query(insertSalesQuery, salesValues);
    
    return { salesId: result.rows[0].brnz_prcl_prop_sales_dtl_sk };
  } catch (error: any) {
    logger.error('Failed to save property sales', { 
      error: error.message,
      property: property.address,
      addressId
    });
    logger.error('Failed to save property address', +
      error.message +
      property.address);
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Save complete property data in a transaction
 */
export const savePropertyData = async (
  property: Property,
  salePrice: number | null = null
): Promise<{ addressId: number; salesId: number }> => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Save address using the address function but with the transaction client
    const insertAddressQuery = `
      INSERT INTO brnz_goog_prop_add_dtl (
        load_date_dt,
        record_inserted_ts,
        prop_address_line_txt,
        prop_city_nm,
        prop_state_nm,
        prop_cnty_nm,
        prop_zip_cd
      )
      VALUES (
        CURRENT_DATE,
        $1,
        $2,
        $3,
        $4,
        $5,
        $6
      )
      RETURNING brnz_goog_prop_add_dtl_sk
    `;

    const insertAddressValues = [
      new Date(),
      property.address,
      property.city,
      property.stateAbbreviation,
      property.county,
      property.zipCode,
    ];

    logger.debug('Saving property data - address', { address: property.address });
    const addressResult = await client.query(insertAddressQuery, insertAddressValues);
    const addressId = addressResult.rows[0].brnz_goog_prop_add_dtl_sk;

    // Save sales using the sales function but with the transaction client
    const insertSalesQuery = `
      INSERT INTO brnz_prcl_prop_sales_dtl (
        load_date_dt,
        brnz_goog_prop_add_dtl_fk,
        record_inserted_ts,
        investor_company_nm_txt,
        prop_attr_bth_cnt,
        prop_attr_br_cnt,
        prop_attr_sqft_nr,
        prop_yr_blt_nr,
        prop_address_line_txt,
        prop_city_nm,
        prop_state_nm,
        prop_cnty_nm,
        prop_zip_cd,
        prop_list_price_amt,
        prop_status_cd,
        prop_acty_sub_status_cd,
        prop_acty_status_cd,
        prop_latitude_val,
        prop_longitude_val
      )
      VALUES (
        CURRENT_DATE,
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        $7,
        $8,
        $9,
        $10,
        $11,
        $12,
        $13,
        $14,
        $15,
        $16,
        $17,
        $18
      )
      RETURNING brnz_prcl_prop_sales_dtl_sk
    `;

    const salesValues = [
      addressId,
      new Date(),
      property.investorCompany || null,
      property.bathrooms,
      property.bedrooms,
      property.squareFootage,
      property.yearBuilt,
      property.address,
      property.city,
      property.stateAbbreviation,
      property.county,
      property.zipCode,
      salePrice,
      '',
      '',
      '',
      property.latitude,
      property.longitude,
    ];

    logger.debug('Saving property data - sales', { address: property.address });
    const salesResult = await client.query(insertSalesQuery, salesValues);
    const salesId = salesResult.rows[0].brnz_prcl_prop_sales_dtl_sk;

    // Insert the parcl property ID record
    const insertParclQuery = `
      INSERT INTO property_parcl_mapping (
        brnz_prcl_prop_sales_dtl_fk,
        parcl_property_id,
        created_at
      )
      VALUES ($1, $2, NOW())
    `;

    const parclValues = [
      salesId,
      property.parclPropertyId
    ];

    await client.query(insertParclQuery, parclValues);

    await client.query('COMMIT');
    
    logger.info('Property data saved successfully', { 
      address: property.address,
      addressId,
      salesId
    });
    
    return { addressId, salesId };
  } catch (error: any) {
    await client.query('ROLLBACK');
    logger.error('Failed to save property data', { 
      error: error.message,
      property: property.address
    });
    logger.error('Failed to save property data', +
      error.message +
      property.address);
    throw error;
  } finally {
    client.release();
  }
}; 