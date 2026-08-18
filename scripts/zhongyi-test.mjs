const baseUrl =
  process.env.ZHONGYI_API_URL ||
  'http://en.energy.zhongyismart.com/api/commonInternal.jsp';
const username = process.env.ZHONGYI_USERNAME || '';
const password = process.env.ZHONGYI_PASSWORD || '';

async function call(action, method, payload, token, bodyKey = 'params') {
  const requestParams = { action, method };
  if (token) requestParams.apiToken = token;
  requestParams[bodyKey] = payload;
  const body = new URLSearchParams({
    requestParams: JSON.stringify(requestParams),
  });
  const response = await fetch(baseUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  return response.json();
}

const login = await call('zlMeter', 'toLogin', { username, password });
console.log('LOGIN errcode:', login.errcode, login.errmsg);
console.log('Areas:', JSON.stringify(login.value?.manageArea, null, 2));
console.log('Equipment:', JSON.stringify(login.value?.equipmentModel, null, 2));

const token = login.value?.apiToken;
if (!token) process.exit(1);

const areaIds = [
  ...(login.value?.manageArea ?? []).map((a) => a.areaId),
  ...(login.value?.manageArea ?? [])
    .map((a) => a.parentId)
    .filter(Boolean),
];
const uniqueAreas = [...new Set(areaIds)];
const energyTypes = ['GAS', 'LIQUEFIEDGAS', 'WATER', 'ELECTRICITY'];

for (const areaId of uniqueAreas) {
  const households = await call(
    'zlMeter',
    'gethousehold',
    { pageNumber: '1', pageSize: '100', areaId: String(areaId), searchContent: '' },
    token,
  );
  console.log('\n=== gethousehold area', areaId, '===');
  console.log('rows:', (households.values ?? []).length, 'pageInfo:', households.pageInfo);
  if (households.values?.length) {
    console.log('sample:', JSON.stringify(households.values[0], null, 2));
  }

  for (const energyType of energyTypes) {
    for (const eq of [
      ...(login.value?.equipmentModel ?? []),
      { sysconfigEquipmentId: '' },
    ]) {
      const archives = await call(
        'zlMeter',
        'getAreaArchives',
        {
          energyType,
          pageNumber: '1',
          pageSize: '100',
          areaId: String(areaId),
          searchContent: '',
          sysconfigEquipmentId: eq.sysconfigEquipmentId
            ? String(eq.sysconfigEquipmentId)
            : '',
        },
        token,
      );
      const rows = archives.values ?? [];
      if (rows.length > 0) {
        console.log('\n--- FOUND archives ---');
        console.log(
          `area=${areaId} energy=${energyType} equipment=${eq.sysconfigEquipmentId || '(any)'}`,
        );
        console.log('pageInfo:', JSON.stringify(archives.pageInfo));
        console.log('rows:', rows.length);
        console.log('sample:', JSON.stringify(rows[0], null, 2));
      }
    }
  }
}
