import { Router } from 'express';
import {
  getConnectionStatus,
  getAllConversations,
  getConversationById,
  sendMessage,
  simulateIncoming,
  generateAIReply
} from '../controllers/whatsapp.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

router.use(requireAuth);

router.get('/status', getConnectionStatus);
router.get('/conversations', getAllConversations);
router.get('/conversations/:id', getConversationById);
router.post('/conversations/:id/messages', sendMessage);
router.post('/conversations/:id/generate-reply', generateAIReply);
router.post('/simulate-incoming', simulateIncoming);

export default router;
