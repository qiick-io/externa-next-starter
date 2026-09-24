# Externa Next.js starter

Minimal **Next.js App Router** frontend that lists and shows collection items from the Externa [Public CMS API](https://docs.externa.qiick.io/docs/public-cms-api).

Not a marketing theme. No Kitchen Sink. Server-side fetches only — the API key never reaches the browser.

## Prerequisites

- Node.js 20+ (24 recommended)
- A running Externa install with at least one collection (e.g. `posts`) readable by the `public` role **or** an API key role

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
| `EXTERNA_COLLECTION` | no | Collection slug (default `posts`) |

Grant **Read** on that collection under Roles → Collection access ([docs](https://docs.externa.qiick.io/docs/public-cms-api#quick-start-typical-website-read)).

## Routes

| Path | Source |
|------|--------|
| `/` | `GET /api/v1/collections/{slug}/items` |
| `/items/[id]` | `GET /api/v1/collections/{slug}/items/{id}` |

Client code lives in `lib/externa.ts`.

## GraphQL (optional)

Same auth and Collection access apply at `/api/graphql`. This starter uses REST only; see [GraphQL](https://docs.externa.qiick.io/docs/graphql) if you prefer a query document.

## Docs

- Guide: [Headless starter](https://docs.externa.qiick.io/docs/headless-starter)
- [Public CMS API](https://docs.externa.qiick.io/docs/public-cms-api) · [Client types / OpenAPI](https://docs.externa.qiick.io/docs/public-cms-api-types) · [Bruno collection](https://github.com/qiick-io/externa-bruno)

## License

MIT (same as Externa Core).
