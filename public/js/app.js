/**
 * TurbineTek Main Application Engine
 * Powers interactive turbine schematic, OEM compatibility finder, live catalog & telemetry HUD
 */

document.addEventListener('DOMContentLoaded', async () => {
  await initEquipmentFinder();
  await initInteractiveTurbineSchematic();
  await initHeaderSearch();
  await loadFeaturedProducts();
  await loadCategoriesShowcase();
  setupCrossReferenceSearch();
  setupCheckoutModal();
});

// ==========================================
// 1. EQUIPMENT COMPATIBILITY FINDER (Onergys Style)
// ==========================================
async function initEquipmentFinder() {
  const typeSelect = document.getElementById('finderType');
  const mfrSelect = document.getElementById('finderMfr');
  const modelSelect = document.getElementById('finderModel');
  const finderForm = document.getElementById('finderForm');

  if (!typeSelect || !mfrSelect || !modelSelect) return;

  try {
    const res = await API.getTurbines();
    if (!res.success) return;
    const turbines = res.data;

    // Populate Machine Types
    const types = [...new Set(turbines.map(t => t.type))];
    typeSelect.innerHTML = '<option value="">-- Select Equipment Type --</option>' +
      types.map(t => `<option value="${t}">${t}</option>`).join('');

    // Handle Type Change -> Update Manufacturers
    typeSelect.addEventListener('change', () => {
      const selectedType = typeSelect.value;
      if (!selectedType) {
        mfrSelect.innerHTML = '<option value="">-- First Select Type --</option>';
        modelSelect.innerHTML = '<option value="">-- First Select Manufacturer --</option>';
        return;
      }

      const mfrs = turbines.filter(t => t.type === selectedType);
      mfrSelect.innerHTML = '<option value="">-- Select Manufacturer --</option>' +
        mfrs.map(m => `<option value="${m.manufacturer}">${m.manufacturer}</option>`).join('');
      modelSelect.innerHTML = '<option value="">-- First Select Manufacturer --</option>';
    });

    // Handle Mfr Change -> Update Models
    mfrSelect.addEventListener('change', () => {
      const selectedType = typeSelect.value;
      const selectedMfr = mfrSelect.value;
      if (!selectedMfr) {
        modelSelect.innerHTML = '<option value="">-- First Select Manufacturer --</option>';
        return;
      }

      const match = turbines.find(t => t.type === selectedType && t.manufacturer === selectedMfr);
      if (match && match.models) {
        modelSelect.innerHTML = '<option value="">-- Select Specific Model --</option>' +
          match.models.map(m => `<option value="${m}">${m}</option>`).join('');
      }
    });

    // Handle Form Submit -> Filter Catalog
    finderForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const model = modelSelect.value;
      const type = typeSelect.value;
      const mfr = mfrSelect.value;

      let targetUrl = '/catalog.html?';
      if (model) targetUrl += `turbineModel=${encodeURIComponent(model)}&`;
      if (mfr) targetUrl += `manufacturer=${encodeURIComponent(mfr)}&`;
      if (type) targetUrl += `turbineType=${encodeURIComponent(type)}`;

      window.location.href = targetUrl;
    });

  } catch (err) {
    console.error('Error initializing Equipment Finder:', err);
  }
}

