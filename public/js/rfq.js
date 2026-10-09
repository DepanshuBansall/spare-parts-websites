/**
 * TurbineTek B2B RFQ (Request for Quotation) Engine
 * Manages RFQ inquiries, formal quote document generation, and tracking
 */

let rfqItemsList = [];

document.addEventListener('DOMContentLoaded', async () => {
  initRfqPage();
  await loadSubmittedRfqs();
});

function initRfqPage() {
  // If items in cart, allow importing them into RFQ
  const importBtn = document.getElementById('importCartItemsBtn');
  if (importBtn && Cart.items.length > 0) {
    importBtn.style.display = 'inline-flex';
    importBtn.addEventListener('click', () => {
      rfqItemsList = [...Cart.items];
      renderRfqItemsTable();
      Cart.showToast(`Imported ${Cart.items.length} items from cart into RFQ.`);
    });
  }

  // Handle Add Item manually via product picker
  loadProductPicker();

  // Handle RFQ Form Submission
  const form = document.getElementById('rfqMainForm');
  if (form) {
    form.addEventListener('submit', handleRfqSubmit);
  }

  // Check URL param if opening a specific RFQ quote
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has('id')) {
    viewQuotationModal(urlParams.get('id'));
  }
}

async function loadProductPicker() {
  const pickerSelect = document.getElementById('rfqProductSelect');
  if (!pickerSelect) return;

  try {
    const res = await API.getProducts();
    if (res.success) {
      pickerSelect.innerHTML = '<option value="">-- Choose Spare Part from Catalog --</option>' +
        res.data.map(p => `<option value="${p.id}" data-name="${p.name}" data-part="${p.partNumber}" data-price="${p.price}">[${p.partNumber}] ${p.name} (₹${p.price.toLocaleString('en-IN')})</option>`).join('');
    }
  } catch (err) {
    console.error('Error loading products for RFQ picker:', err);
  }

  const addBtn = document.getElementById('rfqAddProductBtn');
  const qtyInput = document.getElementById('rfqProductQty');

  if (addBtn && pickerSelect && qtyInput) {
    addBtn.addEventListener('click', () => {
      const selectedOption = pickerSelect.options[pickerSelect.selectedIndex];
      if (!selectedOption || !selectedOption.value) {
        alert('Please choose a spare part.');
        return;
      }

      const id = selectedOption.value;
      const name = selectedOption.dataset.name;
      const partNumber = selectedOption.dataset.part;
      const price = parseFloat(selectedOption.dataset.price) || 0;
      const qty = parseInt(qtyInput.value) || 1;

      const existing = rfqItemsList.find(i => i.id === id);
      if (existing) {
        existing.quantity += qty;
      } else {
        rfqItemsList.push({ id, name, partNumber, price, quantity: qty });
      }

      renderRfqItemsTable();
      pickerSelect.value = '';
      qtyInput.value = '1';
    });
  }
}

