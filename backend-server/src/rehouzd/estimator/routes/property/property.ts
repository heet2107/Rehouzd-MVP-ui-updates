import { Router } from 'express';
import propertyController from '../../controllers/propertyController';
import * as specialistController from '../../controllers/specialistController';

const router = Router();

// Property data route
router.post('/property-data', propertyController.getPropertyAndMarketData);

// Property image routes
router.post('/images/upload', propertyController.upload.array('images', 5), propertyController.uploadPropertyImages);
router.get('/images/:userId/:propertyAddress', propertyController.getPropertyImageInfo);

export default router;
