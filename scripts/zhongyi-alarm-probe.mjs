/** Probe Zhongyi alarm/warning related API methods */
const baseUrl =
  process.env.ZHONGYI_API_URL ||
  'http://en.energy.zhongyismart.com/api/commonInternal.jsp';

async function call(action, method, payload, token, bodyKey = 'param') {
  const requestParams = { action, method, apiToken: token };
  requestParams[bodyKey] = payload;
  const body = new URLSearchParams({
    requestParams: JSON.stringify(requestParams),
  });
  const response = await fetch(baseUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`${method} returned non-JSON (${response.status}): ${text.slice(0, 80)}`);
  }
}

const login = await call(
  'zlMeter',
  'toLogin',
  { username: process.env.ZHONGYI_USERNAME, password: process.env.ZHONGYI_PASSWORD },
  null,
  'params',
);
const token = login.value?.apiToken;
const imei = process.argv[2] || '863459078183500';

const methods = [
  ['getAlarmRecord', { nbonetNetImei: imei, pageNumber: '1', pageSize: '20', startDate: '', endDate: '' }],
  ['getWarnRecord', { nbonetNetImei: imei, pageNumber: '1', pageSize: '20', startDate: '', endDate: '' }],
  ['getWarningRecord', { nbonetNetImei: imei, pageNumber: '1', pageSize: '20', startDate: '', endDate: '' }],
  ['queryAlarmRecord', { nbonetNetImei: imei, pageNumber: '1', pageSize: '20' }],
  ['queryWarnRecord', { nbonetNetImei: imei, pageNumber: '1', pageSize: '20' }],
  ['getTamperRecord', { nbonetNetImei: imei, pageNumber: '1', pageSize: '20' }],
  ['getLeakageRecord', { nbonetNetImei: imei, pageNumber: '1', pageSize: '20' }],
  ['queryExceptionRecord', { nbonetNetImei: imei, pageNumber: '1', pageSize: '20' }],
  ['getExceptionRecord', { nbonetNetImei: imei, pageNumber: '1', pageSize: '20' }],
];

for (const [method, payload] of methods) {
  try {
    const r = await call('zlMeter', method, payload, token);
    const rows = r.values?.length ?? 0;
    console.log(
      method,
      r.errcode,
      r.errmsg,
      rows ? `rows=${rows}` : '',
      r.value ? JSON.stringify(r.value).slice(0, 120) : '',
    );
    if (rows > 0) {
      console.log(' sample:', JSON.stringify(r.values[0]).slice(0, 300));
    }
  } catch (err) {
    console.log(method, 'ERROR', err instanceof Error ? err.message : err);
  }
}

const rt = await call('zlMeter', 'queryRealTimeData', { nbonetNetImei: imei }, token);
console.log('\nREALTIME safety fields:', JSON.stringify({
  leakageMark: rt.data?.leakageMark,
  margin: rt.data?.margin,
  valveState: rt.data?.valveState,
  battery: rt.data?.battery,
}, null, 2));
