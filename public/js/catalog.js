/**
 * TurbineTek Catalog Page Engine
 * Handles faceted filtering, live URL parameters, grid/list view toggling, and search
 */

let catalogProducts = [];
let activeFilters = {
  search: '',
  category: 'all',
  manufacturer: 'all',
  turbineType: 'all',
  turbineModel: 'all',
  turbineSection: 'all',
  inStock: false,
  sort: 'popular'
};

document.addEventListener('DOMContentLoaded', async () => {
  parseUrlParams();
  await loadFilterOptions();
  await fetchAndRenderCatalog();
  setupFilterEventListeners();
});

// Read initial filters from URL query parameters (e.g. from homepage finder)
function parseUrlParams() {
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has('search')) activeFilters.search = urlParams.get('search');
  if (urlParams.has('category')) activeFilters.category = urlParams.get('category');
  if (urlParams.has('manufacturer')) activeFilters.manufacturer = urlParams.get('manufacturer');
  if (urlParams.has('turbineType')) activeFilters.turbineType = urlParams.get('turbineType');
  if (urlParams.has('turbineModel')) activeFilters.turbineModel = urlParams.get('turbineModel');
  if (urlParams.has('turbineSection')) activeFilters.turbineSection = urlParams.get('turbineSection');
}

async function loadFilterOptions() {
  try {
    // 1. Categories
    const catRes = await API.getCategories();
    if (catRes.success) {
      const catContainer = document.getElementById('filterCategoriesList');
      if (catContainer) {
        catContainer.innerHTML = `
          <label class="filter-radio-label ${activeFilters.category === 'all' ? 'active' : ''}">
            <input type="radio" name="filterCategory" value="all" ${activeFilters.category === 'all' ? 'checked' : ''}>
            <span>All Categories</span>
          </label>
        ` + catRes.data.map(cat => `
          <label class="filter-radio-label ${activeFilters.category === cat.id ? 'active' : ''}">
            <input type="radio" name="filterCategory" value="${cat.id}" ${activeFilters.category === cat.id ? 'checked' : ''}>
            <span>${cat.name}</span>
            <span class="count">${cat.liveCount || cat.count}</span>
          </label>
        `).join('');
      }
    }

    // 2. Manufacturers
    const mfrRes = await API.getManufacturers();
    if (mfrRes.success) {
      const mfrSelect = document.getElementById('filterManufacturerSelect');
      if (mfrSelect) {
        mfrSelect.innerHTML = '<option value="all">All Manufacturers</option>' +
          mfrRes.data.map(m => `<option value="${m.name}" ${activeFilters.manufacturer === m.name ? 'selected' : ''}>${m.name}</option>`).join('');
      }
    }

    // 3. Turbines
    const turbRes = await API.getTurbines();
    if (turbRes.success) {
      const modelSelect = document.getElementById('filterModelSelect');
      if (modelSelect) {
        const allModels = [];
        turbRes.data.forEach(t => {
          (t.models || []).forEach(m => allModels.push({ model: m, mfr: t.manufacturer }));
        });
        modelSelect.innerHTML = '<option value="all">All Turbine Models</option>' +
          allModels.map(item => `<option value="${item.model}" ${activeFilters.turbineModel === item.model ? 'selected' : ''}>${item.model} (${item.mfr})</option>`).join('');
      }
    }

    // Sync search input if present
    const searchInput = document.getElementById('catalogSearchInput');
    if (searchInput && activeFilters.search) {
      searchInput.value = activeFilters.search;
    }

  } catch (err) {
    console.error('Error loading filter options:', err);
  }
}

async function fetchAndRenderCatalog() {
  const container = document.getElementById('catalogProductsGrid');
  const countEl = document.getElementById('catalogResultCount');
  if (!container) return;

  container.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 60px;"><i class="fa-solid fa-spinner fa-spin" style="font-size: 2.2rem; color: var(--accent-cyan); margin-bottom: 16px;"></i><p>Filtering spare parts database...</p></div>';

  try {
    const params = {};
    if (activeFilters.search) params.search = activeFilters.search;
    if (activeFilters.category !== 'all') params.category = activeFilters.category;
    if (activeFilters.manufacturer !== 'all') params.manufacturer = activeFilters.manufacturer;
    if (activeFilters.turbineType !== 'all') params.turbineType = activeFilters.turbineType;
    if (activeFilters.turbineModel !== 'all') params.turbineModel = activeFilters.turbineModel;
    if (activeFilters.turbineSection !== 'all') params.turbineSection = activeFilters.turbineSection;
    if (activeFilters.inStock) params.inStock = 'true';
    if (activeFilters.sort) params.sort = activeFilters.sort;

    const res = await API.getProducts(params);
    if (!res.success) throw new Error(res.message);

    catalogProducts = res.data;
    if (countEl) countEl.textContent = `${res.total} Spare Parts Found`;

    renderCatalogGrid(catalogProducts, container);

  } catch (err) {
    console.error('Error fetching catalog:', err);
    container.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: var(--accent-red); padding: 40px;">Error loading products.</div>';
  }
}