// ==========================================
// 2. INTERACTIVE TURBINE EXPLODED SCHEMATIC
// ==========================================
const TURBINE_SECTIONS_DATA = {
  intake: {
    title: 'Air Intake & Filtration Stage',
    desc: 'High-volume inlet housing equipped with multi-stage HEPA barrier filter cartridges, anti-icing systems, and acoustic silencer baffles.',
    temp: '15 °C to 45 °C',
    flow: '82.4 kg/s Mass Flow',
    pressure: '1.013 bar (Atmospheric)',
    parts: 'F9/E10 HEPA Filters, Inlet Louvers, Moisture Eliminators'
  },
  compressor: {
    title: 'Axial Compressor (16-18 Stages)',
    desc: 'Multi-stage axial rotor and stator vanes forged from titanium and 17-4PH stainless steel, generating up to 30:1 compression ratio with variable inlet guide vanes (VIGVs).',
    temp: '450 °C (Compressor Discharge)',
    flow: '80.1 kg/s Air Delivery',
    pressure: '30.2 bar (Discharge P3)',
    parts: 'Ti-6Al-4V Compressor Blades, Variable Stator Vanes, IGV Actuators'
  },
  combustor: {
    title: 'DLN Combustor & Fuel Injectors',
    desc: 'Dry Low NOx (DLN-2.6) annular combustion chambers with multi-nozzle fuel premixers, high-energy spark igniters, and optical UV/IR flame scanners.',
    temp: '1,450 °C Firing Temp',
    flow: 'Natural Gas / Syngas / Biomethane',
    pressure: '29.5 bar Chamber Pressure',
    parts: 'Iridium Spark Plugs, Fuel Metering Valves, Transition Pieces, Flame Scanners'
  },
  turbine: {
    title: 'High-Pressure & Power Turbine',
    desc: 'Multi-stage expansion turbine featuring vacuum-cast single-crystal (SX) Inconel superalloy rotor blades, thermal barrier coatings, and air-cooled nozzle guide vanes.',
    temp: '1,180 °C Gas Path Entry',
    flow: '3,600 / 5,200 RPM Shaft Speed',
    pressure: 'Expansion to 1.05 bar',
    parts: 'Inconel 718 Rotor Blades, Stage 1/2 Nozzle Guide Vanes, Shroud Blocks'
  },
  exhaust: {
    title: 'Exhaust Diffuser & Thermocouple Array',
    desc: 'Aerodynamic exhaust collector hood with circumferential dual Type-K exhaust gas temperature (EGT) rake harness for hot-spot and flame-trip detection.',
    temp: '510 °C to 580 °C (EGT)',
    flow: 'High-velocity flue discharge to HRSG',
    pressure: 'Backpressure: 1.04 bar',
    parts: 'Dual Type-K Thermocouple Harness, Expansion Bellows, Exhaust Liners'
  },
  bearings: {
    title: 'Radial / Thrust Bearings & Labyrinth Seals',
    desc: 'Tilt-pad hydrodynamic journal bearings, active thrust collars, and spring-loaded segmented bronze labyrinth shaft seals with pressurized barrier air.',
    temp: '65 °C to 95 °C Oil Temp',
    flow: 'Lube Oil Flow: 250 L/min',
    pressure: '4.5 bar Lube Supply P',
    parts: 'Labyrinth Shaft Seals, Tilt-Pad Bearing Shells, 3µm High-Collapse Lube Oil Filters'
  }
};

async function initInteractiveTurbineSchematic() {
  const zones = document.querySelectorAll('.turbine-zone');
  const stageBtns = document.querySelectorAll('.stage-btn');
  const hudTitle = document.getElementById('hudZoneTitle');
  const hudDesc = document.getElementById('hudZoneDesc');
  const hudTemp = document.getElementById('hudZoneTemp');
  const hudFlow = document.getElementById('hudZoneFlow');
  const hudPressure = document.getElementById('hudZonePressure');
  const hudParts = document.getElementById('hudZoneParts');

  function updateHUD(sectionKey) {
    const data = TURBINE_SECTIONS_DATA[sectionKey];
    if (!data) return;

    if (hudTitle) hudTitle.textContent = data.title;
    if (hudDesc) hudDesc.textContent = data.desc;
    if (hudTemp) hudTemp.textContent = data.temp;
    if (hudFlow) hudFlow.textContent = data.flow;
    if (hudPressure) hudPressure.textContent = data.pressure;
    if (hudParts) hudParts.textContent = data.parts;

    // Highlight corresponding SVG zone
    zones.forEach(z => {
      if (z.dataset.section === sectionKey) {
        z.classList.add('selected');
      } else {
        z.classList.remove('selected');
      }
    });

    // Update Stage Buttons
    stageBtns.forEach(btn => {
      if (btn.dataset.section === sectionKey) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  // Bind SVG zone events
  zones.forEach(zone => {
    zone.addEventListener('mouseenter', () => {
      const section = zone.dataset.section;
      updateHUD(section);
    });

    zone.addEventListener('click', () => {
      const section = zone.dataset.section;
      updateHUD(section);
      filterProductsBySection(section);
    });
  });

  // Bind Navigation stage buttons
  stageBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const section = btn.dataset.section;
      if (section === 'all') {
        zones.forEach(z => z.classList.remove('selected'));
        stageBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        filterProductsBySection('all');
        if (hudTitle) hudTitle.textContent = 'Complete Industrial Turbine Overview';
        if (hudDesc) hudDesc.textContent = 'Explore all sub-assemblies. Click any zone above to isolate components and inspect compatible replacement parts.';
      } else {
        updateHUD(section);
        filterProductsBySection(section);
      }
    });
  });

  // Default to combustor on load
  updateHUD('combustor');
}

