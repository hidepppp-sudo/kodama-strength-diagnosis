const CLOUD_CONFIG = Object.freeze({
  url: 'https://vuxtgoynywehyijhhajr.supabase.co',
  publishableKey: 'sb_publishable_aG4ZuRNugBIIQS2xbtjp9g_tq3rdC4X'
});

async function cloudRpc(functionName, parameters = {}) {
  const response = await fetch(`${CLOUD_CONFIG.url}/rest/v1/rpc/${functionName}`, {
    method: 'POST',
    headers: {
      apikey: CLOUD_CONFIG.publishableKey,
      Authorization: `Bearer ${CLOUD_CONFIG.publishableKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(parameters)
  });
  const body = await response.text();
  if (!response.ok) {
    let message = body;
    try { message = JSON.parse(body).message || body; } catch (_) {}
    throw new Error(message || `通信エラー (${response.status})`);
  }
  return body ? JSON.parse(body) : null;
}

function customerTokenFromUrl() {
  return new URLSearchParams(location.search).get('token') || '';
}

function customerUrl(token) {
  const url = new URL('./', location.href);
  url.searchParams.set('token', token);
  return url.toString();
}
