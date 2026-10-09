# TurbineTek - Industrial Turbine & Gas Engine Spare Parts Platform

> **"All Spare Parts Under One Roof"**  
> An Enterprise-Grade B2B E-Commerce & RFQ Platform Inspired by Onergys, engineered for Gas Turbines, Steam Turbines, and CHP Gas Engines.  
> **Major Project Submission**

---

## 🌟 Executive Summary & Motivation
In modern power generation plants (Combined Cycle Gas Turbines, Cogeneration plants, District Heating, Offshore Oil & Gas rigs), downtime is extraordinarily expensive—unplanned outages can cost over **$100,000 per day**.

Traditional procurement of industrial spare parts is fragmented: plant operators struggle with proprietary OEM monopolies, cross-referencing obsolete part numbers, and slow quotation processes.

**TurbineTek** solves this by unifying all turbine and heavy-duty gas engine components under one roof. Inspired by industrial benchmarks like **Onergys**, **Prime Turbine Parts**, and **Chromalloy**, TurbineTek delivers:
- **Instant OEM Cross-Referencing**: Map manufacturer numbers (GE, Siemens, Solar, Jenbacher, MWM) directly to certified aftermarket alternatives.
- **Interactive 3D / Exploded Turbine Schematic**: A visual, interactive CAD cross-section that lets engineers inspect thermodynamic operating telemetry (temperature, pressure, RPM) and reveal compatible spare parts by stage.
- **Fast Equipment Compatibility Finder**: 3-step parametric filtering (Classification ➔ OEM ➔ Model).
- **Formal B2B RFQ (Request For Quotation) Tender System**: Generates binding commercial quotation documents with automated volume discount tiers and lead times.
- **"My Plant Fleet" Equipment Registry**: Allows power station managers to register operating assets and immediately view tailored maintenance kits.
- **Operations & Logistics Admin Command Center**: Live KPI analytics, real-time inventory CRUD, and quote approval workflows.

---

## 📐 System Architecture

TurbineTek is built on a clean full-stack architecture designed for maximum performance, zero bloat, and rock-solid stability:

