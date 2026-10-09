/**
 * TurbineTek Catalog Generator
 * Generates 520+ realistic, high-quality spare parts across all 15 car brands + industrial equipment
 * All priced in Indian Rupees (INR) with complete technical specifications, OEM cross-references, and vehicle compatibility.
 */

const fs = require('fs');
const path = require('path');

const PRODUCTS_FILE = path.join(__dirname, 'data', 'products.json');

// Read existing base products if available
let baseProducts = [];
if (fs.existsSync(PRODUCTS_FILE)) {
  try {
    baseProducts = JSON.parse(fs.readFileSync(PRODUCTS_FILE, 'utf-8'));
  } catch (e) {
    baseProducts = [];
  }
}

// 15 Car Brands with their models and country
const BRANDS = [
  {
    code: 'MAR',
    brand: 'Maruti Suzuki',
    country: 'India / Japan',
    oemMfr: 'Maruti Suzuki Genuine',
    models: ['Swift (All Gens)', 'Baleno', 'Brezza', 'Dzire', 'Ertiga', 'Grand Vitara', 'Fronx', 'Wagon R', 'Jimny 4x4', 'Ignis', 'Celerio', 'Alto K10', 'XL6'],
    type: 'Hatchback & Compact Car'
  },
  {
    code: 'HYU',
    brand: 'Hyundai',
    country: 'South Korea',
    oemMfr: 'Hyundai Mobis Genuine',
    models: ['Creta (All Gens)', 'i20 / i20 N-Line', 'Verna 1.5 Turbo / MPI', 'Venue', 'Exter', 'Alcazar', 'Tucson', 'Grand i10 Nios', 'Aura'],
    type: 'Compact SUV & Crossover'
  },
  {
    code: 'TAT',
    brand: 'Tata Motors',
    country: 'India',
    oemMfr: 'Tata Motors Genuine',
    models: ['Nexon / Nexon EV', 'Harrier 2.0 Kryotec', 'Safari', 'Punch / Punch EV', 'Altroz', 'Tiago', 'Tigor', 'Curvv'],
    type: 'Compact SUV & Crossover'
  },
  {
    code: 'MAH',
    brand: 'Mahindra',
    country: 'India',
    oemMfr: 'Mahindra & Mahindra Genuine',
    models: ['Scorpio-N', 'Thar 4x4 / Thar Roxx', 'XUV700', 'XUV300 / XUV 3XO', 'Scorpio Classic', 'Bolero / Bolero Neo'],
    type: 'Compact SUV & Crossover'
  },
  {
    code: 'TOY',
    brand: 'Toyota',
    country: 'Japan',
    oemMfr: 'Toyota Genuine Spares',
    models: ['Innova Crysta', 'Fortuner 4x4', 'Innova Hycross', 'Urban Cruiser Hyryder', 'Glanza', 'Hilux', 'Camry Hybrid'],
    type: 'MPV & Large SUV'
  },
  {
    code: 'HON',
    brand: 'Honda',
    country: 'Japan',
    oemMfr: 'Honda Genuine Cars',
    models: ['City 5th Gen (i-VTEC / e:HEV)', 'City 4th Gen', 'Amaze', 'Elevate', 'Civic', 'CR-V', 'WR-V', 'Jazz'],
    type: 'Sedan'
  },
  {
    code: 'KIA',
    brand: 'Kia',
    country: 'South Korea',
    oemMfr: 'Kia Genuine Mobis',
    models: ['Seltos', 'Sonet', 'Carens', 'Carnival', 'EV6'],
    type: 'Compact SUV & Crossover'
  },
  {
    code: 'VW',
    brand: 'Volkswagen',
    country: 'Germany',
    oemMfr: 'Volkswagen Genuine Parts',
    models: ['Virtus 1.0 / 1.5 TSI', 'Taigun', 'Polo 1.0 TSI / 1.2 / 1.5 TDI', 'Vento', 'Tiguan', 'Jetta', 'Passat'],
    type: 'Sedan'
  },
  {
    code: 'SKO',
    brand: 'Skoda',
    country: 'Czech Republic / Germany',
    oemMfr: 'Skoda Auto Genuine',
    models: ['Slavia', 'Kushaq', 'Octavia (A7/A8)', 'Superb', 'Kodiaq', 'Rapid'],
    type: 'Sedan'
  },
  {
    code: 'BMW',
    brand: 'BMW',
    country: 'Germany',
    oemMfr: 'BMW Genuine Parts',
    models: ['3 Series (320d / 330i G20)', '5 Series (520d / 530i G30)', 'X1', 'X3 xDrive', 'X5 xDrive', '7 Series', 'M3 / M4'],
    type: 'Luxury Sedan'
  },
  {
    code: 'MB',
    brand: 'Mercedes-Benz',
    country: 'Germany',
    oemMfr: 'Mercedes-Benz Genuine Parts',
    models: ['C-Class (C200 / C220d W205/W206)', 'E-Class (E220d / E350d W213)', 'GLC 220d / 300', 'GLA', 'GLE', 'S-Class'],
    type: 'Luxury Sedan'
  },
  {
    code: 'AUD',
    brand: 'Audi',
    country: 'Germany',
    oemMfr: 'Audi Genuine Parts',
    models: ['A4 2.0 TFSI', 'A6 Matrix', 'Q3 Quattro', 'Q5 Quattro', 'Q7 3.0 TDI', 'A3', 'RS5'],
    type: 'Luxury Sedan'
  },
  {
    code: 'FOR',
    brand: 'Ford',
    country: 'United States',
    oemMfr: 'Ford Genuine / Motorcraft',
    models: ['EcoSport 1.5 Titanium', 'Endeavour 2.0 / 3.2 4x4', 'Figo / Aspire', 'Mustang GT'],
    type: 'Compact SUV & Crossover'
  },
  {
    code: 'REN',
    brand: 'Renault',
    country: 'France',
    oemMfr: 'Renault Genuine Spares',
    models: ['Kwid 1.0', 'Triber', 'Kiger Turbo', 'Duster AWD'],
    type: 'Hatchback & Compact Car'
  },
  {
    code: 'NIS',
    brand: 'Nissan',
    country: 'Japan',
    oemMfr: 'Nissan Genuine Parts',
    models: ['Magnite Turbo', 'Kicks', 'Sunny', 'Terrano', 'X-Trail'],
    type: 'Compact SUV & Crossover'
  }
];

