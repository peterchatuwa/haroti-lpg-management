const apiBase = process.env.API_BASE || 'http://127.0.0.1:3000/api';

async function login() {
  const res = await fetch(`${apiBase}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: process.env.ADMIN_USER || 'admin',
      password: process.env.ADMIN_PASS || 'Password123!',
    }),
  });
  const data = await res.json();
  if (!data.accessToken) {
    throw new Error(`Login failed: ${JSON.stringify(data)}`);
  }
  return data.accessToken;
}

const token = await login();
const statusRes = await fetch(`${apiBase}/payc/vendor/status`, {
  headers: { Authorization: `Bearer ${token}` },
});
console.log('Vendor status:', JSON.stringify(await statusRes.json(), null, 2));

const importRes = await fetch(`${apiBase}/payc/import-vendor`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}` },
});
console.log('Import result:', JSON.stringify(await importRes.json(), null, 2));

const metersRes = await fetch(`${apiBase}/payc/meters`, {
  headers: { Authorization: `Bearer ${token}` },
});
const meters = await metersRes.json();
console.log(
  'Meters now:',
  meters.map((m) => ({
    serial: m.meterSerial,
    imei: m.imei,
    status: m.status,
  })),
);
