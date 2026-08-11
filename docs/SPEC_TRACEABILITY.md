# Haroti LPG ERP — Spec Traceability Matrix



This document maps **Tier B/C pilot requirements** to implementation artifacts and tests so we can verify spec compliance before go-live.



## How to use this matrix



| Status | Meaning |

|--------|---------|

| **DONE** | Requirement implemented with automated or manual test evidence |

| **PARTIAL** | Core flow exists; edge cases or UI polish remain |

| **MISSING** | Not yet implemented (Tier D+) |



**Three-layer compliance process:**



1. **Traceability** — each spec ID below links to code + test (this file).

2. **Acceptance tests** — `backend/test/tier-a.e2e-spec.ts`, `tier-b.e2e-spec.ts`, `tier-c.e2e-spec.ts` cover charter AC items.

3. **Phase gates** — Tier A (production controls) → Tier B (pilot ops) → Tier C (AR/costing) → Tier D before full network rollout.



Run verification:



```bash

cd backend && npm test && npm run test:e2e

cd ../frontend && npm run build

```



---



## Tier A — Production controls (complete)



| Spec ID | Requirement | Code | Test |

|---------|-------------|------|------|

| SAL-001 | Sales require open shift | `shifts/shifts.service.ts` `requireOpenShiftForSale` | `tier-a.e2e-spec.ts` AC-02 |

| SAL-002 | Shift lock after approval | `shifts/shift.entity.ts` `lockedAt` | `shifts.service.spec.ts` |

| FIN-001 | LPG sale posts revenue + COGS | `finance/finance.service.ts` `postLpgRefillSale` | `finance.service.spec.ts` |

| SEC-001 | Station-scoped RBAC | `auth/station-scope.service.ts` | `station-scope.service.spec.ts` |

| AUD-001 | Immutable financial records | `database/immutable-record.subscriber.ts` | `immutable.e2e-spec.ts` |



---



## Tier B — Pilot operations (complete)



| Spec ID | Requirement | Code | Test | Status |

|---------|-------------|------|------|--------|

| LPG-004 | Tank entity per station | `tanks/tank.entity.ts`, `seed/seed.service.ts` `ensureTierBTanks` | `tier-b.e2e-spec.ts` | DONE |

| LPG-005 | Tank readings at shift open/close | `shifts/shifts.service.ts`, `tanks/tanks.service.ts` | `tier-b.e2e-spec.ts` | DONE |

| LPG-006 | Gas reconciliation report | `tanks/tanks.service.ts` `gasReconciliation` | `tier-b.e2e-spec.ts` | DONE |

| LPG-007 | Loss threshold alerts (2%) | `tanks/tanks.service.ts`, `loss-case.entity.ts` | `tier-b.e2e-spec.ts` | DONE |

| CYL-003 | Cylinder movement API | `cylinders/cylinder-movement.entity.ts` | `tier-b.e2e-spec.ts` | DONE |

| CYL-004 | Swap workflow | `cylinders/cylinders.service.ts` `swap` | `tier-b.e2e-spec.ts` | DONE |

| SAL-009 | Discount approval threshold | `sales/sales.service.ts` | `tier-b.e2e-spec.ts` | DONE |

| FIN-003 | Expense GL on approve | `expenses/expenses.service.ts`, `finance/finance.service.ts` | `tier-b.e2e-spec.ts` | DONE |

| FIN-004 | Journal list + trial balance | `finance/finance.controller.ts` | `tier-b.e2e-spec.ts` | DONE |

| FIN-005 | MoMo settlement CSV import | `banking/banking.service.ts` | `tier-b.e2e-spec.ts` | DONE |



---



## Tier C — AR, costing & automation (this release)



| Spec ID | Requirement | Code | Test | Status |

|---------|-------------|------|------|--------|

| FIN-006 | Customer statement with payments | `customers/customers.service.ts` `statement` | `tier-c.e2e-spec.ts` | DONE |

| FIN-007 | Customer payment posts AR relief | `customers/customers.service.ts` `recordPayment`, `finance/finance.service.ts` | `tier-c.e2e-spec.ts`, `finance.service.spec.ts` | DONE |

| FIN-008 | Credit sale GL (DR 1310 / CR 4200) | `finance/finance.service.ts` `postCreditSale`, `sales/sales.service.ts` | `finance.service.spec.ts` | DONE |

| LPG-008 | Weighted avg tank costing on delivery | `stations/stations.service.ts` `updateWeightedAvgCost`, `deliveries/deliveries.service.ts` | manual | DONE |

