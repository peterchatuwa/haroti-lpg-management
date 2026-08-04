/**
 * Live pilot checklist against production or staging API.
 * Usage: node scripts/pilot-checklist.mjs [baseUrl]
 */
const BASE = process.argv[2] ?? 'http://169.58.127.129/api';
const USER = process.env.PILOT_USER ?? 'admin';
const PASS = process.env.PILOT_PASS ?? 'Password123!';

async function req(method, path, token, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  return { status: res.status, data };
}

function ok(name, pass, detail = '') {
  console.log(`${pass ? '✅' : '❌'} ${name}${detail ? ` — ${detail}` : ''}`);
  return pass;
}

async function main() {
  console.log(`Pilot checklist → ${BASE}\n`);

  const login = await req('POST', '/auth/login', null, {
    username: USER,
    password: PASS,
  });
  if (!ok('Login', login.status === 200 || login.status === 201, `HTTP ${login.status}`)) {
    process.exit(1);
  }
  const token = login.data.accessToken;

  const stations = await req('GET', '/stations', token);
  const stationId = stations.data?.[0]?.id;
  ok('List stations', stations.status === 200 && !!stationId);

  const shiftOpen = await req('POST', '/shifts/open', token, {
    stationId,
    openingCashFloat: 50000,
  });
  let shiftId = shiftOpen.data?.id;
  if (shiftOpen.status !== 201 && shiftOpen.status !== 200) {
    const current = await req('GET', `/shifts/current?stationId=${stationId}`, token);
    shiftId = current.data?.id;
  }
  ok(
    'Open shift',
    !!shiftId,
    shiftOpen.data?.message ?? (shiftId ? 'reused open shift' : `HTTP ${shiftOpen.status}`),
  );

  const sale = await req('POST', '/sales', token, {
    stationId,
    shiftId,
    clientTxnId: crypto.randomUUID(),
    items: [
      {
        itemName: '12 kg LPG Refill',
        cylinderSizeKg: 12,
        emptyWeightKg: 14.2,
        filledWeightKg: 26.2,
        lpgQuantityKg: 12,
        unitPrice: 1850,
        quantity: 1,
      },
    ],
    payments: [{ method: 'CASH', amount: 22200 }],
  });
  ok('Cash sale', sale.status === 201 || sale.status === 200, sale.data?.receiptNumber);

  const customers = await req('GET', '/customers', token);
  const creditCustomer = (customers.data ?? []).find(
    (c) => Number(c.creditLimit) > 0,
  );
  if (creditCustomer) {
    const creditSale = await req('POST', '/sales', token, {
      stationId,
      shiftId,
      customerId: creditCustomer.id,
      clientTxnId: crypto.randomUUID(),
      items: [
        {
          itemName: '6 kg LPG Refill',
          cylinderSizeKg: 6,
          emptyWeightKg: 7,
          filledWeightKg: 13,
          lpgQuantityKg: 6,
          unitPrice: 1850,
          quantity: 1,
        },
      ],
      payments: [{ method: 'CUSTOMER_ACCOUNT', amount: 11100 }],
    });
    ok('Credit sale', creditSale.status === 201 || creditSale.status === 200);

    const payment = await req('POST', `/customers/${creditCustomer.id}/payments`, token, {
      amount: 5000,
      paymentMethod: 'CASH',
      clientTxnId: crypto.randomUUID(),
    });
    ok('Customer payment', payment.status === 201 || payment.status === 200);
  } else {
    ok('Credit sale', false, 'no credit customer');
    ok('Customer payment', false, 'skipped');
  }

  const conflict = await req('POST', '/sales', token, {
    stationId,
    shiftId,
    clientTxnId: 'pilot-conflict-test',
    items: [
      {
        itemName: '12 kg LPG Refill',
        cylinderSizeKg: 12,
        emptyWeightKg: 14.2,
        filledWeightKg: 26.2,
        lpgQuantityKg: 12,
        unitPrice: 1850,
        quantity: 1,
      },
    ],
    payments: [{ method: 'CASH', amount: 22200 }],
  });
  await req('POST', '/sales', token, {
    stationId,
    shiftId,
    clientTxnId: 'pilot-conflict-test',
    items: [
      {
        itemName: '12 kg LPG Refill',
        cylinderSizeKg: 12,
        emptyWeightKg: 14.2,
        filledWeightKg: 30,
        lpgQuantityKg: 15.8,
        unitPrice: 1850,
        quantity: 1,
      },
    ],
    payments: [{ method: 'CASH', amount: 29230 }],
  });
  const conflict2 = await req('POST', '/sales', token, {
    stationId,
    shiftId,
    clientTxnId: 'pilot-conflict-test',
    items: [
      {
        itemName: '12 kg LPG Refill',
        cylinderSizeKg: 12,
        emptyWeightKg: 14.2,
        filledWeightKg: 30,
        lpgQuantityKg: 15.8,
        unitPrice: 1850,
        quantity: 1,
      },
    ],
    payments: [{ method: 'CASH', amount: 29230 }],
  });
  ok('Offline conflict 409', conflict2.status === 409);

  const suppliers = await req('GET', '/suppliers', token);
  const supplierId = suppliers.data?.[0]?.id;
  const products = await req('GET', '/accessories/catalog', token);
  const productId = products.data?.[0]?.id;

  const po = await req('POST', '/procurement/orders', token, {
    supplierId,
    destinationStationId: stationId,
    freightCost: 0,
    customsDuty: 0,
    clearingFees: 0,
    notes: 'Pilot PO',
    lines: [
      {
        productId,
        itemDescription: products.data?.[0]?.name ?? 'Pilot item',
        quantity: 2,
        unitCost: 5000,
      },
    ],
  });
  ok('Create PO draft', po.status === 201 || po.status === 200, `HTTP ${po.status}`);

  const agreements = await req('GET', '/franchise/agreements', token);
  const agreementId = agreements.data?.[0]?.id;
  if (agreementId) {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1)
      .toISOString()
      .slice(0, 10);
    const end = now.toISOString().slice(0, 10);
    const settlement = await req('POST', '/franchise/settlements/generate', token, {
      agreementId,
      periodStart: start,
      periodEnd: end,
    });
    ok(
      'Franchise settlement',
      settlement.status === 201 || settlement.status === 200,
      `HTTP ${settlement.status}`,
    );
  } else {
    ok('Franchise settlement', false, 'no agreement');
  }

  const suppliersList = await req('GET', '/suppliers', token);
  const lpgSupplier = suppliersList.data?.[0]?.id;
  if (lpgSupplier && stationId) {
    const delivery = await req('POST', '/deliveries', token, {
      supplierId: lpgSupplier,
      stationId,
      deliveryDate: new Date().toISOString().slice(0, 10),
      quantityOrderedKg: 500,
      quantityDispatchedKg: 500,
      quantityReceivedKg: 498,
      buyingPricePerKg: 1200,
    });
    ok('LPG delivery', delivery.status === 201 || delivery.status === 200, `HTTP ${delivery.status}`);
  } else {
    ok('LPG delivery', false, 'missing supplier/station');
  }

  const journals = await req('GET', '/finance/journals', token);
  ok('Journal list', journals.status === 200);

  console.log('\nDone.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
