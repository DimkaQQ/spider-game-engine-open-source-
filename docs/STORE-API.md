# Spider Store API (what the mobile app sends)

The Pocket Studio store UI (`src/mobile/Store.jsx`, `storeApi.js`) talks to a server whose base URL is set in `VITE_STORE_API` at build time. With no value it runs a local adapter that keeps submissions in the browser, so the flow can be tested before the server exists.

## Endpoints

| Call | Purpose |
|---|---|
| `GET /games` | All games. Each: `{ slug, name, developer, category, description, images[], versions[], updatedAt }` |
| `GET /games/:slug` | One game, or `404` when the name is free |
| `POST /games` | Publish a new game or a new version (body below). Reply with the game object. Errors: `{ "error": "text" }` |

## `POST /games` body

```json
{
  "slug": "neon-rift", "name": "Neon Rift", "developer": "DarQQ", "category": "Shooter",
  "description": "…", "notes": "what changed (versions only)", "version": 2,
  "images": [{ "name": "a.webp", "type": "image/webp", "width": 1280, "height": 720, "bytes": 90000, "sha256": "…", "dataUrl": "data:image/webp;base64,…" }],
  "package": { "bytes": 26000, "base64": "…" },
  "provenance": { "schema": "spider-store-provenance/1", "c2pa": { "status": "unsigned", "signer": "store-server" }, "…": "…" }
}
```

## Rules the client already enforces (the server must enforce them again)

- Developer name, game name (40 chars), category, description (40 to 1200 chars) are required.
- At least 4 and at most 8 screenshots. Each is re-encoded on the device (WebP, JPEG fallback, longest side 1280 px, quality 0.82), which removes EXIF, GPS, XMP and any embedded manifest.
- Package at most 5 MB. Larger games need the additional review, team support and a verified developer account (not built yet; the app says so).
- No adult (18+) content: the client runs a word check and the developer ticks a declaration. A word list is a first filter, not moderation.
- Same game name (slug) plus the same developer name means a new version under the same game. The same name from another developer is refused. Names are compared case-insensitively, so the server should also tie a game to an authenticated account rather than a typed name.

## C2PA

A signing certificate must not live in a client app, so the device records a provenance manifest (hashes of the package and each image, tool, developer, `metadataStripped: true`) and leaves `c2pa.status` as `unsigned`. The server should verify the hashes and seal the images with C2PA Content Credentials (for example with `c2patool` or the `c2pa` crates) using its own certificate, then serve the signed files.

## Running it on a VPS

`server/store-server.cjs` is a complete server for this contract with no dependencies (Node 18 or newer). It re-checks every rule above, stores games and images on disk, and serves them back.

```bash
npm run store:server            # PORT=8787, data in ./store-data
```

Build the mobile app against the same domain and put a reverse proxy in front:

```bash
VITE_STORE_API=/api/store npm run build
```

```nginx
server {
  server_name store.example.com;
  root /srv/spider/dist;
  client_max_body_size 20m;                       # a submission is up to about 14 MB of JSON
  location /api/store/ { proxy_pass http://127.0.0.1:8787; proxy_set_header X-Forwarded-For $remote_addr; }
  location / { try_files $uri /index.html; }
}
```

Run the server with `TRUST_PROXY=1 HOST=127.0.0.1 DATA_DIR=/var/lib/spider-store CORS_ORIGIN=https://store.example.com`, under systemd or pm2. Back up `DATA_DIR`.

Known limits: a developer is identified by the typed name, so anyone can publish a new version of a game by typing its developer's name. Add accounts before this is open to the public. The 18+ rule is a word check plus a declaration, not moderation. C2PA sealing is not done by this server: it records `c2pa.status: "unsigned"`.
