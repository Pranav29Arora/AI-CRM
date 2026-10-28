import { apiRequest } from './api.js';

export const whatsappService = {
  async getStatus() {
    const res = await apiRequest('/whatsapp/status', { method: 'GET' });
    return res.data;
  },

  async getConversations() {
    const res = await apiRequest('/whatsapp/conversations', { method: 'GET' });
    return res.data || [];
  },

  async getConversation(id) {
    const res = await apiRequest(`/whatsapp/conversations/${id}`, { method: 'GET' });
    return res.data;
  },

  async sendMessage(id, text) {
    const res = await apiRequest(`/whatsapp/conversations/${id}/messages`, {
      method: 'POST',
      body: JSON.stringify({ text }),
    });
    return res.data;
  },

  async generateAIReply(id, tone = 'relationship') {
    const res = await apiRequest(`/whatsapp/conversations/${id}/generate-reply`, {
      method: 'POST',
      body: JSON.stringify({ tone })
    });
    return res.data;
  },

  async simulateIncoming(data) {
    const res = await apiRequest('/whatsapp/simulate-incoming', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.data;
  },
};
