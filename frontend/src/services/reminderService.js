import { apiRequest } from './api.js';

export const reminderService = {
  async getReminders() {
    const res = await apiRequest('/reminders', { method: 'GET' });
    return res.data || [];
  },

  async createReminder(reminderData) {
    const res = await apiRequest('/reminders', {
      method: 'POST',
      body: JSON.stringify(reminderData),
    });
    return res.data;
  },

  async updateReminder(id, updateData) {
    const res = await apiRequest(`/reminders/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
    return res.data;
  },

  async deleteReminder(id) {
    const res = await apiRequest(`/reminders/${id}`, {
      method: 'DELETE',
    });
    return res.data;
  },
};
