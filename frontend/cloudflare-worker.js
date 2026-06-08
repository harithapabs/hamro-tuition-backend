const ALLOWED_ORIGINS = ['https://hamrotuition.com', 'https://www.hamrotuition.com'];

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const targetUrl = 'https://hamro-tuition-api.onrender.com' + url.pathname + url.search;
    const method = request.method;
    const origin = request.headers.get('Origin') || '';
    const corsOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : 'https://hamrotuition.com';

    if (method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': corsOrigin,
          'Access-Control-Allow-Credentials': 'true',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-CSRF-Token',
          'Access-Control-Max-Age': '86400'
        }
      });
    }

    const newHeaders = new Headers(request.headers);
    const newRequest = new Request(targetUrl, {
      method,
      headers: newHeaders,
      body: method !== 'GET' && method !== 'HEAD' ? request.body : null,
      redirect: 'manual'
    });

    let response;
    try {
      response = await fetch(newRequest);
    } catch (err) {
      return new Response(JSON.stringify({ message: 'Proxy error' }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const responseHeaders = new Headers();
    for (const [key, value] of response.headers.entries()) {
      if (!['content-security-policy', 'x-frame-options', 'x-render-origin-server'].includes(key.toLowerCase())) {
        responseHeaders.append(key, value);
      }
    }
    responseHeaders.set('Access-Control-Allow-Origin', corsOrigin);
    responseHeaders.set('Access-Control-Allow-Credentials', 'true');
    responseHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    responseHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-CSRF-Token');
    responseHeaders.set('Access-Control-Expose-Headers', 'Set-Cookie');

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders
    });
  }
};
