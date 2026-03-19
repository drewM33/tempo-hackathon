# Valiron SDK (live trust)

The dashboard uses [`@valiron/sdk`](https://www.npmjs.com/package/@valiron/sdk) **only on the server**: Route Handlers under `app/api/valiron/`. The browser calls those routes; it never imports the SDK.

## Configure

1. Copy `.env.example` → `.env.local` (or use the defaults already in `.env.local` on your machine — that file is gitignored).
2. Key variables:
   - `VALIRON_ENABLED=true` — turns on bootstrap, trust polling, health, and chat `trust`.
   - `VALIRON_CHAIN` — e.g. `ethereum`, `base`, `monad`.
   - `VALIRON_WALLETS` — optional comma-separated **full** wallets (`0x` + 40 hex) to seed the nine fleet rows so `getWalletProfile` has real addresses.
   - `VALIRON_HEALTH_AGENT_ID` — ERC-8004 agent id for `GET /api/valiron/health` (default `25459` from SDK docs).

## Run

```bash
cd v0-frontend
pnpm dev
```

`next.config.mjs` pins **Turbopack’s root** to the hackathon repo and aliases Tailwind into this package. Without that, Next can follow a `pnpm-lock.yaml` outside the repo (for example under your **home directory**), serve the wrong project, and **every URL returns 404**.

If you still see 404s:

1. Confirm the terminal that is running `pnpm dev` is **`cd`’d into `v0-frontend`** (not the monorepo root only).
2. Use the **exact** `Local: http://localhost:PORT` URL from that terminal (another app may already own `3000`).
3. Try a clean dev build: `rm -rf .next && pnpm dev`.

## Verify

| Step | Command / action |
|------|-------------------|
| Build | `./node_modules/.bin/next build` |
| Health | `curl -s http://localhost:3000/api/valiron/health` → `{ "ok": true, "agentId", "route" }` when the operator is reachable |
| Bootstrap | `curl -s http://localhost:3000/api/valiron/bootstrap` → `valironEnabled`, `seedAddresses`, `refreshMs`, `chain` |
| UI | Header shows **Valiron SDK** badge when enabled; status text shows `synced` after a successful trust poll |
| Chat | `trust 0x<40 hex>` or partial match to a row — returns route, tier, risk, decision |

## Behavior notes

- Generated mock wallets are **full-length** `0x` + 40 hex so they can be looked up; unknown wallets may return API errors until you set `VALIRON_WALLETS`.
- Trust polling runs on `VALIRON_REFRESH_MS` (default 90s) and merges **tier, risk, pricing, and Valiron metadata** into each row. Simulated CER/sparklines keep updating on the faster interval.
- Operator manual tier commands in chat may be overwritten on the next Valiron poll unless you disable sync (`VALIRON_ENABLED=false`).
