# Birds of Yorba Linda

Yorba Linda Birds

## Cloudflare Workers runtime config

This project expects a Cloudflare Worker environment variable/secret named `g_map_key` for Google Maps embeds.

- The worker script is `worker.js` and serves static assets via the `ASSETS` binding configured in `wrangler.toml`.
- The key is read at runtime from the `/api/config` route in `worker.js` and consumed by the SPA in `app.js`.
- In Cloudflare, add `g_map_key` as a Worker secret/variable for this Worker.
- The asset directory is the repository root, so `.assetsignore` excludes repository metadata and deployment-only files such as `.git`, Wrangler config, local scripts, and the Worker source modules from the static asset upload.
- Do not commit local API keys, `.dev.vars`, or Cloudflare secret values to this repository.

## RSS feed

The site publishes a curated RSS 2.0 feed at `/feed.xml` for rare sightings, field notes, seasonal notes, park-guide additions, and substantial bird-profile updates. The feed intentionally uses general locations only and must not include exact coordinates, nesting locations, roosting sites, private-property details, or real-time alert language.

- RSS content is authored in `rss.js` as `RSS_FEED_ITEMS`.
- `/feed.xml` is generated dynamically by `worker.js` with `buildRssFeed()` from `rss.js` and returned as `application/rss+xml; charset=utf-8`.
- Feed items are sorted newest first and limited to 25 entries.
- Use absolute, stable URLs where possible. For this single-page site, existing hash routes such as `/#bird/peregrine-falcon`, `/#park/chino-hills-state-park`, and `/#rare` are acceptable because they resolve to existing canonical site views.

To add a new rare sighting, field note, or substantial guide update:

1. Add one object to `RSS_FEED_ITEMS` in `rss.js`.
2. Include `title`, `slug`, `date`, `type`, `summary`, `sensitive`, and `url`.
3. Add `species` and `generalLocation` categories when they are safe and useful.
4. Link to an existing canonical site route; do not create feed items that point nowhere.
5. Keep `summary` short. Do not copy full notes into the feed unless the public page is already safe at that level of detail.

Sensitive-location policy:

- If `sensitive: true`, use only broad location language such as “Yorba Linda area” or “Chino Hills State Park area.”
- Do not include coordinates, street addresses, trail-specific instructions, nesting locations, roosting locations, den sites, private-property details, or “go here right now” wording.
- The feed renderer appends “Precise location details are withheld to reduce disturbance.” to sensitive items that do not already include that sentence.
- Existing exact-location fields, if added elsewhere in the future, must not be included in RSS output.

Validate the feed with:

```sh
npm run validate:feed
```

The validation script builds the feed in memory and checks RSS structure, required item fields, absolute item links and GUIDs, newest-first sorting, XML escaping, sensitive-location guardrails, homepage autodiscovery, and the visible `/feed.xml` footer link.

## Global detail-open tracker

- Global detail-open counts are handled by a Durable Object class named `DetailCounter` in `worker.js`.
- API routes:
  - `POST /api/detail-open` with JSON body `{ "kind": "bird" | "wildlife" | "park", "id": "<profile-id>" }` increments and returns the global count for that specific profile.
  - `GET /api/detail-counts?key=<kind:id>` returns the current global count for that specific profile key.
- `wrangler.toml` includes the Durable Object binding and migration required for deployment.