```
TurbineTek System Architecture
┌─────────────────────────────────────────────────────────────┐
│                       Client Layer                          │
│  Vanilla HTML5 • Custom CSS3 Design Tokens • ES6 Modules    │
│  ┌───────────────┐ ┌───────────────┐ ┌───────────────────┐  │
│  │ Storefront UI │ │ 3D Schematic  │ │  B2B RFQ Tender   │  │
│  │  (index.html) │ │ (Interactive) │ │    (rfq.html)     │  │
│  └───────┬───────┘ └───────┬───────┘ └─────────┬─────────┘  │
│          │                 │                   │            │
│  ┌───────┴───────┐ ┌───────┴───────┐ ┌─────────┴─────────┐  │
│  │ Catalog & Nav │ │  Plant Fleet  │ │   Admin Portal    │  │
│  │(catalog.html) │ │ (fleet.html)  │ │   (admin.html)    │  │
│  └───────────────┘ └───────────────┘ └───────────────────┘  │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTP / RESTful JSON
┌──────────────────────────────▼──────────────────────────────┐
│                    Node.js Express Server                   │
│                       (server.js)                           │
│  ┌─────────────────┐ ┌──────────────────┐ ┌──────────────┐  │
│  │ Product Service │ │  RFQ Engine      │ │ Fleet Logic  │  │
│  └────────┬────────┘ └────────┬─────────┘ └──────┬───────┘  │
│           │                   │                  │          │
│  ┌────────┴────────┐ ┌────────┴─────────┐ ┌──────┴───────┐  │
│  │ Order Processor │ │ Stats Analytics  │ │ PDF Datasheet│  │
│  └─────────────────┘ └──────────────────┘ └──────────────┘  │
└──────────────────────────────┬──────────────────────────────┘
                               │ Persistent File Storage
┌──────────────────────────────▼──────────────────────────────┐
│                     JSON Database Store                     │
│   products.json • rfqs.json • orders.json • fleet.json      │
│          categories.json • manufacturers.json               │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Key Features Demonstrated

### 1. Interactive Gas Turbine Cross-Section Explorer
- Custom-engineered scalable vector diagram of a heavy-duty industrial gas turbine.
- Divided into functional thermodynamic zones:
  - **Air Intake & Filtration** (F9/E10 HEPA Cartridges)
  - **Axial Compressor** (14-17 Stages, Titanium Ti-6Al-4V)
  - **DLN Combustor** (1,450°C Firing, Spark Igniters, Fuel Metering Valves)
  - **High-Pressure & Power Turbine** (Inconel 718 Rotor Blades & Stator Vanes)
  - **Exhaust Diffuser** (Dual Type-K EGT Thermocouples)
  - **Bearings & Shaft Seals** (Segmented Bronze Labyrinth Seals, Lube Oil Filters)
- Hovering illuminates stages with live telemetry metrics; clicking isolates spare parts instantly.

### 2. Onergys-Benchmark Equipment Compatibility Finder
- Fast 3-tier cascade selector:
  1. **Equipment Classification**: Gas Turbine, Steam Turbine, CHP Gas Engine.
  2. **Manufacturer**: GE Power, Siemens Energy, Solar Turbines, INNIO Jenbacher, MWM Caterpillar, Rolls-Royce.
  3. **Specific Model**: LM2500, SGT-400, Taurus 60, JMS 320 GS, TCG 2020.
- Guarantees 100% metallurgical and dimensional fit.

### 3. OEM Part Cross-Reference Interchange
- Search by genuine OEM part numbers:
  - Denso `GI3-1` ➔ Jenbacher `351000` / Champion `FB77WPCC`
  - GE `314A5600P001` ➔ Inconel 718 Stage 1 Blade
  - Hydac `0160 D 003` ➔ High-Pressure Lube Oil Element
  - Woodward `9907-165 (GS6)` ➔ Electro-Hydraulic Fuel Metering Valve

### 4. B2B Commercial RFQ Tender & Quotation Generator
- Add single parts or import whole plant overhaul lists.
- Automatic tiered B2B pricing:
  - 5% Discount on orders > $10,000
  - 10% Discount on orders > $30,000
- Generates official commercial quotation letters formatted with Quote ID, validity period, EN 10204 3.1 conformity clause, and printable export view.

### 5. Printable Technical Datasheets
- Dynamic `/api/products/:id/datasheet` generates a clean, ISO-compliant specification sheet for engineering documentation, complete with metallurgical properties, operating limits, and drawing tolerances.

### 6. "My Plant Fleet" Equipment Registry
- Enables plant engineers to register active units (Serial number, operating hours, installation year, scheduled overhaul date).
- Automatically links machines to compatible spare parts.

### 7. Central Operations & Admin Dashboard
- **KPI Metrics**: Real-time inventory asset valuation ($ USD), lifetime commercial sales volume, active catalog items count, pending RFQ requests.
- **Category Stock Bar Breakdown**: Visual distribution of stock levels across categories.
- **Inventory CRUD**: Add new parts with live image assignment, edit prices/stock on the fly, or delete items.
- **RFQ Status Workflow**: Update quotation statuses (*Submitted ➔ Under Review ➔ Quote Sent ➔ Approved*).

---

## 🛠️ Technology Stack

| Component | Technology | Rationale |
|-----------|------------|-----------|
| **Backend Runtime** | Node.js (v24 LTS) | High-throughput asynchronous non-blocking I/O |
| **Web Server / REST API** | Express.js 4.x | Clean, battle-tested REST routing & middleware |
| **Data Persistence** | Structured JSON Store | Zero-friction setup; persistent without requiring external database installation |
| **Styling & Design System** | Vanilla CSS3 Custom Properties | Deep industrial palette (`#070B19`), glassmorphism, responsive grid, micro-animations |
| **Client Scripting** | Vanilla ES6 Modules | Zero frontend build step failures, ultra-fast load times, native browser support |
| **Typography** | Outfit, Inter, JetBrains Mono | Clean engineering aesthetics for technical specifications |
| **Icons** | FontAwesome 6 | Standard industrial and mechanical iconography |

