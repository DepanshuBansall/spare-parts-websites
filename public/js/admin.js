/**
 * TurbineTek Administrator Control Center Engine
 * Real-time KPI analytics, Inventory CRUD, RFQ status processor, and Order fulfillment
 */

document.addEventListener('DOMContentLoaded', async () => {
  await loadAdminStats();
  await loadInventoryTable();
  await loadAdminRfqs();
  await loadAdminOrders();
  setupAddProductModal();
});

// 1. Load KPI statistics
async function loadAdminStats() {
  try {
    const res = await API.getStats();
    if (!res.success) return;
    const stats = res.data;

    document.getElementById('statTotalProducts').textContent = stats.totalProducts;
    document.getElementById('statInventoryValue').textContent = `₹${stats.totalInventoryValue.toLocaleString('en-IN', {minimumFractionDigits: 0, maximumFractionDigits: 0})}`;
    document.getElementById('statTotalOrders').textContent = stats.totalOrders;
    document.getElementById('statTotalRevenue').textContent = `₹${stats.totalRevenue.toLocaleString('en-IN', {minimumFractionDigits: 0, maximumFractionDigits: 0})}`;
    document.getElementById('statTotalRfqs').textContent = stats.totalRfqs;
    document.getElementById('statPendingRfqs').textContent = `${stats.pendingRfqs} Action Required`;

    // Render simple CSS bar distribution of categories
    const catDistEl = document.getElementById('adminCategoryDistribution');
    if (catDistEl && stats.categoryStats) {
      catDistEl.innerHTML = stats.categoryStats.map(c => `
        <div style="margin-bottom: 12px;">
          <div style="display: flex; justify-content: space-between; font-size: 0.82rem; margin-bottom: 4px;">
            <span>${c.name}</span>
            <strong class="mono" style="color: var(--accent-cyan);">${c.count} parts</strong>
          </div>
          <div style="width: 100%; height: 6px; background: rgba(255,255,255,0.06); border-radius: 3px; overflow: hidden;">
            <div style="width: ${(c.count / stats.totalProducts) * 100}%; height: 100%; background: linear-gradient(90deg, #00E5FF, #0284C7); border-radius: 3px;"></div>
          </div>
        </div>
      `).join('');
    }

  } catch (err) {
    console.error('Error loading admin stats:', err);
  }
}

// 2. Inventory Management Table
async function loadInventoryTable() {
  const tbody = document.getElementById('adminInventoryTbody');
  if (!tbody) return;

  try {
    const res = await API.getProducts();
    if (!res.success) return;

    tbody.innerHTML = res.data.map(p => {
      const isLow = p.stock <= 10;
      const stockBadge = p.stock > 0 
        ? `<span style="color: ${isLow ? '#FBBF24' : '#34D399'}; font-weight: bold;">${p.stock} units</span>`
        : '<span style="color: #EF4444; font-weight: bold;">0 (Out)</span>';

      return `
        <tr style="border-bottom: 1px solid var(--border-light);">
          <td style="padding: 10px; font-family: var(--font-mono); color: var(--accent-cyan); font-weight: 600;">${p.partNumber}</td>
          <td style="padding: 10px;">
            <div style="font-weight: 600;">${p.name}</div>
            <div style="font-size: 0.75rem; color: var(--text-muted);">OEM: ${p.oemManufacturer} (${p.oemPartNumber})</div>
          </td>
          <td style="padding: 10px; font-size: 0.82rem; text-transform: capitalize;">${p.category.replace('-', ' ')}</td>
          <td style="padding: 10px; font-family: var(--font-mono); font-weight: 700;">₹${p.price.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
          <td style="padding: 10px; font-family: var(--font-mono);">${stockBadge}</td>
          <td style="padding: 10px; text-align: right;">
            <button class="btn btn-secondary" style="padding: 4px 10px; font-size: 0.75rem; margin-right: 6px;" onclick="openEditProductModal('${p.id}')">
              <i class="fa-solid fa-pen-to-square"></i> Edit
            </button>
            <button class="btn" style="padding: 4px 10px; font-size: 0.75rem; background: rgba(239, 68, 68, 0.15); color: #EF4444;" onclick="deleteAdminProduct('${p.id}')">
              <i class="fa-solid fa-trash"></i>
            </button>
          </td>
        </tr>
      `;
    }).join('');

  } catch (err) {
    console.error('Error loading inventory table:', err);
  }
}

