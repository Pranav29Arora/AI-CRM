import { Router } from 'express';
import {
  getAIStatus,
  updateAIConfig,
  testAIConnection,
  generateReplies,
  summarizeThread,
  getBuyerProfile
} from '../controllers/ai.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

// AI endpoints require authentication
router.use(requireAuth);

router.get('/status', getAIStatus);
router.post('/config', updateAIConfig);
router.post('/test', testAIConnection);
router.post('/generate-replies', generateReplies);
router.post('/summarize', summarizeThread);
router.get('/buyer-profile/:id', getBuyerProfile);

export default router;
