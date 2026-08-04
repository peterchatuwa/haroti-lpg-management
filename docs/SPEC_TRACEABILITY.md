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

- SMS/customer notifications
- Hardware scale integration
- PDF export for procurement documents
- Advanced franchise consignment settlement



---



## Manual pilot checklist (before station go-live)



- [ ] Open shift → verify tank reading recorded

- [ ] Complete refill sale → journal entry for revenue + COGS at station WAC

- [ ] Credit customer sale → AR balance increases, GL 1310/4200

- [ ] Record customer payment → AR balance decreases, GL 1100/1310

- [ ] Supplier delivery → station WAC updated

- [ ] Generate franchise settlement → status INVOICED + GL 1300/4350

- [ ] Hydro cylinders due → work orders auto-created daily

- [ ] Offline sale replay with changed payload → 409 conflict surfaced in UI
- [ ] Register customer as vendor → create PO → walk through to PAID with all 4 documents



---



*Last updated: Tier D procurement & vendors. Regenerate when adding next phase items.*

