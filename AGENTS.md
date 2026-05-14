# pi-cicd Agent Operating Guide

## Extension Purpose

pi-cicd provides CI/CD pipeline monitoring, canary deployment, and landing queue management for Pi coding agents.

## Source Of Truth

1. `README.md` - Extension overview
2. `skills/intelligent-deploy/SKILL.md` - Deployment skill
3. `docs/HARNESS.md` - Operating model
4. `docs/FEATURE_INTAKE.md` - Intake process
5. `docs/product/` - Product contracts
6. `docs/stories/` - Story packets
7. `docs/TEST_MATRIX.md` - Proof status
8. `docs/decisions/` - Decision records

## Extension Capabilities

### Commands
- `/ci` - CI status command

### Skills
- `skills/intelligent-deploy/SKILL.md` - Canary deployment, landing queues, CI monitoring

## When to Use This Extension

- Deploying to production
- Monitoring CI/CD pipelines
- Canary releases
- Landing queue management

## Validation Commands

```bash
npm test
npm run lint
npx tsc --noEmit
```
