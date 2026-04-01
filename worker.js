const VALID_DETAIL_KINDS = new Set(['bird', 'wildlife', 'park']);

function normalizeCounts(raw) {
  return {
    birds: Number.isFinite(raw?.birds) ? raw.birds : 0,
    wildlife: Number.isFinite(raw?.wildlife) ? raw.wildlife : 0,
    parks: Number.isFinite(raw?.parks) ? raw.parks : 0
  };
}

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
      const counts = normalizeCounts(await this.state.storage.get('counts'));
      return new Response(JSON.stringify(counts), {
        headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }
      });
    }

    if (url.pathname === '/api/detail-open' && request.method === 'POST') {
      let kind = '';
      try {
        const body = await request.json();
        kind = typeof body?.kind === 'string' ? body.kind : '';
      } catch (_) {
        return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
          status: 400,
          headers: { 'content-type': 'application/json; charset=utf-8' }
        });
      }

      if (!VALID_DETAIL_KINDS.has(kind)) {
        return new Response(JSON.stringify({ error: 'Invalid detail kind' }), {
          status: 400,
          headers: { 'content-type': 'application/json; charset=utf-8' }
        });
      }

      const counts = normalizeCounts(await this.state.storage.get('counts'));
      if (kind === 'bird') counts.birds += 1;
      if (kind === 'wildlife') counts.wildlife += 1;
      if (kind === 'park') counts.parks += 1;
      await this.state.storage.put('counts', counts);

      return new Response(JSON.stringify(counts), {
        headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }
      });
    }

    return new Response('Not found', { status: 404 });
  }
}
