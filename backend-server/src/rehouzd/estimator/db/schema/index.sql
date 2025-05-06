-- Main schema index file that includes all table definitions
-- This file should be executed to create the complete database schema

-- Users and authentication tables
\i users.sql
\i specialist_calls.sql

-- Property and estimates tables
\i estimate.sql
\i saved_estimates.sql
\i property_images.sql

-- Bronze tables (raw data)
\i brnz_goog_prop_add_dtl.sql
\i brnz_prcl_prop_sales_dtl.sql

-- Silver tables (processed data)
\i slvr_int_prop_sales_dlt.sql
\i slvr_int_prop.sql
\i slvr_int_prop_comps.sql
\i slvr_int_prop_offer_dtl.sql
\i slvr_int_invst.sql

-- Admin and reference tables
\i adm_ref_prop_condition.sql
\i adm_ctl_rules.sql
\i market_reference.sql
\i market_reference_counties.sql
\i market_underwrite_inputs.sql
\i market_calculation_reference.sql
\i property_condition_cost.sql

-- User profile tables
\i usr_prls_dtl.sql
\i usr_invst_conatact_dtl.sql
\i usr_prop_offer_asm.sql
\i usr_prop_dtl.sql 