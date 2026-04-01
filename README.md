# birds
Yorba Linda Birds

## Cloudflare Workers runtime config

This project expects a Cloudflare Worker environment variable/secret named `g_map_key`.

- The worker script is `worker.js` and serves static assets via the `ASSETS` binding configured in `wrangler.toml`.
- The key is read at runtime from the `/api/config` route in `worker.js` and consumed by the SPA in `app.js`.
- In Cloudflare, add `g_map_key` as a Worker secret/variable for this Worker.

## Global detail-open tracker

- Global detail-open counts are handled by a Durable Object class named `DetailCounter` in `worker.js`.
- API routes:
  - `POST /api/detail-open` with JSON body `{ "kind": "bird" | "wildlife" | "park" }` increments and returns global counts.
  - `GET /api/detail-counts` returns current global counts.
- `wrangler.toml` includes the Durable Object binding and migration required for deployment.
