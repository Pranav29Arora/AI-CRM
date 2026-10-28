import { Router } from 'express';
import { login, signup, getMe, getDemoCredentials, resetData } from '../controllers/auth.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

router.post('/login', login);
router.post('/signup', signup);
router.get('/me', requireAuth, getMe);
router.get('/demo-credentials', getDemoCredentials);
router.post('/reset-data', resetData);

export default router;
