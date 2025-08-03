import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { OAuthController } from '../controllers/oauth.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();
const authController = new AuthController();
const oauthController = new OAuthController();

// Authentication routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/refresh', authController.refreshToken);
router.post('/logout', authMiddleware, authController.logout);
router.get('/me', authMiddleware, authController.getProfile);

// OAuth routes
router.get('/google', oauthController.googleAuth);
router.get('/google/callback', oauthController.googleCallback);
router.get('/github', oauthController.githubAuth);
router.get('/github/callback', oauthController.githubCallback);

export default router;