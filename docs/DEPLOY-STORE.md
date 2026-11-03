# Running the Spider Store on your server

The Store has two parts. Both ship in this repo.

| Part | Where | What it does |
|---|---|---|
| App (Explore, Publish, Play Now) | `src/mobile/*` | Built by Vite into `dist/`. Static files. |
| Store server | `server/store-server.cjs` | Keeps published games, their builds and screenshots on disk. Node 18+, no npm packages. |

The server is optional. Without it the app publishes on the device (IndexedDB) and still works. With it, games are shared between devices. If the server is configured but unreachable, publishing falls back to the device and Explore keeps listing everything, so the server can never block a demo or a judge.

## 1. Same domain (simplest): app and server on one VPS

```bash
# on the VPS
git clone <your repo> /srv/spider && cd /srv/spider
git checkout claude/gifted-hamilton-2jda2l        # or main after merging
npm ci
VITE_STORE_API=/api/store npm run build           # bakes the API path into dist/
sudo useradd -r -s /usr/sbin/nologin spider; sudo mkdir -p /var/lib/spider-store; sudo chown spider /var/lib/spider-store
```

`/etc/systemd/system/spider-store.service`:

```ini
[Unit]
Description=Spider Store server
After=network.target

[Service]
User=spider
WorkingDirectory=/srv/spider
Environment=PORT=8787 HOST=127.0.0.1 DATA_DIR=/var/lib/spider-store TRUST_PROXY=1
ExecStart=/usr/bin/node server/store-server.cjs
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable --now spider-store
curl http://127.0.0.1:8787/api/store/health      # {"ok":true,"games":0}
```

nginx (`server_name` = your domain):

```nginx
server {
  server_name store.example.com;
  root /srv/spider/dist;
  client_max_body_size 20m;                  # one submission is up to about 14 MB of JSON
  location /api/store/ {
    proxy_pass http://127.0.0.1:8787;
    proxy_set_header X-Forwarded-For $remote_addr;
  }
  location / { try_files $uri /index.html; }
}
```

Then get HTTPS: `sudo certbot --nginx -d store.example.com`. **HTTPS is required**: the app hashes screenshots and builds with `crypto.subtle`, which browsers only allow on secure pages (localhost excepted).

## 2. App on Vercel, server on the VPS

1. On the VPS run the server as above, with `CORS_ORIGIN=https://<your-app>.vercel.app` added to the service environment, and nginx proxying `/api/store/` on an HTTPS domain (for example `api.example.com`).
2. In the Vercel project, Settings, Environment Variables: `VITE_STORE_API = https://api.example.com/api/store`.
3. Redeploy. Vite reads the variable at build time, so changing it needs a new build.

## 3. How a game travels

1. **Publish** (app): the form is checked, screenshots are re-encoded on the device (metadata removed, compressed), then `POST {API}/games` with the listing, screenshots, the build (project JSON) and a provenance manifest.
2. **Server**: re-checks every rule (4 to 8 screenshots, 5 MB build, 18+ word check, valid category, hashes match, no leftover metadata, name ownership, rate limit) and writes `DATA_DIR/games/<slug>/` (`game.json`, `images/`, `packages/vN.spider.json`).
3. **Explore**: `GET {API}/games` lists games; screenshots come from `GET {API}/files/<slug>/<file>`.
4. **Play Now**: `fetchPackage()` in `src/mobile/storeApi.js` calls `GET {API}/games/<slug>/versions/<n>/package`, then `playStoreGame()` in `MobileApp.jsx` imports it as a project, opens Studio and starts it.

Full request and response shapes: `docs/STORE-API.md`.

## 4. Check it works

```bash
curl https://store.example.com/api/store/health
curl https://store.example.com/api/store/games
```

Then in the app: Studio, tap the camera 4 times, More, Projects, Export to Store, fill the form, Publish, open the Store tab, Games, open your game, Play Now.

## 5. Updating and backups

- Update: `git pull && npm ci && VITE_STORE_API=/api/store npm run build && sudo systemctl restart spider-store`.
- Back up `DATA_DIR` (plain files). Restoring is copying it back.

## 6. Known limits

- A developer is identified by the typed name; there are no accounts yet. Anyone can publish a new version of a game by typing its developer name. Add login before opening the Store to the public.
- The 18+ rule is a word check plus a declaration, not moderation.
- C2PA: the app records a provenance manifest and the server marks it `unsigned`. Sealing with Content Credentials needs your certificate and a tool such as `c2patool`, run on the files in `images/`.
- The Neon Rift demo and the other listings marked sample are bundled in the app (`public/store-samples/`, `src/mobile/storeSamples.js`); only Neon Rift has a build.
