# Haroti Holdings LPG Management System

Centralized multi-station LPG operations and retail management for **Haroti Holdings Limited** (trading as **Haroti Gas**) — covering Salima, Lilongwe and Blantyre stations with offline-capable station POS, stock control, shifts, transfers, management dashboards, and **ERP charter modules** aligned to the Haroti Gas Project Charter (Aug 2026).

## 🚀 Quick Links

- **[Quick Start Guide](./QUICKSTART.md)** - Get up and running in 5 minutes
- **[Domain Setup Guide](./docs/DOMAIN_SETUP.md)** - Configure custom domain with SSL/HTTPS
- **[Deployment Notes](./README.DEPLOY.md)** - Production VPS deployment details

## ERP charter alignment (Phase 1)

| Charter module | Status in this build |
|----------------|----------------------|
| Core Financials (GL journal stubs) | Active — auto-posting on sales, GRN, PAYC burn |
| Sales Management (LPG + accessories) | Active — unified POS, credit limits, channels |
| Inventory & Gas Loss | Active — bulk LPG + accessory stock |
| PAYC & IoT | Integration stub — meter fleet + telemetry API |
| Procurement & Landed Cost | Active — PO workflow, freight/duty allocation |
| Expense & Cash | Active |
| Budgeting & BI | Partial — budget lines + executive report |
| Asset Management (CMMS) | Partial — hydro-test work orders |
| Capital Projects | Planned (Phase 3) |
| Accessories & Merchandising | Active — channel pricing, bundles, consignment stock |

See **Executive BI** in the app for live module rollout status.

## Network

| Code   | Station              | District  |
|--------|----------------------|-----------|
| SAL-01 | Salima Central       | Salima    |
| LLW-01 | Lilongwe Area 25     | Lilongwe  |
| LLW-02 | Lilongwe Kawale      | Lilongwe  |
| LLW-03 | Lilongwe Area 3      | Lilongwe  |
| BT-01  | Blantyre Chichiri    | Blantyre  |
| BT-02  | Blantyre Limbe       | Blantyre  |
| BT-03  | Blantyre Ndirande    | Blantyre  |
| BT-04  | Blantyre Zingwangwa  | Blantyre  |

## MVP modules (Release 1)

- Station & user management with role-based access
- LPG stock movements and variance tracking
- Supplier deliveries
- Weight-based refill sales / POS
- Payment methods (cash, Airtel Money, TNM Mpamba, bank, card, credit)
- Shift open/close with cash & stock reconciliation
- Cylinder register
- Station-to-station transfers
- Expenses and bank deposits
- Executive dashboard and audit trail
- Offline sale queue (PWA) with sync when connectivity returns

## Tech stack

| Layer      | Choice                                      |
|------------|---------------------------------------------|
| Frontend   | React + TypeScript + Vite PWA               |
| Backend    | NestJS + TypeScript                         |
| Database   | PostgreSQL 16                               |
| Cache/jobs | Redis 7                                     |
| Deploy     | Docker Compose + Nginx                      |

> NestJS was selected for this implementation (the plan also allows ASP.NET Core). The domain model and controls follow the Haroti Holdings LPG system plan.

## Quick start (Docker)

```bash
docker compose up --build
```

- Web app: http://localhost:8088  
- API: http://localhost:3000/api  
- Swagger: http://localhost:3000/api/docs  

## Local development

### 1. Start infrastructure

```bash
docker compose up -d postgres redis
```

### 2. Backend

```bash
cd backend
cp .env.example .env
npm install
npm run start:dev
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

- App: http://localhost:5173  
- API proxy: `/api` → `http://localhost:3000`

## Demo users

Password for all seeded users: `Password123!`

| Username          | Role              |
|-------------------|-------------------|
| admin             | System Admin      |
| director          | Director          |
| ops.manager       | Operations Mgr    |
| finance           | Finance Manager   |
| llw01.manager     | Station Manager   |
| llw01.attendant   | Attendant (LLW-01)|
| bt01.attendant    | Attendant (BT-01) |
| sal01.attendant   | Attendant (SAL-01)|
| storekeeper       | Storekeeper       |
| safety            | Safety Officer    |
| auditor           | Auditor           |

## Core stock formula

```
Expected Closing Stock =
  Opening Stock + LPG Received + Transfers In
  − LPG Sold − Transfers Out − Recorded Losses

Stock Variance = Physical Closing Stock − Expected Closing Stock
```

## Refill calculation

```
LPG Quantity = Filled Weight − Empty Cylinder Weight
Sale Amount  = LPG Quantity × Selling Price per Kilogram
```

## Project layout

```
LPG/
├── backend/          NestJS API
├── frontend/         React PWA
├── docker-compose.yml
└── README.md
```

## Roadmap

- **Release 2:** Full cylinder lifecycle, safety checklists, maintenance work orders
- **Release 3:** Customer ordering app, mobile-money APIs, scale integration, accounting sync

## License

Proprietary — Haroti Holdings Limited. All rights reserved.
