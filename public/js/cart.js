/**
 * TurbineTek Cart & Notification Management
 * Manages shopping cart, B2B procurement drawer, and interactive toast alerts
 */

const Cart = {
  items: [],

  init() {
    this.load();
    this.updateBadge();
    this.setupListeners();
  },

  load() {
    try {
      const stored = localStorage.getItem('turbinetek_cart');
      this.items = stored ? JSON.parse(stored) : [];
    } catch (e) {
      this.items = [];
    }
  },

  save() {
    try {
      localStorage.setItem('turbinetek_cart', JSON.stringify(this.items));
    } catch (e) {
      console.error('Error saving cart:', e);
    }
    this.updateBadge();
  },

  add(product, qty = 1) {
    const existing = this.items.find(item => item.id === product.id);
    if (existing) {
      existing.quantity += parseInt(qty) || 1;
    } else {
      this.items.push({
        id: product.id,
        name: product.name,
        partNumber: product.partNumber,
        price: product.price,
        image: product.image || '/images/blade.jpg',
        quantity: parseInt(qty) || 1
      });
    }
    this.save();
    this.renderDrawer();
    this.showToast(`Added "${product.name}" to Procurement Cart`);
    this.openDrawer();
  },

  remove(productId) {
    this.items = this.items.filter(item => item.id !== productId);
    this.save();
    this.renderDrawer();
    this.showToast('Item removed from cart', 'info');
  },

  updateQty(productId, delta) {
    const item = this.items.find(i => i.id === productId);
    if (!item) return;

    item.quantity += delta;
    if (item.quantity <= 0) {
      this.remove(productId);
    } else {
      this.save();
      this.renderDrawer();
    }
  },

  clear() {
    this.items = [];
    this.save();
    this.renderDrawer();
  },

  getCount() {
    return this.items.reduce((acc, item) => acc + item.quantity, 0);
  },

  getSubtotal() {
    return this.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  },

  updateBadge() {
    const badges = document.querySelectorAll('.cart-count');
    const count = this.getCount();
    badges.forEach(b => {
      b.textContent = count;
      b.style.display = count > 0 ? 'flex' : 'none';
    });
  },

  openDrawer() {
    const overlay = document.getElementById('cartOverlay');
    const drawer = document.getElementById('cartDrawer');
    if (overlay && drawer) {
      this.renderDrawer();
      overlay.classList.add('active');
      drawer.classList.add('active');
    }
  },

  closeDrawer() {
    const overlay = document.getElementById('cartOverlay');
    const drawer = document.getElementById('cartDrawer');
    if (overlay && drawer) {
      overlay.classList.remove('active');
      drawer.classList.remove('active');
    }
  },

  renderDrawer() {
    const container = document.getElementById('cartItemsList');
    const subtotalEl = document.getElementById('cartSubtotal');
    const grandTotalEl = document.getElementById('cartGrandTotal');
    const freightEl = document.getElementById('cartFreight');

    if (!container) return;

    if (this.items.length === 0) {
      container.innerHTML = `
        <div class="cart-empty-state">
          <i class="fa-solid fa-box-open"></i>
          <h4>Procurement Cart is Empty</h4>
          <p style="font-size: 0.85rem; margin-top: 6px;">Select industrial turbine spare parts to purchase directly or request a formal B2B quotation.</p>
          <a href="/catalog.html" class="btn btn-outline-cyan" style="margin-top: 16px; display: inline-flex;" onclick="Cart.closeDrawer()">Browse Catalog</a>
        </div>
      `;
      if (subtotalEl) subtotalEl.textContent = '₹0.00';
      if (freightEl) freightEl.textContent = '₹0.00';
      if (grandTotalEl) grandTotalEl.textContent = '₹0.00';
      return;
    }

    container.innerHTML = this.items.map(item => `
      <div class="cart-item">
        <img src="${item.image}" alt="${item.name}">
        <div class="cart-item-info">
          <div class="cart-item-part">${item.partNumber}</div>
          <div class="cart-item-title">${item.name}</div>
          <div class="cart-item-price">₹${(item.price * item.quantity).toLocaleString('en-IN', {minimumFractionDigits: 2})}</div>
          <div class="cart-qty-ctrl">
            <button class="qty-btn" onclick="Cart.updateQty('${item.id}', -1)">-</button>
            <span class="qty-number">${item.quantity}</span>
            <button class="qty-btn" onclick="Cart.updateQty('${item.id}', 1)">+</button>
          </div>
        </div>
        <button class="cart-item-remove" title="Remove part" onclick="Cart.remove('${item.id}')">
          <i class="fa-solid fa-trash-can"></i>
        </button>
      </div>
    `).join('');

    const subtotal = this.getSubtotal();
    const freight = subtotal > 400000 ? 0 : 25000.00;
    const grandTotal = subtotal + freight;

    if (subtotalEl) subtotalEl.textContent = `₹${subtotal.toLocaleString('en-IN', {minimumFractionDigits: 2})}`;
    if (freightEl) freightEl.textContent = freight === 0 ? 'FREE Freight' : `₹${freight.toLocaleString('en-IN', {minimumFractionDigits: 2})}`;
    if (grandTotalEl) grandTotalEl.textContent = `₹${grandTotal.toLocaleString('en-IN', {minimumFractionDigits: 2})}`;
  },

  setupListeners() {
    const trigger = document.getElementById('cartTriggerBtn');
    if (trigger) {
      trigger.addEventListener('click', () => this.openDrawer());
    }

    const closeBtn = document.getElementById('cartCloseBtn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.closeDrawer());
    }

    const overlay = document.getElementById('cartOverlay');
    if (overlay) {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) this.closeDrawer();
      });
    }
  },

  showToast(message, type = 'success') {
    let container = document.getElementById('toastContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toastContainer';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    const iconClass = type === 'success' ? 'fa-circle-check' : (type === 'error' ? 'fa-triangle-exclamation' : 'fa-circle-info');

    toast.innerHTML = `
      <i class="fa-solid ${iconClass}"></i>
      <div style="font-size: 0.88rem; font-weight: 500;">${message}</div>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }
};

window.Cart = Cart;
document.addEventListener('DOMContentLoaded', () => Cart.init());
