SELECT 'users' AS item, COUNT(*)::text AS count FROM users
UNION ALL SELECT 'customers', COUNT(*)::text FROM customers
UNION ALL SELECT 'cylinders', COUNT(*)::text FROM cylinders
UNION ALL SELECT 'sales', COUNT(*)::text FROM sales
UNION ALL SELECT 'payc_meters', COUNT(*)::text FROM payc_meters
UNION ALL SELECT 'assets', COUNT(*)::text FROM assets;
