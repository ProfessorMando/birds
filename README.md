# birds
Yorba Linda Birds

## Cloudflare Pages runtime config

This project expects a Cloudflare Pages environment variable/secret named `g_map_key`.

- In Cloudflare Pages, add `g_map_key` for both Preview and Production environments.
- The key is read at runtime from `functions/api/config.js` and consumed by the SPA in `app.js`.
