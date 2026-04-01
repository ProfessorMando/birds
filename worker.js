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

    if (
      url.pathname === '/api/detail-open' ||
      url.pathname === '/api/detail-counts' ||
      url.pathname === '/api/upvote-status' ||
      url.pathname === '/api/upvote-toggle'
    ) {
      const id = env.DETAIL_COUNTER.idFromName('global');
      const stub = env.DETAIL_COUNTER.get(id);
      return stub.fetch(request);
    }
    if (url.pathname === '/api/quiz-stats' || url.pathname === '/api/quiz-complete') {
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

    if (url.pathname === '/api/quiz-stats' && request.method === 'GET') {
      const scores = await this.state.storage.get('quiz:scores');
      const normalizedScores = Array.isArray(scores)
        ? scores.filter((score) => Number.isFinite(score))
        : [];
      const completions = normalizedScores.length;
      const averageScore = completions
        ? Math.round((normalizedScores.reduce((sum, score) => sum + score, 0) / completions) * 10) / 10
        : 0;

      return new Response(JSON.stringify({ completions, averageScore }), {
        headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }
      });
    }

    if (url.pathname === '/api/quiz-complete' && request.method === 'POST') {
      let score = null;
      let totalQuestions = null;
      try {
        const body = await request.json();
        score = body?.score;
        totalQuestions = body?.totalQuestions;
      } catch (_) {
        return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
          status: 400,
          headers: { 'content-type': 'application/json; charset=utf-8' }
        });
      }

      if (!Number.isFinite(score) || !Number.isFinite(totalQuestions) || totalQuestions <= 0 || score < 0 || score > totalQuestions) {
        return new Response(JSON.stringify({ error: 'Invalid quiz completion payload' }), {
          status: 400,
          headers: { 'content-type': 'application/json; charset=utf-8' }
        });
      }

      const normalizedScore = Math.round((score / totalQuestions) * 100);
      const scores = await this.state.storage.get('quiz:scores');
      const normalizedScores = Array.isArray(scores)
        ? scores.filter((entry) => Number.isFinite(entry))
        : [];
      normalizedScores.push(normalizedScore);
      await this.state.storage.put('quiz:scores', normalizedScores);

      const completions = normalizedScores.length;
      const averageScore = Math.round((normalizedScores.reduce((sum, entry) => sum + entry, 0) / completions) * 10) / 10;

      return new Response(JSON.stringify({
        completions,
        averageScore,
        latestScore: normalizedScore
      }), {
        headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }
      });
    }

    if (url.pathname === '/api/upvote-status' && request.method === 'GET') {
      const kind = url.searchParams.get('kind') || '';
      const id = url.searchParams.get('id') || '';
      const userId = url.searchParams.get('userId') || '';

      if (!VALID_DETAIL_KINDS.has(kind) || !id || !userId) {
        return new Response(JSON.stringify({ error: 'Invalid upvote status query' }), {
          status: 400,
          headers: { 'content-type': 'application/json; charset=utf-8' }
        });
      }

      const key = `${kind}:${id}`;
      const count = await this.state.storage.get(`upvote-count:${key}`);
      const upvoted = Boolean(await this.state.storage.get(`upvote-user:${userId}:${key}`));
      return new Response(JSON.stringify({
        key,
        count: Number.isFinite(count) ? count : 0,
        upvoted
      }), {
        headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }
      });
    }

    if (url.pathname === '/api/upvote-toggle' && request.method === 'POST') {
      let kind = '';
      let id = '';
      let userId = '';
      try {
        const body = await request.json();
        kind = typeof body?.kind === 'string' ? body.kind : '';
        id = typeof body?.id === 'string' ? body.id : '';
        userId = typeof body?.userId === 'string' ? body.userId : '';
      } catch (_) {
        return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
          status: 400,
          headers: { 'content-type': 'application/json; charset=utf-8' }
        });
      }

      if (!VALID_DETAIL_KINDS.has(kind) || !id || !userId) {
        return new Response(JSON.stringify({ error: 'Invalid upvote payload' }), {
          status: 400,
          headers: { 'content-type': 'application/json; charset=utf-8' }
        });
      }

      const key = `${kind}:${id}`;
      const countKey = `upvote-count:${key}`;
      const userVoteKey = `upvote-user:${userId}:${key}`;
      const hasUpvoted = Boolean(await this.state.storage.get(userVoteKey));
      const currentCount = await this.state.storage.get(countKey);
      const normalizedCount = Number.isFinite(currentCount) ? currentCount : 0;

      if (hasUpvoted) {
        const nextCount = Math.max(0, normalizedCount - 1);
        await this.state.storage.delete(userVoteKey);
        await this.state.storage.put(countKey, nextCount);
        return new Response(JSON.stringify({ key, count: nextCount, upvoted: false }), {
          headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }
        });
      }

      const nextCount = normalizedCount + 1;
      await this.state.storage.put(userVoteKey, true);
      await this.state.storage.put(countKey, nextCount);
      return new Response(JSON.stringify({ key, count: nextCount, upvoted: true }), {
        headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }
      });
    }

    return new Response('Not found', { status: 404 });
  }
}
