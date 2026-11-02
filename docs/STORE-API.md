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