function renderRfqItemsTable() {
  const tbody = document.getElementById('rfqItemsTbody');
  const emptyState = document.getElementById('rfqEmptyItems');
  const subtotalEl = document.getElementById('rfqSubtotalText');
  const discountEl = document.getElementById('rfqDiscountText');
  const totalEl = document.getElementById('rfqTotalText');

  if (!tbody) return;

  if (rfqItemsList.length === 0) {
    if (emptyState) emptyState.style.display = 'block';
    tbody.innerHTML = '';
    if (subtotalEl) subtotalEl.textContent = '₹0.00';
    if (discountEl) discountEl.textContent = '₹0.00';
    if (totalEl) totalEl.textContent = '₹0.00';
    return;
  }

  if (emptyState) emptyState.style.display = 'none';

  let subtotal = 0;
  tbody.innerHTML = rfqItemsList.map((item, idx) => {
    const itemTotal = item.price * item.quantity;
    subtotal += itemTotal;

    return `
      <tr style="border-bottom: 1px solid var(--border-light);">
        <td style="padding: 10px; font-family: var(--font-mono); color: var(--accent-cyan);">${item.partNumber}</td>
        <td style="padding: 10px; font-weight: 500;">${item.name}</td>
        <td style="padding: 10px; text-align: center;">
          <input type="number" min="1" value="${item.quantity}" style="width: 60px; padding: 4px; background: rgba(255,255,255,0.08); border: 1px solid var(--border-light); color: #fff; text-align: center; border-radius: 4px;" onchange="updateRfqItemQty(${idx}, this.value)">
        </td>
        <td style="padding: 10px; font-family: var(--font-mono); text-align: right;">₹${item.price.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
        <td style="padding: 10px; font-family: var(--font-mono); font-weight: 700; text-align: right; color: var(--accent-cyan);">₹${itemTotal.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
        <td style="padding: 10px; text-align: center;">
          <button style="background: transparent; border: none; color: var(--accent-red); cursor: pointer;" onclick="removeRfqItem(${idx})">
            <i class="fa-solid fa-trash"></i>
          </button>
        </td>
      </tr>
    `;
  }).join('');

  // Volume discount tier
  let discountRate = 0;
  if (subtotal >= 2500000) discountRate = 0.10;
  else if (subtotal >= 800000) discountRate = 0.05;

  const discount = subtotal * discountRate;
  const total = subtotal - discount;

  if (subtotalEl) subtotalEl.textContent = `₹${subtotal.toLocaleString('en-IN', {minimumFractionDigits: 2})}`;
  if (discountEl) discountEl.textContent = discount > 0 ? `-₹${discount.toLocaleString('en-IN', {minimumFractionDigits: 2})} (${discountRate * 100}% B2B Tier)` : '₹0.00 (Tier starts at ₹8 Lakhs)';
  if (totalEl) totalEl.textContent = `₹${total.toLocaleString('en-IN', {minimumFractionDigits: 2})}`;
}

window.updateRfqItemQty = function(idx, val) {
  const qty = parseInt(val) || 1;
  if (rfqItemsList[idx]) {
    rfqItemsList[idx].quantity = qty;
    renderRfqItemsTable();
  }
};

window.removeRfqItem = function(idx) {
  rfqItemsList.splice(idx, 1);
  renderRfqItemsTable();
};

