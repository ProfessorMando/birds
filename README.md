# birds
Yorba Linda Birds

## Cloudflare Workers runtime config

This project expects a Cloudflare Worker environment variable/secret named `g_map_key`.

- The worker script is `worker.js` and serves static assets via the `ASSETS` binding configured in `wrangler.toml`.
- The key is read at runtime from the `/api/config` route in `worker.js` and consumed by the SPA in `app.js`.
- In Cloudflare, add `g_map_key` as a Worker secret/variable for this Worker.
