import { apiRequest } from './api';

export const aiService = {
  async getStatus() {
    const res = await apiRequest('/ai/status', { method: 'GET' });
    return res.data;
  },

  async updateConfig(apiKey) {
    const res = await apiRequest('/ai/config', {
      method: 'POST',
      body: JSON.stringify({ apiKey })
    });
    return res;
  },

  async testConnection(apiKey) {
    const res = await apiRequest('/ai/test', {
      method: 'POST',
      body: JSON.stringify({ apiKey })
    });
    return res;
  },

  async generateReplies({ customerId, productId, offerPrice, quantity, tone = 'relationship' }) {
    const res = await apiRequest('/ai/generate-replies', {
      method: 'POST',
      body: JSON.stringify({ customerId, productId, offerPrice, quantity, tone })
    });
    return res.data;
  },

  async summarizeThread({ conversationId, customerId }) {
    const res = await apiRequest('/ai/summarize', {
      method: 'POST',
      body: JSON.stringify({ conversationId, customerId })
    });
    return res.data;
  },

  async getBuyerProfile(customerId) {
    const res = await apiRequest(`/ai/buyer-profile/${customerId}`, { method: 'GET' });
    return res.data;
  }
};
