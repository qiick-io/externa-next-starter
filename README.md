# Externa Next.js starter

Minimal **Next.js App Router** frontend that lists and shows collection items from the Externa [Public CMS API](https://docs.externa.qiick.io/docs/public-cms-api).

Not a marketing theme. No Kitchen Sink. Server-side fetches only — the API key never reaches the browser.

## Prerequisites

- Node.js 20+ (24 recommended)
- A running Externa install (fresh installs need no seeded collection)

## Setup

```bash
git clone https://github.com/qiick-io/externa-next-starter.git
cd externa-next-starter
cp .env.example .env.local
npm install
npm run dev
```

Open [http://localhost:3002](http://localhost:3002).

### Environment

| Variable | Required | Notes |
|----------|----------|-------|
| `EXTERNA_API_URL` | yes | Origin only, e.g. `http://externa-core.test` (no trailing slash) |
| `EXTERNA_API_KEY` | no | `ek_…` Bearer secret. Omit to use the `public` role |
| `EXTERNA_COLLECTION` | no | Collection slug. **Leave empty** to auto-discover the first readable collection via `GET /api/v1/collections` |

Grant **Read** on at least one collection under Roles → Collection access ([docs](https://docs.externa.qiick.io/docs/public-cms-api#quick-start-typical-website-read)).

With an empty `EXTERNA_COLLECTION` and no readable collections, the home page shows a setup panel (not a raw 404 dump) and pings always-public `GET /api/v1/openapi.json` to confirm the API is reachable.

## Routes

| Path | Source |
|------|--------|
| `/` | resolve collection → `GET /api/v1/collections/{slug}/items` |
| `/items/[id]` | same resolve → `GET /api/v1/collections/{slug}/items/{id}` |

Discovery helpers live in `lib/externa.ts` (`listCollections`, `resolveCollection`, `pingOpenApi`).

## GraphQL (optional)

Same auth and Collection access apply at `/api/graphql`. This starter uses REST only; see [GraphQL](https://docs.externa.qiick.io/docs/graphql) if you prefer a query document.

## Docs

- Guide: [Headless starter](https://docs.externa.qiick.io/docs/headless-starter)
- [Public CMS API](https://docs.externa.qiick.io/docs/public-cms-api) · [Client types / OpenAPI](https://docs.externa.qiick.io/docs/public-cms-api-types) · [Bruno collection](https://github.com/qiick-io/externa-bruno)

## License

MIT (same as Externa Core).
