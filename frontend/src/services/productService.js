import { apiRequest } from './api.js';

export const productService = {
  async getProducts(params = {}) {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.category && params.category !== 'All') query.append('category', params.category);

    const queryString = query.toString() ? `?${query.toString()}` : '';
    const res = await apiRequest(`/products${queryString}`, { method: 'GET' });
    return res.data || [];
  },

  async getProductById(id) {
    const res = await apiRequest(`/products/${id}`, { method: 'GET' });
    return res.data;
  },

  async createProduct(productData) {
    const res = await apiRequest('/products', {
      method: 'POST',
      body: JSON.stringify(productData),
    });
    return res.data;
  },

  async updateProduct(id, productData) {
    const res = await apiRequest(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(productData),
    });
    return res.data;
  },

  async deleteProduct(id) {
    const res = await apiRequest(`/products/${id}`, {
      method: 'DELETE',
    });
    return res.data;
  },

  async bulkImport(items) {
    const res = await apiRequest('/products/bulk', {
      method: 'POST',
      body: JSON.stringify({ items }),
    });
    return res;
  },
};

