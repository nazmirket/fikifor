FROM node:24-alpine@sha256:44fce696f38ba8c987c4db89954051000bbd05ffd8d8659ba15ed4a8602e937f AS build

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV NODE_ENV=development

WORKDIR /app

RUN apk add --no-cache openssl \
  && corepack enable \
  && corepack prepare pnpm@10.33.0 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY apps/api/package.json ./apps/api/package.json
COPY apps/web/package.json ./apps/web/package.json
COPY packages/contracts ./packages/contracts

RUN pnpm install --frozen-lockfile

COPY apps/api ./apps/api

RUN pnpm --filter @fikifor/contracts build \
  && pnpm --filter @fikifor/api build

FROM build AS production-dependencies

RUN pnpm --filter @fikifor/api deploy --prod --legacy /prod/api \
  && build_prisma="$(find /app/node_modules/.pnpm -path '*/node_modules/.prisma/client' -type d -print -quit)" \
  && prod_client="$(find /prod/api/node_modules/.pnpm -path '*/node_modules/@prisma/client' -type d -print -quit)" \
  && test -n "$build_prisma" \
  && test -n "$prod_client" \
  && prod_node_modules="$(dirname "$(dirname "$prod_client")")" \
  && mkdir -p "$prod_node_modules/.prisma" \
  && cp -R "$build_prisma" "$prod_node_modules/.prisma/"

FROM node:24-alpine@sha256:44fce696f38ba8c987c4db89954051000bbd05ffd8d8659ba15ed4a8602e937f AS migration

ENV NODE_ENV=production

WORKDIR /app

RUN apk add --no-cache openssl

COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=build --chown=node:node /app/apps/api/package.json ./apps/api/package.json
COPY --from=build --chown=node:node /app/apps/api/prisma ./apps/api/prisma

USER node
WORKDIR /app/apps/api

CMD ["/app/node_modules/.bin/prisma", "migrate", "deploy"]

FROM node:24-alpine@sha256:44fce696f38ba8c987c4db89954051000bbd05ffd8d8659ba15ed4a8602e937f AS runtime

ENV NODE_ENV=production

WORKDIR /app

RUN apk add --no-cache openssl

COPY --from=production-dependencies --chown=node:node /prod/api/node_modules ./node_modules
COPY --from=production-dependencies --chown=node:node /prod/api/package.json ./apps/api/package.json
COPY --from=build --chown=node:node /app/apps/api/build ./apps/api/build
COPY --from=build --chown=node:node /app/apps/api/prisma ./apps/api/prisma
COPY --from=build --chown=node:node /app/packages/contracts/package.json ./packages/contracts/package.json
COPY --from=build --chown=node:node /app/packages/contracts/dist ./packages/contracts/dist

RUN mkdir -p /app/apps/api/files && chown -R node:node /app/apps/api/files

USER node
WORKDIR /app/apps/api

EXPOSE 3001 3002

CMD ["node", "build/server.js"]