// 3. Admin RFQ Review
async function loadAdminRfqs() {
  const tbody = document.getElementById('adminRfqsTbody');
  if (!tbody) return;

  try {
    const res = await API.getRfqs();
    if (!res.success) return;

    tbody.innerHTML = res.data.map(rfq => `
      <tr style="border-bottom: 1px solid var(--border-light);">
        <td style="padding: 10px; font-family: var(--font-mono); font-weight: 700; color: var(--accent-cyan);">${rfq.id}</td>
        <td style="padding: 10px;">
          <div style="font-weight: 600;">${rfq.customer.company}</div>
          <div style="font-size: 0.75rem; color: var(--text-muted);">${rfq.customer.contactName} • ${rfq.customer.email}</div>
        </td>
        <td style="padding: 10px; font-size: 0.82rem;">${rfq.turbineModel}</td>
        <td style="padding: 10px; font-family: var(--font-mono); font-weight: 700; color: #FFF;">₹${(rfq.estimatedTotal || 0).toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
        <td style="padding: 10px;">
          <select style="background: rgba(255,255,255,0.08); border: 1px solid var(--border-light); color: #fff; padding: 4px 8px; border-radius: 4px; font-size: 0.8rem;" onchange="updateRfqStatusLive('${rfq.id}', this.value)">
            <option value="Submitted" ${rfq.status === 'Submitted' ? 'selected' : ''}>Submitted</option>
            <option value="Reviewing" ${rfq.status === 'Reviewing' ? 'selected' : ''}>Under Review</option>
            <option value="Quote Sent" ${rfq.status === 'Quote Sent' ? 'selected' : ''}>Quote Sent</option>
            <option value="Approved" ${rfq.status === 'Approved' ? 'selected' : ''}>Approved / PO Issued</option>
            <option value="Declined" ${rfq.status === 'Declined' ? 'selected' : ''}>Declined</option>
          </select>
        </td>
        <td style="padding: 10px; text-align: right;">
          <a href="/rfq.html?id=${rfq.id}" target="_blank" class="btn btn-outline-cyan" style="padding: 4px 10px; font-size: 0.75rem;">
            <i class="fa-solid fa-file-pdf"></i> Formal Quote
          </a>
        </td>
      </tr>
    `).join('');

  } catch (err) {
    console.error('Error loading admin RFQs:', err);
  }
}

// 4. Admin Orders Table
async function loadAdminOrders() {
  const tbody = document.getElementById('adminOrdersTbody');
  if (!tbody) return;

  try {
    const res = await API.getOrders();
    if (!res.success) return;

    tbody.innerHTML = res.data.map(order => `
      <tr style="border-bottom: 1px solid var(--border-light);">
        <td style="padding: 10px; font-family: var(--font-mono); font-weight: 700; color: var(--accent-cyan);">${order.orderId}</td>
        <td style="padding: 10px;">
          <div style="font-weight: 600;">${order.customer ? order.customer.company : 'Direct Commercial Order'}</div>
          <div style="font-size: 0.75rem; color: var(--text-muted);">${order.customer ? order.customer.email : ''}</div>
        </td>
        <td style="padding: 10px; font-size: 0.82rem;">${order.items ? order.items.length : 0} items</td>
        <td style="padding: 10px; font-family: var(--font-mono); font-weight: 700; color: #FFF;">₹${(order.total || 0).toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
        <td style="padding: 10px; font-size: 0.8rem; color: #34D399;">
          <i class="fa-solid fa-truck-fast"></i> ${order.shippingStatus || 'Processing'}
        </td>
        <td style="padding: 10px; text-align: right;">
          <span style="background: rgba(16, 185, 129, 0.15); color: #34D399; padding: 3px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: 700;">
            ${order.status || 'Confirmed'}
          </span>
        </td>
      </tr>
    `).join('');

  } catch (err) {
    console.error('Error loading admin orders:', err);
  }
}