---

## 🏃‍♂️ How to Run Locally

### Prerequisites
- Node.js (v18 or higher) installed on your machine.

### Installation & Launch
1. Open a terminal in the project directory:
   ```bash
   cd "c:\Users\asus\Desktop\major project"
   ```

2. Dependencies are already installed. If running on a new machine:
   ```bash
   npm install
   ```

3. Start the application:
   ```bash
   npm start
   # or
   node server.js
   ```

4. Open your web browser and visit:
   ```
   http://localhost:5000
   ```

---

## 🌐 Web Routes & Application Pages

| URL Route | Description |
|-----------|-------------|
| `http://localhost:5000/` | Main Storefront, 3D Schematic Explorer, Equipment Finder, Featured Inventory |
| `http://localhost:5000/catalog.html` | Comprehensive Faceted Parts Catalog Browser with Multi-Filter Sidebar |
| `http://localhost:5000/rfq.html` | B2B Commercial RFQ Tender Generator & Quotation Tracker |
| `http://localhost:5000/fleet.html` | "My Plant Fleet" Equipment Registry & Maintenance Kit Linker |
| `http://localhost:5000/admin.html` | Administrator & Logistics Command Dashboard with KPI Analytics |
| `http://localhost:5000/api/products/TT-BLD-0101/datasheet` | Printable ISO 9001 Technical Specification Datasheet |

---

## 🔌 RESTful API Reference

### Products
- `GET /api/products`: List all products (supports query params: `search`, `category`, `manufacturer`, `turbineModel`, `turbineSection`, `inStock`, `sort`).
- `GET /api/products/:id`: Get single product details + related components.
- `POST /api/products`: Add new spare part (Admin).
- `PUT /api/products/:id`: Modify part pricing, stock, or details (Admin).
- `DELETE /api/products/:id`: Remove part from inventory (Admin).

### Reference Data
- `GET /api/categories`: Returns categories with real-time live component counts.
- `GET /api/manufacturers`: OEM manufacturers directory.
- `GET /api/turbines`: Equipment classification & turbine models.

### Commercial & Quotations
- `POST /api/rfq`: Submit B2B quotation inquiry; computes volume tiers and stores quotation.
- `GET /api/rfqs`: Retrieve all submitted RFQs.
- `PUT /api/rfqs/:id/status`: Update status (*Submitted*, *Reviewing*, *Quote Sent*, *Approved*).
- `POST /api/orders`: Place commercial purchase order; decrements stock.
- `GET /api/orders`: List all orders.

### Fleet & Operations
- `GET /api/fleet`: Retrieve registered plant turbines.
- `POST /api/fleet`: Register new turbine asset.
- `DELETE /api/fleet/:id`: Remove machine from fleet.
- `GET /api/stats`: Dashboard analytics (Inventory value, orders revenue, pending RFQs).

---

## 🏆 Academic Presentation Highlights for Evaluation

When demonstrating TurbineTek to your professor or evaluator, be sure to highlight:
1. **The Core Vision**: "Just like Onergys in Europe, TurbineTek unifies the fragmented power plant aftermarket supply chain under one roof."
2. **The 3D Turbine Schematic**: Demonstrate hovering over different turbine stages (Compressor, Combustor, Turbine, Exhaust) to show live pressure, temperature, and RPM telemetry, then click to filter the exact replacement parts.
3. **The OEM Cross-Reference Search**: Type `GI3-1` or `314A5600P001` into the search bar to demonstrate instant aftermarket replacement mapping.
4. **The B2B Quotation (RFQ) Flow**: Walk through adding items to the tender list, showing the automated B2B discount calculation, and opening the official generated quotation document.
5. **Printable Technical Datasheet**: Click "Printable Datasheet" on any part to show the ISO 9001 / EN 10204 3.1 material test certificate layout.
6. **Operations Command Hub (`admin.html`)**: Show real-time KPI metrics, stock adjustment, and quote status workflow.
