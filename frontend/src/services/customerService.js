import { apiRequest } from './api.js';

export const customerService = {
  async getCustomers(params = {}) {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.status && params.status !== 'All') query.append('status', params.status);

    const queryString = query.toString() ? `?${query.toString()}` : '';
    const res = await apiRequest(`/customers${queryString}`, { method: 'GET' });
    return res.data || [];
  },

  async getCustomerById(id) {
    const res = await apiRequest(`/customers/${id}`, { method: 'GET' });
    return res.data;
  },

  async createCustomer(customerData) {
    const res = await apiRequest('/customers', {
      method: 'POST',
      body: JSON.stringify(customerData),
    });
    return res.data;
  },

  async updateCustomer(id, customerData) {
    const res = await apiRequest(`/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(customerData),
    });
    return res.data;
  },

  async deleteCustomer(id) {
    const res = await apiRequest(`/customers/${id}`, {
      method: 'DELETE',
    });
    return res.data;
  },
};
