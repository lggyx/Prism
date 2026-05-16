# Prism Backend

Bun + TypeScript backend for 世界观透镜. The app entrypoint uses MySQL-backed repositories, JWT auth context, local file storage, and a swappable AI provider.

## Requirements

- Bun 1.3+
- MySQL 8+
- Docker, for cloud-style deployment

## Local Development

```bash
cd backend
bun install
bun run db:init
bun run dev
```

Default API base:

```text
http://localhost:3000/api/v1
```

`bun run dev` reads `.env.development`. Change `PORT` there if `3000` is occupied.

## Database

Initialize or update local tables and seed data:

```bash
cd backend
bun run db:init
```

This runs `src/data/schema.sql`, ensures compatibility columns, and upserts:

- default observer `OBS-0001`
- default observer settings
- six preset lenses
- P1/P2 tables such as `export_tasks` and `lens_creator_sessions`

## Auth

`POST /auth/login` issues HS256 access and refresh JWTs. Protected routes resolve `owner_id` from the bearer token, so captures, readings, slices, exports, lens creator sessions, `/me`, and settings are isolated by user. In non-production, requests without a token fall back to `user_01` for convenient local testing.

## Storage

`POST /captures` accepts both JSON metadata and real `multipart/form-data` uploads. Uploaded files are written by the local storage provider.

Environment:

```text
PUBLIC_ASSET_BASE_URL=/assets
PUBLIC_ASSET_ROOT_DIR=storage
```

The API serves `/assets/*` from `PUBLIC_ASSET_ROOT_DIR`. For production object storage, replace the storage provider implementation behind `src/providers/storage.provider.ts`.

## AI Provider

Default AI is deterministic mock output:

```text
AI_PROVIDER=mock
```

An OpenAI-compatible adapter is available:

```text
AI_PROVIDER=openai-compatible
AI_BASE_URL=https://api.openai.com/v1
AI_MODEL=gpt-4.1-mini
AI_API_KEY=...
```

It is wired through `src/providers/ai.provider.ts`; if no API key is present it safely falls back to mock.

## Live Smoke Test

With the server running:

```bash
cd backend
bun run test:live
```

The live script covers auth/JWT, multipart capture upload, readings, slices, retry, reanalysis, export tasks, custom lens creation, discover/signals, legal docs, client config, and delete slice.

## Docker

From the repository root:

```bash
docker compose up --build
```

This starts:

- `backend`: Bun API server on port `3000`
- `mysql`: MySQL 8.4 on port `3306`
- `prism_backend_storage`: persistent uploaded asset volume mounted at `/app/storage`

The schema and seed SQL are mounted from `backend/src/data/` on first MySQL initialization.

## Implemented Routes

- Auth/user: `/auth/*`, `/me`, `/me/settings`
- Lenses: `GET /lenses`, `GET /lenses/:id`, `GET /lenses/trending`
- Captures/readings: `POST /captures`, `POST /readings`, `GET /readings/:id`, `POST /readings/:id/retry`
- Slices: `POST /slices`, `GET /slices`, `GET /slices/:id`, `DELETE /slices/:id`, `POST /slices/:id/reanalyze`
- Export: `POST /slices/:id/export`, `GET /exports/:id`
- Lens creator: `/lens-creator/*`
- Discover/community: `/discover`, `/challenges/current`, `/challenges/:id/join`, `/signals/*`
- System: `GET /legal-docs/:docType`, `GET /client-config`
