const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Helper to read JSON data safely
const readJson = (file) => {
  const filePath = path.join(__dirname, 'data', file);
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error(`Error reading ${file}:`, err.message);
    return [];
  }
};

// Helper to write JSON data safely
const writeJson = (file, data) => {
  const filePath = path.join(__dirname, 'data', file);
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error(`Error writing ${file}:`, err.message);
    return false;
  }
};

// ==========================================
// 1. PRODUCTS API
// ==========================================

// GET /api/products
app.get('/api/products', (req, res) => {
  let products = readJson('products.json');
  const { search, category, manufacturer, turbineType, turbineModel, turbineSection, inStock, sort } = req.query;

  // Keyword search (name, partNumber, oemPartNumber, crossReferences, description)
  if (search && search.trim() !== '') {
    const query = search.trim().toLowerCase();
    products = products.filter(p => {
      const matchName = p.name && p.name.toLowerCase().includes(query);
      const matchPart = p.partNumber && p.partNumber.toLowerCase().includes(query);
      const matchOem = p.oemPartNumber && p.oemPartNumber.toLowerCase().includes(query);
      const matchDesc = p.shortDesc && p.shortDesc.toLowerCase().includes(query);
      const matchCross = p.crossReferences && p.crossReferences.some(c => 
        (c.partNo && c.partNo.toLowerCase().includes(query)) || 
        (c.manufacturer && c.manufacturer.toLowerCase().includes(query))
      );
      const matchTurbine = p.compatibleTurbines && p.compatibleTurbines.some(t => t.toLowerCase().includes(query));
      return matchName || matchPart || matchOem || matchDesc || matchCross || matchTurbine;
    });
  }

  // Filter: Category
  if (category && category !== 'all') {
    products = products.filter(p => p.category === category);
  }

  // Filter: Manufacturer / Car Brand
  if (manufacturer && manufacturer !== 'all') {
    const mQuery = manufacturer.toLowerCase();
    products = products.filter(p => {
      const matchOem = p.oemManufacturer && p.oemManufacturer.toLowerCase().includes(mQuery);
      const matchBrand = p.carBrand && p.carBrand.toLowerCase().includes(mQuery);
      const matchCross = p.crossReferences && p.crossReferences.some(c => c.manufacturer && c.manufacturer.toLowerCase().includes(mQuery));
      return matchOem || matchBrand || matchCross;
    });
  }

  // Filter: Turbine Type
  if (turbineType && turbineType !== 'all') {
    products = products.filter(p => p.turbineType && p.turbineType.toLowerCase() === turbineType.toLowerCase());
  }

  // Filter: Specific Turbine Model (e.g. "LM2500", "JMS 320 GS")
  if (turbineModel && turbineModel !== 'all') {
    products = products.filter(p => p.compatibleTurbines && p.compatibleTurbines.some(m => m.toLowerCase().includes(turbineModel.toLowerCase())));
  }

  // Filter: Turbine Section (intake, compressor, combustor, turbine, exhaust, auxiliaries, bearings)
  if (turbineSection && turbineSection !== 'all') {
    products = products.filter(p => p.turbineSection && p.turbineSection.toLowerCase() === turbineSection.toLowerCase());
  }

  // Filter: In Stock Only
  if (inStock === 'true') {
    products = products.filter(p => p.stock > 0);
  }

  // Sorting
  if (sort === 'price-asc') {
    products.sort((a, b) => a.price - b.price);
  } else if (sort === 'price-desc') {
    products.sort((a, b) => b.price - a.price);
  } else if (sort === 'name-asc') {
    products.sort((a, b) => a.name.localeCompare(b.name));
  } else if (sort === 'stock-desc') {
    products.sort((a, b) => b.stock - a.stock);
  }

  res.json({
    success: true,
    total: products.length,
    data: products
  });
});

// GET /api/products/:id
app.get('/api/products/:id', (req, res) => {
  const products = readJson('products.json');
  const product = products.find(p => p.id === req.params.id);
  if (!product) {
    return res.status(404).json({ success: false, message: 'Product part not found' });
  }

  // Find related products (same category or compatible turbine)
  const related = products
    .filter(p => p.id !== product.id && (p.category === product.category || p.turbineSection === product.turbineSection))
    .slice(0, 4);

  res.json({
    success: true,
    data: product,
    related
  });
});

