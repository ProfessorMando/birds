# birds
Yorba Linda Birds

## Cloudflare Workers runtime config

This project does not require a Maps API key. Park detail pages use keyless Google Maps search links built from each park's public name and location.

- The worker script is `worker.js` and serves static assets via the `ASSETS` binding configured in `wrangler.toml`.
- The asset directory is the repository root, so `.assetsignore` excludes repository metadata and deployment-only files such as `.git`, Wrangler config, and the Worker script from the static asset upload.
- Do not commit local API keys, `.dev.vars`, or Cloudflare secret values to this repository.

## Global detail-open tracker

- Global detail-open counts are handled by a Durable Object class named `DetailCounter` in `worker.js`.
- API routes:
  - `POST /api/detail-open` with JSON body `{ "kind": "bird" | "wildlife" | "park", "id": "<profile-id>" }` increments and returns the global count for that specific profile.
  - `GET /api/detail-counts?key=<kind:id>` returns the current global count for that specific profile key.
- `wrangler.toml` includes the Durable Object binding and migration required for deployment.
