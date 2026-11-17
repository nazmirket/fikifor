# Fikifor project guidance

Fikifor is a pnpm monorepo. `apps/web` owns Nuxt/Vue browser state. `apps/api`
owns Express, Socket.IO, Prisma, uploads and authentication.
`packages/contracts` owns shared schemas and events. PostgreSQL stores durable
state and Redis coordinates live rooms. Preserve API/socket contracts, tournament
concurrency, migration history and user data. Follow the
[deployment guide](deploy/README.md) for image publishing, digest verification,
database baselining and persistent-data recovery. Get separate authorization
before changing production or shared databases. Keep credentials and private
recovery records out of Git.

## Application checks

Use Node.js 24 and pnpm 10.33.0. Run the checks relevant to the change.

```sh
pnpm install --frozen-lockfile
pnpm db:build
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

For complete local integration and browser verification, start Podman and run:

```sh
pnpm exec playwright install chromium
pnpm verify:isolated
```

The isolated runner owns disposable PostgreSQL/Redis containers, loopback ports
and storage, applies migrations, runs tests/build/browser checks and cleans up
its own resources. Use an explicit, disposable local database ending in `_test`
as the test destination. Without `TEST_DATABASE_URL`, ordinary unit runs skip
integration suites.
`pnpm test:e2e` requires an explicit test destination and Redis and refuses to
reuse an existing application server. For browser changes, verify the affected
routes on the intended origin and exercise the relevant input modes. For bug
fixes, exercise a failure case that would catch an incorrect fix.

[CI](.github/workflows/ci.yml) runs application and browser checks with
integration services, builds the API, migration and web images, and verifies the
packaged Prisma client. Validate Compose edits with
`podman compose config --quiet`. Manage the local stack with `pnpm podman:up`,
`pnpm podman:logs` and `pnpm podman:down`. Report any checks that could not run
and why.
