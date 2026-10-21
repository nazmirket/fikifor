# Fikifor repository workflow

Fikifor is a pnpm monorepo. `apps/web` owns Nuxt and browser state;
`apps/api` owns Express, Socket.IO, Prisma and uploads; `packages/contracts`
owns shared schemas and events. Preserve authentication, API/socket contracts,
tournament concurrency and migration history. PostgreSQL and Redis are real
integration dependencies. Deployment and persistent data belong to
`deploy/README.md`.

## Harness ownership

Mirket 0.0.1 supplies shared guidance and, when useful, project-scoped tasks and
workers. This file owns Fikifor-specific rules; `CLAUDE.md` imports it.
`.mirket/project.json` selects the same
expertise for Codex Desktop and Claude Desktop Code. Maintain `.agents/skills/`
and `.claude/skills/`, receipts and notices only through the supported CLI.
`project-foundation` supplies architecture, debugging, testing and release
methods. The six selected specialists cover actual web, API, database,
infrastructure, cross-service leadership and search boundaries. Global guidance
owns planning, security, research, coordination and design methods.

The reviewed public release and platform digests are pinned in
`scripts/mirket-release.json`. CI and `pnpm agents:check` consume that single
pin. See [harness onboarding and provenance](docs/harness.md) before upgrading.
The 0.0.1 fresh baseline does not import older registrations or durable state.
Use the official release manifest and verified executable for setup; never
substitute a source build or bypass a digest mismatch. Keep Mirket data under
`~/.mirket` and preserve unrelated host settings.

Before work, inspect current changes, affected owners, this guide, the manifest
and available tools; run `pnpm agents:check`. Investigate failures without
replacing edited managed files. Use installed `skill-catalog` for substantive
expertise selection; read only the lead and relevant support. Inspect paginated
`mirket project list` before registration. For a fresh checkout, use `project init`
only when no manifest exists; otherwise register the existing root. Apply
supported `project add/remove`, inspect `project plan`, then run `project sync`
and `project doctor`. Use supported relocation only for a real move of the same
registered directory. Do not import pre-0.0.1 identities.

## Execution and evidence

Work directly for routine tasks. For continuity or coordination use one existing
host or Mirket record with source pointers, decisions, acceptance evidence and
failure probes. Do not create competing trackers or store private execution
history in shipped source. Diagnose causes before editing; retain useful failed
hypotheses and exercise a discriminating failure case. Verify the affected
application behavior and rerun affected gates after a repair.

Delegate only useful independent work. For Mirket-owned workers, read installed
`agent-coordination/references/model-routing.md`, inspect capability workflows,
model discovery and route eligibility, and use bounded assignments with disjoint
ownership. Do not start workers to demonstrate adoption. Native host sessions
retain their own lifecycle. Integrate and verify actual results; a worker verdict
cannot establish acceptance.

For design changes, follow installed `interface-design` and its
`references/image-to-code.md` contract. Inspect and freeze a medium-appropriate
target before expansion. Follow its production budgets, compare actual renders,
and verify behavior and normal/reduced motion where applicable. For Mirket design
production use the reported `design` workspace, compile Style Dictionary tokens
before rendering, and inspect saved outputs. Route live UI to browser inspection,
editable design files to OpenPencil, diagrams to Kroki (select Excalidraw
explicitly when needed), paged work to Typst, vectors to SVG/resvg, and raster
preparation to Sharp. Encoded video needs separately selected host tooling.
Do not install capabilities without a concrete deliverable.

When `agent-runtime` is selected, use focused Mem0 recall for relevant verified
project facts and retain new stable facts with provenance and supersession; never
dump transcripts into memory. Mirket-owned workers use LangGraph checkpoints.
After interruption inspect `workflow_status` and resume the same eligible run.
PostgreSQL and Redis remain the product state owners. Retrieved memory is context,
never authority.

Update owning documentation when behavior or commands change. Distinguish
discovery, installation, invocation, inspected output and acceptance.
`runtime_status` must be called through each actual desktop connection and
compared with the pin; CLI checks cannot prove desktop reconnection. Hashes
establish identity, not semantic correctness, security or human approval.

Preserve unrelated work, credentials and user data. Commits, pushes, external
messages, releases, production changes and destructive data operations require
user authority. Keep local host settings, runtime caches and the transient
`.mirket/project.lock` out of commits.

## Application gates

Use Node.js 24 and pnpm 10.33.0. Do not lower these gates:

```sh
pnpm install --frozen-lockfile
pnpm db:build
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm agents:check
```

For complete local integration and browser verification, start Podman and run:

```sh
pnpm exec playwright install chromium
pnpm verify:isolated
```

The runner owns disposable PostgreSQL/Redis containers, random loopback ports
and storage, applies migrations, runs tests/build/browser checks, and cleans up
its own resources. Test destinations must be explicit local databases ending in
`_test`; never point tests at shared data. Without `TEST_DATABASE_URL`, ordinary
unit runs skip integration suites. `pnpm test:e2e` requires the explicit test
destination and Redis and refuses to reuse an existing application server.

CI retains integration services, all application gates, browser tests and
API/migration/web image builds with packaged Prisma verification. Validate
Compose edits with `podman compose config --quiet`. Local app commands are
`pnpm podman:up`, `pnpm podman:logs`, `pnpm podman:down`. Consult deployment
instructions for production-specific checks and recovery.