// Product Template Categories
const PART_TEMPLATES = [
  // Brakes (4 templates)
  {
    category: 'brakes-hydraulics',
    turbineSection: 'brakes',
    suffix: 'BRK-01',
    nameGen: (b) => `Brembo Low-Dust Ceramic Front Brake Pad Set - ${b.brand}`,
    priceRange: [2400, 7500],
    image: '/images/valve.jpg',
    shortDesc: (b) => `High-performance ceramic front brake pad set with red anti-vibration shims engineered for ${b.brand} vehicles.`,
    fullDesc: (b) => `Direct OEM replacement brake pads engineered by Brembo. Features advanced ceramic friction material designed for quiet operation, minimal dust accumulation on alloy wheels, and razor-sharp braking performance even under high temperatures.`,
    specKey: 'Friction Material',
    specVal: 'Advanced Low-Metallic Ceramic',
    mfrPartner: 'Brembo'
  },
  {
    category: 'brakes-hydraulics',
    turbineSection: 'brakes',
    suffix: 'BRK-02',
    nameGen: (b) => `Bosch Ventilated Front Brake Disc Rotors (Pair of 2) - ${b.brand}`,
    priceRange: [3200, 9800],
    image: '/images/valve.jpg',
    shortDesc: (b) => `High-carbon cast iron ventilated brake disc rotors with anti-corrosion coating for ${b.brand} models.`,
    fullDesc: (b) => `Precision machined disc rotors designed to eliminate brake judder and pedal pulsation. Fully coated with an innovative zinc-aluminum flake coating to prevent rust on the rotor hat and cooling vanes.`,
    specKey: 'Rotor Type',
    specVal: 'Internally Ventilated High-Carbon GG20',
    mfrPartner: 'Bosch Automotive'
  },
  {
    category: 'brakes-hydraulics',
    turbineSection: 'brakes',
    suffix: 'BRK-03',
    nameGen: (b) => `TVS Girling / Rane Rear Brake Shoes & Drum Overhaul Kit - ${b.brand}`,
    priceRange: [1800, 4200],
    image: '/images/valve.jpg',
    shortDesc: (b) => `Complete rear axle brake shoes with return spring hardware kit for ${b.brand}.`,
    fullDesc: (b) => `High-friction rear brake shoe assembly providing consistent parking brake holding power and smooth progressive braking under loaded conditions.`,
    specKey: 'Lining Material',
    specVal: 'Asbestos-Free High-Friction Organic',
    mfrPartner: 'TVS Girling'
  },
  {
    category: 'brakes-hydraulics',
    turbineSection: 'brakes',
    suffix: 'BRK-04',
    nameGen: (b) => `Advics / ATE ABS Wheel Speed Sensor (Front Left & Right) - ${b.brand}`,
    priceRange: [1450, 3800],
    image: '/images/sensor.jpg',
    shortDesc: (b) => `Active Hall-effect high-speed ABS wheel speed sensor pair with weatherproof harness connector.`,
    fullDesc: (b) => `Precision magnetic sensor reading wheel rotation telemetry for ABS, ESP, and Hill Hold Assist electronic control modules.`,
    specKey: 'Sensor Type',
    specVal: 'Active Two-Wire Hall Effect',
    mfrPartner: 'Advics Japan'
  },

  // Engine & Timing (5 templates)
  {
    category: 'engine-timing',
    turbineSection: 'engine',
    suffix: 'ENG-01',
    nameGen: (b) => `Bosch Double Iridium Spark Plugs (Set of 4 Plugs) - ${b.brand}`,
    priceRange: [2100, 4900],
    image: '/images/sparkplug.jpg',
    shortDesc: (b) => `Ultra-fine 0.6mm laser-welded iridium firing pin spark plugs providing 100,000 km durability.`,
    fullDesc: (b) => `Provides 4x longer service life compared to standard copper plugs. Improves fuel efficiency by up to 3.5%, guarantees instantaneous cold morning starts, and prevents misfires under high engine loads.`,
    specKey: 'Electrode Tip',
    specVal: 'Double Iridium Laser-Welded Pin',
    mfrPartner: 'Bosch Automotive'
  },
  {
    category: 'engine-timing',
    turbineSection: 'engine',
    suffix: 'ENG-02',
    nameGen: (b) => `Continental Contitech Timing Belt & Water Pump Kit - ${b.brand}`,
    priceRange: [4500, 11500],
    image: '/images/hero.jpg',
    shortDesc: (b) => `Complete synchronous timing belt overhaul kit with tensioner pulley, idler roller, and mechanical water pump.`,
    fullDesc: (b) => `Guarantees synchronous engine timing and eliminates the risk of catastrophic valve-to-piston contact. Resistant to engine oil vapors, high heat, and belt tooth elongation.`,
    specKey: 'Belt Material',
    specVal: 'HNBR Hydrogenated Nitrile Rubber',
    mfrPartner: 'Continental'
  },
  {
    category: 'engine-timing',
    turbineSection: 'engine',
    suffix: 'ENG-03',
    nameGen: (b) => `Garrett / BorgWarner Variable Geometry Turbocharger (VGT) - ${b.brand}`,
    priceRange: [32000, 68000],
    image: '/images/blade.jpg',
    shortDesc: (b) => `Electronically actuated variable nozzle turbocharger assembly delivering instant low-RPM boost.`,
    fullDesc: (b) => `Precision-engineered turbocharger featuring CNC billet compressor wheel and electronically actuated variable inlet guide vanes for lag-free low RPM torque and maximum high-speed horsepower.`,
    specKey: 'Actuation',
    specVal: 'Electronic CAN-Bus Smart Stepper Motor',
    mfrPartner: 'Garrett Motion'
  },
  {
    category: 'engine-timing',
    turbineSection: 'engine',
    suffix: 'ENG-04',
    nameGen: (b) => `Denso Direct High-Pressure Common Rail Fuel Injector - ${b.brand}`,
    priceRange: [8500, 24000],
    image: '/images/sparkplug.jpg',
    shortDesc: (b) => `Multi-hole piezoelectric common rail diesel / TGDI direct gasoline fuel injector.`,
    fullDesc: (b) => `Delivers up to 2,500-bar fuel injection pressure with microscopic droplet atomization, optimizing BS6 Stage-2 emissions and power delivery.`,
    specKey: 'Working Pressure',
    specVal: 'Up to 2,500 Bar Piezo Injection',
    mfrPartner: 'Denso Automotive'
  },
  {
    category: 'engine-timing',
    turbineSection: 'engine',
    suffix: 'ENG-05',
    nameGen: (b) => `Elring Klinger Multi-Layer Steel (MLS) Cylinder Head Gasket - ${b.brand}`,
    priceRange: [2200, 5800],
    image: '/images/filter.jpg',
    shortDesc: (b) => `Premium German multi-layer stainless steel head gasket with Viton combustion sealing beads.`,
    fullDesc: (b) => `Withstands peak cylinder combustion pressures and prevents coolant-to-oil cross-contamination under extreme engine thermal loads.`,
    specKey: 'Gasket Construction',
    specVal: '4-Layer Stainless Steel MLS with Fluoroelastomer Coating',
    mfrPartner: 'Elring Klinger'
  },

  // Suspension & Steering (4 templates)
  {
    category: 'suspension-steering',
    turbineSection: 'suspension',
    suffix: 'SUS-01',
    nameGen: (b) => `Gabriel / Monroe Gas-Charged Front Struts (Pair of 2) - ${b.brand}`,
    priceRange: [4200, 12500],
    image: '/images/blade.jpg',
    shortDesc: (b) => `Twin-tube nitrogen gas pressurized front suspension struts designed for plush Indian road dampening.`,
    fullDesc: (b) => `Features micro-smooth chrome-plated piston rod, multi-lip Viton oil seal, and progressive multi-stage valving that adapts dynamically to potholes and highway undulations.`,
    specKey: 'Gas Charge',
    specVal: 'High-Purity Nitrogen Pressurized (N2)',
    mfrPartner: 'Gabriel India'
  },
  {
    category: 'suspension-steering',
    turbineSection: 'suspension',
    suffix: 'SUS-02',
    nameGen: (b) => `Lemförder / Rane Front Lower Control Arm Wishbone (Pair) - ${b.brand}`,
    priceRange: [3800, 9600],
    image: '/images/blade.jpg',
    shortDesc: (b) => `Heavy-gauge stamped steel / forged aluminum lower suspension arms with pre-pressed rubber bushings and ball joints.`,
    fullDesc: (b) => `Eliminates steering wheel shudder, front tire edge wear, and loose cornering feel. Built to exceed OEM fatigue endurance standards.`,
    specKey: 'Bushing Material',
    specVal: 'High-Damping Natural Rubber Hydro-Bushing',
    mfrPartner: 'Lemförder ZF'
  },
  {
    category: 'suspension-steering',
    turbineSection: 'suspension',
    suffix: 'SUS-03',
    nameGen: (b) => `CTR / Talbros Front Stabilizer Sway Bar Link Rods (Pair) - ${b.brand}`,
    priceRange: [1100, 2900],
    image: '/images/blade.jpg',
    shortDesc: (b) => `Heavy duty anti-roll bar link rods with sealed ball joints for tight, flat cornering composure.`,
    fullDesc: (b) => `Eliminates knocking and rattling noises over speed breakers and uneven road surfaces. Sealed with crack-resistant chloroprene dust boots.`,
    specKey: 'Ball Pin Housing',
    specVal: 'Induction-Hardened Forged Ball Pin',
    mfrPartner: 'CTR Korea'
  },
  {
    category: 'suspension-steering',
    turbineSection: 'suspension',
    suffix: 'SUS-04',
    nameGen: (b) => `Rane / JTEKT Electric Power Steering (EPS) Rack & Pinion Assembly - ${b.brand}`,
    priceRange: [14000, 32000],
    image: '/images/hero.jpg',
    shortDesc: (b) => `Complete EPS steering gear rack with inner tie rods and rubber bellow boots.`,
    fullDesc: (b) => `Direct fit steering rack providing pinpoint turn-in precision and effortless low-speed parking assistance with zero play.`,
    specKey: 'Steering Ratio',
    specVal: 'Variable Quick-Ratio 14.2:1',
    mfrPartner: 'JTEKT'
  },

  // Filtration & Maintenance (4 templates)
  {
    category: 'filtration-maintenance',
    turbineSection: 'intake',
    suffix: 'FLT-01',
    nameGen: (b) => `Mann-Filter / Purolator High-Flow Engine Oil Filter - ${b.brand}`,
    priceRange: [450, 1600],
    image: '/images/filter.jpg',
    shortDesc: (b) => `Spin-on lube oil filter with synthetic blend media and silicone anti-drainback check valve.`,
    fullDesc: (b) => `Guarantees 99.2% particulate trapping efficiency down to 20 microns. Maintains stable lubrication pressure to turbo journals and variable valve camshaft actuators.`,
    specKey: 'Filtration Media',
    specVal: 'Micro-Fiber Resin Impregnated Cellulose',
    mfrPartner: 'Mann-Filter'
  },
  {
    category: 'filtration-maintenance',
    turbineSection: 'intake',
    suffix: 'FLT-02',
    nameGen: (b) => `Denso High-Capacity Pleated Engine Air Intake Filter - ${b.brand}`,
    priceRange: [650, 2100],
    image: '/images/filter.jpg',
    shortDesc: (b) => `Hydrophobic synthetic fiber air filter protecting turbo compressor and intake manifold from road grit.`,
    fullDesc: (b) => `Ensures uninterrupted laminar airflow into the mass air flow sensor (MAF), preventing horsepower throttling and maximizing fuel economy.`,
    specKey: 'Air Flow Rating',
    specVal: 'Up to 450 m³/h High Volume Intake',
    mfrPartner: 'Denso Automotive'
  },
  {
    category: 'filtration-maintenance',
    turbineSection: 'intake',
    suffix: 'FLT-03',
    nameGen: (b) => `Mann-Filter Activated Carbon Cabin AC Pollen Filter - ${b.brand}`,
    priceRange: [850, 2400],
    image: '/images/filter.jpg',
    shortDesc: (b) => `4-stage activated carbon cabin filter capturing PM2.5 soot, toxic exhaust fumes, and allergens.`,
    fullDesc: (b) => `Traps microscopic airborne pollution, ozone gas, and foul odors before entering vehicle HVAC ventilation, safeguarding passenger lung health.`,
    specKey: 'Efficiency',
    specVal: '99.5% PM2.5 Particle Capture & Anti-Bacterial Layer',
    mfrPartner: 'Mann-Filter'
  },
  {
    category: 'filtration-maintenance',
    turbineSection: 'intake',
    suffix: 'FLT-04',
    nameGen: (b) => `Bosch Diesel Fuel Filter Water Separator Cartridge - ${b.brand}`,
    priceRange: [1200, 3900],
    image: '/images/filter.jpg',
    shortDesc: (b) => `High-efficiency multistage diesel fuel filter element with integrated water drain sensor port.`,
    fullDesc: (b) => `Separates emulsified water from diesel fuel down to 3 microns, preventing catastrophic scoring of high-pressure common rail fuel pumps.`,
    specKey: 'Separation Rate',
    specVal: '> 98% Free & Emulsified Water Separation',
    mfrPartner: 'Bosch Automotive'
  },

  // Clutch & Transmission (3 templates)
  {
    category: 'transmission-clutch',
    turbineSection: 'transmission',
    suffix: 'CLT-01',
    nameGen: (b) => `Valeo / Exedy 3-Piece Heavy-Duty Clutch Overhaul Kit - ${b.brand}`,
    priceRange: [4200, 14500],
    image: '/images/hero.jpg',
    shortDesc: (b) => `Complete clutch kit containing friction clutch disc, diaphragm pressure plate cover, and release bearing.`,
    fullDesc: (b) => `Delivers feather-light pedal effort, progressive engagement without clutch shudder, and superior thermal durability during stop-go bumper traffic.`,
    specKey: 'Friction Material',
    specVal: 'Heavy-Duty Copper-Woven Organic Compound',
    mfrPartner: 'Valeo Automotive'
  },
  {
    category: 'transmission-clutch',
    turbineSection: 'transmission',
    suffix: 'CLT-02',
    nameGen: (b) => `LuK Schaeffler Dual-Mass Flywheel (DMF) Assembly - ${b.brand}`,
    priceRange: [18500, 38000],
    image: '/images/hero.jpg',
    shortDesc: (b) => `Torsional damping dual mass flywheel isolating engine crankshaft vibration from gearbox synchros.`,
    fullDesc: (b) => `Features internal progressive arc springs that absorb engine torque spikes, delivering silky powertrain refinement and preserving transmission gear teeth.`,
    specKey: 'Damping Technology',
    specVal: 'Dual Spring Internal Arc Pack with Planetary Gears',
    mfrPartner: 'LuK Schaeffler'
  },
  {
    category: 'transmission-clutch',
    turbineSection: 'transmission',
    suffix: 'CLT-03',
    nameGen: (b) => `GKN / NTN Front Drive CV Axle Shaft Assembly (Left/Right) - ${b.brand}`,
    priceRange: [4800, 12000],
    image: '/images/hero.jpg',
    shortDesc: (b) => `Complete constant velocity drive axle with induction-hardened spline shaft and neoprene rubber boots.`,
    fullDesc: (b) => `Transfers full engine wheel torque smoothly through extreme steering articulation angles without clicking or vibration. Pre-packed with molybdenum disulfide grease.`,
    specKey: 'Joint Type',
    specVal: 'Outboard Rzeppa Fixed Joint + Inboard Tripod Plunging Joint',
    mfrPartner: 'GKN Driveline'
  },

  // Electrical, Sensors & Lighting (4 templates)
  {
    category: 'electrical-sensors',
    turbineSection: 'electrical',
    suffix: 'ELE-01',
    nameGen: (b) => `Hella Bi-LED Projector Headlight Assembly (RHS / LHS) - ${b.brand}`,
    priceRange: [9800, 24500],
    image: '/images/sensor.jpg',
    shortDesc: (b) => `Tri-beam LED projector headlamp unit with integrated LED daytime running light eyebrow.`,
    fullDesc: (b) => `Delivers 3,200 lumens of crisp 6000K daylight beam illumination with razor-sharp cut-off lines to avoid dazzling oncoming drivers. Polycarbonate UV anti-scratch hard-coated lens.`,
    specKey: 'Beam Output',
    specVal: '3,200 Lumens / 6,000K Pure White',
    mfrPartner: 'Hella Automotive'
  },
  {
    category: 'electrical-sensors',
    turbineSection: 'electrical',
    suffix: 'ELE-02',
    nameGen: (b) => `Denso / Valeo High-Output Engine Alternator 12V 120A - ${b.brand}`,
    priceRange: [7800, 19500],
    image: '/images/sensor.jpg',
    shortDesc: (b) => `Heavy-duty 120-Ampere brushless alternator with electronic internal voltage regulator and decoupler pulley.`,
    fullDesc: (b) => `Provides steady electrical charging for modern vehicle sensor suites, touchscreen infotainment, high-beam LEDs, and dual-zone air conditioning compressors.`,
    specKey: 'Current Rating',
    specVal: '12V DC / 120-140A Peak Output',
    mfrPartner: 'Denso Automotive'
  },
  {
    category: 'electrical-sensors',
    turbineSection: 'electrical',
    suffix: 'ELE-03',
    nameGen: (b) => `Bosch High-Torque Engine Starter Motor Assembly - ${b.brand}`,
    priceRange: [5600, 14200],
    image: '/images/sensor.jpg',
    shortDesc: (b) => `Permanent magnet gear reduction (PMGR) starter motor delivering instantaneous engine cranking.`,
    fullDesc: (b) => `Cranks high-compression petrol and diesel engines effortlessly even in freezing winter conditions (-20°C). Sealed against road water spray and dust ingress.`,
    specKey: 'Power Rating',
    specVal: '1.4 kW PMGR Gear Reduction',
    mfrPartner: 'Bosch Automotive'
  },
  {
    category: 'electrical-sensors',
    turbineSection: 'electrical',
    suffix: 'ELE-04',
    nameGen: (b) => `Bosch Wideband Lambda Oxygen (O2) Sensor - ${b.brand}`,
    priceRange: [2900, 6800],
    image: '/images/sensor.jpg',
    shortDesc: (b) => `Upstream wideband planar zircon-oxide oxygen sensor with fast internal ceramic heating element.`,
    fullDesc: (b) => `Monitors exhaust gas air-fuel ratio continuously to allow ECU fuel trim adjustments for maximum fuel mileage and minimal tailpipe emissions.`,
    specKey: 'Sensor Type',
    specVal: '5-Wire Wideband LSU 4.9 Planar Sensor',
    mfrPartner: 'Bosch Automotive'
  },

  // Cooling & AC (3 templates)
  {
    category: 'cooling-ac',
    turbineSection: 'cooling',
    suffix: 'COL-01',
    nameGen: (b) => `Denso / Subros High-Efficiency Automotive AC Compressor - ${b.brand}`,
    priceRange: [14500, 28500],
    image: '/images/valve.jpg',
    shortDesc: (b) => `Variable displacement swash-plate AC compressor unit pre-filled with PAG 46 synthetic lubricant.`,
    fullDesc: (b) => `Engineered to achieve rapid cabin pull-down temperatures in scorching 48°C Indian peak summers without bogging down engine power or dragging down fuel mileage.`,
    specKey: 'Displacement',
    specVal: '140 cc Variable Swash-Plate',
    mfrPartner: 'Denso Automotive'
  },
  {
    category: 'cooling-ac',
    turbineSection: 'cooling',
    suffix: 'COL-02',
    nameGen: (b) => `Behr / Calsonic Kansei Brazed Aluminum Engine Radiator - ${b.brand}`,
    priceRange: [4200, 11800],
    image: '/images/valve.jpg',
    shortDesc: (b) => `100% brazed aluminum core cooling radiator with thermal polyamide fiber end tanks.`,
    fullDesc: (b) => `Optimized coolant fin density provides 30% higher heat dissipation over standard replacement cores, protecting engines from boiling over during highway traffic jams.`,
    specKey: 'Core Construction',
    specVal: 'Micro-Louvered Brazed Aluminum Core',
    mfrPartner: 'Mahle Behr'
  },
  {
    category: 'cooling-ac',
    turbineSection: 'cooling',
    suffix: 'COL-03',
    nameGen: (b) => `Saleri / Gates Mechanical Engine Water Pump Assembly - ${b.brand}`,
    priceRange: [1800, 4900],
    image: '/images/valve.jpg',
    shortDesc: (b) => `Precision water pump with CNC machined cast bronze impeller and silicon carbide mechanical seal.`,
    fullDesc: (b) => `Guarantees consistent coolant circulation through cylinder head cooling jackets, eliminating localized engine hot spots and head warping.`,
    specKey: 'Seal Technology',
    specVal: 'Silicon Carbide (SiC) High-Pressure Mechanical Face Seal',
    mfrPartner: 'Gates Automotive'
  },

  // Body & Mirrors (3 templates)
  {
    category: 'body-mirrors',
    turbineSection: 'body',
    suffix: 'BDY-01',
    nameGen: (b) => `Motherson Auto-Folding Heated ORVM Side Mirror (RHS / LHS) - ${b.brand}`,
    priceRange: [3800, 9200],
    image: '/images/hero.jpg',
    shortDesc: (b) => `Complete electric mirror assembly with power fold motor, glass heater defogger, and LED blinker.`,
    fullDesc: (b) => `Direct replacement factory mirror featuring convex wide-angle optic glass for blind-spot minimization. Supplied with primed mirror cap ready for body-color paint matching.`,
    specKey: 'Functions',
    specVal: 'Power Mirror Glass, Auto Fold Motor, Heated Defogger, LED Indicator',
    mfrPartner: 'Motherson Group'
  },
  {
    category: 'body-mirrors',
    turbineSection: 'body',
    suffix: 'BDY-02',
    nameGen: (b) => `Bosch Aerotwin Frameless Wiper Blade Set (Driver + Passenger) - ${b.brand}`,
    priceRange: [950, 2400],
    image: '/images/hero.jpg',
    shortDesc: (b) => `Dual aerodynamic beam wiper blades with dual-rubber coating for crystal-clear silent wiping.`,
    fullDesc: (b) => `Pre-curved Evodium steel spine delivers uniform pressure across the entire curvature of modern curved windshields, wiping streak-free even in torrential monsoon downpours.`,
    specKey: 'Blade Design',
    specVal: 'Aerodynamic Spoiler Beam Blade with Power Protection Plus Coating',
    mfrPartner: 'Bosch Automotive'
  },
  {
    category: 'body-mirrors',
    turbineSection: 'body',
    suffix: 'BDY-03',
    nameGen: (b) => `OEM High-Impact Polypropylene Front Bumper Grille Assembly - ${b.brand}`,
    priceRange: [2400, 7800],
    image: '/images/hero.jpg',
    shortDesc: (b) => `Front radiator airflow honeycomb grille with integrated chrome garnish trim.`,
    fullDesc: (b) => `Manufactured using injection molded virgin polypropylene for high impact resistance against road gravel chips and highway bug spatter.`,
    specKey: 'Material',
    specVal: 'Virgin Polypropylene (PP) with Chrome Electroplated Accents',
    mfrPartner: 'Motherson Group'
  }
];

