const endpoints = [
  'http://localhost:5000/',
  'http://localhost:5000/catalog.html',
  'http://localhost:5000/rfq.html',
  'http://localhost:5000/fleet.html',
  'http://localhost:5000/admin.html',
  'http://localhost:5000/api/products',
  'http://localhost:5000/api/categories',
  'http://localhost:5000/api/turbines',
  'http://localhost:5000/api/rfqs',
  'http://localhost:5000/api/orders',
  'http://localhost:5000/api/fleet',
  'http://localhost:5000/api/stats',
  'http://localhost:5000/api/products/TT-BLD-0101/datasheet',
  'http://localhost:5000/images/hero.jpg',
  'http://localhost:5000/images/blade.jpg',
  'http://localhost:5000/images/sparkplug.jpg',
  'http://localhost:5000/images/filter.jpg',
  'http://localhost:5000/images/sensor.jpg',
  'http://localhost:5000/images/valve.jpg'
];

async function runTests() {
  console.log('=== Testing TurbineTek Web Application Endpoints ===');
  let passed = 0;
  for (const url of endpoints) {
    try {
      const res = await fetch(url);
      if (res.status === 200) {
        console.log(`[PASS 200] ${url}`);
        passed++;
      } else {
        console.log(`[WARN ${res.status}] ${url}`);
      }
    } catch (err) {
      console.error(`[FAIL] ${url}: ${err.message}`);
    }
  }
  console.log(`\nResults: ${passed} / ${endpoints.length} endpoints passed successfully!`);
}

runTests();
