# Fikifor Docker deployment

The root `docker-compose.yml` builds and starts the complete stack locally. This
directory contains the production deployment contract, which runs prebuilt API
and web images without a process manager.

## Build images

From the repository root:

```bash
docker build --file apps/api/Dockerfile --tag fikifor-api:latest .
docker build --file apps/web/Dockerfile --tag fikifor-web:latest .
```

For remote deployments, push immutable version tags or digest-pinned images and
set `FIKIFOR_API_IMAGE` and `FIKIFOR_WEB_IMAGE` accordingly.

## Configure and start

```bash
cp deploy/.env.example deploy/.env
# Replace every placeholder in deploy/.env.

docker compose --env-file deploy/.env --file deploy/compose.yml config --quiet
docker compose --env-file deploy/.env --file deploy/compose.yml up -d
docker compose --env-file deploy/.env --file deploy/compose.yml ps
```

The deployment runs six services:

- PostgreSQL
- Redis for cross-instance Socket.IO rooms and presence
- a one-shot Prisma migration job
- the Express API
- the Socket.IO server
- the Nuxt web application

API and Socket.IO intentionally use separate containers and direct Node
processes. Docker owns restart policy, health checks, logs, and process
lifecycle; no in-container process manager is used.

Set `CORS_ORIGINS` to a comma-separated list of browser origins. Keep
`JWT_SECRET` random and at least 32 characters, and review the image-download
size and timeout limits before deployment.

All application ports bind to `127.0.0.1`. Put a TLS reverse proxy in front of
them and route `/api` to port 3001, `/socket.io` to port 3002, and all other
requests to port 3000.

## Existing databases

The included migration is an initial migration for new installations. Before
switching an existing database to `prisma migrate deploy`, take a verified
backup and baseline the migration once:

```bash
docker compose --env-file deploy/.env --file deploy/compose.yml run --rm \
  migrate /app/node_modules/.bin/prisma migrate resolve \
  --applied 20260729000000_initial
```

Do not baseline a new or empty database. The normal migration container creates
the schema automatically.

## Persistent data

Keep both named volumes during upgrades:

- `postgres_data` stores database data.
- `uploads` stores uploaded quiz images.

Back up the two volumes together so database image records remain synchronized
with uploaded files.

Redis is intentionally ephemeral: it carries Socket.IO room broadcasts and
presence coordination, not durable application state.