// POST /api/products (Admin create)
app.post('/api/products', (req, res) => {
  const products = readJson('products.json');
  const newProduct = {
    id: 'TT-' + Math.random().toString(36).substring(2, 7).toUpperCase(),
    ...req.body,
    createdAt: new Date().toISOString()
  };

  // Provide defaults if missing
  if (!newProduct.image) newProduct.image = '/images/blade.jpg';
  if (!newProduct.price) newProduct.price = 0;
  if (!newProduct.stock) newProduct.stock = 10;
  if (!newProduct.crossReferences) newProduct.crossReferences = [];
  if (!newProduct.compatibleTurbines) newProduct.compatibleTurbines = [];
  if (!newProduct.specs) newProduct.specs = {};
  if (!newProduct.certifications) newProduct.certifications = ['ISO 9001:2015'];

  products.unshift(newProduct);
  writeJson('products.json', products);

  res.status(201).json({ success: true, message: 'Part successfully added to inventory', data: newProduct });
});

// PUT /api/products/:id (Admin update)
app.put('/api/products/:id', (req, res) => {
  const products = readJson('products.json');
  const index = products.findIndex(p => p.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Product not found' });
  }

  products[index] = { ...products[index], ...req.body, updatedAt: new Date().toISOString() };
  writeJson('products.json', products);

  res.json({ success: true, message: 'Product updated successfully', data: products[index] });
});

// DELETE /api/products/:id (Admin delete)
app.delete('/api/products/:id', (req, res) => {
  let products = readJson('products.json');
  const exists = products.some(p => p.id === req.params.id);
  if (!exists) {
    return res.status(404).json({ success: false, message: 'Product not found' });
  }

  products = products.filter(p => p.id !== req.params.id);
  writeJson('products.json', products);

  res.json({ success: true, message: 'Product removed from catalog' });
});

// ==========================================
// 2. CATEGORIES, MANUFACTURERS & TURBINES
// ==========================================

app.get('/api/categories', (req, res) => {
  const categories = readJson('categories.json');
  const products = readJson('products.json');

  // Recalculate dynamic live counts
  const enriched = categories.map(cat => {
    const count = products.filter(p => p.category === cat.id).length;
    return { ...cat, liveCount: count };
  });

  res.json({ success: true, data: enriched });
});

app.get('/api/manufacturers', (req, res) => {
  const data = readJson('manufacturers.json');
  res.json({ success: true, data });
});

app.get('/api/turbines', (req, res) => {
  const data = readJson('turbines.json');
  res.json({ success: true, data });
});

// ==========================================
// 3. B2B RFQ (REQUEST FOR QUOTATION) API
// ==========================================

