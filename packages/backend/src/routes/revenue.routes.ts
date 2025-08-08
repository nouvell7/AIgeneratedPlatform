import { Router } from 'express';
import { container } from 'tsyringe';
import { RevenueController } from '../controllers/revenue.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();
const revenueController = container.resolve(RevenueController);

// Revenue analytics routes
router.get('/:projectId/dashboard', authMiddleware, revenueController.getRevenueDashboard.bind(revenueController));
router.get('/:projectId/export', authMiddleware, revenueController.exportRevenueData.bind(revenueController));

export default router;