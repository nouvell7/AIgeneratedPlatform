import { Router } from 'express';
import { container } from 'tsyringe';
import { UserController } from '../controllers/user.controller';
import { UserSettingsController } from '../controllers/user-settings.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();
const userController = container.resolve(UserController);
const userSettingsController = container.resolve(UserSettingsController);

// All user routes require authentication
router.use(authMiddleware);

// User profile routes
router.get('/profile', userController.getProfile);
router.put('/profile', userController.updateProfile);
router.delete('/account', userController.deleteAccount);

// User settings routes
router.get('/settings', userSettingsController.getSettings);
router.put('/settings', userSettingsController.updateSettings);

export default router;