// ==========================================
// 3. HEADER LIVE SEARCH WITH AUTOCOMPLETE
// ==========================================
async function initHeaderSearch() {
  const searchInput = document.getElementById('headerSearchInput');
  const dropdown = document.getElementById('headerSearchResults');

  if (!searchInput || !dropdown) return;

  let debounceTimer;

  searchInput.addEventListener('input', (e) => {
    clearTimeout(debounceTimer);
    const query = e.target.value.trim();

    if (query.length < 2) {
      dropdown.classList.remove('active');
      dropdown.innerHTML = '';
      return;
    }

    debounceTimer = setTimeout(async () => {
      try {
        const res = await API.getProducts({ search: query });
        if (!res.success || res.data.length === 0) {
          dropdown.innerHTML = `
            <div style="padding: 16px; text-align: center; color: var(--text-muted); font-size: 0.85rem;">
              No exact match found for "<strong>${query}</strong>".<br>
              <a href="/rfq.html" style="color: var(--accent-cyan); display: inline-block; margin-top: 8px;">Request a Custom RFQ Sourcing</a>
            </div>
          `;
          dropdown.classList.add('active');
          return;
        }

        const itemsHtml = res.data.slice(0, 6).map(p => `
          <div class="dropdown-item-product" onclick="openProductQuickView('${p.id}')">
            <img src="${p.image}" alt="${p.name}">
            <div class="dropdown-item-details">
              <div class="dropdown-item-title">${p.name}</div>
              <div class="dropdown-item-meta">
                <span>Part: <strong style="color: var(--accent-cyan); font-family: var(--font-mono);">${p.partNumber}</strong></span>
                <span>OEM: ${p.oemManufacturer}</span>
              </div>
            </div>
            <div class="dropdown-item-price">₹${p.price.toLocaleString('en-IN', {minimumFractionDigits: 2})}</div>
          </div>
        `).join('');

        dropdown.innerHTML = itemsHtml + `
          <div style="padding: 10px 16px; background: rgba(0,0,0,0.3); text-align: center; border-top: 1px solid var(--border-light);">
            <a href="/catalog.html?search=${encodeURIComponent(query)}" style="font-size: 0.82rem; font-weight: 600; color: var(--accent-cyan);">
              View all ${res.data.length} results in Catalog <i class="fa-solid fa-arrow-right" style="margin-left: 4px;"></i>
            </a>
          </div>
        `;
        dropdown.classList.add('active');

      } catch (err) {
        console.error('Search error:', err);
      }
    }, 250);
  });

  // Close dropdown on outside click
  document.addEventListener('click', (e) => {
    if (!dropdown.contains(e.target) && e.target !== searchInput) {
      dropdown.classList.remove('active');
    }
  });
}

// ==========================================
// 4. LOAD FEATURED PRODUCTS
// ==========================================
let allProductsCache = [];

async function loadFeaturedProducts() {
  const container = document.getElementById('featuredProductsGrid');
  if (!container) return;

  container.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-muted);"><i class="fa-solid fa-gear fa-spin" style="font-size: 2rem; color: var(--accent-cyan); margin-bottom: 12px;"></i><p>Loading certified turbine spare parts catalog...</p></div>';

  try {
    const res = await API.getProducts();
    if (!res.success) throw new Error(res.message);

    allProductsCache = res.data;
    renderProductsList(allProductsCache, container);

  } catch (err) {
    console.error('Error loading products:', err);
    container.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: var(--accent-red); padding: 40px;">Failed to load catalog spare parts. Please check server connection.</div>';
  }
}