// POST /api/rfq
app.post('/api/rfq', (req, res) => {
  const { customer, items, turbineModel, requiredDelivery, urgency, notes } = req.body;

  if (!customer || !customer.email || !customer.company) {
    return res.status(400).json({ success: false, message: 'Company name and contact email are required for official B2B RFQs.' });
  }

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ success: false, message: 'At least one spare part item must be selected for the quotation.' });
  }

  const rfqs = readJson('rfqs.json');
  const rfqId = `RFQ-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

  let subtotal = 0;
  const processedItems = items.map(item => {
    const qty = parseInt(item.quantity) || 1;
    const price = parseFloat(item.unitPrice || item.price) || 0;
    const total = qty * price;
    subtotal += total;
    return {
      productId: item.productId || item.id,
      name: item.name,
      partNumber: item.partNumber,
      quantity: qty,
      unitPrice: price,
      totalPrice: total
    };
  });

  // Calculate standard industrial B2B discount tier (5% above ₹8,00,000, 10% above ₹25,00,000)
  let discountRate = 0;
  if (subtotal >= 2500000) discountRate = 0.10;
  else if (subtotal >= 800000) discountRate = 0.05;

  const discount = subtotal * discountRate;
  const estimatedTotal = subtotal - discount;

  const newRfq = {
    id: rfqId,
    createdAt: new Date().toISOString(),
    customer: {
      company: customer.company,
      contactName: customer.contactName || 'Procurement Officer',
      email: customer.email,
      phone: customer.phone || 'N/A',
      country: customer.country || 'Global',
      plantLocation: customer.plantLocation || 'Power Generation Facility'
    },
    turbineModel: turbineModel || 'General Inquiry',
    requiredDelivery: requiredDelivery || 'Prompt Dispatch',
    urgency: urgency || 'Standard (Stock Replenishment)',
    items: processedItems,
    subtotal,
    discount,
    discountRate: `${discountRate * 100}%`,
    estimatedTotal,
    status: 'Submitted',
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    notes: notes || 'Standard export packaging and material conformity certificate required.'
  };

  rfqs.unshift(newRfq);
  writeJson('rfqs.json', rfqs);

  res.status(201).json({
    success: true,
    message: 'Official B2B RFQ generated successfully. TurbineTek Engineering sales has received your request.',
    data: newRfq
  });
});

// GET /api/rfqs
app.get('/api/rfqs', (req, res) => {
  const rfqs = readJson('rfqs.json');
  res.json({ success: true, total: rfqs.length, data: rfqs });
});

// GET /api/rfqs/:id
app.get('/api/rfqs/:id', (req, res) => {
  const rfqs = readJson('rfqs.json');
  const found = rfqs.find(r => r.id === req.params.id);
  if (!found) return res.status(404).json({ success: false, message: 'RFQ not found' });
  res.json({ success: true, data: found });
});

// PUT /api/rfqs/:id/status
app.put('/api/rfqs/:id/status', (req, res) => {
  const rfqs = readJson('rfqs.json');
  const index = rfqs.findIndex(r => r.id === req.params.id);
  if (index === -1) return res.status(404).json({ success: false, message: 'RFQ not found' });

  const { status } = req.body;
  if (status) {
    rfqs[index].status = status;
    rfqs[index].updatedAt = new Date().toISOString();
  }
  writeJson('rfqs.json', rfqs);

  res.json({ success: true, message: `RFQ ${req.params.id} updated to ${status}`, data: rfqs[index] });
});

// ==========================================
// 4. ORDERS & DIRECT PURCHASE API
// ==========================================

// POST /api/orders (Instant PO or Direct Order)
app.post('/api/orders', (req, res) => {
  const { customer, items, paymentMethod, notes } = req.body;

  if (!customer || !customer.email || !customer.company) {
    return res.status(400).json({ success: false, message: 'Company information is required.' });
  }

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ success: false, message: 'Cart items cannot be empty.' });
  }

  const products = readJson('products.json');
  const orders = readJson('orders.json');

  let subtotal = 0;
  const processedItems = [];

  for (const item of items) {
    const product = products.find(p => p.id === (item.productId || item.id));
    const qty = parseInt(item.quantity) || 1;
    const price = product ? product.price : parseFloat(item.price || 0);
    const itemTotal = qty * price;
    subtotal += itemTotal;

    // Decrement stock in catalog if found
    if (product) {
      product.stock = Math.max(0, product.stock - qty);
    }

    processedItems.push({
      productId: item.productId || item.id,
      name: product ? product.name : item.name,
      partNumber: product ? product.partNumber : item.partNumber,
      quantity: qty,
      price,
      total: itemTotal
    });
  }

  const shipping = subtotal > 400000 ? 0 : 25000.00; // Free industrial freight over ₹4 Lakhs
  const total = subtotal + shipping;

  const orderId = `ORD-${Math.floor(10000 + Math.random() * 90000)}`;
  const newOrder = {
    orderId,
    createdAt: new Date().toISOString(),
    customer,
    paymentMethod: paymentMethod || 'B2B Net 30 Commercial Invoice',
    items: processedItems,
    subtotal,
    shipping,
    tax: 0.00,
    total,
    shippingStatus: 'Processing in Central European Hub (Hamburg/Munich)',
    status: 'Confirmed',
    notes: notes || 'Standard commercial packaging.'
  };

  orders.unshift(newOrder);
  writeJson('orders.json', orders);
  writeJson('products.json', products); // Save updated stock

  res.status(201).json({
    success: true,
    message: 'Purchase order placed successfully. Confirmation sent.',
    data: newOrder
  });
});

// GET /api/orders
app.get('/api/orders', (req, res) => {
  const orders = readJson('orders.json');
  res.json({ success: true, total: orders.length, data: orders });
});

// ==========================================
// 5. MY PLANT FLEET MANAGER API
// ==========================================

// GET /api/fleet
app.get('/api/fleet', (req, res) => {
  const fleet = readJson('fleet.json');
  res.json({ success: true, data: fleet });
});

// POST /api/fleet
app.post('/api/fleet', (req, res) => {
  const fleet = readJson('fleet.json');
  const newItem = {
    fleetId: 'FLT-' + Math.floor(100 + Math.random() * 900),
    plantName: req.body.plantName || 'Plant Unit A',
    turbineType: req.body.turbineType || 'Gas Turbine',
    manufacturer: req.body.manufacturer || 'GE Vernova',
    model: req.body.model || 'LM2500',
    serialNumber: req.body.serialNumber || 'SN-' + Math.floor(100000 + Math.random() * 900000),
    commissionYear: parseInt(req.body.commissionYear) || 2020,
    operatingHours: parseInt(req.body.operatingHours) || 24000,
    nextOverhaul: req.body.nextOverhaul || '2027-01-01'
  };

  fleet.push(newItem);
  writeJson('fleet.json', fleet);

  res.status(201).json({ success: true, message: 'Equipment added to plant fleet.', data: newItem });
});

// DELETE /api/fleet/:id
app.delete('/api/fleet/:id', (req, res) => {
  let fleet = readJson('fleet.json');
  fleet = fleet.filter(f => f.fleetId !== req.params.id);
  writeJson('fleet.json', fleet);
  res.json({ success: true, message: 'Equipment removed from plant fleet.' });
});

// ==========================================
// 6. ADMIN DASHBOARD STATS
// ==========================================

app.get('/api/stats', (req, res) => {
  const products = readJson('products.json');
  const rfqs = readJson('rfqs.json');
  const orders = readJson('orders.json');

  const totalProducts = products.length;
  const inStockProducts = products.filter(p => p.stock > 0).length;
  const lowStockProducts = products.filter(p => p.stock > 0 && p.stock <= 10).length;
  const outOfStockProducts = products.filter(p => p.stock === 0).length;

  const totalInventoryValue = products.reduce((acc, p) => acc + (p.price * p.stock), 0);

  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((acc, o) => acc + (o.total || 0), 0);

  const totalRfqs = rfqs.length;
  const pendingRfqs = rfqs.filter(r => r.status === 'Submitted' || r.status === 'Reviewing').length;

  // Group products by category
  const categories = readJson('categories.json');
  const categoryStats = categories.map(cat => ({
    name: cat.name,
    count: products.filter(p => p.category === cat.id).length
  }));

  res.json({
    success: true,
    data: {
      totalProducts,
      inStockProducts,
      lowStockProducts,
      outOfStockProducts,
      totalInventoryValue,
      totalOrders,
      totalRevenue,
      totalRfqs,
      pendingRfqs,
      categoryStats
    }
  });
});

// ==========================================
// 7. PRINTABLE TECHNICAL DATASHEET VIEW
// ==========================================

app.get('/api/products/:id/datasheet', (req, res) => {
  const products = readJson('products.json');
  const product = products.find(p => p.id === req.params.id);
  if (!product) return res.status(404).send('Product not found');

  const specsRows = product.specs 
    ? Object.entries(product.specs).map(([k, v]) => `<tr><th style="text-align:left;padding:8px 12px;background:#f8f9fa;border:1px solid #ddd;width:35%;">${k}</th><td style="padding:8px 12px;border:1px solid #ddd;">${v}</td></tr>`).join('')
    : '';

  const crossRows = product.crossReferences && product.crossReferences.length > 0
    ? product.crossReferences.map(c => `<tr><td style="padding:8px;border:1px solid #ddd;"><strong>${c.manufacturer}</strong></td><td style="padding:8px;border:1px solid #ddd;font-family:monospace;">${c.partNo}</td><td style="padding:8px;border:1px solid #ddd;">${c.type}</td></tr>`).join('')
    : '<tr><td colspan="3" style="padding:8px;border:1px solid #ddd;">Direct OEM specification</td></tr>';

  const html = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <title>Technical Datasheet - ${product.name} | TurbineTek</title>
    <style>
      body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #222; max-width: 900px; margin: auto; }
      .header { border-bottom: 3px solid #0056b3; padding-bottom: 20px; display: flex; justify-content: space-between; align-items: center; }
      .logo { font-size: 28px; font-weight: 800; color: #0b132b; letter-spacing: 1px; }
      .logo span { color: #0077b6; }
      .badge { background: #e0f2fe; color: #0369a1; padding: 4px 10px; border-radius: 4px; font-size: 13px; font-weight: 600; display: inline-block; }
      .part-no { font-family: monospace; font-size: 18px; color: #0056b3; margin: 10px 0; }
      table { width: 100%; border-collapse: collapse; margin-top: 15px; margin-bottom: 25px; }
      h2 { color: #0b132b; border-bottom: 1px solid #eee; padding-bottom: 8px; margin-top: 30px; font-size: 20px; }
      .print-btn { background: #0077b6; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: bold; }
      @media print { .print-btn { display: none; } body { padding: 0; } }
    </style>
  </head>
  <body>
    <div class="header">
      <div>
        <div class="logo">TURBINE<span>TEK</span></div>
        <p style="margin:5px 0 0; color:#666; font-size:13px;">Industrial Turbine & Gas Engine Spare Parts | DIN EN ISO 9001:2015</p>
      </div>
      <div>
        <button class="print-btn" onclick="window.print()">Print / Save as PDF</button>
      </div>
    </div>

    <div style="margin-top: 25px;">
      <span class="badge">${product.condition || 'Certified OEM Replacement'}</span>
      <h1 style="font-size: 24px; margin: 12px 0 6px;">${product.name}</h1>
      <div class="part-no">TurbineTek Part No: <strong>${product.partNumber}</strong> | OEM Ref: ${product.oemPartNumber}</div>
      <p style="color: #555; line-height: 1.6;">${product.fullDesc || product.shortDesc}</p>
    </div>

    <h2>Technical Specifications</h2>
    <table>
      ${specsRows}
    </table>

    <h2>OEM Cross-Reference Compatibility</h2>
    <table>
      <thead>
        <tr style="background:#f1f5f9; text-align:left;">
          <th style="padding:8px; border:1px solid #ddd;">Manufacturer / Supplier</th>
          <th style="padding:8px; border:1px solid #ddd;">Part Number</th>
          <th style="padding:8px; border:1px solid #ddd;">Cross Type</th>
        </tr>
      </thead>
      <tbody>
        ${crossRows}
      </tbody>
    </table>

    <h2>Certified Equipment Models</h2>
    <div style="display:flex; gap:10px; flex-wrap:wrap; margin-bottom: 30px;">
      ${(product.compatibleTurbines || []).map(t => `<span style="background:#f1f5f9; border:1px solid #cbd5e1; padding:6px 14px; border-radius:20px; font-size:13px; font-weight:600;">${t}</span>`).join('')}
    </div>

    <div style="margin-top: 40px; padding: 15px; background: #f8fafc; border-left: 4px solid #0077b6; font-size: 12px; color: #64748b;">
      <strong>Quality Assurance Notice:</strong> All TurbineTek components are manufactured under strict DIN EN ISO 9001:2015 quality standards. Every batch is supplied with an EN 10204 3.1 inspection certificate, non-destructive crack testing (NDT), and dimensional verification reports.
    </div>
  </body>
  </html>
  `;

  res.send(html);
});

// Fallback to index.html for SPA-style client routing
app.get('*', (req, res) => {
  if (req.accepts('html')) {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  } else {
    res.status(404).json({ error: 'Endpoint not found' });
  }
});

app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(` TurbineTek Platform running on http://localhost:${PORT}`);
  console.log(` B2B Industrial Spare Parts Portal & RFQ System Ready `);
  console.log(`=======================================================`);
});
