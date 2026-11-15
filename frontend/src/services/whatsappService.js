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

  async getConversationContext(id) {
    const res = await apiRequest(`/whatsapp/conversations/${id}/context`, { method: 'GET' });
    return res.data;
  },

  async getOpeningOutreach(id, tone = 'formal') {
    const res = await apiRequest(`/whatsapp/conversations/${id}/opener?tone=${encodeURIComponent(tone)}`, {
      method: 'GET'
    });
    return res.data;
  },

  async sendOpeningOutreach(id, { tone = 'formal', text = null } = {}) {
    const res = await apiRequest(`/whatsapp/conversations/${id}/opener`, {
      method: 'POST',
      body: JSON.stringify({ tone, text })
    });
    return res.data;
  },

  async sendBuyerRoleplayMessage(id, { text, tone = 'relationship', autoReply = true }) {
    const res = await apiRequest(`/whatsapp/conversations/${id}/buyer-message`, {
      method: 'POST',
      body: JSON.stringify({ text, tone, autoReply })
    });
    return res.data;
  },

  async initiateConversation({ customerId, productId = null }) {
    const res = await apiRequest('/whatsapp/conversations/initiate', {
      method: 'POST',
      body: JSON.stringify({ customerId, productId })
    });
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
