# Mirket adoption and maintenance

Fikifor uses [Mirket 0.0.1](https://github.com/codemirket/harness/releases/tag/mirket-v0.0.1),
published 2026-10-21T14:34:24Z. This is a fresh baseline: registrations,
Mem0 facts and worker checkpoints from earlier releases are not imported.
`scripts/mirket-release.json` records the official release manifest digest,
platform asset digests, and source/catalog fingerprints reported by the verified
binary. Hashes establish transfer identity, not publisher authentication or
application correctness.

## Owners

| Surface                              | Owner                                                                                                                      |
| ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| Fikifor boundaries and quality gates | `AGENTS.md`                                                                                                                |
| Claude entry                         | `CLAUDE.md`, which imports `AGENTS.md`                                                                                     |
| Shared selection                     | `.mirket/project.json`: `project-foundation` plus web, API, database, infrastructure, cross-service and search specialists |
| Managed guidance                     | `.agents/skills/` and `.claude/skills/`, maintained by Mirket CLI                                                          |
| Application behavior and deployment  | `apps/`, `packages/`, `README.MD` and `deploy/README.md`                                                                   |
| Harness gate                         | `pnpm agents:check`, backed by `.github/workflows/harness.yml`                                                             |
| Local runtime readiness              | `pnpm agents:runtime`: installed CLI identity and registered project access                                                |
| Integration and browser gate         | `.github/workflows/ci.yml` and `pnpm verify:isolated`                                                                      |

`project-foundation` supplies architecture review, debugging, test design and
release operations. The six specialists match present owners: Nuxt, Express and
Socket.IO, Prisma/PostgreSQL/Redis, Podman/deployment, cross-service contracts,
and public sitemap/robots behavior. Read only guidance relevant to the task.
There is no project-owned MCP launcher or second agent framework. Host MCP
configuration stays with the desktop clients; Mirket-owned runtime data stays
under `~/.mirket`, not in this repository.

## Install and select

Follow the [official fresh-install guide](https://github.com/codemirket/harness/blob/main/docs/agent-installation.md).
Verify the chosen 0.0.1 asset against the release manifest before execution.
The managed executable is `~/.mirket/bin/mirket`; setup owns installed skills
and host MCP definitions. The supported targets here are Codex and Claude.
Preserve existing optional package selections when repeating setup.

Inspect all pages of `mirket project list --json` before registration. For a new
project without `.mirket/project.json`, run:

```sh
mirket project init --project "$PWD" --target all
mirket project add --project "$PWD" --profile project-foundation
for skill in infrastructure-engineering frontend-engineering backend-engineering \
  database-systems technical-leadership search-visibility; do
  mirket project add --project "$PWD" --skill "$skill"
done
```

A checkout already containing this manifest needs
`mirket project register --project "$PWD"` instead. Never reuse a pre-0.0.1
project identity.

After a selection change, run:

```sh
mirket project plan --project "$PWD"
mirket project sync --project "$PWD"
mirket project doctor --project "$PWD"
pnpm agents:check
```

Inspect the plan and exact file contents before resolving a conflict. Use
`--prune` only after confirming the removed managed copies have no remaining
selection or unique project rule. Keep `.mirket/project.lock` out of commits.

## Verify the actual boundary

Run `mirket doctor --json` and `mirket info --json` on the managed executable.
Run `pnpm agents:runtime` after installation changes or task/memory failures to
check local identity and registered project access. It can optionally compare a
saved `runtime_status` JSON response with the pin using `--connection FILE`;
that file is not a live connection check.
In each available desktop client, invoke its Mirket `catalog_search`, read a
relevant embedded skill, then call `runtime_status`. Compare the live process
version, target, executable, source and catalog fingerprints with the pin and
CLI info. Require `installed_binary.matches_process: true`. A CLI doctor or CI
run cannot prove a desktop connection has reloaded. Record Codex and Claude
observations separately; a missing client remains unverified.

CI downloads the pinned Linux executable, verifies its bytes, runs
`pnpm agents:check` and exercises both hosts' missing/modified managed-skill
failure probes. Its clean temporary Mirket home checks standalone identity
without claiming desktop activation. The application CI keeps database, unit,
build, browser, migration and image checks. Do not reduce these gates to make a
harness migration pass.

The selected `agent-runtime` and `design` packages are optional host capabilities,
not product dependencies. For recurring project work, use focused Mem0 recall
and retain only verified stable facts with provenance and supersession. Mirket
workers use LangGraph checkpoints; native host sessions have their own lifecycle.
After interruption, inspect `workflow_status` before resuming a worker. Do not
copy old state or replay an uncertain effect.

For a concrete visual deliverable, use the installed `interface-design` guidance.
Freeze a target, compile Style Dictionary tokens before rendering, and inspect
saved output. Use browser inspection for live UI, OpenPencil for compatible
editable `.fig`/`.pen` files, Kroki for diagrams with Excalidraw explicitly
selected when needed, Typst for paged work, SVG/resvg for vectors and Sharp for
raster work. The existing `apps/web/public/brand.pxd` is a different ZIP-based
project asset; preserve it rather than treating it as an OpenPencil file.
`brand.svg` embeds a PNG, so choose a renderer compatible with that content.
Design package readiness alone does not prove a useful project-scoped artifact.

Keep historical observations labeled as historical. A failed setup or drift
check calls for supported Mirket diagnostics and inspection of the original
files. Application recovery remains in `deploy/README.md`.
