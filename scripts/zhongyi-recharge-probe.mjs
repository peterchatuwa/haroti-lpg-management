/** Probe Zhongyi recharge-related API methods */
const baseUrl =
  process.env.ZHONGYI_API_URL ||
  'http://en.energy.zhongyismart.com/api/commonInternal.jsp';

async function call(action, method, payload, token, bodyKey = 'params') {
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

const login = await call('zlMeter', 'toLogin', {
  username: process.env.ZHONGYI_USERNAME,
  password: process.env.ZHONGYI_PASSWORD,
});
const token = login.value?.apiToken;
const imei = process.argv[2] || '863459078184789';
const orderId = process.argv[3] || '32913';

const methods = [
  'queryRechargeRecord',
  'getRechargeRecord',
  'queryTopUpRecord',
  'getTopUpRecord',
  'queryOrderInfo',
  'queryRechargeOrder',
  'getRechargeOrder',
  'queryRemoteTopUpRecord',
  'getRemoteTopUpRecord',
];

for (const method of methods) {
  const r = await call(
    'zlMeter',
    method,
    { nbonetNetImei: imei, pageNumber: '1', pageSize: '10', orderId },
    token,
    'param',
  );
  console.log(
    method,
    r.errcode,
    r.errmsg,
    r.values?.length ? `rows=${r.values.length}` : '',
    r.value ? JSON.stringify(r.value).slice(0, 120) : '',
  );
}

const realtime = await call(
  'zlMeter',
  'queryRealTimeData',
  { nbonetNetImei: imei },
  token,
  'param',
);
console.log('\nREALTIME NOW:', JSON.stringify(realtime.data, null, 2));