| LPG-009 | Dynamic COGS from station WAC | `sales/sales.service.ts` `finalizeSale`, `finance/finance.service.ts` | `finance.service.spec.ts` | DONE |

| FRN-001 | Franchise settlement auto-post to GL | `franchise/franchise.service.ts` `generateSettlement` | `tier-c.e2e-spec.ts` | DONE |

| MNT-001 | Hydro test scheduling (daily cron) | `maintenance/maintenance.scheduler.ts`, `maintenance.service.ts` | `tier-c.e2e-spec.ts` | DONE |

| SAL-010 | Offline sync conflict detection (409) | `sales/sales.service.ts`, `frontend/src/store/offline.ts` | manual | DONE |



---



## Frontend coverage (Tier B/C)



| Feature | Page | API |

|---------|------|-----|

| Gas reconciliation | `InventoryPage.tsx` | `GET /tanks/reconciliation` |

| Cylinder swap | `CylindersPage.tsx` | `POST /cylinders/swap` |

| Expense approval | `ExpensesPage.tsx` | `POST /expenses/:id/approve` |

| Discount queue | `PosPage.tsx` | `GET /sales/pending-discounts`, `POST /sales/:id/approve-discount` |

| Finance GL | `FinancePage.tsx` | `GET /finance/journals`, `/finance/trial-balance` |

| MoMo import | `FinancePage.tsx` | `POST /banking/mobile-money/import` |

| Customer statement + payment | `CustomerStatementPage.tsx` | `GET /customers/:id/statement`, `POST /customers/:id/payments` |

| Franchise GL status | `FranchisePage.tsx` | `POST /franchise/settlements/generate` |

| Offline conflict alerts | `Layout.tsx`, `App.tsx` | `POST /sales` (409 on mismatch) |
| Vendor registration | `ProcurementPage.tsx` | `POST /suppliers`, `GET /suppliers/eligible-customers` |
| Procurement documents | `ProcurementPage.tsx` | `GET /procurement/documents/:id` |



---



## Tier D — Procurement & vendors (this release)

| Spec ID | Requirement | Code | Test | Status |
|---------|-------------|------|------|--------|
| PROC-001 | Vendors from customers only | `suppliers/suppliers.service.ts` | `tier-d.e2e-spec.ts` | DONE |
| PROC-002 | Full PO workflow with documents | `procurement/procurement.service.ts` | `tier-d.e2e-spec.ts` | DONE |
| PROC-003 | Auto-generate Quotation / PO / Invoice / Receipt | `procurement/procurement-documents.service.ts` | manual | DONE |
| FIN-009 | Supplier payment GL (DR 2100 / CR 1100) | `finance/finance.service.ts` | manual | DONE |

Workflow: **DRAFT** (+ Quotation) → submit → **PENDING_APPROVAL** → approve (+ PO) → place-order (+ Invoice) → receive (+ Receipt + GRN GL) → pay (+ AP GL) → **PAID**

---

## Tier D — Remaining (next phase)

| Spec ID | Requirement | Code | Test | Status |
|---------|-------------|------|------|--------|
| NOTIF-001 | SMS on payment / credit / hydro WO | `notifications/notifications.service.ts` | `tier-d-plus.e2e-spec.ts` | DONE |
| PROC-004 | PDF export for procurement docs | `procurement/procurement-documents.service.ts` | `tier-d-plus.e2e-spec.ts` | DONE |
| FRN-002 | Franchise consignment GL auto-post | `finance/finance.service.ts`, `franchise/franchise.service.ts` | manual | DONE |
| POS-001 | Hardware scale (Web Serial) on POS | `frontend/src/lib/useSerialScale.ts`, `PosPage.tsx` | manual | DONE |
| UX-001 | Global search | `search/search.service.ts`, `GlobalSearch.tsx` | manual | DONE |
| FIN-011 | Financial statements (P&L, BS, cash flow) | `finance/finance.service.ts`, `FinancePage.tsx` | manual | DONE |

Configure SMS in production `.env`: `SMS_ENABLED=true`, `SMS_API_URL`, `SMS_API_KEY`, optional `SMS_OPS_PHONE`.

---

## Phase 2 — LPG excellence (complete)