// Live update of RFQ status
window.updateRfqStatusLive = async function(id, newStatus) {
  try {
    const res = await API.updateRfqStatus(id, newStatus);
    if (!res.success) throw new Error(res.message);
    Cart.showToast(`Updated ${id} status to "${newStatus}"`);
    await loadAdminStats();
  } catch (err) {
    alert('Failed to update status: ' + err.message);
  }
};

// Delete product
window.deleteAdminProduct = async function(id) {
  if (!confirm(`Are you sure you want to remove part ${id} from catalog?`)) return;
  try {
    const res = await API.deleteProduct(id);
    if (!res.success) throw new Error(res.message);
    Cart.showToast('Part removed from inventory');
    await loadInventoryTable();
    await loadAdminStats();
  } catch (err) {
    alert('Error deleting product: ' + err.message);
  }
};

// Setup Add Product Modal & Form
function setupAddProductModal() {
  const triggerBtn = document.getElementById('openAddProductBtn');
  const modal = document.getElementById('addProductModal');
  const form = document.getElementById('addProductForm');

  if (triggerBtn && modal) {
    triggerBtn.addEventListener('click', () => modal.classList.add('active'));
  }

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(form);

      const newProduct = {
        name: formData.get('name'),
        partNumber: formData.get('partNumber'),
        category: formData.get('category'),
        oemManufacturer: formData.get('oemManufacturer'),
        oemPartNumber: formData.get('oemPartNumber'),
        turbineType: formData.get('turbineType'),
        turbineSection: formData.get('turbineSection'),
        price: parseFloat(formData.get('price')) || 0,
        stock: parseInt(formData.get('stock')) || 10,
        leadTime: formData.get('leadTime') || 'In Stock (Ships in 24h)',
        image: formData.get('image') || '/images/blade.jpg',
        shortDesc: formData.get('shortDesc') || 'Certified industrial replacement component.',
        compatibleTurbines: formData.get('compatibleTurbines') ? formData.get('compatibleTurbines').split(',').map(s => s.trim()) : ['LM2500', 'SGT-400']
      };

      try {
        const res = await API.createProduct(newProduct);
        if (!res.success) throw new Error(res.message);

        modal.classList.remove('active');
        form.reset();
        Cart.showToast(`Added part ${newProduct.partNumber} to catalog!`);
        await loadInventoryTable();
        await loadAdminStats();

      } catch (err) {
        alert('Error adding part: ' + err.message);
      }
    });
  }
}

// Quick edit product
window.openEditProductModal = async function(id) {
  try {
    const res = await API.getProduct(id);
    if (!res.success) throw new Error(res.message);
    const p = res.data;

    const newPrice = prompt(`Update Net Price for ${p.name} (Current: ₹${p.price}):`, p.price);
    if (newPrice === null) return;

    const newStock = prompt(`Update Available Stock Units (Current: ${p.stock}):`, p.stock);
    if (newStock === null) return;

    const updateRes = await API.updateProduct(id, {
      price: parseFloat(newPrice) || p.price,
      stock: parseInt(newStock) || p.stock
    });

    if (updateRes.success) {
      Cart.showToast(`Updated part ${p.partNumber}`);
      await loadInventoryTable();
      await loadAdminStats();
    }
  } catch (err) {
    alert('Error editing product: ' + err.message);
  }
};
