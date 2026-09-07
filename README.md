# Lily Backend — Stellar-Native API for Autonomous Agent Finance

[![CI](https://github.com/lily-protocol/lily-backend/actions/workflows/ci.yml/badge.svg)](https://github.com/lily-protocol/lily-backend/actions/workflows/ci.yml)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?logo=express&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-22-339933?logo=nodedotjs&logoColor=white)
[![Stellar](https://img.shields.io/badge/Stellar-network-7D00FF)](https://developers.stellar.org/)
![Docker](https://img.shields.io/badge/Docker-2496ED?logo=docker&logoColor=white)
![License](https://img.shields.io/badge/License-ISC-blue)

**Backend service for Lily Protocol — the Stellar-native finance infrastructure that gives autonomous AI agents on-chain-ready wallets and payments.**

Every AgentLily is a finance agent on Stellar: this API provisions it with a **deterministic Stellar account address (`G…`)**, lets it quote payments at **Stellar-native precision (7 decimals / stroops)**, and validates **Stellar `G`-addresses with the same base32 + CRC-16/XModem checksum scheme** used across the Stellar ecosystem. The settlement rails the protocol is being built for — USDC and native XLM on the Stellar network — are first-class in the API's asset model today.

## Stellar at a Glance

- **AgentLily Stellar identities** — `POST /api/v1/agents` derives a deterministic Stellar-format account address (`G…`, checksum-validated layout) for each agent, alongside its capability allowlist (`settlement`, `rebalance`, `liquidity-monitoring`, …). A seed _"Treasury Settlement Agent"_ ships in the registry as the reference AgentLily.
- **Stellar address validation** — `src/modules/payments/stellar-address.ts` reimplements Stellar's `G…` decoding (base32, version byte, CRC-16/XModem checksum) so invalid accounts are rejected at the API edge without a network round-trip.
- **Stellar asset & amount semantics** — payment schemas model native `XLM` and issued assets (e.g. `USDC`), accept full Stellar `G…` asset addresses, and enforce **7-decimal stroop precision** with strictly positive amounts — the same rules the ledger enforces.
- **Quote → execute settlement flow** — `POST /api/v1/payments` returns a live quote (fee, rate, expiry) and `POST /api/v1/payments/execute` settles it with replay protection (`409` on double-execute, `410` when a quote expires) — the async settlement pattern Stellar agents need before on-chain submission lands.

```
┌────────────────────────────────────────────────────────────────┐
│  Lily Backend API  (Express / TypeScript)                      │
│   /agents    provision AgentLily Stellar identities (G…)       │
│   /payments  quote & execute USDC/XLM payment flows            │
│              Stellar checksum validation + 7-decimal amounts   │
└────────────────────────────┬───────────────────────────────────┘
                             │ request → response (Zod validated)
                             ▼
┌────────────────────────────────────────────────────────────────┐
│  Lily Protocol stack (on Stellar)                              │
│   Soroban contracts (identity · wallet · payments · escrow)    │
│   SDK + runtime for autonomous agent finance                   │
└────────────────────────────────────────────────────────────────┘
```

## Highlights

- Express backend with strict TypeScript
- Modular feature structure for contributor-friendly development
- Zod-powered environment and request validation
- Security middleware with Helmet, CORS allowlist, and rate limiting
- Structured logging with Pino (secrets, API keys, and `seed`s redacted from URLs)
- Deterministic Stellar account derivation per agent
- Stellar `G…` checksum validation and stroop-precision amount schemas
- Automated lint, build, and test checks in GitHub Actions
- Docker-ready local and deployment workflow

## Tech Stack

| Layer      | Technology                                        |
| ---------- | ------------------------------------------------- |
| Runtime    | Node.js 22, Express 5, TypeScript                 |
| Validation | Zod (env + request/response schemas)              |
| Assets     | Stellar-native: XLM, USDC, `G…` address checksums |
| Logging    | Pino + pino-http with query redaction             |
| Tests      | Vitest and Supertest                              |
| Ops        | Docker, GitHub Actions                            |

## Docker

The production Docker image runs as the `node` user (non-root) for security. The `Dockerfile` uses the `--chown=node:node` flag on `COPY` instructions so the `node` user owns all application files. It also defines a `HEALTHCHECK` instruction probing `/api/v1/health/live` using Node.js's built-in `fetch`, respecting the configured `PORT` (default 4000). No additional configuration is needed.

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

All configuration is done via environment variables (see [`.env.example`](./env.example)). The table below lists every supported variable, its default, and purpose.

| Variable                  | Default                 | Description                                                                                                                                                            |
| ------------------------- | ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NODE_ENV`                | `development`           | Environment: `development`, `test`, or `production`                                                                                                                    |
| `PORT`                    | `4000`                  | Server listen port (1–65535)                                                                                                                                           |
| `APP_NAME`                | `Lily Backend`          | Application name used in health/startup responses                                                                                                                      |
| `BUILD_COMMIT`            | _(empty)_               | Optional build SHA exposed in diagnostics                                                                                                                              |
| `API_PREFIX`              | `/api/v1`               | URL prefix for all API routes                                                                                                                                          |
| `LOG_LEVEL`               | `info`                  | Pino log level: `fatal`, `error`, `warn`, `info`, `debug`, `trace`, `silent`                                                                                           |
| `CORS_ORIGINS`            | `http://localhost:3000` | Comma-separated list of allowed CORS origins                                                                                                                           |
| `BODY_SIZE_LIMIT`         | `1mb`                   | Maximum request body size                                                                                                                                              |
| `RATE_LIMIT_WINDOW_MS`    | `900000` (15 min)       | Rate limit time window in milliseconds                                                                                                                                 |
| `RATE_LIMIT_MAX_REQUESTS` | `100`                   | Max requests per window per client IP                                                                                                                                  |
| `AUTH_API_KEY`            | _(unset)_               | **Optional.** When set, enables API key auth — requests without a matching key via `AUTH_API_KEY_HEADER` are rejected with 401. Leave unset to disable authentication. |
| `AUTH_API_KEY_HEADER`     | `x-api-key`             | HTTP header name used to supply the API key                                                                                                                            |
| `TRUST_PROXY`             | `false`                 | Proxy trust setting: `false`, a positive integer hop count, or `loopback`. **⚠️ Setting to `"true"` trusts ALL proxies — only use in fully trusted environments.**     |

### Production Notes

- **TRUST_PROXY**: In production behind a reverse proxy, set this to the number of proxy hops (e.g., `1`) or `"loopback"`. Avoid `"true"` — it trusts every `X-Forwarded-*` header from any source.
- **AUTH_API_KEY**: Enable this in production to gate all API endpoints behind a shared secret. Pair with a reverse proxy that strips the header from external traffic.

## Available Endpoints

| Method   | Path                          | Success | Purpose / notable route errors                                                                                    |
| -------- | ----------------------------- | ------- | ----------------------------------------------------------------------------------------------------------------- |
| `GET`    | `/`                           | `200`   | Basic service metadata outside the versioned API.                                                                 |
| `GET`    | `/api/v1/health`              | `200`   | General service health.                                                                                           |
| `GET`    | `/api/v1/health/live`         | `200`   | Liveness probe.                                                                                                   |
| `GET`    | `/api/v1/health/ready`        | `200`   | Readiness probe.                                                                                                  |
| `GET`    | `/api/v1/metrics`             | `200`   | Process metrics.                                                                                                  |
| `GET`    | `/api/v1/agents`              | `200`   | List agents.                                                                                                      |
| `GET`    | `/api/v1/agents/:id`          | `200`   | Fetch one agent; `404` when it does not exist.                                                                    |
| `POST`   | `/api/v1/agents`              | `201`   | Create an agent (derives its Stellar account address); `400` for an invalid request body.                         |
| `PATCH`  | `/api/v1/agents/:id`          | `200`   | Update agent status; `400` for invalid input and `404` when the agent does not exist.                             |
| `DELETE` | `/api/v1/agents/:id`          | `204`   | Delete an agent; `404` when it does not exist.                                                                    |
| `POST`   | `/api/v1/payments`            | `201`   | Create a payment quote (USDC/XLM asset pair); `400` for an invalid request body.                                  |
| `GET`    | `/api/v1/payments/quotes/:id` | `200`   | Fetch a live quote; `404` when missing and `410` when expired.                                                    |
| `POST`   | `/api/v1/payments/execute`    | `200`   | Execute a quote; `400` when unconfirmed, `404` when missing, `409` when already executed, and `410` when expired. |

When API-key authentication is configured, agent routes may additionally return `401` for a missing key or `403` for an invalid key. API-wide middleware can also reject requests before route handling, including `429` when the shared rate-limit budget is exceeded.

All `/api/v1` responses send `Cache-Control: no-store` so dynamic agent and payment data is not cached by clients or shared proxies. The root route is a basic service metadata response and is kept outside this API cache policy.

## Response Envelope

Successful JSON responses use a shared envelope:

```json
{
  "success": true,
  "data": {}
}
```

Endpoints returning `204 No Content`, such as a successful agent delete, do not include a response body.

Error responses use the corresponding error envelope:

```json
{
  "success": false,
  "message": "Request validation failed",
  "code": "VALIDATION_ERROR",
  "details": {}
}
```

`message` is always the human-readable error description. `code` and `details` are optional contract fields: handlers can provide a stable machine-readable code and structured context such as validation field errors when available.

## Example API

Create a payment quote with `POST /api/v1/payments`:

```bash
curl -X POST http://localhost:4000/api/v1/payments \
  -H "Content-Type: application/json" \
  -d '{
    "sourceAsset": "USDC",
    "destinationAsset": "XLM",
    "sourceAmount": "25.00"
  }'
```

A successful request returns `201` with the quote under `data.quote`, including its id, source and destination amounts, fee, rate, expiration time, and status.

The module layout shows contributors how to structure backend features:

- route registration
- request validation with Zod
- typed controllers and responses
- service-layer business logic
- module-local TypeScript types

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
npm run check
```

## Project Structure

```text
src/
  common/       HTTP middleware, errors, request logging (URL/secret redaction)
  config/       Env, logger, rate limit, request-log filtering
  modules/
    agents/     AgentLily registry + deterministic Stellar account derivation
    health/     Liveness/readiness probes
    metrics/    Process metrics
    payments/   Quote/execute flow, Stellar address validation, stroop amounts
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

Every contribution is expected to pass the full pipeline:

```bash
# Run full local verification gate
npm run check

# Or run individual checks
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
- Deprecation of old versions follows a minimum 6-month notice period documented in the [changelog](./CHANGELOG.md) and release notes

### Adding a New API Version

1. Create `src/routes/v2/index.ts` with the new router
2. Mount it in `src/app.ts`: `app.use("/api/v2", apiV2Router)`
3. Keep `v1` routes unchanged for backward compatibility
4. Replace the placeholder [v1-to-v2 migration guide](./docs/migration/v1-to-v2.md) with concrete consumer instructions
5. Announce the deprecation timeline in the [changelog](./CHANGELOG.md)
