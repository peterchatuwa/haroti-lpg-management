/** Probe Zhongyi sendCommand strings for an IMEI */
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
  return response.json();
}

const login = await call(
  'zlMeter',
  'toLogin',
  { username: process.env.ZHONGYI_USERNAME, password: process.env.ZHONGYI_PASSWORD },
  null,
  'params',
);
const token = login.value?.apiToken;
if (!token) {
  console.error('Login failed', login.errcode, login.errmsg);
  process.exit(1);
}

const imei = process.argv[2] || '863459078183500';
const cmds = [
  'queryFlowAndStatus',
  'queryBattery',
  'queryFlow',
  'queryStatus',
  'QUERYFLOWANDSTATUS',
  'QueryFlowAndStatus',
  'readFlowAndStatus',
  'queryMeterStatus',
  'queryRealTimeData',
  'queryBatteryVoltage',
  'queryValveStatus',
];

console.log('IMEI:', imei);
for (const commandStr of cmds) {
  const r = await call(
    'zlMeter',
    'sendCommand',
    { nbonetNetImei: imei, commandStr, commandParams: {} },
    token,
  );
  console.log(
    commandStr,
    '->',
    r.errcode,
    r.errmsg,
    r.valueId ? `valueId=${r.valueId}` : '',
  );
}

const rt = await call(
  'zlMeter',
  'queryRealTimeData',
  { nbonetNetImei: imei },
  token,
);
console.log('\nqueryRealTimeData ->', rt.errcode, rt.errmsg);
console.log(JSON.stringify(rt.data, null, 2));

const valve = await call(
  'zlMeter',
  'readValveStatus',
  { nbonetNetImei: imei },
  token,
);
console.log('\nreadValveStatus ->', valve.errcode, valve.errmsg);
console.log(JSON.stringify(valve.data, null, 2));
