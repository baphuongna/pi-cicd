# pi-ci Development Notes

Pi extension for headless CI mode.

## Rules

- Keep `index.ts` minimal; re-export from `src/` modules.
- Avoid `any`; use `unknown` plus validation.
- After code changes, run `npm test` from `pi-ci/` unless explicitly told not to.

## Important commands

```bash
npm test
npm run typecheck
```

## Important paths

- `index.ts` — extension entry point
- `src/headless/` — core headless mode (exit codes, answers, idle, JSONL, orchestrator)
- `src/ci/` — CI pipeline, PR creation, test runner, reports
- `src/tools/` — /ci status command
- `src/config.ts` — configuration loading
- `test/unit/` — unit tests