function renderCatalogGrid(products, container) {
  if (products.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 60px; background: var(--bg-card); border-radius: var(--radius-lg); border: 1px solid var(--border-light);">
        <i class="fa-solid fa-boxes-packing" style="font-size: 3rem; color: var(--accent-amber); margin-bottom: 16px; opacity: 0.8;"></i>
        <h3 style="margin-bottom: 8px;">No Direct Stock Match Found</h3>
        <p style="color: var(--text-secondary); max-width: 500px; margin: 0 auto 20px; font-size: 0.9rem;">
          We carry thousands of unlisted OEM surplus parts and rapid manufacturing capabilities. Request a formal quotation and our engineering desk will respond in under 2 hours.
        </p>
        <button class="btn btn-secondary" onclick="resetFilters()">Reset All Filters</button>
        <a href="/rfq.html" class="btn btn-primary" style="margin-left: 10px;">Request Sourcing RFQ</a>
      </div>
    `;
    return;
  }

  container.innerHTML = products.map(product => {
    const isLow = product.stock <= 10;
    const stockClass = product.stock > 0 ? (isLow ? 'low-stock' : 'in-stock') : 'out-stock';
    const stockText = product.stock > 0 ? `${product.stock} Units in Central Hub` : 'Backordered (1-2 Wks)';

    return `
      <div class="product-card">
        <div class="product-img-wrap">
          <img src="${product.image}" alt="${product.name}" loading="lazy">
          <div class="product-badges-top">
            <span class="badge-oem">${product.oemManufacturer}</span>
            <span class="badge-stock ${stockClass}">
              <i class="fa-solid fa-circle" style="font-size: 6px;"></i> ${stockText}
            </span>
          </div>
          <div class="product-quick-actions">
            <button class="quick-action-btn" title="Detailed Technical View" onclick="openProductQuickView('${product.id}')">
              <i class="fa-solid fa-eye"></i>
            </button>
            <a href="/api/products/${product.id}/datasheet" target="_blank" class="quick-action-btn" title="Download Datasheet PDF">
              <i class="fa-solid fa-file-pdf"></i>
            </a>
          </div>
        </div>

        <div class="product-body">
          <div class="product-part-numbers">
            <span class="part-tt-no">${product.partNumber}</span>
            <span class="part-oem-no">OEM: ${product.oemPartNumber}</span>
          </div>

          <h3 class="product-title" title="${product.name}">${product.name}</h3>

          <p style="font-size: 0.8rem; color: var(--text-secondary); line-height: 1.4; margin-bottom: 12px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
            ${product.shortDesc}
          </p>

          <div class="product-compatible-tag">
            <i class="fa-solid fa-check" style="color: var(--accent-cyan); margin-right: 4px;"></i>
            Fits: ${(product.compatibleTurbines || []).join(', ')}
          </div>

          <div class="product-footer">
            <div class="product-price-wrap">
              <span class="price-label">Net Unit Price</span>
              <span class="price-value">₹${product.price.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
            </div>

            <div class="product-btn-group">
              <button class="btn btn-secondary btn-card-cart" onclick="openProductQuickView('${product.id}')">
                Specs
              </button>
              <button class="btn btn-primary btn-card-cart" onclick="Cart.add({id: '${product.id}', name: '${product.name.replace(/'/g, "\\'")}', partNumber: '${product.partNumber}', price: ${product.price}, image: '${product.image}'})">
                <i class="fa-solid fa-cart-plus"></i> Buy / RFQ
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function updateBrandPillsUI(selectedMfr) {
  const pills = document.querySelectorAll('.brand-filter-pill');
  pills.forEach(p => {
    const mfr = p.getAttribute('data-mfr');
    if (!selectedMfr || selectedMfr === 'all') {
      p.classList.toggle('active', mfr === 'all');
    } else {
      const match = mfr && (mfr.toLowerCase() === selectedMfr.toLowerCase() || mfr.toLowerCase().includes(selectedMfr.toLowerCase()) || selectedMfr.toLowerCase().includes(mfr.toLowerCase()));
      p.classList.toggle('active', !!match);
    }
  });
}

function setupFilterEventListeners() {
  // Brand quick filter pills
  const brandPillsBar = document.getElementById('catalogBrandPillsBar');
  if (brandPillsBar) {
    brandPillsBar.addEventListener('click', (e) => {
      const pill = e.target.closest('.brand-filter-pill');
      if (!pill) return;
      const mfr = pill.getAttribute('data-mfr');
      activeFilters.manufacturer = mfr;
      updateBrandPillsUI(mfr);

      const mfrSelect = document.getElementById('filterManufacturerSelect');
      if (mfrSelect) {
        // Find matching option
        let found = false;
        for (let opt of mfrSelect.options) {
          if (opt.value.toLowerCase() === mfr.toLowerCase()) {
            mfrSelect.value = opt.value;
            found = true;
            break;
          }
        }
        if (!found && mfr === 'all') mfrSelect.value = 'all';
      }

      fetchAndRenderCatalog();
    });

    // Initial sync
    if (activeFilters.manufacturer) {
      updateBrandPillsUI(activeFilters.manufacturer);
    }
  }

  // Category Radio buttons
  const catContainer = document.getElementById('filterCategoriesList');
  if (catContainer) {
    catContainer.addEventListener('change', (e) => {
      if (e.target.name === 'filterCategory') {
        activeFilters.category = e.target.value;
        document.querySelectorAll('.filter-radio-label').forEach(l => l.classList.remove('active'));
        e.target.closest('label').classList.add('active');
        fetchAndRenderCatalog();
      }
    });
  }

  // Manufacturer Select
  const mfrSelect = document.getElementById('filterManufacturerSelect');
  if (mfrSelect) {
    mfrSelect.addEventListener('change', (e) => {
      activeFilters.manufacturer = e.target.value;
      updateBrandPillsUI(e.target.value);
      fetchAndRenderCatalog();
    });
  }

  // Turbine Model Select
  const modelSelect = document.getElementById('filterModelSelect');
  if (modelSelect) {
    modelSelect.addEventListener('change', (e) => {
      activeFilters.turbineModel = e.target.value;
      fetchAndRenderCatalog();
    });
  }

  // Section Select
  const sectionSelect = document.getElementById('filterSectionSelect');
  if (sectionSelect) {
    sectionSelect.addEventListener('change', (e) => {
      activeFilters.turbineSection = e.target.value;
      fetchAndRenderCatalog();
    });
  }

  // In Stock Checkbox
  const inStockCheckbox = document.getElementById('filterInStock');
  if (inStockCheckbox) {
    inStockCheckbox.addEventListener('change', (e) => {
      activeFilters.inStock = e.target.checked;
      fetchAndRenderCatalog();
    });
  }

  // Search input
  const searchInput = document.getElementById('catalogSearchInput');
  const searchBtn = document.getElementById('catalogSearchBtn');
  if (searchInput && searchBtn) {
    const doSearch = () => {
      activeFilters.search = searchInput.value.trim();
      fetchAndRenderCatalog();
    };
    searchBtn.addEventListener('click', doSearch);
    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') doSearch();
    });
  }

  // Sort dropdown
  const sortSelect = document.getElementById('catalogSortSelect');
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      activeFilters.sort = e.target.value;
      fetchAndRenderCatalog();
    });
  }

  // Reset Filters Button
  const resetBtn = document.getElementById('resetFiltersBtn');
  if (resetBtn) {
    resetBtn.addEventListener('click', resetFilters);
  }
}

