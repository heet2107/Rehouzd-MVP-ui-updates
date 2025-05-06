import express from 'express';
import buyerMatchingController from '../../controllers/buyerMatchingController';

const router = express.Router();

/**
 * Get all active buyers
 * This endpoint returns all active buyers from the database
 * Frontend can then perform matching calculations as needed
 */
router.get('/all-active', buyerMatchingController.getAllActiveBuyers);

export default router; 