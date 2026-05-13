# pi-cicd Agent Operating Guide

## Extension Purpose

pi-cicd provides CI/CD pipeline integration, intelligent deployment strategies, and headless mode for Pi coding agents.

## Source Of Truth

1. `README.md` - Extension overview
2. `docs/HARNESS.md` - Operating model
3. `docs/FEATURE_INTAKE.md` - Intake process
4. `docs/product/` - Product contracts
5. `docs/stories/` - Story packets
6. `docs/TEST_MATRIX.md` - Proof status
7. `docs/decisions/` - Decision records

## Extension Capabilities

### Core Tools
- `ci_status` - Check CI/CD pipeline status
- `deploy_strategy` - Canary, blue-green, rolling deployments
- `release_notes` - Generate release notes
- `headless_mode` - Headless agent execution

### Commands
- `/ci-status` - Check pipeline status
- `/deploy` - Trigger deployment
- `/release` - Create release

## Validation Commands

```bash
npm test
npm run lint
npx tsc --noEmit
```
