import app from './app.js';
import dotenv from 'dotenv';
import { reminderWorker } from './jobs/reminder.worker.js';

dotenv.config();

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`[AI-CRM Backend] Server running on http://localhost:${PORT}`);
  console.log(`[AI-CRM Backend] Health Check: http://localhost:${PORT}/api/health`);
  console.log(`[AI-CRM Backend] Storage: In-memory Mock Database with Seed Data`);

  // Start background reminder scheduler worker
  reminderWorker.start();
});
