# pi-cicd API Reference

## Deployment Workflow

```typescript
import { createDeploymentWorkflow } from 'pi-cicd';

const workflow = createDeploymentWorkflow({
  name: 'my-deploy',
  stages: ['build', 'test', 'staging', 'production'],
  canary: {
    initial: 10,
    increment: 20,
    interval: 60000,
  },
});

await workflow.execute();
```

## Canary Deployment

```typescript
import { CanaryDeployment } from 'pi-cicd';

const canary = new CanaryDeployment({
  initialPercent: 10,
  maxPercent: 100,
  increment: 20,
  checkInterval: 60000,
});

await canary.start();
await canary.promote();
await canary.complete();
```

## Landing Queue

```typescript
import { LandingQueue } from 'pi-cicd';

const queue = new LandingQueue({
  maxConcurrent: 2,
  backoffMs: 30000,
});

await queue.enqueue(deployment);
```

## Test Runner

```typescript
import { TestRunner } from 'pi-cicd';

const runner = new TestRunner();
const result = await runner.run({
  framework: 'vitest',
  patterns: ['test/**/*.test.ts'],
});
```
