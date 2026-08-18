-- Clear Haroti demo/seed data while keeping:
--   - stations + tanks (network structure, stock zeroed)
--   - product catalog, price list, channel prices
--   - admin user + walk-in customer
--   - workflow definitions
--   - real Zhongyi PAYC meters (IMEI 863459...)

BEGIN;

-- Unlink real PAYC meters from demo customers before customer delete
UPDATE payc_meters
SET customer_id = NULL
WHERE imei LIKE '863459%';

-- Demo PAYC meters only (keep real Zhongyi imports)
DELETE FROM payc_credit_transactions
WHERE meter_id IN (
  SELECT id FROM payc_meters
  WHERE meter_serial LIKE 'PAYC-%'
     OR imei LIKE '35901234567890%'
);

DELETE FROM payc_telemetry
WHERE meter_id IN (
  SELECT id FROM payc_meters
  WHERE meter_serial LIKE 'PAYC-%'
     OR imei LIKE '35901234567890%'
);

DELETE FROM payc_meters
WHERE meter_serial LIKE 'PAYC-%'
   OR imei LIKE '35901234567890%';

-- Transactional / operational demo data
TRUNCATE TABLE
  paychangu_webhooks,
  paychangu_transactions,
  notification_deliveries,
  notifications,
  notification_preferences,
  approval_tasks,
  loyalty_transactions,
  loyalty_accounts,
  customer_otp_challenges,
  refill_requests,
  agent_commissions,
  franchise_settlement_lines,
  franchise_settlements,
  project_expenditures,
  project_milestones,
  capital_projects,
  maintenance_work_orders,
  maintenance_plans,
  loss_case_actions,
  loss_cases,
  tank_readings,
  telemetry_readings,
  cylinder_stocktake_lines,
  cylinder_stocktakes,
  cylinder_movements,
  delivery_allocations,
  deliveries,
  sale_payments,
  sale_items,
  sales,
  shifts,
  expenses,
  transfer_items,
  transfers,
  stock_movements,
  requisition_lines,
  requisitions,
  purchase_order_lines,
  purchase_orders,
  procurement_documents,
  supplier_invoices,
  customer_payments,
  mobile_money_lines,
  bank_statement_lines,
  cash_deposits,
  journal_lines,
  journal_entries,
  job_runs,
  audit_logs,
  attachments,
  targets,
  safety_incidents,
  compliance_items,
  accessory_stock,
  product_bundle_items,
  product_bundles,
  budget_lines,
  franchise_agreements,
  assets,
  iot_devices,
  cylinders
RESTART IDENTITY CASCADE;

-- Demo suppliers (before customers — FK)
DELETE FROM suppliers;

-- Demo customers (keep walk-in for POS)
DELETE FROM customers
WHERE customer_code <> 'WALK-IN';

-- Demo users (keep admin)
DELETE FROM users
WHERE username <> 'admin';

-- Reset station stock to zero (seed had fake stock levels)
UPDATE stations
SET current_stock_kg = 0,
    last_synced_at = NOW();

UPDATE tanks
SET current_stock_kg = 0;

COMMIT;
