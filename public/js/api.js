/**
 * TurbineTek Client API Service
 * Handles all REST API communications with the Node.js Express Backend
 */

const API = {
  baseUrl: '/api',

  // 1. Products
  async getProducts(params = {}) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        query.append(key, value);
      }
    });

    const res = await fetch(`${this.baseUrl}/products?${query.toString()}`);
    return await res.json();
  },

  async getProduct(id) {
    const res = await fetch(`${this.baseUrl}/products/${id}`);
    return await res.json();
  },

  async createProduct(productData) {
    const res = await fetch(`${this.baseUrl}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(productData)
    });
    return await res.json();
  },

  async updateProduct(id, productData) {
    const res = await fetch(`${this.baseUrl}/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(productData)
    });
    return await res.json();
  },

  async deleteProduct(id) {
    const res = await fetch(`${this.baseUrl}/products/${id}`, {
      method: 'DELETE'
    });
    return await res.json();
  },

  // 2. Categories & Manufacturers & Turbines
  async getCategories() {
    const res = await fetch(`${this.baseUrl}/categories`);
    return await res.json();
  },

  async getManufacturers() {
    const res = await fetch(`${this.baseUrl}/manufacturers`);
    return await res.json();
  },

  async getTurbines() {
    const res = await fetch(`${this.baseUrl}/turbines`);
    return await res.json();
  },

  // 3. RFQs
  async submitRfq(rfqData) {
    const res = await fetch(`${this.baseUrl}/rfq`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(rfqData)
    });
    return await res.json();
  },

  async getRfqs() {
    const res = await fetch(`${this.baseUrl}/rfqs`);
    return await res.json();
  },

  async updateRfqStatus(id, status) {
    const res = await fetch(`${this.baseUrl}/rfqs/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    return await res.json();
  },

  // 4. Orders
  async submitOrder(orderData) {
    const res = await fetch(`${this.baseUrl}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData)
    });
    return await res.json();
  },

  async getOrders() {
    const res = await fetch(`${this.baseUrl}/orders`);
    return await res.json();
  },

  // 5. My Plant Fleet
  async getFleet() {
    const res = await fetch(`${this.baseUrl}/fleet`);
    return await res.json();
  },

  async addFleetItem(fleetData) {
    const res = await fetch(`${this.baseUrl}/fleet`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fleetData)
    });
    return await res.json();
  },

  async deleteFleetItem(id) {
    const res = await fetch(`${this.baseUrl}/fleet/${id}`, {
      method: 'DELETE'
    });
    return await res.json();
  },

  // 6. Admin Stats
  async getStats() {
    const res = await fetch(`${this.baseUrl}/stats`);
    return await res.json();
  }
};

window.API = API;