| Spec ID | Requirement | Code | Test | Status |
|---------|-------------|------|------|--------|
| LPG-002 | Runout forecasting | `tanks/tanks.service.ts` `runoutForecast`, `GET /tanks/runout-forecast` | manual | DONE |
| LPG-003 | Reorder engine | `tanks/tanks.service.ts` `reorderSuggestions`, `GET /tanks/reorder-suggestions` | manual | DONE |
| CYL-001 | QR cylinder identifier | `cylinders/cylinders.service.ts`, `GET /cylinders/lookup/:serial` | manual | DONE |
| CYL-002 | Cylinder passport | `cylinders/cylinders.service.ts`, `GET /cylinders/:id/passport` | manual | DONE |
| CYL-006 | Cylinder stocktake | `cylinders/cylinder-stocktake.entity.ts`, `POST /cylinders/stocktakes` | manual | DONE |
| SAFE-001 | Incident register | `safety/safety.service.ts`, `POST /safety/incidents` | manual | DONE |
| SAFE-002 | Investigation workflow | `safety/safety.service.ts`, `PATCH /safety/incidents/:id` | manual | DONE |
| SAFE-004 | Compliance calendar | `safety/safety.service.ts`, `GET /safety/compliance/calendar` | manual | DONE |
| CMMS-001 | Maintenance plans | `maintenance/maintenance.service.ts`, `GET/POST /maintenance/plans` | manual | DONE |
| MAP-001 | Station health status | `stations/network.service.ts` `mapOverview` | manual | DONE |
| MAP-002 | Station popover detail | `stations/network.service.ts`, `GET /network/map` | manual | DONE |
| DEL-002 | Multi-drop allocation | `deliveries/delivery-allocation.entity.ts`, `POST /deliveries/:id/allocations` | manual | DONE |
| DEL-003 | Suggested allocation | `deliveries/deliveries.service.ts`, `GET /deliveries/suggested-allocation` | manual | DONE |

Migration: `backend/src/database/migrations/1735696000000-Phase2Improvement.ts`

---

## Phase 3 — Automation (complete)

| Spec ID | Requirement | Code | Test | Status |
|---------|-------------|------|------|--------|
| AUTO-001 | Workflow engine | `workflows/workflows.service.ts`, `GET /workflows/definitions` | manual | DONE |
| AUTO-002 | Approval inbox | `workflows/workflows.service.ts`, `GET /approval-tasks` | manual | DONE |
| AUTO-003 | Escalation | `workflows/workflows.service.ts` `escalateOverdue`, `jobs/jobs.service.ts` hourly cron | manual | DONE |
| AUTO-004 | Notification service | `notifications/notifications.service.ts`, adapters in `notifications/adapters/` | manual | DONE |
| AUTO-005 | Notification reliability | `notifications/notifications.service.ts` `processQueue`, 5-min cron | manual | DONE |
| CMMS-005 | IoT telemetry ingestion | `iot/iot.service.ts`, `POST /iot/telemetry` (`x-iot-api-key`) | manual | DONE |
| STAFF-001 | Attendant scorecard | `analytics/staff-analytics.service.ts`, `GET /analytics/staff/attendants` | manual | DONE |
| STAFF-002 | Manager scorecard | `analytics/staff-analytics.service.ts`, `GET /analytics/staff/managers` | manual | DONE |
| STAFF-003 | Fair comparison filters | `analytics/staff-analytics.service.ts` station/period query params | manual | DONE |

Migration: `backend/src/database/migrations/1735782400000-Phase3Improvement.ts`

Configure IoT in production `.env`: `IOT_API_KEY` (defaults to `haroti-iot-dev` in development).

---

## Phase 4 — Strategic growth (complete)

| Spec ID | Requirement | Code | Test | Status |
|---------|-------------|------|------|--------|
| CRM-004 | Loyalty ledger | `loyalty/loyalty.service.ts`, `sales/sales.service.ts` `finalizeSale` hook | manual | DONE |
| CRM-001 | Customer 360 profile | `customers/customers.service.ts` `profile360`, `CustomerProfilePage.tsx` | manual | DONE |
| CUSTAPP-001 | Customer OTP authentication | `customer-portal/customer-portal.service.ts`, scoped `CustomerAuthGuard` JWT | manual | DONE |
| CUSTAPP-002 | Self-service (prices, receipts, statement) | `customer-portal/customer-portal.controller.ts` | manual | DONE |
| CUSTAPP-003 | Refill/delivery requests | `customer-portal/refill-request.entity.ts`, admin `PATCH /customer-portal/admin/refill-requests/:id` | manual | DONE |
| CUSTAPP-004 | Digital communication via portal | `customer-portal/customer-portal.service.ts` receipts/statement/PAYC | manual | DONE |
| AI-001 | Demand forecast | `ai/ai-insights.service.ts`, `GET /ai/forecasts/demand` | manual | DONE |
| AI-002 | Stockout risk | `ai/ai-insights.service.ts`, `GET /ai/stockout-risk` | manual | DONE |
| AI-003 | Anomaly detection | `ai/ai-insights.service.ts`, `GET /ai/anomalies` | manual | DONE |
| AI-004 | Natural-language analytics (read-only) | `ai/ai-insights.service.ts`, `POST /ai/analytics/query` | manual | DONE |
| AI-005 | No direct write access | AI module has no POST/PUT/PATCH for financial or stock entities | manual | DONE |

