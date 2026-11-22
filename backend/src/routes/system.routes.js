import express from 'express';
import { getSystemStatus, retrySync } from '../controllers/system.controller.js';

const router = express.Router();

router.get('/status', getSystemStatus);
router.post('/sync', retrySync);

export default router;
