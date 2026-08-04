# Haroti LPG ERP — Spec Traceability Matrix

This document maps **Tier B pilot requirements** to implementation artifacts and tests so we can verify spec compliance before go-live.

## How to use this matrix

| Status | Meaning |
|--------|---------|
| **DONE** | Requirement implemented with automated or manual test evidence |
| **PARTIAL** | Core flow exists; edge cases or UI polish remain |
| **MISSING** | Not yet implemented (Tier C/D) |

**Three-layer compliance process:**

1. **Traceability** — each spec ID below links to code + test (this file).
2. **Acceptance tests** — `backend/test/tier-a.e2e-spec.ts` and `backend/test/tier-b.e2e-spec.ts` cover charter AC items.
3. **Phase gates** — Tier A (production controls) → Tier B (pilot ops) → Tier C/D before full network rollout.

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

## Tier B — Pilot operations (this release)

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

## Frontend coverage (Tier B)

| Feature | Page | API |
|---------|------|-----|
| Gas reconciliation | `InventoryPage.tsx` | `GET /tanks/reconciliation` |
| Cylinder swap | `CylindersPage.tsx` | `POST /cylinders/swap` |
| Expense approval | `ExpensesPage.tsx` | `POST /expenses/:id/approve` |
| Discount queue | `PosPage.tsx` | `GET /sales/pending-discounts`, `POST /sales/:id/approve-discount` |
| Finance GL | `FinancePage.tsx` | `GET /finance/journals`, `/finance/trial-balance` |
| MoMo import | `FinancePage.tsx` | `POST /banking/mobile-money/import` |

---

## Tier C/D — Not in scope (next phase)

- Full offline sync conflict resolution
- Hydro test scheduling workflows
- Tank costing from weighted average deliveries
- Franchise settlement auto-posting to GL
- SMS/customer notifications
- Hardware scale integration

---

## Manual pilot checklist (before station go-live)

- [ ] Open shift → verify tank reading recorded
- [ ] Complete refill sale → journal entry for revenue + COGS
- [ ] Apply discount above attendant limit → manager approval required
- [ ] Submit expense > MWK 50,000 → approve → GL line 6100/1110
- [ ] Run gas reconciliation for week → loss case if variance > 2%
- [ ] Import MoMo CSV → matched lines show MATCHED status
- [ ] Cylinder swap incoming/outgoing → movement history updated

---

*Last updated: Tier B implementation. Regenerate this matrix when adding Tier C items.*
