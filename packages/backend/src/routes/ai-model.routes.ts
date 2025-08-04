import { Router } from 'express';
import { container } from 'tsyringe';
import { AIModelController } from '../controllers/ai-model.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();
const aiModelController = container.resolve(AIModelController);

// All AI model routes require authentication
router.use(authMiddleware);

// AI model routes
router.post('/connect', aiModelController.connectModel); // AI 모델 연결 (생성/업데이트)
router.get('/project/:projectId', aiModelController.getModelConfig); // 프로젝트 AI 모델 설정 가져오기
router.delete('/project/:projectId', aiModelController.disconnectModel); // AI 모델 연결 해제
router.post('/test', aiModelController.testModel); // AI 모델 테스트

export default router;
