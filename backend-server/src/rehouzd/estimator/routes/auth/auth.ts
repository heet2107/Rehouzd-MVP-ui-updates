import { Router } from 'express';
import * as authController from '../../controllers/authController';

const router = Router();

// Auth
router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.post('/request-password-reset', authController.requestPasswordReset);
router.post('/reset-password', authController.resetPassword);
router.post('/profile-update', authController.updateProfile);

// Google OAuth endpoints
router.get('/google', authController.googleAuthInitiate);
router.get('/google/callback', authController.googleAuthCallback);

export default router;