async function handleRfqSubmit(e) {
  e.preventDefault();

  if (rfqItemsList.length === 0) {
    alert('Please add at least one spare part to your RFQ inquiry.');
    return;
  }

  const form = e.target;
  const formData = new FormData(form);

  const rfqData = {
    customer: {
      company: formData.get('company'),
      contactName: formData.get('contactName'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      country: formData.get('country'),
      plantLocation: formData.get('plantLocation')
    },
    turbineModel: formData.get('turbineModel'),
    requiredDelivery: formData.get('requiredDelivery'),
    urgency: formData.get('urgency'),
    notes: formData.get('notes'),
    items: rfqItemsList
  };

  try {
    const res = await API.submitRfq(rfqData);
    if (!res.success) throw new Error(res.message);

    form.reset();
    rfqItemsList = [];
    renderRfqItemsTable();

    Cart.showToast(`Quotation #${res.data.id} generated!`);
    await loadSubmittedRfqs();
    viewQuotationModal(res.data.id);

  } catch (err) {
    alert('Error submitting RFQ: ' + err.message);
  }
}

async function loadSubmittedRfqs() {
  const container = document.getElementById('recentRfqsTableBody');
  if (!container) return;

  try {
    const res = await API.getRfqs();
    if (!res.success || res.data.length === 0) {
      container.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 24px; color: var(--text-muted);">No RFQs registered yet.</td></tr>';
      return;
    }

    container.innerHTML = res.data.map(rfq => {
      let statusBadge = '<span style="background: rgba(0,229,255,0.15); color: var(--accent-cyan); padding: 3px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: 600;">Submitted</span>';
      if (rfq.status === 'Quote Sent') {
        statusBadge = '<span style="background: rgba(16,185,129,0.15); color: #34D399; padding: 3px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: 600;">Quote Sent</span>';
      } else if (rfq.status === 'Reviewing') {
        statusBadge = '<span style="background: rgba(245,158,11,0.15); color: #FBBF24; padding: 3px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: 600;">Under Review</span>';
      }

      return `
        <tr style="border-bottom: 1px solid var(--border-light);">
          <td style="padding: 12px; font-family: var(--font-mono); font-weight: 700; color: var(--accent-cyan);">${rfq.id}</td>
          <td style="padding: 12px;">
            <div style="font-weight: 600;">${rfq.customer.company}</div>
            <div style="font-size: 0.75rem; color: var(--text-muted);">${rfq.customer.contactName} (${rfq.customer.email})</div>
          </td>
          <td style="padding: 12px; font-size: 0.85rem;">${rfq.turbineModel}</td>
          <td style="padding: 12px; font-size: 0.85rem;">${rfq.items ? rfq.items.length : 0} components</td>
          <td style="padding: 12px; font-family: var(--font-mono); font-weight: 700; color: #FFF;">₹${(rfq.estimatedTotal || 0).toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
          <td style="padding: 12px;">${statusBadge}</td>
          <td style="padding: 12px; text-align: right;">
            <button class="btn btn-secondary" style="padding: 6px 12px; font-size: 0.78rem;" onclick="viewQuotationModal('${rfq.id}')">
              <i class="fa-solid fa-file-pdf" style="color: var(--accent-amber);"></i> View Formal Quote
            </button>
          </td>
        </tr>
      `;
    }).join('');

  } catch (err) {
    console.error('Error loading submitted RFQs:', err);
  }
}

// Modal displaying formal B2B Quotation Document
window.viewQuotationModal = async function(rfqId) {
  let modal = document.getElementById('rfqDocModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'rfqDocModal';
    modal.className = 'modal-backdrop';
    document.body.appendChild(modal);
  }

  modal.innerHTML = `
    <div class="modal-window" style="max-width: 820px; background: #FFF; color: #1E293B;">
      <div style="padding: 16px 24px; background: #0B132B; color: #FFF; display: flex; justify-content: space-between; align-items: center; border-top-left-radius: var(--radius-xl); border-top-right-radius: var(--radius-xl);">
        <h4 style="margin: 0; font-size: 1.05rem; display: flex; align-items: center; gap: 8px;">
          <i class="fa-solid fa-certificate" style="color: #00E5FF;"></i> Official Commercial Quotation Document
        </h4>
        <div style="display: flex; gap: 10px;">
          <button onclick="window.print()" class="btn btn-primary" style="padding: 4px 12px; font-size: 0.8rem;"><i class="fa-solid fa-print"></i> Print / PDF</button>
          <button onclick="document.getElementById('rfqDocModal').classList.remove('active')" class="close-btn" style="color: #FFF;">&times;</button>
        </div>
      </div>
      <div id="rfqDocContent" style="padding: 30px; font-family: Arial, sans-serif;">
        <div style="text-align: center; padding: 40px;"><i class="fa-solid fa-spinner fa-spin" style="font-size: 2rem; color: #0284C7;"></i></div>
      </div>
    </div>
  `;

  modal.classList.add('active');

  try {
    const res = await API.getRfqs();
    const rfq = res.data.find(r => r.id === rfqId);
    if (!rfq) throw new Error('Quotation ID not found');

    const content = document.getElementById('rfqDocContent');

    const itemsRows = (rfq.items || []).map((it, idx) => `
      <tr style="border-bottom: 1px solid #E2E8F0;">
        <td style="padding: 8px; text-align: center; font-size: 12px;">${idx + 1}</td>
        <td style="padding: 8px; font-family: monospace; font-size: 12px; font-weight: bold; color: #0284C7;">${it.partNumber || it.productId}</td>
        <td style="padding: 8px; font-size: 13px;">${it.name}</td>
        <td style="padding: 8px; text-align: center; font-size: 13px;">${it.quantity}</td>
        <td style="padding: 8px; text-align: right; font-family: monospace; font-size: 13px;">₹${(it.unitPrice || 0).toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
        <td style="padding: 8px; text-align: right; font-family: monospace; font-weight: bold; font-size: 13px;">₹${(it.totalPrice || 0).toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
      </tr>
    `).join('');

    content.innerHTML = `
      <div style="display: flex; justify-content: space-between; border-bottom: 2px solid #0F172A; padding-bottom: 16px; margin-bottom: 20px;">
        <div>
          <div style="font-size: 26px; font-weight: 800; color: #0B132B; letter-spacing: -0.5px;">TURBINE<span style="color: #0284C7;">TEK</span></div>
          <div style="font-size: 11px; color: #64748B; margin-top: 4px;">TurbineTek International GmbH • Industrial Power Services</div>
          <div style="font-size: 11px; color: #64748B;">Central Logistics Center, Am Turbinenwerk 14, 20457 Hamburg, Germany</div>
          <div style="font-size: 11px; color: #64748B;">Tel: +49 (40) 8900-2400 • Email: b2b-quotes@turbinetek.com</div>
        </div>
        <div style="text-align: right;">
          <div style="font-size: 20px; font-weight: bold; color: #0284C7;">COMMERCIAL QUOTATION</div>
          <div style="font-family: monospace; font-size: 14px; font-weight: bold; margin-top: 4px;">${rfq.id}</div>
          <div style="font-size: 12px; color: #64748B; margin-top: 2px;">Date: ${new Date(rfq.createdAt).toLocaleDateString()}</div>
          <div style="font-size: 12px; color: #DC2626; font-weight: bold; margin-top: 2px;">Valid Until: ${rfq.validUntil}</div>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px; font-size: 13px;">
        <div style="background: #F8FAFC; padding: 14px; border: 1px solid #E2E8F0; border-radius: 6px;">
          <div style="font-weight: bold; color: #0F172A; margin-bottom: 6px; text-transform: uppercase; font-size: 11px; color: #64748B;">Customer / Invoicing Party:</div>
          <div style="font-size: 14px; font-weight: bold; color: #0F172A;">${rfq.customer.company}</div>
          <div>Attn: ${rfq.customer.contactName}</div>
          <div>Email: ${rfq.customer.email} • Tel: ${rfq.customer.phone || 'N/A'}</div>
          <div>Destination: ${rfq.customer.plantLocation || 'Power Station Facility'} (${rfq.customer.country || 'Global'})</div>
        </div>
        <div style="background: #F8FAFC; padding: 14px; border: 1px solid #E2E8F0; border-radius: 6px;">
          <div style="font-weight: bold; color: #0F172A; margin-bottom: 6px; text-transform: uppercase; font-size: 11px; color: #64748B;">Technical Specification:</div>
          <div>Equipment: <strong>${rfq.turbineModel}</strong></div>
          <div>Target Outage / Delivery: <strong>${rfq.requiredDelivery}</strong></div>
          <div>Priority Level: <strong>${rfq.urgency}</strong></div>
          <div>Quality Standard: <strong>DIN EN ISO 9001:2015 / EN 10204 3.1</strong></div>
        </div>
      </div>

      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        <thead>
          <tr style="background: #0F172A; color: #FFF; font-size: 12px; text-align: left;">
            <th style="padding: 8px; width: 30px; text-align: center;">#</th>
            <th style="padding: 8px; width: 140px;">Part Number</th>
            <th style="padding: 8px;">Description / Specification</th>
            <th style="padding: 8px; width: 60px; text-align: center;">Qty</th>
            <th style="padding: 8px; width: 100px; text-align: right;">Unit Price</th>
            <th style="padding: 8px; width: 110px; text-align: right;">Total Net</th>
          </tr>
        </thead>
        <tbody>
          ${itemsRows}
        </tbody>
      </table>

      <div style="display: flex; justify-content: flex-end; margin-bottom: 24px;">
        <div style="width: 280px; font-size: 13px;">
          <div style="display: flex; justify-content: space-between; padding: 4px 0; color: #64748B;">
            <span>Subtotal (Net):</span>
            <span style="font-family: monospace;">₹${(rfq.subtotal || 0).toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 4px 0; color: #059669;">
            <span>Volume Tier Discount (${rfq.discountRate}):</span>
            <span style="font-family: monospace;">-₹${(rfq.discount || 0).toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 8px 0; border-top: 2px solid #0F172A; font-weight: bold; font-size: 15px; color: #0F172A;">
            <span>Total Quotation:</span>
            <span style="font-family: monospace; color: #0284C7;">₹${(rfq.estimatedTotal || 0).toLocaleString('en-IN', {minimumFractionDigits: 2})} INR</span>
          </div>
        </div>
      </div>

      <div style="border-top: 1px dashed #CBD5E1; padding-top: 14px; font-size: 11px; color: #64748B; line-height: 1.5;">
        <strong>Terms of Delivery:</strong> Incoterms 2020 CIP (Air Freight to nearest international cargo airport). All spare parts are covered by TurbineTek 18-month warranty against metallurgical and manufacturing defects. Supplied with manufacturer conformity certificates and mill test reports.<br>
        <strong>Authorized Signatory:</strong> TurbineTek Commercial Contracts & Engineering Desk.
      </div>
    `;

  } catch (err) {
    alert('Error viewing quotation: ' + err.message);
  }
};
