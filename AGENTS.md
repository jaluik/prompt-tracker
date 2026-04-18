# AGENTS.md

This document is for coding agents working in the `prompt-gateway` repository. Read it before making changes.

## Project Purpose

`prompt-gateway` is a local wrapper around Claude Code.

The primary user flow is:

```bash
npx prompt-gateway claude
```

The tool starts a local gateway, points the launched Claude Code process at that gateway, forwards traffic to the real Anthropic-compatible upstream, and stores captured `/v1/messages` requests locally for inspection.

When changing product behavior or docs, preserve that mental model:

- The main entrypoint is `prompt-gateway claude`
- User-facing docs should teach the wrapper flow first
- Manual gateway operation is implementation detail or maintenance context, not the main user story

## Audience Split

Keep these files clearly separated by audience:

- `README.md`: user-facing documentation
- `DEVELOPING.md`: maintainer-facing development, release, and workflow notes
- `AGENTS.md`: agent-facing repo conventions and context

Do not move maintainer workflows back into `README.md` unless explicitly requested.
Do not turn `README.md` into a development setup guide.

## Repository Map

Core runtime code lives in `src/`:

- `src/cli.ts`: CLI entrypoint, argument parsing, `claude` wrapper mode, local server startup
- `src/server.ts`: HTTP server, `/v1/messages` proxying, capture APIs, static web serving
- `src/capture.ts`: request capture shaping, redaction, local artifact writing, capture listing/loading
- `src/upstream.ts`: upstream resolution from flags and environment variables
- `src/render.ts`: HTML rendering for saved captures and web fallback
- `src/types.ts`: shared types
- `src/index.ts`: package exports

Web UI lives in `web/`:

- `web/src/App.tsx`: capture browser UI
- `web/src/main.tsx`: frontend bootstrap
- `web/src/styles.css`: styles
- `web/index.html`: Vite entry HTML

Tests live in `test/`:

- `test/cli.test.ts`: wrapper behavior
- `test/server.test.ts`: proxying, capture persistence, browser endpoints
- `test/capture.test.ts`: capture shaping and artifact writing
- `test/upstream.test.ts`: upstream resolution
- `test/harness.ts`, `test/helpers.ts`, `test/run-tests.ts`: custom test runner and utilities

Build/test scripts live in `scripts/`:

- `scripts/test.mjs`: compile tests and run them
- `scripts/test-node16-compat.mjs`: verify runtime compatibility under Node 16
- `scripts/postbuild.mjs`: post-process build output

CI lives in `.github/workflows/ci-cd.yml`.

## Runtime and Tooling Constraints

There are two different Node expectations in this repo. Keep them distinct.

- Published package runtime target: Node `>=16`
- Repository development toolchain target: Node `18+`

Why this matters:

- The CLI/runtime path is expected to work on Node 16
- The repo uses tooling such as Vite and current pnpm that are not the source-development baseline for Node 16

When making changes:

- Avoid introducing Node 18+ runtime APIs into the published CLI/server path unless package support is intentionally being raised
- If a change affects runtime behavior, think about Node 16 compatibility
- If a change only affects local development or frontend tooling, Node 18+ assumptions are acceptable

## Commands

Main repo commands:

- `pnpm check`
- `pnpm test`
- `pnpm test:node16-compat`
- `pnpm build`
- `pnpm pack:dry`

Use these expectations:

- Run `pnpm test` for behavior changes
- Run `pnpm test:node16-compat` when changing runtime code, package compatibility, or Node-version claims
- Run `pnpm build` when changing shipped code paths or web assets

## CI and Release Model

CI currently verifies:

- Node 18/20/24 repository test runs
- separate Node 16 runtime compatibility coverage

Release behavior:

- pushes to `master` run CI
- tags matching `v*` trigger release
- release checks package version against the pushed tag
- publishing uses npm Trusted Publishing

If you modify release or compatibility behavior, update:

- `package.json`
- `.github/workflows/ci-cd.yml`
- `README.md`
- `DEVELOPING.md`

Keep those four aligned.

## Documentation Rules

When editing `README.md`:

- write for end users, not maintainers
- lead with `prompt-gateway claude`
- explain what users get, where captures go, and how to inspect them
- keep implementation details secondary

When editing `DEVELOPING.md`:

- keep maintainer commands, release flow, CI, and local development notes there

When agent behavior changes user-facing claims, update docs in the same change when practical.

## Code Change Guidance

### CLI and Product Behavior

Preserve the wrapped-Claude flow unless explicitly changing product direction.

Important current behavior:

- `prompt-gateway claude` launches Claude Code and injects local `ANTHROPIC_BASE_URL`
- upstream config may come from CLI flags or environment variables
- wrapper mode preserves existing Anthropic-compatible upstream settings
- `CLAUDE_CODE_USE_BEDROCK`, `CLAUDE_CODE_USE_VERTEX`, and `CLAUDE_CODE_USE_FOUNDRY` are not currently supported passthrough flows

Do not document unsupported provider flows as if they already work.

### Capture Semantics

Current capture behavior includes:

- storing raw request bodies
- redacting common sensitive headers
- deriving summary fields such as model, max tokens, stream flag, and prompt preview
- writing JSON and optional HTML artifacts under the configured output root

Be careful when changing:

- capture schema
- redaction rules
- output directory structure
- browser API payloads

Those changes can affect existing users and tests.

### Frontend

The web app is a local capture browser, not a marketing site.

When editing `web/src/*`:

- keep the UI focused on browsing and inspecting captured requests
- preserve compatibility with the server APIs in `src/server.ts`
- avoid introducing frontend-only assumptions that require backend changes unless both are updated together

## Testing Expectations

This repo uses a lightweight custom test harness instead of a full external test runner.

When changing:

- CLI behavior: update `test/cli.test.ts`
- proxy behavior or API endpoints: update `test/server.test.ts`
- capture shape/redaction/output behavior: update `test/capture.test.ts`
- upstream resolution logic: update `test/upstream.test.ts`

Prefer keeping tests close to the behavior that changed.

## Commit and Change Hygiene

This repo uses:

- `lint-staged` with Biome on staged files
- `commitlint` with Conventional Commits

Before committing:

- stage only the intended files
- avoid bundling unrelated frontend, docs, and runtime changes unless the user asked for a single combined commit
- do not rewrite user edits you did not intend to change

If the worktree already contains unrelated edits, be careful not to fold them into your change accidentally.

## Good Defaults for Agents

When in doubt:

- inspect code before rewriting docs or behavior
- prefer small, coherent changes
- keep user docs simple and task-oriented
- keep maintainer details out of user docs
- verify Node 16 claims with `pnpm test:node16-compat`

If you make a change that alters how users should run the tool, update `README.md` in the same turn.