// Secondary Variant Generators to ensure each brand gets 35+ unique parts
const EXTRA_VARIANTS = [
  {
    category: 'brakes-hydraulics',
    turbineSection: 'brakes',
    suffix: 'BRK-05',
    nameGen: (b) => `Ferodo Premier Rear Axle Ceramic Brake Pads Set - ${b.brand}`,
    priceRange: [1800, 4800],
    image: '/images/valve.jpg',
    shortDesc: (b) => `OE-spec rear axle disc brake pads with chamfered slots for silent city deceleration.`,
    specKey: 'Friction Material',
    specVal: 'Ferodo Low-Steel Formulation'
  },
  {
    category: 'engine-timing',
    turbineSection: 'engine',
    suffix: 'ENG-06',
    nameGen: (b) => `Pierburg High-Pressure Variable Valve Timing (VVT) Solenoid - ${b.brand}`,
    priceRange: [3200, 7400],
    image: '/images/sparkplug.jpg',
    shortDesc: (b) => `Electromagnetic variable camshaft timing oil control spool valve.`,
    specKey: 'Operating Voltage',
    specVal: '12V DC Fast Response Solenoid'
  },
  {
    category: 'suspension-steering',
    turbineSection: 'suspension',
    suffix: 'SUS-05',
    nameGen: (b) => `Bilstein B4 OE Constant Damping Rear Shock Absorbers (Pair) - ${b.brand}`,
    priceRange: [3600, 10800],
    image: '/images/blade.jpg',
    shortDesc: (b) => `Gas-pressurized rear suspension shock absorbers restoring original European ride poise.`,
    specKey: 'Damper Tech',
    specVal: 'Monotube / Twin-Tube Gas Pressure'
  },
  {
    category: 'filtration-maintenance',
    turbineSection: 'intake',
    suffix: 'FLT-05',
    nameGen: (b) => `Mann-Filter Complete 4-Piece Periodic Maintenance Service Pack - ${b.brand}`,
    priceRange: [2800, 7200],
    image: '/images/filter.jpg',
    shortDesc: (b) => `All-in-one routine 10,000 km service bundle: Oil Filter, Air Filter, Cabin Carbon Filter & Fuel Filter.`,
    specKey: 'Package Items',
    specVal: '4-Filter Complete Service Kit'
  },
  {
    category: 'transmission-clutch',
    turbineSection: 'transmission',
    suffix: 'CLT-04',
    nameGen: (b) => `FAG / SKF Front Wheel Double-Row Angular Ball Hub Bearing Kit - ${b.brand}`,
    priceRange: [2100, 5400],
    image: '/images/hero.jpg',
    shortDesc: (b) => `Pre-greased and sealed double-row angular contact front wheel hub bearing with integrated ABS magnetic encoder.`,
    specKey: 'Bearing Rating',
    specVal: 'Gen 2 / Gen 3 Sealed Hub Unit with ABS Encoder Ring'
  },
  {
    category: 'electrical-sensors',
    turbineSection: 'electrical',
    suffix: 'ELE-05',
    nameGen: (b) => `Bosch Direct Ignition Coil Pack (Set of 4 Coils) - ${b.brand}`,
    priceRange: [3800, 9200],
    image: '/images/sparkplug.jpg',
    shortDesc: (b) => `Complete 4-pack plug-top ignition pencil coils delivering 38kV continuous spark energy.`,
    specKey: 'Voltage Output',
    specVal: '38,000 Volts Ultra-Fast Rise Time'
  },
  {
    category: 'cooling-ac',
    turbineSection: 'cooling',
    suffix: 'COL-04',
    nameGen: (b) => `Mahle Behr Engine Coolant Thermostat Housing & Temperature Sensor - ${b.brand}`,
    priceRange: [1600, 4800],
    image: '/images/valve.jpg',
    shortDesc: (b) => `Wax-pellet calibrated engine thermostat assembly in glass-fiber reinforced housing.`,
    specKey: 'Opening Temperature',
    specVal: '87°C / 92°C Precise Engine Thermal Regulation'
  },
  {
    category: 'body-mirrors',
    turbineSection: 'body',
    suffix: 'BDY-04',
    nameGen: (b) => `Valeo Full-LED Dynamic Sweeping Rear Tail Light Unit - ${b.brand}`,
    priceRange: [4500, 16500],
    image: '/images/sensor.jpg',
    shortDesc: (b) => `Right/Left rear tail lamp module featuring sequential LED turn blinker and neon light-guide brake styling.`,
    specKey: 'LED Technology',
    specVal: 'Homogeneous Surface-Emitting OLED / LED Light Guide'
  }
];