function filterProductsBySection(sectionKey) {
  const container = document.getElementById('featuredProductsGrid');
  if (!container) return;

  if (sectionKey === 'all') {
    renderProductsList(allProductsCache, container);
  } else {
    const filtered = allProductsCache.filter(p => p.turbineSection === sectionKey);
    renderProductsList(filtered.length > 0 ? filtered : allProductsCache, container);
  }

  // Smooth scroll down to catalog showcase
  const catalogEl = document.getElementById('catalogShowcase');
  if (catalogEl) {
    catalogEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function renderProductsList(products, container) {
  if (products.length === 0) {
    container.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-muted);">No spare parts found matching the selected filter.</div>';
    return;
  }

  container.innerHTML = products.map(product => {
    const isLowStock = product.stock <= 10;
    const stockClass = product.stock > 0 ? (isLowStock ? 'low-stock' : 'in-stock') : 'out-stock';
    const stockText = product.stock > 0 ? `${product.stock} in stock` : 'Lead time 1-2 wks';

    return `
      <div class="product-card" id="part-${product.id}">
        <div class="product-img-wrap">
          <img src="${product.image}" alt="${product.name}" loading="lazy">
          <div class="product-badges-top">
            <span class="badge-oem">${product.oemManufacturer}</span>
            <span class="badge-stock ${stockClass}">
              <i class="fa-solid fa-circle" style="font-size: 6px;"></i> ${stockText}
            </span>
          </div>
          <div class="product-quick-actions">
            <button class="quick-action-btn" title="Technical Quick View" onclick="openProductQuickView('${product.id}')">
              <i class="fa-solid fa-eye"></i>
            </button>
            <button class="quick-action-btn" title="Add to RFQ List" onclick="addToRfqDirect('${product.id}')">
              <i class="fa-solid fa-file-invoice"></i>
            </button>
          </div>
        </div>

        <div class="product-body">
          <div class="product-part-numbers">
            <span class="part-tt-no">${product.partNumber}</span>
            <span class="part-oem-no">OEM: ${product.oemPartNumber}</span>
          </div>

          <h3 class="product-title" title="${product.name}">${product.name}</h3>

          <div class="product-compatible-tag">
            <i class="fa-solid fa-check" style="color: var(--accent-cyan); margin-right: 4px;"></i>
            Fits: ${(product.compatibleTurbines || []).slice(0, 2).join(', ')}${(product.compatibleTurbines && product.compatibleTurbines.length > 2) ? '...' : ''}
          </div>

          <div class="product-footer">
            <div class="product-price-wrap">
              <span class="price-label">B2B Net Price</span>
              <span class="price-value">₹${product.price.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
            </div>

            <div class="product-btn-group">
              <button class="btn btn-secondary btn-card-cart" title="Quick Technical Specs" onclick="openProductQuickView('${product.id}')">
                Specs
              </button>
              <button class="btn btn-primary btn-card-cart" onclick="Cart.add({id: '${product.id}', name: '${product.name.replace(/'/g, "\\'")}', partNumber: '${product.partNumber}', price: ${product.price}, image: '${product.image}'})">
                <i class="fa-solid fa-cart-plus"></i> Add
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// ==========================================
// 5. CATEGORIES SHOWCASE
// ==========================================
async function loadCategoriesShowcase() {
  const container = document.getElementById('categoriesGrid');
  if (!container) return;

  try {
    const res = await API.getCategories();
    if (!res.success) return;

    container.innerHTML = res.data.map(cat => `
      <div class="category-card" onclick="window.location.href='/catalog.html?category=${cat.id}'">
        <div class="category-card-top">
          <div class="category-card-icon">
            <i class="fa-solid ${cat.icon || 'fa-gear'}"></i>
          </div>
          <span class="category-count-badge">${cat.liveCount || cat.count} Parts</span>
        </div>
        <div>
          <h3 class="category-title">${cat.name}</h3>
          <p class="category-desc">${cat.description}</p>
        </div>
        <div class="category-explore-link">
          Explore Category <i class="fa-solid fa-arrow-right"></i>
        </div>
      </div>
    `).join('');

  } catch (err) {
    console.error('Error loading categories:', err);
  }
}

// ==========================================
// 6. OEM CROSS-REFERENCE FAST LOOKUP
// ==========================================
function setupCrossReferenceSearch() {
  const input = document.getElementById('crossRefInput');
  const btn = document.getElementById('crossRefBtn');
  const tagBtns = document.querySelectorAll('.cross-tag-btn');

  function doLookup(query) {
    if (!query) return;
    window.location.href = `/catalog.html?search=${encodeURIComponent(query)}`;
  }

  if (btn && input) {
    btn.addEventListener('click', () => doLookup(input.value.trim()));
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') doLookup(input.value.trim());
    });
  }

  tagBtns.forEach(tag => {
    tag.addEventListener('click', () => {
      doLookup(tag.dataset.code);
    });
  });
}

// ==========================================
// 7. PRODUCT QUICK VIEW MODAL
// ==========================================
window.openProductQuickView = async function(productId) {
  let modal = document.getElementById('productQuickModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'productQuickModal';
    modal.className = 'modal-backdrop';
    document.body.appendChild(modal);
  }

  modal.innerHTML = `
    <div class="modal-window">
      <div class="modal-header">
        <h3 style="font-size: 1.15rem; display: flex; align-items: center; gap: 8px;">
          <i class="fa-solid fa-circle-info" style="color: var(--accent-cyan);"></i> Technical Specification Sheet
        </h3>
        <button class="close-btn" onclick="document.getElementById('productQuickModal').classList.remove('active')">&times;</button>
      </div>
      <div class="modal-body" id="quickModalBody">
        <div style="text-align: center; padding: 40px;"><i class="fa-solid fa-spinner fa-spin" style="font-size: 2rem; color: var(--accent-cyan);"></i></div>
      </div>
    </div>
  `;

  modal.classList.add('active');

  try {
    const res = await API.getProduct(productId);
    if (!res.success) throw new Error(res.message);

    const product = res.data;
    const body = document.getElementById('quickModalBody');

    const specsHtml = product.specs ? Object.entries(product.specs).map(([k, v]) => `
      <tr>
        <th>${k}</th>
        <td>${v}</td>
      </tr>
    `).join('') : '<tr><td colspan="2">Standard OEM specifications apply</td></tr>';

    const crossHtml = (product.crossReferences || []).map(c => `
      <tr style="border-bottom: 1px solid var(--border-light);">
        <td style="padding: 6px 10px; font-weight: 600;">${c.manufacturer}</td>
        <td style="padding: 6px 10px; font-family: var(--font-mono); color: var(--accent-cyan);">${c.partNo}</td>
        <td style="padding: 6px 10px; font-size: 0.8rem; color: var(--text-muted);">${c.type}</td>
      </tr>
    `).join('');

    const certBadges = (product.certifications || []).map(cert => `
      <span style="background: rgba(0, 229, 255, 0.1); border: 1px solid rgba(0, 229, 255, 0.3); color: var(--accent-cyan); font-size: 0.75rem; padding: 3px 8px; border-radius: var(--radius-sm);"><i class="fa-solid fa-certificate"></i> ${cert}</span>
    `).join('');

    body.innerHTML = `
      <div class="modal-product-layout">
        <div>
          <img src="${product.image}" alt="${product.name}" class="modal-product-img">
          <div style="margin-top: 14px; display: flex; flex-direction: column; gap: 8px;">
            <a href="/api/products/${product.id}/datasheet" target="_blank" class="btn btn-secondary" style="width: 100%;">
              <i class="fa-solid fa-file-pdf" style="color: var(--accent-amber);"></i> Printable Datasheet (PDF)
            </a>
            <button class="btn btn-primary" style="width: 100%;" onclick="Cart.add({id: '${product.id}', name: '${product.name.replace(/'/g, "\\'")}', partNumber: '${product.partNumber}', price: ${product.price}, image: '${product.image}'}); document.getElementById('productQuickModal').classList.remove('active');">
              <i class="fa-solid fa-cart-plus"></i> Add to Procurement Cart
            </button>
          </div>
        </div>

        <div>
          <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 8px;">
            <span class="badge-oem">${product.oemManufacturer}</span>
            <span style="background: rgba(245, 158, 11, 0.15); color: var(--accent-amber); font-size: 0.75rem; font-weight: 700; padding: 3px 8px; border-radius: var(--radius-sm);">${product.condition || 'Certified Replacement'}</span>
          </div>

          <h2 style="font-size: 1.35rem; margin-bottom: 6px;">${product.name}</h2>
          <div style="font-family: var(--font-mono); font-size: 0.88rem; color: var(--accent-cyan); margin-bottom: 12px;">
            TurbineTek P/N: <strong>${product.partNumber}</strong> | OEM P/N: ${product.oemPartNumber}
          </div>

          <p style="color: var(--text-secondary); font-size: 0.9rem; line-height: 1.6; margin-bottom: 16px;">
            ${product.fullDesc || product.shortDesc}
          </p>

          <div style="display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 16px;">
            ${certBadges}
          </div>

          <h4 style="font-size: 0.9rem; text-transform: uppercase; color: var(--text-muted); margin-bottom: 8px;">Technical Parameters</h4>
          <table class="specs-table">
            <tbody>${specsHtml}</tbody>
          </table>

          <h4 style="font-size: 0.9rem; text-transform: uppercase; color: var(--text-muted); margin-top: 18px; margin-bottom: 8px;">Cross-Reference Interchanges</h4>
          <table style="width: 100%; border-collapse: collapse; font-size: 0.82rem; background: rgba(0,0,0,0.2); border-radius: var(--radius-sm);">
            <tbody>${crossHtml}</tbody>
          </table>

          <h4 style="font-size: 0.9rem; text-transform: uppercase; color: var(--text-muted); margin-top: 18px; margin-bottom: 8px;">Verified Equipment Compatibility</h4>
          <div style="display: flex; gap: 6px; flex-wrap: wrap;">
            ${(product.compatibleTurbines || []).map(t => `<span style="background: rgba(255,255,255,0.06); padding: 4px 10px; border-radius: var(--radius-full); font-size: 0.78rem; font-weight: 600;">${t}</span>`).join('')}
          </div>
        </div>
      </div>
    `;

  } catch (err) {
    console.error('Error opening quick view:', err);
  }
};

window.addToRfqDirect = function(productId) {
  const product = allProductsCache.find(p => p.id === productId);
  if (!product) return;
  Cart.add(product, 1);
  Cart.showToast(`Part ${product.partNumber} added. Click 'Convert to RFQ' in cart.`);
};

// ==========================================
// 8. CHECKOUT & RFQ CONVERSION MODAL
// ==========================================
function setupCheckoutModal() {
  const checkoutBtn = document.getElementById('cartCheckoutBtn');
  const rfqConvertBtn = document.getElementById('cartRfqBtn');

  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', () => {
      if (Cart.items.length === 0) {
        Cart.showToast('Please add items to cart before proceeding.', 'error');
        return;
      }
      openB2BOrderModal();
    });
  }

  if (rfqConvertBtn) {
    rfqConvertBtn.addEventListener('click', () => {
      if (Cart.items.length === 0) {
        Cart.showToast('Please add items to cart before requesting quotation.', 'error');
        return;
      }
      openQuickRfqModal();
    });
  }
}

function openB2BOrderModal() {
  Cart.closeDrawer();
  let modal = document.getElementById('b2bOrderModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'b2bOrderModal';
    modal.className = 'modal-backdrop';
    document.body.appendChild(modal);
  }

  const subtotal = Cart.getSubtotal();
  const freight = subtotal > 400000 ? 0 : 25000.00;
  const grandTotal = subtotal + freight;

  modal.innerHTML = `
    <div class="modal-window" style="max-width: 600px;">
      <div class="modal-header">
        <h3 style="font-size: 1.15rem; display: flex; align-items: center; gap: 8px;">
          <i class="fa-solid fa-lock" style="color: var(--accent-cyan);"></i> Fast B2B Checkout / Purchase Order
        </h3>
        <button class="close-btn" onclick="document.getElementById('b2bOrderModal').classList.remove('active')">&times;</button>
      </div>
      <div class="modal-body">
        <div style="background: rgba(0, 229, 255, 0.08); border: 1px solid rgba(0, 229, 255, 0.2); border-radius: var(--radius-md); padding: 14px; margin-bottom: 20px;">
          <div style="display: flex; justify-content: space-between; font-weight: 600;">
            <span>Items (${Cart.getCount()} components):</span>
            <span class="mono">₹${subtotal.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
          </div>
          <div style="display: flex; justify-content: space-between; color: var(--text-muted); font-size: 0.85rem; margin-top: 4px;">
            <span>Industrial Freight:</span>
            <span>${freight === 0 ? 'FREE Freight' : '₹' + freight.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-weight: 700; font-size: 1.1rem; color: var(--accent-cyan); margin-top: 8px; border-top: 1px solid var(--border-light); padding-top: 6px;">
            <span>Total Payable:</span>
            <span class="mono">₹${grandTotal.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
          </div>
        </div>

        <form id="orderForm" style="display: flex; flex-direction: column; gap: 14px;">
          <div>
            <label style="display: block; font-size: 0.8rem; font-weight: 600; margin-bottom: 4px;">Company Name *</label>
            <input type="text" class="form-control" name="company" required placeholder="e.g. Siemens Energy Plant Services LLC">
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
            <div>
              <label style="display: block; font-size: 0.8rem; font-weight: 600; margin-bottom: 4px;">Contact Engineer *</label>
              <input type="text" class="form-control" name="contactName" required placeholder="e.g. Alex Morgan">
            </div>
            <div>
              <label style="display: block; font-size: 0.8rem; font-weight: 600; margin-bottom: 4px;">Work Email *</label>
              <input type="email" class="form-control" name="email" required placeholder="name@company.com">
            </div>
          </div>
          <div>
            <label style="display: block; font-size: 0.8rem; font-weight: 600; margin-bottom: 4px;">Plant Delivery Address *</label>
            <input type="text" class="form-control" name="address" required placeholder="Plant Bay 4, Industrial Harbor Parkway, City, Country">
          </div>
          <div>
            <label style="display: block; font-size: 0.8rem; font-weight: 600; margin-bottom: 4px;">Payment Method</label>
            <select class="form-control" name="paymentMethod">
              <option value="B2B Net 30 Commercial Invoice (PO)">B2B Net 30 Commercial Invoice (Official Purchase Order)</option>
              <option value="Corporate Credit Card / Wire Transfer">Corporate Wire Transfer / Bank TT</option>
              <option value="Letter of Credit (L/C)">Irrevocable Letter of Credit (L/C at sight)</option>
            </select>
          </div>
          <div>
            <label style="display: block; font-size: 0.8rem; font-weight: 600; margin-bottom: 4px;">Special Delivery or Packaging Instructions</label>
            <textarea class="form-control" name="notes" rows="2" placeholder="e.g. Require EN 10204 3.1 material test certificates with dispatch."></textarea>
          </div>
          <button type="submit" class="btn btn-primary" style="margin-top: 10px; width: 100%;">
            <i class="fa-solid fa-check-circle"></i> Confirm & Transmit Purchase Order
          </button>
        </form>
      </div>
    </div>
  `;

  modal.classList.add('active');

  const orderForm = document.getElementById('orderForm');
  orderForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(orderForm);
    const orderData = {
      customer: {
        company: formData.get('company'),
        contactName: formData.get('contactName'),
        email: formData.get('email'),
        address: formData.get('address')
      },
      paymentMethod: formData.get('paymentMethod'),
      notes: formData.get('notes'),
      items: Cart.items
    };

    try {
      const res = await API.submitOrder(orderData);
      if (!res.success) throw new Error(res.message);

      modal.classList.remove('active');
      Cart.clear();
      Cart.showToast(`Order #${res.data.orderId} successfully confirmed!`);

      // Show Confirmation Modal
      alert(`🎉 Purchase Order ${res.data.orderId} confirmed successfully!\n\nA commercial confirmation has been generated and dispatched to ${res.data.customer.email}.\n\nItems will be dispatched from our Central Logistics Hub.`);

    } catch (err) {
      alert('Error placing order: ' + err.message);
    }
  });
}

function openQuickRfqModal() {
  Cart.closeDrawer();
  let modal = document.getElementById('quickRfqModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'quickRfqModal';
    modal.className = 'modal-backdrop';
    document.body.appendChild(modal);
  }

  modal.innerHTML = `
    <div class="modal-window" style="max-width: 620px;">
      <div class="modal-header">
        <h3 style="font-size: 1.15rem; display: flex; align-items: center; gap: 8px;">
          <i class="fa-solid fa-file-invoice" style="color: var(--accent-amber);"></i> Generate Formal B2B RFQ Quotation
        </h3>
        <button class="close-btn" onclick="document.getElementById('quickRfqModal').classList.remove('active')">&times;</button>
      </div>
      <div class="modal-body">
        <p style="font-size: 0.88rem; color: var(--text-secondary); margin-bottom: 16px;">
          Convert your active procurement items into an official binding quotation with volume discounts and lead times.
        </p>
        <form id="rfqQuickForm" style="display: flex; flex-direction: column; gap: 14px;">
          <div>
            <label style="display: block; font-size: 0.8rem; font-weight: 600; margin-bottom: 4px;">Company / Plant Operator *</label>
            <input type="text" class="form-control" name="company" required placeholder="e.g. Duke Energy Power Plant #3">
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
            <div>
              <label style="display: block; font-size: 0.8rem; font-weight: 600; margin-bottom: 4px;">Procurement Officer *</label>
              <input type="text" class="form-control" name="contactName" required placeholder="e.g. Sarah Jenkins">
            </div>
            <div>
              <label style="display: block; font-size: 0.8rem; font-weight: 600; margin-bottom: 4px;">Official Email *</label>
              <input type="email" class="form-control" name="email" required placeholder="procurement@company.com">
            </div>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
            <div>
              <label style="display: block; font-size: 0.8rem; font-weight: 600; margin-bottom: 4px;">Target Turbine / Engine</label>
              <input type="text" class="form-control" name="turbineModel" placeholder="e.g. GE LM2500+ / Jenbacher J320">
            </div>
            <div>
              <label style="display: block; font-size: 0.8rem; font-weight: 600; margin-bottom: 4px;">Outage / Delivery Date</label>
              <input type="date" class="form-control" name="requiredDelivery" value="${new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]}">
            </div>
          </div>
          <div>
            <label style="display: block; font-size: 0.8rem; font-weight: 600; margin-bottom: 4px;">RFQ Urgency</label>
            <select class="form-control" name="urgency">
              <option value="Standard (Routine Spare Stocking)">Standard (Routine Spare Stocking)</option>
              <option value="Urgent (Scheduled Maintenance Outage in 14 Days)">Urgent (Scheduled Maintenance Outage)</option>
              <option value="Critical AOG / Plant Trip Emergency">Critical AOG / Plant Emergency</option>
            </select>
          </div>
          <div>
            <label style="display: block; font-size: 0.8rem; font-weight: 600; margin-bottom: 4px;">Notes & Certification Requirements</label>
            <textarea class="form-control" name="notes" rows="2" placeholder="e.g. Require EN 10204 3.1 certs and certificate of origin."></textarea>
          </div>
          <button type="submit" class="btn btn-amber" style="margin-top: 10px; width: 100%;">
            <i class="fa-solid fa-paper-plane"></i> Generate & Submit Official RFQ
          </button>
        </form>
      </div>
    </div>
  `;

  modal.classList.add('active');

  const rfqForm = document.getElementById('rfqQuickForm');
  rfqForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(rfqForm);
    const rfqData = {
      customer: {
        company: formData.get('company'),
        contactName: formData.get('contactName'),
        email: formData.get('email')
      },
      turbineModel: formData.get('turbineModel'),
      requiredDelivery: formData.get('requiredDelivery'),
      urgency: formData.get('urgency'),
      notes: formData.get('notes'),
      items: Cart.items
    };

    try {
      const res = await API.submitRfq(rfqData);
      if (!res.success) throw new Error(res.message);

      modal.classList.remove('active');
      Cart.showToast(`Quotation ${res.data.id} created! Total: ₹${res.data.estimatedTotal.toLocaleString('en-IN')}`);

      alert(`📄 RFQ Inquiry Generated Successfully!\n\nReference ID: ${res.data.id}\nCalculated B2B Total: ₹${res.data.estimatedTotal.toLocaleString('en-IN')} (Includes ${res.data.discountRate} volume tier)\nValid Until: ${res.data.validUntil}\n\nYou can track this under the RFQ Management page.`);
      window.location.href = `/rfq.html?id=${res.data.id}`;

    } catch (err) {
      alert('Error creating RFQ: ' + err.message);
    }
  });
}