Migration: `backend/src/database/migrations/1735868800000-Phase4Improvement.ts`

Customer portal uses a separate JWT (`kind: 'customer'`) stored in `sessionStorage` — not the staff ERP token.

---

## Frontend coverage (Phases 2–4)

| Feature | Page | API |
|---------|------|-----|
| Network map | `NetworkMapPage.tsx` | `GET /network/map` |
| Runout / reorder | `InventoryPage.tsx` | `GET /tanks/runout-forecast`, `/tanks/reorder-suggestions` |
| Cylinder passport | `CylindersPage.tsx` | `GET /cylinders/:id/passport` |
| Cylinder stocktake | `CylindersPage.tsx` | `GET /cylinders/stocktakes/list`, `POST /cylinders/stocktakes` |
| Safety incidents | `SafetyPage.tsx` | `GET/POST /safety/incidents` |
| Compliance calendar | `SafetyPage.tsx` | `GET /safety/compliance/calendar` |
| Maintenance plans | `MaintenancePage.tsx` | `GET/POST /maintenance/plans` |
| Delivery allocation | `DeliveriesPage.tsx` | `GET /deliveries/suggested-allocation`, `POST /deliveries/:id/allocations` |
| Approval inbox | `ApprovalInboxPage.tsx` | `GET /approval-tasks`, `POST /approval-tasks/:id/approve` |
| Notifications | `NotificationsPage.tsx` | `GET /notifications` |
| Staff analytics | `StaffAnalyticsPage.tsx` | `GET /analytics/staff/attendants` |
| Customer portal (public) | `CustomerPortalPage.tsx` | `POST /customer-portal/auth/*`, scoped customer routes |
| AI insights | `InsightsPage.tsx` | `GET /ai/forecasts/demand`, `/ai/anomalies`, `POST /ai/analytics/query` |
| Loyalty admin | `LoyaltyPage.tsx` | `GET /loyalty/accounts`, `POST /loyalty/customers/:id/redeem` |
| Customer 360 profile | `CustomerProfilePage.tsx` | `GET /customers/:id/profile` |
| Refill requests | `RefillRequestsPage.tsx` | `GET /customer-portal/admin/refill-requests` |
| Customer portal entry | `LoginPage.tsx` | Link to `/portal` |
| Global search | `GlobalSearch.tsx` in `Layout.tsx` | `GET /search?q=` |
| Financial statements | `FinancePage.tsx` | `GET /finance/statements/income`, `/balance-sheet`, `/cash-flow` |

---

## Manual pilot checklist (before station go-live)

- [x] Open shift → verify tank reading recorded
- [x] Complete refill sale → journal entry for revenue + COGS at station WAC
- [x] Credit customer sale → AR balance increases, GL 1310/4200
- [x] Record customer payment → AR balance decreases, GL 1100/1310
- [x] Supplier delivery → station WAC updated
- [x] Generate franchise settlement → status INVOICED + GL 1300/4350 (+ consignment 1300/1220)
- [x] Hydro cylinders due → work orders auto-created daily
- [x] Offline sale replay with changed payload → 409 conflict surfaced in UI
- [x] Register customer as vendor → create PO → walk through to PAID with all 4 documents
- [x] Network map shows station health with runout days
- [x] Cylinder stocktake session → scan → close with variance
- [x] Approval task created → approve/reject from inbox → escalation after SLA
- [x] IoT telemetry POST updates tank reading
- [x] Customer portal OTP login → view receipts/statement → submit refill request
- [x] Loyalty points earned on cash sale → redeem from admin
- [x] AI insights: demand forecast, stockout risk, anomaly list, NL query (read-only)

Run automated pilot: `node scripts/pilot-checklist.mjs http://169.58.127.129/api`

---

*Last updated: Global search (UX-001) and financial statements (FIN-011).*