// Industrial Gas Turbine & Plant Spares (50 items)
const INDUSTRIAL_PARTS = [
  {
    prefix: 'IND-BLD',
    name: 'Stage 1 HP Gas Turbine Rotor Blade - Inconel 718 (TBC Coated)',
    mfr: 'GE Vernova / GE Power',
    models: ['LM2500', 'LM2500+', 'Frame 6B', 'Frame 7EA'],
    price: 320000.00,
    category: 'blades-vanes',
    section: 'turbine',
    image: '/images/blade.jpg',
    desc: 'Vacuum-investment cast directional solidification rotor blade with thermal barrier coating (TBC) for 1180°C operation.'
  },
  {
    prefix: 'IND-BLD-02',
    name: 'Stage 2 Low-Pressure Power Turbine Shrouded Rotor Blade',
    mfr: 'Siemens Energy',
    models: ['SGT-400', 'SGT-700', 'SGT-800'],
    price: 285000.00,
    category: 'blades-vanes',
    section: 'turbine',
    image: '/images/blade.jpg',
    desc: 'Interlocking tip-shrouded power turbine blade cast in Udimet 720 superalloy for vibration-free multi-thousand hour baseload run.'
  },
  {
    prefix: 'IND-SPK',
    name: 'Industrial Iridium Spark Plug GI3-1 (Heavy Duty Gas Engine)',
    mfr: 'Denso Industrial',
    models: ['LM2500', 'SGT-400', 'INNIO Jenbacher J320', 'MWM TCG 2020'],
    price: 9500.00,
    category: 'engine-timing',
    section: 'engine',
    image: '/images/sparkplug.jpg',
    desc: 'Heavy-duty 18mm industrial spark plug with 360-degree laser-welded iridium electrode rated for continuous base-load operations.'
  },
  {
    prefix: 'IND-SPK-02',
    name: 'Champion FB77WPCC Industrial Gas Engine Igniter Plug',
    mfr: 'Champion Aerospace',
    models: ['INNIO Jenbacher J420', 'MWM TCG 2020', 'Wartsila 34SG'],
    price: 11200.00,
    category: 'engine-timing',
    section: 'engine',
    image: '/images/sparkplug.jpg',
    desc: 'Pre-chamber spark plug with heavy platinum-iridium ground electrode for high-BMEP lean-burn cogeneration engines.'
  },
  {
    prefix: 'IND-FLT',
    name: 'Industrial Turbine Air Intake Cartridge Filter (F9 / E10 HEPA)',
    mfr: 'Camfil / Donaldson Equivalent',
    models: ['LM2500', 'SGT-400', 'SGT-800', 'Solar Taurus 60'],
    price: 15500.00,
    category: 'filtration-maintenance',
    section: 'intake',
    image: '/images/filter.jpg',
    desc: 'Self-cleaning pulse jet air intake cartridge filter with hydrophobic ePTFE membrane for high-volume air compression.'
  },
  {
    prefix: 'IND-FLT-02',
    name: 'Turbine Lube Oil High-Collapse 3-Micron Glass Filter Element',
    mfr: 'Hydac / Pall Corporation',
    models: ['LM2500', 'LM6000', 'SGT-400', 'Frame 7EA'],
    price: 18400.00,
    category: 'filtration-maintenance',
    section: 'intake',
    image: '/images/filter.jpg',
    desc: 'Multi-layer inorganic glass fiber cartridge with 210-bar burst collapse rating, protecting hydrodynamic tilt-pad bearings.'
  },
  {
    prefix: 'IND-VLV',
    name: 'Electro-Hydraulic Fuel Gas Metering Valve (GS6 Equivalent)',
    mfr: 'Woodward Controls',
    models: ['LM2500', 'LM2500+', 'SGT-400', 'Frame 6B'],
    price: 540000.00,
    category: 'engine-timing',
    section: 'engine',
    image: '/images/valve.jpg',
    desc: 'High-speed gas fuel metering valve with integrated resolver position feedback for linear fuel throttling in sub-80ms.'
  },
  {
    prefix: 'IND-SNS',
    name: 'Exhaust Gas Dual Type-K Thermocouple Rake Sensor Probe',
    mfr: 'Conax Technologies',
    models: ['LM2500', 'SGT-400', 'SGT-800', 'Frame 9E'],
    price: 28000.00,
    category: 'electrical-sensors',
    section: 'exhaust',
    image: '/images/sensor.jpg',
    desc: 'Inconel-sheathed dual Type-K hermetic thermocouple probe reading exhaust diffuser temperature up to 1100°C.'
  },
  {
    prefix: 'IND-BRG',
    name: 'Tilt-Pad Hydrodynamic Journal Bearing Shell Assembly',
    mfr: 'Waukesha Bearings / Kingsbury',
    models: ['LM2500', 'SGT-400', 'Frame 6B'],
    price: 195000.00,
    category: 'suspension-steering',
    section: 'bearings',
    image: '/images/blade.jpg',
    desc: 'Babbitt-lined 5-pad tilting journal bearing designed to eliminate oil-film whirl instability at 3,600 and 5,200 RPM.'
  },
  {
    prefix: 'IND-SEA',
    name: 'Segmented Carbon Ring Shaft Barrier Seal Kit',
    mfr: 'John Crane / EagleBurgmann',
    models: ['LM2500', 'LM6000', 'SGT-400'],
    price: 68000.00,
    category: 'suspension-steering',
    section: 'bearings',
    image: '/images/valve.jpg',
    desc: 'Spring-energized high-purity electro-graphite seal rings with buffer air injection, preventing lube oil vapors entering the compressor.'
  }
];

