import { Router } from 'express';
import { container } from 'tsyringe';
import { AuthController } from '../controllers/auth.controller';
import { OAuthController } from '../controllers/oauth.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();
const authController = container.resolve(AuthController);
const oauthController = container.resolve(OAuthController);

// Authentication routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authMiddleware, authController.logout);

// Profile routes
router.get('/profile', authMiddleware, authController.getProfile);
router.put('/profile', authMiddleware, authController.updateProfile);

// Account management
router.post('/change-password', authMiddleware, authController.changePassword);
router.delete('/account', authMiddleware, authController.deleteAccount);


// OAuth routes
router.post('/oauth/google', oauthController.googleLogin);
router.post('/oauth/github', oauthController.githubLogin);
router.delete('/oauth/unlink', authMiddleware, oauthController.unlinkAccount);
router.get('/oauth/status', authMiddleware, oauthController.getConnectionStatus);


export default router;
