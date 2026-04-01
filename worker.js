const VALID_DETAIL_KINDS = new Set(['bird', 'wildlife', 'park']);

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/api/config') {
      const key = env.g_map_key || '';
      return new Response(JSON.stringify({ g_map_key: key }), {
        headers: {
          'content-type': 'application/json; charset=utf-8',
          'cache-control': 'no-store'
        }
      });
    }

    if (url.pathname === '/api/detail-open' || url.pathname === '/api/detail-counts') {
      const id = env.DETAIL_COUNTER.idFromName('global');
      const stub = env.DETAIL_COUNTER.get(id);
      return stub.fetch(request);
    }

    return env.ASSETS.fetch(request);
  }
};

export class DetailCounter {
  constructor(state) {
    this.state = state;
  }

  async fetch(request) {
    const url = new URL(request.url);

    if (url.pathname === '/api/detail-counts' && request.method === 'GET') {
      const key = url.searchParams.get('key') || '';
      if (!key) {
        return new Response(JSON.stringify({ error: 'Missing key query parameter' }), {
          status: 400,
          headers: { 'content-type': 'application/json; charset=utf-8' }
        });
      }
      const count = await this.state.storage.get(`count:${key}`);
      return new Response(JSON.stringify({ key, count: Number.isFinite(count) ? count : 0 }), {
        headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }
      });
    }

    if (url.pathname === '/api/detail-open' && request.method === 'POST') {
      let kind = '';
      let id = '';
      try {
        const body = await request.json();
        kind = typeof body?.kind === 'string' ? body.kind : '';
        id = typeof body?.id === 'string' ? body.id : '';
      } catch (_) {
        return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
          status: 400,
          headers: { 'content-type': 'application/json; charset=utf-8' }
        });
      }

      if (!VALID_DETAIL_KINDS.has(kind) || !id) {
        return new Response(JSON.stringify({ error: 'Invalid detail payload' }), {
          status: 400,
          headers: { 'content-type': 'application/json; charset=utf-8' }
        });
      }

      const key = `${kind}:${id}`;
      const countKey = `count:${key}`;
      const current = await this.state.storage.get(countKey);
      const next = (Number.isFinite(current) ? current : 0) + 1;
      await this.state.storage.put(countKey, next);

      return new Response(JSON.stringify({ key, count: next }), {
        headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }
      });
    }

    return new Response('Not found', { status: 404 });
  }
}