console.log('Generating 520+ realistic spare parts catalog...');

const allProducts = [];
let partCounter = 1;

// 1. Generate for every single car brand (15 brands x ~33 parts = ~495 car parts)
BRANDS.forEach((brandInfo) => {
  // Combine core templates and extra variants
  const combinedTemplates = [...PART_TEMPLATES, ...EXTRA_VARIANTS];

  combinedTemplates.forEach((template, idx) => {
    // Generate 1 primary part and 1 alternate model fitment for high-volume categories
    const priceRandom = Math.floor(template.priceRange[0] + Math.random() * (template.priceRange[1] - template.priceRange[0]));
    // Round to nearest 50
    const finalPrice = Math.round(priceRandom / 50) * 50;

    const partNumCode = `${brandInfo.code}-${template.suffix}-${String(partCounter).padStart(3, '0')}`;
    const oemNumCode = `${brandInfo.code}-${Math.floor(10000 + Math.random() * 89999)}-${String.fromCharCode(65 + Math.floor(Math.random() * 26))}`;

    const partName = template.nameGen(brandInfo);
    const shortDesc = template.shortDesc ? template.shortDesc(brandInfo) : `Certified high-durability replacement spare engineered for ${brandInfo.brand} vehicles.`;
    const fullDesc = template.fullDesc ? template.fullDesc(brandInfo) : `Engineered specifically to exceed OE requirements for ${brandInfo.brand}. Guaranteed fit, form, and function with DIN EN ISO 9001:2015 traceability and high heat resilience.`;

    // Pick 2-4 compatible models from brand
    const modelsCount = Math.min(brandInfo.models.length, 3 + (idx % 3));
    const compatible = brandInfo.models.slice(0, modelsCount);

    const product = {
      id: `CAR-${partNumCode}`,
      name: partName,
      partNumber: `TT-${partNumCode}`,
      category: template.category,
      oemManufacturer: `${brandInfo.brand} / ${template.mfrPartner || brandInfo.oemMfr}`,
      carBrand: brandInfo.brand,
      oemPartNumber: oemNumCode,
      turbineType: brandInfo.type,
      compatibleTurbines: compatible,
      turbineSection: template.turbineSection,
      price: finalPrice,
      currency: 'INR',
      stock: Math.floor(12 + Math.random() * 65),
      leadTime: 'In Stock (Ships in 24h)',
      condition: idx % 3 === 0 ? 'Brand New Genuine Original' : 'Brand New OEM Original',
      image: template.image,
      shortDesc: shortDesc,
      fullDesc: fullDesc,
      crossReferences: [
        { manufacturer: `${brandInfo.brand} OEM`, partNo: oemNumCode, type: 'Direct OEM' },
        { manufacturer: template.mfrPartner || 'Bosch', partNo: `BSH-${Math.floor(100000 + Math.random() * 899999)}`, type: 'OEM Cross' },
        { manufacturer: 'TurbineTek Certified', partNo: `TT-${partNumCode}`, type: 'Direct Fit' }
      ],
      specs: {
        'Vehicle Brand Fitment': brandInfo.brand,
        'Country of Origin': brandInfo.country,
        'Quality Standard': 'DIN EN ISO 9001:2015',
        'Testing Standard': 'ARAI / ECE R90 Certified',
        [template.specKey]: template.specVal
      },
      certifications: ['DIN EN ISO 9001:2015', 'ECE R90 Certified', 'ARAI Approved', '100% Fitment Guarantee']
    };

    allProducts.push(product);
    partCounter++;
  });
});

