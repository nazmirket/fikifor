# Fikifor project guidance

Mirket on Pi Durable is the sole agent host and effect authority for this
repository. Start new sessions with the installed, verified `bin/mirket` launcher
from this directory; do not start a second Durable owner while a project session
is active. This file owns project-specific guidance. Select only the relevant
installed Mirket skills and tools exposed to the active Pi host. For example,
`frontend`, `backend`, `database-migrations`, `infrastructure`, `test-design` and
`content-seo` cover this project's common boundaries. There is no project-owned
MCP or skill registration; do not infer availability from former Codex/Claude
registrations, install another agent or invoke an ambient agent executable.
Use only explicitly selected MCP tools and verified local executables. A tool
receipt does not verify its result. Keep agent state, credentials, grants,
conversations and recovery evidence out of commits. Do not change account-wide
configuration as part of project work.

Fikifor is a pnpm monorepo. `apps/web` owns Nuxt/Vue browser state; `apps/api`
owns Express, Socket.IO, Prisma, uploads and authentication;
`packages/contracts` owns shared schemas and events. PostgreSQL stores durable
state; Redis coordinates live rooms. Preserve API/socket contracts, tournament
concurrency, migration history and user data. `deploy/README.md` owns deployment
and persistent-data recovery.

Before changing code, inspect Git status, affected owners and consumers. Preserve
unrelated work and exercise a failure case that could expose a plausible wrong
fix. For browser work, check the selected browser route's actual origin and input
coverage; for external effects reconcile uncertain outcomes before retrying.
Delegation is optional, with disjoint ownership and lead verification. Do not
change production or shared databases without separate authority. Commits and
pushes require user authorization.

## Application checks

Use Node.js 24 and pnpm 10.33.0. Run relevant gates without lowering them:

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
its own resources. Test destinations must be explicit local databases ending in
`_test`; do not point tests at shared data. Without `TEST_DATABASE_URL`, ordinary
unit runs skip integration suites. `pnpm test:e2e` requires an explicit test
destination and Redis and refuses to reuse an existing application server. CI
retains integration services, application gates, browser tests and
API/migration/web image builds with packaged Prisma verification. Validate
Compose edits with `podman compose config --quiet`. Local stack commands are
`pnpm podman:up`, `pnpm podman:logs`, `pnpm podman:down`; consult deployment
instructions for production-specific checks and recovery. Report gates that
could not run and why.
