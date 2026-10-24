# Canvas & Co. (artstore)

Next.js 16 (App Router, TypeScript) store for paintings and handmade art (clay art and toys, crochet art, handmade
decor) with Postgres + Drizzle, Better Auth, Razorpay (**test mode**, INR) and Tailwind 4. Amounts are integer paise;
the server computes every price. It is the same codebase and architecture as the sibling `ecommerceapp` (Thread & Co.),
with its own repo, database and deployment.

## Catalogue model
- **Paintings** come in three sizes (Small / Medium / Large). Each size is its own variant with its own price, stock and
  **dimensions text** (e.g. `30 × 40 cm`), all editable by an admin.
- **Clay toys, crochet, decor** are single-variant ("One size") pieces; the dimensions field carries things like
  `12 cm tall` or `Set of 4`.
- Product images are generated SVG placeholders (`app/img/[slug]`), deterministic per slug. Replace `products.image`
  with real image URLs/files when you have them (and allow the host in the CSP in `next.config.mjs`).

## Run locally (no external services)
```
npm install
npm run db:local          # separate terminal: throwaway Postgres (PGlite) on :54330, data in .pgdata
cp .env.example .env      # then set DATABASE_URL=postgres://postgres:postgres@127.0.0.1:54330/postgres,
                          # BETTER_AUTH_SECRET (16+ chars), PAYMENT_PROVIDER=mock
npx drizzle-kit migrate
npm run db:seed           # 16 artworks, promo codes (WELCOME10, FREESHIP, FLAT200), admin (password printed once)
npm run dev               # http://localhost:3000
```
`PAYMENT_PROVIDER=mock` runs without a Razorpay account. PGlite serves one connection, so the concurrency integration
tests need a real Postgres (see below).

## Checks
| Command | What |
| --- | --- |
| `npm run typecheck` / `npm run lint` | tsc, eslint |
| `npx vitest run tests/unit` | pricing, order state machine, signatures |
| `npm run test:integration` | Integration tests (oversell race, idempotency, webhook replay, amount tamper, reservation expiry, promo cap, admin catalog) against a **real Postgres** from git-ignored `.env.test` (`DATABASE_URL=...`). Run `npm run db:migrate:test` once on a new DB. |
| `npm run build && npm run test:e2e` | Playwright on the production build (:3100) against `.env`'s DB: browse/filter, cart + promo, forged-price checkout, access control, axe on 5 pages. |

## Operations
Same stack as the sibling project: Redis rate limiting (`REDIS_URL`), Resend receipts, Axiom logs, Sentry errors,
`/api/health`, deployed-production env validation (`lib/env.ts`), Dockerfile + `deploy/` + `DEPLOY.md` (free Oracle VM),
`.github/workflows` (CI and a 10-minute cron that releases expired stock holds). Vercel works too (see CLAUDE.md).
Live Razorpay keys are blocked on purpose.

## Admin (`/admin`)
Stock, price and "was" price per size, size name and dimensions, product details, add a size, archive, order status,
promo codes (create, activate/deactivate). Create the first admin with `npm run db:seed`; reset a password with
`ADMIN_EMAIL=... npx tsx scripts/reset-admin-password.ts`.