console.log(`Generated ${allProducts.length} car spare parts across 15 brands.`);

// 2. Add Industrial Power & Turbine Spares (expand industrial items up to 45 items)
let indCounter = 1;
INDUSTRIAL_PARTS.forEach(item => {
  // Generate 4 realistic variations per industrial part (different sizes/ratings)
  const variants = [
    { sub: 'Standard Base', priceMult: 1.0, suffix: 'A' },
    { sub: 'Heavy Duty DLN', priceMult: 1.15, suffix: 'B' },
    { sub: 'High-Temperature Thermal Barrier', priceMult: 1.28, suffix: 'C' },
    { sub: 'AOG Emergency Direct Replacement', priceMult: 1.05, suffix: 'D' }
  ];

  variants.forEach(v => {
    const pId = `TT-IND-${String(indCounter).padStart(3, '0')}`;
    allProducts.push({
      id: pId,
      name: `${item.name} (${v.sub})`,
      partNumber: `TT-${item.prefix}-${v.suffix}`,
      category: item.category,
      oemManufacturer: item.mfr,
      carBrand: 'Industrial Power',
      oemPartNumber: `OEM-${Math.floor(100000 + Math.random() * 899999)}-${v.suffix}`,
      turbineType: 'Industrial Gas Turbine',
      compatibleTurbines: item.models,
      turbineSection: item.section,
      price: Math.round(item.price * v.priceMult),
      currency: 'INR',
      stock: Math.floor(6 + Math.random() * 25),
      leadTime: 'In Stock (Ships in 24h)',
      condition: 'New OEM Alternative (TUV Certified)',
      image: item.image,
      shortDesc: `${item.desc} Engineered for heavy baseload reliability.`,
      fullDesc: `${item.desc} Meets EN 10204 3.1 inspection certification and OEM tolerance thresholds. Manufactured with vacuum casting and CMM dimensional conformity.`,
      crossReferences: [
        { manufacturer: item.mfr, partNo: `OEM-${Math.floor(100000 + Math.random() * 899999)}`, type: 'Direct OEM' },
        { manufacturer: 'Onergys Reference', partNo: `ON-${Math.floor(10000 + Math.random() * 89999)}`, type: 'Aftermarket Equivalent' }
      ],
      specs: {
        'Machine Fitment': item.models.join(', '),
        'Quality Standard': 'DIN EN ISO 9001:2015',
        'Material Traceability': 'EN 10204 3.1 Certified',
        'Operating Lifecycle': '24,000 to 48,000 Operating Hours'
      },
      certifications: ['DIN EN ISO 9001:2015', 'EN 10204 3.1', 'CE Conformity', 'TUV Rheinland']
    });
    indCounter++;
  });
});

console.log(`Total catalog products generated: ${allProducts.length}`);

// Ensure minimum 500+ products
if (allProducts.length < 500) {
  console.error(`Warning: generated ${allProducts.length} items, which is under 500!`);
} else {
  // Write to data/products.json
  fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(allProducts, null, 2), 'utf-8');
  console.log(`Successfully wrote ${allProducts.length} spare parts to ${PRODUCTS_FILE}`);
}
