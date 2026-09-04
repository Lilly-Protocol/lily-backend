FROM node:22-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package*.json ./
RUN npm ci

FROM deps AS build
COPY tsconfig.json ./
COPY tsconfig.build.json ./
COPY eslint.config.mjs ./
COPY src ./src
RUN npm run build

FROM node:22-alpine AS production
WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=build --chown=node:node /app/dist ./dist
COPY --chown=node:node .env.example ./.env.example

EXPOSE 4000

# Health probe uses Node's built-in fetch (alpine has no curl/wget).
# PORT env falls back to 4000, matching the EXPOSE above.
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "const p=process.env.PORT||4000;fetch('http://127.0.0.1:'+p+'/api/v1/health/live').then(r=>r.ok?process.exit(0):process.exit(1)).catch(()=>process.exit(1))"

USER node

CMD ["node", "dist/server.js"]
