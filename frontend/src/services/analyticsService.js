import { apiRequest } from './api.js';

export const analyticsService = {
  async getDashboardAnalytics() {
    const res = await apiRequest('/analytics/dashboard', { method: 'GET' });
    return res.data;
  },
};
