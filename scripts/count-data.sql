SELECT 'stations' t, COUNT(*) c FROM stations
UNION ALL SELECT 'users', COUNT(*) FROM users
UNION ALL SELECT 'customers', COUNT(*) FROM customers
UNION ALL SELECT 'cylinders', COUNT(*) FROM cylinders
UNION ALL SELECT 'products', COUNT(*) FROM products
UNION ALL SELECT 'sales', COUNT(*) FROM sales
UNION ALL SELECT 'payc_meters', COUNT(*) FROM payc_meters
UNION ALL SELECT 'payc_telemetry', COUNT(*) FROM payc_telemetry
UNION ALL SELECT 'accessory_stock', COUNT(*) FROM accessory_stock
UNION ALL SELECT 'assets', COUNT(*) FROM assets
UNION ALL SELECT 'capital_projects', COUNT(*) FROM capital_projects
UNION ALL SELECT 'franchise_agreements', COUNT(*) FROM franchise_agreements
UNION ALL SELECT 'budget_lines', COUNT(*) FROM budget_lines
UNION ALL SELECT 'iot_devices', COUNT(*) FROM iot_devices
ORDER BY t;
