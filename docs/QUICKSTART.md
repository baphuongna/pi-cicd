# Quick Start - pi-cicd

## Installation

```bash
npm install pi-cicd
```

## Basic Usage

### Deploy

```bash
/deploy production
```

### Canary Release

```bash
/canary 10
```

### Rollback

```bash
/rollback
```

### Create PR

```bash
/pr feature
```

## Deployment Workflow

```typescript
import { createDeploymentWorkflow } from 'pi-cicd';

const workflow = createDeploymentWorkflow({
  name: 'my-app',
  stages: ['build', 'test', 'staging', 'production'],
  canary: { initial: 10, increment: 20, interval: 60000 },
});

await workflow.execute();
```

## Next Steps

- Read [API.md](API.md) for full API reference
- Check [SPEC.md](../SPEC.md) for feature details
