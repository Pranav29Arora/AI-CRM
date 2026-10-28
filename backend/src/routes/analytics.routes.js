import { Router } from 'express';
import { getDashboardAnalytics } from '../controllers/analytics.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

router.use(requireAuth);

router.get('/dashboard', getDashboardAnalytics);

export default router;
