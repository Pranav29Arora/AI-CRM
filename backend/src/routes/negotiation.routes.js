import { Router } from 'express';
import {
  evaluateOffer,
  getAllNegotiations,
  getNegotiationById,
  saveNegotiationRound,
  approveNegotiation
} from '../controllers/negotiation.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

router.use(requireAuth);

router.post('/evaluate', evaluateOffer);
router.get('/', getAllNegotiations);
router.get('/:id', getNegotiationById);
router.post('/', saveNegotiationRound);
router.put('/:id/approve', approveNegotiation);

export default router;
