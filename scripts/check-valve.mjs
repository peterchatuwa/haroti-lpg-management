/**
 * Check Zhongyi valve status and test close/open command (dry-run by default).
 * Usage on VPS:
 *   node scripts/check-valve.mjs [imei]           # read status only
 *   node scripts/check-valve.mjs [imei] close     # send close command
 *   node scripts/check-valve.mjs [imei] open      # send open command
 *   node scripts/check-valve.mjs [imei] close 3423733  # query command status
 */
const baseUrl =
  process.env.ZHONGYI_API_URL ||
  'http://en.energy.zhongyismart.com/api/commonInternal.jsp';
const username = process.env.ZHONGYI_USERNAME || '';
const password = process.env.ZHONGYI_PASSWORD || '';
const imei = process.argv[2] || '863459078184789';
const action = process.argv[3] || 'status';
const valueId = process.argv[4];

async function call(method, payload, token, bodyKey = 'param') {
  const requestParams = { action: 'zlMeter', method, apiToken: token };
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

const login = await call('toLogin', { username, password }, undefined, 'params');
console.log('LOGIN:', login.errcode, login.errmsg);
const token = login.value?.apiToken;
if (!token) process.exit(1);

if (valueId) {
  const info = await call('queryCommandInfo', { valueId }, token);
  console.log('COMMAND INFO:', JSON.stringify(info, null, 2));
  process.exit(0);
}

const realtime = await call('queryRealTimeData', { nbonetNetImei: imei }, token);
console.log('REALTIME:', JSON.stringify(realtime.data ?? realtime, null, 2));

const valveStatus = await call('readValveStatus', { nbonetNetImei: imei }, token);
console.log('VALVE STATUS:', JSON.stringify(valveStatus.data ?? valveStatus, null, 2));

if (action === 'status') process.exit(0);

const valveState = action === 'close' ? '0' : '1';
console.log(`\nSending setValveState valveState=${valveState} for IMEI ${imei}`);
const result = await call('setValveState', { nbonetNetImei: imei, valveState }, token);
console.log('SET VALVE RESULT:', JSON.stringify(result, null, 2));

if (result.valueId) {
  await new Promise((r) => setTimeout(r, 5000));
  const info = await call('queryCommandInfo', { valueId: result.valueId }, token);
  console.log('COMMAND INFO (5s later):', JSON.stringify(info, null, 2));
}

await new Promise((r) => setTimeout(r, 10000));
const after = await call('queryRealTimeData', { nbonetNetImei: imei }, token);
console.log('REALTIME AFTER:', JSON.stringify(after.data ?? after, null, 2));
