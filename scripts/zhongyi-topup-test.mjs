/**
 * Test Zhongyi login, balance read, and remotelyTopUp for one IMEI.
 * Usage: node scripts/zhongyi-topup-test.mjs [imei] [amountMwk]
 */
const baseUrl =
  process.env.ZHONGYI_API_URL ||
  'http://en.energy.zhongyismart.com/api/commonInternal.jsp';
const username = process.env.ZHONGYI_USERNAME || '';
const password = process.env.ZHONGYI_PASSWORD || '';
const imei = process.argv[2] || '863459078184789';
const amountMwk = Number(process.argv[3] || '100');
const mode = process.argv[4] || 'split'; // split = MWK + kg, legacy = both MWK, check = read only

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

if (!username || !password) {
  console.error('Missing ZHONGYI_USERNAME / ZHONGYI_PASSWORD');
  process.exit(1);
}

const login = await call('zlMeter', 'toLogin', { username, password });
console.log('LOGIN:', login.errcode, login.errmsg);
const token = login.value?.apiToken;
if (!token) process.exit(1);

const before = await call(
  'zlMeter',
  'queryRealTimeData',
  { nbonetNetImei: imei },
  token,
  'param',
);
console.log('BEFORE realtime:', JSON.stringify(before.data ?? before, null, 2));

if (mode === 'check') {
  process.exit(0);
}

const archive = await call(
  'zlMeter',
  'getAreaArchiveInfo',
  { nbonetNetImei: imei },
  token,
  'param',
);
console.log('ARCHIVE:', JSON.stringify(archive.value ?? archive, null, 2));

const flatPrice = Number(archive.value?.priceInfo?.flatPrice ?? 0);
const creditKg =
  flatPrice > 0 ? (amountMwk / flatPrice).toFixed(3) : String(amountMwk);

const topUpPayload =
  mode === 'legacy'
    ? {
        nbonetNetImei: imei,
        topUpAmount: String(amountMwk),
        topUpToDeviceAmount: String(amountMwk),
      }
    : {
        nbonetNetImei: imei,
        topUpAmount: String(amountMwk),
        topUpToDeviceAmount: creditKg,
      };

console.log(`\nCalling remotelyTopUp mode=${mode}`, topUpPayload);
const topup = await call('zlMeter', 'remotelyTopUp', topUpPayload, token, 'param');
console.log('TOPUP RESPONSE:', JSON.stringify(topup, null, 2));

await new Promise((r) => setTimeout(r, 15000));

const after = await call(
  'zlMeter',
  'queryRealTimeData',
  { nbonetNetImei: imei },
  token,
  'param',
);
console.log('AFTER realtime:', JSON.stringify(after.data ?? after, null, 2));
