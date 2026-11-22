import { Router } from 'express';
import {
  getConnectionStatus,
  getAllConversations,
  getConversationById,
  getConversationContext,
  getOpeningOutreach,
  sendOpeningOutreach,
  processBuyerMessage,
  initiateConversation,
  sendMessage,
  simulateIncoming,
  generateAIReply,
  closeDeal
} from '../controllers/whatsapp.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

router.use(requireAuth);

router.get('/status', getConnectionStatus);
router.get('/conversations', getAllConversations);
router.post('/conversations/initiate', initiateConversation);
router.get('/conversations/:id', getConversationById);
router.get('/conversations/:id/context', getConversationContext);
router.get('/conversations/:id/opener', getOpeningOutreach);
router.post('/conversations/:id/opener', sendOpeningOutreach);
router.post('/conversations/:id/buyer-message', processBuyerMessage);
router.post('/conversations/:id/messages', sendMessage);
router.post('/conversations/:id/generate-reply', generateAIReply);
router.post('/conversations/:id/close-deal', closeDeal);
router.post('/simulate-incoming', simulateIncoming);

export default router;
