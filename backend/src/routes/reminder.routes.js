import { Router } from 'express';
import {
  getAllReminders,
  createReminder,
  updateReminder,
  deleteReminder
} from '../controllers/reminder.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

router.use(requireAuth);

router.get('/', getAllReminders);
router.post('/', createReminder);
router.put('/:id', updateReminder);
router.delete('/:id', deleteReminder);

export default router;