function resetFilters() {
  activeFilters = {
    search: '',
    category: 'all',
    manufacturer: 'all',
    turbineType: 'all',
    turbineModel: 'all',
    turbineSection: 'all',
    inStock: false,
    sort: 'popular'
  };

  const searchInput = document.getElementById('catalogSearchInput');
  if (searchInput) searchInput.value = '';

  const mfrSelect = document.getElementById('filterManufacturerSelect');
  if (mfrSelect) mfrSelect.value = 'all';

  const modelSelect = document.getElementById('filterModelSelect');
  if (modelSelect) modelSelect.value = 'all';

  const sectionSelect = document.getElementById('filterSectionSelect');
  if (sectionSelect) sectionSelect.value = 'all';

  const inStockCheckbox = document.getElementById('filterInStock');
  if (inStockCheckbox) inStockCheckbox.checked = false;

  const catRadios = document.querySelectorAll('input[name="filterCategory"]');
  catRadios.forEach(r => {
    if (r.value === 'all') r.checked = true;
  });
  document.querySelectorAll('.filter-radio-label').forEach(l => l.classList.remove('active'));
  const allCatLabel = document.querySelector('input[name="filterCategory"][value="all"]')?.closest('label');
  if (allCatLabel) allCatLabel.classList.add('active');

  fetchAndRenderCatalog();
}
