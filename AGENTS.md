# Fikifor repository workflow

This repository uses Mirket for agent coordination and reviewed project
expertise. Before substantive work, verify the local project setup with:

```bash
mirket project doctor --project .
```

Use the selected skills under `.agents/skills/` for Codex and `.claude/skills/`
for Claude. Keep durable task decisions and verification evidence in Mirket's
task record; do not add a competing agent instruction or skill system.

Use Podman for local containers:

```bash
pnpm podman:up
pnpm podman:down
pnpm podman:logs
```

Before delivery, run the applicable workspace checks (`pnpm lint`,
`pnpm typecheck`, `pnpm test`, `pnpm build`) and validate Compose with
`podman compose config --quiet`. Keep credentials in environment files and
preserve unrelated working-tree changes.
