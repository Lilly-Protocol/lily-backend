# Lily Backend

[![CI](https://github.com/lily-protocol/lily-backend/actions/workflows/ci.yml/badge.svg)](https://github.com/lily-protocol/lily-backend/actions/workflows/ci.yml)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?logo=express&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?logo=docker&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-22-339933?logo=nodedotjs&logoColor=white)
![License](https://img.shields.io/badge/License-ISC-blue)

Backend service for Lily Protocol, the autonomous agent finance infrastructure for AI agents on Stellar.

This repository is the backend foundation for provisioning agent-facing services, exposing developer APIs, validating requests, and supporting modular protocol features such as wallets, payments, agent identity, and orchestration flows.

## Highlights

- Express backend with strict TypeScript
- Modular feature structure for contributor-friendly development
- Zod-powered environment and request validation
- Security middleware with Helmet, CORS allowlist, and rate limiting
- Structured logging with Pino
- Automated lint, build, and test checks in GitHub Actions
- Docker-ready local and deployment workflow

## Docker

The production Docker image runs as the `node` user (non-root) for security. The `Dockerfile` uses the `--chown=node:node` flag on `COPY` instructions so the `node` user owns all application files. No additional configuration is needed.

## Tech Stack

- Node.js 22
- Express 5
- TypeScript
- Zod
- Vitest and Supertest
- Docker
- GitHub Actions

## Quick Start

```bash
npm install
npm run dev
```

The repo already includes a local `.env` for development. If you want to recreate it manually:

```bash
cp .env.example .env
```

The server runs on `http://localhost:4000` by default.

## Configuration

Configuration is loaded from the environment and validated at startup. Invalid values fail fast before the server starts.

| Variable | Default | Purpose |
| --- | --- | --- |
| `NODE_ENV` | `development` | Runtime mode: `development`, `test`, or `production`. |
| `PORT` | `4000` | HTTP server port. |
| `APP_NAME` | `Lily Backend` | Service name used in health and log metadata. |
| `BUILD_COMMIT` | unset | Optional commit SHA exposed in build/health diagnostics. |
| `API_PREFIX` | `/api/v1` | Prefix used when mounting API routes. |
| `LOG_LEVEL` | `info` | Pino log level (`fatal`, `error`, `warn`, `info`, `debug`, `trace`, or `silent`). |
| `CORS_ORIGINS` | `http://localhost:3000` | Comma-separated origin allowlist. |
| `BODY_SIZE_LIMIT` | `1mb` | Express request-body size limit. |
| `RATE_LIMIT_WINDOW_MS` | `900000` | Shared API rate-limit window in milliseconds. |
| `RATE_LIMIT_MAX_REQUESTS` | `100` | Maximum requests allowed per rate-limit window. |
| `AUTH_API_KEY` | unset | Optional static API key. When unset, API-key authentication is disabled. |
| `AUTH_API_KEY_HEADER` | `x-api-key` | Request header used to read the configured API key. |
| `TRUST_PROXY` | `false` | Express proxy trust setting: `false`, a non-negative hop count, or `loopback`. |

To enable API-key authentication, set `AUTH_API_KEY` and send that value in the header named by `AUTH_API_KEY_HEADER` (default `x-api-key`). Leaving `AUTH_API_KEY` unset keeps the middleware in its unauthenticated mode.

`TRUST_PROXY=true` is intentionally rejected because it would trust every proxy hop. In production, configure the specific hop count for your proxy topology (for example `1` for one reverse proxy) or use `loopback` where appropriate.

## Available Endpoints

- `GET /`
- `GET /api/v1/health`
- `GET /api/v1/agents`
- `POST /api/v1/agents`
- `POST /api/v1/payments/quote`

All `/api/v1` responses send `Cache-Control: no-store` so dynamic agent and
payment data is not cached by clients or shared proxies. The root route is a
basic service metadata response and is kept outside this API cache policy.

## Example API

The sample `agents` module shows contributors how to structure backend features:

- route registration
- request validation with Zod
- typed controllers and responses
- service-layer business logic
- module-local TypeScript types

Example request:

```bash
curl -X POST http://localhost:4000/api/v1/agents \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Payments Runner",
    "description": "AgentLily responsible for autonomous USDC payment execution.",
    "capabilities": ["payments", "marketplace-purchases"]
  }'
```

`POST /api/v1/agents` accepts only `name`, `description`, and `capabilities`.
Unknown payload keys are rejected with validation field errors.

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run typecheck
npm run audit:prod
npm run format
npm run test
npm run test:coverage
```

## Project Structure

```text
src/
  common/
  config/
  modules/
    agents/
    health/
    payments/
  routes/
  app.ts
  server.ts
tests/
```

## Docker

```bash
docker build -t lily-backend .
docker run --env-file .env -p 4000:4000 lily-backend
```

## Quality Standards

Every contribution is expected to pass:

```bash
npm run lint
npm run typecheck
npm run audit:prod
npm run build
npm run test:coverage
```


## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for contribution guidelines and local setup details.

## API Versioning Strategy

This backend uses **URL path versioning** as its primary API versioning mechanism.

- All endpoints are mounted under `/api/v1/` (configurable via `API_PREFIX` env var)
- When breaking changes are required, a new version module (`v2`) will be created and mounted alongside `v1`
- The existing `v1` routes will continue to serve existing clients without modification
- New major versions are introduced only for breaking changes; additive changes land in the current version
- Deprecation of old versions follows a minimum 6-month notice period documented in release notes

### Adding a New API Version

1. Create `src/routes/v2/index.ts` with the new router
2. Mount it in `src/app.ts`: `app.use("/api/v2", apiV2Router)`
3. Keep `v1` routes unchanged for backward compatibility
4. Document migration guide in `docs/migration/v1-to-v2.md`
5. Announce deprecation timeline in CHANGELOG
