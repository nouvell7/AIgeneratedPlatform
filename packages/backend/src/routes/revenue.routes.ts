import { Router } from 'express';
import { container } from 'tsyringe';
import { RevenueController } from '../controllers/revenue.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();
const revenueController = container.resolve(RevenueController);

// Revenue analytics routes
router.get('/:projectId/analytics', authMiddleware, revenueController.getRevenueData.bind(revenueController));
router.get('/:projectId/history', authMiddleware, revenueController.getRevenueHistory.bind(revenueController));

// AdSense configuration routes
router.get('/:projectId/adsense', authMiddleware, revenueController.getAdSenseConfig.bind(revenueController));
router.put('/:projectId/adsense', authMiddleware, revenueController.updateAdSenseConfig.bind(revenueController));

// Revenue optimization routes
router.get('/:projectId/optimization', authMiddleware, revenueController.getOptimizationRecommendations.bind(revenueController));
router.post('/:projectId/optimization/apply', authMiddleware, revenueController.applyOptimization.bind(revenueController));

// A/B Testing routes
router.post('/:projectId/ab-test', authMiddleware, revenueController.createABTest.bind(revenueController));
router.get('/:projectId/ab-test/:testId', authMiddleware, revenueController.getABTestResults.bind(revenueController));

export default router;