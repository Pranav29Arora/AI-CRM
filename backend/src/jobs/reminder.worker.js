import { dataService } from '../services/data.service.js';

/**
 * Background Reminder Worker.
 * Periodically evaluates pending reminders against current timestamps.
 */
class ReminderWorker {
  constructor() {
    this.timer = null;
    this.intervalMs = 30000; // 30 seconds
  }

  start() {
    console.log('[Reminder Worker] Background follow-up scheduler started.');
    this.timer = setInterval(() => {
      this.checkDueReminders();
    }, this.intervalMs);
  }

  checkDueReminders() {
    const now = new Date();
    const reminders = dataService.getAllReminders();
    const dueReminders = reminders.filter(r => r.status === 'pending' && new Date(r.dueDate) <= now);

    if (dueReminders.length > 0) {
      console.log(`[Reminder Worker] ${dueReminders.length} follow-up reminders are now due.`);
      dueReminders.forEach(r => {
        // Tag or flag as due for user attention
        r.isDueNow = true;
      });
    }
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }
}

export const reminderWorker = new ReminderWorker();
