import { apiRequest } from './api.js';

export const negotiationService = {
  async evaluateOffer(data) {
    const res = await apiRequest('/negotiations/evaluate', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.data;
  },

  async getNegotiations() {
    const res = await apiRequest('/negotiations', { method: 'GET' });
    return res.data || [];
  },

  async getNegotiationById(id) {
    const res = await apiRequest(`/negotiations/${id}`, { method: 'GET' });
    return res.data;
  },

  async saveRound(negotiationData) {
    const res = await apiRequest('/negotiations', {
      method: 'POST',
      body: JSON.stringify(negotiationData),
    });
    return res.data;
  },

  async approveNegotiation(id, finalPrice) {
    const res = await apiRequest(`/negotiations/${id}/approve`, {
      method: 'PUT',
      body: JSON.stringify({ finalPrice }),
    });
    return res.data;
  },
};
