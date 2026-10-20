# Mirket adoption and maintenance

Fikifor adopts [Mirket 1.0.11](https://github.com/codemirket/harness/releases/tag/mirket-v1.0.11),
published 2026-10-20T07:01:43Z. `scripts/mirket-release.json` is the release
identity owner: public asset URLs and SHA-256 values, release metadata digest,
and source/catalog fingerprints reported by the digest-verified public binary.
The source fingerprint is embedded build identity, not an independent source audit.
CI downloads the pinned Linux asset and verifies its bytes before executing it.
The local harness gate checks platform bytes, source, catalog and process match,
then exercises both hosts' real missing/tampered-skill rejection.
It also checks a clean CI home: a standalone CLI can verify release identity
without a desktop installation. This never establishes desktop activation;
connected-client verification still requires the installed-process match.

## Remaining activation gap

As of 2026-10-20, the actual Codex connection was verified against the release
pin. **Claude Desktop's live Mirket connection has not been observed.** Its
configured executable matches the release, but that does not prove that the
running desktop session uses it. Complete adoption remains pending this check;
passing CI does not close the gap.

In the intended Claude Desktop session, invoke Mirket `runtime_status` and
compare its executable, source and catalog fingerprints with
`scripts/mirket-release.json`. Require `installed_binary.matches_process: true`;
if stale, reconnect/restart that client's Mirket connection and repeat. Retain
the observation in the existing migration record before marking adoption complete.

## Onboarding

Install the platform CLI from the pinned public release using Mirket's supported
installation procedure. Check its asset digest against the pin, then run:

```sh
mirket info --json
mirket setup --target all --yes
mirket project init --project "$PWD" --target all
mirket project plan --project "$PWD"
mirket project sync --project "$PWD" --prune
mirket project doctor --project "$PWD"
pnpm agents:check
```

Existing registrations must be reused. Inspect `mirket project list --json` and
follow pagination before registering. Do not copy a registration or erase task
history to disguise relocation; inspect `mirket project relocate --help` for an
actual rename of the original directory.

The manifest keeps `project-foundation` and six specialists: frontend, backend,
database, infrastructure, technical leadership and search visibility. Each maps
to a present product boundary. Global skills supply shared methods. Select the
lead per task rather than loading every installed skill.

## Upgrade and verify

```sh
mirket update --check --json
# Only if the chosen public release differs from installed content:
mirket update --json
mirket info --json
mirket doctor --json
mirket catalog check
mirket project plan --project "$PWD"
mirket project sync --project "$PWD" --prune
mirket project doctor --project "$PWD"
```

Resolve stable, non-draft releases by publication time from the official release
listing. Verify the release metadata digest and target asset SHA-256. Review
and update the single pin only after provenance is verified. Never accept a
matching version string in place of matching content. Review synchronization
changes and preserve any locally edited managed guidance instead of overwriting
it to make the doctor pass.

In **each desktop client**, call the connected Mirket `runtime_status`. Compare
`process.version`, `process.target`, `process.executable_sha256`,
`process.source_sha256` and `catalog.sha256` with the pin, and require
`installed_binary.matches_process: true`. Also check the terminal executable
and the executable referenced in client configuration. `mirket doctor` starts a
separate check process; it cannot attest to an already running desktop session.
After a stale process is found, reconnect/restart that client's MCP connection
and repeat the call. Verification in Codex does not verify Claude.

## Package and design boundaries

Inspect `mirket package status`, `package show` and current help before using a
package. `package probe design --schemas --json` verifies initialization and
filtered discovery only. Invoke a relevant tool and inspect its saved output
before claiming successful production. Runtime identity returned by the actual
design call must match the installed recipe/modules. Penpot is a separate live
service; its disabled state does not imply editable-canvas readiness.

For a concrete design deliverable use installed `interface-design` guidance,
freeze its target, compile canonical tokens through Style Dictionary and verify
the actual application with Playwright. The current Vue/Tailwind source and
brand assets remain authoritative; this migration adds no second token system,
editor document or media pipeline. Paged, video and editable-canvas workflows
are selected only when those artifacts are requested.

The existing `brand.svg` contains an embedded PNG. The design package's vector
renderer rejects embedded image references; do not strip that image to force a
pass. Preserve the asset and choose a compatible raster/browser workflow for
inspection, or migrate the artwork explicitly when a vector deliverable is needed.

Mem0/LangGraph are optional harness capabilities, not application dependencies.
Fikifor's PostgreSQL/Redis and existing Mirket task records already own durable
product state and migration continuity. Do not duplicate them in memory. When
memory/workers are needed, preserve project isolation and inspect the selected
runtime, recovery and retention contracts first.

## Recovery and handoff

If an upgrade fails, retain the pin, original managed changes and error evidence.
Use supported CLI diagnostics/update/setup; do not manually replace managed
copies or invent a fallback installer. Review the previous Git diff before
reverting project-owned changes. Recheck actual client identity after recovery.
Application recovery is documented in `deploy/README.md`; a harness update
never authorizes production migrations or data restoration.

Keep task execution logs and activation observations in the existing Mirket task
record and ignored local evidence, not this guide. A handoff must identify the
revision, commands, failures, isolated destinations, actual client connection,
and any unverified platform or production path. Leave incomplete tasks open
when a required client cannot be observed.
